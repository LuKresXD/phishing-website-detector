const url = require('url');

function extractFeatures(urlString) {
    const parsedUrl = new URL(urlString);
    return {
        usingIp: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(parsedUrl.hostname) ? 1 : 0,
        urlLength: urlString.length,
        abnormalUrl: parsedUrl.hostname.includes(parsedUrl.pathname.split('/')[1]) ? 0 : 1,
        prefixSuffix: parsedUrl.hostname.includes('-') ? 1 : 0,
        subDomains: parsedUrl.hostname.split('.').length - 1,
        httpsProtocol: parsedUrl.protocol === "https:" ? 1 : 0,
        nonStdPort: (parsedUrl.port && parsedUrl.port !== "80" && parsedUrl.port !== "443") ? 1 : 0,
    };
}

module.exports = { extractFeatures };