import { pgTable, text, serial, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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
  status: text("status").notNull().default("inactive"), // 'active', 'inactive', 'cancelled', 'past_due'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  paddleCustomerId: text("paddle_customer_id"),
  paddleSubscriptionId: text("paddle_subscription_id"),
  plan: text("plan"), // 'pro_monthly', 'employer_monthly', 'iso_manager', etc.
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

// Paddle event audit log — every webhook event is recorded here for compliance
export const paddleEvents = pgTable("paddle_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  paddleEventId: text("paddle_event_id"),
  transactionId: text("transaction_id"),
  subscriptionId: text("subscription_id"),
  customerId: text("customer_id"),
  customerEmail: text("customer_email"),
  amountCents: integer("amount_cents"),
  currency: text("currency"),
  status: text("status"),
  payload: jsonb("payload"),
  processedAt: timestamp("processed_at").defaultNow(),
});

export type PaddleEvent = typeof paddleEvents.$inferSelect;
export type InsertPaddleEvent = typeof paddleEvents.$inferInsert;

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

// Trial leads - tracks name/email for free trial usage (prevents abuse)
export const trialLeads = pgTable("trial_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  questionCount: integer("question_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrialLeadSchema = createInsertSchema(trialLeads).omit({
  id: true,
  questionCount: true,
  createdAt: true,
});
export type TrialLead = typeof trialLeads.$inferSelect;
export type InsertTrialLead = z.infer<typeof insertTrialLeadSchema>;

// Site visits - tracks page visits for analytics
export const siteVisits = pgTable("site_visits", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  visitDate: text("visit_date").notNull(),
  visitCount: integer("visit_count").notNull().default(0),
});

