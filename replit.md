# Core Compliance Hub

## Overview
**CCH: THE ONE STOP EMPLOYER SHOP** - Occupational health and compliance platform featuring an AI-powered OccHealth Consultant, ACSI ISO Manager, OSHA 300 decision tool, professional training courses, **ACSI Mentorship Program** (CCH exclusive), and **BrandNSwag** employee recognition division.

## Features
- **OccHealth Consultant**: AI-powered chat acting as a Senior Occupational Health & Safety Compliance Expert, referencing OSHA 29 CFR 1904 and DOT 49 CFR Part 40
- **ACSI ISO Manager**: Lead ISO Auditor AI for ISO 9001, 14001, and 45001. Helps with Gap Analysis, Quality Manuals, and Internal Audit preparation with a "Write-Up Free" philosophy
- **OSHA 300, Log it or Not**: Interactive decision tree for OSHA recordability
- **Client Compliance Dashboard**: Real-time metrics for ISO audit readiness, medical surveillance, drug screen status, with incident heatmap and action queue
- **Employee Management**: Track employees with DOT physical dates, respiratory exams, drug test results, and random pool inclusion (/employees)
- **Incident Log & OSHA 300**: Full OSHA 300 log with employee name, job title, location, body part, nature of injury, classification, and printable report (/incidents)
- **Corrective Action Plans (CAPA)**: Create policies and procedures to prevent future incidents. Includes root cause analysis, corrective/preventive actions, responsible person assignment, and verification tracking
- **Company Profile**: Set company information (NAICS code, DOT number, address, DER contact info, company logo) for compliance documentation (/settings)
- **Human Expert Retainer**: Professional human support for crisis response, OSHA 300 log audits, and audit defense
- **Lead Capture**: Free recordability cheat sheet download
- **Training Courses**: Self-paced compliance training with certificates
- **ACSI Mentorship Program**: CCH Exclusive - First ISO Mentorship Program. Ongoing guidance and competency development for internal system owners
- **BrandNSwag**: Smart Swag division for employee recognition and engagement
- **Bilingual Medical Assistant**: Landing page tool with three modes (Injury Reporting, New Hire Intake, Drug Screen Instructions). Features Spanish text-to-speech via Web Speech API, bidirectional speech-to-text (patient speaks Spanish, auto-translates to English), interactive body map, multi-step bilingual forms, Staff Command Center with clinic instructions, and printable clinical summaries. Component at `client/src/components/BilingualAssistant.tsx`
- **Digital Medical Passport (CCH Handshake)**: QR-based clinic check-in system. Employers generate QR codes for employees visiting clinics. When scanned, the QR opens the Bilingual Clinical Assistant with employee data pre-loaded. Includes digital authorization (no phone call to employer needed), "I'm Here" SMS notification to employer via Twilio, and 24-hour token expiry for security. Pages: `/employee-passport` (generate QR), `/clinic-assistant?token=xxx` (public clinic-facing page)

## Data Management Routes
- **/dashboard**: Client Compliance Dashboard with metrics, incident heatmap, action queue
- **/employees**: Employee Management - add/edit/delete employees, track DOT physicals, drug tests, respiratory exams
- **/incidents**: Incident Log - record workplace incidents, track OSHA recordability, OSHA 300 report with print feature, Corrective Action Plans (CAPA)
- **/settings**: Company Profile (with DER contact info, logo upload, and clinic authorization form uploads per visit type) and subscription management
- **/employee-passport**: Digital Medical Passport - generate QR codes for employee clinic check-ins with digital authorization
- **/clinic-assistant**: Public clinic-facing page (opened by QR scan) with employee info, authorization verification, employer notification, and bilingual tools

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

## Pricing Structure

### Occupational Health (CCH)
| Tier | Price | Included | Best For |
|------|-------|----------|----------|
| Safety Starter | Free | 3 Questions/month | Small teams, one-off checks |
| Compliance Pro | $29/mo | 15 Questions/month + PDF Checklists | Growing companies |
| Unlimited Safety | $99/mo | Unlimited Questions + Audit Prep Tools | Safety Managers, large fleets |

### ISO Management (ACSI)
| Tier | Price | Included | Best For |
|------|-------|----------|----------|
| ISO Essentials | $49/mo | 5 Gap Analysis checks + Templates | Startups prepping for first certification |
| ISO Professional | $149/mo | Unlimited ISO AI + Audit Checklists + Write-Up Free tools | Companies maintaining ISO 9001/14001/45001 |
| Integrated Enterprise | $299/mo | CCH + ACSI Combined, Full suite + Dashboard | Mid-sized firms with high compliance risk |

### Human Expert Retainer (Add-on)
- **App + Retainer**: $499/mo - For companies with 20-100 employees who need professional safety director level protection

## ACSI Mentorship Program (CCH Exclusive)
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
- CCH: Safety Starter (Free), Compliance Pro ($29/mo), Unlimited Safety ($99/mo)
- ACSI: ISO Essentials ($49/mo), ISO Professional ($149/mo)
- Integrated Enterprise ($299/mo)
- Human Expert Retainer ($499/mo)
- Training courses: DOT Medical ($199), OSHA Medical ($249), Drug & Alcohol ($199), ISO Management ($349), OSHA Recordkeeping ($299), Complete Bundle ($899)

## User Preferences
- Large logo display preferred
- Focus on Occupational Medicine terminology
- AI personas: Senior Occupational Health & Safety Compliance Expert (CCH), Lead ISO Auditor (ACSI)
