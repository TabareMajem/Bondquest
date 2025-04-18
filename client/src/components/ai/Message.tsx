import { motion } from "framer-motion";

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 25, 
        mass: 0.8,
        delay: 0.1 
      } 
    }
  };

  const bubbleVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 20, 
        mass: 0.8,
        delay: 0.2 
      } 
    }
  };

  // Text animation variants for typing effect
  const textVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.4,
        delay: 0.3,
        ease: "easeIn" 
      } 
    }
  };

  if (isUser) {
    return (
      <motion.div 
        className="flex justify-end"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white rounded-2xl rounded-tr-none p-3 max-w-[85%] shadow-sm border border-gray-100"
          variants={bubbleVariants}
        >
          <motion.div variants={textVariants}>
            {renderText(text)}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-2 flex-shrink-0"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 300,
            delay: 0.1
          }
        }}
      >
        <span className="text-white text-xs">{getAssistantEmoji()}</span>
      </motion.div>
      <motion.div 
        className="bg-primary-100 rounded-2xl rounded-tl-none p-3 max-w-[85%] text-white"
        variants={bubbleVariants}
      >
        <motion.div variants={textVariants}>
          {renderText(text)}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
