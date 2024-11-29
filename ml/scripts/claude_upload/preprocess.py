import pandas as pd
import numpy as np
import re
import socket
import requests
import whois
import dns.resolver
import warnings
import logging
from urllib.parse import urlparse
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
from datetime import datetime
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from sklearn.preprocessing import StandardScaler
import joblib
from tqdm import tqdm

# Suppress specific warnings
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
warnings.filterwarnings("ignore", category=UserWarning, module='bs4')
logging.getLogger('whois').setLevel(logging.ERROR)

# Define suspicious TLDs
SUSPICIOUS_TLDS = {'.tk', '.ml', '.ga', '.cf', '.gq'}

def is_ip(address):
    try:
        socket.inet_aton(address)
        return 1
    except:
        return 0

def url_length(url):
    return len(url)

def is_shortened(url):
    shortening_services = r'(bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|'
    shortening_services += r't\.co|tinyurl|tr\.im|is\.gd|cli\.gs|yfrog\.com|'
    shortening_services += r'migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|su\.pr|'
    shortening_services += r'tweetburner|tiny\.pl|bit\.do|bc\.vc|'
    shortening_services += r'j\.mp|short\.ly|budurl\.com|ping\.fm|post\.ly|'
    shortening_services += r'just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|'
    shortening_services += r'qik\.ly|redir\.ec|goo\.gl|'
    shortening_services += r'deep\.ai|flic\.kr|plurl\.me|qr\.net|url\.ie|twiturl\.de|'
    shortening_services += r'vzturl\.com|cutt\.ly|u\.to|bitly\.com|lnkd\.in|'
    shortening_services += r'db\.tt|qr\.ae|adf\.ly|bitly\.com|shorturl\.at)'
    match = re.search(shortening_services, url)
    return 1 if match else 0

def has_at_symbol(url):
    return 1 if '@' in url else 0

def double_slash_redirect(url):
    last_double_slash = url.rfind('//')
    return 1 if last_double_slash > 7 else 0  # Ignore 'http://' at position 7

def prefix_suffix(domain):
    return 1 if '-' in domain else 0

def count_subdomains(domain):
    return domain.count('.') - 1  # Subtract 1 for the main domain

def count_special_chars(url):
    return len(re.findall(r'[!#$%^&*(),?":{}|<>]', url))

def uses_https(url):
    return 1 if urlparse(url).scheme == 'https' else 0

def domain_length(domain):
    return len(domain)

def suspicious_tld(domain):
    tld = '.' + domain.split('.')[-1]
    return 1 if tld in SUSPICIOUS_TLDS else 0

def shannon_entropy(s):
    p, lns = Counter(s), float(len(s))
    return -sum(count/lns * np.log2(count/lns) for count in p.values())

def domain_registration_length(domain):
    try:
        w = whois.whois(domain)
        if isinstance(w.expiration_date, list):
            expiration_date = w.expiration_date[0]
        else:
            expiration_date = w.expiration_date
        if isinstance(w.creation_date, list):
            creation_date = w.creation_date[0]
        else:
            creation_date = w.creation_date
        if expiration_date and creation_date:
            age = (expiration_date - creation_date).days
            return age
        else:
            return -1
    except Exception as e:
        # Return -1 if WHOIS data is not available
        return -1

def dns_record(domain):
    try:
        dns.resolver.resolve(domain, 'A')
        return 1
    except:
        return 0

def extract_web_content_features(url):
    features = {
        'favicon': 0,
        'request_url': 0,
        'anchor_url': 0,
        'links_in_scripts': 0,
        'server_form_handler': 0,
        'iframe_redirection': 0,
        'status_bar_customization': 0,
        'disable_right_click': 0
    }
    try:
        response = requests.get(url, timeout=5)
        content = response.content
        soup = BeautifulSoup(content, 'html.parser')
        domain = urlparse(url).netloc

        # Favicon
        favicon = soup.find('link', rel='shortcut icon')
        if favicon and favicon.get('href'):
            favicon_url = favicon['href']
            if domain not in favicon_url:
                features['favicon'] = 1

        # Request URL
        imgs = soup.find_all('img')
        total_imgs = len(imgs)
        external_imgs = 0
        for img in imgs:
            src = img.get('src')
            if src and domain not in src:
                external_imgs += 1
        if total_imgs > 0:
            features['request_url'] = external_imgs / total_imgs

        # Anchor URL
        anchors = soup.find_all('a')
        total_anchors = len(anchors)
        external_anchors = 0
        for anchor in anchors:
            href = anchor.get('href')
            if href and domain not in href:
                external_anchors += 1
        if total_anchors > 0:
            features['anchor_url'] = external_anchors / total_anchors

        # Links in Scripts
        scripts = soup.find_all('script')
        total_scripts = len(scripts)
        external_links = 0
        for script in scripts:
            src = script.get('src')
            if src and domain not in src:
                external_links += 1
        if total_scripts > 0:
            features['links_in_scripts'] = external_links / total_scripts

        # Server Form Handler
        forms = soup.find_all('form')
        empty_action = False
        about_blank = False
        for form in forms:
            action = form.get('action')
            if action == '' or action == 'about:blank':
                empty_action = True
            elif domain not in action:
                about_blank = True
        if empty_action or about_blank:
            features['server_form_handler'] = 1

        # Iframe Redirection
        iframes = soup.find_all('iframe')
        features['iframe_redirection'] = 1 if len(iframes) > 0 else 0

        # Status Bar Customization and Right Click Disable
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                script_content = script.string.lower()
                if 'status' in script_content:
                    features['status_bar_customization'] = 1
                if 'event.button==2' in script_content or 'event.button == 2' in script_content:
                    features['disable_right_click'] = 1

    except requests.exceptions.RequestException:
        # Handle request exceptions silently
        pass
    except Exception:
        # Handle other exceptions silently
        pass

    return features

