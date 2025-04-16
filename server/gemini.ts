import { GoogleGenerativeAI, GenerativeModel, EnhancedGenerateContentResponse } from '@google/generative-ai';
import { db } from './db';
import { 
  conversationSessions, 
  conversationMessages, 
  profileInsights,
  InsertConversationSession,
  InsertConversationMessage,
  ConversationMessage,
  InsertProfileInsight,
  ProfileInsight
} from '@shared/schema';
import { eq } from 'drizzle-orm';

// GoogleAI instance
let googleAI: GoogleGenerativeAI;
let geminiModel: GenerativeModel;

/**
 * Initialize the Gemini AI API with the provided API key
 */
export function initializeGeminiAPI(apiKey: string) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }
  
  googleAI = new GoogleGenerativeAI(apiKey);
  
  // Try various model names to find one that works with the current API
  const modelOptions = [
    'gemini-pro',          // Standard naming
    'gemini-1.0-pro',      // Alternative with version
    'models/gemini-pro',   // Full path
    'gemini-pro-vision',   // Vision capability
    'models/gemini-1.5-pro', // Newer version
    'gemini-1.5-pro'       // Newer version without path
  ];
  
  let modelInitialized = false;
  
  // Try each model until one works
  for (const modelName of modelOptions) {
    if (modelInitialized) break;
    
    try {
      console.log(`Attempting to initialize Gemini API with model: ${modelName}`);
      geminiModel = googleAI.getGenerativeModel({ model: modelName });
      console.log(`Gemini API initialized successfully with model: ${modelName}`);
      modelInitialized = true;
    } catch (error) {
      console.error(`Error initializing Gemini model ${modelName}:`, error);
    }
  }
  
  if (!modelInitialized) {
    console.warn('None of the model options worked. Using fallback mechanism for all responses.');
  }
}

/**
 * Create a new conversation session
 */
export async function createConversationSession(sessionData: InsertConversationSession) {
  const [session] = await db
    .insert(conversationSessions)
    .values({
      userId: sessionData.userId,
      sessionType: sessionData.sessionType,
      status: sessionData.status,
      metadata: sessionData.metadata || {},
      startedAt: new Date(),
    })
    .returning();
  
  return session;
}

/**
 * Add a message to a conversation session
 */
export async function addConversationMessage(messageData: InsertConversationMessage) {
  const [message] = await db
    .insert(conversationMessages)
    .values({
      sessionId: messageData.sessionId,
      message: messageData.message,
      sender: messageData.sender,
      messageType: messageData.messageType || 'text',
      timestamp: new Date(),
      contentTags: messageData.contentTags || null,
      sentiment: messageData.sentiment || null,
      extractedInsights: messageData.extractedInsights || null
    })
    .returning();
  
  return message;
}

/**
 * Get all messages for a conversation session
 */
export async function getConversationMessages(sessionId: number) {
  const messages = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.sessionId, sessionId))
    .orderBy(conversationMessages.timestamp);
  
  return messages;
}

/**
 * Save a profile insight extracted from conversation
 */
export async function saveProfileInsight(insightData: InsertProfileInsight): Promise<ProfileInsight> {
  const [insight] = await db
    .insert(profileInsights)
    .values({
      userId: insightData.userId,
      insightType: insightData.insightType,
      insight: insightData.insight,
      confidenceScore: insightData.confidenceScore || 'medium',
      createdAt: new Date(),
      source: 'conversation',
      metadata: insightData.metadata || {}
    })
    .returning();
  
  return insight;
}

/**
 * Format messages for the Gemini API
 * Note: Gemini requires that the first message must have 'user' role
 */
