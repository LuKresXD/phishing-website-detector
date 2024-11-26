class LogisticRegression {
    constructor() {
        this.weights = {
            usingIp: -2.5,
            urlLength: -0.02,
            abnormalUrl: -1.5,
            prefixSuffix: -1.0,
            subDomains: -0.5,
            httpsProtocol: 2.0,
            nonStdPort: -1.5,
            intercept: 0.5
        };
    }

    sigmoid(z) {
        return 1 / (1 + Math.exp(-z));
    }

    predict(features) {
        let z = this.weights.intercept;
        for (const [feature, value] of Object.entries(features)) {
            z += this.weights[feature] * value;
        }
        return this.sigmoid(z);
    }
}

const model = new LogisticRegression();

function predict(features) {
    return model.predict(features);
}

module.exports = { predict };