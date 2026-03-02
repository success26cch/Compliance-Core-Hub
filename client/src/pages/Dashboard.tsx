import { ProtectedLayout } from "@/components/Layout";
import { PlatformGate } from "@/components/PlatformGate";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import coreyVideo from "@assets/Dashboard_corey_1771768410962.mp4";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
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

const SEARCH_INDEX = [
  { label: "Compliance Dashboard", description: "Your main compliance overview and metrics", href: "/dashboard", icon: LayoutDashboard, category: "Pages" },
  { label: "Ask Corey — AI Compliance Expert", description: "Get instant OSHA, DOT, and safety answers from Corey AI", href: "/corey", icon: Bot, category: "Pages" },
  { label: "Employee Management", description: "Add employees, track DOT physicals, drug tests, medical surveillance", href: "/employees", icon: Users, category: "Pages" },
  { label: "Incident Log", description: "Record workplace incidents, OSHA 300 log, CAPA tracking", href: "/incidents", icon: FileWarning, category: "Pages" },
  { label: "Employer Training Portal", description: "Assign compliance courses, track employee progress", href: "/employer-training", icon: GraduationCap, category: "Pages" },
  { label: "My Courses", description: "Access your purchased training courses and certificates", href: "/training?tab=my-courses", icon: BookOpen, category: "Pages" },
  { label: "Clinic Communication Letter", description: "Generate a letter for your occupational health clinic", href: "/clinic-letter", icon: FileText, category: "Tools" },
  { label: "Digital Medical Passport (CCH Handshake)", description: "QR-based clinic authorization forms, instant employer notifications", href: "/employee-passport", icon: QrCode, category: "Tools" },
  { label: "OSHA 300 Decision Tree", description: "Determine if an injury is OSHA recordable in minutes", href: "/decision-tree", icon: ClipboardList, category: "Tools" },
  { label: "Account Settings", description: "Manage your subscription, billing, and account info", href: "/settings", icon: Activity, category: "Pages" },
  { label: "Team Management", description: "Manage seats and team access for Corey AI", href: "/team", icon: Users, category: "Pages" },
  { label: "Platform Tour", description: "Interactive walkthrough of all CCH features", href: "/demo-tour", icon: Shield, category: "Pages" },
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
  const plan = subStatus?.plan;
  const isPro = subStatus?.isPro;
  const isUnlimited = plan === 'unlimited_monthly'; // $99 plan

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
                {isUnlimited ? 'Unlimited Safety' : 'Safety Starter'}
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
                </CardTitle>
                <CardDescription>
                  Assign compliance courses to your employees, send them access links, and track their progress.
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Ask Corey
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">Your AI Compliance Expert</span>
                </CardTitle>
                <CardDescription>
                  Get instant answers for OSHA 1904 and DOT regulations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/corey">
                  <Button className="w-full sm:w-auto gap-2" data-testid="button-chat-bot">
                    Start Chat <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-primary/10">
              <CardHeader>
                <CardTitle>OSHA 300, Log it or Not, Decision Tree</CardTitle>
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