function formatMessagesForGemini(messages: ConversationMessage[]) {
  // Filter out system messages since Gemini doesn't support them directly
  const filteredMessages = messages.filter(msg => msg.sender !== 'system');
  
  // If there are no user or AI messages, create a dummy user message
  if (filteredMessages.length === 0) {
    return [{
      role: 'user',
      parts: [{ text: 'Hello' }]
    }];
  }
  
  // Make sure the first message is from a user
  if (filteredMessages[0].sender !== 'user') {
    // Add a dummy user message at the beginning
    filteredMessages.unshift({
      id: 0,
      sessionId: filteredMessages[0].sessionId,
      sender: 'user',
      message: 'Hello',
      messageType: 'text',
      timestamp: new Date(),
      contentTags: null,
      sentiment: null,
      extractedInsights: null
    });
  }
  
  // Map messages to Gemini format
  return filteredMessages.map(msg => {
    const role = msg.sender === 'user' ? 'user' : 'model';
    
    return {
      role,
      parts: [{ text: msg.message }]
    };
  });
}

/**
 * Generate a response from Gemini based on the conversation history
 */
export async function generateGeminiResponse(
  sessionId: number, 
  userMessage: string, 
  systemContext?: string
): Promise<string> {
  // If API is not properly initialized, use fallback responses
  if (!googleAI || !geminiModel) {
    console.log('Using fallback response mechanism as Gemini API is not initialized');
    return generateFallbackResponse(sessionId, userMessage, systemContext);
  }
  
  try {
    // Get conversation history
    const messages = await getConversationMessages(sessionId);
    
    // Add system context if provided
    if (systemContext) {
      messages.unshift({
        id: 0,
        sessionId,
        sender: 'system',
        message: systemContext,
        messageType: 'context',
        timestamp: new Date(),
        contentTags: null,
        sentiment: null,
        extractedInsights: null
      });
    }
    
    // Format messages for Gemini
    const formattedMessages = formatMessagesForGemini(messages);
    
    try {
      // Start a chat session
      const chat = geminiModel.startChat({
        history: formattedMessages
      });
      
      // Generate response
      const result = await chat.sendMessage(userMessage);
      const responseText = result.response.text();
      
      return responseText;
    } catch (chatError) {
      console.error('Error in Gemini chat session:', chatError);
      // Try simple content generation as fallback
      try {
        const result = await geminiModel.generateContent(userMessage);
        return result.response.text();
      } catch (contentError) {
        console.error('Error in simple content generation:', contentError);
        return generateFallbackResponse(sessionId, userMessage, systemContext);
      }
    }
  } catch (error) {
    console.error('Error in Gemini response generation flow:', error);
    return generateFallbackResponse(sessionId, userMessage, systemContext);
  }
}

/**
 * Generate a fallback response when the AI API is unavailable
 */
function generateFallbackResponse(
  sessionId: number,
  userMessage: string,
  systemContext?: string
): string {
  // Get the session info to determine what type of response to generate
  return db.select()
    .from(conversationSessions)
    .where(eq(conversationSessions.id, sessionId))
    .then(sessions => {
      const session = sessions[0];
      
      if (session && session.sessionType === 'onboarding') {
        // Get all previous messages to determine conversation state
        return getConversationMessages(sessionId).then(messages => {
          const userMessages = messages.filter(m => m.sender === 'user');
          
          // First response in onboarding - welcome message
          if (userMessages.length <= 1) {
            return "Hello and welcome to BondQuest! 👋 I'm your relationship assistant, here to help you strengthen your bond with your partner. What's your name, and what's your partner's name? I'd love to get to know you both better!";
          }
          
          // Second response - asking about relationship duration
          if (userMessages.length === 2) {
            return "It's great to meet you! How long have you and your partner been together? Understanding your relationship journey helps me provide more personalized suggestions and activities.";
          }
          
          // Third response - asking about hopes for the app
          if (userMessages.length === 3) {
            return "Thanks for sharing! What are you hoping to gain from using BondQuest? Whether it's better communication, fun activities to do together, or deeper understanding of each other - knowing your goals will help me customize your experience.";
          }
          
          // Fourth response - wrapping up onboarding
          if (userMessages.length === 4) {
            return "That's wonderful! BondQuest has lots of features to help with that. You'll find relationship quizzes, suggested activities, and tools to track your bond strength as you grow together. I'm excited to be part of your relationship journey! Is there anything specific you'd like to explore first?";
          }
          
          // General fallback for other situations
          return "I understand! BondQuest is all about helping couples like you strengthen your connection through fun, meaningful interactions. Let's continue this journey together. What would you like to explore next?";
        });
      }
      
      // Default fallback response for non-onboarding contexts
      return "I'm here to help you build a stronger relationship. What would you like to know about BondQuest?";
    })
    .catch(error => {
      console.error('Error generating fallback response:', error);
      return "I'm here to help you build a stronger relationship. What would you like to know about BondQuest?";
    });
}

