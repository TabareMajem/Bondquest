import { Link } from "wouter";
import { Home, PlayCircle, Trophy, BarChart, Settings } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "home" | "play" | "compete" | "insights" | "settings" | "none";
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center">
      <Link href="/home">
        <a className={`flex flex-col items-center text-xs font-medium ${activeTab === "home" ? "text-primary-600" : "text-gray-400"}`}>
          <Home className={`w-6 h-6 ${activeTab === "home" ? "text-primary-600" : "text-gray-400"}`} />
          <span>Home</span>
        </a>
      </Link>
      
      <Link href="/quizzes">
        <a className={`flex flex-col items-center text-xs font-medium ${activeTab === "play" ? "text-primary-600" : "text-gray-400"}`}>
          <PlayCircle className={`w-6 h-6 ${activeTab === "play" ? "text-primary-600" : "text-gray-400"}`} />
          <span>Play</span>
        </a>
      </Link>
      
      <Link href="#" onClick={(e) => e.preventDefault()}>
        <a className={`flex flex-col items-center text-xs font-medium ${activeTab === "compete" ? "text-primary-600" : "text-gray-400"}`}>
          <Trophy className={`w-6 h-6 ${activeTab === "compete" ? "text-primary-600" : "text-gray-400"}`} />
          <span>Compete</span>
        </a>
      </Link>
      
      <Link href="/insights">
        <a className={`flex flex-col items-center text-xs font-medium ${activeTab === "insights" ? "text-primary-600" : "text-gray-400"}`}>
          <BarChart className={`w-6 h-6 ${activeTab === "insights" ? "text-primary-600" : "text-gray-400"}`} />
          <span>Insights</span>
        </a>
      </Link>
      
      <Link href="#" onClick={(e) => e.preventDefault()}>
        <a className={`flex flex-col items-center text-xs font-medium ${activeTab === "settings" ? "text-primary-600" : "text-gray-400"}`}>
          <Settings className={`w-6 h-6 ${activeTab === "settings" ? "text-primary-600" : "text-gray-400"}`} />
          <span>Settings</span>
        </a>
      </Link>
    </div>
  );
}
