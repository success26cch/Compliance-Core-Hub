import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle2, ArrowLeft, ChevronRight, Sparkles, Zap, Shield,
  BookOpen, MessageSquare, AlertTriangle, HelpCircle, GitMerge, Search,
  ChevronDown, Target, Award, FileText, Users, Factory,
  BarChart3, Building2, Layers, ClipboardCheck, FileSearch,
  Scale, Lock, Brain, ShieldCheck, ArrowRight, Star,
  ClipboardList, ArrowRightLeft, CheckSquare, MessageCircle,
} from "lucide-react";
import acsiLogo from "@assets/42_1772589582132.png";
import isaBotImg from "@assets/isa_bot_1776458921960.png";
import TryCoreyChatWidget from "@/components/TryCoreyChatWidget";

const ORANGE = "hsl(24,95%,53%)";
const ORANGE_DARK = "hsl(24,95%,42%)";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const ISA_STANDARDS_CORE = ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"];
const ISA_STANDARDS_PRO = ["IATF 16949:2016", "AS9100 Rev D", "ISO 13485:2016", "ISO/IEC 27001:2022"];

const STATS = [
  { value: "7", label: "ISO Standards" },
  { value: "Instant", label: "Clause Answers" },
  { value: "24/7", label: "Expert Access" },
  { value: "0", label: "Scheduling Required" },
];

const CAPABILITIES = [
  {
    icon: FileSearch,
    title: "Clause-by-Clause Gap Analysis",
    description: "Tell Isa where you stand and she walks through every clause conversationally — asking targeted questions, identifying gaps, explaining risk, and telling you exactly what you need to address before a certification audit.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: ClipboardCheck,
    title: "Audit Readiness Coaching",
    description: "Isa asks you the exact questions a third-party auditor would ask — clause by clause. She tells you what objective evidence you need, flags common nonconformance triggers, and explains what auditors look for in each area.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Nonconformance Response Guidance",
    description: "Received a major or minor NC? Isa coaches you through writing a defensible corrective action response — explaining root cause methodology, containment options, and what the auditor needs to see to close the finding.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: BookOpen,
    title: "Quality Manual Coaching",
    description: "Isa explains what your Quality Manual must address clause by clause and why — asking about your scope, context, and processes, then telling you exactly what the standard requires your manual to say. You write it; Isa makes sure it's right.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: GitMerge,
    title: "Integrated Management Systems",
    description: "Running ISO 9001, 14001, and 45001 together? Isa identifies which clauses overlap, explains where one system satisfies another, and guides you toward one unified IMS rather than three separate programs.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Layers,
    title: "Internal Audit Preparation",
    description: "Isa walks you through the questions an auditor would ask for each clause — with objective evidence requirements and common nonconformance triggers — so your internal auditors know exactly what to look for and what records to verify.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Target,
    title: "Corrective Action Coaching",
    description: "Isa coaches you through structuring your CAPA response using 8D, 5-Why, or fishbone methodology — explaining the difference between correction and corrective action, and what the standard requires for verification of effectiveness.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: FileText,
    title: "Management Review Guidance",
    description: "Isa explains what Clause 9.3 requires for management review — what inputs must be discussed, who must attend, what outputs must be recorded, and what evidence an auditor would ask to see for your last review.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: CheckSquare,
    title: '"Would You Pass?" Scenario Assessment',
    description: "Describe exactly what your organization does and Isa tells you whether it conforms — with clause references, risk level, and what an auditor would expect to see as objective evidence.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: ArrowRightLeft,
    title: "Standard Transition Coaching",
    description: "Moving from OHSAS 18001 to ISO 45001? Upgrading a legacy QMS? Isa walks you through what changed between editions, what your existing system already covers, and what gaps need to be closed before re-certification.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: ClipboardList,
    title: "Post-Audit Report Debrief",
    description: "Got your audit report? Isa interprets your nonconformances and observations — explaining what each finding really means, whether it's major or minor risk, and how to prioritize your 30-day response plan.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    icon: MessageCircle,
    title: "Corrective Action Response Review",
    description: "Wrote your corrective action response and not sure the auditor will accept it? Describe what you did and Isa tells you whether the root cause, containment, and corrective action are sufficient to close the finding.",
    color: "text-lime-400",
    bg: "bg-lime-500/10",
  },
];

