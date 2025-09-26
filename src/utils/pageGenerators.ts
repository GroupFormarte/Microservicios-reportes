/**
 * Generadores de páginas reutilizables para cualquier tipo de reporte
 * Funciones genéricas que pueden ser usadas por UDEA, UNAL, ICFES, etc.
 */

import { PageRequest } from '../types/index';
import { procesarCompetenciasUNAL } from './udeaReports';

/**
 * Genera datos base de portada desde simulationData (genérico)
 */
export function generarDatosPortada(simulationData: any) {
  return {
    campus: simulationData.campus || "Campus Default",
    code: simulationData.code || "COD-DEFAULT", 
    year: simulationData.year || new Date().getFullYear().toString(),
    programName: simulationData.programName || "Programa Default"
  };
}

/**
 * Genera headerInfo base desde simulationData (genérico)
 */
export function generarBaseHeaderInfo(simulationData: any, images: any) {
  const { logo, institucionImage, evaluacionImage, municipioImage, fechaImage } = images;
  
  return {
    institucion: simulationData.campus || "Campus Default",
    evaluacion: simulationData.course || "Examen Default",
    municipio: "Medellín, Antioquia",
    fecha: new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    }),
    logo,
    institucionImage,
    evaluacionImage,
    municipioImage,
    fechaImage,
  };
}

/**
 * Genera página de portada reutilizable (genérico)
 */
export function generarPaginaPortada(simulationData: any, images: any): PageRequest {
  const portadaData = generarDatosPortada(simulationData);
  const baseHeaderInfo = generarBaseHeaderInfo(simulationData, images);
  const { portadaImage } = images;

  return {
    layout: "vertical",
    chartTitle: "Portada",
    headerInfo: {
      ...baseHeaderInfo,
      portadaImage
    },
    components: [
      {
        type: "portada",
        data: {
          ...portadaData,
          portadaImage
        }
      }
    ]
  };
}

/**
 * Genera página de competencias usando competencias_chart (genérico)
 * Puede ser usado por UNAL, SABER PRO, etc.
 */
export function generarPaginaCompetenciasChart(
  simulationData: any, 
  baseHeaderInfo: any,
  options: {
    chartId?: string,
    chartTitle?: string,
    processorFunction?: (data: any) => any[]
  } = {}
): PageRequest {
  const {
    chartId = "competencias_chart_default",
    chartTitle = "Análisis de Competencias",
    processorFunction = procesarCompetenciasUNAL
  } = options;

  const competenciasData = processorFunction(simulationData);
  
  const labels = competenciasData.map(c => c.nombre);
  const promedioGrupal = competenciasData.map(c => c.promedioGrupo);
  const historicoPromedios = competenciasData.map(c => c.historico);
  const maxYValue = Math.max(...promedioGrupal, 10); // Mínimo 10

  const competenciasChartData = {
    type: "competencias_chart",
    data: {
      chartId,
      labels,
      promedioGrupal,
      historicoPromedios,
      maxYValue
    }
  };

  return {
    layout: "horizontal",
    chartTitle,
    headerInfo: baseHeaderInfo,
    components: [competenciasChartData]
  };
}

/**
 * Factory function para generar páginas de tabla simple
 */
export function generarPaginaTabla(
  simulationData: any,
  baseHeaderInfo: any,
  options: {
    chartTitle?: string,
    componentType: string,
    layout?: "horizontal" | "vertical",
    processorFunction: (data: any) => any
  }
): PageRequest {
  const {
    chartTitle = "Tabla de Datos",
    componentType,
    layout = "vertical", 
    processorFunction
  } = options;

  const tableData = processorFunction(simulationData);

  return {
    layout,
    chartTitle,
    headerInfo: baseHeaderInfo,
    components: [tableData]
  };
}

/**
 * Factory function para generar múltiples páginas
 */
export function generarMultiplesPaginas(
  simulationData: any,
  baseHeaderInfo: any,
  options: {
    chartTitle?: string,
    layout?: "horizontal" | "vertical",
    processorFunction: (data: any, headerInfo: any) => any[]
  }
): PageRequest[] {
  const {
    chartTitle = "Página",
    layout = "horizontal",
    processorFunction
  } = options;

  return processorFunction(simulationData, baseHeaderInfo).map((pageData: any, index: number) => ({
    layout,
    chartTitle: `${chartTitle} ${index + 1}`,
    headerInfo: baseHeaderInfo,
    components: Array.isArray(pageData) ? pageData : [pageData]
  }));
}