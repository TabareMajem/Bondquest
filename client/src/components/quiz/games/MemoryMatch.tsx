import { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

interface MemoryCard {
  id: number;
  content: string;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  timeLimit: number; // in seconds
}

/**
 * MemoryMatch is a card-matching mini-game where players must find pairs
 * of cards related to their relationship.
 */
export default function MemoryMatch({ 
  question, 
  onAnswer, 
  timeLimit = 30 
}: MemoryMatchProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [moves, setMoves] = useState(0);
  
  // Generate memory cards from question options
  useEffect(() => {
    if (question.options && question.options.length >= 4) {
      // Take at most 6 options to create pairs
      const pairOptions = question.options.slice(0, 6);
      
      // Create card pairs
      const cardPairs = pairOptions.flatMap((option, index) => [
        { 
          id: index * 2, 
          content: option, 
          pairId: index, 
          isFlipped: false, 
          isMatched: false 
        },
        { 
          id: index * 2 + 1, 
          content: option, 
          pairId: index, 
          isFlipped: false, 
          isMatched: false 
        }
      ]);
      
      // Shuffle the cards
      const shuffledCards = [...cardPairs].sort(() => Math.random() - 0.5);
      setCards(shuffledCards);
    } else {
      // Fallback if there aren't enough options
      const defaultPairs = [
        "Love", "Joy", "Trust", "Respect", "Communication", "Fun"
      ].flatMap((word, index) => [
        { 
          id: index * 2, 
          content: word, 
          pairId: index, 
          isFlipped: false, 
          isMatched: false 
        },
        { 
          id: index * 2 + 1, 
          content: word, 
          pairId: index, 
          isFlipped: false, 
          isMatched: false 
        }
      ]);
      
      // Shuffle the cards
      const shuffledCards = [...defaultPairs].sort(() => Math.random() - 0.5);
      setCards(shuffledCards);
    }
  }, [question]);
  
  // Handle countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !gameCompleted) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && !gameCompleted) {
      endGame();
    }
  }, [timeLeft, gameCompleted]);
  
  // Check for game completion
  useEffect(() => {
    if (cards.length > 0 && matchedPairs.length === cards.length / 2) {
      setGameCompleted(true);
      
      // Calculate points based on time left and moves
      const timeBonus = Math.round(timeLeft * 2); // 2 points per second left
      const movesPenalty = Math.max(0, Math.round((moves - cards.length) * 0.5)); // Penalty for extra moves
      const totalPoints = 20 + timeBonus - movesPenalty; // Base 20 points
      
      // Use a timeout to let the animation finish
      setTimeout(() => {
        onAnswer('memory_match_completed', Math.max(5, totalPoints));
      }, 1000);
    }
  }, [matchedPairs, cards, moves, timeLeft, onAnswer]);
  
  // Handle card flip
  const handleCardClick = (cardId: number) => {
    // Prevent clicking if:
    // - Card is already flipped
    // - Card is already matched
    // - Two cards are already flipped
    // - Game is completed
    if (
      flippedCards.includes(cardId) ||
      cards.find(c => c.id === cardId)?.isMatched ||
      flippedCards.length >= 2 ||
      gameCompleted
    ) {
      return;
    }
    
    // Flip the card
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    // Update cards state
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));
    
    // If this is the second card, check for a match
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = cards.find(c => c.id === secondCardId);
      
      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // It's a match!
        setTimeout(() => {
          setMatchedPairs([...matchedPairs, firstCard.pairId]);
          setCards(cards.map(card => 
            card.pairId === firstCard.pairId 
              ? { ...card, isMatched: true } 
              : card
          ));
          setFlippedCards([]);
        }, 500);
      } else {
        // Not a match, flip back after a delay
        setTimeout(() => {
          setCards(cards.map(card => 
            newFlippedCards.includes(card.id) 
              ? { ...card, isFlipped: false } 
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };
  
  // End the game early
  const endGame = () => {
    if (gameCompleted) return;
    
    setGameCompleted(true);
    
    // Calculate points based on matches made
    const matchPoints = matchedPairs.length * 5; // 5 points per match
    onAnswer('memory_match_time_up', Math.max(0, matchPoints));
  };
  
  // Calculate timer color
  const getTimerColor = () => {
    const percentage = timeLeft / timeLimit;
    if (percentage > 0.66) return 'text-green-500';
    if (percentage > 0.33) return 'text-orange-500';
    return 'text-red-500';
  };
  
  return (
    <div className="quiz-game memory-match">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold mb-2">{question.text || "Match the pairs!"}</h2>
        <p className="text-gray-500 text-sm">Find matching cards to test your memory</p>
      </div>
      
      {/* Game Stats */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center">
          <span className="text-gray-700 font-medium">Moves: {moves}</span>
        </div>
        <div className="flex items-center">
          <span className={`font-medium ${getTimerColor()}`}>
            Time: {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
            {String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-primary-600 font-medium">
            {matchedPairs.length}/{cards.length / 2} Pairs
          </span>
        </div>
      </div>
      
      {/* Memory Cards Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            className={`aspect-w-3 aspect-h-4 cursor-pointer ${
              card.isMatched ? 'cursor-default' : ''
            }`}
            whileHover={{ scale: card.isFlipped || card.isMatched ? 1 : 1.05 }}
            onClick={() => handleCardClick(card.id)}
          >
            <div className={`w-full h-full rounded-lg card-flip ${
              card.isFlipped || card.isMatched ? 'is-flipped' : ''
            }`}>
              {/* Card Back */}
              <div className="card-face card-back bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">?</span>
              </div>
              
              {/* Card Front */}
              <div className={`card-face card-front rounded-lg flex items-center justify-center text-sm font-medium ${
                card.isMatched 
                  ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                  : 'bg-white text-primary-800 border-2 border-primary-200'
              }`}>
                {card.content}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Skip Button */}
      <div className="flex justify-center">
        <button
          onClick={endGame}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
        >
          Skip Game
        </button>
      </div>
      
      {/* CSS for card flip animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .card-flip {
          perspective: 1000px;
          transform-style: preserve-3d;
          transition: transform 0.6s;
          position: relative;
        }
        
        .is-flipped {
          transform: rotateY(180deg);
        }
        
        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        .card-front {
          transform: rotateY(180deg);
        }
      `}} />
    </div>
  );
}