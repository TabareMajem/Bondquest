import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { users, subscriptionTiers, rewards, quizSessions, userSubscriptions, couples, coupleRewards, competitions as competitionsTable } from '@shared/schema';
import { eq, sql, desc, and, not, inArray } from 'drizzle-orm';
import { db } from '../db';
import * as rewardService from '../services/rewardService';

const router = express.Router();

// Authentication and admin role middleware
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Check if the user has admin privileges
  // This is a simple check; you might want to add a proper role system later
  const user = req.user as any; // Type casting to avoid TypeScript errors
  if (user && user.username === 'admin') {
    return next();
  }
  
  res.status(403).json({ message: 'Forbidden - Admin access required' });
}

// Admin dashboard stats
router.get('/stats', isAdmin, async (req, res) => {
  try {
    // Get total users count
    const [userCount] = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(users);
    
    // Get active subscriptions count
    // Using db directly to query subscriptions
    const subscriptions = await db.select().from(userSubscriptions);
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    // Get total couples count
    const couplesList = await db.select().from(couples);
    
    // Get recent quiz sessions (latest 10)
    const recentSessions = await db.select()
      .from(quizSessions)
      .orderBy(desc(quizSessions.createdAt))
      .limit(10);
    
    // Get monthly revenue (simplified)
    const monthlyRevenue = activeSubscriptions.reduce((total: number, sub: any) => {
      // This is a simplification - in a real app, you'd need more complex calculations
      return total + (sub.amount || 0);
    }, 0);
    
    res.json({
      userCount: userCount?.count || 0,
      coupleCount: couplesList.length,
      activeSubscriptions: activeSubscriptions.length,
      totalSubscriptions: subscriptions.length,
      monthlyRevenue,
      recentSessions
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// User management endpoints
router.get('/users', isAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Subscription management endpoints
router.get('/subscriptions', isAdmin, async (req, res) => {
  try {
    const allTiers = await db.select().from(subscriptionTiers);
    res.json(allTiers);
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({ message: 'Failed to fetch subscription tiers' });
  }
});

router.post('/subscriptions', isAdmin, async (req, res) => {
  try {
    // Insert directly into database
    const [newTier] = await db.insert(subscriptionTiers)
      .values(req.body)
      .returning();
    res.status(201).json(newTier);
  } catch (error) {
    console.error('Error creating subscription tier:', error);
    res.status(500).json({ message: 'Failed to create subscription tier' });
  }
});

router.patch('/subscriptions/:id', isAdmin, async (req, res) => {
  try {
    const tierId = parseInt(req.params.id);
    if (isNaN(tierId)) {
      return res.status(400).json({ message: 'Invalid tier ID' });
    }
    
    // Update directly in database
    await db.update(subscriptionTiers)
      .set(req.body)
      .where(eq(subscriptionTiers.id, tierId));
    
    // Fetch the updated subscription tier
    const [updatedTier] = await db.select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.id, tierId));
    
    if (!updatedTier) {
      return res.status(404).json({ message: 'Subscription tier not found' });
    }
    
    res.json(updatedTier);
  } catch (error) {
    console.error('Error updating subscription tier:', error);
    res.status(500).json({ message: 'Failed to update subscription tier' });
  }
});

// Reward management endpoints
router.get('/rewards', isAdmin, async (req, res) => {
  try {
    // Use our rewards service to get all rewards
    const { getAllRewards } = require('../services/db/rewards');
    const rewards = await getAllRewards();
    res.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ message: 'Failed to fetch rewards' });
  }
});

router.post('/rewards', isAdmin, async (req, res) => {
  try {
    // Use our rewards service to create a new reward
    const { createReward } = require('../services/db/rewards');
    const rewardData = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      value: req.body.value,
      code: req.body.code || null,
      imageUrl: req.body.imageUrl || null,
      availableFrom: req.body.availableFrom,
      availableTo: req.body.availableTo,
      quantity: req.body.quantity,
      requiredTier: req.body.requiredTier || null,
      active: req.body.active
    };
    
    const newReward = await createReward(rewardData);
    
    if (!newReward) {
      return res.status(500).json({ message: 'Failed to create reward' });
    }
    
    res.status(201).json(newReward);
  } catch (error) {
    console.error('Error creating reward:', error);
    res.status(500).json({ message: 'Failed to create reward' });
  }
});

router.patch('/rewards/:id', isAdmin, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: 'Invalid reward ID' });
    }
    
    // Use our rewards service to update an existing reward
    const { updateReward } = require('../services/db/rewards');
    
    // Pass only fields that exist in the client model
    const updateData: Record<string, any> = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.value !== undefined) updateData.value = req.body.value;
    if (req.body.code !== undefined) updateData.code = req.body.code;
    if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
    if (req.body.availableFrom !== undefined) updateData.availableFrom = req.body.availableFrom;
    if (req.body.availableTo !== undefined) updateData.availableTo = req.body.availableTo;
    if (req.body.quantity !== undefined) updateData.quantity = req.body.quantity;
    if (req.body.requiredTier !== undefined) updateData.requiredTier = req.body.requiredTier;
    if (req.body.active !== undefined) updateData.active = req.body.active;
    
    const updatedReward = await updateReward(rewardId, updateData);
    
    if (!updatedReward) {
      return res.status(404).json({ message: 'Reward not found or could not be updated' });
    }
    
    res.json(updatedReward);
  } catch (error) {
    console.error('Error updating reward:', error);
    res.status(500).json({ message: 'Failed to update reward' });
  }
});

