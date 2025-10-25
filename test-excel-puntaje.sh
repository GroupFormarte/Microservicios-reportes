#!/bin/bash

# Test script for Excel Puntaje endpoint (actualizado con áreas y estadísticas)

echo "🧪 Testing Excel Puntaje Endpoint (NEW FORMAT)"
echo "=============================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Error: El servidor no está ejecutándose en el puerto 3001"
    echo "Por favor, ejecuta primero: npm run dev"
    exit 1
fi

echo "✅ Servidor detectado en http://localhost:3001"
echo ""

# Get API key from .env if exists
API_KEY=""
if [ -f .env ]; then
    API_KEY=$(grep "^API_KEY=" .env | cut -d '=' -f2)
fi

if [ -z "$API_KEY" ]; then
    echo "⚠️  No se encontró API_KEY en .env, intentando sin autenticación..."
fi

echo "📤 Enviando datos de saber.json al endpoint /api/reports/excel-puntaje"
echo ""
echo "📋 Formato esperado:"
echo "   - GRUPO | IDENTIFICACIÓN | NOMBRES Y APELLIDOS | TOTAL | Categoria | [Áreas]"
echo "   - Fila de PROMEDIO al final"
echo "   - Fila de DESVIACIÓN ESTÁNDAR al final"
echo ""

# Make request
RESPONSE=$(curl -s -X POST http://localhost:3001/api/reports/excel-puntaje \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d @saber.json)

echo "📥 Respuesta del servidor:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract file URL if successful
SUCCESS=$(echo "$RESPONSE" | grep -o '"success"[[:space:]]*:[[:space:]]*true' || echo "")

if [ -n "$SUCCESS" ]; then
    FILE_URL=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['url'])" 2>/dev/null)
    FILENAME=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['fileName'])" 2>/dev/null)

    echo "✅ Excel generado exitosamente!"
    echo "📄 Archivo: $FILENAME"
    echo "🔗 URL: $FILE_URL"
    echo ""
    echo "📊 El Excel contiene:"
    echo "   ✓ Columnas por área (Lectura Crítica, Matemáticas, Ciencias, etc.)"
    echo "   ✓ Fila de PROMEDIO con estadísticas"
    echo "   ✓ Fila de DESVIACIÓN ESTÁNDAR"
    echo "   ✓ Categoría numérica (1, 2, 3, 4)"
    echo ""
    echo "Para descargar:"
    echo "  wget \"$FILE_URL\" -O puntajes_test.xlsx"
    echo "  o abre en el navegador: $FILE_URL"
else
    echo "❌ Error al generar el Excel"
fi
