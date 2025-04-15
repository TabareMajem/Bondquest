import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "../contexts/AuthContext";
import { useQuiz } from "../hooks/useQuiz";
import AnswerOption from "../components/quiz/AnswerOption";
import QuizResults from "../components/quiz/QuizResults";
import { Quiz, Question } from "@shared/schema";

interface QuizData {
  quiz: Quiz;
  questions: Question[];
}

export default function QuizGame() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, couple } = useAuth();
  const { toast } = useToast();
  const quizId = parseInt(id);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizSessionId, setQuizSessionId] = useState<number | null>(null);
  
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
  
  // Complete quiz session
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!quizSessionId) throw new Error("No quiz session found");
      
      // Calculate points based on number of answers
      const pointsEarned = Object.keys(answers).length * 5;
      // Mock match percentage (in a real app, this would compare with partner's answers)
      const matchPercentage = Math.floor(Math.random() * 41) + 60; // 60-100%
      
      const response = await apiRequest("PATCH", `/api/quiz-sessions/${quizSessionId}`, {
        user1Answers: answers,
        pointsEarned,
        matchPercentage,
        completed: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate dashboard data to reflect new activity
      if (couple) {
        queryClient.invalidateQueries({ queryKey: [`/api/couples/${couple.id}/dashboard`] });
        queryClient.invalidateQueries({ queryKey: [`/api/couples/${couple.id}/activities`] });
      }
      
      // Set quiz as completed and store results
      setQuizResults({
        matchPercentage: data.matchPercentage,
        pointsEarned: data.pointsEarned
      });
      setQuizCompleted(true);
      
      toast({
        title: "Quiz completed!",
        description: `You earned ${data.pointsEarned} points.`,
      });
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

  // Timer effect
  useEffect(() => {
    if (data && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && data) {
      // Auto-submit if timer reaches 0
      handleNextQuestion();
    }
  }, [timeLeft, data]);

  // Handle exiting the quiz
  const handleExit = () => {
    navigate("/quizzes");
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  // Handle proceeding to next question
  const handleNextQuestion = () => {
    if (data) {
      // Save the answer
      if (selectedAnswer) {
        const questionId = data.questions[currentQuestionIndex].id.toString();
        setAnswers(prev => ({
          ...prev,
          [questionId]: selectedAnswer
        }));
      }
      
      // Move to next question or complete the quiz
      if (currentQuestionIndex < data.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setTimeLeft(30); // Reset timer
      } else {
        // Complete the quiz
        completeSessionMutation.mutate();
      }
    }
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

  const currentQuestion = data.questions[currentQuestionIndex];

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
  
  return (
    <div className="min-h-screen w-full bg-gray-50 pt-12 pb-20">
      {/* Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={handleExit}>
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <h1 className="text-xl font-bold font-poppins text-gray-800">{data.quiz.title}</h1>
          <div className="w-6 h-6"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-600 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Question {currentQuestionIndex + 1} of {data.questions.length}</span>
          <span>{data.questions.length - currentQuestionIndex - 1} remaining</span>
        </div>
      </div>
      
      {/* Question Area */}
      <div className="px-6 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-md mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">{currentQuestion.text}</h2>
          <p className="text-gray-500 text-sm">Select what you think they will answer</p>
        </div>
        
        {/* Timer */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-gray-600 font-medium">
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
            {String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.options?.map((option, index) => (
            <AnswerOption
              key={index}
              text={option}
              isSelected={selectedAnswer === option}
              onClick={() => handleAnswerSelect(option)}
            />
          ))}
        </div>
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
        
        {/* Next question button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className={`px-8 py-3 rounded-full font-medium ${
              selectedAnswer
                ? "bg-primary-600 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {currentQuestionIndex < data.questions.length - 1 ? "Next Question" : "Complete Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