export type SiteVisit = typeof siteVisits.$inferSelect;

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
  // Respiratory Medical Evaluation (29 CFR 1910.134)
  respiratoryExamDate: timestamp("respiratory_exam_date"),
  respiratoryExamExpiry: timestamp("respiratory_exam_expiry"),
  respiratoryStatus: text("respiratory_status").default("pending"), // 'current', 'expiring', 'expired', 'pending', 'na'
  // Respirator Fit Test (29 CFR 1910.134 — annual)
  fitTestDate: timestamp("fit_test_date"),
  fitTestExpiry: timestamp("fit_test_expiry"),
  fitTestStatus: text("fit_test_status").default("pending"),
  // Annual Audiometric Exam / Hearing Test (29 CFR 1910.95)
  hearingTestDate: timestamp("hearing_test_date"),
  hearingTestExpiry: timestamp("hearing_test_expiry"),
  hearingTestStatus: text("hearing_test_status").default("pending"),
  // Pulmonary Function Test / PFT (annual for respirator users)
  pftDate: timestamp("pft_date"),
  pftExpiry: timestamp("pft_expiry"),
  pftStatus: text("pft_status").default("pending"),
  // TB Test (Tuberculin Skin Test or IGRA)
  tbTestDate: timestamp("tb_test_date"),
  tbTestResult: text("tb_test_result"), // 'negative', 'positive', 'pending', 'na'
  // Hepatitis B Vaccine Series (29 CFR 1910.1030 — 3-dose: 0, 1 month, 6 months)
  hepBDose1Date: timestamp("hep_b_dose1_date"),
  hepBDose2Date: timestamp("hep_b_dose2_date"),
  hepBDose3Date: timestamp("hep_b_dose3_date"),
  hepBStatus: text("hep_b_status").default("pending"), // 'series_complete', 'in_progress', 'declined', 'pending', 'immune'
  // Hepatitis A Vaccine (2-dose series: 0, 6-12 months)
  hepADose1Date: timestamp("hep_a_dose1_date"),
  hepADose2Date: timestamp("hep_a_dose2_date"),
  hepAStatus: text("hep_a_status").default("pending"),
  // Hepatitis C Screening
  hepCScreenDate: timestamp("hep_c_screen_date"),
  hepCScreenResult: text("hep_c_screen_result"), // 'negative', 'positive', 'pending', 'na'
  // Tetanus / Tdap (every 10 years)
  tetanusDate: timestamp("tetanus_date"),
  tetanusExpiry: timestamp("tetanus_expiry"),
  // Vision Test
  visionTestDate: timestamp("vision_test_date"),
  visionTestExpiry: timestamp("vision_test_expiry"),
  visionTestStatus: text("vision_test_status").default("pending"),
  // Drug Testing
  lastDrugTest: timestamp("last_drug_test"),
  drugTestResult: text("drug_test_result"), // 'cleared', 'pending', 'failed', 'scheduled'
  randomPoolIncluded: boolean("random_pool_included").default(false),
  // DOT Document upload
  dotCardImageUrl: text("dot_card_image_url"),
  dotCardUploadedAt: timestamp("dot_card_uploaded_at"),
  // Phone number for SMS notifications
  phoneNumber: text("phone_number"),
  // Notification tracking
  lastNotificationSent: timestamp("last_notification_sent"),
  notificationsSent: integer("notifications_sent").default(0),
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
  fitTestDate: dateOrStringToDate,
  fitTestExpiry: dateOrStringToDate,
  hearingTestDate: dateOrStringToDate,
  hearingTestExpiry: dateOrStringToDate,
  pftDate: dateOrStringToDate,
  pftExpiry: dateOrStringToDate,
  tbTestDate: dateOrStringToDate,
  hepBDose1Date: dateOrStringToDate,
  hepBDose2Date: dateOrStringToDate,
  hepBDose3Date: dateOrStringToDate,
  hepADose1Date: dateOrStringToDate,
  hepADose2Date: dateOrStringToDate,
  hepCScreenDate: dateOrStringToDate,
  tetanusDate: dateOrStringToDate,
  tetanusExpiry: dateOrStringToDate,
  visionTestDate: dateOrStringToDate,
  visionTestExpiry: dateOrStringToDate,
  lastDrugTest: dateOrStringToDate,
  dotCardUploadedAt: dateOrStringToDate,
  lastNotificationSent: dateOrStringToDate,
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Recordable Incidents - OSHA 300 Log + FROI / Workers' Comp
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  employeeId: integer("employee_id"),
  caseNumber: text("case_number"),
  incidentDate: timestamp("incident_date").notNull(),
  description: text("description").notNull(),
  incidentType: text("incident_type").notNull(),
  // OSHA 300 Required Fields
  employeeName: text("employee_name"),
  jobTitle: text("job_title"),
  facility: text("facility"),
  department: text("department"),
  location: text("location"),
  bodyPart: text("body_part"),
  bodySide: text("body_side"),
  natureOfInjury: text("nature_of_injury"),
  objectOrSubstance: text("object_or_substance"),
  // Classification
  isRecordable: boolean("is_recordable").default(false),
  resultedInDeath: boolean("resulted_in_death").default(false),
  daysAway: integer("days_away").default(0),
  daysRestricted: integer("days_restricted").default(0),
  daysJobTransfer: integer("days_job_transfer").default(0),
  isOtherRecordable: boolean("is_other_recordable").default(false),
  // Tracking
  status: text("status").notNull().default("pending_review"),
  createdAt: timestamp("created_at").defaultNow(),

  // ── FROI / Workers' Comp Additional Fields ─────────────────────────────────
  // Employee Personal Data
  employeeSsnLast4: text("employee_ssn_last4"),
  employeeDob: text("employee_dob"),
  employeeSex: text("employee_sex"),
  employeePhone: text("employee_phone"),
  employeeAddress: text("employee_address"),
  employeeHireDate: text("employee_hire_date"),
  employeeDependents: integer("employee_dependents"),
  employeeTaxStatus: text("employee_tax_status"),
  // Wage & Employment
  grossWeeklyWage: text("gross_weekly_wage"),
  weeksWorked: integer("weeks_worked"),
  fringeBenefitsValue: text("fringe_benefits_value"),
  isVolunteer: boolean("is_volunteer").default(false),
  isVocationallyHandicapped: boolean("is_vocationally_handicapped").default(false),
  // Employer / Insurance / Carrier
  fein: text("fein"),
  uiNumber: text("ui_number"),
  sicNaicsCode: text("sic_naics_code"),
  insuranceCompany: text("insurance_company"),
  insurancePhone: text("insurance_phone"),
  policyNumber: text("policy_number"),
  tpaName: text("tpa_name"),
  // Incident Timing & Location
  timeWorkBegan: text("time_work_began"),
  timeOfEvent: text("time_of_event"),
  injuryCity: text("injury_city"),
  injuryState: text("injury_state"),
  injuryCounty: text("injury_county"),
  onEmployerPremises: boolean("on_employer_premises").default(true),
  whatEmployeeWasDoing: text("what_employee_was_doing"),
  howInjuryOccurred: text("how_injury_occurred"),
  // Medical Treatment
  physicianName: text("physician_name"),
  treatmentFacility: text("treatment_facility"),
  treatedInEr: boolean("treated_in_er").default(false),
  hospitalizedOvernight: boolean("hospitalized_overnight").default(false),
  treatmentAddress: text("treatment_address"),
  // WC Key Dates
  lastDayWorked: text("last_day_worked"),
  firstDayMissed: text("first_day_missed"),
  returnToWorkDate: text("return_to_work_date"),
  deathDate: text("death_date"),
  dateEmployerNotified: text("date_employer_notified"),
  // ── Enhanced Analytics Fields ──────────────────────────────────────────────
  shiftTime: text("shift_time"),                 // 'Day Shift' | 'Swing Shift' | 'Night Shift' | 'Overtime'
  taskBeingPerformed: text("task_being_performed"), // 'Regular Duties' | 'New Task' | etc.
  rootCauseCategory: text("root_cause_category"), // 'Human Error' | 'Equipment Failure' | etc.
  ppeStatus: text("ppe_status"),                 // 'Worn Correctly' | 'Not Worn' | etc.
  contributingFactor: text("contributing_factor"), // 'Fatigue' | 'Rushing' | etc.
  employeeTenure: text("employee_tenure"),        // '< 30 days' | '30–90 days' | etc.
  employmentType: text("employment_type"),        // 'Full-time' | 'Part-time' | 'Contractor' | etc.
  medicalTreatmentType: text("medical_treatment_type"), // 'First Aid Only' | 'Emergency Room' | etc.
  drugTestAdministered: text("drug_test_administered"), // 'Yes' | 'No' | 'Refused' | 'Not Required'
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

