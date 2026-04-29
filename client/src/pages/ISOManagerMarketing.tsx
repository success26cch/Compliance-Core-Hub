import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CheckCircle2, ChevronRight, Sparkles, Shield, BookOpen,
  MessageSquare, AlertTriangle, ArrowRight, Star,
  FileText, Activity, BarChart2, GraduationCap,
  ClipboardCheck, Mail, Layers, ArrowLeft,
  Building2, Factory, Users, Target, Vault,
  ChevronDown,
} from "lucide-react";
import acsiLogo from "@assets/Transp1_1768928785892.png";

const ORANGE = "hsl(24,95%,53%)";
const DARK = "#0f172a";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const MODULES = [
  { icon: MessageSquare, label: "AI Consultation", desc: "Isa coaches you through any ISO clause, audit scenario, or gap analysis — with your org profile as context.", status: "live" },
  { icon: Shield, label: "NC & CAPA", desc: "Log nonconformances, assign owners, track root cause analysis, and verify effectiveness of corrective actions.", status: "live" },
  { icon: FileText, label: "Documentation Library", desc: "Build and manage your Quality Manual, Procedures, Work Instructions, Templates, and Process Maps.", status: "live" },
  { icon: AlertTriangle, label: "Risk Assessment", desc: "Clause 6.1 risk and opportunity register — identify, analyze, treat, and monitor with audit-ready records.", status: "soon" },
  { icon: BarChart2, label: "Management Review", desc: "Structured inputs, action tracking, and documented outputs for every review meeting ISO requires.", status: "soon" },
  { icon: ClipboardCheck, label: "Internal Audits", desc: "Clause-based checklists, finding management, and close-out tracking for every scheduled audit.", status: "soon" },
  { icon: Mail, label: "Communication", desc: "Log and track internal and external communications required by your management system standard.", status: "soon" },
  { icon: GraduationCap, label: "Training", desc: "Competency tracking, training records, and awareness documentation across your workforce.", status: "soon" },
  { icon: Activity, label: "Measurement & Monitoring", desc: "KPIs, metrics, objectives, and performance data — everything an auditor looks for in Clause 9.", status: "soon" },
];

const STANDARDS = [
  { code: "ISO 9001:2015", label: "Quality Management", tier: "core" },
  { code: "ISO 14001:2015", label: "Environmental Management", tier: "core" },
  { code: "ISO 45001:2018", label: "Occupational Health & Safety", tier: "core" },
  { code: "IATF 16949:2016", label: "Automotive Quality", tier: "specialist" },
  { code: "AS9100 Rev D", label: "Aerospace Quality", tier: "specialist" },
  { code: "ISO 13485:2016", label: "Medical Device Quality", tier: "specialist" },
  { code: "ISO/IEC 27001:2022", label: "Information Security", tier: "specialist" },
];

const ISO_CORE_CAPABILITIES = [
  "Pick 1 standard: 9001, 14001, or 45001",
  "Isa AI coaching (clause-by-clause)",
  "Documentation Library (Quality Manual, Procedures, WIs)",
  "NC & CAPA Management module",
  "Risk Assessment module (coming soon)",
  "Knowledge Architecture setup included",
];
const ISO_INTEGRATED_CAPABILITIES = [
  "All 3 core standards: 9001 + 14001 + 45001",
  "Isa AI across all 3 standards",
  "Full Documentation Library + NC/CAPA",
  "Risk Assessment + Management Review modules",
  "Cross-standard Integrated Management System",
  "Knowledge Architecture setup included",
];
const ISO_SPECIALIST_CAPABILITIES = [
  "Pick 1: IATF 16949, AS9100, or ISO 13485",
  "Isa Pro AI for your chosen standard",
  "Full module suite: Docs, NC/CAPA, Audits",
  "Industry-specific process mapping",
  "Second-party audit support",
  "Knowledge Architecture setup included",
];
const ISO_PRO_CAPABILITIES = [
  "9001 + 14001 + 45001 + 1 Specialist standard",
  "Isa Pro across all standards",
  "All 8 platform modules (full suite)",
  "Communication + Training + M&M modules",
  "KPI tracking & audit evidence management",
  "Priority ACSI consulting access",
];

