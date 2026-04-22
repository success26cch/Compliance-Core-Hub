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
-   **Supplier Management:** Maintains Approved Supplier List, supplier selection criteria, configurable pre-qualification approval thresholds, saved potential-supplier pre-qualification assessment records, active supplier performance scorecards, and IATF risk-based supplier audit schedules. Supplier audit risk distinguishes IATF 16949-certified suppliers from ISO 9001-only suppliers because IATF requires supplier development toward IATF.
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

## Important Implementation Notes

1.  **Professional Training/Certificates:**
    -   Certificates must always use ACSI branding, never CCHUB branding.
    -   ACSI logo: `attached_assets/CCHUB LOGO - NEW_1758574809924.png` or `AttachedAssets.CCHUB_LOGO__NEW_1758574809924_png`.
    -   Certificate endpoint: `/api/training/certificates/:id` renders PDF directly from server.
    -   Date format on certificates should be numeric MM/DD/YYYY.
    -   `certificateHtml` in `server/routes.ts` must be used as a tagged template literal function.

2.  **DB schema is source of truth:** `shared/schema.ts` defines all tables; use Drizzle ORM.

3.  **Auth:** Uses session-based auth; `req.isAuthenticated()` and `req.user.claims.sub` pattern throughout routes.

4.  **AI integration:** Anthropic via `AI_INTEGRATIONS_ANTHROPIC_API_KEY` and `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`; default model `claude-sonnet-4-5`.

5.  **Styling:** Tailwind + shadcn/ui. Brand accent orange `#ea6c19`.

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

10. **Demo company seed scripts:**
    -   `scripts/seed-cci-quality-manual.ts` — pre-seeds the CCI Chemical IATF 16949 Quality Management System Manual (`iso_documents id=34`, `project_id=4`).
        Run: `npx tsx scripts/seed-cci-quality-manual.ts`
        The script is idempotent; it exits immediately if content already meets the ≥40,000-char (~10,000 token) target with no progress markers.
        If re-seeding is needed, truncate the `iso_documents` row content first, then re-run.
    -   QM prompt logic lives in `server/qm-prompts.ts` (exports `buildQmPartAPrompt`, `buildQmPartBPrompt`, `QmPromptParams`). Both the seed script and live generation in `routes.ts` use these shared builders to stay in sync.
