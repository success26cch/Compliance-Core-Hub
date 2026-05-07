import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight,
  Droplets, Wind, Flame, Recycle, Factory, BarChart3,
  ClipboardList, Bell, FileText, ChevronDown, Zap, Lock
} from "lucide-react";
import TryCoreyChatWidget from "@/components/TryCoreyChatWidget";
import { useState } from "react";
import logoUrl from "@assets/7_1772719327857.png";

const PAIN_POINTS = [
  {
    icon: ClipboardList,
    title: "Audit-Ready or Audit-Bait?",
    body: "EPA and state inspectors don't announce visits. If your Universal Waste logs, manifests, or SPCC plan aren't current, you're writing a check. Violations start at $25,000 per day per violation.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: Recycle,
    title: "The 45-Day Manifest Trap",
    body: "Shipped hazardous waste but never got the signed manifest back from your TSDF? After 45 days you're required to file an Exception Report with the EPA. Most facilities miss this entirely.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: Droplets,
    title: "SPCC Plans Left on a Shelf",
    body: "An SPCC plan that hasn't been reviewed, re-certified, or updated after a facility change isn't compliance — it's a liability. The 5-year review requirement is one of the most commonly cited violations.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Wind,
    title: "Quarterly Stormwater — Every Quarter",
    body: "NPDES industrial permits require quarterly visual monitoring of outfalls during rain events. Missing even one quarter is a permit violation. Most facilities can't prove they did any of them.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
];

const MODULES = [
  {
    icon: Recycle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    title: "Universal Waste",
    subtitle: "40 CFR Part 273",
    features: [
      "Container tracking: Batteries, Lamps, Pesticides, Mercury, Aerosols",
      "Storage deadline management per container",
      "Escalating expiration alerts as deadlines approach",
      "Aerosol cans included (added to federal UW list 2019)",
    ],
  },
  {
    icon: Flame,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    title: "Hazardous Waste (RCRA)",
    subtitle: "40 CFR Parts 260–270",
    features: [
      "Satellite Accumulation Point (SAP) weekly inspection records",
      "Manifest tracking with unsigned manifest alerts",
      "Generator status determination based on your monthly waste volumes",
      "Accumulation deadline tracking for all generator categories",
    ],
  },
  {
    icon: Droplets,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "SPCC / Oil Spill Prevention",
    subtitle: "40 CFR Part 112",
    features: [
      "Tank & secondary containment inspection checklists",
      "Monthly and annual inspection scheduling",
      "5-year plan re-certification reminders",
      "Spill kit readiness tracking across your facility",
    ],
  },
  {
    icon: CloudRain,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    title: "Stormwater / SWPPP",
    subtitle: "NPDES / 40 CFR Part 122",
    features: [
      "Quarterly visual outfall monitoring records",
      "Rain event observation documentation",
      "BMP maintenance scheduling and records",
      "Corrective action documentation for sampling exceedances",
    ],
  },
  {
    icon: Wind,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    title: "Air Quality / CAA",
    subtitle: "40 CFR Parts 51–71",
    features: [
      "Permit registry for all source categories (Title V, Minor, State)",
      "Renewal reminders as permit expiration dates approach",
      "Method 9 Visible Emissions (Opacity) log",
      "Stack & dust collector inspection records",
    ],
  },
];

function CloudRain(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/>
      <line x1="8" y1="19" x2="8" y2="21"/>
      <line x1="8" y1="13" x2="8" y2="15"/>
      <line x1="12" y1="15" x2="12" y2="17"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="16" y1="17" x2="16" y2="19"/>
    </svg>
  );
}

