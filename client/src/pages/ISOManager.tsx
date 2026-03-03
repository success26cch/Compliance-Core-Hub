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
  Plus,
  Send,
  Lock,
  Sparkles,
  ChevronRight,
  Award,
  ClipboardCheck,
  FileSearch,
  BookOpen,
  Shield,
  Layers,
  CheckCircle2,
  MessageSquare,
  Zap,
  Star,
  Activity,
  AlertTriangle,
  Menu,
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
  {
    icon: FileSearch,
    label: "Gap Analysis",
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    border: "border-accent/20 hover:border-accent/50",
    prompt: "I need a gap analysis for ISO 9001:2015. Walk me through each clause and ask me questions to assess my current state.",
  },
  {
    icon: ClipboardCheck,
    label: "Audit Readiness",
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    border: "border-accent/20 hover:border-accent/50",
    prompt: "Help me prepare for an upcoming ISO certification audit. What should I have ready and what are the most common nonconformances?",
  },
  {
    icon: Layers,
    label: "IATF 16949",
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    border: "border-accent/20 hover:border-accent/50",
    prompt: "Explain the three types of internal audits required by IATF 16949 and what evidence I need for each.",
  },
  {
    icon: BookOpen,
    label: "Quality Manual",
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    border: "border-accent/20 hover:border-accent/50",
    prompt: "Help me draft the scope section and context of the organization (Clause 4) for my ISO 9001 Quality Manual.",
  },
  {
    icon: Shield,
    label: "OH&S 45001",
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    border: "border-accent/20 hover:border-accent/50",
    prompt: "What are the most common ISO 45001:2018 gaps for a manufacturing company that is new to the standard?",
  },
  {
    icon: AlertTriangle,
    label: "NC Response",
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    border: "border-accent/20 hover:border-accent/50",
    prompt: "I received a major nonconformance against Clause 6.1 (Risk Analysis) during my IATF audit. Help me write a corrective action response.",
  },
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
  "IATF 16949 + CSR mapping",
  "ISO 13485 medical device",
  "ISO/IEC 27001 InfoSec",
  "AS9100 aerospace auditing",
  "Second-party audit support",
  "Custom document templates",
];

