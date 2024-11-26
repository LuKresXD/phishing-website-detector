import pandas as pd
import numpy as np
import re
from urllib.parse import urlparse

# Define suspicious keywords and TLDs
PHISHING_KEYWORDS = ["login", "verify", "secure", "account", "banking"]
SUSPICIOUS_TLDS = ["tk", "ml", "cf", "gq", "ga"]

def shannon_entropy(s):
    """Calculate the Shannon entropy of a string."""
    if not s:
        return 0
    probabilities = [float(s.count(c)) / len(s) for c in set(s)]
    return -sum(p * np.log2(p) for p in probabilities if p > 0)

def extract_features(domain):
    parsed = urlparse(domain)
    netloc = parsed.netloc if parsed.netloc else domain

    tokens = re.split(r"[.\-]", netloc.lower())
    domain_name = tokens[0] if tokens else netloc

    features = {
        "domain_length": len(netloc),
        "num_subdomains": netloc.count("."),
        "contains_digits": int(any(char.isdigit() for char in netloc)),
        "special_char_count": sum(1 for char in netloc if not char.isalnum()),
        "entropy": shannon_entropy(netloc),
        "has_phishing_keywords": int(any(keyword in netloc for keyword in PHISHING_KEYWORDS)),
        "has_suspicious_tld": int(any(netloc.endswith(f".{tld}") for tld in SUSPICIOUS_TLDS)),
        "vowel_to_consonant_ratio": sum(1 for char in netloc if char in "aeiou") /
                                    max(sum(1 for char in netloc if char.isalpha()) - sum(1 for char in netloc if char in "aeiou"), 1),
        "longest_word_length": max(len(token) for token in tokens) if tokens else 0,
        "path_depth": parsed.path.count("/"),
        "average_token_length": np.mean([len(token) for token in tokens]) if tokens else 0,
        "char_repetition_count": sum(netloc.count(char * 3) > 0 for char in set(netloc)),  # Repeated chars like aaa
        "mixed_case": int(any(char.islower() for char in netloc) and any(char.isupper() for char in netloc)),
    }

    return features


def preprocess_dataset(input_file, output_file, save_scaler=False):
    # Load dataset
    df = pd.read_csv(input_file)

    # Extract features
    features = df["url"].apply(extract_features).apply(pd.Series)

    # Normalize features
    if save_scaler:
        scaler_mean = features.mean()
        scaler_std = features.std()
        # Save scaling parameters for reuse
        scaler_mean.to_csv("ml/models/scaler_mean.csv")
        scaler_std.to_csv("ml/models/scaler_std.csv")
        print("Scaler parameters saved.")
    else:
        # Load scaling parameters
        scaler_mean = pd.read_csv("ml/models/scaler_mean.csv", index_col=0).squeeze("columns")
        scaler_std = pd.read_csv("ml/models/scaler_std.csv", index_col=0).squeeze("columns")

    features = (features - scaler_mean) / scaler_std
    features = features.fillna(0)  # Replace NaN with 0

    # Add label column
    processed = pd.concat([features, df["label"]], axis=1)

    # Save processed dataset
    processed.to_csv(output_file, index=False)
    print(f"Processed dataset saved to {output_file}")

if __name__ == "__main__":
    preprocess_dataset("ml/data/train.csv", "ml/data/train_processed.csv", save_scaler=True)
    preprocess_dataset("ml/data/val.csv", "ml/data/val_processed.csv")
    preprocess_dataset("ml/data/test.csv", "ml/data/test_processed.csv")
