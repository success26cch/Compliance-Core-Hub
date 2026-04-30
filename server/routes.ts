import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { setupAuth, registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db, rlsMiddleware } from "./rls";
import { auditLogs } from "@shared/schema";
import { buildQmPartAPrompt, buildQmPartBPrompt } from "./qm-prompts";
import { createAnthropicClient } from "./anthropicClient";

// ─── Audit Logging Helper ─────────────────────────────────────────────────────
async function logAudit(
  req: Request,
  action: string,
  resource?: string,
  resourceId?: string | number,
  detail?: string,
  statusCode?: number,
) {
  try {
    const userId = (req as any).user?.id ?? (req.session as any)?.userId ?? null;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    await db.insert(auditLogs).values({
      userId: userId ? String(userId) : null,
      action,
      resource: resource ?? null,
      resourceId: resourceId != null ? String(resourceId) : null,
      ipAddress: ip,
      userAgent: req.headers["user-agent"]?.slice(0, 500) ?? null,
      statusCode: statusCode ?? null,
      detail: detail ?? null,
    });
  } catch {
    // Never let audit logging break the main request
  }
}
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { verifyPaddleSignature, processPaddleEvent } from "./paddleService";
import { dodoService } from "./dodoService";
import { getDodoProductId, PLAN_TO_INTERNAL_ID, seedDodoProducts } from "./dodoProducts";
import { generateRecordabilityCheatSheet } from "./generateCheatSheet";
import { generateDOTDrugTestingCheatSheet } from "./generateDOTCheatSheet";
import { generateISOAuditCheatSheet } from "./generateISOCheatSheet";
import { generateSafetyManagerCheatSheet } from "./generateSafetyManagerCheatSheet";
import { generateClinicLetterDocx, getAvailableInjuryTypes } from "./generateClinicLetter";
import {
  sendEmail,
  CCHUB_ADMIN_EMAILS,
  buildIncidentNotificationEmail,
  buildFROIAdjusterEmail,
  buildCapaAssignmentEmail,
  buildCapaOverdueEmail,
  buildContactInquiryAdminEmail,
  buildContactConfirmationEmail,
  buildLeadNotificationEmail,
  brandedHtml,
} from "./emailService";
import { insertEmployeeSchema, insertIncidentSchema, insertCorrectiveActionSchema, insertActionItemSchema, insertAuditReadinessSchema, insertCompanyProfileSchema, insertIsoProjectSchema, insertNonconformanceSchema, insertIsoDocumentSchema } from "@shared/schema";
import type { IsoRisk } from "@shared/schema";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { textToSpeech, openai, ensureCompatibleFormat } from "./replit_integrations/audio/client";
import { toFile } from "openai";

