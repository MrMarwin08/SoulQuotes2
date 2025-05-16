import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profilePicture: text("profile_picture"),
  memberSince: timestamp("member_since").defaultNow(),
  preferences: jsonb("preferences").$type<{
    topics: string[];
    authors: string[];
    notificationTime: string;
    darkMode: boolean;
    language: string;
  }>(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  backgroundImageUrl: text("background_image_url"),
});

export const userQuotes = pgTable("user_quotes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  isFavorite: boolean("is_favorite").default(false),
  isMemorized: boolean("is_memorized").default(false),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  profilePicture: true,
  preferences: true,
});

export const insertQuoteSchema = createInsertSchema(quotes);

export const insertUserQuoteSchema = createInsertSchema(userQuotes).pick({
  userId: true,
  quoteId: true,
  isFavorite: true,
  isMemorized: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type UserQuote = typeof userQuotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertUserQuote = z.infer<typeof insertUserQuoteSchema>;
