import { nanoid } from 'nanoid';
import { db } from '../db';
import { 
  rewards, 
  coupleRewards, 
  couples, 
  users, 
  competitions,
  type CoupleReward,
  type Couple,
  type Reward,
  type Competition
} from '@shared/schema';
import { eq, and, inArray, gt, lt, isNull, sql } from 'drizzle-orm';
import { sendEmail, getRewardWinnerEmailTemplate, getRewardReminderEmailTemplate } from './emailService';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';

/**
 * Award a reward to a couple, creating a coupleReward record and sending notification
 */
export const awardRewardToCouple = async (
  coupleId: number,
  rewardId: number,
  competitionId?: number,
): Promise<CoupleReward | null> => {
  try {
    // Fetch the reward, couple, and competition details
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    const [couple] = await db.select().from(couples).where(eq(couples.id, coupleId));
    
    let competition = null;
    if (competitionId) {
      const [comp] = await db.select().from(competitions).where(eq(competitions.id, competitionId));
      competition = comp;
    }
    
    if (!reward || !couple) {
      console.error('Reward or couple not found', { rewardId, coupleId });
      return null;
    }
    
    // Check if reward is still available (quantity > 0)
    if (reward.quantity <= 0) {
      console.error('Reward out of stock', { rewardId });
      return null;
    }
    
    // Generate unique redemption code
    const redemptionCode = nanoid(8).toUpperCase();
    
    // Create redemption URL
    const redemptionUrl = `${process.env.APP_URL || 'https://app.bondquest.com'}/rewards/redeem/${redemptionCode}`;
    
    // Set expiration date based on reward's redemptionPeriodDays or default to 30 days
    const expiresAt = addDays(new Date(), reward.redemptionPeriodDays || 30);
    
    // Create the couple reward record
    const [coupleReward] = await db.insert(coupleRewards)
      .values({
        coupleId,
        rewardId,
        competitionId: competitionId || null,
        status: 'awarded',
        redemptionCode,
        redemptionUrl,
        notificationSent: false,
        expiresAt,
      })
      .returning();
    
    // Decrement the reward quantity
    await db.update(rewards)
      .set({ 
        quantity: reward.quantity - 1,
        updatedAt: new Date()
      })
      .where(eq(rewards.id, rewardId));
    
    return coupleReward;
  } catch (error) {
    console.error('Error awarding reward to couple:', error);
    return null;
  }
};

/**
 * Send reward notification email to a couple
 */
export const sendRewardNotification = async (coupleRewardId: number): Promise<boolean> => {
  try {
    // Get the couple reward with related data
    const [coupleReward] = await db.select()
      .from(coupleRewards)
      .where(eq(coupleRewards.id, coupleRewardId));
    
    if (!coupleReward) {
      console.error('Couple reward not found', { coupleRewardId });
      return false;
    }
    
    // Skip if notification was already sent
    if (coupleReward.notificationSent) {
      return true;
    }
    
    // Get reward details
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, coupleReward.rewardId));
    
    // Get couple details
    const [couple] = await db.select().from(couples).where(eq(couples.id, coupleReward.coupleId));
    
    // Get users from the couple
    const [user1] = await db.select().from(users).where(eq(users.id, couple.userId1));
    const [user2] = await db.select().from(users).where(eq(users.id, couple.userId2));
    
    // Get competition name if applicable
    let competitionName: string | undefined;
    if (coupleReward.competitionId) {
      const [competition] = await db.select()
        .from(competitions)
        .where(eq(competitions.id, coupleReward.competitionId));
      
      if (competition) {
        competitionName = competition.title;
      }
    }
    
    // Format expiration date
    const expirationDate = coupleReward.expiresAt ? format(coupleReward.expiresAt, 'MMMM d, yyyy') : format(addDays(new Date(), 30), 'MMMM d, yyyy');
    
    // Create couple names for email
    const coupleNames = `${user1?.username || 'User'} & ${user2?.username || 'Partner'}`;
    
    // Get location restrictions if any
    const locationRestrictions = (reward.locationRestricted && reward.eligibleLocations) ? reward.eligibleLocations : undefined;
    
    // Get recipient emails
    const emails = [user1?.email, user2?.email].filter(Boolean) as string[];
    
    if (emails.length === 0) {
      console.error('No emails found for couple', { coupleId: couple.id });
      return false;
    }
    
    // Generate email content
    const emailHtml = getRewardWinnerEmailTemplate(
      coupleNames,
      reward.name,
      reward.description,
      reward.imageUrl || '',
      coupleReward.redemptionCode || '',
      coupleReward.redemptionUrl || '',
      expirationDate,
      competitionName,
      locationRestrictions
    );
    
    // Send the email to both users
    const emailResult = await sendEmail({
      to: emails.join(', '),
      subject: `🎉 Congratulations! You've Won: ${reward.name}`,
      html: emailHtml
    });
    
    if (emailResult.success) {
      // Update the coupleReward record to mark notification as sent
      await db.update(coupleRewards)
        .set({
          notificationSent: true,
          notifiedAt: new Date(),
          notificationEmailId: emailResult.messageId,
          status: 'notified'
        })
        .where(eq(coupleRewards.id, coupleRewardId));
      
      return true;
    } else {
      console.error('Failed to send reward notification email', { emailError: emailResult.error });
      return false;
    }
  } catch (error) {
    console.error('Error sending reward notification:', error);
    return false;
  }
};

