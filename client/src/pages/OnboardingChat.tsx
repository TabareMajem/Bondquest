import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Send, Heart, CheckCircle2, Info, Sparkles, SkipForward, AlertTriangle } from "lucide-react";
import { bondDimensions, bondDimensionOrder, getNextDimension, getDimensionById } from "@shared/bondDimensions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import the assistant message component
import Message from "@/components/ai/Message";

// Define the bond dimension stages for guided conversation
export type BondDimensionStage = 
  | 'welcome' 
  | 'communication' 
  | 'trust' 
  | 'emotional_intimacy' 
  | 'conflict_resolution'
  | 'physical_intimacy'
  | 'shared_values'
  | 'fun_playfulness'
  | 'mutual_support'
  | 'independence_balance'
  | 'overall_satisfaction'
  | 'wrap_up';

// Array of stages in the correct order
const conversationStages: BondDimensionStage[] = [
  'welcome',
  'communication',
  'trust',
  'emotional_intimacy',
  'conflict_resolution',
  'physical_intimacy',
  'shared_values',
  'fun_playfulness',
  'mutual_support',
  'independence_balance',
  'overall_satisfaction',
  'wrap_up'
];

// User-friendly names for the bond dimensions
const dimensionNames: Record<BondDimensionStage, string> = {
  welcome: 'Welcome',
  communication: 'Communication',
  trust: 'Trust & Security',
  emotional_intimacy: 'Emotional Connection',
  conflict_resolution: 'Handling Disagreements',
  physical_intimacy: 'Physical Connection',
  shared_values: 'Values & Goals',
  fun_playfulness: 'Fun & Enjoyment',
  mutual_support: 'Support & Respect',
  independence_balance: 'Independence & Balance',
  overall_satisfaction: 'Overall Satisfaction',
  wrap_up: 'Summary'
};

interface OnboardingMessage {
  id: number;
  message: string;
  sender: 'user' | 'ai';
  assistantType: string;
  timestamp: string;
  stage?: BondDimensionStage;
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
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  
  // Track conversation stage (which bond dimension we're on)
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const currentStage = conversationStages[currentStageIndex];
  
  // Track user exchanges per stage
  const [stageExchanges, setStageExchanges] = useState<Record<BondDimensionStage, number>>({
    welcome: 0,
    communication: 0,
    trust: 0,
    emotional_intimacy: 0,
    conflict_resolution: 0,
    physical_intimacy: 0,
    shared_values: 0,
    fun_playfulness: 0,
    mutual_support: 0,
    independence_balance: 0,
    overall_satisfaction: 0,
    wrap_up: 0
  });
  
  // Determine if the current stage has enough exchanges to progress
  const canProgressStage = (stage: BondDimensionStage): boolean => {
    const exchangesNeeded = stage === 'welcome' ? 2 : 1;
    return stageExchanges[stage] >= exchangesNeeded;
  };
  
