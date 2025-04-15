import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define personality types for our assistants
const PERSONALITIES = {
  casanova: {
    name: "Casanova",
    description: "A charming, romantic relationship coach focusing on passion and connection. Provides creative date ideas and romantic advice to spark and maintain passion in relationships."
  },
  venus: {
    name: "Venus",
    description: "An empathetic, nurturing relationship counselor focused on emotional intimacy and understanding. Provides thoughtful advice on communication and emotional connection."
  },
  aurora: {
    name: "Aurora",
    description: "A data-driven, analytical relationship scientist focusing on research-backed techniques. Provides practical, evidence-based relationship advice with a focus on metrics and outcomes."
  }
};

/**
 * Generate a response from the AI assistant based on the user's message and selected assistant type
 */
export async function generateAIResponse(userMessage: string, assistantType: string = "casanova"): Promise<string> {
  try {
    // Choose the appropriate personality
    const personality = PERSONALITIES[assistantType as keyof typeof PERSONALITIES] || PERSONALITIES.casanova;
    
    // Create the system message defining the AI's personality and role
    const systemMessage = `You are ${personality.name}, ${personality.description}
    
    When responding:
    1. Keep your responses concise (around 2-3 sentences, maximum 70 words)
    2. Be positive, encouraging, and constructive in your advice
    3. Offer specific, actionable suggestions that couples can try immediately
    4. Match your tone to your personality type: ${personality.name}
    5. If appropriate, occasionally suggest a follow-up question the user could ask
    6. Avoid generic advice - try to be specific and original
    
    The user is communicating through a relationship app called BondQuest, which helps couples strengthen their relationship through gamified activities, quizzes, and AI assistance.`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: systemMessage 
        },
        { 
          role: "user", 
          content: userMessage 
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content || "I'm not sure how to respond to that. Could you try asking in a different way?";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}

/**
 * Generate relationship insights based on quiz results
 */
export async function generateRelationshipInsights(quizResponses: Record<string, string>, category: string): Promise<string> {
  try {
    const systemMessage = `You are Aurora, a data-driven relationship scientist who provides insights based on quiz results.
    
    You are analyzing results from a "${category}" quiz. Based on the responses, provide:
    1. A brief, positive summary of what the responses indicate about the relationship (1-2 sentences)
    2. One specific strength revealed by these answers (1 sentence)
    3. One opportunity for growth (1 sentence)
    4. A single, specific action the couple can take this week (1 sentence)
    
    Keep your entire response under 100 words. Be encouraging but honest.`;

    // Format the quiz responses for the AI
    const formattedResponses = Object.entries(quizResponses)
      .map(([key, value]) => `Question ${key}: ${value}`)
      .join("\n");

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user  
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: systemMessage 
        },
        { 
          role: "user", 
          content: `Here are the quiz responses:\n${formattedResponses}` 
        }
      ],
      temperature: 0.6,
      max_tokens: 200
    });

    return response.choices[0].message.content || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Error generating relationship insights:", error);
    return "We couldn't analyze your results at this moment. Please try again later.";
  }
}