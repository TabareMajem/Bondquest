import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { nanoid } from "nanoid";
import { insertUserSchema, insertCoupleSchema, insertQuizSessionSchema, insertDailyCheckInSchema, insertChatSchema } from "@shared/schema";

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
          
          // Create activity record
          await storage.createActivity({
            coupleId: couple.id,
            type: "quiz",
            referenceId: sessionId,
            points: updates.pointsEarned
          });
          
          // Update bond strength if match percentage is provided
          if (updates.matchPercentage) {
            // Calculate new bond strength (weighted average)
            const newBondStrength = Math.round(
              (couple.bondStrength * 0.7) + (updates.matchPercentage * 0.3)
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
          points: 5 // Fixed points for check-in
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

// Simple mock AI response generator
async function generateAIResponse(userMessage: string, assistantType: string): Promise<string> {
  // In a real application, this would call the OpenAI API
  
  const responses: Record<string, string[]> = {
    "casanova": [
      "I've got just the thing! How about a '15-Minute Connection Challenge'? Take 15 minutes tonight to share the highlight and lowlight of your day, with no phones or distractions. It's small but powerful!",
      "Have you considered planning a surprise date night? Even something simple at home can reignite that spark! Maybe recreate your first date?",
      "Communication is the heartbeat of love! Try this game: take turns completing the sentence 'I feel loved when you...' - it's amazing what you'll discover!",
      "The data shows you both love outdoor activities. How about a weekend hiking trip with no technology? Nature has a way of bringing people closer."
    ],
    "venus": [
      "I notice you've been feeling a bit disconnected lately. Consider setting aside 10 minutes each day for mindful conversation - no phones, no TV, just presence with each other.",
      "Relationships thrive on appreciation. Try sharing one thing you appreciate about your partner each day for the next week and watch how it transforms your connection.",
      "Sometimes the smallest gestures have the biggest impact. What's one tiny thing you could do today to make your partner feel seen and valued?",
      "According to your quiz results, you both value quality time differently. Have you discussed what meaningful time together looks like for each of you?"
    ],
    "aurora": [
      "Based on your relationship data, I recommend focusing on improving your communication patterns. The quiz results show a 35% mismatch in how you express appreciation.",
      "Looking at your activity history, you've completed 8 quizzes but only 2 in the 'communication' category. Consider balancing your relationship growth areas.",
      "Statistical analysis of successful couples shows that a daily 6-second kiss significantly improves relationship satisfaction. Have you incorporated this habit?",
      "Your relationship strength metrics have improved 12% this month. The most influential factor was completing the 'Love Languages' quiz together."
    ]
  };

  // Select a random response based on assistant type
  const availableResponses = responses[assistantType] || responses["casanova"];
  return availableResponses[Math.floor(Math.random() * availableResponses.length)];
}
