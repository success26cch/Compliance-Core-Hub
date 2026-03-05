import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Bot, User, Plus, Lock, Mic, MicOff, MessageSquare, Shield,
  CheckCircle2, Sparkles, ArrowRight, Download, Smartphone, MoreVertical,
  Copy, Mail, FileText, Trash2, Pencil, Share2, FileDown, ClipboardCopy,
  Printer, Volume2, VolumeX, Square, ClipboardList, Search, Calendar, BookOpen, AlertTriangle, Target, Scale,
  X, ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { queryClient, apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/1_1767636977932.png";
import jsPDF from "jspdf";

function sanitizeForPdf(text: string): string {
  return text
    .replace(/μ/g, 'u')
    .replace(/µ/g, 'u')
    .replace(/³/g, '3')
    .replace(/²/g, '2')
    .replace(/¹/g, '1')
    .replace(/¼/g, '1/4')
    .replace(/½/g, '1/2')
    .replace(/¾/g, '3/4')
    .replace(/°/g, ' degrees ')
    .replace(/±/g, '+/-')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/≈/g, '~')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, '...')
    .replace(/•/g, '-')
    .replace(/·/g, '-')
    .replace(/©/g, '(c)')
    .replace(/®/g, '(R)')
    .replace(/™/g, '(TM)')
    .replace(/[^\x00-\x7F]/g, '');
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^---+$/gm, '')
    .replace(/^===+$/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[☐☑☒□■◻◼◽◾▢▣✓✗✘⬜⬛🔲🔳✅❎]/g, '[ ]')
    .replace(/&\s+(?=[A-Z])/g, '[ ] ');
}

