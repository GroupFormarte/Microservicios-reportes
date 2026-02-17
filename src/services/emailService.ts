/**
 * Email Service - Envío de reportes por correo electrónico
 * API: configurada en .env (MAIL_API_URL)
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface SendReportEmailParams {
  to: string;
  subject: string;
  link: string;
  expirationMinutes?: number; // Tiempo en minutos hasta que expire el archivo
}

export class EmailService {
  private mailApiUrl: string;
  private mailApiTimeout: number;

  constructor() {
    this.mailApiUrl = config.mailApiUrl;
    this.mailApiTimeout = config.mailApiTimeout;
  }

  /**
   * Envía un email con el link del reporte generado
   */
  async sendReportEmail(params: SendReportEmailParams): Promise<boolean> {
    const expirationMinutes = params.expirationMinutes ?? 20;

    try {
      logger.info('Sending report email', {
        to: params.to,
        subject: params.subject,
        apiUrl: this.mailApiUrl,
        expirationMinutes
      });

      const response = await axios.post(
        this.mailApiUrl,
        {
          to: params.to,
          subject: params.subject,
          link: params.link,
          expirationMinutes: expirationMinutes,
          expirationMessage: `Este enlace estará disponible por ${expirationMinutes} minutos.`
        },
        {
          timeout: this.mailApiTimeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        logger.info('Email sent successfully', {
          to: params.to,
          status: response.status,
          data: response.data
        });
        return true;
      } else {
        logger.warn('Email API returned unexpected status', {
          status: response.status,
          data: response.data
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error sending report email', {
        to: params.to,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        apiUrl: this.mailApiUrl
      });

      // No lanzamos el error para que el proceso de generación del PDF no falle
      // si el email no se puede enviar
      return false;
    }
  }

  /**
   * Genera el asunto del email basado en el tipo de informe y la institución
   */
  generateEmailSubject(
    institucion: string,
    tipoInforme: string,
    programName?: string
  ): string {
    const tipo = tipoInforme.toUpperCase();
    const programa = programName ? ` - ${programName}` : '';
    return `Reporte ${tipo} - ${institucion}${programa}`;
  }
}

// Singleton instance
export const emailService = new EmailService();
