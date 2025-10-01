const express = require('express');
const pdfController = require('../interfaces/http/controllers/pdf/pdf.controller');

const router = express.Router();

// Generate PDF report
router.post('/generate-report', pdfController.generateReport);

// WebSocket status
router.get('/websocket-status', pdfController.getWebSocketStatus);

// Test notification
router.post('/test-notification', pdfController.sendTestNotification);

module.exports = router;