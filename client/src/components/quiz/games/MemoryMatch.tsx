import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryMatchProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  timeLimit: number; // in seconds
}

/**
 * MemoryMatch game where players must memorize and match pairs of cards.
 * One card contains an option, and it must be matched with its pair.
 */
export default function MemoryMatch({ 
  question, 
  onAnswer, 
  timeLimit 
}: MemoryMatchProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Parse options from question
  const options = question.options || [];
  
  // Create memory cards on mount
  useEffect(() => {
    // Generate pairs: each option will have a matching description card
    const cardPairs = options.map((option, index) => [
      { id: index * 2, type: 'option', content: option, matched: false },
      { id: index * 2 + 1, type: 'description', content: `Choice ${index + 1}`, matched: false }
    ]).flat();
    
    // Shuffle the cards
    const shuffled = [...cardPairs].sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [options]);
  
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
      setSelectedOption('Time expired');
      setShowFeedback(true);
      
      // Submit after showing feedback
      setTimeout(() => {
        onAnswer('Time expired', 0);
      }, 1500);
    }
  }, [timeLeft, selectedOption, onAnswer]);
  
  // Match validation effect
  useEffect(() => {
    // Need exactly 2 cards flipped to check for a match
    if (flippedIndices.length !== 2 || isProcessing) return;
    
    setIsProcessing(true);
    
    const [firstIdx, secondIdx] = flippedIndices;
    const firstCard = cards[firstIdx];
    const secondCard = cards[secondIdx];
    
    // Check if we have a match (one option card and one description card with related indices)
    const isMatch = 
      (firstCard.type === 'option' && secondCard.type === 'description' && 
       Math.floor(firstCard.id / 2) === Math.floor(secondCard.id / 2)) ||
      (firstCard.type === 'description' && secondCard.type === 'option' && 
       Math.floor(firstCard.id / 2) === Math.floor(secondCard.id / 2));
       
    if (isMatch) {
      // Mark cards as matched
      const updatedCards = [...cards];
      updatedCards[firstIdx].matched = true;
      updatedCards[secondIdx].matched = true;
      setCards(updatedCards);
      
      // Increment matched pairs count
      setMatchedPairs(prev => prev + 1);
      
      // Reset flipped cards
      setFlippedIndices([]);
      setIsProcessing(false);
      
      // If all pairs matched, submit answer
      if (matchedPairs + 1 === options.length) {
        const selectedAnswer = firstCard.type === 'option' ? firstCard.content : secondCard.content;
        
        // Calculate points based on time and matches
        const timeRatio = timeLeft / timeLimit;
        const points = Math.max(Math.round(200 * timeRatio), 50);
        
        setSelectedOption(selectedAnswer);
        setShowFeedback(true);
        
        // Submit after showing feedback
        setTimeout(() => {
          onAnswer(selectedAnswer, points);
        }, 1500);
      }
    } else {
      // Not a match, flip cards back after a delay
      setTimeout(() => {
        setFlippedIndices([]);
        setIsProcessing(false);
      }, 1000);
    }
  }, [flippedIndices, cards, isProcessing, matchedPairs, options.length, timeLeft, timeLimit, onAnswer]);
  
  // Handle card flip
  const handleFlip = useCallback((index: number) => {
    if (
      flippedIndices.includes(index) || 
      flippedIndices.length >= 2 || 
      cards[index].matched ||
      selectedOption ||
      isProcessing ||
      timeLeft <= 0
    ) {
      return; // Prevent flipping in these conditions
    }
    
    setFlippedIndices(prev => [...prev, index]);
  }, [flippedIndices, cards, selectedOption, isProcessing, timeLeft]);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Timer display */}
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
      </div>
      
      {/* Question & Progress */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
        <p className="text-gray-600 text-sm">Match each option with its pair</p>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: options.length }).map((_, i) => (
            <div 
              key={i}
              className={`w-3 h-3 rounded-full ${i < matchedPairs ? 'bg-green-500' : 'bg-gray-200'}`} 
            />
          ))}
        </div>
      </div>
      
      {/* Memory Card Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`relative h-20 cursor-pointer rounded-lg shadow-sm 
              ${card.matched ? 'opacity-50' : flippedIndices.includes(index) ? 'ring-2 ring-primary-500' : ''}`}
            onClick={() => handleFlip(index)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-full h-full absolute rounded-lg"
              initial={false}
              animate={{ 
                rotateY: flippedIndices.includes(index) || card.matched ? 180 : 0,
              }}
              transition={{ duration: 0.5 }}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full h-full flex items-center justify-center bg-primary-100 rounded-lg border border-primary-200">
                <span className="text-2xl">?</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="w-full h-full absolute rounded-lg"
              initial={false}
              animate={{ 
                rotateY: flippedIndices.includes(index) || card.matched ? 0 : -180,
              }}
              transition={{ duration: 0.5 }}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className={`w-full h-full flex items-center justify-center p-2 rounded-lg border 
                ${card.type === 'option' 
                  ? 'bg-blue-100 border-blue-300' 
                  : 'bg-purple-100 border-purple-300'}`}>
                <p className="text-center text-sm font-medium">
                  {card.content}
                </p>
              </div>
            </motion.div>
          </motion.div>
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
                <p className="text-yellow-700">You didn't complete the matching game.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl mb-2">🎮</div>
                <p className="text-lg font-bold text-green-700">Game Complete!</p>
                <p className="text-green-700">You matched all the pairs!</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}