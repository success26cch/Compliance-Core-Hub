# Core Compliance Hub

## Overview
Core Compliance Hub (CCHUB) is a comprehensive occupational health and compliance platform designed as a one-stop shop for employers. It features AI-powered compliance assistance, ISO management tools, OSHA recordability guidance, professional training, and employee recognition solutions. The platform aims to streamline compliance processes, enhance workplace safety, and improve employee engagement through innovative technology and expert resources.

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCHUB), Lead ISO Auditor (ACSI)

## System Architecture
The CCHUB platform is built with a modern web stack, utilizing React, Vite, TailwindCSS, and shadcn/ui for the frontend, and Express with Node.js for the backend. PostgreSQL with Drizzle ORM handles data persistence. AI functionalities are powered by Anthropic Claude, integrated via Replit AI. User authentication is managed through Replit Auth.

**Key Architectural Decisions & Features:**
- **AI-Powered Assistance (TWO SEPARATE AI PERSONAS):**
  - **Corey** (CCHUB) — The World's First AI Built From the DNA of 29 CFR. Senior Occupational Health, Safety & Compliance Expert. System prompt: `server/replit_integrations/chat/systemPrompt.ts`. API routes: `/api/conversations/*`. Features: anti-hallucination protocol, mandatory recordability "WHY" rule, OSHA 300 Log column-by-column guide, Team Meeting Mode, Audit Mode, 23 document templates, Quick Action cards.
  - **Isa** (ACSI ISO Manager) — Lead ISO Auditor AI. Dedicated knowledge base for ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, ISO 13485:2016, ISO/IEC 27001:2022, AS9100 Rev D, IATF 16949:2016. System prompt: `server/replit_integrations/chat/isaSystemPrompt.ts`. API routes: `/api/isa-conversations/*` (completely separate from Corey). Frontend hook: `client/src/hooks/use-isa-chat.ts`. Conversations are isolated using userId+":isa" scoping. ISO reference documents stored in `knowledge_base/` folder.
  - **CRITICAL:** Corey and Isa share the same database tables but use different API routes and system prompts. Never mix their routes.
- **Modular Platform Design:** The system includes distinct modules for various compliance needs:
    - **Client Compliance Dashboard:** Real-time metrics, incident heatmap, and action queues.
    - **Employee & Incident Management:** Tools for tracking employee medical surveillance, drug screens, and logging/managing workplace incidents with OSHA 300 reporting and Corrective Action Plans (CAPA).
    - **Training Courses:** A full Learning Management System (LMS) with video modules, quizzes, progress tracking, and certificate generation.
    - **Team Management:** Multi-seat billing and private conversation isolation for Corey AI users.
    - **BrandNSwag:** An employee recognition platform using QR-code recognition for points-based rewards.
    - **Spanish Bilingual Medical Assistant (BMA):** A standalone tool for clinics featuring bidirectional speech-to-text translation, interactive body maps, and multi-step bilingual forms for injury reporting, new hire intake, and drug screen instructions.
    - **Digital Medical Passport (CCHUB Handshake):** A QR-based clinic check-in system with smart digital authorization forms, employer notifications, and time-away tracking.
- **Dark Mode:** Full dark mode support using `next-themes` with class-based toggling. Toggle available in Layout navbar and Landing page navbar. Persisted via localStorage (`cch-theme` key).
- **"Is This Recordable?" Decision Tree:** Interactive 5-question OSHA recordability tool on the Landing page (public, no login required). Based on 29 CFR 1904 criteria.
- **Compare Plans Table:** Side-by-side feature comparison table on GetStarted page showing Free vs. Corey AI ($99) vs. Employer Platform ($299) with all feature rows and CTAs.
- **Try Corey QR Code:** Dedicated `/try-corey` trial page accessed via QR code for marketing materials. Uses the landing bot API with 3-question limit per email. QR code downloadable in PNG/SVG at `/qr-code`. Server generates QR codes via `qrcode` npm package.
- **Meet Corey Marketing Page:** Dedicated dark-themed sales page at `/meet-corey` showcasing all Corey capabilities: hero section, stats bar, 8 capability cards, anti-hallucination protocol, proactive compliance features, 23 document templates organized by category, regulatory coverage list (18+ standards), audience targeting, FAQ accordion, and CTAs. Fully animated with framer-motion.
- **PWA (Progressive Web App):** The standalone Corey application is designed as a PWA, offering an installable, dark-themed experience with offline caching capabilities.
- **Data Management Routes:** Dedicated routes for dashboard, employee management, incident logging, account settings, team seat management, digital passport generation, clinic assistant interface, and specialized letter generators.
- **Branded Divisions:** Includes BrandNSwag for employee recognition and ACSI Mentorship Program for ISO guidance, integrated within the CCHUB ecosystem.

## Deferred Features (Not Yet Live)
- **Success Manager Retainer ($499/mo):** Removed from all pages — not ready yet. Features planned: Priority support (direct access to Mario), Monthly Compliance Pulse Check (30-min call), Quarterly Log Review & AI Optimization, Compliance Readiness Oversight, Custom form integration into Bilingual Assistant. Includes three disclaimers: Not Legal Advice, No Guarantee of Outcome, Accuracy of Information. Will be re-added when ready.

## External Dependencies
- **AI Integration:** Anthropic Claude (via Replit AI) for AI-powered chat and expert systems.
- **Authentication:** Replit Auth for user authentication.
- **Database:** PostgreSQL with Drizzle ORM.
- **Payment Processing:** Stripe for all subscription billing, one-time purchases, and payment management (credit card, PayPal).
- **Communication:** Twilio for SMS notifications (e.g., "I'm Here" notifications from CCHUB Handshake).
- **Speech Services:** Web Speech API for Spanish text-to-speech and speech-to-text functionalities in the Bilingual Medical Assistant.