# Core Compliance Hub

## Overview
Core Compliance Hub (CCHUB) is a comprehensive occupational health and compliance platform designed for employers. It offers AI-powered assistance for compliance, ISO management, OSHA recordability, professional training, and employee recognition. The platform's core purpose is to streamline compliance processes, enhance workplace safety, and boost employee engagement through advanced technology and expert resources, aiming for a significant impact on occupational health and compliance markets.

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCHUB), Lead ISO Auditor (ACSI)

## System Architecture
The CCHUB platform utilizes a modern web stack, featuring React, Vite, TailwindCSS, and shadcn/ui for the frontend, and Express with Node.js for the backend. PostgreSQL with Drizzle ORM manages data persistence. AI functionalities are integrated via Anthropic Claude (through Replit AI). User authentication is handled by a custom email/password system built with Node.js `crypto` for hashing and `connect-pg-simple` for session management in PostgreSQL.

**Key Architectural Decisions & Features:**
-   **AI-Powered Assistance:**
    -   **Corey (CCHUB):** An AI expert in occupational health, safety, and compliance with anti-hallucination protocols, OSHA 300 Log guidance, and 23 document templates.
    -   **Isa (ACSI ISO Manager):** An AI lead ISO Auditor with a dedicated knowledge base for multiple ISO standards (9001, 14001, 45001, 13485, 27001, AS9100, IATF 16949). Isa conversations are isolated, and standalone app versions are available.
    -   **CESAR / CSR Connect Hub:** Manages Customer Specific Requirements (CSRs) exclusively for IATF 16949.
-   **Modular Platform Design:**
    -   **Client Compliance Dashboard:** Provides real-time metrics and incident management.
    -   **Employee & Incident Management:** Tools for tracking medical surveillance, drug screens, and logging workplace incidents with OSHA 300 reporting and Corrective Action Plans (CAPA).
    -   **Enhanced CAPA:** Includes SMS notifications via Twilio, effectiveness verification, and AI suggestions.
    -   **ISO Manager NC & CAPA Module:** Integrated nonconformance tracking with status workflows and AI guidance.
    -   **ISO Manager Documentation Module:** A filterable document library with version tracking and ISO clause references.
    -   **Training Courses:** An LMS with video modules, quizzes, and progress tracking.
    -   **Team Management:** Supports multi-seat billing and private AI conversations.
    -   **BrandNSwag:** An employee recognition platform using QR-code based rewards.
    -   **Spanish Bilingual Medical Assistant (BMA):** A standalone tool offering bidirectional speech-to-text translation, interactive body maps, and multi-step bilingual forms.
    -   **Digital Medical Passport (CCHUB Handshake):** A QR-based clinic check-in system with digital authorizations.
    -   **DOT Compliance Hub:** A separate platform for FMCSA/DOT-regulated employers for fleet compliance management, including driver and equipment tracking, and compliance alerts.
