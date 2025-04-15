import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BottomNavigation from "../components/layout/BottomNavigation";
import Message from "../components/ai/Message";
import { useAuth } from "../contexts/AuthContext";
import { Chat } from "@shared/schema";

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

  return (
    <div className="min-h-screen w-full bg-gray-50 pt-12 pb-20">
      {/* Header */}
      <div className="px-6 mb-4">
        <div className="flex items-center mb-4">
          <button onClick={handleBackClick} className="mr-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-2xl font-bold font-poppins text-gray-800">Relationship Assistant</h1>
        </div>
        
        {/* Assistant Type Selector */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          <button
            className={`flex items-center justify-center ${
              assistantType === "casanova"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            } px-4 py-2 rounded-full text-sm font-medium`}
            onClick={() => setAssistantType("casanova")}
          >
            <span className="mr-2">👨‍🎤</span>
            Casanova
          </button>
          <button
            className={`flex items-center justify-center ${
              assistantType === "venus"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            } px-4 py-2 rounded-full text-sm font-medium`}
            onClick={() => setAssistantType("venus")}
          >
            <span className="mr-2">👩‍🚀</span>
            Venus
          </button>
          <button
            className={`flex items-center justify-center ${
              assistantType === "aurora"
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-500 border border-gray-200"
            } px-4 py-2 rounded-full text-sm font-medium`}
            onClick={() => setAssistantType("aurora")}
          >
            <span className="mr-2">🤖</span>
            Aurora
          </button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="px-6 space-y-4 mb-20">
        {isLoading ? (
          // Loading state
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
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
          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-500">Welcome to your relationship assistant! How can I help you today?</p>
          </div>
        )}
        
        {/* Always show typing indicator when sending message */}
        {sendMessageMutation.isPending && (
          <div className="flex">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-2 flex-shrink-0">
              <span className="text-white text-xs">
                {assistantType === "casanova" ? "👨‍🎤" : assistantType === "venus" ? "👩‍🚀" : "🤖"}
              </span>
            </div>
            <div className="bg-primary-100 rounded-2xl rounded-tl-none p-3 max-w-[85%]">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            className="flex-grow bg-transparent border-none focus:outline-none text-gray-700"
          />
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className={`ml-2 ${message.trim() && !sendMessageMutation.isPending ? "text-primary-600" : "text-gray-400"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </form>
        
        {/* Quick Suggestion Pills */}
        <div className="flex mt-3 space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleSuggestionClick("Can you suggest some date ideas?")}
            disabled={sendMessageMutation.isPending}
            className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-600"
          >
            Date ideas
          </button>
          <button
            onClick={() => handleSuggestionClick("We need some conversation starters")}
            disabled={sendMessageMutation.isPending}
            className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-600"
          >
            Conversation starters
          </button>
          <button
            onClick={() => handleSuggestionClick("Help us set some relationship goals")}
            disabled={sendMessageMutation.isPending}
            className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-600"
          >
            Relationship goals
          </button>
          <button
            onClick={() => handleSuggestionClick("Suggest some fun activities we can do together")}
            disabled={sendMessageMutation.isPending}
            className="flex-shrink-0 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-600"
          >
            Fun activities
          </button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="none" />
    </div>
  );
}
