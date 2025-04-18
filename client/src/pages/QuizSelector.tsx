import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CategoryTabs from "../components/ui/CategoryTabs";
import QuizCard from "../components/quiz/QuizCard";
import { useAuth } from "../contexts/AuthContext";
import { Quiz } from "@shared/schema";
import PageLayout from "../components/layout/PageLayout";

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

  const handleQuizSelect = (quizId: number) => {
    navigate(`/quizzes/${quizId}`);
  };

  return (
    <PageLayout 
      activeTab="play" 
      pageTitle="Relationship Quizzes"
      maxWidth="xl"
    >
      {/* Category Tabs */}
      <div className="mb-6">
        <CategoryTabs 
          categories={CATEGORIES} 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>
      
      {/* Desktop intro section */}
      <div className="hidden lg:block mb-8">
        <div className="bg-gradient-to-r from-purple-700/30 to-fuchsia-700/30 backdrop-blur-sm rounded-xl p-6 border border-purple-600/20">
          <h2 className="text-2xl font-bold text-white mb-3">Strengthen Your Bond Through Play</h2>
          <p className="text-purple-100">
            Choose from a variety of relationship quizzes designed to deepen your connection and create memorable moments together.
            Each category offers unique challenges and insights into your relationship.
          </p>
        </div>
      </div>
      
      {/* Quiz Cards - Grid layout for desktop */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
        {isLoading ? (
          // Loading state - Responsive grid
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 shadow-lg bg-purple-300/40 animate-pulse h-32 mb-4 lg:mb-0"></div>
            ))}
          </>
        ) : error ? (
          // Error state
          <div className="bg-red-50 text-red-500 p-4 rounded-lg col-span-full">
            Failed to load quizzes
          </div>
        ) : (
          // Quiz cards - Grid layout adapts to screen size
          <>
            {quizzes?.map((quiz) => (
              <QuizCard 
                key={quiz.id} 
                quiz={quiz}
                onClick={() => handleQuizSelect(quiz.id)}
              />
            ))}
            
            {quizzes?.length === 0 && (
              <div className="text-center py-8 text-white col-span-full">
                <p>No quizzes available in this category yet.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Desktop: Suggested quizzes section at bottom */}
      {!isLoading && !error && quizzes?.length > 0 && (
        <div className="hidden lg:block mt-12">
          <h3 className="text-xl font-semibold text-white mb-4">Recommended For You</h3>
          <div className="grid grid-cols-3 gap-4">
            {quizzes.slice(0, 3).map((quiz) => (
              <div 
                key={`rec-${quiz.id}`}
                className="bg-purple-800/30 rounded-lg p-4 border border-purple-700/30 hover:bg-purple-700/40 transition cursor-pointer"
                onClick={() => handleQuizSelect(quiz.id)}
              >
                <h4 className="font-medium text-white">{quiz.title}</h4>
                <p className="text-sm text-purple-300 mt-1">Boost your relationship score</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
