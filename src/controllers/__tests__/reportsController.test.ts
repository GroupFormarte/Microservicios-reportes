import request from 'supertest';
import express from 'express';
import { processSimulationData } from '../reportsController';

// Create test app
const app = express();
app.use(express.json());
app.post('/simulation', processSimulationData);

// Mock services
jest.mock('../../services/renderService');
jest.mock('../../services/pdfService');
jest.mock('../../services/websocketService');

describe('ReportsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /simulation', () => {
    const validUdeaData = {
      tipe_inform: 'udea',
      campus: 'FORMARTE MEDELLÍN',
      students: [
        {
          id: 'student1',
          name: 'Juan Pérez',
          programa: 'Ingeniería',
          scores: [85, 90, 78, 92, 88]
        }
      ],
      questions: [
        { id: 1, competence: 'Matemáticas', difficulty: 'medium' },
        { id: 2, competence: 'Lectura', difficulty: 'easy' }
      ]
    };

    const validUnalData = {
      tipe_inform: 'unal',
      campus: 'FORMARTE BOGOTÁ',
      students: [
        {
          id: 'student1',
          name: 'María García',
          carrera: 'Medicina',
          puntaje_global: 450
        }
      ]
    };

    it('should process UDEA report successfully', async () => {
      const mockPdfPath = '/path/to/generated/report.pdf';
      
      // Mock renderService
      const mockRenderService = {
        renderTemplate: jest.fn().mockResolvedValue('<html>Report content</html>')
      };
      
      // Mock pdfService
      const mockPdfService = {
        generatePDF: jest.fn().mockResolvedValue({
          success: true,
          filePath: mockPdfPath,
          fileName: 'reporte_UDEA_123.pdf',
          url: `http://localhost:3001/public/pdfs/reporte_UDEA_123.pdf`
        })
      };

      jest.doMock('../../services/renderService', () => mockRenderService);
      jest.doMock('../../services/pdfService', () => mockPdfService);

      const response = await request(app)
        .post('/simulation')
        .send(validUdeaData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pdf).toBeDefined();
      expect(response.body.data.pdf.url).toContain('.pdf');
    });

    it('should process UNAL report successfully', async () => {
      const mockPdfPath = '/path/to/generated/report.pdf';
      
      const mockRenderService = {
        renderTemplate: jest.fn().mockResolvedValue('<html>UNAL Report content</html>')
      };
      
      const mockPdfService = {
        generatePDF: jest.fn().mockResolvedValue({
          success: true,
          filePath: mockPdfPath,
          fileName: 'reporte_UNAL_456.pdf',
          url: `http://localhost:3001/public/pdfs/reporte_UNAL_456.pdf`
        })
      };

      jest.doMock('../../services/renderService', () => mockRenderService);
      jest.doMock('../../services/pdfService', () => mockPdfService);

      const response = await request(app)
        .post('/simulation')
        .send(validUnalData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pdf).toBeDefined();
    });

    it('should reject invalid report type', async () => {
      const invalidData = {
        tipe_inform: 'invalid_type',
        campus: 'FORMARTE MEDELLÍN',
        students: []
      };

      const response = await request(app)
        .post('/simulation')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('tipo de informe');
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        tipe_inform: 'udea'
        // missing campus and students
      };

      const response = await request(app)
        .post('/simulation')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should reject empty students array', async () => {
      const emptyStudentsData = {
        tipe_inform: 'udea',
        campus: 'FORMARTE MEDELLÍN',
        students: []
      };

      const response = await request(app)
        .post('/simulation')
        .send(emptyStudentsData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('estudiantes');
    });

    it('should handle PDF generation failure', async () => {
      const mockRenderService = {
        renderTemplate: jest.fn().mockResolvedValue('<html>Content</html>')
      };
      
      const mockPdfService = {
        generatePDF: jest.fn().mockResolvedValue({
          success: false,
          error: 'PDF generation failed'
        })
      };

      jest.doMock('../../services/renderService', () => mockRenderService);
      jest.doMock('../../services/pdfService', () => mockPdfService);

      const response = await request(app)
        .post('/simulation')
        .send(validUdeaData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('PDF');
    });

    it('should handle render service failure', async () => {
      const mockRenderService = {
        renderTemplate: jest.fn().mockRejectedValue(new Error('Render failed'))
      };

      jest.doMock('../../services/renderService', () => mockRenderService);

      const response = await request(app)
        .post('/simulation')
        .send(validUdeaData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should validate UDEA specific fields', async () => {
      const invalidUdeaData = {
        tipe_inform: 'udea',
        campus: 'FORMARTE MEDELLÍN',
        students: [
          {
            id: 'student1',
            name: 'Juan Pérez'
            // missing programa and scores for UDEA
          }
        ]
      };

      const response = await request(app)
        .post('/simulation')
        .send(invalidUdeaData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate UNAL specific fields', async () => {
      const invalidUnalData = {
        tipe_inform: 'unal',
        campus: 'FORMARTE BOGOTÁ',
        students: [
          {
            id: 'student1',
            name: 'María García'
            // missing carrera and puntaje_global for UNAL
          }
        ]
      };

      const response = await request(app)
        .post('/simulation')
        .send(invalidUnalData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/simulation')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle large payload within limits', async () => {
      const largeDataSet = {
        tipe_inform: 'udea',
        campus: 'FORMARTE MEDELLÍN',
        students: Array.from({ length: 100 }, (_, i) => ({
          id: `student${i}`,
          name: `Estudiante ${i}`,
          programa: 'Ingeniería',
          scores: [85, 90, 78, 92, 88]
        })),
        questions: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          competence: 'Matemáticas',
          difficulty: 'medium'
        }))
      };

      const mockRenderService = {
        renderTemplate: jest.fn().mockResolvedValue('<html>Large report</html>')
      };
      
      const mockPdfService = {
        generatePDF: jest.fn().mockResolvedValue({
          success: true,
          filePath: '/path/to/large/report.pdf',
          fileName: 'reporte_large_789.pdf',
          url: `http://localhost:3001/public/pdfs/reporte_large_789.pdf`
        })
      };

      jest.doMock('../../services/renderService', () => mockRenderService);
      jest.doMock('../../services/pdfService', () => mockPdfService);

      const response = await request(app)
        .post('/simulation')
        .send(largeDataSet);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});