import axios from 'axios';
import cors from 'cors';

const ML_SERVER_PORT = process.env.ML_SERVER_PORT || 5002;
const ML_SERVER_URL = `http://127.0.0.1:${ML_SERVER_PORT}`;

const corsMiddleware = cors({
    origin: ['http://localhost:3001', 'https://phishing.lukres.dev'],
    methods: ['POST']
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

        try {
            console.log(`Calling ML server at ${ML_SERVER_URL}/api/customScan`);
            // Call Python ML server
            const mlResponse = await axios.post(`${ML_SERVER_URL}/api/customScan`, { url }, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (mlResponse.data && typeof mlResponse.data.safetyScore === 'number') {
                const response = {
                    result: mlResponse.data.result,
                    safetyScore: mlResponse.data.safetyScore,
                    probabilities: mlResponse.data.probabilities,
                    url: url
                };

                console.log('Sending response:', response);
                res.status(200).json(response);
            } else {
                console.error('Invalid response from ML server:', mlResponse.data);
                throw new Error('Invalid response from ML server');
            }
        } catch (error) {
            console.error('ML prediction error:', error);
            if (error.code === 'ECONNREFUSED') {
                res.status(503).json({
                    error: 'ML server is not running. Please ensure the Python server is started.'
                });
            } else {
                res.status(500).json({
                    error: `An error occurred during prediction: ${error.message}. Please try again later.`
                });
            }
        }
    } catch (error) {
        console.error('Custom scan error:', error);
        res.status(500).json({
            error: `An unexpected error occurred: ${error.message}. Please try again later.`
        });
    }
}