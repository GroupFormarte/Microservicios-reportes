#!/bin/bash

echo "🚀 FORMARTE REPORTS - ONE CLICK START"
echo "======================================"

# Create basic .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
API_KEY=formarte-reports-2025-key
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
EOF

# Use simple docker-compose
cp docker-compose.simple.yml docker-compose.yml

# Stop any existing containers
docker-compose down 2>/dev/null || true

# Build and start
echo "🔨 Building and starting..."
docker-compose up --build -d

# Wait and check
sleep 15
if curl -s http://localhost:3001/health > /dev/null; then
    echo ""
    echo "✅ SUCCESS! Service is running at:"
    echo "   http://localhost:3001"
    echo ""
    echo "🔑 API Key: formarte-reports-2025-key"
    echo ""
    echo "To stop: ./docker-stop.sh"
    echo "To see logs: ./docker-logs.sh"
else
    echo "❌ Failed to start. Run: docker-compose logs"
fi