// client-agent/server/index.ts
import express from 'express';
import { createServer } from 'http';
import { setupWebSocketServer } from './websocket';
import { handleAgentChat } from './agent-webhook';
import cors from 'cors';

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

// Original chat endpoint (keep for backward compatibility)
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    // Create user message
    const userMessage = {
      id: Date.now(),
      fromId: userId,
      toId: 0, // AI assistant ID
      content: message,
      timestamp: new Date(),
      isAiAssistant: false
    };

    // Create AI response
    const aiMessage = {
      id: Date.now() + 1,
      fromId: 0, // AI assistant ID
      toId: userId,
      content: `I received your message: "${message}". I'm here to help!`,
      timestamp: new Date(),
      isAiAssistant: true
    };

    // Return both messages
    res.json({
      userMessage,
      assistantMessage: aiMessage
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New Agent powered chat endpoint
app.post('/api/agent-chat', handleAgentChat);

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});