/**
 * Utilidades específicas para reportes UDEA
 */

import { logger } from './logger';
import { generateUniqueChartId, clearChartIdRegistry } from './chartIdGenerator';

/**
 * Helper function to split students array into chunks of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Función para calificar competencias según porcentaje de aciertos
 * I: 0-35%, II: 36-75%, III: 76-100%
 */
const qualifier = (percentage: number): string => {
  if (percentage >= 0 && percentage <= 35) return 'I';
  if (percentage >= 36 && percentage <= 75) return 'II';
  if (percentage >= 76 && percentage <= 100) return 'III';
  return '';
};

/**
 * Función dinámica para calificar según rangos configurables
 */
const dynamicQualifier = (percentage: number, ranges: Array<{ min: number, max: number, label: string }>): string => {
  for (const range of ranges) {
    if (percentage >= range.min && percentage <= range.max) {
      return range.label;
    }
  }
  return '';
};

/**
 * Procesa datos para la página "Distribución de estudiantes por competencias"
 * Página 3 del reporte UDEA
 */
export function procesarDistribucionCompetencias(simulationData: any) {
  const competenciasData: any = [];

  simulationData.students.forEach((student: any) => {
    // Buscar el simulacro asignado que coincida con el ID
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (!examen_asignado) return; // Si no encuentra el examen, saltar este estudiante

    // Procesar cada área/materia del examen
    examen_asignado.materias.forEach((area: any) => {
      const competencias: any = {};

      // Inicializar contadores para cada competencia
      area.competencies.forEach((comp: any) => {
        competencias[comp.name] = { precorrectas: 0, totalPreguntas: 0, qualifier: '' };
      });

      // Contar respuestas correctas y totales por competencia
      // Limitar a máximo 2 sesiones
      let sessionesToProcess = examen_asignado.respuesta_sesion.slice(0, 2);


      //v validar que ninguna respuesta venga null
      let sessionesToProcessAux: any[] = [];
      for (const session of sessionesToProcess) {

        if (session.respuestas !== null && session.respuestas !== undefined) {
          sessionesToProcessAux.push(session);
        }
      }
      console.log({ sessionesToProcessAux });
      sessionesToProcessAux.forEach((session: any) => {
        session.respuestas.forEach((respuesta: any) => {
          if (respuesta.competence && competencias[respuesta.competence]) {
            competencias[respuesta.competence].totalPreguntas++;
            if (respuesta.es_correcta) {
              competencias[respuesta.competence].precorrectas++;
            }
          }
        });
      });

      // Asignar calificaciones I, II, III según el porcentaje
      Object.keys(competencias).forEach(compName => {
        const { precorrectas, totalPreguntas } = competencias[compName];
        const porcentaje = totalPreguntas > 0 ? Math.round((precorrectas / totalPreguntas) * 100) : 0;
        competencias[compName].porcentaje = porcentaje;
        competencias[compName].qualifier = qualifier(porcentaje);
      });

      competenciasData.push({
        studentId: student.id,
        area: area.name,
        competencias
      });

      logger.info('Processed student competency data', {
        studentId: student.id,
        area: area.name,
        competencias
      });
    });
  });

  return competenciasData;
}

/**
 * Calcula estadísticas grupales y genera datos para gráficos
 */
/**
 * Calcula estadísticas grupales y genera datos para gráficos (versión dinámica)
 */
export function calcularEstadisticasCompetenciasDynamic(
  competenciasData: any[],
  ranges: Array<{ min: number, max: number, label: string }> = [
    { min: 0, max: 35, label: 'I' },
    { min: 36, max: 75, label: 'II' },
    { min: 76, max: 100, label: 'III' }
  ],
  labels: string[] = ['I', 'II', 'III'],
  colors: string[] = ['#58a55c', '#d88008', '#c55c5c']
) {
  // Limpiar el registro de IDs al inicio
  clearChartIdRegistry();

  // Agrupar y calcular porcentajes por competencia
  const competenciasStats: any = {};
  let chartCounter = 0; // Contador para IDs únicos

  // Extraer todas las competencias únicas por área
  competenciasData.forEach((item: any) => {
    if (!competenciasStats[item.area]) {
      competenciasStats[item.area] = {};
    }

    Object.keys(item.competencias).forEach(compName => {
      if (!competenciasStats[item.area][compName]) {
        // Inicializar dinámicamente basado en los rangos
        const statsObj: any = {};
        ranges.forEach(range => {
          statsObj[range.label] = { count: 0, percentage: 0 };
        });
        competenciasStats[item.area][compName] = statsObj;
      }
    });
  });

  // Contar estudiantes por nivel en cada competencia
  competenciasData.forEach((item: any) => {
    Object.keys(item.competencias).forEach(compName => {
      const porcentaje = item.competencias[compName].porcentaje || 0;
      const qualifier = dynamicQualifier(porcentaje, ranges);
      if (qualifier && competenciasStats[item.area][compName][qualifier]) {
        competenciasStats[item.area][compName][qualifier].count++;
      }
    });
  });

  // Calcular porcentajes
  Object.keys(competenciasStats).forEach(areaName => {
    Object.keys(competenciasStats[areaName]).forEach(compName => {
      const stats = competenciasStats[areaName][compName];
      const total = ranges.reduce((sum, range) => sum + stats[range.label].count, 0);

      if (total > 0) {
        ranges.forEach(range => {
          stats[range.label].percentage = Math.round((stats[range.label].count / total) * 100);
        });
      }
    });
  });

  // Generar JSON para bar_chart_simple agrupado por área y competencia
  const barChartData: any = [];

  Object.keys(competenciasStats).forEach(areaName => {
    Object.keys(competenciasStats[areaName]).forEach(compName => {
      const stats = competenciasStats[areaName][compName];

      // Crear arrays de ranges y valores dinámicamente
      const rangeData = ranges.map(range => ({
        percentage: stats[range.label].percentage,
        count: stats[range.label].count
      }));

      const values = ranges.map(range => stats[range.label].percentage);

      barChartData.push({
        type: "bar_chart_simple",
        area: areaName,
        data: {
          title: compName,
          area: areaName,
          chartId: generateUniqueChartId([areaName, compName, 'competencias'], chartCounter++),
          ranges: rangeData,
          chartData: {
            values: values
          },
          labels,
          colors,
          maxValue: 100 // Valor máximo para el eje Y
        }
      });
    });
  });

  // Agrupar barChartData por área
  const areasMap: any = {};

  barChartData.forEach((chartItem: any) => {
    // Extraer el área del chartId (formato: area_competencia_competencias)
    const chartId = chartItem.data.chartId;
    const areaMatch = chartId.match(/^(.+?)_[^_]+_competencias$/);

    if (areaMatch) {
      const areaKey = areaMatch[1];
      const areaName = areaKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      if (!areasMap[areaName]) {
        areasMap[areaName] = [];
      }
      areasMap[areaName].push(chartItem);
    }
  });

  // Convertir a formato {area, charts}
  const barChartDataGroupedByArea = Object.keys(areasMap).map(areaName => ({
    area: areaName,
    charts: areasMap[areaName]
  }));

  return { competenciasStats, barChartData, barChartDataGroupedByArea };
}

