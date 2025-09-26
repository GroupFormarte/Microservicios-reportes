"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./utils/config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const websocketService_1 = require("./services/websocketService");
const reports_1 = __importDefault(require("./routes/reports"));
const health_1 = __importDefault(require("./routes/health"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin,
    credentials: config_1.config.corsCredentials,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimitWindowMs,
    max: config_1.config.rateLimitMaxRequests,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Compression middleware
app.use((0, compression_1.default)());
// Logging middleware
if (!config_1.isDevelopment) {
    app.use((0, morgan_1.default)(config_1.config.logFormat));
}
else {
    app.use((0, morgan_1.default)('dev'));
}
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static files
app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/api/reports/css', express_1.default.static(path_1.default.join(__dirname, '../public/css')));
app.use('/api/reports/assets', express_1.default.static(path_1.default.join(__dirname, '../../Recursos/assets')));
app.use('/api/reports/pdfs', express_1.default.static(path_1.default.join(__dirname, '../public/pdfs')));
// View engine setup
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
// Health check routes (no auth required)
app.use('/health', health_1.default);
// API routes with authentication
app.use('/api/reports', auth_1.apiKeyAuth, reports_1.default);
// Root endpoint - serve preview page
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server
const startServer = () => {
    // Initialize WebSocket service with the Express app
    websocketService_1.websocketService.initialize(app, config_1.config.port);
    logger_1.logger.info(`Server with WebSocket running on http://${config_1.config.host}:${config_1.config.port}`);
    logger_1.logger.info(`Environment: ${config_1.config.nodeEnv}`);
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger_1.logger.info('SIGTERM received, shutting down gracefully');
        await websocketService_1.websocketService.close();
        logger_1.logger.info('Process terminated');
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        logger_1.logger.info('SIGINT received, shutting down gracefully');
        await websocketService_1.websocketService.close();
        logger_1.logger.info('Process terminated');
        process.exit(0);
    });
};
if (require.main === module) {
    startServer();
}
exports.default = app;
