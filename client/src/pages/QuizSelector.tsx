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
  { id: "daily_habits", name: "Morning Routines" }
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
    <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--app-background)' }}>
      {/* Category Tabs */}
      <div className="px-4 pt-6 pb-4">
        <CategoryTabs 
          categories={CATEGORIES} 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>
      
      {/* Quiz Cards */}
      <div className="px-4 space-y-4 pb-20">
        {isLoading ? (
          // Loading state
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-5 shadow-lg bg-purple-300 animate-pulse h-32"></div>
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
              <div className="text-center py-8 text-white">
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
