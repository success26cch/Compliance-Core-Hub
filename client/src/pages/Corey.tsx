import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Bot, User, Plus, Lock, Mic, MicOff, MessageSquare, Shield,
  CheckCircle2, Sparkles, ArrowRight, Download, Smartphone, MoreVertical,
  Copy, Mail, FileText, Trash2, Pencil, Share2, FileDown, ClipboardCopy,
  Printer, Volume2, VolumeX, Square
} from "lucide-react";
import { Link } from "wouter";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { queryClient, apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/1_1767636977932.png";
import jsPDF from "jspdf";

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
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
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
                CCH Platform
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
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight" data-testid="text-corey-hero">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">COREY</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            Your 24/7 AI compliance expert. OSHA recordkeeping, DOT regulations, drug testing, respirator compliance — instant answers backed by regulation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/api/login">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-lg px-8 py-6 shadow-xl shadow-accent/25" data-testid="button-corey-get-started">
                <Bot className="w-5 h-5 mr-2" /> Get Started Free
              </Button>
            </a>
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
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6" data-testid="button-corey-learn-more">
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

  useEffect(() => {
    if (!activeConversationId && conversations && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const DOCUMENT_TEMPLATES = [
    { label: "Drug & Alcohol Policy", prompt: "Generate a complete Drug & Alcohol Policy document for our company based on 49 CFR Part 40 and FMCSA 49 CFR Part 382. Include all required sections: purpose, scope, definitions, prohibited conduct, testing types (pre-employment, random, reasonable suspicion, post-accident, return-to-duty, follow-up), consequences, SAP referral, confidentiality, and employee acknowledgment. Format it as a professional policy document ready for implementation." },
    { label: "OSHA Recordkeeping SOP", prompt: "Generate a Standard Operating Procedure (SOP) for OSHA Recordkeeping based on 29 CFR 1904. Include sections for: determining work-relatedness, recordability decision criteria, first aid vs. recordable distinction, OSHA 300 Log maintenance, OSHA 300A annual summary posting requirements, OSHA 301 incident reports, employee privacy cases, electronic submission requirements, and responsible parties. Format as a professional SOP document." },
    { label: "Respiratory Protection Program", prompt: "Generate a complete Respiratory Protection Program document per OSHA 29 CFR 1910.134. Include: program administrator responsibilities, workplace hazard evaluation, respirator selection, medical evaluations, fit testing procedures (qualitative and quantitative), training requirements, use and maintenance, breathing air quality, recordkeeping, and program evaluation. Format as a professional program document." },
    { label: "Hearing Conservation Program", prompt: "Generate a Hearing Conservation Program document per OSHA 29 CFR 1910.95. Include: noise monitoring, audiometric testing program, hearing protection selection, employee training, recordkeeping requirements, action level (85 dBA) and PEL (90 dBA) procedures, baseline and annual audiograms, Standard Threshold Shift evaluation, and follow-up procedures." },
    { label: "Hazard Communication Program", prompt: "Generate a Hazard Communication Program (HazCom/GHS) document per OSHA 29 CFR 1910.1200. Include: written program elements, chemical inventory, Safety Data Sheet management, container labeling requirements (GHS pictograms, signal words, hazard statements), employee training program, non-routine tasks, contractors, and recordkeeping." },
    { label: "Return-to-Duty Checklist", prompt: "Generate a comprehensive Return-to-Duty Checklist for DOT-regulated employees per 49 CFR Part 40 Subpart O. Include: SAP initial evaluation, treatment/education completion, SAP follow-up evaluation, Clearinghouse reporting steps, return-to-duty test (negative drug / <0.02 alcohol), direct observation requirements, follow-up testing plan (minimum 6 tests in 12 months), employer documentation requirements, and employee acknowledgment." },
    { label: "Incident Investigation Form", prompt: "Generate a comprehensive Incident Investigation Form and procedure based on OSHA 29 CFR 1904.7. Include: incident details (who, what, when, where), witness statements, root cause analysis (5 Whys, Fishbone), contributing factors, OSHA recordability determination, corrective actions, preventive measures, responsible parties, follow-up dates, and management sign-off. Format as a fillable form template." },
    { label: "Lockout/Tagout (LOTO) Program", prompt: "Generate a complete Lockout/Tagout (LOTO) Program per OSHA 29 CFR 1910.147. Include: purpose and scope, definitions, responsibilities, energy control procedures, lockout/tagout device requirements, authorized and affected employee training, periodic inspections, group lockout procedures, shift/personnel changes, and contractor coordination." },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
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
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-xs" data-testid="link-cch-platform">
                CCH Platform
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
            <Button onClick={handleNewChat} variant="outline" className="w-full justify-start gap-2 border-white/20 text-white/70 hover:text-white hover:bg-white/10" data-testid="button-new-chat">
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
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-accent/60" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">Ask Corey Anything</h3>
              <p className="text-sm max-w-md mb-6">OSHA recordkeeping, DOT physicals, drug testing, respirator compliance — get instant, regulation-backed answers.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleNewChat} className="bg-accent hover:bg-accent/90" data-testid="button-start-first-chat">
                  <Plus className="w-4 h-4 mr-2" /> Start a Conversation
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10" data-testid="button-generate-document">
                      <FileText className="w-4 h-4 mr-2" /> Generate a Document
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-72">
                    {DOCUMENT_TEMPLATES.map((tmpl, i) => (
                      <DropdownMenuItem
                        key={i}
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
                        data-testid={`menu-doc-template-${i}`}
                      >
                        <FileText className="w-3.5 h-3.5 mr-2 text-accent" />
                        {tmpl.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DocumentTemplate {
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
  const { toast } = useToast();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { isListening, speechSupported, toggleListening, stopListening } = useSpeechRecognition((transcript: string) => {
    setInput(transcript);
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.prompt) {
        sendMessage(detail.prompt);
        if (onMessageSent) setTimeout(() => onMessageSent(), 500);
      }
    };
    window.addEventListener("corey-auto-send", handler);
    return () => window.removeEventListener("corey-auto-send", handler);
  }, [sendMessage, onMessageSent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || limitReached) return;
    if (isListening) {
      stopListening();
    }
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

    const cleanText = stripMarkdown(lastAssistantMsg.content);
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
              <DropdownMenuContent align="end" className="w-72">
                {documentTemplates.map((tmpl, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => {
                      sendMessage(tmpl.prompt);
                      if (onMessageSent) setTimeout(() => onMessageSent(), 500);
                    }}
                    data-testid={`menu-inline-doc-${i}`}
                  >
                    <FileText className="w-3.5 h-3.5 mr-2 text-accent" />
                    {tmpl.label}
                  </DropdownMenuItem>
                ))}
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-950/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={limitReached ? "Free limit reached — upgrade for unlimited access" : isListening ? "Listening... click mic to stop" : "Ask Corey a compliance question..."}
              className={`flex-1 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-accent/50 ${isListening ? "border-accent ring-2 ring-accent/20" : ""}`}
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
                className={`absolute right-1 top-1/2 -translate-y-1/2 ${isListening ? "text-accent" : "text-white/40 hover:text-white/70"}`}
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
            className="bg-accent hover:bg-accent/90"
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
