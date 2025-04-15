import { Link, useLocation } from "wouter";
import { Home, Gamepad2, HeartHandshake, MessagesSquare, BarChart3 } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "home" | "play" | "compete" | "insights" | "settings" | "none";
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, navigate] = useLocation();
  
  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-purple-900 py-3 px-6 flex justify-between items-center">
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
        onClick={(e) => handleNavigate("/ai-assistant", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "compete" ? "text-white" : "text-purple-300"}`}
      >
        <HeartHandshake className={`w-6 h-6 ${activeTab === "compete" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Love AI</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/insights", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "insights" ? "text-white" : "text-purple-300"}`}
      >
        <BarChart3 className={`w-6 h-6 ${activeTab === "insights" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Insights</span>
      </div>
      
      <div 
        onClick={(e) => e.preventDefault()}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "settings" ? "text-white" : "text-purple-300"}`}
      >
        <MessagesSquare className={`w-6 h-6 ${activeTab === "settings" ? "text-white" : "text-purple-300"}`} />
        <span className="mt-1">Chat</span>
      </div>
    </div>
  );
}
