# Core Compliance Hub

## Overview
Core Compliance Hub (CCHUB) is a comprehensive occupational health and compliance platform for employers. It provides AI-powered assistance for compliance, ISO management, OSHA recordability, professional training, and employee recognition. The platform aims to streamline compliance processes, enhance workplace safety, and boost employee engagement through advanced technology and expert resources, targeting significant impact in occupational health and compliance markets.

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCHUB), Lead ISO Auditor (ACSI)

## System Architecture
The CCHUB platform is built with a modern web stack: React, Vite, TailwindCSS, and shadcn/ui for the frontend, and Express with Node.js for the backend. PostgreSQL with Drizzle ORM handles data persistence. AI functionalities are integrated via Anthropic Claude (through Replit AI). User authentication uses a custom email/password system with Node.js `crypto` and `connect-pg-simple` for session management.

**Key Architectural Decisions & Features:**
-   **AI-Powered Assistance:** Includes specialized AI experts like Corey (occupational health, safety, compliance) and Isa (Lead ISO Auditor for multiple ISO standards). Also features CESAR for IATF 16949 Customer Specific Requirements.
-   **Modular Platform Design:**
    -   **Client Compliance Dashboard:** Real-time metrics and incident management.
    -   **Employee & Incident Management:** Tracks medical surveillance, drug screens, workplace incidents, OSHA 300 reporting, and enhanced Corrective Action Plans (CAPA) with Twilio SMS.
    -   **ISO Manager Modules:** Comprehensive suite including NC & CAPA, Documentation (versioning, AI-drafted documents, change control workflow), Context of the Organization (PESTLE, SWOT, Interested Parties), My System Profile, 3-Tier Role System, Internal Audit, Training & Awareness, Clause Coverage Map, Risk Assessment, Measurement & Monitoring, Management Review, Communication Log, and APQP (for IATF 16949).
    -   **Training Courses:** LMS with video modules and quizzes.
    -   **Team Management:** Multi-seat billing and private AI conversations.
    -   **BrandNSwag:** Employee recognition platform.
    -   **Spanish Bilingual Medical Assistant (BMA):** Standalone tool for speech-to-text translation and bilingual forms.
    -   **Digital Medical Passport (CCHUB Handshake):** QR-based clinic check-in.
    -   **DOT Compliance Hub:** Separate platform for FMCSA/DOT fleet compliance.
    -   **Environmental Compliance Hub (Env Hub):** Standalone platform with 8 modules covering EPA regulations (Universal Waste, Hazardous Waste/RCRA, SPCC, Stormwater/SWPPP, Air Quality/CAA) and an "Ask Corey" AI chat.
-   **User Onboarding & Marketing:** Dedicated pages for AI personas and ISO Manager, with multi-step onboarding and setup wizards.
-   **Progressive Web App (PWA):** Standalone Corey application for installable, dark-themed, offline-capable experience.
-   **Data Management Routes:** API routes for various modules like dashboard, employee, incident, account, team, digital passport, clinic assistant, and letter generation.
-   **Branded Divisions:** Integrates BrandNSwag and ACSI Mentorship Program.
-   **Security Hardening:** Implemented Helmet.js for security headers, `express-rate-limit` for API rate limiting, and an `audit_logs` PostgreSQL table for immutable logging of critical actions. A public-facing security trust page is also provided.
-   **Access Control (critical):** Self-registration is disabled — "Create Account" removed from login page; only "Sign In" and "Forgot Password" are exposed. All app routes are wrapped in `ProtectedRoute` (App.tsx) which blocks unauthenticated users (→ `/login`) and authenticated-but-unpaid users (→ `SubscriptionWall`). The `ProtectedRoute` gate checks `user.isSuperadmin || subStatus.isPro || subStatus.isAdmin`. The backend `/api/auth/register` endpoint remains open for post-payment account creation (Paddle flow) and admin-created accounts only.

## External Dependencies
-   **AI Integration:** Anthropic Claude (via Replit AI)
-   **Database:** PostgreSQL
-   **Payment Processing:** Paddle
-   **Communication:** Twilio (SMS), MailerSend (email)
-   **Speech Services:** Web Speech API
-   **Security:** Helmet.js, express-rate-limit

