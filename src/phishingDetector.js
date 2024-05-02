// src/phishingDetector.js

exports.checkPhishing = function(url) {
    // Enhanced heuristic and pattern checks for URL phishing
    const suspiciousPatterns = [
        /https?:\/\/(?:www\.)?paypal\.com\.[a-z]{2,}/i, // Fake PayPal domains
        /https?:\/\/(?:www\.)?[\w-]{5,30}-[a-z]{2,5}\.com/i, // Suspicious domain patterns
        /https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/, // IP address based URLs
        /https?:\/\/(?:www\.)?[a-zA-Z0-9-]{30,}\.com/ // Unusually long domain names
    ];
    return suspiciousPatterns.some(pattern => pattern.test(url));
};
