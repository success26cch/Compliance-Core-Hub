# Core Compliance Hub

## Overview
Core Compliance Hub (CCHUB) is a comprehensive occupational health and compliance platform for employers. It provides AI-powered compliance assistance, ISO management tools, OSHA recordability guidance, professional training, and employee recognition solutions. The platform aims to streamline compliance processes, enhance workplace safety, and improve employee engagement through innovative technology and expert resources.

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCHUB), Lead ISO Auditor (ACSI)

## Future Product: Corey MD (On Deck — Post-CCHUB Launch)
**Concept:** A clinical decision-support AI for occupational health providers — not a diagnostic tool, a reasoning tool. Helps providers treat without bias while protecting both patient and employer interests.
**Core capabilities planned:**
- OSHA 29 CFR 1904 recordability reasoning with full clinical documentation rationale
- Work restriction recommendations with defensible medical reasoning (lifting, RTW timelines, modified duty)
- Case note language the provider can use to support non-recordability determinations
- Dual-loyalty framework: patient welfare + employer interests balanced without compromising either
- Workers' comp documentation support — reduces claim disputes and denial risk
- Strict recommendation-only mode (no diagnosis, no prescriptions) — licensed provider makes every decision
**Build plan:** Start narrow — OSHA recordability reasoning + restriction documentation only (v1), then expand to RTW timelines, DOT physicals, and case note generation (v2).
**Prompt development:** Requires 20–30 real occupational medicine case scenarios (messy ones) reviewed by the owner as subject matter expert. Engineering: ~3–4 days. Prompt iteration: 3–5 weeks.
**Market:** Occupational health clinics, urgent care with occ med programs, employer-embedded health clinics.
**Name confirmed:** Corey MD

## System Architecture
The CCHUB platform is built with a modern web stack, utilizing React, Vite, TailwindCSS, and shadcn/ui for the frontend, and Express with Node.js for the backend. PostgreSQL with Drizzle ORM handles data persistence. AI functionalities are powered by Anthropic Claude, integrated via Replit AI. User authentication uses a custom email/password system (Node.js `crypto` scrypt, session-based with PostgreSQL session store via `connect-pg-simple`).

