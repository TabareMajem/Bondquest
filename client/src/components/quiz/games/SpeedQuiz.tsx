import React, { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

interface SpeedQuizProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  timeLimit: number; // in seconds
  isStandard?: boolean; // if true, shows regular quiz UI without timer emphasis
}

/**
 * SpeedQuiz is a time-based quiz game where players earn more points
 * the faster they answer. Points decrease as time passes.
 */
export default function SpeedQuiz({ 
  question, 
  onAnswer, 
  timeLimit,
  isStandard = false
}: SpeedQuizProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Parse options from question
  const options = question.options || [];
  
  // Calculate points based on time remaining
  const calculatePoints = (): number => {
    // Base points
    const basePoints = isStandard ? 100 : 200;
    
    // For standard mode, time doesn't affect points
    if (isStandard) return basePoints;
    
    // For speed mode, faster answers get more points
    const timeRatio = timeLeft / timeLimit;
    return Math.max(Math.round(basePoints * timeRatio), 50);
  };
  
  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || selectedOption) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 0.1, 0));
    }, 100);
    
    return () => clearInterval(timer);
  }, [timeLeft, selectedOption]);
  
  // Time's up effect
  useEffect(() => {
    if (timeLeft <= 0 && !selectedOption) {
      // Auto-select a random answer if time runs out
      setSelectedOption('Time expired');
      setShowFeedback(true);
      
      // Submit after showing feedback
      setTimeout(() => {
        onAnswer('Time expired', 0);
      }, 1500);
    }
  }, [timeLeft, selectedOption, onAnswer]);
  
  // Handle option selection
  const handleOptionSelect = (option: string) => {
    if (selectedOption || timeLeft <= 0) return;
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Submit after showing feedback
    setTimeout(() => {
      onAnswer(option, calculatePoints());
    }, 1500);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Timer display */}
      {!isStandard && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Time Remaining</span>
            <span className="text-sm font-bold">{Math.ceil(timeLeft)}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div 
              className="h-2.5 rounded-full bg-primary-600"
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Points: {calculatePoints()}</span>
            <span>+{calculatePoints()} pts</span>
          </div>
        </div>
      )}
      
      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{question.text}</h3>
      
      {/* Options */}
      <div className="grid gap-3">
        {options.map((option, index) => (
          <motion.button
            key={index}
            className={`p-3 rounded-lg text-left transition-colors ${
              !selectedOption ? 'hover:bg-primary-50 border border-gray-200' : 
              selectedOption === option ? 'bg-primary-100 border border-primary-500' :
              'border border-gray-200 opacity-70'
            }`}
            onClick={() => handleOptionSelect(option)}
            whileTap={{ scale: !selectedOption ? 0.98 : 1 }}
            disabled={!!selectedOption}
          >
            <span className="font-medium">{option}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Feedback overlay */}
      {showFeedback && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className={`p-6 rounded-xl ${
              selectedOption === 'Time expired' 
                ? 'bg-yellow-100 border-2 border-yellow-500' 
                : 'bg-green-100 border-2 border-green-500'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {selectedOption === 'Time expired' ? (
              <div className="text-center">
                <div className="text-3xl mb-2">⏰</div>
                <p className="text-lg font-bold text-yellow-700">Time's Up!</p>
                <p className="text-yellow-700">You didn't answer in time.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl mb-2">✓</div>
                <p className="text-lg font-bold text-green-700">Answer Submitted!</p>
                <p className="text-green-700">+{calculatePoints()} points</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}