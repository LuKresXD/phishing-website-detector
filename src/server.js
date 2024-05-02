// src/server.js

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const phishingDetector = require('./phishingDetector'); // Correct import of phishingDetector

app.use(express.static('public'));

app.get('/check', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required.' });
    }
    const isPhishing = await phishingDetector.checkPhishing(url);
    res.json({ isPhishing });
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
