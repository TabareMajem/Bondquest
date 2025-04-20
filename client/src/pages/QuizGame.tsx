import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "../contexts/AuthContext";
import { useQuiz } from "../hooks/useQuiz";
import QuizResults from "../components/quiz/QuizResults";
import { Quiz, Question } from "@shared/schema";
import GameEngine, { GameFormat } from "../components/quiz/GameEngine";
import { motion } from "framer-motion";

interface QuizData {
  quiz: Quiz;
  questions: Question[];
}

export default function QuizGame() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, couple } = useAuth();
  const { toast } = useToast();
  const quizId = id ? parseInt(id) : NaN;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSessionId, setQuizSessionId] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [lastAnsweredAt, setLastAnsweredAt] = useState<number | null>(null);
  
  // Game format for each question
  const [gameFormat, setGameFormat] = useState<GameFormat>('standard');
  
  // Animation states
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false);
  
  // Fetch quiz data
  const { data, isLoading, error } = useQuery<QuizData>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !isNaN(quizId),
  });

  // Initialize quiz session
  const initSessionMutation = useMutation({
    mutationFn: async () => {
      if (!couple) throw new Error("No couple found");
      
      const response = await apiRequest("POST", "/api/quiz-sessions", {
        coupleId: couple.id,
        quizId,
        user1Answers: {},
        user2Answers: {},
        completed: false
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQuizSessionId(data.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to initialize quiz: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // State for quiz completion
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    matchPercentage: number;
    pointsEarned: number;
  }>({ matchPercentage: 0, pointsEarned: 0 });
  
  // Complete user's portion of quiz session
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!quizSessionId || !user) throw new Error("No quiz session or user found");
      
      const response = await apiRequest("PATCH", `/api/quiz-sessions/${quizSessionId}/user/${user.id}`, {
        answers: answers,
        pointsEarned: totalPoints, // Pass the points earned from the mini-games
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate dashboard data to reflect new activity
      if (couple) {
        queryClient.invalidateQueries({ queryKey: [`/api/couples/${couple.id}/dashboard`] });
        queryClient.invalidateQueries({ queryKey: [`/api/couples/${couple.id}/activities`] });
      }
      
      // Check if the quiz is fully completed (both users have completed)
      const isFullyCompleted = data.completed;
      
      if (isFullyCompleted && data.matchPercentage) {
        // Set quiz as completed and store results
        setQuizResults({
          matchPercentage: data.matchPercentage,
          pointsEarned: totalPoints + (data.bonusPoints || 0)
        });
        setQuizCompleted(true);
        
        toast({
          title: "Quiz completed!",
          description: `You both finished! You earned ${totalPoints + (data.bonusPoints || 0)} points.`,
        });
      } else {
        // Show message that user completed their part but waiting for partner
        setQuizCompleted(true);
        
        toast({
          title: "Your part completed!",
          description: "Now waiting for your partner to complete their part.",
        });
        
        // Store placeholder results for the waiting screen
        setQuizResults({
          matchPercentage: 0,
          pointsEarned: totalPoints
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to complete quiz: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Initialize session on component mount
  useEffect(() => {
    if (couple && !quizSessionId && !initSessionMutation.isPending) {
      initSessionMutation.mutate();
    }
  }, [couple, quizSessionId, initSessionMutation]);

  // Determine game format for the current question
  useEffect(() => {
    if (data && data.questions && data.questions.length > 0) {
      // Every 5th question is a lightning round
      if ((currentQuestionIndex + 1) % 5 === 0) {
        setGameFormat('speed');
      }
      // Every 3rd question is a memory game
      else if ((currentQuestionIndex + 1) % 3 === 0) {
        setGameFormat('memory');
      }
      // Every 4th question is a drag & drop
      else if ((currentQuestionIndex + 1) % 4 === 0) {
        setGameFormat('drag');
      }
      // Every 7th question is a reflex test
      else if ((currentQuestionIndex + 1) % 7 === 0) {
        setGameFormat('reflex');
      }
      // Otherwise use standard format
      else {
        setGameFormat('standard');
      }
    }
  }, [currentQuestionIndex, data]);

  // Handle exiting the quiz
  const handleExit = () => {
    navigate("/quizzes");
  };

  // Handle answer submission from game components
  const handleAnswerSubmit = (answer: string, points: number) => {
    // Show correct animation briefly
    setShowCorrectAnimation(true);
    setTimeout(() => setShowCorrectAnimation(false), 1000);
    
    // Save the answer
    if (currentQuestion) {
      const questionId = currentQuestion.id.toString();
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    }
    
    // Update total points
    setTotalPoints(prev => prev + points);
    
    // Update combo streak based on answer timing
    const now = Date.now();
    if (lastAnsweredAt && now - lastAnsweredAt < 5000) {
      // If answered within 5 seconds of last question, increase streak
      setComboStreak(prev => prev + 1);
    } else {
      // Reset streak if took too long
      setComboStreak(1);
    }
    setLastAnsweredAt(now);
    
    // Start transition animation
    setQuestionTransition(true);
    setTimeout(() => {
      // Move to next question or complete the quiz
      if (data && currentQuestionIndex < data.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTransition(false);
      } else {
        // Complete the quiz
        completeSessionMutation.mutate();
      }
    }, 500);
  };

  // Calculate progress percentage
  const progressPercentage = data 
    ? ((currentQuestionIndex + 1) / data.questions.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 pt-12 pb-20 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full bg-gray-50 pt-12 pb-20 flex flex-col items-center justify-center px-6">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg max-w-md w-full mb-4">
          Failed to load quiz
        </div>
        <button
          onClick={() => navigate("/quizzes")}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const currentQuestion = data?.questions?.[currentQuestionIndex];

  // Show results screen if quiz is completed
  if (quizCompleted && quizSessionId && data) {
    return (
      <QuizResults
        quizId={quizId}
        sessionId={quizSessionId}
        matchPercentage={quizResults.matchPercentage}
        pointsEarned={quizResults.pointsEarned}
      />
    );
  }
  
  // Format-specific labels and messages
  const getFormatInfo = () => {
    switch (gameFormat) {
      case 'speed':
        return {
          title: "⚡ LIGHTNING ROUND ⚡",
          subtitle: "Answer quickly for bonus points!",
          className: "bg-yellow-600" 
        };
      case 'memory':
        return {
          title: "🧠 MEMORY MATCH 🧠",
          subtitle: "Test your memory skills!",
          className: "bg-purple-600"
        };
      case 'reflex':
        return {
          title: "👆 REFLEX TAP 👆",
          subtitle: "Test your reflexes!",
          className: "bg-green-600"
        };
      case 'drag':
        return {
          title: "🎯 DRAG & MATCH 🎯",
          subtitle: "Match the right answers!",
          className: "bg-blue-600"
        };
      default:
        return {
          title: data.quiz.title,
          subtitle: "Select what you think they will answer",
          className: "bg-primary-600"
        };
    }
  };
  
  const formatInfo = getFormatInfo();
  
  return (
    <div className="min-h-screen w-full bg-gray-50 pt-12 pb-20">
      {/* Correct Answer Animation Overlay */}
      {showCorrectAnimation && (
        <motion.div 
          className="fixed inset-0 bg-green-500 bg-opacity-30 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-full p-8 shadow-lg"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1.2 }}
            exit={{ scale: 0.5 }}
          >
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </motion.div>
        </motion.div>
      )}
      
      {/* Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={handleExit}>
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold font-poppins text-gray-800">{formatInfo.title}</h1>
          <div className="w-6 h-6"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${formatInfo.className} rounded-full transition-all duration-500`} 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
          <span>Question {currentQuestionIndex + 1} of {data.questions.length}</span>
          <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
            {totalPoints} points
          </span>
          <span>{data.questions.length - currentQuestionIndex - 1} remaining</span>
        </div>
      </div>
      
      {/* Game Area */}
      <div className="px-6 mb-6">
        <motion.div
          key={currentQuestionIndex} // Remount on question change
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-md"
        >
          {currentQuestion && (
            <GameEngine
              question={currentQuestion}
              onAnswer={handleAnswerSubmit}
              format={gameFormat}
              comboStreak={comboStreak}
            />
          )}
        </motion.div>
      </div>
      
      {/* Partner Status */}
      <div className="px-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gray-50 text-gray-400">Waiting for partner...</span>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <div className="bg-white rounded-full shadow px-4 py-2 flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-gray-600 text-sm">Your partner is answering...</span>
          </div>
        </div>
      </div>
      
      {/* Add CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confetti1 {
          0% { transform: translate(-50%, -100%); opacity: 1; }
          100% { transform: translate(-100%, 100px) rotate(-90deg); opacity: 0; }
        }
        @keyframes confetti2 {
          0% { transform: translate(-50%, -100%); opacity: 1; }
          100% { transform: translate(100%, 80px) rotate(190deg); opacity: 0; }
        }
        @keyframes confetti3 {
          0% { transform: translate(-50%, -100%); opacity: 1; }
          100% { transform: translate(0, 120px) rotate(90deg); opacity: 0; }
        }
        @keyframes points-fly {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-30px) scale(0.9); opacity: 0; }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-points-fly {
          animation: points-fly 1s forwards ease-out;
        }
        .text-shadow {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
      `}} />
    </div>
  );
}
