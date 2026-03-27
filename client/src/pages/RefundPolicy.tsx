import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw, AlertCircle, FileText, CreditCard, Clock, Mail } from "lucide-react";
import logoUrl from "@assets/7_1772482223269.png";

export default function RefundPolicy() {
  useEffect(() => {
    document.title = "Refund & Cancellation Policy | Core Compliance Hub";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = "Core Compliance Hub refund and cancellation policy. Cancel anytime, transparent billing, and a clear review process for technical issues.";
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
            <RefreshCcw className="w-4 h-4" />
            Billing Transparency
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Refund &amp; Cancellation Policy</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            No surprises. Cancel anytime. Here's exactly what to expect.
          </p>
          <p className="text-white/40 text-sm mt-4">Last updated: March 27, 2026</p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 space-y-12">

        {/* Cancellation */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Subscription Cancellations</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              You may cancel your Core Compliance Hub (CCH) subscription <strong className="text-foreground">at any time</strong> — directly through your account dashboard or by contacting our support team.
            </p>
            <p>
              Your access will remain fully active until the end of your current billing period. We do not pro-rate unused days, but you will never be charged for a period after you cancel.
            </p>
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong className="text-foreground">No cancellation fees.</strong> There are no penalties, exit fees, or long-term commitments required to cancel a CCH subscription.
              </p>
            </div>
          </div>
        </section>

        {/* Refunds */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Refund Policy</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Because Core Compliance Hub provides <strong className="text-foreground">immediate access to digital training curriculum, AI compliance tools, and compliance resources</strong>, we generally do not offer refunds once a billing cycle has been processed.
            </p>
            <p>
              This policy applies to all subscription tiers: Corey AI, Employer Platform, ISO Manager, and the Bilingual Medical Assistant.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <strong>Technical Issue Exception.</strong> If you experience a documented technical problem that prevented you from accessing the service, please contact us within <strong>14 days of the charge</strong> for a full review. We will investigate and, where appropriate, issue a full or partial refund at our discretion.
              </div>
            </div>
            <p className="text-sm">
              To request a refund review, email <a href="mailto:team@corecompliancehub.com" className="text-accent underline font-medium">team@corecompliancehub.com</a> with your account email, the charge date, and a description of the issue.
            </p>
          </div>
        </section>

        {/* Invoice Billing */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Invoiced Payments (Net 30)</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              For companies approved for monthly invoice billing, payment is due within <strong className="text-foreground">30 days of the invoice date</strong>.
            </p>
            <p>
              Late payments may result in a temporary suspension of platform access until the outstanding balance is cleared. We will provide a written notice at least <strong className="text-foreground">7 business days</strong> before any suspension takes effect.
            </p>
            <p>
              Upon payment, access is reinstated immediately. Invoiced billing is available on the Employer Platform and ISO Manager tiers. Contact our team to apply.
            </p>
          </div>
        </section>

        {/* Merchant of Record */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Payment Processing</h2>
          </div>
          <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              All subscription payments are processed through <strong className="text-foreground">Paddle</strong>, our Merchant of Record. Your financial transaction agreement is with Paddle.net. Your service agreement for platform access is with Core Compliance Hub.
            </p>
            <p>
              Paddle handles sales tax, VAT, and invoicing automatically. For billing-specific disputes (duplicate charges, unauthorized charges), you may also contact Paddle support directly at <a href="https://www.paddle.com/help" target="_blank" rel="noopener noreferrer" className="text-accent underline font-medium">paddle.com/help</a>.
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
              <p className="font-semibold text-lg">Questions about billing?</p>
              <p className="text-white/60 text-sm">Our team typically responds within one business day.</p>
            </div>
          </div>
          <a href="mailto:team@corecompliancehub.com">
            <Button className="bg-accent hover:bg-accent/90 text-white font-semibold" data-testid="button-contact-billing">
              Email Support
            </Button>
          </a>
        </section>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Also see our{" "}
          <Link href="/terms-of-service" className="text-accent underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy-policy" className="text-accent underline">Privacy Policy</Link>.
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(222,47%,11%)] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <img src={logoUrl} alt="Core Compliance Hub" className="h-12 w-auto brightness-0 invert" />
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50 justify-center">
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors text-white/80">Refund &amp; Cancellation Policy</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-white/40 text-xs">© 2026 Core Compliance Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
