import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { User, Couple } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  couple: Couple | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  updateCouple: (coupleData: Couple) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for stored auth data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("bondquest_user");
    const storedCouple = localStorage.getItem("bondquest_couple");
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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

  const logout = () => {
    setUser(null);
    setCouple(null);
    localStorage.removeItem("bondquest_user");
    localStorage.removeItem("bondquest_couple");
  };

  const updateCouple = (coupleData: Couple) => {
    setCouple(coupleData);
    localStorage.setItem("bondquest_couple", JSON.stringify(coupleData));
  };

  return (
    <AuthContext.Provider value={{ user, couple, isLoading, login, logout, updateCouple }}>
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
