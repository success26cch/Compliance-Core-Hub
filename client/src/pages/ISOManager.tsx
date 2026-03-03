import { useState, useRef, useEffect } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsaConversations, useCreateIsaConversation, useIsaChatStream } from "@/hooks/use-isa-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Send, Lock, Sparkles, ChevronRight, Award,
  ClipboardCheck, FileSearch, BookOpen, Shield, Layers,
  CheckCircle2, MessageSquare, Zap, Star, Activity,
  AlertTriangle, Menu, FileText, Car, Vault,
} from "lucide-react";
import acsiLogo from "@assets/Transp1_1768928785892.png";

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
  { icon: Layers, label: "IATF 16949", prompt: "Explain the three types of internal audits required by IATF 16949 and what evidence I need for each." },
  { icon: BookOpen, label: "Quality Manual", prompt: "Help me draft the scope section and context of the organization (Clause 4) for my ISO 9001 Quality Manual." },
  { icon: Shield, label: "OH&S 45001", prompt: "What are the most common ISO 45001:2018 gaps for a manufacturing company that is new to the standard?" },
  { icon: AlertTriangle, label: "NC Response", prompt: "I received a major nonconformance against Clause 6.1 (Risk Analysis) during my IATF audit. Help me write a corrective action response." },
];

const ISA_CAPABILITIES = [
  "Clause-by-clause gap analysis",
  "Internal audit checklists",
  "Corrective action guidance",
  "Quality manual drafting",
  "Management review prep",
  "Audit finding responses",
];

const ISA_PRO_CAPABILITIES = [
  "Everything in Isa",
  "IATF 16949 internal auditing",
  "ISO 13485 medical device",
  "ISO/IEC 27001 InfoSec",
  "AS9100 aerospace auditing",
  "Second-party audit support",
];

const ISO_MANAGER_CAPABILITIES = [
  "Everything in Isa (included)",
  "AI document generation",
  "Secure document vault",
  "Version control & revision history",
  "Audit-ready document library",
  "Organization profile storage",
];

const ISO_MANAGER_PRO_CAPABILITIES = [
  "Everything in ISO Manager",
  "All 7 specialized standards",
  "Full document library — all standards",
  "Cross-standard integration guidance",
  "Second-party audit support",
  "Priority ACSI consulting access",
];

