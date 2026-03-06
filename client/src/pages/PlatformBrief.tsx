import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, CheckCircle2, Download, ArrowLeft, FileText, Video } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@assets/1_1767636977932.png";

const VIDEO_SCRIPT = `
==============================================================
CCHUB — CORE COMPLIANCE HUB VIDEO SCRIPT
==============================================================
For the video producer: Read at a natural, confident, conversational pace.
Each [SCENE] marker is a suggested visual cut or slide change.
Total runtime: approximately 3–4 minutes.
==============================================================

[SCENE 1 — HOOK]

If you're an employer, a safety director, or anyone responsible for keeping a workplace compliant with OSHA, DOT, or federal regulations — this is for you.

Because right now, there is a better way to handle compliance. And it starts with one platform.

[SCENE 2 — THE PROBLEM]

Every year, companies pay millions in OSHA fines. Not because they didn't care — but because compliance is complicated, time-consuming, and scattered across binders, spreadsheets, and phone calls to consultants.

You need a compliance officer, a safety trainer, a DOT specialist, and a medical liaison — all at once, all day long.

What if you had all of that in your pocket?

[SCENE 3 — INTRODUCING COREY]

Meet Corey.

The world's first AI built from the DNA of 29 CFR.

Corey is not a generic chatbot with a compliance wrapper. Corey is a Senior Occupational Health, Safety and Compliance Expert — built exclusively from official regulatory sources: OSHA, DOT, ISO, MSHA, EPA, NFPA, and ANSI.

He never cites a blog post. He never guesses at a regulation number. When he gives you an answer, it comes with the exact CFR citation to back it up.

Ask Corey anything — OSHA recordkeeping, DOT drug testing, respirator compliance, forklift safety, bloodborne pathogens — and you get a precise, regulation-backed answer in seconds.

[SCENE 4 — QUICK ACTIONS]

Corey doesn't just answer questions. He takes action.

With seven one-click Quick Actions, you can have Corey lead a full safety meeting — complete with an agenda, discussion questions, and a real-world scenario — all built around the topic you choose.

Ask him to audit your OSHA 300 Log. He'll walk you through every column, check for errors, and flag anything that puts you at risk.

Need to prepare for an OSHA inspection? Corey runs a complete mock inspection — opening conference, walkaround, document review — just like a real compliance officer would.

[SCENE 5 — DOCUMENT TEMPLATES]

And when you need documents, Corey generates them.

Twenty-three professional compliance documents, organized by category: policies and programs, permits and forms, meeting tools, and assessments.

Emergency Action Plans. Confined Space Entry Permits. Hot Work Permits. Respiratory Protection Programs. Job Hazard Analysis templates. All referencing exact CFR standards. All ready to customize and use.

[SCENE 6 — THE EMPLOYER PLATFORM]

Corey is just the beginning.

The Core Compliance Hub Employer Platform gives you a complete compliance command center.

Track your employees' medical surveillance, drug screens, certifications, and work restrictions — all in one place.

Log workplace incidents, generate OSHA 300 and 301 reports, and build Corrective Action Plans with real accountability and follow-up tracking.

Get automated DOT physical expiration alerts — at 60 days, 30 days, 15 days, and 7 days — sent directly to your phone by text.

And with a built-in Learning Management System, assign training courses to your team, track completions, and issue professional PDF certificates with QR verification codes.

[SCENE 7 — CCHUB HANDSHAKE & CLINIC TOOLS]

We also built tools specifically for the moment an employee needs to see a doctor.

The CCHUB Handshake is a QR-based Digital Medical Passport. Generate a QR code for each clinic visit, the employee scans in at the clinic, and you get an instant text notification the moment they arrive. No paper forms. No phone calls. Just clean, digital authorization — start to finish.

And for occupational health clinics, our Bilingual Medical Assistant provides real-time AI interpretation between English-speaking providers and Spanish-speaking patients. Both directions. Hands-free. Built for the clinic floor.

[SCENE 8 — PHONE APP]

Corey is also a downloadable app.

On an iPhone, tap Share and Add to Home Screen. On Android, tap Install. Corey appears on your home screen like a native app — no app store required.

Compliance answers, one tap away, wherever you are.

[SCENE 9 — PRICING]

Corey AI is ninety-nine dollars per month, per user. No contracts. Cancel anytime.

The full Employer Compliance Platform is two hundred ninety-nine dollars per month — covering up to fifty employees, with everything included.

[SCENE 10 — CALL TO ACTION]

This is Core Compliance Hub. One platform. Everything you need.

Visit corecompliancehub.com to get started today.

Corey is ready when you are.

==============================================================
END OF VIDEO SCRIPT
==============================================================
`.trim();

