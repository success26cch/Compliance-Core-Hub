# Core Compliance Hub

## Overview
Core Compliance Hub (CCH) is a comprehensive occupational health and compliance platform designed as a one-stop shop for employers. It features AI-powered compliance assistance, ISO management tools, OSHA recordability guidance, professional training, and employee recognition solutions. The platform aims to streamline compliance processes, enhance workplace safety, and improve employee engagement through innovative technology and expert resources.

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCH), Lead ISO Auditor (ACSI)

## System Architecture
The CCH platform is built with a modern web stack, utilizing React, Vite, TailwindCSS, and shadcn/ui for the frontend, and Express with Node.js for the backend. PostgreSQL with Drizzle ORM handles data persistence. AI functionalities are powered by Anthropic Claude, integrated via Replit AI. User authentication is managed through Replit Auth.

**Key Architectural Decisions & Features:**
- **AI-Powered Assistance:** Corey acts as a Senior Occupational Health & Safety Compliance Expert, referencing extensive regulatory standards (OSHA 29 CFR, DOT 49 CFR Part 40) and generating compliance document templates. ACSI ISO Manager provides Lead ISO Auditor AI for ISO 9001, 14001, and 45001, focusing on gap analysis and audit preparation.
- **Modular Platform Design:** The system includes distinct modules for various compliance needs:
    - **Client Compliance Dashboard:** Real-time metrics, incident heatmap, and action queues.
    - **Employee & Incident Management:** Tools for tracking employee medical surveillance, drug screens, and logging/managing workplace incidents with OSHA 300 reporting and Corrective Action Plans (CAPA).
    - **Training Courses:** A full Learning Management System (LMS) with video modules, quizzes, progress tracking, and certificate generation.
    - **Team Management:** Multi-seat billing and private conversation isolation for Corey AI users.
    - **BrandNSwag:** An employee recognition platform using QR-code recognition for points-based rewards.
    - **Spanish Bilingual Medical Assistant (BMA):** A standalone tool for clinics featuring bidirectional speech-to-text translation, interactive body maps, and multi-step bilingual forms for injury reporting, new hire intake, and drug screen instructions.
    - **Digital Medical Passport (CCH Handshake):** A QR-based clinic check-in system with smart digital authorization forms, employer notifications, and time-away tracking.
- **Dark Mode:** Full dark mode support using `next-themes` with class-based toggling. Toggle available in Layout navbar and Landing page navbar. Persisted via localStorage (`cch-theme` key).
- **"Is This Recordable?" Decision Tree:** Interactive 5-question OSHA recordability tool on the Landing page (public, no login required). Based on 29 CFR 1904 criteria.
- **Compare Plans Table:** Side-by-side feature comparison table on GetStarted page showing Free vs. Corey AI ($99) vs. Employer Platform ($299) with all feature rows and CTAs.
- **PWA (Progressive Web App):** The standalone Corey application is designed as a PWA, offering an installable, dark-themed experience with offline caching capabilities.
- **Data Management Routes:** Dedicated routes for dashboard, employee management, incident logging, account settings, team seat management, digital passport generation, clinic assistant interface, and specialized letter generators.
- **Branded Divisions:** Includes BrandNSwag for employee recognition and ACSI Mentorship Program for ISO guidance, integrated within the CCH ecosystem.

## Deferred Features (Not Yet Live)
- **Success Manager Retainer ($499/mo):** Removed from all pages — not ready yet. Features planned: Priority support (direct access to Mario), Monthly Compliance Pulse Check (30-min call), Quarterly Log Review & AI Optimization, Compliance Readiness Oversight, Custom form integration into Bilingual Assistant. Includes three disclaimers: Not Legal Advice, No Guarantee of Outcome, Accuracy of Information. Will be re-added when ready.

## External Dependencies
- **AI Integration:** Anthropic Claude (via Replit AI) for AI-powered chat and expert systems.
- **Authentication:** Replit Auth for user authentication.
- **Database:** PostgreSQL with Drizzle ORM.
- **Payment Processing:** Stripe for all subscription billing, one-time purchases, and payment management (credit card, PayPal).
- **Communication:** Twilio for SMS notifications (e.g., "I'm Here" notifications from CCH Handshake).
- **Speech Services:** Web Speech API for Spanish text-to-speech and speech-to-text functionalities in the Bilingual Medical Assistant.