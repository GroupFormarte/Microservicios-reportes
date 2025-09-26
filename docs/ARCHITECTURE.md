# Arquitectura del Microservicio de Reportes

## Visión General

El microservicio de reportes es una aplicación Node.js/TypeScript diseñada para generar reportes educativos en PDF a partir de datos de simulaciones académicas. Utiliza una arquitectura modular con separación clara de responsabilidades.

## Stack Tecnológico

### Backend
- **Node.js** 18+ - Runtime JavaScript
- **TypeScript** - Tipado estático
- **Express.js** - Framework web
- **Socket.IO** - WebSocket para comunicación en tiempo real

### Generación de PDFs
- **Puppeteer** - Control de browser headless para PDF
- **EJS** - Template engine para HTML
- **Chart.js** - Generación de gráficos
- **pdf-lib** - Manipulación de PDFs (merge, split)

### Seguridad y Middleware
- **Helmet** - Headers de seguridad
- **CORS** - Cross-Origin Resource Sharing
- **express-rate-limit** - Rate limiting
- **compression** - Compresión HTTP

### Desarrollo y Testing
- **Jest** - Framework de testing
- **ESLint** - Linting de código
- **Prettier** - Formateo de código

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente Frontend                         │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   HTTP Client   │    │  WebSocket      │                │
│  │                 │    │  Client         │                │
│  └─────────┬───────┘    └─────────┬───────┘                │
└───────────┼─────────────────────────┼─────────────────────────┘
            │                        │
            │ REST API               │ Real-time Updates
            │                        │
┌───────────▼─────────────────────────▼─────────────────────────┐
│                 API Gateway Layer                            │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Express Router  │    │ Socket.IO       │                │
│  │ + Middleware    │    │ Server          │                │
│  └─────────┬───────┘    └─────────┬───────┘                │
└───────────┼─────────────────────────┼─────────────────────────┘
            │                        │
            │                        │
┌───────────▼─────────────────────────▼─────────────────────────┐
│                 Application Layer                            │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Controllers   │    │  WebSocket      │                │
│  │                 │    │  Service        │                │
│  └─────────┬───────┘    └─────────┬───────┘                │
└───────────┼─────────────────────────┼─────────────────────────┘
            │                        │
            │                        │
┌───────────▼─────────────────────────▼─────────────────────────┐
│                  Business Layer                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │   Report     │ │   Render     │ │    PDF       │         │
│  │ Processors   │ │  Service     │ │  Service     │         │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘         │
└─────────┼─────────────────┼─────────────────┼─────────────────┘
          │                 │                 │
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼─────────────────┐
│                   Data Layer                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ EJS Templates│ │   Static     │ │  Generated   │         │
│  │              │ │  Resources   │ │    PDFs      │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de Directorios

```
microservice-reports/
├── docs/                          # Documentación
│   ├── API_ENDPOINTS.md          # Documentación de endpoints
│   ├── EJS_TEMPLATES_JSON_SCHEMAS.md  # Esquemas JSON
│   └── ARCHITECTURE.md           # Arquitectura (este archivo)
│
├── public/                       # Recursos públicos
│   ├── css/                     # Estilos CSS
│   │   ├── variables.css        # Variables CSS globales
│   │   ├── base.css            # Estilos base
│   │   ├── horizontal-layout.css # Layout horizontal
│   │   └── vertical-layout.css   # Layout vertical
│   ├── pdfs/                   # PDFs generados (temporal)
│   └── index.html              # Página de preview
│
├── src/                         # Código fuente
│   ├── controllers/            # Controladores
│   │   └── reportsController.ts # Lógica de reportes
│   │
│   ├── middleware/             # Middleware
│   │   ├── auth.ts            # Autenticación
│   │   ├── errorHandler.ts    # Manejo de errores
│   │   └── validation.ts      # Validación de datos
│   │
│   ├── routes/                # Definición de rutas
│   │   ├── health.ts          # Health checks
│   │   └── reports.ts         # Rutas de reportes
│   │
│   ├── services/              # Servicios de negocio
│   │   ├── pdfService.ts      # Generación de PDFs
│   │   ├── renderService.ts   # Renderizado de templates
│   │   └── websocketService.ts # WebSocket
│   │
│   ├── types/                 # Definiciones de tipos
│   │   └── index.ts           # Tipos TypeScript
│   │
│   ├── utils/                 # Utilidades
│   │   ├── calculations.ts    # Cálculos estadísticos
│   │   ├── config.ts          # Configuración
│   │   ├── logger.ts          # Sistema de logging
│   │   ├── pageGenerators.ts  # Generadores de páginas
│   │   └── udeaReports.ts     # Procesadores de datos
│   │
│   └── app.ts                 # Configuración principal de Express
│
├── views/                     # Templates EJS
│   ├── layouts/              # Layouts base
│   │   ├── base.ejs          # Layout base común
│   │   ├── horizontal.ejs    # Layout horizontal
│   │   └── vertical.ejs      # Layout vertical
│   │
│   ├── partials/             # Componentes parciales
│   │   ├── head.ejs          # Sección <head>
│   │   ├── header.ejs        # Header común
│   │   └── scripts.ejs       # Scripts JavaScript
│   │
│   └── components/           # Componentes de reporte
│       ├── portada.ejs                    # Página de portada
│       ├── competencias_chart.ejs         # Gráfico de competencias
│       ├── score_distribution.ejs         # Distribución vertical
│       ├── score_distribution_horizontal.ejs # Distribución horizontal
│       ├── comparativo-puntaje.ejs        # Comparativo
│       ├── tabla-dificultad-analisis.ejs  # Análisis de dificultad
│       ├── bar_chart_simple.ejs           # Gráfico simple
│       ├── bar_chart_with_title.ejs       # Gráficos múltiples
│       ├── tabla_con_puntaje.ejs          # Tabla de estudiantes
│       └── footer_difficulty.ejs          # Footer de dificultad
│
├── tests/                    # Tests automatizados
├── package.json             # Dependencias y scripts
├── tsconfig.json           # Configuración TypeScript
├── .eslintrc.js           # Configuración ESLint
└── README.md              # Documentación básica
```

