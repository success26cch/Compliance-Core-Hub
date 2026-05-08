import { leads, subscriptions, questionUsage, trialLeads, siteVisits, contactInquiries, employees, incidents, correctiveActions, actionItems, auditReadiness, auditChecklistItems, companyProfiles, users, clinicVisits, authorizationForms, clinicLocations, clinicEngagement, clinicAgreements, courses, courseModules, courseLessons, quizQuestions, courseEnrollments, lessonProgress, quizAttempts, courseCertificates, trainingAssignments, newHireCompletions, coreyTeams, coreyTeamMembers, recordabilityUsage, isoProjects, coreyProfiles, isaProfiles, nonconformances, isoDocuments, paddleEvents, teamDepartments, teamAnnouncements, type InsertLead, type Lead, type InsertSubscription, type Subscription, type QuestionUsage, type TrialLead, type InsertTrialLead, type SiteVisit, type InsertContactInquiry, type ContactInquiry, type Employee, type InsertEmployee, type Incident, type InsertIncident, type CorrectiveAction, type InsertCorrectiveAction, type ActionItem, type InsertActionItem, type AuditReadiness, type InsertAuditReadiness, type AuditChecklistItem, type CompanyProfile, type InsertCompanyProfile, type User, type ClinicVisit, type InsertClinicVisit, type AuthorizationForm, type InsertAuthorizationForm, type ClinicLocation, type InsertClinicLocation, type ClinicEngagement, type InsertClinicEngagement, type ClinicAgreement, type InsertClinicAgreement, type Course, type InsertCourse, type CourseModule, type InsertCourseModule, type CourseLesson, type InsertCourseLesson, type QuizQuestion, type InsertQuizQuestion, type CourseEnrollment, type InsertCourseEnrollment, type LessonProgress, type InsertLessonProgress, type QuizAttempt, type InsertQuizAttempt, type CourseCertificate, type InsertCourseCertificate, type TrainingAssignment, type InsertTrainingAssignment, type NewHireCompletion, type InsertNewHireCompletion, type CoreyTeam, type InsertCoreyTeam, type CoreyTeamMember, type InsertCoreyTeamMember, type IsoProject, type InsertIsoProject, type CoreyProfile, type InsertCoreyProfile, type IsaProfile, type InsertIsaProfile, type Nonconformance, type IsoDocument, type InsertIsoDocument, type InsertNonconformance, type InsertPaddleEvent, type PaddleEvent, type TeamDepartment, type InsertTeamDepartment, type TeamAnnouncement, type InsertTeamAnnouncement,
  dotDrivers, dotDqDocuments, dotEquipment,
  dotRandomTests, dotAccidents, dotRoadsideInspections, dotDvirLogs,
  type DotDriver, type InsertDotDriver, type DotDqDocument, type InsertDotDqDocument, type DotEquipment, type InsertDotEquipment,
  type DotRandomTest, type InsertDotRandomTest,
  type DotAccident, type InsertDotAccident,
  type DotRoadsideInspection, type InsertDotRoadsideInspection,
  type DotDvirLog, type InsertDotDvirLog,
  isoAudits, isoAuditFindings, isoAuditProcessNotes, isoAwarenessNotices, isoAwarenessAcknowledgments,
  isoObjectives, isoKpiActuals, auditProcessSchedule,
  isoRisks, isoManagementReviews, isoReviewActionItems, isoActionItems, isoCommunications,
  isoComplianceObligations, isoComplianceEvaluations,
  type AuditProcessSchedule, type InsertAuditProcessSchedule,
  type IsoAudit, type InsertIsoAudit,
  type IsoAuditFinding, type InsertIsoAuditFinding,
  type IsoAuditProcessNote, type InsertIsoAuditProcessNote,
  type IsoAwarenessNotice, type InsertIsoAwarenessNotice,
  type IsoAwarenessAcknowledgment, type InsertIsoAwarenessAcknowledgment,
  type IsoObjective, type InsertIsoObjective,
  type IsoKpiActual, type InsertIsoKpiActual,
  type IsoRisk, type InsertIsoRisk,
  type IsoManagementReview, type InsertIsoManagementReview,
  type IsoReviewActionItem, type InsertIsoReviewActionItem,
  type IsoActionItem, type InsertIsoActionItem,
  type IsoCommunication, type InsertIsoCommunication,
  type IsoComplianceObligation, type InsertIsoComplianceObligation,
  type IsoComplianceEvaluation, type InsertIsoComplianceEvaluation,
  suppliers, supplierCriteria, supplierCandidateAssessments, supplierEvaluations, supplierAudits,
  type Supplier, type InsertSupplier,
  type SupplierCriteria, type InsertSupplierCriteria,
  type SupplierCandidateAssessment, type InsertSupplierCandidateAssessment,
  type SupplierEvaluation, type InsertSupplierEvaluation,
  type SupplierAudit, type InsertSupplierAudit,
  calibrationEquipment, calibrationRecords, calibrationOotAssessments, calibrationLabs, calibrationLabScope,
  type CalibrationEquipment, type InsertCalibrationEquipment,
  type CalibrationRecord, type InsertCalibrationRecord,
  type CalibrationOotAssessment, type InsertCalibrationOotAssessment,
  type CalibrationLab, type InsertCalibrationLab,
  type CalibrationLabScope, type InsertCalibrationLabScope,
  pmEquipment, pmRecords,
  type PmEquipment, type InsertPmEquipment,
  type PmRecord, type InsertPmRecord,
  iatfProductAudits, iatfMfgProcessAudits, iatfAuditSchedule,
  type IatfProductAudit, type InsertIatfProductAudit,
  type IatfMfgProcessAudit, type InsertIatfMfgProcessAudit,
  type IatfAuditSchedule, type InsertIatfAuditSchedule,
  lpaAuditPlans, lpaRecords,
  type LpaAuditPlan, type InsertLpaAuditPlan,
  type LpaRecord, type InsertLpaRecord,
  competencyRequirements, employeeCompetencyRecords, trainingEventRecords,
  type CompetencyRequirement, type InsertCompetencyRequirement,
  type EmployeeCompetencyRecord, type InsertEmployeeCompetencyRecord,
  type TrainingEventRecord, type InsertTrainingEventRecord,
  trainingMatrixSkills, trainingMatrixEntries,
  type TrainingMatrixSkill, type InsertTrainingMatrixSkill,
  type TrainingMatrixEntry, type InsertTrainingMatrixEntry,
  trainingEvidenceFiles,
  type TrainingEvidenceFile, type InsertTrainingEvidenceFile,
} from "@shared/schema";
import { db } from "./rls";
import { eq, desc, asc, and, gte, lte, lt, count, sql, isNull, or, inArray } from "drizzle-orm";

export interface IStorage {
  // Corey Profiles
  getCoreyProfile(userId: string): Promise<CoreyProfile | undefined>;
  upsertCoreyProfile(userId: string, data: Partial<InsertCoreyProfile>): Promise<CoreyProfile>;

  // Isa Profiles
  getIsaProfile(userId: string): Promise<IsaProfile | undefined>;
  upsertIsaProfile(userId: string, data: Partial<InsertIsaProfile>): Promise<IsaProfile>;

  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  deleteLead(id: number): Promise<boolean>;

  // Subscriptions
  getSubscription(userId: string): Promise<Subscription | undefined>;
  upsertSubscription(sub: InsertSubscription): Promise<Subscription>;

  // Question Usage
  getQuestionUsage(userId: string): Promise<QuestionUsage | undefined>;
  incrementQuestionCount(userId: string): Promise<QuestionUsage>;

  // Trial Leads
  getTrialLeadByEmail(email: string): Promise<TrialLead | undefined>;
  getAllTrialLeads(): Promise<TrialLead[]>;
  createTrialLead(lead: InsertTrialLead, ipAddress?: string): Promise<TrialLead>;
  incrementTrialQuestionCount(email: string): Promise<TrialLead | undefined>;
  saveTrialLeadQuestion(email: string, question: string): Promise<void>;
  getTotalQuestionsByDomain(domain: string): Promise<number>;
  getTotalQuestionsByIp(ip: string): Promise<number>;
  getOrgQuestionTotal(domain: string): Promise<number>;

  // Site Visits
  recordPageVisit(page: string): Promise<void>;
  getSiteVisitStats(): Promise<{ totalVisits: number; todayVisits: number; last30Days: { date: string; count: number }[]; topPages: { page: string; count: number }[] }>;

  // Contact Inquiries
  createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry>;
  getContactInquiries(): Promise<ContactInquiry[]>;
  updateInquiryStatus(id: number, status: string): Promise<ContactInquiry | undefined>;

