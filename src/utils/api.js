import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function callAPIWithRetry(url, method, data = null, headers = {}) {
    let lastError;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await axios({
                url,
                method,
                data,
                headers,
                timeout: 10000 // 10 seconds timeout
            });
            return response.data;
        } catch (error) {
            console.error(`API call attempt ${i + 1} failed:`, error.message);
            lastError = error;
            if (error.response && error.response.status === 504) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                break;
            }
        }
    }

    throw lastError;
}

export function isAPIAvailable() {
    // This function would make a simple call to your API to check if it's responding
    return callAPIWithRetry('/api/health', 'GET')
        .then(() => true)
        .catch(() => false);
}