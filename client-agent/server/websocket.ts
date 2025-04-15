import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WebSocketClient extends WebSocket {
  userId?: number;
  on(event: string, listener: (...args: any[]) => void): this;
}

// Store connected clients
const clients = new Map<number, WebSocketClient>();

export function setupWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          // Handle authentication
          ws.userId = data.userId;
          clients.set(data.userId, ws);
          console.log(`User ${data.userId} authenticated`);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`User ${ws.userId} disconnected`);
      }
    });
  });

  return wss;
}

// Function to broadcast a message to a specific user
export function sendToUser(userId: number, message: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// Function to broadcast a message to all connected clients
export function broadcast(message: any, excludeUserId?: number) {
  clients.forEach((client: WebSocketClient, userId: number) => {
    if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
} 