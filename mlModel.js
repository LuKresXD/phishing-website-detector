// mlModel.js
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Feature extraction function
function extractFeatures(url) {
    const parsedUrl = new URL(url.startsWith('http') ? url : `http://${url}`);
    return [
        url.length, // URL length
        (parsedUrl.hostname.match(/[^a-zA-Z0-9.-]/g) || []).length, // Special characters in domain
        parsedUrl.pathname.length, // Path length
        parsedUrl.searchParams.toString().length, // Query parameters length
        parsedUrl.hostname.split('.').length, // Number of subdomains
        parsedUrl.protocol === 'https:' ? 1 : 0, // HTTPS or not
        /\d+\.\d+\.\d+\.\d+/.test(parsedUrl.hostname) ? 1 : 0, // IP address or not
    ];
}

// Load and preprocess data
function loadData(filePath) {
    const csvData = fs.readFileSync(filePath, 'utf8');
    const records = parse(csvData, { columns: true, skip_empty_lines: true });

    const features = records.map(record => extractFeatures(record.url));
    const labels = records.map(record => record.is_phishing === 'True' ? 1 : 0);

    return {
        features: tf.tensor2d(features),
        labels: tf.tensor1d(labels)
    };
}

// Create and compile model
function createModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [7] }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
    return model;
}

// Train model
async function trainModel(model, features, labels) {
    await model.fit(features, labels, {
        epochs: 50,
        validationSplit: 0.2,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
        }
    });
}

// Save model
async function saveModel(model, path) {
    await model.save(`file://${path}`);
}

// Load model
async function loadModel(path) {
    return await tf.loadLayersModel(`file://${path}/model.json`);
}

// Predict
async function predict(model, url) {
    const features = tf.tensor2d([extractFeatures(url)]);
    const prediction = await model.predict(features).data();
    return prediction[0];
}

// Main function to train and save the model
async function main() {
    // Assuming you have a CSV file with 'url' and 'is_phishing' columns
    const { features, labels } = loadData('phishing_dataset.csv');
    const model = createModel();
    await trainModel(model, features, labels);
    await saveModel(model, './phishing_model');
    console.log('Model trained and saved successfully');
}

module.exports = { loadModel, predict, main };