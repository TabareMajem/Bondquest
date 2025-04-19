import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User, Couple } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  couple: Couple | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  socialLogin: (provider: string) => Promise<void>;
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
    const profileSetupCompleted = localStorage.getItem("profile_setup_completed") === "true";
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Check if the user is an admin (has admin username or admin@bondquest.com email)
      if (parsedUser.username === "admin" || parsedUser.email === "admin@bondquest.com") {
        setIsAdmin(true);
        console.log("User has admin privileges");
      }
      
      // If user has completed profile setup but no couple data, create a temporary token
      // to ensure they can access solo mode without the redirect loop
      if (profileSetupCompleted && !storedCouple) {
        console.log("Profile setup completed, enabling solo mode access");
        // This is used by the Home component to determine if user should see solo mode
        localStorage.setItem("profile_setup_completed", "true");
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
      
      // Check if the user is an admin (has admin username or admin@bondquest.com email)
      if (data.user.username === "admin" || data.user.email === "admin@bondquest.com") {
        setIsAdmin(true);
        console.log("User has admin privileges");
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
      
      // Clear local state
      setUser(null);
      setCouple(null);
      setIsAdmin(false);
      
      // Clear all local storage items that might affect state
      localStorage.removeItem("bondquest_user");
      localStorage.removeItem("bondquest_couple");
      localStorage.removeItem("profile_setup_completed");
      localStorage.removeItem("media_query_cache");
      
      // Instead of forcing a page reload with location.href which can cause
      // navigation loop issues, use history API to replace the current URL
      // This avoids adding a new entry to history stack
      window.history.replaceState({}, '', '/');
      window.location.reload();
      return; // Early return as we're reloading the page
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Even if API call failed, still clear local state
      localStorage.removeItem("bondquest_user");
      localStorage.removeItem("bondquest_couple");
      localStorage.removeItem("profile_setup_completed");
      localStorage.removeItem("media_query_cache");
      
      // Use same history replacement approach
      window.history.replaceState({}, '', '/');
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (provider: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Redirect to the appropriate social login URL
      window.location.href = `/auth/${provider.toLowerCase()}`;
    } catch (error) {
      console.error(`${provider} login redirect failed:`, error);
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
      anniversary: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0], // 1 year ago
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      partnerCode: `MOCK-${Math.floor(Math.random() * 10000)}`,
    };
    
    // Create a mock couple
    const mockCouple: Couple = {
      id: 500,
      userId1: user.id,
      userId2: mockPartner.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      bondStrength: 75,
      xp: 1200,
      level: 5
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
