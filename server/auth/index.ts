import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db } from "../db";
import { users, auditLogs } from "@shared/schema";
import { eq } from "drizzle-orm";

async function writeAuditLog(
  req: any,
  action: string,
  resource: string,
  resourceId: string | null,
  detail: string | null,
  statusCode: number,
) {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    await db.insert(auditLogs).values({
      userId: resourceId,
      action,
      resource,
      resourceId,
      ipAddress: ip,
      userAgent: req.headers["user-agent"]?.slice(0, 500) ?? null,
      statusCode,
      detail,
    });
  } catch { /* never block the request */ }
}

const scryptAsync = promisify(scrypt);

// ── Password hashing ──────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const keyBuf = Buffer.from(key, "hex");
  if (derived.length !== keyBuf.length) return false;
  return timingSafeEqual(derived, keyBuf);
}

// ── Session setup ─────────────────────────────────────────────────────────────

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// ── Auth middleware ───────────────────────────────────────────────────────────
// Patches req.isAuthenticated() and populates req.user.claims so every existing
// route using those patterns continues to work without modification.

export function authMiddleware(): RequestHandler {
  return (req: any, _res, next) => {
    const userId: string | undefined = req.session?.userId;
    const userEmail: string | undefined = req.session?.userEmail;

    req.isAuthenticated = () => !!userId;
    req.user = userId
      ? { claims: { sub: userId, email: userEmail ?? "" } }
      : undefined;

    next();
  };
}

// ── isAuthenticated guard ─────────────────────────────────────────────────────

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// ── Auth routes ───────────────────────────────────────────────────────────────

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(authMiddleware());
}

export function registerAuthRoutes(app: Express): void {
  // Register
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail));

      if (existing) {
        if (!existing.passwordHash) {
          // Pre-existing account from Replit Auth — allow setting a password for the first time
          const passwordHash = await hashPassword(password);
          const [updated] = await db
            .update(users)
            .set({
              passwordHash,
              firstName: firstName?.trim() || existing.firstName,
              lastName: lastName?.trim() || existing.lastName,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing.id))
            .returning();
          req.session.userId = updated.id;
          req.session.userEmail = updated.email ?? "";
          writeAuditLog(req, "register_password_set", "auth", updated.id, null, 200);
          return res.json({ id: updated.id, email: updated.email, firstName: updated.firstName, lastName: updated.lastName });
        }
        writeAuditLog(req, "register_duplicate", "auth", null, `email:${normalizedEmail}`, 409);
        return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });
      }

      const passwordHash = await hashPassword(password);
      const [user] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          passwordHash,
        })
        .returning();

      req.session.userId = user.id;
      req.session.userEmail = user.email ?? "";
      writeAuditLog(req, "register", "auth", user.id, null, 200);
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (err: any) {
      console.error("[Auth] Register error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

      if (!user) {
        writeAuditLog(req, "login_failed", "auth", null, `email:${normalizedEmail}`, 401);
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!user.passwordHash) {
        writeAuditLog(req, "login_failed", "auth", null, `no_password:${normalizedEmail}`, 401);
        return res.status(401).json({ message: "No password set for this account. Use 'Create Account' with your email to set one." });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        writeAuditLog(req, "login_failed", "auth", user.id, `bad_password:${normalizedEmail}`, 401);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      req.session.userEmail = user.email ?? "";
      writeAuditLog(req, "login", "auth", user.id, null, 200);
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (err: any) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (!user) return res.status(404).json({ message: "User not found" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _pw, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      console.error("[Auth] Get user error:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Backward-compat GET logout (used by old logout button in use-auth.ts)
  app.get("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
  });

  // TEMPORARY — demo account bootstrap (token-gated, remove after demo)
  app.post("/api/demo-seed-account", async (req: any, res) => {
    try {
      const { token } = req.body;
      if (token !== "cchub-demo-seed-2026") return res.status(403).json({ message: "Forbidden" });
      const passwordHash = await hashPassword("CCIdemo2026!");
      const existing = await db.select().from(users).where(eq(users.email, "evillarreal@acsi-quality.com"));
      if (existing.length > 0) {
        await db.update(users).set({ passwordHash, isSuperadmin: true, updatedAt: new Date() }).where(eq(users.email, "evillarreal@acsi-quality.com"));
        return res.json({ message: "updated", email: "evillarreal@acsi-quality.com" });
      }
      await db.insert(users).values({ id: "54320068", email: "evillarreal@acsi-quality.com", firstName: "Ebeni", lastName: "Villarreal", passwordHash, isSuperadmin: true });
      return res.json({ message: "created", email: "evillarreal@acsi-quality.com" });
    } catch (err: any) {
      console.error("[DemoSeed] error:", err);
      res.status(500).json({ message: err.message });
    }
  });
}
