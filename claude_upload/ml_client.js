import axios from 'axios';

const ML_SERVICE_URL = 'http://localhost:5000/predict';

function normalizeScore(score) {
    console.log('Normalizing score:', score);
    return Math.min(Math.max(score, 0), 100);
}

export async function predictPhishing(url) {
    try {
        console.log('Sending request to ML service for URL:', url);
        const response = await axios.post(ML_SERVICE_URL, { url }, { timeout: 5000 });
        console.log('Raw response from ML service:', response.data);

        if (response.data && typeof response.data.safetyScore === 'number') {
            const normalizedScore = normalizeScore(response.data.safetyScore);
            console.log('Normalized safety score:', normalizedScore);
            return {
                safetyScore: normalizedScore,
                result: normalizedScore >= 80 ? 'Safe' : normalizedScore >= 50 ? 'Moderate' : 'Dangerous'
            };
        } else {
            console.error('Invalid response structure from ML service:', response.data);
            throw new Error('Invalid response from ML service');
        }
    } catch (error) {
        console.error('Error in ML client:', error.message);
        throw error;
    }
}