from sklearn.metrics import classification_report
import pandas as pd
import joblib

def evaluate_model():
    # Load test dataset
    test = pd.read_csv("ml/data/test_processed.csv")
    X_test, y_test = test.drop(columns=["label"]), test["label"]

    # Load the trained model
    model = joblib.load("ml/models/logistic_model.joblib")

    # Predict on the test set
    y_pred = model.predict(X_test)

    # Display classification report
    print("Test Results:")
    print(classification_report(y_test, y_pred))

if __name__ == "__main__":
    evaluate_model()
