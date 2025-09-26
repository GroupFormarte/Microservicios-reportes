#!/bin/bash

# ===============================================
# Formarte Reports - Simple Docker Runner
# ===============================================

echo "🚀 Starting Formarte Reports with Docker..."

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
API_KEY=formarte-reports-2025-key
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
EOF
    echo "✅ .env file created"
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for service to be ready
echo "⏳ Waiting for service to start..."
sleep 10

# Check if service is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Service is running!"
    echo ""
    echo "🌐 Service URLs:"
    echo "  📊 Main Service: http://localhost:3001"
    echo "  ❤️  Health Check: http://localhost:3001/health"
    echo ""
    echo "🔑 API Key: formarte-reports-2025-key"
    echo ""
    echo "📋 Useful commands:"
    echo "  View logs:    docker-compose logs -f"
    echo "  Stop:         docker-compose down"
    echo "  Restart:      docker-compose restart"
else
    echo "❌ Service failed to start. Check logs:"
    docker-compose logs
fi