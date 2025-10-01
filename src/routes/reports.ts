import { Router } from 'express';
import path from 'path';
import {

  processSimulationData
} from '../controllers/reportsController';

const router = Router();

// 🎯 NEW ENDPOINT - Process simulation data
router.post('/simulation', processSimulationData);

// 🧪 TEST ENDPOINT - WebSocket test page
router.get('/test-websocket', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/test-websocket.html'));
});

export default router;