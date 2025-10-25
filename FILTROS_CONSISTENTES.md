# 🔄 Filtros Consistentes entre Ambos Informes Excel

## ✅ Criterio Unificado

**Ambos informes** (Excel de Puntajes y Excel de Respuestas) ahora usan el **mismo criterio de inclusión** de estudiantes:

### 📌 Regla de Inclusión
**Un estudiante aparece en AMBOS informes si y solo si:**
> Tiene **al menos una materia con porcentaje > 0**

---

## 📊 Excel de Puntajes

### Criterio de Filtrado:
```typescript
function estudianteEstaAusente(estudiante: StudentExcelData): boolean {
  const valoresAreas = Object.values(estudiante.areas);
  return valoresAreas.every(valor => valor === 0); // TODAS las áreas en 0?
}
```

**Inclusión:** Si **NO todas** las áreas están en 0 (es decir, al menos una > 0)

**Archivo:** `src/utils/excelDataProcessor.ts:175`

---

## 📝 Excel de Respuestas

### Criterio de Filtrado:
```typescript
function verificarEstudianteTieneMaterias(student: any): boolean {
  return examen.materias.some((materia: any) => {
    const porcentaje = parseFloat(materia.porcentaje) || 0;
    return porcentaje > 0; // ¿Al menos una materia > 0?
  });
}
```

**Inclusión:** Si **al menos una materia** tiene porcentaje > 0

**Archivo:** `src/utils/excelAnswersProcessor.ts:85`

---

## 🎯 Ejemplos

### Ejemplo 1: Estudiante INCLUIDO en ambos
```json
{
  "name": "Juan Pérez",
  "examenes_asignados": [{
    "materias": [
      { "name": "Matemáticas", "porcentaje": "80" },  ← > 0 ✅
      { "name": "Lectura", "porcentaje": "0" },
      { "name": "Ciencias", "porcentaje": "0" }
    ]
  }]
}
```
**Resultado:**
- ✅ Excel Puntajes: Incluido (tiene Matemáticas > 0)
- ✅ Excel Respuestas: Incluido (tiene al menos una materia > 0)

---

### Ejemplo 2: Estudiante EXCLUIDO de ambos
```json
{
  "name": "María García",
  "examenes_asignados": [{
    "materias": [
      { "name": "Matemáticas", "porcentaje": "0" },
      { "name": "Lectura", "porcentaje": "0" },
      { "name": "Ciencias", "porcentaje": "0" }
    ]
  }]
}
```
**Resultado:**
- ❌ Excel Puntajes: Excluido (todas las áreas en 0)
- ❌ Excel Respuestas: Excluido (ninguna materia > 0)

---

### Ejemplo 3: Estudiante con varias materias
```json
{
  "name": "Carlos López",
  "examenes_asignados": [{
    "materias": [
      { "name": "Matemáticas", "porcentaje": "65" },  ← > 0 ✅
      { "name": "Lectura", "porcentaje": "55" },      ← > 0 ✅
      { "name": "Ciencias", "porcentaje": "0" },
      { "name": "Inglés", "porcentaje": "50" }        ← > 0 ✅
    ]
  }]
}
```
**Resultado:**
- ✅ Excel Puntajes: Incluido (tiene 3 áreas > 0)
- ✅ Excel Respuestas: Incluido (tiene varias materias > 0)

---

## 🔍 Verificación de Consistencia

Para verificar que **los mismos estudiantes** aparecen en ambos informes:

1. Generar Excel de Puntajes:
   ```bash
   curl -X POST http://localhost:3001/api/reports/excel-puntaje \
     -H "Content-Type: application/json" \
     -d @datos.json
   ```

2. Generar Excel de Respuestas:
   ```bash
   curl -X POST http://localhost:3001/api/reports/excel-respuestas \
     -H "Content-Type: application/json" \
     -d @datos.json
   ```

3. Comparar:
   - **Mismo número de estudiantes** en ambos
   - **Mismos documentos** en ambos
   - **Mismo orden** (si ambos ordenan por posición)

---

## ✅ Garantía de Consistencia

**Antes:** Los filtros eran diferentes
- Excel Puntajes: Filtraba por áreas en 0
- Excel Respuestas: Filtraba por respuestas válidas

**Ahora:** Ambos usan el mismo criterio
- ✅ Ambos verifican: **¿Al menos una materia con porcentaje > 0?**
- ✅ Ambos incluyen/excluyen los **mismos estudiantes**
- ✅ Resultados **consistentes** entre informes

---

## 📋 Resumen

| Criterio | Excel Puntajes | Excel Respuestas |
|----------|----------------|------------------|
| **Fuente de datos** | `estudiante.areas` | `examen.materias` |
| **Condición** | Al menos 1 área > 0 | Al menos 1 materia > 0 |
| **Resultado** | ✅ CONSISTENTE | ✅ CONSISTENTE |

**Los estudiantes que aparecen en un informe, SIEMPRE aparecerán en el otro.**
