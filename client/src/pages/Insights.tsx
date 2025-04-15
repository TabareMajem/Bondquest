import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "../components/layout/BottomNavigation";
import { useAuth } from "../contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

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

  return (
    <div className="min-h-screen w-full bg-gray-50 pt-12 pb-20">
      {/* Header */}
      <div className="px-6 mb-6">
        <h1 className="text-2xl font-bold font-poppins text-gray-800 mb-2">Relationship Insights</h1>
        <p className="text-gray-500">Discover patterns and strengthen your bond</p>
      </div>
      
      {/* Bond Strength Overview */}
      <div className="px-6 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Bond Strength</h2>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#f3e8ff" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#a855f7" 
                  strokeWidth="10" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * (data?.couple?.bondStrength || 0) / 100)}
                  transform="rotate(-90 50 50)" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{data?.couple?.bondStrength || 0}%</span>
              </div>
            </div>
          </div>
          
          <p className="text-center text-gray-600 text-sm">
            Your bond strength has {(data?.couple?.bondStrength || 0) > 70 ? "improved" : "decreased"} by 
            <span className="font-semibold"> 5%</span> in the last 30 days
          </p>
        </div>
      </div>
      
      {/* Relationship Strengths */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Strengths & Growth Zones</h2>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
          {strengths.map((strength) => (
            <div key={strength.name}>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">{strength.name}</span>
                <span className="text-gray-500">{strength.value}%</span>
              </div>
              <Progress value={strength.value} className="h-2" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Insights */}
      <div className="px-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Insights</h2>
        
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start">
              <div className="bg-primary-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Quality Time Boost</h3>
                <p className="text-gray-600 text-sm">You've been spending more quality time together. This has improved your bond strength by 8%.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Communication Opportunity</h3>
                <p className="text-gray-600 text-sm">Your communication score has dropped slightly. Try the "Daily Check-In" challenge this week.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-1">Quiz Champion</h3>
                <p className="text-gray-600 text-sm">You've completed 5 quizzes this month - more than 80% of other couples!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="insights" />
    </div>
  );
}
