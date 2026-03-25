import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  CheckCircle2, ArrowRight, Languages, Stethoscope, Calculator,
  DollarSign, Mic, Volume2, Printer, FileText,
  MessageSquare, TrendingUp, ShoppingCart, Play,
  AlertTriangle, UserPlus, FlaskConical
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { PRODUCTS } from "@/lib/products";
import { CartTrigger } from "@/components/CartDrawer";
import BilingualAssistant from "@/components/BilingualAssistant";
import logoUrl from "@assets/1_1767636977932.png";
import cchLogo from "@assets/8_1774401539830.png";

export default function BMA() {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const handleAddToCart = () => {
    const product = PRODUCTS["bma-subscription"];
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        unitAmount: product.unitAmount,
        currency: product.currency,
        interval: product.interval,
        category: product.category,
      });
    }
  };

  const [patientsPerDay, setPatientsPerDay] = useState(5);
  const [hourlyWage, setHourlyWage] = useState(22);
  const [minutesSaved, setMinutesSaved] = useState(15);

  const dailySavings = patientsPerDay * (minutesSaved / 60) * hourlyWage;
  const monthlySavings = dailySavings * 22;
  const annualSavings = monthlySavings * 12;
  const subscriptionCost = 199;
  const daysToPayoff = subscriptionCost > 0 && dailySavings > 0
    ? Math.ceil(subscriptionCost / dailySavings)
    : 0;

  const features = [
    {
      icon: Languages,
      title: "Real-Time Spanish Translation",
      description: "Instant text-to-speech in Spanish for common medical instructions. No interpreter needed — your MAs communicate clearly with every patient."
    },
    {
      icon: Mic,
      title: "Bidirectional Speech-to-Text",
      description: "Patient speaks Spanish, the system translates to English in real-time for your clinical notes. Provider speaks English, the patient hears Spanish."
    },
    {
      icon: Volume2,
      title: "One-Tap Clinical Commands",
      description: "Pre-built command buttons for MAs and Providers: 'Empty pockets', 'Deep breath', 'Provide sample' — all spoken in clear, professional Spanish."
    },
    {
      icon: Stethoscope,
      title: "Three Clinical Modes",
      description: "Injury Reporting with body maps, New Hire Intake with bilingual forms, and Drug Screen Instructions with DOT-compliant step-by-step walkthroughs."
    },
    {
      icon: FileText,
      title: "Printable Clinical Summaries",
      description: "Generate Spanish-English bilingual visit summaries for medical records and compliance documentation — ready to print or attach to the chart."
    },
    {
      icon: Printer,
      title: "Interactive Body Map",
      description: "Visual injury documentation with point-and-click body part selection. Patients confirm the injury location even when they can't describe it in English."
    },
  ];

  const comparisonData = [
    { service: "Human Interpreter (in-person)", cost: "$45–$150/hour", note: "Scheduling delays, limited availability" },
    { service: "Video Remote Interpreter", cost: "$1.95–$3.49/min", note: "Per-minute charges add up fast" },
    { service: "Phone Interpreter", cost: "$1.50–$2.75/min", note: "No visual context for medical procedures" },
    { service: "CCHUB Spanish Bilingual Assistant", cost: "$199/month", note: "Unlimited use, instant access, medical-specific" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4">
          <Link href="/">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto cursor-pointer" data-testid="img-bma-nav-logo" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-home">Home</Link>
            <a href="#demo" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-demo">Try the Demo</a>
            <a href="#calculator" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-calculator">ROI Calculator</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-pricing">Pricing</a>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-contact">Contact</Link>
          </div>
          <div className="flex items-center gap-2">
            <CartTrigger />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button data-testid="button-bma-dashboard">Go to Dashboard</Button>
              </Link>
            ) : (
              <a href="/login">
                <Button variant="outline" data-testid="button-bma-signin">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(222,47%,15%)] to-[hsl(222,47%,8%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-accent/8 blur-3xl rounded-full pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
            <Badge className="bg-accent/20 text-accent border border-accent/30 text-sm px-4 py-1.5 mb-6" data-testid="badge-bma-hero">
              <Stethoscope className="w-4 h-4 mr-2" />
              Built for Occupational Health Clinics
            </Badge>

            <div className="flex justify-center mb-6">
              <img src={cchLogo} alt="CCHUB" className="h-40 md:h-48 w-auto" data-testid="img-bma-hero-logo" />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white leading-tight mb-6" data-testid="text-bma-hero-title">
              Because Your Occupational Health Employees Speak Spanish.<br />
              <span style={{ color: "#38bdf8" }}>And So Do Your Patients.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-8">
              The CCHUB Spanish Bilingual Medical Assistant gives your MAs and Providers instant Spanish translation, clinical commands, and bilingual documentation — no interpreter, no delays, no per-minute charges. One flat monthly fee. Unlimited patients.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#demo">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 px-8" data-testid="button-bma-hero-demo">
                  <Play className="w-5 h-5" /> Try the Live Demo
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-6 justify-center mt-10 text-sm text-white/40">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> No interpreter needed</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Unlimited patient encounters</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> DOT-compliant workflows</span>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-primary mb-4" data-testid="text-bma-features-title">
                Everything Your Clinic Needs — In One Tool
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Purpose-built for occupational health clinics serving Spanish-speaking patients. No setup. No training. Just open it and go.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="p-6" data-testid={`card-bma-feature-${index}`}>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="relative">
          <div className="bg-[hsl(222,47%,8%)] border-y border-white/10 py-5 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-accent text-black font-bold text-xs px-3 py-1">LIVE DEMO</Badge>
                  <span className="text-white font-bold text-base">Spanish Bilingual Medical Assistant</span>
                </div>
                <a href="#pricing">
                  <Button size="sm" className="bg-accent text-black font-semibold whitespace-nowrap" data-testid="button-bma-demo-subscribe">
                    Subscribe — $199/mo
                  </Button>
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <AlertTriangle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">Injury Reporting</p>
                    <p className="text-white/50 text-xs">Interactive body map + printable bilingual report</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <UserPlus className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">New Hire Intake</p>
                    <p className="text-white/50 text-xs">Step-by-step bilingual onboarding form</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <FlaskConical className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm">Drug Screen</p>
                    <p className="text-white/50 text-xs">DOT-compliant step-by-step instructions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <BilingualAssistant />
        </section>

        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-primary mb-4" data-testid="text-bma-comparison-title">
                How We Compare
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Traditional interpreter services cost a fortune and slow your clinic down. CCHUB gives you unlimited, instant access at a flat rate.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {comparisonData.map((item, index) => (
                <Card key={index} className={`p-5 flex items-center justify-between gap-4 flex-wrap ${index === comparisonData.length - 1 ? 'ring-2 ring-accent bg-accent/5' : ''}`} data-testid={`card-comparison-${index}`}>
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="font-semibold text-primary">{item.service}</h4>
                    <p className="text-sm text-muted-foreground">{item.note}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${index === comparisonData.length - 1 ? 'text-accent' : 'text-primary'}`}>
                      {item.cost}
                    </span>
                    {index === comparisonData.length - 1 && (
                      <p className="text-xs text-accent font-medium">Unlimited use</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="calculator" className="py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="text-sm mb-4">
                <Calculator className="w-4 h-4 mr-2" />
                ROI Calculator
              </Badge>
              <h2 className="text-3xl font-display font-bold text-primary mb-4" data-testid="text-bma-roi-title">
                This Tool Pays for Itself in Days
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See exactly how much your clinic saves by eliminating language barriers and reducing time per patient.
              </p>
            </div>

            <Card className="p-8" data-testid="card-roi-calculator">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Your Clinic Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Patients per day with language barriers
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={patientsPerDay}
                          onChange={(e) => setPatientsPerDay(parseInt(e.target.value))}
                          className="flex-1 accent-accent"
                          data-testid="slider-patients"
                        />
                        <span className="text-lg font-bold text-primary w-10 text-right" data-testid="text-patients-value">{patientsPerDay}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Average MA hourly wage
                      </label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={hourlyWage}
                          onChange={(e) => setHourlyWage(parseFloat(e.target.value) || 0)}
                          className="w-24"
                          data-testid="input-hourly-wage"
                        />
                        <span className="text-sm text-muted-foreground">/hour</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Estimated minutes saved per patient
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={minutesSaved}
                          onChange={(e) => setMinutesSaved(parseInt(e.target.value))}
                          className="flex-1 accent-accent"
                          data-testid="slider-minutes"
                        />
                        <span className="text-lg font-bold text-primary w-14 text-right" data-testid="text-minutes-value">{minutesSaved} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent" />
                    Your Savings
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Daily Savings</p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-daily-savings">
                        ${dailySavings.toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Savings (22 working days)</p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-monthly-savings">
                        ${monthlySavings.toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 bg-accent/10 rounded-lg ring-2 ring-accent/20">
                      <p className="text-sm text-accent font-medium mb-1">Total Annual Savings</p>
                      <p className="text-4xl font-bold text-accent" data-testid="text-annual-savings">
                        ${annualSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        This tool pays for itself in
                      </p>
                      <p className="text-2xl font-bold text-primary" data-testid="text-payoff-days">
                        {daysToPayoff} {daysToPayoff === 1 ? 'day' : 'days'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        at $199/month subscription
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Based on average MA wage of ${hourlyWage}/hr and {minutesSaved} minutes saved per patient interaction.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    data-testid="button-print-roi"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print ROI Report
                  </Button>
                  <a href="#pricing">
                    <Button data-testid="button-subscribe-calculator">
                      Subscribe Now — $199/mo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="pricing" className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-primary mb-4" data-testid="text-bma-pricing-title">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                One tool. One price. Unlimited patients.
              </p>
            </div>

            <Card className="p-8 max-w-lg mx-auto text-center ring-2 ring-accent" data-testid="card-bma-pricing">
              <Badge className="mb-4">Most Popular</Badge>
              <h3 className="text-2xl font-bold text-primary mb-2">BMA Digital Assistant</h3>
              <p className="text-muted-foreground mb-6">Per location, unlimited use</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">$199</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                {[
                  "Unlimited patient translations",
                  "Real-time Spanish text-to-speech",
                  "Bidirectional speech recognition",
                  "One-tap clinical commands (MA & Provider)",
                  "Interactive body map for injury reporting",
                  "Printable Spanish bilingual clinical summaries",
                  "Three clinical modes (Injury, New Hire, Drug Screen)",
                  "Staff Command Center dashboard",
                  "Clinic engagement analytics",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button size="lg" className="w-full" onClick={handleAddToCart} data-testid="button-add-cart-bma-main">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart — $199/mo
                </Button>
                <a href={isAuthenticated ? "/dashboard" : "/login"}>
                  <Button size="lg" variant="outline" className="w-full" data-testid="button-bma-subscribe-main">
                    Start Your BMA Subscription Today
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Cancel anytime. No long-term contracts.
              </p>
            </Card>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-3">Are you a clinic interested in partnering with CCHUB?</p>
              <Link href="/clinic-agreement">
                <Button variant="outline" data-testid="button-clinic-agreement-link">
                  <FileText className="w-4 h-4 mr-2" />
                  View Clinic Partnership Agreement
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-accent text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Languages className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-display font-bold mb-4" data-testid="text-bma-cta-title">
              Your MAs Are Your Best Asset. Give Them the Right Tool.
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Every minute your staff spends struggling through a language barrier is a minute they're not seeing the next patient.
              The BMA eliminates that friction — instantly, consistently, and for a fraction of what interpreters cost.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#pricing">
                <Button size="lg" variant="secondary" data-testid="button-bma-cta-subscribe">
                  Get Started — $199/mo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-white text-slate-800 border-white hover:bg-slate-100" data-testid="button-bma-cta-contact">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Talk to Our Team
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-primary text-primary-foreground py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-20 w-auto brightness-0 invert" />
          </div>
          <p className="text-primary-foreground/60 text-sm">
            © 2025 Core Compliance Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