**Authentication Architecture (custom — no Replit OIDC):**
- `server/auth/index.ts` — auth module: `setupAuth()` (session middleware), `registerAuthRoutes()` (register/login/logout routes), `authMiddleware()` (patches `req.isAuthenticated()` + `req.user.claims` from session)
- Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/user`, `GET /api/logout`
- Password hashing: `crypto.scrypt` with random salt — no external packages
- Session: stored in PostgreSQL `sessions` table via `connect-pg-simple`; `req.session.userId` + `req.session.userEmail`
- All existing route guards (`req.isAuthenticated()`, `req.user.claims.sub`) work unchanged
- Frontend: `/login` page with Sign In / Create Account tabs; `use-auth.ts` queries `/api/auth/user`

**Key Architectural Decisions & Features:**
- **AI-Powered Assistance:**
  - **Corey (CCHUB):** A Senior Occupational Health, Safety & Compliance Expert AI. Features an anti-hallucination protocol, mandatory recordability rules, OSHA 300 Log guidance, Team Meeting Mode, Audit Mode, 23 document templates, and Quick Action cards.
  - **Isa (ACSI ISO Manager):** A Lead ISO Auditor AI with a dedicated knowledge base for multiple ISO standards (9001, 14001, 45001, 13485, 27001, AS9100, IATF 16949). Isa conversations are isolated. Isa also has standalone app versions (Isa and Isa Pro) with a full-page chat interface and a dedicated onboarding flow.
  - **CESAR / CSR Connect Hub:** Handles Customer Specific Requirements (CSRs) exclusively for IATF 16949, with a hard redirect from Isa for CSR-related questions.
- **Modular Platform Design:**
    - **Client Compliance Dashboard:** Provides real-time metrics, incident heatmaps, and action queues.
    - **Employee & Incident Management:** Tools for tracking employee medical surveillance, drug screens, and logging/managing workplace incidents with OSHA 300 reporting and Corrective Action Plans (CAPA). Incident forms use standardized OSHA-aligned dropdowns and support multi-site analytics.
    - **Enhanced CAPA (Corrective Action Plans):** Includes SMS notifications via Twilio, effectiveness verification, overdue highlighting, recurrence warnings, and an "Ask Corey for Suggestions" feature.
    - **ISO Manager NC & CAPA Module:** Nonconformance tracking integrated into the ISO Manager with a full status workflow, CAPA sections, effectiveness verification, SMS notification, and an "Ask Isa to Guide Me Through This" button.
    - **ISO Manager Module Navigation Shell:** A sidebar navigation with sections for AI Consultation, NC & CAPA, Documentation, and placeholders for future modules.
    - **ISO Manager Documentation Module:** A document library with filterable documents, status badges, version tracking, ISO clause references, and "Ask Isa" buttons for guidance and review.
    - **Training Courses:** A Learning Management System (LMS) with video modules, quizzes, progress tracking, and certificate generation.
    - **Team Management:** Supports multi-seat billing and private conversation isolation for AI users.
    - **BrandNSwag:** An employee recognition platform using QR-code recognition for points-based rewards.
    - **Spanish Bilingual Medical Assistant (BMA):** A standalone tool featuring bidirectional speech-to-text translation, interactive body maps, and multi-step bilingual forms. Has a dedicated showcase page at `/bma` with hero, live demo, ROI calculator, comparison table, and pricing. The landing page links to `/bma` with a teaser card instead of embedding the full demo inline.
    - **Digital Medical Passport (CCHUB Handshake):** A QR-based clinic check-in system with digital authorization forms, employer notifications, and time-away tracking.
- **Demo Video Page (`/watch-demo`):** A platform walkthrough video page. Video is served via the Express route `GET /api/demo-video` (bypasses the Replit CDN static layer). File is `client/public/demo.mp4` — kept at ~9MB (re-encoded to 720p, H.264, no audio, faststart). Player has click-to-toggle play/pause and a fullscreen button; no mute button.
- **Dark Mode:** Disabled; app is locked to light mode via `forcedTheme="light"` in `App.tsx`. Theme toggle removed from all pages.
- **"Is This Recordable?" Decision Tree:** An interactive 5-question OSHA recordability tool on the landing page.
- **Compare Plans Table:** A feature comparison table on the Get Started page for different subscription tiers.
- **Corey Subscriber Profile & Onboarding Flow:** A 5-step intake form that collects user information to personalize Corey AI conversations, followed by a welcome flow with PWA installation instructions. A trial page is available via QR code.
- **Meet Corey Marketing Page:** A dedicated sales page showcasing Corey's capabilities, document templates, regulatory coverage, and FAQs.
- **Meet Isa Marketing Page:** A dedicated sales page for Isa and Isa Pro standalone AI products, including bundle options.
- **ISO Manager Marketing Page (`/meet-iso-manager`):** A public-facing marketing page for the ISO Manager platform showing the 9-module suite (3 live, 6 coming soon), 7 standards coverage, 3-phase setup wizard overview, 4-tier pricing, and FAQ. The top nav "ISO Manager" link points here; the actual app is at `/iso-manager`.
- **ISO Manager Pricing:** A 4-tier pricing structure for the ISO Manager platform, including various ISO standards and features.
- **ISO Manager Setup Wizard:** A guided 3-phase onboarding wizard to collect organizational context (organizational context, process architecture, quality policy fundamentals) for personalized Isa consultations.
- **PWA (Progressive Web App):** The standalone Corey application is designed as a PWA, offering an installable, dark-themed experience with offline caching.
- **Data Management Routes:** Dedicated routes for dashboard, employee management, incident logging, account settings, team seat management, digital passport generation, clinic assistant interface, and specialized letter generators.
- **Branded Divisions:** Includes BrandNSwag and ACSI Mentorship Program integrated within the CCHUB ecosystem.

## External Dependencies
- **AI Integration:** Anthropic Claude (via Replit AI)
- **Authentication:** Replit Auth
- **Database:** PostgreSQL with Drizzle ORM
- **Payment Processing:** Stripe
- **Communication:** Twilio (for SMS notifications); SendGrid (transactional email)
- **Speech Services:** Web Speech API (for Spanish text-to-speech and speech-to-text)

## Transactional Email System (MailerSend)
All email logic lives in `server/emailService.ts`. Uses MailerSend REST API (`https://api.mailersend.com/v1/email`) with `MAILERSEND_API_KEY` environment secret. No SDK — pure fetch() call. From address: `noreply@corecompliancehub.com`.

**Four automatic email triggers:**
1. **Incident logged** → `POST /api/incidents` → notifies DER email + Workers' Comp agent email + CCHUB admins
2. **CAPA created** → `POST /api/corrective-actions` → notifies assignee (`responsibleEmail`) + DER email
3. **CAPA overdue** → `GET /api/capa/check-overdue` (called silently on Dashboard load) → sends once per 24h per CAPA via `overdueNotifiedAt` column
4. **Contact inquiry** → `POST /api/contact-inquiries` → admin notification + confirmation to submitter

**Schema additions (all nullable):**
- `company_profiles`: `workers_comp_contact`, `workers_comp_email`
- `corrective_actions`: `responsible_email`, `overdue_notified_at`

**Admin emails:** `raulv9471@gmail.com`, `evillarreal@acsi-quality.com`
**All sends are fire-and-forget** — wrapped in try/catch; email failures never block the primary action.

## Pending Payment Infrastructure (On Hold — Awaiting Decision)
- **Payment processor decision pending:** Owner is evaluating **Paddle** as the payment/invoicing platform instead of Stripe. Paddle acts as Merchant of Record (handles sales tax, VAT automatically) and supports native invoicing with Net payment terms. Once confirmed, replace Stripe integration with Paddle API keys (no Replit connector exists for Paddle — use API keys directly).
- **Invoice billing (Net 30):** Plan is to add a "Request Invoice Billing" form on the Get Started/pricing page. Captures company name, billing contact, email, PO number, and desired plan. Sends admin notification; admin creates invoice in Paddle with Net 30 terms. Customer pays via Paddle-generated payment link.
- **Account suspension for non-payment:** Architecture is ready — `PlatformGate` (frontend) and `requirePlatformAccess` (backend) already gate all protected features. Add a `suspended` boolean to `company_profiles`, check it in both gate points. Flip to suspend on non-payment, flip back to reinstate. Automatable via scheduled overdue check. Grace period configurable.