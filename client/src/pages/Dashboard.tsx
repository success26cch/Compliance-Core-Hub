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
  ExternalLink,
  User,
  Mail,
  Building2,
  Briefcase,
  Zap,
  Pin,
  BarChart3,
  Siren,
  Printer,
  RefreshCw,
  ChevronDown,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Target,
  Award,
  HeartPulse,
  Sparkles,
  Layers,
  Megaphone,
  Cpu
} from "lucide-react";
import { Link, useLocation } from "wouter";
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

function EmployeeActionDialog({ action, open, onClose }: { action: ActionItem | null; open: boolean; onClose: () => void }) {
  const { data: employee, isLoading } = useQuery<any>({
    queryKey: ['/api/employees', action?.employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${action!.employeeId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch employee');
      return res.json();
    },
    enabled: open && !!action?.employeeId,
  });

  const displayName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : action?.employeeName ?? 'Employee';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" data-testid="employee-action-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            {isLoading ? 'Loading...' : displayName}
          </DialogTitle>
        </DialogHeader>

        {action && (
          <div className="space-y-4">
            <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
              <p className="text-sm font-medium">{action.title}</p>
              {action.description && (
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              )}
              {action.daysUntilExpiry !== undefined && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-destructive">
                  <Clock className="w-3 h-3" />
                  <span>Expires in {action.daysUntilExpiry} day{action.daysUntilExpiry === 1 ? '' : 's'}</span>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : employee ? (
              <div className="space-y-2 text-sm">
                {employee.position && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>{employee.position}</span>
                  </div>
                )}
                {employee.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>{employee.department}</span>
                  </div>
                )}
                {employee.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {(action.employeePhone ?? employee.phone) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{action.employeePhone ?? employee.phone}</span>
                  </div>
                )}
                {employee.dotPhysicalExpiry && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    <span>DOT Expiry: {new Date(employee.dotPhysicalExpiry).toLocaleDateString()}</span>
                  </div>
                )}
                {employee.hireDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Hired: {new Date(employee.hireDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex gap-2 pt-1">
              <Link href="/employees" className="flex-1">
                <Button variant="outline" className="w-full gap-1 text-sm" data-testid="button-view-employee-record">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Full Record
                </Button>
              </Link>
              {action.type === 'dot_expiration' && action.employeeId && (
                <Link href="/dot-notifications">
                  <Button variant="default" className="gap-1 text-sm bg-accent hover:bg-accent/90" data-testid="button-notify-dot">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Notify
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActionQueue({ actions, onComplete }: { actions: ActionItem[]; onComplete: (id: number) => void }) {
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

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
    <>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {actions.slice(0, 5).map((action) => (
          <div 
            key={action.id} 
            className={`flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 transition-colors ${action.employeeId ? 'cursor-pointer hover:bg-muted/60 hover:border-accent/30' : ''}`}
            data-testid={`action-item-${action.id}`}
            onClick={() => action.employeeId && setSelectedAction(action)}
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
              {action.employeeId && (
                <div className="flex items-center gap-1 mt-1 text-xs text-accent">
                  <User className="w-3 h-3" />
                  <span>{action.employeeName ?? 'View employee'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {action.type === 'dot_expiration' ? (
                <Link href="/dot-notifications">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
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
                  onClick={() => onComplete(action.id)}
                  data-testid={`complete-action-${action.id}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {actions.length > 5 && (
          <p className="text-xs text-center text-muted-foreground">
            +{actions.length - 5} more actions
          </p>
        )}
      </div>

      <EmployeeActionDialog
        action={selectedAction}
        open={!!selectedAction}
        onClose={() => setSelectedAction(null)}
      />
    </>
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
            As an Unlimited Corey subscriber, you have priority access to our human compliance experts. 
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
        <Link href={`/corey?c=${conversationId}`}>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-accent gap-1 h-7 px-2 -mt-1">
            <ExternalLink className="w-3 h-3" /> Open full conversation in Corey
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── COREY BRIEF (T006) ──────────────────────────────────────────────────────
type CoreyBriefBullet = { icon: string; text: string; priority: "urgent" | "high" | "medium" };
type CoreyBriefData = { bullets: CoreyBriefBullet[]; generatedAt: string };

function CoreyBriefCard() {
  const { data, isLoading, refetch } = useQuery<CoreyBriefData>({
    queryKey: ['/api/corey-brief'],
  });

  const priorityBg = (p: string) => {
    if (p === "urgent") return "border-destructive/40 bg-destructive/5";
    if (p === "high") return "border-orange-400/40 bg-orange-400/5";
    return "border-border/40 bg-muted/20";
  };
  const priorityDot = (p: string) => {
    if (p === "urgent") return "bg-destructive";
    if (p === "high") return "bg-orange-400";
    return "bg-muted-foreground/40";
  };

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5" data-testid="card-corey-brief">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <span className="font-semibold">Corey's Daily Brief</span>
            {data?.generatedAt && (
              <span className="text-xs text-muted-foreground font-normal">
                {new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-accent"
            onClick={() => refetch()}
            data-testid="button-refresh-corey-brief"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        ) : (
          <div className="space-y-2">
            {data?.bullets.map((b, i) => (
              <div key={i} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${priorityBg(b.priority)}`} data-testid={`corey-brief-bullet-${i}`}>
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${priorityDot(b.priority)}`} />
                <span className="text-sm leading-snug">{b.icon} {b.text}</span>
              </div>
            ))}
            <Link href="/corey">
              <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent gap-1 h-7 px-2 mt-1 -ml-1" data-testid="button-brief-ask-corey">
                <MessageSquare className="w-3 h-3" /> Ask Corey about any of these
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── EMERGENCY RESPONSE MODAL (T008) ─────────────────────────────────────────
const EMERGENCY_SITUATIONS = [
  { id: "employee_injury", label: "Employee Injury", icon: "🚑", color: "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800" },
  { id: "chemical_spill", label: "Chemical Spill", icon: "⚗️", color: "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800" },
  { id: "osha_walkin", label: "OSHA Walk-In", icon: "🏛️", color: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800" },
  { id: "fire_evacuation", label: "Fire / Evacuation", icon: "🔥", color: "text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900" },
  { id: "vehicle_accident", label: "Vehicle Accident", icon: "🚗", color: "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800" },
];

function EmergencyResponseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [response]);

  const handleSelect = async (situationId: string) => {
    setSelected(situationId);
    setResponse("");
    setIsStreaming(true);
    try {
      const res = await fetch("/api/emergency-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: situationId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n\n")) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.content) setResponse(prev => prev + d.content);
            } catch {}
          }
        }
      }
    } catch {
    } finally {
      setIsStreaming(false);
    }
  };

  const handlePrint = () => {
    const sit = EMERGENCY_SITUATIONS.find(s => s.id === selected);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Emergency Protocol: ${sit?.label}</title><style>body{font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto}h1{color:#e55a00}pre{white-space:pre-wrap;line-height:1.6}@media print{body{padding:0}}</style></head><body><h1>${sit?.icon} Emergency Protocol: ${sit?.label}</h1><p>Generated by Corey — CCHUB AI Compliance Expert — ${new Date().toLocaleString()}</p><hr><pre>${response}</pre></body></html>`);
    w.document.close();
    w.print();
  };

  const handleClose = () => {
    setSelected(null);
    setResponse("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" data-testid="emergency-response-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Siren className="w-5 h-5" />
            Emergency Response Protocol
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Select the situation to get Corey's immediate action protocol with regulatory citations.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EMERGENCY_SITUATIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 font-medium text-left transition-all hover:scale-[1.02] active:scale-100 ${s.color}`}
                  data-testid={`emergency-situation-${s.id}`}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => { setSelected(null); setResponse(""); }} data-testid="button-emergency-back">
                ← Back
              </Button>
              <span className="font-medium text-sm">
                {EMERGENCY_SITUATIONS.find(s => s.id === selected)?.icon}{" "}
                {EMERGENCY_SITUATIONS.find(s => s.id === selected)?.label}
              </span>
              {!isStreaming && response && (
                <Button variant="outline" size="sm" className="ml-auto gap-1 h-7" onClick={handlePrint} data-testid="button-emergency-print">
                  <Printer className="w-3 h-3" /> Print Protocol
                </Button>
              )}
            </div>
            <div
              ref={responseRef}
              className="flex-1 overflow-y-auto bg-muted/30 rounded-xl border border-border/50 p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono min-h-[300px] max-h-[400px]"
              data-testid="emergency-response-content"
            >
              {response || (isStreaming ? <span className="text-muted-foreground animate-pulse">Corey is preparing the protocol...</span> : null)}
              {isStreaming && <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5" />}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── COMPLIANCE INSIGHTS PANEL (T002) ────────────────────────────────────────
type TopicBreakdown = { topic: string; count: number };
type ComplianceCalendarItem = { id: string; title: string; description: string; dueDate: string; urgency: string; cfr: string };

function ComplianceInsightsPanel() {
  const { data: topicData = [], isLoading: topicsLoading } = useQuery<TopicBreakdown[]>({
    queryKey: ['/api/conversations/topic-breakdown'],
  });
  const { data: calendarData, isLoading: calendarLoading } = useQuery<{ reminders: ComplianceCalendarItem[] }>({
    queryKey: ['/api/compliance-calendar'],
  });

  const totalConvs = topicData.reduce((s, t) => s + t.count, 0);

  const topicColors = [
    "bg-accent/20 text-accent border-accent/30",
    "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
    "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
    "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30",
  ];

  const urgencyBadge = (u: string) => {
    if (u === "urgent") return "bg-destructive text-destructive-foreground";
    if (u === "high") return "bg-orange-500 text-white";
    return "bg-yellow-500 text-white";
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Topic Breakdown */}
      <Card data-testid="card-compliance-focus">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-accent" />
            Your Compliance Focus
          </CardTitle>
          <CardDescription>Based on your Corey conversations</CardDescription>
        </CardHeader>
        <CardContent>
          {topicsLoading ? (
            <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-6 w-1/2" /></div>
          ) : topicData.length === 0 ? (
            <div className="text-center py-4">
              <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">Start asking Corey questions — your top topics will appear here.</p>
              <Link href="/corey">
                <Button variant="outline" size="sm" className="mt-3 gap-1" data-testid="button-go-ask-corey">
                  <MessageSquare className="w-3 h-3" /> Ask Corey
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topicData.slice(0, 5).map((t, i) => (
                <Link key={t.topic} href={`/corey?topic=${encodeURIComponent(t.topic)}`}>
                  <div className="flex items-center gap-2 cursor-pointer group" data-testid={`topic-bar-${i}`}>
                    <Badge className={`text-xs px-2 py-0.5 border shrink-0 ${topicColors[i % topicColors.length]}`}>{t.topic}</Badge>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent/60 rounded-full transition-all"
                        style={{ width: `${Math.round((t.count / topicData[0].count) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{t.count}</span>
                  </div>
                </Link>
              ))}
              <p className="text-xs text-muted-foreground pt-1">{totalConvs} conversation{totalConvs !== 1 ? 's' : ''} tracked</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Calendar */}
      <Card data-testid="card-compliance-calendar">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            Compliance Calendar
          </CardTitle>
          <CardDescription>Regulatory deadlines & reminders</CardDescription>
        </CardHeader>
        <CardContent>
          {calendarLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : !calendarData?.reminders?.length ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              No upcoming compliance deadlines this period.
            </div>
          ) : (
            <div className="space-y-2.5">
              {calendarData.reminders.map((r) => (
                <div key={r.id} className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-1" data-testid={`calendar-item-${r.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{r.title}</p>
                    <Badge className={`text-xs shrink-0 ${urgencyBadge(r.urgency)}`}>{r.urgency}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{r.cfr}</span>
                    <span>Due: {new Date(r.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// T005: Document Gap Check — surfaces missing but recommended documents based on industry + conversation topics
const INDUSTRY_DOC_MAP: Record<string, Array<{ label: string; promptHint: string; topic: string }>> = {
  manufacturing: [
    { label: "Lockout/Tagout (LOTO) Program", promptHint: "Write a Lockout/Tagout program per 29 CFR 1910.147", topic: "Permit / Lockout-Tagout" },
    { label: "Machine Guarding SOP", promptHint: "Create a machine guarding standard per OSHA 29 CFR 1910.212", topic: "PPE / Safety Equipment" },
    { label: "Process Safety Management Overview", promptHint: "Draft a PSM program overview per OSHA 29 CFR 1910.119", topic: "Hazard Communication" },
    { label: "Confined Space Entry Permit", promptHint: "Create a confined space entry permit per 29 CFR 1910.146", topic: "Permit / Lockout-Tagout" },
    { label: "Forklift/PIT Safety Program", promptHint: "Write a forklift safety program per 29 CFR 1910.178", topic: "PPE / Safety Equipment" },
    { label: "Electrical Safety Program", promptHint: "Create an electrical safety program per NFPA 70E and 29 CFR 1910 Subpart S", topic: "Hazard Communication" },
  ],
  construction: [
    { label: "Fall Protection Plan", promptHint: "Write a fall protection plan per OSHA 29 CFR 1926.502", topic: "PPE / Safety Equipment" },
    { label: "Excavation Safety Program", promptHint: "Create an excavation and trenching safety program per 29 CFR 1926.650", topic: "Permit / Lockout-Tagout" },
    { label: "Scaffold Safety Program", promptHint: "Draft a scaffold safety program per 29 CFR 1926.451", topic: "PPE / Safety Equipment" },
    { label: "Hot Work Permit", promptHint: "Create a hot work permit template per NFPA 51B and 29 CFR 1910.252", topic: "Permit / Lockout-Tagout" },
    { label: "Confined Space Entry Permit", promptHint: "Create a confined space entry permit per 29 CFR 1910.146", topic: "Permit / Lockout-Tagout" },
    { label: "Contractor Safety Pre-Qualification Form", promptHint: "Write a contractor pre-qualification form covering EMR, OSHA 300 log, and safety programs", topic: "Safety Training" },
  ],
  transportation: [
    { label: "Drug & Alcohol Policy", promptHint: "Write a DOT drug and alcohol policy per 49 CFR Parts 40 and 382", topic: "DOT / Drug Testing" },
    { label: "Return-to-Duty Checklist", promptHint: "Create a return-to-duty checklist for DOT-regulated employees per 49 CFR Part 40", topic: "DOT / Drug Testing" },
    { label: "Reasonable Suspicion Documentation Form", promptHint: "Write a reasonable suspicion documentation form per DOT 49 CFR Part 382.307", topic: "DOT / Drug Testing" },
    { label: "Fit for Duty Policy", promptHint: "Create a fit-for-duty policy covering DOT physicals and return-to-work evaluations", topic: "OSHA Recordkeeping" },
    { label: "Vehicle Accident Investigation Form", promptHint: "Write a vehicle accident investigation report form for DOT-regulated carriers", topic: "Incident Investigation" },
  ],
  healthcare: [
    { label: "Bloodborne Pathogen Exposure Control Plan", promptHint: "Write a bloodborne pathogen exposure control plan per 29 CFR 1910.1030", topic: "Hazard Communication" },
    { label: "Respiratory Protection Program", promptHint: "Create a respiratory protection program per 29 CFR 1910.134", topic: "PPE / Safety Equipment" },
    { label: "Fit for Duty (FFD) Form", promptHint: "Create a fit-for-duty evaluation form for healthcare workers", topic: "OSHA Recordkeeping" },
    { label: "Needle Stick / Sharps Injury Log", promptHint: "Write a sharps injury log and exposure response SOP per 29 CFR 1910.1030", topic: "Incident Investigation" },
  ],
  default: [
    { label: "OSHA Recordkeeping SOP", promptHint: "Write an OSHA recordkeeping SOP per 29 CFR 1904", topic: "OSHA Recordkeeping" },
    { label: "Emergency Action Plan", promptHint: "Create an emergency action plan per 29 CFR 1910.38", topic: "Emergency Response" },
    { label: "Hazard Communication Program", promptHint: "Write a hazard communication program per 29 CFR 1910.1200", topic: "Hazard Communication" },
    { label: "Incident Investigation Form", promptHint: "Create an incident investigation form per OSHA 29 CFR 1904.7", topic: "Incident Investigation" },
    { label: "Corrective Action Plan (CAPA) Form", promptHint: "Write a CAPA form for safety compliance and quality management", topic: "Incident Investigation" },
    { label: "Drug & Alcohol Policy", promptHint: "Write a drug and alcohol policy per 49 CFR Parts 40 and 382", topic: "DOT / Drug Testing" },
  ],
};

function DocumentGapCheck() {
  const [, setLocation] = useLocation();
  const { data: profile } = useQuery<any>({ queryKey: ['/api/corey-profile'] });
  const { data: topicData = [] } = useQuery<TopicBreakdown[]>({ queryKey: ['/api/conversations/topic-breakdown'] });
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_doc_gaps') || '[]'); } catch { return []; }
  });

  const industry = (profile?.industry || "").toLowerCase();
  const industryKey = Object.keys(INDUSTRY_DOC_MAP).find(k => industry.includes(k)) || "default";
  const industryDocs = INDUSTRY_DOC_MAP[industryKey] || INDUSTRY_DOC_MAP.default;
  const topicSet = new Set(topicData.map((t: any) => t.topic));

  const gaps = industryDocs
    .filter(d => !dismissed.includes(d.label))
    .sort((a, b) => {
      const aRelevant = topicSet.has(a.topic) ? 0 : 1;
      const bRelevant = topicSet.has(b.topic) ? 0 : 1;
      return aRelevant - bRelevant;
    })
    .slice(0, 5);

  if (!profile || gaps.length === 0) return null;

  const dismiss = (label: string) => {
    const next = [...dismissed, label];
    setDismissed(next);
    localStorage.setItem('dismissed_doc_gaps', JSON.stringify(next));
  };

  return (
    <Card className="border-primary/20" data-testid="card-document-gap-check">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-accent" />
          Documents You May Be Missing
          <Badge variant="outline" className="text-xs ml-1 capitalize">{industryKey === "default" ? "General" : industryKey}</Badge>
        </CardTitle>
        <CardDescription>Based on your industry and compliance activity — Corey can help you build any of these</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {gaps.map((gap) => (
            <div
              key={gap.label}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors group"
              data-testid={`doc-gap-item-${gap.label.replace(/\s/g, '-').toLowerCase()}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{gap.label}</p>
                  {topicSet.has(gap.topic) && (
                    <p className="text-xs text-accent/70">Relevant to your {gap.topic} conversations</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-accent/30 text-accent hover:bg-accent/10"
                  data-testid={`button-build-doc-${gap.label.replace(/\s/g, '-').toLowerCase()}`}
                  onClick={() => {
                    sessionStorage.setItem("corey-seed-prompt", gap.promptHint);
                    setLocation("/corey");
                  }}
                >
                  <Zap className="w-3 h-3" /> Build with Corey
                </Button>
                <button
                  onClick={() => dismiss(gap.label)}
                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Dismiss suggestion"
                  data-testid={`button-dismiss-gap-${gap.label.replace(/\s/g, '-').toLowerCase()}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          Hover any item and click × to dismiss suggestions you already have covered.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── COMPLIANCE HEALTH BANNER ────────────────────────────────────────────────
function ComplianceHealthBanner({
  metrics,
  chartData,
  metricsLoading,
  onEmergency,
  user,
  logout,
  isPro,
  isUnlimited,
  plan,
}: {
  metrics?: DashboardMetrics;
  chartData: IncidentChartData[];
  metricsLoading: boolean;
  onEmergency: () => void;
  user: any;
  logout: () => void;
  isPro?: boolean;
  isUnlimited?: boolean;
  plan?: string;
}) {
  // Calculate overall compliance health score
  const score = (() => {
    if (!metrics) return 0;
    const isoW = metrics.isoAuditReadiness * 0.20;
    const medW = metrics.medicalSurveillance * 0.30;
    const totalDS = (metrics.drugScreenCleared + metrics.drugScreenPending) || 1;
    const drugW = (metrics.drugScreenCleared / totalDS) * 100 * 0.20;
    const recordablePenalty = Math.min(metrics.recordableIncidents6Mo * 8, 30);
    const actionPenalty = Math.min(metrics.pendingActions * 1.5, 20);
    const base = isoW + medW + drugW;
    return Math.max(0, Math.min(100, base - recordablePenalty - actionPenalty));
  })();

  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  const gradeColor = grade === "A" ? "text-emerald-500" : grade === "B" ? "text-accent" : grade === "C" ? "text-yellow-500" : grade === "D" ? "text-orange-500" : "text-destructive";
  const gradeBg = grade === "A" ? "bg-emerald-500/10 border-emerald-500/20" : grade === "B" ? "bg-accent/10 border-accent/20" : grade === "C" ? "bg-yellow-500/10 border-yellow-500/20" : "bg-destructive/10 border-destructive/20";

  // Days since last recordable incident
  const daysSafeCalc = (() => {
    const withRecordable = [...chartData].reverse().find(d => d.recordable > 0);
    if (!withRecordable) return null;
    const lastMonth = new Date(withRecordable.month + '-01');
    const now = new Date();
    return Math.floor((now.getTime() - lastMonth.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const statusItems = [
    {
      label: "OSHA 300",
      ok: (metrics?.recordableIncidents6Mo ?? 0) === 0,
      icon: <ClipboardList className="w-3 h-3" />,
    },
    {
      label: "Medical",
      ok: (metrics?.medicalSurveillance ?? 0) >= 80,
      icon: <HeartPulse className="w-3 h-3" />,
    },
    {
      label: "Drug Screen",
      ok: (metrics?.drugScreenPending ?? 0) === 0,
      icon: <TestTube className="w-3 h-3" />,
    },
    {
      label: "ISO Ready",
      ok: (metrics?.isoAuditReadiness ?? 0) >= 70,
      icon: <Shield className="w-3 h-3" />,
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 shadow-sm bg-white" data-testid="compliance-health-banner">
      {/* Top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-emerald-500" />
      
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {/* Left: Grade + Score */}
          <div className="flex items-center gap-5">
            {/* Corey avatar + greeting */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-border/50 flex items-center justify-center shadow-sm">
                <Bot className="w-8 h-8 text-accent" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">COREY AI</span>
            </div>
            {/* Grade display */}
            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 shadow-sm ${gradeBg}`}>
              {metricsLoading ? (
                <Skeleton className="w-10 h-10 rounded" />
              ) : (
                <>
                  <span className={`text-4xl font-black leading-none ${gradeColor}`}>{grade}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 font-medium">{Math.round(score)}%</span>
                </>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Compliance Health</p>
              <h2 className="text-xl font-bold text-primary leading-tight">
                {metricsLoading ? <Skeleton className="w-32 h-6" /> : (
                  grade === "A" ? "Excellent Standing" :
                  grade === "B" ? "Good Standing" :
                  grade === "C" ? "Needs Attention" :
                  grade === "D" ? "At Risk" : "Critical Status"
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                Welcome back, <span className="font-semibold text-primary">{user?.firstName || user?.email?.split('@')[0] || 'Manager'}</span>
              </p>
            </div>
          </div>

          {/* Center: Key numbers */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40" data-testid="stat-employees">
              <div className="text-2xl font-bold text-primary">{metricsLoading ? '—' : (metrics?.employeeCount ?? 0)}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-3 h-3" /> Employees
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40" data-testid="stat-days-safe">
              <div className={`text-2xl font-bold ${daysSafeCalc === null ? 'text-emerald-500' : daysSafeCalc > 30 ? 'text-accent' : 'text-destructive'}`}>
                {metricsLoading ? '—' : daysSafeCalc === null ? '180+' : daysSafeCalc}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Days Safe
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40" data-testid="stat-pending-actions">
              <div className={`text-2xl font-bold ${(metrics?.pendingActions ?? 0) > 5 ? 'text-destructive' : (metrics?.pendingActions ?? 0) > 0 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {metricsLoading ? '—' : (metrics?.pendingActions ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <ClipboardList className="w-3 h-3" /> Open Actions
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40" data-testid="stat-recordables">
              <div className={`text-2xl font-bold ${(metrics?.recordableIncidents6Mo ?? 0) > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                {metricsLoading ? '—' : (metrics?.recordableIncidents6Mo ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3" /> Recordables (6mo)
              </div>
            </div>
          </div>

          {/* Right: Status chips + buttons */}
          <div className="flex flex-col gap-3">
            {/* Status strip */}
            <div className="grid grid-cols-2 gap-1.5">
              {statusItems.map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${s.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}
                  data-testid={`status-chip-${s.label.toLowerCase().replace(' ', '-')}`}
                >
                  {s.ok ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {s.icon}
                  {s.label}
                </div>
              ))}
            </div>
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 font-semibold flex-1"
                onClick={onEmergency}
                data-testid="button-emergency-guidance"
              >
                <Siren className="w-4 h-4" />
                Emergency
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isPro ? "default" : "secondary"} className="text-xs">
                {isUnlimited ? 'Unlimited Corey' : plan ? plan.replace(/_/g, ' ') : 'Corey AI'}
              </Badge>
              {!isPro && (
                <Link href="/settings">
                  <Button size="sm" variant="ghost" className="h-6 text-xs text-accent hover:text-accent" data-testid="button-upgrade">
                    Upgrade ↑
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TEAM HUB SNAPSHOT ───────────────────────────────────────────────────────
type TeamMember = { id: number; userId: string; name?: string; email?: string; role: string; departmentId?: number; jobTitle?: string };
type TeamDepartment = { id: number; name: string; memberCount?: number };
type TeamAnnouncement = { id: number; title: string; body: string; createdAt: string; authorName?: string };

function TeamHubSnapshot() {
  const { data: members = [] } = useQuery<TeamMember[]>({ queryKey: ['/api/team/members'] });
  const { data: departments = [] } = useQuery<TeamDepartment[]>({ queryKey: ['/api/team/departments'] });
  const { data: announcements = [] } = useQuery<TeamAnnouncement[]>({ queryKey: ['/api/team/announcements'] });

  const admins = members.filter(m => m.role === 'admin');
  const supervisors = members.filter(m => m.role === 'supervisor');
  const memberCount = members.filter(m => m.role === 'member');
  const latestAnnouncement = announcements[0];

  const roleColor = (role: string) => {
    if (role === 'admin') return 'bg-accent/10 text-accent border-accent/20';
    if (role === 'supervisor') return 'bg-primary/10 text-primary border-primary/20';
    return 'bg-muted text-muted-foreground border-border/40';
  };

  return (
    <Card className="border-primary/20 overflow-hidden" data-testid="card-team-hub-snapshot">
      {/* Header band */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 px-5 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-primary">Team Hub</h3>
              <p className="text-xs text-muted-foreground">Your compliance workforce at a glance</p>
            </div>
          </div>
          <Link href="/team">
            <Button variant="outline" size="sm" className="gap-1 text-xs h-7 border-primary/30 text-primary hover:bg-primary/5" data-testid="button-open-team-hub">
              Open Team Hub <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="grid md:grid-cols-3 gap-5">
          {/* Column 1: Org stats */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/40">
                <div className="text-xl font-bold text-primary">{members.length}</div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/40">
                <div className="text-xl font-bold text-primary">{departments.length}</div>
                <div className="text-xs text-muted-foreground">Depts</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-muted/40 border border-border/40">
                <div className="text-xl font-bold text-accent">{supervisors.length}</div>
                <div className="text-xs text-muted-foreground">Supvr</div>
              </div>
            </div>

            {/* Role breakdown */}
            <div className="space-y-1.5">
              {admins.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={`text-xs px-2 py-0 h-5 border ${roleColor('admin')}`}>Admin</Badge>
                  <span className="text-muted-foreground">{admins.length} user{admins.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {supervisors.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={`text-xs px-2 py-0 h-5 border ${roleColor('supervisor')}`}>Supervisor</Badge>
                  <span className="text-muted-foreground">{supervisors.length} user{supervisors.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {memberCount.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={`text-xs px-2 py-0 h-5 border ${roleColor('member')}`}>Member</Badge>
                  <span className="text-muted-foreground">{memberCount.length} user{memberCount.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No team members yet</p>
              )}
            </div>
          </div>

          {/* Column 2: Departments */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departments</p>
            {departments.length === 0 ? (
              <div className="text-center py-4">
                <Building2 className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No departments set up yet</p>
                <Link href="/team">
                  <Button variant="ghost" size="sm" className="text-xs text-accent gap-1 h-6 mt-1 px-2" data-testid="button-add-dept">
                    <Zap className="w-3 h-3" /> Set up departments
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {departments.map((dept) => {
                  const deptMembers = members.filter(m => m.departmentId === dept.id);
                  return (
                    <div key={dept.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs" data-testid={`dept-row-${dept.id}`}>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[100px]">{dept.name}</span>
                      </div>
                      <span className="text-muted-foreground">{deptMembers.length} member{deptMembers.length !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 3: Latest announcement + how teams work */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest Announcement</p>
            {latestAnnouncement ? (
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-1" data-testid="latest-announcement">
                <div className="flex items-start gap-2">
                  <Megaphone className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary leading-tight">{latestAnnouncement.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{latestAnnouncement.body}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(latestAnnouncement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-xs text-muted-foreground italic">No announcements yet</p>
              </div>
            )}

            {/* How teams work */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1.5">
              <p className="text-xs font-semibold text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> How Teams Work
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>Invite admins, supervisors, and members — each sees only what they need</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>Supervisors see compliance data for their department only (HIPAA-aware)</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <span>Medical & restriction details are hidden by default — toggle per department</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── PLATFORM MODULE GRID ─────────────────────────────────────────────────────
function PlatformModuleGrid({ metrics, actions }: { metrics?: DashboardMetrics; actions: ActionItem[] }) {
  const urgentCount = actions.filter(a => a.priority === 'urgent').length;

  const modules = [
    {
      id: "corey",
      title: "Corey AI",
      subtitle: "Compliance Expert",
      icon: <Bot className="w-5 h-5" />,
      href: "/corey",
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
      badge: null,
      description: "24/7 OSHA, DOT & ISO AI — ask anything",
    },
    {
      id: "employees",
      title: "Employee Management",
      subtitle: "Medical Surveillance",
      icon: <Users className="w-5 h-5" />,
      href: "/employees",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      badge: (metrics?.employeeCount ?? 0) > 0 ? `${metrics?.employeeCount} employees` : null,
      description: "DOT physicals, drug screens, medical records",
    },
    {
      id: "incidents",
      title: "Incident Log",
      subtitle: "OSHA 300",
      icon: <FileWarning className="w-5 h-5" />,
      href: "/incidents",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      badge: (metrics?.totalIncidents6Mo ?? 0) > 0 ? `${metrics?.totalIncidents6Mo} this period` : null,
      description: "Record, review & manage workplace incidents",
    },
    {
      id: "capa",
      title: "Corrective Actions",
      subtitle: "CAPA Tracker",
      icon: <Target className="w-5 h-5" />,
      href: "/incidents",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      badge: urgentCount > 0 ? `${urgentCount} urgent` : null,
      description: "Track CAPAs with SMS notifications & deadlines",
    },
    {
      id: "team",
      title: "Team Hub",
      subtitle: "Multi-Seat Access",
      icon: <Layers className="w-5 h-5" />,
      href: "/team",
      color: "text-blue-600",
      bg: "bg-blue-600/10",
      border: "border-blue-600/20",
      badge: null,
      description: "3-tier HIPAA-aware role system for your team",
    },
    {
      id: "training",
      title: "Training Portal",
      subtitle: "LMS + Certificates",
      icon: <GraduationCap className="w-5 h-5" />,
      href: "/employer-training",
      color: "text-emerald-600",
      bg: "bg-emerald-600/10",
      border: "border-emerald-600/20",
      badge: null,
      description: "Assign courses, auto-text employees, track completions",
    },
    {
      id: "iso",
      title: "ISO Manager",
      subtitle: "9001 · 14001 · 45001+",
      icon: <Award className="w-5 h-5" />,
      href: "/iso-manager",
      color: "text-purple-600",
      bg: "bg-purple-600/10",
      border: "border-purple-600/20",
      badge: (metrics?.isoAuditReadiness ?? 0) > 0 ? `${metrics?.isoAuditReadiness}% ready` : null,
      description: "NC tracking, documentation, audit prep with Isa AI",
    },
    {
      id: "passport",
      title: "Digital Passport",
      subtitle: "QR Clinic Check-In",
      icon: <QrCode className="w-5 h-5" />,
      href: "/employee-passport",
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      badge: null,
      description: "QR-based clinic auth forms + employer notifications",
    },
    {
      id: "decision-tree",
      title: "OSHA Decision Tree",
      subtitle: "Recordability Tool",
      icon: <ClipboardList className="w-5 h-5" />,
      href: "/decision-tree",
      color: "text-teal-600",
      bg: "bg-teal-600/10",
      border: "border-teal-600/20",
      badge: null,
      description: "Is this recordable? 5-question instant assessment",
    },
  ];

  return (
    <div data-testid="platform-module-grid">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-sm text-primary">Platform Modules</h3>
          <Badge variant="outline" className="text-xs text-accent border-accent/30">9 Active</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Your full compliance command center</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.map((mod) => (
          <Link key={mod.id} href={mod.href} data-testid={`module-tile-${mod.id}`}>
            <div className={`group relative p-4 rounded-xl border bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${mod.border}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${mod.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <span className={mod.color}>{mod.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-primary leading-tight">{mod.title}</p>
                    {mod.badge && (
                      <Badge className={`text-xs px-1.5 py-0 h-4 ${mod.bg} ${mod.color} border-0`}>{mod.badge}</Badge>
                    )}
                  </div>
                  <p className={`text-xs font-medium ${mod.color} mt-0.5`}>{mod.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{mod.description}</p>
                </div>
                <ArrowUpRight className={`w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${mod.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: subStatus, isLoading: subLoading } = useSubscriptionStatus();
  const { toast } = useToast();
  const [emergencyOpen, setEmergencyOpen] = useState(false);

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
  const isUnlimited = plan === 'unlimited_monthly'; // $149/mo plan

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

  // Silently trigger overdue CAPA email check on dashboard load (once per mount)
  useEffect(() => {
    fetch('/api/capa/check-overdue', { credentials: 'include' })
      .catch(() => {});
  }, []);

  if (isIsoOnlyPlan) return null;

  return (
    <PlatformGate featureName="Compliance Dashboard">
    <ProtectedLayout>
      <div className="flex gap-6">
        {/* Main Dashboard Content */}
        <div className="flex-1 space-y-6">
          {/* Compliance Command Center Hero */}
          <ComplianceHealthBanner
            metrics={metrics}
            chartData={chartData}
            metricsLoading={metricsLoading}
            onEmergency={() => setEmergencyOpen(true)}
            user={user}
            logout={logout}
            isPro={isPro}
            isUnlimited={isUnlimited}
            plan={plan ?? undefined}
          />

          {/* Emergency Response Modal */}
          <EmergencyResponseModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />

          {/* Corey's Daily Brief */}
          <CoreyBriefCard />

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

          {/* Team Hub Snapshot */}
          <TeamHubSnapshot />

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

          {/* Compliance Insights: Topic Breakdown + Calendar */}
          <ComplianceInsightsPanel />

          {/* T005: Document Gap Check */}
          <DocumentGapCheck />

          {/* Platform Module Grid */}
          <PlatformModuleGrid metrics={metrics} actions={actions} />

          {/* Ask Corey — Quick Access Chat */}
          <Card className="border-accent/20 bg-gradient-to-br from-white to-accent/5" data-testid="card-ask-corey-dashboard">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
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
                Ask anything about OSHA, DOT, ISO, or upload a document (PDF, DOCX, TXT) for Corey to review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardCoreyChat />
            </CardContent>
          </Card>
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
                    Upgrade to Unlimited Corey for unlimited Corey interactions and full compliance tools.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full" size="sm">
                      Upgrade to Unlimited Corey - $199/mo
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
