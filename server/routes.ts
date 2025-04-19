import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import passport from "passport";
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
import stripeRoutes from './routes/stripeRoutes';
import quizRoutes from './routes/quizRoutes';
import adminRoutes from './routes/adminRoutes';

// Import auth configuration 
import { configureAuth, createAuthRouter, registerUser } from './auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure passport
  const passportInstance = configureAuth(storage);
  app.use(passport.initialize());
  app.use(passport.session());

  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // Register API routes
  app.use('/api/bond', bondRoutes);
  app.use('/api/conversation', conversationRoutes);
  app.use('/api/stripe', stripeRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/admin', adminRoutes);
  
  // Register auth routes
  app.use('/auth', createAuthRouter());

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
      
      // Use registerUser to hash the password
      const user = await registerUser(validatedData, storage);
      
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
      
      // Login after successful registration
      req.login(user, (err) => {
        if (err) {
          console.error("Error logging in after registration:", err);
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string()
      }).parse(req.body);
      
      // Use Passport's local strategy for authentication
      passport.authenticate('local', async (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        // Log in the user with Passport
        req.login(user, async (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          try {
            // Return the user data without sensitive information
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            
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
          } catch (dataFetchError) {
            console.error("Error fetching user data after login:", dataFetchError);
            return res.status(500).json({ message: "Error fetching user data after login" });
          }
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to process login" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
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

  const httpServer = createServer(app);
  
  return httpServer;
}