import Cors from 'cors';
import { analyzeUrl } from '../../lib/mlScan';

// Initialize the CORS middleware
const cors = Cors({
    origin: ['http://localhost:3001', 'https://phishing.lukres.dev'],
    methods: ['POST'],
});

// Helper function to run middleware
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export default async function handler(req, res) {
    // Run the CORS middleware
    await runMiddleware(req, res, cors);

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        const { url } = req.body;

        if (!url || typeof url !== 'string' || url.trim() === '') {
            return res
                .status(400)
                .json({ error: 'Invalid or missing URL. Please provide a valid URL.' });
        }

        // Run the model in-process (formerly a Python/Flask sidecar on :5002).
        const data = await analyzeUrl(url.trim());

        return res.status(200).json({
            url: data.url,
            safetyScore: data.safetyScore,
            result: data.result,
            probabilities: data.probabilities,
        });
    } catch (error) {
        console.error('Custom scan error:', error);
        res.status(500).json({
            error: `An error occurred during prediction: ${error.message}. Please try again later.`,
        });
    }
}
