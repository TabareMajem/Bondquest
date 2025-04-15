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

  // Redirect to onboarding if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: [couple ? `/api/couples/${couple.id}/dashboard` : null],
    enabled: !!couple,
  });

  if (!user || !couple) {
    return null;
  }

  const displayName = data ? `${data.user1.displayName} & ${data.user2.displayName}` : "Your Relationship";
  const bondStrength = data?.couple.bondStrength || 0;
  const level = data?.couple.level || 1;
  const xp = data?.couple.xp || 0;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header with gradient background */}
      <div 
        className="w-full rounded-b-3xl px-6 pt-12 pb-6 relative"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
              <img 
                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-white font-semibold">{displayName}</h2>
              <div className="flex items-center">
                <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-medium">
                  Level {level}
                </span>
                <span className="text-xs text-white opacity-80 ml-2">{xp} XP</span>
              </div>
            </div>
          </div>
          
          <button className="p-2 rounded-full bg-white bg-opacity-20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </button>
        </div>
        
        {/* Bond Strength Meter */}
        <BondStrengthMeter percentage={bondStrength} />
        
        {/* Daily Challenge Card */}
        <DailyQuizCard 
          quiz={data?.dailyQuiz} 
          isLoading={isLoading} 
          onClick={() => data?.dailyQuiz && navigate(`/quizzes/${data.dailyQuiz.id}`)}
        />
      </div>
      
      {/* Recent Activity */}
      <div className="px-6 pt-14 pb-20">
        <h3 className="font-semibold text-lg text-gray-800 mb-3">Recent Activity</h3>
        
        {isLoading ? (
          // Loading state
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center">
                  <div className="bg-gray-200 w-10 h-10 rounded-lg mr-3"></div>
                  <div className="flex-grow">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            Failed to load activities
          </div>
        ) : (
          // Render activities
          <div className="space-y-3">
            {data?.recentActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
            
            {data?.recentActivities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
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
        onCheckInClick={() => console.log("Check-in clicked")}
      />
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />
    </div>
  );
}
