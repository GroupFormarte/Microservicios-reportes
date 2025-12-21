# 📁 Servicio de Almacenamiento de Datos - simulationData

## 🎯 Propósito

El servicio guarda automáticamente todos los datos de `simulationData` en archivos JSON cada vez que se genera un reporte. Esto permite:

- ✅ **Auditoría**: Registro completo de todos los reportes generados
- ✅ **Debugging**: Acceso a los datos exactos para reproducir reportes
- ✅ **Análisis**: Datos históricos para análisis posterior
- ✅ **Recuperación**: Re-generar reportes con datos guardados

---

## 📂 Estructura de Almacenamiento

### **Directorio:**
```
public/data-reports/
```

### **Formato de Archivo:**
```
simulation_data_{TIPO}_{INSTITUCION}_{TIMESTAMP}_{SESSION_ID}.json
```

**Ejemplo:**
```
simulation_data_SABER_FORMARTE_MEDELLIN_1703181234567_session_abc123.json
```

---

## 📄 Estructura del Archivo JSON

Cada archivo contiene:

```json
{
  "metadata": {
    "savedAt": "2025-12-21T15:30:45.123Z",
    "sessionId": "session_abc123",
    "campus": "FORMARTE MEDELLIN",
    "tipoInforme": "saber",
    "programName": "Programa Pre-Universitario",
    "studentsCount": 150,
    "questionsCount": 60
  },
  "data": {
    // Aquí va todo el simulationData completo
    "campus": "FORMARTE MEDELLIN",
    "course": "11-A",
    "tipe_inform": "saber",
    "programName": "Programa Pre-Universitario",
    "to": "email@ejemplo.com",
    "students": [...],
    "detailQuestion": [...],
    // ... resto de datos
  }
}
```

---

## 🔧 Funcionamiento Automático

### **Cuando se Genera un Reporte:**

1. Cliente envía `POST /api/reports/simulation` con `simulationData`
2. Servidor retorna **202 Accepted** inmediatamente
3. **En background:**
   - ✅ Guarda `simulationData` en JSON (líneas 522-526)
   - ✅ Genera el PDF
   - ✅ Envía email (si se proporcionó `to`)
   - ✅ Notifica vía WebSocket

### **Logs Generados:**
```
[INFO] Starting background report generation { sessionId, tipe_inform }
[INFO] Simulation data saved to JSON { fileName, sessionId }
```

---

## 🌐 API Endpoints

### **1. Listar Archivos Guardados**

```bash
GET /api/reports/data/list
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "files": [
      "simulation_data_SABER_FORMARTE_MEDELLIN_1703181234567_session_abc123.json",
      "simulation_data_UDEA_COLEGIO_XYZ_1703181234890_session_def456.json"
    ],
    "count": 2
  }
}
```

---

### **2. Leer un Archivo Específico**

```bash
GET /api/reports/data/:fileName
```

**Ejemplo:**
```bash
curl http://localhost:3350/api/reports/data/simulation_data_SABER_FORMARTE_MEDELLIN_1703181234567_session_abc123.json
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "metadata": { ... },
    "data": { ... }
  }
}
```

---

### **3. Limpiar Archivos Antiguos**

```bash
DELETE /api/reports/data/cleanup?days=30
```

**Parámetros:**
- `days` (opcional): Días de antigüedad (por defecto 30)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 15,
    "daysOld": 30,
    "message": "Se eliminaron 15 archivos con más de 30 días"
  }
}
```

---

## 💡 Casos de Uso

### **1. Debugging de un Reporte Problemático**

```bash
# 1. Listar archivos
curl http://localhost:3350/api/reports/data/list

# 2. Descargar el archivo específico
curl http://localhost:3350/api/reports/data/simulation_data_SABER_XXX_123.json > debug.json

