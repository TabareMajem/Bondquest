import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User, Couple } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  couple: Couple | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  socialLogin: (provider: string, accessToken?: string) => Promise<void>;
  logout: () => void;
  updateCouple: (coupleData: Couple) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for stored auth data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("bondquest_user");
    const storedCouple = localStorage.getItem("bondquest_couple");
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Check if the user is an admin (has admin@bondquest.com email)
      if (parsedUser.email === "admin@bondquest.com") {
        setIsAdmin(true);
      }
    }
    
    if (storedCouple) {
      setCouple(JSON.parse(storedCouple));
    }
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await response.json();
      
      setUser(data.user);
      setCouple(data.couple || null);
      
      // Check if the user is an admin
      if (data.user.email === "admin@bondquest.com") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      // Store auth data in localStorage
      localStorage.setItem("bondquest_user", JSON.stringify(data.user));
      if (data.couple) {
        localStorage.setItem("bondquest_couple", JSON.stringify(data.couple));
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Call logout API endpoint
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setCouple(null);
      setIsAdmin(false);
      localStorage.removeItem("bondquest_user");
      localStorage.removeItem("bondquest_couple");
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: string, accessToken?: string): Promise<void> => {
    setIsLoading(true);
    try {
      // In a real implementation, we would make an API request with the token
      // For now, we're simulating the login with a mocked response
      // Create a proper User object that matches our schema
      const mockUser: User = {
        id: 999,
        username: `${provider}_user`,
        password: "", // This would not be returned from a real API
        email: `${provider}_user@example.com`,
        displayName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        avatar: null,
        loveLanguage: null,
        relationshipStatus: null,
        anniversary: null,
        createdAt: new Date(),
        partnerCode: `${provider.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
      };
      
      setUser(mockUser);
      setCouple(null);
      
      // Store auth data in localStorage
      localStorage.setItem("bondquest_user", JSON.stringify(mockUser));
      
      // Check if the user is an admin (in a real scenario, this would come from the server)
      if (mockUser.email.includes("admin")) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateCouple = (coupleData: Couple) => {
    setCouple(coupleData);
    localStorage.setItem("bondquest_couple", JSON.stringify(coupleData));
  };

  return (
    <AuthContext.Provider value={{ user, couple, isLoading, isAdmin, login, socialLogin, logout, updateCouple }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
