import { 
  users, couples, quizzes, questions, quizSessions, dailyCheckIns, achievements, activities, chats,
  type User, type InsertUser, type Couple, type InsertCouple, type Quiz, type InsertQuiz, 
  type Question, type InsertQuestion, type QuizSession, type InsertQuizSession, 
  type DailyCheckIn, type InsertDailyCheckIn, type Achievement, type InsertAchievement,
  type Activity, type InsertActivity, type Chat, type InsertChat
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPartnerCode(partnerCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Couple Methods
  getCouple(id: number): Promise<Couple | undefined>;
  getCoupleByUserId(userId: number): Promise<Couple | undefined>;
  createCouple(couple: InsertCouple): Promise<Couple>;
  updateCoupleBondStrength(id: number, bondStrength: number): Promise<Couple | undefined>;
  updateCoupleXP(id: number, xp: number): Promise<Couple | undefined>;
  
  // Quiz Methods
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzes(): Promise<Quiz[]>;
  getQuizzesByCategory(category: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  
  // Question Methods
  getQuestions(quizId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Quiz Session Methods
  getQuizSession(id: number): Promise<QuizSession | undefined>;
  getQuizSessionsByCouple(coupleId: number): Promise<QuizSession[]>;
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined>;
  
  // Daily Check-In Methods
  getDailyCheckIns(userId: number): Promise<DailyCheckIn[]>;
  createDailyCheckIn(checkIn: InsertDailyCheckIn): Promise<DailyCheckIn>;
  
  // Achievement Methods
  getAchievements(coupleId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Activity Methods
  getActivitiesByCouple(coupleId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity & { description?: string }): Promise<Activity>;
  
  // Chat Methods
  getChatsByCouple(coupleId: number): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private couples: Map<number, Couple>;
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private quizSessions: Map<number, QuizSession>;
  private dailyCheckIns: Map<number, DailyCheckIn>;
  private achievements: Map<number, Achievement>;
  private activities: Map<number, Activity>;
  private chats: Map<number, Chat>;
  
  private userId: number = 1;
  private coupleId: number = 1;
  private quizId: number = 1;
  private questionId: number = 1;
  private sessionId: number = 1;
  private checkInId: number = 1;
  private achievementId: number = 1;
  private activityId: number = 1;
  private chatId: number = 1;

  constructor() {
    this.users = new Map();
    this.couples = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.quizSessions = new Map();
    this.dailyCheckIns = new Map();
    this.achievements = new Map();
    this.activities = new Map();
    this.chats = new Map();
    
    // Initialize with sample quizzes and questions
    this.initializeSampleData();
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByPartnerCode(partnerCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.partnerCode === partnerCode);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const partnerCode = nanoid(8);
    const newUser: User = { ...user, id, partnerCode, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  // Couple Methods
  async getCouple(id: number): Promise<Couple | undefined> {
    return this.couples.get(id);
  }

  async getCoupleByUserId(userId: number): Promise<Couple | undefined> {
    return Array.from(this.couples.values()).find(
      couple => couple.userId1 === userId || couple.userId2 === userId
    );
  }

  async createCouple(couple: InsertCouple): Promise<Couple> {
    const id = this.coupleId++;
    const newCouple: Couple = { ...couple, id, createdAt: new Date() };
    this.couples.set(id, newCouple);
    return newCouple;
  }

  async updateCoupleBondStrength(id: number, bondStrength: number): Promise<Couple | undefined> {
    const couple = this.couples.get(id);
    if (couple) {
      const updatedCouple = { ...couple, bondStrength };
      this.couples.set(id, updatedCouple);
      return updatedCouple;
    }
    return undefined;
  }

  async updateCoupleXP(id: number, xp: number): Promise<Couple | undefined> {
    const couple = this.couples.get(id);
    if (couple) {
      // Calculate level (1 level per 1000 XP)
      const newTotalXP = couple.xp + xp;
      const level = Math.floor(newTotalXP / 1000) + 1;
      const updatedCouple = { ...couple, xp: newTotalXP, level };
      this.couples.set(id, updatedCouple);
      return updatedCouple;
    }
    return undefined;
  }

  // Quiz Methods
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }

  async getQuizzesByCategory(category: string): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(quiz => quiz.category === category);
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizId++;
    const newQuiz: Quiz = { ...quiz, id };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }

  // Question Methods
  async getQuestions(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(question => question.quizId === quizId);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const newQuestion: Question = { ...question, id };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }

  // Quiz Session Methods
  async getQuizSession(id: number): Promise<QuizSession | undefined> {
    return this.quizSessions.get(id);
  }

  async getQuizSessionsByCouple(coupleId: number): Promise<QuizSession[]> {
    return Array.from(this.quizSessions.values())
      .filter(session => session.coupleId === coupleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createQuizSession(session: InsertQuizSession): Promise<QuizSession> {
    const id = this.sessionId++;
    const newSession: QuizSession = { 
      ...session, 
      id, 
      createdAt: new Date(),
      completedAt: null
    };
    this.quizSessions.set(id, newSession);
    return newSession;
  }

  async updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    const session = this.quizSessions.get(id);
    if (session) {
      const updatedSession = { ...session, ...updates };
      
      // If session is being marked as completed, set completedAt timestamp
      if (updates.completed && !session.completed) {
        updatedSession.completedAt = new Date();
      }
      
      this.quizSessions.set(id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }

  // Daily Check-In Methods
  async getDailyCheckIns(userId: number): Promise<DailyCheckIn[]> {
    return Array.from(this.dailyCheckIns.values())
      .filter(checkIn => checkIn.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createDailyCheckIn(checkIn: InsertDailyCheckIn): Promise<DailyCheckIn> {
    const id = this.checkInId++;
    const newCheckIn: DailyCheckIn = { ...checkIn, id, date: new Date() };
    this.dailyCheckIns.set(id, newCheckIn);
    return newCheckIn;
  }

  // Achievement Methods
  async getAchievements(coupleId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.coupleId === coupleId)
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const newAchievement: Achievement = { ...achievement, id, unlockedAt: new Date() };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  // Activity Methods
  async getActivitiesByCouple(coupleId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.coupleId === coupleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async createActivity(activity: InsertActivity & { description?: string }): Promise<Activity> {
    const id = this.activityId++;
    const newActivity: Activity = { ...activity, id, createdAt: new Date() };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Chat Methods
  async getChatsByCouple(coupleId: number): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .filter(chat => chat.coupleId === coupleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const id = this.chatId++;
    const newChat: Chat = { ...chat, id, createdAt: new Date() };
    this.chats.set(id, newChat);
    return newChat;
  }

  // Initialize sample data
  private initializeSampleData() {
    // Sample Quizzes
    const triviaQuiz: Quiz = {
      id: this.quizId++,
      title: "Trivia Showdown",
      description: "Face off against another couple",
      type: "sync",
      category: "couple_vs_couple",
      duration: 5,
      points: 20,
      image: "game-controller"
    };
    this.quizzes.set(triviaQuiz.id, triviaQuiz);

    const knowEachOtherQuiz: Quiz = {
      id: this.quizId++,
      title: "How Well Do You Know Each Other?",
      description: "Answer questions about your partner",
      type: "sync",
      category: "partner_vs_partner",
      duration: 10,
      points: 30,
      image: "heart-question"
    };
    this.quizzes.set(knowEachOtherQuiz.id, knowEachOtherQuiz);

    const relationshipRemixQuiz: Quiz = {
      id: this.quizId++,
      title: "Relationship Remix",
      description: "Rediscover moments from your past",
      type: "async",
      category: "memory_lane",
      duration: 5,
      points: 25,
      image: "music-note"
    };
    this.quizzes.set(relationshipRemixQuiz.id, relationshipRemixQuiz);

    const morningRoutinesQuiz: Quiz = {
      id: this.quizId++,
      title: "Morning Routines",
      description: "Discuss your daily habits and rituals",
      type: "sync",
      category: "daily_habits",
      duration: 5,
      points: 20,
      image: "coffee-cup"
    };
    this.quizzes.set(morningRoutinesQuiz.id, morningRoutinesQuiz);

    // Sample Questions for "How Well Do You Know Each Other?" quiz
    const questions = [
      {
        id: this.questionId++,
        quizId: knowEachOtherQuiz.id,
        text: "What's your partner's biggest fear?",
        options: ["Heights", "Public speaking", "Spiders", "Being alone"]
      },
      {
        id: this.questionId++,
        quizId: knowEachOtherQuiz.id,
        text: "What's your partner's favorite meal?",
        options: ["Sushi", "Pizza", "Steak", "Pasta"]
      },
      {
        id: this.questionId++,
        quizId: knowEachOtherQuiz.id,
        text: "Where would your partner most like to travel next?",
        options: ["Japan", "Italy", "Australia", "Iceland"]
      },
      {
        id: this.questionId++,
        quizId: knowEachOtherQuiz.id,
        text: "What's your partner's dream job?",
        options: ["Doctor", "Artist", "Tech Entrepreneur", "Travel Blogger"]
      },
      {
        id: this.questionId++,
        quizId: knowEachOtherQuiz.id,
        text: "How does your partner prefer to relax after a stressful day?",
        options: ["Watch a movie", "Take a walk", "Read a book", "Take a bath"]
      }
    ];

    for (const question of questions) {
      this.questions.set(question.id, question);
    }
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './DatabaseStorage';

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
