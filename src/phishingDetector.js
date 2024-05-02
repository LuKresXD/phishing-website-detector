import fetch from 'node-fetch';

async function checkPhishing(url) {
    try {
        const apiResponse = await fetch(`https://api.example.com/check?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer YOUR_API_KEY'}
        });
        const jsonResponse = await apiResponse.json();
        const safetyScore = jsonResponse.safetyScore;
        return { isPhishing: safetyScore < 50, safetyScore };
    } catch (error) {
        console.error('Failed to fetch from ML API:', error);
        return { isPhishing: false, safetyScore: 100 };
    }
}

export { checkPhishing };
