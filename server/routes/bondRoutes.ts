import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { BOND_DIMENSIONS, calculateBondStrength } from '../../shared/bondDimensions';
import { insertBondAssessmentSchema, insertBondInsightSchema, insertBondQuestionSchema } from '../../shared/schema';

const router = express.Router();

// Get all bond dimensions
router.get('/dimensions', (req, res) => {
  res.json(BOND_DIMENSIONS);
});

// Get all bond questions
router.get('/bond-questions', async (req, res) => {
  try {
    const questions = await storage.getBondQuestions();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching bond questions:', error);
    res.status(500).json({ error: 'Failed to fetch bond questions' });
  }
});

// Get bond questions by dimension
router.get('/bond-questions/:dimensionId', async (req, res) => {
  try {
    const { dimensionId } = req.params;
    const questions = await storage.getBondQuestionsByDimension(dimensionId);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching bond questions by dimension:', error);
    res.status(500).json({ error: 'Failed to fetch bond questions' });
  }
});

// Create bond question
router.post('/bond-questions', async (req, res) => {
  try {
    const data = insertBondQuestionSchema.parse(req.body);
    const question = await storage.createBondQuestion(data);
    res.status(201).json(question);
  } catch (error) {
    console.error('Error creating bond question:', error);
    res.status(400).json({ error: 'Failed to create bond question' });
  }
});

// Get all bond assessments for a couple
router.get('/couples/:coupleId/bond-assessments', async (req, res) => {
  try {
    const coupleId = parseInt(req.params.coupleId);
    if (isNaN(coupleId)) {
      return res.status(400).json({ error: 'Invalid couple ID' });
    }

    const assessments = await storage.getBondAssessmentsByCouple(coupleId);
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching couple bond assessments:', error);
    res.status(500).json({ error: 'Failed to fetch bond assessments' });
  }
});

// Submit bond assessment for a dimension
router.post('/couples/:coupleId/bond-assessments', async (req, res) => {
  try {
    const coupleId = parseInt(req.params.coupleId);
    if (isNaN(coupleId)) {
      return res.status(400).json({ error: 'Invalid couple ID' });
    }

    const data = insertBondAssessmentSchema.parse({
      coupleId,
      ...req.body
    });

    const assessment = await storage.createBondAssessment(data);
    res.status(201).json(assessment);
  } catch (error) {
    console.error('Error creating bond assessment:', error);
    res.status(400).json({ error: 'Failed to create bond assessment' });
  }
});

// Get bond insights for a couple
router.get('/couples/:coupleId/bond-insights', async (req, res) => {
  try {
    const coupleId = parseInt(req.params.coupleId);
    if (isNaN(coupleId)) {
      return res.status(400).json({ error: 'Invalid couple ID' });
    }

    const insights = await storage.getBondInsightsByCouple(coupleId);
    res.json(insights);
  } catch (error) {
    console.error('Error fetching couple bond insights:', error);
    res.status(500).json({ error: 'Failed to fetch bond insights' });
  }
});

// Generate bond insights for a couple
router.post('/couples/:coupleId/bond-insights/generate', async (req, res) => {
  try {
    const coupleId = parseInt(req.params.coupleId);
    if (isNaN(coupleId)) {
      return res.status(400).json({ error: 'Invalid couple ID' });
    }

    // Get all bond assessments for the couple
    const assessments = await storage.getBondAssessmentsByCouple(coupleId);
    
    if (assessments.length === 0) {
      return res.status(400).json({ error: 'No bond assessments found for this couple' });
    }

    // Generate insights for lowest scoring dimensions
    const weakDimensions = assessments
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(assessment => assessment.dimensionId);

    const insights = [];

    // Generate sample insights for each weak dimension
    for (const dimensionId of weakDimensions) {
      const dimension = BOND_DIMENSIONS.find(d => d.id === dimensionId);
      if (!dimension) continue;

      const assessment = assessments.find(a => a.dimensionId === dimensionId);
      if (!assessment) continue;

      // Create a new insight
      const insightData = {
        coupleId,
        dimensionId,
        title: `Improve your ${dimension.name}`,
        content: `Your ${dimension.name} score is ${assessment.score}/10. This dimension is about ${dimension.description}`,
        actionItems: [
          `Schedule time each week to practice active listening`,
          `Share one thing you appreciate about each other daily`,
          `Try a new activity together that builds this dimension`
        ],
        targetScoreRange: [0, assessment.score + 2] as [number, number],
        difficulty: 'medium' as 'easy' | 'medium' | 'challenging',
        viewed: false,
        completed: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };

      const insight = await storage.createBondInsight(insightData);
      insights.push(insight);
    }

    res.status(201).json(insights);
  } catch (error) {
    console.error('Error generating bond insights:', error);
    res.status(500).json({ error: 'Failed to generate bond insights' });
  }
});

// Mark bond insight as viewed
router.patch('/bond-insights/:insightId/viewed', async (req, res) => {
  try {
    const insightId = parseInt(req.params.insightId);
    if (isNaN(insightId)) {
      return res.status(400).json({ error: 'Invalid insight ID' });
    }

    const insight = await storage.updateBondInsightViewed(insightId, true);
    res.json(insight);
  } catch (error) {
    console.error('Error updating bond insight:', error);
    res.status(500).json({ error: 'Failed to update bond insight' });
  }
});

// Mark bond insight as completed
router.patch('/bond-insights/:insightId/completed', async (req, res) => {
  try {
    const insightId = parseInt(req.params.insightId);
    if (isNaN(insightId)) {
      return res.status(400).json({ error: 'Invalid insight ID' });
    }

    const insight = await storage.updateBondInsightCompleted(insightId, true);
    res.json(insight);
  } catch (error) {
    console.error('Error updating bond insight:', error);
    res.status(500).json({ error: 'Failed to update bond insight' });
  }
});

export default router;