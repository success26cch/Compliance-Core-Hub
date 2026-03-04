import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  CheckCircle2, ArrowLeft, ChevronRight, Sparkles, Zap, Shield,
} from "lucide-react";
import acsiLogo from "@assets/Transp1_1768928785892.png";

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

const ISA_FEATURES = [
  { icon: Sparkles, title: "Thinks Like an Auditor", body: "Isa cites exact clause numbers, not general advice. She asks the questions a real auditor would ask." },
  { icon: Shield, title: "Objective Evidence Language", body: "Isa identifies gaps the way a third-party auditor documents them — traceable, defensible, audit-ready." },
  { icon: Zap, title: "Assessment to Certification", body: "From initial gap analysis through internal audit, Isa guides your team at every stage of the certification journey." },
];

export default function MeetIsa() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "hsl(222,47%,7%)", color: "white" }}
      data-testid="page-meet-isa"
    >
      {/* ── Minimal Nav ── */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to CCHUB
          </button>
        </Link>
        <img src={acsiLogo} alt="ACSI" className="h-8 object-contain" />
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <img src={acsiLogo} alt="ACSI" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs text-white/60 font-semibold uppercase tracking-widest mb-5">
            ACSI ISO Manager · AI Guidance
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">Meet Isa</h1>
          <p className="text-lg text-white/50 font-medium mb-6">
            Lead ISO Auditor AI — built from the DNA of 7 ISO standards
          </p>
          <p className="text-base text-white/40 max-w-2xl mx-auto leading-relaxed">
            Isa thinks like an auditor, not a search engine. She cites clause numbers, identifies gaps with
            objective evidence language, and guides teams from assessment through certification.
          </p>
        </motion.div>

        {/* ── Feature strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16"
        >
          {ISA_FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              data-testid={`card-feature-isa-${i}`}
            >
              <div className="w-9 h-9 rounded-xl bg-[hsl(24,95%,53%)]/10 border border-[hsl(24,95%,53%)]/20 flex items-center justify-center mb-4">
                <f.icon className="w-4.5 h-4.5" style={{ color: "hsl(24,95%,53%)" }} />
              </div>
              <p className="font-black text-white text-sm mb-1.5">{f.title}</p>
              <p className="text-xs text-white/40 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Product Cards ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">AI Guidance Plans</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Isa */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              data-testid="card-meet-isa-core"
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden h-full flex flex-col">
                <div className="h-1 bg-[hsl(24,95%,53%)]" />
                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6">
                    <p className="font-black text-white text-xl mb-1">Isa</p>
                    <p className="text-sm text-white/40">Core Standards · AI Guidance</p>
                  </div>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black" style={{ color: "hsl(24,95%,53%)" }}>$99</span>
                      <span className="text-white/40 font-medium">/mo</span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">per month · cancel anytime</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide mb-3">Standards Covered</p>
                    <div className="flex flex-wrap gap-2">
                      {ISA_STANDARDS.map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-white/70 font-semibold">{s}</span>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {ISA_CAPABILITIES.map(cap => (
                      <li key={cap} className="flex items-start gap-2.5 text-sm text-white/50">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(24,95%,53%)" }} />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/settings">
                    <Button
                      className="w-full font-bold text-white"
                      style={{ background: "hsl(24,95%,53%)" }}
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
              transition={{ delay: 0.28 }}
              data-testid="card-meet-isa-pro"
            >
              <div className="rounded-2xl border-2 overflow-hidden h-full flex flex-col" style={{ borderColor: "hsl(24,95%,53%,0.4)" }}>
                <div className="h-1" style={{ background: "hsl(24,95%,53%)" }} />
                <div className="p-8 flex flex-col flex-1" style={{ background: "hsl(222,47%,10%)" }}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="font-black text-white text-xl mb-1">Isa Pro</p>
                      <p className="text-sm text-white/40">All 7 Standards · Full AI Coverage</p>
                    </div>
                    <span
                      className="text-[9px] font-bold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
                      style={{ background: "hsl(24,95%,53%)" }}
                    >
                      ALL 7 STANDARDS
                    </span>
                  </div>
                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black" style={{ color: "hsl(24,95%,53%)" }}>$199</span>
                      <span className="text-white/40 font-medium">/mo</span>
                    </div>
                    <p className="text-xs text-white/30 mt-1">per month · cancel anytime</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wide mb-3">All Standards Covered</p>
                    <div className="flex flex-wrap gap-2">
                      {ISA_PRO_STANDARDS.map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-lg border font-semibold" style={{ borderColor: "hsl(24,95%,53%,0.3)", background: "hsl(24,95%,53%,0.1)", color: "hsl(24,95%,70%)" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {ISA_PRO_CAPABILITIES.map(cap => (
                      <li key={cap} className="flex items-start gap-2.5 text-sm text-white/50">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(24,95%,53%)" }} />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/settings">
                    <Button
                      className="w-full font-bold text-white"
                      style={{ background: "hsl(24,95%,53%)" }}
                      data-testid="button-get-isa-pro"
                    >
                      Get Isa Pro
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Bundle Callout ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6"
          data-testid="card-bundle-corey-isa"
        >
          <div className="rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center gap-6" style={{ borderColor: "hsl(24,95%,53%,0.35)", background: "hsl(24,95%,53%,0.05)" }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "hsl(24,95%,53%)" }}>Save $49/mo · $588/yr</span>
              </div>
              <p className="font-black text-white text-lg mb-1">The Dual AI Advisor Bundle</p>
              <p className="text-sm text-white/40 leading-relaxed">
                Get both <strong className="text-white/70">Corey</strong> (OSHA · DOT · Safety) and <strong className="text-white/70">Isa</strong> (ISO 9001 · 14001 · 45001) for one price.
                Individually $198/mo — together <strong style={{ color: "hsl(24,95%,53%)" }}>$149/mo</strong>.
              </p>
            </div>
            <Link href="/settings" className="shrink-0">
              <Button
                className="font-bold text-white gap-2 px-6"
                style={{ background: "hsl(24,95%,53%)" }}
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
          transition={{ delay: 0.42 }}
          className="mb-16"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-2">Also available with ISO Manager</p>
              <p className="text-sm text-white/50 leading-relaxed">
                Isa is included with all ISO Manager subscriptions. If you're ready to build and manage your full management
                system — documentation, vault, KPI tracking — explore the ISO Manager.
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

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-white/25 pb-8">
          Isa is an ACSI product. For OSHA & safety compliance, see{" "}
          <Link href="/meet-corey">
            <span className="underline hover:text-white/50 transition-colors cursor-pointer">Corey on CCHUB</span>
          </Link>.
        </p>

      </div>
    </div>
  );
}
