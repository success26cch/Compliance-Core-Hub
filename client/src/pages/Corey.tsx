import { useState, useRef, useEffect } from "react";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Plus, Lock, Mic, MicOff, MessageSquare, Shield, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import logoUrl from "@assets/1_1767636977932.png";

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
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6" data-testid="button-corey-learn-more">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
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
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Audit prep tools</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> PDF compliance checklists</li>
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

  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewChat = () => {
    createConversation("New Question", {
      onSuccess: (data) => {
        setActiveConversationId(data.id);
        setSidebarOpen(false);
      },
    });
  };

  useEffect(() => {
    if (!activeConversationId && conversations && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

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
              <Badge variant="secondary" className="bg-white/10 text-white/60 border-white/20 text-xs" data-testid="badge-corey-usage">
                {usageData.questionCount}/{usageData.freeLimit} free
              </Badge>
            )}
            {usageData?.isPro && (
              <Badge className="bg-accent/20 text-accent border-accent/30 text-xs" data-testid="badge-corey-unlimited">
                Unlimited
              </Badge>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10 text-xs" data-testid="link-cch-platform">
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
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-accent/20 text-accent font-medium"
                      : "text-white/50 hover:bg-white/10 hover:text-white/70"
                  }`}
                  data-testid={`button-conversation-${conv.id}`}
                >
                  {conv.title}
                </button>
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
            <CoreyChatInterface conversationId={activeConversationId} onMessageSent={() => refetchUsage()} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-accent/60" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">Ask Corey Anything</h3>
              <p className="text-sm max-w-md mb-6">OSHA recordkeeping, DOT physicals, drug testing, respirator compliance — get instant, regulation-backed answers.</p>
              <Button onClick={handleNewChat} className="bg-accent hover:bg-accent/90" data-testid="button-start-first-chat">
                <Plus className="w-4 h-4 mr-2" /> Start a Conversation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoreyChatInterface({ conversationId, onMessageSent }: { conversationId: number; onMessageSent?: () => void }) {
  const { messages, sendMessage, isStreaming, limitReached } = useChatStream(conversationId, onMessageSent);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, speechSupported, toggleListening, stopListening } = useSpeechRecognition((transcript: string) => {
    setInput(transcript);
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-accent/60" />
              </div>
              <h3 className="text-white/50 font-medium mb-2">How can I help you today?</h3>
              <p className="text-white/30 text-sm max-w-md mx-auto">Ask about OSHA recordability, DOT compliance, drug testing protocols, or any workplace safety question.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["Is this injury recordable?", "DOT physical requirements", "Random drug testing rules", "Respirator fit testing"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-colors"
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
              <div className={`
                rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] md:max-w-[75%]
                ${msg.role === 'user'
                  ? 'bg-primary/80 text-white rounded-tr-sm'
                  : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-sm'}
              `}>
                <div className="prose prose-sm prose-invert">
                  {msg.content || (isStreaming && idx === messages.length - 1 ? (
                    <span className="flex items-center gap-2 text-white/40">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                      Thinking...
                    </span>
                  ) : "")}
                </div>
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
