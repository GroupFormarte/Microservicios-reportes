/**
 * File Cleanup Service - Eliminación automática de archivos temporales
 * Los reportes (PDF y Excel) se eliminan después de un tiempo configurable
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

// Tiempo de vida de los archivos en minutos
const DEFAULT_FILE_LIFETIME_MINUTES = 30;

interface ScheduledDeletion {
  filePath: string;
  fileName: string;
  scheduledAt: Date;
  deleteAt: Date;
  timeoutId: NodeJS.Timeout;
}

class FileCleanupService {
  private scheduledDeletions: Map<string, ScheduledDeletion> = new Map();
  private fileLifetimeMinutes: number;

  constructor(fileLifetimeMinutes: number = DEFAULT_FILE_LIFETIME_MINUTES) {
    this.fileLifetimeMinutes = fileLifetimeMinutes;
  }

  /**
   * Obtiene el tiempo de vida de los archivos en minutos
   */
  getFileLifetimeMinutes(): number {
    return this.fileLifetimeMinutes;
  }

  /**
   * Programa la eliminación de un archivo después del tiempo configurado
   * @param filePath - Ruta completa del archivo
   * @param fileName - Nombre del archivo (para logging)
   * @param lifetimeMinutes - Tiempo de vida en minutos (opcional, usa el default si no se especifica)
   */
  scheduleFileDeletion(
    filePath: string,
    fileName: string,
    lifetimeMinutes?: number
  ): void {
    const lifetime = lifetimeMinutes ?? this.fileLifetimeMinutes;
    const lifetimeMs = lifetime * 60 * 1000;

    const scheduledAt = new Date();
    const deleteAt = new Date(scheduledAt.getTime() + lifetimeMs);

    // Si ya hay una eliminación programada para este archivo, cancelarla
    if (this.scheduledDeletions.has(filePath)) {
      const existing = this.scheduledDeletions.get(filePath)!;
      clearTimeout(existing.timeoutId);
      logger.info('Cancelled previous scheduled deletion', { fileName });
    }

    // Programar la nueva eliminación
    const timeoutId = setTimeout(async () => {
      await this.deleteFile(filePath, fileName);
    }, lifetimeMs);

    this.scheduledDeletions.set(filePath, {
      filePath,
      fileName,
      scheduledAt,
      deleteAt,
      timeoutId
    });

    logger.info('File deletion scheduled', {
      fileName,
      lifetimeMinutes: lifetime,
      deleteAt: deleteAt.toISOString()
    });
  }

  /**
   * Programa la eliminación de un PDF
   * @param fileName - Nombre del archivo PDF
   * @param lifetimeMinutes - Tiempo de vida en minutos (opcional)
   */
  schedulePdfDeletion(fileName: string, lifetimeMinutes?: number): void {
    const filePath = path.join(process.cwd(), 'public', 'pdfs', fileName);
    this.scheduleFileDeletion(filePath, fileName, lifetimeMinutes);
  }

  /**
   * Programa la eliminación de un Excel
   * @param fileName - Nombre del archivo Excel
   * @param lifetimeMinutes - Tiempo de vida en minutos (opcional)
   */
  scheduleExcelDeletion(fileName: string, lifetimeMinutes?: number): void {
    const filePath = path.join(process.cwd(), 'public', 'excels', fileName);
    this.scheduleFileDeletion(filePath, fileName, lifetimeMinutes);
  }

  /**
   * Elimina un archivo
   * @param filePath - Ruta completa del archivo
   * @param fileName - Nombre del archivo (para logging)
   */
  private async deleteFile(filePath: string, fileName: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.scheduledDeletions.delete(filePath);

      logger.info('File automatically deleted after expiration', {
        fileName,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      // Si el archivo ya no existe, no es un error
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.info('File already deleted or not found', { fileName });
      } else {
        logger.error('Error deleting file', {
          fileName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      this.scheduledDeletions.delete(filePath);
    }
  }

  /**
   * Cancela la eliminación programada de un archivo
   * @param filePath - Ruta completa del archivo
   */
  cancelScheduledDeletion(filePath: string): boolean {
    const scheduled = this.scheduledDeletions.get(filePath);
    if (scheduled) {
      clearTimeout(scheduled.timeoutId);
      this.scheduledDeletions.delete(filePath);
      logger.info('Scheduled deletion cancelled', { fileName: scheduled.fileName });
      return true;
    }
    return false;
  }

  /**
   * Obtiene información sobre las eliminaciones programadas
   */
  getScheduledDeletions(): Array<{ fileName: string; deleteAt: Date }> {
    return Array.from(this.scheduledDeletions.values()).map(d => ({
      fileName: d.fileName,
      deleteAt: d.deleteAt
    }));
  }

  /**
   * Limpia archivos antiguos en los directorios de PDFs y Excels
   * Útil para limpiar archivos que quedaron sin eliminar (ej: después de un reinicio)
   * @param maxAgeMinutes - Edad máxima en minutos (por defecto usa el tiempo de vida configurado)
   */
  async cleanupOldFiles(maxAgeMinutes?: number): Promise<number> {
    const maxAge = maxAgeMinutes ?? this.fileLifetimeMinutes;
    const maxAgeMs = maxAge * 60 * 1000;
    const now = Date.now();
    let deletedCount = 0;

    const directories = [
      path.join(process.cwd(), 'public', 'pdfs'),
      path.join(process.cwd(), 'public', 'excels')
    ];

    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);

        for (const file of files) {
          // Solo procesar archivos de reportes (no otros archivos)
          if (!file.startsWith('reporte_') &&
              !file.startsWith('respuestas_') &&
              !file.startsWith('merged_')) {
            continue;
          }

          const filePath = path.join(dir, file);

          try {
            const stats = await fs.stat(filePath);
            const fileAge = now - stats.mtimeMs;

            if (fileAge > maxAgeMs) {
              await fs.unlink(filePath);
              deletedCount++;
              logger.info('Old file cleaned up', {
                fileName: file,
                ageMinutes: Math.round(fileAge / 60000)
              });
            }
          } catch (err) {
            // Ignorar errores de archivos individuales
          }
        }
      } catch (err) {
        // Ignorar si el directorio no existe
      }
    }

    if (deletedCount > 0) {
      logger.info('Cleanup completed', { deletedCount, maxAgeMinutes: maxAge });
    }

    return deletedCount;
  }
}

// Singleton instance con 30 minutos por defecto
export const fileCleanupService = new FileCleanupService(30);

// Exportar la clase para testing o instancias personalizadas
export { FileCleanupService };
