// src/lib/langgraphClient.ts - Updated to use your server API
export const sendAgentChatMessage = async (
  userId: number,
  message: string
): Promise<{
  userMessage: any;
  assistantMessage: any;
}> => {
  try {
    // Format the request to match what your server expects
    const requestData = {
      userId,
      message
    };
    
    // Call your server's agent-chat endpoint instead of LangSmith directly
    const response = await fetch('/api/agent-chat', {
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