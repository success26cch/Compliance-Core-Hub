import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { DollarSign, Users, TrendingUp, AlertTriangle, Download, Mail, Building2, UserCheck, Clock, CheckCircle2, XCircle, Bot, MessageSquare, Eye, BarChart3, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";

type Stats = {
  totalMRR: number;
  totalCompanies: number;
  newSignupsThisWeek: number;
};

type Company = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string;
  plan: string;
  planStatus: string;
  monthlyPrice: number;
  ltv: number;
  createdAt: string | null;
};

type GrowthData = {
  date: string;
  count: number;
};

type RetainerRequest = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  employeeCount: string | null;
  message: string;
  status: string;
  createdAt: string | null;
};

type Lead = {
  id: number;
  name: string;
  email: string;
  source: string | null;
  createdAt: string | null;
};

type TrialLead = {
  id: number;
  name: string;
  email: string;
  questionCount: number;
  questions: string[] | null;
  createdAt: string | null;
};

type SiteVisitStats = {
  totalVisits: number;
  todayVisits: number;
  last30Days: { date: string; count: number }[];
  topPages: { page: string; count: number }[];
};

type CompanyUsage = {
  user_id: string;
  company_name: string;
  conversations_count: string;
  messages_count: string;
  employees_count: string;
  incidents_count: string;
  audit_items_completed: string;
  dot_notifications_count: string;
  last_corey_activity: string | null;
  plan: string | null;
  plan_status: string | null;
};

const SOURCE_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#06b6d4", "#0891b2", "#0e7490", "#f59e0b",
  "#10b981", "#ef4444",
];

const planLabels: Record<string, string> = {
  'free': 'Free',
  'cch_unlimited_safety': 'Unlimited Corey ($199)',
  'acsi_iso_essentials': 'ISO Essentials ($49)',
  'acsi_iso_professional': 'ISO Professional ($149)',
  'corey_pro': 'Corey AI ($199)',
  'employer_platform': 'Employer Platform ($599)',
  'employer_platform_with_corey': 'Platform + Corey AI ($699)',
  'integrated_enterprise': 'Enterprise ($499)',
  'human_expert_retainer': 'Expert Retainer ($499)',
};

