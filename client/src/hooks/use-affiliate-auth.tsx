import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// AffiliatePartner type definition
interface AffiliatePartner {
  id: number;
  name: string;
  email: string;
  status: string;
  commissionRate: number;
  createdAt: string;
  approvedAt: string | null;
  website: string | null;
}

// Login credentials type
type LoginData = {
  email: string;
  password: string;
};

// Auth context type definition
type AffiliateAuthContextType = {
  partner: AffiliatePartner | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AffiliatePartner, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

// Create context
export const AffiliateAuthContext = createContext<AffiliateAuthContextType | null>(null);

// Provider component
export function AffiliateAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Get current user data
  const {
    data: partner,
    error,
    isLoading,
  } = useQuery<AffiliatePartner | null>({
    queryKey: ['/api/affiliate/me'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/affiliate/login", credentials);
      return await res.json();
    },
    onSuccess: (data: AffiliatePartner) => {
      queryClient.setQueryData(['/api/affiliate/me'], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/affiliate/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/affiliate/me'], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AffiliateAuthContext.Provider
      value={{
        partner: partner || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AffiliateAuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAffiliateAuth() {
  const context = useContext(AffiliateAuthContext);
  if (!context) {
    throw new Error("useAffiliateAuth must be used within an AffiliateAuthProvider");
  }
  return context;
}