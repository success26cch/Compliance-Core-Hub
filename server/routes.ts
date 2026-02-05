import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { generateRecordabilityCheatSheet } from "./generateCheatSheet";
import { generateDOTDrugTestingCheatSheet } from "./generateDOTCheatSheet";
import { generateISOAuditCheatSheet } from "./generateISOCheatSheet";
import { generateSafetyManagerCheatSheet } from "./generateSafetyManagerCheatSheet";
import { insertEmployeeSchema, insertIncidentSchema, insertCorrectiveActionSchema, insertActionItemSchema, insertAuditReadinessSchema, insertCompanyProfileSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Chat Integration
  registerChatRoutes(app);

  // Leads
  app.post(api.leads.create.path, async (req, res) => {
    try {
      const input = api.leads.create.input.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.leads.list.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Ideally check for admin role here
    const leads = await storage.getLeads();
    res.json(leads);
  });

  // Subscriptions
  app.get(api.subscriptions.status.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub; // Replit Auth ID
    const sub = await storage.getSubscription(userId);
    
    res.json({
      status: sub?.status || "inactive",
      plan: sub?.plan,
      isPro: sub?.status === "active",
    });
  });

  app.post(api.subscriptions.createCheckout.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims.sub;
      const userEmail = (req.user as any).claims.email || `user-${userId}@example.com`;
      const { priceId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }
      
      let sub = await storage.getSubscription(userId);
      let customerId = sub?.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripeService.createCustomer(userEmail, userId);
        customerId = customer.id;
        await storage.upsertSubscription({
          userId,
          status: "inactive",
          stripeCustomerId: customerId,
        });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/settings?checkout=success`,
        `${baseUrl}/settings?checkout=cancel`,
        'subscription'
      );
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error('Error getting publishable key:', error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  app.get("/api/stripe/products", async (req, res) => {
    try {
      const products = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of products) {
        const r = row as any;
        if (!productsMap.has(r.product_id)) {
          productsMap.set(r.product_id, {
            id: r.product_id,
            name: r.product_name,
            description: r.product_description,
            active: r.product_active,
            metadata: r.product_metadata,
            prices: []
          });
        }
        if (r.price_id) {
          productsMap.get(r.product_id).prices.push({
            id: r.price_id,
            unit_amount: r.unit_amount,
            currency: r.currency,
            recurring: r.recurring,
            active: r.price_active,
            metadata: r.price_metadata,
          });
        }
      }
      
      res.json({ data: Array.from(productsMap.values()) });
    } catch (error: any) {
      console.error('Error listing products:', error);
      res.status(500).json({ message: "Failed to list products" });
    }
  });

  app.post("/api/stripe/customer-portal", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims.sub;
      const sub = await storage.getSubscription(userId);
      
      if (!sub?.stripeCustomerId) {
        return res.status(400).json({ message: "No customer found" });
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCustomerPortalSession(
        sub.stripeCustomerId,
        `${baseUrl}/settings`
      );
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Portal error:', error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // Cheat Sheet Downloads
  app.get("/api/cheat-sheet/download", async (req, res) => {
    try {
      const doc = generateRecordabilityCheatSheet();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="OSHA-300-Recordability-Cheat-Sheet.pdf"');
      doc.pipe(res);
      doc.end();
    } catch (error: any) {
      console.error('Error generating cheat sheet:', error);
      res.status(500).json({ message: "Failed to generate cheat sheet" });
    }
  });

  app.get("/api/cheat-sheet/dot-testing", async (req, res) => {
    try {
      const doc = generateDOTDrugTestingCheatSheet();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="DOT-Drug-Alcohol-Testing-Guide.pdf"');
      doc.pipe(res);
      doc.end();
    } catch (error: any) {
      console.error('Error generating DOT cheat sheet:', error);
      res.status(500).json({ message: "Failed to generate cheat sheet" });
    }
  });

  app.get("/api/cheat-sheet/iso-audit", async (req, res) => {
    try {
      const doc = generateISOAuditCheatSheet();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="ISO-Audit-Prep-Checklist.pdf"');
      doc.pipe(res);
      doc.end();
    } catch (error: any) {
      console.error('Error generating ISO cheat sheet:', error);
      res.status(500).json({ message: "Failed to generate cheat sheet" });
    }
  });

  app.get("/api/cheat-sheet/safety-manager", async (req, res) => {
    try {
      const doc = generateSafetyManagerCheatSheet();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="New-Safety-Manager-First-30-Days.pdf"');
      doc.pipe(res);
      doc.end();
    } catch (error: any) {
      console.error('Error generating Safety Manager cheat sheet:', error);
      res.status(500).json({ message: "Failed to generate cheat sheet" });
    }
  });

  // Admin users get unlimited access
  const ADMIN_USERS = (process.env.ADMIN_USERS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  function isAdmin(user: any): boolean {
    if (!user?.claims) return false;
    const userId = user.claims.sub;
    const email = (user.claims.email || "").toLowerCase();
    const username = (user.claims.name || user.claims.preferred_username || "").toLowerCase();
    return ADMIN_USERS.includes(userId) || ADMIN_USERS.includes(email) || ADMIN_USERS.includes(username);
  }

  // Question usage
  app.get("/api/question-usage", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const usage = await storage.getQuestionUsage(userId);
    const sub = await storage.getSubscription(userId);
    const isPro = sub?.status === "active";
    const userIsAdmin = isAdmin(req.user);
    
    res.json({
      questionCount: usage?.questionCount || 0,
      freeLimit: 3,
      canAsk: isPro || userIsAdmin || (usage?.questionCount || 0) < 3,
      isPro: isPro || userIsAdmin,
    });
  });

  // Contact Inquiries (retainer, consultation requests)
  app.post("/api/contact-inquiries", async (req, res) => {
    try {
      const { name, email, company, phone, employeeCount, inquiryType, message } = req.body;
      
      if (!name || !email || !inquiryType || !message) {
        return res.status(400).json({ message: "Name, email, inquiry type, and message are required" });
      }
      
      const inquiry = await storage.createContactInquiry({
        name,
        email,
        company: company || null,
        phone: phone || null,
        employeeCount: employeeCount || null,
        inquiryType,
        message,
      });
      
      // TODO: Send email notification when email service is configured
      // This is where you'd integrate GHL, SendGrid, or similar
      
      res.status(201).json(inquiry);
    } catch (error: any) {
      console.error('Error creating contact inquiry:', error);
      res.status(500).json({ message: "Failed to submit inquiry" });
    }
  });

  // Admin: Get all contact inquiries
  app.get("/api/contact-inquiries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const inquiries = await storage.getContactInquiries();
    res.json(inquiries);
  });

  // Admin: Update inquiry status
  app.patch("/api/contact-inquiries/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['new', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const updated = await storage.updateInquiryStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    
    res.json(updated);
  });

  // ==========================================
  // DASHBOARD API ROUTES
  // ==========================================

  // Get dashboard metrics summary
  app.get("/api/dashboard/metrics", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;

    try {
      const [employeeList, incidentList, actionList, auditList] = await Promise.all([
        storage.getEmployees(userId),
        storage.getIncidents(userId),
        storage.getPendingActionItems(userId),
        storage.getAuditReadiness(userId),
      ]);

      // Calculate medical surveillance percentage
      const employeesWithDOT = employeeList.filter(e => e.dotPhysicalStatus === 'current').length;
      const employeesWithRespiratory = employeeList.filter(e => e.respiratoryStatus === 'current').length;
      const totalWithDOTRequired = employeeList.filter(e => e.dotPhysicalStatus !== 'na').length;
      const totalWithRespiratoryRequired = employeeList.filter(e => e.respiratoryStatus !== 'na').length;
      
      const medicalSurveillancePercent = totalWithDOTRequired + totalWithRespiratoryRequired > 0
        ? Math.round(((employeesWithDOT + employeesWithRespiratory) / (totalWithDOTRequired + totalWithRespiratoryRequired)) * 100)
        : 100;

      // Calculate drug screen status
      const clearedDrugTests = employeeList.filter(e => e.drugTestResult === 'cleared').length;
      const pendingDrugTests = employeeList.filter(e => e.drugTestResult === 'pending' || e.drugTestResult === 'scheduled').length;

      // Calculate ISO audit readiness (average of all categories)
      const isoReadiness = auditList.length > 0
        ? Math.round(auditList.reduce((acc, a) => acc + ((a.totalItems || 0) > 0 ? ((a.completedItems || 0) / (a.totalItems || 1)) * 100 : 0), 0) / auditList.length)
        : 0;

      // Get incidents for last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentIncidents = incidentList.filter(i => new Date(i.incidentDate) >= sixMonthsAgo);
      const recordableIncidents = recentIncidents.filter(i => i.isRecordable).length;

      res.json({
        employeeCount: employeeList.length,
        isoAuditReadiness: isoReadiness,
        medicalSurveillance: medicalSurveillancePercent,
        drugScreenCleared: clearedDrugTests,
        drugScreenPending: pendingDrugTests,
        pendingActions: actionList.length,
        recordableIncidents6Mo: recordableIncidents,
        totalIncidents6Mo: recentIncidents.length,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Get employees
  app.get("/api/employees", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const employeeList = await storage.getEmployees(userId);
    res.json(employeeList);
  });

  // Create employee
  app.post("/api/employees", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    try {
      const validated = insertEmployeeSchema.omit({ userId: true }).parse(req.body);
      const employee = await storage.createEmployee({
        ...validated,
        userId,
      });
      res.status(201).json(employee);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error('Error creating employee:', error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  // Update employee
  app.patch("/api/employees/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    
    try {
      const validated = insertEmployeeSchema.omit({ userId: true }).partial().parse(req.body);
      const updated = await storage.updateEmployee(id, userId, validated);
      if (!updated) {
        return res.status(404).json({ message: "Employee not found or access denied" });
      }
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error('Error updating employee:', error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Delete employee
  app.delete("/api/employees/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    
    try {
      const existing = await storage.getEmployeeById(id, userId);
      if (!existing) {
        return res.status(404).json({ message: "Employee not found or access denied" });
      }
      await storage.deleteEmployee(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Get incidents
  app.get("/api/incidents", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const incidentList = await storage.getIncidents(userId);
    res.json(incidentList);
  });

  // Get incidents for chart (last 6 months)
  app.get("/api/incidents/chart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const incidentList = await storage.getIncidentsByDateRange(userId, startDate, endDate);
    
    // Group by month
    const monthlyData: Record<string, { total: number; recordable: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[key] = { total: 0, recordable: 0 };
    }
    
    incidentList.forEach(incident => {
      const key = new Date(incident.incidentDate).toISOString().slice(0, 7);
      if (monthlyData[key]) {
        monthlyData[key].total++;
        if (incident.isRecordable) {
          monthlyData[key].recordable++;
        }
      }
    });
    
    res.json(Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    })));
  });

  // Create incident
  app.post("/api/incidents", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    try {
      const validated = insertIncidentSchema.omit({ userId: true }).parse({
        ...req.body,
        incidentDate: new Date(req.body.incidentDate),
      });
      const incident = await storage.createIncident({
        ...validated,
        userId,
      });
      res.status(201).json(incident);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid incident data", errors: error.errors });
      }
      console.error('Error creating incident:', error);
      res.status(500).json({ message: "Failed to create incident" });
    }
  });

  // Corrective Action Plans (CAPA)
  app.get("/api/corrective-actions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const actions = await storage.getCorrectiveActions(userId);
    res.json(actions);
  });

  app.get("/api/corrective-actions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    const action = await storage.getCorrectiveActionById(id, userId);
    if (!action) {
      return res.status(404).json({ message: "Corrective action not found" });
    }
    res.json(action);
  });

  app.post("/api/corrective-actions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    try {
      const validated = insertCorrectiveActionSchema.omit({ userId: true }).parse({
        ...req.body,
        targetDate: req.body.targetDate ? new Date(req.body.targetDate) : null,
        completionDate: req.body.completionDate ? new Date(req.body.completionDate) : null,
        verificationDate: req.body.verificationDate ? new Date(req.body.verificationDate) : null,
      });
      const action = await storage.createCorrectiveAction({
        ...validated,
        userId,
      });
      res.status(201).json(action);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid corrective action data", errors: error.errors });
      }
      console.error('Error creating corrective action:', error);
      res.status(500).json({ message: "Failed to create corrective action" });
    }
  });

  app.patch("/api/corrective-actions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    
    try {
      const updates: any = { ...req.body };
      if (updates.targetDate) updates.targetDate = new Date(updates.targetDate);
      if (updates.completionDate) updates.completionDate = new Date(updates.completionDate);
      if (updates.verificationDate) updates.verificationDate = new Date(updates.verificationDate);
      
      const updated = await storage.updateCorrectiveAction(id, userId, updates);
      if (!updated) {
        return res.status(404).json({ message: "Corrective action not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating corrective action:', error);
      res.status(500).json({ message: "Failed to update corrective action" });
    }
  });

  app.delete("/api/corrective-actions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    
    const deleted = await storage.deleteCorrectiveAction(id, userId);
    if (!deleted) {
      return res.status(404).json({ message: "Corrective action not found" });
    }
    res.json({ success: true });
  });

  // Get action items
  app.get("/api/action-items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const pending = req.query.pending === 'true';
    
    const items = pending 
      ? await storage.getPendingActionItems(userId)
      : await storage.getActionItems(userId);
    res.json(items);
  });

  // Create action item
  app.post("/api/action-items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    try {
      const validated = insertActionItemSchema.omit({ userId: true }).parse({
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      });
      const item = await storage.createActionItem({
        ...validated,
        userId,
      });
      res.status(201).json(item);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid action item data", errors: error.errors });
      }
      console.error('Error creating action item:', error);
      res.status(500).json({ message: "Failed to create action item" });
    }
  });

  // Update action item status
  app.patch("/api/action-items/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['pending', 'in_progress', 'completed', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    try {
      const updated = await storage.updateActionItemStatus(id, userId, status);
      if (!updated) {
        return res.status(404).json({ message: "Action item not found or access denied" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating action item:', error);
      res.status(500).json({ message: "Failed to update action item" });
    }
  });

  // Get audit readiness
  app.get("/api/audit-readiness", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const readiness = await storage.getAuditReadiness(userId);
    res.json(readiness);
  });

  // Update audit readiness
  app.post("/api/audit-readiness", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    try {
      const validated = insertAuditReadinessSchema.omit({ userId: true }).parse(req.body);
      const readiness = await storage.upsertAuditReadiness({
        ...validated,
        userId,
      });
      res.json(readiness);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid audit readiness data", errors: error.errors });
      }
      console.error('Error updating audit readiness:', error);
      res.status(500).json({ message: "Failed to update audit readiness" });
    }
  });

  // Request retainer support (for $99 plan users)
  app.post("/api/retainer-support", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const user = req.user as any;
    
    // Check if user has $99 plan
    const sub = await storage.getSubscription(userId);
    if (!sub || sub.plan !== 'unlimited_monthly') {
      return res.status(403).json({ message: "Retainer support requires Unlimited Safety plan" });
    }
    
    try {
      // Create a priority action item for admin to see
      const inquiry = await storage.createContactInquiry({
        name: user.claims.first_name + ' ' + (user.claims.last_name || ''),
        email: user.claims.email || '',
        company: req.body.company || null,
        phone: req.body.phone || null,
        employeeCount: null,
        inquiryType: 'priority_retainer',
        message: req.body.message || 'Priority support request from Unlimited Safety subscriber',
      });
      
      res.status(201).json({ success: true, ticketId: inquiry.id });
    } catch (error: any) {
      console.error('Error creating retainer support request:', error);
      res.status(500).json({ message: "Failed to create support request" });
    }
  });

  // Company Profile - Get
  app.get("/api/company-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const profile = await storage.getCompanyProfile(userId);
    res.json(profile || null);
  });

  // Company Profile - Upsert
  app.post("/api/company-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    
    try {
      const validated = insertCompanyProfileSchema.omit({ userId: true }).parse(req.body);
      const profile = await storage.upsertCompanyProfile({
        ...validated,
        userId,
      });
      res.json(profile);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid company profile data", errors: error.errors });
      }
      console.error('Error updating company profile:', error);
      res.status(500).json({ message: "Failed to update company profile" });
    }
  });

  // ==================== DOT NOTIFICATION ROUTES ====================
  
  // Get DOT notification check - employees with expiring physicals
  app.get("/api/dot-notifications/check", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { dotNotificationService } = await import('./dotNotificationService');
      const expiringEmployees = await dotNotificationService.checkExpiringDotPhysicals();
      
      const notifications = expiringEmployees.map(emp => ({
        ...emp,
        message: dotNotificationService.generateMessage(emp),
      }));
      
      res.json({ notifications });
    } catch (error: any) {
      console.error('Error checking DOT notifications:', error);
      res.status(500).json({ message: "Failed to check notifications" });
    }
  });
  
  // Get notification history for current user's company
  app.get("/api/dot-notifications/history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims.sub;
      const { dotNotificationService } = await import('./dotNotificationService');
      const history = await dotNotificationService.getNotificationHistory(userId);
      res.json({ history });
    } catch (error: any) {
      console.error('Error getting notification history:', error);
      res.status(500).json({ message: "Failed to get notification history" });
    }
  });
  
  // Send DOT notification (logs it, actual SMS/email sending when Twilio is set up)
  app.post("/api/dot-notifications/send", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims.sub;
      const { employeeId, notificationType, channel, message, recipientPhone, recipientEmail } = req.body;
      
      const { dotNotificationService } = await import('./dotNotificationService');
      const { sendSMS, isTwilioConfigured } = await import('./twilioService');
      
      let deliveryStatus = 'logged';
      let deliveryMessage = 'Notification logged.';
      
      // Try to send SMS if channel is sms and we have a phone number
      if (channel === 'sms' && recipientPhone) {
        const twilioReady = await isTwilioConfigured();
        if (twilioReady) {
          const smsResult = await sendSMS(recipientPhone, message);
          if (smsResult.success) {
            deliveryStatus = 'sent';
            deliveryMessage = 'SMS sent successfully.';
          } else {
            deliveryStatus = 'failed';
            deliveryMessage = `SMS failed: ${smsResult.error}`;
          }
        } else {
          deliveryMessage = 'Notification logged. Twilio not configured for SMS delivery.';
        }
      }
      
      await dotNotificationService.logNotification(
        employeeId,
        userId,
        notificationType,
        channel,
        message,
        recipientPhone,
        recipientEmail,
        deliveryStatus
      );
      
      res.json({ success: true, status: deliveryStatus, message: deliveryMessage });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });
  
  // Get employees needing manager alert (7 days or less, no new card uploaded)
  app.get("/api/dot-notifications/manager-alerts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims.sub;
      const { dotNotificationService } = await import('./dotNotificationService');
      const employees = await dotNotificationService.getEmployeesNeedingManagerAlert(userId);
      
      const alerts = employees
        .filter(emp => !emp.dotCardUploadedAt || (emp.dotPhysicalExpiry && emp.dotCardUploadedAt < emp.dotPhysicalExpiry))
        .map(emp => ({
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          expiryDate: emp.dotPhysicalExpiry,
          hasNewCard: !!emp.dotCardImageUrl && emp.dotCardUploadedAt && emp.dotPhysicalExpiry && emp.dotCardUploadedAt >= emp.dotPhysicalExpiry,
        }));
      
      res.json({ alerts });
    } catch (error: any) {
      console.error('Error getting manager alerts:', error);
      res.status(500).json({ message: "Failed to get manager alerts" });
    }
  });
  
  // Upload DOT card image for employee
  app.post("/api/employees/:id/dot-card", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims.sub;
      const employeeId = parseInt(req.params.id);
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }
      
      const employee = await storage.getEmployeeById(employeeId, userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const updated = await storage.updateEmployee(employeeId, userId, {
        dotCardImageUrl: imageData,
        dotCardUploadedAt: new Date(),
      });
      
      res.json(updated);
    } catch (error: any) {
      console.error('Error uploading DOT card:', error);
      res.status(500).json({ message: "Failed to upload DOT card" });
    }
  });

  // ==================== SUPERADMIN ROUTES ====================
  // Middleware to check superadmin status
  async function requireSuperadmin(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = await storage.isSuperadmin(userId);
    if (!isSuperadmin) {
      return res.status(403).json({ message: "Forbidden - Superadmin access required" });
    }
    next();
  }

  // Check if current user is superadmin
  app.get("/api/superadmin/check", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = await storage.isSuperadmin(userId);
    res.json({ isSuperadmin });
  });

  // Get dashboard stats
  app.get("/api/superadmin/stats", requireSuperadmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const subscriptions = await storage.getAllSubscriptions();
      const newSignups = await storage.getNewSignupsThisWeek();
      
      // Calculate MRR from active subscriptions
      const planPrices: Record<string, number> = {
        'cch_compliance_pro': 29,
        'cch_unlimited_safety': 99,
        'acsi_iso_essentials': 49,
        'acsi_iso_professional': 149,
        'integrated_enterprise': 299,
        'human_expert_retainer': 499,
      };
      
      let totalMRR = 0;
      subscriptions.filter(s => s.status === 'active').forEach(sub => {
        const price = planPrices[sub.plan || ''] || 0;
        totalMRR += price;
      });
      
      res.json({
        totalMRR,
        totalCompanies: users.length,
        newSignupsThisWeek: newSignups,
      });
    } catch (error: any) {
      console.error('Error fetching superadmin stats:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all companies/users with subscription info
  app.get("/api/superadmin/companies", requireSuperadmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const subscriptions = await storage.getAllSubscriptions();
      const companyProfiles = await Promise.all(
        users.map(u => storage.getCompanyProfile(u.id))
      );
      
      const planPrices: Record<string, number> = {
        'cch_compliance_pro': 29,
        'cch_unlimited_safety': 99,
        'acsi_iso_essentials': 49,
        'acsi_iso_professional': 149,
        'integrated_enterprise': 299,
        'human_expert_retainer': 499,
      };
      
      const companies = users.map((user, index) => {
        const sub = subscriptions.find(s => s.userId === user.id);
        const profile = companyProfiles[index];
        const monthlyPrice = planPrices[sub?.plan || ''] || 0;
        
        // Calculate LTV (months since subscription started * price)
        let ltv = 0;
        if (sub?.status === 'active' && sub.createdAt && monthlyPrice > 0) {
          const monthsActive = Math.max(1, Math.ceil((Date.now() - new Date(sub.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
          ltv = monthsActive * monthlyPrice;
        }
        
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: profile?.companyName || 'No Company Set',
          plan: sub?.plan || 'free',
          planStatus: sub?.status || 'inactive',
          monthlyPrice,
          ltv,
          createdAt: user.createdAt,
        };
      });
      
      res.json(companies);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Get user growth over last 30 days
  app.get("/api/superadmin/growth", requireSuperadmin, async (req, res) => {
    try {
      const growth = await storage.getUserGrowthLast30Days();
      res.json(growth);
    } catch (error: any) {
      console.error('Error fetching growth data:', error);
      res.status(500).json({ message: "Failed to fetch growth data" });
    }
  });

  // Get pending retainer requests
  app.get("/api/superadmin/retainer-requests", requireSuperadmin, async (req, res) => {
    try {
      const requests = await storage.getRetainerRequests();
      res.json(requests);
    } catch (error: any) {
      console.error('Error fetching retainer requests:', error);
      res.status(500).json({ message: "Failed to fetch retainer requests" });
    }
  });

  // Get all leads
  app.get("/api/superadmin/leads", requireSuperadmin, async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      res.json(allLeads);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Export leads as CSV
  app.get("/api/superadmin/leads/export", requireSuperadmin, async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      
      // Generate CSV
      const headers = ['ID', 'Name', 'Email', 'Created At'];
      const rows = allLeads.map(lead => [
        lead.id,
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        lead.createdAt ? new Date(lead.createdAt).toISOString() : ''
      ].join(','));
      
      const csv = [headers.join(','), ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
      res.send(csv);
    } catch (error: any) {
      console.error('Error exporting leads:', error);
      res.status(500).json({ message: "Failed to export leads" });
    }
  });

  // Update inquiry status (for retainer queue)
  app.patch("/api/superadmin/inquiries/:id/status", requireSuperadmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['new', 'contacted', 'closed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updated = await storage.updateInquiryStatus(id, status);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating inquiry status:', error);
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });

  return httpServer;
}