  // Employees
  getEmployees(userId: string, isSuperadmin?: boolean): Promise<Employee[]>;
  getEmployeeById(id: number, userId: string, isSuperadmin?: boolean): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, userId: string, employee: Partial<InsertEmployee>, isSuperadmin?: boolean): Promise<Employee | undefined>;
  deleteEmployee(id: number, userId: string, isSuperadmin?: boolean): Promise<boolean>;

  // Incidents
  getIncidents(userId: string, isSuperadmin?: boolean): Promise<Incident[]>;
  getIncident(id: number, userId: string): Promise<Incident | undefined>;
  getIncidentsByDateRange(userId: string, startDate: Date, endDate: Date, isSuperadmin?: boolean): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: number, userId: string, incident: Partial<InsertIncident>, isSuperadmin?: boolean): Promise<Incident | undefined>;

  // Corrective Actions
  getCorrectiveActions(userId: string): Promise<CorrectiveAction[]>;
  getCorrectiveActionById(id: number, userId: string): Promise<CorrectiveAction | undefined>;
  createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction>;
  updateCorrectiveAction(id: number, userId: string, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction | undefined>;
  deleteCorrectiveAction(id: number, userId: string): Promise<boolean>;
  getOverdueCorrectiveActions(userId: string): Promise<CorrectiveAction[]>;
  markCapaOverdueNotified(id: number): Promise<void>;

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

  // Team departments
  getTeamDepartments(teamId: number): Promise<TeamDepartment[]>;
  createTeamDepartment(dept: InsertTeamDepartment): Promise<TeamDepartment>;
  updateTeamDepartment(id: number, teamId: number, updates: Partial<InsertTeamDepartment>): Promise<TeamDepartment | undefined>;
  deleteTeamDepartment(id: number, teamId: number): Promise<boolean>;
  updateTeamMemberDept(memberId: number, teamId: number, departmentId: number | null, jobTitle?: string, role?: string): Promise<CoreyTeamMember | undefined>;

  // Team announcements
  getTeamAnnouncements(teamId: number): Promise<TeamAnnouncement[]>;
  createTeamAnnouncement(ann: InsertTeamAnnouncement): Promise<TeamAnnouncement>;
  toggleAnnouncementPin(id: number, teamId: number): Promise<TeamAnnouncement | undefined>;
  deleteTeamAnnouncement(id: number, teamId: number): Promise<boolean>;

  // Paddle audit log
  logPaddleEvent(event: InsertPaddleEvent): Promise<PaddleEvent>;
  getPaddleEvents(limit?: number): Promise<PaddleEvent[]>;

  // Superadmin functions
  getUserById(userId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  isSuperadmin(userId: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getAllSubscriptions(): Promise<Subscription[]>;
  getNewSignupsThisWeek(): Promise<number>;
  getUserGrowthLast30Days(): Promise<{ date: string; count: number }[]>;
  getRetainerRequests(): Promise<ContactInquiry[]>;
  setSuperadmin(userId: string, isSuperadmin: boolean): Promise<User | undefined>;
  setIsoRole(userId: string, isoRole: string | null): Promise<User | undefined>;
  setIsoOnly(userId: string, isoOnly: boolean): Promise<User | undefined>;
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
  updateTeamSettings(teamId: number, settings: { companyName?: string; derMemberId?: number | null; derName?: string | null; derEmail?: string | null; derPhone?: string | null; derTitle?: string | null; }): Promise<CoreyTeam | undefined>;
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

  // ISO Projects (Wizard)
  getIsoProject(userId: string, isSuperadmin?: boolean, isoProjectId?: number): Promise<IsoProject | undefined>;
  getIsoProjects(userId: string, isSuperadmin?: boolean): Promise<IsoProject[]>;
  getIsoProjectById(id: number): Promise<IsoProject | undefined>;
  createIsoProject(data: InsertIsoProject): Promise<IsoProject>;
  updateIsoProject(userId: string, data: Partial<InsertIsoProject>): Promise<IsoProject>;
  deleteIsoProject(userId: string): Promise<void>;

  // Nonconformances
  getNonconformances(userId: string, isSuperadmin?: boolean): Promise<Nonconformance[]>;
  createNonconformance(data: InsertNonconformance): Promise<Nonconformance>;
  updateNonconformance(id: number, userId: string, data: Partial<InsertNonconformance>, isSuperadmin?: boolean): Promise<Nonconformance | undefined>;
  deleteNonconformance(id: number, userId: string, isSuperadmin?: boolean): Promise<boolean>;

  // ISO Documents
  getIsoDocuments(userId: string, isSuperadmin?: boolean): Promise<IsoDocument[]>;
  getIsoDocumentsByProject(userId: string, isoProjectId: number, isSuperadmin?: boolean): Promise<IsoDocument[]>;
  createIsoDocument(data: InsertIsoDocument): Promise<IsoDocument>;
  updateIsoDocument(id: number, userId: string, data: Partial<InsertIsoDocument>): Promise<IsoDocument | undefined>;
  deleteIsoDocument(id: number, userId: string): Promise<void>;

  // DOT Compliance Hub
  getDotDrivers(userId: string): Promise<DotDriver[]>;
  getDotDriver(id: number, userId: string): Promise<DotDriver | undefined>;
  createDotDriver(data: InsertDotDriver): Promise<DotDriver>;
  updateDotDriver(id: number, userId: string, data: Partial<InsertDotDriver>): Promise<DotDriver | undefined>;
  deleteDotDriver(id: number, userId: string): Promise<void>;
  getDotDqDocuments(driverId: number, userId: string): Promise<DotDqDocument[]>;
  upsertDotDqDocument(data: InsertDotDqDocument): Promise<DotDqDocument>;
  getDotEquipment(userId: string): Promise<DotEquipment[]>;
  createDotEquipment(data: InsertDotEquipment): Promise<DotEquipment>;
  updateDotEquipment(id: number, userId: string, data: Partial<InsertDotEquipment>): Promise<DotEquipment | undefined>;
  deleteDotEquipment(id: number, userId: string): Promise<void>;
  // Random Testing
  getDotRandomTests(userId: string, year?: number): Promise<DotRandomTest[]>;
  createDotRandomTest(data: InsertDotRandomTest): Promise<DotRandomTest>;
  updateDotRandomTest(id: number, userId: string, data: Partial<InsertDotRandomTest>): Promise<DotRandomTest | undefined>;
  deleteDotRandomTest(id: number, userId: string): Promise<void>;
  // Accident Register
  getDotAccidents(userId: string): Promise<DotAccident[]>;
  createDotAccident(data: InsertDotAccident): Promise<DotAccident>;
  updateDotAccident(id: number, userId: string, data: Partial<InsertDotAccident>): Promise<DotAccident | undefined>;
  deleteDotAccident(id: number, userId: string): Promise<void>;
  // Roadside Inspections
  getDotRoadsideInspections(userId: string): Promise<DotRoadsideInspection[]>;
  createDotRoadsideInspection(data: InsertDotRoadsideInspection): Promise<DotRoadsideInspection>;
  updateDotRoadsideInspection(id: number, userId: string, data: Partial<InsertDotRoadsideInspection>): Promise<DotRoadsideInspection | undefined>;
  deleteDotRoadsideInspection(id: number, userId: string): Promise<void>;
  // DVIR Logs
  getDotDvirLogs(userId: string): Promise<DotDvirLog[]>;
  createDotDvirLog(data: InsertDotDvirLog): Promise<DotDvirLog>;
  updateDotDvirLog(id: number, userId: string, data: Partial<InsertDotDvirLog>): Promise<DotDvirLog | undefined>;
  deleteDotDvirLog(id: number, userId: string): Promise<void>;

  // ISO Audits
  getAuditProcessSchedule(userId: string, isSuperadmin?: boolean): Promise<AuditProcessSchedule[]>;
  upsertAuditProcessSchedule(data: any, userId: string): Promise<AuditProcessSchedule>;
  deleteAuditProcessSchedule(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;
  getIsoAudits(userId: string, isSuperadmin?: boolean): Promise<IsoAudit[]>;
  getIsoAudit(id: number, userId: string, isSuperadmin?: boolean): Promise<IsoAudit | undefined>;
  createIsoAudit(data: InsertIsoAudit): Promise<IsoAudit>;
  updateIsoAudit(id: number, userId: string, data: Partial<InsertIsoAudit>, isSuperadmin?: boolean): Promise<IsoAudit | undefined>;
  deleteIsoAudit(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Audit Findings
  getIsoAuditFindings(auditId: number, userId: string, isSuperadmin?: boolean): Promise<IsoAuditFinding[]>;
  createIsoAuditFinding(data: InsertIsoAuditFinding): Promise<IsoAuditFinding>;
  updateIsoAuditFinding(id: number, userId: string, data: Partial<InsertIsoAuditFinding>, isSuperadmin?: boolean): Promise<IsoAuditFinding | undefined>;
  deleteIsoAuditFinding(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Audit Process Notes (process-approach)
  getIsoAuditProcessNotes(auditId: number, userId: string, isSuperadmin?: boolean): Promise<IsoAuditProcessNote[]>;
  upsertIsoAuditProcessNote(data: InsertIsoAuditProcessNote, userId: string, isSuperadmin?: boolean): Promise<IsoAuditProcessNote>;
  deleteIsoAuditProcessNote(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // IATF §9.2.2.3 — Product Audits
  getIatfProductAudits(userId: string, isSuperadmin?: boolean): Promise<IatfProductAudit[]>;
  createIatfProductAudit(data: InsertIatfProductAudit): Promise<IatfProductAudit>;
  updateIatfProductAudit(id: number, userId: string, data: Partial<InsertIatfProductAudit>, isSuperadmin?: boolean): Promise<IatfProductAudit | undefined>;
  deleteIatfProductAudit(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // IATF §9.2.2.4 — Manufacturing Process Audits
  getIatfMfgProcessAudits(userId: string, isSuperadmin?: boolean): Promise<IatfMfgProcessAudit[]>;
  createIatfMfgProcessAudit(data: InsertIatfMfgProcessAudit): Promise<IatfMfgProcessAudit>;
  updateIatfMfgProcessAudit(id: number, userId: string, data: Partial<InsertIatfMfgProcessAudit>, isSuperadmin?: boolean): Promise<IatfMfgProcessAudit | undefined>;
  deleteIatfMfgProcessAudit(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // IATF Audit Schedule (§9.2.2.3 & §9.2.2.4)
  getIatfAuditSchedule(userId: string, isSuperadmin?: boolean): Promise<IatfAuditSchedule[]>;
  createIatfAuditScheduleEntry(data: InsertIatfAuditSchedule): Promise<IatfAuditSchedule>;
  updateIatfAuditScheduleEntry(id: number, userId: string, data: Partial<InsertIatfAuditSchedule>, isSuperadmin?: boolean): Promise<IatfAuditSchedule | undefined>;
  deleteIatfAuditScheduleEntry(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ── Layered Process Audits (LPA) ──────────────────────────────────────────
  getLpaAuditPlans(userId: string, isSuperadmin?: boolean): Promise<LpaAuditPlan[]>;
  createLpaAuditPlan(data: InsertLpaAuditPlan): Promise<LpaAuditPlan>;
  updateLpaAuditPlan(id: number, userId: string, data: Partial<InsertLpaAuditPlan>, isSuperadmin?: boolean): Promise<LpaAuditPlan | undefined>;
  deleteLpaAuditPlan(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;
  getLpaRecords(userId: string, isSuperadmin?: boolean, planId?: number): Promise<LpaRecord[]>;
  createLpaRecord(data: InsertLpaRecord): Promise<LpaRecord>;
  updateLpaRecord(id: number, userId: string, data: Partial<InsertLpaRecord>, isSuperadmin?: boolean): Promise<LpaRecord | undefined>;
  deleteLpaRecord(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Awareness Notices
  getIsoAwarenessNotices(userId: string, isSuperadmin?: boolean): Promise<IsoAwarenessNotice[]>;
  createIsoAwarenessNotice(data: InsertIsoAwarenessNotice): Promise<IsoAwarenessNotice>;
  updateIsoAwarenessNotice(id: number, userId: string, data: Partial<InsertIsoAwarenessNotice>, isSuperadmin?: boolean): Promise<IsoAwarenessNotice | undefined>;
  deleteIsoAwarenessNotice(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Awareness Acknowledgments
  getIsoAwarenessAcknowledgments(noticeId: number): Promise<IsoAwarenessAcknowledgment[]>;
  createIsoAwarenessAcknowledgment(data: InsertIsoAwarenessAcknowledgment): Promise<IsoAwarenessAcknowledgment>;

  // §7.2 Competency Requirements (per job title)
  getCompetencyRequirements(userId: string, isSuperadmin?: boolean): Promise<CompetencyRequirement[]>;
  createCompetencyRequirement(data: InsertCompetencyRequirement): Promise<CompetencyRequirement>;
  updateCompetencyRequirement(id: number, userId: string, data: Partial<InsertCompetencyRequirement>, isSuperadmin?: boolean): Promise<CompetencyRequirement | undefined>;
  deleteCompetencyRequirement(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // §7.2 Employee Competency Records (evidence per employee)
  getEmployeeCompetencyRecords(userId: string, employeeId?: number, isSuperadmin?: boolean): Promise<EmployeeCompetencyRecord[]>;
  createEmployeeCompetencyRecord(data: InsertEmployeeCompetencyRecord): Promise<EmployeeCompetencyRecord>;
  updateEmployeeCompetencyRecord(id: number, userId: string, data: Partial<InsertEmployeeCompetencyRecord>, isSuperadmin?: boolean): Promise<EmployeeCompetencyRecord | undefined>;
  deleteEmployeeCompetencyRecord(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // Training Event Log (classroom, OJT, external, toolbox talks)
  getTrainingEventRecords(userId: string, isSuperadmin?: boolean): Promise<TrainingEventRecord[]>;
  createTrainingEventRecord(data: InsertTrainingEventRecord): Promise<TrainingEventRecord>;
  updateTrainingEventRecord(id: number, userId: string, data: Partial<InsertTrainingEventRecord>, isSuperadmin?: boolean): Promise<TrainingEventRecord | undefined>;
  deleteTrainingEventRecord(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // Cross-Training / Skills Matrix
  getTrainingMatrixSkills(userId: string, isSuperadmin?: boolean): Promise<TrainingMatrixSkill[]>;
  createTrainingMatrixSkill(data: InsertTrainingMatrixSkill): Promise<TrainingMatrixSkill>;
  updateTrainingMatrixSkill(id: number, userId: string, data: Partial<InsertTrainingMatrixSkill>, isSuperadmin?: boolean): Promise<TrainingMatrixSkill | undefined>;
  deleteTrainingMatrixSkill(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;
  getTrainingMatrixEntries(userId: string, isSuperadmin?: boolean): Promise<TrainingMatrixEntry[]>;
  upsertTrainingMatrixEntry(data: InsertTrainingMatrixEntry): Promise<TrainingMatrixEntry>;
  deleteTrainingMatrixEntry(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;
  // Training Evidence Files
  getTrainingEvidenceFiles(userId: string, filters: { employeeId?: number; competencyRecordId?: number; trainingEventId?: number }, isSuperadmin?: boolean): Promise<TrainingEvidenceFile[]>;
  createTrainingEvidenceFile(data: InsertTrainingEvidenceFile): Promise<TrainingEvidenceFile>;
  deleteTrainingEvidenceFile(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Objectives (KPI tracking — shared by Process Maps, Measurement, Management Review)
  getIsoObjectives(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoObjective[]>;
  getIsoObjectivesByProcess(userId: string, processName: string): Promise<IsoObjective[]>;
  createIsoObjective(data: InsertIsoObjective): Promise<IsoObjective>;
  updateIsoObjective(id: number, userId: string, data: Partial<InsertIsoObjective>, isSuperadmin?: boolean): Promise<IsoObjective | undefined>;
  deleteIsoObjective(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;
  upsertIsoObjectiveForProcess(userId: string, isoProjectId: number | undefined, processName: string, name: string, target: string, unit: string, responsible?: string): Promise<IsoObjective>;

  // ISO KPI Actuals (measurement log)
  getIsoKpiActuals(userId: string, objectiveId?: number, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoKpiActual[]>;
  createIsoKpiActual(data: InsertIsoKpiActual): Promise<IsoKpiActual>;
  deleteIsoKpiActual(id: number, userId: string): Promise<void>;

  // ISO Risks
  getIsoRisks(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoRisk[]>;
  createIsoRisk(data: InsertIsoRisk): Promise<IsoRisk>;
  updateIsoRisk(id: number, userId: string, data: Partial<IsoRisk>, isSuperadmin?: boolean): Promise<IsoRisk | undefined>;
  deleteIsoRisk(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Management Reviews
  getIsoManagementReviews(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoManagementReview[]>;
  getIsoManagementReview(id: number, userId: string, isSuperadmin?: boolean): Promise<IsoManagementReview | undefined>;
  createIsoManagementReview(data: InsertIsoManagementReview): Promise<IsoManagementReview>;
  updateIsoManagementReview(id: number, userId: string, data: Partial<InsertIsoManagementReview>, isSuperadmin?: boolean): Promise<IsoManagementReview | undefined>;
  deleteIsoManagementReview(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Review Action Items
  getIsoReviewActionItems(reviewId: number, userId: string, isSuperadmin?: boolean): Promise<IsoReviewActionItem[]>;
  getAllIsoReviewActionItems(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoReviewActionItem[]>;
  createIsoReviewActionItem(data: InsertIsoReviewActionItem): Promise<IsoReviewActionItem>;
  updateIsoReviewActionItem(id: number, userId: string, data: Partial<InsertIsoReviewActionItem>, isSuperadmin?: boolean): Promise<IsoReviewActionItem | undefined>;
  deleteIsoReviewActionItem(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Action Items (cross-source tracker)
  getIsoActionItems(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoActionItem[]>;
  createIsoActionItem(data: InsertIsoActionItem): Promise<IsoActionItem>;
  updateIsoActionItem(id: number, userId: string, data: Partial<InsertIsoActionItem>, isSuperadmin?: boolean): Promise<IsoActionItem | undefined>;
  deleteIsoActionItem(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Communications
  getIsoCommunications(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoCommunication[]>;
  createIsoCommunication(data: InsertIsoCommunication): Promise<IsoCommunication>;
  updateIsoCommunication(id: number, userId: string, data: Partial<InsertIsoCommunication>, isSuperadmin?: boolean): Promise<IsoCommunication | undefined>;
  deleteIsoCommunication(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Compliance Obligations (§6.1.3)
  getIsoComplianceObligations(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<IsoComplianceObligation[]>;
  createIsoComplianceObligation(data: InsertIsoComplianceObligation): Promise<IsoComplianceObligation>;
  updateIsoComplianceObligation(id: number, userId: string, data: Partial<InsertIsoComplianceObligation>, isSuperadmin?: boolean): Promise<IsoComplianceObligation | undefined>;
  deleteIsoComplianceObligation(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ISO Compliance Evaluations (§9.1.2)
  getIsoComplianceEvaluations(userId: string, obligationId?: number, isSuperadmin?: boolean): Promise<IsoComplianceEvaluation[]>;
  createIsoComplianceEvaluation(data: InsertIsoComplianceEvaluation): Promise<IsoComplianceEvaluation>;
  updateIsoComplianceEvaluation(id: number, userId: string, data: Partial<InsertIsoComplianceEvaluation>, isSuperadmin?: boolean): Promise<IsoComplianceEvaluation | undefined>;
  deleteIsoComplianceEvaluation(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // Supplier Management
  getSuppliers(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, userId: string, data: Partial<InsertSupplier>, isSuperadmin?: boolean): Promise<Supplier | undefined>;
  deleteSupplier(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;
  getSupplierCriteria(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<SupplierCriteria[]>;
  createSupplierCriteria(data: InsertSupplierCriteria): Promise<SupplierCriteria>;
  updateSupplierCriteria(id: number, data: Partial<InsertSupplierCriteria>): Promise<SupplierCriteria | undefined>;
  deleteSupplierCriteria(id: number): Promise<void>;
  getSupplierCandidateAssessments(userId: string, isoProjectId?: number, isSuperadmin?: boolean): Promise<SupplierCandidateAssessment[]>;
  createSupplierCandidateAssessment(data: InsertSupplierCandidateAssessment): Promise<SupplierCandidateAssessment>;
  deleteSupplierCandidateAssessment(id: number): Promise<void>;
  getSupplierEvaluations(userId: string, isoProjectId?: number, supplierId?: number, isSuperadmin?: boolean): Promise<SupplierEvaluation[]>;
  createSupplierEvaluation(data: InsertSupplierEvaluation): Promise<SupplierEvaluation>;
  updateSupplierEvaluation(id: number, data: Partial<InsertSupplierEvaluation>): Promise<SupplierEvaluation | undefined>;
  deleteSupplierEvaluation(id: number): Promise<void>;
  getSupplierAudits(userId: string, isoProjectId?: number, supplierId?: number, isSuperadmin?: boolean): Promise<SupplierAudit[]>;
  upsertSupplierAudit(data: InsertSupplierAudit & { supplierId: number }): Promise<SupplierAudit>;
  updateSupplierAudit(id: number, data: Partial<InsertSupplierAudit>): Promise<SupplierAudit | undefined>;
  deleteSupplierAudit(id: number): Promise<void>;

  // ── Calibration Equipment ──────────────────────────────────────────────────
  getCalibrationEquipment(userId: string, isSuperadmin?: boolean, isoProjectId?: number | null): Promise<CalibrationEquipment[]>;
  createCalibrationEquipment(data: InsertCalibrationEquipment): Promise<CalibrationEquipment>;
  updateCalibrationEquipment(id: number, userId: string, data: Partial<InsertCalibrationEquipment>, isSuperadmin?: boolean): Promise<CalibrationEquipment | undefined>;
  deleteCalibrationEquipment(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ── Calibration Records ────────────────────────────────────────────────────
  getCalibrationRecords(userId: string, isSuperadmin?: boolean, isoProjectId?: number | null): Promise<CalibrationRecord[]>;
  createCalibrationRecord(data: InsertCalibrationRecord): Promise<CalibrationRecord>;
  updateCalibrationRecord(id: number, userId: string, data: Partial<InsertCalibrationRecord>, isSuperadmin?: boolean): Promise<CalibrationRecord | undefined>;
  deleteCalibrationRecord(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ── Calibration OOT Assessments ────────────────────────────────────────────
  getCalibrationOotAssessments(userId: string, isSuperadmin?: boolean, isoProjectId?: number | null): Promise<CalibrationOotAssessment[]>;
  createCalibrationOotAssessment(data: InsertCalibrationOotAssessment): Promise<CalibrationOotAssessment>;
  updateCalibrationOotAssessment(id: number, userId: string, data: Partial<InsertCalibrationOotAssessment>, isSuperadmin?: boolean): Promise<CalibrationOotAssessment | undefined>;

  // ── Calibration Labs ───────────────────────────────────────────────────────
  getCalibrationLabs(userId: string, isSuperadmin?: boolean, isoProjectId?: number | null): Promise<CalibrationLab[]>;
  createCalibrationLab(data: InsertCalibrationLab): Promise<CalibrationLab>;
  updateCalibrationLab(id: number, userId: string, data: Partial<InsertCalibrationLab>, isSuperadmin?: boolean): Promise<CalibrationLab | undefined>;
  deleteCalibrationLab(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ── Internal Lab Scope (IATF §7.1.5.3.1) ────────────────────────────────
  getLabScope(userId: string, isSuperadmin?: boolean, isoProjectId?: number | null): Promise<CalibrationLabScope | undefined>;
  upsertLabScope(userId: string, isoProjectId: number | null, data: Partial<InsertCalibrationLabScope>): Promise<CalibrationLabScope>;

  // ── Preventive Maintenance Equipment ───────────────────────────────────────
  getPmEquipment(userId: string, isSuperadmin?: boolean, isoProjectId?: number | null): Promise<PmEquipment[]>;
  createPmEquipment(data: InsertPmEquipment): Promise<PmEquipment>;
  updatePmEquipment(id: number, userId: string, data: Partial<InsertPmEquipment>, isSuperadmin?: boolean): Promise<PmEquipment | undefined>;
  deletePmEquipment(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;

  // ── Preventive Maintenance Records ─────────────────────────────────────────
  getPmRecords(userId: string, isSuperadmin?: boolean, isoProjectId?: number | null): Promise<PmRecord[]>;
  createPmRecord(data: InsertPmRecord): Promise<PmRecord>;
  updatePmRecord(id: number, userId: string, data: Partial<InsertPmRecord>, isSuperadmin?: boolean): Promise<PmRecord | undefined>;
  deletePmRecord(id: number, userId: string, isSuperadmin?: boolean): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads);
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id)).returning();
    return result.length > 0;
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

  async createTrialLead(lead: InsertTrialLead, ipAddress?: string): Promise<TrialLead> {
    const [newLead] = await db.insert(trialLeads).values({ ...lead, email: lead.email.toLowerCase(), ...(ipAddress ? { ipAddress } : {}) }).returning();
    return newLead;
  }

  async getTotalQuestionsByDomain(domain: string): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`coalesce(sum(${trialLeads.questionCount}), 0)` })
      .from(trialLeads)
      .where(sql`lower(${trialLeads.email}) like ${'%@' + domain.toLowerCase()}`);
    return Number(result?.total ?? 0);
  }

  async getTotalQuestionsByIp(ip: string): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`coalesce(sum(${trialLeads.questionCount}), 0)` })
      .from(trialLeads)
      .where(eq(trialLeads.ipAddress, ip));
    return Number(result?.total ?? 0);
  }

  async getOrgQuestionTotal(domain: string): Promise<number> {
    // Sum all in-app free question usage for authenticated users sharing the same email domain
    const [result] = await db
      .select({ total: sql<number>`coalesce(sum(${questionUsage.questionCount}), 0)` })
      .from(questionUsage)
      .innerJoin(users, eq(questionUsage.userId, users.id))
      .where(sql`lower(${users.email}) like ${'%@' + domain.toLowerCase()}`);
    return Number(result?.total ?? 0);
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

  async saveTrialLeadQuestion(email: string, question: string): Promise<void> {
    const existing = await this.getTrialLeadByEmail(email.toLowerCase());
    if (!existing) return;
    const current = existing.questions ?? [];
    const updated = [...current, question.trim()].slice(-10);
    await db
      .update(trialLeads)
      .set({ questions: updated })
      .where(eq(trialLeads.id, existing.id));
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
  async getEmployees(userId: string, isSuperadmin = false): Promise<Employee[]> {
    return db.select().from(employees).where(isSuperadmin ? undefined : eq(employees.userId, userId)).orderBy(employees.lastName);
  }

  async getEmployeeById(id: number, userId: string, isSuperadmin = false): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees)
      .where(isSuperadmin ? eq(employees.id, id) : and(eq(employees.id, id), eq(employees.userId, userId)));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, userId: string, employee: Partial<InsertEmployee>, isSuperadmin = false): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(isSuperadmin ? eq(employees.id, id) : and(eq(employees.id, id), eq(employees.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEmployee(id: number, userId: string, isSuperadmin = false): Promise<boolean> {
    await db.delete(employees)
      .where(isSuperadmin ? eq(employees.id, id) : and(eq(employees.id, id), eq(employees.userId, userId)));
    return true;
  }

  // Incidents
  async getIncidents(userId: string, isSuperadmin = false): Promise<Incident[]> {
    return db.select().from(incidents).where(isSuperadmin ? undefined : eq(incidents.userId, userId)).orderBy(desc(incidents.incidentDate));
  }

  async getIncident(id: number, userId: string, isSuperadmin = false): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(isSuperadmin ? eq(incidents.id, id) : and(eq(incidents.id, id), eq(incidents.userId, userId)));
    return incident;
  }

  async getIncidentsByDateRange(userId: string, startDate: Date, endDate: Date, isSuperadmin = false): Promise<Incident[]> {
    return db.select().from(incidents)
      .where(isSuperadmin
        ? and(gte(incidents.incidentDate, startDate), lte(incidents.incidentDate, endDate))
        : and(eq(incidents.userId, userId), gte(incidents.incidentDate, startDate), lte(incidents.incidentDate, endDate))
      )
      .orderBy(incidents.incidentDate);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async updateIncident(id: number, userId: string, incident: Partial<InsertIncident>, isSuperadmin = false): Promise<Incident | undefined> {
    const [updated] = await db
      .update(incidents)
      .set(incident)
      .where(isSuperadmin ? eq(incidents.id, id) : and(eq(incidents.id, id), eq(incidents.userId, userId)))
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
    await db.delete(correctiveActions)
      .where(and(eq(correctiveActions.id, id), eq(correctiveActions.userId, userId)));
    return true;
  }

  async getOverdueCorrectiveActions(userId: string): Promise<CorrectiveAction[]> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return db.select().from(correctiveActions)
      .where(and(
        eq(correctiveActions.userId, userId),
        lt(correctiveActions.targetDate, now),
        or(
          isNull(correctiveActions.overdueNotifiedAt),
          lt(correctiveActions.overdueNotifiedAt, twentyFourHoursAgo)
        ),
        or(
          eq(correctiveActions.status, "open"),
          eq(correctiveActions.status, "in_progress")
        )
      ));
  }

  async markCapaOverdueNotified(id: number): Promise<void> {
    await db.update(correctiveActions)
      .set({ overdueNotifiedAt: new Date() } as any)
      .where(eq(correctiveActions.id, id));
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

  // Paddle audit log
  async logPaddleEvent(event: InsertPaddleEvent): Promise<PaddleEvent> {
    const [created] = await db.insert(paddleEvents).values(event).returning();
    return created;
  }

  async getPaddleEvents(limit = 100): Promise<PaddleEvent[]> {
    return db.select().from(paddleEvents).orderBy(desc(paddleEvents.processedAt)).limit(limit);
  }

  // Superadmin functions
  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async isSuperadmin(userId: string): Promise<boolean> {
    const SUPERADMIN_EMAILS = [
      "raul@corecompliancehub.com",
      "raulv9471@gmail.com",
      "evillarreal@acsi-quality.com",
    ];
    const user = await this.getUserById(userId);
    if (!user) return false;
    if (user.isSuperadmin === true) return true;
    return SUPERADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "");
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

  async setIsoRole(userId: string, isoRole: string | null): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isoRole, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async setIsoOnly(userId: string, isoOnly: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ isoOnly, updatedAt: new Date() })
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

  async updateTeamSettings(teamId: number, settings: { companyName?: string; derMemberId?: number | null; derName?: string | null; derEmail?: string | null; derPhone?: string | null; derTitle?: string | null; }): Promise<CoreyTeam | undefined> {
    const [updated] = await db.update(coreyTeams)
      .set({ ...settings, updatedAt: new Date() })
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

  // ── Team Departments ─────────────────────────────────────────────────────
  async getTeamDepartments(teamId: number): Promise<TeamDepartment[]> {
    return db.select().from(teamDepartments).where(eq(teamDepartments.teamId, teamId)).orderBy(teamDepartments.name);
  }

  async createTeamDepartment(dept: InsertTeamDepartment): Promise<TeamDepartment> {
    const [created] = await db.insert(teamDepartments).values(dept).returning();
    return created;
  }

  async updateTeamDepartment(id: number, teamId: number, updates: Partial<InsertTeamDepartment>): Promise<TeamDepartment | undefined> {
    const [updated] = await db.update(teamDepartments).set(updates)
      .where(and(eq(teamDepartments.id, id), eq(teamDepartments.teamId, teamId))).returning();
    return updated;
  }

  async deleteTeamDepartment(id: number, teamId: number): Promise<boolean> {
    // Unassign members from this dept first
    await db.update(coreyTeamMembers).set({ departmentId: null })
      .where(and(eq(coreyTeamMembers.teamId, teamId), eq(coreyTeamMembers.departmentId, id)));
    const result = await db.delete(teamDepartments)
      .where(and(eq(teamDepartments.id, id), eq(teamDepartments.teamId, teamId)));
    return (result as any).count > 0;
  }

  async updateTeamMemberDept(memberId: number, teamId: number, departmentId: number | null, jobTitle?: string, role?: string): Promise<CoreyTeamMember | undefined> {
    const updates: any = { departmentId };
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (role !== undefined && ["member", "supervisor", "admin"].includes(role)) updates.role = role;
    const [updated] = await db.update(coreyTeamMembers).set(updates)
      .where(and(eq(coreyTeamMembers.id, memberId), eq(coreyTeamMembers.teamId, teamId))).returning();
    return updated;
  }

  // ── Team Announcements ───────────────────────────────────────────────────
  async getTeamAnnouncements(teamId: number): Promise<TeamAnnouncement[]> {
    return db.select().from(teamAnnouncements).where(eq(teamAnnouncements.teamId, teamId))
      .orderBy(desc(teamAnnouncements.isPinned), desc(teamAnnouncements.createdAt));
  }

  async createTeamAnnouncement(ann: InsertTeamAnnouncement): Promise<TeamAnnouncement> {
    const [created] = await db.insert(teamAnnouncements).values(ann).returning();
    return created;
  }

  async toggleAnnouncementPin(id: number, teamId: number): Promise<TeamAnnouncement | undefined> {
    const [existing] = await db.select().from(teamAnnouncements)
      .where(and(eq(teamAnnouncements.id, id), eq(teamAnnouncements.teamId, teamId)));
    if (!existing) return undefined;
    const [updated] = await db.update(teamAnnouncements).set({ isPinned: !existing.isPinned })
      .where(eq(teamAnnouncements.id, id)).returning();
    return updated;
  }

  async deleteTeamAnnouncement(id: number, teamId: number): Promise<boolean> {
    await db.delete(teamAnnouncements)
      .where(and(eq(teamAnnouncements.id, id), eq(teamAnnouncements.teamId, teamId)));
    return true;
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

  async getIsoProject(userId: string, isSuperadmin = false, isoProjectId?: number): Promise<IsoProject | undefined> {
    // Superadmin with a specific project ID — fetch it directly
    if (isSuperadmin && isoProjectId != null) {
      const [project] = await db.select().from(isoProjects).where(eq(isoProjects.id, isoProjectId));
      return project;
    }
    // Try to find the user's own project first
    const [ownProject] = await db.select().from(isoProjects).where(eq(isoProjects.userId, userId));
    if (ownProject) return ownProject;
    // Superadmins with no own project fall back to CCI Chemical demo company (user 54320068)
    if (isSuperadmin) {
      const [cciProject] = await db.select().from(isoProjects).where(eq(isoProjects.userId, "54320068"));
      if (cciProject) return cciProject;
      // Ultimate fallback: any project ordered by ID descending (most recent real data)
      const [fallback] = await db.select().from(isoProjects).orderBy(desc(isoProjects.id));
      return fallback;
    }
    return undefined;
  }

  async getIsoProjects(userId: string, isSuperadmin = false): Promise<IsoProject[]> {
    return db.select().from(isoProjects).where(isSuperadmin ? undefined : eq(isoProjects.userId, userId)).orderBy(isoProjects.name);
  }

  async getIsoProjectById(id: number): Promise<IsoProject | undefined> {
    const [project] = await db.select().from(isoProjects).where(eq(isoProjects.id, id));
    return project;
  }

  async createIsoProject(data: InsertIsoProject): Promise<IsoProject> {
    const [project] = await db.insert(isoProjects).values(data).returning();
    return project;
  }

  async updateIsoProject(userId: string, data: Partial<InsertIsoProject>, isSuperadmin = false): Promise<IsoProject> {
    const whereClause = isSuperadmin && data.id != null
      ? eq(isoProjects.id, data.id as number)
      : eq(isoProjects.userId, userId);
    const [project] = await db
      .update(isoProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(whereClause)
      .returning();
    return project;
  }

  async deleteIsoProject(userId: string, isSuperadmin = false, id?: number): Promise<void> {
    if (isSuperadmin && id != null) {
      await db.delete(isoProjects).where(eq(isoProjects.id, id));
    } else {
      await db.delete(isoProjects).where(eq(isoProjects.userId, userId));
    }
  }

  async getCoreyProfile(userId: string): Promise<CoreyProfile | undefined> {
    const [profile] = await db.select().from(coreyProfiles).where(eq(coreyProfiles.userId, userId));
    return profile;
  }

  async upsertCoreyProfile(userId: string, data: Partial<InsertCoreyProfile>): Promise<CoreyProfile> {
    const existing = await this.getCoreyProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(coreyProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(coreyProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(coreyProfiles)
        .values({ userId, ...data })
        .returning();
      return created;
    }
  }

  async getIsaProfile(userId: string): Promise<IsaProfile | undefined> {
    const [profile] = await db.select().from(isaProfiles).where(eq(isaProfiles.userId, userId));
    return profile;
  }

  async upsertIsaProfile(userId: string, data: Partial<InsertIsaProfile>): Promise<IsaProfile> {
    const existing = await this.getIsaProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(isaProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(isaProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(isaProfiles)
        .values({ userId, ...data })
        .returning();
      return created;
    }
  }

  async getNonconformances(userId: string, isSuperadmin = false): Promise<Nonconformance[]> {
    return db.select().from(nonconformances).where(isSuperadmin ? undefined : eq(nonconformances.userId, userId)).orderBy(asc(nonconformances.id));
  }

  async createNonconformance(data: InsertNonconformance): Promise<Nonconformance> {
    const [newNC] = await db.insert(nonconformances).values(data).returning();
    return newNC;
  }

  async updateNonconformance(id: number, userId: string, data: Partial<InsertNonconformance>, isSuperadmin = false): Promise<Nonconformance | undefined> {
    const [updated] = await db
      .update(nonconformances)
      .set(data)
      .where(isSuperadmin ? eq(nonconformances.id, id) : and(eq(nonconformances.id, id), eq(nonconformances.userId, userId)))
      .returning();
    return updated;
  }

  async deleteNonconformance(id: number, userId: string, isSuperadmin = false): Promise<boolean> {
    await db.delete(nonconformances).where(isSuperadmin ? eq(nonconformances.id, id) : and(eq(nonconformances.id, id), eq(nonconformances.userId, userId)));
    return true;
  }

  // ISO Documents
  async getIsoDocuments(userId: string, isSuperadmin = false): Promise<IsoDocument[]> {
    return db.select().from(isoDocuments).where(isSuperadmin ? undefined : eq(isoDocuments.userId, userId)).orderBy(desc(isoDocuments.updatedAt));
  }

  async getIsoDocumentsByProject(userId: string, isoProjectId: number, isSuperadmin = false): Promise<IsoDocument[]> {
    return db.select().from(isoDocuments).where(isSuperadmin ? eq(isoDocuments.isoProjectId, isoProjectId) : and(eq(isoDocuments.userId, userId), eq(isoDocuments.isoProjectId, isoProjectId))).orderBy(desc(isoDocuments.updatedAt));
  }

  async createIsoDocument(data: InsertIsoDocument): Promise<IsoDocument> {
    const [doc] = await db.insert(isoDocuments).values(data).returning();
    return doc;
  }

  async updateIsoDocument(id: number, userId: string, data: Partial<InsertIsoDocument>, isSuperadmin = false): Promise<IsoDocument | undefined> {
    const [updated] = await db
      .update(isoDocuments)
      .set({ ...data, updatedAt: new Date() })
      .where(isSuperadmin ? eq(isoDocuments.id, id) : and(eq(isoDocuments.id, id), eq(isoDocuments.userId, userId)))
      .returning();
    return updated;
  }

  async deleteIsoDocument(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoDocuments).where(isSuperadmin ? eq(isoDocuments.id, id) : and(eq(isoDocuments.id, id), eq(isoDocuments.userId, userId)));
  }

  // ─── DOT COMPLIANCE HUB ───────────────────────────────────────────────────

  async getDotDrivers(userId: string): Promise<DotDriver[]> {
    return db.select().from(dotDrivers).where(eq(dotDrivers.userId, userId)).orderBy(dotDrivers.lastName, dotDrivers.firstName);
  }

  async getDotDriver(id: number, userId: string): Promise<DotDriver | undefined> {
    const [driver] = await db.select().from(dotDrivers).where(and(eq(dotDrivers.id, id), eq(dotDrivers.userId, userId)));
    return driver;
  }

  async createDotDriver(data: InsertDotDriver): Promise<DotDriver> {
    const [driver] = await db.insert(dotDrivers).values(data).returning();
    return driver;
  }

  async updateDotDriver(id: number, userId: string, data: Partial<InsertDotDriver>): Promise<DotDriver | undefined> {
    const [updated] = await db.update(dotDrivers).set({ ...data, updatedAt: new Date() }).where(and(eq(dotDrivers.id, id), eq(dotDrivers.userId, userId))).returning();
    return updated;
  }

  async deleteDotDriver(id: number, userId: string): Promise<void> {
    await db.delete(dotDrivers).where(and(eq(dotDrivers.id, id), eq(dotDrivers.userId, userId)));
  }

  async getDotDqDocuments(driverId: number, userId: string): Promise<DotDqDocument[]> {
    return db.select().from(dotDqDocuments).where(and(eq(dotDqDocuments.driverId, driverId), eq(dotDqDocuments.userId, userId)));
  }

  async upsertDotDqDocument(data: InsertDotDqDocument): Promise<DotDqDocument> {
    const existing = await db.select().from(dotDqDocuments).where(and(eq(dotDqDocuments.driverId, data.driverId), eq(dotDqDocuments.userId, data.userId), eq(dotDqDocuments.documentType, data.documentType)));
    if (existing.length > 0) {
      const [updated] = await db.update(dotDqDocuments).set(data).where(eq(dotDqDocuments.id, existing[0].id)).returning();
      return updated;
    }
    const [created] = await db.insert(dotDqDocuments).values(data).returning();
    return created;
  }

  async getDotEquipment(userId: string): Promise<DotEquipment[]> {
    return db.select().from(dotEquipment).where(eq(dotEquipment.userId, userId)).orderBy(dotEquipment.unitNumber);
  }

  async createDotEquipment(data: InsertDotEquipment): Promise<DotEquipment> {
    const [equip] = await db.insert(dotEquipment).values(data).returning();
    return equip;
  }

  async updateDotEquipment(id: number, userId: string, data: Partial<InsertDotEquipment>): Promise<DotEquipment | undefined> {
    const [updated] = await db.update(dotEquipment).set({ ...data, updatedAt: new Date() }).where(and(eq(dotEquipment.id, id), eq(dotEquipment.userId, userId))).returning();
    return updated;
  }

  async deleteDotEquipment(id: number, userId: string): Promise<void> {
    await db.delete(dotEquipment).where(and(eq(dotEquipment.id, id), eq(dotEquipment.userId, userId)));
  }

  async markDotDriversExported(ids: number[], userId: string, exportedAt: Date): Promise<void> {
    if (ids.length === 0) return;
    for (const id of ids) {
      await db.update(dotDrivers)
        .set({ clearinghouseExportedAt: exportedAt, updatedAt: new Date() })
        .where(and(eq(dotDrivers.id, id), eq(dotDrivers.userId, userId)));
    }
  }

  async markDotDriversRemovalExported(ids: number[], userId: string): Promise<void> {
    if (ids.length === 0) return;
    for (const id of ids) {
      await db.update(dotDrivers)
        .set({ clearinghouseRemovalExported: true, updatedAt: new Date() })
        .where(and(eq(dotDrivers.id, id), eq(dotDrivers.userId, userId)));
    }
  }

  // ── Random Testing ──────────────────────────────────────────────────────────
  async getDotRandomTests(userId: string, year?: number): Promise<DotRandomTest[]> {
    const conditions = [eq(dotRandomTests.userId, userId)];
    if (year) conditions.push(eq(dotRandomTests.programYear, year));
    return db.select().from(dotRandomTests).where(and(...conditions)).orderBy(desc(dotRandomTests.selectedDate));
  }

  async createDotRandomTest(data: InsertDotRandomTest): Promise<DotRandomTest> {
    const [rec] = await db.insert(dotRandomTests).values(data).returning();
    return rec;
  }

  async updateDotRandomTest(id: number, userId: string, data: Partial<InsertDotRandomTest>): Promise<DotRandomTest | undefined> {
    const [rec] = await db.update(dotRandomTests).set(data).where(and(eq(dotRandomTests.id, id), eq(dotRandomTests.userId, userId))).returning();
    return rec;
  }

  async deleteDotRandomTest(id: number, userId: string): Promise<void> {
    await db.delete(dotRandomTests).where(and(eq(dotRandomTests.id, id), eq(dotRandomTests.userId, userId)));
  }

  // ── Accident Register ───────────────────────────────────────────────────────
  async getDotAccidents(userId: string): Promise<DotAccident[]> {
    return db.select().from(dotAccidents).where(eq(dotAccidents.userId, userId)).orderBy(desc(dotAccidents.accidentDate));
  }

  async createDotAccident(data: InsertDotAccident): Promise<DotAccident> {
    const [rec] = await db.insert(dotAccidents).values(data).returning();
    return rec;
  }

  async updateDotAccident(id: number, userId: string, data: Partial<InsertDotAccident>): Promise<DotAccident | undefined> {
    const [rec] = await db.update(dotAccidents).set({ ...data, updatedAt: new Date() }).where(and(eq(dotAccidents.id, id), eq(dotAccidents.userId, userId))).returning();
    return rec;
  }

  async deleteDotAccident(id: number, userId: string): Promise<void> {
    await db.delete(dotAccidents).where(and(eq(dotAccidents.id, id), eq(dotAccidents.userId, userId)));
  }

  // ── Roadside Inspections ────────────────────────────────────────────────────
  async getDotRoadsideInspections(userId: string): Promise<DotRoadsideInspection[]> {
    return db.select().from(dotRoadsideInspections).where(eq(dotRoadsideInspections.userId, userId)).orderBy(desc(dotRoadsideInspections.inspectionDate));
  }

  async createDotRoadsideInspection(data: InsertDotRoadsideInspection): Promise<DotRoadsideInspection> {
    const [rec] = await db.insert(dotRoadsideInspections).values(data).returning();
    return rec;
  }

  async updateDotRoadsideInspection(id: number, userId: string, data: Partial<InsertDotRoadsideInspection>): Promise<DotRoadsideInspection | undefined> {
    const [rec] = await db.update(dotRoadsideInspections).set(data).where(and(eq(dotRoadsideInspections.id, id), eq(dotRoadsideInspections.userId, userId))).returning();
    return rec;
  }

  async deleteDotRoadsideInspection(id: number, userId: string): Promise<void> {
    await db.delete(dotRoadsideInspections).where(and(eq(dotRoadsideInspections.id, id), eq(dotRoadsideInspections.userId, userId)));
  }

  // ── DVIR Logs ───────────────────────────────────────────────────────────────
  async getDotDvirLogs(userId: string): Promise<DotDvirLog[]> {
    return db.select().from(dotDvirLogs).where(eq(dotDvirLogs.userId, userId)).orderBy(desc(dotDvirLogs.inspectionDate));
  }

  async createDotDvirLog(data: InsertDotDvirLog): Promise<DotDvirLog> {
    const [rec] = await db.insert(dotDvirLogs).values(data).returning();
    return rec;
  }

  async updateDotDvirLog(id: number, userId: string, data: Partial<InsertDotDvirLog>): Promise<DotDvirLog | undefined> {
    const [rec] = await db.update(dotDvirLogs).set(data).where(and(eq(dotDvirLogs.id, id), eq(dotDvirLogs.userId, userId))).returning();
    return rec;
  }

  async deleteDotDvirLog(id: number, userId: string): Promise<void> {
    await db.delete(dotDvirLogs).where(and(eq(dotDvirLogs.id, id), eq(dotDvirLogs.userId, userId)));
  }

  // ─── Audit Process Schedule (IATF 9.2.2.2) ───────────────────────────────────
  async getAuditProcessSchedule(userId: string, isSuperadmin = false): Promise<AuditProcessSchedule[]> {
    return db.select().from(auditProcessSchedule)
      .where(isSuperadmin ? undefined : eq(auditProcessSchedule.userId, userId))
      .orderBy(auditProcessSchedule.processType, auditProcessSchedule.processName);
  }

  async upsertAuditProcessSchedule(data: any, userId: string): Promise<AuditProcessSchedule> {
    if (data.id) {
      const { id, ...rest } = data;
      const [updated] = await db.update(auditProcessSchedule)
        .set({ ...rest, updatedAt: new Date() })
        .where(and(eq(auditProcessSchedule.id, id), eq(auditProcessSchedule.userId, userId)))
        .returning();
      return updated;
    }
    const [created] = await db.insert(auditProcessSchedule).values({ ...data, userId }).returning();
    return created;
  }

  async deleteAuditProcessSchedule(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(auditProcessSchedule).where(
      isSuperadmin ? eq(auditProcessSchedule.id, id) : and(eq(auditProcessSchedule.id, id), eq(auditProcessSchedule.userId, userId))
    );
  }

  // ─── ISO Audits ──────────────────────────────────────────────────────────────
  async getIsoAudits(userId: string, isSuperadmin = false): Promise<IsoAudit[]> {
    return db.select().from(isoAudits).where(isSuperadmin ? undefined : eq(isoAudits.userId, userId)).orderBy(desc(isoAudits.createdAt));
  }

  async getIsoAudit(id: number, userId: string, isSuperadmin = false): Promise<IsoAudit | undefined> {
    const [rec] = await db.select().from(isoAudits).where(isSuperadmin ? eq(isoAudits.id, id) : and(eq(isoAudits.id, id), eq(isoAudits.userId, userId)));
    return rec;
  }

  async createIsoAudit(data: InsertIsoAudit): Promise<IsoAudit> {
    const [rec] = await db.insert(isoAudits).values(data).returning();
    return rec;
  }

  async updateIsoAudit(id: number, userId: string, data: Partial<InsertIsoAudit>, isSuperadmin = false): Promise<IsoAudit | undefined> {
    const [rec] = await db.update(isoAudits).set({ ...data, updatedAt: new Date() }).where(isSuperadmin ? eq(isoAudits.id, id) : and(eq(isoAudits.id, id), eq(isoAudits.userId, userId))).returning();
    return rec;
  }

  async deleteIsoAudit(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoAudits).where(isSuperadmin ? eq(isoAudits.id, id) : and(eq(isoAudits.id, id), eq(isoAudits.userId, userId)));
  }

  // ─── ISO Audit Findings ───────────────────────────────────────────────────────
  async getIsoAuditFindings(auditId: number, userId: string, isSuperadmin = false): Promise<IsoAuditFinding[]> {
    return db.select().from(isoAuditFindings).where(isSuperadmin ? eq(isoAuditFindings.auditId, auditId) : and(eq(isoAuditFindings.auditId, auditId), eq(isoAuditFindings.userId, userId))).orderBy(isoAuditFindings.clause);
  }

  async createIsoAuditFinding(data: InsertIsoAuditFinding): Promise<IsoAuditFinding> {
    const [rec] = await db.insert(isoAuditFindings).values(data).returning();
    return rec;
  }

  async updateIsoAuditFinding(id: number, userId: string, data: Partial<InsertIsoAuditFinding>, isSuperadmin = false): Promise<IsoAuditFinding | undefined> {
    const [rec] = await db.update(isoAuditFindings).set({ ...data, updatedAt: new Date() }).where(isSuperadmin ? eq(isoAuditFindings.id, id) : and(eq(isoAuditFindings.id, id), eq(isoAuditFindings.userId, userId))).returning();
    return rec;
  }

  async deleteIsoAuditFinding(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoAuditFindings).where(isSuperadmin ? eq(isoAuditFindings.id, id) : and(eq(isoAuditFindings.id, id), eq(isoAuditFindings.userId, userId)));
  }

  // ─── ISO Audit Process Notes ──────────────────────────────────────────────────
  async getIsoAuditProcessNotes(auditId: number, userId: string, isSuperadmin = false): Promise<IsoAuditProcessNote[]> {
    return db.select().from(isoAuditProcessNotes).where(
      isSuperadmin ? eq(isoAuditProcessNotes.auditId, auditId) : and(eq(isoAuditProcessNotes.auditId, auditId), eq(isoAuditProcessNotes.userId, userId))
    ).orderBy(isoAuditProcessNotes.processName);
  }

  async upsertIsoAuditProcessNote(data: InsertIsoAuditProcessNote, userId: string, isSuperadmin = false): Promise<IsoAuditProcessNote> {
    const existing = await db.select().from(isoAuditProcessNotes).where(
      isSuperadmin
        ? and(eq(isoAuditProcessNotes.auditId, data.auditId), eq(isoAuditProcessNotes.processName, data.processName))
        : and(eq(isoAuditProcessNotes.auditId, data.auditId), eq(isoAuditProcessNotes.processName, data.processName), eq(isoAuditProcessNotes.userId, userId))
    );
    if (existing.length > 0) {
      const [rec] = await db.update(isoAuditProcessNotes).set({ ...data, updatedAt: new Date() }).where(eq(isoAuditProcessNotes.id, existing[0].id)).returning();
      return rec;
    }
    const [rec] = await db.insert(isoAuditProcessNotes).values(data).returning();
    return rec;
  }

  async deleteIsoAuditProcessNote(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoAuditProcessNotes).where(isSuperadmin ? eq(isoAuditProcessNotes.id, id) : and(eq(isoAuditProcessNotes.id, id), eq(isoAuditProcessNotes.userId, userId)));
  }

  // ─── IATF §9.2.2.3 — Product Audits ─────────────────────────────────────────
  async getIatfProductAudits(userId: string, isSuperadmin = false): Promise<IatfProductAudit[]> {
    return db.select().from(iatfProductAudits).where(isSuperadmin ? undefined : eq(iatfProductAudits.userId, userId)).orderBy(desc(iatfProductAudits.createdAt));
  }
  async createIatfProductAudit(data: InsertIatfProductAudit): Promise<IatfProductAudit> {
    const [rec] = await db.insert(iatfProductAudits).values(data).returning();
    return rec;
  }
  async updateIatfProductAudit(id: number, userId: string, data: Partial<InsertIatfProductAudit>, isSuperadmin = false): Promise<IatfProductAudit | undefined> {
    const [rec] = await db.update(iatfProductAudits).set(data).where(isSuperadmin ? eq(iatfProductAudits.id, id) : and(eq(iatfProductAudits.id, id), eq(iatfProductAudits.userId, userId))).returning();
    return rec;
  }
  async deleteIatfProductAudit(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(iatfProductAudits).where(isSuperadmin ? eq(iatfProductAudits.id, id) : and(eq(iatfProductAudits.id, id), eq(iatfProductAudits.userId, userId)));
  }

  // ─── IATF §9.2.2.4 — Manufacturing Process Audits ───────────────────────────
  async getIatfMfgProcessAudits(userId: string, isSuperadmin = false): Promise<IatfMfgProcessAudit[]> {
    return db.select().from(iatfMfgProcessAudits).where(isSuperadmin ? undefined : eq(iatfMfgProcessAudits.userId, userId)).orderBy(desc(iatfMfgProcessAudits.createdAt));
  }
  async createIatfMfgProcessAudit(data: InsertIatfMfgProcessAudit): Promise<IatfMfgProcessAudit> {
    const [rec] = await db.insert(iatfMfgProcessAudits).values(data).returning();
    return rec;
  }
  async updateIatfMfgProcessAudit(id: number, userId: string, data: Partial<InsertIatfMfgProcessAudit>, isSuperadmin = false): Promise<IatfMfgProcessAudit | undefined> {
    const [rec] = await db.update(iatfMfgProcessAudits).set(data).where(isSuperadmin ? eq(iatfMfgProcessAudits.id, id) : and(eq(iatfMfgProcessAudits.id, id), eq(iatfMfgProcessAudits.userId, userId))).returning();
    return rec;
  }
  async deleteIatfMfgProcessAudit(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(iatfMfgProcessAudits).where(isSuperadmin ? eq(iatfMfgProcessAudits.id, id) : and(eq(iatfMfgProcessAudits.id, id), eq(iatfMfgProcessAudits.userId, userId)));
  }

  // ─── IATF Audit Schedule ──────────────────────────────────────────────────────
  async getIatfAuditSchedule(userId: string, isSuperadmin = false): Promise<IatfAuditSchedule[]> {
    return db.select().from(iatfAuditSchedule).where(isSuperadmin ? undefined : eq(iatfAuditSchedule.userId, userId)).orderBy(iatfAuditSchedule.nextDueDate);
  }
  async createIatfAuditScheduleEntry(data: InsertIatfAuditSchedule): Promise<IatfAuditSchedule> {
    const [rec] = await db.insert(iatfAuditSchedule).values(data).returning();
    return rec;
  }
  async updateIatfAuditScheduleEntry(id: number, userId: string, data: Partial<InsertIatfAuditSchedule>, isSuperadmin = false): Promise<IatfAuditSchedule | undefined> {
    const [rec] = await db.update(iatfAuditSchedule).set({ ...data, updatedAt: new Date() }).where(isSuperadmin ? eq(iatfAuditSchedule.id, id) : and(eq(iatfAuditSchedule.id, id), eq(iatfAuditSchedule.userId, userId))).returning();
    return rec;
  }
  async deleteIatfAuditScheduleEntry(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(iatfAuditSchedule).where(isSuperadmin ? eq(iatfAuditSchedule.id, id) : and(eq(iatfAuditSchedule.id, id), eq(iatfAuditSchedule.userId, userId)));
  }

  // ─── ISO Awareness Notices ────────────────────────────────────────────────────
  async getIsoAwarenessNotices(userId: string, isSuperadmin = false): Promise<IsoAwarenessNotice[]> {
    return db.select().from(isoAwarenessNotices).where(isSuperadmin ? undefined : eq(isoAwarenessNotices.userId, userId)).orderBy(desc(isoAwarenessNotices.createdAt));
  }

  async createIsoAwarenessNotice(data: InsertIsoAwarenessNotice): Promise<IsoAwarenessNotice> {
    const [rec] = await db.insert(isoAwarenessNotices).values(data).returning();
    return rec;
  }

  async updateIsoAwarenessNotice(id: number, userId: string, data: Partial<InsertIsoAwarenessNotice>, isSuperadmin = false): Promise<IsoAwarenessNotice | undefined> {
    const [rec] = await db.update(isoAwarenessNotices).set(data).where(isSuperadmin ? eq(isoAwarenessNotices.id, id) : and(eq(isoAwarenessNotices.id, id), eq(isoAwarenessNotices.userId, userId))).returning();
    return rec;
  }

  async deleteIsoAwarenessNotice(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoAwarenessNotices).where(isSuperadmin ? eq(isoAwarenessNotices.id, id) : and(eq(isoAwarenessNotices.id, id), eq(isoAwarenessNotices.userId, userId)));
  }

  // ─── ISO Awareness Acknowledgments ───────────────────────────────────────────
  async getIsoAwarenessAcknowledgments(noticeId: number): Promise<IsoAwarenessAcknowledgment[]> {
    return db.select().from(isoAwarenessAcknowledgments).where(eq(isoAwarenessAcknowledgments.noticeId, noticeId)).orderBy(desc(isoAwarenessAcknowledgments.acknowledgedAt));
  }

  async createIsoAwarenessAcknowledgment(data: InsertIsoAwarenessAcknowledgment): Promise<IsoAwarenessAcknowledgment> {
    const [rec] = await db.insert(isoAwarenessAcknowledgments).values(data).returning();
    return rec;
  }

  // ─── §7.2 Competency Requirements ────────────────────────────────────────────
  async getCompetencyRequirements(userId: string, isSuperadmin = false): Promise<CompetencyRequirement[]> {
    const cond = isSuperadmin ? undefined : eq(competencyRequirements.userId, userId);
    return db.select().from(competencyRequirements).where(cond).orderBy(competencyRequirements.jobTitle, competencyRequirements.competencyName);
  }
  async createCompetencyRequirement(data: InsertCompetencyRequirement): Promise<CompetencyRequirement> {
    const [rec] = await db.insert(competencyRequirements).values(data).returning();
    return rec;
  }
  async updateCompetencyRequirement(id: number, userId: string, data: Partial<InsertCompetencyRequirement>, isSuperadmin = false): Promise<CompetencyRequirement | undefined> {
    const cond = isSuperadmin ? eq(competencyRequirements.id, id) : and(eq(competencyRequirements.id, id), eq(competencyRequirements.userId, userId));
    const [rec] = await db.update(competencyRequirements).set(data).where(cond).returning();
    return rec;
  }
  async deleteCompetencyRequirement(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const cond = isSuperadmin ? eq(competencyRequirements.id, id) : and(eq(competencyRequirements.id, id), eq(competencyRequirements.userId, userId));
    await db.delete(competencyRequirements).where(cond);
  }

  // ─── §7.2 Employee Competency Records ────────────────────────────────────────
  async getEmployeeCompetencyRecords(userId: string, employeeId?: number, isSuperadmin = false): Promise<EmployeeCompetencyRecord[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = employeeId != null ? eq(employeeCompetencyRecords.employeeId, employeeId) : undefined;
    } else {
      cond = employeeId != null
        ? and(eq(employeeCompetencyRecords.userId, userId), eq(employeeCompetencyRecords.employeeId, employeeId))
        : eq(employeeCompetencyRecords.userId, userId);
    }
    return db.select().from(employeeCompetencyRecords).where(cond).orderBy(desc(employeeCompetencyRecords.createdAt));
  }
  async createEmployeeCompetencyRecord(data: InsertEmployeeCompetencyRecord): Promise<EmployeeCompetencyRecord> {
    const [rec] = await db.insert(employeeCompetencyRecords).values(data).returning();
    return rec;
  }
  async updateEmployeeCompetencyRecord(id: number, userId: string, data: Partial<InsertEmployeeCompetencyRecord>, isSuperadmin = false): Promise<EmployeeCompetencyRecord | undefined> {
    const cond = isSuperadmin ? eq(employeeCompetencyRecords.id, id) : and(eq(employeeCompetencyRecords.id, id), eq(employeeCompetencyRecords.userId, userId));
    const [rec] = await db.update(employeeCompetencyRecords).set(data).where(cond).returning();
    return rec;
  }
  async deleteEmployeeCompetencyRecord(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const cond = isSuperadmin ? eq(employeeCompetencyRecords.id, id) : and(eq(employeeCompetencyRecords.id, id), eq(employeeCompetencyRecords.userId, userId));
    await db.delete(employeeCompetencyRecords).where(cond);
  }

  // ─── Training Event Log ───────────────────────────────────────────────────────
  async getTrainingEventRecords(userId: string, isSuperadmin = false): Promise<TrainingEventRecord[]> {
    const cond = isSuperadmin ? undefined : eq(trainingEventRecords.userId, userId);
    return db.select().from(trainingEventRecords).where(cond).orderBy(desc(trainingEventRecords.trainingDate));
  }
  async createTrainingEventRecord(data: InsertTrainingEventRecord): Promise<TrainingEventRecord> {
    const [rec] = await db.insert(trainingEventRecords).values(data).returning();
    return rec;
  }
  async updateTrainingEventRecord(id: number, userId: string, data: Partial<InsertTrainingEventRecord>, isSuperadmin = false): Promise<TrainingEventRecord | undefined> {
    const cond = isSuperadmin ? eq(trainingEventRecords.id, id) : and(eq(trainingEventRecords.id, id), eq(trainingEventRecords.userId, userId));
    const [rec] = await db.update(trainingEventRecords).set(data).where(cond).returning();
    return rec;
  }
  async deleteTrainingEventRecord(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const cond = isSuperadmin ? eq(trainingEventRecords.id, id) : and(eq(trainingEventRecords.id, id), eq(trainingEventRecords.userId, userId));
    await db.delete(trainingEventRecords).where(cond);
  }

  // ─── Cross-Training / Skills Matrix ──────────────────────────────────────────
  async getTrainingMatrixSkills(userId: string, isSuperadmin = false): Promise<TrainingMatrixSkill[]> {
    const cond = isSuperadmin ? undefined : eq(trainingMatrixSkills.userId, userId);
    return db.select().from(trainingMatrixSkills).where(cond).orderBy(trainingMatrixSkills.sortOrder, trainingMatrixSkills.skillName);
  }
  async createTrainingMatrixSkill(data: InsertTrainingMatrixSkill): Promise<TrainingMatrixSkill> {
    const [rec] = await db.insert(trainingMatrixSkills).values(data).returning();
    return rec;
  }
  async updateTrainingMatrixSkill(id: number, userId: string, data: Partial<InsertTrainingMatrixSkill>, isSuperadmin = false): Promise<TrainingMatrixSkill | undefined> {
    const cond = isSuperadmin ? eq(trainingMatrixSkills.id, id) : and(eq(trainingMatrixSkills.id, id), eq(trainingMatrixSkills.userId, userId));
    const [rec] = await db.update(trainingMatrixSkills).set(data).where(cond).returning();
    return rec;
  }
  async deleteTrainingMatrixSkill(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const cond = isSuperadmin ? eq(trainingMatrixSkills.id, id) : and(eq(trainingMatrixSkills.id, id), eq(trainingMatrixSkills.userId, userId));
    await db.delete(trainingMatrixSkills).where(cond);
    await db.delete(trainingMatrixEntries).where(and(eq(trainingMatrixEntries.skillId, id), eq(trainingMatrixEntries.userId, userId)));
  }
  async getTrainingMatrixEntries(userId: string, isSuperadmin = false): Promise<TrainingMatrixEntry[]> {
    const cond = isSuperadmin ? undefined : eq(trainingMatrixEntries.userId, userId);
    return db.select().from(trainingMatrixEntries).where(cond);
  }
  async upsertTrainingMatrixEntry(data: InsertTrainingMatrixEntry): Promise<TrainingMatrixEntry> {
    const existing = await db.select().from(trainingMatrixEntries)
      .where(and(eq(trainingMatrixEntries.userId, data.userId), eq(trainingMatrixEntries.employeeId, data.employeeId), eq(trainingMatrixEntries.skillId, data.skillId)))
      .limit(1);
    if (existing.length > 0) {
      const [rec] = await db.update(trainingMatrixEntries)
        .set({ level: data.level, notes: data.notes, updatedAt: new Date() })
        .where(eq(trainingMatrixEntries.id, existing[0].id)).returning();
      return rec;
    }
    const [rec] = await db.insert(trainingMatrixEntries).values(data).returning();
    return rec;
  }
  async deleteTrainingMatrixEntry(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const cond = isSuperadmin ? eq(trainingMatrixEntries.id, id) : and(eq(trainingMatrixEntries.id, id), eq(trainingMatrixEntries.userId, userId));
    await db.delete(trainingMatrixEntries).where(cond);
  }

  // ─── Training Evidence Files ──────────────────────────────────────────────────
  async getTrainingEvidenceFiles(userId: string, filters: { employeeId?: number; competencyRecordId?: number; trainingEventId?: number } = {}, isSuperadmin = false): Promise<TrainingEvidenceFile[]> {
    const conditions: any[] = [];
    if (!isSuperadmin) conditions.push(eq(trainingEvidenceFiles.userId, userId));
    if (filters.employeeId != null) conditions.push(eq(trainingEvidenceFiles.employeeId, filters.employeeId));
    if (filters.competencyRecordId != null) conditions.push(eq(trainingEvidenceFiles.competencyRecordId, filters.competencyRecordId));
    if (filters.trainingEventId != null) conditions.push(eq(trainingEvidenceFiles.trainingEventId, filters.trainingEventId));
    const cond = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(trainingEvidenceFiles).where(cond).orderBy(desc(trainingEvidenceFiles.uploadedAt));
  }
  async createTrainingEvidenceFile(data: InsertTrainingEvidenceFile): Promise<TrainingEvidenceFile> {
    const [rec] = await db.insert(trainingEvidenceFiles).values(data).returning();
    return rec;
  }
  async deleteTrainingEvidenceFile(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const cond = isSuperadmin ? eq(trainingEvidenceFiles.id, id) : and(eq(trainingEvidenceFiles.id, id), eq(trainingEvidenceFiles.userId, userId));
    await db.delete(trainingEvidenceFiles).where(cond);
  }

  // ─── ISO Objectives ───────────────────────────────────────────────────────────
  async getIsoObjectives(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<IsoObjective[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(isoObjectives.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(isoObjectives.userId, userId), eq(isoObjectives.isoProjectId, isoProjectId))
        : eq(isoObjectives.userId, userId);
    }
    return db.select().from(isoObjectives).where(cond).orderBy(isoObjectives.processName, isoObjectives.name);
  }

  async getIsoObjectivesByProcess(userId: string, processName: string, isSuperadmin = false): Promise<IsoObjective[]> {
    return db.select().from(isoObjectives).where(isSuperadmin ? eq(isoObjectives.processName, processName) : and(eq(isoObjectives.userId, userId), eq(isoObjectives.processName, processName)));
  }

  async createIsoObjective(data: InsertIsoObjective): Promise<IsoObjective> {
    const [rec] = await db.insert(isoObjectives).values(data).returning();
    return rec;
  }

  async updateIsoObjective(id: number, userId: string, data: Partial<InsertIsoObjective>, isSuperadmin = false): Promise<IsoObjective | undefined> {
    const [rec] = await db.update(isoObjectives).set({ ...data, updatedAt: new Date() }).where(isSuperadmin ? eq(isoObjectives.id, id) : and(eq(isoObjectives.id, id), eq(isoObjectives.userId, userId))).returning();
    return rec;
  }

  async deleteIsoObjective(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoObjectives).where(isSuperadmin ? eq(isoObjectives.id, id) : and(eq(isoObjectives.id, id), eq(isoObjectives.userId, userId)));
  }

  async upsertIsoObjectiveForProcess(userId: string, isoProjectId: number | undefined, processName: string, name: string, target: string, unit: string, responsible?: string): Promise<IsoObjective> {
    const conditions = isoProjectId != null
      ? and(eq(isoObjectives.userId, userId), eq(isoObjectives.isoProjectId, isoProjectId), eq(isoObjectives.processName, processName), eq(isoObjectives.name, name))
      : and(eq(isoObjectives.userId, userId), eq(isoObjectives.processName, processName), eq(isoObjectives.name, name));
    const [existing] = await db.select().from(isoObjectives).where(conditions);
    if (existing) {
      const [updated] = await db.update(isoObjectives).set({ target, unit, responsible: responsible ?? existing.responsible, updatedAt: new Date() }).where(eq(isoObjectives.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(isoObjectives).values({ userId, isoProjectId, processName, name, target, unit, responsible }).returning();
    return created;
  }

  // ─── ISO KPI Actuals ──────────────────────────────────────────────────────────
  async getIsoKpiActuals(userId: string, objectiveId?: number, isoProjectId?: number, isSuperadmin = false): Promise<IsoKpiActual[]> {
    if (objectiveId) {
      return db.select().from(isoKpiActuals).where(isSuperadmin ? eq(isoKpiActuals.objectiveId, objectiveId) : and(eq(isoKpiActuals.userId, userId), eq(isoKpiActuals.objectiveId, objectiveId))).orderBy(desc(isoKpiActuals.loggedAt));
    }
    if (isoProjectId != null) {
      const projectObjIds = await db.select({ id: isoObjectives.id })
        .from(isoObjectives)
        .where(isSuperadmin ? eq(isoObjectives.isoProjectId, isoProjectId) : and(eq(isoObjectives.userId, userId), eq(isoObjectives.isoProjectId, isoProjectId)));
      const ids = projectObjIds.map(o => o.id);
      if (ids.length === 0) return [];
      return db.select().from(isoKpiActuals)
        .where(isSuperadmin ? inArray(isoKpiActuals.objectiveId, ids) : and(eq(isoKpiActuals.userId, userId), inArray(isoKpiActuals.objectiveId, ids)))
        .orderBy(desc(isoKpiActuals.loggedAt));
    }
    return db.select().from(isoKpiActuals).where(isSuperadmin ? undefined : eq(isoKpiActuals.userId, userId)).orderBy(desc(isoKpiActuals.loggedAt));
  }

  async createIsoKpiActual(data: InsertIsoKpiActual): Promise<IsoKpiActual> {
    const [rec] = await db.insert(isoKpiActuals).values(data).returning();
    return rec;
  }

  async deleteIsoKpiActual(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoKpiActuals).where(isSuperadmin ? eq(isoKpiActuals.id, id) : and(eq(isoKpiActuals.id, id), eq(isoKpiActuals.userId, userId)));
  }

  // ─── ISO Risks ────────────────────────────────────────────────────────────────
  async getIsoRisks(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<IsoRisk[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(isoRisks.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(isoRisks.userId, userId), eq(isoRisks.isoProjectId, isoProjectId))
        : eq(isoRisks.userId, userId);
    }
    return db.select().from(isoRisks).where(cond).orderBy(desc(isoRisks.riskScore));
  }
  async createIsoRisk(data: InsertIsoRisk): Promise<IsoRisk> {
    const [r] = await db.insert(isoRisks).values(data).returning();
    return r;
  }
  async updateIsoRisk(id: number, userId: string, data: Partial<IsoRisk>, isSuperadmin = false): Promise<IsoRisk | undefined> {
    const [r] = await db.update(isoRisks).set({ ...data, updatedAt: new Date() }).where(isSuperadmin ? eq(isoRisks.id, id) : and(eq(isoRisks.id, id), eq(isoRisks.userId, userId))).returning();
    return r;
  }
  async deleteIsoRisk(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoRisks).where(isSuperadmin ? eq(isoRisks.id, id) : and(eq(isoRisks.id, id), eq(isoRisks.userId, userId)));
  }

  // ─── ISO Management Reviews ───────────────────────────────────────────────────
  async getIsoManagementReviews(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<IsoManagementReview[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(isoManagementReviews.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(isoManagementReviews.userId, userId), eq(isoManagementReviews.isoProjectId, isoProjectId))
        : eq(isoManagementReviews.userId, userId);
    }
    return db.select().from(isoManagementReviews).where(cond).orderBy(desc(isoManagementReviews.meetingDate));
  }
  async getIsoManagementReview(id: number, userId: string, isSuperadmin = false): Promise<IsoManagementReview | undefined> {
    const [r] = await db.select().from(isoManagementReviews).where(isSuperadmin ? eq(isoManagementReviews.id, id) : and(eq(isoManagementReviews.id, id), eq(isoManagementReviews.userId, userId)));
    return r;
  }
  async createIsoManagementReview(data: InsertIsoManagementReview): Promise<IsoManagementReview> {
    const [r] = await db.insert(isoManagementReviews).values(data).returning();
    return r;
  }
  async updateIsoManagementReview(id: number, userId: string, data: Partial<InsertIsoManagementReview>, isSuperadmin = false): Promise<IsoManagementReview | undefined> {
    const [r] = await db.update(isoManagementReviews).set({ ...data, updatedAt: new Date() }).where(isSuperadmin ? eq(isoManagementReviews.id, id) : and(eq(isoManagementReviews.id, id), eq(isoManagementReviews.userId, userId))).returning();
    return r;
  }
  async deleteIsoManagementReview(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoManagementReviews).where(isSuperadmin ? eq(isoManagementReviews.id, id) : and(eq(isoManagementReviews.id, id), eq(isoManagementReviews.userId, userId)));
  }

  // ─── ISO Review Action Items ──────────────────────────────────────────────────
  async getIsoReviewActionItems(reviewId: number, userId: string, isSuperadmin = false): Promise<IsoReviewActionItem[]> {
    return db.select().from(isoReviewActionItems).where(isSuperadmin ? eq(isoReviewActionItems.reviewId, reviewId) : and(eq(isoReviewActionItems.reviewId, reviewId), eq(isoReviewActionItems.userId, userId))).orderBy(isoReviewActionItems.createdAt);
  }
  async getAllIsoReviewActionItems(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<IsoReviewActionItem[]> {
    if (isoProjectId != null) {
      const projectReviews = await db.select({ id: isoManagementReviews.id })
        .from(isoManagementReviews)
        .where(isSuperadmin ? eq(isoManagementReviews.isoProjectId, isoProjectId) : and(eq(isoManagementReviews.userId, userId), eq(isoManagementReviews.isoProjectId, isoProjectId)));
      const ids = projectReviews.map(r => r.id);
      if (ids.length === 0) return [];
      return db.select().from(isoReviewActionItems)
        .where(isSuperadmin ? inArray(isoReviewActionItems.reviewId, ids) : and(eq(isoReviewActionItems.userId, userId), inArray(isoReviewActionItems.reviewId, ids)));
    }
    return db.select().from(isoReviewActionItems).where(isSuperadmin ? undefined : eq(isoReviewActionItems.userId, userId));
  }
  async createIsoReviewActionItem(data: InsertIsoReviewActionItem): Promise<IsoReviewActionItem> {
    const [r] = await db.insert(isoReviewActionItems).values(data).returning();
    return r;
  }
  async updateIsoReviewActionItem(id: number, userId: string, data: Partial<InsertIsoReviewActionItem>, isSuperadmin = false): Promise<IsoReviewActionItem | undefined> {
    const [r] = await db.update(isoReviewActionItems).set(data).where(isSuperadmin ? eq(isoReviewActionItems.id, id) : and(eq(isoReviewActionItems.id, id), eq(isoReviewActionItems.userId, userId))).returning();
    return r;
  }
  async deleteIsoReviewActionItem(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoReviewActionItems).where(isSuperadmin ? eq(isoReviewActionItems.id, id) : and(eq(isoReviewActionItems.id, id), eq(isoReviewActionItems.userId, userId)));
  }

  // ─── ISO Action Items (cross-source tracker) ─────────────────────────────────
  async getIsoActionItems(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<IsoActionItem[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(isoActionItems.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(isoActionItems.userId, userId), eq(isoActionItems.isoProjectId, isoProjectId))
        : eq(isoActionItems.userId, userId);
    }
    return db.select().from(isoActionItems).where(cond).orderBy(desc(isoActionItems.createdAt));
  }
  async createIsoActionItem(data: InsertIsoActionItem): Promise<IsoActionItem> {
    const [item] = await db.insert(isoActionItems).values(data).returning();
    return item;
  }
  async updateIsoActionItem(id: number, userId: string, data: Partial<InsertIsoActionItem>, isSuperadmin = false): Promise<IsoActionItem | undefined> {
    const cond = isSuperadmin ? eq(isoActionItems.id, id) : and(eq(isoActionItems.id, id), eq(isoActionItems.userId, userId));
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === 'completed' && !data.closedAt) updateData.closedAt = new Date();
    if (data.status && data.status !== 'completed') updateData.closedAt = null;
    const [item] = await db.update(isoActionItems).set(updateData).where(cond).returning();
    return item;
  }
  async deleteIsoActionItem(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoActionItems).where(isSuperadmin ? eq(isoActionItems.id, id) : and(eq(isoActionItems.id, id), eq(isoActionItems.userId, userId)));
  }

  // ─── ISO Communications ───────────────────────────────────────────────────────
  async getIsoCommunications(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<IsoCommunication[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(isoCommunications.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(isoCommunications.userId, userId), eq(isoCommunications.isoProjectId, isoProjectId))
        : eq(isoCommunications.userId, userId);
    }
    return db.select().from(isoCommunications).where(cond).orderBy(desc(isoCommunications.date));
  }
  async createIsoCommunication(data: InsertIsoCommunication): Promise<IsoCommunication> {
    const [r] = await db.insert(isoCommunications).values(data).returning();
    return r;
  }
  async updateIsoCommunication(id: number, userId: string, data: Partial<InsertIsoCommunication>, isSuperadmin = false): Promise<IsoCommunication | undefined> {
    const [r] = await db.update(isoCommunications).set({ ...data, updatedAt: new Date() }).where(isSuperadmin ? eq(isoCommunications.id, id) : and(eq(isoCommunications.id, id), eq(isoCommunications.userId, userId))).returning();
    return r;
  }
  async deleteIsoCommunication(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(isoCommunications).where(isSuperadmin ? eq(isoCommunications.id, id) : and(eq(isoCommunications.id, id), eq(isoCommunications.userId, userId)));
  }

  // ─── Supplier Management ───────────────────────────────────────────────────
  async getSuppliers(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<Supplier[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(suppliers.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(suppliers.userId, userId), eq(suppliers.isoProjectId, isoProjectId))
        : eq(suppliers.userId, userId);
    }
    return db.select().from(suppliers).where(cond).orderBy(suppliers.name);
  }
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [r] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return r;
  }
  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [r] = await db.insert(suppliers).values(data).returning();
    return r;
  }
  async updateSupplier(id: number, userId: string, data: Partial<InsertSupplier>, isSuperadmin = false): Promise<Supplier | undefined> {
    const [r] = await db.update(suppliers).set({ ...data, updatedAt: new Date() })
      .where(isSuperadmin ? eq(suppliers.id, id) : and(eq(suppliers.id, id), eq(suppliers.userId, userId))).returning();
    return r;
  }
  async deleteSupplier(id: number, userId: string, isSuperadmin = false): Promise<void> {
    await db.delete(suppliers).where(isSuperadmin ? eq(suppliers.id, id) : and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
  }

  async getSupplierCriteria(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<SupplierCriteria[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(supplierCriteria.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(supplierCriteria.userId, userId), eq(supplierCriteria.isoProjectId, isoProjectId))
        : eq(supplierCriteria.userId, userId);
    }
    return db.select().from(supplierCriteria).where(cond).orderBy(supplierCriteria.order);
  }
  async createSupplierCriteria(data: InsertSupplierCriteria): Promise<SupplierCriteria> {
    const [r] = await db.insert(supplierCriteria).values(data).returning();
    return r;
  }
  async updateSupplierCriteria(id: number, data: Partial<InsertSupplierCriteria>): Promise<SupplierCriteria | undefined> {
    const [r] = await db.update(supplierCriteria).set(data).where(eq(supplierCriteria.id, id)).returning();
    return r;
  }
  async deleteSupplierCriteria(id: number): Promise<void> {
    await db.delete(supplierCriteria).where(eq(supplierCriteria.id, id));
  }

  async getSupplierCandidateAssessments(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<SupplierCandidateAssessment[]> {
    const conditions: any[] = [];
    if (!isSuperadmin) conditions.push(eq(supplierCandidateAssessments.userId, userId));
    if (isoProjectId != null) conditions.push(eq(supplierCandidateAssessments.isoProjectId, isoProjectId));
    const cond = conditions.length ? and(...conditions) : undefined;
    return db.select().from(supplierCandidateAssessments).where(cond).orderBy(desc(supplierCandidateAssessments.assessmentDate), desc(supplierCandidateAssessments.id));
  }
  async createSupplierCandidateAssessment(data: InsertSupplierCandidateAssessment): Promise<SupplierCandidateAssessment> {
    const [r] = await db.insert(supplierCandidateAssessments).values(data).returning();
    return r;
  }
  async deleteSupplierCandidateAssessment(id: number): Promise<void> {
    await db.delete(supplierCandidateAssessments).where(eq(supplierCandidateAssessments.id, id));
  }

  async getSupplierEvaluations(userId: string, isoProjectId?: number, supplierId?: number, isSuperadmin = false): Promise<SupplierEvaluation[]> {
    const conditions: any[] = [];
    if (!isSuperadmin) conditions.push(eq(supplierEvaluations.userId, userId));
    if (isoProjectId != null) conditions.push(eq(supplierEvaluations.isoProjectId, isoProjectId));
    if (supplierId != null) conditions.push(eq(supplierEvaluations.supplierId, supplierId));
    const cond = conditions.length ? and(...conditions) : undefined;
    return db.select().from(supplierEvaluations).where(cond).orderBy(desc(supplierEvaluations.evaluationDate));
  }
  async createSupplierEvaluation(data: InsertSupplierEvaluation): Promise<SupplierEvaluation> {
    const [r] = await db.insert(supplierEvaluations).values(data).returning();
    return r;
  }
  async updateSupplierEvaluation(id: number, data: Partial<InsertSupplierEvaluation>): Promise<SupplierEvaluation | undefined> {
    const [r] = await db.update(supplierEvaluations).set(data).where(eq(supplierEvaluations.id, id)).returning();
    return r;
  }
  async deleteSupplierEvaluation(id: number): Promise<void> {
    await db.delete(supplierEvaluations).where(eq(supplierEvaluations.id, id));
  }

  async getSupplierAudits(userId: string, isoProjectId?: number, supplierId?: number, isSuperadmin = false): Promise<SupplierAudit[]> {
    const conditions: any[] = [];
    if (!isSuperadmin) conditions.push(eq(supplierAudits.userId, userId));
    if (isoProjectId != null) conditions.push(eq(supplierAudits.isoProjectId, isoProjectId));
    if (supplierId != null) conditions.push(eq(supplierAudits.supplierId, supplierId));
    const cond = conditions.length ? and(...conditions) : undefined;
    return db.select().from(supplierAudits).where(cond).orderBy(desc(supplierAudits.createdAt), desc(supplierAudits.id));
  }
  async upsertSupplierAudit(data: InsertSupplierAudit & { supplierId: number }): Promise<SupplierAudit> {
    const [r] = await db.insert(supplierAudits).values(data).returning();
    return r;
  }
  async updateSupplierAudit(id: number, data: Partial<InsertSupplierAudit>): Promise<SupplierAudit | undefined> {
    const [r] = await db.update(supplierAudits).set({ ...data, updatedAt: new Date() }).where(eq(supplierAudits.id, id)).returning();
    return r;
  }
  async deleteSupplierAudit(id: number): Promise<void> {
    await db.delete(supplierAudits).where(eq(supplierAudits.id, id));
  }

  // ── Calibration Equipment ────────────────────────────────────────────────────

  async getCalibrationEquipment(userId: string, isSuperadmin = false, isoProjectId?: number | null): Promise<CalibrationEquipment[]> {
    const conditions = [];
    if (!isSuperadmin) conditions.push(eq(calibrationEquipment.userId, userId));
    if (isoProjectId != null) conditions.push(eq(calibrationEquipment.isoProjectId, isoProjectId));
    const cond = conditions.length ? and(...conditions) : undefined;
    return db.select().from(calibrationEquipment).where(cond).orderBy(calibrationEquipment.gageId);
  }

  async createCalibrationEquipment(data: InsertCalibrationEquipment): Promise<CalibrationEquipment> {
    const [r] = await db.insert(calibrationEquipment).values(data).returning();
    return r;
  }

  async updateCalibrationEquipment(id: number, userId: string, data: Partial<InsertCalibrationEquipment>, isSuperadmin = false): Promise<CalibrationEquipment | undefined> {
    const where = isSuperadmin
      ? eq(calibrationEquipment.id, id)
      : and(eq(calibrationEquipment.id, id), eq(calibrationEquipment.userId, userId));
    const [r] = await db.update(calibrationEquipment).set({ ...data, updatedAt: new Date() }).where(where).returning();
    return r;
  }

  async deleteCalibrationEquipment(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin
      ? eq(calibrationEquipment.id, id)
      : and(eq(calibrationEquipment.id, id), eq(calibrationEquipment.userId, userId));
    await db.delete(calibrationEquipment).where(where);
  }

  // ── Calibration Records ──────────────────────────────────────────────────────

  async getCalibrationRecords(userId: string, isSuperadmin = false, isoProjectId?: number | null): Promise<CalibrationRecord[]> {
    const conditions = [];
    if (!isSuperadmin) conditions.push(eq(calibrationRecords.userId, userId));
    if (isoProjectId != null) conditions.push(eq(calibrationRecords.isoProjectId, isoProjectId));
    const cond = conditions.length ? and(...conditions) : undefined;
    return db.select().from(calibrationRecords).where(cond).orderBy(desc(calibrationRecords.calibrationDate));
  }

  async createCalibrationRecord(data: InsertCalibrationRecord): Promise<CalibrationRecord> {
    const [r] = await db.insert(calibrationRecords).values(data).returning();
    return r;
  }

  async updateCalibrationRecord(id: number, userId: string, data: Partial<InsertCalibrationRecord>, isSuperadmin = false): Promise<CalibrationRecord | undefined> {
    const where = isSuperadmin
      ? eq(calibrationRecords.id, id)
      : and(eq(calibrationRecords.id, id), eq(calibrationRecords.userId, userId));
    const [r] = await db.update(calibrationRecords).set(data).where(where).returning();
    return r;
  }

  async deleteCalibrationRecord(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin
      ? eq(calibrationRecords.id, id)
      : and(eq(calibrationRecords.id, id), eq(calibrationRecords.userId, userId));
    await db.delete(calibrationRecords).where(where);
  }

  // ── Calibration OOT Assessments ──────────────────────────────────────────────

  async getCalibrationOotAssessments(userId: string, isSuperadmin = false, isoProjectId?: number | null): Promise<CalibrationOotAssessment[]> {
    const conditions = [];
    if (!isSuperadmin) conditions.push(eq(calibrationOotAssessments.userId, userId));
    if (isoProjectId != null) conditions.push(eq(calibrationOotAssessments.isoProjectId, isoProjectId));
    const cond = conditions.length ? and(...conditions) : undefined;
    return db.select().from(calibrationOotAssessments).where(cond).orderBy(desc(calibrationOotAssessments.createdAt));
  }

  async createCalibrationOotAssessment(data: InsertCalibrationOotAssessment): Promise<CalibrationOotAssessment> {
    const [r] = await db.insert(calibrationOotAssessments).values(data).returning();
    return r;
  }

  async updateCalibrationOotAssessment(id: number, userId: string, data: Partial<InsertCalibrationOotAssessment>, isSuperadmin = false): Promise<CalibrationOotAssessment | undefined> {
    const where = isSuperadmin
      ? eq(calibrationOotAssessments.id, id)
      : and(eq(calibrationOotAssessments.id, id), eq(calibrationOotAssessments.userId, userId));
    const [r] = await db.update(calibrationOotAssessments).set(data).where(where).returning();
    return r;
  }

  // ── Calibration Labs ────────────────────────────────────────────────────────

  async getCalibrationLabs(userId: string, isSuperadmin = false, isoProjectId?: number | null): Promise<CalibrationLab[]> {
    const conditions = [];
    if (!isSuperadmin) conditions.push(eq(calibrationLabs.userId, userId));
    if (isoProjectId != null) conditions.push(eq(calibrationLabs.isoProjectId, isoProjectId));
    const cond = conditions.length ? and(...conditions) : undefined;
    return db.select().from(calibrationLabs).where(cond).orderBy(calibrationLabs.name);
  }

  async createCalibrationLab(data: InsertCalibrationLab): Promise<CalibrationLab> {
    const [r] = await db.insert(calibrationLabs).values(data).returning();
    return r;
  }

  async updateCalibrationLab(id: number, userId: string, data: Partial<InsertCalibrationLab>, isSuperadmin = false): Promise<CalibrationLab | undefined> {
    const where = isSuperadmin
      ? eq(calibrationLabs.id, id)
      : and(eq(calibrationLabs.id, id), eq(calibrationLabs.userId, userId));
    const [r] = await db.update(calibrationLabs).set(data).where(where).returning();
    return r;
  }

  async deleteCalibrationLab(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin
      ? eq(calibrationLabs.id, id)
      : and(eq(calibrationLabs.id, id), eq(calibrationLabs.userId, userId));
    await db.delete(calibrationLabs).where(where);
  }

  // ── Internal Lab Scope (IATF §7.1.5.3.1) ────────────────────────────────
  async getLabScope(userId: string, isSuperadmin = false, isoProjectId?: number | null): Promise<CalibrationLabScope | undefined> {
    const conditions: any[] = [];
    if (!isSuperadmin) conditions.push(eq(calibrationLabScope.userId, userId));
    if (isoProjectId != null) conditions.push(eq(calibrationLabScope.isoProjectId, isoProjectId));
    const cond = conditions.length > 1 ? and(...conditions) : conditions[0];
    const rows = await db.select().from(calibrationLabScope).where(cond).limit(1);
    return rows[0];
  }

  async upsertLabScope(userId: string, isoProjectId: number | null, data: Partial<InsertCalibrationLabScope>): Promise<CalibrationLabScope> {
    // Strip timestamp fields that may arrive as strings from the request body
    const { createdAt: _c, updatedAt: _u, id: _id, userId: _uid, isoProjectId: _pid, ...cleanData } = data as any;
    const existing = await this.getLabScope(userId, false, isoProjectId);
    if (existing) {
      const [updated] = await db
        .update(calibrationLabScope)
        .set({ ...cleanData, updatedAt: new Date() })
        .where(eq(calibrationLabScope.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(calibrationLabScope)
      .values({ userId, isoProjectId, ...cleanData })
      .returning();
    return created;
  }

  // ── Preventive Maintenance Equipment ─────────────────────────────────────
  async getPmEquipment(userId: string, isSuperadmin = false, isoProjectId?: number | null): Promise<PmEquipment[]> {
    const conditions: any[] = [];
    if (!isSuperadmin) conditions.push(eq(pmEquipment.userId, userId));
    if (isoProjectId != null) conditions.push(eq(pmEquipment.isoProjectId, isoProjectId));
    const cond = conditions.length > 1 ? and(...conditions) : conditions[0];
    return db.select().from(pmEquipment).where(cond).orderBy(pmEquipment.equipmentId);
  }

  async createPmEquipment(data: InsertPmEquipment): Promise<PmEquipment> {
    const [r] = await db.insert(pmEquipment).values(data).returning();
    return r;
  }

  async updatePmEquipment(id: number, userId: string, data: Partial<InsertPmEquipment>, isSuperadmin = false): Promise<PmEquipment | undefined> {
    const where = isSuperadmin
      ? eq(pmEquipment.id, id)
      : and(eq(pmEquipment.id, id), eq(pmEquipment.userId, userId));
    const [r] = await db.update(pmEquipment).set(data).where(where).returning();
    return r;
  }

  async deletePmEquipment(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin
      ? eq(pmEquipment.id, id)
      : and(eq(pmEquipment.id, id), eq(pmEquipment.userId, userId));
    await db.delete(pmEquipment).where(where);
  }

  // ── Preventive Maintenance Records ───────────────────────────────────────
  async getPmRecords(userId: string, isSuperadmin = false, isoProjectId?: number | null): Promise<PmRecord[]> {
    const conditions: any[] = [];
    if (!isSuperadmin) conditions.push(eq(pmRecords.userId, userId));
    if (isoProjectId != null) conditions.push(eq(pmRecords.isoProjectId, isoProjectId));
    const cond = conditions.length > 1 ? and(...conditions) : conditions[0];
    return db.select().from(pmRecords).where(cond).orderBy(desc(pmRecords.pmDate));
  }

  async createPmRecord(data: InsertPmRecord): Promise<PmRecord> {
    const [r] = await db.insert(pmRecords).values(data).returning();
    return r;
  }

  async updatePmRecord(id: number, userId: string, data: Partial<InsertPmRecord>, isSuperadmin = false): Promise<PmRecord | undefined> {
    const where = isSuperadmin
      ? eq(pmRecords.id, id)
      : and(eq(pmRecords.id, id), eq(pmRecords.userId, userId));
    const [r] = await db.update(pmRecords).set(data).where(where).returning();
    return r;
  }

  async deletePmRecord(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin
      ? eq(pmRecords.id, id)
      : and(eq(pmRecords.id, id), eq(pmRecords.userId, userId));
    await db.delete(pmRecords).where(where);
  }

  // ── Layered Process Audits (LPA) ──────────────────────────────────────────
  async getLpaAuditPlans(userId: string, isSuperadmin = false): Promise<LpaAuditPlan[]> {
    const where = isSuperadmin ? undefined : eq(lpaAuditPlans.userId, userId);
    return db.select().from(lpaAuditPlans).where(where).orderBy(lpaAuditPlans.processName);
  }

  async createLpaAuditPlan(data: InsertLpaAuditPlan): Promise<LpaAuditPlan> {
    const [r] = await db.insert(lpaAuditPlans).values(data).returning();
    return r;
  }

  async updateLpaAuditPlan(id: number, userId: string, data: Partial<InsertLpaAuditPlan>, isSuperadmin = false): Promise<LpaAuditPlan | undefined> {
    const where = isSuperadmin ? eq(lpaAuditPlans.id, id) : and(eq(lpaAuditPlans.id, id), eq(lpaAuditPlans.userId, userId));
    const [r] = await db.update(lpaAuditPlans).set({ ...data, updatedAt: new Date() }).where(where).returning();
    return r;
  }

  async deleteLpaAuditPlan(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin ? eq(lpaAuditPlans.id, id) : and(eq(lpaAuditPlans.id, id), eq(lpaAuditPlans.userId, userId));
    await db.delete(lpaAuditPlans).where(where);
  }

  async getLpaRecords(userId: string, isSuperadmin = false, planId?: number): Promise<LpaRecord[]> {
    const conds: any[] = [];
    if (!isSuperadmin) conds.push(eq(lpaRecords.userId, userId));
    if (planId != null) conds.push(eq(lpaRecords.planId, planId));
    const where = conds.length > 1 ? and(...conds) : conds[0];
    return db.select().from(lpaRecords).where(where).orderBy(desc(lpaRecords.auditDate));
  }

  async createLpaRecord(data: InsertLpaRecord): Promise<LpaRecord> {
    const [r] = await db.insert(lpaRecords).values(data).returning();
    return r;
  }

  async updateLpaRecord(id: number, userId: string, data: Partial<InsertLpaRecord>, isSuperadmin = false): Promise<LpaRecord | undefined> {
    const where = isSuperadmin ? eq(lpaRecords.id, id) : and(eq(lpaRecords.id, id), eq(lpaRecords.userId, userId));
    const [r] = await db.update(lpaRecords).set({ ...data, updatedAt: new Date() }).where(where).returning();
    return r;
  }

  async deleteLpaRecord(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin ? eq(lpaRecords.id, id) : and(eq(lpaRecords.id, id), eq(lpaRecords.userId, userId));
    await db.delete(lpaRecords).where(where);
  }

  // ─── ISO Compliance Obligations (§6.1.3) ──────────────────────────────────
  async getIsoComplianceObligations(userId: string, isoProjectId?: number, isSuperadmin = false): Promise<IsoComplianceObligation[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = isoProjectId != null ? eq(isoComplianceObligations.isoProjectId, isoProjectId) : undefined;
    } else {
      cond = isoProjectId != null
        ? and(eq(isoComplianceObligations.userId, userId), eq(isoComplianceObligations.isoProjectId, isoProjectId))
        : eq(isoComplianceObligations.userId, userId);
    }
    return db.select().from(isoComplianceObligations).where(cond).orderBy(isoComplianceObligations.aspectCategory, isoComplianceObligations.requirementName);
  }
  async createIsoComplianceObligation(data: InsertIsoComplianceObligation): Promise<IsoComplianceObligation> {
    const [r] = await db.insert(isoComplianceObligations).values(data).returning();
    return r;
  }
  async updateIsoComplianceObligation(id: number, userId: string, data: Partial<InsertIsoComplianceObligation>, isSuperadmin = false): Promise<IsoComplianceObligation | undefined> {
    const where = isSuperadmin ? eq(isoComplianceObligations.id, id) : and(eq(isoComplianceObligations.id, id), eq(isoComplianceObligations.userId, userId));
    const [r] = await db.update(isoComplianceObligations).set({ ...data, updatedAt: new Date() }).where(where).returning();
    return r;
  }
  async deleteIsoComplianceObligation(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin ? eq(isoComplianceObligations.id, id) : and(eq(isoComplianceObligations.id, id), eq(isoComplianceObligations.userId, userId));
    await db.delete(isoComplianceObligations).where(where);
  }

  // ─── ISO Compliance Evaluations (§9.1.2) ──────────────────────────────────
  async getIsoComplianceEvaluations(userId: string, obligationId?: number, isSuperadmin = false): Promise<IsoComplianceEvaluation[]> {
    let cond: any;
    if (isSuperadmin) {
      cond = obligationId != null ? eq(isoComplianceEvaluations.complianceObligationId, obligationId) : undefined;
    } else {
      cond = obligationId != null
        ? and(eq(isoComplianceEvaluations.userId, userId), eq(isoComplianceEvaluations.complianceObligationId, obligationId))
        : eq(isoComplianceEvaluations.userId, userId);
    }
    return db.select().from(isoComplianceEvaluations).where(cond).orderBy(desc(isoComplianceEvaluations.evaluationDate));
  }
  async createIsoComplianceEvaluation(data: InsertIsoComplianceEvaluation): Promise<IsoComplianceEvaluation> {
    const [r] = await db.insert(isoComplianceEvaluations).values(data).returning();
    return r;
  }
  async updateIsoComplianceEvaluation(id: number, userId: string, data: Partial<InsertIsoComplianceEvaluation>, isSuperadmin = false): Promise<IsoComplianceEvaluation | undefined> {
    const where = isSuperadmin ? eq(isoComplianceEvaluations.id, id) : and(eq(isoComplianceEvaluations.id, id), eq(isoComplianceEvaluations.userId, userId));
    const [r] = await db.update(isoComplianceEvaluations).set(data).where(where).returning();
    return r;
  }
  async deleteIsoComplianceEvaluation(id: number, userId: string, isSuperadmin = false): Promise<void> {
    const where = isSuperadmin ? eq(isoComplianceEvaluations.id, id) : and(eq(isoComplianceEvaluations.id, id), eq(isoComplianceEvaluations.userId, userId));
    await db.delete(isoComplianceEvaluations).where(where);
  }
}

export const storage = new DatabaseStorage();
