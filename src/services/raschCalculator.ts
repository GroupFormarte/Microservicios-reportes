/**
 * Rasch Calculator Service
 * Implementa el modelo de Rasch usando JMLE (Joint Maximum Likelihood Estimation)
 * para calcular habilidades de estudiantes y dificultades de preguntas
 */

interface Answer {
  questionId?: string;
  id_pregunta?: string;
  answerId?: string;
  id_respuesta?: string;
  isCorrect?: boolean;
  es_correcta?: boolean;
  competence?: string;
  cod_question?: string;
  letra?: string;
  number_session?: string;
  index_question?: string;
}

interface SessionResponse {
  session: number;
  answers?: Answer[];
  respuestas?: Answer[];
  status: boolean;
  tiempo_trancurrido?: string;
}

interface AssignedExam {
  index?: number;
  idSimulacro?: string;
  id_simulacro?: string;
  score?: number;
  position?: number;
  sessionResponses?: SessionResponse[];
  respuesta_sesion?: SessionResponse[];
  materias?: any[];
}

interface Student {
  id?: string;
  id_estudiante?: string;
  id_campus?: string;
  course_id?: string;
  document?: string;
  program_id?: string | null;
  assignedExams?: AssignedExam[];
  examenes_asignados?: AssignedExam[];
  promedio?: any;
  evaluaciones?: any;
  proceso?: any;
  name?: string;
}

export interface RaschResult {
  position: number;
  score: number;
  totalStudents: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswered: number;
  questionDifficulties: {
    [questionId: string]: {
      numericDifficulty: number;
      textDifficulty: string;
    };
  };
}

const NON_RESPONSE_THETA = -9999.0;

export class RaschCalculator {
  /**
   * Calcula el modelo de Rasch para un conjunto de estudiantes
   */
  static calculateRasch(
    students: Student[],
    targetStudent: Student,
    idSimulacro: string,
    options: {
      maxIterations?: number;
      tolerance?: number;
    } = {}
  ): RaschResult {
    const { maxIterations = 20, tolerance = 1e-6 } = options;

    // 1) Crear índices para estudiantes y preguntas
    const studentIndex = this.createStudentIndex(students);
    const questionIds = this.extractQuestionIds(students, idSimulacro);
    const nStudents = students.length;
    const nItems = questionIds.length;
    const questionIndex = this.createQuestionIndex(questionIds);

    // 2) Construir matriz de respuestas (1, 0, -1)
    const responseMatrix = this.buildResponseMatrix(
      students,
      studentIndex,
      questionIndex,
      idSimulacro,
      nStudents,
      nItems
    );

    // 3) Inicializar thetas (habilidades) y betas (dificultades)
    const thetas = new Array(nStudents).fill(0.0);
    const betas = new Array(nItems).fill(0.0);

    // 4) Función de probabilidad logística
    const pij = (i: number, j: number): number => {
      const exponent = thetas[i] - betas[j];
      if (exponent > 20) return 1.0;
      if (exponent < -20) return 0.0;
      return 1.0 / (1.0 + Math.exp(-exponent));
    };

    // 5) Contar respuestas por estudiante
    const answeredCount = new Array(nStudents).fill(0);
    for (let i = 0; i < nStudents; i++) {
      for (let j = 0; j < nItems; j++) {
        if (responseMatrix[i][j] !== -1) answeredCount[i]++;
      }
      if (answeredCount[i] === 0) {
        thetas[i] = NON_RESPONSE_THETA;
      }
    }

    // 6) Iterar usando JMLE
    for (let iter = 0; iter < maxIterations; iter++) {
      let maxChange = 0.0;

      // Actualizar thetas (habilidades de estudiantes)
      for (let i = 0; i < nStudents; i++) {
        if (answeredCount[i] === 0) continue;

        let grad = 0.0;
        let hess = 0.0;

        for (let j = 0; j < nItems; j++) {
          if (responseMatrix[i][j] === -1) continue;
          const p = pij(i, j);
          grad += responseMatrix[i][j] - p;
          hess -= p * (1 - p);
        }

        if (hess !== 0) {
          const oldTheta = thetas[i];
          const newTheta = oldTheta - grad / hess;
          thetas[i] = newTheta;
          maxChange = Math.max(maxChange, Math.abs(newTheta - oldTheta));
        }
      }

      // Actualizar betas (dificultades de preguntas)
      for (let j = 0; j < nItems; j++) {
        let grad = 0.0;
        let hess = 0.0;

        for (let i = 0; i < nStudents; i++) {
          if (answeredCount[i] === 0 || responseMatrix[i][j] === -1) continue;
          const p = pij(i, j);
          grad += -(responseMatrix[i][j] - p);
          hess -= p * (1 - p);
        }

        if (hess !== 0) {
          const oldBeta = betas[j];
          const newBeta = oldBeta - grad / hess;
          betas[j] = newBeta;
          maxChange = Math.max(maxChange, Math.abs(newBeta - oldBeta));
        }
      }

      // Centrar betas
      const meanBeta = betas.reduce((a, b) => a + b, 0) / nItems;
      for (let j = 0; j < nItems; j++) {
        betas[j] -= meanBeta;
      }

      if (maxChange < tolerance) break;
    }

    // 7) Calcular dificultades de preguntas
    const questionDifficulties = this.calculateQuestionDifficulties(questionIds, betas);

    // 8) Determinar posición y puntaje del estudiante objetivo
    const scored = students.map((student, i) => ({
      student,
      ability: thetas[i],
    }));

    // Ordenar por habilidad descendente
    scored.sort((a, b) => b.ability - a.ability);

    const targetIndex = scored.findIndex((s) => s.student.id === targetStudent.id);
    const position = targetIndex >= 0 ? targetIndex + 1 : -1;
    const rawTheta = targetIndex >= 0 ? scored[targetIndex].ability : 0.0;

    // Normalizar a escala 500 ± 100
    const meanTheta = this.mean(thetas);
    const sdTheta = this.std(thetas, meanTheta);
    let finalScore = 500.0;
    if (sdTheta > 0) {
      finalScore = 500 + (100 * (rawTheta - meanTheta)) / sdTheta;
    }

    // Contar respuestas del estudiante objetivo
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let totalAnswered = 0;

    if (targetIndex >= 0) {
      const targetStudentIndex = studentIndex[targetStudent.id!];
      for (let j = 0; j < nItems; j++) {
        const response = responseMatrix[targetStudentIndex][j];
        if (response !== -1) {
          totalAnswered++;
          if (response === 1) {
            correctAnswers++;
          } else {
            incorrectAnswers++;
          }
        }
      }
    }

    return {
      position,
      score: finalScore,
      totalStudents: nStudents,
      correctAnswers,
      incorrectAnswers,
      totalAnswered,
      questionDifficulties,
    };
  }

