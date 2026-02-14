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

// Recordable Incidents - OSHA 300 Log
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Company/manager who owns this record
  employeeId: integer("employee_id"), // Optional link to employee
  caseNumber: text("case_number"), // OSHA case number (auto-generated or manual)
  incidentDate: timestamp("incident_date").notNull(),
  description: text("description").notNull(),
  incidentType: text("incident_type").notNull(), // 'injury', 'illness', 'near_miss', 'property_damage'
  // OSHA 300 Required Fields
  employeeName: text("employee_name"), // Name of injured/ill employee
  jobTitle: text("job_title"), // Job title at time of incident
  department: text("department"), // Department/location where incident occurred
  location: text("location"), // Specific location of event
  bodyPart: text("body_part"), // Part of body affected
  natureOfInjury: text("nature_of_injury"), // Nature of injury/illness
  objectOrSubstance: text("object_or_substance"), // Object/substance that harmed employee
  // Classification
  isRecordable: boolean("is_recordable").default(false),
  resultedInDeath: boolean("resulted_in_death").default(false),
  daysAway: integer("days_away").default(0),
  daysRestricted: integer("days_restricted").default(0),
  daysJobTransfer: integer("days_job_transfer").default(0),
  isOtherRecordable: boolean("is_other_recordable").default(false), // Other recordable case
  // Tracking
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
  responsibleDepartment: text("responsible_department"),
  targetDate: timestamp("target_date"),
  completionDate: timestamp("completion_date"),
  verificationMethod: text("verification_method"), // How to verify effectiveness
  verificationDate: timestamp("verification_date"),
  verificationNotes: text("verification_notes"),
  priority: text("priority").notNull().default("medium"), // 'critical', 'high', 'medium', 'low'
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'completed', 'verified', 'closed'
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
  employeeId: integer("employee_id").notNull(),
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
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertTrainingAssignmentSchema = createInsertSchema(trainingAssignments).omit({ id: true, assignedAt: true, startedAt: true, completedAt: true });
export type TrainingAssignment = typeof trainingAssignments.$inferSelect;
export type InsertTrainingAssignment = z.infer<typeof insertTrainingAssignmentSchema>;

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
