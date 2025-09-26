import { Router } from 'express';
import {
  
  processSimulationData
} from '../controllers/reportsController';

const router = Router();

// 🎯 NEW ENDPOINT - Process simulation data
router.post('/simulation', processSimulationData);


export default router;