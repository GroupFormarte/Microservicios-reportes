#!/bin/bash

# ===============================================
# Script de Prueba del Sistema de Autenticación
# ===============================================

echo "🔐 Probando Sistema de Autenticación de Formarte Reports"
echo "========================================================"

BASE_URL="http://localhost:3001"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo -e "\n${YELLOW}📋 Test 1: Health Check${NC}"
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"

# Test 2: Login con credenciales de prueba
echo -e "\n${YELLOW}🔐 Test 2: Login (requiere credenciales válidas de Podium)${NC}"
echo "Nota: Reemplaza USER_ID y PODIUM_TOKEN con valores reales"

# Ejemplo de login (comentado porque requiere credenciales reales)
# JWT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "userId": "USER_ID_AQUI",
#     "token": "PODIUM_TOKEN_AQUI"
#   }')

# echo "$JWT_RESPONSE" | jq '.'

# Test 3: Verificar endpoint de autenticación existe
echo -e "\n${YELLOW}🛠️  Test 3: Verificar endpoints de autenticación${NC}"

echo "POST /api/auth/login:"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.error' || echo "Endpoint exists"

echo -e "\nGET /api/auth/verify:"
curl -s "$BASE_URL/api/auth/verify" | jq '.error' || echo "Endpoint exists"

# Test 4: Probar acceso a reportes sin autenticación
echo -e "\n${YELLOW}🚫 Test 4: Acceso a reportes sin autenticación${NC}"
curl -s -X POST "$BASE_URL/api/reports/simulation" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' | jq '.error' || echo "No authentication required (development mode?)"

# Test 5: Probar con API Key legacy
echo -e "\n${YELLOW}🔑 Test 5: Acceso con API Key legacy${NC}"
curl -s -X POST "$BASE_URL/api/reports/simulation" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: formarte-reports-2025-key" \
  -d '{"test": true}' | jq '.success' || echo "API Key test failed"

echo -e "\n${GREEN}✅ Tests de autenticación completados${NC}"
echo ""
echo "Para probar completamente el sistema:"
echo "1. Obtén credenciales válidas de Podium API"
echo "2. Reemplaza USER_ID y PODIUM_TOKEN en este script"
echo "3. Ejecuta: $0"
echo ""
echo "Documentación completa en: docs/AUTHENTICATION.md"