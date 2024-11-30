import pandas as pd
from sklearn.model_selection import train_test_split

def fetch_and_prepare_dataset(input_csv, output_dir, limit=None):
    # Load the dataset
    df = pd.read_csv(input_csv)

    # Ensure the 'label' column is of integer type
    df['label'] = df['label'].astype(int)

    # Remove duplicates
    df = df.drop_duplicates(subset='URL').reset_index(drop=True)

    # Separate phishing and legitimate URLs
    phishing_df = df[df['label'] == 0]
    legitimate_df = df[df['label'] == 1]

    # Balance the dataset
    min_count = min(len(phishing_df), len(legitimate_df))
    if limit:
        min_count = min(min_count, limit)

    phishing_df = phishing_df.sample(n=min_count, random_state=42)
    legitimate_df = legitimate_df.sample(n=min_count, random_state=42)

    # Combine the datasets
    balanced_df = pd.concat([phishing_df, legitimate_df]).reset_index(drop=True)

    # Shuffle the dataset
    balanced_df = balanced_df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Split into features and labels
    X = balanced_df['URL']
    y = balanced_df['label']

    # Split the dataset into train, validation, and test sets
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.4, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )

    # Check for overlap between datasets
    train_urls = set(X_train)
    val_urls = set(X_val)
    test_urls = set(X_test)

    overlap_train_val = train_urls.intersection(val_urls)
    overlap_train_test = train_urls.intersection(test_urls)
    overlap_val_test = val_urls.intersection(test_urls)

    if overlap_train_val:
        print("Overlap between training and validation sets:", overlap_train_val)
    if overlap_train_test:
        print("Overlap between training and test sets:", overlap_train_test)
    if overlap_val_test:
        print("Overlap between validation and test sets:", overlap_val_test)

    # Ensure there is no overlap
    assert len(overlap_train_val) == 0, "Overlap found between training and validation sets."
    assert len(overlap_train_test) == 0, "Overlap found between training and test sets."
    assert len(overlap_val_test) == 0, "Overlap found between validation and test sets."

    # Save the datasets
    train_df = pd.DataFrame({'URL': X_train, 'label': y_train})
    val_df = pd.DataFrame({'URL': X_val, 'label': y_val})
    test_df = pd.DataFrame({'URL': X_test, 'label': y_test})

    train_df.to_csv(f"{output_dir}/train.csv", index=False)
    val_df.to_csv(f"{output_dir}/val.csv", index=False)
    test_df.to_csv(f"{output_dir}/test.csv", index=False)

    print("Datasets have been successfully saved.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Fetch and prepare the dataset.")
    parser.add_argument('--input_csv', type=str, default='../data/raw/PhiUSIIL_Phishing_URL_Dataset.csv', help='Input CSV file path')
    parser.add_argument('--output_dir', type=str, default='../data/processed', help='Output directory to save datasets')
    parser.add_argument('--limit', type=int, default=None, help='Limit for balancing classes')
    args = parser.parse_args()

    fetch_and_prepare_dataset(args.input_csv, args.output_dir, args.limit)