// Corrective Action Plans (CAPA)
export const correctiveActions = pgTable("corrective_actions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  incidentId: integer("incident_id"), // Optional link to related incident
  title: text("title").notNull(),
  problemStatement: text("problem_statement").notNull(), // What happened
  rootCause: text("root_cause"), // Why it happened
  immediateActions: text("immediate_actions"), // Actions taken immediately
  correctiveActions: text("corrective_actions"), // Long-term fixes
  preventiveActions: text("preventive_actions"), // Prevent recurrence
  responsiblePerson: text("responsible_person"),
  responsiblePhone: text("responsible_phone"), // phone number of responsible person for SMS
  responsibleEmail: text("responsible_email"), // email of responsible person for email notifications
  responsibleDepartment: text("responsible_department"),
  targetDate: timestamp("target_date"),
  completionDate: timestamp("completion_date"),
  verificationMethod: text("verification_method"), // How to verify effectiveness
  verificationDate: timestamp("verification_date"),
  verificationNotes: text("verification_notes"),
  effectivenessResult: text("effectiveness_result"), // values: 'pending', 'effective', 'not_effective'
  priority: text("priority").notNull().default("medium"), // 'critical', 'high', 'medium', 'low'
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'completed', 'verified', 'closed'
  overdueNotifiedAt: timestamp("overdue_notified_at"), // prevents repeat overdue emails (max once per 24h)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCorrectiveActionSchema = createInsertSchema(correctiveActions, {
  targetDate: dateOrStringToDate,
  completionDate: dateOrStringToDate,
  verificationDate: dateOrStringToDate,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CorrectiveAction = typeof correctiveActions.$inferSelect;
export type InsertCorrectiveAction = z.infer<typeof insertCorrectiveActionSchema>;

// Nonconformances Table
export const nonconformances = pgTable("nonconformances", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  isoProjectId: integer("iso_project_id"), // optional FK to iso_projects
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(), // 'customer_complaint', 'internal_audit', 'external_audit', 'supplier', 'process_observation', 'management_review', 'other'
  description: text("description").notNull(),
  isoClause: text("iso_clause"), // e.g. "ISO 9001:2015 Clause 8.7"
  severity: text("severity").notNull().default('minor'), // 'critical', 'major', 'minor', 'observation'
  detectedBy: text("detected_by"),
  detectedDate: timestamp("detected_date").notNull().defaultNow(),
  responsiblePerson: text("responsible_person"),
  responsiblePhone: text("responsible_phone"),
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default('open'), // 'open', 'root_cause_identified', 'action_in_progress', 'effectiveness_pending', 'closed'
  rootCause: text("root_cause"),
  immediateContainment: text("immediate_containment"),
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  verificationMethod: text("verification_method"),
  closureDate: timestamp("closure_date"),
  closureNotes: text("closure_notes"),
  effectivenessResult: text("effectiveness_result"), // 'pending', 'effective', 'not_effective'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNonconformanceSchema = createInsertSchema(nonconformances, {
  detectedDate: dateOrStringToDate,
  targetDate: dateOrStringToDate,
  closureDate: dateOrStringToDate,
}).omit({
  id: true,
  createdAt: true,
});

