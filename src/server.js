const express = require('express');
const app = express();
const port = process.env.PORT || 3000;  // Allow port to be set by environment or default to 3000

// Serve static files from the 'public' directory
app.use(express.static('public'));

// API endpoint for checking URLs
app.get('/check', (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required.' });
    }
    const isPhishing = phishingDetector.checkPhishing(url);
    res.json({ isPhishing });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
