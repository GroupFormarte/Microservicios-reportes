#!/bin/bash

# ===============================================
# Formarte Reports - Docker Logs Viewer
# ===============================================

echo "📋 Showing Formarte Reports logs..."
echo "Press Ctrl+C to exit"
echo ""

# Show logs with follow
docker-compose logs -f --tail=50