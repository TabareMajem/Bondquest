import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Question } from '@shared/schema';

// Lazy load game components
const SpeedQuiz = lazy(() => import('./games/SpeedQuiz'));
const DragAndDrop = lazy(() => import('./games/DragAndDrop'));
const MemoryMatch = lazy(() => import('./games/MemoryMatch'));
const ReflexTap = lazy(() => import('./games/ReflexTap'));

export type GameFormat = 'speed' | 'memory' | 'reflex' | 'drag' | 'standard';

export interface GameEngineProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  format: GameFormat;
  difficulty?: 'easy' | 'medium' | 'hard';
  comboStreak?: number; // Current streak of correct answers
}

/**
 * GameEngine manages different quiz game formats and provides a consistent
 * interface for the parent QuizGame component.
 */
export default function GameEngine({ 
  question, 
  onAnswer, 
  format, 
  difficulty = 'medium',
  comboStreak = 0
}: GameEngineProps) {
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  
  // Calculate point multiplier based on combo streak
  const getMultiplier = () => {
    if (comboStreak >= 5) return 2.0;
    if (comboStreak >= 3) return 1.5;
    if (comboStreak >= 1) return 1.2;
    return 1.0;
  };
  
  // Handle submission from a game component
  const handleGameAnswer = (answer: string, basePoints: number) => {
    const multiplier = getMultiplier();
    const finalPoints = Math.round(basePoints * multiplier);
    
    setPointsEarned(finalPoints);
    setShowPointsAnimation(true);
    
    // Animate points and then pass to parent
    setTimeout(() => {
      setShowPointsAnimation(false);
      onAnswer(answer, finalPoints);
    }, 1000);
  };
  
  // Adjust time based on difficulty
  const getTimeForDifficulty = (baseTime: number): number => {
    switch (difficulty) {
      case 'easy': return baseTime * 1.5;
      case 'hard': return baseTime * 0.7;
      default: return baseTime;
    }
  };
  
  // Render the appropriate game component based on format
  const renderGame = () => {
    switch (format) {
      case 'speed':
        return (
          <SpeedQuiz 
            question={question} 
            onAnswer={handleGameAnswer}
            timeLimit={getTimeForDifficulty(10)}
          />
        );
      case 'memory':
        return (
          <MemoryMatch 
            question={question} 
            onAnswer={handleGameAnswer}
            timeLimit={getTimeForDifficulty(30)}
          />
        );
      case 'reflex':
        return (
          <ReflexTap 
            question={question} 
            onAnswer={handleGameAnswer}
            difficulty={difficulty}
          />
        );
      case 'drag':
        return (
          <DragAndDrop 
            question={question} 
            onAnswer={handleGameAnswer}
            timeLimit={getTimeForDifficulty(20)}
          />
        );
      default:
        // Standard quiz question format (no special game mechanics)
        return (
          <SpeedQuiz 
            question={question} 
            onAnswer={handleGameAnswer}
            timeLimit={getTimeForDifficulty(30)}
            isStandard={true}
          />
        );
    }
  };
  
  return (
    <div className="relative">
      {/* Points animation overlay */}
      {showPointsAnimation && (
        <div className="absolute top-2 right-2 z-50 animate-points-fly">
          <div className="bg-primary-600 text-white px-3 py-1 rounded-full font-bold text-shadow flex items-center">
            <span className="mr-1">+{pointsEarned}</span>
            <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Combo streak indicator */}
      {comboStreak > 0 && (
        <div className="absolute top-2 left-2 z-50">
          <div className={`px-2 py-1 rounded-full font-bold text-xs flex items-center ${
            comboStreak >= 5 ? 'bg-purple-600 text-white' :
            comboStreak >= 3 ? 'bg-primary-500 text-white' :
            'bg-primary-200 text-primary-800'
          }`}>
            <span className="mr-1">Combo</span>
            <span className="bg-white bg-opacity-25 rounded-full w-5 h-5 flex items-center justify-center">
              {comboStreak}
            </span>
            <span className="ml-1">
              {comboStreak >= 5 ? '×2' : comboStreak >= 3 ? '×1.5' : '×1.2'}
            </span>
          </div>
        </div>
      )}
      
      {/* Render the selected game */}
      <Suspense fallback={
        <div className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      }>
        {renderGame()}
      </Suspense>
    </div>
  );
}