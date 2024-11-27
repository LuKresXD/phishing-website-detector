import os
import pandas as pd
import requests
from urllib.parse import urlparse
from sklearn.model_selection import train_test_split
import random

# Dataset URLs
PHISHING_URL = "https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-links-ACTIVE.txt"
LEGITIMATE_URL = "https://raw.githubusercontent.com/opendns/public-domain-lists/master/opendns-top-domains.txt"
OUTPUT_DIR = "ml/data"

def fetch_datasets(phishing_limit=5000, legitimate_limit=5000):
    # Fetch phishing URLs
    phishing = []
    try:
        response = requests.get(PHISHING_URL)
        response.raise_for_status()
        phishing = response.text.splitlines()
        phishing = random.sample(phishing, min(phishing_limit, len(phishing)))  # Randomly pick phishing_limit entries
    except Exception as e:
        print(f"Error fetching phishing data: {e}")

    # Fetch legitimate domains
    legitimate = []
    try:
        response = requests.get(LEGITIMATE_URL)
        response.raise_for_status()
        legitimate = response.text.splitlines()
        legitimate = random.sample(legitimate, min(legitimate_limit, len(legitimate)))  # Randomly pick legitimate_limit entries
    except Exception as e:
        print(f"Error fetching legitimate data: {e}")

    print(f"Phishing URLs fetched: {len(phishing)}")
    print(f"Legitimate domains fetched: {len(legitimate)}")
    return phishing, legitimate

def extract_domain(url):
    """Extract the domain from a given URL."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        domain = domain.lower().strip()
        if domain.startswith("www."):
            domain = domain[4:]  # Remove "www." if present
        return domain
    except Exception as e:
        print(f"Error parsing URL {url}: {e}")
        return None

def format_domains(domains, is_phishing=True):
    """Extract and format domains from URLs or raw domains."""
    formatted = []
    for domain in domains:
        extracted = extract_domain(domain)
        if extracted:
            formatted.append(extracted)
    formatted = list(set(formatted))  # Remove duplicates
    if is_phishing:
        print(f"Phishing domains extracted: {len(formatted)}")
    else:
        print(f"Legitimate domains extracted: {len(formatted)}")
    return formatted

def prepare_dataset():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    phishing, legitimate = fetch_datasets()

    # Extract and format both phishing and legitimate domains
    phishing = format_domains(phishing, is_phishing=True)
    legitimate = format_domains(legitimate, is_phishing=False)

    # Combine and shuffle data
    data = pd.DataFrame(
        {"url": phishing + legitimate, "label": [1] * len(phishing) + [0] * len(legitimate)}
    ).sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"Total combined dataset size: {len(data)}")
    if data.empty:
        print("No data available. Exiting...")
        return

    # Split data
    train, temp = train_test_split(data, test_size=0.3, random_state=42, stratify=data["label"])
    val, test = train_test_split(temp, test_size=0.5, random_state=42, stratify=temp["label"])

    # Save datasets
    train.to_csv(os.path.join(OUTPUT_DIR, "train.csv"), index=False)
    val.to_csv(os.path.join(OUTPUT_DIR, "val.csv"), index=False)
    test.to_csv(os.path.join(OUTPUT_DIR, "test.csv"), index=False)

    print("Datasets created:")
    print(f"Train: {len(train)} | Validation: {len(val)} | Test: {len(test)}")

if __name__ == "__main__":
    prepare_dataset()
