import { WebSocket } from 'ws';
import { addClient, removeClient } from './sse.service';

export const handleWebSocketConnection = (ws: WebSocket) => {
  addClient(ws);

  ws.send(JSON.stringify({ message: 'WebSocket conectado' }));

  ws.on('message', (message) => {
    console.log('Mensaje del cliente:', message.toString());
    // Puedes reaccionar a mensajes entrantes si quieres
  });

  ws.on('close', () => {
    removeClient(ws);
    console.log('Cliente WebSocket desconectado');
  });
};