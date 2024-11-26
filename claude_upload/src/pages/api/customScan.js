import { extractFeatures } from '../../utils/featureExtractor';
import { predict } from '../../utils/simpleModel';
import { calculateSafetyScore } from '../../utils/safetyScore';
import cors from 'cors';

const corsMiddleware = cors({
    origin: ['http://localhost:3001', 'https://phishing.lukres.dev'],
    methods: ['POST'],
});

export default async function handler(req, res) {
    await new Promise((resolve, reject) => {
        corsMiddleware(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        console.log('Received request:', req.body);
        const { url } = req.body;

        if (!url || typeof url !== 'string' || url.trim() === '') {
            return res.status(400).json({ error: 'Invalid or missing URL. Please provide a valid URL.' });
        }

        let features;
        try {
            features = extractFeatures(url);
        } catch (error) {
            console.error('Feature extraction error:', error);
            return res.status(400).json({ error: `Failed to extract features from the provided URL: ${error.message}. Please check the URL and try again.` });
        }

        let mlPrediction;
        try {
            mlPrediction = predict(features);
        } catch (error) {
            console.error('ML prediction error:', error);
            return res.status(500).json({ error: `An error occurred during the machine learning prediction: ${error.message}. Please try again later.` });
        }

        let safetyScore;
        try {
            safetyScore = calculateSafetyScore(features);
        } catch (error) {
            console.error('Safety score calculation error:', error);
            return res.status(500).json({ error: `An error occurred while calculating the safety score: ${error.message}. Please try again later.` });
        }

        const combinedScore = (mlPrediction * 100 + safetyScore) / 2;

        let scanResult;
        if (combinedScore >= 80) {
            scanResult = 'Safe';
        } else if (combinedScore >= 60) {
            scanResult = 'Moderate';
        } else {
            scanResult = 'Dangerous';
        }

        const response = {
            result: scanResult,
            safetyScore: parseFloat(combinedScore.toFixed(2)),
            mlPrediction: parseFloat((mlPrediction * 100).toFixed(2)),
            url: url
        };

        console.log('Sending response:', response);
        res.status(200).json(response);
    } catch (error) {
        console.error('Custom scan error:', error);
        res.status(500).json({ error: `An unexpected error occurred during the custom scan: ${error.message}. Please try again later.` });
    }
}