import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearch } from "wouter";
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
  Send,
  Play,
  Pause,
  Volume2,
  Loader2,
  Mic,
  MicOff,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
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
  visual: "hero" | "feature" | "interactive-bma" | "interactive-bot" | "pricing" | "closing";
}

const slides: DemoSlide[] = [
  {
    id: "bilingual",
    title: "Spanish Bilingual Medical Assistant",
    subtitle: "Breaking Language Barriers in Occupational Health",
    icon: Globe,
    color: "bg-accent",
    points: [
      "Three modes: Injury Reporting, New Hire Intake, Drug Screen Instructions",
      "Spanish text-to-speech for patient communication",
      "Bidirectional speech-to-text: patient speaks Spanish, auto-translates to English",
      "Interactive body map for injury documentation",
      "Standalone subscription: $199/mo per clinic location",
    ],
    liveLink: "/bma-subscription",
    liveLinkLabel: "See Full BMA Details",
    visual: "interactive-bma",
  },
  {
    id: "bma-pricing",
    title: "BMA Pricing",
    subtitle: "The Most Affordable Bilingual Solution in Healthcare",
    icon: Globe,
    color: "bg-accent",
    points: [
      "$199/mo per location — Unlimited use, no per-minute charges",
      "Human interpreters cost $45–$150/hour with scheduling delays",
      "Video remote interpreters charge $1.95–$3.49/minute",
      "Phone interpreters charge $1.50–$2.75/minute",
      "CCHUB BMA pays for itself in days, not months",
      "AI Medical Interpreter — real-time bidirectional clinical translation",
      "Staff Command Center with text-to-speech clinic instructions",
      "Injury Reporting, New Hire Intake, Drug Screen modes + interactive body map",
    ],
    liveLink: "/bma-subscription",
    liveLinkLabel: "See ROI Calculator",
    visual: "pricing",
  },
  {
    id: "ai-consultant",
    title: "Ask Corey",
    subtitle: "Your AI Occ-Health Compliance Expert",
    icon: Bot,
    color: "bg-primary",
    points: [
      "Senior Occupational Health & Safety Compliance Expert available 24/7",
      "Specializes in OSHA 29 CFR 1904, DOT 49 CFR Part 40",
      "Streaming AI responses with conversation memory",
      "Try it right here - ask any compliance question!",
    ],
    liveLink: "/bot",
    liveLinkLabel: "Open Full Bot",
    visual: "interactive-bot",
  },
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
    id: "osha-300",
    title: "OSHA 300 Decision Tree",
    subtitle: "Log It or Not - Instant Recordability Decisions",
    icon: ClipboardList,
    color: "bg-accent",
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
    color: "bg-primary",
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
    color: "bg-accent",
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
    color: "bg-primary",
    points: [
      "Track DOT physical dates, respiratory exams, drug test results",
      "Random pool inclusion management for drug testing programs",
      "Automated DOT physical expiration notifications via SMS",
      "One-click employee clinic check-in with Digital Medical Passport",
    ],
    liveLink: "/employees",
    liveLinkLabel: "See Employee Management",
    visual: "feature",
  },
  {
    id: "passport",
    title: "Digital Medical Passport",
    subtitle: "CCHUB Handshake - QR-Based Clinic Check-In",
    icon: QrCode,
    color: "bg-accent",
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
      "Every course purchase includes a FREE Compliance Program Consultation",
    ],
    visual: "feature",
  },
  {
    id: "mentorship",
    title: "ACSI Mentorship Program",
    subtitle: "CCHUB Exclusive - The First ISO Mentorship Program",
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
      "Safety Starter: FREE - 3 Corey questions/month for small teams",
      "Unlimited Safety (Corey): $149/mo per user - Unlimited Corey + audit prep + PDF checklists",
      "ISO Professional: $149/mo - Unlimited ISO AI + audit checklists",
      "Employer Platform: $499/mo - Full compliance suite, up to 50 employees",
      "Platform + Corey AI: $549/mo - Platform with 1 Corey seat included (+$99/ea additional seat)",
      "Spanish Bilingual Medical Assistant: $199/mo per location",
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
      "AI-powered compliance guidance available 24/7",
      "Built by occupational health professionals",
      "Covers OSHA, DOT, ISO, drug testing, and medical surveillance",
      "Start your free trial today",
    ],
    visual: "closing",
  },
];

