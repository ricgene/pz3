// client-agent/client/src/components/agent-chat-thread.tsx - Modified to use direct LangSmith connection
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { logUserActivity } from "@/lib/activity-logger";
import { sendAgentChatMessage } from "@/lib/langsmithClient"; // Import our new LangSmith client
import type { Message } from "@shared/schema";

interface AgentChatThreadProps {
  userId: number;
}

export function AgentChatThread({ userId }: AgentChatThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const { register, handleSubmit, reset, setValue, watch } = useForm<{ content: string }>({
    defaultValues: {
      content: ''
    },
    mode: 'onChange'
  });
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    const supported = ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (isSecureContext || isLocalhost);
    
    console.log('Speech recognition supported:', supported);
    
    if (!supported) {
      if (!isSecureContext && !isLocalhost) {
        console.warn('Speech recognition requires a secure context (HTTPS) or localhost');
      }
    }
    
    return supported;
  });
  const recognitionRef = useRef<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isMobile] = useState(window.navigator.userAgent.match(/Mobile|Android|iOS|iPhone|iPad|iPod/i));

  // Initialize with greeting message
  useEffect(() => {
    const greetingMessage: Message = {
      id: Date.now(),
      fromId: 0,
      toId: userId,
      content: "Hello! I'm an AI assistant powered by LangGraph. How can I help with your home improvement project today?",
      timestamp: new Date(),
      isAiAssistant: true
    };
    
    setMessages([greetingMessage]);
    speakResponse(greetingMessage.content);
    
    // Log that user started a new agent chat
    logUserActivity('agent_chat_started');
  }, [userId]);

  // Initialize speech synthesis
  useEffect(() => {
    const initVoices = async () => {
      try {
        // Force voice loading on Chrome
        if (isMobile) {
          await window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
        }

        const loadVoices = () => {
          const availableVoices = window.speechSynthesis.getVoices();
          if (availableVoices.length === 0) {
            console.warn("No voices available for speech synthesis");
          } else {
            console.log("Available voices:", availableVoices.map(v => v.name));
            // Try to force load voices on Chrome
            if (availableVoices.length === 0) {
              window.speechSynthesis.getVoices();
            }
          }
        };

        // Initial load
        loadVoices();

        // Setup voice changed listener
        if ('onvoiceschanged' in window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Force voice loading on Chrome
        window.speechSynthesis.getVoices();

        return () => {
          if ('onvoiceschanged' in window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = null;
          }
        };
      } catch (error) {
        console.error("Error initializing speech synthesis:", error);
      }
    };

    initVoices();
  }, [isMobile]);

  // Speech synthesis function
  const speakResponse = async (text: string) => {
    if (isMuted) return;

    try {
      if (!window.speechSynthesis) {
        console.error("Speech synthesis not supported");
        return;
      }

      console.log("Attempting to speak:", text);

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Get voices and ensure they're loaded
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Wait for voices to load
        voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
          const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
              resolve(availableVoices);
            } else {
              window.speechSynthesis.onvoiceschanged = loadVoices;
            }
          };
          loadVoices();
        });
      }

      // Try to find the best available voice
      const desiredVoice = voices.find(v => 
        v.name === "Microsoft Zira - English (United States)"
      ) || voices.find(v => 
        v.name.includes("Google") && 
        v.name.includes("US English") && 
        v.name.includes("Female")
      ) || voices.find(v => 
        v.name.includes("Microsoft") && 
        v.name.includes("US English") && 
        v.name.includes("Female")
      ) || voices.find(v => 
        v.name.includes("US English") && 
        v.name.includes("Female")
      ) || voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes("female") || 
         v.name.includes("Samantha"))
      ) || voices.find(v => v.lang.startsWith('en'));

      utterance.voice = desiredVoice || null;

      // Optimize voice settings for quality
      utterance.volume = 1.0;     // Full volume
      utterance.rate = 0.9;       // Slightly slower for better clarity
      utterance.pitch = 1.0;      // Natural pitch
      utterance.lang = 'en-US';   // Use English US

      // Add event handlers
      utterance.onstart = () => {
        console.log("Speech started with voice:", utterance.voice?.name);
        setIsSpeaking(true);
        // Clear the input field when agent starts speaking
        reset({ content: '' });
        setTranscriptText('');
      };
      utterance.onend = () => {
        console.log("Speech ended");
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        setIsSpeaking(false);
      };

      // For mobile browsers, try to unlock audio context
      if (isMobile) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContext();
          await audioContext.resume();
        } catch (error) {
          console.warn("Could not initialize AudioContext:", error);
        }
      }

      // Start speaking
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
    }
  };

  // Updated to use direct LangSmith connection
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      console.log("Sending message to LangSmith agent:", content);
      
      // Log that user sent a message to the agent
      logUserActivity('agent_message_sent', { messageLength: content.length });
      
      try {
        // Call LangSmith directly instead of going through API
        return await sendAgentChatMessage(userId, content);
      } catch (error) {
        console.error("Error sending message to LangSmith:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("LangSmith response received:", result);
      
      if (!result || !result.userMessage || !result.assistantMessage) {
        console.error("Invalid response format from LangSmith");
        return;
      }
      
      // Add the new messages to the conversation
      setMessages(prev => {
        const updatedMessages = [...prev, result.userMessage, result.assistantMessage];
        
        // Speak the AI's response
        const aiResponse = result.assistantMessage;
        if (aiResponse) {
          console.log('Speaking AI response:', aiResponse.content);
          reset({ content: '' });
          setTranscriptText('');
          setIsSpeaking(true);
          speakResponse(aiResponse.content);
          
          // Log that agent responded
          logUserActivity('agent_response_received', { 
            responseLength: aiResponse.content.length 
          });
        }
        
        return updatedMessages;
      });
    },
    onError: (error) => {
      console.error("Error sending message to agent:", error);
      
      // Add error message to the conversation
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          fromId: 0,
          toId: userId,
          content: "I'm sorry, I encountered an error processing your message. Please try again later.",
          timestamp: new Date(),
          isAiAssistant: true
        }
      ]);
      
      // Log the error
      logUserActivity('agent_error', { error: String(error) });
    }
  });

  // Initialize speech recognition
  useEffect(() => {
    if (speechSupported) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        // Configure recognition
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 1;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          const displayText = (finalTranscript + interimTranscript).trim();
          setValue("content", displayText, { shouldValidate: true });
        };

        recognitionRef.current.onstart = () => {
          console.log("Speech recognition started");
          setIsListening(true);
          logUserActivity('voice_input_started');
        };

        recognitionRef.current.onend = () => {
          console.log("Speech recognition ended");
          setIsListening(false);
          logUserActivity('voice_input_ended');
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          logUserActivity('voice_input_error', { error: event.error });
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
      }
    }
  }, [speechSupported, setValue]);

  const toggleListening = async () => {
    try {
      if (!isListening) {
        // Request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream after getting permission
        
        // Start recognition after getting permission
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      } else {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
        }
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('Please allow microphone access to use voice input.');
      }
      logUserActivity('voice_input_permission_error', { error: String(error) });
    }
  };

  // Form state management
  const handleTranscriptUpdate = (text: string) => {
    setTranscriptText(text);
  };

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [watch("content")]);

  // Form submission handler
  const onSubmit = (data: { content: string }) => {
    if (data.content.trim()) {
      sendMessage.mutate(data.content);
      reset({ content: '' });
      setTranscriptText('');
    }
  };

  // Textarea onChange handler
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue("content", newValue, { shouldValidate: true });
    setTranscriptText('');
  };

  const content = watch("content");

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-3 bg-muted">
                How can I help with your home improvement needs today?
              </Card>
            </div>
          ) : Array.isArray(messages) ? (
            messages.map((message) => {
              // Check if message exists and has the required properties
              if (!message || typeof message !== 'object') {
                console.warn('Invalid message object:', message);
                return null;
              }
              
              // Safely determine if this is an AI message
              const isAiMessage = message.isAiAssistant === true || message.fromId === 0;
              
              return (
                <div
                  key={message.id || `msg-${Date.now()}-${Math.random()}`}
                  className={`flex ${isAiMessage ? "justify-start" : "justify-end"}`}
                >
                  <Card
                    className={`max-w-[80%] p-3 ${
                      !isAiMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content || "No content available"}
                  </Card>
                </div>
              );
            })
          ) : (
            <div className="flex justify-start">
              <Card className="max-w-[80%] p-3 bg-muted">
                Error loading messages. Please try again.
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border-t p-4 flex gap-2"
      >
        <div className="flex-1 relative">
          <Textarea
            {...register("content")}
            onChange={handleTextareaChange}
            placeholder="Ask about home improvement..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none text-foreground placeholder:text-muted-foreground"
            style={{ color: 'inherit' }}
            disabled={sendMessage.isPending || isSpeaking}
            readOnly={isSpeaking}
            value={isSpeaking ? "" : watch("content")}
            rows={1}
            ref={textareaRef}
          />
        </div>
        {speechSupported ? (
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "secondary"}
            onClick={toggleListening}
            disabled={sendMessage.isPending || isSpeaking}
            title="Click to start/stop voice input"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            disabled
            title="Voice input requires HTTPS or localhost"
          >
            <Mic className="h-4 w-4 opacity-50" />
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => setIsMuted(!isMuted)}
          disabled={sendMessage.isPending || isSpeaking}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={!content || sendMessage.isPending || isSpeaking}
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}