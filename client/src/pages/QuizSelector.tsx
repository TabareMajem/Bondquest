import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CategoryTabs from "../components/ui/CategoryTabs";
import QuizCard from "../components/quiz/QuizCard";
import { useAuth } from "../contexts/AuthContext";
import { Quiz } from "@shared/schema";
import PageLayout from "../components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

const CATEGORIES = [
  { id: "couple_vs_couple", name: "Couple vs. Couple" },
  { id: "partner_vs_partner", name: "Partner vs. Partner" },
  { id: "memory_lane", name: "Memory Lane" },
  { id: "daily_habits", name: "Morning Routines" }
];

export default function QuizSelector() {
  const [, navigate] = useLocation();
  const { user, couple, createMockCouple } = useAuth();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [authError, setAuthError] = useState(false);

  // Redirect to onboarding if no user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Handle case where user is logged in but doesn't have a couple
  useEffect(() => {
    if (user && !couple && !authError) {
      // Create a mock couple for testing if needed
      console.log("No couple found, creating mock couple for testing");
      createMockCouple();
    }
  }, [user, couple, createMockCouple, authError]);

  // Use a more permissive query pattern that won't throw on 401
  const { data: quizzes, isLoading, error, refetch } = useQuery<Quiz[]>({
    queryKey: [activeCategory ? `/api/quizzes/category/${activeCategory}` : "/api/quizzes"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && !!couple,
    retry: 1,
    onSuccess: () => {
      setAuthError(false);
    },
    onSettled: (_, error) => {
      if (error) {
        setAuthError(true);
      }
    }
  });

  const handleQuizSelect = (quizId: number) => {
    navigate(`/quizzes/${quizId}`);
  };
  
  const handleRetry = () => {
    setAuthError(false);
    refetch();
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
        ) : error || authError ? (
          // Error state with retry option
          <div className="bg-red-50 text-red-500 p-6 rounded-lg col-span-full flex flex-col items-center">
            <AlertCircle className="h-12 w-12 mb-3 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Failed to load quizzes</h3>
            <p className="text-sm text-red-700 mb-4 text-center">
              There was a problem loading the quizzes. This could be due to an authentication issue.
            </p>
            <Button 
              onClick={handleRetry} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
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
