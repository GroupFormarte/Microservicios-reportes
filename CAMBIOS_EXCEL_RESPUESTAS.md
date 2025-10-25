# 🔧 Actualización del Procesador de Excel de Respuestas

## ✅ Cambios Implementados

El procesador de Excel de respuestas ahora sigue **exactamente la misma lógica** que `procesarTablaDificultadAnalisis` para garantizar consistencia.

---

## 🎯 Principales Mejoras

### 1. **Búsqueda por `simulationId`**

**Antes:**
```typescript
const examen = student.examenes_asignados[0]; // Tomaba el primer examen
```

**Ahora:**
```typescript
const examen = student.examenes_asignados.find((exam: any) =>
  exam.id_simulacro === simulationId
); // Busca el examen correcto por ID
```

**Beneficio:** Asegura que se procesen las respuestas del simulacro correcto.

---

### 2. **Limitación a 2 Sesiones**

**Implementación:**
```typescript
// Limitar a máximo 2 sesiones (igual que procesarTablaDificultadAnalisis)
const sessionesToProcess = examen.respuesta_sesion.slice(0, 2);

// Filtrar solo sesiones válidas (con respuestas)
const sessionesToProcessAux: any[] = [];
for (const session of sessionesToProcess) {
  if (session.respuestas !== null && session.respuestas !== undefined) {
    sessionesToProcessAux.push(session);
  }
}
```

**Beneficio:** Evita procesar sesiones inválidas o duplicadas.

---

### 3. **Detección de Total de Preguntas Mejorada**

**Prioridad:**
1. **Opción 1:** `detailQuestion.length` (más confiable)
2. **Opción 2:** Máximo `index_question` de las respuestas

**Código:**
```typescript
function obtenerTotalPreguntas(simulationData: any): number {
  // OPCIÓN 1: Usar detailQuestion si existe
  if (simulationData.detailQuestion && simulationData.detailQuestion.length > 0) {
    return simulationData.detailQuestion.length;
  }

  // OPCIÓN 2: Buscar el índice máximo
  // ... código de búsqueda ...
}
```

**Beneficio:** Detecta correctamente todas las preguntas del simulacro.

---

### 4. **Filtro de Estudiantes sin Respuestas**

**Implementación:**
```typescript
// Solo agregar estudiantes que tengan al menos una respuesta
if (respuestasMap.size > 0) {
  estudiantes.push({
    documento: student.document || 'Sin documento',
    nombre: student.name || 'Sin nombre',
    respuestas: respuestasMap
  });
}
```

**Beneficio:** Elimina estudiantes que no respondieron ninguna pregunta.

---

### 5. **Manejo de Respuestas No Contestadas (NR)**

**Implementación:**
```typescript
letra: respuesta.letra || 'NR', // NR si no tiene letra
```

**Beneficio:** Muestra "NR" (No Respondió) en lugar de celda vacía.

---

## 📊 Ejemplo de Procesamiento

### Estructura de Entrada (saber.json):
```json
{
  "simulationId": "68d2b028745905f85547e214",
  "detailQuestion": [...], // 120 preguntas
  "students": [
    {
      "id": "68d45631745905f85549245d",
      "name": "Mesa",
      "examenes_asignados": [{
        "id_simulacro": "68d2b028745905f85547e214",
        "respuesta_sesion": [
          {
            "session": 1,
            "respuestas": [
              {
                "index_question": "1",
                "letra": "A",
                "es_correcta": true
              },
              {
                "index_question": "2",
                "letra": "B",
                "es_correcta": false
              }
            ]
          },
          {
            "session": 2,
            "respuestas": [
              {
                "index_question": "1",
                "letra": "A",
                "es_correcta": true
              }
            ]
          }
        ]
      }]
    }
  ]
}
```

### Resultado Procesado:
```
Total de preguntas: 120 (desde detailQuestion)
Estudiantes: 1
Respuestas extraídas:
  - Pregunta 1: A (correcta) ✅
  - Pregunta 2: B (incorrecta) ❌
  - Pregunta 3-120: (vacías)
```

---

## 🔄 Flujo de Procesamiento

1. **Obtener `simulationId`** del JSON principal
2. **Contar total de preguntas** desde `detailQuestion`
3. **Por cada estudiante:**
   - Buscar examen con `id_simulacro` coincidente
   - Tomar máximo 2 sesiones válidas
   - Extraer respuestas por `index_question`
   - Marcar letra y si es correcta
4. **Filtrar estudiantes** sin respuestas
5. **Generar Excel** con columnas dinámicas

---

## ✅ Consistencia con PDF

Ahora el procesador de Excel de respuestas usa **exactamente la misma lógica** que:
- `procesarTablaDificultadAnalisis` (PDF)
- Limitación a 2 sesiones
- Búsqueda por `simulationId`
- Filtrado de sesiones válidas

---

## 🧪 Para Probar

```bash
curl -X POST http://localhost:3001/api/reports/excel-respuestas \
  -H "Content-Type: application/json" \
  -d @saber.json
```

**Archivo generado:** `public/excels/respuestas_[CAMPUS]_[TIMESTAMP].xlsx`

**Columnas esperadas:**
- IDENTIFICACION
- ESTUDIANTE
- 1, 2, 3, ..., 120 (según detailQuestion.length)

**Celdas:**
- 🟢 Verde = Correcta
- 🔴 Roja = Incorrecta
- ⚪ NR = No respondió
