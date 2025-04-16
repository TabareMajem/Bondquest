import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { 
  createConversationSession, 
  addConversationMessage, 
  getConversationMessages,
  generateGeminiResponse,
  extractProfileInsightsFromConversation,
  getOnboardingPrompt
} from "../gemini";

const router = Router();

// Schema for creating a new conversation session
const createSessionSchema = z.object({
  userId: z.number(),
  sessionType: z.string(),
  title: z.string()
});

// Schema for sending a message
const sendMessageSchema = z.object({
  sessionId: z.number(),
  message: z.string(),
  systemContext: z.string().optional()
});

// Schema for extracting insights
const extractInsightsSchema = z.object({
  userId: z.number()
});

// Create a new conversation session
router.post("/sessions", async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    
    const session = await createConversationSession({
      userId: data.userId,
      sessionType: data.sessionType,
      status: 'active'
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating conversation session:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ 
      message: "Failed to create conversation session",
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
});

// Get all messages for a session
router.get("/sessions/:sessionId/messages", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    
    const messages = await getConversationMessages(sessionId);
    res.json(messages);
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    res.status(500).json({ 
      message: "Failed to get conversation messages",
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
});

// Send a message to a conversation
router.post("/messages", async (req: Request, res: Response) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    
    // Save the user message
    const userMessage = await addConversationMessage({
      sessionId: data.sessionId,
      sender: 'user',
      message: data.message,
      messageType: 'text'
    });
    
    // Get a system context based on provided value or session type
    let systemContext = data.systemContext;
    
    // If it's a named context, get the appropriate prompt
    if (systemContext && systemContext.startsWith('onboarding_')) {
      const contextType = systemContext.replace('onboarding_', '');
      systemContext = getOnboardingPrompt(contextType);
    }
    
    // Generate AI response
    const aiResponseText = await generateGeminiResponse(
      data.sessionId,
      data.message,
      systemContext
    );
    
    // Save AI response
    const aiMessage = await addConversationMessage({
      sessionId: data.sessionId,
      sender: 'ai',
      message: aiResponseText,
      messageType: 'response'
    });
    
    res.json({
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ 
      message: "Failed to send message",
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
});

// Extract insights from a conversation session
router.post("/sessions/:sessionId/extract-insights", async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    
    const data = extractInsightsSchema.parse(req.body);
    
    // Extract insights from conversation
    const insights = await extractProfileInsightsFromConversation(
      sessionId,
      data.userId
    );
    
    res.json(insights);
  } catch (error) {
    console.error("Error extracting insights:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ 
      message: "Failed to extract insights",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;