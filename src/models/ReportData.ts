/**
 * MongoDB Model for report_data collection
 */

import mongoose, { Schema, Document } from 'mongoose';

interface IDetailQuestion {
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

interface IResult {
  position: number;
  score: number;
  totalStudents: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswered: number;
}

interface IStudent {
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

export interface IReportData extends Document {
  campus?: string;
  course?: string;
  simulationId?: string;
  idInstitute?: string;
  programName?: string;
  code?: string;
  id_campus?: string;
  tipe_inform?: string;
  examDate?: Date;
  detailQuestion?: IDetailQuestion[];
  results?: Map<string, IResult>;
  students?: IStudent[];
  createdAt?: Date;
  updatedAt?: Date;
}

const DetailQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    cod: String,
    componente: String,
    competencia: String,
    periodo: String,
    id_recurso: Schema.Types.Mixed,
    nameUser: String,
    eje_tematico: String,
    grado: String,
    programa: String,
    area: String,
    status: Boolean,
    id_material_refuerzo: Schema.Types.Mixed,
    asignatura: String,
    tipo: Schema.Types.Mixed,
    tipo_platform: String,
    created: String,
    cant_respuesta: String,
    pregunta: String,
    pregunta_correcta: String,
    question_depend_others: String,
    respuestas: [String],
  },
  { _id: false }
);

const ResultSchema = new Schema(
  {
    position: { type: Number, required: true },
    score: { type: Number, required: true },
    totalStudents: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    incorrectAnswers: { type: Number, required: true },
    totalAnswered: { type: Number, required: true },
  },
  { _id: false }
);

const StudentSchema = new Schema(
  {
    id: { type: String, required: true },
    id_estudiante: String,
    id_campus: String,
    course_id: String,
    document: String,
    program_id: Schema.Types.Mixed,
    examenes_asignados: [Schema.Types.Mixed],
    promedio: Schema.Types.Mixed,
    evaluaciones: Schema.Types.Mixed,
    proceso: Schema.Types.Mixed,
    name: String,
  },
  { _id: false }
);

const ReportDataSchema = new Schema(
  {
    campus: String,
    course: String,
    simulationId: { type: String, index: true },
    idInstitute: { type: String, index: true },
    programName: String,
    code: String,
    id_campus: String,
    tipe_inform: { type: String, index: true },
    examDate: { type: Date, index: true },
    detailQuestion: [DetailQuestionSchema],
    results: {
      type: Map,
      of: ResultSchema,
    },
    students: [StudentSchema],
  },
  {
    timestamps: true,
    collection: 'report_data',
  }
);

// Índice compuesto para consultas eficientes
ReportDataSchema.index({ examDate: 1, idInstitute: 1, tipe_inform: 1 });
ReportDataSchema.index({ examDate: 1, idInstitute: 1, tipe_inform: 1, simulationId: 1 });

export const ReportData = mongoose.model<IReportData>('ReportData', ReportDataSchema);
