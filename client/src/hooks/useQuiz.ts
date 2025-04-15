import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "../contexts/AuthContext";
import { useQuizContext } from "../contexts/QuizContext";
import { Quiz, Question } from "@shared/schema";

interface UseQuizProps {
  quizId?: number;
  autoInitSession?: boolean;
}

export function useQuiz({ quizId, autoInitSession = false }: UseQuizProps = {}) {
  const { couple } = useAuth();
  const { 
    setCurrentQuiz, 
    setQuestions, 
    setAnswer, 
    resetAnswers, 
    answers, 
    currentQuestionIndex, 
    setCurrentQuestionIndex, 
    setQuizSessionId,
    quizSessionId 
  } = useQuizContext();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  // Fetch quiz data
  const quizQuery = useQuery<{ quiz: Quiz; questions: Question[] }>({
    queryKey: [quizId ? `/api/quizzes/${quizId}` : null],
    enabled: !!quizId,
    onSuccess: (data) => {
      setCurrentQuiz(data.quiz);
      setQuestions(data.questions);
      resetAnswers();
      setTimeLeft(30);
      
      if (autoInitSession && couple && !quizSessionId) {
        initSessionMutation.mutate();
      }
    },
  });

  // Initialize quiz session
  const initSessionMutation = useMutation({
    mutationFn: async () => {
      if (!couple || !quizId) throw new Error("Missing couple or quiz data");
      
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
  });

  // Complete quiz session
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!quizSessionId) throw new Error("No quiz session found");
      
      // Calculate points based on number of answers (simplified)
      const pointsEarned = Object.keys(answers).length * 5;
      
      // In a real app with partners, we'd compare answers
      // For now, generate a random match percentage
      const matchPercentage = Math.floor(Math.random() * 41) + 60; // 60-100%
      
      const response = await apiRequest("PATCH", `/api/quiz-sessions/${quizSessionId}`, {
        user1Answers: answers,
        pointsEarned,
        matchPercentage,
        completed: true
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate dashboard data to reflect new activity
      if (couple) {
        queryClient.invalidateQueries({ queryKey: [`/api/couples/${couple.id}/dashboard`] });
      }
    },
  });

  // Handlers
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!quizQuery.data) return;
    
    // Save current answer if selected
    if (selectedAnswer && currentQuestionIndex < quizQuery.data.questions.length) {
      const questionId = quizQuery.data.questions[currentQuestionIndex].id.toString();
      setAnswer(questionId, selectedAnswer);
    }
    
    // Move to next question or complete
    if (currentQuestionIndex < quizQuery.data.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(30); // Reset timer
    } else {
      // Complete the quiz
      completeSessionMutation.mutate();
    }
  };

  const decrementTimer = () => {
    if (timeLeft > 0) {
      setTimeLeft(timeLeft - 1);
    }
  };

  return {
    quiz: quizQuery.data?.quiz,
    questions: quizQuery.data?.questions || [],
    currentQuestion: quizQuery.data?.questions[currentQuestionIndex],
    isLoading: quizQuery.isLoading || initSessionMutation.isPending,
    error: quizQuery.error || initSessionMutation.error,
    answers,
    selectedAnswer,
    timeLeft,
    currentQuestionIndex,
    totalQuestions: quizQuery.data?.questions.length || 0,
    quizSessionId,
    isCompletingSession: completeSessionMutation.isPending,
    handleAnswerSelect,
    handleNextQuestion,
    decrementTimer,
    initSession: initSessionMutation.mutate,
    completeSession: completeSessionMutation.mutate,
  };
}
