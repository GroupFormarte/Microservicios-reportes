"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const ws_1 = __importDefault(require("ws"));
const logger_1 = require("../utils/logger");
class WebSocketService {
    constructor() {
        this.io = null;
        this.httpServer = null;
        this.wss = null;
        this.wsClients = new Set();
    }
    initialize(app, port) {
        this.httpServer = (0, http_1.createServer)(app);
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.setupEventHandlers();
        this.setupNotificationsWebSocket();
        this.httpServer.listen(port, () => {
            logger_1.logger.info(`WebSocket server started on port ${port}`);
            logger_1.logger.info(`Notifications WebSocket available at ws://localhost:${port}/ws/notifications`);
        });
    }
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            logger_1.logger.info('Client connected', { socketId: socket.id });
            socket.on('join-session', (sessionId) => {
                socket.join(sessionId);
                logger_1.logger.info('Client joined session', {
                    socketId: socket.id,
                    sessionId
                });
            });
            socket.on('disconnect', () => {
                logger_1.logger.info('Client disconnected', { socketId: socket.id });
            });
        });
    }
    setupNotificationsWebSocket() {
        if (!this.httpServer)
            return;
        // Create WebSocket server compatible with Flutter SSE service
        this.wss = new ws_1.default.Server({
            server: this.httpServer,
            path: '/ws/notifications'
        });
        this.wss.on('connection', (ws, request) => {
            logger_1.logger.info('Client connected to notifications WebSocket', {
                origin: request.headers.origin,
                userAgent: request.headers['user-agent']
            });
            // Add client to the set
            this.wsClients.add(ws);
            // Send welcome message (compatible with api_formarte_mongo)
            ws.send(JSON.stringify({
                message: 'WebSocket conectado'
            }));
            ws.on('close', () => {
                logger_1.logger.info('Client disconnected from notifications WebSocket');
                this.wsClients.delete(ws);
            });
            ws.on('error', (error) => {
                logger_1.logger.error('WebSocket error:', error);
                this.wsClients.delete(ws);
            });
        });
    }
    emitProgress(update) {
        if (!this.io) {
            logger_1.logger.warn('WebSocket not initialized, cannot emit progress');
            return;
        }
        this.io.to(update.sessionId).emit('progress-update', update);
        // Log completion stage with INFO level for visibility
        if (update.stage === 'completed') {
            logger_1.logger.info('COMPLETION WEBSOCKET EMITTED', {
                sessionId: update.sessionId,
                stage: update.stage,
                progress: update.progress,
                message: update.message,
                data: update.data
            });
        }
        else {
            logger_1.logger.debug('Progress update emitted', {
                sessionId: update.sessionId,
                stage: update.stage,
                progress: update.progress,
                message: update.message
            });
        }
    }
    emitError(sessionId, error, details) {
        if (!this.io)
            return;
        const errorData = {
            sessionId,
            error,
            details,
            timestamp: new Date()
        };
        this.io.to(sessionId).emit('error', errorData);
        logger_1.logger.error('Error emitted via WebSocket', {
            sessionId,
            error,
            details
        });
    }
    emitComplete(sessionId, result) {
        if (!this.io)
            return;
        const completeData = {
            sessionId,
            result,
            timestamp: new Date()
        };
        this.io.to(sessionId).emit('complete', completeData);
        logger_1.logger.info('Completion emitted via WebSocket', {
            sessionId,
            result: typeof result
        });
    }
    getConnectedClients(sessionId) {
        if (!this.io)
            return 0;
        if (sessionId) {
            const room = this.io.sockets.adapter.rooms.get(sessionId);
            return room ? room.size : 0;
        }
        return this.io.engine.clientsCount;
    }
    /**
     * Send PDF ready notification compatible with Flutter SSE service
     * @param pdfUrl - URL of the generated PDF
     * @param message - Custom message (optional)
     */
    notifyPdfReady(pdfUrl, message) {
        const notification = {
            status: 'pdf-ready',
            url: pdfUrl,
            message: message || 'Tu archivo está listo para descargar'
        };
        this.pushToWSClients(notification);
    }
    /**
     * Push data to all connected WebSocket clients (compatible with api_formarte_mongo)
     * @param data - Data to send to all clients
     */
    pushToWSClients(data) {
        if (this.wsClients.size === 0) {
            logger_1.logger.info('No WebSocket clients connected for notifications');
            return;
        }
        const message = JSON.stringify(data);
        let sentCount = 0;
        this.wsClients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                try {
                    client.send(message);
                    sentCount++;
                }
                catch (error) {
                    logger_1.logger.error('Error sending message to WebSocket client:', error);
                    this.wsClients.delete(client);
                }
            }
            else {
                // Remove closed connections
                this.wsClients.delete(client);
            }
        });
        logger_1.logger.info('Notification sent to WebSocket clients', {
            totalClients: this.wsClients.size,
            sentTo: sentCount,
            data: data
        });
    }
    getConnectedNotificationClients() {
        return this.wsClients.size;
    }
    close() {
        return new Promise((resolve) => {
            // Close notifications WebSocket server
            if (this.wss) {
                this.wss.close(() => {
                    logger_1.logger.info('Notifications WebSocket server closed');
                });
            }
            // Close all WebSocket connections
            this.wsClients.forEach((client) => {
                if (client.readyState === ws_1.default.OPEN) {
                    client.close();
                }
            });
            this.wsClients.clear();
            if (this.httpServer) {
                this.httpServer.close(() => {
                    logger_1.logger.info('WebSocket server closed');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
}
exports.WebSocketService = WebSocketService;
exports.websocketService = new WebSocketService();
