# Ejemplos de Uso del Microservicio de Reportes

Esta documentación proporciona ejemplos prácticos de cómo usar el microservicio de reportes en diferentes escenarios.

## Índice de Ejemplos

1. [Configuración Inicial](#configuraci%C3%B3n-inicial)
2. [Ejemplo Básico - Reporte UDEA](#ejemplo-b%C3%A1sico---reporte-udea)
3. [Ejemplo Avanzado - Reporte UNAL](#ejemplo-avanzado---reporte-unal)
4. [Ejemplo Completo - Reporte General](#ejemplo-completo---reporte-general)
5. [Integración con WebSocket](#integraci%C3%B3n-con-websocket)
6. [Ejemplos de Frontend](#ejemplos-de-frontend)
7. [Casos de Uso Específicos](#casos-de-uso-espec%C3%ADficos)

---

## Configuración Inicial

### Variables de Entorno

Crear un archivo `.env`:

```env
# Configuración del servidor
PORT=3001
NODE_ENV=development
HOST=localhost

# Seguridad
API_KEY=formarte-secret-key-2025
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Iniciar el Servidor

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

### Verificar Estado

```bash
curl http://localhost:3001/health
```

---

## Ejemplo Básico - Reporte UDEA

### Datos de Entrada Mínimos

```javascript
const udeaData = {
  "tipe_inform": "udea",
  "campus": "FORMARTE MEDELLÍN",
  "course": "Preparación ICFES - Saber 11",
  "students": [
    {
      "id": "std_001",
      "name": "ANDRÉS FELIPE GARCÍA LÓPEZ",
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
                  "skills": [{ "porcentaje": 78.5 }]
                },
                {
                  "name": "Comunicación",
                  "skills": [{ "porcentaje": 82.0 }]
                },
                {
                  "name": "Resolución",
                  "skills": [{ "porcentaje": 75.2 }]
                }
              ],
              "questions": [
                {
                  "id_pregunta": "q001",
                  "id_respuesta": "opt_a",
                  "es_correcta": true
                },
                {
                  "id_pregunta": "q002",
                  "id_respuesta": "opt_c",
                  "es_correcta": true
                },
                {
                  "id_pregunta": "q003",
                  "id_respuesta": null,
                  "es_correcta": false
                }
              ]
            },
            {
              "area": "Lenguaje",
              "asignatura": "Competencia Lectora",
              "competencies": [
                {
                  "name": "Literal",
                  "skills": [{ "porcentaje": 88.0 }]
                },
                {
                  "name": "Inferencial",
                  "skills": [{ "porcentaje": 75.5 }]
                },
                {
                  "name": "Crítico",
                  "skills": [{ "porcentaje": 70.0 }]
                }
              ],
              "questions": [
                {
                  "id_pregunta": "q004",
                  "id_respuesta": "opt_b",
                  "es_correcta": true
                },
                {
                  "id_pregunta": "q005",
                  "id_respuesta": "opt_a",
                  "es_correcta": false
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "std_002",
      "name": "MARÍA CAMILA RODRÍGUEZ PÉREZ",
      "course_id": "11-B",
      "examenes_asignados": [
        {
          "score": 72.3,
          "position": 15,
          "materias": [
            {
              "area": "Matemáticas",
              "asignatura": "Álgebra",
              "competencies": [
                {
                  "name": "Razonamiento",
                  "skills": [{ "porcentaje": 65.0 }]
                },
                {
                  "name": "Comunicación",
                  "skills": [{ "porcentaje": 68.5 }]
                },
                {
                  "name": "Resolución",
                  "skills": [{ "porcentaje": 70.8 }]
                }
              ],
              "questions": [
                {
                  "id_pregunta": "q001",
                  "id_respuesta": "opt_b",
                  "es_correcta": false
                },
                {
                  "id_pregunta": "q002",
                  "id_respuesta": "opt_c",
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
      "cod": "MAT-ALG-001",
      "componente": "Algebraico",
      "competencia": "Razonamiento",
      "area": "Matemáticas",
      "asignatura": "Álgebra",
      "eje_tematico": "Ecuaciones Lineales",
      "grado": "11",
      "programa": "Saber 11",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_a",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    },
    {
      "id": "q002",
      "cod": "MAT-ALG-002",
      "componente": "Algebraico",
      "competencia": "Resolución",
      "area": "Matemáticas",
      "asignatura": "Álgebra",
      "eje_tematico": "Sistemas de Ecuaciones",
      "grado": "11",
      "programa": "Saber 11",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_c",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    },
    {
      "id": "q003",
      "cod": "MAT-ALG-003",
      "componente": "Algebraico",
      "competencia": "Comunicación",
      "area": "Matemáticas",
      "asignatura": "Álgebra",
      "eje_tematico": "Funciones",
      "grado": "11",
      "programa": "Saber 11",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_d",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    },
    {
      "id": "q004",
      "cod": "LEN-LEC-001",
      "componente": "Semántico",
      "competencia": "Literal",
      "area": "Lenguaje",
      "asignatura": "Competencia Lectora",
      "eje_tematico": "Comprensión Textual",
      "grado": "11",
      "programa": "Saber 11",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_b",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    },
    {
      "id": "q005",
      "cod": "LEN-LEC-002",
      "componente": "Pragmático",
      "competencia": "Inferencial",
      "area": "Lenguaje",
      "asignatura": "Competencia Lectora",
      "eje_tematico": "Interpretación",
      "grado": "11",
      "programa": "Saber 11",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_a",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    }
  ]
};
```

### Código para Generar Reporte

```javascript
async function generateUdeaReport() {
  try {
    const response = await fetch('http://localhost:3001/api/reports/simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'formarte-secret-key-2025'
      },
      body: JSON.stringify(udeaData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Reporte UDEA generado exitosamente');
      console.log(`📊 Total de páginas: ${result.data.totalPages}`);
      console.log(`📄 Archivo: ${result.data.pdf.fileName}`);
      console.log(`🔗 URL de descarga: ${result.data.pdf.downloadUrl}`);
      
      // Abrir PDF en nueva ventana
      window.open(result.data.pdf.url, '_blank');
      
      return result.data;
    } else {
      console.error('❌ Error generando reporte:', result.error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

// Ejecutar
generateUdeaReport();
```

### Resultado Esperado

El reporte UDEA incluirá:
1. **Portada** con información institucional
2. **Distribución por Competencias** (clasificación I, II, III)
3. **Desempeño por Área** (Insuficiente, Mínimo, Satisfactorio, Avanzado)
4. **Análisis de Dificultad** por pregunta con colores
5. **Tabla de Estudiantes** con rankings y competencias

---

## Ejemplo Avanzado - Reporte UNAL

### Diferencias Clave UNAL vs UDEA

- **Clasificación por puntajes**: Niveles 1-4 basados en puntajes absolutos
- **Rangos UNAL**: 1(100-350), 2(351-500), 3(501-700), 4(701-1000)
- **Sin guía de leyenda** en distribuciones horizontales

```javascript
const unalData = {
  "tipe_inform": "unal",
  "campus": "FORMARTE BOGOTÁ",
  "course": "Preparación UNAL - Admisiones",
  "students": [
    {
      "id": "std_unal_001",
      "name": "JUAN SEBASTIÁN TORRES MÉNDEZ",
      "course_id": "PREP-UNAL-A",
      "examenes_asignados": [
        {
          "score": 650,  // Puntaje UNAL (mayor a 500)
          "position": 3,
          "materias": [
            {
              "area": "Competencia Matemática",
              "asignatura": "Matemáticas",
              "competencies": [
                {
                  "name": "Razonamiento Cuantitativo",
                  "skills": [{ "porcentaje": 85.0 }]
                },
                {
                  "name": "Modelación",
                  "skills": [{ "porcentaje": 78.5 }]
                }
              ],
              "questions": [
                {
                  "id_pregunta": "q_unal_001",
                  "id_respuesta": "opt_a",
                  "es_correcta": true
                },
                {
                  "id_pregunta": "q_unal_002",
                  "id_respuesta": "opt_c",
                  "es_correcta": true
                }
              ]
            },
            {
              "area": "Competencia Lectora",
              "asignatura": "Lenguaje",
              "competencies": [
                {
                  "name": "Comprensión Lectora",
                  "skills": [{ "porcentaje": 82.0 }]
                },
                {
                  "name": "Uso del Lenguaje",
                  "skills": [{ "porcentaje": 75.5 }]
                }
              ],
              "questions": [
                {
                  "id_pregunta": "q_unal_003",
                  "id_respuesta": "opt_b",
                  "es_correcta": true
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "std_unal_002",
      "name": "LAURA PATRICIA SILVA GONZÁLEZ",
      "course_id": "PREP-UNAL-B",
      "examenes_asignados": [
        {
          "score": 425,  // Puntaje UNAL (rango 351-500)
          "position": 12,
          "materias": [
            {
              "area": "Competencia Matemática",
              "asignatura": "Matemáticas",
              "competencies": [
                {
                  "name": "Razonamiento Cuantitativo",
                  "skills": [{ "porcentaje": 62.0 }]
                }
              ],
              "questions": [
                {
                  "id_pregunta": "q_unal_001",
                  "id_respuesta": "opt_b",
                  "es_correcta": false
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
      "id": "q_unal_001",
      "cod": "UNAL-MAT-001",
      "componente": "Cuantitativo",
      "competencia": "Razonamiento Cuantitativo",
      "area": "Competencia Matemática",
      "asignatura": "Matemáticas",
      "eje_tematico": "Álgebra y Cálculo",
      "grado": "Preuniversitario UNAL",
      "programa": "Admisiones UNAL",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_a",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    },
    {
      "id": "q_unal_002",
      "cod": "UNAL-MAT-002",
      "componente": "Cuantitativo",
      "competencia": "Modelación",
      "area": "Competencia Matemática",
      "asignatura": "Matemáticas",
      "eje_tematico": "Estadística y Probabilidad",
      "grado": "Preuniversitario UNAL",
      "programa": "Admisiones UNAL",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_c",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    },
    {
      "id": "q_unal_003",
      "cod": "UNAL-LEN-001",
      "componente": "Comunicativo",
      "competencia": "Comprensión Lectora",
      "area": "Competencia Lectora",
      "asignatura": "Lenguaje",
      "eje_tematico": "Comprensión e Interpretación",
      "grado": "Preuniversitario UNAL",
      "programa": "Admisiones UNAL",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_b",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    }
  ]
};
```

### Código para Generar Reporte UNAL

```javascript
async function generateUnalReport() {
  const sessionId = `unal_session_${Date.now()}`;
  
  try {
    const response = await fetch('http://localhost:3001/api/reports/simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'formarte-secret-key-2025',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify(unalData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Reporte UNAL generado exitosamente');
      console.log(`📊 Tipo de reporte: ${result.data.reportType}`);
      console.log(`🎯 Institución: ${result.data.metadata.institution}`);
      console.log(`📑 Total de páginas: ${result.data.totalPages}`);
      console.log(`💾 Tamaño del archivo: ${(await fetch(result.data.pdf.url)).headers.get('content-length')} bytes`);
      
      return {
        pdfUrl: result.data.pdf.url,
        downloadUrl: result.data.pdf.downloadUrl,
        fileName: result.data.pdf.fileName,
        metadata: result.data.metadata
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Error generando reporte UNAL:', error);
    throw error;
  }
}

// Usar con async/await
async function main() {
  try {
    const report = await generateUnalReport();
    console.log('📄 Reporte listo:', report.fileName);
    
    // Descargar automáticamente
    const link = document.createElement('a');
    link.href = report.downloadUrl;
    link.download = report.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error en el proceso:', error);
  }
}

main();
```

---

## Ejemplo Completo - Reporte General

### Datos Complejos con Múltiples Materias

```javascript
const generalData = {
  "tipe_inform": "general",
  "campus": "FORMARTE MEDELLÍN - SEDE PRINCIPAL",
  "course": "Preparación Integral ICFES - Curso Intensivo",
  "students": [
    {
      "id": "std_gen_001",
      "name": "CARLOS ANDRÉS VÁSQUEZ HERRERA",
      "course_id": "11-A-INTENSIVO",
      "examenes_asignados": [
        {
          "score": 78.5,
          "position": 5,
          "materias": [
            {
              "area": "Matemáticas",
              "asignatura": "Álgebra",
              "competencies": [
                {
                  "name": "Razonamiento",
                  "skills": [{ "porcentaje": 85.0 }]
                },
                {
                  "name": "Comunicación",
                  "skills": [{ "porcentaje": 78.5 }]
                },
                {
                  "name": "Resolución",
                  "skills": [{ "porcentaje": 82.0 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_001", "id_respuesta": "opt_a", "es_correcta": true },
                { "id_pregunta": "q_gen_002", "id_respuesta": "opt_c", "es_correcta": true },
                { "id_pregunta": "q_gen_003", "id_respuesta": "opt_b", "es_correcta": false }
              ]
            },
            {
              "area": "Matemáticas",
              "asignatura": "Geometría",
              "competencies": [
                {
                  "name": "Espacial",
                  "skills": [{ "porcentaje": 75.0 }]
                },
                {
                  "name": "Métrico",
                  "skills": [{ "porcentaje": 80.5 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_004", "id_respuesta": "opt_d", "es_correcta": true },
                { "id_pregunta": "q_gen_005", "id_respuesta": "opt_a", "es_correcta": false }
              ]
            },
            {
              "area": "Lenguaje",
              "asignatura": "Competencia Lectora",
              "competencies": [
                {
                  "name": "Literal",
                  "skills": [{ "porcentaje": 88.0 }]
                },
                {
                  "name": "Inferencial",
                  "skills": [{ "porcentaje": 82.5 }]
                },
                {
                  "name": "Crítico",
                  "skills": [{ "porcentaje": 75.0 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_006", "id_respuesta": "opt_b", "es_correcta": true },
                { "id_pregunta": "q_gen_007", "id_respuesta": "opt_c", "es_correcta": true }
              ]
            },
            {
              "area": "Ciencias Naturales",
              "asignatura": "Física",
              "competencies": [
                {
                  "name": "Explicación de Fenómenos",
                  "skills": [{ "porcentaje": 70.0 }]
                },
                {
                  "name": "Uso del Conocimiento",
                  "skills": [{ "porcentaje": 68.5 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_008", "id_respuesta": "opt_a", "es_correcta": true }
              ]
            },
            {
              "area": "Ciencias Sociales",
              "asignatura": "Historia",
              "competencies": [
                {
                  "name": "Pensamiento Social",
                  "skills": [{ "porcentaje": 79.0 }]
                },
                {
                  "name": "Interpretación",
                  "skills": [{ "porcentaje": 76.5 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_009", "id_respuesta": "opt_c", "es_correcta": false }
              ]
            },
            {
              "area": "Inglés",
              "asignatura": "English",
              "competencies": [
                {
                  "name": "Reading",
                  "skills": [{ "porcentaje": 65.0 }]
                },
                {
                  "name": "Use of Language",
                  "skills": [{ "porcentaje": 62.5 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_010", "id_respuesta": "opt_b", "es_correcta": true }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "std_gen_002",
      "name": "DANIELA SOFÍA MARTÍNEZ LÓPEZ",
      "course_id": "11-B-INTENSIVO",
      "examenes_asignados": [
        {
          "score": 85.2,
          "position": 2,
          "materias": [
            {
              "area": "Matemáticas",
              "asignatura": "Álgebra",
              "competencies": [
                {
                  "name": "Razonamiento",
                  "skills": [{ "porcentaje": 92.0 }]
                },
                {
                  "name": "Comunicación",
                  "skills": [{ "porcentaje": 88.5 }]
                },
                {
                  "name": "Resolución",
                  "skills": [{ "porcentaje": 90.0 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_001", "id_respuesta": "opt_a", "es_correcta": true },
                { "id_pregunta": "q_gen_002", "id_respuesta": "opt_c", "es_correcta": true },
                { "id_pregunta": "q_gen_003", "id_respuesta": "opt_b", "es_correcta": false }
              ]
            }
            // ... más materias
          ]
        }
      ]
    },
    {
      "id": "std_gen_003",
      "name": "MIGUEL ALEJANDRO CASTRO RUIZ",
      "course_id": "11-A-INTENSIVO",
      "examenes_asignados": [
        {
          "score": 45.8,
          "position": 45,
          "materias": [
            {
              "area": "Matemáticas",
              "asignatura": "Álgebra",
              "competencies": [
                {
                  "name": "Razonamiento",
                  "skills": [{ "porcentaje": 38.0 }]
                },
                {
                  "name": "Comunicación",
                  "skills": [{ "porcentaje": 42.5 }]
                },
                {
                  "name": "Resolución",
                  "skills": [{ "porcentaje": 35.0 }]
                }
              ],
              "questions": [
                { "id_pregunta": "q_gen_001", "id_respuesta": "opt_b", "es_correcta": false },
                { "id_pregunta": "q_gen_002", "id_respuesta": "opt_a", "es_correcta": false },
                { "id_pregunta": "q_gen_003", "id_respuesta": null, "es_correcta": false }
              ]
            }
            // ... más materias
          ]
        }
      ]
    }
  ],
  "detailQuestion": [
    {
      "id": "q_gen_001",
      "cod": "MAT-ALG-GEN-001",
      "componente": "Algebraico",
      "competencia": "Razonamiento",
      "area": "Matemáticas",
      "asignatura": "Álgebra",
      "eje_tematico": "Ecuaciones y Sistemas",
      "grado": "11",
      "programa": "Preparación ICFES",
      "cant_respuesta": "4",
      "pregunta_correcta": "opt_a",
      "respuestas": ["opt_a", "opt_b", "opt_c", "opt_d"]
    },
    // ... más preguntas de todas las materias
  ]
};
```

### Código Avanzado con Manejo de Errores

```javascript
class ReportGenerator {
  constructor(apiKey, baseUrl = 'http://localhost:3001') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.sessionId = null;
  }

  async generateReport(data, options = {}) {
    const { 
      useWebSocket = false, 
      downloadAutomatically = false,
      onProgress = null,
      onError = null,
      onComplete = null 
    } = options;

    // Generar session ID si se usa WebSocket
    if (useWebSocket) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.setupWebSocket(onProgress, onError, onComplete);
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      };

      if (this.sessionId) {
        headers['X-Session-ID'] = this.sessionId;
      }

      console.log('🚀 Iniciando generación de reporte...');
      console.log(`📋 Tipo: ${data.tipe_inform.toUpperCase()}`);
      console.log(`🏫 Campus: ${data.campus}`);
      console.log(`👥 Estudiantes: ${data.students.length}`);
      console.log(`❓ Preguntas: ${data.detailQuestion.length}`);

      const startTime = Date.now();

      const response = await fetch(`${this.baseUrl}/api/reports/simulation`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Error desconocido'}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Error en la generación del reporte');
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`✅ Reporte generado exitosamente en ${duration.toFixed(2)}s`);
      console.log(`📊 Páginas generadas: ${result.data.totalPages}`);
      console.log(`📁 Archivo: ${result.data.pdf.fileName}`);

      // Obtener tamaño del archivo
      try {
        const headResponse = await fetch(result.data.pdf.url, { method: 'HEAD' });
        const fileSize = headResponse.headers.get('content-length');
        if (fileSize) {
          const sizeInMB = (parseInt(fileSize) / 1024 / 1024).toFixed(2);
          console.log(`💾 Tamaño: ${sizeInMB} MB`);
        }
      } catch (e) {
        console.warn('⚠️ No se pudo obtener el tamaño del archivo');
      }

      // Descarga automática
      if (downloadAutomatically && typeof window !== 'undefined') {
        this.downloadFile(result.data.pdf.downloadUrl, result.data.pdf.fileName);
      }

      return {
        success: true,
        data: result.data,
        duration,
        metadata: {
          reportType: data.tipe_inform,
          institution: data.campus,
          studentsCount: data.students.length,
          questionsCount: data.detailQuestion.length,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error generando reporte:', error.message);
      
      if (onError) {
        onError(error);
      }

      return {
        success: false,
        error: error.message,
        duration: (Date.now() - startTime) / 1000
      };
    }
  }

  async setupWebSocket(onProgress, onError, onComplete) {
    if (typeof io === 'undefined') {
      console.warn('⚠️ Socket.IO no está disponible. WebSocket deshabilitado.');
      return;
    }

    this.socket = io(this.baseUrl);

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket conectado');
      this.socket.emit('join-session', this.sessionId);
    });

    this.socket.on('progress-update', (data) => {
      console.log(`📊 ${data.stage}: ${data.progress}% - ${data.message}`);
      if (onProgress) {
        onProgress(data);
      }
    });

    this.socket.on('error', (errorData) => {
      console.error(`❌ WebSocket Error: ${errorData.error}`);
      if (onError) {
        onError(new Error(errorData.error));
      }
    });

    this.socket.on('complete', (completeData) => {
      console.log('🎉 Proceso completado via WebSocket');
      if (onComplete) {
        onComplete(completeData);
      }
    });

    // Esperar conexión
    await new Promise((resolve) => {
      this.socket.on('connect', resolve);
    });
  }

  downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`⬇️ Descargando: ${filename}`);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 WebSocket desconectado');
    }
  }
}

// Uso de la clase
async function generateCompleteReport() {
  const generator = new ReportGenerator('formarte-secret-key-2025');

  const result = await generator.generateReport(generalData, {
    useWebSocket: true,
    downloadAutomatically: true,
    
    onProgress: (data) => {
      // Actualizar UI de progreso
      updateProgressBar(data.progress);
      updateStatusMessage(data.message);
      
      // Log detallado de progreso
      if (data.data) {
        console.log(`📈 Datos adicionales:`, data.data);
      }
    },
    
    onError: (error) => {
      alert(`Error: ${error.message}`);
      hideProgressBar();
    },
    
    onComplete: (data) => {
      console.log('🎊 ¡Reporte completado!', data.result);
      showSuccessMessage('Reporte generado exitosamente');
      hideProgressBar();
    }
  });

  if (result.success) {
    console.log('📋 Resumen del reporte:', result.metadata);
    return result.data;
  } else {
    console.error('💥 Falló la generación:', result.error);
    throw new Error(result.error);
  }
}

// Funciones auxiliares para UI (ejemplo)
function updateProgressBar(progress) {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.value = progress;
    progressBar.textContent = `${progress}%`;
  }
}

function updateStatusMessage(message) {
  const statusElement = document.getElementById('statusMessage');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function showSuccessMessage(message) {
  const successElement = document.getElementById('successMessage');
  if (successElement) {
    successElement.textContent = message;
    successElement.style.display = 'block';
  }
}

function hideProgressBar() {
  const progressContainer = document.getElementById('progressContainer');
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }
}

// Ejecutar reporte
generateCompleteReport().catch(console.error);
```

---

## Integración con WebSocket

### Cliente HTML Completo

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generador de Reportes FORMARTE</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .progress-container {
            margin: 20px 0;
            display: none;
        }
        
        .progress-bar {
            width: 100%;
            height: 30px;
            background-color: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 15px;
        }
        
        .progress-text {
            text-align: center;
            margin-top: 10px;
            font-weight: bold;
        }
        
        .status-message {
            text-align: center;
            margin: 10px 0;
            color: #666;
        }
        
        .controls {
            text-align: center;
            margin: 20px 0;
        }
        
        button {
            background: #2196F3;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        
        button:hover {
            background: #1976D2;
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .report-type {
            margin: 10px 0;
        }
        
        .log-container {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
        
        .log-entry {
            margin: 2px 0;
            padding: 2px;
        }
        
        .log-error { color: #dc3545; }
        .log-success { color: #28a745; }
        .log-info { color: #17a2b8; }
        .log-warning { color: #ffc107; }
        
        .result-container {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            display: none;
        }
        
        .success { 
            background: #d4edda; 
            border-color: #c3e6cb; 
            color: #155724; 
        }
        
        .error { 
            background: #f8d7da; 
            border-color: #f5c6cb; 
            color: #721c24; 
        }
    </style>
</head>
<body>
    <h1>🎓 Generador de Reportes FORMARTE</h1>
    
    <div class="controls">
        <div class="report-type">
            <label>
                <input type="radio" name="reportType" value="udea" checked> 
                📊 Reporte UDEA
            </label>
            <label>
                <input type="radio" name="reportType" value="unal"> 
                🎯 Reporte UNAL
            </label>
            <label>
                <input type="radio" name="reportType" value="general"> 
                📈 Reporte General
            </label>
        </div>
        
        <button id="generateBtn">🚀 Generar Reporte</button>
        <button id="clearLogBtn">🗑️ Limpiar Log</button>
    </div>
    
    <div class="progress-container" id="progressContainer">
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        <div class="progress-text" id="progressText">0%</div>
        <div class="status-message" id="statusMessage">Preparando...</div>
    </div>
    
    <div class="result-container" id="resultContainer">
        <h3 id="resultTitle">Resultado</h3>
        <div id="resultContent"></div>
    </div>
    
    <div class="log-container" id="logContainer">
        <h3>📋 Log de Actividad</h3>
        <div id="logContent"></div>
    </div>

    <script>
        class ReportGeneratorUI {
            constructor() {
                this.socket = null;
                this.sessionId = null;
                this.currentProgress = 0;
                
                this.initializeElements();
                this.bindEvents();
                this.log('Sistema inicializado', 'info');
            }
            
            initializeElements() {
                this.generateBtn = document.getElementById('generateBtn');
                this.clearLogBtn = document.getElementById('clearLogBtn');
                this.progressContainer = document.getElementById('progressContainer');
                this.progressFill = document.getElementById('progressFill');
                this.progressText = document.getElementById('progressText');
                this.statusMessage = document.getElementById('statusMessage');
                this.resultContainer = document.getElementById('resultContainer');
                this.resultTitle = document.getElementById('resultTitle');
                this.resultContent = document.getElementById('resultContent');
                this.logContent = document.getElementById('logContent');
            }
            
            bindEvents() {
                this.generateBtn.addEventListener('click', () => this.generateReport());
                this.clearLogBtn.addEventListener('click', () => this.clearLog());
            }
            
            getSelectedReportType() {
                const selected = document.querySelector('input[name="reportType"]:checked');
                return selected ? selected.value : 'udea';
            }
            
            async generateReport() {
                try {
                    this.generateBtn.disabled = true;
                    this.hideResult();
                    this.showProgress();
                    
                    const reportType = this.getSelectedReportType();
                    this.log(\`🚀 Iniciando generación de reporte \${reportType.toUpperCase()}\`, 'info');
                    
                    // Crear session ID
                    this.sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
                    
                    // Conectar WebSocket
                    await this.connectWebSocket();
                    
                    // Obtener datos según el tipo de reporte
                    const reportData = this.getReportData(reportType);
                    
                    // Generar reporte
                    const result = await this.callReportAPI(reportData);
                    
                    if (result.success) {
                        this.log('✅ Reporte generado exitosamente', 'success');
                        this.showResult(result.data, 'success');
                        
                        // Auto-download
                        setTimeout(() => {
                            this.downloadReport(result.data.pdf.downloadUrl, result.data.pdf.fileName);
                        }, 1000);
                    } else {
                        throw new Error(result.error);
                    }
                    
                } catch (error) {
                    this.log(\`❌ Error: \${error.message}\`, 'error');
                    this.showResult({ error: error.message }, 'error');
                } finally {
                    this.generateBtn.disabled = false;
                    setTimeout(() => this.hideProgress(), 2000);
                }
            }
            
            async connectWebSocket() {
                return new Promise((resolve, reject) => {
                    this.socket = io('http://localhost:3001');
                    
                    this.socket.on('connect', () => {
                        this.log('🔌 WebSocket conectado', 'info');
                        this.socket.emit('join-session', this.sessionId);
                        resolve();
                    });
                    
                    this.socket.on('connect_error', (error) => {
                        this.log(\`❌ Error de conexión WebSocket: \${error.message}\`, 'error');
                        reject(error);
                    });
                    
                    this.socket.on('progress-update', (data) => {
                        this.updateProgress(data.progress, data.message);
                        this.log(\`📊 \${data.stage}: \${data.progress}% - \${data.message}\`, 'info');
                    });
                    
                    this.socket.on('error', (errorData) => {
                        this.log(\`❌ WebSocket Error: \${errorData.error}\`, 'error');
                    });
                    
                    this.socket.on('complete', (completeData) => {
                        this.log('🎉 Proceso completado via WebSocket', 'success');
                        this.updateProgress(100, 'Completado');
                    });
                    
                    // Timeout de conexión
                    setTimeout(() => {
                        if (!this.socket.connected) {
                            reject(new Error('Timeout de conexión WebSocket'));
                        }
                    }, 5000);
                });
            }
            
            async callReportAPI(data) {
                const response = await fetch('http://localhost:3001/api/reports/simulation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'formarte-secret-key-2025',
                        'X-Session-ID': this.sessionId
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${result.error || 'Error desconocido'}\`);
                }
                
                return result;
            }
            
            getReportData(type) {
                // Datos simplificados para demo
                const baseData = {
                    campus: "FORMARTE MEDELLÍN - DEMO",
                    course: "Curso de Prueba",
                    students: [
                        {
                            id: "demo_001",
                            name: "ESTUDIANTE DEMO UNO",
                            course_id: "11-A",
                            examenes_asignados: [{
                                score: type === 'unal' ? 650 : 78.5,
                                position: 1,
                                materias: [{
                                    area: "Matemáticas",
                                    asignatura: "Álgebra",
                                    competencies: [{
                                        name: "Razonamiento",
                                        skills: [{ porcentaje: 85.0 }]
                                    }],
                                    questions: [{
                                        id_pregunta: "demo_q001",
                                        id_respuesta: "opt_a",
                                        es_correcta: true
                                    }]
                                }]
                            }]
                        }
                    ],
                    detailQuestion: [{
                        id: "demo_q001",
                        cod: "DEMO-001",
                        componente: "Demo",
                        competencia: "Razonamiento",
                        area: "Matemáticas",
                        asignatura: "Álgebra",
                        eje_tematico: "Demostración",
                        grado: "11",
                        programa: "Demo",
                        cant_respuesta: "4",
                        pregunta_correcta: "opt_a",
                        respuestas: ["opt_a", "opt_b", "opt_c", "opt_d"]
                    }]
                };
                
                return { ...baseData, tipe_inform: type };
            }
            
            updateProgress(progress, message) {
                this.currentProgress = progress;
                this.progressFill.style.width = \`\${progress}%\`;
                this.progressText.textContent = \`\${progress}%\`;
                this.statusMessage.textContent = message;
            }
            
            showProgress() {
                this.progressContainer.style.display = 'block';
                this.updateProgress(0, 'Preparando...');
            }
            
            hideProgress() {
                this.progressContainer.style.display = 'none';
            }
            
            showResult(data, type) {
                this.resultContainer.className = \`result-container \${type}\`;
                this.resultContainer.style.display = 'block';
                
                if (type === 'success') {
                    this.resultTitle.textContent = '✅ Reporte Generado Exitosamente';
                    this.resultContent.innerHTML = \`
                        <p><strong>📁 Archivo:</strong> \${data.pdf.fileName}</p>
                        <p><strong>📊 Páginas:</strong> \${data.totalPages}</p>
                        <p><strong>🏫 Institución:</strong> \${data.metadata.institution}</p>
                        <p><strong>📅 Generado:</strong> \${new Date(data.metadata.generatedAt).toLocaleString()}</p>
                        <p>
                            <a href="\${data.pdf.url}" target="_blank">🔗 Ver PDF</a> | 
                            <a href="\${data.pdf.downloadUrl}">⬇️ Descargar</a>
                        </p>
                    \`;
                } else {
                    this.resultTitle.textContent = '❌ Error en la Generación';
                    this.resultContent.innerHTML = \`<p>\${data.error}</p>\`;
                }
            }
            
            hideResult() {
                this.resultContainer.style.display = 'none';
            }
            
            downloadReport(url, filename) {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                this.log(\`⬇️ Descargando: \${filename}\`, 'success');
            }
            
            log(message, type = 'info') {
                const timestamp = new Date().toLocaleTimeString();
                const entry = document.createElement('div');
                entry.className = \`log-entry log-\${type}\`;
                entry.textContent = \`[\${timestamp}] \${message}\`;
                
                this.logContent.appendChild(entry);
                this.logContent.scrollTop = this.logContent.scrollHeight;
            }
            
            clearLog() {
                this.logContent.innerHTML = '';
                this.log('Log limpiado', 'info');
            }
        }
        
        // Inicializar cuando la página esté lista
        document.addEventListener('DOMContentLoaded', () => {
            new ReportGeneratorUI();
        });
    </script>
</body>
</html>
```

---

## Casos de Uso Específicos

### 1. Batch Processing - Múltiples Reportes

```javascript
class BatchReportGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.queue = [];
        this.processing = false;
        this.results = [];
    }
    
    addToQueue(reportData, options = {}) {
        this.queue.push({ data: reportData, options });
    }
    
    async processQueue() {
        if (this.processing) {
            throw new Error('Ya hay un proceso en ejecución');
        }
        
        this.processing = true;
        this.results = [];
        
        console.log(\`🔄 Procesando \${this.queue.length} reportes en cola...\`);
        
        for (let i = 0; i < this.queue.length; i++) {
            const { data, options } = this.queue[i];
            
            console.log(\`📋 Procesando reporte \${i + 1}/\${this.queue.length}: \${data.tipe_inform}\`);
            
            try {
                const generator = new ReportGenerator(this.apiKey);
                const result = await generator.generateReport(data, {
                    ...options,
                    useWebSocket: false // Disable WebSocket for batch
                });
                
                this.results.push({
                    index: i,
                    success: true,
                    data: result.data,
                    duration: result.duration
                });
                
                console.log(\`✅ Reporte \${i + 1} completado en \${result.duration.toFixed(2)}s\`);
                
                // Delay entre reportes para no sobrecargar
                if (i < this.queue.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.error(\`❌ Error en reporte \${i + 1}:\`, error.message);
                this.results.push({
                    index: i,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.processing = false;
        this.queue = [];
        
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        
        console.log(\`📊 Proceso completado: \${successful} exitosos, \${failed} fallidos\`);
        
        return this.results;
    }
    
    getResults() {
        return this.results;
    }
    
    downloadAllSuccessful() {
        const successful = this.results.filter(r => r.success);
        
        successful.forEach((result, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = result.data.pdf.downloadUrl;
                link.download = result.data.pdf.fileName;
                link.click();
            }, index * 1000); // 1 segundo entre descargas
        });
    }
}

// Uso del Batch Processor
async function processBatchReports() {
    const batch = new BatchReportGenerator('formarte-secret-key-2025');
    
    // Agregar múltiples reportes
    batch.addToQueue(udeaData);
    batch.addToQueue(unalData);
    batch.addToQueue(generalData);
    
    // Procesar todos
    const results = await batch.processQueue();
    
    // Descargar todos los exitosos
    batch.downloadAllSuccessful();
    
    return results;
}
```

### 2. Report Comparison - Comparar Resultados

```javascript
async function compareReports(reportData1, reportData2) {
    const generator = new ReportGenerator('formarte-secret-key-2025');
    
    console.log('🔄 Generando reportes para comparación...');
    
    const [report1, report2] = await Promise.all([
        generator.generateReport(reportData1),
        generator.generateReport(reportData2)
    ]);
    
    if (!report1.success || !report2.success) {
        throw new Error('Error generando uno o ambos reportes');
    }
    
    const comparison = {
        report1: {
            type: reportData1.tipe_inform,
            campus: reportData1.campus,
            students: reportData1.students.length,
            pages: report1.data.totalPages,
            duration: report1.duration,
            url: report1.data.pdf.url
        },
        report2: {
            type: reportData2.tipe_inform,
            campus: reportData2.campus,
            students: reportData2.students.length,
            pages: report2.data.totalPages,
            duration: report2.duration,
            url: report2.data.pdf.url
        },
        analysis: {
            studentsRatio: reportData2.students.length / reportData1.students.length,
            pagesRatio: report2.data.totalPages / report1.data.totalPages,
            performanceRatio: report2.duration / report1.duration
        }
    };
    
    console.log('📊 Comparación de reportes:', comparison);
    
    return comparison;
}
```

### 3. Scheduled Reports - Reportes Programados

```javascript
class ScheduledReportGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.schedules = new Map();
        this.timers = new Map();
    }
    
    scheduleReport(id, reportData, cronExpression, options = {}) {
        // Implementación simplificada - en producción usar node-cron
        const { interval = 60000 } = options; // Default 1 minuto para demo
        
        this.schedules.set(id, {
            data: reportData,
            interval,
            options,
            lastRun: null,
            nextRun: Date.now() + interval
        });
        
        const timer = setInterval(async () => {
            await this.executeScheduledReport(id);
        }, interval);
        
        this.timers.set(id, timer);
        
        console.log(\`⏰ Reporte programado: \${id} (cada \${interval/1000}s)\`);
    }
    
    async executeScheduledReport(id) {
        const schedule = this.schedules.get(id);
        if (!schedule) return;
        
        console.log(\`⏰ Ejecutando reporte programado: \${id}\`);
        
        try {
            const generator = new ReportGenerator(this.apiKey);
            const result = await generator.generateReport(schedule.data, {
                ...schedule.options,
                useWebSocket: false
            });
            
            schedule.lastRun = Date.now();
            schedule.nextRun = Date.now() + schedule.interval;
            
            console.log(\`✅ Reporte programado \${id} completado\`);
            
            // Notificar o guardar resultado
            this.onScheduledReportComplete?.(id, result);
            
        } catch (error) {
            console.error(\`❌ Error en reporte programado \${id}:\`, error);
            this.onScheduledReportError?.(id, error);
        }
    }
    
    stopSchedule(id) {
        const timer = this.timers.get(id);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(id);
            this.schedules.delete(id);
            console.log(\`⏹️ Reporte programado detenido: \${id}\`);
        }
    }
    
    getScheduleStatus() {
        const status = [];
        this.schedules.forEach((schedule, id) => {
            status.push({
                id,
                lastRun: schedule.lastRun ? new Date(schedule.lastRun).toISOString() : 'Nunca',
                nextRun: new Date(schedule.nextRun).toISOString(),
                interval: schedule.interval,
                type: schedule.data.tipe_inform
            });
        });
        return status;
    }
}

// Uso de reportes programados
const scheduler = new ScheduledReportGenerator('formarte-secret-key-2025');

scheduler.onScheduledReportComplete = (id, result) => {
    console.log(\`📧 Enviando notificación para reporte \${id}\`);
    // Enviar email, guardar en base de datos, etc.
};

scheduler.onScheduledReportError = (id, error) => {
    console.log(\`🚨 Alerta: Error en reporte programado \${id}\`);
    // Enviar alerta de error
};

// Programar reportes diarios
scheduler.scheduleReport('daily-udea', udeaData, '0 8 * * *', {
    interval: 24 * 60 * 60 * 1000 // 24 horas
});

scheduler.scheduleReport('weekly-general', generalData, '0 8 * * 1', {
    interval: 7 * 24 * 60 * 60 * 1000 // 7 días
});
```

---

## Consejos y Mejores Prácticas

### 1. Optimización de Performance

```javascript
// Cache de configuraciones
const configCache = new Map();

function getCachedConfig(type) {
    if (!configCache.has(type)) {
        configCache.set(type, generateConfig(type));
    }
    return configCache.get(type);
}

// Reutilizar conexiones
const connectionPool = {
    socket: null,
    apiClient: null
};

// Procesamiento en lotes optimizado
async function optimizedBatchProcessing(reports) {
    const BATCH_SIZE = 3; // Máximo 3 concurrentes
    const results = [];
    
    for (let i = 0; i < reports.length; i += BATCH_SIZE) {
        const batch = reports.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(report => processReport(report))
        );
        results.push(...batchResults);
        
        // Pausa entre lotes
        if (i + BATCH_SIZE < reports.length) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    return results;
}
```

### 2. Manejo de Errores Robusto

```javascript
class ReportError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'ReportError';
        this.code = code;
        this.details = details;
    }
}

async function robustReportGeneration(data, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(\`🔄 Intento \${attempt}/\${maxRetries}\`);
            
            const result = await generateReport(data);
            
            if (result.success) {
                if (attempt > 1) {
                    console.log(\`✅ Éxito en intento \${attempt}\`);
                }
                return result;
            } else {
                throw new ReportError(result.error, 'GENERATION_FAILED', result);
            }
            
        } catch (error) {
            lastError = error;
            console.log(\`❌ Intento \${attempt} falló: \${error.message}\`);
            
            // No reintentar para ciertos errores
            if (error.code === 'AUTH_FAILED' || error.status === 401) {
                break;
            }
            
            // Backoff exponencial
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(\`⏳ Esperando \${delay/1000}s antes del siguiente intento...\`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw new ReportError(
        \`Falló después de \${maxRetries} intentos: \${lastError.message}\`,
        'MAX_RETRIES_EXCEEDED',
        { originalError: lastError, attempts: maxRetries }
    );
}
```

### 3. Monitoreo y Métricas

```javascript
class ReportMetrics {
    constructor() {
        this.metrics = {
            totalReports: 0,
            successfulReports: 0,
            failedReports: 0,
            totalDuration: 0,
            averageDuration: 0,
            reportsByType: {},
            errors: []
        };
    }
    
    recordReport(type, success, duration, error = null) {
        this.metrics.totalReports++;
        this.metrics.totalDuration += duration;
        this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.totalReports;
        
        if (!this.metrics.reportsByType[type]) {
            this.metrics.reportsByType[type] = { total: 0, successful: 0, failed: 0 };
        }
        
        this.metrics.reportsByType[type].total++;
        
        if (success) {
            this.metrics.successfulReports++;
            this.metrics.reportsByType[type].successful++;
        } else {
            this.metrics.failedReports++;
            this.metrics.reportsByType[type].failed++;
            
            if (error) {
                this.metrics.errors.push({
                    timestamp: new Date().toISOString(),
                    type,
                    error: error.message,
                    duration
                });
            }
        }
    }
    
    getReport() {
        return {
            ...this.metrics,
            successRate: (this.metrics.successfulReports / this.metrics.totalReports * 100).toFixed(2) + '%',
            failureRate: (this.metrics.failedReports / this.metrics.totalReports * 100).toFixed(2) + '%',
            averageDurationFormatted: \`\${this.metrics.averageDuration.toFixed(2)}s\`
        };
    }
    
    reset() {
        this.metrics = {
            totalReports: 0,
            successfulReports: 0,
            failedReports: 0,
            totalDuration: 0,
            averageDuration: 0,
            reportsByType: {},
            errors: []
        };
    }
}

// Uso global de métricas
const globalMetrics = new ReportMetrics();

// Wrapper para medir reportes
async function measuredReportGeneration(data, options = {}) {
    const startTime = Date.now();
    const type = data.tipe_inform;
    
    try {
        const result = await generateReport(data, options);
        const duration = (Date.now() - startTime) / 1000;
        
        globalMetrics.recordReport(type, result.success, duration);
        
        return result;
        
    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        globalMetrics.recordReport(type, false, duration, error);
        throw error;
    }
}

// Reporte de métricas periódico
setInterval(() => {
    const report = globalMetrics.getReport();
    console.log('📊 Métricas de reportes:', report);
}, 60000); // Cada minuto
```

Esta documentación proporciona ejemplos completos y prácticos para usar el microservicio de reportes en diferentes escenarios, desde casos básicos hasta implementaciones avanzadas con manejo de errores, métricas y procesamiento en lotes.