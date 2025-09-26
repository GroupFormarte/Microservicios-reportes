# 📊 Microservicio de Reportes FORMARTE

Un microservicio Node.js/TypeScript especializado en la generación de reportes educativos en PDF a partir de datos de simulaciones académicas. Soporta múltiples tipos de reporte (UDEA, UNAL, General) con comunicación en tiempo real via WebSocket.

## 🌟 Características Principales

- **📈 Múltiples Tipos de Reporte**: UDEA, UNAL y reportes generales personalizables
- **🎨 Visualizaciones Dinámicas**: Gráficos de barras, donas, comparativos y tablas
- **📄 Generación PDF Optimizada**: PDFs de alta calidad con Puppeteer
- **🔄 Progreso en Tiempo Real**: WebSocket para seguimiento de progreso
- **🛡️ Seguridad Robusta**: Autenticación API Key, rate limiting, validación
- **📊 Análisis Estadístico**: Cálculos de dificultad, distribuciones y promedios
- **🎯 Arquitectura Modular**: Componentes reutilizables y extensibles

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Sistema operativo compatible con Puppeteer

### Instalación

```bash
# Clonar repositorio
git clone [repository-url]
cd microservice-reports

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Modo desarrollo
npm run dev

# Producción
npm run build
npm start
```

### Verificación

```bash
# Health check
curl http://localhost:3001/health

# Respuesta esperada
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-19T14:53:31.545Z",
    "uptime": 3600.25,
    "environment": "development",
    "version": "1.0.0"
  }
}
```

## 📚 Documentación

### 📖 Documentación Principal

| Documento | Descripción |
|-----------|-------------|
| [🏗️ Arquitectura](docs/ARCHITECTURE.md) | Arquitectura del sistema, patrones y componentes |
| [🌐 API Endpoints](docs/API_ENDPOINTS.md) | Documentación completa de endpoints REST y WebSocket |
| [📋 Templates JSON](docs/EJS_TEMPLATES_JSON_SCHEMAS.md) | Esquemas JSON para templates EJS |
| [💡 Ejemplos de Uso](docs/USAGE_EXAMPLES.md) | Ejemplos prácticos y casos de uso |
| [🔌 WebSocket](WEBSOCKET_USAGE.md) | Guía de integración WebSocket |

### 🔧 Referencias Técnicas

- **Stack**: Node.js, TypeScript, Express, Socket.IO, Puppeteer, EJS
- **Puerto**: 3001 (configurable)
- **Autenticación**: API Key en header `X-API-Key`
- **Formatos**: PDF (A4, orientación configurable)

## 🎯 Tipos de Reporte

### 📊 UDEA (`tipe_inform: "udea"`)
- **Clasificación**: Niveles I, II, III por porcentaje (0-35%, 36-75%, 76-100%)
- **Áreas**: Insuficiente, Mínimo, Satisfactorio, Avanzado
- **Incluye**: Distribución de competencias, análisis de dificultad, tabla de estudiantes

### 🎓 UNAL (`tipe_inform: "unal"`)
- **Clasificación**: Niveles 1-4 por puntaje (100-350, 351-500, 501-700, 701-1000)
- **Características**: Sin guía de leyenda, optimizado para admisiones
- **Incluye**: Competencias UNAL, distribución por áreas, análisis de dificultad

### 📈 General (`tipe_inform: "general"`)
- **Comparativos**: Multi-nivel (nacional, departamental, municipal, institucional)
- **Distribuciones**: Competencias, áreas, asignaturas (paginadas), ejes temáticos
- **Tablas**: Duales por competencias y áreas
- **Personalizable**: Niveles de dificultad configurables

## 🚀 Ejemplo de Uso Básico

### JavaScript (Frontend)

