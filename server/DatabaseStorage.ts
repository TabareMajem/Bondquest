import { db } from './db';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { IStorage } from './storage';
import {
  users, couples, quizzes, questions, quizSessions, dailyCheckIns, achievements, activities, chats,
  type User, type InsertUser, type Couple, type InsertCouple, type Quiz, type InsertQuiz,
  type Question, type InsertQuestion, type QuizSession, type InsertQuizSession,
  type DailyCheckIn, type InsertDailyCheckIn, type Achievement, type InsertAchievement,
  type Activity, type InsertActivity, type Chat, type InsertChat
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
}