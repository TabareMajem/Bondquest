import React, { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion, Reorder } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface DragAndDropProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * DragAndDrop game where players must arrange items in the correct order
 * Difficulty determines time limit and how scrambled the items are
 */
export default function DragAndDrop({ 
  question, 
  onAnswer, 
  difficulty 
}: DragAndDropProps) {
  const [items, setItems] = useState<string[]>([]);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const [orderCorrect, setOrderCorrect] = useState<boolean | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  
  // Configure game based on difficulty
  const getGameConfig = () => {
    switch(difficulty) {
      case 'easy':
        return { maxAttempts: 3, pointsPerAttempt: [150, 100, 50] };
      case 'hard':
        return { maxAttempts: 1, pointsPerAttempt: [200] };
      default: // medium
        return { maxAttempts: 2, pointsPerAttempt: [175, 75] };
    }
  };
  
  const { maxAttempts, pointsPerAttempt } = getGameConfig();
  
  // Initialize game with scrambled options
  useEffect(() => {
    if (!question.options?.length) return;
    
    // Store original order (treating the options array as the correct order)
    const originalItems = [...question.options];
    setOriginalOrder(originalItems);
    
    // Create scrambled order for drag and drop
    const scrambledItems = [...originalItems];
    
    // Fisher-Yates shuffle
    for (let i = scrambledItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambledItems[i], scrambledItems[j]] = [scrambledItems[j], scrambledItems[i]];
    }
    
    setItems(scrambledItems);
    setAttemptCount(0);
    setOrderCorrect(null);
    setSelectedOption(null);
  }, [question]);
  
  // Handle checking the order
  const checkOrder = () => {
    setIsCheckingOrder(true);
    
    // Check if current order matches original order
    const isCorrect = items.every((item, index) => item === originalOrder[index]);
    setOrderCorrect(isCorrect);
    
    if (isCorrect) {
      // Order is correct, show success feedback
      setShowFeedback(true);
      
      // Calculate points based on number of attempts
      const points = pointsPerAttempt[Math.min(attemptCount, pointsPerAttempt.length - 1)];
      
      // Submit after showing feedback
      setTimeout(() => {
        // Use the first option as the answer when correct
        onAnswer(originalOrder[0], points);
      }, 1500);
    } else {
      // Order is incorrect, increment attempt count
      setAttemptCount(prev => prev + 1);
      
      // Reset checking status after showing feedback
      setTimeout(() => {
        setIsCheckingOrder(false);
        setOrderCorrect(null);
        
        // If max attempts reached, auto-submit with 0 points
        if (attemptCount + 1 >= maxAttempts) {
          setShowFeedback(true);
          setTimeout(() => {
            onAnswer('', 0);
          }, 1500);
        }
      }, 1500);
    }
  };
  
  // Handle selecting a specific answer if order check fails
  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Submit with minimum points
    setTimeout(() => {
      onAnswer(option, 25);
    }, 1500);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{question.text}</h3>
      
      {/* Instructions */}
      <p className="text-gray-600 text-sm mb-4">
        Drag and drop the items into the correct order, then click "Check Order".
        {maxAttempts > 1 && ` You have ${maxAttempts} attempts.`}
      </p>
      
      {/* Drag and drop items */}
      <div className="border rounded-lg bg-gray-50 p-3 mb-4">
        <Reorder.Group 
          axis="y" 
          values={items} 
          onReorder={setItems}
          className="space-y-2"
        >
          {items.map((item) => (
            <Reorder.Item 
              key={item} 
              value={item}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div 
                className="bg-white p-3 rounded border border-gray-200 flex items-center"
                whileDrag={{ scale: 1.03, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
                layoutId={item}
              >
                <div className="flex-1">{item}</div>
                <div className="flex-shrink-0 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="7" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="17" r="1" />
                    <circle cx="15" cy="7" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="17" r="1" />
                  </svg>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
      
      {/* Check order button */}
      {!isCheckingOrder && orderCorrect === null && attemptCount < maxAttempts && (
        <button
          className="w-full mb-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          onClick={checkOrder}
        >
          Check Order
        </button>
      )}
      
      {/* Feedback for order checking */}
      {isCheckingOrder && orderCorrect !== null && (
        <motion.div 
          className={`mb-4 p-3 rounded-lg text-center ${
            orderCorrect 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {orderCorrect ? (
            <div className="flex items-center justify-center">
              <Check className="h-5 w-5 mr-2" />
              <p className="font-medium">Perfect! The order is correct.</p>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <X className="h-5 w-5 mr-2" />
              <p className="font-medium">
                Sorry, that's not right. 
                {attemptCount < maxAttempts - 1 
                  ? ` Try again. ${maxAttempts - attemptCount - 1} attempts left.`
                  : ' No attempts left.'}
              </p>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Answer selection after max attempts */}
      {attemptCount >= maxAttempts && !orderCorrect && !showFeedback && (
        <div>
          <div className="bg-amber-100 rounded-lg p-3 mb-4 text-center">
            <p className="text-amber-700 font-medium">You've used all your attempts!</p>
            <p className="text-amber-700 text-sm">Now choose your answer:</p>
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
            className={`p-6 rounded-xl ${orderCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-amber-100 border-2 border-amber-500'}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{orderCorrect ? '🎯' : '🤔'}</div>
              <p className="text-lg font-bold text-green-700">
                {orderCorrect 
                  ? `Perfect Order! +${pointsPerAttempt[Math.min(attemptCount, pointsPerAttempt.length - 1)]} points` 
                  : `Time to move on! +25 points`}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}