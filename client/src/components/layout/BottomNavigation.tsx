import { useLocation } from "wouter";
import { Home, Gamepad2, Trophy, BarChart3, MessageCircleHeart, Settings, ShieldCheck, Gift, Heart, HeartHandshake } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavigationProps {
  activeTab: "home" | "play" | "compete" | "insights" | "ai" | "profile" | "admin" | "rewards" | "bond" | "none";
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  
  // Map consolidated tabs to their new locations
  const adjustedTab = activeTab === "bond" ? "insights" : 
                      activeTab === "rewards" ? "profile" : 
                      activeTab;
  
  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };
  
  const getIconClassName = (tab: string) => {
    const baseClasses = "w-6 h-6 transition-all duration-200";
    if (adjustedTab === tab) {
      return `${baseClasses} text-white`;
    }
    return `${baseClasses} text-purple-200/70`;
  };
  
  const getLabelClassName = (tab: string) => {
    const baseClasses = "mt-1 text-xs font-medium transition-all duration-200";
    if (adjustedTab === tab) {
      return `${baseClasses} text-white`;
    }
    return `${baseClasses} text-purple-200/70`;
  };
  
  const getButtonClassName = (tab: string) => {
    const baseClasses = "flex flex-col items-center cursor-pointer transition-transform duration-200 relative";
    if (adjustedTab === tab) {
      return `${baseClasses} scale-110`;
    }
    return `${baseClasses} hover:scale-105`;
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-fuchsia-900/95 backdrop-blur-md pt-3 pb-5 px-5 flex justify-between items-center z-50 border-t border-purple-700/30 shadow-lg">
      <div 
        onClick={(e) => handleNavigate("/home", e)} 
        className={getButtonClassName("home")}
      >
        {adjustedTab === "home" && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
        )}
        <Home className={getIconClassName("home")} />
        <span className={getLabelClassName("home")}>Home</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/quizzes", e)}
        className={getButtonClassName("play")}
      >
        {adjustedTab === "play" && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
        )}
        <Gamepad2 className={getIconClassName("play")} />
        <span className={getLabelClassName("play")}>Play</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/compete", e)}
        className={getButtonClassName("compete")}
      >
        {adjustedTab === "compete" && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
        )}
        <Trophy className={getIconClassName("compete")} />
        <span className={getLabelClassName("compete")}>Compete</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate(activeTab === "bond" ? "/bond-assessment" : "/insights", e)}
        className={getButtonClassName("insights")}
      >
        {adjustedTab === "insights" && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
        )}
        <BarChart3 className={getIconClassName("insights")} />
        <span className={getLabelClassName("insights")}>Insights</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/ai-assistant", e)}
        className={getButtonClassName("ai")}
      >
        {adjustedTab === "ai" && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
        )}
        <MessageCircleHeart className={getIconClassName("ai")} />
        <span className={getLabelClassName("ai")}>Love AI</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate(activeTab === "rewards" ? "/rewards" : "/profile", e)}
        className={getButtonClassName("profile")}
      >
        {adjustedTab === "profile" && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
        )}
        <Settings className={getIconClassName("profile")} />
        <span className={getLabelClassName("profile")}>Profile</span>
      </div>
      
      {isAdmin && (
        <div 
          onClick={(e) => handleNavigate("/admin", e)}
          className={getButtonClassName("admin")}
        >
          {adjustedTab === "admin" && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
          )}
          <ShieldCheck className={getIconClassName("admin")} />
          <span className={getLabelClassName("admin")}>Admin</span>
        </div>
      )}
    </div>
  );
}
