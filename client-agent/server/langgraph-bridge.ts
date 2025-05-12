// client-agent/server/langgraph-bridge.ts
import axios, { AxiosError } from 'axios';
import { MemoryService } from './memory-service';
import { WebSocketServer } from 'ws';

// URL where your Python LangGraph service will be exposed
//const LANGGRAPH_URL = process.env.LANGGRAPH_URL || 'http://localhost:8000/api/agent';
//const LANGGRAPH_URL = 'http://127.0.0.1:2024'
// Update this constant to use your LangGraph URL
const LANGGRAPH_URL = process.env.LANGGRAPH_URL || 'http://localhost:8000';

// URL where your Python LangGraph service is running
// Use the /project endpoint for LangSmith's local server
//  const LANGGRAPH_URL = process.env.LANGGRAPH_URL || 'http://127.0.0.1:2024/api/v1/projects/prizm-workflow-2/runs';
//const LANGGRAPH_URL = 'http://127.0.0.1:2024/api/v1/projects/prizm-workflow-2/runs';

interface ChatRequest {
  userId: string;
  message: string;
}

interface ChatResponse {
  response: string;
  error?: string;
  messages?: any[];
}

export interface LangGraphRequest {
  userId: string | number; // Allow both string and number for userId
  message: string;
  context?: {
    system_prompt?: string;
    memory_context?: {
      user_name?: string;
      is_name_introduction?: boolean;
      is_first_message?: boolean;
    };
    timestamp?: string; // Add timestamp field
  };
}

export interface LangGraphResponse {
  response: string;
  error?: string;
  sentiment?: string; // Add sentiment field
  reason?: string; // Add reason field
}

export class LangGraphBridge {
    private memoryService: MemoryService;

    constructor(wss: WebSocketServer) {
        this.memoryService = new MemoryService(wss);
    }

    async processMessage(userId: string, message: string): Promise<string> {
        try {
            // Load user memory
            const memoryData = await this.memoryService.loadMemory(userId);
            
            // Add user message to conversation memory
            await this.memoryService.addConversationMessage(userId, {
                content: message,
                type: 'human'
            });

            // Check if this is a name introduction
            const isNameIntroduction = this.isNameIntroduction(message);
            if (isNameIntroduction) {
                const name = this.extractName(message);
                if (name) {
                    // Update user memory with name
                    await this.memoryService.updateUserMemory(userId, {
                        name,
                        last_interaction: Date.now()
                    });

                    // Update entity memory
                    await this.memoryService.updateEntityMemory(userId, 'user', {
                        name,
                        last_updated: Date.now(),
                        source: 'direct_introduction'
                    });
                }
            }

            // Get user memory for context
            const userMemory = memoryData?.user_memory;
            const userName = userMemory?.name || 'unknown';

            // Check if this is the first message (no previous messages)
            const isFirstMessage = !memoryData?.conversation_memory?.messages?.length;

            // Prepare system prompt with memory context
            const systemPrompt = `You are 007, a personal productivity agent.
You help users manage their tasks, find information, and boost their productivity.
You have a friendly, helpful tone.
The user's name is ${userName}.
Keep your responses concise and focused.

If the user asks about their name, make sure to tell them their name is ${userName}.
If the user asks about tasks, offer to create a task for them.

${isFirstMessage ? 'This is the first message. Start with a greeting and ask for their name if you don\'t know it yet.' : ''}`;

            // Call LangGraph with our context
            const response = await this.processWithLangGraph(systemPrompt, message);

            // Add AI response to conversation memory
            await this.memoryService.addConversationMessage(userId, {
                content: response,
                type: 'ai'
            });

            return response;
        } catch (error) {
            console.error('Error processing message:', error);
            return 'I apologize, but I encountered an error processing your message.';
        }
    }

    private isNameIntroduction(message: string): boolean {
        return message.toLowerCase().includes('my name is');
    }

    private extractName(message: string): string | null {
        const content = message.toLowerCase();
        if (content.includes('my name is')) {
            return content.split('my name is')[1].trim();
        }
        return null;
    }