export type Nonconformance = typeof nonconformances.$inferSelect;
export type InsertNonconformance = z.infer<typeof insertNonconformanceSchema>;

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

// Audit Checklist Items (per-user completion tracking)
export const auditChecklistItems = pgTable("audit_checklist_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(), // 'osha', 'dot', 'iso_9001', 'iso_14001', 'iso_45001'
  itemKey: text("item_key").notNull(), // unique identifier for the checklist item within category
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
});

export const insertAuditChecklistItemSchema = createInsertSchema(auditChecklistItems).omit({
  id: true,
  completedAt: true,
});
export type AuditChecklistItem = typeof auditChecklistItems.$inferSelect;
export type InsertAuditChecklistItem = z.infer<typeof insertAuditChecklistItemSchema>;

// Company Profile
export const companyProfiles = pgTable("company_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // One profile per user/company
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  employeeCount: text("employee_count"), // '1-10', '11-50', '51-100', '101-500', '500+'
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  naicsCode: text("naics_code"), // Industry classification for OSHA
  dotNumber: text("dot_number"), // For trucking/transportation
  // DER (Designated Employer Representative) contact info
  derName: text("der_name"),
  derPhone: text("der_phone"),
  derEmail: text("der_email"),
  // Workers' Compensation contact
  workersCompContact: text("workers_comp_contact"), // Name of WC agent/carrier contact
  workersCompEmail: text("workers_comp_email"), // Email for incident notifications to WC carrier
  // Company logo (stored as base64 data URL or external URL)
  logoUrl: text("logo_url"),
  // Primary Occupational Health Clinic
  clinicName: text("clinic_name"),
  clinicAddress: text("clinic_address"),
  clinicCity: text("clinic_city"),
  clinicState: text("clinic_state"),
  clinicZipCode: text("clinic_zip_code"),
  clinicPhone: text("clinic_phone"),
  clinicHours: text("clinic_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;

// ISO Project — stores the 3-phase onboarding wizard state for the ISO Manager
export const isoProjects = pgTable("iso_projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  standard: text("standard").notNull().default("ISO 9001"),
  phase: integer("phase").notNull().default(1),
  status: text("status").notNull().default("in_progress"),
  // Phase 1 — Organizational Context
  orgName: text("org_name"),
  orgAddress: text("org_address"),
  totalEmployees: integer("total_employees"),
  productionEmployees: integer("production_employees"),
  adminEmployees: integer("admin_employees"),
  productsServices: text("products_services"),
  manufacturingTech: text("manufacturing_tech").array(),
  hasDesignResponsibility: boolean("has_design_responsibility"),
  // Phase 2 — Process Architecture (JSON array)
  processes: jsonb("processes").$type<Array<{
    name: string;
    owner: string;
    kpi: string;
    inputs: string;
    outputs: string;
    clauses: string[];
  }>>(),
  // Phase 3 — Quality Manual Gap Filler
  coreValues: text("core_values").array(),
  riskPhilosophy: text("risk_philosophy").array(),
  oemSuppliers: text("oem_suppliers").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIsoProjectSchema = createInsertSchema(isoProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type IsoProject = typeof isoProjects.$inferSelect;
export type InsertIsoProject = z.infer<typeof insertIsoProjectSchema>;

// ISO Documents table
export const isoDocuments = pgTable("iso_documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  isoProjectId: integer("iso_project_id"),
  docType: text("doc_type").notNull(), // 'quality_manual', 'process_map', 'procedure', 'work_instruction', 'template', 'other'
  title: text("title").notNull(),
  content: text("content"),
  isoClause: text("iso_clause"),
  status: text("status").notNull().default('draft'), // 'draft', 'in_review', 'approved', 'obsolete'
  version: text("version").notNull().default('1.0'),
  approvedBy: text("approved_by"),
  approvalDate: timestamp("approval_date"),
  reviewDate: timestamp("review_date"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIsoDocumentSchema = createInsertSchema(isoDocuments, {
  approvalDate: dateOrStringToDate,
  reviewDate: dateOrStringToDate,
}).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type IsoDocument = typeof isoDocuments.$inferSelect;
export type InsertIsoDocument = z.infer<typeof insertIsoDocumentSchema>;

// DOT Notification Log - tracks all notifications sent
export const dotNotifications = pgTable("dot_notifications", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  userId: text("user_id").notNull(), // Company that owns this employee
  notificationType: text("notification_type").notNull(), // '60_day', '30_day', '15_day', '7_day', 'manager_alert'
  channel: text("channel").notNull(), // 'sms', 'email', 'push'
  recipientPhone: text("recipient_phone"),
  recipientEmail: text("recipient_email"),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'delivered', 'failed'
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDotNotificationSchema = createInsertSchema(dotNotifications).omit({
  id: true,
  createdAt: true,
});
export type DotNotification = typeof dotNotifications.$inferSelect;
export type InsertDotNotification = z.infer<typeof insertDotNotificationSchema>;

// Clinic Visits - tracks QR-based clinic check-ins (Digital Medical Passport)
export const clinicVisits = pgTable("clinic_visits", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id"), // null for walk-in employees not in the system
  walkInName: text("walk_in_name"), // full name for walk-in employees
  userId: text("user_id").notNull(),
  passportToken: text("passport_token").notNull(),
  visitType: text("visit_type").notNull(), // 'dot_physical', 'drug_screen', 'respiratory_exam', 'injury', 'new_hire', 'other'
  clinicName: text("clinic_name"),
  clinicLocationId: integer("clinic_location_id"),
  status: text("status").notNull().default("checked_in"), // 'checked_in', 'in_progress', 'completed'
  employerNotified: boolean("employer_notified").default(false),
  authorizationName: text("authorization_name"),
  authorizationTitle: text("authorization_title"),
  authorizationPhone: text("authorization_phone"),
  notes: text("notes"),
  // Smart Authorization Form fields
  billingPreference: text("billing_preference"), // 'company_pay', 'employee_pay'
  specialInstructions: text("special_instructions"),
  additionalServices: text("additional_services").array(), // array of service codes
  ssnLast4: text("ssn_last4"), // last 4 digits of SSN
  employeeDob: text("employee_dob"), // date of birth as string
  employeeAddress: text("employee_address"),
  employeeLocation: text("employee_location"), // work location
  staffingAgency: text("staffing_agency"),
  signatureDataUrl: text("signature_data_url"), // base64 digital signature image
  checkedInAt: timestamp("checked_in_at").defaultNow(),
  notifiedAt: timestamp("notified_at"),
  returnedAt: timestamp("returned_at"),
  completedAt: timestamp("completed_at"),
});

export const insertClinicVisitSchema = createInsertSchema(clinicVisits).omit({
  id: true,
  checkedInAt: true,
  notifiedAt: true,
  returnedAt: true,
  completedAt: true,
});
export type ClinicVisit = typeof clinicVisits.$inferSelect;
export type InsertClinicVisit = z.infer<typeof insertClinicVisitSchema>;

// Clinic Locations - multiple clinic locations per company
export const clinicLocations = pgTable("clinic_locations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  phone: text("phone"),
  hours: text("hours"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClinicLocationSchema = createInsertSchema(clinicLocations).omit({
  id: true,
  createdAt: true,
});
export type ClinicLocation = typeof clinicLocations.$inferSelect;
export type InsertClinicLocation = z.infer<typeof insertClinicLocationSchema>;

// Authorization Forms - clinic forms uploaded by company per visit type
export const authorizationForms = pgTable("authorization_forms", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  visitType: text("visit_type").notNull(), // 'dot_physical', 'drug_screen', 'respiratory_exam', 'injury', 'new_hire', 'other', 'general'
  formName: text("form_name").notNull(),
  fileData: text("file_data").notNull(), // base64 data URL of the PDF
  fileSize: integer("file_size"), // bytes
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertAuthorizationFormSchema = createInsertSchema(authorizationForms).omit({
  id: true,
  uploadedAt: true,
});
export type AuthorizationForm = typeof authorizationForms.$inferSelect;
export type InsertAuthorizationForm = z.infer<typeof insertAuthorizationFormSchema>;

// Clinic Engagement Log - tracks BMA usage and clinic interactions
export const clinicEngagement = pgTable("clinic_engagement", {
  id: serial("id").primaryKey(),
  visitToken: text("visit_token"),
  clinicName: text("clinic_name"),
  commandUsed: text("command_used").notNull(),
  commandCategory: text("command_category"),
  patientLanguage: text("patient_language").default("spanish"),
  sessionDuration: integer("session_duration"),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClinicEngagementSchema = createInsertSchema(clinicEngagement).omit({
  id: true,
  createdAt: true,
});
export type ClinicEngagement = typeof clinicEngagement.$inferSelect;
export type InsertClinicEngagement = z.infer<typeof insertClinicEngagementSchema>;

// Clinic Partnership Agreements
export const clinicAgreements = pgTable("clinic_agreements", {
  id: serial("id").primaryKey(),
  clinicName: text("clinic_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  signatureData: text("signature_data").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").default("pending"),
  agreedAt: timestamp("agreed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClinicAgreementSchema = createInsertSchema(clinicAgreements).omit({
  id: true,
  createdAt: true,
});
export type ClinicAgreement = typeof clinicAgreements.$inferSelect;
export type InsertClinicAgreement = z.infer<typeof insertClinicAgreementSchema>;

// Training Courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull(), // Maps to products.ts id like 'course-dot-medical'
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'occupational_health', 'iso', 'osha', 'drug_testing'
  totalModules: integer("total_modules").notNull().default(0),
  estimatedHours: integer("estimated_hours").notNull().default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

// Course Modules (chapters)
export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
});

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true });
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;

// Course Lessons (sections within modules)
export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(), // HTML/markdown content
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"), // Optional video embed
});

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true });
export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;

// Quiz Questions (per module)
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // Array of answer choices
  correctIndex: integer("correct_index").notNull(), // Index of correct answer in options array
  explanation: text("explanation"), // Why the answer is correct
  orderIndex: integer("order_index").notNull(),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

// User Course Enrollments
export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'completed'
  progress: integer("progress").notNull().default(0), // Percentage 0-100
  currentModuleId: integer("current_module_id"),
  currentLessonId: integer("current_lesson_id"),
  completedAt: timestamp("completed_at"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true, enrolledAt: true, completedAt: true });
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;

// Lesson Progress (tracks which lessons a user has completed)
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  moduleId: integer("module_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
});

export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, completedAt: true });
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;

