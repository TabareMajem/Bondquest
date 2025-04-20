import React, { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

interface DragAndDropProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  timeLimit: number; // in seconds
}

/**
 * DragAndDrop game where players drag options to match the question.
 * Options must be dragged to a specific drop zone to answer the question.
 */
export default function DragAndDrop({ 
  question, 
  onAnswer, 
  timeLimit 
}: DragAndDropProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [draggedOption, setDraggedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Parse options from question
  const options = question.options || [];
  
  // Shuffle options to make it more challenging
  const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
  
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
  
  // Handle dropping an option
  const handleDrop = (option: string) => {
    if (selectedOption || timeLeft <= 0) return;
    
    // Calculate points based on time remaining
    const timeRatio = timeLeft / timeLimit;
    const points = Math.max(Math.round(150 * timeRatio), 50);
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Submit after showing feedback
    setTimeout(() => {
      onAnswer(option, points);
    }, 1500);
  };
  
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
      
      {/* Question */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.text}</h3>
        <p className="text-gray-600 text-sm">Drag your answer to the drop zone</p>
      </div>
      
      {/* Drop Zone */}
      <motion.div 
        className={`border-2 border-dashed rounded-lg p-6 mb-6 min-h-[100px] flex items-center justify-center ${
          draggedOption 
            ? 'border-primary-500 bg-primary-50' 
            : selectedOption 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300'
        }`}
        animate={{ 
          scale: draggedOption ? 1.02 : 1,
          borderWidth: draggedOption ? '3px' : '2px'
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedOption) {
            handleDrop(draggedOption);
          }
          setDraggedOption(null);
        }}
      >
        {selectedOption ? (
          <div className="text-center">
            <div className="font-semibold text-lg text-green-700">{selectedOption}</div>
            <div className="text-sm text-green-600">Answer submitted</div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            Drop your answer here
          </div>
        )}
      </motion.div>
      
      {/* Draggable Options */}
      <div className="grid grid-cols-2 gap-3">
        {shuffledOptions.map((option, index) => (
          <motion.div
            key={index}
            className={`p-3 rounded-lg border text-center cursor-grab ${
              draggedOption === option 
                ? 'opacity-30 border-primary-300' 
                : selectedOption 
                  ? 'opacity-50 border-gray-200' 
                  : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
            draggable={!selectedOption}
            whileHover={{ scale: selectedOption ? 1 : 1.02 }}
            onDragStart={() => setDraggedOption(option)}
            onDragEnd={() => setDraggedOption(null)}
          >
            <span className="font-medium">{option}</span>
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
                <p className="text-yellow-700">You didn't answer in time.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl mb-2">✓</div>
                <p className="text-lg font-bold text-green-700">Answer Submitted!</p>
                <p className="text-green-700">Your answer: {selectedOption}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}