```javascript
async function generateReport() {
  const response = await fetch('http://localhost:3001/api/reports/simulation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    },
    body: JSON.stringify({
      "tipe_inform": "udea",
      "campus": "FORMARTE MEDELLÍN",
      "course": "Preparación ICFES",
      "students": [
        {
          "id": "std_001",
          "name": "ESTUDIANTE EJEMPLO",
          "course_id": "11-A",
          "examenes_asignados": [{
            "score": 85.5,
            "position": 1,
            "materias": [{
              "area": "Matemáticas",
              "asignatura": "Álgebra",
              "competencies": [{
                "name": "Razonamiento",
                "skills": [{"porcentaje": 78.5}]
              }],
              "questions": [{
                "id_pregunta": "q001",
                "id_respuesta": "opt_a",
                "es_correcta": true
              }]
            }]
          }]
        }
      ],
      "detailQuestion": [{
        "id": "q001",
        "cod": "MAT-001",
        "componente": "Algebraico",
        "competencia": "Razonamiento",
        "area": "Matemáticas",
        "cant_respuesta": "4",
        "pregunta_correcta": "opt_a",
        "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
      }]
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('✅ PDF generado:', result.data.pdf.url);
    window.open(result.data.pdf.url, '_blank');
  }
}
```

### Node.js (Backend)

```javascript
const fetch = require('node-fetch');

async function generateReportServer() {
  try {
    const response = await fetch('http://localhost:3001/api/reports/simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.FORMARTE_API_KEY
      },
      body: JSON.stringify(reportData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`📄 Reporte generado: ${result.data.pdf.fileName}`);
      return result.data.pdf.url;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}
```

## 🔌 WebSocket en Tiempo Real

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');
const sessionId = 'unique-session-id';

// Unirse a sesión
socket.emit('join-session', sessionId);

// Escuchar progreso
socket.on('progress-update', (data) => {
  console.log(`${data.stage}: ${data.progress}% - ${data.message}`);
  updateProgressBar(data.progress);
});

// Escuchar finalización
socket.on('complete', (data) => {
  console.log('🎉 Completado:', data.result);
  window.open(data.result.url, '_blank');
});

