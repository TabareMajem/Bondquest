import { useState, useEffect, useCallback } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

// Define shape types
type ShapeType = 'heart' | 'star' | 'circle' | 'square';

interface TapTarget {
  id: string;
  shape: ShapeType;
  color: string;
  position: { x: number; y: number };
  size: number;
  isActive: boolean;
  timeToTap: number; // milliseconds
}

interface ReflexTapProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * ReflexTap is a reaction-time based game where users must quickly tap on
 * shapes that appear randomly on the screen.
 */
export default function ReflexTap({ 
  question, 
  onAnswer, 
  difficulty = 'medium'
}: ReflexTapProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [targets, setTargets] = useState<TapTarget[]>([]);
  const [score, setScore] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); // 15 second game
  const [readyCountdown, setReadyCountdown] = useState(3); // countdown before game starts
  const [averageReactionTime, setAverageReactionTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  
  // Determine game parameters based on difficulty
  const getGameParams = () => {
    switch (difficulty) {
      case 'easy':
        return {
          targetCount: 10,
          minSize: 60,
          maxSize: 80,
          minTime: 1500, // milliseconds
          maxTime: 2500
        };
      case 'hard':
        return {
          targetCount: 15,
          minSize: 40,
          maxSize: 60,
          minTime: 800,
          maxTime: 1500
        };
      default: // medium
        return {
          targetCount: 12,
          minSize: 50,
          maxSize: 70,
          minTime: 1000,
          maxTime: 2000
        };
    }
  };
  
  const { targetCount, minSize, maxSize, minTime, maxTime } = getGameParams();
  
  // Initialize game on mount
  useEffect(() => {
    setTotalTargets(targetCount);
  }, [targetCount]);
  
  // Countdown before game starts
  useEffect(() => {
    if (readyCountdown > 0 && !gameStarted) {
      const timer = setTimeout(() => {
        setReadyCountdown(readyCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (readyCountdown === 0 && !gameStarted) {
      setGameStarted(true);
    }
  }, [readyCountdown, gameStarted]);
  
  // Game timer
  useEffect(() => {
    if (gameStarted && !gameCompleted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !gameCompleted) {
      endGame();
    }
  }, [gameStarted, gameCompleted, timeLeft]);
  
  // Create random targets throughout the game
  useEffect(() => {
    if (!gameStarted || gameCompleted) return;
    
    // Generate a random shape
    const generateTarget = () => {
      const shapes: ShapeType[] = ['heart', 'star', 'circle', 'square'];
      const colors = [
        'rgb(239, 68, 68)', // red-500
        'rgb(249, 115, 22)', // orange-500
        'rgb(59, 130, 246)', // blue-500
        'rgb(139, 92, 246)', // purple-500
        'rgb(236, 72, 153)'  // pink-500
      ];
      
      // Choose random properties
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
      const timeToTap = Math.floor(Math.random() * (maxTime - minTime)) + minTime;
      
      // Calculate a random position that doesn't go off screen
      // (taking into account the container size and shape size)
      const maxX = 280 - size; // container width - shape size
      const maxY = 280 - size; // container height - shape size
      
      const position = {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY)
      };
      
      return {
        id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        shape,
        color,
        position,
        size,
        isActive: true,
        timeToTap
      };
    };
    
    // Add a new target if we haven't reached the total and there are no active targets
    if (targets.length === 0 && hitCount + missCount < totalTargets) {
      setTargets([generateTarget()]);
    }
    
    // Auto-remove targets that aren't tapped within their time limit
    targets.forEach(target => {
      if (target.isActive) {
        const timer = setTimeout(() => {
          setTargets(prevTargets => prevTargets.filter(t => t.id !== target.id));
          setMissCount(prevCount => prevCount + 1);
          
          // Check if the game should end
          if (hitCount + missCount + 1 >= totalTargets) {
            endGame();
          } else if (hitCount + missCount + 1 < totalTargets) {
            // Add a new target after a short delay
            setTimeout(() => {
              setTargets([generateTarget()]);
            }, 300);
          }
        }, target.timeToTap);
        
        return () => clearTimeout(timer);
      }
    });
    
  }, [targets, hitCount, missCount, totalTargets, gameStarted, gameCompleted, minSize, maxSize, minTime, maxTime]);
  
  // Handle when a target is tapped
  const handleTargetTap = useCallback((target: TapTarget) => {
    // Calculate reaction time (max time to tap - time left)
    const reactionTime = target.timeToTap / 1000; // convert to seconds
    
    // Add to reaction times array
    setReactionTimes(prev => [...prev, reactionTime]);
    
    // Calculate new average
    const newAverage = [...reactionTimes, reactionTime].reduce((a, b) => a + b, 0) / 
                      ([...reactionTimes, reactionTime].length);
    setAverageReactionTime(newAverage);
    
    // Calculate points inversely proportional to reaction time
    // Faster reactions = more points (up to 10 points per target)
    const maxPoints = 10;
    const pointsEarned = Math.max(1, Math.floor(maxPoints * (1 - reactionTime / (target.timeToTap / 1000))));
    
    setScore(prev => prev + pointsEarned);
    setHitCount(prev => prev + 1);
    setTargets(prev => prev.filter(t => t.id !== target.id));
    
    // Check if the game should end
    if (hitCount + 1 >= totalTargets) {
      endGame();
    } else {
      // Add a new target after a short delay
      setTimeout(() => {
        const shapes: ShapeType[] = ['heart', 'star', 'circle', 'square'];
        const colors = [
          'rgb(239, 68, 68)', // red-500
          'rgb(249, 115, 22)', // orange-500
          'rgb(59, 130, 246)', // blue-500
          'rgb(139, 92, 246)', // purple-500
          'rgb(236, 72, 153)'  // pink-500
        ];
        
        // Choose random properties
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
        const timeToTap = Math.floor(Math.random() * (maxTime - minTime)) + minTime;
        
        // Calculate a random position
        const maxX = 280 - size; // container width - shape size
        const maxY = 280 - size; // container height - shape size
        
        const position = {
          x: Math.floor(Math.random() * maxX),
          y: Math.floor(Math.random() * maxY)
        };
        
        setTargets([{
          id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          shape,
          color,
          position,
          size,
          isActive: true,
          timeToTap
        }]);
      }, 300);
    }
  }, [hitCount, totalTargets, minSize, maxSize, minTime, maxTime, reactionTimes]);
  
  // End the game and submit results
  const endGame = () => {
    if (gameCompleted) return;
    
    setGameCompleted(true);
    
    // Calculate accuracy
    const accuracy = hitCount / (hitCount + missCount);
    const accuracyBonus = Math.floor(accuracy * 10); // Up to 10 points for accuracy
    
    // Calculate final score
    const finalScore = score + accuracyBonus;
    
    // Wait a moment before showing results and passing back to parent
    setTimeout(() => {
      onAnswer(`reflex_tap: ${hitCount}/${totalTargets} hits, ${averageReactionTime.toFixed(2)}s avg`, finalScore);
    }, 1000);
  };
  
  // Render different shape types
  const renderShape = (type: ShapeType, color: string, size: number) => {
    switch (type) {
      case 'heart':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case 'star':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      case 'circle':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill={color} />
          </svg>
        );
      case 'square':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" fill={color} />
          </svg>
        );
    }
  };
  
  // Render the countdown or game interface
  if (!gameStarted) {
    return (
      <div className="quiz-game reflex-tap flex flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold mb-2">{question.text || "Reflex Tap Challenge"}</h2>
          <p className="text-gray-500 text-sm">Tap shapes as they appear!</p>
        </div>
        
        <div className="w-60 h-60 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-6xl font-bold text-primary-600">
            {readyCountdown > 0 ? readyCountdown : "GO!"}
          </div>
        </div>
      </div>
    );
  }
  
  if (gameCompleted) {
    return (
      <div className="quiz-game reflex-tap flex flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold mb-2">Challenge Complete!</h2>
          <p className="text-gray-500 text-sm">You tapped {hitCount} of {totalTargets} targets</p>
        </div>
        
        <div className="w-60 bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">{score}</div>
            <div className="text-sm text-gray-500">Points</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {averageReactionTime ? averageReactionTime.toFixed(2) : "0.00"}s
              </div>
              <div className="text-xs text-gray-500">Avg. Reaction</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {hitCount && (hitCount + missCount) > 0 ? Math.round((hitCount / (hitCount + missCount)) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="quiz-game reflex-tap">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold mb-2">{question.text || "Reflex Tap Challenge"}</h2>
        <p className="text-gray-500 text-sm">Tap shapes quickly for more points!</p>
      </div>
      
      {/* Game stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium">
          <span className="text-primary-600">{hitCount}</span>
          <span className="text-gray-400"> / {totalTargets}</span>
        </div>
        <div className="text-sm font-medium">
          <span className="text-gray-700">Time: {timeLeft}s</span>
        </div>
        <div className="text-sm font-medium">
          <span className="text-primary-600">Score: {score}</span>
        </div>
      </div>
      
      {/* Game area */}
      <div className="relative w-[300px] h-[300px] mx-auto bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
        {targets.map((target) => (
          <motion.div
            key={target.id}
            className="absolute cursor-pointer"
            style={{
              left: target.position.x,
              top: target.position.y,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTargetTap(target)}
          >
            {renderShape(target.shape, target.color, target.size)}
          </motion.div>
        ))}
      </div>
      
      {/* Tips */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Faster taps = More points!</p>
      </div>
    </div>
  );
}