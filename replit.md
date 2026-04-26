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
    -   **ISO Manager Modules:** Comprehensive suite including NC & CAPA, Documentation (versioning, AI-drafted documents, change control workflow), Context of the Organization (PESTLE, SWOT, Interested Parties), My System Profile, 3-Tier Role System, **Internal Audit** (tabbed: Audit Log — clause-by-clause finding recorder per ISO standard; **Audit Schedule** — risk-ranking framework: 6 criteria each scored LOW/MEDIUM/HIGH/CRITICAL (1-3/4-6/7-9/10), total 1-25=IN CONTROL→3-Year, 26-50=NEEDS ATTENTION→12-24 months, >50=NEEDS IMMEDIATE→6-9 months; consultant-audit flag (grey row); process table with risk-status label, score bar /60, frequency badge, next-due; RiskAssessmentDialog with live score bar + zone markers; `audit_process_schedule` DB table with `consultant_audit` boolean; 4 CRUD API routes `/api/audit-schedule`), Training & Awareness, Clause Coverage Map, Risk Assessment, Measurement & Monitoring, Management Review, Communication Log, APQP (for IATF 16949), and **Calibration** (§7.1.5 Master Calibration Register compact table + Calibration Log event table with gage filtering; IATF §7.1.5.2.1 software verification checkbox; AS9100D §7.1.5.2 measurement uncertainty / as-found / as-left / environmental conditions / lab-accreditation; ISO 13485 §7.6 acceptance criteria & equipment label confirmation; IATF §7.1.5.3 OOT risk assessment; MSA placeholder; email reminders for gages due within 30 days; "View History" cross-tab navigation from Register to Log; **Internal vs External calibration toggle** on RecordForm — External mode shows "External Lab" selector linked to the `calibration_labs` registry; Internal mode shows pre-cal checks / env conditions / reference standards / measurement data tables; **Labs Registry tab** (`calibration_labs` table) tracks ISO 17025 accreditation body, number, cert expiry, scope, contact, and uploaded certificate file (`uploads/lab-certs/`); lab 17025 cert status badge shows in RecordForm, detail dialog, and Labs tab; **Internal Lab Scope tab** (`calibration_lab_scope` table) — IATF-only tab implementing IATF 16949 §7.1.5.3.1: auto-populates Sections A+B (capabilities/technical procedures) from internal gages with ASTM/ASME/NIST standard inference; Section C (personnel competency with role matrix); Section D (equipment/reference standards auto-table from internal gages with overdue status); Section E (environmental controls); Section F (customer-specific requirements — GM, Ford, Stellantis CSRs); edit dialog with 5 tabbed sections; seed data pre-populated for CCI Chemical demo company). API: `GET/PUT /api/calibration/lab-scope`.
-   **Preventive Maintenance Module** (`pmEquipment` + `pmRecords` tables): Full TPM/PM platform covering ISO 9001 §6.3, IATF 16949 §8.5.1.1 (TPM), AS9100D (FOD), and ISO 13485 §6.3 (equipment validation). Equipment register with 5-stat summary dashboard (active, overdue, due≤30d, on-track, key production equip count). **Equipment detail drill-in view** — click any equipment card to open a full sub-view with: all PM history for that equipment, statistics (total PMs, completion rate, total labor/downtime/spares spend), standard-specific info banners (IATF breakdown impact, contingency plan, spare parts inventory), procedure checklist, and ability to open/edit/delete any individual PM record. Standard-specific equipment fields: IATF 16949 — `isKeyProductionEquipment`, `breakdownImpact`, `contingencyPlan`, `sparePartsInventory`, `oeeTarget`; AS9100D — `fodRisk`; ISO 13485 — `validationRequired`, `validationStatus`, `validationDate`. Asset tracking fields: `criticalityRating` (critical/high/medium/low), `maintenanceType` (preventive/predictive/TPM/condition_based/reactive), `installDate`, `warrantyExpiry`, `maintenanceContractor`. Enhanced PM record fields: `downtimeHours`, `workOrderNumber`, `technicianCertification`, `sparesCost`, `rootCause`, compliance checkboxes (`safetyCheckPassed`/LOTO, `fodCheckCompleted`/AS9100D, `equipmentValidatedPostPm`/ISO13485). 35+ equipment types, procedure/checklist display in record form. PM Log tab with equipment filter. Auto-calculates next-due-date from PM date + frequency. API: `/api/pm/equipment` and `/api/pm/records`. Seed script: `scripts/seed-cci-pm.ts` — seeds 15 realistic CCI Chemical IATF 16949 equipment items + 33 PM records.
-   **Supplier Management:** Maintains Approved Supplier List, supplier selection criteria, configurable pre-qualification approval thresholds, saved potential-supplier pre-qualification assessment records, active supplier performance scorecards, and IATF risk-based supplier audit schedules. Supplier audit risk distinguishes IATF 16949-certified suppliers from ISO 9001-only suppliers because IATF requires supplier development toward IATF. Supplier audit risk assessments are saved as historical records so annual assessments are retained instead of overwritten.
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
    -   `scripts/seed-cci-calibration.ts` — seeds CCI Chemical's Calibration Module (IATF §7.1.5) with 15 realistic gages, 18 calibration history records, and 1 OOT assessment (Viscometer, CAPA CAR-2023-017). User ID: `54320068`, project ID: `4`. Idempotent — clears and re-seeds each run.
        Run: `npx tsx scripts/seed-cci-calibration.ts`
        Includes: pH meters, analytical balance, viscometer, refractometer, conductivity meter, thermometer, pressure gauge, flow meter, torque wrench, hydrometers, boiling point tester, caliper, customer-owned instrument, turbidity meter, temperature datalogger. Mix of statuses: 5 gages due within 30 days (trigger reminders), 2 overdue (active), 1 overdue + out-of-service.
    -   `scripts/seed-cci-pm.ts` — seeds CCI Chemical's Preventive Maintenance Module (IATF §8.5.1.1 TPM) with 15 realistic pieces of equipment and 33 PM records. User ID: `54320068`, project ID: `4`. Idempotent — clears and re-seeds each run.
        Run: `npx tsx scripts/seed-cci-pm.ts`
        Includes: Air Compressor (KPE), Reactor Chiller (KPE), Drum Mixer (KPE), Dosing Pump (KPE), Filling Machine (KPE/TPM), HVAC, Vacuum Unit, Centrifuge (KPE), Heat Exchanger, Conveyor, Boiler, Labeler, Forklift, pH/Conductivity Monitor (ISO 13485 validation), Drum Washer. Mix: 4 overdue (Chiller, Dosing Pump, Centrifuge, pH Monitor — today), 3 due within 2 days (Mixer, Filling Machine, Boiler). All KPE equipment includes IATF breakdown impact, contingency plans, and spare parts inventory.
