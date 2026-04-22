import type { Express, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import path from "path";
import { chatStorage } from "./storage";
import { storage } from "../../storage";
import { CCH_SYSTEM_PROMPT, CCH_TRIAL_SYSTEM_PROMPT, CCH_LANDING_SYSTEM_PROMPT } from "./systemPrompt";
import { ISA_SYSTEM_PROMPT } from "./isaSystemPrompt";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const FREE_QUESTION_LIMIT = 3;
const LANDING_BOT_LIMIT = 3;
const TRIAL_QUESTION_LIMIT = 1;

// Hardcoded platform admins — always get unlimited access regardless of env vars or DB flags
const HARDCODED_ADMIN_EMAILS = [
  "raulv9471@gmail.com",
  "raul@corecompliancehub.com",
  "evillarreal@acsi-quality.com",
  "team@corecompliancehub.com",
];

// Admin users get unlimited access — checked against hardcoded list + optional env var
const ALL_ADMIN_EMAILS = [
  ...HARDCODED_ADMIN_EMAILS,
  ...(process.env.ADMIN_USERS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
];

function isAdmin(user: any): boolean {
  if (!user?.claims) return false;
  const userId = (user.claims.sub || "").toLowerCase();
  const email = (user.claims.email || "").toLowerCase();
  const username = (user.claims.name || user.claims.preferred_username || "").toLowerCase();
  return ALL_ADMIN_EMAILS.includes(userId) || ALL_ADMIN_EMAILS.includes(email) || ALL_ADMIN_EMAILS.includes(username);
}

async function isAdminOrSuperadmin(user: any): Promise<boolean> {
  if (isAdmin(user)) return true;
  if (!user?.claims?.sub) return false;
  const dbUser = await storage.getUserById(user.claims.sub);
  return dbUser?.isSuperadmin === true;
}

// ─── TOPIC DETECTION ─────────────────────────────────────────────────────────
function detectTopic(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(osha 300|300a|300 log|recordable|recordability|recordkeeping|trir|dart|first aid|medical treatment)\b/.test(lower)) return "OSHA Recordkeeping";
  if (/\b(dot|cdl|fmcsa|drug test|drug screen|pre.?employ|random test|post.?accident|reasonable suspicion|breathalyzer|mro|dea|physical exam|dot physical|medical examiner)\b/.test(lower)) return "DOT / Drug Testing";
  if (/\b(iso 9001|iso 14001|iso 45001|iso 13485|iso 27001|as9100|iatf|iso audit|gap analysis|quality manual|quality management|nonconform|ncr|corrective action plan|capa|management review|internal audit)\b/.test(lower)) return "ISO / Audit";
  if (/\b(incident|injury|near miss|investigation|root cause|5 why|corrective action|capa|accident report)\b/.test(lower)) return "Incident Investigation";
  if (/\b(workers.? comp|work comp|claim|return to work|modified duty|light duty|temporary restriction|disability)\b/.test(lower)) return "Workers Compensation";
  if (/\b(hazcom|ghs|sds|msds|right to know|chemical safety|chemical spill|hazardous material|haz mat)\b/.test(lower)) return "Hazard Communication";
  if (/\b(ppe|personal protective equipment|hard hat|safety glasses|respirator|gloves|safety shoes|hearing protection)\b/.test(lower)) return "PPE / Safety Equipment";
  if (/\b(emergency|evacuation|fire|spill response|shelter.in.place|emergency action plan|eap)\b/.test(lower)) return "Emergency Response";
  if (/\b(training|lms|certificate|onboard|new hire|safety orientation|toolbox|tailgate)\b/.test(lower)) return "Safety Training";
  if (/\b(lockout|tagout|loto|energized|machine guard|confined space|hot work|permit)\b/.test(lower)) return "Permit / Lockout-Tagout";
  return null;
}

function detectComplianceDecision(text: string): boolean {
  const lower = text.toLowerCase();
  const decisionPhrases = [
    "is recordable", "is not recordable", "does not meet the threshold", "meets the definition",
    "is required by", "is not required", "must be recorded", "does not need to be recorded",
    "qualifies as", "does not qualify", "first aid only", "medical treatment",
    "work-related", "not work-related", "days away", "restricted duty",
    "osha requires", "29 cfr", "49 cfr", "this is a violation", "not a violation",
    "is compliant", "is not compliant", "based on 29 cfr", "under 29 cfr",
    "the answer is yes", "the answer is no", "this would be recordable", "this would not be recordable",
  ];
  return decisionPhrases.some(phrase => lower.includes(phrase));
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations (auth required - user-scoped)
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Each Corey subscription is personal and cannot be shared." });
      }
      const userId = (req.user as any).claims.sub;
      const conversations = await chatStorage.getAllConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Topic breakdown must be BEFORE /:id so it is not matched as an ID
  app.get("/api/conversations/topic-breakdown", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const breakdown = await chatStorage.getTopicBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching topic breakdown:", error);
      res.status(500).json({ error: "Failed to fetch topic breakdown" });
    }
  });

  // Get single conversation with messages (auth required - user-scoped)
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      const conversation = await chatStorage.getConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation (auth required - user-scoped)
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat", userId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Rename conversation (auth required - user-scoped)
  app.patch("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required" });
      }
      await chatStorage.updateConversationTitle(id, title, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error renaming conversation:", error);
      res.status(500).json({ error: "Failed to rename conversation" });
    }
  });

  // Delete conversation (auth required - user-scoped)
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Trial question - 1 free question without login (tracked by email in DB)
  app.post("/api/trial-question", async (req: Request, res: Response) => {
    try {
      const { content, name, email } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Question is required" });
      }
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required to try Corey" });
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required to try Corey" });
      }

      let trialLead = await storage.getTrialLeadByEmail(email);
      if (trialLead && trialLead.questionCount >= TRIAL_QUESTION_LIMIT) {
        return res.status(403).json({ 
          error: "You've used your free trial question. Sign up to keep asking!",
          limitReached: true 
        });
      }

      if (!trialLead) {
        trialLead = await storage.createTrialLead({ name: name.trim(), email: email.trim() });
      }
      await storage.incrementTrialQuestionCount(email);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: CCH_TRIAL_SYSTEM_PROMPT,
        messages: [{ role: "user", content: content.trim() }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in trial question:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process question" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process question" });
      }
    }
  });

  app.post("/api/landing-bot", async (req: Request, res: Response) => {
    try {
      const { content, history, name, email } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Question is required" });
      }
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required to chat with Corey" });
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required to chat with Corey" });
      }

      let trialLead = await storage.getTrialLeadByEmail(email);
      if (!trialLead) {
        trialLead = await storage.createTrialLead({ name: name.trim(), email: email.trim() });
      }

      if (trialLead.questionCount >= LANDING_BOT_LIMIT) {
        return res.status(403).json({
          error: "You've reached the free question limit. Sign up to keep the conversation going!",
          limitReached: true,
          count: trialLead.questionCount,
          limit: LANDING_BOT_LIMIT,
        });
      }

      const updatedLead = await storage.incrementTrialQuestionCount(email);
      const newCount = updatedLead?.questionCount ?? (trialLead.questionCount + 1);

      const conversationMessages = (history && Array.isArray(history) ? history : []).concat([{ role: "user", content: content.trim() }]).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const remaining = Math.max(0, LANDING_BOT_LIMIT - newCount);
      res.write(`data: ${JSON.stringify({ remaining })}\n\n`);

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: CCH_LANDING_SYSTEM_PROMPT,
        messages: conversationMessages,
      });

      let assistantText = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) {
            assistantText += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, remaining })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in landing bot:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process question" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process question" });
      }
    }
  });

  // Landing trial bot for Isa (ISO auditor) — same 3-question limit, Isa's persona
  app.post("/api/landing-isa-bot", async (req: Request, res: Response) => {
    try {
      const { content, history, name, email } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Question is required" });
      }
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required to chat with Isa" });
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required to chat with Isa" });
      }

      let trialLead = await storage.getTrialLeadByEmail(email);
      if (!trialLead) {
        trialLead = await storage.createTrialLead({ name: name.trim(), email: email.trim() });
      }

      if (trialLead.questionCount >= LANDING_BOT_LIMIT) {
        return res.status(403).json({
          error: "You've reached the free question limit. Sign up to keep the conversation going!",
          limitReached: true,
          count: trialLead.questionCount,
          limit: LANDING_BOT_LIMIT,
        });
      }

      const updatedLead = await storage.incrementTrialQuestionCount(email);
      const newCount = updatedLead?.questionCount ?? (trialLead.questionCount + 1);

      const conversationMessages = (history && Array.isArray(history) ? history : []).concat([{ role: "user", content: content.trim() }]).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const remaining = Math.max(0, LANDING_BOT_LIMIT - newCount);
      res.write(`data: ${JSON.stringify({ remaining })}\n\n`);

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: ISA_SYSTEM_PROMPT,
        messages: conversationMessages,
      });

      let assistantText = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) {
            assistantText += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, remaining })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in landing Isa bot:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process question" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process question" });
      }
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Check authentication and usage limits
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required. Each Corey subscription is personal." });
      }
      
      const userId = (req.user as any).claims.sub;
      
      // Verify this conversation belongs to the authenticated user
      const conversation = await chatStorage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const sub = await storage.getSubscription(userId);
      const isPro = sub?.status === "active";
      const userIsAdmin = await isAdminOrSuperadmin(req.user);
      
      let isTeamMember = false;
      if (!isPro && !userIsAdmin) {
        const membership = await storage.getTeamMembership(userId);
        if (membership) {
          isTeamMember = true;
        }
      }
      const hasAccess = isPro || userIsAdmin || isTeamMember;
      
      // Users with access bypass limits
      if (!hasAccess) {
        const usage = await storage.getQuestionUsage(userId);
        if ((usage?.questionCount || 0) >= FREE_QUESTION_LIMIT) {
          return res.status(403).json({ 
            error: "Free question limit reached",
            limitReached: true,
            questionCount: usage?.questionCount || 0,
            freeLimit: FREE_QUESTION_LIMIT 
          });
        }
      }

      // Increment question count for users without access
      if (!hasAccess) {
        await storage.incrementQuestionCount(userId);
      }

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Build personalized system prompt with subscriber profile context
      const coreyProfile = await storage.getCoreyProfile(userId);
      let finalSystemPrompt = CCH_SYSTEM_PROMPT;
      if (coreyProfile && (coreyProfile.companyName || coreyProfile.preferredName)) {
        const profileBlock = [
          "═══════════════════════════════════════════════════",
          "SUBSCRIBER PROFILE — Personalize every response using this context:",
          `Preferred Name: ${coreyProfile.preferredName || "Not provided"}`,
          `Company: ${coreyProfile.companyName || "Not provided"}`,
          `Role: ${coreyProfile.role || "Not provided"}`,
          `Industry: ${coreyProfile.industry || "Not provided"}`,
          `Employee Count: ${coreyProfile.employeeCount || "Not provided"}`,
          `State: ${coreyProfile.state || "Not provided"}`,
          `Primary Compliance Concerns: ${(coreyProfile.complianceFocus || []).join(", ") || "Not provided"}`,
          `MANDATORY PERSONALIZATION RULES: (1) You are speaking with ${coreyProfile.preferredName || "this subscriber"} — use their name naturally in conversation, especially at the start of your first response (e.g., "Great question, ${coreyProfile.preferredName}!" or "Hi ${coreyProfile.preferredName}, here's what you need to know..."). (2) Continue addressing them by name throughout — aim for at least once per response. (3) Tailor ALL regulatory citations, thresholds, and examples to their specific industry, employee count, and state. (4) Proactively connect answers to their stated compliance priorities. (5) Build on prior conversation context — remember what they've shared and reference it when relevant.`,
          "═══════════════════════════════════════════════════",
          "",
        ].join("\n");
        finalSystemPrompt = profileBlock + CCH_SYSTEM_PROMPT;
      }

      // Stream response from Anthropic
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: finalSystemPrompt,
        messages: chatMessages,
      });

      let fullResponse = "";

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const content = event.delta.text;
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }

      // Detect topic from first user message and tag conversation
      const firstUserMsg = chatMessages.find(m => m.role === "user");
      if (firstUserMsg && !conversation.topic) {
        const detectedTopic = detectTopic(firstUserMsg.content);
        if (detectedTopic) {
          await chatStorage.updateConversationTopic(conversationId, detectedTopic);
        }
      }

      // Detect compliance decision in assistant response
      const isDecision = detectComplianceDecision(fullResponse);

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse, isDecision);

      res.write(`data: ${JSON.stringify({ done: true, isComplianceDecision: isDecision })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // ─── TOPIC & INSIGHTS ROUTES ─────────────────────────────────────────────

  app.get("/api/conversations/topic-breakdown", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const breakdown = await chatStorage.getTopicBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching topic breakdown:", error);
      res.status(500).json({ error: "Failed to fetch topic breakdown" });
    }
  });

  app.get("/api/compliance-decisions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const decisions = await chatStorage.getComplianceDecisions(userId);
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching compliance decisions:", error);
      res.status(500).json({ error: "Failed to fetch compliance decisions" });
    }
  });

  app.get("/api/pinned-guidance", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const pins = await chatStorage.getPinnedGuidance(userId);
      res.json(pins);
    } catch (error) {
      console.error("Error fetching pinned guidance:", error);
      res.status(500).json({ error: "Failed to fetch pinned guidance" });
    }
  });

  app.post("/api/pinned-guidance", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const { conversationId, messageId, topic, summary, messageContent } = req.body;
      if (!conversationId || messageId == null || !topic || !summary) {
        return res.status(400).json({ error: "conversationId, messageId, topic, and summary are required" });
      }
      const pin = await chatStorage.pinGuidance({ userId, conversationId, messageId, topic, summary, messageContent });
      res.status(201).json(pin);
    } catch (error) {
      console.error("Error pinning guidance:", error);
      res.status(500).json({ error: "Failed to pin guidance" });
    }
  });

  app.delete("/api/pinned-guidance/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      await chatStorage.unpinGuidance(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unpinning guidance:", error);
      res.status(500).json({ error: "Failed to unpin guidance" });
    }
  });

  // ─── ISA (ISO MANAGER) ROUTES ────────────────────────────────────────────
  // Separate from Corey — uses ISA_SYSTEM_PROMPT exclusively

  app.get("/api/isa-conversations", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      // source query param lets callers filter: "standalone" (default for /isa page), "module" (ISOManager)
      // When no filter is passed from standalone Isa, show only standalone conversations
      const source = (req.query.source as string) ?? "standalone";
      const convs = await chatStorage.getAllConversations(userId + ":isa", source);
      res.json(convs);
    } catch (error) {
      console.error("Error fetching Isa conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/isa-conversations", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const { title, source } = req.body;
      const conversation = await chatStorage.createConversation(title || "New ISO Chat", userId + ":isa", source ?? "standalone");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating Isa conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/isa-conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id, userId + ":isa");
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching Isa conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.patch("/api/isa-conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required" });
      }
      await chatStorage.updateConversationTitle(id, title, userId + ":isa");
      res.json({ success: true });
    } catch (error) {
      console.error("Error renaming Isa conversation:", error);
      res.status(500).json({ error: "Failed to rename conversation" });
    }
  });

  app.delete("/api/isa-conversations/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }
      const userId = (req.user as any).claims.sub;
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id, userId + ":isa");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Isa conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/isa-conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required." });
      }

      const userId = (req.user as any).claims.sub;
      const conversation = await chatStorage.getConversation(conversationId, userId + ":isa");
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const sub = await storage.getSubscription(userId);
      const isPro = sub?.status === "active";
      const userIsAdmin = await isAdminOrSuperadmin(req.user);

      let isTeamMember = false;
      if (!isPro && !userIsAdmin) {
        const membership = await storage.getTeamMembership(userId);
        if (membership) isTeamMember = true;
      }
      const hasAccess = isPro || userIsAdmin || isTeamMember;

      if (!hasAccess) {
        const usage = await storage.getQuestionUsage(userId);
        if ((usage?.questionCount || 0) >= FREE_QUESTION_LIMIT) {
          return res.status(403).json({
            error: "Free question limit reached",
            limitReached: true,
            questionCount: usage?.questionCount || 0,
            freeLimit: FREE_QUESTION_LIMIT
          });
        }
      }

      if (!hasAccess) {
        await storage.incrementQuestionCount(userId);
      }

      await chatStorage.createMessage(conversationId, "user", content);

      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const ISA_BASE_RESTRICTION = `
TIER RESTRICTION — READ THIS FIRST, ENFORCE STRICTLY:

This user is on the Isa base plan ($129/mo). Their subscription covers ONLY these three standards:
  - ISO 9001:2015 (Quality Management)
  - ISO 14001:2015 (Environmental Management)
  - ISO 45001:2018 (Occupational Health & Safety)

The following standards are EXCLUSIVELY available on Isa Pro ($249/mo):
  - IATF 16949:2016 (Automotive Quality Management)
  - ISO 13485:2016 (Medical Devices)
  - AS9100 Rev D (Aerospace)
  - ISO/IEC 27001:2022 (Information Security)

RULE: If this user asks ANY question about IATF 16949, ISO 13485, AS9100, or ISO 27001 — including audit readiness, gap analysis, clause questions, nonconformances, customer-specific requirements, or any topic tied to those standards — you MUST:
1. Acknowledge their question in one sentence
2. Tell them this standard is covered by Isa Pro
3. Direct them to upgrade to Isa Pro at $249/mo via their account settings
4. Provide NO guidance, hints, clauses, or partial answers on the restricted standard

Example: "Great question — IATF 16949 guidance is available exclusively through Isa Pro ($249/mo), which covers all 7 specialized ISO management system standards. You can upgrade from your account settings to get full IATF audit support."

Do not apologize excessively. Be brief, professional, and redirect clearly. Then offer to help with ISO 9001, 14001, or 45001 instead.

---

`;

      const isoProject = await storage.getIsoProject(userId);
      const isaProfile = await storage.getIsaProfile(userId);
      let projectContext = "";
      if (isaProfile && !isoProject && (isaProfile.companyName || isaProfile.preferredName)) {
        projectContext = `
## ISA SUBSCRIBER PROFILE (Use this to personalize every response)
Preferred Name: ${isaProfile.preferredName || "Not provided"}
Company: ${isaProfile.companyName || "Not provided"}
Role: ${isaProfile.role || "Not provided"}
Selected Standards: ${(isaProfile.selectedStandards || []).join(", ") || "Not provided"}
Top Focus Areas: ${(isaProfile.focusAreas || []).join(", ") || "Not provided"}

MANDATORY PERSONALIZATION RULES: (1) You are speaking with ${isaProfile.preferredName || "this subscriber"} — use their name naturally, especially at the start of your first response. (2) Tailor all clause citations, examples, and audit scenarios to their selected standards. (3) Connect answers to their stated focus areas whenever relevant. (4) Build on prior conversation context.

---

`;
      }
      if (isoProject && isoProject.status === "complete") {
        const processList = (isoProject.processes || [])
          .map((p) => `  - ${p.name} | Owner: ${p.owner} | KPI: ${p.kpi} | Inputs: ${p.inputs} | Outputs: ${p.outputs} | Clauses: ${p.clauses.join(", ")}`)
          .join("\n");
        projectContext = `
## CLIENT ORGANIZATION CONTEXT (Active ISO Project — Use This as Your Baseline)
Standard: ${isoProject.standard}
Organization: ${isoProject.orgName || "Not specified"}
Address: ${isoProject.orgAddress || "Not specified"}
Total Employees: ${isoProject.totalEmployees || "?"} (${isoProject.productionEmployees || "?"} production / ${isoProject.adminEmployees || "?"} admin)
Products & Services: ${isoProject.productsServices || "Not specified"}
Manufacturing Technologies: ${(isoProject.manufacturingTech || []).join(", ") || "Not specified"}
Design Responsibility: ${isoProject.hasDesignResponsibility ? "Yes — Clause 8.3 is IN scope" : "No — Clause 8.3 is EXCLUDED from scope"}

## PROCESS ARCHITECTURE
${processList || "No processes defined yet."}

## QUALITY POLICY CONTEXT
Core Values: ${(isoProject.coreValues || []).join(", ") || "Not specified"}
Risk Philosophy: ${(isoProject.riskPhilosophy || []).join(", ") || "Not specified"}
OEM Suppliers (scope identification only): ${(isoProject.oemSuppliers || []).join(", ") || "N/A"}

## CRITICAL CSR RULE
The OEM supplier data above is for scope identification ONLY. Customer Specific Requirements (CSRs) are managed exclusively by CESAR — ACSI's dedicated CSR platform. Do NOT answer any CSR compliance questions. If asked about CSRs, redirect immediately to CESAR.

---
`;
      }

      const baseSystemPrompt = (isPro || userIsAdmin || isTeamMember)
        ? ISA_SYSTEM_PROMPT
        : ISA_BASE_RESTRICTION + ISA_SYSTEM_PROMPT;
      const systemPrompt = projectContext + baseSystemPrompt;

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: chatMessages,
      });

      let fullResponse = "";

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending Isa message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // ── Document text extraction for Isa analysis ────────────────────────────
  const docExtractUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  });

  app.post("/api/isa/extract-document",
    docExtractUpload.single("document"),
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const filename = req.file.originalname;
      const ext = path.extname(filename).toLowerCase();
      const buffer = req.file.buffer;
      let text = "";

      try {
        if (ext === ".pdf") {
          const pdfParse = (await import("pdf-parse")).default;
          const data = await pdfParse(buffer);
          text = data.text;
        } else if (ext === ".docx" || ext === ".doc") {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } else {
          // Plain text, markdown, CSV, JSON
          text = buffer.toString("utf-8");
        }

        // Normalize whitespace
        text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

        // Cap at 80,000 chars (~20K tokens) to avoid overflowing context
        const MAX_CHARS = 80000;
        const truncated = text.length > MAX_CHARS;
        if (truncated) text = text.slice(0, MAX_CHARS) + "\n\n[Document truncated — first 80,000 characters shown]";

        const wordCount = text.split(/\s+/).filter(Boolean).length;

        res.json({ filename, text, wordCount, charCount: text.length, truncated });
      } catch (err: any) {
        console.error("Document extraction error:", err?.message || err);
        res.status(500).json({ error: "Could not extract text from this file. Try saving as .docx or .txt and uploading again." });
      }
    }
  );
}

