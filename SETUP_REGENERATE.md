# 🚀 Configuración del Endpoint de Regeneración de Reportes

## Resumen

Se ha implementado un nuevo endpoint `/api/reports/regenerate` que permite regenerar reportes desde datos históricos almacenados en MongoDB.

## Archivos Creados

### Servicios
- ✅ `src/services/raschCalculator.ts` - Implementación del modelo de Rasch (SABER/UNAL)
- ✅ `src/services/udeaGrading.ts` - Sistema de calificación UdeA
- ✅ `src/services/reportConsolidation.ts` - Lógica de consolidación de reportes

### Modelos y Configuración
- ✅ `src/models/ReportData.ts` - Modelo de MongoDB para `report_data`
- ✅ `src/config/database.ts` - Configuración de conexión a MongoDB

### Controladores y Rutas
- ✅ `src/controllers/reportsController.ts` - Endpoint `regenerateReport` agregado
- ✅ `src/routes/reports.ts` - Ruta `/regenerate` agregada

### Documentación
- ✅ `docs/REGENERATE_ENDPOINT.md` - Documentación completa del endpoint

## Archivos Modificados

- ✅ `src/app.ts` - Inicialización de MongoDB agregada
- ✅ `.env` - Variable `MONGODB_URI` agregada
- ✅ `package.json` - Dependencias `mongoose` y `@types/mongoose` instaladas

## Configuración Requerida

### 1. Instalar MongoDB

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb-org

# macOS
brew tap mongodb/brew
brew install mongodb-community

# Iniciar servicio
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Configurar Variable de Entorno

El archivo `.env` ya tiene la configuración básica:

```bash
MONGODB_URI=mongodb://localhost:27017/formarte_reports
```

Para producción con autenticación, actualiza a:

```bash
MONGODB_URI=mongodb://username:password@host:port/database
```

### 3. Compilar el Proyecto

```bash
npm run build
```

**Nota**: Hay errores de TypeScript pre-existentes en `pdfService.ts`, `authService.ts` y `renderService.ts` que NO afectan la funcionalidad del nuevo endpoint. Los archivos nuevos se compilaron correctamente:

```
✅ dist/services/raschCalculator.js
✅ dist/services/udeaGrading.js
✅ dist/services/reportConsolidation.js
✅ dist/models/ReportData.js
✅ dist/config/database.js
```

### 4. Iniciar el Servidor

```bash
npm run dev
```

Deberías ver en los logs:

```
MongoDB connected successfully
Server with WebSocket running on http://0.0.0.0:3001
```

## Uso del Endpoint

### Request Básico

```bash
curl -X POST http://localhost:3001/api/reports/regenerate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: formarte-reports-2025-api-key-change-in-production" \
  -d '{
    "fecha_inicio": "2025-10-01T00:00:00.000Z",
    "fecha_finalizacion": "2025-10-31T23:59:59.999Z",
    "idInstitute": "2",
    "tipe_inform": "saber"
  }'
```

### Con simulationId específico

```bash
curl -X POST http://localhost:3001/api/reports/regenerate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: formarte-reports-2025-api-key-change-in-production" \
  -d '{
    "fecha_inicio": "2025-10-01T00:00:00.000Z",
    "fecha_finalizacion": "2025-10-31T23:59:59.999Z",
    "idInstitute": "2",
    "tipe_inform": "saber",
    "simulationId": "68d2b028745905f85547e214"
  }'
```

## Estructura de Datos Esperada en MongoDB

### Colección: `report_data`

Los documentos deben tener la misma estructura que el archivo `saber.json`:

```json
{
  "campus": "FORMARTE MEDELLIN",
  "course": "ICFES SABER 11 - DOMINGOS",
  "simulationId": "68d2b028745905f85547e214",
  "idInstitute": "2",
  "programName": "ICFES SABER 11",
  "code": "S11-M4-U-V2-p",
  "id_campus": "3",
  "tipe_inform": "saber",
  "examDate": ISODate("2025-10-23T11:04:49.621Z"),
  "detailQuestion": [...],
  "results": {
    "student_id": {
      "position": 5,
      "score": 677.67,
      "totalStudents": 50,
      "correctAnswers": 64,
      "incorrectAnswers": 157,
      "totalAnswered": 221
    }
  },
  "students": [...]
}
```

