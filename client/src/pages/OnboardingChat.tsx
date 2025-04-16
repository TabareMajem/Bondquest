import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send } from "lucide-react";

// Import the assistant message component
import Message from "@/components/ai/Message";

interface OnboardingMessage {
  id: number;
  message: string;
  sender: 'user' | 'ai';
  assistantType: string;
  timestamp: string;
}

export default function OnboardingChat() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<OnboardingMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Handle sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("User not logged in");
      
      // If no session exists yet, create one first
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionResponse = await apiRequest("POST", "/api/conversation/sessions", {
          userId: user.id,
          sessionType: "onboarding",
          title: "Welcome Onboarding"
        });
        
        const sessionData = await sessionResponse.json();
        currentSessionId = sessionData.id;
        setSessionId(currentSessionId);
      }
      
      // Now send the message
      const response = await apiRequest("POST", "/api/conversation/messages", {
        sessionId: currentSessionId,
        message: content,
        systemContext: "onboarding_welcome"
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      // Add both user message and AI response to the messages state
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          message: data.userMessage.message,
          sender: 'user',
          assistantType: 'aurora',
          timestamp: new Date().toISOString()
        },
        {
          id: Date.now() + 1,
          message: data.aiMessage.message,
          sender: 'ai',
          assistantType: 'aurora',
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Clear input
      setMessage("");
      
      // Check if we've had enough conversation to proceed
      if (messages.filter(m => m.sender === 'user').length >= 3) {
        // After a few exchanges, enable the continue button
        setIsReadyToContinue(true);
      }
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: t('common.error'),
        description: error.message || t('ai.errorSendingMessage'),
        variant: "destructive",
      });
    }
  });
  
  // Check if ready to continue
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  
  // Send welcome message from AI when component mounts
  useEffect(() => {
    if (!isInitialized && user) {
      // Display an initial welcome message
      const welcomeMessage: OnboardingMessage = {
        id: Date.now(),
        message: t('onboarding.welcomeMessage', 'Welcome to BondQuest! I\'m Aurora, your relationship guide. I\'m here to help you build a stronger bond with your partner. To get started, could you tell me your name and your partner\'s name?'),
        sender: 'ai',
        assistantType: 'aurora',
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
      setIsInitialized(true);
    }
  }, [isInitialized, user, t]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Handle continue to partner linking
  const handleContinue = () => {
    // Save insights from conversation before proceeding
    if (sessionId) {
      // This endpoint will extract insights and save them to the user's profile
      apiRequest("POST", `/api/conversation/sessions/${sessionId}/extract-insights`, {
        userId: user?.id
      }).catch(error => {
        console.error("Error extracting insights:", error);
      });
    }
    
    // Navigate to partner linking
    navigate("/partner-linking");
    
    toast({
      title: t('onboarding.chatCompleted'),
      description: t('onboarding.chatCompletedDescription'),
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };
  
  // If no user exists, redirect to signup
  if (!user) {
    useEffect(() => {
      navigate("/signup");
    }, [navigate]);
    return null;
  }
  
  return (
    <div 
      className="min-h-screen w-full flex flex-col relative"
      style={{ background: "var(--gradient-primary)" }}
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center bg-black bg-opacity-30">
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
          <span className="text-white text-sm">🤖</span>
        </div>
        <div>
          <h1 className="text-white font-semibold">Aurora</h1>
          <p className="text-xs text-white opacity-70">{t('ai.relationshipScientist')}</p>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 pb-24">
        {messages.map((msg, index) => (
          <Message 
            key={index}
            text={msg.message}
            isUser={msg.sender === 'user'}
            assistantType={msg.assistantType as any}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-30">
        <form onSubmit={handleSubmit} className="flex">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('onboarding.typeMessage') as string}
            className="flex-grow mr-2 bg-white bg-opacity-20 border-0 text-white placeholder:text-white placeholder:opacity-60"
          />
          <Button 
            type="submit"
            disabled={sendMessageMutation.isPending || !message.trim()}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        
        {/* Continue Button */}
        {(isReadyToContinue || messages.filter(m => m.sender === 'user').length >= 3) && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleContinue}
              className="bg-yellow-400 text-gray-800 px-6 hover:bg-yellow-500"
            >
              {t('common.continue')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}