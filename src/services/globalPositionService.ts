/**
 * Global Position Service
 * Calcula posiciones globales (puesto por grado) consultando ReportData
 * Usa la misma lógica de recálculo que regenerateReport (RaschCalculator/UdeaGradingSystem)
 */

import { ReportData } from '../models/ReportData';
import { ReportConsolidationService } from './reportConsolidation';
import { logger } from '../utils/logger';

export interface GlobalPositionResult {
  studentId: string;
  puestoGrado: number;
  puestoGrupo: number;
  scoreGlobal: number;
  totalEstudiantesGlobal: number;
}

export interface GlobalPositionsMap {
  [studentId: string]: GlobalPositionResult;
}

export class GlobalPositionService {
  /**
   * Calcula las posiciones globales para todos los estudiantes de un instituto
   * Esto se usa cuando se llama directamente a processSimulationData (sin regenerateReport)
   *
   * USA LA MISMA LÓGICA QUE regenerateReport:
   * - Consolida estudiantes de ReportData
   * - Recalcula resultados con RaschCalculator (saber/unal) o UdeaGradingSystem (udea)
   * - Retorna posiciones globales
   *
   * @param idInstitute - ID del instituto
   * @param tipeInform - Tipo de informe (udea, unal, saber)
   * @param simulationId - ID de la simulación
   * @param currentStudents - Estudiantes actuales del request
   * @param fechaInicio - Fecha inicio opcional para filtrar
   * @param fechaFin - Fecha fin opcional para filtrar
   */
  static async calculateGlobalPositions(
    idInstitute: string,
    tipeInform: string,
    simulationId: string,
    currentStudents: any[],
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<GlobalPositionsMap> {

    logger.info('Calculating global positions with recalculation', {
      idInstitute,
      tipeInform,
      simulationId,
      currentStudentsCount: currentStudents.length
    });

    try {
      // 1. Construir filtro para consultar ReportData
      const filter: any = {
        idInstitute,
        tipe_inform: tipeInform
      };

      // Agregar filtro de simulationId si existe
      if (simulationId) {
        filter.simulationId = simulationId;
      }

      // Agregar filtro de fechas si existen
      if (fechaInicio && fechaFin) {
        filter.examDate = {
          $gte: fechaInicio,
          $lte: fechaFin
        };
      }

      // 2. Consultar todos los documentos de ReportData que coincidan
      logger.info('========== QUERYING REPORTDATA ==========');
      logger.info(`Filter: ${JSON.stringify(filter)}`);

      const reportDocuments = await ReportData.find(filter).lean();

      logger.info(`Found ${reportDocuments.length} report documents for global position calculation`);

      // LOG: Mostrar info de cada documento encontrado
      reportDocuments.forEach((doc, idx) => {
        logger.info(`Doc[${idx}]: simulationId=${doc.simulationId}, students=${doc.students?.length || 0}, campus=${doc.campus}, course=${doc.course}`);
      });
      logger.info('========== END QUERYING REPORTDATA ==========');

      // 3. Normalizar documentos (igual que en regenerateReport)
      const normalizedDocs = reportDocuments.map(doc => {
        const resultsObj: any = {};
        if (doc.results && doc.results instanceof Map) {
          doc.results.forEach((value, key) => {
            resultsObj[key] = value;
          });
        } else if (doc.results) {
          Object.assign(resultsObj, doc.results);
        }

        // Normalizar examDate
        let normalizedExamDate: string | undefined;
        if (doc.examDate) {
          if (typeof doc.examDate === 'string') {
            normalizedExamDate = doc.examDate;
          } else if (doc.examDate instanceof Date) {
            normalizedExamDate = doc.examDate.toISOString();
          }
        }

        return {
          ...doc,
          examDate: normalizedExamDate,
          results: Object.keys(resultsObj).length > 0 ? resultsObj : undefined
        };
      });

      // 4. Agregar estudiantes actuales como un documento virtual
      // para que se incluyan en la consolidación
      const currentDoc = {
        idInstitute,
        tipe_inform: tipeInform,
        simulationId,
        students: currentStudents,
        detailQuestion: [] // Se obtendrá de los documentos existentes
      };

      const allDocs = [...normalizedDocs, currentDoc as any];

      // 5. Consolidar datos usando ReportConsolidationService (igual que regenerateReport)
      const consolidatedData = ReportConsolidationService.consolidateReports(
        allDocs,
        simulationId
      );

      logger.info('Data consolidated for global positions', {
        students: consolidatedData.students.length,
        questions: consolidatedData.detailQuestion.length
      });

      // 6. Recalcular resultados usando RaschCalculator/UdeaGradingSystem (igual que regenerateReport)
      const withSimulationId = !!simulationId;
      const results = ReportConsolidationService.recalculateResults(
        consolidatedData,
        withSimulationId
      );

      logger.info('Results recalculated for global positions', {
        totalResults: Object.keys(results).length,
        withSimulationId
      });

      // 7. Convertir results a GlobalPositionsMap
      const globalPositions: GlobalPositionsMap = {};

      for (const student of consolidatedData.students) {
        if (!student.id) continue;

        const result = results[student.id];
        if (!result) continue;

        // Buscar posición del grupo desde examen_asignado
        const examenAsignado = student.examenes_asignados?.find((exam: any) =>
          exam.id_simulacro === simulationId || exam.idSimulacro === simulationId
        );

        const groupPosition = examenAsignado?.position || 0;

        globalPositions[student.id] = {
          studentId: student.id,
          puestoGrado: result.position,  // Posición global recalculada
          puestoGrupo: groupPosition,     // Posición original del grupo
          scoreGlobal: result.score,
          totalEstudiantesGlobal: result.totalStudents
        };
      }

      // LOG DETALLADO: Mostrar cada estudiante con sus posiciones
      logger.info('========== GLOBAL POSITIONS DEBUG (calculateGlobalPositions) ==========');
      for (const [studentId, pos] of Object.entries(globalPositions)) {
        logger.info(`Student ${studentId}: puestoGrado=${pos.puestoGrado}, puestoGrupo=${pos.puestoGrupo}, score=${pos.scoreGlobal}`);
      }
      logger.info('========== END GLOBAL POSITIONS DEBUG ==========');

      logger.info('Global positions calculated with recalculation', {
        totalStudents: Object.keys(globalPositions).length,
        tipeInform
      });

      return globalPositions;

    } catch (error) {
      logger.error('Error calculating global positions', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // En caso de error, retornar mapa vacío (se usará el comportamiento anterior)
      return {};
    }
  }

  /**
   * Extrae posiciones globales desde el campo results de simulationData
   * Esto se usa cuando viene de regenerateReport (ya tiene results calculados)
   *
   * @param results - Campo results de simulationData
   * @param students - Array de estudiantes
   * @param simulationId - ID de la simulación
   */
  static extractGlobalPositionsFromResults(
    results: { [studentId: string]: any },
    students: any[],
    simulationId: string
  ): GlobalPositionsMap {

    const globalPositions: GlobalPositionsMap = {};

    if (!results) {
      return globalPositions;
    }

    for (const student of students) {
      if (!student.id) continue;

      const result = results[student.id];
      if (!result) continue;

      // Buscar posición del grupo desde examen_asignado
      const examenAsignado = student.examenes_asignados?.find((exam: any) =>
        exam.id_simulacro === simulationId || exam.idSimulacro === simulationId
      );

      const groupPosition = examenAsignado?.position || 0;

      // LOG DEBUG: Ver todos los campos del examenAsignado para encontrar la posición original
      if (examenAsignado) {
        logger.info(`[extractGlobalPositionsFromResults] examenAsignado keys for ${student.id}: ${Object.keys(examenAsignado).join(', ')}`);
        logger.info(`[extractGlobalPositionsFromResults] examenAsignado.position=${examenAsignado.position}, examenAsignado.positionOriginal=${(examenAsignado as any).positionOriginal}, examenAsignado.posicion_grupo=${(examenAsignado as any).posicion_grupo}`);
      }

      globalPositions[student.id] = {
        studentId: student.id,
        puestoGrado: result.position,  // Posición global de results
        puestoGrupo: groupPosition,     // Posición del grupo original
        scoreGlobal: result.score,
        totalEstudiantesGlobal: result.totalStudents || Object.keys(results).length
      };
    }

    // LOG DETALLADO: Mostrar cada estudiante con sus posiciones
    logger.info('========== GLOBAL POSITIONS DEBUG (extractGlobalPositionsFromResults) ==========');
    for (const [studentId, pos] of Object.entries(globalPositions)) {
      logger.info(`Student ${studentId}: puestoGrado=${pos.puestoGrado}, puestoGrupo=${pos.puestoGrupo}, score=${pos.scoreGlobal}`);
    }
    logger.info('========== END GLOBAL POSITIONS DEBUG ==========');

    logger.info('Global positions extracted from results', {
      studentsWithPositions: Object.keys(globalPositions).length
    });

    return globalPositions;
  }
}