export function calcularEstadisticasCompetencias(competenciasData: any[], labels: string[] = ['I', 'II', 'III'], colors: string[] = ['#58a55c', '#d88008', '#c55c5c']) {
  let chartCounter = 0; // Contador para IDs únicos

  // Agrupar y calcular porcentajes por competencia
  const competenciasStats: any = {};

  // Extraer todas las competencias únicas por área
  competenciasData.forEach((item: any) => {
    if (!competenciasStats[item.area]) {
      competenciasStats[item.area] = {};
    }

    Object.keys(item.competencias).forEach(compName => {
      if (!competenciasStats[item.area][compName]) {
        competenciasStats[item.area][compName] = {
          I: { count: 0, percentage: 0 },
          II: { count: 0, percentage: 0 },
          III: { count: 0, percentage: 0 }
        };
      }
    });
  });

  // Contar estudiantes por nivel en cada competencia
  competenciasData.forEach((item: any) => {
    Object.keys(item.competencias).forEach(compName => {
      const qualifier = item.competencias[compName].qualifier;
      if (qualifier && competenciasStats[item.area][compName][qualifier]) {
        competenciasStats[item.area][compName][qualifier].count++;
      }
    });
  });

  // Calcular porcentajes
  Object.keys(competenciasStats).forEach(areaName => {
    Object.keys(competenciasStats[areaName]).forEach(compName => {
      const stats = competenciasStats[areaName][compName];
      const total = stats.I.count + stats.II.count + stats.III.count;

      if (total > 0) {
        stats.I.percentage = Math.round((stats.I.count / total) * 100);
        stats.II.percentage = Math.round((stats.II.count / total) * 100);
        stats.III.percentage = Math.round((stats.III.count / total) * 100);
      }
    });
  });

  // Generar JSON para bar_chart_with_title agrupado por área y competencia
  const barChartData: any = [];

  Object.keys(competenciasStats).forEach(areaName => {
    Object.keys(competenciasStats[areaName]).forEach(compName => {
      const stats = competenciasStats[areaName][compName];

      barChartData.push({
        type: "bar_chart_simple",
        area: areaName,
        data: {
          title: compName,
          area: areaName,
          chartId: generateUniqueChartId([areaName, compName, 'competencias'], chartCounter++),
          ranges: [
            { percentage: stats.I.percentage, count: stats.I.count },
            { percentage: stats.II.percentage, count: stats.II.count },
            { percentage: stats.III.percentage, count: stats.III.count },
            { percentage: 0, count: 0 } // 4to rango vacío para coincidir con template
          ],
          chartData: {
            values: [stats.I.percentage, stats.II.percentage, stats.III.percentage, 0]
          },
          labels,
          colors,
          maxValue: 100 // Valor máximo para el eje Y
        }
      });
    });
  });

  // Agrupar barChartData por área
  const areasMap: any = {};

  barChartData.forEach((chartItem: any) => {
    // Extraer el área del chartId (formato: area_competencia_competencias)
    const chartId = chartItem.data.chartId;
    const areaMatch = chartId.match(/^(.+?)_[^_]+_competencias$/);

    if (areaMatch) {
      const areaKey = areaMatch[1];
      const areaName = areaKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

      if (!areasMap[areaName]) {
        areasMap[areaName] = [];
      }
      areasMap[areaName].push(chartItem);
    }
  });

  // Convertir a formato {area, charts}
  const barChartDataGroupedByArea = Object.keys(areasMap).map(areaName => ({
    area: areaName,
    charts: areasMap[areaName]
  }));

  return { competenciasStats, barChartData, barChartDataGroupedByArea };
}

/**
 * Clasificador de niveles por área según porcentaje
 */
const clasificarNivelArea = (porcentaje: number): string => {
  if (porcentaje >= 0 && porcentaje <= 35) return 'Insuficiente';
  if (porcentaje >= 36 && porcentaje <= 50) return 'Mínimo';
  if (porcentaje >= 51 && porcentaje <= 65) return 'Satisfactorio';
  if (porcentaje >= 66 && porcentaje <= 100) return 'Avanzado';
  return '';
};

/**
 * Procesa datos para la página "Desempeño por área" 
 * Usará score_distribution en horizontal
 */
export function procesarDesempenoPorArea(simulationData: any) {
  const areaData: any = [];

  simulationData.students.forEach((student: any) => {
    // Buscar el simulacro asignado que coincida con el ID
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (!examen_asignado) return;

    // Procesar cada área/materia del examen
    examen_asignado.materias.forEach((area: any) => {
      const porcentaje = parseFloat(area.porcentaje);
      const nivel = clasificarNivelArea(porcentaje);

      areaData.push({
        studentId: student.id,
        areaName: area.name,
        porcentaje: porcentaje,
        nivel: nivel
      });

      logger.info('Processed student area data', {
        studentId: student.id,
        area: area.name,
        porcentaje,
        nivel
      });
    });
  });

  return areaData;
}

/**
 * Calcula estadísticas para score_distribution por área (versión dinámica)
 * Retorna un listado de charts individuales agrupados por área
 */
export function calcularEstadisticasAreaDynamic(
  areaData: any[],

  ranges: Array<{ min: number, max: number, label: string }> = [
    { min: 0, max: 35, label: 'Insuficiente' },
    { min: 36, max: 50, label: 'Mínimo' },
    { min: 51, max: 65, label: 'Satisfactorio' },
    { min: 66, max: 100, label: 'Avanzado' }
  ],
  colors: string[] = ['#c55c5c', '#d88008', '#58a55c', '#4c8631'],
  type: string = "score_distribution_horizontal",
) {
  let chartCounter = 0; // Contador para IDs únicos

  // Agrupar por área
  const areaStats: any = {};

  // Extraer todas las áreas únicas
  areaData.forEach((item: any) => {
    if (!areaStats[item.areaName]) {
      // Inicializar dinámicamente basado en los rangos
      const statsObj: any = {};
      ranges.forEach(range => {
        statsObj[range.label] = { count: 0, percentage: 0 };
      });
      areaStats[item.areaName] = statsObj;
    }
  });

  // Contar estudiantes por nivel en cada área usando rangos dinámicos
  areaData.forEach((item: any) => {
    const porcentaje = item.porcentaje;
    const nivel = dynamicQualifier(porcentaje, ranges);
    if (nivel && areaStats[item.areaName][nivel]) {
      areaStats[item.areaName][nivel].count++;
    }
  });

  // Calcular porcentajes
  Object.keys(areaStats).forEach(areaName => {
    const stats = areaStats[areaName];
    const total = ranges.reduce((sum, range) => sum + stats[range.label].count, 0);

    if (total > 0) {
      ranges.forEach(range => {
        stats[range.label].percentage = Math.round((stats[range.label].count / total) * 100);
      });
    }
  });

  // Generar charts individuales por área
  const chartsByArea = Object.keys(areaStats).map(areaName => {
    const stats = areaStats[areaName];

    const rangeData = ranges.map(range => ({
      label: `${range.min}-${range.max}`,
      percentage: stats[range.label].percentage,
      count: stats[range.label].count
    }));

    return {
      type: type,
      area: areaName,
      data: {
        title: areaName,
        chartId: generateUniqueChartId([areaName, 'distribution'], chartCounter++),
        subjects: [{
          name: areaName,
          chartId: generateUniqueChartId([areaName, 'distribution'], chartCounter++),
          ranges: rangeData,
          legend: ranges.map((range, index) => ({
            color: `legend-color-${index + 1}`,
            label: range.label
          }))
        }],
        horizontal: true,
        colors: colors
      }
    };
  });

  // Agrupar por área (similar a calcularEstadisticasCompetenciasDynamic)
  const areasMap: any = {};

  chartsByArea.forEach((chartItem: any) => {
    const areaName = chartItem.area;

    if (!areasMap[areaName]) {
      areasMap[areaName] = [];
    }
    areasMap[areaName].push(chartItem);
  });

  // Convertir a formato {area, charts}
  const chartDataGroupedByArea = Object.keys(areasMap).map(areaName => ({
    area: areaName,
    charts: areasMap[areaName]
  }));

  return {
    areaStats,
    chartsByArea,
    chartDataGroupedByArea,
    // Mantener compatibilidad con método original
    scoreDistributionData: {
      type: type,
      data: {
        subjects: chartsByArea.map(chart => chart.data.subjects[0]),
        horizontal: true
      }
    }
  };
}

/**
 * Genera páginas individuales para cada área desde scoreDistributionData
 */
export function generarPaginasAreaIndividuales(scoreDistributionData: any): Array<{ type: string, data: any }> {
  if (!scoreDistributionData?.data?.subjects) {
    return [];
  }

  // Crear una página por cada subject/área
  return scoreDistributionData.data.subjects.map((subject: any) => ({
    type: "score_distribution_horizontal",
    data: {
      subjects: [subject], // Solo un subject por página
      horizontal: true
    }
  }));
}

/**
 * Calcula estadísticas para score_distribution por área
 */
