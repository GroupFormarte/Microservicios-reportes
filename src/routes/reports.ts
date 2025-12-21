import { Router } from 'express';
import path from 'path';
import {
  processSimulationData,
  generateExcelReport,
  generateExcelAnswers,
  regenerateReport,
  listSimulationDataFiles,
  getSimulationDataFile,
  cleanupOldSimulationData
} from '../controllers/reportsController';

const router = Router();

// 🎯 NEW ENDPOINT - Process simulation data
router.post('/simulation', processSimulationData);

// 🔄 REGENERATE ENDPOINT - Regenerate reports from report_data
router.post('/regenerate', regenerateReport);

// 📊 EXCEL ENDPOINT - Generate Excel report from simulation data (scores)
router.post('/excel-puntajes', generateExcelReport);

// 📝 EXCEL ANSWERS ENDPOINT - Generate Excel report with student answers
router.post('/excel-respuestas', generateExcelAnswers);

// 📁 DATA MANAGEMENT ENDPOINTS - Manage saved simulation data
router.get('/data/list', listSimulationDataFiles);
router.get('/data/:fileName', getSimulationDataFile);
router.delete('/data/cleanup', cleanupOldSimulationData);

// 🧪 TEST ENDPOINT - WebSocket test page
router.get('/test-websocket', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/test-websocket.html'));
});

export default router; 