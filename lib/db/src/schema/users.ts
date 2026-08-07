import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: text("user_id").unique(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  bio: text("bio"),
  gender: text("gender"),
  country: text("country"),
  avatarUrl: text("avatar_url"),
  subscriptionType: text("subscription_type").notNull().default("free"),
  subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
  activationCode: text("activation_code"),
  dailyMessageCount: integer("daily_message_count").notNull().default(0),
  lastMessageDate: text("last_message_date"),
  conversationCount: integer("conversation_count").notNull().default(0),
  imageCount: integer("image_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  conversationCount: true,
  imageCount: true,
  dailyMessageCount: true,
  lastMessageDate: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
