/**
 * Utility functions to process simulation data for Excel report generation
 * Refactored to work with AREAS instead of COMPETENCIAS
 */

interface StudentExcelData {
  nombre: string;
  documento: string;
  grupo: string;
  puntajeTotal: number;
  posicion: number;
  categoria: number; // 1, 2, 3, 4
  areas: { [key: string]: number }; // Puntajes por área
}

interface ExcelDataStructure {
  areasUnicas: string[];
  estudiantes: StudentExcelData[];
  metadata: {
    campus: string;
    curso: string;
    programa: string;
    codigo: string;
    totalEstudiantes: number;
  };
  estadisticas: {
    promedios: { [key: string]: number }; // Promedio por área + total
    desviaciones: { [key: string]: number }; // Desviación estándar por área + total
  };
}

/**
 * Categoriza el puntaje del estudiante según rangos (retorna número 1-4)
 */
function categorizarPuntajeNumerico(porcentaje: number): number {
  if (porcentaje >= 0 && porcentaje <= 35) return 1; // Insuficiente
  if (porcentaje >= 36 && porcentaje <= 50) return 2; // Mínimo
  if (porcentaje >= 51 && porcentaje <= 65) return 3; // Satisfactorio
  if (porcentaje >= 66) return 4; // Avanzado
  return 1;
}

/**
 * Extrae todas las áreas únicas del conjunto de datos
 */
function extraerAreasUnicas(simulationData: any): string[] {
  const areasSet = new Set<string>();

  if (!simulationData.students || simulationData.students.length === 0) {
    return [];
  }

  simulationData.students.forEach((student: any) => {
    if (student.examenes_asignados && student.examenes_asignados.length > 0) {
      student.examenes_asignados.forEach((examen: any) => {
        if (examen.materias && examen.materias.length > 0) {
          examen.materias.forEach((materia: any) => {
            if (materia.name) {
              areasSet.add(materia.name);
            }
          });
        }
      });
    }
  });

  // Ordenar alfabéticamente para consistencia
  return Array.from(areasSet).sort();
}

/**
 * Procesa los datos de un estudiante individual
 */
function procesarEstudiante(student: any, areasUnicas: string[], nombreCurso: string, results: any): StudentExcelData {
  const examenData = student.examenes_asignados && student.examenes_asignados.length > 0
    ? student.examenes_asignados[0]
    : null;

  // Extraer datos básicos
  const nombre = student.name || 'Sin nombre';
  const documento = student.document || 'Sin documento';
  const grupo = nombreCurso || 'Sin grupo'; // Usar el nombre del curso del nivel superior

  // Buscar el puntaje y posición en results usando el ID del estudiante
  const studentId = student.id;
  const resultData = results[studentId];
  console.log({examenData,resultData});
  
  const puntajeTotal = resultData?.score ;
  const posicion = resultData?.position || examenData?.position || 0;

  // Extraer porcentajes/puntajes por área
  const areas: { [key: string]: number } = {};

  // Inicializar todas las áreas en 0
  areasUnicas.forEach(area => {
    areas[area] = 0;
  });

  // Llenar con los valores reales de las materias
  if (examenData && examenData.materias) {
    examenData.materias.forEach((materia: any) => {
      if (materia.name) {
        // Usar el porcentaje de la materia como puntaje
        const puntaje = parseFloat(materia.porcentaje) || 0;
        areas[materia.name] = puntaje;
      }
    });
  }

  // Calcular porcentaje promedio para categorización
  const valores = Object.values(areas).filter(v => v > 0);
  const porcentajePromedio = valores.length > 0
    ? valores.reduce((a: number, b: number) => a + b, 0) / valores.length
    : 0;

  return {
    nombre,
    documento,
    grupo,
    puntajeTotal,
    posicion,
    categoria: categorizarPuntajeNumerico(porcentajePromedio),
    areas
  };
}

/**
 * Calcula el promedio de un array de números
 */
