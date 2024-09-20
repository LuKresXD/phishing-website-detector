const tf = require('@tensorflow/tfjs-node');
const path = require('path');

let model;

async function loadModel() {
    if (!model) {
        model = await tf.loadLayersModel(`file://${path.join(process.cwd(), 'public', 'model', 'model.json')}`);
    }
    return model;
}

async function predict(features) {
    const model = await loadModel();
    const inputTensor = tf.tensor2d([Object.values(features)]);
    const prediction = await model.predict(inputTensor).data();
    return prediction[0];
}

module.exports = { predict };