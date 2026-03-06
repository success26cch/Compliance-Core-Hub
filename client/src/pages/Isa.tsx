import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Send, Menu, X, ChevronRight, MessageSquare, Loader2,
  BookOpen, ClipboardCheck, MessageCircle, Share2, Monitor, Smartphone,
  ArrowRight,
} from "lucide-react";
import {
  useIsaConversations,
  useCreateIsaConversation,
  useIsaChatStream,
} from "@/hooks/use-isa-chat";

const ORANGE = "hsl(24,95%,53%)";
const BG = "hsl(222,47%,11%)";
const BG2 = "hsl(222,47%,8%)";

const QUICK_PROMPTS = [
  { icon: MessageCircle, label: "Clause Question", prompt: "Ask a clause question" },
  { icon: ClipboardCheck, label: '"Would I Pass?"', prompt: "Would I pass an audit check?" },
  { icon: BookOpen, label: "Audit Debrief", prompt: "Help me interpret an audit finding" },
  { icon: ArrowRight, label: "Standard Transition", prompt: "I'm transitioning to a new standard" },
];

function IsaAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-black shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45, background: ORANGE }}
    >
      I
    </div>
  );
}

function MessageBubble({ msg }: { msg: { role: string; content: string } }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      {!isUser && <IsaAvatar size={32} />}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "text-white rounded-br-sm"
            : "text-white/90 rounded-bl-sm border border-white/10"
        }`}
        style={{
          background: isUser ? ORANGE : "rgba(255,255,255,0.06)",
        }}
      >
        {msg.content || <span className="opacity-40 italic">Isa is thinking…</span>}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/60 text-xs font-bold shrink-0">
          You
        </div>
      )}
    </div>
  );
}

function WelcomeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
    else if (/Android/i.test(ua)) setPlatform("android");
    else setPlatform("desktop");
  }, []);

  const handleClose = () => {
    localStorage.setItem("isa-welcomed", "1");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border-white/15" style={{ background: BG }}>
        <DialogHeader>
          <div className="flex flex-col items-center mb-2">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-3"
              style={{ background: ORANGE }}
            >
              I
            </div>
            <DialogTitle className="text-white text-xl font-black">Welcome to Isa!</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-white/55 text-sm text-center mb-4">Add Isa to your phone for one-tap access from anywhere.</p>

        {platform === "ios" && (
          <div className="space-y-2 mb-4">
            {["Tap the Share icon at the bottom of Safari", 'Tap "Add to Home Screen"', 'Tap "Add" — done!'].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/65">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: ORANGE }}>{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
        )}
        {platform === "android" && (
          <div className="space-y-2 mb-4">
            {['Tap the address bar — look for the "Install app" icon (⊕)', "Or tap ⋮ menu → Install app → Install"].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/65">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: ORANGE }}>{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
        )}
        {platform === "desktop" && (
          <div className="flex items-start gap-2 text-sm text-white/55 mb-4">
            <Monitor className="w-4 h-4 shrink-0 mt-0.5 text-white/30" />
            Open <strong className="text-white/70 mx-1">corecompliancehub.com/isa</strong> on your phone to install.
          </div>
        )}

        <Button className="w-full font-bold text-white" style={{ background: ORANGE }} onClick={handleClose} data-testid="button-welcome-modal-close">
          Got it, let's go! <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function IsaChatInterface({ conversationId, onNewChat }: { conversationId: number; onNewChat: () => void }) {
  const { messages, sendMessage, isStreaming } = useIsaChatStream(conversationId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isStreaming) return;
    setInput("");
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-8 text-center">
            <IsaAvatar size={56} />
            <p className="text-white/70 font-semibold mt-3 text-base">Hi, I'm Isa.</p>
            <p className="text-white/40 text-sm mt-1 max-w-xs">Your ACSI Lead ISO Auditor AI. Ask me anything about your management system standards.</p>
            <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-sm">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(qp.prompt)}
                  data-testid={`button-quick-prompt-${i}`}
                  className="rounded-xl p-3 text-left border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all"
                >
                  <qp.icon className="w-4 h-4 mb-1.5" style={{ color: ORANGE }} />
                  <p className="text-white/80 text-xs font-semibold">{qp.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3 mb-4">
            <IsaAvatar size={32} />
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06]">
              <Loader2 className="w-4 h-4 animate-spin text-white/40" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Isa a question…"
            rows={1}
            className="resize-none bg-white/[0.07] border-white/15 text-white placeholder:text-white/30 focus:border-orange-500 rounded-xl text-sm"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            data-testid="input-isa-message"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 text-white h-11 w-11 rounded-xl p-0"
            style={{ background: ORANGE }}
            data-testid="button-isa-send"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-center text-white/20 text-[10px] mt-2">Isa cites clause numbers. Always verify with the official standard text.</p>
      </div>
    </div>
  );
}

export default function IsaApp() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: subStatus } = useQuery<any>({ queryKey: ["/api/subscriptions/status"] });
  const { data: isaProfile } = useQuery<any>({ queryKey: ["/api/isa-profile"], retry: false });
  const { data: conversations = [] } = useIsaConversations();
  const createConversation = useCreateIsaConversation();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const isIsaSubscriber = subStatus?.isIsaSubscriber || subStatus?.isAdmin;
  const loading = subStatus === undefined;

  useEffect(() => {
    if (isIsaSubscriber && !localStorage.getItem("isa-welcomed")) {
      setShowWelcomeModal(true);
    }
  }, [isIsaSubscriber]);

  useEffect(() => {
    if (conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations]);

  const handleNewChat = async () => {
    const conv = await createConversation.mutateAsync("New Conversation");
    setActiveConvId(conv.id);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ORANGE }} />
      </div>
    );
  }

  if (!isIsaSubscriber) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: BG }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-4"
          style={{ background: ORANGE }}
        >
          I
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Meet Isa</h1>
        <p className="text-white/50 text-sm mb-6 max-w-sm">
          Isa is your ACSI Lead ISO Auditor AI — clause-cited answers, audit coaching, and corrective action guidance. Available as a standalone subscription.
        </p>
        <Link href="/meet-isa">
          <Button className="font-bold text-white px-8" style={{ background: ORANGE }} data-testid="button-isa-upsell">
            See Isa Plans <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  if (!isaProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: BG }}>
        <IsaAvatar size={56} />
        <h1 className="text-xl font-black text-white mt-4 mb-2">Finish Your Profile</h1>
        <p className="text-white/50 text-sm mb-6 max-w-xs">
          Tell Isa your standards and focus areas so she can personalize every answer.
        </p>
        <Link href="/isa-profile">
          <Button className="font-bold text-white" style={{ background: ORANGE }} data-testid="button-setup-profile">
            Set Up Profile <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  const displayName = isaProfile?.preferredName || user?.firstName || "there";

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: BG }}>
      <WelcomeModal open={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 md:z-auto flex-col w-72 h-full border-r border-white/10 transition-transform duration-200 md:flex ${
          sidebarOpen ? "flex translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ background: BG2 }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <IsaAvatar size={28} />
            <span className="text-white font-black text-sm">Isa</span>
            <span className="text-white/30 text-xs">by ACSI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 py-3">
          <Button
            onClick={handleNewChat}
            disabled={createConversation.isPending}
            className="w-full justify-start gap-2 text-sm font-semibold rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.10] text-white"
            variant="ghost"
            data-testid="button-new-isa-conversation"
          >
            <Plus className="w-4 h-4" style={{ color: ORANGE }} />
            New Conversation
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {(conversations as any[]).map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => { setActiveConvId(conv.id); setSidebarOpen(false); }}
              data-testid={`button-conv-${conv.id}`}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-sm"
              style={{
                background: activeConvId === conv.id ? `${ORANGE}18` : "transparent",
                color: activeConvId === conv.id ? "white" : "rgba(255,255,255,0.5)",
                borderLeft: activeConvId === conv.id ? `2px solid ${ORANGE}` : "2px solid transparent",
              }}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{conv.title || "Conversation"}</span>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-white/25 text-xs px-3 pt-2">No conversations yet. Start your first one!</p>
          )}
        </div>

        {/* Profile footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 text-xs font-bold">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-semibold truncate">{displayName}</p>
              <p className="text-white/35 text-[10px] truncate">{isaProfile?.companyName || "Isa Subscriber"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-white/50 hover:text-white"
            data-testid="button-sidebar-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <IsaAvatar size={28} />
            <div>
              <p className="text-white text-sm font-bold leading-tight">Isa</p>
              <p className="text-white/35 text-[10px] leading-tight">ACSI Lead ISO Auditor AI</p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="text-white/40 hover:text-white transition-colors"
            title="New conversation"
            data-testid="button-new-chat-topbar"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          {activeConvId ? (
            <IsaChatInterface
              conversationId={activeConvId}
              onNewChat={handleNewChat}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <IsaAvatar size={56} />
              <h2 className="text-white font-black text-xl mt-4 mb-2">Hi {displayName}, I'm Isa.</h2>
              <p className="text-white/45 text-sm mb-6 max-w-xs">
                Your ACSI Lead ISO Auditor AI. Clause-cited answers, audit coaching, and corrective action guidance.
              </p>
              <Button
                onClick={handleNewChat}
                className="font-bold text-white"
                style={{ background: ORANGE }}
                data-testid="button-start-first-conversation"
              >
                Start a Conversation <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