function calcularPromedio(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/**
 * Calcula la desviación estándar de un array de números
 */
function calcularDesviacionEstandar(valores: number[]): number {
  if (valores.length === 0) return 0;

  const promedio = calcularPromedio(valores);
  const sumaCuadrados = valores.reduce((acc, val) => {
    return acc + Math.pow(val - promedio, 2);
  }, 0);

  return Math.sqrt(sumaCuadrados / valores.length);
}

/**
 * Calcula estadísticas (promedios y desviaciones estándar)
 */
function calcularEstadisticas(estudiantes: StudentExcelData[], areasUnicas: string[]) {
  const promedios: { [key: string]: number } = {};
  const desviaciones: { [key: string]: number } = {};

  // Promedio y desviación del puntaje total
  const puntajesTotales = estudiantes.map(e => e.puntajeTotal);
  promedios['TOTAL'] = calcularPromedio(puntajesTotales);
  desviaciones['TOTAL'] = calcularDesviacionEstandar(puntajesTotales);

  // Promedio y desviación por cada área
  areasUnicas.forEach(area => {
    const puntajesArea = estudiantes.map(e => e.areas[area] || 0);
    promedios[area] = calcularPromedio(puntajesArea);
    desviaciones[area] = calcularDesviacionEstandar(puntajesArea);
  });

  return { promedios, desviaciones };
}

/**
 * Verifica si un estudiante tiene todas las áreas en 0 (no estuvo presente)
 */
function estudianteEstaAusente(estudiante: StudentExcelData): boolean {
  const valoresAreas = Object.values(estudiante.areas);
  return valoresAreas.every(valor => valor === 0);
}

/**
 * Filtra áreas donde todos los estudiantes tienen 0 (área no evaluada)
 */
function filtrarAreasValidas(estudiantes: StudentExcelData[], areasUnicas: string[]): string[] {
  return areasUnicas.filter(area => {
    // Verificar si al menos un estudiante tiene un valor > 0 en esta área
    return estudiantes.some(est => (est.areas[area] || 0) > 0);
  });
}

/**
 * Procesa todos los datos de simulación para generar la estructura de Excel
 */
export function procesarDatosParaExcel(simulationData: any): ExcelDataStructure {
  // Extraer áreas únicas
  const areasUnicasIniciales = extraerAreasUnicas(simulationData);

  // Obtener nombre del curso del nivel superior
  const nombreCurso = simulationData.course || 'Sin curso';

  // Obtener results para mapeo de puntajes
  const results = simulationData.results || {};

  // Procesar cada estudiante
  let estudiantes = simulationData.students.map((student: any) =>
    procesarEstudiante(student, areasUnicasIniciales, nombreCurso, results)
  );

  // FILTRO 1: Eliminar estudiantes que tienen todas las áreas en 0 (ausentes)
  const estudiantesPresentes = estudiantes.filter((est: StudentExcelData) => !estudianteEstaAusente(est));

  // FILTRO 2: Eliminar áreas donde todos los estudiantes tienen 0 (no evaluadas)
  const areasUnicas = filtrarAreasValidas(estudiantesPresentes, areasUnicasIniciales);

  // Actualizar las áreas de cada estudiante para solo incluir las válidas
  estudiantesPresentes.forEach((est: StudentExcelData) => {
    const areasActualizadas: { [key: string]: number } = {};
    areasUnicas.forEach(area => {
      areasActualizadas[area] = est.areas[area] || 0;
    });
    est.areas = areasActualizadas;
  });

  // Ordenar estudiantes por posición
  estudiantesPresentes.sort((a: StudentExcelData, b: StudentExcelData) => a.posicion - b.posicion);

  // Calcular estadísticas con estudiantes presentes y áreas válidas
  const estadisticas = calcularEstadisticas(estudiantesPresentes, areasUnicas);

  // Metadata del reporte
  const metadata = {
    campus: simulationData.campus || 'Sin campus',
    curso: simulationData.course || 'Sin curso',
    programa: simulationData.programName || 'Sin programa',
    codigo: simulationData.code || 'Sin código',
    totalEstudiantes: estudiantesPresentes.length // Solo contar estudiantes presentes
  };

  return {
    areasUnicas, // Solo áreas con datos
    estudiantes: estudiantesPresentes, // Solo estudiantes que estuvieron presentes
    metadata,
    estadisticas
  };
}

/**
 * Calcula estadísticas generales del reporte (mantenido para compatibilidad)
 */
export function calcularEstadisticasGenerales(estudiantes: StudentExcelData[]) {
  if (estudiantes.length === 0) {
    return {
      puntajePromedio: 0,
      puntajeMaximo: 0,
      puntajeMinimo: 0,
      categorias: { 1: 0, 2: 0, 3: 0, 4: 0 }
    };
  }

  const puntajes = estudiantes.map(e => e.puntajeTotal);
  const puntajePromedio = calcularPromedio(puntajes);
  const puntajeMaximo = Math.max(...puntajes);
  const puntajeMinimo = Math.min(...puntajes);

  const categorias = estudiantes.reduce((acc, est) => {
    const cat = est.categoria;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  return {
    puntajePromedio,
    puntajeMaximo,
    puntajeMinimo,
    categorias
  };
}
