import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle2, ArrowLeft, ChevronRight, Sparkles, Zap, Shield,
  FileCheck, ClipboardList, BookOpen, MessageSquare, BarChart3, Award,
} from "lucide-react";
import acsiLogo from "@assets/42_1772589582132.png";

const ISA_CAPABILITIES = [
  "Clause-by-clause gap analysis",
  "Internal audit checklists",
  "Corrective action guidance",
  "Quality manual drafting",
  "Management review prep",
  "Audit finding responses",
];

const ISA_PRO_CAPABILITIES = [
  "Everything in Isa",
  "IATF 16949 internal auditing",
  "ISO 13485 medical device",
  "ISO/IEC 27001 InfoSec",
  "AS9100 aerospace auditing",
  "Second-party audit support",
];

const ISA_STANDARDS = ["ISO 9001", "ISO 14001", "ISO 45001"];
const ISA_PRO_STANDARDS = ["ISO 9001", "ISO 14001", "ISO 45001", "IATF 16949", "AS9100", "ISO 13485", "ISO 27001"];

const STATS = [
  { value: "7", label: "ISO Standards" },
  { value: "100+", label: "Audit Checklists" },
  { value: "24/7", label: "Expert Access" },
  { value: "0", label: "Scheduling Required" },
];

const ISA_FEATURES = [
  {
    icon: Sparkles,
    title: "Thinks Like an Auditor",
    body: "Isa cites exact clause numbers, not general advice. She asks the questions a real auditor would ask.",
  },
  {
    icon: Shield,
    title: "Objective Evidence Language",
    body: "Isa identifies gaps the way a third-party auditor documents them — traceable, defensible, audit-ready.",
  },
  {
    icon: Zap,
    title: "Assessment to Certification",
    body: "From initial gap analysis through internal audit, Isa guides your team at every stage of the certification journey.",
  },
];

const WHAT_ISA_DOES = [
  { icon: FileCheck, label: "Gap Analysis" },
  { icon: ClipboardList, label: "Audit Checklists" },
  { icon: BookOpen, label: "Manual Drafting" },
  { icon: MessageSquare, label: "Corrective Actions" },
  { icon: BarChart3, label: "Management Review" },
  { icon: Award, label: "Certification Prep" },
];

const ORANGE = "hsl(24,95%,53%)";
const ORANGE_DARK = "hsl(24,95%,42%)";
const DARK_BG = "hsl(222,47%,8%)";

