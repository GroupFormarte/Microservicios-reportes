import { Request, Response } from 'express';
import { PDFDocument } from 'pdf-lib';
import puppeteer, { Browser } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import { v4 as uuidv4 } from 'uuid';
import { websocketService } from '../services/websocketService';
import { logger } from '../utils/logger';

interface StudentData {
  name: string;
  progress: number;
  competencias: Array<{
    name: string;
    progress: number;
  }>;
  [key: string]: any;
}

export class PdfController {
  private uploadsDir: string;
  private templatesDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    this.templatesDir = path.join(process.cwd(), 'storage', 'templates');
    
    // Ensure directories exist
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    [this.uploadsDir, this.templatesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });
  }

  async generatePdf(req: Request, res: Response): Promise<void> {
    try {
      const { listado }: { listado: StudentData[] } = req.body;

      if (!listado || !Array.isArray(listado) || listado.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Se requiere un array de estudiantes en el campo "listado"'
        });
        return;
      }

      logger.info(`Starting PDF generation for ${listado.length} students`);

      // Return immediate response
      res.status(202).json({
        success: true,
        message: `Generando PDF para ${listado.length} estudiantes. Recibirás una notificación cuando esté listo.`,
        studentsCount: listado.length
      });

      // Get dynamic base URL from request
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Process PDF generation asynchronously
      this.processPdfGeneration(listado, baseUrl);

    } catch (error) {
      logger.error('Error in PDF generation:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  private async processPdfGeneration(listado: StudentData[], baseUrl?: string): Promise<void> {
    let browser: Browser | null = null;

    try {
      const fileName = `reporte_estudiantes_${uuidv4()}.pdf`;
      const filePath = path.join(this.uploadsDir, fileName);

      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security'
        ]
      });

      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < listado.length; i++) {
        const student = listado[i];
        logger.info(`Processing student ${i + 1}/${listado.length}: ${student.name}`);

        // Generate individual PDF
        const pdfBuffer = await this.generateStudentPdf(browser, student);

        // Load and merge into main PDF
        const studentPdf = await PDFDocument.load(pdfBuffer);
        const pages = await mergedPdf.copyPages(studentPdf, studentPdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      // Save merged PDF
      const pdfBytes = await mergedPdf.save();
      fs.writeFileSync(filePath, pdfBytes);

      // Use provided baseUrl or fallback to environment variable
      const url = baseUrl || process.env.BASE_URL || 'http://localhost:3001';
      const fileUrl = `${url}/uploads/${fileName}`;

      logger.info(`PDF generated successfully: ${fileName}`);

      // Send WebSocket notification
      websocketService.notifyPdfReady(
        fileUrl,
        `Reporte de ${listado.length} estudiantes generado exitosamente`
      );

      // Schedule file deletion after 5 minutes
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`Deleted temporary file: ${fileName}`);
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      logger.error('Error processing PDF generation:', error);
      
      // Send error notification
      websocketService.pushToWSClients({
        status: 'pdf-error',
        message: 'Error generando el reporte PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async generateStudentPdf(browser: Browser, student: StudentData): Promise<Buffer> {
    const templatePath = path.join(this.templatesDir, 'report.ejs');
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    // Render EJS template
    const html = await ejs.renderFile(templatePath, { student });

    // Generate PDF with Puppeteer
    const page = await browser.newPage();
    
    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  async previewPdf(req: Request, res: Response): Promise<void> {
    try {
      const templatePath = path.join(this.templatesDir, 'report.ejs');
      
      if (!fs.existsSync(templatePath)) {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        });
        return;
      }

      // Sample student data for preview
      const sampleStudent: StudentData = {
        name: 'Juan Pérez González',
        progress: 85,
        competencias: [
          { name: 'Matemáticas', progress: 90 },
          { name: 'Lenguaje', progress: 80 },
          { name: 'Ciencias', progress: 85 },
          { name: 'Sociales', progress: 75 }
        ],
        institution: 'Colegio FormArte',
        grade: '11°',
        period: '2024-1'
      };

      const html = await ejs.renderFile(templatePath, { student: sampleStudent });
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);

    } catch (error) {
      logger.error('Error generating preview:', error);
      res.status(500).json({
        success: false,
        error: 'Error generando vista previa'
      });
    }
  }
}