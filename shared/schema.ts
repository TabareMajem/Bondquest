import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex } from "drizzle-orm/pg-core";
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
