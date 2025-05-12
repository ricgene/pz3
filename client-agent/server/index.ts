// client-agent/server/index.ts
import express from 'express';
import { createServer } from 'http';
import { setupWebSocketServer } from './websocket';
import { handleAgentChat } from './agent-webhook';
import cors from 'cors';
import { LangGraphBridge } from './langgraph-bridge';
import { MemoryService } from './memory-service';

const app = express();
const httpServer = createServer(app);

// Set up WebSocket server
const wss = setupWebSocketServer(httpServer);

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://prizmpoc.web.app'],
  credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const langGraphBridge = new LangGraphBridge(wss);
const memoryService = new MemoryService(wss);

// Original chat endpoint (keep for backward compatibility)
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const response = await langGraphBridge.processMessage(userId, message);
    res.json({ response });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New Agent powered chat endpoint
app.post('/api/agent-chat', handleAgentChat);

// Memory check endpoint
app.get('/api/memory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const memoryData = await memoryService.loadMemory(userId);
    if (!memoryData) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json(memoryData);
  } catch (error) {
    console.error('Error retrieving memory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});