    private async processWithLangGraph(systemPrompt: string, message: string): Promise<string> {
        try {
            // Prepare the request for LangGraph
            const request: LangGraphRequest = {
                userId: 'user',
                message: message,
                context: {
                    system_prompt: systemPrompt,
                    memory_context: {
                        user_name: systemPrompt.match(/The user's name is (.*?)\./)?.[1] || 'unknown',
                        is_name_introduction: this.isNameIntroduction(message),
                        is_first_message: systemPrompt.includes('This is the first message')
                    },
                    timestamp: new Date().toISOString()
                }
            };

            // Call the LangGraph agent
            const response = await callLangGraphAgent(request);

            // If this is the first message and the response is the default LangGraph greeting,
            // override it with our memory-aware greeting
            if (request.context?.memory_context?.is_first_message && 
                response.response.includes('AI assistant powered by LangGraph')) {
                const userName = request.context.memory_context.user_name;
                if (userName === 'unknown') {
                    return "Hello! I'm 007, your personal productivity agent. I don't think we've met before. What's your name?";
                } else {
                    return `Hello ${userName}! I'm 007, your personal productivity agent. How can I help you today?`;
                }
            }

            return response.response;
        } catch (error) {
            console.error('Error in processWithLangGraph:', error);
            return 'I apologize, but I encountered an error processing your message.';
        }
    }
}

/**
 * Communicates with the Python LangGraph agent
 * @param request The request to send to the LangGraph agent
 * @returns The response from the LangGraph agent
 */
export async function callLangGraphAgent(request: LangGraphRequest): Promise<LangGraphResponse> {
  try {
    console.log(`Calling LangGraph agent with request:`, request);
    
    // Prepare the request body for the LangGraph agent
    const requestBody = {
      customer: {
        name: request.context?.memory_context?.user_name || `User ${request.userId}`,
        email: `user${request.userId}@example.com`,
        phoneNumber: "555-123-4567",
        zipCode: "00000"
      },
      task: {
        description: request.message,
        category: "General Inquiry"
      },
      vendor: {
        name: "PRIZM Assistant",
        email: "assistant@prizm.ai",
        phoneNumber: "555-987-6543"
      },
      // Include memory context
      memory: {
        system_prompt: request.context?.system_prompt,
        is_name_introduction: request.context?.memory_context?.is_name_introduction,
        user_name: request.context?.memory_context?.user_name
      },
      // Include any additional context
      ...request.context
    };
    
    console.log("Sending to LangGraph:", JSON.stringify(requestBody, null, 2));
    
    // Connect directly to the LangGraph app
    try {
      const directResponse = await axios.post(`${LANGGRAPH_URL}/api/agent`, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log("Received response from LangGraph:", directResponse.data);
      
      // If we get a successful response, process it
      if (directResponse.data) {
        return processLangGraphResponse(directResponse.data);
      }
    } catch (error) {
      const directError: unknown = error;
      console.error("LangGraph error:", directError instanceof Error ? directError.message : 'Unknown error');
      
      // Fall through to fallback response
      console.warn("LangGraph connection failed, using fallback");
      return getFallbackResponse(request.message);
    }
    
    // If we reach here, something went wrong
    return getFallbackResponse(request.message);
  } catch (error) {
    // General error handling
    const err: unknown = error;
    console.error('Error calling LangGraph agent:', err instanceof Error ? err.message : 'Unknown error');
    return getFallbackResponse(request.message);
  }
}

function processLangGraphResponse(data: any): LangGraphResponse {
  // Process the LangGraph response
  return {
    response: data.response || data.message || "I understand. How can I help you today?",
    sentiment: data.sentiment || "neutral",
    reason: data.reason || "No additional reason provided"
  };
}

function getFallbackResponse(message: string): LangGraphResponse {
  return {
    response: "I understand. How can I help you today?",
    sentiment: "neutral",
    reason: "Fallback response"
  };
}