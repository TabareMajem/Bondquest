import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { users, subscriptionTiers, rewards, quizSessions, userSubscriptions, couples as couplesTable } from '@shared/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../db';

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
    const couplesList = await db.select().from(couplesTable);
    
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
      coupleCount: couples.length,
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
    const newTier = await storage.createSubscriptionTier(req.body);
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
    
    const updatedTier = await storage.updateSubscriptionTier(tierId, req.body);
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
    const allRewards = await db.select().from(rewards);
    res.json(allRewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ message: 'Failed to fetch rewards' });
  }
});

router.post('/rewards', isAdmin, async (req, res) => {
  try {
    const newReward = await storage.createReward(req.body);
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
    
    const updatedReward = await storage.updateReward(rewardId, req.body);
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
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      return res.json({ message: 'Admin already exists', exists: true });
    }
    
    // Create admin user with the provided password or a default one
    const password = req.body.password || 'admin123';
    
    // This should be using your user registration function that hashes passwords
    const adminUser = await storage.createUser({
      username: 'admin',
      password: password, // This should be hashed by your auth system
      email: 'admin@bondquest.app',
      displayName: 'BondQuest Admin',
      partnerCode: 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    });
    
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
    const competitions = await storage.getCompetitions();
    res.json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ message: 'Failed to fetch competitions' });
  }
});

router.post('/competitions', isAdmin, async (req, res) => {
  try {
    const newCompetition = await storage.createCompetition(req.body);
    res.status(201).json(newCompetition);
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ message: 'Failed to create competition' });
  }
});

// Reward fulfillment
router.get('/fulfillment', isAdmin, async (req, res) => {
  try {
    // Get all couple rewards that are pending fulfillment
    const pendingRewards = await storage.getPendingCoupleRewards();
    res.json(pendingRewards);
  } catch (error) {
    console.error('Error fetching pending rewards:', error);
    res.status(500).json({ message: 'Failed to fetch pending rewards' });
  }
});

router.patch('/fulfillment/:id', isAdmin, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.id);
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: 'Invalid reward ID' });
    }
    
    const { status, trackingNumber, shippingAddress } = req.body;
    
    if (status) {
      await storage.updateCoupleRewardStatus(rewardId, status);
    }
    
    if (trackingNumber && shippingAddress) {
      await storage.updateCoupleRewardShipping(rewardId, trackingNumber, shippingAddress);
    }
    
    const updatedReward = await storage.getCoupleReward(rewardId);
    res.json(updatedReward);
  } catch (error) {
    console.error('Error updating reward fulfillment:', error);
    res.status(500).json({ message: 'Failed to update reward fulfillment' });
  }
});

export default router;