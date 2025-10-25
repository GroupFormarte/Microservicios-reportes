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
const database_1 = require("./config/database");
const reports_1 = __importDefault(require("./routes/reports"));
const questions_1 = require("./routes/questions");
const pdf_1 = __importDefault(require("./routes/pdf"));
const health_1 = __importDefault(require("./routes/health"));
const auth_2 = __importDefault(require("./routes/auth"));
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
    origin: config_1.isDevelopment ? true : config_1.config.corsOrigin,
    credentials: config_1.config.corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
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
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '100mb' }));
// Static files (must be before authenticated routes to avoid auth middleware)
app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/static/css', express_1.default.static(path_1.default.join(__dirname, '../public/css')));
app.use('/static/assets', express_1.default.static(path_1.default.join(__dirname, '../../Recursos/assets')));
app.use('/static/pdfs', express_1.default.static(path_1.default.join(__dirname, '../public/pdfs')));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// PDF files access without authentication (specific route before general /api/reports)
app.use('/api/reports/pdfs', express_1.default.static(path_1.default.join(__dirname, '../public/pdfs')));
// Excel files access without authentication (specific route before general /api/reports)
app.use('/api/reports/excels', express_1.default.static(path_1.default.join(__dirname, '../public/excels')));
// CSS files access without authentication (specific route before general /api/reports)
app.use('/api/reports/css', express_1.default.static(path_1.default.join(__dirname, '../public/css')));
// View engine setup
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
// Health check routes (no auth required)
app.use('/health', health_1.default);
// Authentication routes (no auth required for login)
app.use('/api/auth', auth_2.default);
// API routes with authentication (now supports both JWT and API Key)
app.use('/api/reports', auth_1.hybridAuth, reports_1.default);
app.use('/api/reports/questions', questions_1.questionsRouter);
app.use('/api/pdf', auth_1.hybridAuth, pdf_1.default);
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
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.connectDatabase)();
        logger_1.logger.info('MongoDB connection established');
        // Initialize WebSocket service with the Express app
        websocketService_1.websocketService.initialize(app, config_1.config.port);
        logger_1.logger.info(`Server with WebSocket running on http://${config_1.config.host}:${config_1.config.port}`);
        logger_1.logger.info(`Environment: ${config_1.config.nodeEnv}`);
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger_1.logger.info('SIGTERM received, shutting down gracefully');
            await websocketService_1.websocketService.close();
            await (0, database_1.disconnectDatabase)();
            logger_1.logger.info('Process terminated');
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            logger_1.logger.info('SIGINT received, shutting down gracefully');
            await websocketService_1.websocketService.close();
            await (0, database_1.disconnectDatabase)();
            logger_1.logger.info('Process terminated');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
if (require.main === module) {
    startServer();
}
exports.default = app;
