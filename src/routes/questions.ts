import express from 'express';
import { QuestionsController } from '../controllers/questionsController';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const questionsController = new QuestionsController();

// Rate limiting for PDF generation
const pdfGenerationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 PDF generations per windowMs
  message: {
    success: false,
    error: 'Too many PDF generation requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth middleware is applied at the app level in app.ts

/**
 * @route POST /api/reports/questions
 * @description Generate PDF from questions with Delta format
 * @access Protected (requires API key)
 */
router.post('/', pdfGenerationLimit, async (req, res) => {

  
  await questionsController.generateQuestionsPdf(req, res);
});

/**
 * @route GET /api/reports/questions/pdfs
 * @description List available question PDFs
 * @access Protected (requires API key)
 */
router.get('/pdfs', async (req, res) => {
  await questionsController.listAvailablePdfs(req, res);
});

/**
 * @route DELETE /api/reports/questions/pdfs/:fileName
 * @description Delete a specific question PDF
 * @access Protected (requires API key)
 */
router.delete('/pdfs/:fileName', async (req, res) => {
  await questionsController.deletePdf(req, res);
});

export { router as questionsRouter };