import { useState, useRef, useEffect, Fragment, FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsaConversations, useCreateIsaConversation, useIsaChatStream } from "@/hooks/use-isa-chat";
import { useToast } from "@/hooks/use-toast";
import { useQuestionUsage, useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { ProductGate, PRODUCT_CONFIGS } from "@/components/ProductGate";
import { ContextPrintDocuments } from "@/components/ContextPrintDocuments";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Send, Lock, Sparkles, ChevronRight, ChevronDown, ChevronUp, Award,
  ClipboardCheck, FileSearch, BookOpen, Shield, Layers,
  CheckCircle2, MessageSquare, Zap, Star, Activity,
  AlertTriangle, Menu, FileText, Car, Vault,
  Building2, Users, Factory, ArrowRight, ArrowLeft,
  X, Tag, Target, MapPin, Trash2, FolderOpen, RotateCcw,
  Mail, BarChart2, GraduationCap, Loader2, Compass, Globe, TrendingUp,
  TrendingDown, Lightbulb, AlertCircle, UserCheck, ChevronLeft, Printer, Truck,
  Gauge, Wrench, ShieldAlert, Pencil,
} from "lucide-react";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import { apiRequest } from "@/lib/queryClient";
import type { IsoProject } from "@shared/schema";
import { NonconformanceManager } from "./NonconformanceManager";
import { DocumentationModule } from "./DocumentationModule";
import { InternalAuditModule } from "./InternalAuditModule";
import LayeredProcessAuditModule from "./LayeredProcessAuditModule";
import { TrainingAwarenessModule } from "./TrainingAwarenessModule";
import { ProcessMapModule, type ProcessEntry } from "./ProcessMapModule";
import RiskAssessmentModule from "./RiskAssessmentModule";
import MeasurementModule from "./MeasurementModule";
import { CalibrationModule } from "./CalibrationModule";
import { PreventiveMaintenanceModule } from "./PreventiveMaintenanceModule";
import ManagementReviewModule from "./ManagementReviewModule";
import CommunicationModule from "./CommunicationModule";
import RolesRaciModule from "./RolesRaciModule";
import APQPModule from "./APQPModule";
import SupplierModule from "./SupplierModule";
import GlobalIsaWidget from "./GlobalIsaWidget";

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
type IsoRoleType = 'librarian' | 'trainer' | 'auditor' | null | undefined;

const ROLE_LABELS: Record<string, string> = {
  librarian: "Librarian",
  trainer: "Trainer",
  auditor: "Auditor",
};

const ROLE_COLORS: Record<string, string> = {
  librarian: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40",
  trainer: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40",
  auditor: "bg-accent/10 text-accent border-accent/30",
};

type SectionKey = 'context_org' | 'nc' | 'documentation' | 'process_map' | 'system_profile' | 'roles_raci' | 'communication' | 'risk' | 'management_review' | 'internal_audit' | 'lpa' | 'training' | 'measurement' | 'apqp' | 'supplier_management' | 'calibration' | 'preventive_maintenance';

const ROLE_SECTION_ACCESS: Record<SectionKey, IsoRoleType[]> = {
  context_org:       [null, undefined, 'librarian', 'trainer', 'auditor'],
  nc:                [null, undefined, 'librarian', 'trainer', 'auditor'],
  documentation:     [null, undefined, 'librarian', 'trainer', 'auditor'],
  process_map:       [null, undefined, 'librarian', 'trainer', 'auditor'],
  system_profile:    [null, undefined, 'librarian', 'trainer', 'auditor'],
  roles_raci:        [null, undefined, 'librarian', 'trainer', 'auditor'],
  apqp:              [null, undefined, 'librarian', 'trainer', 'auditor'],
  communication:     [null, undefined, 'trainer', 'auditor'],
  training:          [null, undefined, 'trainer', 'auditor'],
  risk:              [null, undefined, 'auditor'],
  management_review: [null, undefined, 'auditor'],
  internal_audit:    [null, undefined, 'auditor'],
  lpa:               [null, undefined, 'auditor'],
  measurement:          [null, undefined, 'auditor'],
  supplier_management:      [null, undefined, 'auditor'],
  calibration:              [null, undefined, 'auditor'],
  preventive_maintenance:   [null, undefined, 'auditor'],
};

function canAccessSection(section: SectionKey, role: IsoRoleType, isSuperadmin: boolean): boolean {
  if (isSuperadmin) return true;
  return ROLE_SECTION_ACCESS[section].includes(role as IsoRoleType);
}

const ROLE_UPGRADE_MSG: Partial<Record<SectionKey, string>> = {
  communication: "Communication module requires the Trainer tier or above.",
  training:      "Training & Awareness requires the Trainer tier or above.",
  risk:          "Risk Assessment requires the Auditor tier.",
  management_review: "Management Review requires the Auditor tier.",
  internal_audit:    "Internal Audits requires the Auditor tier.",
  lpa:               "Layered Process Audits requires the Auditor tier.",
  measurement:       "Measurement & Monitoring requires the Auditor tier.",
};

