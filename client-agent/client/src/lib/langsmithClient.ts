// src/lib/langsmithClient.ts
// A dedicated module for interacting with LangSmith

// Define the input structure for your LangSmith workflow
export interface WorkflowInput {
  customer: {
    name: string;
    email: string;
    phoneNumber: string;
    zipCode: string;
  };
  task: {
    description: string;
    category: string;
  };
  vendor: {
    name: string;
    email: string;
    phoneNumber: string;
  };
  memory?: {
    system_prompt?: string;
    user_name?: string;
    is_name_introduction?: boolean;
    is_first_message?: boolean;
  };
}

// Define the structure of messages in the workflow
export interface WorkflowMessage {
  type: string; // 'system', 'ai', 'human'
  content: string;
}

// Define the output structure from your LangSmith workflow
export interface WorkflowOutput {
  customer_email: string;
  vendor_email: string;
  project_summary: string;
  sentiment: string;
  reason: string;
  messages: WorkflowMessage[];
}

// Get the LangSmith API key from environment variables
const getLangSmithApiKey = () => {
  const apiKey = import.meta.env.VITE_LANGSMITH_API_KEY;
  if (!apiKey) {
    console.warn("LangSmith API key is not configured");
  }
  return apiKey || "";
};

// Get the LangSmith workflow ID from environment variables
const getLangSmithWorkflowId = () => {
  const workflowId = import.meta.env.VITE_LANGSMITH_WORKFLOW_ID;
  if (!workflowId) {
    console.warn("LangSmith workflow ID is not configured");
  }
  return workflowId || "";
};

// Format message for chat API
export const formatChatMessage = (message: string, userId: number, memory?: any) => {
  // Create a structured message that matches what your LangSmith workflow expects
  const customer = {
    name: memory?.user_name || "User", // Use memory context if available
    email: `user${userId}@example.com`,
    phoneNumber: "555-123-4567",
    zipCode: "94105"
  };
  
  const task = {
    description: message,
    category: "Productivity"
  };
  
  const vendor = {
    name: "007 Productivity Agent",
    email: "agent@007.example.com",
    phoneNumber: "555-007-0007"
  };
  
  // Create system prompt for 007 persona
  const systemPrompt = `You are 007, a personal productivity agent.
You help users manage their tasks, find information, and boost their productivity.
You have a friendly, helpful tone.
The user's name is ${memory?.user_name || 'unknown'}.
Keep your responses concise and focused.

If the user asks about their name, make sure to tell them their name is ${memory?.user_name || 'unknown'}.
If the user asks about tasks, offer to create a task for them.

${memory?.is_first_message ? 'This is the first message. Start with a greeting and ask for their name if you don\'t know it yet.' : ''}`;
  
  return {
    customer,
    task,
    vendor,
    memory: {
      system_prompt: systemPrompt,
      user_name: memory?.user_name,
      is_name_introduction: memory?.is_name_introduction,
      is_first_message: memory?.is_first_message
    }
  };
};

// Call LangSmith workflow directly
export const callLangSmithWorkflow = async (
  input: WorkflowInput
): Promise<WorkflowOutput> => {
  const apiKey = getLangSmithApiKey();
  const workflowId = getLangSmithWorkflowId();
  
  if (!apiKey) {
    throw new Error("LangSmith API key is not configured");
  }
  
  if (!workflowId) {
    throw new Error("LangSmith workflow ID is not configured");
  }
  
  const url = `https://api.smith.langchain.com/runs/${workflowId}/invoke`;
  
  try {
    console.log("Calling LangSmith workflow with input:", input);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: input
      })
    });
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch (e) {
        errorMessage = await response.text() || response.statusText;
      }
      throw new Error(`LangSmith API error (${response.status}): ${errorMessage}`);
    }
    
    const data = await response.json();
    console.log("LangSmith workflow response:", data);
    
    // Extract the actual output from the response
    // The structure may vary depending on how LangSmith returns data
    const output = data.output || data;
    
    return output as WorkflowOutput;
  } catch (error) {
    console.error("Error calling LangSmith workflow:", error);
    throw error;
  }
};

// Simplified function for agent chat
export const sendAgentChatMessage = async (
  userId: number,
  message: string,
  memory?: any
): Promise<{
  userMessage: any;
  assistantMessage: any;
}> => {
  try {
    // Format the message for the LangSmith workflow
    const input = formatChatMessage(message, userId, memory);
    
    // Call the LangSmith workflow
    const result = await callLangSmithWorkflow(input);
    
    // Process the result to extract user and assistant messages
    const allMessages = result.messages || [];
    
    // Find the last human message (which should be the one we just sent)
    const userMessage = {
      id: Date.now(),
      fromId: userId,
      toId: 0,
      content: message,
      timestamp: new Date(),
      isAiAssistant: false
    };
    
    // Find the last AI message (which should be the response)
    const aiMessages = allMessages.filter(msg => msg.type === 'ai');
    const lastAiMessage = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;
    
    const assistantMessage = {
      id: Date.now() + 1,
      fromId: 0,
      toId: userId,
      content: lastAiMessage ? lastAiMessage.content : "I'm sorry, I couldn't process your request.",
      timestamp: new Date(),
      isAiAssistant: true
    };
    
    return {
      userMessage,
      assistantMessage
    };
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