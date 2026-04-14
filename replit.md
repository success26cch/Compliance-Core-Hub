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

## External Dependencies
-   **AI Integration:** Anthropic Claude (via Replit AI)
-   **Database:** PostgreSQL
-   **Payment Processing:** Paddle
-   **Communication:** Twilio (SMS), MailerSend (email)
-   **Speech Services:** Web Speech API
-   **Security:** Helmet.js, express-rate-limit