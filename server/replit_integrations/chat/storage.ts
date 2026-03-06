import { db } from "../../db";
import { conversations, messages, pinnedGuidance } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number, userId: string): Promise<typeof conversations.$inferSelect | undefined>;
  getAllConversations(userId: string): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string, userId: string): Promise<typeof conversations.$inferSelect>;
  updateConversationTitle(id: number, title: string, userId: string): Promise<void>;
  updateConversationTopic(id: number, topic: string): Promise<void>;
  deleteConversation(id: number, userId: string): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string, isComplianceDecision?: boolean): Promise<typeof messages.$inferSelect>;
  getComplianceDecisions(userId: string): Promise<Array<{ message: typeof messages.$inferSelect; conversationTitle: string; conversationTopic: string | null }>>;
  getPinnedGuidance(userId: string): Promise<(typeof pinnedGuidance.$inferSelect)[]>;
  pinGuidance(data: { userId: string; conversationId: number; messageId: number; topic: string; summary: string; messageContent?: string }): Promise<typeof pinnedGuidance.$inferSelect>;
  unpinGuidance(id: number, userId: string): Promise<void>;
  getTopicBreakdown(userId: string): Promise<Array<{ topic: string; count: number }>>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number, userId: string) {
    const [conversation] = await db.select().from(conversations).where(
      and(eq(conversations.id, id), eq(conversations.userId, userId))
    );
    return conversation;
  },

  async getAllConversations(userId: string) {
    return db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  },

  async createConversation(title: string, userId: string) {
    const [conversation] = await db.insert(conversations).values({ title, userId }).returning();
    return conversation;
  },

  async updateConversationTitle(id: number, title: string, userId: string) {
    await db.update(conversations).set({ title }).where(
      and(eq(conversations.id, id), eq(conversations.userId, userId))
    );
  },

  async updateConversationTopic(id: number, topic: string) {
    await db.update(conversations).set({ topic }).where(eq(conversations.id, id));
  },

  async deleteConversation(id: number, userId: string) {
    const conv = await this.getConversation(id, userId);
    if (!conv) return;
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  },

  async getMessagesByConversation(conversationId: number) {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  },

  async createMessage(conversationId: number, role: string, content: string, isComplianceDecision = false) {
    const [message] = await db.insert(messages).values({ conversationId, role, content, isComplianceDecision }).returning();
    return message;
  },

  async getComplianceDecisions(userId: string) {
    const results = await db
      .select({
        message: messages,
        conversationTitle: conversations.title,
        conversationTopic: conversations.topic,
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(eq(conversations.userId, userId), eq(messages.isComplianceDecision, true)))
      .orderBy(desc(messages.createdAt))
      .limit(50);
    return results;
  },

  async getPinnedGuidance(userId: string) {
    return db.select().from(pinnedGuidance)
      .where(eq(pinnedGuidance.userId, userId))
      .orderBy(desc(pinnedGuidance.pinnedAt));
  },

  async pinGuidance(data: { userId: string; conversationId: number; messageId: number; topic: string; summary: string; messageContent?: string }) {
    const [pinned] = await db.insert(pinnedGuidance).values(data).returning();
    return pinned;
  },

  async unpinGuidance(id: number, userId: string) {
    await db.delete(pinnedGuidance).where(and(eq(pinnedGuidance.id, id), eq(pinnedGuidance.userId, userId)));
  },

  async getTopicBreakdown(userId: string) {
    const rows = await db
      .select({
        topic: conversations.topic,
        count: sql<number>`count(*)::int`,
      })
      .from(conversations)
      .where(and(eq(conversations.userId, userId), sql`${conversations.topic} IS NOT NULL`))
      .groupBy(conversations.topic)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
    return rows.filter(r => r.topic != null) as Array<{ topic: string; count: number }>;
  },
};