const HARDCODED_ADMIN_EMAILS = [
  "raulv9471@gmail.com",
  "raul@corecompliancehub.com",
  "evillarreal@acsi-quality.com",
  "team@corecompliancehub.com",
];
const PLATFORM_ADMIN_EMAILS = [
  ...HARDCODED_ADMIN_EMAILS,
  ...(process.env.ADMIN_USERS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
];

function isEmailAdmin(claims: any): boolean {
  const email = (claims?.email || "").toLowerCase();
  const sub = (claims?.sub || "").toLowerCase();
  return PLATFORM_ADMIN_EMAILS.includes(email) || PLATFORM_ADMIN_EMAILS.includes(sub);
}

async function requirePlatformAccess(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  const claims = (req.user as any).claims;
  if (isEmailAdmin(claims)) return true;
  const userId = claims.sub;
  const user = await storage.getUserById(userId);
  if (user?.isSuperadmin) return true;
  const sub = await storage.getSubscription(userId);
  const hasPlatform = sub?.status === 'active' && 
    (sub?.plan === 'employer_platform' || sub?.plan === 'employer_platform_with_corey' || sub?.plan === 'enterprise');
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

  // ── RLS context middleware — must run after session/auth so req.session.userId is available
  app.use(rlsMiddleware);

  // ── ONE-TIME: Ebeni prod account init (remove after first successful call) ──
  app.post("/api/admin/init-ebeni", async (req: Request, res: Response) => {
    const expectedToken = process.env.EBENI_INIT_TOKEN;
    if (!expectedToken) return res.status(503).json({ message: "Not configured" });
    const providedToken = (req.headers["x-init-token"] as string) || req.body?.token;
    if (providedToken !== expectedToken) return res.status(403).json({ message: "Forbidden" });
    try {
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      const tempPassword = "CCItemp2026!";
      const salt = randomBytes(16).toString("hex");
      const derived = (await scryptAsync(tempPassword, salt, 64)) as Buffer;
      const passwordHash = `${salt}:${derived.toString("hex")}`;
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`
        INSERT INTO users (email, first_name, last_name, password_hash, is_superadmin, iso_only, created_at, updated_at)
        VALUES ('evillarreal@acsi-quality.com', 'Ebeni', 'Villarreal', ${passwordHash}, true, true, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          is_superadmin = true,
          iso_only = true,
          updated_at = NOW()
      `);
      res.json({ ok: true, message: "Ebeni account ready. Temp password: CCItemp2026!" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Paddle Webhook ─────────────────────────────────────────────────────────
  // Must be registered before any body-parsing middleware consumes the raw body.
  // We use req.rawBody (captured by express.json's verify callback in index.ts).
  app.post("/webhooks/paddle", async (req: Request, res: Response) => {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[Paddle] PADDLE_WEBHOOK_SECRET is not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    const signatureHeader = req.headers["paddle-signature"] as string | undefined;
    if (!signatureHeader) {
      return res.status(400).json({ error: "Missing Paddle-Signature header" });
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      console.error("[Paddle] rawBody not available — ensure express.json verify callback is active");
      return res.status(400).json({ error: "Raw body unavailable" });
    }

    if (!verifyPaddleSignature(rawBody, signatureHeader, secret)) {
      console.warn("[Paddle] Webhook signature verification failed");
      return res.status(401).json({ error: "Invalid signature" });
    }

    try {
      const event = req.body;
      const eventType: string = event?.event_type ?? event?.notification_type ?? "";
      const data = event?.data ?? event;
      console.log(`[Paddle] Received event: ${eventType}`);
      await processPaddleEvent(eventType, data, event);
      return res.json({ received: true });
    } catch (err: any) {
      console.error("[Paddle] Error processing webhook event:", err.message);
      return res.status(500).json({ error: "Event processing failed" });
    }
  });

  // ─── DODO Payments Webhook ───────────────────────────────────────────────────
  // Follows Standard Webhooks spec (HMAC SHA256).
  // Set DODO_PAYMENTS_WEBHOOK_SECRET from your DODO Dashboard → Developer → Webhooks.
  app.post("/webhooks/dodo", async (req: Request, res: Response) => {
    const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("[DODO Webhook] DODO_PAYMENTS_WEBHOOK_SECRET not configured — skipping verification");
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      return res.status(400).json({ error: "Raw body unavailable" });
    }

    // Standard Webhooks signature verification
    if (secret) {
      const webhookId = req.headers["webhook-id"] as string | undefined;
      const webhookTimestamp = req.headers["webhook-timestamp"] as string | undefined;
      const webhookSignature = req.headers["webhook-signature"] as string | undefined;

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        return res.status(400).json({ error: "Missing webhook signature headers" });
      }

      try {
        const crypto = await import("crypto");
        const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody.toString("utf8")}`;
        const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
        const computedSig = crypto
          .createHmac("sha256", secretBytes)
          .update(signedContent)
          .digest("base64");
        const expectedSigs = webhookSignature.split(" ").map(s => s.split(",")[1]);
        if (!expectedSigs.includes(computedSig)) {
          console.warn("[DODO Webhook] Signature mismatch");
          return res.status(401).json({ error: "Invalid signature" });
        }
      } catch (err: any) {
        console.error("[DODO Webhook] Signature verification error:", err.message);
        return res.status(500).json({ error: "Signature verification failed" });
      }
    }

    try {
      const event = req.body;
      const eventType: string = event?.type ?? event?.event_type ?? "";
      const data = event?.data ?? event;
      console.log(`[DODO Webhook] Received event: ${eventType}`);

      // subscription.active — mark user as subscribed
      if (eventType === "subscription.active" || eventType === "subscription.created") {
        const userId: string | undefined = data?.metadata?.userId ?? data?.customer?.metadata?.userId;
        const plan: string | undefined = data?.metadata?.plan ?? data?.product_id;
        const dodoSubscriptionId: string | undefined = data?.subscription_id ?? data?.id;
        const dodoCustomerId: string | undefined = data?.customer_id ?? data?.customer?.customer_id;

        if (userId) {
          await storage.upsertSubscription({
            userId,
            status: "active",
            plan: plan || "dodo_subscription",
            dodoSubscriptionId: dodoSubscriptionId ?? undefined,
            dodoCustomerId: dodoCustomerId ?? undefined,
          });
          console.log(`[DODO Webhook] Activated subscription for user ${userId}, plan=${plan}`);
        }
      }

      // subscription.cancelled or subscription.expired
      if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
        const userId: string | undefined = data?.metadata?.userId;
        if (userId) {
          await storage.upsertSubscription({
            userId,
            status: "cancelled",
          });
          console.log(`[DODO Webhook] Cancelled subscription for user ${userId}`);
        }
      }

      // payment.succeeded — for one-time payments
      if (eventType === "payment.succeeded") {
        const userId: string | undefined = data?.metadata?.userId;
        const plan: string | undefined = data?.metadata?.plan;
        if (userId && plan) {
          await storage.upsertSubscription({
            userId,
            status: "active",
            plan,
          });
          console.log(`[DODO Webhook] One-time payment succeeded for user ${userId}, plan=${plan}`);
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("[DODO Webhook] Error processing event:", err.message);
      return res.status(500).json({ error: "Event processing failed" });
    }
  });

  // Demo video — served via API route to bypass CDN/static layer size limits
  app.get("/api/demo-video", (req: Request, res: Response) => {
    const isProd = process.env.NODE_ENV === "production";
    const videoPath = isProd
      ? path.join(__dirname, "public", "demo.mp4")
      : path.join(process.cwd(), "client", "public", "demo.mp4");
    const exists = fs.existsSync(videoPath);
    console.log(`[demo-video] env=${isProd ? "prod" : "dev"} path=${videoPath} exists=${exists}`);
    if (!exists) {
      res.status(404).send("Video not found");
      return;
    }
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400");
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunkSize,
      });
      fs.createReadStream(videoPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { "Content-Length": fileSize });
      fs.createReadStream(videoPath).pipe(res);
    }
  });

  // Chat Integration
  registerChatRoutes(app);

  // Spanish to English Translation (Spanish Bilingual Medical Assistant)
  const translationAnthropic = createAnthropicClient();

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
  "followUp": "Provider Insight (English only): When the patient has spoken, briefly summarize what they appear to be communicating clinically, then suggest one specific question or next step the provider should take. Example: 'Patient describes sharp left-side lower back pain starting after a lift. Consider asking: Does the pain radiate down the leg?' — When the provider has spoken, suggest a relevant follow-up or flag anything clinically important. Keep it to 1-2 sentences. Empty string only if there is truly nothing useful to add."
}

Rules:
- No display field. No verbose headers. No 'Provider asked:' or 'Translation to Patient:' labels.
- No arrow symbols (→), no escaped quotes, no markdown formatting.
- spanish and english fields must contain ONLY the clean translated text, nothing else.
- followUp must always be plain English text, never empty unless there is truly nothing useful.
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

      // Strip markdown code fences that sometimes wrap the JSON
      let cleanRaw = rawReply.trim();
      if (cleanRaw.startsWith("```")) {
        cleanRaw = cleanRaw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/, "").trim();
      }

      const cleanField = (s: string) =>
        (s || "").replace(/[→←↑↓►◄▶◀"""\\]/g, "").replace(/\n+/g, " ").trim();

      try {
        const parsed = JSON.parse(cleanRaw);
        const spanish = cleanField(parsed.spanish);
        const english = cleanField(parsed.english);
        const followUp = cleanField(parsed.followUp);
        res.json({ reply: spanish || english || cleanRaw, spanish, english, followUp });
      } catch {
        // Regex fallback — extract fields even if JSON is malformed
        const spanishMatch = cleanRaw.match(/"spanish"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const englishMatch = cleanRaw.match(/"english"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const followUpMatch = cleanRaw.match(/"followUp"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const spanish = cleanField(spanishMatch?.[1] ?? "");
        const english = cleanField(englishMatch?.[1] ?? "");
        const followUp = cleanField(followUpMatch?.[1] ?? "");
        if (spanish || english) {
          res.json({ reply: spanish || english, spanish, english, followUp });
        } else {
          // Last resort — return the raw text, stripped of JSON artifacts
          const stripped = cleanRaw.replace(/^\{[\s\S]*\}$/, "").trim() || cleanRaw;
          res.json({ reply: stripped, spanish: "", english: "", followUp: "" });
        }
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
        .slice(0, 1000);

      // Split into chunks ≤ 190 chars at word boundaries for Google TTS limit
      const chunks: string[] = [];
      const words = clean.split(" ");
      let current = "";
      for (const word of words) {
        if ((current + " " + word).trim().length > 190) {
          if (current) chunks.push(current.trim());
          current = word;
        } else {
          current = current ? current + " " + word : word;
        }
      }
      if (current.trim()) chunks.push(current.trim());

      // Fetch each chunk from Google Translate TTS
      const buffers: Buffer[] = [];
      for (const chunk of chunks) {
        const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=es&q=${encodeURIComponent(chunk)}`;
        const gttsRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://translate.google.com/",
          },
        });
        if (!gttsRes.ok) throw new Error(`Google TTS chunk failed: ${gttsRes.status}`);
        buffers.push(Buffer.from(await gttsRes.arrayBuffer()));
      }

      const combined = Buffer.concat(buffers);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-cache");
      res.send(combined);
    } catch (error) {
      console.error("BMA TTS error:", error);
      res.status(500).json({ error: "TTS failed" });
    }
  });

  // BMA Speech-to-Text — records audio from browser, transcribes via OpenAI Whisper
  app.post("/api/bma-stt", async (req, res) => {
    try {
      const { audio, lang } = req.body;
      if (!audio || typeof audio !== "string") {
        return res.status(400).json({ error: "audio (base64) required" });
      }
      const raw = Buffer.from(audio, "base64");
      const { buffer, format } = await ensureCompatibleFormat(raw);
      const file = await toFile(buffer, `audio.${format}`);
      const result = await openai.audio.transcriptions.create({
        file,
        model: "gpt-4o-mini-transcribe",
        language: typeof lang === "string" && lang ? lang : "es",
      });
      res.json({ transcript: result.text || "" });
    } catch (error) {
      console.error("BMA STT error:", error);
      res.status(500).json({ error: "Transcription failed" });
    }
  });

  // ── BMA Phone Session — ephemeral relay so patient's phone mic → provider screen ──
  const bmaPhoneSessions = new Map<string, { messages: string[]; createdAt: number }>();
  setInterval(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, session] of bmaPhoneSessions) {
      if (session.createdAt < cutoff) bmaPhoneSessions.delete(id);
    }
  }, 30 * 60 * 1000);

  app.post("/api/bma-phone-session", (_req, res) => {
    const id: string = randomUUID();
    bmaPhoneSessions.set(id, { messages: [], createdAt: Date.now() });
    res.json({ sessionId: id });
  });

  app.post("/api/bma-phone-session/:id/message", (req, res) => {
    const session = bmaPhoneSessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const { text } = req.body;
    if (!text || typeof text !== "string") return res.status(400).json({ error: "text required" });
    session.messages.push(text.trim());
    res.json({ ok: true });
  });

  app.get("/api/bma-phone-session/:id/messages", (req, res) => {
    const session = bmaPhoneSessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const messages = [...session.messages];
    session.messages = [];
    res.json({ messages });
  });

  app.delete("/api/bma-phone-session/:id", (req, res) => {
    bmaPhoneSessions.delete(req.params.id);
    res.json({ ok: true });
  });

  // Leads
  app.post(api.leads.create.path, async (req, res) => {
    try {
      const input = api.leads.create.input.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
      // Fire-and-forget admin notification email
      sendEmail(
        CCHUB_ADMIN_EMAILS,
        `New Lead: ${lead.name}`,
        buildLeadNotificationEmail({ name: lead.name, email: lead.email, source: lead.source }),
      ).catch(() => {});
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

  app.delete("/api/leads/:id", requireSuperadmin, async (req, res) => {
    const rawId = req.params.id;
    if (!/^\d+$/.test(rawId)) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }
    const id = parseInt(rawId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid lead ID" });
    }
    const deleted = await storage.deleteLead(id);
    if (!deleted) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.json({ success: true });
  });

  // Subscriptions
  app.get(api.subscriptions.status.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const claims = (req.user as any).claims;
    const userId = claims.sub; // Replit Auth ID
    const sub = await storage.getSubscription(userId);
    const user = await storage.getUserById(userId);
    const isAdmin = user?.isSuperadmin === true || isEmailAdmin(claims);
    const isPro = sub?.status === "active";
    const hasPlatform = isAdmin || (isPro && (sub?.plan === 'employer_platform' || sub?.plan === 'employer_platform_with_corey' || sub?.plan === 'enterprise'));
    
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

    const isIsaSubscriber = isAdmin || (isPro && (sub?.plan === 'isa' || sub?.plan === 'isa_pro' || sub?.plan === 'employer_platform' || sub?.plan === 'employer_platform_with_corey' || sub?.plan === 'enterprise'));
    const isIsaPro = isAdmin || (isPro && (sub?.plan === 'isa_pro'));
    const hasIsoManager = isAdmin || (isPro && (sub?.plan === 'isa' || sub?.plan === 'isa_pro' || sub?.plan === 'iso_manager' || sub?.plan === 'enterprise'));
    const hasEnvHub = isAdmin || (isPro && (sub?.plan === 'env_hub' || sub?.plan === 'enterprise' || sub?.plan === 'employer_platform' || sub?.plan === 'employer_platform_with_corey'));

    res.json({
      status: sub?.status || "inactive",
      plan: sub?.plan,
      isPro: isPro || isAdmin || !!teamMembership,
      hasPlatform,
      hasIsoManager,
      hasEnvHub,
      isAdmin,
      isIsaSubscriber,
      isIsaPro,
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
      const { plan } = req.body;

      if (!plan) {
        return res.status(400).json({ message: "Plan is required" });
      }

      const internalId = PLAN_TO_INTERNAL_ID[plan];
      if (!internalId) {
        return res.status(400).json({ message: "Unknown plan" });
      }

      await seedDodoProducts();

      let sub = await storage.getSubscription(userId);
      const dodoCustomerId = await dodoService.ensureCustomerExists(sub?.dodoCustomerId, userEmail, userId);
      if (dodoCustomerId !== sub?.dodoCustomerId) {
        await storage.upsertSubscription({ userId, status: sub?.status || "inactive", dodoCustomerId });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const checkoutUrl = await dodoService.createCheckoutSession({
        internalProductIds: [internalId],
        quantities: [1],
        successUrl: `${baseUrl}/settings?checkout=success`,
        customerEmail: userEmail,
        metadata: { userId, plan },
      });

      res.json({ url: checkoutUrl });
    } catch (error: any) {
      console.error('[DODO] create-checkout error:', error);
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
      const { plan } = req.body;

      if (!plan) {
        return res.status(400).json({ message: "Plan is required" });
      }

      const internalId = PLAN_TO_INTERNAL_ID[plan];
      if (!internalId) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      await seedDodoProducts();

      let sub = await storage.getSubscription(userId);
      const dodoCustomerId = await dodoService.ensureCustomerExists(sub?.dodoCustomerId, userEmail, userId);
      if (dodoCustomerId !== sub?.dodoCustomerId) {
        await storage.upsertSubscription({ userId, status: sub?.status || "inactive", dodoCustomerId });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const checkoutUrl = await dodoService.createCheckoutSession({
        internalProductIds: [internalId],
        quantities: [1],
        successUrl: `${baseUrl}/settings?platform_checkout=success&plan=${plan}`,
        customerEmail: userEmail,
        metadata: { userId, plan, type: 'platform_subscription' },
      });

      res.json({ url: checkoutUrl });
    } catch (error: any) {
      console.error('[DODO] platform-checkout error:', error);
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

      // With DODO Payments, activation is handled by webhooks.
      // This endpoint now just confirms current DB status.
      const sub = await storage.getSubscription(userId);
      if (sub?.status === 'active') {
        return res.json({ success: true });
      }

      // Optimistically mark active while webhook propagates (DODO fires quickly)
      await storage.upsertSubscription({
        userId,
        status: "active",
        plan: plan || 'employer_platform',
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('[DODO] activate-platform error:', error);
      res.status(500).json({ message: "Failed to activate subscription" });
    }
  });

  // Server-side allowlist for product names — never trust client-provided productName
  const PRODUCT_NAME_ALLOWLIST: Record<string, string> = {
    iso_manager: "ISO Manager",
    isa: "Isa — AI Lead ISO Auditor",
    dot: "DOT Fleet Compliance Hub",
    employer_platform: "Employer Compliance Platform",
  };

  // Product Access Request — notifies team when someone requests info about a gated product
  app.post("/api/request-access", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const claims = (req.user as any).claims;
      const userId = claims.sub;
      const user = await storage.getUserById(userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A user' : 'A user';
      const userEmail = claims.email || 'unknown@unknown.com';
      const { productKey } = req.body;
      if (!productKey) return res.status(400).json({ message: "productKey required" });
      const productName = PRODUCT_NAME_ALLOWLIST[productKey];
      if (!productName) return res.status(400).json({ message: "Unknown product key" });

      const { sendEmail, brandedHtml } = await import('./emailService');
      const bodyHtml = `
        <h2 style="color:#0f172a;font-size:20px;font-weight:700;margin-bottom:8px;">New Product Access Request</h2>
        <p style="color:#64748b;margin-bottom:24px;">Someone is interested in <strong>${productName}</strong> and clicked "Request Access".</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;width:140px;font-weight:600;">Product</td><td style="padding:10px 16px;color:#0f172a;font-size:13px;">${productName}</td></tr>
          <tr><td style="padding:10px 16px;color:#64748b;font-size:13px;font-weight:600;">User Name</td><td style="padding:10px 16px;color:#0f172a;font-size:13px;">${userName}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;font-weight:600;">User Email</td><td style="padding:10px 16px;color:#0f172a;font-size:13px;">${userEmail}</td></tr>
          <tr><td style="padding:10px 16px;color:#64748b;font-size:13px;font-weight:600;">User ID</td><td style="padding:10px 16px;color:#0f172a;font-size:13px;">${userId}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:10px 16px;color:#64748b;font-size:13px;font-weight:600;">Requested At</td><td style="padding:10px 16px;color:#0f172a;font-size:13px;">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT</td></tr>
        </table>
        <a href="mailto:${userEmail}" style="display:inline-block;background:#ea6c19;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Reply to ${userName}</a>
      `;
      await sendEmail("team@corecompliancehub.com", `Access Request — ${productName} — ${userName}`, brandedHtml(`Access Request — ${productName}`, bodyHtml));
      res.json({ success: true });
    } catch (err: any) {
      console.error('[request-access] Error:', err);
      res.status(500).json({ message: "Failed to send request" });
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
        if (!item.name || !item.quantity || item.quantity < 1) {
          return res.status(400).json({ message: "Each item must have name and quantity >= 1" });
        }
      }

      await seedDodoProducts();

      let sub = await storage.getSubscription(userId);
      const dodoCustomerId = await dodoService.ensureCustomerExists(sub?.dodoCustomerId, userEmail, userId);
      if (dodoCustomerId !== sub?.dodoCustomerId) {
        await storage.upsertSubscription({ userId, status: sub?.status || "inactive", dodoCustomerId });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const successUrl = `${baseUrl}/settings?checkout=success`;

      // Map each cart item's productId to a DODO product ID
      const internalProductIds: string[] = [];
      const quantities: number[] = [];
      const planKeys: string[] = [];

      for (const item of items) {
        const internalId = item.productId as string | undefined;
        if (!internalId) {
          return res.status(400).json({ message: `Item "${item.name}" is missing a product ID` });
        }
        const dodoId = getDodoProductId(internalId);
        if (!dodoId) {
          return res.status(400).json({ message: `Product not found in DODO catalog: ${internalId}` });
        }
        internalProductIds.push(internalId);
        quantities.push(item.quantity);
        // Derive plan key for subscription tracking
        const planKey = Object.entries(PLAN_TO_INTERNAL_ID).find(([, v]) => v === internalId)?.[0] ?? internalId;
        planKeys.push(planKey);
      }

      const checkoutUrl = await dodoService.createCheckoutSession({
        internalProductIds,
        quantities,
        successUrl,
        customerEmail: userEmail,
        metadata: { userId, plan: planKeys[0] ?? '' },
      });

      res.json({ url: checkoutUrl });
    } catch (error: any) {
      console.error('[DODO] Cart checkout error:', error);
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

      if (!sub?.dodoCustomerId) {
        return res.status(400).json({ message: "No DODO customer found. Please subscribe first." });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const portalUrl = await dodoService.createPortalSession(
        sub.dodoCustomerId,
        `${baseUrl}/settings`
      );

      res.json({ url: portalUrl });
    } catch (error: any) {
      console.error('[DODO] Portal error:', error);
      res.status(500).json({ message: "Failed to create billing portal session" });
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
  function isAdmin(user: any): boolean {
    if (!user?.claims) return false;
    const email = (user.claims.email || "").toLowerCase();
    const username = (user.claims.name || user.claims.preferred_username || "").toLowerCase();
    return PLATFORM_ADMIN_EMAILS.includes(email) || PLATFORM_ADMIN_EMAILS.includes(username);
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

  // BMA Lead Capture (from demo gate)
  app.post("/api/bma-leads", async (req, res) => {
    try {
      const { firstName, lastName, company, email } = req.body;
      if (!firstName || !email) {
        return res.status(400).json({ message: "First name and email are required" });
      }
      const fullName = [firstName, lastName].filter(Boolean).join(" ");
      const adminHtml = `
        <h2>New BMA Demo Lead</h2>
        <p>A visitor completed the BMA free trial and unlocked their access.</p>
        <table cellpadding="6" style="border-collapse:collapse;">
          <tr><td><strong>Name</strong></td><td>${fullName}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Company/Clinic</strong></td><td>${company || "—"}</td></tr>
          <tr><td><strong>Source</strong></td><td>BMA Demo Gate (/bma)</td></tr>
          <tr><td><strong>Date</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        <p style="margin-top:16px">Follow up with a BMA pricing overview or schedule a demo call.</p>
      `;
      const confirmHtml = `
        <h2>You're unlocked — welcome to the BMA!</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for trying the Core Compliance Hub Spanish Bilingual Medical Assistant. Your full demo access is now active.</p>
        <p>If you'd like to learn more about bringing BMA to your clinic, reply to this email or <a href="https://corecompliancehub.com/bma">visit our BMA page</a>.</p>
        <p>— The CCHUB Team</p>
      `;
      const ADMIN_EMAILS = ["raulv9471@gmail.com", "evillarreal@acsi-quality.com", "team@corecompliancehub.com"];
      await sendEmail(ADMIN_EMAILS, `New BMA Lead: ${fullName}`, adminHtml);
      await sendEmail(email, "Your BMA demo access is unlocked — Core Compliance Hub", confirmHtml);
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("[BMA Leads]", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Watch Demo Lead Capture
  app.post("/api/demo-lead", async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      const adminHtml = `
        <h2>New Watch-Demo Lead</h2>
        <p>A visitor entered their info to unlock the platform demo video.</p>
        <table cellpadding="6" style="border-collapse:collapse;">
          <tr><td><strong>Name</strong></td><td>${name}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Source</strong></td><td>Watch Demo Gate (/watch-demo)</td></tr>
          <tr><td><strong>Date</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        <p style="margin-top:16px">Follow up with a demo call or pricing overview.</p>
      `;
      const confirmHtml = `
        <h2>Your CCHUB demo is ready to watch!</h2>
        <p>Hi ${name},</p>
        <p>Thanks for checking out Core Compliance Hub. Your platform demo is now playing.</p>
        <p>Questions or want a live walkthrough? <a href="https://corecompliancehub.com/contact">Schedule a personalized demo</a> with our team.</p>
        <p>— The CCHUB Team</p>
      `;
      const ADMIN_EMAILS = ["raulv9471@gmail.com", "evillarreal@acsi-quality.com", "team@corecompliancehub.com"];
      await Promise.all([
        sendEmail(ADMIN_EMAILS, `New Demo Lead: ${name}`, adminHtml),
        sendEmail(email, "Your CCHUB demo is unlocked — Core Compliance Hub", confirmHtml),
      ]);
      res.status(201).json({ success: true });
    } catch (err) {
      console.error("[Demo Lead]", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Contact Inquiries (retainer, consultation requests)
  // Security Package Request
  app.post("/api/security/request-package", async (req, res) => {
    try {
      const { firstName, lastName, company, email, phone, title } = req.body;
      if (!firstName || !lastName || !company || !email) {
        return res.status(400).json({ message: "First name, last name, company, and email are required." });
      }
      if (!email.includes("@")) {
        return res.status(400).json({ message: "A valid email address is required." });
      }

      const adminHtml = `
        <h2 style="color:#0f172a;margin:0 0 16px;">New Security Package Request</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Company</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">${company}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Email</td><td style="padding:8px 0;font-weight:600;color:#0f172a;"><a href="mailto:${email}" style="color:#ea6c19;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Phone</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">${phone}</td></tr>` : ""}
          ${title ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Title / Role</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">${title}</td></tr>` : ""}
        </table>
        <p style="margin:20px 0 0;color:#64748b;font-size:13px;">Reply directly to this email to follow up with the requester.</p>
      `;

      const confirmHtml = `
        <h2 style="color:#0f172a;margin:0 0 12px;">We received your request, ${firstName}.</h2>
        <p style="color:#475569;line-height:1.6;">Our team will put together a security overview package and send it to <strong>${email}</strong> within 1 business day.</p>
        <p style="color:#475569;line-height:1.6;">In the meantime, you can review our full security posture at <a href="https://app.corecompliancehub.com/security" style="color:#ea6c19;">app.corecompliancehub.com/security</a>.</p>
        <p style="color:#475569;line-height:1.6;">If you have urgent questions, reply to this email or reach us at <a href="mailto:team@corecompliancehub.com" style="color:#ea6c19;">team@corecompliancehub.com</a>.</p>
      `;

      await sendEmail(
        ["team@corecompliancehub.com"],
        `Security Package Request — ${company}`,
        brandedHtml(`Security Package Request — ${company}`, adminHtml),
      );

      await sendEmail(
        email,
        "Your Core Compliance Hub Security Package Request",
        brandedHtml("Security Package Request Received", confirmHtml),
      );

      logAudit(req, "security_package_request", "security", null, `company:${company}`, 200);
      res.json({ success: true });
    } catch (err) {
      console.error("[Security] Package request error:", err);
      res.status(500).json({ message: "Failed to send request. Please email team@corecompliancehub.com directly." });
    }
  });

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
      
      res.status(201).json(inquiry);

      // Fire-and-forget contact inquiry emails
      try {
        const adminHtml = buildContactInquiryAdminEmail({
          name,
          email,
          company: company || "",
          phone: phone || "",
          employeeCount: employeeCount || "",
          inquiryType,
          message,
        });
        const adminSubject = `[NEW INQUIRY] ${inquiryType} — ${company || "N/A"} — ${name}`;
        await sendEmail("team@corecompliancehub.com", adminSubject, adminHtml);

        const confirmHtml = buildContactConfirmationEmail({
          name,
          email,
          company: company || "",
          phone: phone || "",
          employeeCount: employeeCount || "",
          inquiryType,
          message,
        });
        await sendEmail(email, "We Received Your Inquiry — Core Compliance Hub", confirmHtml);
      } catch (emailErr) {
        console.error("[EmailService] Contact inquiry email error:", emailErr);
      }
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
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;

    try {
      const [employeeList, incidentList, actionList, auditList] = await Promise.all([
        storage.getEmployees(userId, isSuperadmin),
        storage.getIncidents(userId, isSuperadmin),
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

      const openIncidents = incidentList.filter(i => i.status === 'pending_review' || i.status === 'reviewed');
      res.json({
        employeeCount: employeeList.length,
        isoAuditReadiness: isoReadiness,
        medicalSurveillance: medicalSurveillancePercent,
        drugScreenCleared: clearedDrugTests,
        drugScreenPending: pendingDrugTests,
        pendingActions: actionList.length,
        recordableIncidents6Mo: recordableIncidents,
        totalIncidents6Mo: recentIncidents.length,
        openIncidentsCount: openIncidents.length,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // ─── COREY BRIEF (T006) ─────────────────────────────────────────────────────
  app.get("/api/corey-brief", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const [actionItems, incidents, employees] = await Promise.all([
        storage.getPendingActionItems(userId),
        storage.getIncidents(userId, isSuperadmin),
        storage.getEmployees(userId, isSuperadmin),
      ]);

      const now = new Date();
      const bullets: Array<{ icon: string; text: string; priority: "urgent" | "high" | "medium" }> = [];

      // Overdue/urgent action items
      const urgent = actionItems.filter(a => a.priority === 'urgent');
      const overdueItems = actionItems.filter(a => a.dueDate && new Date(a.dueDate) < now);
      if (urgent.length > 0) {
        bullets.push({ icon: "🚨", text: `${urgent.length} urgent action${urgent.length > 1 ? 's' : ''} require${urgent.length === 1 ? 's' : ''} your attention today`, priority: "urgent" });
      }
      if (overdueItems.length > 0 && overdueItems.length !== urgent.length) {
        bullets.push({ icon: "⏰", text: `${overdueItems.length} overdue item${overdueItems.length > 1 ? 's' : ''} past due date`, priority: "high" });
      }

      // Pending incidents
      const pendingIncidents = incidents.filter(i => i.status === 'pending_review');
      if (pendingIncidents.length > 0) {
        bullets.push({ icon: "📋", text: `${pendingIncidents.length} incident${pendingIncidents.length > 1 ? 's' : ''} pending review`, priority: "high" });
      }

      // DOT physicals expiring
      try {
        const { dotNotificationService } = await import('./dotNotificationService');
        const expiring = await dotNotificationService.checkExpiringDotPhysicals(userId);
        const soonExpiring = expiring.filter(e => e.daysUntilExpiry <= 30);
        if (soonExpiring.length > 0) {
          bullets.push({ icon: "🚗", text: `${soonExpiring.length} DOT physical${soonExpiring.length > 1 ? 's' : ''} expiring within 30 days`, priority: soonExpiring.some(e => e.daysUntilExpiry <= 7) ? "urgent" : "high" });
        }
      } catch {}

      // OSHA calendar reminders
      const month = now.getMonth() + 1;
      const day = now.getDate();
      if (month === 1 || (month === 12 && day >= 15)) {
        bullets.push({ icon: "📅", text: "OSHA 300A must be posted by February 1 — run your year-end log review", priority: "high" });
      } else if (month === 2 && day <= 7) {
        bullets.push({ icon: "📅", text: "OSHA 300A posting required now through April 30 — confirm it's posted", priority: "high" });
      } else if (month === 3 && day >= 1 && day <= 10) {
        bullets.push({ icon: "📅", text: "OSHA electronic submission (ITA) due March 2 — have you submitted?", priority: "medium" });
      }

      // Drug screen pending
      const pendingDrug = employees.filter(e => e.drugTestResult === 'pending' || e.drugTestResult === 'scheduled').length;
      if (pendingDrug > 0) {
        bullets.push({ icon: "🧪", text: `${pendingDrug} pending drug screen${pendingDrug > 1 ? 's' : ''} awaiting results`, priority: "medium" });
      }

      // All clear
      if (bullets.length === 0) {
        bullets.push({ icon: "✅", text: "No urgent items today — compliance is on track", priority: "medium" });
        bullets.push({ icon: "📊", text: `${employees.length} employee${employees.length !== 1 ? 's' : ''} tracked · ${incidents.filter(i => i.isRecordable).length} recordable incident${incidents.filter(i => i.isRecordable).length !== 1 ? 's' : ''} YTD`, priority: "medium" });
      }

      res.json({ bullets: bullets.slice(0, 4), generatedAt: now.toISOString() });
    } catch (error: any) {
      console.error('Corey brief error:', error);
      res.status(500).json({ message: "Failed to generate brief" });
    }
  });

  // ─── INCIDENT COREY ANALYSIS (T007) ─────────────────────────────────────────
  app.post("/api/incidents/:id/corey-analysis", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    try {
      const incident = await storage.getIncident(id, userId);
      if (!incident) return res.status(404).json({ message: "Incident not found" });

      const anthropic = createAnthropicClient();

      const prompt = `You are Corey, a Senior Occupational Health, Safety & Compliance Expert. An incident has just been logged. Analyze it and provide:

1. **OSHA Recordability Determination** — Based on the details below, is this incident OSHA recordable under 29 CFR 1904? State YES or NO with the specific reason.
2. **Immediate Actions Required** — What must the employer do right now (within 24 hours)?
3. **CAPA Recommendations** — Suggest 2-3 specific corrective actions to prevent recurrence.
4. **CFR Reference** — Cite the specific 29 CFR standards that apply.

INCIDENT DETAILS:
- Type: ${incident.incidentType}
- Employee: ${incident.employeeName} (${incident.jobTitle || 'N/A'})
- Date: ${incident.incidentDate}
- Location: ${incident.location || 'N/A'}, Department: ${incident.department || 'N/A'}
- Description: ${incident.description}
- Body Part: ${incident.bodyPart || 'N/A'}
- Nature of Injury: ${incident.natureOfInjury || 'N/A'}
- Source: ${incident.objectOrSubstance || 'N/A'}
- Days Away: ${incident.daysAway || 0}, Days Restricted: ${incident.daysRestricted || 0}
- Currently marked as: ${incident.isRecordable ? 'RECORDABLE' : 'NOT RECORDABLE'}

Be concise and direct. Use regulatory citations.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Incident analysis error:', error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to analyze" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to analyze incident" });
      }
    }
  });

  // ─── CAPA ROOT CAUSE ANALYSIS — STRUCTURED COREY GENERATION ─────────────────
  app.post("/api/incidents/:id/capa-rca", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    try {
      const incident = await storage.getIncident(id, userId);
      if (!incident) return res.status(404).json({ message: "Incident not found" });

      const anthropic = createAnthropicClient();

      const prompt = `You are Corey, a Senior Occupational Health, Safety & Compliance Expert with 30 years of experience conducting incident root cause analyses. You are generating a structured CAPA (Corrective Action Plan) for a workplace incident.

INCIDENT DETAILS:
- Type: ${incident.incidentType}
- Employee: ${incident.employeeName || "N/A"} — Job Title: ${incident.jobTitle || "N/A"}, Department: ${incident.department || "N/A"}
- Date: ${new Date(incident.incidentDate).toLocaleDateString()}
- Location: ${incident.location || "N/A"}
- Description: ${incident.description}
- Body Part Injured: ${incident.bodyPart || "N/A"} (${incident.bodySide || ""})
- Nature of Injury: ${incident.natureOfInjury || "N/A"}
- Source / Object / Substance: ${incident.objectOrSubstance || "N/A"}
- Days Away from Work: ${incident.daysAway || 0}
- Days Restricted: ${incident.daysRestricted || 0}
- Root Cause Category: ${incident.rootCauseCategory || "Not yet assessed"}
- PPE Status at Time of Incident: ${incident.ppeStatus || "Not documented"}
- Task Being Performed: ${incident.taskBeingPerformed || "N/A"}
- Contributing Factors: ${incident.contributingFactor || "N/A"}

Generate a complete, professional CAPA root cause analysis. Return ONLY valid JSON — no markdown, no code fences, no extra text. Use this exact schema:

{
  "problemStatement": "A clear, factual one-paragraph problem statement written in past tense describing exactly what happened, who was injured, how, and what the outcome was.",
  "fiveWhys": [
    "Why 1: [Observable problem / immediate cause]",
    "Why 2: [First underlying cause]",
    "Why 3: [Systemic or procedural cause]",
    "Why 4: [Management system or cultural factor]",
    "Why 5: [Root cause — the deepest systemic failure]"
  ],
  "rootCause": "One concise sentence naming the true root cause derived from the 5 Whys analysis.",
  "immediateActions": "A bulleted list of 3–5 immediate containment actions that should have been or were taken within 24–72 hours of the incident (medical treatment, area isolation, equipment removal, immediate training, etc.).",
  "correctiveActions": "A bulleted list of 4–6 specific, measurable corrective actions with regulatory references where applicable (29 CFR citations) that will fix the identified root cause. Include engineering controls, administrative controls, and PPE hierarchy per NIOSH.",
  "preventiveActions": "A bulleted list of 3–5 preventive actions that address the underlying systemic failure and will prevent recurrence across the broader organization — not just this location or department.",
  "oshaReference": "The specific 29 CFR standard(s) most applicable to this incident type and the corrective actions required.",
  "recordabilityNote": "One sentence stating whether this incident appears OSHA recordable under 29 CFR 1904 and why."
}`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = (response.content[0] as any).text ?? "";
      // Strip any accidental markdown fences
      const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      let parsed: any;
      try {
        parsed = JSON.parse(clean);
      } catch {
        return res.status(500).json({ message: "AI returned invalid JSON — please retry", raw });
      }
      res.json(parsed);
    } catch (error: any) {
      console.error("CAPA RCA error:", error);
      res.status(500).json({ message: "Failed to generate CAPA analysis" });
    }
  });

  // ─── APQP / PROJECT PLANNING ROUTES ─────────────────────────────────────────
  const APQP_DEFAULT_DELIVERABLES: Array<{ phase: number; deliverableName: string; category: string }> = [
    // Phase 1 — Plan & Define Program
    { phase: 1, deliverableName: "Voice of the Customer (VOC / QFD)", category: "Customer Input" },
    { phase: 1, deliverableName: "Business Plan & Marketing Strategy Review", category: "Customer Input" },
    { phase: 1, deliverableName: "Product/Process Benchmark Data", category: "Customer Input" },
    { phase: 1, deliverableName: "Product/Process Assumptions", category: "Customer Input" },
    { phase: 1, deliverableName: "Product Reliability Studies", category: "Design Input" },
    { phase: 1, deliverableName: "Design Goals", category: "Design Input" },
    { phase: 1, deliverableName: "Reliability & Quality Goals", category: "Design Input" },
    { phase: 1, deliverableName: "Preliminary Bill of Material (PBOM)", category: "Design Input" },
    { phase: 1, deliverableName: "Preliminary Process Flow Chart", category: "Design Input" },
    { phase: 1, deliverableName: "Preliminary Listing of Special Product & Process Characteristics", category: "Design Input" },
    { phase: 1, deliverableName: "Product Assurance Plan", category: "Plan" },
    { phase: 1, deliverableName: "Management Support — Phase 1 Sign-Off", category: "Management" },
    // Phase 2 — Product Design & Development
    { phase: 2, deliverableName: "Design Failure Mode & Effects Analysis (DFMEA)", category: "FMEA" },
    { phase: 2, deliverableName: "Manufacturability & Assembly Review", category: "Design" },
    { phase: 2, deliverableName: "Design Verification Plan & Report (DVP&R)", category: "Design" },
    { phase: 2, deliverableName: "Design Reviews", category: "Design" },
    { phase: 2, deliverableName: "Prototype Build — Control Plan", category: "Control Plan" },
    { phase: 2, deliverableName: "Engineering Drawings & Math Data", category: "Design" },
    { phase: 2, deliverableName: "Engineering Specifications", category: "Design" },
    { phase: 2, deliverableName: "Material Specifications", category: "Design" },
    { phase: 2, deliverableName: "Drawing & Specification Changes Log", category: "Design" },
    { phase: 2, deliverableName: "New Equipment / Tooling / Facilities Requirements", category: "Resources" },
    { phase: 2, deliverableName: "Special Product & Process Characteristics", category: "Design" },
    { phase: 2, deliverableName: "Gages / Testing Equipment Requirements", category: "Measurement" },
    { phase: 2, deliverableName: "Team Feasibility Commitment", category: "Management" },
    // Phase 3 — Process Design & Development
    { phase: 3, deliverableName: "Packaging Standards", category: "Process" },
    { phase: 3, deliverableName: "Quality System Review", category: "Process" },
    { phase: 3, deliverableName: "Process Flow Chart (PFC)", category: "Process" },
    { phase: 3, deliverableName: "Floor Plan Layout", category: "Process" },
    { phase: 3, deliverableName: "Characteristics Matrix", category: "Process" },
    { phase: 3, deliverableName: "Process FMEA (PFMEA)", category: "FMEA" },
    { phase: 3, deliverableName: "Pre-Launch Control Plan", category: "Control Plan" },
    { phase: 3, deliverableName: "Process Instructions / Work Instructions", category: "Process" },
    { phase: 3, deliverableName: "Measurement System Analysis Plan (MSA)", category: "Measurement" },
    { phase: 3, deliverableName: "Preliminary Process Capability Study Plan", category: "Measurement" },
    { phase: 3, deliverableName: "Packaging Specifications", category: "Process" },
    { phase: 3, deliverableName: "Management Support — Phase 3 Sign-Off", category: "Management" },
    // Phase 4 — Product & Process Validation
    { phase: 4, deliverableName: "Production Trial Run (PTR)", category: "Validation" },
    { phase: 4, deliverableName: "Measurement System Evaluation (MSA Study)", category: "Measurement" },
    { phase: 4, deliverableName: "Preliminary Process Capability Study (Cpk / Ppk)", category: "Measurement" },
    { phase: 4, deliverableName: "Production Part Approval Process (PPAP)", category: "PPAP" },
    { phase: 4, deliverableName: "Production Validation Testing (PVT)", category: "Validation" },
    { phase: 4, deliverableName: "Packaging Evaluation", category: "Validation" },
    { phase: 4, deliverableName: "Production Control Plan", category: "Control Plan" },
    { phase: 4, deliverableName: "Quality Planning Sign-Off", category: "Management" },
    // Phase 5 — Feedback, Assessment & Corrective Action
    { phase: 5, deliverableName: "Reduced Variation Analysis", category: "Feedback" },
    { phase: 5, deliverableName: "Customer Satisfaction Review", category: "Feedback" },
    { phase: 5, deliverableName: "Delivery & Service Performance", category: "Feedback" },
    { phase: 5, deliverableName: "Warranty / Field Data Review", category: "Feedback" },
    { phase: 5, deliverableName: "Lessons Learned Documentation", category: "Feedback" },
  ];

  const APQP_GATE_TITLES = [
    "Gate 1 — Plan & Define Approval",
    "Gate 2 — Design Freeze / D&D Approval",
    "Gate 3 — Process Freeze / P&D Approval",
    "Gate 4 — PPAP / Launch Readiness",
    "Gate 5 — Lessons Learned Sign-Off",
  ];

  // List all APQP projects
  app.get("/api/apqp-projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const { db } = await import("./db");
      const { apqpProjects } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");
      const rows = isSuperadmin
        ? await db.select().from(apqpProjects).orderBy(desc(apqpProjects.createdAt))
        : await db.select().from(apqpProjects).where(eq(apqpProjects.userId, userId)).orderBy(desc(apqpProjects.createdAt));
      res.json(rows);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // Create APQP project + auto-seed deliverables
  app.post("/api/apqp-projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { db } = await import("./db");
      const { apqpProjects, apqpDeliverables, apqpGateReviews } = await import("@shared/schema");
      const body = { ...req.body, userId };
      const [project] = await db.insert(apqpProjects).values(body).returning();
      // Seed AIAG standard deliverables
      if (APQP_DEFAULT_DELIVERABLES.length) {
        await db.insert(apqpDeliverables).values(
          APQP_DEFAULT_DELIVERABLES.map(d => ({ ...d, apqpProjectId: project.id, userId }))
        );
      }
      // Seed 5 empty gate reviews
      await db.insert(apqpGateReviews).values(
        APQP_GATE_TITLES.map((title, i) => ({ apqpProjectId: project.id, userId, gate: i + 1, gateTitle: title, status: "pending" }))
      );
      res.status(201).json(project);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Get single APQP project
  app.get("/api/apqp-projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const id = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { apqpProjects } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const where = isSuperadmin ? eq(apqpProjects.id, id) : and(eq(apqpProjects.id, id), eq(apqpProjects.userId, userId));
      const [row] = await db.select().from(apqpProjects).where(where);
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // Update APQP project
  app.patch("/api/apqp-projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const id = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { apqpProjects } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const where = isSuperadmin ? eq(apqpProjects.id, id) : and(eq(apqpProjects.id, id), eq(apqpProjects.userId, userId));
      const [row] = await db.update(apqpProjects).set({ ...req.body, updatedAt: new Date() }).where(where).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // Delete APQP project
  app.delete("/api/apqp-projects/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const id = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { apqpProjects, apqpDeliverables, apqpGateReviews } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.delete(apqpDeliverables).where(eq(apqpDeliverables.apqpProjectId, id));
      await db.delete(apqpGateReviews).where(eq(apqpGateReviews.apqpProjectId, id));
      const where = isSuperadmin ? eq(apqpProjects.id, id) : and(eq(apqpProjects.id, id), eq(apqpProjects.userId, userId));
      await db.delete(apqpProjects).where(where);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // Get deliverables for a project
  app.get("/api/apqp-projects/:id/deliverables", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { apqpDeliverables } = await import("@shared/schema");
      const { eq, asc } = await import("drizzle-orm");
      const rows = await db.select().from(apqpDeliverables).where(eq(apqpDeliverables.apqpProjectId, id)).orderBy(asc(apqpDeliverables.id));
      res.json(rows);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // Update a single deliverable
  app.patch("/api/apqp-deliverables/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { apqpDeliverables } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await db.update(apqpDeliverables).set({ ...req.body, updatedAt: new Date() }).where(eq(apqpDeliverables.id, id)).returning();
      res.json(row);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // Get gate reviews for a project
  app.get("/api/apqp-projects/:id/gate-reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { apqpGateReviews } = await import("@shared/schema");
      const { eq, asc } = await import("drizzle-orm");
      const rows = await db.select().from(apqpGateReviews).where(eq(apqpGateReviews.apqpProjectId, id)).orderBy(asc(apqpGateReviews.gate));
      res.json(rows);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // Update a gate review
  app.patch("/api/apqp-gate-reviews/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { apqpGateReviews } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await db.update(apqpGateReviews).set({ ...req.body, updatedAt: new Date() }).where(eq(apqpGateReviews.id, id)).returning();
      res.json(row);
    } catch (e) { res.status(500).json({ message: "Failed" }); }
  });

  // ─── DESIGN & DEVELOPMENT §8.3 ───────────────────────────────────────────────
  app.get("/api/apqp-projects/:id/design-dev", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const projectId = parseInt(req.params.id);
    try {
      const { db } = await import("./db");
      const { designDevPlans } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(designDevPlans).where(eq(designDevPlans.apqpProjectId, projectId));
      res.json(row || null);
    } catch (e) { res.status(500).json({ message: "Failed to load D&D plan" }); }
  });

  app.put("/api/apqp-projects/:id/design-dev", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const projectId = parseInt(req.params.id);
    const userId = (req.user as any).claims?.sub || (req.user as any).id;
    try {
      const { db } = await import("./db");
      const { designDevPlans } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [existing] = await db.select().from(designDevPlans).where(eq(designDevPlans.apqpProjectId, projectId));
      const payload = { ...req.body, apqpProjectId: projectId, userId, updatedAt: new Date() };
      let row;
      if (existing) {
        [row] = await db.update(designDevPlans).set(payload).where(eq(designDevPlans.apqpProjectId, projectId)).returning();
      } else {
        [row] = await db.insert(designDevPlans).values(payload).returning();
      }
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ message: "Failed to save D&D plan" }); }
  });

  // ─── EMERGENCY RESPONSE GUIDANCE (T008) ─────────────────────────────────────
  app.post("/api/emergency-guidance", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { situation } = req.body;
    if (!situation) return res.status(400).json({ message: "Situation required" });

    const situationPrompts: Record<string, string> = {
      employee_injury: `An employee has been injured at the workplace. As Corey (Senior EHS Expert), provide an IMMEDIATE response protocol:

1. **First 5 Minutes** — Exact steps to take right now
2. **Medical Response** — When to call 911 vs. send to clinic vs. first aid
3. **Scene Management** — Preserve evidence, secure area, witness statements
4. **Notifications Required** — OSHA reporting (is this a fatality/hospitalization requiring immediate 8-hour notification?), workers' comp, management
5. **Documentation** — What to document and when (29 CFR 1904 forms)
6. **OSHA Regulation** — Cite 29 CFR 1904 and any applicable standards

Be urgent, practical, and cite specific regulations. This person needs to act NOW.`,
      chemical_spill: `A chemical spill has occurred. As Corey (Senior EHS Expert), provide IMMEDIATE response:

1. **First 5 Minutes** — Evacuate? Shelter-in-place? Determine based on spill size/chemical
2. **PPE Required** — Minimum protection for responders
3. **Containment Steps** — How to stop spread without creating more hazard
4. **Emergency Contacts** — CHEMTREC (1-800-424-9300), local fire, EPA reporting thresholds
5. **Regulatory Requirements** — OSHA 29 CFR 1910.120 (HAZWOPER), EPA CERCLA/EPCRA reporting thresholds, state reporting
6. **Post-Incident** — SDS review, incident report, decontamination

Cite 29 CFR 1910.120 and EPA thresholds. Be direct and actionable.`,
      osha_walkin: `An OSHA Compliance Officer has just arrived at the facility. As Corey (Senior EHS Expert), provide IMMEDIATE guidance:

1. **First 5 Minutes** — What to do before they enter (call counsel? notify management?)
2. **Rights & Obligations** — You have the right to accompany the inspector; what you must vs. must not do
3. **Opening Conference** — What they'll ask, what to say and NOT to say
4. **What to Prepare** — OSHA 300 Log, written programs, training records, injury/illness data
5. **Walk-Around Protocol** — Take notes, photograph everything they photograph, bring a witness
6. **Closing Conference** — How to respond to preliminary findings

Cite 29 CFR 1903 (Inspection procedures). This is urgent — the inspector is there NOW.`,
      fire_evacuation: `A fire or evacuation situation. As Corey (Senior EHS Expert), immediate protocol:

1. **Sound the Alarm** — Activate pull station, call 911
2. **Evacuation Routes** — Verify clear, account for everyone (especially mobility-impaired)
3. **Warden Duties** — Sweep rooms, check restrooms, close doors
4. **Assembly Point** — Account for all employees — use headcount vs. roster
5. **Re-entry Protocol** — ONLY when fire department gives all-clear
6. **Post-Incident** — Fire investigation, OSHA reporting if injury, damage assessment
7. **Regulatory Basis** — 29 CFR 1910.38 (Emergency Action Plan), 1910.39 (Fire Prevention Plan)

Cite NFPA 101 and 29 CFR 1910.38. Lives depend on getting this right.`,
      vehicle_accident: `A company vehicle accident has occurred. As Corey (Senior EHS Expert), immediate protocol:

1. **Scene Safety** — Ensure scene is safe before approaching; call 911 if injury
2. **Driver Steps** — What the driver must do at scene (stay, exchange info, photos)
3. **Employer Notifications** — Management, insurance, DOT (if CDL/regulated driver)
4. **Drug & Alcohol Testing** — Post-accident testing requirements under 49 CFR 382 — strict time limits apply
5. **DOT Recordability** — Is this a DOT recordable accident under 49 CFR 390.5?
6. **Documentation** — Police report, photos, witness statements, vehicle damage report
7. **Insurance** — What to say (and not say) to insurers

Critical: Post-accident drug test must occur within 8 hours (alcohol) and 32 hours (drugs) under 49 CFR 382.303. Cite this regulation.`,
    };

    const systemPrompt = situationPrompts[situation];
    if (!systemPrompt) return res.status(400).json({ message: "Unknown situation type" });

    try {
      const anthropic = createAnthropicClient();

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 1200,
        messages: [{ role: "user", content: systemPrompt }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Emergency guidance error:', error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to generate guidance" });
      }
    }
  });

  // ─── COMPLIANCE CALENDAR TRIGGERS (T011) ────────────────────────────────────
  app.get("/api/compliance-calendar", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const reminders: Array<{ id: string; title: string; description: string; dueDate: string; urgency: string; cfr: string }> = [];

    // OSHA 300A posting (Feb 1 - Apr 30)
    if (month === 1 && day >= 15) {
      reminders.push({ id: "osha-300a-prep", title: "OSHA 300A — Prepare for February Posting", description: "The OSHA 300A Annual Summary must be posted by February 1. Review your 300 Log now, calculate your TRIR and DART rates, get a certifying official to sign.", dueDate: `${now.getFullYear()}-02-01`, urgency: "high", cfr: "29 CFR 1904.32" });
    }
    if (month === 2 && day <= 7) {
      reminders.push({ id: "osha-300a-post", title: "OSHA 300A — Must Be Posted NOW", description: "Post the OSHA 300A Annual Summary in a visible workplace location through April 30. Ensure it is signed by a company executive.", dueDate: `${now.getFullYear()}-02-01`, urgency: "urgent", cfr: "29 CFR 1904.32" });
    }
    if (month >= 2 && month <= 4) {
      reminders.push({ id: "osha-300a-active", title: "OSHA 300A Posting Period Active", description: "300A must remain posted February 1 through April 30. Do not remove it early.", dueDate: `${now.getFullYear()}-04-30`, urgency: "medium", cfr: "29 CFR 1904.32" });
    }
    if (month === 3 && day <= 5) {
      reminders.push({ id: "osha-ita", title: "OSHA Electronic Submission (ITA) Due March 2", description: "Establishments with 250+ employees (or 20-249 in high-hazard industries) must submit 300A data electronically via OSHA's Injury Tracking Application.", dueDate: `${now.getFullYear()}-03-02`, urgency: month === 3 && day > 2 ? "urgent" : "high", cfr: "29 CFR 1904.41" });
    }
    if (month === 12 && day >= 1) {
      reminders.push({ id: "year-end-audit", title: "Year-End OSHA 300 Log Audit", description: "Before December 31, conduct a final review of your OSHA 300 Log. Verify all recordable cases are entered, days columns are accurate, and privacy cases are handled correctly.", dueDate: `${now.getFullYear()}-12-31`, urgency: "medium", cfr: "29 CFR 1904.29" });
    }

    res.json({ reminders, generatedAt: now.toISOString() });
  });

  // Get employees
  app.get("/api/employees", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const employeeList = await storage.getEmployees(userId, isSuperadmin);
    res.json(employeeList);
  });

  // Get single employee
  app.get("/api/employees/:id", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid employee ID" });
    const employee = await storage.getEmployeeById(id, userId, isSuperadmin);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
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
      logAudit(req, "create_employee", "employees", employee.id, null, 201);
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
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const validated = insertEmployeeSchema.omit({ userId: true }).partial().parse(req.body);
      const updated = await storage.updateEmployee(id, userId, validated, isSuperadmin);
      if (!updated) {
        return res.status(404).json({ message: "Employee not found or access denied" });
      }
      logAudit(req, "update_employee", "employees", id, null, 200);
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
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const existing = await storage.getEmployeeById(id, userId, isSuperadmin);
      if (!existing) {
        return res.status(404).json({ message: "Employee not found or access denied" });
      }
      await storage.deleteEmployee(id, userId, isSuperadmin);
      logAudit(req, "delete_employee", "employees", id, null, 200);
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
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const incidentList = await storage.getIncidents(userId, isSuperadmin);
    res.json(incidentList);
  });

  // Get incidents for chart (last 6 months)
  app.get("/api/incidents/chart", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const incidentList = await storage.getIncidentsByDateRange(userId, startDate, endDate, isSuperadmin);
    
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
      // Sanitize integer fields — form sends empty strings; Zod expects number | null
      const toIntOrNull = (val: any) => {
        if (val === '' || val === null || val === undefined) return null;
        const n = Number(val);
        return isNaN(n) ? null : n;
      };

      const validated = insertIncidentSchema.omit({ userId: true }).parse({
        ...req.body,
        incidentDate: new Date(req.body.incidentDate),
        employeeDependents: toIntOrNull(req.body.employeeDependents),
        weeksWorked: toIntOrNull(req.body.weeksWorked),
        daysAway: toIntOrNull(req.body.daysAway) ?? 0,
        daysRestricted: toIntOrNull(req.body.daysRestricted) ?? 0,
        daysJobTransfer: toIntOrNull(req.body.daysJobTransfer) ?? 0,
      });
      const incident = await storage.createIncident({
        ...validated,
        userId,
      });
      logAudit(req, "create_incident", "incidents", incident.id, null, 201);
      res.status(201).json(incident);

      // Fire-and-forget incident notification email
      try {
        const profile = await storage.getCompanyProfile(userId);
        const recipients: string[] = [...CCHUB_ADMIN_EMAILS];
        if (profile?.derEmail) recipients.push(profile.derEmail);
        if (profile?.workersCompEmail) recipients.push(profile.workersCompEmail);

        // Auto-notify the department supervisor if one exists
        try {
          const adminTeam = await storage.getTeamByAdmin(userId);
          let teamForUser = adminTeam;
          if (!teamForUser) {
            const membership = await storage.getTeamMembership(userId);
            teamForUser = (membership as any)?.team ?? null;
          }
          if (teamForUser && incident.department) {
            const depts = await storage.getTeamDepartments(teamForUser.id);
            const dept = depts.find((d: any) => d.name.toLowerCase() === (incident.department || "").toLowerCase());
            if (dept?.supervisorMemberId) {
              const members = await storage.getTeamMembers(teamForUser.id);
              const supervisor = members.find((m: any) => m.id === dept.supervisorMemberId);
              if (supervisor?.email && !recipients.includes(supervisor.email)) {
                recipients.push(supervisor.email);
              }
            }
          }
        } catch (_supErr) {
          // supervisor lookup is best-effort, don't block the notification
        }

        const html = buildIncidentNotificationEmail({
          companyName: profile?.companyName || "Your Company",
          employeeName: (incident as any).employeeName || "Unknown Employee",
          incidentDate: incident.incidentDate ? new Date(incident.incidentDate).toLocaleDateString() : "N/A",
          incidentType: incident.incidentType || "N/A",
          location: (incident as any).facility || (incident as any).location || "N/A",
          description: incident.description || "",
          isRecordable: (incident as any).oshaRecordable ?? null,
        });

        const employeeName = (incident as any).employeeName || "Employee";
        const incidentDateStr = incident.incidentDate ? new Date(incident.incidentDate).toLocaleDateString() : "N/A";
        await sendEmail(
          recipients,
          `[ACTION REQUIRED] Workplace Incident Reported — ${employeeName} — ${incidentDateStr}`,
          html
        );
      } catch (emailErr) {
        console.error("[EmailService] Incident notification error:", emailErr);
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid incident data", errors: error.errors });
      }
      console.error('Error creating incident:', error);
      res.status(500).json({ message: "Failed to create incident" });
    }
  });

  // Update incident
  app.patch("/api/incidents/:id", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid incident ID" });
    try {
      const updates: Record<string, any> = {};
      const allowed = [
        // OSHA 300 core
        'description', 'incidentType', 'employeeName', 'jobTitle', 'department',
        'location', 'facility', 'bodyPart', 'bodySide', 'natureOfInjury', 'objectOrSubstance',
        'isRecordable', 'resultedInDeath', 'daysAway', 'daysRestricted',
        'daysJobTransfer', 'isOtherRecordable', 'status', 'incidentDate',
        // FROI — Employee
        'employeeSsnLast4', 'employeeDob', 'employeeSex', 'employeePhone',
        'employeeAddress', 'employeeHireDate', 'employeeDependents', 'employeeTaxStatus',
        // FROI — Wage
        'grossWeeklyWage', 'weeksWorked', 'fringeBenefitsValue',
        'isVolunteer', 'isVocationallyHandicapped',
        // FROI — Employer / Insurance
        'fein', 'uiNumber', 'sicNaicsCode', 'insuranceCompany',
        'insurancePhone', 'policyNumber', 'tpaName',
        // FROI — Timing & Location
        'timeWorkBegan', 'timeOfEvent', 'injuryCity', 'injuryState', 'injuryCounty',
        'onEmployerPremises', 'whatEmployeeWasDoing', 'howInjuryOccurred',
        // FROI — Medical
        'physicianName', 'treatmentFacility', 'treatedInEr',
        'hospitalizedOvernight', 'treatmentAddress',
        // FROI — Dates
        'lastDayWorked', 'firstDayMissed', 'returnToWorkDate', 'deathDate', 'dateEmployerNotified',
        // Enhanced Analytics Fields
        'shiftTime', 'taskBeingPerformed', 'rootCauseCategory', 'ppeStatus',
        'contributingFactor', 'employeeTenure', 'employmentType',
        'medicalTreatmentType', 'drugTestAdministered',
      ];
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (updates.incidentDate) updates.incidentDate = new Date(updates.incidentDate);
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const updated = await storage.updateIncident(id, userId, updates, isSuperadmin);
      if (!updated) return res.status(404).json({ message: "Incident not found" });
      res.json(updated);
    } catch (error) {
      console.error('Error updating incident:', error);
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  // Notify work comp adjuster for a specific incident (on-demand)
  app.post("/api/incidents/:id/notify-adjuster", async (req, res) => {
    if (!(await requirePlatformAccess(req, res))) return;
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid incident ID" });
    try {
      const incident = await storage.getIncident(id, userId);
      if (!incident) return res.status(404).json({ message: "Incident not found" });
      const profile = await storage.getCompanyProfile(userId);
      if (!profile?.workersCompEmail) {
        return res.status(422).json({ message: "No workers' comp adjuster email configured. Please add it in Company Profile → Insurance & Workers' Comp." });
      }
      const incidentDateStr = incident.incidentDate ? new Date(incident.incidentDate).toLocaleDateString() : "N/A";
      const employeeName = (incident as any).employeeName || "Employee";
      const html = buildFROIAdjusterEmail({
        companyName: profile.companyName || "Your Company",
        inc: incident as Record<string, any>,
        incidentDate: incidentDateStr,
      });
      await sendEmail(
        [profile.workersCompEmail],
        `[FROI] Workers' Comp First Report of Injury — ${employeeName} — ${incidentDateStr}`,
        html
      );
      res.json({ message: `Notification sent to ${profile.workersCompEmail}` });
    } catch (error) {
      console.error("[notify-adjuster] Error:", error);
      res.status(500).json({ message: "Failed to send notification email" });
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

  // CAPA Overdue Check — send overdue notifications (max once per 24h per CAPA)
  app.get("/api/capa/check-overdue", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    try {
      const overdueCAPAs = await storage.getOverdueCorrectiveActions(userId);
      if (overdueCAPAs.length === 0) return res.json({ notified: 0 });

      const profile = await storage.getCompanyProfile(userId);
      let notified = 0;

      for (const capa of overdueCAPAs) {
        const targetDateStr = capa.targetDate ? new Date(capa.targetDate).toLocaleDateString() : "N/A";
        const daysOverdue = capa.targetDate
          ? Math.floor((Date.now() - new Date(capa.targetDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const html = buildCapaOverdueEmail({
          capaTitle: capa.title,
          targetDate: targetDateStr,
          daysOverdue,
          responsiblePerson: capa.responsiblePerson || "Assigned Person",
          problemStatement: capa.problemStatement,
          status: capa.status,
        });
        const subject = `[OVERDUE] CAPA Past Due — ${capa.title} — Was Due ${targetDateStr}`;
        const recipients: string[] = [];
        if ((capa as any).responsibleEmail) recipients.push((capa as any).responsibleEmail);
        if (profile?.derEmail) recipients.push(profile.derEmail);

        if (recipients.length > 0) {
          await sendEmail(recipients, subject, html);
        }
        await storage.markCapaOverdueNotified(capa.id);
        notified++;
      }

      res.json({ notified });
    } catch (err) {
      console.error("[EmailService] Overdue CAPA check error:", err);
      res.status(500).json({ message: "Failed to check overdue CAPAs" });
    }
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
        containmentDate: req.body.containmentDate ? new Date(req.body.containmentDate) : null,
        caActionDueDate: req.body.caActionDueDate ? new Date(req.body.caActionDueDate) : null,
        caCompletionDate: req.body.caCompletionDate ? new Date(req.body.caCompletionDate) : null,
        paActionDueDate: req.body.paActionDueDate ? new Date(req.body.paActionDueDate) : null,
        paCompletionDate: req.body.paCompletionDate ? new Date(req.body.paCompletionDate) : null,
        implementationVerifiedDate: req.body.implementationVerifiedDate ? new Date(req.body.implementationVerifiedDate) : null,
      });
      const action = await storage.createCorrectiveAction({
        ...validated,
        userId,
      });
      res.status(201).json(action);

      // Fire-and-forget CAPA assignment email
      try {
        const profile = await storage.getCompanyProfile(userId);
        const targetDateStr = validated.targetDate ? new Date(validated.targetDate).toLocaleDateString() : "Not set";
        const html = buildCapaAssignmentEmail({
          capaTitle: validated.title,
          problemStatement: validated.problemStatement,
          responsiblePerson: validated.responsiblePerson || "Assigned",
          targetDate: targetDateStr,
          priority: validated.priority || "medium",
          immediateActions: validated.immediateActions || "",
          correctiveActions: validated.correctiveActions || "",
        });
        const subject = `[CAPA ASSIGNED] ${validated.title} — Due ${targetDateStr}`;
        const assigneeEmail = (validated as any).responsibleEmail;
        const emailRecipients: string[] = [];
        if (assigneeEmail) emailRecipients.push(assigneeEmail);
        if (profile?.derEmail && profile.derEmail !== assigneeEmail) emailRecipients.push(profile.derEmail);
        if (emailRecipients.length > 0) {
          await sendEmail(emailRecipients, subject, html);
        }
      } catch (emailErr) {
        console.error("[EmailService] CAPA assignment email error:", emailErr);
      }
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
      if (updates.containmentDate) updates.containmentDate = new Date(updates.containmentDate);
      if (updates.caActionDueDate) updates.caActionDueDate = new Date(updates.caActionDueDate);
      if (updates.caCompletionDate) updates.caCompletionDate = new Date(updates.caCompletionDate);
      if (updates.paActionDueDate) updates.paActionDueDate = new Date(updates.paActionDueDate);
      if (updates.paCompletionDate) updates.paCompletionDate = new Date(updates.paCompletionDate);
      if (updates.implementationVerifiedDate) updates.implementationVerifiedDate = new Date(updates.implementationVerifiedDate);
      if (updates.docUpdateVerifiedDate) updates.docUpdateVerifiedDate = new Date(updates.docUpdateVerifiedDate);
      
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
        'cch_unlimited_safety': 149,
        'corey_pro': 149,
        'employer_platform': 499,
        'employer_platform_with_corey': 549,
        'acsi_iso_essentials': 49,
        'acsi_iso_professional': 149,
        'integrated_enterprise': 499,
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
        'cch_unlimited_safety': 149,
        'corey_pro': 149,
        'employer_platform': 499,
        'employer_platform_with_corey': 549,
        'acsi_iso_essentials': 49,
        'acsi_iso_professional': 149,
        'integrated_enterprise': 499,
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

  // Paddle payment audit log
  app.get("/api/superadmin/paddle-events", requireSuperadmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) ?? "200", 10), 500);
      const events = await storage.getPaddleEvents(limit);
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching Paddle events:", error);
      res.status(500).json({ message: "Failed to fetch Paddle audit log" });
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
      const headers = ['ID', 'Name', 'Email', 'Source', 'Created At'];
      const rows = allLeads.map(lead => [
        lead.id,
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.source || '').replace(/"/g, '""')}"`,
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

  // Toggle isoOnly for current user (superadmin only — lets them switch between ISO-only and full platform view)
  app.patch("/api/user/iso-only", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims?.sub || (req.user as any).id;
    const isSuperadmin = await storage.isSuperadmin(userId);
    if (!isSuperadmin) return res.status(403).json({ message: "Superadmin only" });
    const { isoOnly } = req.body;
    if (typeof isoOnly !== "boolean") return res.status(400).json({ message: "isoOnly must be a boolean" });
    const updated = await storage.setIsoOnly(userId, isoOnly);
    res.json(updated);
  });

  // Set ISO role for a user (superadmin only)
  app.patch("/api/superadmin/users/:userId/iso-role", requireSuperadmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isoRole } = req.body;
      const validRoles = ['librarian', 'trainer', 'auditor', null];
      if (!validRoles.includes(isoRole)) {
        return res.status(400).json({ message: "Invalid isoRole. Must be 'librarian', 'trainer', 'auditor', or null." });
      }
      const updated = await storage.setIsoRole(userId, isoRole);
      res.json({ success: true, user: updated });
    } catch (error: any) {
      console.error('Error updating isoRole:', error);
      res.status(500).json({ message: "Failed to update ISO role" });
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
      const { employeeId, walkInName, visitType, authorizationName, authorizationTitle, authorizationPhone,
        billingPreference, specialInstructions, additionalServices, ssnLast4, employeeDob,
        employeeAddress, employeeLocation, staffingAgency, signatureDataUrl } = req.body;

      // Must have either a registered employee ID or a walk-in name
      if (!visitType) {
        return res.status(400).json({ message: "Visit type is required" });
      }
      if (!employeeId && !walkInName) {
        return res.status(400).json({ message: "Either select a registered employee or enter a walk-in name" });
      }

      if (ssnLast4 && (!/^\d{4}$/.test(ssnLast4))) {
        return res.status(400).json({ message: "SSN last 4 must be exactly 4 digits" });
      }

      if (signatureDataUrl && signatureDataUrl.length > 500000) {
        return res.status(400).json({ message: "Signature image too large" });
      }

      // Resolve employee — either from DB or walk-in
      let employee: { id: number | null; firstName: string; lastName: string; position: string | null; department: string | null; email?: string | null } | null = null;
      if (employeeId) {
        const dbEmployee = await storage.getEmployeeById(parseInt(employeeId), userId);
        if (!dbEmployee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        employee = { id: dbEmployee.id, firstName: dbEmployee.firstName, lastName: dbEmployee.lastName, position: dbEmployee.position || null, department: dbEmployee.department || null, email: (dbEmployee as any).email || null };
      } else {
        // Walk-in: split the name into first/last
        const parts = (walkInName as string).trim().split(/\s+/);
        const firstName = parts[0] || walkInName;
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
        employee = { id: null, firstName, lastName, position: null, department: null, email: null };
      }

      const { nanoid } = await import("nanoid");
      const passportToken = nanoid(16);

      const visit = await storage.createClinicVisit({
        employeeId: employee.id as any,
        walkInName: employee.id ? null : (walkInName as string),
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

      // Resolve employee — registered or walk-in
      let employee: { id: number | null; firstName: string; lastName: string; position: string | null; department: string | null; email?: string | null } | null = null;
      if (visit.walkInName) {
        const parts = visit.walkInName.trim().split(/\s+/);
        employee = { id: null, firstName: parts[0] || visit.walkInName, lastName: parts.slice(1).join(" ") || "", position: null, department: null, email: null };
      } else if (visit.employeeId) {
        const dbEmp = await storage.getEmployeeByIdPublic(visit.employeeId);
        if (!dbEmp) {
          return res.status(404).json({ message: "Employee not found" });
        }
        employee = { id: dbEmp.id, firstName: dbEmp.firstName, lastName: dbEmp.lastName, position: dbEmp.position || null, department: dbEmp.department || null, email: (dbEmp as any).email || null };
      } else {
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
          if (visit.walkInName) {
            return { ...visit, employeeName: visit.walkInName };
          }
          const employee = visit.employeeId ? await storage.getEmployeeByIdPublic(visit.employeeId) : null;
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

      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const employeeList = await storage.getEmployees(userId, isSuperadmin);
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
    // Calibration certificates are sensitive documents — serve only through the authenticated API
    if (req.path.startsWith("/certificates/")) {
      return res.status(403).json({ message: "Access denied. Use /api/calibration/records/:id/certificate." });
    }
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
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }
      const trimmed = text.slice(0, 1500).trim();

      // Split text into chunks ≤ 200 chars at sentence boundaries for Google TTS
      function splitIntoChunks(str: string, maxLen = 200): string[] {
        const chunks: string[] = [];
        let remaining = str;
        while (remaining.length > 0) {
          if (remaining.length <= maxLen) {
            chunks.push(remaining);
            break;
          }
          let cut = remaining.lastIndexOf('. ', maxLen);
          if (cut <= 0) cut = remaining.lastIndexOf(' ', maxLen);
          if (cut <= 0) cut = maxLen;
          else cut = cut + 1;
          chunks.push(remaining.slice(0, cut).trim());
          remaining = remaining.slice(cut).trim();
        }
        return chunks.filter(c => c.length > 0);
      }

      const chunks = splitIntoChunks(trimmed);
      const buffers: Buffer[] = [];

      for (const chunk of chunks) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en-US&client=tw-ob&ttsspeed=0.9`;
        const gResp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://translate.google.com/",
            "Accept": "*/*",
          },
        });
        if (!gResp.ok) throw new Error(`Google TTS ${gResp.status}`);
        const buf = Buffer.from(await gResp.arrayBuffer());
        buffers.push(buf);
      }

      const audioBuffer = buffers.length === 1 ? buffers[0] : Buffer.concat(buffers);
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      });
      res.send(audioBuffer);
    } catch (error: any) {
      console.error("TTS primary error, falling back to gpt-audio:", error.message || error);
      // Fallback: gpt-audio via Replit proxy
      try {
        const { text } = req.body;
        const trimmed = (text || "").slice(0, 1500).trim();
        const audioB64 = await textToSpeech(trimmed, "onyx");
        const audioBuffer = Buffer.from(audioB64, "base64");
        res.set({
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.length.toString(),
          "Cache-Control": "public, max-age=3600",
        });
        res.send(audioBuffer);
      } catch (fallbackError: any) {
        console.error("TTS fallback error:", fallbackError);
        res.status(500).json({ message: "Failed to generate speech" });
      }
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
      return res.json({ team: adminTeam, members, role: "admin", isAdmin: true });
    }

    const membership = await storage.getTeamMembership(userId);
    if (membership) {
      const members = await storage.getTeamMembers(membership.team.id);
      return res.json({ team: membership.team, members, role: membership.member.role, isAdmin: false });
    }

    return res.json({ team: null, members: [], role: null, isAdmin: false });
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

  // Team Settings (company name, DER designation)
  app.patch("/api/team/settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const team = await storage.getTeamByAdmin(userId);
    if (!team) return res.status(403).json({ message: "Only team admins can update settings" });

    const { companyName, derMemberId, derName, derEmail, derPhone, derTitle } = req.body;
    const updates: any = {};
    if (companyName && typeof companyName === "string") updates.companyName = companyName.trim();
    if ("derMemberId" in req.body) updates.derMemberId = derMemberId ?? null;
    if ("derName" in req.body) updates.derName = derName ?? null;
    if ("derEmail" in req.body) updates.derEmail = derEmail ?? null;
    if ("derPhone" in req.body) updates.derPhone = derPhone ?? null;
    if ("derTitle" in req.body) updates.derTitle = derTitle ?? null;

    const updated = await storage.updateTeamSettings(team.id, updates);
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

  // ── Team Departments ────────────────────────────────────────────────────
  app.get("/api/team/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const membership = await storage.getTeamMembership(userId);
      const adminTeam = await storage.getTeamByAdmin(userId);
      const team = adminTeam || membership?.team;
      if (!team) return res.status(404).json({ message: "No team found" });
      const depts = await storage.getTeamDepartments(team.id);
      res.json(depts);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.post("/api/team/departments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) return res.status(403).json({ message: "Only team admins can create departments" });
      const { name, description, color, supervisorMemberId, supervisorName } = req.body;
      if (!name?.trim()) return res.status(400).json({ message: "Department name is required" });
      const dept = await storage.createTeamDepartment({ teamId: team.id, name: name.trim(), description, color: color || "blue", supervisorMemberId, supervisorName });
      res.json(dept);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.patch("/api/team/departments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) return res.status(403).json({ message: "Only admins can update departments" });
      const updated = await storage.updateTeamDepartment(parseInt(req.params.id), team.id, req.body);
      if (!updated) return res.status(404).json({ message: "Department not found" });
      res.json(updated);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.delete("/api/team/departments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) return res.status(403).json({ message: "Only admins can delete departments" });
      await storage.deleteTeamDepartment(parseInt(req.params.id), team.id);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // Assign member to department / update job title
  app.patch("/api/team/members/:id/department", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) return res.status(403).json({ message: "Only admins can assign departments" });
      const { departmentId, jobTitle, role } = req.body;
      const updated = await storage.updateTeamMemberDept(parseInt(req.params.id), team.id, departmentId ?? null, jobTitle, role);
      if (!updated) return res.status(404).json({ message: "Member not found" });
      res.json(updated);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Team Announcements ───────────────────────────────────────────────────
  app.get("/api/team/announcements", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const membership = await storage.getTeamMembership(userId);
      const adminTeam = await storage.getTeamByAdmin(userId);
      const team = adminTeam || membership?.team;
      if (!team) return res.status(404).json({ message: "No team found" });
      const anns = await storage.getTeamAnnouncements(team.id);
      res.json(anns);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.post("/api/team/announcements", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const membership = await storage.getTeamMembership(userId);
      const adminTeam = await storage.getTeamByAdmin(userId);
      const team = adminTeam || membership?.team;
      if (!team) return res.status(404).json({ message: "No team found" });
      const isAdmin = !!adminTeam || membership?.member.role === "admin";
      if (!isAdmin) return res.status(403).json({ message: "Only admins can post announcements" });
      const { title, body, category } = req.body;
      if (!title?.trim() || !body?.trim()) return res.status(400).json({ message: "Title and body are required" });
      const user = await storage.getUserById(userId);
      const ann = await storage.createTeamAnnouncement({ teamId: team.id, authorName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.email || "Admin"), authorEmail: user?.email || null, title: title.trim(), body: body.trim(), category: category || "general", isPinned: false });
      res.json(ann);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.patch("/api/team/announcements/:id/pin", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) return res.status(403).json({ message: "Only admins can pin announcements" });
      const updated = await storage.toggleAnnouncementPin(parseInt(req.params.id), team.id);
      if (!updated) return res.status(404).json({ message: "Announcement not found" });
      res.json(updated);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  app.delete("/api/team/announcements/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const team = await storage.getTeamByAdmin(userId);
      if (!team) return res.status(403).json({ message: "Only admins can delete announcements" });
      await storage.deleteTeamAnnouncement(parseInt(req.params.id), team.id);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
  });

  // ── Team Compliance Snapshot ─────────────────────────────────────────────
  app.get("/api/team/compliance", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const membership = await storage.getTeamMembership(userId);
      const adminTeam = await storage.getTeamByAdmin(userId);
      const team = adminTeam || membership?.team;
      if (!team) return res.status(404).json({ message: "No team found" });

      const isAdmin = !!adminTeam;
      const viewerRole = isAdmin ? "admin" : (membership?.member.role ?? "member");

      // Members (non-supervisor, non-admin) don't get compliance data
      if (viewerRole === "member") {
        return res.json({ viewerRole, restricted: true, summary: null, byDepartment: null, recentIncidents: [], overdueCAPAList: [] });
      }

      // Determine which departments the supervisor oversees (by supervisorMemberId)
      const allDepts = await storage.getTeamDepartments(team.id);
      let supervisedDepts: typeof allDepts = [];
      let mergedVisibility = { incidentSummary: true, medicalDetails: false, restrictionDetails: false, capaDetails: true, trainingStatus: true };

      if (!isAdmin) {
        supervisedDepts = allDepts.filter(d => d.supervisorMemberId === membership!.member.id);
        if (supervisedDepts.length === 0) {
          return res.json({ viewerRole, restricted: true, message: "You are not assigned as supervisor of any department.", summary: null, byDepartment: null, recentIncidents: [], overdueCAPAList: [] });
        }
        // Merge visibility: most permissive across all supervised depts
        mergedVisibility = {
          incidentSummary: supervisedDepts.some(d => (d.visibilitySettings as any)?.incidentSummary !== false),
          medicalDetails: supervisedDepts.some(d => (d.visibilitySettings as any)?.medicalDetails === true),
          restrictionDetails: supervisedDepts.some(d => (d.visibilitySettings as any)?.restrictionDetails === true),
          capaDetails: supervisedDepts.some(d => (d.visibilitySettings as any)?.capaDetails !== false),
          trainingStatus: supervisedDepts.some(d => (d.visibilitySettings as any)?.trainingStatus !== false),
        };
      }

      const teamAdminId = team.adminUserId;
      const [allIncidents, allCAPAs] = await Promise.all([
        storage.getIncidents(teamAdminId),
        storage.getCorrectiveActions(teamAdminId),
      ]);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filter by department for supervisors
      const supervisedDeptNames = supervisedDepts.map(d => d.name);
      const incidentsInScope = isAdmin
        ? allIncidents
        : allIncidents.filter(i => supervisedDeptNames.includes(i.department ?? ""));
      const capasInScope = isAdmin
        ? allCAPAs
        : allCAPAs.filter(c => supervisedDeptNames.includes(c.responsibleDepartment ?? ""));

      const recentIncidents = incidentsInScope.filter(i => i.incidentDate && new Date(i.incidentDate) >= thirtyDaysAgo);
      const openCAPAs = capasInScope.filter(c => c.status !== "Completed" && c.status !== "Closed");
      const overdueCAPAs = openCAPAs.filter(c => c.dueDate && new Date(c.dueDate) < now);
      const recordables = incidentsInScope.filter(i => i.isOshaRecordable);

      // Strip HIPAA-protected fields from incident objects for supervisors
      function sanitizeIncident(inc: any) {
        if (isAdmin) return inc;
        const safe: any = {
          id: inc.id,
          incidentDate: inc.incidentDate,
          department: inc.department,
          incidentType: inc.incidentType,
          isOshaRecordable: inc.isOshaRecordable,
          daysAway: inc.daysAway,
          daysRestricted: inc.daysRestricted,
          status: inc.status,
        };
        if (mergedVisibility.medicalDetails) {
          safe.description = inc.description;
          safe.injuryType = inc.injuryType;
          safe.bodyPart = inc.bodyPart;
          safe.treatmentType = inc.treatmentType;
        }
        if (mergedVisibility.restrictionDetails) {
          safe.workRestrictions = inc.workRestrictions;
          safe.returnToWorkDate = inc.returnToWorkDate;
        }
        // Drug test results are ALWAYS stripped for supervisors regardless of settings
        return safe;
      }

      const deptIncidentMap: Record<string, number> = {};
      const deptCAPAMap: Record<string, number> = {};
      recentIncidents.forEach(i => { const d = i.department || "Unassigned"; deptIncidentMap[d] = (deptIncidentMap[d] || 0) + 1; });
      if (mergedVisibility.capaDetails || isAdmin) {
        openCAPAs.forEach(c => { const d = c.responsibleDepartment || "Unassigned"; deptCAPAMap[d] = (deptCAPAMap[d] || 0) + 1; });
      }

      res.json({
        viewerRole,
        restricted: false,
        supervisedDeptNames: isAdmin ? [] : supervisedDeptNames,
        visibilitySettings: isAdmin ? null : mergedVisibility,
        summary: mergedVisibility.incidentSummary || isAdmin ? {
          incidentsLast30Days: recentIncidents.length,
          totalOpenCAPAs: openCAPAs.length,
          overdueCAPAs: overdueCAPAs.length,
          totalRecordables: recordables.length,
          totalIncidents: incidentsInScope.length,
        } : null,
        byDepartment: {
          incidents: (mergedVisibility.incidentSummary || isAdmin) ? deptIncidentMap : {},
          capas: (mergedVisibility.capaDetails || isAdmin) ? deptCAPAMap : {},
        },
        recentIncidents: (mergedVisibility.incidentSummary || isAdmin) ? recentIncidents.slice(0, 5).map(sanitizeIncident) : [],
        overdueCAPAList: (mergedVisibility.capaDetails || isAdmin) ? overdueCAPAs.slice(0, 5) : [],
      });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
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
  app.get("/api/iso-projects/all", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const projects = await storage.getIsoProjects(userId, isSuperadmin);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/iso-projects", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const project = await storage.getIsoProject(userId, isSuperadmin, isoProjectId);
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
      // Check only the user's OWN project (not superadmin fallback) to allow superadmins to create their own project
      const existing = await storage.getIsoProject(userId, false);
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
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const project = await storage.updateIsoProject(userId, req.body, isSuperadmin);
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/iso-projects", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = req.query.id ? parseInt(req.query.id as string) : undefined;
      await storage.deleteIsoProject(userId, isSuperadmin, id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/corey-profile", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const profile = await storage.getCoreyProfile(userId);
      if (!profile) return res.status(404).json({ message: "No profile found" });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/corey-profile", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const profile = await storage.upsertCoreyProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/isa-profile", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const profile = await storage.getIsaProfile(userId);
      if (!profile) return res.status(404).json({ message: "No profile found" });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/isa-profile", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const profile = await storage.upsertIsaProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const docUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF, DOCX, and TXT files are supported"));
      }
    },
  });

  app.post("/api/upload-document", docUpload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const { mimetype, originalname, buffer } = req.file;
      let text = "";

      if (mimetype === "application/pdf") {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        text = data.text;
      } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        text = buffer.toString("utf-8");
      }

      if (text.length > 50000) {
        text = text.substring(0, 50000) + "\n\n[Document truncated at 50,000 characters due to length]";
      }

      res.json({ filename: originalname, text, chars: text.length });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to parse document: " + error.message });
    }
  });

  // ─── NONCONFORMANCES ────────────────────────────────────────────────────────
  app.get("/api/nonconformances", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const ncs = await storage.getNonconformances(userId, isSuperadmin);
      res.json(ncs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/nonconformances", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const parsed = insertNonconformanceSchema.parse({ ...req.body, userId });
      const nc = await storage.createNonconformance(parsed);
      res.status(201).json(nc);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/nonconformances/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const nc = await storage.updateNonconformance(id, userId, req.body, isSuperadmin);
      if (!nc) return res.status(404).json({ message: "Nonconformance not found" });
      res.json(nc);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/nonconformances/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await storage.deleteNonconformance(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── ISO DOCUMENTS ──────────────────────────────────────────────────────────
  app.get("/api/iso-documents", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      
      let docs;
      if (isoProjectId && !isNaN(isoProjectId)) {
        docs = await storage.getIsoDocumentsByProject(userId, isoProjectId, isSuperadmin);
      } else {
        docs = await storage.getIsoDocuments(userId, isSuperadmin);
      }
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/iso-documents", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const parsed = insertIsoDocumentSchema.parse({ ...req.body, userId });
      const doc = await storage.createIsoDocument(parsed);
      res.status(201).json(doc);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/iso-documents/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;

      // ── isaRevision path: version bump + DCR in a single transaction ──────────
      if (req.body.isaRevision === true) {
        const { proposedContent, changeReason, requestedBy } = req.body;
        if (!proposedContent) return res.status(400).json({ message: "proposedContent is required for isaRevision" });

        const { db } = await import("./db");
        const { isoDocuments, docChangeRequests } = await import("@shared/schema");
        const { eq, and, sql } = await import("drizzle-orm");
        const { randomUUID } = await import("crypto");

        const whereClause = isSuperadmin
          ? eq(isoDocuments.id, id)
          : and(eq(isoDocuments.id, id), eq(isoDocuments.userId, userId));
        const [currentDoc] = await db.select().from(isoDocuments).where(whereClause);
        if (!currentDoc) return res.status(404).json({ message: "Document not found" });

        const reason = ((changeReason as string | undefined) ?? "AI-assisted revision by Isa").trim() || "AI-assisted revision by Isa";
        const author = ((requestedBy as string | undefined) ?? "Isa AI").trim() || "Isa AI";

        type VersionEntry = { version: string; content: string; approvedBy?: string; archivedAt: string; changeReason: string };
        const archive: VersionEntry[] = Array.isArray(currentDoc.previousVersions) ? [...(currentDoc.previousVersions as VersionEntry[])] : [];
        archive.push({ version: currentDoc.version ?? "1.0", content: currentDoc.content ?? "", approvedBy: currentDoc.approvedBy ?? undefined, archivedAt: new Date().toISOString(), changeReason: reason });

        const [major, minor] = (currentDoc.version ?? "1.0").split(".").map(Number);
        // Minor-only increment for Isa revisions — major rollover is out of scope here
        const newVersion = `${major ?? 1}.${(minor ?? 0) + 1}`;

        const result = await db.transaction(async (tx) => {
          await tx.execute(sql`
            UPDATE iso_documents SET
              content = ${proposedContent},
              version = ${newVersion},
              status = 'draft',
              previous_versions = ${JSON.stringify(archive)}::jsonb,
              compliance_result = NULL,
              compliance_checked_at = NULL,
              updated_at = NOW()
            WHERE id = ${id}
          `);
          const reviewToken = randomUUID();
          const reviewTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const [dcr] = await tx.insert(docChangeRequests).values({
            documentId: id,
            isoProjectId: currentDoc.isoProjectId ?? null,
            userId,
            requestedBy: author,
            designatedReviewer: currentDoc.designatedReviewer ?? null,
            designatedReviewerEmail: currentDoc.designatedReviewerEmail ?? null,
            changeDescription: `AI-assisted revision — ${reason} (Rev. ${currentDoc.version ?? "1.0"} → ${newVersion})`,
            reason,
            previousContent: currentDoc.content ?? null,
            proposedContent,
            reviewToken,
            reviewTokenExpiresAt,
            affectedDepartments: [],
            proposedEffectiveDate: null,
            status: "pending",
            trainingTriggered: false,
          }).returning();
          const [updatedDoc] = await tx.select().from(isoDocuments).where(eq(isoDocuments.id, id));
          return { document: updatedDoc, dcrId: dcr.id, newVersion };
        });

        return res.json(result);
      }

      // ── Standard update path ───────────────────────────────────────────────────
      const updateData = { ...req.body };
      if (updateData.content !== undefined) {
        updateData.complianceResult = null;
        updateData.complianceCheckedAt = null;
      }
      const doc = await storage.updateIsoDocument(id, userId, updateData, isSuperadmin);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      res.json(doc);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/iso-documents/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      await storage.deleteIsoDocument(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── ISO Compliance Check (Isa) ───────────────────────────────────────────────
  app.post("/api/iso-documents/:id/compliance-check", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const docId = parseInt(req.params.id);
      if (isNaN(docId)) return res.status(400).json({ message: "Invalid ID" });

      const docs = await storage.getIsoDocuments(userId, isSuperadmin);
      const doc = docs.find(d => d.id === docId);
      if (!doc) return res.status(404).json({ message: "Document not found" });
      if (!doc.content?.trim()) return res.status(400).json({ message: "Document has no content to evaluate." });
      if (!doc.isoClause?.trim()) return res.status(400).json({ message: "Document has no ISO clause assigned." });

      const project = await storage.getIsoProject(userId, isSuperadmin);
      const standard = project?.standard ?? "ISO 9001:2015";

      const systemPrompt = `You are Isa, an expert ISO Management Systems auditor. Your task is to evaluate whether a document's content adequately addresses the requirements of a specific ISO clause. You must return a valid JSON object ONLY — no markdown, no prose outside the JSON.

The JSON must match this exact schema:
{
  "verdict": "Compliant" | "Partially Compliant" | "Non-Compliant",
  "summary": "1–2 sentence overall assessment",
  "requirements": [
    {
      "requirement": "Brief requirement label (e.g. 'Scope boundaries defined' or '8.5.1.a — Control of production conditions')",
      "status": "Met" | "Partially Met" | "Not Met",
      "finding": "What is covered or missing in the document for this specific sub-requirement"
    }
  ],
  "recommendations": [
    "Specific, actionable recommendation for each gap found"
  ]
}

CLAUSE SUB-REQUIREMENT REFERENCE (use this to break each clause into its actual sub-requirements):
ISO 9001:2015 common clauses and their sub-requirements:
- 4.1: organizational context factors (internal/external issues); 4.2: interested parties identification + needs; 4.3: scope boundaries + exclusion justification; 4.4.1: process identification + owners + inputs/outputs + resources + monitoring + risks/opportunities + changes; 4.4.2: documented information maintenance
- 5.1.1: leadership commitment evidence; 5.1.2: customer focus evidence; 5.2.1: quality policy establishment criteria; 5.2.2: policy communication/availability; 5.3: roles/responsibilities/authorities assignment
- 6.1: risk identification + opportunity analysis; 6.2.1: SMART quality objectives; 6.2.2: objectives planning (who/what/resources/when/evaluate); 6.3: change planning
- 7.1.1–7.1.6: resources (people, infra, environment, measurement, org knowledge, competence); 7.2: competence requirements; 7.3: awareness content; 7.4: internal/external communications; 7.5.1: documented information required + specified; 7.5.2: creation/update controls; 7.5.3: distribution/access/retrieval/storage controls
- 8.1: operational planning + controls; 8.2.1: customer communication; 8.2.2: requirements review; 8.2.3: changes review; 8.2.4: requirements determination; 8.3: design/development stages + controls (if applicable); 8.4.1: external provider criteria + evaluation; 8.4.2: provider controls; 8.4.3: information to providers; 8.5.1: controlled conditions (a–h); 8.5.2: traceability; 8.5.3: customer/external property; 8.5.4: preservation; 8.5.5: post-delivery; 8.5.6: changes; 8.6: release criteria; 8.7: nonconforming output handling
- 9.1.1: monitoring/measurement planning; 9.1.2: customer satisfaction methods; 9.1.3: analysis methods; 9.2: internal audit program; 9.3.1–9.3.3: management review inputs/outputs
- 10.1: improvement determination; 10.2.1–10.2.2: nonconformity + corrective action process; 10.3: continual improvement
ISO 14001:2015: similar structure mapping EMS (4.1–10.3) — use your training data for sub-requirement mapping.
ISO 45001:2018: similar OH&S structure — use your training data.
IATF 16949:2016: builds on ISO 9001 with APQP, PPAP, MSA, SPC, FMEA, control plan requirements.

Rules:
- Always decompose the clause into its actual sub-requirements, not just the top-level title.
- For each sub-requirement, produce a separate "requirements" entry.
- Be precise — cite what is present vs. what is absent in the document.
- recommendations must be concrete (e.g., "Add clause 8.5.1(d): document the monitoring and measurement requirements for each production step" not just "Improve the content").
- Produce at least 3 requirement entries even for simple clauses.
- Return ONLY the JSON object. No explanation, no markdown code fences.`;

      const userMessage = `Standard: ${standard}
ISO Clause Reference: ${doc.isoClause}
Document Type: ${doc.docType?.replace(/_/g, " ") ?? "Document"}
Document Title: ${doc.title}

--- DOCUMENT CONTENT START ---
${doc.content}
--- DOCUMENT CONTENT END ---

Evaluate whether this document satisfies the requirements of ${doc.isoClause} under ${standard}. Return a JSON compliance verdict.`;

      const anthropicClient = createAnthropicClient();

      const response = await anthropicClient.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      let cleanText = rawText;
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/, "").trim();
      }

      let raw: any;
      try {
        raw = JSON.parse(cleanText);
      } catch {
        return res.status(500).json({ message: "Isa returned an unexpected response. Please try again." });
      }

      const VALID_VERDICTS = ["Compliant", "Partially Compliant", "Non-Compliant"];
      if (!VALID_VERDICTS.includes(raw?.verdict) || !Array.isArray(raw?.requirements)) {
        return res.status(500).json({ message: "Incomplete compliance result returned. Please try again." });
      }

      const result = {
        verdict: raw.verdict as "Compliant" | "Partially Compliant" | "Non-Compliant",
        summary: typeof raw.summary === "string" ? raw.summary : "",
        requirements: (raw.requirements as any[]).map((r: any) => ({
          requirement: typeof r.requirement === "string" ? r.requirement : "",
          status: ["Met", "Partially Met", "Not Met"].includes(r.status) ? r.status : "Not Met",
          finding: typeof r.finding === "string" ? r.finding : "",
        })),
        recommendations: Array.isArray(raw.recommendations)
          ? (raw.recommendations as any[]).filter((r): r is string => typeof r === "string")
          : [],
      };

      const checkedAt = new Date();
      await storage.updateIsoDocument(docId, userId, {
        complianceResult: result,
        complianceCheckedAt: checkedAt,
      }, isSuperadmin);

      res.json({ ...result, checkedAt: checkedAt.toISOString() });
    } catch (error: any) {
      console.error("[compliance-check] Error:", error.message);
      res.status(500).json({ message: error.message ?? "Compliance check failed." });
    }
  });

  // ─── ISO Audits ───────────────────────────────────────────────────────────────
  app.get("/api/iso-audits", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const audits = await storage.getIsoAudits(userId, isSuperadmin);
      res.json(audits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/iso-audits", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const { insertIsoAuditSchema } = await import("@shared/schema");
      const parsed = insertIsoAuditSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const audit = await storage.createIsoAudit(parsed.data);
      res.status(201).json(audit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/iso-audits/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const audit = await storage.updateIsoAudit(id, userId, req.body, isSuperadmin);
      if (!audit) return res.status(404).json({ message: "Not found" });
      res.json(audit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/iso-audits/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIsoAudit(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── ISO Audit Findings ───────────────────────────────────────────────────────
  app.get("/api/iso-audits/:auditId/findings", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const auditId = parseInt(req.params.auditId);
      if (isNaN(auditId)) return res.status(400).json({ message: "Invalid ID" });
      const findings = await storage.getIsoAuditFindings(auditId, userId, isSuperadmin);
      res.json(findings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/iso-audits/:auditId/findings", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const auditId = parseInt(req.params.auditId);
      if (isNaN(auditId)) return res.status(400).json({ message: "Invalid ID" });
      const { insertIsoAuditFindingSchema } = await import("@shared/schema");
      const parsed = insertIsoAuditFindingSchema.safeParse({ ...req.body, userId, auditId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const finding = await storage.createIsoAuditFinding(parsed.data);
      res.status(201).json(finding);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/iso-audit-findings/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const finding = await storage.updateIsoAuditFinding(id, userId, req.body, isSuperadmin);
      if (!finding) return res.status(404).json({ message: "Not found" });
      res.json(finding);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/iso-audit-findings/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const isSuperadmin2 = (req.user as any).claims.isSuperadmin === true;
      await storage.deleteIsoAuditFinding(id, userId, isSuperadmin2);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── ISO Audit Process Notes (process-approach) ────────────────────────────────
  app.get("/api/iso-audits/:auditId/process-notes", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const auditId = parseInt(req.params.auditId);
      if (isNaN(auditId)) return res.status(400).json({ message: "Invalid ID" });
      const notes = await storage.getIsoAuditProcessNotes(auditId, userId, isSuperadmin);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/iso-audits/:auditId/process-notes", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const auditId = parseInt(req.params.auditId);
      if (isNaN(auditId)) return res.status(400).json({ message: "Invalid ID" });
      const { insertIsoAuditProcessNotesSchema } = await import("@shared/schema");
      const parsed = insertIsoAuditProcessNotesSchema.safeParse({ ...req.body, userId, auditId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const note = await storage.upsertIsoAuditProcessNote(parsed.data, userId, isSuperadmin);
      res.json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/iso-audit-process-notes/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIsoAuditProcessNote(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── IATF §9.2.2.3 — Product Audits ─────────────────────────────────────────
  app.get("/api/iatf-product-audits", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      res.json(await storage.getIatfProductAudits(userId, isSuperadmin));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.post("/api/iatf-product-audits", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const { insertIatfProductAuditSchema } = await import("@shared/schema");
      const parsed = insertIatfProductAuditSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      res.status(201).json(await storage.createIatfProductAudit(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.patch("/api/iatf-product-audits/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const rec = await storage.updateIatfProductAudit(id, userId, req.body, isSuperadmin);
      if (!rec) return res.status(404).json({ message: "Not found" });
      res.json(rec);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/iatf-product-audits/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIatfProductAudit(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // ─── IATF §9.2.2.4 — Manufacturing Process Audits ───────────────────────────
  app.get("/api/iatf-mfg-process-audits", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      res.json(await storage.getIatfMfgProcessAudits(userId, isSuperadmin));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.post("/api/iatf-mfg-process-audits", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const { insertIatfMfgProcessAuditSchema } = await import("@shared/schema");
      const parsed = insertIatfMfgProcessAuditSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      res.status(201).json(await storage.createIatfMfgProcessAudit(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.patch("/api/iatf-mfg-process-audits/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const rec = await storage.updateIatfMfgProcessAudit(id, userId, req.body, isSuperadmin);
      if (!rec) return res.status(404).json({ message: "Not found" });
      res.json(rec);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/iatf-mfg-process-audits/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIatfMfgProcessAudit(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // ─── IATF Audit Schedule (§9.2.2.3 & §9.2.2.4) ──────────────────────────────
  app.get("/api/iatf-audit-schedule", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const entries = await storage.getIatfAuditSchedule(userId, isSuperadmin);
      res.json(entries);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/iatf-audit-schedule", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const entry = await storage.createIatfAuditScheduleEntry({ ...req.body, userId });
      res.json(entry);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/iatf-audit-schedule/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const entry = await storage.updateIatfAuditScheduleEntry(id, userId, req.body, isSuperadmin);
      if (!entry) return res.status(404).json({ message: "Not found" });
      res.json(entry);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/iatf-audit-schedule/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIatfAuditScheduleEntry(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // ─── Layered Process Audits (LPA) ────────────────────────────────────────────
  app.get("/api/lpa-plans", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const plans = await storage.getLpaAuditPlans(userId, isSuperadmin);
      res.json(plans);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/lpa-plans", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const plan = await storage.createLpaAuditPlan({ ...req.body, userId });
      res.status(201).json(plan);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/lpa-plans/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { id: _id, userId: _uid, ...data } = req.body;
      const updated = await storage.updateLpaAuditPlan(id, userId, data, isSuperadmin);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/lpa-plans/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteLpaAuditPlan(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.get("/api/lpa-records", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const planId = req.query.planId ? parseInt(req.query.planId as string) : undefined;
      const records = await storage.getLpaRecords(userId, isSuperadmin, planId);
      res.json(records);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/lpa-records", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const record = await storage.createLpaRecord({ ...req.body, userId });
      res.status(201).json(record);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/lpa-records/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { id: _id, userId: _uid, ...data } = req.body;
      const updated = await storage.updateLpaRecord(id, userId, data, isSuperadmin);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/lpa-records/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteLpaRecord(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // ─── Audit Process Schedule (IATF 9.2.2.2) ───────────────────────────────────
  app.get("/api/audit-schedule", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const entries = await storage.getAuditProcessSchedule(userId, isSuperadmin);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/audit-schedule", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const entry = await storage.upsertAuditProcessSchedule(req.body, userId);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/audit-schedule/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const entry = await storage.upsertAuditProcessSchedule({ ...req.body, id }, userId);
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/audit-schedule/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      await storage.deleteAuditProcessSchedule(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── ISO Awareness Notices ────────────────────────────────────────────────────
  app.get("/api/iso-awareness-notices", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const notices = await storage.getIsoAwarenessNotices(userId, isSuperadmin);
      res.json(notices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/iso-awareness-notices", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const { insertIsoAwarenessNoticeSchema } = await import("@shared/schema");
      const parsed = insertIsoAwarenessNoticeSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const notice = await storage.createIsoAwarenessNotice(parsed.data);
      res.status(201).json(notice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/iso-awareness-notices/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const notice = await storage.updateIsoAwarenessNotice(id, userId, req.body, isSuperadmin);
      if (!notice) return res.status(404).json({ message: "Not found" });
      res.json(notice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/iso-awareness-notices/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIsoAwarenessNotice(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── ISO Awareness Acknowledgments ───────────────────────────────────────────
  app.get("/api/iso-awareness-notices/:noticeId/acknowledgments", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const noticeId = parseInt(req.params.noticeId);
      if (isNaN(noticeId)) return res.status(400).json({ message: "Invalid ID" });
      const acks = await storage.getIsoAwarenessAcknowledgments(noticeId);
      res.json(acks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/iso-awareness-notices/:noticeId/acknowledgments", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const noticeId = parseInt(req.params.noticeId);
      if (isNaN(noticeId)) return res.status(400).json({ message: "Invalid ID" });
      const { insertIsoAwarenessAcknowledgmentSchema } = await import("@shared/schema");
      const parsed = insertIsoAwarenessAcknowledgmentSchema.safeParse({ ...req.body, userId, noticeId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const ack = await storage.createIsoAwarenessAcknowledgment(parsed.data);
      res.status(201).json(ack);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── §7.2 Competency Requirements ───────────────────────────────────────────
  app.get("/api/competency-requirements", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      res.json(await storage.getCompetencyRequirements(userId, isSuperadmin));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.post("/api/competency-requirements", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const { insertCompetencyRequirementSchema } = await import("@shared/schema");
      const parsed = insertCompetencyRequirementSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      res.status(201).json(await storage.createCompetencyRequirement(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.patch("/api/competency-requirements/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const rec = await storage.updateCompetencyRequirement(id, userId, req.body, isSuperadmin);
      if (!rec) return res.status(404).json({ message: "Not found" });
      res.json(rec);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/competency-requirements/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteCompetencyRequirement(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // ─── §7.2 Employee Competency Records ────────────────────────────────────────
  app.get("/api/employee-competency-records", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      res.json(await storage.getEmployeeCompetencyRecords(userId, employeeId, isSuperadmin));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.post("/api/employee-competency-records", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const { insertEmployeeCompetencyRecordSchema } = await import("@shared/schema");
      const parsed = insertEmployeeCompetencyRecordSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      res.status(201).json(await storage.createEmployeeCompetencyRecord(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.patch("/api/employee-competency-records/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const rec = await storage.updateEmployeeCompetencyRecord(id, userId, req.body, isSuperadmin);
      if (!rec) return res.status(404).json({ message: "Not found" });
      res.json(rec);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/employee-competency-records/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteEmployeeCompetencyRecord(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // ─── Training Event Log ───────────────────────────────────────────────────────
  app.get("/api/training-event-records", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      res.json(await storage.getTrainingEventRecords(userId, isSuperadmin));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.post("/api/training-event-records", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const { insertTrainingEventRecordSchema } = await import("@shared/schema");
      const parsed = insertTrainingEventRecordSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      res.status(201).json(await storage.createTrainingEventRecord(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.patch("/api/training-event-records/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const rec = await storage.updateTrainingEventRecord(id, userId, req.body, isSuperadmin);
      if (!rec) return res.status(404).json({ message: "Not found" });
      res.json(rec);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/training-event-records/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteTrainingEventRecord(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // ─── Cross-Training / Skills Matrix ──────────────────────────────────────────
  app.get("/api/training-matrix/skills", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const skills = await storage.getTrainingMatrixSkills(userId, isSuperadmin);
      res.json(skills);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/training-matrix/skills", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const skill = await storage.createTrainingMatrixSkill({ ...req.body, userId });
      res.status(201).json(skill);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/training-matrix/skills/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const skill = await storage.updateTrainingMatrixSkill(id, userId, req.body, isSuperadmin);
      if (!skill) return res.status(404).json({ message: "Not found" });
      res.json(skill);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/training-matrix/skills/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteTrainingMatrixSkill(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.get("/api/training-matrix/entries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const entries = await storage.getTrainingMatrixEntries(userId, isSuperadmin);
      res.json(entries);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/training-matrix/entries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const entry = await storage.upsertTrainingMatrixEntry({ ...req.body, userId });
      res.status(201).json(entry);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/training-matrix/entries/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteTrainingMatrixEntry(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/corrective-actions/:id/notify-sms", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

      const capa = await storage.getCorrectiveActionById(id, userId);
      if (!capa) return res.status(404).json({ message: "Corrective Action not found" });

      if (!capa.responsiblePhone) {
        return res.status(400).json({ message: "No responsible phone number set for this CAPA" });
      }

      const { sendSMS, isTwilioConfigured } = await import('./twilioService');
      const configured = await isTwilioConfigured();
      if (!configured) {
        return res.status(503).json({ message: "SMS service not configured" });
      }

      const dueDateStr = capa.targetDate ? new Date(capa.targetDate).toLocaleDateString() : 'no date set';
      const message = `CCHUB ALERT: You have been assigned as the responsible person for Corrective Action "${capa.title}". Target Completion Date: ${dueDateStr}. Please review in the platform.`;

      const result = await sendSMS(capa.responsiblePhone, message);
      if (result.success) {
        res.json({ message: "SMS notification sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send SMS: " + result.error });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── DOT COMPLIANCE HUB ROUTES ────────────────────────────────────────────

  // Normalizers: convert date strings → Date objects + map frontend field names to schema names
  // Strict parser: only accepts YYYY-MM-DD or full ISO timestamps; rejects anything else to prevent
  // pg from receiving an out-of-range year (e.g. "+020225-01-01") that causes a 500.
  const toDateOrNull = (v: any): Date | null => {
    if (v === null || v === undefined || v === "" || v === false) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v !== "string") return null;
    // Must start with a 4-digit year segment to be a valid date string
    if (!/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    // Sanity gate: reject dates outside the range humans actually enter
    const yr = d.getUTCFullYear();
    if (yr < 1900 || yr > 2100) return null;
    return d;
  };

  const normalizeDotDriver = (body: any) => ({
    userId: body.userId,
    firstName: body.firstName,
    lastName: body.lastName,
    dateOfBirth: body.dateOfBirth || null,        // stored as text (FMCSA MM/DD/YYYY)
    cdlNumber: body.cdlNumber || null,
    cdlState: body.cdlState || null,
    cdlExpiry: toDateOrNull(body.cdlExpiry),
    hireDate: toDateOrNull(body.hireDate),
    terminationDate: toDateOrNull(body.terminationDate),
    status: body.status || "active",
    lastClearinghouseQueryDate: toDateOrNull(body.lastClearinghouseQueryDate),
    clearinghouseConsentOnFile: !!body.clearinghouseConsentOnFile,
    queryType: body.queryType || "limited",
    lastMvrDate: toDateOrNull(body.lastMvrDate),
    medicalCardExpiry: toDateOrNull(body.medicalCardExpiry),
    randomPoolIncluded: body.randomPoolEnrolled !== undefined
      ? !!body.randomPoolEnrolled
      : body.randomPoolIncluded !== undefined
        ? !!body.randomPoolIncluded
        : true,
    notes: body.notes || null,
  });

  const normalizeDotEquipment = (body: any) => ({
    userId: body.userId,
    unitNumber: body.unitNumber,
    type: body.equipmentType || body.type || "truck",  // frontend sends equipmentType
    make: body.make || null,
    model: body.model || null,
    year: body.year ? String(body.year) : null,         // schema stores as text
    vin: body.vin || null,
    licensePlate: body.licensePlate || null,
    licenseState: body.licenseState || null,
    lastAnnualInspectionDate: toDateOrNull(body.lastAnnualInspectionDate),
    lastPmDate: toDateOrNull(body.nextPmDueDate || body.lastPmDate),  // frontend sends nextPmDueDate
    notes: body.notes || null,
    isActive: body.isActive !== undefined ? !!body.isActive : true,
  });

  // Drivers
  app.get("/api/dot/drivers", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const drivers = await storage.getDotDrivers(userId);
      res.json(drivers);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/dot/drivers", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const driver = await storage.createDotDriver(normalizeDotDriver({ ...req.body, userId }));
      res.status(201).json(driver);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/dot/drivers/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const updated = await storage.updateDotDriver(parseInt(req.params.id), userId, normalizeDotDriver(req.body));
      if (!updated) return res.status(404).json({ message: "Driver not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/dot/drivers/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      await storage.deleteDotDriver(parseInt(req.params.id), userId);
      res.json({ message: "Driver deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // FMCSA Clearinghouse CSV export — must be before :id routes
  app.get("/api/dot/drivers-export-csv", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const drivers = await storage.getDotDrivers(userId);
      const active = drivers.filter(d => d.status === "active");
      const header = "First Name,Last Name,Date of Birth,CDL/CLP Number,State of Issuance,Country of Issuance,Query Type";
      const rows = active.map(d => {
        const queryTypeCode = d.queryType === "full" ? "2" : "1";
        return `"${d.firstName}","${d.lastName}","${d.dateOfBirth || ""}","${d.cdlNumber || ""}","${d.cdlState || ""}","US","${queryTypeCode}"`;
      });
      const csv = [header, ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="clearinghouse-bulk-query-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csv);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Clearinghouse delta status (counts for UI — does NOT modify data)
  app.get("/api/dot/clearinghouse-delta-status", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const drivers = await storage.getDotDrivers(userId);
      const pendingAdd = drivers.filter(d => d.status === "active" && !d.clearinghouseExportedAt);
      const synced    = drivers.filter(d => d.status === "active" && !!d.clearinghouseExportedAt);
      const pendingRemove = drivers.filter(d =>
        d.status !== "active" && !!d.clearinghouseExportedAt && !d.clearinghouseRemovalExported
      );
      res.json({
        pendingAdd: pendingAdd.length,
        synced: synced.length,
        pendingRemove: pendingRemove.length,
        total: drivers.length,
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Delta CSV export — generates file AND marks drivers as exported/removed
  app.get("/api/dot/drivers-delta-csv", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const drivers = await storage.getDotDrivers(userId);
      const now = new Date();

      const addList    = drivers.filter(d => d.status === "active" && !d.clearinghouseExportedAt);
      const removeList = drivers.filter(d =>
        d.status !== "active" && !!d.clearinghouseExportedAt && !d.clearinghouseRemovalExported
      );

      if (addList.length === 0 && removeList.length === 0) {
        return res.status(200).json({ message: "No changes to export" });
      }

      const header = "Record Type,First Name,Last Name,Date of Birth,CDL/CLP Number,State of Issuance,Country of Issuance,Query Type";
      const addRows = addList.map(d => {
        const qt = d.queryType === "full" ? "2" : "1";
        return `"ADD","${d.firstName}","${d.lastName}","${d.dateOfBirth || ""}","${d.cdlNumber || ""}","${d.cdlState || ""}","US","${qt}"`;
      });
      const removeRows = removeList.map(d => {
        const qt = d.queryType === "full" ? "2" : "1";
        return `"REMOVE","${d.firstName}","${d.lastName}","${d.dateOfBirth || ""}","${d.cdlNumber || ""}","${d.cdlState || ""}","US","${qt}"`;
      });

      const csv = [header, ...addRows, ...removeRows].join("\n");

      // Mark drivers as exported AFTER building the CSV (don't block the download)
      await storage.markDotDriversExported(addList.map(d => d.id), userId, now);
      await storage.markDotDriversRemovalExported(removeList.map(d => d.id), userId);

      const dateStr = now.toISOString().slice(0, 10);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="clearinghouse-delta-${dateStr}.csv"`);
      res.send(csv);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // DQ Documents
  app.get("/api/dot/drivers/:driverId/dq", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const docs = await storage.getDotDqDocuments(parseInt(req.params.driverId), userId);
      res.json(docs);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/dot/drivers/:driverId/dq", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const doc = await storage.upsertDotDqDocument({ ...req.body, driverId: parseInt(req.params.driverId), userId });
      res.json(doc);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Equipment
  app.get("/api/dot/equipment", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const equip = await storage.getDotEquipment(userId);
      res.json(equip);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/dot/equipment", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const equip = await storage.createDotEquipment(normalizeDotEquipment({ ...req.body, userId }));
      res.status(201).json(equip);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/dot/equipment/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const updated = await storage.updateDotEquipment(parseInt(req.params.id), userId, normalizeDotEquipment(req.body));
      if (!updated) return res.status(404).json({ message: "Equipment not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/dot/equipment/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      await storage.deleteDotEquipment(parseInt(req.params.id), userId);
      res.json({ message: "Equipment deleted" });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // DOT metrics summary
  app.get("/api/dot/metrics", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const drivers = await storage.getDotDrivers(userId);
      const equipment = await storage.getDotEquipment(userId);
      const now = new Date();
      const day = 1000 * 60 * 60 * 24;

      const active = drivers.filter(d => d.status === "active");

      const chOverdue = active.filter(d => {
        if (!d.lastClearinghouseQueryDate) return true;
        return (now.getTime() - new Date(d.lastClearinghouseQueryDate).getTime()) > 365 * day;
      });
      const chWarning = active.filter(d => {
        if (!d.lastClearinghouseQueryDate) return false;
        const diff = now.getTime() - new Date(d.lastClearinghouseQueryDate).getTime();
        return diff > 335 * day && diff <= 365 * day;
      });

      const medOverdue = active.filter(d => d.medicalCardExpiry && new Date(d.medicalCardExpiry) < now);
      const medWarning = active.filter(d => {
        if (!d.medicalCardExpiry) return false;
        const diff = new Date(d.medicalCardExpiry).getTime() - now.getTime();
        return diff > 0 && diff < 60 * day;
      });

      const mvrOverdue = active.filter(d => {
        if (!d.lastMvrDate) return true;
        return (now.getTime() - new Date(d.lastMvrDate).getTime()) > 365 * day;
      });

      const activeEquip = equipment.filter(e => e.isActive);
      const equipOverdue = activeEquip.filter(e => {
        if (!e.lastAnnualInspectionDate) return true;
        return (now.getTime() - new Date(e.lastAnnualInspectionDate).getTime()) > 365 * day;
      });

      res.json({
        totalDrivers: active.length,
        clearinghouse: { overdue: chOverdue.length, warning: chWarning.length },
        medicalCards: { overdue: medOverdue.length, warning: medWarning.length },
        mvr: { overdue: mvrOverdue.length },
        equipment: { total: activeEquip.length, overdue: equipOverdue.length },
        noConsentOnFile: active.filter(d => !d.clearinghouseConsentOnFile).length,
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── DOT Random Testing ──────────────────────────────────────────────────────
  app.get("/api/dot/random-tests", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const records = await storage.getDotRandomTests(req.user.claims.sub, year);
      res.json(records);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/dot/random-tests", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.createDotRandomTest({ ...req.body, userId: req.user.claims.sub });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/dot/random-tests/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.updateDotRandomTest(parseInt(req.params.id), req.user.claims.sub, req.body);
      if (!record) return res.status(404).json({ message: "Not found" });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/dot/random-tests/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteDotRandomTest(parseInt(req.params.id), req.user.claims.sub);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Random testing program stats (rate compliance)
  app.get("/api/dot/random-tests/stats", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = req.user.claims.sub;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const [tests, drivers] = await Promise.all([
        storage.getDotRandomTests(userId, year),
        storage.getDotDrivers(userId),
      ]);
      const poolSize = drivers.filter(d => d.status === "active" && d.randomPoolIncluded).length;
      const drugTests = tests.filter(t => t.testType === "drug");
      const alcoholTests = tests.filter(t => t.testType === "alcohol");
      const drugCompleted = drugTests.filter(t => t.result && t.result !== "pending" && t.result !== "cancelled");
      const alcoholCompleted = alcoholTests.filter(t => t.result && t.result !== "pending" && t.result !== "cancelled");
      const requiredDrug = Math.ceil(poolSize * 0.50);
      const requiredAlcohol = Math.ceil(poolSize * 0.10);
      res.json({
        year, poolSize,
        drug: { required: requiredDrug, completed: drugCompleted.length, pending: drugTests.filter(t => t.result === "pending" || !t.result).length, positives: drugTests.filter(t => t.result === "positive").length, rate: poolSize ? Math.round((drugCompleted.length / poolSize) * 100) : 0 },
        alcohol: { required: requiredAlcohol, completed: alcoholCompleted.length, pending: alcoholTests.filter(t => t.result === "pending" || !t.result).length, positives: alcoholTests.filter(t => t.result === "positive").length, rate: poolSize ? Math.round((alcoholCompleted.length / poolSize) * 100) : 0 },
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── DOT Accident Register ───────────────────────────────────────────────────
  app.get("/api/dot/accidents", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      res.json(await storage.getDotAccidents(req.user.claims.sub));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/dot/accidents", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.createDotAccident({ ...req.body, userId: req.user.claims.sub });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/dot/accidents/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.updateDotAccident(parseInt(req.params.id), req.user.claims.sub, req.body);
      if (!record) return res.status(404).json({ message: "Not found" });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/dot/accidents/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteDotAccident(parseInt(req.params.id), req.user.claims.sub);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── DOT Roadside Inspections ────────────────────────────────────────────────
  app.get("/api/dot/inspections", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      res.json(await storage.getDotRoadsideInspections(req.user.claims.sub));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/dot/inspections", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.createDotRoadsideInspection({ ...req.body, userId: req.user.claims.sub });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/dot/inspections/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.updateDotRoadsideInspection(parseInt(req.params.id), req.user.claims.sub, req.body);
      if (!record) return res.status(404).json({ message: "Not found" });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/dot/inspections/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteDotRoadsideInspection(parseInt(req.params.id), req.user.claims.sub);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── DOT DVIR Logs ───────────────────────────────────────────────────────────
  app.get("/api/dot/dvir", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      res.json(await storage.getDotDvirLogs(req.user.claims.sub));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/dot/dvir", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.createDotDvirLog({ ...req.body, userId: req.user.claims.sub });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/dot/dvir/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const record = await storage.updateDotDvirLog(parseInt(req.params.id), req.user.claims.sub, req.body);
      if (!record) return res.status(404).json({ message: "Not found" });
      res.json(record);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/dot/dvir/:id", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteDotDvirLog(parseInt(req.params.id), req.user.claims.sub);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── ISO Objectives (KPIs shared by Process Maps, Measurement, Mgmt Review) ───
  app.get("/api/iso-objectives", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const processName = req.query.processName as string | undefined;
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const objectives = processName
        ? await storage.getIsoObjectivesByProcess(userId, processName, isSuperadmin)
        : await storage.getIsoObjectives(userId, isoProjectId, isSuperadmin);
      res.json(objectives);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-objectives", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const { insertIsoObjectiveSchema } = await import("@shared/schema");
      const parsed = insertIsoObjectiveSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const obj = await storage.createIsoObjective(parsed.data);
      res.status(201).json(obj);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-objectives/upsert", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const { processName, name, target, unit, responsible, isoProjectId } = req.body;
      if (!processName || !name) return res.status(400).json({ message: "processName and name are required" });
      const obj = await storage.upsertIsoObjectiveForProcess(userId, isoProjectId, processName, name, target ?? "", unit ?? "", responsible);
      res.json(obj);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/iso-objectives/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const obj = await storage.updateIsoObjective(id, userId, req.body, isSuperadmin);
      if (!obj) return res.status(404).json({ message: "Not found" });
      res.json(obj);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/iso-objectives/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIsoObjective(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Isa: Generate Turtle Diagram fields for a process ────────────────────────
  app.post("/api/iso-processes/generate-turtle", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const {
        processName, owner, clauses = [], row, site,
        inputs, outputs, resources, keyActivities, startingPoint, endPoint,
        risksAndOpportunities, documentedInfo, executors, csrReq,
        orgName, standard, productsServices, totalEmployees, hasDesign,
        existingDocs = [], existingKpis = []
      } = req.body as Record<string, any>;

      if (!processName) return res.status(400).json({ message: "processName is required" });

      const isIATF = String(standard ?? "").toUpperCase().includes("IATF");
      const hasDocs = Array.isArray(existingDocs) && existingDocs.length > 0;
      const hasKpis = Array.isArray(existingKpis) && existingKpis.length > 0;

      // Build a readable list of existing documents for the prompt
      const docsContext = hasDocs
        ? existingDocs.map((d: any) => `- ${d.title}${d.docNumber ? ` (${d.docNumber})` : ""}${d.isoClause ? ` — Clause ${d.isoClause}` : ""}${d.docType ? ` [${d.docType.replace(/_/g, " ")}]` : ""}`).join("\n")
        : "(none yet)";

      // Build a readable list of existing KPIs so Isa suggests only NEW complementary ones
      const kpisContext = hasKpis
        ? existingKpis.map((k: any) => `- ${k.name}${k.target ? ` — Target: ${k.target}${k.unit ? " " + k.unit : ""}` : ""}`).join("\n")
        : "(none yet)";

      const systemPrompt = `You are Isa, ACSI's Lead ISO Auditor AI, specializing in process analysis for ${standard ?? "ISO 9001"} Quality Management Systems. You help organizations complete Turtle Diagrams — a structured tool for documenting process inputs, outputs, resources, activities, controls, and performance measures.

ORGANIZATION:
- Name: ${orgName ?? "the organization"}
- Standard: ${standard ?? "ISO 9001"}${isIATF ? ":2016" : ":2015"}
- Products/Services: ${productsServices ?? "Not specified"}
- Employees: ${totalEmployees ?? "Unknown"}
- Design Responsibility: ${hasDesign ? "YES" : "NO — products manufactured per customer specifications"}

RULES:
1. Be specific to the actual industry and process — not generic boilerplate.
2. Inputs and Outputs must describe the actual documents, materials, or information flowing into/out of this process.
3. Resources must name realistic equipment, systems, or competencies needed (not generic lists).
4. Key Activities must describe the 4-6 core transformation steps in logical sequence.
5. Risks & Opportunities must be real risks for this type of process in this industry.
6. DOCUMENTED INFORMATION — PRIORITY RULE:
   ${hasDocs
     ? `The organization's document library is provided. For the "documentedInfo" field:
   - FIRST: list any documents from the EXISTING DOCUMENTS LIST that are relevant to this process (plain bullet, use their actual title and number).
   - THEN: for any important documents that are missing from the library, add a line starting with "→ Suggest creating: " followed by a realistic title — these signal gaps the org should fill.
   - Do NOT invent document numbers or pretend documents exist if they are not in the library.
   - NOTE: after Isa fills this field, the user may manually add references to external documents, separate software, or other systems not tracked in this library — leave that flexibility open by keeping the field concise and not exhaustive.`
     : `The organization has no documents in its library yet (this may be early in their QMS build).
   - Do NOT reference any documents as if they already exist.
   - For the "documentedInfo" field: list 3-5 key documents that SHOULD be created for this process, each starting with "→ Suggest creating: " followed by a realistic title and one-line reason.
   - NOTE: the user can also manually add external references or documents from other systems after reviewing Isa's suggestions.`
   }
7. For IATF 16949, include automotive-specific elements where relevant.
8. Keep each field concise — this is a diagram, not a procedure. Bullet-style entries separated by newlines.
9. KPI / QUALITY OBJECTIVES RULE — CRITICAL:
   ${hasKpis
     ? `The process already has these KPIs tracked in Measurement & Monitoring and Management Review:\n${kpisContext}\n   - Do NOT suggest these again — they are already linked.
   - Suggest 2-4 COMPLEMENTARY KPIs that are NOT in the existing list and would give a more complete performance picture for this process.
   - Suggested KPIs will also be saved to Measurement & Monitoring and will appear in Management Review.`
     : `No KPIs exist yet for this process.
   - Suggest 3-5 specific, measurable KPIs appropriate for this process type (${row === "COP" ? "customer-oriented / core process" : row === "SOP" ? "support process" : row === "MOP" ? "management process" : "this process"}).
   - Each KPI must have a realistic numeric target and unit (%, count, days, score, ppm, etc.).
   - These KPIs will be linked to Measurement & Monitoring and will appear in Management Review for tracking.`
   }
   - Every suggested KPI must be directly measurable and relevant to the process described — no vague metrics.

RESPONSE FORMAT — return ONLY a valid JSON object with exactly these keys:
{
  "inputs": "bullet list of inputs, one per line",
  "startingPoint": "one sentence — what triggers this process to begin",
  "outputs": "bullet list of outputs, one per line",
  "endPoint": "one sentence — how you know this process is complete",
  "resources": "bullet list of resources (people skills, equipment, systems, infrastructure)",
  "executors": "roles who execute this process, comma-separated",
  "keyActivities": "numbered list of 4-6 core steps, one per line",
  "risksAndOpportunities": "bullet list of 3-5 key risks and 2-3 opportunities",
  "documentedInfo": "existing documents (plain bullets) then suggested ones (→ Suggest creating: prefix)",
  "csrReq": "${isIATF ? "relevant customer-specific requirements or leave empty string" : ""}",
  "suggestedKpis": [
    { "name": "KPI name", "target": "numeric target or qualitative target", "unit": "unit of measure (%, ppm, days, score, count, etc.)" }
  ]
}
Return ONLY the JSON object — no preamble, no explanation, no markdown code block.`;

      const userMsg = `Complete the Turtle Diagram for this process:

Process Name: ${processName}
Process Row / Type: ${row ?? "not specified"} (${row === "COP" ? "Customer-Oriented / Core" : row === "SOP" ? "Support-Oriented" : row === "MOP" ? "Management-Oriented" : "general"})
Process Owner: ${owner ?? "not specified"}
ISO Clauses: ${clauses.join(", ") || "not specified"}
${isIATF && site ? `Site: ${Array.isArray(site) ? site.join(" + ") : site}` : ""}

EXISTING DOCUMENTS IN LIBRARY (${hasDocs ? existingDocs.length + " documents" : "none yet"}):
${docsContext}

EXISTING KPIs ALREADY TRACKED IN M&M AND MANAGEMENT REVIEW (${hasKpis ? existingKpis.length + " KPIs" : "none yet — suggest a full set"}):
${kpisContext}

CURRENT FIELD VALUES (preserve any non-empty values the user has already entered — improve or expand them, do not discard):
- Inputs: ${inputs || "(empty)"}
- Outputs: ${outputs || "(empty)"}
- Resources: ${resources || "(empty)"}
- Key Activities: ${keyActivities || "(empty)"}
- Starting Point / Trigger: ${startingPoint || "(empty)"}
- End Point / Completion: ${endPoint || "(empty)"}
- Risks & Opportunities: ${risksAndOpportunities || "(empty)"}
- Documented Information: ${documentedInfo || "(empty)"}
- Executors / Who Performs: ${executors || "(empty)"}
${isIATF ? `- Customer Specific Requirements: ${csrReq || "(empty)"}` : ""}

Generate the complete Turtle Diagram content as JSON now.`;

      const client = createAnthropicClient();

      const msg = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMsg }],
      });

      const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
      // Strip markdown code fences if present
      const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(jsonText);

      res.json(parsed);
    } catch (e: any) {
      console.error("Turtle generation error:", e.message);
      res.status(500).json({ message: e.message ?? "Generation failed" });
    }
  });

  // ─── ISO KPI Actuals (measurement log) ────────────────────────────────────────
  app.get("/api/iso-kpi-actuals", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const objectiveId = req.query.objectiveId ? parseInt(req.query.objectiveId as string) : undefined;
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const actuals = await storage.getIsoKpiActuals(userId, objectiveId, isoProjectId, isSuperadmin);
      res.json(actuals);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-kpi-actuals", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const { insertIsoKpiActualSchema } = await import("@shared/schema");
      const parsed = insertIsoKpiActualSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const actual = await storage.createIsoKpiActual(parsed.data);
      // Auto-derive objective status from this latest actual vs target (live KPI computation)
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const objectives = await storage.getIsoObjectives(userId, undefined, isSuperadmin);
      const objective = objectives.find(o => o.id === parsed.data.objectiveId);
      if (objective && objective.target) {
        const targetNum = parseFloat(objective.target);
        const actualNum = parseFloat(parsed.data.actual);
        if (!isNaN(targetNum) && !isNaN(actualNum) && targetNum > 0) {
          const ratio = actualNum / targetNum;
          const derivedStatus = ratio >= 1.0 ? "on_track" : ratio >= 0.8 ? "at_risk" : "off_track";
          if (derivedStatus !== objective.status) {
            await storage.updateIsoObjective(objective.id, userId, { status: derivedStatus });
          }
        }
      }
      res.status(201).json(actual);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/iso-kpi-actuals/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteIsoKpiActual(id, userId, isSuperadmin);
      res.status(204).send();
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── AI Document Drafting: generate content for a NEW doc (no saved ID yet) ──
  app.post("/api/iso-documents/generate-draft", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const { docType, title, isoClause, additionalContext } = req.body as { docType?: string; title?: string; isoClause?: string; additionalContext?: string };
      if (!title) return res.status(400).json({ message: "title is required" });

      const project = await storage.getIsoProject(userId, isSuperadmin);
      interface ProcessJsonEntry { name: string; owner?: string; inputs?: string; outputs?: string; }
      const processContext = project?.processes
        ? (project.processes as ProcessJsonEntry[]).map((p) => `  - ${p.name} | Owner: ${p.owner ?? ""} | Inputs: ${p.inputs ?? ""} | Outputs: ${p.outputs ?? ""}`).join("\n")
        : "No processes defined.";

      const docHasDesign = project?.hasDesignResponsibility ?? false;
      const systemPrompt = `You are Isa, ACSI's Lead ISO Auditor AI. The user is creating a new document inside the ISO Manager Documentation module — draft its full content now. Do NOT redirect them; they are already in the right place. Produce the complete, audit-ready document in one pass.

ORGANIZATION PROFILE:
- Name: ${project?.orgName ?? "Not specified"}
- Standard: ${project?.standard ?? "ISO 9001"}:2015
- Industry / Products: ${project?.productsServices ?? "Not specified"}
- Employees: ${project?.totalEmployees ?? "?"}
- Design Responsibility: ${docHasDesign ? "YES — the organization holds design and development responsibility" : "NO — products are manufactured to customer specifications; Design & Development is excluded or limited scope"}

PROCESSES:
${processContext}

DOCUMENT TO DRAFT:
- Title: ${title}
- Type: ${(docType ?? "procedure").replace(/_/g, " ")}
- ISO Clause: ${isoClause ?? "Not specified"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 1 — FULL STANDARD COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before drafting, mentally list EVERY sub-clause of ${project?.standard ?? "ISO 9001"}:2015 that applies to this document type. Incorporate every SHALL requirement. For IATF 16949, include every automotive supplemental sub-clause that applies (e.g., 8.3.2.1, 8.3.2.2, 8.3.2.3, 8.3.3.1–8.3.3.3, 8.3.5.1, 8.3.5.2, 8.3.6.1). If a sub-clause is not applicable to this organization, state explicitly why it is excluded or N/A.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 2 — SCOPE & INDUSTRY TAILORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a CHEMICAL / BULK FLUID manufacturer if applicable (brake fluid, coolant, industrial chemicals). Tailor all language to that industry:
- Design validation = chemical testing (FMVSS 116, SAE J1703/J1704, ASTM methods), not CAD
- FMEA = chemical/process FMEA (C-PFMEA), not mechanical DFMEA
- Prototypes = laboratory batches / trial production runs
- Design outputs = formulation specs, SDS, TDS, CoA templates — not engineering drawings
- Customer requirements = automotive OEM CSRs where applicable (Ford MFES, GM, Stellantis)
- "Product" means bulk chemical formulations or packaged fluid products
Never use generic machining/assembly language when chemical-specific language applies.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 3 — CONCISENESS (HIGHEST PRIORITY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET: 4 to 6 pages at standard print margins. A 20-page procedure is a failure mode.
- 1.0 PURPOSE: 2–3 sentences max.
- 2.0 SCOPE: 3–5 sentences max — what is covered, what is not, who it applies to.
- 3.0 DEFINITIONS: Only terms the reader needs defined to execute this procedure. Max 8 terms. Skip any term any QMS professional would immediately know.
- 4.0 RESPONSIBILITIES: 3–5 key roles only. One short sentence or 2–3 bullets per role. Total section = half a page max.
- 5.0 PROCEDURE: Numbered steps (5.1, 5.2, 5.2.1…) — clear, actionable, covering all standard requirements. This section gets the most space.
- 6.0 RELATED DOCUMENTS: Simple bullet list.
- 7.0 RECORDS: Table or bullets — Record Name | Retention | Owner.
- 8.0 REVISION HISTORY: Rev 0, Initial Release.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 4 — EXISTING FORMS (when form content is in user context)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user has included an existing form, checklist, log, or record template in their context:
- Identify the form by its EXACT name or form number as shown in the form header or title field
- In section 7.0 RECORDS: reference this form by its exact name/number — never use "[Form Name]" placeholders
- In the relevant procedure steps: describe precisely where and how this form is initiated, completed, and retained
- In the COVERAGE NOTE below, add a "FORM ASSESSMENT" subsection directly after the clause coverage bullets:
  FORM ASSESSMENT:
  Form: [exact name/number from the uploaded form]
  Verdict: USE AS-IS | MINOR MODIFICATIONS NEEDED | SIGNIFICANT MODIFICATIONS NEEDED
  (If verdict is not USE AS-IS, list 2–4 specific fields to add or change as short bullets)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT HEADER (write at the very top):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${title}
Document No.: QP-${(isoClause ?? "").replace(/[^0-9.]/g, "") || "X.X"}-1   Revision: 0   Effective Date: ${new Date().toLocaleDateString("en-US", {month:"2-digit", day:"2-digit", year:"numeric"})}
Department: Quality   Approved By: ___________________

CRITICAL FORMATTING — FOLLOW EXACTLY:
- NO Markdown: no #, no ##, no **, no *, no ---, no backticks
- Section headings: "1.0 PURPOSE", "2.0 SCOPE", "3.0 DEFINITIONS" (ALL-CAPS with .0)
- Sub-sections: decimal "5.1", "5.2", "5.1.1" — plain "- " for sub-bullets
- Tables: pipe-delimited only, no markdown separator rows
- Output the document first, then the mandatory coverage note (see below). No intro before the document.

MANDATORY COVERAGE NOTE — output this AFTER the document content:
Write the exact delimiter on its own line: ===COVERAGE-NOTE===
Then write a structured coverage note (the app renders this separately, NOT inside the procedure):

CLAUSE COVERAGE — ${project?.standard ?? "ISO 9001"}:2015 Clause ${isoClause ?? "[X.X]"}: [Clause Title]

WHAT THIS DOCUMENT COVERS:
- Cl. [X.X.X] — [requirement name]
(list every sub-clause requirement this procedure addresses)

ADDITIONAL PROCEDURES RECOMMENDED FOR FULL CLAUSE COMPLIANCE:
(For each group of requirements in this clause that is NOT in this document and typically warrants its own separate procedure, write one bullet)
- [Suggested Procedure Title] (covers Cl. [sub-clauses]) — [one sentence on what it covers]

If all requirements are fully covered in this document, write:
"This document addresses all applicable ${project?.standard ?? "ISO 9001"}:2015 Clause ${isoClause ?? "[X.X]"} requirements for ${project?.orgName ?? "this organization"}."

Always end with: "Would you like me to draft any of the additional procedures listed above? I can create each one fully tailored to ${project?.orgName ?? "your organization"}."`;

      const userMessage = additionalContext?.trim()
        ? `Draft the complete ${(docType ?? "procedure").replace(/_/g, " ")} document: "${title}". Use ALL-CAPS numbered section headings (1. PURPOSE, 2. SCOPE, etc.) — absolutely no Markdown symbols.\n\nUSER-PROVIDED CONTEXT AND REQUIREMENTS (incorporate these specifically into the document — if existing forms are included, reference them by their exact name/number):\n${additionalContext.trim()}`
        : `Draft the complete ${(docType ?? "procedure").replace(/_/g, " ")} document: "${title}". Use ALL-CAPS numbered section headings (1. PURPOSE, 2. SCOPE, etc.) — absolutely no Markdown symbols.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const anthropicClient = createAnthropicClient();
      const stream = anthropicClient.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      console.error("Generate draft error:", e);
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  });

  // ─── AI Document Drafting: Isa streams a document draft ───────────────────────
  app.post("/api/iso-documents/:id/generate", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const userId = (req.user as any).claims.sub;
      const docId = parseInt(req.params.id);
      if (isNaN(docId)) return res.status(400).json({ message: "Invalid ID" });

      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const { additionalContext, revisionMode } = (req.body ?? {}) as { additionalContext?: string; revisionMode?: boolean };
      const docs = await storage.getIsoDocuments(userId, isSuperadmin);
      const doc = docs.find(d => d.id === docId);
      if (!doc) return res.status(404).json({ message: "Document not found" });

      const project = await storage.getIsoProject(userId, isSuperadmin);
      interface ProcessJsonEntry { name: string; owner?: string; inputs?: string; outputs?: string; kpi?: string; clauses?: string[]; executors?: string; resources?: string; keyActivities?: string; startingPoint?: string; endPoint?: string; risksAndOpportunities?: string; documentedInfo?: string; csrReq?: string; site?: string; row?: string; }
      const processContext = project?.processes
        ? (project.processes as ProcessJsonEntry[]).map((p) => `  - ${p.name} | Owner: ${p.owner ?? ""} | Inputs: ${p.inputs ?? ""} | Outputs: ${p.outputs ?? ""}`).join("\n")
        : "No processes defined.";

      const isQualityManual = doc.docType === "quality_manual";
      const orgAddr = project?.orgAddress ?? "";
      const employees = project?.totalEmployees ?? "?";
      const hasDesign = project?.hasDesignResponsibility ?? false;

      const standard = project?.standard ?? "ISO 9001";
      const isIATF = standard.toUpperCase().includes("IATF");
      const orgName = project?.orgName ?? "the organization";
      const todayStr = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

const qualityManualPartAPrompt = buildQmPartAPrompt({
        orgName,
        orgAddr,
        productsServices: project?.productsServices ?? "Not specified",
        employees,
        standard,
        isIATF,
        hasDesign,
        processContext,
        todayStr,
      });

      const qualityManualPartBPrompt = buildQmPartBPrompt({
        orgName,
        orgAddr,
        productsServices: project?.productsServices ?? "Not specified",
        employees,
        standard,
        isIATF,
        hasDesign,
        processContext,
        todayStr,
      });


      const procedurePrompt = `You are Isa, ACSI's Lead ISO Auditor AI. Draft a concise, professional, audit-ready ISO management system ${doc.docType.replace(/_/g, " ")} for the organization described below. You are a Lead Auditor — you know every SHALL requirement of the applicable standard. Your job is to produce the best possible procedure in one pass so the user does not have to iterate.

ORGANIZATION PROFILE:
- Name: ${project?.orgName ?? "Not specified"}
- Standard: ${project?.standard ?? "ISO 9001"}:2015
- Industry / Products: ${project?.productsServices ?? "Not specified"}
- Employees: ${project?.totalEmployees ?? "?"}
- Design Responsibility: ${hasDesign ? "YES — the organization holds design and development responsibility" : "NO — products are manufactured to customer specifications; Design & Development is excluded or limited scope"}

PROCESSES:
${processContext}

DOCUMENT TO DRAFT:
- Title: ${doc.title}
- Type: ${doc.docType.replace(/_/g, " ")}
- ISO Clause: ${doc.isoClause ?? "Not specified"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 1 — FULL STANDARD COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before drafting, mentally list EVERY sub-clause of ${project?.standard ?? "ISO 9001"}:2015 that applies to "${doc.title}". Incorporate every SHALL requirement into the procedure. Do not skip sub-clauses. For IATF 16949, include every automotive supplemental sub-clause (e.g., 8.3.2.1, 8.3.2.2, 8.3.2.3, 8.3.3.1, 8.3.3.2, 8.3.3.3, 8.3.5.1, 8.3.5.2, 8.3.6.1) that applies to this document type. If a sub-clause is not applicable to this organization, state explicitly why it is excluded.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 2 — SCOPE & INDUSTRY TAILORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tailor every requirement to the organization's actual industry and products. This is a CHEMICAL / BULK FLUID manufacturer if applicable (e.g., brake fluid, coolant, industrial chemicals). That means:
- Design validation = chemical testing, not CAD drawings (e.g., FMVSS 116, SAE J1703/J1704, ASTM methods for brake fluids)
- FMEA = chemical/process FMEA (C-PFMEA), not mechanical DFMEA
- Prototypes = laboratory batches / trial production runs
- Design outputs = formulation specifications, SDS, TDS, CoA templates — not engineering drawings
- Customer-specific requirements = automotive OEM CSRs (Ford MFES, GM, Stellantis) where relevant
- References to "product" mean bulk chemical formulations or packaged fluid products
Never use generic manufacturing language when chemical-specific language is more accurate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 3 — CONCISENESS (HIGHEST PRIORITY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET: 4 to 6 pages when printed at standard margins. Real-world procedures are concise — a 20-page procedure is a failure mode, not a success.
- 1.0 PURPOSE: 2–3 sentences. State the why. Done.
- 2.0 SCOPE: 3–5 sentences. State what is covered, what is not, and who it applies to.
- 3.0 DEFINITIONS: Include ONLY terms a reader genuinely needs defined to execute this procedure. Maximum 8 terms. Skip any term that any QMS professional would immediately know (e.g., "document," "record," "process").
- 4.0 RESPONSIBILITIES: Identify 3–5 key roles only. For each role, write one concise sentence or a single short bullet list (3 bullets max). Total section must fit within half a page.
- 5.0 PROCEDURE: This is the heart of the document. Give it the most space. Use numbered steps (5.1, 5.2, 5.2.1, etc.) that are clear, actionable, and cover all standard requirements from Instruction 1.
- 6.0 RELATED DOCUMENTS: List as a simple bulleted reference list.
- 7.0 RECORDS: Plain table or bulleted list — Record Name | Retention Period | Owner.
- 8.0 REVISION HISTORY: One row table — Rev 0, Initial Release.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTION 4 — EXISTING FORMS (when form content is in user context)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user has included an existing form, checklist, log, or record template in their context:
- Identify the form by its EXACT name or form number as shown in the form header or title field
- In section 7.0 RECORDS: reference this form by its exact name/number — never use "[Form Name]" placeholders
- In the relevant procedure steps: describe precisely where and how this form is initiated, completed, and retained
- In the COVERAGE NOTE below, add a "FORM ASSESSMENT" subsection directly after the clause coverage bullets:
  FORM ASSESSMENT:
  Form: [exact name/number from the uploaded form]
  Verdict: USE AS-IS | MINOR MODIFICATIONS NEEDED | SIGNIFICANT MODIFICATIONS NEEDED
  (If verdict is not USE AS-IS, list 2–4 specific fields to add or change as short bullets)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT HEADER (write at the very top):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${doc.title}
Document No.: QP-${(doc.isoClause ?? "").replace(/[^0-9.]/g, "") || "X.X"}-1   Revision: 0   Effective Date: ${new Date().toLocaleDateString("en-US", {month:"2-digit", day:"2-digit", year:"numeric"})}
Department: Quality   Approved By: ___________________

CRITICAL FORMATTING — FOLLOW EXACTLY:
- NO Markdown: no #, no ##, no **, no *, no ---, no backticks, no bold
- Section headings: "1.0 PURPOSE", "2.0 SCOPE", "3.0 DEFINITIONS" (ALL-CAPS, numbered with .0)
- Sub-sections: decimal "5.1", "5.2", "5.1.1" — one indent level for sub-bullets using plain "- "
- Tables: pipe-delimited only, no markdown separator rows (no |---|---|)
- Output the document first, then the mandatory coverage note below. No preamble before the document.

MANDATORY COVERAGE NOTE — output this AFTER the complete document:
Write this exact delimiter on its own line: ===COVERAGE-NOTE===
Then write a structured coverage note (the UI displays this separately from the procedure text):

CLAUSE COVERAGE — ${project?.standard ?? "ISO 9001"}:2015 Clause ${doc.isoClause ?? "[X.X]"}: [Clause Title]

WHAT THIS DOCUMENT COVERS:
- Cl. [X.X.X] — [requirement name]
(list every sub-clause requirement this procedure addresses — be thorough and cite actual sub-clause numbers)

ADDITIONAL PROCEDURES RECOMMENDED FOR FULL CLAUSE COMPLIANCE:
(For each set of requirements in this clause that is NOT covered by this document and that typically warrants its own separate procedure, write one bullet. This is critical — clauses like 8.3, 8.4, 8.5, 10.2 often require multiple procedures.)
- [Suggested Procedure Title] (covers Cl. [X.X.X, X.X.X]) — [one-sentence description of what it addresses]

If this single procedure fully covers all requirements for the clause, write:
"This document addresses all applicable ${project?.standard ?? "ISO 9001"}:2015 Clause ${doc.isoClause ?? "[X.X]"} requirements for ${project?.orgName ?? "this organization"}."

Always end with: "Would you like me to draft any of the additional procedures listed above? I can create each one fully tailored to ${project?.orgName ?? "your organization"}."`;

      const anthropicClient = createAnthropicClient();

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const ctxSuffix = additionalContext?.trim()
        ? `\n\nUSER-PROVIDED CONTEXT (incorporate into the document as authoritative organizational input):\n${additionalContext.trim()}`
        : "";

      // ── REVISION MODE: user wants Isa to revise existing doc content ──────────
      if (revisionMode && doc.content?.trim()) {
        const revInstruction = additionalContext?.trim() ?? "Improve the document for clarity and completeness.";

        if (isQualityManual) {
          // Quality manual revision: two sequential 8000-token calls (same as generation)
          // Part A: revise Cover + Introduction + Sections 1-6
          const qmRevSystemA = `${qualityManualPartAPrompt}

REVISION MODE: The user has provided an existing Quality Management System Manual and a revision instruction. Your task:
1. Read the CURRENT DOCUMENT and the REVISION INSTRUCTION carefully.
2. Apply the revision instruction to the Cover Page, Introduction, and Sections 1 through 6 only.
3. Return the COMPLETE revised Part A — Cover Page, Introduction, Sections 1 through 6 — with the revision applied.
4. Preserve all content in Part A that is NOT affected by the revision instruction.
5. Do not add any preamble, explanation, or remarks before or after the document.
6. End cleanly after Section 6.3 — do not write Section 7 or beyond.`;

          const qmRevUserA = `CURRENT DOCUMENT CONTENT:
${doc.content.trim()}

REVISION INSTRUCTION:
${revInstruction}

Return the complete revised Cover Page, Introduction, and Sections 1-6 now.`;

          const revStreamA = anthropicClient.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 8000,
            system: qmRevSystemA,
            messages: [{ role: "user", content: qmRevUserA }],
          });

          let partARevContent = "";
          for await (const event of revStreamA) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
              partARevContent += event.delta.text;
              res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
            }
          }

          res.write(`data: ${JSON.stringify({ content: "\n\n" })}\n\n`);

          // Part B: revise Sections 7-10 + Appendix, using Part A output for consistency
          const qmRevSystemB = `${qualityManualPartBPrompt}

REVISION MODE: The user has provided an existing Quality Management System Manual and a revision instruction. Your task:
1. Read the CURRENT DOCUMENT, the already-revised PART A, and the REVISION INSTRUCTION carefully.
2. Apply the revision instruction to Sections 7 through 10 and Appendix A only.
3. Return the COMPLETE revised Part B — Sections 7 through 10 and Appendix A — with the revision applied.
4. Preserve all content in Part B that is NOT affected by the revision instruction.
5. Ensure terminology and references are consistent with the already-revised Part A.
6. Do not add any preamble, explanation, or remarks before or after the document.
7. Start directly with Section 7 — do NOT repeat the cover page, introduction, or sections 1-6.`;

          const qmRevUserB = `CURRENT DOCUMENT CONTENT:
${doc.content.trim()}

ALREADY-REVISED PART A (Sections 1-6) — use for consistency:
${partARevContent}

REVISION INSTRUCTION:
${revInstruction}

Return the complete revised Sections 7-10 and Appendix A now.`;

          const revStreamB = anthropicClient.messages.stream({
            model: "claude-sonnet-4-5",
            max_tokens: 8000,
            system: qmRevSystemB,
            messages: [{ role: "user", content: qmRevUserB }],
          });

          for await (const event of revStreamB) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
              res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
            }
          }

          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          return;
        }

        // Non-QM revision: single call
        const revisionSystemPrompt = `You are Isa, ACSI's Lead ISO Auditor AI. The user has asked you to revise an existing ${doc.docType.replace(/_/g, " ")} document.

Your job:
1. Read the current document carefully.
2. Apply the revision instruction exactly as specified.
3. Return the COMPLETE revised document — not a summary, not just the changed sections, but the full document with the change incorporated.
4. Preserve all content that is NOT affected by the revision instruction.
5. Do not add any preamble, explanation, or remarks before or after the document.
6. Maintain the same formatting style as the original document.
7. Preserve the coverage note delimiter (===COVERAGE-NOTE===) at the end if it was in the original.`;

        const revisionUserMsg = `CURRENT DOCUMENT CONTENT:
${doc.content.trim()}

REVISION INSTRUCTION:
${revInstruction}

Return the complete revised document now.`;

        const revStream = anthropicClient.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          system: revisionSystemPrompt,
          messages: [{ role: "user", content: revisionUserMsg }],
        });

        for await (const event of revStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
            res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // ── QUALITY MANUAL: Two sequential API calls (Part A then Part B) ─────────
      if (isQualityManual) {
        const qmUserMsgA = `Draft PART A of the Quality Management System Manual for ${orgName}. Cover the Cover Page, Introduction, and Sections 1 through 6 exactly as specified. Use the organization's actual name throughout. End cleanly after Section 6.3 — do not write Section 7 or beyond.${ctxSuffix}`;

        const streamA = anthropicClient.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 8000,
          system: qualityManualPartAPrompt,
          messages: [{ role: "user", content: qmUserMsgA }],
        });

        for await (const event of streamA) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
            res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ content: "\n\n" })}\n\n`);

        const qmUserMsgB = `Draft PART B of the Quality Management System Manual for ${orgName}. Start directly with Section 7 SUPPORT — do NOT repeat the cover page, introduction, revision sheet, or sections 1-6. Cover Sections 7 through 10 and Appendix A completely.${ctxSuffix}`;

        const streamB = anthropicClient.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 8000,
          system: qualityManualPartBPrompt,
          messages: [{ role: "user", content: qmUserMsgB }],
        });

        for await (const event of streamB) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
            res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // ── STANDARD PROCEDURE / OTHER DOC: Single API call ───────────────────────
      const procStream = anthropicClient.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: procedurePrompt,
        messages: [{ role: "user", content: `Draft the complete ${doc.docType.replace(/_/g, " ")} document: "${doc.title}"${ctxSuffix}` }],
      });

      for await (const event of procStream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      console.error("AI Document drafting error:", e);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Draft generation failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: e.message });
      }
    }
  });

  // ─── Form Adequacy Review ──────────────────────────────────────────────────────
  app.post("/api/iso-forms/review", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { formContent, clause, docType } = req.body as { formContent?: string; clause?: string; docType?: string };
      if (!formContent?.trim()) return res.status(400).json({ message: "formContent is required" });

      // Get user's ISO project for org context
      const projects = await storage.getIsoProjects(userId, false);
      const project = projects?.[0];

      const systemPrompt = `You are Isa, ACSI's Lead ISO Auditor AI. The user has uploaded an existing form they currently use in their organization. Your job is to assess whether this form meets the requirements of the specified ISO clause/standard and whether it can be used as-is or needs modification.

ORGANIZATION:
- Name: ${project?.orgName ?? "Not specified"}
- Standard: ${project?.standard ?? "ISO 9001"}:2015
- Industry / Products: ${project?.productsServices ?? "Not specified"}
- Form Type Being Reviewed: ${(docType ?? "procedure").replace(/_/g, " ")}

ASSESSMENT STRUCTURE — follow this exact format, no Markdown:

FORM IDENTIFICATION
Form Name/Number: [extract exact name/number from the form, or "Not labeled"]
Stated Purpose: [one sentence on what the form appears to be for]
Form Type: [record / checklist / report / log / matrix / plan]

REQUIREMENTS COVERED
(List each ISO clause sub-requirement this form already satisfies. Cite exact sub-clause numbers.)
- Cl. [X.X.X] — [requirement name]: [one sentence on how the form satisfies it]

GAPS IDENTIFIED
(List each requirement that is missing or inadequate. Be specific about what field or section is absent.)
- Cl. [X.X.X] — [requirement name]: Missing — [what specifically needs to be added]

RECOMMENDED ADDITIONS
(Specific fields or sections to add to the form — be precise)
- Add field: "[Field Name]" — [why it is required and where it goes in the form]

RECOMMENDED MODIFICATIONS
(Existing fields that need to be changed or expanded)
- Modify: "[Existing Field]" — [what to change and why]

VERDICT: [USE AS-IS | MINOR MODIFICATIONS NEEDED | SIGNIFICANT MODIFICATIONS NEEDED]
(Write VERDICT on its own line using exactly one of those three phrases)

VERDICT RATIONALE:
[Two to three sentences explaining the verdict. If USE AS-IS, confirm it fully satisfies all applicable requirements. If not, summarize the most critical gaps.]

Use plain text — no Markdown bullets with **, no #, no bold. Use "- " for all bullets. Cite exact clause numbers throughout.`;

      const userMessage = clause?.trim()
        ? `Review this form for compliance with ${clause}:\n\n${formContent.trim()}`
        : `Review this form for compliance with ${project?.standard ?? "ISO 9001"}:2015:\n\n${formContent.trim()}`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const anthropicClient = createAnthropicClient();

      const stream = anthropicClient.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      console.error("Form review error:", e);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Form review failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: e.message });
      }
    }
  });

  // ─── ISO Module Isa Chat (shared backend proxy for all 4 new modules) ─────────
  app.post("/api/iso/module-isa-chat", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { messages, systemPrompt } = req.body as { messages: { role: string; content: string }[]; systemPrompt?: string };
      if (!messages || !Array.isArray(messages)) return res.status(400).json({ message: "messages required" });
      const anthropicClient = createAnthropicClient();
      const response = await anthropicClient.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPrompt || "You are Isa, Lead ISO Auditor for ACSI ISO Manager. Provide expert ISO guidance.",
        messages: messages.map(m => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: String(m.content) })),
      });
      const content = response.content[0].type === "text" ? response.content[0].text : "";
      res.json({ content });
    } catch (e: any) {
      console.error("ISO module Isa chat error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // ─── ISO Risks ────────────────────────────────────────────────────────────────
  app.get("/api/iso-risks", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const risks = await storage.getIsoRisks(userId, isoProjectId, isSuperadmin);
      res.json(risks);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-risks", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoRiskSchema } = await import("@shared/schema");
      const parsed = insertIsoRiskSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const { likelihood = 1, severity = 1, residualLikelihood, residualSeverity } = parsed.data;
      const riskScore = likelihood * severity;
      const residualScore = (residualLikelihood && residualSeverity) ? residualLikelihood * residualSeverity : undefined;
      const risk = await storage.createIsoRisk({ ...parsed.data, likelihood, severity, riskScore, residualScore });
      res.status(201).json(risk);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/iso-risks/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const existing = (await storage.getIsoRisks(userId, undefined, isSuperadmin)).find(r => r.id === parseInt(req.params.id));
      if (!existing) return res.status(404).json({ message: "Not found" });
      const { insertIsoRiskSchema } = await import("@shared/schema");
      // Strip ownership/linkage fields — they must not be client-mutable in PATCH
      const patchSchema = insertIsoRiskSchema.omit({ userId: true, isoProjectId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      // Merge likelihood/severity with existing so score is always correct
      const l: number = parsed.data.likelihood ?? existing.likelihood;
      const s: number = parsed.data.severity ?? existing.severity;
      // Residual: 'in req.body' check so explicit null clears the field
      const rl: number | null = 'residualLikelihood' in req.body
        ? (parsed.data.residualLikelihood ?? null) : existing.residualLikelihood;
      const rs: number | null = 'residualSeverity' in req.body
        ? (parsed.data.residualSeverity ?? null) : existing.residualSeverity;
      const updatePayload: Partial<IsoRisk> = { ...parsed.data, riskScore: l * s, residualScore: (rl && rs) ? rl * rs : null };
      if (!('residualLikelihood' in req.body)) delete updatePayload.residualLikelihood;
      if (!('residualSeverity' in req.body)) delete updatePayload.residualSeverity;
      const risk = await storage.updateIsoRisk(parseInt(req.params.id), userId, updatePayload, isSuperadmin);
      if (!risk) return res.status(404).json({ message: "Not found" });
      res.json(risk);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/iso-risks/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      await storage.deleteIsoRisk(parseInt(req.params.id), userId, isSuperadmin);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── ISO Management Reviews ────────────────────────────────────────────────────
  app.get("/api/iso-management-reviews", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const reviews = await storage.getIsoManagementReviews(userId, isoProjectId, isSuperadmin);
      res.json(reviews);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-management-reviews", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoManagementReviewSchema } = await import("@shared/schema");
      const parsed = insertIsoManagementReviewSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const review = await storage.createIsoManagementReview(parsed.data);
      res.status(201).json(review);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/iso-management-reviews/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoManagementReviewSchema } = await import("@shared/schema");
      // Strip ownership/linkage fields — they must not be client-mutable in PATCH
      const patchSchema = insertIsoManagementReviewSchema.omit({ userId: true, isoProjectId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const review = await storage.updateIsoManagementReview(parseInt(req.params.id), userId, parsed.data, isSuperadmin);
      if (!review) return res.status(404).json({ message: "Not found" });
      res.json(review);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/iso-management-reviews/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      await storage.deleteIsoManagementReview(parseInt(req.params.id), userId, isSuperadmin);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── ISO Review Action Items ────────────────────────────────────────────────────
  app.get("/api/iso-review-action-items", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const items = await storage.getAllIsoReviewActionItems(userId, isoProjectId, isSuperadmin);
      res.json(items);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/iso-management-reviews/:reviewId/actions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const items = await storage.getIsoReviewActionItems(parseInt(req.params.reviewId), userId, isSuperadmin);
      res.json(items);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-management-reviews/:reviewId/actions", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoReviewActionItemSchema } = await import("@shared/schema");
      const parsed = insertIsoReviewActionItemSchema.safeParse({ ...req.body, userId, reviewId: parseInt(req.params.reviewId) });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const item = await storage.createIsoReviewActionItem(parsed.data);
      res.status(201).json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/iso-review-action-items/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoReviewActionItemSchema } = await import("@shared/schema");
      // Strip ownership/linkage fields — they must not be client-mutable in PATCH
      const patchSchema = insertIsoReviewActionItemSchema.omit({ userId: true, reviewId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const item = await storage.updateIsoReviewActionItem(parseInt(req.params.id), userId, parsed.data, isSuperadmin);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/iso-review-action-items/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      await storage.deleteIsoReviewActionItem(parseInt(req.params.id), userId, isSuperadmin);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── ISO Action Items (cross-source tracker) ───────────────────────────────────
  app.get("/api/iso-action-items", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const items = await storage.getIsoActionItems(userId, isoProjectId, isSuperadmin);
      res.json(items);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-action-items", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoActionItemSchema } = await import("@shared/schema");
      const parsed = insertIsoActionItemSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const item = await storage.createIsoActionItem(parsed.data);
      res.status(201).json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/iso-action-items/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const { insertIsoActionItemSchema } = await import("@shared/schema");
      const patchSchema = insertIsoActionItemSchema.omit({ userId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const item = await storage.updateIsoActionItem(parseInt(req.params.id), userId, parsed.data, isSuperadmin);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/iso-action-items/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      await storage.deleteIsoActionItem(parseInt(req.params.id), userId, isSuperadmin);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── ISO Communications ────────────────────────────────────────────────────────
  app.get("/api/iso-communications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
      const comms = await storage.getIsoCommunications(userId, isoProjectId, isSuperadmin);
      res.json(comms);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/iso-communications", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoCommunicationSchema } = await import("@shared/schema");
      const parsed = insertIsoCommunicationSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const comm = await storage.createIsoCommunication(parsed.data);
      res.status(201).json(comm);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/iso-communications/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertIsoCommunicationSchema } = await import("@shared/schema");
      // Strip ownership/linkage fields — they must not be client-mutable in PATCH
      const patchSchema = insertIsoCommunicationSchema.omit({ userId: true, isoProjectId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
      const comm = await storage.updateIsoCommunication(parseInt(req.params.id), userId, parsed.data, isSuperadmin);
      if (!comm) return res.status(404).json({ message: "Not found" });
      res.json(comm);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/iso-communications/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      await storage.deleteIsoCommunication(parseInt(req.params.id), userId, isSuperadmin);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Supplier Management ─────────────────────────────────────────────────────

  app.get("/api/suppliers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
    try {
      const list = await storage.getSuppliers(userId, isoProjectId, isSuperadmin);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/suppliers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertSupplierSchema } = await import("@shared/schema");
      const parsed = insertSupplierSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const supplier = await storage.createSupplier(parsed.data);
      res.json(supplier);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/suppliers/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const { insertSupplierSchema } = await import("@shared/schema");
      const patchSchema = insertSupplierSchema.omit({ userId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const supplier = await storage.updateSupplier(parseInt(req.params.id), userId, parsed.data, isSuperadmin);
      if (!supplier) return res.status(404).json({ message: "Not found" });
      res.json(supplier);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/suppliers/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      await storage.deleteSupplier(parseInt(req.params.id), userId, isSuperadmin);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/supplier-criteria", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
    try {
      const list = await storage.getSupplierCriteria(userId, isoProjectId, isSuperadmin);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/supplier-criteria", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertSupplierCriteriaSchema } = await import("@shared/schema");
      const parsed = insertSupplierCriteriaSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const criteria = await storage.createSupplierCriteria(parsed.data);
      res.json(criteria);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/supplier-criteria/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { insertSupplierCriteriaSchema } = await import("@shared/schema");
      const patchSchema = insertSupplierCriteriaSchema.omit({ userId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const criteria = await storage.updateSupplierCriteria(parseInt(req.params.id), parsed.data);
      if (!criteria) return res.status(404).json({ message: "Not found" });
      res.json(criteria);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/supplier-criteria/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteSupplierCriteria(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/supplier-candidate-assessments", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
    try {
      const list = await storage.getSupplierCandidateAssessments(userId, isoProjectId, isSuperadmin);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/supplier-candidate-assessments", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertSupplierCandidateAssessmentSchema } = await import("@shared/schema");
      const parsed = insertSupplierCandidateAssessmentSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const assessment = await storage.createSupplierCandidateAssessment(parsed.data);
      res.json(assessment);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/supplier-candidate-assessments/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteSupplierCandidateAssessment(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/supplier-evaluations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
    const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
    try {
      const list = await storage.getSupplierEvaluations(userId, isoProjectId, supplierId, isSuperadmin);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/supplier-evaluations", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertSupplierEvaluationSchema } = await import("@shared/schema");
      const parsed = insertSupplierEvaluationSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const ev = await storage.createSupplierEvaluation(parsed.data);
      res.json(ev);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/supplier-evaluations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { insertSupplierEvaluationSchema } = await import("@shared/schema");
      const patchSchema = insertSupplierEvaluationSchema.omit({ userId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const ev = await storage.updateSupplierEvaluation(parseInt(req.params.id), parsed.data);
      if (!ev) return res.status(404).json({ message: "Not found" });
      res.json(ev);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/supplier-evaluations/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteSupplierEvaluation(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/supplier-evaluations/:id/send-email", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const evalId = parseInt(req.params.id);
      const { toEmail, companyName } = req.body;

      // Load evaluation
      const evals = await storage.getSupplierEvaluations(userId, undefined, undefined, isSuperadmin);
      const ev = evals.find(e => e.id === evalId);
      if (!ev) return res.status(404).json({ message: "Evaluation not found" });

      // Load supplier
      const supplier = await storage.getSupplier(ev.supplierId);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });

      const recipientEmail = toEmail || supplier.email;
      if (!recipientEmail || !recipientEmail.includes("@")) {
        return res.status(400).json({ message: "No valid email address on file for this supplier. Add an email in the ASL first." });
      }

      // Build category breakdown from scores JSONB
      const IATF_CATS = [
        { id: "incoming_quality",     label: "Incoming Quality",              weight: 30, color: "blue",
          metrics: [
            { id: "ppm",            label: "Incoming Defect PPM",        unit: "PPM" },
            { id: "lot_reject_rate",label: "Shipment / Lot Reject Rate", unit: "%" },
            { id: "lab_retest",     label: "Lab Retest Events",          unit: "events" },
          ]},
        { id: "delivery_performance", label: "Delivery Performance",          weight: 25, color: "violet",
          metrics: [
            { id: "otd_pct",        label: "On-Time Delivery %",        unit: "%" },
            { id: "premium_freight",label: "Premium Freight Incidents",  unit: "incidents" },
            { id: "fill_rate",      label: "Fill Rate %",               unit: "%" },
          ]},
        { id: "customer_impact",      label: "Customer Disruptions & Impact", weight: 20, color: "red",
          metrics: [
            { id: "line_stops",    label: "Customer Line Stops",         unit: "events" },
            { id: "warranty_returns",label:"Warranty Returns",          unit: "events" },
            { id: "dock_holds",    label: "Dock / Yard Holds",           unit: "holds" },
          ]},
        { id: "capa_responsiveness",  label: "CAPA & Responsiveness",        weight: 15, color: "amber",
          metrics: [
            { id: "response_time_days",label:"8D Response Time (avg)",  unit: "days" },
            { id: "ca_effectiveness",  label:"CA Effectiveness",         unit: "/10" },
            { id: "ppap_on_time",      label:"PPAP On-Time %",           unit: "%" },
          ]},
        { id: "quality_system",       label: "Quality System Status",        weight: 10, color: "emerald",
          metrics: [
            { id: "cert_status",   label: "Certification Status",        unit: "" },
            { id: "special_status",label: "Special Status",              unit: "" },
            { id: "audit_findings",label: "Major NC Count",              unit: "NCs" },
          ]},
      ];

      const scores: any = ev.scores ?? {};
      const categoryBreakdown = IATF_CATS.map(cat => {
        const catData = scores[cat.id] ?? {};
        const metricScores = cat.metrics
          .filter(m => catData[m.id])
          .map(m => catData[m.id].score as number);
        const catScore = metricScores.length
          ? Math.round((metricScores.reduce((a: number, b: number) => a + b, 0) / metricScores.length / 10) * 100)
          : 0;
        const metrics = cat.metrics
          .filter(m => catData[m.id])
          .map(m => ({
            label: m.label,
            value: `${catData[m.id].value}${m.unit ? " " + m.unit : ""}`,
            score: catData[m.id].score as number,
          }));
        return { label: cat.label, weight: cat.weight, color: cat.color, score: catScore, metrics };
      }).filter(c => c.metrics.length > 0);

      const { buildSupplierScorecardEmail, sendEmail } = await import("./emailService");
      const html = buildSupplierScorecardEmail({
        supplierName: supplier.name,
        companyName: companyName || "CCI Chemical, Inc.",
        period: ev.period || "",
        evaluationDate: ev.evaluationDate,
        evaluatorName: ev.evaluatorName || "",
        overallScore: ev.overallScore ?? 0,
        recommendation: ev.recommendation || "conditional",
        notes: ev.notes || undefined,
        categoryBreakdown,
      });

      const sent = await sendEmail(recipientEmail, `IATF 16949 Supplier Scorecard — ${supplier.name} (${ev.period || ev.evaluationDate})`, html);
      if (sent) {
        res.json({ success: true, sentTo: recipientEmail });
      } else {
        res.status(500).json({ message: "Email could not be sent. Check that MAILERSEND_API_KEY is configured." });
      }
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/supplier-audits", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : undefined;
    const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
    try {
      const list = await storage.getSupplierAudits(userId, isoProjectId, supplierId, isSuperadmin);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/supplier-audits", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { insertSupplierAuditSchema } = await import("@shared/schema");
      const parsed = insertSupplierAuditSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const audit = await storage.upsertSupplierAudit(parsed.data as any);
      res.json(audit);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/supplier-audits/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { insertSupplierAuditSchema } = await import("@shared/schema");
      const patchSchema = insertSupplierAuditSchema.omit({ userId: true }).partial();
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
      const audit = await storage.updateSupplierAudit(parseInt(req.params.id), parsed.data);
      if (!audit) return res.status(404).json({ message: "Not found" });
      res.json(audit);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/supplier-audits/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      await storage.deleteSupplierAudit(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Document Change Control (ISO 7.5.3) ──────────────────────────────────────
  // Isa AI acceptance is handled by PATCH /api/iso-documents/:id with isaRevision:true

  // List all change requests for the user's ISO project
  app.get("/api/doc-change-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { db } = await import("./db");
      const { docChangeRequests, isoDocuments } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");
      const rows = await db.execute(sql`
        SELECT dcr.*, d.title AS doc_title, d.doc_type, d.version AS current_version, d.status AS doc_status
        FROM doc_change_requests dcr
        JOIN iso_documents d ON d.id = dcr.document_id
        WHERE dcr.user_id = ${userId}
        ORDER BY dcr.created_at DESC
      `);
      res.json(rows.rows);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Submit a change request for a document
  app.post("/api/iso-documents/:id/change-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { db } = await import("./db");
      const { docChangeRequests, isoDocuments } = await import("@shared/schema");
      const { eq, and, sql } = await import("drizzle-orm");
      const docId = parseInt(req.params.id);
      if (isNaN(docId)) return res.status(400).json({ message: "Invalid document ID" });

      // Get the document
      const [doc] = await db.select().from(isoDocuments).where(and(eq(isoDocuments.id, docId), eq(isoDocuments.userId, userId)));
      if (!doc) return res.status(404).json({ message: "Document not found" });

      const { requestedBy, designatedReviewer, designatedReviewerEmail, changeDescription, reason, proposedContent, affectedDepartments, proposedEffectiveDate } = req.body;
      if (!requestedBy || !changeDescription || !reason) {
        return res.status(400).json({ message: "requestedBy, changeDescription, and reason are required" });
      }

      // Snapshot current doc content & generate a review token
      const { randomUUID } = await import("crypto");
      const reviewToken = randomUUID();
      const reviewTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Insert the change request
      const [dcr] = await db.insert(docChangeRequests).values({
        documentId: docId,
        isoProjectId: doc.isoProjectId,
        userId,
        requestedBy,
        designatedReviewer: designatedReviewer ?? null,
        designatedReviewerEmail: designatedReviewerEmail ?? null,
        changeDescription,
        reason,
        previousContent: doc.content ?? null,
        proposedContent: proposedContent ?? null,
        reviewToken,
        reviewTokenExpiresAt,
        affectedDepartments: affectedDepartments ?? [],
        proposedEffectiveDate: proposedEffectiveDate ? new Date(proposedEffectiveDate) : null,
        status: "pending",
        trainingTriggered: false,
      }).returning();

      // Move doc to in_review
      await db.execute(sql`UPDATE iso_documents SET status = 'in_review', updated_at = NOW() WHERE id = ${docId} AND user_id = ${userId}`);

      // Send reviewer notification email if an email address was provided
      if (designatedReviewerEmail && designatedReviewerEmail.includes("@")) {
        try {
          const { sendEmail, brandedHtml } = await import("./emailService");
          const dcrNumber = `DCR-${String(dcr.id).padStart(4, "0")}`;
          const reviewerName = designatedReviewer || "Reviewer";
          const deptList = (affectedDepartments ?? []).length > 0
            ? (affectedDepartments as string[]).join(", ")
            : "Not specified";
          const effectiveDate = proposedEffectiveDate
            ? new Date(proposedEffectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "Not specified";
          const baseUrl = process.env.APP_URL ?? "https://corecompliancehub.com";
          const reviewUrl = `${baseUrl}/iso/review/${reviewToken}`;

          const bodyHtml = `
            <h2 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 8px;">Document Change Request — Review Required</h2>
            <p style="color:#475569;font-size:14px;margin:0 0 24px;">Hello ${reviewerName}, a revised document has been submitted for your review and approval. <strong>No login is required</strong> — click the button below to review the full document and approve or reject.</p>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="${reviewUrl}" style="display:inline-block;background:#1e3a5f;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">📄 Review &amp; Approve Document →</a>
              <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">This link expires in 30 days and is for your review only.</p>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
              <tr><td style="padding:6px 0;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reference Number</span><br/>
                <span style="font-size:16px;color:#0f172a;font-weight:700;">${dcrNumber}</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Document</span><br/>
                <span style="font-size:14px;color:#0f172a;font-weight:600;">${doc.title} (Rev. ${doc.version} → bumped on approval)</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Submitted By</span><br/>
                <span style="font-size:14px;color:#0f172a;">${requestedBy}</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Summary of Changes</span><br/>
                <span style="font-size:14px;color:#0f172a;">${changeDescription}</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reason</span><br/>
                <span style="font-size:14px;color:#0f172a;">${reason}</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Departments Requiring Training on Approval</span><br/>
                <span style="font-size:14px;color:#0f172a;">${deptList}</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-top:1px solid #e2e8f0;">
                <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Proposed Effective Date</span><br/>
                <span style="font-size:14px;color:#0f172a;">${effectiveDate}</span>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0;font-size:13px;color:#9a3412;font-weight:700;">⚠ What happens when you approve?</p>
                <p style="margin:6px 0 0;font-size:13px;color:#c2410c;">
                  The document version will be bumped automatically, the current version archived, and training notices sent to all affected departments. Rejecting returns the document to the author for revision.
                </p>
              </td></tr>
            </table>
          `;

          await sendEmail(
            designatedReviewerEmail,
            `[Review Required] ${dcrNumber} — ${doc.title} awaits your approval`,
            brandedHtml(`Document Review Required — ${dcrNumber}`, bodyHtml)
          );
        } catch (emailErr: any) {
          console.warn("DCR reviewer notification email failed (non-fatal):", emailErr.message);
        }
      }

      res.status(201).json(dcr);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Approve a change request → bumps version, archives old content, triggers training notice
  app.patch("/api/doc-change-requests/:id/approve", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { db } = await import("./db");
      const { docChangeRequests, isoDocuments, isoAwarenessNotices } = await import("@shared/schema");
      const { eq, and, sql } = await import("drizzle-orm");
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) return res.status(400).json({ message: "Invalid ID" });

      const { reviewerComments, reviewedBy, newContent } = req.body;

      // Get the change request
      const [dcr] = await db.select().from(docChangeRequests).where(and(eq(docChangeRequests.id, requestId), eq(docChangeRequests.userId, userId)));
      if (!dcr) return res.status(404).json({ message: "Change request not found" });
      if (dcr.status !== "pending") return res.status(400).json({ message: "Already processed" });

      // Get current document
      const [doc] = await db.select().from(isoDocuments).where(and(eq(isoDocuments.id, dcr.documentId), eq(isoDocuments.userId, userId)));
      if (!doc) return res.status(404).json({ message: "Document not found" });

      // Calculate new version (e.g. 1.0 → 1.1, 1.9 → 2.0)
      const [major, minor] = (doc.version || "1.0").split(".").map(Number);
      const newMinor = (minor ?? 0) + 1;
      const newVersion = newMinor >= 10 ? `${(major ?? 1) + 1}.0` : `${major ?? 1}.${newMinor}`;

      // Archive current version
      const archive = (doc.previousVersions as any[] ?? []);
      archive.push({
        version: doc.version,
        content: doc.content ?? "",
        approvedBy: doc.approvedBy ?? undefined,
        archivedAt: new Date().toISOString(),
        changeReason: dcr.reason,
      });

      // Update document: bump version, mark approved, optionally update content
      const updateFields: Record<string, any> = {
        version: newVersion,
        status: "approved",
        approvedBy: reviewedBy ?? "QMS Manager",
        approvalDate: new Date(),
        previousVersions: JSON.stringify(archive),
        updatedAt: new Date(),
      };
      if (newContent) updateFields.content = newContent;

      await db.execute(sql`
        UPDATE iso_documents SET
          version = ${updateFields.version},
          status = 'approved',
          approved_by = ${updateFields.approvedBy},
          approval_date = NOW(),
          previous_versions = ${updateFields.previousVersions}::jsonb,
          updated_at = NOW()
          ${newContent ? sql`, content = ${newContent}, compliance_result = NULL, compliance_checked_at = NULL` : sql``}
        WHERE id = ${dcr.documentId} AND user_id = ${userId}
      `);

      // Mark change request approved
      const [updatedDcr] = await db.execute(sql`
        UPDATE doc_change_requests SET
          status = 'approved',
          reviewer_comments = ${reviewerComments ?? null},
          reviewed_by = ${reviewedBy ?? null},
          reviewed_at = NOW(),
          training_triggered = true
        WHERE id = ${requestId}
        RETURNING *
      `);

      // Auto-create training awareness notice for affected departments
      if (dcr.affectedDepartments && dcr.affectedDepartments.length > 0) {
        await db.insert(isoAwarenessNotices).values({
          userId,
          standard: "ISO 9001:2015",
          clause: "7.5.3",
          title: `Document Update Training: ${doc.title} (Rev. ${newVersion})`,
          message: `The document "${doc.title}" has been updated to Revision ${newVersion} and approved. All affected personnel must review the changes.\n\nChange Summary: ${dcr.changeDescription}\n\nReason: ${dcr.reason}\n\nPlease acknowledge receipt and confirm you have read and understood the updated document.`,
          processArea: dcr.affectedDepartments.join(", "),
          assignedTo: dcr.affectedDepartments,
          dueDate: dcr.proposedEffectiveDate ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: "active",
        });
      }

      res.json({ success: true, newVersion, trainingTriggered: (dcr.affectedDepartments ?? []).length > 0 });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Public token-based DCR review endpoints (no login required) ───────────

  // GET /api/dcr-review/:token — return DCR + document info for external reviewer
  app.get("/api/dcr-review/:token", async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { docChangeRequests, isoDocuments } = await import("@shared/schema");
      const { eq, sql } = await import("drizzle-orm");
      const token = req.params.token;
      const rows = await db.execute(sql`
        SELECT dcr.*, d.title AS doc_title, d.doc_type, d.version AS current_version, d.iso_clause, d.approved_by
        FROM doc_change_requests dcr
        JOIN iso_documents d ON d.id = dcr.document_id
        WHERE dcr.review_token = ${token}
        LIMIT 1
      `);
      const dcr = rows.rows[0];
      if (!dcr) return res.status(404).json({ message: "Review link not found or expired" });
      if (dcr.review_token_expires_at && new Date(dcr.review_token_expires_at as string) < new Date()) {
        return res.status(410).json({ message: "This review link has expired" });
      }
      res.json(dcr);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // POST /api/dcr-review/:token/approve — external reviewer approves without login
  app.post("/api/dcr-review/:token/approve", async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { docChangeRequests, isoAwarenessNotices } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");
      const token = req.params.token;
      const { reviewerComments, reviewedBy } = req.body;

      // Find DCR by token
      const rows = await db.execute(sql`
        SELECT dcr.*, d.title AS doc_title, d.version AS current_version, d.content AS current_content
        FROM doc_change_requests dcr
        JOIN iso_documents d ON d.id = dcr.document_id
        WHERE dcr.review_token = ${token}
        LIMIT 1
      `);
      const dcr = rows.rows[0] as any;
      if (!dcr) return res.status(404).json({ message: "Review link not found" });
      if (dcr.review_token_expires_at && new Date(dcr.review_token_expires_at) < new Date()) {
        return res.status(410).json({ message: "This review link has expired" });
      }
      if (dcr.status !== "pending") return res.status(400).json({ message: "This change request has already been processed" });

      // Bump version
      const [major, minor] = ((dcr.current_version as string) || "1.0").split(".").map(Number);
      const newMinor = (minor ?? 0) + 1;
      const newVersion = newMinor >= 10 ? `${(major ?? 1) + 1}.0` : `${major ?? 1}.${newMinor}`;

      // Archive current version
      let archive: any[] = [];
      try {
        const archiveRows = await db.execute(sql`SELECT previous_versions FROM iso_documents WHERE id = ${dcr.document_id}`);
        archive = (archiveRows.rows[0] as any)?.previous_versions ?? [];
      } catch {}
      archive.push({
        version: dcr.current_version,
        content: dcr.current_content ?? "",
        approvedBy: dcr.approved_by ?? undefined,
        archivedAt: new Date().toISOString(),
        changeReason: dcr.reason,
      });

      // Determine what content to store (proposedContent if set, otherwise keep current)
      const newContent = dcr.proposed_content ?? dcr.current_content;

      // Update document
      await db.execute(sql`
        UPDATE iso_documents SET
          version = ${newVersion},
          status = 'approved',
          approved_by = ${reviewedBy ?? dcr.designated_reviewer ?? "External Reviewer"},
          approval_date = NOW(),
          content = ${newContent},
          previous_versions = ${JSON.stringify(archive)}::jsonb,
          updated_at = NOW()
        WHERE id = ${dcr.document_id}
      `);

      // Mark DCR approved
      await db.execute(sql`
        UPDATE doc_change_requests SET
          status = 'approved',
          reviewer_comments = ${reviewerComments ?? null},
          reviewed_by = ${reviewedBy ?? dcr.designated_reviewer ?? "External Reviewer"},
          reviewed_at = NOW(),
          training_triggered = true
        WHERE review_token = ${token}
      `);

      // Auto-create training awareness notice
      const affectedDepts = (dcr.affected_departments as string[]) ?? [];
      if (affectedDepts.length > 0) {
        const userId = dcr.user_id as string;
        await db.insert(isoAwarenessNotices).values({
          userId,
          standard: "ISO 9001:2015",
          clause: "7.5.3",
          title: `Document Update Training: ${dcr.doc_title} (Rev. ${newVersion})`,
          message: `The document "${dcr.doc_title}" has been updated to Revision ${newVersion} and approved.\n\nChange Summary: ${dcr.change_description}\n\nReason: ${dcr.reason}\n\nPlease review the updated document and acknowledge.`,
          processArea: affectedDepts.join(", "),
          assignedTo: affectedDepts,
          dueDate: dcr.proposed_effective_date ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: "active",
        });
      }

      // Notify the submitter that the document was approved
      try {
        const { sendEmail, brandedHtml } = await import("./emailService");
        const userRows = await db.execute(sql`SELECT email, first_name FROM users WHERE id = ${dcr.user_id} LIMIT 1`);
        const submitter = userRows.rows[0] as any;
        if (submitter?.email) {
          const approvedBy = reviewedBy ?? dcr.designated_reviewer ?? "External Reviewer";
          const body = `
            <h2 style="margin:0 0 8px;color:#16a34a;font-size:20px;">Document Approved</h2>
            <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
              ${submitter.first_name ? `Hi ${submitter.first_name}, ` : ""}A document change request has been <strong style="color:#16a34a;">approved</strong> and the document is now live.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:5px 0;color:#475569;font-size:13px;width:160px;"><strong>Document:</strong></td>
                    <td style="padding:5px 0;color:#0f172a;font-size:13px;font-weight:600;">${dcr.doc_title}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#475569;font-size:13px;"><strong>New Version:</strong></td>
                    <td style="padding:5px 0;color:#16a34a;font-size:13px;font-weight:700;">${newVersion}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#475569;font-size:13px;"><strong>Approved By:</strong></td>
                    <td style="padding:5px 0;color:#0f172a;font-size:13px;">${approvedBy}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#475569;font-size:13px;"><strong>Change Summary:</strong></td>
                    <td style="padding:5px 0;color:#0f172a;font-size:13px;">${dcr.change_description}</td>
                  </tr>
                  ${reviewerComments ? `<tr>
                    <td style="padding:5px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Reviewer Notes:</strong></td>
                    <td style="padding:5px 0;color:#0f172a;font-size:13px;">${reviewerComments}</td>
                  </tr>` : ""}
                </table>
              </td></tr>
            </table>
            ${affectedDepts.length > 0 ? `<p style="margin:0 0 16px;font-size:13px;color:#475569;">A training awareness notice has been automatically created for: <strong>${affectedDepts.join(", ")}</strong>.</p>` : ""}
            <a href="${process.env.APP_URL ?? "https://corecompliancehub.com"}/iso-manager" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">View Document Library →</a>
          `;
          await sendEmail(submitter.email, `Document Approved: ${dcr.doc_title} (Rev. ${newVersion})`, brandedHtml("Document Approved", body));
        }
      } catch {}

      res.json({ success: true, newVersion, trainingTriggered: affectedDepts.length > 0 });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // POST /api/dcr-review/:token/reject — external reviewer rejects without login
  app.post("/api/dcr-review/:token/reject", async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const token = req.params.token;
      const { reviewerComments, reviewedBy } = req.body;

      const rows = await db.execute(sql`SELECT dcr.*, d.title AS doc_title FROM doc_change_requests dcr JOIN iso_documents d ON d.id = dcr.document_id WHERE review_token = ${token} LIMIT 1`);
      const dcr = rows.rows[0] as any;
      if (!dcr) return res.status(404).json({ message: "Review link not found" });
      if (dcr.review_token_expires_at && new Date(dcr.review_token_expires_at) < new Date()) {
        return res.status(410).json({ message: "This review link has expired" });
      }
      if (dcr.status !== "pending") return res.status(400).json({ message: "Already processed" });

      await db.execute(sql`
        UPDATE doc_change_requests SET
          status = 'rejected',
          reviewer_comments = ${reviewerComments ?? null},
          reviewed_by = ${reviewedBy ?? dcr.designated_reviewer ?? "External Reviewer"},
          reviewed_at = NOW()
        WHERE review_token = ${token}
      `);

      // Return doc to approved
      await db.execute(sql`UPDATE iso_documents SET status = 'approved', updated_at = NOW() WHERE id = ${dcr.document_id}`);

      // Notify the submitter that the document was rejected
      try {
        const { sendEmail, brandedHtml } = await import("./emailService");
        const userRows = await db.execute(sql`SELECT email, first_name FROM users WHERE id = ${dcr.user_id} LIMIT 1`);
        const submitter = userRows.rows[0] as any;
        if (submitter?.email) {
          const rejectedBy = reviewedBy ?? dcr.designated_reviewer ?? "External Reviewer";
          const body = `
            <h2 style="margin:0 0 8px;color:#dc2626;font-size:20px;">Document Change Request Rejected</h2>
            <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
              ${submitter.first_name ? `Hi ${submitter.first_name}, ` : ""}A document change request has been <strong style="color:#dc2626;">rejected</strong>. The document has been returned to its previously approved status.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:5px 0;color:#7f1d1d;font-size:13px;width:160px;"><strong>Document:</strong></td>
                    <td style="padding:5px 0;color:#0f172a;font-size:13px;font-weight:600;">${dcr.doc_title}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#7f1d1d;font-size:13px;"><strong>Rejected By:</strong></td>
                    <td style="padding:5px 0;color:#0f172a;font-size:13px;">${rejectedBy}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#7f1d1d;font-size:13px;"><strong>Change Requested:</strong></td>
                    <td style="padding:5px 0;color:#0f172a;font-size:13px;">${dcr.change_description}</td>
                  </tr>
                  ${reviewerComments ? `<tr>
                    <td style="padding:5px 0;color:#7f1d1d;font-size:13px;vertical-align:top;"><strong>Reason for Rejection:</strong></td>
                    <td style="padding:5px 0;color:#dc2626;font-size:13px;">${reviewerComments}</td>
                  </tr>` : ""}
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 16px;font-size:13px;color:#475569;">You may revise and resubmit the change request from the Documentation module.</p>
            <a href="${process.env.APP_URL ?? "https://corecompliancehub.com"}/iso-manager" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">Go to Document Library →</a>
          `;
          await sendEmail(submitter.email, `Document Change Rejected: ${dcr.doc_title}`, brandedHtml("Document Change Request Rejected", body));
        }
      } catch {}

      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // Reject a change request → doc returns to approved
  app.patch("/api/doc-change-requests/:id/reject", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    try {
      const { db } = await import("./db");
      const { docChangeRequests, isoDocuments } = await import("@shared/schema");
      const { eq, and, sql } = await import("drizzle-orm");
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) return res.status(400).json({ message: "Invalid ID" });

      const { reviewerComments, reviewedBy } = req.body;
      const [dcr] = await db.select().from(docChangeRequests).where(and(eq(docChangeRequests.id, requestId), eq(docChangeRequests.userId, userId)));
      if (!dcr) return res.status(404).json({ message: "Not found" });
      if (dcr.status !== "pending") return res.status(400).json({ message: "Already processed" });

      // Reject change request
      await db.execute(sql`
        UPDATE doc_change_requests SET
          status = 'rejected',
          reviewer_comments = ${reviewerComments ?? null},
          reviewed_by = ${reviewedBy ?? null},
          reviewed_at = NOW()
        WHERE id = ${requestId}
      `);

      // Return doc to approved (it was in_review)
      await db.execute(sql`UPDATE iso_documents SET status = 'approved', updated_at = NOW() WHERE id = ${dcr.documentId} AND user_id = ${userId}`);

      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Change Control Log (ISO 7.5 Compliance) ──────────────────────────────
  app.get("/api/change-control-log", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    const isSuperadmin = (req.user as any).claims.isSuperadmin === true;
    try {
      const { db } = await import("./db");
      const { isoDocuments } = await import("@shared/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      // Optional isoProjectId scoping from query param
      const isoProjectId = req.query.isoProjectId ? parseInt(req.query.isoProjectId as string) : null;

      // 1) Fetch all approved formal DCRs (superadmin sees all; others see own)
      const dcrSql = isoProjectId && !isNaN(isoProjectId)
        ? isSuperadmin
          ? sql`
            SELECT dcr.id AS id, dcr.reviewed_at AS date, d.title AS doc_title, d.id AS doc_id,
              dcr.reason AS change_reason, dcr.requested_by AS changed_by, dcr.reviewed_by AS approved_by
            FROM doc_change_requests dcr
            JOIN iso_documents d ON d.id = dcr.document_id
            WHERE dcr.status = 'approved' AND dcr.iso_project_id = ${isoProjectId}
            ORDER BY dcr.reviewed_at DESC
          `
          : sql`
            SELECT dcr.id AS id, dcr.reviewed_at AS date, d.title AS doc_title, d.id AS doc_id,
              dcr.reason AS change_reason, dcr.requested_by AS changed_by, dcr.reviewed_by AS approved_by
            FROM doc_change_requests dcr
            JOIN iso_documents d ON d.id = dcr.document_id
            WHERE dcr.user_id = ${userId} AND dcr.status = 'approved' AND dcr.iso_project_id = ${isoProjectId}
            ORDER BY dcr.reviewed_at DESC
          `
        : isSuperadmin
          ? sql`
            SELECT dcr.id AS id, dcr.reviewed_at AS date, d.title AS doc_title, d.id AS doc_id,
              dcr.reason AS change_reason, dcr.requested_by AS changed_by, dcr.reviewed_by AS approved_by
            FROM doc_change_requests dcr
            JOIN iso_documents d ON d.id = dcr.document_id
            WHERE dcr.status = 'approved'
            ORDER BY dcr.reviewed_at DESC
          `
          : sql`
            SELECT dcr.id AS id, dcr.reviewed_at AS date, d.title AS doc_title, d.id AS doc_id,
              dcr.reason AS change_reason, dcr.requested_by AS changed_by, dcr.reviewed_by AS approved_by
            FROM doc_change_requests dcr
            JOIN iso_documents d ON d.id = dcr.document_id
            WHERE dcr.user_id = ${userId} AND dcr.status = 'approved'
            ORDER BY dcr.reviewed_at DESC
          `;

      const dcrRows = await db.execute(dcrSql);

      // 2) Fetch all relevant documents with previousVersions (superadmin: all, else: own)
      const docsQuery = isoProjectId && !isNaN(isoProjectId)
        ? isSuperadmin
          ? db.select({ id: isoDocuments.id, title: isoDocuments.title, version: isoDocuments.version,
              previousVersions: isoDocuments.previousVersions, approvedBy: isoDocuments.approvedBy,
            }).from(isoDocuments).where(eq(isoDocuments.isoProjectId, isoProjectId))
          : db.select({ id: isoDocuments.id, title: isoDocuments.title, version: isoDocuments.version,
              previousVersions: isoDocuments.previousVersions, approvedBy: isoDocuments.approvedBy,
            }).from(isoDocuments).where(and(eq(isoDocuments.userId, userId), eq(isoDocuments.isoProjectId, isoProjectId)))
        : isSuperadmin
          ? db.select({ id: isoDocuments.id, title: isoDocuments.title, version: isoDocuments.version,
              previousVersions: isoDocuments.previousVersions, approvedBy: isoDocuments.approvedBy,
            }).from(isoDocuments)
          : db.select({ id: isoDocuments.id, title: isoDocuments.title, version: isoDocuments.version,
              previousVersions: isoDocuments.previousVersions, approvedBy: isoDocuments.approvedBy,
            }).from(isoDocuments).where(eq(isoDocuments.userId, userId));

      const docs = await docsQuery;

      // Build lookup: docId -> previousVersions sorted by archivedAt ascending
      const docPvMap = new Map<number, any[]>();
      const docCurrentVersion = new Map<number, string>();
      for (const doc of docs) {
        const pvs = (Array.isArray(doc.previousVersions) ? doc.previousVersions : [])
          .slice()
          .sort((a: any, b: any) => {
            if (!a.archivedAt && !b.archivedAt) return 0;
            if (!a.archivedAt) return -1;
            if (!b.archivedAt) return 1;
            return new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime();
          });
        docPvMap.set(doc.id, pvs);
        docCurrentVersion.set(doc.id, doc.version);
      }

      // 3) For each approved DCR, derive rev_from and rev_to deterministically
      //    from the previousVersions sequence.
      //
      //    previousVersions stores OLD versions (before bump) sorted chronologically.
      //    If previousVersions = [{v:"1.0",archivedAt:t1},{v:"1.1",archivedAt:t2}]
      //    and currentVersion = "1.2", then:
      //      DCR closest to t1: rev_from=1.0, rev_to=1.1
      //      DCR closest to t2: rev_from=1.1, rev_to=1.2
      //
      //    We match each DCR to the previousVersions entry with the closest archivedAt.
      //    rev_to = next entry's version, or currentDocVersion if it's the last entry.

      const dcrClaimedKeys = new Set<string>(); // tracks (docId:pvIndex) already used
      const dcrEntries = (dcrRows.rows as any[]).map(r => {
        const reviewedAtMs = r.date ? new Date(r.date as string).getTime() : null;
        const docId = r.doc_id as number;
        const prevVersions = docPvMap.get(docId) ?? [];
        const currentVer = docCurrentVersion.get(docId) ?? null;

        let revFrom: string | null = null;
        let revTo: string | null = currentVer;
        let matchedIdx: number | null = null;

        if (reviewedAtMs !== null && prevVersions.length > 0) {
          let closestDiff = Infinity;
          for (let i = 0; i < prevVersions.length; i++) {
            const pv = prevVersions[i];
            const key = `${docId}:${i}`;
            if (dcrClaimedKeys.has(key)) continue; // already assigned to another DCR
            if (pv.archivedAt) {
              const diff = Math.abs(new Date(pv.archivedAt).getTime() - reviewedAtMs);
              if (diff < closestDiff) {
                closestDiff = diff;
                matchedIdx = i;
              }
            }
          }
          if (matchedIdx !== null) {
            const matched = prevVersions[matchedIdx];
            revFrom = matched.version ?? null;
            // rev_to = next entry's version, or the current doc version if this is the last
            const nextEntry = prevVersions[matchedIdx + 1];
            revTo = nextEntry?.version ?? currentVer;
            dcrClaimedKeys.add(`${docId}:${matchedIdx}`);
          }
        }

        return {
          id: r.id,
          date: r.date ? new Date(r.date as string).toISOString() : null,
          doc_title: r.doc_title,
          doc_id: docId,
          change_reason: r.change_reason ?? null,
          changed_by: r.changed_by ?? null,
          approved_by: r.approved_by ?? null,
          dcr_status: 'approved',
          rev_from: revFrom,
          rev_to: revTo,
          change_type: 'formal_dcr',
        };
      });

      // 4) Build AI-assisted entries from previousVersions entries NOT claimed by a formal DCR.
      const aiEntries: any[] = [];
      for (const doc of docs) {
        const prevVersions = docPvMap.get(doc.id) ?? [];
        for (let i = 0; i < prevVersions.length; i++) {
          const key = `${doc.id}:${i}`;
          if (dcrClaimedKeys.has(key)) continue; // this entry was a formal DCR archive, skip
          const pv = prevVersions[i];
          const nextPv = prevVersions[i + 1];
          aiEntries.push({
            id: `ai-${doc.id}-${i}`,
            date: pv.archivedAt ?? null,
            doc_title: doc.title,
            doc_id: doc.id,
            change_reason: pv.changeReason ?? null,
            changed_by: null,
            approved_by: pv.approvedBy ?? null,
            dcr_status: 'approved',
            rev_from: pv.version ?? null,
            rev_to: nextPv?.version ?? docCurrentVersion.get(doc.id) ?? null,
            change_type: 'ai_assisted',
          });
        }
      }

      // 5) Merge and sort chronologically (newest first)
      const merged = [...dcrEntries, ...aiEntries].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      res.json(merged);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ─── Environmental Compliance Hub API ──────────────────────────────────────

  // Facility Profile
  app.get("/api/env/facility-profile", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_facility_profiles WHERE user_id = ${req.session.userId} LIMIT 1`);
    res.json(rows.rows[0] ?? null);
  });

  app.post("/api/env/facility-profile", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    await db.execute(sql`
      INSERT INTO env_facility_profiles (user_id, facility_name, address, city, state, sic_code, naics_code, epa_id, has_stacks, has_boilers, has_storage_tanks, oil_storage_gallons, generator_status, has_spcc_plan, spcc_plan_date, has_swppp, has_air_permit, permit_type, notes, updated_at)
      VALUES (${req.session.userId}, ${d.facilityName??null}, ${d.address??null}, ${d.city??null}, ${d.state??null}, ${d.sicCode??null}, ${d.naicsCode??null}, ${d.epaId??null}, ${d.hasStacks??false}, ${d.hasBoilers??false}, ${d.hasStorageTanks??false}, ${d.oilStorageGallons??0}, ${d.generatorStatus??null}, ${d.hasSpccPlan??false}, ${d.spccPlanDate??null}, ${d.hasSwppp??false}, ${d.hasAirPermit??false}, ${d.permitType??null}, ${d.notes??null}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        facility_name = EXCLUDED.facility_name, address = EXCLUDED.address, city = EXCLUDED.city, state = EXCLUDED.state,
        sic_code = EXCLUDED.sic_code, naics_code = EXCLUDED.naics_code, epa_id = EXCLUDED.epa_id,
        has_stacks = EXCLUDED.has_stacks, has_boilers = EXCLUDED.has_boilers, has_storage_tanks = EXCLUDED.has_storage_tanks,
        oil_storage_gallons = EXCLUDED.oil_storage_gallons, generator_status = EXCLUDED.generator_status,
        has_spcc_plan = EXCLUDED.has_spcc_plan, spcc_plan_date = EXCLUDED.spcc_plan_date,
        has_swppp = EXCLUDED.has_swppp, has_air_permit = EXCLUDED.has_air_permit, permit_type = EXCLUDED.permit_type,
        notes = EXCLUDED.notes, updated_at = NOW()
    `);
    const rows = await db.execute(sql`SELECT * FROM env_facility_profiles WHERE user_id = ${req.session.userId} LIMIT 1`);
    res.json(rows.rows[0]);
  });

  // Universal Waste
  app.get("/api/env/universal-waste", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_universal_waste WHERE user_id = ${req.session.userId} ORDER BY created_at DESC`);
    res.json(rows.rows);
  });

  app.post("/api/env/universal-waste", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      INSERT INTO env_universal_waste (user_id, waste_type, description, location, quantity, unit, start_date, disposal_date, status, notes)
      VALUES (${req.session.userId}, ${d.wasteType}, ${d.description??null}, ${d.location??null}, ${d.quantity??null}, ${d.unit??null}, ${d.startDate}, ${d.disposalDate??null}, ${d.status??'active'}, ${d.notes??null})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  });

  app.patch("/api/env/universal-waste/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      UPDATE env_universal_waste SET
        waste_type = COALESCE(${d.wasteType??null}, waste_type),
        description = ${d.description??null}, location = ${d.location??null},
        quantity = ${d.quantity??null}, unit = ${d.unit??null},
        start_date = COALESCE(${d.startDate??null}, start_date),
        disposal_date = ${d.disposalDate??null}, status = COALESCE(${d.status??null}, status),
        notes = ${d.notes??null}, updated_at = NOW()
      WHERE id = ${req.params.id} AND user_id = ${req.session.userId} RETURNING *
    `);
    res.json(rows.rows[0]);
  });

  app.delete("/api/env/universal-waste/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`DELETE FROM env_universal_waste WHERE id = ${req.params.id} AND user_id = ${req.session.userId}`);
    res.json({ success: true });
  });

  // SAPs
  app.get("/api/env/saps", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_haz_waste_saps WHERE user_id = ${req.session.userId} ORDER BY created_at DESC`);
    res.json(rows.rows);
  });

  app.post("/api/env/saps", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      INSERT INTO env_haz_waste_saps (user_id, sap_name, location, waste_types, max_capacity_gallons, container_count, is_active, notes)
      VALUES (${req.session.userId}, ${d.sapName}, ${d.location??null}, ${d.wasteTypes??null}, ${d.maxCapacityGallons??null}, ${d.containerCount??null}, ${d.isActive??true}, ${d.notes??null})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  });

  app.delete("/api/env/saps/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`DELETE FROM env_haz_waste_saps WHERE id = ${req.params.id} AND user_id = ${req.session.userId}`);
    res.json({ success: true });
  });

  // SAP Inspections
  app.get("/api/env/sap-inspections", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const sapId = req.query.sapId;
    const rows = sapId
      ? await db.execute(sql`SELECT * FROM env_sap_inspections WHERE user_id = ${req.session.userId} AND sap_id = ${sapId} ORDER BY inspected_date DESC`)
      : await db.execute(sql`SELECT * FROM env_sap_inspections WHERE user_id = ${req.session.userId} ORDER BY inspected_date DESC LIMIT 50`);
    res.json(rows.rows);
  });

  app.post("/api/env/sap-inspections", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const pass = d.containersIntact && d.containersLabeled && d.areaClean && d.noLeaks;
    const rows = await db.execute(sql`
      INSERT INTO env_sap_inspections (user_id, sap_id, inspected_date, inspected_by, containers_intact, containers_labeled, area_clean, no_leaks, findings, pass)
      VALUES (${req.session.userId}, ${d.sapId}, ${d.inspectedDate}, ${d.inspectedBy??null}, ${d.containersIntact??null}, ${d.containersLabeled??null}, ${d.areaClean??null}, ${d.noLeaks??null}, ${d.findings??null}, ${pass})
      RETURNING *
    `);
    await db.execute(sql`UPDATE env_haz_waste_saps SET last_inspection_date = ${d.inspectedDate} WHERE id = ${d.sapId} AND user_id = ${req.session.userId}`);
    res.status(201).json(rows.rows[0]);
  });

  // Manifests
  app.get("/api/env/manifests", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_manifests WHERE user_id = ${req.session.userId} ORDER BY shipment_date DESC`);
    res.json(rows.rows);
  });

  app.post("/api/env/manifests", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      INSERT INTO env_manifests (user_id, manifest_number, shipment_date, tsdf_name, tsdf_epa_id, waste_description, quantity, unit, returned_date, status, notes)
      VALUES (${req.session.userId}, ${d.manifestNumber}, ${d.shipmentDate}, ${d.tsdfName??null}, ${d.tsdfEpaId??null}, ${d.wasteDescription??null}, ${d.quantity??null}, ${d.unit??null}, ${d.returnedDate??null}, ${d.status??'pending'}, ${d.notes??null})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  });

  app.patch("/api/env/manifests/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      UPDATE env_manifests SET
        returned_date = ${d.returnedDate??null}, status = COALESCE(${d.status??null}, status), notes = COALESCE(${d.notes??null}, notes)
      WHERE id = ${req.params.id} AND user_id = ${req.session.userId} RETURNING *
    `);
    res.json(rows.rows[0]);
  });

  app.delete("/api/env/manifests/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`DELETE FROM env_manifests WHERE id = ${req.params.id} AND user_id = ${req.session.userId}`);
    res.json({ success: true });
  });

  // Generator Months
  app.get("/api/env/generator-months", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_generator_months WHERE user_id = ${req.session.userId} ORDER BY month DESC LIMIT 24`);
    res.json(rows.rows);
  });

  app.post("/api/env/generator-months", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      INSERT INTO env_generator_months (user_id, month, waste_kg, waste_type, notes)
      VALUES (${req.session.userId}, ${d.month}, ${d.wasteKg??0}, ${d.wasteType??null}, ${d.notes??null})
      ON CONFLICT DO NOTHING RETURNING *
    `);
    res.status(201).json(rows.rows[0] ?? { message: "Month already exists" });
  });

  // SPCC Tanks
  app.get("/api/env/spcc-tanks", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_spcc_tanks WHERE user_id = ${req.session.userId} ORDER BY created_at DESC`);
    res.json(rows.rows);
  });

  app.post("/api/env/spcc-tanks", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      INSERT INTO env_spcc_tanks (user_id, tank_name, location, content_type, capacity_gallons, has_secondary_containment, containment_capacity_gallons, is_aboveground, is_active, notes)
      VALUES (${req.session.userId}, ${d.tankName}, ${d.location??null}, ${d.contentType??null}, ${d.capacityGallons??null}, ${d.hasSecondaryContainment??false}, ${d.containmentCapacityGallons??null}, ${d.isAboveground??true}, ${d.isActive??true}, ${d.notes??null})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  });

  app.delete("/api/env/spcc-tanks/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`DELETE FROM env_spcc_tanks WHERE id = ${req.params.id} AND user_id = ${req.session.userId}`);
    res.json({ success: true });
  });

  // SPCC Inspections
  app.get("/api/env/spcc-inspections", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_spcc_inspections WHERE user_id = ${req.session.userId} ORDER BY inspected_date DESC LIMIT 50`);
    res.json(rows.rows);
  });

  app.post("/api/env/spcc-inspections", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const coreChecks = [d.tankIntegrity, d.containmentIntegrity, d.noLeaksOrSpills, d.valvesOperable];
    const extChecks = [d.overfillProtectionOk, d.levelGaugeOk, d.responseEquipOk, d.spillKitOk, d.drainageValveClosed].filter(v => v !== null && v !== undefined);
    const allChecks = [...coreChecks, ...extChecks];
    const pass = allChecks.every(v => v !== false);
    const rows = await db.execute(sql`
      INSERT INTO env_spcc_inspections (user_id, tank_id, inspected_date, inspected_by, inspection_type,
        tank_integrity, containment_integrity, no_leaks_or_spills, valves_operable,
        overfill_protection_ok, level_gauge_ok, response_equip_ok, spill_kit_ok, drainage_valve_closed,
        findings, pass)
      VALUES (${req.session.userId}, ${d.tankId??null}, ${d.inspectedDate}, ${d.inspectedBy??null}, ${d.inspectionType??'monthly'},
        ${d.tankIntegrity??null}, ${d.containmentIntegrity??null}, ${d.noLeaksOrSpills??null}, ${d.valvesOperable??null},
        ${d.overfillProtectionOk??null}, ${d.levelGaugeOk??null}, ${d.responseEquipOk??null}, ${d.spillKitOk??null}, ${d.drainageValveClosed??null},
        ${d.findings??null}, ${pass})
      RETURNING *
    `);
    if (d.tankId) {
      const typeCol = d.inspectionType === 'annual' || d.inspectionType === 'pe_certification' || d.inspectionType === 'integrity_test'
        ? sql`last_annual_inspection = ${d.inspectedDate}, last_inspection_date = ${d.inspectedDate}`
        : sql`last_monthly_inspection = ${d.inspectedDate}, last_inspection_date = ${d.inspectedDate}`;
      await db.execute(sql`UPDATE env_spcc_tanks SET ${typeCol} WHERE id = ${d.tankId} AND user_id = ${req.session.userId}`);
    }
    res.status(201).json(rows.rows[0]);
  });

  // Stormwater Monitoring
  app.get("/api/env/stormwater-monitoring", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_stormwater_monitoring WHERE user_id = ${req.session.userId} ORDER BY monitoring_date DESC`);
    res.json(rows.rows);
  });

  app.post("/api/env/stormwater-monitoring", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      INSERT INTO env_stormwater_monitoring (user_id, monitoring_type, monitoring_date, month, quarter, year, outfall_id, conducted_by, weather_conditions,
        color, odor, floating, sheen, turbidity,
        bmp_conditions_ok, drainage_areas_ok, control_structures_ok, housekeeping_ok, swppp_updated,
        other_observations, action_required, correction_taken)
      VALUES (${req.session.userId}, ${d.monitoringType??'quarterly_visual'}, ${d.monitoringDate}, ${d.month??null}, ${d.quarter??null}, ${d.year??null},
        ${d.outfallId??null}, ${d.conductedBy??null}, ${d.weatherConditions??null},
        ${d.color??null}, ${d.odor??null}, ${d.floating??false}, ${d.sheen??false}, ${d.turbidity??null},
        ${d.bmpConditionsOk??null}, ${d.drainageAreasOk??null}, ${d.controlStructuresOk??null}, ${d.housekeepingOk??null}, ${d.swpppUpdated??null},
        ${d.otherObservations??null}, ${d.actionRequired??false}, ${d.correctionTaken??null})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  });

  app.delete("/api/env/stormwater-monitoring/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`DELETE FROM env_stormwater_monitoring WHERE id = ${req.params.id} AND user_id = ${req.session.userId}`);
    res.json({ success: true });
  });

  // Air Permits
  app.get("/api/env/air-permits", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_air_permits WHERE user_id = ${req.session.userId} ORDER BY created_at DESC`);
    res.json(rows.rows);
  });

  app.post("/api/env/air-permits", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const rows = await db.execute(sql`
      INSERT INTO env_air_permits (user_id, permit_number, permit_type, issuing_agency, issue_date, expiration_date, renewal_lead_days, description, conditions, status)
      VALUES (${req.session.userId}, ${d.permitNumber}, ${d.permitType??null}, ${d.issuingAgency??null}, ${d.issueDate??null}, ${d.expirationDate??null}, ${d.renewalLeadDays??180}, ${d.description??null}, ${d.conditions??null}, ${d.status??'active'})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  });

  app.delete("/api/env/air-permits/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`DELETE FROM env_air_permits WHERE id = ${req.params.id} AND user_id = ${req.session.userId}`);
    res.json({ success: true });
  });

  // Opacity Logs
  app.get("/api/env/opacity-logs", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const rows = await db.execute(sql`SELECT * FROM env_opacity_logs WHERE user_id = ${req.session.userId} ORDER BY log_date DESC LIMIT 50`);
    res.json(rows.rows);
  });

  app.post("/api/env/opacity-logs", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const d = req.body;
    const pass = (d.opacityPercent ?? 100) < 20;
    const rows = await db.execute(sql`
      INSERT INTO env_opacity_logs (user_id, log_date, source_id, observer_name, opacity_percent, duration, pass, weather_conditions, notes)
      VALUES (${req.session.userId}, ${d.logDate}, ${d.sourceId??null}, ${d.observerName??null}, ${d.opacityPercent??null}, ${d.duration??null}, ${pass}, ${d.weatherConditions??null}, ${d.notes??null})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  });

  // ─── Calibration helpers ─────────────────────────────────────────────────────

  function toCamel(str: string) {
    return str.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
  }
  function rowToCamel(row: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]));
  }

  // ─── Calibration Equipment ────────────────────────────────────────────────────

  app.get("/api/calibration/equipment", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    const rows = await storage.getCalibrationEquipment(req.session.userId, isSuperadmin, projectId);
    res.json(rows);
  });

  app.post("/api/calibration/equipment", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const d = req.body;
    const row = await storage.createCalibrationEquipment({
      userId: req.session.userId,
      isoProjectId: d.isoProjectId ?? null,
      gageId: d.gageId,
      name: d.name,
      type: d.type ?? null,
      manufacturer: d.manufacturer ?? null,
      model: d.model ?? null,
      serialNumber: d.serialNumber ?? null,
      location: d.location ?? null,
      responsiblePerson: d.responsiblePerson ?? null,
      responsibleEmail: d.responsibleEmail ?? null,
      measurementRange: d.measurementRange ?? null,
      resolution: d.resolution ?? null,
      tolerance: d.tolerance ?? null,
      calFrequencyMonths: d.calFrequencyMonths ?? 12,
      calType: d.calType ?? "external",
      calibrationLab: d.calibrationLab ?? null,
      traceableStandard: d.traceableStandard ?? "NIST",
      customerOwned: d.customerOwned ?? false,
      linkedDocumentId: d.linkedDocumentId ?? null,
      status: d.status ?? "active",
      nextDueDate: d.nextDueDate ?? null,
      notes: d.notes ?? null,
    });
    res.status(201).json(row);
  });

  app.patch("/api/calibration/equipment/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    const d = req.body;
    const row = await storage.updateCalibrationEquipment(Number(req.params.id), req.session.userId, {
      gageId: d.gageId,
      name: d.name,
      type: d.type ?? null,
      manufacturer: d.manufacturer ?? null,
      model: d.model ?? null,
      serialNumber: d.serialNumber ?? null,
      location: d.location ?? null,
      responsiblePerson: d.responsiblePerson ?? null,
      responsibleEmail: d.responsibleEmail ?? null,
      measurementRange: d.measurementRange ?? null,
      resolution: d.resolution ?? null,
      tolerance: d.tolerance ?? null,
      calFrequencyMonths: d.calFrequencyMonths ?? 12,
      calType: d.calType ?? "external",
      calibrationLab: d.calibrationLab ?? null,
      traceableStandard: d.traceableStandard ?? "NIST",
      customerOwned: d.customerOwned ?? false,
      linkedDocumentId: d.linkedDocumentId ?? null,
      status: d.status ?? "active",
      nextDueDate: d.nextDueDate ?? null,
      notes: d.notes ?? null,
    }, isSuperadmin);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });

  app.delete("/api/calibration/equipment/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    await storage.deleteCalibrationEquipment(Number(req.params.id), req.session.userId, isSuperadmin);
    res.json({ success: true });
  });

  // ─── Calibration Records ─────────────────────────────────────────────────────

  app.get("/api/calibration/records", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    const rows = await storage.getCalibrationRecords(req.session.userId, isSuperadmin, projectId);
    res.json(rows);
  });

  app.post("/api/calibration/records", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const d = req.body;
    const oot = d.result === "fail" || d.outOfTolerance === true;

    // IATF §7.1.5.3: if OOT and project is IATF, require OOT assessment in same request
    if (oot && d.isoProjectId) {
      const project = await storage.getIsoProjectById(Number(d.isoProjectId));
      if (project && /iatf\s*16949/i.test(project.standard ?? "")) {
        const ootData = d.ootAssessment as Record<string, string> | undefined;
        if (!ootData?.assessedBy?.trim()) {
          return res.status(422).json({ message: "IATF §7.1.5.3: OOT record requires 'assessedBy' in ootAssessment" });
        }
        if (!ootData?.disposition?.trim()) {
          return res.status(422).json({ message: "IATF §7.1.5.3: OOT record requires 'disposition' in ootAssessment" });
        }
      }
    }

    const { db: dbConn } = await import("./db");
    const { calibrationRecords: calRecTable, calibrationOotAssessments: calOotTable } = await import("@shared/schema");

    // Transactionally create record (+ OOT assessment if applicable)
    const record = await dbConn.transaction(async (tx) => {
      const [newRec] = await tx.insert(calRecTable).values({
        userId: req.session!.userId!,
        isoProjectId: d.isoProjectId ?? null,
        equipmentId: Number(d.equipmentId),
        calibrationDate: d.calibrationDate,
        performedBy: d.performedBy ?? null,
        certNumber: d.certNumber ?? null,
        standardsReferenced: Array.isArray(d.standardsReferenced) && d.standardsReferenced.length > 0
          ? d.standardsReferenced : null,
        result: d.result ?? "pass",
        outOfTolerance: oot,
        adjustmentsMade: d.adjustmentsMade ?? null,
        certificateFileUrl: d.certificateFileUrl ?? null,
        nextDueDate: d.nextDueDate ?? null,
        notes: d.notes ?? null,
        calType: d.calType ?? "external",
        labId: d.labId ?? null,
        scopeVerified: d.scopeVerified ?? false,
        scopeCitedItem: d.scopeCitedItem ?? null,
        preCalibrationChecks: d.preCalibrationChecks ?? null,
        environmentConditions: d.environmentConditions ?? null,
        referenceStandards: Array.isArray(d.referenceStandards) && d.referenceStandards.length > 0
          ? d.referenceStandards : null,
        measurementData: Array.isArray(d.measurementData) && d.measurementData.length > 0
          ? d.measurementData : null,
        measurementUncertainty: d.measurementUncertainty ?? null,
        asFoundReading: d.asFoundReading ?? null,
        asLeftReading: d.asLeftReading ?? null,
        labAccredited: d.labAccredited ?? null,
        acceptanceCriteria: d.acceptanceCriteria ?? null,
        equipmentLabelConfirmed: d.equipmentLabelConfirmed ?? false,
        softwareVerified: d.softwareVerified ?? false,
      }).returning();

      if (oot && d.ootAssessment) {
        const o = d.ootAssessment as Record<string, string>;
        await tx.insert(calOotTable).values({
          userId: req.session!.userId!,
          isoProjectId: d.isoProjectId ?? null,
          calibrationRecordId: newRec.id,
          equipmentId: Number(d.equipmentId),
          affectedProducts: o.affectedProducts ?? null,
          suspectDateStart: o.suspectDateStart ?? null,
          suspectDateEnd: o.suspectDateEnd ?? null,
          disposition: o.disposition ?? null,
          riskLevel: o.riskLevel ?? "medium",
          containmentActions: o.containmentActions ?? null,
          correctiveActionRef: o.correctiveActionRef ?? null,
          assessedBy: o.assessedBy ?? null,
          assessmentDate: o.assessmentDate ?? null,
          notes: o.notes ?? null,
        });
      }

      return newRec;
    });

    // Update equipment next_due_date (outside transaction — best-effort)
    if (d.nextDueDate) {
      await storage.updateCalibrationEquipment(Number(d.equipmentId), req.session.userId,
        { nextDueDate: d.nextDueDate }, false);
    }
    res.status(201).json(record);
  });

  app.patch("/api/calibration/records/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    const d = req.body;
    const oot = d.result === "fail" || d.outOfTolerance === true;

    // IATF §7.1.5.3: mirror POST validation for edits — require assessedBy + disposition
    if (oot && d.isoProjectId) {
      const project = await storage.getIsoProjectById(Number(d.isoProjectId));
      if (project && /iatf\s*16949/i.test(project.standard ?? "")) {
        const ootData = d.ootAssessment as Record<string, string> | undefined;
        if (!ootData?.assessedBy?.trim()) {
          return res.status(422).json({ message: "IATF §7.1.5.3: OOT record requires 'assessedBy' in ootAssessment" });
        }
        if (!ootData?.disposition?.trim()) {
          return res.status(422).json({ message: "IATF §7.1.5.3: OOT record requires 'disposition' in ootAssessment" });
        }
      }
    }

    const row = await storage.updateCalibrationRecord(Number(req.params.id), req.session.userId, {
      calibrationDate: d.calibrationDate,
      performedBy: d.performedBy ?? null,
      certNumber: d.certNumber ?? null,
      standardsReferenced: Array.isArray(d.standardsReferenced) && d.standardsReferenced.length > 0
        ? d.standardsReferenced : null,
      result: d.result ?? "pass",
      outOfTolerance: oot,
      adjustmentsMade: d.adjustmentsMade ?? null,
      certificateFileUrl: d.certificateFileUrl ?? null,
      nextDueDate: d.nextDueDate ?? null,
      notes: d.notes ?? null,
      calType: d.calType ?? "external",
      labId: d.labId ?? null,
      scopeVerified: d.scopeVerified ?? false,
      scopeCitedItem: d.scopeCitedItem ?? null,
      preCalibrationChecks: d.preCalibrationChecks ?? null,
      environmentConditions: d.environmentConditions ?? null,
      referenceStandards: Array.isArray(d.referenceStandards) && d.referenceStandards.length > 0
        ? d.referenceStandards : null,
      measurementData: Array.isArray(d.measurementData) && d.measurementData.length > 0
        ? d.measurementData : null,
      measurementUncertainty: d.measurementUncertainty ?? null,
      asFoundReading: d.asFoundReading ?? null,
      asLeftReading: d.asLeftReading ?? null,
      labAccredited: d.labAccredited ?? null,
      acceptanceCriteria: d.acceptanceCriteria ?? null,
      equipmentLabelConfirmed: d.equipmentLabelConfirmed ?? false,
      softwareVerified: d.softwareVerified ?? false,
    }, isSuperadmin);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });

  app.delete("/api/calibration/records/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    await storage.deleteCalibrationRecord(Number(req.params.id), req.session.userId, isSuperadmin);
    res.json({ success: true });
  });

  // ─── Calibration OOT Assessments ─────────────────────────────────────────────

  app.get("/api/calibration/oot-assessments", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    const rows = await storage.getCalibrationOotAssessments(req.session.userId, isSuperadmin, projectId);
    res.json(rows);
  });

  app.post("/api/calibration/oot-assessments", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const d = req.body;
    const row = await storage.createCalibrationOotAssessment({
      userId: req.session.userId,
      isoProjectId: d.isoProjectId ?? null,
      calibrationRecordId: Number(d.calibrationRecordId),
      equipmentId: Number(d.equipmentId),
      affectedProducts: d.affectedProducts ?? null,
      suspectDateStart: d.suspectDateStart ?? null,
      suspectDateEnd: d.suspectDateEnd ?? null,
      disposition: d.disposition ?? null,
      riskLevel: d.riskLevel ?? "medium",
      containmentActions: d.containmentActions ?? null,
      correctiveActionRef: d.correctiveActionRef ?? null,
      assessedBy: d.assessedBy ?? null,
      assessmentDate: d.assessmentDate ?? null,
      notes: d.notes ?? null,
    });
    res.status(201).json(row);
  });

  app.patch("/api/calibration/oot-assessments/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    const d = req.body;
    const row = await storage.updateCalibrationOotAssessment(Number(req.params.id), req.session.userId, {
      affectedProducts: d.affectedProducts ?? null,
      suspectDateStart: d.suspectDateStart ?? null,
      suspectDateEnd: d.suspectDateEnd ?? null,
      disposition: d.disposition ?? null,
      riskLevel: d.riskLevel ?? "medium",
      containmentActions: d.containmentActions ?? null,
      correctiveActionRef: d.correctiveActionRef ?? null,
      assessedBy: d.assessedBy ?? null,
      assessmentDate: d.assessmentDate ?? null,
      notes: d.notes ?? null,
    }, isSuperadmin);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });

  // ─── Calibration certificate upload ──────────────────────────────────────────

  const certStorage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (err: Error | null, dest: string) => void) => {
      const dir = path.join(process.cwd(), "uploads", "certificates");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `cert-${Date.now()}${ext}`);
    },
  });
  const CERT_ALLOWED_MIMES = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);
  const CERT_ALLOWED_EXTS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
  const certUpload = multer({
    storage: certStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (CERT_ALLOWED_MIMES.has(file.mimetype) && CERT_ALLOWED_EXTS.has(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF, JPEG, and PNG files are accepted for calibration certificates."));
      }
    },
  });

  // Authenticated download of a calibration certificate
  app.get("/api/calibration/records/:id/certificate", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
    const row = await storage.getCalibrationRecords(req.session.userId, isSuperadmin).then(
      rows => rows.find(r => r.id === Number(req.params.id))
    );
    if (!row) return res.status(404).json({ message: "Record not found or access denied" });
    if (!row.certificateFileUrl) return res.status(404).json({ message: "No certificate attached" });
    // certificateFileUrl is stored as /uploads/certificates/filename
    const filePath = path.resolve(process.cwd(), row.certificateFileUrl.replace(/^\//, ""));
    const safeBase = path.resolve(process.cwd(), "uploads", "certificates");
    if (!filePath.startsWith(safeBase)) return res.status(403).json({ message: "Forbidden" });
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.sendFile(filePath);
  });

  app.post(
    "/api/calibration/records/:id/certificate",
    (req: Request, res: Response, next: import("express").NextFunction) => {
      if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
      next();
    },
    (req: Request, res: Response, next: import("express").NextFunction) => {
      certUpload.single("file")(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message ?? "File upload error" });
        next();
      });
    },
    async (req: Request, res: Response) => {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const isSuperadmin = (req.user as { isSuperadmin?: boolean })?.isSuperadmin ?? false;
      const certUrl = `/uploads/certificates/${req.file.filename}`;
      await storage.updateCalibrationRecord(
        Number(req.params.id),
        req.session!.userId!,
        { certificateFileUrl: certUrl },
        isSuperadmin,
      );
      res.json({ certificateFileUrl: certUrl });
    },
  );

  // ─── Calibration reminder check (called by frontend on module load) ──────────

  app.post("/api/calibration/check-reminders", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    const { sendEmail, brandedHtml } = await import("./emailService");

    interface ReminderEquipRow {
      id: number;
      name: string;
      gage_id: string;
      location: string | null;
      next_due_date: string;
      responsible_person: string | null;
      responsible_email: string | null;
      cal_type: string | null;
      calibration_lab: string | null;
    }
    interface OwnerRow { email: string | null; }

    const today = new Date();
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 30);
    const throttle = new Date(today); throttle.setDate(throttle.getDate() - 7);

    const rows = await db.execute(sql`
      SELECT * FROM calibration_equipment
      WHERE user_id = ${req.session.userId}
        AND status = 'active'
        AND next_due_date IS NOT NULL
        AND next_due_date <= ${cutoff.toISOString().split("T")[0]}
        AND (last_reminder_sent_at IS NULL OR last_reminder_sent_at < ${throttle.toISOString()})
    `);

    // Fetch account owner email
    const ownerRows = await db.execute(sql`SELECT email FROM users WHERE id = ${req.session.userId}`);
    const ownerEmail: string | null = (ownerRows.rows[0] as OwnerRow)?.email ?? null;

    let sent = 0;
    for (const eq of rows.rows as ReminderEquipRow[]) {
      const dueDate = new Date(eq.next_due_date);
      const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
      const subject = daysLeft <= 0
        ? `⚠️ Calibration OVERDUE: ${eq.name} (${eq.gage_id})`
        : `📅 Calibration Due in ${daysLeft} days: ${eq.name} (${eq.gage_id})`;

      const body = `
        <h2 style="color:#1e3a5f;margin:0 0 16px">Calibration ${daysLeft <= 0 ? "Overdue" : "Reminder"}</h2>
        <p>The following measuring equipment requires calibration attention:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
          <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;width:40%">Equipment</td><td style="padding:8px;">${eq.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Gage ID</td><td style="padding:8px;">${eq.gage_id}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Location</td><td style="padding:8px;">${eq.location ?? "—"}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Calibration Due</td>
            <td style="padding:8px;color:${daysLeft <= 0 ? "#dc2626" : daysLeft <= 7 ? "#d97706" : "#16a34a"};font-weight:bold;">
              ${eq.next_due_date}${daysLeft <= 0 ? " (OVERDUE)" : ` (${daysLeft} days)`}
            </td>
          </tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Responsible</td><td style="padding:8px;">${eq.responsible_person ?? "—"}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Calibration Type</td><td style="padding:8px;">${eq.cal_type === "internal" ? "Internal" : "External"}</td></tr>
          ${eq.calibration_lab ? `<tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Lab</td><td style="padding:8px;">${eq.calibration_lab}</td></tr>` : ""}
        </table>
        <p style="color:#6b7280;font-size:13px;">Please schedule calibration per your quality system procedures (ISO 9001 §7.1.5 / IATF 16949 §7.1.5.3).</p>
      `;

      const recipients: string[] = [];
      if (eq.responsible_email) recipients.push(eq.responsible_email);
      if (ownerEmail && ownerEmail !== eq.responsible_email) recipients.push(ownerEmail);

      let anySent = false;
      for (const to of recipients) {
        const ok = await sendEmail(to, subject, brandedHtml(subject, body));
        if (ok) anySent = true;
      }
      if (anySent) {
        await db.execute(sql`
          UPDATE calibration_equipment SET last_reminder_sent_at = NOW()
          WHERE id = ${eq.id} AND user_id = ${req.session.userId}
        `);
        sent++;
      }
    }
    res.json({ sent, checked: rows.rows.length });
  });

  // ── Calibration Labs ─────────────────────────────────────────────────────────

  app.get("/api/calibration/labs", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isoProjectId = req.query.isoProjectId ? Number(req.query.isoProjectId) : undefined;
    const labs = await storage.getCalibrationLabs(req.session.userId, req.user?.claims?.isSuperadmin, isoProjectId);
    res.json(labs);
  });

  app.post("/api/calibration/labs", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const lab = await storage.createCalibrationLab({ ...req.body, userId: req.session.userId });
    res.status(201).json(lab);
  });

  app.patch("/api/calibration/labs/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    const updated = await storage.updateCalibrationLab(id, req.session.userId, req.body, req.user?.claims?.isSuperadmin);
    if (!updated) return res.status(404).json({ message: "Lab not found" });
    res.json(updated);
  });

  app.delete("/api/calibration/labs/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    await storage.deleteCalibrationLab(id, req.session.userId, req.user?.claims?.isSuperadmin);
    res.json({ success: true });
  });

  // ISO 17025 cert upload/download for a lab
  const labCertStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), "uploads", "lab-certs");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `lab-cert-${Date.now()}${ext}`);
    },
  });
  const labCertUpload = multer({
    storage: labCertStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowed = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
      if (allowed.has(ext)) cb(null, true);
      else cb(new Error("Only PDF, JPEG, and PNG files are accepted"));
    },
  });

  app.get("/api/calibration/labs/:id/iso17025", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    const labs = await storage.getCalibrationLabs(req.session.userId, req.user?.claims?.isSuperadmin);
    const lab = labs.find(l => l.id === id);
    if (!lab || !lab.iso17025CertUrl) return res.status(404).json({ message: "No certificate on file" });
    const filePath = path.resolve(process.cwd(), lab.iso17025CertUrl.replace(/^\//, ""));
    const safeBase = path.resolve(process.cwd(), "uploads", "lab-certs");
    if (!filePath.startsWith(safeBase)) return res.status(403).json({ message: "Forbidden" });
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.sendFile(filePath);
  });

  app.post("/api/calibration/labs/:id/iso17025", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    labCertUpload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const fileUrl = `/uploads/lab-certs/${req.file.filename}`;
      const updated = await storage.updateCalibrationLab(id, req.session!.userId!, { iso17025CertUrl: fileUrl }, req.user?.claims?.isSuperadmin);
      if (!updated) return res.status(404).json({ message: "Lab not found" });
      res.json({ iso17025CertUrl: fileUrl });
    });
  });

  // ─── Internal Lab Scope (IATF §7.1.5.3.1) ───────────────────────────────────
  app.get("/api/calibration/lab-scope", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isoProjectId = req.query.isoProjectId ? Number(req.query.isoProjectId) : null;
    const scope = await storage.getLabScope(req.session.userId, req.user?.claims?.isSuperadmin, isoProjectId);
    res.json(scope ?? null);
  });

  app.put("/api/calibration/lab-scope", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isoProjectId = req.body.isoProjectId != null ? Number(req.body.isoProjectId) : null;
    const { isoProjectId: _pid, ...data } = req.body;
    const scope = await storage.upsertLabScope(req.session.userId, isoProjectId, data);
    res.json(scope);
  });

  // ─── Preventive Maintenance ──────────────────────────────────────────────────

  app.get("/api/pm/equipment", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as any)?.isSuperadmin ?? false;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    const rows = await storage.getPmEquipment(req.session.userId, isSuperadmin, projectId);
    res.json(rows);
  });

  app.post("/api/pm/equipment", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const d = req.body;
    const { userId: _u, id: _id, createdAt: _c, ...rest } = d;
    const row = await storage.createPmEquipment({
      ...rest,
      userId: req.session.userId,
      isoProjectId: d.isoProjectId ?? null,
      equipmentId: d.equipmentId,
      name: d.name,
      frequencyType: d.frequencyType ?? "monthly",
      frequencyDays: d.frequencyDays != null ? Number(d.frequencyDays) : 30,
      status: d.status ?? "active",
    });
    res.status(201).json(row);
  });

  app.patch("/api/pm/equipment/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as any)?.isSuperadmin ?? false;
    const { userId: _u, id: _id, createdAt: _c, ...d } = req.body;
    const row = await storage.updatePmEquipment(Number(req.params.id), req.session.userId, {
      ...d,
      frequencyDays: d.frequencyDays != null ? Number(d.frequencyDays) : undefined,
    }, isSuperadmin);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });

  app.delete("/api/pm/equipment/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as any)?.isSuperadmin ?? false;
    await storage.deletePmEquipment(Number(req.params.id), req.session.userId, isSuperadmin);
    res.json({ success: true });
  });

  app.get("/api/pm/records", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as any)?.isSuperadmin ?? false;
    const projectId = req.query.projectId ? Number(req.query.projectId) : null;
    const rows = await storage.getPmRecords(req.session.userId, isSuperadmin, projectId);
    res.json(rows);
  });

  app.post("/api/pm/records", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const { userId: _u, id: _id, createdAt: _c, ...d } = req.body;
    const row = await storage.createPmRecord({
      ...d,
      userId: req.session.userId,
      isoProjectId: d.isoProjectId ?? null,
      equipmentId: Number(d.equipmentId),
      pmDate: d.pmDate,
      result: d.result ?? "completed",
    });
    // Auto-update equipment's lastPmDate + nextDueDate
    if (d.pmDate || d.nextDueDate) {
      await storage.updatePmEquipment(Number(d.equipmentId), req.session.userId, {
        lastPmDate: d.pmDate,
        nextDueDate: d.nextDueDate ?? null,
      }, false);
    }
    res.status(201).json(row);
  });

  app.patch("/api/pm/records/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as any)?.isSuperadmin ?? false;
    const { userId: _u, id: _id, createdAt: _c, ...d } = req.body;
    const row = await storage.updatePmRecord(Number(req.params.id), req.session.userId, {
      ...d,
      equipmentId: d.equipmentId != null ? Number(d.equipmentId) : undefined,
    }, isSuperadmin);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });

  app.delete("/api/pm/records/:id", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Unauthorized" });
    const isSuperadmin = (req.user as any)?.isSuperadmin ?? false;
    await storage.deletePmRecord(Number(req.params.id), req.session.userId, isSuperadmin);
    res.json({ success: true });
  });

  return httpServer;
}