function PwaInstallBanner({ onInstallClick }: { onInstallClick?: () => Promise<boolean> }) {
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /Android/.test(ua);
    setIsIos(ios);
    setIsAndroid(android);
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true
    );
    const wasDismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  if (isStandalone || dismissed) return null;
  if (!isIos && !isAndroid) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  return (
    <div className="bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 border-b border-accent/30" data-testid="pwa-install-banner">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Install Corey on Your Phone</p>
            {isIos ? (
              <p className="text-xs text-white/60 leading-relaxed">
                Tap the <span className="inline-flex items-center gap-0.5 text-accent font-medium"><ExternalLink className="w-3 h-3" /> Share</span> button, then tap <span className="text-accent font-medium">"Add to Home Screen"</span>
              </p>
            ) : onInstallClick ? (
              <p className="text-xs text-white/60">
                Tap <span className="text-accent font-medium">Install</span> to add Corey to your home screen — no app store needed.
              </p>
            ) : (
              <p className="text-xs text-white/60">
                Tap the <span className="text-accent font-medium">⋮ menu</span>, then <span className="text-accent font-medium">"Add to Home Screen"</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isIos && onInstallClick && (
            <Button
              size="sm"
              onClick={async () => {
                const accepted = await onInstallClick();
                if (accepted) handleDismiss();
              }}
              className="bg-accent hover:bg-accent/90 text-xs gap-1.5 shadow-lg shadow-accent/25"
              data-testid="button-pwa-banner-install"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            data-testid="button-pwa-banner-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoreyStandalone() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Bot className="w-12 h-12 text-accent" />
          <p className="text-white/60">Loading Corey...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <CoreyLanding />;
  }

  return <CoreyApp />;
}

function CoreyLanding() {
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <PwaInstallBanner onInstallClick={isInstallable ? promptInstall : undefined} />
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/25">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">COREY</h1>
              <p className="text-xs text-white/50">by Core Compliance Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isInstallable && !isInstalled && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptInstall}
                className="border-accent/50 text-accent hover:bg-accent/10 gap-1.5"
                data-testid="button-pwa-install-header"
              >
                <Download className="w-4 h-4" />
                Install App
              </Button>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10" data-testid="link-cch-home">
                CCHUB Platform
              </Button>
            </Link>
            <a href="/api/login">
              <Button size="sm" className="bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25" data-testid="button-corey-login">
                Sign In
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <section className="py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm border border-accent/20 mb-8">
            <Sparkles className="w-4 h-4" />
            THE ONLY AI BUILT FOR OCC-HEALTH
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-3 leading-tight" data-testid="text-corey-hero">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">COREY</span>
          </h2>
          <p className="text-lg md:text-xl text-accent font-bold uppercase tracking-widest mb-4">
            The Intelligence Behind the Compliance
          </p>
          <p className="text-xl md:text-2xl text-white font-semibold max-w-2xl mx-auto mb-6">
            Your 24/7 AI Compliance Expert.
          </p>
          <div className="max-w-2xl mx-auto mb-12 space-y-4 text-left">
            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              In our world, <span className="text-white font-semibold">"close enough" is a liability.</span> You don't need an AI that knows a little bit about everything; you need an expert that knows everything about 29 CFR.
            </p>
            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              Corey is the first specialized AI engine built from the actual DNA of <span className="text-white font-semibold">29 CFR and DOT 49 CFR</span>. He isn't just searching the web — Corey is different. He wasn't just "programmed"; he was built using a proprietary logic bridge that connects the literal text of the Federal Regulations. Corey gives you the exact answer you need, exactly when you need it. Give him a shot, ask him anything.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/try-corey">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-lg px-8 py-6 shadow-xl shadow-accent/25" data-testid="button-corey-get-started">
                <Bot className="w-5 h-5 mr-2" /> Get Started Free
              </Button>
            </Link>
            {isInstallable && !isInstalled && (
              <Button
                size="lg"
                variant="outline"
                onClick={promptInstall}
                className="border-accent/40 text-accent hover:bg-accent/10 text-lg px-8 py-6 gap-2"
                data-testid="button-pwa-install-hero"
              >
                <Smartphone className="w-5 h-5" /> Install App
              </Button>
            )}
            {!isInstallable && (
              <Link href="/">
                <Button size="lg" variant="outline" className="bg-white border-white text-gray-900 hover:bg-gray-100 hover:text-black text-lg px-8 py-6" data-testid="button-corey-learn-more">
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        <section className="pb-20">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/5 border-white/10 p-6 text-center" data-testid="card-corey-feature-1">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold text-white mb-2">OSHA Expert</h3>
              <p className="text-sm text-white/60">Instant recordability guidance citing OSHA 29 CFR 1904. Never second-guess a call again.</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6 text-center" data-testid="card-corey-feature-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-white mb-2">DOT Compliance</h3>
              <p className="text-sm text-white/60">DOT physicals, drug testing, Clearinghouse — answers backed by 49 CFR Part 40.</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6 text-center" data-testid="card-corey-feature-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold text-white mb-2">Voice Enabled</h3>
              <p className="text-sm text-white/60">Ask your question by voice. Corey listens as long as you need — no interruptions.</p>
            </Card>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-8">Simple Pricing</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6" data-testid="card-corey-pricing-free">
                <Badge variant="secondary" className="mb-4">Free</Badge>
                <h4 className="text-3xl font-black text-white mb-2">$0</h4>
                <p className="text-white/50 text-sm mb-6">3 Corey questions per month</p>
                <ul className="space-y-3 text-sm text-white/70 text-left">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> OSHA recordability guidance</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Basic DOT compliance help</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Voice input</li>
                </ul>
              </Card>
              <Card className="bg-accent/10 border-accent/30 p-6 relative" data-testid="card-corey-pricing-unlimited">
                <Badge className="mb-4 bg-accent">Most Popular</Badge>
                <h4 className="text-3xl font-black text-white mb-2">$99<span className="text-lg font-normal text-white/50">/mo</span></h4>
                <p className="text-white/50 text-sm mb-6">Unlimited Corey interactions</p>
                <ul className="space-y-3 text-sm text-white/70 text-left">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Everything in Free</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Unlimited questions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Document generation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Export & share conversations</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Priority support</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-8 w-auto brightness-0 invert opacity-50" />
          </div>
          <p className="text-xs text-white/40">Powered by Core Compliance Hub</p>
          <Link href="/">
            <span className="text-xs text-white/40 hover:text-white/60 cursor-pointer">Visit Full Platform</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

function CoreyApp() {
  const { data: conversations, isLoading: isLoadingConvos } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const { user } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const { toast } = useToast();

  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [topicPickerMode, setTopicPickerMode] = useState<"meeting" | "weekly">("meeting");
  const [customTopicMode, setCustomTopicMode] = useState(false);
  const [customTopicValue, setCustomTopicValue] = useState("");

  const SAFETY_TOPICS = [
    "Slips, Trips & Falls Prevention",
    "PPE — Proper Use & Inspection",
    "Lockout/Tagout (LOTO)",
    "Fire Safety & Extinguisher Use",
    "Electrical Safety",
    "Hazard Communication & SDS",
    "Machine Guarding",
    "Forklift / Powered Industrial Truck Safety",
    "Confined Space Awareness",
    "Fall Protection",
    "Heat Illness Prevention",
    "Ergonomics & Manual Lifting",
    "Ladder Safety",
    "Housekeeping & Workplace Organization",
    "Emergency Action Plan & Evacuation",
    "Bloodborne Pathogens",
    "Hearing Conservation",
    "Respiratory Protection",
    "Hand & Power Tool Safety",
    "Driving & Fleet Safety",
    "Chemical Safety & Spill Response",
    "Incident Reporting & Near-Miss",
    "New Employee Safety Orientation",
    "Crane & Rigging Safety",
    "Welding & Hot Work Safety",
  ];

  const handleTopicSelect = (topic: string) => {
    setTopicPickerOpen(false);
    const title = topicPickerMode === "meeting"
      ? `Safety Meeting: ${topic}`
      : `Safety Topic: ${topic}`;
    const prompt = topicPickerMode === "meeting"
      ? `I need you to lead a safety meeting for my team on the topic: "${topic}". Please present a structured agenda that includes: 1) An opening safety moment related to ${topic}, 2) The OSHA regulatory references and CFR citations that apply to ${topic}, 3) 3-4 key discussion points with real-world examples, 4) A real-world incident scenario related to ${topic} for the team to discuss, 5) 2-3 discussion questions to engage the team, 6) Key takeaways, 7) Action items with responsible parties and due dates. After we discuss, generate meeting minutes I can distribute. Let's begin — present the agenda.`
      : `Generate a 5-minute weekly safety topic briefing on: "${topic}". Include: the specific OSHA standard reference (29 CFR), 3-4 key talking points, a real-world enforcement case or incident example related to ${topic}, 2-3 discussion questions to engage the team, one actionable takeaway, and 2 quiz questions to check understanding. Format it so I can read it directly to my crew. Make it practical and engaging, not just regulatory text.`;
    createConversation(title, {
      onSuccess: (data) => {
        setActiveConversationId(data.id);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("corey-auto-send", { detail: { prompt } }));
        }, 300);
      },
    });
  };

  const handleNewChat = () => {
    createConversation("New Question", {
      onSuccess: (data) => {
        setActiveConversationId(data.id);
        setSidebarOpen(false);
      },
    });
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE", credentials: "include" });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      toast({ title: "Conversation deleted" });
    } catch {
      toast({ title: "Failed to delete conversation", variant: "destructive" });
    }
  };

  const handleRenameConversation = async (id: number) => {
    if (!renameValue.trim()) return;
    try {
      await apiRequest("PATCH", `/api/conversations/${id}`, { title: renameValue.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setRenamingId(null);
      setRenameValue("");
      toast({ title: "Conversation renamed" });
    } catch {
      toast({ title: "Failed to rename", variant: "destructive" });
    }
  };

  

  const QUICK_ACTIONS = [
    {
      id: "safety-meeting",
      title: "Lead a Safety Meeting",
      description: "Choose a topic and let Corey build your full safety meeting agenda.",
      icon: ClipboardList,
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
      prompt: "",
      openTopicPicker: "meeting" as const,
    },
    {
      id: "osha-300-audit",
      title: "Audit My OSHA 300",
      description: "Walk through a guided audit of your OSHA 300 Log for accuracy and compliance.",
      icon: Search,
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      prompt: "I need you to audit my OSHA 300 Log. Walk me through a guided Q&A audit per 29 CFR 1904. Start by asking me about my establishment information, then go through each required column of the OSHA 300 Log one by one. Check for common errors like: miscounted days away/restricted, cases that should have been recorded but weren't, privacy concern cases not properly handled, and whether my annual summary (300A) was posted correctly from February 1 to April 30. Ask me one question at a time and evaluate my answers against OSHA requirements.",
    },
    {
      id: "mock-inspection",
      title: "Mock OSHA Inspection",
      description: "Simulate what an OSHA compliance officer would ask during an inspection.",
      icon: AlertTriangle,
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      prompt: "Conduct a mock OSHA inspection of my workplace. Act as an OSHA Compliance Safety and Health Officer (CSHO) conducting an on-site inspection. Start with the opening conference — ask about my establishment, number of employees, and industry. Then walk me through what you would inspect: review of OSHA 300 logs, written programs (HazCom, LOTO, Respiratory), training records, PPE assessments, and walk-around observations. Ask me questions one at a time as if you were actually inspecting my facility. Flag any potential citations (Serious, Other-than-Serious, Willful, Repeat) and reference the specific 29 CFR standards. End with a closing conference summarizing findings.",
    },
    {
      id: "weekly-safety-topic",
      title: "Weekly Safety Topic",
      description: "Pick a topic and get a ready-to-present 5-minute safety talk.",
      icon: BookOpen,
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      prompt: "",
      openTopicPicker: "weekly" as const,
    },
    {
      id: "compliance-calendar",
      title: "Compliance Calendar Check",
      description: "Review upcoming regulatory deadlines and required submissions.",
      icon: Calendar,
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      prompt: "Help me check my compliance calendar. Based on today's date, walk me through all upcoming OSHA, DOT, and EPA regulatory deadlines I should be aware of for the next 90 days. Include: OSHA 300A posting/removal dates, OSHA electronic submission deadlines (ITA), DOT random drug testing rate requirements, respirator fit test annual requirements, hearing conservation audiogram schedules, fire extinguisher inspections, and any other time-sensitive compliance obligations. Ask me about my industry and company size so you can tailor the deadlines to my situation.",
    },
    {
      id: "gap-analysis",
      title: "Gap Analysis — ACSI",
      description: "Full gap analysis is an ACSI service. Let Corey connect you.",
      icon: Target,
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
      prompt: "A user is interested in a Gap Analysis for their compliance programs or ISO management system. Gap Analysis is a core service provided by ACSI (Assessment & Consulting Services Inc.), our dedicated ISO and compliance consulting division. Please explain what a Gap Analysis involves — covering ISO 9001, 14001, 45001, and OSHA compliance program reviews — and let them know that ACSI's Lead ISO Auditors specialize in conducting thorough gap analyses, audit preparation, and implementation support. You can answer general questions about what gap analysis covers, but for the actual structured assessment, direct them to ACSI. At the end of your response, always include a clear call-to-action: Visit ACSI online at [www.acsi-quality.com](https://www.acsi-quality.com/) to learn more, or head to their [Contact page](https://www.acsi-quality.com/contact) to reach out directly and schedule your gap analysis.",
    },
    {
      id: "osha-recordability",
      title: "Is This Recordable?",
      description: "Walk through an incident to determine if it's OSHA recordable.",
      icon: Scale,
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-400",
      prompt: "I need help determining if a workplace incident is OSHA recordable under 29 CFR 1904. Walk me through the recordability decision step by step. Ask me these questions one at a time: 1) Did the incident involve a work-related injury or illness? 2) Is it a new case or a recurrence of a previously recorded case? 3) Did it result in death? 4) Did it result in days away from work? 5) Did it result in restricted work activity or job transfer? 6) Did it require medical treatment beyond first aid? 7) Did it result in loss of consciousness? 8) Was it a significant injury or illness diagnosed by a physician or licensed health care professional? For each answer, explain the regulatory basis from 29 CFR 1904.7. Also help me understand the difference between first aid and medical treatment per OSHA's definitions. At the end, give me a clear determination: recordable or not recordable, and which OSHA 300 Log column to use if recordable.",
    },
  ];

  const DOCUMENT_TEMPLATES = [
    { category: "Policies & Programs", label: "Drug & Alcohol Policy", prompt: "Generate a complete Drug & Alcohol Policy document for our company based on 49 CFR Part 40 and FMCSA 49 CFR Part 382. Include all required sections: purpose, scope, definitions, prohibited conduct, testing types (pre-employment, random, reasonable suspicion, post-accident, return-to-duty, follow-up), consequences, SAP referral, confidentiality, and employee acknowledgment. Format it as a professional policy document ready for implementation." },
    { category: "Policies & Programs", label: "OSHA Recordkeeping SOP", prompt: "Generate a Standard Operating Procedure (SOP) for OSHA Recordkeeping based on 29 CFR 1904. Include sections for: determining work-relatedness, recordability decision criteria, first aid vs. recordable distinction, OSHA 300 Log maintenance, OSHA 300A annual summary posting requirements, OSHA 301 incident reports, employee privacy cases, electronic submission requirements, and responsible parties. Format as a professional SOP document." },
    { category: "Policies & Programs", label: "Respiratory Protection Program", prompt: "Generate a complete Respiratory Protection Program document per OSHA 29 CFR 1910.134. Include: program administrator responsibilities, workplace hazard evaluation, respirator selection, medical evaluations, fit testing procedures (qualitative and quantitative), training requirements, use and maintenance, breathing air quality, recordkeeping, and program evaluation. Format as a professional program document." },
    { category: "Policies & Programs", label: "Hearing Conservation Program", prompt: "Generate a Hearing Conservation Program document per OSHA 29 CFR 1910.95. Include: noise monitoring, audiometric testing program, hearing protection selection, employee training, recordkeeping requirements, action level (85 dBA) and PEL (90 dBA) procedures, baseline and annual audiograms, Standard Threshold Shift evaluation, and follow-up procedures." },
    { category: "Policies & Programs", label: "Hazard Communication Program", prompt: "Generate a Hazard Communication Program (HazCom/GHS) document per OSHA 29 CFR 1910.1200. Include: written program elements, chemical inventory, Safety Data Sheet management, container labeling requirements (GHS pictograms, signal words, hazard statements), employee training program, non-routine tasks, contractors, and recordkeeping." },
    { category: "Policies & Programs", label: "Lockout/Tagout (LOTO) Program", prompt: "Generate a complete Lockout/Tagout (LOTO) Program per OSHA 29 CFR 1910.147. Include: purpose and scope, definitions, responsibilities, energy control procedures, lockout/tagout device requirements, authorized and affected employee training, periodic inspections, group lockout procedures, shift/personnel changes, and contractor coordination." },
    { category: "Policies & Programs", label: "Emergency Action Plan", prompt: "Generate a complete Emergency Action Plan (EAP) per OSHA 29 CFR 1910.38. Include: emergency escape procedures and routes, critical plant operations procedures, employee headcount procedures after evacuation, rescue and medical duties, preferred means of reporting emergencies, names of persons to contact for further information, alarm system description, evacuation procedures for employees with disabilities, training requirements, and review schedule. Format as a professional plan document ready for implementation." },
    { category: "Policies & Programs", label: "Fire Prevention Plan", prompt: "Generate a complete Fire Prevention Plan per OSHA 29 CFR 1910.39. Include: list of all major fire hazards and proper handling/storage procedures for hazardous materials, potential ignition sources and their control, type of fire protection equipment necessary, procedures to control accumulation of flammable and combustible waste materials, procedures for regular maintenance of safeguards, names of responsible personnel for maintenance of fire prevention equipment, names of responsible personnel for control of fuel source hazards, housekeeping procedures, employee training requirements, and coordination with Emergency Action Plan. Format as a professional plan document." },
    { category: "Policies & Programs", label: "Bloodborne Pathogen Exposure Control Plan", prompt: "Generate a complete Bloodborne Pathogen Exposure Control Plan per OSHA 29 CFR 1910.1030. Include: exposure determination by job classification, schedule and methods of implementation, Hepatitis B vaccination program, post-exposure evaluation and follow-up procedures, communication of hazards (labels, signs, training), engineering and work practice controls, personal protective equipment requirements, housekeeping procedures, regulated waste disposal, laundry procedures, recordkeeping requirements (sharps injury log, training records, medical records), and annual plan review procedures. Format as a professional program document." },
    { category: "Policies & Programs", label: "Forklift/PIT Safety Program", prompt: "Generate a complete Forklift/Powered Industrial Truck (PIT) Safety Program per OSHA 29 CFR 1910.178. Include: program scope and purpose, types of powered industrial trucks covered, operator training requirements (formal instruction, practical training, evaluation), topics to be covered in training (truck-related topics, workplace-related topics), refresher training and evaluation triggers, operator certification documentation, pre-shift inspection procedures, safe operating procedures, load handling, traveling, fueling/charging, maintenance requirements, pedestrian safety, and recordkeeping. Format as a professional program document." },
    { category: "Policies & Programs", label: "Fit for Duty Policy", prompt: "Generate a complete Fit for Duty (FFD) Policy document for an employer. This policy governs when and how fitness-for-duty evaluations are required. Include the following sections:\n\nPURPOSE & SCOPE: Explain the purpose of the policy — to ensure employees are physically and mentally capable of safely performing the essential functions of their job — and define who it applies to (all employees, including those returning from leave, injury, illness, or surgery).\n\nDEFINITIONS: Define key terms — Fit for Duty, Essential Job Functions, Occupational Health Provider, Work Restrictions, Modified Duty, and Authorized Medical Leave.\n\nTRIGGERS FOR FFD EVALUATION: List the specific circumstances that require a fitness-for-duty evaluation, including: return to work after any workplace injury, return to work after a non-occupational illness or surgery lasting more than 3 days, reasonable suspicion of physical or mental impairment affecting job performance, post-incident evaluation following a serious workplace accident, periodic surveillance exams per OSHA standards (e.g., 29 CFR 1910.134 respirator clearance, 29 CFR 1910.95 hearing conservation), DOT-required physicals per 49 CFR Part 391, and any other circumstance deemed appropriate by HR or Safety.\n\nPROCEDURE: Step-by-step process including: employer initiates referral using the Fit for Duty Form, employee reports to the designated occupational health provider, provider communicates fitness status and any work restrictions to HR (no diagnosis shared), HR and Supervisor determine appropriate duty assignment based on provider guidance, documentation retained in confidential medical file.\n\nCONFIDENTIALITY: State that all medical information is kept strictly confidential per ADA and HIPAA. Only fitness status and work restrictions are shared with supervisors — no diagnosis or treatment details.\n\nMODIFIED DUTY / LIGHT DUTY: Describe when modified duty is offered, duration limits, and the process for transitioning back to full duty.\n\nEMPLOYEE RESPONSIBILITIES: Employee must attend the scheduled evaluation, provide complete and honest information to the provider, follow all recommended restrictions, and notify HR if their condition changes.\n\nEMPLOYER RESPONSIBILITIES: Provide a safe and accurate job description, pay for the evaluation, maintain confidentiality, accommodate medically necessary restrictions to the extent feasible, and not retaliate against any employee for participating in an FFD evaluation.\n\nNON-COMPLIANCE: State that refusal to participate in a required FFD evaluation may result in disciplinary action up to and including termination, consistent with applicable law.\n\nREFERENCES: ADA 42 U.S.C. § 12101, FMLA 29 CFR Part 825, OSHA 29 CFR 1910.134, OSHA 29 CFR 1910.95, DOT 49 CFR Part 391, HIPAA Privacy Rule.\n\nFormat as a professional policy document with signature lines for HR Director and CEO/President, and an employee acknowledgment page. Include policy number, effective date, and review date fields." },
    { category: "Policies & Programs", label: "Fall Protection Plan", prompt: "Generate a complete Fall Protection Plan per OSHA 29 CFR 1926.502. Include: identification of all fall hazards in the work area, methods of fall protection to be used (guardrails, safety nets, personal fall arrest systems), procedures for assembly, maintenance, inspection and disassembly of fall protection systems, procedures for handling, storage and securing of tools and materials, rescue procedures for workers who have fallen, training requirements for all employees exposed to fall hazards, duty to have fall protection at 6 feet in construction, leading edge work procedures, and documentation requirements. Format as a professional plan document." },
    { category: "Policies & Programs", label: "Electrical Safety Program", prompt: "Generate a complete Electrical Safety Program based on NFPA 70E and OSHA 29 CFR 1910 Subpart S. Include: program scope and purpose, qualified vs. unqualified person definitions, electrical hazard analysis procedures, arc flash risk assessment, shock risk assessment, approach boundaries (limited, restricted, prohibited), PPE requirements and selection (arc-rated clothing, insulated gloves, face shields), energized electrical work permit procedures, lockout/tagout coordination, safe work practices, training requirements for qualified and unqualified persons, equipment maintenance and inspection, portable electric equipment and extension cord safety, and recordkeeping requirements. Format as a professional program document." },
    { category: "Policies & Programs", label: "Process Safety Management Overview", prompt: "Generate a comprehensive Process Safety Management (PSM) program overview per OSHA 29 CFR 1910.119. Include all 14 elements: employee participation, process safety information, process hazard analysis (PHA), operating procedures, training (initial and refresher), contractors, pre-startup safety review, mechanical integrity, hot work permits, management of change (MOC), incident investigation, emergency planning and response, compliance audits, and trade secrets. For each element, describe the regulatory requirements, implementation steps, and documentation needs. Format as a professional program overview document." },
    { category: "Permits & Forms", label: "Fit for Duty (FFD) Form", prompt: "Generate a professional Fit for Duty (FFD) evaluation form that an employer fills out and sends with an employee to an occupational health clinic. The form must include the following sections:\n\nSECTION 1 — EMPLOYER INFORMATION: Company name, address, phone, fax, contact person name and title, date of evaluation request.\n\nSECTION 2 — EMPLOYEE INFORMATION: Full name, date of birth, job title, department, date of hire, employee ID, supervisor name.\n\nSECTION 3 — REASON FOR EVALUATION (checkboxes): Pre-employment physical, Annual/Periodic surveillance exam, Return-to-work after illness, Return-to-work after injury, Return-to-work after surgery, Fitness-for-duty concern, DOT physical, OSHA-mandated medical exam (specify standard), Other (explain).\n\nSECTION 4 — JOB PHYSICAL DEMANDS DESCRIPTION: List the essential functions of the employee's position including: lifting requirements (frequency and max weight), pushing/pulling, standing/walking duration, bending/stooping/squatting, climbing (ladders, stairs), working at heights, working in confined spaces, driving requirements (CDL/non-CDL), use of hand tools/vibrating equipment, exposure to chemicals/hazardous materials (list), exposure to extreme temperatures, exposure to noise above 85 dBA, use of respirator (type), repetitive motion tasks, other physical demands.\n\nSECTION 5 — CURRENT WORK STATUS (checkboxes): Full duty — no restrictions, Light duty — see restrictions below, Modified duty, Currently off work, Work restriction details (blank field for specifics including any accommodations already in place).\n\nSECTION 6 — MEDICAL INFORMATION RELEASE: Brief statement that the employer authorizes the reviewing physician to communicate the employee's fitness-for-duty status and any work restrictions to the employer. Note that the employer does not request and does not need a diagnosis. Employer representative signature and date line.\n\nSECTION 7 — EMPLOYEE AUTHORIZATION: Employee signature authorizing release of fitness-for-duty status and work restrictions (not diagnosis) to the employer. Signature and date line.\n\nSECTION 8 — FOR CLINIC USE ONLY (physician completes this section): Employee IS / IS NOT fit to perform the essential functions of their job (circle one). If not fully fit, recommended restrictions (checkboxes): No lifting over ___ lbs, No prolonged standing (limit to ___ hours), No bending/stooping, No climbing, No driving, No operating heavy machinery, No exposure to (specify), Sedentary work only, Other restrictions (describe). Estimated duration of restrictions: ___. Recommended follow-up: ___. Next evaluation date: ___. Physician/Provider name (print), signature, credentials, clinic name, address, phone, date of evaluation.\n\nFormat the entire document as a clean, professional, print-ready form with clear section headers, appropriate blank lines and checkboxes, and a footer noting: 'This form does not request a diagnosis. All medical information is kept confidential per HIPAA. For questions contact [HR/Safety Department].' Reference applicable OSHA medical standards where relevant (e.g., 29 CFR 1910.134 for respirator medical evaluation, 29 CFR 1910.95 for hearing conservation). This form should be suitable for any industry." },
    { category: "Permits & Forms", label: "Return-to-Duty Checklist", prompt: "Generate a comprehensive Return-to-Duty Checklist for DOT-regulated employees per 49 CFR Part 40 Subpart O. Include: SAP initial evaluation, treatment/education completion, SAP follow-up evaluation, Clearinghouse reporting steps, return-to-duty test (negative drug / <0.02 alcohol), direct observation requirements, follow-up testing plan (minimum 6 tests in 12 months), employer documentation requirements, and employee acknowledgment." },
    { category: "Permits & Forms", label: "Incident Investigation Form", prompt: "Generate a comprehensive Incident Investigation Form and procedure based on OSHA 29 CFR 1904.7. Include: incident details (who, what, when, where), witness statements, root cause analysis (5 Whys, Fishbone), contributing factors, OSHA recordability determination, corrective actions, preventive measures, responsible parties, follow-up dates, and management sign-off. Format as a fillable form template." },
    { category: "Permits & Forms", label: "Confined Space Entry Permit", prompt: "Generate a complete Confined Space Entry Permit template per OSHA 29 CFR 1910.146. Include: permit space identification and location, purpose of entry, date and authorized duration, authorized entrants, attendants, and entry supervisors, hazards of the permit space, measures to isolate the space and eliminate/control hazards (lockout/tagout, purging, ventilating), acceptable entry conditions, results of initial and periodic atmospheric testing (oxygen, flammable gases, toxic substances), rescue and emergency services and contact information, communication procedures, equipment required (ventilation, PPE, lighting, barriers, rescue), hot work permit cross-reference if applicable, and entry supervisor sign-off. Format as a professional permit form." },
    { category: "Permits & Forms", label: "Hot Work Permit", prompt: "Generate a complete Hot Work Permit template for welding, cutting, brazing, and other spark-producing operations. Include: date, time, and duration of work, location and description of work to be performed, fire watch requirements (during and 60 minutes post-work), fire protection equipment required and verified, sprinkler system status, combustible materials clearance (35-foot radius), floor and wall opening protection, confined space considerations, atmospheric testing if applicable, responsible supervisor authorization, fire watch personnel acknowledgment, contractor information if applicable, and final inspection sign-off. Reference OSHA 29 CFR 1910.252 and NFPA 51B. Format as a professional permit form." },
    { category: "Permits & Forms", label: "Contractor Safety Pre-Qualification Form", prompt: "Generate a comprehensive Contractor Safety Pre-Qualification Form. Include sections for: company information, insurance certificates (general liability, workers compensation, auto), EMR (Experience Modification Rate) for past 3 years, OSHA 300 log summary (TRIR and DART rates) for past 3 years, written safety program verification, drug and alcohol testing program, employee training documentation, PPE program, OSHA citation history, safety personnel/competent person identification, subcontractor management procedures, emergency response capabilities, equipment inspection/maintenance records, references from previous clients, and contractor acknowledgment of host employer safety rules. Format as a professional pre-qualification form." },
    { category: "Permits & Forms", label: "Letter to the Clinic", prompt: "Generate a professional Occupational Health Referral & Authorization Letter — a formal letter from the employer to an occupational health clinic or physician that accompanies an employee to a medical appointment. The letter must include:\n\nLETTERHEAD SECTION: Company name, address, phone, fax, date, clinic/physician name and address.\n\nOPENING: Formal salutation addressing the occupational health provider, explaining the purpose of the letter — authorizing evaluation of the named employee and providing necessary job information.\n\nEMPLOYEE INFORMATION: Employee full name, date of birth, job title, department, supervisor name, date of hire, employee ID.\n\nREASON FOR VISIT (checkboxes): Pre-employment physical, Post-offer physical, Annual/periodic medical surveillance, Return-to-work evaluation, Fitness-for-duty evaluation, DOT physical (CDL renewal or new), OSHA-mandated exam (specify standard), Injury/illness treatment (work-related), Drug screen only, Breath alcohol test only, Both drug screen and breath alcohol, Other (specify).\n\nJOB PHYSICAL DEMANDS: Brief written description of essential physical requirements of the position (lifting limits, standing duration, environmental exposures, use of respirator, noise exposure, driving requirements, etc.)\n\nAUTHORIZATION INSTRUCTIONS TO PROVIDER: The employer requests that the provider communicate only fitness status and any work restrictions — NOT diagnosis or treatment details. Results should be faxed or communicated directly to the HR/Safety contact listed. Include confidentiality statement per ADA and HIPAA.\n\nEMPLOYER AUTHORIZATION: Printed name, title, signature, and date of HR or Safety representative authorizing the visit. Contact name, direct phone, fax, and email.\n\nEMPLOYEE CONSENT LINE: Employee signature confirming they authorize the release of fitness-for-duty status and work restrictions to the employer.\n\nBILLING INFORMATION: Company billing address, purchase order or account number if applicable.\n\nFormat as a clean, professional business letter suitable for printing on company letterhead. Include a footer: 'This letter authorizes a limited occupational health evaluation only. All medical information is protected under HIPAA and ADA. For questions, contact [HR/Safety contact].' This letter should be ready to hand to the employee to take to the clinic." },
    { category: "Permits & Forms", label: "Digital Medical Passport Authorization", prompt: "Generate a Digital Medical Passport & Clinic Check-In Authorization Form — a smart authorization form that an employee completes before or upon arriving at an occupational health clinic, enabling efficient check-in and capturing all necessary consent and employer authorization in one document. Include:\n\nSECTION 1 — EMPLOYEE IDENTITY & CHECK-IN: Full name, date of birth, last 4 of SSN, job title, department, employer name, supervisor name, today's date, time of arrival, reason for visit (dropdown list: pre-employment, annual physical, return-to-work, drug screen, DOT physical, injury treatment, other).\n\nSECTION 2 — EMPLOYER PRE-AUTHORIZATION: Employer name, billing account, authorizing HR/Safety contact, phone, pre-authorization code (if applicable), work restrictions currently in place (if return-to-work visit), job description/physical demands reference attached (yes/no).\n\nSECTION 3 — MEDICAL HISTORY SNAPSHOT (for occupational health use): Known allergies, current medications (optional — employee may decline), prior occupational injuries (yes/no, if yes describe), chronic conditions that may affect work capacity (optional).\n\nSECTION 4 — RELEASE & CONSENT: Employee consents to the occupational health evaluation. Employee authorizes the provider to communicate fitness-for-duty status and work restrictions ONLY (not diagnosis or treatment) to the named employer contact. Employee acknowledges this is not a general medical appointment and that HIPAA protections apply with the occupational health carve-out for fitness-for-duty communications.\n\nSECTION 5 — INCIDENT-RELATED VISITS (if applicable): Date, time, and description of incident. Body part affected. Witnessed by (name). First aid administered prior to clinic visit (yes/no, describe). OSHA recordability determination pending (checkbox).\n\nSECTION 6 — EMPLOYEE SIGNATURE & TIMESTAMP: Employee signature, printed name, date, and time. QR code reference field (for digital passport systems).\n\nSECTION 7 — CLINIC STAFF USE ONLY: Check-in time, provider assigned, copay/billing confirmed, authorization verified, chart number assigned.\n\nFormat as a clean, professional one-page (or two-page) clinic intake form. Reference HIPAA Privacy Rule and ADA compliance. Note that this form integrates with the CCHUB Handshake digital check-in system." },
    { category: "Permits & Forms", label: "Near Miss Report Form", prompt: "Generate a professional Near Miss Report Form for workplace use. A near miss is an unplanned event that did not result in injury or property damage but had the potential to do so. Include:\n\nSECTION 1 — REPORTER INFORMATION: Name (may be anonymous), department, job title, date and time of near miss, location/area.\n\nSECTION 2 — NEAR MISS DESCRIPTION: Detailed narrative of what happened, what equipment or materials were involved, environmental conditions, what could have happened if circumstances had been slightly different.\n\nSECTION 3 — CONTRIBUTING FACTORS (checkboxes): Inadequate training, lack of/improper PPE, unsafe equipment or tools, poor housekeeping, inadequate lighting, time pressure/rushing, distraction, unfamiliarity with task, missing or unclear procedure, inadequate supervision, fatigue, other.\n\nSECTION 4 — IMMEDIATE ACTIONS TAKEN: Steps taken immediately after the near miss to prevent recurrence.\n\nSECTION 5 — SUPERVISOR REVIEW: Supervisor name, date reviewed, root cause determination (5 Whys or Fishbone), corrective actions assigned, responsible person, target completion date, follow-up date, supervisor signature.\n\nSECTION 6 — SAFETY MANAGER REVIEW: Date escalated (if needed), systemic issues identified, policy or procedure updates required, corrective action closure verification, final sign-off.\n\nFormat as a professional form with a note at the top encouraging a 'no-blame reporting culture.' Reference OSHA's voluntary protection program (VPP) guidance on near miss reporting. Include a reminder that near miss reports are a leading indicator of safety performance and should never result in discipline against the reporter." },
    { category: "Permits & Forms", label: "Corrective Action Plan (CAPA) Form", prompt: "Generate a comprehensive Corrective Action and Preventive Action (CAPA) Form for workplace safety and compliance incidents. Include:\n\nSECTION 1 — CAPA INITIATION: CAPA number, date opened, opened by, department, source of CAPA (incident, near miss, audit finding, employee concern, regulatory inspection, customer complaint, management review).\n\nSECTION 2 — PROBLEM DESCRIPTION: Clear description of the deficiency, nonconformance, or hazard. Applicable regulation or standard violated (if any). Actual or potential consequence if not corrected. Date of occurrence.\n\nSECTION 3 — IMMEDIATE CONTAINMENT ACTIONS: Actions taken immediately to stop the problem from continuing or causing harm. Responsible person. Date completed.\n\nSECTION 4 — ROOT CAUSE ANALYSIS: Method used (5 Whys, Fishbone/Ishikawa, Fault Tree). Step-by-step root cause analysis documentation. True root cause statement (one clear sentence describing the fundamental cause).\n\nSECTION 5 — CORRECTIVE ACTIONS: Specific actions to eliminate the root cause. Each action: description, responsible person, target date, completion date, evidence of completion.\n\nSECTION 6 — PREVENTIVE ACTIONS: Steps taken to prevent similar issues in other areas or processes. Policy/procedure updates required. Training updates. Communication plan.\n\nSECTION 7 — EFFECTIVENESS VERIFICATION: How will effectiveness be measured? Verification date. Verifier name. Did the corrective action work? (Yes/No/Partially — explain).\n\nSECTION 8 — CAPA CLOSURE: Date closed, closed by, management sign-off.\n\nFormat as a professional CAPA form suitable for both safety compliance and quality management systems. Reference OSHA injury reduction programs and note compatibility with ISO 45001:2018 Clause 10.2 (nonconformity and corrective action)." },
    { category: "Permits & Forms", label: "Return-to-Work Authorization Letter", prompt: "Generate a professional Return-to-Work Authorization Letter template — a formal letter from an occupational health provider (or HR department) to the employer documenting an employee's fitness-for-duty status and any applicable work restrictions following an injury, illness, or medical leave. Include two versions:\n\nVERSION A — FROM OCCUPATIONAL HEALTH PROVIDER TO EMPLOYER:\nClinic/provider letterhead fields, date, employer HR/Safety contact name and address. Employee name, DOB, job title. Evaluation date. Fitness determination: FULLY FIT — may return to full duty without restrictions / CONDITIONALLY FIT — may return with the following temporary restrictions / NOT FIT — employee is not cleared to return at this time (estimated return date if known). Work restrictions section (checkboxes): no lifting over ___ lbs, no prolonged standing (limit to ___ hours per shift), no bending/stooping, no climbing, no driving, no operating heavy machinery, limited exposure to ___, sedentary work only, other ___. Estimated duration of restrictions. Recommended follow-up date. Provider name, credentials, signature, clinic name, phone, date.\n\nVERSION B — EMPLOYER ACKNOWLEDGMENT FORM:\nEmployer confirms receipt of medical clearance, documents the modified duty assignment offered (job title, department, hours, pay rate), supervisor assigned, start date of modified duty, estimated duration. HR and supervisor signatures. Employee acknowledgment signature.\n\nFormat both as clean, professional letters/forms. Include confidentiality footer per ADA and HIPAA. Note that the employer receives fitness/restriction information only — no diagnosis or treatment information is shared." },
    { category: "Permits & Forms", label: "Reasonable Suspicion Documentation Form", prompt: "Generate a professional Reasonable Suspicion Documentation Form for supervisors to document observed behavior that may indicate employee impairment by drugs or alcohol, per DOT 49 CFR Part 382.307 and general employer drug-free workplace requirements. Include:\n\nSECTION 1 — SUPERVISOR INFORMATION: Name, title, department, date trained in reasonable suspicion detection (required by DOT), date and time of observation.\n\nSECTION 2 — EMPLOYEE INFORMATION: Employee name, job title, department, employee ID, work location at time of observation.\n\nSECTION 3 — BEHAVIORAL OBSERVATIONS (supervisor must check and describe all that apply):\nPHYSICAL SIGNS: Slurred speech, bloodshot/glazed eyes, constricted/dilated pupils, unusual smell (alcohol, marijuana, etc.), impaired coordination/balance, tremors, sweating/flushing, unusual pallor, appearing dazed or confused.\nBEHAVIORAL SIGNS: Erratic behavior, mood swings, agitation, combativeness, incoherent speech, inability to focus, making repetitive movements, falling asleep on duty, performing duties unsafely.\nPERFORMANCE INDICATORS: Operating equipment unsafely, unable to complete normal tasks, involved in near miss or incident, found in unauthorized area.\n\nSECTION 4 — NARRATIVE DESCRIPTION: Supervisor writes a detailed factual description of everything observed — time, location, witnesses present, specific behaviors and statements (use direct quotes where possible).\n\nSECTION 5 — SECOND SUPERVISOR CONCURRENCE (required by DOT for covered employees): Second trained supervisor name, title, date and time they observed the employee (or reviewed the documentation), their independent observations, signature.\n\nSECTION 6 — ACTIONS TAKEN: Employee removed from safety-sensitive function (yes/no), time removed, employee offered transportation (yes/no), employee sent for reasonable suspicion test (yes/no), test date/time/location, test type (urine drug / breath alcohol / both), collection site.\n\nSECTION 7 — SUPERVISOR CERTIFICATIONS: Supervisor certifies they have completed DOT-required 60-minute alcohol and 60-minute drug reasonable suspicion training. Both supervisor signatures and dates.\n\nSECTION 8 — CONFIDENTIALITY NOTICE: This document is confidential. Contents may only be shared with those who have a need to know (HR, safety, legal, MRO). Do not share with other employees or supervisors not involved in this action.\n\nFormat as a professional form. Reference 49 CFR Part 382.307 for DOT-covered drivers and note that this form is also appropriate for non-DOT employees under a company drug-free workplace policy." },
    { category: "Permits & Forms", label: "Supervisor First Report of Injury", prompt: "Generate a comprehensive Supervisor's First Report of Injury/Illness form for workplace use. This is the internal form a supervisor completes when an employee reports a workplace injury or illness. It is the starting point for the OSHA 301 Incident Report and workers' compensation claim. Include:\n\nSECTION 1 — EMPLOYEE INFORMATION: Full name, DOB, home address, job title, department, date of hire, shift (1st/2nd/3rd), supervisor name, length of time on this job.\n\nSECTION 2 — INCIDENT DETAILS: Date of injury/illness, time of incident, time employee began work that day, exact location of incident (building, department, equipment area), nature of incident (caught in, struck by, struck against, fall from elevation, fall on same level, overexertion, repetitive motion, exposure to substance, other), part of body affected, object or substance that directly caused the injury.\n\nSECTION 3 — INCIDENT DESCRIPTION: Detailed narrative of exactly what happened (what was the employee doing, what went wrong, how did the injury occur — in employee's own words where possible).\n\nSECTION 4 — WITNESS INFORMATION: Names and contact info of all witnesses.\n\nSECTION 5 — MEDICAL TREATMENT: First aid administered on-site (yes/no, describe), sent to occupational health clinic (yes/no, which clinic), transported by (self, supervisor, ambulance), physician/clinic seen, diagnosis if available, work restrictions issued (yes/no, describe), employee returned to work same day (yes/no), lost time anticipated (yes/no).\n\nSECTION 6 — EQUIPMENT INVOLVED: Equipment name, model number, age, last inspection date, guarding in place (yes/no), maintenance records current (yes/no).\n\nSECTION 7 — OSHA RECORDABILITY DETERMINATION: Work-related (yes/no/pending), first aid only (yes/no), recordable on OSHA 300 Log (yes/no/pending review), OSHA 300 entry date and case number.\n\nSECTION 8 — CORRECTIVE ACTIONS: Immediate corrective actions taken, follow-up actions required, responsible person, target date.\n\nSECTION 9 — SIGNATURES: Employee signature, supervisor signature and date, safety manager review date.\n\nFormat as a professional form. Reference OSHA 29 CFR 1904 recordkeeping requirements and note this form should be completed within 24 hours of any workplace injury or illness." },
    { category: "Permits & Forms", label: "Respirator Medical Evaluation Questionnaire", prompt: "Generate a complete Respirator Medical Evaluation Questionnaire per OSHA 29 CFR 1910.134 Appendix C. This questionnaire must be administered to all employees required to use a respirator before they begin respirator use and periodically thereafter. Include all required questions from Appendix C exactly as specified in the regulation:\n\nPART A — SECTION 1 (Mandatory): Employee name and date, employer name, phone, manager/supervisor name, work phone, current occupation, physical requirements of job (very heavy work, heavy work, moderate work, light work), work done with the respirator (briefly describe), duration of respirator use per shift, respirator type (N95 filtering facepiece, half facepiece, full facepiece, powered air-purifying, supplied air, self-contained breathing apparatus), whether employee has used a respirator before, all 10 mandatory Part A medical questions (cardiovascular disease history, respiratory disease history, rashes/skin allergies, vision problems, hearing loss, etc.)\n\nPART A — SECTION 2 (Mandatory for SCBA or full-facepiece respirators): Additional cardiovascular and respiratory questions.\n\nPART B (Questions 1-2 are mandatory, 3-9 are optional for the physician to ask): Detailed medical history questions about heart disease, lung problems, medications, claustrophobia, reduced mobility, etc.\n\nADMINISTRATIVE INFORMATION: Instructions to employee (complete honestly, physician will review, this is confidential), instructions to employer (do not review completed questionnaire — submit directly to physician/PLHCP), physician/PLHCP review and recommendation section, recommendation outcomes (no limitations, use with restrictions, not medically able to use this respirator type).\n\nFormat exactly as required by 29 CFR 1910.134 Appendix C. Include instructions for both the employee completing the form and the employer administering it. Note the requirement for PLHCP (Physician or Licensed Health Care Professional) review." },
    { category: "Permits & Forms", label: "DOT Driver Qualification File Checklist", prompt: "Generate a comprehensive DOT Driver Qualification File Checklist per FMCSA 49 CFR Part 391. This checklist ensures a motor carrier has all required documents on file for each CDL driver before they operate a commercial motor vehicle. Include:\n\nDRIVER INFORMATION HEADER: Driver name, license number, state, CDL class and endorsements, DOT medical card expiration date, date of hire, driver file number.\n\nPRE-EMPLOYMENT REQUIREMENTS (checkboxes with completion dates):\n- Driver application completed per §391.21 (10-year employment history)\n- Previous employer inquiry letters sent and responses received (§391.23)\n- Motor vehicle record (MVR) requested from all states driven in past 3 years (§391.23)\n- Clearinghouse full query completed (§382.701)\n- Clearinghouse limited query consent form signed\n- Road test administered and certificate issued OR equivalent skill test accepted (§391.31)\n- Medical examiner certificate on file (§391.43)\n- Certification of violations (§391.27)\n- Annual review of MVR completed (§391.25)\n\nONGOING REQUIREMENTS:\n- Annual MVR review and certification of violations — dates for each year\n- Medical certificate renewals (2-year maximum, less if restricted)\n- Drug and alcohol testing program enrollment documentation\n- Pre-employment drug test result (negative required) (§382.301)\n- Random testing pool enrollment\n- Prior employer drug/alcohol test inquiry — 3 years (§40.25)\n- All positive test results, refusals, SAP referrals, and return-to-duty documentation\n\nTRAINING RECORDS:\n- Entry-level driver training (ELDT) certificate if applicable (§380)\n- Annual safety review documentation\n\nNOTES SECTION: Expiration date tracker for medical card, CDL, endorsements.\n\nFormat as a professional checklist with date fields for each item. Reference applicable 49 CFR Part 391 sections throughout. Include a note that driver qualification files must be retained for the duration of employment plus 3 years." },
    { category: "Permits & Forms", label: "Medical Surveillance Consent Form", prompt: "Generate a professional Medical Surveillance Authorization and Consent Form for OSHA-mandated medical surveillance programs. This form is used when an employer is required by OSHA standards to enroll employees in a medical surveillance program (e.g., 29 CFR 1910.1025 Lead, 29 CFR 1910.1028 Benzene, 29 CFR 1910.134 Respirator, 29 CFR 1910.95 Hearing Conservation, 29 CFR 1910.1001 Asbestos). Include:\n\nSECTION 1 — EMPLOYEE INFORMATION: Name, DOB, job title, department, date of hire, years at this company, specific job duties that trigger surveillance requirement.\n\nSECTION 2 — OSHA STANDARD TRIGGERING SURVEILLANCE: Checkbox list of applicable OSHA standards requiring this enrollment — Respiratory Protection (1910.134), Hearing Conservation (1910.95), Lead (1910.1025), Benzene (1910.1028), Asbestos (1910.1001), Bloodborne Pathogens (1910.1030), Cadmium (1910.1027), Hexavalent Chromium (1910.1026), Other (specify). Specific exposure description.\n\nSECTION 3 — SURVEILLANCE COMPONENTS AUTHORIZED: Biological monitoring (blood/urine), pulmonary function testing, chest X-ray, audiometric testing, physical examination, vision testing, other (specify).\n\nSECTION 4 — EMPLOYEE RIGHTS DISCLOSURE: Employee is informed they have the right to: see the results of all tests, receive a copy of the physician's written opinion, refuse participation (with explanation of any consequences), have results kept confidential from other employees.\n\nSECTION 5 — EMPLOYEE CONSENT: Employee consents to participation in the described surveillance program. Employee authorizes the examining physician to provide a written medical opinion to the employer stating only: whether the employee has any medical condition that places them at increased health risk from exposure, any recommended limitations on use of PPE, and a statement that the employee has been informed of the results. No diagnosis or specific test results are released to the employer without separate written consent.\n\nSECTION 6 — FREQUENCY ACKNOWLEDGMENT: Employee acknowledges the surveillance schedule (baseline, periodic, termination exams as required by applicable standard).\n\nSECTION 7 — SIGNATURES: Employee name, signature, date. HR/Safety representative name, signature, date. Physician PLHCP countersignature space.\n\nFormat as a professional consent form per OSHA requirements. Include a note that this form does not replace the specific medical questionnaires required by each OSHA standard." },
    { category: "Meeting Tools", label: "Safety Meeting Agenda Template", prompt: "Generate a professional Safety Meeting Agenda Template that can be reused for weekly or monthly safety meetings. Include: meeting header (date, time, location, facilitator), attendance sign-in section, review of previous meeting action items, incident/near-miss review since last meeting, main safety topic presentation section (with space for regulatory reference), open discussion/employee concerns section, new business items, action items assignment (task, responsible person, due date), next meeting date and topic preview, and facilitator/manager sign-off. Reference OSHA's recommendation for regular safety meetings as part of an effective Injury and Illness Prevention Program. Format as a reusable professional template." },
    { category: "Meeting Tools", label: "Incident Review Meeting Agenda", prompt: "Generate a professional Incident Review Meeting Agenda template used after a workplace injury, illness, or serious near miss. Include: meeting header (date, time, location, incident case number), attendees (safety manager, HR, affected department supervisor, union rep if applicable, other relevant parties), review of incident facts (who, what, when, where — factual summary only), preliminary root cause discussion (contributing factors identified so far), OSHA recordability determination status, corrective actions proposed and assigned (each with responsible person and target date), communications plan (what will be communicated to the workforce and when), follow-up schedule, open questions requiring further investigation, and action item tracker table. Include a note that this meeting is focused on prevention and corrective action — not discipline. Reference OSHA's emphasis on root cause analysis over blame. Format as a professional agenda template." },
    { category: "Meeting Tools", label: "Toolbox Talk Sign-In Sheet", prompt: "Generate a professional Toolbox Talk / Safety Meeting Sign-In Sheet template. Include: company name, location/department, date, start time, end time, topic discussed (brief description), applicable regulation or standard referenced (if any), presenter name and signature, a grid table for attendee signatures with columns for: printed name, job title, department, signature, and date, space for up to 25 attendees, section for meeting notes/key discussion points, section for questions raised by employees and answers given, section for follow-up items identified, and supervisor certification signature. Format as a clean, print-ready professional form. Include a note that completed sign-in sheets should be retained for a minimum of 3 years as part of the company's safety training records per OSHA requirements." },
    { category: "Meeting Tools", label: "Workplace Injury Debriefing Guide", prompt: "Generate a structured Workplace Injury Debriefing Guide — a facilitation tool for safety managers to use when leading a team discussion after a workplace injury or serious near miss. This is NOT a blame session — it is a structured conversation to understand what happened, what can be learned, and how to prevent recurrence. Include:\n\nOPENING SCRIPT: How to open the meeting — acknowledge the incident, establish ground rules (factual discussion, no blame, everyone's input is valued), clarify the purpose (prevention, not discipline).\n\nFACTUAL RECONSTRUCTION: Structured questions to walk through the sequence of events — what was the task, what was the environment, what happened step by step, where was each person.\n\nCONTRIBUTING FACTOR DISCUSSION: Guided questions covering equipment, environment, procedures, training, supervision, workload, time pressure, communication, and organizational factors.\n\nROOT CAUSE FACILITATION: 5 Whys exercise facilitation guide — how to lead the team through the questioning process until the root cause is identified.\n\nPREVENTION BRAINSTORM: Open question — 'What would need to be different for this to never happen again?' Capture all ideas. Prioritize by feasibility and impact.\n\nACTION ITEM ASSIGNMENT: Template for assigning each prevention action to a named person with a specific completion date.\n\nCLOSING SCRIPT: How to close the meeting — thank participants, summarize what was identified, commit to follow-up, explain how the team will be informed of outcomes.\n\nPOST-MEETING CHECKLIST: Documentation requirements, OSHA 300 log update, OSHA 301 completion, workers' comp claim status, corrective action tracking entry.\n\nFormat as a practical facilitation guide with scripts, questions, and a documenting worksheet." },
    { category: "Meeting Tools", label: "Weekly Safety Topic Brief", prompt: "Generate a Weekly Safety Topic Brief template designed for 5-10 minute toolbox talks or safety moments. Include: topic title and date, applicable OSHA/DOT regulation reference, key talking points (3-5 bullet points), real-world scenario or case study, discussion questions for the crew (2-3 questions), key takeaway message, presenter name and sign-off, and attendee sign-in section. Also provide a list of 12 suggested weekly topics with their regulatory references covering: slip/trip/fall prevention, PPE proper use, heat illness prevention, electrical safety awareness, hazard communication/SDS review, fire extinguisher use, ladder safety, manual lifting/ergonomics, housekeeping, emergency evacuation review, hand tool safety, and driving safety. Format as a professional brief template." },
    { category: "Assessments", label: "Job Hazard Analysis (JHA)", prompt: "Generate a complete Job Hazard Analysis (JHA) template and instructions. Include: job title and department, date of analysis and analyst name, required PPE, training requirements, step-by-step job breakdown column, potential hazards for each step, recommended safe procedures/controls for each hazard, risk rating matrix (severity x probability), residual risk after controls, review and approval signatures. Also include instructions on how to conduct a JHA: selecting the job, breaking the job into steps, identifying hazards, and determining preventive measures. Reference OSHA Publication 3071 (Job Hazard Analysis). Format as a professional analysis template with a completed example for a common task." },
    { category: "Assessments", label: "New Employee Safety Orientation Checklist", prompt: "Generate a comprehensive New Employee Safety Orientation Checklist. Include sections covering: company safety policy overview, emergency action plan and evacuation routes, fire prevention and extinguisher locations, first aid kit locations and procedures, reporting injuries/incidents/near-misses, hazard communication and SDS locations, PPE requirements and issuance, lockout/tagout awareness, confined space awareness, electrical safety basics, fall protection (if applicable), machine guarding, housekeeping standards, drug and alcohol policy, workplace violence prevention, driver safety (if applicable), department-specific hazards, employee rights under OSHA, how to contact safety personnel, and employee acknowledgment signature with date. Format as a professional checklist with checkboxes for each item." },
    { category: "Assessments", label: "OSHA 300 Log Recordability Audit", prompt: "Generate a comprehensive OSHA 300 Log Recordability Audit tool. This is a structured review that a safety manager uses to audit every entry on their OSHA 300 Log and verify that each case is correctly classified. Include:\n\nAUDIT HEADER: Company name, establishment address, audit date, auditor name, log year being reviewed, total number of entries on log.\n\nCASE-BY-CASE REVIEW CHECKLIST: For each case on the log, the auditor evaluates:\n- Work-relatedness determination: Was the injury/illness work-related per 29 CFR 1904.5? (List all work-relatedness exceptions — pre-existing conditions, personal tasks, mental illness without diagnosis, common cold/flu, etc.)\n- Recordability determination: Does the case meet one of the recording criteria per 29 CFR 1904.7? (Medical treatment beyond first aid, days away from work, restricted work, job transfer, loss of consciousness, diagnosis of significant illness/injury by HLCP)\n- Correct column checked: Injury vs. illness type (skin disorder, respiratory condition, poisoning, hearing loss, all other illnesses)\n- Days away from work: Correctly counted per 1904.7(b)(3)?\n- Restricted work days: Correctly counted per 1904.7(b)(4)?\n- Privacy protection: Was privacy case protection applied where required per 1904.29?\n- OSHA 301 on file: Is the corresponding incident report completed?\n\nCOMPUTATION VERIFICATION: TRIR formula and calculation check, DART rate formula and calculation check, hours worked verification.\n\n300A SUMMARY REVIEW: Correct dates posted (Feb 1 – Apr 30), executive signature present, establishment information complete, injury and illness totals match 300 Log.\n\nELECTRONIC SUBMISSION STATUS: Does the establishment meet the 300A electronic submission requirement per 1904.41? Submission deadline and completion status.\n\nAUDIT FINDINGS SUMMARY: Cases requiring correction, cases requiring reclassification, cases to be removed (not recordable), missing documentation, corrections made.\n\nFormat as a professional audit tool with a case-by-case review table and summary findings section. Reference 29 CFR 1904 throughout." },
    { category: "Assessments", label: "Safety Program Gap Assessment", prompt: "Generate a comprehensive Safety Program Gap Assessment tool — a structured self-assessment an employer uses to evaluate their current safety and health management system against OSHA's recommended practices and key regulatory requirements. Organized into the following domains:\n\n1. MANAGEMENT LEADERSHIP (20 points): Written safety policy signed by top management, safety goals and objectives established and tracked, safety performance included in management reviews, resources (budget, personnel, time) allocated to safety, safety integrated into business operations.\n\n2. WORKER PARTICIPATION (15 points): Employees involved in hazard identification, incident investigations, and safety committee, anonymous reporting mechanism available, employee safety concerns documented and responded to, employees trained on their rights under OSH Act Section 11(c).\n\n3. HAZARD IDENTIFICATION & ASSESSMENT (25 points): Regular workplace inspections conducted, job hazard analyses completed for high-risk tasks, incident and near miss investigations completed with root cause analysis, leading and lagging indicators tracked, change management process for new equipment/processes/chemicals.\n\n4. HAZARD PREVENTION & CONTROL (25 points): Hierarchy of controls applied (elimination → substitution → engineering → administrative → PPE), written programs in place for all applicable OSHA standards, PPE hazard assessment certified, emergency action plan current and tested, preventive maintenance program operational.\n\n5. EDUCATION & TRAINING (15 points): New employee orientation completed, job-specific safety training documented, OSHA-required training current for all applicable standards, supervisor reasonable suspicion training completed, training records maintained.\n\n6. PROGRAM EVALUATION & IMPROVEMENT (10 points): Annual safety program review conducted, OSHA 300 Log trends analyzed, corrective actions tracked to completion, safety program improvements documented.\n\nSCORING: Each element scored 0 (not in place), 1 (partially in place), or 2 (fully in place). Total score with gap categories: 90-100 = Strong, 70-89 = Developing, 50-69 = Needs Improvement, Below 50 = Significant Gaps.\n\nACTION PLAN SECTION: Top 5 priority gaps identified, corrective actions, responsible person, target date.\n\nFormat as a professional self-assessment tool. Reference OSHA's Recommended Practices for Safety and Health Programs (2016)." },
    { category: "Assessments", label: "DOT Compliance Self-Assessment", prompt: "Generate a comprehensive DOT/FMCSA Compliance Self-Assessment for motor carriers subject to 49 CFR Parts 380-399. This is the checklist a safety director uses to prepare for a DOT compliance review (audit). Organized by regulatory area:\n\n1. DRIVER QUALIFICATION FILES (49 CFR Part 391): Driver application on file, MVR obtained from all states, road test or equivalent, medical examiner certificate current, Clearinghouse enrollment and query documentation, certification of violations, annual review completed.\n\n2. DRUG & ALCOHOL TESTING PROGRAM (49 CFR Part 382 / 49 CFR Part 40): Written D&A policy in place, pre-employment testing (negative result on file before drive), random program — enrolled in consortium or operating own pool, random rate compliance (50% drugs, 10% alcohol current rates), post-accident testing procedures documented, reasonable suspicion supervisor training (60 min drug + 60 min alcohol), return-to-duty and follow-up testing documented, Clearinghouse reporting current.\n\n3. HOURS OF SERVICE (49 CFR Part 395): ELD mandate compliance (approved ELD in use), 60/7 or 70/8 cycle used, HOS records retained 6 months, driver recap/off-duty documentation.\n\n4. VEHICLE INSPECTION & MAINTENANCE (49 CFR Part 396): Pre-trip and post-trip inspection reports completed daily, DVIR (Driver Vehicle Inspection Report) process in place, defects noted and repaired before operation, preventive maintenance schedule in use, maintenance records retained 1 year.\n\n5. HAZARDOUS MATERIALS (49 CFR Parts 171-180, if applicable): Hazmat training current, shipping papers correct, placarding correct, packaging compliant, emergency response information on file.\n\n6. FINANCIAL RESPONSIBILITY (49 CFR Part 387): Operating authority current (MC number), BOC-3 process agent on file, insurance minimums met (MCS-90 endorsement).\n\n7. ACCIDENT REGISTER (49 CFR Part 390): Accident register maintained for 3 years, all DOT-reportable accidents recorded (fatality, injury, or tow-away).\n\nSCORING: Each item rated Compliant / Non-Compliant / N/A. Non-compliant items auto-escalate to action plan.\n\nFormat as a professional self-assessment. Reference applicable 49 CFR sections throughout. Note that this tool mirrors the areas reviewed during an FMCSA compliance review (audit)." },
    { category: "Assessments", label: "Drug Testing Program Compliance Audit", prompt: "Generate a Drug Testing Program Compliance Audit checklist for employers — covering both DOT-regulated programs (49 CFR Part 40) and non-DOT workplace drug-free programs. Include separate sections for each:\n\nPART 1 — DOT-REGULATED PROGRAM AUDIT (49 CFR Part 382 / Part 40):\nPOLICY: Written policy addresses all 5 testing circumstances (pre-employment, random, reasonable suspicion, post-accident, return-to-duty/follow-up), policy distributed to all covered employees, policy acknowledgment signatures on file.\nTESTING RATES: Current calendar year random testing rate at or above required minimums (50% for drugs, 10% for alcohol — verify current FMCSA-specified rate), random selections made by scientifically valid random process, selection records retained.\nCOLLECTION SITES: Using HHS-certified laboratory, using qualified collector, using approved chain-of-custody forms (CCF), collection site uses split specimen collection.\nMRO: Using qualified Medical Review Officer, MRO reviews all non-negative results, cancelled tests documented.\nSAP PROCESS: SAP referrals made for all violations, SAP is qualified and on the DOT SAP list, return-to-duty and follow-up testing plan obtained from SAP.\nCLEARINGHOUSE: Registered as employer, conducting annual limited queries, full queries for new hires, reporting violations within required timeframe.\nRECORDS: All required records retained per 49 CFR Part 382.401 retention schedule (5 years for positives/refusals, 2 years for negatives, 1 year for calibration records).\n\nPART 2 — NON-DOT WORKPLACE PROGRAM AUDIT:\nPOLICY: Written policy covers all substances and testing circumstances, defines 'reasonable suspicion,' addresses prescription medication disclosure, consequences clearly stated.\nTESTING: Using certified collection sites, SAMHSA-certified laboratory for confirmation, split specimen or retest option available.\nSUPERVISOR TRAINING: Reasonable suspicion training completed and documented for all supervisors.\nCONFIDENTIALITY: Test results disclosed only on need-to-know basis, records kept separately from personnel files.\nSTATE LAW COMPLIANCE: State-specific marijuana/cannabis laws reviewed, state drug testing law requirements met (varies by state).\n\nFormat as a professional audit checklist with compliance ratings and action plan section. Reference applicable CFR sections throughout." },
    { category: "Assessments", label: "PPE Hazard Assessment", prompt: "Generate a complete PPE Hazard Assessment template per OSHA 29 CFR 1910.132. Include: workplace/job area identification, assessment date and certifying person, survey of workplace for hazards (impact, penetration, compression, chemical, heat, harmful dust, light/radiation, electrical, fall, noise), hazard sources identified by body area (head, eyes/face, hands, feet, body, hearing, respiratory), PPE selection for each identified hazard with specific standards referenced (ANSI Z87.1 for eye, ANSI Z89.1 for head, ASTM F2412/F2413 for foot, etc.), certification statement that the workplace hazard assessment has been performed per 29 CFR 1910.132(d)(2), employee training documentation, and periodic reassessment schedule. Format as a professional assessment form." },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <PwaInstallBanner onInstallClick={isInstallable ? promptInstall : undefined} />
      <header className="border-b border-white/10 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              data-testid="button-toggle-sidebar"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/25">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-black text-white tracking-tight">COREY</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {usageData && !usageData.isPro && (
              <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 text-xs" data-testid="badge-corey-usage">
                {usageData.questionCount}/{usageData.freeLimit} free
              </Badge>
            )}
            {usageData?.isPro && (
              <Badge className="bg-accent/20 text-accent border-accent/30 text-xs" data-testid="badge-corey-unlimited">
                Unlimited
              </Badge>
            )}
            {isInstallable && !isInstalled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={promptInstall}
                className="text-accent hover:bg-accent/10 text-xs gap-1"
                data-testid="button-pwa-install-app"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </Button>
            )}
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-xs" data-testid="link-cch-platform">
                ← Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && (
          <div className="absolute inset-0 z-40 lg:hidden bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`
          absolute lg:relative z-50 lg:z-auto
          w-64 h-full flex-shrink-0
          bg-slate-900 border-r border-white/10
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-3 border-b border-white/10">
            <Button onClick={handleNewChat} variant="outline" className="w-full justify-start gap-2 border-slate-500 bg-slate-800 text-white hover:bg-slate-700" data-testid="button-new-chat">
              <Plus className="w-4 h-4" /> New Question
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2" style={{ height: 'calc(100% - 56px)' }}>
            <div className="space-y-1">
              {conversations?.map((conv: any) => (
                <div key={conv.id} className="group relative">
                  {renamingId === conv.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleRenameConversation(conv.id); }}
                      className="flex gap-1 px-1"
                    >
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-7 text-xs bg-white/10 border-white/20 text-white"
                        autoFocus
                        onBlur={() => setRenamingId(null)}
                        data-testid={`input-rename-${conv.id}`}
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors pr-8 ${
                        activeConversationId === conv.id
                          ? "bg-accent/20 text-accent font-medium"
                          : "text-white/70 hover:bg-white/10 hover:text-white/90"
                      }`}
                      data-testid={`button-conversation-${conv.id}`}
                    >
                      {conv.title}
                    </button>
                  )}
                  {renamingId !== conv.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-opacity"
                          data-testid={`button-conversation-menu-${conv.id}`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => { setRenamingId(conv.id); setRenameValue(conv.title); }}
                          data-testid={`menu-rename-${conv.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteConversation(conv.id)}
                          className="text-red-400 focus:text-red-400"
                          data-testid={`menu-delete-${conv.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {usageData && !usageData.canAsk && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6">
              <Card className="max-w-lg w-full p-8 text-center space-y-4 bg-slate-900 border-white/10 shadow-2xl" data-testid="card-corey-limit">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white">Monthly Limit Reached</h3>
                <p className="text-white/60">
                  Upgrade to Unlimited for unlimited Corey interactions, audit prep tools, and dedicated support.
                </p>
                <Link href="/settings">
                  <Button className="w-full bg-accent hover:bg-accent/90 mt-2" data-testid="button-corey-upgrade">
                    Unlimited Safety - $99/mo
                  </Button>
                </Link>
              </Card>
            </div>
          )}

          {activeConversationId ? (
            <CoreyChatInterface
              conversationId={activeConversationId}
              onMessageSent={() => refetchUsage()}
              documentTemplates={DOCUMENT_TEMPLATES}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center text-white/40 p-6 text-center overflow-y-auto pt-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-accent/60" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">Ask Corey Anything</h3>
              <p className="text-sm max-w-md mb-6">OSHA recordkeeping, DOT physicals, drug testing, respirator compliance — get instant, regulation-backed answers.</p>

              <div className="w-full max-w-2xl mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.openTopicPicker) {
                          setTopicPickerMode(action.openTopicPicker);
                          setCustomTopicMode(false);
                          setCustomTopicValue("");
                          setTopicPickerOpen(true);
                          return;
                        }
                        createConversation(action.title, {
                          onSuccess: (data) => {
                            setActiveConversationId(data.id);
                            setTimeout(() => {
                              window.dispatchEvent(new CustomEvent("corey-auto-send", { detail: { prompt: action.prompt } }));
                            }, 300);
                          },
                        });
                      }}
                      className="flex flex-col items-start gap-2 p-4 rounded-lg bg-white/5 border border-white/10 text-left transition-colors hover:bg-white/10 hover:border-white/20"
                      data-testid={`quick-action-${action.id}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                        <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                      <span className="text-sm font-medium text-white/80">{action.title}</span>
                      <span className="text-xs text-white/40 leading-relaxed">{action.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleNewChat} className="bg-accent hover:bg-accent/90 mb-8" data-testid="button-start-first-chat">
                <Plus className="w-4 h-4 mr-2" /> Start a Conversation
              </Button>

              {/* Documents Panel */}
              <div className="w-full max-w-2xl" data-testid="documents-panel">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <h4 className="text-sm font-semibold text-white/80">Generate a Document</h4>
                  <span className="text-xs text-white/30">— click any document to generate instantly</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  {["Policies & Programs", "Permits & Forms", "Meeting Tools", "Assessments"].map((cat, catIdx) => {
                    const items = DOCUMENT_TEMPLATES.filter(t => t.category === cat);
                    if (items.length === 0) return null;
                    const catColors: Record<string, string> = {
                      "Policies & Programs": "text-blue-400",
                      "Permits & Forms": "text-amber-400",
                      "Meeting Tools": "text-green-400",
                      "Assessments": "text-purple-400",
                    };
                    return (
                      <div key={cat} className={catIdx > 0 ? "border-t border-white/10" : ""}>
                        <div className="px-4 py-2 bg-white/5">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${catColors[cat] || "text-white/50"}`}>{cat}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                          {items.map((tmpl) => {
                            const globalIdx = DOCUMENT_TEMPLATES.indexOf(tmpl);
                            return (
                              <button
                                key={globalIdx}
                                onClick={() => {
                                  createConversation(tmpl.label, {
                                    onSuccess: (data) => {
                                      setActiveConversationId(data.id);
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent("corey-auto-send", { detail: { prompt: tmpl.prompt } }));
                                      }, 300);
                                    },
                                  });
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 group"
                                data-testid={`doc-panel-${globalIdx}`}
                              >
                                <FileText className="w-3.5 h-3.5 text-white/30 group-hover:text-accent shrink-0 transition-colors" />
                                <span className="text-sm text-white/70 group-hover:text-white transition-colors">{tmpl.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={topicPickerOpen} onOpenChange={setTopicPickerOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {topicPickerMode === "meeting" ? "Choose a Safety Meeting Topic" : "Choose a Weekly Safety Topic"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {topicPickerMode === "meeting"
                ? "Select a topic and Corey will build a full safety meeting agenda with discussion questions, scenarios, and action items."
                : "Select a topic and Corey will generate a ready-to-present 5-minute safety talk with regulatory references."}
            </DialogDescription>
          </DialogHeader>
          {customTopicMode ? (
            <div className="space-y-3 py-2">
              <Input
                value={customTopicValue}
                onChange={(e) => setCustomTopicValue(e.target.value)}
                placeholder="Type your safety topic here..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-accent/50"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTopicValue.trim()) {
                    handleTopicSelect(customTopicValue.trim());
                  }
                }}
                data-testid="input-custom-topic"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (customTopicValue.trim()) handleTopicSelect(customTopicValue.trim());
                  }}
                  disabled={!customTopicValue.trim()}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white"
                  data-testid="button-submit-custom-topic"
                >
                  Go
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setCustomTopicMode(false); setCustomTopicValue(""); }}
                  className="border-white/20 text-white"
                  data-testid="button-back-to-topics"
                >
                  Back to List
                </Button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setCustomTopicMode(true)}
                className="w-full text-left px-4 py-3 rounded-lg bg-accent/10 border border-accent/30 text-sm text-accent font-semibold transition-colors hover:bg-accent/20"
                data-testid="button-custom-topic"
              >
                I'll Pick My Own Topic
              </button>
              <ScrollArea className="max-h-[45vh] pr-2">
                <div className="grid grid-cols-1 gap-2 py-2">
                  {SAFETY_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleTopicSelect(topic)}
                      className="w-full text-left px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 transition-colors hover:bg-accent/10 hover:border-accent/30 hover:text-white"
                      data-testid={`topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      <FloatingMicButton
        activeConversationId={activeConversationId}
        isStreaming={false}
      />
    </div>
  );
}

function FloatingMicButton({ activeConversationId, isStreaming }: { activeConversationId: number | null; isStreaming: boolean }) {
  const { isListening, speechSupported, toggleListening } = useSpeechRecognition((transcript: string) => {
    window.dispatchEvent(new CustomEvent("corey-floating-mic", { detail: { transcript } }));
  });

  if (!speechSupported || !activeConversationId) return null;

  return (
    <button
      onClick={toggleListening}
      disabled={isStreaming}
      className={`fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
        isListening
          ? "bg-accent shadow-accent/40 animate-pulse"
          : "bg-slate-800 border border-white/20 shadow-black/40"
      }`}
      data-testid="button-floating-mic"
    >
      {isListening ? (
        <MicOff className="w-6 h-6 text-white" />
      ) : (
        <Mic className="w-6 h-6 text-white/70" />
      )}
    </button>
  );
}

interface DocumentTemplate {
  category: string;
  label: string;
  prompt: string;
}

function CoreyChatInterface({
  conversationId,
  onMessageSent,
  documentTemplates
}: {
  conversationId: number;
  onMessageSent?: () => void;
  documentTemplates?: DocumentTemplate[];
}) {
  const { messages, sendMessage, isStreaming, limitReached } = useChatStream(conversationId, onMessageSent);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const { toast } = useToast();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { isListening, speechSupported, toggleListening, stopListening } = useSpeechRecognition((transcript: string) => {
    setInput(transcript);
  });

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

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.prompt) {
        userScrolledUp.current = false;
        sendMessage(detail.prompt);
        if (onMessageSent) setTimeout(() => onMessageSent(), 500);
      }
    };
    window.addEventListener("corey-auto-send", handler);
    return () => window.removeEventListener("corey-auto-send", handler);
  }, [sendMessage, onMessageSent]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.transcript) {
        setInput(detail.transcript);
      }
    };
    window.addEventListener("corey-floating-mic", handler);
    return () => window.removeEventListener("corey-floating-mic", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || limitReached) return;
    if (isListening) {
      stopListening();
    }
    userScrolledUp.current = false;
    sendMessage(input);
    setInput("");
    if (onMessageSent) {
      setTimeout(() => onMessageSent(), 500);
    }
  };

  const formatConversationText = useCallback(() => {
    return messages.map((msg) => {
      const role = msg.role === "user" ? "You" : "Corey";
      return `${role}:\n${msg.content}\n`;
    }).join("\n---\n\n");
  }, [messages]);

  const handleCopyConversation = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatConversationText());
      toast({ title: "Conversation copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [formatConversationText, toast]);

  const handleDownloadText = useCallback(() => {
    const text = `COREY — AI Compliance Expert\nCore Compliance Hub\nGenerated: ${new Date().toLocaleDateString()}\n${"=".repeat(50)}\n\n${formatConversationText()}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corey-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Conversation downloaded" });
  }, [formatConversationText, toast]);

  const handleDownloadDocument = useCallback(() => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMsg) {
      toast({ title: "No document to download", variant: "destructive" });
      return;
    }

    const cleanText = sanitizeForPdf(stripMarkdown(lastAssistantMsg.content));
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const usableWidth = pageWidth - margin * 2;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const logoHeight = 18;
      const logoWidth = (img.width / img.height) * logoHeight;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(img, 'PNG', logoX, 10, logoWidth, logoHeight);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('Core Compliance Hub', pageWidth / 2, 32, { align: 'center' });
      doc.text(`Document Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: 'center' });

      doc.setDrawColor(200, 160, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, 40, pageWidth - margin, 40);

      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(cleanText, usableWidth);
      let y = 48;
      const pageHeight = doc.internal.pageSize.getHeight();

      for (const line of lines) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }
        const trimmed = line.trim();
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && /[A-Z]/.test(trimmed)) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          y += 3;
          doc.text(trimmed, margin, y);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          y += 7;
        } else {
          doc.text(line, margin, y);
          y += 6;
        }
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          'Generated by Corey — Core Compliance Hub | corecompliancehub.com',
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      doc.save(`corey-document-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF document downloaded" });
    };
    img.onerror = () => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COREY — AI Compliance Expert', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Core Compliance Hub', pageWidth / 2, 27, { align: 'center' });
      doc.text(`Document Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });

      doc.setDrawColor(200, 160, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, 36, pageWidth - margin, 36);

      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(cleanText, usableWidth);
      let y = 44;
      const pageHeight = doc.internal.pageSize.getHeight();
      for (const line of lines) {
        if (y > pageHeight - 25) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      }
      doc.save(`corey-document-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF document downloaded" });
    };
    img.src = logoUrl;
  }, [messages, toast]);

  const handleEmailConversation = useCallback(async () => {
    if (!emailTo.trim()) return;
    const subject = encodeURIComponent("Corey Compliance Consultation — Core Compliance Hub");
    const body = encodeURIComponent(formatConversationText());
    window.open(`mailto:${emailTo.trim()}?subject=${subject}&body=${body}`, "_blank");
    setShowShareDialog(false);
    setEmailTo("");
    toast({ title: "Email client opened" });
  }, [emailTo, formatConversationText, toast]);

  const handleCopyLastResponse = useCallback(async () => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMsg) return;
    try {
      await navigator.clipboard.writeText(lastAssistantMsg.content);
      toast({ title: "Response copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [messages, toast]);

  const handlePrintConversation = useCallback(() => {
    const printContent = messages.map((msg) => {
      const role = msg.role === "user" ? "You" : "Corey";
      return `<div style="margin-bottom:20px;">
        <div style="font-weight:bold;color:${msg.role === 'user' ? '#3b82f6' : '#f59e0b'};margin-bottom:4px;font-size:14px;">${role}</div>
        <div style="white-space:pre-wrap;font-size:13px;line-height:1.6;color:#333;">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>`;
    }).join('<hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;">');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Please allow pop-ups to print", variant: "destructive" });
      return;
    }
    printWindow.document.write(`
      <html><head><title>Corey — Compliance Consultation</title>
      <style>@media print { body { margin: 20px; } }</style></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:30px;">
        <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #f59e0b;padding-bottom:16px;">
          <h1 style="margin:0;font-size:22px;color:#0f172a;">COREY — AI Compliance Expert</h1>
          <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Core Compliance Hub | ${new Date().toLocaleDateString()}</p>
        </div>
        ${printContent}
        <div style="margin-top:30px;padding-top:16px;border-top:2px solid #f59e0b;text-align:center;font-size:11px;color:#94a3b8;">
          Generated by Corey — Core Compliance Hub | corecompliancehub.com
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [messages, toast]);

  const handleSpeak = useCallback((text: string, msgIdx: number) => {
    if (!('speechSynthesis' in window)) {
      toast({ title: "Text-to-speech is not supported in this browser", variant: "destructive" });
      return;
    }

    if (speakingMsgIdx === msgIdx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      speechSynthRef.current = null;
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoiceNames = [
      'Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Rishi',
      'Google UK English Female', 'Google UK English Male',
      'Google US English', 'Microsoft Aria', 'Microsoft Guy',
      'Microsoft Jenny', 'Microsoft Davis', 'Microsoft Sara',
      'English (America)+Aria', 'en-US-AriaNeural', 'en-US-JennyNeural',
    ];
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferred = enVoices.find(v => naturalVoiceNames.some(n => v.name.includes(n)))
      || enVoices.find(v => v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium'))
      || enVoices.find(v => v.name.includes('Google'))
      || enVoices.find(v => v.name.includes('Microsoft'))
      || enVoices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      setSpeakingMsgIdx(null);
      speechSynthRef.current = null;
    };
    utterance.onerror = () => {
      setSpeakingMsgIdx(null);
      speechSynthRef.current = null;
    };

    speechSynthRef.current = utterance;
    setSpeakingMsgIdx(msgIdx);
    window.speechSynthesis.speak(utterance);
  }, [speakingMsgIdx, toast]);

  const handleStopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeakingMsgIdx(null);
    speechSynthRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <>
      {messages.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrintConversation}
              className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
              data-testid="button-print-conversation"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            {speakingMsgIdx !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopSpeaking}
                className="text-accent hover:text-accent/80 hover:bg-accent/10 gap-1.5 text-xs"
                data-testid="button-stop-all-speaking"
              >
                <Square className="w-3 h-3 fill-current" /> Stop Reading
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-xs" data-testid="button-share-menu">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={handleCopyConversation} data-testid="menu-copy-conversation">
                  <ClipboardCopy className="w-3.5 h-3.5 mr-2" /> Copy Conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLastResponse} data-testid="menu-copy-last-response">
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copy Last Response
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowShareDialog(true)} data-testid="menu-email-conversation">
                  <Mail className="w-3.5 h-3.5 mr-2" /> Email / Forward
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadText} data-testid="menu-download-conversation">
                  <FileDown className="w-3.5 h-3.5 mr-2" /> Download Conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadDocument} data-testid="menu-download-document">
                  <FileText className="w-3.5 h-3.5 mr-2" /> Download as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {documentTemplates && documentTemplates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-xs" data-testid="button-generate-doc-inline">
                  <FileText className="w-3.5 h-3.5" /> Generate Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
                {["Policies & Programs", "Permits & Forms", "Meeting Tools", "Assessments"].map((cat, catIdx) => {
                  const items = (documentTemplates || []).filter(t => t.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <DropdownMenuGroup key={cat}>
                      {catIdx > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs text-white/50">{cat}</DropdownMenuLabel>
                      {items.map((tmpl) => {
                        const globalIdx = (documentTemplates || []).indexOf(tmpl);
                        return (
                          <DropdownMenuItem
                            key={globalIdx}
                            onClick={() => {
                              userScrolledUp.current = false;
                              sendMessage(tmpl.prompt);
                              if (onMessageSent) setTimeout(() => onMessageSent(), 500);
                            }}
                            data-testid={`menu-inline-doc-${globalIdx}`}
                          >
                            <FileText className="w-3.5 h-3.5 mr-2 text-accent" />
                            {tmpl.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Conversation</DialogTitle>
            <DialogDescription>Enter the email address to forward this conversation to.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="email@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              type="email"
              data-testid="input-email-forward"
            />
            <Button onClick={handleEmailConversation} disabled={!emailTo.trim()} data-testid="button-send-email">
              <Mail className="w-4 h-4 mr-2" /> Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-accent/60" />
              </div>
              <h3 className="text-white/80 font-medium mb-2">How can I help you today?</h3>
              <p className="text-white/60 text-sm max-w-md mx-auto">Ask about OSHA recordability, DOT compliance, drug testing protocols, or any workplace safety question.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["Is this injury recordable?", "DOT physical requirements", "Random drug testing rules", "Respirator fit testing", "Write me a Drug & Alcohol Policy"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-full bg-slate-700 border border-slate-500 text-white text-xs hover:bg-slate-600 transition-colors"
                    data-testid={`button-suggestion-${q.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                ${msg.role === 'user' ? 'bg-primary/80' : 'bg-gradient-to-br from-accent/30 to-primary/30'}
              `}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-accent" />}
              </div>
              <div className="group relative">
                <div className={`
                  rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] md:max-w-[75%]
                  ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-slate-700 text-white border border-slate-600 rounded-tl-sm'}
                `}>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content ? stripMarkdown(msg.content) : (isStreaming && idx === messages.length - 1 ? (
                      <span className="flex items-center gap-2 text-white/60">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                        Thinking...
                      </span>
                    ) : "")}
                  </div>
                </div>
                {msg.role === "assistant" && msg.content && !isStreaming && (
                  <div className="mt-1.5 ml-2 flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(msg.content);
                          toast({ title: "Copied" });
                        } catch {}
                      }}
                      className="text-white/60 hover:text-white flex items-center gap-1 text-xs"
                      data-testid={`button-copy-msg-${idx}`}
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.content, idx)}
                      className={`flex items-center gap-1 text-xs ${speakingMsgIdx === idx ? 'text-accent' : 'text-white/60 hover:text-white'}`}
                      data-testid={`button-speak-msg-${idx}`}
                    >
                      {speakingMsgIdx === idx ? (
                        <><VolumeX className="w-3 h-3" /> Stop</>
                      ) : (
                        <><Volume2 className="w-3 h-3" /> Listen</>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadDocument}
                      className="text-white/60 hover:text-white flex items-center gap-1 text-xs"
                      data-testid={`button-pdf-msg-${idx}`}
                    >
                      <FileDown className="w-3 h-3" /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-950/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 items-end">
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder={limitReached ? "Free limit reached — upgrade for unlimited access" : isListening ? "Listening... click mic to stop" : "Ask Corey a compliance question..."}
              className={`pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-accent/50 resize-none max-h-[130px] overflow-y-auto ${isListening ? "border-accent ring-2 ring-accent/20" : ""}`}
              rows={2}
              disabled={isStreaming || limitReached}
              data-testid="input-corey-message"
            />
            {speechSupported && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                disabled={isStreaming || limitReached}
                className={`absolute right-1 bottom-2 ${isListening ? "text-accent" : "text-white/40 hover:text-white/70"}`}
                data-testid="button-corey-voice"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || limitReached || !input.trim()}
            className="bg-accent hover:bg-accent/90 mb-0.5"
            data-testid="button-corey-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {isListening && (
          <p className="text-xs text-accent text-center mt-2 animate-pulse">
            Listening... take your time. Click the mic to stop.
          </p>
        )}
      </div>
    </>
  );
}
