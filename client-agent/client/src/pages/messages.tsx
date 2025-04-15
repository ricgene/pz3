// client-agent/client/src/pages/messages.tsx
import { useState } from "react";
import { ChatThread } from "@/components/chat-thread";
import { AIChatThread } from "@/components/ai-chat-thread";
import { AgentChatThread } from "@/components/agent-chat-thread";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bot, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logUserActivity } from "@/lib/activity-logger";

export default function Messages() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showingAiChat, setShowingAiChat] = useState(false);
  const [showingAgentChat, setShowingAgentChat] = useState(false);
  const currentUserId = 1; // In a real app, this would come from auth context

  // Helper function to track chat type selection
  const selectChatType = (type: 'business' | 'ai' | 'agent') => {
    // Log the selection
    logUserActivity('chat_type_selected', { type });
    
    // Update state based on selection
    setSelectedUserId(null);
    setShowingAiChat(type === 'ai');
    setShowingAgentChat(type === 'agent');
  };

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Chat with businesses and our PRIZM assistants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedUserId && !showingAiChat && !showingAgentChat ? (
            <div className="space-y-6">
              <Tabs defaultValue="chat-options">
                <TabsList className="w-full">
                  <TabsTrigger value="chat-options">Chat Options</TabsTrigger>
                  <TabsTrigger value="businesses">Businesses</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat-options" className="space-y-4 pt-4">
                  <Button
                    variant="outline"
                    className="w-full py-8 text-lg"
                    onClick={() => selectChatType('agent')}
                  >
                    <Sparkles className="w-6 h-6 mr-2 text-orange-500" />
                    LangGraph Agent Chat (New!)
                  </Button>
                
                  <Button
                    variant="outline"
                    className="w-full py-8 text-lg"
                    onClick={() => selectChatType('ai')}
                  >
                    <Bot className="w-6 h-6 mr-2" />
                    Standard AI Chat
                  </Button>
                  
                  <div className="text-center py-4 text-muted-foreground">
                    Try our new LangGraph-powered agent for better conversations!
                  </div>
                </TabsContent>
                
                <TabsContent value="businesses" className="pt-4">
                  <div className="text-center py-4 text-muted-foreground">
                    No business conversations yet. Connect with a business first.
                  </div>
                  {/* You could map through businesses here when available */}
                </TabsContent>
              </Tabs>
            </div>
          ) : showingAgentChat ? (
            <div>
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => {
                  setShowingAgentChat(false);
                  logUserActivity('returned_to_chat_selection');
                }}
              >
                ← Back to conversations
              </Button>
              <AgentChatThread userId={currentUserId} />
            </div>
          ) : showingAiChat ? (
            <div>
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => {
                  setShowingAiChat(false);
                  logUserActivity('returned_to_chat_selection');
                }}
              >
                ← Back to conversations
              </Button>
              <AIChatThread userId={currentUserId} />
            </div>
          ) : (
            <div>
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => {
                  setSelectedUserId(null);
                  logUserActivity('returned_to_chat_selection');
                }}
              >
                ← Back to conversations
              </Button>
              <ChatThread
                userId1={currentUserId}
                userId2={selectedUserId}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}