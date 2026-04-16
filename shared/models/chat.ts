import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default(""),
  title: text("title").notNull(),
  topic: text("topic"),
  source: text("source").default("standalone"),  // "standalone" | "module"
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  isComplianceDecision: boolean("is_compliance_decision").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const pinnedGuidance = pgTable("pinned_guidance", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  conversationId: integer("conversation_id").notNull(),
  messageId: integer("message_id").notNull(),
  topic: text("topic").notNull(),
  summary: text("summary").notNull(),
  messageContent: text("message_content"),
  pinnedAt: timestamp("pinned_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertPinnedGuidanceSchema = createInsertSchema(pinnedGuidance).omit({
  id: true,
  pinnedAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type PinnedGuidance = typeof pinnedGuidance.$inferSelect;
export type InsertPinnedGuidance = z.infer<typeof insertPinnedGuidanceSchema>;