export function calcularEstadisticasArea(areaData: any[]) {
  let chartCounter = 0; // Contador para IDs únicos

  // Agrupar por área
  const areaStats: any = {};

  // Extraer todas las áreas únicas
  areaData.forEach((item: any) => {
    if (!areaStats[item.areaName]) {
      areaStats[item.areaName] = {
        'Insuficiente': { count: 0, percentage: 0 },
        'Mínimo': { count: 0, percentage: 0 },
        'Satisfactorio': { count: 0, percentage: 0 },
        'Avanzado': { count: 0, percentage: 0 }
      };
    }
  });

  // Contar estudiantes por nivel en cada área
  areaData.forEach((item: any) => {
    if (item.nivel && areaStats[item.areaName][item.nivel]) {
      areaStats[item.areaName][item.nivel].count++;
    }
  });

  // Calcular porcentajes
  Object.keys(areaStats).forEach(areaName => {
    const stats = areaStats[areaName];
    const total = stats['Insuficiente'].count + stats['Mínimo'].count +
      stats['Satisfactorio'].count + stats['Avanzado'].count;

    if (total > 0) {
      stats['Insuficiente'].percentage = Math.round((stats['Insuficiente'].count / total) * 100);
      stats['Mínimo'].percentage = Math.round((stats['Mínimo'].count / total) * 100);
      stats['Satisfactorio'].percentage = Math.round((stats['Satisfactorio'].count / total) * 100);
      stats['Avanzado'].percentage = Math.round((stats['Avanzado'].count / total) * 100);
    }
  });

  // Generar JSON para score_distribution horizontal
  const subjects = Object.keys(areaStats).map(areaName => {
    const stats = areaStats[areaName];

    return {
      name: areaName,
      chartId: generateUniqueChartId([areaName, 'distribution'], chartCounter++),
      ranges: [
        {
          label: 'Insuficiente (0-35%)',
          percentage: stats['Insuficiente'].percentage,
          count: stats['Insuficiente'].count
        },
        {
          label: 'Mínimo (36-50%)',
          percentage: stats['Mínimo'].percentage,
          count: stats['Mínimo'].count
        },
        {
          label: 'Satisfactorio (51-65%)',
          percentage: stats['Satisfactorio'].percentage,
          count: stats['Satisfactorio'].count
        },
        {
          label: 'Avanzado (66-100%)',
          percentage: stats['Avanzado'].percentage,
          count: stats['Avanzado'].count
        }
      ],
      legend: [  // OPCIONAL
        { "color": "legend-color-1", "label": "Insuficiente" },
        { "color": "legend-color-2", "label": "Mínimo" },
        { "color": "legend-color-3", "label": "Satisfactorio" },
        { "color": "legend-color-4", "label": "Avanzado" }
      ]
    };
  });

  const scoreDistributionData = {
    type: "score_distribution_horizontal",
    data: {
      subjects: subjects,
      horizontal: true  // Para usar el modo horizontal
    }
  };

  return { areaStats, scoreDistributionData };
}

/**
 * Procesa datos para la tabla de análisis de dificultad
 * Página 5 del reporte UDEA
 */
export function procesarTablaDificultadAnalisis(simulationData: any) {
  const tablaDificultadData: any = [];

  // Validar que existan detailQuestion y students
  if (!simulationData.detailQuestion || !simulationData.students) {
    logger.error('Missing required data for difficulty analysis', {
      hasDetailQuestion: !!simulationData.detailQuestion,
      hasStudents: !!simulationData.students
    });
    return [];
  }
  // Para cada pregunta en detailQuestion
  simulationData.detailQuestion.forEach((question: any, questionIndex: number) => {
    const questionData: any = {
      number: questionIndex + 1,
      competence: question.competencia || 'N/A',
      component: question.componente || 'N/A',
      cod: question.cod || '',
      area: question.area || '',
      cantRespuestas: parseInt(question.cant_respuesta) || 4,
      preguntaCorrecta: question.pregunta_correcta,
      respuestasIds: question.respuestas || [],
      // Estadísticas que calcularemos
      totalEstudiantes: 0,
      respuestasPorOpcion: {}, // {opcionId: count}
      noRespondio: 0, // Contador para respuestas NR
      correctAnswerIndex: -1,
      indiceDificultad: 0
    };

    // Inicializar contadores para cada opción de respuesta
    questionData.respuestasIds.forEach((respuestaId: string, index: number) => {
      questionData.respuestasPorOpcion[respuestaId] = 0;
    });

    // Contar respuestas de estudiantes para esta pregunta
    simulationData.students.forEach((student: any) => {
      const examen_asignado = student.examenes_asignados.find((exam: any) =>
        exam.id_simulacro === simulationData.simulationId
      );

      if (!examen_asignado) return;

      // Buscar respuestas del estudiante para esta pregunta específica
      let estudianteRespondioEstaPregunta = false;

      // Limitar a máximo 2 sesiones
      const sessionesToProcess = examen_asignado.respuesta_sesion.slice(0, 2);

      let sessionesToProcessAux: any[] = [];
      for (const session of sessionesToProcess) {

        if (session.respuestas !== null && session.respuestas !== undefined) {
          sessionesToProcessAux.push(session);
        }
      }

      sessionesToProcessAux.forEach((session: any) => {
        session.respuestas.forEach((respuesta: any) => {
          // Verificar si esta respuesta corresponde a nuestra pregunta actual
          if (questionData.respuestasIds.includes(respuesta.id_respuesta)) {
            // El estudiante respondió esta pregunta con una opción válida
            estudianteRespondioEstaPregunta = true;
            questionData.respuestasPorOpcion[respuesta.id_respuesta]++;
          }
          // Verificar si es una respuesta NR para esta pregunta específica
          else if (respuesta.id_pregunta === question.id &&
            (respuesta.id_respuesta === null || respuesta.id_respuesta === undefined)) {
            // El estudiante vio esta pregunta pero no respondió (NR)
            estudianteRespondioEstaPregunta = true;
            questionData.noRespondio++;
          }
        });
      });

      // Si el estudiante interactuó con esta pregunta (respondió o no respondió), contarlo
      if (estudianteRespondioEstaPregunta) {
        questionData.totalEstudiantes++;
      }
    });

    // Encontrar el índice de la respuesta correcta
    questionData.correctAnswerIndex = questionData.respuestasIds.findIndex(
      (respuestaId: string) => respuestaId === questionData.preguntaCorrecta
    );

    // Calcular índice de dificultad (excluyendo respuestas NR del cálculo)
    const respuestasCorrectas = questionData.respuestasPorOpcion[questionData.preguntaCorrecta] || 0;
    const respuestasValidas = questionData.totalEstudiantes - questionData.noRespondio;
    const respuestasIncorrectas = respuestasValidas - respuestasCorrectas;
    questionData.indiceDificultad = respuestasValidas > 0
      ? Math.round((respuestasIncorrectas / respuestasValidas) * 100)
      : 0;

    tablaDificultadData.push(questionData);

    logger.info('Processed question difficulty data', {
      questionNumber: questionData.number,
      competence: questionData.competence,
      totalStudents: questionData.totalEstudiantes,
      correctAnswers: respuestasCorrectas,
      difficultyIndex: questionData.indiceDificultad
    });
  });

  return tablaDificultadData;
}


/**
 * Genera datos formateados para el componente tabla-dificultad-analisis.ejs
 */
/* export function generarDatosTablaDificultad(tablaDificultadData: any[]) {


  if (!tablaDificultadData || tablaDificultadData.length === 0) {
    return {
      type: "tabla_dificultad_analisis",
      data: {
        prueba: "Simulacro UDEA",
        subject: "Sin datos disponibles",
        options: ["A", "B", "C", "D"],
        questions: []
      }
    };
  }

  // Determinar el número máximo de opciones para generar headers dinámicos
  const maxOpciones = Math.max(...tablaDificultadData.map(q => q.cantRespuestas));
  const options = Array.from({ length: maxOpciones }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, D...

  // Obtener el área predominante para el título
  const areasPredominantes = tablaDificultadData.reduce((acc: any, question: any) => {
    acc[question.area] = (acc[question.area] || 0) + 1;
    return acc;
  }, {});
  const areaPrincipal = Object.keys(areasPredominantes).reduce((a, b) =>
    areasPredominantes[a] > areasPredominantes[b] ? a : b
  );

  // Procesar cada pregunta para generar el formato esperado
  const questions = tablaDificultadData.map((questionData: any) => {
    // Calcular porcentajes por opción
    const percentages = questionData.respuestasIds.map((respuestaId: string) => {
      const count = questionData.respuestasPorOpcion[respuestaId] || 0;
      const percentage = questionData.totalEstudiantes > 0
        ? Math.round((count / questionData.totalEstudiantes) * 100 * 10) / 10 // Un decimal
        : 0;
      return percentage + '%';
    });

    // Determinar color del índice de dificultad
    let difficultyClass = '';
    let difficultyColor = '';
    if (questionData.indiceDificultad >= 0 && questionData.indiceDificultad <= 30.9) {
      difficultyClass = 'difficulty-bajo';
      difficultyColor = '#4c8631'; // Verde
    } else if (questionData.indiceDificultad >= 31.0 && questionData.indiceDificultad <= 60.9) {
      difficultyClass = 'difficulty-medio';
      difficultyColor = '#d88008'; // Naranja
    } else if (questionData.indiceDificultad >= 61.1 && questionData.indiceDificultad <= 100) {
      difficultyClass = 'difficulty-alto';
      difficultyColor = '#bd5785'; // Rojo
    }

    return {
      number: questionData.number,
      competence: questionData.competence,
      component: questionData.component,
      percentages: percentages,
      correctAnswer: questionData.correctAnswerIndex, // Índice de la respuesta correcta
      id: questionData.indiceDificultad + '%',
      difficultyClass: difficultyClass,
      difficultyColor: difficultyColor,
      // Datos adicionales para debugging
      _debug: {
        cod: questionData.cod,
        totalStudents: questionData.totalEstudiantes,
        correctAnswers: questionData.respuestasPorOpcion[questionData.preguntaCorrecta] || 0
      }
    };
  });

  const tableData = {
    type: "tabla_dificultad_analisis",
    data: {
      prueba: "Simulacro UDEA",
      subject: `Análisis de Dificultad - ${areaPrincipal}`,
      options: options,
      questions: questions
    }
  };

  logger.info('Generated difficulty table data', {
    totalQuestions: questions.length,
    maxOptions: maxOpciones,
    mainArea: areaPrincipal,
    optionsGenerated: options
  });

  return tableData;
} */
/**
 * Genera datos formateados para el componente tabla-dificultad-analisis.ejs
 */
