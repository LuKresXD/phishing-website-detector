import axios from 'axios';

const ML_SERVICE_URL = 'http://localhost:5000/predict';

function normalizeScore(score) {
    return Math.min(Math.max(score, 0), 100);
}

export async function predictPhishing(url) {
    try {
        const response = await axios.post(ML_SERVICE_URL, { url }, { timeout: 5000 });

        if (response.data && typeof response.data.safetyScore === 'number') {
            response.data.safetyScore = normalizeScore(response.data.safetyScore);
        }

        return response.data;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Error connecting to ML service:', error.message);
            throw new Error('ML service is not available. Please ensure it is running on localhost:5000.');
        } else if (error.response) {
            console.error('ML service responded with an error:', error.response.data);
            throw new Error(`ML service error: ${error.response.data.error || 'Unknown error'}`);
        } else if (error.request) {
            console.error('No response received from ML service:', error.message);
            throw new Error('No response received from ML service. Please check its status.');
        } else {
            console.error('Error in ML client:', error.message);
            throw error;
        }
    }
}