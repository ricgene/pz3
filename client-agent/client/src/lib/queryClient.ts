// Modified version of queryClient.ts to connect directly to LangSmith
import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Utility to handle API response errors
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || res.statusText;
    } catch (e) {
      errorMessage = await res.text() || res.statusText;
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

// Get the base API URL - updated to use LangSmith directly
const getApiBaseUrl = () => {
  // Use LangSmith API for both dev and production
  // Note: You'll need to replace this with your actual LangSmith endpoint
  return import.meta.env.VITE_API_BASE_URL || "";
};

// Get the LangSmith API key from environment variables
const getLangSmithApiKey = () => {
  return import.meta.env.VITE_LANGSMITH_API_KEY || "";
};

// Function to handle API requests - updated for LangSmith
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiUrl = getApiBaseUrl() + url;
  const apiKey = getLangSmithApiKey();
  
  console.log(`Making ${method} request to ${apiUrl}`);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add API key to headers if available
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  
  const res = await fetch(apiUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'omit',
  });

  await throwIfResNotOk(res);
  return res;
}

// Type for behavior when unauthorized
type UnauthorizedBehavior = "returnNull" | "throw";

// Function to create a query function for React Query
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const apiUrl = getApiBaseUrl() + (queryKey[0] as string);
      const apiKey = getLangSmithApiKey();
      
      console.log(`Making query to ${apiUrl}`);
      
      const headers: Record<string, string> = {};
      
      // Add API key to headers if available
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      
      const res = await fetch(apiUrl, {
        headers,
        credentials: 'omit',
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  };

// Create and configure the React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});