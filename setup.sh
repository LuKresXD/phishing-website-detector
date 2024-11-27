#!/bin/bash

# Create logs directory
mkdir -p logs

# Setup Python virtual environment
echo "Setting up Python virtual environment..."
python3.11 -m venv ml/venv

# Activate virtual environment
source ml/venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r ml/requirements.txt

# Create required ML directories
mkdir -p ml/data
mkdir -p ml/models

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
pm2 stop phishing-detector-ml
pm2 stop phishing-detector-web
npm install

# Build Next.js application
echo "Building Next.js application..."
npm run build

# Start PM2 with ecosystem file
echo "Starting PM2 services..."
pm2 start ecosystem.config.js

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "Setting up PM2 startup..."
pm2 startup

# Deactivate virtual environment
deactivate

echo "Setup complete!"
echo "Monitor your applications with: pm2 monit"
echo "View logs with: pm2 logs"
echo "Check status with: pm2 status"