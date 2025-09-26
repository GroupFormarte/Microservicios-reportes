#!/bin/bash

# ===============================================
# Formarte Reports - Docker Stop Script
# ===============================================

echo "🛑 Stopping Formarte Reports Docker services..."

# Stop and remove containers
docker-compose down --remove-orphans

# Optional: Remove images (uncomment if needed)
# echo "🗑️  Removing Docker images..."
# docker rmi $(docker images formarte* -q) 2>/dev/null || true

# Optional: Remove volumes (uncomment if needed)
# echo "🗑️  Removing Docker volumes..."
# docker volume rm $(docker volume ls -q | grep formarte) 2>/dev/null || true

echo "✅ All services stopped successfully"