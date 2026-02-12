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
import Anthropic from "@anthropic-ai/sdk";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Chat Integration
  registerChatRoutes(app);

  // Spanish to English Translation (Spanish Bilingual Medical Assistant)
  const translationAnthropic = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });

  const BMA_SYSTEM_PROMPT = `You are a specialized Bilingual Medical Assistant (BMA) facilitating real-time communication between healthcare providers and patients in occupational health settings. Your goal is to provide highly interactive, bidirectional translation and clinical summarization in English and Spanish.

Key Instructions:

1. **Tone**: Professional, empathetic, and medically accurate. You are a bridge between provider and patient—not just a dictionary.

2. **Clinical Precision**: When a provider gives instructions (e.g., "no lifting over 10 lbs"), translate the intent perfectly into Spanish while maintaining the specific constraints. Medical terminology must be exact. Work restrictions are legal and clinical requirements—treat them with that level of seriousness.

3. **Interactivity**: Do not just translate; confirm understanding. If a provider speaks, translate for the patient AND ask a clarifying follow-up if needed to ensure the patient understands the restrictions. If a patient responds, translate AND flag any potential misunderstandings or concerns for the provider.

4. **Terminology**: Use localized Spanish dialects appropriate for Mexican and Central American Spanish speakers (the most common demographic in U.S. occupational health settings). Avoid overly formal "textbook" translations that might confuse patients. Use natural, conversational medical Spanish.

5. **Formatting**: Structure your responses with clear sections:
   - **Provider → Patient** (English to Spanish translation with context)
   - **Patient → Provider** (Spanish to English translation with clinical notes)
   - **Clinical Summary** (when appropriate, a brief summary for the medical record)

6. **Context Areas**: You are an expert in occupational health scenarios including:
   - DOT physicals and medical certification
   - Drug & alcohol testing instructions (49 CFR Part 40)
   - Work restrictions and return-to-duty protocols
   - Injury reporting and workers' compensation
   - Respiratory exams (PFTs, fit testing)
   - Blood draws and lab work
   - Vision and hearing tests
   - OSHA medical surveillance requirements

7. **Dual-Role Logic**: Act as a bridge that makes the provider feel like they have a human bilingual medical assistant in the room. Anticipate what information the provider needs and what the patient might be confused about.

8. **Safety**: If you detect any patient safety concern (allergic reaction, medication interaction, misunderstood restriction), flag it immediately to both parties.

IMPORTANT: You are NOT a doctor. You are a communication facilitator. Do not diagnose or prescribe. Always defer clinical decisions to the provider.`;

  app.post("/api/translate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.json({ translation: "" });
      }
      if (text.length > 2000) {
        return res.status(400).json({ error: "Text too long. Maximum 2000 characters." });
      }
      const response = await translationAnthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 512,
        system: "You are a specialized medical translator for occupational health settings. Translate between Spanish and English with clinical precision. Use natural, conversational medical Spanish appropriate for Mexican and Central American Spanish speakers. Return ONLY the translation, nothing else - no quotes, no explanation, no labels.",
        messages: [
          {
            role: "user",
            content: `Translate the following text from Spanish to English. If the text is already in English, return it as-is. If it's a mix, translate only the Spanish parts.\n\n${text.trim()}`,
          },
        ],
      });
      const translation = response.content[0].type === "text" ? response.content[0].text : "";
      res.json({ translation });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  const BMA_STRUCTURED_PROMPT = BMA_SYSTEM_PROMPT + `

CRITICAL RESPONSE FORMAT: You MUST respond in valid JSON with these fields:
{
  "spanish": "The Spanish text to speak to the patient (when provider is speaking). Leave empty string if patient is speaking.",
  "english": "The English text for the provider (when patient is speaking). Leave empty string if provider is speaking.",
  "display": "Your full formatted response for the chat display, including translations, clinical notes, follow-up questions, and summaries. Use **bold** for section headers.",
  "followUp": "A suggested follow-up question or clarification for either party, or empty string if none needed."
}

Always return valid JSON. No markdown code blocks. Just the raw JSON object.`;

  app.post("/api/bma-chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages required" });
      }
      if (messages.length > 50) {
        return res.status(400).json({ error: "Conversation too long. Please clear and start a new session." });
      }

      const contextNote = context ? `\n\nCurrent clinical context: ${context}` : "";

      const response = await translationAnthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: BMA_STRUCTURED_PROMPT + contextNote,
        messages: messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: typeof m.content === "string" ? m.content : "",
        })),
      });

      const rawReply = response.content[0].type === "text" ? response.content[0].text : "";

      try {
        const parsed = JSON.parse(rawReply);
        res.json({
          reply: parsed.display || rawReply,
          spanish: parsed.spanish || "",
          english: parsed.english || "",
          followUp: parsed.followUp || "",
        });
      } catch {
        res.json({ reply: rawReply, spanish: "", english: "", followUp: "" });
      }
    } catch (error) {
      console.error("BMA chat error:", error);
      res.status(500).json({ error: "BMA chat failed" });
    }
  });

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

  app.post("/api/clinic-agreement", async (req, res) => {
    try {
      const { clinicName, contactName, contactEmail, signature, agreedAt } = req.body;
      
      if (!clinicName || !contactName || !contactEmail || !signature) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      let stripeCustomerId: string | null = null;
      
      try {
        const customer = await stripeService.createCustomer(contactEmail, `clinic-${clinicName.replace(/\s+/g, '-').toLowerCase()}`);
        stripeCustomerId = customer.id;
        
        const products = await stripeService.listProductsWithPrices();
        const bmaProduct = (products as any[]).find((p: any) => 
          p.product_name?.toLowerCase().includes('bilingual') || 
          p.product_name?.toLowerCase().includes('bma') ||
          (p.unit_amount === 14900 && p.recurring?.interval === 'month')
        );
        
        await storage.createClinicAgreement({
          clinicName,
          contactName,
          contactEmail,
          signatureData: signature,
          stripeCustomerId,
          status: "pending_payment",
          agreedAt: new Date(agreedAt),
        });
        
        if (bmaProduct?.price_id) {
          const session = await stripeService.createCheckoutSession(
            customer.id,
            bmaProduct.price_id,
            `${baseUrl}/clinic-agreement?checkout=success`,
            `${baseUrl}/clinic-agreement?checkout=cancel`,
            'subscription'
          );
          
          return res.json({ checkoutUrl: session.url });
        }

        return res.json({ success: true, message: "Agreement recorded. Our team will follow up with payment details." });
      } catch (stripeErr: any) {
        console.log('Stripe not available for clinic agreement, recording agreement only:', stripeErr.message);
      }

      await storage.createClinicAgreement({
        clinicName,
        contactName,
        contactEmail,
        signatureData: signature,
        stripeCustomerId,
        status: "recorded",
        agreedAt: agreedAt ? new Date(agreedAt) : new Date(),
      });

      res.json({ success: true, message: "Agreement recorded successfully" });
    } catch (error: any) {
      console.error('Clinic agreement error:', error);
      res.status(500).json({ message: error.message || "Failed to process agreement" });
    }
  });

  app.post("/api/stripe/checkout-cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = (req.user as any).claims.sub;
      const userEmail = (req.user as any).claims.email || `user-${userId}@example.com`;
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart items are required" });
      }

      for (const item of items) {
        if (!item.name || !item.unitAmount || !item.quantity || item.quantity < 1) {
          return res.status(400).json({ message: "Each item must have name, unitAmount, and quantity >= 1" });
        }
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

      const hasSubscription = items.some((i: any) => i.mode === "subscription");
      const hasOneTime = items.some((i: any) => i.mode === "payment");

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const successUrl = `${baseUrl}/settings?checkout=success`;
      const cancelUrl = `${baseUrl}/settings?checkout=cancel`;

      const buildLineItems = (cartItems: any[]) => cartItems.map((item: any) => {
        const lineItem: any = {
          price_data: {
            currency: item.currency || "usd",
            product_data: { name: item.name },
            unit_amount: item.unitAmount,
          },
          quantity: item.quantity,
        };
        if (item.interval) {
          lineItem.price_data.recurring = { interval: item.interval };
        }
        return lineItem;
      });

      if (hasSubscription && hasOneTime) {
        const subItems = items.filter((i: any) => i.mode === "subscription");
        const session = await stripeService.createCartCheckoutSession(
          customerId,
          buildLineItems(subItems),
          successUrl,
          cancelUrl,
          'subscription'
        );

        const oneTimeItems = items.filter((i: any) => i.mode === "payment");
        const oneTimeSession = await stripeService.createCartCheckoutSession(
          customerId,
          buildLineItems(oneTimeItems),
          session.url || successUrl,
          cancelUrl,
          'payment'
        );

        return res.json({ url: oneTimeSession.url });
      }

      const mode = hasSubscription ? 'subscription' : 'payment';
      const session = await stripeService.createCartCheckoutSession(
        customerId,
        buildLineItems(items),
        successUrl,
        cancelUrl,
        mode as 'subscription' | 'payment'
      );

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Cart checkout error:', error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
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
    
    // Also add DOT expiration alerts as action items
    if (pending) {
      try {
        const { dotNotificationService } = await import('./dotNotificationService');
        const expiringEmployees = await dotNotificationService.checkExpiringDotPhysicals(userId);
        
        // Add urgent DOT expirations (15 days or less) to action queue
        const dotActions = expiringEmployees
          .filter(emp => emp.daysUntilExpiry <= 15)
          .map((emp, index) => ({
            id: -1000 - index, // Negative IDs to distinguish from regular action items
            title: `DOT Physical Expiring: ${emp.employeeName}`,
            description: `DOT medical card expires in ${emp.daysUntilExpiry} day${emp.daysUntilExpiry === 1 ? '' : 's'}. Contact driver immediately to avoid OOS violation.`,
            priority: emp.daysUntilExpiry <= 7 ? 'urgent' : 'high',
            status: 'pending',
            dueDate: null,
            createdAt: new Date().toISOString(),
            userId,
            type: 'dot_expiration',
            employeeId: emp.employeeId,
          }));
        
        res.json([...dotActions, ...items]);
      } catch (error) {
        console.error('Error fetching DOT expirations for action queue:', error);
        res.json(items);
      }
    } else {
      res.json(items);
    }
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
      const userId = (req.user as any).claims.sub;
      const { dotNotificationService } = await import('./dotNotificationService');
      const expiringEmployees = await dotNotificationService.checkExpiringDotPhysicals(userId);
      
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

  // ==========================================
  // DIGITAL MEDICAL PASSPORT (CCH Handshake)
  // ==========================================

  // Generate a passport token for an employee (requires auth)
  app.post("/api/passport/generate", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;

    try {
      const { employeeId, visitType, authorizationName, authorizationTitle, authorizationPhone,
        billingPreference, specialInstructions, additionalServices, ssnLast4, employeeDob,
        employeeAddress, employeeLocation, staffingAgency, signatureDataUrl } = req.body;
      if (!employeeId || !visitType) {
        return res.status(400).json({ message: "Employee ID and visit type required" });
      }

      if (ssnLast4 && (!/^\d{4}$/.test(ssnLast4))) {
        return res.status(400).json({ message: "SSN last 4 must be exactly 4 digits" });
      }

      if (signatureDataUrl && signatureDataUrl.length > 500000) {
        return res.status(400).json({ message: "Signature image too large" });
      }

      const employee = await storage.getEmployeeById(parseInt(employeeId), userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const { nanoid } = await import("nanoid");
      const passportToken = nanoid(16);

      const visit = await storage.createClinicVisit({
        employeeId: employee.id,
        userId,
        passportToken,
        visitType,
        authorizationName: authorizationName || null,
        authorizationTitle: authorizationTitle || null,
        authorizationPhone: authorizationPhone || null,
        status: "checked_in",
        employerNotified: false,
        clinicName: null,
        notes: null,
        billingPreference: billingPreference || "company_pay",
        specialInstructions: specialInstructions || null,
        additionalServices: additionalServices || null,
        ssnLast4: ssnLast4 || null,
        employeeDob: employeeDob || null,
        employeeAddress: employeeAddress || null,
        employeeLocation: employeeLocation || null,
        staffingAgency: staffingAgency || null,
        signatureDataUrl: signatureDataUrl || null,
      });

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['host'] || req.hostname;
      const qrUrl = `${protocol}://${host}/clinic-assistant?token=${passportToken}`;

      res.json({
        token: passportToken,
        qrUrl,
        visit,
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
          department: employee.department,
        },
      });
    } catch (error: any) {
      console.error("Error generating passport:", error);
      res.status(500).json({ message: "Failed to generate passport" });
    }
  });

  // Look up passport by token (PUBLIC - no auth needed, this is for clinic scanning)
  app.get("/api/passport/lookup/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const visit = await storage.getClinicVisitByToken(token);
      if (!visit) {
        return res.status(404).json({ message: "Passport not found or expired" });
      }

      const checkedInTime = visit.checkedInAt ? new Date(visit.checkedInAt).getTime() : 0;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - checkedInTime > twentyFourHours) {
        return res.status(410).json({ message: "This passport has expired. Please generate a new one." });
      }

      const employee = await storage.getEmployeeByIdPublic(visit.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const companyProfile = await storage.getCompanyProfile(visit.userId);

      const authForm = await storage.getAuthorizationFormByVisitType(visit.userId, visit.visitType);
      const generalForm = authForm ? null : await storage.getAuthorizationFormByVisitType(visit.userId, "general");
      const matchedForm = authForm || generalForm;

      let clinicLocation = null;
      if (visit.clinicLocationId) {
        clinicLocation = await storage.getClinicLocationById(visit.clinicLocationId);
      }

      const allClinicLocations = await storage.getClinicLocations(visit.userId);

      res.json({
        visit: {
          id: visit.id,
          visitType: visit.visitType,
          status: visit.status,
          employerNotified: visit.employerNotified,
          checkedInAt: visit.checkedInAt,
          billingPreference: visit.billingPreference,
          specialInstructions: visit.specialInstructions,
          additionalServices: visit.additionalServices,
          ssnLast4: visit.ssnLast4,
          employeeDob: visit.employeeDob,
          employeeAddress: visit.employeeAddress,
          employeeLocation: visit.employeeLocation,
          staffingAgency: visit.staffingAgency,
          clinicLocationId: visit.clinicLocationId,
          notifiedAt: visit.notifiedAt,
          returnedAt: visit.returnedAt,
        },
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
          department: employee.department,
          email: employee.email,
        },
        company: companyProfile ? {
          companyName: companyProfile.companyName,
          industry: companyProfile.industry,
          dotNumber: companyProfile.dotNumber,
          derName: companyProfile.derName,
          derPhone: companyProfile.derPhone,
          derEmail: companyProfile.derEmail,
          clinicName: companyProfile.clinicName,
          phone: companyProfile.phone,
          address: companyProfile.address,
          city: companyProfile.city,
          state: companyProfile.state,
          zipCode: companyProfile.zipCode,
        } : null,
        authorization: visit.authorizationName ? {
          name: visit.authorizationName,
          title: visit.authorizationTitle,
          phone: visit.authorizationPhone,
          timestamp: visit.checkedInAt,
          signatureDataUrl: visit.signatureDataUrl,
        } : null,
        authorizationForm: matchedForm ? {
          formName: matchedForm.formName,
          visitType: matchedForm.visitType,
        } : null,
        clinicLocation: clinicLocation ? {
          id: clinicLocation.id,
          name: clinicLocation.name,
          address: clinicLocation.address,
          city: clinicLocation.city,
          state: clinicLocation.state,
          zipCode: clinicLocation.zipCode,
          phone: clinicLocation.phone,
          hours: clinicLocation.hours,
          latitude: clinicLocation.latitude,
          longitude: clinicLocation.longitude,
        } : null,
        allClinicLocations: allClinicLocations.map(loc => ({
          id: loc.id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          zipCode: loc.zipCode,
          phone: loc.phone,
          latitude: loc.latitude,
          longitude: loc.longitude,
        })),
      });
    } catch (error: any) {
      console.error("Error looking up passport:", error);
      res.status(500).json({ message: "Failed to look up passport" });
    }
  });

  // "I'm Here" notification - notify employer when clinic scans QR (PUBLIC)
  app.post("/api/passport/notify-employer/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { clinicName, clinicLocationId } = req.body;

      const visit = await storage.getClinicVisitByToken(token);
      if (!visit) {
        return res.status(404).json({ message: "Passport not found" });
      }

      if (visit.employerNotified) {
        return res.json({ message: "Employer already notified", alreadyNotified: true });
      }

      const employee = await storage.getEmployeeByIdPublic(visit.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const companyProfile = await storage.getCompanyProfile(visit.userId);
      const derPhone = companyProfile?.derPhone;

      let resolvedClinicName = clinicName || visit.clinicName;
      const resolvedLocationId = clinicLocationId || visit.clinicLocationId;
      if (resolvedLocationId && !resolvedClinicName) {
        const loc = await storage.getClinicLocationById(resolvedLocationId);
        if (loc) {
          resolvedClinicName = `${loc.name} - ${loc.city}, ${loc.state}`;
        }
      }

      let smsResult = { sent: false, message: "No DER phone number configured" };

      if (derPhone) {
        try {
          const { getTwilioClient, getTwilioFromPhoneNumber } = await import("./twilioService");
          const client = await getTwilioClient();
          const fromNumber = await getTwilioFromPhoneNumber();

          const visitTypeLabels: Record<string, string> = {
            dot_physical: "DOT Physical",
            drug_screen: "Drug Screen",
            respiratory_exam: "Respiratory Exam",
            injury: "Injury Evaluation",
            new_hire: "New Hire Intake",
            other: "Medical Visit",
          };

          const visitLabel = visitTypeLabels[visit.visitType] || visit.visitType;
          const employeeName = `${employee.firstName} ${employee.lastName}`;
          const clinicInfo = resolvedClinicName ? ` at ${resolvedClinicName}` : "";
          const now = new Date();
          const arrivalTimeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago" });

          const message = `CCH Alert: Employee ${employeeName} has checked in${clinicInfo} for their ${visitLabel} at ${arrivalTimeStr}. Authorization was provided digitally via CCH Medical Passport.`;

          await client.messages.create({
            body: message,
            from: fromNumber,
            to: derPhone,
          });

          smsResult = { sent: true, message: "Employer notified via SMS" };
        } catch (smsError: any) {
          console.error("SMS notification failed:", smsError);
          smsResult = { sent: false, message: `SMS failed: ${smsError.message}` };
        }
      }

      const wasNotified = smsResult.sent || !derPhone;
      const arrivalTime = new Date();
      await storage.updateClinicVisit(visit.id, {
        employerNotified: wasNotified,
        notifiedAt: arrivalTime,
        clinicName: resolvedClinicName || visit.clinicName,
        clinicLocationId: resolvedLocationId || visit.clinicLocationId,
      });

      res.json({
        notified: wasNotified,
        smsResult,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        arrivedAt: arrivalTime.toISOString(),
      });
    } catch (error: any) {
      console.error("Error notifying employer:", error);
      res.status(500).json({ message: "Failed to notify employer" });
    }
  });

  // "I'm Back" notification - employee notifies employer they've returned (PUBLIC)
  app.post("/api/passport/employee-returned/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const visit = await storage.getClinicVisitByToken(token);
      if (!visit) {
        return res.status(404).json({ message: "Passport not found" });
      }

      if (visit.returnedAt) {
        return res.json({ message: "Return already recorded", alreadyReturned: true, returnedAt: visit.returnedAt });
      }

      if (!visit.notifiedAt) {
        return res.status(400).json({ message: "Employee has not checked in yet" });
      }

      const employee = await storage.getEmployeeByIdPublic(visit.employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const companyProfile = await storage.getCompanyProfile(visit.userId);
      const derPhone = companyProfile?.derPhone;

      const returnTime = new Date();
      const arrivalTime = new Date(visit.notifiedAt);
      const durationMs = returnTime.getTime() - arrivalTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      let smsResult = { sent: false, message: "No DER phone number configured" };

      if (derPhone) {
        try {
          const { getTwilioClient, getTwilioFromPhoneNumber } = await import("./twilioService");
          const client = await getTwilioClient();
          const fromNumber = await getTwilioFromPhoneNumber();

          const employeeName = `${employee.firstName} ${employee.lastName}`;
          const returnTimeStr = returnTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago" });

          const message = `CCH Alert: Employee ${employeeName} is back from their clinic visit at ${returnTimeStr}. Total time away: ${durationStr}.`;

          await client.messages.create({
            body: message,
            from: fromNumber,
            to: derPhone,
          });

          smsResult = { sent: true, message: "Employer notified via SMS" };
        } catch (smsError: any) {
          console.error("SMS return notification failed:", smsError);
          smsResult = { sent: false, message: `SMS failed: ${smsError.message}` };
        }
      }

      await storage.updateClinicVisit(visit.id, {
        returnedAt: returnTime,
        status: "completed",
      });

      res.json({
        returned: true,
        smsResult,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        returnedAt: returnTime.toISOString(),
        arrivedAt: visit.notifiedAt,
        durationMinutes,
        durationStr,
      });
    } catch (error: any) {
      console.error("Error recording return:", error);
      res.status(500).json({ message: "Failed to record return" });
    }
  });

  // Send passport link to employee via SMS
  app.post("/api/passport/send-to-employee", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;

    try {
      const { token, qrUrl, employeePhone } = req.body;

      if (!token || typeof token !== "string" || !qrUrl || typeof qrUrl !== "string") {
        return res.status(400).json({ message: "Token and QR URL are required" });
      }

      const visit = await storage.getClinicVisitByToken(token);
      if (!visit || visit.userId !== userId) {
        return res.status(404).json({ message: "Passport not found" });
      }

      const employee = await storage.getEmployeeById(visit.employeeId, userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const results: { sms?: { sent: boolean; message: string }; email?: { sent: boolean; message: string } } = {};

      const phoneToUse = employeePhone || employee.phoneNumber;
      if (phoneToUse) {
        try {
          const { getTwilioClient, getTwilioFromPhoneNumber } = await import("./twilioService");
          const client = await getTwilioClient();
          const fromNumber = await getTwilioFromPhoneNumber();

          const visitTypeLabels: Record<string, string> = {
            dot_physical: "DOT Physical",
            drug_screen: "Drug Screen",
            respiratory_exam: "Respiratory Exam",
            injury: "Injury Evaluation",
            new_hire: "New Hire Intake",
            other: "Medical Visit",
          };
          const visitLabel = visitTypeLabels[visit.visitType] || visit.visitType;

          const companyProfile = await storage.getCompanyProfile(userId);
          const companyName = companyProfile?.companyName || "your employer";

          const smsBody = `${companyName} - Medical Passport: You have a ${visitLabel} appointment. Show this link at the clinic front desk: ${qrUrl} - Powered by CCH`;

          await client.messages.create({
            body: smsBody,
            from: fromNumber,
            to: phoneToUse,
          });

          results.sms = { sent: true, message: "SMS sent to employee" };
        } catch (smsError: any) {
          console.error("Employee SMS failed:", smsError);
          results.sms = { sent: false, message: `SMS failed: ${smsError.message}` };
        }
      }

      res.json({ success: true, results, phoneUsed: !!phoneToUse, emailUsed: false });
    } catch (error: any) {
      console.error("Error sending passport to employee:", error);
      res.status(500).json({ message: "Failed to send passport to employee" });
    }
  });

  // Get clinic visit history for a user (requires auth) - includes employee names
  app.get("/api/passport/visits", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;

    try {
      const visits = await storage.getClinicVisitsByUser(userId);
      const visitsWithNames = await Promise.all(
        visits.map(async (visit) => {
          const employee = await storage.getEmployeeByIdPublic(visit.employeeId);
          return {
            ...visit,
            employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown Employee",
          };
        })
      );
      res.json(visitsWithNames);
    } catch (error: any) {
      console.error("Error fetching visits:", error);
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  // Delete a clinic visit (requires auth, must own the visit)
  app.delete("/api/passport/visits/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    const visitId = parseInt(req.params.id);

    if (isNaN(visitId)) return res.status(400).json({ message: "Invalid visit ID" });

    try {
      const deleted = await storage.deleteClinicVisit(visitId, userId);
      if (!deleted) return res.status(404).json({ message: "Visit not found" });
      res.json({ message: "Visit deleted" });
    } catch (error: any) {
      console.error("Error deleting visit:", error);
      res.status(500).json({ message: "Failed to delete visit" });
    }
  });

  // CLINIC LOCATIONS
  // ==========================================

  app.get("/api/clinic-locations", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    try {
      const locations = await storage.getClinicLocations(userId);
      res.json(locations);
    } catch (error: any) {
      console.error("Error fetching clinic locations:", error);
      res.status(500).json({ message: "Failed to fetch clinic locations" });
    }
  });

  app.get("/api/clinic-locations/by-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const locations = await storage.getClinicLocations(userId);
      res.json(locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        zipCode: loc.zipCode,
        phone: loc.phone,
        hours: loc.hours,
        latitude: loc.latitude,
        longitude: loc.longitude,
      })));
    } catch (error: any) {
      console.error("Error fetching clinic locations:", error);
      res.status(500).json({ message: "Failed to fetch clinic locations" });
    }
  });

  app.post("/api/clinic-locations", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    try {
      const location = await storage.createClinicLocation({ ...req.body, userId });
      res.json(location);
    } catch (error: any) {
      console.error("Error creating clinic location:", error);
      res.status(500).json({ message: "Failed to create clinic location" });
    }
  });

  app.patch("/api/clinic-locations/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateClinicLocation(id, userId, req.body);
      if (!updated) return res.status(404).json({ message: "Clinic location not found" });
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating clinic location:", error);
      res.status(500).json({ message: "Failed to update clinic location" });
    }
  });

  app.delete("/api/clinic-locations/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClinicLocation(id, userId);
      if (!deleted) return res.status(404).json({ message: "Clinic location not found" });
      res.json({ message: "Clinic location deleted" });
    } catch (error: any) {
      console.error("Error deleting clinic location:", error);
      res.status(500).json({ message: "Failed to delete clinic location" });
    }
  });

  // AUTHORIZATION FORMS
  // ==========================================

  app.get("/api/authorization-forms", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    try {
      const forms = await storage.getAuthorizationForms(userId);
      const formsWithoutData = forms.map(f => ({
        id: f.id,
        visitType: f.visitType,
        formName: f.formName,
        fileSize: f.fileSize,
        uploadedAt: f.uploadedAt,
      }));
      res.json(formsWithoutData);
    } catch (error: any) {
      console.error("Error fetching authorization forms:", error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.post("/api/authorization-forms", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    try {
      const { visitType, formName, fileData, fileSize } = req.body;
      if (!visitType || !formName || !fileData) {
        return res.status(400).json({ message: "Visit type, form name, and file data are required" });
      }
      const allowedVisitTypes = ["general", "dot_physical", "drug_screen", "respiratory_exam", "injury", "new_hire", "other"];
      if (!allowedVisitTypes.includes(visitType)) {
        return res.status(400).json({ message: "Invalid visit type" });
      }
      if (!fileData.startsWith("data:application/pdf;base64,")) {
        return res.status(400).json({ message: "Only PDF files are supported" });
      }
      const base64Part = fileData.split(",")[1] || "";
      const decodedSize = Math.ceil(base64Part.length * 0.75);
      const maxSize = 5 * 1024 * 1024;
      if (decodedSize > maxSize) {
        return res.status(400).json({ message: "File too large. Maximum 5MB." });
      }
      const form = await storage.upsertAuthorizationForm({
        userId,
        visitType,
        formName,
        fileData,
        fileSize: fileSize || null,
      });
      res.json({
        id: form.id,
        visitType: form.visitType,
        formName: form.formName,
        fileSize: form.fileSize,
        uploadedAt: form.uploadedAt,
      });
    } catch (error: any) {
      console.error("Error uploading authorization form:", error);
      res.status(500).json({ message: "Failed to upload form" });
    }
  });

  app.delete("/api/authorization-forms/:id", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims.sub;
    try {
      await storage.deleteAuthorizationForm(parseInt(req.params.id), userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting authorization form:", error);
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  // Public endpoint for clinic to download the form (uses visit token for security)
  app.get("/api/passport/form/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const visit = await storage.getClinicVisitByToken(token);
      if (!visit) {
        return res.status(404).json({ message: "Passport not found" });
      }
      const checkedInTime = visit.checkedInAt ? new Date(visit.checkedInAt).getTime() : 0;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - checkedInTime > twentyFourHours) {
        return res.status(410).json({ message: "Passport expired" });
      }
      const form = await storage.getAuthorizationFormByVisitType(visit.userId, visit.visitType);
      const generalForm = form ? null : await storage.getAuthorizationFormByVisitType(visit.userId, "general");
      const matchedForm = form || generalForm;
      if (!matchedForm) {
        return res.status(404).json({ message: "No authorization form on file for this visit type" });
      }
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.set("Pragma", "no-cache");
      res.json({
        formName: matchedForm.formName,
        fileData: matchedForm.fileData,
        visitType: matchedForm.visitType,
      });
    } catch (error: any) {
      console.error("Error fetching passport form:", error);
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  // ==========================================
  // CLINIC ENGAGEMENT LOGGING
  // ==========================================

  app.post("/api/clinic-engagement", async (req, res) => {
    try {
      const { visitToken, clinicName, commandUsed, commandCategory, patientLanguage, sessionDuration, userId } = req.body;
      if (!commandUsed) {
        return res.status(400).json({ message: "commandUsed is required" });
      }
      const entry = await storage.logClinicEngagement({
        visitToken: visitToken || null,
        clinicName: clinicName || null,
        commandUsed,
        commandCategory: commandCategory || null,
        patientLanguage: patientLanguage || "spanish",
        sessionDuration: sessionDuration || null,
        userId: userId || null,
      });
      res.status(201).json(entry);
    } catch (error: any) {
      console.error("Error logging clinic engagement:", error);
      res.status(500).json({ message: "Failed to log engagement" });
    }
  });

  app.get("/api/clinic-engagement", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const engagement = await storage.getClinicEngagementByUser(userId);
    res.json(engagement);
  });

  return httpServer;
}
