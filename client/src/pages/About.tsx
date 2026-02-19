import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Bot, Award, Users, Target, Building2, Handshake, Globe, BookOpen, Phone, ArrowRight, CheckCircle2, Briefcase, Sparkles, TrendingUp, Heart, Lightbulb, Shield, ClipboardList } from "lucide-react";
import logoUrl from "@assets/1_1767636977932.png";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import brandNSwagLogo from "@assets/2026_BNS_Logo_1768928815681.png";
import cchLogo from "@assets/1_1770683748423.png";

export default function About() {
  useEffect(() => {
    document.title = "About CCH & ACSI - Core Compliance Hub | The One Stop Employer Shop";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Learn about Core Compliance Hub and ACSI Services International. 25+ years of occupational health, safety compliance, and ISO management expertise powered by Corey AI.");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Learn about Core Compliance Hub and ACSI Services International. 25+ years of occupational health, safety compliance, and ISO management expertise powered by Corey AI.";
      document.head.appendChild(meta);
    }
    return () => { document.title = "Core Compliance Hub - THE ONE STOP EMPLOYER SHOP"; };
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-[9999] bg-[hsl(222,47%,11%)] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/80" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <img src={logoUrl} alt="Core Compliance Hub" className="h-10 w-auto" />
          <Link href="/contact">
            <Button size="sm" className="bg-white text-[hsl(222,47%,11%)] font-semibold" data-testid="button-contact-us">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="outline" className="text-accent border-accent/30 px-4 py-1 text-sm">
            About Us
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-primary leading-tight" data-testid="text-about-title">
            The Story Behind<br /><span className="text-accent">Core Compliance Hub</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Born from decades of real-world audit experience and a vision to make occupational health and safety compliance accessible to every employer in America.
          </p>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-origin-title">
                Where It All Started
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Core Compliance Hub didn't start in a boardroom or a tech lab. It started in the field — on factory floors, in warehouses, at construction sites, and inside the offices of companies struggling to keep up with the ever-changing landscape of federal regulations.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With over <strong className="text-primary">25 years of hands-on experience</strong> in ISO management systems, OSHA compliance, and DOT regulation, our founders saw the same pattern repeated across hundreds of companies: safety managers drowning in paperwork, employers confused by recordability rules, and compliance gaps widening because expert guidance was either too expensive or too slow.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-primary">CCH was built to change that.</strong> As a DBA of ACSI (Assessment and Consulting Services International), CCH brings world-class compliance expertise to your fingertips — powered by AI, grounded in regulation, and backed by real auditors.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <img src={cchLogo} alt="Core Compliance Hub" className="w-40 h-40 object-contain" data-testid="img-cch-logo-about" />
              <div className="text-center space-y-2">
                <p className="text-2xl font-black text-primary">CCH</p>
                <p className="text-sm text-muted-foreground">A DBA of ACSI Services International</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-mission-title">Our Mission</h2>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-accent/10 to-accent/30 blur-xl -z-10 scale-110"></div>
              <div className="bg-black px-8 py-5 rounded-md border border-accent/40 shadow-[0_0_30px_rgba(var(--accent),0.15)]">
                <p className="text-lg md:text-xl font-black text-accent leading-snug">
                  To make occupational health and safety compliance simple, intelligent, and accessible — for every employer, at every level.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center" data-testid="card-mission-protect">
              <CardContent className="pt-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-primary">Protect</h3>
                <p className="text-sm text-muted-foreground">Safeguard your workforce and your business from preventable injuries, regulatory fines, and compliance failures.</p>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="card-mission-educate">
              <CardContent className="pt-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Lightbulb className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-primary">Educate</h3>
                <p className="text-sm text-muted-foreground">Empower employers with the knowledge to understand OSHA, DOT, and ISO requirements — not just check boxes.</p>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="card-mission-automate">
              <CardContent className="pt-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-primary">Automate</h3>
                <p className="text-sm text-muted-foreground">Leverage AI to eliminate manual compliance work, reduce human error, and streamline your entire safety ecosystem.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-corey-section-title">
              Meet Corey
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              The world's first AI born from the DNA of 29 CFR
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="space-y-5">
              <p className="text-muted-foreground leading-relaxed">
                Corey isn't a generic chatbot that was taught compliance last week. Corey is a <strong className="text-primary">Senior Occupational Health & Safety Compliance Expert and Lead ISO Auditor</strong> — an AI specialist built from the ground up with the full body of federal regulation embedded in its core.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every response Corey gives is grounded in <strong className="text-primary">OSHA 29 CFR, DOT 49 CFR Part 40</strong>, and comprehensive ISO standards including 9001, 14001, 45001, IATF 16949, AS9100, and more. This isn't an AI that guesses — it's an AI that <em>knows</em>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                From OSHA 300 recordability decisions to drug testing protocols, respiratory protection requirements to return-to-duty procedures — Corey delivers instant, regulation-backed answers 24 hours a day, 7 days a week.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary">Corey's Expertise Covers:</h3>
              <ul className="space-y-3">
                {[
                  "OSHA 300 Log Recordability & Reporting",
                  "DOT Medical Certification & Physicals",
                  "Drug & Alcohol Testing (DOT & Non-DOT)",
                  "Respiratory Protection Programs",
                  "Hearing Conservation Standards",
                  "Hazard Communication (HazCom / GHS)",
                  "Lockout/Tagout (LOTO) Procedures",
                  "Incident Investigation & Root Cause",
                  "ISO 9001, 14001, 45001 Frameworks",
                  "IATF 16949 & AS9100 Aerospace",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link href="/corey">
              <Button className="px-8" data-testid="button-try-corey">
                <Bot className="w-4 h-4 mr-2" />
                Talk to Corey Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-ecosystem-title">
              The CCH Ecosystem
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Three powerful brands working together to create the most comprehensive employer compliance and engagement platform in the industry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-visible" data-testid="card-ecosystem-cch">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <img src={cchLogo} alt="CCH" className="w-14 h-14 object-contain" />
                  <div>
                    <h3 className="text-lg font-bold text-primary">Core Compliance Hub</h3>
                    <p className="text-xs text-muted-foreground">The One Stop Employer Shop</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The AI-powered command center for occupational health and safety. Corey, OSHA 300 tools, employee tracking, incident logging, medical passports, training courses, and compliance dashboards — all in one platform.
                </p>
                <ul className="space-y-2">
                  {["AI Compliance Expert (Corey)", "OSHA 300 Decision Tool", "Employee Management", "Training & Certification", "Digital Medical Passport"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-visible" data-testid="card-ecosystem-acsi">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <img src={acsiLogo} alt="ACSI" className="w-14 h-14 object-contain" />
                  <div>
                    <h3 className="text-lg font-bold text-primary">ACSI Services International</h3>
                    <p className="text-xs text-muted-foreground">The Parent Organization</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The consulting powerhouse behind CCH. Over 25 years of ISO auditing, management system implementation, engineering services, and professional placement. When you need hands-on expert support, ACSI delivers.
                </p>
                <ul className="space-y-2">
                  {["ISO Consulting & Auditing", "Management System Implementation", "Mentorship Programs", "Engineering Services", "Professional Staffing & Placement"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="overflow-visible" data-testid="card-ecosystem-bns">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <img src={brandNSwagLogo} alt="BrandNSwag" className="w-14 h-14 object-contain" />
                  <div>
                    <h3 className="text-lg font-bold text-primary">BrandNSwag</h3>
                    <p className="text-xs text-muted-foreground">Smart Swag Division</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Employee recognition and engagement through QR-enabled branded merchandise. Making safety fun, rewarding compliance milestones, and building company culture through smart swag.
                </p>
                <ul className="space-y-2">
                  {["QR Recognition Platform", "Custom Swag Stores", "Points & Rewards System", "Safety Completion Awards", "Company Culture Building"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-accent flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-why-title">
              Why CCH Exists
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card data-testid="card-problem">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-bold text-destructive">The Problem</h3>
                <ul className="space-y-3">
                  {[
                    "Employers spend thousands on consultants for answers they need immediately",
                    "OSHA recordability decisions are made incorrectly, leading to fines and increased EMR",
                    "DOT compliance paperwork is scattered across spreadsheets and filing cabinets",
                    "Safety managers are overworked, under-resourced, and operating reactively",
                    "ISO implementation documents cost $10K+ from consulting firms",
                    "Language barriers at occupational clinics cause critical miscommunication",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0 mt-2"></div>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-solution">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-bold text-accent">The CCH Solution</h3>
                <ul className="space-y-3">
                  {[
                    "Corey delivers instant, regulation-backed answers 24/7 — no appointment needed",
                    "Interactive OSHA 300 decision tool walks you through every recordability question",
                    "Centralized employee management tracks physicals, drug tests, and expirations",
                    "Proactive compliance dashboard with alerts, heatmaps, and action queues",
                    "Training courses that educate your team at a fraction of consulting costs",
                    "Spanish Bilingual Medical Assistant bridges language gaps at the point of care",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-difference-title">
              What Makes CCH Different
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "Built for Compliance, Not Adapted",
                description: "Unlike generic AI tools, Corey was purpose-built from 29 CFR and DOT 49 CFR. Every response references actual regulation — not generic safety advice.",
              },
              {
                icon: Handshake,
                title: "Backed by Real Auditors",
                description: "ACSI's team of Lead ISO Auditors and compliance professionals stand behind every tool, template, and recommendation on the platform.",
              },
              {
                icon: Globe,
                title: "All-in-One Ecosystem",
                description: "Compliance AI, employee management, incident tracking, training, medical passports, and recognition — all under one roof. No more juggling 10 different systems.",
              },
              {
                icon: BookOpen,
                title: "Education-First Approach",
                description: "CCH doesn't just give you answers — it teaches you why. Understanding regulation builds lasting compliance culture, not just checkbox safety.",
              },
              {
                icon: Sparkles,
                title: "Continuously Evolving",
                description: "As regulations change, Corey evolves. New OSHA interpretations, DOT updates, and ISO revisions are incorporated to keep you ahead of the curve.",
              },
              {
                icon: Heart,
                title: "Built by People Who Care",
                description: "This isn't a tech company that discovered safety. This is a safety company that leveraged technology. Every feature exists because we've seen the real-world need.",
              },
            ].map((item) => (
              <Card key={item.title} className="overflow-visible" data-testid={`card-difference-${item.title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`}>
                <CardContent className="pt-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-primary">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-acsi-title">
              About ACSI Services International
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              The consulting powerhouse behind Core Compliance Hub
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-primary">ACSI Services International</strong> is a full-service consulting, auditing, engineering, and professional placement firm specializing in ISO management systems and organizational excellence.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With over <strong className="text-primary">25 years of experience</strong> across ISO 9001, ISO 14001, ISO 45001, and IATF 16949, ACSI has helped hundreds of companies close compliance gaps, build audit-ready systems, and develop internal teams that own the process — not just survive it.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                ACSI's services include management system consulting, Lead Auditor training, internal audit support, engineering services, corporate social responsibility (CSR) programs, and professional staffing solutions. CCH was created as ACSI's technology arm — bringing the same expertise to employers through AI and automation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" data-testid="button-visit-acsi">
                    <Globe className="w-4 h-4 mr-2" />
                    Visit acsi-quality.com
                  </Button>
                </a>
                <a href="tel:3134794545">
                  <Button variant="outline" data-testid="button-call-acsi">
                    <Phone className="w-4 h-4 mr-2" />
                    (313) 479-4545
                  </Button>
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <img src={acsiLogo} alt="ACSI Services International" className="w-48 h-48 object-contain" data-testid="img-acsi-logo-about" />
              <div className="grid grid-cols-2 gap-4 w-full">
                {[
                  { label: "Years Experience", value: "25+" },
                  { label: "ISO Standards", value: "10+" },
                  { label: "Industries Served", value: "50+" },
                  { label: "Audits Completed", value: "500+" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 rounded-md bg-accent/5 border border-accent/10">
                    <p className="text-xl font-black text-accent">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-industries-title">
              Industries We Serve
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              CCH and ACSI serve employers across every industry where compliance matters — which is every industry.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Manufacturing",
              "Construction",
              "Transportation & Logistics",
              "Healthcare & Medical",
              "Oil & Gas",
              "Aerospace & Defense",
              "Automotive",
              "Food & Beverage",
              "Pharmaceuticals",
              "Chemical Processing",
              "Warehousing & Distribution",
              "Utilities & Energy",
              "Mining",
              "Government & Municipal",
              "Agriculture",
              "Telecommunications",
            ].map((industry) => (
              <Badge key={industry} variant="outline" className="text-sm px-4 py-2" data-testid={`badge-industry-${industry.toLowerCase().replace(/\s+/g, '-').slice(0, 15)}`}>
                {industry}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[hsl(222,47%,11%)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-cta-title">
            Ready to Transform Your Compliance Program?
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Whether you need instant AI-powered answers, professional training, or full-service ISO consulting — the CCH ecosystem has you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href="/corey">
              <Button size="lg" className="bg-accent text-accent-foreground border-accent-border px-8" data-testid="button-cta-corey">
                <Bot className="w-5 h-5 mr-2" />
                Talk to Corey
              </Button>
            </Link>
            <Link href="/training">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/5 px-8" data-testid="button-cta-training">
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Training
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white/30 backdrop-blur-sm bg-white/5 px-8" data-testid="button-cta-contact">
                <Phone className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <img src={cchLogo} alt="CCH" className="w-8 h-8 object-contain" />
            <img src={acsiLogo} alt="ACSI" className="w-8 h-8 object-contain" />
            <img src={brandNSwagLogo} alt="BrandNSwag" className="w-8 h-8 object-contain" />
          </div>
          <p className="text-sm text-muted-foreground">
            Core Compliance Hub is a DBA of ACSI Services International
          </p>
          <p className="text-xs text-muted-foreground">
            acsi-quality.com | (313) 479-4545
          </p>
        </div>
      </footer>
    </div>
  );
}
