# 📊 Endpoints de Excel - Guía de Uso

## 🎯 Dos Endpoints Diferentes

### 1️⃣ Excel de PUNTAJES (por Área)
**Endpoint:** `POST /api/reports/excel-puntaje`

**Estructura del Excel:**
```
GRUPO | IDENTIFICACIÓN | NOMBRES Y APELLIDOS | TOTAL | Categoria | Lectura Crítica | Matemáticas | Ciencias Sociales | Ciencias Naturales | Inglés
------|----------------|---------------------|-------|-----------|-----------------|-------------|-------------------|-------------------|--------
Curso | 1038263411     | Mesa                | 677   | 2         | 34              | 22          | 24                | 21                | 31
      |                | PROMEDIO            | 677   |           | 34              | 22          | 24                | 21                | 31
      |                | DESVIACIÓN ESTÁNDAR | 0     |           | 0               | 0           | 0                 | 0                 | 0
```

**Características:**
- ✅ Muestra puntajes por **ÁREA/MATERIA**
- ✅ Incluye fila de **PROMEDIO**
- ✅ Incluye fila de **DESVIACIÓN ESTÁNDAR**
- ✅ Categoría numérica (1, 2, 3, 4)
- ✅ Áreas son **dinámicas** (se detectan automáticamente)

**Hoja:** "Resultados"

---

### 2️⃣ Excel de RESPUESTAS (letras A, B, C, D)
**Endpoint:** `POST /api/reports/excel-respuestas`

**Estructura del Excel:**
```
IDENTIFICACION | ESTUDIANTE | 1 | 2 | 3 | 4 | ... | 120
---------------|------------|---|---|---|---|-----|----
1038263411     | Mesa       | A | B | D | C | ... | B
```

**Características:**
- ✅ Muestra **letra de respuesta** por pregunta
- ✅ Celdas **VERDES** = Correcta
- ✅ Celdas **ROJAS** = Incorrecta
- ✅ Columnas dinámicas según número de preguntas
- ✅ Primeras 2 columnas congeladas

**Hoja:** "Respuestas por estudiante"

---

## 🧪 Cómo Probar

### Opción 1: Scripts de prueba
```bash
# Probar Excel de Puntajes
./test-excel-puntaje.sh

# Probar Excel de Respuestas
./test-excel-respuestas.sh
```

### Opción 2: cURL directo
```bash
# Excel de Puntajes
curl -X POST http://localhost:3001/api/reports/excel-puntaje \
  -H "Content-Type: application/json" \
  -d @saber.json

# Excel de Respuestas
curl -X POST http://localhost:3001/api/reports/excel-respuestas \
  -H "Content-Type: application/json" \
  -d @saber.json
```

---

## ⚠️ Nota Importante sobre saber.json

El archivo `saber.json` actual **solo tiene 1 estudiante**, por eso:
- El Excel tendrá solo 1 fila de datos
- La desviación estándar será 0
- No se apreciarán bien las estadísticas

Para ver un Excel más completo, necesitas un JSON con **múltiples estudiantes**.

---

## 📂 Ubicación de archivos generados

Los Excel se guardan en: `public/excels/`

**Nombres de archivo:**
- Puntajes: `reporte_puntajes_CAMPUS_TIMESTAMP.xlsx`
- Respuestas: `respuestas_CAMPUS_TIMESTAMP.xlsx`
