import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface AIChatThreadProps {
  userId: number;
}

export function AIChatThread({ userId }: AIChatThreadProps) {
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
    console.log('Is secure context:', isSecureContext);
    console.log('Is localhost:', isLocalhost);
    console.log('SpeechRecognition in window:', 'SpeechRecognition' in window);
    console.log('webkitSpeechRecognition in window:', 'webkitSpeechRecognition' in window);
    
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
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isMobile] = useState(window.navigator.userAgent.match(/Mobile|Android|iOS|iPhone|iPad|iPod/i));

  // Initialize with greeting message
  useEffect(() => {
    const greetingMessage: Message = {
      id: Date.now(),
      fromId: 0,
      toId: userId,
      content: "I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
      isAiAssistant: true
    };
    
    setMessages([greetingMessage]);
    speakResponse(greetingMessage.content);
  }, []);

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

  // Improved speech synthesis function
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

      console.log("Available voices:", voices.map(v => v.name));

      // Try to find the best available voice in this order:
      // 1. Microsoft Zira - English (United States) (highest quality)
      // 2. Google US English Female
      // 3. Microsoft US English Female
      // 4. Any US English Female
      // 5. Any English Female
      // 6. Any English voice
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

      if (!utterance.voice) {
        console.warn("Could not find desired voice. Using default voice.");
      } else {
        console.log("Selected voice:", utterance.voice.name);
      }

      // Optimize voice settings for quality
      utterance.volume = 1.0;     // Full volume
      utterance.rate = 0.9;       // Slightly slower for better clarity
      utterance.pitch = 1.0;      // Natural pitch
      utterance.lang = 'en-US';   // Use English US

      // Add detailed event handlers
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

  // Add this function before the return statement
  const formatResponse = (text: string): string => {
    // Split into sentences (handling common sentence endings)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    // Take only the first 3 sentences
    const limitedSentences = sentences.slice(0, 3);
    
    // Join them back with proper punctuation
    return limitedSentences
      .map(s => s.trim())
      .join('. ') + '.';
  };

  // Update the sendMessage mutation to format the response
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      console.log("Sending message:", content);
      const response = await apiRequest("POST", "/api/chat", {
        userId: userId,
        message: content
      });
      const result = await response.json();
      console.log("Received response:", result);
      
      // Format the AI's response to limit sentences
      if (result.assistantMessage) {
        result.assistantMessage.content = formatResponse(result.assistantMessage.content);
      }
      
      return [result.userMessage, result.assistantMessage];
    },
    onSuccess: (newMessages) => {
      console.log("Mutation succeeded, updating messages:", newMessages);
      setMessages(prev => {
        const updatedMessages = [...prev, ...newMessages];
        console.log("Updated messages:", updatedMessages);
        // Speak the AI's response
        const aiResponse = newMessages.find((m: Message) => m.isAiAssistant);
        if (aiResponse) {
          console.log('Found AI response to speak:', aiResponse.content);
          // Clear and lock input before agent speaks
          reset({ content: '' });
          setTranscriptText('');
          setIsSpeaking(true); // Lock the input field
          speakResponse(aiResponse.content);
        }
        return updatedMessages;
      });
    },
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
        recognitionRef.current.lang = 'en-US';  // Set language to English

        recognitionRef.current.onresult = (event: any) => {
          console.log("Speech recognition result event:", event);
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
          console.log('Current transcript:', displayText);
          
          // Only update the form value, not the transcript overlay
          setValue("content", displayText, { shouldValidate: true });
        };

        recognitionRef.current.onstart = () => {
          console.log("Speech recognition started");
          setIsListening(true);
        };

        recognitionRef.current.onend = () => {
          console.log("Speech recognition ended");
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          // Handle specific errors
          switch (event.error) {
            case 'not-allowed':
              console.error('Microphone access denied. Please allow microphone access in your browser settings.');
              break;
            case 'no-speech':
              console.error('No speech was detected. Please try again.');
              break;
            case 'aborted':
              console.error('Speech recognition was aborted.');
              break;
            case 'audio-capture':
              console.error('No microphone was found. Please connect a microphone and try again.');
              break;
            case 'network':
              console.error('Network error occurred. Please check your connection.');
              break;
            case 'not-allowed':
              console.error('Speech recognition is not allowed in this context.');
              break;
            case 'service-not-available':
              console.error('Speech recognition service is not available.');
              break;
            default:
              console.error('An unknown error occurred:', event.error);
          }
        };

        console.log('Speech recognition initialized successfully');
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
    }
  };

  // Update the form state management
  const handleTranscriptUpdate = (text: string) => {
    setTranscriptText(text);
    // Don't update the form value with transcript text
  };

  // Update the textarea auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      // Reset height to auto first
      textarea.style.height = 'auto';
      // Set new height based on scrollHeight
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of 120px
      textarea.style.height = `${newHeight}px`;
    }
  }, [watch("content")]); // Remove transcriptText dependency

  // Update the form submission handler
  const onSubmit = (data: { content: string }) => {
    if (data.content.trim()) {
      sendMessage.mutate(data.content);
      reset({ content: '' });
      setTranscriptText('');
    }
  };

  // Update the textarea onChange handler
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue("content", newValue, { shouldValidate: true });
    setTranscriptText(''); // Clear transcript when user types
  };

  // Add this to debug the form state
  const content = watch("content");
  console.log("Current form content:", content);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Then update the rendering code to safely handle non-array data
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
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  !message.isAiAssistant ? "justify-end" : "justify-start"
                }`}
              >
                <Card
                  className={`max-w-[80%] p-3 ${
                    !message.isAiAssistant
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </Card>
              </div>
            ))
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
          {/* Hidden textarea for agent text */}
          <textarea
            className="hidden"
            value={isSpeaking ? watch("content") : ""}
            readOnly
          />
          {/* Visible textarea for user input */}
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