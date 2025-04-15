import { Quiz } from "@shared/schema";

interface QuizCardProps {
  quiz: Quiz;
  onClick: () => void;
}

export default function QuizCard({ quiz, onClick }: QuizCardProps) {
  // Helper to determine gradient class based on quiz category
  const getGradientClass = () => {
    switch (quiz.category) {
      case "couple_vs_couple":
        return "gradient-card-1";
      case "partner_vs_partner":
        return "gradient-card-2";
      case "memory_lane":
        return "gradient-card-3";
      case "daily_habits":
        return "gradient-card-4";
      default:
        return "gradient-card-1";
    }
  };

  // Helper to determine icon based on quiz category
  const getIcon = () => {
    // Custom icons based on category to match the design
    switch (quiz.category) {
      case "couple_vs_couple":
        return (
          // Game controller icon for Trivia Showdown
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 11H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 12H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 10H18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.32 5H6.68C4.35 5 2.7 6.95 3.11 9.23L4.57 18.47C4.87 20.22 6.37 21.47 8.15 21.47H15.85C17.63 21.47 19.13 20.22 19.43 18.47L20.89 9.23C21.3 6.95 19.65 5 17.32 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case "partner_vs_partner":
        return (
          // Heart with question marks for "How Well Do You Know Each Other"
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 20L4.3 12.3C3.45 11.45 3 10.3 3 9.1C3 7.9 3.45 6.75 4.3 5.9C5.15 5.05 6.3 4.6 7.5 4.6C8.7 4.6 9.85 5.05 10.7 5.9L12 7.2L13.3 5.9C14.15 5.05 15.3 4.6 16.5 4.6C17.7 4.6 18.85 5.05 19.7 5.9C20.55 6.75 21 7.9 21 9.1C21 10.3 20.55 11.45 19.7 12.3L12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10C8 10.5523 7.55228 11 7 11C6.44772 11 6 10.5523 6 10C6 9.44772 6.44772 9 7 9C7.55228 9 8 9.44772 8 10Z" fill="currentColor"/>
            <path d="M18 10C18 10.5523 17.5523 11 17 11C16.4477 11 16 10.5523 16 10C16 9.44772 16.4477 9 17 9C17.5523 9 18 9.44772 18 10Z" fill="currentColor"/>
          </svg>
        );
      case "memory_lane":
        return (
          // Vinyl record icon for "Relationship Remix"
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 10V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="1 2"/>
          </svg>
        );
      case "daily_habits":
        return (
          // Coffee cup icon for "Morning Routines"
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 11H16C17.1046 11 18 11.8954 18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 15H20C21.1046 15 22 14.1046 22 13V13C22 11.8954 21.1046 11 20 11H18" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 8V5C7 4.44772 7.44772 4 8 4H13C13.5523 4 14 4.44772 14 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  return (
    <div 
      className={`card rounded-2xl p-5 shadow-lg cursor-pointer transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ${getGradientClass()}`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="mr-4">
          <div className="quiz-card-icon">
            {getIcon()}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{quiz.title}</h3>
          <p className="text-white text-opacity-90 text-sm mb-3">{quiz.description}</p>
          
          <div className="flex gap-2 mt-2">
            <div className="quiz-duration-badge">
              <svg className="w-4 h-4 text-white mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white text-sm">{quiz.duration} min</span>
            </div>
            <div className="quiz-points-badge">
              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 6.833 6 8c0 1.167.602 1.766 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 13.167 14 12c0-1.167-.602-1.766-1.324-2.246-.48-.32-1.054-.545-1.676-.662V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-white text-sm">+{quiz.points} pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
