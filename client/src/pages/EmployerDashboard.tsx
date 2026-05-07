import { Link } from "wouter";
import { useState } from "react";
import {
  Shield, Users, AlertTriangle, CheckCircle2,
  FileWarning, Stethoscope, ClipboardList,
  MessageSquare, Calendar, GraduationCap,
  FileText, QrCode, Bot, ChevronRight, Zap, Target,
  Mail, Building2, ArrowUpRight, Award, Layers, Cpu,
  ShieldCheck, HeartPulse, Sparkles,
  Megaphone, Activity, BarChart3, Lock, CheckSquare,
  Star, Play, RefreshCw, Syringe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as WouterLink } from "wouter";

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO = {
  employees: 127,
  openActions: 3,
  isoReadiness: 73,
  teamMembers: 14,
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployerDashboard() {
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
        body: JSON.stringify({ name: leadName.trim(), email: leadEmail.trim(), source: "employer_dashboard" }),
      });
      setLeadSubmitted(true);
    } catch {
    } finally {
      setLeadSubmitting(false);
    }
  };

  const pipelineSteps = [
    {
      num: "01", icon: <ClipboardList className="w-6 h-6" />, color: "text-primary",
      bg: "bg-primary/10", border: "border-primary/20",
      title: "Log It or Not?", subtitle: "OSHA Recordability Decision Tree",
      desc: "5 questions. Instant answer. Corey tells you exactly whether the injury is OSHA recordable under 29 CFR 1904 — no guessing.",
      tag: "< 2 min",
    },
    {
      num: "02", icon: <FileWarning className="w-6 h-6" />, color: "text-accent",
      bg: "bg-accent/10", border: "border-accent/20",
      title: "Incident Report Filed", subtitle: "OSHA 300 Log Auto-Created",
      desc: "Full case documentation — body diagram, root cause, injury type, lost days, case outcome. Fed directly into your OSHA 300 report.",
      tag: "Auto-documented",
    },
    {
      num: "03", icon: <Target className="w-6 h-6" />, color: "text-orange-500",
      bg: "bg-orange-500/10", border: "border-orange-500/20",
      title: "CAPA Auto-Created", subtitle: "SMS Sent to Responsible Party",
      desc: "Corrective action fires automatically. Responsible party is assigned, due date is set, and an SMS notification goes out instantly.",
      tag: "SMS fired",
    },
    {
      num: "04", icon: <Mail className="w-6 h-6" />, color: "text-emerald-600",
      bg: "bg-emerald-500/10", border: "border-emerald-500/20",
      title: "Carrier Notified", subtitle: "Workers' Comp Email — Automatic",
      desc: "Workers' Comp carrier, DER, and company admins are emailed the moment the incident is logged. Before a claim even starts.",
      tag: "Zero manual emails",
    },
  ];

  const modules = [
    { title: "Corey AI", sub: "OSHA · DOT Compliance Expert", icon: <Bot className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", badge: "24/7 AI", desc: "Your senior occupational health and safety expert, available around the clock. Ask Corey any OSHA or DOT compliance question, draft policy documents on demand, run an audit prep session, or start your morning with a prioritized brief of everything that needs your attention." },
    { title: "Employee Management", sub: "Medical Surveillance", icon: <Users className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", badge: `${DEMO.employees} employees`, desc: "Keep every employee's compliance record current — DOT physicals, respirator clearances, drug screen results, and work restrictions all tracked in one place. Get ahead of expiring exams before they create regulatory exposure or put an employee behind the wheel out of compliance." },
    { title: "Incident Log", sub: "OSHA 300 Compliant", icon: <FileWarning className="w-5 h-5" />, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", badge: null, desc: "Document every workplace injury and illness with a complete OSHA-aligned case record — body diagram, injury classification, root cause, restricted days, and case outcome. Your OSHA 300 log builds itself as incidents are entered, and your workers' comp carrier is notified the same moment you hit submit." },
    { title: "CAPA Tracker", sub: "SMS Notifications", icon: <Target className="w-5 h-5" />, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", badge: `${DEMO.openActions} open`, desc: "Every incident or near-miss automatically generates a corrective action. Assign it, set a due date, and the system texts the responsible party. Overdue CAPAs surface in the Action Queue before they become repeat injuries — and effectiveness verification keeps the loop closed." },
    { title: "Team Hub", sub: "3-Tier Role System", icon: <Layers className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/20", badge: `${DEMO.teamMembers} members`, desc: "Invite your whole safety and operations team with role-based access built in. Admins see everything. Supervisors see their department. Members see only their own records. Medical details and restriction information are hidden by default — HIPAA-aware from the ground up." },
    { title: "Training Portal", sub: "LMS + Certificates", icon: <GraduationCap className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-600/10", border: "border-emerald-600/20", badge: null, desc: "Assign and track mandatory safety training across your workforce without spreadsheets. Video modules, knowledge quizzes, completion records, and printable certificates are all managed from a single admin dashboard — with employee-facing progress tracking built in." },
    { title: "ISO Manager", sub: "9001 · 14001 · 45001+", icon: <Award className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-600/10", border: "border-purple-600/20", badge: `${DEMO.isoReadiness}% ready`, desc: "A full ISO quality and safety management system powered by Isa AI — your on-demand Lead Auditor. Covers seven major standards with nonconformance tracking, CAPA workflows, a documentation library with clause mapping, and a 3-phase guided setup wizard to get your system audit-ready." },
    { title: "Digital Passport", sub: "QR Clinic Check-In", icon: <QrCode className="w-5 h-5" />, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", badge: null, desc: "Issue every employee a QR-code medical passport they present at any occupational health clinic visit. Authorization forms are signed digitally on arrival, the employer is notified automatically, and time-away tracking begins the moment they check in — no fax, no paperwork, no phone tag." },
    { title: "OSHA Decision Tree", sub: "Recordability Tool", icon: <ClipboardList className="w-5 h-5" />, color: "text-teal-600", bg: "bg-teal-600/10", border: "border-teal-600/20", badge: null, desc: "Five targeted questions walk you through 29 CFR 1904 step by step and return a clear, defensible recordability determination in under two minutes. Every answer shows the regulatory logic behind it — so you can explain your decision to an OSHA inspector with confidence." },
  ];

  const powerStats = [
    { value: "0", label: "Manual emails when an incident is logged", sub: "Workers' comp carrier, DER, and admins notified automatically" },
    { value: "< 2 min", label: "To determine OSHA recordability", sub: "vs. 30+ minutes of second-guessing and phone calls" },
    { value: "100%", label: "Of your OSHA 300 log entries documented", sub: "Body diagram, root cause, case outcome — all in one place" },
    { value: "23+", label: "Compliance document templates built in", sub: "LOTO programs, drug policies, emergency plans, and more" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">

      {/* ── TOP NAV ─────────────────────────────────────────────────────── */}
      <nav className="bg-[hsl(222,47%,11%)] sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 md:px-6">
          <Link href="/">
            <span className="text-white font-bold text-lg tracking-tight cursor-pointer hover:text-accent transition-colors">
              Core Compliance Hub
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/meet-corey">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 text-sm">
                Meet Corey
              </Button>
            </Link>
            <Link href="/get-started">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold gap-1.5">
                Get Started <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[hsl(222,47%,11%)] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/30">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">Employer Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight text-white">
              The Compliance Command Center
              <span className="block text-accent mt-1">Built for Employers</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              One dashboard runs your entire occupational health and safety program — OSHA recordkeeping,
              incident management, employee surveillance, CAPA tracking, and AI-powered guidance.
              All automated. All documented. All in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/get-started">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 text-base px-8 shadow-lg shadow-accent/30">
                  Get Your Dashboard <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 text-base">
                  <Calendar className="w-4 h-4" /> Schedule a Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/40">$599/mo · Employer Platform · All modules included</p>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="h-8 bg-background rounded-t-[40px]" />
      </section>

      {/* ── PLATFORM CAPABILITIES ─────────────────────────────────────────── */}
      <section className="bg-background px-4 md:px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="text-accent border-accent/30 mb-3">What's Inside</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Every Tool Your Program Needs</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">From your first incident report to your next OSHA inspection — everything is documented, tracked, and audit-ready.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: ShieldCheck, label: "Compliance Health Score", desc: "Continuously calculated safety posture score that updates as incidents are closed and actions are completed.", color: "text-green-600", bg: "bg-green-50 border-green-100" },
              { icon: AlertTriangle, label: "Incident Management", desc: "Structured injury and illness capture with automatic OSHA recordability determination at the point of entry.", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
              { icon: FileText, label: "OSHA 300 / 300A Log", desc: "Auto-populated from incident records. Always ready for OSHA inspection or required annual posting.", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
              { icon: ClipboardList, label: "CAPA Workflow", desc: "Root cause to corrective action to closure — with automated SMS reminders so nothing gets lost.", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
              { icon: Stethoscope, label: "Medical Surveillance", desc: "Track DOT physicals, respiratory exams, and occupational health visits across your entire workforce.", color: "text-teal-600", bg: "bg-teal-50 border-teal-100" },
              { icon: Syringe, label: "Drug Screen Tracking", desc: "Pre-employment, random, and post-accident results documented per employee with chain-of-custody support.", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
              { icon: Bot, label: "Ask Corey — AI Guidance", desc: "Your AI occupational health expert answers OSHA, FMCSA, and workplace safety questions in seconds.", color: "text-accent", bg: "bg-accent/5 border-accent/20" },
              { icon: GraduationCap, label: "Training Management", desc: "Assign required training, track completion, and maintain documented evidence per employee.", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-100" },
              { icon: Users, label: "Employee Records", desc: "Centralized employee profiles with medical, training, drug screen, and incident history in one place.", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
            ].map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className={`rounded-2xl border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${bg}`}>
                <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-white`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className={`text-base font-bold leading-tight mb-1 ${color}`}>{label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INCIDENT PIPELINE (DARK SECTION) ─────────────────────────────── */}
      <section className="bg-[#0f0f0f] py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/30 mb-3">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">Fully Automated</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">The Incident Pipeline</h2>
            <p className="text-white/60 mt-2 max-w-xl mx-auto">
              Decision → Documentation → Corrective Action → Carrier Notification.
              Four steps. Zero manual work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className={`p-5 rounded-xl border ${step.border} bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${step.bg} flex items-center justify-center`}>
                      <span className={step.color}>{step.icon}</span>
                    </div>
                    <span className={`text-3xl font-black ${step.color} opacity-20`}>{step.num}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${step.color}`}>{step.subtitle}</p>
                  <p className="text-xs text-white/50 mt-2 leading-relaxed">{step.desc}</p>
                  <div className={`inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-xs font-semibold ${step.bg} ${step.color}`}>
                    <CheckCircle2 className="w-3 h-3" />{step.tag}
                  </div>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-2.5 z-10 -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-lg">Your company can't afford to skip this.</p>
              <p className="text-white/50 text-sm mt-0.5">
                Every unlogged incident is OSHA exposure. Every missing CAPA is a repeat injury waiting to happen.
                Every late notification costs you money.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/decision-tree">
                <Button className="bg-white text-primary hover:bg-white/90 font-semibold gap-1.5">
                  <ClipboardList className="w-4 h-4" /> Try Decision Tree
                </Button>
              </Link>
              <Link href="/get-started">
                <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-1.5">
                  Get Started <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM HUB SECTION ─────────────────────────────────────────────── */}
      <section className="bg-background py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <Badge variant="outline" className="text-primary border-primary/30">Team Hub</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-primary leading-tight">
                Your Entire Workforce.<br />
                <span className="text-accent">One Platform.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Invite your safety team, supervisors, and managers. Each person sees exactly what
                they need — nothing more, nothing less. HIPAA-aware by design.
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Shield className="w-4 h-4 text-accent" />, title: "3-tier role system", desc: "Admins see everything. Supervisors see their department. Members see their own data." },
                  { icon: <Lock className="w-4 h-4 text-accent" />, title: "HIPAA-aware visibility", desc: "Medical details and restriction info are hidden by default — toggle on per department." },
                  { icon: <Megaphone className="w-4 h-4 text-accent" />, title: "Team announcements", desc: "Post compliance updates, policy changes, and safety alerts to your whole team." },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">{f.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Team Hub card */}
            <div>
              <Card className="border-primary/20 overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 px-5 pt-4 pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-primary">Team Hub</h3>
                        <p className="text-xs text-muted-foreground">Acme Industrial Corp</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary/30 text-xs">{DEMO.teamMembers} members</Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[{ val: 2, label: "Admins", color: "text-accent" }, { val: 5, label: "Supervisors", color: "text-primary" }, { val: 7, label: "Members", color: "text-muted-foreground" }].map((r, i) => (
                      <div key={i} className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/40">
                        <div className={`text-xl font-bold ${r.color}`}>{r.val}</div>
                        <div className="text-xs text-muted-foreground">{r.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {["Operations", "Maintenance", "Warehouse", "Logistics", "Admin"].map((dept) => (
                      <div key={dept} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{dept}</span>
                        </div>
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Active
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                    <div className="flex items-start gap-2">
                      <Megaphone className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary">Monthly Safety Reminder</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Forklift inspection logs due by end of month. Supervisors please confirm with your teams.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── POWER STATS (DARK) ───────────────────────────────────────────── */}
      <section className="bg-[hsl(222,47%,11%)] py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white">By the Numbers</h2>
            <p className="text-white/60 mt-2">What you get from day one</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {powerStats.map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black text-accent">{s.value}</div>
                <p className="text-sm font-bold text-white">{s.label}</p>
                <p className="text-xs text-white/40 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM MODULE GRID ─────────────────────────────────────────── */}
      <section className="bg-background py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="text-accent border-accent/30 mb-2">9 Modules Included</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-primary">Everything Your Program Needs</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Every module is included in your $599/mo Employer Platform subscription — nothing locked behind extra fees.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod, i) => (
              <div key={i} className={`group flex flex-col p-5 rounded-2xl border bg-white hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${mod.border}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl ${mod.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <span className={mod.color}>{mod.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-primary">{mod.title}</p>
                      {mod.badge && (
                        <Badge className={`text-xs px-1.5 py-0 h-4 ${mod.bg} ${mod.color} border-0`}>{mod.badge}</Badge>
                      )}
                    </div>
                    <p className={`text-xs font-semibold mt-0.5 ${mod.color}`}>{mod.sub}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW THE TIERS WORK ───────────────────────────────────────────── */}
      <section className="bg-[#faf9f7] py-16 px-4 md:px-6 border-y border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <Badge variant="outline" className="text-accent border-accent/30">Pricing Tiers</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-primary">How Every Tier Works</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              Pick the level your program needs today. Every tier is designed to work standalone
              or stack — you grow into what you need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

            {/* ── TIER 1: Corey AI Only ── */}
            <div className="flex flex-col rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-1.5 w-full bg-gradient-to-r from-accent to-orange-400" />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tier 1</p>
                    <h3 className="text-base font-black text-primary leading-tight">Corey AI Only</h3>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-black text-primary">$199</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Pure AI power. No dashboard. Ideal for small employers or solo safety managers who need a compliance expert on call 24/7 without the full platform overhead.
                </p>
                <div className="space-y-2 flex-1">
                  {[
                    { text: "Corey AI — unlimited questions", ok: true },
                    { text: "23+ document templates", ok: true },
                    { text: "OSHA decision tree (unlimited)", ok: true },
                    { text: "Emergency response guidance", ok: true },
                    { text: "Audit Mode & Team Meeting Mode", ok: true },
                    { text: "Employee & incident management", ok: false },
                    { text: "CAPA tracker + SMS notifications", ok: false },
                    { text: "Team Hub & multi-seat access", ok: false },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-2 text-sm ${item.ok ? 'text-primary' : 'text-muted-foreground/40 line-through'}`}>
                      {item.ok
                        ? <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20 shrink-0 mt-0.5" />
                      }
                      {item.text}
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <Link href="/meet-corey">
                    <Button variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent hover:text-white font-semibold">
                      Meet Corey
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── TIER 2: Employer Platform ── */}
            <div className="flex flex-col rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary to-blue-600" />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tier 2</p>
                    <h3 className="text-base font-black text-primary leading-tight">Employer Platform</h3>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-black text-primary">$599</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  The full compliance command center. All 9 modules, your whole team, and every workflow automated — without Corey AI. Great if your team already has expertise on staff.
                </p>
                <div className="space-y-2 flex-1">
                  {[
                    { text: "Full dashboard — all 9 modules", ok: true },
                    { text: "Employee & medical surveillance", ok: true },
                    { text: "Incident log + OSHA 300 auto-build", ok: true },
                    { text: "CAPA tracker with SMS notifications", ok: true },
                    { text: "Team Hub (5 seats included)", ok: true },
                    { text: "Training portal + certificates", ok: true },
                    { text: "Digital Passport (QR clinic check-in)", ok: true },
                    { text: "Corey AI add-on available (+$100)", ok: false },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-2 text-sm ${item.ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
                      {item.ok
                        ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      }
                      {item.text}
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <Link href="/get-started">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
                      Get the Platform
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── TIER 3: Employer Platform + Corey ── (BEST VALUE) */}
            <div className="flex flex-col rounded-2xl border-2 border-accent bg-white overflow-hidden shadow-lg relative">
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-accent text-white font-bold text-xs px-2 py-0.5">Best Value</Badge>
              </div>
              <div className="h-1.5 w-full bg-gradient-to-r from-accent via-orange-400 to-yellow-400" />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider">Tier 3 — Recommended</p>
                    <h3 className="text-base font-black text-primary leading-tight">Platform + Corey AI</h3>
                  </div>
                </div>
                <div className="mb-1">
                  <span className="text-3xl font-black text-primary">$699</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">+$129/mo per additional seat</p>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  The complete package. Everything in the Employer Platform plus Corey AI answering every compliance question, drafting every document, and briefing you every morning.
                </p>
                <div className="space-y-2 flex-1">
                  {[
                    { text: "Everything in Employer Platform", ok: true },
                    { text: "Corey AI — unlimited questions", ok: true },
                    { text: "23+ document templates", ok: true },
                    { text: "Emergency response guidance", ok: true },
                    { text: "Corey's Daily Brief (morning AI rundown)", ok: true },
                    { text: "Audit Mode + Team Meeting Mode", ok: true },
                    { text: "Private conversations per seat", ok: true },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-2 text-sm ${item.ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
                      {item.ok
                        ? <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                      }
                      {item.text}
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <Link href="/get-started">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold shadow-md shadow-accent/20">
                      Get Started — $699/mo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom note */}
          <div className="mt-8 p-5 rounded-2xl bg-white border border-border/50 text-center space-y-1">
            <p className="text-sm font-semibold text-primary">Not sure which tier fits?</p>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Most employers with 25–500 employees find that <strong>Tier 3 (Platform + Corey)</strong> covers everything
              they need from day one. Corey pays for itself the first time it keeps an injury off the OSHA 300 log.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/contact">
                <Button variant="outline" size="sm" className="gap-1.5 border-border/60 text-muted-foreground hover:text-primary">
                  <MessageSquare className="w-3.5 h-3.5" /> Talk to Us
                </Button>
              </Link>
              <Link href="/get-started">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-bold gap-1.5">
                  Compare All Plans <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COREY AI HIGHLIGHT ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 px-4 md:px-6 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <Badge variant="outline" className="text-accent border-accent/30">Corey AI — Included</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-primary leading-tight">
                Your 24/7 Senior
                <span className="block text-accent">Compliance Expert</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Corey knows OSHA, DOT, ISO, and occupational medicine inside out.
                Ask any compliance question, generate policy documents in seconds,
                or run a full audit preparation session.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["OSHA 29 CFR 1904", "DOT 49 CFR 40/382", "ISO 9001/14001/45001", "23+ Document Templates", "Emergency Response", "Audit Mode"].map((cap) => (
                  <div key={cap} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    {cap}
                  </div>
                ))}
              </div>
              <Link href="/meet-corey">
                <Button className="bg-accent hover:bg-accent/90 text-white font-bold gap-2">
                  Meet Corey <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Demo Corey brief card */}
            <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                  Corey's Daily Brief
                  <span className="text-xs text-muted-foreground font-normal ml-auto">Today</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { p: "urgent", icon: "🚨", text: "Marcus T.'s DOT physical expires in 12 days — he is currently operating a CMV. Renewal must happen before expiry to avoid FMCSA violation." },
                  { p: "high", icon: "⚠️", text: "The forklift near-miss CAPA from March 14 is 3 days overdue. Maintenance supervisor has not submitted the corrective action documentation." },
                  { p: "medium", icon: "📋", text: "Q1 OSHA 300A summary must be posted by February 1 through April 30 in a visible location. Verify posting compliance now." },
                ].map((b, i) => {
                  const border = b.p === "urgent" ? "border-destructive/40 bg-destructive/5" : b.p === "high" ? "border-orange-400/40 bg-orange-400/5" : "border-border/40 bg-muted/20";
                  const dot = b.p === "urgent" ? "bg-destructive" : b.p === "high" ? "bg-orange-400" : "bg-muted-foreground/40";
                  return (
                    <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${border}`}>
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <span className="text-sm leading-snug">{b.icon} {b.text}</span>
                    </div>
                  );
                })}
                <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent gap-1 h-7 px-2 mt-1 -ml-1">
                  <MessageSquare className="w-3 h-3" /> Ask Corey about any of these
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── LEAD CAPTURE ──────────────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border/50 py-14 px-4 md:px-6">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-2xl font-black text-primary">Want a personalized demo?</h3>
          <p className="text-muted-foreground text-sm">Leave your info and a compliance specialist will reach out — no sales pressure, just a real look at what CCHUB can do for your team.</p>
          {leadSubmitted ? (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Got it! We'll be in touch soon.
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={leadName}
                onChange={e => setLeadName(e.target.value)}
                required
                data-testid="input-employer-lead-name"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <input
                type="email"
                placeholder="Work email"
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
                required
                data-testid="input-employer-lead-email"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <Button type="submit" disabled={leadSubmitting} className="bg-accent hover:bg-accent/90 text-white font-bold px-6 shrink-0" data-testid="button-employer-lead-submit">
                {leadSubmitting ? "..." : "Request Demo"}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* ── FINAL CTA (DARK) ──────────────────────────────────────────────── */}
      <section className="bg-[#0f0f0f] py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Your competitors are already
            <span className="block text-accent">one incident behind.</span>
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            Every unlogged incident is OSHA exposure. Every missing CAPA is a repeat injury.
            Every late workers' comp notification costs you thousands.
            CCHUB closes all three gaps — automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/get-started">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 text-base px-10 shadow-xl shadow-accent/30">
                Get the Employer Dashboard <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/corey">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold gap-2 text-base">
                <Bot className="w-4 h-4" /> Ask Corey First
              </Button>
            </Link>
          </div>
          <p className="text-white/30 text-sm">$599/mo · No setup fees · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[hsl(222,47%,11%)] border-t border-white/10 py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">© 2025 Core Compliance Hub. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy"><span className="text-white/40 hover:text-white/80 text-sm transition-colors cursor-pointer">Privacy</span></Link>
            <Link href="/refund-policy"><span className="text-white/40 hover:text-white/80 text-sm transition-colors cursor-pointer">Refund Policy</span></Link>
            <Link href="/contact"><span className="text-white/40 hover:text-white/80 text-sm transition-colors cursor-pointer">Contact</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
