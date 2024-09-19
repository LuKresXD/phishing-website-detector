# ml_service.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from feature_extraction import FeatureExtraction

app = Flask(__name__)
CORS(app)

def simple_classifier(features):
    # Simple rule-based classifier
    score = sum(features) / len(features)  # Average of all features
    if score > 0.6:
        return "Safe", score * 100
    elif score > 0.4:
        return "Moderate", score * 100
    else:
        return "Phishing", (1 - score) * 100

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    url = data['url']

    try:
        feature_extractor = FeatureExtraction(url)
        features = feature_extractor.getFeaturesList()

        result, safety_score = simple_classifier(features)

        return jsonify({
            'result': result,
            'safetyScore': round(safety_score, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)