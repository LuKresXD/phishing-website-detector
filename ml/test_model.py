import pandas as pd
import joblib
from preprocess import extract_features


def test_single_domain(domain, model):
    """Test a single domain and predict its class."""
    # Extract features
    features = extract_features(domain)
    feature_vector = pd.DataFrame([features])

    # Load scaler parameters
    scaler_mean = pd.read_csv("ml/models/scaler_mean.csv", index_col=0).squeeze("columns")
    scaler_std = pd.read_csv("ml/models/scaler_std.csv", index_col=0).squeeze("columns")

    # Normalize features
    feature_vector = (feature_vector - scaler_mean) / scaler_std
    feature_vector = feature_vector.fillna(0)  # Replace NaN with 0

    prediction = model.predict(feature_vector)
    probability = model.predict_proba(feature_vector)

    print(f"Domain: {domain}")
    print(f"Prediction: {'Phishing' if prediction[0] == 1 else 'Legitimate'}")
    print(f"Probability: Legitimate={probability[0][0]:.2f}, Phishing={probability[0][1]:.2f}")



def test_batch(input_file, model):
    """Test a batch of domains from a file."""
    # Read input domains from a file
    domains = pd.read_csv(input_file)

    if "url" not in domains.columns:
        print("The input file must contain a column named 'url'")
        return

    # Extract features for all domains
    features = domains["url"].apply(extract_features).apply(pd.Series)
    predictions = model.predict(features)
    probabilities = model.predict_proba(features)

    # Add predictions and probabilities to the DataFrame
    domains["Prediction"] = ["Phishing" if pred == 1 else "Legitimate" for pred in predictions]
    domains["Legitimate Probability"] = probabilities[:, 0]
    domains["Phishing Probability"] = probabilities[:, 1]

    # Save the output
    output_file = "ml/data/test_output.csv"
    domains.to_csv(output_file, index=False)
    print(f"Batch test results saved to {output_file}")


if __name__ == "__main__":
    import argparse

    # Argument parsing for interactive or batch mode
    parser = argparse.ArgumentParser(description="Test the trained phishing detection model.")
    parser.add_argument("--domain", type=str, help="A single domain to test.")
    parser.add_argument("--file", type=str, help="A file containing multiple domains to test.")
    args = parser.parse_args()

    # Load the trained model
    model = joblib.load("ml/models/logistic_model.joblib")

    if args.domain:
        # Test a single domain
        test_single_domain(args.domain, model)
    elif args.file:
        # Test a batch of domains
        test_batch(args.file, model)
    else:
        print("Please provide either --domain or --file argument.")
