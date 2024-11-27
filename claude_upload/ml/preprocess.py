import pandas as pd
import numpy as np
import re
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup
import socket
import whois
from datetime import date, datetime, timedelta
import time
from functools import lru_cache
import dns.resolver
import tldextract
import warnings
from urllib3.exceptions import InsecureRequestWarning
import signal
from contextlib import contextmanager
import threading
import _thread
import urllib3
from typing import Optional, Dict, Union, List

# Suppress SSL warnings
warnings.filterwarnings('ignore', category=InsecureRequestWarning)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Constants
PHISHING_KEYWORDS = ["login", "verify", "secure", "account", "banking", "confirm", "password", "pay"]
SUSPICIOUS_TLDS = ["tk", "ml", "ga", "cf", "gq", "xyz", "work", "party", "date", "wang", "faith"]
SHORTENING_SERVICES = [
    'bit.ly', 'goo.gl', 'shorte.st', 'go2l.ink', 'x.co', 'ow.ly', 't.co', 'tinyurl',
    'tr.im', 'is.gd', 'cli.gs', 'yfrog.com', 'migre.me', 'ff.im', 'tiny.cc', 'url4.eu',
    'twit.ac', 'su.pr', 'twurl.nl', 'snipurl.com', 'short.to', 'BudURL.com', 'ping.fm'
]

class TimeoutException(Exception):
    pass

@contextmanager
def timeout(seconds: int):
    timer = threading.Timer(seconds, lambda: _thread.interrupt_main())
    timer.start()
    try:
        yield
    except KeyboardInterrupt:
        raise TimeoutException(f"Operation timed out after {seconds} seconds")
    finally:
        timer.cancel()

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
    except Exception as e:
        print(f"DNS lookup error for {domain}: {str(e)}")
        return False

@lru_cache(maxsize=1000)
def get_whois_info(domain: str, timeout_seconds: int = 4) -> Optional[whois.parser.WhoisEntry]:
    try:
        with timeout(timeout_seconds):
            clean_domain = domain.strip().lower()
            if not clean_domain:
                return None

            if '://' in clean_domain:
                clean_domain = clean_domain.split('://')[-1].split('/')[0]

            extracted = tldextract.extract(clean_domain)
            if not extracted.domain or not extracted.suffix:
                return None

            base_domain = f"{extracted.domain}.{extracted.suffix}"
            w = whois.whois(base_domain)

            if w and (w.domain_name or w.creation_date or w.expiration_date):
                return w

    except TimeoutException:
        print(f"WHOIS lookup timed out for domain: {domain}")
    except Exception as e:
        print(f"WHOIS lookup failed for {domain}: {str(e)}")

    return None

def parse_date(date_obj: Union[str, datetime, date, list]) -> Optional[date]:
    if not date_obj:
        return None

    try:
        if isinstance(date_obj, list):
            date_obj = date_obj[0]

        if isinstance(date_obj, str):
            try:
                return datetime.strptime(date_obj, "%Y-%m-%d").date()
            except ValueError:
                # Try parsing with dateutil as fallback
                from dateutil import parser
                return parser.parse(date_obj).date()
        elif isinstance(date_obj, datetime):
            return date_obj.date()
        elif isinstance(date_obj, date):
            return date_obj

    except Exception as e:
        print(f"Date parsing error: {str(e)}")

    return None

