import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bot, Globe, BookOpen, Phone, CheckCircle2, Sparkles, TrendingUp, Heart, Lightbulb, Shield, GraduationCap, FileText, Users, Stethoscope, ClipboardList, AlertTriangle, Target, Zap, Building2, Award, Smartphone, Settings2 } from "lucide-react";
import logoUrl from "@assets/7_1772482223269.png";
import acsiLogo from "@assets/Transp1_1768928785892.png";
import cchLogo from "@assets/1_1770683748423.png";

export default function About() {
  useEffect(() => {
    document.title = "About Core Compliance Hub | Occupational Health & Safety Education Platform";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = "Core Compliance Hub is on a mission to educate employers on occupational health, safety compliance, and OSHA/DOT regulations. Powered by Corey AI — the world's first AI built from 29 CFR.";
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
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-[9999] bg-[hsl(222,47%,11%)] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/80" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <img src={logoUrl} alt="Core Compliance Hub" className="h-16 w-auto" />
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
            About Core Compliance Hub
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-foreground leading-tight" data-testid="text-about-title">
            Education Is Our Mission.<br /><span className="text-accent">Compliance Is Our Craft.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Core Compliance Hub exists for one reason: to educate employers on occupational health and safety — rooted in 29 CFR (Code of Federal Regulations, Title 29), where all of OSHA's safety and health standards are published. CCH is all about the regs. We exist so employers can understand them, apply them, protect their people, stay compliant, and grow with confidence.
          </p>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-origin-title">
                Why We Built CCH
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Every day, employers across America face a mountain of federal regulations they're expected to understand and follow — OSHA 300 recordkeeping, DOT medical requirements, drug and alcohol testing protocols, respiratory protection standards — the list never stops growing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The problem? Most employers don't have a dedicated safety director. They don't have a compliance team. They have a safety manager who's also the HR manager, the fleet coordinator, and the person who orders supplies. They're doing their best, but they're drowning.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">CCH was built to be the compliance partner they've never had.</strong> Not a consultant you call once a year. Not a binder on a shelf. A living, breathing platform that educates, tracks, and automates — every single day.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                CCH operates as a division of <strong className="text-foreground">ACSI, Assessment & Consulting Services Inc.</strong>, bringing decades of real-world audit and compliance expertise into an accessible, AI-powered platform that any employer can use.
              </p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <img src={cchLogo} alt="Core Compliance Hub" className="w-44 h-44 object-contain" data-testid="img-cch-logo-about" />
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-accent/10 to-accent/30 blur-xl -z-10 scale-110"></div>
                <div className="bg-black px-6 py-4 rounded-md border border-accent/40">
                  <p className="text-lg font-black text-accent text-center">
                    THE ONE STOP<br />EMPLOYER SHOP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-education-title">
              Education First — Everything Else Follows
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              At CCH, we believe that when employers truly understand the regulations — not just fear them — they build safer workplaces, reduce incidents, lower their EMR, and create a culture where compliance isn't a burden. It's a competitive advantage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                That belief is why we built <strong className="text-foreground">Corey</strong> — the world's first AI designed specifically for occupational health and safety compliance. Not a generic chatbot. Not a search engine. <strong className="text-foreground">A specialist that lives and breathes 29 CFR, DOT 49 CFR Part 40, and ISO management standards.</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Corey doesn't just answer questions — <strong className="text-foreground">Corey teaches.</strong> When you ask "Is this recordable?", Corey doesn't just say yes or no. Corey walks you through the regulation, explains why, and shows you how to document it correctly. That's education in action.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                It's also why we built professional training courses, interactive decision tools, compliance dashboards, and document templates — because education happens in many forms, and employers deserve all of them.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">How CCH Educates Employers:</h3>
              <ul className="space-y-3">
                {[
                  { icon: Bot, text: "Corey AI — instant, regulation-backed answers that explain the 'why' behind every rule" },
                  { icon: GraduationCap, text: "Professional training courses — DOT, OSHA, Drug Testing, ISO, and Recordkeeping mastery" },
                  { icon: ClipboardList, text: "OSHA 300 Decision Tool — interactive walkthrough that teaches recordability logic" },
                  { icon: FileText, text: "Document templates — pre-built compliance documents with regulatory references" },
                  { icon: Stethoscope, text: "Digital Medical Passport — educating clinics and employers on proper authorization" },
                  { icon: Lightbulb, text: "Clinic Communication Letters — teaching providers about first-aid treatment preferences" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-charge-title">
              Our Charge
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              The occupational health and safety landscape is broken for small and mid-sized employers. Here's what we're doing about it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card data-testid="card-reality">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  The Reality Employers Face
                </h3>
                <ul className="space-y-3">
                  {[
                    "A single misclassified OSHA recordable can spike your EMR for three years",
                    "DOT compliance violations carry fines up to $16,000 per occurrence",
                    "Most employers don't know if their drug testing program is actually compliant",
                    "Safety managers are expected to be experts in regulations they were never formally trained on",
                    "Consulting firms charge $200-$400/hour for answers employers need right now",
                    "One workplace fatality costs an average of $1.3 million — and that doesn't count the human cost",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0 mt-2"></div>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-cch-answer">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-bold text-accent flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  What CCH Delivers
                </h3>
                <ul className="space-y-3">
                  {[
                    "24/7 access to Corey, the compliance AI that references actual OSHA and DOT regulation",
                    "Interactive tools that teach recordability — not just dictate it",
                    "Training courses that turn your team into compliance-confident professionals",
                    "Employee tracking that alerts you before physicals, drug tests, and certifications expire",
                    "A compliance dashboard that shows exactly where your gaps are — and how to close them",
                    "All at a fraction of what a single consulting engagement would cost",
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
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-platform-title">
              More Than an AI — A Complete Compliance Ecosystem
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              CCH isn't just Corey. It's a full suite of tools designed to cover every aspect of your occupational health and safety program.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "Corey — AI Compliance Expert",
                description: "Your 24/7 compliance guardian. Ask anything about OSHA recordkeeping, DOT physicals, drug testing, respiratory protection, and more. Corey cites exact CFR sections — never blogs, never guesses.",
              },
              {
                icon: ClipboardList,
                title: "OSHA 300 Decision Tool",
                description: "The interactive 'Log It or Not' tool that walks you through OSHA's recordability criteria step by step per 29 CFR 1904. Learn the logic, not just the answer.",
              },
              {
                icon: Users,
                title: "Employee Management",
                description: "Track every employee's DOT physical dates, drug test results, 11 medical surveillance types, and random pool status. Automated alerts fire at 60, 30, 15, and 7 days before anything expires.",
              },
              {
                icon: GraduationCap,
                title: "Professional Training LMS",
                description: "Video courses with chapter modules, interactive quizzes, real-time progress tracking, and professional PDF certificates with QR verification codes — for your whole team.",
              },
              {
                icon: Stethoscope,
                title: "CCH Handshake — Digital Medical Passport",
                description: "QR-based clinic check-in that replaces paper authorization forms. Employee scans in, clinic sees full authorization details, and you get an instant text the moment they arrive.",
              },
              {
                icon: FileText,
                title: "23 Compliance Document Templates",
                description: "Policies, permits, forms, and assessments — every one referencing the exact CFR standard it's built from. Drug & Alcohol Programs, Confined Space Permits, Emergency Action Plans, JHAs, and more.",
              },
              {
                icon: TrendingUp,
                title: "Compliance Dashboard",
                description: "Real-time TRIR and DART rates, incident heatmaps, action queues, and audit readiness scores. See your compliance posture at a glance — and know exactly where your gaps are.",
              },
              {
                icon: Globe,
                title: "Bilingual Medical Assistant",
                description: "Real-time Spanish-English AI interpretation for occupational health clinics. Hands-free, bidirectional — provider speaks English, patient hears Spanish, and vice versa. Built for the clinic floor.",
              },
              {
                icon: Building2,
                title: "Incident Log & CAPA",
                description: "Full OSHA 300 and 301 log management with root cause analysis and corrective action plans. Task tracking, accountability assignments, and follow-up verification — all in one place.",
              },
              {
                icon: Settings2,
                title: "ACSI ISO Manager",
                description: "A dedicated Lead ISO Auditor AI for ISO 9001, 14001, and 45001. Gap analysis guidance, audit preparation, and direct connection to ACSI's certified auditors when you need boots on the ground.",
              },
              {
                icon: Award,
                title: "BrandNSwag — Employee Recognition",
                description: "Points-based recognition platform built around safety performance. QR-code recognition awards instant points for safety achievements, training completions, and compliance behavior — tied to a branded rewards catalog.",
              },
              {
                icon: Smartphone,
                title: "Corey as a Phone App",
                description: "Corey is a Progressive Web App — install it on iPhone or Android straight from the browser. No app store, no download. One tap from your home screen and your compliance expert is with you in the field.",
              },
            ].map((item) => (
              <Card key={item.title} className="overflow-visible" data-testid={`card-platform-${item.title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`}>
                <CardContent className="pt-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-[hsl(222,47%,11%)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Corey Lives on Your Phone</p>
                <p className="text-white/60 text-sm max-w-lg">
                  On iPhone, tap <strong className="text-white/80">Share → Add to Home Screen.</strong> On Android, tap <strong className="text-white/80">Install.</strong> Corey appears as a native app — no App Store, no Google Play. Compliance answers, one tap away, on any job site.
                </p>
              </div>
            </div>
            <Link href="/corey">
              <Button className="bg-accent text-black font-semibold whitespace-nowrap flex-shrink-0" data-testid="button-pwa-try-corey">
                <Bot className="w-4 h-4 mr-2" /> Try Corey Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-difference-title">
              What Sets CCH Apart
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {[
              {
                icon: Target,
                title: "Purpose-Built, Not Retrofitted",
                description: "CCH wasn't a tech company that pivoted into safety. We started in the field — on factory floors, in warehouses, at audit tables. Every feature was born from a real compliance problem we watched employers struggle with.",
              },
              {
                icon: BookOpen,
                title: "Education Over Enforcement",
                description: "We don't believe in scaring employers into compliance. We believe in educating them until compliance becomes second nature. When your team understands the 'why' behind 29 CFR, they don't just follow rules — they build culture.",
              },
              {
                icon: Zap,
                title: "Instant Access, Not Appointment-Based",
                description: "Traditional compliance support means calling a consultant, waiting for a callback, and paying by the hour. CCH gives you expert-level answers in seconds, any time of day, any day of the year.",
              },
              {
                icon: Heart,
                title: "We Actually Care About Your Workers",
                description: "Behind every regulation is a person who got hurt. Behind every recordability decision is a family. CCH exists because we believe every worker deserves to go home safe, and every employer deserves the tools to make that happen.",
              },
            ].map((item) => (
              <Card key={item.title} className="overflow-visible" data-testid={`card-diff-${item.title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`}>
                <CardContent className="pt-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-who-title">
              Who CCH Is For
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              If you have employees and you're responsible for keeping them safe and your company compliant, CCH was built for you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Safety Managers", desc: "Who wear ten hats and need reliable compliance answers without waiting for a consultant" },
              { title: "HR Directors", desc: "Managing DOT physicals, drug testing programs, and OSHA reporting alongside everything else" },
              { title: "Operations Managers", desc: "Responsible for keeping production moving while maintaining workplace safety standards" },
              { title: "Fleet Managers", desc: "Navigating DOT medical certifications, random drug pool requirements, and driver compliance" },
              { title: "Small Business Owners", desc: "Who can't afford a full-time safety director but still need expert-level compliance guidance" },
              { title: "Growing Companies", desc: "Scaling from 10 to 500 employees and need a compliance system that grows with them" },
            ].map((item) => (
              <Card key={item.title} className="overflow-visible" data-testid={`card-who-${item.title.toLowerCase().replace(/\s+/g, '-').slice(0, 15)}`}>
                <CardContent className="pt-6 space-y-2">
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-industries-title">
              Industries We Serve
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Occupational health and safety compliance touches every industry. CCH is built to serve them all.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Manufacturing", "Construction", "Transportation & Logistics", "Healthcare",
              "Oil & Gas", "Aerospace & Defense", "Automotive", "Food & Beverage",
              "Pharmaceuticals", "Chemical Processing", "Warehousing & Distribution",
              "Utilities & Energy", "Mining", "Government & Municipal", "Agriculture",
              "Telecommunications",
            ].map((industry) => (
              <Badge key={industry} variant="outline" className="text-sm px-4 py-2" data-testid={`badge-industry-${industry.toLowerCase().replace(/\s+/g, '-').slice(0, 15)}`}>
                {industry}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-acsi-title">
                Backed by ACSI, Assessment & Consulting Services Inc.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                CCH is a division of <strong className="text-foreground">ACSI, Assessment & Consulting Services Inc.</strong> — a consulting, auditing, and engineering firm with over 25 years of experience in ISO management systems and organizational excellence.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                When your compliance needs go beyond what AI and education tools can provide — when you need a Lead Auditor at your facility, a management system built from scratch, or hands-on crisis support — ACSI's team of professionals is ready to step in.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                CCH educates and automates. ACSI implements and audits. Together, they cover every stage of your compliance journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <a href="https://acsi-quality.com/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" data-testid="button-visit-acsi">
                    <Globe className="w-4 h-4 mr-2" />
                    acsi-quality.com
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
              <img src={acsiLogo} alt="ACSI, Assessment & Consulting Services Inc." className="w-40 h-40 object-contain" data-testid="img-acsi-logo-about" />
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Consulting, Auditing, Engineering, Training, Mentorship, and Professional Placement
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[hsl(222,47%,11%)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-cta-title">
            Your Compliance Journey Starts Here
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Whether you have a quick recordability question or you're building an entire compliance program from the ground up — CCH is here to educate, empower, and protect.
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
                <GraduationCap className="w-5 h-5 mr-2" />
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
          <img src={cchLogo} alt="CCH" className="w-10 h-10 object-contain mx-auto" />
          <p className="text-sm font-semibold text-foreground">Core Compliance Hub</p>
          <p className="text-xs text-muted-foreground">
            A division of ACSI, Assessment & Consulting Services Inc. | acsi-quality.com | (313) 479-4545
          </p>
        </div>
      </footer>
    </div>
  );
}
