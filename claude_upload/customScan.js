import { spawn } from 'child_process';
import path from 'path';

function extractFeatures(url) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [path.join(process.cwd(), 'src', 'ml', 'feature_extractor.py'), url]);
        let output = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process exited with code ${code}`));
            } else {
                try {
                    const features = JSON.parse(output);
                    resolve(features);
                } catch (error) {
                    reject(new Error('Failed to parse feature extraction output'));
                }
            }
        });
    });
}

function calculateSafetyScore(features, url) {
    console.log("Raw features:", JSON.stringify(features, null, 2));

    let score = 100;

    const penaltyWeights = {
        UsingIp: 10,
        shortUrl: 5,
        AbnormalURL: 8,
        redirecting: 5,
        prefixSuffix: 3,
        SubDomains: 2,
        Favicon: 2,
        NonStdPort: 5,
        HTTPSDomainURL: 5,
        RequestURL: 4,
        AnchorURL: 4,
        LinksInScriptTags: 3,
        ServerFormHandler: 3,
        InfoEmail: 3,
        WebsiteForwarding: 3,
        StatusBarCust: 2,
        DisableRightClick: 2,
        UsingPopupWindow: 2,
        IframeRedirection: 4
    };

    for (const [feature, weight] of Object.entries(penaltyWeights)) {
        if (features[feature] === "bad") {
            score -= weight;
            console.log(`Penalty: ${feature}, Weight: ${weight}, New Score: ${score}`);
        }
    }

    // Штраф за отсутствие HTTPS
    if (features["Hppts"] === "bad") {
        score -= 10;
        console.log(`Penalty: No HTTPS, Weight: 10, New Score: ${score}`);
    }

    // Ensure the score is between 0 and 100
    score = Math.max(0, Math.min(100, (score-30)*5));

    console.log(`Final Score: ${score}`);

    return score;
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { url } = req.body;

            if (!url || typeof url !== 'string' || url.trim() === '') {
                return res.status(400).json({ error: 'Invalid or missing URL' });
            }

            const features = await extractFeatures(url);
            const safetyScore = calculateSafetyScore(features, url);

            let scanResult;
            if (safetyScore >= 80) {
                scanResult = 'Safe';
            } else if (safetyScore >= 60) {
                scanResult = 'Moderate';
            } else {
                scanResult = 'Dangerous';
            }

            res.status(200).json({
                result: scanResult,
                safetyScore: parseFloat(safetyScore.toFixed(2)),
                url: url
            });
        } catch (error) {
            console.error('Custom scan error:', error);
            res.status(500).json({ error: 'Failed to perform custom scan', message: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}