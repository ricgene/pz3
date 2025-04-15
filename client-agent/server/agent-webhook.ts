// client-agent/server/agent-webhook.ts
import { Request, Response } from 'express';
import { callLangGraphAgent, LangGraphRequest, LangGraphResponse } from './langgraph-bridge';

// Interface for the message structure
interface ChatMessage {
  id: number;
  fromId: number;
  toId: number;
  content: string;
  timestamp: Date;
  isAiAssistant: boolean;
}

// Interface for chat requests
interface ChatRequest {
  userId: number;
  message: string;
}

// Flag to control whether to use the real agent or mock
const USE_REAL_AGENT = true; // Set this to true to use the real agent

/**
 * Handle chat requests from the client
 */
export async function handleAgentChat(req: Request, res: Response) {
  try {
    console.log("Server received request:", req.body);
    
    const { userId, message } = req.body as ChatRequest;
    
    if (!userId || !message) {
      console.error("Missing required fields in request");
      return res.status(400).json({ 
        error: "Missing required fields: userId and message are required" 
      });
    }
    
    console.log(`Received chat request from user ${userId}: "${message}"`);
    
    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      fromId: userId,
      toId: 0, // AI assistant ID
      content: message,
      timestamp: new Date(),
      isAiAssistant: false
    };
    
    let agentResponse: string;
    
    if (USE_REAL_AGENT) {
      try {
        // Call the actual LangGraph agent via the bridge
        console.log("Calling LangGraph agent via bridge...");
        
        const langGraphRequest: LangGraphRequest = {
          userId,
          message,
          context: {
            // Add any additional context here
            timestamp: new Date().toISOString()
          }
        };
        
        const langGraphResult = await callLangGraphAgent(langGraphRequest);
        
        agentResponse = langGraphResult.response;
        
        // Log additional information from LangGraph if available
        if (langGraphResult.sentiment) {
          console.log(`Detected sentiment: ${langGraphResult.sentiment}`);
        }
        if (langGraphResult.reason) {
          console.log(`Sentiment reason: ${langGraphResult.reason}`);
        }
        
        console.log("LangGraph agent response:", agentResponse);
      } catch (error) {
        console.error("Error calling LangGraph agent, falling back to mock:", error);
        // Fall back to mock responses
        agentResponse = await mockLangGraphAgent(message);
      }
    } else {
      // Use mock responses
      agentResponse = await mockLangGraphAgent(message);
    }
    
    // Create AI message
    const aiMessage: ChatMessage = {
      id: Date.now() + 1,
      fromId: 0, // AI assistant ID
      toId: userId,
      content: agentResponse,
      timestamp: new Date(),
      isAiAssistant: true
    };
    
    // Debug what we're sending back
    console.log("Sending back to client:", {
      userMessage,
      assistantMessage: aiMessage
    });
    
    // Return both messages
    res.json({
      userMessage,
      assistantMessage: aiMessage
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    // Fix for the TS18046 error - properly handle unknown error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Internal server error', message: errorMessage });
  }
}

/**
 * Mock LangGraph agent response as a fallback
 */
async function mockLangGraphAgent(userMessage: string): Promise<string> {
  console.log(`[Mock LangGraph Agent] Processing message: ${userMessage}`);
  
  // Simulate different responses based on keywords in the user message
  const lowerMessage = userMessage.toLowerCase();
  
  // Add 1-second delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI assistant. How can I help you with your home improvement needs today?";
  } 
  else if (lowerMessage.includes('quote') || lowerMessage.includes('estimate')) {
    return "I'd be happy to help you get a quote. Could you provide more details about your project, including the type of work, approximate size, and your location?";
  }
  else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "Pricing can vary significantly based on the specifics of your project. To give you a better estimate, could you share more details about what you have in mind?";
  }
  else if (lowerMessage.includes('contractor') || lowerMessage.includes('professional')) {
    return "Finding the right contractor is important. I can help connect you with verified professionals in your area. What type of contractor are you looking for?";
  }
  else if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  else {
    // Default response for other messages
    return `I understand you're interested in: "${userMessage}". To better assist you, could you provide some more details about your home improvement project?`;
  }
}