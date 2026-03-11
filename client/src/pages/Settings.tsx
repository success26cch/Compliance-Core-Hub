import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus, useCreateCheckoutSession } from "@/hooks/use-subscriptions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Shield, Building2, User, X, Loader2, Users, Mail, Crown, UserPlus, UserMinus, Calendar, CreditCard } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface TeamData {
  team: {
    id: number;
    adminUserId: string;
    companyName: string;
    totalSeats: number;
    status: string;
    stripeSubscriptionId?: string;
  };
  members: Array<{
    id: number;
    teamId: number;
    userId: string | null;
    email: string;
    name: string | null;
    role: string;
    status: string;
    invitedAt: string;
    joinedAt: string | null;
  }>;
  isAdmin: boolean;
}

function TeamManagement() {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSeats, setNewTeamSeats] = useState(2);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('team_checkout') === 'success') {
      fetch('/api/team/activate', { method: 'POST', credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            toast({ title: "Team Activated!", description: "Your team subscription is now active." });
            queryClient.invalidateQueries({ queryKey: ['/api/team'] });
            queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/status'] });
          }
        })
        .catch(() => {});
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const { data: teamData, isLoading } = useQuery<TeamData | null>({
    queryKey: ['/api/team'],
    queryFn: async () => {
      const res = await fetch('/api/team', { credentials: 'include' });
      if (res.status === 401) return null;
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch team');
      return res.json();
    },
  });

  const createTeam = useMutation({
    mutationFn: async (data: { companyName: string; totalSeats: number }) => {
      const res = await apiRequest('POST', '/api/team', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      setShowCreateForm(false);
      setNewTeamName('');
      setNewTeamSeats(2);
      toast({ title: "Team Created", description: "Your team has been set up. You can now invite members." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create team.", variant: "destructive" });
    },
  });

  const inviteMember = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await apiRequest('POST', '/api/team/members', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      setInviteEmail('');
      setInviteName('');
      toast({ title: "Invite Sent", description: "Team member has been invited. Share the join link with them." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to invite member.", variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest('DELETE', `/api/team/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({ title: "Member Removed", description: "Team member has been removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to remove member.", variant: "destructive" });
    },
  });

  const updateSeats = useMutation({
    mutationFn: async (totalSeats: number) => {
      const res = await apiRequest('PATCH', '/api/team/seats', { totalSeats });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({ title: "Seats Updated", description: "Team seat count has been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update seats.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5" /> Team Seats</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (!teamData) {
    return (
      <Card className="border-2 border-dashed border-muted">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5" /> Team Seats</CardTitle>
          <CardDescription>Purchase multiple Corey seats for your team — $199/seat/month, billed together</CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">Create a team to manage multiple Corey subscriptions under one bill. Each team member gets their own private Corey access.</p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2" data-testid="button-create-team">
                <Users className="w-4 h-4" /> Create a Team
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="team-name">Company / Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Acme Safety Corp"
                  data-testid="input-team-name"
                />
              </div>
              <div>
                <Label htmlFor="team-seats">Number of Seats</Label>
                <Input
                  id="team-seats"
                  type="number"
                  min={2}
                  max={100}
                  value={newTeamSeats}
                  onChange={(e) => setNewTeamSeats(parseInt(e.target.value) || 2)}
                  data-testid="input-team-seats"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ${newTeamSeats * 99}/mo for {newTeamSeats} seats
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => createTeam.mutate({ companyName: newTeamName, totalSeats: newTeamSeats })}
                  disabled={!newTeamName || newTeamSeats < 2 || createTeam.isPending}
                  data-testid="button-confirm-create-team"
                >
                  {createTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Team
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const { team, members, isAdmin } = teamData;
  const activeMembers = members.filter(m => m.status === 'active' || m.status === 'invited');
  const seatsUsed = activeMembers.length;

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5" /> {team.companyName}
            </CardTitle>
            <CardDescription>
              {seatsUsed} of {team.totalSeats} seats used — ${team.totalSeats * 99}/mo
            </CardDescription>
          </div>
          <Badge variant={team.status === 'active' ? 'default' : 'secondary'} data-testid="badge-team-status">
            {team.status === 'active' ? 'Active' : team.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Team Members</h4>
          <div className="space-y-2">
            {members.filter(m => m.status !== 'removed').map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30" data-testid={`team-member-${member.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {member.role === 'admin' ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{member.name || member.email}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {member.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.status === 'active' ? 'default' : 'outline'} className="text-xs">
                    {member.status === 'active' ? 'Active' : member.status === 'invited' ? 'Pending' : member.status}
                  </Badge>
                  {isAdmin && member.role !== 'admin' && member.status !== 'removed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember.mutate(member.id)}
                      disabled={removeMember.isPending}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      data-testid={`button-remove-member-${member.id}`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && seatsUsed < team.totalSeats && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Invite Team Member
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="sm:w-40"
                data-testid="input-invite-name"
              />
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                data-testid="input-invite-email"
              />
              <Button
                onClick={() => inviteMember.mutate({ email: inviteEmail, name: inviteName })}
                disabled={!inviteEmail || inviteMember.isPending}
                className="gap-2"
                data-testid="button-invite-member"
              >
                {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Invite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {team.totalSeats - seatsUsed} seat(s) available. Each member gets their own private Corey access.
            </p>
          </div>
        )}

        {isAdmin && !team.stripeSubscriptionId && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Activate Team Subscription</h4>
            <p className="text-sm text-muted-foreground">Subscribe your team to Corey for ${team.totalSeats * 199}/mo ({team.totalSeats} seats × $199/seat)</p>
            <Button
              onClick={() => {
                fetch('/api/team/checkout', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
                  .then(r => r.json())
                  .then(data => { if (data.url) window.location.href = data.url; else toast({ title: "Error", description: data.message, variant: "destructive" }); })
                  .catch(() => toast({ title: "Error", description: "Failed to start checkout.", variant: "destructive" }));
              }}
              className="gap-2 bg-accent hover:bg-accent/90 text-white font-bold"
              data-testid="button-team-checkout"
            >
              <Shield className="w-4 h-4" /> Subscribe Team — ${team.totalSeats * 99}/mo
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Manage Seats</h4>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSeats.mutate(team.totalSeats - 1)}
                disabled={team.totalSeats <= seatsUsed || updateSeats.isPending}
                data-testid="button-decrease-seats"
              >
                −
              </Button>
              <span className="font-semibold text-lg min-w-[3ch] text-center" data-testid="text-total-seats">{team.totalSeats}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSeats.mutate(team.totalSeats + 1)}
                disabled={updateSeats.isPending}
                data-testid="button-increase-seats"
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground">seats × $199/mo = <strong>${team.totalSeats * 199}/mo</strong></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { data: subStatus, isLoading } = useSubscriptionStatus();
  const { mutate: checkout, isPending } = useCreateCheckoutSession();
  const { toast } = useToast();

  const PRO_PRICE_ID = "price_1234567890"; 

  const handleUpgrade = () => {
    checkout(PRO_PRICE_ID);
  };

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('platform_checkout') === 'success') {
      const plan = params.get('plan');
      if (plan && plan !== 'setup_fee') {
        fetch('/api/subscriptions/activate-platform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ plan }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              toast({ title: "Subscription Activated!", description: "Your plan is now active." });
              queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/status'] });
              if (plan === 'corey_pro') {
                window.location.href = "/corey-profile";
                return;
              }
              if (plan === 'isa' || plan === 'isa_pro') {
                window.location.href = "/isa-profile";
                return;
              }
            }
          })
          .catch(() => {});
      } else if (plan === 'setup_fee') {
        toast({ title: "Setup Fee Paid!", description: "Our team will begin your onboarding process." });
      }
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handlePlatformCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch('/api/subscriptions/platform-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Failed to create checkout');
      const data = await res.json();
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to open portal');
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      toast({ title: "Error", description: "Unable to open subscription management.", variant: "destructive" });
    }
  };

  const currentPlan = subStatus?.plan || null;
  const hasPlatform = (subStatus as any)?.hasPlatform || false;
  const isCoreyPro = subStatus?.isPro && !hasPlatform;

  const getPlanLabel = () => {
    if (hasPlatform) return 'Employer Compliance Platform';
    if (subStatus?.isPro) return 'Unlimited Corey (Corey AI)';
    return 'No Active Subscription';
  };

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold font-display text-primary">Account & Subscription</h2>
            <p className="text-muted-foreground">Manage your CCHUB plan, company profile, and compliance tools</p>
          </div>
        </div>

        <Card data-testid="card-account-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <div className="text-base font-medium" data-testid="text-user-name">{user?.firstName} {user?.lastName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="text-base font-medium" data-testid="text-user-email">{user?.email}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                <div className="flex items-center gap-2">
                  <Badge variant={hasPlatform ? "default" : subStatus?.isPro ? "secondary" : "outline"} className="text-sm" data-testid="badge-current-plan">
                    {getPlanLabel()}
                  </Badge>
                </div>
              </div>
            </div>
            {((subStatus as any)?.joinDate || (subStatus as any)?.nextPaymentDate) && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                {(subStatus as any)?.joinDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <div className="text-base font-medium" data-testid="text-join-date">
                        {new Date((subStatus as any).joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}
                {(subStatus as any)?.nextPaymentDate && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Next Payment</label>
                      <div className="text-base font-medium" data-testid="text-next-payment">
                        {new Date((subStatus as any).nextPaymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-bold mb-4 text-primary">Choose Your Plan</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className={`border-2 relative ${isCoreyPro ? 'border-primary bg-primary/5' : 'border-border'}`} data-testid="card-plan-corey">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Unlimited Corey</CardTitle>
                  {isCoreyPro && <Badge variant="default" className="text-xs">Current</Badge>}
                </div>
                <div className="text-3xl font-bold text-primary">$199<span className="text-base font-normal text-muted-foreground">/mo per user</span></div>
                <CardDescription>Unlimited Corey AI access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Unlimited Corey Interactions</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Compliance Checklist Library (downloadable PDFs)</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Interactive Audit Prep Tools with progress tracking</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>DOT physical & drug testing guidance</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Workers' comp documentation help</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Custom compliance reports</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Priority response times</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Dedicated support</span></div>
              </CardContent>
              <CardFooter>
                {!subStatus?.isPro && (
                  <Button
                    className="w-full"
                    onClick={() => handlePlatformCheckout('corey_pro')}
                    disabled={!!checkoutLoading}
                    data-testid="button-subscribe-corey"
                  >
                    {checkoutLoading === 'corey_pro' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Subscribe - $199/mo
                  </Button>
                )}
                {isCoreyPro && (
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} data-testid="button-manage-corey">
                    Manage Subscription
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card className={`border-2 relative ${hasPlatform ? 'border-accent bg-accent/5' : 'border-accent/50'}`} data-testid="card-plan-platform">
              {!hasPlatform && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-white px-3 py-1 text-xs font-bold">One Platform. Everything Included.</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Employer Platform</CardTitle>
                  {hasPlatform && <Badge className="bg-accent text-white text-xs">Current</Badge>}
                </div>
                <div className="text-3xl font-bold text-accent">$599<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <CardDescription>Up to 50 employees included · +$2/employee beyond 50</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider pb-1">Health & Safety</p>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Compliance Dashboard with real-time metrics</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Employee tracking & medical surveillance</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>OSHA 300 logging & incident management</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>DOT notifications & drug testing tools</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Medical Passport with QR check-in</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Corrective Action Plans (CAPA)</span></div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider pt-2 pb-1">ISO & Audit Readiness</p>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>ISO 9001/14001/45001 AI guidance</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>AI Gap Analysis & audit checklists</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Quality Manual & procedure drafting</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>'Write-Up Free' Guarantee tools</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Management Review templates</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Audit Readiness Dashboard</span></div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider pt-2 pb-1">Also Included</p>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Supplier audit checklists</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Document control & tracking</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Certification Readiness Score</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Compliance Glossary (OSHA, DOT, ISO & more)</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Priority expert support</span></div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider pt-2 pb-1">Add Corey AI (optional)</p>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>1 Corey AI seat included at $699/mo total (+$129/ea additional seat)</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Standalone Corey also available at $199/mo per user</span></div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                {!hasPlatform && (
                  <>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-white font-bold"
                      onClick={() => handlePlatformCheckout('employer_platform_with_corey')}
                      disabled={!!checkoutLoading}
                      data-testid="button-subscribe-platform-with-corey"
                    >
                      {checkoutLoading === 'employer_platform_with_corey' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crown className="w-4 h-4 mr-2" />}
                      Platform + Corey AI — $699/mo
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePlatformCheckout('employer_platform')}
                      disabled={!!checkoutLoading}
                      data-testid="button-subscribe-platform"
                    >
                      {checkoutLoading === 'employer_platform' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Platform Only — $599/mo
                    </Button>
                  </>
                )}
                {hasPlatform && (
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription} data-testid="button-manage-platform">
                    Manage Subscription
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>

        {!hasPlatform && (
          <Card className="border border-dashed border-accent/40 bg-accent/5" data-testid="card-setup-fee">
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-accent/10 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Platform Setup & Onboarding</h4>
                    <p className="text-sm text-muted-foreground">One-time $499 fee. We configure your company profile, import employees, set up clinic locations, and walk you through every feature.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0 border-accent/50 text-accent hover:bg-accent/10"
                  onClick={() => handlePlatformCheckout('setup_fee')}
                  disabled={!!checkoutLoading}
                  data-testid="button-setup-fee"
                >
                  {checkoutLoading === 'setup_fee' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Add Setup - $499
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </ProtectedLayout>
  );
}
