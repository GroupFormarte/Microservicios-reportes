#!/bin/bash

# Script de prueba para el endpoint asíncrono de reportes
# Uso: ./test-async-report.sh

echo "🧪 Probando endpoint asíncrono de reportes..."
echo ""

# Configuración
API_URL="http://localhost:3350/api/reports/simulation"
SESSION_ID="test-session-$(date +%s)"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "   URL: $API_URL"
echo "   Session ID: $SESSION_ID"
echo ""

# Verificar que el servidor esté corriendo
echo -e "${YELLOW}🔍 Verificando que el servidor esté corriendo...${NC}"
if ! curl -s http://localhost:3350/health > /dev/null; then
    echo -e "${RED}❌ Error: El servidor no está corriendo en puerto 3350${NC}"
    echo "   Inicia el servidor con: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Servidor corriendo${NC}"
echo ""

# Datos de prueba mínimos (reemplaza con tus datos reales)
TEST_DATA='{
  "campus": "Test Campus",
  "course": "Test Course",
  "idInstitute": "test-institute-123",
  "programName": "Test Program",
  "tipe_inform": "saber",
  "students": [
    {
      "id": "student-1",
      "name": "Test Student",
      "examenes_asignados": [
        {
          "id_simulacro": "sim-123",
          "score": 75,
          "materias": []
        }
      ]
    }
  ],
  "detailQuestion": []
}'

echo -e "${YELLOW}📤 Enviando solicitud...${NC}"
echo ""

# Hacer la solicitud
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: $SESSION_ID" \
  -d "$TEST_DATA")

# Separar body y status code
HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo -e "${YELLOW}📥 Respuesta recibida:${NC}"
echo "   HTTP Status: $HTTP_STATUS"
echo "   Body:"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Verificar que sea 202
if [ "$HTTP_STATUS" == "202" ]; then
    echo -e "${GREEN}✅ SUCCESS: Endpoint retorna 202 Accepted (como esperado)${NC}"
    echo ""
    echo -e "${YELLOW}📡 Ahora el reporte se está procesando en background${NC}"
    echo "   Para ver el progreso, conecta un cliente WebSocket a:"
    echo "   ws://localhost:3350"
    echo "   Canal: report-progress"
    echo "   Session ID: $SESSION_ID"
    echo ""
    echo -e "${YELLOW}💡 Tip: Revisa los logs del servidor para ver el progreso:${NC}"
    echo "   tail -f logs/app.log"
    echo "   o"
    echo "   pm2 logs"
else
    echo -e "${RED}❌ FAIL: Esperaba HTTP 202, recibió $HTTP_STATUS${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Prueba completada exitosamente!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Conecta un cliente WebSocket para recibir notificaciones"
echo "2. Espera a que el reporte se complete (~2-5 minutos)"
echo "3. Descarga el PDF desde la URL recibida por WebSocket"
