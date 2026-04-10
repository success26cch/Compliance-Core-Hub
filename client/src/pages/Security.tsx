import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Lock, FileText, Eye, Server, RefreshCcw,
  CheckCircle2, AlertTriangle, Key, Activity, Globe, Database,
  ArrowRight, Mail
} from "lucide-react";
import logoUrl from "@assets/6_1770259909295.png";

const PILLARS = [
  {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "Administrative Safeguards",
    subtitle: "The Paper Trail",
    items: [
      { label: "Business Associate Agreement (BAA)", status: "available", note: "Available upon request for qualifying enterprise accounts" },
      { label: "Data Processing Agreement (DPA)", status: "available", note: "GDPR and CCPA-ready agreements provided on request" },
      { label: "Security Whitepaper", status: "available", note: "Full technical architecture document available for IT review" },
      { label: "Incident Response Plan", status: "available", note: "Documented breach notification and response procedures" },
      { label: "SOC 2 Roadmap", status: "in-progress", note: "Currently pursuing SOC 2 Type II certification" },
    ],
  },
  {
    icon: Lock,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
    title: "Technical Safeguards",
    subtitle: "Encryption & Access Control",
    items: [
      { label: "TLS 1.2+ Encryption in Transit", status: "active", note: "All data between browser and server is encrypted end-to-end" },
      { label: "AES-256 Encryption at Rest", status: "active", note: "Database storage is encrypted at the infrastructure level" },
      { label: "HTTPS Enforced Site-Wide", status: "active", note: "HTTP connections are automatically redirected to HTTPS" },
      { label: "Session Token Security", status: "active", note: "Signed, HttpOnly, SameSite session cookies — no client-readable tokens" },
      { label: "Multi-Factor Authentication (MFA)", status: "roadmap", note: "TOTP-based MFA (Google Authenticator) — coming Q3 2026" },
      { label: "SSO / SAML Integration", status: "roadmap", note: "Enterprise SSO support planned for Q4 2026" },
    ],
  },
  {
    icon: ShieldCheck,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    title: "Vulnerability Management",
    subtitle: "Proactive Threat Prevention",
    items: [
      { label: "Web Application Firewall (WAF)", status: "active", note: "Cloudflare WAF protects against SQL injection, XSS, and DDoS attacks" },
      { label: "Rate Limiting", status: "active", note: "Login endpoints and APIs are rate-limited to block brute-force attacks" },
      { label: "Security Headers", status: "active", note: "HSTS, CSP, X-Frame-Options, and CSRF protections enforced on all responses" },
      { label: "Dependency Vulnerability Scanning", status: "active", note: "Automated scans detect vulnerable packages before deployment" },
      { label: "Penetration Testing", status: "roadmap", note: "Third-party pen test scheduled as part of SOC 2 preparation" },
    ],
  },
  {
    icon: Eye,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    title: "Monitoring & Audit Logs",
    subtitle: "The Black Box",
    items: [
      { label: "Immutable Audit Trail", status: "active", note: "Every data access, edit, and deletion is logged with user ID, timestamp, and IP address" },
      { label: "Authentication Event Logging", status: "active", note: "All login attempts (successful and failed) are recorded and retained" },
      { label: "PHI Access Logging", status: "active", note: "Employee records and medical data access is tracked per HIPAA requirements" },
      { label: "Log Retention (90 days)", status: "active", note: "Audit logs are retained for a minimum of 90 days, extended to 6 years on request" },
      { label: "Real-Time Alerting", status: "roadmap", note: "SIEM integration (Datadog/Splunk) planned for enterprise tier" },
    ],
  },
  {
    icon: Server,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    title: "Infrastructure & Availability",
    subtitle: "Hosting & Resilience",
    items: [
      { label: "PostgreSQL Database", status: "active", note: "Production-grade relational database with automated backups" },
      { label: "Data Segregation", status: "active", note: "Customer data is logically isolated — one tenant cannot access another's data" },
      { label: "Automated Backups", status: "active", note: "Daily encrypted database backups with point-in-time recovery" },
      { label: "99.9% Uptime SLA", status: "active", note: "Hosted on infrastructure with high availability and redundancy" },
      { label: "HIPAA-Compliant Hosting Path", status: "available", note: "Enterprise accounts can request data hosted on HIPAA-compliant infrastructure with BAA" },
    ],
  },
];

