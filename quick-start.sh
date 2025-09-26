#!/bin/bash

echo "🚀 Quick Start - Formarte Reports Microservice"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

# Start development server
echo "🏃 Starting development server..."
npm run dev