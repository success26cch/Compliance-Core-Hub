# Core Compliance Hub

## Overview
**CCH: THE ONE STOP EMPLOYER SHOP** - Occupational health and compliance platform featuring Corey (AI-powered compliance expert), ACSI ISO Manager, OSHA 300 decision tool, professional training courses, **ACSI Mentorship Program** (CCH exclusive), and **BrandNSwag** employee recognition division.

## Features
- **Corey (Ask Corey)**: AI-powered chat acting as a Senior Occupational Health & Safety Compliance Expert and Lead ISO Auditor, referencing OSHA 29 CFR, DOT 49 CFR Part 40, and comprehensive ISO standards (9001, 14001, 45001, IATF 16949, AS9100, ISO 13485, ISO 22000, ISO 27001, ISO 50001, ISO 22301, ISO 31000, ISO 19011). Generates 15 compliance document templates including ISO Quality Manuals, Environmental Policies, OH&S Programs, Internal Audit Procedures, PPAP Checklists, 8D Reports, and IMS Management Review Agendas.
- **ACSI ISO Manager**: Lead ISO Auditor AI for ISO 9001, 14001, and 45001. Helps with Gap Analysis, Quality Manuals, and Internal Audit preparation with a "Write-Up Free" philosophy
- **OSHA 300, Log it or Not**: Interactive decision tree for OSHA recordability
- **Client Compliance Dashboard**: Real-time metrics for ISO audit readiness, medical surveillance, drug screen status, with incident heatmap and action queue
- **Employee Management**: Track employees with DOT physical dates, respiratory exams, drug test results, and random pool inclusion (/employees)
- **Incident Log & OSHA 300**: Full OSHA 300 log with employee name, job title, location, body part, nature of injury, classification, and printable report (/incidents)
- **Corrective Action Plans (CAPA)**: Create policies and procedures to prevent future incidents. Includes root cause analysis, corrective/preventive actions, responsible person assignment, and verification tracking
- **Company Profile**: Set company information (NAICS code, DOT number, address, DER contact info, company logo) for compliance documentation (/settings)
- **Human Expert Retainer**: Professional human support for crisis response, OSHA 300 log audits, and audit defense
- **Lead Capture**: Free recordability cheat sheet download
- **Training Courses**: Full learning management system with video-style modules, text lessons, quizzes (70% pass threshold), progress tracking, and printable certificates of completion. Course catalog at `/training`, course viewer at `/training/:id`. Database tables: `courses`, `course_modules`, `course_lessons`, `quiz_questions`, `course_enrollments`, `lesson_progress`, `quiz_attempts`, `course_certificates`. First course seeded: DOT Medical Certification (6 modules, 24 quiz questions). **Free OccHealth Program Consultation included with any course purchase.**
- **ACSI Mentorship Program**: CCH Exclusive - First ISO Mentorship Program. Two tiers: Foundation ($2,500) and Executive ($5,000). 12-week intensive program with Lead Auditor mentoring.
- **BrandNSwag**: Smart Swag division for employee recognition and engagement. QR Recognition Platform at $49/mo.
- **Spanish Bilingual Medical Assistant**: Landing page tool with three modes (Injury Reporting, New Hire Intake, Drug Screen Instructions). Features Spanish text-to-speech via Web Speech API, bidirectional speech-to-text (patient speaks Spanish, auto-translates to English), interactive body map, multi-step bilingual forms, Staff Command Center with clinic instructions, and printable clinical summaries. Component at `client/src/components/BilingualAssistant.tsx`. **Standalone subscription at $199/mo per location** with dedicated page at `/bma-subscription`. Currently supports Spanish-English only.
- **BMA Standalone Subscription Page** (`/bma-subscription`): Interactive ROI labor savings calculator, comparison tables vs traditional interpreters, feature showcase, Stripe checkout integration
- **Clinic Partnership Agreement** (`/clinic-agreement`): Digital signature page for clinic partners. Displays full CCH Spanish Bilingual Assistant partnership agreement text, digital signature pad, clinic info form, and triggers Stripe $199/mo subscription checkout upon acceptance. API at `/api/clinic-agreement`.
- **Clinic Engagement Tracking**: Database table `clinic_engagement` logs BMA usage per visit (commands used, patient language, session duration). API at `/api/clinic-engagement`. Provides employer visibility into clinic interactions.
- **Clinic Lead Generation**: Footer banner on ClinicAssistant page promoting BMA subscription with "Learn More" CTA
- **Digital Medical Passport (CCH Handshake)**: QR-based clinic check-in system with Smart Digital Authorization Form. Employers fill out a complete authorization form (patient info, SSN last 4, DOB, services requested with checkboxes, billing preference, special instructions) and digitally sign it when generating QR codes. When clinic scans the QR, they receive the complete signed authorization form ready to print - no phone call needed. Includes "I'm Here" SMS notification to employer via Twilio, "I'm Back" return notification with total time-away tracking (arrival → return duration), 24-hour token expiry, and fallback PDF form upload. Components: `SignaturePad.tsx`, `PrintableAuthForm.tsx`. Pages: `/employee-passport` (generate QR with full auth form), `/clinic-assistant?token=xxx` (public clinic-facing page with printable form)

