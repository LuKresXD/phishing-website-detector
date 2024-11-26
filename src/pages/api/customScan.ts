import { NextApiRequest, NextApiResponse } from 'next';
import { predict } from '../../utils/mlModel';
import { extractFeatures } from '../../utils/featureExtractor';
import cors from 'cors';

const corsMiddleware = cors({
    origin: ['http://localhost:3001', 'https://phishing.lukres.dev'],
    methods: ['POST'],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
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

        const { url } = req.body;

        if (!url || typeof url !== 'string' || url.trim() === '') {
            return res.status(400).json({ error: 'Invalid or missing URL' });
        }

        const result = await predict(url);
        const safetyScore = Math.round((1 - result.prediction) * 100);
        
        const response = {
            result: safetyScore >= 80 ? 'Safe' : safetyScore >= 60 ? 'Moderate' : 'Dangerous',
            safetyScore,
            confidence: Math.round(result.confidence * 100),
            features: result.features,
            url
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Custom scan error:', error);
        res.status(500).json({
            error: `An unexpected error occurred during the custom scan: ${error.message}`
        });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
}
