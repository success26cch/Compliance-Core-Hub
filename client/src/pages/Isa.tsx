import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ProductGate, PRODUCT_CONFIGS } from "@/components/ProductGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Send, Menu, X, ChevronRight, MessageSquare, Loader2,
  BookOpen, ClipboardCheck, MessageCircle, Share2, Monitor, Smartphone,
  ArrowRight, Trash2, Paperclip, FileText, CheckCircle2,
} from "lucide-react";
import {
  useIsaConversations,
  useCreateIsaConversation,
  useDeleteIsaConversation,
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
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "text-white rounded-br-sm whitespace-pre-wrap"
            : "text-white/90 rounded-bl-sm border border-white/10"
        }`}
        style={{ background: isUser ? ORANGE : "rgba(255,255,255,0.06)" }}
      >
        {isUser ? (
          msg.content || <span className="opacity-40 italic">…</span>
        ) : msg.content ? (
          <div className="prose prose-sm prose-invert max-w-none
            prose-p:my-1.5 prose-p:leading-relaxed
            prose-headings:text-white prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
            prose-strong:text-white
            prose-ul:my-1 prose-ul:pl-4 prose-ol:my-1 prose-ol:pl-4
            prose-li:my-0.5
            prose-code:text-orange-300 prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-code:text-xs
            prose-pre:bg-white/10 prose-pre:rounded-xl prose-pre:text-xs
            prose-blockquote:border-l-0 prose-blockquote:pl-0 prose-blockquote:not-italic prose-blockquote:text-white/80
            prose-hr:border-0 prose-hr:my-2">
            <ReactMarkdown
              components={{
                hr: () => <div className="my-2" />,
                blockquote: ({ children }) => <span className="text-white/80">{children}</span>,
                table: ({ children }) => <div className="space-y-0.5 my-1">{children}</div>,
                thead: ({ children }) => <div className="font-semibold text-white/90">{children}</div>,
                tbody: ({ children }) => <div>{children}</div>,
                tr: ({ children }) => <div className="flex flex-wrap gap-x-3">{children}</div>,
                th: ({ children }) => <span className="text-white/90 font-semibold">{children}: </span>,
                td: ({ children }) => <span className="text-white/75">{children}{"  "}</span>,
              }}
            >{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <span className="opacity-40 italic">Isa is thinking…</span>
        )}
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
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedText, setAttachedText] = useState<string | null>(null);
  const [attachedWordCount, setAttachedWordCount] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    setAttachedText(null);
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch("/api/isa/extract-document", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Extraction failed");
      const data = await res.json();
      setAttachedText(data.text);
      setAttachedWordCount(data.wordCount);
      if (data.truncated) {
        toast({ title: "Document truncated", description: "Only the first 80,000 characters were loaded — the document is very large." });
      }
    } catch {
      toast({ title: "Could not read document", description: "Try a PDF, DOCX, or plain text file.", variant: "destructive" });
      setAttachedFile(null);
      setAttachedText(null);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearAttachment() {
    setAttachedFile(null);
    setAttachedText(null);
    setAttachedWordCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSend = async (text?: string) => {
    const userInput = text || input.trim();
    if ((!userInput && !attachedText) || isStreaming || isExtracting) return;

    let content = userInput;
    if (attachedText && attachedFile) {
      const docBlock = `[Attached Document: ${attachedFile.name}]\n\n${attachedText}\n\n---`;
      content = userInput
        ? `${docBlock}\n\n${userInput}`
        : `${docBlock}\n\nPlease review this document from the perspective of a Lead ISO Auditor. Identify any compliance gaps, missing requirements, or areas that would not hold up under a third-party certification audit. Cite specific clause numbers.`;
    }

    setInput("");
    clearAttachment();
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (input.trim().length > 0 || (!!attachedText && !isExtracting)) && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-8 text-center">
            <IsaAvatar size={56} />
            <p className="text-white/70 font-semibold mt-3 text-base">Hi, I'm Isa.</p>
            <p className="text-white/40 text-sm mt-1 max-w-xs">Your ACSI Lead ISO Auditor AI — built from the perspective of a certified 3rd party auditor. I approach every question the way a certification body would evaluate it.</p>
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
            {/* Upload hint on empty state */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors text-xs"
              data-testid="button-attach-hint"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Or attach a document for Isa to audit (PDF, DOCX, TXT)
            </button>
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

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-2">

        {/* File attachment badge */}
        {attachedFile && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.07] px-3 py-2 flex-1 min-w-0">
              {isExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: ORANGE }} />
              ) : attachedText ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <FileText className="w-4 h-4 shrink-0" style={{ color: ORANGE }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-xs font-semibold truncate">{attachedFile.name}</p>
                {isExtracting && <p className="text-white/35 text-[10px]">Extracting text…</p>}
                {attachedText && <p className="text-white/35 text-[10px]">{attachedWordCount.toLocaleString()} words extracted — ready to send</p>}
              </div>
              <button
                onClick={clearAttachment}
                className="shrink-0 text-white/25 hover:text-white/60 transition-colors p-0.5"
                title="Remove attachment"
                data-testid="button-remove-attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
          className="hidden"
          data-testid="input-file-upload"
        />

        {/* Text input row */}
        <div className="flex gap-2 items-end">
          {/* Paperclip button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || isExtracting}
            title="Attach document for Isa to analyze (PDF, DOCX, TXT, CSV)"
            data-testid="button-attach-document"
            className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-all
              ${attachedText
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-white/15 bg-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.10] hover:border-white/25"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isExtracting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : attachedText
                ? <CheckCircle2 className="w-4 h-4" />
                : <Paperclip className="w-4 h-4" />
            }
          </button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedText ? "Add a question about this document, or send as-is for a full audit review…" : "Ask Isa a question…"}
            rows={1}
            className="resize-none bg-white/[0.07] border-white/15 text-white placeholder:text-white/30 focus:border-orange-500 rounded-xl text-sm"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            data-testid="input-isa-message"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!canSend}
            className="shrink-0 text-white h-11 w-11 rounded-xl p-0"
            style={{ background: ORANGE }}
            data-testid="button-isa-send"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-center text-white/20 text-[10px]">
          Isa cites clause numbers. Always verify with the official standard text.
          {" · "}Supports PDF, DOCX, TXT, CSV
        </p>
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
  const deleteConversation = useDeleteIsaConversation();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const isAdminUser = user?.isSuperadmin === true || subStatus?.isAdmin === true;
  const isIsaSubscriber = isAdminUser || subStatus?.isIsaSubscriber;
  const loading = subStatus === undefined && !user?.isSuperadmin;

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
    const conv = await createConversation.mutateAsync({ title: "New Conversation", source: "standalone" });
    setActiveConvId(conv.id);
    setSidebarOpen(false);
  };

  const handleDeleteConv = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteConversation.mutateAsync(id);
    if (activeConvId === id) {
      const remaining = (conversations as any[]).filter((c: any) => c.id !== id);
      setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
    }
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
      <ProductGate
        hasAccess={false}
        isLoading={false}
        product={PRODUCT_CONFIGS.isa}
        fullPage={true}
      >
        {null}
      </ProductGate>
    );
  }

  if (!isaProfile && !isAdminUser) {
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
            <div
              key={conv.id}
              className="group relative flex items-center rounded-xl transition-all"
              style={{
                background: activeConvId === conv.id ? `${ORANGE}18` : "transparent",
                borderLeft: activeConvId === conv.id ? `2px solid ${ORANGE}` : "2px solid transparent",
              }}
            >
              <button
                onClick={() => { setActiveConvId(conv.id); setSidebarOpen(false); }}
                data-testid={`button-conv-${conv.id}`}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 text-left text-sm min-w-0"
                style={{ color: activeConvId === conv.id ? "white" : "rgba(255,255,255,0.5)" }}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{conv.title || "Conversation"}</span>
              </button>
              <button
                onClick={(e) => handleDeleteConv(e, conv.id)}
                data-testid={`button-delete-conv-${conv.id}`}
                className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 mr-1.5 rounded-lg transition-all text-white/30 hover:text-red-400 hover:bg-red-400/10"
                title="Delete conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
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
                Your ACSI Lead ISO Auditor AI — built from the perspective of a certified 3rd party auditor. I'll tell you what would actually hold up under certification scrutiny.
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
