import { ProtectedLayout } from "@/components/Layout";
import { PlatformGate } from "@/components/PlatformGate";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowUpRight, 
  Activity, 
  Shield, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Stethoscope,
  TestTube,
  ClipboardList,
  MessageSquare,
  Phone,
  TrendingUp,
  Calendar,
  GraduationCap,
  BookOpen,
  RotateCcw,
  Volume2,
  FileText,
  QrCode,
  Search,
  X,
  Bot,
  LayoutDashboard,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Paperclip,
  Loader2,
  Send,
  ExternalLink
} from "lucide-react";
import { Link, useLocation } from "wouter";
import coreyVideo from "@assets/Dashboard_corey_1771768410962.mp4";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect, useCallback } from "react";
import { useCreateConversation } from "@/hooks/use-chat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type DashboardMetrics = {
  employeeCount: number;
  isoAuditReadiness: number;
  medicalSurveillance: number;
  drugScreenCleared: number;
  drugScreenPending: number;
  pendingActions: number;
  recordableIncidents6Mo: number;
  totalIncidents6Mo: number;
};

type ActionItem = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  category?: string;
  dueDate: string | null;
  status: string;
  type?: string;
  employeeId?: number;
  daysUntilExpiry?: number;
  employeeName?: string;
  employeePhone?: string | null;
};

type IncidentChartData = {
  month: string;
  total: number;
  recordable: number;
};