## Componentes Principales

### 1. Application Layer

#### Controllers (`/src/controllers/`)
- **reportsController.ts**: Punto de entrada principal que maneja las requests HTTP
  - `processSimulationData`: Endpoint principal para generar reportes
  - Maneja diferentes tipos de reporte (UDEA, UNAL, General)
  - Integra WebSocket para progreso en tiempo real

### 2. Business Layer

#### Services (`/src/services/`)

**pdfService.ts**
- Gestiona la generación de PDFs usando Puppeteer
- Maneja configuraciones de página (A4, orientación, márgenes)
- Optimiza recursos (inlining de CSS, conversión de imágenes a base64)
- Merge de múltiples PDFs en uno solo
- Limpieza de archivos temporales

**renderService.ts**
- Renderiza templates EJS con datos
- Maneja diferentes layouts (horizontal/vertical)
- Inyecta CSS y recursos estáticos
- Optimizado para generación de PDF

**websocketService.ts**
- Comunicación en tiempo real con clientes
- Gestión de sesiones independientes
- Emisión de eventos de progreso, errores y completado
- Integración con el proceso de generación de reportes

#### Report Processors (`/src/utils/`)

**udeaReports.ts**
- `procesarDistribucionCompetencias`: Analiza distribución por competencias
- `procesarDesempenoPorArea`: Calcula desempeño por áreas
- `procesarTablaDificultadAnalisis`: Analiza dificultad de preguntas
- `procesarTablaEstudiantes`: Genera tabla de estudiantes
- `procesarTablaEstudiantesPorArea`: Tabla por áreas
- Funciones estadísticas dinámicas

**pageGenerators.ts**
- `generarBaseHeaderInfo`: Información de encabezado común
- `generarPaginaPortada`: Generación de portada
- `generarPaginaCompetenciasChart`: Páginas de competencias

**calculations.ts**
- Cálculos estadísticos (promedio, desviación estándar)
- Funciones de distribución y categorización
- Utilidades matemáticas para reportes

### 3. Data Layer

#### Templates (`/views/`)
- **Layouts**: Estructuras base para páginas horizontales y verticales
- **Components**: Componentes reutilizables para cada tipo de visualización
- **Partials**: Elementos compartidos (head, header, scripts)

#### Static Resources (`/public/`)
- **CSS**: Estilos optimizados para impresión PDF
- **Assets**: Imágenes e iconos institucionales
- **Generated PDFs**: Almacenamiento temporal de PDFs

## Flujo de Procesamiento

### 1. Recepción de Datos
```
Cliente → POST /api/reports/simulation → reportsController.processSimulationData
```

### 2. Procesamiento por Tipo de Reporte

#### UDEA
1. Procesamiento de competencias (clasificación I, II, III)
2. Análisis por áreas (Insuficiente, Mínimo, Satisfactorio, Avanzado)
3. Análisis de dificultad de preguntas
4. Generación de tabla de estudiantes

#### UNAL
1. Procesamiento de competencias (niveles 1-4 por puntaje)
2. Análisis por áreas sin guía
3. Análisis de dificultad
4. Tabla de estudiantes

#### General
1. Comparativo multi-nivel (nacional, departamental, municipal, institucional)
2. Distribución por competencias y áreas
3. Distribución por asignaturas (paginada)
4. Distribución por ejes temáticos (paginada)
5. Tablas duales (competencias y áreas)

### 3. Generación de Páginas
```
Datos Procesados → Generadores de Página → Estructura PageRequest[]
```

### 4. Renderizado y PDF
```
PageRequest[] → RenderService → HTML → PdfService → PDF Individual → Merge → PDF Final
```