const FAQS = [
  {
    q: "What is the difference between Isa and ISO Manager?",
    a: "Isa is the AI coaching engine — she thinks like a Lead Auditor, citing clause numbers and guiding you through gaps and audit prep. ISO Manager is the full platform that houses Isa and adds structured modules for every element your management system needs: Documentation, NC/CAPA, Risk Assessment, Internal Audits, and more.",
  },
  {
    q: "Do I need a setup wizard before using the platform?",
    a: "Yes — and it's worth it. The 3-phase setup wizard (Organizational Context, Process Architecture, Quality Policy) gives Isa a complete picture of your organization. After setup, every Isa response references your actual processes, scope, and standard — not generic answers.",
  },
  {
    q: "Can I manage multiple ISO standards in one workspace?",
    a: "Yes. The Integrated tier supports all three core standards (ISO 9001, 14001, 45001) in one Integrated Management System. The PRO tier adds a specialist standard (IATF 16949, AS9100, or ISO 13485) on top.",
  },
  {
    q: "What is a one-time setup fee for?",
    a: "The setup fee covers ACSI's onboarding work — helping you configure your Knowledge Architecture, import your existing documentation, map your processes, and orient your team on the platform before your first audit cycle.",
  },
  {
    q: "What modules are live today?",
    a: "AI Consultation (Isa), NC & CAPA Management, and the Documentation Library are all live. Risk Assessment, Management Review, Internal Audits, Communication, Training, and Measurement & Monitoring are in active development and coming soon.",
  },
];

