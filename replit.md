# Core Compliance Hub

## Overview
Core Compliance Hub (CCHUB) is an AI-powered occupational health and compliance platform designed for employers. It streamlines compliance, ISO management, OSHA recordability, professional training, and employee recognition. The platform aims to enhance workplace safety and boost employee engagement through advanced technology and expert resources, targeting significant impact in the occupational health and compliance markets.

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCHUB), Lead ISO Auditor (ACSI)

## System Architecture
The CCHUB platform utilizes a modern web stack: React, Vite, TailwindCSS, and shadcn/ui for the frontend, with Express and Node.js for the backend. PostgreSQL with Drizzle ORM is used for data persistence. AI functionalities are integrated via Anthropic Claude. User authentication uses a custom email/password system with Node.js `crypto` for session management.

**Key Architectural Decisions & Features:**
-   **AI-Powered Assistance:** Integrates specialized AI experts like Corey (occupational health, safety, compliance), Isa (Lead ISO Auditor), and CESAR (IATF 16949 Customer Specific Requirements).
-   **Modular Platform Design:**
    -   **Client Compliance Dashboard:** Provides real-time metrics and incident management.
    -   **Employee & Incident Management:** Features tracking for medical surveillance, drug screens, workplace incidents, OSHA 300 reporting, and enhanced Corrective Action Plans (CAPA) with Twilio SMS.
    -   **ISO Manager Modules:** A comprehensive suite including NC & CAPA, Documentation (versioning, AI-drafted documents, change control), Context of the Organization (with **Strategic Risk Register** — a §4.1-scoped H/M/L × H/M/L 3×3 matrix register separate from §6.1, fed by PESTLE/SWOT export buttons, stored in `iso_projects.strategic_risks` JSONB), My System Profile, 3-Tier Role System, Internal Audit (with process-approach records, risk-based scheduling, and IATF-specific §9.2.2.3 Product Audits and §9.2.2.4 Manufacturing Process Audits tabs with turtle diagram and structured checklists), **Layered Process Audits (LPA)** (GM BIQS/Stellantis/Ford Q1 compliant — 5-layer L1–L5 system with configurable plans, 25-question default library in 9 categories, conduct-audit dialog, records history, and compliance dashboard), Training & Awareness, Clause Coverage Map, Risk Assessment, Measurement & Monitoring, Management Review, **Action Item Tracker** (cross-source tracker for action items from Management Review outputs, Risk Assessments, KPIs, and Audit findings — stored in `iso_action_items` table with source type, priority, status, assignee, due date, overdue highlighting, and quick-status workflow), Communication Log, APQP, and Calibration (Master Register, Log, Labs Registry, Internal Lab Scope per IATF 16949).
    -   **Preventive Maintenance Module:** A full TPM/PM platform covering various ISO and industry standards, including equipment registers, detailed drill-in views, and standard-specific fields for IATF 16949, AS9100D, and ISO 13485.
    -   **Supplier Management:** Manages Approved Supplier Lists, pre-qualification assessments, performance scorecards, and IATF risk-based supplier audit schedules.
    -   **Training Courses:** An LMS with video modules and quizzes.
    -   **Team Management:** Supports multi-seat billing and private AI conversations.
    -   **BrandNSwag:** An employee recognition platform.
    -   **Spanish Bilingual Medical Assistant (BMA):** A standalone tool for speech-to-text translation and bilingual forms.
    -   **Digital Medical Passport (CCHUB Handshake):** A QR-based clinic check-in system.
    -   **DOT Compliance Hub:** A separate platform for FMCSA/DOT fleet compliance.
    -   **Environmental Compliance Hub (Env Hub):** A standalone platform with 8 modules covering EPA regulations and an "Ask Corey" AI chat.
-   **User Onboarding & Marketing:** Dedicated pages for AI personas and ISO Manager with multi-step onboarding and setup wizards.
-   **Progressive Web App (PWA):** A standalone Corey application offering an installable, dark-themed, offline-capable experience.
-   **Branded Divisions:** Integrates BrandNSwag and ACSI Mentorship Program.

## Multi-Tenancy & Data Isolation
CCHUB is enterprise multi-tenant. Every client's data is strictly isolated through two independent enforcement layers:

1. **Application-layer isolation (existing):** Every query in `server/storage.ts` and `server/routes.ts` filters by `userId` (the owner's account ID). 767+ explicit user-scoping references ensure Client A's data is never returned to Client B in normal operation.

2. **Database-layer RLS (added):** PostgreSQL Row-Level Security policies enforced on all 83 user-scoped tables. Even if a route bug omits a `WHERE user_id=?` clause, PostgreSQL returns zero rows for the wrong tenant.
   - **How it works:** `server/rls.ts` contains an Express middleware (`rlsMiddleware`) that checks out a dedicated pool connection per authenticated request and sets `SET SESSION app.current_user_id = userId` and `app.is_superadmin` before any queries run. All storage methods automatically use this scoped connection via `AsyncLocalStorage`.
   - **Policies:** Each table has a `tenant_isolation` policy: `USING (user_id = current_setting('app.current_user_id', true) OR current_setting('app.is_superadmin', true) = 'true')`
   - **Superadmin bypass:** Sessions with `isSuperadmin=true` set `app.is_superadmin='true'`, allowing full access for CCHUB internal operations.
   - **Auto-enforcement on startup:** `server/autoRls.ts` (`enforceRlsOnStartup()`) runs on every server start. It auto-discovers any new table with a `user_id` or `employer_user_id` column that is missing the policy and applies it automatically. New tables are protected without any manual steps.
   - **Manual re-apply (special tables):** Run `npx tsx scripts/apply-rls.ts` to re-apply the custom cross-join policies for team tables after schema changes.
   - **Special tables:** `corey_teams` uses `admin_user_id`; `corey_team_members` and team tables use cross-table subquery policies; `training_assignments` / `new_hire_completions` use `employer_user_id`. Shared-catalog and pre-auth tables are intentionally excluded.

## External Dependencies
-   **Frontend Frameworks:** React, Vite, TailwindCSS, shadcn/ui
-   **Backend Framework:** Express.js (with Node.js)
-   **Database:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **AI Integration:** Anthropic Claude (via Replit AI)
-   **SMS Messaging:** Twilio
-   **Session Management:** `connect-pg-simple`
-   **Authentication:** Node.js `crypto`