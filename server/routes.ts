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
import { generateClinicLetterDocx, getAvailableInjuryTypes } from "./generateClinicLetter";
import { insertEmployeeSchema, insertIncidentSchema, insertCorrectiveActionSchema, insertActionItemSchema, insertAuditReadinessSchema, insertCompanyProfileSchema, insertIsoProjectSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { textToSpeech, openai } from "./replit_integrations/audio/client";

async function requirePlatformAccess(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  const userId = (req.user as any).claims.sub;
  const user = await storage.getUserById(userId);
  if (user?.isSuperadmin) return true;
  const sub = await storage.getSubscription(userId);
  const hasPlatform = sub?.status === 'active' && 
    (sub?.plan === 'employer_platform' || sub?.plan === 'enterprise');
  if (!hasPlatform) {
    res.status(403).json({ message: "Employer Platform subscription required" });
    return false;
  }
  return true;
}

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "videos");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `training-intro-${Date.now()}${ext}`);
  },
});
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp4", ".webm", ".mov", ".avi"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only video files (mp4, webm, mov, avi) are allowed"));
    }
  },
});

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

CRITICAL RESPONSE FORMAT: You MUST respond in valid JSON with ONLY these fields:
{
  "spanish": "The Spanish translation to speak to the patient. Plain Spanish text only — no quotes, no labels, no markdown, no symbols. Empty string if patient is speaking.",
  "english": "The English translation for the provider to read. Plain English text only — no quotes, no labels, no markdown, no symbols. Empty string if provider is speaking.",
  "followUp": "One brief suggested follow-up question in English, or empty string if none needed."
}

