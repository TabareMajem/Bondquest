import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Activity, QuizSession } from "@shared/schema";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

interface QuizResultsProps {
  quizId: number;
  sessionId: number;
  matchPercentage: number;
  pointsEarned: number;
}

export default function QuizResults({ 
  quizId, 
  sessionId, 
  matchPercentage, 
  pointsEarned 
}: QuizResultsProps) {
  const [, navigate] = useLocation();
  const { couple, user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false);
  
  // Fetch quiz session to check completion status
  const { data: session } = useQuery<QuizSession>({
    queryKey: [`/api/quiz-sessions/${sessionId}`],
    refetchInterval: isWaitingForPartner ? 5000 : false, // Poll every 5 seconds if waiting for partner
  });
  
  // Fetch related activities to get AI insights
  const { data: activities } = useQuery<Activity[]>({
    queryKey: [couple ? `/api/couples/${couple.id}/activities` : null],
    enabled: !!couple,
  });
  
  // Determine if waiting for partner
  useEffect(() => {
    if (session && user) {
      const isUser1 = couple?.userId1 === user.id;
      const isUser2 = couple?.userId2 === user.id;
      
      setQuizSession(session);
      
      // Check if current user completed but partner hasn't
      if (
        (isUser1 && session.user1Completed && !session.user2Completed) ||
        (isUser2 && session.user2Completed && !session.user1Completed)
      ) {
        setIsWaitingForPartner(true);
      } else {
        setIsWaitingForPartner(false);
      }
    }
  }, [session, user, couple]);
  
  // Extract AI insights from activities
  useEffect(() => {
    if (activities) {
      const quizActivity = activities.find(
        activity => activity.type === "quiz" && activity.referenceId === sessionId
      );
      
      if (quizActivity && quizActivity.description) {
        setAiInsight(quizActivity.description);
      }
    }
  }, [activities, sessionId]);
  
  // Animation effect for percentage display
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Return to home screen
  const handleContinue = () => {
    navigate("/home");
  };
  
  // If waiting for partner, show waiting screen
  if (isWaitingForPartner) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-gray-600">Waiting for your partner to finish...</p>
          </div>
          
          {/* Waiting Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-dashed rounded-full border-purple-400 animate-spin-slow"></div>
              <div className="text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-3">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  <span className="text-purple-600 font-semibold">Your answers submitted</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-8">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white text-xs">📱</span>
              </div>
              <div>
                <h3 className="text-primary-800 font-medium mb-1">What happens now?</h3>
                <p className="text-primary-700 text-sm">
                  Your answers have been saved! Once your partner completes their part, 
                  you'll both see how well your answers match and earn points together.
                </p>
              </div>
            </div>
          </div>
          
          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Regular completed quiz screen (both partners finished)
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Quiz Results</h1>
          <p className="text-gray-600">See how well you did together!</p>
        </div>
        
        {/* Match Percentage Circle */}
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#e6e6e6" 
                strokeWidth="8"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="45"
                fill="none"
                stroke="#8a65ff"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${isAnimating ? 0 : matchPercentage * 2.83} 283`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
                className="transition-all duration-1500 ease-out"
              />
            </svg>
            <div className="text-center">
              <span className="text-4xl font-bold">{isAnimating ? '0' : matchPercentage}%</span>
              <p className="text-sm text-gray-500">Match</p>
            </div>
          </div>
        </div>
        
        {/* Points Earned */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Points Earned</span>
            <span className="text-primary-600 font-bold text-xl">+{pointsEarned} XP</span>
          </div>
        </div>
        
        {/* AI Insights */}
        {aiInsight && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-8">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white text-xs">🤖</span>
              </div>
              <div>
                <h3 className="text-primary-800 font-medium mb-1">Relationship Insight</h3>
                <p className="text-primary-700 text-sm">{aiInsight}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
}