const BRIEF = `
==========================================================
CORE COMPLIANCE HUB (CCHUB) — FULL PLATFORM BRIEFING
==========================================================
Prepared for review — All capabilities, features, architecture, and pricing.
==========================================================

1. WHAT IS CORE COMPLIANCE HUB?
-------------------------------
Core Compliance Hub (CCHUB) is a comprehensive AI-powered occupational health, safety, and compliance platform designed as a one-stop shop for employers. It replaces scattered spreadsheets, paper forms, and generic AI chatbots with a unified system purpose-built for OSHA, DOT, ISO, and workplace compliance.

Target Market: Safety Directors, EHS Managers, HR Professionals, Plant Managers, Business Owners, Quality Managers, Internal Auditors, Compliance Officers across all industries — construction, manufacturing, transportation, healthcare, general industry.

2. PRICING
----------
- Corey AI: $149/month PER USER (not per company)
  - Unlimited conversations, all Quick Actions, 42 document templates, voice input/output, Team Meeting Mode, Audit Mode
  
- Employer Compliance Platform: $499/month (Platform only) · $549/month with 1 Corey AI seat
  - Dashboard, Employee Management, Incident Logging, Training LMS, CCHUB Handshake, DOT Notifications
  - Additional Corey seats: $99/month each
  - Up to 50 employees included; +$2/employee/month beyond 50
  
- Bilingual Medical Assistant (BMA): Separate subscription for occupational health clinics

- Deferred (not yet live): Success Manager Retainer at $499/month

3. COREY AI — THE WORLD'S FIRST AI BUILT FROM THE DNA OF 29 CFR
----------------------------------------------------------------
Corey is not a generic AI chatbot. Corey is a Senior Occupational Health, Safety & Compliance Expert with a zero-tolerance anti-hallucination protocol.

Anti-Hallucination Protocol:
- ONLY cites official regulatory standards: OSHA (29 CFR), DOT (49 CFR), ISO, MSHA (30 CFR), EPA, NFPA, ANSI/ASSE, NIOSH
- NEVER cites blog posts, articles, or third-party interpretations
- If unsure about a specific CFR number, says so — never guesses
- Always provides exact CFR section numbers when citing standards
- If a question falls outside regulatory expertise, states that clearly

Proactive Compliance Behavior:
- Asks follow-up questions to understand industry, company size, and situation before answering
- Proactively suggests related compliance actions ("While we're on respirators, have you updated your written Respiratory Protection Program this year?")
- Reminds users about upcoming deadlines ("Remember, OSHA 300A must be posted by February 1st")
- Offers to generate relevant documents after answering questions

Regulatory Coverage (18+ standards):
- 29 CFR 1904 — Recordkeeping
- 29 CFR 1910 — General Industry (all subparts)
- 29 CFR 1926 — Construction
- 29 CFR 1915/1917/1918 — Maritime
- 49 CFR Part 40 — DOT Drug & Alcohol Testing
- 49 CFR Part 382 — FMCSA Controlled Substances
- 30 CFR — MSHA Mining Safety
- ISO 9001, 14001, 45001, IATF 16949, AS9100, ISO 13485, ISO 22000, ISO 27001, ISO 50001
- NFPA 70E — Electrical Safety
- ANSI/ASSE standards
- PSM — 29 CFR 1910.119
- Permit-Required Confined Spaces — 29 CFR 1910.146
- Forklifts — 29 CFR 1910.178
- Fall Protection — 29 CFR 1926 Subpart M
- Cranes and Derricks — 29 CFR 1926 Subpart CC
- Electrical Safety — 29 CFR 1910 Subpart S

7 Quick Actions (one-click guided conversations):
1. Lead a Safety Meeting — Choose from 25 topics or type your own; Corey builds full agenda with discussion questions, scenarios, and action items
2. Audit My OSHA 300 — Guided Q&A audit per 29 CFR 1904; checks for miscounted days, privacy cases, posting compliance
3. Mock OSHA Inspection — Simulates a CSHO inspection with opening conference, walk-around, document review, citation classifications, closing conference
4. Weekly Safety Topic — Pick a topic, get a ready-to-present 5-minute safety talk with regulatory references
5. Compliance Calendar Check — Reviews upcoming OSHA, DOT, EPA deadlines for next 90 days tailored to industry
6. Gap Analysis — ACSI — Explains gap analysis and connects users directly to ACSI (Assessment & Consulting Services Inc.) at acsi-quality.com
7. Is This Recordable? — Step-by-step OSHA recordability determination per 29 CFR 1904.7; distinguishes first aid vs. medical treatment; identifies correct OSHA 300 Log column

42 Document Templates (organized by category):
POLICIES & PROGRAMS (14):
  - Drug & Alcohol Policy (49 CFR Part 40 / 49 CFR Part 382)
  - OSHA Recordkeeping SOP (29 CFR 1904)
  - Respiratory Protection Program (29 CFR 1910.134)
  - Hearing Conservation Program (29 CFR 1910.95)
  - Hazard Communication Program (29 CFR 1910.1200)
  - Lockout/Tagout Program (29 CFR 1910.147)
  - Emergency Action Plan (29 CFR 1910.38)
  - Fire Prevention Plan (29 CFR 1910.39)
  - Bloodborne Pathogen Exposure Control Plan (29 CFR 1910.1030)
  - Forklift/PIT Safety Program (29 CFR 1910.178)
  - Fit for Duty Policy
  - Fall Protection Plan (29 CFR 1926.502)
  - Electrical Safety Program (NFPA 70E / 29 CFR 1910 Subpart S)
  - Process Safety Management Overview (29 CFR 1910.119)

PERMITS & FORMS (16):
  - Fit for Duty (FFD) Form
  - Return-to-Duty Checklist (49 CFR Part 40)
  - Incident Investigation Form (29 CFR 1904.7)
  - Confined Space Entry Permit (29 CFR 1910.146)
  - Hot Work Permit Template
  - Contractor Safety Pre-Qualification Form
  - Letter to the Clinic (Occupational Health Referral Letter)
  - Digital Medical Passport Authorization
  - Near Miss Report Form
  - Corrective Action Plan (CAPA) Form
  - Return-to-Work Authorization Letter
  - Reasonable Suspicion Documentation Form (49 CFR Part 382.307)
  - Supervisor First Report of Injury
  - Respirator Medical Evaluation Questionnaire (29 CFR 1910.134 Appendix C)
  - DOT Driver Qualification File Checklist (49 CFR Part 391)
  - Medical Surveillance Consent Form

MEETING TOOLS (5):
  - Safety Meeting Agenda Template
  - Incident Review Meeting Agenda
  - Toolbox Talk Sign-In Sheet
  - Workplace Injury Debriefing Guide
  - Weekly Safety Topic Brief

ASSESSMENTS (7):
  - Job Hazard Analysis (JHA) (OSHA 3071)
  - New Employee Safety Orientation Checklist
  - OSHA 300 Log Recordability Audit (29 CFR 1904)
  - Safety Program Gap Assessment (OSHA Recommended Practices)
  - DOT Compliance Self-Assessment (49 CFR Parts 380-399)
  - Drug Testing Program Compliance Audit (49 CFR Part 40 / Part 382)
  - PPE Hazard Assessment (29 CFR 1910.132)

Voice Features:
- Floating mic button for hands-free voice input from anywhere in a conversation
- Listen button to hear Corey's responses read aloud
- Speech-to-text populates the chat input

PDF Export:
- Download any Corey response as a branded PDF with CCHUB letterhead
- Unicode character sanitization for clean rendering (handles μg/m³, degree symbols, smart quotes, etc.)

Team Meeting Mode:
- 25 pre-built safety topics covering all major OSHA hazard categories
- "I'll Pick My Own Topic" option for custom company-specific topics
- Full meeting agendas with discussion questions, regulatory references, and action items

4. EMPLOYER COMPLIANCE PLATFORM
-------------------------------
Dashboard:
- Real-time compliance metrics (TRIR, DART rates)
- Incident heatmap
- Action queues and pending items
- Compliance score tracking

Employee Management:
- Full employee roster with medical surveillance tracking
- Drug screen schedules and results
- Certification and training record tracking
- Work restriction management

Incident Logging:
- Workplace incident recording and classification
- OSHA 300 Log generation and management
- OSHA 301 incident reports
- Root cause analysis
- Corrective Action Plans (CAPA) with task tracking and follow-up

Company Profile:
- Company details, industry classification, NAICS codes
- DOT/FMCSA information (DOT number, MC number)
- Designated Employer Representative (DER) contacts
- Clinic partnership settings

Team Seats:
- Multi-seat billing for Corey AI ($149/user/month standalone; $99/additional seat on Platform bundle)
- Each user gets private conversation isolation
- Centralized billing under the employer account

DOT Notifications:
- Automated alerts for DOT physical expirations (60, 30, 15, 7-day warnings)
- Random drug testing selection notifications
- Medical card expiration tracking
- SMS delivery via Twilio

5. TRAINING & CERTIFICATION LMS
--------------------------------
Full learning management system built into the platform:
- Video course modules with chapters
- Interactive multiple-choice quizzes with passing scores
- Real-time progress tracking per employee
- Professional PDF certificates with QR verification codes
- Course assignment and completion tracking for employers

Course Library:
- Workplace Safety Orientation
- Injury Reporting & First Aid Awareness
- Slips, Trips & Falls Prevention
- Hazard Communication (Right to Know)
- PPE Essentials
- Drug & Alcohol Awareness

6. AI MEDICAL INTERPRETER (BILINGUAL MEDICAL ASSISTANT / BMA)
-------------------------------------------------------------
A standalone tool for occupational health clinics providing real-time bidirectional interpretation between English-speaking providers and Spanish-speaking patients.

Features:
- Provider speaks/types in English → AI translates to Spanish for patient
- Patient speaks in Spanish → AI translates to English for provider
- Listen buttons: EN (blue) for provider to hear English, ES (gold) for patient to hear Spanish
- Mic buttons for both provider (English speech-to-text) and patient (Spanish speech-to-text)
- True hands-free conversation flow

Interactive Body Map:
- 22 body parts with English/Spanish labels
- Patient taps where it hurts for accurate injury localization

Clinical Quick Commands (pre-built bilingual phrases):
- Vision Test commands
- Physical Exam commands
- Drug Screen instructions
- Breathing/PFT commands
- Blood Draw commands
- Temperature/vital sign commands

Multi-Step Bilingual Forms:
- Injury Reporting Form
- New Hire Intake Form
- Drug Screen Instruction Form

Visit Type Context:
- DOT Physical, Drug & Alcohol Testing, Injury Reporting, Work Restrictions, Respiratory/PFT, Blood Draw, General Medical Visit

7. CCHUB HANDSHAKE — DIGITAL MEDICAL PASSPORT
--------------------------------------------
QR-based clinic check-in system replacing paper authorization forms:

- Employers generate a unique QR passport for each employee visit
- QR contains all authorization details (visit type, services needed, employer info)
- Smart digital authorization forms with on-screen signature capture
- Employer (DER) receives SMS notification via Twilio when employee checks in
- "I'm Here" button for employee arrival confirmation
- Time-away tracking (when employee left work, when they returned)
- Complete visit history maintained digitally

8. "IS THIS RECORDABLE?" DECISION TREE
---------------------------------------
Public tool on the landing page — no login required:
- Interactive 5-question flow based on 29 CFR 1904 criteria
- Determines if a workplace incident is OSHA recordable
- Each decision point references the specific OSHA standard
- Provides clear determination: Recordable or Not Recordable
- Great for marketing and lead generation (drives traffic to the platform)

9. BRANDNSWAG — EMPLOYEE RECOGNITION
-------------------------------------
Points-based employee recognition platform:
- QR-code recognition for instant point awards
- Points for safety achievements, training completion, compliance behavior
- Rewards catalog with branded merchandise
- Safety incentive programs (incident-free streaks, near-miss reporting)

10. ACSI ISO MANAGER
---------------------
ACSI — Assessment & Consulting Services Inc. (full legal name)
Website: www.acsi-quality.com

Provides Lead ISO Auditor AI within the CCHUB platform for:
- ISO 9001 (Quality Management)
- ISO 14001 (Environmental Management)
- ISO 45001 (Occupational Health & Safety)

Gap Analysis is ACSI's flagship service — Corey directs users to ACSI for full gap analysis engagements rather than performing the analysis itself. This preserves ACSI's core business.

11. "MEET COREY" MARKETING PAGE
--------------------------------
Dedicated dark-themed sales page at /meet-corey:
- Hero section with animated intro
- Stats bar (regulatory standards, document templates, etc.)
- 8 capability cards showcasing Corey's features
- Anti-hallucination protocol section
- Proactive compliance section
- 42 document templates grid organized by category
- Regulatory coverage list (18+ standards)
- Audience targeting section
- FAQ accordion
- Multiple CTAs throughout

12. TRY COREY — QR CODE TRIAL
------------------------------
- Dedicated /try-corey page for marketing materials
- Uses the landing bot API with a 3-question limit per email
- QR code downloadable in PNG/SVG at /qr-code
- Server generates QR codes via the qrcode npm package

13. ADDITIONAL TOOLS
--------------------
- Compliance Checklists: Pre-built checklists for various compliance programs
- Audit Preparation: Mock audit readiness tools
- Compliance Glossary: Reference guide for compliance terminology
- Clinic Letter Generator: Automated injury communication letters
- Drug & Alcohol Policy Generator: Complete DOT-compliant policy generation
- About Page: Company information and mission
- Contact Page: Inquiry form for prospects

14. TECHNICAL ARCHITECTURE
--------------------------
Frontend: React + Vite + TailwindCSS + shadcn/ui
Backend: Express.js + Node.js
Database: PostgreSQL with Drizzle ORM
AI: Anthropic Claude (via Replit AI integration)
Authentication: Replit Auth
Payments: Stripe (credit card + PayPal)
SMS: Twilio
Speech: Web Speech API (browser-native)
PWA: Progressive Web App with offline caching
Dark Mode: Full support via next-themes with class-based toggling

15. PAGES & ROUTES (COMPLETE LIST)
----------------------------------
/                     — Landing page (public)
/get-started          — Plans comparison and signup
/meet-corey           — Corey marketing/sales page
/demo-tour            — Interactive platform tour (shareable)
/try-corey            — Trial Corey with 3-question limit
/qr-code              — QR code generator for Try Corey
/decision-tree        — "Is This Recordable?" public tool
/about                — About CCHUB
/contact              — Contact form
/corey                — Full Corey AI experience (requires login)
/bot                  — Corey AI (alternate entry)
/dashboard            — Employer compliance dashboard
/employees            — Employee management
/incidents            — Incident logging & OSHA 300
/training             — Training course catalog
/training/:id         — Individual course viewer
/employer-training    — Employer training management
/employee-training    — Employee training portal
/employee-passport    — Digital medical passport generation
/clinic-assistant     — BMA clinic interface
/clinic-agreement     — Clinic partnership signup
/clinic-letter        — Injury letter generator
/bma-subscription     — BMA subscription page
/iso-manager          — ACSI ISO management tools
/mentorship           — ACSI mentorship program
/brandnswag           — Employee recognition platform
/settings             — Account settings
/company-profile      — Company profile management
/team-seats           — Multi-seat billing management
/dot-notifications    — DOT notification management
/compliance-checklists — Pre-built compliance checklists
/audit-prep           — Audit preparation tools
/compliance-glossary  — Compliance terminology reference
/drug-alcohol-policy  — Policy generator
/sms-consent          — SMS consent form
/superadmin           — Platform admin dashboard
/leads                — Lead/inquiry management
/admin/inquiries      — Admin inquiry management
/demo                 — Legacy demo page
/resources            — Resource library

16. WHAT MAKES THIS PLATFORM UNIQUE
------------------------------------
1. ONLY AI built from the DNA of 29 CFR — not a generic chatbot with a compliance wrapper
2. Anti-hallucination protocol — zero tolerance for non-regulatory sources
3. One-stop shop — dashboard, employees, incidents, training, documents, AI expert, clinic integration all in one platform
4. Bilingual Medical Assistant — only AI-powered real-time medical interpreter built for occupational health clinics
5. CCHUB Handshake — replaces paper authorization forms with QR-based digital system
6. 42 document templates — every document references exact CFR standards
7. Proactive compliance — Corey doesn't just answer questions, he leads meetings, audits logs, conducts mock inspections, and reminds about deadlines
8. ACSI integration — ISO management and gap analysis through a dedicated consulting division
9. Employee recognition — BrandNSwag ties safety performance to rewards

==========================================================
END OF BRIEFING
==========================================================
`.trim();