Rules:
- No display field. No verbose headers. No 'Provider asked:' or 'Translation to Patient:' labels.
- No arrow symbols (→), no escaped quotes, no markdown formatting.
- spanish and english fields must contain ONLY the clean translated text, nothing else.
- Always return valid JSON. No markdown code blocks. Just the raw JSON object.`;

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
        const spanish = (parsed.spanish || "").replace(/[→←↑↓►◄▶◀"""\\]/g, "").replace(/\n+/g, " ").trim();
        const english = (parsed.english || "").replace(/[→←↑↓►◄▶◀"""\\]/g, "").replace(/\n+/g, " ").trim();
        const followUp = (parsed.followUp || "").replace(/\n+/g, " ").trim();
        res.json({
          reply: spanish || english || rawReply,
          spanish,
          english,
          followUp,
        });
      } catch {
        res.json({ reply: rawReply, spanish: "", english: "", followUp: "" });
      }
    } catch (error) {
      console.error("BMA chat error:", error);
      res.status(500).json({ error: "BMA chat failed" });
    }
  });

  app.post("/api/bma-tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text required" });
      }
      const clean = text
        .replace(/[→←↑↓►◄▶◀"""\\]/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 4096);
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: clean,
        response_format: "mp3",
      } as any);
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-cache");
      res.send(buffer);
    } catch (error) {
      console.error("BMA TTS error:", error);
      res.status(500).json({ error: "TTS failed" });
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
    const user = await storage.getUserById(userId);
    const isAdmin = user?.isSuperadmin === true;
    const isPro = sub?.status === "active";
    const hasPlatform = isAdmin || (isPro && (sub?.plan === 'employer_platform' || sub?.plan === 'enterprise'));
    
    let teamMembership = null;
    if (!isPro) {
      const membership = await storage.getTeamMembership(userId);
      if (membership) {
        teamMembership = {
          teamId: membership.team.id,
          companyName: membership.team.companyName,
          role: membership.member.role,
          status: membership.team.status,
        };
      }
    }

    let joinDate: string | null = null;
    let nextPaymentDate: string | null = null;

    if (sub?.createdAt) {
      joinDate = sub.createdAt.toISOString();
    }

    if (sub?.stripeSubscriptionId && isPro) {
      try {
        const { getUncachableStripeClient } = await import('./stripeClient');
        const stripe = await getUncachableStripeClient();
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId) as any;
        if (stripeSub?.current_period_end) {
          nextPaymentDate = new Date(stripeSub.current_period_end * 1000).toISOString();
        }
      } catch (e) {
      }
    }

    res.json({
      status: sub?.status || "inactive",
      plan: sub?.plan,
      isPro: isPro || isAdmin || !!teamMembership,
      hasPlatform,
      isAdmin,
      teamMembership,
      joinDate,
      nextPaymentDate,
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
      const verifiedCId = await stripeService.ensureCustomerExists(sub?.stripeCustomerId, userEmail, userId);
      if (verifiedCId !== sub?.stripeCustomerId) {
        await storage.upsertSubscription({ userId, status: sub?.status || "inactive", stripeCustomerId: verifiedCId });
        sub = await storage.getSubscription(userId);
      }
      const customerId = verifiedCId;
      
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

  app.post("/api/subscriptions/platform-checkout", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims.sub;
      const userEmail = (req.user as any).claims.email || `user-${userId}@example.com`;
      const { plan } = req.body; // 'corey_pro', 'employer_platform', or 'setup_fee'
      
      if (!plan) {
        return res.status(400).json({ message: "Plan is required" });
      }

      let sub = await storage.getSubscription(userId);
      const verifiedCId2 = await stripeService.ensureCustomerExists(sub?.stripeCustomerId, userEmail, userId);
      if (verifiedCId2 !== sub?.stripeCustomerId) {
        await storage.upsertSubscription({ userId, status: sub?.status || "inactive", stripeCustomerId: verifiedCId2 });
      }
      const customerId = verifiedCId2;
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const stripe = (await import('./stripeClient')).getUncachableStripeClient();
      const stripeClient = await stripe;

      const planConfig: Record<string, { name: string; amount: number; interval?: string; mode: string }> = {
        corey_pro: { name: 'CCHUB Unlimited Safety - Corey AI', amount: 9900, interval: 'month', mode: 'subscription' },
        employer_platform: { name: 'CCHUB Employer Compliance Platform', amount: 29900, interval: 'month', mode: 'subscription' },
        setup_fee: { name: 'CCHUB Platform Setup & Onboarding', amount: 49900, mode: 'payment' },
      };

      const config = planConfig[plan];
      if (!config) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const lineItem: any = {
        price_data: {
          currency: 'usd',
          product_data: { name: config.name },
          unit_amount: config.amount,
        },
        quantity: 1,
      };
      if (config.interval) {
        lineItem.price_data.recurring = { interval: config.interval };
      }

      const session = await stripeClient.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: config.mode as any,
        success_url: `${baseUrl}/settings?platform_checkout=success&plan=${plan}`,
        cancel_url: `${baseUrl}/settings?platform_checkout=cancelled`,
        metadata: {
          userId,
          plan,
          type: 'platform_subscription',
        },
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Platform checkout error:', error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/subscriptions/activate-platform", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = (req.user as any).claims.sub;
      const { plan } = req.body;
      
      if (plan === 'setup_fee') {
        return res.json({ success: true, message: "Setup fee paid" });
      }

      const sub = await storage.getSubscription(userId);
      if (!sub?.stripeCustomerId) {
        return res.status(400).json({ message: "No customer record found. Please complete checkout first." });
      }

      const stripeClient = await (await import('./stripeClient')).getUncachableStripeClient();
      const sessions = await stripeClient.checkout.sessions.list({
        customer: sub.stripeCustomerId,
        limit: 5,
      });

      const validSession = sessions.data.find(
        (s: any) => s.payment_status === 'paid' && 
        s.metadata?.plan === plan && 
        s.metadata?.type === 'platform_subscription'
      );

      if (!validSession) {
        return res.status(403).json({ message: "No valid paid checkout session found for this plan." });
      }
      
      await storage.upsertSubscription({
        userId,
        status: "active",
        plan: plan || 'employer_platform',
        stripeSubscriptionId: validSession.subscription as string || sub.stripeSubscriptionId,
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Activation error:', error);
      res.status(500).json({ message: "Failed to activate subscription" });
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
          (p.unit_amount === 19900 && p.recurring?.interval === 'month')
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
      const verifiedCustomerId = await stripeService.ensureCustomerExists(
        sub?.stripeCustomerId,
        userEmail,
        userId
      );
      if (verifiedCustomerId !== sub?.stripeCustomerId) {
        await storage.upsertSubscription({
          userId,
          status: sub?.status || "inactive",
          stripeCustomerId: verifiedCustomerId,
        });
      }
      const customerId = verifiedCustomerId;

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

  // Audit Prep Tools API routes
  app.get("/api/audit-checklist/:category", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const { category } = req.params;
      const items = await storage.getAuditChecklistItems(userId, category);
      res.json(items);
    } catch (error: any) {
      console.error('Error fetching audit checklist:', error);
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  app.post("/api/audit-checklist/toggle", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const { category, itemKey, totalItems } = req.body;
      if (!category || !itemKey) {
        return res.status(400).json({ message: "Category and itemKey are required" });
      }
      const item = await storage.toggleAuditChecklistItem(userId, category, itemKey);
      
      const allItems = await storage.getAuditChecklistItems(userId, category);
      const completedCount = allItems.filter(i => i.completed).length;
      await storage.updateAuditReadiness(userId, category, completedCount, totalItems || allItems.length);
      
      res.json(item);
    } catch (error: any) {
      console.error('Error toggling checklist item:', error);
      res.status(500).json({ message: "Failed to toggle item" });
    }
  });

  app.get("/api/audit-readiness", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const readiness = await storage.getAuditReadinessByUser(userId);
      res.json(readiness);
    } catch (error: any) {
      console.error('Error fetching audit readiness:', error);
      res.status(500).json({ message: "Failed to fetch audit readiness" });
    }
  });

  app.get("/api/audit-prep/pdf-summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const readiness = await storage.getAuditReadinessByUser(userId);
      
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
      
      const primaryColor = '#1e3a5f';
      const pageWidth = 612;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      
      doc.rect(0, 0, pageWidth, 70).fill(primaryColor);
      doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
        .text('AUDIT READINESS SUMMARY', margin, 15, { align: 'center', width: contentWidth });
      doc.fontSize(11).font('Helvetica')
        .text('Core Compliance Hub — Audit Prep Tools', margin, 40, { align: 'center', width: contentWidth });
      doc.fontSize(8).font('Helvetica-Oblique')
        .text(`Generated: ${new Date().toLocaleDateString()}`, margin, 54, { align: 'center', width: contentWidth });
      
      let y = 90;
      
      const categoryLabels: Record<string, string> = {
        'osha': 'OSHA Compliance',
        'dot': 'DOT Compliance',
        'iso_9001': 'ISO 9001 — Quality Management',
        'iso_14001': 'ISO 14001 — Environmental Management',
        'iso_45001': 'ISO 45001 — OH&S Management',
      };
      
      if (readiness.length === 0) {
        doc.fillColor('#666').fontSize(12).font('Helvetica')
          .text('No audit preparation data recorded yet. Start checking off items in the Audit Prep Tools to build your readiness report.', margin, y, { width: contentWidth });
      } else {
        readiness.forEach(r => {
          const pct = r.totalItems ? Math.round((r.completedItems! / r.totalItems!) * 100) : 0;
          const label = categoryLabels[r.category] || r.category;
          
          doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(label, margin, y);
          y += 18;
          doc.fillColor('#333').fontSize(10).font('Helvetica')
            .text(`Completed: ${r.completedItems} / ${r.totalItems} items (${pct}%)`, margin + 10, y);
          y += 14;
          
          doc.rect(margin + 10, y, contentWidth - 20, 12).fill('#e5e7eb');
          doc.rect(margin + 10, y, Math.max(1, (contentWidth - 20) * (pct / 100)), 12).fill(pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444');
          doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
            .text(`${pct}%`, margin + 12, y + 2);
          y += 24;
        });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Audit-Readiness-Summary.pdf"');
      doc.pipe(res);
      doc.end();
    } catch (error: any) {
      console.error('Error generating audit PDF:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get("/api/clinic-letter/injury-types", async (_req, res) => {
    try {
      res.json(getAvailableInjuryTypes());
    } catch (error: any) {
      console.error('Error getting injury types:', error);
      res.status(500).json({ message: "Failed to get injury types" });
    }
  });

  app.post("/api/clinic-letter/generate", async (req, res) => {
    try {
      const schema = z.object({
        companyName: z.string().min(1, "Company name is required"),
        companyAddress: z.string().optional(),
        companyPhone: z.string().optional(),
        companyContact: z.string().optional(),
        companyContactTitle: z.string().optional(),
        clinicName: z.string().optional(),
        employeeName: z.string().optional(),
        injuryType: z.string().min(1, "Injury type is required"),
        injuryDescription: z.string().optional(),
        dateOfInjury: z.string().optional(),
      });

      const params = schema.parse(req.body);
      const buffer = await generateClinicLetterDocx(params);

      const sanitizedCompany = params.companyName.replace(/[^a-zA-Z0-9]/g, '-');
      const filename = `Clinic-Communication-Letter-${sanitizedCompany}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error generating clinic letter:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid form data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to generate clinic letter" });
      }
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
    const user = await storage.getUserById(userId);
    const isSuperadmin = user?.isSuperadmin === true;
    const hasFullAccess = isPro || userIsAdmin || isSuperadmin;
    
    res.json({
      questionCount: usage?.questionCount || 0,
      freeLimit: 3,
      canAsk: hasFullAccess || (usage?.questionCount || 0) < 3,
      isPro: hasFullAccess,
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
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const employeeList = await storage.getEmployees(userId);
    res.json(employeeList);
  });

  // Create employee
  app.post("/api/employees", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
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
    if (!(await requirePlatformAccess(req, res))) return;
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
    if (!(await requirePlatformAccess(req, res))) return;
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

  // Download CSV employee import template
  app.get("/api/employees/template", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const headers = [
      "firstName","lastName","email","phoneNumber","department","position",
      "hireDate","dotPhysicalDate","dotPhysicalExpiry","dotPhysicalStatus",
      "lastDrugTest","drugTestResult","randomPoolIncluded"
    ];
    const example = [
      "John","Smith","jsmith@company.com","5551234567","Operations","CDL Driver",
      "2023-01-15","2024-03-01","2026-03-01","current",
      "2024-09-01","negative","true"
    ];
    const csv = [headers.join(","), example.join(",")].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="CCHUB-Employee-Import-Template.csv"');
    res.send(csv);
  });

  // Import employees from CSV
  app.post("/api/employees/import", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;

    const memUpload = multer({ storage: multer.memoryStorage() });
    memUpload.single("file")(req as any, res as any, async (err) => {
      if (err) return res.status(400).json({ message: "File upload error" });
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "No file provided" });

      const text = file.buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return res.status(400).json({ message: "CSV must have a header row and at least one data row" });

      const parseRow = (row: string): string[] => {
        const result: string[] = [];
        let cur = "";
        let inQ = false;
        for (const ch of row) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
          else { cur += ch; }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ""));
      const idx = (name: string) => headers.indexOf(name);

      const parseDate = (v: string) => {
        if (!v || v === "" || v.toLowerCase() === "n/a") return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseRow(lines[i]);
        const get = (name: string) => cols[idx(name)]?.trim() || "";
        const firstName = get("firstname");
        const lastName = get("lastname");
        if (!firstName || !lastName) { skipped++; continue; }

        try {
          await storage.createEmployee({
            userId,
            firstName,
            lastName,
            email: get("email") || null,
            phoneNumber: get("phonenumber") || null,
            department: get("department") || null,
            position: get("position") || null,
            hireDate: parseDate(get("hiredate")),
            dotPhysicalDate: parseDate(get("dotphysicaldate")),
            dotPhysicalExpiry: parseDate(get("dotphysicalexpiry")),
            dotPhysicalStatus: get("dotphysicalstatus") || null,
            lastDrugTest: parseDate(get("lastdrugtest")),
            drugTestResult: get("drugtestresult") || null,
            randomPoolIncluded: get("randompoolincluded")?.toLowerCase() === "true",
          } as any);
          imported++;
        } catch (rowErr: any) {
          errors.push(`Row ${i + 1} (${firstName} ${lastName}): ${rowErr.message}`);
        }
      }

      res.json({ imported, skipped, errors: errors.slice(0, 10), total: lines.length - 1 });
    });
  });

  // Get incidents
  app.get("/api/incidents", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const incidentList = await storage.getIncidents(userId);
    res.json(incidentList);
  });

  // Get incidents for chart (last 6 months)
  app.get("/api/incidents/chart", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
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
    if (!(await requirePlatformAccess(req, res))) return;
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
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const pending = req.query.pending === 'true';
    
    const items = pending 
      ? await storage.getPendingActionItems(userId)
      : await storage.getActionItems(userId);
    
    // Also add DOT expiration alerts as action items (60/30/15/7 day windows)
    if (pending) {
      try {
        const { dotNotificationService } = await import('./dotNotificationService');
        const expiringEmployees = await dotNotificationService.checkExpiringDotPhysicals(userId);

        const getPriority = (days: number) => {
          if (days <= 7) return 'urgent';
          if (days <= 15) return 'high';
          if (days <= 30) return 'medium';
          return 'low';
        };

        const dotActions = expiringEmployees.map((emp, index) => ({
          id: -1000 - index,
          title: `DOT Physical Expiring — ${emp.employeeName}`,
          description: `DOT medical card expires in ${emp.daysUntilExpiry} day${emp.daysUntilExpiry === 1 ? '' : 's'}.${emp.daysUntilExpiry <= 15 ? ' Contact driver immediately to avoid OOS violation.' : ' Schedule renewal soon.'}`,
          priority: getPriority(emp.daysUntilExpiry),
          status: 'pending',
          dueDate: null,
          createdAt: new Date().toISOString(),
          userId,
          type: 'dot_expiration',
          employeeId: emp.employeeId,
          daysUntilExpiry: emp.daysUntilExpiry,
          employeeName: emp.employeeName,
          employeePhone: emp.employeePhone,
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

  // Send DOT renewal SMS directly from Action Queue
  app.post("/api/action-items/send-dot-sms/:employeeId", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const employeeId = parseInt(req.params.employeeId);
    try {
      const { dotNotificationService } = await import('./dotNotificationService');
      const { sendSMS, isTwilioConfigured } = await import('./twilioService');

      const expiringEmployees = await dotNotificationService.checkExpiringDotPhysicals(userId);
      const emp = expiringEmployees.find(e => e.employeeId === employeeId);

      if (!emp) return res.status(404).json({ message: "Employee not found in expiring list" });
      if (!emp.employeePhone) return res.status(400).json({ message: "No phone number on file for this employee" });

      const twilioReady = await isTwilioConfigured();
      if (!twilioReady) return res.status(503).json({ message: "SMS not configured" });

      const message = dotNotificationService.generateMessage(emp);
      const result = await sendSMS(emp.employeePhone, message);

      if (result.success) {
        await dotNotificationService.logNotification(emp.employeeId, userId, emp.notificationType, 'sms', message, emp.employeePhone, undefined, 'sent');
        res.json({ success: true, message: `Text sent to ${emp.employeeName}` });
      } else {
        res.status(500).json({ message: result.error || "SMS failed" });
      }
    } catch (err: any) {
      console.error("Action queue SMS error:", err);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });

  // Create action item
  app.post("/api/action-items", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
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
    if (!(await requirePlatformAccess(req, res))) return;
    
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

  app.get("/api/superadmin/company-usage", requireSuperadmin, async (req, res) => {
    try {
      const usage = await storage.getCompanyUsageStats();
      res.json(usage);
    } catch (error: any) {
      console.error('Error fetching company usage:', error);
      res.status(500).json({ message: "Failed to fetch company usage" });
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

  // Track page visit (public, no auth required)
  app.post("/api/track-visit", async (req, res) => {
    try {
      const { page } = req.body;
      if (!page || typeof page !== "string") {
        return res.status(400).json({ message: "Page is required" });
      }
      await storage.recordPageVisit(page);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error tracking visit:', error);
      res.status(500).json({ message: "Failed to track visit" });
    }
  });

  // Get site visit stats (superadmin only)
  app.get("/api/superadmin/site-visits", requireSuperadmin, async (req, res) => {
    try {
      const stats = await storage.getSiteVisitStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching site visit stats:', error);
      res.status(500).json({ message: "Failed to fetch site visit stats" });
    }
  });

  // Get all trial leads (Ask Corey trials)
  app.get("/api/superadmin/trial-leads", requireSuperadmin, async (req, res) => {
    try {
      const allTrialLeads = await storage.getAllTrialLeads();
      res.json(allTrialLeads);
    } catch (error: any) {
      console.error('Error fetching trial leads:', error);
      res.status(500).json({ message: "Failed to fetch trial leads" });
    }
  });

  // Export trial leads as CSV
  app.get("/api/superadmin/trial-leads/export", requireSuperadmin, async (req, res) => {
    try {
      const allTrialLeads = await storage.getAllTrialLeads();
      const headers = ['ID', 'Name', 'Email', 'Questions Asked', 'Created At'];
      const rows = allTrialLeads.map(lead => [
        lead.id,
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        lead.questionCount,
        lead.createdAt ? new Date(lead.createdAt).toISOString() : ''
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="trial-leads-export.csv"');
      res.send(csv);
    } catch (error: any) {
      console.error('Error exporting trial leads:', error);
      res.status(500).json({ message: "Failed to export trial leads" });
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
  // DIGITAL MEDICAL PASSPORT (CCHUB Handshake)
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
          logoUrl: companyProfile.logoUrl,
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
          const { sendSMS } = await import("./twilioService");

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

          const message = `CCHUB Alert: Employee ${employeeName} has checked in${clinicInfo} for their ${visitLabel} at ${arrivalTimeStr}. Authorization was provided digitally via CCHUB Medical Passport.`;

          const result = await sendSMS(derPhone, message);

          if (result.success) {
            smsResult = { sent: true, message: "Employer notified via SMS" };
          } else {
            smsResult = { sent: false, message: `SMS failed: ${result.error}` };
          }
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
          const { sendSMS } = await import("./twilioService");

          const employeeName = `${employee.firstName} ${employee.lastName}`;
          const returnTimeStr = returnTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago" });

          const message = `CCHUB Alert: Employee ${employeeName} is back from their clinic visit at ${returnTimeStr}. Total time away: ${durationStr}.`;

          const result = await sendSMS(derPhone, message);

          if (result.success) {
            smsResult = { sent: true, message: "Employer notified via SMS" };
          } else {
            smsResult = { sent: false, message: `SMS failed: ${result.error}` };
          }
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
          const { sendSMS } = await import("./twilioService");

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

          const smsBody = `${companyName} - Medical Passport: You have a ${visitLabel} appointment. Show this link at the clinic front desk: ${qrUrl} - Powered by CCHUB`;

          const smsResult = await sendSMS(phoneToUse, smsBody);

          if (smsResult.success) {
            results.sms = { sent: true, message: "SMS sent to employee" };
          } else {
            results.sms = { sent: false, message: `SMS failed: ${smsResult.error}` };
          }
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

  // ============ TRAINING COURSES ============

  // Get all available courses
  app.get("/api/courses", async (_req, res) => {
    try {
      const allCourses = await storage.getCourses();
      res.json(allCourses);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get course overview (public - no lesson content exposed)
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourseById(parseInt(req.params.id));
      if (!course) return res.status(404).json({ message: "Course not found" });

      const modules = await storage.getModulesByCourse(course.id);
      const modulesOverview = await Promise.all(
        modules.map(async (mod) => {
          const lessons = await storage.getLessonsByModule(mod.id);
          const questions = await storage.getQuizQuestionsByModule(mod.id);
          return {
            ...mod,
            lessonCount: lessons.length,
            lessonTitles: lessons.map(l => l.title),
            quizQuestionCount: questions.length,
          };
        })
      );

      res.json({ ...course, modules: modulesOverview });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Get user's enrollments
  app.get("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const enrollments = await storage.getEnrollmentsByUser(userId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Enroll in a course (after purchase verification)
  app.post("/api/enrollments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const { courseId } = req.body;

      const existing = await storage.getEnrollment(userId, courseId);
      if (existing) return res.json(existing);

      const enrollment = await storage.createEnrollment({
        userId,
        courseId,
        status: "active",
        progress: 0,
      });
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to enroll" });
    }
  });

  // Helper: resolve userId from auth or training token
  async function resolveTrainingUserId(req: any): Promise<{ userId: string; allowedCourseId?: number } | null> {
    if (req.isAuthenticated()) {
      return { userId: (req.user as any).claims?.sub || (req.user as any).id };
    }
    const token = req.query?.token || req.body?.token;
    if (token) {
      const assignment = await storage.getTrainingAssignmentByToken(token);
      if (assignment && assignment.status !== "revoked") {
        const uid = assignment.enrollmentUserId || `employee:${assignment.employeeId}`;
        return { userId: uid, allowedCourseId: assignment.courseId };
      }
    }
    return null;
  }

  // Get course content for enrolled user (lessons + progress)
  app.get("/api/courses/:id/learn", async (req, res) => {
    const resolved = await resolveTrainingUserId(req);
    if (!resolved) return res.status(401).json({ message: "Unauthorized" });
    const { userId, allowedCourseId } = resolved;
    try {
      const courseId = parseInt(req.params.id);
      if (allowedCourseId && allowedCourseId !== courseId) {
        return res.status(403).json({ message: "Token does not grant access to this course" });
      }

      const enrollment = await storage.getEnrollment(userId, courseId);
      if (!enrollment) return res.status(403).json({ message: "Not enrolled in this course" });

      const course = await storage.getCourseById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      const modules = await storage.getModulesByCourse(courseId);
      const progress = await storage.getLessonProgress(userId, courseId);
      const completedLessonIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));

      const modulesWithContent = await Promise.all(
        modules.map(async (mod) => {
          const lessons = await storage.getLessonsByModule(mod.id);
          const quizQuestions = await storage.getQuizQuestionsByModule(mod.id);
          const quizAttemptsList = await storage.getQuizAttempts(userId, mod.id);
          const bestAttempt = quizAttemptsList.find(a => a.passed) || quizAttemptsList[0];

          return {
            ...mod,
            lessons: lessons.map(l => ({
              ...l,
              completed: completedLessonIds.has(l.id),
            })),
            quizQuestionCount: quizQuestions.length,
            quizPassed: quizAttemptsList.some(a => a.passed),
            bestScore: bestAttempt?.score || null,
          };
        })
      );

      res.json({ ...course, enrollment, modules: modulesWithContent });
    } catch (error: any) {
      console.error("Error fetching course content:", error);
      res.status(500).json({ message: "Failed to fetch course content" });
    }
  });

  // Mark lesson as complete
  app.post("/api/lessons/:id/complete", async (req, res) => {
    const resolved = await resolveTrainingUserId(req);
    if (!resolved) return res.status(401).json({ message: "Unauthorized" });
    const { userId, allowedCourseId } = resolved;
    try {
      const lessonId = parseInt(req.params.id);

      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });

      const mod = await storage.getModuleById(lesson.moduleId);
      if (!mod) return res.status(404).json({ message: "Module not found" });

      if (allowedCourseId && allowedCourseId !== mod.courseId) {
        return res.status(403).json({ message: "Token does not grant access to this course" });
      }

      const enrollment = await storage.getEnrollment(userId, mod.courseId);
      if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

      const progressEntry = await storage.markLessonComplete(userId, lessonId, mod.id, mod.courseId);

      // Calculate overall progress
      const allModules = await storage.getModulesByCourse(mod.courseId);
      let totalLessons = 0;
      let completedLessons = 0;
      for (const m of allModules) {
        const lessons = await storage.getLessonsByModule(m.id);
        totalLessons += lessons.length;
      }
      const allProgress = await storage.getLessonProgress(userId, mod.courseId);
      completedLessons = allProgress.filter(p => p.completed).length;

      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      await storage.updateEnrollment(enrollment.id, {
        progress: progressPercent,
        currentModuleId: mod.id,
        currentLessonId: lessonId,
      });

      res.json({ progress: progressEntry, overallProgress: progressPercent });
    } catch (error: any) {
      console.error("Error marking lesson complete:", error);
      res.status(500).json({ message: "Failed to mark lesson complete" });
    }
  });

  // Get quiz questions for a module
  app.get("/api/modules/:id/quiz", async (req, res) => {
    const resolved = await resolveTrainingUserId(req);
    if (!resolved) return res.status(401).json({ message: "Unauthorized" });
    const { userId, allowedCourseId } = resolved;
    try {
      const moduleId = parseInt(req.params.id);

      const mod = await storage.getModuleById(moduleId);
      if (!mod) return res.status(404).json({ message: "Module not found" });

      if (allowedCourseId && allowedCourseId !== mod.courseId) {
        return res.status(403).json({ message: "Token does not grant access to this course" });
      }

      const enrollment = await storage.getEnrollment(userId, mod.courseId);
      if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

      const questions = await storage.getQuizQuestionsByModule(moduleId);
      // Don't send correctIndex to the client
      const safeQuestions = questions.map(({ correctIndex, explanation, ...q }) => q);
      res.json(safeQuestions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Submit quiz answers
  app.post("/api/modules/:id/quiz", async (req, res) => {
    const resolved = await resolveTrainingUserId(req);
    if (!resolved) return res.status(401).json({ message: "Unauthorized" });
    const { userId, allowedCourseId } = resolved;
    try {
      const moduleId = parseInt(req.params.id);
      const { answers } = req.body;

      const mod = await storage.getModuleById(moduleId);
      if (!mod) return res.status(404).json({ message: "Module not found" });

      if (allowedCourseId && allowedCourseId !== mod.courseId) {
        return res.status(403).json({ message: "Token does not grant access to this course" });
      }

      const enrollment = await storage.getEnrollment(userId, mod.courseId);
      if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

      const questions = await storage.getQuizQuestionsByModule(moduleId);
      if (questions.length === 0) return res.status(400).json({ message: "No quiz questions" });

      let correct = 0;
      const results = questions.map((q, i) => {
        const userAnswer = answers[i] ?? -1;
        const isCorrect = userAnswer === q.correctIndex;
        if (isCorrect) correct++;
        return {
          questionId: q.id,
          userAnswer,
          correctAnswer: q.correctIndex,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= 70; // 70% passing threshold

      const attempt = await storage.createQuizAttempt({
        userId,
        moduleId,
        courseId: mod.courseId,
        score,
        passed,
        answers: JSON.stringify(answers),
      });

      res.json({ attempt, results, score, passed, correct, total: questions.length });
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // Complete course and generate certificate
  app.post("/api/courses/:id/complete", async (req, res) => {
    const resolved = await resolveTrainingUserId(req);
    if (!resolved) return res.status(401).json({ message: "Unauthorized" });
    const { userId, allowedCourseId } = resolved;
    try {
      const courseId = parseInt(req.params.id);
      if (allowedCourseId && allowedCourseId !== courseId) {
        return res.status(403).json({ message: "Token does not grant access to this course" });
      }

      const enrollment = await storage.getEnrollment(userId, courseId);
      if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

      const course = await storage.getCourseById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      // Verify all module quizzes are passed
      const modules = await storage.getModulesByCourse(courseId);
      for (const mod of modules) {
        const questions = await storage.getQuizQuestionsByModule(mod.id);
        if (questions.length > 0) {
          const attempts = await storage.getQuizAttempts(userId, mod.id);
          const hasPassed = attempts.some(a => a.passed);
          if (!hasPassed) {
            return res.status(400).json({ message: `Module "${mod.title}" quiz not yet passed` });
          }
        }
      }

      // Check existing certificate
      const existingCert = await storage.getCertificate(userId, courseId);
      if (existingCert) return res.json(existingCert);

      const user = await storage.getUserById(userId);
      const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Student";

      const certNumber = `CCHUB-${course.productId.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Date.now().toString(36).toUpperCase()}`;

      const certificate = await storage.createCertificate({
        userId,
        courseId,
        enrollmentId: enrollment.id,
        certificateNumber: certNumber,
        userName,
        courseName: course.title,
      });

      await storage.updateEnrollment(enrollment.id, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      });

      // Notify DER via SMS when employee completes a training course
      try {
        const { sendSMS, isTwilioConfigured } = await import('./twilioService');
        const twilioReady = await isTwilioConfigured();
        if (twilioReady) {
          // Try to find the assignment to get the employer user ID
          const trainingToken = req.headers['x-training-token'] as string || req.body?.trainingToken;
          let employerUserId: string | null = null;
          if (trainingToken) {
            const assignment = await storage.getTrainingAssignmentByToken(trainingToken);
            employerUserId = assignment?.employerUserId || null;
          }
          if (!employerUserId && req.isAuthenticated()) {
            employerUserId = (req.user as any).claims.sub;
          }
          if (employerUserId) {
            const companyProfile = await storage.getCompanyProfile(employerUserId);
            const derPhone = companyProfile?.derPhone;
            const derName = companyProfile?.derName || "DER";
            if (derPhone) {
              const completedAt = new Date().toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "short", timeStyle: "short" });
              const derMsg = `CCHUB Training Alert: ${userName} completed "${course.title}" on ${completedAt}. Cert #${certNumber}. View records at corecompliancehub.com – Core Compliance Hub`;
              sendSMS(derPhone, derMsg).catch(err => console.error("DER completion SMS error:", err));
            }
          }
        }
      } catch (smsErr) {
        console.error("DER SMS notification error (non-fatal):", smsErr);
      }

      res.json(certificate);
    } catch (error: any) {
      console.error("Error completing course:", error);
      res.status(500).json({ message: "Failed to complete course" });
    }
  });

  // Get user certificates
  app.get("/api/certificates", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const certs = await storage.getCertificatesByUser(userId);
      res.json(certs);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  // Verify certificate (public)
  app.get("/api/certificates/verify/:certNumber", async (req, res) => {
    try {
      const cert = await storage.getCertificateByNumber(req.params.certNumber);
      if (!cert) return res.status(404).json({ valid: false, message: "Certificate not found" });
      res.json({ valid: true, certificate: cert });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to verify certificate" });
    }
  });

  // Seed course data (admin endpoint)
  app.post("/api/admin/seed-courses", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isAdmin = await storage.isSuperadmin(userId);
    if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

    try {
      const { seedDOTCourse } = await import("./courseSeed");
      await seedDOTCourse(storage);
      const { seedBrandNSwagCourses } = await import("./brandnswagCourseSeed");
      await seedBrandNSwagCourses(storage);
      res.json({ message: "All courses seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding courses:", error);
      res.status(500).json({ message: "Failed to seed courses" });
    }
  });

  // ======================== EMPLOYER TRAINING PORTAL ========================

  // Get all training assignments for the employer
  app.get("/api/training-assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const assignments = await storage.getTrainingAssignmentsByEmployer(userId);

      const employeeList = await storage.getEmployees(userId);
      const courseList = await storage.getCourses();

      const employeeMap = new Map(employeeList.map(e => [e.id, e]));
      const courseMap = new Map(courseList.map(c => [c.id, c]));

      const enriched = assignments.map(a => ({
        ...a,
        employee: employeeMap.get(a.employeeId),
        course: courseMap.get(a.courseId),
      }));

      res.json(enriched);
    } catch (error: any) {
      console.error("Error fetching training assignments:", error);
      res.status(500).json({ message: "Failed to fetch training assignments" });
    }
  });

  // Create training assignment(s)
  app.post("/api/training-assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const { employeeIds, courseIds } = req.body;

    if (!employeeIds?.length || !courseIds?.length) {
      return res.status(400).json({ message: "Employee IDs and Course IDs are required" });
    }

    try {
      const created: any[] = [];
      const crypto = await import("crypto");
      const { sendSMS, isTwilioConfigured } = await import('./twilioService');
      const twilioReady = await isTwilioConfigured();

      const companyProfile = await storage.getCompanyProfile(userId);
      const companyName = companyProfile?.companyName || "Your employer";

      const baseUrl = `${req.protocol}://${req.headers.host}`;

      for (const employeeId of employeeIds) {
        const employee = await storage.getEmployeeById(employeeId, userId);
        if (!employee) continue;

        for (const courseId of courseIds) {
          const existing = await storage.getTrainingAssignmentByEmployeeAndCourse(userId, employeeId, courseId);
          if (existing) {
            created.push(existing);
            continue;
          }

          const accessToken = crypto.randomBytes(32).toString("hex");
          const assignment = await storage.createTrainingAssignment({
            employerUserId: userId,
            employeeId,
            courseId,
            accessToken,
            status: "assigned",
            progress: 0,
          });
          created.push(assignment);

          if (twilioReady && employee.phoneNumber) {
            const course = await storage.getCourseById(courseId);
            const trainingUrl = `${baseUrl}/employee-training?token=${accessToken}`;
            const empName = `${employee.firstName}`;
            const courseName = course?.title || "Safety Training";
            const smsBody = `Hi ${empName}, ${companyName} has assigned you a safety training course: "${courseName}". Start here (no login needed): ${trainingUrl} – Core Compliance Hub`;
            sendSMS(employee.phoneNumber, smsBody).catch(err => console.error("Training SMS error:", err));
          }
        }
      }

      res.json(created);
    } catch (error: any) {
      console.error("Error creating training assignments:", error);
      res.status(500).json({ message: "Failed to create training assignments" });
    }
  });

  // Get employer training dashboard stats
  app.get("/api/training-assignments/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const assignments = await storage.getTrainingAssignmentsByEmployer(userId);
      const total = assignments.length;
      const assigned = assignments.filter(a => a.status === "assigned").length;
      const inProgress = assignments.filter(a => a.status === "in_progress").length;
      const completed = assignments.filter(a => a.status === "completed").length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      res.json({ total, assigned, inProgress, completed, completionRate });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Redeem training access token (public - employee uses this to start their course)
  app.post("/api/training-access/redeem", async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    try {
      const assignment = await storage.getTrainingAssignmentByToken(token);
      if (!assignment || assignment.status === "revoked") return res.status(404).json({ message: "Invalid or expired training link" });

      const employeeUserId = `employee:${assignment.employeeId}`;

      if (!assignment.enrollmentUserId) {
        let enrollment = await storage.getEnrollment(employeeUserId, assignment.courseId);
        if (!enrollment) {
          enrollment = await storage.createEnrollment({
            userId: employeeUserId,
            courseId: assignment.courseId,
            status: "active",
            progress: 0,
          });
        }

        await storage.updateTrainingAssignment(assignment.id, {
          enrollmentUserId: employeeUserId,
          status: "in_progress",
          startedAt: new Date(),
        });
      }

      const employee = await storage.getEmployeeByIdPublic(assignment.employeeId);

      res.json({
        assignmentId: assignment.id,
        courseId: assignment.courseId,
        employeeUserId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Employee",
        token,
        assignmentType: assignment.assignmentType,
        deadline: assignment.deadline,
      });
    } catch (error: any) {
      console.error("Error redeeming training token:", error);
      res.status(500).json({ message: "Failed to redeem training link" });
    }
  });

  // Get employee training session (used by course viewer with token)
  app.get("/api/training-access/session", async (req, res) => {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ message: "Token is required" });

    try {
      const assignment = await storage.getTrainingAssignmentByToken(token);
      if (!assignment || assignment.status === "revoked") return res.status(404).json({ message: "Invalid training link" });

      const employeeUserId = assignment.enrollmentUserId || `employee:${assignment.employeeId}`;
      const enrollment = await storage.getEnrollment(employeeUserId, assignment.courseId);
      const employee = await storage.getEmployeeByIdPublic(assignment.employeeId);

      res.json({
        assignmentId: assignment.id,
        courseId: assignment.courseId,
        employeeUserId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Employee",
        enrollment,
        status: assignment.status,
        progress: assignment.progress,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get training session" });
    }
  });

  // Sync assignment progress from enrollment data (called periodically or on course viewer)
  app.post("/api/training-assignments/:id/sync", async (req, res) => {
    const assignmentId = parseInt(req.params.id);
    const { token } = req.body;

    try {
      const assignment = token
        ? await storage.getTrainingAssignmentByToken(token)
        : null;

      if (!assignment || assignment.id !== assignmentId || assignment.status === "revoked") {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const employeeUserId = assignment.enrollmentUserId || `employee:${assignment.employeeId}`;
      const enrollment = await storage.getEnrollment(employeeUserId, assignment.courseId);

      if (enrollment) {
        const updates: any = { progress: enrollment.progress };
        if (enrollment.status === "completed" && assignment.status !== "completed") {
          updates.status = "completed";
          updates.completedAt = new Date();
        } else if (enrollment.progress > 0 && assignment.status === "assigned") {
          updates.status = "in_progress";
          if (!assignment.startedAt) updates.startedAt = new Date();
        }
        await storage.updateTrainingAssignment(assignment.id, updates);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to sync progress" });
    }
  });

  // Delete training assignment
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", (req, res, next) => {
    const resolved = path.resolve(uploadsDir, req.path.replace(/^\//, ""));
    if (!resolved.startsWith(uploadsDir)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      res.sendFile(resolved);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  app.post("/api/training-video", videoUpload.single("video"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No video file provided" });

    const oldFiles = fs.readdirSync(path.join(process.cwd(), "uploads", "videos"));
    for (const f of oldFiles) {
      if (f !== req.file.filename) {
        fs.unlinkSync(path.join(process.cwd(), "uploads", "videos", f));
      }
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    res.json({ url: videoUrl, filename: req.file.originalname });
  });

  app.get("/api/training-video", async (_req, res) => {
    const dir = path.join(process.cwd(), "uploads", "videos");
    if (!fs.existsSync(dir)) return res.json({ url: null });
    const files = fs.readdirSync(dir).filter(f => /\.(mp4|webm|mov|avi)$/i.test(f));
    if (files.length === 0) return res.json({ url: null });
    files.sort((a, b) => {
      const aTime = fs.statSync(path.join(dir, a)).mtimeMs;
      const bTime = fs.statSync(path.join(dir, b)).mtimeMs;
      return bTime - aTime;
    });
    res.json({ url: `/uploads/videos/${files[0]}` });
  });

  app.delete("/api/training-video", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const dir = path.join(process.cwd(), "uploads", "videos");
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        fs.unlinkSync(path.join(dir, f));
      }
    }
    res.json({ success: true });
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "nova" } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }
      const trimmed = text.slice(0, 4000);
      const audioBuffer = await textToSpeech(trimmed, voice, "mp3");
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  app.delete("/api/training-assignments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const assignmentId = parseInt(req.params.id);

    try {
      const assignment = await storage.getTrainingAssignmentById(assignmentId, userId);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });

      await storage.updateTrainingAssignment(assignmentId, { status: "revoked" as any });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to revoke assignment" });
    }
  });

  // ======================== NEW HIRE ONBOARDING ========================

  // Assign all BrandNSwag new hire courses as a bundle with 24-hour deadline
  app.post("/api/training-assignments/new-hire", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const { employeeIds } = req.body;

    if (!employeeIds?.length) {
      return res.status(400).json({ message: "Employee IDs are required" });
    }

    try {
      const allCourses = await storage.getCourses();
      const newHireCourses = allCourses.filter(c => c.category === "new_hire_safety");

      if (newHireCourses.length === 0) {
        return res.status(400).json({ message: "No new hire safety courses found. Please seed courses first." });
      }

      const crypto = await import("crypto");
      const { sendSMS, isTwilioConfigured } = await import('./twilioService');
      const twilioReady = await isTwilioConfigured();

      const companyProfile = await storage.getCompanyProfile(userId);
      const companyName = companyProfile?.companyName || "Your employer";
      const baseUrl = `${req.protocol}://${req.headers.host}`;

      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const created: any[] = [];

      for (const employeeId of employeeIds) {
        const employee = await storage.getEmployeeById(employeeId, userId);
        if (!employee) continue;

        const newAssignments: Array<{ course: any; accessToken: string }> = [];

        for (const course of newHireCourses) {
          const existing = await storage.getTrainingAssignmentByEmployeeAndCourse(userId, employeeId, course.id);
          if (existing) {
            created.push(existing);
            continue;
          }

          const accessToken = crypto.randomBytes(32).toString("hex");
          const assignment = await storage.createTrainingAssignment({
            employerUserId: userId,
            employeeId,
            courseId: course.id,
            accessToken,
            status: "assigned",
            progress: 0,
            assignmentType: "new_hire_onboarding",
            deadline,
          });
          created.push(assignment);
          newAssignments.push({ course, accessToken });
        }

        if (twilioReady && employee.phoneNumber && newAssignments.length > 0) {
          const empName = employee.firstName;
          const total = newAssignments.length;
          const introMsg = `Hi ${empName}! ${companyName} has started your New Hire Safety Onboarding. You have ${total} courses to complete within 24 hours. Each course link follows: – Core Compliance Hub`;
          sendSMS(employee.phoneNumber, introMsg).catch(err => console.error("New hire intro SMS error:", err));

          newAssignments.forEach(({ course, accessToken }, idx) => {
            const url = `${baseUrl}/employee-training?token=${accessToken}`;
            const msg = `Course ${idx + 1} of ${total}: "${course.title}" – ${url}`;
            setTimeout(() => {
              sendSMS(employee.phoneNumber!, msg).catch(err => console.error(`New hire course ${idx + 1} SMS error:`, err));
            }, (idx + 1) * 2000);
          });
        }
      }

      res.json({ assignments: created, deadline: deadline.toISOString(), totalCourses: newHireCourses.length });
    } catch (error: any) {
      console.error("Error creating new hire onboarding assignments:", error);
      res.status(500).json({ message: "Failed to create new hire onboarding assignments" });
    }
  });

  // Check new hire onboarding completion status for an employee
  app.get("/api/new-hire/status/:employeeId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const employeeId = parseInt(req.params.employeeId);

    try {
      const assignments = await storage.getNewHireAssignmentsByEmployee(userId, employeeId);
      if (assignments.length === 0) {
        return res.json({ status: "not_assigned", assignments: [], completion: null });
      }

      const totalCourses = assignments.length;
      const completedCourses = assignments.filter(a => a.status === "completed").length;
      const allCompleted = completedCourses === totalCourses;
      const deadline = assignments[0]?.deadline;
      const isOverdue = deadline ? new Date() > new Date(deadline) : false;

      const completion = await storage.getNewHireCompletionByEmployee(userId, employeeId);

      res.json({
        status: allCompleted ? "completed" : isOverdue ? "overdue" : "in_progress",
        assignments,
        totalCourses,
        completedCourses,
        deadline,
        isOverdue,
        completion,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch new hire status" });
    }
  });

  // Check and process new hire completion (called when a course is completed)
  app.post("/api/new-hire/check-completion", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const { employeeId } = req.body;

    if (!employeeId) return res.status(400).json({ message: "Employee ID is required" });

    try {
      const assignments = await storage.getNewHireAssignmentsByEmployee(userId, employeeId);
      if (assignments.length === 0) {
        return res.json({ completed: false, message: "No new hire assignments found" });
      }

      const allCompleted = assignments.every(a => a.status === "completed");
      if (!allCompleted) {
        const completedCount = assignments.filter(a => a.status === "completed").length;
        return res.json({
          completed: false,
          completedCourses: completedCount,
          totalCourses: assignments.length,
        });
      }

      // Check if already completed
      const existing = await storage.getNewHireCompletionByEmployee(userId, employeeId);
      if (existing) {
        return res.json({ completed: true, completion: existing, alreadyProcessed: true });
      }

      // Generate unique QR code data
      const crypto = await import("crypto");
      const qrCodeData = JSON.stringify({
        type: "brandnswag_new_hire",
        employeeId,
        code: crypto.randomBytes(16).toString("hex"),
        points: 100,
        issuedAt: new Date().toISOString(),
      });

      // Create completion record
      const completion = await storage.createNewHireCompletion({
        employerUserId: userId,
        employeeId,
        qrCodeData,
        pointsAwarded: 100,
        hrNotified: false,
      });

      res.json({ completed: true, completion, newlyCompleted: true });
    } catch (error: any) {
      console.error("Error checking new hire completion:", error);
      res.status(500).json({ message: "Failed to check completion" });
    }
  });

  // Get all new hire completions for the employer
  app.get("/api/new-hire/completions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;

    try {
      const completions = await storage.getNewHireCompletionsByEmployer(userId);
      res.json(completions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });

  // Mark HR as notified for a completion
  app.post("/api/new-hire/completions/:id/notify", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateNewHireCompletion(id, { hrNotified: true });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update notification status" });
    }
  });

  // Get new hire onboarding assignments for the employer dashboard
  app.get("/api/training-assignments/new-hire", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;

    try {
      const allAssignments = await storage.getTrainingAssignmentsByEmployer(userId);
      const newHireAssignments = allAssignments.filter(a => a.assignmentType === "new_hire_onboarding");

      // Group by employee
      const groupedByEmployee: Record<number, { employee?: any; assignments: any[]; deadline?: Date | null; allCompleted: boolean }> = {};

      for (const assignment of newHireAssignments) {
        if (!groupedByEmployee[assignment.employeeId]) {
          const employee = await storage.getEmployeeById(assignment.employeeId, userId);
          groupedByEmployee[assignment.employeeId] = {
            employee,
            assignments: [],
            deadline: assignment.deadline,
            allCompleted: true,
          };
        }
        groupedByEmployee[assignment.employeeId].assignments.push(assignment);
        if (assignment.status !== "completed") {
          groupedByEmployee[assignment.employeeId].allCompleted = false;
        }
      }

      const grouped = Object.entries(groupedByEmployee).map(([empId, data]) => ({
        employeeId: parseInt(empId),
        employee: data.employee,
        assignments: data.assignments,
        deadline: data.deadline,
        allCompleted: data.allCompleted,
        completedCount: data.assignments.filter((a: any) => a.status === "completed").length,
        totalCount: data.assignments.length,
      }));

      res.json(grouped);
    } catch (error: any) {
      console.error("Error fetching new hire assignments:", error);
      res.status(500).json({ message: "Failed to fetch new hire assignments" });
    }
  });

  // Corey Team Seats Management
  app.get("/api/team", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;

    const adminTeam = await storage.getTeamByAdmin(userId);
    if (adminTeam) {
      const members = await storage.getTeamMembers(adminTeam.id);
      return res.json({ team: adminTeam, members, role: "admin" });
    }

    const membership = await storage.getTeamMembership(userId);
    if (membership) {
      const members = await storage.getTeamMembers(membership.team.id);
      return res.json({ team: membership.team, members, role: membership.member.role });
    }

    return res.json({ team: null, members: [], role: null });
  });

  app.post("/api/team", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;

    const existing = await storage.getTeamByAdmin(userId);
    if (existing) {
      return res.status(400).json({ message: "You already have a team" });
    }
    const membership = await storage.getTeamMembership(userId);
    if (membership) {
      return res.status(400).json({ message: "You already belong to a team" });
    }

    const { companyName, totalSeats } = req.body;
    if (!companyName || typeof companyName !== "string") {
      return res.status(400).json({ message: "Company name is required" });
    }
    const seats = parseInt(totalSeats) || 1;
    if (seats < 1) {
      return res.status(400).json({ message: "Total seats must be at least 1" });
    }

    const team = await storage.createTeam({
      adminUserId: userId,
      companyName,
      totalSeats: seats,
      status: "active",
    });

    const userEmail = (req.user as any).claims.email || `admin-${userId}@team.local`;
    const userName = (req.user as any).claims.name || (req.user as any).claims.preferred_username || null;
    await storage.addTeamMember({
      teamId: team.id,
      userId,
      email: userEmail,
      name: userName,
      role: "admin",
      status: "active",
    });

    const members = await storage.getTeamMembers(team.id);
    res.status(201).json({ team, members, role: "admin" });
  });

  app.post("/api/team/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;

    const team = await storage.getTeamByAdmin(userId);
    if (!team) {
      return res.status(403).json({ message: "Only team admins can invite members" });
    }

    const { email, name } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingMember = await storage.getTeamMemberByEmail(team.id, email);
    if (existingMember && existingMember.status !== "removed") {
      return res.status(400).json({ message: "This email is already on the team" });
    }

    const activeCount = await storage.getActiveTeamMemberCount(team.id);
    if (activeCount >= team.totalSeats) {
      return res.status(400).json({ message: `Seat limit reached (${team.totalSeats} seats). Upgrade to add more members.` });
    }

    const inviteToken = randomUUID();
    const member = await storage.addTeamMember({
      teamId: team.id,
      email,
      name: name || null,
      role: "member",
      status: "invited",
      inviteToken,
    });

    res.status(201).json(member);
  });

  app.delete("/api/team/members/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;

    const team = await storage.getTeamByAdmin(userId);
    if (!team) {
      return res.status(403).json({ message: "Only team admins can remove members" });
    }

    const memberId = parseInt(req.params.id);
    if (isNaN(memberId)) {
      return res.status(400).json({ message: "Invalid member ID" });
    }

    const removed = await storage.removeTeamMember(memberId, team.id);
    if (!removed) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({ success: true, member: removed });
  });

  app.patch("/api/team/seats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;

    const team = await storage.getTeamByAdmin(userId);
    if (!team) {
      return res.status(403).json({ message: "Only team admins can update seats" });
    }

    const { totalSeats } = req.body;
    const seats = parseInt(totalSeats);
    if (isNaN(seats) || seats < 1) {
      return res.status(400).json({ message: "Total seats must be at least 1" });
    }

    const activeCount = await storage.getActiveTeamMemberCount(team.id);
    if (seats < activeCount) {
      return res.status(400).json({ message: `Cannot reduce below current member count (${activeCount})` });
    }

    const updated = await storage.updateTeamSeats(team.id, seats);
    res.json(updated);
  });

  app.get("/api/team/join/:token", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const { token } = req.params;

    const member = await storage.getTeamMemberByToken(token);
    if (!member) {
      return res.status(404).json({ message: "Invalid or expired invite token" });
    }

    if (member.status === "active") {
      return res.status(400).json({ message: "This invite has already been accepted" });
    }

    if (member.status === "removed") {
      return res.status(400).json({ message: "This invite has been revoked" });
    }

    const existingMembership = await storage.getTeamMembership(userId);
    if (existingMembership) {
      return res.status(400).json({ message: "You already belong to a team" });
    }

    const activated = await storage.activateTeamMember(member.id, userId);
    res.json({ success: true, member: activated });
  });

  app.post("/api/team/checkout", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found. Create a team first." });
      }

      const userEmail = (req.user as any).claims.email || "";
      const sub = await storage.getSubscription(userId);
      let customerId = sub?.stripeCustomerId || team.stripeCustomerId;

      if (!customerId) {
        const customer = await stripeService.createCustomer(userEmail, userId);
        customerId = customer.id;
        await storage.upsertSubscription({
          userId,
          status: sub?.status || "inactive",
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub?.stripeSubscriptionId || null,
          plan: sub?.plan || null,
        });
      }

      const products = await stripeService.listProductsWithPrices();
      const coreyProduct = products.find((p: any) => 
        p.name?.toLowerCase().includes('unlimited safety') || 
        p.name?.toLowerCase().includes('corey') ||
        p.name?.toLowerCase().includes('pro')
      );

      if (!coreyProduct || !coreyProduct.prices?.length) {
        return res.status(400).json({ message: "Corey subscription product not found in Stripe. Please configure it first." });
      }

      const monthlyPrice = coreyProduct.prices.find((p: any) => p.recurring?.interval === 'month') || coreyProduct.prices[0];

      const stripe = (await import('./stripeClient')).getUncachableStripeClient;
      const stripeClient = await stripe();
      const session = await stripeClient.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: monthlyPrice.id, quantity: team.totalSeats }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get("host")}/team-seats?team_checkout=success`,
        cancel_url: `${req.protocol}://${req.get("host")}/team-seats?team_checkout=cancelled`,
        metadata: {
          teamId: team.id.toString(),
          type: 'team_subscription',
        },
        subscription_data: {
          metadata: {
            teamId: team.id.toString(),
            type: 'team_subscription',
          },
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Team checkout error:", error);
      res.status(500).json({ message: error.message || "Failed to create team checkout session" });
    }
  });

  app.post("/api/team/activate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) {
        return res.status(404).json({ message: "No team found" });
      }

      if (team.stripeSubscriptionId) {
        return res.json({ success: true, message: "Team already activated" });
      }

      const stripe = (await import('./stripeClient')).getUncachableStripeClient;
      const stripeClient = await stripe();

      const sub = await storage.getSubscription(userId);
      const customerId = sub?.stripeCustomerId || team.stripeCustomerId;
      if (!customerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const subscriptions = await stripeClient.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      });

      const teamSub = subscriptions.data.find((s: any) => 
        s.metadata?.teamId === team.id.toString() || s.metadata?.type === 'team_subscription'
      );

      if (teamSub) {
        await storage.updateTeamSubscription(team.id, teamSub.id, customerId, 'active');
        res.json({ success: true, message: "Team subscription activated" });
      } else {
        res.status(400).json({ message: "No active team subscription found. Please complete checkout first." });
      }
    } catch (error: any) {
      console.error("Team activate error:", error);
      res.status(500).json({ message: error.message || "Failed to activate team" });
    }
  });

  app.get("/api/qr/try-corey", async (req: Request, res: Response) => {
    try {
      const QRCode = await import("qrcode");
      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const url = `${protocol}://${host}/try-corey`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        width: 400,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(svg);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/qr/try-corey/png", async (req: Request, res: Response) => {
    try {
      const QRCode = await import("qrcode");
      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const url = `${protocol}://${host}/try-corey`;
      const buffer = await QRCode.toBuffer(url, {
        width: 800,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", "attachment; filename=corey-qr-code.png");
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/recordability/usage", async (req: Request, res: Response) => {
    try {
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const count = await storage.getRecordabilityUsageCount(ip);
      res.json({ count, limit: 3 });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/recordability/usage", async (req: Request, res: Response) => {
    try {
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const currentCount = await storage.getRecordabilityUsageCount(ip);
      if (currentCount >= 3) {
        return res.status(429).json({ message: "Daily limit reached", count: currentCount, limit: 3 });
      }
      await storage.addRecordabilityUsage(ip);
      res.json({ count: currentCount + 1, limit: 3 });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── ISO PROJECTS (Setup Wizard) ─────────────────────────────────────────
  app.get("/api/iso-projects", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const project = await storage.getIsoProject(userId);
      if (!project) return res.status(404).json({ message: "No project found" });
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/iso-projects", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const existing = await storage.getIsoProject(userId);
      if (existing) return res.status(409).json({ message: "Project already exists", project: existing });
      const parsed = insertIsoProjectSchema.partial().parse({ ...req.body, userId });
      const project = await storage.createIsoProject({ userId, standard: parsed.standard || "ISO 9001" });
      res.status(201).json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/iso-projects", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const project = await storage.updateIsoProject(userId, req.body);
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/iso-projects", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      await storage.deleteIsoProject(userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
