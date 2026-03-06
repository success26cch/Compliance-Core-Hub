import { useState, useRef, useEffect, FormEvent, ReactNode } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useIsaConversations, useCreateIsaConversation, useIsaChatStream } from "@/hooks/use-isa-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Send, Lock, Sparkles, ChevronRight, Award,
  ClipboardCheck, FileSearch, BookOpen, Shield, Layers,
  CheckCircle2, MessageSquare, Zap, Star, Activity,
  AlertTriangle, Menu, FileText, Car, Vault,
  Building2, Users, Factory, ArrowRight, ArrowLeft,
  X, Tag, Target, MapPin, Trash2, FolderOpen, RotateCcw,
  Mail, BarChart2, GraduationCap,
} from "lucide-react";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import { apiRequest } from "@/lib/queryClient";
import type { IsoProject } from "@shared/schema";
import { NonconformanceManager } from "./NonconformanceManager";
import { DocumentationModule } from "./DocumentationModule";

const ISA_STANDARDS = [
  { code: "9001", label: "Quality" },
  { code: "14001", label: "Environmental" },
  { code: "45001", label: "OH&S" },
  { code: "13485", label: "Medical" },
  { code: "27001", label: "InfoSec" },
  { code: "AS9100", label: "Aerospace" },
  { code: "IATF", label: "Automotive" },
];

const ISA_TIER_STANDARDS = {
  essentials: ["9001", "14001", "45001"],
  professional: ["9001", "14001", "45001", "13485", "27001", "AS9100", "IATF"],
};

const QUICK_PROMPTS = [
  { icon: FileSearch, label: "Gap Analysis", prompt: "I need a gap analysis for ISO 9001:2015. Walk me through each clause and ask me questions to assess my current state." },
  { icon: ClipboardCheck, label: "Audit Readiness", prompt: "Help me prepare for an upcoming ISO certification audit. What should I have ready and what are the most common nonconformances?" },
  { icon: BookOpen, label: "Document Library", prompt: "What documented information does ISO 9001:2015 require me to maintain and retain? Help me build a prioritized list of documents to create first." },
  { icon: Shield, label: "NC/CAPA Guidance", prompt: "I need to respond to a nonconformance finding. Walk me through 8D or PDCA methodology for root cause analysis and corrective action." },
  { icon: AlertTriangle, label: "Risk Assessment", prompt: "Walk me through how to identify, analyze, and treat risks and opportunities per ISO 9001:2015 Clause 6.1. What evidence do I need for an auditor?" },
  { icon: Layers, label: "Management Review", prompt: "Help me prepare for my next management review meeting. What inputs does ISO require and what should the documented output include?" },
];

const ISA_CAPABILITIES = [
  "Clause-by-clause gap analysis",
  "NC & CAPA module (log & track NCs)",
  "Documentation library (build & manage docs)",
  "Internal audit checklists & prep",
  "Corrective action & root cause guidance",
  "Management review meeting prep",
];

const ISA_PRO_CAPABILITIES = [
  "Everything in Isa Core",
  "IATF 16949 internal auditing",
  "ISO 13485 medical device guidance",
  "ISO/IEC 27001 InfoSec advisory",
  "AS9100 aerospace auditing",
  "Second-party & supplier audit support",
];

const ISO_CORE_CAPABILITIES = [
  "Pick 1 standard: 9001, 14001, or 45001",
  "Isa AI coaching (clause-by-clause)",
  "Documentation Library (Quality Manual, Procedures, WIs)",
  "NC & CAPA Management module",
  "Risk Assessment module (coming soon)",
  "Knowledge Architecture setup included",
];

const ISO_INTEGRATED_CAPABILITIES = [
  "All 3 core standards: 9001 + 14001 + 45001",
  "Isa AI across all 3 standards",
  "Full Documentation Library + NC/CAPA",
  "Risk Assessment + Management Review modules",
  "Cross-standard Integrated Management System",
  "Knowledge Architecture setup included",
];

const ISO_SPECIALIST_CAPABILITIES = [
  "Pick 1: IATF 16949, AS9100, or ISO 13485",
  "Isa Pro AI for your chosen standard",
  "Full module suite: Docs, NC/CAPA, Audits",
  "Industry-specific process mapping",
  "Second-party audit support",
  "Knowledge Architecture setup included",
];

const ISO_PRO_CAPABILITIES = [
  "9001 + 14001 + 45001 + 1 Specialist standard",
  "Isa Pro across all standards",
  "All 8 platform modules (full suite)",
  "Communication + Training + M&M modules",
  "KPI tracking & audit evidence management",
  "Priority ACSI consulting access",
];

/* ─── ISO TIER CARD ───────────────────────────────────── */
function ISOTierCard({
  "data-testid": testId, delay, badge, title, subtitle, price, annual, setup,
  capabilities, cardClass, topBarClass, capIconClass, picker, badges, coreBadges, dark, cta,
}: {
  "data-testid": string;
  delay: number;
  badge: string;
  title: string;
  subtitle: string;
  price: string;
  annual: string;
  setup: string;
  capabilities: string[];
  cardClass: string;
  topBarClass: string;
  capIconClass: string;
  picker?: { options: string[]; label: string };
  badges?: string[];
  coreBadges?: string[];
  dark?: boolean;
  cta: { label: string; href: string; testId: string; style: "accent" | "primary"; external?: boolean };
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const textBase = dark ? "text-white" : "text-primary";
  const textMuted = dark ? "text-white/60" : "text-muted-foreground";
  const borderMuted = dark ? "border-white/15" : "border-border/60";
  const badgeBg = dark ? "bg-white/10 text-white/80 border-white/20" : "bg-muted text-primary border-border/60";
  const selectedBg = dark ? "bg-accent/20 text-accent border-accent/40" : "bg-accent text-white border-accent";
  const unselectedBg = dark ? "bg-white/5 text-white/70 border-white/20 hover:border-accent/40" : "bg-muted/40 text-primary border-border/60 hover:border-accent/40 hover:bg-accent/5";

  const ctaClass = cta.style === "accent"
    ? "w-full bg-accent hover:bg-accent/90 text-white font-bold"
    : "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold";

  const ctaEl = cta.external ? (
    <a href={cta.href}>
      <Button size="sm" className={ctaClass} data-testid={cta.testId}>{cta.label}</Button>
    </a>
  ) : (
    <Link href={cta.href}>
      <Button size="sm" className={ctaClass} data-testid={cta.testId}>{cta.label}</Button>
    </Link>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="h-full">
      <Card className={`h-full p-5 hover:shadow-lg transition-all relative overflow-hidden flex flex-col ${cardClass}`} data-testid={testId}>
        <div className={`absolute top-0 inset-x-0 h-1 rounded-t ${topBarClass}`} />
        <div className="absolute top-3 right-3">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${dark ? "bg-accent text-white" : "bg-accent/10 text-accent border border-accent/30"}`}>{badge}</span>
        </div>

        <div className="mb-4 pr-20">
          <p className={`font-black leading-tight text-sm ${textBase}`}>{title}</p>
          <p className="text-[10px] text-accent font-semibold mt-0.5">{subtitle}</p>
        </div>

        <div className={`mb-4 pb-3 border-b ${borderMuted}`}>
          <div className="flex items-baseline gap-1">
            <p className={`font-black text-accent text-3xl leading-none`}>{price}</p>
            <span className={`text-sm font-medium ${textMuted}`}>/mo</span>
          </div>
          <p className={`text-xs mt-0.5 ${textMuted}`}>{annual}</p>
          <p className={`text-[10px] font-semibold mt-1 ${dark ? "text-white/50" : "text-muted-foreground"}`}>{setup}</p>
        </div>

        {/* Fixed badges (Integrated — all 3 included) */}
        {badges && (
          <div className="mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${textMuted}`}>Standards Included</p>
            <div className="flex flex-wrap gap-1">
              {badges.map(s => (
                <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeBg}`}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* PRO card — core badges + specialist picker */}
        {coreBadges && picker && (
          <div className="mb-3 space-y-2">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>Core Standards</p>
              <div className="flex flex-wrap gap-1">
                {coreBadges.map(s => (
                  <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeBg}`}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>+ {picker.label}</p>
              <div className="grid grid-cols-3 gap-1">
                {picker.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelected(prev => prev === opt ? null : opt)}
                    className={`text-[9px] px-1.5 py-1.5 rounded border font-bold transition-all leading-tight text-center ${selected === opt ? selectedBg : unselectedBg}`}
                    data-testid={`button-standard-pro-${opt.replace(/\s/g, "-").toLowerCase()}`}
                  >{opt}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Single standard picker (Core and Specialist cards) */}
        {picker && !coreBadges && (
          <div className="mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>{picker.label}</p>
            <div className="grid grid-cols-1 gap-1">
              {picker.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSelected(prev => prev === opt ? null : opt)}
                  className={`text-left px-2.5 py-1.5 rounded border text-[10px] font-bold transition-all ${selected === opt ? selectedBg : unselectedBg}`}
                  data-testid={`button-standard-${opt.replace(/\s/g, "-").toLowerCase()}`}
                >{opt}</button>
              ))}
            </div>
          </div>
        )}

        <ul className="space-y-1.5 mb-4 flex-1">
          {capabilities.map((cap) => (
            <li key={cap} className={`flex items-start gap-1.5 text-xs ${textMuted}`}>
              <CheckCircle2 className={`w-3 h-3 shrink-0 mt-0.5 ${capIconClass}`} />
              <span>{cap}</span>
            </li>
          ))}
        </ul>

        {ctaEl}
      </Card>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────── */