## Standalone Corey App
- **/corey**: Standalone AI compliance assistant — clean, focused experience without the full CCH platform. Dark theme, own landing page for unauthenticated users, full chat experience for logged-in users. Shares the same backend/conversations/subscription system as the main CCH bot. Component: `client/src/pages/Corey.tsx`
- **PWA (Progressive Web App)**: Corey is installable as a standalone app on mobile and desktop. Manifest at `client/public/manifest.json`, service worker at `client/public/sw.js`, icons at `client/public/icon-*.png`. Install prompt hook: `client/src/hooks/use-pwa-install.ts`. Service worker registered in `client/src/main.tsx`. Supports offline caching with network-first strategy (API calls excluded).

## Data Management Routes
- **/dashboard**: Client Compliance Dashboard with metrics, incident heatmap, action queue
- **/employees**: Employee Management - add/edit/delete employees, track DOT physicals, drug tests, respiratory exams
- **/incidents**: Incident Log - record workplace incidents, track OSHA recordability, OSHA 300 report with print feature, Corrective Action Plans (CAPA)
- **/settings**: Company Profile (with DER contact info, logo upload, and clinic authorization form uploads per visit type) and subscription management
- **/employee-passport**: Digital Medical Passport - generate QR codes for employee clinic check-ins with complete digital authorization form (patient info, services, signature). Includes "Text Passport to Employee" (SMS via Twilio) and "Copy Link" buttons for delivering the passport to employees. Arrival time tracking shows when employee arrived at clinic. "I'm Back" return tracking with total duration displayed in Recent Visits.
- **/clinic-assistant**: Public clinic-facing page (opened by QR scan) with employee info, printable signed authorization form, PDF fallback, employer notification with arrival timestamp, and bilingual tools
- **/bma-subscription**: BMA standalone subscription page with ROI calculator, pricing, and Stripe checkout
- **/clinic-agreement**: Clinic Partnership Agreement with digital signature, clinic info form, and Stripe $199/mo subscription checkout

## BrandNSwag Division
Smart Swag makes safety fun and rewarding through QR-enabled company merchandise.

### Key Features
- **Custom Swag Stores**: Branded merchandise stores for each company
- **QR-Code Recognition**: Every piece of swag has a unique QR code linked to employee and HR
- **Points System**: Anyone can scan QR codes to award recognition points
- **Reward Triggers**:
  - Onboarding completion (welcome swag boxes)
  - Safety class completion
  - Perfect attendance bonuses
  - Employee referrals
  - Peer recognition
- **Recognition Platform Fee**: $49/mo covers QR system, points tracking, leaderboards, engagement reports

### Swag Box Tiers
- **Starter Box**: T-shirt + Cap + Welcome Card
- **Professional Box**: Hoodie + T-shirt + Cap + Tumbler + Badge
- **Executive Box**: Full wardrobe + Tech gear + Premium packaging

### Merchandise Catalog
Hoodies, T-Shirts, Hats & Caps, Jackets, Drinkware, Tech Gear

