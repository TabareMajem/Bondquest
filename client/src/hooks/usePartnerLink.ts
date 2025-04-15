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

  const sendInvitation = async (email: string) => {
    // In a real app, this would send an API request to invite by email
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Success!
      setError(null);
      setIsLoading(false);
      return true;
    } catch (e) {
      setError("Failed to send invitation");
      setIsLoading(false);
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
