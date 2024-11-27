#!/bin/bash

# Get the absolute path of the project directory
PROJECT_DIR=$(pwd)

# Create logs directory
mkdir -p logs

# Set up Python virtual environment
echo "Setting up Python virtual environment..."
cd ml
python3 -m venv venv
. venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -U pip
pip install pandas numpy flask flask-cors scikit-learn joblib requests imbalanced-learn

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

# Create required ML directories
mkdir -p ml/data
mkdir -p ml/models

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