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
    -   **ISO Manager Modules:** A comprehensive suite including NC & CAPA, Documentation (versioning, AI-drafted documents, change control), Context of the Organization, My System Profile, 3-Tier Role System, Internal Audit (with process-approach records, risk-based scheduling, and IATF-specific §9.2.2.3 Product Audits and §9.2.2.4 Manufacturing Process Audits tabs with turtle diagram and structured checklists), **Layered Process Audits (LPA)** (GM BIQS/Stellantis/Ford Q1 compliant — 5-layer L1–L5 system with configurable plans, 25-question default library in 9 categories, conduct-audit dialog, records history, and compliance dashboard), Training & Awareness, Clause Coverage Map, Risk Assessment, Measurement & Monitoring, Management Review, Communication Log, APQP, and Calibration (Master Register, Log, Labs Registry, Internal Lab Scope per IATF 16949).
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

## External Dependencies
-   **Frontend Frameworks:** React, Vite, TailwindCSS, shadcn/ui
-   **Backend Framework:** Express.js (with Node.js)
-   **Database:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **AI Integration:** Anthropic Claude (via Replit AI)
-   **SMS Messaging:** Twilio
-   **Session Management:** `connect-pg-simple`
-   **Authentication:** Node.js `crypto`