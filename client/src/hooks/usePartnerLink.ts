import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "../contexts/AuthContext";

export function usePartnerLink() {
  const { user, updateCouple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkPartnerMutation = useMutation({
    mutationFn: async (partnerCode: string) => {
      if (!user) {
        throw new Error("User not logged in");
      }
      const response = await apiRequest("POST", "/api/partner/link", {
        userId: user.id,
        partnerCode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      updateCouple(data);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to link with partner");
    },
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (partnerEmail: string) => {
      if (!user) {
        throw new Error("User not logged in");
      }
      const response = await apiRequest("POST", "/api/partner/invite", {
        userId: user.id,
        partnerEmail,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      // Optional: You can log the invite details in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Invitation details:', data.debug);
      }
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to send invitation");
    },
  });

  const sendInvitation = async (email: string) => {
    try {
      await sendInvitationMutation.mutateAsync(email);
      return true;
    } catch (e) {
      return false;
    }
  };

  const linkPartner = (partnerCode: string) => {
    linkPartnerMutation.mutate(partnerCode);
  };

  return {
    linkPartner,
    sendInvitation,
    isLoading: isLoading || linkPartnerMutation.isPending,
    error,
    inviteCode: user?.partnerCode,
  };
}