export default function ISOManager() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { data: subStatus, isLoading: subLoading } = useSubscriptionStatus();
  const { data: conversations } = useIsaConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateIsaConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('context_org');
  const [isaDrawerOpen, setIsaDrawerOpen] = useState(false);
  const [isaInitialPrompt, setIsaInitialPrompt] = useState<string | null>(null);

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
      setActiveConversationId(null);
    } else {
      createProjectMut.mutate();
    }
  };

  const handleResetProject = () => deleteProjectMut.mutate();

  const isPro = !!usageData?.isPro;
  const canAsk = !!usageData?.canAsk;
  const isoRole = (user?.isoRole as IsoRoleType) ?? null;
  const isSuperadmin = !!user?.isSuperadmin;

  const handleSectionChange = (section: SectionKey) => {
    if (!canAccessSection(section, isoRole, isSuperadmin)) return;
    setActiveSection(section);
  };

  const handleNewChat = (initialPrompt?: string) => {
    const title = initialPrompt ? initialPrompt.slice(0, 50) + "…" : "New ISO Consultation";
    createConversation({ title, source: "module" }, {
      onSuccess: (data: any) => {
        setActiveConversationId(data.id);
        setActiveSection('context_org');
        setSidebarOpen(true);
        setShowWizard(false);
      },
    });
  };

  const handleAskIsa = (prompt: string) => {
    if (activeConversationId) {
      // Resume existing session — send the new prompt into the existing conversation
      setIsaInitialPrompt(prompt);
      setIsaDrawerOpen(true);
      return;
    }
    createConversation({ title: "Isa: " + prompt.slice(0, 40), source: "module" }, {
      onSuccess: (data: any) => {
        setActiveConversationId(data.id);
        setIsaInitialPrompt(prompt);
        setIsaDrawerOpen(true);
        // Stay in current module — Isa opens as a side panel overlay
      }
    });
  };

  const handleCloseIsaDrawer = () => {
    setIsaDrawerOpen(false);
    // Keep activeConversationId alive — session resumes on next "Ask Isa" click
    setIsaInitialPrompt(null);
  };

  const handleNewIsaSession = () => {
    setIsaDrawerOpen(false);
    setActiveConversationId(null);
    setIsaInitialPrompt(null);
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

  const LockedModuleView = ({ section }: { section: SectionKey }) => {
    const msg = ROLE_UPGRADE_MSG[section] ?? "This module is not available on your current plan.";
    const tierNeeded = ['risk','management_review','internal_audit','lpa','measurement'].includes(section) ? "Auditor" : "Trainer";
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-primary mb-2">Module Locked</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{msg}</p>
          </div>
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-left">
            <p className="text-xs font-bold text-accent uppercase tracking-wide mb-1">Required Tier</p>
            <p className="text-sm font-semibold text-primary">{tierNeeded} — ISO Manager</p>
            <p className="text-xs text-muted-foreground mt-1">Contact ACSI to upgrade your plan.</p>
          </div>
          <Button
            onClick={() => window.open("mailto:info@acsi-quality.com?subject=ISO Manager Upgrade Request", "_blank")}
            className="bg-accent hover:bg-accent/90 text-white gap-2"
            data-testid="button-contact-upgrade"
          >
            <Mail className="w-4 h-4" /> Contact ACSI to Upgrade
          </Button>
        </motion.div>
      </div>
    );
  };

  const hasIsoAccess = !!subStatus?.hasIsoManager || !!subStatus?.isAdmin || !!user?.isSuperadmin;

  if (isLoading || subLoading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!hasIsoAccess) {
    return (
      <ProductGate
        hasAccess={false}
        isLoading={false}
        product={PRODUCT_CONFIGS.iso_manager}
        fullPage={true}
      >
        {null}
      </ProductGate>
    );
  }

  // ── BETA GATE ─────────────────────────────────────────────────────────────
  // ISO Manager is in private beta. Only superadmins can access the full
  // module while it is being built. All other subscribers (Isa, ISO Manager
  // plans, etc.) see the waitlist page.
  // TO LAUNCH: delete this entire block (from "// ── BETA GATE" to "// ── END BETA GATE").
  if (!isSuperadmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-accent/10 border-2 border-accent/20 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <div className="inline-block bg-accent text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              Private Beta
            </div>
            <h1 className="text-2xl font-black text-primary mb-2">ISO Manager is Coming Soon</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We're putting the finishing touches on the most comprehensive ISO QMS platform built for manufacturers. 
              Your subscription is confirmed — we'll notify you the moment access opens.
            </p>
          </div>
          <div className="bg-white dark:bg-card border border-border/60 rounded-2xl p-5 text-left space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">What's included when you get access</p>
            {[
              "Process Interaction Map (ISO 4.4 compliant)",
              "NC & CAPA with AI-suggested root causes",
              "Documentation library with version control",
              "Clause Coverage Map & Gap Analysis",
              "Risk Register, Internal Audit & Management Review",
              "Isa — your AI Lead ISO Auditor, always available",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                <span className="text-sm text-primary">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:team@corecompliancehub.com" className="text-accent font-semibold hover:underline">
              team@corecompliancehub.com
            </a>
          </p>
        </div>
      </div>
    );
  }
  // ── END BETA GATE ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">

        {/* ── SIDEBAR ── */}
        <div className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-200 flex-shrink-0 flex flex-col bg-card border-r border-border/50`}>

          {/* Sidebar Header */}
          <div className={`flex items-center border-b border-border/50 h-16 px-3 shrink-0 ${sidebarOpen ? "gap-3" : "justify-center"}`}>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-muted border border-border/60 flex items-center justify-center shadow-sm">
                <img src={acsiLogo} alt="ACSI" className="w-7 h-7 object-contain" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-primary">Isa</span>
                  {isPro && <Badge className="bg-accent/10 text-accent border-accent/30 text-[9px] px-1 py-0 font-bold">Pro</Badge>}
                  {isoRole && ROLE_LABELS[isoRole] && (
                    <Badge className={`text-[9px] px-1 py-0 font-bold border ${ROLE_COLORS[isoRole]}`} data-testid="badge-iso-role">
                      {ROLE_LABELS[isoRole]}
                    </Badge>
                  )}
                </div>
                {project?.status === "complete" && project.orgName ? (
                  <p className="text-[11px] text-accent font-semibold truncate">{project.orgName}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground truncate">Lead ISO Auditor AI</p>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Nav Content */}
          <div className="flex-1 overflow-y-auto px-2 py-3">

            {/* New Consultation */}
            {sidebarOpen ? (
              <Button onClick={() => { setActiveSection('context_org'); setActiveConversationId(null); handleNewChat(); }}
                disabled={isCreating}
                className="w-full gap-2 mb-3 bg-accent hover:bg-accent/90 text-white text-sm"
                data-testid="button-new-iso-chat">
                <Plus className="w-4 h-4" /> New Consultation
              </Button>
            ) : (
              <button onClick={() => { setActiveSection('context_org'); setActiveConversationId(null); handleNewChat(); }}
                disabled={isCreating}
                title="New Consultation"
                className="w-full flex items-center justify-center h-9 mb-3 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                data-testid="button-new-iso-chat">
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* Setup */}
            {sidebarOpen && (
              <div className="pt-1 pb-1">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">Setup</span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              </div>
            )}
            <div className="space-y-0.5">
              {(["system_profile"] as SectionKey[]).map((section) => {
                const META: Record<string, { icon: any; label: string }> = {
                  system_profile: { icon: Building2, label: "My System Profile" },
                };
                const { icon, label } = META[section];
                const locked = !canAccessSection(section, isoRole, isSuperadmin);
                return (
                  <ModuleNavButton key={section} active={activeSection === section}
                    onClick={() => handleSectionChange(section)} icon={icon} label={label}
                    testId={`nav-${section.replace(/_/g, '-')}`} locked={locked} collapsed={!sidebarOpen} />
                );
              })}
            </div>

            {/* Core Modules */}
            {sidebarOpen && (
              <div className="pt-3 pb-1">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">Core</span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              </div>
            )}
            {!sidebarOpen && <div className="my-2 h-px bg-border/40 mx-2" />}
            <div className="space-y-0.5">
              {(["context_org","process_map","nc","documentation","roles_raci","communication","risk","management_review","internal_audit","lpa","training","measurement"] as SectionKey[]).map((section) => {
                const META: Record<string, { icon: any; label: string }> = {
                  context_org:        { icon: Compass,       label: "Context of the Org" },
                  process_map:        { icon: MapPin,        label: "Process Maps" },
                  nc:                 { icon: Shield,        label: "NC & CAPA" },
                  documentation:      { icon: FileText,      label: "Documentation" },
                  roles_raci:         { icon: Users,         label: "Roles & RACI" },
                  communication:      { icon: Mail,          label: "Communication" },
                  risk:               { icon: AlertTriangle, label: "Risk Assessment" },
                  management_review:  { icon: BarChart2,     label: "Management Review" },
                  internal_audit:     { icon: ClipboardCheck,label: "Internal Audits" },
                  lpa:                { icon: Layers,        label: "Layered Process Audits" },
                  training:           { icon: GraduationCap, label: "Training" },
                  measurement:        { icon: Activity,      label: "Measurement" },
                };
                const { icon, label } = META[section];
                const locked = !canAccessSection(section, isoRole, isSuperadmin);
                return (
                  <ModuleNavButton key={section} active={activeSection === section}
                    onClick={() => handleSectionChange(section)} icon={icon} label={label}
                    testId={`nav-${section.replace(/_/g, '-')}`} locked={locked} collapsed={!sidebarOpen} />
                );
              })}
            </div>

            {/* Advanced Modules */}
            {sidebarOpen && (
              <div className="pt-3 pb-1">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">Advanced</span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              </div>
            )}
            {!sidebarOpen && <div className="my-2 h-px bg-border/40 mx-2" />}
            <div className="space-y-0.5">
              {(["supplier_management","apqp","calibration","preventive_maintenance"] as SectionKey[]).map((section) => {
                const META: Record<string, { icon: any; label: string }> = {
                  supplier_management:    { icon: Truck,   label: "Supplier Mgmt" },
                  apqp:                   { icon: Layers,  label: "APQP / Programs" },
                  calibration:            { icon: Gauge,   label: "Calibration" },
                  preventive_maintenance: { icon: Wrench,  label: "Maintenance" },
                };
                const { icon, label } = META[section];
                const locked = !canAccessSection(section, isoRole, isSuperadmin);
                return (
                  <ModuleNavButton key={section} active={activeSection === section}
                    onClick={() => handleSectionChange(section)} icon={icon} label={label}
                    testId={`nav-${section.replace(/_/g, '-')}`} locked={locked} collapsed={!sidebarOpen} />
                );
              })}
            </div>

            {/* Recent Sessions (only when expanded) */}
            {sidebarOpen && (
              <>
                <div className="pt-3 pb-1">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0">Recent</span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  {!conversations?.length && (
                    <p className="text-xs text-muted-foreground/50 text-center py-3">No sessions yet</p>
                  )}
                  {conversations?.map((conv: any) => (
                    <button key={conv.id} onClick={() => { setActiveConversationId(conv.id); setActiveSection('context_org'); }}
                      data-testid={`button-iso-conversation-${conv.id}`}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 truncate ${
                        activeConversationId === conv.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}>
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar Footer */}
          {sidebarOpen && usageData && !isPro && (
            <div className="px-3 pt-3 border-t border-border/50">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Preview questions</span>
                <span>{usageData.questionCount} / {usageData.freeLimit}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="bg-accent h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (usageData.questionCount / usageData.freeLimit) * 100)}%` }} />
              </div>
              <Link href="/settings">
                <button className="mt-2 w-full text-xs text-accent hover:text-accent/80 flex items-center gap-1 font-medium transition-colors">
                  <Zap className="w-3 h-3" /> Upgrade to Isa Pro
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </button>
              </Link>
            </div>
          )}
          {/* Back to Dashboard */}
          <div className={`px-2 py-3 border-t border-border/50 ${!sidebarOpen ? "flex justify-center" : ""}`}>
            <Link href="/employer">
              <button
                data-testid="button-back-to-dashboard"
                title="Back to Dashboard"
                className={`text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 font-medium transition-colors rounded-lg px-2 py-1.5 hover:bg-muted w-full ${!sidebarOpen ? "justify-center" : ""}`}
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                {sidebarOpen && <span>Back to Dashboard</span>}
              </button>
            </Link>
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
              <Link href="/employer">
                <button
                  data-testid="button-topbar-dashboard"
                  title="Back to Dashboard"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium px-2 py-1 rounded-md hover:bg-muted transition-colors border border-border/50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </Link>
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

          {/*
            ── SCROLL PATTERN RULES — DO NOT BREAK (see replit.md rule #9) ──────
            Two patterns exist. Never mix them on the same module.

            PATTERN A (module owns its scroll via ScrollArea):
              wrapper  → flex-1 min-h-0 overflow-hidden flex flex-col
              module   → flex-1 min-h-0 flex flex-col  (or overflow-hidden flex flex-col)
              inside   → <ScrollArea className="flex-1">   ← NEVER h-full
            Modules:  documentation, context_org, system_profile, roles_raci,
                      apqp, internal_audit, training

            PATTERN B (wrapper owns the scroll, no ScrollArea in module):
              wrapper  → flex-1 min-h-0 overflow-y-auto
              module   → plain layout, no overflow class needed
            Modules:  nc, process_map, communication, risk, management_review,
                      measurement
            ─────────────────────────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col relative">
            {showWizard && project ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <ISOSetupWizard project={project} onComplete={() => { setShowWizard(false); qc.invalidateQueries({ queryKey: ["/api/iso-projects"] }); }} />
              </div>
            ) : activeSection === 'documentation' ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <DocumentationModule onAskIsa={handleAskIsa} />
              </div>
            ) : activeSection === 'context_org' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ContextOfOrgModule project={project ?? null} onStartWizard={handleStartWizard} onAskIsa={handleAskIsa} onNavigate={setActiveSection} />
              </div>
            ) : activeSection === 'system_profile' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <SystemProfileModule project={project ?? null} onStartWizard={handleStartWizard} />
              </div>
            ) : activeSection === 'roles_raci' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <RolesRaciModule project={project ?? null} onStartWizard={handleStartWizard} />
              </div>
            ) : activeSection === 'apqp' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <APQPModule isoProjectId={project?.id} />
              </div>
            ) : activeSection === 'nc' ? (
              <div className="flex-1 overflow-y-auto min-h-0">
                <NonconformanceManager onAskIsa={handleAskIsa} />
              </div>
            ) : activeSection === 'process_map' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ProcessMapModule project={project ?? null} onStartWizard={handleStartWizard} />
              </div>
            ) : activeSection === 'communication' ? (
              <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">
                {canAccessSection('communication', isoRole, isSuperadmin)
                  ? <CommunicationModule isoProjectId={project?.id} />
                  : <LockedModuleView section="communication" />}
              </div>
            ) : activeSection === 'risk' ? (
              <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">
                {canAccessSection('risk', isoRole, isSuperadmin)
                  ? <RiskAssessmentModule isoProjectId={project?.id} />
                  : <LockedModuleView section="risk" />}
              </div>
            ) : activeSection === 'management_review' ? (
              <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">
                {canAccessSection('management_review', isoRole, isSuperadmin)
                  ? <ManagementReviewModule isoProjectId={project?.id} standard={project?.standard} onGoToMeasurement={() => setActiveSection('measurement')} />
                  : <LockedModuleView section="management_review" />}
              </div>
            ) : activeSection === 'internal_audit' ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                {canAccessSection('internal_audit', isoRole, isSuperadmin)
                  ? <InternalAuditModule onAskIsa={handleAskIsa} />
                  : <div className="overflow-y-auto p-4 sm:p-6 h-full"><LockedModuleView section="internal_audit" /></div>}
              </div>
            ) : activeSection === 'lpa' ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                {canAccessSection('lpa', isoRole, isSuperadmin)
                  ? <LayeredProcessAuditModule />
                  : <div className="overflow-y-auto p-4 sm:p-6 h-full"><LockedModuleView section="lpa" /></div>}
              </div>
            ) : activeSection === 'training' ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                {canAccessSection('training', isoRole, isSuperadmin)
                  ? <TrainingAwarenessModule onAskIsa={handleAskIsa} />
                  : <div className="overflow-y-auto p-4 sm:p-6 h-full"><LockedModuleView section="training" /></div>}
              </div>
            ) : activeSection === 'measurement' ? (
              <div className="flex-1 overflow-y-auto min-h-0">
                {canAccessSection('measurement', isoRole, isSuperadmin)
                  ? <MeasurementModule isoProjectId={project?.id} />
                  : <div className="p-4 sm:p-6"><LockedModuleView section="measurement" /></div>}
              </div>
            ) : activeSection === 'supplier_management' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {canAccessSection('supplier_management', isoRole, isSuperadmin)
                  ? <SupplierModule project={project} />
                  : <div className="p-4 sm:p-6"><LockedModuleView section="supplier_management" /></div>}
              </div>
            ) : activeSection === 'calibration' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {canAccessSection('calibration', isoRole, isSuperadmin)
                  ? <CalibrationModule project={project} />
                  : <div className="p-4 sm:p-6"><LockedModuleView section="calibration" /></div>}
              </div>
            ) : activeSection === 'preventive_maintenance' ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {canAccessSection('preventive_maintenance', isoRole, isSuperadmin)
                  ? <PreventiveMaintenanceModule project={project} />
                  : <div className="p-4 sm:p-6"><LockedModuleView section="preventive_maintenance" /></div>}
              </div>
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
            {/* Global Isa widget — always accessible from any module */}
            {!showWizard && !activeConversationId && !isaDrawerOpen && (
              <GlobalIsaWidget project={project ?? null} activeSection={activeSection} />
            )}

            {/* Isa Drawer — slides in from right over current module */}
            <AnimatePresence>
              {isaDrawerOpen && activeConversationId && (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                  className="absolute inset-y-0 right-0 w-[420px] max-w-[90%] bg-card border-l border-border shadow-2xl z-30 flex flex-col"
                >
                  <div className="h-11 flex items-center px-4 border-b border-border shrink-0 bg-card gap-2">
                    <img src={acsiLogo} alt="Isa" className="w-5 h-5 object-contain shrink-0" />
                    <span className="text-sm font-bold text-primary">Ask Isa</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">· ISO Auditor AI</span>
                    <div className="ml-auto flex items-center gap-2">
                      {isPro ? (
                        <Badge className="bg-accent/10 text-accent border-accent/30 text-xs gap-1">
                          <Star className="w-3 h-3" /> Pro
                        </Badge>
                      ) : null}
                      <button
                        onClick={handleNewIsaSession}
                        className="text-xs text-muted-foreground hover:text-accent px-2 py-1 rounded hover:bg-accent/10 transition-colors border border-transparent hover:border-accent/20"
                        data-testid="button-new-isa-session"
                        title="Start a new Isa session"
                      >
                        + New Session
                      </button>
                      <button
                        onClick={handleCloseIsaDrawer}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted transition-colors"
                        data-testid="button-close-isa-drawer"
                        title="Close panel (session stays active)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ISOChatInterface conversationId={activeConversationId} onMessageSent={() => refetchUsage()} isPro={isPro} initialPrompt={isaInitialPrompt ?? undefined} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
    </div>
  );
}

