import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Users, TrendingUp, AlertTriangle, Download, Mail, Building2, UserCheck, Clock, CheckCircle2, XCircle, Bot, MessageSquare } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
  createdAt: string | null;
};

type TrialLead = {
  id: number;
  name: string;
  email: string;
  questionCount: number;
  createdAt: string | null;
};

const planLabels: Record<string, string> = {
  'free': 'Free',
  'cch_unlimited_safety': 'Unlimited Safety ($99)',
  'acsi_iso_essentials': 'ISO Essentials ($49)',
  'acsi_iso_professional': 'ISO Professional ($149)',
  'integrated_enterprise': 'Enterprise ($299)',
  'human_expert_retainer': 'Expert Retainer ($499)',
};

export default function SuperAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      <div className="grid gap-4 md:grid-cols-3">
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
              <CardDescription>Priority tickets from $99/mo tier - requires personal response</CardDescription>
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lead Captures</CardTitle>
                  <CardDescription>Users who downloaded the Recordability Cheat Sheet</CardDescription>
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
                      <TableHead>Captured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads?.map((lead) => (
                      <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{formatDate(lead.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {(!leads || leads.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No leads captured yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
              {leads && leads.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Total leads: {leads.length}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