  /**
   * Crea un mapa de ID de estudiante a índice
   */
  private static createStudentIndex(students: Student[]): { [id: string]: number } {
    const index: { [id: string]: number } = {};
    students.forEach((student, i) => {
      const id = student.id || `S_${i}`;
      index[id] = i;
    });
    return index;
  }

  /**
   * Extrae todos los IDs de las preguntas de los exámenes asignados
   */
  private static extractQuestionIds(students: Student[], idSimulacro: string): string[] {
    const questionIdsSet = new Set<string>();

    for (const student of students) {
      const exams = student.assignedExams || student.examenes_asignados || [];

      for (const exam of exams) {
        const examId = exam.idSimulacro || exam.id_simulacro;
        if (examId === idSimulacro) {
          const sessions = exam.sessionResponses || exam.respuesta_sesion || [];

          for (const sr of sessions) {
            const answers = sr.answers || sr.respuestas || [];

            for (const ans of answers) {
              const questionId = ans.questionId || ans.id_pregunta;
              if (questionId) {
                questionIdsSet.add(questionId);
              }
            }
          }
          break;
        }
      }
    }

    return Array.from(questionIdsSet);
  }

  /**
   * Crea un mapa de ID de pregunta a índice
   */
  private static createQuestionIndex(questionIds: string[]): { [id: string]: number } {
    const index: { [id: string]: number } = {};
    questionIds.forEach((qId, i) => {
      index[qId] = i;
    });
    return index;
  }

  /**
   * Construye la matriz de respuestas
   * 1: correcta, 0: incorrecta, -1: sin respuesta
   */
  private static buildResponseMatrix(
    students: Student[],
    studentIndex: { [id: string]: number },
    questionIndex: { [id: string]: number },
    idSimulacro: string,
    nStudents: number,
    nItems: number
  ): number[][] {
    const matrix: number[][] = Array.from({ length: nStudents }, () =>
      new Array(nItems).fill(-1)
    );

    for (const student of students) {
      const sIndex = studentIndex[student.id!];
      const exams = student.assignedExams || student.examenes_asignados || [];

      for (const exam of exams) {
        const examId = exam.idSimulacro || exam.id_simulacro;
        if (examId === idSimulacro) {
          const sessions = exam.sessionResponses || exam.respuesta_sesion || [];

          for (const sr of sessions) {
            const answers = sr.answers || sr.respuestas || [];

            for (const ans of answers) {
              const qId = ans.questionId || ans.id_pregunta;
              if (!qId) continue;

              const qIndex = questionIndex[qId];
              if (qIndex !== undefined) {
                const isCorrect = ans.isCorrect ?? ans.es_correcta ?? false;
                matrix[sIndex][qIndex] = isCorrect ? 1 : 0;
              }
            }
          }
          break;
        }
      }
    }

    return matrix;
  }

  /**
   * Calcula la dificultad de cada pregunta
   */
  private static calculateQuestionDifficulties(
    questionIds: string[],
    betas: number[]
  ): { [questionId: string]: { numericDifficulty: number; textDifficulty: string } } {
    const difficulties: {
      [questionId: string]: { numericDifficulty: number; textDifficulty: string };
    } = {};

    for (let j = 0; j < questionIds.length; j++) {
      const beta = betas[j];
      let level: string;

      if (beta < -1.0) {
        level = 'fácil';
      } else if (beta > 1.0) {
        level = 'difícil';
      } else {
        level = 'medio';
      }

      difficulties[questionIds[j]] = {
        numericDifficulty: beta,
        textDifficulty: level,
      };
    }

    return difficulties;
  }

  /**
   * Calcula la media de un array
   */
  private static mean(data: number[]): number {
    if (data.length === 0) return 0.0;
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  /**
   * Calcula la desviación estándar
   */
  private static std(data: number[], mean: number): number {
    if (data.length < 2) return 0.0;
    const sumSq = data.reduce((prev, x) => prev + Math.pow(x - mean, 2), 0);
    return Math.sqrt(sumSq / (data.length - 1));
  }
}
