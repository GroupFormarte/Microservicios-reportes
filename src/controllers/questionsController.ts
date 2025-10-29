import { Request, Response } from 'express';
import { QuestionsPdfService } from '../services/questionsPdfService';
import { websocketService } from '../services/websocketService';
import { QuestionPdfRequest, QuestionForPdf } from '../types/questions';
import fs from 'fs';
import path from 'path';

export class QuestionsController {
  private questionsPdfService: QuestionsPdfService;

  constructor() {
    this.questionsPdfService = new QuestionsPdfService();
  }

  async generateQuestionsPdf(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    
    try {
      websocketService.emitProgress({
        sessionId,
        stage: 'validating_data',
        progress: 10,
        message: 'Validating questions data...',
        timestamp: new Date()
      });

      const { questions, title, options }: QuestionPdfRequest = req.body;



// Save questions data to JSON file for debugging
const debugDir = path.join(__dirname, '../../debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `questions-debug-${timestamp}.json`;
const filepath = path.join(debugDir, filename);

fs.writeFileSync(filepath, JSON.stringify({ questions, title, options }, null, 2));
console.log(`Questions data saved to: ${filepath}`);

      // Validate input
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Questions array is required and cannot be empty'
        });
        return;
      }

      if (!title || typeof title !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Title is required and must be a string'
        });
        return;
      }

      websocketService.emitProgress({
        sessionId,
        stage: 'processing_questions',
        progress: 30,
        message: `Processing ${questions.length} questions...`,
        timestamp: new Date()
      });

      // Generate PDF with dynamic base URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = await this.questionsPdfService.generatePdf({
        questions,
        title,
        options,
        sessionId
      }, baseUrl);

      websocketService.emitProgress({
        sessionId,
        stage: 'completed',
        progress: 100,
        message: 'PDF generation completed successfully',
        timestamp: new Date()
      });

      // Send Flutter-compatible notification
      websocketService.notifyPdfReady(
        result.downloadUrl,
        `PDF de ${questions.length} preguntas generado exitosamente`
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Questions PDF generated successfully',
          totalQuestions: questions.length,
          pdf: {
            fileName: result.fileName,
            url: result.url,
            downloadUrl: result.downloadUrl
          }
        }
      });

    } catch (error) {
      console.error('Error generating questions PDF:', error);
      
      websocketService.emitProgress({
        sessionId,
        stage: 'error',
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error generating PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async listAvailablePdfs(req: Request, res: Response): Promise<void> {
    try {
      const files = await this.questionsPdfService.listPdfs();
      
      res.status(200).json({
        success: true,
        data: {
          files: files
        }
      });
    } catch (error) {
      console.error('Error listing PDFs:', error);
      res.status(500).json({
        success: false,
        error: 'Error listing available PDFs'
      });
    }
  }

  async deletePdf(req: Request, res: Response): Promise<void> {
    try {
      const { fileName } = req.params;
      
      if (!fileName) {
        res.status(400).json({
          success: false,
          error: 'File name is required'
        });
        return;
      }

      await this.questionsPdfService.deletePdf(fileName);
      
      res.status(200).json({
        success: true,
        message: 'PDF deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Error deleting PDF'
      });
    }
  }
}