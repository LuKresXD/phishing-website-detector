// Basic heuristic checks for URL phishing
exports.checkPhishing = function(url) {
    // Simple heuristic: check if URL contains suspicious strings
    const suspiciousPatterns = ['login', 'verify', 'account', 'secure', 'banking'];
    return suspiciousPatterns.some(pattern => url.includes(pattern));
};
