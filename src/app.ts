import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config, isDevelopment } from './utils/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { hybridAuth } from './middleware/auth';
import { websocketService } from './services/websocketService';
import { connectDatabase, disconnectDatabase } from './config/database';
import reportsRoutes from './routes/reports';
import { questionsRouter } from './routes/questions';
import pdfRoutes from './routes/pdf';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { ReportData } from './models/ReportData';
import mongoose, { Schema } from 'mongoose';

const app = express();

// Security middleware
app.use(helmet({
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

// CORS configuration - Allow all origins
app.use(cors({
  origin: true,
  credentials: config.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (!isDevelopment) {
  app.use(morgan(config.logFormat));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static files (must be before authenticated routes to avoid auth middleware)
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/static/css', express.static(path.join(__dirname, '../public/css')));
app.use('/static/assets', express.static(path.join(__dirname, '../../Recursos/assets')));
app.use('/static/pdfs', express.static(path.join(__dirname, '../public/pdfs')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// PDF files access without authentication (specific route before general /api/reports)
app.use('/api/reports/pdfs', express.static(path.join(__dirname, '../public/pdfs')));

// Excel files access without authentication (specific route before general /api/reports)
app.use('/api/reports/excels', express.static(path.join(__dirname, '../public/excels')));

// CSS files access without authentication (specific route before general /api/reports)
app.use('/api/reports/css', express.static(path.join(__dirname, '../public/css')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// Authentication routes (no auth required for login)
app.use('/api/auth', authRoutes);

// API routes with authentication (now supports both JWT and API Key)
app.use('/api/reports', hybridAuth, reportsRoutes);
app.use('/api/reports/questions', questionsRouter);
app.use('/api/pdf', hybridAuth, pdfRoutes);

// Root endpoint - serve preview page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
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
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connection established');


    // 1. Modelo auxiliar de migraciones
    const Migration = mongoose.model('Migration', new Schema({
      name: { type: String, unique: true }
    }));

    // 2. Al iniciar el servidor, ejecutas esto:
    const migrationName = "fix-examDate-to-Date-v2";
    const alreadyRan = await Migration.findOne({ name: migrationName });

    if (!alreadyRan) {
      console.log("⏳ Ejecutando migración: convertir examDate a Date...");

      const result = await ReportData.updateMany(
        { examDate: { $type: "string" } },
        [{ $set: { examDate: { $toDate: "$examDate" } } }]
      );

      console.log(`✅ Migración completada: ${result.modifiedCount} documentos actualizados`);

      await Migration.create({ name: migrationName });

      console.log("✅ Migración registrada.");
    } else {
      console.log("✔️ Migración ya estaba aplicada, se ignora.");
    }
    // Initialize WebSocket service with the Express app
    websocketService.initialize(app, config.port);

    logger.info(`Server with WebSocket running on http://${config.host}:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await websocketService.close();
      await disconnectDatabase();
      logger.info('Process terminated');
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await websocketService.close();
      await disconnectDatabase();
      logger.info('Process terminated');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;