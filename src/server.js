const express = require('express');
const app = express();
const port = 3000;
const phishingDetector = require('./phishingDetector');

app.use(express.static('public'));

app.get('/check', (req, res) => {
    const url = req.query.url;
    const result = phishingDetector.checkPhishing(url);
    res.json({ isPhishing: result });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
