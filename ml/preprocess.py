import pandas as pd
import numpy as np
import re
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup
from datetime import date, datetime
import time
from functools import lru_cache
import dns.resolver
import tldextract
import warnings
from urllib3.exceptions import InsecureRequestWarning
import concurrent.futures
from typing import Optional, Dict, Union, List

# Suppress SSL warnings
warnings.filterwarnings('ignore', category=InsecureRequestWarning)
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Constants
PHISHING_KEYWORDS = ["login", "verify", "secure", "account", "banking", "confirm", "password", "pay"]
SUSPICIOUS_TLDS = ["tk", "ml", "ga", "cf", "gq", "xyz", "work", "party", "date", "wang", "faith"]
SHORTENING_SERVICES = [
    'bit.ly', 'goo.gl', 'shorte.st', 'go2l.ink', 'x.co', 'ow.ly', 't.co', 'tinyurl',
    'tr.im', 'is.gd', 'cli.gs', 'yfrog.com', 'migre.me', 'ff.im', 'tiny.cc', 'url4.eu',
    'twit.ac', 'su.pr', 'twurl.nl', 'snipurl.com', 'short.to', 'BudURL.com', 'ping.fm'
]

def shannon_entropy(s: str) -> float:
    if not s:
        return 0
    probabilities = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum(p * np.log2(p) for p in probabilities if p > 0)

def check_dns_record(domain: str) -> bool:
    try:
        for record_type in ['A', 'MX', 'NS']:
            try:
                dns.resolver.resolve(domain, record_type)
                return True
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN,
                    dns.resolver.NoNameservers, dns.exception.Timeout):
                continue
        return False
    except Exception:
        return False

@lru_cache(maxsize=1000)
def get_whois_info(domain: str) -> Optional[dict]:
    try:
        extracted = tldextract.extract(domain)
        if not extracted.domain or not extracted.suffix:
            return None
        base_domain = f"{extracted.domain}.{extracted.suffix}"
        w = whois.whois(base_domain)
        return w if (w.domain_name or w.creation_date or w.expiration_date) else None
    except Exception:
        return None

def parse_date_safe(date_field):
    """Safely parse a WHOIS date field, handling lists and single datetime objects."""
    if isinstance(date_field, list):
        return date_field[0] if date_field else None
    if isinstance(date_field, datetime):
        return date_field
    return None

