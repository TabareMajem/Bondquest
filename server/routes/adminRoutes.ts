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
    // Only select columns that actually exist in the database
    // Query the database using all available fields (based on actual db inspection)
    const rewardsData = await db.select()
      .from(rewards);
    
    // Map database fields to client-expected fields
    const allRewards = rewardsData.map(reward => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      code: reward.code,
      imageUrl: reward.image_url,
      availableFrom: reward.available_from,
      availableTo: reward.available_to,
      quantity: reward.quantity,
      requiredTier: reward.required_tier,
      active: reward.active,
      createdAt: reward.created_at,
      updatedAt: reward.updated_at
    }));
    
    // Add missing fields with default values for client compatibility
    const enhancedRewards = allRewards.map(reward => ({
      ...reward,
      locationRestricted: false,
      eligibleLocations: [],
      redemptionPeriodDays: 30,
      redemptionInstructions: null,
      provider: null,
      shippingDetails: null,
      terms: null
    }));
    
    res.json(enhancedRewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ message: 'Failed to fetch rewards' });
  }
});

router.post('/rewards', isAdmin, async (req, res) => {
  try {
    // Only include fields that exist in the database
    const validFields = {
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      value: req.body.value,
      code: req.body.code || null,
      image_url: req.body.imageUrl || null,
      available_from: req.body.availableFrom,
      available_to: req.body.availableTo,
      quantity: req.body.quantity,
      required_tier: req.body.requiredTier || null,
      active: req.body.active
    };
    
    // Insert directly into database
    const [newReward] = await db.insert(rewards)
      .values([validFields])
      .returning();
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
    
    // Only include fields that exist in the database
    const validFields: Record<string, any> = {};
    
    if (req.body.name !== undefined) validFields.name = req.body.name;
    if (req.body.description !== undefined) validFields.description = req.body.description;
    if (req.body.type !== undefined) validFields.type = req.body.type;
    if (req.body.value !== undefined) validFields.value = req.body.value;
    if (req.body.code !== undefined) validFields.code = req.body.code;
    if (req.body.imageUrl !== undefined) validFields.image_url = req.body.imageUrl;
    if (req.body.availableFrom !== undefined) validFields.available_from = req.body.availableFrom;
    if (req.body.availableTo !== undefined) validFields.available_to = req.body.availableTo;
    if (req.body.quantity !== undefined) validFields.quantity = req.body.quantity;
    if (req.body.requiredTier !== undefined) validFields.required_tier = req.body.requiredTier;
    if (req.body.active !== undefined) validFields.active = req.body.active;
    // Add updated_at field
    validFields.updated_at = new Date();
    
    // Update reward directly in database
    await db.update(rewards)
      .set(validFields)
      .where(eq(rewards.id, rewardId));
    
    // Fetch the updated reward
    const [rewardData] = await db.select()
      .from(rewards)
      .where(eq(rewards.id, rewardId));
    
    // Format it for client compatibility
    const updatedReward = {
      id: rewardData.id,
      name: rewardData.name,
      description: rewardData.description,
      type: rewardData.type,
      value: rewardData.value,
      code: rewardData.code,
      imageUrl: rewardData.image_url,
      availableFrom: rewardData.available_from,
      availableTo: rewardData.available_to,
      quantity: rewardData.quantity,
      requiredTier: rewardData.required_tier,
      active: rewardData.active,
      createdAt: rewardData.created_at,
      updatedAt: rewardData.updated_at,
      // Add missing fields for client compatibility
      locationRestricted: false,
      eligibleLocations: [],
      redemptionPeriodDays: 30,
      redemptionInstructions: null,
      provider: null,
      shippingDetails: null,
      terms: null
    };
    
    if (!updatedReward) {
      return res.status(404).json({ message: 'Reward not found' });
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