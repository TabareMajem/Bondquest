import { 
  users, couples, quizzes, questions, quizSessions, dailyCheckIns, achievements, activities, chats,
  subscriptionTiers, userSubscriptions, rewards, competitions, competitionRewards, competitionEntries, coupleRewards,
  userProfiles, profileQuestions, userResponses, partnerQuizQuestions, partnerQuizResponses,
  bondAssessments, bondInsights, bondQuestions, userPreferences,
  affiliatePartners, affiliateCoupons, affiliateReferrals, affiliateTransactions, affiliatePayments,
  type User, type InsertUser, type Couple, type InsertCouple, type Quiz, type InsertQuiz, 
  type Question, type InsertQuestion, type QuizSession, type InsertQuizSession, 
  type DailyCheckIn, type InsertDailyCheckIn, type Achievement, type InsertAchievement,
  type Activity, type InsertActivity, type Chat, type InsertChat,
  type SubscriptionTier, type InsertSubscriptionTier, type UserSubscription, type InsertUserSubscription,
  type Reward, type InsertReward, type Competition, type InsertCompetition,
  type CompetitionReward, type InsertCompetitionReward, type CompetitionEntry, type InsertCompetitionEntry,
  type CoupleReward, type InsertCoupleReward,
  type UserProfile, type InsertUserProfile, type ProfileQuestion, type InsertProfileQuestion,
  type UserResponse, type InsertUserResponse, type PartnerQuizQuestion, type InsertPartnerQuizQuestion,
  type PartnerQuizResponse, type InsertPartnerQuizResponse,
  type BondAssessment, type InsertBondAssessment, type BondInsight, type InsertBondInsight,
  type BondQuestion, type InsertBondQuestion, type UserPreferences, type InsertUserPreferences,
  type AffiliatePartner, type InsertAffiliatePartner, type AffiliateCoupon, type InsertAffiliateCoupon,
  type AffiliateReferral, type InsertAffiliateReferral, type AffiliateTransaction, type InsertAffiliateTransaction,
  type AffiliatePayment, type InsertAffiliatePayment
} from "@shared/schema";
import { bondDimensions } from "@shared/bondDimensions";
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
  
  // Subscription Methods
  getSubscriptionTiers(): Promise<SubscriptionTier[]>;
  getSubscriptionTier(id: number): Promise<SubscriptionTier | undefined>;
  createSubscriptionTier(tier: InsertSubscriptionTier): Promise<SubscriptionTier>;
  updateSubscriptionTier(id: number, updates: Partial<SubscriptionTier>): Promise<SubscriptionTier | undefined>;
  
  getUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  cancelUserSubscription(id: number): Promise<UserSubscription | undefined>;
  
  // Reward Methods
  getRewards(limit?: number, activeOnly?: boolean): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined>;
  
  // Competition Methods
  getCompetitions(status?: string, limit?: number): Promise<Competition[]>;
  getCompetition(id: number): Promise<Competition | undefined>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: number, updates: Partial<Competition>): Promise<Competition | undefined>;
  
  // Link competition with rewards
  addRewardToCompetition(competitionReward: InsertCompetitionReward): Promise<CompetitionReward>;
  getCompetitionRewards(competitionId: number): Promise<CompetitionReward[]>;
  
  // Competition Entry Methods
  getCompetitionEntries(competitionId: number): Promise<CompetitionEntry[]>;
  getCompetitionEntry(competitionId: number, coupleId: number): Promise<CompetitionEntry | undefined>;
  createCompetitionEntry(entry: InsertCompetitionEntry): Promise<CompetitionEntry>;
  updateCompetitionEntryScore(id: number, score: number): Promise<CompetitionEntry | undefined>;
  updateCompetitionEntryRank(id: number, rank: number): Promise<CompetitionEntry | undefined>;
  
  // Couple Rewards Methods
  getCoupleRewards(coupleId: number): Promise<CoupleReward[]>;
  getCoupleReward(id: number): Promise<CoupleReward | undefined>;
  createCoupleReward(coupleReward: InsertCoupleReward): Promise<CoupleReward>;
  updateCoupleRewardStatus(id: number, status: string): Promise<CoupleReward | undefined>;
  updateCoupleRewardShipping(id: number, trackingNumber: string, shippingAddress: any): Promise<CoupleReward | undefined>;
  
  // User Profile Methods
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
  
  // Profile Questions Methods
  getProfileQuestions(category?: string): Promise<ProfileQuestion[]>;
  getProfileQuestion(id: number): Promise<ProfileQuestion | undefined>;
  createProfileQuestion(question: InsertProfileQuestion): Promise<ProfileQuestion>;
  
  // User Response Methods
  getUserResponses(userId: number): Promise<UserResponse[]>;
  getUserResponsesByQuestion(userId: number, questionId: number): Promise<UserResponse | undefined>;
  createUserResponse(response: InsertUserResponse): Promise<UserResponse>;
  
  // Partner Quiz Methods
  getPartnerQuizQuestions(quizSessionId: number): Promise<PartnerQuizQuestion[]>;
  getPartnerQuizQuestion(id: number): Promise<PartnerQuizQuestion | undefined>;
  createPartnerQuizQuestion(question: InsertPartnerQuizQuestion): Promise<PartnerQuizQuestion>;
  getPartnerQuizResponses(questionId: number): Promise<PartnerQuizResponse[]>;
  createPartnerQuizResponse(response: InsertPartnerQuizResponse): Promise<PartnerQuizResponse>;
  
  // User Preferences Methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Bond Dimension Assessment Methods
  getBondQuestions(): Promise<BondQuestion[]>;
  getBondQuestionsByDimension(dimensionId: string): Promise<BondQuestion[]>;
  getBondQuestion(id: number): Promise<BondQuestion | undefined>;
  createBondQuestion(question: InsertBondQuestion): Promise<BondQuestion>;
  
  getBondAssessmentsByCouple(coupleId: number): Promise<BondAssessment[]>;
  getBondAssessment(id: number): Promise<BondAssessment | undefined>;
  createBondAssessment(assessment: InsertBondAssessment): Promise<BondAssessment>;
  
  getBondInsightsByCouple(coupleId: number): Promise<BondInsight[]>;
  getBondInsight(id: number): Promise<BondInsight | undefined>;
  createBondInsight(insight: InsertBondInsight): Promise<BondInsight>;
  updateBondInsightViewed(id: number, viewed: boolean): Promise<BondInsight | undefined>;
  updateBondInsightCompleted(id: number, completed: boolean): Promise<BondInsight | undefined>;
  
  // Affiliate Partner Methods
  getAffiliatePartners(status?: string): Promise<AffiliatePartner[]>;
  getAffiliatePartner(id: number): Promise<AffiliatePartner | undefined>;
  getAffiliatePartnerByEmail(email: string): Promise<AffiliatePartner | undefined>;
  createAffiliatePartner(partner: InsertAffiliatePartner): Promise<AffiliatePartner>;
  updateAffiliatePartner(id: number, updates: Partial<AffiliatePartner>): Promise<AffiliatePartner | undefined>;
  approveAffiliatePartner(id: number, approvedBy: number): Promise<AffiliatePartner | undefined>;
  
  // Affiliate Coupon Methods
  getAffiliateCoupons(partnerId?: number, isActive?: boolean): Promise<AffiliateCoupon[]>;
  getAffiliateCoupon(id: number): Promise<AffiliateCoupon | undefined>;
  getAffiliateCouponByCode(code: string): Promise<AffiliateCoupon | undefined>;
  createAffiliateCoupon(coupon: InsertAffiliateCoupon): Promise<AffiliateCoupon>;
  updateAffiliateCoupon(id: number, updates: Partial<AffiliateCoupon>): Promise<AffiliateCoupon | undefined>;
  incrementCouponUses(id: number): Promise<AffiliateCoupon | undefined>;
  
  // Affiliate Referral Methods
  getAffiliateReferrals(partnerId: number): Promise<AffiliateReferral[]>;
  getAffiliateReferral(id: number): Promise<AffiliateReferral | undefined>;
  getAffiliateReferralByCode(code: string): Promise<AffiliateReferral | undefined>;
  createAffiliateReferral(referral: InsertAffiliateReferral): Promise<AffiliateReferral>;
  updateAffiliateReferral(id: number, updates: Partial<AffiliateReferral>): Promise<AffiliateReferral | undefined>;
  incrementReferralClick(id: number): Promise<AffiliateReferral | undefined>;
  incrementReferralConversion(id: number): Promise<AffiliateReferral | undefined>;
  
  // Affiliate Transaction Methods
  getAffiliateTransactions(partnerId: number): Promise<AffiliateTransaction[]>;
  getAffiliateTransaction(id: number): Promise<AffiliateTransaction | undefined>;
  getAffiliateTransactionsByUser(userId: number): Promise<AffiliateTransaction[]>;
  createAffiliateTransaction(transaction: InsertAffiliateTransaction): Promise<AffiliateTransaction>;
  updateAffiliateTransactionStatus(id: number, status: string): Promise<AffiliateTransaction | undefined>;
  
  // Affiliate Payment Methods
  getAffiliatePayments(partnerId: number): Promise<AffiliatePayment[]>;
  getAffiliatePayment(id: number): Promise<AffiliatePayment | undefined>;
  createAffiliatePayment(payment: InsertAffiliatePayment): Promise<AffiliatePayment>;
  updateAffiliatePaymentStatus(id: number, status: string, reference?: string): Promise<AffiliatePayment | undefined>;
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
  private userProfiles: Map<number, UserProfile>;
  private profileQuestions: Map<number, ProfileQuestion>;
  private userResponses: Map<number, UserResponse>;
  private partnerQuizQuestions: Map<number, PartnerQuizQuestion>;
  private partnerQuizResponses: Map<number, PartnerQuizResponse>;
  private subscriptionTiers: Map<number, SubscriptionTier>;
  private userSubscriptions: Map<number, UserSubscription>;
  private rewards: Map<number, Reward>;
  private competitions: Map<number, Competition>;
  private competitionRewards: Map<number, CompetitionReward>;
  private competitionEntries: Map<number, CompetitionEntry>;
  private coupleRewards: Map<number, CoupleReward>;
  private bondQuestions: Map<number, BondQuestion>;
  private bondAssessments: Map<number, BondAssessment>;
  private bondInsights: Map<number, BondInsight>;
  private userPreferences: Map<number, UserPreferences>;
  private affiliatePartners: Map<number, AffiliatePartner>;
  private affiliateCoupons: Map<number, AffiliateCoupon>;
  private affiliateReferrals: Map<number, AffiliateReferral>;
  private affiliateTransactions: Map<number, AffiliateTransaction>;
  private affiliatePayments: Map<number, AffiliatePayment>;
  
  private userId: number = 1;
  private coupleId: number = 1;
  private quizId: number = 1;
  private questionId: number = 1;
  private sessionId: number = 1;
  private checkInId: number = 1;
  private achievementId: number = 1;
  private activityId: number = 1;
  private chatId: number = 1;
  private userProfileId: number = 1;
  private profileQuestionId: number = 1;
  private userResponseId: number = 1;
  private partnerQuizQuestionId: number = 1;
  private partnerQuizResponseId: number = 1;
  private subscriptionTierId: number = 1;
  private userSubscriptionId: number = 1;
  private rewardId: number = 1;
  private competitionId: number = 1;
  private competitionRewardId: number = 1;
  private competitionEntryId: number = 1;
  private coupleRewardId: number = 1;
  private bondQuestionId: number = 1;
  private bondAssessmentId: number = 1;
  private bondInsightId: number = 1;
  private userPreferencesId: number = 1;
  private affiliatePartnerId: number = 1;
  private affiliateCouponId: number = 1;
  private affiliateReferralId: number = 1;
  private affiliateTransactionId: number = 1;
  private affiliatePaymentId: number = 1;

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
    this.userProfiles = new Map();
    this.profileQuestions = new Map();
    this.userResponses = new Map();
    this.partnerQuizQuestions = new Map();
    this.partnerQuizResponses = new Map();
    this.subscriptionTiers = new Map();
    this.userSubscriptions = new Map();
    this.rewards = new Map();
    this.competitions = new Map();
    this.competitionRewards = new Map();
    this.competitionEntries = new Map();
    this.coupleRewards = new Map();
    this.bondQuestions = new Map();
    this.bondAssessments = new Map();
    this.bondInsights = new Map();
    this.userPreferences = new Map();
    this.affiliatePartners = new Map();
    this.affiliateCoupons = new Map();
    this.affiliateReferrals = new Map();
    this.affiliateTransactions = new Map();
    this.affiliatePayments = new Map();
    
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
    const newUser: User = { 
      ...user, 
      id, 
      partnerCode, 
      createdAt: new Date(),
      avatar: user.avatar || null,
      loveLanguage: user.loveLanguage || null,
      relationshipStatus: user.relationshipStatus || null,
      anniversary: user.anniversary || null
    };
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
    const newCouple: Couple = { 
      ...couple, 
      id, 
      createdAt: new Date(),
      bondStrength: couple.bondStrength || null,
      level: couple.level || 1,
      xp: couple.xp || 0
    };
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
    const newQuiz: Quiz = { 
      ...quiz, 
      id,
      image: quiz.image || null 
    };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }

  // Question Methods
  async getQuestions(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(question => question.quizId === quizId);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const newQuestion: Question = { 
      ...question, 
      id,
      options: question.options || null
    };
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
      completedAt: null,
      user1Answers: session.user1Answers || null,
      user2Answers: session.user2Answers || null,
      user1Completed: session.user1Completed || null,
      user2Completed: session.user2Completed || null,
      user1Score: session.user1Score || null,
      user2Score: session.user2Score || null,
      user1CompletedAt: session.user1CompletedAt || null,
      user2CompletedAt: session.user2CompletedAt || null
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
    const newCheckIn: DailyCheckIn = { 
      ...checkIn, 
      id, 
      date: new Date(),
      note: checkIn.note || null
    };
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
    const now = new Date();
    const newAchievement: Achievement = { 
      ...achievement, 
      id, 
      createdAt: now,
      unlockedAt: now,
      level: achievement.level || null,
      points: achievement.points || null,
      badgeImageUrl: achievement.badgeImageUrl || null,
      progress: achievement.progress || null
    };
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
    const newActivity: Activity = { 
      ...activity, 
      id, 
      createdAt: new Date(),
      description: activity.description || null,
      points: activity.points || null
    };
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

  // User Preferences Methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values())
      .find(prefs => prefs.userId === userId);
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.userPreferencesId++;
    const now = new Date();
    const newPreferences: UserPreferences = { 
      ...preferences, 
      id, 
      createdAt: now, 
      updatedAt: now,
      dailyReminders: preferences.dailyReminders || null,
      partnerActivity: preferences.partnerActivity || null,
      competitionUpdates: preferences.competitionUpdates || null,
      appUpdates: preferences.appUpdates || null,
      sessionReminders: preferences.sessionReminders || null,
      newMessageSound: preferences.newMessageSound || null,
      achievementSound: preferences.achievementSound || null,
      fontSizePreference: preferences.fontSizePreference || null,
      colorMode: preferences.colorMode || null,
      notificationTime: preferences.notificationTime || null,
      pushNotificationsEnabled: preferences.pushNotificationsEnabled || null,
      emailNotificationsEnabled: preferences.emailNotificationsEnabled || null,
      language: preferences.language || null
    };
    this.userPreferences.set(id, newPreferences);
    return newPreferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const preferences = Array.from(this.userPreferences.values())
      .find(prefs => prefs.userId === userId);
    
    if (preferences) {
      const updatedPreferences = { 
        ...preferences, 
        ...updates, 
        updatedAt: new Date() 
      };
      this.userPreferences.set(preferences.id, updatedPreferences);
      return updatedPreferences;
    }
    
    return undefined;
  }

  // Bond Question Methods
  async getBondQuestions(): Promise<BondQuestion[]> {
    return Array.from(this.bondQuestions.values());
  }

  async getBondQuestionsByDimension(dimensionId: string): Promise<BondQuestion[]> {
    return Array.from(this.bondQuestions.values())
      .filter(question => question.dimensionId === dimensionId);
  }

  async getBondQuestion(id: number): Promise<BondQuestion | undefined> {
    return this.bondQuestions.get(id);
  }

  async createBondQuestion(question: InsertBondQuestion): Promise<BondQuestion> {
    const id = this.bondQuestionId++;
    const newQuestion: BondQuestion = { 
      ...question, 
      id,
      createdAt: new Date(),
      options: question.options || null,
      weight: question.weight || null
    };
    this.bondQuestions.set(id, newQuestion);
    return newQuestion;
  }

  // Bond Assessment Methods
  async getBondAssessmentsByCouple(coupleId: number): Promise<BondAssessment[]> {
    return Array.from(this.bondAssessments.values())
      .filter(assessment => assessment.coupleId === coupleId);
  }

  async getBondAssessment(id: number): Promise<BondAssessment | undefined> {
    return this.bondAssessments.get(id);
  }

  async createBondAssessment(assessment: InsertBondAssessment): Promise<BondAssessment> {
    const id = this.bondAssessmentId++;
    const now = new Date();
    const newAssessment: BondAssessment = { 
      ...assessment, 
      id, 
      createdAt: now,
      updatedAt: now,
      answeredAt: now,
      user1Score: assessment.user1Score || null,
      user2Score: assessment.user2Score || null
    };
    this.bondAssessments.set(id, newAssessment);

    // Update overall bond strength on the couple
    const assessments = await this.getBondAssessmentsByCouple(assessment.coupleId);
    if (assessments.length > 0) {
      const dimensions = bondDimensions.length;
      const completedDimensions = new Set(assessments.map(a => a.dimensionId)).size;
      
      // Only update bond strength if we have assessments for at least half of the dimensions
      if (completedDimensions >= dimensions / 2) {
        const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
        const avgScore = Math.round(totalScore / assessments.length);
        await this.updateCoupleBondStrength(assessment.coupleId, avgScore);
      }
    }

    return newAssessment;
  }

  // Bond Insight Methods
  async getBondInsightsByCouple(coupleId: number): Promise<BondInsight[]> {
    return Array.from(this.bondInsights.values())
      .filter(insight => insight.coupleId === coupleId)
      .sort((a, b) => {
        // Sort first by completion status, then by expiration date
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return a.expiresAt.getTime() - b.expiresAt.getTime();
      });
  }

  async getBondInsight(id: number): Promise<BondInsight | undefined> {
    return this.bondInsights.get(id);
  }

  async createBondInsight(insight: InsertBondInsight): Promise<BondInsight> {
    const id = this.bondInsightId++;
    const now = new Date();
    const expiresAt = insight.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days expiration
    
    // Convert actionItems to a proper string array if needed
    let actionItems = insight.actionItems;
    if (actionItems && !Array.isArray(actionItems)) {
      // Handle case when actionItems is passed as an object with numeric keys
      actionItems = Object.values(actionItems).map(item => String(item));
    }
    
    const newInsight: BondInsight = { 
      ...insight, 
      id, 
      createdAt: now,
      expiresAt: expiresAt,
      completed: insight.completed !== undefined ? insight.completed : false,
      viewed: insight.viewed !== undefined ? insight.viewed : false,
      actionItems: actionItems as string[] || []
    };
    this.bondInsights.set(id, newInsight);
    return newInsight;
  }

  async updateBondInsightViewed(id: number, viewed: boolean): Promise<BondInsight | undefined> {
    const insight = this.bondInsights.get(id);
    if (insight) {
      const updatedInsight = { ...insight, viewed };
      this.bondInsights.set(id, updatedInsight);
      return updatedInsight;
    }
    return undefined;
  }

  async updateBondInsightCompleted(id: number, completed: boolean): Promise<BondInsight | undefined> {
    const insight = this.bondInsights.get(id);
    if (insight) {
      const updatedInsight = { ...insight, completed };
      this.bondInsights.set(id, updatedInsight);
      return updatedInsight;
    }
    return undefined;
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

    // Sample Bond Questions for each dimension
    const bondQuestions: BondQuestion[] = [];

    // Communication dimension questions
    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'communication',
      type: 'likert',
      text: 'We can discuss difficult topics without arguing',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'communication',
      type: 'likert',
      text: 'My partner listens attentively when I speak',
      weight: 1,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'communication',
      type: 'likert',
      text: 'We resolve conflicts through open conversation',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    // Trust dimension questions
    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'trust',
      type: 'likert',
      text: 'I trust my partner completely',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'trust',
      type: 'likert',
      text: 'My partner is reliable and keeps their promises',
      weight: 1,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'trust',
      type: 'likert',
      text: 'We are honest with each other even when it\'s difficult',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    // Intimacy dimension questions
    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'intimacy',
      type: 'likert',
      text: 'I feel emotionally connected to my partner',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'intimacy',
      type: 'likert',
      text: 'We are physically affectionate with each other',
      weight: 1,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'intimacy',
      type: 'multiple_choice',
      text: 'How often do you have meaningful intimate moments?',
      weight: 1,
      options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely'],
      createdAt: new Date()
    });

    // Support dimension questions
    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'support',
      type: 'likert',
      text: 'My partner encourages me to pursue my goals',
      weight: 1,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'support',
      type: 'likert',
      text: 'We support each other through difficult times',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'support',
      type: 'text',
      text: 'Share a recent example of how your partner supported you',
      weight: 0,
      options: null,
      createdAt: new Date()
    });

    // Growth dimension questions
    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'growth',
      type: 'likert',
      text: 'We help each other become better people',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'growth',
      type: 'likert',
      text: 'Our relationship has grown stronger over time',
      weight: 1,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'growth',
      type: 'multiple_choice',
      text: 'How often do you try new activities together?',
      weight: 1,
      options: ['Weekly', 'Monthly', 'Every few months', 'Once a year', 'Rarely'],
      createdAt: new Date()
    });

    // Fun dimension questions
    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'fun',
      type: 'likert',
      text: 'We laugh and have fun together regularly',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'fun',
      type: 'likert',
      text: 'We make time for playful activities',
      weight: 1,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'fun',
      type: 'multiple_choice',
      text: 'What\'s your favorite way to have fun together?',
      weight: 0,
      options: ['Travel', 'Games', 'Outdoor activities', 'Watching shows', 'Dining out'],
      createdAt: new Date()
    });

    // Goals dimension questions
    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'goals',
      type: 'likert',
      text: 'We have shared goals and visions for our future',
      weight: 2,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'goals',
      type: 'likert',
      text: 'We regularly discuss our future plans together',
      weight: 1,
      options: null,
      createdAt: new Date()
    });

    bondQuestions.push({
      id: this.bondQuestionId++,
      dimensionId: 'goals',
      type: 'text',
      text: 'What\'s one goal you hope to achieve together in the next year?',
      weight: 0,
      options: null,
      createdAt: new Date()
    });

    // Add all bond questions to the map
    for (const question of bondQuestions) {
      this.bondQuestions.set(question.id, question);
    }
  }
  
  // Subscription Methods
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return Array.from(this.subscriptionTiers.values());
  }

  async getSubscriptionTier(id: number): Promise<SubscriptionTier | undefined> {
    return this.subscriptionTiers.get(id);
  }

  async createSubscriptionTier(tier: InsertSubscriptionTier): Promise<SubscriptionTier> {
    const id = this.subscriptionTierId++;
    const now = new Date();
    const newTier: SubscriptionTier = { 
      ...tier, 
      id, 
      createdAt: now,
      updatedAt: now,
      stripeProductId: null,
      stripePriceId: null,
      features: Array.isArray(tier.features) ? tier.features : null,
      active: tier.active || null
    };
    this.subscriptionTiers.set(id, newTier);
    return newTier;
  }

  async updateSubscriptionTier(id: number, updates: Partial<SubscriptionTier>): Promise<SubscriptionTier | undefined> {
    const tier = this.subscriptionTiers.get(id);
    if (tier) {
      const updatedTier = { ...tier, ...updates, updatedAt: new Date() };
      this.subscriptionTiers.set(id, updatedTier);
      return updatedTier;
    }
    return undefined;
  }
  
  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    return Array.from(this.userSubscriptions.values()).find(sub => sub.userId === userId);
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const id = this.userSubscriptionId++;
    const now = new Date();
    const newSubscription: UserSubscription = { 
      ...subscription, 
      id, 
      createdAt: now,
      updatedAt: now,
      cancelAtPeriodEnd: false,
      stripeCustomerId: subscription.stripeCustomerId || null,
      stripeSubscriptionId: subscription.stripeSubscriptionId || null,
      currentPeriodStart: subscription.currentPeriodStart || null,
      currentPeriodEnd: subscription.currentPeriodEnd || null
    };
    this.userSubscriptions.set(id, newSubscription);
    return newSubscription;
  }

  async updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    const subscription = this.userSubscriptions.get(id);
    if (subscription) {
      const updatedSubscription = { ...subscription, ...updates, updatedAt: new Date() };
      this.userSubscriptions.set(id, updatedSubscription);
      return updatedSubscription;
    }
    return undefined;
  }

  async cancelUserSubscription(id: number): Promise<UserSubscription | undefined> {
    const subscription = this.userSubscriptions.get(id);
    if (subscription) {
      const updatedSubscription = { 
        ...subscription, 
        status: 'canceled', 
        cancelAtPeriodEnd: true,
        updatedAt: new Date() 
      };
      this.userSubscriptions.set(id, updatedSubscription);
      return updatedSubscription;
    }
    return undefined;
  }
  
  // Reward Methods
  async getRewards(limit?: number, activeOnly: boolean = true): Promise<Reward[]> {
    let rewards = Array.from(this.rewards.values());
    
    if (activeOnly) {
      rewards = rewards.filter(reward => reward.active);
    }
    
    rewards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit && limit > 0) {
      rewards = rewards.slice(0, limit);
    }
    
    return rewards;
  }

  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.rewardId++;
    const now = new Date();
    const newReward: Reward = { 
      ...reward, 
      id, 
      createdAt: now,
      updatedAt: now,
      active: reward.active !== undefined ? reward.active : true,
      code: reward.code || null,
      imageUrl: reward.imageUrl || null,
      requiredTier: reward.requiredTier || null
    };
    this.rewards.set(id, newReward);
    return newReward;
  }

  async updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined> {
    const reward = this.rewards.get(id);
    if (reward) {
      const updatedReward = { ...reward, ...updates, updatedAt: new Date() };
      this.rewards.set(id, updatedReward);
      return updatedReward;
    }
    return undefined;
  }
  
  // Competition Methods
  async getCompetitions(status?: string, limit?: number): Promise<Competition[]> {
    let competitions = Array.from(this.competitions.values());
    
    if (status) {
      competitions = competitions.filter(comp => comp.status === status);
    }
    
    competitions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit && limit > 0) {
      competitions = competitions.slice(0, limit);
    }
    
    return competitions;
  }

  async getCompetition(id: number): Promise<Competition | undefined> {
    return this.competitions.get(id);
  }

  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    const id = this.competitionId++;
    const now = new Date();
    const newCompetition: Competition = { 
      ...competition, 
      id, 
      createdAt: now,
      updatedAt: now,
      imageUrl: competition.imageUrl || null,
      requiredTier: competition.requiredTier || null,
      maxParticipants: competition.maxParticipants || null,
      participantCount: 0
    };
    this.competitions.set(id, newCompetition);
    return newCompetition;
  }

  async updateCompetition(id: number, updates: Partial<Competition>): Promise<Competition | undefined> {
    const competition = this.competitions.get(id);
    if (competition) {
      const updatedCompetition = { ...competition, ...updates, updatedAt: new Date() };
      this.competitions.set(id, updatedCompetition);
      return updatedCompetition;
    }
    return undefined;
  }
  
  // Link competition with rewards
  async addRewardToCompetition(competitionReward: InsertCompetitionReward): Promise<CompetitionReward> {
    const id = this.competitionRewardId++;
    const now = new Date();
    const newCompetitionReward: CompetitionReward = { 
      ...competitionReward, 
      id, 
      createdAt: now
    };
    this.competitionRewards.set(id, newCompetitionReward);
    return newCompetitionReward;
  }

  async getCompetitionRewards(competitionId: number): Promise<CompetitionReward[]> {
    return Array.from(this.competitionRewards.values())
      .filter(cr => cr.competitionId === competitionId);
  }
  
  // Competition Entry Methods
  async getCompetitionEntries(competitionId: number): Promise<CompetitionEntry[]> {
    return Array.from(this.competitionEntries.values())
      .filter(entry => entry.competitionId === competitionId)
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }

  async getCompetitionEntry(competitionId: number, coupleId: number): Promise<CompetitionEntry | undefined> {
    return Array.from(this.competitionEntries.values())
      .find(entry => entry.competitionId === competitionId && entry.coupleId === coupleId);
  }

  async createCompetitionEntry(entry: InsertCompetitionEntry): Promise<CompetitionEntry> {
    const id = this.competitionEntryId++;
    const now = new Date();
    const newEntry: CompetitionEntry = { 
      ...entry, 
      id, 
      updatedAt: now,
      joinedAt: now,
      score: 0,
      rank: null
    };
    this.competitionEntries.set(id, newEntry);
    return newEntry;
  }

  async updateCompetitionEntryScore(id: number, score: number): Promise<CompetitionEntry | undefined> {
    const entry = this.competitionEntries.get(id);
    if (entry) {
      const updatedEntry = { ...entry, score, completed: true };
      this.competitionEntries.set(id, updatedEntry);
      return updatedEntry;
    }
    return undefined;
  }

  async updateCompetitionEntryRank(id: number, rank: number): Promise<CompetitionEntry | undefined> {
    const entry = this.competitionEntries.get(id);
    if (entry) {
      const updatedEntry = { ...entry, rank };
      this.competitionEntries.set(id, updatedEntry);
      return updatedEntry;
    }
    return undefined;
  }
  
  // Couple Rewards Methods
  async getCoupleRewards(coupleId: number): Promise<CoupleReward[]> {
    return Array.from(this.coupleRewards.values())
      .filter(reward => reward.coupleId === coupleId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCoupleReward(id: number): Promise<CoupleReward | undefined> {
    return this.coupleRewards.get(id);
  }

  async createCoupleReward(coupleReward: InsertCoupleReward): Promise<CoupleReward> {
    const id = this.coupleRewardId++;
    const now = new Date();
    const expiresAt = coupleReward.expiresAt || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days expiration
    const newCoupleReward: CoupleReward = { 
      ...coupleReward, 
      id, 
      status: 'pending',
      trackingNumber: null,
      shippingAddress: null,
      expiresAt: expiresAt,
      redeemedAt: null,
      confirmedAt: null,
      canceledAt: null
    };
    this.coupleRewards.set(id, newCoupleReward);
    return newCoupleReward;
  }

  async updateCoupleRewardStatus(id: number, status: string): Promise<CoupleReward | undefined> {
    const coupleReward = this.coupleRewards.get(id);
    if (coupleReward) {
      const updatedCoupleReward = { ...coupleReward, status };
      this.coupleRewards.set(id, updatedCoupleReward);
      return updatedCoupleReward;
    }
    return undefined;
  }

  async updateCoupleRewardShipping(id: number, trackingNumber: string, shippingAddress: any): Promise<CoupleReward | undefined> {
    const coupleReward = this.coupleRewards.get(id);
    if (coupleReward) {
      const updatedCoupleReward = { 
        ...coupleReward, 
        trackingNumber, 
        shippingAddress,
        status: 'shipped'
      };
      this.coupleRewards.set(id, updatedCoupleReward);
      return updatedCoupleReward;
    }
    return undefined;
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './DatabaseStorage';

// Use MemStorage for now to test bond dimensions functionality
// This will let us move forward without waiting for database migrations
export const storage = new MemStorage();
