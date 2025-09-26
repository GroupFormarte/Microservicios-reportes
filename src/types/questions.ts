export interface QuestionPdfRequest {
  questions: QuestionForPdf[];
  title: string;
  options?: PdfOptions;
}

export interface QuestionForPdf {
  codigo: string;
  deltaPregunta: DeltaOperation[];
  deltaRespuestas: DeltaOperation[][];
  // Legacy properties (optional for backward compatibility)
  imagenesPregunta?: string[];
  imagenesRespuestas?: string[][];
}

export interface DeltaOperation {
  insert: string | any;
  attributes?: {
    [key: string]: any;
  };
}

export interface PdfOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  printBackground?: boolean;
  scale?: number;
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface QuestionPdfResponse {
  success: boolean;
  data?: {
    message: string;
    totalQuestions: number;
    pdf: {
      fileName: string;
      url: string;
      downloadUrl: string;
    };
  };
  error?: string;
  message?: string;
}

export interface ProcessedQuestion {
  codigo: string;
  preguntaHtml: string;
  respuestasHtml: string[];
  imagenesUsadas: string[];
}

export interface QuestionGenerationOptions {
  questions: QuestionForPdf[];
  title: string;
  options?: PdfOptions;
  sessionId?: string;
}