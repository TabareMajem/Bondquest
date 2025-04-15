import { Button } from "@/components/ui/button";
import { HeartPulse } from "lucide-react";
import { Quiz } from "@shared/schema";

interface DailyQuizCardProps {
  quiz?: Quiz;
  isLoading?: boolean;
  onClick?: () => void;
}

export default function DailyQuizCard({ quiz, isLoading, onClick }: DailyQuizCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg -mb-10 relative z-10" style={{ boxShadow: "0 8px 20px rgba(126, 34, 206, 0.2)" }}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <HeartPulse className="w-5 h-5 text-secondary-600 mr-2" />
          <h3 className="font-semibold text-primary-900">Daily Quiz</h3>
        </div>
        <Button
          onClick={onClick}
          disabled={isLoading}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1 px-4 rounded-full text-sm transition-colors"
        >
          START
        </Button>
      </div>
      {isLoading ? (
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
      ) : (
        <p className="text-gray-500 text-sm">{quiz?.title || "How Well Do You Know Me?"}</p>
      )}
    </div>
  );
}
