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
      // For development: open the email preview URL in a new tab if available
      if (process.env.NODE_ENV === 'development' && data.debug?.emailPreviewUrl) {
        console.log('Invitation details:', data.debug);
        window.open(data.debug.emailPreviewUrl, '_blank');
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
    isLoading: isLoading || linkPartnerMutation.isPending || sendInvitationMutation.isPending,
    error,
    inviteCode: user?.partnerCode,
  };
}
