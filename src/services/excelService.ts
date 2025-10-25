import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { procesarDatosParaExcel, calcularEstadisticasGenerales } from '../utils/excelDataProcessor';
import { procesarDatosParaExcelRespuestas, generarIndicesPreguntas } from '../utils/excelAnswersProcessor';
import { logger } from '../utils/logger';

/**
 * Service for generating Excel reports from simulation data
 */
class ExcelService {
  private publicDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), 'public', 'excels');
    this.ensureDirectoryExists();
  }

  /**
   * Ensure the public/excels directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.publicDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating excels directory', { error });
    }
  }

  /**
   * Generate Excel report from simulation data (SCORES BY AREA)
   * Format: GRUPO | IDENTIFICACIÓN | NOMBRES Y APELLIDOS | TOTAL | Categoria | [Áreas...] | PROMEDIO | DESVIACIÓN
   */
  async generateExcelReport(simulationData: any): Promise<string> {
    try {
      // Process simulation data
      const { areasUnicas, estudiantes, metadata, estadisticas } = procesarDatosParaExcel(simulationData);

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Formarte Reports Service';
      workbook.created = new Date();

      // Create main worksheet named "Resultados"
      const worksheet = workbook.addWorksheet('Resultados', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
      });

      // Header row: GRUPO | IDENTIFICACIÓN | NOMBRES Y APELLIDOS | TOTAL | Categoria | [Áreas...]
      const headerRow = worksheet.addRow([
        'GRUPO',
        'IDENTIFICACIÓN',
        'NOMBRES Y APELLIDOS',
        'TOTAL',
        'Categoria',
        ...areasUnicas
      ]);

      // Style header row
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Data rows - one per student
      estudiantes.forEach((estudiante) => {
        const rowData = [
          estudiante.grupo,
          estudiante.documento,
          estudiante.nombre,
          Math.round(estudiante.puntajeTotal), // Redondear a entero
          estudiante.categoria, // Número 1-4
          ...areasUnicas.map(area => Math.round(estudiante.areas[area] || 0)) // Redondear a entero
        ];

        const dataRow = worksheet.addRow(rowData);

        // Center align all cells
        dataRow.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });

      // PROMEDIO row
      const promedioRowData = [
        '', // GRUPO
        '', // IDENTIFICACIÓN
        'PROMEDIO', // NOMBRES
        Math.round(estadisticas.promedios['TOTAL']), // TOTAL
        '', // Categoria
        ...areasUnicas.map(area => Math.round(estadisticas.promedios[area] || 0))
      ];
      const promedioRow = worksheet.addRow(promedioRowData);
      promedioRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // DESVIACIÓN ESTÁNDAR row
      const desviacionRowData = [
        '', // GRUPO
        '', // IDENTIFICACIÓN
        'DESVIACIÓN ESTÁNDAR', // NOMBRES
        Math.round(estadisticas.desviaciones['TOTAL']), // TOTAL
        '', // Categoria
        ...areasUnicas.map(area => Math.round(estadisticas.desviaciones[area] || 0))
      ];
      const desviacionRow = worksheet.addRow(desviacionRowData);
      desviacionRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Set column widths
      worksheet.getColumn(1).width = 30;  // GRUPO
      worksheet.getColumn(2).width = 15;  // IDENTIFICACIÓN
      worksheet.getColumn(3).width = 30;  // NOMBRES Y APELLIDOS
      worksheet.getColumn(4).width = 10;  // TOTAL
      worksheet.getColumn(5).width = 10;  // Categoria

      // Áreas columns
      for (let i = 0; i < areasUnicas.length; i++) {
        worksheet.getColumn(6 + i).width = 20;
      }

      // Generate filename
      const timestamp = Date.now();
      const fileName = `reporte_puntajes_${metadata.campus.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
      const filePath = path.join(this.publicDir, fileName);

      // Save file
      await workbook.xlsx.writeFile(filePath);

      logger.info('Excel report generated successfully', {
        fileName,
        students: metadata.totalEstudiantes,
        areas: areasUnicas.length
      });

      return fileName;

    } catch (error) {
      logger.error('Error generating Excel report', { error });
      throw error;
    }
  }

  /**
   * Helper to convert column number to Excel letter
   */
  private getColumnLetter(columnNumber: number): string {
    let columnLetter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnLetter;
  }

  /**
   * Generate Excel report with student answers (A, B, C, D format)
   * Correct answers are highlighted in green, incorrect in red
   */
  async generateExcelAnswers(simulationData: any): Promise<string> {
    try {
      // Process simulation data
      const { estudiantes, totalPreguntas, metadata } = procesarDatosParaExcelRespuestas(simulationData);

      
      const indicesPreguntas = generarIndicesPreguntas(totalPreguntas);

            
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Formarte Reports Service';
      workbook.created = new Date();

      // Create main worksheet
      const worksheet = workbook.addWorksheet('Respuestas por estudiante', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
      });

      // Build header row: IDENTIFICACION | ESTUDIANTE | 1 | 2 | 3 | ... | n
      const headerRow = ['IDENTIFICACION', 'ESTUDIANTE', ...indicesPreguntas];
      const headerRowObj = worksheet.addRow(headerRow);

      // Style header row
      headerRowObj.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Data rows - one per student
      estudiantes.forEach((estudiante) => {
        // Build row data
        const rowData: (string | number)[] = [
          estudiante.documento,
          estudiante.nombre
        ];
      console.log(indicesPreguntas.length,{  totalPreguntas,  });

        // Add answers for each question in order
        // Los índices en el Map ahora son consecutivos: 1, 2, 3, ..., 254
        indicesPreguntas.forEach((indexPregunta) => {
          const respuesta = estudiante.respuestas.get(indexPregunta);
          rowData.push(respuesta?.letra || ''); // Empty if no answer
        });

        const dataRow = worksheet.addRow(rowData);

        // Style each cell
        dataRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };

          // Color code answers (columns 3 onwards)
          if (colNumber > 2) {
            // colNumber 3 = pregunta 1, colNumber 4 = pregunta 2, etc.
            const numeroPregunta = colNumber - 2; // col 3 -> pregunta 1, col 4 -> pregunta 2
            const respuesta = estudiante.respuestas.get(numeroPregunta);

            if (respuesta) {
              if (respuesta.esCorrecta) {
                // Green background for correct answers
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF58A55C' } // Verde
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
              } else {
                // Red background for incorrect answers
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFC55C5C' } // Rojo
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
              }
            }
          }
        });
      });

      // Set column widths
      worksheet.getColumn(1).width = 15;  // IDENTIFICACION
      worksheet.getColumn(2).width = 30;  // ESTUDIANTE

      // Question columns - narrower
      for (let i = 3; i <= headerRow.length; i++) {
        worksheet.getColumn(i).width = 5;
      }

      // Freeze first two columns and header row
      worksheet.views = [
        { state: 'frozen', xSplit: 2, ySplit: 1 }
      ];

      // Generate filename
      const timestamp = Date.now();
      const fileName = `respuestas_${metadata.campus.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
      const filePath = path.join(this.publicDir, fileName);

      // Save file
      await workbook.xlsx.writeFile(filePath);

      logger.info('Excel answers report generated successfully', {
        fileName,
        students: metadata.totalEstudiantes,
        questions: totalPreguntas
      });

      return fileName;

    } catch (error) {
      logger.error('Error generating Excel answers report', { error });
      throw error;
    }
  }

  /**
   * Delete an Excel file
   */
  async deleteExcel(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.publicDir, fileName);
      await fs.unlink(filePath);
      logger.info('Excel file deleted', { fileName });
    } catch (error) {
      logger.error('Error deleting Excel file', { error, fileName });
      throw error;
    }
  }
}

export const excelService = new ExcelService();
