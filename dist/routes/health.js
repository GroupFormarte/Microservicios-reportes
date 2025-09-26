"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config_1.config.nodeEnv,
        version: '1.0.0',
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
    };
    logger_1.logger.debug('Health check performed', healthData);
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
    }
    else {
        res.status(503).json({
            success: false,
            error: 'Service not ready'
        });
    }
});
exports.default = router;
