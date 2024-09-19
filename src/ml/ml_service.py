# ml_service.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from feature_extraction import FeatureExtraction

app = Flask(__name__)
CORS(app)

def simple_classifier(features):
    # Convert features to 1 (good) and -1 (bad)
    normalized_features = [1 if f > 0 else -1 for f in features]

    # Calculate the score as a percentage of positive features
    score = (sum(normalized_features) + len(normalized_features)) / (2 * len(normalized_features)) * 100

    if score < 50:
        return "Dangerous", score
    elif score < 80:
        return "Moderate", score
    else:
        return "Safe", score

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
        app.logger.error(f"Error processing URL {url}: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)