/**
 * Check a reward code for validity
 */
export const validateRedemptionCode = async (redemptionCode: string): Promise<CoupleReward | null> => {
  try {
    // Find the coupleReward with this redemption code
    const [coupleReward] = await db.select()
      .from(coupleRewards)
      .where(eq(coupleRewards.redemptionCode, redemptionCode));
    
    if (!coupleReward) {
      return null;
    }
    
    // Check if it's expired
    if (coupleReward.expiresAt && new Date() > coupleReward.expiresAt) {
      // Mark as expired if not already
      if (coupleReward.status !== 'expired') {
        await db.update(coupleRewards)
          .set({ status: 'expired' })
          .where(eq(coupleRewards.id, coupleReward.id));
      }
      return null;
    }
    
    // Check if already redeemed
    if (['redeemed', 'shipped', 'delivered'].includes(coupleReward.status)) {
      return null;
    }
    
    return coupleReward;
  } catch (error) {
    console.error('Error validating redemption code:', error);
    return null;
  }
};

/**
 * Mark a reward as viewed by the couple
 */
export const markRewardAsViewed = async (coupleRewardId: number): Promise<boolean> => {
  try {
    // Only update if not already viewed
    const [coupleReward] = await db.select()
      .from(coupleRewards)
      .where(and(
        eq(coupleRewards.id, coupleRewardId),
        isNull(coupleRewards.viewedAt)
      ));
    
    if (!coupleReward) {
      return false;
    }
    
    await db.update(coupleRewards)
      .set({
        viewedAt: new Date(),
        status: coupleReward.status === 'notified' ? 'viewed' : coupleReward.status
      })
      .where(eq(coupleRewards.id, coupleRewardId));
    
    return true;
  } catch (error) {
    console.error('Error marking reward as viewed:', error);
    return false;
  }
};

/**
 * Process reward claim with shipping details for physical rewards
 */
export const claimReward = async (
  coupleRewardId: number,
  shippingAddress?: any,
  notes?: string
): Promise<CoupleReward | null> => {
  try {
    const [coupleReward] = await db.select()
      .from(coupleRewards)
      .where(eq(coupleRewards.id, coupleRewardId));
    
    if (!coupleReward) {
      return null;
    }
    
    // Get the reward to check its type
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, coupleReward.rewardId));
    
    if (!reward) {
      return null;
    }
    
    const updates: any = {
      claimedAt: new Date(),
      status: 'claimed',
    };
    
    // For physical rewards that require shipping, save shipping address
    if (reward.type === 'physical' && reward.shippingDetails?.requiresShipping && shippingAddress) {
      updates.shippingAddress = shippingAddress;
    }
    
    // Save any notes from the user
    if (notes) {
      updates.winnerNotes = notes;
    }
    
    // Update the coupleReward
    const [updatedReward] = await db.update(coupleRewards)
      .set(updates)
      .where(eq(coupleRewards.id, coupleRewardId))
      .returning();
    
    return updatedReward;
  } catch (error) {
    console.error('Error claiming reward:', error);
    return null;
  }
};