## Training Courses (One-Time Purchase)
| Course | Price | Content |
|--------|-------|---------|
| DOT Medical Certification | $199 | DOT physical requirements, disqualifying conditions, medical holds, clearance process |
| OSHA Medical Surveillance | $249 | Respirator physicals, asbestos exams, HAZWOPER, PFTs, fit testing |
| Drug & Alcohol Testing | $199 | DOT vs Non-DOT testing, MRO roles, Clearinghouse, return-to-duty |
| ISO Management Systems | $349 | ISO 9001/14001/45001, HLS structure, gap analysis, internal auditing, CAPA |
| OSHA Recordkeeping Master | $299 | OSHA 300 logs, TRIR/EMR reduction, internal audits |
| Complete Training Bundle | $899 | All 5 courses + Corporate License (Save $300+) |

**Promotion**: Every course purchase includes a free one-on-one OccHealth Program Consultation with a compliance expert.

## Pricing Structure

### Occupational Health (CCH)
| Tier | Price | Included | Best For |
|------|-------|----------|----------|
| Safety Starter | Free | 3 Corey Questions/month | Small teams, one-off checks |
| Unlimited Safety | $99/mo | Unlimited Corey + Audit Prep Tools + PDF Checklists + Dedicated Support | Safety Managers, growing companies, large fleets |

### ISO Management (ACSI)
| Tier | Price | Included | Best For |
|------|-------|----------|----------|
| ISO Essentials | $49/mo | 5 Gap Analysis checks + Templates | Startups prepping for first certification |
| ISO Professional | $149/mo | Unlimited ISO AI + Audit Checklists + Write-Up Free tools | Companies maintaining ISO 9001/14001/45001 |
| Integrated Enterprise | $299/mo | CCH + ACSI Combined, up to 50 employees (+$2/employee beyond 50) | Mid-sized firms with high compliance risk |

### Specialized Services (Add-ons)
| Service | Price | Description |
|---------|-------|-------------|
| Spanish Bilingual Medical Assistant | $199/mo per location | Standalone clinic tool for Spanish bilingual patient communication |
| Human Expert Retainer | $499/mo | Professional safety director support, crisis response, audit defense |
| BrandNSwag Platform | $49/mo | QR recognition system, points tracking, engagement reports |

### ACSI Mentorship Program (CCH Exclusive)
| Tier | Price | Includes |
|------|-------|----------|
| Foundation | $2,500 | 12-week intensive, 1-on-1 mentoring, one standard, certificate |
| Executive | $5,000 | Everything in Foundation + multi-standard, mock audit, 3-month follow-up |

## ACSI Mentorship Program Details
The first and only ISO Mentorship Program - exclusive to CCH. Developed from years of real-world audit experience.

### Who It's For
- Quality Managers (ISO 9001, IATF 16949)
- EHS Coordinators (ISO 14001, ISO 45001)
- Internal Auditors needing expert guidance

### Key Benefits
- Ongoing guidance and reinforcement (not just one-time training)
- Practical application support for real-world challenges
- Audit-facing confidence development
- Reduced reactive consulting costs
- Long-term system sustainability

### Standards Covered
ISO 9001, IATF 16949, ISO 14001, ISO 45001, and related standards

## Tech Stack
- Frontend: React + Vite + TailwindCSS + shadcn/ui
- Backend: Express + Node.js
- Database: PostgreSQL with Drizzle ORM
- AI: Anthropic Claude via Replit AI integration
- Auth: Replit Auth

## Stripe Integration (Configured)
Payment processing is set up with Stripe supporting:
- Credit card payments
- PayPal payments
- Subscription billing for CCH and ACSI tiers
- One-time purchases for training courses

Products configured:
- CCH: Safety Starter (Free), Unlimited Safety ($99/mo)
- ACSI: ISO Essentials ($49/mo), ISO Professional ($149/mo)
- Integrated Enterprise ($299/mo, up to 50 employees, +$2/employee beyond 50)
- Human Expert Retainer ($499/mo)
- BMA Standalone ($199/mo per location)
- BrandNSwag Platform ($49/mo)
- ACSI Mentorship: Foundation ($2,500), Executive ($5,000)
- Training courses: DOT Medical ($199), OSHA Medical ($249), Drug & Alcohol ($199), ISO Management ($349), OSHA Recordkeeping ($299), Complete Bundle ($899)

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCH), Lead ISO Auditor (ACSI)