def extract_features(url: str) -> Dict[str, Union[int, float]]:
    features = {}

    try:
        # Parse URL
        parsed = urlparse(url)
        netloc = parsed.netloc if parsed.netloc else url
        path = parsed.path
        extracted = tldextract.extract(url)
        domain = extracted.domain
        suffix = extracted.suffix
        subdomain = extracted.subdomain

        # Get WHOIS information
        whois_response = get_whois_info(f"{domain}.{suffix}" if domain and suffix else netloc)

        # Try to fetch webpage content
        try:
            response = requests.get(url, timeout=5, verify=False)
            soup = BeautifulSoup(response.text, 'html.parser')
        except:
            response = None
            soup = None

        # 1. Using IP
        features["using_ip"] = int(bool(re.match(
            r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
            netloc
        )))

        # 2. URL Length
        features["url_length"] = 1 if len(url) < 54 else (0 if len(url) <= 75 else -1)

        # 3. Shortened URL
        features["shortened_url"] = -1 if any(service in url.lower() for service in SHORTENING_SERVICES) else 1

        # 4. @ Symbol
        features["at_symbol"] = -1 if '@' in url else 1

        # 5. Double Slash Redirect
        features["double_slash_redirect"] = -1 if url[8:].find('//') > 0 else 1

        # 6. Prefix/Suffix
        features["prefix_suffix"] = -1 if '-' in netloc else 1

        # 7. Sub Domains
        dot_count = len(re.findall(r"\.", netloc))
        features["sub_domains"] = 1 if dot_count == 1 else (0 if dot_count == 2 else -1)

        # 8. HTTPS
        features["https"] = 1 if parsed.scheme == 'https' else -1

        # 9. Domain Registration Length
        if whois_response and whois_response.creation_date and whois_response.expiration_date:
            creation_date = parse_date(whois_response.creation_date)
            expiration_date = parse_date(whois_response.expiration_date)
            if creation_date and expiration_date:
                reg_length = (expiration_date - creation_date).days
                features["domain_registration_length"] = 1 if reg_length > 365 else -1
            else:
                features["domain_registration_length"] = 0
        else:
            features["domain_registration_length"] = 0

        # 10. Favicon
        features["favicon"] = 1 if soup and soup.find('link', rel='icon') else -1

        # 11. Non-Standard Port
        standard_ports = ['80', '443', '']
        features["non_standard_port"] = -1 if parsed.port and str(parsed.port) not in standard_ports else 1

        # 12. HTTPS in Domain
        features["https_domain"] = -1 if 'https' in domain or 'http' in domain else 1

        # 13. Request URL
        if soup:
            external_objects = 0
            total_objects = 0
            for img in soup.find_all('img', src=True):
                total_objects += 1
                if netloc not in img['src']:
                    external_objects += 1
            features["request_url"] = 1 if total_objects == 0 else (-1 if external_objects/total_objects > 0.5 else 0)
        else:
            features["request_url"] = 0

        # 14. Anchor URL
        if soup:
            external_links = 0
            total_links = 0
            for a in soup.find_all('a', href=True):
                total_links += 1
                if netloc not in a['href'] and not a['href'].startswith('/'):
                    external_links += 1
            features["anchor_url"] = 1 if total_links == 0 else (-1 if external_links/total_links > 0.5 else 0)
        else:
            features["anchor_url"] = 0

        # 15. Links in Script Tags
        if soup:
            suspicious_scripts = 0
            total_scripts = 0
            for script in soup.find_all('script', src=True):
                total_scripts += 1
                if netloc not in script['src']:
                    suspicious_scripts += 1
            features["links_in_scripts"] = 1 if total_scripts == 0 else (-1 if suspicious_scripts/total_scripts > 0.5 else 0)
        else:
            features["links_in_scripts"] = 0

        # 16. Server Form Handler
        if soup:
            forms = soup.find_all('form', action=True)
            features["server_form_handler"] = -1 if any(not form['action'] or 'about:blank' in form['action']
                                                      for form in forms) else 1
        else:
            features["server_form_handler"] = 0

        # 17. Info Email
        features["info_email"] = -1 if re.findall(r"[mail\(\)|mailto:?]", url) else 1

        # 18. Abnormal URL
        features["abnormal_url"] = -1 if any(keyword in url.lower() for keyword in PHISHING_KEYWORDS) else 1

        # 19. Website Forwarding
        if response:
            features["website_forwarding"] = -1 if len(response.history) > 2 else (0 if len(response.history) == 2 else 1)
        else:
            features["website_forwarding"] = 0

        # 20. Status Bar Customization
        if soup:
            features["status_bar_customization"] = -1 if soup.find_all('script',
               string=re.compile('onmouseover|onclick')) else 1
        else:
            features["status_bar_customization"] = 0

        # 21. Disable Right Click
        if soup:
            features["disable_right_click"] = -1 if soup.find_all('script',
                string=re.compile('event.button ?== ?2')) else 1
        else:
            features["disable_right_click"] = 0

        # 22. Using Pop-up Window
        if soup:
            features["popup_window"] = -1 if soup.find_all('script',
                string=re.compile('alert\(|confirm\(|prompt\(')) else 1
        else:
            features["popup_window"] = 0

        # 23. IFrame Redirection
        if soup:
            features["iframe_redirection"] = -1 if soup.find_all('iframe') else 1
        else:
            features["iframe_redirection"] = 0

        # 24. Age of Domain
        if whois_response and whois_response.creation_date:
            creation_date = parse_date(whois_response.creation_date)
            if creation_date:
                domain_age = (date.today() - creation_date).days
                features["age_of_domain"] = 1 if domain_age > 180 else -1
            else:
                features["age_of_domain"] = 0
        else:
            features["age_of_domain"] = 0

        # 25. DNS Record
        features["dns_record"] = 1 if check_dns_record(f"{domain}.{suffix}") else -1

        # 26. Links Pointing to Page
        features["links_pointing_to_page"] = len(soup.find_all('a')) if soup else 0

        # 27. Statistical Report
        suspicious_patterns = [
            'at.ua', 'usa.cc', 'baltazarpresentes.com.br', 'pe.hu', 'esy.es',
            'hol.es', 'sweddy.com', 'myjino.ru', '96.lt', 'ow.ly'
        ]
        features["statistical_report"] = -1 if any(pattern in url for pattern in suspicious_patterns) else 1

        # Additional statistical features
        features["domain_length"] = len(domain) if domain else 0
        features["entropy"] = shannon_entropy(domain) if domain else 0
        features["special_chars"] = len(re.findall(r'[^a-zA-Z0-9-.]', domain)) if domain else 0
        features["suspicious_tld"] = -1 if suffix.lower() in SUSPICIOUS_TLDS else 1

    except Exception as e:
        print(f"Error extracting features from URL {url}: {str(e)}")
        # Set default values for all features
        for feature in [
            "using_ip", "url_length", "shortened_url", "at_symbol",
            "double_slash_redirect", "prefix_suffix", "sub_domains", "https",
            "domain_registration_length", "favicon", "non_standard_port",
            "https_domain", "request_url", "anchor_url", "links_in_scripts",
            "server_form_handler", "info_email", "abnormal_url",
            "website_forwarding", "status_bar_customization", "disable_right_click",
            "popup_window", "iframe_redirection", "age_of_domain", "dns_record",
            "links_pointing_to_page", "statistical_report", "domain_length",
            "entropy", "special_chars", "suspicious_tld"
        ]:
            features[feature] = 0

    return features

