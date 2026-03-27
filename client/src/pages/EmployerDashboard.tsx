import { Link } from "wouter";
import {
  Shield, Users, AlertTriangle, CheckCircle2, Clock,
  FileWarning, Stethoscope, TestTube, ClipboardList,
  MessageSquare, TrendingUp, Calendar, GraduationCap,
  FileText, QrCode, Bot, ChevronRight, Zap, Target,
  Mail, Building2, ArrowUpRight, Award, Layers, Cpu,
  ShieldCheck, ShieldAlert, HeartPulse, Sparkles,
  Megaphone, Activity, BarChart3, Lock, CheckSquare,
  Star, Play, Siren, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link as WouterLink } from "wouter";

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO = {
  grade: "B",
  score: 82,
  employees: 127,
  daysSafe: 48,
  openActions: 3,
  recordables6mo: 2,
  medicalSurveillance: 89,
  drugCleared: 124,
  drugPending: 3,
  isoReadiness: 73,
  departments: ["Operations", "Maintenance", "Warehouse", "Logistics", "Admin"],
  teamMembers: 14,
};

const DEMO_CHART = [
  { month: "Oct", total: 3, recordable: 1 },
  { month: "Nov", total: 5, recordable: 2 },
  { month: "Dec", total: 2, recordable: 0 },
  { month: "Jan", total: 4, recordable: 1 },
  { month: "Feb", total: 3, recordable: 1 },
  { month: "Mar", total: 1, recordable: 0 },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function DemoIncidentChart() {
  const max = Math.max(...DEMO_CHART.map(d => d.total), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2 h-28">
        {DEMO_CHART.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center" style={{ height: "96px" }}>
              <div
                className="w-full max-w-8 bg-primary/20 rounded-t relative"
                style={{ height: `${(item.total / max) * 100}%`, minHeight: item.total > 0 ? "8px" : "2px" }}
              >
                {item.recordable > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-destructive/80 rounded-t"
                    style={{ height: `${(item.recordable / item.total) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-primary/20 rounded" />
          <span className="text-muted-foreground">Total Incidents</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-destructive/80 rounded" />
          <span className="text-muted-foreground">Recordable</span>
        </div>
      </div>
    </div>
  );
}

function DemoCircularProgress({ value, size = 100, strokeWidth = 9, label }: { value: number; size?: number; strokeWidth?: number; label: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke="currentColor" fill="none" className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke="currentColor" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="text-accent transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-primary">{value}%</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployerDashboard() {
  const gradeColor = "text-accent";
  const gradeBg = "bg-accent/10 border-accent/20";

  const statusItems = [
    { label: "OSHA 300", ok: DEMO.recordables6mo === 0, icon: <ClipboardList className="w-3 h-3" /> },
    { label: "Medical", ok: DEMO.medicalSurveillance >= 80, icon: <HeartPulse className="w-3 h-3" /> },
    { label: "Drug Screen", ok: DEMO.drugPending === 0, icon: <TestTube className="w-3 h-3" /> },
    { label: "ISO Ready", ok: DEMO.isoReadiness >= 70, icon: <Shield className="w-3 h-3" /> },
  ];

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
    { title: "Corey AI", sub: "OSHA · DOT · ISO Expert", icon: <Bot className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", badge: "24/7 AI" },
    { title: "Employee Management", sub: "Medical Surveillance", icon: <Users className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", badge: `${DEMO.employees} employees` },
    { title: "Incident Log", sub: "OSHA 300 Compliant", icon: <FileWarning className="w-5 h-5" />, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", badge: null },
    { title: "CAPA Tracker", sub: "SMS Notifications", icon: <Target className="w-5 h-5" />, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", badge: `${DEMO.openActions} open` },
    { title: "Team Hub", sub: "3-Tier Role System", icon: <Layers className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/20", badge: `${DEMO.teamMembers} members` },
    { title: "Training Portal", sub: "LMS + Certificates", icon: <GraduationCap className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-600/10", border: "border-emerald-600/20", badge: null },
    { title: "ISO Manager", sub: "9001 · 14001 · 45001+", icon: <Award className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-600/10", border: "border-purple-600/20", badge: `${DEMO.isoReadiness}% ready` },
    { title: "Digital Passport", sub: "QR Clinic Check-In", icon: <QrCode className="w-5 h-5" />, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20", badge: null },
    { title: "OSHA Decision Tree", sub: "Recordability Tool", icon: <ClipboardList className="w-5 h-5" />, color: "text-teal-600", bg: "bg-teal-600/10", border: "border-teal-600/20", badge: null },
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
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
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
              <Link href="/watch-demo">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold gap-2 text-base">
                  <Play className="w-4 h-4" /> Watch Demo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/40">$599/mo · Employer Platform · All modules included</p>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="h-8 bg-background rounded-t-[40px]" />
      </section>

      {/* ── COMPLIANCE COMMAND CENTER (LIVE DEMO) ────────────────────────── */}
      <section className="bg-background px-4 md:px-6 pb-16">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="text-center mb-6">
            <Badge variant="outline" className="text-accent border-accent/30 mb-2">Live Demo Preview</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Your Compliance Health — At a Glance</h2>
            <p className="text-muted-foreground mt-1">This is what you see the moment you open your dashboard</p>
          </div>

          {/* Demo Compliance Banner */}
          <div className="rounded-2xl overflow-hidden border border-border/60 shadow-sm bg-white">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-emerald-500" />
            <div className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                {/* Grade */}
                <div className="flex items-center gap-5">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-border/50 flex items-center justify-center shadow-sm">
                      <Bot className="w-8 h-8 text-accent" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">COREY AI</span>
                  </div>
                  <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 shadow-sm ${gradeBg}`}>
                    <span className={`text-4xl font-black leading-none ${gradeColor}`}>{DEMO.grade}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 font-medium">{DEMO.score}%</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Compliance Health</p>
                    <h3 className="text-xl font-bold text-primary">Good Standing</h3>
                    <p className="text-sm text-muted-foreground">Acme Industrial Corp</p>
                  </div>
                </div>
                {/* Stats */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: DEMO.employees, label: "Employees", icon: <Users className="w-3 h-3" />, color: "text-primary" },
                    { val: DEMO.daysSafe, label: "Days Safe", icon: <ShieldCheck className="w-3 h-3" />, color: "text-accent" },
                    { val: DEMO.openActions, label: "Open Actions", icon: <ClipboardList className="w-3 h-3" />, color: "text-yellow-500" },
                    { val: DEMO.recordables6mo, label: "Recordables (6mo)", icon: <AlertTriangle className="w-3 h-3" />, color: "text-destructive" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-muted/30 border border-border/40">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                      <div className={`text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5`}>
                        {s.icon}{s.label}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Status strip */}
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {statusItems.map((s) => (
                      <div key={s.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${s.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                        {s.ok ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {s.icon}{s.label}
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="destructive" className="gap-1.5 font-semibold w-full">
                    <Siren className="w-4 h-4" /> Emergency Guidance
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Demo metric cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" /> ISO Audit Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-2">
                <DemoCircularProgress value={DEMO.isoReadiness} size={100} label="Ready" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" /> Medical Surveillance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{DEMO.medicalSurveillance}%</div>
                <p className="text-xs text-muted-foreground mt-1">Employees with current DOT/Respiratory exams</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${DEMO.medicalSurveillance}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-accent" /> Drug Screen Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cleared</span>
                  <span className="text-lg font-bold text-green-600">{DEMO.drugCleared}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-lg font-bold text-yellow-600">{DEMO.drugPending}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Employees</span>
                  <span className="font-bold">{DEMO.employees}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Actions</span>
                  <span className="font-bold">{DEMO.openActions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Recordables (6mo)</span>
                  <span className="font-bold text-destructive">{DEMO.recordables6mo}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart + Action Queue demo */}
          <div className="grid lg:grid-cols-2 gap-4 mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-primary" /> Incidents (Last 6 Months)
                </CardTitle>
                <CardDescription>Total vs. OSHA-recordable incidents</CardDescription>
              </CardHeader>
              <CardContent><DemoIncidentChart /></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-5 h-5 text-accent" /> Action Queue
                </CardTitle>
                <CardDescription>Prioritized tasks requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "DOT Physical Expiring — Marcus T.", desc: "Expires in 12 days · Click to send SMS reminder", priority: "urgent", icon: <Stethoscope className="w-4 h-4" /> },
                  { title: "CAPA Review Overdue — Forklift Near-Miss", desc: "Due 3 days ago · Maintenance Dept", priority: "high", icon: <Target className="w-4 h-4" /> },
                  { title: "Drug Screen Pending — 3 employees", desc: "Results not yet entered", priority: "medium", icon: <TestTube className="w-4 h-4" /> },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="mt-0.5 text-muted-foreground">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{item.title}</span>
                        <Badge className={`text-xs ${item.priority === 'urgent' ? 'bg-destructive text-destructive-foreground' : item.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white'}`}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
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
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-1.5">
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
                    {DEMO.departments.map((dept) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, i) => (
              <div key={i} className={`group p-4 rounded-xl border bg-white hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${mod.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${mod.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <span className={mod.color}>{mod.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-primary">{mod.title}</p>
                      {mod.badge && (
                        <Badge className={`text-xs px-1.5 py-0 h-4 ${mod.bg} ${mod.color} border-0`}>{mod.badge}</Badge>
                      )}
                    </div>
                    <p className={`text-xs font-semibold mt-0.5 ${mod.color}`}>{mod.sub}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
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
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold gap-2 text-base">
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
