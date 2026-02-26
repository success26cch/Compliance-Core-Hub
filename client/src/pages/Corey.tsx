import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStream, useConversations, useCreateConversation } from "@/hooks/use-chat";
import { useQuestionUsage } from "@/hooks/use-subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Bot, User, Plus, Lock, Mic, MicOff, MessageSquare, Shield,
  CheckCircle2, Sparkles, ArrowRight, Download, Smartphone, MoreVertical,
  Copy, Mail, FileText, Trash2, Pencil, Share2, FileDown, ClipboardCopy,
  Printer, Volume2, VolumeX, Square, ClipboardList, Search, Calendar, BookOpen, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { queryClient, apiRequest } from "@/lib/queryClient";
import logoUrl from "@assets/1_1767636977932.png";
import jsPDF from "jspdf";

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^---+$/gm, '')
    .replace(/^===+$/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[☐☑☒□■◻◼◽◾▢▣✓✗✘⬜⬛🔲🔳✅❎]/g, '[ ]')
    .replace(/&\s+(?=[A-Z])/g, '[ ] ');
}

export default function CoreyStandalone() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Bot className="w-12 h-12 text-accent" />
          <p className="text-white/60">Loading Corey...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <CoreyLanding />;
  }

  return <CoreyApp />;
}