export default function EnvComplianceHub() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
        body: JSON.stringify({ name: leadName.trim(), email: leadEmail.trim(), source: "env_hub" }),
      });
      setLeadSubmitted(true);
    } catch {
    } finally {
      setLeadSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "Who needs the Environmental Compliance Hub?",
      a: "Any facility subject to EPA regulations — manufacturing plants, metal finishers, auto shops, chemical processors, warehouses with fuel storage, or any business generating hazardous waste. If you have storage tanks, stacks, floor drains going to a retention pond, or throw away fluorescent bulbs and batteries, you have environmental compliance obligations.",
    },
    {
      q: "What's the difference between Universal Waste and Hazardous Waste?",
      a: "Universal Waste (batteries, bulbs, pesticides, mercury devices, aerosol cans) follows streamlined management rules under 40 CFR Part 273 — less paperwork, no manifest required, 1-year storage limit. Hazardous Waste under RCRA follows full cradle-to-grave requirements including manifests, generator status rules, and accumulation time limits.",
    },
    {
      q: "Does this replace our SPCC plan or SWPPP?",
      a: "No — those plans must still be developed by a Registered Professional Engineer (for SPCC) or a qualified person (SWPPP). The Hub gives you the digital tools to manage inspections, log monitoring events, track review deadlines, and maintain the audit trail that demonstrates your plan is being implemented.",
    },
    {
      q: "How does Corey help with environmental compliance?",
      a: "Corey is trained on CFR 40 (EPA regulations) and OSHA standards. Within each module you can ask Corey state-specific questions like 'How do I label a 55-gallon drum of used coolant in Michigan?' or 'What are my notification requirements after a spill?' and get regulation-backed, cited answers instantly.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/">
          <img src={logoUrl} alt="CCHUB" className="h-20 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-6 text-xs px-3 py-1">
          EPA Compliance Platform
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-white">
          Environmental Compliance,{" "}
          <span className="text-emerald-400">Audit-Ready</span>
          <br />Every Single Day
        </h1>
        <p className="text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
          The first EHS platform built specifically for the cradle-to-grave compliance demands of EPA-regulated facilities. Universal Waste. RCRA. SPCC. Stormwater. Air Quality. One hub, zero excuses.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 gap-2">
              Access the Hub <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 px-8">
              Request a Demo
            </Button>
          </Link>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 border border-white/10 rounded-2xl p-6 bg-white/5">
          {[
            { value: "$25K+", label: "Per-day EPA violation fine" },
            { value: "45 days", label: "Manifest return window" },
            { value: "5 years", label: "SPCC re-certification cycle" },
            { value: "4x/year", label: "Required stormwater monitoring" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-emerald-400">{s.value}</div>
              <div className="text-sm text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pain Points */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Why Environmental Compliance Fails</h2>
          <p className="text-white/50 max-w-2xl mx-auto">These aren't hypothetical risks — they're the exact citations showing up on EPA inspection reports.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {PAIN_POINTS.map((p) => (
            <div key={p.title} className={`rounded-xl border border-white/10 p-6 ${p.bg}`}>
              <div className={`w-10 h-10 rounded-lg ${p.bg} flex items-center justify-center mb-4`}>
                <p.icon className={`w-5 h-5 ${p.color}`} />
              </div>
              <h3 className={`font-bold text-lg mb-2 ${p.color}`}>{p.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <Badge className="bg-white/10 text-white/60 border-white/20 mb-4 text-xs">5 Compliance Modules</Badge>
          <h2 className="text-3xl font-bold mb-3">Everything Your Facility Needs</h2>
          <p className="text-white/50 max-w-2xl mx-auto">Each module is built around the specific CFR requirements auditors actually check — not generic checklists.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((m) => (
            <div key={m.title} className={`rounded-xl border ${m.border} bg-white/5 p-6`}>
              <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center mb-3`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div className="mb-1">
                <span className="font-bold text-base">{m.title}</span>
                <span className={`ml-2 text-xs font-mono ${m.color} opacity-70`}>{m.subtitle}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {m.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                    <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${m.color}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Corey card */}
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div className="font-bold text-base mb-1">Ask Corey — AI Intelligence Layer</div>
            <p className="text-sm text-white/60 mb-3">Corey is trained on CFR 40 and brings regulatory answers directly into each module.</p>
            <ul className="space-y-2">
              {[
                "State-specific EPA requirement guidance",
                "Labeling, storage & accumulation rules",
                "Spill reporting thresholds by chemical",
                "Permit condition interpretation",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ask Corey — Env */}
      <section className="py-20 bg-[hsl(222,47%,9%)]" data-testid="section-env-ask-corey">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
              Live Demo
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Corey Knows EPA Regs — <span className="text-emerald-400">Ask Him Anything</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              RCRA hazardous waste, SPCC spill plans, SWPPP stormwater, Universal Waste, CAA air permits — 3 free questions, no credit card required.
            </p>
          </div>
          <TryCoreyChatWidget compact theme="emerald" source="ask_corey_env" />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Common Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-white/60 text-sm leading-relaxed border-t border-white/10 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-500/20 rounded-2xl p-12">
          <Leaf className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Stop Guessing. Start Complying.</h2>
          <p className="text-white/60 max-w-xl mx-auto mb-8">
            Join the EHS professionals using the Environmental Compliance Hub to stay audit-ready, 365 days a year.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 gap-2">
                Access the Hub <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 px-10">
                Talk to Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LEAD CAPTURE ──────────────────────────────────────────────────── */}
      <section className="py-14 px-6 border-t border-white/10 bg-[#0f1a0e]">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white">Stay ahead of EPA changes</h3>
          <p className="text-white/50 text-sm">Get environmental compliance tips and be first to know about new modules — no spam, unsubscribe anytime.</p>
          {leadSubmitted ? (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> You're on the list — thanks!
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={leadName}
                onChange={e => setLeadName(e.target.value)}
                required
                data-testid="input-env-lead-name"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <input
                type="email"
                placeholder="Work email"
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
                required
                data-testid="input-env-lead-email"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <Button type="submit" disabled={leadSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shrink-0" data-testid="button-env-lead-submit">
                {leadSubmitting ? "..." : "Subscribe"}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} Core Compliance Hub · Environmental Compliance Platform ·{" "}
        <Link href="/privacy-policy" className="hover:text-white/60 underline">Privacy</Link>
        {" · "}
        <Link href="/terms-of-service" className="hover:text-white/60 underline">Terms</Link>
      </footer>
    </div>
  );
}
