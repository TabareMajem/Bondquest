import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import { 
  users, couples, userSubscriptions, competitions, coupleRewards,
  conversationSessions, conversationMessages, profileInsights, userPreferences,
  insertUserSchema, insertCoupleSchema, insertQuizSchema, insertQuizSessionSchema, 
  insertQuestionSchema, insertDailyCheckInSchema, insertChatSchema,
  insertSubscriptionTierSchema, insertUserSubscriptionSchema, insertRewardSchema,
  insertCompetitionSchema, insertCompetitionRewardSchema, insertCompetitionEntrySchema,
  insertCoupleRewardSchema, insertUserPreferencesSchema
} from "@shared/schema";
import { 
  generateAIResponse, 
  generateRelationshipInsights, 
  generateQuiz, 
  generateCompetition 
} from "./openai";
import { 
  initializeGeminiAPI, 
  createConversationSession, 
  addConversationMessage,
  getConversationMessages, 
  generateGeminiResponse,
  extractProfileInsightsFromConversation,
  getOnboardingPrompt
} from "./gemini";

// Import routes
import bondRoutes from './routes/bondRoutes';
import conversationRoutes from './routes/conversationRoutes';

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // Register API routes
  app.use('/api/bond', bondRoutes);
  app.use('/api/conversation', conversationRoutes);

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email is already taken
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(validatedData);
      
      // Create default user preferences
      try {
        await storage.createUserPreferences({
          userId: user.id,
          dailyReminders: true,
          partnerActivity: true,
          competitionUpdates: true,
          appUpdates: true,
          publicProfile: false,
          activityVisibility: true,
          dataCollection: true,
          marketingEmails: false,
          preferredAssistant: "aurora",
          proactiveAiSuggestions: true,
          personalizedInsights: true,
          contentCustomization: true,
          darkMode: false,
          accentColor: "purple",
          language: "en-GB"
        });
        console.log(`Created default preferences for user ${user.id}`);
      } catch (prefsError) {
        console.error(`Failed to create default preferences for user ${user.id}:`, prefsError);
        // Don't fail the registration if preferences creation fails
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string()
      }).parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, we would set up a session or JWT here
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Check if user is part of a couple
      const couple = await storage.getCoupleByUserId(user.id);
      
      // Get user preferences
      let preferences = await storage.getUserPreferences(user.id);
      
      // Create default preferences if none exist
      if (!preferences) {
        try {
          preferences = await storage.createUserPreferences({
            userId: user.id,
            dailyReminders: true,
            partnerActivity: true,
            competitionUpdates: true,
            appUpdates: true,
            publicProfile: false,
            activityVisibility: true,
            dataCollection: true,
            marketingEmails: false,
            preferredAssistant: "aurora",
            proactiveAiSuggestions: true,
            personalizedInsights: true,
            contentCustomization: true,
            darkMode: false,
            accentColor: "purple",
            language: "en-GB"
          });
          console.log(`Created default preferences for user ${user.id} during login`);
        } catch (prefsError) {
          console.error(`Failed to create default preferences for user ${user.id}:`, prefsError);
          // Continue without preferences if creation fails
        }
      }
      
      res.json({ 
        user: userWithoutPassword, 
        couple,
        preferences
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // Partner linking
  app.post("/api/partner/link", async (req, res) => {
    try {
      const { userId, partnerCode } = z.object({
        userId: z.number(),
        partnerCode: z.string()
      }).parse(req.body);
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is already in a couple
      const existingCouple = await storage.getCoupleByUserId(userId);
      if (existingCouple) {
        return res.status(400).json({ message: "User is already in a couple" });
      }
      
      // Find partner by code
      const partner = await storage.getUserByPartnerCode(partnerCode);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found with this code" });
      }
      
      // Check if partner is already in a couple
      const partnerCouple = await storage.getCoupleByUserId(partner.id);
      if (partnerCouple) {
        return res.status(400).json({ message: "Partner is already in a couple" });
      }
      
      // Ensure user isn't trying to link with themselves
      if (user.id === partner.id) {
        return res.status(400).json({ message: "Cannot link with yourself" });
      }
      
      // Create couple
      const couple = await storage.createCouple({
        userId1: user.id,
        userId2: partner.id,
        bondStrength: 50,
        level: 1,
        xp: 0
      });
      
      res.status(201).json(couple);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to link partner" });
    }
  });

  // User Profile Routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User Preferences Routes
  app.get("/api/users/:userId/preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });
  
  app.post("/api/users/:userId/preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if preferences already exist
      const existingPrefs = await storage.getUserPreferences(userId);
      if (existingPrefs) {
        return res.status(400).json({ message: "User preferences already exist. Use PATCH to update." });
      }
      
      const validatedData = insertUserPreferencesSchema.parse({
        userId,
        ...req.body
      });
      
      const preferences = await storage.createUserPreferences(validatedData);
      res.status(201).json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create user preferences" });
    }
  });
  
  app.patch("/api/users/:userId/preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if preferences exist
      const existingPrefs = await storage.getUserPreferences(userId);
      if (!existingPrefs) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      
      const updates = req.body;
      const updatedPreferences = await storage.updateUserPreferences(userId, updates);
      
      res.json(updatedPreferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Quiz Routes
  app.get("/api/quizzes", async (_req, res) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quizzes" });
    }
  });
  
  app.post("/api/quizzes", async (req, res) => {
    try {
      const validatedData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(validatedData);
      res.status(201).json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.get("/api/quizzes/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const quizzes = await storage.getQuizzesByCategory(category);
      res.json(quizzes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quizzes by category" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await storage.getQuiz(quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const questions = await storage.getQuestions(quizId);
      
      res.json({ quiz, questions });
    } catch (error) {
      res.status(500).json({ message: "Failed to get quiz" });
    }
  });
  
  // Questions Route
  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Quiz Session Routes
  app.post("/api/quiz-sessions", async (req, res) => {
    try {
      const validatedData = insertQuizSessionSchema.parse(req.body);
      const session = await storage.createQuizSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create quiz session" });
    }
  });

  app.patch("/api/quiz-sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      
      const updates = req.body;
      const updatedSession = await storage.updateQuizSession(sessionId, updates);
      
      // If session is being completed, update couple experience and bond strength
      if (updates.completed && !session.completed && updates.pointsEarned) {
        const couple = await storage.getCouple(session.coupleId);
        if (couple) {
          await storage.updateCoupleXP(couple.id, updates.pointsEarned);
          
          // Get the quiz details
          const quiz = await storage.getQuiz(session.quizId);
          
          // Generate AI insights if answers are provided
          let insights = "";
          if (updates.user1Answers && Object.keys(updates.user1Answers).length > 0 && quiz) {
            try {
              insights = await generateRelationshipInsights(updates.user1Answers, quiz.category);
            } catch (error) {
              console.error("Failed to generate relationship insights:", error);
              insights = "Your relationship is showing great potential. Keep exploring together!";
            }
          }
          
          // Create activity record with insights
          await storage.createActivity({
            coupleId: couple.id,
            type: "quiz",
            referenceId: sessionId,
            points: updates.pointsEarned,
            description: insights
          });
          
          // Update bond strength if match percentage is provided
          if (updates.matchPercentage && couple.bondStrength !== null) {
            // Calculate new bond strength (weighted average)
            const currentBondStrength = couple.bondStrength || 50; // Default to 50 if null
            const newBondStrength = Math.round(
              (currentBondStrength * 0.7) + (updates.matchPercentage * 0.3)
            );
            await storage.updateCoupleBondStrength(couple.id, newBondStrength);
          }
        }
      }
      
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz session" });
    }
  });

  // Individual user completes their portion of the quiz
  app.patch("/api/quiz-sessions/:id/user/:userId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const session = await storage.getQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      
      // Get couple info to determine if user is user1 or user2
      const couple = await storage.getCouple(session.coupleId);
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      const isUser1 = couple.userId1 === userId;
      const isUser2 = couple.userId2 === userId;
      
      if (!isUser1 && !isUser2) {
        return res.status(403).json({ message: "User not part of this couple" });
      }
      
      const { answers } = req.body;
      const updates: Partial<QuizSession> = {};
      
      // Store the user's answers
      if (isUser1) {
        updates.user1Answers = answers;
        updates.user1Completed = true;
        updates.user1CompletedAt = new Date();
      } else {
        updates.user2Answers = answers;
        updates.user2Completed = true;
        updates.user2CompletedAt = new Date();
      }
      
      // Check if both users have completed
      const bothComplete = 
        (isUser1 && session.user2Completed) || 
        (isUser2 && session.user1Completed);
      
      let user1Answers = isUser1 ? answers : (session.user1Answers || {});
      let user2Answers = isUser2 ? answers : (session.user2Answers || {});
      
      // If both complete, do the match comparison and set session as fully complete
      if (bothComplete) {
        updates.completed = true;
        
        // Calculate match percentage based on both users' answers
        // This assumes questions with matching IDs should have matching answers
        let matchCount = 0;
        let totalQuestions = 0;
        
        // Compare answers for questions that both users answered
        const sharedQuestionIds = Object.keys(user1Answers).filter(id => 
          user2Answers && Object.keys(user2Answers).includes(id)
        );
        
        totalQuestions = sharedQuestionIds.length;
        
        if (totalQuestions > 0) {
          for (const questionId of sharedQuestionIds) {
            if (user1Answers[questionId] === user2Answers[questionId]) {
              matchCount++;
            }
          }
          
          // Calculate match percentage (minimum 50% to keep it positive)
          const calculatedMatchPercentage = Math.floor(50 + (matchCount / totalQuestions) * 50);
          updates.matchPercentage = calculatedMatchPercentage;
          
          // Calculate points (more points for better matches)
          const pointBase = 10 * totalQuestions; // Base points for completing
          const matchBonus = Math.floor((matchCount / totalQuestions) * pointBase); // Bonus for matching
          updates.pointsEarned = pointBase + matchBonus;
        } else {
          // If no shared questions, set default values
          updates.matchPercentage = 75; // Default match percentage
          updates.pointsEarned = 50; // Default points
        }
      }
      
      const updatedSession = await storage.updateQuizSession(sessionId, updates);
      
      // If session is now fully completed, update couple XP and create activity
      if (updates.completed && updates.pointsEarned) {
        if (couple) {
          await storage.updateCoupleXP(couple.id, updates.pointsEarned);
          
          // Get the quiz details
          const quiz = await storage.getQuiz(session.quizId);
          
          // Generate AI insights if answers are provided
          let insights = "";
          if (quiz) {
            try {
              // We'll use the most complete set of answers for insights
              const insightAnswers = Object.keys(user1Answers || {}).length >= Object.keys(user2Answers || {}).length 
                ? user1Answers 
                : user2Answers;
              
              insights = await generateRelationshipInsights(insightAnswers, quiz.category);
            } catch (error) {
              console.error("Failed to generate relationship insights:", error);
              insights = "Your relationship is showing great potential. Keep exploring together!";
            }
          }
          
          // Create activity record with insights
          await storage.createActivity({
            coupleId: couple.id,
            type: "quiz",
            referenceId: sessionId,
            points: updates.pointsEarned,
            description: insights
          });
          
          // Update bond strength if match percentage is provided
          if (updates.matchPercentage && couple.bondStrength !== null) {
            // Calculate new bond strength (weighted average)
            const currentBondStrength = couple.bondStrength || 50; // Default to 50 if null
            const newBondStrength = Math.round(
              (currentBondStrength * 0.7) + (updates.matchPercentage * 0.3)
            );
            await storage.updateCoupleBondStrength(couple.id, newBondStrength);
          }
        }
      }
      
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating quiz session:", error);
      res.status(500).json({ message: "Failed to update quiz session" });
    }
  });

  app.get("/api/couples/:coupleId/quiz-sessions", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const sessions = await storage.getQuizSessionsByCouple(coupleId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quiz sessions" });
    }
  });
  
  app.get("/api/quiz-sessions/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quiz session" });
    }
  });

  // Daily Check-In Routes
  app.post("/api/daily-check-ins", async (req, res) => {
    try {
      const validatedData = insertDailyCheckInSchema.parse(req.body);
      const checkIn = await storage.createDailyCheckIn(validatedData);
      
      // Get user's couple
      const couple = await storage.getCoupleByUserId(checkIn.userId);
      if (couple) {
        // Create activity for check-in
        await storage.createActivity({
          coupleId: couple.id,
          type: "check_in",
          referenceId: checkIn.id,
          points: 5, // Fixed points for check-in
          description: checkIn.note
        });
        
        // Update couple XP
        await storage.updateCoupleXP(couple.id, 5);
      }
      
      res.status(201).json(checkIn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create daily check-in" });
    }
  });

  app.get("/api/users/:userId/daily-check-ins", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const checkIns = await storage.getDailyCheckIns(userId);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ message: "Failed to get daily check-ins" });
    }
  });

  // Achievement Routes
  app.get("/api/couples/:coupleId/achievements", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const achievements = await storage.getAchievements(coupleId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  // Activity Routes
  app.get("/api/couples/:coupleId/activities", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivitiesByCouple(coupleId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Chat (AI Assistant) Routes
  app.post("/api/chats", async (req, res) => {
    try {
      const validatedData = insertChatSchema.parse(req.body);
      const chat = await storage.createChat(validatedData);
      
      // If it's a user message, generate an AI response
      if (validatedData.sender === "user") {
        const aiResponse = await generateAIResponse(validatedData.message, validatedData.assistantType);
        
        // Save AI response
        const aiChat = await storage.createChat({
          coupleId: validatedData.coupleId,
          assistantType: validatedData.assistantType,
          message: aiResponse,
          sender: "assistant"
        });
        
        res.status(201).json({
          userMessage: chat,
          aiResponse: aiChat
        });
      } else {
        res.status(201).json(chat);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  app.get("/api/couples/:coupleId/chats", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const chats = await storage.getChatsByCouple(coupleId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  // Couple Routes
  app.get("/api/couples/:id", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.id);
      const couple = await storage.getCouple(coupleId);
      
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      res.json(couple);
    } catch (error) {
      res.status(500).json({ message: "Failed to get couple" });
    }
  });

  // Couple Dashboard Route
  app.get("/api/couples/:coupleId/dashboard", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      
      // Get couple info
      const couple = await storage.getCouple(coupleId);
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      // Get recent activities
      const recentActivities = await storage.getActivitiesByCouple(coupleId, 5);
      
      // Get quiz sessions
      const quizSessions = await storage.getQuizSessionsByCouple(coupleId);
      
      // Get users info
      const user1 = await storage.getUser(couple.userId1);
      const user2 = await storage.getUser(couple.userId2);
      
      if (!user1 || !user2) {
        return res.status(404).json({ message: "Users not found" });
      }
      
      // Remove passwords from users
      const { password: _, ...user1WithoutPassword } = user1;
      const { password: __, ...user2WithoutPassword } = user2;
      
      // Get all quizzes for the daily challenge
      const quizzes = await storage.getQuizzes();
      const dailyQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      
      res.json({
        couple,
        user1: user1WithoutPassword,
        user2: user2WithoutPassword,
        recentActivities,
        quizSessions,
        dailyQuiz
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  // Subscription Tier Routes - Admin Only
  app.post("/api/admin/subscription-tiers", async (req, res) => {
    try {
      const validatedData = insertSubscriptionTierSchema.parse(req.body);
      const tier = await storage.createSubscriptionTier(validatedData);
      res.status(201).json(tier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create subscription tier" });
    }
  });

  app.get("/api/subscription-tiers", async (req, res) => {
    try {
      const tiers = await storage.getSubscriptionTiers();
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get subscription tiers" });
    }
  });

  app.get("/api/subscription-tiers/:id", async (req, res) => {
    try {
      const tierId = parseInt(req.params.id);
      const tier = await storage.getSubscriptionTier(tierId);
      
      if (!tier) {
        return res.status(404).json({ message: "Subscription tier not found" });
      }
      
      res.json(tier);
    } catch (error) {
      res.status(500).json({ message: "Failed to get subscription tier" });
    }
  });

  app.patch("/api/admin/subscription-tiers/:id", async (req, res) => {
    try {
      const tierId = parseInt(req.params.id);
      const tier = await storage.getSubscriptionTier(tierId);
      
      if (!tier) {
        return res.status(404).json({ message: "Subscription tier not found" });
      }
      
      const updates = req.body;
      const updatedTier = await storage.updateSubscriptionTier(tierId, updates);
      
      res.json(updatedTier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subscription tier" });
    }
  });

  // User Subscription Routes
  app.post("/api/users/:userId/subscriptions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user already has an active subscription
      const existingSubscription = await storage.getUserSubscription(userId);
      if (existingSubscription && existingSubscription.status === "active") {
        return res.status(400).json({ message: "User already has an active subscription" });
      }
      
      // Parse subscription data
      const subscriptionData = insertUserSubscriptionSchema.parse({
        ...req.body,
        userId
      });
      
      const subscription = await storage.createUserSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.get("/api/users/:userId/subscription", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to get subscription" });
    }
  });

  app.patch("/api/users/:userId/subscription/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const subscriptionId = parseInt(req.params.id);
      
      // Validate subscription belongs to user
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || subscription.id !== subscriptionId) {
        return res.status(404).json({ message: "Subscription not found for this user" });
      }
      
      const updates = req.body;
      const updatedSubscription = await storage.updateUserSubscription(subscriptionId, updates);
      
      res.json(updatedSubscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.delete("/api/users/:userId/subscription/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const subscriptionId = parseInt(req.params.id);
      
      // Validate subscription belongs to user
      const subscription = await storage.getUserSubscription(userId);
      if (!subscription || subscription.id !== subscriptionId) {
        return res.status(404).json({ message: "Subscription not found for this user" });
      }
      
      const canceledSubscription = await storage.cancelUserSubscription(subscriptionId);
      
      res.json(canceledSubscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Reward Routes - Admin Only for creation and updates
  app.post("/api/admin/rewards", async (req, res) => {
    try {
      const validatedData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(validatedData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  app.get("/api/rewards", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activeOnly = req.query.activeOnly === "false" ? false : true;
      
      const rewards = await storage.getRewards(limit, activeOnly);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });

  app.get("/api/rewards/:id", async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const reward = await storage.getReward(rewardId);
      
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      res.json(reward);
    } catch (error) {
      res.status(500).json({ message: "Failed to get reward" });
    }
  });

  app.patch("/api/admin/rewards/:id", async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const reward = await storage.getReward(rewardId);
      
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      const updates = req.body;
      const updatedReward = await storage.updateReward(rewardId, updates);
      
      res.json(updatedReward);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reward" });
    }
  });

  // Competition Routes
  app.post("/api/admin/competitions", async (req, res) => {
    try {
      const validatedData = insertCompetitionSchema.parse(req.body);
      const competition = await storage.createCompetition(validatedData);
      res.status(201).json(competition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create competition" });
    }
  });

  app.get("/api/competitions", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const competitions = await storage.getCompetitions(status, limit);
      res.json(competitions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get competitions" });
    }
  });

  app.get("/api/competitions/:id", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const competition = await storage.getCompetition(competitionId);
      
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      // Get rewards associated with this competition
      const rewards = await storage.getCompetitionRewards(competitionId);
      
      res.json({ competition, rewards });
    } catch (error) {
      res.status(500).json({ message: "Failed to get competition" });
    }
  });

  app.patch("/api/admin/competitions/:id", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const competition = await storage.getCompetition(competitionId);
      
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      const updates = req.body;
      const updatedCompetition = await storage.updateCompetition(competitionId, updates);
      
      res.json(updatedCompetition);
    } catch (error) {
      res.status(500).json({ message: "Failed to update competition" });
    }
  });

  // Competition Rewards - Admin Only
  app.post("/api/admin/competitions/:competitionId/rewards", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      
      // Validate competition exists
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      // Parse reward data
      const rewardData = insertCompetitionRewardSchema.parse({
        ...req.body,
        competitionId
      });
      
      // Validate reward exists
      const reward = await storage.getReward(rewardData.rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      const competitionReward = await storage.addRewardToCompetition(rewardData);
      res.status(201).json(competitionReward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add reward to competition" });
    }
  });

  app.get("/api/competitions/:competitionId/rewards", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      
      // Validate competition exists
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      const rewards = await storage.getCompetitionRewards(competitionId);
      
      // Get the full reward details for each competition reward
      const fullRewardDetails = await Promise.all(
        rewards.map(async (compReward) => {
          const reward = await storage.getReward(compReward.rewardId);
          return {
            ...compReward,
            reward
          };
        })
      );
      
      res.json(fullRewardDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get competition rewards" });
    }
  });

  // Competition Entries
  app.post("/api/competitions/:competitionId/entries", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      
      // Validate competition exists and is active
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      if (competition.status !== "active") {
        return res.status(400).json({ message: "Competition is not currently active" });
      }
      
      const now = new Date();
      if (now < competition.startDate || now > competition.endDate) {
        return res.status(400).json({ message: "Competition is not currently accepting entries" });
      }
      
      // Check if maximum participants is reached
      if (competition.maxParticipants && competition.participantCount >= competition.maxParticipants) {
        return res.status(400).json({ message: "Competition has reached maximum number of participants" });
      }
      
      // Parse entry data
      const entryData = insertCompetitionEntrySchema.parse({
        ...req.body,
        competitionId
      });
      
      // Check if couple already has an entry for this competition
      const existingEntry = await storage.getCompetitionEntry(competitionId, entryData.coupleId);
      if (existingEntry) {
        return res.status(400).json({ message: "Couple already has an entry for this competition" });
      }
      
      // If competition requires a subscription, check if couple has an active subscription
      if (competition.requiredTier) {
        const couple = await storage.getCouple(entryData.coupleId);
        if (!couple) {
          return res.status(404).json({ message: "Couple not found" });
        }
        
        // Check if either user in the couple has the required subscription
        const user1Subscription = await storage.getUserSubscription(couple.userId1);
        const user2Subscription = await storage.getUserSubscription(couple.userId2);
        
        const hasRequiredSubscription = 
          (user1Subscription && 
            user1Subscription.status === "active" && 
            user1Subscription.tierId === competition.requiredTier) ||
          (user2Subscription && 
            user2Subscription.status === "active" && 
            user2Subscription.tierId === competition.requiredTier);
            
        if (!hasRequiredSubscription) {
          return res.status(403).json({ message: "Required subscription tier not found" });
        }
      }
      
      const entry = await storage.createCompetitionEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create competition entry" });
    }
  });

  app.get("/api/competitions/:competitionId/entries", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      
      // Validate competition exists
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      const entries = await storage.getCompetitionEntries(competitionId);
      
      // Enhance entries with couple information
      const enhancedEntries = await Promise.all(
        entries.map(async (entry) => {
          const couple = await storage.getCouple(entry.coupleId);
          if (couple) {
            const user1 = await storage.getUser(couple.userId1);
            const user2 = await storage.getUser(couple.userId2);
            
            // Remove sensitive user data
            let user1Data = null;
            let user2Data = null;
            
            if (user1) {
              const { password, ...safeUser1 } = user1;
              user1Data = safeUser1;
            }
            
            if (user2) {
              const { password, ...safeUser2 } = user2;
              user2Data = safeUser2;
            }
            
            return {
              ...entry,
              couple: {
                ...couple,
                user1: user1Data,
                user2: user2Data
              }
            };
          }
          return entry;
        })
      );
      
      res.json(enhancedEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to get competition entries" });
    }
  });

  app.patch("/api/competitions/:competitionId/entries/:entryId/score", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.competitionId);
      const entryId = parseInt(req.params.entryId);
      
      const { score } = z.object({
        score: z.number().min(0)
      }).parse(req.body);
      
      // Validate competition exists
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      const updatedEntry = await storage.updateCompetitionEntryScore(entryId, score);
      if (!updatedEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      
      // After updating score, we may need to recalculate rankings
      // This would typically be done by a background job or scheduled task
      // For simplicity, we'll just handle it directly here
      
      // Get all entries for this competition
      const allEntries = await storage.getCompetitionEntries(competitionId);
      
      // Sort by score (descending)
      const sortedEntries = [...allEntries].sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Update ranks
      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        const rank = i + 1; // 1-based index for rank
        
        if (entry.rank !== rank) {
          await storage.updateCompetitionEntryRank(entry.id, rank);
        }
      }
      
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update entry score" });
    }
  });

  // Couple Rewards
  app.post("/api/admin/couples/:coupleId/rewards", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      
      // Validate couple exists
      const couple = await storage.getCouple(coupleId);
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      // Parse reward data
      const rewardData = insertCoupleRewardSchema.parse({
        ...req.body,
        coupleId
      });
      
      // Validate reward exists and is available
      const reward = await storage.getReward(rewardData.rewardId);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      // Check if reward requires a specific subscription tier
      if (reward.requiredTier) {
        // Check if either user in the couple has the required subscription
        const user1Subscription = await storage.getUserSubscription(couple.userId1);
        const user2Subscription = await storage.getUserSubscription(couple.userId2);
        
        const hasRequiredSubscription = 
          (user1Subscription && 
            user1Subscription.status === "active" && 
            user1Subscription.tierId === reward.requiredTier) ||
          (user2Subscription && 
            user2Subscription.status === "active" && 
            user2Subscription.tierId === reward.requiredTier);
            
        if (!hasRequiredSubscription) {
          return res.status(403).json({ message: "Required subscription tier not found" });
        }
      }
      
      const now = new Date();
      if (!reward.active || reward.availableFrom > now || reward.availableTo < now) {
        return res.status(400).json({ message: "Reward is not currently available" });
      }
      
      if (reward.quantity <= 0) {
        return res.status(400).json({ message: "Reward is out of stock" });
      }
      
      const coupleReward = await storage.createCoupleReward(rewardData);
      res.status(201).json(coupleReward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to award reward to couple" });
    }
  });

  app.get("/api/couples/:coupleId/rewards", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      
      // Validate couple exists
      const couple = await storage.getCouple(coupleId);
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      const coupleRewards = await storage.getCoupleRewards(coupleId);
      
      // Get the full reward details for each couple reward
      const fullRewardDetails = await Promise.all(
        coupleRewards.map(async (coupleReward) => {
          const reward = await storage.getReward(coupleReward.rewardId);
          return {
            ...coupleReward,
            reward
          };
        })
      );
      
      res.json(fullRewardDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get couple rewards" });
    }
  });

  app.patch("/api/couples/:coupleId/rewards/:rewardId/claim", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const rewardId = parseInt(req.params.rewardId);
      
      // Validate couple exists
      const couple = await storage.getCouple(coupleId);
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      // Find the couple reward
      const coupleReward = await storage.getCoupleReward(rewardId);
      if (!coupleReward || coupleReward.coupleId !== coupleId) {
        return res.status(404).json({ message: "Reward not found for this couple" });
      }
      
      // Validate reward is in a state that can be claimed
      if (coupleReward.status !== "awarded") {
        return res.status(400).json({ message: `Reward cannot be claimed (current status: ${coupleReward.status})` });
      }
      
      const updatedReward = await storage.updateCoupleRewardStatus(rewardId, "claimed");
      
      res.json(updatedReward);
    } catch (error) {
      res.status(500).json({ message: "Failed to claim reward" });
    }
  });

  app.patch("/api/admin/couples/:coupleId/rewards/:rewardId/shipping", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const rewardId = parseInt(req.params.rewardId);
      
      const { trackingNumber, shippingAddress } = z.object({
        trackingNumber: z.string(),
        shippingAddress: z.object({
          name: z.string(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
          phone: z.string().optional()
        })
      }).parse(req.body);
      
      // Validate couple exists
      const couple = await storage.getCouple(coupleId);
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      // Find the couple reward
      const coupleReward = await storage.getCoupleReward(rewardId);
      if (!coupleReward || coupleReward.coupleId !== coupleId) {
        return res.status(404).json({ message: "Reward not found for this couple" });
      }
      
      // Validate reward is in a state that can be shipped
      if (coupleReward.status !== "claimed") {
        return res.status(400).json({ message: `Reward cannot be shipped (current status: ${coupleReward.status})` });
      }
      
      const updatedReward = await storage.updateCoupleRewardShipping(rewardId, trackingNumber, shippingAddress);
      
      res.json(updatedReward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update shipping information" });
    }
  });

  app.patch("/api/admin/couples/:coupleId/rewards/:rewardId/status", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const rewardId = parseInt(req.params.rewardId);
      
      const { status } = z.object({
        status: z.enum(["awarded", "claimed", "shipped", "delivered", "expired"])
      }).parse(req.body);
      
      // Validate couple exists
      const couple = await storage.getCouple(coupleId);
      if (!couple) {
        return res.status(404).json({ message: "Couple not found" });
      }
      
      // Find the couple reward
      const coupleReward = await storage.getCoupleReward(rewardId);
      if (!coupleReward || coupleReward.coupleId !== coupleId) {
        return res.status(404).json({ message: "Reward not found for this couple" });
      }
      
      const updatedReward = await storage.updateCoupleRewardStatus(rewardId, status);
      
      res.json(updatedReward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update reward status" });
    }
  });

  // User Preferences Routes
  app.get("/api/user-preferences/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });
  
  app.post("/api/user-preferences", async (req, res) => {
    try {
      const validatedData = insertUserPreferencesSchema.parse(req.body);
      
      // Check if preferences already exist for this user
      const existingPreferences = await storage.getUserPreferences(validatedData.userId);
      if (existingPreferences) {
        return res.status(400).json({ message: "Preferences already exist for this user. Use PATCH to update." });
      }
      
      const preferences = await storage.createUserPreferences(validatedData);
      res.status(201).json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create user preferences" });
    }
  });
  
  app.patch("/api/user-preferences/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if preferences exist for this user
      const existingPreferences = await storage.getUserPreferences(userId);
      if (!existingPreferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }
      
      const updates = req.body;
      const updatedPreferences = await storage.updateUserPreferences(userId, updates);
      
      res.json(updatedPreferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // User Profile Routes
  app.get("/api/profiles/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
  app.post("/api/profiles", async (req, res) => {
    try {
      const validatedData = insertUserProfileSchema.parse(req.body);
      
      // Check if profile already exists for this user
      const existingProfile = await storage.getUserProfile(validatedData.userId);
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists for this user" });
      }
      
      const profile = await storage.createUserProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating user profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create user profile" });
    }
  });
  
  app.patch("/api/profiles/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const updates = req.body;
      const updatedProfile = await storage.updateUserProfile(userId, updates);
      
      if (!updatedProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  
  // Profile Questions Routes
  app.get("/api/profile-questions", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const questions = await storage.getProfileQuestions(category);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching profile questions:", error);
      res.status(500).json({ message: "Failed to fetch profile questions" });
    }
  });
  
  app.post("/api/profile-questions", async (req, res) => {
    try {
      const validatedData = insertProfileQuestionSchema.parse(req.body);
      const question = await storage.createProfileQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating profile question:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create profile question" });
    }
  });
  
  // User Responses Routes
  app.get("/api/user-responses/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const responses = await storage.getUserResponses(userId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching user responses:", error);
      res.status(500).json({ message: "Failed to fetch user responses" });
    }
  });
  
  app.post("/api/user-responses", async (req, res) => {
    try {
      const validatedData = insertUserResponseSchema.parse(req.body);
      const response = await storage.createUserResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating user response:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create user response" });
    }
  });
  
  // Partner Quiz Routes
  app.post("/api/partner-quiz/questions", async (req, res) => {
    try {
      const validatedData = insertPartnerQuizQuestionSchema.parse(req.body);
      const question = await storage.createPartnerQuizQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating partner quiz question:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create partner quiz question" });
    }
  });
  
  app.get("/api/partner-quiz/questions/:quizSessionId", async (req, res) => {
    try {
      const quizSessionId = parseInt(req.params.quizSessionId);
      if (isNaN(quizSessionId)) {
        return res.status(400).json({ message: "Invalid quiz session ID" });
      }
      
      const questions = await storage.getPartnerQuizQuestions(quizSessionId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching partner quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch partner quiz questions" });
    }
  });
  
  app.post("/api/partner-quiz/responses", async (req, res) => {
    try {
      const validatedData = insertPartnerQuizResponseSchema.parse(req.body);
      const response = await storage.createPartnerQuizResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating partner quiz response:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create partner quiz response" });
    }
  });
  
  app.get("/api/partner-quiz/responses/:questionId", async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const responses = await storage.getPartnerQuizResponses(questionId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching partner quiz responses:", error);
      res.status(500).json({ message: "Failed to fetch partner quiz responses" });
    }
  });

  // AI Wizard Routes - Admin Only
  app.post("/api/admin/ai/generate-quiz", async (req, res) => {
    try {
      const { topic, category, difficulty, questionCount, additionalInstructions, coupleId } = z.object({
        topic: z.string().min(3),
        category: z.string().min(1),
        difficulty: z.string().min(1),
        questionCount: z.number().min(3).max(15),
        additionalInstructions: z.string().optional(),
        coupleId: z.number().optional() // Optional couple ID to personalize the quiz
      }).parse(req.body);
      
      // If a coupleId is provided, fetch relevant profile data
      let coupleProfileData;
      if (coupleId) {
        try {
          // Get the couple record
          const couple = await storage.getCouple(coupleId);
          if (couple) {
            // Get both users
            const user1 = await storage.getUser(couple.userId1);
            const user2 = await storage.getUser(couple.userId2);
            
            // Get user profiles if they exist
            let user1Profile, user2Profile;
            let user1Responses = [], user2Responses = [];
            
            // Check if we have implemented profile methods
            if (typeof storage.getUserProfile === 'function') {
              if (user1) user1Profile = await storage.getUserProfile(user1.id);
              if (user2) user2Profile = await storage.getUserProfile(user2.id);
            }
            
            // Check if we have implemented response methods
            if (typeof storage.getUserResponses === 'function') {
              if (user1) user1Responses = await storage.getUserResponses(user1.id);
              if (user2) user2Responses = await storage.getUserResponses(user2.id);
            }
            
            // Build the profile data object
            coupleProfileData = {
              user1Profile: user1Profile || user1,
              user2Profile: user2Profile || user2,
              user1Responses,
              user2Responses
            };
            
            console.log("Using profile data for personalized quiz generation");
          }
        } catch (profileError) {
          console.error("Error fetching couple profile data:", profileError);
          // Continue without profile data if there's an error
        }
      }
      
      // Call the OpenAI API to generate the quiz
      const generatedQuiz = await generateQuiz(
        topic,
        category,
        difficulty,
        questionCount,
        additionalInstructions,
        coupleProfileData
      );
      
      res.json(generatedQuiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate quiz" });
    }
  });
  
  app.post("/api/admin/ai/generate-competition", async (req, res) => {
    try {
      const { name, description, startDate, endDate, difficulty, type, additionalInstructions } = z.object({
        name: z.string().min(3),
        description: z.string().min(10),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        difficulty: z.string().min(1),
        type: z.string().min(1),
        additionalInstructions: z.string().optional()
      }).parse(req.body);
      
      // Call the OpenAI API to generate the competition
      const generatedCompetition = await generateCompetition(
        name,
        description,
        startDate,
        endDate,
        difficulty,
        type,
        additionalInstructions
      );
      
      res.json(generatedCompetition);
    } catch (error) {
      console.error("Error generating competition:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate competition" });
    }
  });
  
  // Admin endpoints for all couples
  app.get("/api/admin/couples", async (_req, res) => {
    try {
      // Get all couples from database
      const allCouples = await db.select().from(couples).orderBy(couples.id);
      
      // Enhance couple data with user information
      const enhancedCouples = await Promise.all(
        allCouples.map(async (couple) => {
          // Get both users
          const user1 = await storage.getUser(couple.userId1);
          const user2 = await storage.getUser(couple.userId2);
          
          // Remove sensitive data
          let user1Data = null;
          let user2Data = null;
          
          if (user1) {
            const { password, ...safeUser1 } = user1;
            user1Data = safeUser1;
          }
          
          if (user2) {
            const { password, ...safeUser2 } = user2;
            user2Data = safeUser2;
          }
          
          // Return enhanced couple data
          return {
            id: couple.id,
            bondStrength: couple.bondStrength,
            level: couple.level,
            xp: couple.xp,
            createdAt: couple.createdAt,
            user1: user1Data,
            user2: user2Data,
            displayName: user1Data && user2Data ? 
              `${user1Data.displayName} & ${user2Data.displayName}` : 
              `Couple #${couple.id}`
          };
        })
      );
      
      res.json(enhancedCouples);
    } catch (error) {
      console.error("Error fetching all couples:", error);
      res.status(500).json({ message: "Failed to get couples data" });
    }
  });

