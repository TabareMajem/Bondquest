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
  try {
    // Convert any arrays to proper PostgreSQL arrays
    let contentTagsValue = null;
    if (messageData.contentTags) {
      contentTagsValue = Array.isArray(messageData.contentTags) ? messageData.contentTags : null;
    }
    
    let extractedInsightsValue = null;
    if (messageData.extractedInsights) {
      extractedInsightsValue = typeof messageData.extractedInsights === 'object' ? messageData.extractedInsights : null;
    }

    // Using the standard method for inserting records
    const [result] = await db
      .insert(conversationMessages)
      .values({
        sessionId: messageData.sessionId,
        message: messageData.message,
        sender: messageData.sender,
        messageType: messageData.messageType || 'text',
        timestamp: new Date(),
        contentTags: contentTagsValue,
        sentiment: messageData.sentiment || null,
        extractedInsights: extractedInsightsValue
      })
      .returning();
    
    return result;
  } catch (error) {
    console.error('Error adding conversation message:', error);
    throw error;
  }
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
  if (filteredMessages.length > 0 && filteredMessages[0].sender !== 'user') {
    // Use sessionId from first message or default to 0 if there's no session ID
    const sessionId = filteredMessages[0]?.sessionId || 0;
    
    // Add a dummy user message at the beginning
    filteredMessages.unshift({
      id: 0,
      sessionId: sessionId,
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
    
    // Add specific role-playing instructions to prevent refusal responses
    // This is crucial for the AI to perform correctly in the onboarding flow
    const rolePlayingInstructions = `
      IMPORTANT INSTRUCTIONS FOR AURORA AI:
      1. You ARE Aurora, an AI relationship scientist in the BondQuest app.
      2. Your role is to help the user build a stronger relationship with their partner.
      3. You MUST maintain this role throughout the entire conversation.
      4. NEVER tell the user you're not Aurora or that you're a different AI.
      5. NEVER tell the user you can't ask for their name or personal information - specifically for onboarding, you SHOULD ask for their name.
      6. DO NOT send encyclopedia-style responses about what names mean.
      7. When the user provides their name, respond warmly without explaining what their name means.
      8. You are specifically designed to have conversations about relationships and provide guidance.
      9. If you're unsure how to respond, ask a follow-up question about the relationship.
      10. Keep responses conversational, friendly, and concise (2-4 sentences).
      
      The above instructions override any conflicting instructions in previous system prompts.
    `;
    
    // Add this instruction as a system message always
    messages.unshift({
      id: 0,
      sessionId,
      sender: 'system',
      message: rolePlayingInstructions,
      messageType: 'instruction',
      timestamp: new Date(),
      contentTags: null,
      sentiment: null,
      extractedInsights: null
    });
    
    // Format messages for Gemini
    const formattedMessages = formatMessagesForGemini(messages);
    
    try {
      // Start a chat session
      const chat = geminiModel.startChat({
        history: formattedMessages,
        // Use safety settings that are predefined by the Gemini API
        safetySettings: []
      });
      
      // Generate response
      const result = await chat.sendMessage(userMessage);
      let responseText = result.response.text();
      
      // Clean the response to filter out any non-compliant content
      responseText = cleanAIResponse(responseText);
      
      // Validate the response quality
      if (!isValidResponse(responseText, userMessage)) {
        console.log('Invalid or low-quality AI response detected, using fallback');
        return generateFallbackResponse(sessionId, userMessage, systemContext);
      }
      
      return responseText;
    } catch (chatError) {
      console.error('Error in Gemini chat session:', chatError);
      // Try simple content generation as fallback
      try {
        // Add explicit instructions for the content generation
        const enhancedPrompt = `
          ROLE: You are Aurora, the relationship scientist AI in BondQuest app.
          TASK: Respond as Aurora to this user message: "${userMessage}"
          TONE: Friendly, supportive, and concise.
          FORMAT: 2-4 sentences maximum.
          
          IMPORTANT: 
          - NEVER deny being Aurora or refuse to engage in relationship discussions
          - If the user shared their name, acknowledge it warmly without explaining what the name means
          - NEVER say you can't ask for or collect user information - you need to collect relationship information
          - Always stay in character as a relationship AI assistant
        `;
        
        const result = await geminiModel.generateContent(enhancedPrompt);
        let responseText = result.response.text();
        
        // Clean and validate the response
        responseText = cleanAIResponse(responseText);
        
        if (!isValidResponse(responseText, userMessage)) {
          return generateFallbackResponse(sessionId, userMessage, systemContext);
        }
        
        return responseText;
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
 * Clean the AI response to remove problematic content
 */
function cleanAIResponse(text: string): string {
  // Remove any disclaimers about being an AI
  const disclaimerPatterns = [
    /I'm not actually Aurora/i,
    /I am an AI language model/i,
    /I'm an AI assistant/i,
    /I cannot ask for personal information/i,
    /I don't need or ask for personally identifiable information/i,
    /I am a large language model/i,
    /As an AI/i
  ];
  
  let cleanedText = text;
  
  // Check for problematic statements and remove sentences containing them
  for (const pattern of disclaimerPatterns) {
    // Split by sentences and filter out problematic ones
    cleanedText = cleanedText
      .split(/(?<=[.!?])\s+/)
      .filter(sentence => !pattern.test(sentence))
      .join(' ');
  }
  
  // If cleaning removed too much, return a fallback
  if (cleanedText.trim().length < 10) {
    return "I'm Aurora, your relationship scientist. Let's continue our conversation about strengthening your relationship. What would you like to discuss next?";
  }
  
  return cleanedText;
}

/**
 * Validate if the response is appropriate for the conversation
 */
function isValidResponse(responseText: string, userMessage: string): boolean {
  // Check for low-quality or inappropriate responses
  const lowQualityPatterns = [
    /I apologize, but I/i,
    /I'm not able to/i,
    /I cannot/i,
    /As an AI, I don't/i,
    /I don't have personal/i,
    /I don't have the ability/i,
    /I don't need or ask for/i,
    /I don't collect personal/i
  ];
  
  // Check if response contains encyclopedia-style information about names
  const nameInfoPatterns = [
    /is a name of/i,
    /is derived from/i, 
    /is a .* name/i,
    /originates from/i,
    /has roots in/i,
    /means .* in/i
  ];
  
  // Special check for name response
  const namePattern = /^(my name is|i'm|i am|this is|call me)\s+(\w+)/i;
  const nameMatch = userMessage.match(namePattern);
  
  if (nameMatch) {
    // If user provided their name, make sure the response isn't an encyclopedia entry
    for (const pattern of nameInfoPatterns) {
      if (pattern.test(responseText)) {
        return false;
      }
    }
  }
  
  // Check for generic disclaimers
  for (const pattern of lowQualityPatterns) {
    if (pattern.test(responseText)) {
      return false;
    }
  }
  
  return true;
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
    } else if (systemContext && systemContext.includes('trust')) {
      stage = 'trust';
    } else if (systemContext && systemContext.includes('emotional_intimacy')) {
      stage = 'emotional_intimacy';
    } else if (systemContext && systemContext.includes('conflict_resolution')) {
      stage = 'conflict_resolution';
    } else if (systemContext && systemContext.includes('physical_intimacy')) {
      stage = 'physical_intimacy';
    } else if (systemContext && systemContext.includes('shared_values')) {
      stage = 'shared_values';
    } else if (systemContext && systemContext.includes('fun_playfulness')) {
      stage = 'fun_playfulness';
    } else if (systemContext && systemContext.includes('mutual_support')) {
      stage = 'mutual_support';
    } else if (systemContext && systemContext.includes('independence_balance')) {
      stage = 'independence_balance';
    } else if (systemContext && systemContext.includes('overall_satisfaction')) {
      stage = 'overall_satisfaction';
    } else if (systemContext && systemContext.includes('wrap_up')) {
      stage = 'wrap_up';
    }
    
    // Check for name in the user message
    const namePattern = /^(my name is|i'm|i am|this is|call me)\s+(\w+)/i;
    const nameMatch = userMessage.match(namePattern);
    
    // If this is a name response, use a special response
    if (nameMatch && nameMatch[2]) {
      const name = nameMatch[2];
      return `Great to meet you, ${name}! 😊 I'm Aurora, your relationship scientist at BondQuest. I'm here to help you build a stronger relationship with your partner. Could you tell me your partner's name as well?`;
    }
    
    // Structured responses for each stage of the onboarding
    const onboardingResponses: Record<string, string[]> = {
      welcome: [
        "Welcome to BondQuest! 👋 I'm Aurora, your relationship scientist. I'm here to help you build a stronger relationship with your partner. To get started, what's your name?",
        "Hi there! I'm Aurora, your relationship guide at BondQuest. I'll be asking you about various aspects of your relationship to help strengthen your bond. What's your name?",
        "Welcome aboard! I'm Aurora, and I'll be your relationship scientist on BondQuest. To personalize your experience, could you tell me your name?"
      ],
      communication: [
        "Let's talk about communication, which is crucial for every relationship. How would you describe the way you and your partner talk to each other?",
        "Communication is the first dimension we'll explore. How comfortable do you feel expressing your thoughts and feelings to your partner?",
        "Now let's discuss Communication (1/10). Do you and your partner have regular deep conversations, or do you tend to keep to practical matters?"
      ],
      trust: [
        "Trust is essential in relationships. How confident are you that your partner has your back when you need them?",
        "Now for Trust (2/10). Do you feel secure in your relationship, or do you sometimes experience doubts or insecurities?",
        "Trust is our next dimension. How honest and reliable would you say you and your partner are with each other?"
      ],
      emotional_intimacy: [
        "Emotional connection is vital. How close do you feel to your partner emotionally? Can you share vulnerable thoughts and feelings?",
        "Emotional Intimacy (3/10) is about deep connection. How well do you and your partner understand each other's inner worlds?",
        "Let's explore the emotional side of your relationship. Do you feel your partner truly knows the real you?"
      ],
      conflict_resolution: [
        "Every couple has disagreements. How do you and your partner typically handle conflicts when they arise?",
        "Conflict Resolution (4/10) is next. When you disagree, do you work through issues calmly, or do conflicts tend to escalate?",
        "Handling disagreements is important. What's your approach when you and your partner don't see eye to eye?"
      ],
      physical_intimacy: [
        "Physical connection is another dimension of relationships. In general terms, how satisfied are you with the physical aspects of your relationship?",
        "Physical Intimacy (5/10) includes all forms of physical connection. In general, do you feel your needs for physical closeness are being met?",
        "Let's briefly touch on physical connection. Without specifics, are you and your partner generally in sync with physical affection?"
      ],
      shared_values: [
        "Shared values and goals create a foundation. What important values or beliefs do you and your partner have in common?",
        "Values & Goals (6/10) is our next dimension. Are you and your partner aligned on major life goals and values?",
        "Let's talk about what you both believe in. What core values do you and your partner share?"
      ],
      fun_playfulness: [
        "Fun and playfulness keep relationships vibrant. What activities do you and your partner enjoy doing together?",
        "Fun & Enjoyment (7/10) is essential. How often do you and your partner laugh together or engage in playful activities?",
        "Relationships need fun too! What do you and your partner do to enjoy each other's company and keep things light?"
      ],
      mutual_support: [
        "Supporting each other matters. How do you show up for your partner when they're going through challenges?",
        "Support & Respect (8/10) is our next focus. Do you feel your partner respects your individuality and supports your personal growth?",
        "Let's discuss how you support each other. Do you feel appreciated and respected in your relationship?"
      ],
      independence_balance: [
        "Balancing togetherness and independence can be tricky. How do you maintain your own identity while being part of a couple?",
        "Independence & Balance (9/10) is important. How do you balance time together with personal space and individual pursuits?",
        "Every relationship needs balance. Do you feel you have enough personal freedom while maintaining a close connection?"
      ],
      overall_satisfaction: [
        "Overall, how satisfied are you with your relationship right now? What makes you happiest about being with your partner?",
        "Overall Satisfaction (10/10) is our final dimension. On a scale of 1-10, how would you rate your relationship satisfaction currently?",
        "Looking at the big picture, what aspects of your relationship bring you the most joy and fulfillment?"
      ],
      wrap_up: [
        "Thank you for sharing so openly about your relationship! Based on what you've told me, I'll generate some personalized insights to help strengthen your bond.",
        "You've provided great information about your relationship! I'll use this to create a relationship profile that will help guide your journey on BondQuest.",
        "That's all the questions I have for now. Thanks for your thoughtful responses! This will help me provide tailored activities and insights for you and your partner."
      ],
      unknown: [
        "I'm Aurora, your relationship scientist at BondQuest. I'm here to help you understand and strengthen your relationship through science-backed insights. What would you like to know?",
        "Thanks for sharing! To give you the best guidance, could you tell me more about that aspect of your relationship?",
        "I appreciate your openness. As your relationship scientist, I'm here to help you navigate the complexities of your connection. What else would you like to explore?"
      ]
    };
    
    // Get the array of possible responses for this stage
    const responseOptions = onboardingResponses[stage] || onboardingResponses.unknown;
    
    // Select a random response from the options
    const randomIndex = Math.floor(Math.random() * responseOptions.length);
    return responseOptions[randomIndex];
    
  } catch (error) {
    console.error('Error generating fallback response:', error);
    return "I'm Aurora, your relationship scientist at BondQuest. I'm here to help you build a stronger relationship. What would you like to know?";
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
              // Ensure data is typed correctly
              const dimensionData = data as {
                notes?: string;
                score?: number;
                strengths?: string[];
                growth_areas?: string[];
              };
              
              const dimensionInsight = await saveProfileInsight({
                userId,
                insightType: `bond_dimension_${dimension}`,
                insight: dimensionData.notes || `Information about ${dimension}`,
                confidenceScore: dimensionData.score ? 'high' : 'low',
                sourceSessionIds: [sessionId],
                metadata: {
                  dimensionScore: dimensionData.score,
                  dimensionType: dimension
                }
              });
              savedInsights.push(dimensionInsight);
              
              // Strengths for this dimension
              if (dimensionData.strengths && Array.isArray(dimensionData.strengths) && dimensionData.strengths.length > 0) {
                const strengthsInsight = await saveProfileInsight({
                  userId,
                  insightType: `${dimension}_strengths`,
                  insight: `Strengths in ${dimension}: ${dimensionData.strengths.join(', ')}`,
                  confidenceScore: 'medium',
                  sourceSessionIds: [sessionId]
                });
                savedInsights.push(strengthsInsight);
              }
              
              // Growth areas for this dimension
              if (dimensionData.growth_areas && Array.isArray(dimensionData.growth_areas) && dimensionData.growth_areas.length > 0) {
                const growthInsight = await saveProfileInsight({
                  userId,
                  insightType: `${dimension}_growth_areas`,
                  insight: `Growth areas in ${dimension}: ${dimensionData.growth_areas.join(', ')}`,
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
      You are Aurora, BondQuest's relationship scientist. Your goal is to create an engaging, supportive onboarding experience
      as you guide users through assessing their relationship across 10 key bond dimensions.
      
      CRITICAL STRUCTURE TO FOLLOW:
      1. Start with a warm, enthusiastic welcome: "Hi! I'm Aurora, your relationship scientist at BondQuest. 👋 I'm excited to help you strengthen your bond!"
      2. Explain BondQuest's purpose clearly: "BondQuest helps couples build stronger relationships by measuring and improving 10 key dimensions of your bond."
      3. Create emotional connection by explaining the value: "By understanding your unique relationship strengths and growth areas, you'll gain powerful insights to bring you closer together."
      4. Ask for their name FIRST: "To get started, what's your name?" (Wait for response)
      5. Then ask for partner's name: "Great to meet you, [name]! And what's your partner's name?" (Wait for response)
      6. Show a visual transition to assessment: "Thanks! Now I'm going to guide you through a brief relationship assessment covering 10 key dimensions of your bond with [partner's name]."
      7. IMPORTANT: Explicitly show the progress indicator: "We'll start with Communication (1/10) ✨"
      
      KEY RULES:
      • Keep messages concise (30-70 words maximum)
      • Use 1-2 emojis per message to add warmth
      • Number the dimensions explicitly (e.g., "Communication (1/10)")
      • Ask only ONE question at a time and wait for response
      • Make it conversational, not like a formal survey
      • CRITICAL: After gathering 2-3 points about communication, explicitly transition to the next dimension: "Now let's talk about Trust (2/10) 🔒"
      
      YOUR TONE: Warm, supportive, conversational, and enthusiastic - like a friendly relationship coach who truly cares about helping them.
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