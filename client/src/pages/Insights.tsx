import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import PageLayout from "../components/layout/PageLayout";

export default function Insights() {
  const [, navigate] = useLocation();
  const { user, couple } = useAuth();

  // Redirect to onboarding if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch insights data (in a real app, this would have its own endpoint)
  const { data, isLoading } = useQuery({
    queryKey: [couple ? `/api/couples/${couple?.id}/dashboard` : null],
    enabled: !!couple,
  });

  const strengths = [
    { name: "Communication", value: 72 },
    { name: "Quality Time", value: 85 },
    { name: "Conflict Resolution", value: 64 },
    { name: "Shared Goals", value: 79 }
  ];

  // Additional dimensions data for desktop view
  const dimensions = [
    { name: "Communication", value: 72, description: "How effectively you share thoughts and feelings" },
    { name: "Trust", value: 85, description: "The level of security and reliability in your relationship" },
    { name: "Emotional Intimacy", value: 64, description: "Your emotional connection and vulnerability" },
    { name: "Conflict Resolution", value: 79, description: "How well you resolve disagreements" },
    { name: "Quality Time", value: 88, description: "Meaningful time spent together" },
    { name: "Shared Goals", value: 76, description: "Alignment on future plans and aspirations" },
    { name: "Appreciation", value: 82, description: "How you express gratitude and recognition" },
    { name: "Support", value: 91, description: "How you help each other through challenges" }
  ];

  // Activity data for desktop view
  const activities = [
    { type: "quiz", name: "How Well Do You Know Me?", date: "2 days ago", score: 85 },
    { type: "checkin", name: "Daily Check-in", date: "Yesterday", streak: 7 },
    { type: "assessment", name: "Bond Assessment", date: "Last week", improvement: 5 }
  ];

  // Monthly bond strength history for chart (desktop)
  const monthlyData = [
    { month: "Jan", value: 65 },
    { month: "Feb", value: 68 },
    { month: "Mar", value: 72 },
    { month: "Apr", value: 70 },
    { month: "May", value: 75 },
    { month: "Jun", value: 78 }
  ];

  return (
    <PageLayout
      activeTab="insights"
      pageTitle="Relationship Insights"
      maxWidth="xl"
    >
      {/* Desktop View Description - Hidden on Mobile */}
      <div className="hidden lg:block mb-6">
        <p className="text-white mb-4">
          Explore your relationship data and discover patterns to help strengthen your bond.
          We analyze your interactions, quiz results, and check-ins to provide personalized insights.
        </p>
      </div>
      
      {/* Main Content */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Bond Strength Overview - Takes full width on mobile, 1/3 on desktop */}
        <div className="mb-8 lg:mb-0">
          <div className="bg-purple-900/20 rounded-xl p-5 shadow-lg border border-purple-700/30">
            <h2 className="text-lg font-semibold text-white mb-4">Bond Strength</h2>
            
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#4c1d95" 
                    strokeWidth="10" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#8b5cf6" 
                    strokeWidth="10" 
                    strokeDasharray="283" 
                    strokeDashoffset={283 - (283 * (data?.couple?.bondStrength || 0) / 100)}
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl lg:text-4xl font-bold text-white">{data?.couple?.bondStrength || 0}%</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-purple-200 text-sm lg:text-base">
              Your bond strength has {(data?.couple?.bondStrength || 0) > 70 ? "improved" : "decreased"} by 
              <span className="font-semibold"> 5%</span> in the last 30 days
            </p>

            {/* Desktop Only - Historical Chart */}
            <div className="hidden lg:block mt-6 pt-4 border-t border-purple-700/30">
              <h3 className="text-sm font-medium text-purple-300 mb-3">6-Month History</h3>
              <div className="h-24 flex items-end justify-between">
                {monthlyData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-6 bg-gradient-to-t from-purple-700/60 to-purple-500/80 rounded-t-sm" 
                      style={{ height: `${item.value * 0.28}px` }}
                    ></div>
                    <span className="text-xs text-purple-300 mt-1">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Relationship Strengths - Takes full width on mobile, 2/3 on desktop */}
        <div className="mb-8 lg:mb-0 lg:col-span-2">
          <div className="bg-purple-900/20 rounded-xl p-5 shadow-lg border border-purple-700/30">
            <h2 className="text-lg font-semibold text-white mb-4">Your Strengths & Growth Zones</h2>
            
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              {strengths.map((strength) => (
                <div key={strength.name} className="lg:mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-white">{strength.name}</span>
                    <span className="text-purple-300">{strength.value}%</span>
                  </div>
                  <Progress value={strength.value} className="h-2" />
                </div>
              ))}
            </div>

            {/* Desktop Only - Action Button */}
            <div className="hidden lg:flex justify-end mt-4">
              <button className="bg-purple-700/40 hover:bg-purple-700/60 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                View Complete Assessment
              </button>
            </div>
          </div>
        </div>
        
        {/* Recent Insights - Takes full width on mobile, full width on desktop but with 3-column layout */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Insights</h2>
          
          <div className="space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
            <div className="bg-purple-900/20 rounded-xl p-4 shadow-lg border border-purple-700/30">
              <div className="flex items-start">
                <div className="bg-purple-700/40 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Quality Time Boost</h3>
                  <p className="text-purple-200 text-sm">You've been spending more quality time together. This has improved your bond strength by 8%.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/20 rounded-xl p-4 shadow-lg border border-purple-700/30">
              <div className="flex items-start">
                <div className="bg-red-800/40 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Communication Opportunity</h3>
                  <p className="text-purple-200 text-sm">Your communication score has dropped slightly. Try the "Daily Check-In" challenge this week.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/20 rounded-xl p-4 shadow-lg border border-purple-700/30">
              <div className="flex items-start">
                <div className="bg-green-800/40 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Quiz Champion</h3>
                  <p className="text-purple-200 text-sm">You've completed 5 quizzes this month - more than 80% of other couples!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Only - Additional Sections */}
        <div className="hidden lg:block lg:col-span-2 mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">All Bond Dimensions</h2>
          <div className="bg-purple-900/20 rounded-xl p-5 shadow-lg border border-purple-700/30">
            <div className="grid grid-cols-2 gap-5">
              {dimensions.map((dimension, index) => (
                <div key={index} className="border-b border-purple-700/30 pb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-white">{dimension.name}</span>
                    <span className="text-purple-300">{dimension.value}%</span>
                  </div>
                  <Progress value={dimension.value} className="h-2 mb-2" />
                  <p className="text-purple-200 text-xs">{dimension.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Desktop Only - Recent Activity List */}
        <div className="hidden lg:block lg:col-span-1 mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Activity</h2>
          <div className="bg-purple-900/20 rounded-xl p-5 shadow-lg border border-purple-700/30">
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="border-b border-purple-700/30 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center">
                    <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
                      activity.type === 'quiz' 
                        ? 'bg-blue-600/40' 
                        : activity.type === 'checkin' 
                        ? 'bg-green-600/40' 
                        : 'bg-purple-600/40'
                    }`}>
                      <span className="text-white text-sm">
                        {activity.type === 'quiz' ? '🎮' : activity.type === 'checkin' ? '✓' : '📊'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm">{activity.name}</h3>
                      <div className="flex text-xs text-purple-300">
                        <span>{activity.date}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {activity.score ? `${activity.score}% score` : 
                           activity.streak ? `${activity.streak} day streak` : 
                           activity.improvement ? `+${activity.improvement}% improvement` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
