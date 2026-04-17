import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Bot, ArrowRight, CheckCircle2, FileText,
  ClipboardList, Search, Calendar, BookOpen, AlertTriangle,
  Users, Zap, MessageSquare, Shield, Lock, Brain,
  Target, Award, Lightbulb, BarChart3, FileCheck,
  Mic, Download, Layers, ArrowLeft, Sparkles,
  ChevronDown, HardHat, Siren, Scale, Leaf
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import coreyImg from "@assets/9_1771983400638.png";
import logoUrl from "@assets/7_1772719327857.png";
import { CartTrigger } from "@/components/CartDrawer";
import TryCoreyChatWidget from "@/components/TryCoreyChatWidget";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const CAPABILITIES = [
  {
    icon: ClipboardList,
    title: "Lead Safety Meetings",
    description: "Corey runs your entire safety meeting — agenda, discussion questions, real-world scenarios, action items, and generates meeting minutes when you're done.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Search,
    title: "Audit Your OSHA 300 Log",
    description: "Walk through every incident on your log. Corey checks recordability, verifies TRIR/DART calculations, confirms 300A posting compliance, and flags patterns.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Siren,
    title: "Mock OSHA Inspection",
    description: "Experience exactly what happens when an OSHA CSHO shows up. Opening conference, walkaround, document requests, employee interviews, closing conference — all simulated.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: BookOpen,
    title: "Weekly Safety Topics",
    description: "Get a 5-minute safety talk every week with the CFR citation, a real enforcement example, and quiz questions to check your team's understanding.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Calendar,
    title: "Compliance Calendar",
    description: "Never miss a deadline. OSHA 300A posting, electronic submissions, audiometric testing windows, respirator fit tests, fire extinguisher inspections — Corey tracks them all.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: FileText,
    title: "42 Document Templates",
    description: "Generate policies, permits, checklists, and assessments with one click — from Emergency Action Plans to Confined Space Entry Permits, all referencing exact CFR standards.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Scale,
    title: "OSHA Recordability Guidance",
    description: "Not sure if an incident is recordable? Corey walks you through the 29 CFR 1904 decision tree and explains exactly why or why not.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Leaf,
    title: "EPA Environmental Compliance (40 CFR)",
    description: "Hazardous waste generator requirements (RCRA), SPCC oil spill plans, EPCRA Tier II and TRI reporting, industrial stormwater permits, Clean Air Act, TSCA asbestos and lead, RMP, CERCLA reportable quantities — all cited to the exact 40 CFR part and section.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

const DOCUMENT_CATEGORIES = [
  {
    category: "Policies & Programs",
    icon: Shield,
    templates: [
      "Drug & Alcohol Policy", "OSHA Recordkeeping SOP",
      "Respiratory Protection Program", "Hearing Conservation Program",
      "Hazard Communication Program", "Lockout/Tagout (LOTO) Program",
      "Emergency Action Plan", "Fire Prevention Plan",
      "Bloodborne Pathogen Exposure Control Plan", "Forklift/PIT Safety Program",
      "Fit for Duty Policy", "Fall Protection Plan",
      "Electrical Safety Program", "Process Safety Management Overview",
    ],
  },
  {
    category: "Permits & Forms",
    icon: FileCheck,
    templates: [
      "Fit for Duty (FFD) Form", "Return-to-Duty Checklist",
      "Incident Investigation Form", "Confined Space Entry Permit",
      "Hot Work Permit", "Contractor Safety Pre-Qualification Form",
      "Letter to the Clinic", "Digital Medical Passport Authorization",
      "Near Miss Report Form", "Corrective Action Plan (CAPA) Form",
      "Return-to-Work Authorization Letter", "Reasonable Suspicion Documentation Form",
      "Supervisor First Report of Injury", "Respirator Medical Evaluation Questionnaire",
      "DOT Driver Qualification File Checklist", "Medical Surveillance Consent Form",
    ],
  },
  {
    category: "Meeting Tools",
    icon: Users,
    templates: [
      "Safety Meeting Agenda Template", "Incident Review Meeting Agenda",
      "Toolbox Talk Sign-In Sheet", "Workplace Injury Debriefing Guide",
      "Weekly Safety Topic Brief",
    ],
  },
  {
    category: "Assessments",
    icon: BarChart3,
    templates: [
      "Job Hazard Analysis (JHA)", "New Employee Safety Orientation Checklist",
      "OSHA 300 Log Recordability Audit", "Safety Program Gap Assessment",
      "DOT Compliance Self-Assessment", "Drug Testing Program Compliance Audit",
      "PPE Hazard Assessment",
    ],
  },
];

const ANTI_HALLUCINATION_POINTS = [
  { icon: Lock, text: "Only cites OSHA (29 CFR), DOT (49 CFR), ISO, MSHA, EPA, NFPA, ANSI/ASSE, and NIOSH" },
  { icon: Shield, text: "Zero tolerance — never references blogs, articles, LinkedIn posts, or third-party interpretations" },
  { icon: Target, text: "Always provides exact CFR section numbers — or honestly says when to verify a subsection" },
  { icon: AlertTriangle, text: "Never guesses penalty amounts — uses current published OSHA maximums" },
  { icon: Scale, text: "Regulatory thresholds stated as-is — 6 feet means 6 feet, 0.04 BAC means 0.04" },
  { icon: Brain, text: "Acknowledges genuine regulatory ambiguity and explains enforcement interpretation" },
];

const REGULATIONS_COVERED = [
  "OSHA General Industry (29 CFR 1910)",
  "OSHA Construction (29 CFR 1926)",
  "OSHA Recordkeeping (29 CFR 1904)",
  "DOT/FMCSA Drug & Alcohol (49 CFR Part 40)",
  "Process Safety Management (29 CFR 1910.119)",
  "Permit-Required Confined Spaces (29 CFR 1910.146)",
  "Respiratory Protection (29 CFR 1910.134)",
  "Lockout/Tagout (29 CFR 1910.147)",
  "Hazard Communication (29 CFR 1910.1200)",
  "Powered Industrial Trucks (29 CFR 1910.178)",
  "Electrical Safety (29 CFR 1910 Subpart S)",
  "Fall Protection (29 CFR 1926 Subpart M)",
  "Crane & Derrick Standards (29 CFR 1926 Subpart CC)",
  "Bloodborne Pathogens (29 CFR 1910.1030)",
  "Hearing Conservation (29 CFR 1910.95)",
  "NFPA 70E Electrical Safety",
  "ANSI/ASSE Z359 Fall Protection",
  "Hazardous Waste — RCRA (40 CFR Parts 261–270)",
  "Spill Prevention — SPCC (40 CFR Part 112)",
  "Emergency Planning — EPCRA (40 CFR Parts 355, 370, 372)",
  "Toxic Release Inventory — TRI / Form R (40 CFR Part 372)",
  "Risk Management Program — RMP (40 CFR Part 68)",
  "Industrial Stormwater — NPDES/MSGP (40 CFR Part 122)",
  "Clean Air Act — NSPS (40 CFR Part 60)",
  "Clean Air Act — NESHAPs/MACT (40 CFR Parts 61 & 63)",
  "Title V Air Operating Permits (40 CFR Part 70)",
  "TSCA Asbestos — AHERA (40 CFR Part 763)",
  "Lead Renovation & Repair — RRP (40 CFR Part 745)",
  "Refrigerant Management — Section 608 (40 CFR Part 82)",
  "CERCLA Reportable Quantities (40 CFR Part 302)",
];

const TESTIMONIAL_STATS = [
  { value: "29 CFR", label: "Built from the DNA of federal regulations" },
  { value: "42", label: "Ready-to-generate document templates" },
  { value: "24/7", label: "Available whenever you need compliance guidance" },
  { value: "30+", label: "Major regulatory standards covered" },
];

export default function MeetCorey() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What makes Corey different from ChatGPT or other AI tools?",
      a: "ChatGPT is a brilliant generalist — it knows a little about everything. Corey knows everything about YOUR world. Here's the difference that matters: when you tell Corey you're a 200-employee food manufacturer in Texas with a DART rate of 2.1 and a DOT-regulated fleet, Corey doesn't just answer your question — it connects the dots across OSHA 29 CFR 1910, DOT 49 CFR, state plan requirements, your industry's NAICS code, and your specific risk profile simultaneously. ChatGPT doesn't know what an OSHA 300 log is for. Corey built it with you. ChatGPT can't tell you whether your lockout/tagout program has a gap that would trigger a Willful citation. Corey can — and then it generates the corrected procedure on the spot.\n\nCorey learns who you are. Through your subscriber profile, Corey understands your industry, your state, your workforce size, and your compliance responsibilities before you ask your first question. It doesn't give you generic OSHA text — it gives you the answer for a company like yours, in a jurisdiction like yours, with risks like yours. That's not a chatbot. That's a Senior Occupational Health & Safety Expert who has read every regulation ever written and has been waiting for your call.\n\nEvery other AI tool makes you do the connecting. You have to know what to ask, how to frame it, and which regulation applies. Corey already knows. It cross-references OSHA, DOT, EPA, NIOSH, ACGIH, and ANSI — and it tells you what matters to you right now, before an inspector does. No hallucinated citations. No vague advice. No generic templates. Just the right answer, built for your operation, backed by real regulatory authority. That's why Corey isn't a tool. Corey is your competitive advantage.",
    },
    {
      q: "Can Corey replace my Safety Director?",
      a: "Corey is designed to be the ultimate tool FOR your Safety Director — not a replacement. Think of Corey as the compliance expert who never sleeps, never forgets a regulation, and can generate documents in seconds. Your Safety Director brings the human judgment, site-specific knowledge, and leadership that no AI can replace. Together, they are unstoppable.",
    },
    {
      q: "How does the $199/month per user pricing work?",
      a: "Each Corey subscription is per individual user. Every user gets their own private conversation history, unlimited questions, all 42 document templates, Quick Actions (safety meetings, audits, inspections), and the full regulatory knowledge base. Team seats are managed through the Team Seats dashboard.",
    },
    {
      q: "What if Corey doesn't know the answer?",
      a: "Corey will tell you honestly. If a question involves state-specific regulations, emerging standards, or areas outside its regulatory expertise, Corey clearly states that and recommends consulting a specialist or your state OSHA plan. It will never make something up.",
    },
    {
      q: "How do I get started?",
      a: "Subscribe at $199/month per user and you'll have full access from day one — unlimited questions, all 42 document templates, every Quick Action, and the complete regulatory knowledge base. No hidden fees, no usage caps.",
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-white font-sans" data-testid="page-meet-corey">
      <nav className="sticky top-0 z-50 bg-[hsl(222,47%,9%)]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-home-logo">
              <img src={logoUrl} alt="CCHUB" className="h-14 w-auto" />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <CartTrigger />
            <Link href="/get-started">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-bold" data-testid="button-nav-get-started">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col lg:flex-row items-center gap-12"
          >
            <motion.div variants={fadeUp} className="flex-1 text-center lg:text-left">
              <Badge className="bg-accent/20 text-accent border-accent/30 mb-6 text-sm px-4 py-1.5" data-testid="badge-hero">
                The World's First AI Built From the DNA of 29 CFR
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight mb-6 text-white" data-testid="text-hero-title">
                Meet <span className="text-accent">Corey</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-4 max-w-2xl" data-testid="text-hero-subtitle">
                Your Senior Occupational Health, Safety & Compliance Expert — available 24/7. The compliance officer that never sleeps and never forgets a regulation.
              </p>
              <p className="text-base text-white/50 mb-8 max-w-xl">
                Not a chatbot. Not a search engine. Corey is the person in the office that everyone goes to — from the plant floor to the corner office.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-[60px]" />
                <img
                  src={coreyImg}
                  alt="Corey AI"
                  className="relative w-64 h-64 md:w-80 md:h-80 rounded-full object-cover border-4 border-accent/30 shadow-2xl shadow-accent/20"
                  data-testid="img-corey-hero"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {TESTIMONIAL_STATS.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center" data-testid={`stat-${i}`}>
                <div className="text-3xl md:text-4xl font-display font-extrabold text-accent mb-2">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24" id="capabilities">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge className="bg-white/10 text-white/80 border-white/10 mb-4">What Corey Can Do</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white" data-testid="text-capabilities-title">
              More Than Answers. <span className="text-accent">Actions.</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Corey doesn't just answer questions. Corey leads meetings, audits your logs, simulates inspections, generates documents, and proactively catches gaps before they become violations.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {CAPABILITIES.map((cap, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="bg-white/[0.03] border-white/5 hover:border-accent/30 transition-colors duration-300 h-full" data-testid={`card-capability-${i}`}>
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${cap.bg} flex items-center justify-center mb-4`}>
                      <cap.icon className={`w-6 h-6 ${cap.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{cap.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{cap.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 mb-4">Anti-Hallucination Protocol</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4" data-testid="text-trust-title">
              Zero Tolerance for <span className="text-red-400">Guessing.</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Other AI tools cite blog posts and guess at regulations. Corey is built from the actual DNA of 29 CFR. When compliance is on the line, accuracy isn't optional.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {ANTI_HALLUCINATION_POINTS.map((point, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/5" data-testid={`trust-point-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{point.text}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-full px-6 py-3">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <span className="text-sm text-white/60">
                When Corey doesn't know — Corey tells you. No fabrication. No guessing. Ever.
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge className="bg-white/10 text-white/80 border-white/10 mb-4">Proactive Compliance</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white" data-testid="text-proactive-title">
              Corey Doesn't Wait. <span className="text-accent">Corey Leads.</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Ask about respirators and Corey will also check your written program, fit testing schedule, and medical evaluations. That's what a real compliance expert does.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {[
              {
                icon: MessageSquare,
                title: "Asks Before Answering",
                description: "Corey asks about your industry, company size, state, and operations before giving advice. Tailored guidance beats generic answers every time.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                icon: Lightbulb,
                title: "Connects the Dots",
                description: "\"While we're on respirators — have you updated your written Respiratory Protection Program this year per 29 CFR 1910.134? And when was your last fit testing?\"",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                icon: Calendar,
                title: "Tracks Deadlines",
                description: "OSHA 300A posting (Feb 1 – Apr 30), electronic submissions, audiometric testing, respirator fit tests, fire extinguisher inspections — Corey reminds you before you miss them.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="bg-white/[0.03] border-white/5 h-full" data-testid={`proactive-card-${i}`}>
                  <CardContent className="p-8 text-center">
                    <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-5`}>
                      <item.icon className={`w-7 h-7 ${item.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 mb-4">Document Generation</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4" data-testid="text-documents-title">
              42 Templates. <span className="text-accent">One Click.</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Every template references the exact CFR standard. Generate policies, permits, checklists, and assessments instantly — then download as PDF.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {DOCUMENT_CATEGORIES.map((cat, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="bg-white/[0.03] border-white/5 h-full" data-testid={`doc-category-${i}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <cat.icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{cat.category}</h3>
                        <p className="text-xs text-white/40">{cat.templates.length} templates</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {cat.templates.map((t, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-white/50">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400/60 flex-shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Download className="w-4 h-4" />
              <span>Download as PDF</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Mic className="w-4 h-4" />
              <span>Voice-to-text input</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Layers className="w-4 h-4" />
              <span>Conversation history saved</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge className="bg-white/10 text-white/80 border-white/10 mb-4">Regulatory Coverage</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white" data-testid="text-regulations-title">
              Built From <span className="text-accent">Regulations.</span> Not Opinions.
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Every answer Corey gives traces back to an official regulatory source. Here's what's in Corey's DNA.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto"
          >
            {REGULATIONS_COVERED.map((reg, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5" data-testid={`regulation-${i}`}>
                <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm text-white/60">{reg}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <Badge className="bg-white/10 text-white/80 border-white/10 mb-4">Who Is Corey For?</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4" data-testid="text-audience-title">
              Everyone Goes to <span className="text-accent">Corey.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {[
              { icon: HardHat, role: "Safety Directors & EHS Managers", desc: "Lead meetings, audit logs, prepare for inspections, generate documents — all in one place." },
              { icon: Users, role: "HR Professionals", desc: "Navigate OSHA recordkeeping, workers' comp, DOT compliance, and return-to-work programs." },
              { icon: BarChart3, role: "Plant Managers & Operations VPs", desc: "Understand your exposure, track deadlines, and run compliance programs that actually work." },
              { icon: Scale, role: "Business Owners & Presidents", desc: "Know your OSHA citation exposure, understand penalty structures, and protect your workforce." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col p-6 rounded-xl bg-white/[0.04] border border-white/8 hover:bg-white/[0.07] hover:border-accent/30 transition-all duration-200" data-testid={`audience-card-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 leading-snug">{item.role}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <Badge className="bg-white/10 text-white/80 border-white/10 mb-4">FAQ</Badge>
            <h2 className="text-4xl font-display font-bold" data-testid="text-faq-title">
              Common Questions
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-3"
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  data-testid={`faq-${i}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-white">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  {expandedFaq === i && (
                    <div className="mt-4 space-y-3">
                      {faq.a.split('\n\n').map((para, pi) => (
                        <p key={pi} className="text-sm text-white/50 leading-relaxed">{para}</p>
                      ))}
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Try Corey Free ── */}
      <section className="py-20 bg-[hsl(222,47%,9%)]" data-testid="section-try-corey">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <span className="inline-block bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
              Live Demo
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
              Try Corey Right Now — <span className="text-accent">Free</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Ask him anything. OSHA citations, recordability decisions, DOT Part 40, ISO 45001 — 3 questions on us, no credit card required.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <TryCoreyChatWidget compact />
          </motion.div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-accent/10 via-transparent to-transparent" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <div className="relative inline-block mb-8">
              <img src={coreyImg} alt="Corey" className="w-24 h-24 rounded-full border-2 border-accent/30" data-testid="img-corey-cta" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-accent text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap" data-testid="badge-pricing">
                $199/mo per user
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="text-cta-title">
              Ready to Meet Your New <span className="text-accent">Compliance Expert?</span>
            </h2>
            <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
              Stop googling regulations. Stop second-guessing recordability. Stop scrambling before inspections. Corey is ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-10 py-6 text-lg gap-2" data-testid="button-cta-subscribe">
                  <Bot className="w-5 h-5" />
                  Subscribe — $199/mo
                </Button>
              </Link>
              <a href="/login">
                <Button size="lg" className="bg-white/10 border-2 border-white/30 text-white font-bold px-10 py-6 text-lg gap-2" data-testid="button-cta-signin">
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="CCHUB" className="h-6 w-auto" />
            <span className="text-sm text-white/40">Core Compliance Hub</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-white/40 hover:text-white/60">Home</Link>
            <Link href="/about" className="text-sm text-white/40 hover:text-white/60">About</Link>
            <Link href="/get-started" className="text-sm text-white/40 hover:text-white/60">Pricing</Link>
            <Link href="/contact" className="text-sm text-white/40 hover:text-white/60">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}