export function generarDatosTablaDificultad(tablaDificultadData: any[], nivels: any[] = [
  {
    label: "BAJO",
    color: "#4c8631",
    min: 0,
    max: 30.9
  },
  {
    label: "MEDIO",
    color: "#d88008",
    min: 31.0,
    max: 60.9
  },
  {
    label: "ALTO",
    color: "#bd5785",
    min: 61.1,
    max: 100
  }
], indiceDificultadPorCompetencia: any = {}) {
  if (!tablaDificultadData || tablaDificultadData.length === 0) {
    return [];
  }

  // Detectar si hay materias en inglés y usar niveles específicos
  const getEnglishLevels = () => [
    { label: "A-", color: "#739c48", min: 0, max: 24.9 },
    { label: "A1", color: "#4c8631", min: 25, max: 39.9 },
    { label: "A2", color: "#fdd323", min: 40, max: 69.9 },
    { label: "B1", color: "#f27132", min: 70, max: 79.9 },
    { label: "B+", color: "#ef2f34", min: 80, max: 100 }
  ];

  // Agrupar preguntas por área
  const preguntasPorArea: any = tablaDificultadData.reduce((acc: any, question: any) => {
    if (!acc[question.area]) acc[question.area] = [];
    acc[question.area].push(question);
    return acc;
  }, {});

  // Para cada área, generar su propia tabla
  const tablasPorArea = Object.entries(preguntasPorArea).map((entry) => {
    const [area, preguntas] = entry as [string, any[]];

    // Detectar si el área es de inglés y usar niveles específicos
    const isEnglishArea = /inglés|english|ingles/i.test(area);
    const currentNivels = isEnglishArea ? getEnglishLevels() : nivels;
    // Determinar el número máximo de opciones en esta área
    const maxOpciones = Math.max(...preguntas.map(q => q.cantRespuestas));
    const options = Array.from({ length: maxOpciones }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, ...
    // Agregar "NR" como opción adicional
    options.push('NR');

    // Si hay más de 30 preguntas, dividir en múltiples tablas
    const PREGUNTAS_POR_PAGINA = 30;
    const tablasDivididas = [];

    for (let i = 0; i < preguntas.length; i += PREGUNTAS_POR_PAGINA) {
      const preguntasChunk = preguntas.slice(i, i + PREGUNTAS_POR_PAGINA);
      const numeroPagina = Math.floor(i / PREGUNTAS_POR_PAGINA) + 1;
      const totalPaginas = Math.ceil(preguntas.length / PREGUNTAS_POR_PAGINA);

      const questions = preguntasChunk.map((questionData: any) => {
        // Calcular porcentajes (incluyendo NR)
        const percentages = questionData.respuestasIds.map((respuestaId: string) => {
          const count = questionData.respuestasPorOpcion[respuestaId] || 0;
          const percentage = questionData.totalEstudiantes > 0
            ? Math.round((count / questionData.totalEstudiantes) * 100 * 10) / 10
            : 0;
          return percentage + '%';
        });

        // Normalizar el array de porcentajes para que tenga exactamente maxOpciones elementos
        // Rellenar con "-" si faltan opciones
        while (percentages.length < maxOpciones) {
          percentages.push('-');
        }

        // Agregar porcentaje de NR al final
        const nrPercentage = questionData.totalEstudiantes > 0
          ? Math.round((questionData.noRespondio / questionData.totalEstudiantes) * 100 * 10) / 10
          : 0;
        percentages.push(nrPercentage + '%');

        // Determinar color/clase según índice de dificultad - usando niveles dinámicos
        let difficultyClass = '';
        let difficultyColor = '';

        for (const nivel of currentNivels) {
          if (questionData.indiceDificultad >= nivel.min && questionData.indiceDificultad <= nivel.max) {
            difficultyClass = `difficulty-${nivel.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            difficultyColor = nivel.color;
            break;
          }
        }

        return {
          number: questionData.number,
          competence: questionData.competence,
          component: questionData.component,
          percentages: percentages,
          correctAnswer: questionData.correctAnswerIndex,
          id: questionData.indiceDificultad + '%',
          difficultyClass,
          difficultyColor,
          _debug: {
            cod: questionData.cod,
            totalStudents: questionData.totalEstudiantes,
            correctAnswers: questionData.respuestasPorOpcion[questionData.preguntaCorrecta] || 0
          }
        };
      });

      // Calcular promedio de índice de dificultad para esta área (usando todas las preguntas, no solo el chunk)
      const competenciasEnArea = [...new Set(preguntas.map(p => p.competence))];
      const promedioIndiceDificultadArea = competenciasEnArea.length > 0 ?
        competenciasEnArea.reduce((sum, comp) => sum + (indiceDificultadPorCompetencia[comp] || 0), 0) / competenciasEnArea.length : 0;

      // Determinar nivel y color basado en el promedio - usando niveles dinámicos
      let nivelArea = currentNivels[0]?.label || "BAJO";
      let colorArea = currentNivels[0]?.color || "#4c8631";

      for (const nivel of currentNivels) {
        if (promedioIndiceDificultadArea >= nivel.min && promedioIndiceDificultadArea <= nivel.max) {
          nivelArea = nivel.label;
          colorArea = nivel.color;
          break;
        }
      }

      // Generar título que incluya información de paginación si es necesario
      const tituloArea = totalPaginas > 1
        ? `${area} (Página ${numeroPagina} de ${totalPaginas})`
        : area;

      const tablaChunk = {
        type: "tabla_dificultad_analisis",
        data: {
          prueba: "Simulacro UDEA",
          subject: tituloArea,
          nivels: currentNivels,
          options,
          questions,
          indiceDificultadArea: {
            valor: Math.round(promedioIndiceDificultadArea * 10) / 10,
            nivel: nivelArea,
            color: colorArea
          }
        }
      };

      tablasDivididas.push(tablaChunk);
    }

    return tablasDivididas;
  });

  // Aplanar el array ya que ahora cada área puede generar múltiples tablas
  return tablasPorArea.flat();
}

/**
 * Clasificador de categoría según porcentaje total
 */
const clasificarCategoria = (porcentaje: number): string => {
  if (porcentaje >= 0 && porcentaje <= 35) return 'I';
  if (porcentaje >= 36 && porcentaje <= 50) return 'M';
  if (porcentaje >= 51 && porcentaje <= 65) return 'S';
  if (porcentaje >= 66 && porcentaje <= 100) return 'A';
  return '';
};

/**
 * Interfaz para posiciones globales
 */
interface GlobalPositionData {
  studentId: string;
  puestoGrado: number;
  puestoGrupo: number;
  scoreGlobal: number;
  totalEstudiantesGlobal: number;
}

interface GlobalPositionsMap {
  [studentId: string]: GlobalPositionData;
}

/**
 * Procesa datos para la tabla de estudiantes con competencias
 * Página 6 del reporte UDEA
 *
 * @param simulationData - Datos de la simulación
 * @param globalPositions - Mapa opcional de posiciones globales (puesto por grado)
 *                          Si viene de regenerateReport, se extraen de results
 *                          Si viene de processSimulationData, se calculan desde ReportData
 */
export function procesarTablaEstudiantes(simulationData: any, globalPositions?: GlobalPositionsMap) {
  // LOG DEBUG: Ver si llegaron globalPositions
  logger.info('========== procesarTablaEstudiantes DEBUG ==========');
  logger.info(`globalPositions recibido: ${globalPositions ? 'SI' : 'NO'}`);
  logger.info(`Cantidad de estudiantes en globalPositions: ${globalPositions ? Object.keys(globalPositions).length : 0}`);
  if (globalPositions && Object.keys(globalPositions).length > 0) {
    const firstKey = Object.keys(globalPositions)[0];
    logger.info(`Ejemplo globalPositions[${firstKey}]: ${JSON.stringify(globalPositions[firstKey])}`);
  }

  const estudiantes: any[] = [];
  let totalPuntajes = 0;
  let puntajesArray: number[] = [];

  // Extraer todas las competencias únicas
  const todasCompetencias = new Set<string>();

  // Primero, recopilar todas las competencias disponibles
  simulationData.students.forEach((student: any) => {
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (examen_asignado) {
      examen_asignado.materias.forEach((area: any) => {
        area.competencies.forEach((comp: any) => {
          todasCompetencias.add(comp.name);
        });
      });
    }
  });

  const competenciasList = Array.from(todasCompetencias).sort();

  // Procesar cada estudiante
  simulationData.students.forEach((student: any, index: number) => {
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (!examen_asignado) return;

    // Obtener posición global si está disponible
    const globalPos = globalPositions?.[student.id];

    // Obtener datos básicos del estudiante
    // Usar scoreGlobal de globalPositions si está disponible (viene del recálculo con RaschCalculator)
    // De lo contrario, usar el score del examen asignado
    const puntaje = globalPos?.scoreGlobal ?? examen_asignado.score ?? 0;
    const posicionGrupo = examen_asignado.position || 0;
    const categoria = clasificarCategoria(puntaje);

    const posicionGrado = globalPos?.puestoGrado || 0; // Se calculará después si no hay globalPositions

    // LOG DEBUG: Ver posiciones de cada estudiante
    logger.info(`[procesarTablaEstudiantes] Student ${student.id}: examen_asignado.position=${examen_asignado.position}, globalPos?.puestoGrado=${globalPos?.puestoGrado}, globalPos?.scoreGlobal=${globalPos?.scoreGlobal}, posicionGrupo=${posicionGrupo}, posicionGrado=${posicionGrado}`);

    // Calcular porcentajes por competencia
    const competenciasData: any = {};

    // Inicializar todas las competencias con 0
    competenciasList.forEach(comp => {
      competenciasData[comp] = 0;
    });

    // Calcular porcentajes reales por competencia
    examen_asignado.materias.forEach((area: any) => {
      area.competencies.forEach((comp: any) => {
        if (comp.skills && comp.skills.length > 0) {
          const porcentaje = parseFloat(comp.skills[0].porcentaje) || 0;
          competenciasData[comp.name] = Math.round(porcentaje * 10) / 10; // Un decimal
        }
      });
    });

    const estudianteData = {
      puestoGrado: posicionGrado, // Posición global (de globalPositions o se calcula después)
      puestoGrupo: posicionGrupo, // Posición dentro del grupo (de examen_asignado.position)
      grupo: student.course_id || 'N/A',
      nombre: student.name || `Estudiante ${index + 1}`,
      puntaje: Math.round(puntaje * 10) / 10,
      categoria: categoria,
      competencias: competenciasList.map(comp => competenciasData[comp] + '%'),
      _studentId: student.id // Para poder buscar en globalPositions después
    };

    estudiantes.push(estudianteData);
    totalPuntajes += puntaje;
    puntajesArray.push(puntaje);

    logger.info('Processed student for table', {
      studentId: student.id,
      posicionGrupo: posicionGrupo,
      posicionGrado: posicionGrado,
      score: puntaje,
      category: categoria,
      competencies: Object.keys(competenciasData).length
    });
  });

  // Calcular estadísticas
  const promedioGeneral = estudiantes.length > 0 ?
    Math.round((totalPuntajes / estudiantes.length) * 10) / 10 : 0;

  // Calcular desviación estándar
  const varianza = puntajesArray.length > 0 ?
    puntajesArray.reduce((sum, puntaje) => sum + Math.pow(puntaje - promedioGeneral, 2), 0) / puntajesArray.length : 0;
  const desviacionEstandar = Math.round(Math.sqrt(varianza) * 10) / 10;

  // Ordenar estudiantes por puntaje (mayor a menor)
  estudiantes.sort((a, b) => parseFloat(b.puntaje) - parseFloat(a.puntaje));

  // Actualizar posiciones después del ordenamiento
  // Solo recalcular puestoGrado si NO hay globalPositions (viene de processSimulationData directo)
  // puestoGrupo NUNCA se recalcula, siempre viene del examen_asignado.position original
  if (!globalPositions || Object.keys(globalPositions).length === 0) {
    // Sin globalPositions: recalcular puestoGrado basado en ordenamiento local
    estudiantes.forEach((estudiante, index) => {
      estudiante.puestoGrado = index + 1;
      // puestoGrupo ya tiene el valor correcto de examen_asignado.position
    });

    logger.info('Recalculated puestoGrado locally (no globalPositions provided)');
  } else {
    // Con globalPositions: las posiciones ya están correctas
    logger.info('Using globalPositions for puestoGrado', {
      studentsWithGlobalPos: Object.keys(globalPositions).length
    });
  }

  // Calcular índice de dificultad promedio por competencia
  const indiceDificultadPorCompetencia: any = {};

  if (simulationData.detailQuestion) {
    competenciasList.forEach(competencia => {
      let totalIndiceDificultad = 0;
      let contadorPreguntas = 0;

      simulationData.detailQuestion.forEach((question: any) => {
        if (question.competencia === competencia) {
          // Contar respuestas para esta pregunta
          let totalEstudiantes = 0;
          let respuestasCorrectas = 0;

          simulationData.students.forEach((student: any) => {
            const examen_asignado = student.examenes_asignados.find((exam: any) =>
              exam.id_simulacro === simulationData.simulationId
            );

            if (examen_asignado) {
              // Limitar a máximo 2 sesiones
              const sessionesToProcess = examen_asignado.respuesta_sesion.slice(0, 2);

              let sessionesToProcessAux: any[] = [];
              for (const session of sessionesToProcess) {

                if (session.respuestas !== null && session.respuestas !== undefined) {
                  sessionesToProcessAux.push(session);
                }
              }


              sessionesToProcessAux.forEach((session: any) => {
                session.respuestas.forEach((respuesta: any) => {
                  if (question.respuestas && question.respuestas.includes(respuesta.id_respuesta)) {
                    totalEstudiantes++;
                    if (respuesta.id_respuesta === question.pregunta_correcta) {
                      respuestasCorrectas++;
                    }
                  }
                });
              });
            }
          });

          if (totalEstudiantes > 0) {
            const respuestasIncorrectas = totalEstudiantes - respuestasCorrectas;
            const indiceDificultad = Math.round((respuestasIncorrectas / totalEstudiantes) * 100);
            totalIndiceDificultad += indiceDificultad;
            contadorPreguntas++;
          }
        }
      });

      indiceDificultadPorCompetencia[competencia] = contadorPreguntas > 0 ?
        Math.round(totalIndiceDificultad / contadorPreguntas * 10) / 10 : 0;
    });
  }

  // Si hay más de 22 estudiantes, dividir en múltiples tablas
  if (estudiantes.length > 22) {
    const studentChunks = chunkArray(estudiantes, 22);
    const tablasData = studentChunks.map((chunk, chunkIndex) => ({
      type: "tabla_con_puntaje",
      data: {
        competencias: competenciasList,
        areas: competenciasList, // Para compatibilidad
        columnas: competenciasList, // Nombre genérico
        estudiantes: chunk,
        promedioGeneral: promedioGeneral,
        desviacionEstandar: desviacionEstandar,
        indiceDificultadPorCompetencia: indiceDificultadPorCompetencia,
        indiceDificultadGeneral: indiceDificultadPorCompetencia, // Para compatibilidad
        tipoTabla: "competencias",
        paginaActual: chunkIndex + 1,
        totalPaginas: studentChunks.length
      }
    }));

    logger.info('Generated paginated student table data', {
      totalStudents: estudiantes.length,
      pages: studentChunks.length,
      studentsPerPage: 22,
      competencies: competenciasList.length,
      averageScore: promedioGeneral,
      standardDeviation: desviacionEstandar
    });

    return tablasData;
  }

  // Si hay 22 o menos estudiantes, devolver una sola tabla
  const tablaData = {
    type: "tabla_con_puntaje",
    data: {
      competencias: competenciasList,
      areas: competenciasList, // Para compatibilidad
      columnas: competenciasList, // Nombre genérico
      estudiantes: estudiantes,
      promedioGeneral: promedioGeneral,
      desviacionEstandar: desviacionEstandar,
      indiceDificultadPorCompetencia: indiceDificultadPorCompetencia,
      indiceDificultadGeneral: indiceDificultadPorCompetencia, // Para compatibilidad
      tipoTabla: "competencias"
    }
  };

  logger.info('Generated student table data', {
    totalStudents: estudiantes.length,
    competencies: competenciasList.length,
    averageScore: promedioGeneral,
    standardDeviation: desviacionEstandar
  });

  return [tablaData];
}

/**
 * Procesa datos para la tabla de estudiantes con áreas en lugar de competencias
 * Similar a procesarTablaEstudiantes pero basado en áreas/materias
 *
 * @param simulationData - Datos de la simulación
 * @param globalPositions - Mapa opcional de posiciones globales (puesto por grado)
 */
export function procesarTablaEstudiantesPorArea(simulationData: any, globalPositions?: GlobalPositionsMap) {
  // LOG DEBUG: Ver si llegaron globalPositions
  logger.info('========== procesarTablaEstudiantesPorArea DEBUG ==========');
  logger.info(`globalPositions recibido: ${globalPositions ? 'SI' : 'NO'}`);
  logger.info(`Cantidad de estudiantes en globalPositions: ${globalPositions ? Object.keys(globalPositions).length : 0}`);
  if (globalPositions && Object.keys(globalPositions).length > 0) {
    const firstKey = Object.keys(globalPositions)[0];
    logger.info(`Ejemplo globalPositions[${firstKey}]: ${JSON.stringify(globalPositions[firstKey])}`);
  }

  const estudiantes: any[] = [];
  let totalPuntajes = 0;
  let puntajesArray: number[] = [];

  // Extraer todas las áreas únicas
  const todasAreas = new Set<string>();

  // Primero, recopilar todas las áreas disponibles
  simulationData.students.forEach((student: any) => {
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (examen_asignado) {
      examen_asignado.materias.forEach((area: any) => {
        todasAreas.add(area.name);
      });
    }
  });

  const areasList = Array.from(todasAreas).sort();

  // Procesar cada estudiante
  simulationData.students.forEach((student: any, index: number) => {
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (!examen_asignado) return;

    // Obtener posición global si está disponible
    const globalPos = globalPositions?.[student.id];

    // Obtener datos básicos del estudiante
    // Usar scoreGlobal de globalPositions si está disponible (viene del recálculo con RaschCalculator)
    // De lo contrario, usar el score del examen asignado
    const puntaje = globalPos?.scoreGlobal ?? examen_asignado.score ?? 0;
    const posicionGrupo = examen_asignado.position || 0;
    const categoria = clasificarCategoria(puntaje);

    const posicionGrado = globalPos?.puestoGrado || 0; // Se calculará después si no hay globalPositions

    // LOG DEBUG: Ver posiciones de cada estudiante
    logger.info(`[procesarTablaEstudiantesPorArea] Student ${student.id}: examen_asignado.position=${examen_asignado.position}, globalPos?.puestoGrado=${globalPos?.puestoGrado}, globalPos?.scoreGlobal=${globalPos?.scoreGlobal}, posicionGrupo=${posicionGrupo}, posicionGrado=${posicionGrado}`);

    // Calcular porcentajes por área
    const areasData: any = {};

    // Inicializar todas las áreas con 0
    areasList.forEach(area => {
      areasData[area] = 0;
    });

    // Calcular porcentajes reales por área
    examen_asignado.materias.forEach((area: any) => {
      const porcentaje = parseFloat(area.porcentaje) || 0;
      areasData[area.name] = Math.round(porcentaje * 10) / 10; // Un decimal
    });

    const valoresPorcentajes = areasList.map(area => areasData[area] + '%');

    const estudianteData = {
      puestoGrado: posicionGrado, // Posición global (de globalPositions o se calcula después)
      puestoGrupo: posicionGrupo, // Posición dentro del grupo (de examen_asignado.position)
      grupo: student.course_id || 'N/A',
      nombre: student.name || `Estudiante ${index + 1}`,
      puntaje: Math.round(puntaje * 10) / 10,
      categoria: categoria,
      areas: valoresPorcentajes,
      competencias: valoresPorcentajes, // Para compatibilidad con el template
      _studentId: student.id // Para poder buscar en globalPositions después
    };

    estudiantes.push(estudianteData);
    totalPuntajes += puntaje;
    puntajesArray.push(puntaje);

    logger.info('Processed student for areas table', {
      studentId: student.id,
      posicionGrupo: posicionGrupo,
      posicionGrado: posicionGrado,
      score: puntaje,
      category: categoria,
      areas: Object.keys(areasData).length
    });
  });

  // Calcular estadísticas
  const promedioGeneral = estudiantes.length > 0 ?
    Math.round((totalPuntajes / estudiantes.length) * 10) / 10 : 0;

  // Calcular desviación estándar
  const varianza = puntajesArray.length > 0 ?
    puntajesArray.reduce((sum, puntaje) => sum + Math.pow(puntaje - promedioGeneral, 2), 0) / puntajesArray.length : 0;
  const desviacionEstandar = Math.round(Math.sqrt(varianza) * 10) / 10;

  // Ordenar estudiantes por puntaje (mayor a menor)
  estudiantes.sort((a, b) => parseFloat(b.puntaje) - parseFloat(a.puntaje));

  // Actualizar posiciones después del ordenamiento
  // Solo recalcular puestoGrado si NO hay globalPositions (viene de processSimulationData directo)
  // puestoGrupo NUNCA se recalcula, siempre viene del examen_asignado.position original
  if (!globalPositions || Object.keys(globalPositions).length === 0) {
    // Sin globalPositions: recalcular puestoGrado basado en ordenamiento local
    estudiantes.forEach((estudiante, index) => {
      estudiante.puestoGrado = index + 1;
      // puestoGrupo ya tiene el valor correcto de examen_asignado.position
    });

    logger.info('Recalculated puestoGrado locally for areas table (no globalPositions provided)');
  } else {
    // Con globalPositions: las posiciones ya están correctas
    logger.info('Using globalPositions for puestoGrado in areas table', {
      studentsWithGlobalPos: Object.keys(globalPositions).length
    });
  }

  // Calcular índice de dificultad promedio por área
  const indiceDificultadPorArea: any = {};

  if (simulationData.detailQuestion) {
    areasList.forEach(areaName => {
      let totalIndiceDificultad = 0;
      let contadorPreguntas = 0;

      simulationData.detailQuestion.forEach((question: any) => {
        if (question.area === areaName) {
          // Contar respuestas para esta pregunta
          let totalEstudiantes = 0;
          let respuestasCorrectas = 0;

          simulationData.students.forEach((student: any) => {
            const examen_asignado = student.examenes_asignados.find((exam: any) =>
              exam.id_simulacro === simulationData.simulationId
            );

            if (examen_asignado) {
              // Limitar a máximo 2 sesiones
              const sessionesToProcess = examen_asignado.respuesta_sesion.slice(0, 2);
              sessionesToProcess.forEach((session: any) => {
                session.respuestas.forEach((respuesta: any) => {
                  if (question.respuestas && question.respuestas.includes(respuesta.id_respuesta)) {
                    totalEstudiantes++;
                    if (respuesta.id_respuesta === question.pregunta_correcta) {
                      respuestasCorrectas++;
                    }
                  }
                });
              });
            }
          });

          if (totalEstudiantes > 0) {
            const respuestasIncorrectas = totalEstudiantes - respuestasCorrectas;
            const indiceDificultad = Math.round((respuestasIncorrectas / totalEstudiantes) * 100);
            totalIndiceDificultad += indiceDificultad;
            contadorPreguntas++;
          }
        }
      });

      indiceDificultadPorArea[areaName] = contadorPreguntas > 0 ?
        Math.round(totalIndiceDificultad / contadorPreguntas * 10) / 10 : 0;
    });
  }

  // Si hay más de 22 estudiantes, dividir en múltiples tablas
  if (estudiantes.length > 22) {
    const studentChunks = chunkArray(estudiantes, 22);
    const tablasData = studentChunks.map((chunk, chunkIndex) => ({
      type: "tabla_con_puntaje",
      data: {
        areas: areasList,
        competencias: areasList, // Para compatibilidad
        columnas: areasList, // Nombre genérico
        estudiantes: chunk,
        promedioGeneral: promedioGeneral,
        desviacionEstandar: desviacionEstandar,
        indiceDificultadPorArea: indiceDificultadPorArea,
        indiceDificultadPorCompetencia: indiceDificultadPorArea, // Para compatibilidad
        indiceDificultadGeneral: indiceDificultadPorArea, // Para compatibilidad
        tipoTabla: "areas",
        paginaActual: chunkIndex + 1,
        totalPaginas: studentChunks.length
      }
    }));

    logger.info('Generated paginated student areas table data', {
      totalStudents: estudiantes.length,
      pages: studentChunks.length,
      studentsPerPage: 22,
      areas: areasList.length,
      averageScore: promedioGeneral,
      standardDeviation: desviacionEstandar
    });

    return tablasData;
  }

  // Si hay 22 o menos estudiantes, devolver una sola tabla
  const tablaData = {
    type: "tabla_con_puntaje",
    data: {
      areas: areasList,
      competencias: areasList, // Para compatibilidad
      columnas: areasList, // Nombre genérico
      estudiantes: estudiantes,
      promedioGeneral: promedioGeneral,
      desviacionEstandar: desviacionEstandar,
      indiceDificultadPorArea: indiceDificultadPorArea,
      indiceDificultadPorCompetencia: indiceDificultadPorArea, // Para compatibilidad
      indiceDificultadGeneral: indiceDificultadPorArea, // Para compatibilidad
      tipoTabla: "areas"
    }
  };

  logger.info('Generated student areas table data', {
    totalStudents: estudiantes.length,
    areas: areasList.length,
    averageScore: promedioGeneral,
    standardDeviation: desviacionEstandar
  });

  return [tablaData];
}

/**
 * Procesa datos para competencias UNAL desde simulationData
 * Basado en las areas de cada estudiante
 */
export function procesarCompetenciasUNAL(simulationData: any) {
  const competenciasData: any = {};
  const conteoEstudiantes: any = {};

  // Procesar cada estudiante
  simulationData.students.forEach((student: any) => {
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (!examen_asignado) return;

    // Procesar cada área/materia del examen
    examen_asignado.materias.forEach((area: any) => {
      const areaName = area.name;
      const areaPorcentaje = parseFloat(area.porcentaje) || 0;

      // Inicializar area si no existe
      if (!competenciasData[areaName]) {
        competenciasData[areaName] = {
          totalPorcentaje: 0
        };
        conteoEstudiantes[areaName] = 0;
      }

      // Acumular datos
      competenciasData[areaName].totalPorcentaje += areaPorcentaje;
      conteoEstudiantes[areaName]++;
    });
  });

  // Calcular promedios y estructurar datos para el componente
  const competenciasArray = Object.keys(competenciasData).map(areaName => {
    const area = competenciasData[areaName];
    const promedioGrupo = area.totalPorcentaje / conteoEstudiantes[areaName];

    return {
      nombre: areaName,
      valor: 0, // Por el momento en cero como solicitado
      historico: 0, // No se tiene dato histórico, se deja en cero
      promedioGrupo: Math.round(promedioGrupo * 10) / 10 // Promedio real del grupo
    };
  });

  logger.info('Processed UNAL competencies', {
    totalAreas: competenciasArray.length,
    areas: competenciasArray.map(c => c.nombre)
  });

  return competenciasArray;
}

/**
 * Procesa datos para comparativo de competencias con Nacional, Departamento, Municipio, Institución, Prueba
 * Basado en las areas de cada estudiante para generar comparativo similar a procesarCompetenciasUNAL
 */
export function procesarCompetenciasComparativo(simulationData: any) {
  // Extraer materias/subjects de los datos de simulación
  const subjects = extraerMateriasComparativo(simulationData);

  // Calcular promedios reales solo para 'Prueba'
  const promediosPrueba = calcularPromediosRealesTodas(simulationData, subjects);

  // Generar datos de tabla comparativa - Otros en 0, solo Prueba con datos reales
  const tableData = [
    {
      type: "nacional",
      label: "Nacional",
      year: "2024",
      values: subjects.map(() => 0) // En cero
    },
    {
      type: "departamento",
      label: "Departamento",
      year: "2024",
      values: subjects.map(() => 0) // En cero
    },
    {
      type: "municipio",
      label: "Municipio",
      year: "2024",
      values: subjects.map(() => 0) // En cero
    },
    {
      type: "institucion",
      label: "Institución",
      year: "2024",
      values: subjects.map(() => 0) // En cero
    },
    {
      type: "prueba",
      label: "Prueba",
      year: "2025 A",
      values: promediosPrueba // Datos reales calculados
    }
  ];

  // Generar datos para el gráfico
  const chartData = {
    labels: subjects,
    datasets: tableData.map(row => ({
      label: row.label,
      data: row.values,
      backgroundColor: getColorForTypeComparativo(row.type)
    }))
  };

  return {
    subjects: subjects,
    tableData: tableData,
    chartData: chartData,
    chartConfig: {
      yAxisMax: Math.max(...tableData.flatMap(row => row.values)) + 10,
      stepSize: 5
    },
    chartId: "comparativo_competencias"
  };
}

/**
 * Función auxiliar para extraer materias de simulationData para comparativo
 */
function extraerMateriasComparativo(simulationData: any): string[] {
  const materiasSet = new Set<string>();

  if (simulationData.students && simulationData.students.length > 0) {
    simulationData.students.forEach((student: any) => {
      if (student.examenes_asignados && student.examenes_asignados.length > 0) {
        student.examenes_asignados.forEach((examen: any) => {
          if (examen.materias && examen.materias.length > 0) {
            examen.materias.forEach((materia: any) => {
              if (materia.name) {
                materiasSet.add(materia.name);
              }
            });
          }
        });
      }
    });
  }

  // Si no se encuentran materias, usar materias por defecto
  if (materiasSet.size === 0) {
    return ["Matemáticas", "Lectura Crítica", "Sociales y Ciudadanas", "Ciencias Naturales", "Inglés"];
  }

  return Array.from(materiasSet).sort();
}

/**
 * Función auxiliar para calcular promedios reales de todas las materias
 */
function calcularPromediosRealesTodas(simulationData: any, subjects: string[]): number[] {
  return subjects.map(subject => {
    let totalScore = 0;
    let count = 0;

    if (simulationData.students && simulationData.students.length > 0) {
      simulationData.students.forEach((student: any) => {
        if (student.examenes_asignados && student.examenes_asignados.length > 0) {
          student.examenes_asignados.forEach((examen: any) => {
            if (examen.materias && examen.materias.length > 0) {
              const materia = examen.materias.find((m: any) => m.name === subject);
              if (materia && materia.porcentaje !== undefined) {
                totalScore += parseFloat(materia.porcentaje) || 0;
                count++;
              }
            }
          });
        }
      });
    }

    return count > 0 ? Math.round(totalScore / count) : 65;
  });
}

/**
 * Función auxiliar para obtener colores por tipo en comparativo
 */
function getColorForTypeComparativo(type: string): string {
  const colorMap: { [key: string]: string } = {
    nacional: "#d88008",
    departamento: "#bd5785",
    municipio: "#4b3e7a",
    institucion: "#27a1db",
    prueba: "#4c8631"
  };
  return colorMap[type] || "#333";
}

/**
 * Procesa datos para generar gráficos bar_chart_with_title por asignatura
 * Calcula porcentajes de respuestas correctas por asignatura y los categoriza en rangos
 * Usa detailQuestion para obtener la asignatura correcta de cada pregunta
 */
export function procesarPromediosDynamic(simulationData: any, ranges: Array<{ min: number, max: number, label: string }> = [
  { min: 0, max: 35, label: '1' },
  { min: 36, max: 50, label: '2' },
  { min: 51, max: 65, label: '3' },
  { min: 66, max: 100, label: '4' }
], type: string = 'asignatura') {
  let chartCounter = 0; // Contador para IDs únicos

  const asignaturasData: any = {};

  // Crear mapa de preguntas para acceso rápido por ID
  const questionMap: any = {};
  if (simulationData.detailQuestion && simulationData.detailQuestion.length > 0) {
    simulationData.detailQuestion.forEach((question: any) => {
      questionMap[question.id] = question;
    });
  }

  // Procesar cada estudiante
  simulationData.students.forEach((student: any) => {
    const examen_asignado = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationData.simulationId
    );

    if (!examen_asignado || !examen_asignado.respuesta_sesion) return;

    // Analizar respuestas del estudiante para determinar asignaturas
    const asignaturasEstudiante: any = {};

    // Limitar a máximo 2 sesiones
    const sessionesToProcess = examen_asignado.respuesta_sesion.slice(0, 2);
    sessionesToProcess.forEach((sesion: any) => {
      if (!sesion.respuestas) return;

      sesion.respuestas.forEach((respuesta: any) => {
        const question = questionMap[respuesta.id_pregunta];
        if (!question) return;

        const asignatura = question[type] || 'Sin clasificar';

        // Inicializar asignatura para este estudiante si no existe
        if (!asignaturasEstudiante[asignatura]) {
          asignaturasEstudiante[asignatura] = {
            correctAnswers: 0,
            totalQuestions: 0
          };
        }

        // Contar pregunta y si es correcta
        asignaturasEstudiante[asignatura].totalQuestions++;
        if (respuesta.es_correcta) {
          asignaturasEstudiante[asignatura].correctAnswers++;
        }
      });
    });

    // Procesar cada asignatura del estudiante
    Object.keys(asignaturasEstudiante).forEach(asignatura => {
      const data = asignaturasEstudiante[asignatura];

      // Calcular porcentaje de respuestas correctas
      const porcentajeCorrectas = data.totalQuestions > 0
        ? Math.round((data.correctAnswers / data.totalQuestions) * 100 * 10) / 10
        : 0;

      // Inicializar asignatura global si no existe
      if (!asignaturasData[asignatura]) {
        asignaturasData[asignatura] = {
          estudiantes: [],
          totalEstudiantes: 0
        };
      }

      // Agregar datos del estudiante
      asignaturasData[asignatura].estudiantes.push({
        studentId: student.id,
        porcentajeCorrectas: porcentajeCorrectas,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions
      });

      asignaturasData[asignatura].totalEstudiantes++;
    });
  });

  // Generar datos para cada asignatura
  const chartsData = Object.keys(asignaturasData).map(asignatura => {
    const data = asignaturasData[asignatura];

    // Categorizar estudiantes por rangos
    const rangeStats = ranges.map(range => ({
      ...range,
      count: 0,
      percentage: 0
    }));

    // Contar estudiantes en cada rango
    data.estudiantes.forEach((estudiante: any) => {
      const porcentaje = estudiante.porcentajeCorrectas;
      for (const range of rangeStats) {
        if (porcentaje >= range.min && porcentaje <= range.max) {
          range.count++;
          break;
        }
      }
    });
    // Calcular porcentajes
    rangeStats.forEach(range => {
      range.percentage = data.totalEstudiantes > 0
        ? Math.round((range.count / data.totalEstudiantes) * 100 * 10) / 10
        : 0;
    });

    // Generar estructura para bar_chart_with_title
    return {
      type: "bar_chart_with_title",
      data: {
        title: asignatura,
        chartId: generateUniqueChartId([asignatura, 'chart'], chartCounter++),
        ranges: rangeStats.map(range => ({
          percentage: range.percentage,
          count: range.count
        })),
        chartData: {
          values: rangeStats.map(range => range.percentage)
        }
      }
    };
  });



  return chartsData;
}

/**
 * ===== FUNCIONES ESPECÍFICAS PARA GENERAR PÁGINAS UDEA =====
 */

/**
 * Genera páginas de competencias UDEA específicas (múltiples páginas)
 */
export function generarPaginasCompetenciasUDEA(simulationData: any, baseHeaderInfo: any): import('../types/index').PageRequest[] {
  const competenciasData = procesarDistribucionCompetencias(simulationData);

  const competenciasRanges = [
    { min: 0, max: 35, label: 'I' },
    { min: 36, max: 75, label: 'II' },
    { min: 76, max: 100, label: 'III' }
  ];
  const competenciasLabels = ['I', 'II', 'III'];
  const competenciasColors = ['#c55c5c', '#d88008', '#58a55c'];

  const { barChartDataGroupedByArea } = calcularEstadisticasCompetenciasDynamic(
    competenciasData,
    competenciasRanges,
    competenciasLabels,
    competenciasColors
  );

  const competenciasPages: import('../types/index').PageRequest[] = [];

  for (const chars of barChartDataGroupedByArea) {
    const competenciaPage: import('../types/index').PageRequest = {
      layout: "horizontal",
      chartTitle: "Distribución de estudiantes por competencias consolidadas por prueba",
      subTitle: chars.charts[0].area,
      headerInfo: baseHeaderInfo,
      components: chars.charts
    };

    competenciasPages.push(competenciaPage);
  }

  return competenciasPages;
}

/**
 * Genera páginas de áreas UDEA reutilizables (múltiples páginas)
 */
export function generarPaginasAreasUDEA(simulationData: any, baseHeaderInfo: any): import('../types/index').PageRequest[] {
  const areaData = procesarDesempenoPorArea(simulationData);

  const areasRanges = [
    { min: 0, max: 35, label: 'Insuficiente' },
    { min: 36, max: 50, label: 'Mínimo' },
    { min: 51, max: 65, label: 'Satisfactorio' },
    { min: 66, max: 100, label: 'Avanzado' }
  ];
  const areasColors = ['#c55c5c', '#d88008', '#58a55c', '#4c8631'];

  const { scoreDistributionData } = calcularEstadisticasAreaDynamic(areaData, areasRanges, areasColors);

  const areasPages: import('../types/index').PageRequest[] = [];

  for (const chart of scoreDistributionData.data.subjects) {
    const areaPage: import('../types/index').PageRequest = {
      layout: "horizontal",
      chartTitle: "Desempeño por Área",
      headerInfo: baseHeaderInfo,
      components: [{
        type: "score_distribution_horizontal",
        data: {
          subjects: [chart]
        }
      }]
    };
    areasPages.push(areaPage);
  }

  return areasPages;
}

/**
 * Genera páginas de análisis de dificultad UDEA reutilizables (múltiples páginas)
 */
export function generarPaginasAnalisisDificultadUDEA(simulationData: any, baseHeaderInfo: any): import('../types/index').PageRequest[] {
  const tablaEstudiantesDataArray = procesarTablaEstudiantes(simulationData);
  const tablaEstudiantesData = tablaEstudiantesDataArray[0]; // Usar la primera tabla para análisis
  const tablaDificultadData = procesarTablaDificultadAnalisis(simulationData);

  const tablaAnalisisData = generarDatosTablaDificultad(
    tablaDificultadData,
    undefined,
    tablaEstudiantesData.data.indiceDificultadPorCompetencia
  );

  const analisisPages: import('../types/index').PageRequest[] = [];

  for (const tabla of tablaAnalisisData) {
    const analisisPage: import('../types/index').PageRequest = {
      layout: "vertical",
      chartTitle: "Análisis de Dificultad",
      headerInfo: baseHeaderInfo,
      components: [tabla]
    };

    analisisPages.push(analisisPage);
  }

  return analisisPages;
}

/**
 * Genera página de estudiantes UDEA reutilizable
 */
export function generarPaginaEstudiantesUDEA(simulationData: any, baseHeaderInfo: any): import('../types/index').PageRequest[] {
  const tablaEstudiantesDataArray = procesarTablaEstudiantes(simulationData);

  return tablaEstudiantesDataArray.map((tablaData, index) => ({
    layout: "vertical",
    chartTitle: tablaEstudiantesDataArray.length > 1
      ? `Tabla de Estudiantes (Página ${index + 1} de ${tablaEstudiantesDataArray.length})`
      : "Tabla de Estudiantes",
    headerInfo: baseHeaderInfo,
    components: [tablaData]
  }));
}