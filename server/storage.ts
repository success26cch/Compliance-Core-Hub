import { leads, subscriptions, questionUsage, contactInquiries, employees, incidents, correctiveActions, actionItems, auditReadiness, companyProfiles, users, clinicVisits, authorizationForms, type InsertLead, type Lead, type InsertSubscription, type Subscription, type QuestionUsage, type InsertContactInquiry, type ContactInquiry, type Employee, type InsertEmployee, type Incident, type InsertIncident, type CorrectiveAction, type InsertCorrectiveAction, type ActionItem, type InsertActionItem, type AuditReadiness, type InsertAuditReadiness, type CompanyProfile, type InsertCompanyProfile, type User, type ClinicVisit, type InsertClinicVisit, type AuthorizationForm, type InsertAuthorizationForm } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

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
  updateIncident(id: number, userId: string, incident: Partial<InsertIncident>): Promise<Incident | undefined>;

  // Corrective Actions
  getCorrectiveActions(userId: string): Promise<CorrectiveAction[]>;
  getCorrectiveActionById(id: number, userId: string): Promise<CorrectiveAction | undefined>;
  createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction>;
  updateCorrectiveAction(id: number, userId: string, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction | undefined>;
  deleteCorrectiveAction(id: number, userId: string): Promise<boolean>;

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

  // Clinic Visits (Digital Medical Passport)
  createClinicVisit(visit: InsertClinicVisit): Promise<ClinicVisit>;
  getClinicVisitByToken(token: string): Promise<ClinicVisit | undefined>;
  getClinicVisitsByEmployee(employeeId: number, userId: string): Promise<ClinicVisit[]>;
  getClinicVisitsByUser(userId: string): Promise<ClinicVisit[]>;
  updateClinicVisit(id: number, updates: Partial<InsertClinicVisit>): Promise<ClinicVisit | undefined>;
  getEmployeeByIdPublic(id: number): Promise<Employee | undefined>;

  // Authorization Forms
  getAuthorizationForms(userId: string): Promise<AuthorizationForm[]>;
  getAuthorizationFormByVisitType(userId: string, visitType: string): Promise<AuthorizationForm | undefined>;
  upsertAuthorizationForm(form: InsertAuthorizationForm): Promise<AuthorizationForm>;
  deleteAuthorizationForm(id: number, userId: string): Promise<boolean>;

  // Superadmin functions
  getUserById(userId: string): Promise<User | undefined>;
  isSuperadmin(userId: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getAllSubscriptions(): Promise<Subscription[]>;
  getNewSignupsThisWeek(): Promise<number>;
  getUserGrowthLast30Days(): Promise<{ date: string; count: number }[]>;
  getRetainerRequests(): Promise<ContactInquiry[]>;
  setSuperadmin(userId: string, isSuperadmin: boolean): Promise<User | undefined>;
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

  async updateIncident(id: number, userId: string, incident: Partial<InsertIncident>): Promise<Incident | undefined> {
    const [updated] = await db
      .update(incidents)
      .set(incident)
      .where(and(eq(incidents.id, id), eq(incidents.userId, userId)))
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

  // Corrective Actions
  async getCorrectiveActions(userId: string): Promise<CorrectiveAction[]> {
    return db.select().from(correctiveActions)
      .where(eq(correctiveActions.userId, userId))
      .orderBy(desc(correctiveActions.createdAt));
  }

  async getCorrectiveActionById(id: number, userId: string): Promise<CorrectiveAction | undefined> {
    const [action] = await db.select().from(correctiveActions)
      .where(and(eq(correctiveActions.id, id), eq(correctiveActions.userId, userId)));
    return action;
  }

  async createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction> {
    const [created] = await db.insert(correctiveActions).values(action).returning();
    return created;
  }

  async updateCorrectiveAction(id: number, userId: string, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction | undefined> {
    const [updated] = await db
      .update(correctiveActions)
      .set({ ...action, updatedAt: new Date() })
      .where(and(eq(correctiveActions.id, id), eq(correctiveActions.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCorrectiveAction(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(correctiveActions)
      .where(and(eq(correctiveActions.id, id), eq(correctiveActions.userId, userId)));
    return true;
  }

  // Clinic Visits (Digital Medical Passport)
  async createClinicVisit(visit: InsertClinicVisit): Promise<ClinicVisit> {
    const [created] = await db.insert(clinicVisits).values(visit).returning();
    return created;
  }

  async getClinicVisitByToken(token: string): Promise<ClinicVisit | undefined> {
    const [visit] = await db.select().from(clinicVisits).where(eq(clinicVisits.passportToken, token));
    return visit;
  }

  async getClinicVisitsByEmployee(employeeId: number, userId: string): Promise<ClinicVisit[]> {
    return db.select().from(clinicVisits)
      .where(and(eq(clinicVisits.employeeId, employeeId), eq(clinicVisits.userId, userId)))
      .orderBy(desc(clinicVisits.checkedInAt));
  }

  async getClinicVisitsByUser(userId: string): Promise<ClinicVisit[]> {
    return db.select().from(clinicVisits)
      .where(eq(clinicVisits.userId, userId))
      .orderBy(desc(clinicVisits.checkedInAt));
  }

  async updateClinicVisit(id: number, updates: Partial<InsertClinicVisit>): Promise<ClinicVisit | undefined> {
    const [updated] = await db.update(clinicVisits).set(updates).where(eq(clinicVisits.id, id)).returning();
    return updated;
  }

  async getEmployeeByIdPublic(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  // Superadmin functions
  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async isSuperadmin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.isSuperadmin === true;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async getNewSignupsThisWeek(): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const result = await db.select({ count: count() }).from(users).where(gte(users.createdAt, oneWeekAgo));
    return result[0]?.count || 0;
  }

  async getUserGrowthLast30Days(): Promise<{ date: string; count: number }[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db.execute(sql`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM users
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    return (result.rows as any[]).map(row => ({
      date: row.date,
      count: row.count
    }));
  }

  async getRetainerRequests(): Promise<ContactInquiry[]> {
    return db.select().from(contactInquiries)
      .where(and(
        eq(contactInquiries.inquiryType, 'retainer'),
        eq(contactInquiries.status, 'new')
      ))
      .orderBy(desc(contactInquiries.createdAt));
  }

  async getAuthorizationForms(userId: string): Promise<AuthorizationForm[]> {
    return db.select().from(authorizationForms)
      .where(eq(authorizationForms.userId, userId))
      .orderBy(authorizationForms.visitType);
  }

  async getAuthorizationFormByVisitType(userId: string, visitType: string): Promise<AuthorizationForm | undefined> {
    const [form] = await db.select().from(authorizationForms)
      .where(and(
        eq(authorizationForms.userId, userId),
        eq(authorizationForms.visitType, visitType)
      ));
    return form;
  }

  async upsertAuthorizationForm(form: InsertAuthorizationForm): Promise<AuthorizationForm> {
    const existing = await this.getAuthorizationFormByVisitType(form.userId, form.visitType);
    if (existing) {
      const [updated] = await db.update(authorizationForms)
        .set({ formName: form.formName, fileData: form.fileData, fileSize: form.fileSize, uploadedAt: new Date() })
        .where(eq(authorizationForms.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(authorizationForms).values(form).returning();
    return created;
  }

  async deleteAuthorizationForm(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(authorizationForms)
      .where(and(
        eq(authorizationForms.id, id),
        eq(authorizationForms.userId, userId)
      ));
    return true;
  }

  async setSuperadmin(userId: string, isSuperadminFlag: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isSuperadmin: isSuperadminFlag, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
