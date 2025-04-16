import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "../components/layout/PageLayout";
import BondStrengthMeter from "../components/dashboard/BondStrengthMeter";
import DailyQuizCard from "../components/dashboard/DailyQuizCard";
import ActivityCard from "../components/dashboard/ActivityCard";
import QuickAccessButtons from "../components/ui/QuickAccessButtons";
import { useAuth } from "../contexts/AuthContext";
import { Quiz, Activity } from "@shared/schema";
import { get } from "@/lib/apiClient";
import { User, ChevronRight } from "lucide-react"; // Added icons

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

export default function Home() {
  const [, navigate] = useLocation();
  const { user, couple, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Fetch dashboard data from the API
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    // Only fetch if authenticated and has couple
    enabled: isAuthenticated && !!couple
  });
  
  // Handle check-in action
  const handleCheckIn = () => {
    // TODO: Implement daily check-in
    alert("Daily check-in feature coming soon!");
  };
  
  // Handle restart app (for development purposes)
  const handleRestartApp = () => {
    localStorage.removeItem("bondquest_user");
    localStorage.removeItem("bondquest_couple");
    localStorage.removeItem("profile_setup_completed");
    window.location.href = "/";
  };
  
  // If authentication is still loading, show a loading state
  if (authLoading) {
    return (
      <PageLayout 
        activeTab="home" 
        pageTitle="Loading..."
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md shadow-xl border border-white/20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 animate-spin">
              <svg className="w-full h-full text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Loading</h2>
            <p className="text-white/70">Please wait while we load your profile...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Use effect to navigate to login
    useEffect(() => {
      navigate("/login");
    }, [navigate]);
    
    // Show loading state while redirecting
    return (
      <PageLayout 
        activeTab="none" 
        pageTitle="Redirecting..."
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md shadow-xl border border-white/20 text-center">
            <p className="text-white mb-4">Please log in to continue...</p>
            <div className="animate-pulse bg-white/20 h-2 w-full rounded-full"></div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // If authenticated but no couple, show partner linking screen
  if (!couple) {
    // Check if they've completed the profile setup and explicitly skipped partner linking
    const hasSkippedPartnerLinking = localStorage.getItem("profile_setup_completed") === "true";
    
    // If they've explicitly chosen to skip, use the solo mode UI
    if (hasSkippedPartnerLinking) {
      // Create custom header content
      const headerContent = (
        <button 
          onClick={() => navigate("/partner-linking")}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium"
        >
          Find Partner
        </button>
      );
      
      return (
        <PageLayout 
          activeTab="home" 
          pageTitle="Home"
          headerContent={headerContent}
        >
          {/* User profile section */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-xl bg-purple-700/30 flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white/70" />
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{user?.displayName || "Solo User"}</h2>
              <div className="flex items-center">
                <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-0.5 rounded-full font-medium shadow-md">
                  Solo Mode
                </span>
              </div>
            </div>
          </div>
          
          {/* Info box about solo mode */}
          <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/10">
            <h3 className="text-white font-medium mb-2">Error Loading Dashboard</h3>
            <p className="text-white/80 text-sm">
              There was an error loading your dashboard data. You're currently in solo mode. Connect with a partner to unlock all BondQuest features and start strengthening your relationship together.
            </p>
            <button 
              onClick={() => navigate("/partner-linking")} 
              className="mt-3 w-full bg-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition-all"
            >
              Link with Partner
            </button>
          </div>
          
          {/* Placeholder Activities */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-500/90 to-blue-600/90 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-500/20 p-4">
              <h3 className="text-white font-medium">Available in Solo Mode</h3>
              <ul className="mt-3 text-white/80 space-y-2 text-sm">
                <li className="flex items-center justify-between p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>Relationship quizzes</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </li>
                <li className="flex items-center justify-between p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>AI Relationship Assistant</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </li>
                <li className="flex items-center justify-between p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <span className="mr-2">•</span>
                    <span>Daily check-ins</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </li>
              </ul>
            </div>
            
            {/* Quick Access Buttons */}
            <QuickAccessButtons 
              onAIAssistantClick={() => navigate("/ai-assistant")}
              onStartQuizClick={() => navigate("/quizzes")}
              onCheckInClick={handleCheckIn}
            />
          </div>
          
          {/* Dev tools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 border-t border-white/10 pt-4">
              <button 
                onClick={handleRestartApp}
                className="w-full p-2 bg-red-500/20 text-red-200 rounded-md text-sm hover:bg-red-500/30 transition-colors"
              >
                Reset App (Dev Only)
              </button>
            </div>
          )}
        </PageLayout>
      );
    }
    
    // Otherwise show the partner linking error screen
    return (
      <PageLayout 
        activeTab="none" 
        pageTitle="Connect Partner"
        hideHeader={true}
        maxWidth="md"
        className="flex flex-col items-center justify-center"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full shadow-xl border border-white/20 text-center mt-12">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Connect with Your Partner</h2>
            <p className="text-white/80 mb-6">To use BondQuest, you need to connect with your partner first.</p>
            <button 
              onClick={() => navigate("/partner-linking")} 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all mb-4"
            >
              Link with Partner
            </button>
            <button 
              onClick={() => {
                // Clear local storage and reload to start fresh
                localStorage.removeItem("bondquest_user");
                localStorage.removeItem("bondquest_couple");
                localStorage.removeItem("profile_setup_completed");
                window.location.href = "/";
              }} 
              className="w-full bg-gray-600/50 text-white font-medium py-2 px-4 rounded-xl border border-white/20"
            >
              Start Over
            </button>
          </div>
          
          <p className="text-white/60 text-sm">
            BondQuest is designed for couples. You can also <button onClick={() => {
              localStorage.setItem("profile_setup_completed", "true");
              window.location.reload();
            }} className="text-white underline">use solo mode</button> for now.
          </p>
        </div>
      </PageLayout>
    );
  }
  
  const displayName = data ? `${data.user1.displayName} & ${data.user2.displayName}` : "Your Relationship";
  const bondStrength = data?.couple.bondStrength || 0;
  const level = data?.couple.level || 1;
  const xp = data?.couple.xp || 0;

  // Handle the error state
  if (error) {
    const headerContent = (
      <button 
        onClick={handleRestartApp}
        className="p-2 bg-white/10 rounded-md text-white text-sm backdrop-blur-sm border border-white/10"
      >
        Back to Start
      </button>
    );
    
    return (
      <PageLayout 
        activeTab="home" 
        pageTitle="Dashboard Error"
        headerContent={headerContent}
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full shadow-xl border border-white/20 text-center mt-6 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Failed to Load Dashboard</h2>
          <p className="text-white/80 mb-6">
            There was an error loading your dashboard data. Please try again later or contact support if the problem persists.
          </p>
          
          <div className="mt-4 space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all mb-2"
            >
              Retry
            </button>
            
            <button 
              onClick={handleRestartApp}
              className="w-full bg-gray-600/50 text-white font-medium py-2 px-4 rounded-xl border border-white/20"
            >
              Start Over
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // Loading state when we're waiting for data
  if (isLoading || !data) {
    return (
      <PageLayout 
        activeTab="home" 
        pageTitle="Loading..."
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md shadow-xl border border-white/20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 animate-spin">
              <svg className="w-full h-full text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Loading Dashboard</h2>
            <p className="text-white/70">Please wait while we load your data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // Main view when data is loaded
  // Create custom header content for the coupled version
  const headerContent = (
    <button className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm shadow-lg border border-white/10">
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
      </svg>
    </button>
  );
  
  return (
    <PageLayout 
      activeTab="home" 
      pageTitle={displayName}
      headerContent={headerContent}
    >
      {/* User profile section */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-xl bg-purple-700/30 flex items-center justify-center">
          {data?.user1?.avatar ? (
            <img 
              src={data.user1.avatar} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-white/70" />
          )}
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">{displayName}</h2>
          <div className="flex items-center">
            <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-2 py-0.5 rounded-full font-medium shadow-md">
              Level {level}
            </span>
            <span className="text-xs text-white/80 ml-2">{xp} XP</span>
          </div>
        </div>
      </div>
      
      {/* Bond Strength Meter */}
      <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-medium">Bond Strength</span>
          <span className="text-white text-xl font-bold">{bondStrength}%</span>
        </div>
        <div className="h-3 bg-purple-900/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full"
            style={{ width: `${bondStrength}%` }}
          ></div>
        </div>
      </div>
      
      {/* Bond Assessment Card */}
      <div 
        className="relative p-5 bg-gradient-to-br from-blue-500/90 to-violet-600/90 backdrop-blur-md rounded-2xl shadow-xl border border-blue-500/20 mb-6"
        onClick={() => navigate('/bond-assessment')}
      >
        <div className="absolute right-4 top-4 w-12 h-12 opacity-50">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2"/>
            <path d="M12 8V16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="text-white text-sm font-medium mb-1">Relationship Assessment</h3>
        <h2 className="text-white text-xl font-bold mb-1">Bond Dimensions</h2>
        <p className="text-white/80 text-sm mb-3">
          Assess and visualize the strength of your relationship across 10 key dimensions
        </p>
        <div className="flex justify-end">
          <button className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
            ASSESS NOW
          </button>
        </div>
      </div>
      
      {/* Daily Challenge Card */}
      <div 
        className="relative p-5 bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-md rounded-2xl shadow-xl border border-pink-500/20 mb-6"
        onClick={() => data?.dailyQuiz && navigate(`/quizzes/${data.dailyQuiz.id}`)}
      >
        <div className="absolute right-4 top-4 w-12 h-12 opacity-50">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21L12 21C16.9706 21 21 16.9706 21 12V12C21 7.02944 16.9706 3 12 3V3C7.02944 3 3 7.02944 3 12V12C3 16.9706 7.02944 21 12 21Z" stroke="white" strokeWidth="2"/>
            <path d="M3.6 8.5H20.4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3.6 15.5H20.4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 20.4V3.6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8.5 3.6V20.4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15.5 3.6V20.4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="text-white text-sm font-medium mb-1">Daily Challenge</h3>
        <h2 className="text-white text-xl font-bold mb-1">
          {data?.dailyQuiz?.title || "Today's Quiz"}
        </h2>
        <p className="text-white/80 text-sm mb-3">
          {data?.dailyQuiz?.description || "How Well Do You Know Me?"}
        </p>
        <div className="flex items-center justify-between">
          <div className="bg-white/20 rounded-full px-3 py-1 text-xs text-white font-medium">
            03:21:45
          </div>
          <button className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
            START
          </button>
        </div>
      </div>
      
      {/* Upcoming Competition Card */}
      <div className="bg-gradient-to-br from-indigo-500/90 to-blue-600/90 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-500/20 mb-6 p-4">
        <h3 className="text-white font-medium">Upcoming Competition</h3>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white">April 25</p>
              <p className="text-white/70 text-xs">Entry Fee</p>
            </div>
            <div>
              <p className="text-white flex items-center">
                <span className="text-yellow-300 mr-1">•</span> 50
              </p>
              <p className="text-white/70 text-xs">Current Ranking</p>
            </div>
            <div>
              <p className="text-white">#12</p>
            </div>
          </div>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full shadow-md">
            Join
          </button>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-white mb-4">Recent Activity</h3>
        
        {/* Activity Cards */}
        <div className="space-y-3">
          {data?.recentActivities && data?.recentActivities.length > 0 ? (
            data?.recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 flex items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white mr-3 shadow-md">
                  {activity.type === 'quiz' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                  {activity.type === 'check_in' && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="text-white font-medium">
                    {activity.type === 'quiz' ? 'Completed a quiz' : 'Daily check-in'}
                  </h4>
                  <p className="text-gray-300 text-sm flex items-center">
                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                    {activity.points && (
                      <span className="ml-2 bg-yellow-400/90 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-medium">
                        +{activity.points} pts
                      </span>
                    )}
                  </p>
                </div>
                <div className="ml-auto">
                  <button className="text-purple-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-white/70 bg-white/5 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/10">
              <p>No activities yet. Start a quiz to see your activities here!</p>
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
    </PageLayout>
  );
}