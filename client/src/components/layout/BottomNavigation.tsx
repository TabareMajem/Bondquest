import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Trophy, BarChart3, MessageCircleHeart, User } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "home" | "play" | "compete" | "insights" | "ai" | "profile" | "none";
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, navigate] = useLocation();
  
  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-purple-900 py-3 px-4 flex justify-between items-center z-50">
      <div 
        onClick={(e) => handleNavigate("/home", e)} 
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "home" ? "text-white" : "text-purple-300"}`}
      >
        <Home className={`w-6 h-6 ${activeTab === "home" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Home</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/quizzes", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "play" ? "text-white" : "text-purple-300"}`}
      >
        <Gamepad2 className={`w-6 h-6 ${activeTab === "play" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Play</span>
      </div>
      
      <div 
        onClick={(e) => e.preventDefault()}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "compete" ? "text-white" : "text-purple-300"}`}
      >
        <Trophy className={`w-6 h-6 ${activeTab === "compete" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Compete</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/insights", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "insights" ? "text-white" : "text-purple-300"}`}
      >
        <BarChart3 className={`w-6 h-6 ${activeTab === "insights" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Insights</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/ai-assistant", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "ai" ? "text-white" : "text-purple-300"}`}
      >
        <MessageCircleHeart className={`w-6 h-6 ${activeTab === "ai" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Love AI</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/profile", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "profile" ? "text-white" : "text-purple-300"}`}
      >
        <User className={`w-6 h-6 ${activeTab === "profile" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Profile</span>
      </div>
    </div>
  );
}
