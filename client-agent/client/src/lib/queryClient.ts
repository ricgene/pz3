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


// Get the base API URL
const getApiBaseUrl = () => {
  // Use local server for development
  if (import.meta.env.DEV) {
    return "http://localhost:3000"; // Your local server
  }
  // Use cloud server for production
  return "https://ai-api-service-324482404818.us-central1.run.app";
};

// Function to handle API requests
// In client/src/lib/queryClient.ts
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const apiUrl = getApiBaseUrl() + url;
  
  console.log(`Making ${method} request to ${apiUrl}`);
  
  const res = await fetch(apiUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
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
      console.log(`Making query to ${apiUrl}`);
      
      const res = await fetch(apiUrl, {
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