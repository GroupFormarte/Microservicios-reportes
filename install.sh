#!/bin/bash

echo "🚀 Installing Formarte Reports Microservice..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18.0.0. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Installation completed!"
echo ""
echo "📚 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start development server: npm run dev"
echo "3. Visit http://localhost:3001 to verify the service is running"
echo "4. Check API documentation at http://localhost:3001/api/reports/docs"