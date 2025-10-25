# 🔍 Filtros Automáticos del Excel de Puntajes

## ✅ Implementación Completada

El endpoint `/api/reports/excel-puntaje` ahora aplica **dos filtros automáticos** para limpiar los datos:

---

## 1️⃣ Filtro de Estudiantes Ausentes

**Condición:** Estudiante con **todas las áreas en 0**

**Razón:** El estudiante no estuvo presente en el examen

**Ejemplo:**
```json
{
  "id": "student2",
  "name": "María García",
  "examenes_asignados": [{
    "materias": [
      { "name": "Matemáticas", "porcentaje": "0" },
      { "name": "Lectura", "porcentaje": "0" },
      { "name": "Ciencias", "porcentaje": "0" },
      { "name": "Inglés", "porcentaje": "0" }
    ]
  }]
}
```

**Resultado:** ❌ Este estudiante NO se incluye en el Excel

---

## 2️⃣ Filtro de Áreas No Evaluadas

**Condición:** Área donde **todos los estudiantes tienen 0**

**Razón:** Esa área/materia no fue evaluada en este simulacro

**Ejemplo:**
```
Ciencias:
  - Juan Pérez: 0%
  - María García: 0%
  - Carlos López: 0%
```

**Resultado:** ❌ La columna "Ciencias" NO se incluye en el Excel

---

## 📊 Ejemplo Visual

### ANTES (sin filtros):
```
GRUPO | IDENTIFICACIÓN | NOMBRES        | TOTAL | Matemáticas | Lectura | Ciencias | Inglés
Curso | 1001           | Juan Pérez     | 450   | 80          | 70      | 0        | 60
Curso | 1002           | María García   | 0     | 0           | 0       | 0        | 0
Curso | 1003           | Carlos López   | 380   | 65          | 55      | 0        | 50
```

### DESPUÉS (con filtros):
```
GRUPO | IDENTIFICACIÓN | NOMBRES        | TOTAL | Matemáticas | Lectura | Inglés
Curso | 1001           | Juan Pérez     | 450   | 80          | 70      | 60
Curso | 1003           | Carlos López   | 380   | 65          | 55      | 50
```

**Cambios aplicados:**
- ❌ Eliminado: María García (todas las áreas en 0 → ausente)
- ❌ Eliminada: Columna "Ciencias" (todos los estudiantes con 0)

---

## 🎯 Beneficios

1. **Excel más limpio**: Solo muestra datos relevantes
2. **Identificación de ausencias**: Automáticamente detecta estudiantes que no presentaron
3. **Optimización de columnas**: No muestra áreas que no fueron evaluadas
4. **Estadísticas precisas**: Los promedios y desviaciones solo consideran estudiantes presentes

---

## 🔧 Implementación Técnica

**Archivo:** `src/utils/excelDataProcessor.ts`

**Funciones:**
- `estudianteEstaAusente()` - Verifica si todas las áreas son 0
- `filtrarAreasValidas()` - Detecta áreas con al menos un valor > 0

**Orden de procesamiento:**
1. Extrae todas las áreas únicas
2. Procesa todos los estudiantes
3. **FILTRO 1:** Elimina estudiantes ausentes
4. **FILTRO 2:** Elimina áreas no evaluadas
5. Calcula estadísticas con datos limpios

---

## 📝 Nota Importante

Los filtros se aplican **automáticamente**. No necesitas configuración adicional.

Si necesitas incluir todos los estudiantes (incluso ausentes), se puede agregar un parámetro opcional en el request.
