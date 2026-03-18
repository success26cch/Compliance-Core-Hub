import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCreateLead } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, Bot, FileText, ArrowRight, Activity, GraduationCap, Stethoscope, Syringe, Shield, ClipboardList, ChevronDown, ChevronUp, ChevronLeft, Users, Award, TrendingDown, MessageSquare, HelpCircle, Phone, Building2, Zap, Gift, QrCode, Shirt, Trophy, Star, Package, Sparkles, Menu, X, Send, Loader2, ShoppingCart, Mic, MicOff, Volume2, VolumeX, Copy, FileDown, Square, RotateCcw, AlertTriangle, Check, BarChart3, Ambulance, Bell, Globe, Play } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
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
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[☐☑☒□■◻◼◽◾▢▣✓✗✘⬜⬛🔲🔳✅❎]/g, '[ ]')
    .replace(/&\s+(?=[A-Z])/g, '[ ] ');
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logoUrl from "@assets/1_1767636977932.png";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import mentorshipLogo from "@assets/tree.transp_1768928785893.png";
import brandNSwagLogo from "@assets/2026_BNS_Logo_1768928815681.png";
import cchLogo from "@assets/1_1770683748423.png";
import teamImageUrl from "@assets/1-8_website_picture_1767901013934.png";
import coreyImg from "@assets/9_1771983400638.png";
import heroVideoUrl from "@assets/CCH_BOT_VIDEO_1771359482914.mp4";
import platformScreenshot from "@assets/image_1773264239505.png";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { PRODUCTS } from "@/lib/products";
import { CartTrigger } from "@/components/CartDrawer";

const leadFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

const RECORDABILITY_QUESTIONS = [
  {
    id: 1,
    question: "Did the incident happen at work or in a work environment?",
    noResult: "not-recordable" as const,
    noReason: "The incident did not occur at work or in a work environment. Work-relatedness is required for OSHA recordability.",
    nocitation: "29 CFR 1904.5(a)",
    yesNext: 2,
  },
  {
    id: 2,
    question: "Did it result in death, days away from work, restricted work, or job transfer?",
    yesResult: "recordable" as const,
    yesReason: "The injury or illness resulted in death, days away from work, restricted work, or job transfer — each of which independently satisfies OSHA's general recording criteria.",
    yescitation: "29 CFR 1904.7(a)(1) — 'You must consider an injury or illness to meet the general recording criteria if it results in death, days away from work, restricted work or transfer to another job, medical treatment beyond first aid, loss of consciousness, or a significant injury or illness diagnosed by a physician or other licensed health care professional.'",
    noNext: 3,
  },
  {
    id: 3,
    question: "Was prescription-strength medication given — or was an over-the-counter medication used at prescription strength (e.g., 800 mg ibuprofen)?",
    yesResult: "recordable" as const,
    yesReason: "Prescription-strength medication is medical treatment beyond first aid. OSHA's first aid list only permits 'use of nonprescription medications at nonprescription strength.' Administering or recommending a prescription medication — or directing an employee to take an OTC medication at a prescription-level dose (such as 800 mg ibuprofen) — exceeds first aid and makes the case recordable.",
    yescitation: "29 CFR 1904.7(a)(5)(ii) — First aid includes: 'Use of nonprescription medications at nonprescription strength.' Any medication given at prescription strength, whether originally prescription or OTC, does NOT qualify as first aid and constitutes recordable medical treatment.",
    noNext: 4,
  },
  {
    id: 4,
    question: "Did it require other medical treatment beyond first aid (e.g., stitches, physical therapy, drainage of blisters, prescription devices)?",
    yesResult: "recordable" as const,
    yesReason: "The injury or illness required medical treatment beyond first aid. Under 29 CFR 1904.7(a)(5), first aid is limited to a specific list of treatments — anything beyond that list (stitches, prescription medications, physical therapy, etc.) constitutes medical treatment and makes the case recordable.",
    yescitation: "29 CFR 1904.7(a)(1) — medical treatment beyond first aid; 29 CFR 1904.7(a)(5) — definition of first aid",
    noNext: 5,
  },
  {
    id: 5,
    question: "Did it result in loss of consciousness?",
    yesResult: "recordable" as const,
    yesReason: "The injury or illness resulted in loss of consciousness, even if the employee returned to work the same day and received no medical treatment.",
    yescitation: "29 CFR 1904.7(a)(1) — 'You must consider an injury or illness to be recordable if it results in... loss of consciousness.'",
    noNext: 6,
  },
  {
    id: 6,
    question: "Was there a significant injury or illness diagnosed by a physician or licensed healthcare professional?",
    yesResult: "recordable" as const,
    yesReason: "A physician or licensed health care professional (PLHCP) diagnosed a significant injury or illness. This criterion applies even if the case did not result in days away from work, restricted duty, medical treatment, or loss of consciousness.",
    yescitation: "29 CFR 1904.7(a)(1) — 'You must consider an injury or illness to be recordable if it results in... a significant injury or illness diagnosed by a physician or other licensed health care professional, even if it does not result in death, days away from work, restricted work or job transfer, medical treatment beyond first aid, or loss of consciousness.'",
    noResult: "likely-not-recordable" as const,
    noReason: "Based on your answers, this incident does not meet any of the OSHA general recording criteria under 29 CFR 1904.7(a)(1).",
    noReason2: "29 CFR 1904.7(a)(1) — none of the general recording criteria were met.",
  },
];

const MAX_FREE_USES = 3;

