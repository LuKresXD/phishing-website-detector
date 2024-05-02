const fetch = require('node-fetch');

exports.checkPhishing = async function(url) {
    try {
        const apiResponse = await fetch(`https://api.example.com/check?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer YOUR_API_KEY'}
        });
        const jsonResponse = await apiResponse.json();
        return jsonResponse.isPhishing;
    } catch (error) {
        console.error('Failed to fetch from ML API:', error);
        return false;
    }
};
