/**
 * Middleware para manejar archivos no disponibles (eliminados o expirados)
 */

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * HTML para la página de archivo no disponible
 */
const getFileNotAvailableHTML = (fileName: string): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archivo No Disponible</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 20px;
      padding: 60px 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .icon {
      width: 120px;
      height: 120px;
      margin: 0 auto 30px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    .icon svg {
      width: 60px;
      height: 60px;
      fill: white;
    }

    h1 {
      color: #333;
      font-size: 28px;
      margin-bottom: 15px;
      font-weight: 700;
    }

    .message {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }

    .file-name {
      background: #f8f9fa;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #495057;
      margin-bottom: 30px;
      word-break: break-all;
    }

    .info-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .info-box p {
      color: #856404;
      font-size: 14px;
      margin: 0;
    }

    .info-box strong {
      display: block;
      margin-bottom: 8px;
      font-size: 15px;
    }

    .timer-icon {
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }

    .btn {
      display: inline-block;
      padding: 14px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 30px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .footer {
      margin-top: 40px;
      color: #999;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="none"/>
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </div>

    <h1>Archivo No Disponible</h1>

    <p class="message">
      El archivo que intentas acceder ya no está disponible.
      Los reportes se eliminan automáticamente después de un período de tiempo por seguridad.
    </p>

    <div class="file-name">
      ${fileName}
    </div>

    <div class="info-box">
      <p>
        <strong>
          <span class="timer-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#856404">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
          </span>
          Tiempo de retención: 30 minutos
        </strong>
        Por favor, genera un nuevo reporte si necesitas acceder a este documento.
      </p>
    </div>

    <a href="javascript:history.back()" class="btn">Volver</a>

    <p class="footer">
      Sistema de Reportes &copy; ${new Date().getFullYear()}
    </p>
  </div>
</body>
</html>
`;

/**
 * Crea un middleware para verificar la existencia de archivos estáticos
 * Si el archivo no existe, muestra una página de "archivo no disponible"
 *
 * @param baseDirectory - Directorio base donde se buscan los archivos
 * @param extensions - Extensiones de archivo a verificar (ej: ['.pdf', '.xlsx'])
 */
export const fileNotFoundMiddleware = (
  baseDirectory: string,
  extensions: string[] = ['.pdf', '.xlsx']
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Obtener el nombre del archivo de la URL
    const fileName = path.basename(req.path);
    const ext = path.extname(fileName).toLowerCase();

    // Solo verificar archivos con las extensiones especificadas
    if (!extensions.includes(ext)) {
      return next();
    }

    const filePath = path.join(baseDirectory, fileName);

    // Verificar si el archivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // El archivo no existe, mostrar página de error
        logger.info('File not found, showing unavailable page', {
          fileName,
          requestPath: req.path
        });

        res.status(410).send(getFileNotAvailableHTML(fileName));
      } else {
        // El archivo existe, continuar con el siguiente middleware
        next();
      }
    });
  };
};

/**
 * Middleware específico para PDFs
 */
export const pdfNotFoundMiddleware = (pdfsDirectory: string) => {
  return fileNotFoundMiddleware(pdfsDirectory, ['.pdf']);
};

/**
 * Middleware específico para Excels
 */
export const excelNotFoundMiddleware = (excelsDirectory: string) => {
  return fileNotFoundMiddleware(excelsDirectory, ['.xlsx', '.xls']);
};
