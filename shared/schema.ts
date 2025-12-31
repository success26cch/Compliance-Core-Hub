import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export integration models
export * from "./models/auth";
export * from "./models/chat";

// Leads for the "Recordability Cheat Sheet"
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Matches auth user id (string from Replit Auth)
  status: text("status").notNull().default("inactive"), // 'active', 'inactive'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"), // 'pro_monthly'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Types for API communication
export type CreateLeadRequest = InsertLead;
export type LeadResponse = Lead;

export type SubscriptionStatusResponse = {
  status: string;
  plan?: string | null;
  isPro: boolean;
};

export type CheckoutSessionRequest = {
  priceId: string;
};

export type CheckoutSessionResponse = {
  url: string;
};
