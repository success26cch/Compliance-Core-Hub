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

  return httpServer;
}
