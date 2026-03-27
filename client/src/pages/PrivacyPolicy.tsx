import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Eye, Database, Share2, ShieldCheck, Mail, Trash2, RefreshCcw, UserCheck } from "lucide-react";
import logoUrl from "@assets/7_1772482223269.png";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
    </div>
    <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
      {children}
    </div>
  </section>
);

const Highlight = ({ icon: Icon, color, children }: { icon: any; color: "green" | "blue" | "amber"; children: React.ReactNode }) => {
  const styles = {
    green: "bg-green-50 border-green-200 text-green-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
  };
  const iconStyles = {
    green: "text-green-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
  };
  return (
    <div className={`${styles[color]} border rounded-xl p-4 flex gap-3`}>
      <Icon className={`w-5 h-5 ${iconStyles[color]} shrink-0 mt-0.5`} />
      <div className="text-sm">{children}</div>
    </div>
  );
};

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Core Compliance Hub";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = "Core Compliance Hub Privacy Policy — what data we collect, how we use it, and your rights as a customer or employee user.";
    if (metaDesc) {
      metaDesc.setAttribute("content", content);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = content;
      document.head.appendChild(meta);
    }
    return () => { document.title = "Core Compliance Hub - THE ONE STOP EMPLOYER SHOP"; };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <div className="sticky top-0 z-[9999] bg-[hsl(222,47%,11%)] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/80" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <img src={logoUrl} alt="Core Compliance Hub" className="h-14 w-auto" />
          <Link href="/contact">
            <Button size="sm" className="bg-white text-[hsl(222,47%,11%)] font-semibold" data-testid="button-contact-us">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[hsl(222,47%,11%)] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-accent rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Lock className="w-4 h-4" />
            Your Data, Your Rights
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            We built this to be actually readable. Here's exactly what we collect, why we collect it, and how you can control it.
          </p>
          <p className="text-white/40 text-sm mt-4">Last updated: March 27, 2026</p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <p className="text-center text-muted-foreground text-sm mb-6 font-medium uppercase tracking-wide">The short version — full details below</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: Database,
              title: "We collect only what we need",
              desc: "Account info, company data you enter, and usage patterns to keep the platform running.",
            },
            {
              icon: Share2,
              title: "We never sell your data",
              desc: "Your information is never sold or rented to advertisers or data brokers. Period.",
            },
            {
              icon: UserCheck,
              title: "You're in control",
              desc: "Request a copy of your data or ask us to delete your account at any time.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <p className="font-semibold text-foreground text-sm">{title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Full Policy */}
        <div className="space-y-10">

          <Section icon={Eye} title="1. Who We Are">
            <p>
              Core Compliance Hub ("CCH," "we," "us," or "our") is an occupational health and workplace compliance platform operated by ACSI Quality, LLC, based in Texas. We provide AI-powered compliance tools, training curriculum, ISO management software, and bilingual health assistance to employers and occupational health providers.
            </p>
            <p>
              This Privacy Policy explains how we handle personal information collected through our website at <strong className="text-foreground">corecompliancehub.com</strong> and any related services.
            </p>
            <p className="text-sm">
              Questions? Email us at <a href="mailto:privacy@corecompliancehub.com" className="text-accent underline font-medium">privacy@corecompliancehub.com</a>.
            </p>
          </Section>

          <Section icon={Database} title="2. What We Collect">
            <p>We collect information in three ways:</p>

            <div className="space-y-3">
              <div className="border border-border/60 rounded-xl p-4">
                <p className="font-semibold text-foreground mb-1">Information you give us directly</p>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Account details: name, work email address, and password (stored as a one-way hash — we never see your actual password)</li>
                  <li>Company profile: employer name, industry, location, number of employees</li>
                  <li>Employee records: names, job titles, department, medical surveillance data you enter for compliance tracking</li>
                  <li>Incident and CAPA data: workplace incident reports and corrective action plans your team creates</li>
                  <li>Training records: course progress, quiz scores, and certificates</li>
                  <li>Contact form submissions and support requests</li>
                </ul>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <p className="font-semibold text-foreground mb-1">Information collected automatically</p>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Pages visited and features used (to improve the platform)</li>
                  <li>Browser type and device information</li>
                  <li>Session data (stored in our database to keep you logged in)</li>
                  <li>IP address</li>
                </ul>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <p className="font-semibold text-foreground mb-1">Information from third parties</p>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Billing data processed by <strong className="text-foreground">Paddle</strong> (our payment provider). We receive a customer ID and subscription status — we never store your full card number.</li>
                  <li>SMS delivery status from <strong className="text-foreground">Twilio</strong> for CAPA notification messages</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section icon={ShieldCheck} title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="space-y-2 list-disc pl-5 text-sm">
              <li>Create and manage your account and company workspace</li>
              <li>Deliver the compliance tools, AI assistance, training courses, and features you pay for</li>
              <li>Send transactional emails — incident alerts, CAPA notifications, billing receipts, and account updates</li>
              <li>Provide customer support and respond to your questions</li>
              <li>Improve platform performance, fix bugs, and develop new features</li>
              <li>Comply with applicable law (e.g., fraud prevention, dispute resolution)</li>
            </ul>
            <Highlight icon={ShieldCheck} color="green">
              <strong>We do not use your data for advertising.</strong> We do not build advertising profiles, sell your data to data brokers, or share your information with any third party for marketing purposes.
            </Highlight>
          </Section>

          <Section icon={Share2} title="4. Who We Share Data With">
            <p>
              We share the minimum necessary information with trusted service providers who help us operate the platform. All providers are contractually required to protect your data and use it only for the services they provide to us.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Provider</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Purpose</th>
                    <th className="text-left py-2 font-semibold text-foreground">Data shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ["Paddle", "Payment processing & subscriptions", "Email, subscription status"],
                    ["Twilio", "SMS notifications (CAPA alerts)", "Phone number, message content"],
                    ["MailerSend", "Transactional email delivery", "Email address, notification content"],
                    ["Anthropic (Claude)", "AI-powered compliance assistance", "Your chat messages only"],
                    ["Replit", "Cloud hosting & infrastructure", "All platform data (hosting provider)"],
                  ].map(([provider, purpose, data]) => (
                    <tr key={provider}>
                      <td className="py-2 pr-4 font-medium text-foreground">{provider}</td>
                      <td className="py-2 pr-4">{purpose}</td>
                      <td className="py-2 text-muted-foreground/80">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm">
              We may also disclose information if required by law, court order, or to protect the rights, safety, or property of CCH, its users, or the public.
            </p>
          </Section>

          <Section icon={Lock} title="5. How We Protect Your Data">
            <p>We take security seriously and have implemented the following safeguards:</p>
            <ul className="space-y-2 list-disc pl-5 text-sm">
              <li><strong className="text-foreground">Passwords</strong> are hashed with <code className="bg-muted px-1 rounded text-xs">scrypt</code> and a random salt — we cannot recover or read your password</li>
              <li><strong className="text-foreground">Sessions</strong> are stored server-side in an encrypted PostgreSQL database, not in your browser's local storage</li>
              <li><strong className="text-foreground">All traffic</strong> is encrypted in transit via HTTPS/TLS</li>
              <li><strong className="text-foreground">Payment data</strong> is handled entirely by Paddle — your card details never touch our servers</li>
              <li><strong className="text-foreground">AI conversations</strong> are not permanently stored — they exist only for your active session</li>
            </ul>
            <Highlight icon={Lock} color="blue">
              No system is 100% secure. If you believe your account has been compromised, contact us immediately at <strong>security@corecompliancehub.com</strong>.
            </Highlight>
          </Section>

          <Section icon={RefreshCcw} title="6. Data Retention">
            <p>
              We retain your account and company data for as long as your subscription is active, plus a <strong className="text-foreground">90-day grace period</strong> after cancellation, in case you want to reactivate.
            </p>
            <p>
              After that window, your account data is permanently deleted from our systems. Employee records, incident logs, and training certificates entered by your company follow the same timeline.
            </p>
            <p className="text-sm">
              Some data may be retained longer where required by law (e.g., financial records for tax purposes), but only to the extent legally required.
            </p>
          </Section>

          <Section icon={UserCheck} title="7. Your Rights & Choices">
            <p>You have the following rights regarding your personal information:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "Access", desc: "Request a copy of the personal data we hold about you." },
                { title: "Correction", desc: "Ask us to correct inaccurate or incomplete information." },
                { title: "Deletion", desc: "Request deletion of your account and associated data." },
                { title: "Portability", desc: "Request your data in a machine-readable format." },
                { title: "Opt-out of emails", desc: "Unsubscribe from non-essential emails via any email footer." },
                { title: "Restrict processing", desc: "Ask us to limit how we use your data in certain circumstances." },
              ].map(({ title, desc }) => (
                <div key={title} className="border border-border/60 rounded-xl p-4">
                  <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                  <p className="text-sm">{desc}</p>
                </div>
              ))}
            </div>

            <p className="text-sm">
              To exercise any of these rights, email <a href="mailto:privacy@corecompliancehub.com" className="text-accent underline font-medium">privacy@corecompliancehub.com</a>. We'll respond within <strong className="text-foreground">30 days</strong>. No fees, no runaround.
            </p>
          </Section>

          <Section icon={Eye} title="8. Cookies & Tracking">
            <p>
              We use a single session cookie to keep you logged in. This cookie is strictly necessary for the platform to function — it is not used for advertising or cross-site tracking.
            </p>
            <p>
              We do not use Google Analytics, Facebook Pixel, or any third-party advertising trackers. We track page visits internally only to improve the platform.
            </p>
          </Section>

          <Section icon={Lock} title="9. Children's Privacy">
            <p>
              Core Compliance Hub is designed for employers and occupational health professionals. We do not knowingly collect personal information from anyone under the age of 18. If you believe a minor has submitted information to us, please contact us and we will delete it immediately.
            </p>
          </Section>

          <Section icon={RefreshCcw} title="10. Changes to This Policy">
            <p>
              When we make material changes to this policy, we'll update the date at the top and notify active account holders by email at least <strong className="text-foreground">14 days</strong> before the change takes effect. Minor clarifications may be made without notice.
            </p>
            <p>
              Continuing to use the platform after the effective date means you accept the updated policy.
            </p>
          </Section>

          {/* Contact CTA */}
          <div className="bg-[hsl(222,47%,11%)] text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-lg">Privacy questions?</p>
                <p className="text-white/60 text-sm">We're real people. Reach us anytime — we'll get back to you within one business day.</p>
              </div>
            </div>
            <a href="mailto:privacy@corecompliancehub.com">
              <Button className="bg-accent hover:bg-accent/90 text-white font-semibold whitespace-nowrap" data-testid="button-contact-privacy">
                Email Privacy Team
              </Button>
            </a>
          </div>

          {/* Deletion request shortcut */}
          <div className="border border-border/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Request account deletion</p>
                <p className="text-muted-foreground text-sm">We'll permanently delete your account and all associated data within 10 business days.</p>
              </div>
            </div>
            <a href="mailto:privacy@corecompliancehub.com?subject=Account%20Deletion%20Request">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap" data-testid="button-delete-account">
                Request Deletion
              </Button>
            </a>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-4">
            Also see our{" "}
            <Link href="/terms-of-service" className="text-accent underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/refund-policy" className="text-accent underline">Refund &amp; Cancellation Policy</Link>.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[hsl(222,47%,11%)] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <img src={logoUrl} alt="Core Compliance Hub" className="h-12 w-auto brightness-0 invert" />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50 justify-center">
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refund &amp; Cancellation Policy</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors text-white/80">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-white/40 text-xs">© 2026 Core Compliance Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
