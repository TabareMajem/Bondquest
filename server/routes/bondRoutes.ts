import express from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertBondQuestionSchema, insertBondAssessmentSchema, insertBondInsightSchema } from '@shared/schema';
import { BOND_DIMENSIONS } from '@shared/bondDimensions';

const router = express.Router();

// Bond Questions Routes
router.get('/questions', async (req, res) => {
  try {
    const questions = await storage.getBondQuestions();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bond questions' });
  }
});

router.get('/questions/dimension/:dimensionId', async (req, res) => {
  try {
    const { dimensionId } = req.params;
    
    // Validate that dimensionId is valid
    if (!BOND_DIMENSIONS.some(dim => dim.id === dimensionId)) {
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
    if (!BOND_DIMENSIONS.some(dim => dim.id === validatedData.dimensionId)) {
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

export default router;