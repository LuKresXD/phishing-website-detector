import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve,
    auc,
    precision_recall_curve
)
import matplotlib.pyplot as plt
import seaborn as sns


def save_plot(fig, filepath):
    """Helper function to save plots with tight layout."""
    fig.tight_layout()
    fig.savefig(filepath)
    plt.close(fig)


def generate_metrics():
    """Generate detailed metrics and visualizations for documentation."""
    # Load test dataset
    test = pd.read_csv("ml/data/test_processed.csv")
    X_test, y_test = test.drop(columns=["label"]), test["label"]

    # Load the trained model
    model = joblib.load("ml/models/logistic_model.joblib")

    # Get predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    # Calculate metrics
    report = classification_report(y_test, y_pred, output_dict=True)

    # Generate confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    os.makedirs("docs/assets", exist_ok=True)

    # Plot confusion matrix
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
    ax.set_title('Confusion Matrix')
    ax.set_ylabel('True Label')
    ax.set_xlabel('Predicted Label')
    save_plot(fig, 'docs/assets/confusion_matrix.png')

    # Plot ROC curves
    fpr = dict()
    tpr = dict()
    roc_auc = dict()
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.plot([0, 1], [0, 1], 'k--', label="Random Guess")
    for i in range(len(np.unique(y_test))):
        fpr[i], tpr[i], _ = roc_curve(y_test == i, y_prob[:, i])
        roc_auc[i] = auc(fpr[i], tpr[i])
        ax.plot(fpr[i], tpr[i], label=f'Class {i} (AUC = {roc_auc[i]:.2f})')
    ax.set_title('ROC Curves')
    ax.set_xlabel('False Positive Rate')
    ax.set_ylabel('True Positive Rate')
    ax.legend()
    save_plot(fig, 'docs/assets/roc_curve.png')

    # Plot Precision-Recall curves
    precision = dict()
    recall = dict()
    fig, ax = plt.subplots(figsize=(10, 8))
    for i in range(len(np.unique(y_test))):
        precision[i], recall[i], _ = precision_recall_curve(y_test == i, y_prob[:, i])
        ax.plot(recall[i], precision[i], label=f'Class {i}')
    ax.set_title('Precision-Recall Curves')
    ax.set_xlabel('Recall')
    ax.set_ylabel('Precision')
    ax.legend()
    save_plot(fig, 'docs/assets/precision_recall_curve.png')

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X_test.columns,
        'importance': np.abs(model.coef_[0])
    }).sort_values('importance', ascending=False)
    feature_importance.to_csv("docs/assets/feature_importance.csv", index=False)

    fig, ax = plt.subplots(figsize=(12, 6))
    sns.barplot(data=feature_importance.head(10), x='importance', y='feature', ax=ax)
    ax.set_title('Top 10 Feature Importance')
    ax.set_xlabel('Absolute Coefficient Value')
    save_plot(fig, 'docs/assets/feature_importance.png')

    # Plot all features
    fig, ax = plt.subplots(figsize=(12, len(feature_importance) * 0.3))
    sns.barplot(data=feature_importance, x='importance', y='feature', ax=ax)
    ax.set_title('Feature Importance (All Features)')
    ax.set_xlabel('Absolute Coefficient Value')
    save_plot(fig, 'docs/assets/feature_importance_all.png')

    # Error analysis: Misclassified samples
    misclassified = X_test[(y_test != y_pred)]
    misclassified['true_label'] = y_test[y_test != y_pred]
    misclassified['predicted_label'] = y_pred[y_test != y_pred]
    misclassified.to_csv("docs/assets/misclassified_samples.csv", index=False)

    # Dataset overview
    class_distribution = y_test.value_counts().to_dict()

    return {
        'metrics': report,
        'feature_importance': feature_importance.to_dict(),
        'roc_auc': roc_auc,
        'class_distribution': class_distribution
    }


if __name__ == "__main__":
    metrics = generate_metrics()

    # Save metrics to JSON for README generation
    with open('docs/metrics.json', 'w') as f:
        json.dump(metrics, f, indent=4)
