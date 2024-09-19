import joblib

class PhishingDetectionModel:
    def __init__(self, model_path):
        self.model = joblib.load(model_path)

    def predict(self, features):
        return self.model.predict(features)

    def predict_proba(self, features):
        return self.model.predict_proba(features)