def extract_features_with_timeout(url: str, timeout_seconds: int = 4) -> Optional[Dict[str, Union[int, float]]]:
    try:
        start_time = time.time()
        features = extract_features(url)

        if time.time() - start_time > timeout_seconds:
            print(f"Processing timed out for URL: {url}")
            return None

        return features
    except Exception as e:
        print(f"Error processing URL {url}: {str(e)}")
        return None

def preprocess_dataset(input_file: str, output_file: str, save_scaler: bool = False) -> None:
    print(f"\nProcessing dataset: {input_file}")

    try:
        # Load dataset
        df = pd.read_csv(input_file)
        total_urls = len(df)
        print(f"Loaded {total_urls} URLs from dataset")

        # Extract features
        print("\nExtracting features...")
        features_list = []
        skipped_urls = []
        last_percent = -1

        for idx, url in enumerate(df["url"]):
            # Calculate current percentage
            current_percent = int((idx / total_urls) * 100)

            # Only print if percentage has changed
            if current_percent > last_percent:
                print(f"Progress: {current_percent}% [{idx}/{total_urls}] (Skipped: {len(skipped_urls)})", end='\r')
                last_percent = current_percent

            # Extract features with timeout
            features = extract_features_with_timeout(url)

            if features is None:
                skipped_urls.append((idx, url))
                # Create default features for skipped URLs
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

            features_list.append(features)

        # Print final progress and statistics
        print(f"\nProgress: 100% [{total_urls}/{total_urls}] (Skipped: {len(skipped_urls)})")
        print(f"Feature extraction complete!")

        if skipped_urls:
            print("\nSkipped URLs:")
            print(f"Total skipped: {len(skipped_urls)} ({(len(skipped_urls)/total_urls)*100:.2f}%)")
            if len(skipped_urls) > 0:
                print("First 5 skipped URLs:")
                for idx, url in skipped_urls[:5]:
                    print(f"Index {idx}: {url}")
                if len(skipped_urls) > 5:
                    print(f"... and {len(skipped_urls) - 5} more")

        # Convert to DataFrame
        features_df = pd.DataFrame(features_list)

        # Handle normalization
        if save_scaler:
            print("\nCalculating and saving scaling parameters...")
            scaler_mean = features_df.mean()
            scaler_std = features_df.std()

            # Replace zero standard deviations with 1
            scaler_std = scaler_std.replace(0, 1)

            # Save scaling parameters
            scaler_mean.to_csv("ml/models/scaler_mean.csv")
            scaler_std.to_csv("ml/models/scaler_std.csv")
            print("Scaler parameters saved successfully")
        else:
            print("\nLoading existing scaling parameters...")
            try:
                scaler_mean = pd.read_csv("ml/models/scaler_mean.csv", index_col=0).squeeze("columns")
                scaler_std = pd.read_csv("ml/models/scaler_std.csv", index_col=0).squeeze("columns")
            except FileNotFoundError:
                raise Exception("Scaling parameters not found. Please run with save_scaler=True first.")

        # Apply normalization
        print("Normalizing features...")
        features_normalized = (features_df - scaler_mean) / scaler_std
        features_normalized = features_normalized.fillna(0)

        # Add label column
        processed = pd.concat([features_normalized, df["label"]], axis=1)

        # Save processed dataset
        print(f"\nSaving processed dataset to {output_file}")
        processed.to_csv(output_file, index=False)

        # Print feature statistics
        print("\nFeature Statistics:")
        print(f"Number of features: {len(features_normalized.columns)}")
        print(f"Total URLs processed: {total_urls}")
        print(f"Successfully processed: {total_urls - len(skipped_urls)}")
        print(f"Skipped URLs: {len(skipped_urls)}")
        print(f"Success rate: {((total_urls - len(skipped_urls)) / total_urls) * 100:.2f}%")

        # Print feature value ranges
        print("\nFeature Value Ranges:")
        stats_df = features_normalized.describe()
        print(stats_df.round(3))

        print(f"\nProcessing complete for {input_file}!")

    except Exception as e:
        print(f"\nError during dataset preprocessing: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        print("Starting preprocessing pipeline...")
        print("=" * 60)

        start_time = time.time()

        print("\nProcessing training dataset...")
        preprocess_dataset("ml/data/train.csv", "ml/data/train_processed.csv", save_scaler=True)

        print("\nProcessing validation dataset...")
        preprocess_dataset("ml/data/val.csv", "ml/data/val_processed.csv")

        print("\nProcessing test dataset...")
        preprocess_dataset("ml/data/test.csv", "ml/data/test_processed.csv")

        end_time = time.time()
        processing_time = end_time - start_time

        print("\nPreprocessing pipeline completed successfully!")
        print(f"Total processing time: {processing_time:.2f} seconds")
        print("=" * 60)

    except Exception as e:
        print(f"\nError in preprocessing pipeline: {str(e)}")
        raise