import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User, Couple } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  couple: Couple | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
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

  const updateCouple = (coupleData: Couple) => {
    setCouple(coupleData);
    localStorage.setItem("bondquest_couple", JSON.stringify(coupleData));
  };

  return (
    <AuthContext.Provider value={{ user, couple, isLoading, isAdmin, login, logout, updateCouple }}>
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
