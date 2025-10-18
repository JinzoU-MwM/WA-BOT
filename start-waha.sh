#!/bin/bash

# WAHA Startup Script
# This script provides multiple ways to start WAHA

echo "🚀 WAHA Startup Options:"
echo ""
echo "Option 1: Using Docker (Recommended)"
echo "docker run -d --name waha-fresh -p 3000:3000 --env-file waha-config.env -v \"./sessions:/app/sessions\" -v \"./logs:/app/logs\" devlikeapro/waha"
echo ""

echo "Option 2: Using Docker Compose (Full setup with bot)"
echo "docker-compose up -d waha"
echo ""

echo "Option 3: Local installation (if you have WAHA installed locally)"
echo "npm install -g @waha/core"
echo "waha --config waha-config.env"
echo ""

echo "After starting WAHA, check:"
echo "✅ WAHA is running: http://localhost:3000"
echo "✅ API Documentation: http://localhost:3000"
echo "✅ Bot connection: The bot should connect automatically"
echo ""

read -p "Which option would you like to use? (1/2/3): " choice

case $choice in
    1)
        echo "🐳 Starting WAHA with Docker..."
        docker run -d --name waha-fresh -p 3000:3000 --env-file waha-config.env -v "./sessions:/app/sessions" -v "./logs:/app/logs" devlikeapro/waha
        ;;
    2)
        echo "🐳 Starting WAHA with Docker Compose..."
        docker-compose up -d waha
        ;;
    3)
        echo "💻 Starting WAHA locally..."
        echo "Please ensure WAHA is installed and run:"
        echo "waha --config waha-config.env"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac