# 🔐 Sistema de Autenticación - Formarte Reports

El microservicio de reportes ahora incluye un sistema de autenticación robusto que valida usuarios contra la API de Podium y genera tokens JWT para acceso seguro.

## 🌟 Características

- **✅ Validación con API Podium**: Verifica usuarios contra `https://stage-api.plataformapodium.com/api/user/`
- **🔑 Tokens JWT**: Genera tokens seguros para el servicio de reportes
- **🔄 Refresh de Tokens**: Renovación automática de tokens próximos a expirar
- **🛡️ Middleware Híbrido**: Soporta tanto JWT como API Key (legacy)
- **📊 Logging Completo**: Auditoría de todos los intentos de autenticación

## 🚀 Flujo de Autenticación

### 1. Autenticación Inicial

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as Reports Service
    participant P as Podium API
    
    C->>R: POST /api/auth/login {userId, token}
    R->>P: GET /api/user/{userId} + Bearer token
    P->>R: Usuario válido (200) / Inválido (401/404)
    R->>R: Generar JWT token
    R->>C: JWT token para reports service
```

### 2. Uso del Servicio

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as Reports Service
    
    C->>R: POST /api/reports/simulation + Bearer JWT
    R->>R: Validar JWT token
    R->>R: Procesar reporte
    R->>C: PDF generado
```

## 📡 Endpoints de Autenticación

### POST /api/auth/login

Autentica usuario con Podium API y retorna JWT token.

**Request:**
```json
{
  "userId": "user123",
  "token": "podium_bearer_token_from_client"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "tokenType": "Bearer",
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "Usuario Ejemplo"
    }
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": "Invalid user credentials"
}
```

### GET /api/auth/verify

Verifica validez del JWT token actual.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "user123",
    "expiresIn": 86400,
    "userData": {
      "id": "user123",
      "email": "user@example.com",
      "name": "Usuario Ejemplo"
    }
  }
}
```

### POST /api/auth/refresh

Renueva JWT token si está próximo a expirar (< 2 horas).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "tokenType": "Bearer"
  }
}
```

### POST /api/auth/logout

Logout del usuario (principalmente para logging).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

## 🔧 Uso en Cliente

### JavaScript/TypeScript

```javascript
class FormarteReportsClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.accessToken = null;
  }

  // 1. Autenticarse con Podium credentials
  async login(userId, podiumToken) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        token: podiumToken
      })
    });

    const result = await response.json();

    if (result.success) {
      this.accessToken = result.data.accessToken;
      console.log('✅ Autenticado exitosamente');
      return result.data;
    } else {
      throw new Error(result.error);
    }
  }

  // 2. Generar reporte usando JWT token
  async generateReport(reportData) {
    if (!this.accessToken) {
      throw new Error('No authenticated. Call login() first.');
    }

    const response = await fetch(`${this.baseUrl}/api/reports/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify(reportData)
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      // Si el token expiró, intentar renovar
      if (result.error?.includes('expired')) {
        await this.refreshToken();
        return this.generateReport(reportData); // Reintentar
      }
      throw new Error(result.error);
    }
  }

  // 3. Renovar token si es necesario
  async refreshToken() {
    const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    const result = await response.json();

    if (result.success) {
      this.accessToken = result.data.accessToken;
      console.log('🔄 Token renovado exitosamente');
    } else {
      console.warn('⚠️ No se pudo renovar token:', result.error);
    }
  }

  // 4. Verificar token
  async verifyToken() {
    const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    const result = await response.json();
    return result.success && result.data.valid;
  }

  // 5. Logout
  async logout() {
    await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    this.accessToken = null;
    console.log('👋 Logout exitoso');
  }
}

// Ejemplo de uso
async function example() {
  const client = new FormarteReportsClient();

  try {
    // 1. Autenticarse
    await client.login('user123', 'podium_token_here');

    // 2. Generar reporte
    const report = await client.generateReport({
      tipe_inform: 'udea',
      campus: 'FORMARTE MEDELLÍN',
      students: [/* datos de estudiantes */]
    });

    console.log('📄 Reporte generado:', report.pdf.url);

    // 3. Logout
    await client.logout();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}
```

### React Hook

```javascript
import { useState, useCallback } from 'react';

export const useFormarteAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (userId, podiumToken) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: podiumToken })
      });

      const result = await response.json();

      if (result.success) {
        setAccessToken(result.data.accessToken);
        setUser(result.data.user);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (reportData) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/reports/simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(reportData)
    });

    return response.json();
  }, [accessToken]);

  const logout = useCallback(async () => {
    if (accessToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    }
    setAccessToken(null);
    setUser(null);
  }, [accessToken]);

  return {
    accessToken,
    user,
    loading,
    isAuthenticated: !!accessToken,
    login,
    generateReport,
    logout
  };
};

