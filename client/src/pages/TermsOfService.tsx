import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Shield, FileText, AlertTriangle, CreditCard, Mail, Ban } from "lucide-react";
import logoUrl from "@assets/7_1772482223269.png";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Terms of Service | Core Compliance Hub";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = "Core Compliance Hub Terms of Service — license terms, IP restrictions, Paddle merchant of record disclosure, and compliance disclaimer.";
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
            <Scale className="w-4 h-4" />
            Legal Agreement
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            By using Core Compliance Hub, you agree to the following terms. Please read them carefully.
          </p>
          <p className="text-white/40 text-sm mt-4">Last updated: March 27, 2026</p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-12">

        {/* Acceptance */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
            <p>
              These Terms of Service ("Terms") govern your access to and use of Core Compliance Hub ("CCH," "we," "us," or "our"), including all software, AI tools, training materials, and related services (collectively, the "Platform").
            </p>
            <p>
              By creating an account, making a payment, or otherwise accessing the Platform, you — on behalf of yourself or the company you represent ("Customer") — agree to be bound by these Terms. If you do not agree, do not use the Platform.
            </p>
          </div>
        </section>

        {/* License */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">2. License Grant</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
            <p>
              Upon successful payment, CCH grants your company a <strong className="text-foreground">limited, non-exclusive, non-transferable, revocable license</strong> to access and use the Platform solely for your company's internal occupational health training, compliance management, and safety administration purposes.
            </p>
            <p>
              This license is tied to the subscription tier you have purchased and remains active for the duration of your paid subscription period. It terminates automatically upon cancellation or non-payment.
            </p>
          </div>
        </section>

        {/* Restrictions */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Ban className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">3. Restrictions</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
            <p>You may <strong className="text-foreground">not</strong>:</p>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Record, download, copy, or cache the AI outputs, training videos, or curriculum for distribution outside your organization.",
                "Resell, sublicense, or redistribute access to the Platform or any of its content to third parties.",
                "Reverse-engineer, replicate, or commercially exploit the Corey AI agent logic, prompt structure, or underlying models.",
                "Use the Platform in any manner that violates applicable federal, state, or local law.",
                "Share login credentials across organizations or use a single subscription to serve multiple unaffiliated employers.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Violations of these restrictions may result in immediate termination of your account without refund and may subject your organization to legal action.
            </p>
          </div>
        </section>

        {/* Intellectual Property */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">4. Intellectual Property</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
            <p>
              All content on the Platform — including but not limited to the Corey AI system, Isa ISO Manager AI, training curriculum, OSHA compliance tools, bilingual assistant, and all associated branding — is the exclusive intellectual property of Core Compliance Hub and/or ACSI Quality, LLC.
            </p>
            <p>
              Nothing in these Terms transfers any intellectual property rights to Customer. Your only right is the limited license described in Section 2.
            </p>
          </div>
        </section>

        {/* Payment & Merchant of Record */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">5. Payment &amp; Merchant of Record</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
            <p>
              All payments are processed by <strong className="text-foreground">Paddle</strong> (Paddle.net, Inc.), our designated Merchant of Record. Your financial transaction — including applicable sales tax and VAT — is governed by Paddle's terms and policies.
            </p>
            <p>
              Your service agreement for access to the compliance platform is with Core Compliance Hub. For billing disputes or invoice questions, refer to our{" "}
              <Link href="/refund-policy" className="text-accent underline">Refund &amp; Cancellation Policy</Link>.
            </p>
            <p>
              Subscriptions auto-renew at the end of each billing cycle. You may cancel at any time before your next renewal date to avoid being charged for the following period.
            </p>
          </div>
        </section>

        {/* Compliance Disclaimer */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">6. Compliance Disclaimer</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Important.</strong> While CCH provides AI-powered tools and educational resources to assist with OSHA, DOT, and ISO standards, the employer remains solely and legally responsible for ensuring total workplace safety and final regulatory compliance. CCH's outputs do not constitute legal advice and should not be relied upon as a substitute for qualified legal counsel or certified safety professionals.
              </p>
            </div>
            <p>
              CCH makes no warranties — express or implied — regarding the accuracy, completeness, or fitness for any particular purpose of the information provided by the Platform or its AI tools. Regulatory requirements vary by jurisdiction and change over time.
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">7. Limitation of Liability</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed space-y-4">
            <p>
              To the fullest extent permitted by applicable law, CCH's total liability to Customer for any claim arising out of or related to these Terms or the Platform shall not exceed the total fees paid by Customer in the <strong className="text-foreground">three (3) months</strong> immediately preceding the event giving rise to the claim.
            </p>
            <p>
              CCH shall not be liable for any indirect, incidental, consequential, punitive, or special damages, including lost profits or loss of business, arising from Customer's use of or inability to use the Platform.
            </p>
          </div>
        </section>

        {/* Governing Law */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">8. Governing Law</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed">
            <p>
              These Terms shall be governed by the laws of the State of Texas, without regard to its conflict of law provisions. Any disputes shall be resolved exclusively in the state or federal courts located in Texas.
            </p>
          </div>
        </section>

        {/* Changes */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">9. Changes to These Terms</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 text-muted-foreground leading-relaxed">
            <p>
              We reserve the right to update these Terms at any time. When we do, we will update the "Last updated" date at the top of this page and, for material changes, notify active subscribers by email at least <strong className="text-foreground">14 days</strong> before the change takes effect. Continued use of the Platform after the effective date constitutes acceptance of the revised Terms.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-[hsl(222,47%,11%)] text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-lg">Questions about these terms?</p>
              <p className="text-white/60 text-sm">We're happy to explain anything in plain language.</p>
            </div>
          </div>
          <a href="mailto:team@corecompliancehub.com">
            <Button className="bg-accent hover:bg-accent/90 text-white font-semibold" data-testid="button-contact-legal">
              Email Support
            </Button>
          </a>
        </section>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Also see our{" "}
          <Link href="/refund-policy" className="text-accent underline">Refund &amp; Cancellation Policy</Link>
          {" "}and{" "}
          <Link href="/privacy-policy" className="text-accent underline">Privacy Policy</Link>.
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(222,47%,11%)] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <img src={logoUrl} alt="Core Compliance Hub" className="h-12 w-auto brightness-0 invert" />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50 justify-center">
            <Link href="/terms-of-service" className="hover:text-white transition-colors text-white/80">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refund &amp; Cancellation Policy</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-white/40 text-xs">© 2026 Core Compliance Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
