import Scan from '../../../models/Scan';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { url, virusTotal, custom } = req.body;
        console.log('Received scan data:', { url, virusTotal, custom });
        try {
            const scan = await Scan.create({
                url,
                virusTotalResult: virusTotal.result,
                virusTotalSafetyScore: virusTotal.safetyScore,
                customResult: custom.result,
                customSafetyScore: custom.safetyScore,
                date: new Date()
            });
            console.log('Saved scan:', scan.toJSON());
            res.status(201).send({ message: 'Scan saved' });
        } catch (error) {
            console.error('Failed to save scan:', error);
            res.status(500).send({ error: 'Failed to save scan' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}