export default function MeetIsa() {
  return (
    <div className="min-h-screen overflow-x-hidden" data-testid="page-meet-isa">

      {/* ════════════════════════════════════════
          WHITE TOP SECTION  (nav + hero + stats)
      ════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-white">

        {/* Subtle orange wash top-right */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[100px]"
          style={{ background: ORANGE }}
        />
        {/* Light gray grid texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* ── Nav ── */}
        <nav className="relative z-10 border-b border-black/8 px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <button
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
              data-testid="link-back-home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to CCHUB
            </button>
          </Link>
          <img
            src={acsiLogo}
            alt="ACSI"
            style={{ height: "36px", mixBlendMode: "multiply" }}
          />
        </nav>

        {/* ── Hero ── */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-10 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Logo — multiply blend drops the black background on white */}
            <div className="flex justify-center mb-4">
              <img
                src={acsiLogo}
                alt="ACSI"
                style={{ width: "180px", mixBlendMode: "multiply" }}
              />
            </div>

            {/* Pill badge */}
            <div className="flex justify-center mb-5">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                style={{ background: "linear-gradient(90deg, #111 0%, #333 100%)" }}
              >
                ACSI ISO Manager · AI Guidance
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4 text-gray-900 leading-none">
              Meet{" "}
              <span style={{ color: ORANGE }}>Isa</span>
            </h1>

            {/* Sub */}
            <p className="text-lg font-semibold text-gray-600 mb-4">
              Lead ISO Auditor AI — built from the DNA of 7 ISO standards
            </p>
            <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
              Isa thinks like an auditor, not a search engine. She cites clause numbers, identifies gaps with
              objective evidence language, and guides teams from assessment through certification.
            </p>

            {/* Standard badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {["ISO 9001", "ISO 14001", "ISO 45001", "IATF 16949", "AS9100", "ISO 13485", "ISO 27001"].map((s) => (
                <span
                  key={s}
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "#111", color: "#fff" }}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/settings">
                <Button
                  className="font-bold text-white px-8 py-5 text-base shadow-lg hover:opacity-90 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)` }}
                  data-testid="button-hero-get-isa"
                >
                  Get Started with Isa
                </Button>
              </Link>
              <Link href="/iso-manager">
                <Button
                  variant="outline"
                  className="font-bold px-8 py-5 text-base border-2 border-gray-900 text-gray-900 bg-transparent hover:bg-gray-900 hover:text-white transition-all"
                  data-testid="button-hero-iso-manager"
                >
                  See Full ISO Manager
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ── Stats bar — white bg, orange numbers, black labels ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative z-10 border-t border-black/8"
          style={{ background: "#111" }}
        >
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {STATS.map((s, i) => (
              <div key={s.label} className="py-5 text-center" data-testid={`stat-isa-${i}`}>
                <p className="text-2xl font-black text-white mb-0.5" style={{ color: ORANGE }}>{s.value}</p>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════
          DARK BOTTOM SECTION
      ════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, hsl(222,47%,9%) 0%, hsl(222,60%,6%) 100%)", color: "white" }}
      >
        {/* Subtle glow */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06] blur-[100px]"
          style={{ background: ORANGE }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">

          {/* ── Feature Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16"
          >
            {ISA_FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{
                  background: "linear-gradient(145deg, hsl(222,47%,13%) 0%, hsl(222,47%,10%) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                data-testid={`card-feature-isa-${i}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "hsl(24,95%,53%,0.12)", border: "1px solid hsl(24,95%,53%,0.25)" }}
                >
                  <f.icon className="w-5 h-5" style={{ color: ORANGE }} />
                </div>
                <p className="font-black text-white text-sm mb-2">{f.title}</p>
                <p className="text-sm text-white/60 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </motion.div>

          {/* ── What Isa Handles ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-16"
          >
            <p className="text-center text-xs font-bold text-white/35 uppercase tracking-widest mb-6">
              What Isa Handles
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {WHAT_ISA_DOES.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-xl py-4 px-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <item.icon className="w-5 h-5" style={{ color: ORANGE }} />
                  <span className="text-[11px] font-semibold text-white/60 text-center leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Section Divider ── */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">AI Guidance Plans</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* ── Product Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

            {/* Isa */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              data-testid="card-meet-isa-core"
            >
              <div
                className="rounded-2xl overflow-hidden h-full flex flex-col"
                style={{
                  background: "linear-gradient(160deg, hsl(222,47%,13%) 0%, hsl(222,47%,10%) 100%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div className="h-1" style={{ background: ORANGE }} />
                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6">
                    <p className="font-black text-white text-xl mb-1">Isa</p>
                    <p className="text-sm text-white/50">Core Standards · AI Guidance</p>
                  </div>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black" style={{ color: ORANGE }}>$99</span>
                      <span className="text-white/40 font-medium">/mo</span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">per month · cancel anytime</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-white/35 uppercase tracking-wide mb-3">Standards Covered</p>
                    <div className="flex flex-wrap gap-2">
                      {ISA_STANDARDS.map(s => (
                        <span
                          key={s}
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold text-white/75"
                          style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {ISA_CAPABILITIES.map(cap => (
                      <li key={cap} className="flex items-start gap-2.5 text-sm text-white/65">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ORANGE }} />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/settings">
                    <Button
                      className="w-full font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ background: ORANGE }}
                      data-testid="button-get-isa"
                    >
                      Get Isa
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Isa Pro */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              data-testid="card-meet-isa-pro"
            >
              <div
                className="rounded-2xl overflow-hidden h-full flex flex-col"
                style={{
                  background: "linear-gradient(160deg, hsl(222,47%,15%) 0%, hsl(222,47%,11%) 100%)",
                  border: `2px solid hsl(24,95%,53%,0.4)`,
                  boxShadow: `0 0 40px hsl(24,95%,53%,0.08)`,
                }}
              >
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${ORANGE}, hsl(24,95%,70%))` }} />
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="font-black text-white text-xl mb-1">Isa Pro</p>
                      <p className="text-sm text-white/50">All 7 Standards · Full AI Coverage</p>
                    </div>
                    <span
                      className="text-[9px] font-bold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
                      style={{ background: ORANGE }}
                    >
                      ALL 7 STANDARDS
                    </span>
                  </div>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black" style={{ color: ORANGE }}>$199</span>
                      <span className="text-white/40 font-medium">/mo</span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">per month · cancel anytime</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-white/35 uppercase tracking-wide mb-3">All Standards Covered</p>
                    <div className="flex flex-wrap gap-2">
                      {ISA_PRO_STANDARDS.map(s => (
                        <span
                          key={s}
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                          style={{
                            border: "1px solid hsl(24,95%,53%,0.35)",
                            background: "hsl(24,95%,53%,0.1)",
                            color: "hsl(24,95%,75%)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {ISA_PRO_CAPABILITIES.map(cap => (
                      <li key={cap} className="flex items-start gap-2.5 text-sm text-white/65">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ORANGE }} />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/settings">
                    <Button
                      className="w-full font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ background: ORANGE }}
                      data-testid="button-get-isa-pro"
                    >
                      Get Isa Pro
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Bundle Callout ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            className="mb-6"
            data-testid="card-bundle-corey-isa"
          >
            <div
              className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6"
              style={{
                background: "linear-gradient(135deg, hsl(24,95%,53%,0.12) 0%, hsl(24,95%,53%,0.04) 100%)",
                border: "1px solid hsl(24,95%,53%,0.35)",
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ background: ORANGE }}
                  >
                    Save $49/mo · $588/yr
                  </span>
                </div>
                <p className="font-black text-white text-lg mb-1">The Dual AI Advisor Bundle</p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Get both <strong className="text-white/85">Corey</strong> (OSHA · DOT · Safety) and{" "}
                  <strong className="text-white/85">Isa</strong> (ISO 9001 · 14001 · 45001) for one price.
                  Individually $198/mo — together{" "}
                  <strong style={{ color: ORANGE }}>$149/mo</strong>.
                </p>
              </div>
              <Link href="/settings" className="shrink-0">
                <Button
                  className="font-bold text-white gap-2 px-6 hover:opacity-90 transition-opacity"
                  style={{ background: ORANGE }}
                  data-testid="button-get-bundle"
                >
                  Get the Bundle <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* ── ISO Manager Reference ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
            className="mb-16"
          >
            <div
              className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6"
              style={{
                background: "linear-gradient(145deg, hsl(222,47%,13%) 0%, hsl(222,47%,10%) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: ORANGE }}>
                  Also available with ISO Manager
                </p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Isa is included with all ISO Manager subscriptions. If you're ready to build and manage your full
                  management system — documentation, vault, KPI tracking — explore the ISO Manager.
                </p>
              </div>
              <Link href="/iso-manager" className="shrink-0">
                <button
                  className="flex items-center gap-1.5 text-sm font-bold text-white/60 hover:text-white transition-colors"
                  data-testid="link-iso-manager-plans"
                >
                  See ISO Manager Plans <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* ── Footer ── */}
          <p className="text-center text-xs text-white/30 pb-8">
            Isa is an ACSI product. For OSHA & safety compliance, see{" "}
            <Link href="/meet-corey">
              <span className="underline hover:text-white/60 transition-colors cursor-pointer">Corey on CCHUB</span>
            </Link>.
          </p>

        </div>
      </div>
    </div>
  );
}
