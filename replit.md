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
  - **CESAR / CSR Connect Hub:** CSRs (Customer Specific Requirements) are exclusively an IATF 16949 concept and are NOT handled by Isa or Corey. Isa has a hard redirect rule in `isaSystemPrompt.ts` directing all CSR questions to CESAR on the CSR Connect Hub. A dedicated marketing page lives at `/cesar` (`client/src/pages/Cesar.tsx`) — public, no auth required. ISOManager page has a CESAR callout card visible in the empty state. Do NOT add CSR guidance to Isa or Corey.
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
- **Meet Isa Marketing Page:** Dedicated dark-themed sales page at `/meet-isa` (`client/src/pages/MeetIsa.tsx`) — public, no auth required. Shows Isa ($99/mo, core 3 standards) and Isa Pro ($199/mo, all 7 standards) as AI-only products, plus a Corey + Isa Bundle callout ($149/mo) and a reference callout pointing users to the ISO Manager for full platform tiers. Landing page "Meet Isa" nav link points here (was /iso-manager).
- **ISO Manager Pricing — 4-Tier Structure:** The ISO Manager workspace (`/iso-manager`) shows only the 4 ISO Manager platform tiers: Core $299/mo (1 standard, pick 9001/14001/45001), Integrated $499/mo (all 3 core IMS), Specialist $699/mo (IATF 16949, AS9100, or 13485), PRO $899/mo (core + 1 specialist). All tiers include Isa AI + Documents + Vault + setup fee. Standalone Isa/Isa Pro cards were removed from this page and moved to /meet-isa. Powered by reusable `ISOTierCard` component in `ISOManager.tsx`.
- **ISO Manager Setup Wizard (3-Phase):** A guided onboarding wizard inside the ISO Manager that collects organizational context before Isa consultations. Split-pane layout: left = Isa-voiced questions with progress bar, right = "Drafting Pane" that builds the document in real-time. Phase 1: Organizational Context (standard selection, org name/address, employee breakdown, products/services, manufacturing technologies, design responsibility). Phase 2: Process Architecture builder (iterative — name, owner, KPI, inputs, outputs, with auto-clause-tagging by process name). Phase 3: Quality Policy fundamentals (3 core values, risk philosophy multi-select, OEM suppliers for IATF/AS9100 scope only — CSR redirect rule enforced). After completion, the full project context is injected into every Isa conversation (prepended to ISA_SYSTEM_PROMPT). Database: `iso_projects` table in `shared/schema.ts`. API routes: `GET/POST/PATCH/DELETE /api/iso-projects`. Frontend: `ISOSetupWizard` component in `client/src/pages/ISOManager.tsx`. Context injection: `server/replit_integrations/chat/routes.ts` — Isa message handler fetches project and prepends context block with org info, process map, and CSR rule.
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