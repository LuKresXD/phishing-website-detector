import Scan from '../../models/Scan';

export default async (req, res) => {
    if (req.method === 'POST') {
        const { url } = req.body;
        const scanResult = await checkVirusTotal(url);

        await Scan.create({
            url: scanResult.url,
            result: scanResult.result
        });

        res.status(200).json(scanResult);
    } else {
        res.status(405).end();
    }
};