export default function ISOManager() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: conversations } = useIsaConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateIsaConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [activeSection, setActiveSection] = useState<'chat' | 'nc' | 'documentation' | 'communication' | 'risk' | 'management_review' | 'internal_audit' | 'training' | 'measurement'>('chat');

  const { data: project } = useQuery<IsoProject | null>({
    queryKey: ["/api/iso-projects"],
    queryFn: async () => {
      const res = await fetch("/api/iso-projects", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const createProjectMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/iso-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      if (res.status === 409) {
        const data = await res.json();
        return data.project;
      }
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      setShowWizard(true);
    },
    onError: () => {},
  });

  const deleteProjectMut = useMutation({
    mutationFn: async () => {
      await fetch("/api/iso-projects", { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      setShowWizard(false);
    },
    onError: () => {},
  });

  const handleStartWizard = () => {
    if (project) {
      setShowWizard(true);
    } else {
      createProjectMut.mutate();
    }
  };

  const handleResetProject = () => deleteProjectMut.mutate();

  const isPro = !!usageData?.isPro;
  const canAsk = !!usageData?.canAsk;

  const handleNewChat = (initialPrompt?: string) => {
    const title = initialPrompt ? initialPrompt.slice(0, 50) + "…" : "New ISO Consultation";
    createConversation(title, {
      onSuccess: (data: any) => {
        setActiveConversationId(data.id);
        setActiveSection('chat');
        setSidebarOpen(true);
        setShowWizard(false);
      },
    });
  };

  const handleAskIsa = (prompt: string) => {
    createConversation("NC Guidance: " + prompt.slice(0, 30), {
      onSuccess: (data: any) => {
        setActiveConversationId(data.id);
        setActiveSection('chat');
        setSidebarOpen(true);
        // Pre-seed would happen via a useEffect or by passing initialPrompt to a state
        // For now, using the title as a proxy or we can implement the message sending
      }
    });
  };

  const isWizardActive = showWizard || (project && project.status === "in_progress" && !activeConversationId);

  const ComingSoonModule = ({ moduleName, icon: Icon }: { moduleName: string; icon: any }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md space-y-6"
      >
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-primary mb-2">{moduleName}</h2>
          <p className="text-muted-foreground">
            This module is coming soon. Isa will coach you through each step when it's ready.
          </p>
        </div>
        <Button 
          onClick={() => handleAskIsa(`Can you explain what the ${moduleName} module will cover and how ISO requires it?`)}
          className="bg-accent hover:bg-accent/90 text-white gap-2"
        >
          <MessageSquare className="w-4 h-4" /> Ask Isa About {moduleName}
        </Button>
      </motion.div>
    </div>
  );

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted/30">

        {/* ── SIDEBAR ── */}
        <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-200 overflow-hidden flex-shrink-0`}>
          <div className="w-72 h-full flex flex-col bg-white dark:bg-card border-r border-border/60">

            <div className="p-5 border-b border-border/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-muted border border-border/60 flex items-center justify-center shadow-sm">
                    <img src={acsiLogo} alt="ACSI" className="w-10 h-10 object-contain" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full border-2 border-white dark:border-card" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-primary text-base">Isa</span>
                    {isPro && (
                      <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] px-1.5 py-0 font-bold">Isa Pro</Badge>
                    )}
                  </div>
                  {project?.status === "complete" && project.orgName ? (
                    <div>
                      <p className="text-xs font-semibold text-accent truncate">{project.orgName}</p>
                      <p className="text-[10px] text-muted-foreground">{project.standard}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Lead ISO Auditor AI · ACSI</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {ISA_STANDARDS.map((s) => {
                  const active = isPro
                    ? ISA_TIER_STANDARDS.professional.includes(s.code)
                    : ISA_TIER_STANDARDS.essentials.includes(s.code);
                  return (
                    <span key={s.code} title={`ISO ${s.code} — ${s.label}`}
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold transition-colors ${
                        active ? "bg-muted text-primary border-border" : "bg-muted text-muted-foreground/40 border-border/40"
                      }`}>
                      {s.code}
                    </span>
                  );
                })}
              </div>

              <Button onClick={() => {
                setActiveSection('chat');
                setActiveConversationId(null);
                handleNewChat();
              }} disabled={isCreating}
                className="w-full gap-2 bg-accent hover:bg-accent/90 text-white" data-testid="button-new-iso-chat">
                <Plus className="w-4 h-4" /> New Consultation
              </Button>

              <div className="mt-6 space-y-1">
                <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Modules</p>
                
                <ModuleNavButton 
                  active={activeSection === 'chat'} 
                  onClick={() => setActiveSection('chat')}
                  icon={MessageSquare}
                  label="AI Consultation"
                  testId="nav-chat"
                />

                <ModuleNavButton 
                  active={activeSection === 'nc'} 
                  onClick={() => setActiveSection('nc')}
                  icon={Shield}
                  label="NC & CAPA"
                  testId="nav-nc"
                />

                <ModuleNavButton 
                  active={activeSection === 'documentation'} 
                  onClick={() => setActiveSection('documentation')}
                  icon={FileText}
                  label="Documentation"
                  testId="nav-documentation"
                />

                <ModuleNavButton 
                  active={activeSection === 'communication'} 
                  onClick={() => setActiveSection('communication')}
                  icon={Mail}
                  label="Communication"
                  testId="nav-communication"
                />

                <ModuleNavButton 
                  active={activeSection === 'risk'} 
                  onClick={() => setActiveSection('risk')}
                  icon={AlertTriangle}
                  label="Risk Assessment"
                  testId="nav-risk"
                />

                <ModuleNavButton 
                  active={activeSection === 'management_review'} 
                  onClick={() => setActiveSection('management_review')}
                  icon={BarChart2}
                  label="Management Review"
                  testId="nav-management-review"
                />

                <ModuleNavButton 
                  active={activeSection === 'internal_audit'} 
                  onClick={() => setActiveSection('internal_audit')}
                  icon={ClipboardCheck}
                  label="Internal Audits"
                  testId="nav-internal-audit"
                />

                <ModuleNavButton 
                  active={activeSection === 'training'} 
                  onClick={() => setActiveSection('training')}
                  icon={GraduationCap}
                  label="Training"
                  testId="nav-training"
                />

                <ModuleNavButton 
                  active={activeSection === 'measurement'} 
                  onClick={() => setActiveSection('measurement')}
                  icon={Activity}
                  label="Measurement & Monitoring"
                  testId="nav-measurement"
                />
              </div>
            </div>

            <div className="p-4 border-b border-border/60 bg-muted/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {isPro ? "Isa Pro Capabilities" : "Isa Capabilities"}
              </p>
              <ul className="space-y-1.5">
                {(isPro ? ISA_PRO_CAPABILITIES : ISA_CAPABILITIES).map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent shrink-0" /> {cap}
                  </li>
                ))}
              </ul>
              {!isPro && (
                <Link href="/settings">
                  <button className="mt-3 w-full text-xs text-accent hover:text-accent/80 flex items-center gap-1 font-medium transition-colors">
                    <Zap className="w-3 h-3" /> Upgrade to Isa Pro — $199/mo
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                </Link>
              )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Sessions</p>
              <ScrollArea className="flex-1 px-2 pb-2">
                <div className="space-y-0.5">
                  {!conversations?.length && (
                    <p className="text-xs text-muted-foreground/50 text-center py-4">No sessions yet</p>
                  )}
                  {conversations?.map((conv: any) => (
                    <button key={conv.id} onClick={() => {
                      setActiveConversationId(conv.id);
                      setActiveSection('chat');
                    }}
                      data-testid={`button-iso-conversation-${conv.id}`}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 truncate ${
                        activeConversationId === conv.id && activeSection === 'chat' ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:bg-muted"
                      }`}>
                      <MessageSquare className="w-3 h-3 shrink-0 opacity-50" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {usageData && !isPro && (
              <div className="p-4 border-t border-border/60 bg-muted/20">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Preview questions used</span>
                  <span>{usageData.questionCount} / {usageData.freeLimit}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-accent h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usageData.questionCount / usageData.freeLimit) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="h-12 bg-white dark:bg-card border-b border-border/60 flex items-center px-4 gap-3 shrink-0 shadow-sm">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-muted"
              data-testid="button-toggle-sidebar">
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-white dark:bg-muted border border-border/60 flex items-center justify-center shadow-sm">
                <img src={acsiLogo} alt="Isa" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-sm font-bold text-primary">Isa</span>
              <span className="text-xs text-muted-foreground hidden sm:block">· ACSI Lead ISO Auditor AI</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="w-3 h-3 text-accent" /><span>Online</span>
              </div>
              {isPro ? (
                <Badge className="bg-accent/10 text-accent border-accent/30 text-xs gap-1">
                  <Star className="w-3 h-3" /> Isa Pro
                </Badge>
              ) : (
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="h-7 text-xs text-accent border-accent/30 hover:bg-accent/10">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {activeSection === 'nc' ? (
              <NonconformanceManager onAskIsa={handleAskIsa} />
            ) : activeSection === 'documentation' ? (
              <DocumentationModule onAskIsa={handleAskIsa} />
            ) : activeSection === 'communication' ? (
              <ComingSoonModule moduleName="Communication" icon={Mail} />
            ) : activeSection === 'risk' ? (
              <ComingSoonModule moduleName="Risk Assessment" icon={AlertTriangle} />
            ) : activeSection === 'management_review' ? (
              <ComingSoonModule moduleName="Management Review" icon={BarChart2} />
            ) : activeSection === 'internal_audit' ? (
              <ComingSoonModule moduleName="Internal Audits" icon={ClipboardCheck} />
            ) : activeSection === 'training' ? (
              <ComingSoonModule moduleName="Training" icon={GraduationCap} />
            ) : activeSection === 'measurement' ? (
              <ComingSoonModule moduleName="Measurement & Monitoring" icon={Activity} />
            ) : (
              <>
            {usageData && !canAsk && !activeConversationId && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-muted/60 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="max-w-md w-full p-8 text-center space-y-5 shadow-xl">
                    <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-primary mb-2">Unlock Full ISO Guidance</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">Choose a plan to continue with Isa.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="border border-accent/20 rounded-xl p-4 text-left">
                        <Award className="w-4 h-4 text-accent mb-2" />
                        <p className="font-bold text-primary text-sm">Isa</p>
                        <p className="text-xs text-muted-foreground mb-2">9001 · 14001 · 45001</p>
                        <p className="text-accent font-black text-lg mb-3">$99<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                        <Link href="/settings">
                          <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white text-xs" data-testid="button-upgrade-isa">Get Isa</Button>
                        </Link>
                      </div>
                      <div className="border-2 border-primary/30 rounded-xl p-4 text-left relative bg-primary/5">
                        <div className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">BEST</div>
                        <Star className="w-4 h-4 text-primary dark:text-accent mb-2" />
                        <p className="font-bold text-primary text-sm">Isa Pro</p>
                        <p className="text-xs text-muted-foreground mb-2">All 7 standards</p>
                        <p className="text-primary font-black text-lg mb-3 dark:text-accent">$199<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                        <Link href="/settings">
                          <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs" data-testid="button-upgrade-isa-pro">Get Isa Pro</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            )}

            {activeConversationId ? (
              <ISOChatInterface conversationId={activeConversationId} onMessageSent={() => refetchUsage()} isPro={isPro} />
            ) : isWizardActive && project ? (
              <ISOSetupWizard project={project} onComplete={() => { setShowWizard(false); qc.invalidateQueries({ queryKey: ["/api/iso-projects"] }); }} />
            ) : (
              <IsaEmptyState
                onQuickPrompt={(p) => handleNewChat(p)}
                onNewChat={() => handleNewChat()}
                isCreating={isCreating}
                isPro={isPro}
                project={project ?? null}
                onStartWizard={handleStartWizard}
                onResetProject={handleResetProject}
                isResetting={deleteProjectMut.isPending}
                onModuleSelect={(section) => setActiveSection(section)}
              />
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

/* ─── ISO SETUP WIZARD ──────────────────────────────────── */
type ProcessEntry = { name: string; owner: string; kpi: string; inputs: string; outputs: string; clauses: string[] };

const WIZARD_STANDARDS = ["ISO 9001", "ISO 14001", "ISO 45001", "IATF 16949", "AS9100 Rev D", "ISO 13485", "ISO 27001"];
const TECH_OPTIONS = ["Injection Molding", "CNC Machining", "Metal Stamping", "Assembly", "Heat Treating", "Fabrication / Welding", "Software Development", "Service Delivery", "Other"];
const RISK_OPTIONS = ["SWOT Analysis", "FMEA / PFMEA", "Internal Audit Findings", "Management Review", "Customer Feedback / Complaints", "Supplier Performance Reviews", "Other"];
const OEM_OPTIONS = ["Ford", "GM", "Stellantis", "BMW", "VW Group", "Toyota", "Honda", "FCA", "Tier 1 Supplier Only", "Other"];
const PROCESS_SUGGESTIONS = ["Purchasing", "Sales / Quoting", "Receiving Inspection", "Production Planning", "Manufacturing", "Final Inspection", "Shipping", "Corrective Action", "Internal Audit", "Management Review", "Maintenance", "Training", "Customer Satisfaction"];

function suggestClauses(name: string, standard: string): string[] {
  const n = name.toLowerCase();
  const cs: string[] = [];
  if (n.includes("purchas") || n.includes("procure") || n.includes("supplier")) cs.push("8.4 — External Providers");
  if ((n.includes("receiv") && n.includes("inspect")) || n.includes("incoming")) cs.push("8.6 — Release of Products");
  if (n.includes("internal audit")) cs.push("9.2 — Internal Audit");
  if (n.includes("management review")) cs.push("9.3 — Management Review");
  if (n.includes("corrective") || n.includes("capa")) cs.push("10.2 — Corrective Actions");
  if (n.includes("mainten")) {
    cs.push("8.5.1 — Production Control");
    if (standard.includes("IATF")) cs.push("8.5.1.5 — TPM");
  }
  if (n.includes("train") || n.includes("competen")) cs.push("7.2 — Competence");
  if (n.includes("customer") || n.includes("sales") || n.includes("quot")) cs.push("8.2 — Customer Requirements");
  if (n.includes("design")) cs.push("8.3 — Design & Development");
  if (n.includes("ship") || n.includes("deliver") || n.includes("logistic")) cs.push("8.5.5 — Post-Delivery");
  if (n.includes("document") || n.includes("record")) cs.push("7.5 — Documented Information");
  if ((n.includes("final") && n.includes("inspect")) || n.includes("quality control")) cs.push("8.6 — Release of Products");
  return cs;
}

function ISOSetupWizard({ project, onComplete }: { project: IsoProject; onComplete: () => void }) {
  const qc = useQueryClient();

  const [standard, setStandard] = useState(project.standard || "");
  const [orgName, setOrgName] = useState(project.orgName || "");
  const [orgAddress, setOrgAddress] = useState(project.orgAddress || "");
  const [totalEmp, setTotalEmp] = useState(project.totalEmployees?.toString() || "");
  const [prodEmp, setProdEmp] = useState(project.productionEmployees?.toString() || "");
  const [adminEmp, setAdminEmp] = useState(project.adminEmployees?.toString() || "");
  const [products, setProducts] = useState(project.productsServices || "");
  const [mfgTech, setMfgTech] = useState<string[]>(project.manufacturingTech || []);
  const [otherTech, setOtherTech] = useState("");
  const [hasDesign, setHasDesign] = useState<boolean | null>(project.hasDesignResponsibility ?? null);

  const [processes, setProcesses] = useState<ProcessEntry[]>((project.processes as ProcessEntry[]) || []);
  const [addingProc, setAddingProc] = useState(false);
  const [procName, setProcName] = useState("");
  const [procOwner, setProcOwner] = useState("");
  const [procKPI, setProcKPI] = useState("");
  const [procInputs, setProcInputs] = useState("");
  const [procOutputs, setProcOutputs] = useState("");
  const [procClauses, setProcClauses] = useState<string[]>([]);

  const [coreValues, setCoreValues] = useState<string[]>(project.coreValues?.length ? project.coreValues : ["", "", ""]);
  const [riskPhil, setRiskPhil] = useState<string[]>(project.riskPhilosophy || []);
  const [oems, setOems] = useState<string[]>(project.oemSuppliers || []);

  const [phase, setPhase] = useState<1 | 2 | 3>((project.phase as 1 | 2 | 3) || 1);
  const [p1Step, setP1Step] = useState(0);
  const [p3Step, setP3Step] = useState(0);

  const showOEM = standard === "IATF 16949" || standard === "AS9100 Rev D";

  const patchMut = useMutation({
    mutationFn: async (data: Partial<IsoProject>) => {
      const res = await fetch("/api/iso-projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-projects"] }),
    onError: () => {},
  });

  const saveP1 = async (goNext = false) => {
    await patchMut.mutateAsync({
      standard, orgName, orgAddress,
      totalEmployees: parseInt(totalEmp) || undefined,
      productionEmployees: parseInt(prodEmp) || undefined,
      adminEmployees: parseInt(adminEmp) || undefined,
      productsServices: products,
      manufacturingTech: mfgTech,
      hasDesignResponsibility: hasDesign ?? undefined,
      phase: goNext ? 2 : 1,
    });
  };

  const p1Next = async () => {
    if (p1Step === 5) { await saveP1(true); setPhase(2); }
    else { await saveP1(); setP1Step(s => s + 1); }
  };

  const addProcess = () => {
    if (!procName.trim()) return;
    setProcesses(prev => [...prev, { name: procName, owner: procOwner, kpi: procKPI, inputs: procInputs, outputs: procOutputs, clauses: procClauses }]);
    setProcName(""); setProcOwner(""); setProcKPI(""); setProcInputs(""); setProcOutputs(""); setProcClauses([]);
    setAddingProc(false);
  };

  const goToPhase3 = async () => {
    await patchMut.mutateAsync({ processes, phase: 3 });
    setPhase(3);
  };

  const completeSetup = async () => {
    await patchMut.mutateAsync({
      coreValues: coreValues.filter(v => v.trim()),
      riskPhilosophy: riskPhil,
      oemSuppliers: showOEM ? oems : [],
      phase: 3, status: "complete",
    });
    onComplete();
  };

  const p3Advance = () => {
    if (p3Step === 0) setP3Step(1);
    else if (p3Step === 1 && showOEM) setP3Step(2);
    else completeSetup();
  };

  const toggleTech = (t: string) => setMfgTech(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleRisk = (r: string) => setRiskPhil(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  const toggleOEM = (o: string) => setOems(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);

  const phaseLabels = ["Phase 1: Context", "Phase 2: Processes", "Phase 3: Policy"];
  const p1CanAdvance = [
    !!standard,
    !!(orgName.trim()),
    !!(totalEmp),
    !!(products.trim()),
    mfgTech.length > 0,
    hasDesign !== null,
  ][p1Step];

  return (
    <div className="flex h-full overflow-hidden" data-testid="wizard-iso-setup">
      {/* ── LEFT: Questions Pane ── */}
      <div className="w-[55%] flex flex-col border-r border-border/60 bg-white dark:bg-card overflow-hidden" data-testid="wizard-questions-pane">
        {/* Progress Bar */}
        <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex gap-2 mb-2">
            {phaseLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${phase === i + 1 ? "bg-accent" : phase > i + 1 ? "bg-accent/40" : "bg-border/40"}`} />
                <p className={`text-[10px] font-bold mt-1 truncate ${phase === i + 1 ? "text-accent" : "text-muted-foreground/50"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Isa Avatar */}
        <div className="shrink-0 flex items-center gap-3 px-6 pt-5 pb-2">
          <div className="w-9 h-9 rounded-full bg-primary border-2 border-accent/30 flex items-center justify-center shadow-md flex-shrink-0">
            <img src={acsiLogo} alt="Isa" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <span className="text-xs font-black text-primary">Isa</span>
            <span className="text-[10px] text-muted-foreground ml-1">· Lead ISO Auditor AI</span>
          </div>
        </div>

        {/* Question Area */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            <AnimatePresence mode="wait">
              {phase === 1 && (
                <motion.div key={`p1-${p1Step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {p1Step === 0 && (
                    <div>
                      <p className="text-lg font-black text-primary mb-1">Which ISO standard are you building toward?</p>
                      <p className="text-sm text-muted-foreground mb-5">This determines which clauses and requirements we'll map your organization to.</p>
                      <div className="grid grid-cols-2 gap-2">
                        {WIZARD_STANDARDS.map(s => (
                          <button key={s} onClick={() => setStandard(s)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${standard === s ? "border-accent bg-accent/5 text-accent" : "border-border/60 text-primary hover:border-accent/40"}`}
                            data-testid={`button-wizard-standard-${s.replace(/[\s/]/g, "-").toLowerCase()}`}>
                            <span className="text-sm font-bold">{s}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {p1Step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">What is the legal name of your organization?</p>
                        <p className="text-sm text-muted-foreground mb-4">And your primary site address. I'll use this to anchor your scope statement.</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Organization Name</label>
                          <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g., Acme Manufacturing, Inc." data-testid="input-wizard-org-name" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Primary Site Address</label>
                          <Input value={orgAddress} onChange={e => setOrgAddress(e.target.value)} placeholder="e.g., 123 Industrial Blvd, Detroit, MI 48201" data-testid="input-wizard-org-address" />
                        </div>
                      </div>
                    </div>
                  )}
                  {p1Step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">How many employees are within scope?</p>
                        <p className="text-sm text-muted-foreground mb-4">Give me a breakdown. This helps define the scale and complexity of your management system.</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Total Employees in Scope</label>
                          <Input type="number" value={totalEmp} onChange={e => setTotalEmp(e.target.value)} placeholder="e.g., 75" data-testid="input-wizard-total-emp" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Production</label>
                            <Input type="number" value={prodEmp} onChange={e => setProdEmp(e.target.value)} placeholder="e.g., 55" data-testid="input-wizard-prod-emp" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Administrative</label>
                            <Input type="number" value={adminEmp} onChange={e => setAdminEmp(e.target.value)} placeholder="e.g., 20" data-testid="input-wizard-admin-emp" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {p1Step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">What are your primary products or services?</p>
                        <p className="text-sm text-muted-foreground mb-4">Be specific. I'll use this to draft your Scope Statement — the most scrutinized clause in any certification audit.</p>
                      </div>
                      <Textarea value={products} onChange={e => setProducts(e.target.value)}
                        placeholder="e.g., Precision CNC-machined aluminum components for the automotive industry, including engine housings, transmission brackets, and structural assemblies."
                        className="min-h-[120px]" data-testid="input-wizard-products" />
                    </div>
                  )}
                  {p1Step === 4 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">What are your core manufacturing technologies?</p>
                        <p className="text-sm text-muted-foreground mb-4">Select all that apply — this helps me identify Special Processes that require additional controls under your standard.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {TECH_OPTIONS.filter(t => t !== "Other").map(t => (
                          <button key={t} onClick={() => toggleTech(t)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${mfgTech.includes(t) ? "bg-accent text-white border-accent" : "border-border/60 text-primary hover:border-accent/40"}`}
                            data-testid={`button-wizard-tech-${t.replace(/[\s/]/g, "-").toLowerCase()}`}>{t}</button>
                        ))}
                        <button onClick={() => toggleTech("Other")}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${mfgTech.includes("Other") ? "bg-accent text-white border-accent" : "border-border/60 text-primary hover:border-accent/40"}`}
                          data-testid="button-wizard-tech-other">Other</button>
                      </div>
                      {mfgTech.includes("Other") && (
                        <div className="mt-2">
                          <Input value={otherTech} onChange={e => setOtherTech(e.target.value)}
                            onBlur={() => { if (otherTech.trim()) { setMfgTech(prev => [...prev.filter(t => t !== "Other"), otherTech.trim(), "Other"]); }}}
                            placeholder="Describe your other technology…" data-testid="input-wizard-tech-other" />
                        </div>
                      )}
                    </div>
                  )}
                  {p1Step === 5 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">Are you responsible for Product Design?</p>
                        <p className="text-sm text-muted-foreground mb-4">Do you engineer the product, or do you manufacture to a customer's design? This determines whether Clause 8.3 (Design & Development) is in or out of scope.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setHasDesign(true)}
                          className={`p-4 rounded-xl border-2 transition-all ${hasDesign === true ? "border-accent bg-accent/5" : "border-border/60 hover:border-accent/40"}`}
                          data-testid="button-wizard-design-yes">
                          <p className={`font-bold text-sm ${hasDesign === true ? "text-accent" : "text-primary"}`}>Yes — We Design It</p>
                          <p className="text-xs text-muted-foreground mt-1">Clause 8.3 in scope</p>
                        </button>
                        <button onClick={() => setHasDesign(false)}
                          className={`p-4 rounded-xl border-2 transition-all ${hasDesign === false ? "border-accent bg-accent/5" : "border-border/60 hover:border-accent/40"}`}
                          data-testid="button-wizard-design-no">
                          <p className={`font-bold text-sm ${hasDesign === false ? "text-accent" : "text-primary"}`}>No — We Build to Spec</p>
                          <p className="text-xs text-muted-foreground mt-1">Clause 8.3 excluded</p>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {phase === 2 && (
                <motion.div key="phase2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <p className="text-lg font-black text-primary mb-1">Let's map your processes.</p>
                  <p className="text-sm text-muted-foreground mb-4">These become the backbone of your management system. Add each department or value stream — Isa will auto-tag the relevant clauses.</p>

                  {!addingProc && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-muted-foreground mb-2">Quick-add a common process:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PROCESS_SUGGESTIONS.map(s => (
                          <button key={s} onClick={() => { setProcName(s); setProcClauses(suggestClauses(s, standard)); setAddingProc(true); }}
                            className="text-xs px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors"
                            data-testid={`button-wizard-proc-suggest-${s.replace(/[\s/]/g, "-").toLowerCase()}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {addingProc && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-4 border-accent/20 bg-accent/5 mb-4 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-primary">Define This Process</p>
                          <button onClick={() => setAddingProc(false)} className="text-muted-foreground hover:text-primary"><X className="w-4 h-4" /></button>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Process Name</label>
                          <Input value={procName} onChange={e => { setProcName(e.target.value); setProcClauses(suggestClauses(e.target.value, standard)); }}
                            placeholder="e.g., Purchasing, Final Assembly, Maintenance" data-testid="input-wizard-proc-name" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Process Owner (Job Title)</label>
                            <Input value={procOwner} onChange={e => setProcOwner(e.target.value)} placeholder="e.g., Purchasing Manager" data-testid="input-wizard-proc-owner" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">KPI — How do you measure success?</label>
                            <Input value={procKPI} onChange={e => setProcKPI(e.target.value)} placeholder="e.g., Supplier OTD %, Scrap Rate" data-testid="input-wizard-proc-kpi" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Inputs — What starts this process?</label>
                            <Input value={procInputs} onChange={e => setProcInputs(e.target.value)} placeholder="e.g., Purchase Order, Raw Material" data-testid="input-wizard-proc-inputs" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Outputs — What is the final result?</label>
                            <Input value={procOutputs} onChange={e => setProcOutputs(e.target.value)} placeholder="e.g., Approved Supplier, Finished Goods" data-testid="input-wizard-proc-outputs" />
                          </div>
                        </div>
                        {procClauses.length > 0 && (
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" /> Auto-tagged Clauses</label>
                            <div className="flex flex-wrap gap-1">
                              {procClauses.map(c => (
                                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold flex items-center gap-1">
                                  {c}
                                  <button onClick={() => setProcClauses(prev => prev.filter(x => x !== c))} className="hover:text-accent/60"><X className="w-2.5 h-2.5" /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button onClick={addProcess} disabled={!procName.trim()} className="w-full bg-accent hover:bg-accent/90 text-white" data-testid="button-wizard-save-process">
                          Save Process →
                        </Button>
                      </Card>
                    </motion.div>
                  )}

                  {processes.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      {processes.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg border border-border/60 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="font-semibold text-primary flex-1">{p.name}</span>
                          <span className="text-muted-foreground">{p.owner}</span>
                          <button onClick={() => setProcesses(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground/50 hover:text-destructive ml-1" data-testid={`button-wizard-remove-proc-${i}`}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {phase === 3 && (
                <motion.div key={`phase3-${p3Step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {p3Step === 0 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">What are the three core values of your organization?</p>
                        <p className="text-sm text-muted-foreground mb-4">These will anchor your Quality Policy — the statement of intent that opens every great management system.</p>
                      </div>
                      <div className="space-y-2">
                        {[0, 1, 2].map(i => (
                          <div key={i}>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Core Value {i + 1}</label>
                            <Input value={coreValues[i] || ""} onChange={e => setCoreValues(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                              placeholder={["e.g., Customer First", "e.g., Continuous Improvement", "e.g., Safety Above All"][i]}
                              data-testid={`input-wizard-value-${i}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {p3Step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">How does your organization identify and assess risks?</p>
                        <p className="text-sm text-muted-foreground mb-4">Select all methods you currently use — or plan to use. This defines your Risk Framework under Clause 6.1.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {RISK_OPTIONS.map(r => (
                          <button key={r} onClick={() => toggleRisk(r)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${riskPhil.includes(r) ? "bg-accent text-white border-accent" : "border-border/60 text-primary hover:border-accent/40"}`}
                            data-testid={`button-wizard-risk-${r.replace(/[\s/]/g, "-").toLowerCase()}`}>{r}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {p3Step === 2 && showOEM && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-black text-primary mb-1">Which OEMs do you supply to?</p>
                        <p className="text-sm text-muted-foreground mb-3">This identifies the scope of your customer base. I'll use this to set context — not to interpret CSRs.</p>
                        <p className="text-xs italic text-muted-foreground/60 bg-muted/40 rounded-lg px-3 py-2 border border-border/40 mb-4">
                          Note: Customer Specific Requirements (CSRs) are managed through CESAR — ACSI's dedicated CSR platform. Isa does not handle CSR compliance.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {OEM_OPTIONS.map(o => (
                          <button key={o} onClick={() => toggleOEM(o)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${oems.includes(o) ? "bg-accent text-white border-accent" : "border-border/60 text-primary hover:border-accent/40"}`}
                            data-testid={`button-wizard-oem-${o.replace(/[\s/]/g, "-").toLowerCase()}`}>{o}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Navigation Buttons */}
        <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center gap-3">
          {phase === 1 && p1Step > 0 && (
            <Button variant="outline" onClick={() => setP1Step(s => s - 1)} className="gap-1.5" data-testid="button-wizard-back">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {phase === 3 && p3Step > 0 && (
            <Button variant="outline" onClick={() => setP3Step(s => s - 1)} className="gap-1.5" data-testid="button-wizard-back-p3">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {phase === 2 && (
            <Button variant="outline" onClick={() => setPhase(1)} className="gap-1.5" data-testid="button-wizard-back-p2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {phase === 1 && (
            <Button onClick={p1Next} disabled={!p1CanAdvance || patchMut.isPending} className="bg-accent hover:bg-accent/90 text-white gap-1.5" data-testid="button-wizard-next-p1">
              {patchMut.isPending ? "Saving…" : p1Step === 5 ? "Next Phase →" : "Next →"}
              {!patchMut.isPending && <ArrowRight className="w-4 h-4" />}
            </Button>
          )}
          {phase === 2 && !addingProc && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setProcName(""); setProcOwner(""); setProcKPI(""); setProcInputs(""); setProcOutputs(""); setProcClauses([]); setAddingProc(true); }}
                className="gap-1.5 border-accent/30 text-accent hover:bg-accent/5" data-testid="button-wizard-add-process">
                <Plus className="w-4 h-4" /> Add Process
              </Button>
              <Button onClick={goToPhase3} disabled={patchMut.isPending} className="bg-accent hover:bg-accent/90 text-white gap-1.5" data-testid="button-wizard-done-processes">
                {patchMut.isPending ? "Saving…" : "Done with Processes →"}
                {!patchMut.isPending && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          )}
          {phase === 3 && (
            <Button onClick={p3Advance} disabled={patchMut.isPending}
              className="bg-accent hover:bg-accent/90 text-white gap-1.5" data-testid="button-wizard-next-p3">
              {patchMut.isPending ? "Saving…" : (p3Step === (showOEM ? 2 : 1)) ? "Complete Setup ✓" : "Next →"}
              {!patchMut.isPending && <ArrowRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* ── RIGHT: Drafting Pane ── */}
      <div className="flex-1 flex flex-col bg-muted/20 overflow-hidden" data-testid="wizard-drafting-pane">
        <div className="shrink-0 px-5 py-4 border-b border-border/60 bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-accent" />
            <p className="text-sm font-black text-primary">Your Management System</p>
            <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 rounded px-1.5 py-0.5 font-bold ml-auto">Building in Real Time</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-4" data-testid="drafting-pane-content">

            {/* Organization Profile */}
            <DraftSection title="Organization Profile" icon={<Building2 className="w-3.5 h-3.5" />}>
              {orgName || orgAddress || totalEmp ? (
                <div className="space-y-1.5 text-xs">
                  {orgName && <DraftRow label="Organization" value={orgName} />}
                  {orgAddress && <DraftRow label="Address" value={orgAddress} />}
                  {standard && <DraftRow label="Standard" value={standard} highlight />}
                  {totalEmp && <DraftRow label="Employees" value={`${totalEmp} total${prodEmp ? ` (${prodEmp} prod. / ${adminEmp} admin)` : ""}`} />}
                </div>
              ) : <DraftEmpty />}
            </DraftSection>

            {/* Scope Statement */}
            <DraftSection title="Scope Statement" icon={<Target className="w-3.5 h-3.5" />}>
              {products ? (
                <div className="space-y-2 text-xs">
                  <p className="text-primary/80 leading-relaxed italic">"{products}"</p>
                  {mfgTech.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mfgTech.filter(t => t !== "Other").map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground font-medium">{t}</span>
                      ))}
                    </div>
                  )}
                  {hasDesign !== null && (
                    <p className={`text-[10px] font-bold ${hasDesign ? "text-accent" : "text-muted-foreground"}`}>
                      Design & Development (Cl. 8.3): {hasDesign ? "In Scope" : "Excluded"}
                    </p>
                  )}
                </div>
              ) : <DraftEmpty />}
            </DraftSection>

            {/* Process Architecture */}
            <DraftSection title="Process Architecture" icon={<Factory className="w-3.5 h-3.5" />}>
              {processes.length > 0 ? (
                <div className="space-y-2">
                  {processes.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-card rounded-lg border border-border/60 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-primary">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground">· {p.owner}</span>
                      </div>
                      {p.kpi && <p className="text-[10px] text-muted-foreground mb-1"><span className="font-semibold">KPI:</span> {p.kpi}</p>}
                      {p.clauses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.clauses.map(c => (
                            <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-bold">{c}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : <DraftEmpty />}
            </DraftSection>

            {/* Quality Policy */}
            <DraftSection title="Quality Policy Draft" icon={<Award className="w-3.5 h-3.5" />}>
              {coreValues.some(v => v.trim()) ? (
                <div className="space-y-1.5">
                  {coreValues.filter(v => v.trim()).map((v, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                      <span className="font-semibold text-primary">{v}</span>
                    </motion.div>
                  ))}
                </div>
              ) : <DraftEmpty />}
            </DraftSection>

            {/* Risk Framework */}
            <DraftSection title="Risk Framework" icon={<Shield className="w-3.5 h-3.5" />}>
              {riskPhil.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {riskPhil.map(r => (
                    <motion.span key={r} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground font-medium">{r}</motion.span>
                  ))}
                </div>
              ) : <DraftEmpty />}
            </DraftSection>

          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function DraftSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-muted/30">
        <span className="text-accent">{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function DraftRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground/60 w-20 shrink-0">{label}</span>
      <span className={`font-semibold flex-1 ${highlight ? "text-accent" : "text-primary"}`}>{value}</span>
    </div>
  );
}

function DraftEmpty() {
  return <p className="text-xs text-muted-foreground/40 italic">Waiting for your answers…</p>;
}

/* ─── EMPTY STATE ─────────────────────────────────────── */
function IsaEmptyState({
  onQuickPrompt, onNewChat, isCreating, isPro, project, onStartWizard, onResetProject, isResetting, onModuleSelect,
}: {
  onQuickPrompt: (p: string) => void;
  onNewChat: () => void;
  isCreating: boolean;
  isPro: boolean;
  project: IsoProject | null | undefined;
  onStartWizard: () => void;
  onResetProject: () => void;
  isResetting: boolean;
  onModuleSelect?: (section: 'chat' | 'nc' | 'documentation' | 'communication' | 'risk' | 'management_review' | 'internal_audit' | 'training' | 'measurement') => void;
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Hero strip ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="bg-primary rounded-2xl px-6 py-5 flex items-center gap-5 mb-6 shadow-sm">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <img src={acsiLogo} alt="ACSI" className="w-11 h-11 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-white">Isa</h1>
                <span className="text-xs bg-accent/20 text-accent border border-accent/40 rounded-full px-2 py-0.5 font-semibold flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3" /> ACSI ISO Manager
                </span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed max-w-2xl">
                A complete ISO Management System platform — Documentation Library, NC & CAPA tracking, Risk Assessment, Internal Audits, Management Review, and more. Powered by Isa, your AI Lead Auditor who cites clause numbers, identifies gaps, and guides your team from setup through certification.
              </p>
            </div>
            <Button onClick={onNewChat} disabled={isCreating}
              className="bg-accent hover:bg-accent/90 text-white gap-2 font-semibold shrink-0 hidden sm:flex"
              data-testid="button-start-iso-chat">
              <MessageSquare className="w-4 h-4" />
              {isCreating ? "Starting…" : "Start Consultation"}
            </Button>
          </div>
        </motion.div>

        {/* ── Project Summary (complete) or CTA (no project) ── */}
        {project?.status === "complete" ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6" data-testid="card-project-summary">
            <div className="bg-white dark:bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-black text-primary">Management System Profile — Active</p>
                    <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-bold">All 3 Phases Complete</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Standard</p>
                      <p className="text-xs font-bold text-accent">{project.standard}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Organization</p>
                      <p className="text-xs font-semibold text-primary truncate">{project.orgName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Employees</p>
                      <p className="text-xs font-semibold text-primary">{project.totalEmployees || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Processes Mapped</p>
                      <p className="text-xs font-semibold text-primary">{(project.processes as any[])?.length || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Isa now has full context of your organization — start a consultation and she'll reference your processes, employees, and scope automatically.</p>
                </div>
                <Button variant="outline" size="sm" onClick={onResetProject} disabled={isResetting}
                  className="shrink-0 text-xs border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 gap-1"
                  data-testid="button-reset-project">
                  <RotateCcw className="w-3 h-3" />{isResetting ? "Resetting…" : "Reset"}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : !project ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            <div className="bg-primary/5 border-2 border-dashed border-accent/30 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <img src={acsiLogo} alt="ACSI" className="w-9 h-9 object-contain" />
              </div>
              <h3 className="text-base font-black text-primary mb-1">Build Your Management System</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Isa guides you through a 3-phase setup that maps your organization, processes, and quality policy — giving her full context before your first consultation.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-5">
                <span className="flex items-center gap-1"><span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">1</span> Org Context</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                <span className="flex items-center gap-1"><span className="w-5 h-5 rounded-full bg-accent/60 text-white text-[10px] font-bold flex items-center justify-center">2</span> Process Map</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                <span className="flex items-center gap-1"><span className="w-5 h-5 rounded-full bg-accent/30 text-white text-[10px] font-bold flex items-center justify-center">3</span> Policy</span>
              </div>
              <Button onClick={onStartWizard} className="bg-accent hover:bg-accent/90 text-white gap-2 font-bold" data-testid="button-start-wizard">
                <ArrowRight className="w-4 h-4" /> Start Setup — Build My System
              </Button>
            </div>
          </motion.div>
        ) : null}

        {/* ── Workspace Status ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
          <div className="mb-6" data-testid="section-iso-workspace-header">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5">ISO Workspace</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 shadow-sm" data-testid="card-iso-active-standards">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Active Standards</p>
                <p className="text-2xl font-black text-primary leading-none">{project?.standard || "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{project ? "Management system active" : "Set up your first project"}</p>
              </div>
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 shadow-sm" data-testid="card-iso-open-ncs">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Open NCs</p>
                <p className="text-2xl font-black text-primary leading-none">—</p>
                <p className="text-[10px] text-muted-foreground mt-1">Go to NC & CAPA module</p>
              </div>
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 shadow-sm" data-testid="card-iso-documents">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Documents</p>
                <p className="text-2xl font-black text-primary leading-none">—</p>
                <p className="text-[10px] text-muted-foreground mt-1">Go to Documentation module</p>
              </div>
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 shadow-sm" data-testid="card-iso-next-audit">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Next Audit</p>
                <p className="text-sm font-black text-primary leading-none mt-1">Not scheduled</p>
                <p className="text-[10px] text-muted-foreground mt-1">Ask Isa to help plan</p>
              </div>
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 shadow-sm" data-testid="card-iso-processes">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Processes Mapped</p>
                <p className="text-2xl font-black text-primary leading-none">{(project?.processes as any[])?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{project ? "In your process architecture" : "Complete setup wizard"}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <div className="mb-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Ask Isa — click to start a consultation</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_PROMPTS.map((item, i) => (
              <motion.button key={item.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.25 }}
                onClick={() => onQuickPrompt(item.prompt)}
                disabled={isCreating}
                data-testid={`button-quick-prompt-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-left p-3 rounded-xl bg-white dark:bg-card border border-border/60 hover:border-accent/40 hover:shadow-sm transition-all duration-150 group disabled:opacity-50">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center mb-2 group-hover:bg-accent/10 transition-colors">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-xs font-bold text-primary leading-tight">{item.label}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Platform Modules ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5">Platform Modules</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { icon: MessageSquare, label: "AI Consultation", desc: "Isa coaching on any ISO clause", status: "live", section: "chat" },
                { icon: Shield, label: "NC & CAPA", desc: "Log, track & close nonconformances", status: "live", section: "nc" },
                { icon: FileText, label: "Documentation", desc: "Quality Manual, Procedures, WIs", status: "live", section: "documentation" },
                { icon: AlertTriangle, label: "Risk Assessment", desc: "Clause 6.1 risk & opportunity register", status: "soon", section: "risk" },
                { icon: BarChart2, label: "Management Review", desc: "Inputs, outputs & action tracking", status: "soon", section: "management_review" },
                { icon: ClipboardCheck, label: "Internal Audits", desc: "Checklists, findings & close-outs", status: "soon", section: "internal_audit" },
                { icon: Mail, label: "Communication", desc: "Internal & external communications log", status: "soon", section: "communication" },
                { icon: GraduationCap, label: "Training", desc: "Competency tracking & training records", status: "soon", section: "training" },
                { icon: Activity, label: "Measurement & Monitoring", desc: "KPIs, metrics & performance data", status: "soon", section: "measurement" },
              ].map((mod) => (
                <button
                  key={mod.label}
                  onClick={() => mod.status === "live" ? onModuleSelect?.(mod.section as any) : onQuickPrompt(`Can you explain what the ${mod.label} module will cover and how ISO requires it?`)}
                  className="text-left p-3 rounded-xl bg-white dark:bg-card border border-border/60 hover:border-accent/40 hover:shadow-sm transition-all duration-150 group"
                  data-testid={`card-module-${mod.section}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <mod.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    {mod.status === "live" ? (
                      <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">LIVE</span>
                    ) : (
                      <span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border/60 rounded-full px-1.5 py-0.5">SOON</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-primary leading-tight mb-0.5">{mod.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{mod.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Plans & Pricing ── 4-tier ISO Manager ── */}
        <div className="mb-7">

          {/* Section header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-accent/50" />
            <Vault className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider whitespace-nowrap">ACSI ISO Manager — Choose Your Tier</span>
            <div className="flex-1 h-px bg-accent/50" />
          </div>

          {/* Horizontal scroll wrapper */}
          <div className="overflow-x-auto -mx-6 px-6 pb-2">
            <div style={{ minWidth: "900px" }}>
              <div className="grid grid-cols-4 gap-4">

                {/* Card 1 — ISO Manager Core */}
                <ISOTierCard
                  data-testid="card-plan-iso-core"
                  delay={0.05}
                  badge="TIER 1"
                  title="ISO Manager Core"
                  subtitle="Isa Included"
                  price="$299"
                  annual="billed annually · $3,588/yr"
                  setup="+ $1,000–$1,500 one-time setup fee"
                  capabilities={ISO_CORE_CAPABILITIES}
                  cardClass="border-border/60 bg-white dark:bg-card"
                  topBarClass="bg-accent"
                  capIconClass="text-accent"
                  picker={{ options: ["ISO 9001", "ISO 14001", "ISO 45001"], label: "Choose Standard" }}
                  cta={{ label: "Get Core", href: "/settings", testId: "button-plan-iso-core", style: "accent" }}
                />

                {/* Card 2 — ISO Manager Integrated */}
                <ISOTierCard
                  data-testid="card-plan-iso-integrated"
                  delay={0.1}
                  badge="TIER 2 · MOST POPULAR"
                  title="ISO Manager Integrated"
                  subtitle="Isa Included"
                  price="$499"
                  annual="billed annually · $5,988/yr"
                  setup="+ $1,500 one-time setup fee"
                  capabilities={ISO_INTEGRATED_CAPABILITIES}
                  cardClass="border-2 border-primary/25 bg-white dark:bg-card"
                  topBarClass="bg-primary"
                  capIconClass="text-primary dark:text-accent"
                  badges={["ISO 9001", "ISO 14001", "ISO 45001"]}
                  cta={{ label: "Get Integrated", href: "/settings", testId: "button-plan-iso-integrated", style: "primary" }}
                />

                {/* Card 3 — ISO Manager Specialist */}
                <ISOTierCard
                  data-testid="card-plan-iso-specialist"
                  delay={0.15}
                  badge="TIER 3"
                  title="ISO Manager Specialist"
                  subtitle="Isa Pro Included"
                  price="$699"
                  annual="billed annually · $8,388/yr"
                  setup="+ $2,500–$5,000 one-time setup fee"
                  capabilities={ISO_SPECIALIST_CAPABILITIES}
                  cardClass="border border-accent/30 bg-white dark:bg-card"
                  topBarClass="bg-accent"
                  capIconClass="text-accent"
                  picker={{ options: ["IATF 16949", "AS9100 Rev D", "ISO 13485"], label: "Choose Standard" }}
                  cta={{ label: "Talk to ACSI", href: "mailto:info@acsi-quality.com", testId: "button-plan-iso-specialist", style: "accent", external: true }}
                />

                {/* Card 4 — ISO Manager PRO */}
                <ISOTierCard
                  data-testid="card-plan-iso-pro"
                  delay={0.2}
                  badge="TIER 4 · FULL PLATFORM"
                  title="ISO Manager PRO"
                  subtitle="Isa Pro Included"
                  price="$899"
                  annual="billed annually · $10,788/yr"
                  setup="+ $5,000 one-time setup fee"
                  capabilities={ISO_PRO_CAPABILITIES}
                  cardClass="bg-primary"
                  topBarClass="bg-accent"
                  capIconClass="text-accent"
                  dark
                  coreBadges={["9001", "14001", "45001"]}
                  picker={{ options: ["IATF 16949", "AS9100 Rev D", "ISO 13485"], label: "Choose Specialist" }}
                  cta={{ label: "Talk to ACSI", href: "mailto:info@acsi-quality.com", testId: "button-plan-iso-pro", style: "accent", external: true }}
                />

              </div>
            </div>
          </div>
        </div>

        {/* ── CESAR callout ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/60 bg-white dark:bg-card shadow-sm" data-testid="card-cesar-callout">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img src={acsiLogo} alt="ACSI" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Car className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">IATF 16949 · CSR Management</span>
                </div>
                <p className="text-xs text-primary font-bold">Need CSR Management?{" "}
                  <span className="text-muted-foreground font-normal">Customer Specific Requirements are handled by <strong className="text-primary">CESAR</strong> — ACSI's purpose-built platform for automotive suppliers under IATF 16949. Covers CSR assignment, employee training, and compliance self-assessments.</span>
                </p>
              </div>
              <Link href="/cesar" className="shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5 border-border/60 hover:border-accent/40 hover:text-accent text-xs font-semibold whitespace-nowrap" data-testid="button-meet-cesar">
                  Meet CESAR <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

      </div>
    </ScrollArea>
  );
}

/* ─── CHAT INTERFACE ──────────────────────────────────── */
function ISOChatInterface({
  conversationId, onMessageSent, isPro,
}: {
  conversationId: number;
  onMessageSent?: () => void;
  isPro: boolean;
}) {
  const { messages, sendMessage, isStreaming, limitReached } = useIsaChatStream(conversationId, onMessageSent);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || limitReached || isStreaming) return;
    sendMessage(input);
    setInput("");
    setTimeout(() => onMessageSent?.(), 500);
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div key={idx}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                  msg.role === "user" ? "bg-primary text-primary-foreground border-primary/20" : "bg-white dark:bg-card border-border/60"
                }`}>
                  {msg.role === "user"
                    ? <span className="text-[10px] font-bold">You</span>
                    : <img src={acsiLogo} alt="Isa" className="w-5 h-5 object-contain" />
                  }
                </div>
                <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-primary">Isa</span>
                      <span className="text-[10px] text-muted-foreground">Lead ISO Auditor AI</span>
                      {isPro && <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 rounded px-1 font-semibold">Pro</span>}
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
                      : "bg-white dark:bg-card border border-border/60 text-primary rounded-tl-sm"
                  }`}>
                    {msg.role === "user"
                      ? msg.content
                      : <IsaMarkdown content={msg.content} />
                    }
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isStreaming && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-card border border-border/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <img src={acsiLogo} alt="Isa" className="w-5 h-5 object-contain animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-primary">Isa</span>
                  <span className="text-[10px] text-muted-foreground">auditing your question…</span>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-card border border-border/60 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-accent"
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {limitReached && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-6 text-center border-border/60 shadow-sm">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-accent/20">
                  <Lock className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-bold text-primary mb-1">Preview complete</p>
                <p className="text-xs text-muted-foreground mb-4">Upgrade to continue your ISO consultation with Isa</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/settings">
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold text-xs" data-testid="button-upgrade-from-chat">
                      Get Isa — $99/mo
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 text-xs font-semibold">
                      Isa Pro — $199/mo
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 bg-white dark:bg-card border-t border-border/60 px-4 py-4 shadow-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={limitReached ? "Upgrade to continue…" : isStreaming ? "Isa is analyzing…" : "Ask about gap analysis, audit readiness, clause requirements, NCs…"}
            disabled={isStreaming || limitReached}
            className="flex-1 bg-muted/40 border-border/70 focus:border-accent focus:ring-accent/20 h-11"
            data-testid="input-iso-message" />
          <Button type="submit" disabled={isStreaming || limitReached || !input.trim()}
            className="bg-accent hover:bg-accent/90 text-white h-11 px-4 gap-1.5 font-semibold"
            data-testid="button-send-iso-message">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
          Isa cites clause numbers and uses ACSI's field-proven auditing methodology
        </p>
      </div>
    </div>
  );
}


/* ─── MARKDOWN RENDERER ───────────────────────────────── */
function inlineFormat(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-accent">{part.slice(1, -1)}</code>;
    return part;
  });
}

function IsaMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={key} className="my-2 space-y-1 pl-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span>{inlineFormat(item)}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (/^---+$|^\*\*\*+$/.test(trimmed)) {
      flushList(`pre-hr-${i}`);
      nodes.push(<hr key={i} className="my-3 border-border/30" />);
      return;
    }

    const h3 = trimmed.match(/^###\s+(.*)/);
    if (h3) { flushList(`pre-h3-${i}`); nodes.push(<p key={i} className="font-bold text-sm mt-3 mb-1 text-primary">{inlineFormat(h3[1])}</p>); return; }

    const h2 = trimmed.match(/^##\s+(.*)/);
    if (h2) { flushList(`pre-h2-${i}`); nodes.push(<p key={i} className="font-bold text-sm mt-3 mb-1 text-primary">{inlineFormat(h2[1])}</p>); return; }

    const h1 = trimmed.match(/^#\s+(.*)/);
    if (h1) { flushList(`pre-h1-${i}`); nodes.push(<p key={i} className="font-bold text-base mt-3 mb-1 text-primary">{inlineFormat(h1[1])}</p>); return; }

    const bullet = trimmed.match(/^[-*•]\s+(.*)/);
    if (bullet) { listItems.push(bullet[1]); return; }

    const numbered = trimmed.match(/^\d+\.\s+(.*)/);
    if (numbered) { listItems.push(numbered[1]); return; }

    if (trimmed === "") {
      flushList(`pre-empty-${i}`);
      nodes.push(<div key={i} className="h-1.5" />);
      return;
    }

    flushList(`pre-p-${i}`);
    nodes.push(<p key={i} className="leading-relaxed">{inlineFormat(trimmed)}</p>);
  });

  flushList("final");

  return <div className="space-y-0.5 text-sm">{nodes}</div>;
}

function ModuleNavButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  testId 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  testId: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full justify-start gap-3 h-9 px-3 transition-all ${
        active 
          ? "bg-accent/10 text-accent font-bold border border-accent/20" 
          : "text-muted-foreground hover:bg-muted"
      }`}
      data-testid={testId}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-accent" : "opacity-70"}`} />
      <span className="truncate">{label}</span>
    </Button>
  );
}
