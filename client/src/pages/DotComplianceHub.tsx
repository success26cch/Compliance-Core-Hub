import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight,
  Clock, FileText, Users, BarChart3, Download, Bell,
  Car, ClipboardList, Calendar, Zap, Lock, ChevronDown, Play
} from "lucide-react";
import { useState, useRef } from "react";
import { WalkthroughRequestForm, SubscribeForm } from "@/components/MarketingForms";
import { motion } from "framer-motion";
import { CartTrigger } from "@/components/CartDrawer";
import TryCoreyChatWidget from "@/components/TryCoreyChatWidget";
import logoUrl from "@assets/7_1772719327857.png";
import dotNavLogoUrl from "@assets/6_1777062245566.png";
import dotVideoSrc from "@assets/DOT_regualtions_can_be_confusing_1775780745689.mp4";


const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const PAIN_POINTS = [
  {
    icon: Clock,
    title: "The 365-Day Trap",
    body: "Every active driver needs an annual Clearinghouse query — no exceptions. Miss one window and you're operating a non-compliant driver. That's a fine, not a warning.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: FileText,
    title: "Missing DQ Files",
    body: "FMCSA auditors check Driver Qualification files first. One missing document — a road test, an MVR review, a pre-employment drug test — can fail your entire audit.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Car,
    title: "Expired Medical Cards",
    body: "A driver with an expired medical card is legally unqualified to operate a commercial vehicle. If they're caught, the fine is yours — not theirs.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Users,
    title: "Hired/Fired Data Chaos",
    body: "New drivers added to the Clearinghouse. Terminated drivers still showing active. Consent forms missing. Every company has this problem. Most don't know it until the audit.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Clearinghouse Orchestrator",
    description: "Every driver has a live 365-day countdown clock. Red when overdue. Yellow at 30 days. Green when clear. Never miss an annual query again.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Download,
    title: "FMCSA Bulk Query Export",
    description: "Click one button and get a perfectly formatted CSV file ready to upload to clearinghouse.fmcsa.dot.gov. What used to take 4 hours takes 4 minutes.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: FileText,
    title: "Driver Qualification Files",
    description: "A digital checklist for every driver's DQ file — applications, MVR reviews, road tests, pre-employment drug tests, annual certifications, and more. Progress bar shows exactly what's missing.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Bell,
    title: "Medical Card Expiration Alerts",
    description: "Automated alerts at 60, 30, and 15 days before any driver's DOT physical expires. No more surprise-expired cards on a roadside inspection.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Calendar,
    title: "MVR Annual Reminder Engine",
    description: "Tracks the date of every Motor Vehicle Record pull. Builds a 'Ready to Order' list every month so your manager knows exactly which drivers need their annual MVR review.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Truck,
    title: "Fleet Asset Tracking",
    description: "Every truck and trailer tracked with annual inspection dates and preventive maintenance records. Red alerts when inspection windows are missed or approaching.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Lock,
    title: "Consent Form Tracker",
    description: "Limited Inquiry consent forms required before running a Clearinghouse query. The system flags drivers with no consent on file — protecting you from legal exposure.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    icon: ClipboardList,
    title: "Active / Archive / Terminated",
    description: "Hired a driver? Add them in 60 seconds. Driver left? Archive them — DOT requires 3 years of records. The system generates an automatic removal log for audit documentation.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];


const FAQS = [
  {
    q: "Does this connect to the FMCSA Clearinghouse?",
    a: "Yes — DOT Fleet HUB is built around Clearinghouse compliance. The platform tracks every driver's 365-day query window, flags upcoming deadlines, and generates the export file you need to submit queries. Contact us for a walkthrough of exactly how it fits your fleet's workflow.",
  },
  {
    q: "What is the 'Limited Consent' form and why does the tracker matter?",
    a: "Before you can run a Limited Inquiry query on a current employee in the Clearinghouse, the driver must sign a 'Limited Inquiry Consent' form. If you run a query without that signed form on file, you've violated 49 CFR Part 382 — and that's a recordable violation during an FMCSA audit. Our consent tracker flags every driver who hasn't signed yet, so you can never inadvertently skip this step.",
  },
  {
    q: "What happens to terminated drivers — can I just delete them?",
    a: "No — and this is a common mistake. FMCSA regulations require you to maintain Driver Qualification (DQ) file records for at least 3 years after a driver's employment ends. When you archive a driver in DOT Fleet HUB, their records stay accessible and the system generates a dated removal log for your audit file. Deleting them entirely would be an audit red flag.",
  },
  {
    q: "Can clients manage their own drivers after the initial setup?",
    a: "Yes — that's exactly the model. We handle the initial data upload and system walkthrough (the setup fee covers that). After go-live, your team adds new hires, updates information, and runs exports entirely on their own. You don't need us for daily operations. We built it this way so you can scale without adding administrative staff.",
  },
  {
    q: "What's the difference between a Limited and Full Clearinghouse query?",
    a: "A Limited Inquiry checks only whether a violation exists in the Clearinghouse — it doesn't show you details. You're required to run one at pre-employment and annually for current drivers. A Full Query shows complete violation history and requires written consent from the driver. If a Limited Query returns a result ('hit'), you must then obtain driver consent and run a Full Query before the driver can operate a CMV.",
  },
  {
    q: "Does the onboarding setup fee cover data entry?",
    a: "Yes. The setup fee covers a concierge data upload session — we work with you to import your existing driver roster, set the initial query dates, and confirm DQ file status for each driver. The 30-minute walkthrough ensures your HR person knows exactly how to add, archive, and export going forward. After that, you're self-sufficient.",
  },
];

export default function DotComplianceHub() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [videoStarted, setVideoStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim() || !leadEmail.includes("@")) return;
    setLeadSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadName.trim(), email: leadEmail.trim(), source: "dot_hub" }),
      });
      setLeadSubmitted(true);
    } catch {
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/">
            <img src={dotNavLogoUrl} alt="CCHUB" className="h-10 object-contain cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <CartTrigger />
            <Link href="/login">
              <Button variant="outline" size="sm" data-testid="button-dot-login">Sign In</Button>
            </Link>
            <Link href="/get-started">
              <Button size="sm" className="bg-accent text-white hover:bg-accent/90" data-testid="button-dot-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Intro Video */}
      <section className="bg-black">
        <div className="max-w-5xl mx-auto relative">
          <video
            ref={videoRef}
            src={dotVideoSrc}
            controls
            className="w-full max-h-[500px] object-contain"
            data-testid="video-dot-compliance-intro"
            onPlay={() => setVideoStarted(true)}
          />
          {!videoStarted && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.2) 100%)" }}
              onClick={() => {
                setVideoStarted(true);
                videoRef.current?.play();
              }}
              data-testid="overlay-video-cta"
            >
              <div className="mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
                <div className="relative w-28 h-28 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40 group-hover:scale-110 transition-transform duration-200">
                  <Play className="w-12 h-12 text-white fill-white ml-1" />
                </div>
              </div>
              <p className="text-white font-bold text-3xl md:text-4xl text-center px-4 drop-shadow-lg">
                43 seconds that could save your fleet
              </p>
              <p className="text-white/70 text-base md:text-lg mt-3 text-center px-4">
                See exactly how DOT Fleet HUB keeps you compliant — automatically
              </p>
              <div className="mt-5 flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2">
                <Play className="w-4 h-4 text-accent fill-accent" />
                <span className="text-white/90 text-sm font-medium tracking-wide">WATCH NOW — 0:43</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Hero */}
      <section className="relative bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDZoNnY2aC02di02em0xMiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center max-w-4xl mx-auto">
            <motion.div variants={fadeUp}>
              <Badge className="bg-accent/20 text-accent border-accent/30 mb-6 text-sm px-4 py-1">
                <Truck className="w-3.5 h-3.5 mr-1.5" />
                DOT Fleet HUB
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              Stop Being a Data Entry Clerk.<br />
              <span className="text-accent">Start Running a Compliant Fleet.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              The Clearinghouse is a trap. One missed annual query, one expired medical card, one incomplete DQ file — and you're exposed. DOT Fleet HUB tracks every driver, every deadline, every document. Automatically.
            </motion.p>
          </motion.div>
        </div>

        {/* Stat bar */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "365", label: "Day countdown per driver" },
              { value: "$16K+", label: "Max fine per violation" },
              { value: "49 CFR", label: "Regulatory backbone" },
              { value: "4 min", label: "Bulk export vs. 4-hour manual entry" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-accent">{s.value}</div>
                <div className="text-white/60 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="bg-red-100 text-red-700 border-red-200 mb-4">The Problem</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">
              The Clearinghouse Is a Full-Time Job Nobody Assigned
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              Most companies are out of compliance right now — and don't know it. Here's what's hiding in your driver files.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-white rounded-2xl border border-border/60 p-6 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center mb-4`}>
                  <p.icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <h3 className="font-semibold text-primary mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Pitch */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-10 h-10 text-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-green-400">
            "We turn a 4-hour headache into a 4-minute task."
          </h2>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Most companies manually type 50 drivers into the Clearinghouse every year. It takes hours and one typo leads to a fine. With DOT Fleet HUB, you manage your roster here all year — then hit <strong className="text-accent">Generate Query File</strong> when it's time. One perfectly formatted file. 30 seconds to upload.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">Platform Features</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">
              Everything a DOT Fleet Needs. Nothing It Doesn't.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                className="bg-muted/30 rounded-2xl border border-border/60 p-5 hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                  <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-primary text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-12">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ background: "hsl(222,47%,9%)" }}>
              <div className="bg-slate-800 px-5 py-3 flex items-center justify-between border-b border-white/10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">DOT Fleet HUB — At a Glance</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">● Live Platform</span>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Clock, label: "Clearinghouse 365-Day Tracker", color: "text-red-400", bg: "bg-red-400/10" },
                  { icon: FileText, label: "Driver Qualification Files", color: "text-blue-400", bg: "bg-blue-400/10" },
                  { icon: ShieldCheck, label: "Medical Card Expiration Alerts", color: "text-emerald-400", bg: "bg-emerald-400/10" },
                  { icon: Car, label: "Annual MVR Reminder Engine", color: "text-yellow-400", bg: "bg-yellow-400/10" },
                  { icon: ClipboardList, label: "Consent Form Status Tracking", color: "text-violet-400", bg: "bg-violet-400/10" },
                  { icon: Download, label: "FMCSA Bulk Query CSV Export", color: "text-cyan-400", bg: "bg-cyan-400/10" },
                  { icon: Users, label: "Driver Archive & Removal Logs", color: "text-orange-400", bg: "bg-orange-400/10" },
                  { icon: Bell, label: "60 / 30 / 15-Day Countdowns", color: "text-pink-400", bg: "bg-pink-400/10" },
                  { icon: BarChart3, label: "Fleet Equipment Tracking", color: "text-teal-400", bg: "bg-teal-400/10" },
                ].map(({ icon: Icon, label, color, bg }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-xs font-medium text-white/80 leading-tight">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-white/30 text-xs pb-5 font-medium tracking-wide">Every driver. Every deadline. One system.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workflow visual */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-6">Your Daily Workflow</Badge>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-12">
            Login. See the Problem. Fix It. Log Out.
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: "1", icon: Bell, title: "Alert", body: "\"3 drivers need Clearinghouse queries by Friday\"" },
              { step: "2", icon: Download, title: "Export", body: "Click 'Generate Query File' — formatted CSV ready in seconds" },
              { step: "3", icon: Users, title: "Update", body: "Add the new hire from this morning — takes 60 seconds" },
              { step: "4", icon: CheckCircle2, title: "Done", body: "Total time: under 5 minutes. Everything documented." },
            ].map((w, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border/60 p-5 shadow-sm text-center">
                <div className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">{w.step}</div>
                <w.icon className="w-5 h-5 text-accent mx-auto mb-2" />
                <div className="font-semibold text-primary text-sm mb-1">{w.title}</div>
                <p className="text-xs text-muted-foreground">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ask DOT Corey */}
      <section className="py-20 bg-[hsl(222,47%,9%)]" data-testid="section-dot-ask-corey">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <span className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
              Live Demo
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
              Corey Knows DOT — <span className="text-green-400">Ask Him Anything</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              49 CFR Part 40, Clearinghouse queries, HOS rules, driver qualification files, pre-employment screening — 3 free questions, no credit card required.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <TryCoreyChatWidget compact source="ask_corey_dot" />
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">Built for Fleets of Every Size</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            One missed Clearinghouse query can cost $16,000 in fines. DOT Fleet HUB pays for itself the first time it catches a gap.
            Pricing is scaled to your fleet — contact us for a quote tailored to your driver count and compliance needs.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { label: "Starting from", value: "$349", note: "/month", desc: "Fleets under 50 active drivers" },
              { label: "Bundle pricing", value: "Available", note: "", desc: "DOT + Corey AI + Employer Platform" },
              { label: "Setup fee", value: "One-time", note: "", desc: "Scaled to your driver count" },
            ].map(({ label, value, note, desc }) => (
              <div key={label} className="rounded-2xl border border-border/60 p-6 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
                <p className="text-3xl font-bold text-primary">{value}<span className="text-base font-normal text-muted-foreground">{note}</span></p>
                <p className="text-sm text-muted-foreground mt-2">{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 h-12" data-testid="button-pricing-schedule">
                Schedule a Walkthrough
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/get-started">
              <Button size="lg" variant="outline" className="px-8 h-12" data-testid="button-pricing-getstarted">
                Get Started
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-6">No long-term contracts required. Month-to-month available.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-primary">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-border/60 overflow-hidden">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`faq-dot-${i}`}
                >
                  <span className="font-semibold text-primary text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started-section" className="py-20 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-6" />
          <h2 className="text-3xl font-display font-bold text-white mb-4">Your Fleet Is Either <span className="text-green-400">Compliant or It's Not.</span></h2>
          <p className="text-white/75 mb-8 text-lg">Let's get compliant — and stay that way — before an FMCSA auditor shows up.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 h-12" data-testid="button-bottom-cta">
                Schedule a Walkthrough
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="bg-slate-600 hover:bg-slate-500 text-white border border-slate-500 px-8 h-12" data-testid="button-contact-dot">
                Talk to a Specialist
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-white/50 text-sm">
            One-time onboarding setup · Client self-service after go-live · No long-term contracts
          </p>
          <p className="mt-2 text-white/40 text-xs">
            FMCSA 49 CFR Parts 40, 382, 383, 391 compliance · Setup fee covers initial data migration and training
          </p>
        </div>
      </section>


      <div className="bg-primary">
        <WalkthroughRequestForm
          product="DOT Fleet HUB"
          heading="Request a Walkthrough"
          subtext="Tell us about your fleet and we'll schedule a personalized walkthrough focused on your FMCSA and Clearinghouse compliance needs."
        />
        <SubscribeForm
          source="dot_hub"
          heading="Stay ahead of FMCSA changes"
          subtext="Get DOT compliance tips and regulatory updates — no spam, unsubscribe anytime."
          bgClass="bg-primary/80"
        />
      </div>

      <footer className="border-t border-border/50 bg-white py-8 text-center text-muted-foreground text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logoUrl} alt="CCHUB" className="h-8 object-contain" />
          <p>© {new Date().getFullYear()} Core Compliance Hub — DOT Fleet HUB. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <Link href="/"><span className="hover:text-primary cursor-pointer">Home</span></Link>
            <Link href="/contact"><span className="hover:text-primary cursor-pointer">Contact</span></Link>
            <Link href="/get-started"><span className="hover:text-primary cursor-pointer">Get Started</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
