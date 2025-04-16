import { Router } from 'express';
import { storage } from '../storage';
import { bondDimensions, calculateBondStrength, generateInsightForDimension } from '@shared/bondDimensions';
import { insertBondAssessmentSchema, insertBondInsightSchema, insertBondQuestionSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get all bond dimensions
router.get('/dimensions', async (req, res) => {
  try {
    res.json(bondDimensions);
  } catch (error) {
    console.error('Error fetching bond dimensions:', error);
    res.status(500).json({ error: 'Failed to fetch bond dimensions' });
  }
});

// Get bond questions for a specific dimension
router.get('/questions/:dimensionId?', async (req, res) => {
  try {
    const { dimensionId } = req.params;
    const questions = await storage.getBondQuestions();
    
    if (dimensionId) {
      // Filter questions for the specified dimension
      const filteredQuestions = questions.filter(q => q.dimensionId === dimensionId);
      return res.json(filteredQuestions);
    }
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching bond questions:', error);
    res.status(500).json({ error: 'Failed to fetch bond questions' });
  }
});

// Create a new bond question
router.post('/questions', async (req, res) => {
  try {
    const questionData = insertBondQuestionSchema.parse(req.body);
    const newQuestion = await storage.createBondQuestion(questionData);
    res.status(201).json(newQuestion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating bond question:', error);
    res.status(500).json({ error: 'Failed to create bond question' });
  }
});

// Get assessments for the current couple
router.get('/assessments', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.user.id;
    const couple = await storage.getCoupleByUserId(userId);
    
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }
    
    const assessments = await storage.getBondAssessmentsByCouple(couple.id);
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching bond assessments:', error);
    res.status(500).json({ error: 'Failed to fetch bond assessments' });
  }
});

// Create a new assessment
router.post('/assessments', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const assessmentData = insertBondAssessmentSchema.parse(req.body);
    const newAssessment = await storage.createBondAssessment(assessmentData);
    
    // Calculate new bond strength
    const couple = await storage.getCouple(assessmentData.coupleId);
    if (couple) {
      const assessments = await storage.getBondAssessmentsByCouple(couple.id);
      
      // Get latest score for each dimension
      const dimensionScores: Record<string, number> = {};
      assessments.forEach(assessment => {
        // Only override if this assessment is newer
        if (!dimensionScores[assessment.dimensionId] || 
            new Date(assessment.answeredAt) > new Date(dimensionScores[assessment.dimensionId + '_date'])) {
          dimensionScores[assessment.dimensionId] = assessment.score;
          dimensionScores[assessment.dimensionId + '_date'] = assessment.answeredAt.toString();
        }
      });
      
      // Clean up date tracking properties
      Object.keys(dimensionScores).forEach(key => {
        if (key.endsWith('_date')) {
          delete dimensionScores[key];
        }
      });
      
      // Calculate new bond strength
      const bondStrength = calculateBondStrength(dimensionScores);
      
      // Update couple's bond strength
      await storage.updateCoupleBondStrength(couple.id, bondStrength);
      
      // Generate insight if this dimension's score is low
      const dimension = bondDimensions.find(d => d.id === assessmentData.dimensionId);
      if (dimension && assessmentData.score <= 6) {
        // Create insight
        const insight = {
          coupleId: assessmentData.coupleId,
          dimensionId: assessmentData.dimensionId,
          title: `Enhance Your ${dimension.name}`,
          content: generateInsightForDimension(assessmentData.dimensionId, assessmentData.score),
          actionItems: [
            `Schedule 15 minutes each day to practice active listening`,
            `Try the "${dimension.name} Exercise" in the Activities section`,
            `Discuss one specific way to improve in this area`
          ],
          targetScoreRange: [assessmentData.score, 10] as [number, number],
          difficulty: assessmentData.score <= 3 ? 'challenging' : 
                      assessmentData.score <= 5 ? 'medium' : 'easy',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };
        
        await storage.createBondInsight(insight);
      }
    }
    
    res.status(201).json(newAssessment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating bond assessment:', error);
    res.status(500).json({ error: 'Failed to create bond assessment' });
  }
});

// Get insights for the current couple
router.get('/insights', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.user.id;
    const couple = await storage.getCoupleByUserId(userId);
    
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }
    
    const insights = await storage.getBondInsightsByCouple(couple.id);
    
    // Sort by created date, newest first
    insights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching bond insights:', error);
    res.status(500).json({ error: 'Failed to fetch bond insights' });
  }
});

// Create a new insight
router.post('/insights', async (req, res) => {
  try {
    if (!req.session.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const insightData = insertBondInsightSchema.parse(req.body);
    const newInsight = await storage.createBondInsight(insightData);
    res.status(201).json(newInsight);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating bond insight:', error);
    res.status(500).json({ error: 'Failed to create bond insight' });
  }
});

// Mark an insight as viewed
router.patch('/insights/:id/viewed', async (req, res) => {
  try {
    const { id } = req.params;
    const insight = await storage.getBondInsight(parseInt(id));
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    // Check if user belongs to the couple
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.user.id;
    const couple = await storage.getCoupleByUserId(userId);
    
    if (!couple || couple.id !== insight.coupleId) {
      return res.status(403).json({ error: 'Not authorized to access this insight' });
    }
    
    const updatedInsight = await storage.updateBondInsightViewed(insight.id, true);
    res.json(updatedInsight);
  } catch (error) {
    console.error('Error updating bond insight:', error);
    res.status(500).json({ error: 'Failed to update bond insight' });
  }
});

// Mark an insight as completed
router.patch('/insights/:id/completed', async (req, res) => {
  try {
    const { id } = req.params;
    const insight = await storage.getBondInsight(parseInt(id));
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    // Check if user belongs to the couple
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.session.user.id;
    const couple = await storage.getCoupleByUserId(userId);
    
    if (!couple || couple.id !== insight.coupleId) {
      return res.status(403).json({ error: 'Not authorized to access this insight' });
    }
    
    const updatedInsight = await storage.updateBondInsightCompleted(insight.id, true);
    
    // Award XP for completing an insight
    await storage.updateCoupleXP(couple.id, couple.xp + 50);
    
    // Create activity for completing the insight
    await storage.createActivity({
      type: 'bond_insight',
      coupleId: couple.id,
      referenceId: insight.id,
      points: 50,
      description: `Completed a bond insight for improving ${insight.dimensionId}`
    });
    
    res.json(updatedInsight);
  } catch (error) {
    console.error('Error completing bond insight:', error);
    res.status(500).json({ error: 'Failed to complete bond insight' });
  }
});

export default router;