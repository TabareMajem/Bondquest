import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Trophy, ChevronLeft } from 'lucide-react';
import GameEngine, { GameFormat } from '@/components/quiz/GameEngine';
import { Button } from '@/components/ui/button';
import { Quiz, Question } from '@shared/schema';

interface QuizData {
  quiz: Quiz;
  questions: Question[];
}

export default function QuizGame() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ text: string, points: number }[]>([]);
  const [comboStreak, setComboStreak] = useState(0);
  const [gameFormat, setGameFormat] = useState<GameFormat>('standard');
  const [gameComplete, setGameComplete] = useState(false);
  
  // Fetch quiz and questions
  const { data: quizData, isLoading, error } = useQuery<QuizData>({
    queryKey: [`/api/quizzes/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      return response.json();
    }
  });
  
  // On mount, determine a random game format for each question
  useEffect(() => {
    if (quizData?.questions) {
      // Get a random game format not used in the previous question
      const randomizeFormat = (previousFormat?: GameFormat): GameFormat => {
        const formats: GameFormat[] = ['speed', 'memory', 'reflex', 'drag', 'standard'];
        const availableFormats = previousFormat ? formats.filter(f => f !== previousFormat) : formats;
        const randomIndex = Math.floor(Math.random() * availableFormats.length);
        return availableFormats[randomIndex];
      };
      
      // Start with a random format
      setGameFormat(randomizeFormat());
    }
  }, [quizData]);
  
  // Handle answer submission from GameEngine
  const handleAnswer = (answer: string, points: number) => {
    // Save the answer and points
    const newAnswers = [...answers, { text: answer, points }];
    setAnswers(newAnswers);
    
    // Update the total score
    setScore(prevScore => prevScore + points);
    
    // Manage combo streak
    if (points > 0) {
      setComboStreak(prev => prev + 1);
    } else {
      setComboStreak(0);
    }
    
    // Move to the next question or end the quiz
    if (quizData?.questions && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        
        // Change the game format for the next question
        // Ensure it's different from the current format for variety
        const previousFormat = gameFormat;
        const formats: GameFormat[] = ['speed', 'memory', 'reflex', 'drag', 'standard'];
        const availableFormats = formats.filter(f => f !== previousFormat);
        const randomIndex = Math.floor(Math.random() * availableFormats.length);
        setGameFormat(availableFormats[randomIndex]);
        
        return nextIndex;
      });
    } else {
      // End of quiz
      setGameComplete(true);
    }
  };
  
  // Handle retry after an error
  const handleRetry = () => {
    window.location.reload();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !quizData) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-lg mb-2">Failed to load quiz</h3>
            <p>{(error as Error)?.message || 'An unexpected error occurred'}</p>
          </div>
          <div className="flex flex-col gap-4">
            <Button variant="outline" onClick={() => setLocation('/quizzes')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
            <Button onClick={handleRetry}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Quiz complete screen
  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-primary-600 p-6 text-white text-center">
            <Trophy className="h-12 w-12 mx-auto mb-2" />
            <h1 className="text-2xl font-bold">{quizData.quiz.title} Completed!</h1>
            <p className="opacity-90">Total Score: {score} points</p>
          </div>
          
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Your Answers</h2>
            <div className="space-y-3 mb-6">
              {quizData.questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <p className="font-medium text-gray-800">{question.text}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-600">Your answer: <span className="font-medium">{answers[index]?.text || 'No answer'}</span></span>
                    <span className={`font-medium ${answers[index]?.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {answers[index]?.points > 0 ? `+${answers[index]?.points}` : '0'} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => setLocation('/quizzes')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
              <Button onClick={() => {
                setCurrentQuestionIndex(0);
                setScore(0);
                setAnswers([]);
                setComboStreak(0);
                setGameComplete(false);
              }}>
                Play Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Determine current question and format
  const currentQuestion = quizData.questions[currentQuestionIndex];
  
  // Active quiz screen
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">{quizData.quiz.title}</h1>
            <div className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Q{currentQuestionIndex + 1}/{quizData.questions.length}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <div>Score: <span className="font-bold">{score}</span></div>
            <div>Game Mode: <span className="font-bold capitalize">{gameFormat}</span></div>
          </div>
        </div>
        
        <div className="p-4">
          <GameEngine 
            question={currentQuestion}
            onAnswer={handleAnswer}
            format={gameFormat}
            difficulty="medium"
            comboStreak={comboStreak}
          />
        </div>
      </div>
    </div>
  );
}