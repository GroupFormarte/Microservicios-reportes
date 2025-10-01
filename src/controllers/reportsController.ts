import { Request, Response } from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { RenderService } from '../services/renderService';
import { pdfService } from '../services/pdfService';
import { websocketService } from '../services/websocketService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  ApiResponse,
  PageRequest,
  BarChartConfig,
  TableData,
  ComparativeData,
  LayoutData,
  PdfRequest,
  ComponentRequest
} from '../types/index';
import {
  procesarDistribucionCompetencias,
  calcularEstadisticasCompetenciasDynamic,
  procesarDesempenoPorArea,
  calcularEstadisticasAreaDynamic,
  procesarTablaDificultadAnalisis,
  generarDatosTablaDificultad,
  procesarTablaEstudiantes,
  procesarTablaEstudiantesPorArea,
  procesarCompetenciasUNAL,
  procesarCompetenciasComparativo,
  procesarPromediosDynamic
} from '../utils/udeaReports';

// Funciones genéricas reutilizables
import {
  generarBaseHeaderInfo,
  generarPaginaPortada,
  generarPaginaCompetenciasChart
} from '../utils/pageGenerators';

const renderService = new RenderService();

// Main endpoint: Render complete page
export const renderPage = asyncHandler(async (req: Request, res: Response) => {
  const data: PageRequest = req.body;

  logger.info('Rendering page', {
    layout: data.layout,
    componentCount: data.components.length,
    institucion: data.headerInfo.institucion
  });

  const result = await renderService.renderPage(data);

  const response: ApiResponse = {
    success: true,
    data: {
      html: result.html,
      metadata: result.metadata
    }
  };

  res.json(response);
});

// Legacy endpoints for backwards compatibility
export const renderBarChart = asyncHandler(async (req: Request, res: Response) => {
  const data: BarChartConfig = req.body;
  const result = await renderService.renderBarChart(data);
  res.json({ success: true, data: result });
});

export const renderTable = asyncHandler(async (req: Request, res: Response) => {
  const data: { tableData: TableData } = req.body;
  const result = await renderService.renderTable(data);
  res.json({ success: true, data: result });
});

export const renderComparative = asyncHandler(async (req: Request, res: Response) => {
  const data: ComparativeData = req.body;
  const result = await renderService.renderComparative(data);
  res.json({ success: true, data: result });
});

export const renderLayout = asyncHandler(async (req: Request, res: Response) => {
  const data: LayoutData = req.body;
  const result = await renderService.renderLayout(data);
  res.json({ success: true, data: result });
});

export const renderMultipleCharts = asyncHandler(async (req: Request, res: Response) => {
  const charts: BarChartConfig[] = req.body.charts || [];
  const result = await renderService.renderMultipleCharts(charts);
  res.json({ success: true, data: result });
});

