// Common Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// WebSocket Types
export interface ProgressUpdate {
  sessionId: string;
  stage: string;
  progress: number;
  message: string;
  timestamp: Date;
  data?: any;
}

export interface WebSocketError {
  sessionId: string;
  error: string;
  details?: any;
  timestamp: Date;
}

export interface WebSocketComplete {
  sessionId: string;
  result: any;
  timestamp: Date;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

export interface Range {
  percentage: number;
  count: number;
}

export interface BarChartConfig {
  title: string;
  chartId: string;
  ranges: Range[];
  chartData: ChartData;
  barThickness?: number;
  maxValue?: number;
  stepSize?: number;
}

// Table Data Types
export interface TableQuestion {
  number?: number;
  competence?: string;
  component?: string;
  percentages?: number[];
  correctAnswer?: number;
  id?: string;
}

export interface TableData {
  prueba?: string;
  subject?: string;
  options?: string[];
  questions?: TableQuestion[];
}

export interface ComparativeTableRow {
  type: 'nacional' | 'departamento' | 'municipio' | 'institucion' | 'prueba';
  label: string;
  year?: string;
  values: (string | number)[];
}

export interface ComparativeData {
  subjects?: string[];
  tableData?: ComparativeTableRow[];
  chartData?: {
    labels: string[];
    datasets: ChartDataset[];
  };
  chartConfig?: ChartConfig;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor?: string;
  borderRadius?: {
    topLeft?: number;
    topRight?: number;
    bottomLeft?: number;
    bottomRight?: number;
  };
}

export interface ChartConfig {
  categoryPercentage?: number;
  barPercentage?: number;
  yAxisMax?: number;
  stepSize?: number;
}

// Header Information
export interface HeaderInfo {
  institucion?: string;
  evaluacion?: string;
  municipio?: string;
  fecha?: string;
}

export interface IconPaths {
  institucion?: string;
  evaluacion?: string;
  municipio?: string;
  fecha?: string;
}

// Page Layout Types
export interface LayoutData {
  title?: string;
  language?: string;
  logoPath?: string;
  logoAlt?: string;
  headerInfo?: HeaderInfo;
  iconPaths?: IconPaths;
  chartTitle?: string;
  extraCSS?: string[];
  extraJS?: string[];
  content?: string;
  layout:string
}

// Simplified Request Types
export interface PageRequest {
  layout: 'horizontal' | 'vertical';
  headerInfo: {
    institucion: string;
    evaluacion: string;
    municipio: string;
    fecha: string;
    logo:string;
    institucionImage: string;
    evaluacionImage:string;
    municipioImage:string;
    fechaImage:string;
    portadaImage?:string;
    


  };
subTitle?: string;
  chartTitle: string;
  components: ComponentRequest[];
  forPdf?: boolean; // Flag to indicate if this is for PDF generation
}

export interface ComponentRequest {
  // type: 'bar_chart_with_title' | 'bar_chart_simple' | 'tabla_dificultad_analisis' | 'comparativo_puntaje' | 'score_distribution';
  type: string;
  area?: string;
  data: any;
}

// Environment Configuration
export interface EnvConfig {
  port: number;
  nodeEnv: string;
  host: string;
  corsOrigin: string;
  corsCredentials: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  apiKey?: string;
  jwtSecret?: string;
  logLevel: string;
  logFormat: string;
  mailApiUrl: string;
  mailApiTimeout: number;
}

// Service Response Types
export interface RenderResult {
  html: string;
  metadata?: {
    renderTime: number;
    componentCount: number;
    cacheKey?: string;
  };
}

// PDF Generation Types
export interface PdfRequest extends PageRequest {
  options?: PdfOptions;
}

export interface PdfOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  scale?: number;
}

export interface PdfResult {
  pdf: Buffer;
  metadata: {
    renderTime: number;
    size: number;
    format: string;
    orientation: string;
  };
}