function RecordabilityDecisionTree() {
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<"recordable" | "not-recordable" | "likely-not-recordable" | null>(null);
  const [resultReason, setResultReason] = useState<string>("");
  const [resultCitation, setResultCitation] = useState<string>("");
  const [stepHistory, setStepHistory] = useState<number[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [loading, setLoading] = useState(true);
  const totalSteps = RECORDABILITY_QUESTIONS.length;

  useEffect(() => {
    fetch("/api/recordability/usage")
      .then(res => res.json())
      .then(data => {
        setUsageCount(data.count);
        setLimitReached(data.count >= data.limit);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAnswer = (answer: "yes" | "no") => {
    const q = RECORDABILITY_QUESTIONS[currentStep];
    if (answer === "yes") {
      if (q.yesResult) {
        setStepHistory(prev => [...prev, currentStep]);
        setResult(q.yesResult);
        setResultReason((q as any).yesReason || "");
        setResultCitation((q as any).yescitation || "");
        fetch("/api/recordability/usage", { method: "POST" })
          .then(res => res.json())
          .then(data => setUsageCount(data.count))
          .catch(() => {});
      } else if (q.yesNext) {
        setStepHistory(prev => [...prev, currentStep]);
        setCurrentStep(q.yesNext - 1);
      }
    } else {
      if (q.noResult) {
        setStepHistory(prev => [...prev, currentStep]);
        setResult(q.noResult);
        setResultReason((q as any).noReason || "");
        setResultCitation((q as any).nocitation || (q as any).noReason2 || "");
        fetch("/api/recordability/usage", { method: "POST" })
          .then(res => res.json())
          .then(data => setUsageCount(data.count))
          .catch(() => {});
      } else if (q.noNext) {
        setStepHistory(prev => [...prev, currentStep]);
        setCurrentStep(q.noNext - 1);
      }
    }
  };

  const handleBack = () => {
    if (stepHistory.length === 0) return;
    const prev = stepHistory[stepHistory.length - 1];
    setStepHistory(h => h.slice(0, -1));
    setResult(null);
    setResultReason("");
    setResultCitation("");
    setCurrentStep(prev);
  };

  const handleStartOver = () => {
    if (usageCount >= MAX_FREE_USES) {
      setLimitReached(true);
      return;
    }
    setCurrentStep(0);
    setResult(null);
    setResultReason("");
    setResultCitation("");
    setStepHistory([]);
  };

  const resultConfig = {
    recordable: {
      title: "Yes — OSHA Recordable",
      description: "Based on your answers: Yes. This incident meets OSHA 29 CFR 1904 recordability criteria and must be recorded on your OSHA 300 Log.",
      color: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/30",
      icon: AlertTriangle,
    },
    "not-recordable": {
      title: "No — Not Recordable",
      description: "Based on your answers: No. This incident is not work-related and does not meet OSHA 29 CFR 1904 recordability criteria.",
      color: "text-green-400",
      bgColor: "bg-green-500/10 border-green-500/30",
      icon: ShieldCheck,
    },
    "likely-not-recordable": {
      title: "No — Not Recordable",
      description: "Based on your answers: No. This incident does not meet OSHA 29 CFR 1904 recordability criteria.",
      color: "text-green-400",
      bgColor: "bg-green-500/10 border-green-500/30",
      icon: ShieldCheck,
    },
  };

  return (
    <section className="py-24 bg-[hsl(222,47%,11%)] border-t border-border/50" data-testid="section-recordability-tree">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm border border-accent/20">
            <ClipboardList className="w-4 h-4" />
            FREE TOOL
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-white" data-testid="text-recordability-title">
            Is This <span className="text-accent">Recordable?</span>
          </h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Use this quick 6-question tool based on OSHA 29 CFR 1904 to determine if your workplace incident needs to be recorded.
          </p>
        </div>

        <div className="bg-[hsl(222,47%,15%)] rounded-md border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 mx-auto border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : limitReached ? (
            <div className="p-8 text-center" data-testid="section-recordability-limit">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Limit Reached</h3>
                <p className="text-white/70 text-lg max-w-md mx-auto mb-2">
                  You've used all {MAX_FREE_USES} free assessments.
                </p>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  Corey AI provides unlimited recordability guidance, compliance checklists, and expert-level OSHA analysis — 24/7.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/get-started">
                  <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-6 text-lg" data-testid="button-recordability-upgrade">
                    Get Unlimited Access with Corey — $199/mo
                  </Button>
                </Link>
              </div>
            </div>
          ) : !result ? (
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6" data-testid="progress-recordability">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      i <= currentStep ? "bg-accent" : "bg-white/10"
                    }`}
                    data-testid={`progress-step-${i}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-accent font-semibold" data-testid="text-step-indicator">
                    Question {currentStep + 1} of {totalSteps}
                  </div>
                  {stepHistory.length > 0 && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                      data-testid="button-recordability-back"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Back
                    </button>
                  )}
                </div>
                <div className="text-xs text-white/40" data-testid="text-uses-remaining">
                  {MAX_FREE_USES - usageCount} free {MAX_FREE_USES - usageCount === 1 ? "use" : "uses"} remaining
                </div>
              </div>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-xl md:text-2xl font-bold text-white mb-8" data-testid="text-recordability-question">
                  {RECORDABILITY_QUESTIONS[currentStep].question}
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleAnswer("yes")}
                    className="flex-1 bg-accent text-white font-bold text-lg py-6"
                    data-testid="button-recordability-yes"
                  >
                    Yes
                  </Button>
                  <Button
                    onClick={() => handleAnswer("no")}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold text-lg py-6"
                    data-testid="button-recordability-no"
                  >
                    No
                  </Button>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <div className={`rounded-md border p-6 mb-4 ${resultConfig[result].bgColor}`} data-testid="card-recordability-result">
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const Icon = resultConfig[result].icon;
                    return <Icon className={`w-8 h-8 ${resultConfig[result].color}`} />;
                  })()}
                  <h3 className={`text-2xl font-black ${resultConfig[result].color}`} data-testid="text-recordability-result">
                    {resultConfig[result].title}
                  </h3>
                </div>
                <p className="text-white/80 text-base leading-relaxed" data-testid="text-recordability-description">
                  {resultConfig[result].description}
                </p>
              </div>

              {/* Reason why — always shown */}
              {resultReason && (
                <div className="rounded-md border border-white/10 bg-white/5 p-4 mb-4" data-testid="card-recordability-reason">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Why This Determination</p>
                  <p className="text-white/85 text-sm leading-relaxed mb-3">{resultReason}</p>
                  {resultCitation && (
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-xs font-bold text-accent/80 uppercase tracking-wider mb-1">📋 Regulatory Citation</p>
                      <p className="text-accent/70 text-xs font-mono leading-relaxed">{resultCitation}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/get-started" className="flex-1">
                  <Button className="w-full bg-accent text-white font-bold" data-testid="button-recordability-cta">
                    <Bot className="w-4 h-4 mr-2" />
                    Get Unlimited Guidance — $199/mo
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="bg-transparent border-white/20 text-white/70 hover:text-white font-semibold"
                  data-testid="button-recordability-back-result"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change Answer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStartOver}
                  className="bg-transparent border-white/20 text-white font-bold"
                  data-testid="button-recordability-restart"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

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
  const [videoMuted, setVideoMuted] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const container = videoContainerRef.current;
    const video = heroVideoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);


  const toggleVideoSound = () => {
    if (heroVideoRef.current) {
      heroVideoRef.current.muted = !heroVideoRef.current.muted;
      setVideoMuted(heroVideoRef.current.muted);
    }
  };

  interface BotMessage { role: "user" | "assistant"; content: string }
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [botInput, setBotInput] = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const [botLimitReached, setBotLimitReached] = useState(false);
  const [botRemaining, setBotRemaining] = useState(3);
  const [botTrialName, setBotTrialName] = useState(() => localStorage.getItem("cchub_trial_name") || "");
  const [botTrialEmail, setBotTrialEmail] = useState(() => localStorage.getItem("cchub_trial_email") || "");
  const [botTrialGated, setBotTrialGated] = useState(() => !localStorage.getItem("cchub_trial_email"));
  const botScrollRef = useRef<HTMLDivElement>(null);
  const botUserScrolledUp = useRef(false);
  const { isListening: botListening, speechSupported: botSpeechSupported, toggleListening: botToggleListening, stopListening: botStopListening } = useSpeechRecognition((text) => setBotInput(text));
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleBotScroll = () => {
    const el = botScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    botUserScrolledUp.current = distanceFromBottom > 80;
  };

  useEffect(() => {
    if (botScrollRef.current && !botUserScrolledUp.current) {
      botScrollRef.current.scrollTop = botScrollRef.current.scrollHeight;
    }
  }, [botMessages]);

  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
  }, []);

  const handleBotSpeak = useCallback((text: string, idx: number) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      speechRef.current = null;
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const naturalNames = ['Samantha','Karen','Daniel','Google UK English Female','Google US English','Microsoft Aria','Microsoft Jenny'];
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferred = enVoices.find(v => naturalNames.some(n => v.name.includes(n)))
      || enVoices.find(v => v.name.includes('Natural') || v.name.includes('Neural'))
      || enVoices.find(v => v.name.includes('Google'))
      || enVoices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => { setSpeakingIdx(null); speechRef.current = null; };
    utterance.onerror = () => { setSpeakingIdx(null); speechRef.current = null; };
    speechRef.current = utterance;
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }, [speakingIdx]);

  const handleBotDownloadPdf = useCallback(() => {
    const lastMsg = [...botMessages].reverse().find(m => m.role === "assistant");
    if (!lastMsg) return;
    const cleanText = stripMarkdown(lastMsg.content);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const margin = 20;
    const uw = pw - margin * 2;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const lh = 18; const lw = (img.width / img.height) * lh;
      doc.addImage(img, 'PNG', (pw - lw) / 2, 10, lw, lh);
      doc.setFontSize(9); doc.setTextColor(120, 120, 120);
      doc.text('Core Compliance Hub', pw / 2, 32, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pw / 2, 37, { align: 'center' });
      doc.setDrawColor(200, 160, 50); doc.setLineWidth(0.5);
      doc.line(margin, 40, pw - margin, 40);
      doc.setFontSize(11); doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(cleanText, uw);
      let y = 48; const ph = doc.internal.pageSize.getHeight();
      for (const line of lines) {
        if (y > ph - 25) { doc.addPage(); y = 20; }
        const t = line.trim();
        if (t === t.toUpperCase() && t.length > 3 && t.length < 80 && /[A-Z]/.test(t)) {
          doc.setFontSize(12); doc.setFont('helvetica', 'bold'); y += 3;
          doc.text(t, margin, y);
          doc.setFontSize(11); doc.setFont('helvetica', 'normal'); y += 7;
        } else { doc.text(line, margin, y); y += 6; }
      }
      const tp = doc.getNumberOfPages();
      for (let i = 1; i <= tp; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text('Generated by Corey — Core Compliance Hub', pw / 2, ph - 10, { align: 'center' });
        doc.text(`Page ${i} of ${tp}`, pw - margin, ph - 10, { align: 'right' });
      }
      doc.save(`corey-document-${new Date().toISOString().slice(0, 10)}.pdf`);
    };
    img.onerror = () => {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('COREY — AI Compliance Expert', pw / 2, 20, { align: 'center' });
      doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(cleanText, uw);
      let y = 35; const ph = doc.internal.pageSize.getHeight();
      for (const line of lines) { if (y > ph - 25) { doc.addPage(); y = 20; } doc.text(line, margin, y); y += 6; }
      doc.save(`corey-document-${new Date().toISOString().slice(0, 10)}.pdf`);
    };
    img.src = logoUrl;
  }, [botMessages]);

  const handleBotSubmit = useCallback(async () => {
    if (!botInput.trim() || botLoading || botLimitReached) return;
    botStopListening();
    botUserScrolledUp.current = false;
    const userMsg = botInput.trim();
    setBotInput("");
    const newMessages: BotMessage[] = [...botMessages, { role: "user", content: userMsg }];
    setBotMessages(newMessages);
    setBotLoading(true);

    try {
      const response = await fetch("/api/landing-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg, history: newMessages, name: botTrialName, email: botTrialEmail }),
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
  }, [botInput, botLoading, botLimitReached, botMessages, botTrialName, botTrialEmail]);

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
            <Link href="/about" className="px-3 py-2 text-sm font-bold bg-accent text-white rounded-md hover:bg-accent/80 transition-colors shrink-0 animate-pulse" data-testid="nav-about">About</Link>
            <Link href="/meet-corey" className="px-3 py-2 text-sm font-bold bg-blue-500 text-white rounded-md hover:bg-blue-400 transition-colors shrink-0 animate-pulse shadow-lg shadow-blue-500/50" data-testid="nav-meet-corey">Meet Corey</Link>
            <Link href="/meet-isa" className="px-3 py-2 text-sm font-bold text-accent hover:text-white hover:bg-accent/20 rounded-md transition-colors shrink-0" data-testid="nav-meet-isa">Meet Isa</Link>
            <Link href="/meet-iso-manager" className="px-3 py-2 text-sm font-bold text-accent hover:text-white hover:bg-accent/20 rounded-md transition-colors shrink-0" data-testid="nav-iso-manager">ISO Manager</Link>
            <Link href="/watch-demo" className="px-3 py-2 text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0 flex items-center gap-1" data-testid="nav-watch-demo"><Play className="w-3 h-3" />Watch Demo</Link>
            <a href="#features" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-features">Features</a>
            <a href="#pricing" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-pricing">Pricing</a>
            <Link href="/resources" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-resources">Free Resources</Link>
            <a href="#courses" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-training">Training</a>
            <Link href="/mentorship" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-mentorship">Mentorship</Link>
            <a href="https://www.brandnswag.com/" target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-brandnswag">BrandNSwag</a>
            <Link href="/bma" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0" data-testid="nav-bilingual">Bilingual Med Assist</Link>
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
              <div ref={videoContainerRef} className="relative w-full max-w-5xl mx-auto">
                <video
                  ref={heroVideoRef}
                  src={heroVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto rounded-lg shadow-xl"
                  data-testid="video-hero"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={toggleVideoSound}
                  className="absolute bottom-4 right-4 rounded-full opacity-80 hover:opacity-100"
                  data-testid="button-video-sound-toggle"
                >
                  {videoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 md:gap-10 py-4">
              <div className="flex flex-col items-center gap-2 group" data-testid="logo-cch">
                <img src={cchLogo} alt="CCHUB" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                <span className="text-xs md:text-sm font-semibold text-primary">CCHUB</span>
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

            {/* Two-Expert Intro Cards */}
            <div className="max-w-3xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <div className="bg-black border border-accent/40 rounded-xl py-4 px-5 flex items-start gap-4" data-testid="card-expert-corey">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-lg text-accent">Corey</span>
                    <span className="text-xs text-white/40 font-medium">OSHA · DOT · Safety · Compliance</span>
                  </div>
                  <p className="text-sm text-white/70 leading-snug">The world's first AI built directly from 29 CFR — not trained on opinions, not citing blogs. Corey <em>is</em> the regulation. 24/7. Every standard. Non-negotiable.</p>
                </div>
              </div>
              <div className="bg-black border border-indigo-500/40 rounded-xl py-4 px-5 flex items-start gap-4" data-testid="card-expert-isa">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-lg text-indigo-400">Isa</span>
                    <span className="text-xs text-white/40 font-medium">ISO 9001 · 14001 · 45001 · 13485 · 27001 · AS9100 · IATF 16949</span>
                  </div>
                  <p className="text-sm text-white/70 leading-snug">Your Lead ISO Auditor AI — gap analysis, audit readiness, and management systems guidance.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 text-accent font-semibold text-sm border border-accent/30">
                <Activity className="w-4 h-4 animate-pulse" />
                SAFETY. QUALITY. COMPLIANCE. ONE PLATFORM.
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-primary leading-[1.1] text-center">
              Welcome to the future of compliance, welcome, to<br /><span className="text-accent">Core Compliance Hub.</span>
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl font-display font-black text-primary leading-[1.1] text-center">
              Compliance Isn't a Guessing Game,<br /><span className="text-accent">It's Your Reputation.</span>
            </p>
            <div className="max-w-4xl mx-auto text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-accent/10 to-accent/30 blur-xl -z-10 scale-110"></div>
                <div className="bg-black px-8 py-5 rounded-md border border-accent/40 shadow-[0_0_30px_rgba(var(--accent),0.15)]">
                  <p className="text-xl md:text-2xl font-black text-accent leading-snug">
                    Meet Corey: The world's first AI born from the DNA of 29 CFR.
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-primary leading-relaxed mt-3">
                As the only specialist that lives and breathes occupational health and safety compliance, Corey isn't just an AI—it's your 24/7 Compliance Guardian, built from the ground up to automate, track, and protect your entire safety ecosystem.
              </p>
              <p className="text-xl font-black text-accent mt-4">
                Give Corey a shot, ask him anything.
              </p>
            </div>

            {/* Meet Corey + Ask Corey Chat - directly under the CTA */}
            <div className="max-w-4xl mx-auto w-full" id="meet-corey" data-testid="section-meet-corey">
              <div className="text-center space-y-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm border border-accent/20">
                  <Sparkles className="w-4 h-4" />
                  INTRODUCING
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black text-primary" data-testid="text-meet-corey-title">
                  Meet <span className="text-accent">COREY</span>
                </h2>
                <p className="text-lg font-bold text-primary/80">
                  The Only AI Built for Occ-Health.
                </p>
              </div>

              <div id="ask-corey" data-testid="section-ask-corey">
                <div className="relative bg-[hsl(222,47%,11%)] rounded-xl overflow-hidden">
                  <div className="absolute inset-0 opacity-5">
                    <div className="animate-marquee whitespace-nowrap flex items-center h-full">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <span key={i} className="text-6xl font-black mx-8 text-white">COREY</span>
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 p-6">
                    <div className="text-center space-y-2 mb-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-display font-black text-white" data-testid="text-corey-title">
                          Ask Corey
                        </h3>
                      </div>
                      <p className="text-white/70 text-sm">
                        Your AI Occ-Health Expert &middot; {botRemaining} sample question{botRemaining !== 1 ? "s" : ""} remaining
                      </p>
                    </div>

                    <Card className="overflow-hidden border-0 shadow-2xl" data-testid="card-ask-corey">
                      {botTrialGated ? (
                        <div className="h-80 flex flex-col items-center justify-center p-6 space-y-4 bg-muted/30">
                          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                            <Bot className="w-8 h-8 text-accent" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-foreground">Ask Corey a Question</p>
                            <p className="text-sm mt-1 text-muted-foreground">Enter your info to ask up to 3 compliance questions</p>
                          </div>
                          <div className="w-full max-w-xs space-y-2">
                            <Input
                              value={botTrialName}
                              onChange={(e) => setBotTrialName(e.target.value)}
                              placeholder="Your name"
                              data-testid="input-landing-trial-name"
                            />
                            <Input
                              type="email"
                              value={botTrialEmail}
                              onChange={(e) => setBotTrialEmail(e.target.value)}
                              placeholder="Work email"
                              onKeyDown={(e) => { if (e.key === "Enter" && botTrialName.trim() && botTrialEmail.includes("@")) { localStorage.setItem("cchub_trial_name", botTrialName.trim()); localStorage.setItem("cchub_trial_email", botTrialEmail.trim()); setBotTrialGated(false); } }}
                              data-testid="input-landing-trial-email"
                            />
                            <Button
                              className="w-full"
                              onClick={() => {
                                localStorage.setItem("cchub_trial_name", botTrialName.trim());
                                localStorage.setItem("cchub_trial_email", botTrialEmail.trim());
                                setBotTrialGated(false);
                              }}
                              disabled={!botTrialName.trim() || !botTrialEmail.includes("@")}
                              data-testid="button-landing-trial-start"
                            >
                              Start Free Trial
                            </Button>
                          </div>
                        </div>
                      ) : (
                      <>
                      <div
                        ref={botScrollRef}
                        onScroll={handleBotScroll}
                        className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30"
                        data-testid="bot-messages"
                      >
                        {botMessages.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground">
                            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                              <Bot className="w-8 h-8 text-accent" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Ask Corey a Compliance Question</p>
                              <p className="text-sm mt-1">OSHA recordability, DOT physicals, drug testing, ISO audits — Corey knows it all.</p>
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
                            <div className="flex flex-col max-w-[80%]">
                              <div className={`rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card border border-border text-card-foreground"
                              }`}>
                                {msg.content ? stripMarkdown(msg.content) : (botLoading && i === botMessages.length - 1 ? (
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                                  </span>
                                ) : null)}
                              </div>
                              {msg.role === "assistant" && msg.content && !botLoading && (
                                <div className="mt-1 ml-1 flex items-center gap-3">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(stripMarkdown(msg.content))}
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                                    data-testid={`button-bot-copy-${i}`}
                                  >
                                    <Copy className="w-3 h-3" /> Copy
                                  </button>
                                  <button
                                    onClick={() => handleBotSpeak(msg.content, i)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${speakingIdx === i ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                                    data-testid={`button-bot-speak-${i}`}
                                  >
                                    {speakingIdx === i ? <><Square className="w-3 h-3 fill-current" /> Stop</> : <><Volume2 className="w-3 h-3" /> Listen</>}
                                  </button>
                                  <button
                                    onClick={handleBotDownloadPdf}
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                                    data-testid={`button-bot-pdf-${i}`}
                                  >
                                    <FileDown className="w-3 h-3" /> PDF
                                  </button>
                                </div>
                              )}
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
                              You've used your sample questions. Subscribe to Corey for unlimited access.
                            </p>
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                              <Link href="/get-started">
                                <Button data-testid="button-bot-signup">
                                  Subscribe — $199/mo <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                              <a href="#pricing">
                                <Button variant="outline" data-testid="button-bot-pricing">View Plans</Button>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex gap-2 items-end">
                              <div className="relative flex-1">
                                <Textarea
                                  value={botInput}
                                  onChange={(e) => setBotInput(e.target.value)}
                                  placeholder={botListening ? "Listening..." : "Ask Corey a compliance question..."}
                                  disabled={botLoading}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleBotSubmit();
                                    }
                                  }}
                                  className={`pr-9 resize-none max-h-[130px] overflow-y-auto ${botListening ? "ring-2 ring-accent/30 border-accent" : ""}`}
                                  rows={2}
                                  data-testid="input-bot-question"
                                />
                                {botSpeechSupported && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={botToggleListening}
                                    disabled={botLoading}
                                    className={`absolute right-0.5 bottom-1 ${botListening ? "text-accent" : "text-muted-foreground"}`}
                                    data-testid="button-bot-mic"
                                  >
                                    {botListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                  </Button>
                                )}
                              </div>
                              <Button
                                onClick={handleBotSubmit}
                                disabled={!botInput.trim() || botLoading}
                                className="mb-0.5"
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
                      </>
                      )}
                    </Card>

                    <div className="flex justify-center gap-3 mt-4">
                      <Link href="/meet-corey">
                        <Button size="lg" className="shadow-lg shadow-primary/25" data-testid="button-try-corey-standalone">
                          <Bot className="w-5 h-5 mr-2" /> Try Corey — Standalone App
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ul className="space-y-4 text-muted-foreground max-w-4xl mx-auto mt-10">
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

            <div className="max-w-lg mx-auto mt-10">
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
                      Join other safety professionals trusting Core Compliance Hub - CCHUB.
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
              <Link href="/get-started">
                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/25" data-testid="button-hero-get-started">
                  Get Started
                </Button>
              </Link>
              <Link href="/watch-demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2" data-testid="button-hero-watch-demo">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meet Isa — ACSI ISO Manager Spotlight */}
      <section data-testid="section-meet-isa" className="relative overflow-hidden border-t-4 border-accent py-16">
        {/* Warm amber gradient background — distinctly different from the navy BMA section */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,16%)] via-[hsl(20,50%,10%)] to-[hsl(222,47%,10%)]" />
        {/* Accent glow at top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-40 bg-accent/10 blur-3xl rounded-full pointer-events-none" />
        {/* Bottom separator line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-bold uppercase tracking-widest mb-5">
              <Sparkles className="w-3 h-3" />
              ACSI ISO Management Platform
            </div>
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg shadow-black/20">
                <img src={acsiLogo} alt="ACSI" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Meet <span className="text-accent">Isa</span> &amp; the ACSI ISO Manager
            </h2>
            <p className="text-sm text-white/40 font-medium mb-4 tracking-wide">
              ISO 9001 · ISO 14001 · ISO 45001 · ISO 13485 · ISO 27001 · AS9100 · IATF 16949
            </p>
            <p className="text-base text-white/60 max-w-2xl mx-auto leading-relaxed mb-7">
              Isa is ACSI's Lead ISO Auditor AI — built for gap analysis, audit readiness, and management system guidance. The ISO Manager gives you the full platform: Isa AI, document generation, a secure vault, and KPI tracking.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/meet-isa">
                <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-6" data-testid="button-talk-to-isa">
                  Meet Isa <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/iso-manager">
                <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 hover:text-accent font-bold px-6" data-testid="button-iso-manager-plans">
                  ISO Manager Plans <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* 3-column feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <Sparkles className="w-5 h-5 text-accent mb-3" />
              <p className="font-bold text-white text-sm mb-1.5">Isa AI Guidance</p>
              <p className="text-xs text-white/40 leading-relaxed">Clause-by-clause gap analysis, internal audit checklists, and corrective action guidance across 7 major standards.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <FileText className="w-5 h-5 text-accent mb-3" />
              <p className="font-bold text-white text-sm mb-1.5">Document Generation</p>
              <p className="text-xs text-white/40 leading-relaxed">AI-powered quality manuals, procedures, and an audit-ready document library built to your management system.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <Shield className="w-5 h-5 text-accent mb-3" />
              <p className="font-bold text-white text-sm mb-1.5">Secure Vault &amp; Tracking</p>
              <p className="text-xs text-white/40 leading-relaxed">Version-controlled document storage with audit trail, KPI tracking, and evidence management for certification readiness.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Spanish Bilingual Medical Assistant — Teaser Card */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,15%)] to-[hsl(222,47%,8%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, hsla(24,95%,53%,0.08), transparent 70%)" }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-accent/20 text-accent border border-accent/30 text-sm px-3 py-1" data-testid="badge-bma-teaser">
                <Stethoscope className="w-4 h-4 mr-2" />
                For Occupational Health Clinics
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white leading-tight" data-testid="text-bma-teaser-title">
                Your Employees/Patients Speak Spanish.<br />
                <span style={{ color: "#38bdf8" }}>Now Your Clinic Does Too.</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed">
                The CCHUB Spanish Bilingual Medical Assistant gives your MAs instant Spanish translation, one-tap clinical commands, and printable bilingual documentation — no interpreter needed.
              </p>
              <ul className="space-y-3">
                {[
                  "Real-time bidirectional Spanish translation",
                  "One-tap clinical commands spoken in Spanish",
                  "Interactive body map for injury reporting",
                  "Printable bilingual visit summaries"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/bma">
                  <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2" data-testid="button-bma-teaser-demo">
                    See It in Action <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="w-full max-w-sm bg-white/5 rounded-2xl border border-white/10 p-8 text-center space-y-5 backdrop-blur-sm">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Mic className="w-8 h-8 text-accent" />
                </div>
                <p className="text-white font-bold text-lg">Bidirectional Translation</p>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 text-left">
                    <p className="text-xs text-white/40 mb-1">Provider speaks English:</p>
                    <p className="text-white text-sm font-medium">"Take a deep breath and hold it."</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-accent rotate-90" />
                  </div>
                  <div className="bg-accent/10 rounded-lg p-3 text-left border border-accent/20">
                    <p className="text-xs text-accent/60 mb-1">Patient hears Spanish:</p>
                    <p className="text-accent text-sm font-medium">"Respire profundo y manténgalo."</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
                  <Volume2 className="w-3 h-3" />
                  <span>Audio plays automatically</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline bridge */}
      <div className="py-10 bg-white border-t border-border/50 text-center">
        <p className="text-2xl font-display font-bold text-primary" data-testid="text-tagline-bridge">
          From question to compliant answer in seconds.
        </p>
      </div>

      {/* Employer Platform Preview */}
      <section className="py-24 bg-slate-50 border-t border-border/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge className="bg-accent/10 text-accent border border-accent/20 text-sm px-3 py-1">
              Employer Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-black text-primary leading-tight">
              One Platform. Every Compliance Need Covered.
            </h2>
            <p className="text-lg text-muted-foreground">
              Your entire occupational health operation — incidents, CAPAs, employee surveillance, OSHA recordkeeping, and AI guidance — unified in a single dashboard built for employers.
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="max-w-5xl mx-auto">
            {/* Browser chrome */}
            <div className="rounded-2xl shadow-2xl overflow-hidden border border-slate-200" style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.18)" }}>
              {/* Browser bar */}
              <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-slate-600 rounded-md px-3 py-1 text-xs text-slate-300 font-mono">
                  app.corecompliancehub.com/dashboard
                </div>
              </div>

              {/* Dashboard body */}
              <div className="bg-[#f8fafc] flex" style={{ minHeight: 480 }}>

                {/* Sidebar */}
                <div className="w-44 bg-[#1e293b] flex-shrink-0 py-4 px-3 flex flex-col gap-1">
                  <div className="text-white/40 text-xs font-bold uppercase tracking-widest px-2 mb-2">CCHUB</div>
                  {[
                    { icon: Activity, label: "Dashboard", active: true },
                    { icon: AlertTriangle, label: "Incidents" },
                    { icon: ClipboardList, label: "CAPA" },
                    { icon: Users, label: "Employees" },
                    { icon: FileText, label: "OSHA 300 Log" },
                    { icon: ShieldCheck, label: "Drug Screens" },
                    { icon: Bot, label: "Ask Corey" },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium ${active ? "bg-accent text-white" : "text-white/50 hover:text-white/70"}`}>
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 p-5 overflow-hidden">

                  {/* Top stats row */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Compliance Score", value: "94%", sub: "+2% this month", color: "text-green-600", bg: "bg-green-50 border-green-100" },
                      { label: "Open Incidents", value: "3", sub: "2 under review", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
                      { label: "CAPAs Due", value: "2", sub: "1 overdue", color: "text-red-600", bg: "bg-red-50 border-red-100" },
                      { label: "Employees Tracked", value: "47", sub: "4 due for surveillance", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                    ].map(({ label, value, sub, color, bg }) => (
                      <div key={label} className={`rounded-lg border p-3 ${bg}`} data-testid={`card-platform-stat-${label.toLowerCase().replace(/ /g, '-')}`}>
                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Two-column body */}
                  <div className="grid grid-cols-5 gap-3">

                    {/* Recent incidents */}
                    <div className="col-span-3 bg-white rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Recent Incidents
                      </p>
                      <div className="space-y-1.5">
                        {[
                          { date: "Mar 10", desc: "Laceration — right hand", dept: "Warehouse", status: "Recordable", sc: "bg-red-100 text-red-700" },
                          { date: "Mar 08", desc: "Forklift near-miss", dept: "Shipping", status: "Under Review", sc: "bg-yellow-100 text-yellow-700" },
                          { date: "Mar 05", desc: "Chemical splash — eye", dept: "Production", status: "First Aid", sc: "bg-green-100 text-green-700" },
                          { date: "Mar 01", desc: "Strain — lower back", dept: "Assembly", status: "Recordable", sc: "bg-red-100 text-red-700" },
                        ].map(({ date, desc, dept, status, sc }) => (
                          <div key={desc} className="flex items-center gap-2 text-xs py-1 border-b border-slate-50 last:border-0">
                            <span className="text-slate-400 w-12 flex-shrink-0">{date}</span>
                            <span className="text-slate-700 flex-1 truncate">{desc}</span>
                            <span className="text-slate-400 text-xs w-16 text-right flex-shrink-0 hidden sm:block">{dept}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${sc}`}>{status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="col-span-2 flex flex-col gap-3">

                      {/* OSHA 300 widget */}
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500" /> OSHA 300 Log — 2025
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Total Cases", val: "7" },
                            { label: "Days Away", val: "12" },
                            { label: "Restricted", val: "3" },
                            { label: "Fatalities", val: "0" },
                          ].map(({ label, val }) => (
                            <div key={label} className="bg-slate-50 rounded p-1.5 text-center">
                              <p className="text-sm font-black text-slate-800">{val}</p>
                              <p className="text-xs text-slate-400">{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CAPA tracker */}
                      <div className="bg-white rounded-lg border border-slate-200 p-3 flex-1">
                        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5 text-purple-500" /> Active CAPAs
                        </p>
                        <div className="space-y-1.5">
                          {[
                            { title: "Forklift SOP update", due: "Mar 15", status: "bg-red-100 text-red-700", label: "Overdue" },
                            { title: "PPE audit — Dept B", due: "Mar 22", status: "bg-yellow-100 text-yellow-700", label: "In Progress" },
                            { title: "Spill kit restock", due: "Mar 30", status: "bg-blue-100 text-blue-700", label: "Open" },
                          ].map(({ title, due, status, label }) => (
                            <div key={title} className="flex items-center justify-between gap-1 text-xs">
                              <span className="text-slate-600 truncate flex-1">{title}</span>
                              <span className={`px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${status}`}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Real platform screenshot */}
          <div className="max-w-5xl mx-auto mt-6">
            <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.18)" }}>
              <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-slate-600 rounded-md px-3 py-1 text-xs text-slate-300 font-mono">
                  app.corecompliancehub.com/dashboard
                </div>
              </div>
              <img
                src={platformScreenshot}
                alt="CCHUB Employer Platform — Training Portal, Ask Corey, OSHA Decision Tree, Clinic Communication Letter, and Digital Medical Passport"
                className="w-full block"
                data-testid="img-platform-screenshot"
              />
            </div>
          </div>

          {/* Capability tags */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              "Incident Management",
              "OSHA 300 Reporting",
              "CAPA Tracking + SMS Alerts",
              "Employee Medical Surveillance",
              "Drug Screen Tracking",
              "Multi-Site Analytics",
              "Digital Medical Passport",
              "AI-Powered Guidance (Corey)",
            ].map((cap) => (
              <span key={cap} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                {cap}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link href="/get-started">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 gap-2" data-testid="button-platform-preview-cta">
                Explore the Platform <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* Is This Recordable? Decision Tree */}
      <RecordabilityDecisionTree />

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
              imageSrc={coreyImg}
              title="Meet Corey — Your AI Compliance Expert"
              description="Corey is the only AI built for Occ-Health. Get instant, expert answers on OSHA recordability, DOT physicals, drug testing, and more — citing specific OSHA 1904 and DOT FMCSA codes. Includes our interactive OSHA 300 'Log it or Not' decision tool so you never second-guess a recordability call again."
            />
            <FeatureCard 
              imageSrc={acsiLogo}
              title="ACSI ISO Manager"
              description="Powered by ACSI Services Intl. — your expert partner for ISO 9001, 14001, 45001, IATF 16949 and more. From gap analysis to audit-ready preparation, ACSI brings 25+ years of real-world consulting, training, and auditing experience to help you get certified, stay certified, and keep your logs and decisions documented for any surprise inspection."
              href="/iso-manager"
              testId="link-feature-iso-manager"
            />
          </div>

          {/* ACSI Self-Assessment Questions Box */}
          <div className="mt-8 max-w-4xl mx-auto" data-testid="acsi-assessment-box">
            <div className="rounded-2xl border-2 border-[#F57C00] bg-gradient-to-br from-[#F57C00]/10 via-[#FF9800]/5 to-[#FFC107]/10 p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <img src={acsiLogo} alt="ACSI" className="w-20 h-20 object-contain" data-testid="img-acsi-assessment-logo" />
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
                  With 25+ years of hands-on experience in ISO 9001, ISO 14001, ISO 45001, and IATF 16949, ACSI Services International helps companies close compliance gaps, build audit-ready systems, and develop internal teams that own the process — not just survive it. <span className="font-semibold text-foreground">This is what CCHUB is all about: bridging the gap between where you are and where you need to be.</span>
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

      {/* Training Courses Section */}
      <section id="courses" className="py-24 bg-white dark:bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-6 space-y-4">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-24 w-auto mx-auto mb-2" data-testid="img-training-logo" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm mx-auto">
              <GraduationCap className="w-5 h-5" />
              Professional Training
            </div>
            <h2 className="text-3xl font-display font-bold text-primary">CCHUB Compliance Training Courses</h2>
            <p className="text-lg text-muted-foreground">
              Part of CCHUB's ongoing commitment to helping companies understand, comply, and stay compliant with federal and state regulations. Self-paced courses with certificates of completion.
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
                <h3 className="text-lg font-bold text-primary">Purchase Any Course — Get a Free Compliance Program Consultation</h3>
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
              description="The complete employer guide to DOT physical requirements, disqualifying conditions, medical holds, clearance processes, audit findings, return-to-duty protocols, and driver preparation for CDL compliance."
              price="$199"
              modules="8 Modules"
              productId="course-dot-medical"
              onAddToCart={handleAddToCart}
              chapters={[
                "Module 1: The Federal Mandate & DOT Physical Requirements",
                "Module 2: Health Conditions & Disqualifying Standards",
                "Module 3: Medical Hold & The Clearance Process",
                "Module 4: Documentation, Forms & State Requirements",
                "Module 5: Common DOT Audit Findings & Employer Liability",
                "Module 6: Return-to-Duty, SAP Process & Special Situations",
                "Module 7: Driver Preparation Masterclass & Case Studies",
                "Module 8: Official References & Comprehensive Final Exam"
              ]}
            />
            <CourseCard 
              icon={Shield}
              title="OSHA Medical Surveillance"
              description="Master respirator physicals, fit testing (QLFT vs QNFT), pulmonary function testing, asbestos & lead surveillance under 29 CFR 1910.1001, HAZWOPER medical requirements, and employer compliance programs."
              price="$249"
              modules="8 Modules"
              productId="course-osha-surveillance"
              onAddToCart={handleAddToCart}
              chapters={[
                "Module 1: OSHA Respiratory Protection Standard — The Foundation",
                "Module 2: Respirator Fit Testing — QLFT vs QNFT",
                "Module 3: Pulmonary Function Testing (PFT/Spirometry)",
                "Module 4: Asbestos Medical Surveillance (29 CFR 1910.1001)",
                "Module 5: HAZWOPER Medical Surveillance (29 CFR 1910.120)",
                "Module 6: Employer Compliance Programs & OSHA Enforcement",
                "Module 7: Advanced Topics, Special Populations & Case Studies",
                "Module 8: Official References & Comprehensive Final Exam"
              ]}
            />
            <CourseCard 
              icon={Syringe}
              title="Drug & Alcohol Testing"
              description="DOT vs Non-DOT testing protocols, random testing programs, breath alcohol testing, FMCSA Clearinghouse compliance, MRO processes, return-to-duty SAP requirements, and building a legally defensible program."
              price="$199"
              modules="8 Modules"
              productId="course-drug-alcohol"
              onAddToCart={handleAddToCart}
              chapters={[
                "Module 1: Foundations of a Drug-Free Workplace Program",
                "Module 2: DOT vs Non-DOT Testing — The Critical Distinctions",
                "Module 3: The DOT Random Testing Program",
                "Module 4: Breath Alcohol Testing (BAT) & Post-Accident Protocols",
                "Module 5: The FMCSA Drug & Alcohol Clearinghouse",
                "Module 6: Return-to-Duty (RTD) & The SAP Process",
                "Module 7: Building a Legally Defensible Program & Case Studies",
                "Module 8: Quick Reference Guide & Comprehensive Final Exam"
              ]}
            />
            <CourseCard 
              icon={ClipboardList}
              title="OSHA Recordkeeping Master"
              description="The definitive strategic intelligence program for mastering OSHA 300 recordkeeping and EMR optimization. Master the First Aid vs Medical Treatment distinction, conduct internal log audits, and transform your safety program into a competitive advantage."
              price="$299"
              modules="10 Modules"
              highlighted
              productId="course-osha-recordkeeping"
              onAddToCart={handleAddToCart}
              chapters={[
                "Module 1: OSHA 300 Recordkeeping — Your Hidden Cost Center",
                "Module 2: What's Recordable and What's Not — The Definitive Decision Guide",
                "Module 3: Mastering the OSHA 300 Log — Column by Column",
                "Module 4: The OSHA 301 & 300A Forms — The Compliance-to-Cash Connection",
                "Module 5: Working with Clinics the Right Way",
                "Module 6: Avoiding the Top 10 Employer Mistakes",
                "Module 7: Real Case Scenarios — Interactive Learning",
                "Module 8: Conducting an OSHA Log Audit",
                "Module 9: Advanced Incident Investigation & Root Cause Analysis",
                "Module 10: Executive Capstone — Implementing the CCHUB System"
              ]}
            />
            <div
              className="p-8 rounded-2xl bg-primary text-primary-foreground flex flex-col justify-center items-center text-center"
            >
              <GraduationCap className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Complete Training Bundle</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">All 4 courses + Corporate License</p>
              <p className="text-lg font-semibold text-primary-foreground mb-4">Bundle pricing available</p>
              <Link href="/get-started">
                <Button variant="secondary" size="sm" data-testid="button-view-bundle-pricing">
                  View Bundle Pricing
                </Button>
              </Link>
            </div>
          </div>
          <Card className="max-w-4xl mx-auto p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30 mt-12 mb-4" data-testid="card-employer-portal-promo">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-primary">Employer Training Portal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Need to train your team? Assign courses to employees, send them a simple access link, and track their progress and certificates — all from one dashboard. No employee accounts required.
                </p>
              </div>
              <Link href={isAuthenticated ? "/employer-training" : "/api/login"}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0" data-testid="button-employer-portal-cta">
                  <GraduationCap className="w-4 h-4" />
                  Open Employer Portal
                </Button>
              </Link>
            </div>
          </Card>

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

      {/* Compare Plans */}
      <section className="py-24 bg-slate-50 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-primary" data-testid="text-landing-compare-plans">Compare Plans</h2>
              <p className="text-sm text-muted-foreground">See all features side by side to find the right fit</p>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[640px] border-collapse" data-testid="table-landing-compare-plans">
              <thead>
                <tr>
                  <th className="text-left p-4 bg-muted/50 rounded-tl-md font-semibold text-foreground">Feature</th>
                  <th className="text-center p-4 bg-accent/10 border-x-2 border-accent font-semibold text-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <Badge className="bg-accent text-white">Most Popular</Badge>
                      <span>Unlimited Corey</span>
                      <span className="text-lg font-bold text-primary">$199<span className="text-xs font-normal text-muted-foreground">/mo per user</span></span>
                    </div>
                  </th>
                  <th className="text-center p-4 bg-muted/50 rounded-tr-md font-semibold text-foreground">
                    <div className="flex flex-col items-center gap-1">
                      <span>Employer Platform</span>
                      <span className="text-lg font-bold text-primary">$599<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Corey AI Questions", corey: "Unlimited", employer: "Unlimited" },
                  { feature: "OSHA Recordability Guidance", corey: true, employer: true },
                  { feature: "DOT Compliance Help", corey: true, employer: true },
                  { feature: "Compliance Checklists", corey: true, employer: true },
                  { feature: "Audit Prep & Templates", corey: true, employer: true },
                  { feature: "Workers' Comp Guidance", corey: true, employer: true },
                  { feature: "Custom Reports", corey: true, employer: true },
                  { feature: "Priority Support", corey: true, employer: true },
                  { feature: "Employee Management", corey: false, employer: true },
                  { feature: "Incident Logging & OSHA 300 Log", corey: false, employer: true },
                  { feature: "CAPA Tracking + SMS Alerts", corey: false, employer: true },
                  { feature: "Medical Passport (CCHUB Handshake)", corey: false, employer: true },
                  { feature: "Drug Screen Tracking", corey: false, employer: true },
                  { feature: "Employee Medical Surveillance", corey: false, employer: true },
                  { feature: "Multi-Site Analytics", corey: false, employer: true },
                  { feature: "DOT Random Pool Notifications", corey: false, employer: true },
                  { feature: "Bilingual Medical Assistant", corey: false, employer: true },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-muted/20" : ""} data-testid={`row-landing-feature-${idx}`}>
                    <td className="p-4 text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="p-4 text-center border-x-2 border-accent/30">
                      {typeof row.corey === "string" ? (
                        <span className="text-sm font-medium text-accent">{row.corey}</span>
                      ) : row.corey ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.employer === "string" ? (
                        <span className="text-sm font-medium text-accent">{row.employer}</span>
                      ) : row.employer ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="p-4" />
                  <td className="p-4 text-center border-x-2 border-accent/30">
                    <Button className="w-full max-w-[160px]" onClick={() => handleAddToCart("cch-unlimited-safety")} data-testid="button-compare-add-corey">
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                  </td>
                  <td className="p-4 text-center">
                    <Button className="w-full max-w-[160px]" onClick={() => handleAddToCart("employer-platform")} data-testid="button-compare-add-employer">
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Choose Your Plan */}
      <section id="pricing" className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-display font-black text-primary">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground">Start with AI guidance alone or go all-in with the full platform.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <PricingCard
              tier="Unlimited Corey"
              price="$199"
              period="/mo"
              features={[
                "Unlimited Corey Interactions",
                "Compliance Checklist Library (downloadable PDFs)",
                "Interactive Audit Prep Tools with progress tracking",
                "DOT physical & drug testing guidance",
                "Workers' comp documentation help",
                "Custom compliance reports",
                "Priority response times",
                "Dedicated support",
              ]}
              bestFor="Safety Managers, growing companies, and large fleets. All self-service — no consulting time required."
              buttonText="Go Unlimited"
              buttonHref="/get-started"
              highlighted
              productId="cch-unlimited-safety"
              onAddToCart={handleAddToCart}
            />
            <PricingCard
              tier="Complete Compliance Platform"
              price="$599"
              period="/mo"
              features={[
                "Compliance Dashboard with real-time metrics",
                "Employee tracking & medical surveillance (11 types)",
                "OSHA 300 & 301 logging & incident management",
                "DOT notifications at 60/30/15/7-day windows",
                "CCHUB Handshake — QR-based Medical Passport",
                "Training LMS with PDF certificates",
                "Corrective Action Plans (CAPA)",
                "ISO 9001/14001/45001 AI guidance",
                "Up to 50 employees included (+$2/ea beyond 50)",
                "Add Corey AI for $699/mo (+$129/ea additional seat)",
              ]}
              bestFor="For companies serious about compliance — from startups to mid-sized firms. One platform, one price, everything you need."
              buttonText="Get Started — $599/mo"
              buttonHref="/get-started"
              productId="employer-platform"
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
      <section className="py-24 bg-white border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer" className="inline-block cursor-pointer">
              <img src={acsiLogo} alt="ACSI" className="h-16 w-auto mx-auto mb-4 hover:opacity-80 transition-opacity" data-testid="img-acsi-logo-landing" />
            </a>
            <h2 className="text-3xl font-display font-bold text-primary">ISO Management Plans</h2>
            <p className="text-lg text-muted-foreground">
              ISO 9001, 14001, and 45001 certification support. Management as a Service.
            </p>
          </div>
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="bg-muted/40 border border-border rounded-2xl px-8 py-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">ACSI Training &amp; Certification Plans — Coming Soon</h3>
              <p className="text-muted-foreground leading-relaxed">
                ACSI is building a dedicated suite of ISO training programs, audit packages, and certification-readiness plans. Pricing will be announced when they launch. In the meantime, contact ACSI directly for current consulting and training engagements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-accent text-black font-semibold" data-testid="button-visit-acsi-pricing">
                    Visit acsi-quality.com
                  </Button>
                </a>
                <Link href="/contact">
                  <Button variant="outline" data-testid="button-contact-iso-pricing">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Us — Let's Talk
                  </Button>
                </Link>
              </div>
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
              CCHUB: The One Stop Employer Shop
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
                "CCHUB saved us from a $75,000 OSHA fine. We had been logging an injury incorrectly for months. The AI caught it immediately and showed us exactly how to fix it."
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
                "As an HR director managing DOT compliance for 50+ drivers, CCHUB has become indispensable. The drug testing guidance alone has saved us countless hours of confusion."
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
              Everything you need to know about CCHUB.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-muted/30 rounded-lg border border-border/50 px-6">
              <AccordionTrigger className="text-left font-semibold text-primary" data-testid="faq-trigger">
                Is the AI guidance legally binding?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                CCHUB provides educational guidance based on OSHA 29 CFR 1904, DOT 49 CFR Part 40, and ISO standards. While our AI cites specific regulations and provides expert-level interpretations, the final compliance decisions remain with your organization. For complex legal matters, please consult with a qualified employment attorney.
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
                What's the difference between CCHUB and ACSI?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                CCHUB (Core Compliance Hub) focuses on occupational health compliance including OSHA recordkeeping, DOT physicals, and drug testing. ACSI (ISO Manager) specializes in ISO management system standards (9001, 14001, 45001). The Enterprise Bundle combines both for comprehensive compliance coverage.
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
            Join hundreds of companies using Core Compliance Hub to protect their employees, reduce fines, and stay audit-ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button size="lg" variant="secondary" className="px-10 text-lg font-semibold" data-testid="button-cta-get-started">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="px-10 text-lg text-black border-black hover:bg-black hover:text-white" data-testid="button-cta-contact-us">
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

function FeatureCard({ icon: Icon, imageSrc, title, description, href, testId }: any) {
  const inner = (
    <div className={`p-8 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors h-full flex flex-col ${href ? "cursor-pointer hover:border-accent/40 hover:shadow-md" : ""}`}>
      {imageSrc ? (
        <div className="w-20 h-20 rounded-xl flex items-center justify-center mb-6">
          <img src={imageSrc} alt={title} className="w-20 h-20 object-contain" data-testid={`img-feature-${title?.toLowerCase().replace(/\s+/g, '-')}`} />
        </div>
      ) : (
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed flex-1">
        {description}
      </p>
      {href && (
        <p className="mt-5 text-sm font-bold text-accent flex items-center gap-1">
          Explore ISO Manager <ArrowRight className="w-3.5 h-3.5" />
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <div data-testid={testId} className="h-full">
          {inner}
        </div>
      </Link>
    );
  }
  return inner;
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
              <span className="text-sm text-muted-foreground ml-1">per person</span>
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

      {productId === "course-drug-alcohol" && (
        <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-lg p-3 animate-pulse-subtle" data-testid="landing-policy-incentive">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-700">FREE D&A Downloadable Policy</p>
              <p className="text-xs text-amber-600/80">Complete this course to unlock your free policy</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between gap-2 flex-wrap pt-4 border-t border-border/50">
        <div>
          <span className="text-2xl font-bold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground ml-1">per person</span>
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