// Realizar request con session ID
fetch('/api/reports/simulation', {
  method: 'POST',
  headers: {
    'X-Session-ID': sessionId,
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify(reportData)
});
```

## 🛠️ Configuración

### Variables de Entorno

```env
# Servidor
PORT=3001
NODE_ENV=development
HOST=localhost

# Seguridad
API_KEY=your-secret-api-key
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Scripts NPM

```bash
# Desarrollo
npm run dev          # Modo desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Producción

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Coverage report

# Linting
npm run lint         # ESLint
npm run lint:fix     # Fix automático
npm run format       # Prettier
```

## 📊 Estructura del Proyecto

```
microservice-reports/
├── 📁 docs/                     # Documentación
├── 📁 public/                   # Recursos públicos
│   ├── 📁 css/                 # Estilos para PDF
│   └── 📁 pdfs/                # PDFs generados
├── 📁 src/                      # Código fuente
│   ├── 📁 controllers/         # Controladores HTTP
│   ├── 📁 middleware/          # Middleware Express
│   ├── 📁 routes/              # Definición de rutas
│   ├── 📁 services/            # Servicios de negocio
│   ├── 📁 types/               # Tipos TypeScript
│   ├── 📁 utils/               # Utilidades
│   └── 📄 app.ts               # App principal
├── 📁 views/                    # Templates EJS
│   ├── 📁 layouts/             # Layouts base
│   ├── 📁 partials/            # Parciales
│   └── 📁 components/          # Componentes
└── 📁 tests/                    # Tests automatizados
```

## 🔍 Componentes Principales

### 🎛️ Servicios

- **`pdfService`**: Generación de PDFs con Puppeteer
- **`renderService`**: Renderizado de templates EJS
- **`websocketService`**: Comunicación en tiempo real

### 📊 Procesadores de Datos

- **`udeaReports`**: Lógica de reportes UDEA/UNAL/General
- **`pageGenerators`**: Generadores de páginas específicas
- **`calculations`**: Cálculos estadísticos y matemáticos

### 🎨 Templates

- **Layouts**: `base.ejs`, `horizontal.ejs`, `vertical.ejs`
- **Componentes**: 9 tipos de visualizaciones (gráficos, tablas, portadas)
- **Parciales**: Header, footer, scripts comunes

## 🔒 Seguridad

### 🛡️ Características de Seguridad

- **Autenticación**: API Key obligatoria
- **Rate Limiting**: 100 requests/15min por IP
- **CORS**: Configuración restrictiva
- **Helmet**: Headers de seguridad
- **Validación**: Sanitización de entrada
- **Logs**: Auditoría completa

### 🔐 Headers Requeridos

```http
X-API-Key: your-secret-api-key
Content-Type: application/json
X-Session-ID: session-id (opcional, para WebSocket)
```

## 📈 Performance

### ⚡ Optimizaciones

- **Puppeteer**: Instancia reutilizable del browser
- **Resources**: Inlining de CSS e imágenes
- **Memory**: Cleanup automático de archivos temporales
- **Concurrency**: Rate limiting para control de carga

### 📊 Métricas

- **Health Checks**: `/health` y `/health/ready`
- **Logging**: Structured logging con timestamps
- **Monitoring**: Métricas de memoria, CPU y uptime

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm test -- --grep "PDF generation"
npm test -- --grep "WebSocket"

# Coverage
npm run test:coverage
```

### 🎯 Tipos de Tests

- **Unit Tests**: Funciones de cálculo y utilidades
- **Integration Tests**: Endpoints completos
- **PDF Tests**: Generación y validación de PDFs
- **WebSocket Tests**: Comunicación en tiempo real

## 🚢 Deployment

### 🐳 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### 🌐 Docker Compose

```yaml
version: '3.8'
services:
  reports:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - API_KEY=${API_KEY}
    volumes:
      - ./public/pdfs:/app/public/pdfs
    restart: unless-stopped
```

### ☁️ Cloud Deployment

Configuración específica para:
- **AWS ECS/EKS**
- **Google Cloud Run**
- **Azure Container Instances**
- **Railway, Render, Heroku**

## 🔧 Mantenimiento

### 📝 Logs

```bash
# Ver logs en tiempo real
docker logs -f microservice-reports

# Logs estructurados
[2025-09-19T14:53:31.545Z] INFO: PDF generated successfully {"duration":2500,"size":1048576}
```

### 🔄 Actualizaciones

```bash
# Actualizar dependencias
npm update

# Audit de seguridad
npm audit
npm audit fix

# Rebuild completo
npm run clean
npm install
npm run build
```

## 🤝 Contribución

### 📋 Guidelines

1. **Fork** el repositorio
2. **Crear** branch para feature (`git checkout -b feature/amazing-feature`)
3. **Commit** cambios (`git commit -m 'Add amazing feature'`)
4. **Push** al branch (`git push origin feature/amazing-feature`)
5. **Abrir** Pull Request

### ✅ Checklist PR

- [ ] Tests pasan (`npm test`)
- [ ] Linting OK (`npm run lint`)
- [ ] Documentación actualizada
- [ ] Tipos TypeScript correctos
- [ ] Changelog actualizado

## 📞 Soporte

### 🆘 Obtener Ayuda

- **Documentación**: Revisar `/docs` directory
- **Issues**: GitHub Issues para bugs
- **Feature Requests**: GitHub Discussions
- **Email**: support@formarte.edu.co

### 🐛 Reportar Bugs

Incluir en el reporte:
- Versión del microservicio
- Datos de entrada (anonimizados)
- Logs de error
- Pasos para reproducir
- Entorno (OS, Node.js version)

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🎯 Roadmap

### 🔮 Versión 2.0

- [ ] **Queue System**: Redis para procesamiento asíncrono
- [ ] **Templates Engine**: Sistema de plugins para templates
- [ ] **Multi-format**: Soporte para Excel, Word, PowerPoint
- [ ] **Dashboard**: Panel de administración web
- [ ] **API GraphQL**: Endpoint GraphQL complementario
- [ ] **Caching**: Cache distribuido para templates
- [ ] **Microservices**: Separación en microservicios especializados

### 🏗️ Mejoras Técnicas

- [ ] **WebAssembly**: Cálculos intensivos optimizados
- [ ] **Edge Computing**: CDN para recursos estáticos
- [ ] **ML Integration**: Análisis predictivo de rendimiento
- [ ] **Real-time Collaboration**: Edición colaborativa de reportes

---

<div align="center">

**🎓 Desarrollado con ❤️ para FORMARTE**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

</div>