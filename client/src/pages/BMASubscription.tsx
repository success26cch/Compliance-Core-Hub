import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  CheckCircle2, ArrowRight, Languages, Stethoscope, Calculator,
  DollarSign, Clock, Users, Mic, Volume2, Printer, FileText,
  MessageSquare, TrendingUp, Shield
} from "lucide-react";
import logoUrl from "@assets/1_1767636977932.png";
import cchLogo from "@assets/1_1770683748423.png";

export default function BMASubscription() {
  const { isAuthenticated } = useAuth();

  const [patientsPerDay, setPatientsPerDay] = useState(5);
  const [hourlyWage, setHourlyWage] = useState(22);
  const [minutesSaved, setMinutesSaved] = useState(15);

  const dailySavings = patientsPerDay * (minutesSaved / 60) * hourlyWage;
  const monthlySavings = dailySavings * 22;
  const annualSavings = monthlySavings * 12;
  const subscriptionCost = 149;
  const daysToPayoff = subscriptionCost > 0 && dailySavings > 0
    ? Math.ceil(subscriptionCost / dailySavings)
    : 0;

  const features = [
    {
      icon: Languages,
      title: "Real-Time Spanish Translation",
      description: "Instant text-to-speech in Spanish for common medical instructions. No interpreter needed."
    },
    {
      icon: Mic,
      title: "Bidirectional Speech-to-Text",
      description: "Patient speaks Spanish, the system translates to English in real-time for your clinical notes."
    },
    {
      icon: Volume2,
      title: "One-Tap Clinical Commands",
      description: "Pre-built command buttons for MAs and Providers: 'Empty pockets', 'Deep breath', 'Provide sample' and more."
    },
    {
      icon: Stethoscope,
      title: "Three Clinical Modes",
      description: "Injury Reporting, New Hire Intake, and Drug Screen Instructions — all in Spanish and English."
    },
    {
      icon: FileText,
      title: "Printable Clinical Summaries",
      description: "Generate Spanish-English bilingual visit summaries for medical records and compliance documentation."
    },
    {
      icon: Printer,
      title: "Interactive Body Map",
      description: "Visual injury documentation with point-and-click body part selection for accurate reporting."
    },
  ];

  const comparisonData = [
    { service: "Human Interpreter (in-person)", cost: "$45–$150/hour", note: "Scheduling delays, limited availability" },
    { service: "Video Remote Interpreter", cost: "$1.95–$3.49/min", note: "Per-minute charges add up fast" },
    { service: "Phone Interpreter", cost: "$1.50–$2.75/min", note: "No visual context for medical procedures" },
    { service: "CCH Spanish Bilingual Assistant", cost: "$149/month", note: "Unlimited use, instant access, medical-specific" },
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
            <a href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-pricing">Pricing</a>
            <Link href="/contact" className="text-sm font-medium text-muted-foreground transition-colors" data-testid="nav-contact">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button data-testid="button-bma-dashboard">Go to Dashboard</Button>
              </Link>
            ) : (
              <a href="/api/login">
                <Button variant="outline" data-testid="button-bma-signin">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1">
        <section className="pt-12 pb-20 bg-gradient-to-br from-accent/5 via-background to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <Badge variant="secondary" className="text-sm px-4 py-1" data-testid="badge-bma-clinic">
                <Stethoscope className="w-4 h-4 mr-2" />
                For Clinics & Medical Facilities
              </Badge>
              <img src={cchLogo} alt="CCH" className="h-24 md:h-28 w-auto mx-auto" data-testid="img-bma-hero-logo" />
              <h1 className="text-4xl md:text-5xl font-display font-bold text-primary">
                CCH Spanish Bilingual Medical Assistant
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Eliminate Spanish language barriers in your clinic. Instant Spanish translation, clinical commands, and
                Spanish bilingual documentation — all for one flat monthly fee.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                  <Button size="lg" data-testid="button-bma-subscribe">
                    Start Your BMA Subscription
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#calculator">
                  <Button size="lg" variant="outline" data-testid="button-bma-calculator">
                    <Calculator className="w-5 h-5 mr-2" />
                    See Your Savings
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Everything Your Clinic Needs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Purpose-built for occupational health clinics serving multilingual patients.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="p-6" data-testid={`card-bma-feature-${index}`}>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                How We Compare
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Traditional interpreter services cost a fortune. CCH gives you unlimited access at a flat rate.
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
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Labor Savings Calculator
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See exactly how much your clinic saves by eliminating language barriers.
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
                        at $149/month subscription
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
                  <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                    <Button data-testid="button-subscribe-calculator">
                      Start Your BMA Subscription
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="py-20 bg-muted/30 border-t border-border/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-primary mb-4">
                Simple, Transparent Pricing
              </h2>
            </div>

            <Card className="p-8 max-w-lg mx-auto text-center ring-2 ring-accent" data-testid="card-bma-pricing">
              <Badge className="mb-4">Most Popular</Badge>
              <h3 className="text-2xl font-bold text-primary mb-2">BMA Digital Assistant</h3>
              <p className="text-muted-foreground mb-6">Per location, unlimited use</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">$149</span>
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
              <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                <Button size="lg" className="w-full" data-testid="button-bma-subscribe-main">
                  Stop Wasting Labor — Start Your BMA Subscription Today
                </Button>
              </a>
              <p className="text-xs text-muted-foreground mt-4">
                Cancel anytime. No long-term contracts.
              </p>
            </Card>
          </div>
        </section>

        <section className="py-20 bg-accent text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Languages className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-display font-bold mb-4">
              Tired of Language Barriers?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Your MAs are already your best sales team. Give them the tool to see 2 more patients a day
              and watch your clinic's efficiency transform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={isAuthenticated ? "/dashboard" : "/api/login"}>
                <Button size="lg" variant="secondary" data-testid="button-bma-cta-subscribe">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <Link href="/contact">
                <Button size="lg" variant="outline" data-testid="button-bma-cta-contact">
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
            © 2024 Core Compliance Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
