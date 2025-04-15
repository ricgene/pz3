// client-agent/server/langgraph-bridge.ts
import axios, { AxiosError } from 'axios';

// URL where your Python LangGraph service will be exposed
//const LANGGRAPH_URL = process.env.LANGGRAPH_URL || 'http://localhost:8000/api/agent';
const LANGGRAPH_URL = 'http://127.0.0.1:2024'

// URL where your Python LangGraph service is running
// Use the /project endpoint for LangSmith's local server
//  const LANGGRAPH_URL = process.env.LANGGRAPH_URL || 'http://127.0.0.1:2024/api/v1/projects/prizm-workflow-2/runs';
//const LANGGRAPH_URL = 'http://127.0.0.1:2024/api/v1/projects/prizm-workflow-2/runs';


// Interface for the request to the LangGraph agent
export interface LangGraphRequest {
  userId: string | number;
  message: string;
  context?: Record<string, any>;
}

// Interface for the response from the LangGraph agent
export interface LangGraphResponse {
  response: string;
  sentiment?: string;
  reason?: string;
  messages?: any[];
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
        name: `User ${request.userId}`,
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
      // Include any additional context
      ...request.context
    };
    
    console.log("Sending to LangGraph:", JSON.stringify(requestBody, null, 2));
    
    // Try different approaches to connect to LangGraph
    
    // Approach 1: Try connecting to the direct workflow endpoint
    try {
      const directResponse = await axios.post('http://127.0.0.1:8000/api/agent', requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log("Received response from direct endpoint:", directResponse.data);
      
      // If we get a successful response, process it
      if (directResponse.data) {
        return processLangGraphResponse(directResponse.data);
      }
    } catch (error) {
      // Explicitly type the error
      const directError: unknown = error;
      console.error("Direct endpoint error:", directError instanceof Error ? directError.message : 'Unknown error');
      // Continue to next approach
    }
    
    // Approach 2: Try connecting to the API run endpoint
    try {
      const apiResponse = await axios.post(LANGGRAPH_URL, { 
        project_name: "prizm-workflow-2",
        inputs: requestBody
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log("Received response from API endpoint:", apiResponse.data);
      
      // If we get a successful response, process it
      if (apiResponse.data && apiResponse.data.outputs) {
        return processLangGraphResponse(apiResponse.data.outputs);
      }
    } catch (error) {
      // Explicitly type the error
      const apiError: unknown = error;
      console.error("API endpoint error:", apiError instanceof Error ? apiError.message : 'Unknown error');
      // Fall through to mockup response
    }
    
    // If we've tried all approaches and failed, use fallback
    console.warn("All LangGraph connection attempts failed, using fallback");
    return getFallbackResponse(request.message);
    
  } catch (error) {
    // Explicitly type the error as unknown
    const err: unknown = error;
    console.error('Error calling LangGraph agent:', err instanceof Error ? err.message : 'Unknown error');
    return getFallbackResponse(request.message);
  }
}

// Helper function to process the LangGraph response
function processLangGraphResponse(data: any): LangGraphResponse {
  // Print the full response for debugging
  console.log("Processing LangGraph response:", JSON.stringify(data, null, 2));
  
  // Try to extract information from various response formats
  if (!data) {
    return getFallbackResponse("Empty response");
  }
  
  // Handle different response formats
  
  // Format 1: Direct workflow output
  if (data.customer_email || data.vendor_email || data.messages) {
    return {
      response: data.messages?.[data.messages.length - 1]?.content || 
                data.response || 
                "I processed your request but wasn't sure how to respond.",
      sentiment: data.sentiment || "unknown",
      reason: data.reason || "",
      messages: data.messages || []
    };
  }
  
  // Format 2: LangSmith API output
  if (data.outputs && typeof data.outputs === 'object') {
    return processLangGraphResponse(data.outputs);
  }
  
  // Format 3: Simple text response
  if (typeof data === 'string') {
    return {
      response: data,
      sentiment: "unknown"
    };
  }
  
  // Couldn't determine format, use fallback
  return getFallbackResponse("Unrecognized response format");
}

// Return a fallback response if LangGraph fails
function getFallbackResponse(message: string): LangGraphResponse {
  console.log("Using fallback response for:", message);
  
  const lowerMessage = message.toLowerCase();
  
  let response = "I'm having trouble connecting to my advanced reasoning capabilities right now. Let me try a simpler approach.";
  
  if (lowerMessage.includes('faucet') || lowerMessage.includes('leak')) {
    response += " For faucet repairs, you'll typically need to replace the washer, O-ring, or cartridge. Would you like some basic DIY instructions?";
  } 
  else if (lowerMessage.includes('kitchen') || lowerMessage.includes('renovation')) {
    response += " Kitchen renovations typically range from $15,000 to $50,000 depending on scope. What specific aspect of your kitchen are you looking to update?";
  }
  else if (lowerMessage.includes('paint') || lowerMessage.includes('painting')) {
    response += " For painting projects, you'll need approximately 1 gallon per 400 square feet of wall space. What's the size of the area you're painting?";
  }
  
  return {
    response,
    sentiment: "unknown",
    reason: "connection_error"
  };
}