function CircularProgress({ value, size = 120, strokeWidth = 10, label }: { value: number; size?: number; strokeWidth?: number; label: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-primary">{value}%</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function IncidentChart({ data }: { data: IncidentChartData[] }) {
  const maxValue = Math.max(...data.map(d => d.total), 1);
  
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100px' }}>
              <div 
                className="w-full max-w-8 bg-primary/20 rounded-t relative"
                style={{ height: `${(item.total / maxValue) * 100}%`, minHeight: item.total > 0 ? '8px' : '2px' }}
              >
                {item.recordable > 0 && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-destructive/80 rounded-t"
                    style={{ height: `${(item.recordable / item.total) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary/20 rounded" />
          <span className="text-muted-foreground">Total Incidents</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-destructive/80 rounded" />
          <span className="text-muted-foreground">Recordable</span>
        </div>
      </div>
    </div>
  );
}

function ActionQueue({ actions, onComplete }: { actions: ActionItem[]; onComplete: (id: number) => void }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string | undefined, type: string | undefined) => {
    if (type === 'dot_expiration') return <Stethoscope className="w-4 h-4" />;
    switch (category) {
      case 'dot_expiry': return <Stethoscope className="w-4 h-4" />;
      case 'drug_test': return <TestTube className="w-4 h-4" />;
      case 'incident_review': return <FileWarning className="w-4 h-4" />;
      case 'training': return <ClipboardList className="w-4 h-4" />;
      case 'audit': return <Shield className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-accent mb-3" />
        <p className="text-muted-foreground">All caught up! No pending actions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {actions.slice(0, 5).map((action) => (
        <div 
          key={action.id} 
          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
          data-testid={`action-item-${action.id}`}
        >
          <div className="mt-0.5 text-muted-foreground">
            {getCategoryIcon(action.category, action.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{action.title}</span>
              <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                {action.priority}
              </Badge>
            </div>
            {action.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
            )}
            {action.dueDate && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {action.type === 'dot_expiration' ? (
            <Link href="/dot-notifications">
              <Button 
                size="sm" 
                variant="outline" 
                className="shrink-0 gap-1"
                data-testid={`action-dot-${action.employeeId}`}
              >
                <Stethoscope className="w-3 h-3" />
                Notify
              </Button>
            </Link>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              className="shrink-0"
              onClick={() => onComplete(action.id)}
              data-testid={`complete-action-${action.id}`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      {actions.length > 5 && (
        <p className="text-xs text-center text-muted-foreground">
          +{actions.length - 5} more actions
        </p>
      )}
    </div>
  );
}

function RetainerSupportDialog() {
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { message: string; phone: string }) => {
      return apiRequest('POST', '/api/retainer-support', data);
    },
    onSuccess: () => {
      toast({
        title: "Support Request Sent",
        description: "Our team will contact you within 24 hours.",
      });
      setOpen(false);
      setMessage('');
      setPhone('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-accent" data-testid="button-retainer-support">
          <Phone className="w-4 h-4" />
          Request Priority Support
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Priority Human Expert Support</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            As an Unlimited Safety subscriber, you have priority access to our human compliance experts. 
            Describe your issue and we'll get back to you within 24 hours.
          </p>
          <div>
            <label className="text-sm font-medium">Phone (optional)</label>
            <Input 
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-support-phone"
            />
          </div>
          <div>
            <label className="text-sm font-medium">What do you need help with?</label>
            <Textarea 
              placeholder="Describe your compliance question or issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              data-testid="input-support-message"
            />
          </div>
          <Button 
            className="w-full" 
            onClick={() => mutation.mutate({ message, phone })}
            disabled={!message.trim() || mutation.isPending}
            data-testid="button-submit-support"
          >
            {mutation.isPending ? 'Sending...' : 'Submit Priority Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type HelpContent = {
  title: string;
  what: string;
  how: string[];
  nextStep: string;
  nextHref?: string;
};

const HELP_CONTENT: Record<string, HelpContent> = {
  isoAuditReadiness: {
    title: "ISO Audit Readiness",
    what: "This gauge shows what percentage of your ISO compliance checklist items are marked complete. It covers ISO 9001 (Quality), ISO 14001 (Environmental), and ISO 45001 (Safety) standards.",
    how: [
      "Navigate to the ISO section via ACSI Mentorship to complete checklist items.",
      "Ask Corey to run a 'Gap Analysis' for any ISO standard — it will tell you exactly what's missing.",
      "Use the ACSI ISO Manager for guided audit prep and mock audits.",
      "Each completed item raises your readiness percentage in real time.",
    ],
    nextStep: "Ask Corey to run an ISO gap analysis now",
    nextHref: "/corey",
  },
  medicalSurveillance: {
    title: "Medical Surveillance",
    what: "Tracks the percentage of your employees with current DOT physicals and respiratory medical evaluations on file. OSHA and DOT require these to stay current for safety-sensitive roles.",
    how: [
      "Go to Employee Management and add or update each employee's exam dates.",
      "Track DOT physicals (required every 2 years for CDL drivers), respirator evaluations, hearing tests, PFTs, TB tests, Hep A/B/C, Tetanus, and vision tests.",
      "When an employee's exam is expiring, the Action Queue will alert you automatically.",
      "Use the DOT Notifications tool to send reminder texts to employees.",
    ],
    nextStep: "Update employee medical records",
    nextHref: "/employees",
  },
  drugScreen: {
    title: "Drug Screen Status",
    what: "Shows how many employees are cleared (passed their drug screen) vs. pending (test ordered but result not yet entered). FMCSA and DOT require drug screening for safety-sensitive positions.",
    how: [
      "When an employee is tested, log the result in Employee Management under their profile.",
      "Cleared = negative result entered. Pending = test ordered, awaiting result.",
      "For DOT random pools, make sure every CDL driver is enrolled in your random selection program.",
      "Ask Corey to generate a Drug & Alcohol Policy per 49 CFR Part 40 if you don't have one.",
    ],
    nextStep: "Manage employee drug screen records",
    nextHref: "/employees",
  },
  quickStats: {
    title: "Quick Stats",
    what: "A real-time snapshot of your compliance health: total employees in the system, open action items requiring your attention, and recordable OSHA incidents logged in the past 6 months.",
    how: [
      "Add all employees to keep your stats accurate — the system can't track what it doesn't know about.",
      "Work down the Action Queue regularly to keep pending actions at zero.",
      "Recordables (6mo) should trend toward zero — even one recordable can impact your OSHA 300 report.",
      "A high number of pending actions is a signal to review your compliance calendar.",
    ],
    nextStep: "View your Action Queue",
    nextHref: "/dashboard",
  },
  incidentChart: {
    title: "Incident Trend Chart",
    what: "A 6-month bar chart showing total workplace incidents (blue) vs. OSHA-recordable incidents (red). This is the data that feeds your OSHA 300 Log — required for employers with 10+ employees.",
    how: [
      "Log every workplace injury or illness in the Incident Log — even if it ends up not being recordable.",
      "Use Corey's 'Audit My OSHA 300' action to spot errors before an OSHA inspection.",
      "Use the OSHA 300 Decision Tree to determine recordability for any incident in seconds.",
      "Keep recordables as low as possible — OSHA uses this data for inspection targeting.",
    ],
    nextStep: "Log a workplace incident",
    nextHref: "/incidents",
  },
  actionQueue: {
    title: "Action Queue",
    what: "Your prioritized to-do list of compliance tasks. Items are auto-generated when DOT physicals are expiring, drug tests are pending, incidents need review, or you manually add action items. Urgent items appear at the top.",
    how: [
      "Work through urgent (red) items first — these represent the highest compliance risk.",
      "Click the checkmark to mark items complete and remove them from the queue.",
      "DOT expiration alerts include a 'Notify' button that sends a reminder text to your employee.",
      "Action items can be added manually under the Incident Log or Employee Management pages.",
    ],
    nextStep: "Clear your open action items",
    nextHref: "/dashboard",
  },
  employeeManagement: {
    title: "Employee Management",
    what: "Your central employee database. Store contact info, job roles, hire dates, and all medical surveillance records including DOT physicals, drug screens, hearing tests, respirator fit tests, vaccines, and more.",
    how: [
      "Add every employee before assigning training or generating passports.",
      "Enter each employee's phone number — the system uses it for automatic SMS notifications.",
      "Fill in medical surveillance dates for each employee to power the Medical Surveillance metric.",
      "Use the DER Phone field in Account Settings so you receive training completion alerts.",
    ],
    nextStep: "Add or update your employees",
    nextHref: "/employees",
  },
  incidentLog: {
    title: "Incident Log (OSHA 300)",
    what: "Record and track every workplace injury and illness. The log automatically applies OSHA 29 CFR 1904 recordability criteria and feeds your OSHA 300 report. Each entry can include a Corrective Action Plan (CAPA).",
    how: [
      "Log incidents within 24 hours of occurrence to stay compliant.",
      "Use the OSHA 300 Decision Tree first if you're unsure whether an injury is recordable.",
      "For every recordable, complete a CAPA to document corrective actions taken.",
      "At year-end, use Corey to audit your OSHA 300 log before the posting deadline (Feb 1).",
    ],
    nextStep: "Log a new incident",
    nextHref: "/incidents",
  },
  employerTraining: {
    title: "Employer Training Portal",
    what: "Assign OSHA compliance training courses to your employees and track their progress in real time. Employees receive an automatic text with their training link the moment you assign a course. The DER is notified by text when each course is completed.",
    how: [
      "Click 'Assign Course' and pick the employee(s) and course(s) — they're texted immediately.",
      "Use 'New Hire Onboarding' to bundle all 6 BrandNSwag safety courses with a 24-hour deadline.",
      "Employees complete training in their browser — no login or app download needed.",
      "Completion certificates are generated automatically and stored in their profile.",
    ],
    nextStep: "Open the Training Portal",
    nextHref: "/employer-training",
  },
  myCourses: {
    title: "My Courses",
    what: "Access any courses you've personally purchased or been assigned. Complete video modules and quizzes at your own pace, and download your certificate of completion when finished.",
    how: [
      "Courses are broken into video modules with a quiz at the end of each module.",
      "You must pass each quiz to advance to the next module.",
      "Your certificate includes a unique QR verification code — share it with your employer or regulatory body.",
      "Completed courses and certificates are stored here permanently for your records.",
    ],
    nextStep: "Continue or start a course",
    nextHref: "/training?tab=my-courses",
  },
  askCorey: {
    title: "Ask Corey — AI Compliance Expert",
    what: "Corey is the World's First AI built from the DNA of 29 CFR — a Senior Occupational Health, Safety & Compliance Expert. Ask any OSHA, DOT, or ISO question and get a precise, regulation-cited answer in seconds.",
    how: [
      "Use Quick Action cards: Lead a Safety Meeting, Audit My OSHA 300, Mock OSHA Inspection, Weekly Safety Topic.",
      "Open the Documents Panel to generate any of 42 compliance documents instantly.",
      "For ISO work, ask Corey to connect you with the ACSI ISO Manager for a gap analysis.",
      "Corey never hallucinates — it cites only official regulatory sources (OSHA, DOT, CFR).",
    ],
    nextStep: "Open Corey AI now",
    nextHref: "/corey",
  },
  decisionTree: {
    title: "OSHA 300 Decision Tree",
    what: "A 5-question interactive tool that determines in minutes whether a workplace injury or illness is OSHA recordable under 29 CFR 1904. No login required — share it with supervisors or HR.",
    how: [
      "Answer the 5 questions about the injury: work-related? new case? one of the general recording criteria?",
      "The tool gives you a clear YES/NO recordability determination with the regulatory citation.",
      "Use it immediately after any incident before deciding whether to log it on the OSHA 300.",
      "If you're still unsure, bring the scenario to Corey for a deeper analysis.",
    ],
    nextStep: "Start the decision tree",
    nextHref: "/decision-tree",
  },
  clinicLetter: {
    title: "Clinic Communication Letter",
    what: "Generate a professional letter that instructs your occupational health clinic on your company's treatment preferences — light duty policies, first-aid-only treatment, OTC medication authorization, and restriction language per 29 CFR 1904.7(a).",
    how: [
      "Fill in your company name, DER contact, and specific treatment preferences.",
      "The generated letter can be faxed or emailed to your clinic before your employee arrives.",
      "Update the letter whenever your policies change — especially after an OSHA inspection.",
      "Giving your clinic clear instructions upfront reduces recordable incidents from unnecessary prescription treatment.",
    ],
    nextStep: "Generate a clinic letter",
    nextHref: "/clinic-letter",
  },
  digitalPassport: {
    title: "Digital Medical Passport (CCHUB Handshake)",
    what: "Generate a QR code for each employee that links to their digital clinic authorization form. When the employee arrives at the clinic, staff scan the QR code to access the pre-filled form — and you're instantly notified by text.",
    how: [
      "Generate a passport for each employee in the Digital Medical Passport section.",
      "Print or text the QR code to the employee before their clinic visit.",
      "When the clinic scans the code, you'll receive an automatic 'I'm Here' notification.",
      "The form captures treatment authorizations, emergency contacts, and employer notifications — all HIPAA-compliant.",
    ],
    nextStep: "Generate an employee passport",
    nextHref: "/employee-passport",
  },
};

function HelpTip({ id }: { id: keyof typeof HELP_CONTENT }) {
  const content = HELP_CONTENT[id];
  if (!content) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-accent/20 text-muted-foreground hover:text-accent transition-colors shrink-0"
          data-testid={`help-tip-${id}`}
          aria-label={`Help: ${content.title}`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl" side="bottom" align="start">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <HelpCircle className="w-4 h-4 text-accent shrink-0" />
            <h3 className="font-semibold text-sm">{content.title}</h3>
          </div>

          <div>
            <p className="text-xs text-muted-foreground leading-relaxed">{content.what}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-xs font-semibold text-foreground">How to maximize it</span>
            </div>
            <ul className="space-y-1.5">
              {content.how.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="text-accent font-bold mt-0.5 shrink-0">›</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {content.nextHref && (
            <div className="border-t pt-2">
              <Link href={content.nextHref}>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                  <ListChecks className="w-3.5 h-3.5" />
                  Next step: {content.nextStep}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SEARCH_INDEX = [
  { label: "Compliance Dashboard", description: "Your main compliance overview and metrics", href: "/dashboard", icon: LayoutDashboard, category: "Pages" },
  { label: "Ask Corey — AI Compliance Expert", description: "Get instant OSHA, DOT, and safety answers from Corey AI", href: "/corey", icon: Bot, category: "Pages" },
  { label: "Employee Management", description: "Add employees, track DOT physicals, drug tests, medical surveillance", href: "/employees", icon: Users, category: "Pages" },
  { label: "Incident Log", description: "Record workplace incidents, OSHA 300 log, CAPA tracking", href: "/incidents", icon: FileWarning, category: "Pages" },
  { label: "Employer Training Portal", description: "Assign compliance courses, track employee progress", href: "/employer-training", icon: GraduationCap, category: "Pages" },
  { label: "My Courses", description: "Access your purchased training courses and certificates", href: "/training?tab=my-courses", icon: BookOpen, category: "Pages" },
  { label: "Clinic Communication Letter", description: "Generate a letter for your occupational health clinic", href: "/clinic-letter", icon: FileText, category: "Tools" },
  { label: "Digital Medical Passport (CCHUB Handshake)", description: "QR-based clinic authorization forms, instant employer notifications", href: "/employee-passport", icon: QrCode, category: "Tools" },
  { label: "OSHA 300 Decision Tree", description: "Determine if an injury is OSHA recordable in minutes", href: "/decision-tree", icon: ClipboardList, category: "Tools" },
  { label: "Account Settings", description: "Manage your subscription, billing, and account info", href: "/settings", icon: Activity, category: "Pages" },
  { label: "Team Management", description: "Manage seats and team access for Corey AI", href: "/team", icon: Users, category: "Pages" },
  { label: "Platform Tour", description: "Interactive walkthrough of all CCHUB features", href: "/demo-tour", icon: Shield, category: "Pages" },
  { label: "Drug & Alcohol Policy", description: "Generate per 49 CFR Part 40 / FMCSA 382", href: "/corey", icon: FileText, category: "Documents" },
  { label: "OSHA Recordkeeping SOP", description: "Generate per 29 CFR 1904", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Respiratory Protection Program", description: "Generate per 29 CFR 1910.134", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Hearing Conservation Program", description: "Generate per 29 CFR 1910.95", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Emergency Action Plan", description: "Generate per 29 CFR 1910.38", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Bloodborne Pathogen Exposure Control Plan", description: "Generate per 29 CFR 1910.1030", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Fit for Duty (FFD) Form", description: "Employee fitness evaluation form for clinic visits", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Incident Investigation Form", description: "Root cause analysis and corrective action template", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Confined Space Entry Permit", description: "Generate per 29 CFR 1910.146", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Hot Work Permit", description: "Generate per OSHA 29 CFR 1910.252 / NFPA 51B", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Return-to-Duty Checklist", description: "DOT RTD steps per 49 CFR Part 40 Subpart O", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Job Hazard Analysis (JHA)", description: "Step-by-step hazard assessment template", href: "/corey", icon: FileText, category: "Documents" },
  { label: "PPE Hazard Assessment", description: "Generate per 29 CFR 1910.132", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Safety Meeting Agenda", description: "Reusable professional meeting template", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Weekly Safety Topic Brief", description: "5-10 minute toolbox talk template", href: "/corey", icon: FileText, category: "Documents" },
  { label: "New Employee Safety Orientation Checklist", description: "Comprehensive onboarding safety checklist", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Contractor Safety Pre-Qualification Form", description: "Vet contractors before they come on site", href: "/corey", icon: FileText, category: "Documents" },
  { label: "Lead a Safety Meeting", description: "Corey leads a full safety meeting for your team", href: "/corey", icon: Bot, category: "Corey AI Actions" },
  { label: "Audit My OSHA 300 Log", description: "Corey reviews your 300 log for errors and risks", href: "/corey", icon: Bot, category: "Corey AI Actions" },
  { label: "Mock OSHA Inspection", description: "Corey walks through a mock inspection with you", href: "/corey", icon: Bot, category: "Corey AI Actions" },
  { label: "Weekly Safety Topic", description: "Corey generates a ready-to-use 5-minute safety talk", href: "/corey", icon: Bot, category: "Corey AI Actions" },
  { label: "Compliance Calendar Check", description: "Corey identifies upcoming deadlines for your company", href: "/corey", icon: Bot, category: "Corey AI Actions" },
  { label: "How does ISO Audit Readiness work?", description: "Your ISO readiness gauge shows % of checklist items complete. Ask Corey for a gap analysis to raise your score. Covers ISO 9001, 14001, and 45001.", href: "/corey", icon: HelpCircle, category: "How it Works" },
  { label: "How does Medical Surveillance tracking work?", description: "Track DOT physicals, hearing tests, fit tests, vaccines, and more per employee. Expiring exams trigger automatic Action Queue alerts.", href: "/employees", icon: HelpCircle, category: "How it Works" },
  { label: "How does Drug Screen Status work?", description: "Log test results in Employee Management. Cleared = negative result on file. Pending = test ordered but result not yet entered.", href: "/employees", icon: HelpCircle, category: "How it Works" },
  { label: "How does the Action Queue work?", description: "Auto-generated compliance to-do list. DOT expirations, pending drug tests, and incident reviews appear here automatically by priority.", href: "/dashboard", icon: HelpCircle, category: "How it Works" },
  { label: "How does the Incident Chart work?", description: "Tracks recordable vs. total incidents over 6 months. Data feeds your OSHA 300 Log. Use the Decision Tree to determine recordability.", href: "/incidents", icon: HelpCircle, category: "How it Works" },
  { label: "How does Employee Management work?", description: "Central database for all employees. Store contact info, DOT physical dates, drug screen results, vaccine records, and medical surveillance data.", href: "/employees", icon: HelpCircle, category: "How it Works" },
  { label: "How does the Incident Log work?", description: "Record every workplace injury or illness. System applies 29 CFR 1904 recordability criteria and generates OSHA 300 entries and CAPA forms.", href: "/incidents", icon: HelpCircle, category: "How it Works" },
  { label: "How does the Employer Training Portal work?", description: "Assign OSHA courses to employees. They get an auto-text with their unique training link. You and DER are notified upon completion.", href: "/employer-training", icon: HelpCircle, category: "How it Works" },
  { label: "How does Corey AI work?", description: "Ask OSHA, DOT, or ISO questions. Use Quick Actions, generate 42 compliance documents, run mock inspections, lead safety meetings, and audit your OSHA 300.", href: "/corey", icon: HelpCircle, category: "How it Works" },
  { label: "How does the OSHA Decision Tree work?", description: "Answer 5 questions about any injury to get an immediate recordability determination under 29 CFR 1904 with the exact regulation cited.", href: "/decision-tree", icon: HelpCircle, category: "How it Works" },
  { label: "How does the Clinic Communication Letter work?", description: "Generate a letter instructing your clinic on treatment preferences, first-aid-only policies, and restriction wording to avoid unnecessary recordables.", href: "/clinic-letter", icon: HelpCircle, category: "How it Works" },
  { label: "How does the Digital Medical Passport work?", description: "Generate a QR code for each employee. Clinic scans it at check-in to pull up their authorization form. You get an immediate text notification.", href: "/employee-passport", icon: HelpCircle, category: "How it Works" },
  { label: "How do training notifications work?", description: "Employees are automatically texted their course link when assigned. Your DER receives a text with the certificate number when training is complete.", href: "/employer-training", icon: HelpCircle, category: "How it Works" },
  { label: "How does BrandNSwag new hire onboarding work?", description: "Assign all 6 OSHA safety courses as a bundle with a 24-hour deadline. Employees earn 100 points and a QR reward code upon completion.", href: "/employer-training", icon: HelpCircle, category: "How it Works" },
];

function DashboardSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = query.trim().length > 1
    ? SEARCH_INDEX.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const categoryColors: Record<string, string> = {
    "Pages": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "Tools": "bg-green-500/10 text-green-600 dark:text-green-400",
    "Documents": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "Corey AI Actions": "bg-purple-500/10 text-purple-400",
    "How it Works": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  };

  return (
    <div className="relative w-full" data-testid="dashboard-search-container">
      <div className="rounded-xl bg-gradient-to-r from-[#FFC107]/15 to-primary/10 border-2 border-[#FFC107]/50 p-1 shadow-sm">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          focused ? "bg-background shadow-inner" : "bg-background/70"
        }`}>
          <div className="w-8 h-8 rounded-lg bg-[#FFC107] flex items-center justify-center shrink-0 shadow-sm">
            <Search className="w-4 h-4 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107] leading-none mb-0.5">Quick Find</p>
            <input
              type="text"
              placeholder="Search features, tools, documents, Corey actions..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground font-medium"
              data-testid="input-dashboard-search"
            />
          </div>
          {query ? (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground shrink-0" data-testid="button-clear-search">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">Type anything...</span>
          )}
        </div>
      </div>

      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border rounded-xl shadow-xl overflow-hidden" data-testid="search-results">
          {results.map((item, idx) => (
            <Link key={idx} href={item.href}>
              <div
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60 cursor-pointer border-b border-border/50 last:border-0 transition-colors"
                data-testid={`search-result-${idx}`}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{item.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${categoryColors[item.category] || "bg-muted text-muted-foreground"}`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))}
          {query.trim().length > 1 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground" data-testid="search-no-results">
              No results for "{query}" — try asking Corey directly.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardCoreyChat() {
  const { toast } = useToast();
  const createConversation = useCreateConversation();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<{ filename: string; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-document", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Upload failed"); }
      const data = await res.json();
      setAttachedDoc({ filename: data.filename, text: data.text });
      toast({ title: `📎 ${data.filename} attached`, description: `${data.chars.toLocaleString()} characters ready for Corey.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const streamMessage = useCallback(async (convId: number, apiContent: string, displayContent: string) => {
    setMessages(prev => [...prev, { role: "user", content: displayContent }]);
    setIsStreaming(true);
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: apiContent }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to send");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setMessages(prev => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last.role === "assistant") last.content += data.content;
                  return next;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to reach Corey. Please try again.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedDoc) || isStreaming) return;
    const userQuestion = input.trim() || "Please review this document.";
    const apiContent = attachedDoc
      ? `[UPLOADED DOCUMENT: ${attachedDoc.filename}]\n\n${attachedDoc.text}\n\n---\n\n${userQuestion}`
      : userQuestion;
    const displayContent = attachedDoc ? `📎 ${attachedDoc.filename}\n\n${userQuestion}` : userQuestion;
    setInput("");
    setAttachedDoc(null);
    let convId = conversationId;
    if (!convId) {
      const conv = await createConversation.mutateAsync("Dashboard Chat");
      convId = conv.id;
      setConversationId(convId);
    }
    await streamMessage(convId, apiContent, displayContent);
  };

  return (
    <div className="flex flex-col gap-3">
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileChange} data-testid="input-dashboard-corey-file" />
      {messages.length > 0 && (
        <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg bg-muted/40 p-3 border border-border/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 text-sm ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-accent" />
                </div>
              )}
              <div className={`rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-white text-right"
                  : "bg-background border border-border/50 text-foreground"
              }`}>
                {msg.content || (isStreaming && i === messages.length - 1 ? <span className="inline-block w-2 h-4 bg-accent/60 animate-pulse rounded-sm" /> : "")}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      {attachedDoc && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-medium w-fit">
          <Paperclip className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[200px]">{attachedDoc.filename}</span>
          <button type="button" onClick={() => setAttachedDoc(null)} className="ml-1 text-accent/60 hover:text-accent" data-testid="button-dashboard-remove-attachment">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
          placeholder={attachedDoc ? "Ask Corey about this document, or just hit send..." : "Ask Corey a compliance question..."}
          className={`resize-none text-sm min-h-[44px] max-h-[100px] ${attachedDoc ? "border-accent/40" : ""}`}
          rows={2}
          disabled={isStreaming}
          data-testid="input-dashboard-corey-message"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || isUploading}
          className="text-muted-foreground hover:text-accent hover:bg-accent/10 flex-shrink-0"
          title="Attach a document (PDF, DOCX, TXT)"
          data-testid="button-dashboard-corey-upload"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={isStreaming || (!input.trim() && !attachedDoc)}
          className="bg-accent hover:bg-accent/90 flex-shrink-0"
          data-testid="button-dashboard-corey-send"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      {conversationId && (
        <Link href="/corey">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-accent gap-1 h-7 px-2 -mt-1">
            <ExternalLink className="w-3 h-3" /> Open full conversation in Corey
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: subStatus, isLoading: subLoading } = useSubscriptionStatus();
  const { toast } = useToast();
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: actions = [], isLoading: actionsLoading } = useQuery<ActionItem[]>({
    queryKey: ['/api/action-items/pending'],
    queryFn: async () => {
      const res = await fetch('/api/action-items?pending=true', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch action items');
      return res.json();
    },
  });

  const { data: chartData = [], isLoading: chartLoading } = useQuery<IncidentChartData[]>({
    queryKey: ['/api/incidents/chart'],
  });

  const completeAction = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/action-items/${id}/status`, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/action-items/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      toast({
        title: "Action Completed",
        description: "Task marked as complete.",
      });
    },
  });

  // Determine user tier
  const [, setLocation] = useLocation();
  const plan = subStatus?.plan;
  const isPro = subStatus?.isPro;
  const isUnlimited = plan === 'unlimited_monthly'; // $99 plan

  // ISO Manager-only subscribers land on /iso-manager, not the Occ Med dashboard
  const isIsoOnlyPlan = !subLoading && plan != null &&
    plan.includes('iso') &&
    !plan.includes('employer_platform') &&
    plan !== 'unlimited_monthly';

  useEffect(() => {
    if (isIsoOnlyPlan) {
      setLocation('/iso-manager');
    }
  }, [isIsoOnlyPlan, setLocation]);

  if (isIsoOnlyPlan) return null;

  return (
    <PlatformGate featureName="Compliance Dashboard">
    <ProtectedLayout>
      <div className="flex gap-6">
        {/* Main Dashboard Content */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col items-center gap-1">
            <video
              ref={videoRef}
              src={coreyVideo}
              autoPlay
              playsInline
              muted
              onEnded={() => setVideoEnded(true)}
              className="w-40 h-auto mix-blend-multiply"
              data-testid="video-corey-intro"
            />
            {videoEnded && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-muted-foreground hover:text-primary h-7 px-2"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                    setVideoEnded(false);
                  }
                }}
                data-testid="button-replay-corey"
              >
                <RotateCcw className="w-3 h-3" />
                Replay
              </Button>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Compliance Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.firstName || 'Manager'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isPro ? "default" : "secondary"}>
                {isUnlimited ? 'Unlimited Safety' : 'Corey AI'}
              </Badge>
              {!isPro && (
                <Link href="/settings">
                  <Button size="sm" variant="outline" data-testid="button-upgrade">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <DashboardSearch />

          {/* Metric Cards Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ISO Audit Readiness */}
            <Card data-testid="card-iso-readiness">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  ISO Audit Readiness
                  <HelpTip id="isoAuditReadiness" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pt-2">
                {metricsLoading ? (
                  <Skeleton className="w-24 h-24 rounded-full" />
                ) : (
                  <CircularProgress 
                    value={metrics?.isoAuditReadiness || 0} 
                    size={100}
                    label="Ready"
                  />
                )}
              </CardContent>
            </Card>

            {/* Medical Surveillance */}
            <Card data-testid="card-medical-surveillance">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  Medical Surveillance
                  <HelpTip id="medicalSurveillance" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <Skeleton className="h-16" />
                ) : (
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      {metrics?.medicalSurveillance || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Employees with current DOT/Respiratory exams
                    </p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${metrics?.medicalSurveillance || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Drug Screen Status */}
            <Card data-testid="card-drug-screen">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-accent" />
                  Drug Screen Status
                  <HelpTip id="drugScreen" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <Skeleton className="h-16" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cleared</span>
                      <span className="text-lg font-bold text-green-600">{metrics?.drugScreenCleared || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="text-lg font-bold text-yellow-600">{metrics?.drugScreenPending || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card data-testid="card-quick-stats">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Quick Stats
                  <HelpTip id="quickStats" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <Skeleton className="h-16" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> Employees
                      </span>
                      <span className="font-bold">{metrics?.employeeCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Actions
                      </span>
                      <span className="font-bold">{metrics?.pendingActions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Recordables (6mo)
                      </span>
                      <span className="font-bold text-destructive">{metrics?.recordableIncidents6Mo || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Row: Chart and Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Incident Chart */}
            <Card data-testid="card-incident-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Incidents (Last 6 Months)
                  <HelpTip id="incidentChart" />
                </CardTitle>
                <CardDescription>
                  Track recordable vs. non-recordable incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <Skeleton className="h-40" />
                ) : (
                  <IncidentChart data={chartData} />
                )}
              </CardContent>
            </Card>

            {/* Action Queue */}
            <Card data-testid="card-action-queue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-accent" />
                  Action Queue
                  <HelpTip id="actionQueue" />
                </CardTitle>
                <CardDescription>
                  Urgent tasks requiring your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actionsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : (
                  <ActionQueue 
                    actions={actions} 
                    onComplete={(id) => completeAction.mutate(id)} 
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Data Management Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-primary/20" data-testid="card-manage-employees">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Employee Management
                  <HelpTip id="employeeManagement" />
                </CardTitle>
                <CardDescription>
                  Add employees, track DOT physicals, drug tests, and medical surveillance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employees">
                  <Button className="w-full sm:w-auto gap-2" data-testid="button-manage-employees">
                    Manage Employees <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/20" data-testid="card-manage-incidents">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="w-5 h-5 text-destructive" />
                  Incident Log
                  <HelpTip id="incidentLog" />
                </CardTitle>
                <CardDescription>
                  Record workplace incidents for OSHA 300 compliance tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/incidents">
                  <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-manage-incidents">
                    Log Incidents <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Employer Training Portal */}
            <Card className="hover:shadow-lg transition-shadow border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" data-testid="card-employer-training">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  Employer Training Portal
                  <HelpTip id="employerTraining" />
                </CardTitle>
                <CardDescription>
                  Assign compliance courses to your employees — they're automatically texted their link. DER is notified on completion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employer-training">
                  <Button className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-employer-training">
                    Open Training Portal <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* My Courses */}
            <Card className="hover:shadow-lg transition-shadow border-green-500/30 bg-gradient-to-r from-green-500/5 to-emerald-500/5" data-testid="card-my-courses">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  My Courses
                  <HelpTip id="myCourses" />
                </CardTitle>
                <CardDescription>
                  Access your purchased courses, continue where you left off, and view your certificates of completion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/training?tab=my-courses">
                  <Button className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white" data-testid="button-my-courses">
                    View My Courses <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-primary/10 bg-gradient-to-br from-white to-primary/5 dark:from-background dark:to-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Ask Corey
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">AI Compliance Expert</span>
                    <HelpTip id="askCorey" />
                  </CardTitle>
                  <Link href="/corey">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-accent gap-1 h-7 px-2" data-testid="button-corey-fullscreen">
                      <ExternalLink className="w-3 h-3" /> Full Chat
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  Ask a question or upload a document (PDF, DOCX, TXT) for Corey to review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardCoreyChat />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  OSHA 300, Log it or Not, Decision Tree
                  <HelpTip id="decisionTree" />
                </CardTitle>
                <CardDescription>
                  Determine if an injury is OSHA recordable in minutes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/decision-tree">
                  <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-decision-tree">
                    Start Assessment <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Clinic Authorization Forms */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-blue-500/20 bg-gradient-to-br from-white to-blue-50/50 dark:from-background dark:to-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Clinic Communication Letter
                  <HelpTip id="clinicLetter" />
                </CardTitle>
                <CardDescription>
                  Set expectations with your occupational health clinic — first-aid treatment preferences, OTC medication requests, and restriction wording guidance per 29 CFR 1904.7(a).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/clinic-letter">
                  <Button className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-500 text-white" data-testid="button-clinic-letter-dashboard">
                    <FileText className="w-4 h-4" /> Generate Letter
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-[#FFC107]/20 bg-gradient-to-br from-white to-amber-50/50 dark:from-background dark:to-[#FFC107]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#FFC107]" />
                  Digital Medical Passport
                  <HelpTip id="digitalPassport" />
                </CardTitle>
                <CardDescription>
                  Generate QR-based clinic authorization forms for your employees. Clinics scan the code, you get notified instantly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employee-passport">
                  <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-passport-dashboard">
                    <QrCode className="w-4 h-4" /> Generate Passport
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar for Pro Users */}
        {isUnlimited && (
          <div className="hidden xl:block w-80 space-y-4">
            {/* AI Consultant Mini Chat */}
            <Card className="sticky top-4" data-testid="card-ai-sidebar">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  AI Compliance Consultant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Quick access to your 24/7 AI compliance expert. Ask about OSHA, DOT, or ISO regulations.
                </p>
                <Link href="/corey">
                  <Button className="w-full gap-2" size="sm" data-testid="button-sidebar-chat">
                    <MessageSquare className="w-4 h-4" />
                    Open AI Consultant
                  </Button>
                </Link>
              </CardContent>
            </Card>


            {/* Upgrade prompt for free users */}
            {!isUnlimited && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Unlock Unlimited Corey Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Upgrade to Unlimited Safety for unlimited Corey interactions and full compliance tools.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full" size="sm">
                      Upgrade to Unlimited - $99/mo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
    </PlatformGate>
  );
}
