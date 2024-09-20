import { predictPhishing } from '@/utils/ml_client';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { url } = req.body;

            if (!url || typeof url !== 'string' || url.trim() === '') {
                return res.status(400).json({ error: 'Invalid or missing URL' });
            }

            const result = await predictPhishing(url);

            // Ensure the safety score is a number and within the correct range
            const safetyScore = typeof result.safetyScore === 'number' ? result.safetyScore : 0;
            const normalizedScore = Math.min(Math.max(safetyScore, 0), 100);

            // Determine the result based on the normalized score
            let scanResult;
            if (normalizedScore >= 80) {
                scanResult = 'Safe';
            } else if (normalizedScore >= 50) {
                scanResult = 'Moderate';
            } else {
                scanResult = 'Dangerous';
            }

            res.status(200).json({
                result: scanResult,
                safetyScore: normalizedScore,
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