// Create admin user if it doesn't exist
router.post('/setup', async (req, res) => {
  try {
    // Check if admin already exists
    const [existingAdmin] = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'));
    
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', exists: true });
    }
    
    // Create admin user with the provided password or a default one
    const password = req.body.password || 'admin123';
    
    // Import password utils for hashing
    const { hashPassword } = require('../auth/passwordUtils');
    const hashedPassword = await hashPassword(password);
    
    // Create admin user with direct database query
    const [adminUser] = await db.insert(users)
      .values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@bondquest.app',
        displayName: 'BondQuest Admin',
        partnerCode: 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      })
      .returning();
    
    res.status(201).json({ 
      message: 'Admin user created successfully',
      username: 'admin',
      password: password // In production, you shouldn't return the password
    });
  } catch (error) {
    console.error('Error setting up admin:', error);
    res.status(500).json({ message: 'Failed to set up admin user' });
  }
});

// Competition management
router.get('/competitions', isAdmin, async (req, res) => {
  try {
    // Query directly from database for competitions
    const competitionsList = await db.select().from(competitionsTable);
    res.json(competitionsList);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ message: 'Failed to fetch competitions' });
  }
});

router.post('/competitions', isAdmin, async (req, res) => {
  try {
    // Insert directly into database
    const [newCompetition] = await db.insert(competitionsTable)
      .values(req.body)
      .returning();
    res.status(201).json(newCompetition);
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ message: 'Failed to create competition' });
  }
});

// Enhanced reward management
router.get('/couple-rewards', isAdmin, async (req, res) => {
  try {
    // Get query parameters for filtering
    const status = req.query.status as string;
    const locationQuery = req.query.location as string;
    
    // Get all couple rewards with their associated reward info
    const allCoupleRewards = await db.select()
      .from(coupleRewards)
      .orderBy(desc(coupleRewards.id));
    
    // Fetch reward details for each couple reward
    const results = await Promise.all(
      allCoupleRewards.map(async (cr) => {
        // Get reward
        const [reward] = await db.select()
          .from(rewards)
          .where(eq(rewards.id, cr.rewardId));
          
        // Get couple
        const [couple] = await db.select()
          .from(couples)
          .where(eq(couples.id, cr.coupleId));
          
        return {
          ...cr,
          reward,
          couple
        };
      })
    );
    
    // Apply filters
    let filteredResults = results;
    
    // Filter by status if provided
    if (status) {
      filteredResults = filteredResults.filter(r => r.status === status);
    }
    
    // Filter by location if provided
    if (locationQuery) {
      filteredResults = filteredResults.filter(r => {
        if (!r.reward?.locationRestricted) return true;
        return r.reward?.eligibleLocations?.includes(locationQuery);
      });
    }
    
    res.json(filteredResults);
  } catch (error) {
    console.error('Error fetching couple rewards:', error);
    res.status(500).json({ message: 'Failed to fetch couple rewards' });
  }
});