const STATUS_CONFIG = {
  active:      { label: "Active",       class: "bg-green-100 text-green-700 border-green-200" },
  available:   { label: "Available",    class: "bg-blue-100 text-blue-700 border-blue-200" },
  "in-progress": { label: "In Progress", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  roadmap:     { label: "2026 Roadmap", class: "bg-gray-100 text-gray-600 border-gray-200" },
};

const QUICK_ANSWERS = [
  { q: "Do you have a BAA?", a: "Yes — available upon request for qualifying enterprise accounts. Contact us to start the process." },
  { q: "Is data encrypted?", a: "Yes. AES-256 at rest and TLS 1.2+ in transit. All HTTPS, always." },
  { q: "Is there an audit trail?", a: "Yes. Every PHI access event is logged with user ID, timestamp, and IP address. Logs are immutable and retained for 90+ days." },
  { q: "Is there MFA?", a: "TOTP-based MFA is on the 2026 roadmap. Current security relies on strong session management, rate limiting, and WAF protection." },
  { q: "Is Replit HIPAA-compliant?", a: "For enterprise deployments requiring a signed BAA, we can host your data on dedicated HIPAA-compliant infrastructure. Contact us to discuss." },
  { q: "How is data separated between customers?", a: "All customer data is logically isolated at the application and database query level. No tenant can access another's data." },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/">
            <img src={logoUrl} alt="CCHUB" className="h-10 object-contain cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/contact">
              <Button size="sm" className="bg-accent text-white hover:bg-accent/90">Contact Security Team</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-accent" />
            Security & Compliance Center
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-4">
            <span className="text-sky-400">Built for IT Directors.</span><br />
            <span className="text-accent">Designed to Pass Your Review.</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Core Compliance Hub is built with enterprise security in mind. Here is everything your IT team needs to evaluate, verify, and approve our platform.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="mailto:security@corecompliancehub.com">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white gap-2">
                <Mail className="w-4 h-4" /> Request Security Package
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-accent hover:bg-white/10 gap-2">
                <FileText className="w-4 h-4" /> Request BAA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="border-b border-border/50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "TLS 1.2+", label: "Encryption in Transit" },
            { value: "AES-256", label: "Encryption at Rest" },
            { value: "90 Days", label: "Audit Log Retention" },
            { value: "24/7", label: "WAF Protection" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-primary">The IT Trust Stack</h2>
            <p className="text-muted-foreground mt-2">Five pillars your security team will evaluate — here's where we stand on each.</p>
          </div>
          <div className="space-y-8">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className={`bg-white rounded-2xl border ${pillar.border} overflow-hidden shadow-sm`}>
                <div className={`${pillar.bg} px-6 py-4 flex items-center gap-3 border-b ${pillar.border}`}>
                  <div className={`w-10 h-10 rounded-xl ${pillar.bg} border ${pillar.border} flex items-center justify-center`}>
                    <pillar.icon className={`w-5 h-5 ${pillar.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground">{pillar.subtitle}</p>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {pillar.items.map((item) => {
                    const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
                    return (
                      <div key={item.label} className="flex items-start gap-4 px-6 py-4">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${item.status === "active" ? "text-green-500" : "text-muted-foreground/40"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-primary">{item.label}</span>
                            <Badge className={`text-xs px-2 py-0 h-5 border ${cfg.class}`}>{cfg.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Answers for IT */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-primary">Questions Your IT Team Will Ask</h2>
            <p className="text-muted-foreground mt-2">Direct answers — no marketing fluff.</p>
          </div>
          <div className="space-y-4">
            {QUICK_ANSWERS.map((qa) => (
              <div key={qa.q} className="rounded-xl border border-border/60 overflow-hidden">
                <div className="bg-muted/30 px-5 py-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
                  <p className="font-semibold text-sm text-primary">"{qa.q}"</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{qa.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data handling */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Key className="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-display font-bold mb-4 text-accent">What Kind of Data Does CCHUB Handle?</h2>
          <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Core Compliance Hub primarily handles <strong className="text-white">compliance documentation, safety records, and OSHA 300 log data</strong> — not clinical ePHI like hospital records.
            For accounts that do handle Protected Health Information, we offer dedicated HIPAA-compliant infrastructure with a signed BAA.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            {[
              { icon: Database, title: "Compliance Data", desc: "OSHA 300 logs, incident reports, corrective actions, training records" },
              { icon: Activity, title: "Employee Records", desc: "Medical surveillance tracking, drug screen status, work restrictions" },
              { icon: Globe, title: "ISO Documentation", desc: "Process maps, audit trails, nonconformance records, KPI data" },
            ].map((item) => (
              <div key={item.title} className="bg-white/10 border border-white/20 rounded-xl p-4">
                <item.icon className="w-5 h-5 text-accent mb-2" />
                <p className="font-bold text-sm mb-1">{item.title}</p>
                <p className="text-xs text-white/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-display font-bold text-primary mb-3">Ready to Run Your Security Review?</h2>
          <p className="text-muted-foreground mb-8">
            We are happy to schedule a technical call with your IT director, provide our Security Whitepaper, or start the BAA process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:security@corecompliancehub.com">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white gap-2 w-full sm:w-auto">
                <Mail className="w-4 h-4" /> Email Our Security Team
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                Schedule IT Review Call <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-6">security@corecompliancehub.com · Response within 1 business day</p>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/20 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Core Compliance Hub · <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link> · <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
