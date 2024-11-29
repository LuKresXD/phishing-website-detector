import pandas as pd
import numpy as np
import joblib
import argparse

from preprocess import extract_features
from sklearn.exceptions import NotFittedError

def predict(urls, scaler, model):
    features_list = []
    for url in urls:
        row = {'URL': url, 'label': -1}
        features = extract_features(row)
        features_list.append(features)
    features_df = pd.DataFrame(features_list)
    feature_columns = features_df.columns.drop('label')
    features_df[feature_columns] = features_df[feature_columns].replace([np.inf, -np.inf], np.nan).fillna(-1)
    try:
        features_df[feature_columns] = scaler.transform(features_df[feature_columns])
    except NotFittedError:
        print("Scaler has not been fitted. Please ensure that the scaler is correctly loaded.")
        return
    predictions = model.predict(features_df[feature_columns])
    probabilities = model.predict_proba(features_df[feature_columns])
    return predictions, probabilities

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the trained model with URLs.")
    parser.add_argument('--url', type=str, help='Single URL to test')
    parser.add_argument('--file', type=str, help='File containing URLs to test')
    args = parser.parse_args()

    if not args.url and not args.file:
        print("Please provide a URL or a file containing URLs.")
        exit(1)

    urls = []
    if args.url:
        urls.append(args.url)
    if args.file:
        with open(args.file, 'r') as f:
            urls.extend([line.strip() for line in f.readlines()])

    # Load scaler and model
    scaler = joblib.load('../models/scaler.pkl')
    model = joblib.load('../models/logistic_model.pkl')

    predictions, probabilities = predict(urls, scaler, model)

    for url, pred, prob in zip(urls, predictions, probabilities):
        print(f"URL: {url}")
        print(f"Prediction: {'Legitimate' if pred == 1 else 'Phishing'}")
        print(f"Probabilities: Phishing={prob[0]:.4f}, Legitimate={prob[1]:.4f}\n")
