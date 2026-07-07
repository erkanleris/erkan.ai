import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptionCodes = pgTable("subscription_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  plan: text("plan").notNull(),
  durationDays: integer("duration_days").notNull().default(30),
  usedBy: integer("used_by").references(() => users.id, { onDelete: "set null" }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SubscriptionCode = typeof subscriptionCodes.$inferSelect;
