import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { bondDimensions } from "./bondDimensions";

// Session table for express-session with connect-pg-simple
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey().notNull(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

// User Model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Can be null for social logins
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  loveLanguage: text("love_language"),
  relationshipStatus: text("relationship_status"),
  anniversary: text("anniversary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  partnerCode: text("partner_code").notNull().unique(),
  // Social login fields
  googleId: text("google_id").unique(),
  instagramId: text("instagram_id").unique(),
  lastLogin: timestamp("last_login"),
  profilePictureUrl: text("profile_picture_url"),
});

// Couple Model
export const couples = pgTable("couples", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").notNull().references(() => users.id),
  userId2: integer("user_id_2").notNull().references(() => users.id),
  bondStrength: integer("bond_strength").default(50),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz Model
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "sync", "async", "competition"
  category: text("category").notNull(), // "couple_vs_couple", "partner_vs_partner", "memory_lane", "daily_habits"
  duration: integer("duration").notNull(), // in minutes
  points: integer("points").notNull(),
  image: text("image"),
});

// Question Model
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  text: text("text").notNull(),
  options: json("options").$type<string[]>(),
});

// QuizSession Model
export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  user1Answers: json("user1_answers").$type<Record<string, string>>(),
  user2Answers: json("user2_answers").$type<Record<string, string>>(),
  user1Completed: boolean("user1_completed").default(false),
  user2Completed: boolean("user2_completed").default(false),
  matchPercentage: integer("match_percentage"),
  pointsEarned: integer("points_earned"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  user1CompletedAt: timestamp("user1_completed_at"),
  user2CompletedAt: timestamp("user2_completed_at"),
});

// Daily Check-In Model
export const dailyCheckIns = pgTable("daily_check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(),
  note: text("note"),
  date: timestamp("date").defaultNow().notNull(),
});

