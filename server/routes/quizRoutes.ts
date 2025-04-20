import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { eq, asc, desc } from 'drizzle-orm';
import { bondDimensions } from '@shared/bondDimensions';
import { 
  insertQuizSchema, 
  insertQuestionSchema, 
  insertQuizSessionSchema,
  quizzes,
  questions,
  quizSessions,
  users,
  couples
} from '@shared/schema';
import { generateQuiz } from '../openai';

const router = express.Router();

// Import password utils for hashing - using ES modules syntax
import { hashPassword } from '../auth/passwordUtils';
import { sql } from 'drizzle-orm';

// Authentication middleware with test user fallback
async function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }

  // For development and testing purposes
  if (process.env.NODE_ENV === 'development') {
    try {
      // Check if we already have a test user
      let [testUser] = await db.select()
        .from(users)
        .where(eq(users.username, 'testuser'));
      
      if (!testUser) {
        // Create a test user if it doesn't exist
        console.log('Creating test user for development...');
        
        // Hash password using imported function
        const hashedPassword = await hashPassword('password123');
        
        // Insert test user - ensure field names match schema
        [testUser] = await db.insert(users)
          .values({
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword,
            displayName: 'Test User',
            partnerCode: 'TEST123',
            profilePicture: null,
            role: 'user'
          })
          .returning();
          
        console.log('Test user created with ID:', testUser.id);
      }
      
      // Check if test user is in a couple
      // Use SQL instead of separate where clauses
      let [testCouple] = await db.select()
        .from(couples)
        .where(
          sql`(${couples.userId1} = ${testUser.id} OR ${couples.userId2} = ${testUser.id})`
        );
      
      if (!testCouple) {
        // Create a test partner
        let [partner] = await db.select()
          .from(users)
          .where(eq(users.username, 'partner'));
        
        if (!partner) {
          // Hash password using imported function
          const hashedPassword = await hashPassword('password123');
          
          // Insert test partner - ensure field names match schema
          [partner] = await db.insert(users)
            .values({
              username: 'partner',
              email: 'partner@example.com',
              password: hashedPassword,
              displayName: 'Partner User',
              partnerCode: 'PARTNER123',
              profilePicture: null,
              role: 'user'
            })
            .returning();
            
          console.log('Test partner created with ID:', partner.id);
        }
        
        // Create test couple
        [testCouple] = await db.insert(couples)
          .values({
            userId1: testUser.id,
            userId2: partner.id,
            bondStrength: 75,
            level: 2,
            xp: 150
          })
          .returning();
          
        console.log('Test couple created with ID:', testCouple.id);
      }
      
      // Manually set the user for this request
      req.user = testUser;
      return next();
    } catch (error) {
      console.error('Error creating test user:', error);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
  
  // In production, just return unauthorized
  res.status(401).json({ message: 'Unauthorized' });
}

// Get all quizzes
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Use direct database query instead of storage
    const quizList = await db.select()
      .from(quizzes)
      .orderBy(desc(quizzes.id));
    
    res.json(quizList);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Get a specific quiz by ID with its questions
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    if (isNaN(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const quiz = await storage.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questions = await storage.getQuestions(quizId);
    
    res.json({
      quiz,
      questions
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

// Create a new quiz with questions
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const validatedQuiz = insertQuizSchema.parse(req.body.quiz);
    const quiz = await storage.createQuiz(validatedQuiz);

    // Handle questions if provided
    if (req.body.questions && Array.isArray(req.body.questions)) {
      for (const questionData of req.body.questions) {
        const validatedQuestion = insertQuestionSchema.parse({
          ...questionData,
          quizId: quiz.id
        });
        await storage.createQuestion(validatedQuestion);
      }
    }

    // Get the created quiz with questions
    const questions = await storage.getQuestions(quiz.id);
    
    res.status(201).json({
      quiz,
      questions
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid quiz data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create quiz' });
    }
  }
});

// Get quizzes by category
router.get('/category/:category', isAuthenticated, async (req, res) => {
  try {
    const category = req.params.category;
    
    // Use direct database query instead of storage
    const quizList = await db.select()
      .from(quizzes)
      .where(eq(quizzes.category, category))
      .orderBy(desc(quizzes.id));
    
    res.json(quizList);
  } catch (error) {
    console.error('Error fetching quizzes by category:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Generate a quiz using AI based on bond dimensions
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const { topic, category, difficulty = 'medium', dimensionId, questionCount = 5 } = req.body;
    
    if (!topic || !category) {
      return res.status(400).json({ message: 'Topic and category are required' });
    }
    
    // Get couple information if the user is part of a couple
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = req.user as any; // Type casting to avoid TypeScript errors
    const couple = await storage.getCoupleByUserId(user.id);
    
    // Get dimension data if specified
    let additionalInstructions = '';
    if (dimensionId) {
      const dimension = bondDimensions.find(d => d.id === dimensionId);
      if (dimension) {
        additionalInstructions = `This quiz focuses on the "${dimension.name}" dimension of relationships: ${dimension.description}. Create questions that specifically explore this aspect of relationships.`;
      }
    }
    
    // Generate the quiz using AI
    const quizData = await generateQuiz(
      topic,
      category,
      difficulty,
      questionCount,
      additionalInstructions,
      couple ? { 
        user1Profile: await storage.getUser(couple.userId1),
        user2Profile: await storage.getUser(couple.userId2)
      } : undefined
    );
    
    // Create quiz in the database
    const quizResult = await storage.createQuiz({
      title: quizData.title,
      description: quizData.description,
      type: quizData.type || 'multiplayer',
      category: quizData.category || category,
      duration: quizData.duration || 10,
      points: quizData.points || 100,
      image: null
    });
    
    // Create questions for the quiz
    const questions = [];
    for (const questionData of quizData.questions) {
      const question = await storage.createQuestion({
        quizId: quizResult.id,
        text: questionData.text,
        options: questionData.options
      });
      questions.push(question);
    }
    
    res.status(201).json({
      quiz: quizResult,
      questions
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
});

// Routes for quiz sessions
router.post('/sessions', isAuthenticated, async (req, res) => {
  try {
    const validatedSession = insertQuizSessionSchema.parse(req.body);
    const session = await storage.createQuizSession(validatedSession);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating quiz session:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid session data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create quiz session' });
    }
  }
});

// Update a quiz session
router.patch('/sessions/:id', isAuthenticated, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }
    
    const session = await storage.updateQuizSession(sessionId, req.body);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error updating quiz session:', error);
    res.status(500).json({ message: 'Failed to update quiz session' });
  }
});

// Get quiz sessions for a couple
router.get('/sessions/couple/:coupleId', isAuthenticated, async (req, res) => {
  try {
    const coupleId = parseInt(req.params.coupleId);
    if (isNaN(coupleId)) {
      return res.status(400).json({ message: 'Invalid couple ID' });
    }
    
    const sessions = await storage.getQuizSessionsByCouple(coupleId);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching quiz sessions:', error);
    res.status(500).json({ message: 'Failed to fetch quiz sessions' });
  }
});

export default router;