def website_forwarding(url):
    try:
        session = requests.Session()
        response = session.get(url, timeout=5)
        redirects = len(response.history)
        return redirects
    except:
        return -1

def extract_features(row):
    url = row['URL']
    features = {}
    try:
        parsed = urlparse(url)
        domain = parsed.netloc

        features['using_ip'] = is_ip(domain)
        features['url_length'] = url_length(url)
        features['shortened_url'] = is_shortened(url)
        features['at_symbol'] = has_at_symbol(url)
        features['double_slash_redirect'] = double_slash_redirect(url)
        features['prefix_suffix'] = prefix_suffix(domain)
        features['sub_domains'] = count_subdomains(domain)
        features['special_chars'] = count_special_chars(url)
        features['https'] = uses_https(url)
        features['domain_length'] = domain_length(domain)
        features['suspicious_tld'] = suspicious_tld(domain)
        features['entropy'] = shannon_entropy(domain)
        features['domain_registration_length'] = domain_registration_length(domain)
        features['dns_record'] = dns_record(domain)
        features.update(extract_web_content_features(url))
        features['website_forwarding'] = website_forwarding(url)
        features['label'] = row['label']
    except Exception:
        # Error handling for invalid URLs or failed feature extraction
        features = {key: -1 for key in [
            'using_ip', 'url_length', 'shortened_url', 'at_symbol',
            'double_slash_redirect', 'prefix_suffix', 'sub_domains', 'special_chars',
            'https', 'domain_length', 'suspicious_tld', 'entropy',
            'domain_registration_length', 'dns_record', 'favicon', 'request_url',
            'anchor_url', 'links_in_scripts', 'server_form_handler', 'iframe_redirection',
            'status_bar_customization', 'disable_right_click', 'website_forwarding', 'label'
        ]}
        features['label'] = row['label']
    return features

def process_dataset(input_csv, output_csv, scaler=None, is_training=False):
    df = pd.read_csv(input_csv)
    features_list = []
    total_urls = len(df)

    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = {executor.submit(extract_features, row): idx for idx, row in df.iterrows()}
        for future in tqdm(as_completed(futures), total=total_urls, desc=f"Processing {input_csv}"):
            features = future.result()
            features_list.append(features)

    features_df = pd.DataFrame(features_list)
    features_df = features_df.replace([np.inf, -np.inf], np.nan).fillna(-1)

    feature_columns = features_df.columns.drop('label')
    if is_training:
        scaler = StandardScaler()
        features_df[feature_columns] = scaler.fit_transform(features_df[feature_columns])
        models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models'))
        os.makedirs(models_dir, exist_ok=True)
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        joblib.dump(scaler, scaler_path)
    else:
        features_df[feature_columns] = scaler.transform(features_df[feature_columns])

    features_df.to_csv(output_csv, index=False)
    return scaler

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Preprocess datasets.")
    parser.add_argument('--input_train', type=str, default='../data/processed/train.csv', help='Input training CSV file path')
    parser.add_argument('--input_val', type=str, default='../data/processed/val.csv', help='Input validation CSV file path')
    parser.add_argument('--input_test', type=str, default='../data/processed/test.csv', help='Input test CSV file path')
    parser.add_argument('--output_train', type=str, default='../data/processed/train_processed.csv', help='Output training CSV file path')
    parser.add_argument('--output_val', type=str, default='../data/processed/val_processed.csv', help='Output validation CSV file path')
    parser.add_argument('--output_test', type=str, default='../data/processed/test_processed.csv', help='Output test CSV file path')
    args = parser.parse_args()

    scaler = process_dataset(args.input_train, args.output_train, is_training=True)
    process_dataset(args.input_val, args.output_val, scaler=scaler, is_training=False)
    process_dataset(args.input_test, args.output_test, scaler=scaler, is_training=False)
    combined_df = pd.concat([
        pd.read_csv(args.output_train),
        pd.read_csv(args.output_val),
        pd.read_csv(args.output_test)
    ], ignore_index=True)
    combined_df.to_csv('../data/processed/combined_processed.csv', index=False)
    print("Combined processed dataset saved for analysis.")