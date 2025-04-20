import React, { Suspense, lazy, useState } from 'react';
import { Question } from '@shared/schema';
import { Loader2 } from 'lucide-react';

// Lazy load game components to improve initial loading time
const SpeedQuiz = lazy(() => import('./games/SpeedQuiz'));
const DragAndDrop = lazy(() => import('./games/DragAndDrop'));
const MemoryMatch = lazy(() => import('./games/MemoryMatch'));
const ReflexTap = lazy(() => import('./games/ReflexTap'));

// Game format types supported by the engine
export type GameFormat = 'standard' | 'speed' | 'memory' | 'drag' | 'reflex';

interface GameEngineProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  format: GameFormat;
  difficulty?: 'easy' | 'medium' | 'hard';
  comboStreak?: number;
}

/**
 * GameEngine component handles loading different game formats
 * and provides a consistent interface for all quiz mini-games
 */
export default function GameEngine({
  question,
  onAnswer,
  format = 'standard',
  difficulty = 'medium',
  comboStreak = 0
}: GameEngineProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Apply combo multiplier to points
  const handleAnswer = (answer: string, basePoints: number) => {
    // Apply combo multiplier (10% bonus per consecutive correct answer, up to 50%)
    const comboMultiplier = Math.min(1.5, 1 + (comboStreak * 0.1));
    const finalPoints = Math.round(basePoints * comboMultiplier);
    
    onAnswer(answer, finalPoints);
  };
  
  // Render the appropriate game component based on format
  const renderGame = () => {
    switch (format) {
      case 'speed':
        return (
          <SpeedQuiz 
            question={question} 
            onAnswer={handleAnswer}
            difficulty={difficulty}
          />
        );
      case 'memory':
        return (
          <MemoryMatch 
            question={question} 
            onAnswer={handleAnswer}
            difficulty={difficulty}
          />
        );
      case 'drag':
        return (
          <DragAndDrop 
            question={question} 
            onAnswer={handleAnswer}
            difficulty={difficulty}
          />
        );
      case 'reflex':
        return (
          <ReflexTap 
            question={question} 
            onAnswer={handleAnswer}
            difficulty={difficulty}
          />
        );
      case 'standard':
      default:
        // Standard quiz format (fallback if format is unknown)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{question.text}</h3>
            <div className="grid gap-3">
              {question.options?.map((option, index) => (
                <button
                  key={index}
                  className="p-4 rounded-lg text-left border border-gray-200 hover:bg-primary-50 transition-colors"
                  onClick={() => handleAnswer(option, 100)}
                >
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };
  
  return (
    <div>
      {comboStreak > 1 && (
        <div className="mb-3 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-md inline-block text-sm font-medium">
          🔥 {comboStreak}x Combo! ({Math.min(50, comboStreak * 10)}% bonus)
        </div>
      )}
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading game...</p>
          </div>
        </div>
      }>
        {renderGame()}
      </Suspense>
    </div>
  );
}