/* ─────────────────────────────────────────────────────── */
export default function ISOManager() {
  const { data: conversations } = useIsaConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateIsaConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPro = !!usageData?.isPro;
  const canAsk = !!usageData?.canAsk;

  const handleNewChat = (initialPrompt?: string) => {
    const title = initialPrompt ? initialPrompt.slice(0, 50) + "…" : "New ISO Consultation";
    createConversation(title, {
      onSuccess: (data: any) => {
        setActiveConversationId(data.id);
        setSidebarOpen(true);
      },
    });
  };

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
                      <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] px-1.5 py-0 font-bold">Pro</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Lead ISO Auditor AI · ACSI</p>
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

              <Button onClick={() => handleNewChat()} disabled={isCreating}
                className="w-full gap-2 bg-accent hover:bg-accent/90 text-white" data-testid="button-new-iso-chat">
                <Plus className="w-4 h-4" /> New Consultation
              </Button>
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
                    <button key={conv.id} onClick={() => setActiveConversationId(conv.id)}
                      data-testid={`button-iso-conversation-${conv.id}`}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 truncate ${
                        activeConversationId === conv.id ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:bg-muted"
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
            ) : (
              <IsaEmptyState onQuickPrompt={(p) => handleNewChat(p)} onNewChat={() => handleNewChat()} isCreating={isCreating} isPro={isPro} />
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

/* ─── EMPTY STATE ─────────────────────────────────────── */
function IsaEmptyState({
  onQuickPrompt, onNewChat, isCreating, isPro,
}: {
  onQuickPrompt: (p: string) => void;
  onNewChat: () => void;
  isCreating: boolean;
  isPro: boolean;
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
                Lead ISO Auditor AI — thinks like an auditor, not a search engine. Cites clause numbers, identifies gaps with objective evidence language, and guides your team from assessment through certification.
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

        {/* ── Quick Actions ── */}
        <div className="mb-8">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions — click to start a consultation</p>
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

        {/* ── Plans & Pricing ── 5 cards side by side ── */}
        <div className="mb-7">

          {/* Horizontal scroll wrapper — always shows all 5 cards */}
          <div className="overflow-x-auto -mx-6 px-6 pb-2">
            <div style={{ minWidth: "900px" }}>

            {/* Section headers — 5-column, aligned above cards */}
            <div className="grid grid-cols-5 gap-4 mb-2">
              <div className="col-span-2 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">AI Guidance Only</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <div className="flex-1 h-px bg-accent/50" />
                <Vault className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider whitespace-nowrap">ACSI ISO Manager — Isa + Documents + Vault</span>
                <div className="flex-1 h-px bg-accent/50" />
              </div>
            </div>

          {/* 5-card grid — always 5 columns */}
          <div className="grid grid-cols-5 gap-4">

            {/* Card 1 — Isa */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="h-full p-5 border-border/60 bg-white dark:bg-card hover:shadow-lg transition-all flex flex-col" data-testid="card-plan-isa">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-muted border border-border/60 flex items-center justify-center shadow-sm shrink-0">
                    <img src={acsiLogo} alt="Isa" className="w-7 h-7 object-contain" />
                  </div>
                  <div>
                    <p className="font-black text-primary leading-none">Isa</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">AI Guidance</p>
                  </div>
                </div>
                <div className="mb-4 pb-3 border-b border-border/60">
                  <p className="font-black text-accent text-3xl leading-none">$99</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Standards</p>
                  <div className="flex flex-wrap gap-1">
                    {["ISO 9001", "ISO 14001", "ISO 45001"].map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-primary border border-border/60 font-bold">{s}</span>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {ISA_CAPABILITIES.map((cap) => (
                    <li key={cap} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/settings">
                  <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white font-bold" data-testid="button-plan-isa">
                    Get Isa
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Card 2 — Isa Pro */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full p-5 border-2 border-primary/25 bg-white dark:bg-card hover:shadow-lg transition-all relative overflow-hidden flex flex-col" data-testid="card-plan-isa-pro">
                <div className="absolute top-0 inset-x-0 h-1 bg-primary rounded-t" />
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] bg-primary text-primary-foreground font-bold px-2 py-0.5 rounded-full">ALL STANDARDS</span>
                </div>
                <div className="flex items-center gap-2.5 mb-4 pr-16">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-muted border border-border/60 flex items-center justify-center shadow-sm shrink-0">
                    <img src={acsiLogo} alt="Isa" className="w-7 h-7 object-contain" />
                  </div>
                  <div>
                    <p className="font-black text-primary leading-none">Isa Pro</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">AI Guidance</p>
                  </div>
                </div>
                <div className="mb-4 pb-3 border-b border-border/60">
                  <p className="font-black text-primary dark:text-accent text-3xl leading-none">$199</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">All 7 Standards</p>
                  <div className="flex flex-wrap gap-1">
                    {["9001", "14001", "45001", "13485", "27001", "AS9100", "IATF"].map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-primary border border-border/60 font-bold">{s}</span>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {ISA_PRO_CAPABILITIES.map((cap) => (
                    <li key={cap} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-primary dark:text-accent shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/settings">
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" data-testid="button-plan-isa-pro">
                    Get Isa Pro
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Card 3 — ISO Manager */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="h-full p-5 border border-accent/30 bg-white dark:bg-card hover:shadow-lg transition-all relative overflow-hidden flex flex-col" data-testid="card-plan-iso-manager">
                <div className="absolute top-0 inset-x-0 h-1 bg-accent rounded-t" />
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-black text-primary leading-none text-sm">ISO Manager</p>
                    <p className="text-[10px] text-accent font-semibold mt-0.5">Isa Included</p>
                  </div>
                </div>
                <div className="mb-4 pb-3 border-b border-border/60">
                  <p className="font-black text-accent text-3xl leading-none">$3,588</p>
                  <p className="text-xs text-muted-foreground">per year · $299/mo</p>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Standards + Vault</p>
                  <div className="flex flex-wrap gap-1">
                    {["ISO 9001", "ISO 14001", "ISO 45001"].map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-bold">{s}</span>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {ISO_MANAGER_CAPABILITIES.map((cap) => (
                    <li key={cap} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/settings">
                  <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white font-bold" data-testid="button-plan-iso-manager">
                    Get ISO Manager
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Card 4 — ISO Manager Custom */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full p-5 border-2 border-accent/50 bg-white dark:bg-card hover:shadow-lg transition-all relative overflow-hidden flex flex-col" data-testid="card-plan-iso-manager-custom">
                <div className="absolute top-0 inset-x-0 h-1 bg-accent rounded-t" />
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] bg-accent text-white font-bold px-2 py-0.5 rounded-full">CUSTOM</span>
                </div>
                <div className="flex items-center gap-2.5 mb-4 pr-14">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-sm shrink-0">
                    <Layers className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-black text-primary leading-none text-sm">ISO Manager Custom</p>
                    <p className="text-[10px] text-accent font-semibold mt-0.5">Isa Pro Included</p>
                  </div>
                </div>
                <div className="mb-4 pb-3 border-b border-border/60">
                  <p className="font-black text-accent text-3xl leading-none">$7,988<span className="text-lg">+</span></p>
                  <p className="text-xs text-muted-foreground">per year · varies by standard</p>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Choose One Standard</p>
                  <div className="flex flex-wrap gap-1">
                    {["IATF 16949", "ISO 13485", "AS9100", "ISO 27001"].map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-bold">{s}</span>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" /><span>Isa Pro for your chosen standard</span></li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" /><span>AI document generation</span></li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" /><span>Secure document vault</span></li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" /><span>Version control &amp; audit trail</span></li>
                  <li className="flex items-start gap-1.5 text-xs font-semibold text-primary"><CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" /><span>IATF 16949: $9,988/yr</span></li>
                </ul>
                <Link href="/settings">
                  <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white font-bold" data-testid="button-plan-iso-manager-custom">
                    Get Custom
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Card 5 — ISO Manager Pro */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="h-full p-5 bg-primary hover:shadow-xl transition-all relative overflow-hidden flex flex-col" data-testid="card-plan-iso-manager-pro">
                <div className="absolute top-0 inset-x-0 h-1 bg-accent rounded-t" />
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] bg-accent text-white font-bold px-2 py-0.5 rounded-full">FULL PLATFORM</span>
                </div>
                <div className="flex items-center gap-2.5 mb-4 pr-16">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-sm shrink-0">
                    <Star className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-black text-white leading-none text-sm">ISO Manager Pro</p>
                    <p className="text-[10px] text-accent font-semibold mt-0.5">Isa Pro Included</p>
                  </div>
                </div>
                <div className="mb-4 pb-3 border-b border-white/15">
                  <p className="font-black text-accent text-3xl leading-none">$14,988</p>
                  <p className="text-xs text-white/50">per year</p>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide mb-2">All 7 Standards + Full Vault</p>
                  <div className="flex flex-wrap gap-1">
                    {["9001", "14001", "45001", "13485", "27001", "AS9100", "IATF"].map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 font-bold">{s}</span>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {ISO_MANAGER_PRO_CAPABILITIES.map((cap) => (
                    <li key={cap} className="flex items-start gap-1.5 text-xs text-white/70">
                      <CheckCircle2 className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
                <a href="mailto:info@acsi-quality.com">
                  <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white font-bold" data-testid="button-plan-iso-manager-pro">
                    Contact ACSI
                  </Button>
                </a>
              </Card>
            </motion.div>

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
                  <span className="text-muted-foreground font-normal">Customer Specific Requirements are handled by <strong className="text-primary">CESAR</strong> — ACSI's purpose-built platform for automotive suppliers.</span>
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

  const handleSubmit = (e: React.FormEvent) => {
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
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-white dark:bg-card border border-border/60 text-primary rounded-tl-sm"
                  }`}>
                    {msg.content}
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
