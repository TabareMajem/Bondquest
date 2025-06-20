import { useLocation } from "wouter";
import { Home, Gamepad2, Trophy, BarChart3, MessageCircleHeart, Settings, ShieldCheck, Gift, Heart, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

interface BottomNavigationProps {
  activeTab: "home" | "play" | "compete" | "insights" | "ai" | "profile" | "admin" | "rewards" | "bond" | "none" | "account";
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // All tabs have their own dedicated routes now
  const adjustedTab = activeTab;
  
  // Detect if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial state
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleNavigate = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };
  
  const getIconClassName = (tab: string) => {
    const baseClasses = isMobile ? "w-5 h-5 transition-all duration-200" : "w-6 h-6 transition-all duration-200";
    if (adjustedTab === tab) {
      return `${baseClasses} text-white`;
    }
    return `${baseClasses} text-purple-200/70`;
  };
  
  const getLabelClassName = (tab: string) => {
    // On smaller screens, make the text even smaller
    const baseClasses = isMobile 
      ? "mt-1 text-[0.65rem] font-medium transition-all duration-200"
      : "mt-1 text-xs font-medium transition-all duration-200";
      
    if (adjustedTab === tab) {
      return `${baseClasses} text-white`;
    }
    return `${baseClasses} text-purple-200/70`;
  };
  
  const getButtonClassName = (tab: string) => {
    const baseClasses = "flex flex-col items-center cursor-pointer transition-transform duration-200 relative";
    if (adjustedTab === tab) {
      return `${baseClasses} scale-105`;
    }
    return `${baseClasses} hover:scale-105`;
  };
  
  // Determine which tabs to show based on screen size
  const renderTabs = () => {
    // Make sure all primary tabs are always visible
    const mainTabs = ['home', 'play', 'compete', 'insights', 'ai', 'profile'];
    
    // On larger screens we can show more tabs
    const visibleTabs = mainTabs;
      
    return (
      <>
        {visibleTabs.includes('home') && (
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
        )}
        
        {visibleTabs.includes('play') && (
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
        )}
        
        {visibleTabs.includes('compete') && (
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
        )}
        
        {visibleTabs.includes('insights') && (
          <div 
            onClick={(e) => handleNavigate("/insights", e)}
            className={getButtonClassName("insights")}
          >
            {adjustedTab === "insights" && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
            )}
            <BarChart3 className={getIconClassName("insights")} />
            <span className={getLabelClassName("insights")}>Insights</span>
          </div>
        )}
        
        {/* Add Bond tab separately - visible on both mobile and desktop */}
        <div 
          onClick={(e) => handleNavigate("/bond-assessment", e)}
          className={getButtonClassName("bond")}
        >
          {adjustedTab === "bond" && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
          )}
          <Heart className={getIconClassName("bond")} />
          <span className={getLabelClassName("bond")}>Bond</span>
        </div>
        
        {visibleTabs.includes('ai') && (
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
        )}
        
        {visibleTabs.includes('profile') && (
          <div 
            onClick={(e) => handleNavigate("/profile", e)}
            className={getButtonClassName("profile")}
          >
            {adjustedTab === "profile" && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
            )}
            <Settings className={getIconClassName("profile")} />
            <span className={getLabelClassName("profile")}>Profile</span>
          </div>
        )}
        
        {/* Dedicated Rewards tab */}
        <div 
          onClick={(e) => handleNavigate("/rewards", e)}
          className={getButtonClassName("rewards")}
        >
          {adjustedTab === "rewards" && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
          )}
          <Gift className={getIconClassName("rewards")} />
          <span className={getLabelClassName("rewards")}>Rewards</span>
        </div>
        
        {/* Account/Subscription tab */}
        <div 
          onClick={(e) => handleNavigate("/subscription", e)}
          className={getButtonClassName("account")}
        >
          {adjustedTab === "account" && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div>
          )}
          <CreditCard className={getIconClassName("account")} />
          <span className={getLabelClassName("account")}>Account</span>
        </div>
        
        {isAdmin && !isMobile && (
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
      </>
    );
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-fuchsia-900/95 backdrop-blur-md pt-2 pb-4 md:pt-3 md:pb-5 px-2 md:px-5 flex justify-between items-center z-50 border-t border-purple-700/30 shadow-lg">
      {renderTabs()}
      
      {/* If on mobile and user is admin, show a dropdown or more button for advanced features */}
      {isAdmin && isMobile && (
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
