import { WebSocket } from 'ws';

let clients: WebSocket[] = [];

export const addClient = (ws: WebSocket) => {
  clients.push(ws);
};

export const removeClient = (ws: WebSocket) => {
  clients = clients.filter((client) => client !== ws);
};

export const pushToWSClients = (data: any) => {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};