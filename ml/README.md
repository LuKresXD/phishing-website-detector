# Phishing Domain Detector

A machine learning model to detect phishing domains based on extracted domain-specific features. This project preprocesses domain data, trains a machine learning model, and provides tools for evaluating the performance and testing new domains.

## Features

- Preprocesses domain data and extracts key features such as:
   - **Domain Length**
   - **Number of Subdomains**
   - **Special Characters**
   - **Entropy**
   - **Phishing Keywords**
   - **Suspicious TLDs**
- Balances dataset using **SMOTE** to handle class imbalance.
- Trained with **Logistic Regression** for simplicity and interpretability.
- Provides tools for both **batch** and **single-domain** testing.

---

## Metrics

### Validation Performance

| Metric        | Legitimate (0) | Phishing (1) | Macro Avg | Weighted Avg |
|---------------|----------------|--------------|-----------|--------------|
| **Precision** | 0.95           | 0.58         | 0.76      | 0.89         |
| **Recall**    | 0.91           | 0.72         | 0.81      | 0.88         |
| **F1-Score**  | 0.93           | 0.64         | 0.78      | 0.88         |

### Feature Importance

The following features had the highest impact on predictions (Logistic Regression coefficients):

| Feature                   | Importance |
|---------------------------|------------|
| **Domain Length**         | 1.23       |
| **Entropy**               | 1.12       |
| **Has Suspicious TLD**    | 0.95       |
| **Number of Subdomains**  | 0.84       |
| **Contains Digits**       | 0.76       |

---

## Example Results

### Single Domain Testing

- **Domain**: `example.com`
   - **Prediction**: Legitimate
   - **Probability**: Legitimate=99.5%, Phishing=0.5%

- **Domain**: `phishing-site.tk`
   - **Prediction**: Phishing
   - **Probability**: Legitimate=1.2%, Phishing=98.8%

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/phishing-detector.git
   cd phishing-detector/ml