-   **User Onboarding & Marketing:** Dedicated marketing pages for Corey, Isa, and the ISO Manager, along with a 5-step onboarding flow for Corey subscribers and a 3-phase setup wizard for the ISO Manager.
-   **Progressive Web App (PWA):** The standalone Corey application is designed as a PWA, offering an installable, dark-themed experience with offline caching.
-   **Data Management Routes:** API routes are provided for dashboard data, employee management, incident logging, account settings, team seat management, digital passport generation, clinic assistant interface, and specialized letter generators.
-   **Branded Divisions:** Integrates BrandNSwag and ACSI Mentorship Program.
-   **ISO Manager Context of the Organization Module (LIVE):** Replaces the "AI Consultation" tab as the default sidebar entry. Addresses ISO Clause 4.1 (internal/external issues) and 4.2 (interested parties). Three tabbed sub-sections: PESTLE Analysis (6-category external issue cards with add/remove), SWOT Analysis (4-quadrant internal issue cards), and Interested Parties register (pre-populated with defaults, relevance toggle, needs/expectations fields). Saves to `pestle_data`, `swot_data`, `interested_parties` JSONB columns on `iso_projects`. Includes an "Ask Isa" button that pre-seeds Isa with the org's context data.
-   **ISO Manager My System Profile — Enhanced (LIVE):** Removed "Risk Identification Methods" section (risk addressed in Context of Org / Risk module). Added "Remote Sites" section (for IATF 16949 multi-site, with in-scope/excluded toggle, address, activities). Added "Outside Processes (Outsourcing)" section (process, provider, control method, clause reference — maps to ISO 8.4). Both use inline editors that PATCH `remote_sites` and `outside_processes` JSONB columns on `iso_projects`.
-   **ISO Manager SectionKey restructure:** `chat` key renamed to `context_org`; sidebar Core section order is now: Context of the Org → My System Profile → Process Maps → NC & CAPA → Documentation.
-   **ISO Manager 3-Tier Role System (LIVE):** `isoRole` on users (`librarian` | `trainer` | `auditor`). Badge in sidebar. Gating: Librarian → Documentation/NC/Chat; Trainer adds Communication & Training; Auditor adds Internal Audits, Risk, Management Review, Measurement. Superadmins bypass all gates. API: `PATCH /api/superadmin/users/:userId/iso-role`.
-   **ISO Manager Internal Audit Module (LIVE):** Create audits, clause-by-clause checklist (ISO 9001/14001/45001), finding log with severity, real-time status.
-   **ISO Manager Training & Awareness Module (LIVE):** Push awareness notices to process owners, track acknowledgments, expiry dates, urgency levels.
-   **ISO Manager Clause Coverage Map (LIVE):** Per-clause document coverage visualization (approved/in-review/draft/none), overall coverage percentage gauge.
-   **ISO Manager Risk Assessment Module (LIVE):** Risk & Opportunity Register per ISO 6.1. L×S risk scoring heatmap (1–25 scale), color-coded risk levels (green/yellow/red), controls & residual risk tracking, status workflow (open/mitigated/accepted). Isa AI integration via backend proxy `/api/iso/module-isa-chat`.
-   **ISO Manager Measurement & Monitoring Module (LIVE):** KPI dashboard per ISO 9.1. Gauge chart for actual vs. target, line chart trend via Recharts, log measurement actuals by period, status tracking (on_track/at_risk/off_track). Uses `iso_objectives` + `iso_kpi_actuals` tables.
-   **ISO Manager Management Review Module (LIVE):** Full management review workflow per ISO 9.3. ISO 9.3.2 required inputs checklist (9 agenda items), KPI snapshot table, notes, action items with owner/due-date/status, mark complete/draft. Tables: `iso_management_reviews`, `iso_review_action_items`.
-   **ISO Manager Communication Log Module (LIVE):** ISO 7.4 communication log. Internal/external direction, topic, audience, medium, clause reference, summary. Filterable by direction and medium. Table: `iso_communications`. Isa AI guidance on 7.4 requirements.
-   **Backend: `/api/iso/module-isa-chat`:** Shared Anthropic backend proxy for all 4 new ISO modules. Accepts messages[] + systemPrompt, returns content. Avoids browser-side API key exposure.

-   **Phase 1 Security Hardening (LIVE):**
    -   **Helmet.js:** HSTS (1-year preload), X-Content-Type-Options, X-Frame-Options (SAMEORIGIN), Referrer-Policy, Permissions-Policy on all responses.
    -   **Rate Limiting (express-rate-limit):** Auth endpoints (login/register) → 20 req/15min; all `/api` → 300 req/min.
    -   **Audit Logs:** `audit_logs` PostgreSQL table — immutable record of login (success + all failure modes), register, employee create/update/delete, incident create. Fields: userId, action, resource, resourceId, ipAddress, userAgent, statusCode, detail, createdAt. Helper: `logAudit()` in routes.ts, `writeAuditLog()` in auth/index.ts.
    -   **Security Trust Page (`/security`):** Public-facing enterprise security center — 5-pillar layout (Administrative Safeguards, Technical Safeguards, Vulnerability Management, Monitoring & Audit Logs, Infrastructure). Status badges, IT FAQ section, data-type transparency, CTA to security@corecompliancehub.com. Linked in Landing footer + sidebar (Marketing section).

## External Dependencies
-   **AI Integration:** Anthropic Claude (via Replit AI)
-   **Database:** PostgreSQL with Drizzle ORM
-   **Payment Processing:** Paddle (transitioning from Stripe)
-   **Communication:** Twilio (SMS notifications); MailerSend (transactional email)
-   **Speech Services:** Web Speech API (for Spanish text-to-speech and speech-to-text)
-   **Security:** Helmet.js (headers); express-rate-limit (rate limiting)