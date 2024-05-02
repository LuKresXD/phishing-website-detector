import express from 'express';
import { checkPhishing } from './phishingDetector.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/check', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required.' });
    }
    const { isPhishing, safetyScore } = await checkPhishing(url);
    res.json({ isPhishing, safetyScore });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
