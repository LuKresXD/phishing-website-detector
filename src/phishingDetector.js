import axios from 'axios';

async function getWOTScore(url) {
    const options = {
        method: 'GET',
        url: 'https://wot-web-risk-and-safe-browsing.p.rapidapi.com/targets',
        params: { t: url },
        headers: {
            'X-RapidAPI-Key': '14d7fefb20msha71cbd15fc9ba01p116d5bjsn1e89aca46f0e',
            'X-RapidAPI-Host': 'wot-web-risk-and-safe-browsing.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        if (response.data.length === 0 || !response.data[0].safety) {
            console.error('No safety data available for URL:', url);
            return { isPhishing: false, safetyScore: 100, categories: [] };
        }
        const safetyData = response.data[0].safety;
        const categories = response.data[0].categories || [];

        let safetyScore = safetyData.reputations || 100;
        // if (safetyData.confidence) {
        //     safetyScore = (safetyScore * safetyData.confidence) / 100;
        // }

        const isPhishing = safetyData.status !== "SAFE";
        return {
            isPhishing: isPhishing,
            safetyScore: safetyScore,
            categories: categories.map(cat => `${cat.name} (Confidence: ${cat.confidence})`)
        };
    } catch (error) {
        console.error('Error fetching from WOT API:', error);
        return { isPhishing: false, safetyScore: 100, categories: [] };
    }
}

export { getWOTScore as checkPhishing };