/**
 * Mark reward as redeemed (for digital rewards or in-person experiences)
 */
export const redeemReward = async (
  coupleRewardId: number,
  locationData?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  }
): Promise<CoupleReward | null> => {
  try {
    const [updatedReward] = await db.update(coupleRewards)
      .set({
        status: 'redeemed',
        redeemedAt: new Date(),
        locationRedeemed: locationData || null
      })
      .where(eq(coupleRewards.id, coupleRewardId))
      .returning();
    
    return updatedReward;
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return null;
  }
};

/**
 * Send reminders for unclaimed rewards that are about to expire
 */
export const sendRewardReminders = async (): Promise<number> => {
  try {
    // Find rewards close to expiration (within next 3 days) that haven't been claimed
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);
    
    const unclaimedRewards = await db.select()
      .from(coupleRewards)
      .where(and(
        inArray(coupleRewards.status, ['awarded', 'notified', 'viewed']),
        gt(coupleRewards.expiresAt, now),
        lt(coupleRewards.expiresAt, threeDaysFromNow)
      ));
    
    let remindersSent = 0;
    
    for (const reward of unclaimedRewards) {
      // Avoid sending too many reminders (max 2 reminders per reward)
      if ((reward.remindersSentCount || 0) >= 2) {
        continue;
      }
      
      // Get couple details
      const [couple] = await db.select().from(couples).where(eq(couples.id, reward.coupleId));
      if (!couple) continue;
      
      // Get reward details
      const [rewardDetails] = await db.select().from(rewards).where(eq(rewards.id, reward.rewardId));
      if (!rewardDetails) continue;
      
      // Get users
      const [user1] = await db.select().from(users).where(eq(users.id, couple.userId1));
      const [user2] = await db.select().from(users).where(eq(users.id, couple.userId2));
      
      // Get recipient emails
      const emails = [user1?.email, user2?.email].filter(Boolean) as string[];
      if (emails.length === 0) continue;
      
      // Create couple names for email
      const coupleNames = `${user1?.username} & ${user2?.username}`;
      
      // Calculate days left
      const daysLeft = reward.expiresAt ? differenceInDays(reward.expiresAt, now) : 7;
      
      // Format expiration date
      const expirationDate = reward.expiresAt 
        ? format(reward.expiresAt, 'MMMM d, yyyy')
        : format(addDays(now, 7), 'MMMM d, yyyy');
      
      // Generate email content
      const emailHtml = getRewardReminderEmailTemplate(
        coupleNames,
        rewardDetails.name,
        expirationDate,
        daysLeft,
        reward.redemptionUrl || ''
      );
      
      // Send the email
      const emailResult = await sendEmail({
        to: emails.join(', '),
        subject: `⏰ Reminder: Your ${rewardDetails.name} Reward Expires Soon`,
        html: emailHtml
      });
      
      if (emailResult.success) {
        // Update reminder count and timestamp
        await db.update(coupleRewards)
          .set({
            remindersSentCount: (reward.remindersSentCount || 0) + 1,
            lastReminderAt: new Date()
          })
          .where(eq(coupleRewards.id, reward.id));
        
        remindersSent++;
      }
    }
    
    return remindersSent;
  } catch (error) {
    console.error('Error sending reward reminders:', error);
    return 0;
  }
};

/**
 * Mark expired rewards as expired
 */
