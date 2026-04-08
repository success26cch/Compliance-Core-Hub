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
-   **ISO Manager 3-Tier Role System (LIVE):** `isoRole` on users (`librarian` | `trainer` | `auditor`). Badge in sidebar. Gating: Librarian → Documentation/NC/Chat; Trainer adds Communication & Training; Auditor adds Internal Audits, Risk, Management Review, Measurement. Superadmins bypass all gates. API: `PATCH /api/superadmin/users/:userId/iso-role`.
-   **ISO Manager Internal Audit Module (LIVE):** Create audits, clause-by-clause checklist (ISO 9001/14001/45001), finding log with severity, real-time status.
-   **ISO Manager Training & Awareness Module (LIVE):** Push awareness notices to process owners, track acknowledgments, expiry dates, urgency levels.
-   **ISO Manager Clause Coverage Map (LIVE):** Per-clause document coverage visualization (approved/in-review/draft/none), overall coverage percentage gauge.

## External Dependencies
-   **AI Integration:** Anthropic Claude (via Replit AI)
-   **Database:** PostgreSQL with Drizzle ORM
-   **Payment Processing:** Paddle (transitioning from Stripe)
-   **Communication:** Twilio (SMS notifications); MailerSend (transactional email)
-   **Speech Services:** Web Speech API (for Spanish text-to-speech and speech-to-text)