### 5. Respuesta
```
PDF Final → Cleanup → Response JSON con URL de descarga
```

## Patrones de Diseño

### 1. Service Layer Pattern
- Separación clara entre controladores y lógica de negocio
- Services reutilizables e independientes
- Inyección de dependencias implícita

### 2. Template Method Pattern
- Templates EJS con estructura común
- Layouts base reutilizables
- Componentes especializados

### 3. Strategy Pattern
- Diferentes procesadores por tipo de reporte
- Configuraciones dinámicas de rangos y colores
- Estrategias de renderizado por layout

### 4. Observer Pattern
- WebSocket para notificaciones en tiempo real
- Eventos de progreso durante el procesamiento
- Desacoplamiento entre proceso y notificación

### 5. Factory Pattern
- Generación dinámica de páginas
- Configuración de gráficos por tipo
- Creación de estructuras de datos específicas

## Configuración y Variables de Entorno

### Variables Principales
```env
PORT=3001                           # Puerto del servidor
NODE_ENV=development                # Entorno de ejecución
HOST=localhost                      # Host del servidor
CORS_ORIGIN=http://localhost:3000   # Origen permitido para CORS
API_KEY=your-secret-api-key         # Clave de autenticación
LOG_LEVEL=info                      # Nivel de logging
```

### Configuraciones de Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000         # Ventana de 15 minutos
RATE_LIMIT_MAX_REQUESTS=100         # 100 requests por ventana
```

### Configuraciones de CORS
```env
CORS_CREDENTIALS=true               # Permitir credenciales
```

## Seguridad

### 1. Autenticación
- API Key en header `X-API-Key`
- Validación en middleware antes de endpoints protegidos
- Exclusión de endpoints públicos (/health, /public)

### 2. Rate Limiting
- Limitación por IP
- Configuración flexible por entorno
- Headers informativos en respuesta

### 3. Seguridad de Headers
- Helmet con CSP restrictiva
- Protección contra ataques comunes
- Configuración específica para recursos PDF

### 4. Validación de Datos
- Middleware de validación con esquemas
- Sanitización de entrada
- Límites de tamaño de payload (10MB)

### 5. Manejo de Errores
- Error handler centralizado
- Logging de errores con contexto
- Respuestas consistentes sin exposición de stack traces en producción

## Performance y Optimización

### 1. Generación de PDF
- Reutilización de instancia de browser Puppeteer
- Inlining de recursos para reducir requests
- Configuración optimizada de Puppeteer para servidor

### 2. Memory Management
- Cleanup automático de archivos temporales
- Cierre correcto de páginas de browser
- Graceful shutdown con limpieza de recursos

### 3. Caching
- Reutilización de configuraciones base
- Cache de imágenes convertidas a base64
- Optimización de CSS compilado

### 4. Concurrent Processing
- Procesamiento secuencial de PDFs para evitar sobrecarga
- WebSocket para feedback sin bloqueo
- Rate limiting para controlar carga

## Escalabilidad

### 1. Horizontal Scaling
- Stateless design permite múltiples instancias
- WebSocket con session management independiente
- PDF storage temporal por instancia

### 2. Resource Management
- Límites configurables de memoria y CPU
- Timeouts apropiados para operaciones largas
- Cleanup automático de recursos

### 3. Monitoring
- Health checks comprehensivos
- Logging estructurado para análisis
- Métricas de performance incluidas

## Testing Strategy

### 1. Unit Tests
- Tests de funciones de cálculo
- Tests de procesadores de datos
- Mocks de servicios externos

### 2. Integration Tests
- Tests de endpoints completos
- Tests de generación de PDF
- Tests de WebSocket

### 3. Performance Tests
- Tests de carga para endpoints
- Tests de memoria para generación PDF
- Tests de concurrencia

## Deployment

### 1. Containerization
- Dockerfile optimizado para Node.js
- Multi-stage build para optimización
- Configuración de healthchecks

### 2. Environment Configuration
- Configuración por variables de entorno
- Separación de secrets
- Configuración específica por entorno

### 3. Dependencies
- Puppeteer con dependencias del sistema
- Gestión de fonts para PDF
- Optimización de imagen base

## Maintenance y Monitoring

### 1. Logging
- Structured logging con Winston
- Niveles apropiados por entorno
- Contexto rico en logs de error

### 2. Health Monitoring
- Health checks detallados
- Readiness probes
- Métricas de sistema incluidas

### 3. Error Handling
- Error tracking centralizado
- Notificaciones de errores críticos
- Recovery automático cuando es posible

## Evolución Futura

### 1. Mejoras Planificadas
- Cache distribuido para templates
- Queue system para procesamiento asíncrono
- Dashboard de administración

### 2. Extensibilidad
- Plugin system para nuevos tipos de reporte
- Template engine intercambiable
- Soporte para múltiples formatos de salida

### 3. Optimización
- WebAssembly para cálculos intensivos
- Edge caching para recursos estáticos
- Compression avanzada para PDFs