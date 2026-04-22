import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
const app = express();
const httpServer = createServer(app);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,    // Vite dev needs flexibility; enforce in prod via CDN
  crossOriginEmbedderPolicy: false,
  frameguard: false,               // Replit preview embeds the app in an iframe — keep permissive
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Strict limit on auth endpoints — blocks brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});
// General API limit — prevents scraping and abuse
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/api/auth/user"), // don't throttle session checks
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Auto-seed BrandNSwag new hire safety courses on startup
  try {
    const { storage } = await import("./storage");
    const { seedBrandNSwagCourses } = await import("./brandnswagCourseSeed");
    await seedBrandNSwagCourses(storage);
  } catch (error) {
    console.error("Failed to auto-seed BrandNSwag courses:", error);
  }

  // Seed DODO Payments product catalog on startup
  try {
    const { seedDodoProducts } = await import("./dodoProducts");
    await seedDodoProducts();
  } catch (error) {
    console.error("Failed to seed DODO products:", error);
  }

  // ─── Daily calibration reminder scheduler ───────────────────────────────────
  // Runs once at startup and then every 24 hours. Sends reminder emails for
  // gages due within 30 days or overdue. Does not depend on a user opening the
  // calibration module (per-gage 7-day throttle prevents duplicate emails).
  async function runCalibrationReminders() {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { sendEmail, brandedHtml } = await import("./emailService");

      const today = new Date();
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() + 30);
      const throttle = new Date(today);
      throttle.setDate(throttle.getDate() - 7);

      // Fetch all active gages due/overdue across all users
      const rows = await db.execute(sql`
        SELECT ce.*, u.email AS owner_email
        FROM calibration_equipment ce
        JOIN users u ON u.id = ce.user_id
        WHERE ce.status = 'active'
          AND ce.next_due_date IS NOT NULL
          AND ce.next_due_date <= ${cutoff.toISOString().split("T")[0]}
          AND (ce.last_reminder_sent_at IS NULL OR ce.last_reminder_sent_at < ${throttle.toISOString()})
      `);

      let sent = 0;
      for (const row of rows.rows as Record<string, unknown>[]) {
        const dueDate = new Date(row.next_due_date as string);
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
        const subject = daysLeft <= 0
          ? `⚠️ Calibration OVERDUE: ${row.name} (${row.gage_id})`
          : `📅 Calibration Due in ${daysLeft} days: ${row.name} (${row.gage_id})`;
        const body = `
          <h2 style="color:#1e3a5f;margin:0 0 16px">Calibration ${daysLeft <= 0 ? "Overdue" : "Reminder"}</h2>
          <p>The following measuring equipment requires calibration attention:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;width:40%">Equipment</td><td style="padding:8px;">${row.name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Gage ID</td><td style="padding:8px;">${row.gage_id}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Location</td><td style="padding:8px;">${row.location ?? "—"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Responsible</td><td style="padding:8px;">${row.responsible_person ?? "—"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f8fafc;">Calibration Due</td>
              <td style="padding:8px;color:${daysLeft <= 0 ? "#dc2626" : daysLeft <= 7 ? "#d97706" : "#16a34a"};font-weight:bold;">
                ${row.next_due_date}${daysLeft <= 0 ? " (OVERDUE)" : ` (${daysLeft} days)`}
              </td>
            </tr>
          </table>
          <p style="margin-top:16px;">
            <a href="https://corecompliancehub.com/iso-manager" style="background:#ea6c19;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
              Open Calibration Module
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;margin-top:16px;">
            This is an automated reminder from Core Compliance Hub (ISO 9001 §7.1.5 / IATF 16949 §7.1.5.3).
          </p>
        `;

        const recipients: string[] = [];
        if (row.responsible_email) recipients.push(row.responsible_email as string);
        if (row.owner_email && row.owner_email !== row.responsible_email) recipients.push(row.owner_email as string);

        let anySent = false;
        for (const to of recipients) {
          const ok = await sendEmail(to as string, subject, brandedHtml(subject, body));
          if (ok) anySent = true;
        }
        if (anySent) {
          await db.execute(sql`
            UPDATE calibration_equipment SET last_reminder_sent_at = NOW()
            WHERE id = ${row.id}
          `);
          sent++;
        }
      }
      if (rows.rows.length > 0) {
        log(`Calibration reminders: checked ${rows.rows.length} gages, sent ${sent} email(s).`, "scheduler");
      }
    } catch (err) {
      console.error("[scheduler] Calibration reminder check failed:", err);
    }
  }

  // Run once on startup (after a short delay) then every 24 hours
  setTimeout(() => {
    runCalibrationReminders();
    setInterval(runCalibrationReminders, 24 * 60 * 60 * 1000);
  }, 60 * 1000); // 1-minute startup delay

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
