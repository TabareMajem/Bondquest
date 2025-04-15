import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { nanoid } from "nanoid";
import { insertUserSchema, insertCoupleSchema, insertQuizSchema, insertQuizSessionSchema, insertQuestionSchema, insertDailyCheckInSchema, insertChatSchema } from "@shared/schema";
import { generateAIResponse, generateRelationshipInsights } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

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
      
      res.json({ user: userWithoutPassword, couple });
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

  app.get("/api/couples/:coupleId/quiz-sessions", async (req, res) => {
    try {
      const coupleId = parseInt(req.params.coupleId);
      const sessions = await storage.getQuizSessionsByCouple(coupleId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quiz sessions" });
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

  const httpServer = createServer(app);
  
  return httpServer;
}


