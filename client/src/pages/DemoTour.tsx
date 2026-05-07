import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft, ChevronRight, Bot, Shield, FileText, Users,
  Stethoscope, Languages, QrCode, Award, BookOpen, BarChart3,
  AlertTriangle, Search, ClipboardList, Calendar, Scale, Target,
  Mic, Volume2, MessageCircle, Smartphone, Lock, Sparkles,
  CheckCircle2, ArrowRight, Play, Pause, Home, Download,
  Monitor, Zap, Globe, HeartPulse, Building2, GraduationCap,
} from "lucide-react";
import logoUrl from "@assets/1_1767636977932.png";

interface TourSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  description: string;
  features: { label: string; detail: string }[];
  ctaLabel?: string;
  ctaLink?: string;
  highlight?: string;
}

const TOUR_SLIDES: TourSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Core Compliance Hub",
    subtitle: "The Only Compliance Platform You'll Ever Need",
    icon: Shield,
    iconColor: "text-[#FFC107]",
    iconBg: "bg-[#FFC107]/20",
    description: "Core Compliance Hub is a comprehensive occupational health, safety, and compliance platform designed as a one-stop shop for employers. From AI-powered compliance assistance to employee training, incident management, and clinic integrations — everything your company needs to stay compliant, all in one place.",
    features: [
      { label: "AI-Powered Compliance", detail: "Corey AI — the world's first AI built from the DNA of 29 CFR" },
      { label: "Employer Dashboard", detail: "Real-time compliance metrics, incident tracking, and action queues" },
      { label: "Employee Management", detail: "Medical surveillance, drug screens, and workforce compliance tracking" },
      { label: "Training & Certification", detail: "Full LMS with video courses, quizzes, and certificate generation" },
      { label: "Clinic Integration", detail: "Digital Medical Passport, Bilingual Medical Assistant, and more" },
    ],
    highlight: "Used by employers across construction, manufacturing, transportation, healthcare, and general industry",
  },
  {
    id: "corey-ai",
    title: "Meet Corey — Your AI Compliance Expert",
    subtitle: "$199/month per user",
    icon: Bot,
    iconColor: "text-[#FFC107]",
    iconBg: "bg-[#FFC107]/20",
    description: "Corey is the world's first AI built from the DNA of 29 CFR — a Senior Occupational Health, Safety & Compliance Expert. Unlike generic AI chatbots, Corey has a zero-tolerance anti-hallucination protocol: strictly OSHA standards (29 CFR), DOT regulations (49 CFR), ISO standards, MSHA (30 CFR), EPA, NFPA, and ANSI/ASSE. No blog posts, no articles, no guessing.",
    features: [
      { label: "Anti-Hallucination Protocol", detail: "Only cites official regulatory standards — never blogs, articles, or third-party interpretations" },
      { label: "7 Quick Actions", detail: "Lead a Safety Meeting, Audit My OSHA 300, Mock OSHA Inspection, Weekly Safety Topic, Compliance Calendar Check, Gap Analysis (ACSI), Is This Recordable?" },
      { label: "42 Document Templates", detail: "Generate policies, permits, meeting tools, and assessments on demand — all CFR-referenced" },
      { label: "Proactive Compliance", detail: "Asks follow-up questions, suggests related actions, reminds you about deadlines" },
      { label: "Team Meeting Mode", detail: "Choose from a library of safety topics or pick your own — Corey builds the full agenda" },
      { label: "Voice & Listen", detail: "Speak to Corey with the floating mic, or have responses read aloud" },
    ],
    ctaLabel: "Try Corey",
    ctaLink: "/corey",
    highlight: "Covers 18+ regulatory standards including OSHA General Industry, Construction, Maritime, Forklift, Confined Space, PSM, Electrical Safety, and more",
  },
  {
    id: "quick-actions",
    title: "Corey's Quick Actions",
    subtitle: "One-Click Compliance Power",
    icon: Zap,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
    description: "When you open Corey, you're greeted with powerful Quick Action cards. Each one launches a specialized, guided conversation — no prompt engineering required. Just click and Corey takes the lead.",
    features: [
      { label: "Lead a Safety Meeting", detail: "Choose your topic or type your own — Corey builds a full agenda with discussion questions, scenarios, and action items" },
      { label: "Audit My OSHA 300", detail: "Guided Q&A audit of your OSHA 300 Log per 29 CFR 1904 — checks for common errors, miscounts, and privacy cases" },
      { label: "Mock OSHA Inspection", detail: "Simulates a real CSHO inspection — opening conference, walk-around, document review, and closing conference with citation classifications" },
      { label: "Weekly Safety Topic", detail: "Pick a topic and get a ready-to-present 5-minute safety talk with regulatory references" },
      { label: "Compliance Calendar Check", detail: "Reviews all upcoming OSHA, DOT, and EPA deadlines for the next 90 days based on your industry" },
      { label: "Gap Analysis — ACSI", detail: "Explains what gap analysis covers and connects you with ACSI (Assessment & Consulting Services Inc.) at acsi-quality.com" },
      { label: "Is This Recordable?", detail: "Step-by-step OSHA recordability determination per 29 CFR 1904.7 — first aid vs. medical treatment, which 300 Log column to use" },
    ],
  },
  {
    id: "document-templates",
    title: "42 Document Templates",
    subtitle: "Generate Compliance Documents Instantly",
    icon: FileText,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
    description: "Corey can generate 42 different compliance documents organized into four categories. Each template is backed by the exact CFR standard it references. Generate, review, download as PDF, email, or print — all from within the chat.",
    features: [
      { label: "Policies & Programs (14)", detail: "Drug & Alcohol Policy, OSHA Recordkeeping SOP, Respiratory Protection, Hearing Conservation, HazCom, LOTO, EAP, Fire Prevention, Bloodborne Pathogens, Forklift Safety, Fit for Duty Policy, Fall Protection, Electrical Safety, PSM Overview" },
      { label: "Permits & Forms (16)", detail: "FFD Form, Return-to-Duty Checklist, Incident Investigation Form, Confined Space Permit, Hot Work Permit, Contractor Pre-Qual, Letter to the Clinic, Medical Passport Authorization, Near Miss Report, CAPA Form, Return-to-Work Letter, Reasonable Suspicion Form, First Report of Injury, Respirator Med Eval, DOT DQ File Checklist, Medical Surveillance Consent" },
      { label: "Meeting Tools (5)", detail: "Safety Meeting Agenda, Incident Review Agenda, Toolbox Talk Sign-In Sheet, Workplace Injury Debriefing Guide, Weekly Safety Topic Brief" },
      { label: "Assessments (7)", detail: "Job Hazard Analysis (JHA), New Employee Safety Orientation Checklist, OSHA 300 Log Recordability Audit, Safety Program Gap Assessment, DOT Compliance Self-Assessment, Drug Testing Program Compliance Audit, PPE Hazard Assessment" },
    ],
    highlight: "Every document includes the specific 29 CFR / 49 CFR / NFPA standard reference — download as PDF with the CCHUB letterhead",
  },
  {
    id: "employer-platform",
    title: "Employer Compliance Platform",
    subtitle: "$599/month (Platform only) · $699/month with Corey AI — Up to 50 employees (+$2/employee beyond 50)",
    icon: Building2,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    description: "The full employer platform gives you a real-time compliance dashboard, employee management, incident tracking, OSHA 300 reporting, drug testing coordination, medical surveillance tracking, and the complete training LMS — everything a compliance manager needs in one place.",
    features: [
      { label: "Compliance Dashboard", detail: "Real-time metrics, incident heatmap, compliance scores, and action queues at a glance" },
      { label: "Employee Management", detail: "Track medical surveillance, certifications, drug screen schedules, and work restrictions per employee" },
      { label: "Incident Logging", detail: "Log and manage workplace incidents with OSHA 300 reporting, root cause analysis, and Corrective Action Plans (CAPA)" },
      { label: "Company Profile", detail: "Set up your company details, industry, DOT/FMCSA info, DER contacts, and clinic partnerships" },
      { label: "Team Seats", detail: "Multi-seat billing so your entire safety team can use Corey AI with private conversation isolation" },
      { label: "DOT Notifications", detail: "Automated notifications for DOT random selections, medical card expirations, and compliance deadlines" },
    ],
    ctaLabel: "See Plans",
    ctaLink: "/get-started",
  },
  {
    id: "training-lms",
    title: "Training & Certification LMS",
    subtitle: "Full Learning Management System",
    icon: GraduationCap,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
    description: "A complete training platform with video modules, interactive quizzes, progress tracking, and professional certificate generation. Employers can assign courses, track completion, and maintain training records for compliance audits.",
    features: [
      { label: "Video Course Modules", detail: "Professional safety training courses with chapters, video content, and knowledge checks" },
      { label: "Interactive Quizzes", detail: "Multiple-choice assessments with passing scores and unlimited retakes" },
      { label: "Progress Tracking", detail: "Real-time progress bars, completion status, and time tracking per employee" },
      { label: "Certificate Generation", detail: "Professional PDF certificates with QR verification codes — audit-ready documentation" },
      { label: "Course Library", detail: "Workplace Safety Orientation, Injury Reporting, Slips/Trips/Falls, HazCom, PPE Essentials, Drug & Alcohol Awareness" },
    ],
    ctaLabel: "View Training",
    ctaLink: "/training",
  },
  {
    id: "bilingual-assistant",
    title: "AI Medical Interpreter (BMA)",
    subtitle: "Spanish Bilingual Medical Assistant",
    icon: Languages,
    iconColor: "text-[#FFC107]",
    iconBg: "bg-[#FFC107]/20",
    description: "A standalone tool for occupational health clinics. Bidirectional real-time interpretation between English-speaking providers and Spanish-speaking patients. Features speech-to-text for both languages, an interactive body map for injury localization, multi-step bilingual forms, and clinical command quick-buttons.",
    features: [
      { label: "Real-Time Interpretation", detail: "Provider speaks English, patient speaks Spanish — AI translates both directions with clinical precision" },
      { label: "Audio Playback (EN/ES)", detail: "Responses are spoken aloud in the appropriate language — true hands-free conversation for provider and patient" },
      { label: "Interactive Body Diagram", detail: "English/Spanish labeled body regions — patient indicates the area of discomfort for accurate injury localization" },
      { label: "Bilingual Clinical Commands", detail: "Common clinical exam phrases instantly available in both languages — no typing required" },
      { label: "Multi-Step Forms", detail: "Bilingual injury reporting, new hire intake, and drug screen instruction forms" },
    ],
    ctaLabel: "See BMA",
    ctaLink: "/clinic-assistant",
  },
  {
    id: "digital-passport",
    title: "CCHUB Handshake — Digital Medical Passport",
    subtitle: "QR-Based Clinic Check-In System",
    icon: QrCode,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
    description: "The CCHUB Handshake replaces paper authorization forms with a smart digital system. Employers generate QR codes for employees, clinics scan them to check patients in, and employers get real-time notifications via SMS. Track time away from work and maintain a complete visit history.",
    features: [
      { label: "QR Code Generation", detail: "Employers generate a unique QR passport for each employee visit — contains all authorization details" },
      { label: "Smart Authorization Forms", detail: "Digital consent forms replace paper — signed on-screen at the clinic with full audit trail" },
      { label: "Employer Notifications", detail: "DER is notified the moment their employee checks in at the clinic — real-time visibility" },
      { label: "Time-Away Tracking", detail: "Track when the employee left work and when they returned — automatic time-away calculations" },
      { label: "Employee Arrival Confirmation", detail: "Simple one-tap check-in at the clinic — employer receives an instant notification" },
    ],
    ctaLabel: "Generate Passport",
    ctaLink: "/employee-passport",
  },
  {
    id: "recordability",
    title: "Is This Recordable? Decision Tree",
    subtitle: "Free Public Tool — No Login Required",
    icon: Scale,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/20",
    description: "An interactive 5-question decision tree on the landing page that walks anyone through OSHA recordability criteria based on 29 CFR 1904. Completely free, no login needed — a valuable public tool that also drives traffic to the platform.",
    features: [
      { label: "5-Question Flow", detail: "Was it work-related? Is it a new case? Did it result in death, days away, restricted work, or medical treatment beyond first aid?" },
      { label: "29 CFR 1904 Based", detail: "Every decision point references the specific OSHA standard section" },
      { label: "Instant Determination", detail: "Get a clear answer: Recordable or Not Recordable, with the regulatory basis explained" },
      { label: "No Login Required", detail: "Available to anyone on the landing page — great for marketing and lead generation" },
    ],
    ctaLabel: "Try It",
    ctaLink: "/decision-tree",
  },
  {
    id: "brandnswag",
    title: "BrandNSwag — Employee Recognition",
    subtitle: "QR-Code Points-Based Rewards",
    icon: Award,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/20",
    description: "An employee recognition platform integrated within CCHUB. Managers award points to employees via QR codes for safety achievements, training completion, and exemplary compliance behavior. Employees redeem points for branded merchandise and rewards.",
    features: [
      { label: "QR Recognition", detail: "Managers scan or generate QR codes to instantly award recognition points to employees" },
      { label: "Points System", detail: "Employees accumulate points for safety milestones, training completion, and peer recognition" },
      { label: "Rewards Catalog", detail: "Branded merchandise, gift cards, and custom rewards redeemable with earned points" },
      { label: "Safety Incentives", detail: "Tie recognition directly to safety performance — incident-free streaks, near-miss reporting, training excellence" },
    ],
    ctaLabel: "Explore BrandNSwag",
    ctaLink: "/brandnswag",
  },
  {
    id: "acsi",
    title: "ACSI ISO Manager",
    subtitle: "Assessment & Consulting Services Inc.",
    icon: Target,
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/20",
    description: "ACSI provides Lead ISO Auditor AI for ISO 9001, 14001, and 45001 management systems. Gap analysis, audit preparation, and implementation support — all integrated within the CCHUB ecosystem. For full gap analysis engagements, users are connected directly to ACSI at acsi-quality.com.",
    features: [
      { label: "ISO 9001 (Quality)", detail: "Quality Management System guidance, documentation templates, and audit readiness checks" },
      { label: "ISO 14001 (Environmental)", detail: "Environmental Management System support including aspects/impacts analysis and compliance obligations" },
      { label: "ISO 45001 (OH&S)", detail: "Occupational Health & Safety management system aligned with OSHA compliance" },
      { label: "Gap Analysis", detail: "Full gap analysis is ACSI's flagship service — Corey connects users directly to acsi-quality.com" },
      { label: "Audit Preparation", detail: "Document review, internal audit guidance, and management review preparation" },
    ],
    ctaLabel: "Visit ACSI",
    ctaLink: "/iso-manager",
  },
  {
    id: "pricing",
    title: "Simple, Transparent Pricing",
    subtitle: "Two Plans — No Hidden Fees",
    icon: Sparkles,
    iconColor: "text-[#FFC107]",
    iconBg: "bg-[#FFC107]/20",
    description: "Core Compliance Hub offers flexible plans. Corey AI at $199/month per user for compliance professionals, and the Employer Platform at $599/month (or $699/month bundled with Corey AI) for companies that need the complete compliance suite.",
    features: [
      { label: "Corey AI — $199/month per user", detail: "Unlimited conversations, 42 document templates, all Quick Actions, voice input/output, Team Meeting Mode, Audit Mode — per user, not per company" },
      { label: "Employer Platform — $599/month", detail: "Dashboard, Employee Management, Incident Logging, OSHA 300, Training LMS, CCHUB Handshake, DOT Notifications — up to 50 employees" },
      { label: "Platform + Corey AI — $699/month", detail: "Employer Platform with 1 Corey seat included. Additional Corey seats $129/month each" },
      { label: "Beyond 50 Employees", detail: "+$2/employee/month for companies over 50 employees — scales affordably" },
      { label: "BMA Clinic Tool", detail: "Separate subscription for occupational health clinics — includes Bilingual Medical Assistant and Digital Passport integration" },
    ],
    ctaLabel: "Compare Plans",
    ctaLink: "/get-started",
    highlight: "Flexible billing with multiple payment options supported",
  },
];