# 3. Analizar los datos localmente
cat debug.json | jq '.data.students | length'
cat debug.json | jq '.data.detailQuestion[0]'
```

---

### **2. Re-generar un Reporte**

Si un reporte falló o necesitas regenerarlo con los mismos datos:

```bash
# 1. Obtener los datos originales
SIMULATION_DATA=$(curl http://localhost:3350/api/reports/data/simulation_data_XXX.json | jq '.data.data')

# 2. Re-enviar para generar nuevo reporte
curl -X POST http://localhost:3350/api/reports/simulation \
  -H "Content-Type: application/json" \
  -d "$SIMULATION_DATA"
```

---

### **3. Análisis de Datos Históricos**

```bash
# Listar todos los reportes de una institución
curl http://localhost:3350/api/reports/data/list | \
  jq '.data.files[] | select(contains("FORMARTE"))'

# Contar reportes por tipo
curl http://localhost:3350/api/reports/data/list | \
  jq '.data.files[] | split("_")[2]' | sort | uniq -c
```

---

### **4. Mantenimiento Automático**

Para limpiar archivos antiguos mensualmente, puedes crear un cron job:

```bash
# Limpiar archivos mayores a 60 días cada mes
0 0 1 * * curl -X DELETE http://localhost:3350/api/reports/data/cleanup?days=60
```

---

## 🛠️ Servicio: `dataStorageService`

### **Métodos Disponibles:**

```typescript
import { dataStorageService } from './services/dataStorageService';

// Guardar datos
const fileName = await dataStorageService.saveSimulationData(
  simulationData,
  sessionId
);

// Leer datos
const data = await dataStorageService.readSimulationData(fileName);

// Listar archivos
const files = await dataStorageService.listSimulationDataFiles();

// Limpiar archivos antiguos
const deletedCount = await dataStorageService.cleanOldFiles(30);
```

---

## ⚙️ Configuración

### **Variables de Entorno:**

No requiere configuración adicional. El directorio se crea automáticamente en:
```
public/data-reports/
```

### **Permisos:**

Asegúrate de que el proceso tiene permisos de escritura:
```bash
chmod 755 public/data-reports/
```

---

## 📊 Gestión de Espacio

### **Tamaño Aproximado:**

- 1 archivo JSON: ~50 KB - 5 MB (depende de cantidad de estudiantes/preguntas)
- 1000 reportes: ~50 MB - 5 GB

### **Recomendaciones:**

1. **Limpieza automática:** Ejecutar cleanup cada mes
2. **Backup:** Respaldar archivos antiguos antes de eliminar
3. **Monitoreo:** Revisar espacio en disco periódicamente

```bash
# Ver espacio usado
du -sh public/data-reports/

# Contar archivos
ls public/data-reports/ | wc -l

# Ver archivos más grandes
ls -lhS public/data-reports/ | head -10
```

---

## 🔒 Seguridad

### **Acceso a los Archivos:**

Los archivos JSON están en `public/data-reports/` pero:
- ❌ NO son accesibles directamente vía HTTP
- ✅ Solo accesibles vía API endpoints
- ✅ Los endpoints pueden protegerse con autenticación

### **Datos Sensibles:**

Si `simulationData` contiene información sensible:
1. Los archivos se guardan en el servidor (no se exponen públicamente)
2. Considera agregar autenticación a los endpoints `/data/*`
3. Revisa periódicamente y elimina datos antiguos

---

## 🧪 Pruebas

### **Probar Guardado Automático:**

```bash
# 1. Enviar reporte
curl -X POST http://localhost:3350/api/reports/simulation \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-123" \
  -d '{
    "campus": "Test Campus",
    "tipe_inform": "saber",
    "students": [],
    "detailQuestion": []
  }'

# 2. Verificar que se guardó
curl http://localhost:3350/api/reports/data/list

# 3. Leer el archivo
curl http://localhost:3350/api/reports/data/simulation_data_SABER_Test_Campus_...json
```

---

## ✨ Resumen

**Características:**
- ✅ Guardado automático de todos los reportes
- ✅ API completa para gestión de datos
- ✅ Metadata enriquecida
- ✅ Limpieza automática de archivos antiguos
- ✅ Sin impacto en performance (guardado en background)

**Beneficios:**
- 📊 Auditoría completa
- 🐛 Debugging simplificado
- 📈 Análisis de datos históricos
- 🔄 Recuperación de reportes

---

## 📞 Soporte

Si necesitas ayuda:

1. **Revisar logs del servidor:**
   ```bash
   tail -f logs/app.log | grep "Simulation data"
   ```

2. **Verificar directorio:**
   ```bash
   ls -la public/data-reports/
   ```

3. **Comprobar espacio:**
   ```bash
   df -h
   ```
