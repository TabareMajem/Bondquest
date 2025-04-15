import { Link, useLocation } from "wouter";
import { Home, PlayCircle, Trophy, BarChart, Settings } from "lucide-react";

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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center">
      <div 
        onClick={(e) => handleNavigate("/home", e)} 
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "home" ? "text-primary-600" : "text-gray-400"}`}
      >
        <Home className={`w-6 h-6 ${activeTab === "home" ? "text-primary-600" : "text-gray-400"}`} />
        <span>Home</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/quizzes", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "play" ? "text-primary-600" : "text-gray-400"}`}
      >
        <PlayCircle className={`w-6 h-6 ${activeTab === "play" ? "text-primary-600" : "text-gray-400"}`} />
        <span>Play</span>
      </div>
      
      <div 
        onClick={(e) => e.preventDefault()}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "compete" ? "text-primary-600" : "text-gray-400"}`}
      >
        <Trophy className={`w-6 h-6 ${activeTab === "compete" ? "text-primary-600" : "text-gray-400"}`} />
        <span>Compete</span>
      </div>
      
      <div 
        onClick={(e) => handleNavigate("/insights", e)}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "insights" ? "text-primary-600" : "text-gray-400"}`}
      >
        <BarChart className={`w-6 h-6 ${activeTab === "insights" ? "text-primary-600" : "text-gray-400"}`} />
        <span>Insights</span>
      </div>
      
      <div 
        onClick={(e) => e.preventDefault()}
        className={`flex flex-col items-center text-xs font-medium cursor-pointer ${activeTab === "settings" ? "text-primary-600" : "text-gray-400"}`}
      >
        <Settings className={`w-6 h-6 ${activeTab === "settings" ? "text-primary-600" : "text-gray-400"}`} />
        <span>Settings</span>
      </div>
    </div>
  );
}
