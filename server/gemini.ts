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
  geminiModel = googleAI.getGenerativeModel({ model: 'gemini-pro' });
  
  console.log('Gemini API initialized successfully');
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
 */
function formatMessagesForGemini(messages: ConversationMessage[]) {
  return messages.map(msg => {
    const role = msg.sender === 'user' ? 'user' : 
                 msg.sender === 'ai' ? 'model' : 
                 'system';
    
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
  if (!googleAI || !geminiModel) {
    throw new Error('Gemini API not initialized. Call initializeGeminiAPI first.');
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
    
    // Start a chat session
    const chat = geminiModel.startChat({
      history: formattedMessages
    });
    
    // Generate response
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();
    
    return responseText;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    return 'I apologize, but I encountered an issue processing your message. Could you please try again or rephrase your question?';
  }
}

/**
 * Extract profile insights from a conversation
 */
export async function extractProfileInsightsFromConversation(
  sessionId: number,
  userId: number
): Promise<ProfileInsight[]> {
  if (!googleAI || !geminiModel) {
    throw new Error('Gemini API not initialized. Call initializeGeminiAPI first.');
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
        return [];
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
      return [];
    }
  } catch (error) {
    console.error('Error extracting profile insights:', error);
    return [];
  }
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