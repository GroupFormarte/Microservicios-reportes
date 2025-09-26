# EJS Templates - JSON Schema Documentation

Esta documentación describe las estructuras JSON que esperan cada uno de los templates EJS del sistema de reportes.

## Índice de Templates

1. [portada.ejs](#1-portadaejs) - Página de portada
2. [competencias_chart.ejs](#2-competencias_chartejs) - Gráfico de competencias
3. [score_distribution.ejs](#3-score_distributionej) - Distribución de puntajes (vertical)
4. [score_distribution_horizontal.ejs](#4-score_distribution_horizontalejs) - Distribución de puntajes (horizontal)
5. [comparativo-puntaje.ejs](#5-comparativo-puntajeejs) - Gráfico comparativo
6. [tabla-dificultad-analisis.ejs](#6-tabla-dificultad-analisisejs) - Tabla de análisis de dificultad
7. [bar_chart_simple.ejs](#7-bar_chart_simpleejs) - Gráfico de barras simple
8. [bar_chart_with_title.ejs](#8-bar_chart_with_titleejs) - Gráficos de barras con título
9. [tabla_con_puntaje.ejs](#9-tabla_con_puntajeejs) - Tabla de estudiantes con puntajes

---

## 1. portada.ejs

**Propósito**: Renderiza la página de portada de los reportes con información institucional y branding.

### Estructura JSON Requerida

```json
{
  "portadaImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
  "campus": "FORMARTE MEDELLÍN",
  "code": "001-2025",
  "year": "2025",
  "programName": "Programa de Preparación Universitaria"
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `portadaImage` | string | ✅ | Imagen de portada en base64 o URL |
| `campus` | string | ✅ | Nombre del campus o institución |
| `code` | string | ✅ | Código identificador del programa/institución |
| `year` | string | ✅ | Año académico |
| `programName` | string | ✅ | Nombre del programa académico |

### Ejemplo de Uso

```javascript
const portadaData = {
  portadaImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...",
  campus: "FORMARTE MEDELLÍN",
  code: "FM-2025-001",
  year: "2025",
  programName: "Preparación ICFES - Saber 11"
};
```

---

## 2. competencias_chart.ejs

**Propósito**: Muestra un gráfico de barras con puntajes de competencias, comparando promedios históricos con el grupo actual.

### Estructura JSON Requerida

```json
{
  "chartId": "competencias_chart_001",
  "labels": ["Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Inglés"],
  "historicoPromedios": [65, 70, 58, 72, 55],
  "promedioGrupal": [68, 75, 60, 74, 58],
  "maxYValue": 100
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `chartId` | string | ❌ | Identificador único del gráfico (default: 'default') |
| `labels` | string[] | ✅ | Nombres de las competencias/materias |
| `historicoPromedios` | number[] | ✅ | Promedios históricos por competencia |
| `promedioGrupal` | number[] | ✅ | Promedios del grupo actual |
| `maxYValue` | number | ✅ | Valor máximo para el eje Y |

### Notas Especiales

- Los arrays `labels`, `historicoPromedios` y `promedioGrupal` deben tener la misma longitud
- Los valores numéricos típicamente están en el rango 0-100
- El gráfico muestra dos barras por competencia (histórico vs actual)

---

## 3. score_distribution.ejs

**Propósito**: Crea gráficos de dona (donut charts) mostrando la distribución de puntajes por niveles de desempeño para múltiples materias.

### Estructura JSON Requerida

```json
{
  "subjects": [
    {
      "name": "Matemáticas",
      "chartId": "math_distribution",
      "ranges": [
        {
          "label": "Insuficiente",
          "percentage": 15,
          "count": 23
        },
        {
          "label": "Mínimo",
          "percentage": 35,
          "count": 54
        },
        {
          "label": "Satisfactorio",
          "percentage": 40,
          "count": 62
        },
        {
          "label": "Avanzado",
          "percentage": 10,
          "count": 15
        }
      ]
    },
    {
      "name": "Lenguaje",
      "chartId": "language_distribution",
      "ranges": [
        {
          "label": "Insuficiente",
          "percentage": 12,
          "count": 18
        },
        {
          "label": "Mínimo",
          "percentage": 38,
          "count": 58
        },
        {
          "label": "Satisfactorio",
          "percentage": 42,
          "count": 65
        },
        {
          "label": "Avanzado",
          "percentage": 8,
          "count": 12
        }
      ]
    }
  ]
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `subjects` | object[] | ✅ | Array de materias con sus distribuciones |
| `subjects[].name` | string | ✅ | Nombre de la materia |
| `subjects[].chartId` | string | ✅ | ID único para el gráfico |
| `subjects[].ranges` | object[] | ✅ | Rangos de desempeño |
| `subjects[].ranges[].label` | string | ✅ | Etiqueta del nivel (ej: "Insuficiente") |
| `subjects[].ranges[].percentage` | number | ✅ | Porcentaje de estudiantes |
| `subjects[].ranges[].count` | number | ✅ | Número de estudiantes |

### Configuración de Colores

El template usa colores predeterminados:
- `#c55c5c` (rojo) - Insuficiente
- `#d88008` (naranja) - Mínimo  
- `#f4d03f` (amarillo) - Satisfactorio
- `#58a55c` (verde) - Avanzado

---

## 4. score_distribution_horizontal.ejs

**Propósito**: Versión horizontal de la distribución de puntajes con opción de guía de leyenda.

### Estructura JSON Requerida

```json
{
  "subjects": [
    {
      "name": "Competencia Lectora",
      "chartId": "reading_horizontal",
      "ranges": [
        {
          "label": "1",
          "percentage": 20,
          "count": 30
        },
        {
          "label": "2", 
          "percentage": 45,
          "count": 68
        },
        {
          "label": "3",
          "percentage": 30,
          "count": 45
        },
        {
          "label": "4",
          "percentage": 5,
          "count": 7
        }
      ]
    }
  ],
  "needGuide": true,
  "legend": [
    {
      "color": "nivel-1",
      "label": "Nivel 1 (0-350 puntos)"
    },
    {
      "color": "nivel-2", 
      "label": "Nivel 2 (351-500 puntos)"
    },
    {
      "color": "nivel-3",
      "label": "Nivel 3 (501-700 puntos)"
    },
    {
      "color": "nivel-4",
      "label": "Nivel 4 (701-1000 puntos)"
    }
  ]
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `subjects` | object[] | ✅ | Misma estructura que score_distribution.ejs |
| `needGuide` | boolean | ❌ | Mostrar guía de leyenda (default: false) |
| `legend` | object[] | ❌ | Configuración personalizada de leyenda |
| `legend[].color` | string | ✅ | Clase CSS para el color |
| `legend[].label` | string | ✅ | Texto de la leyenda |

---

## 5. comparativo-puntaje.ejs

**Propósito**: Gráfico comparativo mostrando rendimiento en diferentes niveles administrativos (nacional, departamental, municipal, institucional).

### Estructura JSON Requerida

```json
{
  "chartId": "comparativo_nacional",
  "subjects": ["Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Inglés"],
  "tableData": [
    {
      "type": "nacional",
      "label": "Colombia",
      "year": "2024",
      "values": [285, 265, 270, 275, 260]
    },
    {
      "type": "departamento", 
      "label": "Antioquia",
      "year": "2024",
      "values": [290, 270, 275, 280, 265]
    },
    {
      "type": "municipio",
      "label": "Medellín",
      "year": "2024", 
      "values": [295, 275, 280, 285, 270]
    },
    {
      "type": "institucion",
      "label": "Institución Educativa",
      "year": "2024",
      "values": [300, 280, 285, 290, 275]
    },
    {
      "type": "prueba",
      "label": "Grupo Evaluado",
      "values": [305, 285, 290, 295, 280]
    }
  ],
  "chartData": {
    "labels": ["Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Inglés"],
    "datasets": [
      {
        "label": "Colombia",
        "data": [285, 265, 270, 275, 260],
        "borderColor": "#c55c5c"
      },
      {
        "label": "Antioquia", 
        "data": [290, 270, 275, 280, 265],
        "borderColor": "#d88008"
      },
      {
        "label": "Medellín",
        "data": [295, 275, 280, 285, 270],
        "borderColor": "#f4d03f"
      },
      {
        "label": "Institución",
        "data": [300, 280, 285, 290, 275], 
        "borderColor": "#58a55c"
      },
      {
        "label": "Grupo",
        "data": [305, 285, 290, 295, 280],
        "borderColor": "#4c8631"
      }
    ]
  },
  "chartConfig": {
    "yAxisMax": 350,
    "stepSize": 50
  }
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `chartId` | string | ❌ | ID del gráfico (default: 'comparativoChart') |
| `subjects` | string[] | ❌ | Encabezados de columnas de materias |
| `tableData` | object[] | ❌ | Datos de filas de la tabla |
| `tableData[].type` | string | ✅ | Tipo de fila para estilos CSS |
| `tableData[].label` | string | ✅ | Etiqueta mostrada |
| `tableData[].year` | string | ❌ | Año asociado |
| `tableData[].values` | number[] | ✅ | Puntajes por materia |
| `chartData` | object | ✅ | Estructura de datos de Chart.js |
| `chartConfig` | object | ❌ | Configuración del gráfico |

### Tipos de Fila Válidos

- `"nacional"` - Nivel nacional
- `"departamento"` - Nivel departamental  
- `"municipio"` - Nivel municipal
- `"institucion"` - Nivel institucional
- `"prueba"` - Grupo evaluado

---

## 6. tabla-dificultad-analisis.ejs

**Propósito**: Tabla de análisis mostrando dificultad de preguntas y distribución de respuestas.

### Estructura JSON Requerida

```json
{
  "tableData": {
    "subject": "Matemáticas - Sesión 1",
    "options": ["A", "B", "C", "D", "NR"],
    "questions": [
      {
        "number": 1,
        "competence": "Razonamiento",
        "component": "Algebraico",
        "percentages": [25, 15, 45, 10, 5],
        "correctAnswer": 2,
        "id": "q1_diff_medium",
        "difficultyColor": "#d88008"
      },
      {
        "number": 2,
        "competence": "Comunicación",
        "component": "Geométrico", 
        "percentages": [60, 20, 10, 5, 5],
        "correctAnswer": 0,
        "id": "q2_diff_low",
        "difficultyColor": "#58a55c"
      }
    ],
    "nivels": [
      {
        "label": "BAJO",
        "color": "#58a55c"
      },
      {
        "label": "MEDIO",
        "color": "#d88008" 
      },
      {
        "label": "ALTO",
        "color": "#c55c5c"
      }
    ],
    "indiceDificultadArea": {
      "color": "#d88008",
      "nivel": "MEDIO", 
      "valor": "45.5"
    }
  }
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `tableData.subject` | string | ❌ | Nombre de la materia (default: 'Matemáticas - Sesión 1') |
| `tableData.options` | string[] | ❌ | Etiquetas de opciones de respuesta |
| `tableData.questions` | object[] | ✅ | Datos de preguntas |
| `tableData.questions[].number` | number | ❌ | Número de pregunta |
| `tableData.questions[].competence` | string | ❌ | Competencia evaluada |
| `tableData.questions[].component` | string | ❌ | Componente evaluado |
| `tableData.questions[].percentages` | number[] | ❌ | Porcentajes por opción |
| `tableData.questions[].correctAnswer` | number | ✅ | Índice de respuesta correcta |
| `tableData.questions[].id` | string | ✅ | ID de dificultad |
| `tableData.questions[].difficultyColor` | string | ✅ | Color de nivel de dificultad |
| `tableData.nivels` | object[] | ✅ | Definiciones de niveles de dificultad |
| `tableData.indiceDificultadArea` | object | ❌ | Índice general del área |

### Niveles de Dificultad

- **BAJO** (0-30.9): Color verde `#58a55c`
- **MEDIO** (31.0-60.9): Color naranja `#d88008`
- **ALTO** (61.1-100): Color rojo `#c55c5c`

---

## 7. bar_chart_simple.ejs

**Propósito**: Gráfico de barras simple con tabla de datos mostrando rangos y estadísticas.

### Estructura JSON Requerida

```json
{
  "chartId": "simple_chart_001",
  "title": "Distribución por Competencia Matemática",
  "ranges": [
    {
      "count": 25,
      "percentage": 16.2
    },
    {
      "count": 48,
      "percentage": 31.0
    },
    {
      "count": 62,
      "percentage": 40.0
    },
    {
      "count": 20,
      "percentage": 12.8
    }
  ],
  "labels": ["Nivel I", "Nivel II", "Nivel III", "Nivel IV"],
  "colors": ["#c55c5c", "#d88008", "#f4d03f", "#58a55c"],
  "chartData": {
    "values": [25, 48, 62, 20]
  },
  "maxValue": 80
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `chartId` | string | ✅ | Identificador único del gráfico |
| `title` | string | ✅ | Título mostrado en el gráfico |
| `ranges` | object[] | ✅ | Estadísticas de rangos |
| `ranges[].count` | number | ✅ | Cantidad de estudiantes |
| `ranges[].percentage` | number | ✅ | Porcentaje |
| `labels` | string[] | ✅ | Etiquetas del eje X |
| `colors` | string[] | ✅ | Colores de las barras |
| `chartData.values` | number[] | ✅ | Valores de datos |
| `maxValue` | number | ❌ | Máximo del eje Y (default: 80) |

---

## 8. bar_chart_with_title.ejs

**Propósito**: Múltiples gráficos de barras organizados en layout de grilla, cada uno con su propio título.

### Estructura JSON Requerida

```json
{
  "subjects": [
    {
      "title": "Competencia Matemática",
      "chartId": "math_bars",
      "ranges": [
        {
          "percentage": 15.5,
          "count": 24
        },
        {
          "percentage": 32.0,
          "count": 49
        },
        {
          "percentage": 38.5,
          "count": 59
        },
        {
          "percentage": 14.0,
          "count": 22
        }
      ],
      "chartData": {
        "values": [24, 49, 59, 22]
      }
    },
    {
      "title": "Competencia Comunicativa",
      "chartId": "lang_bars",
      "ranges": [
        {
          "percentage": 12.0,
          "count": 18
        },
        {
          "percentage": 35.0,
          "count": 54
        },
        {
          "percentage": 42.0,
          "count": 65
        },
        {
          "percentage": 11.0,
          "count": 17
        }
      ],
      "chartData": {
        "values": [18, 54, 65, 17]
      }
    }
  ]
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `subjects` | object[] | ✅ | Array de materias con gráficos |
| `subjects[].title` | string | ✅ | Título del gráfico |
| `subjects[].chartId` | string | ✅ | Identificador único |
| `subjects[].ranges` | object[] | ✅ | Datos de rangos |
| `subjects[].ranges[].percentage` | number | ✅ | Porcentaje |
| `subjects[].ranges[].count` | number | ✅ | Cantidad |
| `subjects[].chartData.values` | number[] | ✅ | Valores del gráfico |

### Layout

- Máximo 4 gráficos por fila
- Responsive design que se adapta al número de gráficos
- Cada gráfico incluye tabla de datos debajo

---

## 9. tabla_con_puntaje.ejs

**Propósito**: Tabla de estudiantes con rankings y desglose por competencias o áreas.

### Estructura JSON Requerida

```json
{
  "competencias": ["Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Inglés"],
  "estudiantes": [
    {
      "puestoGrado": 1,
      "puestoGrupo": 1,
      "grupo": "11-A",
      "nombre": "ANDRÉS FELIPE GARCÍA LÓPEZ",
      "puntaje": 368,
      "categoria": "Avanzado",
      "competencias": [85, 78, 82, 80, 75]
    },
    {
      "puestoGrado": 2,
      "puestoGrupo": 2, 
      "grupo": "11-B",
      "nombre": "MARÍA CAMILA RODRÍGUEZ PÉREZ",
      "puntaje": 355,
      "categoria": "Satisfactorio",
      "competencias": [82, 75, 79, 77, 72]
    }
  ],
  "promedioGeneral": 298.5,
  "desviacionEstandar": 45.2
}
```

### Estructura Alternativa (por Áreas)

```json
{
  "areas": ["Competencia Lectora", "Competencia Matemática", "Ciencias Naturales"],
  "estudiantes": [
    {
      "puestoGrado": 1,
      "puestoGrupo": 1,
      "grupo": "11-A", 
      "nombre": "ANDRÉS FELIPE GARCÍA LÓPEZ",
      "puntaje": 425,
      "categoria": "Nivel 3",
      "areas": [450, 380, 440]
    }
  ],
  "promedioGeneral": 368.2,
  "desviacionEstandar": 52.8
}
```

### Detalles de Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `competencias` | string[] | ❌ | Encabezados de competencias |
| `areas` | string[] | ❌ | Encabezados de áreas (alternativo) |
| `estudiantes` | object[] | ❌ | Datos de estudiantes |
| `estudiantes[].puestoGrado` | number | ✅ | Posición en el grado |
| `estudiantes[].puestoGrupo` | number | ✅ | Posición en el grupo |
| `estudiantes[].grupo` | string | ✅ | Nombre del grupo |
| `estudiantes[].nombre` | string | ✅ | Nombre completo del estudiante |
| `estudiantes[].puntaje` | number | ✅ | Puntaje total |
| `estudiantes[].categoria` | string | ✅ | Categoría de desempeño |
| `estudiantes[].competencias` | number[] | ❌ | Puntajes por competencia |
| `estudiantes[].areas` | number[] | ❌ | Puntajes por área |
| `promedioGeneral` | number | ❌ | Promedio de la clase |
| `desviacionEstandar` | number | ❌ | Desviación estándar |

### Categorías de Desempeño

**Para UDEA (por porcentaje):**
- **"I"** (0-35%)
- **"II"** (36-75%) 
- **"III"** (76-100%)

**Para UNAL (por puntaje):**
- **"Nivel 1"** (100-350 puntos)
- **"Nivel 2"** (351-500 puntos)
- **"Nivel 3"** (501-700 puntos)
- **"Nivel 4"** (701-1000 puntos)

**Para reportes generales:**
- **"Insuficiente"** (0-35%)
- **"Mínimo"** (36-50%)
- **"Satisfactorio"** (51-65%)
- **"Avanzado"** (66-100%)

---

## Notas Generales

### Convenciones de Colores

La mayoría de templates usan el siguiente esquema de colores:

```css
/* Nivel 1 / Insuficiente / Bajo */
#c55c5c (rojo)

/* Nivel 2 / Mínimo / Medio */
#d88008 (naranja)

/* Nivel 3 / Satisfactorio */
#f4d03f (amarillo)

/* Nivel 4 / Avanzado / Alto */
#58a55c (verde)

/* Nivel adicional */
#4c8631 (verde oscuro)
```

### IDs de Gráficos

- Deben ser únicos en todo el documento
- Se recomienda usar prefijos descriptivos (ej: `math_`, `lang_`, `comp_`)
- Evitar caracteres especiales y espacios

### Responsividad

- Todos los templates están optimizados para impresión PDF
- Los gráficos se adaptan automáticamente al contenedor
- Las tablas incluyen scroll horizontal cuando es necesario

### Dependencias

- **Chart.js**: Requerido para todos los gráficos
- **CSS personalizado**: Incluido en los layouts base
- **Fuentes**: Optimizadas para legibilidad en PDF

### Validación de Datos

Se recomienda validar que:
- Los arrays numéricos sumen 100% cuando representan porcentajes
- Los IDs de gráficos sean únicos
- Los colores estén en formato hexadecimal válido
- Los nombres de estudiantes no excedan 50 caracteres para mejor formato