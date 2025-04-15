// network.ts - Converted from JavaScript to TypeScript

// Configuration for WebSocket endpoints
const WS_CONFIG = {
  development: {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
  },
  production: {
    url: import.meta.env.VITE_WS_URL || ''
  }
};

// Properly construct WebSocket URL for the correct environment
const getWsUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return WS_CONFIG.development.url;
  }
  
  // In production, use configured URL or derive from current location
  if (WS_CONFIG.production.url) {
    return WS_CONFIG.production.url;
  }
  
  // Fallback to deriving from current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const port = window.location.port || 
               (window.location.protocol === 'https:' ? '443' : '80');
  
  // Only include non-standard ports in the URL
  const portSuffix = 
    (protocol === 'wss:' && port !== '443') || 
    (protocol === 'ws:' && port !== '80') 
      ? `:${port}` 
      : '';
  
  return `${protocol}//${hostname}${portSuffix}`;
};

// Safely construct WebSocket connection
function createWebSocketConnection(): WebSocket | null {
  try {
    const url = getWsUrl();
    console.log("Attempting to connect to WebSocket at:", url);
    
    if (!url) {
      throw new Error("WebSocket URL is not configured");
    }
    
    // Create the WebSocket with proper error handling
    const ws = new WebSocket(url);
    
    // Add error handlers
    ws.addEventListener('error', (error: Event) => {
      console.error("WebSocket connection error:", error);
    });
    
    ws.addEventListener('open', () => {
      console.log("WebSocket connection established successfully");
    });
    
    ws.addEventListener('close', (event: CloseEvent) => {
      console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
    });
    
    return ws;
  } catch (error) {
    console.error("Error creating WebSocket connection:", error);
    return null;
  }
}

// Export the function to create WebSocket connections
export { createWebSocketConnection };