type TabType = "brief" | "script";

export default function PlatformBrief() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("brief");
  const { toast } = useToast();
  const textRef = useRef<HTMLPreElement>(null);

  const activeContent = activeTab === "brief" ? BRIEF : VIDEO_SCRIPT;
  const activeFilename = activeTab === "brief" ? "CCHUB-Technical-Brief.txt" : "CCHUB-Video-Script.txt";
  const activeLabel = activeTab === "brief" ? "CCHUB-Technical-Brief.txt" : "CCHUB-Video-Script.txt";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      toast({ title: activeTab === "brief" ? "Copied — paste it into Gemini!" : "Video script copied — paste it into HeyGen!" });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      if (textRef.current) {
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        toast({ title: "Text selected — press Ctrl+C to copy" });
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFilename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${activeFilename} downloaded` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={logoUrl} alt="CCHUB" className="h-8" />
              <span className="text-sm font-semibold text-white/70">Platform Briefing</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="border-white/20 text-white"
              data-testid="button-download-brief"
            >
              <Download className="w-4 h-4 mr-1" /> Download .txt
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              className={copied ? "bg-green-600 text-white" : "bg-[#FFC107] text-black hover:bg-[#FFD54F]"}
              data-testid="button-copy-brief"
            >
              {copied ? (
                <><CheckCircle2 className="w-4 h-4 mr-1" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4 mr-1" /> Copy All</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Platform Documents</h1>
          <p className="text-white/60">Two documents — one for AI review, one ready for your video producer.</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-5 p-1 bg-white/5 rounded-xl border border-white/10 max-w-sm mx-auto" data-testid="tab-toggle">
          <button
            onClick={() => { setActiveTab("brief"); setCopied(false); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "brief"
                ? "bg-[#FFC107] text-black shadow-md"
                : "text-white/50 hover:text-white"
            }`}
            data-testid="tab-button-brief"
          >
            <FileText className="w-4 h-4" /> Technical Brief
          </button>
          <button
            onClick={() => { setActiveTab("script"); setCopied(false); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "script"
                ? "bg-[#FFC107] text-black shadow-md"
                : "text-white/50 hover:text-white"
            }`}
            data-testid="tab-button-script"
          >
            <Video className="w-4 h-4" /> Video Script
          </button>
        </div>

        {/* Tab Description */}
        {activeTab === "brief" ? (
          <p className="text-center text-sm text-white/50 mb-5">
            Copy and paste into Gemini, ChatGPT, or any AI for a comprehensive review of the platform.
          </p>
        ) : (
          <p className="text-center text-sm text-white/50 mb-5">
            Ready-to-use narration script for HeyGen, Synthesia, or any AI video tool. ~3–4 minutes. 10 scenes with visual cue markers.
          </p>
        )}

        <Card className="bg-white/5 border-white/10 p-1">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5 rounded-t-lg">
            <span className="text-xs text-white/40 font-mono">{activeLabel}</span>
            <div className="flex gap-2">
              <button onClick={handleDownload} className="text-xs text-white/50 hover:text-white flex items-center gap-1" data-testid="button-download-brief-inline">
                <Download className="w-3 h-3" /> .txt
              </button>
              <button onClick={handleCopy} className="text-xs text-white/50 hover:text-white flex items-center gap-1" data-testid="button-copy-brief-inline">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
          </div>
          <pre
            ref={textRef}
            className="p-4 md:p-6 text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-[70vh] overflow-y-auto"
            data-testid="text-platform-brief"
          >
            {activeContent}
          </pre>
        </Card>

        <div className="mt-6 text-center">
          {activeTab === "brief" ? (
            <p className="text-sm text-white/40 mb-4">
              Tip: Click "Copy All" above, then open Gemini and paste the full briefing. Ask it to review for completeness, identify any gaps, or suggest improvements.
            </p>
          ) : (
            <p className="text-sm text-white/40 mb-4">
              Tip: Copy this script, open HeyGen or Synthesia, paste it as your narration, select an AI avatar, and your video is ready to render.
            </p>
          )}
          <Link href="/demo-tour">
            <Button variant="outline" className="border-white/20 text-white" data-testid="link-to-tour">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Platform Tour
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
