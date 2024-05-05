import Scan from '../../../models/Scan';

export default async (req, res) => {
    const scans = await Scan.findAll({
        order: [['date', 'DESC']]
    });
    res.status(200).json(scans);
};