// Admin Dashboard Data
  app.get("/api/admin/dashboard", async (_req, res) => {
    try {
      // Get all users count
      const allUsers = await db.select().from(users);
      const usersCount = allUsers.length;
      
      // Get all couples count
      const allCouples = await db.select().from(couples);
      const couplesCount = allCouples.length;
      
      // Get active subscriptions count
      const activeSubscriptions = await db.select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.status, "active"));
      const subscribersCount = activeSubscriptions.length;
      
      // Get active competitions count
      const activeCompetitions = await db.select()
        .from(competitions)
        .where(eq(competitions.status, "active"));
      const activeCompetitionsCount = activeCompetitions.length;
      
      // Get recent rewards awarded
      const recentRewards = await db.select()
        .from(coupleRewards)
        .orderBy(desc(coupleRewards.awardedAt))
        .limit(10);
      
      // Get total rewards claimed
      const claimedRewards = await db.select()
        .from(coupleRewards)
        .where(sql`${coupleRewards.status} = 'claimed' OR ${coupleRewards.status} = 'shipped' OR ${coupleRewards.status} = 'delivered'`);
      const claimedRewardsCount = claimedRewards.length;
      
      res.json({
        usersCount,
        couplesCount,
        subscribersCount,
        activeCompetitionsCount,
        recentRewards,
        claimedRewardsCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin dashboard data" });
    }
  });

  // Conversation-based Onboarding Routes
  // Initialize a new conversation session for onboarding
  app.post("/api/conversations/sessions", async (req, res) => {
    try {
      const { userId, sessionType } = z.object({
        userId: z.number(),
        sessionType: z.string()
      }).parse(req.body);
      
      // Validate the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a new conversation session
      const session = await createConversationSession({
        userId,
        sessionType,
        status: "in-progress",
        metadata: {}
      });
      
      // Add initial system message with appropriate prompt based on stage
      const stage = req.body.stage || "welcome";
      const systemPrompt = getOnboardingPrompt(stage);
      const systemMessage = await addConversationMessage({
        sessionId: session.id,
        sender: "system",
        message: systemPrompt,
        messageType: "instruction",
        contentTags: ["onboarding", "welcome"],
      });
      
      // Add a dummy user message to satisfy Gemini's requirement
      await addConversationMessage({
        sessionId: session.id,
        sender: "user",
        message: "Hi there! I'm ready to start using BondQuest.",
        messageType: "greeting",
        contentTags: ["onboarding", "welcome"],
      });
      
      // Generate initial AI greeting - using direct model approach
      let aiGreeting = "";
      
      try {
        // Use the direct model that we confirmed works
        if (process.env.GEMINI_API_KEY) {
          const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = googleAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
          
          // Format a prompt for the initial greeting
          const prompt = `
            ${systemPrompt}
            
            The user has just started using BondQuest, a relationship app that helps couples strengthen their bond.
            Introduce yourself as a friendly AI relationship assistant and welcome them to the app.
            Keep it concise, friendly, and encouraging. Ask for their name and their partner's name.
          `;
          
          const result = await model.generateContent(prompt);
          aiGreeting = result.response.text();
        } else {
          // Fallback if no API key
          aiGreeting = "Hello and welcome to BondQuest! 👋 I'm your relationship assistant, here to help you strengthen your bond with your partner. What's your name, and what's your partner's name? I'd love to get to know you both better!";
        }
      } catch (error) {
        console.error("Error generating AI greeting:", error);
        // Use the original generation method as fallback
        aiGreeting = await generateGeminiResponse(session.id, "Hello", systemPrompt);
      }
      
      // Save AI greeting as a message
      const aiMessage = await addConversationMessage({
        sessionId: session.id,
        sender: "ai",
        message: aiGreeting,
        messageType: "greeting",
        contentTags: ["onboarding", "welcome"],
      });
      
      res.status(201).json({
        session,
        messages: [systemMessage, aiMessage]
      });
    } catch (error) {
      console.error("Error creating conversation session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ 
        message: "Failed to create conversation session",
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      });
    }
  });
  
  // Add a message to an existing conversation session
  app.post("/api/conversations/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { message, contentTags } = z.object({
        message: z.string(),
        contentTags: z.array(z.string()).optional()
      }).parse(req.body);
      
      // Add user message
      const userMessage = await addConversationMessage({
        sessionId,
        sender: "user",
        message,
        messageType: "response",
        contentTags: contentTags || [],
      });
      
      // Get conversation details to provide context
      const sessions = await db
        .select()
        .from(conversationSessions)
        .where(eq(conversationSessions.id, sessionId));
      
      const session = sessions.length > 0 ? sessions[0] : null;
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Get previous messages for context
      const previousMessages = await getConversationMessages(sessionId);
      
      // Create a rich context for the AI
      let systemContext = req.body.systemContext; // Optional context passed in
      
      // If no context was provided, create one based on session type
      if (!systemContext && session.sessionType === "onboarding") {
        systemContext = getOnboardingPrompt("welcome");
      }
      
      // Use direct model interaction for better reliability
      let aiResponseText = "";
      
      try {
        // Use the direct model that we confirmed works
        if (process.env.GEMINI_API_KEY) {
          const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = googleAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
          
          // Format messages for context
          const prompt = `
            ${systemContext || "You are a helpful relationship assistant in the BondQuest app."}
            
            Previous conversation:
            ${previousMessages.map(msg => `${msg.sender}: ${msg.message}`).join('\n')}
            
            User: ${message}
            
            Respond in a friendly, supportive tone. Keep your response concise and focused on helping the couple strengthen their relationship.
          `;
          
          const result = await model.generateContent(prompt);
          aiResponseText = result.response.text();
        } else {
          // Fallback if no API key
          aiResponseText = "I'm here to help you build a stronger relationship. What would you like to know about BondQuest?";
        }
      } catch (error) {
        console.error("Error generating AI response:", error);
        // Use the original generation method as fallback
        aiResponseText = await generateGeminiResponse(sessionId, message, systemContext);
      }
      
      // Save AI response as a message
      const aiMessage = await addConversationMessage({
        sessionId,
        sender: "ai",
        message: aiResponseText,
        messageType: "response",
        contentTags: contentTags || [],
      });
      
      res.json({
        userMessage,
        aiMessage
      });
    } catch (error) {
      console.error("Error handling conversation message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ 
        message: "Failed to process conversation message",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  
  // Get all messages for a conversation session
  app.get("/api/conversations/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messages = await getConversationMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting conversation messages:", error);
      res.status(500).json({ 
        message: "Failed to retrieve conversation messages",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  
  // Extract profile insights from a conversation
  app.post("/api/conversations/:sessionId/extract-insights", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { userId } = z.object({
        userId: z.number()
      }).parse(req.body);
      
      // Validate user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Extract insights from the conversation
      const insights = await extractProfileInsightsFromConversation(sessionId, userId);
      
      res.json(insights);
    } catch (error) {
      console.error("Error extracting profile insights:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ 
        message: "Failed to extract profile insights",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  
  // Simple testing endpoint for direct Gemini interactions
  app.post("/api/test/gemini-response", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt in request body" });
      }
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY not configured",
          fallback: "This is a fallback response as the Gemini API is not properly configured."
        });
      }
      
      try {
        const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = googleAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        return res.json({
          status: "success",
          response: responseText
        });
      } catch (apiError) {
        console.error("Error calling Gemini API:", apiError);
        return res.status(500).json({
          error: "Error generating content with Gemini API",
          message: apiError instanceof Error ? apiError.message : "Unknown error",
          fallback: "This is a fallback response when the API fails."
        });
      }
    } catch (error) {
      console.error("Error in test endpoint:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Test endpoint for profile insights extraction
  app.post("/api/test/profile-insights", async (req, res) => {
    try {
      const { userId, messages } = req.body;
      
      if (!userId || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing userId or messages in request body. Messages must be an array." });
      }
      
      // Create a temporary conversation session for testing
      const [session] = await db
        .insert(conversationSessions)
        .values({
          userId,
          sessionType: 'test-insights',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Add the messages to the conversation
      for (const message of messages) {
        await db
          .insert(conversationMessages)
          .values({
            sessionId: session.id,
            sender: message.sender || 'user',
            message: message.content,
            messageType: 'text',
            timestamp: new Date()
          });
      }
      
      // Extract insights
      const insights = await extractProfileInsightsFromConversation(session.id, userId);
      
      return res.status(200).json({
        status: "success",
        sessionId: session.id,
        insights
      });
    } catch (error) {
      console.error("Error in profile insights test endpoint:", error);
      
      return res.status(500).json({
        status: "error",
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Diagnostic endpoint to check Gemini API status
  app.get("/api/gemini/status", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          status: "error",
          message: "GEMINI_API_KEY environment variable is not set",
          availableModels: []
        });
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      
      try {
        // Test using direct fetch with API key as query parameter (alternative authentication method)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        const data = await response.json();
        
        // Test a simple content generation
        try {
          const googleAI = new GoogleGenerativeAI(apiKey);
          const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
          
          const result = await model.generateContent("Hello, what are your capabilities?");
          const responseText = result.response.text();
          
          return res.json({
            status: "success", 
            apiKey: "present (masked)",
            apiKeyLength: apiKey.length,
            apiKeyFirstChars: apiKey.substring(0, 4) + "...",
            modelListResponse: data,
            testGeneration: {
              success: true,
              response: responseText
            }
          });
        } catch (generateError) {
          return res.json({
            status: "partial",
            apiKey: "present (masked)",
            modelListResponse: data,
            testGeneration: {
              success: false,
              error: generateError instanceof Error ? generateError.message : "Unknown error"
            }
          });
        }
      } catch (error) {
        return res.json({
          status: "error",
          message: "Failed to list models",
          apiKeyLength: apiKey.length,
          apiKeyFirstChars: apiKey.substring(0, 4) + "...",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Complete a conversation session
  app.patch("/api/conversations/:sessionId/complete", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      // Get the conversation session
      const sessions = await db
        .select()
        .from(conversationSessions)
        .where(eq(conversationSessions.id, sessionId));
        
      const session = sessions.length > 0 ? sessions[0] : null;
      
      if (!session) {
        return res.status(404).json({ message: "Conversation session not found" });
      }
      
      // Update session status to completed
      const updatedSessions = await db
        .update(conversationSessions)
        .set({ 
          status: "completed",
          completedAt: new Date()
        })
        .where(eq(conversationSessions.id, sessionId))
        .returning();
        
      const updatedSession = updatedSessions.length > 0 ? updatedSessions[0] : null;
      
      // Extract insights automatically when completing
      if (req.body.extractInsights) {
        try {
          const insights = await extractProfileInsightsFromConversation(sessionId, session.userId);
          return res.json({ 
            session: updatedSession,
            insights
          });
        } catch (insightError) {
          console.error("Error extracting insights during completion:", insightError);
          return res.json({ 
            session: updatedSession,
            error: "Failed to extract insights"
          });
        }
      }
      
      res.json({ session: updatedSession });
    } catch (error) {
      console.error("Error completing conversation session:", error);
      res.status(500).json({ 
        message: "Failed to complete conversation session",
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      });
    }
  });
  
  // Middleware to initialize Gemini API if key is provided via headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-gemini-api-key'];
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      try {
        initializeGeminiAPI(apiKey);
        // No need to store in request
      } catch (error) {
        console.error('Failed to initialize Gemini API with provided key:', error);
      }
    }
    next();
  });

  // Mount bond-related routes
  app.use('/api/bond', bondRoutes);

  const httpServer = createServer(app);
  
  return httpServer;
}


