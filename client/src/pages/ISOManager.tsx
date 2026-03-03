import { useState, useRef, useEffect } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    prompt: "I need a gap analysis for ISO 9001:2015. Walk me through each clause and ask me questions to assess my current state.",
  },
  {
    icon: ClipboardCheck,
    label: "Audit Readiness",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
    prompt: "Help me prepare for an upcoming ISO certification audit. What should I have ready and what are the most common nonconformances?",
  },
  {
    icon: Layers,
    label: "IATF 16949",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    prompt: "Explain the three types of internal audits required by IATF 16949 and what evidence I need for each.",
  },
  {
    icon: BookOpen,
    label: "Quality Manual",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    prompt: "Help me draft the scope section and context of the organization (Clause 4) for my ISO 9001 Quality Manual.",
  },
  {
    icon: Shield,
    label: "OH&S 45001",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    prompt: "What are the most common ISO 45001:2018 gaps for a manufacturing company that is new to the standard?",
  },
  {
    icon: AlertTriangle,
    label: "NC Response",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
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
  "All Isa capabilities",
  "IATF 16949 + CSR mapping",
  "ISO 13485 medical device",
  "ISO/IEC 27001 InfoSec",
  "AS9100 aerospace auditing",
  "Second-party audit support",
  "Custom document templates",
];

function getTierInfo(usageData: any) {
  if (!usageData) return { tier: "loading", label: "—", color: "text-white/40" };
  if (usageData.isPro) return { tier: "pro", label: "Isa Pro", color: "text-violet-400" };
  if (usageData.questionCount < usageData.freeLimit) return { tier: "free", label: "Free Preview", color: "text-white/60" };
  return { tier: "locked", label: "Upgrade Required", color: "text-amber-400" };
}

