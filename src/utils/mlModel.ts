import * as tf from '@tensorflow/tfjs';
import { extractFeatures } from './featureExtractor';

let model: tf.LayersModel | null = null;
let modelMetadata: any = null;

export async function loadModel() {
    if (!model) {
        try {
            model = await tf.loadLayersModel('/models/tf_model/model.json');
            const response = await fetch('/models/model_metadata.json');
            modelMetadata = await response.json();
        } catch (error) {
            console.error('Error loading model:', error);
            throw new Error('Failed to load ML model');
        }
    }
    return { model, modelMetadata };
}

export async function predict(url: string): Promise<{
    prediction: number;
    confidence: number;
    features: Record<string, number>;
}> {
    try {
        const { model, modelMetadata } = await loadModel();
        
        // Extract features
        const features = extractFeatures(url);
        
        // Convert features to tensor
        const featureArray = modelMetadata.feature_names.map(
            (name: string) => features[name] || 0
        );
        const inputTensor = tf.tensor2d([featureArray]);
        
        // Make prediction
        const prediction = model.predict(inputTensor) as tf.Tensor;
        const probabilitiesArray = await prediction.data();
        
        // Cleanup
        inputTensor.dispose();
        prediction.dispose();
        
        return {
            prediction: probabilitiesArray[1], // Probability of being phishing
            confidence: Math.max(...probabilitiesArray),
            features
        };
    } catch (error) {
        console.error('Prediction error:', error);
        throw new Error('Failed to make prediction');
    }
}
