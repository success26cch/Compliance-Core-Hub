import { leads, subscriptions, questionUsage, type InsertLead, type Lead, type InsertSubscription, type Subscription, type QuestionUsage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;

  // Subscriptions
  getSubscription(userId: string): Promise<Subscription | undefined>;
  upsertSubscription(sub: InsertSubscription): Promise<Subscription>;

  // Question Usage
  getQuestionUsage(userId: string): Promise<QuestionUsage | undefined>;
  incrementQuestionCount(userId: string): Promise<QuestionUsage>;
}

export class DatabaseStorage implements IStorage {
  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads);
  }

  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async upsertSubscription(sub: InsertSubscription): Promise<Subscription> {
    // Check if exists
    const existing = await this.getSubscription(sub.userId);
    if (existing) {
      const [updated] = await db
        .update(subscriptions)
        .set({ ...sub, updatedAt: new Date() })
        .where(eq(subscriptions.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(subscriptions).values(sub).returning();
      return created;
    }
  }

  async getQuestionUsage(userId: string): Promise<QuestionUsage | undefined> {
    const [usage] = await db.select().from(questionUsage).where(eq(questionUsage.userId, userId));
    return usage;
  }

  async incrementQuestionCount(userId: string): Promise<QuestionUsage> {
    const existing = await this.getQuestionUsage(userId);
    if (existing) {
      const [updated] = await db
        .update(questionUsage)
        .set({ questionCount: existing.questionCount + 1 })
        .where(eq(questionUsage.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(questionUsage).values({ userId, questionCount: 1 }).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
