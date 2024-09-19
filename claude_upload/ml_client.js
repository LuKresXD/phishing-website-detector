import axios from 'axios';

const ML_SERVICE_URL = 'http://localhost:5000/predict';

export async function predictPhishing(url) {
    try {
        const response = await axios.post(ML_SERVICE_URL, { url });
        return response.data;
    } catch (error) {
        console.error('Error calling ML service:', error);
        throw error;
    }
}