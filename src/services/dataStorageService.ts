/**
 * Data Storage Service - Guardar datos de reportes en JSON
 * Útil para debugging, auditoría y análisis
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

export class DataStorageService {
  private storageDir: string;

  constructor() {
    // Directorio donde se guardarán los JSONs
    this.storageDir = path.join(process.cwd(), 'public', 'data-reports');
  }

  /**
   * Asegura que el directorio de almacenamiento existe
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.storageDir);
    } catch {
      await fs.mkdir(this.storageDir, { recursive: true });
      logger.info('Data storage directory created', { path: this.storageDir });
    }
  }

  /**
   * Guarda los datos de simulación en un archivo JSON
   * @param simulationData - Datos de la simulación
   * @param sessionId - ID de la sesión (opcional)
   * @returns Nombre del archivo guardado
   */
  async saveSimulationData(simulationData: any, sessionId?: string): Promise<string> {
    try {
      await this.ensureDirectoryExists();

      // Generar nombre de archivo único
      const timestamp = Date.now();
      const campus = simulationData.campus?.replace(/[^a-zA-Z0-9]/g, '_') || 'UNKNOWN';
      const tipoInforme = simulationData.tipe_inform?.toUpperCase() || 'REPORTE';
      const session = sessionId ? `_${sessionId}` : '';

      const fileName = `simulation_data_${tipoInforme}_${campus}_${timestamp}${session}.json`;
      const filePath = path.join(this.storageDir, fileName);

      // Preparar datos con metadata
      const dataToSave = {
        metadata: {
          savedAt: new Date().toISOString(),
          sessionId: sessionId || 'N/A',
          campus: simulationData.campus,
          tipoInforme: simulationData.tipe_inform,
          programName: simulationData.programName,
          studentsCount: simulationData.students?.length || 0,
          questionsCount: simulationData.detailQuestion?.length || 0
        },
        data: simulationData
      };

      // Guardar archivo
      await fs.writeFile(
        filePath,
        JSON.stringify(dataToSave, null, 2),
        'utf-8'
      );

      logger.info('Simulation data saved successfully', {
        fileName,
        campus: simulationData.campus,
        sessionId,
        fileSize: JSON.stringify(dataToSave).length
      });

      return fileName;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error saving simulation data', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });

      // No lanzamos el error para que no falle el proceso principal
      return '';
    }
  }

  /**
   * Lee un archivo de datos de simulación
   * @param fileName - Nombre del archivo
   * @returns Datos de la simulación
   */
  async readSimulationData(fileName: string): Promise<any> {
    try {
      const filePath = path.join(this.storageDir, fileName);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      logger.info('Simulation data read successfully', { fileName });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error reading simulation data', {
        error: errorMessage,
        fileName
      });
      throw error;
    }
  }

  /**
   * Lista todos los archivos de datos guardados
   * @returns Lista de nombres de archivos
   */
  async listSimulationDataFiles(): Promise<string[]> {
    try {
      await this.ensureDirectoryExists();
      const files = await fs.readdir(this.storageDir);

      // Filtrar solo archivos JSON de simulación
      const simulationFiles = files.filter(file =>
        file.startsWith('simulation_data_') && file.endsWith('.json')
      );

      logger.info('Simulation data files listed', { count: simulationFiles.length });

      return simulationFiles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error listing simulation data files', {
        error: errorMessage
      });
      return [];
    }
  }

  /**
   * Elimina archivos de datos antiguos (más de X días)
   * @param daysOld - Número de días (por defecto 30)
   * @returns Número de archivos eliminados
   */
  async cleanOldFiles(daysOld: number = 30): Promise<number> {
    try {
      await this.ensureDirectoryExists();
      const files = await this.listSimulationDataFiles();

      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000; // Convertir días a milisegundos
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
          logger.info('Old simulation data file deleted', { file, ageInDays: Math.floor(fileAge / (24 * 60 * 60 * 1000)) });
        }
      }

      logger.info('Old files cleanup completed', { deletedCount, daysOld });

      return deletedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error cleaning old files', {
        error: errorMessage
      });
      return 0;
    }
  }
}

// Singleton instance
export const dataStorageService = new DataStorageService();
