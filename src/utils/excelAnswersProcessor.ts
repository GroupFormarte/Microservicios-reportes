/**
 * Utility functions to process simulation data for Excel answers report generation
 */

interface StudentAnswer {
  indexQuestion: number;
  letra: string;
  esCorrecta: boolean;
  codQuestion?: string;
}

interface StudentAnswersData {
  documento: string;
  nombre: string;
  respuestas: Map<number, StudentAnswer>; // Map de index_question -> respuesta
}

interface ExcelAnswersStructure {
  estudiantes: StudentAnswersData[];
  totalPreguntas: number;
  metadata: {
    campus: string;
    curso: string;
    programa: string;
    codigo: string;
    totalEstudiantes: number;
  };
}

/**
 * Extrae todas las respuestas de un estudiante de todas las sesiones
 * Sigue la misma lógica que procesarTablaDificultadAnalisis
 */
function extraerRespuestasEstudiante(student: any, simulationId: string): Map<number, StudentAnswer> {
  const respuestasMap = new Map<number, StudentAnswer>();

  if (!student.examenes_asignados || student.examenes_asignados.length === 0) {
    return respuestasMap;
  }

  // Buscar el examen que corresponde al simulationId
  let examen = null;


  

  if (simulationId) {
    examen = student.examenes_asignados.find((exam: any) =>
      exam.id_simulacro === simulationId
    );

  }

  // Si no encuentra por simulationId, tomar el primer examen
  if (!examen) {
    examen = student.examenes_asignados[0];
  }

  if (!examen || !examen.respuesta_sesion || examen.respuesta_sesion.length === 0) {
 
    return respuestasMap;
  }

  // Limitar a máximo 2 sesiones (igual que procesarTablaDificultadAnalisis)
  const sessionesToProcess = examen.respuesta_sesion.slice(0, 2);
console.log({sessionesToProcess});

  // Filtrar solo sesiones válidas (con respuestas)
  const sessionesToProcessAux: any[] = [];
  for (const session of sessionesToProcess) {
    if (session.respuestas !== null && session.respuestas !== undefined) {
      sessionesToProcessAux.push(session);
    }
  }

  // Procesar respuestas de las sesiones válidas
  // IMPORTANTE: Numerar las preguntas CONSECUTIVAMENTE entre sesiones
  // Sesión 1: preguntas 1-120, Sesión 2: preguntas 121-254
  let numeroPreguntaConsecutivo = 1;

  sessionesToProcessAux.forEach((session: any) => {
    session.respuestas.forEach((respuesta: any) => {
      // Usar número consecutivo en vez de index_question
      respuestasMap.set(numeroPreguntaConsecutivo, {
        indexQuestion: numeroPreguntaConsecutivo,
        letra: respuesta.letra || 'NR',
        esCorrecta: respuesta.es_correcta === true,
        codQuestion: respuesta.cod_question
      });

      numeroPreguntaConsecutivo++;
    });
  });

  console.log('Total respuestas en Map:', respuestasMap.size);


  return respuestasMap;
}

/**
 * Verifica si un estudiante tiene al menos una materia con valor > 0
 */
function verificarEstudianteTieneMaterias(student: any): boolean {
  if (!student.examenes_asignados || student.examenes_asignados.length === 0) {
    return false;
  }

  const examen = student.examenes_asignados[0];

  if (!examen.materias || examen.materias.length === 0) {
    return false;
  }

  // Verificar si al menos una materia tiene porcentaje > 0
  return examen.materias.some((materia: any) => {
    const porcentaje = parseFloat(materia.porcentaje) || 0;
    return porcentaje > 0;
  });
}

/**
 * Determina el número total de preguntas del simulacro
 * Suma todas las respuestas de las 2 sesiones del primer estudiante
 */
function obtenerTotalPreguntas(simulationData: any): number {
  // Contar el total de preguntas sumando todas las respuestas de las 2 sesiones
  let totalPreguntas = 0;

  if (simulationData.students && simulationData.students.length > 0) {
    const simulationId = simulationData.simulationId || '';
    const student = simulationData.students[0];

    if (student.examenes_asignados && student.examenes_asignados.length > 0) {
      let examen = null;

      if (simulationId) {
        examen = student.examenes_asignados.find((exam: any) =>
          exam.id_simulacro === simulationId
        );
      }

      if (!examen) {
        examen = student.examenes_asignados[0];
      }

      if (examen && examen.respuesta_sesion) {
        const sessionesToProcess = examen.respuesta_sesion.slice(0, 2);

        sessionesToProcess.forEach((sesion: any) => {
          if (sesion.respuestas && sesion.respuestas !== null) {
            totalPreguntas += sesion.respuestas.length;
          }
        });
      }
    }
  }

  return totalPreguntas;
}
/**
 * Procesa todos los datos de simulación para generar el Excel de respuestas
 */
export function procesarDatosParaExcelRespuestas(simulationData: any): ExcelAnswersStructure {
  const totalPreguntas = obtenerTotalPreguntas(simulationData);
  const simulationId = simulationData.simulationId || '';

  console.log('📊 Total de preguntas calculado:', totalPreguntas);
  console.log('🆔 Simulation ID:', simulationId);

  // Procesar cada estudiante
  const estudiantes: StudentAnswersData[] = [];

  if (simulationData.students && simulationData.students.length > 0) {
    simulationData.students.forEach((student: any) => {
      // Verificar si el estudiante tiene al menos una materia con valor > 0
      // (mismo criterio que Excel de Puntajes)
      const tieneAlMenosUnaMateria = verificarEstudianteTieneMaterias(student);

      // Solo procesar estudiantes que tengan al menos una materia
      if (tieneAlMenosUnaMateria) {
        const respuestasMap = extraerRespuestasEstudiante(student, simulationId);

        estudiantes.push({
          documento: student.document || 'Sin documento',
          nombre: student.name || 'Sin nombre',
          respuestas: respuestasMap
        });

  
        
      }
    });
  }

  // Metadata del reporte
  const metadata = {
    campus: simulationData.campus || 'Sin campus',
    curso: simulationData.course || 'Sin curso',
    programa: simulationData.programName || 'Sin programa',
    codigo: simulationData.code || 'Sin código',
    totalEstudiantes: estudiantes.length
  };

  return {
    estudiantes,
    totalPreguntas,
    metadata
  };
}

/**
 * Genera un array ordenado de índices de preguntas (1, 2, 3, ..., n)
 * Estos son los números que se mostrarán en el header del Excel
 */
export function generarIndicesPreguntas(totalPreguntas: number): number[] {
  return Array.from({ length: totalPreguntas }, (_, i) => i + 1);
}