const STANDARDS_DETAIL = [
  {
    code: "ISO 9001:2015",
    label: "Quality Management",
    tier: "core",
    focus: "Customer satisfaction, process control, continual improvement",
    industries: "Manufacturing, services, healthcare, aerospace, automotive",
  },
  {
    code: "ISO 14001:2015",
    label: "Environmental Management",
    tier: "core",
    focus: "Environmental impact, legal compliance, sustainability objectives",
    industries: "All industries with environmental aspects and impacts",
  },
  {
    code: "ISO 45001:2018",
    label: "OH&S Management",
    tier: "core",
    focus: "Worker health & safety, hazard identification, incident prevention",
    industries: "All industries — replaces OHSAS 18001",
  },
  {
    code: "IATF 16949:2016",
    label: "Automotive Quality",
    tier: "pro",
    focus: "Automotive QMS clauses, PPAP, APQP, core tools (CSRs → CESAR)",
    industries: "Automotive OEM suppliers and Tier 1/2/3 manufacturers",
  },
  {
    code: "AS9100 Rev D",
    label: "Aerospace Quality",
    tier: "pro",
    focus: "Design risk, configuration management, AS9100 special requirements",
    industries: "Aerospace, defense, and space manufacturing",
  },
  {
    code: "ISO 13485:2016",
    label: "Medical Devices",
    tier: "pro",
    focus: "Design controls, risk management, sterility, regulatory requirements",
    industries: "Medical device manufacturers and suppliers",
  },
  {
    code: "ISO/IEC 27001:2022",
    label: "Information Security",
    tier: "pro",
    focus: "Risk assessment, security controls, ISMS, data protection",
    industries: "Technology, finance, healthcare, any data-handling organization",
  },
];

const ACCURACY_POINTS = [
  { icon: Lock, text: "Only cites ISO standard clause numbers and annex references — no blog posts, no third-party interpretations" },
  { icon: Shield, text: "Clearly distinguishes between SHALL (mandatory), SHOULD (recommended), and MAY (permitted) requirements" },
  { icon: Target, text: "Identifies conformance evidence objectively — what an auditor would accept, not what sounds good" },
  { icon: AlertTriangle, text: "Flags when questions touch Customer Specific Requirements (CSRs) and redirects to CESAR" },
  { icon: Brain, text: "Acknowledges genuine standard ambiguity and explains how certification bodies typically interpret requirements" },
  { icon: Scale, text: "Never guesses what an auditor will or won't find — Isa states what the standard requires, not what might slide" },
];

const AUDIENCE = [
  {
    icon: Award,
    role: "Quality Managers & ISO Coordinators",
    desc: "Run gap analyses, prep for audits, draft procedures, and manage corrective actions — all backed by exact clause references.",
  },
  {
    icon: Factory,
    role: "Operations & Plant Managers",
    desc: "Understand what your certification really requires, where your gaps are, and what's at risk before your auditor shows up.",
  },
  {
    icon: Building2,
    role: "Business Owners Pursuing Certification",
    desc: "Get clause-cited guidance and audit coaching between consultant engagements — so your team arrives prepared and your investment goes further.",
  },
  {
    icon: Users,
    role: "Internal Auditors",
    desc: "Generate clause-specific audit checklists, understand objective evidence requirements, and write compliant audit findings.",
  },
];

const ISA_CAPABILITIES_QUICK = [
  { icon: BookOpen, label: "Clause Interpretation" },
  { icon: Search, label: "Scenario Analysis" },
  { icon: AlertTriangle, label: "Risk Explanation" },
  { icon: HelpCircle, label: "Compliance Q&A" },
  { icon: MessageSquare, label: "Requirement Guidance" },
  { icon: GitMerge, label: "Standard Harmonization" },
];

