module.exports = {
    apps: [
        {
            name: 'phishing-detector-web',
            script: 'npm',
            args: 'start',
            cwd: '${PROJECT_DIR}',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            exp_backoff_restart_delay: 100,
            max_restarts: 10,
            error_file: 'logs/web-err.log',
            out_file: 'logs/web-out.log',
            time: true
        },
        {
            name: 'phishing-detector-ml',
            script: '${PROJECT_DIR}/ml/venv/bin/python',
            args: '${PROJECT_DIR}/ml/server.py',
            interpreter: 'none',
            cwd: '${PROJECT_DIR}/ml',
            env: {
                PYTHONUNBUFFERED: 'true',
                ML_SERVER_PORT: '5002',
                PYTHONPATH: '${PROJECT_DIR}/ml/venv/lib/python3.8/site-packages:${PROJECT_DIR}/ml'
            },
            exp_backoff_restart_delay: 100,
            max_restarts: 10,
            error_file: '${PROJECT_DIR}/logs/ml-err.log',
            out_file: '${PROJECT_DIR}/logs/ml-out.log',
            time: true
        }
    ]
};