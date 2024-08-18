import Scan from '../../../models/Scan';
import { stringify } from 'csv-stringify/sync';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const scans = await Scan.findAll({
                order: [['date', 'DESC']],
                attributes: ['url', 'result', 'date', 'safetyScore'] // Include safetyScore
            });

            const data = scans.map(scan => ({
                url: scan.url,
                result: scan.result,
                date: scan.date.toISOString(),
                safetyScore: scan.safetyScore !== null ? scan.safetyScore.toFixed(1) : 'N/A'
            }));

            const csv = stringify(data, {
                header: true,
                columns: {
                    url: 'URL',
                    result: 'Result',
                    date: 'Date',
                    safetyScore: 'Safety Score'
                }
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=scan_history.csv');
            res.status(200).send(csv);
        } catch (error) {
            console.error('Failed to export history:', error);
            res.status(500).json({ error: 'Failed to export history' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}