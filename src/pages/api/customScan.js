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
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        console.log('Received request:', req.body);
        const { url } = req.body;

        if (!url || typeof url !== 'string' || url.trim() === '') {
            return res.status(400).json({ error: 'Invalid or missing URL' });
        }

        const features = extractFeatures(url);
        const mlPrediction = predict(features);
        const safetyScore = calculateSafetyScore(features);

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
        res.status(500).json({ error: 'Failed to perform custom scan', message: error.message });
    }
}