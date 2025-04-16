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
import { aiCompanions, buildCompanionSystemPrompt } from '@shared/aiCompanions';

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
  
  // Use the confirmed working model based on our tests
  const confirmedModel = 'models/gemini-1.5-pro';
  let modelInitialized = false;
  
  try {
    console.log(`Attempting to initialize Gemini API with model: ${confirmedModel}`);
    geminiModel = googleAI.getGenerativeModel({ model: confirmedModel });
    console.log(`Gemini API initialized successfully with model: ${confirmedModel}`);
    modelInitialized = true;
  } catch (error) {
    console.error(`Error initializing Gemini model ${confirmedModel}:`, error);
    
    // Fallback to trying other models if the preferred one fails
    const fallbackModels = [
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro-latest',
      'models/gemini-1.5-pro-001',
      'models/gemini-1.5-flash-latest',
      'models/gemini-pro-vision',
      'gemini-pro'
    ];
    
    // Try each fallback model until one works
    for (const modelName of fallbackModels) {
      if (modelInitialized) break;
      
      try {
        console.log(`Attempting to initialize Gemini API with fallback model: ${modelName}`);
        geminiModel = googleAI.getGenerativeModel({ model: modelName });
        console.log(`Gemini API initialized successfully with fallback model: ${modelName}`);
        modelInitialized = true;
      } catch (fallbackError) {
        console.error(`Error initializing Gemini fallback model ${modelName}:`, fallbackError);
      }
    }
  }
  
  if (!modelInitialized) {
    console.warn('No Gemini models could be initialized. Using fallback response mechanisms.');
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
  // Convert string confidence scores to numeric values
  let numericConfidence: number | null = null;
  
  if (typeof insightData.confidenceScore === 'string') {
    // Map string confidence levels to numeric values (0-100)
    switch(insightData.confidenceScore.toLowerCase()) {
      case 'high':
        numericConfidence = 90;
        break;
      case 'medium':
        numericConfidence = 60;
        break;
      case 'low':
        numericConfidence = 30;
        break;
      default:
        // Try to parse as number if it's not one of the known strings
        const parsed = parseFloat(insightData.confidenceScore);
        numericConfidence = isNaN(parsed) ? 50 : parsed; // default to 50 if parsing fails
    }
  } else if (typeof insightData.confidenceScore === 'number') {
    numericConfidence = insightData.confidenceScore;
  }
  
  const [insight] = await db
    .insert(profileInsights)
    .values({
      userId: insightData.userId,
      insightType: insightData.insightType,
      insight: insightData.insight,
      confidenceScore: numericConfidence,
      createdAt: new Date(),
      sourceSessionIds: insightData.sourceSessionIds,
      updatedAt: new Date()
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
 * 
 * Note: This is a synchronous function that returns predefined responses
 * based on the user's message and conversation stage.
 */
function generateFallbackResponse(
  sessionId: number,
  userMessage: string,
  systemContext?: string
): string {
  try {
    // Extract conversation stage from system context if available
    let stage = 'unknown';
    if (systemContext && systemContext.includes('welcome')) {
      stage = 'welcome';
    } else if (systemContext && systemContext.includes('relationship_status')) {
      stage = 'relationship_status';
    } else if (systemContext && systemContext.includes('communication')) {
      stage = 'communication';
    } else if (systemContext && systemContext.includes('interests')) {
      stage = 'interests';
    } else if (systemContext && systemContext.includes('goals')) {
      stage = 'goals';
    } else if (systemContext && systemContext.includes('wrap_up')) {
      stage = 'wrap_up';
    }
    
    // Companion-specific responses based on stage
    const venusResponses: Record<string, string> = {
      welcome: "Hello and welcome to BondQuest! 👋 I'm Venus, your relationship communication guide. I'm here to help you strengthen your bond with your partner. What's your name, and what's your partner's name? I'd love to get to know you both better!",
      relationship_status: "It's great to meet you! How long have you and your partner been together? Understanding your relationship journey helps me provide more personalized suggestions for improving your communication.",
      communication: "How do you and your partner typically communicate throughout the day? Understanding your communication patterns helps me provide better guidance for deepening your connection.",
      unknown: "I'm Venus, your communication specialist at BondQuest. I'm here to help you build a stronger relationship through better communication. What would you like to know?"
    };
    
    const casanovaResponses: Record<string, string> = {
      interests: "Let's talk about the fun side of your relationship! What activities do you and your partner enjoy doing together? I love helping couples discover new exciting ways to connect.",
      unknown: "I'm Casanova, your romantic activities guide at BondQuest. I'm here to help you keep the spark alive with creative date ideas and romantic inspiration. What would you like to explore?"
    };
    
    const auroraResponses: Record<string, string> = {
      goals: "Looking toward the future is important for every relationship. What are some of your short-term and long-term goals together? Understanding these helps me analyze patterns and suggest personalized growth opportunities.",
      unknown: "I'm Aurora, your data-driven relationship scientist at BondQuest. I help couples understand the patterns in their relationship and make evidence-based improvements. How can I assist you today?"
    };
    
    // Select the appropriate response based on detected stage
    if (stage === 'welcome' || stage === 'relationship_status' || stage === 'communication') {
      return venusResponses[stage] || venusResponses.unknown;
    } else if (stage === 'interests') {
      return casanovaResponses.interests || casanovaResponses.unknown;
    } else if (stage === 'goals') {
      return auroraResponses.goals || auroraResponses.unknown;
    }
    
    // Default fallback response if stage cannot be determined
    return "I'm here to help you build a stronger relationship through BondQuest. What specific area of your relationship would you like to focus on improving?";
  } catch (error) {
    console.error('Error generating fallback response:', error);
    return "I'm here to help you build a stronger relationship. What would you like to know about BondQuest?";
  }
}

/**
 * Extract profile insights from a conversation
 */
export async function extractProfileInsightsFromConversation(
  sessionId: number,
  userId: number
): Promise<ProfileInsight[]> {
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
      
      Respond ONLY with the JSON array, no additional text.
    `;
    
    // Combine conversation messages
    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.message}`)
      .join('\n\n');
    
    try {
      let responseText = "";
      
      // Try with direct API access using our confirmed working model
      if (process.env.GEMINI_API_KEY) {
        try {
          const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = googleAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
          
          // Combine prompt and conversation
          const fullPrompt = `${extractionPrompt}\n\nConversation:\n${conversationText}`;
          
          const result = await model.generateContent(fullPrompt);
          responseText = result.response.text();
        } catch (directApiError) {
          console.error("Error with direct Gemini API call:", directApiError);
          // Fall back to original method if direct call fails
          if (geminiModel) {
            const result = await geminiModel.generateContent([
              extractionPrompt,
              conversationText
            ]);
            responseText = result.response.text();
          } else {
            return generateFallbackInsights(sessionId, userId);
          }
        }
      } else if (geminiModel) {
        // Use the existing model if initialized
        const result = await geminiModel.generateContent([
          extractionPrompt,
          conversationText
        ]);
        responseText = result.response.text();
      } else {
        console.log('Using fallback insights as Gemini API is not initialized');
        return generateFallbackInsights(sessionId, userId);
      }
      
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
              sourceSessionIds: [sessionId]
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
      sourceSessionIds: [sessionId]
    });
    
    savedInsights.push(savedInsight);
  }
  
  return savedInsights;
}

