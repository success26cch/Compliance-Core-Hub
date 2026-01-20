import { useState } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations, useCreateConversation, useChatStream } from "@/hooks/use-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { Link } from "wouter";
import { 
  Plus, 
  Send, 
  FileCheck, 
  Lock,
  Bot as BotIcon,
  ClipboardCheck,
  FileText,
  Shield
} from "lucide-react";
import acsiLogo from "@assets/Transp1_1768928785892.png";

export default function ISOManager() {
  const { data: conversations, isLoading } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const handleNewChat = () => {
    createConversation("New ISO Consultation", {
      onSuccess: (data) => setActiveConversationId(data.id),
    });
  };

  return (
    <ProtectedLayout>
      <div className="flex gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Sidebar - Conversation List */}
        <div className="w-72 bg-white rounded-xl border border-border/50 shadow-sm flex flex-col">
          <div className="p-4 border-b border-border/50">
            <Button onClick={handleNewChat} className="w-full gap-2" data-testid="button-new-iso-chat">
              <Plus className="w-4 h-4" />
              New ISO Consultation
            </Button>
          </div>
          
          {/* ISO Features Overview */}
          <div className="p-4 border-b border-border/50 bg-accent/5">
            <h3 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-accent" />
              ISO Management Services
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-1.5">
                <ClipboardCheck className="w-3 h-3 text-accent" />
                Gap Analysis (ISO 9001/14001/45001)
              </li>
              <li className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-accent" />
                Quality Manual Drafting
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-accent" />
                Internal Audit Preparation
              </li>
            </ul>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations?.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  data-testid={`button-iso-conversation-${conv.id}`}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate ${
                    activeConversationId === conv.id 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {conv.title}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden relative">
          {/* Question Usage Counter */}
          {usageData && !usageData.isPro && (
            <div className="bg-muted/50 px-4 py-2 text-sm text-muted-foreground border-b flex justify-between items-center">
              <span>Free questions: {usageData.questionCount} / {usageData.freeLimit} used</span>
              {usageData.questionCount >= usageData.freeLimit && (
                <Link href="/settings">
                  <Button size="sm" variant="outline">Upgrade for ISO Access</Button>
                </Link>
              )}
            </div>
          )}

          {/* Subscription Gate for Free Users after limit reached */}
          {usageData && !usageData.canAsk && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
              <Card className="max-w-lg w-full p-6 text-center space-y-4 shadow-2xl border-accent/20">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Unlock ISO Management</h3>
                <p className="text-muted-foreground">
                  Get full access to ISO 9001, 14001, and 45001 guidance with our professional tiers.
                </p>
                <div className="space-y-3 pt-2">
                  <Link href="/settings">
                    <Button className="w-full bg-accent hover:bg-accent/90">ISO Essentials - $49/mo</Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full">ISO Professional - $149/mo</Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {activeConversationId ? (
            <ISOChatInterface conversationId={activeConversationId} onMessageSent={() => refetchUsage()} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer" className="inline-block cursor-pointer">
                <img src={acsiLogo} alt="ACSI" className="h-20 w-auto mb-4 hover:opacity-80 transition-opacity" data-testid="img-acsi-logo" />
              </a>
              <h3 className="text-lg font-semibold text-primary mb-2">ACSI ISO Manager</h3>
              <p className="max-w-md mb-4">
                Your Lead ISO Auditor for ISO 9001, 14001, and 45001. Get help with Gap Analysis, 
                Quality Manuals, and Internal Audit preparation with a "Write-Up Free" philosophy.
              </p>
              <Button onClick={handleNewChat} className="mt-4" data-testid="button-start-iso-chat">
                Start ISO Consultation
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

function ISOChatInterface({ conversationId, onMessageSent }: { conversationId: number; onMessageSent?: () => void }) {
  const { messages, sendMessage, isStreaming, limitReached } = useChatStream(conversationId, onMessageSent);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || limitReached) return;
    sendMessage(input);
    setInput("");
    if (onMessageSent) {
      setTimeout(() => onMessageSent(), 500);
    }
  };

  return (
    <>
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent/10 text-accent'}
              `}>
                {msg.role === 'user' ? 'You' : <FileCheck className="w-5 h-5" />}
              </div>
              <div className={`
                flex-1 p-4 rounded-xl max-w-[85%]
                ${msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-muted/50 border border-border/50'}
              `}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <FileCheck className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground">ISO Manager is analyzing...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-border/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={limitReached ? "Upgrade required for ISO guidance" : "Ask about ISO 9001, 14001, 45001 requirements..."}
            className="flex-1"
            disabled={isStreaming || limitReached}
            data-testid="input-iso-message"
          />
          <Button type="submit" size="icon" disabled={isStreaming || limitReached || !input.trim()} data-testid="button-send-iso-message">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
