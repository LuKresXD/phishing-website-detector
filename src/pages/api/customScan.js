// File: pages/api/customScan.js

import { URL } from 'url';

// Helper functions for feature extraction
function countSpecialCharacters(str) {
    return (str.match(/[^a-zA-Z0-9]/g) || []).length;
}

function ensureProtocol(url) {
    if (!/^https?:\/\//i.test(url)) {
        return `http://${url}`;
    }
    return url;
}

function hasIPAddress(str) {
    return /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(str);
}

function hasSuspiciousKeywords(str) {
    const keywords = ['secure', 'account', 'banking', 'login', 'verify'];
    return keywords.some(keyword => str.toLowerCase().includes(keyword));
}

function calculateUrlLength(url) {
    return url.length;
}

// Custom model for phishing detection
function customPhishingModel(url) {
    try {
        let score = 100;
        const parsedUrl = new URL(ensureProtocol(url));

        // Check for special characters in domain
        const specialCharsCount = (parsedUrl.hostname.match(/[^a-zA-Z0-9.-]/g) || []).length;
        score -= specialCharsCount * 3;

        // Check for IP address instead of domain name
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname)) {
            score -= 20;
        }

        // Check for suspicious keywords
        const suspiciousKeywords = ['secure', 'account', 'banking', 'login', 'verify'];
        if (suspiciousKeywords.some(keyword => parsedUrl.hostname.includes(keyword) || parsedUrl.pathname.includes(keyword))) {
            score -= 15;
        }

        // Check URL length
        const urlLength = url.length;
        if (urlLength > 75) {
            score -= Math.min(20, (urlLength - 75) / 2);
        }

        // Check for HTTPS
        if (parsedUrl.protocol === 'https:') {
            score += 5;
        } else {
            score -= 5;
        }

        // Ensure score is between 0 and 100
        score = Math.max(0, Math.min(100, score));

        // Determine result based on score
        let result;
        if (score < 50) {
            result = 'Dangerous';
        } else if (score < 80) {
            result = 'Moderate';
        } else {
            result = 'Safe';
        }

        return { score, result };
    } catch (error) {
        console.error('Error in customPhishingModel:', error);
        return { score: 0, result: 'Error', message: error.message };
    }
}

export default function handler(req, res) {
    console.log("Custom scan API route hit");
    if (req.method === 'POST') {
        try {
            const { url } = req.body;

            if (!url) {
                throw new Error('URL is required');
            }

            console.log("Scanning URL:", url);

            // Apply the custom phishing model
            const { score, result, message } = customPhishingModel(url);

            console.log("Scan result:", { result, safetyScore: score, message });

            res.status(200).json({ result, safetyScore: score, message });
        } catch (error) {
            console.error('Custom scan error:', error);
            res.status(500).json({ error: 'Failed to perform custom scan', message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}