// Achievement Model
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "quiz", "check_in", "bond_strength", "level", "competition", "streak"
  badgeImageUrl: text("badge_image_url"), // URL to the achievement badge image
  points: integer("points").default(50), // Points rewarded for unlocking this achievement
  level: integer("level").default(1), // Achievement level (bronze, silver, gold, etc.)
  progress: integer("progress").default(0), // Current progress towards achievement
  progressTarget: integer("progress_target").notNull(), // Required progress to unlock achievement
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Model (for tracking recent activities)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  type: text("type").notNull(), // "quiz", "check_in", "achievement"
  referenceId: integer("reference_id").notNull(), // reference to the specific activity object
  points: integer("points"),
  description: text("description"), // AI-generated insights or activity description
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat Model (for AI assistant)
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  assistantType: text("assistant_type").notNull(), // "casanova", "venus", "aurora"
  message: text("message").notNull(),
  sender: text("sender").notNull(), // "assistant", "user"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscription Tier Model
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: text("billing_period").notNull(), // "monthly", "yearly"
  features: json("features").$type<string[]>(),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Subscription Model
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tierId: integer("tier_id").notNull().references(() => subscriptionTiers.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull(), // "active", "canceled", "past_due", "trialing"
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reward Model
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "digital", "physical", "discount", "points"
  value: integer("value").notNull(), // monetary or point value
  imageUrl: text("image_url"),
  code: text("code"), // for digital rewards like discount codes
  availableFrom: timestamp("available_from").notNull(),
  availableTo: timestamp("available_to").notNull(),
  quantity: integer("quantity").notNull(),
  requiredTier: integer("required_tier").references(() => subscriptionTiers.id),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Competition Model
export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  entryFee: integer("entry_fee").notNull(),
  maxParticipants: integer("max_participants"),
  participantCount: integer("participant_count").default(0),
  requiredTier: integer("required_tier").references(() => subscriptionTiers.id),
  status: text("status").notNull(), // "upcoming", "active", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Competition Rewards Link Table
export const competitionRewards = pgTable("competition_rewards", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").notNull().references(() => competitions.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  rankRequired: integer("rank_required").notNull(), // 1 for first place, 2 for second, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Competition Entry Model
export const competitionEntries = pgTable("competition_entries", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").notNull().references(() => competitions.id),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  score: integer("score").default(0),
  rank: integer("rank"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Couple Rewards Link Table
export const coupleRewards = pgTable("couple_rewards", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  competitionId: integer("competition_id").references(() => competitions.id),
  status: text("status").notNull(), // "awarded", "claimed", "shipped", "delivered", "expired"
  trackingNumber: text("tracking_number"),
  shippingAddress: json("shipping_address").$type<{
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  }>(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  claimedAt: timestamp("claimed_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  expiresAt: timestamp("expires_at"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCoupleSchema = createInsertSchema(couples).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({ id: true, createdAt: true, completedAt: true });
export const insertDailyCheckInSchema = createInsertSchema(dailyCheckIns).omit({ id: true, date: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, unlockedAt: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertChatSchema = createInsertSchema(chats).omit({ id: true, createdAt: true });

// New Insert Schemas for Reward System
export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompetitionSchema = createInsertSchema(competitions).omit({ id: true, createdAt: true, updatedAt: true, participantCount: true });
export const insertCompetitionRewardSchema = createInsertSchema(competitionRewards).omit({ id: true, createdAt: true });
export const insertCompetitionEntrySchema = createInsertSchema(competitionEntries).omit({ id: true, joinedAt: true, updatedAt: true, rank: true });
export const insertCoupleRewardSchema = createInsertSchema(coupleRewards).omit({ 
  id: true, 
  awardedAt: true, 
  claimedAt: true, 
  shippedAt: true, 
  deliveredAt: true, 
  expiresAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Couple = typeof couples.$inferSelect;
export type InsertCouple = z.infer<typeof insertCoupleSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;

export type DailyCheckIn = typeof dailyCheckIns.$inferSelect;
export type InsertDailyCheckIn = z.infer<typeof insertDailyCheckInSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

// Conversation Session Model - Tracks conversation interaction sessions
export const conversationSessions = pgTable("conversation_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionType: text("session_type").notNull(), // "onboarding", "check-in", "quiz-prep", "profile-update"
  status: text("status").notNull(), // "in-progress", "completed", "abandoned"
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata").$type<Record<string, any>>(), // session flags, context, etc.
});

// Conversation Messages Model - Stores back-and-forth conversation during onboarding
export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => conversationSessions.id),
  sender: text("sender").notNull(), // "system", "user", "ai"
  message: text("message").notNull(),
  messageType: text("message_type").notNull(), // "text", "question", "response", "prompt", "instruction"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  contentTags: json("content_tags").$type<string[]>(), // profile areas this message relates to
  sentiment: text("sentiment"), // AI-analyzed sentiment
  extractedInsights: json("extracted_insights").$type<Record<string, any>>(), // structured data extracted from message
});

// Voice Interaction Model - Storage for voice data and transcriptions
export const voiceInteractions = pgTable("voice_interactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => conversationMessages.id),
  audioUrl: text("audio_url"), // URL to stored audio file
  transcript: text("transcript"), // Full transcript
  duration: integer("duration"), // Duration in seconds
  language: text("language").default("en-US"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Profile Insights - AI-generated insights derived from conversations
export const profileInsights = pgTable("profile_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  insightType: text("insight_type").notNull(), // e.g., "bond_dimension_communication", "partner_details" 
  insight: text("insight").notNull(), // The actual insight text
  confidenceScore: text("confidence_score"), // How confident the AI is (low, medium, high)
  sourceSessionIds: json("source_session_ids").$type<number[]>(), // Which conversation sessions this was derived from
  metadata: json("metadata").default({}), // Additional data like dimension scores and dimension type
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Preferences - Stores user interface and notification preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  // Notification preferences
  dailyReminders: boolean("daily_reminders").default(true),
  partnerActivity: boolean("partner_activity").default(true),
  competitionUpdates: boolean("competition_updates").default(true),
  appUpdates: boolean("app_updates").default(true),
  // Privacy preferences
  publicProfile: boolean("public_profile").default(false),
  activityVisibility: boolean("activity_visibility").default(true),
  dataCollection: boolean("data_collection").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
  // AI preferences
  preferredAssistant: text("preferred_assistant").default("casanova"), // casanova, venus, aurora
  proactiveAiSuggestions: boolean("proactive_ai_suggestions").default(true),
  personalizedInsights: boolean("personalized_insights").default(true),
  contentCustomization: boolean("content_customization").default(true),
  // Theme preferences
  darkMode: boolean("dark_mode").default(false),
  accentColor: text("accent_color").default("purple"),
  // Other preferences
  language: text("language").default("en-GB"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relationship Context - Specific for couple context
export const relationshipContexts = pgTable("relationship_contexts", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  contextType: text("context_type").notNull(), // "communication", "challenges", "milestones", "goals"
  context: text("context").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bond Dimension Assessments - Stores scores for each bond dimension
export const bondAssessments = pgTable("bond_assessments", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  dimensionId: text("dimension_id").notNull(), // Matches the id in BOND_DIMENSIONS
  score: integer("score").notNull(), // 1-10 scale
  user1Score: integer("user1_score"), // Individual user assessment
  user2Score: integer("user2_score"), // Individual user assessment
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bond Insights - AI-generated insights based on bond assessment scores
export const bondInsights = pgTable("bond_insights", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id),
  dimensionId: text("dimension_id").notNull(), // Matches the id in BOND_DIMENSIONS
  title: text("title").notNull(),
  content: text("content").notNull(),
  actionItems: json("action_items").$type<string[]>().notNull(),
  targetScoreRange: json("target_score_range").$type<[number, number]>().notNull(),
  difficulty: text("difficulty").notNull(), // "easy", "medium", "challenging"
  viewed: boolean("viewed").default(false),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Bond Assessment Questions - Questions used to measure each bond dimension
export const bondQuestions = pgTable("bond_questions", {
  id: serial("id").primaryKey(),
  dimensionId: text("dimension_id").notNull(), // Matches the id in BOND_DIMENSIONS
  text: text("text").notNull(),
  type: text("type").notNull(), // "likert", "multiple_choice", "text"
  options: json("options").$type<string[]>(),
  weight: integer("weight").default(1), // Importance of this question to dimension score
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New Types for Reward System
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;

export type CompetitionReward = typeof competitionRewards.$inferSelect;
export type InsertCompetitionReward = z.infer<typeof insertCompetitionRewardSchema>;

export type CompetitionEntry = typeof competitionEntries.$inferSelect;
export type InsertCompetitionEntry = z.infer<typeof insertCompetitionEntrySchema>;

export type CoupleReward = typeof coupleRewards.$inferSelect;
export type InsertCoupleReward = z.infer<typeof insertCoupleRewardSchema>;

// User Profile Detail Model - Stores detailed information about a user
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  favoriteColors: json("favorite_colors").$type<string[]>(),
  favoriteFood: text("favorite_food"),
  favoriteMovies: json("favorite_movies").$type<string[]>(),
  favoriteSongs: json("favorite_songs").$type<string[]>(),
  hobbies: json("hobbies").$type<string[]>(),
  dreamVacation: text("dream_vacation"),
  biggestFear: text("biggest_fear"),
  petPeeves: json("pet_peeves").$type<string[]>(),
  childhoodMemories: json("childhood_memories").$type<string[]>(),
  loveLanguage: text("love_language"),
  communicationStyle: text("communication_style"),
  weekendPreference: text("weekend_preference"),
  stressRelievers: json("stress_relievers").$type<string[]>(),
  lifeGoals: json("life_goals").$type<string[]>(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
});

// Profile Questions - Template questions for profile creation
export const profileQuestions = pgTable("profile_questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // personal, relationship, etc.
  questionText: text("question_text").notNull(),
  responseType: text("response_type").notNull(), // "text", "multiple_choice", "list"
  options: json("options").$type<string[]>(), // For multiple choice questions
  isRequired: boolean("is_required").default(false),
  sortOrder: integer("sort_order").default(0),
});

// User Responses - Stores answers to profile questions
export const userResponses = pgTable("user_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => profileQuestions.id),
  response: text("response").notNull(),
  additionalContext: text("additional_context"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Partner Quiz Questions - Questions one partner creates about themselves for the other to answer
export const partnerQuizQuestions = pgTable("partner_quiz_questions", {
  id: serial("id").primaryKey(),
  quizSessionId: integer("quiz_session_id").notNull().references(() => quizSessions.id),
  authorUserId: integer("author_user_id").notNull().references(() => users.id),
  targetUserId: integer("target_user_id").notNull().references(() => users.id),
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  options: json("options").$type<string[]>().notNull(),
  difficulty: text("difficulty").default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Partner Quiz Responses - Answers submitted by the target partner
export const partnerQuizResponses = pgTable("partner_quiz_responses", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => partnerQuizQuestions.id),
  respondentUserId: integer("respondent_user_id").notNull().references(() => users.id),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  responseTime: integer("response_time"), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema definitions for the new tables
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true });
export const insertProfileQuestionSchema = createInsertSchema(profileQuestions).omit({ id: true });
export const insertUserResponseSchema = createInsertSchema(userResponses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPartnerQuizQuestionSchema = createInsertSchema(partnerQuizQuestions).omit({ id: true, createdAt: true });
export const insertPartnerQuizResponseSchema = createInsertSchema(partnerQuizResponses).omit({ id: true, createdAt: true });

// Conversation System Insert Schemas
export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({ 
  id: true, 
  startedAt: true, 
  completedAt: true 
});
export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({ 
  id: true, 
  timestamp: true 
});
export const insertVoiceInteractionSchema = createInsertSchema(voiceInteractions).omit({ 
  id: true, 
  createdAt: true 
});
export const insertProfileInsightSchema = createInsertSchema(profileInsights).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertRelationshipContextSchema = createInsertSchema(relationshipContexts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Bond Dimensions Insert Schemas
export const insertBondAssessmentSchema = createInsertSchema(bondAssessments).omit({
  id: true,
  answeredAt: true,
  createdAt: true,
  updatedAt: true
});

export const insertBondInsightSchema = createInsertSchema(bondInsights).omit({
  id: true,
  createdAt: true,
  expiresAt: true
});

export const insertBondQuestionSchema = createInsertSchema(bondQuestions).omit({
  id: true,
  createdAt: true
});

// Types for the new tables
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type ProfileQuestion = typeof profileQuestions.$inferSelect;
export type InsertProfileQuestion = z.infer<typeof insertProfileQuestionSchema>;

export type UserResponse = typeof userResponses.$inferSelect;
export type InsertUserResponse = z.infer<typeof insertUserResponseSchema>;

export type PartnerQuizQuestion = typeof partnerQuizQuestions.$inferSelect;
export type InsertPartnerQuizQuestion = z.infer<typeof insertPartnerQuizQuestionSchema>;

export type PartnerQuizResponse = typeof partnerQuizResponses.$inferSelect;
export type InsertPartnerQuizResponse = z.infer<typeof insertPartnerQuizResponseSchema>;

// Conversation System Types
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;

export type VoiceInteraction = typeof voiceInteractions.$inferSelect;
export type InsertVoiceInteraction = z.infer<typeof insertVoiceInteractionSchema>;

export type ProfileInsight = typeof profileInsights.$inferSelect;
export type InsertProfileInsight = z.infer<typeof insertProfileInsightSchema>;

export type RelationshipContext = typeof relationshipContexts.$inferSelect;
export type InsertRelationshipContext = z.infer<typeof insertRelationshipContextSchema>;

// Bond Dimensions Types
export type BondAssessment = typeof bondAssessments.$inferSelect;
export type InsertBondAssessment = z.infer<typeof insertBondAssessmentSchema>;

export type BondInsight = typeof bondInsights.$inferSelect;
export type InsertBondInsight = z.infer<typeof insertBondInsightSchema>;

export type BondQuestion = typeof bondQuestions.$inferSelect;
export type InsertBondQuestion = z.infer<typeof insertBondQuestionSchema>;
