interface AnswerOptionProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function AnswerOption({ text, isSelected, onClick }: AnswerOptionProps) {
  return (
    <button
      className={`w-full text-left ${
        isSelected
          ? "bg-primary-50 border-primary-500"
          : "bg-white hover:bg-gray-50 border-gray-200"
      } border rounded-xl p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div
          className={`w-5 h-5 rounded-full mr-3 ${
            isSelected
              ? "bg-primary-500"
              : "border-2 border-gray-300"
          } flex-shrink-0`}
        >
          {isSelected && (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          )}
        </div>
        <span className={`block ${isSelected ? "text-primary-700 font-medium" : "text-gray-700"}`}>
          {text}
        </span>
      </div>
    </button>
  );
}
