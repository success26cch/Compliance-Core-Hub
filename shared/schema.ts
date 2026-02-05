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

// Question usage tracking for freemium model
export const questionUsage = pgTable("question_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  questionCount: integer("question_count").notNull().default(0),
  resetDate: timestamp("reset_date").defaultNow(),
});

export const insertQuestionUsageSchema = createInsertSchema(questionUsage).omit({
  id: true,
  resetDate: true,
});
export type QuestionUsage = typeof questionUsage.$inferSelect;
export type InsertQuestionUsage = z.infer<typeof insertQuestionUsageSchema>;

// Contact inquiries (retainer, general questions, etc.)
export const contactInquiries = pgTable("contact_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  employeeCount: text("employee_count"),
  inquiryType: text("inquiry_type").notNull(), // 'retainer', 'consultation', 'general'
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // 'new', 'contacted', 'closed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactInquirySchema = createInsertSchema(contactInquiries).omit({ 
  id: true, 
  createdAt: true,
  status: true 
});
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;

// Employees (company workforce tracking)
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Company/manager who owns this record
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  department: text("department"),
  position: text("position"),
  hireDate: timestamp("hire_date"),
  // DOT Physical tracking
  dotPhysicalDate: timestamp("dot_physical_date"),
  dotPhysicalExpiry: timestamp("dot_physical_expiry"),
  dotPhysicalStatus: text("dot_physical_status").default("pending"), // 'current', 'expiring', 'expired', 'pending', 'na'
  // Respiratory/Medical Surveillance
  respiratoryExamDate: timestamp("respiratory_exam_date"),
  respiratoryExamExpiry: timestamp("respiratory_exam_expiry"),
  respiratoryStatus: text("respiratory_status").default("pending"), // 'current', 'expiring', 'expired', 'pending', 'na'
  // Drug Testing
  lastDrugTest: timestamp("last_drug_test"),
  drugTestResult: text("drug_test_result"), // 'cleared', 'pending', 'failed', 'scheduled'
  randomPoolIncluded: boolean("random_pool_included").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Helper to transform date strings to Date objects (for JSON parsing)
const dateOrStringToDate = z.union([
  z.date(),
  z.string().transform((val) => val ? new Date(val) : undefined),
]).optional().nullable();

export const insertEmployeeSchema = createInsertSchema(employees, {
  hireDate: dateOrStringToDate,
  dotPhysicalDate: dateOrStringToDate,
  dotPhysicalExpiry: dateOrStringToDate,
  respiratoryExamDate: dateOrStringToDate,
  respiratoryExamExpiry: dateOrStringToDate,
  lastDrugTest: dateOrStringToDate,
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Recordable Incidents
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Company/manager who owns this record
  employeeId: integer("employee_id"), // Optional link to employee
  incidentDate: timestamp("incident_date").notNull(),
  description: text("description").notNull(),
  incidentType: text("incident_type").notNull(), // 'injury', 'illness', 'near_miss', 'property_damage'
  isRecordable: boolean("is_recordable").default(false),
  daysAway: integer("days_away").default(0),
  daysRestricted: integer("days_restricted").default(0),
  status: text("status").notNull().default("pending_review"), // 'pending_review', 'reviewed', 'closed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Incident date as string or Date
const incidentDateTransform = z.union([
  z.date(),
  z.string().transform((val) => new Date(val)),
]);

export const insertIncidentSchema = createInsertSchema(incidents, {
  incidentDate: incidentDateTransform,
}).omit({ 
  id: true, 
  createdAt: true 
});
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

// Action Items (urgent tasks for managers)
export const actionItems = pgTable("action_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Company/manager who owns this record
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // 'urgent', 'high', 'medium', 'low'
  category: text("category").notNull(), // 'dot_expiry', 'drug_test', 'incident_review', 'training', 'audit'
  dueDate: timestamp("due_date"),
  relatedEmployeeId: integer("related_employee_id"),
  relatedIncidentId: integer("related_incident_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertActionItemSchema = createInsertSchema(actionItems, {
  dueDate: dateOrStringToDate,
}).omit({ 
  id: true, 
  createdAt: true,
  completedAt: true 
});
export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;

// ISO Audit Readiness (track compliance areas)
export const auditReadiness = pgTable("audit_readiness", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(), // 'iso_9001', 'iso_14001', 'iso_45001', 'osha', 'dot'
  completedItems: integer("completed_items").default(0),
  totalItems: integer("total_items").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAuditReadinessSchema = createInsertSchema(auditReadiness).omit({ 
  id: true, 
  lastUpdated: true 
});
export type AuditReadiness = typeof auditReadiness.$inferSelect;
export type InsertAuditReadiness = z.infer<typeof insertAuditReadinessSchema>;

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
