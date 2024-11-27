module.exports = {
    apps: [
        {
            name: 'phishing-detector-web',
            script: 'npm',
            args: 'start',
            cwd: './',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            exp_backoff_restart_delay: 100,
            max_restarts: 10,
            error_file: 'logs/ml-err.log',
            out_file: 'logs/ml-out.log',
            time: true
        },
        {
            name: 'phishing-detector-ml',
            script: 'ml/server.py',
            interpreter: './ml/venv/bin/python3',
            cwd: './',
            env: {
                PYTHONUNBUFFERED: 'true',
                ML_SERVER_PORT: '5002',
                PYTHONPATH: './ml'
            },
            exp_backoff_restart_delay: 100,
            max_restarts: 10,
            error_file: 'logs/ml-err.log',
            out_file: 'logs/ml-out.log',
            time: true
        }
    ]
};