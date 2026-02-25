import { leads, subscriptions, questionUsage, trialLeads, siteVisits, contactInquiries, employees, incidents, correctiveActions, actionItems, auditReadiness, auditChecklistItems, companyProfiles, users, clinicVisits, authorizationForms, clinicLocations, clinicEngagement, clinicAgreements, courses, courseModules, courseLessons, quizQuestions, courseEnrollments, lessonProgress, quizAttempts, courseCertificates, trainingAssignments, newHireCompletions, coreyTeams, coreyTeamMembers, recordabilityUsage, type InsertLead, type Lead, type InsertSubscription, type Subscription, type QuestionUsage, type TrialLead, type InsertTrialLead, type SiteVisit, type InsertContactInquiry, type ContactInquiry, type Employee, type InsertEmployee, type Incident, type InsertIncident, type CorrectiveAction, type InsertCorrectiveAction, type ActionItem, type InsertActionItem, type AuditReadiness, type InsertAuditReadiness, type AuditChecklistItem, type CompanyProfile, type InsertCompanyProfile, type User, type ClinicVisit, type InsertClinicVisit, type AuthorizationForm, type InsertAuthorizationForm, type ClinicLocation, type InsertClinicLocation, type ClinicEngagement, type InsertClinicEngagement, type ClinicAgreement, type InsertClinicAgreement, type Course, type InsertCourse, type CourseModule, type InsertCourseModule, type CourseLesson, type InsertCourseLesson, type QuizQuestion, type InsertQuizQuestion, type CourseEnrollment, type InsertCourseEnrollment, type LessonProgress, type InsertLessonProgress, type QuizAttempt, type InsertQuizAttempt, type CourseCertificate, type InsertCourseCertificate, type TrainingAssignment, type InsertTrainingAssignment, type NewHireCompletion, type InsertNewHireCompletion, type CoreyTeam, type InsertCoreyTeam, type CoreyTeamMember, type InsertCoreyTeamMember } from "@shared/schema";
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

  // Trial Leads
  getTrialLeadByEmail(email: string): Promise<TrialLead | undefined>;
  getAllTrialLeads(): Promise<TrialLead[]>;
  createTrialLead(lead: InsertTrialLead): Promise<TrialLead>;
  incrementTrialQuestionCount(email: string): Promise<TrialLead | undefined>;

  // Site Visits
  recordPageVisit(page: string): Promise<void>;
  getSiteVisitStats(): Promise<{ totalVisits: number; todayVisits: number; last30Days: { date: string; count: number }[]; topPages: { page: string; count: number }[] }>;

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
  updateClinicVisit(id: number, updates: Partial<InsertClinicVisit> & { notifiedAt?: Date; returnedAt?: Date }): Promise<ClinicVisit | undefined>;
  deleteClinicVisit(id: number, userId: string): Promise<boolean>;
  getEmployeeByIdPublic(id: number): Promise<Employee | undefined>;

  // Clinic Locations
  getClinicLocations(userId: string): Promise<ClinicLocation[]>;
  getClinicLocationById(id: number): Promise<ClinicLocation | undefined>;
  createClinicLocation(location: InsertClinicLocation): Promise<ClinicLocation>;
  updateClinicLocation(id: number, userId: string, updates: Partial<InsertClinicLocation>): Promise<ClinicLocation | undefined>;
  deleteClinicLocation(id: number, userId: string): Promise<boolean>;

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
  getCompanyUsageStats(): Promise<any[]>;

  // Clinic Agreements
  createClinicAgreement(agreement: InsertClinicAgreement): Promise<ClinicAgreement>;
  getClinicAgreements(): Promise<ClinicAgreement[]>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | undefined>;
  getCourseByProductId(productId: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Course Modules
  getModulesByCourse(courseId: number): Promise<CourseModule[]>;
  getModuleById(id: number): Promise<CourseModule | undefined>;
  createModule(mod: InsertCourseModule): Promise<CourseModule>;

  // Course Lessons
  getLessonsByModule(moduleId: number): Promise<CourseLesson[]>;
  getLessonById(id: number): Promise<CourseLesson | undefined>;
  createLesson(lesson: InsertCourseLesson): Promise<CourseLesson>;

  // Quiz Questions
  getQuizQuestionsByModule(moduleId: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;

  // Enrollments
  getEnrollment(userId: string, courseId: number): Promise<CourseEnrollment | undefined>;
  getEnrollmentsByUser(userId: string): Promise<CourseEnrollment[]>;
  createEnrollment(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  updateEnrollment(id: number, updates: Partial<CourseEnrollment>): Promise<CourseEnrollment | undefined>;

  // Lesson Progress
  getLessonProgress(userId: string, courseId: number): Promise<LessonProgress[]>;
  markLessonComplete(userId: string, lessonId: number, moduleId: number, courseId: number): Promise<LessonProgress>;

  // Quiz Attempts
  getQuizAttempts(userId: string, moduleId: number): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;

  // Certificates
  getCertificate(userId: string, courseId: number): Promise<CourseCertificate | undefined>;
  getCertificatesByUser(userId: string): Promise<CourseCertificate[]>;
  createCertificate(cert: InsertCourseCertificate): Promise<CourseCertificate>;
  getCertificateByNumber(certNumber: string): Promise<CourseCertificate | undefined>;

  // Training Assignments
  createTrainingAssignment(assignment: InsertTrainingAssignment): Promise<TrainingAssignment>;
  getTrainingAssignmentsByEmployer(employerUserId: string): Promise<TrainingAssignment[]>;
  getTrainingAssignmentByToken(token: string): Promise<TrainingAssignment | undefined>;
  getTrainingAssignmentById(id: number, employerUserId: string): Promise<TrainingAssignment | undefined>;
  updateTrainingAssignment(id: number, updates: Partial<TrainingAssignment>): Promise<TrainingAssignment | undefined>;
  getTrainingAssignmentByEmployeeAndCourse(employerUserId: string, employeeId: number, courseId: number): Promise<TrainingAssignment | undefined>;
  getNewHireAssignmentsByEmployee(employerUserId: string, employeeId: number): Promise<TrainingAssignment[]>;

  // New Hire Completions
  createNewHireCompletion(completion: InsertNewHireCompletion): Promise<NewHireCompletion>;
  getNewHireCompletionsByEmployer(employerUserId: string): Promise<NewHireCompletion[]>;
  getNewHireCompletionByEmployee(employerUserId: string, employeeId: number): Promise<NewHireCompletion | undefined>;
  updateNewHireCompletion(id: number, updates: Partial<NewHireCompletion>): Promise<NewHireCompletion | undefined>;

  // Corey Team Seats
  getTeamByAdmin(adminUserId: string): Promise<CoreyTeam | undefined>;
  getTeamMembership(userId: string): Promise<{ team: CoreyTeam; member: CoreyTeamMember } | undefined>;
  createTeam(team: InsertCoreyTeam): Promise<CoreyTeam>;
  updateTeamSeats(teamId: number, totalSeats: number): Promise<CoreyTeam | undefined>;
  updateTeamSubscription(teamId: number, stripeSubscriptionId: string, stripeCustomerId: string, status: string): Promise<CoreyTeam | undefined>;
  getTeamById(teamId: number): Promise<CoreyTeam | undefined>;
  getTeamMembers(teamId: number): Promise<CoreyTeamMember[]>;
  addTeamMember(member: InsertCoreyTeamMember): Promise<CoreyTeamMember>;
  removeTeamMember(memberId: number, teamId: number): Promise<CoreyTeamMember | undefined>;
  getTeamMemberByEmail(teamId: number, email: string): Promise<CoreyTeamMember | undefined>;
  getTeamMemberByToken(inviteToken: string): Promise<CoreyTeamMember | undefined>;
  activateTeamMember(memberId: number, userId: string): Promise<CoreyTeamMember | undefined>;
  getActiveTeamMemberCount(teamId: number): Promise<number>;
  getRecordabilityUsageCount(ipAddress: string): Promise<number>;
  addRecordabilityUsage(ipAddress: string): Promise<void>;
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

  async getTrialLeadByEmail(email: string): Promise<TrialLead | undefined> {
    const [lead] = await db.select().from(trialLeads).where(eq(trialLeads.email, email.toLowerCase()));
    return lead;
  }

  async getAllTrialLeads(): Promise<TrialLead[]> {
    return db.select().from(trialLeads).orderBy(desc(trialLeads.createdAt));
  }

  async createTrialLead(lead: InsertTrialLead): Promise<TrialLead> {
    const [newLead] = await db.insert(trialLeads).values({ ...lead, email: lead.email.toLowerCase() }).returning();
    return newLead;
  }

  async incrementTrialQuestionCount(email: string): Promise<TrialLead | undefined> {
    const existing = await this.getTrialLeadByEmail(email.toLowerCase());
    if (!existing) return undefined;
    const [updated] = await db
      .update(trialLeads)
      .set({ questionCount: existing.questionCount + 1 })
      .where(eq(trialLeads.id, existing.id))
      .returning();
    return updated;
  }

  async recordPageVisit(page: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const [existing] = await db.select().from(siteVisits).where(and(eq(siteVisits.page, page), eq(siteVisits.visitDate, today)));
    if (existing) {
      await db.update(siteVisits).set({ visitCount: existing.visitCount + 1 }).where(eq(siteVisits.id, existing.id));
    } else {
      await db.insert(siteVisits).values({ page, visitDate: today, visitCount: 1 });
    }
  }

  async getSiteVisitStats(): Promise<{ totalVisits: number; todayVisits: number; last30Days: { date: string; count: number }[]; topPages: { page: string; count: number }[] }> {
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const allVisits = await db.select().from(siteVisits);

    let totalVisits = 0;
    let todayVisits = 0;
    const dailyMap = new Map<string, number>();
    const pageMap = new Map<string, number>();

    for (const v of allVisits) {
      totalVisits += v.visitCount;
      if (v.visitDate === today) todayVisits += v.visitCount;
      if (v.visitDate >= thirtyDaysAgo) {
        dailyMap.set(v.visitDate, (dailyMap.get(v.visitDate) || 0) + v.visitCount);
      }
      pageMap.set(v.page, (pageMap.get(v.page) || 0) + v.visitCount);
    }

    const last30Days = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
    const topPages = Array.from(pageMap.entries()).map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    return { totalVisits, todayVisits, last30Days, topPages };
  }

  async getAuditChecklistItems(userId: string, category: string): Promise<AuditChecklistItem[]> {
    return await db.select().from(auditChecklistItems)
      .where(and(eq(auditChecklistItems.userId, userId), eq(auditChecklistItems.category, category)));
  }

  async toggleAuditChecklistItem(userId: string, category: string, itemKey: string): Promise<AuditChecklistItem> {
    const [existing] = await db.select().from(auditChecklistItems)
      .where(and(
        eq(auditChecklistItems.userId, userId),
        eq(auditChecklistItems.category, category),
        eq(auditChecklistItems.itemKey, itemKey)
      ));

    if (existing) {
      const newCompleted = !existing.completed;
      const [updated] = await db.update(auditChecklistItems)
        .set({ completed: newCompleted, completedAt: newCompleted ? new Date() : null })
        .where(eq(auditChecklistItems.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(auditChecklistItems)
        .values({ userId, category, itemKey, completed: true, completedAt: new Date() })
        .returning();
      return created;
    }
  }

  async getAuditReadinessByUser(userId: string): Promise<AuditReadiness[]> {
    return await db.select().from(auditReadiness).where(eq(auditReadiness.userId, userId));
  }

  async updateAuditReadiness(userId: string, category: string, completedItems: number, totalItems: number): Promise<void> {
    const [existing] = await db.select().from(auditReadiness)
      .where(and(eq(auditReadiness.userId, userId), eq(auditReadiness.category, category)));
    if (existing) {
      await db.update(auditReadiness)
        .set({ completedItems, totalItems, lastUpdated: new Date() })
        .where(eq(auditReadiness.id, existing.id));
    } else {
      await db.insert(auditReadiness).values({ userId, category, completedItems, totalItems });
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

  async updateClinicVisit(id: number, updates: Partial<InsertClinicVisit> & { notifiedAt?: Date; returnedAt?: Date }): Promise<ClinicVisit | undefined> {
    const [updated] = await db.update(clinicVisits).set(updates).where(eq(clinicVisits.id, id)).returning();
    return updated;
  }

  async deleteClinicVisit(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(clinicVisits).where(and(eq(clinicVisits.id, id), eq(clinicVisits.userId, userId))).returning();
    return result.length > 0;
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

  async getClinicLocations(userId: string): Promise<ClinicLocation[]> {
    return db.select().from(clinicLocations).where(eq(clinicLocations.userId, userId)).orderBy(clinicLocations.name);
  }

  async getClinicLocationById(id: number): Promise<ClinicLocation | undefined> {
    const [location] = await db.select().from(clinicLocations).where(eq(clinicLocations.id, id));
    return location;
  }

  async createClinicLocation(location: InsertClinicLocation): Promise<ClinicLocation> {
    const [created] = await db.insert(clinicLocations).values(location).returning();
    return created;
  }

  async updateClinicLocation(id: number, userId: string, updates: Partial<InsertClinicLocation>): Promise<ClinicLocation | undefined> {
    const [updated] = await db
      .update(clinicLocations)
      .set(updates)
      .where(and(eq(clinicLocations.id, id), eq(clinicLocations.userId, userId)))
      .returning();
    return updated;
  }

  async deleteClinicLocation(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(clinicLocations)
      .where(and(eq(clinicLocations.id, id), eq(clinicLocations.userId, userId)))
      .returning();
    return result.length > 0;
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

  async logClinicEngagement(entry: InsertClinicEngagement): Promise<ClinicEngagement> {
    const [created] = await db.insert(clinicEngagement).values(entry).returning();
    return created;
  }

  async getClinicEngagementByUser(userId: string): Promise<ClinicEngagement[]> {
    return db.select().from(clinicEngagement)
      .where(eq(clinicEngagement.userId, userId))
      .orderBy(desc(clinicEngagement.createdAt));
  }

  async getClinicEngagementByToken(token: string): Promise<ClinicEngagement[]> {
    return db.select().from(clinicEngagement)
      .where(eq(clinicEngagement.visitToken, token))
      .orderBy(desc(clinicEngagement.createdAt));
  }

  async setSuperadmin(userId: string, isSuperadminFlag: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isSuperadmin: isSuperadminFlag, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getCompanyUsageStats(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT 
        u.id as user_id,
        COALESCE(cp.company_name, CONCAT(u.first_name, ' ', u.last_name), u.email) as company_name,
        (SELECT COUNT(*) FROM conversations c WHERE c.user_id = u.id) as conversations_count,
        (SELECT COUNT(*) FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = u.id) as messages_count,
        (SELECT COUNT(*) FROM employees e WHERE e.user_id = u.id) as employees_count,
        (SELECT COUNT(*) FROM incidents i WHERE i.user_id = u.id) as incidents_count,
        (SELECT COUNT(*) FROM audit_checklist_items aci WHERE aci.user_id = u.id AND aci.completed = true) as audit_items_completed,
        (SELECT COUNT(*) FROM dot_notifications dn WHERE dn.user_id = u.id) as dot_notifications_count,
        (SELECT MAX(m.created_at) FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.user_id = u.id) as last_corey_activity,
        s.plan,
        s.status as plan_status
      FROM users u
      LEFT JOIN company_profiles cp ON cp.user_id = u.id
      LEFT JOIN subscriptions s ON s.user_id = u.id
      ORDER BY messages_count DESC
    `);
    return result.rows;
  }

  async createClinicAgreement(agreement: InsertClinicAgreement): Promise<ClinicAgreement> {
    const [created] = await db.insert(clinicAgreements).values(agreement).returning();
    return created;
  }

  async getClinicAgreements(): Promise<ClinicAgreement[]> {
    return db.select().from(clinicAgreements).orderBy(desc(clinicAgreements.createdAt));
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(courses.id);
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseByProductId(productId: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.productId, productId));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }

  // Course Modules
  async getModulesByCourse(courseId: number): Promise<CourseModule[]> {
    return db.select().from(courseModules).where(eq(courseModules.courseId, courseId)).orderBy(courseModules.orderIndex);
  }

  async getModuleById(id: number): Promise<CourseModule | undefined> {
    const [mod] = await db.select().from(courseModules).where(eq(courseModules.id, id));
    return mod;
  }

  async createModule(mod: InsertCourseModule): Promise<CourseModule> {
    const [created] = await db.insert(courseModules).values(mod).returning();
    return created;
  }

  // Course Lessons
  async getLessonsByModule(moduleId: number): Promise<CourseLesson[]> {
    return db.select().from(courseLessons).where(eq(courseLessons.moduleId, moduleId)).orderBy(courseLessons.orderIndex);
  }

  async getLessonById(id: number): Promise<CourseLesson | undefined> {
    const [lesson] = await db.select().from(courseLessons).where(eq(courseLessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertCourseLesson): Promise<CourseLesson> {
    const [created] = await db.insert(courseLessons).values(lesson).returning();
    return created;
  }

  // Quiz Questions
  async getQuizQuestionsByModule(moduleId: number): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.moduleId, moduleId)).orderBy(quizQuestions.orderIndex);
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [created] = await db.insert(quizQuestions).values(question).returning();
    return created;
  }

  // Enrollments
  async getEnrollment(userId: string, courseId: number): Promise<CourseEnrollment | undefined> {
    const [enrollment] = await db.select().from(courseEnrollments)
      .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, courseId)));
    return enrollment;
  }

  async getEnrollmentsByUser(userId: string): Promise<CourseEnrollment[]> {
    return db.select().from(courseEnrollments).where(eq(courseEnrollments.userId, userId)).orderBy(desc(courseEnrollments.enrolledAt));
  }

  async createEnrollment(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const [created] = await db.insert(courseEnrollments).values(enrollment).returning();
    return created;
  }

  async updateEnrollment(id: number, updates: Partial<CourseEnrollment>): Promise<CourseEnrollment | undefined> {
    const [updated] = await db.update(courseEnrollments).set(updates).where(eq(courseEnrollments.id, id)).returning();
    return updated;
  }

  // Lesson Progress
  async getLessonProgress(userId: string, courseId: number): Promise<LessonProgress[]> {
    return db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId)));
  }

  async markLessonComplete(userId: string, lessonId: number, moduleId: number, courseId: number): Promise<LessonProgress> {
    const existing = await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    if (existing.length > 0) {
      const [updated] = await db.update(lessonProgress)
        .set({ completed: true, completedAt: new Date() })
        .where(eq(lessonProgress.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(lessonProgress)
      .values({ userId, lessonId, moduleId, courseId, completed: true })
      .returning();
    return created;
  }

  // Quiz Attempts
  async getQuizAttempts(userId: string, moduleId: number): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.moduleId, moduleId)))
      .orderBy(desc(quizAttempts.attemptedAt));
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [created] = await db.insert(quizAttempts).values(attempt).returning();
    return created;
  }

  // Certificates
  async getCertificate(userId: string, courseId: number): Promise<CourseCertificate | undefined> {
    const [cert] = await db.select().from(courseCertificates)
      .where(and(eq(courseCertificates.userId, userId), eq(courseCertificates.courseId, courseId)));
    return cert;
  }

  async getCertificatesByUser(userId: string): Promise<CourseCertificate[]> {
    return db.select().from(courseCertificates).where(eq(courseCertificates.userId, userId)).orderBy(desc(courseCertificates.issuedAt));
  }

  async createCertificate(cert: InsertCourseCertificate): Promise<CourseCertificate> {
    const [created] = await db.insert(courseCertificates).values(cert).returning();
    return created;
  }

  async getCertificateByNumber(certNumber: string): Promise<CourseCertificate | undefined> {
    const [cert] = await db.select().from(courseCertificates)
      .where(eq(courseCertificates.certificateNumber, certNumber));
    return cert;
  }

  // Training Assignments
  async createTrainingAssignment(assignment: InsertTrainingAssignment): Promise<TrainingAssignment> {
    const [created] = await db.insert(trainingAssignments).values(assignment).returning();
    return created;
  }

  async getTrainingAssignmentsByEmployer(employerUserId: string): Promise<TrainingAssignment[]> {
    return db.select().from(trainingAssignments)
      .where(eq(trainingAssignments.employerUserId, employerUserId))
      .orderBy(desc(trainingAssignments.assignedAt));
  }

  async getTrainingAssignmentByToken(token: string): Promise<TrainingAssignment | undefined> {
    const [assignment] = await db.select().from(trainingAssignments)
      .where(eq(trainingAssignments.accessToken, token));
    return assignment;
  }

  async getTrainingAssignmentById(id: number, employerUserId: string): Promise<TrainingAssignment | undefined> {
    const [assignment] = await db.select().from(trainingAssignments)
      .where(and(eq(trainingAssignments.id, id), eq(trainingAssignments.employerUserId, employerUserId)));
    return assignment;
  }

  async updateTrainingAssignment(id: number, updates: Partial<TrainingAssignment>): Promise<TrainingAssignment | undefined> {
    const [updated] = await db.update(trainingAssignments)
      .set(updates)
      .where(eq(trainingAssignments.id, id))
      .returning();
    return updated;
  }

  async getTrainingAssignmentByEmployeeAndCourse(employerUserId: string, employeeId: number, courseId: number): Promise<TrainingAssignment | undefined> {
    const [assignment] = await db.select().from(trainingAssignments)
      .where(and(
        eq(trainingAssignments.employerUserId, employerUserId),
        eq(trainingAssignments.employeeId, employeeId),
        eq(trainingAssignments.courseId, courseId)
      ));
    return assignment;
  }

  async getNewHireAssignmentsByEmployee(employerUserId: string, employeeId: number): Promise<TrainingAssignment[]> {
    return db.select().from(trainingAssignments)
      .where(and(
        eq(trainingAssignments.employerUserId, employerUserId),
        eq(trainingAssignments.employeeId, employeeId),
        eq(trainingAssignments.assignmentType, "new_hire_onboarding")
      ))
      .orderBy(trainingAssignments.assignedAt);
  }

  async createNewHireCompletion(completion: InsertNewHireCompletion): Promise<NewHireCompletion> {
    const [created] = await db.insert(newHireCompletions).values(completion).returning();
    return created;
  }

  async getNewHireCompletionsByEmployer(employerUserId: string): Promise<NewHireCompletion[]> {
    return db.select().from(newHireCompletions)
      .where(eq(newHireCompletions.employerUserId, employerUserId))
      .orderBy(desc(newHireCompletions.completedAt));
  }

  async getNewHireCompletionByEmployee(employerUserId: string, employeeId: number): Promise<NewHireCompletion | undefined> {
    const [completion] = await db.select().from(newHireCompletions)
      .where(and(
        eq(newHireCompletions.employerUserId, employerUserId),
        eq(newHireCompletions.employeeId, employeeId)
      ));
    return completion;
  }

  async updateNewHireCompletion(id: number, updates: Partial<NewHireCompletion>): Promise<NewHireCompletion | undefined> {
    const [updated] = await db.update(newHireCompletions)
      .set(updates)
      .where(eq(newHireCompletions.id, id))
      .returning();
    return updated;
  }

  // Corey Team Seats
  async getTeamByAdmin(adminUserId: string): Promise<CoreyTeam | undefined> {
    const [team] = await db.select().from(coreyTeams).where(eq(coreyTeams.adminUserId, adminUserId));
    return team;
  }

  async getTeamMembership(userId: string): Promise<{ team: CoreyTeam; member: CoreyTeamMember } | undefined> {
    const adminTeam = await this.getTeamByAdmin(userId);
    if (adminTeam && adminTeam.status === "active" && adminTeam.stripeSubscriptionId) {
      const [adminMember] = await db.select().from(coreyTeamMembers)
        .where(and(
          eq(coreyTeamMembers.teamId, adminTeam.id),
          eq(coreyTeamMembers.userId, userId),
          eq(coreyTeamMembers.status, "active")
        ));
      if (adminMember) {
        return { team: adminTeam, member: adminMember };
      }
      return { team: adminTeam, member: { id: 0, teamId: adminTeam.id, userId, email: "", name: null, role: "admin", status: "active", inviteToken: null, invitedAt: null, joinedAt: null } as CoreyTeamMember };
    }
    const memberRows = await db.select({ team: coreyTeams, member: coreyTeamMembers })
      .from(coreyTeamMembers)
      .innerJoin(coreyTeams, eq(coreyTeamMembers.teamId, coreyTeams.id))
      .where(and(
        eq(coreyTeamMembers.userId, userId),
        eq(coreyTeamMembers.status, "active"),
        eq(coreyTeams.status, "active"),
        sql`${coreyTeams.stripeSubscriptionId} IS NOT NULL`
      ));
    if (memberRows.length > 0) {
      return memberRows[0];
    }
    return undefined;
  }

  async createTeam(team: InsertCoreyTeam): Promise<CoreyTeam> {
    const [created] = await db.insert(coreyTeams).values(team).returning();
    return created;
  }

  async updateTeamSeats(teamId: number, totalSeats: number): Promise<CoreyTeam | undefined> {
    const [updated] = await db.update(coreyTeams)
      .set({ totalSeats, updatedAt: new Date() })
      .where(eq(coreyTeams.id, teamId))
      .returning();
    return updated;
  }

  async updateTeamSubscription(teamId: number, stripeSubscriptionId: string, stripeCustomerId: string, status: string): Promise<CoreyTeam | undefined> {
    const [updated] = await db.update(coreyTeams)
      .set({ stripeSubscriptionId, stripeCustomerId, status, updatedAt: new Date() })
      .where(eq(coreyTeams.id, teamId))
      .returning();
    return updated;
  }

  async getTeamById(teamId: number): Promise<CoreyTeam | undefined> {
    const [team] = await db.select().from(coreyTeams).where(eq(coreyTeams.id, teamId));
    return team;
  }

  async getTeamMembers(teamId: number): Promise<CoreyTeamMember[]> {
    return db.select().from(coreyTeamMembers)
      .where(eq(coreyTeamMembers.teamId, teamId))
      .orderBy(coreyTeamMembers.invitedAt);
  }

  async addTeamMember(member: InsertCoreyTeamMember): Promise<CoreyTeamMember> {
    const [created] = await db.insert(coreyTeamMembers).values(member).returning();
    return created;
  }

  async removeTeamMember(memberId: number, teamId: number): Promise<CoreyTeamMember | undefined> {
    const [updated] = await db.update(coreyTeamMembers)
      .set({ status: "removed" })
      .where(and(eq(coreyTeamMembers.id, memberId), eq(coreyTeamMembers.teamId, teamId)))
      .returning();
    return updated;
  }

  async getTeamMemberByEmail(teamId: number, email: string): Promise<CoreyTeamMember | undefined> {
    const [member] = await db.select().from(coreyTeamMembers)
      .where(and(eq(coreyTeamMembers.teamId, teamId), eq(coreyTeamMembers.email, email)));
    return member;
  }

  async getTeamMemberByToken(inviteToken: string): Promise<CoreyTeamMember | undefined> {
    const [member] = await db.select().from(coreyTeamMembers)
      .where(eq(coreyTeamMembers.inviteToken, inviteToken));
    return member;
  }

  async activateTeamMember(memberId: number, userId: string): Promise<CoreyTeamMember | undefined> {
    const [updated] = await db.update(coreyTeamMembers)
      .set({ userId, status: "active", joinedAt: new Date() })
      .where(eq(coreyTeamMembers.id, memberId))
      .returning();
    return updated;
  }

  async getActiveTeamMemberCount(teamId: number): Promise<number> {
    const result = await db.select({ count: count() }).from(coreyTeamMembers)
      .where(and(
        eq(coreyTeamMembers.teamId, teamId),
        sql`${coreyTeamMembers.status} IN ('active', 'invited')`
      ));
    return result[0]?.count || 0;
  }

  async getRecordabilityUsageCount(ipAddress: string): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const result = await db.select({ count: count() }).from(recordabilityUsage)
      .where(and(
        eq(recordabilityUsage.ipAddress, ipAddress),
        gte(recordabilityUsage.usedAt, todayStart)
      ));
    return result[0]?.count || 0;
  }

  async addRecordabilityUsage(ipAddress: string): Promise<void> {
    await db.insert(recordabilityUsage).values({ ipAddress });
  }
}

export const storage = new DatabaseStorage();
