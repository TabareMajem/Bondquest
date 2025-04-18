import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Message from "../components/ai/Message";
import { useAuth } from "../contexts/AuthContext";
import { Chat } from "@shared/schema";
import PageLayout from "../components/layout/PageLayout";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Sparkles, Heart, MessageCircle, Brain, Book } from "lucide-react";

type AssistantType = "casanova" | "venus" | "aurora";

export default function AIAssistant() {
  const [, navigate] = useLocation();
  const { user, couple } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [assistantType, setAssistantType] = useState<AssistantType>("casanova");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  
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
      skills: ["Date ideas", "Romantic gestures", "Anniversary gifts", "Love languages"],
      icon: <Heart className="h-5 w-5" />,
      color: "from-pink-500 to-red-600",
      bgColor: "bg-pink-800/20"
    },
    venus: {
      emoji: "👩‍🚀",
      name: "Venus",
      title: "Communication Coach",
      description: "Helps improve communication, resolve conflicts, and deepen emotional connection with your partner.",
      skills: ["Conflict resolution", "Active listening", "Expressing needs", "Building empathy"],
      icon: <MessageCircle className="h-5 w-5" />,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-800/20"
    },
    aurora: {
      emoji: "🤖",
      name: "Aurora",
      title: "Relationship Scientist",
      description: "Provides data-driven insights and evidence-based techniques to strengthen your relationship.",
      skills: ["Relationship data", "Research-backed advice", "Habit formation", "Progress tracking"],
      icon: <Brain className="h-5 w-5" />,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-800/20"
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
                  ? `bg-gradient-to-r ${assistant.color} text-white shadow-md`
                  : `${assistant.bgColor} text-purple-200 hover:bg-purple-700/30`
              } px-4 py-3 lg:py-4 rounded-full lg:rounded-lg text-sm font-medium transition-all min-w-[110px] lg:w-full lg:min-w-0`}
              onClick={() => setAssistantType(type as AssistantType)}
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2">
                {assistant.emoji}
              </div>
              <span className="truncate">{assistant.name}</span>
            </button>
          ))}
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-purple-900/20 rounded-lg border border-purple-700/30 h-full">
          {/* Assistant Info - Desktop Only */}
          <div className="hidden lg:flex items-center p-4 border-b border-purple-700/30 bg-gradient-to-r from-purple-900/80 to-purple-800/80 backdrop-blur-sm">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentAssistant.color} flex items-center justify-center mr-3 shadow-md`}>
              <span className="text-white">{currentAssistant.emoji}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{currentAssistant.name}</h3>
              <p className="text-sm text-purple-200">{currentAssistant.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {currentAssistant.skills.slice(0, 2).map((skill, index) => (
                <span key={index} className="bg-purple-700/40 text-purple-200 text-xs px-2 py-0.5 rounded-full">
                  {skill}
                </span>
              ))}
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
                <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-r ${currentAssistant.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <span className="text-white text-2xl lg:text-3xl">{currentAssistant.emoji}</span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
                  Meet {currentAssistant.name}
                </h2>
                <p className="text-center text-purple-200 max-w-md mb-6">
                  {currentAssistant.description}
                </p>
                
                {/* Skill badges - visible on both mobile and desktop with different styles */}
                <div className="flex flex-wrap justify-center gap-2 max-w-md mb-6">
                  {currentAssistant.skills.map((skill, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center bg-gradient-to-r from-purple-800/50 to-purple-700/50 text-purple-100 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-purple-600/30 shadow-sm`}
                    >
                      {index === 0 && assistantType === "casanova" && <Heart className="w-3 h-3 mr-1" />}
                      {index === 0 && assistantType === "venus" && <MessageCircle className="w-3 h-3 mr-1" />}
                      {index === 0 && assistantType === "aurora" && <Brain className="w-3 h-3 mr-1" />}
                      {skill}
                    </div>
                  ))}
                </div>
                
                {/* Call to action - Desktop only */}
                <div className="hidden lg:block text-center max-w-sm bg-purple-800/30 rounded-lg p-4 border border-purple-700/30">
                  <p className="text-sm text-purple-200 mb-3">
                    Start chatting with {currentAssistant.name} to get personalized advice tailored to your relationship.
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleSuggestionClick(`Hi ${currentAssistant.name}, how can you help my relationship?`)}
                      className={`bg-gradient-to-r ${currentAssistant.color} text-white text-sm px-4 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all`}
                    >
                      Start a conversation
                    </button>
                  </div>
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
          <div className="p-4 border-t border-purple-700/30 bg-gradient-to-r from-purple-900/90 to-purple-800/90 backdrop-blur-sm">
            {/* Quick Suggestion Pills - Personalized based on active assistant */}
            <div className="flex flex-wrap gap-2 mb-3">
              {assistantType === "casanova" && (
                <>
                  <button
                    onClick={() => handleSuggestionClick("Can you suggest some romantic date ideas?")}
                    disabled={sendMessageMutation.isPending}
                    className="bg-pink-700/40 hover:bg-pink-700/60 text-pink-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow flex items-center"
                  >
                    <Heart className="w-3 h-3 mr-1.5" />
                    Date ideas
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("How can I plan a special anniversary?")}
                    disabled={sendMessageMutation.isPending}
                    className="bg-pink-700/40 hover:bg-pink-700/60 text-pink-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow"
                  >
                    Anniversary plans
                  </button>
                </>
              )}
              
              {assistantType === "venus" && (
                <>
                  <button
                    onClick={() => handleSuggestionClick("We've been arguing lately. Any communication tips?")}
                    disabled={sendMessageMutation.isPending}
                    className="bg-blue-700/40 hover:bg-blue-700/60 text-blue-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow flex items-center"
                  >
                    <MessageCircle className="w-3 h-3 mr-1.5" />
                    Resolve conflict
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Help me express my needs better")}
                    disabled={sendMessageMutation.isPending}
                    className="bg-blue-700/40 hover:bg-blue-700/60 text-blue-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow"
                  >
                    Express needs
                  </button>
                </>
              )}
              
              {assistantType === "aurora" && (
                <>
                  <button
                    onClick={() => handleSuggestionClick("What habits improve relationships?")}
                    disabled={sendMessageMutation.isPending}
                    className="bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow flex items-center"
                  >
                    <Brain className="w-3 h-3 mr-1.5" />
                    Relationship habits
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Tell me about attachment styles")}
                    disabled={sendMessageMutation.isPending}
                    className="bg-purple-700/40 hover:bg-purple-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow"
                  >
                    Attachment styles
                  </button>
                </>
              )}
              
              <button
                onClick={() => handleSuggestionClick("Suggest some relationship goals for us")}
                disabled={sendMessageMutation.isPending}
                className="bg-gradient-to-r from-purple-700/40 to-pink-700/40 hover:from-purple-700/60 hover:to-pink-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow"
              >
                Relationship goals
              </button>
              
              {isDesktop && (
                <button
                  onClick={() => handleSuggestionClick("What are some activities we can do together?")}
                  disabled={sendMessageMutation.isPending}
                  className="bg-gradient-to-r from-purple-700/40 to-pink-700/40 hover:from-purple-700/60 hover:to-pink-700/60 text-purple-100 rounded-full px-3 py-1 text-sm transition-all shadow-sm hover:shadow"
                >
                  Fun activities
                </button>
              )}
            </div>

            {/* Message Input - Enhanced for desktop */}
            <form onSubmit={handleSendMessage} className={`flex items-center bg-purple-900/40 rounded-full px-4 py-2 focus-within:ring-2 ${
              assistantType === "casanova" 
                ? "focus-within:ring-pink-500/50" 
                : assistantType === "venus" 
                  ? "focus-within:ring-blue-500/50" 
                  : "focus-within:ring-purple-500/50"
            } lg:py-3 border border-purple-700/30`}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Ask ${currentAssistant.name} anything...`}
                className="flex-grow bg-transparent border-none focus:outline-none text-white placeholder-purple-300 lg:text-base"
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className={`ml-2 ${
                  message.trim() && !sendMessageMutation.isPending 
                    ? (assistantType === "casanova" 
                      ? "text-pink-300 hover:text-white" 
                      : assistantType === "venus" 
                        ? "text-blue-300 hover:text-white" 
                        : "text-purple-300 hover:text-white") 
                    : "text-purple-500"
                } transition-colors`}
              >
                <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </form>
            
            {/* Helpful tip - Desktop only */}
            <div className="hidden lg:flex justify-center mt-2">
              <p className="text-xs text-purple-400/70">
                Press <kbd className="bg-purple-800/50 px-1.5 py-0.5 rounded text-purple-300 border border-purple-700/40 mx-1">Enter</kbd> to send message
              </p>
            </div>
          </div>
        </div>
        
        {/* Desktop Only - Assistant Details Sidebar */}
        <div className="hidden xl:block w-72 ml-6 pl-6 border-l border-purple-700/30">
          {/* Assistant Profile Card */}
          <div className={`bg-gradient-to-br ${currentAssistant.bgColor} rounded-lg p-5 border border-purple-700/30 mb-6 shadow-lg`}>
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${currentAssistant.color} flex items-center justify-center mr-3 shadow-md`}>
                <span className="text-white text-lg">{currentAssistant.emoji}</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">{currentAssistant.name}</h3>
                <p className="text-sm text-purple-200">{currentAssistant.title}</p>
              </div>
            </div>
            <p className="text-sm text-purple-200 mb-4 leading-relaxed">{currentAssistant.description}</p>
            
            <div className="flex flex-wrap gap-2">
              {currentAssistant.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="bg-purple-900/30 text-purple-200 text-xs px-2 py-0.5 rounded-full border border-purple-700/30">
                  {skill}
                </span>
              ))}
              {currentAssistant.skills.length > 3 && (
                <span className="bg-purple-900/30 text-purple-200 text-xs px-2 py-0.5 rounded-full border border-purple-700/30">
                  +{currentAssistant.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
          
          {/* Sample Questions */}
          <h4 className="font-medium text-white text-sm mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Sample Questions
          </h4>
          <div className="space-y-3 mb-6">
            {assistantType === "casanova" ? (
              <>
                <div onClick={() => handleSuggestionClick("What are some unique date ideas for this weekend?")} 
                  className="text-sm text-purple-200 p-2 rounded hover:bg-purple-800/20 cursor-pointer">
                  "What are some unique date ideas for this weekend?"
                </div>
                <div onClick={() => handleSuggestionClick("How can I plan a surprise for our anniversary?")} 
                  className="text-sm text-purple-200 p-2 rounded hover:bg-purple-800/20 cursor-pointer">
                  "How can I plan a surprise for our anniversary?"
                </div>
              </>
            ) : assistantType === "venus" ? (
              <>
                <div onClick={() => handleSuggestionClick("My partner and I keep having the same argument. How can we break this cycle?")} 
                  className="text-sm text-purple-200 p-2 rounded hover:bg-purple-800/20 cursor-pointer">
                  "My partner and I keep having the same argument. How can we break this cycle?"
                </div>
                <div onClick={() => handleSuggestionClick("How can I better communicate my needs without seeming demanding?")} 
                  className="text-sm text-purple-200 p-2 rounded hover:bg-purple-800/20 cursor-pointer">
                  "How can I better communicate my needs without seeming demanding?"
                </div>
              </>
            ) : (
              <>
                <div onClick={() => handleSuggestionClick("What does research say about successful long-term relationships?")} 
                  className="text-sm text-purple-200 p-2 rounded hover:bg-purple-800/20 cursor-pointer">
                  "What does research say about successful long-term relationships?"
                </div>
                <div onClick={() => handleSuggestionClick("Can you explain attachment styles and how they affect relationships?")} 
                  className="text-sm text-purple-200 p-2 rounded hover:bg-purple-800/20 cursor-pointer">
                  "Can you explain attachment styles and how they affect relationships?"
                </div>
              </>
            )}
          </div>
          
          {/* Quick Tip */}
          <div className={`bg-gradient-to-br ${
            assistantType === "casanova" 
              ? "from-purple-900/50 to-pink-900/40" 
              : assistantType === "venus" 
                ? "from-purple-900/50 to-blue-900/40" 
                : "from-purple-900/50 to-purple-900/40"
          } rounded-lg p-4 border border-purple-700/30 shadow-md`}>
            <h4 className="font-medium text-white text-sm mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 010-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"></path>
              </svg>
              Pro Tip
            </h4>
            <p className="text-sm text-purple-100 leading-relaxed">
              {assistantType === "casanova" 
                ? "The most memorable dates are often about shared experiences, not just fancy dinners. Try activities that create stories you'll both tell for years."
                : assistantType === "venus"
                ? "When discussing sensitive topics, try the XYZ format: 'When you do X in situation Y, I feel Z.' This helps avoid blame while clearly expressing your feelings."
                : "Research shows that a 5:1 ratio of positive to negative interactions predicts relationship success. Focus on increasing small, daily positive moments."}
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}