import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Message from "../components/ai/Message";
import { useAuth } from "../contexts/AuthContext";
import { Chat } from "@shared/schema";
import PageLayout from "../components/layout/PageLayout";

type AssistantType = "casanova" | "venus" | "aurora";

export default function AIAssistant() {
  const [, navigate] = useLocation();
  const { user, couple } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [assistantType, setAssistantType] = useState<AssistantType>("casanova");
  
  // Redirect to onboarding if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Fetch chat history
  const { data: chats, isLoading } = useQuery<Chat[]>({
    queryKey: [couple ? `/api/couples/${couple.id}/chats` : null],
    enabled: !!couple,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!couple) throw new Error("No couple found");
      
      const response = await apiRequest("POST", "/api/chats", {
        coupleId: couple.id,
        assistantType,
        message,
        sender: "user"
      });
      return response.json();
    },
    onSuccess: () => {
      if (couple) {
        queryClient.invalidateQueries({ queryKey: [`/api/couples/${couple.id}/chats`] });
      }
    },
  });
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);
  
  const handleBackClick = () => {
    navigate("/home");
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
      setMessage("");
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    if (!sendMessageMutation.isPending) {
      sendMessageMutation.mutate(suggestion);
    }
  };

  // Define the current assistant description and capabilities
  const assistantDescriptions = {
    casanova: {
      emoji: "👨‍🎤",
      name: "Casanova",
      title: "Romantic Expert",
      description: "Specializes in romantic gestures, date ideas, and keeping the spark alive in your relationship.",
      skills: ["Date ideas", "Romantic gestures", "Anniversary gifts", "Love languages"]
    },
    venus: {
      emoji: "👩‍🚀",
      name: "Venus",
      title: "Communication Coach",
      description: "Helps improve communication, resolve conflicts, and deepen emotional connection with your partner.",
      skills: ["Conflict resolution", "Active listening", "Expressing needs", "Building empathy"]
    },
    aurora: {
      emoji: "🤖",
      name: "Aurora",
      title: "Relationship Scientist",
      description: "Provides data-driven insights and evidence-based techniques to strengthen your relationship.",
      skills: ["Relationship data", "Research-backed advice", "Habit formation", "Progress tracking"]
    }
  };

  const currentAssistant = assistantDescriptions[assistantType];

  return (
    <PageLayout 
      activeTab="ai" 
      pageTitle="AI Relationship Assistant"
      maxWidth="xl"
    >
      <div className="flex flex-col lg:flex-row h-[calc(100vh-17rem)] lg:h-[calc(100vh-10rem)]">
        {/* Assistant Selector - transforms to sidebar on desktop */}
        <div className="flex lg:flex-col lg:w-64 xl:w-72 space-x-2 lg:space-x-0 lg:space-y-2 mb-4 lg:mb-0 lg:mr-6 lg:pr-4 lg:border-r lg:border-purple-700/30 overflow-x-auto lg:overflow-visible">
          <div className="hidden lg:block text-white mb-6">
            <h3 className="font-semibold mb-2">Your AI Assistants</h3>
            <p className="text-purple-200 text-sm">
              Select an AI personality to help with different aspects of your relationship
            </p>
          </div>

          {Object.entries(assistantDescriptions).map(([type, assistant]) => (
            <button
              key={type}
              className={`flex items-center lg:justify-start ${
                assistantType === type
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                  : "bg-purple-800/30 text-purple-200 hover:bg-purple-700/30"
              } px-4 py-3 lg:py-4 rounded-full lg:rounded-lg text-sm font-medium transition-all min-w-[110px] lg:w-full lg:min-w-0`}
              onClick={() => setAssistantType(type as AssistantType)}
            >
              <span className="mr-2">{assistant.emoji}</span>
              <span className="truncate">{assistant.name}</span>
            </button>
          ))}
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-purple-900/20 rounded-lg border border-purple-700/30 h-full">
          {/* Assistant Info - Desktop Only */}
          <div className="hidden lg:flex items-center p-4 border-b border-purple-700/30 bg-purple-800/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mr-3">
              <span className="text-white">{currentAssistant.emoji}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{currentAssistant.name}</h3>
              <p className="text-sm text-purple-200">{currentAssistant.title}</p>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              // Loading state
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : chats && chats.length > 0 ? (
              // Chat messages
              <>
                {chats.map((chat) => (
                  <Message
                    key={chat.id}
                    text={chat.message}
                    isUser={chat.sender === "user"}
                    assistantType={chat.assistantType as AssistantType}
                  />
                ))}
              </>
            ) : (
              // Welcome message
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mb-4">
                  <span className="text-white text-2xl">{currentAssistant.emoji}</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Meet {currentAssistant.name}
                </h2>
                <p className="text-center text-purple-200 max-w-md mb-6">
                  {currentAssistant.description}
                </p>
                
                {/* Desktop-only skill badges */}
                <div className="hidden lg:flex flex-wrap justify-center gap-2 max-w-md">
                  {currentAssistant.skills.map((skill, index) => (
                    <span key={index} className="bg-purple-700/40 text-purple-200 text-xs px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Typing indicator */}
            {sendMessageMutation.isPending && (
              <div className="flex">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white text-xs">{currentAssistant.emoji}</span>
                </div>
                <div className="bg-purple-700/30 rounded-2xl rounded-tl-none p-3 max-w-[85%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-purple-700/30 bg-purple-800/30">
            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handleSuggestionClick("Can you suggest some date ideas?")}
                disabled={sendMessageMutation.isPending}
                className="bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition"
              >
                Date ideas
              </button>
              <button
                onClick={() => handleSuggestionClick("We need some conversation starters")}
                disabled={sendMessageMutation.isPending}
                className="bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition"
              >
                Conversation starters
              </button>
              <button
                onClick={() => handleSuggestionClick("Help us set some relationship goals")}
                disabled={sendMessageMutation.isPending}
                className="bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition"
              >
                Relationship goals
              </button>
              <button
                onClick={() => handleSuggestionClick("Suggest some fun activities for us")}
                disabled={sendMessageMutation.isPending}
                className="bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition"
              >
                Fun activities
              </button>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex items-center bg-purple-700/20 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-purple-500/50">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Ask ${currentAssistant.name} anything...`}
                className="flex-grow bg-transparent border-none focus:outline-none text-white placeholder-purple-300"
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className={`ml-2 ${message.trim() && !sendMessageMutation.isPending ? "text-purple-300 hover:text-white" : "text-purple-500"} transition-colors`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
        
        {/* Desktop Only - Assistant Details Sidebar */}
        <div className="hidden xl:block w-64 ml-6 pl-4 border-l border-purple-700/30">
          <h3 className="font-semibold text-white mb-3">About {currentAssistant.name}</h3>
          <p className="text-sm text-purple-200 mb-6">{currentAssistant.description}</p>
          
          <h4 className="font-medium text-white text-sm mb-2">Expertise</h4>
          <div className="space-y-1 mb-6">
            {currentAssistant.skills.map((skill, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="mr-2 text-purple-400">•</span>
                <span className="text-purple-200">{skill}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-purple-800/30 rounded-lg p-4 border border-purple-700/30">
            <h4 className="font-medium text-white text-sm mb-2">💡 Quick Tip</h4>
            <p className="text-xs text-purple-200">
              {assistantType === "casanova" 
                ? "Try asking for creative date ideas based on your partner's interests."
                : assistantType === "venus"
                ? "Getting stuck in an argument? Ask for strategies to communicate more effectively."
                : "Ask for personalized relationship improvement strategies based on research."}
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
