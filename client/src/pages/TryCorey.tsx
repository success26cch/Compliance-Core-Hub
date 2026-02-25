import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, ArrowRight, Lock, User, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import coreyImg from "@assets/9_1771983400638.png";

const MAX_TRIAL_QUESTIONS = 3;

export default function TryCorey() {
  const [stage, setStage] = useState<"intro" | "chat" | "limit">("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [remaining, setRemaining] = useState(MAX_TRIAL_QUESTIONS);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      setError("Please enter your name and a valid email.");
      return;
    }
    setError("");
    setStage("chat");
  };

  const handleSend = async () => {
    if (!message.trim() || isStreaming) return;
    const userMsg = message.trim();
    setMessage("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/landing-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userMsg,
          name,
          email,
          history: messages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.limitReached) {
          setStage("limit");
          setIsStreaming(false);
          return;
        }
        throw new Error(data.error || "Failed to send message");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              assistantText += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
            if (data.remaining !== undefined) {
              setRemaining(data.remaining);
              if (data.remaining <= 0 && data.done) {
                setStage("limit");
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setIsStreaming(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] flex flex-col" data-testid="page-try-corey">
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <img src={coreyImg} alt="Corey" className="w-10 h-10 rounded-full" />
        <div>
          <h1 className="text-white font-bold text-lg" data-testid="text-try-corey-title">Ask Corey</h1>
          <p className="text-white/50 text-xs">AI-Powered Compliance Expert · OSHA 29 CFR · DOT 49 CFR Part 40</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center p-6"
            >
              <div className="w-full max-w-md" data-testid="section-try-corey-intro">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                    <Bot className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Try Corey Free</h2>
                  <p className="text-white/60">
                    Ask up to {MAX_TRIAL_QUESTIONS} compliance questions. Corey is trained on OSHA 29 CFR, DOT 49 CFR Part 40, and occupational health standards.
                  </p>
                </div>
                <form onSubmit={handleStart} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid="input-trial-name"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                    <Input
                      type="email"
                      placeholder="Your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid="input-trial-email"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm" data-testid="text-trial-error">{error}</p>}
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-6 text-lg" data-testid="button-start-trial">
                    Start Asking Corey
                  </Button>
                  <p className="text-center text-white/30 text-xs">
                    {MAX_TRIAL_QUESTIONS} free questions · No credit card required
                  </p>
                </form>
              </div>
            </motion.div>
          )}

          {stage === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="section-trial-chat">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-center">
                  <p className="text-accent text-sm font-medium">
                    {remaining} free {remaining === 1 ? "question" : "questions"} remaining
                  </p>
                </div>

                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 text-accent/40 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Ask Corey anything about OSHA compliance, DOT regulations, or workplace safety.</p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-accent text-white"
                          : "bg-white/5 text-white/90 border border-white/10"
                      }`}
                      data-testid={`message-${msg.role}-${i}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask Corey a compliance question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    disabled={isStreaming}
                    data-testid="input-trial-message"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isStreaming || !message.trim()}
                    className="bg-accent hover:bg-accent/90 text-white"
                    data-testid="button-trial-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "limit" && (
            <motion.div
              key="limit"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center p-6"
            >
              <div className="text-center max-w-md" data-testid="section-trial-limit">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">You've Used Your Free Questions</h2>
                <p className="text-white/60 mb-2">
                  Corey answered {MAX_TRIAL_QUESTIONS} questions for you. To get unlimited 24/7 compliance guidance, upgrade to Corey AI.
                </p>
                <p className="text-white/40 text-sm mb-6">
                  Unlimited questions · Compliance checklists · Audit prep · Custom reports · DOT guidance
                </p>
                <Link href="/get-started">
                  <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-6 text-lg w-full" data-testid="button-trial-upgrade">
                    Get Corey AI — $99/mo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="link" className="text-white/40 mt-4" data-testid="button-trial-home">
                    Back to Core Compliance Hub
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
