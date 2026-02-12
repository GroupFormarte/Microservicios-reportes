/**
 * Report Consolidation Service
 * Consolida múltiples reportes de report_data en una estructura unificada
 */

import { platform } from 'os';
import { RaschCalculator, RaschResult } from './raschCalculator';
import { UdeaGradingSystem, UdeaResult } from './udeaGrading';

interface DetailQuestion {
  id: string;
  cod?: string;
  componente?: string;
  competencia?: string;
  periodo?: string;
  id_recurso?: string | null;
  nameUser?: string;
  eje_tematico?: string;
  grado?: string;
  programa?: string;
  area?: string;
  status?: boolean;
  id_material_refuerzo?: string | null;
  asignatura?: string;
  tipo?: string | null;
  tipo_platform?: string;
  created?: string;
  cant_respuesta?: string;
  pregunta?: string;
  pregunta_correcta?: string;
  question_depend_others?: string;
  respuestas?: string[];
}

interface Result {
  position: number;
  score: number;
  totalStudents: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswered: number;
}

interface Student {
  id: string;
  id_estudiante?: string;
  id_campus?: string;
  course_id?: string;
  document?: string;
  program_id?: string | null;
  examenes_asignados?: any[];
  promedio?: any;
  evaluaciones?: any;
  proceso?: any;
  name?: string;
}

interface ReportDocument {
  campus?: string;
  course?: string;
  simulationId?: string;
  idInstitute?: string;
  programName?: string;
  code?: string;
  id_campus?: string;
  tipe_inform?: string;
  examDate?: string;
  detailQuestion?: DetailQuestion[];
  results?: { [studentId: string]: Result };
  students?: Student[];
}

interface ConsolidatedData {
  students: Student[];
  detailQuestion: DetailQuestion[];
  metadata: {
    campus?: string;
    course?: string;
    simulationId?: string;
    idInstitute?: string;
    programName?: string;
    code?: string;
    id_campus?: string;
    tipe_inform?: string;
    examDate?: string;
  };
  originalResults?: { [studentId: string]: Result };
}

export class ReportConsolidationService {
  /**
   * Consolida múltiples reportes en una estructura unificada
   */
  static consolidateReports(
    reportDocuments: ReportDocument[],
    simulationIdFilter?: string
  ): ConsolidatedData {
    if (reportDocuments.length === 0) {
      throw new Error('No report documents provided');
    }

    // 1. Extraer metadata del primer documento
    const firstDoc = reportDocuments[0];
    const metadata = {
      campus: firstDoc.campus,
      course: firstDoc.course,
      simulationId: simulationIdFilter || firstDoc.simulationId,
      idInstitute: firstDoc.idInstitute,
      programName: firstDoc.programName,
      code: firstDoc.code,
      id_campus: firstDoc.id_campus,
      tipe_inform: firstDoc.tipe_inform,
      examDate: firstDoc.examDate,
    };

    // 2. Consolidar estudiantes únicos
    const studentMap = new Map<string, Student>();
    const originalResultsMap: { [studentId: string]: Result } = {};

    for (const doc of reportDocuments) {
      const students = doc.students || [];

      for (const student of students) {
        if (!student.id) continue;

        if (studentMap.has(student.id)) {
          // Estudiante ya existe, combinar examenes_asignados
          const existingStudent = studentMap.get(student.id)!;
          const existingExams = existingStudent.examenes_asignados || [];
          const newExams = student.examenes_asignados || [];

          // Filtrar exámenes según simulationId si es necesario
          let examsToAdd = newExams;
          if (simulationIdFilter) {
            examsToAdd = newExams.filter((exam: any) => {
              const examId = exam.idSimulacro || exam.id_simulacro;
              return examId === simulationIdFilter;
            });
          }

          // Combinar evitando duplicados
          const combinedExams = [...existingExams];
          for (const newExam of examsToAdd) {
            const examId = newExam.idSimulacro || newExam.id_simulacro;
            const alreadyExists = existingExams.some((e: any) => {
              const eId = e.idSimulacro || e.id_simulacro;
              return eId === examId;
            });
            if (!alreadyExists) {
              combinedExams.push(newExam);
            }
          }

          existingStudent.examenes_asignados = combinedExams;
        } else {
          // Nuevo estudiante
          let studentCopy = { ...student };

          // Filtrar examenes_asignados si viene simulationId
          if (simulationIdFilter) {
            const exams = student.examenes_asignados || [];
            studentCopy.examenes_asignados = exams.filter((exam: any) => {
              const examId = exam.idSimulacro || exam.id_simulacro;
              return examId === simulationIdFilter;
            });
          }

          studentMap.set(student.id, studentCopy);
        }

        // Guardar result original si existe
        if (doc.results && doc.results[student.id]) {
          // Si no hay simulationIdFilter, guardar el mejor result
          if (!simulationIdFilter) {
            const currentResult = doc.results[student.id];
            const existingResult = originalResultsMap[student.id];

            if (!existingResult || currentResult.score > existingResult.score) {
              originalResultsMap[student.id] = currentResult;
            }
          } else {
            // Con simulationIdFilter, guardar el result específico
            originalResultsMap[student.id] = doc.results[student.id];
          }
        }
      }
    }

    // 3. Consolidar detailQuestion únicos
    const questionMap = new Map<string, DetailQuestion>();

    for (const doc of reportDocuments) {
      const questions = doc.detailQuestion || [];

      for (const question of questions) {
        if (!question.id) continue;
        if (!questionMap.has(question.id)) {
          questionMap.set(question.id, question);
        }
      }
    }

    return {
      students: Array.from(studentMap.values()),
      detailQuestion: Array.from(questionMap.values()),
      metadata,
      originalResults: originalResultsMap,
    };
  }