## Non-Regression Rules (MANDATORY — read before every task)

These rules exist because regressions are expensive and destroy user confidence. Violating them is never acceptable.

1.  **Read before you touch.** Before editing any file that has been previously worked on, read the current state of that file. Never assume you remember what it contains. Use read or grep to confirm the exact current code.

2.  **Audit what you're changing, not just what you intend to fix.** Before submitting an edit, ask: "Does this change break anything that was already working?" Check adjacent logic, helper functions, and any conditional branches that depend on the same data.

3.  **Completed features are frozen unless explicitly reopened.** If a feature was confirmed working by the user, it must remain working after every subsequent task. If a new task requires touching the same file, patch the minimum possible surface area.

4.  **Never remove or replace a working block without reading it first.** If you are replacing a code block, copy the working logic and preserve any parts not directly related to the bug or feature being addressed.

5.  **The Process Interaction Map layout is locked.** The map always uses the 3-band layout (Management/MOP at top → Core/COP in middle with horizontal numbered arrows → Support/SOP at bottom) for ALL standards including IATF 16949. Remote/Corporate site distinctions are shown via color-coding on the process box and legend ONLY — never as separate columns or rows. Do not reintroduce the IATF site-column grid.

6.  **IATF 16949 process classification rules are fixed:**
    -   **COP** (Customer-Oriented): the entire product value chain — sales, order entry, APQP/PPAP, design, production/blending/manufacturing, in-process testing, analytical, packaging/filling, shipping/delivery. APQP is ALWAYS COP (clause 8.3, customer-driven).
    -   **SOP** (Support-Oriented): HR/training, maintenance, calibration, document control, IT, facilities, EHS, purchasing, procurement, supplier management.
    -   **MOP** (Management-Oriented): strategic planning, management review, internal audit, quality objectives, KPIs, CAPA, corrective action, risk management, continual improvement.

7.  **Key hardcoded values — never change without explicit instruction:**
    -   `ADMIN_EMAILS = ["team@corecompliancehub.com"]` — only this address
    -   Raul's user ID `c2df200b-5806-4310-ba66-e127f2095625` — superadmin rights must never be modified
    -   `Helmet frameguard: false` — must remain disabled
    -   `Layout.tsx` — do not touch
    -   `staleTime: Infinity` — cache policy in queryClient; users must Ctrl+Shift+R to see DB changes
    -   AI model: `claude-sonnet-4-5`; env var: `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
    -   Brand accent color: `#ea6c19` (orange), referenced as `text-accent` / `bg-accent`

8.  **Before marking any task complete, verify that previously working features still work.** If the task touched shared files (routes.ts, storage.ts, schema.ts, ISOManager.tsx, ProcessMapModule.tsx, Layout.tsx), re-read those files and confirm no unintended changes were made.

9.  **ISOManager module scroll pattern — two patterns exist, never mix them:**

    **Pattern A — module owns its scroll (uses ScrollArea internally):**
    - ISOManager section wrapper: `className="flex-1 min-h-0 overflow-hidden flex flex-col"`
    - Module's outer return div: `className="flex-1 min-h-0 flex flex-col"` (or `flex-1 overflow-hidden flex flex-col`)
    - Inside module: `<ScrollArea className="flex-1">` — NEVER `h-full` on a ScrollArea
    - Modules using this pattern: ContextOfOrg, SystemProfile, RolesRaci, APQP, internal_audit, training, Documentation
    - **DO NOT** put `overflow-auto` or `overflow-y-auto` on the module's outer div in Pattern A — it breaks the ScrollArea height calculation.

    **Pattern B — ISOManager wrapper owns the scroll (no ScrollArea in module):**
    - ISOManager section wrapper: `className="flex-1 min-h-0 overflow-y-auto"` (or `flex-1 overflow-y-auto min-h-0`)
    - Module renders plain content — no overflow handling on its own outer div
    - Modules using this pattern: nc, process_map, communication, risk, management_review, measurement

    **Never switch a module from one pattern to the other** without updating both the ISOManager wrapper AND the module's outer div and any internal scroll containers simultaneously.