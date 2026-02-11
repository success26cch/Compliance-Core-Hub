import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignaturePad from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CheckCircle2,
  FileText,
  Shield,
  Loader2,
  ArrowRight,
  Stethoscope,
  Lock,
  Handshake,
} from "lucide-react";
import logoUrl from "@assets/1_1767636977932.png";
import cchLogo from "@assets/1_1770683748423.png";

export default function ClinicAgreement() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [clinicName, setClinicName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAcceptAndSubscribe = async () => {
    if (!clinicName.trim()) {
      toast({ title: "Clinic name is required", variant: "destructive" });
      return;
    }
    if (!contactName.trim()) {
      toast({ title: "Contact name is required", variant: "destructive" });
      return;
    }
    if (!contactEmail.trim()) {
      toast({ title: "Contact email is required", variant: "destructive" });
      return;
    }
    if (!signature) {
      toast({ title: "Digital signature is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/clinic-agreement", {
        clinicName: clinicName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        signature,
        agreedAt: new Date().toISOString(),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setSubmitted(true);
        toast({
          title: "Agreement submitted successfully",
          description: "Your clinic partnership agreement has been recorded.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-lg text-center" data-testid="card-agreement-success">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3">Partnership Agreement Submitted</h2>
          <p className="text-muted-foreground mb-6">
            Thank you, <strong>{clinicName}</strong>. Your Clinic Partnership Agreement has been recorded.
            Our team will reach out shortly to finalize your onboarding.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full" data-testid="button-agreement-home">
                Return to Home
              </Button>
            </Link>
            <Link href="/bma-subscription">
              <Button variant="outline" className="w-full" data-testid="button-agreement-learn-more">
                Learn More About BMA
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4">
          <Link href="/">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto cursor-pointer" data-testid="img-agreement-nav-logo" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-home">Home</Link>
            <Link href="/bma-subscription" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-bma">BMA Info</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 w-full">
        <div className="text-center space-y-4">
          <img src={cchLogo} alt="CCH" className="h-20 w-auto mx-auto" data-testid="img-agreement-logo" />
          <Badge variant="secondary" className="text-sm px-4 py-1">
            <Handshake className="w-4 h-4 mr-2" />
            Clinic Partnership
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary" data-testid="heading-agreement">
            CCH Spanish Bilingual Assistant — Clinic Partnership Agreement
          </h1>
        </div>

        <Card className="p-6 md:p-8" data-testid="card-agreement-text">
          <div className="prose prose-sm max-w-none dark:prose-invert space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-primary m-0">1. THE PARTNERSHIP</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                This agreement is between <strong>Core Compliance Hub (CCH)</strong> and the Partner clinic identified below.
                CCH agrees to provide the <strong>Spanish Bilingual Medical Assistant (BMA)</strong> software to streamline
                clinical flow and improve accuracy for Spanish-speaking patients. This tool is designed exclusively for
                Spanish-English bilingual communication and does not currently support other languages.
              </p>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-primary m-0">2. THE "COMPLIANCE-FIRST" TOOLS</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The Partner receives full access to:
              </p>
              <ul className="space-y-3">
                {[
                  { title: "The Command Center", desc: "One-tap Spanish medical instructions for clinical staff." },
                  { title: "Live Voice Bridge", desc: "Real-time speech-to-speech Spanish-English translation for providers." },
                  { title: "Digital Handshake", desc: "Instant processing of CCH Employer Authorizations via QR scan." },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">{item.title}:</span>{" "}
                      <span className="text-muted-foreground">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-lg">$</span>
                </div>
                <h2 className="text-xl font-bold text-primary m-0">3. PRICING & TERMS</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Subscription Fee</p>
                  <p className="text-2xl font-bold text-primary">$149.00 <span className="text-sm font-normal text-muted-foreground">USD/month</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Billed per location</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Term</p>
                  <p className="text-lg font-bold text-primary">Month-to-Month</p>
                  <p className="text-xs text-muted-foreground mt-1">No long-term commitments. Cancel anytime.</p>
                </Card>
              </div>
              <p className="text-muted-foreground text-sm italic">
                Access begins immediately upon first payment. If we aren't saving you time, you shouldn't be paying us.
              </p>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-primary m-0">4. THE "PROFIT" PROMISE (ROI)</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                CCH provides this tool to reduce clinical communication barriers with Spanish-speaking patients.
                The Partner agrees that the BMA is a <strong>supplemental tool</strong> and does not replace the
                professional judgment of a licensed medical provider. The Spanish Bilingual Medical Assistant is
                designed for Spanish-English communication only and should not be relied upon for other language pairs.
              </p>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-primary m-0">5. DATA & PRIVACY (HIPAA)</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                CCH is built with <strong>HIPAA-compliant standards</strong>. All patient data processed through
                the BMA for CCH-affiliated employers is encrypted and logged for the employer's OSHA/DOT compliance records.
                No patient data is shared with third parties.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8 space-y-6" data-testid="card-agreement-form">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Digital Acceptance
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete the fields below and provide your digital signature to accept this Clinic Partnership Agreement.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic / Facility Name</Label>
              <Input
                id="clinicName"
                placeholder="e.g., Valley Occupational Health"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                data-testid="input-clinic-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Authorized Representative</Label>
              <Input
                id="contactName"
                placeholder="Full name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                data-testid="input-contact-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email Address</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="clinic@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              data-testid="input-contact-email"
            />
          </div>

          <div className="space-y-2">
            <Label>Digital Signature</Label>
            <p className="text-xs text-muted-foreground">Draw your signature below to accept the terms.</p>
            <SignaturePad onSignatureChange={setSignature} width={Math.min(500, window.innerWidth - 80)} height={150} />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300"
              data-testid="checkbox-agree"
            />
            <Label htmlFor="agree" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I confirm that I am authorized to enter into this agreement on behalf of the clinic named above.
              I have read and agree to the terms of the CCH Spanish Bilingual Assistant Clinic Partnership Agreement,
              including the $149.00/month subscription fee billed per location.
            </Label>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!agreed || !signature || !clinicName.trim() || !contactName.trim() || !contactEmail.trim() || submitting}
            onClick={handleAcceptAndSubscribe}
            data-testid="button-accept-subscribe"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Handshake className="w-5 h-5 mr-2" /> Accept Agreement & Subscribe — $149/mo
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You will be redirected to our secure payment processor to complete your subscription.
            Cancel anytime — no long-term commitments.
          </p>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-8">
          Powered by Core Compliance Hub — The One Stop Employer Shop
        </p>
      </div>
    </div>
  );
}
