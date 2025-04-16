import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  loveLanguage: text("love_language"),
  relationshipStatus: text("relationship_status"),
  anniversary: text("anniversary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  partnerCode: text("partner_code").notNull().unique(),
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
  matchPercentage: integer("match_percentage"),
  pointsEarned: integer("points_earned"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
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
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, partnerCode: true });
export const insertCoupleSchema = createInsertSchema(couples).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({ id: true, createdAt: true, completedAt: true });
export const insertDailyCheckInSchema = createInsertSchema(dailyCheckIns).omit({ id: true, date: true });
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, unlockedAt: true });
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
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true });
export const insertProfileQuestionSchema = createInsertSchema(profileQuestions).omit({ id: true });
export const insertUserResponseSchema = createInsertSchema(userResponses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPartnerQuizQuestionSchema = createInsertSchema(partnerQuizQuestions).omit({ id: true, createdAt: true });
export const insertPartnerQuizResponseSchema = createInsertSchema(partnerQuizResponses).omit({ id: true, createdAt: true });

// Types for the new tables
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
