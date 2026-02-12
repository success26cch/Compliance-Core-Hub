import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCreateLead } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, Bot, FileText, ArrowRight, Activity, GraduationCap, Stethoscope, Syringe, Shield, ClipboardList, ChevronDown, ChevronUp, Users, Award, TrendingDown, MessageSquare, HelpCircle, Phone, Building2, Zap, Gift, QrCode, Shirt, Trophy, Star, Package, Sparkles, Menu, X, Send, Loader2, ShoppingCart, Mic, MicOff } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logoUrl from "@assets/1_1767636977932.png";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import mentorshipLogo from "@assets/tree.transp_1768928785893.png";
import brandNSwagLogo from "@assets/2026_BNS_Logo_1768928815681.png";
import cchLogo from "@assets/1_1770683748423.png";
import teamImageUrl from "@assets/1-8_website_picture_1767901013934.png";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";
import BilingualAssistant from "@/components/BilingualAssistant";
import { useCart } from "@/hooks/use-cart";
import { PRODUCTS } from "@/lib/products";
import { CartTrigger } from "@/components/CartDrawer";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  const { mutate, isPending } = useCreateLead();
  const { addItem } = useCart();

  const handleAddToCart = (productId: string) => {
    const product = PRODUCTS[productId];
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        unitAmount: product.unitAmount,
        currency: product.currency,
        interval: product.interval,
        category: product.category,
      });
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  interface BotMessage { role: "user" | "assistant"; content: string }
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [botInput, setBotInput] = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const [botLimitReached, setBotLimitReached] = useState(false);
  const [botRemaining, setBotRemaining] = useState(3);
  const botScrollRef = useRef<HTMLDivElement>(null);
  const { isListening: botListening, speechSupported: botSpeechSupported, toggleListening: botToggleListening, stopListening: botStopListening } = useSpeechRecognition((text) => setBotInput(text));

  useEffect(() => {
    if (botScrollRef.current) {
      botScrollRef.current.scrollTop = botScrollRef.current.scrollHeight;
    }
  }, [botMessages]);

  const handleBotSubmit = useCallback(async () => {
    if (!botInput.trim() || botLoading || botLimitReached) return;
    botStopListening();
    const userMsg = botInput.trim();
    setBotInput("");
    const newMessages: BotMessage[] = [...botMessages, { role: "user", content: userMsg }];
    setBotMessages(newMessages);
    setBotLoading(true);

    try {
      const response = await fetch("/api/landing-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg, history: newMessages }),
      });
      if (!response.ok) {
        const err = await response.json();
        if (err.limitReached) {
          setBotLimitReached(true);
          setBotRemaining(0);
          return;
        }
        throw new Error(err.error);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");
      let fullText = "";
      setBotMessages(prev => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullText += data.content;
                setBotMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: fullText };
                  return updated;
                });
              }
              if (data.remaining !== undefined) {
                setBotRemaining(data.remaining);
              }
              if (data.done && data.remaining === 0) {
                setBotLimitReached(true);
              }
            } catch {}
          }
        }
      }
    } catch {
      setBotMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setBotLoading(false);
    }
  }, [botInput, botLoading, botLimitReached, botMessages]);

  const form = useForm<z.infer<typeof leadFormSchema>>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof leadFormSchema>) => {
    mutate(data, {
      onSuccess: () => {
        form.reset();
        window.open('/api/cheat-sheet/download', '_blank');
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-[hsl(222,47%,11%)] sticky top-0 z-[9999]">
        <div className="flex items-center justify-between h-12 px-4 gap-2">
          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide flex-1">
            <a href="#features" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-features">Features</a>
            <a href="#pricing" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-pricing">Pricing</a>
            <Link href="/resources" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-resources">Free Resources</Link>
            <a href="#courses" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-training">Training</a>
            <Link href="/mentorship" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-mentorship">Mentorship</Link>
            <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-brandnswag">BrandNSwag</a>
            <a href="#bilingual-assistant" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-bilingual">Med Assistant</a>
            <a href="#faq" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-faq">FAQ</a>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <CartTrigger />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-white text-[hsl(222,47%,11%)] hover:bg-gray-100 font-semibold" data-testid="button-nav-dashboard">Dashboard</Button>
              </Link>
            ) : (
              <a href="/api/login">
                <Button size="sm" className="bg-white text-[hsl(222,47%,11%)] hover:bg-gray-100 font-semibold" data-testid="button-nav-signin">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center w-full">
              <img src={logoUrl} alt="Core Compliance Hub" className="h-56 md:h-80 lg:h-96 w-auto mx-auto -mb-4" />
              <img src={teamImageUrl} alt="CCH Team - Safety Professionals" className="w-full max-w-5xl h-auto object-contain mx-auto" />
            </div>
            
            <div className="flex items-center justify-center gap-6 md:gap-10 py-4">
              <div className="flex flex-col items-center gap-2 group" data-testid="logo-cch">
                <img src={cchLogo} alt="CCH" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                <span className="text-xs md:text-sm font-semibold text-primary">CCH</span>
              </div>
              <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group cursor-pointer" data-testid="logo-acsi-link">
                <img src={acsiLogo} alt="ACSI" className="w-16 h-16 md:w-20 md:h-20 object-contain group-hover:opacity-80 transition-opacity" />
                <span className="text-xs md:text-sm font-semibold text-primary group-hover:underline">ACSI</span>
              </a>
              <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group cursor-pointer" data-testid="logo-brandnswag-link">
                <img src={brandNSwagLogo} alt="BrandNSwag" className="w-16 h-16 md:w-20 md:h-20 object-contain group-hover:opacity-80 transition-opacity" />
                <span className="text-xs md:text-sm font-semibold text-primary group-hover:underline">BrandNSwag</span>
              </a>
            </div>
            
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 text-accent font-semibold text-sm border border-accent/30">
                <Activity className="w-4 h-4 animate-pulse" />
                THE ONE STOP EMPLOYER SHOP
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-primary leading-[1.1] text-center">
              It's Your Reputation,<br /><span className="text-accent">Compliance Isn't a Guessing Game.</span>
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-primary leading-[1.1] text-center">
              Welcome to Core Compliance Hub,<br /><span className="text-accent">Welcome to the Future of Compliance.</span>
            </p>
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5 border-l-4 border-accent p-4 rounded-r-lg">
              <p className="text-lg text-primary leading-relaxed">
                CCH is the all-in-one compliance Eco-System command center for employers who are tired of the confusing regulations, the OSHA 300 recordables and scattered safety programs.
              </p>
              <p className="text-xl font-bold text-accent mt-2">
                The First Ever AI Designed just for Occupational Health. Safety Made Smart. Growth Made Possible.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <span><strong className="text-primary">AI-Powered Compliance:</strong> Get instant, expert answers on OSHA 300 recordability, DOT physicals, and drug testing—24/7.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <span><strong className="text-primary">ISO Certification Ready:</strong> 9001, 14001, 45001—our Lead Auditor AI guides you from gap analysis to audit day.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <span><strong className="text-primary">Professional Training:</strong> Self-paced courses with certificates your auditors actually respect.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <span><strong className="text-primary">Employee Recognition:</strong> BrandNSwag turns safety milestones into rewards your team actually wants.</span>
                </li>
              </ul>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-xl p-8 relative z-10" data-testid="card-lead-magnet">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl"></div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold font-display text-primary">Free Recordability Cheat Sheet</h3>
                      <p className="text-muted-foreground">
                        Stop guessing. Download our comprehensive guide to OSHA 1904 recordability criteria.
                      </p>
                    </div>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Your Name" className="h-12 bg-muted/50" data-testid="input-lead-name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Work Email" className="h-12 bg-muted/50" data-testid="input-lead-email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full font-semibold" disabled={isPending} data-testid="button-download-cheatsheet">
                          {isPending ? "Sending..." : "Download Now"}
                        </Button>
                      </form>
                    </Form>
                    <p className="text-xs text-center text-muted-foreground">
                      Join other safety professionals trusting Core Compliance Hub - CCH.
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>

            <div className="relative mt-6 max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-lg blur-sm opacity-75"></div>
              <div className="relative bg-black text-white text-center py-4 px-6 rounded-lg">
                <p className="text-lg md:text-xl font-bold">
                  Start owning your compliance!
                </p>
                <p className="text-accent font-semibold mt-1">
                  Join other companies who ditched the guesswork.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/25" data-testid="button-hero-get-started">
                  Get Started Free
                </Button>
              </a>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-hero-see-features">
                  See Features
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CCH Expert Bot */}
      <section className="relative bg-[hsl(222,47%,11%)] overflow-hidden py-12" id="cch-bot" data-testid="section-cch-bot">
        <div className="absolute inset-0 opacity-5">
          <div className="animate-marquee whitespace-nowrap flex items-center h-full">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="text-6xl font-black mx-8 text-white">CCH BOT</span>
            ))}
          </div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-black text-white" data-testid="text-cch-bot-title">
                CCH Expert Bot
              </h3>
            </div>
            <p className="text-white/70 text-sm">
              Powered by CCH AI &middot; {botRemaining} free question{botRemaining !== 1 ? "s" : ""} remaining
            </p>
          </div>

          <Card className="overflow-hidden border-0 shadow-2xl" data-testid="card-cch-bot">
            <div
              ref={botScrollRef}
              className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30"
              data-testid="bot-messages"
            >
              {botMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Ask the CCH Expert Bot</p>
                    <p className="text-sm mt-1">Ask about OSHA recordability, DOT physicals, drug testing, ISO audits, or any compliance question.</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {["Is a laceration needing stitches OSHA recordable?", "What's required for a DOT physical?", "Explain ISO 45001 basics"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setBotInput(q); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
                        data-testid={`button-suggestion-${q.slice(0, 15).replace(/\s/g, "-").toLowerCase()}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {botMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`bot-message-${i}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-card-foreground"
                  }`}>
                    {msg.content || (botLoading && i === botMessages.length - 1 ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                      </span>
                    ) : null)}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3 bg-card">
              {botLimitReached ? (
                <div className="text-center space-y-3 py-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    You've used your free questions. Sign up to unlock unlimited access!
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <a href="/api/login">
                      <Button data-testid="button-bot-signup">
                        Sign Up Free <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </a>
                    <a href="#pricing">
                      <Button variant="outline" data-testid="button-bot-pricing">View Plans</Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={botInput}
                        onChange={(e) => setBotInput(e.target.value)}
                        placeholder={botListening ? "Listening..." : "Ask a compliance question..."}
                        disabled={botLoading}
                        onKeyDown={(e) => e.key === "Enter" && handleBotSubmit()}
                        className={`pr-9 ${botListening ? "ring-2 ring-accent/30 border-accent" : ""}`}
                        data-testid="input-bot-question"
                      />
                      {botSpeechSupported && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={botToggleListening}
                          disabled={botLoading}
                          className={`absolute right-0.5 top-1/2 -translate-y-1/2 ${botListening ? "text-accent" : "text-muted-foreground"}`}
                          data-testid="button-bot-mic"
                        >
                          {botListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleBotSubmit}
                      disabled={!botInput.trim() || botLoading}
                      data-testid="button-bot-submit"
                    >
                      {botLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  {botListening && (
                    <p className="text-xs text-center text-muted-foreground animate-pulse" data-testid="text-bot-listening">
                      Speak now... tap the mic again to stop.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Trust & Statistics Banner */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-foreground/70 text-sm">Compliance Questions Answered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">$2.5M+</div>
              <div className="text-primary-foreground/70 text-sm">In Potential Fines Prevented</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/70 text-sm">Companies Protected</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">98%</div>
              <div className="text-primary-foreground/70 text-sm">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Spanish Bilingual Medical Assistant */}
      <BilingualAssistant />

      {/* How It Works */}
      <section className="py-24 bg-white border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              From question to compliant answer in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mx-auto mb-6">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-accent mb-2">Step 1</div>
              <h3 className="text-xl font-bold text-primary mb-3">Ask Your Question</h3>
              <p className="text-muted-foreground">
                Describe your workplace situation in plain English. No legal jargon required.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mx-auto mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-accent mb-2">Step 2</div>
              <h3 className="text-xl font-bold text-primary mb-3">Get Expert Guidance</h3>
              <p className="text-muted-foreground">
                Receive instant, regulation-backed answers citing specific OSHA and DOT codes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent mx-auto mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-accent mb-2">Step 3</div>
              <h3 className="text-xl font-bold text-primary mb-3">Stay Compliant</h3>
              <p className="text-muted-foreground">
                Document your decisions and keep your workplace audit-ready at all times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">Everything you need for compliance</h2>
            <p className="text-lg text-muted-foreground">
              Built for safety managers, HR directors, and occupational health professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard 
              icon={Bot}
              title="OccHealth Consultant"
              description="OSHA recordables, DOT compliance, and drug screening guidance. Get instant, expert answers on OSHA recordability, DOT physicals, drug testing, and more — citing specific OSHA 1904 and DOT FMCSA codes. Includes our interactive OSHA 300 'Log it or Not' decision tool so you never second-guess a recordability call again."
            />
            <FeatureCard 
              imageSrc={acsiLogo}
              title="ACSI ISO Manager"
              description="Powered by ACSI Services Intl. — your expert partner for ISO 9001, 14001, 45001, IATF 16949 and more. From gap analysis to audit-ready preparation, ACSI brings 25+ years of real-world consulting, training, and auditing experience to help you get certified, stay certified, and keep your logs and decisions documented for any surprise inspection."
            />
          </div>

          {/* ACSI Self-Assessment Questions Box */}
          <div className="mt-8 max-w-4xl mx-auto" data-testid="acsi-assessment-box">
            <div className="rounded-2xl border-2 border-[#F57C00] bg-gradient-to-br from-[#F57C00]/10 via-[#FF9800]/5 to-[#FFC107]/10 p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <img src={acsiLogo} alt="ACSI" className="w-10 h-10 object-contain" data-testid="img-acsi-assessment-logo" />
                <h3 className="text-2xl font-display font-bold text-foreground">Is Your Management System Really Ready?</h3>
              </div>
              <p className="text-muted-foreground">
                Before your next audit, ask yourself these three critical questions:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-md bg-[#F57C00]/10 border border-[#F57C00]/20">
                  <span className="text-[#F57C00] font-bold text-lg shrink-0 mt-0.5">1.</span>
                  <p className="text-foreground font-medium">
                    Are you confident your company could pass a certification audit <span className="italic">right now</span> — without scrambling to get documents in order?
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-md bg-[#F57C00]/10 border border-[#F57C00]/20">
                  <span className="text-[#F57C00] font-bold text-lg shrink-0 mt-0.5">2.</span>
                  <p className="text-foreground font-medium">
                    Can you honestly say your system is strong enough to avoid a major nonconformance — one that could cost you your certification?
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-md bg-[#F57C00]/10 border border-[#F57C00]/20">
                  <span className="text-[#F57C00] font-bold text-lg shrink-0 mt-0.5">3.</span>
                  <p className="text-foreground font-medium">
                    Could you use some expert guidance just to make sure you're on the right track — before it's too late?
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#F57C00]/20 space-y-4">
                <p className="text-foreground">
                  If you answered <span className="font-bold text-[#F57C00]">"no"</span> — or even <span className="font-bold text-[#F57C00]">"maybe not"</span> — to any of these questions, you're not alone. That's exactly why ACSI exists.
                </p>
                <p className="text-muted-foreground">
                  With 25+ years of hands-on experience in ISO 9001, ISO 14001, ISO 45001, and IATF 16949, ACSI Services International helps companies close compliance gaps, build audit-ready systems, and develop internal teams that own the process — not just survive it. <span className="font-semibold text-foreground">This is what CCH is all about: bridging the gap between where you are and where you need to be.</span>
                </p>
                <a
                  href="https://acsi-quality.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-acsi-contact"
                >
                  <Button className="bg-[#F57C00] text-white border-[#F57C00] mt-2">
                    Visit ACSI &amp; Send a Message
                  </Button>
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Occupational Health Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              tier="Safety Starter"
              price="Free"
              period=""
              features={["3 Questions / month", "OSHA recordability guidance", "Basic DOT compliance help"]}
              bestFor="Small teams or one-off 'Is this a recordable?' checks."
              buttonText="Get Started"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
            />
            <PricingCard 
              tier="Compliance Pro"
              price="$29"
              period="/mo"
              features={["15 Questions / month", "PDF Compliance Checklists", "Priority response times", "DOT physical guidance"]}
              bestFor="Growing companies needing regular DOT/OSHA guidance."
              buttonText="Upgrade to Pro"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
              highlighted
              productId="cch-compliance-pro"
              onAddToCart={handleAddToCart}
            />
            <PricingCard 
              tier="Unlimited Safety"
              price="$99"
              period="/mo"
              features={["Unlimited AI Questions", "Audit Prep Tools", "Custom compliance reports", "Dedicated support"]}
              bestFor="Safety Managers handling high-risk environments or large fleets."
              buttonText="Go Unlimited"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
              productId="cch-unlimited-safety"
              onAddToCart={handleAddToCart}
            />
          </div>
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-3">Not sure which plan is right for you?</p>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact-occ-pricing">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Us — We'll Help You Decide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ISO Management Pricing Section */}
      <section className="py-24 bg-white dark:bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer" className="inline-block cursor-pointer">
              <img src={acsiLogo} alt="ACSI" className="h-16 w-auto mx-auto mb-4 hover:opacity-80 transition-opacity" data-testid="img-acsi-logo-landing" />
            </a>
            <h2 className="text-3xl font-display font-bold text-primary">ISO Management Plans</h2>
            <p className="text-lg text-muted-foreground">
              ISO 9001, 14001, and 45001 certification support. Management as a Service.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              tier="ISO Essentials"
              price="$49"
              period="/mo"
              features={["5 AI Gap Analysis checks", "Procedure Templates", "ISO 9001/14001/45001 guidance"]}
              bestFor="Startups preparing for first certification."
              buttonText="Start ISO Journey"
              buttonHref="https://acsi-quality.com/"
              external
              productId="iso-essentials"
              onAddToCart={handleAddToCart}
            />
            <PricingCard 
              tier="ISO Professional"
              price="$149"
              period="/mo"
              features={["Unlimited ISO AI guidance", "Internal Audit Checklists", "'Write-Up Free' Guarantee tools", "Quality Manual drafting"]}
              bestFor="Companies maintaining ISO 9001/14001/45001."
              buttonText="Go Professional"
              buttonHref="https://acsi-quality.com/"
              external
              highlighted
              productId="iso-professional"
              onAddToCart={handleAddToCart}
            />
            <PricingCard 
              tier="Integrated Enterprise"
              price="$299"
              period="/mo"
              features={["CCH + ACSI Combined", "Full Health, Safety & ISO suite", "Audit Readiness Dashboard", "Up to 50 employees included", "+$2/employee beyond 50", "Priority expert support"]}
              bestFor="Mid-sized firms with high compliance risk."
              buttonText="Enterprise Bundle"
              buttonHref={isAuthenticated ? "/dashboard" : "/api/login"}
              productId="integrated-enterprise"
              onAddToCart={handleAddToCart}
            />
          </div>
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-3">Questions about ISO certification or audit readiness?</p>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact-iso-pricing">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Us — Let's Talk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Additional Services Pricing */}
      <section className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">Specialized Services</h2>
            <p className="text-lg text-muted-foreground">
              Add-on services to expand your compliance and engagement capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 flex flex-col" data-testid="card-landing-bma-pricing">
              <Badge variant="secondary" className="self-start mb-3">Clinic Tool</Badge>
              <h3 className="text-lg font-bold text-primary mb-1">Spanish Bilingual Medical Assistant</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-primary">$149</span>
                <span className="text-muted-foreground text-sm">/mo per location</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Unlimited Spanish bilingual translations", "Clinical commands in Spanish", "Body map injury reporting", "Printable clinical summaries"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => handleAddToCart("bma-subscription")} data-testid="button-add-cart-bma">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Link href="/bma-subscription">
                  <Button variant="outline" className="w-full" data-testid="button-landing-bma">Learn More</Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-landing-retainer-pricing">
              <Badge variant="secondary" className="self-start mb-3">Human Expert</Badge>
              <h3 className="text-lg font-bold text-primary mb-1">Expert Retainer</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-primary">$499</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Professional safety director support", "Crisis response within 24hrs", "OSHA 300 log audits", "Audit defense preparation"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => handleAddToCart("expert-retainer")} data-testid="button-add-cart-retainer">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Link href="/contact">
                  <Button variant="outline" className="w-full" data-testid="button-landing-retainer">Contact Us</Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-landing-mentorship-pricing">
              <Badge className="self-start mb-3">CCH Exclusive</Badge>
              <h3 className="text-lg font-bold text-primary mb-1">ACSI Mentorship</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-xl font-bold text-primary">From $2,500</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {["12-week intensive program", "1-on-1 Lead Auditor mentoring", "Foundation ($2,500) or Executive ($5,000)", "Mock audit simulation (Executive)"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => handleAddToCart("mentorship-foundation")} data-testid="button-add-cart-mentorship">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart — Foundation
                </Button>
                <Link href="/mentorship">
                  <Button variant="outline" className="w-full" data-testid="button-landing-mentorship">View Program</Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 flex flex-col" data-testid="card-landing-brandnswag-pricing">
              <Badge variant="secondary" className="self-start mb-3">Recognition</Badge>
              <h3 className="text-lg font-bold text-primary mb-1">BrandNSwag Platform</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-primary">$49</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {["QR code recognition system", "Points tracking & leaderboards", "Employee reward triggers", "Monthly engagement reports"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => handleAddToCart("brandnswag-platform")} data-testid="button-add-cart-brandnswag">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Link href="/brandnswag">
                  <Button variant="outline" className="w-full" data-testid="button-landing-brandnswag">Learn More</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Training Courses Section */}
      <section id="courses" className="py-24 bg-white dark:bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-6 space-y-4">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-24 w-auto mx-auto mb-2" data-testid="img-training-logo" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mx-auto">
              <GraduationCap className="w-5 h-5" />
              Professional Training
            </div>
            <h2 className="text-3xl font-display font-bold text-primary">CCH Compliance Training Courses</h2>
            <p className="text-lg text-muted-foreground">
              Part of CCH's ongoing commitment to helping companies understand, comply, and stay compliant with federal and state regulations. Self-paced courses with certificates of completion.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto p-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30 mt-8 mb-4" data-testid="card-free-compliance-pro-promo">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                  <Gift className="w-8 h-8 text-accent" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-primary">Purchase Any Course — Get a Free OccHealth Program Consultation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Every course purchase includes a complimentary one-on-one consultation to review your occupational health program with a real compliance expert.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
            <CourseCard 
              icon={Stethoscope}
              title="DOT Medical Certification"
              description="Master DOT physical requirements, disqualifying conditions, medical holds, and the clearance process for CDL drivers."
              price="$199"
              modules="4 Chapters"
              courseUrl="https://your-teachable-site.teachable.com/p/dot-medical-certification"
              productId="course-dot-medical"
              onAddToCart={handleAddToCart}
              chapters={[
                "Chapter 1: Introduction to DOT Physical Requirements",
                "Chapter 2: Understanding Disqualifying Conditions",
                "Chapter 3: Medical Holds & Waiting Periods",
                "Chapter 4: The Medical Examiner Certification Process"
              ]}
            />
            <CourseCard 
              icon={Shield}
              title="OSHA Medical Surveillance"
              description="Respirator physicals, asbestos exams, HAZWOPER requirements, PFTs, and fit testing compliance."
              price="$249"
              modules="4 Chapters"
              courseUrl="https://your-teachable-site.teachable.com/p/osha-medical-surveillance"
              productId="course-osha-surveillance"
              onAddToCart={handleAddToCart}
              chapters={[
                "Chapter 1: Respirator Medical Evaluations",
                "Chapter 2: Asbestos & Lead Medical Surveillance",
                "Chapter 3: HAZWOPER Physical Requirements",
                "Chapter 4: Pulmonary Function Testing & Fit Testing"
              ]}
            />
            <CourseCard 
              icon={Syringe}
              title="Drug & Alcohol Testing"
              description="DOT vs Non-DOT testing, MRO roles, Clearinghouse compliance, return-to-duty process, and 5 vs 10-panel testing."
              price="$199"
              modules="4 Chapters"
              courseUrl="https://your-teachable-site.teachable.com/p/drug-alcohol-testing"
              productId="course-drug-alcohol"
              onAddToCart={handleAddToCart}
              chapters={[
                "Chapter 1: DOT vs Non-DOT Testing Requirements",
                "Chapter 2: Medical Review Officer (MRO) Process",
                "Chapter 3: Clearinghouse Compliance & Queries",
                "Chapter 4: Return-to-Duty & Follow-Up Testing"
              ]}
            />
            <CourseCard 
              icon={ShieldCheck}
              title="ISO Management Systems"
              description="Complete ISO 9001, 14001, 45001 training. HLS structure, gap analysis, internal auditing, and CAPA mastery."
              price="$349"
              modules="12 Modules"
              highlighted
              courseUrl="https://your-teachable-site.teachable.com/p/iso-management-systems"
              productId="course-iso-management"
              onAddToCart={handleAddToCart}
              chapters={[
                "Module 1: Introduction to ISO Standards",
                "Module 2: High-Level Structure (HLS) Overview",
                "Module 3: ISO 9001 Quality Management",
                "Module 4: ISO 14001 Environmental Management",
                "Module 5: ISO 45001 Occupational Health & Safety",
                "Module 6: Gap Analysis Methodology",
                "Module 7: Documentation Requirements",
                "Module 8: Internal Audit Planning",
                "Module 9: Conducting Effective Audits",
                "Module 10: Nonconformity & CAPA",
                "Module 11: Management Review",
                "Module 12: Certification Preparation"
              ]}
            />
            <CourseCard 
              icon={ClipboardList}
              title="OSHA Recordkeeping Master"
              description="Recordables Reimagined: Master OSHA 300 logs, reduce TRIR/EMR, avoid costly mistakes, and conduct internal audits."
              price="$299"
              modules="10 Modules"
              courseUrl="https://your-teachable-site.teachable.com/p/osha-recordkeeping-master"
              productId="course-osha-recordkeeping"
              onAddToCart={handleAddToCart}
              chapters={[
                "Module 1: OSHA Recordkeeping Overview",
                "Module 2: General Recording Criteria",
                "Module 3: Work-Relatedness Determination",
                "Module 4: Days Away, Restricted, or Transfer",
                "Module 5: First Aid vs. Medical Treatment",
                "Module 6: Privacy Cases & Exemptions",
                "Module 7: OSHA 300 Log Management",
                "Module 8: TRIR & EMR Calculations",
                "Module 9: Internal Audit Procedures",
                "Module 10: Inspection Preparedness"
              ]}
            />
            <div
              className="p-8 rounded-2xl bg-primary text-primary-foreground flex flex-col justify-center items-center text-center cursor-pointer"
            >
              <GraduationCap className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Complete Training Bundle</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">All 5 courses + Corporate License</p>
              <div className="text-3xl font-bold mb-4">$899</div>
              <p className="text-xs text-primary-foreground/60 mb-4">Save over $300</p>
              <Button variant="secondary" size="sm" onClick={() => handleAddToCart("course-complete-bundle")} data-testid="button-add-cart-bundle">
                <ShoppingCart className="w-3 h-3 mr-1" />
                Add Bundle to Cart
              </Button>
            </div>
          </div>
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-3">Need help choosing the right training for your team?</p>
            <Link href="/contact">
              <Button variant="outline" data-testid="button-contact-training">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Human Expert Retainer Section */}
      <section className="py-24 bg-white border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                <Phone className="w-4 h-4" />
                Human Expert Support
              </div>
              <h2 className="text-3xl font-display font-bold text-primary">
                Need a Real Safety Director?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                AI is powerful, but some situations demand human expertise. Our Human Expert Retainer gives you direct access to seasoned occupational health professionals for:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Crisis Response:</strong> Immediate guidance during workplace incidents</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>OSHA 300 Log Audits:</strong> Professional review of your recordkeeping</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Audit Defense:</strong> Expert support during OSHA inspections</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground"><strong>Policy Review:</strong> Ensure your safety programs meet current standards</span>
                </li>
              </ul>
              <div className="pt-4">
                <Link href="/contact">
                  <Button variant="outline" data-testid="button-contact-retainer">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-muted/30 rounded-2xl border border-border/50 p-8 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">App + Human Retainer</h3>
              <p className="text-muted-foreground mb-6">For companies with 20-100 employees who need professional safety director level protection</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">$499</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-2 text-left mb-8">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>All Unlimited Safety features included</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>Dedicated human compliance expert</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>Priority phone & email support</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>Quarterly compliance reviews</span>
                </li>
              </ul>
              <Link href="/contact">
                <Button size="lg" className="w-full" data-testid="button-human-expert-access">
                  Get Human Expert Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BrandNSwag Section */}
      <section id="brandnswag" className="py-24 bg-gradient-to-br from-accent/5 via-background to-primary/5 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mx-auto">
              <Sparkles className="w-5 h-5" />
              NEW: BrandNSwag Division
            </div>
            <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer" className="inline-block cursor-pointer">
              <img src={brandNSwagLogo} alt="BrandNSwag" className="h-20 md:h-24 w-auto mx-auto hover:opacity-80 transition-opacity" data-testid="img-brandnswag-logo-landing" />
            </a>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">
              Make Safety <span className="text-accent">Fun & Rewarding</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Introducing Smart Swag—QR-enabled company merchandise that turns workplace milestones into rewards. Every hoodie, hat, and shirt becomes a recognition engine.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-primary text-lg mb-2">QR-Enabled Recognition</h3>
                  <p className="text-muted-foreground">Every piece of swag features a unique QR code linked to the employee and HR. Anyone can scan to award recognition points—managers, coworkers, or even customers.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-primary text-lg mb-2">Reward Every Milestone</h3>
                  <p className="text-muted-foreground">Onboarding complete? Safety class passed? Perfect attendance? Friend referral? Turn every achievement into points toward premium company merchandise.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-primary text-lg mb-2">Custom Swag Stores</h3>
                  <p className="text-muted-foreground">We set up branded swag stores for your company. New hires pick their welcome swag, top performers earn exclusive gear, and everyone feels part of the team.</p>
                </div>
              </div>
            </div>

            <Card className="p-8 shadow-lg" data-testid="card-smart-swag-ecosystem">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-2">The Smart Swag Ecosystem</h3>
                <p className="text-muted-foreground text-sm">From onboarding to ongoing recognition</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">1</div>
                  <div>
                    <div className="font-semibold text-primary">Onboarding Swag Box</div>
                    <div className="text-sm text-muted-foreground">New hires receive branded welcome packages</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">2</div>
                  <div>
                    <div className="font-semibold text-primary">Earn Recognition Points</div>
                    <div className="text-sm text-muted-foreground">QR scans from anyone = instant points</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">3</div>
                  <div>
                    <div className="font-semibold text-primary">Redeem at Your Store</div>
                    <div className="text-sm text-muted-foreground">Points convert to premium company gear</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center" data-testid="swag-feature-onboarding">
              <Shirt className="w-8 h-8 text-accent mx-auto mb-3" />
              <h4 className="font-bold text-primary mb-1">Onboarding Rewards</h4>
              <p className="text-sm text-muted-foreground">Welcome kits with branded essentials</p>
            </Card>
            <Card className="p-6 text-center" data-testid="swag-feature-safety">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-bold text-primary mb-1">Safety Achievements</h4>
              <p className="text-sm text-muted-foreground">Reward training completion</p>
            </Card>
            <Card className="p-6 text-center" data-testid="swag-feature-attendance">
              <Star className="w-8 h-8 text-accent mx-auto mb-3" />
              <h4 className="font-bold text-primary mb-1">Attendance Bonuses</h4>
              <p className="text-sm text-muted-foreground">Points for perfect attendance</p>
            </Card>
            <Card className="p-6 text-center" data-testid="swag-feature-referrals">
              <Users className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-bold text-primary mb-1">Referral Rewards</h4>
              <p className="text-sm text-muted-foreground">Earn when friends get hired</p>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-black text-accent text-xl md:text-2xl font-bold px-8 py-4 tracking-wide uppercase mb-6">
              CCH: The One Stop Employer Shop
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Compliance. Training. Recognition. Everything your workforce needs, all in one platform.
            </p>
            <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer">
              <Button size="lg" data-testid="button-brandnswag-get-started">
                Explore BrandNSwag
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">Trusted by Safety Professionals</h2>
            <p className="text-lg text-muted-foreground">
              See what compliance leaders say about Core Compliance Hub.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-1 text-accent mb-4">
                {[...Array(5)].map((_, i) => (
                  <Award key={i} className="w-4 h-4 fill-accent" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "CCH saved us from a $75,000 OSHA fine. We had been logging an injury incorrectly for months. The AI caught it immediately and showed us exactly how to fix it."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  MR
                </div>
                <div>
                  <div className="font-semibold text-primary">Michael Rodriguez</div>
                  <div className="text-sm text-muted-foreground">Safety Manager, Industrial Manufacturing</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-1 text-accent mb-4">
                {[...Array(5)].map((_, i) => (
                  <Award key={i} className="w-4 h-4 fill-accent" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "As an HR director managing DOT compliance for 50+ drivers, CCH has become indispensable. The drug testing guidance alone has saved us countless hours of confusion."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  ST
                </div>
                <div>
                  <div className="font-semibold text-primary">Sarah Thompson</div>
                  <div className="text-sm text-muted-foreground">HR Director, Regional Trucking Co.</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-1 text-accent mb-4">
                {[...Array(5)].map((_, i) => (
                  <Award key={i} className="w-4 h-4 fill-accent" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">
                "We achieved ISO 45001 certification 3 months faster than expected thanks to the ACSI ISO Manager. The gap analysis feature alone was worth the investment."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  JK
                </div>
                <div>
                  <div className="font-semibold text-primary">James Kim</div>
                  <div className="text-sm text-muted-foreground">Quality Manager, Precision Engineering</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold text-primary">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about CCH.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-muted/30 rounded-lg border border-border/50 px-6">
              <AccordionTrigger className="text-left font-semibold text-primary" data-testid="faq-trigger">
                Is the AI guidance legally binding?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                CCH provides educational guidance based on OSHA 29 CFR 1904, DOT 49 CFR Part 40, and ISO standards. While our AI cites specific regulations and provides expert-level interpretations, the final compliance decisions remain with your organization. For complex legal matters, we recommend our Human Expert Retainer service.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-muted/30 rounded-lg border border-border/50 px-6">
              <AccordionTrigger className="text-left font-semibold text-primary" data-testid="faq-trigger">
                How accurate is the OSHA recordability guidance?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our AI is trained on comprehensive OSHA recordkeeping requirements and has been tested against thousands of real-world scenarios. The "OSHA 300, Log it or Not" decision tree follows the exact criteria outlined in OSHA 1904 regulations, ensuring you get consistent, regulation-backed answers.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-muted/30 rounded-lg border border-border/50 px-6">
              <AccordionTrigger className="text-left font-semibold text-primary" data-testid="faq-trigger">
                Can I upgrade or downgrade my plan anytime?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing cycle. Training courses are one-time purchases and remain accessible indefinitely.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="bg-muted/30 rounded-lg border border-border/50 px-6">
              <AccordionTrigger className="text-left font-semibold text-primary" data-testid="faq-trigger">
                What's the difference between CCH and ACSI?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                CCH (Core Compliance Hub) focuses on occupational health compliance including OSHA recordkeeping, DOT physicals, and drug testing. ACSI (ISO Manager) specializes in ISO management system standards (9001, 14001, 45001). The Enterprise Bundle combines both for comprehensive compliance coverage.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="bg-muted/30 rounded-lg border border-border/50 px-6">
              <AccordionTrigger className="text-left font-semibold text-primary" data-testid="faq-trigger">
                Do training courses include certificates?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! All training courses include a certificate of completion upon finishing the curriculum. Certificates can be used to demonstrate continuing education in occupational health, safety, and compliance to employers and regulatory bodies.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="bg-muted/30 rounded-lg border border-border/50 px-6">
              <AccordionTrigger className="text-left font-semibold text-primary" data-testid="faq-trigger">
                How does the Human Expert Retainer work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                The Human Expert Retainer ($499/mo) provides direct access to experienced occupational health professionals. You get all Unlimited Safety features plus a dedicated expert for crisis response, OSHA 300 log audits, audit defense support, and quarterly compliance reviews. Ideal for companies with 20-100 employees.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="py-20 bg-accent text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Build Your Perfectly Safe Workplace?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies using Core Compliance Hub to protect their employees, reduce fines, and stay audit-ready. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
              <Button size="lg" variant="secondary" className="px-10 text-lg font-semibold" data-testid="button-cta-get-started">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-10 text-lg" data-testid="button-cta-contact-us">
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto brightness-0 invert" />
          </div>
          <p className="text-primary-foreground/60 text-sm">
            © 2024 Core Compliance Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, imageSrc, title, description }: any) {
  return (
    <div className="p-8 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
      {imageSrc ? (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6">
          <img src={imageSrc} alt={title} className="w-12 h-12 object-contain" data-testid={`img-feature-${title?.toLowerCase().replace(/\s+/g, '-')}`} />
        </div>
      ) : (
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function PricingCard({ tier, price, period, features, bestFor, buttonText, buttonHref, highlighted, external, productId, onAddToCart }: {
  tier: string;
  price: string;
  period: string;
  features: string[];
  bestFor: string;
  buttonText: string;
  buttonHref: string;
  highlighted?: boolean;
  external?: boolean;
  productId?: string;
  onAddToCart?: (productId: string) => void;
}) {
  const isFree = price === "Free";

  return (
    <div className={`p-8 rounded-2xl border ${highlighted ? 'border-accent bg-accent/5 ring-2 ring-accent' : 'border-border/50 bg-white'} flex flex-col`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-primary mb-2">{tier}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-primary">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
      </div>
      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground mb-6 italic">{bestFor}</p>
      <div className="space-y-2">
        {!isFree && productId && onAddToCart ? (
          <Button
            className="w-full"
            variant={highlighted ? 'default' : 'outline'}
            onClick={() => onAddToCart(productId)}
            data-testid={`button-add-cart-${tier.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        ) : (
          <a href={buttonHref} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <Button className="w-full" variant={highlighted ? 'default' : 'outline'} data-testid={`button-pricing-${tier.toLowerCase().replace(/\s+/g, '-')}`}>
              {buttonText}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function CourseCard({ icon: Icon, title, description, price, modules, chapters, highlighted, courseUrl, productId, onAddToCart }: {
  icon: any;
  title: string;
  description: string;
  price: string;
  modules: string;
  chapters: string[];
  highlighted?: boolean;
  courseUrl?: string;
  productId?: string;
  onAddToCart?: (productId: string) => void;
}) {
  return (
    <div className={`p-6 rounded-2xl border ${highlighted ? 'border-accent bg-accent/5 ring-2 ring-accent' : 'border-border/50 bg-white'} flex flex-col`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">{modules}</span>
      </div>
      <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{description}</p>
      
      <Dialog>
        <DialogTrigger asChild>
          <button 
            className="flex items-center gap-1 text-sm text-accent font-medium mb-4 hover:underline cursor-pointer"
            data-testid={`preview-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <ChevronDown className="w-4 h-4" />
            Preview Course Content
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Course Outline</h4>
            <ul className="space-y-2">
              {chapters.map((chapter, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>{chapter}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-2xl font-bold text-primary">{price}</span>
              <span className="text-sm text-muted-foreground ml-1">one-time</span>
            </div>
            {productId && onAddToCart ? (
              <Button size="sm" onClick={() => onAddToCart(productId)} data-testid={`button-add-cart-dialog-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                <ShoppingCart className="w-3 h-3 mr-1" />
                Add to Cart
              </Button>
            ) : (
              <a href={courseUrl || "#"} target="_blank" rel="noopener noreferrer">
                <Button size="sm" data-testid={`button-enroll-dialog-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                  Enroll Now
                </Button>
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between gap-2 flex-wrap pt-4 border-t border-border/50">
        <div>
          <span className="text-2xl font-bold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground ml-1">one-time</span>
        </div>
        {productId && onAddToCart ? (
          <Button size="sm" variant={highlighted ? "default" : "outline"} onClick={() => onAddToCart(productId)} data-testid={`button-add-cart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <ShoppingCart className="w-3 h-3 mr-1" />
            Add to Cart
          </Button>
        ) : (
          <a href={courseUrl || "#"} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant={highlighted ? "default" : "outline"} data-testid={`button-enroll-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              Enroll Now
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
