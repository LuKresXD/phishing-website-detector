from imblearn.over_sampling import SMOTE
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
import pandas as pd
import os
import joblib

def train_model():
    # Load preprocessed datasets
    train = pd.read_csv("ml/data/train_processed.csv")
    val = pd.read_csv("ml/data/val_processed.csv")

    # Split features and labels
    X_train, y_train = train.drop(columns=["label"]), train["label"]
    X_val, y_val = val.drop(columns=["label"]), val["label"]

    # Balance the dataset using SMOTE
    smote = SMOTE(random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)

    # Train Logistic Regression model
    model = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
    model.fit(X_train_balanced, y_train_balanced)

    # Evaluate on validation set
    y_pred = model.predict(X_val)
    print("Validation Results:")
    print(classification_report(y_val, y_pred))

    # Save the model
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(model, "ml/models/logistic_model.joblib")
    print("Model saved!")

if __name__ == "__main__":
    train_model()