const BG = "hsl(215, 30%, 92%)";
const BG_HEADER = "hsl(215, 35%, 88%)";
const TEXT_PRIMARY = "hsl(215, 40%, 16%)";
const TEXT_SECONDARY = "hsl(215, 20%, 40%)";

interface BotMessage { role: "user" | "assistant"; content: string }

function DemoBotChat() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [remaining, setRemaining] = useState(3);
  const [trialName, setTrialName] = useState(() => localStorage.getItem("cchub_trial_name") || "");
  const [trialEmail, setTrialEmail] = useState(() => localStorage.getItem("cchub_trial_email") || "");
  const [trialGated, setTrialGated] = useState(() => !localStorage.getItem("cchub_trial_email"));
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const { isListening, speechSupported, toggleListening, stopListening } = useSpeechRecognition((text) => setInput(text));

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = distanceFromBottom > 80;
  };

  useEffect(() => {
    if (scrollRef.current && !userScrolledUp.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTrialGate = useCallback(() => {
    if (!trialName.trim() || !trialEmail.trim() || !trialEmail.includes("@")) return;
    localStorage.setItem("cchub_trial_name", trialName.trim());
    localStorage.setItem("cchub_trial_email", trialEmail.trim());
    setTrialGated(false);
  }, [trialName, trialEmail]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || loading || limitReached) return;
    stopListening();
    userScrolledUp.current = false;
    const userMsg = input.trim();
    setInput("");
    const newMessages: BotMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/landing-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg, history: newMessages, name: trialName, email: trialEmail }),
      });
      if (!response.ok) {
        const err = await response.json();
        if (err.limitReached) { setLimitReached(true); setRemaining(0); return; }
        throw new Error(err.error);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");
      let fullText = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullText += data.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: fullText };
                  return updated;
                });
              }
              if (data.remaining !== undefined) setRemaining(data.remaining);
              if (data.done && data.remaining === 0) setLimitReached(true);
            } catch {}
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, limitReached, messages, trialName, trialEmail]);

  return (
    <div className="flex flex-col h-full">
      {trialGated ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
          <Bot className="w-10 h-10 opacity-50" style={{ color: TEXT_SECONDARY }} />
          <p className="text-sm font-medium text-center" style={{ color: TEXT_PRIMARY }}>Enter your info to try Corey free</p>
          <input
            type="text"
            value={trialName}
            onChange={(e) => setTrialName(e.target.value)}
            placeholder="Your name"
            className="w-full max-w-xs text-sm px-3 py-2 rounded-md border bg-white/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            style={{ borderColor: "rgba(0,0,0,0.1)", color: TEXT_PRIMARY }}
            data-testid="input-demo-trial-name"
          />
          <input
            type="email"
            value={trialEmail}
            onChange={(e) => setTrialEmail(e.target.value)}
            placeholder="Work email"
            className="w-full max-w-xs text-sm px-3 py-2 rounded-md border bg-white/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            style={{ borderColor: "rgba(0,0,0,0.1)", color: TEXT_PRIMARY }}
            onKeyDown={(e) => e.key === "Enter" && handleTrialGate()}
            data-testid="input-demo-trial-email"
          />
          <Button size="sm" onClick={handleTrialGate} disabled={!trialName.trim() || !trialEmail.includes("@")} data-testid="button-demo-trial-start">
            Start Free Trial
          </Button>
        </div>
      ) : (
      <>
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6" style={{ color: TEXT_SECONDARY }}>
            <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Ask any OSHA, DOT, or compliance question</p>
            <p className="text-xs mt-1 opacity-70">Try: "Is a bee sting at work recordable?"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-white/80 border border-black/5"
            }`} style={msg.role === "assistant" ? { color: TEXT_PRIMARY } : {}}>
              {msg.content || (loading && i === messages.length - 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : "")}
            </div>
          </div>
        ))}
        {limitReached && (
          <div className="text-center py-2">
            <p className="text-xs mb-2" style={{ color: TEXT_SECONDARY }}>Demo limit reached</p>
            <Link href="/">
              <Button size="sm">Sign Up for Full Access</Button>
            </Link>
          </div>
        )}
      </div>
      <div className="border-t p-2 flex items-end gap-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="relative flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={limitReached ? "Demo limit reached" : isListening ? "Listening..." : "Ask a compliance question..."}
            disabled={limitReached || loading}
            rows={2}
            className={`w-full text-sm px-3 py-2 pr-9 rounded-md border bg-white/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 ${isListening ? "ring-2 ring-accent/30 border-accent" : ""}`}
            style={{ borderColor: isListening ? undefined : "rgba(0,0,0,0.1)", color: TEXT_PRIMARY, resize: "none", maxHeight: "130px", overflowY: "auto" }}
            data-testid="input-demo-bot"
          />
          {speechSupported && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleListening}
              disabled={loading || limitReached}
              className={`absolute right-0.5 bottom-1 ${isListening ? "text-accent" : "text-muted-foreground"}`}
              data-testid="button-demo-bot-mic"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>
        <Button size="icon" onClick={handleSubmit} disabled={!input.trim() || loading || limitReached} className="mb-0.5" data-testid="button-demo-bot-send">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      {isListening && (
        <p className="text-xs text-center py-1 animate-pulse" style={{ color: TEXT_SECONDARY }} data-testid="text-demo-bot-listening">
          Speak now... tap the mic again to stop.
        </p>
      )}
      {!limitReached && remaining < 3 && (
        <div className="text-center pb-1">
          <span className="text-xs" style={{ color: TEXT_SECONDARY }}>{remaining} demo question{remaining !== 1 ? "s" : ""} remaining</span>
        </div>
      )}
      </>
      )}
    </div>
  );
}

const BMA_PHRASES = [
  { spanish: "Buenos dias, voy a hacerle unas preguntas.", english: "Good morning, I'm going to ask you some questions." },
  { spanish: "Por favor, digame donde le duele.", english: "Please tell me where it hurts." },
  { spanish: "Necesito ver su identificacion.", english: "I need to see your ID." },
  { spanish: "Vamos a hacer una prueba de drogas.", english: "We are going to do a drug test." },
  { spanish: "Tiene alguna alergia a medicamentos?", english: "Do you have any medication allergies?" },
  { spanish: "Cuando fue su ultimo examen fisico?", english: "When was your last physical exam?" },
];

function DemoBMAPreview() {
  const [activePhrase, setActivePhrase] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const speakSpanish = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 0.9;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-xs">Live Preview</Badge>
        <span className="text-xs" style={{ color: TEXT_SECONDARY }}>Click any phrase to hear it in Spanish</span>
      </div>

      <div className="space-y-2">
        {BMA_PHRASES.map((phrase, i) => (
          <button
            key={i}
            onClick={() => { setActivePhrase(i); speakSpanish(phrase.spanish); }}
            className={`w-full text-left p-3 rounded-md border transition-all ${
              activePhrase === i
                ? "bg-white border-primary/30 shadow-sm"
                : "bg-white/50 border-transparent"
            }`}
            data-testid={`button-demo-bma-phrase-${i}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{phrase.spanish}</p>
                <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>{phrase.english}</p>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                {speaking && activePhrase === i ? (
                  <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                ) : (
                  <Play className="w-4 h-4" style={{ color: TEXT_SECONDARY }} />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;
  const searchString = useSearch();

  useEffect(() => {
    document.title = "CCHUB Demo - Core Compliance Hub Interactive Walkthrough";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "See how Core Compliance Hub transforms workplace safety compliance. Interactive demo of AI-powered OSHA, DOT, ISO, and drug testing tools.");
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "CCHUB Demo - See AI-Powered Compliance in Action");
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", "Watch how Core Compliance Hub transforms workplace safety. AI-powered OSHA 300, DOT physicals, ISO management, and more.");
    return () => { document.title = "Core Compliance Hub - THE ONE STOP EMPLOYER SHOP"; };
  }, []);

  useEffect(() => {
    if (searchString.includes("autoplay=true")) setAutoplay(true);
  }, [searchString]);

  const goNext = useCallback(() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1)), []);
  const goPrev = useCallback(() => setCurrentSlide((prev) => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || (e.key === " " && !(e.target instanceof HTMLInputElement))) { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  useEffect(() => {
    if (!autoplay) return;
    if (slide.visual === "interactive-bma" || slide.visual === "interactive-bot") return;
    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) goNext();
      else setAutoplay(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [autoplay, currentSlide, goNext, slide.visual]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }} data-testid="page-demo">
      <div className="sticky top-0 z-50 border-b backdrop-blur" style={{ background: BG_HEADER, borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4 h-14">
          <Link href="/">
            <img src={cchLogo} alt="CCHUB" className="h-8 w-8 object-contain cursor-pointer" data-testid="demo-logo" />
          </Link>
          <div className="flex items-center gap-3 text-sm" style={{ color: TEXT_SECONDARY }}>
            <span data-testid="text-slide-counter">{currentSlide + 1} / {slides.length}</span>
            <button
              onClick={() => setAutoplay(!autoplay)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
              style={{ background: autoplay ? "hsl(215, 40%, 16%)" : "transparent", color: autoplay ? "white" : TEXT_SECONDARY, border: `1px solid ${autoplay ? "transparent" : "rgba(0,0,0,0.12)"}` }}
              data-testid="button-demo-autoplay"
            >
              {autoplay ? <><Pause className="w-3 h-3" /> Auto</> : <><Play className="w-3 h-3" /> Auto</>}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-demo-home">Visit Site</Button>
            </Link>
          </div>
        </div>
        <div className="h-1" style={{ background: "rgba(0,0,0,0.05)" }}>
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} data-testid="demo-progress-bar" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 md:py-10">
        <div className="max-w-5xl w-full">

          {slide.visual === "interactive-bma" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                    <Globe className="w-7 h-7 text-white" />
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{slide.subtitle}</Badge>
                <h2 className="text-3xl md:text-4xl font-display font-black" style={{ color: TEXT_PRIMARY }} data-testid="text-demo-title">
                  {slide.title}
                </h2>
                <p className="text-sm max-w-xl mx-auto" style={{ color: TEXT_SECONDARY }}>
                  Click any phrase below to hear it spoken in Spanish. This is how clinics communicate with Spanish-speaking patients instantly.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card className="p-4 overflow-visible">
                  <DemoBMAPreview />
                </Card>
                <div className="space-y-3">
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Why Clinics Love This</h3>
                    <ul className="space-y-2">
                      {slide.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXT_SECONDARY }}>
                          <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  {slide.liveLink && (
                    <div className="text-center">
                      <Link href={slide.liveLink}>
                        <Button className="gap-2 shadow-lg shadow-accent/25 w-full" data-testid="button-demo-live-link">
                          {slide.liveLinkLabel} <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {slide.visual === "interactive-bot" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{slide.subtitle}</Badge>
                <h2 className="text-3xl md:text-4xl font-display font-black" style={{ color: TEXT_PRIMARY }} data-testid="text-demo-title">
                  {slide.title}
                </h2>
                <p className="text-sm max-w-xl mx-auto" style={{ color: TEXT_SECONDARY }}>
                  Go ahead, ask a real compliance question below. The AI responds in real-time.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card className="overflow-visible flex flex-col" style={{ minHeight: "360px" }}>
                  <DemoBotChat />
                </Card>
                <div className="space-y-3">
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>What Can You Ask?</h3>
                    <ul className="space-y-2">
                      {slide.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: TEXT_SECONDARY }}>
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>Try These Questions</h3>
                    <div className="space-y-1.5">
                      {[
                        "Is a bee sting at work OSHA recordable?",
                        "What are DOT random drug testing rates?",
                        "When do I need a respirator fit test?",
                      ].map((q, i) => (
                        <p key={i} className="text-xs italic px-2 py-1.5 rounded-md bg-muted/50" style={{ color: TEXT_SECONDARY }} data-testid={`text-demo-sample-q-${i}`}>
                          "{q}"
                        </p>
                      ))}
                    </div>
                  </Card>
                  {slide.liveLink && (
                    <div className="text-center">
                      <Link href={slide.liveLink}>
                        <Button variant="outline" className="gap-2 w-full" data-testid="button-demo-live-link">
                          {slide.liveLinkLabel} <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {slide.visual === "hero" && (
            <div className="text-center space-y-6">
              <img src={logoUrl} alt="Core Compliance Hub" className="h-36 md:h-48 lg:h-56 w-auto mx-auto" data-testid="demo-hero-logo" />
              <img src={teamImageUrl} alt="CCHUB Team" className="w-full max-w-3xl h-auto object-contain mx-auto rounded-lg shadow-md" />
              <div className="flex items-center justify-center gap-6 md:gap-10 py-2">
                <img src={cchLogo} alt="CCHUB" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <img src={acsiLogo} alt="ACSI" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <img src={brandNSwagLogo} alt="BrandNSwag" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <img src={mentorshipLogo} alt="Mentorship" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
                <Activity className="w-4 h-4" />
                {slide.subtitle}
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-black leading-tight" style={{ color: TEXT_PRIMARY }} data-testid="text-demo-title">
                {slide.title}
              </h1>
              <ul className="space-y-3 max-w-2xl mx-auto text-left">
                {slide.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-lg" style={{ color: TEXT_SECONDARY }}>
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {slide.visual === "feature" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${slide.color} flex items-center justify-center`}>
                    <slide.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{slide.subtitle}</Badge>
                <h2 className="text-3xl md:text-4xl font-display font-black" style={{ color: TEXT_PRIMARY }} data-testid="text-demo-title">
                  {slide.title}
                </h2>
              </div>

              <Card className="max-w-3xl mx-auto p-6 md:p-8">
                <ul className="space-y-4">
                  {slide.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-lg" style={{ color: TEXT_SECONDARY }}>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {slide.liveLink && (
                <div className="text-center">
                  <Link href={slide.liveLink}>
                    <Button size="lg" className="gap-2 shadow-lg shadow-primary/15" data-testid="button-demo-live-link">
                      {slide.liveLinkLabel} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {slide.visual === "pricing" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${slide.color} flex items-center justify-center`}>
                    <slide.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black" style={{ color: TEXT_PRIMARY }} data-testid="text-demo-title">
                  {slide.title}
                </h2>
                <p style={{ color: TEXT_SECONDARY }}>{slide.subtitle}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {slide.points.map((point, i) => {
                  const [planName, ...rest] = point.split(" - ");
                  const isBma = point.includes("$199") || point.toLowerCase().includes("bilingual");
                  return (
                    <Card key={i} className={`p-4 ${isBma ? "border-[#FFC107] bg-[#FFC107]/10 ring-2 ring-[#FFC107]" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isBma ? "bg-[#FFC107]/20" : "bg-primary/10"}`}>
                          <CheckCircle2 className={`w-4 h-4 ${isBma ? "text-[#FFC107]" : "text-primary"}`} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: TEXT_PRIMARY }}>{planName}</p>
                          {rest.length > 0 && <p className={`text-sm ${isBma ? "font-bold" : ""}`} style={{ color: isBma ? TEXT_PRIMARY : TEXT_SECONDARY }}>{rest.join(" - ")}</p>}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {slide.visual === "closing" && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <div className={`w-14 h-14 rounded-lg ${slide.color} flex items-center justify-center`}>
                  <slide.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black" style={{ color: TEXT_PRIMARY }} data-testid="text-demo-title">
                {slide.title}
              </h2>
              <p className="text-xl" style={{ color: TEXT_SECONDARY }}>{slide.subtitle}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto py-4">
                {slide.points.map((stat, i) => {
                  const [value, ...labelParts] = stat.split(" ");
                  return (
                    <div key={i} className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-primary">{value}</div>
                      <div className="text-sm" style={{ color: TEXT_SECONDARY }}>{labelParts.join(" ")}</div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/15" data-testid="button-demo-get-started">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="gap-2" data-testid="button-demo-contact">
                    <Phone className="w-4 h-4" /> Schedule a Call
                  </Button>
                </Link>
              </div>

              <div className="pt-6">
                <p className="text-xs" style={{ color: TEXT_SECONDARY, opacity: 0.6 }}>
                  Core Compliance Hub &middot; www.corecompliancehub.com &middot; Powered by CCHUB AI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-50 border-t backdrop-blur" style={{ background: BG_HEADER, borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="gap-1"
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
                  i === currentSlide ? "bg-primary" : i < currentSlide ? "bg-primary/40" : "bg-black/10"
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