  /**
   * Recalcula los resultados según el tipo de informe
   */
  static recalculateResults(
    consolidatedData: ConsolidatedData,
    withSimulationId: boolean
  ): { [studentId: string]: Result } {
    const { students, metadata, originalResults } = consolidatedData;
    const tipeInform = metadata.tipe_inform;
    const simulationId = metadata.simulationId;

    if (!simulationId) {
      throw new Error('simulationId is required for recalculation');
    }

    const results: { [studentId: string]: Result } = {};

    // Caso 1: CON simulationId - Recalcular completamente
    if (withSimulationId) {
      if (tipeInform === 'saber' || tipeInform === 'unal') {
        // Usar Rasch
        for (const student of students) {
          const raschResult: RaschResult = RaschCalculator.calculateRasch(
            students,
            student,
            simulationId,
            { platformType: tipeInform }
          );

          results[student.id] = {
            position: raschResult.position,
            score: raschResult.score,
            totalStudents: raschResult.totalStudents,
            correctAnswers: raschResult.correctAnswers,
            incorrectAnswers: raschResult.incorrectAnswers,
            totalAnswered: raschResult.totalAnswered,
          };
        }
      } else if (tipeInform === 'udea') {
        // Usar UdeA Grading
        const udeaGrading = new UdeaGradingSystem();

        for (const student of students) {
          const udeaResult: UdeaResult = udeaGrading.evaluateSingleStudent(
            students,
            student,
            simulationId
          );

          results[student.id] = {
            position: udeaResult.position,
            score: udeaResult.score,
            totalStudents: udeaResult.totalStudents,
            correctAnswers: udeaResult.correctAnswers,
            incorrectAnswers: udeaResult.incorrectAnswers,
            totalAnswered: udeaResult.totalAnswered,
          };
        }
      }
    } else {
      // Caso 2: SIN simulationId - Solo recalcular posiciones
      if (!originalResults) {
        throw new Error('Original results are required for position recalculation');
      }

      // Crear array de estudiantes con sus mejores scores
      const studentsWithScores = students
        .map((student) => ({
          student,
          result: originalResults[student.id],
        }))
        .filter((item) => item.result !== undefined);

      // Ordenar por score descendente
      studentsWithScores.sort((a, b) => b.result.score - a.result.score);

      // Asignar nuevas posiciones
      const totalStudents = studentsWithScores.length;

      studentsWithScores.forEach((item, index) => {
        results[item.student.id] = {
          ...item.result,
          position: index + 1,
          totalStudents,
        };
      });
    }

    return results;
  }

  /**
   * Genera el JSON final en formato compatible con processSimulationData
   */
  static generateFinalReport(
    consolidatedData: ConsolidatedData,
    results: { [studentId: string]: Result }
  ): any {
    const { students, detailQuestion, metadata } = consolidatedData;

    return {
      campus: metadata.campus,
      course: metadata.course,
      simulationId: metadata.simulationId,
      idInstitute: metadata.idInstitute,
      programName: metadata.programName,
      code: metadata.code,
      id_campus: metadata.id_campus,
      tipe_inform: metadata.tipe_inform,
      examDate: metadata.examDate,
      detailQuestion,
      results,
      students,
    };
  }
}
