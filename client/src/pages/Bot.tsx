import { useState } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot as BotIcon, User, Plus, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function BotPage() {
  const { data: conversations, isLoading: isLoadingConvos } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  
  // Create a new conversation if none exist or user wants new one
  const handleNewChat = () => {
    createConversation("New Consultation", {
      onSuccess: (data) => setActiveConversationId(data.id),
    });
  };

  // If we have conversations but none active, set the first one active
  if (!activeConversationId && conversations && conversations.length > 0) {
    setActiveConversationId(conversations[0].id);
  }

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-12rem)] gap-6">
        {/* Chat Sidebar (History) */}
        <div className="w-64 hidden lg:flex flex-col bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <Button onClick={handleNewChat} variant="outline" className="w-full justify-start gap-2">
              <Plus className="w-4 h-4" /> New Consultation
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {conversations?.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
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
                  <Button size="sm" variant="outline">Upgrade for $29/mo</Button>
                </Link>
              )}
            </div>
          )}

          {/* Subscription Gate for Free Users after limit reached */}
          {usageData && !usageData.canAsk && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
              <Card className="max-w-md w-full p-6 text-center space-y-4 shadow-2xl border-accent/20">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Unlock Unlimited Questions</h3>
                <p className="text-muted-foreground">
                  You've used all 10 free questions. Subscribe to the OccHealth Consultant for unlimited access at just $29/month.
                </p>
                <Link href="/settings">
                  <Button className="w-full bg-accent hover:bg-accent/90">Subscribe Now - $29/mo</Button>
                </Link>
              </Card>
            </div>
          )}

          {activeConversationId ? (
            <ChatInterface conversationId={activeConversationId} onMessageSent={() => refetchUsage()} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <BotIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a conversation or start a new one to consult with the AI expert.</p>
              <Button onClick={handleNewChat} className="mt-4">Start New Chat</Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}

function ChatInterface({ conversationId, onMessageSent }: { conversationId: number; onMessageSent?: () => void }) {
  const { messages, sendMessage, isStreaming } = useChatStream(conversationId);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    // Refetch usage after sending message
    if (onMessageSent) {
      setTimeout(() => onMessageSent(), 1000);
    }
  };

  return (
    <>
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-accent/10 text-accent'}
              `}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <BotIcon className="w-4 h-4" />}
              </div>
              <div className={`
                rounded-2xl px-5 py-3.5 text-sm leading-relaxed max-w-[80%] shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted/50 text-foreground border border-border/50 rounded-tl-sm'}
              `}>
                <div className="prose prose-sm dark:prose-invert">
                  {msg.content || (isStreaming && idx === messages.length - 1 ? "Thinking..." : "")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-border/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about OSHA 1904 regulations..."
            className="flex-1"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
