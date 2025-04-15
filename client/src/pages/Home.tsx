import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "../components/layout/BottomNavigation";
import BondStrengthMeter from "../components/dashboard/BondStrengthMeter";
import DailyQuizCard from "../components/dashboard/DailyQuizCard";
import ActivityCard from "../components/dashboard/ActivityCard";
import QuickAccessButtons from "../components/ui/QuickAccessButtons";
import { useAuth } from "../contexts/AuthContext";
import { Quiz, Activity } from "@shared/schema";
import { get } from "@/lib/apiClient";

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
  const { user, couple } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  // Automatically create a test user and couple for development
  useEffect(() => {
    const createTestUser = async () => {
      if (!user && !localStorage.getItem("bondquest_user")) {
        try {
          // Create test user
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: "testuser1",
              password: "password123",
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("bondquest_user", JSON.stringify(data.user));
            if (data.couple) {
              localStorage.setItem("bondquest_couple", JSON.stringify(data.couple));
            }
            
            // Reload the page to update auth context
            window.location.reload();
          }
        } catch (error) {
          console.error("Failed to create test user:", error);
        }
      }
    };
    
    createTestUser();
  }, [user]);

  // Redirect to onboarding if no user is logged in
  useEffect(() => {
    if (!user && !localStorage.getItem("bondquest_user")) {
      navigate("/");
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

  // Use sample couple data if none exists
  useEffect(() => {
    if (!couple && localStorage.getItem("bondquest_user") && !localStorage.getItem("bondquest_couple")) {
      const sampleCouple = {
        id: 1,
        userId1: 1,
        userId2: 2,
        bondStrength: 50,
        level: 1,
        xp: 0,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("bondquest_couple", JSON.stringify(sampleCouple));
      window.location.reload();
    }
  }, [couple]);

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
  
  // If user exists but no couple is linked, show partner linking screen
  if (user && !couple) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900 p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-xl border border-white/20 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Connect with Your Partner</h2>
            <p className="text-white/80 mb-6">To use BondQuest, you need to connect with your partner first.</p>
            <button 
              onClick={() => navigate("/partner-linking")} 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Link with Partner
            </button>
          </div>
          
          <p className="text-white/60 text-sm">
            BondQuest is designed for couples. Connect with your partner to access all features and start strengthening your relationship.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Dashboard data fetch error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-sm">
          <h2 className="text-red-500 text-lg font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">Unable to load your relationship data. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="ml-2 text-gray-500 text-sm underline"
          >
            {showDebug ? "Hide Details" : "Show Details"}
          </button>
          {showDebug && (
            <pre className="mt-4 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  const displayName = data ? `${data.user1.displayName} & ${data.user2.displayName}` : "Your Relationship";
  const bondStrength = data?.couple.bondStrength || 0;
  const level = data?.couple.level || 1;
  const xp = data?.couple.xp || 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900">
      {/* Header with gradient background */}
      <div 
        className="w-full px-6 pt-12 pb-6 relative"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-xl">
              <img 
                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
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
          
          <button className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm shadow-lg border border-white/10">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </button>
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
      </div>
      
      {/* Recent Activity */}
      <div className="px-6 pt-4 pb-24">
        <h3 className="font-semibold text-lg text-white mb-4">Recent Activity</h3>
        
        {isLoading ? (
          // Loading state
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/10 animate-pulse">
                <div className="flex items-center">
                  <div className="bg-purple-700/50 w-12 h-12 rounded-lg mr-3"></div>
                  <div className="flex-grow">
                    <div className="h-4 bg-purple-700/50 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-purple-700/50 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="bg-red-900/30 text-red-200 p-4 rounded-lg border border-red-500/30">
            Failed to load activities
          </div>
        ) : (
          // Activity Cards
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
        )}
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
