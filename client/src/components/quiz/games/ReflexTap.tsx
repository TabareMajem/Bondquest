import React, { useState, useEffect, useRef } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';
import { Timer, Zap, Flame } from 'lucide-react';

interface ReflexTapProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * ReflexTap game where players must tap targets as they appear
 * Points are awarded based on reaction speed
 */
export default function ReflexTap({ 
  question, 
  onAnswer, 
  difficulty 
}: ReflexTapProps) {
  const [gameActive, setGameActive] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [targets, setTargets] = useState<{id: number, x: number, y: number, size: number, hit: boolean}[]>([]);
  const [score, setScore] = useState(0);
  const [targetsHit, setTargetsHit] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const targetGeneratorRef = useRef<NodeJS.Timeout | null>(null);
  
  // Configure game based on difficulty
  const getGameConfig = () => {
    switch(difficulty) {
      case 'easy':
        return { 
          gameDuration: 15, 
          targetCount: 8,
          minSize: 60,
          maxSize: 100,
          minInterval: 1000,
          maxInterval: 2000,
          basePoints: 150
        };
      case 'hard':
        return { 
          gameDuration: 10, 
          targetCount: 12,
          minSize: 40,
          maxSize: 70,
          minInterval: 500,
          maxInterval: 1200,
          basePoints: 200
        };
      default: // medium
        return { 
          gameDuration: 12, 
          targetCount: 10,
          minSize: 50,
          maxSize: 80,
          minInterval: 700,
          maxInterval: 1500,
          basePoints: 175
        };
    }
  };
  
  const config = getGameConfig();
  
  // Start the game
  const startGame = () => {
    setGameActive(true);
    setGameComplete(false);
    setSelectedOption(null);
    setShowFeedback(false);
    setTargets([]);
    setScore(0);
    setTargetsHit(0);
    setTimeRemaining(config.gameDuration);
    
    // Start the countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up, end the game
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Generate targets at random intervals
    scheduleNextTarget();
  };
  
  // Schedule the next target to appear
  const scheduleNextTarget = () => {
    const { minInterval, maxInterval } = config;
    const randomDelay = Math.floor(Math.random() * (maxInterval - minInterval) + minInterval);
    
    targetGeneratorRef.current = setTimeout(() => {
      if (targetsHit < config.targetCount) {
        generateTarget();
        scheduleNextTarget();
      }
    }, randomDelay);
  };
  
  // Generate a random target
  const generateTarget = () => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const { minSize, maxSize } = config;
    
    // Random size within the range
    const size = Math.floor(Math.random() * (maxSize - minSize) + minSize);
    
    // Random position (ensuring the target is fully visible)
    const x = Math.floor(Math.random() * (containerRect.width - size));
    const y = Math.floor(Math.random() * (containerRect.height - size));
    
    // Add the new target
    setTargets(prev => [
      ...prev,
      {
        id: Date.now(),
        x,
        y,
        size,
        hit: false
      }
    ]);
  };
  
  // Handle target hit
  const hitTarget = (id: number) => {
    // Mark the target as hit
    setTargets(prev => 
      prev.map(target => 
        target.id === id ? { ...target, hit: true } : target
      )
    );
    
    // Increment hit counter
    setTargetsHit(prev => {
      const newCount = prev + 1;
      
      // Complete the game if all targets hit
      if (newCount >= config.targetCount) {
        endGame();
      }
      
      return newCount;
    });
    
    // Add to score - quicker hits earn more points
    setScore(prev => prev + 10);
  };
  
  // End the game
  const endGame = () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (targetGeneratorRef.current) {
      clearTimeout(targetGeneratorRef.current);
      targetGeneratorRef.current = null;
    }
    
    // Mark game as complete
    setGameActive(false);
    setGameComplete(true);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (targetGeneratorRef.current) clearTimeout(targetGeneratorRef.current);
    };
  }, []);
  
  // Handle final answer selection
  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Calculate points based on targets hit and speed
    const accuracy = targetsHit / config.targetCount;
    const speedBonus = score;
    const finalPoints = Math.round(config.basePoints * accuracy + speedBonus);
    
    // Submit after showing feedback
    setTimeout(() => {
      onAnswer(option, finalPoints);
    }, 1500);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
      
      {!gameActive && !gameComplete ? (
        // Game instructions
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Tap all targets as quickly as possible. You'll have {config.gameDuration} seconds to hit {config.targetCount} targets.
          </p>
          <button
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      ) : gameActive ? (
        // Active game
        <div>
          {/* Game stats bar */}
          <div className="flex justify-between items-center mb-4 text-sm">
            <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{targetsHit}/{config.targetCount}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded">
              <Timer className="h-4 w-4 text-amber-600" />
              <span className="font-medium">{timeRemaining}s</span>
            </div>
            
            <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded">
              <Flame className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{score}</span>
            </div>
          </div>
          
          {/* Game area */}
          <div 
            ref={containerRef}
            className="relative w-full h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-4 overflow-hidden"
          >
            {targets.map(target => (
              <motion.div
                key={target.id}
                className={`absolute rounded-full cursor-pointer ${
                  target.hit ? 'bg-green-400' : 'bg-primary-500'
                }`}
                style={{ 
                  left: target.x,
                  top: target.y,
                  width: target.size,
                  height: target.size
                }}
                onClick={() => !target.hit && hitTarget(target.id)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: target.hit ? 0 : 1, 
                  opacity: target.hit ? 0 : 1 
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
          
          <p className="text-gray-500 text-sm text-center mb-2">
            Tap the colored circles as quickly as you can!
          </p>
        </div>
      ) : (
        // Game completed, show answer options
        <div>
          <div className="bg-green-100 rounded-lg p-3 mb-4 text-center">
            <p className="text-green-700 font-medium">
              {targetsHit === config.targetCount 
                ? 'Perfect! You hit all targets!' 
                : `You hit ${targetsHit} out of ${config.targetCount} targets!`}
            </p>
            <p className="text-green-700 text-sm">Score: {score} • Now choose your answer:</p>
          </div>
          
          <div className="grid gap-3">
            {question.options?.map((option, index) => (
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
              <div className="text-3xl mb-2">⚡️</div>
              <p className="text-lg font-bold text-green-700">
                Quick Reflexes!
              </p>
              <p className="text-green-700">
                {targetsHit}/{config.targetCount} Targets • Score: {score}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}