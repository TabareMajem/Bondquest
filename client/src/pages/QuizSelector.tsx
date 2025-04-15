import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CategoryTabs from "../components/ui/CategoryTabs";
import QuizCard from "../components/quiz/QuizCard";
import BottomNavigation from "../components/layout/BottomNavigation";
import { useAuth } from "../contexts/AuthContext";
import { Quiz } from "@shared/schema";

const CATEGORIES = [
  { id: "couple_vs_couple", name: "Couple vs. Couple" },
  { id: "partner_vs_partner", name: "Partner vs. Partner" },
  { id: "memory_lane", name: "Memory Lane" },
  { id: "daily_habits", name: "Daily Habits" }
];

export default function QuizSelector() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  // Redirect to onboarding if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const { data: quizzes, isLoading, error } = useQuery<Quiz[]>({
    queryKey: [activeCategory ? `/api/quizzes/category/${activeCategory}` : "/api/quizzes"],
  });

  const handleBackClick = () => {
    navigate("/home");
  };

  const handleQuizSelect = (quizId: number) => {
    navigate(`/quizzes/${quizId}`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 pt-12 pb-20">
      {/* Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center mb-4">
          <button onClick={handleBackClick} className="mr-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 className="text-2xl font-bold font-poppins text-gray-800">Activities</h1>
        </div>
        
        {/* Category Tabs */}
        <CategoryTabs 
          categories={CATEGORIES} 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>
      
      {/* Quiz Cards */}
      <div className="px-6 space-y-4">
        {isLoading ? (
          // Loading state
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-5 shadow-lg bg-gray-200 animate-pulse h-32"></div>
            ))}
          </>
        ) : error ? (
          // Error state
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            Failed to load quizzes
          </div>
        ) : (
          // Quiz cards
          <>
            {quizzes?.map((quiz) => (
              <QuizCard 
                key={quiz.id} 
                quiz={quiz}
                onClick={() => handleQuizSelect(quiz.id)}
              />
            ))}
            
            {quizzes?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No quizzes available in this category yet.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab="play" />
    </div>
  );
}
