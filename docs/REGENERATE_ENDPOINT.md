# 🔄 Endpoint de Regeneración de Reportes

## Descripción

El endpoint `/api/reports/regenerate` permite regenerar reportes educativos desde datos históricos almacenados en la colección `report_data` de MongoDB. Consolida datos de múltiples reportes, unifica estudiantes y recalcula resultados según el tipo de informe.

## URL

```
POST /api/reports/regenerate
```

## Autenticación

Requiere autenticación mediante:
- **JWT Token**: Header `Authorization: Bearer <token>`
- **API Key**: Header `X-API-Key: <api-key>`

## Request Body

### Parámetros Requeridos

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `fecha_inicio` | `string` | Fecha de inicio del rango en formato ISO 8601 (ej: `2025-10-01T00:00:00.000Z`) |
| `fecha_finalizacion` | `string` | Fecha de finalización del rango en formato ISO 8601 |
| `idInstitute` | `string` | ID del instituto educativo |
| `tipe_inform` | `string` | Tipo de informe: `"saber"`, `"udea"`, o `"unal"` |

### Parámetros Opcionales

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `simulationId` | `string` | ID del simulacro específico (opcional). Si se omite, consolida todos los simulacros encontrados |

### Ejemplo Request

#### Con simulationId (regenerar un simulacro específico)

```json
{
  "fecha_inicio": "2025-10-01T00:00:00.000Z",
  "fecha_finalizacion": "2025-10-31T23:59:59.999Z",
  "idInstitute": "2",
  "tipe_inform": "saber",
  "simulationId": "68d2b028745905f85547e214"
}
```

#### Sin simulationId (consolidar múltiples reportes)

```json
{
  "fecha_inicio": "2025-10-01T00:00:00.000Z",
  "fecha_finalizacion": "2025-10-31T23:59:59.999Z",
  "idInstitute": "2",
  "tipe_inform": "udea"
}
```

## Comportamiento

### Caso 1: Con `simulationId`

Cuando se proporciona `simulationId`:

1. ✅ Filtra solo reportes de ese simulacro específico
2. ✅ Consolida estudiantes únicos
3. ✅ **RECALCULA completamente** todos los resultados usando:
   - **Rasch** para `tipe_inform: "saber"` o `"unal"`
   - **UdeA Grading System** para `tipe_inform: "udea"`
4. ✅ Genera nuevo objeto `results` con:
   - `position`: Posición recalculada entre todos los estudiantes
   - `score`: Puntaje recalculado con el sistema apropiado
   - `totalStudents`: Total de estudiantes en el grupo consolidado
   - `correctAnswers`, `incorrectAnswers`, `totalAnswered`: Conteos actualizados

### Caso 2: Sin `simulationId`

Cuando NO se proporciona `simulationId`:

1. ✅ Trae TODOS los reportes del `tipe_inform` en el rango de fechas
2. ✅ Consolida estudiantes únicos (pueden tener múltiples exámenes)
3. ✅ **Toma el MEJOR puntaje** de cada estudiante de sus `examenes_asignados`
4. ✅ **Solo RECALCULA POSICIONES** (no recalcula scores):
   - `position`: Nueva posición relativa entre todos los estudiantes ✅
   - `score`: Score original del mejor examen (sin recalcular) ✅
   - `totalStudents`: Nuevo total de estudiantes consolidados ✅
   - `correctAnswers`, `incorrectAnswers`, `totalAnswered`: Del mejor examen ✅

## Sistemas de Calificación

### Rasch (SABER y UNAL)

- Implementa modelo IRT (Item Response Theory)
- Usa JMLE (Joint Maximum Likelihood Estimation)
- Calcula habilidades (theta) de estudiantes
- Calcula dificultades (beta) de preguntas
- Normaliza scores a escala 500 ± 100
- Clasifica dificultad de preguntas: fácil, medio, difícil

### UdeA Grading System

- Sistema de calificación ponderado
- Materias ponderadas:
  - **Razonamiento Lógico**: 50%
  - **Competencia Lectora**: 50%
- Fórmula: `score = (porcentaje_RL * 0.5) + (porcentaje_CL * 0.5)`

## Response

### Success Response

El endpoint delega la generación del PDF al endpoint `processSimulationData`, por lo que retorna el mismo formato:

```json
{
  "success": true,
  "pdfUrl": "http://localhost:3001/api/reports/pdfs/reporte_completo_FORMARTE_MEDELLIN_1234567890.pdf",
  "sessionId": "session_1234567890",
  "fileName": "reporte_completo_FORMARTE_MEDELLIN_1234567890.pdf"
}
```

### Error Responses

#### 400 Bad Request - Parámetros faltantes

```json
{
  "success": false,
  "error": "Missing required parameters: fecha_inicio, fecha_finalizacion, idInstitute, tipe_inform"
}
```

#### 400 Bad Request - Tipo de informe inválido

```json
{
  "success": false,
  "error": "Invalid tipe_inform. Must be one of: saber, udea, unal"
}
```

