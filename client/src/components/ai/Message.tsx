interface MessageProps {
  text: string;
  isUser: boolean;
  assistantType?: "casanova" | "venus" | "aurora";
}

export default function Message({ text, isUser, assistantType = "casanova" }: MessageProps) {
  // Helper to get the assistant emoji based on assistant type
  const getAssistantEmoji = () => {
    switch (assistantType) {
      case "casanova":
        return "👨‍🎤";
      case "venus":
        return "👩‍🚀";
      case "aurora":
        return "🤖";
      default:
        return "👨‍🎤";
    }
  };

  // Split suggestion buttons from the text
  const renderText = (text: string) => {
    // Check if the text contains a suggestion pattern like "I've got just the thing!"
    if (text.includes("I've got just the thing") || text.includes("suggestion") || text.includes("try this")) {
      // Simple pattern matching for suggestions (this could be more sophisticated in a real app)
      const suggestions = [
        "Give me more ideas like this",
        "We need help with communication",
        "Tell me more about quality time"
      ];

      return (
        <>
          <p className="text-primary-900">{text}</p>
          <div className="mt-3 space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="bg-white text-primary-600 border border-primary-200 rounded-full px-3 py-1 text-sm font-medium hover:bg-primary-50 transition-colors w-full text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </>
      );
    }

    return <p className={isUser ? "text-gray-700" : "text-primary-900"}>{text}</p>;
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-white rounded-2xl rounded-tr-none p-3 max-w-[85%] shadow-sm border border-gray-100">
          {renderText(text)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-2 flex-shrink-0">
        <span className="text-white text-xs">{getAssistantEmoji()}</span>
      </div>
      <div className="bg-primary-100 rounded-2xl rounded-tl-none p-3 max-w-[85%] text-white">
        {renderText(text)}
      </div>
    </div>
  );
}