/**
 * Extract profile insights from a conversation
 */
export async function extractProfileInsightsFromConversation(
  sessionId: number,
  userId: number
): Promise<ProfileInsight[]> {
  // If API is not properly initialized, use fallback insights
  if (!googleAI || !geminiModel) {
    console.log('Using fallback insights as Gemini API is not initialized');
    return generateFallbackInsights(sessionId, userId);
  }
  
  try {
    // Get conversation history
    const messages = await getConversationMessages(sessionId);
    
    if (messages.length === 0) {
      return [];
    }
    
    // Create a prompt to extract insights
    const extractionPrompt = `
      Please analyze the following conversation and extract key relationship insights about the user.
      Focus on extracting the following types of information:
      
      1. Relationship preferences (love languages, communication styles)
      2. Partner dynamics (how they interact, conflict resolution patterns)
      3. Personal values (what matters to them in relationships)
      4. Relationship goals (what they want to achieve together)
      5. Shared interests (activities they enjoy together)
      
      Return your insights as a JSON array with objects containing:
      - insightType: one of the categories above
      - insight: a detailed description of the insight
      - confidenceScore: how confident you are in this insight (low, medium, high)
      
      Only extract insights that are clearly supported by the conversation.
    `;
    
    // Combine conversation messages
    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.message}`)
      .join('\n\n');
    
    try {
      // Generate insights
      const result = await geminiModel.generateContent([
        extractionPrompt,
        conversationText
      ]);
      
      const responseText = result.response.text();
      
      // Parse JSON response
      try {
        // Clean response text to ensure it's valid JSON
        const cleanedText = responseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        const insights = JSON.parse(cleanedText);
        
        if (!Array.isArray(insights)) {
          return generateFallbackInsights(sessionId, userId);
        }
        
        // Save insights to database
        const savedInsights: ProfileInsight[] = [];
        
        for (const insight of insights) {
          if (insight.insightType && insight.insight) {
            const savedInsight = await saveProfileInsight({
              userId,
              insightType: insight.insightType,
              insight: insight.insight,
              confidenceScore: insight.confidenceScore || 'medium',
              metadata: { sessionId }
            });
            
            savedInsights.push(savedInsight);
          }
        }
        
        return savedInsights;
      } catch (jsonError) {
        console.error('Error parsing insights JSON:', jsonError);
        return generateFallbackInsights(sessionId, userId);
      }
    } catch (apiError) {
      console.error('Error calling Gemini API for insights:', apiError);
      return generateFallbackInsights(sessionId, userId);
    }
  } catch (error) {
    console.error('Error extracting profile insights:', error);
    return generateFallbackInsights(sessionId, userId);
  }
}

/**
 * Generate fallback insights when the AI API is unavailable
 */
async function generateFallbackInsights(
  sessionId: number,
  userId: number
): Promise<ProfileInsight[]> {
  // Get messages to determine conversation content
  const messages = await getConversationMessages(sessionId);
  const userMessages = messages.filter(m => m.sender === 'user');
  
  // Sample insights based on common relationship patterns
  const fallbackInsights = [
    {
      insightType: 'Relationship preferences',
      insight: 'The user values clear and open communication in their relationship.',
      confidenceScore: 'medium',
    },
    {
      insightType: 'Relationship goals',
      insight: 'The user is interested in deepening their connection with their partner through shared activities and experiences.',
      confidenceScore: 'medium',
    },
    {
      insightType: 'Personal values',
      insight: 'Trust and mutual respect appear to be fundamental values in the user\'s approach to relationships.',
      confidenceScore: 'medium',
    }
  ];
  
  // Only generate insights if there are enough messages to base them on
  if (userMessages.length < 2) {
    return [];
  }
  
  // Save the fallback insights
  const savedInsights: ProfileInsight[] = [];
  
  for (const insight of fallbackInsights) {
    const savedInsight = await saveProfileInsight({
      userId,
      insightType: insight.insightType,
      insight: insight.insight,
      confidenceScore: insight.confidenceScore,
      metadata: { 
        sessionId,
        isFallback: true
      }
    });
    
    savedInsights.push(savedInsight);
  }
  
  return savedInsights;
}

/**
 * Get a prompt for different stages of the onboarding process
 */
export function getOnboardingPrompt(stage: string): string {
  const prompts: Record<string, string> = {
    welcome: `
      You are BondQuest's friendly relationship assistant. Your goal is to make the user feel comfortable sharing
      information about their relationship in a natural, conversational way. You're warmly welcoming them to the
      relationship app.
      
      In this initial conversation:
      1. Introduce yourself and welcome them to BondQuest
      2. Ask about their name and their partner's name (if they have one)
      3. Inquire about how long they've been together
      4. Ask what they hope to gain from using this relationship app
      
      Keep your messages friendly, supportive and relatively short. Show genuine interest in their relationship
      and make them feel comfortable sharing.
    `,
    
    relationship_status: `
      You are BondQuest's friendly relationship assistant. Your goal is to gently learn more about the user's
      current relationship status and dynamics in a conversational way.
      
      In this conversation:
      1. Ask about their current relationship status (dating, engaged, married, etc.)
      2. Inquire about how they met their partner
      3. Ask what they love most about their relationship
      4. Discuss any relationship challenges they're currently facing
      
      Keep your messages supportive and non-judgmental. Show empathy and understanding, especially when
      they share challenges. Validate their feelings and experiences.
    `,
    
    communication: `
      You are BondQuest's friendly relationship assistant. Your goal is to understand how the user and their
      partner communicate and handle conflicts.
      
      In this conversation:
      1. Ask how they typically communicate with their partner (text, calls, in-person, etc.)
      2. Inquire about how they handle disagreements or conflicts
      3. Ask if they feel heard and understood by their partner
      4. Discuss any communication challenges they face
      
      Be supportive and provide gentle reflection on their communication patterns. Avoid being prescriptive or
      judgmental. Acknowledge that every relationship has unique communication dynamics.
    `,
    
    interests: `
      You are BondQuest's friendly relationship assistant. Your goal is to learn about the couple's shared
      interests and activities they enjoy together.
      
      In this conversation:
      1. Ask about activities they enjoy doing together
      2. Inquire about their individual interests and hobbies
      3. Discuss how they balance shared and individual interests
      4. Ask about new things they'd like to try together
      
      Be enthusiastic about their shared interests and supportive of their individual pursuits. Highlight how
      both shared and individual activities can strengthen a relationship.
    `,
    
    goals: `
      You are BondQuest's friendly relationship assistant. Your goal is to understand the couple's relationship
      goals and aspirations.
      
      In this conversation:
      1. Ask about their short-term relationship goals
      2. Inquire about their long-term vision for the relationship
      3. Discuss how they support each other's personal goals
      4. Ask what growth they'd like to see in their relationship
      
      Be encouraging and positive about their goals. Acknowledge the importance of supporting each other's
      individual dreams while building a shared future.
    `,
    
    wrap_up: `
      You are BondQuest's friendly relationship assistant. Your goal is to wrap up the onboarding conversation
      positively and set expectations for using the app.
      
      In this conversation:
      1. Thank them for sharing about their relationship
      2. Summarize a few key insights you've gathered
      3. Express excitement about helping them strengthen their bond
      4. Explain that BondQuest will use this information to personalize their experience
      
      Be warm and appreciative. Make them feel good about the information they've shared and excited about
      using BondQuest to enhance their relationship.
    `
  };
  
  return prompts[stage] || prompts.welcome;
}