export default function SuperAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTrialLead, setSelectedTrialLead] = useState<TrialLead | null>(null);

  const { data: checkData, isLoading: checkLoading } = useQuery<{ isSuperadmin: boolean }>({
    queryKey: ['/api/superadmin/check'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/superadmin/stats'],
    enabled: checkData?.isSuperadmin === true,
  });

  const { data: companies, isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ['/api/superadmin/companies'],
    enabled: checkData?.isSuperadmin === true,
  });

  const { data: growth, isLoading: growthLoading } = useQuery<GrowthData[]>({
    queryKey: ['/api/superadmin/growth'],
    enabled: checkData?.isSuperadmin === true,
  });

  const { data: retainerRequests, isLoading: retainerLoading } = useQuery<RetainerRequest[]>({
    queryKey: ['/api/superadmin/retainer-requests'],
    enabled: checkData?.isSuperadmin === true,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/superadmin/leads'],
    enabled: checkData?.isSuperadmin === true,
  });

  const { data: trialLeads, isLoading: trialLeadsLoading } = useQuery<TrialLead[]>({
    queryKey: ['/api/superadmin/trial-leads'],
    enabled: checkData?.isSuperadmin === true,
  });

  const { data: siteVisitStats } = useQuery<SiteVisitStats>({
    queryKey: ['/api/superadmin/site-visits'],
    enabled: checkData?.isSuperadmin === true,
  });

  const { data: companyUsage, isLoading: usageLoading } = useQuery<CompanyUsage[]>({
    queryKey: ['/api/superadmin/company-usage'],
    enabled: checkData?.isSuperadmin === true,
  });

  const updateInquiryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/superadmin/inquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/retainer-requests'] });
      toast({ title: "Status updated" });
    },
  });

  if (checkLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!checkData?.isSuperadmin) {
    return <Redirect to="/dashboard" />;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  const handleExportLeads = () => {
    window.open('/api/superadmin/leads/export', '_blank');
  };

  const chartData = growth?.map(g => ({
    date: new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: g.count,
  })) || [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Internal management for Core Compliance Hub</p>
        </div>
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Internal Only
        </Badge>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-mrr">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ${statsLoading ? '...' : stats?.totalMRR?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
          </CardContent>
        </Card>

        <Card data-testid="card-companies">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalCompanies || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card data-testid="card-signups">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Signups This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{statsLoading ? '...' : stats?.newSignupsThisWeek || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card data-testid="card-site-visits">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Visitors</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {siteVisitStats?.totalVisits?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {siteVisitStats?.todayVisits?.toLocaleString() || '0'} today
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="companies" data-testid="tab-companies">
            <Users className="w-4 h-4 mr-2" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="growth" data-testid="tab-growth">
            <TrendingUp className="w-4 h-4 mr-2" />
            Growth
          </TabsTrigger>
          <TabsTrigger value="retainer" data-testid="tab-retainer">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Retainer Queue
            {retainerRequests && retainerRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{retainerRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-leads">
            <Mail className="w-4 h-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="trial-leads" data-testid="tab-trial-leads">
            <Bot className="w-4 h-4 mr-2" />
            Ask Corey Trials
            {trialLeads && trialLeads.length > 0 && (
              <Badge variant="secondary" className="ml-2">{trialLeads.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">
            <Activity className="w-4 h-4 mr-2" />
            Tool Usage
          </TabsTrigger>
          <TabsTrigger value="traffic" data-testid="tab-traffic">
            <BarChart3 className="w-4 h-4 mr-2" />
            Site Traffic
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>All registered companies with subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              {companiesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company / Admin</TableHead>
                      <TableHead>Current Plan</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead className="text-right">LTV</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies?.map((company) => (
                      <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.companyName}</div>
                            <div className="text-sm text-muted-foreground">{company.email || 'No email'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.planStatus === 'active' ? 'default' : 'secondary'}>
                            {planLabels[company.plan] || 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">${company.monthlyPrice}</TableCell>
                        <TableCell className="text-right font-medium">${company.ltv}</TableCell>
                        <TableCell>{formatDate(company.createdAt)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            data-testid={`button-login-as-${company.id}`}
                            onClick={() => {
                              toast({ 
                                title: "Login as User", 
                                description: `Would impersonate ${company.email}. Feature coming soon.` 
                              });
                            }}
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Login as User
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!companies || companies.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No companies registered yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Chart Tab */}
        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle>User Growth - Last 30 Days</CardTitle>
              <CardDescription>New user signups over time</CardDescription>
            </CardHeader>
            <CardContent>
              {growthLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--accent))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
                  <p>No growth data available yet</p>
                  <p className="text-sm">New signups will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retainer Queue Tab */}
        <TabsContent value="retainer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Pending Retainer Requests
              </CardTitle>
              <CardDescription>Priority tickets from $149/mo tier - requires personal response</CardDescription>
            </CardHeader>
            <CardContent>
              {retainerLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : retainerRequests && retainerRequests.length > 0 ? (
                <div className="space-y-4">
                  {retainerRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-orange-500" data-testid={`card-retainer-${request.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{request.name}</h4>
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                            {request.company && <p className="text-sm">{request.company}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-sm mb-4 bg-muted p-3 rounded-lg">{request.message}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateInquiryStatus.mutate({ id: request.id, status: 'contacted' })}
                            data-testid={`button-mark-contacted-${request.id}`}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Contacted
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateInquiryStatus.mutate({ id: request.id, status: 'closed' })}
                            data-testid={`button-close-${request.id}`}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Close
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mb-4 text-green-500" />
                  <p className="font-medium text-green-600">All caught up!</p>
                  <p className="text-sm">No pending retainer requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <div className="space-y-6">
            {/* Source Breakdown Chart */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Lead Source Breakdown
                    </CardTitle>
                    <CardDescription>Leads grouped by originating page or source</CardDescription>
                  </div>
                  {leads && leads.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {leads.length} total lead{leads.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : leads && leads.length > 0 ? (() => {
                  const sourceCounts = leads.reduce<Record<string, number>>((acc, lead) => {
                    const src = lead.source || 'unknown';
                    acc[src] = (acc[src] || 0) + 1;
                    return acc;
                  }, {});
                  const total = leads.length;
                  const chartData = Object.entries(sourceCounts)
                    .map(([source, count]) => ({
                      source,
                      count,
                      pct: Math.round((count / total) * 100),
                    }))
                    .sort((a, b) => b.count - a.count);

                  return (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 48)}>
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="source"
                            width={160}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [`${value} leads`, 'Count']}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {chartData.map((_entry, index) => (
                              <Cell key={index} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                            ))}
                            <LabelList
                              dataKey="pct"
                              position="right"
                              formatter={(v: number) => `${v}%`}
                              style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {chartData.map((item, index) => (
                          <div
                            key={item.source}
                            className="flex items-center gap-2 rounded-lg border p-3"
                            data-testid={`source-breakdown-${item.source}`}
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ background: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">{item.source}</div>
                              <div className="text-xs text-muted-foreground">{item.count} ({item.pct}%)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-center text-muted-foreground py-8">No leads captured yet</div>
                )}
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Lead Captures</CardTitle>
                    <CardDescription>All captured leads with source information</CardDescription>
                  </div>
                  <Button onClick={handleExportLeads} data-testid="button-export-leads">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Captured</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads?.map((lead) => (
                        <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {lead.source || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(lead.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                      {(!leads || leads.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No leads captured yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ask Corey Trials Tab */}
        <TabsContent value="trial-leads">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-accent" />
                    Ask Corey Trial Users
                  </CardTitle>
                  <CardDescription>People who tried Ask Corey before signing up — click any row to see what they asked</CardDescription>
                </div>
                <Button onClick={() => window.open('/api/superadmin/trial-leads/export', '_blank')} data-testid="button-export-trial-leads">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trialLeadsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Questions</TableHead>
                      <TableHead>What They Asked</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialLeads?.map((lead) => {
                      const firstQ = lead.questions && lead.questions.length > 0 ? lead.questions[0] : null;
                      const hasMore = lead.questions && lead.questions.length > 1;
                      return (
                        <TableRow
                          key={lead.id}
                          data-testid={`row-trial-lead-${lead.id}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedTrialLead(lead)}
                        >
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={lead.questionCount >= 3 ? "destructive" : "secondary"}>
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {lead.questionCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {firstQ ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground truncate">
                                  "{firstQ.length > 70 ? firstQ.slice(0, 70) + "…" : firstQ}"
                                </span>
                                {hasMore && (
                                  <Badge variant="outline" className="text-xs shrink-0">+{lead.questions!.length - 1} more</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No questions recorded yet</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(lead.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(!trialLeads || trialLeads.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No trial users yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {trialLeads && trialLeads.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Total trial users: {trialLeads.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!selectedTrialLead} onOpenChange={(open) => { if (!open) setSelectedTrialLead(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-accent" />
                  {selectedTrialLead?.name}'s Corey Conversation
                </DialogTitle>
              </DialogHeader>
              {selectedTrialLead && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground border-b pb-3">
                    <span>{selectedTrialLead.email}</span>
                    <span>·</span>
                    <Badge variant={selectedTrialLead.questionCount >= 3 ? "destructive" : "secondary"}>
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {selectedTrialLead.questionCount} question{selectedTrialLead.questionCount !== 1 ? "s" : ""}
                    </Badge>
                    <span>·</span>
                    <span>{formatDate(selectedTrialLead.createdAt)}</span>
                  </div>
                  {selectedTrialLead.questions && selectedTrialLead.questions.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Questions Asked</p>
                      {selectedTrialLead.questions.map((q, i) => (
                        <div key={i} className="flex gap-2 bg-muted/40 rounded-md px-3 py-2">
                          <span className="text-accent font-bold text-sm shrink-0">Q{i + 1}</span>
                          <p className="text-sm">{q}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      This visitor signed up before question tracking was enabled — no questions on record.
                    </p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tool Usage Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Company Tool Usage
              </CardTitle>
              <CardDescription>See which tools and features each company is actively using</CardDescription>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-center">Corey Chats</TableHead>
                        <TableHead className="text-center">Messages</TableHead>
                        <TableHead className="text-center">Employees</TableHead>
                        <TableHead className="text-center">Incidents</TableHead>
                        <TableHead className="text-center">Audit Items</TableHead>
                        <TableHead className="text-center">DOT Alerts</TableHead>
                        <TableHead>Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsage?.map((usage) => {
                        const totalActivity = Number(usage.messages_count) + Number(usage.employees_count) + Number(usage.incidents_count) + Number(usage.audit_items_completed) + Number(usage.dot_notifications_count);
                        return (
                          <TableRow key={usage.user_id} data-testid={`row-usage-${usage.user_id}`}>
                            <TableCell>
                              <div className="font-medium">{usage.company_name}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={usage.plan_status === 'active' ? 'default' : 'secondary'}>
                                {planLabels[usage.plan || ''] || 'Free'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={Number(usage.conversations_count) > 0 ? 'font-medium text-accent' : 'text-muted-foreground'}>
                                {usage.conversations_count}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={Number(usage.messages_count) > 0 ? 'font-medium text-accent' : 'text-muted-foreground'}>
                                {usage.messages_count}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={Number(usage.employees_count) > 0 ? 'font-medium text-blue-600' : 'text-muted-foreground'}>
                                {usage.employees_count}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={Number(usage.incidents_count) > 0 ? 'font-medium text-orange-600' : 'text-muted-foreground'}>
                                {usage.incidents_count}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={Number(usage.audit_items_completed) > 0 ? 'font-medium text-purple-600' : 'text-muted-foreground'}>
                                {usage.audit_items_completed}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={Number(usage.dot_notifications_count) > 0 ? 'font-medium text-green-600' : 'text-muted-foreground'}>
                                {usage.dot_notifications_count}
                              </span>
                            </TableCell>
                            <TableCell>
                              {usage.last_corey_activity ? (
                                <span className="text-sm text-muted-foreground">
                                  {new Date(usage.last_corey_activity).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Never</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!companyUsage || companyUsage.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                            No usage data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Traffic Tab */}
        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Site Traffic Analytics
              </CardTitle>
              <CardDescription>Page visits tracked across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{siteVisitStats?.totalVisits?.toLocaleString() || '0'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Today's Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{siteVisitStats?.todayVisits?.toLocaleString() || '0'}</div>
                  </CardContent>
                </Card>
              </div>

              {siteVisitStats?.last30Days && siteVisitStats.last30Days.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Last 30 Days Traffic</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={siteVisitStats.last30Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} name="Views" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {siteVisitStats?.topPages && siteVisitStats.topPages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Top Pages</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {siteVisitStats.topPages.map((p, i) => (
                        <TableRow key={p.page} data-testid={`row-page-${i}`}>
                          <TableCell className="font-medium">{p.page}</TableCell>
                          <TableCell className="text-right">{p.count.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
