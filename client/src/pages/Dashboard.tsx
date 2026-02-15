import { ProtectedLayout } from "@/components/Layout";
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
  BookOpen
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
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

export default function Dashboard() {
  const { user } = useAuth();
  const { data: subStatus, isLoading: subLoading } = useSubscriptionStatus();
  const { toast } = useToast();

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
    <ProtectedLayout>
      <div className="flex gap-6">
        {/* Main Dashboard Content */}
        <div className="flex-1 space-y-6">
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
                <Link href="/bot">
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
                <Link href="/bot">
                  <Button className="w-full gap-2" size="sm" data-testid="button-sidebar-chat">
                    <MessageSquare className="w-4 h-4" />
                    Open AI Consultant
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Retainer Support for Unlimited Plan */}
            {isUnlimited && (
              <Card className="border-accent/50 bg-accent/5" data-testid="card-retainer-support">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-accent" />
                    Human Expert Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    As an Unlimited subscriber, you have priority access to our human compliance experts.
                  </p>
                  <RetainerSupportDialog />
                </CardContent>
              </Card>
            )}

            {/* Upgrade prompt for free users */}
            {!isUnlimited && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Unlock Unlimited Corey + Human Expert Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Upgrade to Unlimited Safety for unlimited Corey interactions and priority human expert support.
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
  );
}
