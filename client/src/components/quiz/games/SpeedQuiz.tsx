import React, { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { Hourglass, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpeedQuizProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * SpeedQuiz game where players must answer before time runs out
 * Points decrease as time passes, encouraging quick responses
 */
export default function SpeedQuiz({ 
  question, 
  onAnswer, 
  difficulty 
}: SpeedQuizProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Configure timer based on difficulty
  const getTimerConfig = () => {
    switch (difficulty) {
      case 'easy':
        return { time: 20, startPoints: 150, pointsDecrement: 5 };
      case 'hard':
        return { time: 10, startPoints: 200, pointsDecrement: 15 };
      default: // medium
        return { time: 15, startPoints: 175, pointsDecrement: 10 };
    }
  };
  
  const { time, startPoints, pointsDecrement } = getTimerConfig();
  
  // Initialize timer and points
  useEffect(() => {
    setTimeLeft(time);
    setCurrentPoints(startPoints);
    
    // Reset state if question changes
    setSelectedOption(null);
    setShowFeedback(false);
  }, [question, time, startPoints]);
  
  // Timer countdown effect
  useEffect(() => {
    if (selectedOption || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
      
      // Decrease points as time passes
      setCurrentPoints(prev => {
        const newPoints = Math.max(50, prev - pointsDecrement);
        return newPoints;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [selectedOption, timeLeft, pointsDecrement]);
  
  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !selectedOption) {
      // Time's up - no points awarded if no answer selected
      // Submit a blank answer
      setTimeout(() => {
        onAnswer('', 0);
      }, 1000);
    }
  }, [timeLeft, selectedOption, onAnswer]);
  
  // Handle answer selection
  const handleOptionSelect = (option: string) => {
    if (selectedOption || timeLeft <= 0) return;
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Submit after showing feedback
    setTimeout(() => {
      onAnswer(option, currentPoints);
    }, 1500);
  };
  
  // Calculate remaining time percentage
  const timePercentage = (timeLeft / time) * 100;
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Timer and points display */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Hourglass className="h-4 w-4 mr-1.5 text-amber-600" />
          <span className="font-medium">
            {timeLeft > 0 ? `${timeLeft}s` : "Time's up!"}
          </span>
        </div>
        <div className="flex items-center">
          {currentPoints < startPoints && !selectedOption && (
            <motion.div 
              className="mr-2 text-red-500"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 4 }}
              transition={{ duration: 0.5 }}
            >
              <ArrowDown className="h-4 w-4" />
            </motion.div>
          )}
          <span className="bg-primary-100 text-primary-800 font-bold px-2 py-1 rounded text-sm">
            {currentPoints} pts
          </span>
        </div>
      </div>
      
      {/* Progress bar for time */}
      <div className="mb-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${timePercentage > 50 ? 'bg-green-500' : timePercentage > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${timePercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Question text */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{question.text}</h3>
      
      {/* Answer options */}
      <div className="grid gap-3">
        {question.options?.map((option, index) => (
          <motion.button
            key={index}
            className={`p-3 rounded-lg text-left border ${
              selectedOption === option 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 hover:bg-gray-50'
            } transition-colors ${
              timeLeft === 0 && !selectedOption ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => handleOptionSelect(option)}
            whileHover={{ scale: selectedOption || timeLeft === 0 ? 1 : 1.02 }}
            whileTap={{ scale: selectedOption || timeLeft === 0 ? 1 : 0.98 }}
            disabled={!!selectedOption || timeLeft === 0}
          >
            <span className="font-medium">{option}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Time's up message */}
      {timeLeft === 0 && !selectedOption && (
        <motion.div 
          className="mt-4 bg-red-100 text-red-700 p-3 rounded-lg text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-medium">Time's up! No points awarded.</p>
        </motion.div>
      )}
      
      {/* Success feedback overlay */}
      {showFeedback && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="p-6 rounded-xl bg-green-100 border-2 border-green-500"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <p className="text-lg font-bold text-green-700">Speed Bonus!</p>
              <p className="text-green-700">Points: {currentPoints}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}