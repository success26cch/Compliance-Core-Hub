import type { Express, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { chatStorage } from "./storage";
import { storage } from "../../storage";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const FREE_QUESTION_LIMIT = 3;
const LANDING_BOT_LIMIT = 3;
const trialUsage = new Map<string, boolean>();
const landingBotUsage = new Map<string, { count: number; messages: Array<{ role: string; content: string }> }>();

// Admin users get unlimited access (set via environment variable)
// Format: comma-separated user IDs, emails, or usernames
const ADMIN_USERS = (process.env.ADMIN_USERS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

function isAdmin(user: any): boolean {
  if (!user?.claims) return false;
  const userId = user.claims.sub;
  const email = (user.claims.email || "").toLowerCase();
  const username = (user.claims.name || user.claims.preferred_username || "").toLowerCase();
  return ADMIN_USERS.includes(userId) || ADMIN_USERS.includes(email) || ADMIN_USERS.includes(username);
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
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

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Trial question - 1 free question without login (rate limited by session)
  app.post("/api/trial-question", async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Question is required" });
      }

      // Rate limit by IP - store in memory
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (trialUsage.has(clientIp)) {
        return res.status(403).json({ 
          error: "You've used your free trial question. Sign up to keep asking!",
          limitReached: true 
        });
      }
      trialUsage.set(clientIp, true);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: "You are a Senior Occupational Health & Safety Compliance Expert. You specialize in OSHA 29 CFR 1904 recordkeeping, DOT FMCSA 49 CFR Part 40 drug & alcohol testing, and workplace safety compliance. Provide clear, concise, and helpful answers. This is a free trial question, so keep the answer focused but demonstrate your expertise. End your response by encouraging them to sign up for more detailed consultations.",
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
      const { content, history } = req.body;
      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Question is required" });
      }

      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      let session = landingBotUsage.get(clientIp);
      if (!session) {
        session = { count: 0, messages: [] };
        landingBotUsage.set(clientIp, session);
      }

      if (session.count >= LANDING_BOT_LIMIT) {
        return res.status(403).json({
          error: "You've reached the free question limit. Sign up to keep the conversation going!",
          limitReached: true,
          count: session.count,
          limit: LANDING_BOT_LIMIT,
        });
      }

      session.count++;
      session.messages.push({ role: "user", content: content.trim() });

      const conversationMessages = (history && Array.isArray(history) ? history : session.messages).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ remaining: LANDING_BOT_LIMIT - session.count })}\n\n`);

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: `You are the CCH Expert Bot — a Senior Occupational Health & Safety Compliance Expert powered by Core Compliance Hub. You specialize in OSHA 29 CFR 1904 recordkeeping, DOT FMCSA 49 CFR Part 40 drug & alcohol testing, and workplace safety compliance. You also have knowledge of ISO 9001, 14001, and 45001 management systems.

Be friendly, professional, and concise. Demonstrate deep expertise while keeping answers accessible. When appropriate, mention that CCH offers full AI-powered compliance tools, training courses, and ISO audit preparation.

This visitor is trying the free bot — give genuinely helpful answers to build trust.`,
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

      session.messages.push({ role: "assistant", content: assistantText });

      res.write(`data: ${JSON.stringify({ done: true, remaining: LANDING_BOT_LIMIT - session.count })}\n\n`);
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

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Check authentication and usage limits
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = (req.user as any).claims.sub;
      const sub = await storage.getSubscription(userId);
      const isPro = sub?.status === "active";
      const userIsAdmin = isAdmin(req.user);
      
      // Admins and Pro users bypass limits
      if (!isPro && !userIsAdmin) {
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

      // Increment question count for non-pro, non-admin users
      if (!isPro && !userIsAdmin) {
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

      // Stream response from Anthropic
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
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

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

