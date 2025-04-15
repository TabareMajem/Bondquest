import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "../contexts/AuthContext";
import { Chat } from "@shared/schema";

type AssistantType = "casanova" | "venus" | "aurora";

export function useAIAssistant() {
  const { couple } = useAuth();
  const [assistantType, setAssistantType] = useState<AssistantType>("casanova");

  // Fetch chat history
  const chatsQuery = useQuery<Chat[]>({
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

  const sendMessage = (message: string) => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };

  const changeAssistantType = (type: AssistantType) => {
    setAssistantType(type);
  };

  return {
    chats: chatsQuery.data || [],
    isLoadingChats: chatsQuery.isLoading,
    error: chatsQuery.error || sendMessageMutation.error,
    assistantType,
    isSending: sendMessageMutation.isPending,
    sendMessage,
    changeAssistantType,
  };
}
