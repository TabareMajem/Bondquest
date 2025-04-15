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
          <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 20L4.3 12.3C3.45 11.45 3 10.3 3 9.1C3 7.9 3.45 6.75 4.3 5.9C5.15 5.05 6.3 4.6 7.5 4.6C8.7 4.6 9.85 5.05 10.7 5.9L12 7.2L13.3 5.9C14.15 5.05 15.3 4.6 16.5 4.6C17.7 4.6 18.85 5.05 19.7 5.9C20.55 6.75 21 7.9 21 9.1C21 10.3 20.55 11.45 19.7 12.3L12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 10C8 10.5523 7.55228 11 7 11C6.44772 11 6 10.5523 6 10C6 9.44772 6.44772 9 7 9C7.55228 9 8 9.44772 8 10Z" fill="currentColor"/>
            <path d="M18 10C18 10.5523 17.5523 11 17 11C16.4477 11 16 10.5523 16 10C16 9.44772 16.4477 9 17 9C17.5523 9 18 9.44772 18 10Z" fill="currentColor"/>
          </svg>
        );
      case "memory_lane":
        return (
          // Vinyl record icon for "Relationship Remix"
          <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 10V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="1 2"/>
          </svg>
        );
      case "daily_habits":
        return (
          // Coffee cup icon for "Morning Routines"
          <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 11H16C17.1046 11 18 11.8954 18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 15H20C21.1046 15 22 14.1046 22 13V13C22 11.8954 21.1046 11 20 11H18" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 8V5C7 4.44772 7.44772 4 8 4H13C13.5523 4 14 4.44772 14 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      default:
        return (
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
      <div className="flex items-center gap-4">
        <div className="quiz-card-icon">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{quiz.title}</h3>
          <p className="text-white text-opacity-90 text-sm">{quiz.description}</p>
          
          <div className="flex gap-3 mt-3">
            <div className="flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
              <svg className="w-4 h-4 text-white mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white text-sm">{quiz.duration} min</span>
            </div>
            <div className="flex items-center bg-yellow-400 bg-opacity-20 rounded-full px-3 py-1">
              <svg className="w-4 h-4 text-yellow-300 mr-1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12.31 6.38c-.37-.34-.95-.34-1.32 0l-3.03 2.77c-.4.37-.46.99-.13 1.42.14.19.35.32.59.36.23.04.48-.01.68-.14L12 8.59l2.9 2.19c.2.14.45.19.68.14.24-.04.45-.17.59-.36.33-.43.28-1.05-.13-1.42l-3.03-2.76zM12.31 11.53c-.37-.34-.95-.34-1.32 0l-3.03 2.77c-.4.37-.46.99-.13 1.42.14.19.35.32.59.36.23.04.48-.01.68-.14L12 13.74l2.9 2.19c.2.14.45.19.68.14.24-.04.45-.17.59-.36.33-.43.28-1.05-.13-1.42l-3.03-2.76z"/>
              </svg>
              <span className="text-white text-sm">+{quiz.points} pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