function CoreyLanding() {
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/25">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">COREY</h1>
              <p className="text-xs text-white/50">by Core Compliance Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isInstallable && !isInstalled && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptInstall}
                className="border-accent/50 text-accent hover:bg-accent/10 gap-1.5"
                data-testid="button-pwa-install-header"
              >
                <Download className="w-4 h-4" />
                Install App
              </Button>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10" data-testid="link-cch-home">
                CCH Platform
              </Button>
            </Link>
            <a href="/api/login">
              <Button size="sm" className="bg-accent hover:bg-accent/90 shadow-lg shadow-accent/25" data-testid="button-corey-login">
                Sign In
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <section className="py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm border border-accent/20 mb-8">
            <Sparkles className="w-4 h-4" />
            THE ONLY AI BUILT FOR OCC-HEALTH
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight" data-testid="text-corey-hero">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">COREY</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            Your 24/7 AI compliance expert. OSHA recordkeeping, DOT regulations, drug testing, respirator compliance — instant answers backed by regulation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/api/login">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-lg px-8 py-6 shadow-xl shadow-accent/25" data-testid="button-corey-get-started">
                <Bot className="w-5 h-5 mr-2" /> Get Started Free
              </Button>
            </a>
            {isInstallable && !isInstalled && (
              <Button
                size="lg"
                variant="outline"
                onClick={promptInstall}
                className="border-accent/40 text-accent hover:bg-accent/10 text-lg px-8 py-6 gap-2"
                data-testid="button-pwa-install-hero"
              >
                <Smartphone className="w-5 h-5" /> Install App
              </Button>
            )}
            {!isInstallable && (
              <Link href="/">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6" data-testid="button-corey-learn-more">
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        <section className="pb-20">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/5 border-white/10 p-6 text-center" data-testid="card-corey-feature-1">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold text-white mb-2">OSHA Expert</h3>
              <p className="text-sm text-white/60">Instant recordability guidance citing OSHA 29 CFR 1904. Never second-guess a call again.</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6 text-center" data-testid="card-corey-feature-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-white mb-2">DOT Compliance</h3>
              <p className="text-sm text-white/60">DOT physicals, drug testing, Clearinghouse — answers backed by 49 CFR Part 40.</p>
            </Card>
            <Card className="bg-white/5 border-white/10 p-6 text-center" data-testid="card-corey-feature-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold text-white mb-2">Voice Enabled</h3>
              <p className="text-sm text-white/60">Ask your question by voice. Corey listens as long as you need — no interruptions.</p>
            </Card>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-8">Simple Pricing</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6" data-testid="card-corey-pricing-free">
                <Badge variant="secondary" className="mb-4">Free</Badge>
                <h4 className="text-3xl font-black text-white mb-2">$0</h4>
                <p className="text-white/50 text-sm mb-6">3 Corey questions per month</p>
                <ul className="space-y-3 text-sm text-white/70 text-left">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> OSHA recordability guidance</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Basic DOT compliance help</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Voice input</li>
                </ul>
              </Card>
              <Card className="bg-accent/10 border-accent/30 p-6 relative" data-testid="card-corey-pricing-unlimited">
                <Badge className="mb-4 bg-accent">Most Popular</Badge>
                <h4 className="text-3xl font-black text-white mb-2">$99<span className="text-lg font-normal text-white/50">/mo</span></h4>
                <p className="text-white/50 text-sm mb-6">Unlimited Corey interactions</p>
                <ul className="space-y-3 text-sm text-white/70 text-left">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Everything in Free</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Unlimited questions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Document generation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Export & share conversations</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" /> Priority support</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Core Compliance Hub" className="h-8 w-auto brightness-0 invert opacity-50" />
          </div>
          <p className="text-xs text-white/40">Powered by Core Compliance Hub</p>
          <Link href="/">
            <span className="text-xs text-white/40 hover:text-white/60 cursor-pointer">Visit Full Platform</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

function CoreyApp() {
  const { data: conversations, isLoading: isLoadingConvos } = useConversations();
  const { mutate: createConversation } = useCreateConversation();
  const { data: usageData, refetch: refetchUsage } = useQuestionUsage();
  const { user } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const { toast } = useToast();

  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleNewChat = () => {
    createConversation("New Question", {
      onSuccess: (data) => {
        setActiveConversationId(data.id);
        setSidebarOpen(false);
      },
    });
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE", credentials: "include" });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
      toast({ title: "Conversation deleted" });
    } catch {
      toast({ title: "Failed to delete conversation", variant: "destructive" });
    }
  };

  const handleRenameConversation = async (id: number) => {
    if (!renameValue.trim()) return;
    try {
      await apiRequest("PATCH", `/api/conversations/${id}`, { title: renameValue.trim() });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setRenamingId(null);
      setRenameValue("");
      toast({ title: "Conversation renamed" });
    } catch {
      toast({ title: "Failed to rename", variant: "destructive" });
    }
  };

  

  const QUICK_ACTIONS = [
    {
      id: "safety-meeting",
      title: "Lead a Safety Meeting",
      description: "Let Corey run a structured safety meeting with agenda, discussion, and action items.",
      icon: ClipboardList,
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
      prompt: "I need you to lead a safety meeting for my team right now. Please start by presenting a structured agenda with 3-4 safety topics relevant to a general industry workplace. For each topic, provide the OSHA regulatory reference, a brief talking point, and a discussion question to engage the team. After we go through the topics, help me summarize action items and generate meeting minutes I can distribute. Let's begin — present the agenda first.",
    },
    {
      id: "osha-300-audit",
      title: "Audit My OSHA 300",
      description: "Walk through a guided audit of your OSHA 300 Log for accuracy and compliance.",
      icon: Search,
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      prompt: "I need you to audit my OSHA 300 Log. Walk me through a guided Q&A audit per 29 CFR 1904. Start by asking me about my establishment information, then go through each required column of the OSHA 300 Log one by one. Check for common errors like: miscounted days away/restricted, cases that should have been recorded but weren't, privacy concern cases not properly handled, and whether my annual summary (300A) was posted correctly from February 1 to April 30. Ask me one question at a time and evaluate my answers against OSHA requirements.",
    },
    {
      id: "mock-inspection",
      title: "Mock OSHA Inspection",
      description: "Simulate what an OSHA compliance officer would ask during an inspection.",
      icon: AlertTriangle,
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      prompt: "Conduct a mock OSHA inspection of my workplace. Act as an OSHA Compliance Safety and Health Officer (CSHO) conducting an on-site inspection. Start with the opening conference — ask about my establishment, number of employees, and industry. Then walk me through what you would inspect: review of OSHA 300 logs, written programs (HazCom, LOTO, Respiratory), training records, PPE assessments, and walk-around observations. Ask me questions one at a time as if you were actually inspecting my facility. Flag any potential citations (Serious, Other-than-Serious, Willful, Repeat) and reference the specific 29 CFR standards. End with a closing conference summarizing findings.",
    },
    {
      id: "weekly-safety-topic",
      title: "Weekly Safety Topic",
      description: "Get a ready-to-present 5-minute safety talk with regulatory references.",
      icon: BookOpen,
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      prompt: "Generate a 5-minute weekly safety topic briefing I can present to my team today. Pick a relevant general industry safety topic and include: the specific OSHA standard reference (29 CFR), 3-4 key talking points, a real-world scenario or example, 2 discussion questions to engage the team, and one actionable takeaway. Format it so I can read it directly to my crew. Make it practical and engaging, not just regulatory text.",
    },
    {
      id: "compliance-calendar",
      title: "Compliance Calendar Check",
      description: "Review upcoming regulatory deadlines and required submissions.",
      icon: Calendar,
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      prompt: "Help me check my compliance calendar. Based on today's date, walk me through all upcoming OSHA, DOT, and EPA regulatory deadlines I should be aware of for the next 90 days. Include: OSHA 300A posting/removal dates, OSHA electronic submission deadlines (ITA), DOT random drug testing rate requirements, respirator fit test annual requirements, hearing conservation audiogram schedules, fire extinguisher inspections, and any other time-sensitive compliance obligations. Ask me about my industry and company size so you can tailor the deadlines to my situation.",
    },
  ];

  const DOCUMENT_TEMPLATES = [
    { category: "Policies & Programs", label: "Drug & Alcohol Policy", prompt: "Generate a complete Drug & Alcohol Policy document for our company based on 49 CFR Part 40 and FMCSA 49 CFR Part 382. Include all required sections: purpose, scope, definitions, prohibited conduct, testing types (pre-employment, random, reasonable suspicion, post-accident, return-to-duty, follow-up), consequences, SAP referral, confidentiality, and employee acknowledgment. Format it as a professional policy document ready for implementation." },
    { category: "Policies & Programs", label: "OSHA Recordkeeping SOP", prompt: "Generate a Standard Operating Procedure (SOP) for OSHA Recordkeeping based on 29 CFR 1904. Include sections for: determining work-relatedness, recordability decision criteria, first aid vs. recordable distinction, OSHA 300 Log maintenance, OSHA 300A annual summary posting requirements, OSHA 301 incident reports, employee privacy cases, electronic submission requirements, and responsible parties. Format as a professional SOP document." },
    { category: "Policies & Programs", label: "Respiratory Protection Program", prompt: "Generate a complete Respiratory Protection Program document per OSHA 29 CFR 1910.134. Include: program administrator responsibilities, workplace hazard evaluation, respirator selection, medical evaluations, fit testing procedures (qualitative and quantitative), training requirements, use and maintenance, breathing air quality, recordkeeping, and program evaluation. Format as a professional program document." },
    { category: "Policies & Programs", label: "Hearing Conservation Program", prompt: "Generate a Hearing Conservation Program document per OSHA 29 CFR 1910.95. Include: noise monitoring, audiometric testing program, hearing protection selection, employee training, recordkeeping requirements, action level (85 dBA) and PEL (90 dBA) procedures, baseline and annual audiograms, Standard Threshold Shift evaluation, and follow-up procedures." },
    { category: "Policies & Programs", label: "Hazard Communication Program", prompt: "Generate a Hazard Communication Program (HazCom/GHS) document per OSHA 29 CFR 1910.1200. Include: written program elements, chemical inventory, Safety Data Sheet management, container labeling requirements (GHS pictograms, signal words, hazard statements), employee training program, non-routine tasks, contractors, and recordkeeping." },
    { category: "Policies & Programs", label: "Lockout/Tagout (LOTO) Program", prompt: "Generate a complete Lockout/Tagout (LOTO) Program per OSHA 29 CFR 1910.147. Include: purpose and scope, definitions, responsibilities, energy control procedures, lockout/tagout device requirements, authorized and affected employee training, periodic inspections, group lockout procedures, shift/personnel changes, and contractor coordination." },
    { category: "Policies & Programs", label: "Emergency Action Plan", prompt: "Generate a complete Emergency Action Plan (EAP) per OSHA 29 CFR 1910.38. Include: emergency escape procedures and routes, critical plant operations procedures, employee headcount procedures after evacuation, rescue and medical duties, preferred means of reporting emergencies, names of persons to contact for further information, alarm system description, evacuation procedures for employees with disabilities, training requirements, and review schedule. Format as a professional plan document ready for implementation." },
    { category: "Policies & Programs", label: "Fire Prevention Plan", prompt: "Generate a complete Fire Prevention Plan per OSHA 29 CFR 1910.39. Include: list of all major fire hazards and proper handling/storage procedures for hazardous materials, potential ignition sources and their control, type of fire protection equipment necessary, procedures to control accumulation of flammable and combustible waste materials, procedures for regular maintenance of safeguards, names of responsible personnel for maintenance of fire prevention equipment, names of responsible personnel for control of fuel source hazards, housekeeping procedures, employee training requirements, and coordination with Emergency Action Plan. Format as a professional plan document." },
    { category: "Policies & Programs", label: "Bloodborne Pathogen Exposure Control Plan", prompt: "Generate a complete Bloodborne Pathogen Exposure Control Plan per OSHA 29 CFR 1910.1030. Include: exposure determination by job classification, schedule and methods of implementation, Hepatitis B vaccination program, post-exposure evaluation and follow-up procedures, communication of hazards (labels, signs, training), engineering and work practice controls, personal protective equipment requirements, housekeeping procedures, regulated waste disposal, laundry procedures, recordkeeping requirements (sharps injury log, training records, medical records), and annual plan review procedures. Format as a professional program document." },
    { category: "Policies & Programs", label: "Forklift/PIT Safety Program", prompt: "Generate a complete Forklift/Powered Industrial Truck (PIT) Safety Program per OSHA 29 CFR 1910.178. Include: program scope and purpose, types of powered industrial trucks covered, operator training requirements (formal instruction, practical training, evaluation), topics to be covered in training (truck-related topics, workplace-related topics), refresher training and evaluation triggers, operator certification documentation, pre-shift inspection procedures, safe operating procedures, load handling, traveling, fueling/charging, maintenance requirements, pedestrian safety, and recordkeeping. Format as a professional program document." },
    { category: "Policies & Programs", label: "Fall Protection Plan", prompt: "Generate a complete Fall Protection Plan per OSHA 29 CFR 1926.502. Include: identification of all fall hazards in the work area, methods of fall protection to be used (guardrails, safety nets, personal fall arrest systems), procedures for assembly, maintenance, inspection and disassembly of fall protection systems, procedures for handling, storage and securing of tools and materials, rescue procedures for workers who have fallen, training requirements for all employees exposed to fall hazards, duty to have fall protection at 6 feet in construction, leading edge work procedures, and documentation requirements. Format as a professional plan document." },
    { category: "Policies & Programs", label: "Electrical Safety Program", prompt: "Generate a complete Electrical Safety Program based on NFPA 70E and OSHA 29 CFR 1910 Subpart S. Include: program scope and purpose, qualified vs. unqualified person definitions, electrical hazard analysis procedures, arc flash risk assessment, shock risk assessment, approach boundaries (limited, restricted, prohibited), PPE requirements and selection (arc-rated clothing, insulated gloves, face shields), energized electrical work permit procedures, lockout/tagout coordination, safe work practices, training requirements for qualified and unqualified persons, equipment maintenance and inspection, portable electric equipment and extension cord safety, and recordkeeping requirements. Format as a professional program document." },
    { category: "Policies & Programs", label: "Process Safety Management Overview", prompt: "Generate a comprehensive Process Safety Management (PSM) program overview per OSHA 29 CFR 1910.119. Include all 14 elements: employee participation, process safety information, process hazard analysis (PHA), operating procedures, training (initial and refresher), contractors, pre-startup safety review, mechanical integrity, hot work permits, management of change (MOC), incident investigation, emergency planning and response, compliance audits, and trade secrets. For each element, describe the regulatory requirements, implementation steps, and documentation needs. Format as a professional program overview document." },
    { category: "Permits & Forms", label: "Return-to-Duty Checklist", prompt: "Generate a comprehensive Return-to-Duty Checklist for DOT-regulated employees per 49 CFR Part 40 Subpart O. Include: SAP initial evaluation, treatment/education completion, SAP follow-up evaluation, Clearinghouse reporting steps, return-to-duty test (negative drug / <0.02 alcohol), direct observation requirements, follow-up testing plan (minimum 6 tests in 12 months), employer documentation requirements, and employee acknowledgment." },
    { category: "Permits & Forms", label: "Incident Investigation Form", prompt: "Generate a comprehensive Incident Investigation Form and procedure based on OSHA 29 CFR 1904.7. Include: incident details (who, what, when, where), witness statements, root cause analysis (5 Whys, Fishbone), contributing factors, OSHA recordability determination, corrective actions, preventive measures, responsible parties, follow-up dates, and management sign-off. Format as a fillable form template." },
    { category: "Permits & Forms", label: "Confined Space Entry Permit", prompt: "Generate a complete Confined Space Entry Permit template per OSHA 29 CFR 1910.146. Include: permit space identification and location, purpose of entry, date and authorized duration, authorized entrants, attendants, and entry supervisors, hazards of the permit space, measures to isolate the space and eliminate/control hazards (lockout/tagout, purging, ventilating), acceptable entry conditions, results of initial and periodic atmospheric testing (oxygen, flammable gases, toxic substances), rescue and emergency services and contact information, communication procedures, equipment required (ventilation, PPE, lighting, barriers, rescue), hot work permit cross-reference if applicable, and entry supervisor sign-off. Format as a professional permit form." },
    { category: "Permits & Forms", label: "Hot Work Permit", prompt: "Generate a complete Hot Work Permit template for welding, cutting, brazing, and other spark-producing operations. Include: date, time, and duration of work, location and description of work to be performed, fire watch requirements (during and 60 minutes post-work), fire protection equipment required and verified, sprinkler system status, combustible materials clearance (35-foot radius), floor and wall opening protection, confined space considerations, atmospheric testing if applicable, responsible supervisor authorization, fire watch personnel acknowledgment, contractor information if applicable, and final inspection sign-off. Reference OSHA 29 CFR 1910.252 and NFPA 51B. Format as a professional permit form." },
    { category: "Permits & Forms", label: "Contractor Safety Pre-Qualification Form", prompt: "Generate a comprehensive Contractor Safety Pre-Qualification Form. Include sections for: company information, insurance certificates (general liability, workers compensation, auto), EMR (Experience Modification Rate) for past 3 years, OSHA 300 log summary (TRIR and DART rates) for past 3 years, written safety program verification, drug and alcohol testing program, employee training documentation, PPE program, OSHA citation history, safety personnel/competent person identification, subcontractor management procedures, emergency response capabilities, equipment inspection/maintenance records, references from previous clients, and contractor acknowledgment of host employer safety rules. Format as a professional pre-qualification form." },
    { category: "Meeting Tools", label: "Safety Meeting Agenda Template", prompt: "Generate a professional Safety Meeting Agenda Template that can be reused for weekly or monthly safety meetings. Include: meeting header (date, time, location, facilitator), attendance sign-in section, review of previous meeting action items, incident/near-miss review since last meeting, main safety topic presentation section (with space for regulatory reference), open discussion/employee concerns section, new business items, action items assignment (task, responsible person, due date), next meeting date and topic preview, and facilitator/manager sign-off. Reference OSHA's recommendation for regular safety meetings as part of an effective Injury and Illness Prevention Program. Format as a reusable professional template." },
    { category: "Meeting Tools", label: "Weekly Safety Topic Brief", prompt: "Generate a Weekly Safety Topic Brief template designed for 5-10 minute toolbox talks or safety moments. Include: topic title and date, applicable OSHA/DOT regulation reference, key talking points (3-5 bullet points), real-world scenario or case study, discussion questions for the crew (2-3 questions), key takeaway message, presenter name and sign-off, and attendee sign-in section. Also provide a list of 12 suggested weekly topics with their regulatory references covering: slip/trip/fall prevention, PPE proper use, heat illness prevention, electrical safety awareness, hazard communication/SDS review, fire extinguisher use, ladder safety, manual lifting/ergonomics, housekeeping, emergency evacuation review, hand tool safety, and driving safety. Format as a professional brief template." },
    { category: "Assessments", label: "Job Hazard Analysis (JHA)", prompt: "Generate a complete Job Hazard Analysis (JHA) template and instructions. Include: job title and department, date of analysis and analyst name, required PPE, training requirements, step-by-step job breakdown column, potential hazards for each step, recommended safe procedures/controls for each hazard, risk rating matrix (severity x probability), residual risk after controls, review and approval signatures. Also include instructions on how to conduct a JHA: selecting the job, breaking the job into steps, identifying hazards, and determining preventive measures. Reference OSHA Publication 3071 (Job Hazard Analysis). Format as a professional analysis template with a completed example for a common task." },
    { category: "Assessments", label: "New Employee Safety Orientation Checklist", prompt: "Generate a comprehensive New Employee Safety Orientation Checklist. Include sections covering: company safety policy overview, emergency action plan and evacuation routes, fire prevention and extinguisher locations, first aid kit locations and procedures, reporting injuries/incidents/near-misses, hazard communication and SDS locations, PPE requirements and issuance, lockout/tagout awareness, confined space awareness, electrical safety basics, fall protection (if applicable), machine guarding, housekeeping standards, drug and alcohol policy, workplace violence prevention, driver safety (if applicable), department-specific hazards, employee rights under OSHA, how to contact safety personnel, and employee acknowledgment signature with date. Format as a professional checklist with checkboxes for each item." },
    { category: "Assessments", label: "PPE Hazard Assessment", prompt: "Generate a complete PPE Hazard Assessment template per OSHA 29 CFR 1910.132. Include: workplace/job area identification, assessment date and certifying person, survey of workplace for hazards (impact, penetration, compression, chemical, heat, harmful dust, light/radiation, electrical, fall, noise), hazard sources identified by body area (head, eyes/face, hands, feet, body, hearing, respiratory), PPE selection for each identified hazard with specific standards referenced (ANSI Z87.1 for eye, ANSI Z89.1 for head, ASTM F2412/F2413 for foot, etc.), certification statement that the workplace hazard assessment has been performed per 29 CFR 1910.132(d)(2), employee training documentation, and periodic reassessment schedule. Format as a professional assessment form." },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-white/10 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              data-testid="button-toggle-sidebar"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/25">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-black text-white tracking-tight">COREY</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {usageData && !usageData.isPro && (
              <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 text-xs" data-testid="badge-corey-usage">
                {usageData.questionCount}/{usageData.freeLimit} free
              </Badge>
            )}
            {usageData?.isPro && (
              <Badge className="bg-accent/20 text-accent border-accent/30 text-xs" data-testid="badge-corey-unlimited">
                Unlimited
              </Badge>
            )}
            {isInstallable && !isInstalled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={promptInstall}
                className="text-accent hover:bg-accent/10 text-xs gap-1"
                data-testid="button-pwa-install-app"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </Button>
            )}
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-xs" data-testid="link-cch-platform">
                ← Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && (
          <div className="absolute inset-0 z-40 lg:hidden bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}

        <div className={`
          absolute lg:relative z-50 lg:z-auto
          w-64 h-full flex-shrink-0
          bg-slate-900 border-r border-white/10
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-3 border-b border-white/10">
            <Button onClick={handleNewChat} variant="outline" className="w-full justify-start gap-2 border-slate-500 bg-slate-800 text-white hover:bg-slate-700" data-testid="button-new-chat">
              <Plus className="w-4 h-4" /> New Question
            </Button>
          </div>
          <ScrollArea className="flex-1 p-2" style={{ height: 'calc(100% - 56px)' }}>
            <div className="space-y-1">
              {conversations?.map((conv: any) => (
                <div key={conv.id} className="group relative">
                  {renamingId === conv.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleRenameConversation(conv.id); }}
                      className="flex gap-1 px-1"
                    >
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-7 text-xs bg-white/10 border-white/20 text-white"
                        autoFocus
                        onBlur={() => setRenamingId(null)}
                        data-testid={`input-rename-${conv.id}`}
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors pr-8 ${
                        activeConversationId === conv.id
                          ? "bg-accent/20 text-accent font-medium"
                          : "text-white/70 hover:bg-white/10 hover:text-white/90"
                      }`}
                      data-testid={`button-conversation-${conv.id}`}
                    >
                      {conv.title}
                    </button>
                  )}
                  {renamingId !== conv.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-opacity"
                          data-testid={`button-conversation-menu-${conv.id}`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => { setRenamingId(conv.id); setRenameValue(conv.title); }}
                          data-testid={`menu-rename-${conv.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteConversation(conv.id)}
                          className="text-red-400 focus:text-red-400"
                          data-testid={`menu-delete-${conv.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {usageData && !usageData.canAsk && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6">
              <Card className="max-w-lg w-full p-8 text-center space-y-4 bg-slate-900 border-white/10 shadow-2xl" data-testid="card-corey-limit">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white">Monthly Limit Reached</h3>
                <p className="text-white/60">
                  Upgrade to Unlimited for unlimited Corey interactions, audit prep tools, and dedicated support.
                </p>
                <Link href="/settings">
                  <Button className="w-full bg-accent hover:bg-accent/90 mt-2" data-testid="button-corey-upgrade">
                    Unlimited Safety - $99/mo
                  </Button>
                </Link>
              </Card>
            </div>
          )}

          {activeConversationId ? (
            <CoreyChatInterface
              conversationId={activeConversationId}
              onMessageSent={() => refetchUsage()}
              documentTemplates={DOCUMENT_TEMPLATES}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-6 text-center overflow-y-auto">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-accent/60" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">Ask Corey Anything</h3>
              <p className="text-sm max-w-md mb-6">OSHA recordkeeping, DOT physicals, drug testing, respirator compliance — get instant, regulation-backed answers.</p>

              <div className="w-full max-w-2xl mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        createConversation(action.title, {
                          onSuccess: (data) => {
                            setActiveConversationId(data.id);
                            setTimeout(() => {
                              window.dispatchEvent(new CustomEvent("corey-auto-send", { detail: { prompt: action.prompt } }));
                            }, 300);
                          },
                        });
                      }}
                      className="flex flex-col items-start gap-2 p-4 rounded-lg bg-white/5 border border-white/10 text-left transition-colors hover:bg-white/10 hover:border-white/20"
                      data-testid={`quick-action-${action.id}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.iconBg}`}>
                        <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                      <span className="text-sm font-medium text-white/80">{action.title}</span>
                      <span className="text-xs text-white/40 leading-relaxed">{action.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 flex-wrap justify-center">
                <Button onClick={handleNewChat} className="bg-accent hover:bg-accent/90" data-testid="button-start-first-chat">
                  <Plus className="w-4 h-4 mr-2" /> Start a Conversation
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-white/10 border border-white/20 text-white font-semibold" data-testid="button-generate-document">
                      <FileText className="w-4 h-4 mr-2" /> Generate a Document
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-72 max-h-80 overflow-y-auto">
                    {["Policies & Programs", "Permits & Forms", "Meeting Tools", "Assessments"].map((cat, catIdx) => {
                      const items = DOCUMENT_TEMPLATES.filter(t => t.category === cat);
                      if (items.length === 0) return null;
                      return (
                        <DropdownMenuGroup key={cat}>
                          {catIdx > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuLabel className="text-xs text-white/50">{cat}</DropdownMenuLabel>
                          {items.map((tmpl) => {
                            const globalIdx = DOCUMENT_TEMPLATES.indexOf(tmpl);
                            return (
                              <DropdownMenuItem
                                key={globalIdx}
                                onClick={() => {
                                  createConversation(tmpl.label, {
                                    onSuccess: (data) => {
                                      setActiveConversationId(data.id);
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent("corey-auto-send", { detail: { prompt: tmpl.prompt } }));
                                      }, 300);
                                    },
                                  });
                                }}
                                data-testid={`menu-doc-template-${globalIdx}`}
                              >
                                <FileText className="w-3.5 h-3.5 mr-2 text-accent" />
                                {tmpl.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuGroup>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DocumentTemplate {
  category: string;
  label: string;
  prompt: string;
}

function CoreyChatInterface({
  conversationId,
  onMessageSent,
  documentTemplates
}: {
  conversationId: number;
  onMessageSent?: () => void;
  documentTemplates?: DocumentTemplate[];
}) {
  const { messages, sendMessage, isStreaming, limitReached } = useChatStream(conversationId, onMessageSent);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { isListening, speechSupported, toggleListening, stopListening } = useSpeechRecognition((transcript: string) => {
    setInput(transcript);
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.prompt) {
        sendMessage(detail.prompt);
        if (onMessageSent) setTimeout(() => onMessageSent(), 500);
      }
    };
    window.addEventListener("corey-auto-send", handler);
    return () => window.removeEventListener("corey-auto-send", handler);
  }, [sendMessage, onMessageSent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || limitReached) return;
    if (isListening) {
      stopListening();
    }
    sendMessage(input);
    setInput("");
    if (onMessageSent) {
      setTimeout(() => onMessageSent(), 500);
    }
  };

  const formatConversationText = useCallback(() => {
    return messages.map((msg) => {
      const role = msg.role === "user" ? "You" : "Corey";
      return `${role}:\n${msg.content}\n`;
    }).join("\n---\n\n");
  }, [messages]);

  const handleCopyConversation = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatConversationText());
      toast({ title: "Conversation copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [formatConversationText, toast]);

  const handleDownloadText = useCallback(() => {
    const text = `COREY — AI Compliance Expert\nCore Compliance Hub\nGenerated: ${new Date().toLocaleDateString()}\n${"=".repeat(50)}\n\n${formatConversationText()}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corey-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Conversation downloaded" });
  }, [formatConversationText, toast]);

  const handleDownloadDocument = useCallback(() => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMsg) {
      toast({ title: "No document to download", variant: "destructive" });
      return;
    }

    const cleanText = stripMarkdown(lastAssistantMsg.content);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const usableWidth = pageWidth - margin * 2;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const logoHeight = 18;
      const logoWidth = (img.width / img.height) * logoHeight;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(img, 'PNG', logoX, 10, logoWidth, logoHeight);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('Core Compliance Hub', pageWidth / 2, 32, { align: 'center' });
      doc.text(`Document Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: 'center' });

      doc.setDrawColor(200, 160, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, 40, pageWidth - margin, 40);

      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(cleanText, usableWidth);
      let y = 48;
      const pageHeight = doc.internal.pageSize.getHeight();

      for (const line of lines) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }
        const trimmed = line.trim();
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && /[A-Z]/.test(trimmed)) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          y += 3;
          doc.text(trimmed, margin, y);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          y += 7;
        } else {
          doc.text(line, margin, y);
          y += 6;
        }
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          'Generated by Corey — Core Compliance Hub | corecompliancehub.com',
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      doc.save(`corey-document-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF document downloaded" });
    };
    img.onerror = () => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COREY — AI Compliance Expert', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Core Compliance Hub', pageWidth / 2, 27, { align: 'center' });
      doc.text(`Document Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });

      doc.setDrawColor(200, 160, 50);
      doc.setLineWidth(0.5);
      doc.line(margin, 36, pageWidth - margin, 36);

      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(cleanText, usableWidth);
      let y = 44;
      const pageHeight = doc.internal.pageSize.getHeight();
      for (const line of lines) {
        if (y > pageHeight - 25) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      }
      doc.save(`corey-document-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF document downloaded" });
    };
    img.src = logoUrl;
  }, [messages, toast]);

  const handleEmailConversation = useCallback(async () => {
    if (!emailTo.trim()) return;
    const subject = encodeURIComponent("Corey Compliance Consultation — Core Compliance Hub");
    const body = encodeURIComponent(formatConversationText());
    window.open(`mailto:${emailTo.trim()}?subject=${subject}&body=${body}`, "_blank");
    setShowShareDialog(false);
    setEmailTo("");
    toast({ title: "Email client opened" });
  }, [emailTo, formatConversationText, toast]);

  const handleCopyLastResponse = useCallback(async () => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMsg) return;
    try {
      await navigator.clipboard.writeText(lastAssistantMsg.content);
      toast({ title: "Response copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [messages, toast]);

  const handlePrintConversation = useCallback(() => {
    const printContent = messages.map((msg) => {
      const role = msg.role === "user" ? "You" : "Corey";
      return `<div style="margin-bottom:20px;">
        <div style="font-weight:bold;color:${msg.role === 'user' ? '#3b82f6' : '#f59e0b'};margin-bottom:4px;font-size:14px;">${role}</div>
        <div style="white-space:pre-wrap;font-size:13px;line-height:1.6;color:#333;">${msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>`;
    }).join('<hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0;">');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Please allow pop-ups to print", variant: "destructive" });
      return;
    }
    printWindow.document.write(`
      <html><head><title>Corey — Compliance Consultation</title>
      <style>@media print { body { margin: 20px; } }</style></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:30px;">
        <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #f59e0b;padding-bottom:16px;">
          <h1 style="margin:0;font-size:22px;color:#0f172a;">COREY — AI Compliance Expert</h1>
          <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Core Compliance Hub | ${new Date().toLocaleDateString()}</p>
        </div>
        ${printContent}
        <div style="margin-top:30px;padding-top:16px;border-top:2px solid #f59e0b;text-align:center;font-size:11px;color:#94a3b8;">
          Generated by Corey — Core Compliance Hub | corecompliancehub.com
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [messages, toast]);

  const handleSpeak = useCallback((text: string, msgIdx: number) => {
    if (!('speechSynthesis' in window)) {
      toast({ title: "Text-to-speech is not supported in this browser", variant: "destructive" });
      return;
    }

    if (speakingMsgIdx === msgIdx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      speechSynthRef.current = null;
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoiceNames = [
      'Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Rishi',
      'Google UK English Female', 'Google UK English Male',
      'Google US English', 'Microsoft Aria', 'Microsoft Guy',
      'Microsoft Jenny', 'Microsoft Davis', 'Microsoft Sara',
      'English (America)+Aria', 'en-US-AriaNeural', 'en-US-JennyNeural',
    ];
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferred = enVoices.find(v => naturalVoiceNames.some(n => v.name.includes(n)))
      || enVoices.find(v => v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Premium'))
      || enVoices.find(v => v.name.includes('Google'))
      || enVoices.find(v => v.name.includes('Microsoft'))
      || enVoices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      setSpeakingMsgIdx(null);
      speechSynthRef.current = null;
    };
    utterance.onerror = () => {
      setSpeakingMsgIdx(null);
      speechSynthRef.current = null;
    };

    speechSynthRef.current = utterance;
    setSpeakingMsgIdx(msgIdx);
    window.speechSynthesis.speak(utterance);
  }, [speakingMsgIdx, toast]);

  const handleStopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeakingMsgIdx(null);
    speechSynthRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <>
      {messages.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrintConversation}
              className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
              data-testid="button-print-conversation"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            {speakingMsgIdx !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopSpeaking}
                className="text-accent hover:text-accent/80 hover:bg-accent/10 gap-1.5 text-xs"
                data-testid="button-stop-all-speaking"
              >
                <Square className="w-3 h-3 fill-current" /> Stop Reading
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-xs" data-testid="button-share-menu">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={handleCopyConversation} data-testid="menu-copy-conversation">
                  <ClipboardCopy className="w-3.5 h-3.5 mr-2" /> Copy Conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLastResponse} data-testid="menu-copy-last-response">
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copy Last Response
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowShareDialog(true)} data-testid="menu-email-conversation">
                  <Mail className="w-3.5 h-3.5 mr-2" /> Email / Forward
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadText} data-testid="menu-download-conversation">
                  <FileDown className="w-3.5 h-3.5 mr-2" /> Download Conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadDocument} data-testid="menu-download-document">
                  <FileText className="w-3.5 h-3.5 mr-2" /> Download as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {documentTemplates && documentTemplates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5 text-xs" data-testid="button-generate-doc-inline">
                  <FileText className="w-3.5 h-3.5" /> Generate Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
                {["Policies & Programs", "Permits & Forms", "Meeting Tools", "Assessments"].map((cat, catIdx) => {
                  const items = (documentTemplates || []).filter(t => t.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <DropdownMenuGroup key={cat}>
                      {catIdx > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs text-white/50">{cat}</DropdownMenuLabel>
                      {items.map((tmpl) => {
                        const globalIdx = (documentTemplates || []).indexOf(tmpl);
                        return (
                          <DropdownMenuItem
                            key={globalIdx}
                            onClick={() => {
                              sendMessage(tmpl.prompt);
                              if (onMessageSent) setTimeout(() => onMessageSent(), 500);
                            }}
                            data-testid={`menu-inline-doc-${globalIdx}`}
                          >
                            <FileText className="w-3.5 h-3.5 mr-2 text-accent" />
                            {tmpl.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Conversation</DialogTitle>
            <DialogDescription>Enter the email address to forward this conversation to.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="email@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              type="email"
              data-testid="input-email-forward"
            />
            <Button onClick={handleEmailConversation} disabled={!emailTo.trim()} data-testid="button-send-email">
              <Mail className="w-4 h-4 mr-2" /> Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-accent/60" />
              </div>
              <h3 className="text-white/80 font-medium mb-2">How can I help you today?</h3>
              <p className="text-white/60 text-sm max-w-md mx-auto">Ask about OSHA recordability, DOT compliance, drug testing protocols, or any workplace safety question.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["Is this injury recordable?", "DOT physical requirements", "Random drug testing rules", "Respirator fit testing", "Write me a Drug & Alcohol Policy"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-full bg-slate-700 border border-slate-500 text-white text-xs hover:bg-slate-600 transition-colors"
                    data-testid={`button-suggestion-${q.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                ${msg.role === 'user' ? 'bg-primary/80' : 'bg-gradient-to-br from-accent/30 to-primary/30'}
              `}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-accent" />}
              </div>
              <div className="group relative">
                <div className={`
                  rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] md:max-w-[75%]
                  ${msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-slate-700 text-white border border-slate-600 rounded-tl-sm'}
                `}>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content ? stripMarkdown(msg.content) : (isStreaming && idx === messages.length - 1 ? (
                      <span className="flex items-center gap-2 text-white/60">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                        Thinking...
                      </span>
                    ) : "")}
                  </div>
                </div>
                {msg.role === "assistant" && msg.content && !isStreaming && (
                  <div className="mt-1.5 ml-2 flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(msg.content);
                          toast({ title: "Copied" });
                        } catch {}
                      }}
                      className="text-white/60 hover:text-white flex items-center gap-1 text-xs"
                      data-testid={`button-copy-msg-${idx}`}
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.content, idx)}
                      className={`flex items-center gap-1 text-xs ${speakingMsgIdx === idx ? 'text-accent' : 'text-white/60 hover:text-white'}`}
                      data-testid={`button-speak-msg-${idx}`}
                    >
                      {speakingMsgIdx === idx ? (
                        <><VolumeX className="w-3 h-3" /> Stop</>
                      ) : (
                        <><Volume2 className="w-3 h-3" /> Listen</>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadDocument}
                      className="text-white/60 hover:text-white flex items-center gap-1 text-xs"
                      data-testid={`button-pdf-msg-${idx}`}
                    >
                      <FileDown className="w-3 h-3" /> PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-950/50">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={limitReached ? "Free limit reached — upgrade for unlimited access" : isListening ? "Listening... click mic to stop" : "Ask Corey a compliance question..."}
              className={`flex-1 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-accent/50 ${isListening ? "border-accent ring-2 ring-accent/20" : ""}`}
              disabled={isStreaming || limitReached}
              data-testid="input-corey-message"
            />
            {speechSupported && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                disabled={isStreaming || limitReached}
                className={`absolute right-1 top-1/2 -translate-y-1/2 ${isListening ? "text-accent" : "text-white/40 hover:text-white/70"}`}
                data-testid="button-corey-voice"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || limitReached || !input.trim()}
            className="bg-accent hover:bg-accent/90"
            data-testid="button-corey-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {isListening && (
          <p className="text-xs text-accent text-center mt-2 animate-pulse">
            Listening... take your time. Click the mic to stop.
          </p>
        )}
      </div>
    </>
  );
}