// Get a specific couple reward
router.get('/couple-rewards/:id', isAdmin, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: 'Invalid reward ID' });
    }
    
    // Get the couple reward
    const [coupleReward] = await db.select()
      .from(coupleRewards)
      .where(eq(coupleRewards.id, rewardId));
      
    if (!coupleReward) {
      return res.status(404).json({ message: 'Couple reward not found' });
    }
    
    // Get the reward
    const [reward] = await db.select()
      .from(rewards)
      .where(eq(rewards.id, coupleReward.rewardId));
      
    // Get couple 
    const [couple] = await db.select()
      .from(couples)
      .where(eq(couples.id, coupleReward.coupleId));
    
    // Get user details for the couple
    let user1 = null;
    let user2 = null;
    
    if (couple) {
      [user1] = await db.select().from(users).where(eq(users.id, couple.userId1));
      [user2] = await db.select().from(users).where(eq(users.id, couple.userId2));
    }
    
    // Build the response data
    const responseData = {
      ...coupleReward,
      reward,
      couple: couple ? {
        ...couple,
        user1,
        user2
      } : null
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching couple reward details:', error);
    res.status(500).json({ message: 'Failed to fetch couple reward details' });
  }
});

// Award a reward to a couple
router.post('/couple-rewards', isAdmin, async (req, res) => {
  try {
    const { coupleId, rewardId, competitionId } = req.body;
    
    if (!coupleId || !rewardId) {
      return res.status(400).json({ message: 'Missing required fields: coupleId and rewardId are required' });
    }
    
    const coupleReward = await rewardService.awardRewardToCouple(coupleId, rewardId, competitionId);
    
    if (!coupleReward) {
      return res.status(400).json({ message: 'Failed to award reward to couple. Check logs for details.' });
    }
    
    res.status(201).json(coupleReward);
  } catch (error) {
    console.error('Error awarding reward to couple:', error);
    res.status(500).json({ message: 'Failed to award reward to couple' });
  }
});

// Send notification email for a reward
router.post('/couple-rewards/:id/notify', isAdmin, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: 'Invalid reward ID' });
    }
    
    const success = await rewardService.sendRewardNotification(rewardId);
    
    if (!success) {
      return res.status(400).json({ message: 'Failed to send reward notification. Check logs for details.' });
    }
    
    res.json({ success: true, message: 'Reward notification sent successfully' });
  } catch (error) {
    console.error('Error sending reward notification:', error);
    res.status(500).json({ message: 'Failed to send reward notification' });
  }
});

// Mark reward as shipped
router.post('/couple-rewards/:id/ship', isAdmin, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: 'Invalid reward ID' });
    }
    
    const { trackingNumber, adminNotes } = req.body;
    
    if (!trackingNumber) {
      return res.status(400).json({ message: 'Tracking number is required for shipping' });
    }
    
    const updatedReward = await rewardService.markRewardAsShipped(rewardId, trackingNumber, adminNotes);
    
    if (!updatedReward) {
      return res.status(400).json({ message: 'Failed to mark reward as shipped. Check logs for details.' });
    }
    
    res.json(updatedReward);
  } catch (error) {
    console.error('Error marking reward as shipped:', error);
    res.status(500).json({ message: 'Failed to mark reward as shipped' });
  }
});

// Mark reward as delivered
router.post('/couple-rewards/:id/deliver', isAdmin, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: 'Invalid reward ID' });
    }
    
    const updatedReward = await rewardService.markRewardAsDelivered(rewardId);
    
    if (!updatedReward) {
      return res.status(400).json({ message: 'Failed to mark reward as delivered. Check logs for details.' });
    }
    
    res.json(updatedReward);
  } catch (error) {
    console.error('Error marking reward as delivered:', error);
    res.status(500).json({ message: 'Failed to mark reward as delivered' });
  }
});

// Cancel a reward
router.post('/couple-rewards/:id/cancel', isAdmin, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: 'Invalid reward ID' });
    }
    
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required for cancellation' });
    }
    
    const updatedReward = await rewardService.cancelReward(rewardId, reason);
    
    if (!updatedReward) {
      return res.status(400).json({ message: 'Failed to cancel reward. Check logs for details.' });
    }
    
    res.json(updatedReward);
  } catch (error) {
    console.error('Error canceling reward:', error);
    res.status(500).json({ message: 'Failed to cancel reward' });
  }
});

// Run reward maintenance tasks (process expired rewards)
router.post('/rewards/maintenance', isAdmin, async (req, res) => {
  try {
    const expiredCount = await rewardService.processExpiredRewards();
    const remindersSent = await rewardService.sendRewardReminders();
    
    res.json({ 
      success: true, 
      expiredCount,
      remindersSent,
      message: `Maintenance completed: ${expiredCount} rewards marked as expired, ${remindersSent} reminders sent`
    });
  } catch (error) {
    console.error('Error running reward maintenance:', error);
    res.status(500).json({ message: 'Failed to run reward maintenance' });
  }
});

export default router;