import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Bot,
  Shield,
  ClipboardList,
  Users,
  FileText,
  QrCode,
  GraduationCap,
  Shirt,
  Activity,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Phone,
  Globe,
  BarChart3,
  AlertTriangle,
  Star,
  Zap,
  Award,
} from "lucide-react";
import logoUrl from "@assets/1_1767636977932.png";
import cchLogo from "@assets/1_1770683748423.png";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import brandNSwagLogo from "@assets/2026_BNS_Logo_1768928815681.png";
import mentorshipLogo from "@assets/tree.transp_1768928785893.png";
import teamImageUrl from "@assets/1-8_website_picture_1767901013934.png";

interface DemoSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  points: string[];
  liveLink?: string;
  liveLinkLabel?: string;
  visual: "hero" | "feature" | "stats" | "pricing" | "closing";
}

const slides: DemoSlide[] = [
  {
    id: "intro",
    title: "Core Compliance Hub",
    subtitle: "THE ONE STOP EMPLOYER SHOP",
    icon: Shield,
    color: "bg-primary",
    points: [
      "AI-powered occupational health and safety compliance platform",
      "Built by compliance professionals, for compliance professionals",
      "Replaces scattered spreadsheets, outdated binders, and expensive consultants",
      "Covers OSHA, DOT, ISO, Drug Testing, and Medical Surveillance",
    ],
    visual: "hero",
  },
  {
    id: "ai-consultant",
    title: "CCH Expert Bot",
    subtitle: "AI-Powered OccHealth Consultant",
    icon: Bot,
    color: "bg-accent",
    points: [
      "Senior Occupational Health & Safety Compliance Expert available 24/7",
      "Specializes in OSHA 29 CFR 1904, DOT 49 CFR Part 40",
      "Streaming AI responses with conversation memory",
      "Free trial on landing page lets prospects experience it immediately",
    ],
    liveLink: "/bot",
    liveLinkLabel: "Try the Bot Live",
    visual: "feature",
  },
  {
    id: "osha-300",
    title: "OSHA 300 Decision Tree",
    subtitle: "Log It or Not - Instant Recordability Decisions",
    icon: ClipboardList,
    color: "bg-primary",
    points: [
      "Interactive step-by-step decision tree for OSHA recordability",
      "Walks through every exception, exemption, and edge case",
      "Eliminates guesswork - get a definitive answer in minutes",
      "Printable results for documentation and audit trails",
    ],
    liveLink: "/decision-tree",
    liveLinkLabel: "Try Decision Tree",
    visual: "feature",
  },
  {
    id: "iso-manager",
    title: "ACSI ISO Manager",
    subtitle: "Lead ISO Auditor AI",
    icon: Award,
    color: "bg-accent",
    points: [
      "ISO 9001, 14001, and 45001 management system support",
      "Gap Analysis, Quality Manuals, Internal Audit preparation",
      "\"Write-Up Free\" philosophy - proactive compliance, not reactive penalties",
      "Developed by experienced Lead Auditors with real-world audit backgrounds",
    ],
    liveLink: "/iso-manager",
    liveLinkLabel: "See ISO Manager",
    visual: "feature",
  },
  {
    id: "dashboard",
    title: "Client Compliance Dashboard",
    subtitle: "Real-Time Compliance at a Glance",
    icon: BarChart3,
    color: "bg-primary",
    points: [
      "ISO audit readiness score and medical surveillance tracking",
      "Drug screen compliance status across all employees",
      "Incident heatmap showing patterns and risk areas",
      "Action queue with prioritized compliance tasks",
    ],
    liveLink: "/dashboard",
    liveLinkLabel: "View Dashboard",
    visual: "feature",
  },
  {
    id: "employee-mgmt",
    title: "Employee Management",
    subtitle: "Complete Workforce Compliance Tracking",
    icon: Users,
    color: "bg-accent",
    points: [
      "Track DOT physical dates, respiratory exams, drug test results",
      "Random pool inclusion management for drug testing programs",
      "Automated DOT physical expiration notifications via SMS (Twilio)",
      "One-click employee clinic check-in with Digital Medical Passport",
    ],
    liveLink: "/employees",
    liveLinkLabel: "See Employee Management",
    visual: "feature",
  },
  {
    id: "passport",
    title: "Digital Medical Passport",
    subtitle: "CCH Handshake - QR-Based Clinic Check-In",
    icon: QrCode,
    color: "bg-primary",
    points: [
      "Employer creates digital authorization form with patient info, services, and signature",
      "Employee receives a QR code via SMS or link",
      "Clinic scans QR and gets complete signed authorization - no phone call needed",
      "\"I'm Here\" and \"I'm Back\" SMS notifications with total time-away tracking",
    ],
    liveLink: "/employee-passport",
    liveLinkLabel: "See Medical Passport",
    visual: "feature",
  },
  {
    id: "bilingual",
    title: "Spanish Bilingual Medical Assistant",
    subtitle: "Breaking Language Barriers in Occupational Health",
    icon: Globe,
    color: "bg-accent",
    points: [
      "Three modes: Injury Reporting, New Hire Intake, Drug Screen Instructions",
      "Spanish text-to-speech for patient communication",
      "Bidirectional speech-to-text (patient speaks Spanish, auto-translates to English)",
      "Interactive body map for injury documentation",
      "Standalone subscription: $149/mo per clinic location",
    ],
    liveLink: "/bma-subscription",
    liveLinkLabel: "See BMA Details",
    visual: "feature",
  },
  {
    id: "incidents",
    title: "Incident Log & OSHA 300",
    subtitle: "Complete Incident Management & Reporting",
    icon: AlertTriangle,
    color: "bg-primary",
    points: [
      "Full OSHA 300 log with employee name, job title, location, body part, injury nature",
      "Classification tracking and printable OSHA 300 report",
      "Corrective Action Plans (CAPA) with root cause analysis",
      "Responsible person assignment and verification tracking",
    ],
    liveLink: "/incidents",
    liveLinkLabel: "See Incident Management",
    visual: "feature",
  },
  {
    id: "training",
    title: "Professional Training Courses",
    subtitle: "Self-Paced Compliance Training with Certificates",
    icon: GraduationCap,
    color: "bg-accent",
    points: [
      "DOT Medical Certification ($199) - Physical requirements, disqualifying conditions",
      "OSHA Medical Surveillance ($249) - Respirator physicals, fit testing, HAZWOPER",
      "Drug & Alcohol Testing ($199) - DOT vs Non-DOT, MRO roles, Clearinghouse",
      "ISO Management Systems ($349) - 9001/14001/45001, gap analysis, internal auditing",
      "Every course purchase includes 1 FREE year of Compliance Pro ($348 value)",
    ],
    visual: "feature",
  },
  {
    id: "mentorship",
    title: "ACSI Mentorship Program",
    subtitle: "CCH Exclusive - The First ISO Mentorship Program",
    icon: Star,
    color: "bg-primary",
    points: [
      "Foundation Tier ($2,500): 12-week intensive, 1-on-1 mentoring, one standard, certificate",
      "Executive Tier ($5,000): Multi-standard, mock audit, 3-month follow-up support",
      "For Quality Managers, EHS Coordinators, and Internal Auditors",
      "Practical application support - not just one-time training",
    ],
    liveLink: "/mentorship",
    liveLinkLabel: "See Mentorship Program",
    visual: "feature",
  },
  {
    id: "brandnswag",
    title: "BrandNSwag",
    subtitle: "Smart Swag Makes Safety Fun",
    icon: Shirt,
    color: "bg-accent",
    points: [
      "QR-code employee recognition platform ($49/mo)",
      "Custom branded merchandise stores for each company",
      "Points system with reward triggers: onboarding, safety milestones, peer recognition",
      "Swag box tiers from Starter to Executive with premium packaging",
    ],
    liveLink: "/brandnswag",
    liveLinkLabel: "See BrandNSwag",
    visual: "feature",
  },
  {
    id: "pricing-overview",
    title: "Pricing That Works",
    subtitle: "Plans for Every Size Company",
    icon: Zap,
    color: "bg-primary",
    points: [
      "Safety Starter: FREE - 3 questions/month for small teams",
      "Compliance Pro: $29/mo - 15 questions + PDF checklists",
      "Unlimited Safety: $99/mo - Unlimited questions + audit prep",
      "ISO Professional: $149/mo - Unlimited ISO AI + audit checklists",
      "Integrated Enterprise: $299/mo - CCH + ACSI combined, up to 50 employees",
      "Human Expert Retainer: $499/mo - Professional safety director support",
    ],
    visual: "pricing",
  },
  {
    id: "closing",
    title: "Ready to Transform Your Compliance?",
    subtitle: "Join companies that ditched the guesswork",
    icon: Shield,
    color: "bg-accent",
    points: [
      "10,000+ compliance questions answered",
      "$2.5M+ in potential fines prevented",
      "500+ companies protected",
      "98% customer satisfaction",
    ],
    visual: "closing",
  },
];

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  useEffect(() => {
    document.title = "CCH Demo - Core Compliance Hub Interactive Walkthrough";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "See how Core Compliance Hub transforms workplace safety compliance. Interactive demo of AI-powered OSHA, DOT, ISO, and drug testing tools.");
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "CCH Demo - See AI-Powered Compliance in Action");
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", "Watch how Core Compliance Hub transforms workplace safety. AI-powered OSHA 300, DOT physicals, ISO management, and more.");
    return () => {
      document.title = "Core Compliance Hub - THE ONE STOP EMPLOYER SHOP";
    };
  }, []);

  const goNext = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const goPrev = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] flex flex-col" data-testid="page-demo">
      <div className="sticky top-0 z-50 bg-[hsl(222,47%,11%)]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4 h-14">
          <Link href="/">
            <img src={cchLogo} alt="CCH" className="h-8 w-8 object-contain cursor-pointer" data-testid="demo-logo" />
          </Link>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <span data-testid="text-slide-counter">{currentSlide + 1} / {slides.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-white border-white/20 bg-transparent" data-testid="button-demo-home">
                Visit Site
              </Button>
            </Link>
          </div>
        </div>
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
            data-testid="demo-progress-bar"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-5xl w-full">
          {slide.visual === "hero" && (
            <div className="text-center space-y-8">
              <img src={logoUrl} alt="Core Compliance Hub" className="h-40 md:h-56 lg:h-64 w-auto mx-auto" data-testid="demo-hero-logo" />
              <img src={teamImageUrl} alt="CCH Team" className="w-full max-w-3xl h-auto object-contain mx-auto rounded-lg" />
              <div className="flex items-center justify-center gap-6 md:gap-10 py-2">
                <img src={cchLogo} alt="CCH" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <img src={acsiLogo} alt="ACSI" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <img src={brandNSwagLogo} alt="BrandNSwag" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <img src={mentorshipLogo} alt="Mentorship" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent font-semibold text-sm border border-accent/30">
                <Activity className="w-4 h-4" />
                {slide.subtitle}
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-black text-white leading-tight" data-testid="text-demo-title">
                {slide.title}
              </h1>
              <ul className="space-y-3 max-w-2xl mx-auto text-left">
                {slide.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/80 text-lg">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {slide.visual === "feature" && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${slide.color} flex items-center justify-center`}>
                    <slide.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{slide.subtitle}</Badge>
                <h2 className="text-3xl md:text-4xl font-display font-black text-white" data-testid="text-demo-title">
                  {slide.title}
                </h2>
              </div>

              <Card className="max-w-3xl mx-auto p-6 md:p-8 bg-white/5 border-white/10 backdrop-blur">
                <ul className="space-y-4">
                  {slide.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/80 text-lg">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {slide.liveLink && (
                <div className="text-center">
                  <Link href={slide.liveLink}>
                    <Button size="lg" className="gap-2 shadow-lg shadow-accent/25" data-testid="button-demo-live-link">
                      {slide.liveLinkLabel} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {slide.visual === "pricing" && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${slide.color} flex items-center justify-center`}>
                    <slide.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black text-white" data-testid="text-demo-title">
                  {slide.title}
                </h2>
                <p className="text-white/60">{slide.subtitle}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {slide.points.map((point, i) => {
                  const [planName, ...rest] = point.split(" - ");
                  return (
                    <Card key={i} className="p-4 bg-white/5 border-white/10 backdrop-blur">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{planName}</p>
                          {rest.length > 0 && <p className="text-white/60 text-sm">{rest.join(" - ")}</p>}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {slide.visual === "closing" && (
            <div className="text-center space-y-8">
              <div className="flex items-center justify-center gap-3">
                <div className={`w-14 h-14 rounded-lg ${slide.color} flex items-center justify-center`}>
                  <slide.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black text-white" data-testid="text-demo-title">
                {slide.title}
              </h2>
              <p className="text-white/70 text-xl">{slide.subtitle}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto py-4">
                {slide.points.map((stat, i) => {
                  const [value, ...labelParts] = stat.split(" ");
                  return (
                    <div key={i} className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-accent">{value}</div>
                      <div className="text-white/60 text-sm">{labelParts.join(" ")}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/">
                  <Button size="lg" className="gap-2 shadow-lg shadow-accent/25" data-testid="button-demo-get-started">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="text-white border-white/30 bg-transparent gap-2" data-testid="button-demo-contact">
                    <Phone className="w-4 h-4" /> Schedule a Call
                  </Button>
                </Link>
              </div>

              <div className="pt-6">
                <p className="text-white/40 text-xs">
                  Core Compliance Hub &middot; www.corecompliancehub.com &middot; Powered by CCH AI
                </p>
              </div>
            </div>
          )}

          {slide.visual === "stats" && null}
        </div>
      </div>

      <div className="sticky bottom-0 z-50 bg-[hsl(222,47%,11%)]/95 backdrop-blur border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="text-white border-white/20 bg-transparent gap-1"
            data-testid="button-demo-prev"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentSlide ? "bg-accent" : i < currentSlide ? "bg-accent/40" : "bg-white/20"
                }`}
                data-testid={`button-demo-dot-${i}`}
              />
            ))}
          </div>

          <Button
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            className="gap-1"
            data-testid="button-demo-next"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