/**
 * Get a prompt for different stages of the onboarding process
 * Uses AI companions system for more personalized and engaging onboarding
 */
export function getOnboardingPrompt(stage: string): string {
  // Map onboarding stages to the most appropriate AI companion
  const stageToCompanion: Record<string, string> = {
    welcome: 'venus',             // Venus is warm and welcoming
    relationship_status: 'venus', // Venus understands relationship dynamics 
    communication: 'venus',       // Venus specializes in communication
    interests: 'casanova',        // Casanova is passionate about shared activities
    goals: 'aurora',              // Aurora is analytical and future-oriented
    wrap_up: 'venus'              // Venus is empathetic for closing conversation
  };
  
  // Get the appropriate companion for this stage
  const companionId = stageToCompanion[stage] || 'venus';
  const companion = aiCompanions.find(c => c.id === companionId);
  
  // Stage-specific instructions that will be added to the companion's system prompt
  const stageInstructions: Record<string, string> = {
    welcome: `
      Your goal is to make the user feel comfortable sharing information about their relationship in a 
      natural, conversational way. You're warmly welcoming them to BondQuest.
      
      In this initial conversation:
      1. Introduce yourself as ${companion?.name || 'a relationship assistant'} and welcome them to BondQuest
      2. Ask about their name and their partner's name (if they have one)
      3. Inquire about how long they've been together
      4. Ask what they hope to gain from using this relationship app
      
      Keep your messages friendly, supportive and relatively short (3-4 sentences max).
      Show genuine interest in their relationship and make them feel comfortable sharing.
    `,
    
    relationship_status: `
      Your goal is to gently learn more about the user's current relationship status and dynamics
      in a conversational way.
      
      In this conversation:
      1. Ask about their current relationship status (dating, engaged, married, etc.)
      2. Inquire about how they met their partner
      3. Ask what they love most about their relationship
      4. Discuss any relationship challenges they're currently facing
      
      Keep your messages supportive and non-judgmental. Show empathy and understanding, especially when
      they share challenges. Validate their feelings and experiences.
    `,
    
    communication: `
      Your goal is to understand how the user and their partner communicate and handle conflicts.
      
      In this conversation:
      1. Ask how they typically communicate with their partner (text, calls, in-person, etc.)
      2. Inquire about how they handle disagreements or conflicts
      3. Ask if they feel heard and understood by their partner
      4. Discuss any communication challenges they face
      
      Be supportive and provide gentle reflection on their communication patterns. Avoid being prescriptive or
      judgmental. Acknowledge that every relationship has unique communication dynamics.
    `,
    
    interests: `
      Your goal is to learn about the couple's shared interests and activities they enjoy together.
      
      In this conversation:
      1. Ask about activities they enjoy doing together
      2. Inquire about their individual interests and hobbies
      3. Discuss how they balance shared and individual interests
      4. Ask about new things they'd like to try together
      
      Be enthusiastic about their shared interests and supportive of their individual pursuits. Highlight how
      both shared and individual activities can strengthen a relationship.
    `,
    
    goals: `
      Your goal is to understand the couple's relationship goals and aspirations.
      
      In this conversation:
      1. Ask about their short-term relationship goals
      2. Inquire about their long-term vision for the relationship
      3. Discuss how they support each other's personal goals
      4. Ask what growth they'd like to see in their relationship
      
      Be encouraging and positive about their goals. Acknowledge the importance of supporting each other's
      individual dreams while building a shared future.
    `,
    
    wrap_up: `
      Your goal is to wrap up the onboarding conversation positively and set expectations for using the app.
      
      In this conversation:
      1. Thank them for sharing about their relationship
      2. Summarize a few key insights you've gathered
      3. Express excitement about helping them strengthen their bond
      4. Explain that BondQuest will use this information to personalize their experience
      
      Be warm and appreciative. Make them feel good about the information they've shared and excited about
      using BondQuest to enhance their relationship.
    `
  };
  
  // Start with the companion's basic system prompt
  let fullPrompt = companion?.systemPrompt || 
    "You are BondQuest's friendly relationship assistant helping couples strengthen their relationship.";
  
  // Add stage-specific instructions
  if (stageInstructions[stage]) {
    fullPrompt += `\n\n${stageInstructions[stage]}`;
  }
  
  // Add general conversation guidelines for all onboarding chats
  fullPrompt += `\n
    General guidelines:
    - Keep responses conversational, warm, and engaging
    - Use emoji occasionally to convey warmth (1-2 per message maximum)
    - Ask only one question at a time
    - Responses should be brief (2-4 sentences)
    - Show authentic interest in the user's relationship
    - Avoid clichés and generic relationship advice
    - Remember this is just the beginning of their journey with BondQuest
  `;
  
  return fullPrompt;
}