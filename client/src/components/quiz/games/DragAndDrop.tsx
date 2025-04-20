import { useState, useEffect } from 'react';
import { Question } from '@shared/schema';
import { motion } from 'framer-motion';

interface DragItem {
  id: string;
  content: string;
  isPlaced: boolean;
}

interface DropZone {
  id: string;
  label: string;
  itemId: string | null;
}

interface DragAndDropProps {
  question: Question;
  onAnswer: (answer: string, points: number) => void;
  timeLimit: number; // in seconds
}

/**
 * DragAndDrop is an interactive quiz format where users must drag items to their
 * correct positions. This promotes more thoughtful and physical engagement with the content.
 */
export default function DragAndDrop({ 
  question, 
  onAnswer, 
  timeLimit = 20 
}: DragAndDropProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [dragItems, setDragItems] = useState<DragItem[]>([]);
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  // Set up the drag and drop game based on question options
  useEffect(() => {
    if (question.options && question.options.length >= 2) {
      // Create drag items from options
      const items: DragItem[] = question.options.map((option, index) => ({
        id: `item-${index}`,
        content: option,
        isPlaced: false
      }));
      
      // Create matching drop zones
      const zones: DropZone[] = question.options.map((option, index) => ({
        id: `zone-${index}`,
        label: `Option ${index + 1}`,
        itemId: null
      }));
      
      // Shuffle the drag items for randomness
      setDragItems([...items].sort(() => Math.random() - 0.5));
      setDropZones(zones);
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
  
  // Check if all items are placed
  useEffect(() => {
    if (dragItems.length > 0 && dragItems.every(item => item.isPlaced) && !gameCompleted) {
      setGameCompleted(true);
      
      // Calculate result and score
      const matches = dropZones.filter(zone => {
        if (!zone.itemId) return false;
        const itemIndex = parseInt(zone.itemId.split('-')[1]);
        const zoneIndex = parseInt(zone.id.split('-')[1]);
        return itemIndex === zoneIndex;
      }).length;
      
      const matchPercentage = (matches / dropZones.length) * 100;
      
      // Calculate points based on matches and time left
      const basePoints = Math.round((matchPercentage / 100) * 20); // Up to 20 points for correctness
      const timeBonus = Math.round(timeLeft * 0.5); // Bonus for speed
      const totalPoints = basePoints + timeBonus;
      
      // Use a timeout to allow animations to complete
      setTimeout(() => {
        onAnswer(`drag_drop_completed: ${matchPercentage}% match`, Math.max(5, totalPoints));
      }, 1000);
    }
  }, [dragItems, dropZones, timeLeft, gameCompleted, onAnswer]);
  
  // Start dragging an item
  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };
  
  // Handle dropping an item onto a zone
  const handleDrop = (zoneId: string) => {
    if (!draggedItem) return;
    
    // Check if zone already has an item
    const zoneWithItem = dropZones.find(zone => zone.id === zoneId);
    if (zoneWithItem && zoneWithItem.itemId) {
      // Zone already has an item, swap with the dragged item
      const oldItemId = zoneWithItem.itemId;
      
      // Update the new zone with the dragged item
      setDropZones(zones => zones.map(zone => 
        zone.id === zoneId ? { ...zone, itemId: draggedItem } : zone
      ));
      
      // Update the old item's isPlaced status
      setDragItems(items => items.map(item => 
        item.id === oldItemId ? { ...item, isPlaced: false } : item
      ));
      
      // Update the dragged item's isPlaced status
      setDragItems(items => items.map(item => 
        item.id === draggedItem ? { ...item, isPlaced: true } : item
      ));
    } else {
      // Empty zone, just place the item
      setDropZones(zones => zones.map(zone => 
        zone.id === zoneId ? { ...zone, itemId: draggedItem } : zone
      ));
      
      // Update the dragged item's isPlaced status
      setDragItems(items => items.map(item => 
        item.id === draggedItem ? { ...item, isPlaced: true } : item
      ));
    }
    
    setDraggedItem(null);
  };
  
  // End the game early
  const endGame = () => {
    if (gameCompleted) return;
    
    setGameCompleted(true);
    
    // Count placed items
    const placedCount = dragItems.filter(item => item.isPlaced).length;
    const placementScore = Math.round((placedCount / dragItems.length) * 10);
    
    onAnswer('drag_drop_time_up', Math.max(0, placementScore));
  };
  
  // Return a zone's background color based on completion state
  const getZoneColor = (zone: DropZone) => {
    if (!gameCompleted || !zone.itemId) return 'bg-gray-100 border-dashed border-gray-300';
    
    // Get indices to check for correct placement
    const itemIndex = parseInt(zone.itemId.split('-')[1]);
    const zoneIndex = parseInt(zone.id.split('-')[1]);
    
    // Check if placement is correct
    if (itemIndex === zoneIndex) {
      return 'bg-green-100 border-green-300';
    } else {
      return 'bg-red-100 border-red-300';
    }
  };
  
  // Get the item displayed in a zone (if any)
  const getZoneItem = (zone: DropZone) => {
    if (!zone.itemId) return null;
    return dragItems.find(item => item.id === zone.itemId);
  };
  
  return (
    <div className="quiz-game drag-and-drop">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold mb-2">{question.text || "Drag options to match"}</h2>
        <p className="text-gray-500 text-sm">Drag items to their matching spots</p>
      </div>
      
      {/* Timer */}
      <div className="flex justify-center mb-4">
        <div className="px-4 py-2 bg-gray-100 rounded-full">
          <span className={`font-medium ${
            timeLeft > timeLimit * 0.66 ? 'text-green-500' :
            timeLeft > timeLimit * 0.33 ? 'text-orange-500' :
            'text-red-500'
          }`}>
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
            {String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side: Drag items */}
        <div className="w-full md:w-1/2 space-y-2">
          <h3 className="text-center text-sm font-medium text-gray-600 mb-2">Options</h3>
          {dragItems.map((item) => (
            <motion.div
              key={item.id}
              className={`p-3 rounded-lg border-2 select-none ${
                item.isPlaced ? 'opacity-50 bg-gray-100 border-gray-200' : 'bg-white border-primary-200'
              } ${
                draggedItem === item.id ? 'border-primary-500 shadow-lg' : ''
              }`}
              drag={!item.isPlaced}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={1}
              onDragStart={() => handleDragStart(item.id)}
              whileDrag={{ scale: 1.05, zIndex: 10 }}
              whileHover={{ scale: !item.isPlaced ? 1.02 : 1 }}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-2">
                  <span className="text-xs">{parseInt(item.id.split('-')[1]) + 1}</span>
                </div>
                <span className="text-gray-800">{item.content}</span>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Right side: Drop zones */}
        <div className="w-full md:w-1/2 space-y-2">
          <h3 className="text-center text-sm font-medium text-gray-600 mb-2">Place Here</h3>
          {dropZones.map((zone) => (
            <motion.div
              key={zone.id}
              className={`p-3 rounded-lg border-2 h-16 flex items-center justify-center ${getZoneColor(zone)}`}
              whileHover={{ scale: 1.02 }}
              onHoverStart={() => {
                if (draggedItem) handleDrop(zone.id);
              }}
            >
              {getZoneItem(zone) ? (
                <div className="w-full flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-2">
                    <span className="text-xs">{parseInt(getZoneItem(zone)!.id.split('-')[1]) + 1}</span>
                  </div>
                  <span className="text-gray-800">{getZoneItem(zone)!.content}</span>
                </div>
              ) : (
                <span className="text-gray-400">Drop answer here</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Submit button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={endGame}
          className={`px-6 py-2 rounded-full ${
            dragItems.every(item => item.isPlaced)
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
          disabled={gameCompleted}
        >
          {dragItems.every(item => item.isPlaced) ? 'Submit' : 'Skip'}
        </button>
      </div>
    </div>
  );
}