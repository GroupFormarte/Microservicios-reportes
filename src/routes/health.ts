import { Router } from 'express';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '1.0.0',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };

  logger.debug('Health check performed', healthData);

  res.json({
    success: true,
    data: healthData
  });
});

router.get('/ready', (req, res) => {
  // Check if all dependencies are ready
  const isReady = true; // Add actual readiness checks here
  
  if (isReady) {
    res.json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString()
      }
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'Service not ready'
    });
  }
});

export default router;