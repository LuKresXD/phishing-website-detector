import axios from 'axios';

const WOT_API_KEY = '14d7fefb20msha71cbd15fc9ba01p116d5bjsn1e89aca46f0e';

async function checkPhishing(url) {
    const options = {
        method: 'GET',
        url: 'https://wot-web-risk-and-safe-browsing.p.rapidapi.com/targets',
        params: { t: url },
        headers: {
            'X-RapidAPI-Key': WOT_API_KEY,
            'X-RapidAPI-Host': 'wot-web-risk-and-safe-browsing.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        if (response.data.length === 0 || !response.data[0].safety) {
            console.error('No safety data available for URL:', url);
            return { isPhishing: false, safetyScore: "Data unavailable", categories: [] };
        }
        const data = response.data[0];
        const safety = data.safety || { status: 'UNKNOWN', reputations: null, confidence: null };
        const childSafety = data.childSafety || { reputations: null, confidence: null };

        let safetyScore = calculateSafetyScore(safety, childSafety);
        let isPhishing = determinePhishingStatus(safety);

        return {
            isPhishing: isPhishing,
            safetyScore: safetyScore,
            categories: data.categories || []
        };
    } catch (error) {
        console.error('Error fetching from WOT API:', error);
        return { isPhishing: false, safetyScore: "Error accessing data", categories: [] };
    }
}

function calculateSafetyScore(safety, childSafety) {
    if (safety.reputations !== null && safety.confidence !== null && childSafety.reputations !== null && childSafety.confidence !== null) {
        let weightedSafety = safety.reputations * (safety.confidence / 100);
        let weightedChildSafety = childSafety.reputations * (childSafety.confidence / 100);
        let averageReputation = ((weightedSafety + weightedChildSafety) / 2).toFixed(2);
        return `${averageReputation}`;
    }
    return "Data incomplete";
}

function determinePhishingStatus(safety) {
    return safety.status !== 'SAFE';
}

export { checkPhishing };
