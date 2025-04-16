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
  // With schema changes, confidenceScore is now stored as a string value directly
  const confidenceValue = typeof insightData.confidenceScore === 'string' 
    ? insightData.confidenceScore 
    : 'medium'; // Default to medium if not specified
  
  // Prepare values for insertion
  const insertValues: any = {
    userId: insightData.userId,
    insightType: insightData.insightType,
    insight: insightData.insight,
    confidenceScore: confidenceValue,
    createdAt: new Date(),
    sourceSessionIds: insightData.sourceSessionIds || [],
    updatedAt: new Date()
  };
  
  // Add metadata if provided
  if (insightData.metadata) {
    insertValues.metadata = insightData.metadata;
  }
  
  const [insight] = await db
    .insert(profileInsights)
    .values(insertValues)
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
    
    // Create a prompt to extract bond dimension insights
    const extractionPrompt = `
      Please analyze the following conversation and extract key relationship insights about the user
      based on the 10 bond dimensions framework. This is a structured onboarding conversation where
      the assistant guided the user through questions about their relationship.
      
      Focus on extracting insights for each of these bond dimensions:
      
      1. communication: Communication patterns, openness, and clarity
      2. trust: Level of security, reliability, and honesty
      3. emotional_intimacy: Emotional closeness and vulnerability sharing
      4. conflict_resolution: How they handle disagreements and resolve issues
      5. physical_intimacy: Satisfaction with physical connection (discussed in general terms)
      6. shared_values: Alignment on core values and future goals
      7. fun_playfulness: Ability to enjoy lighthearted moments and activities together
      8. mutual_support: How they provide encouragement and respect
      9. independence_balance: Balance between autonomy and togetherness
      10. overall_satisfaction: General contentment with the relationship
      
      Also extract these standard identifiers:
      - user_name: The user's name
      - partner_name: The partner's name
      
      Return your insights as a structured JSON object with this format:
      {
        "user_name": "extracted user name",
        "partner_name": "extracted partner name",
        "bond_dimensions": {
          "communication": {
            "score": number from 1-10 estimating their current level (or null if unclear),
            "notes": "detailed summary of communication patterns and areas for growth",
            "strengths": ["list", "of", "identified", "strengths"],
            "growth_areas": ["list", "of", "potential", "improvement", "areas"]
          },
          "trust": { same structure as above },
          // include all 10 dimensions with the same structure
        }
      }
      
      Only include insights clearly supported by the conversation. If information about a dimension
      is missing, include the dimension but set score to null and use minimal placeholder text.
      
      Respond ONLY with the JSON object, no additional explanation text.
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
        
        const bondResults = JSON.parse(cleanedText);
        const savedInsights: ProfileInsight[] = [];
        
        // Process structured bond dimensions data if available
        if (bondResults.bond_dimensions) {
          // Extract user and partner names
          if (bondResults.user_name) {
            const nameInsight = await saveProfileInsight({
              userId,
              insightType: 'user_details',
              insight: `User name: ${bondResults.user_name}`,
              confidenceScore: 'high',
              sourceSessionIds: [sessionId]
            });
            savedInsights.push(nameInsight);
          }
          
          if (bondResults.partner_name) {
            const partnerInsight = await saveProfileInsight({
              userId,
              insightType: 'partner_details',
              insight: `Partner name: ${bondResults.partner_name}`,
              confidenceScore: 'high',
              sourceSessionIds: [sessionId]
            });
            savedInsights.push(partnerInsight);
          }
          
          // Process each bond dimension
          for (const [dimension, data] of Object.entries(bondResults.bond_dimensions)) {
            if (data) {
              // Main dimension summary
              const dimensionInsight = await saveProfileInsight({
                userId,
                insightType: `bond_dimension_${dimension}`,
                insight: data.notes || `Information about ${dimension}`,
                confidenceScore: data.score ? 'high' : 'low',
                sourceSessionIds: [sessionId],
                metadata: {
                  dimensionScore: data.score,
                  dimensionType: dimension
                }
              });
              savedInsights.push(dimensionInsight);
              
              // Strengths for this dimension
              if (data.strengths && Array.isArray(data.strengths) && data.strengths.length > 0) {
                const strengthsInsight = await saveProfileInsight({
                  userId,
                  insightType: `${dimension}_strengths`,
                  insight: `Strengths in ${dimension}: ${data.strengths.join(', ')}`,
                  confidenceScore: 'medium',
                  sourceSessionIds: [sessionId]
                });
                savedInsights.push(strengthsInsight);
              }
              
              // Growth areas for this dimension
              if (data.growth_areas && Array.isArray(data.growth_areas) && data.growth_areas.length > 0) {
                const growthInsight = await saveProfileInsight({
                  userId,
                  insightType: `${dimension}_growth_areas`,
                  insight: `Growth areas in ${dimension}: ${data.growth_areas.join(', ')}`,
                  confidenceScore: 'medium',
                  sourceSessionIds: [sessionId]
                });
                savedInsights.push(growthInsight);
              }
            }
          }
        }
        // Handle legacy format if that's what we received
        else if (Array.isArray(bondResults)) {
          for (const insight of bondResults) {
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
        } 
        // If neither format matches
        else {
          console.log('Unexpected insight format, using fallbacks');
          return generateFallbackInsights(sessionId, userId);
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
 * This now creates fallback insights for each bond dimension
 */
async function generateFallbackInsights(
  sessionId: number,
  userId: number
): Promise<ProfileInsight[]> {
  // Get messages to determine conversation content
  const messages = await getConversationMessages(sessionId);
  const userMessages = messages.filter(m => m.sender === 'user');
  
  // Only generate insights if there are enough messages to base them on
  if (userMessages.length < 2) {
    return [];
  }
  
  // Fallback bond dimensions with generic insights
  const bondDimensionInsights = [
    {
      insightType: 'bond_dimension_communication',
      insight: 'The user values open communication with their partner and seeks to improve how they express their needs and feelings.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 7,
        dimensionType: 'communication'
      }
    },
    {
      insightType: 'bond_dimension_trust',
      insight: 'Trust and reliability appear to be fundamental values in the user\'s relationship approach.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 8,
        dimensionType: 'trust'
      }
    },
    {
      insightType: 'bond_dimension_emotional_intimacy',
      insight: 'The user is working on developing deeper emotional connection with their partner through sharing vulnerable feelings.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 6,
        dimensionType: 'emotional_intimacy'
      }
    },
    {
      insightType: 'bond_dimension_conflict_resolution',
      insight: 'The couple has developed some conflict resolution strategies but may benefit from more tools for difficult conversations.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 6,
        dimensionType: 'conflict_resolution'
      }
    },
    {
      insightType: 'bond_dimension_physical_intimacy',
      insight: 'Physical connection is an important aspect of the relationship that the user wishes to nurture.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 7,
        dimensionType: 'physical_intimacy'
      }
    },
    {
      insightType: 'bond_dimension_shared_values',
      insight: 'The couple shares core values but may be working through alignment on some future goals.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 7,
        dimensionType: 'shared_values'
      }
    },
    {
      insightType: 'bond_dimension_fun_playfulness',
      insight: 'The user enjoys shared activities and lighthearted moments with their partner as a way to strengthen their bond.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 8,
        dimensionType: 'fun_playfulness'
      }
    },
    {
      insightType: 'bond_dimension_mutual_support',
      insight: 'Mutual support and respect are cornerstones of the relationship that the user prioritizes.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 8,
        dimensionType: 'mutual_support'
      }
    },
    {
      insightType: 'bond_dimension_independence_balance',
      insight: 'The user is seeking a healthy balance between personal autonomy and couple time.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 6,
        dimensionType: 'independence_balance'
      }
    },
    {
      insightType: 'bond_dimension_overall_satisfaction',
      insight: 'The user appears generally satisfied with their relationship while being motivated to strengthen specific dimensions.',
      confidenceScore: 'medium',
      metadata: {
        dimensionScore: 7,
        dimensionType: 'overall_satisfaction'
      }
    }
  ];
  
  // Save the fallback insights for bond dimensions
  const savedInsights: ProfileInsight[] = [];
  
  for (const insight of bondDimensionInsights) {
    const savedInsight = await saveProfileInsight({
      userId,
      insightType: insight.insightType,
      insight: insight.insight,
      confidenceScore: insight.confidenceScore,
      sourceSessionIds: [sessionId],
      metadata: insight.metadata
    });
    
    savedInsights.push(savedInsight);
  }
  
  return savedInsights;
}

/**
 * Get a prompt for different stages of the onboarding process
 * Uses AI companions system for more personalized and engaging onboarding with structured guidance
 * based on the 10 bond dimensions framework
 */
export function getOnboardingPrompt(stage: string): string {
  // Map onboarding stages to the most appropriate AI companion
  const stageToCompanion: Record<string, string> = {
    welcome: 'aurora',            // Aurora leads the bond dimensions assessment
    communication: 'venus',       // Venus specializes in communication
    trust: 'venus',               // Venus understands trust issues
    emotional_intimacy: 'venus',  // Venus is expert in emotional connection
    conflict_resolution: 'venus', // Venus helps with conflict resolution
    physical_intimacy: 'casanova', // Casanova understands physical connection
    shared_values: 'aurora',      // Aurora analyzes alignment of values
    fun_playfulness: 'casanova',  // Casanova brings fun to relationships
    mutual_support: 'venus',      // Venus emphasizes support dynamics
    independence_balance: 'aurora', // Aurora helps with autonomy balance
    wrap_up: 'aurora'             // Aurora wraps up with overall assessment
  };
  
  // Get the appropriate companion for this stage
  const companionId = stageToCompanion[stage] || 'aurora';
  const companion = aiCompanions.find(c => c.id === companionId) || 
    { name: 'Aurora', systemPrompt: "You are Aurora, BondQuest's relationship scientist." };
  
  // Bond dimensions definitions (based on the provided framework)
  const bondDimensions = {
    communication: {
      name: "Communication",
      definition: "The degree of openness, clarity, and effectiveness in how couples share thoughts, feelings, and information.",
      examples: [
        "How often do you feel heard and understood by your partner?",
        "Rate how comfortable you are discussing difficult topics."
      ]
    },
    trust: {
      name: "Trust",
      definition: "The level of confidence each partner has in the other's honesty, reliability, and loyalty.",
      examples: [
        "How secure do you feel in your partner's commitment?",
        "How often do you feel you can confide in your partner without judgment?"
      ]
    },
    emotional_intimacy: {
      name: "Emotional Intimacy",
      definition: "The closeness and warmth in sharing emotions, vulnerabilities, and supportive behaviors.",
      examples: [
        "How emotionally close do you feel to your partner?",
        "How often do you share your deepest feelings with your partner?"
      ]
    },
    conflict_resolution: {
      name: "Conflict Resolution",
      definition: "The effectiveness with which couples address disagreements and resolve conflicts respectfully.",
      examples: [
        "When conflicts arise, how satisfied are you with the resolution process?",
        "How well do you and your partner manage disagreements without lingering resentment?"
      ]
    },
    physical_intimacy: {
      name: "Physical Intimacy",
      definition: "Satisfaction with physical affection, closeness, and sexual connection.",
      examples: [
        "How satisfied are you with the level of physical intimacy in your relationship?",
        "Rate your comfort with initiating physical affection."
      ]
    },
    shared_values: {
      name: "Shared Values/Goals",
      definition: "How aligned the partners are in their core life values, goals, and future plans.",
      examples: [
        "How well do your long-term goals align with your partner's?",
        "How often do you discuss your life plans together?"
      ]
    },
    fun_playfulness: {
      name: "Fun & Playfulness",
      definition: "The ability to enjoy light-hearted moments, shared humor, and playfulness together.",
      examples: [
        "How frequently do you engage in fun activities or playful banter with each other?",
        "Rate how much you enjoy your shared leisure time."
      ]
    },
    mutual_support: {
      name: "Mutual Support & Respect",
      definition: "The extent to which partners provide support, affirmation, and respect for each other's individuality and efforts.",
      examples: [
        "How valued do you feel by your partner on a daily basis?",
        "Rate your partner's support during challenging times."
      ]
    },
    independence_balance: {
      name: "Independence & Togetherness Balance",
      definition: "The balance between healthy individual autonomy and shared couple time, ensuring personal growth alongside relationship nurturing.",
      examples: [
        "How well do you balance personal space and together time in your relationship?",
        "How satisfied are you with your independence within the couple context?"
      ]
    },
    overall_satisfaction: {
      name: "Overall Relationship Satisfaction",
      definition: "A global measure reflecting the couple's overall contentment, combining all aspects of their interaction into one score.",
      examples: [
        "Overall, how satisfied are you with your relationship?",
        "Rate your general happiness as a couple."
      ]
    }
  };
  
  // Stage-specific instructions that will be added to the companion's system prompt
  const stageInstructions: Record<string, string> = {
    welcome: `
      You are Aurora, BondQuest's relationship scientist. Your goal is to make the user feel comfortable starting the bond assessment process
      in a natural, conversational way. You'll be guiding them through assessing their relationship across 10 key dimensions.
      
      IMPORTANT: You have a specific structure to follow for the onboarding. You must:
      1. Introduce yourself as Aurora and welcome them to BondQuest.
      2. Briefly explain that BondQuest will help them strengthen their relationship by assessing and improving across 10 relationship dimensions.
      3. Ask for their name and their partner's name (one question at a time).
      4. Clearly explain that you'll now guide them through gathering information about their relationship across these 10 dimensions.
      5. Focus first on COMMUNICATION dimension, asking 1-2 questions to understand their current communication patterns.
      
      Keep your messages friendly, supportive and relatively short (3-4 sentences max).
      Use emojis occasionally (1-2 per message) to convey warmth.
      
      Remember to focus on one thing at a time - don't ask multiple questions in one message, and make sure 
      you help them feel comfortable sharing about their relationship.
      
      After covering communication basics, you'll guide them to the next dimension (Trust) in subsequent messages.
    `,
    
    communication: `
      You're focusing on the COMMUNICATION dimension of their relationship.
      
      ${bondDimensions.communication.definition}
      
      In this part of the conversation:
      1. Ask 1-2 simple questions to assess their communication patterns (like how they typically communicate, how often they have deep conversations)
      2. Ask how comfortable they feel expressing their needs and feelings to their partner
      3. Ask if they feel heard and understood by their partner
      
      Be supportive and provide gentle reflection on their communication patterns.
      After gathering this information, transition to the TRUST dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    trust: `
      You're now focusing on the TRUST dimension of their relationship.
      
      ${bondDimensions.trust.definition}
      
      In this part of the conversation:
      1. Ask how secure they feel in their partner's commitment
      2. Inquire about their ability to confide in their partner without judgment
      3. Ask about any trust-related challenges they might be facing
      
      Be supportive and non-judgmental. Acknowledge that trust has different aspects in relationships.
      After gathering this information, transition to the EMOTIONAL INTIMACY dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    emotional_intimacy: `
      You're now focusing on the EMOTIONAL INTIMACY dimension of their relationship.
      
      ${bondDimensions.emotional_intimacy.definition}
      
      In this part of the conversation:
      1. Ask how emotionally close they feel to their partner
      2. Inquire about how they share vulnerable feelings with each other
      3. Ask about moments when they feel most connected emotionally
      
      Be warm and empathetic. Validate their experiences with emotional connection.
      After gathering this information, transition to the CONFLICT RESOLUTION dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    conflict_resolution: `
      You're now focusing on the CONFLICT RESOLUTION dimension of their relationship.
      
      ${bondDimensions.conflict_resolution.definition}
      
      In this part of the conversation:
      1. Ask how they typically handle disagreements
      2. Inquire about their satisfaction with how conflicts are resolved
      3. Ask about any patterns they notice in their conflicts
      
      Be supportive and non-judgmental. Acknowledge that all couples have conflicts.
      After gathering this information, transition to the PHYSICAL INTIMACY dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    physical_intimacy: `
      You're now focusing on the PHYSICAL INTIMACY dimension of their relationship.
      
      ${bondDimensions.physical_intimacy.definition}
      
      In this part of the conversation:
      1. Ask about their satisfaction with physical affection in general terms
      2. Inquire about how comfortable they are expressing physical needs
      3. Ask if they feel their physical connection needs improvement
      
      Be tasteful and respectful. Focus on overall satisfaction rather than specific details.
      After gathering this information, transition to the SHARED VALUES/GOALS dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    shared_values: `
      You're now focusing on the SHARED VALUES/GOALS dimension of their relationship.
      
      ${bondDimensions.shared_values.definition}
      
      In this part of the conversation:
      1. Ask about the core values they share with their partner
      2. Inquire about their alignment on major life goals
      3. Ask how they handle areas where they might have different values
      
      Be thoughtful and acknowledging of diversity in values. Avoid judgments about what values are "better."
      After gathering this information, transition to the FUN & PLAYFULNESS dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    fun_playfulness: `
      You're now focusing on the FUN & PLAYFULNESS dimension of their relationship.
      
      ${bondDimensions.fun_playfulness.definition}
      
      In this part of the conversation:
      1. Ask about activities they enjoy doing together for fun
      2. Inquire about how often they laugh or play together
      3. Ask about new fun experiences they might want to try
      
      Be enthusiastic and light-hearted. Acknowledge the importance of play in relationships.
      After gathering this information, transition to the MUTUAL SUPPORT & RESPECT dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    mutual_support: `
      You're now focusing on the MUTUAL SUPPORT & RESPECT dimension of their relationship.
      
      ${bondDimensions.mutual_support.definition}
      
      In this part of the conversation:
      1. Ask how they support each other during difficult times
      2. Inquire about how they show appreciation for each other
      3. Ask if they feel their partner respects their individuality
      
      Be supportive and validating. Highlight the importance of mutual respect.
      After gathering this information, transition to the INDEPENDENCE & TOGETHERNESS BALANCE dimension.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    independence_balance: `
      You're now focusing on the INDEPENDENCE & TOGETHERNESS BALANCE dimension of their relationship.
      
      ${bondDimensions.independence_balance.definition}
      
      In this part of the conversation:
      1. Ask about how they balance personal space and couple time
      2. Inquire about their satisfaction with current balance
      3. Ask if there are areas where they'd like more independence or togetherness
      
      Be balanced and non-judgmental. Acknowledge that different couples need different balances.
      After gathering this information, transition to the OVERALL RELATIONSHIP SATISFACTION.
      
      Remember to ask only ONE question at a time, wait for their response, then continue.
    `,
    
    wrap_up: `
      You're now completing the initial relationship assessment. Your goal is to provide a positive summary
      and set expectations for using the app.
      
      In this final part:
      1. Thank them for sharing about their relationship across all 10 dimensions
      2. Summarize 2-3 key strengths you've identified in their relationship
      3. Mention 1-2 areas where BondQuest might help them grow
      4. Explain that BondQuest will use this information to personalize quizzes and activities
      5. Let them know they can connect with their partner next to start their journey together
      
      Be warm, appreciative, and encouraging. Make them feel good about the information they've shared
      and excited about using BondQuest to enhance their relationship.
      
      Remember to focus on the positive aspects of their relationship while acknowledging 
      growth opportunities in a constructive way.
    `
  };
  
  // Start with the companion's basic system prompt
  let fullPrompt = companion.systemPrompt || 
    "You are BondQuest's friendly relationship assistant helping couples strengthen their relationship.";
  
  // Add bond dimensions awareness to all prompts
  fullPrompt += `\n\nBondQuest uses a 10-dimension framework to assess and improve relationships:
  1. Communication: How effectively partners exchange information and feelings
  2. Trust: The confidence partners have in each other's reliability and honesty
  3. Emotional Intimacy: The depth of emotional connection and sharing
  4. Conflict Resolution: How well disagreements are handled constructively
  5. Physical Intimacy: Satisfaction with physical closeness and affection
  6. Shared Values/Goals: Alignment on core values and future plans
  7. Fun & Playfulness: Enjoyment of light-hearted moments together
  8. Mutual Support & Respect: How partners encourage and value each other
  9. Independence & Togetherness: Balance between autonomy and connection
  10. Overall Satisfaction: General contentment with the relationship
  
  Your job is to gather information about these dimensions in a conversational, friendly way.`;
  
  // Add stage-specific instructions
  if (stageInstructions[stage]) {
    fullPrompt += `\n\n${stageInstructions[stage]}`;
  }
  
  // Add general conversation guidelines for all onboarding chats
  fullPrompt += `\n
    General guidelines:
    - Keep responses conversational, warm, and engaging
    - Use emoji occasionally to convey warmth (1-2 per message maximum)
    - Ask only one question at a time and wait for a response
    - Responses should be brief (2-4 sentences)
    - Show authentic interest in the user's relationship
    - Structure the conversation to progress through the bond dimensions
    - Remember your goal is to collect information about each dimension to help personalize the BondQuest experience
    - If the user asks about a different topic, gently guide them back to the current relationship dimension
    - DO NOT skip dimensions or rush through them - each is important for building their relationship profile
    - After collecting information on all dimensions, guide them to connect with their partner in the app
  `;
  
  // Add JSON memory collection instructions
  fullPrompt += `\n
    IMPORTANT - At each step, collect and organize the information in this JSON format in your internal memory:
    {
      "userName": "their name",
      "partnerName": "partner's name",
      "dimensions": {
        "communication": { "notes": "summary of their communication patterns", "score": 1-10 },
        "trust": { "notes": "summary of their trust dynamics", "score": 1-10 },
        "emotionalIntimacy": { "notes": "summary of their emotional connection", "score": 1-10 },
        // and so on for each dimension
      }
    }
    
    This is for your internal use only - don't share the JSON with the user or mention that you're collecting it.
    Use this collected information to personalize your responses and provide continuity in the conversation.
  `;
  
  return fullPrompt;
}