export default function DemoTour() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const slide = TOUR_SLIDES[currentSlide];

  const goNext = () => setCurrentSlide((prev) => Math.min(prev + 1, TOUR_SLIDES.length - 1));
  const goPrev = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white" data-testid="demo-tour-page">
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src={logoUrl} alt="CCHUB" className="h-8 cursor-pointer" data-testid="link-tour-home" />
            </Link>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-white/70">Platform Tour</span>
              <span className="text-xs text-white/40 ml-2">
                {currentSlide + 1} of {TOUR_SLIDES.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 mr-4">
              {TOUR_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentSlide ? "bg-[#FFC107] w-6" : i < currentSlide ? "bg-[#FFC107]/40" : "bg-white/20"
                  }`}
                  data-testid={`dot-slide-${i}`}
                />
              ))}
            </div>
            <Link href="/get-started">
              <Button size="sm" className="bg-[#FFC107] text-black hover:bg-[#FFD54F] font-bold" data-testid="link-tour-get-started">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div
          className="transition-all duration-500 ease-out"
          key={slide.id}
          style={{ animation: "fadeSlideIn 0.4s ease-out" }}
        >
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${slide.iconBg} mb-4`}>
              <slide.icon className={`w-8 h-8 ${slide.iconColor}`} />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2" data-testid="text-slide-title">
              {slide.title}
            </h1>
            <p className="text-lg md:text-xl text-[#FFC107] font-semibold" data-testid="text-slide-subtitle">
              {slide.subtitle}
            </p>
          </div>

          <Card className="bg-white/5 border-white/10 p-6 md:p-8 mb-6">
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6" data-testid="text-slide-description">
              {slide.description}
            </p>

            <div className="grid gap-4">
              {slide.features.map((feat, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start p-3 rounded-lg bg-white/5 border border-white/5"
                  style={{ animation: `fadeSlideIn 0.4s ease-out ${0.1 * (i + 1)}s both` }}
                  data-testid={`feature-${slide.id}-${i}`}
                >
                  <CheckCircle2 className="w-5 h-5 text-[#FFC107] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white text-sm">{feat.label}</span>
                    <span className="text-white/60 text-sm ml-1">— {feat.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {slide.highlight && (
              <div className="mt-6 p-4 rounded-lg bg-[#FFC107]/10 border border-[#FFC107]/20">
                <p className="text-sm text-[#FFC107] font-medium">
                  <Sparkles className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  {slide.highlight}
                </p>
              </div>
            )}

            {slide.ctaLabel && slide.ctaLink && (
              <div className="mt-6 text-center">
                <Link href={slide.ctaLink}>
                  <Button className="bg-[#FFC107] text-black hover:bg-[#FFD54F] font-bold px-8" data-testid={`cta-${slide.id}`}>
                    {slide.ctaLabel} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="border-white/20 text-white disabled:opacity-30"
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/40 hidden sm:inline">
              {slide.title}
            </span>
            <Badge className="bg-white/10 text-white/70 no-default-hover-elevate">
              {currentSlide + 1} / {TOUR_SLIDES.length}
            </Badge>
          </div>

          {currentSlide < TOUR_SLIDES.length - 1 ? (
            <Button
              onClick={goNext}
              className="bg-[#FFC107] text-black hover:bg-[#FFD54F] font-bold"
              data-testid="button-next-slide"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Link href="/get-started">
              <Button
                className="bg-green-600 hover:bg-green-500 text-white font-bold"
                data-testid="button-tour-finish"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {TOUR_SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(i)}
              className={`p-3 rounded-lg text-center transition-all border ${
                i === currentSlide
                  ? "bg-[#FFC107]/20 border-[#FFC107]/40 text-white"
                  : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
              data-testid={`nav-slide-${s.id}`}
            >
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${i === currentSlide ? s.iconColor : ""}`} />
              <span className="text-[10px] leading-tight block">{s.title.replace("Core Compliance Hub", "CCHUB").replace("— Your AI Compliance Expert", "").replace("— Employee Recognition", "").replace("— Digital Medical Passport", "").split("—")[0].trim()}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
