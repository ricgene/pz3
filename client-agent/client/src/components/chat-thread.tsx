import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";
import { createWebSocketConnection } from "@/lib/network";

interface ChatThreadProps {
  userId1: number;
  userId2: number | null;
  currentUserId: number;
}

export function ChatThread({ userId1, userId2, currentUserId }: ChatThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<{ content: string }>();

  // If userId2 is null, we won't fetch messages
  const enabled = userId2 !== null;

  const { data: messages = [], refetch } = useQuery<Message[]>({
    queryKey: ["/api/messages", userId1, userId2],
    enabled: enabled, // Only run the query if userId2 is not null
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      // Ensure userId2 is not null before sending message
      if (userId2 === null) {
        throw new Error("Cannot send message: No recipient selected");
      }
      
      return apiRequest("POST", "/api/messages", {
        fromId: currentUserId,
        toId: userId2, // Safe to use here now that we've checked
        content,
      });
    },
    onSuccess: () => {
      refetch();
      reset();
    },
  });

  useEffect(() => {
    // Don't set up WebSocket if userId2 is null
    if (userId2 === null) return;
    
    const ws = createWebSocketConnection();
    
    if (ws) {
      ws.onopen = () => {
        console.log("WebSocket connected, authenticating user", currentUserId);
        ws.send(JSON.stringify({ type: "auth", userId: currentUserId }));
      };

      ws.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        try {
          // Parse the message data and refetch messages if needed
          const data = JSON.parse(event.data);
          if (data.fromId === userId2) {
            refetch();
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };
    }

    return () => {
      if (ws && ws.readyState < 2) { // 0 = CONNECTING, 1 = OPEN
        console.log("Closing WebSocket connection");
        ws.close();
      }
    };
  }, [currentUserId, userId1, userId2, refetch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show placeholder if no recipient is selected
  if (userId2 === null) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center">
        <div className="text-muted-foreground">
          Please select a conversation to start messaging
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.fromId === currentUserId ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-[80%] p-3 ${
                message.fromId === currentUserId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content}
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit((data) => sendMessage.mutate(data.content))}
        className="border-t p-4 flex gap-2"
      >
        <Input
          {...register("content", { required: true })}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sendMessage.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}