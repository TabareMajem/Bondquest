import { PlusIcon, MessageCircle, SmileIcon, ZapIcon } from "lucide-react";
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
        className="w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center z-10"
        onClick={toggleButtons}
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        ) : (
          <PlusIcon className="w-6 h-6" />
        )}
      </button>

      {/* Quick Action Buttons */}
      <button
        className={`w-10 h-10 rounded-full bg-secondary-500 text-white shadow-lg flex items-center justify-center transform transition-all duration-200 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        onClick={onAIAssistantClick}
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      <button
        className={`w-10 h-10 rounded-full bg-accent-500 text-gray-800 shadow-lg flex items-center justify-center transform transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        onClick={onCheckInClick}
      >
        <SmileIcon className="w-5 h-5" />
      </button>

      <button
        className={`w-10 h-10 rounded-full bg-primary-400 text-white shadow-lg flex items-center justify-center transform transition-all duration-400 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        onClick={onStartQuizClick}
      >
        <ZapIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