// Quiz Attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  moduleId: integer("module_id").notNull(),
  courseId: integer("course_id").notNull(),
  score: integer("score").notNull(), // Percentage 0-100
  passed: boolean("passed").notNull().default(false),
  answers: text("answers"), // JSON string of user's answers
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, attemptedAt: true });
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Course Certificates
export const courseCertificates = pgTable("course_certificates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  enrollmentId: integer("enrollment_id").notNull(),
  certificateNumber: text("certificate_number").notNull(),
  userName: text("user_name").notNull(),
  courseName: text("course_name").notNull(),
  issuedAt: timestamp("issued_at").defaultNow(),
});

export const insertCourseCertificateSchema = createInsertSchema(courseCertificates).omit({ id: true, issuedAt: true });
export type CourseCertificate = typeof courseCertificates.$inferSelect;
export type InsertCourseCertificate = z.infer<typeof insertCourseCertificateSchema>;

// Training Assignments (Employer assigns courses to employees)
export const trainingAssignments = pgTable("training_assignments", {
  id: serial("id").primaryKey(),
  employerUserId: text("employer_user_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  courseId: integer("course_id").notNull(),
  accessToken: text("access_token").notNull().unique(),
  status: text("status").notNull().default("assigned"), // 'assigned', 'in_progress', 'completed'
  progress: integer("progress").notNull().default(0),
  enrollmentUserId: text("enrollment_user_id"),
  assignmentType: text("assignment_type").notNull().default("standard"), // 'standard', 'new_hire_onboarding'
  deadline: timestamp("deadline"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertTrainingAssignmentSchema = createInsertSchema(trainingAssignments).omit({ id: true, assignedAt: true, startedAt: true, completedAt: true });
export type TrainingAssignment = typeof trainingAssignments.$inferSelect;
export type InsertTrainingAssignment = z.infer<typeof insertTrainingAssignmentSchema>;

// New Hire Onboarding Completions (BrandNSwag QR + Points)
export const newHireCompletions = pgTable("new_hire_completions", {
  id: serial("id").primaryKey(),
  employerUserId: text("employer_user_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  qrCodeData: text("qr_code_data").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(100),
  hrNotified: boolean("hr_notified").notNull().default(false),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertNewHireCompletionSchema = createInsertSchema(newHireCompletions).omit({ id: true, completedAt: true });
export type NewHireCompletion = typeof newHireCompletions.$inferSelect;
export type InsertNewHireCompletion = z.infer<typeof insertNewHireCompletionSchema>;

// Corey Team Seats (multi-user team billing)
export const coreyTeams = pgTable("corey_teams", {
  id: serial("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull(),
  companyName: text("company_name").notNull(),
  totalSeats: integer("total_seats").notNull().default(1),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCoreyTeamSchema = createInsertSchema(coreyTeams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CoreyTeam = typeof coreyTeams.$inferSelect;
export type InsertCoreyTeam = z.infer<typeof insertCoreyTeamSchema>;

// Team Members (invited users within a team)
export const coreyTeamMembers = pgTable("corey_team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: text("user_id"), // null until invite is accepted and user signs in
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").notNull().default("member"), // 'admin', 'supervisor', 'member'
  status: text("status").notNull().default("invited"), // 'invited', 'active', 'removed'
  inviteToken: text("invite_token"),
  departmentId: integer("department_id"), // nullable, assigned to a dept
  jobTitle: text("job_title"),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
});

// Team Departments
export const teamDepartments = pgTable("team_departments", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("blue"), // blue, green, orange, red, purple, yellow
  supervisorMemberId: integer("supervisor_member_id"), // ref to corey_team_members.id
  supervisorName: text("supervisor_name"),
  // Per-dept supervisor visibility toggles (drug test results are always hard-locked off)
  visibilitySettings: jsonb("visibility_settings").$type<{
    incidentSummary: boolean;   // see incidents occurred, date, type, OSHA recordable Y/N
    medicalDetails: boolean;    // see injury description, body part, treatment type
    restrictionDetails: boolean; // see work restrictions / RTW status
    capaDetails: boolean;       // see CAPA details for their dept
    trainingStatus: boolean;    // see training completion for their dept
  }>().default({ incidentSummary: true, medicalDetails: false, restrictionDetails: false, capaDetails: true, trainingStatus: true }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TeamDepartment = typeof teamDepartments.$inferSelect;
export type InsertTeamDepartment = typeof teamDepartments.$inferInsert;

// Team Announcements
export const teamAnnouncements = pgTable("team_announcements", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull().default("general"), // 'general', 'safety', 'policy', 'training', 'urgent'
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TeamAnnouncement = typeof teamAnnouncements.$inferSelect;
export type InsertTeamAnnouncement = typeof teamAnnouncements.$inferInsert;

export const insertCoreyTeamMemberSchema = createInsertSchema(coreyTeamMembers).omit({
  id: true,
  invitedAt: true,
  joinedAt: true,
});
export type CoreyTeamMember = typeof coreyTeamMembers.$inferSelect;
export type InsertCoreyTeamMember = z.infer<typeof insertCoreyTeamMemberSchema>;

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

export const recordabilityUsage = pgTable("recordability_usage", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export type RecordabilityUsage = typeof recordabilityUsage.$inferSelect;

// Isa subscriber profile — used to personalize standalone Isa AI conversations
export const isaProfiles = pgTable("isa_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  preferredName: text("preferred_name"),
  companyName: text("company_name"),
  role: text("role"),
  selectedStandards: text("selected_standards").array(),
  focusAreas: text("focus_areas").array(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIsaProfileSchema = createInsertSchema(isaProfiles).omit({ id: true, updatedAt: true });
export type IsaProfile = typeof isaProfiles.$inferSelect;
export type InsertIsaProfile = z.infer<typeof insertIsaProfileSchema>;

// Corey subscriber profile — used to personalize AI conversations
export const coreyProfiles = pgTable("corey_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  preferredName: text("preferred_name"),
  companyName: text("company_name"),
  role: text("role"),
  industry: text("industry"),
  employeeCount: text("employee_count"),
  state: text("state"),
  complianceFocus: text("compliance_focus").array(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCoreyProfileSchema = createInsertSchema(coreyProfiles).omit({ id: true, updatedAt: true });
export type CoreyProfile = typeof coreyProfiles.$inferSelect;
export type InsertCoreyProfile = z.infer<typeof insertCoreyProfileSchema>;
