#!/bin/bash

# Create logs directory
mkdir -p logs

# Install Python dependencies
echo "Installing Python dependencies..."
python3 -m pip install --user pandas numpy flask flask-cors scikit-learn joblib requests imbalance-learn

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build Next.js application
echo "Building Next.js application..."
npm run build

# Create required ML directories
mkdir -p ml/data
mkdir -p ml/models

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