export default function ISOManager() {
  const { data: conversations } = useIsaConversations();
  const { mutate: createConversation, isPending: isCreating } = useCreateIsaConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const tierInfo = getTierInfo(usageData);

  const handleNewChat = (initialPrompt?: string) => {
    const title = initialPrompt ? initialPrompt.slice(0, 50) + "..." : "New ISO Consultation";
    createConversation(title, {
      onSuccess: (data) => {
        setActiveConversationId(data.id);
      },
    });
  };

  const handleQuickPrompt = (prompt: string) => {
    handleNewChat(prompt);
  };

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[hsl(222,47%,7%)]">

        {/* LEFT SIDEBAR */}
        <div className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col border-r border-white/10`}>
          <div className="flex flex-col h-full bg-[hsl(222,47%,9%)]">

            {/* Isa Identity Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <img src={acsiLogo} alt="ACSI" className="w-10 h-10 object-contain" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-[hsl(222,47%,9%)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-base">Isa</span>
                    <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/40 text-[10px] px-1.5 py-0 font-semibold">
                      {tierInfo.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40 leading-tight">Lead ISO Auditor AI · ACSI</p>
                </div>
              </div>

              {/* Standards Badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                {ISA_STANDARDS.map((s) => {
                  const available = usageData?.isPro
                    ? ISA_TIER_STANDARDS.professional.includes(s.code)
                    : ISA_TIER_STANDARDS.essentials.includes(s.code);
                  return (
                    <span
                      key={s.code}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                        available
                          ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                          : "bg-white/5 text-white/25 border-white/10"
                      }`}
                    >
                      {s.code}
                    </span>
                  );
                })}
              </div>

              {/* New Chat Button */}
              <Button
                onClick={() => handleNewChat()}
                disabled={isCreating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2 font-semibold"
                data-testid="button-new-iso-chat"
              >
                <Plus className="w-4 h-4" />
                New Consultation
              </Button>
            </div>

            {/* Tier Capabilities */}
            <div className="p-4 border-b border-white/10">
              <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">
                {usageData?.isPro ? "Isa Pro Capabilities" : "Isa Capabilities"}
              </div>
              <ul className="space-y-1.5">
                {(usageData?.isPro ? ISA_PRO_CAPABILITIES : ISA_CAPABILITIES).map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-xs text-white/60">
                    <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>
              {!usageData?.isPro && (
                <Link href="/settings">
                  <button className="mt-3 w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium">
                    <Zap className="w-3 h-3" />
                    Unlock Isa Pro — $149/mo
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                </Link>
              )}
            </div>

            {/* Conversation History */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-4 pt-3 pb-1 text-xs font-bold text-white/30 uppercase tracking-widest">
                Recent Sessions
              </div>
              <ScrollArea className="flex-1 px-2 pb-2">
                <div className="space-y-0.5">
                  {conversations?.length === 0 && (
                    <p className="text-xs text-white/30 px-2 py-3 text-center">No sessions yet</p>
                  )}
                  {conversations?.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      data-testid={`button-iso-conversation-${conv.id}`}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate flex items-center gap-2 ${
                        activeConversationId === conv.id
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                          : "text-white/50 hover:bg-white/5 hover:text-white/80"
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 shrink-0 opacity-60" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Usage meter */}
            {usageData && !usageData.isPro && (
              <div className="p-4 border-t border-white/10">
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>Free questions used</span>
                  <span>{usageData.questionCount} / {usageData.freeLimit}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div
                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usageData.questionCount / usageData.freeLimit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Top Bar */}
          <div className="h-12 bg-[hsl(222,47%,10%)] border-b border-white/10 flex items-center px-4 gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/40 hover:text-white transition-colors p-1 rounded"
              data-testid="button-toggle-sidebar"
            >
              <Layers className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-sm font-semibold text-white/80">Isa</span>
              <span className="text-xs text-white/30">·</span>
              <span className="text-xs text-white/40">ACSI Lead ISO Auditor AI</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {usageData?.isPro ? (
                <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30 text-xs gap-1">
                  <Star className="w-3 h-3" /> Isa Pro
                </Badge>
              ) : (
                <Badge className="bg-white/10 text-white/50 border-white/10 text-xs">
                  Free Preview
                </Badge>
              )}
            </div>
          </div>

          {/* Chat or Empty State */}
          <div className="flex-1 overflow-hidden flex flex-col relative">

            {/* Hard gate — limit reached */}
            {usageData && !usageData.canAsk && !activeConversationId && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[hsl(222,47%,7%)]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-lg w-full"
                >
                  <div className="bg-[hsl(222,47%,11%)] border border-white/10 rounded-2xl p-8 text-center space-y-5">
                    <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2">Unlock Full ISO Guidance</h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        You've used your free preview with Isa. Choose a plan to continue with full gap analysis, audit readiness, and management system guidance.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="bg-[hsl(222,47%,14%)] border border-indigo-500/30 rounded-xl p-4 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-indigo-400" />
                          <span className="font-bold text-white text-sm">Isa</span>
                        </div>
                        <p className="text-white/40 text-xs mb-3">ISO 9001 · 14001 · 45001</p>
                        <p className="text-indigo-400 font-black text-lg mb-3">$49<span className="text-xs text-white/40 font-normal">/mo</span></p>
                        <Link href="/settings">
                          <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold" data-testid="button-upgrade-isa">
                            Get Isa
                          </Button>
                        </Link>
                      </div>
                      <div className="bg-[hsl(222,47%,14%)] border border-violet-500/40 rounded-xl p-4 text-left relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded px-1.5 py-0.5 font-semibold">BEST</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-violet-400" />
                          <span className="font-bold text-white text-sm">Isa Pro</span>
                        </div>
                        <p className="text-white/40 text-xs mb-3">All 7 ISO standards + CSRs</p>
                        <p className="text-violet-400 font-black text-lg mb-3">$149<span className="text-xs text-white/40 font-normal">/mo</span></p>
                        <Link href="/settings">
                          <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold" data-testid="button-upgrade-isa-pro">
                            Get Isa Pro
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeConversationId ? (
              <ISOChatInterface
                conversationId={activeConversationId}
                onMessageSent={() => refetchUsage()}
                isPro={!!usageData?.isPro}
              />
            ) : (
              <IsaEmptyState onQuickPrompt={handleQuickPrompt} onNewChat={() => handleNewChat()} isCreating={isCreating} />
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

/* ─── EMPTY STATE ─── */
function IsaEmptyState({ onQuickPrompt, onNewChat, isCreating }: { onQuickPrompt: (p: string) => void; onNewChat: () => void; isCreating: boolean }) {
  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Isa Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150" />
            <div className="relative w-24 h-24 bg-[hsl(222,47%,13%)] border border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(99,102,241,0.15)]">
              <img src={acsiLogo} alt="ACSI" className="w-14 h-14 object-contain" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-indigo-600 rounded-full border-2 border-[hsl(222,47%,7%)] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
            <Activity className="w-3 h-3 animate-pulse" />
            ACSI ISO MANAGER AI
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            Meet <span className="text-indigo-400">Isa</span>
          </h1>
          <p className="text-white/50 text-sm max-w-md mx-auto leading-relaxed">
            Your Lead ISO Auditor AI — trained on ACSI's field-proven audit methodology across all major ISO management system standards. I think like an auditor, not a search engine.
          </p>

          {/* Standards row */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {ISA_STANDARDS.map((s) => (
              <span key={s.code} className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-semibold">
                ISO {s.code} <span className="text-indigo-400/60">· {s.label}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Quick Action Cards */}
        <div className="mb-8">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_PROMPTS.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                onClick={() => onQuickPrompt(item.prompt)}
                disabled={isCreating}
                data-testid={`button-quick-prompt-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`text-left p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group ${item.bg} disabled:opacity-50`}
              >
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3 ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <p className={`text-sm font-bold mb-1 ${item.color}`}>{item.label}</p>
                <p className="text-xs text-white/40 leading-snug line-clamp-2">{item.prompt}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Two-tier comparison */}
        <div className="mb-8">
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Plans</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Isa */}
            <div className="bg-[hsl(222,47%,11%)] border border-indigo-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="font-black text-white">Isa</span>
                <span className="ml-auto text-indigo-400 font-black">$49<span className="text-xs text-white/40 font-normal">/mo</span></span>
              </div>
              <p className="text-xs text-white/40 mb-3">Core ISO quality, environmental & safety</p>
              <ul className="space-y-1.5 mb-4">
                {ISA_TIER_STANDARDS.essentials.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-xs text-white/60">
                    <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                    ISO {s === "9001" ? "9001:2015 — Quality Management" : s === "14001" ? "14001:2015 — Environmental" : "45001:2018 — OH&S"}
                  </li>
                ))}
                {ISA_CAPABILITIES.map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-xs text-white/60">
                    <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                    {cap}
                  </li>
                ))}
              </ul>
              <Link href="/settings">
                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold" data-testid="button-plan-isa">
                  Get Isa
                </Button>
              </Link>
            </div>

            {/* Isa Pro */}
            <div className="bg-[hsl(222,47%,11%)] border border-violet-500/40 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-violet-600/20 border-l border-b border-violet-500/30 rounded-bl-xl px-3 py-1 text-[10px] font-black text-violet-300 uppercase tracking-wide">
                Pro
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-violet-400" />
                  <span className="font-black text-white">Isa Pro</span>
                  <span className="ml-auto text-violet-400 font-black">$149<span className="text-xs text-white/40 font-normal">/mo</span></span>
                </div>
                <p className="text-xs text-white/40 mb-3">All 7 standards + automotive CSRs</p>
                <ul className="space-y-1.5 mb-4">
                  {ISA_PRO_CAPABILITIES.map((cap) => (
                    <li key={cap} className="flex items-center gap-2 text-xs text-white/60">
                      <CheckCircle2 className="w-3 h-3 text-violet-400 shrink-0" />
                      {cap}
                    </li>
                  ))}
                </ul>
                <Link href="/settings">
                  <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold" data-testid="button-plan-isa-pro">
                    Get Isa Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Start CTA */}
        <div className="text-center">
          <Button
            onClick={onNewChat}
            disabled={isCreating}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 gap-2"
            data-testid="button-start-iso-chat"
          >
            <Sparkles className="w-4 h-4" />
            {isCreating ? "Starting session..." : "Start ISO Consultation"}
          </Button>
          <p className="text-xs text-white/25 mt-2">Powered by ACSI's field-proven audit methodology</p>
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-white/10 text-white/70"
                    : "bg-indigo-600/20 border border-indigo-500/30"
                }`}>
                  {msg.role === "user" ? (
                    <span className="text-xs font-bold">You</span>
                  ) : (
                    <img src={acsiLogo} alt="Isa" className="w-5 h-5 object-contain" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex-1 max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs font-bold text-indigo-400">Isa</span>
                      <span className="text-[10px] text-white/25">Lead ISO Auditor AI</span>
                      {isPro && <span className="text-[10px] bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded px-1 font-semibold">Pro</span>}
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600/30 border border-indigo-500/30 text-white rounded-tr-sm"
                      : "bg-[hsl(222,47%,13%)] border border-white/10 text-white/85 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming indicator */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <img src={acsiLogo} alt="Isa" className="w-5 h-5 object-contain animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs font-bold text-indigo-400">Isa</span>
                  <span className="text-[10px] text-white/25">auditing your question...</span>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-[hsl(222,47%,13%)] border border-white/10">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Limit reached in-chat message */}
          {limitReached && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-8 text-center"
            >
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-white/70 mb-1">Free preview complete</p>
              <p className="text-xs text-white/40 mb-4">Upgrade to continue this consultation with Isa</p>
              <div className="flex gap-3">
                <Link href="/settings">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold" data-testid="button-upgrade-from-chat">
                    Get Isa — $49/mo
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="border-violet-500/40 text-violet-400 hover:bg-violet-500/10 text-xs font-semibold">
                    Isa Pro — $149/mo
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input Bar */}
      <div className="shrink-0 bg-[hsl(222,47%,9%)] border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                limitReached
                  ? "Upgrade to continue with Isa..."
                  : isStreaming
                  ? "Isa is analyzing..."
                  : "Ask Isa about gap analysis, audit readiness, clause requirements..."
              }
              disabled={isStreaming || limitReached}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-indigo-500/50 focus:ring-indigo-500/20 pr-12 h-11"
              data-testid="input-iso-message"
            />
          </div>
          <Button
            type="submit"
            disabled={isStreaming || limitReached || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-4 gap-1.5 font-semibold disabled:opacity-30"
            data-testid="button-send-iso-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-white/20 mt-2">
          Isa cites clause numbers and uses ACSI's field-proven auditing methodology
        </p>
      </div>
    </div>
  );
}
