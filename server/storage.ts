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
  type AffiliatePayment, type InsertAffiliatePayment,
  type ConversationSession, type InsertConversationSession,
  type ConversationMessage, type InsertConversationMessage,
  type VoiceInteraction, type InsertVoiceInteraction,
  type ProfileInsight, type InsertProfileInsight,
  type RelationshipContext, type InsertRelationshipContext
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
  
  // Conversation Session Methods
  getConversationSessions(userId: number): Promise<ConversationSession[]>;
  getConversationSession(id: number): Promise<ConversationSession | undefined>;
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  updateConversationSession(id: number, updates: Partial<ConversationSession>): Promise<ConversationSession | undefined>;
  
  // Conversation Message Methods
  getConversationMessages(sessionId: number): Promise<ConversationMessage[]>;
  createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage>;
  
  // Voice Interaction Methods
  getVoiceInteractions(sessionId: number): Promise<VoiceInteraction[]>;
  createVoiceInteraction(interaction: InsertVoiceInteraction): Promise<VoiceInteraction>;
  
  // Profile Insight Methods
  getProfileInsights(userId: number): Promise<ProfileInsight[]>;
  createProfileInsight(insight: InsertProfileInsight): Promise<ProfileInsight>;
  
  // Relationship Context Methods
  getRelationshipContexts(coupleId: number): Promise<RelationshipContext[]>;
  createRelationshipContext(context: InsertRelationshipContext): Promise<RelationshipContext>;
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
  private conversationSessions: Map<number, ConversationSession>;
  private conversationMessages: Map<number, ConversationMessage>;
  private voiceInteractions: Map<number, VoiceInteraction>;
  private profileInsights: Map<number, ProfileInsight>;
  private relationshipContexts: Map<number, RelationshipContext>;
  
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
  private conversationSessionId: number = 1;
  private conversationMessageId: number = 1;
  private voiceInteractionId: number = 1;
  private profileInsightId: number = 1;
  private relationshipContextId: number = 1;

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
    this.conversationSessions = new Map();
    this.conversationMessages = new Map();
    this.voiceInteractions = new Map();
    this.profileInsights = new Map();
    this.relationshipContexts = new Map();
    
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
    const newUser: User = {
      id: this.userId++,
      username: user.username,
      password: user.password || null,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar || null,
      loveLanguage: user.loveLanguage || null,
      relationshipStatus: user.relationshipStatus || null,
      anniversary: user.anniversary || null,
      createdAt: new Date(),
      partnerCode: user.partnerCode,
      googleId: user.googleId || null,
      instagramId: user.instagramId || null,
      lastLogin: user.lastLogin || null,
      profilePictureUrl: user.profilePictureUrl || null,
      isAdmin: user.isAdmin || false,
    };
    this.users.set(newUser.id, newUser);
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

  // User Profile Methods
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(profile => profile.userId === userId);
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const newProfile: UserProfile = {
      id: this.userProfileId++,
      userId: profile.userId,
      favoriteColors: profile.favoriteColors || null,
      favoriteFood: profile.favoriteFood || null,
      favoriteMovies: profile.favoriteMovies || null,
      favoriteSongs: profile.favoriteSongs || null,
      hobbies: profile.hobbies || null,
      dreamVacation: profile.dreamVacation || null,
      biggestFear: profile.biggestFear || null,
      petPeeves: profile.petPeeves || null,
      childhoodMemories: profile.childhoodMemories || null,
      loveLanguage: profile.loveLanguage || null,
      communicationStyle: profile.communicationStyle || null,
      weekendPreference: profile.weekendPreference || null,
      stressRelievers: profile.stressRelievers || null,
      lifeGoals: profile.lifeGoals || null,
      lastUpdated: new Date(),
      metadata: profile.metadata || null,
    };
    this.userProfiles.set(newProfile.id, newProfile);
    return newProfile;
  }

  async updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const existingProfile = Array.from(this.userProfiles.values()).find(profile => profile.userId === userId);
    if (!existingProfile) return undefined;

    const updatedProfile = { ...existingProfile, ...updates, lastUpdated: new Date() };
    this.userProfiles.set(existingProfile.id, updatedProfile);
    return updatedProfile;
  }

  // Profile Questions Methods
  async getProfileQuestions(category?: string): Promise<ProfileQuestion[]> {
    const questions = Array.from(this.profileQuestions.values());
    return category ? questions.filter(q => q.category === category) : questions;
  }

  async getProfileQuestion(id: number): Promise<ProfileQuestion | undefined> {
    return this.profileQuestions.get(id);
  }

  async createProfileQuestion(question: InsertProfileQuestion): Promise<ProfileQuestion> {
    const newQuestion: ProfileQuestion = {
      id: this.profileQuestionId++,
      category: question.category,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options || null,
      required: question.required || false,
      order: question.order || 0,
      active: question.active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.profileQuestions.set(newQuestion.id, newQuestion);
    return newQuestion;
  }

  // User Response Methods
  async getUserResponses(userId: number): Promise<UserResponse[]> {
    return Array.from(this.userResponses.values()).filter(response => response.userId === userId);
  }

  async getUserResponsesByQuestion(userId: number, questionId: number): Promise<UserResponse | undefined> {
    return Array.from(this.userResponses.values()).find(response => 
      response.userId === userId && response.questionId === questionId
    );
  }

  async createUserResponse(response: InsertUserResponse): Promise<UserResponse> {
    const newResponse: UserResponse = {
      id: this.userResponseId++,
      userId: response.userId,
      questionId: response.questionId,
      response: response.response,
      additionalContext: response.additionalContext || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userResponses.set(newResponse.id, newResponse);
    return newResponse;
  }

  // Partner Quiz Methods
  async getPartnerQuizQuestions(quizSessionId: number): Promise<PartnerQuizQuestion[]> {
    return Array.from(this.partnerQuizQuestions.values()).filter(q => q.quizSessionId === quizSessionId);
  }

  async getPartnerQuizQuestion(id: number): Promise<PartnerQuizQuestion | undefined> {
    return this.partnerQuizQuestions.get(id);
  }

  async createPartnerQuizQuestion(question: InsertPartnerQuizQuestion): Promise<PartnerQuizQuestion> {
    const newQuestion: PartnerQuizQuestion = {
      id: this.partnerQuizQuestionId++,
      quizSessionId: question.quizSessionId,
      authorUserId: question.authorUserId,
      targetUserId: question.targetUserId,
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      options: question.options,
      difficulty: question.difficulty || "medium",
      createdAt: new Date(),
    };
    this.partnerQuizQuestions.set(newQuestion.id, newQuestion);
    return newQuestion;
  }

  async getPartnerQuizResponses(questionId: number): Promise<PartnerQuizResponse[]> {
    return Array.from(this.partnerQuizResponses.values()).filter(r => r.questionId === questionId);
  }

  async createPartnerQuizResponse(response: InsertPartnerQuizResponse): Promise<PartnerQuizResponse> {
    const newResponse: PartnerQuizResponse = {
      id: this.partnerQuizResponseId++,
      questionId: response.questionId,
      userId: response.userId,
      selectedAnswer: response.selectedAnswer,
      isCorrect: response.isCorrect || false,
      timeSpent: response.timeSpent || null,
      createdAt: new Date(),
    };
    this.partnerQuizResponses.set(newResponse.id, newResponse);
    return newResponse;
  }

  // User Preferences Methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(prefs => prefs.userId === userId);
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const newPreferences: UserPreferences = {
      id: this.userPreferencesId++,
      userId: preferences.userId,
      dailyReminders: preferences.dailyReminders || true,
      partnerActivity: preferences.partnerActivity || true,
      competitionUpdates: preferences.competitionUpdates || true,
      appUpdates: preferences.appUpdates || true,
      publicProfile: preferences.publicProfile || false,
      activityVisibility: preferences.activityVisibility || true,
      dataCollection: preferences.dataCollection || true,
      marketingEmails: preferences.marketingEmails || false,
      preferredAssistant: preferences.preferredAssistant || "casanova",
      proactiveAiSuggestions: preferences.proactiveAiSuggestions || true,
      personalizedInsights: preferences.personalizedInsights || true,
      contentCustomization: preferences.contentCustomization || true,
      darkMode: preferences.darkMode || false,
      accentColor: preferences.accentColor || "purple",
      language: preferences.language || "en-GB",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userPreferences.set(newPreferences.id, newPreferences);
    return newPreferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const preferences = Array.from(this.userPreferences.values()).find(prefs => prefs.userId === userId);
    if (!preferences) return undefined;

    const updatedPreferences = { ...preferences, ...updates, updatedAt: new Date() };
    this.userPreferences.set(preferences.id, updatedPreferences);
    return updatedPreferences;
  }

  // Bond Question Methods
  async getBondQuestions(): Promise<BondQuestion[]> {
    return Array.from(this.bondQuestions.values());
  }

  async getBondQuestionsByDimension(dimensionId: string): Promise<BondQuestion[]> {
    return Array.from(this.bondQuestions.values()).filter(question => question.dimensionId === dimensionId);
  }

  async getBondQuestion(id: number): Promise<BondQuestion | undefined> {
    return this.bondQuestions.get(id);
  }

  async createBondQuestion(question: InsertBondQuestion): Promise<BondQuestion> {
    const newQuestion: BondQuestion = {
      id: this.bondQuestionId++,
      dimensionId: question.dimensionId,
      type: question.type,
      text: question.text,
      options: Array.isArray(question.options) ? question.options : null,
      weight: question.weight || null,
      createdAt: new Date(),
    };
    this.bondQuestions.set(newQuestion.id, newQuestion);
    return newQuestion;
  }

  // Bond Assessment Methods
  async getBondAssessmentsByCouple(coupleId: number): Promise<BondAssessment[]> {
    return Array.from(this.bondAssessments.values()).filter(assessment => assessment.coupleId === coupleId);
  }

  async getBondAssessment(id: number): Promise<BondAssessment | undefined> {
    return this.bondAssessments.get(id);
  }

  async createBondAssessment(assessment: InsertBondAssessment): Promise<BondAssessment> {
    const newAssessment: BondAssessment = {
      id: this.bondAssessmentId++,
      coupleId: assessment.coupleId,
      dimensionId: assessment.dimensionId,
      score: assessment.score,
      user1Score: assessment.user1Score || null,
      user2Score: assessment.user2Score || null,
      answeredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bondAssessments.set(newAssessment.id, newAssessment);
    return newAssessment;
  }

  // Bond Insight Methods
  async getBondInsightsByCouple(coupleId: number): Promise<BondInsight[]> {
    return Array.from(this.bondInsights.values())
      .filter(insight => insight.coupleId === coupleId)
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        if (a.expiresAt && b.expiresAt) {
          return a.expiresAt.getTime() - b.expiresAt.getTime();
        }
        return 0;
      });
  }

  async getBondInsight(id: number): Promise<BondInsight | undefined> {
    return this.bondInsights.get(id);
  }

  async createBondInsight(insight: InsertBondInsight): Promise<BondInsight> {
    const now = new Date();
    const expiresAt = insight.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const newInsight: BondInsight = {
      id: this.bondInsightId++,
      title: insight.title,
      coupleId: insight.coupleId,
      dimensionId: insight.dimensionId,
      content: insight.content,
      actionItems: Array.isArray(insight.actionItems) ? insight.actionItems : [],
      targetScoreRange: insight.targetScoreRange,
      difficulty: insight.difficulty,
      completed: insight.completed || false,
      expiresAt: expiresAt,
      viewed: insight.viewed || false,
      createdAt: now,
    };
    this.bondInsights.set(newInsight.id, newInsight);
    return newInsight;
  }

  async updateBondInsightViewed(id: number, viewed: boolean): Promise<BondInsight | undefined> {
    const insight = this.bondInsights.get(id);
    if (!insight) return undefined;

    const updatedInsight = { ...insight, viewed };
    this.bondInsights.set(id, updatedInsight);
    return updatedInsight;
  }

  async updateBondInsightCompleted(id: number, completed: boolean): Promise<BondInsight | undefined> {
    const insight = this.bondInsights.get(id);
    if (!insight) return undefined;

    const updatedInsight = { ...insight, completed };
    this.bondInsights.set(id, updatedInsight);
    return updatedInsight;
  }

  // Conversation Session Methods
  async getConversationSessions(userId: number): Promise<ConversationSession[]> {
    return Array.from(this.conversationSessions.values()).filter(session => session.userId === userId);
  }

  async getConversationSession(id: number): Promise<ConversationSession | undefined> {
    return this.conversationSessions.get(id);
  }

  async createConversationSession(session: InsertConversationSession): Promise<ConversationSession> {
    const newSession: ConversationSession = {
      id: this.conversationSessionId++,
      userId: session.userId,
      sessionType: session.sessionType,
      status: session.status,
      startedAt: new Date(),
      completedAt: session.completedAt || null,
      metadata: session.metadata || null,
    };
    this.conversationSessions.set(newSession.id, newSession);
    return newSession;
  }

  async updateConversationSession(id: number, updates: Partial<ConversationSession>): Promise<ConversationSession | undefined> {
    const session = this.conversationSessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.conversationSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Conversation Message Methods
  async getConversationMessages(sessionId: number): Promise<ConversationMessage[]> {
    return Array.from(this.conversationMessages.values()).filter(msg => msg.sessionId === sessionId);
  }

  async createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage> {
    const newMessage: ConversationMessage = {
      id: this.conversationMessageId++,
      sessionId: message.sessionId,
      sender: message.sender,
      message: message.message,
      timestamp: new Date(),
      messageType: message.messageType || "text",
      metadata: message.metadata || null,
      contentTags: Array.isArray(message.contentTags) ? message.contentTags : null,
      extractedInsights: Array.isArray(message.extractedInsights) ? message.extractedInsights : null,
    };
    this.conversationMessages.set(newMessage.id, newMessage);
    return newMessage;
  }

  // Voice Interaction Methods
  async getVoiceInteractions(sessionId: number): Promise<VoiceInteraction[]> {
    return Array.from(this.voiceInteractions.values()).filter(interaction => interaction.sessionId === sessionId);
  }

  async createVoiceInteraction(interaction: InsertVoiceInteraction): Promise<VoiceInteraction> {
    const newInteraction: VoiceInteraction = {
      id: this.voiceInteractionId++,
      sessionId: interaction.sessionId,
      audioUrl: interaction.audioUrl,
      transcription: interaction.transcription || null,
      duration: interaction.duration || null,
      confidence: interaction.confidence || null,
      language: interaction.language || "en",
      createdAt: new Date(),
    };
    this.voiceInteractions.set(newInteraction.id, newInteraction);
    return newInteraction;
  }

  // Profile Insight Methods
  async getProfileInsights(userId: number): Promise<ProfileInsight[]> {
    return Array.from(this.profileInsights.values()).filter(insight => insight.userId === userId);
  }

  async createProfileInsight(insight: InsertProfileInsight): Promise<ProfileInsight> {
    const newInsight: ProfileInsight = {
      id: this.profileInsightId++,
      userId: insight.userId,
      sessionId: insight.sessionId,
      insightType: insight.insightType,
      title: insight.title,
      content: insight.content,
      confidence: insight.confidence || 0.8,
      tags: Array.isArray(insight.tags) ? insight.tags : null,
      actionable: insight.actionable || false,
      createdAt: new Date(),
    };
    this.profileInsights.set(newInsight.id, newInsight);
    return newInsight;
  }

  // Relationship Context Methods
  async getRelationshipContexts(coupleId: number): Promise<RelationshipContext[]> {
    return Array.from(this.relationshipContexts.values()).filter(context => context.coupleId === coupleId);
  }

  async createRelationshipContext(context: InsertRelationshipContext): Promise<RelationshipContext> {
    const newContext: RelationshipContext = {
      id: this.relationshipContextId++,
      coupleId: context.coupleId,
      contextType: context.contextType,
      data: context.data,
      source: context.source || "user_input",
      confidence: context.confidence || 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.relationshipContexts.set(newContext.id, newContext);
    return newContext;
  }

  // Affiliate Partner Methods
  async getAffiliatePartners(status?: string): Promise<AffiliatePartner[]> {
    const partners = Array.from(this.affiliatePartners.values());
    return status ? partners.filter(partner => partner.status === status) : partners;
  }

  async getAffiliatePartner(id: number): Promise<AffiliatePartner | undefined> {
    return this.affiliatePartners.get(id);
  }

  async getAffiliatePartnerByEmail(email: string): Promise<AffiliatePartner | undefined> {
    return Array.from(this.affiliatePartners.values()).find(partner => partner.email === email);
  }

  async createAffiliatePartner(partner: InsertAffiliatePartner): Promise<AffiliatePartner> {
    const newPartner: AffiliatePartner = {
      id: this.affiliatePartnerId++,
      name: partner.name,
      email: partner.email,
      password: partner.password,
      companyName: partner.companyName,
      status: partner.status || "pending",
      description: partner.description || null,
      commissionRate: typeof partner.commissionRate === 'number' ? partner.commissionRate.toString() : (partner.commissionRate || "10.00"),
      website: partner.website || null,
      logoUrl: partner.logoUrl || null,
      notes: partner.notes || null,
      paymentDetails: partner.paymentDetails || null,
      termsAccepted: partner.termsAccepted || false,
      approvedBy: partner.approvedBy || null,
      approvedAt: partner.approvedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.affiliatePartners.set(newPartner.id, newPartner);
    return newPartner;
  }

  async updateAffiliatePartner(id: number, updates: Partial<AffiliatePartner>): Promise<AffiliatePartner | undefined> {
    const partner = this.affiliatePartners.get(id);
    if (!partner) return undefined;

    const updatedPartner = { ...partner, ...updates, updatedAt: new Date() };
    this.affiliatePartners.set(id, updatedPartner);
    return updatedPartner;
  }

  async approveAffiliatePartner(id: number, approvedBy: number): Promise<AffiliatePartner | undefined> {
    const partner = this.affiliatePartners.get(id);
    if (!partner) return undefined;

    const updatedPartner = {
      ...partner,
      status: "active",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    this.affiliatePartners.set(id, updatedPartner);
    return updatedPartner;
  }

  // Affiliate Coupon Methods
  async getAffiliateCoupons(partnerId?: number, isActive?: boolean): Promise<AffiliateCoupon[]> {
    let coupons = Array.from(this.affiliateCoupons.values());
    
    if (partnerId) {
      coupons = coupons.filter(coupon => coupon.partnerId === partnerId);
    }
    
    if (isActive !== undefined) {
      coupons = coupons.filter(coupon => coupon.isActive === isActive);
    }
    
    return coupons;
  }

  async getAffiliateCoupon(id: number): Promise<AffiliateCoupon | undefined> {
    return this.affiliateCoupons.get(id);
  }

  async getAffiliateCouponByCode(code: string): Promise<AffiliateCoupon | undefined> {
    return Array.from(this.affiliateCoupons.values()).find(coupon => coupon.code === code);
  }

  async createAffiliateCoupon(coupon: InsertAffiliateCoupon): Promise<AffiliateCoupon> {
    const newCoupon: AffiliateCoupon = {
      id: this.affiliateCouponId++,
      partnerId: coupon.partnerId,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description || null,
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      maxUses: coupon.maxUses || null,
      currentUses: 0,
      maxUsesPerUser: coupon.maxUsesPerUser || 1,
      minPurchaseAmount: coupon.minPurchaseAmount || null,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      tierId: coupon.tierId || null,
      termsAndConditions: coupon.termsAndConditions || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.affiliateCoupons.set(newCoupon.id, newCoupon);
    return newCoupon;
  }

  async updateAffiliateCoupon(id: number, updates: Partial<AffiliateCoupon>): Promise<AffiliateCoupon | undefined> {
    const coupon = this.affiliateCoupons.get(id);
    if (!coupon) return undefined;

    const updatedCoupon = { ...coupon, ...updates, updatedAt: new Date() };
    this.affiliateCoupons.set(id, updatedCoupon);
    return updatedCoupon;
  }

  async incrementCouponUses(id: number): Promise<AffiliateCoupon | undefined> {
    const coupon = this.affiliateCoupons.get(id);
    if (!coupon) return undefined;

    const currentUses = coupon.currentUses + 1;
    const isActive = coupon.maxUses ? currentUses < coupon.maxUses : coupon.isActive;
    
    const updatedCoupon = {
      ...coupon,
      currentUses,
      isActive,
      updatedAt: new Date()
    };
    
    this.affiliateCoupons.set(id, updatedCoupon);
    return updatedCoupon;
  }

  // Affiliate Referral Methods
  async getAffiliateReferrals(partnerId: number): Promise<AffiliateReferral[]> {
    return Array.from(this.affiliateReferrals.values()).filter(referral => referral.partnerId === partnerId);
  }

  async getAffiliateReferral(id: number): Promise<AffiliateReferral | undefined> {
    return this.affiliateReferrals.get(id);
  }

  async getAffiliateReferralByCode(code: string): Promise<AffiliateReferral | undefined> {
    return Array.from(this.affiliateReferrals.values()).find(referral => referral.referralCode === code);
  }

  async createAffiliateReferral(referral: InsertAffiliateReferral): Promise<AffiliateReferral> {
    const newReferral: AffiliateReferral = {
      id: this.affiliateReferralId++,
      partnerId: referral.partnerId,
      userId: referral.userId,
      referralCode: referral.referralCode,
      referralUrl: referral.referralUrl,
      clickCount: 0,
      conversionCount: 0,
      status: referral.status || "active",
      couponId: referral.couponId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.affiliateReferrals.set(newReferral.id, newReferral);
    return newReferral;
  }

  async updateAffiliateReferral(id: number, updates: Partial<AffiliateReferral>): Promise<AffiliateReferral | undefined> {
    const referral = this.affiliateReferrals.get(id);
    if (!referral) return undefined;

    const updatedReferral = { ...referral, ...updates, updatedAt: new Date() };
    this.affiliateReferrals.set(id, updatedReferral);
    return updatedReferral;
  }

  async incrementReferralClick(id: number): Promise<AffiliateReferral | undefined> {
    const referral = this.affiliateReferrals.get(id);
    if (!referral) return undefined;

    const updatedReferral = {
      ...referral,
      clickCount: referral.clickCount + 1,
      updatedAt: new Date()
    };
    this.affiliateReferrals.set(id, updatedReferral);
    return updatedReferral;
  }

  async incrementReferralConversion(id: number): Promise<AffiliateReferral | undefined> {
    const referral = this.affiliateReferrals.get(id);
    if (!referral) return undefined;

    const updatedReferral = {
      ...referral,
      conversionCount: referral.conversionCount + 1,
      updatedAt: new Date()
    };
    this.affiliateReferrals.set(id, updatedReferral);
    return updatedReferral;
  }

  // Affiliate Transaction Methods
  async getAffiliateTransactions(partnerId: number): Promise<AffiliateTransaction[]> {
    return Array.from(this.affiliateTransactions.values())
      .filter(transaction => transaction.partnerId === partnerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAffiliateTransaction(id: number): Promise<AffiliateTransaction | undefined> {
    return this.affiliateTransactions.get(id);
  }

  async getAffiliateTransactionsByUser(userId: number): Promise<AffiliateTransaction[]> {
    return Array.from(this.affiliateTransactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAffiliateTransaction(transaction: InsertAffiliateTransaction): Promise<AffiliateTransaction> {
    const newTransaction: AffiliateTransaction = {
      id: this.affiliateTransactionId++,
      partnerId: transaction.partnerId,
      userId: transaction.userId,
      subscriptionId: transaction.subscriptionId,
      amount: typeof transaction.amount === 'number' ? transaction.amount.toString() : transaction.amount,
      commissionAmount: typeof transaction.commissionAmount === 'number' ? transaction.commissionAmount.toString() : transaction.commissionAmount,
      currency: transaction.currency || "USD",
      status: transaction.status,
      transactionType: transaction.transactionType,
      notes: transaction.notes || null,
      couponId: transaction.couponId || null,
      referralId: transaction.referralId || null,
      paymentDate: transaction.paymentDate || null,
      createdAt: new Date(),
    };
    this.affiliateTransactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  async updateAffiliateTransactionStatus(id: number, status: string): Promise<AffiliateTransaction | undefined> {
    const transaction = this.affiliateTransactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = {
      ...transaction,
      status,
      paymentDate: status === 'paid' ? new Date() : transaction.paymentDate
    };
    this.affiliateTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Affiliate Payment Methods
  async getAffiliatePayments(partnerId: number): Promise<AffiliatePayment[]> {
    return Array.from(this.affiliatePayments.values())
      .filter(payment => payment.partnerId === partnerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAffiliatePayment(id: number): Promise<AffiliatePayment | undefined> {
    return this.affiliatePayments.get(id);
  }

  async createAffiliatePayment(payment: InsertAffiliatePayment): Promise<AffiliatePayment> {
    const newPayment: AffiliatePayment = {
      id: this.affiliatePaymentId++,
      partnerId: payment.partnerId,
      amount: typeof payment.amount === 'number' ? payment.amount.toString() : payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate || null,
      reference: payment.reference || null,
      notes: payment.notes || null,
      transactions: Array.isArray(payment.transactions) ? payment.transactions : null,
      createdAt: new Date(),
    };
    this.affiliatePayments.set(newPayment.id, newPayment);
    return newPayment;
  }

  async updateAffiliatePaymentStatus(id: number, status: string, reference?: string): Promise<AffiliatePayment | undefined> {
    const payment = this.affiliatePayments.get(id);
    if (!payment) return undefined;

    const updatedPayment = {
      ...payment,
      status,
      reference: reference || payment.reference,
      paymentDate: status === 'completed' ? new Date() : payment.paymentDate
    };
    this.affiliatePayments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Initialize sample data for development
  initializeSampleData() {
    // Create sample users
    const user1: User = {
      id: 1,
      username: "alex_demo",
      password: "password123",
      email: "alex@bondquest.demo",
      displayName: "Alex",
      avatar: null,
      loveLanguage: "quality_time",
      relationshipStatus: "dating",
      anniversary: "2023-02-14",
      createdAt: new Date(),
      partnerCode: "BOND-ALEX123",
      googleId: null,
      instagramId: null,
      lastLogin: new Date(),
      profilePictureUrl: null,
      isAdmin: false,
    };

    const user2: User = {
      id: 2,
      username: "james_demo",
      password: "password123",
      email: "james@bondquest.demo",
      displayName: "James",
      avatar: null,
      loveLanguage: "physical_touch",
      relationshipStatus: "dating",
      anniversary: "2023-02-14",
      createdAt: new Date(),
      partnerCode: "BOND-JAMES456",
      googleId: null,
      instagramId: null,
      lastLogin: new Date(),
      profilePictureUrl: null,
      isAdmin: false,
    };

    this.users.set(1, user1);
    this.users.set(2, user2);

    // Create sample couple
    const couple: Couple = {
      id: 1,
      user1Id: 1,
      user2Id: 2,
      createdAt: new Date(),
      anniversaryDate: new Date("2023-02-14"),
      relationshipStatus: "dating",
      xp: 1250,
      level: 3,
      streak: 7,
      lastActivityDate: new Date(),
    };

    this.couples.set(1, couple);

    // Create sample quizzes
    const quiz1: Quiz = {
      id: 1,
      title: "How Well Do You Know Me?",
      description: "Test your knowledge about your partner's preferences and habits",
      type: "partner_knowledge",
      category: "daily",
      duration: 300,
      points: 100,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const quiz2: Quiz = {
      id: 2,
      title: "Relationship Milestones Quiz",
      description: "Celebrate your journey together",
      type: "milestones",
      category: "special",
      duration: 600,
      points: 150,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.quizzes.set(1, quiz1);
    this.quizzes.set(2, quiz2);

    // Create sample questions
    const questions: Question[] = [
      {
        id: 1,
        quizId: 1,
        text: "What's my favorite color?",
        options: ["Blue", "Red", "Green", "Purple"],
        correctAnswer: "Blue",
        points: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        quizId: 1,
        text: "What's my favorite food?",
        options: ["Pizza", "Sushi", "Pasta", "Burgers"],
        correctAnswer: "Sushi",
        points: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    questions.forEach(q => this.questions.set(q.id, q));

    // Create sample bond assessments
    const assessment1: BondAssessment = {
      id: 1,
      coupleId: 1,
      dimensionId: "communication",
      score: 8.5,
      user1Score: 8,
      user2Score: 9,
      answeredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const assessment2: BondAssessment = {
      id: 2,
      coupleId: 1,
      dimensionId: "trust",
      score: 7.2,
      user1Score: 7,
      user2Score: 7.4,
      answeredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bondAssessments.set(1, assessment1);
    this.bondAssessments.set(2, assessment2);

    console.log("✅ Sample data initialized successfully!");
  }
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from './DatabaseStorage';

// Use MemStorage for now to test bond dimensions functionality
// This will let us move forward without waiting for database migrations
export const storage = new MemStorage();
