import { ProtectedLayout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Mail, Crown, UserPlus, UserMinus, Shield, Loader2, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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
  } | null;
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
  role: string | null;
}

export default function TeamSeats() {
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
      window.history.replaceState({}, '', '/team-seats');
    }
  }, []);

  const { data: teamData, isLoading } = useQuery<TeamData>({
    queryKey: ['/api/team'],
    queryFn: async () => {
      const res = await fetch('/api/team', { credentials: 'include' });
      if (res.status === 401) return { team: null, members: [], isAdmin: false, role: null };
      if (res.status === 404) return { team: null, members: [], isAdmin: false, role: null };
      if (!res.ok) throw new Error('Failed to fetch team');
      const data = await res.json();
      return {
        team: data.team,
        members: data.members || [],
        isAdmin: data.role === 'admin',
        role: data.role,
      };
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

  const team = teamData?.team;
  const members = teamData?.members || [];
  const isAdmin = teamData?.isAdmin || false;
  const activeMembers = members.filter(m => m.status === 'active' || m.status === 'invited');
  const seatsUsed = activeMembers.length;

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Corey Team Seats
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage multi-seat Corey subscriptions for your team — $199/seat/month, billed together
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5" /> Team Seats</CardTitle>
            </CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        ) : !team ? (
          <Card className="border-2 border-dashed border-muted">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Users className="w-5 h-5" /> Create Your Team</CardTitle>
              <CardDescription>Purchase multiple Corey seats for your team — $199/seat/month, billed together</CardDescription>
            </CardHeader>
            <CardContent>
              {!showCreateForm ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Team Access for Corey</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create a team to manage multiple Corey subscriptions under one bill. Each team member gets their own private Corey access with isolated conversations.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="gap-2" size="lg" data-testid="button-create-team">
                    <Users className="w-4 h-4" /> Create a Team
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-w-md mx-auto">
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
                      ${newTeamSeats * 199}/mo for {newTeamSeats} seats
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
        ) : (
          <Card className="border-2 border-primary/30">
            <CardHeader>
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="w-5 h-5" /> {team.companyName}
                  </CardTitle>
                  <CardDescription>
                    {seatsUsed} of {team.totalSeats} seats used — ${team.totalSeats * 199}/mo
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
                  <p className="text-sm text-muted-foreground">Subscribe your team to Corey for ${team.totalSeats * 199}/mo ({team.totalSeats} seats x $199/seat)</p>
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
                      -
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
                    <span className="text-sm text-muted-foreground">seats x $199/mo = <strong>${team.totalSeats * 199}/mo</strong></span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  );
}
