import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "../components/layout/BottomNavigation";
import BondStrengthMeter from "../components/dashboard/BondStrengthMeter";
import DailyQuizCard from "../components/dashboard/DailyQuizCard";
import ActivityCard from "../components/dashboard/ActivityCard";
import QuickAccessButtons from "../components/ui/QuickAccessButtons";
import { DailyJourney } from "../components/dashboard/DailyJourney";
import { ProactiveAssistant } from "../components/ai/ProactiveAssistant";
import { useAuth } from "../contexts/AuthContext";
import { Quiz, Activity } from "@shared/schema";
import { get } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Calendar, 
  Gift, 
  Heart, 
  Zap, 
  Trophy
} from "lucide-react";

interface DashboardData {
  couple: {
    id: number;
    bondStrength: number;
    level: number;
    xp: number;
  };
  user1: {
    id: number;
    displayName: string;
    avatar?: string;
  };
  user2: {
    id: number;
    displayName: string;
    avatar?: string;
  };
  recentActivities: Activity[];
  dailyQuiz: Quiz;
}

export default function EnhancedHome() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user, couple } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  // For development, add a manual option to restart the onboarding process
  const handleRestartApp = () => {
    // Clear all local storage
    localStorage.removeItem("bondquest_user");
    localStorage.removeItem("bondquest_couple");
    
    // Force a redirect to the onboarding page
    window.location.href = "/";
  };

  // Redirect to onboarding if no user is logged in
  // or to profile setup if that hasn't been completed
  useEffect(() => {
    if (!user && !localStorage.getItem("bondquest_user")) {
      // Not logged in, go to onboarding
      navigate("/");
    } else if (user && !localStorage.getItem("profile_setup_completed")) {
      // User exists but profile setup not done, go to profile setup
      navigate("/profile-setup");
    }
  }, [user, navigate]);

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: [`/api/couples/${couple?.id || 1}/dashboard`],
    queryFn: () => get(`/api/couples/${couple?.id || 1}/dashboard`),
    enabled: !!couple, // Only run query if couple exists
    staleTime: 5000,
  });
  
  // Function to handle daily check-in
  const handleCheckIn = async () => {
    try {
      const checkInData = {
        userId: user?.id || 1,
        mood: "happy", // Default mood
        note: "Daily check-in via quick access button"
      };
      
      const response = await fetch('/api/daily-check-ins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkInData),
      });
      
      if (response.ok) {
        // Refetch dashboard data to update activities
        refetch();
        // Show success message
        alert("Check-in recorded successfully!");
      } else {
        alert("Failed to record check-in. Please try again.");
      }
    } catch (error) {
      console.error("Error creating check-in:", error);
      alert("An error occurred while creating check-in");
    }
  };

  // Extract data safely for rendering
  const bondStrength = data?.couple?.bondStrength || 50;
  const level = data?.couple?.level || 1;
  const xp = data?.couple?.xp || 0;
  const displayName = user?.displayName || "User";
  const partnerName = couple ? (user?.id === data?.user1?.id ? data?.user2?.displayName : data?.user1?.displayName) : null;
  const activities = data?.recentActivities || [];

  // If no user is logged in or data is loading, show loading state
  if ((!user && !localStorage.getItem("bondquest_user")) || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-20 h-20 bg-primary-200 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }
  
  // If user exists but no couple is linked, check if they've chosen to skip
  if (user && !couple) {
    const hasSkippedPartnerLinking = localStorage.getItem("profile_setup_completed") === "true";
    
    if (hasSkippedPartnerLinking) {
      return renderSoloMode();
    }
    
    // Otherwise show the partner linking screen
    return renderPartnerLinking();
  }

  // If there's a dashboard error but we're logged in, check if they've chosen to skip
  if (error && user) {
    console.error("Dashboard data fetch error:", error);
    
    const hasSkippedPartnerLinking = localStorage.getItem("profile_setup_completed") === "true";
    
    if (hasSkippedPartnerLinking) {
      return renderSoloMode();
    }
    
    // Otherwise show the partner linking error screen
    return renderPartnerLinkingError();
  }

  // Main couple mode dashboard
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900">
      {/* Header with gradient background */}
      <div className="w-full px-4 md:px-6 pt-8 md:pt-12 pb-4 md:pb-6 relative">
        {/* Back to start button - only shown in development */}
        {showDebug && (
          <button 
            onClick={handleRestartApp}
            className="absolute top-4 left-4 p-2 bg-white/10 rounded-md text-white text-sm backdrop-blur-sm border border-white/10"
          >
            Back to Start
          </button>
        )}

        <div className="flex justify-between items-center mb-6 mt-2 md:mt-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 md:w-14 h-12 md:h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-xl">
              <img 
                src={user?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base md:text-lg">{displayName}</h2>
              <div className="flex items-center">
                <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-0.5 rounded-full font-medium shadow-md">
                  {t('home.level', { level })}
                </span>
                <span className="text-xs text-white/80 ml-2">{xp} XP</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="p-2 md:p-2.5 rounded-full bg-white/10 backdrop-blur-sm shadow-lg border border-white/10"
              onClick={() => navigate("/rewards")}
            >
              <Gift className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
            <button className="p-2 md:p-2.5 rounded-full bg-white/10 backdrop-blur-sm shadow-lg border border-white/10">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Bond Strength Meter */}
        <div className="mb-4 md:mb-6 bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 shadow-xl border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium text-sm md:text-base">{t('home.bondStrength')}</span>
            <span className="text-white text-lg md:text-xl font-bold">{bondStrength}%</span>
          </div>
          <div className="h-2 md:h-3 bg-purple-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full"
              style={{ width: `${bondStrength}%` }}
            ></div>
          </div>
          
          {partnerName && (
            <div className="mt-2 flex items-center justify-center">
              <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-pink-300" />
                <span className="text-xs text-white/90">{t('home.bondedWith', { name: partnerName })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Daily Journey Section */}
      <div className="px-4 md:px-6 mb-4 md:mb-6">
        <DailyJourney />
      </div>
      
      {/* Proactive AI Suggestions */}
      <div className="px-4 md:px-6 mb-4 md:mb-6">
        <ProactiveAssistant />
      </div>

      {/* Daily Challenge Card */}
      <div className="px-4 md:px-6 mb-4 md:mb-6">
        <div 
          className="relative p-4 md:p-5 bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-md rounded-xl md:rounded-2xl shadow-xl border border-pink-500/20"
          onClick={() => data?.dailyQuiz && navigate(`/quizzes/${data.dailyQuiz.id}`)}
        >
          <div className="absolute right-4 top-4 w-10 h-10 md:w-12 md:h-12 opacity-50">
            <Zap className="w-full h-full text-white" />
          </div>
          
          <h3 className="text-white font-bold text-lg mb-1.5">{t('home.dailyChallenge')}</h3>
          <p className="text-white/90 text-sm mb-3 pr-6">
            {t('home.dailyChallengeDesc')}
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-white font-semibold bg-white/20 px-2 py-0.5 rounded">+25 XP</span>
            <span className="text-xs text-white font-semibold bg-white/20 px-2 py-0.5 rounded">5 {t('home.minutes')}</span>
          </div>
          
          <Button 
            size="sm" 
            className="mt-3 bg-white text-purple-700 hover:bg-white/90"
          >
            {t('home.startChallenge')}
          </Button>
        </div>
      </div>
      
      {/* Competition Banner */}
      <div className="px-4 md:px-6 mb-4 md:mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl md:rounded-2xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 -mt-8 -mr-8 bg-blue-500 rounded-full opacity-30"></div>
          
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-white font-bold mb-2 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                {t('home.weeklyCompetition')}
              </h3>
              <p className="text-white/80 text-sm mb-3 max-w-xs">
                {t('home.competitionDesc')}
              </p>
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white"
                onClick={() => navigate("/compete")}
              >
                {t('home.joinCompetition')}
              </Button>
            </div>
            
            <div className="flex flex-col items-center bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
              <span className="text-xs text-white/80">{t('home.endsIn')}</span>
              <span className="text-lg font-bold text-white">2d 18h</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activities */}
      <div className="px-4 md:px-6 mb-4 md:mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold">{t('home.recentActivities')}</h3>
          <Button 
            variant="link" 
            className="text-white text-sm p-0 h-auto"
            onClick={() => navigate("/insights")}
          >
            {t('common.viewAll')}
          </Button>
        </div>
        
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.slice(0, 3).map((activity, index) => (
              <ActivityCard 
                key={activity.id || index}
                activity={activity}
              />
            ))
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-white/70 text-sm">{t('home.noActivities')}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Access Buttons */}
      <QuickAccessButtons 
        onAIAssistantClick={() => navigate("/ai-assistant")}
        onStartQuizClick={() => navigate("/quizzes")}
        onCheckInClick={handleCheckIn}
      />
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />
    </div>
  );
  
  // Helper function to render Solo Mode UI
  function renderSoloMode() {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900">
        {/* Header with gradient background */}
        <div className="w-full px-4 md:px-6 pt-8 md:pt-12 pb-4 md:pb-6 relative">
          {showDebug && (
            <button 
              onClick={handleRestartApp}
              className="absolute top-4 left-4 p-2 bg-white/10 rounded-md text-white text-sm backdrop-blur-sm border border-white/10"
            >
              Back to Start
            </button>
          )}

          <div className="flex justify-between items-center mb-6 mt-2 md:mt-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 md:w-14 h-12 md:h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-xl">
                <img 
                  src={user?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base md:text-lg">{user?.displayName || "Solo User"}</h2>
                <div className="flex items-center">
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-0.5 rounded-full font-medium shadow-md">
                    {t('home.soloMode')}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/partner-linking")}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs md:text-sm font-medium"
            >
              {t('home.findPartner')}
            </button>
          </div>
          
          {/* Info box about solo mode */}
          <div className="mb-4 md:mb-6 bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 shadow-xl border border-white/10">
            <h3 className="text-white font-medium mb-2">{t('home.soloMode')}</h3>
            <p className="text-white/80 text-sm">
              {t('home.soloModeDesc')}
            </p>
            <button 
              onClick={() => navigate("/partner-linking")} 
              className="mt-3 w-full bg-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition-all"
            >
              {t('home.linkWithPartner')}
            </button>
          </div>
          
          {/* Proactive AI Suggestions - Solo Mode */}
          <div className="mb-4 md:mb-6">
            <ProactiveAssistant />
          </div>
          
          {/* Daily Challenge Card - Solo Mode */}
          <div className="mb-4 md:mb-6">
            <div 
              className="relative p-4 md:p-5 bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-md rounded-xl md:rounded-2xl shadow-xl border border-pink-500/20"
              onClick={() => navigate("/quizzes")}
            >
              <div className="absolute right-4 top-4 w-10 h-10 md:w-12 md:h-12 opacity-50">
                <Zap className="w-full h-full text-white" />
              </div>
              
              <h3 className="text-white font-bold text-lg mb-1.5">{t('home.selfAssessment')}</h3>
              <p className="text-white/90 text-sm mb-3 pr-6">
                {t('home.selfAssessmentDesc')}
              </p>
              
              <Button 
                size="sm" 
                className="mt-1 bg-white text-purple-700 hover:bg-white/90"
                onClick={() => navigate("/quizzes")}
              >
                {t('home.startAssessment')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Quick Access Buttons */}
        <QuickAccessButtons 
          onAIAssistantClick={() => navigate("/ai-assistant")}
          onStartQuizClick={() => navigate("/quizzes")}
          onCheckInClick={handleCheckIn}
        />
        
        {/* Bottom Navigation */}
        <BottomNavigation activeTab="home" />
      </div>
    );
  }
  
  // Helper function to render Partner Linking UI
  function renderPartnerLinking() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900 p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-xl border border-white/20 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">{t('home.connectWithPartner')}</h2>
            <p className="text-white/80 mb-6">{t('home.connectDesc')}</p>
            <button 
              onClick={() => navigate("/partner-linking")} 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {t('home.linkWithPartner')}
            </button>
          </div>
          
          <p className="text-white/60 text-sm">
            {t('home.relationshipAppDesc')}
          </p>
        </div>
      </div>
    );
  }
  
  // Helper function to render Partner Linking Error UI
  function renderPartnerLinkingError() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900 p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-xl border border-white/20 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">{t('home.connectWithPartner')}</h2>
            <p className="text-white/80 mb-6">{t('home.connectDesc')}</p>
            <button 
              onClick={() => navigate("/partner-linking")} 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all mb-4"
            >
              {t('home.linkWithPartner')}
            </button>
            <button 
              onClick={() => {
                localStorage.setItem("profile_setup_completed", "true");
                window.location.reload();
              }}
              className="w-full bg-white/20 text-white py-3 px-4 rounded-xl"
            >
              {t('home.continueSolo')}
            </button>
          </div>
          
          <p className="text-white/60 text-sm">
            {t('home.errorDesc')}
          </p>
        </div>
      </div>
    );
  }
}