#### 404 Not Found - No se encontraron reportes

```json
{
  "success": false,
  "error": "No reports found with the specified filters"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Error al regenerar el reporte",
  "details": "Detalles específicos del error"
}
```

## Ejemplos de Uso

### cURL

```bash
# Con simulationId
curl -X POST http://localhost:3001/api/reports/regenerate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "fecha_inicio": "2025-10-01T00:00:00.000Z",
    "fecha_finalizacion": "2025-10-31T23:59:59.999Z",
    "idInstitute": "2",
    "tipe_inform": "saber",
    "simulationId": "68d2b028745905f85547e214"
  }'

# Sin simulationId
curl -X POST http://localhost:3001/api/reports/regenerate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "fecha_inicio": "2025-10-01T00:00:00.000Z",
    "fecha_finalizacion": "2025-10-31T23:59:59.999Z",
    "idInstitute": "2",
    "tipe_inform": "udea"
  }'
```

### JavaScript/TypeScript

```typescript
const regenerateReport = async () => {
  const response = await fetch('http://localhost:3001/api/reports/regenerate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    },
    body: JSON.stringify({
      fecha_inicio: '2025-10-01T00:00:00.000Z',
      fecha_finalizacion: '2025-10-31T23:59:59.999Z',
      idInstitute: '2',
      tipe_inform: 'saber',
      simulationId: '68d2b028745905f85547e214' // Opcional
    })
  });

  const result = await response.json();
  console.log('PDF generado:', result.pdfUrl);
};
```

### Python

```python
import requests

url = "http://localhost:3001/api/reports/regenerate"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key"
}
data = {
    "fecha_inicio": "2025-10-01T00:00:00.000Z",
    "fecha_finalizacion": "2025-10-31T23:59:59.999Z",
    "idInstitute": "2",
    "tipe_inform": "saber",
    "simulationId": "68d2b028745905f85547e214"  # Opcional
}

response = requests.post(url, json=data, headers=headers)
result = response.json()
print(f"PDF URL: {result['pdfUrl']}")
```

## Notas Importantes

### Consolidación de Estudiantes

- Los estudiantes se identifican de forma única por su `id`
- Si un estudiante aparece en múltiples reportes:
  - **Con simulationId**: Solo se incluyen sus exámenes de ese simulacro
  - **Sin simulationId**: Se combinan todos sus `examenes_asignados` y se toma el mejor score

### Validación de simulationId en examenes_asignados

El sistema valida que el `id_simulacro` dentro de `examenes_asignados` coincida con el `simulationId` del filtro para evitar procesar datos incorrectos de otros programas educativos.

### Recálculo de Resultados

- **CON simulationId**: Recalcula todo desde cero usando Rasch o UdeA
- **SIN simulationId**: Solo reordena estudiantes por su mejor score (más eficiente)

### WebSocket Progress

El endpoint emite eventos de progreso vía WebSocket usando el mismo sistema que `processSimulationData`:

```javascript
// Conectar al WebSocket
const socket = io('http://localhost:3001');
const sessionId = `session_${Date.now()}`;

socket.emit('join_session', sessionId);

socket.on('progress', (data) => {
  console.log(`${data.stage}: ${data.progress}% - ${data.message}`);
});

// Incluir sessionId en headers del request
fetch('/api/reports/regenerate', {
  headers: {
    'X-Session-Id': sessionId
  }
});
```

## Requisitos Técnicos

### MongoDB

- Colección: `report_data`
- Índices requeridos:
  - `{ examDate: 1, idInstitute: 1, tipe_inform: 1 }`
  - `{ examDate: 1, idInstitute: 1, tipe_inform: 1, simulationId: 1 }`

### Variable de Entorno

```bash
MONGODB_URI=mongodb://localhost:27017/formarte_reports
```

Para producción con autenticación:
```bash
MONGODB_URI=mongodb://username:password@host:port/database
```

## Estructura de Datos

### Documento en report_data

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
  "examDate": "2025-10-23T11:04:49.621Z",
  "detailQuestion": [...],
  "results": {
    "student_id_1": {
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

## Troubleshooting

### Error: "No reports found with the specified filters"

- Verifica que existan reportes en `report_data` para ese rango de fechas
- Confirma que `idInstitute` y `tipe_inform` sean correctos
- Revisa que las fechas estén en formato ISO 8601

### Error de conexión a MongoDB

- Verifica que MongoDB esté corriendo: `sudo systemctl status mongod`
- Confirma la variable de entorno `MONGODB_URI`
- Revisa los logs del servidor

### Scores no se recalculan

- Si NO enviaste `simulationId`, el sistema solo reordena (comportamiento esperado)
- Si SÍ enviaste `simulationId`, revisa los logs para errores en Rasch/UdeA

## Ver También

- [WEBSOCKET_USAGE.md](./WEBSOCKET_USAGE.md) - Documentación de WebSocket
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Todos los endpoints disponibles
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema
