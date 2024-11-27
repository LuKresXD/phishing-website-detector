import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from preprocess import extract_features
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["https://phishing.lukres.dev", "http://localhost:3001"],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Define port
PORT = int(os.getenv('ML_SERVER_PORT', 5002))

try:
    # Load the model
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'logistic_model.joblib')
    logger.info(f"Looking for model at: {model_path}")

    if not os.path.exists(model_path):
        logger.error(f"Model file not found at {model_path}")
        raise FileNotFoundError(f"Model file not found at {model_path}")

    model = joblib.load(model_path)

    # Load scaler parameters
    scaler_mean_path = os.path.join(os.path.dirname(__file__), 'models', 'scaler_mean.csv')
    scaler_std_path = os.path.join(os.path.dirname(__file__), 'models', 'scaler_std.csv')

    logger.info(f"Looking for scaler files at: {scaler_mean_path} and {scaler_std_path}")

    scaler_mean = pd.read_csv(scaler_mean_path, index_col=0).squeeze("columns")
    scaler_std = pd.read_csv(scaler_std_path, index_col=0).squeeze("columns")

    logger.info("Model and scalers loaded successfully")
except Exception as e:
    logger.error(f"Error loading model or scalers: {e}")
    raise

def extract_domain(url):
    """Extract the domain from a given URL."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        domain = domain.lower().strip()
        if domain.startswith("www."):
            domain = domain[4:]  # Remove "www." if present
        return domain
    except Exception as e:
        print(f"Error parsing URL {url}: {e}")
        return None

@app.route('/api/customScan', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        url = data.get('url')
        url = extract_domain(url)

        if not url:
            return jsonify({'error': 'No URL provided'}), 400

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
    # Changed to bind to all interfaces
    app.run(host='0.0.0.0', port=PORT)