import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Request } from 'express';
import { ConversationMessage, InsertConversationMessage, InsertConversationSession, InsertProfileInsight, ProfileInsight } from '@shared/schema';
import { db } from './db';
import { conversationMessages, conversationSessions, profileInsights } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Gemini API
let googleAI: GoogleGenerativeAI;

export function initializeGeminiAPI(apiKey: string) {
  googleAI = new GoogleGenerativeAI(apiKey);
}

// Safety settings for model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Generation configs
const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// Create a new conversation session
export async function createConversationSession(sessionData: InsertConversationSession) {
  const [newSession] = await db
    .insert(conversationSessions)
    .values(sessionData)
    .returning();
  
  return newSession;
}

// Add a message to a conversation
export async function addConversationMessage(messageData: InsertConversationMessage) {
  const [newMessage] = await db
    .insert(conversationMessages)
    .values(messageData)
    .returning();
  
  return newMessage;
}

// Get all messages for a conversation session
export async function getConversationMessages(sessionId: number) {
  const messages = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.sessionId, sessionId))
    .orderBy(conversationMessages.timestamp);
  
  return messages;
}

// Save an insight extracted from conversation
export async function saveProfileInsight(insightData: InsertProfileInsight): Promise<ProfileInsight> {
  const [newInsight] = await db
    .insert(profileInsights)
    .values(insightData)
    .returning();
  
  return newInsight;
}

// Format messages for Gemini chat history
function formatMessagesForGemini(messages: ConversationMessage[]) {
  return messages.map(msg => {
    // Map our roles to Gemini roles
    const role = msg.sender === 'user' 
      ? 'user' 
      : msg.sender === 'ai' 
        ? 'model' 
        : 'system';
    
    return {
      role,
      parts: [{ text: msg.message }],
    };
  });
}

// Generate AI response using Gemini Pro
export async function generateGeminiResponse(
  sessionId: number, 
  userMessage: string,
  systemContext?: string
): Promise<string> {
  if (!googleAI) {
    throw new Error('Gemini API not initialized. Call initializeGeminiAPI first.');
  }

  // Get conversation history
  const messageHistory = await getConversationMessages(sessionId);
  
  // Create a formatted history for Gemini
  const formattedHistory = formatMessagesForGemini(messageHistory);
  
  // Add system context if provided
  if (systemContext) {
    formattedHistory.unshift({
      role: 'system',
      parts: [{ text: systemContext }],
    });
  }
  
  // Add the current user message
  formattedHistory.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  try {
    // Get the model
    const model = googleAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings, 
      generationConfig
    });

    // Generate chat response
    const chat = model.startChat({
      history: formattedHistory,
      safetySettings,
      generationConfig,
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const responseText = response.text();
    
    return responseText;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

// Extract profile insights from conversation
export async function extractProfileInsightsFromConversation(
  sessionId: number,
  userId: number
): Promise<ProfileInsight[]> {
  if (!googleAI) {
    throw new Error('Gemini API not initialized. Call initializeGeminiAPI first.');
  }
  
  // Get all messages from the conversation
  const messages = await getConversationMessages(sessionId);
  const conversationText = messages
    .map(msg => `${msg.sender}: ${msg.message}`)
    .join('\n');
    
  const extractionPrompt = `
    Based on the following conversation, extract key insights about this person's profile, 
    preferences, personality traits, relationship style, and goals. Format the response as 
    a JSON array of objects, each with the following structure:
    {
      "insightType": "preference" | "personality" | "relationship" | "goal",
      "insight": "The actual insight text here",
      "confidenceScore": 0-100 (how confident you are about this insight)
    }

    Conversation:
    ${conversationText}
  `;
  
  try {
    // Get the model
    const model = googleAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings,
      generationConfig
    });
    
    const result = await model.generateContent(extractionPrompt);
    const response = result.response;
    const responseText = response.text();
    
    // Parse JSON response
    let insightsArray = [];
    try {
      insightsArray = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse insights response:', parseError);
      return [];
    }
    
    // Save each insight to the database
    const savedInsights = [];
    for (const insightData of insightsArray) {
      try {
        const savedInsight = await saveProfileInsight({
          userId,
          insightType: insightData.insightType,
          insight: insightData.insight,
          confidenceScore: insightData.confidenceScore,
          sourceSessionIds: [sessionId],
        });
        savedInsights.push(savedInsight);
      } catch (saveError) {
        console.error('Failed to save insight:', saveError);
      }
    }
    
    return savedInsights;
  } catch (error) {
    console.error('Error extracting insights:', error);
    return [];
  }
}

// Generate onboarding conversation prompts based on stage
export function getOnboardingPrompt(stage: string) {
  const prompts: Record<string, string> = {
    welcome: `
      You are BondBuddy, a friendly and empathetic relationship assistant. You're helping a new user
      get started with BondQuest, a gamified relationship app. You should warmly welcome them and explain
      that you'll be asking some questions to help personalize their experience.

      Make the conversation feel natural and authentic. Ask one question at a time, listen carefully to
      their responses, and follow up with relevant questions.
      
      Start by introducing yourself and explaining how this conversation will help create a personalized
      experience for them and their partner. Ask for their first name to begin.
    `,
    
    personal: `
      Now you're helping build the user's personal profile. Ask them questions about:
      - Their favorite activities to do alone and with their partner
      - What they value most in a relationship
      - Their love language and communication style
      - Their hobbies and interests

      Keep the conversation natural by asking follow-up questions based on their responses.
      Aim to get deep, meaningful information rather than surface-level answers.
    `,
    
    relationship: `
      Now you're learning about their relationship with their partner. Ask them questions about:
      - How they met their partner
      - What they admire most about their partner
      - Their biggest relationship challenges
      - Their shared goals and dreams
      - How they resolve conflicts
      - Their favorite memories together

      Adapt your questions based on their relationship status (dating, engaged, married, etc.)
      and the length of their relationship.
    `,
    
    goals: `
      Now you're exploring what they hope to achieve with BondQuest. Ask them questions about:
      - Areas of their relationship they want to strengthen
      - Communication challenges they'd like to overcome
      - Types of activities they'd enjoy with their partner
      - How they envision using the app together
      
      Make them feel excited about the journey they're about to begin.
    `,
    
    conclusion: `
      Wrap up the conversation positively. Summarize what you've learned about them
      and express enthusiasm about helping them strengthen their relationship through
      BondQuest. Explain that based on this conversation, the app will create personalized
      quizzes, challenges, and insights for them and their partner.
      
      Thank them for sharing and let them know they can chat with you anytime for
      relationship advice.
    `,
  };
  
  return prompts[stage] || prompts.welcome;
}