export default function ISOManager() {
  const { data: conversations } = useIsaConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateIsaConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isPro = !!usageData?.isPro;
  const canAsk = !!usageData?.canAsk;

  const handleNewChat = (initialPrompt?: string) => {
    const title = initialPrompt ? initialPrompt.slice(0, 50) + "…" : "New ISO Consultation";
    createConversation(title, {
      onSuccess: (data) => setActiveConversationId(data.id),
    });
  };

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted/30">

        {/* SIDEBAR */}
        <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-200 overflow-hidden flex-shrink-0`}>
          <div className="w-72 h-full flex flex-col bg-white dark:bg-card border-r border-border/60">

            {/* Isa identity */}
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
                    {isPro ? (
                      <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] px-1.5 py-0 font-bold">Pro</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Free</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Lead ISO Auditor AI · ACSI</p>
                </div>
              </div>

              {/* Standard badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                {ISA_STANDARDS.map((s) => {
                  const active = isPro
                    ? ISA_TIER_STANDARDS.professional.includes(s.code)
                    : ISA_TIER_STANDARDS.essentials.includes(s.code);
                  return (
                    <span
                      key={s.code}
                      title={`ISO ${s.code} — ${s.label}`}
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold transition-colors ${
                        active
                          ? "bg-accent/10 text-accent border-accent/30"
                          : "bg-muted text-muted-foreground/40 border-border/50"
                      }`}
                    >
                      {s.code}
                    </span>
                  );
                })}
              </div>

              <Button
                onClick={() => handleNewChat()}
                disabled={isCreating}
                className="w-full gap-2 bg-accent hover:bg-accent/90 text-white"
                data-testid="button-new-iso-chat"
              >
                <Plus className="w-4 h-4" />
                New Consultation
              </Button>
            </div>

            {/* Capabilities */}
            <div className="p-4 border-b border-border/60 bg-muted/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {isPro ? "Isa Pro Capabilities" : "Isa Capabilities"}
              </p>
              <ul className="space-y-1.5">
                {(isPro ? ISA_PRO_CAPABILITIES : ISA_CAPABILITIES).map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>
              {!isPro && (
                <Link href="/settings">
                  <button className="mt-3 w-full text-xs text-accent hover:text-accent/80 flex items-center gap-1 font-medium transition-colors">
                    <Zap className="w-3 h-3" />
                    Unlock Isa Pro — $149/mo
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                </Link>
              )}
            </div>

            {/* History */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Sessions</p>
              <ScrollArea className="flex-1 px-2 pb-2">
                <div className="space-y-0.5">
                  {!conversations?.length && (
                    <p className="text-xs text-muted-foreground/50 text-center py-4">No sessions yet</p>
                  )}
                  {conversations?.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      data-testid={`button-iso-conversation-${conv.id}`}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 truncate ${
                        activeConversationId === conv.id
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 shrink-0 opacity-50" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Usage meter */}
            {usageData && !isPro && (
              <div className="p-4 border-t border-border/60 bg-muted/20">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Free questions used</span>
                  <span>{usageData.questionCount} / {usageData.freeLimit}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usageData.questionCount / usageData.freeLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="h-12 bg-white dark:bg-card border-b border-border/60 flex items-center px-4 gap-3 shrink-0 shadow-sm">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-muted"
              data-testid="button-toggle-sidebar"
            >
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
                <Activity className="w-3 h-3 text-accent" />
                <span>Online</span>
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

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col relative">

            {/* Paywall overlay */}
            {usageData && !canAsk && !activeConversationId && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-muted/60 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="max-w-md w-full p-8 text-center space-y-5 shadow-xl">
                    <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-primary mb-2">Unlock Full ISO Guidance</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        You've used your free preview with Isa. Choose a plan to continue with full gap analysis, audit readiness, and management systems guidance.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="border border-accent/20 rounded-xl p-4 text-left">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Award className="w-4 h-4 text-accent" />
                          <span className="font-bold text-primary text-sm">Isa</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">9001 · 14001 · 45001</p>
                        <p className="text-accent font-black text-lg mb-3">$49<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                        <Link href="/settings">
                          <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white text-xs" data-testid="button-upgrade-isa">Get Isa</Button>
                        </Link>
                      </div>
                      <div className="border-2 border-primary/30 rounded-xl p-4 text-left relative bg-primary/5">
                        <div className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">BEST</div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Star className="w-4 h-4 text-primary dark:text-accent" />
                          <span className="font-bold text-primary text-sm">Isa Pro</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">All 7 standards</p>
                        <p className="text-primary font-black text-lg mb-3 dark:text-accent">$149<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
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

/* ─── EMPTY STATE ─── */
function IsaEmptyState({
  onQuickPrompt,
  onNewChat,
  isCreating,
  isPro,
}: {
  onQuickPrompt: (p: string) => void;
  onNewChat: () => void;
  isCreating: boolean;
  isPro: boolean;
}) {
  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="mb-8 overflow-hidden border-border/60 shadow-sm">
            {/* Header strip — dark primary with orange accent */}
            <div className="bg-primary px-6 py-5 flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <img src={acsiLogo} alt="ACSI" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-black text-white">Isa</h1>
                  <span className="text-xs bg-accent/20 text-accent border border-accent/40 rounded-full px-2 py-0.5 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ACSI ISO Manager
                  </span>
                </div>
                <p className="text-white/60 text-sm">Lead ISO Auditor AI — trained on ACSI's field-proven audit methodology</p>
              </div>
            </div>

            {/* Standards bar */}
            <div className="bg-muted/50 px-6 py-3 border-b border-border/60 flex flex-wrap gap-2">
              {ISA_STANDARDS.map((s) => (
                <span key={s.code} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-muted text-primary border border-border/60 shadow-sm">
                  ISO {s.code} · {s.label}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="px-6 py-5 bg-white dark:bg-card">
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                I think like an auditor, not a search engine. I cite clause numbers, identify gaps with objective evidence language, and guide your team from assessment through certification readiness — across all major ISO management system standards.
              </p>
              <Button
                onClick={onNewChat}
                disabled={isCreating}
                className="bg-accent hover:bg-accent/90 text-white gap-2 font-semibold"
                data-testid="button-start-iso-chat"
              >
                <MessageSquare className="w-4 h-4" />
                {isCreating ? "Starting..." : "Start ISO Consultation"}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-primary mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_PROMPTS.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.3 }}
                onClick={() => onQuickPrompt(item.prompt)}
                disabled={isCreating}
                data-testid={`button-quick-prompt-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`text-left p-4 rounded-xl bg-white dark:bg-card border transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group ${item.border} disabled:opacity-50`}
              >
                <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center mb-3`}>
                  <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <p className="text-sm font-bold text-primary mb-1">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{item.prompt}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Plans comparison */}
        <div>
          <h2 className="text-sm font-bold text-primary mb-3">Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Isa */}
            <Card className="p-5 border-border/60 bg-white dark:bg-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                    <Award className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-black text-primary text-sm">Isa</p>
                    <p className="text-xs text-muted-foreground">ISO Quality, Environmental & Safety</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-accent">$49</p>
                  <p className="text-xs text-muted-foreground">/mo</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {ISA_TIER_STANDARDS.essentials.map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded font-semibold">ISO {s}</span>
                ))}
              </div>
              <ul className="space-y-1.5 mb-4">
                {ISA_CAPABILITIES.map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>
              <Link href="/settings">
                <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white font-semibold" data-testid="button-plan-isa">
                  Get Isa
                </Button>
              </Link>
            </Card>

            {/* Isa Pro */}
            <Card className="p-5 border-2 border-primary/20 bg-white dark:bg-card relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                BEST VALUE
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Star className="w-4 h-4 text-primary dark:text-accent" />
                    </div>
                    <div>
                      <p className="font-black text-primary text-sm">Isa Pro</p>
                      <p className="text-xs text-muted-foreground">All standards + Automotive CSRs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary dark:text-accent">$149</p>
                    <p className="text-xs text-muted-foreground">/mo</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {ISA_TIER_STANDARDS.professional.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary dark:text-accent border border-primary/20 rounded font-semibold">ISO {s}</span>
                  ))}
                </div>
                <ul className="space-y-1.5 mb-4">
                  {ISA_PRO_CAPABILITIES.map((cap) => (
                    <li key={cap} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-primary dark:text-accent shrink-0" />
                      {cap}
                    </li>
                  ))}
                </ul>
                <Link href="/settings">
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" data-testid="button-plan-isa-pro">
                    Get Isa Pro
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

/* ─── CHAT INTERFACE ─── */
function ISOChatInterface({
  conversationId,
  onMessageSent,
  isPro,
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
      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground border-primary/20"
                    : "bg-white dark:bg-card border-border/60"
                }`}>
                  {msg.role === "user" ? (
                    <span className="text-[10px] font-bold">You</span>
                  ) : (
                    <img src={acsiLogo} alt="Isa" className="w-5 h-5 object-contain" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-primary">Isa</span>
                      <span className="text-[10px] text-muted-foreground">Lead ISO Auditor AI</span>
                      {isPro && (
                        <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 rounded px-1 font-semibold">Pro</span>
                      )}
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

          {/* Streaming */}
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
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-accent"
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upgrade nudge in-chat */}
          {limitReached && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-6 text-center border-border/60 shadow-sm">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-accent/20">
                  <Lock className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-bold text-primary mb-1">Free preview complete</p>
                <p className="text-xs text-muted-foreground mb-4">Upgrade to continue your ISO consultation with Isa</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/settings">
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold text-xs" data-testid="button-upgrade-from-chat">
                      Get Isa — $49/mo
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 text-xs font-semibold">
                      Isa Pro — $149/mo
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 bg-white dark:bg-card border-t border-border/60 px-4 py-4 shadow-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              limitReached
                ? "Upgrade to continue with Isa…"
                : isStreaming
                ? "Isa is analyzing…"
                : "Ask about gap analysis, audit readiness, clause requirements, NCs…"
            }
            disabled={isStreaming || limitReached}
            className="flex-1 bg-muted/40 border-border/70 focus:border-accent focus:ring-accent/20 h-11"
            data-testid="input-iso-message"
          />
          <Button
            type="submit"
            disabled={isStreaming || limitReached || !input.trim()}
            className="bg-accent hover:bg-accent/90 text-white h-11 px-4 gap-1.5 font-semibold"
            data-testid="button-send-iso-message"
          >
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