def extract_features(url: str) -> Dict[str, Union[int, float]]:
    features = {}
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc if parsed.netloc else url
        path = parsed.path
        extracted = tldextract.extract(url)
        domain = extracted.domain
        suffix = extracted.suffix

        # WHOIS info
        whois_response = get_whois_info(f"{domain}.{suffix}")
        creation_date = parse_date_safe(whois_response.creation_date) if whois_response else None
        expiration_date = parse_date_safe(whois_response.expiration_date) if whois_response else None

        # Fetch webpage content
        try:
            response = requests.get(url, timeout=5, verify=False)
            soup = BeautifulSoup(response.text, 'html.parser')
        except:
            response = None
            soup = None

        # Feature extraction
        features["using_ip"] = int(bool(re.match(r'^\d{1,3}(\.\d{1,3}){3}$', netloc)))
        features["url_length"] = 1 if len(url) < 54 else (0 if len(url) <= 75 else -1)
        features["shortened_url"] = -1 if any(service in url.lower() for service in SHORTENING_SERVICES) else 1
        features["at_symbol"] = -1 if '@' in url else 1
        features["double_slash_redirect"] = -1 if url[8:].find('//') > 0 else 1
        features["prefix_suffix"] = -1 if '-' in netloc else 1
        features["sub_domains"] = 1 if netloc.count('.') == 1 else (0 if netloc.count('.') == 2 else -1)
        features["https"] = 1 if parsed.scheme == 'https' else -1
        features["dns_record"] = 1 if check_dns_record(f"{domain}.{suffix}") else -1
        features["suspicious_tld"] = -1 if suffix in SUSPICIOUS_TLDS else 1
        features["entropy"] = shannon_entropy(domain) if domain else 0

        # Domain registration length
        if creation_date and expiration_date:
            reg_length = (expiration_date - creation_date).days
            features["domain_registration_length"] = 1 if reg_length > 365 else -1
        else:
            features["domain_registration_length"] = -1

        features["favicon"] = 1 if soup and soup.find('link', rel='icon') else -1
        features["non_standard_port"] = -1 if parsed.port and str(parsed.port) not in ['80', '443', ''] else 1
        features["https_domain"] = -1 if 'https' in domain or 'http' in domain else 1

        # Request URL
        if soup:
            external_objects = 0
            total_objects = 0
            for img in soup.find_all('img', src=True):
                total_objects += 1
                if netloc not in img['src']:
                    external_objects += 1
            features["request_url"] = 1 if total_objects == 0 else (-1 if external_objects / total_objects > 0.5 else 0)
        else:
            features["request_url"] = 0

        # Anchor URL
        if soup:
            external_links = 0
            total_links = 0
            for a in soup.find_all('a', href=True):
                total_links += 1
                if netloc not in a['href'] and not a['href'].startswith('/'):
                    external_links += 1
            features["anchor_url"] = 1 if total_links == 0 else (-1 if external_links / total_links > 0.5 else 0)
        else:
            features["anchor_url"] = 0

        # Links in script tags
        if soup:
            suspicious_scripts = 0
            total_scripts = 0
            for script in soup.find_all('script', src=True):
                total_scripts += 1
                if netloc not in script['src']:
                    suspicious_scripts += 1
            features["links_in_scripts"] = 1 if total_scripts == 0 else (-1 if suspicious_scripts / total_scripts > 0.5 else 0)
        else:
            features["links_in_scripts"] = 0

        features["info_email"] = -1 if re.findall(r"[mail\(\)|mailto:?]", url) else 1
        features["popup_window"] = -1 if soup and soup.find_all('script', string=re.compile('alert\(|confirm\(|prompt\(')) else 1
        features["status_bar_customization"] = -1 if soup and soup.find_all('script', string=re.compile('onmouseover|onclick')) else 1
        features["disable_right_click"] = -1 if soup and soup.find_all('script', string=re.compile('event.button ?== ?2')) else 1
        features["iframe_redirection"] = -1 if soup and soup.find_all('iframe') else 1

    except Exception as e:
        print(f"Feature extraction failed for URL {url}: {str(e)}")
        # Set default values for all features on error
        features = {feature: 0 for feature in [
            "using_ip", "url_length", "shortened_url", "at_symbol",
            "double_slash_redirect", "prefix_suffix", "sub_domains", "https",
            "domain_registration_length", "favicon", "non_standard_port",
            "https_domain", "request_url", "anchor_url", "links_in_scripts",
            "server_form_handler", "info_email", "abnormal_url",
            "website_forwarding", "status_bar_customization", "disable_right_click",
            "popup_window", "iframe_redirection", "age_of_domain", "dns_record",
            "links_pointing_to_page", "statistical_report", "domain_length",
            "entropy", "special_chars", "suspicious_tld"
        ]}
    return features

def extract_features_parallel(urls: List[str], max_workers: int = 100) -> List[Dict[str, Union[int, float]]]:
    total_urls = len(urls)
    progress = [0]

    def process_url(url):
        nonlocal progress
        result = extract_features(url)
        progress[0] += 1
        percent_done = (progress[0] / total_urls) * 100
        print(f"\rProgress: {percent_done:.2f}% ({progress[0]}/{total_urls})", end="")
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(process_url, urls))

    print("\n")  # New line after progress completion
    return results

def preprocess_dataset(input_file: str, output_file: str, save_scaler: bool = False) -> None:
    print(f"Processing dataset: {input_file}")
    try:
        df = pd.read_csv(input_file)
        print(f"Loaded {len(df)} URLs from dataset")

        features_list = extract_features_parallel(df["url"].tolist())
        features_df = pd.DataFrame(features_list)

        if save_scaler:
            scaler_mean = features_df.mean()
            scaler_std = features_df.std().replace(0, 1)
            scaler_mean.to_csv("ml/models/scaler_mean.csv")
            scaler_std.to_csv("ml/models/scaler_std.csv")
        else:
            scaler_mean = pd.read_csv("ml/models/scaler_mean.csv", index_col=0).squeeze()
            scaler_std = pd.read_csv("ml/models/scaler_std.csv", index_col=0).squeeze()

        features_normalized = (features_df - scaler_mean) / scaler_std
        processed = pd.concat([features_normalized, df["label"]], axis=1)
        processed.to_csv(output_file, index=False)

        print(f"Saved processed dataset to {output_file}")

    except Exception as e:
        print(f"Error during preprocessing: {str(e)}")
        raise

if __name__ == "__main__":
    preprocess_dataset("ml/data/train.csv", "ml/data/train_processed.csv", save_scaler=True)
    preprocess_dataset("ml/data/val.csv", "ml/data/val_processed.csv")
    preprocess_dataset("ml/data/test.csv", "ml/data/test_processed.csv")
