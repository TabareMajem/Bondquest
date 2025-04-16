import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "", // Fallback to OpenAI if no API key
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

/**
 * Generate a complete quiz with questions and answers based on user inputs
 */
export async function generateQuiz(
  topic: string,
  category: string,
  difficulty: string,
  questionCount: number,
  additionalInstructions?: string
): Promise<any> {
  try {
    // Try to use Anthropic first, fall back to OpenAI if no API key
    if (process.env.ANTHROPIC_API_KEY) {
      return await generateQuizWithAnthropic(topic, category, difficulty, questionCount, additionalInstructions);
    } else {
      return await generateQuizWithOpenAI(topic, category, difficulty, questionCount, additionalInstructions);
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
}

/**
 * Generate a quiz using Anthropic's Claude model
 */
async function generateQuizWithAnthropic(
  topic: string,
  category: string,
  difficulty: string,
  questionCount: number,
  additionalInstructions?: string
): Promise<any> {
  const prompt = `
  You are an expert in creating relationship quizzes for couples. I need you to generate a complete quiz about "${topic}" in the category "${category}" with ${questionCount} questions of ${difficulty} difficulty.

  ${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ''}

  Please create a detailed quiz with the following structure:
  1. A engaging title for the quiz (be creative and appealing)
  2. A brief description explaining what the quiz is about and what couples will learn
  3. A list of ${questionCount} questions with 4 possible answers each
  
  The output should be valid JSON with the following structure:
  {
    "title": "The engaging title",
    "description": "Description of what couples will learn",
    "category": "${category}",
    "type": "multiplayer",
    "difficulty": "${difficulty}",
    "duration": 10,
    "points": 100,
    "questions": [
      {
        "text": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"]
      }
      // Additional questions...
    ]
  }

  Make sure all questions are relationship-focused, engaging, and appropriate for couples looking to strengthen their bond. The questions should be thought-provoking and lead to meaningful discussions.
  `;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      temperature: 0.7,
      system: "You are an expert relationship quiz creator for a couple's app called BondQuest. You generate high-quality, engaging quizzes that help couples strengthen their relationships.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Extract and parse the JSON response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to generate valid quiz format");
    }
    
    const quizData = JSON.parse(jsonMatch[0]);
    return quizData;
  } catch (error) {
    console.error("Error with Anthropic:", error);
    // Fallback to OpenAI if Anthropic fails
    return await generateQuizWithOpenAI(topic, category, difficulty, questionCount, additionalInstructions);
  }
}

/**
 * Generate a quiz using OpenAI's GPT-4 model
 */
