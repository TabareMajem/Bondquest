import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertBondQuestionSchema, insertBondAssessmentSchema, insertBondInsightSchema } from '@shared/schema';
import { bondDimensions } from '@shared/bondDimensions';
import { generateGeminiResponse } from '../gemini';

const router = express.Router();

// Bond Questions Routes
router.get('/questions', async (req, res) => {
  try {
    const questions = await storage.getBondQuestions();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching bond questions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bond questions',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

router.get('/questions/dimension/:dimensionId', async (req, res) => {
  try {
    const { dimensionId } = req.params;
    
    // Validate that dimensionId is valid
    if (!bondDimensions.some(dim => dim.id === dimensionId)) {
      return res.status(400).json({ message: 'Invalid dimension ID' });
    }
    
    const questions = await storage.getBondQuestionsByDimension(dimensionId);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bond questions by dimension' });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const validatedData = insertBondQuestionSchema.parse(req.body);
    
    // Validate dimension exists
    if (!bondDimensions.some(dim => dim.id === validatedData.dimensionId)) {
      return res.status(400).json({ message: 'Invalid dimension ID' });
    }
    
    const question = await storage.createBondQuestion(validatedData);
    res.status(201).json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Failed to create bond question' });
  }
});

// Bond Assessment Routes
router.get('/assessments/couple/:coupleId', async (req, res) => {
  try {
    const coupleId = parseInt(req.params.coupleId);
    const assessments = await storage.getBondAssessmentsByCouple(coupleId);
    
    if (!assessments.length) {
      return res.json([]);
    }
    
    // Calculate dimensions statistics
    const dimensionStats = BOND_DIMENSIONS.map(dimension => {
      const dimensionAssessments = assessments.filter(
        assessment => assessment.dimensionId === dimension.id
      );
      
      if (dimensionAssessments.length === 0) {
        return {
          dimensionId: dimension.id,
          name: dimension.name,
          description: dimension.description,
          assessed: false,
          score: null
        };
      }
      
      // Get most recent assessment for this dimension
      const mostRecent = dimensionAssessments.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      return {
        dimensionId: dimension.id,
        name: dimension.name,
        description: dimension.description,
        assessed: true,
        score: mostRecent.score,
        lastAssessedAt: mostRecent.createdAt
      };
    });
    
    res.json({
      assessments,
      dimensionStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bond assessments' });
  }
});

router.post('/assessments', async (req, res) => {
  try {
    const validatedData = insertBondAssessmentSchema.parse(req.body);
    
    // Validate dimension exists
    if (!BOND_DIMENSIONS.some(dim => dim.id === validatedData.dimensionId)) {
      return res.status(400).json({ message: 'Invalid dimension ID' });
    }
    
    // Create assessment
    const assessment = await storage.createBondAssessment(validatedData);
    
    // Get couple
    const couple = await storage.getCouple(validatedData.coupleId);
    if (!couple) {
      return res.status(404).json({ message: 'Couple not found' });
    }
    
    // Create activity for assessment completion
    await storage.createActivity({
      coupleId: validatedData.coupleId,
      type: 'bond_assessment',
      referenceId: assessment.id,
      points: 10,
      description: `Completed ${BOND_DIMENSIONS.find(dim => dim.id === validatedData.dimensionId)?.name} assessment`
    });
    
    // Update couple XP
    await storage.updateCoupleXP(couple.id, 10);
    
    res.status(201).json(assessment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Failed to create bond assessment' });
  }
});

// Bond Insights Routes
router.get('/insights/couple/:coupleId', async (req, res) => {
  try {
    const coupleId = parseInt(req.params.coupleId);
    const insights = await storage.getBondInsightsByCouple(coupleId);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bond insights' });
  }
});

router.post('/insights', async (req, res) => {
  try {
    const validatedData = insertBondInsightSchema.parse(req.body);
    
    // Validate dimension exists
    if (!BOND_DIMENSIONS.some(dim => dim.id === validatedData.dimensionId)) {
      return res.status(400).json({ message: 'Invalid dimension ID' });
    }
    
    // Create expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const insight = await storage.createBondInsight({
      ...validatedData,
      expiresAt,
      viewed: false,
      completed: false
    });
    
    res.status(201).json(insight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Failed to create bond insight' });
  }
});

router.patch('/insights/:id/viewed', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { viewed } = z.object({ viewed: z.boolean() }).parse(req.body);
    
    const insight = await storage.updateBondInsightViewed(id, viewed);
    
    if (!insight) {
      return res.status(404).json({ message: 'Bond insight not found' });
    }
    
    res.json(insight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Failed to update bond insight viewed status' });
  }
});

router.patch('/insights/:id/completed', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { completed } = z.object({ completed: z.boolean() }).parse(req.body);
    
    const insight = await storage.updateBondInsightCompleted(id, completed);
    
    if (!insight) {
      return res.status(404).json({ message: 'Bond insight not found' });
    }
    
    // If insight is being marked as completed, add XP and activity
    if (completed && !insight.completed) {
      // Get the insight details
      const fullInsight = await storage.getBondInsight(id);
      if (fullInsight) {
        // Get couple
        const couple = await storage.getCouple(fullInsight.coupleId);
        if (couple) {
          // Create activity
          await storage.createActivity({
            coupleId: couple.id,
            type: 'bond_insight',
            referenceId: id,
            points: 15,
            description: `Completed a relationship insight: ${fullInsight.title}`
          });
          
          // Update couple XP
          await storage.updateCoupleXP(couple.id, 15);
        }
      }
    }
    
    res.json(insight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ message: 'Failed to update bond insight completed status' });
  }
});

// AI-powered Bond Assessment Generation
router.post('/ai-generate-assessment', async (req, res) => {
  try {
    const { coupleId, dimensionId, sessionId } = z.object({
      coupleId: z.number(),
      dimensionId: z.string(),
      sessionId: z.number().optional()
    }).parse(req.body);
    
    // Validate dimension exists
    const dimension = BOND_DIMENSIONS.find(dim => dim.id === dimensionId);
    if (!dimension) {
      return res.status(400).json({ message: 'Invalid dimension ID' });
    }
    
    // Get couple information for context
    const couple = await storage.getCouple(coupleId);
    if (!couple) {
      return res.status(404).json({ message: 'Couple not found' });
    }
    
    // Get user information
    const user1 = await storage.getUser(couple.userId1);
    const user2 = await storage.getUser(couple.userId2);
    
    if (!user1 || !user2) {
      return res.status(404).json({ message: 'User information not found' });
    }
    
    // Get existing bond assessments for context
    const existingAssessments = await storage.getBondAssessmentsByCouple(coupleId);
    
    // Get existing chat history if sessionId is provided
    let chatContext = '';
    if (sessionId) {
      const chats = await storage.getChatsByCouple(coupleId);
      if (chats.length > 0) {
        chatContext = 'Recent conversation history:\n' + 
          chats.slice(-5).map(chat => `${chat.sender}: ${chat.message}`).join('\n');
      }
    }
    
    // Create system prompt for AI
    const systemPrompt = `You are Aurora, a data-driven relationship scientist and AI assistant specialized in relationship assessments.
    
You are creating personalized bond assessment questions for the dimension: "${dimension.name}" (${dimension.description}).

The couple consists of ${user1.displayName} and ${user2.displayName}.
${chatContext ? chatContext : ''}
${existingAssessments.length > 0 ? 'They have completed some bond assessments before.' : 'This is their first bond assessment.'}

Create 5 personalized questions to assess their relationship in this dimension. Include:
- 3 Likert scale questions (1-10 rating)
- 1 multiple choice question with 5 options
- 1 open-ended text question

Format your response as a JSON array with this structure:
[
  {
    "text": "Question text here?",
    "type": "likert",
    "weight": 2  // importance weight 1-2, with 2 being more important
  },
  {
    "text": "Multiple choice question here?",
    "type": "multiple_choice",
    "weight": 1,
    "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"]
  },
  {
    "text": "Open ended question here?",
    "type": "text",
    "weight": 0  // text questions don't contribute to score
  }
]

Make questions engaging, insightful, and tailored to their specific relationship dynamic. Avoid generic questions.`;

    try {
      // Generate assessment questions with AI
      let responseText = '';
      if (sessionId) {
        responseText = await generateGeminiResponse(sessionId, 'Generate personalized bond assessment questions', systemPrompt);
      } else {
        // Use direct generation (no conversation history/session)
        responseText = await generateGeminiResponse(0, 'Generate personalized bond assessment questions', systemPrompt);
      }
      
      // Parse JSON response
      // Clean the response to ensure valid JSON
      const jsonRegex = /\[[\s\S]*\]/;
      const match = responseText.match(jsonRegex);
      
      if (!match) {
        return res.status(500).json({ 
          message: 'Failed to parse AI response',
          error: 'Invalid JSON format'
        });
      }
      
      const cleanedJSON = match[0].replace(/```json|```/g, '').trim();
      const questions = JSON.parse(cleanedJSON);
      
      // Validate questions array
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(500).json({ 
          message: 'Invalid AI response format', 
          error: 'Response did not contain a valid questions array'
        });
      }
      
      // Process each question with the Bond Question schema
      const processedQuestions = [];
      
      for (const q of questions) {
        // Validate question has required fields
        if (!q.text || !q.type) continue;
        
        // Create bond question
        const questionData = {
          dimensionId,
          text: q.text,
          type: q.type,
          weight: q.weight || 1,
          options: q.options || null
        };
        
        const newQuestion = await storage.createBondQuestion(questionData);
        processedQuestions.push(newQuestion);
      }
      
      res.status(201).json({
        message: 'Successfully created AI-generated bond assessment questions',
        dimension,
        questions: processedQuestions
      });
      
    } catch (aiError) {
      console.error('Error generating AI bond assessment:', aiError);
      res.status(500).json({ 
        message: 'Failed to generate AI bond assessment', 
        error: aiError instanceof Error ? aiError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Error in AI bond assessment generation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    res.status(500).json({ 
      message: 'Failed to process AI bond assessment generation',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;