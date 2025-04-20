import React, { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

interface ReflexTapProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * ReflexTap game where players must quickly tap targets as they appear.
 * After tapping enough targets, they can choose their answer.
 */
export default function ReflexTap({ 
  question, 
  onAnswer, 
  difficulty 
}: ReflexTapProps) {
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState<{ id: number, x: number, y: number, size: number }[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Parse options from question
  const options = question.options || [];
  
  // Calculate target parameters based on difficulty
  const getTargetParams = () => {
    switch (difficulty) {
      case 'easy':
        return { spawnRate: 1200, maxTargets: 3, targetSizeRange: [50, 70], scoreGoal: 5 };
      case 'hard':
        return { spawnRate: 700, maxTargets: 5, targetSizeRange: [30, 50], scoreGoal: 12 };
      default: // 'medium'
        return { spawnRate: 1000, maxTargets: 4, targetSizeRange: [40, 60], scoreGoal: 8 };
    }
  };
  
  const { spawnRate, maxTargets, targetSizeRange, scoreGoal } = getTargetParams();
  
  // Start game
  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setTargets([]);
    setGameComplete(false);
    setSelectedOption(null);
  };
  
  // Target spawning effect
  useEffect(() => {
    if (!gameStarted || gameComplete) return;
    
    const spawnTarget = () => {
      if (targets.length >= maxTargets || gameComplete) return;
      
      const id = Date.now();
      const x = Math.random() * 90; // % from left
      const y = Math.random() * 70; // % from top
      const sizeRange = targetSizeRange;
      const size = Math.floor(Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0]);
      
      setTargets(prev => [...prev, { id, x, y, size }]);
    };
    
    const interval = setInterval(spawnTarget, spawnRate);
    return () => clearInterval(interval);
  }, [gameStarted, targets, maxTargets, gameComplete, targetSizeRange, spawnRate]);
  
  // Check game completion
  useEffect(() => {
    if (score >= scoreGoal && !gameComplete) {
      setGameComplete(true);
    }
  }, [score, scoreGoal, gameComplete]);
  
  // Handle target tap
  const handleTargetTap = (id: number) => {
    if (gameComplete) return;
    
    // Remove target and add score
    setTargets(prev => prev.filter(t => t.id !== id));
    setScore(prev => prev + 1);
  };
  
  // Handle answer selection
  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Calculate points based on score
    const points = Math.min(150, 50 + score * 10);
    
    // Submit after showing feedback
    setTimeout(() => {
      onAnswer(option, points);
    }, 1500);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {!gameStarted ? (
        // Game instructions
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
          <p className="text-gray-600 mb-6">
            Quickly tap the targets as they appear! You need to hit {scoreGoal} targets to unlock the answers.
          </p>
          <button
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      ) : gameComplete && !selectedOption ? (
        // Answer selection
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
          <div className="bg-green-100 rounded-lg p-3 mb-4 text-center">
            <p className="text-green-700 font-medium">Great job! You hit {score} targets!</p>
            <p className="text-green-700 text-sm">Now choose your answer:</p>
          </div>
          <div className="grid gap-3">
            {options.map((option, index) => (
              <motion.button
                key={index}
                className="p-3 rounded-lg text-left border border-gray-200 hover:bg-primary-50"
                onClick={() => handleOptionSelect(option)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-medium">{option}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        // Game in progress
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Score:</span>
              <span className="bg-primary-100 text-primary-800 font-bold px-2 py-1 rounded">{score}/{scoreGoal}</span>
            </div>
            {!gameComplete && (
              <button 
                className="text-xs text-gray-500 hover:underline"
                onClick={() => {
                  setGameComplete(true);
                  setScore(Math.max(0, scoreGoal - 5));
                }}
              >
                Skip ({Math.max(0, scoreGoal - score)} more)
              </button>
            )}
          </div>
          
          {/* Game area */}
          <div className="relative h-64 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 mb-4">
            {/* Targets */}
            {targets.map(target => (
              <motion.div
                key={target.id}
                className="absolute bg-primary-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer shadow-md"
                style={{ 
                  left: `${target.x}%`, 
                  top: `${target.y}%`, 
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                }}
                animate={{ 
                  scale: [0.5, 1, 0.9, 1] 
                }}
                transition={{ duration: 0.5 }}
                onClick={() => handleTargetTap(target.id)}
                whileTap={{ scale: 0.8 }}
              >
                <span className="text-xs">+1</span>
              </motion.div>
            ))}
            
            {/* Completion message */}
            {gameComplete && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-primary-100 bg-opacity-80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center p-4 rounded-lg bg-white shadow-lg">
                  <p className="text-lg font-bold text-primary-700">Level Complete!</p>
                  <p className="text-primary-600">Score: {score} targets</p>
                  <p className="text-sm text-gray-600 mt-2">Now choose your answer</p>
                </div>
              </motion.div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
          <p className="text-gray-500 text-sm mb-2">
            Hit {scoreGoal - score > 0 ? scoreGoal - score : 0} more targets to unlock answers
          </p>
          
          {/* Disabled options when game in progress */}
          <div className="grid gap-2 opacity-50">
            {options.map((option, index) => (
              <div
                key={index}
                className="p-3 rounded-lg text-left border border-gray-200 bg-gray-50"
              >
                <span className="font-medium">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Feedback overlay */}
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
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-lg font-bold text-green-700">Nice Reflexes!</p>
              <p className="text-green-700">Score: {score} | Answer: {selectedOption}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}