export const processExpiredRewards = async (): Promise<number> => {
  try {
    const now = new Date();
    
    // Find unclaimed/unredeemed rewards that have expired
    const expiredRewards = await db.select()
      .from(coupleRewards)
      .where(and(
        inArray(coupleRewards.status, ['awarded', 'notified', 'viewed', 'claimed']),
        lt(coupleRewards.expiresAt, now)
      ));
    
    // Update status to expired
    for (const reward of expiredRewards) {
      await db.update(coupleRewards)
        .set({ status: 'expired' })
        .where(eq(coupleRewards.id, reward.id));
    }
    
    return expiredRewards.length;
  } catch (error) {
    console.error('Error processing expired rewards:', error);
    return 0;
  }
};

/**
 * Get rewards based on user's location
 */
export const getLocationEligibleRewards = async (
  coupleId: number,
  countryCode: string
): Promise<Reward[]> => {
  try {
    // Get all active rewards
    const activeRewards = await db.select()
      .from(rewards)
      .where(and(
        eq(rewards.active, true),
        gt(rewards.quantity, 0),
        lt(rewards.availableFrom, new Date()),
        gt(rewards.availableTo, new Date())
      ));
    
    // Filter rewards based on location eligibility
    const eligibleRewards = activeRewards.filter(reward => {
      // If not location restricted, it's available everywhere
      if (!reward.locationRestricted) {
        return true;
      }
      
      // If location restricted, check if user's country is in eligible locations
      return Array.isArray(reward.eligibleLocations) && 
             reward.eligibleLocations.includes(countryCode);
    });
    
    return eligibleRewards;
  } catch (error) {
    console.error('Error getting location-eligible rewards:', error);
    return [];
  }
};

/**
 * Mark a reward as shipped
 */
export const markRewardAsShipped = async (
  coupleRewardId: number, 
  trackingNumber: string,
  adminNotes?: string
): Promise<CoupleReward | null> => {
  try {
    const [updatedReward] = await db.update(coupleRewards)
      .set({
        status: 'shipped',
        shippedAt: new Date(),
        trackingNumber,
        adminNotes: adminNotes || null
      })
      .where(eq(coupleRewards.id, coupleRewardId))
      .returning();
    
    return updatedReward;
  } catch (error) {
    console.error('Error marking reward as shipped:', error);
    return null;
  }
};

/**
 * Mark a reward as delivered
 */
export const markRewardAsDelivered = async (
  coupleRewardId: number
): Promise<CoupleReward | null> => {
  try {
    const [updatedReward] = await db.update(coupleRewards)
      .set({
        status: 'delivered',
        deliveredAt: new Date()
      })
      .where(eq(coupleRewards.id, coupleRewardId))
      .returning();
    
    return updatedReward;
  } catch (error) {
    console.error('Error marking reward as delivered:', error);
    return null;
  }
};

/**
 * Cancel a reward
 */
export const cancelReward = async (
  coupleRewardId: number,
  reason: string
): Promise<CoupleReward | null> => {
  try {
    const [coupleReward] = await db.select()
      .from(coupleRewards)
      .where(eq(coupleRewards.id, coupleRewardId));
    
    if (!coupleReward) {
      return null;
    }
    
    // Don't cancel if already redeemed, shipped or delivered
    if (['redeemed', 'shipped', 'delivered'].includes(coupleReward.status)) {
      console.error('Cannot cancel reward in current status:', coupleReward.status);
      return null;
    }
    
    // Increment the reward quantity back
    await db.update(rewards)
      .set({ 
        quantity: sql`${rewards.quantity} + 1`,
        updatedAt: new Date()
      })
      .where(eq(rewards.id, coupleReward.rewardId));
    
    // Update the coupleReward
    const [updatedReward] = await db.update(coupleRewards)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        adminNotes: (coupleReward.adminNotes ? coupleReward.adminNotes + '\n' : '') + 
                   `Canceled: ${reason}`
      })
      .where(eq(coupleRewards.id, coupleRewardId))
      .returning();
    
    return updatedReward;
  } catch (error) {
    console.error('Error canceling reward:', error);
    return null;
  }
};