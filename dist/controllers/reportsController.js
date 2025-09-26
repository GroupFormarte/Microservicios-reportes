"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSimulationData = exports.getDefaultHeaderImages = exports.getImageBase64 = exports.generatePdfPreview = exports.generatePdf = exports.previewHorizontal = exports.previewVertical = exports.renderVerticalExample = exports.renderMultipleCharts = exports.renderLayout = exports.renderComparative = exports.renderTable = exports.renderBarChart = exports.renderPage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const renderService_1 = require("../services/renderService");
const pdfService_1 = require("../services/pdfService");
const websocketService_1 = require("../services/websocketService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const udeaReports_1 = require("../utils/udeaReports");
// Funciones genéricas reutilizables
const pageGenerators_1 = require("../utils/pageGenerators");
const renderService = new renderService_1.RenderService();
// Main endpoint: Render complete page
exports.renderPage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    logger_1.logger.info('Rendering page', {
        layout: data.layout,
        componentCount: data.components.length,
        institucion: data.headerInfo.institucion
    });
    const result = await renderService.renderPage(data);
    const response = {
        success: true,
        data: {
            html: result.html,
            metadata: result.metadata
        }
    };
    res.json(response);
});
// Legacy endpoints for backwards compatibility
exports.renderBarChart = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const result = await renderService.renderBarChart(data);
    res.json({ success: true, data: result });
});
exports.renderTable = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const result = await renderService.renderTable(data);
    res.json({ success: true, data: result });
});
exports.renderComparative = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const result = await renderService.renderComparative(data);
    res.json({ success: true, data: result });
});
exports.renderLayout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const result = await renderService.renderLayout(data);
    res.json({ success: true, data: result });
});
exports.renderMultipleCharts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const charts = req.body.charts || [];
    const result = await renderService.renderMultipleCharts(charts);
    res.json({ success: true, data: result });
});
exports.renderVerticalExample = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const exampleData = {
    // layout: "vertical",
    // chartTitle: "Análisis de Resultados por Competencias",
    // headerInfo: {
    //   institucion: "I.E. Ejemplo Demo",
    //   evaluacion: "SABER 11° - Demo",
    //   municipio: "Demo City",
    //   fecha: "31/07/2025"
    // },
    // components: [
    //   {
    //     type: "bar_chart_with_title",
    //     data: {
    //       title: "Matemáticas - Demo",
    //       chartId: "demo_math",
    //       ranges: [
    //         { percentage: 25, count: 150 },
    //         { percentage: 35, count: 210 },
    //         { percentage: 30, count: 180 },
    //         { percentage: 10, count: 60 }
    //       ],
    //       chartData: {
    //         labels: ["Bajo", "Medio", "Alto", "Superior"],
    //         values: [25, 35, 30, 10],
    //         colors: ["#c55c5c", "#d88008", "#f4d03f", "#58a55c"]
    //       }
    //     }
    //   }
    // ]
    };
    const result = await renderService.renderPage(exampleData);
    res.json({ success: true, data: result });
});
// Preview endpoints - Returns HTML directly for browser viewing
exports.previewVertical = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const exampleData = {
    // layout: "vertical",
    // chartTitle: "Preview Completo - Todos los Componentes Disponibles",
    // headerInfo: {
    //   institucion: "I.E. Formarte Preview Completo",
    //   evaluacion: "SABER 11° - 2025",
    //   municipio: "Medellín, Antioquia",
    //   fecha: "31 de Julio de 2025"
    // },
    // components: [
    //   // 1. Componente: Gráfico de Barras con Título
    //   {
    //     type: "bar_chart_with_title",
    //     data: {
    //       title: "Matemáticas - Razonamiento Cuantitativo",
    //       chartId: "matematicas_preview",
    //       ranges: [
    //         { percentage: 25, count: 150 },
    //         { percentage: 35, count: 210 },
    //         { percentage: 30, count: 180 },
    //         { percentage: 10, count: 60 }
    //       ],
    //       chartData: {
    //         values: [25, 35, 30, 10],
    //       }
    //     }
    //   },
    //   // 4. Componente: Otro Gráfico de Barras (Lenguaje)
    //   {
    //     type: "bar_chart_with_title",
    //     data: {
    //       title: "Lenguaje - Comprensión Lectora",
    //       chartId: "lenguaje_preview",
    //       ranges: [
    //         { percentage: 20, count: 120 },
    //         { percentage: 40, count: 240 },
    //         { percentage: 30, count: 180 },
    //         { percentage: 10, count: 60 }
    //       ],
    //       chartData: {
    //         labels: ["Insuficiente", "Mínimo", "Satisfactorio", "Avanzado"],
    //         values: [20, 40, 30, 10],
    //         colors: ["#c55c5c", "#d88008", "#f4d03f", "#58a55c"]
    //       }
    //     }
    //   },
    //   // 5. Componente: Score Distribution (si está disponible)
    //   {
    //     type: "score_distribution",
    //     data: {
    //       subjects: [
    //         {
    //           name: "Ciencias Naturales",
    //           chartId: "ciencias_distribution",
    //           ranges: [
    //             { label: "0 a 35.5", percentage: 18, count: 108 },
    //             { label: "35.5 a 50.5", percentage: 32, count: 192 },
    //             { label: "50.5 a 70.5", percentage: 35, count: 210 },
    //             { label: "70.5 a 100", percentage: 15, count: 90 }
    //           ]
    //         }
    //       ]
    //     }
    //   },
    //   // 6. Componente: Gráfico de Barras Simple
    //   {
    //     type: "bar_chart_simple",
    //     data: {
    //       title: "Sociales y Ciudadanas - Análisis Simple",
    //       chartId: "sociales_simple",
    //       ranges: [
    //         { percentage: 22, count: 132 },
    //         { percentage: 38, count: 228 },
    //         { percentage: 28, count: 168 },
    //         { percentage: 12, count: 72 }
    //       ],
    //       chartData: {
    //         values: [22, 38, 28, 12],
    //       },
    //       maxValue: 50
    //     }
    //   }
    // ]
    };
    const result = await renderService.renderPage(exampleData);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(result.html);
});
exports.previewHorizontal = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const exampleData = {
    // layout: "horizontal",
    // chartTitle: "Comparativo de Resultados - Vista Horizontal",
    // headerInfo: {
    //   institucion: "Colegio San José Preview",
    //   evaluacion: "SABER PRO - 2025",
    //   municipio: "Bogotá, D.C.",
    //   fecha: "15 de Agosto de 2025"
    // },
    // components: [
    //   {
    //     type: "comparativo_puntaje",
    //     data: {
    //       subjects: ["Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Inglés"],
    //       tableData: [
    //         {
    //           type: "nacional",
    //           label: "Colombia",
    //           values: [250, 245, 240, 235, 230]
    //         },
    //         {
    //           type: "departamento",
    //           label: "Cundinamarca",
    //           values: [265, 260, 255, 250, 245]
    //         },
    //         {
    //           type: "municipio",
    //           label: "Bogotá D.C.",
    //           values: [280, 275, 270, 265, 260]
    //         },
    //         {
    //           type: "institucion",
    //           label: "Colegio San José",
    //           values: [295, 290, 285, 280, 275]
    //         }
    //       ],
    //       chartData: {
    //         labels: ["Matemáticas", "Lenguaje", "Ciencias", "Sociales", "Inglés"],
    //         datasets: [
    //           {
    //             label: "Colombia",
    //             data: [250, 245, 240, 235, 230],
    //             backgroundColor: "#c55c5c"
    //           },
    //           {
    //             label: "Cundinamarca",
    //             data: [265, 260, 255, 250, 245],
    //             backgroundColor: "#d88008"
    //           },
    //           {
    //             label: "Bogotá D.C.",
    //             data: [280, 275, 270, 265, 260],
    //             backgroundColor: "#f4d03f"
    //           },
    //           {
    //             label: "Colegio San José",
    //             data: [295, 290, 285, 280, 275],
    //             backgroundColor: "#58a55c"
    //           }
    //         ]
    //       },
    //       chartConfig: {
    //         categoryPercentage: 0.8,
    //         barPercentage: 0.9,
    //         yAxisMax: 350,
    //         stepSize: 50
    //       },
    //       chartId: "comparativo_horizontal_preview"
    //     }
    //   },
    //   {
    //     type: "bar_chart_with_title",
    //     data: {
    //       title: "Distribución General de Resultados",
    //       chartId: "distribucion_horizontal_preview",
    //       ranges: [
    //         { percentage: 15, count: 90 },
    //         { percentage: 30, count: 180 },
    //         { percentage: 40, count: 240 },
    //         { percentage: 15, count: 90 }
    //       ],
    //       chartData: {
    //         labels: ["Insuficiente", "Mínimo", "Satisfactorio", "Avanzado"],
    //         values: [15, 30, 40, 15],
    //         colors: ["#c55c5c", "#d88008", "#f4d03f", "#58a55c"]
    //       }
    //     }
    //   }
    // ]
    };
    const result = await renderService.renderPage(exampleData);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(result.html);
});
// PDF Generation endpoints
exports.generatePdf = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    logger_1.logger.info("Generating and saving PDF", {
        layout: data.layout,
        componentCount: data.components.length,
        institution: data.headerInfo.institucion,
        options: data.options
    });
    const startTime = Date.now();
    const fileName = await pdfService_1.pdfService.savePdf(data, data.options);
    const renderTime = Date.now() - startTime;
    // Return JSON response with PDF URL
    const pdfUrl = `${req.protocol}://${req.get('host')}/api/reports/pdfs/${fileName}`;
    res.json({
        success: true,
        data: {
            fileName,
            url: pdfUrl,
            downloadUrl: `${pdfUrl}?download=true`,
            metadata: {
                renderTime,
                institution: data.headerInfo.institucion,
                layout: data.layout,
                componentCount: data.components.length
            }
        }
    });
    logger_1.logger.info("PDF generated and saved", {
        fileName,
        url: pdfUrl,
        renderTime
    });
});
exports.generatePdfPreview = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Example data for PDF preview
    const { logo, institucionImage, evaluacionImage, municipioImage, fechaImage } = (0, exports.getDefaultHeaderImages)();
    const exampleData = {
        layout: "vertical",
        chartTitle: "Preview Completo - Reporte PDF",
        headerInfo: {
            institucion: "I.E. Formarte Preview PDF",
            evaluacion: "SABER 11° - 2025",
            municipio: "Medellín, Antioquia",
            fecha: "31 de Julio de 2025",
            logo,
            institucionImage,
            evaluacionImage,
            municipioImage,
            fechaImage,
        },
        components: [
            {
                type: "bar_chart_with_title",
                data: {
                    title: "Matemáticas - Razonamiento Cuantitativo",
                    chartId: "matematicas_pdf_preview",
                    ranges: [
                        { percentage: 25, count: 150 },
                        { percentage: 35, count: 210 },
                        { percentage: 30, count: 180 },
                        { percentage: 10, count: 60 }
                    ],
                    chartData: {
                        values: [25, 35, 30, 10]
                    }
                }
            },
            {
                type: "bar_chart_with_title",
                data: {
                    title: "Lenguaje - Comprensión Lectora",
                    chartId: "lenguaje_pdf_preview",
                    ranges: [
                        { percentage: 20, count: 120 },
                        { percentage: 40, count: 240 },
                        { percentage: 30, count: 180 },
                        { percentage: 10, count: 60 }
                    ],
                    chartData: {
                        values: [20, 40, 30, 10]
                    }
                }
            },
        ]
    };
    const fileName = await pdfService_1.pdfService.savePdf(exampleData, {
        format: "A4",
        orientation: "portrait",
        printBackground: true,
        scale: 0.75
    });
    // Return JSON response with PDF URL
    const pdfUrl = `${req.protocol}://${req.get('host')}/api/reports/pdfs/${fileName}`;
    res.json({
        success: true,
        data: {
            fileName,
            url: pdfUrl,
            downloadUrl: `${pdfUrl}?download=true`,
            message: "PDF preview generated successfully",
            metadata: {
                institution: exampleData.headerInfo.institucion,
                layout: exampleData.layout,
                headerInfo: exampleData.headerInfo,
                componentCount: exampleData.components.length
            }
        }
    });
});
// Convert image to base64 data URL
const getImageBase64 = (imagePath) => {
    try {
        const logoPath = path_1.default.join(process.cwd(), imagePath);
        const logoBase64 = fs_1.default.readFileSync(logoPath, { encoding: 'base64' });
        const logoDataUrl = `data:image/png;base64,${logoBase64}`;
        return logoDataUrl;
    }
    catch (error) {
        logger_1.logger.error('Error converting image to base64', { imagePath, error: error.message });
        throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
};
exports.getImageBase64 = getImageBase64;
// Get default header images as base64
const getDefaultHeaderImages = () => {
    return {
        logo: (0, exports.getImageBase64)('public/assets/PNG/Logo horizontal.png'),
        institucionImage: (0, exports.getImageBase64)('public/assets/PNG/Institucion.png'),
        evaluacionImage: (0, exports.getImageBase64)('public/assets/PNG/Evaluacion.png'),
        municipioImage: (0, exports.getImageBase64)('public/assets/PNG/Municipio.png'),
        fechaImage: (0, exports.getImageBase64)('public/assets/PNG/Fecha.png'),
        portadaImage: (0, exports.getImageBase64)('public/assets/PNG/Portada.png')
    };
};
exports.getDefaultHeaderImages = getDefaultHeaderImages;
// New endpoint: Process simulation data
exports.processSimulationData = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const simulationData = req.body;
    const sessionId = req.headers['x-session-id'] || `session_${Date.now()}`;
    // Emit initial progress
    websocketService_1.websocketService.emitProgress({
        sessionId,
        stage: 'initializing',
        progress: 0,
        message: 'Iniciando procesamiento de datos de simulación',
        timestamp: new Date()
    });
    // Generar datos base con funciones genéricas reutilizables
    websocketService_1.websocketService.emitProgress({
        sessionId,
        stage: 'generating_base_data',
        progress: 5,
        message: 'Generando datos base y configuración inicial',
        timestamp: new Date()
    });
    const images = (0, exports.getDefaultHeaderImages)();
    const baseHeaderInfo = (0, pageGenerators_1.generarBaseHeaderInfo)(simulationData, images);
    // Página 1: Portada (usando función genérica)
    websocketService_1.websocketService.emitProgress({
        sessionId,
        stage: 'generating_cover',
        progress: 10,
        message: 'Generando página de portada',
        timestamp: new Date()
    });
    const portadaPage = (0, pageGenerators_1.generarPaginaPortada)(simulationData, images);
    let allPages = [];
    if (simulationData.tipe_inform.trim().includes("udea")) {
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'processing_udea',
            progress: 15,
            message: 'Procesando datos para reporte UDEA',
            timestamp: new Date()
        });
        /*
        - la pagina principal es la de portada.
        - diagrama comparativo de puntajes tiene diagrama de barra horizontal ( no se ha creado)
        - distribución de estudiantes por competencias usa el diagrama por barra vertical "bar_chart_with_title"
          este se saca con el cálculo de porcentaje por competencia, las reglas en los labels son:
          I: 0-35%, II: 36-75%, III: 76-100%
    
        - la siguiente pagina es por desempeño de área y se hace con el diagrama "score_distribution" en horizontal se
          hace el cálculo por cada área: Insuficiente(0-35%), Mínimo(36-50%), Satisfactorio(51-65%), Avanzado(66-100%)
        - En este se mostrará el índice de respuesta por prueba y se usará la tabla "tabla_dificultad_analisis" de cada pregunta
    
        - La siguiente pagina se hara el calculo de las preguntas por competencias y se analizara  o se pintara la pregunta correcta
          en su respectiva casilla el la columna id se pintara de verde naranja o rojo dependiendo del resultado estos son los valores de
          indice de dificultad:
    
          • Bajo (verde) entre: 0.0 y 30.9
          • Medio (naranjado) entre: 31.0 y 60.9
          • Alto (rojo) entre: 61.1 y 100
        
          y en la columna donde se ubica cada letra del abecedario se pintara de un coloror verda la pregunta correcta
          como seve en la imagen  usa "tabla-dificultad-analisis"
          para saber cuantas columnas crear para el abecedario se puede consultar en la variable simulationData.detailQuestion
          este trae la información necesaria para construir la tabla. y viene un listado  de {
            "id": "685175ed6adaaca08941b64b",
            "cod": "ASI-T-1",
            "componente": "Semántico",
            "competencia": "Literal",
            "periodo": "N/A",
            "id_recurso": "685175646adaaca08941b63a",
            "nameUser": "Myriam",
            "eje_tematico": "Connotación ",
            "grado": "Preuniversitario UdeA",
            "programa": "Preuniversitario UdeA",
            "area": "Competencia Lectora",
            "status": false,
            "id_material_refuerzo": "685175e86adaaca08941b649",
            "asignatura": "Competencia lectora",
            "tipo": null,
            "tipo_platform": "Examen",
            "created": "2025-06-17 09:04:29.858",
            "cant_respuesta": "4",
            "pregunta": "685175786adaaca08941b63d",
            "pregunta_correcta": "685175866adaaca08941b63f",
            "question_depend_others": "",
            "respuestas": [
              "685175866adaaca08941b63f",
              "685175ad6adaaca08941b647",
              "685175986adaaca08941b643",
              "685175a16adaaca08941b645"
            ]
          }
    
        */
        /*
          PÁGINA 3: Distribución de estudiantes por competencias
          Clasificación basada en PORCENTAJE de aciertos por competencia:
          
          Cálculo: (respuestas_correctas_competencia / total_preguntas_competencia) * 100
          
          Clasificación por porcentaje:
          - I: 0-35% de aciertos
          - II: 36-75% de aciertos
          - III: 76-100% de aciertos
          
          Cada competencia (Literal, Inferencial, etc.) se evalúa independientemente
        */
        // ===== PÁGINA 3: Distribución de estudiantes por competencias =====
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'processing_competencies',
            progress: 25,
            message: 'Procesando distribución de competencias',
            timestamp: new Date()
        });
        const competenciasData = (0, udeaReports_1.procesarDistribucionCompetencias)(simulationData);
        // Configuración dinámica para competencias
        const competenciasRanges = [
            { min: 0, max: 35, label: 'I' },
            { min: 36, max: 75, label: 'II' },
            { min: 76, max: 100, label: 'III' }
        ];
        const competenciasLabels = ['I', 'II', 'III'];
        const competenciasColors = ['#c55c5c', '#d88008', '#58a55c'];
        const { barChartData, barChartDataGroupedByArea } = (0, udeaReports_1.calcularEstadisticasCompetenciasDynamic)(competenciasData, competenciasRanges, competenciasLabels, competenciasColors);
        // console.log('UDEA - Página 3 - Distribución por Competencias:');
        // console.log(JSON.stringify(barChartData, null, 2));
        // return res.json({ barChartDataGroupedByArea });
        // ===== PÁGINA 4: Desempeño por área (score_distribution horizontal) =====
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'processing_areas',
            progress: 35,
            message: 'Procesando desempeño por área',
            timestamp: new Date()
        });
        const areaData = (0, udeaReports_1.procesarDesempenoPorArea)(simulationData);
        // const { areaStats, scoreDistributionData } = calcularEstadisticasArea(areaData);
        // console.log('UDEA - Página 4 - Desempeño por Área:');
        // console.log(JSON.stringify(scoreDistributionData, null, 2));
        // Configuración dinámica para áreas
        const areasRanges = [
            { min: 0, max: 35, label: 'Insuficiente' },
            { min: 36, max: 50, label: 'Mínimo' },
            { min: 51, max: 65, label: 'Satisfactorio' },
            { min: 66, max: 100, label: 'Avanzado' }
        ];
        const areasColors = ['#c55c5c', '#d88008', '#58a55c', '#4c8631'];
        const { scoreDistributionData } = (0, udeaReports_1.calcularEstadisticasAreaDynamic)(areaData, areasRanges, areasColors);
        // ===== PÁGINA 6: Tabla con puntajes de estudiantes (necesario para calcular índice de dificultad) =====
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'processing_students',
            progress: 45,
            message: 'Procesando tabla de estudiantes',
            timestamp: new Date()
        });
        const tablaEstudiantesData = (0, udeaReports_1.procesarTablaEstudiantes)(simulationData);
        // ===== PÁGINA 5: Tabla de análisis de dificultad =====
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'processing_difficulty',
            progress: 55,
            message: 'Procesando análisis de dificultad',
            timestamp: new Date()
        });
        const tablaDificultadData = (0, udeaReports_1.procesarTablaDificultadAnalisis)(simulationData);
        const tablaAnalisisData = (0, udeaReports_1.generarDatosTablaDificultad)(tablaDificultadData, undefined, tablaEstudiantesData.data.indiceDificultadPorCompetencia);
        // Debug: Check the difficulty index calculation
        // console.log('DEBUG - Difficulty indices per competency:', tablaEstudiantesData.data.indiceDificultadPorCompetencia);
        // console.log('DEBUG - Table analysis data for each area:');
        // tablaAnalisisData.forEach((tabla, index) => {
        //   console.log(`Area ${index + 1} (${tabla.data.subject}):`, tabla.data.indiceDificultadArea);
        // });
        // return res.json({tablaAnalisisData});
        // console.log('UDEA - Página 5 - Tabla Análisis de Dificultad:');
        // console.log(JSON.stringify(tablaDificultadData, null, 2));
        // console.log(JSON.stringify(tablaAnalisisData, null, 2));
        /*
         La siguiente pagina se va a encargar de mostrar el listado de estudiantes donde se mostraran todas las competencias
         en sus respectivas columnas.
    
         PROCESO DE GENERACIÓN DE DATOS:
    
         1. EXTRACCIÓN DE COMPETENCIAS:
            - Se recorren todos los estudiantes y sus materias
            - Se extraen todas las competencias únicas de simulationData.students[].examenes_asignados[].materias[].competencies[]
            - Se ordena alfabéticamente para consistencia
    
         2. PROCESAMIENTO POR ESTUDIANTE:
            - Puntaje: se obtiene de examenes_asignados[].score
            - Posición: se obtiene de examenes_asignados[].position
            - Grupo: se obtiene de student.course_id
            - Competencias: porcentaje de cada competencia desde materias[].competencies[].skills[0].porcentaje
    
         3. CATEGORIZACIÓN:
            - Se clasifica cada estudiante según su puntaje total:
            - Insuficiente (I): 0-35%
            - Mínimo (M): 36-50%
            - Satisfactorio (S): 51-65%
            - Avanzado (A): 66-100%
    
         4. CÁLCULOS ESTADÍSTICOS:
            - Promedio General: (suma de todos los puntajes) / (número de estudiantes)
            - Desviación Estándar: √(Σ(xi - μ)² / N)
              donde xi = puntaje individual, μ = promedio, N = número de estudiantes
            
            Proceso:
            a) Se suman todos los puntajes para calcular el promedio
            b) Se calcula la varianza: suma de (puntaje - promedio)² dividido por N
            c) La desviación estándar es la raíz cuadrada de la varianza
    
         5. ORDENAMIENTO Y POSICIONES:
            - Los estudiantes se ordenan por puntaje de mayor a menor
            - Se actualizan las posiciones después del ordenamiento
            - puestoGrado y puestoGrupo se asignan basado en esta clasificación
    
         Se usara tabla_con_puntaje.ejs
        */
        // console.log('UDEA - Página 6 - Tabla de Estudiantes:');
        // console.log(JSON.stringify(tablaEstudiantesData, null, 2));
        // ===== GENERAR PÁGINAS INDIVIDUALES =====
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'generating_pages',
            progress: 65,
            message: 'Generando páginas individuales',
            timestamp: new Date()
        });
        // Página 3: Distribución por competencias (horizontal - múltiples gráficos en una página)
        let competenciasPage = [];
        for (const chars of barChartDataGroupedByArea) {
            const competenciaPage = {
                layout: "horizontal",
                chartTitle: "Distribución de estudiantes por competencias consolidadas por prueba",
                subTitle: chars.charts[0].area,
                headerInfo: baseHeaderInfo,
                components: chars.charts
            };
            competenciasPage.push(competenciaPage);
        }
        // Página 4: Desempeño por área (horizontal)
        const areasPages = [];
        for (const chart of scoreDistributionData.data.subjects) {
            const areasPage = {
                layout: "horizontal",
                chartTitle: "Desempeño por Área",
                headerInfo: baseHeaderInfo,
                components: [{
                        type: "score_distribution_horizontal", data: {
                            "subjects": [chart],
                            "needGuide": true
                        }
                    }]
            };
            areasPages.push(areasPage);
        }
        // Página 5: Tabla de análisis de dificultad (vertical)
        let analisisPages = [];
        for (const tabla of tablaAnalisisData) {
            const analisisPage = {
                layout: "vertical",
                chartTitle: "Análisis de Dificultad",
                headerInfo: baseHeaderInfo,
                components: [tabla]
            };
            analisisPages.push(analisisPage);
        }
        // Página 6: Tabla de estudiantes (horizontal)
        const estudiantesPage = {
            layout: "horizontal",
            chartTitle: "Tabla de Estudiantes",
            headerInfo: baseHeaderInfo,
            components: [tablaEstudiantesData]
        };
        // Generar PDFs individuales
        allPages = [
            portadaPage,
            ...competenciasPage,
            ...areasPages,
            ...analisisPages,
            estudiantesPage
        ];
    }
    else if (simulationData.tipe_inform.trim().includes("unal")) {
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'processing_unal',
            progress: 15,
            message: 'Procesando datos para reporte UNAL',
            timestamp: new Date()
        });
        // ===== PÁGINA 2: Competencias Chart UNAL (usando función genérica) =====
        const competenciasPageUnal = (0, pageGenerators_1.generarPaginaCompetenciasChart)(simulationData, baseHeaderInfo, {
            chartId: "unal_competencias",
            chartTitle: "Análisis de Competencias UNAL",
            processorFunction: udeaReports_1.procesarCompetenciasUNAL
        });
        // Procesar datos para response metadata (opcional)
        const competenciasUnal = (0, udeaReports_1.procesarCompetenciasUNAL)(simulationData);
        // graficos por area
        const areaData = (0, udeaReports_1.procesarDesempenoPorArea)(simulationData);
        // Configuración dinámica para áreas
        /*
        • 1 [>100 a 350]
    • 2 [> 350 a 500]
    • 3 [>500 a 700]
    • 4 [>700 a 1000]
        
        */
        const areasRanges = [
            { min: 0, max: 350, label: '1' },
            { min: 351, max: 500, label: '2' },
            { min: 501, max: 700, label: '3' },
            { min: 701, max: 1000, label: '4' }
        ];
        const areasColors = ['#c55c5c', '#d88008', '#58a55c', '#4c8631'];
        const { scoreDistributionData } = (0, udeaReports_1.calcularEstadisticasAreaDynamic)(areaData, areasRanges, areasColors);
        const areasPages = [];
        for (const chart of scoreDistributionData.data.subjects) {
            const areasPage = {
                layout: "horizontal",
                chartTitle: "Desempeño por Área",
                headerInfo: baseHeaderInfo,
                components: [{
                        type: "score_distribution_horizontal",
                        data: {
                            "subjects": [chart],
                            "needGuide": false
                        }
                    }]
            };
            areasPages.push(areasPage);
        }
        const tablaEstudiantesData = (0, udeaReports_1.procesarTablaEstudiantes)(simulationData);
        const tablaDificultadData = (0, udeaReports_1.procesarTablaDificultadAnalisis)(simulationData);
        const tablaAnalisisData = (0, udeaReports_1.generarDatosTablaDificultad)(tablaDificultadData, undefined, tablaEstudiantesData.data.indiceDificultadPorCompetencia);
        // Página 5: Tabla de análisis de dificultad (vertical)
        let analisisPages = [];
        for (const tabla of tablaAnalisisData) {
            const analisisPage = {
                layout: "vertical",
                chartTitle: "Análisis de Dificultad",
                headerInfo: baseHeaderInfo,
                components: [tabla]
            };
            analisisPages.push(analisisPage);
        }
        // Página 6: Tabla de estudiantes (horizontal)
        const estudiantesPage = {
            layout: "horizontal",
            chartTitle: "Tabla de Estudiantes",
            headerInfo: baseHeaderInfo,
            components: [tablaEstudiantesData]
        };
        // Generar PDFs individuales para UNAL
        allPages = [
            portadaPage,
            competenciasPageUnal,
            ...areasPages,
            ...analisisPages,
            estudiantesPage
        ];
    }
    else {
        // ===== REPORTE GENERAL CON COMPARATIVO DE COMPETENCIAS =====
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'processing_general',
            progress: 15,
            message: 'Procesando reporte general con comparativos',
            timestamp: new Date()
        });
        const comparativoData = (0, udeaReports_1.procesarCompetenciasComparativo)(simulationData);
        const competenciasUnal = (0, udeaReports_1.procesarCompetenciasUNAL)(simulationData);
        // return res.json({ comparativoData,competenciasUnal });
        const comparativePage = {
            layout: "horizontal",
            chartTitle: "Comparativo de Puntajes por Materia",
            headerInfo: baseHeaderInfo,
            components: [{
                    type: "comparativo_puntaje",
                    data: comparativoData
                }]
        };
        const competenciasData = (0, udeaReports_1.procesarDistribucionCompetencias)(simulationData);
        // Configuración dinámica para competencias
        const competenciasRanges = [
            { min: 0, max: 35, label: '1' },
            { min: 36, max: 50, label: '2' },
            { min: 51, max: 65, label: '3' },
            { min: 66, max: 100, label: '4' },
        ];
        const competenciasLabels = ['1', '2', '3', '4'];
        const competenciasColors = ['#c55c5c', '#d88008', '#f4d03f', '#58a55c'];
        const { barChartData, barChartDataGroupedByArea } = (0, udeaReports_1.calcularEstadisticasCompetenciasDynamic)(competenciasData, competenciasRanges, competenciasLabels, competenciasColors);
        let competenciasPage = [];
        // return res.json({ barChartDataGroupedByArea });
        for (const chars of barChartDataGroupedByArea) {
            const competenciaPage = {
                layout: "horizontal",
                chartTitle: "Distribución de estudiantes por competencias consolidadas por prueba",
                subTitle: chars.area,
                headerInfo: baseHeaderInfo,
                components: chars.charts
            };
            competenciasPage.push(competenciaPage);
        }
        //-------------------------------
        const areaData = (0, udeaReports_1.procesarDesempenoPorArea)(simulationData);
        // Configuración dinámica para áreas
        const areasRanges = [
            { min: 0, max: 35, label: '1' },
            { min: 36, max: 50, label: '2' },
            { min: 51, max: 65, label: '3' },
            { min: 66, max: 100, label: '4' }
        ];
        const areasColors = competenciasColors;
        const { scoreDistributionData } = (0, udeaReports_1.calcularEstadisticasAreaDynamic)(areaData, areasRanges, areasColors, "score_distribution");
        scoreDistributionData.type = "score_distribution";
        // Página 4: Desempeño por área (horizontal)
        const areasPages = [];
        const subjects = scoreDistributionData.data.subjects;
        const CHARTS_PER_PAGE = 4;
        // Dividir subjects en grupos de máximo 4
        for (let i = 0; i < subjects.length; i += CHARTS_PER_PAGE) {
            const subjectsChunk = subjects.slice(i, i + CHARTS_PER_PAGE);
            const pageNumber = Math.floor(i / CHARTS_PER_PAGE) + 1;
            const totalPages = Math.ceil(subjects.length / CHARTS_PER_PAGE);
            // Generar título con información de paginación si hay múltiples páginas
            const chartTitle = subjects.length > CHARTS_PER_PAGE
                ? `Desempeño por Área (Página ${pageNumber} de ${totalPages})`
                : "Desempeño por Área";
            const areasPage = {
                layout: "vertical",
                chartTitle: chartTitle,
                headerInfo: baseHeaderInfo,
                components: [{
                        type: "score_distribution",
                        data: {
                            "subjects": subjectsChunk,
                        }
                    }]
            };
            areasPages.push(areasPage);
        }
        const nivel = [
            {
                label: "BAJO",
                color: "#4c8631",
                min: 0,
                max: 35.9
            },
            {
                label: "MEDIO",
                color: "#d88008",
                min: 36.0,
                max: 70.9
            },
            {
                label: "ALTO",
                color: "#bd5785",
                min: 71.0,
                max: 100
            }
        ];
        const tablaEstudiantesData = (0, udeaReports_1.procesarTablaEstudiantes)(simulationData);
        const tablaDificultadData = (0, udeaReports_1.procesarTablaDificultadAnalisis)(simulationData);
        const tablaAnalisisData = (0, udeaReports_1.generarDatosTablaDificultad)(tablaDificultadData, nivel, tablaEstudiantesData.data.indiceDificultadPorCompetencia);
        // Página 5: Tabla de análisis de dificultad (vertical)
        let analisisPages = [];
        for (const tabla of tablaAnalisisData) {
            const analisisPage = {
                layout: "vertical",
                chartTitle: "Análisis de Dificultad",
                headerInfo: baseHeaderInfo,
                components: [tabla]
            };
            analisisPages.push(analisisPage);
        }
        // ===== DISTRIBUCIÓN POR ASIGNATURA =====
        const asignaturasRanges = [
            { min: 0, max: 35, label: '1' },
            { min: 36, max: 50, label: '2' },
            { min: 51, max: 65, label: '3' },
            { min: 66, max: 100, label: '4' }
        ];
        const asignaturasChartsData = (0, udeaReports_1.procesarPromediosDynamic)(simulationData, asignaturasRanges);
        const asignatures = asignaturasChartsData.map(item => item.data);
        const asignaturasPages = [];
        // Dividir asignaturas en grupos de máximo 4
        for (let i = 0; i < asignatures.length; i += CHARTS_PER_PAGE) {
            const asignaturasChunk = asignatures.slice(i, i + CHARTS_PER_PAGE);
            const pageNumber = Math.floor(i / CHARTS_PER_PAGE) + 1;
            const totalPages = Math.ceil(asignatures.length / CHARTS_PER_PAGE);
            // Generar título con información de paginación si hay múltiples páginas
            const chartTitle = asignatures.length > CHARTS_PER_PAGE
                ? `Distribución de Estudiantes por Asignatura (Página ${pageNumber} de ${totalPages})`
                : "Distribución de Estudiantes por Asignatura";
            const component = {
                type: "bar_chart_with_title",
                data: {
                    subjects: asignaturasChunk,
                }
            };
            const asignaturasPage = {
                layout: "vertical",
                chartTitle: chartTitle,
                headerInfo: baseHeaderInfo,
                components: [component]
            };
            asignaturasPages.push(asignaturasPage);
        }
        const ejeTematicoChartsData = (0, udeaReports_1.procesarPromediosDynamic)(simulationData, asignaturasRanges, "eje_tematico");
        const ejeTematicos = ejeTematicoChartsData.map(item => item.data);
        const ejeTematicosPages = [];
        // Dividir asignaturas en grupos de máximo 4
        for (let i = 0; i < ejeTematicos.length; i += CHARTS_PER_PAGE) {
            const ejeTematicosChunk = ejeTematicos.slice(i, i + CHARTS_PER_PAGE);
            const pageNumber = Math.floor(i / CHARTS_PER_PAGE) + 1;
            const totalPages = Math.ceil(ejeTematicos.length / CHARTS_PER_PAGE);
            // Generar título con información de paginación si hay múltiples páginas
            const chartTitle = ejeTematicos.length > CHARTS_PER_PAGE
                ? `Distribución de estudiantes por temas ó ejes tematicos por prueba (Página ${pageNumber} de ${totalPages})`
                : "Distribución de estudiantes por temas ó ejes tematicos por prueba";
            const component = {
                type: "bar_chart_with_title",
                data: {
                    subjects: ejeTematicosChunk,
                }
            };
            const ejeTematicosPage = {
                layout: "vertical",
                chartTitle: chartTitle,
                headerInfo: baseHeaderInfo,
                components: [component]
            };
            ejeTematicosPages.push(ejeTematicosPage);
        }
        // Página 6: Tabla de estudiantes (horizontal)
        const listadoEstudiantesCompetenciasPage = {
            layout: "horizontal",
            chartTitle: "Listado general por competencias",
            headerInfo: baseHeaderInfo,
            components: [tablaEstudiantesData]
        };
        // Página 7: Tabla de estudiantes por áreas (horizontal)
        const tablaEstudiantesAreasData = (0, udeaReports_1.procesarTablaEstudiantesPorArea)(simulationData);
        const listadoEstudiantesAreasPage = {
            layout: "horizontal",
            chartTitle: "Listado general por pruebas",
            headerInfo: baseHeaderInfo,
            components: [tablaEstudiantesAreasData]
        };
        allPages = [
            portadaPage,
            comparativePage,
            ...competenciasPage,
            ...areasPages,
            ...asignaturasPages,
            ...analisisPages,
            listadoEstudiantesCompetenciasPage,
            listadoEstudiantesAreasPage,
            ...ejeTematicosPages
        ];
    }
    // Procesar PDFs secuencialmente para evitar timeouts
    websocketService_1.websocketService.emitProgress({
        sessionId,
        stage: 'generating_pdfs',
        progress: 70,
        message: 'Iniciando generación de PDFs individuales',
        timestamp: new Date(),
        data: { totalPages: allPages.length }
    });
    const individualPdfFiles = [];
    for (let index = 0; index < allPages.length; index++) {
        const pageData = allPages[index];
        // Emit progress for each PDF
        const progressPercentage = 70 + (index / allPages.length) * 20; // 70% to 90%
        websocketService_1.websocketService.emitProgress({
            sessionId,
            stage: 'generating_pdf_page',
            progress: Math.round(progressPercentage),
            message: `Generando PDF ${index + 1} de ${allPages.length}`,
            timestamp: new Date(),
            data: {
                currentPage: index + 1,
                totalPages: allPages.length,
                layout: pageData.layout
            }
        });
        try {
            // Determinar orientación basada en el layout de la página
            const orientation = pageData.layout === "horizontal" ? "landscape" : "portrait";
            const fileName = await pdfService_1.pdfService.savePdf(pageData, {
                format: "A4",
                orientation: orientation,
                printBackground: true,
                scale: 0.75
            });
            individualPdfFiles.push(fileName);
        }
        catch (error) {
            websocketService_1.websocketService.emitError(sessionId, `Error generando PDF página ${index + 1}`, {
                error: error instanceof Error ? error.message : String(error),
                pageIndex: index
            });
            logger_1.logger.error(`Error generating PDF for page ${index + 1}`, { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    // Crear PDF unificado
    websocketService_1.websocketService.emitProgress({
        sessionId,
        stage: 'merging_pdfs',
        progress: 90,
        message: 'Fusionando PDFs individuales en reporte final',
        timestamp: new Date(),
        data: { totalFiles: individualPdfFiles.length }
    });
    const mergedFileName = `reporte_completo_${simulationData.campus.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    await pdfService_1.pdfService.mergePdfs(individualPdfFiles, mergedFileName);
    // Eliminar PDFs individuales
    websocketService_1.websocketService.emitProgress({
        sessionId,
        stage: 'cleaning_up',
        progress: 95,
        message: 'Limpiando archivos temporales',
        timestamp: new Date()
    });
    await pdfService_1.pdfService.deletePdfs(individualPdfFiles);
    const finalPdfUrl = `${req.protocol}://${req.get('host')}/api/reports/pdfs/${mergedFileName}`;
    // Emit completion
    websocketService_1.websocketService.emitComplete(sessionId, {
        fileName: mergedFileName,
        url: finalPdfUrl,
        totalPages: allPages.length,
        reportType: simulationData.tipe_inform,
        institution: simulationData.campus
    });
    websocketService_1.websocketService.emitProgress({
        sessionId,
        stage: 'completed',
        progress: 100,
        message: 'Reporte generado exitosamente',
        timestamp: new Date(),
        data: { fileName: mergedFileName, url: finalPdfUrl }
    });
    res.json({
        success: true,
        data: {
            message: "Reporte UDEA generado exitosamente",
            totalPages: allPages.length,
            reportType: "UDEA",
            metadata: {
                institution: simulationData.campus,
                course: simulationData.course,
                generatedAt: new Date().toISOString()
            },
            pdf: {
                fileName: mergedFileName,
                url: finalPdfUrl,
                downloadUrl: `${finalPdfUrl}?download=true`
            },
            rawData: {
                portada: portadaPage
            }
        }
    });
});
