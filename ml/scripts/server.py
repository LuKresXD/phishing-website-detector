from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os
import logging

from preprocess import extract_features

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = ['https://phishing.lukres.dev', 'http://localhost:3001']
CORS(app, resources={r"/api/*": {"origins": cors_origins}})

# Load scaler and model at startup
model_path = '../models/logistic_model.pkl'
scaler_path = '../models/scaler.pkl'

try:
    scaler = joblib.load(scaler_path)
    model = joblib.load(model_path)
    print("Model and scaler loaded successfully.")
except Exception as e:
    print(f"Error loading model or scaler: {e}")
    scaler = None
    model = None

@app.route('/api/customScan', methods=['POST'])
def custom_scan():
    if not request.is_json:
        return jsonify({'error': 'Invalid input format. JSON expected.'}), 400
    
    data = request.get_json()
    url = data.get('url', '').strip()
    
    if not url:
        return jsonify({'error': 'URL is required.'}), 400
    
    try:
        # Extract features
        row = {'URL': url, 'label': -1}
        features = extract_features(row)
        
        # Check if feature extraction was successful
        if features is None or not features:
            raise ValueError("Feature extraction failed.")
        
        features_df = pd.DataFrame([features])
        feature_columns = features_df.columns.drop('label')
        features_df[feature_columns] = features_df[feature_columns].replace([np.inf, -np.inf], np.nan).fillna(-1)
        
        # Normalize features
        features_df[feature_columns] = scaler.transform(features_df[feature_columns])
        
        # Make prediction
        prediction = model.predict(features_df[feature_columns])[0]
        probabilities = model.predict_proba(features_df[feature_columns])[0]
        
        # Calculate safety score (0 to 100)
        safetyScore = int(probabilities[1] * 100)
        if safetyScore >= 70:
            result_text = 'Safe'
        elif safetyScore >= 40:
            result_text = 'Moderate'
        else:
            result_text = 'Dangerous'
        
        response = {
            'url': url,
            'safetyScore': safetyScore,
            'result': result_text,
            'probabilities': {
                'phishing': float(probabilities[0]),
                'legitimate': float(probabilities[1])
            },
            'prediction': 'Legitimate' if prediction == 1 else 'Phishing'
        }
        
        return jsonify(response), 200
    except Exception as e:
        logging.exception("Error during prediction.")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('ML_SERVER_PORT', 5002))
    app.run(host='0.0.0.0', port=port)
