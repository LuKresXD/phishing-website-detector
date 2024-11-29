#!/bin/bash

# Get the absolute path of the project directory
PROJECT_DIR=$(pwd)

# Set up Python virtual environment
echo "Setting up Python virtual environment..."
cd ml
python3 -m venv venv
. venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -U pip
pip install -r requirements.txt

# Deactivate virtual environment
deactivate

# Go back to root directory
cd ..

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build Next.js application
echo "Building Next.js application..."
npm run build

# Update PM2 ecosystem file to use the virtual environment
cat > ecosystem.config.js << EOL
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
EOL

# Ensure the virtual environment Python is executable
chmod +x ${PROJECT_DIR}/ml/venv/bin/python

# Stop any existing PM2 processes
pm2 stop phishing-detector-ml
pm2 stop phishing-detector-web

# Start PM2 with ecosystem file
echo "Starting PM2 services..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "Setting up PM2 startup..."
pm2 startup

echo "Setup complete!"
echo "Monitor your applications with: pm2 monit"
echo "View logs with: pm2 logs"
echo "Check status with: pm2 status"

# Add instructions for activating venv manually if needed
echo ""
echo "To manually activate the Python virtual environment:"
echo "cd ${PROJECT_DIR}/ml && source venv/bin/activate"