async function generateQuizWithOpenAI(
  topic: string,
  category: string,
  difficulty: string,
  questionCount: number,
  additionalInstructions?: string
): Promise<any> {
  const systemMessage = `
  You are an expert in creating relationship quizzes for couples. Your task is to generate a complete quiz in JSON format.
  The quiz should be engaging, thoughtful, and help couples learn more about each other or strengthen their relationship.
  `;

  const userMessage = `
  Please create a relationship quiz with the following parameters:
  - Topic: ${topic}
  - Category: ${category}
  - Difficulty: ${difficulty}
  - Number of questions: ${questionCount}
  ${additionalInstructions ? `- Additional instructions: ${additionalInstructions}` : ''}

  The response must be a valid JSON object with this exact structure:
  {
    "title": "Engaging title for the quiz",
    "description": "Brief description of what couples will learn",
    "category": "${category}",
    "type": "multiplayer",
    "difficulty": "${difficulty}",
    "duration": 10,
    "points": 100,
    "questions": [
      {
        "text": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"]
      }
      // More questions...
    ]
  }

  Ensure all questions are relationship-focused, engaging, and appropriate for couples looking to strengthen their bond.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2500
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);
    throw new Error("Generated quiz was in an invalid format. Please try again.");
  }
}

/**
 * Generate a competition with details, rules, and challenges
 */
export async function generateCompetition(
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  difficulty: string,
  type: string,
  additionalInstructions?: string
): Promise<any> {
  try {
    // Try to use Anthropic first, fall back to OpenAI if no API key
    if (process.env.ANTHROPIC_API_KEY) {
      return await generateCompetitionWithAnthropic(
        name, description, startDate, endDate, difficulty, type, additionalInstructions
      );
    } else {
      return await generateCompetitionWithOpenAI(
        name, description, startDate, endDate, difficulty, type, additionalInstructions
      );
    }
  } catch (error) {
    console.error("Error generating competition:", error);
    throw new Error("Failed to generate competition. Please try again.");
  }
}

/**
 * Generate a competition using Anthropic's Claude model
 */
async function generateCompetitionWithAnthropic(
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  difficulty: string,
  type: string,
  additionalInstructions?: string
): Promise<any> {
  const prompt = `
  You are an expert in creating relationship competitions and challenges for couples. I need you to generate a complete competition with the following details:
  - Name: ${name}
  - Description: ${description}
  - Start Date: ${startDate}
  - End Date: ${endDate}
  - Difficulty: ${difficulty}
  - Type: ${type}
  ${additionalInstructions ? `- Additional instructions: ${additionalInstructions}` : ''}

  Please create a detailed competition with the following structure in JSON format:
  {
    "name": "${name}",
    "description": "${description}",
    "startDate": "${startDate}",
    "endDate": "${endDate}",
    "status": "upcoming",
    "difficulty": "${difficulty}",
    "type": "${type}",
    "imageUrl": null,
    "maxParticipants": 50,
    "participantCount": 0,
    "rules": ["Rule 1", "Rule 2", "Rule 3", ...],
    "rewardsDescription": "Description of the rewards",
    "scoringMethods": ["Method 1: points for X", "Method 2: points for Y", ...],
    "challenges": [
      {
        "title": "Challenge title",
        "description": "Description of the challenge",
        "pointValue": 100
      },
      // More challenges...
    ]
  }

  Ensure the competition is engaging, appropriate for couples, and focuses on strengthening relationships.
  The challenge should be fun but also meaningful, helping couples grow together.
  `;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      temperature: 0.7,
      system: "You are an expert competition creator for a couple's app called BondQuest. You generate high-quality, engaging competitions that help couples strengthen their relationships through fun challenges.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Extract and parse the JSON response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to generate valid competition format");
    }
    
    const competitionData = JSON.parse(jsonMatch[0]);
    return competitionData;
  } catch (error) {
    console.error("Error with Anthropic:", error);
    // Fallback to OpenAI if Anthropic fails
    return await generateCompetitionWithOpenAI(
      name, description, startDate, endDate, difficulty, type, additionalInstructions
    );
  }
}

/**
 * Generate a competition using OpenAI's GPT-4 model
 */
async function generateCompetitionWithOpenAI(
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  difficulty: string,
  type: string,
  additionalInstructions?: string
): Promise<any> {
  const systemMessage = `
  You are an expert in creating relationship competitions and challenges for couples. 
  Your task is to generate a complete competition in JSON format.
  The competition should be engaging, appropriate for couples, and help strengthen their relationship.
  `;

  const userMessage = `
  Please create a relationship competition with the following parameters:
  - Name: ${name}
  - Description: ${description}
  - Start Date: ${startDate}
  - End Date: ${endDate}
  - Difficulty: ${difficulty}
  - Type: ${type}
  ${additionalInstructions ? `- Additional instructions: ${additionalInstructions}` : ''}

  The response must be a valid JSON object with this exact structure:
  {
    "name": "${name}",
    "description": "${description}",
    "startDate": "${startDate}",
    "endDate": "${endDate}",
    "status": "upcoming",
    "difficulty": "${difficulty}",
    "type": "${type}",
    "imageUrl": null,
    "maxParticipants": 50,
    "participantCount": 0,
    "rules": ["Rule 1", "Rule 2", "Rule 3", ...],
    "rewardsDescription": "Description of the rewards",
    "scoringMethods": ["Method 1: points for X", "Method 2: points for Y", ...],
    "challenges": [
      {
        "title": "Challenge title",
        "description": "Description of the challenge",
        "pointValue": 100
      },
      // More challenges...
    ]
  }

  Ensure the competition is engaging, appropriate for couples, and focuses on strengthening relationships.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2500
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);
    throw new Error("Generated competition was in an invalid format. Please try again.");
  }
}