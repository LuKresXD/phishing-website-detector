import { predictPhishing } from '@/utils/ml_client';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { url } = req.body;

            if (!url) {
                throw new Error('URL is required');
            }

            const result = await predictPhishing(url);

            res.status(200).json(result);
        } catch (error) {
            console.error('Custom scan error:', error);
            res.status(500).json({ error: 'Failed to perform custom scan', message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}