// Uso en componente
function ReportGenerator() {
  const { isAuthenticated, login, generateReport, logout } = useFormarteAuth();
  const [report, setReport] = useState(null);

  const handleLogin = async () => {
    try {
      await login('user123', 'podium_token');
      alert('✅ Autenticado exitosamente');
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const result = await generateReport({
        tipe_inform: 'udea',
        campus: 'FORMARTE MEDELLÍN',
        // ... datos del reporte
      });
      setReport(result.data);
      window.open(result.data.pdf.url, '_blank');
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div>
        <h1>🔐 Autenticación Requerida</h1>
        <button onClick={handleLogin}>Iniciar Sesión</button>
      </div>
    );
  }

  return (
    <div>
      <h1>📊 Generador de Reportes</h1>
      <button onClick={handleGenerateReport}>Generar Reporte</button>
      <button onClick={logout}>Cerrar Sesión</button>
      {report && (
        <div>
          <p>✅ Reporte generado: {report.pdf.fileName}</p>
          <a href={report.pdf.url} target="_blank">Ver PDF</a>
        </div>
      )}
    </div>
  );
}
```

## 🔒 Configuración de Seguridad

### Variables de Entorno

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Podium API Configuration (internal - no env vars needed)
# API URL: https://stage-api.plataformapodium.com/api/user/

# Optional: API Key for legacy compatibility
API_KEY=legacy-api-key-for-backwards-compatibility
```

### Middleware de Autenticación

El servicio incluye varios middleware de autenticación:

1. **`jwtAuth`** - Solo JWT tokens
2. **`apiKeyAuth`** - Solo API Keys (legacy)
3. **`hybridAuth`** - JWT o API Key (recomendado)
4. **`optionalJwtAuth`** - JWT opcional

```javascript
// En las rutas
app.use('/api/reports', hybridAuth, reportsRoutes);     // Requiere autenticación
app.use('/api/auth', authRoutes);                       // Sin autenticación
app.use('/health', healthRoutes);                       // Sin autenticación
```

## 🛡️ Seguridad y Mejores Prácticas

### Configuración del JWT

- **Algoritmo**: HS256
- **Expiración**: 24 horas
- **Issuer**: formarte-reports
- **Audience**: formarte-users

### Validación de Usuarios

```javascript
// El servicio valida contra Podium API:
GET https://stage-api.plataformapodium.com/api/user/{userId}
Headers: Authorization: Bearer {podium_token}

// Respuestas esperadas:
// 200: Usuario válido
// 401/403: Token inválido
// 404: Usuario no encontrado
```

### Logging de Seguridad

Todos los eventos de autenticación se registran:

```
[2025-09-19T16:02:07.559Z] INFO: Authentication attempt started {"userId":"user123","ip":"127.0.0.1"}
[2025-09-19T16:02:08.123Z] INFO: User authenticated successfully {"userId":"user123","ip":"127.0.0.1"}
[2025-09-19T16:02:08.456Z] WARN: Invalid JWT token provided {"tokenStart":"eyJhbGciOi...","ip":"127.0.0.1"}
```

## 🔄 Migración desde API Key

### Compatibilidad Retroactiva

El sistema mantiene compatibilidad con API Keys existentes:

```javascript
// Funciona con API Key (legacy)
fetch('/api/reports/simulation', {
  headers: {
    'X-API-Key': 'legacy-api-key',
    'Content-Type': 'application/json'
  }
});

// Funciona con JWT (nuevo)
fetch('/api/reports/simulation', {
  headers: {
    'Authorization': 'Bearer jwt-token',
    'Content-Type': 'application/json'
  }
});
```

### Plan de Migración

1. **Fase 1**: Implementar autenticación JWT (✅ Completado)
2. **Fase 2**: Migrar clientes a JWT gradualmente
3. **Fase 3**: Deprecar API Keys (futuro)

## 🚨 Manejo de Errores

### Códigos de Error Comunes

| Código | Error | Descripción |
|--------|--------|-------------|
| 400 | Missing fields | userId o token faltantes |
| 401 | Invalid credentials | Credenciales Podium inválidas |
| 401 | Invalid JWT | Token JWT inválido o expirado |
| 403 | Insufficient permissions | Usuario sin acceso a reportes |
| 500 | Internal error | Error interno del servicio |

### Ejemplo de Manejo

```javascript
async function handleAuthError(error, client) {
  if (error.message.includes('expired')) {
    console.log('🔄 Token expirado, renovando...');
    await client.refreshToken();
    return 'retry';
  } else if (error.message.includes('Invalid credentials')) {
    console.log('🔐 Credenciales inválidas, re-autenticar');
    client.accessToken = null;
    return 'reauth';
  } else {
    console.error('❌ Error no recuperable:', error.message);
    return 'fail';
  }
}
```

## 📊 Testing

### Ejemplo de Test

```javascript
describe('Authentication', () => {
  test('should authenticate valid user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userId: 'test_user',
        token: 'valid_podium_token'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        userId: 'invalid_user',
        token: 'invalid_token'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

---

## 🎯 Resumen

El sistema de autenticación proporciona:

1. **🔐 Autenticación segura** contra API Podium
2. **🔑 JWT tokens** para acceso al servicio
3. **🔄 Renovación automática** de tokens
4. **🛡️ Middleware flexible** (JWT + API Key)
5. **📊 Logging completo** para auditoría
6. **🔗 Compatibilidad retroactiva** con API Keys

El flujo es simple: **Podium credentials** → **JWT token** → **Acceso a reportes**