import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient
} from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types
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

type LoginData = {
  email: string;
  password: string;
};

type AffiliateAuthContextType = {
  partner: AffiliatePartner | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AffiliatePartner, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

const AffiliateAuthContext = createContext<AffiliateAuthContextType | null>(null);

export function AffiliateAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query current affiliate partner
  const {
    data: partner,
    error,
    isLoading,
  } = useQuery<AffiliatePartner | null, Error>({
    queryKey: ['/api/affiliate/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/affiliate/me');
        
        if (response.status === 401) {
          return null;
        }
        
        return await response.json();
      } catch (error) {
        return null;
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest('POST', '/api/affiliate/login', credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return await res.json();
    },
    onSuccess: (data: AffiliatePartner) => {
      queryClient.setQueryData(['/api/affiliate/me'], data);
      toast({
        title: "Success",
        description: `Welcome back, ${data.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/affiliate/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/affiliate/me'], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
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
        partner,
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

export function useAffiliateAuth() {
  const context = useContext(AffiliateAuthContext);
  if (!context) {
    throw new Error("useAffiliateAuth must be used within an AffiliateAuthProvider");
  }
  return context;
}