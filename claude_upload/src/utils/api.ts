import axios from 'axios';

const api = axios.create({
    timeout: 30000, // 30 seconds default timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

interface ApiError extends Error {
    code?: string;
    response?: {
        status: number;
        data?: any;
    };
}

export async function sendUrlToVirusTotal(url: string) {
    try {
        const response = await api.post('/api/proxy', { url }, {
            timeout: 60000 // 60 seconds for initial scan
        });

        if (response.data?.data?.id) {
            return response.data.data.id;
        }
        throw new Error('Invalid response from VirusTotal API');
    } catch (error) {
        const apiError = error as ApiError;
        if (apiError.code === 'ECONNABORTED' || apiError.response?.status === 504) {
            throw new Error('The scan request timed out. The server might be busy, please try again.');
        }

        if (apiError.response) {
            switch (apiError.response.status) {
                case 400:
                    throw new Error('Invalid URL format. Please check the URL and try again.');
                case 401:
                    throw new Error('API authentication failed. Please try again later.');
                case 429:
                    throw new Error('Too many requests. Please wait a moment and try again.');
                default:
                    throw new Error('An error occurred while scanning. Please try again later.');
            }
        }

        throw new Error('Network error. Please check your connection and try again.');
    }
}

export async function waitForAnalysisCompletion(analysisId: string, maxAttempts = 30) {
    const delayBetweenAttempts = 2000; // 2 seconds
    let attempt = 0;

    while (attempt < maxAttempts) {
        try {
            const response = await api.get(`/api/proxy?id=${analysisId}`, {
                timeout: 10000 // 10 seconds for status checks
            });

            if (response.data?.data?.attributes?.status === 'completed') {
                return response.data;
            }

            // If not completed, wait before next attempt
            await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
            attempt++;

        } catch (error) {
            const apiError = error as ApiError;
            if (apiError.code === 'ECONNABORTED') {
                throw new Error('Status check timed out. The server might be busy.');
            }

            if (attempt === maxAttempts - 1) {
                throw new Error('Analysis is taking too long. Please try again later.');
            }

            // Wait before retry on error
            await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        }
    }

    throw new Error('Analysis timed out. Please try again later.');
}