import os
import pandas as pd
from sklearn.model_selection import train_test_split

# Path to the PhiUSIIL dataset
INPUT_FILE = "ml/data/PhiUSIIL_Phishing_URL_Dataset.csv"  # Replace this with your dataset's path
OUTPUT_DIR = "ml/data"

# Configurable number of URLs
PHISHING_LIMIT = 5000  # Set the desired number of phishing URLs
LEGITIMATE_LIMIT = 5000  # Set the desired number of legitimate URLs

def prepare_dataset():
    if not os.path.exists(INPUT_FILE):
        print(f"Dataset not found at {INPUT_FILE}. Please check the path.")
        return

    try:
        print("Reading dataset...")

        # Read the dataset
        data = pd.read_csv(INPUT_FILE)
        if "URL" not in data.columns or "label" not in data.columns:
            print("Dataset must contain 'URL' and 'label' columns.")
            return

        data = data.dropna(subset=["URL", "label"])  # Drop rows with missing values
        data["label"] = data["label"].astype(int)  # Ensure 'label' is integer

        # Rename column for consistency
        data.rename(columns={"URL": "url"}, inplace=True)

        # Split phishing and legitimate URLs
        phishing = data[data["label"] == 0]
        legitimate = data[data["label"] == 1]

        # Debugging: Check sizes
        print(f"Total phishing URLs available: {len(phishing)}")
        print(f"Total legitimate URLs available: {len(legitimate)}")

        # Limit the number of URLs
        phishing = phishing.sample(n=min(PHISHING_LIMIT, len(phishing)), random_state=42)
        legitimate = legitimate.sample(n=min(LEGITIMATE_LIMIT, len(legitimate)), random_state=42)

        # Combine and shuffle
        balanced_data = pd.concat([phishing, legitimate]).sample(frac=1, random_state=42).reset_index(drop=True)
        print(f"Balanced dataset size: {len(balanced_data)}")

        # Split dataset
        train, temp = train_test_split(balanced_data, test_size=0.3, random_state=42, stratify=balanced_data["label"])
        val, test = train_test_split(temp, test_size=0.5, random_state=42, stratify=temp["label"])

        # Ensure output directory exists
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Save datasets with consistent column names
        train.to_csv(os.path.join(OUTPUT_DIR, "train.csv"), index=False)
        val.to_csv(os.path.join(OUTPUT_DIR, "val.csv"), index=False)
        test.to_csv(os.path.join(OUTPUT_DIR, "test.csv"), index=False)

        print("Datasets created:")
        print(f"Train: {len(train)} | Validation: {len(val)} | Test: {len(test)}")
        print(f"Files saved in: {OUTPUT_DIR}")
    except Exception as e:
        print(f"Error processing dataset: {e}")

if __name__ == "__main__":
    prepare_dataset()
