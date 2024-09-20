import { extractFeatures } from '../../utils/featureExtractor';
import { predict } from '../../utils/simpleModel';
import { calculateSafetyScore } from '../../utils/safetyScore';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { url } = req.body;

            if (!url || typeof url !== 'string' || url.trim() === '') {
                return res.status(400).json({ error: 'Invalid or missing URL' });
            }

            const features = extractFeatures(url);
            const mlPrediction = predict(features);
            const safetyScore = calculateSafetyScore(features);

            // Combine ML prediction and safety score
            const combinedScore = (mlPrediction * 100 + safetyScore) / 2;

            let scanResult;
            if (combinedScore >= 80) {
                scanResult = 'Safe';
            } else if (combinedScore >= 60) {
                scanResult = 'Moderate';
            } else {
                scanResult = 'Dangerous';
            }

            res.status(200).json({
                result: scanResult,
                safetyScore: parseFloat(combinedScore.toFixed(2)),
                mlPrediction: parseFloat((mlPrediction * 100).toFixed(2)),
                url: url
            });
        } catch (error) {
            console.error('Custom scan error:', error);
            res.status(500).json({ error: 'Failed to perform custom scan', message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}