/* ─── ISO SETUP WIZARD ──────────────────────────────────── */

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
  const [procKpiTarget, setProcKpiTarget] = useState("");
  const [procKpiUnit, setProcKpiUnit] = useState("");
  const [procObjectives, setProcObjectives] = useState("");
  const [procInputs, setProcInputs] = useState("");
  const [procOutputs, setProcOutputs] = useState("");
  const [procClauses, setProcClauses] = useState<string[]>([]);
  const [showAdvancedProc, setShowAdvancedProc] = useState(false);
  const [procExecutors, setProcExecutors] = useState("");
  const [procResources, setProcResources] = useState("");
  const [procStartPoint, setProcStartPoint] = useState("");
  const [procEndPoint, setProcEndPoint] = useState("");
  const [procActivities, setProcActivities] = useState("");
  const [procRisks, setProcRisks] = useState("");
  const [procDocInfo, setProcDocInfo] = useState("");
  const [procCSR, setProcCSR] = useState("");
  const [procSite, setProcSite] = useState<"PLANT" | "REMOTE_SITE" | "CORPORATE">("PLANT");
  const [procRow, setProcRow] = useState("");

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
    const isIATF = standard.includes("IATF");
    const newProc: ProcessEntry = {
      name: procName, owner: procOwner, kpi: procKPI, kpiTarget: procKpiTarget || undefined, kpiUnit: procKpiUnit || undefined,
      objectives: procObjectives || undefined, inputs: procInputs, outputs: procOutputs, clauses: procClauses,
      executors: procExecutors || undefined, resources: procResources || undefined,
      startingPoint: procStartPoint || undefined, endPoint: procEndPoint || undefined,
      keyActivities: procActivities || undefined, risksAndOpportunities: procRisks || undefined,
      documentedInfo: procDocInfo || undefined,
      csrReq: isIATF && procCSR ? procCSR : undefined,
      site: isIATF ? procSite : undefined,
      row: procRow || undefined,
    };
    setProcesses(prev => [...prev, newProc]);
    setProcName(""); setProcOwner(""); setProcKPI(""); setProcKpiTarget(""); setProcKpiUnit(""); setProcObjectives("");
    setProcInputs(""); setProcOutputs(""); setProcClauses([]);
    setProcExecutors(""); setProcResources(""); setProcStartPoint(""); setProcEndPoint("");
    setProcActivities(""); setProcRisks(""); setProcDocInfo(""); setProcCSR(""); setProcSite("PLANT"); setProcRow("");
    setShowAdvancedProc(false);
    setAddingProc(false);
  };

  const goToPhase3 = async () => {
    await patchMut.mutateAsync({ processes, phase: 3 });
    for (const proc of processes) {
      const objName = proc.objectives?.trim() || proc.kpi?.trim();
      if (objName) {
        await fetch("/api/iso-objectives/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            processName: proc.name,
            name: objName,
            target: proc.kpiTarget ?? "",
            unit: proc.kpiUnit ?? "",
            responsible: proc.owner,
            isoProjectId: project.id,
          }),
        });
      }
    }
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
      <div className="flex flex-col flex-1 bg-white dark:bg-card overflow-hidden" data-testid="wizard-questions-pane">
        {/* Progress Bar */}
        <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex gap-2">
            {phaseLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${phase === i + 1 ? "bg-accent" : phase > i + 1 ? "bg-accent/40" : "bg-border/40"}`} />
                <p className={`text-[10px] font-bold mt-1 truncate ${phase === i + 1 ? "text-accent" : "text-muted-foreground/50"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Isa Avatar */}
        <div className="shrink-0 flex items-center gap-3 px-8 pt-5 pb-2 max-w-2xl mx-auto w-full">
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
          <div className="px-8 py-6 max-w-2xl mx-auto">
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
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-3">
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Process Objective (what this process aims to achieve)</label>
                            <Input value={procObjectives} onChange={e => setProcObjectives(e.target.value)} placeholder="e.g., Maintain supplier OTD above 95% to ensure on-time production" data-testid="input-wizard-proc-objectives" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">KPI Target</label>
                            <Input value={procKpiTarget} onChange={e => setProcKpiTarget(e.target.value)} placeholder="e.g., 95" data-testid="input-wizard-proc-kpi-target" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Unit</label>
                            <Input value={procKpiUnit} onChange={e => setProcKpiUnit(e.target.value)} placeholder="e.g., %" data-testid="input-wizard-proc-kpi-unit" />
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
                        {/* Advanced Details toggle */}
                        <div className="border border-border/40 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-muted/30"
                            onClick={() => setShowAdvancedProc(v => !v)}
                            data-testid="button-wizard-toggle-advanced"
                          >
                            <span>Advanced Turtle Diagram Details (optional)</span>
                            {showAdvancedProc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {showAdvancedProc && (
                            <div className="p-3 space-y-2 bg-white dark:bg-card">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Executors / Who Performs</label>
                                  <Input value={procExecutors} onChange={e => setProcExecutors(e.target.value)} placeholder="Roles executing this process" className="h-7 text-xs" data-testid="input-wizard-proc-executors" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Resources (People, Machines, Tools)</label>
                                  <Input value={procResources} onChange={e => setProcResources(e.target.value)} placeholder="e.g., CNC Machine, QC Staff" className="h-7 text-xs" data-testid="input-wizard-proc-resources" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Starting Point / Trigger</label>
                                  <Input value={procStartPoint} onChange={e => setProcStartPoint(e.target.value)} placeholder="What triggers this process" className="h-7 text-xs" data-testid="input-wizard-proc-start" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">End Point / Completion</label>
                                  <Input value={procEndPoint} onChange={e => setProcEndPoint(e.target.value)} placeholder="How you know it's done" className="h-7 text-xs" data-testid="input-wizard-proc-end" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Key Activities (transformation steps)</label>
                                <Textarea value={procActivities} onChange={e => setProcActivities(e.target.value)} placeholder="Core steps that transform inputs to outputs…" className="text-xs min-h-[50px] resize-none" data-testid="input-wizard-proc-activities" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Risks &amp; Opportunities</label>
                                  <Input value={procRisks} onChange={e => setProcRisks(e.target.value)} placeholder="Key risks and opportunities" className="h-7 text-xs" data-testid="input-wizard-proc-risks" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Documented Information</label>
                                  <Input value={procDocInfo} onChange={e => setProcDocInfo(e.target.value)} placeholder="Procedures, records referenced" className="h-7 text-xs" data-testid="input-wizard-proc-docinfo" />
                                </div>
                              </div>
                              {standard.includes("IATF") && (
                                <>
                                  <div>
                                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Customer Specific Requirements (CSR)</label>
                                    <Input value={procCSR} onChange={e => setProcCSR(e.target.value)} placeholder="Applicable CSR references" className="h-7 text-xs" data-testid="input-wizard-proc-csr" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Site Assignment</label>
                                    <div className="flex gap-2">
                                      {(["PLANT", "REMOTE_SITE", "CORPORATE"] as const).map(s => (
                                        <button key={s} type="button" onClick={() => setProcSite(s)}
                                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${procSite === s ? "bg-accent text-white border-accent" : "border-border/60 text-muted-foreground hover:border-accent/40"}`}
                                          data-testid={`button-wizard-proc-site-${s.toLowerCase()}`}>{s.replace("_", " ")}</button>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
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
        <div className="shrink-0 border-t border-border/60 bg-muted/20">
          <div className="flex items-center gap-3 px-8 py-4 max-w-2xl mx-auto">
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
  return <p className="text-xs text-muted-foreground/40 italic">Not yet configured.</p>;
}

/* ─── CONTEXT OF THE ORGANIZATION MODULE (ISO 4.1 & 4.2) ── */

type PestleKey = 'political' | 'economic' | 'social' | 'technological' | 'legal' | 'environmental';
type SwotKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
type PestleItem = { text: string; type: 'risk' | 'opportunity' };
type InterestedParty = {
  id: string;
  party: string;
  group: 'internal' | 'external';
  relevant: boolean;
  needs: string;
  expectations: string;
  actions: string;
  monitoringMethod: string;
  risks: string;
  opportunities: string;
  piRanking: 'manage_closely' | 'keep_informed' | 'keep_satisfied' | 'monitor_only' | '';
};

const PESTLE_CONFIG: { key: PestleKey; label: string; icon: any; color: string; desc: string }[] = [
  { key: 'political',     label: 'Political',     icon: Globe,        color: 'text-blue-600',   desc: 'Government policy, trade regulations, political stability' },
  { key: 'economic',      label: 'Economic',      icon: TrendingUp,   color: 'text-green-600',  desc: 'Market conditions, interest rates, inflation, supply chain costs' },
  { key: 'social',        label: 'Social',        icon: Users,        color: 'text-purple-600', desc: 'Workforce demographics, customer expectations, cultural trends' },
  { key: 'technological', label: 'Technological', icon: Zap,          color: 'text-yellow-600', desc: 'Automation, digitization, emerging technologies, cybersecurity' },
  { key: 'legal',         label: 'Legal',         icon: Shield,       color: 'text-red-600',    desc: 'Employment law, environmental regulations, product liability' },
  { key: 'environmental', label: 'Environmental', icon: Compass,      color: 'text-emerald-600',desc: 'Climate impact, sustainability, waste regulations, energy use' },
];

const SWOT_CONFIG: { key: SwotKey; label: string; icon: any; color: string; bg: string; desc: string }[] = [
  { key: 'strengths',     label: 'Strengths',     icon: TrendingUp,   color: 'text-green-700',  bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/30',  desc: 'Internal advantages — capabilities, certifications, customer relationships' },
  { key: 'weaknesses',    label: 'Weaknesses',    icon: TrendingDown, color: 'text-red-700',    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30',          desc: 'Internal gaps — resource constraints, skill gaps, process inefficiencies' },
  { key: 'opportunities', label: 'Opportunities', icon: Lightbulb,    color: 'text-blue-700',   bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30',      desc: 'External factors that could benefit the organization' },
  { key: 'threats',       label: 'Threats',       icon: AlertCircle,  color: 'text-amber-700',  bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30',  desc: 'External risks — competition, economic downturns, regulatory changes' },
];

const PI_RANKING_CONFIG: { value: InterestedParty['piRanking']; label: string; color: string; bg: string }[] = [
  { value: 'manage_closely', label: 'Manage Closely', color: 'text-red-700',    bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/40' },
  { value: 'keep_informed',  label: 'Keep Informed',  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/40' },
  { value: 'keep_satisfied', label: 'Keep Satisfied', color: 'text-green-700',  bg: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/40' },
  { value: 'monitor_only',   label: 'Monitor Only',   color: 'text-muted-foreground', bg: 'bg-muted border-border/60' },
];

const DEFAULT_INTERESTED_PARTIES: InterestedParty[] = [
  { id: "ip-customers",     party: "Customers / End Users",                group: 'external', relevant: true,  needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'manage_closely' },
  { id: "ip-oem",           party: "OEM / Tier 1 Customers",               group: 'external', relevant: false, needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'manage_closely' },
  { id: "ip-regulatory",    party: "Regulatory Bodies (OSHA, EPA, etc.)",  group: 'external', relevant: true,  needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'manage_closely' },
  { id: "ip-certbody",      party: "Certification Body",                   group: 'external', relevant: true,  needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'keep_informed' },
  { id: "ip-suppliers",     party: "Suppliers & Contractors",              group: 'external', relevant: true,  needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'keep_informed' },
  { id: "ip-employees",     party: "Employees & Their Representatives",    group: 'internal', relevant: true,  needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'keep_satisfied' },
  { id: "ip-management",    party: "Senior Management",                    group: 'internal', relevant: true,  needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'manage_closely' },
  { id: "ip-shareholders",  party: "Shareholders / Ownership",             group: 'internal', relevant: true,  needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'manage_closely' },
  { id: "ip-corporate",     party: "Corporate / Parent Company",           group: 'internal', relevant: false, needs: "", expectations: "", actions: "", monitoringMethod: "", risks: "", opportunities: "", piRanking: 'monitor_only' },
];

function normalizePestleItems(raw: any): PestleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) =>
    typeof item === 'string' ? { text: item, type: 'risk' as const } : item
  );
}

function normalizeParty(raw: any): InterestedParty {
  return {
    id:              raw.id || `ip-${Math.random().toString(36).slice(2, 9)}`,
    party:           raw.party || '',
    group:           raw.group || 'external',
    relevant:        raw.relevant ?? true,
    needs:           raw.needs || '',
    expectations:    raw.expectations || '',
    actions:         raw.actions || '',
    monitoringMethod:raw.monitoringMethod || '',
    risks:           raw.risks || '',
    opportunities:   raw.opportunities || '',
    piRanking:       raw.piRanking || '',
  };
}

function ContextOfOrgModule({ project, onStartWizard, onAskIsa, onNavigate }: {
  project: IsoProject | null;
  onStartWizard: () => void;
  onAskIsa: (msg: string) => void;
  onNavigate?: (section: SectionKey) => void;
}) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pestle' | 'swot' | 'interested' | 'strategic' | 'bridge'>('pestle');

  const [activeTools, setActiveTools] = useState<{ pestle: boolean; swot: boolean }>(() => {
    try {
      const stored = localStorage.getItem(`cchub-context-tools-${project?.id}`);
      return stored ? JSON.parse(stored) : { pestle: true, swot: true };
    } catch { return { pestle: true, swot: true }; }
  });

  const toggleTool = (tool: 'pestle' | 'swot') => {
    setActiveTools(prev => {
      const next = { ...prev, [tool]: !prev[tool] };
      if (project?.id) localStorage.setItem(`cchub-context-tools-${project.id}`, JSON.stringify(next));
      if (activeTab === tool && !next[tool]) {
        const fallback = tool === 'pestle' ? (next.swot ? 'swot' : 'interested') : (next.pestle ? 'pestle' : 'interested');
        setActiveTab(fallback);
      }
      return next;
    });
  };

  // ── PESTLE state (normalizes old string[] format to PestleItem[])
  const [pestle, setPestle] = useState<Record<PestleKey, PestleItem[]>>(
    { political: [], economic: [], social: [], technological: [], legal: [], environmental: [] }
  );

  // ── SWOT state
  const [swot, setSwot] = useState<Record<SwotKey, string[]>>(
    { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  );

  // ── Strategic Risk Register state
  type StrategicRisk = {
    id: string;
    source: string;
    description: string;
    type: 'risk' | 'opportunity';
    impact: 'H' | 'M' | 'L';
    likelihood: 'H' | 'M' | 'L';
    rating: 'Critical' | 'High' | 'Medium' | 'Low';
    owner: string;
    response: string;
    status: 'open' | 'in_progress' | 'closed';
  };
  const [strategicRisks, setStrategicRisks] = useState<StrategicRisk[]>([]);
  const [srDialog, setSrDialog] = useState<{ mode: 'add' | 'edit'; item?: StrategicRisk } | null>(null);
  const [srForm, setSrForm] = useState<Omit<StrategicRisk, 'id' | 'rating'>>({
    source: '', description: '', type: 'risk', impact: 'M', likelihood: 'M',
    owner: '', response: '', status: 'open',
  });

  // ── Interested Parties state (normalizes old format)
  const [parties, setParties] = useState<InterestedParty[]>(DEFAULT_INTERESTED_PARTIES);

  // ── Track which project ID has been loaded into local state so we only
  //    hydrate once per project (avoids wiping user edits on re-renders).
  const [loadedProjectId, setLoadedProjectId] = useState<number | null>(null);

  useEffect(() => {
    const proj = project as any;
    if (!proj || proj.id === loadedProjectId) return;

    const d = proj.pestleData;
    if (d) {
      setPestle({
        political:     normalizePestleItems(d.political),
        economic:      normalizePestleItems(d.economic),
        social:        normalizePestleItems(d.social),
        technological: normalizePestleItems(d.technological),
        legal:         normalizePestleItems(d.legal),
        environmental: normalizePestleItems(d.environmental),
      });
    }

    const s = proj.swotData;
    if (s) {
      setSwot(s);
    }

    const ip = proj.interestedParties;
    if (ip && ip.length > 0) {
      setParties(ip.map(normalizeParty));
    }

    const sr = proj.strategicRisks;
    if (sr && sr.length > 0) {
      setStrategicRisks(sr);
    }

    setLoadedProjectId(proj.id);
  }, [project, loadedProjectId]);

  // ── PESTLE add form state
  const [editingPestle, setEditingPestle] = useState<PestleKey | null>(null);
  const [pestleInput, setPestleInput] = useState('');
  const [pestleType, setPestleType] = useState<'risk' | 'opportunity'>('risk');

  // ── SWOT add form state
  const [editingSwot, setEditingSwot] = useState<SwotKey | null>(null);
  const [swotInput, setSwotInput] = useState('');

  // ── Party expand/collapse — uses stable party id, not array index
  const [expandedParties, setExpandedParties] = useState<Set<string>>(new Set());

  // ── Print document state
  const [printDoc, setPrintDoc] = useState<'pestle' | 'swot' | 'parties' | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  // ── Compute strategic risk rating from H/M/L impact × likelihood
  const computeRating = (impact: 'H' | 'M' | 'L', likelihood: 'H' | 'M' | 'L'): 'Critical' | 'High' | 'Medium' | 'Low' => {
    const matrix: Record<string, 'Critical' | 'High' | 'Medium' | 'Low'> = {
      'H-H': 'Critical', 'H-M': 'High',   'H-L': 'Medium',
      'M-H': 'High',     'M-M': 'Medium', 'M-L': 'Low',
      'L-H': 'Medium',   'L-M': 'Low',    'L-L': 'Low',
    };
    return matrix[`${impact}-${likelihood}`] || 'Medium';
  };

  // ── Deduplication prompt state
  type DedupeChoice = 'replace' | 'skip' | 'add_all';
  const [dedupePrompt, setDedupePrompt] = useState<{
    incoming: { source: string; description: string; type: 'risk' | 'opportunity' }[];
    sourcePrefix: string;
    existingCount: number;
    crossSourceCount: number;
  } | null>(null);

  const makeStrategicItems = (
    items: { source: string; description: string; type: 'risk' | 'opportunity' }[]
  ): StrategicRisk[] =>
    items.map(i => ({
      id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      source: i.source,
      description: i.description,
      type: i.type,
      impact: 'M' as const,
      likelihood: 'M' as const,
      rating: 'Medium' as const,
      owner: '',
      response: '',
      status: 'open' as const,
    }));

  const applyDedupeChoice = (
    choice: DedupeChoice,
    incoming: { source: string; description: string; type: 'risk' | 'opportunity' }[],
    sourcePrefix: string
  ) => {
    setDedupePrompt(null);
    let toAdd = incoming;

    if (choice === 'replace') {
      // Remove all existing entries from this source prefix, then add all incoming
      setStrategicRisks(prev => {
        const kept = prev.filter(r => !r.source.startsWith(sourcePrefix));
        const newItems = makeStrategicItems(toAdd);
        toast({
          title: `Replaced with ${newItems.length} item${newItems.length !== 1 ? 's' : ''} from ${sourcePrefix}`,
          description: "Existing entries from this source were removed and replaced.",
        });
        return [...kept, ...newItems];
      });
    } else if (choice === 'skip') {
      // Only add items whose description doesn't already exist in the register
      setStrategicRisks(prev => {
        const existingDescs = new Set(prev.map(r => r.description.toLowerCase().trim()));
        const filtered = toAdd.filter(i => !existingDescs.has(i.description.toLowerCase().trim()));
        const newItems = makeStrategicItems(filtered);
        const skipped = toAdd.length - filtered.length;
        toast({
          title: `${newItems.length} new item${newItems.length !== 1 ? 's' : ''} added${skipped ? `, ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped` : ''}`,
          description: "Existing descriptions were not duplicated.",
        });
        return [...prev, ...newItems];
      });
    } else {
      // Add all, even if duplicates
      setStrategicRisks(prev => {
        const newItems = makeStrategicItems(toAdd);
        toast({
          title: `${newItems.length} item${newItems.length !== 1 ? 's' : ''} added to Strategic Risk Register`,
          description: "Review the register to consolidate any overlapping entries.",
        });
        return [...prev, ...newItems];
      });
    }
    setActiveTab('strategic');
  };

  // ── Add items to Strategic Risk Register — with overlap detection
  const exportToStrategicRegister = (
    items: { source: string; description: string; type: 'risk' | 'opportunity' }[]
  ) => {
    if (!items.length) {
      toast({ title: "Nothing to export", description: "No risk or opportunity items found.", variant: "destructive" });
      return;
    }
    // Detect source prefix (e.g. "4.1 PESTLE", "4.1 SWOT", "4.2")
    const firstSource = items[0].source;
    const sourcePrefix = firstSource.startsWith('4.1 PESTLE') ? '4.1 PESTLE'
      : firstSource.startsWith('4.1 SWOT') ? '4.1 SWOT'
      : firstSource.startsWith('4.2') ? '4.2'
      : firstSource.split('–')[0].trim();

    const existingFromSource = strategicRisks.filter(r => r.source.startsWith(sourcePrefix)).length;
    const existingDescs = new Set(strategicRisks.map(r => r.description.toLowerCase().trim()));
    const crossSourceDupes = items.filter(i =>
      existingDescs.has(i.description.toLowerCase().trim()) &&
      !strategicRisks.some(r => r.source.startsWith(sourcePrefix) && r.description.toLowerCase().trim() === i.description.toLowerCase().trim())
    ).length;

    if (existingFromSource > 0 || crossSourceDupes > 0) {
      setDedupePrompt({ incoming: items, sourcePrefix, existingCount: existingFromSource, crossSourceCount: crossSourceDupes });
      return;
    }

    // No overlaps — just add
    setStrategicRisks(prev => [...prev, ...makeStrategicItems(items)]);
    toast({
      title: `${items.length} item${items.length !== 1 ? 's' : ''} added to Strategic Risk Register`,
      description: "Review the Strategic Risk Register tab to set impact, likelihood, and assign owners.",
    });
    setActiveTab('strategic');
  };

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/iso-projects", {
        pestleData: pestle,
        swotData: swot,
        interestedParties: parties,
        strategicRisks,
      });
      await qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const addPestle = (key: PestleKey) => {
    const val = pestleInput.trim();
    if (!val) return;
    setPestle(p => ({ ...p, [key]: [...p[key], { text: val, type: pestleType }] }));
    setPestleInput('');
    setEditingPestle(null);
    setPestleType('risk');
  };

  const removePestle = (key: PestleKey, idx: number) => {
    setPestle(p => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  };

  const addSwot = (key: SwotKey) => {
    const val = swotInput.trim();
    if (!val) return;
    setSwot(s => ({ ...s, [key]: [...s[key], val] }));
    setSwotInput('');
    setEditingSwot(null);
  };

  const removeSwot = (key: SwotKey, idx: number) => {
    setSwot(s => ({ ...s, [key]: s[key].filter((_, i) => i !== idx) }));
  };

  const togglePartyExpand = (id: string) => {
    setExpandedParties(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateParty = (idx: number, patch: Partial<InterestedParty>) => {
    setParties(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  };

  // ── Computed counts for the bridge tab
  const pestleCount  = Object.values(pestle).reduce((a, b) => a + b.length, 0);
  const pestleRisks  = Object.values(pestle).reduce((a, b) => a + b.filter(i => i.type === 'risk').length, 0);
  const pestleOpps   = Object.values(pestle).reduce((a, b) => a + b.filter(i => i.type === 'opportunity').length, 0);
  const swotCount    = Object.values(swot).reduce((a, b) => a + b.length, 0);
  const relevantParties = parties.filter(p => p.relevant).length;
  const externalParties = parties.filter(p => p.relevant && p.group === 'external').length;
  const internalParties = parties.filter(p => p.relevant && p.group === 'internal').length;

  const pirLabel = (v: InterestedParty['piRanking']) =>
    PI_RANKING_CONFIG.find(r => r.value === v);

  const isaContextPayload = () => {
    const pestleSummary = PESTLE_CONFIG.map(cfg => ({
      category: cfg.label,
      risks: pestle[cfg.key].filter(i => i.type === 'risk').map(i => i.text),
      opportunities: pestle[cfg.key].filter(i => i.type === 'opportunity').map(i => i.text),
    }));
    return `Based on our 4.1/4.2 context data, help me identify the key risks and opportunities we should register under Clause 6.1 and recommend monitoring approaches for our high-power interested parties.\n\nPESTLE (4.1 External): ${JSON.stringify(pestleSummary)}\n\nSWOT (4.1 Internal): ${JSON.stringify(swot)}\n\nInterested Parties (4.2): ${JSON.stringify(parties.filter(p => p.relevant).map(p => ({ party: p.party, group: p.group, piRanking: p.piRanking, needs: p.needs, expectations: p.expectations, risks: p.risks, opportunities: p.opportunities })))}`;
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col" data-testid="context-org-module">

      {/* Print document overlay */}
      <ContextPrintDocuments
        docType={printDoc}
        onClose={() => setPrintDoc(null)}
        orgName={(project as any)?.orgName}
        standard={(project as any)?.standard}
        pestle={pestle}
        swot={swot}
        parties={parties}
      />

      {/* Deduplication prompt dialog */}
      <Dialog open={!!dedupePrompt} onOpenChange={() => setDedupePrompt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <ShieldAlert className="w-4 h-4" /> Overlap Detected
            </DialogTitle>
          </DialogHeader>
          {dedupePrompt && (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5 text-sm text-muted-foreground">
                {dedupePrompt.existingCount > 0 && (
                  <p>
                    <span className="font-semibold text-foreground">{dedupePrompt.existingCount}</span> existing {dedupePrompt.existingCount === 1 ? 'entry' : 'entries'} in the register already come from <span className="font-semibold text-foreground">{dedupePrompt.sourcePrefix}</span>.
                  </p>
                )}
                {dedupePrompt.crossSourceCount > 0 && (
                  <p>
                    <span className="font-semibold text-foreground">{dedupePrompt.crossSourceCount}</span> item{dedupePrompt.crossSourceCount !== 1 ? 's' : ''} from a <em>different</em> source already share the same description text.
                  </p>
                )}
                <p className="text-xs text-muted-foreground pt-1">This is common when PESTLE, SWOT, and Interested Parties capture the same underlying risk. Choose how to proceed:</p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => applyDedupeChoice('replace', dedupePrompt.incoming, dedupePrompt.sourcePrefix)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/15 dark:border-orange-700/40 hover:bg-orange-100 dark:hover:bg-orange-900/25 transition-colors"
                  data-testid="dedupe-replace"
                >
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Replace existing ({dedupePrompt.sourcePrefix})</p>
                  <p className="text-xs text-orange-700/80 dark:text-orange-400">Remove old entries from this source and import fresh. Scored entries will be lost.</p>
                </button>
                <button
                  onClick={() => applyDedupeChoice('skip', dedupePrompt.incoming, dedupePrompt.sourcePrefix)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                  data-testid="dedupe-skip"
                >
                  <p className="text-sm font-bold text-primary">Skip duplicates — add new only</p>
                  <p className="text-xs text-muted-foreground">Only import items whose description doesn't already appear in the register.</p>
                </button>
                <button
                  onClick={() => applyDedupeChoice('add_all', dedupePrompt.incoming, dedupePrompt.sourcePrefix)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
                  data-testid="dedupe-add-all"
                >
                  <p className="text-sm font-bold">Add all (keep duplicates)</p>
                  <p className="text-xs text-muted-foreground">Import everything. You can manually merge or delete duplicates in the register.</p>
                </button>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setDedupePrompt(null)} data-testid="dedupe-cancel">Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-white dark:bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Compass className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black text-primary">Context of the Organization</h2>
              <p className="text-sm text-muted-foreground">ISO Clause 4.1 (Internal & External Issues) · Clause 4.2 (Interested Parties)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(pestleCount > 0 || swotCount > 0) && (
              <button
                onClick={() => onAskIsa(isaContextPayload())}
                className="text-xs text-accent border border-accent/30 hover:bg-accent/5 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                data-testid="button-ask-isa-context"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Ask Isa
              </button>
            )}
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              data-testid="button-save-context"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : null}
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Analysis Tools selector */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Analysis Tools:</span>
          <div className="flex gap-2">
            {([
              { key: 'pestle' as const, label: 'PESTLE', icon: Globe, desc: 'External Issues' },
              { key: 'swot'   as const, label: 'SWOT',   icon: TrendingUp, desc: 'Internal Issues' },
            ]).map(({ key, label, icon: Icon, desc }) => (
              <button
                key={key}
                onClick={() => toggleTool(key)}
                data-testid={`toggle-tool-${key}`}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  activeTools[key]
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/20 hover:text-primary/70'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                <span className={`text-[10px] font-normal ${activeTools[key] ? 'text-primary/60' : 'text-muted-foreground/60'}`}>
                  {desc}
                </span>
                {activeTools[key]
                  ? <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  : <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/30 inline-block" />
                }
              </button>
            ))}
          </div>
          {!activeTools.pestle && !activeTools.swot && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Enable at least one tool to identify §4.1 issues</span>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 mt-3">
          {([
            { id: 'pestle',    label: 'PESTLE (4.1 External)',     icon: Globe,       hidden: !activeTools.pestle },
            { id: 'swot',      label: 'SWOT (4.1 Internal)',       icon: TrendingUp,  hidden: !activeTools.swot },
            { id: 'interested',label: 'Interested Parties (4.2)',  icon: UserCheck,   hidden: false },
            { id: 'strategic', label: 'Strategic Risk Register',   icon: ShieldAlert, hidden: false },
            { id: 'bridge',    label: '4.1 → 6.1 Summary',        icon: ArrowRight,  hidden: false },
          ] as const).filter(t => !t.hidden).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              data-testid={`tab-context-${t.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                activeTab === t.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted/60'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">

          {/* ── PESTLE Tab ─────────────────────────────────────────── */}
          {activeTab === 'pestle' && (
            <div className="space-y-4" data-testid="pestle-panel">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary/80 leading-relaxed flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-primary">ISO 4.1 — External Issues:</span> Identify external factors relevant to your organization's purpose and strategic direction. Tag each factor as a <span className="font-bold text-red-600">Risk</span> or <span className="font-bold text-green-600">Opportunity</span> — these feed directly into Clause 6.1 Risk Planning.
                  <p className="text-xs mt-2 text-muted-foreground">Applies to: ISO 9001 · ISO 14001 · ISO 45001 · IATF 16949 · ISO 13485 · AS9100 · ISO 27001</p>
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  <button
                    onClick={() => setPrintDoc('pestle')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    data-testid="button-print-pestle"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => {
                      const items: { source: string; description: string; type: 'risk' | 'opportunity' }[] = [];
                      PESTLE_CONFIG.forEach(cfg => {
                        pestle[cfg.key].forEach(i =>
                          items.push({ source: `4.1 PESTLE – ${cfg.label}`, description: i.text, type: i.type })
                        );
                      });
                      exportToStrategicRegister(items);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 border border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    data-testid="button-export-pestle-strategic"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    → Strategic Register
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {PESTLE_CONFIG.map(cfg => {
                  const items = pestle[cfg.key];
                  const rCount = items.filter(i => i.type === 'risk').length;
                  const oCount = items.filter(i => i.type === 'opportunity').length;
                  return (
                    <div key={cfg.key} className="bg-white dark:bg-card rounded-xl border border-border/60 p-4" data-testid={`pestle-card-${cfg.key}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                        <p className="text-base font-black text-primary">{cfg.label}</p>
                        <div className="ml-auto flex items-center gap-1">
                          {rCount > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-700/40 px-1.5 py-0.5 rounded-full">{rCount}R</span>}
                          {oCount > 0 && <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:border-green-700/40 px-1.5 py-0.5 rounded-full">{oCount}O</span>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 leading-tight">{cfg.desc}</p>
                      <div className="space-y-1.5 mb-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 group">
                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 ${item.type === 'risk' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-700/40' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-700/40'}`}>
                              {item.type === 'risk' ? 'RISK' : 'OPP'}
                            </span>
                            <span className="text-sm text-primary flex-1 leading-tight">{item.text}</span>
                            <button onClick={() => removePestle(cfg.key, idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0" data-testid={`btn-remove-pestle-${cfg.key}-${idx}`}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {editingPestle === cfg.key ? (
                        <div className="space-y-2 mt-2">
                          <Input
                            autoFocus
                            value={pestleInput}
                            onChange={e => setPestleInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addPestle(cfg.key); if (e.key === 'Escape') { setEditingPestle(null); setPestleInput(''); } }}
                            placeholder="Describe the factor…"
                            className="h-7 text-xs"
                            data-testid={`input-pestle-${cfg.key}`}
                          />
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs font-bold text-muted-foreground">Type:</span>
                            <button
                              onClick={() => setPestleType('risk')}
                              className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${pestleType === 'risk' ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:border-red-600' : 'text-muted-foreground border-border/50 hover:border-red-300'}`}
                              data-testid={`btn-type-risk-${cfg.key}`}
                            >Risk</button>
                            <button
                              onClick={() => setPestleType('opportunity')}
                              className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${pestleType === 'opportunity' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:border-green-600' : 'text-muted-foreground border-border/50 hover:border-green-300'}`}
                              data-testid={`btn-type-opp-${cfg.key}`}
                            >Opportunity</button>
                            <div className="ml-auto flex gap-1">
                              <button onClick={() => addPestle(cfg.key)} className="text-xs text-white bg-primary px-2 py-0.5 rounded-md hover:bg-primary/90" data-testid={`btn-add-pestle-${cfg.key}`}>Add</button>
                              <button onClick={() => { setEditingPestle(null); setPestleInput(''); }} className="text-xs text-muted-foreground hover:text-primary px-1"><X className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingPestle(cfg.key); setPestleInput(''); setPestleType('risk'); }} className="w-full text-xs text-muted-foreground hover:text-accent border border-dashed border-border/60 hover:border-accent/40 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors mt-2" data-testid={`btn-new-pestle-${cfg.key}`}>
                          <Plus className="w-3 h-3" /> Add Factor
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SWOT Tab ──────────────────────────────────────────── */}
          {activeTab === 'swot' && (
            <div className="space-y-4" data-testid="swot-panel">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary/80 leading-relaxed flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-primary">ISO 4.1 — Internal Issues:</span> Document strengths, weaknesses, opportunities, and threats within your organization. Each item feeds into Clause 6.1 Risk &amp; Opportunity planning.
                  <p className="text-xs mt-1.5 text-muted-foreground flex items-center gap-1"><ArrowRight className="w-3 h-3" /> All SWOT items link to 6.1 — indicated by the badge on each entry.</p>
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  <button
                    onClick={() => setPrintDoc('swot')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    data-testid="button-print-swot"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => {
                      const items: { source: string; description: string; type: 'risk' | 'opportunity' }[] = [];
                      swot.strengths.forEach(t => items.push({ source: '4.1 SWOT – Strength', description: t, type: 'opportunity' }));
                      swot.weaknesses.forEach(t => items.push({ source: '4.1 SWOT – Weakness', description: t, type: 'risk' }));
                      swot.opportunities.forEach(t => items.push({ source: '4.1 SWOT – Opportunity', description: t, type: 'opportunity' }));
                      swot.threats.forEach(t => items.push({ source: '4.1 SWOT – Threat', description: t, type: 'risk' }));
                      exportToStrategicRegister(items);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 border border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    data-testid="button-export-swot-strategic"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    → Strategic Register
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SWOT_CONFIG.map(cfg => (
                  <div key={cfg.key} className={`rounded-xl border p-4 ${cfg.bg}`} data-testid={`swot-card-${cfg.key}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                      <p className={`text-base font-black ${cfg.color}`}>{cfg.label}</p>
                      {swot[cfg.key].length > 0 && (
                        <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-black/20 ${cfg.color}`}>{swot[cfg.key].length}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-tight">{cfg.desc}</p>
                    <div className="space-y-1.5 mb-2">
                      {swot[cfg.key].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 group">
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-white/70 dark:bg-black/20 text-muted-foreground border-border/50 mt-0.5">→ 6.1</span>
                          <span className="text-sm text-primary flex-1 leading-tight">{item}</span>
                          <button onClick={() => removeSwot(cfg.key, idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" data-testid={`btn-remove-swot-${cfg.key}-${idx}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {editingSwot === cfg.key ? (
                      <div className="flex gap-1 mt-2">
                        <Input
                          autoFocus
                          value={swotInput}
                          onChange={e => setSwotInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addSwot(cfg.key); if (e.key === 'Escape') { setEditingSwot(null); setSwotInput(''); } }}
                          placeholder="Describe the item…"
                          className="h-7 text-xs"
                          data-testid={`input-swot-${cfg.key}`}
                        />
                        <button onClick={() => addSwot(cfg.key)} className="text-xs text-white bg-primary px-2 rounded-md hover:bg-primary/90" data-testid={`btn-add-swot-${cfg.key}`}>Add</button>
                        <button onClick={() => { setEditingSwot(null); setSwotInput(''); }} className="text-xs text-muted-foreground hover:text-primary px-1"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingSwot(cfg.key); setSwotInput(''); }} className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed border-current/20 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors mt-2 opacity-70 hover:opacity-100" data-testid={`btn-new-swot-${cfg.key}`}>
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Interested Parties Tab ─────────────────────────────── */}
          {activeTab === 'interested' && (
            <div className="space-y-4" data-testid="interested-parties-panel">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary/80 leading-relaxed flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-primary">ISO 4.2 — Interested Parties:</span> Determine relevant internal and external parties, their needs/expectations, how you will meet those needs, how you will monitor them, and their associated risks and opportunities. Use the Power &amp; Interest Ranking (PI-R) to prioritize engagement.
                  <p className="text-xs mt-1.5 text-muted-foreground flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Risks and opportunities documented per party flow into the Strategic Risk Register.</p>
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  <button
                    onClick={() => setPrintDoc('parties')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    data-testid="button-print-parties"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => {
                      const items: { source: string; description: string; type: 'risk' | 'opportunity' }[] = [];
                      parties
                        .filter(p => p.relevant)
                        .forEach(p => {
                          const partyName = p.party || 'Unnamed Party';
                          const source = `4.2 – ${partyName}`;
                          if (p.risks?.trim()) {
                            p.risks.split(/\n|;/).map(r => r.trim()).filter(Boolean).forEach(r =>
                              items.push({ source, description: r, type: 'risk' })
                            );
                          }
                          if (p.opportunities?.trim()) {
                            p.opportunities.split(/\n|;/).map(o => o.trim()).filter(Boolean).forEach(o =>
                              items.push({ source, description: o, type: 'opportunity' })
                            );
                          }
                        });
                      exportToStrategicRegister(items);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 border border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    data-testid="button-export-parties-strategic"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    → Strategic Register
                  </button>
                </div>
              </div>

              {(['external', 'internal'] as const).map(grp => {
                const grpParties = parties.filter(p => p.group === grp);
                const grpRelevant = grpParties.filter(p => p.relevant).length;
                return (
                  <div key={grp} className="space-y-2" data-testid={`party-group-${grp}`}>
                    <div className="flex items-center gap-2 px-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${grp === 'external' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/40' : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700/40'}`}>
                        {grp === 'external' ? 'EXTERNAL' : 'INTERNAL'}
                      </span>
                      <span className="text-sm text-muted-foreground">{grpRelevant} relevant of {grpParties.length}</span>
                    </div>

                    {grpParties.map((p) => {
                      const globalIdx = parties.indexOf(p);
                      const isExpanded = expandedParties.has(p.id);
                      const pir = pirLabel(p.piRanking);
                      return (
                        <div key={p.id} className={`bg-white dark:bg-card rounded-xl border transition-all ${p.relevant ? 'border-primary/30' : 'border-border/40 opacity-60'}`} data-testid={`party-card-${globalIdx}`}>
                          {/* Collapsed header */}
                          <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => togglePartyExpand(p.id)}>
                            <button
                              onClick={e => { e.stopPropagation(); updateParty(globalIdx, { relevant: !p.relevant }); }}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${p.relevant ? 'bg-primary border-primary' : 'border-border/60 hover:border-primary/40'}`}
                              data-testid={`toggle-party-relevant-${globalIdx}`}
                            >
                              {p.relevant && <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />}
                            </button>
                            <p className="text-sm font-bold text-primary flex-1">{p.party || <span className="text-muted-foreground italic">Unnamed party</span>}</p>
                            <div className="flex items-center gap-1.5 mr-1">
                              {p.relevant
                                ? <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5">RELEVANT</span>
                                : <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/60 rounded-full px-1.5 py-0.5">NOT RELEVANT</span>
                              }
                              {pir && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${pir.bg} ${pir.color}`}>{pir.label}</span>
                              )}
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                            <button onClick={e => { e.stopPropagation(); setParties(prev => prev.filter((_, i) => i !== globalIdx)); setExpandedParties(prev => { const n = new Set(prev); n.delete(p.id); return n; }); }} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-1" data-testid={`btn-remove-party-${globalIdx}`}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Expanded body */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
                              {/* Party name */}
                              <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-0.5">Party Name</label>
                                <Input value={p.party} onChange={e => updateParty(globalIdx, { party: e.target.value })} placeholder="e.g. Certification Body, Insurance Provider" className="h-7 text-xs" data-testid={`input-party-name-${globalIdx}`} />
                              </div>

                              {/* Group Toggle */}
                              <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Group</label>
                                <div className="flex gap-1.5">
                                  {(['internal', 'external'] as const).map(g => (
                                    <button
                                      key={g}
                                      onClick={() => updateParty(globalIdx, { group: g })}
                                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-colors ${p.group === g ? (g === 'internal' ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700/50' : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50') : 'text-muted-foreground border-border/50 hover:border-primary/30'}`}
                                      data-testid={`btn-party-group-${g}-${globalIdx}`}
                                    >
                                      {g === 'internal' ? 'Internal' : 'External'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* PI-R Selector */}
                              <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Power &amp; Interest Ranking (PI-R)</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {PI_RANKING_CONFIG.map(r => (
                                    <button
                                      key={r.value}
                                      onClick={() => updateParty(globalIdx, { piRanking: p.piRanking === r.value ? '' : r.value })}
                                      className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${p.piRanking === r.value ? `${r.bg} ${r.color}` : 'text-muted-foreground border-border/50 hover:border-primary/30'}`}
                                      data-testid={`btn-pir-${r.value}-${globalIdx}`}
                                    >
                                      {r.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs font-bold text-muted-foreground block mb-0.5">Needs</label>
                                  <Input value={p.needs} onChange={e => updateParty(globalIdx, { needs: e.target.value })} placeholder="What do they need from us?" className="h-7 text-xs" data-testid={`input-party-needs-${globalIdx}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-muted-foreground block mb-0.5">Expectations</label>
                                  <Input value={p.expectations} onChange={e => updateParty(globalIdx, { expectations: e.target.value })} placeholder="What are their expectations?" className="h-7 text-xs" data-testid={`input-party-expectations-${globalIdx}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-muted-foreground block mb-0.5">Actions to Meet Needs</label>
                                  <Input value={p.actions} onChange={e => updateParty(globalIdx, { actions: e.target.value })} placeholder="How do we meet their needs?" className="h-7 text-xs" data-testid={`input-party-actions-${globalIdx}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-muted-foreground block mb-0.5">Monitoring Method</label>
                                  <Input value={p.monitoringMethod} onChange={e => updateParty(globalIdx, { monitoringMethod: e.target.value })} placeholder="Surveys, audits, reviews…" className="h-7 text-xs" data-testid={`input-party-monitoring-${globalIdx}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-muted-foreground block mb-0.5">Associated Risks</label>
                                  <Input value={p.risks} onChange={e => updateParty(globalIdx, { risks: e.target.value })} placeholder="Risks from this party" className="h-7 text-xs" data-testid={`input-party-risks-${globalIdx}`} />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-muted-foreground block mb-0.5">Associated Opportunities</label>
                                  <Input value={p.opportunities} onChange={e => updateParty(globalIdx, { opportunities: e.target.value })} placeholder="Opportunities from this party" className="h-7 text-xs" data-testid={`input-party-opps-${globalIdx}`} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Add party buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { const newId = `ip-${Math.random().toString(36).slice(2, 9)}`; setParties(prev => [...prev, { id: newId, party: '', group: 'external', relevant: true, needs: '', expectations: '', actions: '', monitoringMethod: '', risks: '', opportunities: '', piRanking: '' }]); setExpandedParties(prev => { const n = new Set(prev); n.add(newId); return n; }); }}
                  className="flex-1 text-xs text-muted-foreground hover:text-blue-600 border border-dashed border-border/60 hover:border-blue-300 rounded-xl py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  data-testid="btn-add-external-party"
                >
                  <Plus className="w-3.5 h-3.5" /> Add External Party
                </button>
                <button
                  onClick={() => { const newId = `ip-${Math.random().toString(36).slice(2, 9)}`; setParties(prev => [...prev, { id: newId, party: '', group: 'internal', relevant: true, needs: '', expectations: '', actions: '', monitoringMethod: '', risks: '', opportunities: '', piRanking: '' }]); setExpandedParties(prev => { const n = new Set(prev); n.add(newId); return n; }); }}
                  className="flex-1 text-xs text-muted-foreground hover:text-purple-600 border border-dashed border-border/60 hover:border-purple-300 rounded-xl py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  data-testid="btn-add-internal-party"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Internal Party
                </button>
              </div>

              {/* Summary strip */}
              <div className="bg-muted/40 border border-border/50 rounded-xl p-3 flex gap-4 text-sm text-muted-foreground">
                <span><span className="font-bold text-primary">{relevantParties}</span> relevant parties total</span>
                <span>·</span>
                <span><span className="font-bold text-blue-700">{externalParties}</span> external</span>
                <span>·</span>
                <span><span className="font-bold text-purple-700">{internalParties}</span> internal</span>
              </div>
            </div>
          )}

          {/* ── Strategic Risk Register Tab ────────────────────────── */}
          {activeTab === 'strategic' && (
            <div className="space-y-4" data-testid="strategic-risk-panel">

              {/* ── Info banner */}
              <div className="bg-orange-50 dark:bg-orange-900/15 border border-orange-200 dark:border-orange-700/40 rounded-xl p-4 text-sm text-orange-900 dark:text-orange-200 flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-orange-800 dark:text-orange-300 mb-0.5">ISO §4.1 Strategic Risk Register</p>
                  <p className="text-xs text-orange-700/80 dark:text-orange-400 leading-relaxed">
                    Strategic risks and opportunities are rated on a 3×3 matrix: <strong>Impact (H/M/L)</strong> × <strong>Likelihood (H/M/L)</strong>. This is separate from the §6.1 operational process risk register.
                    Use the PESTLE and SWOT export buttons to auto-populate this register, then assign owners and responses here.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSrForm({ source: '', description: '', type: 'risk', impact: 'M', likelihood: 'M', owner: '', response: '', status: 'open' });
                    setSrDialog({ mode: 'add' });
                  }}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                  data-testid="button-add-strategic-risk"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Risk / Opportunity
                </button>
              </div>

              {/* ── 3×3 Matrix legend */}
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold max-w-xs">
                <div />
                {(['L','M','H'] as const).map(lh => (
                  <div key={lh} className="bg-muted/60 rounded px-1 py-0.5 text-muted-foreground">Like: {lh}</div>
                ))}
                {(['H','M','L'] as const).map(imp => (
                  <Fragment key={imp}>
                    <div className="bg-muted/60 rounded px-1 py-0.5 text-muted-foreground text-left pl-2">Impact: {imp}</div>
                    {(['L','M','H'] as const).map(lh => {
                      const r = computeRating(imp, lh);
                      const cls = r === 'Critical' ? 'bg-red-500 text-white' : r === 'High' ? 'bg-orange-400 text-white' : r === 'Medium' ? 'bg-yellow-300 text-yellow-900' : 'bg-green-200 text-green-800';
                      return <div key={`${imp}-${lh}`} className={`rounded px-1 py-0.5 ${cls}`}>{r}</div>;
                    })}
                  </Fragment>
                ))}
              </div>

              {/* ── Register table */}
              {strategicRisks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No strategic risks or opportunities registered yet.</p>
                  <p className="text-xs mt-1">Use the PESTLE or SWOT "→ Strategic Register" buttons, or add one manually above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-sm" data-testid="strategic-risk-table">
                    <thead className="bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      <tr>
                        <th className="px-3 py-2 text-left">Source</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-center">Type</th>
                        <th className="px-3 py-2 text-center">Impact</th>
                        <th className="px-3 py-2 text-center">Likelihood</th>
                        <th className="px-3 py-2 text-center">Rating</th>
                        <th className="px-3 py-2 text-left">Owner</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {strategicRisks.map((r) => {
                        const ratingCls = r.rating === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : r.rating === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : r.rating === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                        const statusCls = r.status === 'open' ? 'text-red-600' : r.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600';
                        return (
                          <tr key={r.id} className="hover:bg-muted/20 transition-colors" data-testid={`strategic-risk-row-${r.id}`}>
                            <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.source}</td>
                            <td className="px-3 py-2 max-w-xs">
                              <p className="text-sm leading-tight">{r.description}</p>
                              {r.response && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">↳ {r.response}</p>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${r.type === 'risk' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-700/40' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-700/40'}`}>
                                {r.type === 'risk' ? 'RISK' : 'OPP'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-sm">{r.impact}</td>
                            <td className="px-3 py-2 text-center font-bold text-sm">{r.likelihood}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${ratingCls}`}>{r.rating}</span>
                            </td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">{r.owner || <span className="italic opacity-50">Unassigned</span>}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-xs font-semibold ${statusCls}`}>{r.status.replace('_', ' ')}</span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setSrForm({ source: r.source, description: r.description, type: r.type, impact: r.impact, likelihood: r.likelihood, owner: r.owner, response: r.response, status: r.status });
                                    setSrDialog({ mode: 'edit', item: r });
                                  }}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                  data-testid={`btn-edit-strategic-${r.id}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setStrategicRisks(prev => prev.filter(x => x.id !== r.id))}
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-destructive transition-colors"
                                  data-testid={`btn-delete-strategic-${r.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Add / Edit Dialog */}
              <Dialog open={!!srDialog} onOpenChange={() => setSrDialog(null)}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600" />
                      {srDialog?.mode === 'edit' ? 'Edit Strategic Risk' : 'Add Strategic Risk / Opportunity'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-1">
                    <div>
                      <Label className="text-xs font-semibold">Source</Label>
                      <Input value={srForm.source} onChange={e => setSrForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g. 4.1 PESTLE – Political" className="mt-1 text-sm" data-testid="input-sr-source" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Description</Label>
                      <Textarea value={srForm.description} onChange={e => setSrForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the risk or opportunity..." rows={3} className="mt-1 text-sm resize-none" data-testid="input-sr-description" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">Type</Label>
                        <Select value={srForm.type} onValueChange={(v: 'risk' | 'opportunity') => setSrForm(f => ({ ...f, type: v }))}>
                          <SelectTrigger className="mt-1 text-sm h-9" data-testid="select-sr-type"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="risk">Risk</SelectItem>
                            <SelectItem value="opportunity">Opportunity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Impact</Label>
                        <Select value={srForm.impact} onValueChange={(v: 'H' | 'M' | 'L') => setSrForm(f => ({ ...f, impact: v }))}>
                          <SelectTrigger className="mt-1 text-sm h-9" data-testid="select-sr-impact"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="H">H — High</SelectItem>
                            <SelectItem value="M">M — Medium</SelectItem>
                            <SelectItem value="L">L — Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Likelihood</Label>
                        <Select value={srForm.likelihood} onValueChange={(v: 'H' | 'M' | 'L') => setSrForm(f => ({ ...f, likelihood: v }))}>
                          <SelectTrigger className="mt-1 text-sm h-9" data-testid="select-sr-likelihood"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="H">H — High</SelectItem>
                            <SelectItem value="M">M — Medium</SelectItem>
                            <SelectItem value="L">L — Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                      <span className="text-xs text-muted-foreground">Computed Rating:</span>
                      {(() => {
                        const r = computeRating(srForm.impact, srForm.likelihood);
                        const cls = r === 'Critical' ? 'bg-red-500 text-white' : r === 'High' ? 'bg-orange-400 text-white' : r === 'Medium' ? 'bg-yellow-300 text-yellow-900' : 'bg-green-200 text-green-800';
                        return <span className={`text-xs font-bold px-2 py-0.5 rounded ${cls}`}>{r}</span>;
                      })()}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">Owner</Label>
                        <Input value={srForm.owner} onChange={e => setSrForm(f => ({ ...f, owner: e.target.value }))} placeholder="Name or role" className="mt-1 text-sm" data-testid="input-sr-owner" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Status</Label>
                        <Select value={srForm.status} onValueChange={(v: 'open' | 'in_progress' | 'closed') => setSrForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger className="mt-1 text-sm h-9" data-testid="select-sr-status"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Response / Mitigation</Label>
                      <Textarea value={srForm.response} onChange={e => setSrForm(f => ({ ...f, response: e.target.value }))} placeholder="Describe the planned response or mitigation..." rows={2} className="mt-1 text-sm resize-none" data-testid="input-sr-response" />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setSrDialog(null)}>Cancel</Button>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        data-testid="button-save-strategic-risk"
                        onClick={() => {
                          const rating = computeRating(srForm.impact, srForm.likelihood);
                          if (srDialog?.mode === 'edit' && srDialog.item) {
                            setStrategicRisks(prev => prev.map(x => x.id === srDialog.item!.id ? { ...x, ...srForm, rating } : x));
                          } else {
                            const newItem: StrategicRisk = {
                              id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                              ...srForm,
                              rating,
                            };
                            setStrategicRisks(prev => [...prev, newItem]);
                          }
                          setSrDialog(null);
                        }}
                      >
                        {srDialog?.mode === 'edit' ? 'Update' : 'Add to Register'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* ── Save reminder */}
              {strategicRisks.length > 0 && (
                <div className="flex items-center justify-between bg-muted/30 border border-border/40 rounded-lg px-4 py-2.5 text-xs text-muted-foreground">
                  <span>Remember to <strong>Save</strong> to persist your strategic risk register.</span>
                  <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs gap-1" data-testid="button-save-strategic">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : null}
                    {saved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              )}

            </div>
          )}

          {/* ── 4.1 → 6.1 Bridge Tab ──────────────────────────────── */}
          {activeTab === 'bridge' && (
            <div className="space-y-5" data-testid="bridge-panel">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">Context of the Organization → Risk Planning</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  ISO standards require that the outputs of Clause 4.1 (internal &amp; external issues) and Clause 4.2 (interested parties) are used as inputs when determining risks and opportunities under <span className="font-bold">Clause 6.1</span>. This summary shows how much context data you have captured and where it needs to go.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-semibold">Applies to: ISO 9001 · ISO 14001 · ISO 45001 · IATF 16949 · ISO 13485 · AS9100 D · ISO 27001</p>
              </div>

              {/* Count cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-4 text-center">
                  <p className="text-2xl font-black text-primary">{pestleCount}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">PESTLE Factors</p>
                  <div className="flex justify-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 px-1.5 py-0.5 rounded-full">{pestleRisks}R</span>
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 px-1.5 py-0.5 rounded-full">{pestleOpps}O</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-4 text-center">
                  <p className="text-2xl font-black text-primary">{swotCount}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">SWOT Items</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">All feed → 6.1</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-4 text-center">
                  <p className="text-2xl font-black text-primary">{relevantParties}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">Relevant Parties</p>
                  <div className="flex justify-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 px-1.5 py-0.5 rounded-full">{externalParties}E</span>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/40 px-1.5 py-0.5 rounded-full">{internalParties}I</span>
                  </div>
                </div>
                <div className={`rounded-xl border p-4 text-center ${(pestleCount + swotCount + relevantParties) > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40' : 'bg-muted border-border/60'}`}>
                  <p className={`text-2xl font-black ${(pestleCount + swotCount + relevantParties) > 0 ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>{pestleCount + swotCount + relevantParties}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">Total Inputs to 6.1</p>
                  <p className={`text-[10px] mt-1.5 font-semibold ${(pestleCount + swotCount + relevantParties) > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>{(pestleCount + swotCount + relevantParties) > 0 ? 'Ready for risk planning' : 'Add context data first'}</p>
                </div>
              </div>

              {/* Standards reference */}
              <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-4 space-y-2.5">
                <p className="text-base font-black text-primary">Standard Requirements: 4.1/4.2 → 6.1</p>
                {[
                  { std: 'ISO 9001:2015',    clause: '6.1.1', req: 'Actions to address risks and opportunities must consider internal/external issues (4.1) and relevant interested parties (4.2).' },
                  { std: 'ISO 14001:2015',   clause: '6.1.1', req: 'Environmental aspects, compliance obligations, and risks/opportunities must consider context (4.1) and interested parties (4.2).' },
                  { std: 'ISO 45001:2018',   clause: '6.1.1', req: 'OH&S risks and opportunities must consider issues (4.1), interested parties (4.2), and OH&S scope.' },
                  { std: 'IATF 16949:2016',  clause: '6.1.2.1', req: 'Risk analysis must include lessons learned, warranty, field returns — informed by supplier and customer context (4.1/4.2).' },
                  { std: 'ISO 13485:2016',   clause: '6.1',   req: 'Risk management planning per ISO 14971 must consider applicable regulatory requirements identified in context.' },
                  { std: 'AS9100 Rev D',     clause: '6.1',   req: 'Aviation/space safety risks must consider product realization context, customer requirements, and regulatory issues.' },
                  { std: 'ISO 27001:2022',   clause: '6.1.1', req: 'Information security risks must be assessed in the context of organizational issues (4.1) and interested parties (4.2).' },
                ].map(row => (
                  <div key={row.std} className="flex items-start gap-3 py-1.5 border-b border-border/40 last:border-0">
                    <span className="shrink-0 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">{row.std}</span>
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">§{row.clause}</span>
                    <p className="text-sm text-muted-foreground leading-snug">{row.req}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary">Ready to register risks?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Transfer your PESTLE factors and interested party risks into the Risk &amp; Opportunity Register (Clause 6.1) to complete the planning loop.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAskIsa(isaContextPayload())}
                    className="text-xs text-accent border border-accent/30 hover:bg-accent/5 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    data-testid="btn-ask-isa-bridge"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Ask Isa
                  </button>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('risk')}
                      className="text-xs text-white bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      data-testid="btn-go-to-risk"
                    >
                      Go to Risk Assessment <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}

/* ─── ORG LOGO UPLOAD ─────────────────────────────────────────────────────── */
function OrgLogoUpload({ project }: { project: IsoProject }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logo = (project as any).logoUrl as string | undefined;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSaving(true);
      try {
        await apiRequest("PATCH", "/api/iso-projects", { logoUrl: dataUrl });
        await qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      } catch { /* silent */ }
      finally { setSaving(false); }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async () => {
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/iso-projects", { logoUrl: null });
      await qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Printer className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-black text-primary uppercase tracking-wide">Organization Logo</h2>
        <span className="text-[10px] text-muted-foreground font-normal ml-1">Used on printed documentation</span>
      </div>
      <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-5">
        <div className="flex items-center gap-5">
          {logo ? (
            <div className="w-32 h-20 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden">
              <img src={logo} alt="Organization logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-32 h-20 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-1 text-muted-foreground">
              <Building2 className="w-6 h-6" />
              <span className="text-[10px]">No logo</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground max-w-xs">
              Upload your organization's logo to have it automatically appear on all printed documents — Quality Manual, job descriptions, procedures, and more.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}
                disabled={saving} className="text-xs gap-1.5" data-testid="button-upload-logo">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {logo ? "Change Logo" : "Upload Logo"}
              </Button>
              {logo && (
                <Button size="sm" variant="ghost" onClick={removeLogo}
                  disabled={saving} className="text-xs text-muted-foreground hover:text-red-500 gap-1.5" data-testid="button-remove-logo">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">PNG or JPG · max 2 MB</p>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={handleFile} data-testid="input-logo-file" />
      </div>
    </div>
  );
}

function SystemProfileModule({ project, onStartWizard }: { project: IsoProject | null; onStartWizard: () => void }) {
  if (!project || project.status === "not_started") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center" data-testid="system-profile-empty">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-accent" />
        </div>
        <div className="max-w-sm">
          <h2 className="text-xl font-black text-primary mb-2">No System Profile Yet</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Complete the setup wizard to build your ISO Management System Profile. Your organization details, scope, processes, and quality policy will appear here.
          </p>
        </div>
        <Button onClick={onStartWizard} className="bg-accent hover:bg-accent/90 text-white gap-2" data-testid="button-start-wizard-from-profile">
          <Plus className="w-4 h-4" /> Start Setup Wizard
        </Button>
      </div>
    );
  }

  const processes = (project.processes as ProcessEntry[]) || [];
  const coreValues = (project.coreValues || []).filter((v: string) => v.trim());
  const riskPhil = project.riskPhilosophy || [];
  const mfgTech = (project.manufacturingTech || []).filter((t: string) => t !== "Other");

  return (
    <div className="flex-1 min-h-0 flex flex-col" data-testid="system-profile-page">
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-border/60">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary">{project.orgName || "My Organization"}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {project.standard && (
                  <span className="text-[11px] bg-accent/10 text-accent border border-accent/20 rounded px-2 py-0.5 font-bold">{project.standard}</span>
                )}
                {project.status === "complete" && (
                  <span className="text-[11px] bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/30 rounded px-2 py-0.5 font-bold">Setup Complete</span>
                )}
                {project.status === "in_progress" && (
                  <span className="text-[11px] bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30 rounded px-2 py-0.5 font-bold">In Progress</span>
                )}
              </div>
            </div>
            {project.status === "in_progress" && (
              <Button variant="outline" size="sm" onClick={onStartWizard} className="ml-auto gap-1.5 border-accent/30 text-accent hover:bg-accent/5" data-testid="button-continue-wizard">
                Continue Setup <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Organization Logo */}
          <OrgLogoUpload project={project} />

          {/* Organization Profile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wide">Organization Profile</h2>
            </div>
            <div className="bg-white dark:bg-card rounded-xl border border-border/60 divide-y divide-border/40">
              {project.orgName && (
                <div className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Organization Name</span>
                  <span className="text-sm font-semibold text-primary">{project.orgName}</span>
                </div>
              )}
              {project.orgAddress && (
                <div className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Address</span>
                  <span className="text-sm font-semibold text-primary">{project.orgAddress}</span>
                </div>
              )}
              {project.standard && (
                <div className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">ISO Standard</span>
                  <span className="text-sm font-bold text-accent">{project.standard}</span>
                </div>
              )}
              {project.totalEmployees && (
                <div className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">Employees</span>
                  <span className="text-sm font-semibold text-primary">
                    {project.totalEmployees} total
                    {project.productionEmployees ? ` · ${project.productionEmployees} production / ${project.adminEmployees} admin` : ""}
                  </span>
                </div>
              )}
              {!project.orgName && !project.orgAddress && !project.standard && (
                <div className="px-5 py-4"><DraftEmpty /></div>
              )}
            </div>
          </div>

          {/* Scope Statement */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wide">Scope Statement</h2>
            </div>
            <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-5 space-y-3">
              {project.productsServices ? (
                <>
                  <p className="text-sm text-primary/80 leading-relaxed italic">"{project.productsServices}"</p>
                  {mfgTech.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-semibold">Manufacturing Technologies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mfgTech.map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.hasDesignResponsibility !== null && project.hasDesignResponsibility !== undefined && (
                    <p className={`text-xs font-bold ${project.hasDesignResponsibility ? "text-accent" : "text-muted-foreground"}`}>
                      Design & Development (Cl. 8.3): {project.hasDesignResponsibility ? "In Scope" : "Excluded"}
                    </p>
                  )}
                </>
              ) : <DraftEmpty />}
            </div>
          </div>

          {/* Process Architecture */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Factory className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wide">Process Architecture</h2>
            </div>
            {processes.length > 0 ? (
              <div className="grid gap-3">
                {processes.map((p, i) => (
                  <div key={i} className="bg-white dark:bg-card rounded-xl border border-border/60 p-4" data-testid={`profile-process-${i}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-bold text-primary">{p.name}</p>
                        {p.owner && <p className="text-xs text-muted-foreground">Owner: {p.owner}</p>}
                      </div>
                      {p.kpi && (
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">KPI</p>
                          <p className="text-xs font-semibold text-primary">{p.kpi}</p>
                        </div>
                      )}
                    </div>
                    {p.clauses && p.clauses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/40">
                        {p.clauses.map((c: string) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-bold">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-5"><DraftEmpty /></div>
            )}
          </div>

          {/* Quality Policy */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wide">Quality Policy — Core Values</h2>
            </div>
            <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-5">
              {coreValues.length > 0 ? (
                <div className="space-y-2">
                  {coreValues.map((v: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-semibold text-primary">{v}</span>
                    </div>
                  ))}
                </div>
              ) : <DraftEmpty />}
            </div>
          </div>

          {/* Remote Sites */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wide">Remote Sites</h2>
              <span className="ml-1 text-[9px] font-bold bg-accent/10 text-accent border border-accent/20 rounded px-1.5 py-0.5">IATF / Multi-Site</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">For IATF 16949 and multi-site certifications — document any remote locations, support functions, or satellite facilities within your certification scope.</p>
            <RemoteSitesEditor project={project} />
          </div>

          {/* Outside Processes */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Factory className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-black text-primary uppercase tracking-wide">Outside Processes (Outsourcing)</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Externally provided processes, products, or services that are part of your management system scope (ISO 4.1 / 8.4). Document how each is controlled.</p>
            <OutsideProcessesEditor project={project} />
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}

/* ─── REMOTE SITES EDITOR ─────────────────────────────── */
function RemoteSitesEditor({ project }: { project: IsoProject }) {
  const qc = useQueryClient();
  const [sites, setSites] = useState<Array<{ name: string; address: string; activities: string; included: boolean }>>(
    () => (project as any).remoteSites || []
  );
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', activities: '', included: true });
  const [saving, setSaving] = useState(false);

  const save = async (updated: typeof sites) => {
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/iso-projects", { remoteSites: updated });
      await qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const addSite = async () => {
    if (!form.name.trim()) return;
    const updated = [...sites, { ...form }];
    setSites(updated);
    setAdding(false);
    setForm({ name: '', address: '', activities: '', included: true });
    await save(updated);
  };

  const removeSite = async (idx: number) => {
    const updated = sites.filter((_, i) => i !== idx);
    setSites(updated);
    await save(updated);
  };

  const toggleIncluded = async (idx: number) => {
    const updated = sites.map((s, i) => i === idx ? { ...s, included: !s.included } : s);
    setSites(updated);
    await save(updated);
  };

  return (
    <div className="space-y-2" data-testid="remote-sites-editor">
      {sites.length === 0 && !adding && (
        <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-5"><DraftEmpty /></div>
      )}
      {sites.map((s, idx) => (
        <div key={idx} className={`bg-white dark:bg-card rounded-xl border p-4 flex items-start gap-3 ${s.included ? 'border-primary/30' : 'border-border/40 opacity-60'}`} data-testid={`remote-site-${idx}`}>
          <button onClick={() => toggleIncluded(idx)} className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${s.included ? 'bg-primary border-primary' : 'border-border/60'}`} data-testid={`toggle-site-${idx}`}>
            {s.included && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold text-primary">{s.name}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${s.included ? 'text-primary bg-primary/10 border-primary/20' : 'text-muted-foreground bg-muted border-border/60'}`}>{s.included ? 'IN SCOPE' : 'EXCLUDED'}</span>
            </div>
            {s.address && <p className="text-xs text-muted-foreground">{s.address}</p>}
            {s.activities && <p className="text-xs text-primary/70 mt-0.5">{s.activities}</p>}
          </div>
          <button onClick={() => removeSite(idx)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0" data-testid={`btn-remove-site-${idx}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="bg-white dark:bg-card rounded-xl border border-accent/30 p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Site Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Chicago Support Office" className="h-7 text-xs" data-testid="input-site-name" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Address</label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="City, State or full address" className="h-7 text-xs" data-testid="input-site-address" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Activities / Functions at This Site</label>
            <Input value={form.activities} onChange={e => setForm(f => ({ ...f, activities: e.target.value }))} placeholder="e.g., Engineering support, Customer service, Warehousing" className="h-7 text-xs" data-testid="input-site-activities" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={addSite} disabled={saving || !form.name.trim()} className="h-7 text-xs bg-accent hover:bg-accent/90 text-white" data-testid="btn-save-site">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Add Site
            </Button>
            <button onClick={() => { setAdding(false); setForm({ name: '', address: '', activities: '', included: true }); }} className="text-xs text-muted-foreground hover:text-primary">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full text-xs text-muted-foreground hover:text-accent border border-dashed border-border/60 hover:border-accent/40 rounded-xl py-2.5 flex items-center justify-center gap-1.5 transition-colors" data-testid="btn-add-site">
          <Plus className="w-3.5 h-3.5" /> Add Remote Site
        </button>
      )}
    </div>
  );
}

/* ─── OUTSIDE PROCESSES EDITOR ───────────────────────── */
function OutsideProcessesEditor({ project }: { project: IsoProject }) {
  const qc = useQueryClient();
  const [procs, setProcs] = useState<Array<{ process: string; provider: string; controlMethod: string; clause: string }>>(
    () => (project as any).outsideProcesses || []
  );
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ process: '', provider: '', controlMethod: '', clause: '8.4' });
  const [saving, setSaving] = useState(false);

  const save = async (updated: typeof procs) => {
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/iso-projects", { outsideProcesses: updated });
      await qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const addProc = async () => {
    if (!form.process.trim()) return;
    const updated = [...procs, { ...form }];
    setProcs(updated);
    setAdding(false);
    setForm({ process: '', provider: '', controlMethod: '', clause: '8.4' });
    await save(updated);
  };

  const removeProc = async (idx: number) => {
    const updated = procs.filter((_, i) => i !== idx);
    setProcs(updated);
    await save(updated);
  };

  return (
    <div className="space-y-2" data-testid="outside-processes-editor">
      {procs.length === 0 && !adding && (
        <div className="bg-white dark:bg-card rounded-xl border border-border/60 p-5"><DraftEmpty /></div>
      )}
      {procs.map((p, idx) => (
        <div key={idx} className="bg-white dark:bg-card rounded-xl border border-border/60 p-4 flex items-start justify-between gap-3" data-testid={`outside-proc-${idx}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold text-primary">{p.process}</p>
              <span className="text-[9px] font-bold bg-accent/10 text-accent border border-accent/20 rounded px-1.5 py-0.5">Cl. {p.clause}</span>
            </div>
            {p.provider && <p className="text-xs text-muted-foreground">Provider: {p.provider}</p>}
            {p.controlMethod && <p className="text-xs text-primary/70 mt-0.5">Control: {p.controlMethod}</p>}
          </div>
          <button onClick={() => removeProc(idx)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0" data-testid={`btn-remove-proc-${idx}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="bg-white dark:bg-card rounded-xl border border-accent/30 p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Process / Service *</label>
              <Input value={form.process} onChange={e => setForm(f => ({ ...f, process: e.target.value }))} placeholder="e.g., Heat Treating, Plating, Calibration" className="h-7 text-xs" data-testid="input-proc-name" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">External Provider</label>
              <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="Company or supplier name" className="h-7 text-xs" data-testid="input-proc-provider" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">Control Method</label>
              <Input value={form.controlMethod} onChange={e => setForm(f => ({ ...f, controlMethod: e.target.value }))} placeholder="e.g., Approved supplier, incoming inspection" className="h-7 text-xs" data-testid="input-proc-control" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">ISO Clause Reference</label>
              <Input value={form.clause} onChange={e => setForm(f => ({ ...f, clause: e.target.value }))} placeholder="e.g., 8.4" className="h-7 text-xs" data-testid="input-proc-clause" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={addProc} disabled={saving || !form.process.trim()} className="h-7 text-xs bg-accent hover:bg-accent/90 text-white" data-testid="btn-save-proc">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Add Process
            </Button>
            <button onClick={() => { setAdding(false); setForm({ process: '', provider: '', controlMethod: '', clause: '8.4' }); }} className="text-xs text-muted-foreground hover:text-primary">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full text-xs text-muted-foreground hover:text-accent border border-dashed border-border/60 hover:border-accent/40 rounded-xl py-2.5 flex items-center justify-center gap-1.5 transition-colors" data-testid="btn-add-outside-proc">
          <Plus className="w-3.5 h-3.5" /> Add Outside Process
        </button>
      )}
    </div>
  );
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
  onModuleSelect?: (section: SectionKey) => void;
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
                { icon: Compass, label: "Context of the Org", desc: "4.1 PESTLE/SWOT · 4.2 Interested Parties", status: "live", section: "context_org" },
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
  conversationId, onMessageSent, isPro, initialPrompt,
}: {
  conversationId: number;
  onMessageSent?: () => void;
  isPro: boolean;
  initialPrompt?: string;
}) {
  const { messages, sendMessage, isStreaming, limitReached } = useIsaChatStream(conversationId, onMessageSent);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSentPromptRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Auto-send whenever initialPrompt changes to a new value (covers both new and existing conversations)
  useEffect(() => {
    if (initialPrompt && initialPrompt !== lastSentPromptRef.current && !isStreaming) {
      lastSentPromptRef.current = initialPrompt;
      sendMessage(initialPrompt);
      setTimeout(() => onMessageSent?.(), 500);
    }
  }, [initialPrompt]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || limitReached || isStreaming) return;
    sendMessage(input);
    setInput("");
    setTimeout(() => onMessageSent?.(), 500);
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
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
      </div>

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
  testId,
  locked = false,
  collapsed = false,
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
  testId: string;
  locked?: boolean;
  collapsed?: boolean;
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      title={collapsed ? (locked ? "Upgrade to access" : label) : (locked ? "Upgrade your plan to access this module" : undefined)}
      data-testid={testId}
      className={`w-full flex items-center rounded-lg transition-all duration-150 text-sm font-medium
        ${collapsed ? "justify-center h-10 px-0" : "gap-3 px-3 py-2.5"}
        ${locked
          ? "opacity-40 cursor-not-allowed text-muted-foreground"
          : active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${active && !locked ? "text-primary" : ""}`} />
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && locked && <Lock className="w-3.5 h-3.5 shrink-0 opacity-50" />}
    </button>
  );
}
