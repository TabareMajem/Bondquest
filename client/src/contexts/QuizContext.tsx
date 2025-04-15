import { createContext, useContext, useState, ReactNode } from "react";
import { Quiz, Question } from "@shared/schema";

interface QuizContextType {
  currentQuiz: Quiz | null;
  questions: Question[];
  answers: Record<string, string>;
  currentQuestionIndex: number;
  quizSessionId: number | null;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  resetAnswers: () => void;
  setCurrentQuestionIndex: (index: number) => void;
  setQuizSessionId: (id: number | null) => void;
  hasNextQuestion: () => boolean;
  hasPreviousQuestion: () => boolean;
  getCurrentQuestion: () => Question | null;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizSessionId, setQuizSessionId] = useState<number | null>(null);

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const resetAnswers = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const hasNextQuestion = () => {
    return currentQuestionIndex < questions.length - 1;
  };

  const hasPreviousQuestion = () => {
    return currentQuestionIndex > 0;
  };

  const getCurrentQuestion = () => {
    if (!questions.length) return null;
    return questions[currentQuestionIndex];
  };

  return (
    <QuizContext.Provider
      value={{
        currentQuiz,
        questions,
        answers,
        currentQuestionIndex,
        quizSessionId,
        setCurrentQuiz,
        setQuestions,
        setAnswer,
        resetAnswers,
        setCurrentQuestionIndex,
        setQuizSessionId,
        hasNextQuestion,
        hasPreviousQuestion,
        getCurrentQuestion,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizContext() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuizContext must be used within a QuizProvider");
  }
  return context;
}
