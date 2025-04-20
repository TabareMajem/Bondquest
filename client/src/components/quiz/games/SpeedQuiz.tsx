import { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

interface SpeedQuizProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  timeLimit: number; // in seconds
  isStandard?: boolean; // whether to use standard UI (no animations)
}

/**
 * SpeedQuiz is a time-based quiz format where users must answer 
 * questions quickly for more points.
 */
export default function SpeedQuiz({ 
  question, 
  onAnswer, 
  timeLimit = 10,
  isStandard = false 
}: SpeedQuizProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selected, setSelected] = useState<string | null>(null);
  const [bounceAnimations, setBounceAnimations] = useState<Record<string, boolean>>({});
  
  // Calculate color based on time remaining
  const getTimerColor = () => {
    const percentage = timeLeft / timeLimit;
    if (percentage > 0.66) return 'rgb(34, 197, 94)'; // green-500
    if (percentage > 0.33) return 'rgb(249, 115, 22)'; // orange-500
    return 'rgb(239, 68, 68)'; // red-500
  };
  
  // Calculate percentage for circular timer
  const timerPercentage = (timeLeft / timeLimit) * 100;
  const circumference = 2 * Math.PI * 45; // circle radius is 45
  const strokeDashoffset = circumference - (timerPercentage / 100) * circumference;
  
  // Handle countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !selected) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 0.1), 100);
      return () => clearTimeout(timerId);
    } else if (timeLeft <= 0 && !selected) {
      // Time's up - submit with 0 points
      onAnswer('', 0);
    }
  }, [timeLeft, selected, onAnswer]);
  
  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (selected) return; // Prevent multiple selections
    
    setSelected(answer);
    
    // Add bounce animation
    setBounceAnimations({
      ...bounceAnimations,
      [answer]: true
    });
    
    // Calculate points based on time remaining
    const basePoints = 10; // Base points for answering
    const timeBonus = Math.round(timeLeft * 0.5); // 0.5 points per second remaining
    const totalPoints = basePoints + timeBonus;
    
    // Wait for animation before sending answer
    setTimeout(() => {
      onAnswer(answer, totalPoints);
    }, 600);
  };
  
  return (
    <div className="quiz-game speed-quiz">
      {/* Question */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold mb-2">{question.text}</h2>
        <p className="text-gray-500 text-sm">Answer quickly for more points!</p>
      </div>
      
      {/* Timer Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e6e6e6"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getTimerColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-100 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold">{Math.ceil(timeLeft)}</span>
          </div>
        </div>
      </div>
      
      {/* Answer Options */}
      <div className="grid grid-cols-1 gap-3">
        {question.options?.map((option, index) => (
          <motion.button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`w-full text-left py-4 px-5 rounded-xl border-2 ${
              selected === option
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
            } transition-colors relative overflow-hidden`}
            whileHover={{ scale: 1.02 }}
            animate={{
              scale: bounceAnimations[option] ? [1, 1.05, 1] : 1,
              transition: { duration: 0.5 }
            }}
            disabled={selected !== null}
          >
            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                  selected === option
                    ? 'bg-primary-500 text-white'
                    : 'border-2 border-gray-300'
                }`}
              >
                {selected === option && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                )}
              </div>
              {option}
            </div>
            
            {/* Confetti effect for selected answer */}
            {selected === option && !isStandard && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute top-0 left-1/2 w-4 h-4 bg-yellow-300 rounded-full transform -translate-x-1/2 -translate-y-full" 
                  style={{animation: 'confetti1 1s ease-out forwards'}}/>
                <div className="absolute top-0 left-1/3 w-3 h-3 bg-primary-400 rounded-full transform -translate-x-1/2 -translate-y-full" 
                  style={{animation: 'confetti2 0.8s ease-out forwards'}}/>
                <div className="absolute top-0 left-2/3 w-3 h-3 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-full" 
                  style={{animation: 'confetti3 0.9s ease-out forwards'}}/>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      
      {/* Info about points */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Base: 10 points + Time Bonus: {Math.round(timeLeft * 0.5)} points</p>
      </div>
    </div>
  );
}