  // Progress to the next stage when appropriate
  const progressToNextStage = () => {
    if (currentStageIndex < conversationStages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    }
  };
  
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
          title: "Bond Dimensions Assessment"
        });
        
        const sessionData = await sessionResponse.json();
        currentSessionId = sessionData.id;
        setSessionId(currentSessionId);
      }
      
      // Now send the message with the proper context based on current stage
      const response = await apiRequest("POST", "/api/conversation/messages", {
        sessionId: currentSessionId,
        message: content,
        systemContext: `onboarding_${currentStage}`
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      // Add both user message and AI response to the messages state with stage info
      const newMessages: OnboardingMessage[] = [
        {
          id: Date.now(),
          message: data.userMessage.message,
          sender: 'user',
          assistantType: 'aurora',
          timestamp: new Date().toISOString(),
          stage: currentStage
        },
        {
          id: Date.now() + 1,
          message: data.aiMessage.message,
          sender: 'ai',
          assistantType: 'aurora',
          timestamp: new Date().toISOString(),
          stage: currentStage
        }
      ];
      
      setMessages(prevMessages => [...prevMessages, ...newMessages]);
      
      // Clear input
      setMessage("");
      
      // Update exchanges for current stage
      setStageExchanges(prev => ({
        ...prev,
        [currentStage]: prev[currentStage] + 1
      }));
      
      // Check if we should progress to the next stage
      if (canProgressStage(currentStage)) {
        // If we're on the last stage, enable the continue button
        if (currentStage === 'wrap_up') {
          setIsReadyToContinue(true);
        } else {
          // Progress to next stage on next user message
          progressToNextStage();
        }
      }
      
      // If we've gotten through most stages, enable continue button anyway
      if (currentStageIndex >= conversationStages.length - 3) {
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
        message: t('onboarding.welcomeMessage', 'Welcome to BondQuest! I\'m Aurora, your relationship scientist. I\'m here to help you build a stronger bond with your partner by assessing 10 key dimensions of your relationship. To get started, could you tell me your name?'),
        sender: 'ai',
        assistantType: 'aurora',
        timestamp: new Date().toISOString(),
        stage: 'welcome'
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
    
    // Navigate to home if skipping, otherwise to partner linking
    // Check if user is skipping via the dialog
    const isSkipping = showSkipDialog;
    
    // Log for debugging
    console.log("Continue handler - isSkipping:", isSkipping, "showSkipDialog:", showSkipDialog);
    
    // IMPORTANT: Ensure the profile completion flag is always set
    localStorage.setItem("profile_setup_completed", "true");
    
    if (isSkipping) {
      // If skipping, mark profile as completed and go to home dashboard in solo mode
      localStorage.setItem("profile_setup_completed", "true");
      
      // Then navigate to home
      navigate("/home");
      
      toast({
        title: "Skipped AI Onboarding",
        description: "You'll start in solo mode. You can connect with a partner anytime.",
      });
    } else {
      // Regular flow - continue to partner linking
      navigate("/partner-linking");
      
      toast({
        title: t('onboarding.chatCompleted', 'Great conversation!'),
        description: t('onboarding.chatCompletedDescription', 'Thanks for sharing! Now let\'s connect you with your partner.'),
      });
    }
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
  
  // Calculate progress percentage
  const totalStages = conversationStages.length;
  const progressPercentage = Math.min(100, Math.round((currentStageIndex / (totalStages - 1)) * 100));
  
  return (
    <div 
      className="min-h-screen w-full flex flex-col relative"
      style={{ background: "var(--gradient-primary)" }}
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-black bg-opacity-30">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mr-3 shadow-lg">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h1 className="text-white font-semibold">Aurora</h1>
            <p className="text-xs text-white/70">{t('ai.relationshipScientist')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Skip button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSkipDialog(true)}
            className="text-white/70 hover:text-white hover:bg-white/10 border border-white/30"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            {t('onboarding.skipAssistant')}
          </Button>
          
          {/* Progress indicator */}
          <div className="flex items-center">
            <span className="text-xs text-white/80 mr-2">
              {currentStage !== 'welcome' && currentStage !== 'wrap_up' ? dimensionNames[currentStage] : ''}
            </span>
            <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-pink-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skip Confirmation Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-900 to-purple-950 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
              {t('onboarding.skipAssistantConfirm')}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {t('onboarding.skipAssistantDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowSkipDialog(false)}
              className="border-purple-400/30 text-white hover:bg-purple-500/20"
            >
              {t('onboarding.stayAndComplete')}
            </Button>
            <Button 
              onClick={() => {
                // Super aggressive solo mode enabling - set multiple flags
                localStorage.setItem("profile_setup_completed", "true");
                localStorage.setItem("solo_mode_enabled", "true");
                localStorage.setItem("skip_partner_linking", "true");
                
                // Set showSkipDialog to true to trigger the isSkipping condition
                setShowSkipDialog(true);
                
                // And then continue with the regular continue handler
                handleContinue();
                
                // Explicitly navigate to home as a backup measure
                setTimeout(() => {
                  console.log("Forcing navigation to /home via setTimeout");
                  navigate("/home");
                }, 100);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
            >
              {t('onboarding.skipAndContinue')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dimension Progress Bar (only show after welcome) */}
      {currentStageIndex > 0 && currentStageIndex < totalStages - 1 && (
        <div className="flex overflow-x-auto py-2 px-4 bg-black/20 gap-1 no-scrollbar">
          {conversationStages.slice(1, conversationStages.length - 1).map((stage, index) => (
            <div 
              key={stage}
              className={`flex-shrink-0 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-300 ${
                index + 1 < currentStageIndex 
                  ? 'bg-purple-600 text-white' 
                  : index + 1 === currentStageIndex 
                    ? 'bg-purple-500/80 text-white font-medium border border-white/30' 
                    : 'bg-white/10 text-white/50'
              }`}
            >
              {dimensionNames[stage]}
            </div>
          ))}
        </div>
      )}
      
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
      
      {/* Current dimension indicator with information (if applicable) */}
      {currentStage !== 'welcome' && currentStage !== 'wrap_up' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div 
                className="absolute left-1/2 transform -translate-x-1/2 bottom-24 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-lg cursor-help"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  duration: 0.3 
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  transition: { duration: 0.2 }
                }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 flex items-center justify-center rounded-full"
                    style={{ 
                      background: `linear-gradient(135deg, ${getDimensionById(currentStage)?.color || '#9333EA'}, rgba(236, 72, 153, 0.8))`,
                      boxShadow: '0 0 10px rgba(147, 51, 234, 0.5)' 
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm text-white font-medium">
                    {dimensionNames[currentStage]}
                  </span>
                  <span className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                    {currentStageIndex}/{conversationStages.length-2}
                  </span>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-black/90 border-purple-500/50">
              <h4 className="font-medium text-purple-300">{dimensionNames[currentStage]}</h4>
              <p className="text-sm text-white/80 mt-1">{getDimensionById(currentStage)?.description}</p>
              <div className="mt-2 text-xs text-purple-300/70 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Share your thoughts on this dimension
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={currentStage === 'wrap_up' ? "Any final thoughts about your relationship..." : t('onboarding.typeMessage') as string}
            className="flex-grow mr-2 bg-white/20 border-0 text-white placeholder:text-white/60 focus-visible:ring-purple-400"
            autoFocus
          />
          <Button 
            type="submit"
            disabled={sendMessageMutation.isPending || !message.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md transition-all"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        
        {/* Continue Button */}
        {(isReadyToContinue || currentStage === 'wrap_up' || messages.filter(m => m.sender === 'user').length >= conversationStages.length) && (
          <motion.div 
            className="flex justify-center mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleContinue}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 px-8 py-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all border border-yellow-300/30"
                size="lg"
              >
                <motion.span
                  className="flex items-center"
                  initial={{ opacity: 1 }}
                  whileHover={{ 
                    opacity: [1, 0.8, 1], 
                    transition: { duration: 1.5, repeat: Infinity }
                  }}
                >
                  {currentStage === 'wrap_up' ? 'Connect with Partner' : 'Continue'} 
                  <motion.div
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {/* Show typing indicator when AI is responding */}
      {sendMessageMutation.isPending && (
        <motion.div 
          className="absolute bottom-24 left-8 bg-purple-600/80 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm shadow-md flex items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <LoadingAnimation 
            variant="bounce" 
            size="xs" 
            color="default" 
            text="Aurora is thinking..." 
            textPosition="right"
          />
        </motion.div>
      )}
    </div>
  );
}