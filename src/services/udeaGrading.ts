/**
 * UdeA Grading System Service
 * Sistema de calificación ponderado específico para Universidad de Antioquia
 * Pondera: Razonamiento Lógico (50%) + Competencia Lectora (50%)
 */

interface Subject {
  name?: string;
  porcentaje?: string;
  percentage?: string;
  correctAnswers?: number;
  correct_answers?: number;
  incorrectAnswers?: number;
  incorrect_answers?: number;
  components?: any[];
  competencies?: any[];
}

interface Answer {
  questionId?: string;
  id_pregunta?: string;
  answerId?: string;
  id_respuesta?: string;
  isCorrect?: boolean;
  es_correcta?: boolean;
}

interface SessionResponse {
  session: number;
  answers?: Answer[];
  respuestas?: Answer[];
  status: boolean;
}

interface AssignedExam {
  idSimulacro?: string;
  id_simulacro?: string;
  score?: number;
  position?: number;
  sessionResponses?: SessionResponse[];
  respuesta_sesion?: SessionResponse[];
  subjects?: Subject[];
  materias?: Subject[];
}

interface Student {
  id?: string;
  id_estudiante?: string;
  document?: string;
  name?: string;
  assignedExams?: AssignedExam[];
  examenes_asignados?: AssignedExam[];
}

export interface UdeaResult {
  position: number;
  score: number;
  totalStudents: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswered: number;
}

interface StudentScore {
  student: Student;
  score: number;
  correct: number;
  incorrect: number;
  total: number;
}

export class UdeaGradingSystem {
  private subjectWeights: { [key: string]: number } = {
    'Razonamiento Lógico': 0.5,
    'Competencia Lectora': 0.5,
  };

  /**
   * Evalúa todos los estudiantes y retorna sus resultados
   */
  evaluateStudents(students: Student[], idSimulacro: string): UdeaResult[] {
    const scores = this.computeScores(students, idSimulacro);

    // Ordenar por puntaje descendente
    scores.sort((a, b) => b.score - a.score);

    const results: UdeaResult[] = [];

    for (let i = 0; i < scores.length; i++) {
      const s = scores[i];
      results.push({
        position: i + 1,
        score: s.score,
        totalStudents: students.length,
        correctAnswers: s.correct,
        incorrectAnswers: s.incorrect,
        totalAnswered: s.total,
      });
    }

    return results;
  }

  /**
   * Evalúa un solo estudiante y retorna su resultado
   */
  evaluateSingleStudent(
    students: Student[],
    targetStudent: Student,
    idSimulacro: string
  ): UdeaResult {
    const results = this.evaluateStudents(students, idSimulacro);

    const studentResult = results.find((r, index) => {
      const studentAtPosition = this.getStudentByPosition(students, r.position, idSimulacro);
      return studentAtPosition?.id === targetStudent.id;
    });

    if (!studentResult) {
      throw new Error('Student not found in results');
    }

    return studentResult;
  }

  /**
   * Calcula los puntajes de todos los estudiantes
   */
  private computeScores(students: Student[], idSimulacro: string): StudentScore[] {
    const scores: StudentScore[] = [];

    for (const student of students) {
      let weightedScore = 0.0;
      let correct = 0;
      let incorrect = 0;
      let total = 0;

      const subjectMap: { [key: string]: Subject } = {};

      const exams = student.assignedExams || student.examenes_asignados || [];

      for (const exam of exams) {
        const examId = exam.idSimulacro || exam.id_simulacro;

        if (examId === idSimulacro) {
          // Mapear materias
          const subjects = exam.subjects || exam.materias || [];
          for (const subject of subjects) {
            if (subject.name) {
              subjectMap[subject.name] = subject;
            }
          }

          // Contar respuestas
          const sessions = exam.sessionResponses || exam.respuesta_sesion || [];
          for (const session of sessions) {
            const answers = session.answers || session.respuestas || [];
            for (const answer of answers) {
              const isCorrect = answer.isCorrect ?? answer.es_correcta ?? false;
              if (isCorrect) {
                correct++;
              } else {
                incorrect++;
              }
              total++;
            }
          }
        }
      }

      // Calcular puntaje ponderado
      let totalWeight = 0.0;

      Object.entries(this.subjectWeights).forEach(([subjectName, weight]) => {
        const subject = subjectMap[subjectName];
        let subjectScore = 0.0;

        if (subject) {
          // Intentar obtener porcentaje
          const percentageStr = subject.porcentaje || subject.percentage;
          if (percentageStr) {
            subjectScore = parseFloat(percentageStr) || 0.0;
          } else {
            // Calcular desde correctas/incorrectas
            const correctAns = subject.correctAnswers ?? subject.correct_answers ?? 0;
            const incorrectAns = subject.incorrectAnswers ?? subject.incorrect_answers ?? 0;
            const sTotal = correctAns + incorrectAns;
            subjectScore = sTotal > 0 ? (correctAns / sTotal) * 100 : 0.0;
          }

          weightedScore += subjectScore * weight;
          totalWeight += weight;
        }
      });

      // Normalizar si el peso total < 1
      if (totalWeight < 1.0 && totalWeight > 0) {
        weightedScore = weightedScore / totalWeight;
      }

      scores.push({
        student,
        score: weightedScore,
        correct,
        incorrect,
        total,
      });
    }

    return scores;
  }

  /**
   * Obtiene un estudiante por su posición
   */
  private getStudentByPosition(
    students: Student[],
    position: number,
    idSimulacro: string
  ): Student | null {
    const scores = this.computeScores(students, idSimulacro);
    scores.sort((a, b) => b.score - a.score);

    if (position - 1 >= 0 && position - 1 < scores.length) {
      return scores[position - 1].student;
    }

    return null;
  }
}
