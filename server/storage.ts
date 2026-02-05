import { leads, subscriptions, questionUsage, contactInquiries, employees, incidents, actionItems, auditReadiness, companyProfiles, type InsertLead, type Lead, type InsertSubscription, type Subscription, type QuestionUsage, type InsertContactInquiry, type ContactInquiry, type Employee, type InsertEmployee, type Incident, type InsertIncident, type ActionItem, type InsertActionItem, type AuditReadiness, type InsertAuditReadiness, type CompanyProfile, type InsertCompanyProfile } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

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

  // Contact Inquiries
  createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry>;
  getContactInquiries(): Promise<ContactInquiry[]>;
  updateInquiryStatus(id: number, status: string): Promise<ContactInquiry | undefined>;

  // Employees
  getEmployees(userId: string): Promise<Employee[]>;
  getEmployeeById(id: number, userId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, userId: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number, userId: string): Promise<boolean>;

  // Incidents
  getIncidents(userId: string): Promise<Incident[]>;
  getIncidentsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: number, incident: Partial<InsertIncident>): Promise<Incident | undefined>;

  // Action Items
  getActionItems(userId: string): Promise<ActionItem[]>;
  getPendingActionItems(userId: string): Promise<ActionItem[]>;
  getActionItemById(id: number, userId: string): Promise<ActionItem | undefined>;
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  updateActionItemStatus(id: number, userId: string, status: string): Promise<ActionItem | undefined>;

  // Audit Readiness
  getAuditReadiness(userId: string): Promise<AuditReadiness[]>;
  upsertAuditReadiness(readiness: InsertAuditReadiness): Promise<AuditReadiness>;

  // Company Profile
  getCompanyProfile(userId: string): Promise<CompanyProfile | undefined>;
  upsertCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
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

  async createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry> {
    const [newInquiry] = await db.insert(contactInquiries).values(inquiry).returning();
    return newInquiry;
  }

  async getContactInquiries(): Promise<ContactInquiry[]> {
    return db.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt));
  }

  async updateInquiryStatus(id: number, status: string): Promise<ContactInquiry | undefined> {
    const [updated] = await db
      .update(contactInquiries)
      .set({ status })
      .where(eq(contactInquiries.id, id))
      .returning();
    return updated;
  }

  // Employees
  async getEmployees(userId: string): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.userId, userId)).orderBy(employees.lastName);
  }

  async getEmployeeById(id: number, userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees)
      .where(and(eq(employees.id, id), eq(employees.userId, userId)));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, userId: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEmployee(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(employees)
      .where(and(eq(employees.id, id), eq(employees.userId, userId)));
    return true;
  }

  // Incidents
  async getIncidents(userId: string): Promise<Incident[]> {
    return db.select().from(incidents).where(eq(incidents.userId, userId)).orderBy(desc(incidents.incidentDate));
  }

  async getIncidentsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Incident[]> {
    return db.select().from(incidents)
      .where(and(
        eq(incidents.userId, userId),
        gte(incidents.incidentDate, startDate),
        lte(incidents.incidentDate, endDate)
      ))
      .orderBy(incidents.incidentDate);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async updateIncident(id: number, incident: Partial<InsertIncident>): Promise<Incident | undefined> {
    const [updated] = await db
      .update(incidents)
      .set(incident)
      .where(eq(incidents.id, id))
      .returning();
    return updated;
  }

  // Action Items
  async getActionItems(userId: string): Promise<ActionItem[]> {
    return db.select().from(actionItems).where(eq(actionItems.userId, userId)).orderBy(desc(actionItems.createdAt));
  }

  async getPendingActionItems(userId: string): Promise<ActionItem[]> {
    return db.select().from(actionItems)
      .where(and(
        eq(actionItems.userId, userId),
        eq(actionItems.status, "pending")
      ))
      .orderBy(actionItems.dueDate);
  }

  async getActionItemById(id: number, userId: string): Promise<ActionItem | undefined> {
    const [item] = await db.select().from(actionItems)
      .where(and(eq(actionItems.id, id), eq(actionItems.userId, userId)));
    return item;
  }

  async createActionItem(actionItem: InsertActionItem): Promise<ActionItem> {
    const [newAction] = await db.insert(actionItems).values(actionItem).returning();
    return newAction;
  }

  async updateActionItemStatus(id: number, userId: string, status: string): Promise<ActionItem | undefined> {
    const updates: any = { status };
    if (status === "completed") {
      updates.completedAt = new Date();
    }
    const [updated] = await db
      .update(actionItems)
      .set(updates)
      .where(and(eq(actionItems.id, id), eq(actionItems.userId, userId)))
      .returning();
    return updated;
  }

  // Audit Readiness
  async getAuditReadiness(userId: string): Promise<AuditReadiness[]> {
    return db.select().from(auditReadiness).where(eq(auditReadiness.userId, userId));
  }

  async upsertAuditReadiness(readiness: InsertAuditReadiness): Promise<AuditReadiness> {
    const [existing] = await db.select().from(auditReadiness)
      .where(and(
        eq(auditReadiness.userId, readiness.userId),
        eq(auditReadiness.category, readiness.category)
      ));
    
    if (existing) {
      const [updated] = await db
        .update(auditReadiness)
        .set({ ...readiness, lastUpdated: new Date() })
        .where(eq(auditReadiness.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(auditReadiness).values(readiness).returning();
      return created;
    }
  }

  // Company Profile
  async getCompanyProfile(userId: string): Promise<CompanyProfile | undefined> {
    const [profile] = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, userId));
    return profile;
  }

  async upsertCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const existing = await this.getCompanyProfile(profile.userId);
    if (existing) {
      const [updated] = await db
        .update(companyProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(companyProfiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(companyProfiles).values(profile).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
