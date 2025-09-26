import { Server } from 'socket.io';
import { createServer } from 'http';
import { Express } from 'express';
import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { ProgressUpdate, WebSocketError, WebSocketComplete } from '../types/index';

export class WebSocketService {
  private io: Server | null = null;
  private httpServer: any = null;
  private wss: WebSocket.Server | null = null;
  private wsClients: Set<WebSocket> = new Set();

  initialize(app: Express, port: number): void {
    this.httpServer = createServer(app);
    
    this.io = new Server(this.httpServer, {
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
      logger.info(`WebSocket server started on port ${port}`);
      logger.info(`Notifications WebSocket available at ws://localhost:${port}/ws/notifications`);
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('join-session', (sessionId: string) => {
        socket.join(sessionId);
        logger.info('Client joined session', { 
          socketId: socket.id, 
          sessionId 
        });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });
  }

  private setupNotificationsWebSocket(): void {
    if (!this.httpServer) return;

    // Create WebSocket server compatible with Flutter SSE service
    this.wss = new WebSocket.Server({ 
      server: this.httpServer,
      path: '/ws/notifications'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      logger.info('Client connected to notifications WebSocket', { 
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
        logger.info('Client disconnected from notifications WebSocket');
        this.wsClients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.wsClients.delete(ws);
      });
    });
  }

  emitProgress(update: ProgressUpdate): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit progress');
      return;
    }

    this.io.to(update.sessionId).emit('progress-update', update);
    
    logger.debug('Progress update emitted', {
      sessionId: update.sessionId,
      stage: update.stage,
      progress: update.progress,
      message: update.message
    });
  }

  emitError(sessionId: string, error: string, details?: any): void {
    if (!this.io) return;

    const errorData: WebSocketError = {
      sessionId,
      error,
      details,
      timestamp: new Date()
    };

    this.io.to(sessionId).emit('error', errorData);

    logger.error('Error emitted via WebSocket', {
      sessionId,
      error,
      details
    });
  }

  emitComplete(sessionId: string, result: any): void {
    if (!this.io) return;

    const completeData: WebSocketComplete = {
      sessionId,
      result,
      timestamp: new Date()
    };

    this.io.to(sessionId).emit('complete', completeData);

    logger.info('Completion emitted via WebSocket', {
      sessionId,
      result: typeof result
    });
  }

  getConnectedClients(sessionId?: string): number {
    if (!this.io) return 0;

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
  notifyPdfReady(pdfUrl: string, message?: string): void {
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
  pushToWSClients(data: any): void {
    if (this.wsClients.size === 0) {
      logger.info('No WebSocket clients connected for notifications');
      return;
    }

    const message = JSON.stringify(data);
    let sentCount = 0;

    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          sentCount++;
        } catch (error) {
          logger.error('Error sending message to WebSocket client:', error);
          this.wsClients.delete(client);
        }
      } else {
        // Remove closed connections
        this.wsClients.delete(client);
      }
    });

    logger.info('Notification sent to WebSocket clients', {
      totalClients: this.wsClients.size,
      sentTo: sentCount,
      data: data
    });
  }

  getConnectedNotificationClients(): number {
    return this.wsClients.size;
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      // Close notifications WebSocket server
      if (this.wss) {
        this.wss.close(() => {
          logger.info('Notifications WebSocket server closed');
        });
      }

      // Close all WebSocket connections
      this.wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.wsClients.clear();

      if (this.httpServer) {
        this.httpServer.close(() => {
          logger.info('WebSocket server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export const websocketService = new WebSocketService();