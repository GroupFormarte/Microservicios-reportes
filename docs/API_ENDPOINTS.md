# API Endpoints Documentation

Esta documentación describe todos los endpoints disponibles en el microservicio de reportes.

## Configuración Base

- **URL Base**: `http://localhost:3001`
- **Autenticación**: API Key requerida en el header `X-API-Key` para endpoints `/api/reports/*`
- **Content-Type**: `application/json`
- **Límite de Rate**: 100 requests por 15 minutos por IP

## Índice de Endpoints

1. [Health Check](#health-check)
2. [Generación de Reportes](#generaci%C3%B3n-de-reportes)
3. [Recursos Estáticos](#recursos-est%C3%A1ticos)
4. [WebSocket](#websocket)

---

## Health Check

### GET /health

Verifica el estado del servicio.

**Headers**: No requiere autenticación

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-19T14:53:31.545Z",
    "uptime": 3600.25,
    "environment": "development",
    "version": "1.0.0",
    "memory": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 18874368,
      "external": 2097152,
      "arrayBuffers": 1048576
    },
    "cpu": {
      "user": 123456,
      "system": 78910
    }
  }
}
```

### GET /health/ready

Verifica si el servicio está listo para recibir requests.

**Headers**: No requiere autenticación

**Response Success**:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "timestamp": "2025-09-19T14:53:31.545Z"
  }
}
```

**Response Not Ready** (503):
```json
{
  "success": false,
  "error": "Service not ready"
}
```

---

## Generación de Reportes

### POST /api/reports/simulation

Procesa datos de simulación y genera reportes completos en PDF.

**Headers**:
```
X-API-Key: your-api-key
Content-Type: application/json
X-Session-ID: unique-session-id (opcional, para WebSocket)
```

**Request Body**:
```json
{
  "tipe_inform": "udea|unal|general",
  "campus": "FORMARTE MEDELLÍN",
  "course": "Preparación ICFES",
  "students": [
    {
      "id": "student_id",
      "name": "Nombre Estudiante",
      "course_id": "11-A",
      "examenes_asignados": [
        {
          "score": 85.5,
          "position": 1,
          "materias": [
            {
              "area": "Matemáticas",
              "asignatura": "Álgebra",
              "competencies": [
                {
                  "name": "Razonamiento",
                  "skills": [
                    {
                      "porcentaje": 78.5
                    }
                  ]
                }
              ],
              "questions": [
                {
                  "id_pregunta": "q001",
                  "id_respuesta": "opt_a",
                  "es_correcta": true
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "detailQuestion": [
    {
      "id": "q001",
      "cod": "MAT-001",
      "componente": "Algebraico",
      "competencia": "Razonamiento",
      "area": "Matemáticas",
      "asignatura": "Álgebra",
      "eje_tematico": "Ecuaciones",
      "grado": "11",
      "programa": "Saber 11",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_a",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    }
  ]
}
```

**Response Success**:
```json
{
  "success": true,
  "data": {
    "message": "Reporte generado exitosamente",
    "totalPages": 12,
    "reportType": "udea",
    "metadata": {
      "institution": "FORMARTE MEDELLÍN",
      "course": "Preparación ICFES",
      "generatedAt": "2025-09-19T14:53:31.545Z"
    },
    "pdf": {
      "fileName": "reporte_completo_FORMARTE_MEDELLIN_1758200101156.pdf",
      "url": "http://localhost:3001/api/reports/pdfs/reporte_completo_FORMARTE_MEDELLIN_1758200101156.pdf",
      "downloadUrl": "http://localhost:3001/api/reports/pdfs/reporte_completo_FORMARTE_MEDELLIN_1758200101156.pdf?download=true"
    },
    "rawData": {
      "portada": {
        "layout": "vertical",
        "chartTitle": "Portada",
        "headerInfo": { ... },
        "components": [ ... ]
      }
    }
  }
}
```

**Response Error** (400/500):
```json
{
  "success": false,
  "error": "Error message describing the issue",
  "data": {
    "stack": "Error stack trace (only in development)"
  }
}
```

#### Tipos de Reporte

1. **UDEA** (`tipe_inform: "udea"`):
   - Clasificación por competencias: I (0-35%), II (36-75%), III (76-100%)
   - Distribución por áreas: Insuficiente, Mínimo, Satisfactorio, Avanzado
   - Análisis de dificultad por pregunta
   - Tabla de estudiantes por competencias

2. **UNAL** (`tipe_inform: "unal"`):
   - Clasificación por niveles: 1 (100-350), 2 (351-500), 3 (501-700), 4 (701-1000)
   - Distribución por áreas sin guía de leyenda
   - Análisis de dificultad
   - Tabla de estudiantes

3. **General** (`tipe_inform: "general"`):
   - Comparativo de puntajes por niveles administrativos
   - Distribución por competencias y áreas
   - Distribución por asignaturas (paginada)
   - Distribución por ejes temáticos (paginada)
   - Tabla de estudiantes por competencias y por áreas
   - Análisis de dificultad con niveles personalizados

#### Progreso con WebSocket

Si se incluye `X-Session-ID` en los headers, el progreso se enviará vía WebSocket:

**Etapas de Progreso**:
- `initializing` (0%) - Iniciando procesamiento
- `generating_base_data` (5%) - Generando datos base
- `generating_cover` (10%) - Creando portada
- `processing_udea/unal/general` (15%) - Procesando tipo específico
- `processing_competencies` (25%) - Procesando competencias
- `processing_areas` (35%) - Procesando áreas
- `processing_students` (45%) - Procesando estudiantes
- `processing_difficulty` (55%) - Procesando dificultad
- `generating_pages` (65%) - Generando páginas
- `generating_pdfs` (70-90%) - Generando PDFs
- `merging_pdfs` (90%) - Fusionando PDFs
- `cleaning_up` (95%) - Limpiando archivos
- `completed` (100%) - Proceso terminado

---

## Recursos Estáticos

### GET /api/reports/pdfs/{filename}

Descarga archivos PDF generados.

**Headers**: 
```
X-API-Key: your-api-key
```

**Parameters**:
- `filename`: Nombre del archivo PDF
- `download=true` (query param opcional): Fuerza descarga en lugar de vista

**Response**:
- **Content-Type**: `application/pdf`
- **Status**: 200 (archivo encontrado) | 404 (archivo no encontrado)

**Ejemplo**:
```
GET /api/reports/pdfs/reporte_completo_FORMARTE_MEDELLIN_1758200101156.pdf
GET /api/reports/pdfs/reporte_completo_FORMARTE_MEDELLIN_1758200101156.pdf?download=true
```

### GET /api/reports/css/{filename}

Acceso a archivos CSS del sistema.

**Headers**: 
```
X-API-Key: your-api-key
```

**Archivos disponibles**:
- `variables.css` - Variables CSS globales
- `base.css` - Estilos base
- `horizontal-layout.css` - Layout horizontal
- `vertical-layout.css` - Layout vertical

### GET /api/reports/assets/{path}

Acceso a recursos estáticos (imágenes, iconos).

**Headers**: 
```
X-API-Key: your-api-key
```

**Estructura de archivos**:
```
/api/reports/assets/
  └── PNG/
      ├── Logo horizontal.png
      ├── Institucion.png
      ├── Evaluacion.png
      ├── Municipio.png
      └── Fecha.png
```

### GET /public/{path}

Recursos públicos sin autenticación (archivos estáticos generales).

**Headers**: No requiere autenticación

---

## WebSocket

### Conexión WebSocket

**URL**: `ws://localhost:3001` o `http://localhost:3001` (Socket.io)

**Namespace**: Default (`/`)

**Transports**: `['websocket', 'polling']`

#### Eventos del Cliente

**join-session**
```javascript
socket.emit('join-session', sessionId);
```

#### Eventos del Servidor

**progress-update**
```javascript
socket.on('progress-update', (data) => {
  // data: ProgressUpdate
  console.log(`${data.stage}: ${data.progress}% - ${data.message}`);
});
```

**error**
```javascript
socket.on('error', (errorData) => {
  // errorData: WebSocketError
  console.error(`Error: ${errorData.error}`);
});
```

**complete**
```javascript
socket.on('complete', (completeData) => {
  // completeData: WebSocketComplete
  console.log('Process completed:', completeData.result);
});
```

#### Tipos de Datos WebSocket

**ProgressUpdate**:
```typescript
{
  sessionId: string;
  stage: string;
  progress: number;      // 0-100
  message: string;
  timestamp: Date;
  data?: any;           // Datos adicionales opcionales
}
```

**WebSocketError**:
```typescript
{
  sessionId: string;
  error: string;
  details?: any;
  timestamp: Date;
}
```

**WebSocketComplete**:
```typescript
{
  sessionId: string;
  result: any;          // Resultado final del proceso
  timestamp: Date;
}
```

---

## Códigos de Estado HTTP

### Códigos de Éxito
- **200 OK**: Request procesado exitosamente
- **201 Created**: Recurso creado exitosamente

### Códigos de Error del Cliente
- **400 Bad Request**: Datos de entrada inválidos
- **401 Unauthorized**: API Key faltante o inválida
- **404 Not Found**: Endpoint o recurso no encontrado
- **429 Too Many Requests**: Límite de rate excedido

### Códigos de Error del Servidor
- **500 Internal Server Error**: Error interno del servidor
- **503 Service Unavailable**: Servicio no disponible

---

## Ejemplos de Uso

### Generar Reporte UDEA

```javascript
const response = await fetch('http://localhost:3001/api/reports/simulation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
    'X-Session-ID': 'session_123'
  },
  body: JSON.stringify({
    tipe_inform: 'udea',
    campus: 'FORMARTE MEDELLÍN',
    course: 'Preparación ICFES',
    students: [ /* datos de estudiantes */ ],
    detailQuestion: [ /* detalles de preguntas */ ]
  })
});

const result = await response.json();
console.log('PDF URL:', result.data.pdf.url);
```

### Conectar WebSocket para Seguimiento

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');
const sessionId = 'session_123';

socket.emit('join-session', sessionId);

socket.on('progress-update', (data) => {
  updateProgressBar(data.progress);
  updateStatusMessage(data.message);
});

socket.on('complete', (data) => {
  window.open(data.result.url, '_blank');
});
```

### Verificar Estado del Servicio

```javascript
const healthCheck = await fetch('http://localhost:3001/health');
const health = await healthCheck.json();

if (health.data.status === 'healthy') {
  console.log('Service is running normally');
}
```

---

## Configuración de Seguridad

### CORS
```javascript
{
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}
```

### Rate Limiting
- **Ventana**: 15 minutos (configurable)
- **Límite**: 100 requests por IP (configurable)
- **Aplica a**: Todos los endpoints `/api/*`

### Headers de Seguridad
- **Helmet**: Configurado con CSP restrictiva
- **Content Security Policy**: Permite recursos necesarios para PDF generation
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff

### Autenticación
- **Método**: API Key en header `X-API-Key`
- **Aplica a**: Todos los endpoints `/api/reports/*`
- **Excluye**: `/health/*` y recursos `/public/*`

---

## Logging y Monitoreo

### Niveles de Log
- **error**: Errores críticos
- **warn**: Advertencias importantes
- **info**: Información general
- **debug**: Información detallada (solo desarrollo)

### Eventos Logged
- Inicio/cierre del servidor
- Generación de PDFs (tiempo, tamaño, errores)
- Conexiones WebSocket
- Errores de autenticación
- Rate limiting violations

### Formato de Log
```
[2025-09-19T14:53:31.545Z] INFO: Server running on http://localhost:3001 {"environment":"development"}
[2025-09-19T14:53:31.545Z] INFO: PDF generated successfully in 2500ms {"size":1048576,"format":"A4","orientation":"portrait"}
```