### Índices Recomendados

Los índices se crean automáticamente al iniciar el servidor, pero puedes verificarlos:

```javascript
// En MongoDB shell
use formarte_reports

db.report_data.createIndex({ examDate: 1, idInstitute: 1, tipe_inform: 1 })
db.report_data.createIndex({ examDate: 1, idInstitute: 1, tipe_inform: 1, simulationId: 1 })
```

## Lógica de Funcionamiento

### Con `simulationId`
1. Filtra reportes del simulacro específico
2. Consolida estudiantes únicos
3. **RECALCULA** scores y posiciones usando Rasch (saber/unal) o UdeA (udea)
4. Genera PDF

### Sin `simulationId`
1. Filtra todos los reportes del tipo en el rango de fechas
2. Consolida estudiantes (combina múltiples exámenes)
3. Toma el **MEJOR score** de cada estudiante
4. **RECALCULA solo posiciones** (sin recalcular scores)
5. Genera PDF

## Sistemas de Calificación

### Rasch (SABER y UNAL)
- Modelo IRT (Item Response Theory)
- JMLE (Joint Maximum Likelihood Estimation)
- Escala normalizada: 500 ± 100

### UdeA Grading System
- Ponderación:
  - Razonamiento Lógico: 50%
  - Competencia Lectora: 50%

## Verificación

### 1. Verificar MongoDB
```bash
sudo systemctl status mongod
mongo --eval "db.adminCommand('listDatabases')"
```

### 2. Verificar Conexión desde la App
```bash
# Los logs deberían mostrar:
# MongoDB connected successfully
tail -f logs/app.log | grep MongoDB
```

### 3. Test del Endpoint
```bash
# Health check
curl http://localhost:3001/health

# Test endpoint (requiere datos en MongoDB)
curl -X POST http://localhost:3001/api/reports/regenerate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: formarte-reports-2025-api-key-change-in-production" \
  -d '{"fecha_inicio":"2025-10-01T00:00:00.000Z","fecha_finalizacion":"2025-10-31T23:59:59.999Z","idInstitute":"2","tipe_inform":"saber"}'
```

## Troubleshooting

### Error: "Cannot connect to MongoDB"

```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongod

# Iniciar MongoDB si está detenido
sudo systemctl start mongod

# Verificar URI en .env
grep MONGODB_URI .env
```

### Error: "No reports found"

- Verifica que haya datos en la colección `report_data`
- Confirma que los filtros de fecha sean correctos
- Revisa que `idInstitute` y `tipe_inform` coincidan

### Errores de TypeScript al compilar

Los errores en `pdfService.ts`, `authService.ts` y `renderService.ts` son pre-existentes y no afectan el nuevo endpoint. El código nuevo compila correctamente.

## Próximos Pasos

1. ✅ Implementación completa del endpoint
2. ⏳ Poblar MongoDB con datos de prueba
3. ⏳ Testing con diferentes escenarios
4. ⏳ Optimización de consultas MongoDB
5. ⏳ Implementar caché (opcional)

## Documentación Adicional

- 📖 [REGENERATE_ENDPOINT.md](docs/REGENERATE_ENDPOINT.md) - Documentación completa del endpoint
- 📖 [WEBSOCKET_USAGE.md](docs/WEBSOCKET_USAGE.md) - Uso de WebSocket para progreso
- 📖 [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Arquitectura general del sistema

## Soporte

Para preguntas o problemas, revisa:
1. Logs del servidor: `tail -f logs/app.log`
2. Logs de MongoDB: `tail -f /var/log/mongodb/mongod.log`
3. Documentación completa en `docs/REGENERATE_ENDPOINT.md`
