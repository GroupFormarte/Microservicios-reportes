"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const logger_1 = require("../utils/logger");
class WebSocketService {
    constructor() {
        this.io = null;
        this.httpServer = null;
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
        this.httpServer.listen(port, () => {
            logger_1.logger.info(`WebSocket server started on port ${port}`);
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
    emitProgress(update) {
        if (!this.io) {
            logger_1.logger.warn('WebSocket not initialized, cannot emit progress');
            return;
        }
        this.io.to(update.sessionId).emit('progress-update', update);
        logger_1.logger.debug('Progress update emitted', {
            sessionId: update.sessionId,
            stage: update.stage,
            progress: update.progress,
            message: update.message
        });
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
    close() {
        return new Promise((resolve) => {
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