export const renderVerticalExample = asyncHandler(async (req: Request, res: Response) => {
  const exampleData: any = {
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
export const previewVertical = asyncHandler(async (req: Request, res: Response) => {
  const exampleData: any = {
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

export const previewHorizontal = asyncHandler(async (req: Request, res: Response) => {
  const exampleData: any = {
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
export const generatePdf = asyncHandler(async (req: Request, res: Response) => {
  const data: PdfRequest = req.body;

  logger.info("Generating and saving PDF", {
    layout: data.layout,
    componentCount: data.components.length,
    institution: data.headerInfo.institucion,
    options: data.options
  });

  const startTime = Date.now();
  const fileName = await pdfService.savePdf(data, data.options);
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

  logger.info("PDF generated and saved", {
    fileName,
    url: pdfUrl,
    renderTime
  });
});

export const generatePdfPreview = asyncHandler(async (req: Request, res: Response) => {
  // Example data for PDF preview

  const { logo, institucionImage, evaluacionImage, municipioImage, fechaImage } = getDefaultHeaderImages();

  const exampleData: PageRequest = {
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

  const fileName = await pdfService.savePdf(exampleData, {
    format: "A4",
    orientation: "portrait",
    printBackground: true,
    scale: 0.75
  });

  // Return JSON response with PDF URL
  const pdfUrl = `${req.protocol}://${req.get('host')}/api/reports/pdfs/${fileName}`;
  const downloadUrl = `${pdfUrl}?download=true`;

  // Send Flutter-compatible notification
  websocketService.notifyPdfReady(
    downloadUrl,
    'Reporte de simulación generado exitosamente'
  );

  res.json({
    success: true,
    data: {
      fileName,
      url: pdfUrl,
      downloadUrl: downloadUrl,
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
export const getImageBase64 = (imagePath: string): string => {
  try {
    const logoPath = path.join(process.cwd(), imagePath);
    const logoBase64 = fsSync.readFileSync(logoPath, { encoding: 'base64' });
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;
    return logoDataUrl;
  } catch (error) {
    logger.error('Error converting image to base64', { imagePath, error: (error as Error).message });
    throw new Error(`Failed to convert image to base64: ${(error as Error).message}`);
  }
};

// Get default header images as base64
export const getDefaultHeaderImages = () => {
  return {
    logo: getImageBase64('public/assets/PNG/Logo horizontal.png'),
    institucionImage: getImageBase64('public/assets/PNG/Institucion.png'),
    evaluacionImage: getImageBase64('public/assets/PNG/Evaluacion.png'),
    municipioImage: getImageBase64('public/assets/PNG/Municipio.png'),
    fechaImage: getImageBase64('public/assets/PNG/Fecha.png'),
    portadaImage: getImageBase64('public/assets/PNG/Portada.png')
  };
};





// New endpoint: Process simulation data
export const processSimulationData = asyncHandler(async (req: Request, res: Response) => {
  const simulationData = req.body;
  const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;

  console.log('=== SIMULATION DATA RECEIVED ===');
  console.log(simulationData.tipe_inform);
  console.log('=== END SIMULATION DATA ===');
  console.log('Session ID:', sessionId);

  // Emit initial progress
  websocketService.emitProgress({
    sessionId,
    stage: 'initializing',
    progress: 0,
    message: 'Iniciando procesamiento del reporte',
    timestamp: new Date()
  });

  const images = getDefaultHeaderImages();
  const baseHeaderInfo = generarBaseHeaderInfo(simulationData, images);

  websocketService.emitProgress({
    sessionId,
    stage: 'generating_cover',
    progress: 10,
    message: 'Generando página de portada',
    timestamp: new Date()
  });

  const portadaPage = generarPaginaPortada(simulationData, images);

  let allPages: any[] = [];
  if (simulationData.tipe_inform.trim().includes("udea")) {

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

    const competenciasData = procesarDistribucionCompetencias(simulationData);

    // Configuración dinámica para competencias
    const competenciasRanges = [
      { min: 0, max: 35, label: 'I' },
      { min: 36, max: 75, label: 'II' },
      { min: 76, max: 100, label: 'III' }
    ];
    const competenciasLabels = ['I', 'II', 'III'];
    const competenciasColors = ['#c55c5c', '#d88008', '#58a55c'];

    const { barChartData, barChartDataGroupedByArea } = calcularEstadisticasCompetenciasDynamic(
      competenciasData,
      competenciasRanges,
      competenciasLabels,
      competenciasColors
    );

    // console.log('UDEA - Página 3 - Distribución por Competencias:');
    // console.log(JSON.stringify(barChartData, null, 2));

    // return res.json({ barChartDataGroupedByArea });


    const areaData = procesarDesempenoPorArea(simulationData);
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

    const { scoreDistributionData } =
      calcularEstadisticasAreaDynamic(areaData, areasRanges, areasColors);




    const tablaEstudiantesDataArray = procesarTablaEstudiantes(simulationData);

    let indiceDificultadPorCompetencia: any[] = [];
    for (const inD of tablaEstudiantesDataArray) {
      indiceDificultadPorCompetencia.push(inD)
    }

    const tablaDificultadData = procesarTablaDificultadAnalisis(simulationData);

    const tablaAnalisisData = generarDatosTablaDificultad(
      tablaDificultadData,
      undefined,
      indiceDificultadPorCompetencia
    );


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

    // Página 3: Distribución por competencias (horizontal - múltiples gráficos en una página)
    let competenciasPage: PageRequest[] = []

    for (const chars of barChartDataGroupedByArea) {
      const competenciaPage: PageRequest = {
        layout: "horizontal",
        chartTitle: "Distribución de estudiantes por competencias consolidadas por prueba",
        subTitle: chars.charts[0].area,
        headerInfo: baseHeaderInfo,
        components: chars.charts
      };

      competenciasPage.push(competenciaPage);
    }



    // Página 4: Desempeño por área (horizontal)
    const areasPages: PageRequest[] = []
    for (const chart of scoreDistributionData.data.subjects) {
      const areasPage: PageRequest = {
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
    let analisisPages: PageRequest[] = []
    for (const tabla of tablaAnalisisData) {
      const analisisPage: PageRequest = {
        layout: "vertical",
        chartTitle: "Análisis de Dificultad",
        headerInfo: baseHeaderInfo,
        components: [tabla]
      };
      analisisPages.push(analisisPage);
    }

    // Página 6: Tabla de estudiantes (horizontal) - Puede ser múltiples páginas
    const estudiantesPages: PageRequest[] = tablaEstudiantesDataArray.map((tablaData, index) => ({
      layout: "horizontal",
      chartTitle: tablaEstudiantesDataArray.length > 1
        ? `Tabla de Estudiantes (Página ${index + 1} de ${tablaEstudiantesDataArray.length})`
        : "Tabla de Estudiantes",
      headerInfo: baseHeaderInfo,
      components: [tablaData]
    }));

    // Generar PDFs individuales
    allPages = [
      portadaPage,
      ...competenciasPage,
      ...areasPages,
      ...analisisPages,
      ...estudiantesPages
    ];


  } else if (simulationData.tipe_inform.trim().includes("unal")) {


    // ===== PÁGINA 2: Competencias Chart UNAL (usando función genérica) =====
    const competenciasPageUnal = generarPaginaCompetenciasChart(
      simulationData,
      baseHeaderInfo,
      {
        chartId: "unal_competencias",
        chartTitle: "Análisis de Competencias UNAL",
        processorFunction: procesarCompetenciasUNAL
      }
    );

    // Procesar datos para response metadata (opcional)
    const competenciasUnal = procesarCompetenciasUNAL(simulationData);

    // graficos por area

    const areaData = procesarDesempenoPorArea(simulationData);
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


    const { scoreDistributionData } =
      calcularEstadisticasAreaDynamic(areaData, areasRanges, areasColors);


    const areasPages: PageRequest[] = []
    for (const chart of scoreDistributionData.data.subjects) {
      const areasPage: PageRequest = {
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

    const tablaEstudiantesDataArray = procesarTablaEstudiantes(simulationData);
    const tablaDificultadData = procesarTablaDificultadAnalisis(simulationData);
    let indiceDificultadPorCompetencia: any[] = [];
    for (const inD of tablaEstudiantesDataArray) {
      indiceDificultadPorCompetencia.push(inD)
    }
    const tablaAnalisisData = generarDatosTablaDificultad(
      tablaDificultadData,
      undefined,
      indiceDificultadPorCompetencia
    );
    // Página 5: Tabla de análisis de dificultad (vertical)
    let analisisPages: PageRequest[] = []
    for (const tabla of tablaAnalisisData) {
      const analisisPage: PageRequest = {
        layout: "vertical",
        chartTitle: "Análisis de Dificultad",
        headerInfo: baseHeaderInfo,
        components: [tabla]
      };
      analisisPages.push(analisisPage);
    }

    // Página 6: Tabla de estudiantes (horizontal) - Puede ser múltiples páginas
    const estudiantesPages: PageRequest[] = tablaEstudiantesDataArray.map((tablaData, index) => ({
      layout: "horizontal",
      chartTitle: tablaEstudiantesDataArray.length > 1
        ? `Tabla de Estudiantes (Página ${index + 1} de ${tablaEstudiantesDataArray.length})`
        : "Tabla de Estudiantes",
      headerInfo: baseHeaderInfo,
      components: [tablaData]
    }));

    // Generar PDFs individuales para UNAL
    allPages = [
      portadaPage,
      competenciasPageUnal,
      ...areasPages,
      ...analisisPages,
      ...estudiantesPages
    ];
  } else {


    const comparativoData = procesarCompetenciasComparativo(simulationData);
    const competenciasUnal = procesarCompetenciasUNAL(simulationData);


    // return res.json({ comparativoData,competenciasUnal });
    const comparativePage: PageRequest = {
      layout: "horizontal",
      chartTitle: "Comparativo de Puntajes por Materia",
      headerInfo: baseHeaderInfo,
      components: [{
        type: "comparativo_puntaje",
        data: comparativoData
      }]
    };

    const competenciasData = procesarDistribucionCompetencias(simulationData);

    // Configuración dinámica para competencias
    const competenciasRanges = [
      { min: 0, max: 35, label: '1' },
      { min: 36, max: 50, label: '2' },
      { min: 51, max: 65, label: '3' },
      { min: 66, max: 100, label: '4' },
    ];

    const competenciasLabels = ['1', '2', '3', '4'];

    const competenciasColors = ['#c55c5c', '#d88008', '#f4d03f', '#58a55c'];

    const { barChartData, barChartDataGroupedByArea } = calcularEstadisticasCompetenciasDynamic(
      competenciasData,
      competenciasRanges,
      competenciasLabels,
      competenciasColors
    );

    let competenciasPage: PageRequest[] = []

    // return res.json({ barChartDataGroupedByArea });
    for (const chars of barChartDataGroupedByArea) {
      const competenciaPage: PageRequest = {
        layout: "horizontal",
        chartTitle: "Distribución de estudiantes por competencias consolidadas por prueba",
        subTitle: chars.area,
        headerInfo: baseHeaderInfo,
        components: chars.charts
      };

      competenciasPage.push(competenciaPage);
    }

    //-------------------------------
    const areaData = procesarDesempenoPorArea(simulationData);

    // Configuración dinámica para áreas
    const areasRanges = [
      { min: 0, max: 35, label: '1' },
      { min: 36, max: 50, label: '2' },
      { min: 51, max: 65, label: '3' },
      { min: 66, max: 100, label: '4' }
    ];

    const areasColors = competenciasColors;

    const { scoreDistributionData } =
      calcularEstadisticasAreaDynamic(areaData, areasRanges, areasColors, "score_distribution",);

    scoreDistributionData.type = "score_distribution";
    // Página 4: Desempeño por área (horizontal)

    const areasPages: PageRequest[] = [];
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

      const areasPage: PageRequest = {
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

    const tablaEstudiantesDataArray = procesarTablaEstudiantes(simulationData);
    let indiceDificultadPorCompetencia: any[] = [];
    for (const inD of tablaEstudiantesDataArray) {
      indiceDificultadPorCompetencia.push(inD)
    }


    const tablaDificultadData = procesarTablaDificultadAnalisis(simulationData);

    const tablaAnalisisData = generarDatosTablaDificultad(
      tablaDificultadData,
      nivel,
      indiceDificultadPorCompetencia
    );

    // Página 5: Tabla de análisis de dificultad (vertical)
    let analisisPages: PageRequest[] = []
    for (const tabla of tablaAnalisisData) {
      const analisisPage: PageRequest = {
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

    const asignaturasChartsData = procesarPromediosDynamic(simulationData, asignaturasRanges);
    const asignatures = asignaturasChartsData.map(item => item.data);

    const asignaturasPages: PageRequest[] = [];


    // Dividir asignaturas en grupos de máximo 4
    for (let i = 0; i < asignatures.length; i += CHARTS_PER_PAGE) {
      const asignaturasChunk = asignatures.slice(i, i + CHARTS_PER_PAGE);
      const pageNumber = Math.floor(i / CHARTS_PER_PAGE) + 1;
      const totalPages = Math.ceil(asignatures.length / CHARTS_PER_PAGE);

      // Generar título con información de paginación si hay múltiples páginas
      const chartTitle = asignatures.length > CHARTS_PER_PAGE
        ? `Distribución de Estudiantes por Asignatura (Página ${pageNumber} de ${totalPages})`
        : "Distribución de Estudiantes por Asignatura";

      const component: ComponentRequest = {
        type: "bar_chart_with_title",
        data: {
          subjects: asignaturasChunk,
        }
      }

      const asignaturasPage: PageRequest = {
        layout: "vertical",
        chartTitle: chartTitle,
        headerInfo: baseHeaderInfo,
        components: [component]
      };
      asignaturasPages.push(asignaturasPage);
    }

    const ejeTematicoChartsData = procesarPromediosDynamic(simulationData, asignaturasRanges, "eje_tematico");
    const ejeTematicos = ejeTematicoChartsData.map(item => item.data);

    const ejeTematicosPages: PageRequest[] = [];


    // Dividir asignaturas en grupos de máximo 4
    for (let i = 0; i < ejeTematicos.length; i += CHARTS_PER_PAGE) {
      const ejeTematicosChunk = ejeTematicos.slice(i, i + CHARTS_PER_PAGE);
      const pageNumber = Math.floor(i / CHARTS_PER_PAGE) + 1;
      const totalPages = Math.ceil(ejeTematicos.length / CHARTS_PER_PAGE);

      // Generar título con información de paginación si hay múltiples páginas
      const chartTitle = ejeTematicos.length > CHARTS_PER_PAGE
        ? `Distribución de estudiantes por temas ó ejes tematicos por prueba (Página ${pageNumber} de ${totalPages})`
        : "Distribución de estudiantes por temas ó ejes tematicos por prueba";

      const component: ComponentRequest = {
        type: "bar_chart_with_title",
        data: {
          subjects: ejeTematicosChunk,
        }
      }

      const ejeTematicosPage: PageRequest = {
        layout: "vertical",
        chartTitle: chartTitle,
        headerInfo: baseHeaderInfo,
        components: [component]
      };
      ejeTematicosPages.push(ejeTematicosPage);
    }

    // Página 6: Tabla de estudiantes por competencias (horizontal) - Puede ser múltiples páginas
    const listadoEstudiantesCompetenciasPages: PageRequest[] = tablaEstudiantesDataArray.map((tablaData, index) => ({
      layout: "horizontal",
      chartTitle: tablaEstudiantesDataArray.length > 1
        ? `Listado general por competencias (Página ${index + 1} de ${tablaEstudiantesDataArray.length})`
        : "Listado general por competencias",
      headerInfo: baseHeaderInfo,
      components: [tablaData]
    }));

    // Página 7: Tabla de estudiantes por áreas (horizontal) - Puede ser múltiples páginas
    const tablaEstudiantesAreasDataArray = procesarTablaEstudiantesPorArea(simulationData);
    const listadoEstudiantesAreasPages: PageRequest[] = tablaEstudiantesAreasDataArray.map((tablaData, index) => ({
      layout: "horizontal",
      chartTitle: tablaEstudiantesAreasDataArray.length > 1
        ? `Listado general por pruebas (Página ${index + 1} de ${tablaEstudiantesAreasDataArray.length})`
        : "Listado general por pruebas",
      headerInfo: baseHeaderInfo,
      components: [tablaData]
    }));

    allPages = [
      portadaPage,
      comparativePage,
      ...competenciasPage,
      ...areasPages,
      ...asignaturasPages,
      ...analisisPages,
      ...listadoEstudiantesCompetenciasPages,
      ...listadoEstudiantesAreasPages,
      ...ejeTematicosPages
    ];
  }






  websocketService.emitProgress({
    sessionId,
    stage: 'generating_pdfs',
    progress: 70,
    message: `Generando PDFs individuales (${allPages.length} páginas)`,
    timestamp: new Date()
  });

  const individualPdfFiles = [];
  for (let index = 0; index < allPages.length; index++) {
    const pageData = allPages[index];

    try {
      // Determinar orientación basada en el layout de la página
      const orientation = pageData.layout === "horizontal" ? "landscape" : "portrait";
      const fileName = await pdfService.savePdf(pageData, {
        format: "A4",
        orientation: orientation,
        printBackground: true,
        scale: 0.75
      });
      individualPdfFiles.push(fileName);
    } catch (error) {
      websocketService.emitError(sessionId, `Error generando PDF página ${index + 1}`, {
        error: error instanceof Error ? error.message : String(error),
        pageIndex: index
      });
      logger.error(`Error generating PDF for page ${index + 1}`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  websocketService.emitProgress({
    sessionId,
    stage: 'merging_pdfs',
    progress: 90,
    message: 'Combinando páginas en PDF final',
    timestamp: new Date()
  });

  const mergedFileName = `reporte_completo_${simulationData.campus.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
  await pdfService.mergePdfs(individualPdfFiles, mergedFileName);


  await pdfService.deletePdfs(individualPdfFiles);

  const finalPdfUrl = `${req.protocol}://${req.get('host')}/api/reports/pdfs/${mergedFileName}`;

  // Clear cache and cleanup resources after successful report generation
  try {
    renderService.clearCache();
    logger.info('Cache cleared after report completion', {
      reportType: simulationData.tipe_inform,
      institution: simulationData.campus,
      totalPages: allPages.length
    });
  } catch (cacheError) {
    // Don't fail the entire process if cache clearing fails
    logger.warn('Cache clearing failed, but report generation was successful', {
      error: (cacheError as Error).message
    });
  }

  // Emit completion
  logger.info('About to emit completion websocket notification', {
    sessionId,
    fileName: mergedFileName,
    url: finalPdfUrl
  });

  websocketService.emitProgress({
    sessionId,
    stage: 'completed',
    progress: 100,
    message: 'Reporte generado exitosamente',
    timestamp: new Date(),
    data: { fileName: mergedFileName, url: finalPdfUrl }
  });

    // Enviar el evento SSE
  // pushToWSClients({
  //   status: 'pdf-ready',
  //   // userId,
  //   url: fileUrl,
  //   message: 'Tu archivo está listo para descargar',
  // });

  logger.info('Completion websocket notification sent', { sessionId });

  res.json({
    success: true,
    data: {
      message: `Reporte ${simulationData.programName} generado exitosamente`,
      sessionId: sessionId,
      totalPages: allPages.length,
      reportType: simulationData.programName,
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
