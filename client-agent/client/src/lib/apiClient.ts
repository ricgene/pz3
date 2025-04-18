// src/lib/apiClient.ts
// A dedicated module for interacting with our server API endpoints

// Get the API base URL from environment variables or use a default
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
};

/**
 * Send a message to the agent chat endpoint
 */
export const sendAgentChatMessage = async (
  userId: number,
  message: string
): Promise<{
  userMessage: any;
  assistantMessage: any;
}> => {
  try {
    const apiUrl = getApiBaseUrl();
    console.log(`Sending message to agent chat at ${apiUrl}/api/agent-chat`);
    
    // Format the request to match what the server expects
    const requestData = {
      userId,
      message
    };
    
    // Call your server's agent-chat endpoint
    const response = await fetch(`${apiUrl}/api/agent-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`Error calling agent chat: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Server response:", result);
    
    return result;
  } catch (error) {
    console.error("Error in agent chat:", error);
    
    // Return a fallback message when an error occurs
    return {
      userMessage: {
        id: Date.now(),
        fromId: userId,
        toId: 0,
        content: message,
        timestamp: new Date(),
        isAiAssistant: false
      },
      assistantMessage: {
        id: Date.now() + 1,
        fromId: 0,
        toId: userId,
        content: "I'm sorry, I encountered an error processing your message. Please try again later.",
        timestamp: new Date(),
        isAiAssistant: true
      }
    };
  }
};

/**
 * Send a message to the regular chat endpoint
 */
export const sendChatMessage = async (
  userId: number,
  message: string
): Promise<{
  userMessage: any;
  assistantMessage: any;
}> => {
  try {
    const apiUrl = getApiBaseUrl();
    console.log(`Sending message to chat at ${apiUrl}/api/chat`);
    
    // Format the request
    const requestData = {
      userId,
      message
    };
    
    // Call your server's chat endpoint
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`Error calling chat: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in chat:", error);
    
    // Return a fallback message when an error occurs
    return {
      userMessage: {
        id: Date.now(),
        fromId: userId,
        toId: 0,
        content: message,
        timestamp: new Date(),
        isAiAssistant: false
      },
      assistantMessage: {
        id: Date.now() + 1,
        fromId: 0,
        toId: userId,
        content: "I'm sorry, I encountered an error processing your message. Please try again later.",
        timestamp: new Date(),
        isAiAssistant: true
      }
    };
  }
};