/* ─── TIER CARD ────────────────────────────────────────── */
function TierCard({
  delay, badge, title, subtitle,
  capabilities, cardClass, topBarClass, capIconClass,
  picker, badges, coreBadges, dark, cta, testId,
}: {
  delay: number; badge: string; title: string; subtitle: string;
  capabilities: string[]; cardClass: string; topBarClass: string;
  capIconClass: string; picker?: { options: string[]; label: string };
  badges?: string[]; coreBadges?: string[]; dark?: boolean;
  cta: { label: string; href: string; testId: string; style: "accent" | "primary"; external?: boolean };
  testId: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const textBase = dark ? "text-white" : "text-primary";
  const textMuted = dark ? "text-white/60" : "text-muted-foreground";
  const borderMuted = dark ? "border-white/15" : "border-border/60";
  const badgeBg = dark ? "bg-white/10 text-white/80 border-white/20" : "bg-muted text-primary border-border/60";
  const selectedBg = dark ? "bg-accent/20 text-accent border-accent/40" : "bg-accent text-white border-accent";
  const unselectedBg = dark ? "bg-white/5 text-white/70 border-white/20 hover:border-accent/40" : "bg-muted/40 text-primary border-border/60 hover:border-accent/40 hover:bg-accent/5";
  const ctaClass = cta.style === "accent"
    ? "w-full bg-accent hover:bg-accent/90 text-white font-bold"
    : "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold";
  const ctaEl = cta.external
    ? <a href={cta.href}><Button size="sm" className={ctaClass} data-testid={cta.testId}>{cta.label}</Button></a>
    : <Link href={cta.href}><Button size="sm" className={ctaClass} data-testid={cta.testId}>{cta.label}</Button></Link>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="h-full">
      <Card className={`h-full p-5 hover:shadow-lg transition-all relative overflow-hidden flex flex-col ${cardClass}`} data-testid={testId}>
        <div className={`absolute top-0 inset-x-0 h-1 rounded-t ${topBarClass}`} />
        <div className="absolute top-3 right-3">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${dark ? "bg-accent text-white" : "bg-accent/10 text-accent border border-accent/30"}`}>{badge}</span>
        </div>
        <div className="mb-4 pr-20">
          <p className={`font-black leading-tight text-sm ${textBase}`}>{title}</p>
          <p className="text-[10px] text-accent font-semibold mt-0.5">{subtitle}</p>
        </div>
        <div className={`mb-4 pb-3 border-b ${borderMuted}`}>
          <p className={`text-xs font-semibold ${dark ? "text-white/60" : "text-muted-foreground"}`}>Pricing coming soon — contact us for details</p>
        </div>
        {badges && (
          <div className="mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${textMuted}`}>Standards Included</p>
            <div className="flex flex-wrap gap-1">
              {badges.map(s => <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeBg}`}>{s}</span>)}
            </div>
          </div>
        )}
        {coreBadges && picker && (
          <div className="mb-3 space-y-2">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>Core Standards</p>
              <div className="flex flex-wrap gap-1">
                {coreBadges.map(s => <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeBg}`}>{s}</span>)}
              </div>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>+ {picker.label}</p>
              <div className="grid grid-cols-3 gap-1">
                {picker.options.map(opt => (
                  <button key={opt} onClick={() => setSelected(p => p === opt ? null : opt)}
                    className={`text-[9px] px-1.5 py-1.5 rounded border font-bold transition-all leading-tight text-center ${selected === opt ? selectedBg : unselectedBg}`}
                    data-testid={`button-standard-pro-${opt.replace(/\s/g, "-").toLowerCase()}`}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {picker && !coreBadges && (
          <div className="mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${textMuted}`}>{picker.label}</p>
            <div className="grid grid-cols-1 gap-1">
              {picker.options.map(opt => (
                <button key={opt} onClick={() => setSelected(p => p === opt ? null : opt)}
                  className={`text-left px-2.5 py-1.5 rounded border text-[10px] font-bold transition-all ${selected === opt ? selectedBg : unselectedBg}`}
                  data-testid={`button-standard-${opt.replace(/\s/g, "-").toLowerCase()}`}>{opt}</button>
              ))}
            </div>
          </div>
        )}
        <ul className="space-y-1.5 flex-1 mb-5">
          {capabilities.map(cap => (
            <li key={cap} className="flex items-start gap-1.5">
              <CheckCircle2 className={`w-3 h-3 mt-0.5 shrink-0 ${capIconClass}`} />
              <span className={`text-[10px] leading-snug ${textMuted}`}>{cap}</span>
            </li>
          ))}
        </ul>
        {ctaEl}
      </Card>
    </motion.div>
  );
}

/* ─── FAQ ITEM ─────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
        data-testid={`faq-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}>
        <span className="text-sm font-bold text-white/85 group-hover:text-white transition-colors leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 mt-0.5 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-white/55 leading-relaxed pb-4">{a}</p>}
    </div>
  );
}

/* ─── PAGE ──────────────────────────────────────────────── */
export default function ISOManagerMarketing() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: DARK }} data-testid="page-iso-manager-marketing">

      {/* ── Back nav ── */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-white/80 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </Link>
      </div>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-16">
        <motion.div initial="hidden" animate="visible" variants={stagger}>

          {/* Eyebrow */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/30">
              <img src={acsiLogo} alt="ACSI" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: ORANGE }}>ACSI Quality Solutions</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] bg-accent/20 text-accent border border-accent/30 rounded-full px-2 py-0.5 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Powered by Isa AI
                </span>
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black text-white leading-none mb-4">
            ISO Manager
            <br />
            <span style={{ color: ORANGE }}>The Complete IMS Platform.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            A structured, AI-powered workspace to build, manage, and maintain your ISO management system from initial gap assessment through ongoing certification — with Isa, your Lead Auditor AI, built into every module.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Link href="/iso-manager">
              <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-7 py-3 text-base gap-2" data-testid="button-hero-enter-app">
                Enter ISO Manager <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/meet-isa">
              <Button variant="outline" className="border-white/20 text-white/70 hover:text-white hover:border-white/40 bg-transparent font-bold px-7 py-3 text-base gap-2" data-testid="button-hero-meet-isa">
                Meet Isa AI <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Quick stats */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-6 mt-10 pt-10 border-t border-white/10">
            {[
              { icon: Layers, label: "9 Modules", sub: "3 live · 6 coming soon" },
              { icon: Target, label: "7 Standards", sub: "Core + Specialist tiers" },
              { icon: Sparkles, label: "Isa AI", sub: "Built into every module" },
              { icon: Vault, label: "4 Pricing Tiers", sub: "Contact us for pricing" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-black text-white leading-none">{s.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          PLATFORM MODULES
      ══════════════════════════════════════ */}
      <section className="py-16" style={{ background: "hsl(222,47%,9%)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-10">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: ORANGE }}>Platform Modules</span>
              <h2 className="text-3xl font-black text-white mt-2">Everything your management system needs.</h2>
              <p className="text-white/50 mt-2 max-w-xl text-sm leading-relaxed">
                9 dedicated modules — 3 live today, 6 in active development. Every module has Isa coaching built in so you're never working alone.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULES.map((mod, i) => (
                <motion.div key={mod.label} variants={fadeUp} transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  data-testid={`card-module-mkt-${mod.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center">
                      <mod.icon className="w-4.5 h-4.5" style={{ color: ORANGE }} />
                    </div>
                    {mod.status === "live"
                      ? <span className="text-[9px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">LIVE</span>
                      : <span className="text-[9px] font-bold text-white/30 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">COMING SOON</span>
                    }
                  </div>
                  <p className="text-sm font-black text-white mb-1">{mod.label}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{mod.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ISA AI CALLOUT
      ══════════════════════════════════════ */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp}
            className="rounded-2xl p-8 md:p-10 border border-accent/20 flex flex-col md:flex-row gap-8 items-start"
            style={{ background: "linear-gradient(135deg, hsl(222,47%,12%) 0%, hsl(24,30%,12%) 100%)" }}>
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/40 shrink-0">
              <img src={acsiLogo} alt="Isa" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-black text-white">Isa — Lead Auditor AI</span>
                <span className="text-[10px] bg-accent/20 text-accent border border-accent/30 rounded-full px-2 py-0.5 font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> ISO Manager AI
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-4 max-w-xl">
                Isa thinks like a Lead Auditor — she cites clause numbers, identifies gaps using objective evidence language, and guides your team from setup through certification. After you complete the 3-phase setup wizard, every Isa response is personalized to your organization's standard, scope, and processes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Clause-by-clause gap analysis",
                  "NC & CAPA root cause guidance",
                  "Audit finding response coaching",
                  "Document structure & content review",
                  "Management review preparation",
                  "Risk assessment methodology",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-white/55">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <Link href="/meet-isa">
                <button className="flex items-center gap-1.5 text-sm font-bold text-white/50 hover:text-white transition-colors" data-testid="link-meet-isa-from-callout">
                  Learn More About Isa <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          STANDARDS
      ══════════════════════════════════════ */}
      <section className="py-16" style={{ background: "hsl(222,47%,9%)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-10">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: ORANGE }}>Standards Coverage</span>
              <h2 className="text-3xl font-black text-white mt-2">7 standards. One platform.</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STANDARDS.map((s, i) => (
                <motion.div key={s.code} variants={fadeUp} transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4 border border-white/10 bg-white/[0.03]"
                  data-testid={`card-standard-${s.code.replace(/\s|:/g, "-").toLowerCase()}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: s.tier === "core" ? ORANGE : "hsl(200,80%,60%)" }}>
                      {s.tier === "core" ? "CORE" : "SPECIALIST"}
                    </span>
                  </div>
                  <p className="text-sm font-black text-white leading-tight">{s.code}</p>
                  <p className="text-[11px] text-white/40 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-10">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: ORANGE }}>Setup & Onboarding</span>
            <h2 className="text-3xl font-black text-white mt-2">Built around your organization.</h2>
            <p className="text-white/50 mt-2 text-sm max-w-xl leading-relaxed">
              Before your first consultation, Isa needs to know your organization. The 3-phase setup wizard captures the context she needs to personalize every answer.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "01", icon: Building2, title: "Organizational Context", desc: "Your standard, industry, number of employees, products and services, manufacturing technologies, and OEM suppliers." },
              { step: "02", icon: Factory, title: "Process Architecture", desc: "Map the core, support, and management processes in your organization and tag them to relevant ISO clauses." },
              { step: "03", icon: Target, title: "Quality Policy Fundamentals", desc: "Capture your quality policy, core values, risk philosophy, and the scope of your management system." },
            ].map((phase, i) => (
              <motion.div key={phase.step} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="rounded-xl p-5 border border-white/10 bg-white/[0.03]"
                data-testid={`card-phase-${phase.step}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-black">{phase.step}</span>
                  <phase.icon className="w-5 h-5 text-white/30" />
                </div>
                <p className="text-sm font-black text-white mb-1">{phase.title}</p>
                <p className="text-xs text-white/45 leading-relaxed">{phase.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          PRICING
      ══════════════════════════════════════ */}
      <section className="py-16" style={{ background: "hsl(222,47%,9%)" }} id="pricing">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-10">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: ORANGE }}>Pricing</span>
              <h2 className="text-3xl font-black text-white mt-2">Choose your tier.</h2>
              <p className="text-white/50 mt-2 text-sm max-w-xl leading-relaxed">
                Every tier includes Isa AI coaching, the Documentation Library, NC & CAPA module, and a dedicated onboarding setup. One-time setup fees cover ACSI's onboarding and configuration services.
              </p>
            </motion.div>

            <div className="overflow-x-auto -mx-4 px-4 pb-4">
              <div style={{ minWidth: "900px" }}>
                <div className="grid grid-cols-4 gap-4">
                  <TierCard
                    testId="card-mkt-iso-core"
                    delay={0.05}
                    badge="TIER 1"
                    title="ISO Manager Core"
                    subtitle="Isa Included"
                    capabilities={ISO_CORE_CAPABILITIES}
                    cardClass="border-border/60 bg-white dark:bg-card"
                    topBarClass="bg-accent"
                    capIconClass="text-accent"
                    picker={{ options: ["ISO 9001", "ISO 14001", "ISO 45001"], label: "Choose Standard" }}
                    cta={{ label: "Get Core", href: "/iso-manager", testId: "button-mkt-iso-core", style: "accent" }}
                  />
                  <TierCard
                    testId="card-mkt-iso-integrated"
                    delay={0.1}
                    badge="TIER 2 · MOST POPULAR"
                    title="ISO Manager Integrated"
                    subtitle="Isa Included"
                    capabilities={ISO_INTEGRATED_CAPABILITIES}
                    cardClass="border-2 border-primary/25 bg-white dark:bg-card"
                    topBarClass="bg-primary"
                    capIconClass="text-primary dark:text-accent"
                    badges={["ISO 9001", "ISO 14001", "ISO 45001"]}
                    cta={{ label: "Get Integrated", href: "/iso-manager", testId: "button-mkt-iso-integrated", style: "primary" }}
                  />
                  <TierCard
                    testId="card-mkt-iso-specialist"
                    delay={0.15}
                    badge="TIER 3"
                    title="ISO Manager Specialist"
                    subtitle="Isa Pro Included"
                    capabilities={ISO_SPECIALIST_CAPABILITIES}
                    cardClass="border border-accent/30 bg-white dark:bg-card"
                    topBarClass="bg-accent"
                    capIconClass="text-accent"
                    picker={{ options: ["IATF 16949", "AS9100 Rev D", "ISO 13485"], label: "Choose Standard" }}
                    cta={{ label: "Talk to ACSI", href: "mailto:info@acsi-quality.com", testId: "button-mkt-iso-specialist", style: "accent", external: true }}
                  />
                  <TierCard
                    testId="card-mkt-iso-pro"
                    delay={0.2}
                    badge="TIER 4 · FULL PLATFORM"
                    title="ISO Manager PRO"
                    subtitle="Isa Pro Included"
                    capabilities={ISO_PRO_CAPABILITIES}
                    cardClass="bg-primary"
                    topBarClass="bg-accent"
                    capIconClass="text-accent"
                    dark
                    coreBadges={["9001", "14001", "45001"]}
                    picker={{ options: ["IATF 16949", "AS9100 Rev D", "ISO 13485"], label: "Choose Specialist" }}
                    cta={{ label: "Talk to ACSI", href: "mailto:info@acsi-quality.com", testId: "button-mkt-iso-pro", style: "accent", external: true }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-8">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: ORANGE }}>FAQ</span>
            <h2 className="text-3xl font-black text-white mt-2">Common questions.</h2>
          </motion.div>
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/10 bg-white/[0.03] px-6">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-20 max-w-4xl mx-auto px-4 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp}
            className="rounded-2xl p-10 border border-white/10"
            style={{ background: "linear-gradient(135deg, hsl(222,47%,12%) 0%, hsl(24,25%,12%) 100%)" }}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/40 mx-auto mb-5">
              <img src={acsiLogo} alt="ACSI" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Ready to build your management system?</h2>
            <p className="text-white/55 text-sm max-w-lg mx-auto mb-7 leading-relaxed">
              Sign in to access the ISO Manager workspace, complete your setup wizard, and start your first Isa consultation — all in one session.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/iso-manager">
                <Button className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-3 text-base gap-2" data-testid="button-cta-enter-app">
                  Enter ISO Manager <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="mailto:info@acsi-quality.com">
                <Button variant="outline" className="border-white/20 text-white/70 hover:text-white hover:border-white/40 bg-transparent font-bold px-8 py-3 text-base" data-testid="button-cta-contact">
                  Talk to ACSI
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
