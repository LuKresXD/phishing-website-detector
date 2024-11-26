import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from preprocess import extract_features
import logging
from urllib.parse import unquote

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Define port
PORT = int(os.getenv('ML_SERVER_PORT', 5002))

# Load the model
try:
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'logistic_model.joblib')
    model = joblib.load(model_path)

    # Load scaler parameters
    scaler_mean = pd.read_csv(os.path.join(os.path.dirname(__file__), 'models', 'scaler_mean.csv'), index_col=0).squeeze("columns")
    scaler_std = pd.read_csv(os.path.join(os.path.dirname(__file__), 'models', 'scaler_std.csv'), index_col=0).squeeze("columns")

    logger.info("Model and scalers loaded successfully")
except Exception as e:
    logger.error(f"Error loading model or scalers: {e}")
    raise

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        url = data.get('url')

        if not url:
            return jsonify({'error': 'No URL provided'}), 400

        # URL decode if needed
        url = unquote(url)
        logger.info(f"Processing URL: {url}")

        # Extract features
        features = extract_features(url)
        logger.info(f"Extracted features: {features}")
        feature_vector = pd.DataFrame([features])

        # Normalize features
        feature_vector = (feature_vector - scaler_mean) / scaler_std
        feature_vector = feature_vector.fillna(0)  # Replace NaN with 0

        # Get prediction and probability
        prediction = model.predict(feature_vector)[0]
        probabilities = model.predict_proba(feature_vector)[0]

        # Calculate safety score (100 for legitimate, 0 for phishing)
        safety_score = round(probabilities[0] * 100, 2)

        # Determine result text
        if safety_score >= 80:
            result = "Safe"
        elif safety_score >= 60:
            result = "Moderate"
        else:
            result = "Dangerous"

        response_data = {
            'result': result,
            'safetyScore': safety_score,
            'url': url,
            'probabilities': {
                'legitimate': round(probabilities[0] * 100, 2),
                'phishing': round(probabilities[1] * 100, 2)
            }
        }
        logger.info(f"Prediction response: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Starting server on port {PORT}")
    app.run(host='127.0.0.1', port=PORT)