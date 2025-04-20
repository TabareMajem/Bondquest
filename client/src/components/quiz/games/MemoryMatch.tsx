import React, { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

interface MemoryMatchProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Card {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

/**
 * MemoryMatch game where players must match pairs of cards and then
 * answer the question to progress
 */
export default function MemoryMatch({ 
  question, 
  onAnswer, 
  difficulty 
}: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [completedPairs, setCompletedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Configure memory game based on difficulty
  const getGameConfig = () => {
    switch (difficulty) {
      case 'easy':
        return { pairCount: 3 };
      case 'hard':
        return { pairCount: 6 };
      default: // medium
        return { pairCount: 4 };
    }
  };

  const { pairCount } = getGameConfig();

  // Initialize game cards
  useEffect(() => {
    if (!gameStarted) return;
    
    // Generate pairs of matching content
    const pairContents: string[] = Array(pairCount)
      .fill(0)
      .map((_, i) => String.fromCodePoint(0x1F600 + i * 3)); // Emoji characters as card content
    
    // Create pairs and shuffle
    const cardPairs = [...pairContents, ...pairContents].map((content, index) => ({
      id: index,
      content,
      isFlipped: false,
      isMatched: false
    }));
    
    // Fisher-Yates shuffle
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    
    setCards(cardPairs);
    setTotalPairs(pairCount);
    setCompletedPairs(0);
    setMoveCount(0);
    setFlippedCards([]);
    setGameComplete(false);
    setSelectedOption(null);
  }, [gameStarted, pairCount]);

  // Handle card flip
  const handleCardFlip = (cardId: number) => {
    // Ignore if card is already flipped or matched, or if two cards are already flipped
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;
    
    // Flip the card
    const updatedCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);
    
    // Add to flipped cards
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    // If two cards are flipped, check for a match
    if (newFlippedCards.length === 2) {
      setMoveCount(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = updatedCards.find(c => c.id === firstId);
      const secondCard = updatedCards.find(c => c.id === secondId);
      
      if (firstCard?.content === secondCard?.content) {
        // Match found
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(c => 
              c.id === firstId || c.id === secondId 
                ? { ...c, isMatched: true } 
                : c
            )
          );
          setFlippedCards([]);
          setCompletedPairs(prev => {
            const newCount = prev + 1;
            if (newCount === totalPairs) {
              setGameComplete(true);
            }
            return newCount;
          });
        }, 500);
      } else {
        // No match, flip cards back
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(c => 
              newFlippedCards.includes(c.id) 
                ? { ...c, isFlipped: false } 
                : c
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Start the game
  const startGame = () => {
    setGameStarted(true);
  };

  // Handle answer selection
  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Calculate points based on moves (fewer moves = more points)
    const basePoints = 150;
    const penalty = Math.min(50, moveCount * 5);
    const finalPoints = Math.max(50, basePoints - penalty);
    
    // Submit after showing feedback
    setTimeout(() => {
      onAnswer(option, finalPoints);
    }, 1500);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {!gameStarted ? (
        // Game instructions
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
          <p className="text-gray-600 mb-6">
            Match all pairs of cards to unlock the answers. Fewer moves means more points!
          </p>
          <button
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      ) : gameComplete && !selectedOption ? (
        // Answer selection after completing the memory game
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
          <div className="bg-green-100 rounded-lg p-3 mb-4 text-center">
            <p className="text-green-700 font-medium">Memory game completed in {moveCount} moves!</p>
            <p className="text-green-700 text-sm">Now choose your answer:</p>
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
      ) : (
        // Game in progress
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-2">Pairs:</span>
              <span className="bg-primary-100 text-primary-800 font-bold px-2 py-1 rounded">{completedPairs}/{totalPairs}</span>
            </div>
            <div className="text-sm text-gray-600">
              Moves: <span className="font-medium">{moveCount}</span>
            </div>
          </div>
          
          {/* Memory cards grid */}
          <div className={`grid gap-2 mb-4 ${pairCount <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {cards.map(card => (
              <motion.div
                key={card.id}
                className={`aspect-square cursor-pointer rounded-lg overflow-hidden border ${
                  card.isMatched ? 'border-green-300 opacity-70' : 'border-gray-300'
                }`}
                onClick={() => handleCardFlip(card.id)}
                whileHover={{ scale: card.isFlipped || card.isMatched ? 1 : 1.05 }}
                whileTap={{ scale: card.isFlipped || card.isMatched ? 1 : 0.95 }}
              >
                <motion.div
                  className="w-full h-full flex items-center justify-center"
                  initial={false}
                  animate={{
                    rotateY: card.isFlipped ? 180 : 0,
                    backgroundColor: card.isMatched 
                      ? '#f0fdf4' 
                      : card.isFlipped 
                        ? '#f3f4f6' 
                        : '#6366f1'
                  }}
                  transition={{ duration: 0.6 }}
                >
                  {card.isFlipped && (
                    <motion.span
                      className="text-2xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {card.content}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
          <p className="text-gray-500 text-sm mb-2">
            Match all pairs to unlock answers
          </p>
          
          {/* Disabled options when game in progress */}
          <div className="grid gap-2 opacity-50">
            {question.options?.map((option, index) => (
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
              <div className="text-3xl mb-2">🧠</div>
              <p className="text-lg font-bold text-green-700">Good Memory!</p>
              <p className="text-green-700">Completed in {moveCount} moves</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}