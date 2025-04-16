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
  createMockCouple: () => void; // Added mock couple function
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
  
  // Function to create a mock couple for testing when user is logged in but doesn't have a partner
  const createMockCouple = () => {
    if (!user) {
      console.error("Cannot create mock couple: No user logged in");
      return;
    }
    
    // Create a mock partner user
    const mockPartner: User = {
      id: user.id + 1000, // Use an ID that won't conflict
      username: `partner_of_${user.username}`,
      email: `partner_of_${user.email}`,
      password: "", 
      displayName: `Partner of ${user.displayName || user.username}`,
      avatar: null,
      loveLanguage: "Quality Time",
      relationshipStatus: "Dating",
      anniversary: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365), // 1 year ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      partnerCode: `MOCK-${Math.floor(Math.random() * 10000)}`,
    };
    
    // Create a mock couple
    const mockCouple: Couple = {
      id: 500,
      user1Id: user.id,
      user2Id: mockPartner.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      lastSyncDate: new Date(),
      bondStrength: 75,
      xp: 1200,
      level: 5,
      perfectStreak: 8,
      attributes: { "Communication": 85, "Trust": 90, "EmotionalIntimacy": 80, "Respect": 95, "Teamwork": 88 },
      currentTier: "Bronze",
      status: "active",
    };
    
    // Set the couple and store in localStorage
    setCouple(mockCouple);
    localStorage.setItem("bondquest_couple", JSON.stringify(mockCouple));
    
    console.log("Mock couple created for testing:", mockCouple);
  };

  return (
    <AuthContext.Provider value={{ user, couple, isLoading, isAdmin, login, socialLogin, logout, updateCouple, createMockCouple }}>
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