export default function MeetIsa() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What makes Isa different from ChatGPT or a consultant?",
      a: "Isa is built from the knowledge and methodology of a certified 3rd party ISO auditor — the kind that actually certifies organizations. That means she doesn't just summarize the standard; she applies it the way an auditor sitting across the table from you would. She cites exact clause numbers, uses objective evidence language, and tells you what would and wouldn't satisfy a certification body. Unlike general AI tools that paraphrase requirements, Isa gives you auditor-grade answers on demand — and works alongside your ACSI consultant or auditor, not in place of them.",
    },
    {
      q: "Does Isa work alongside a consultant or auditor?",
      a: "Absolutely — Isa is designed to complement your consultant or auditor relationship, not replace it. She keeps your team informed and prepared between engagements, so when you do work with an ACSI consultant or bring in an auditor, you're not starting from zero. Think of Isa as the always-available resource that handles daily questions, audit prep, and corrective action coaching — so your consultant time can be focused on implementation, decisions, and confirmation.",
    },
    {
      q: "What's the difference between Isa and Isa Pro?",
      a: "Isa covers the three core management system standards: ISO 9001 (Quality), ISO 14001 (Environmental), and ISO 45001 (OH&S). Isa Pro adds all four specialist standards: IATF 16949 (Automotive), AS9100 Rev D (Aerospace), ISO 13485 (Medical Devices), and ISO/IEC 27001 (Information Security). Both include unlimited questions and full AI guidance.",
    },
    {
      q: "What are Customer Specific Requirements (CSRs) and does Isa handle them?",
      a: "CSRs are OEM-specific requirements that supplement IATF 16949 — each automotive customer (Ford, GM, Stellantis, etc.) publishes their own. Because CSRs change frequently and require live OEM portal access, Isa does not cover them. She redirects all CSR questions to CESAR, our dedicated CSR Connect Hub built specifically for that purpose.",
    },
    {
      q: "How does Isa integrate with the ISO Manager platform?",
      a: "Isa is the AI coaching engine behind every ISO Manager module. When you complete the 3-phase setup wizard, Isa uses your organization's profile — standard, processes, scope, and quality policy — to personalize every answer. ISO Manager layers a full 8-module platform on top: Documentation Library, NC & CAPA tracking, Risk Assessment, Internal Audits, Management Review, Communication, Training, and Measurement & Monitoring.",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" data-testid="page-meet-isa">

      {/* ══════════════════════════════
          WHITE TOP SECTION
      ══════════════════════════════ */}
      <div className="relative overflow-hidden bg-white">
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[100px]"
          style={{ background: ORANGE }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Nav */}
        <nav className="relative z-10 border-b border-black/8 px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to CCHUB
            </button>
          </Link>
          <img src={acsiLogo} alt="ACSI" style={{ height: "36px", mixBlendMode: "multiply" }} />
          <Link href="/settings">
            <Button
              className="font-bold text-white px-5 py-2 text-sm"
              style={{ background: ORANGE }}
              data-testid="button-nav-get-isa"
            >
              Get Isa
            </Button>
          </Link>
        </nav>

        {/* Hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            {/* Isa Avatar */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-[40px]" style={{ background: `${ORANGE}30` }} />
                <img
                  src={isaBotImg}
                  alt="Isa AI"
                  className="relative w-48 h-48 rounded-full object-cover border-4 shadow-2xl"
                  style={{ borderColor: `${ORANGE}60`, boxShadow: `0 0 60px ${ORANGE}30` }}
                  data-testid="img-isa-hero"
                />
              </div>
            </div>

            <div className="flex justify-center mb-5">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                style={{ background: "linear-gradient(90deg, #111 0%, #333 100%)" }}
              >
                ACSI · Built from a Certified 3rd Party Auditor's Perspective
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4 text-gray-900 leading-none">
              Meet <span style={{ color: ORANGE }}>Isa</span>
            </h1>
            <p className="text-lg font-semibold text-gray-600 mb-4">
              Lead ISO Auditor AI — built from the knowledge of a certified 3rd party auditor
            </p>
            <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
              Isa doesn't just read the standard — she applies it the way a 3rd party certification auditor would. She cites exact clause numbers, frames answers around objective evidence, coaches your team through audit readiness, and tells you whether your corrective actions will actually hold up under scrutiny.
            </p>

            {/* Standards badges — core orange, pro dark outlined */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {ISA_STANDARDS_CORE.map((s) => (
                <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: ORANGE }}>{s}</span>
              ))}
              {ISA_STANDARDS_PRO.map((s) => (
                <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-full border-2" style={{ borderColor: "#111", background: "#fff", color: "#111" }}>{s}</span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/settings">
                <Button className="font-bold text-white px-8 py-5 text-base shadow-lg hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)` }} data-testid="button-hero-get-isa">
                  Get Started with Isa
                </Button>
              </Link>
              <Link href="/iso-manager">
                <Button variant="outline" className="font-bold px-8 py-5 text-base border-2 border-gray-900 text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-all" data-testid="button-hero-iso-manager">
                  See Full ISO Manager
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="relative z-10 border-t border-black/8" style={{ background: "#111" }}>
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {STATS.map((s, i) => (
              <div key={s.label} className="py-5 text-center" data-testid={`stat-isa-${i}`}>
                <p className="text-2xl font-black mb-0.5" style={{ color: ORANGE }}>{s.value}</p>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════
          DARK SECTION — everything below
      ══════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, hsl(222,47%,9%) 0%, hsl(222,60%,6%) 100%)", color: "white" }}>
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06] blur-[100px]" style={{ background: ORANGE }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-24">

          {/* ── What Isa Handles (quick pills) ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
            <p className="text-center text-xs font-bold text-white/50 uppercase tracking-widest mb-6">What Isa Handles</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {ISA_CAPABILITIES_QUICK.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-xl py-4 px-2 bg-white/10 border border-white/20"
                >
                  <item.icon className="w-5 h-5" style={{ color: ORANGE }} />
                  <span className="text-[11px] font-bold text-white text-center leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Core Feature Cards ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 mb-4">How Isa Thinks</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Built from a Certified 3rd Party Auditor's Perspective</h2>
              <p className="text-white/55 max-w-2xl mx-auto text-base">Most AI tools read the standard. Isa applies it the way a certification body auditor would — citing exact clauses, distinguishing SHALL from SHOULD, and evaluating conformance against what objective evidence actually looks like.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Sparkles,
                  title: "3rd Party Auditor Perspective",
                  body: "Isa was built from the knowledge and methodology of a certified 3rd party ISO auditor — the type who certifies organizations. She frames answers the way that auditor thinks: what clause applies, what evidence is required, what would trigger a nonconformance.",
                },
                {
                  icon: Shield,
                  title: "Scenario Compliance Guidance",
                  body: "Describe what you're doing and Isa tells you whether it aligns with the standard and why — with specific clause references and risk context for gaps.",
                },
                {
                  icon: GitMerge,
                  title: "Regulatory Harmonization",
                  body: "For integrated management systems, Isa applies cross-standard logic to identify overlapping requirements and shared compliance pathways across ISO 9001, 14001, and 45001.",
                },
              ].map((f, i) => (
                <motion.div key={f.title} variants={fadeUp}>
                  <div className="rounded-2xl p-6 h-full bg-white/[0.06] border border-white/15" data-testid={`card-feature-isa-${i}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/10 border border-white/20">
                      <f.icon className="w-5 h-5 text-white" style={{ color: ORANGE }} />
                    </div>
                    <p className="font-black text-white text-sm mb-2">{f.title}</p>
                    <p className="text-sm text-white/65 leading-relaxed">{f.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Capabilities Grid (8 cards) ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 mb-4">What Isa Can Do</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">More Than Answers. <span style={{ color: ORANGE }}>Actions.</span></h2>
              <p className="text-white/55 max-w-2xl mx-auto text-base">Isa doesn't just answer questions. She walks you through gap analyses, coaches audit readiness, interprets your findings, and tells you whether your corrective actions will hold up.</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CAPABILITIES.map((cap, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <div className="rounded-xl p-5 h-full bg-white/[0.05] border border-white/10 hover:border-white/25 transition-colors" data-testid={`card-capability-isa-${i}`}>
                    <div className={`w-10 h-10 rounded-lg ${cap.bg} flex items-center justify-center mb-3`}>
                      <cap.icon className={`w-5 h-5 ${cap.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{cap.title}</h3>
                    <p className="text-xs text-white/55 leading-relaxed">{cap.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Accuracy Protocol ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4" style={{ background: "hsl(0,72%,51%,0.15)", color: "#f87171", border: "1px solid hsl(0,72%,51%,0.3)" }}>Accuracy Protocol</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Zero Tolerance for <span className="text-red-400">Guessing.</span></h2>
              <p className="text-white/55 max-w-2xl mx-auto text-base">When certification is on the line, accuracy isn't optional. Isa cites the standard — not blog posts, not opinions, not assumptions.</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {ACCURACY_POINTS.map((point, i) => (
                <motion.div key={i} variants={fadeUp} className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.05] border border-white/10" data-testid={`accuracy-point-${i}`}>
                  <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{point.text}</p>
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeUp} className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-white/[0.07] border border-white/15 rounded-full px-6 py-3">
                <ShieldCheck className="w-5 h-5" style={{ color: ORANGE }} />
                <span className="text-sm text-white/65">When Isa doesn't know — Isa tells you. No fabrication. No guessing. Ever.</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Standards Coverage ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 mb-4">Standards Coverage</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Built From <span style={{ color: ORANGE }}>Standards.</span> Not Opinions.</h2>
              <p className="text-white/55 max-w-2xl mx-auto text-base">Every answer Isa gives traces back to the actual standard text — not interpretations, not paraphrases, not third-party guidance.</p>
            </motion.div>

            {/* Core standards */}
            <motion.div variants={fadeUp} className="mb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white" style={{ background: ORANGE }}>Core — Included in Isa ($129/mo)</span>
              </div>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-3 mb-6">
              {STANDARDS_DETAIL.filter(s => s.tier === "core").map((s, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <div className="rounded-xl p-5 bg-white/[0.07] border border-white/20 h-full" data-testid={`standard-core-${i}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-black text-white">{s.code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: ORANGE }}>{s.tier === "core" ? "CORE" : "PRO"}</span>
                    </div>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-xs text-white/65 leading-relaxed mb-2">{s.focus}</p>
                    <p className="text-[11px] text-white/40 italic">{s.industries}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pro standards */}
            <motion.div variants={fadeUp} className="mb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white text-gray-900 border border-white/30">Pro — Included in Isa Pro ($249/mo)</span>
              </div>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {STANDARDS_DETAIL.filter(s => s.tier === "pro").map((s, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <div className="rounded-xl p-5 bg-white/[0.04] border border-white/15 h-full" data-testid={`standard-pro-${i}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-black text-white">{s.code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-gray-900">PRO</span>
                    </div>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-xs text-white/60 leading-relaxed mb-2">{s.focus}</p>
                    <p className="text-[11px] text-white/35 italic">{s.industries}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Who Is Isa For? ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 mb-4">Who Is Isa For?</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Every Quality Team <span style={{ color: ORANGE }}>Needs Isa.</span></h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {AUDIENCE.map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <div className="flex flex-col p-6 rounded-xl bg-white/[0.05] border border-white/12 hover:border-white/25 transition-all duration-200 h-full" data-testid={`audience-card-isa-${i}`}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-white/10 border border-white/20">
                      <item.icon className="w-5 h-5 text-white" style={{ color: ORANGE }} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 leading-snug">{item.role}</h3>
                    <p className="text-xs text-white/55 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Isa vs ISO Manager disambiguation ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-8">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 mb-4">Understanding the Difference</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Isa is Your AI Advisor. <span style={{ color: ORANGE }}>ISO Manager is the Platform.</span></h2>
              <p className="text-white/55 max-w-2xl mx-auto text-base">Two separate products. One cohesive system. Know which one you need.</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-5">
              {/* Isa card */}
              <motion.div variants={fadeUp}>
                <div className="rounded-2xl p-6 h-full border-2 bg-white/[0.05]" style={{ borderColor: `${ORANGE}60` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${ORANGE}20`, border: `1px solid ${ORANGE}40` }}>
                      <MessageSquare className="w-5 h-5" style={{ color: ORANGE }} />
                    </div>
                    <div>
                      <p className="font-black text-white text-base">Isa — AI Guidance</p>
                      <p className="text-xs text-white/45">Conversational ISO expert · $129–$249/mo</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed mb-4">
                    Isa is an <strong className="text-white/85">AI conversation partner</strong> — you ask questions, she answers with clause citations. She coaches you through audits, explains standards, guides your corrective actions, and helps you understand what your documentation needs to say.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Ask questions, get clause-cited answers instantly",
                      "Coached gap analysis through conversation",
                      "Mock auditor Q&A to prepare your team",
                      "NC response coaching and CAPA methodology",
                      "Explains what your documents must say",
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-white/60">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ORANGE }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* ISO Manager card */}
              <motion.div variants={fadeUp}>
                <div className="rounded-2xl p-6 h-full bg-white/[0.04] border border-white/15">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/20">
                      <Layers className="w-5 h-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-black text-white text-base">ISO Manager — The Platform</p>
                      <p className="text-xs text-white/45">Full IMS workspace · contact us for pricing</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed mb-4">
                    ISO Manager is a <strong className="text-white/85">complete 8-module IMS platform</strong> — Documentation Library, NC & CAPA tracking, Risk Assessment, Internal Audits, Management Review, Communication, Training, and Measurement & Monitoring. Isa AI is the coaching engine built into every module.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Documentation Library — Quality Manual, Procedures, Work Instructions",
                      "NC & CAPA module — log, track & close nonconformances",
                      "Risk Assessment — Clause 6.1 risk & opportunity register",
                      "Internal Audits, Management Review & more (coming soon)",
                      "Setup wizard that personalizes all Isa responses to your org",
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-white/60">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/40" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Link href="/iso-manager">
                      <button className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors" data-testid="link-iso-manager-from-disambig">
                        Explore ISO Manager Plans <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Try Isa Widget ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp}>
              <div className="relative rounded-3xl overflow-hidden border border-white/10 p-8 md:p-12"
                style={{ background: "linear-gradient(135deg, hsl(24,95%,18%) 0%, hsl(260,60%,18%) 50%, hsl(200,80%,12%) 100%)" }}>
                {/* decorative blobs */}
                <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-30"
                  style={{ background: "radial-gradient(circle, hsl(24,95%,53%) 0%, transparent 70%)" }} />
                <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-20"
                  style={{ background: "radial-gradient(circle, hsl(260,80%,65%) 0%, transparent 70%)" }} />
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 opacity-10"
                  style={{ background: "radial-gradient(ellipse, hsl(200,100%,70%) 0%, transparent 70%)" }} />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
                  {/* Left copy */}
                  <div className="md:w-72 shrink-0">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border"
                      style={{ background: "hsla(24,95%,53%,0.15)", borderColor: "hsla(24,95%,53%,0.4)", color: "hsl(24,95%,70%)" }}>
                      Try Free · No Card Required
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
                      Isa is{" "}
                      <span style={{ color: "hsl(24,95%,63%)" }}>the ISO Expert.</span>
                      <br />
                      <span className="text-2xl md:text-3xl font-bold text-white/80">Ask her anything — across her 7 covered standards.</span>
                    </h2>
                    <p className="text-white/60 text-sm leading-relaxed mb-5">
                      Isa doesn't just know the standards — she thinks like a 3rd party auditor. What most consultants charge hundreds per hour for, she answers in seconds. Three questions, free, no strings.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["ISO 9001","ISO 14001","ISO 45001","IATF 16949","AS9100","ISO 13485","ISO 27001"].map(s => (
                        <span key={s} className="text-[10px] font-bold px-2.5 py-1 rounded-lg border"
                          style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right widget */}
                  <div className="flex-1 min-w-0">
                    <TryCoreyChatWidget
                      compact
                      agentName="Isa"
                      agentSubtitle="Lead ISO Auditor · ISO 9001 · 14001 · 45001 · IATF 16949 · AS9100 · ISO 13485 · 27001"
                      agentImage={isaBotImg}
                      apiEndpoint="/api/landing-isa-bot"
                      chatPlaceholder="Ask Isa an ISO or audit question..."
                      upgradeText="Get Isa AI — $129/mo"
                      upgradeLink="/get-started"
                      upgradeDetails="Unlimited audits · IATF 16949 · Clause coverage · NC management · Gap analysis"
                      buttonClassName="bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,42%)]"
                      source="ask_isa_meetisa"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Pricing Section ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest whitespace-nowrap">AI Guidance Plans</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Isa */}
              <motion.div variants={fadeUp} data-testid="card-meet-isa-core">
                <div className="rounded-2xl overflow-hidden h-full flex flex-col bg-white/[0.06] border border-white/15">
                  <div className="h-1" style={{ background: ORANGE }} />
                  <div className="p-8 flex flex-col flex-1">
                    <div className="mb-6">
                      <p className="font-black text-white text-xl mb-1">Isa</p>
                      <p className="text-sm text-white/50">Core Standards · AI Guidance</p>
                    </div>
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black" style={{ color: ORANGE }}>$129</span>
                        <span className="text-white/40 font-medium">/mo</span>
                      </div>
                      <p className="text-xs text-white/30 mt-1">per month · cancel anytime</p>
                    </div>
                    <div className="mb-6">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-3">Standards Covered</p>
                      <div className="flex flex-wrap gap-2">
                        {ISA_STANDARDS_CORE.map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: ORANGE }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {[
                        "Clause-by-clause Q&A and interpretation",
                        "Audit readiness coaching (mock auditor questions)",
                        "Gap analysis via AI conversation",
                        "Nonconformance response coaching",
                        "Internal audit preparation guidance",
                        "Management review requirement explanation",
                      ].map(cap => (
                        <li key={cap} className="flex items-start gap-2.5 text-sm text-white/70">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ORANGE }} />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/settings">
                      <Button className="w-full font-bold text-white hover:opacity-90 transition-opacity" style={{ background: ORANGE }} data-testid="button-get-isa">
                        Get Isa — $129/mo
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Isa Pro */}
              <motion.div variants={fadeUp} data-testid="card-meet-isa-pro">
                <div className="rounded-2xl overflow-hidden h-full flex flex-col border-2" style={{ background: "linear-gradient(160deg, hsl(222,47%,13%) 0%, hsl(222,47%,10%) 100%)", borderColor: `hsl(24,95%,53%,0.45)`, boxShadow: `0 0 40px hsl(24,95%,53%,0.1)` }}>
                  <div className="h-1" style={{ background: `linear-gradient(90deg, ${ORANGE}, hsl(24,95%,70%))` }} />
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="font-black text-white text-xl mb-1">Isa Pro</p>
                        <p className="text-sm text-white/50">All 7 Standards · Full AI Coverage</p>
                      </div>
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-full text-white whitespace-nowrap" style={{ background: ORANGE }}>ALL 7 STANDARDS</span>
                    </div>
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black" style={{ color: ORANGE }}>$249</span>
                        <span className="text-white/40 font-medium">/mo</span>
                      </div>
                      <p className="text-xs text-white/30 mt-1">per month · cancel anytime</p>
                    </div>
                    <div className="mb-6">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mb-3">All Standards Covered</p>
                      <div className="flex flex-wrap gap-2">
                        {ISA_STANDARDS_CORE.map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-lg font-bold text-white" style={{ background: ORANGE }}>{s}</span>
                        ))}
                        {ISA_STANDARDS_PRO.map(s => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-lg font-bold bg-white text-gray-900">{s}</span>
                        ))}
                      </div>
                    </div>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {[
                        "Everything in Isa",
                        "IATF 16949 automotive quality guidance",
                        "ISO 13485 medical device regulatory interpretation",
                        "ISO/IEC 27001 information security risk guidance",
                        "AS9100 Rev D aerospace compliance analysis",
                        "Cross-standard regulatory harmonization",
                        "Specialist industry scenario guidance",
                      ].map(cap => (
                        <li key={cap} className="flex items-start gap-2.5 text-sm text-white/70">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ORANGE }} />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/settings">
                      <Button className="w-full font-bold text-white hover:opacity-90 transition-opacity" style={{ background: ORANGE }} data-testid="button-get-isa-pro">
                        Get Isa Pro — $249/mo
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bundle Callout */}
            <motion.div variants={fadeUp} className="mb-4" data-testid="card-bundle-corey-isa">
              <div className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6" style={{ background: "linear-gradient(135deg, hsl(24,95%,53%,0.12) 0%, hsl(24,95%,53%,0.04) 100%)", border: `1px solid hsl(24,95%,53%,0.35)` }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: ORANGE }}>Save $49/mo · $588/yr</span>
                  </div>
                  <p className="font-black text-white text-lg mb-1">The Dual AI Advisor Bundle</p>
                  <p className="text-sm text-white/65 leading-relaxed">
                    Get both <strong className="text-white/90">Corey</strong> (OSHA · DOT · Safety) and{" "}
                    <strong className="text-white/90">Isa</strong> (ISO 9001 · 14001 · 45001) for one price.
                    Individually $198/mo — together <strong style={{ color: ORANGE }}>$149/mo</strong>.
                  </p>
                </div>
                <Link href="/settings" className="shrink-0">
                  <Button className="font-bold text-white gap-2 px-6 hover:opacity-90 transition-opacity" style={{ background: ORANGE }} data-testid="button-get-bundle">
                    Get the Bundle <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* ISO Manager Reference */}
            <motion.div variants={fadeUp}>
              <div className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 bg-white/[0.04] border border-white/12">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>Also available with ISO Manager</p>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Isa is included with all ISO Manager subscriptions. If you're ready to build and manage your full management system across all 8 modules — Documentation, NC & CAPA, Risk Assessment, Internal Audits, and more — explore the ISO Manager platform.
                  </p>
                </div>
                <Link href="/iso-manager" className="shrink-0">
                  <button className="flex items-center gap-1.5 text-sm font-bold text-white/60 hover:text-white transition-colors whitespace-nowrap" data-testid="link-iso-manager-plans">
                    See ISO Manager Plans <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </motion.div>

          {/* ── FAQ ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 mb-4">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Common Questions</h2>
            </motion.div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full text-left p-5 rounded-xl bg-white/[0.05] border border-white/10 hover:border-white/20 transition-colors"
                    data-testid={`faq-isa-${i}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-semibold text-white">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
                    </div>
                    {expandedFaq === i && (
                      <p className="mt-4 text-sm text-white/60 leading-relaxed">{faq.a}</p>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Final CTA ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="text-center relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, hsl(24,95%,53%,0.08) 0%, transparent 70%)" }} />
            </div>
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-white/20" style={{ background: `hsl(24,95%,53%,0.15)` }}>
                <Star className="w-8 h-8" style={{ color: ORANGE }} />
              </div>
              <div className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white mb-4" style={{ background: ORANGE }}>
                $129/mo · cancel anytime
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Ready to Meet Your New <span style={{ color: ORANGE }}>ISO Auditor?</span>
            </h2>
            <p className="text-lg text-white/55 mb-8 max-w-2xl mx-auto">
              Stop guessing at clause interpretations. Stop scrambling before audits. Isa is ready — 24/7, instant, and built from the perspective of a certified 3rd party auditor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/settings">
                <Button size="lg" className="font-bold text-white px-10 py-6 text-lg gap-2 hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)` }} data-testid="button-cta-get-isa">
                  <Sparkles className="w-5 h-5" />
                  Get Isa — $129/mo
                </Button>
              </Link>
              <Link href="/iso-manager">
                <Button size="lg" className="bg-white/10 border-2 border-white/25 text-white font-bold px-10 py-6 text-lg gap-2 hover:bg-white/15 transition-all" data-testid="button-cta-iso-manager">
                  Explore ISO Manager
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* ── Footer ── */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={acsiLogo} alt="ACSI" style={{ height: "24px", filter: "brightness(0) invert(1)", opacity: 0.5 }} />
              <span className="text-sm text-white/40">ACSI ISO Manager</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-white/40 hover:text-white/60 transition-colors">Home</Link>
              <Link href="/iso-manager" className="text-sm text-white/40 hover:text-white/60 transition-colors">ISO Manager</Link>
              <Link href="/meet-corey" className="text-sm text-white/40 hover:text-white/60 transition-colors">Meet Corey</Link>
              <Link href="/cesar" className="text-sm text-white/40 hover:text-white/60 transition-colors">CESAR</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
