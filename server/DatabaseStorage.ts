import { db } from './db';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { IStorage } from './storage';
import {
  users, couples, quizzes, questions, quizSessions, dailyCheckIns, achievements, activities, chats,
  subscriptionTiers, userSubscriptions, rewards, competitions, competitionRewards, competitionEntries, coupleRewards,
  type User, type InsertUser, type Couple, type InsertCouple, type Quiz, type InsertQuiz,
  type Question, type InsertQuestion, type QuizSession, type InsertQuizSession,
  type DailyCheckIn, type InsertDailyCheckIn, type Achievement, type InsertAchievement,
  type Activity, type InsertActivity, type Chat, type InsertChat,
  type SubscriptionTier, type InsertSubscriptionTier, type UserSubscription, type InsertUserSubscription,
  type Reward, type InsertReward, type Competition, type InsertCompetition,
  type CompetitionReward, type InsertCompetitionReward, type CompetitionEntry, type InsertCompetitionEntry,
  type CoupleReward, type InsertCoupleReward
} from '@shared/schema';

export class DatabaseStorage implements IStorage {
  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPartnerCode(partnerCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.partnerCode, partnerCode));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const partnerCode = nanoid(8);
    const [newUser] = await db.insert(users)
      .values({ ...user, partnerCode })
      .returning();
    return newUser;
  }

  // Couple Methods
  async getCouple(id: number): Promise<Couple | undefined> {
    const [couple] = await db.select().from(couples).where(eq(couples.id, id));
    return couple;
  }

  async getCoupleByUserId(userId: number): Promise<Couple | undefined> {
    // Find couples where the user is either user1 or user2
    const userCouples = await db.select().from(couples).where(
      sql`${couples.userId1} = ${userId} OR ${couples.userId2} = ${userId}`
    );
    return userCouples[0];
  }

  async createCouple(couple: InsertCouple): Promise<Couple> {
    const [newCouple] = await db.insert(couples)
      .values(couple)
      .returning();
    return newCouple;
  }

  async updateCoupleBondStrength(id: number, bondStrength: number): Promise<Couple | undefined> {
    const [updatedCouple] = await db.update(couples)
      .set({ bondStrength })
      .where(eq(couples.id, id))
      .returning();
    return updatedCouple;
  }

  async updateCoupleXP(id: number, xp: number): Promise<Couple | undefined> {
    // First get the current couple to calculate new XP and level
    const [couple] = await db.select().from(couples).where(eq(couples.id, id));
    
    if (!couple) return undefined;
    
    const newTotalXP = (couple.xp || 0) + xp;
    const level = Math.floor(newTotalXP / 1000) + 1;
    
    const [updatedCouple] = await db.update(couples)
      .set({ xp: newTotalXP, level })
      .where(eq(couples.id, id))
      .returning();
    return updatedCouple;
  }

  // Quiz Methods
  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes);
  }

  async getQuizzesByCategory(category: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.category, category));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes)
      .values(quiz)
      .returning();
    return newQuiz;
  }

  // Question Methods
  async getQuestions(quizId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.quizId, quizId));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    // Ensure options is properly formatted as a string array for database storage
    const processedQuestion = {
      ...question,
      options: Array.isArray(question.options) ? question.options : null
    };
    
    const [newQuestion] = await db.insert(questions)
      .values(processedQuestion)
      .returning();
    return newQuestion;
  }

  // Quiz Session Methods
  async getQuizSession(id: number): Promise<QuizSession | undefined> {
    const [session] = await db.select().from(quizSessions).where(eq(quizSessions.id, id));
    return session;
  }

  async getQuizSessionsByCouple(coupleId: number): Promise<QuizSession[]> {
    return await db.select().from(quizSessions)
      .where(eq(quizSessions.coupleId, coupleId))
      .orderBy(desc(quizSessions.createdAt));
  }

  async createQuizSession(session: InsertQuizSession): Promise<QuizSession> {
    const [newSession] = await db.insert(quizSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    // If session is being marked as completed, set completedAt timestamp
    if (updates.completed) {
      updates.completedAt = new Date();
    }
    
    const [updatedSession] = await db.update(quizSessions)
      .set(updates)
      .where(eq(quizSessions.id, id))
      .returning();
    return updatedSession;
  }

  // Daily Check-In Methods
  async getDailyCheckIns(userId: number): Promise<DailyCheckIn[]> {
    return await db.select().from(dailyCheckIns)
      .where(eq(dailyCheckIns.userId, userId))
      .orderBy(desc(dailyCheckIns.date));
  }

  async createDailyCheckIn(checkIn: InsertDailyCheckIn): Promise<DailyCheckIn> {
    const [newCheckIn] = await db.insert(dailyCheckIns)
      .values(checkIn)
      .returning();
    return newCheckIn;
  }

  // Achievement Methods
  async getAchievements(coupleId: number): Promise<Achievement[]> {
    return await db.select().from(achievements)
      .where(eq(achievements.coupleId, coupleId))
      .orderBy(desc(achievements.unlockedAt));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  // Activity Methods
  async getActivitiesByCouple(coupleId: number, limit?: number): Promise<Activity[]> {
    let queryBuilder = db.select().from(activities)
      .where(eq(activities.coupleId, coupleId))
      .orderBy(desc(activities.createdAt));
    
    // If a limit is specified, add it to the query
    if (limit) {
      return await queryBuilder.limit(limit);
    }
    
    return await queryBuilder;
  }

  async createActivity(activity: InsertActivity & { description?: string }): Promise<Activity> {
    const [newActivity] = await db.insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  // Chat Methods
  async getChatsByCouple(coupleId: number): Promise<Chat[]> {
    return await db.select().from(chats)
      .where(eq(chats.coupleId, coupleId))
      .orderBy(chats.createdAt);
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats)
      .values(chat)
      .returning();
    return newChat;
  }

  // Subscription Methods
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return await db.select().from(subscriptionTiers)
      .where(eq(subscriptionTiers.active, true));
  }

  async getSubscriptionTier(id: number): Promise<SubscriptionTier | undefined> {
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, id));
    return tier;
  }

  async createSubscriptionTier(tier: InsertSubscriptionTier): Promise<SubscriptionTier> {
    const [newTier] = await db.insert(subscriptionTiers)
      .values(tier)
      .returning();
    return newTier;
  }

  async updateSubscriptionTier(id: number, updates: Partial<SubscriptionTier>): Promise<SubscriptionTier | undefined> {
    // Always update the updatedAt timestamp
    updates.updatedAt = new Date();
    
    const [updatedTier] = await db.update(subscriptionTiers)
      .set(updates)
      .where(eq(subscriptionTiers.id, id))
      .returning();
    return updatedTier;
  }
  
  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    return subscription;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db.insert(userSubscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    // Always update the updatedAt timestamp
    updates.updatedAt = new Date();
    
    const [updatedSubscription] = await db.update(userSubscriptions)
      .set(updates)
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async cancelUserSubscription(id: number): Promise<UserSubscription | undefined> {
    const [canceledSubscription] = await db.update(userSubscriptions)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return canceledSubscription;
  }

  // Reward Methods
  async getRewards(limit?: number, activeOnly: boolean = true): Promise<Reward[]> {
    let queryBuilder = db.select().from(rewards);
    
    if (activeOnly) {
      const now = new Date();
      queryBuilder = queryBuilder
        .where(sql`${rewards.active} = true AND ${rewards.availableFrom} <= ${now} AND ${rewards.availableTo} >= ${now} AND ${rewards.quantity} > 0`);
    }
    
    queryBuilder = queryBuilder.orderBy(desc(rewards.createdAt));
    
    if (limit) {
      return await queryBuilder.limit(limit);
    }
    
    return await queryBuilder;
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards)
      .values(reward)
      .returning();
    return newReward;
  }

  async updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined> {
    // Always update the updatedAt timestamp
    updates.updatedAt = new Date();
    
    const [updatedReward] = await db.update(rewards)
      .set(updates)
      .where(eq(rewards.id, id))
      .returning();
    return updatedReward;
  }

  // Competition Methods
  async getCompetitions(status?: string, limit?: number): Promise<Competition[]> {
    let queryBuilder = db.select().from(competitions);
    
    if (status) {
      queryBuilder = queryBuilder.where(eq(competitions.status, status));
    }
    
    queryBuilder = queryBuilder.orderBy(desc(competitions.startDate));
    
    if (limit) {
      return await queryBuilder.limit(limit);
    }
    
    return await queryBuilder;
  }

  async getCompetition(id: number): Promise<Competition | undefined> {
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, id));
    return competition;
  }

  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const [newCompetition] = await db.insert(competitions)
      .values(competition)
      .returning();
    return newCompetition;
  }

  async updateCompetition(id: number, updates: Partial<Competition>): Promise<Competition | undefined> {
    // Always update the updatedAt timestamp
    updates.updatedAt = new Date();
    
    const [updatedCompetition] = await db.update(competitions)
      .set(updates)
      .where(eq(competitions.id, id))
      .returning();
    return updatedCompetition;
  }

  // Competition Reward Methods
  async addRewardToCompetition(competitionReward: InsertCompetitionReward): Promise<CompetitionReward> {
    const [newCompetitionReward] = await db.insert(competitionRewards)
      .values(competitionReward)
      .returning();
    return newCompetitionReward;
  }

  async getCompetitionRewards(competitionId: number): Promise<CompetitionReward[]> {
    return await db.select().from(competitionRewards)
      .where(eq(competitionRewards.competitionId, competitionId))
      .orderBy(competitionRewards.rankRequired);
  }

  // Competition Entry Methods
  async getCompetitionEntries(competitionId: number): Promise<CompetitionEntry[]> {
    return await db.select().from(competitionEntries)
      .where(eq(competitionEntries.competitionId, competitionId))
      .orderBy(competitionEntries.score, 'desc');
  }

  async getCompetitionEntry(competitionId: number, coupleId: number): Promise<CompetitionEntry | undefined> {
    const [entry] = await db.select().from(competitionEntries)
      .where(
        sql`${competitionEntries.competitionId} = ${competitionId} AND ${competitionEntries.coupleId} = ${coupleId}`
      );
    return entry;
  }

  async createCompetitionEntry(entry: InsertCompetitionEntry): Promise<CompetitionEntry> {
    // Increment the participant count for the competition
    await db.update(competitions)
      .set({ 
        participantCount: sql`${competitions.participantCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(competitions.id, entry.competitionId));
    
    const [newEntry] = await db.insert(competitionEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateCompetitionEntryScore(id: number, score: number): Promise<CompetitionEntry | undefined> {
    const [updatedEntry] = await db.update(competitionEntries)
      .set({ 
        score,
        updatedAt: new Date()
      })
      .where(eq(competitionEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async updateCompetitionEntryRank(id: number, rank: number): Promise<CompetitionEntry | undefined> {
    const [updatedEntry] = await db.update(competitionEntries)
      .set({ 
        rank,
        updatedAt: new Date()
      })
      .where(eq(competitionEntries.id, id))
      .returning();
    return updatedEntry;
  }

  // Couple Rewards Methods
  async getCoupleRewards(coupleId: number): Promise<CoupleReward[]> {
    return await db.select().from(coupleRewards)
      .where(eq(coupleRewards.coupleId, coupleId))
      .orderBy(desc(coupleRewards.awardedAt));
  }

  async getCoupleReward(id: number): Promise<CoupleReward | undefined> {
    const [reward] = await db.select().from(coupleRewards).where(eq(coupleRewards.id, id));
    return reward;
  }

  async createCoupleReward(coupleReward: InsertCoupleReward): Promise<CoupleReward> {
    // Decrement the reward quantity
    await db.update(rewards)
      .set({ 
        quantity: sql`${rewards.quantity} - 1`,
        updatedAt: new Date()
      })
      .where(eq(rewards.id, coupleReward.rewardId));
    
    const [newCoupleReward] = await db.insert(coupleRewards)
      .values(coupleReward)
      .returning();
    return newCoupleReward;
  }

  async updateCoupleRewardStatus(id: number, status: string): Promise<CoupleReward | undefined> {
    let updates: any = { status };
    
    // Update appropriate timestamp based on status
    if (status === 'claimed') {
      updates.claimedAt = new Date();
    } else if (status === 'shipped') {
      updates.shippedAt = new Date();
    } else if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }
    
    const [updatedReward] = await db.update(coupleRewards)
      .set(updates)
      .where(eq(coupleRewards.id, id))
      .returning();
    return updatedReward;
  }

  async updateCoupleRewardShipping(id: number, trackingNumber: string, shippingAddress: any): Promise<CoupleReward | undefined> {
    const [updatedReward] = await db.update(coupleRewards)
      .set({
        trackingNumber,
        shippingAddress,
        status: 'shipped',
        shippedAt: new Date()
      })
      .where(eq(coupleRewards.id, id))
      .returning();
    return updatedReward;
  }
}