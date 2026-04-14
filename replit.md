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
    -   **ISO Manager Documentation Module:** A filterable document library with version tracking, ISO clause references, print-to-HTML export (org logo, formatted sections, revision header), and comprehensive AI-drafted documents. Quality Manual generation uses a detailed, structured prompt producing all clauses (4–10), revision table, Table of Contents, procedure references (QP-XXX-X), form references (FM-XXX-X), and Appendix A process map. Other doc types (procedures, work instructions) get specialized prompts with Purpose/Scope/Steps structure.
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
-   **ISO Manager Context of the Organization Module (LIVE — Enhanced):** Default sidebar entry. Addresses ISO Clause 4.1 (internal/external issues) and 4.2 (interested parties). Four tabs: (1) PESTLE Analysis — 6-category external issue cards; each item tagged Risk (red) or Opportunity (green); toggle selector when adding; per-card R/O counts. (2) SWOT Analysis — 4-quadrant internal issue cards; each item shows "→ 6.1" indicator. (3) Interested Parties — full matrix with expandable accordion cards grouped Internal/External; PI-R selector (Manage Closely/Keep Informed/Keep Satisfied/Monitor Only); all 6 matrix fields (needs, expectations, actions to meet needs, monitoring method, associated risks, opportunities); summary strip with counts. (4) 4.1 → 6.1 Summary — count cards, 7-standard reference table (ISO 9001/14001/45001/IATF 16949/13485/AS9100/27001), "Go to Risk Assessment" navigation, enhanced Ask Isa payload. Saves to `pestle_data`, `swot_data`, `interested_parties` JSONB on `iso_projects`. Backward-compatible with old string-array PESTLE data and old lean interested-parties records.
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
-   **ISO Manager Document Change Control (LIVE — ISO 7.5.3):** Full document change request and approval workflow in the Documentation module. "Request Change" button on Approved documents opens a DCR form (requestedBy, change description, reason, affected departments chip-selector, proposed effective date). Submission moves doc to "In Review". "Change Control" tab (with red pending count badge) shows all DCRs. Approve action: bumps version (1.0→1.1), archives old content to `previous_versions` JSONB on `iso_documents`, sets `approvedBy`/`approvalDate`, auto-creates `iso_awareness_notices` training notice for all affected departments. Reject action: returns doc to Approved, records reviewer comments. Full audit trail (DCR-XXXX numbers, reviewer name, date). Version history chip on every doc card (expandable). Tables: `doc_change_requests`; column: `previous_versions` (JSONB) on `iso_documents`. API: `GET /api/doc-change-requests`, `POST /api/iso-documents/:id/change-requests`, `PATCH /api/doc-change-requests/:id/approve`, `PATCH /api/doc-change-requests/:id/reject`.

-   **Environmental Compliance Hub (LIVE — Standalone Product):** A complete EPA / environmental compliance platform at `/env-hub` with dedicated dark-themed sidebar and 8 modules:
    -   **Overview** — Summary dashboard with alert cards for overdue items across all modules; Corey CTA.
    -   **Facility Profile** — EPA Facility ID, SIC/NAICS codes, state, characteristics (stacks, boilers, tanks, SPCC plan, SWPPP, air permit), oil storage gallons. Feeds state-specific guidance to Corey.
    -   **Universal Waste** (40 CFR Part 273) — Container log for batteries, lamps, pesticides, mercury, aerosols; 1-year countdown clock per container; color-coded expiration alerts (30/14/0 days); dispose workflow.
    -   **Hazardous Waste / RCRA** (40 CFR Parts 260–270) — Generator Status Calculator auto-determines VSQG/SQG/LQG from monthly waste logs (last 3 months max); Satellite Accumulation Point (SAP) weekly inspection log; Manifest Manager with 45-day unsigned flag and Exception Report alert.
    -   **SPCC / Oil Spill Prevention** (40 CFR Part 112) — Tank registry with secondary containment tracking; monthly/annual inspection checklists; 1,320-gallon threshold alert; total storage gallons aggregation.
    -   **Stormwater / SWPPP** (NPDES / 40 CFR Part 122) — Quarterly monitoring calendar (Q1–Q4) with completion tracking; visual outfall monitoring log (color, odor, sheen, floating, turbidity); corrective action workflow; missing-quarter alerts.
    -   **Air Quality / CAA** (40 CFR Parts 51–71) — Permit filing cabinet (Title V, Synthetic Minor, Minor Source, State-only); renewal alerts at 180/90/30 days; Method 9 visible emissions (opacity) log with ≥20% violation flag.
    -   **Ask Corey** — CFR 40 / EPA AI chat with state-specific context from facility profile; quick-start questions for common compliance scenarios.
    -   Marketing page at `/env-compliance-hub` (dark-themed, standalone, no auth required).
    -   Sidebar link "Env Compliance Hub" under "Environmental HUB" section in main Layout.tsx.
    -   11 new DB tables pushed: `env_facility_profiles`, `env_universal_waste`, `env_haz_waste_saps`, `env_sap_inspections`, `env_manifests`, `env_generator_months`, `env_spcc_tanks`, `env_spcc_inspections`, `env_stormwater_monitoring`, `env_air_permits`, `env_opacity_logs`.
    -   `hasEnvHub` added to subscription status (plans: `env_hub`, `enterprise`, `employer_platform`, `employer_platform_with_corey` or `isAdmin`).
    -   ProductGate config added for `env_hub` plan key.
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