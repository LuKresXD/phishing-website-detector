import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import json
import os
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
    precision_recall_curve,
    average_precision_score,
)
from sklearn.preprocessing import label_binarize

def evaluate_model(test_csv, model_path, scaler_path, output_dir):
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Load test dataset
    test_df = pd.read_csv(test_csv)
    X_test = test_df.drop('label', axis=1)
    y_test = test_df['label']

    # Load scaler and model
    scaler = joblib.load(scaler_path)
    model = joblib.load(model_path)

    # Normalize features
    X_test_scaled = scaler.transform(X_test)

    # Make predictions
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)

    # Classification report
    report = classification_report(y_test, y_pred, output_dict=True)
    print("Classification Report:\n", classification_report(y_test, y_pred))

    # Save classification report to JSON
    metrics = {'classification_report': report}

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Phishing', 'Legitimate'], yticklabels=['Phishing', 'Legitimate'])
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.savefig(os.path.join(output_dir, 'confusion_matrix.png'))
    plt.close()
    print("Confusion matrix saved.")

    # Save confusion matrix data
    metrics['confusion_matrix'] = cm.tolist()

    # ROC Curve and AUC
    n_classes = len(np.unique(y_test))
    if n_classes == 2:
        # For binary classification
        fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba[:, 1])
        roc_auc = auc(fpr, tpr)
        plt.figure()
        plt.plot(fpr, tpr, label=f'ROC curve (AUC = {roc_auc:.2f})', color='darkorange', lw=2)
        plt.plot([0, 1], [0, 1], 'k--', lw=2)
        plt.title('Receiver Operating Characteristic')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.legend(loc="lower right")
        plt.savefig(os.path.join(output_dir, 'roc_curve.png'))
        plt.close()
        print("ROC curve saved.")

        # Save AUC value
        metrics['roc_auc'] = roc_auc
    else:
        # For multiclass classification
        y_test_binarized = label_binarize(y_test, classes=np.unique(y_test))
        fpr = dict()
        tpr = dict()
        roc_auc = dict()
        for i in range(n_classes):
            fpr[i], tpr[i], _ = roc_curve(y_test_binarized[:, i], y_pred_proba[:, i])
            roc_auc[i] = auc(fpr[i], tpr[i])
            plt.plot(fpr[i], tpr[i], label=f'Class {i} (AUC = {roc_auc[i]:.2f})')
        plt.plot([0, 1], [0, 1], 'k--')
        plt.title('ROC Curve')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.legend()
        plt.savefig(os.path.join(output_dir, 'roc_curve.png'))
        plt.close()
        print("ROC curve saved.")

        # Save AUC values
        metrics['roc_auc'] = roc_auc

    # Precision-Recall Curve
    if n_classes == 2:
        # For binary classification
        precision, recall, thresholds = precision_recall_curve(y_test, y_pred_proba[:, 1])
        average_precision = average_precision_score(y_test, y_pred_proba[:, 1])
        plt.figure()
        plt.plot(recall, precision, label=f'AP = {average_precision:.2f}', lw=2)
        plt.title('Precision-Recall Curve')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.legend()
        plt.savefig(os.path.join(output_dir, 'precision_recall_curve.png'))
        plt.close()
        print("Precision-Recall curve saved.")

        # Save average precision value
        metrics['average_precision'] = average_precision
    else:
        # For multiclass classification
        precision = dict()
        recall = dict()
        average_precision = dict()
        for i in range(n_classes):
            precision[i], recall[i], _ = precision_recall_curve(y_test_binarized[:, i], y_pred_proba[:, i])
            average_precision[i] = average_precision_score(y_test_binarized[:, i], y_pred_proba[:, i])
            plt.plot(recall[i], precision[i], label=f'Class {i} (AP = {average_precision[i]:.2f})')
        plt.title('Precision-Recall Curve')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.legend()
        plt.savefig(os.path.join(output_dir, 'precision_recall_curve.png'))
        plt.close()
        print("Precision-Recall curve saved.")

        # Save average precision values
        metrics['average_precision'] = average_precision

    # Feature Importance
    feature_names = X_test.columns
    coefficients = model.coef_[0]
    feature_importance = pd.DataFrame({
        'Feature': feature_names,
        'Coefficient': coefficients,
        'Importance': np.abs(coefficients)
    })
    feature_importance = feature_importance.sort_values(by='Importance', ascending=False)

    # Save feature importance data
    metrics['feature_importance'] = feature_importance[['Feature', 'Coefficient']].to_dict(orient='records')

    # Plot top 10 features
    plt.figure(figsize=(10, 6))
    sns.barplot(data=feature_importance.head(10), x='Importance', y='Feature', orient='h')
    plt.title('Top 10 Most Important Features')
    plt.xlabel('Coefficient Magnitude')
    plt.ylabel('Feature')
    plt.savefig(os.path.join(output_dir, 'top_10_features.png'))
    plt.close()
    print("Top 10 feature importance plot saved.")

    # Plot all features
    plt.figure(figsize=(10, 8))
    sns.barplot(data=feature_importance, x='Importance', y='Feature', orient='h')
    plt.title('Feature Importance')
    plt.xlabel('Coefficient Magnitude')
    plt.ylabel('Feature')
    plt.savefig(os.path.join(output_dir, 'feature_importance.png'))
    plt.close()
    print("All feature importance plot saved.")

    # Error Analysis
    misclassified = test_df[y_test != y_pred]
    misclassified['Predicted'] = y_pred[y_test != y_pred]
    misclassified.to_csv(os.path.join(output_dir, 'misclassified_samples.csv'), index=False)
    print("Misclassified samples saved.")

    # Dataset Overview
    class_distribution = y_test.value_counts().to_dict()
    metrics['class_distribution'] = class_distribution
    print("Class distribution:", class_distribution)

    # Save metrics to JSON
    with open(os.path.join(output_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=4)
    print("Metrics saved to metrics.json.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate the trained logistic regression model.")
    parser.add_argument('--test_csv', type=str, default='../data/processed/test_processed.csv', help='Processed test CSV file path')
    parser.add_argument('--model_path', type=str, default='../models/logistic_model.pkl', help='Path to the trained model')
    parser.add_argument('--scaler_path', type=str, default='../models/scaler.pkl', help='Path to the saved scaler')
    parser.add_argument('--output_dir', type=str, default='../docs/assets', help='Directory to save evaluation outputs')
    args = parser.parse_args()

    evaluate_model(args.test_csv, args.model_path, args.scaler_path, args.output_dir)
