import { PlusIcon, MessageCircle, SmileIcon, ZapIcon, X } from "lucide-react";
import { useState } from "react";

interface QuickAccessButtonsProps {
  onAIAssistantClick: () => void;
  onStartQuizClick: () => void;
  onCheckInClick: () => void;
}

export default function QuickAccessButtons({
  onAIAssistantClick,
  onStartQuizClick,
  onCheckInClick,
}: QuickAccessButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleButtons = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-20 right-6 flex flex-col-reverse items-center space-y-reverse space-y-3">
      {/* Main Button */}
      <button
        className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg flex items-center justify-center z-10 border-2 border-white/20 transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={toggleButtons}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <PlusIcon className="w-6 h-6" />
        )}
      </button>

      {/* Quick Action Buttons */}
      <div 
        className={`absolute bottom-16 right-0 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl transform transition-all duration-500 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-3 items-center p-1">
          <button
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg flex items-center justify-center border border-white/20 transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={onAIAssistantClick}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -left-20 whitespace-nowrap bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">AI Assistant</span>
          </button>

          <button
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg flex items-center justify-center border border-white/20 transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={onCheckInClick}
          >
            <SmileIcon className="w-6 h-6" />
          </button>

          <button
            className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg flex items-center justify-center border border-white/20 transition-transform duration-200 hover:scale-105 active:scale-95"
            onClick={onStartQuizClick}
          >
            <ZapIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Button Labels (visible when open) */}
      <div 
        className={`absolute bottom-[70px] right-20 transform transition-all duration-500 ${
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-[46px] items-start py-2">
          <span className="text-white text-sm font-medium bg-blue-500/70 backdrop-blur-sm px-3 py-1 rounded-full">AI Assistant</span>
          <span className="text-white text-sm font-medium bg-yellow-500/70 backdrop-blur-sm px-3 py-1 rounded-full">Daily Check-In</span>
          <span className="text-white text-sm font-medium bg-green-500/70 backdrop-blur-sm px-3 py-1 rounded-full">Start Quiz</span>
        </div>
      </div>
    </div>
  );
}
