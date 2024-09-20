function calculateSafetyScore(features) {
    let score = 100;

    const penaltyWeights = {
        usingIp: 25,
        abnormalUrl: 20,
        prefixSuffix: 15,
        subDomains: 10,
        httpsProtocol: -20,
        nonStdPort: 15
    };

    for (const [feature, weight] of Object.entries(penaltyWeights)) {
        if (feature === 'subDomains') {
            score -= weight * Math.max(0, features[feature] - 2);
        } else {
            score -= weight * features[feature];
        }
    }

    // URL length penalty
    if (features.urlLength > 75) {
        score -= 10;
    }

    return Math.max(0, Math.min(100, score));
}

module.exports = { calculateSafetyScore };