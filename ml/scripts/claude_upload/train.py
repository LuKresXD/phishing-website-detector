import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from imblearn.over_sampling import SMOTE
import joblib

def train_model(train_csv, val_csv, model_path):
    # Load datasets
    train_df = pd.read_csv(train_csv)
    val_df = pd.read_csv(val_csv)

    # Separate features and labels
    X_train = train_df.drop('label', axis=1)
    y_train = train_df['label']
    X_val = val_df.drop('label', axis=1)
    y_val = val_df['label']

    # Apply SMOTE to balance the training data
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

    # Initialize and train the Logistic Regression model
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_resampled, y_train_resampled)

    # Evaluate the model on the validation set
    y_pred = model.predict(X_val)
    report = classification_report(y_val, y_pred)
    print("Validation Classification Report:\n", report)

    # Print confusion matrix
    cm = confusion_matrix(y_val, y_pred)
    print("Confusion Matrix:\n", cm)

    # Analyze feature importances
    import numpy as np
    feature_names = X_train.columns
    coefficients = model.coef_[0]
    feature_importance = pd.DataFrame({
        'Feature': feature_names,
        'Coefficient': coefficients,
        'Abs_Coefficient': np.abs(coefficients)
    })
    feature_importance = feature_importance.sort_values(by='Abs_Coefficient', ascending=False)
    print("Feature Importances:\n", feature_importance[['Feature', 'Coefficient']])

    # Save the model
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train the Logistic Regression model.")
    parser.add_argument('--train_csv', type=str, default='../data/processed/train_processed.csv', help='Processed training CSV file path')
    parser.add_argument('--val_csv', type=str, default='../data/processed/val_processed.csv', help='Processed validation CSV file path')
    parser.add_argument('--model_path', type=str, default='../models/logistic_model.pkl', help='Path to save the trained model')
    args = parser.parse_args()

    train_model(args.train_csv, args.val_csv, args.model_path)
