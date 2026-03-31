import { ProtectedLayout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Crown, UserPlus, UserMinus, Shield, Loader2, Video,
  Building2, Pin, PinOff, Megaphone, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Flame, BookOpen, Plus, Trash2,
  UserCog, Activity, BarChart3, Save, Lock, Eye, EyeOff, Info,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: number; teamId: number; userId: string | null;
  email: string; name: string | null; role: string; status: string;
  inviteToken?: string; departmentId?: number | null; jobTitle?: string | null;
  invitedAt: string; joinedAt: string | null;
}
interface TeamData {
  team: { id: number; adminUserId: string; companyName: string; totalSeats: number; status: string; } | null;
  members: TeamMember[]; isAdmin: boolean; role: string | null;
}
interface VisibilitySettings { incidentSummary: boolean; medicalDetails: boolean; restrictionDetails: boolean; capaDetails: boolean; trainingStatus: boolean; }
interface Department { id: number; teamId: number; name: string; description?: string | null; color: string; supervisorMemberId?: number | null; supervisorName?: string | null; visibilitySettings?: VisibilitySettings | null; createdAt: string; }
interface Announcement { id: number; teamId: number; authorName: string; authorEmail?: string | null; title: string; body: string; category: string; isPinned: boolean; createdAt: string; }
interface ComplianceData {
  viewerRole: string; restricted: boolean; message?: string;
  supervisedDeptNames?: string[]; visibilitySettings?: VisibilitySettings | null;
  summary: { incidentsLast30Days: number; totalOpenCAPAs: number; overdueCAPAs: number; totalRecordables: number; totalIncidents: number; } | null;
  byDepartment: { incidents: Record<string, number>; capas: Record<string, number>; } | null;
  recentIncidents: any[]; overdueCAPAList: any[];
}

// ── Colour helpers ───────────────────────────────────────────────────────────

const DEPT_COLORS: { value: string; label: string; cls: string; bg: string }[] = [
  { value: "blue",   label: "Blue",   cls: "bg-blue-100 text-blue-800 border-blue-200",   bg: "bg-blue-500" },
  { value: "green",  label: "Green",  cls: "bg-green-100 text-green-800 border-green-200", bg: "bg-green-500" },
  { value: "orange", label: "Orange", cls: "bg-orange-100 text-orange-800 border-orange-200", bg: "bg-orange-500" },
  { value: "red",    label: "Red",    cls: "bg-red-100 text-red-800 border-red-200",       bg: "bg-red-500" },
  { value: "purple", label: "Purple", cls: "bg-purple-100 text-purple-800 border-purple-200", bg: "bg-purple-500" },
  { value: "yellow", label: "Yellow", cls: "bg-yellow-100 text-yellow-800 border-yellow-200", bg: "bg-yellow-500" },
];
const deptColorCls = (c: string) => DEPT_COLORS.find(d => d.value === c)?.cls ?? DEPT_COLORS[0].cls;
const deptBg = (c: string) => DEPT_COLORS.find(d => d.value === c)?.bg ?? "bg-blue-500";

const ANN_CATEGORIES: { value: string; label: string; icon: any; cls: string }[] = [
  { value: "general",  label: "General",  icon: Megaphone,    cls: "bg-slate-100 text-slate-700" },
  { value: "safety",   label: "Safety",   icon: AlertTriangle, cls: "bg-orange-100 text-orange-700" },
  { value: "policy",   label: "Policy",   icon: Shield,        cls: "bg-blue-100 text-blue-700" },
  { value: "training", label: "Training", icon: BookOpen,      cls: "bg-green-100 text-green-700" },
  { value: "urgent",   label: "Urgent",   icon: Flame,         cls: "bg-red-100 text-red-700" },
];
const annCat = (v: string) => ANN_CATEGORIES.find(a => a.value === v) ?? ANN_CATEGORIES[0];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeamSeats() {
  const { toast } = useToast();
  const [tab, setTab] = useState("people");

  // form states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamSeats, setNewTeamSeats] = useState(2);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // dept form
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "blue", supervisorMemberId: "", supervisorName: "" });
  const [showDeptForm, setShowDeptForm] = useState(false);

  // announcement form
  const [annForm, setAnnForm] = useState({ title: "", body: "", category: "general" });
  const [showAnnForm, setShowAnnForm] = useState(false);

  // member dept assignment
  const [assigningMember, setAssigningMember] = useState<number | null>(null);
  const [assignDept, setAssignDept] = useState("");
  const [assignTitle, setAssignTitle] = useState("");
  const [assignRole, setAssignRole] = useState("member");

  // seat editor
  const [showSeatEditor, setShowSeatEditor] = useState(false);
  const [seatDraft, setSeatDraft] = useState(1);

  // per-department visibility editor
  const [editingVisibility, setEditingVisibility] = useState<number | null>(null);
  const [visibilityDraft, setVisibilityDraft] = useState<VisibilitySettings>({ incidentSummary: true, medicalDetails: false, restrictionDetails: false, capaDetails: true, trainingStatus: true });

  // On successful checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("team_checkout") === "success") {
      fetch("/api/team/activate", { method: "POST", credentials: "include" })
        .then(r => r.json()).then(data => {
          if (data.success) {
            toast({ title: "Team Activated!", description: "Your team subscription is now active." });
            queryClient.invalidateQueries({ queryKey: ["/api/team"] });
          }
        }).catch(() => {});
      window.history.replaceState({}, "", "/team-seats");
    }
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: teamData, isLoading: teamLoading } = useQuery<TeamData>({ queryKey: ["/api/team"] });
  const { data: departments = [], isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ["/api/team/departments"],
    enabled: !!teamData?.team,
  });
  const { data: announcements = [], isLoading: annsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/team/announcements"],
    enabled: !!teamData?.team,
  });
  const { data: compliance, isLoading: compLoading } = useQuery<ComplianceData>({
    queryKey: ["/api/team/compliance"],
    enabled: !!teamData?.team,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const createTeam = useMutation({
    mutationFn: () => apiRequest("POST", "/api/team", { companyName: newTeamName, totalSeats: newTeamSeats }).then(r => r.json()),
    onSuccess: () => { toast({ title: "Team created!" }); queryClient.invalidateQueries({ queryKey: ["/api/team"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const inviteMember = useMutation({
    mutationFn: () => apiRequest("POST", "/api/team/members", { email: inviteEmail, name: inviteName }).then(r => r.json()),
    onSuccess: () => { toast({ title: "Invite sent!", description: `${inviteEmail} was invited.` }); setInviteEmail(""); setInviteName(""); queryClient.invalidateQueries({ queryKey: ["/api/team"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMember = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/team/members/${id}`).then(r => r.json()),
    onSuccess: () => { toast({ title: "Member removed" }); queryClient.invalidateQueries({ queryKey: ["/api/team"] }); },
  });

  const createDept = useMutation({
    mutationFn: () => {
      const sup = deptForm.supervisorMemberId ? teamData?.members.find(m => m.id === parseInt(deptForm.supervisorMemberId)) : null;
      return apiRequest("POST", "/api/team/departments", { ...deptForm, supervisorMemberId: sup?.id ?? null, supervisorName: (sup?.name ?? deptForm.supervisorName) || null }).then(r => r.json());
    },
    onSuccess: () => { toast({ title: "Department created!" }); setDeptForm({ name: "", description: "", color: "blue", supervisorMemberId: "", supervisorName: "" }); setShowDeptForm(false); queryClient.invalidateQueries({ queryKey: ["/api/team/departments"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteDept = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/team/departments/${id}`).then(r => r.json()),
    onSuccess: () => { toast({ title: "Department removed" }); queryClient.invalidateQueries({ queryKey: ["/api/team/departments"] }); queryClient.invalidateQueries({ queryKey: ["/api/team"] }); },
  });

  const assignMemberDept = useMutation({
    mutationFn: ({ memberId, departmentId, jobTitle, role }: { memberId: number; departmentId: number | null; jobTitle: string; role: string }) =>
      apiRequest("PATCH", `/api/team/members/${memberId}/department`, { departmentId, jobTitle, role }).then(r => r.json()),
    onSuccess: () => { toast({ title: "Member updated" }); setAssigningMember(null); queryClient.invalidateQueries({ queryKey: ["/api/team"] }); },
  });

  const updateVisibility = useMutation({
    mutationFn: ({ deptId, settings }: { deptId: number; settings: VisibilitySettings }) =>
      apiRequest("PATCH", `/api/team/departments/${deptId}`, { visibilitySettings: settings }).then(r => r.json()),
    onSuccess: () => { toast({ title: "Visibility settings saved" }); setEditingVisibility(null); queryClient.invalidateQueries({ queryKey: ["/api/team/departments"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createAnn = useMutation({
    mutationFn: () => apiRequest("POST", "/api/team/announcements", annForm).then(r => r.json()),
    onSuccess: () => { toast({ title: "Announcement posted!" }); setAnnForm({ title: "", body: "", category: "general" }); setShowAnnForm(false); queryClient.invalidateQueries({ queryKey: ["/api/team/announcements"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pinAnn = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/team/announcements/${id}/pin`).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/team/announcements"] }),
  });

  const deleteAnn = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/team/announcements/${id}`).then(r => r.json()),
    onSuccess: () => { toast({ title: "Announcement deleted" }); queryClient.invalidateQueries({ queryKey: ["/api/team/announcements"] }); },
  });

  const updateSeats = useMutation({
    mutationFn: (seats: number) => apiRequest("PATCH", "/api/team/seats", { totalSeats: seats }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Seats updated!", description: "Your team seat count has been updated." });
      setShowSeatEditor(false);
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Start video meeting ──────────────────────────────────────────────────
  function startMeeting() {
    const teamName = (teamData?.team?.companyName ?? "cchub-team").replace(/\s+/g, "-").toLowerCase();
    const room = `${teamName}-${Math.random().toString(36).slice(2, 7)}`;
    window.open(`https://meet.jit.si/${room}`, "_blank", "noopener,noreferrer");
  }

  // ── Loading / no-team states ─────────────────────────────────────────────
  if (teamLoading) return (
    <ProtectedLayout>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </ProtectedLayout>
  );

  if (!teamData?.team) return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
          <Users className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Create Your Team</h1>
        <p className="text-muted-foreground mb-8">Set up your workspace to invite colleagues, manage departments, and track compliance across your organization.</p>
        {!showCreateForm ? (
          <Button onClick={() => setShowCreateForm(true)} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-create-team">
            <Plus className="w-4 h-4 mr-2" /> Create Team
          </Button>
        ) : (
          <Card className="text-left">
            <CardContent className="pt-6 space-y-4">
              <div><Label>Company / Team Name</Label><Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Acme Safety Team" data-testid="input-team-name" /></div>
              <div><Label>Number of Seats (Corey AI users) — $199/seat/mo</Label><Input type="number" min={1} value={newTeamSeats} onChange={e => setNewTeamSeats(parseInt(e.target.value))} data-testid="input-team-seats" /></div>
              <div className="flex gap-2">
                <Button onClick={() => createTeam.mutate()} disabled={!newTeamName || createTeam.isPending} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-confirm-create-team">
                  {createTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Team"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedLayout>
  );

  const team = teamData.team;
  const members = teamData.members.filter(m => m.status !== "removed");
  const activeCount = members.filter(m => m.status === "active").length;
  const isAdmin = teamData.role === "admin" || (teamData as any).isAdmin === true;

  // ── Full team hub ────────────────────────────────────────────────────────
  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="bg-[hsl(222,47%,11%)] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{team.companyName}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <Badge className={team.status === "active" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"}>
                  {team.status === "active" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                  {team.status}
                </Badge>
                <span className="text-white/50 text-sm">{activeCount} of {team.totalSeats} seats used</span>
                <span className="text-white/50 text-sm">·</span>
                <span className="text-white/50 text-sm">{departments.length} department{departments.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-black text-white hover:bg-black/80 shrink-0"
                onClick={() => { setSeatDraft(team.totalSeats); setShowSeatEditor(true); }}
                data-testid="button-manage-seats"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Seats
              </Button>
            )}
            <Button onClick={startMeeting} className="bg-accent hover:bg-accent/90 text-white shrink-0" data-testid="button-start-meeting">
              <Video className="w-4 h-4 mr-2" /> Start Video Meeting
            </Button>
          </div>
        </div>

        {/* Seat Editor (inline) */}
        {isAdmin && showSeatEditor && (
          <Card className="border-accent/30 bg-accent/5" data-testid="card-seat-editor">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" /> Manage Seat Count
              </CardTitle>
              <CardDescription>
                You currently have {team.totalSeats} seat{team.totalSeats !== 1 ? "s" : ""} and {activeCount} active member{activeCount !== 1 ? "s" : ""}. Increase seats to invite more people.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSeatDraft(d => Math.max(activeCount, d - 1))}
                    disabled={seatDraft <= activeCount}
                    data-testid="button-seat-minus"
                    className="w-8 h-8 p-0"
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min={activeCount}
                    value={seatDraft}
                    onChange={e => setSeatDraft(Math.max(activeCount, parseInt(e.target.value) || activeCount))}
                    className="w-20 text-center"
                    data-testid="input-seat-count"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSeatDraft(d => d + 1)}
                    data-testid="button-seat-plus"
                    className="w-8 h-8 p-0"
                  >
                    +
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {seatDraft > team.totalSeats ? `Adding ${seatDraft - team.totalSeats} seat${seatDraft - team.totalSeats !== 1 ? "s" : ""}` : seatDraft < team.totalSeats ? `Reducing to ${seatDraft} seat${seatDraft !== 1 ? "s" : ""}` : "No change"}
                </span>
                <div className="flex gap-2 sm:ml-auto">
                  <Button
                    size="sm"
                    className="bg-accent hover:bg-accent/90 text-white"
                    onClick={() => updateSeats.mutate(seatDraft)}
                    disabled={updateSeats.isPending || seatDraft === team.totalSeats}
                    data-testid="button-save-seats"
                  >
                    {updateSeats.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSeatEditor(false)} data-testid="button-cancel-seats">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="people" data-testid="tab-people"><Users className="w-4 h-4 mr-1.5 hidden sm:inline" />People</TabsTrigger>
            <TabsTrigger value="departments" data-testid="tab-departments"><Building2 className="w-4 h-4 mr-1.5 hidden sm:inline" />Departments</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance"><Activity className="w-4 h-4 mr-1.5 hidden sm:inline" />Compliance</TabsTrigger>
            <TabsTrigger value="announcements" data-testid="tab-announcements"><Megaphone className="w-4 h-4 mr-1.5 hidden sm:inline" />Feed</TabsTrigger>
          </TabsList>

          {/* ── PEOPLE TAB ──────────────────────────────────────────────── */}
          <TabsContent value="people" className="space-y-4 mt-4">
            {/* Invite form */}
            {isAdmin && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4 text-accent" />Invite Team Member</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input placeholder="Full name" value={inviteName} onChange={e => setInviteName(e.target.value)} className="flex-1" data-testid="input-invite-name" />
                    <Input type="email" placeholder="Work email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1" data-testid="input-invite-email" />
                    <Button onClick={() => inviteMember.mutate()} disabled={!inviteEmail || inviteMember.isPending || members.length >= team.totalSeats} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-send-invite">
                      {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1" />Invite</>}
                    </Button>
                  </div>
                  {members.length >= team.totalSeats && (
                    <p className="text-xs text-muted-foreground mt-2">All seats are filled. <button className="text-accent underline font-medium" data-testid="button-add-seats-inline" onClick={() => { setSeatDraft(team.totalSeats + 1); setShowSeatEditor(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Add more seats</button> to invite additional members.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Seat bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min((activeCount / team.totalSeats) * 100, 100)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{activeCount}/{team.totalSeats} seats</span>
            </div>

            {/* Member cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(member => {
                const dept = departments.find(d => d.id === member.departmentId);
                const isAssigning = assigningMember === member.id;
                return (
                  <Card key={member.id} className="relative" data-testid={`card-member-${member.id}`}>
                    <CardContent className="pt-5 pb-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{member.name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            {member.jobTitle && <p className="text-xs text-accent">{member.jobTitle}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {member.role === "admin" && <Crown className="w-3.5 h-3.5 text-amber-500" title="Admin" />}
                          {member.role === "supervisor" && <Shield className="w-3.5 h-3.5 text-blue-500" title="Supervisor" />}
                          <Badge variant="outline" className={`text-xs ${member.status === "active" ? "border-green-200 text-green-700" : "border-amber-200 text-amber-700"}`}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>

                      {dept && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${deptColorCls(dept.color)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${deptBg(dept.color)}`} />
                          {dept.name}
                        </div>
                      )}

                      {isAdmin && isAssigning && (
                        <div className="space-y-2 border-t pt-3 mt-2">
                          <Select value={assignDept} onValueChange={setAssignDept}>
                            <SelectTrigger className="h-8 text-xs" data-testid={`select-dept-${member.id}`}><SelectValue placeholder="Assign department…" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No department</SelectItem>
                              {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input className="h-8 text-xs" placeholder="Job title (optional)" value={assignTitle} onChange={e => setAssignTitle(e.target.value)} data-testid={`input-title-${member.id}`} />
                          <div>
                            <Label className="text-xs text-muted-foreground">Role</Label>
                            <Select value={assignRole} onValueChange={setAssignRole}>
                              <SelectTrigger className="h-8 text-xs mt-1" data-testid={`select-role-${member.id}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member"><span className="flex items-center gap-2"><Users className="w-3 h-3" />Member</span></SelectItem>
                                <SelectItem value="supervisor"><span className="flex items-center gap-2"><Shield className="w-3 h-3 text-blue-500" />Supervisor</span></SelectItem>
                              </SelectContent>
                            </Select>
                            {assignRole === "supervisor" && (
                              <p className="text-xs text-muted-foreground mt-1">Supervisors see compliance data for their department within the visibility settings you configure.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs flex-1 bg-accent hover:bg-accent/90 text-white" onClick={() => assignMemberDept.mutate({ memberId: member.id, departmentId: assignDept && assignDept !== "none" ? parseInt(assignDept) : null, jobTitle: assignTitle, role: assignRole })} data-testid={`button-save-dept-${member.id}`}>
                              <Save className="w-3 h-3 mr-1" />Save
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAssigningMember(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}

                      {isAdmin && !isAssigning && (
                        <div className="flex gap-1.5 border-t pt-2">
                          <Button size="sm" variant="ghost" className="h-7 text-xs flex-1 text-muted-foreground" onClick={() => { setAssigningMember(member.id); setAssignDept(member.departmentId ? String(member.departmentId) : "none"); setAssignTitle(member.jobTitle || ""); setAssignRole(member.role === "admin" ? "member" : member.role); }} data-testid={`button-assign-${member.id}`}>
                            <UserCog className="w-3 h-3 mr-1" />Assign
                          </Button>
                          {member.role !== "admin" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeMember.mutate(member.id)} data-testid={`button-remove-${member.id}`}>
                              <UserMinus className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ── DEPARTMENTS TAB ─────────────────────────────────────────── */}
          <TabsContent value="departments" className="space-y-4 mt-4">
            {isAdmin && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{departments.length} department{departments.length !== 1 ? "s" : ""} configured</p>
                <Button onClick={() => setShowDeptForm(!showDeptForm)} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-add-dept">
                  <Plus className="w-4 h-4 mr-2" />{showDeptForm ? "Cancel" : "Add Department"}
                </Button>
              </div>
            )}

            {showDeptForm && isAdmin && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Create Department</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Department Name *</Label>
                      <Input value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Safety & Compliance" data-testid="input-dept-name" />
                    </div>
                    <div>
                      <Label className="text-xs">Color</Label>
                      <Select value={deptForm.color} onValueChange={v => setDeptForm(f => ({ ...f, color: v }))}>
                        <SelectTrigger data-testid="select-dept-color"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEPT_COLORS.map(c => <SelectItem key={c.value} value={c.value}><span className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${c.bg}`} />{c.label}</span></SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description (optional)</Label>
                    <Input value={deptForm.description} onChange={e => setDeptForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this department handle?" data-testid="input-dept-desc" />
                  </div>
                  <div>
                    <Label className="text-xs">Supervisor</Label>
                    <Select value={deptForm.supervisorMemberId} onValueChange={v => setDeptForm(f => ({ ...f, supervisorMemberId: v }))}>
                      <SelectTrigger data-testid="select-dept-supervisor"><SelectValue placeholder="Select supervisor…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No supervisor assigned</SelectItem>
                        {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name || m.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => createDept.mutate()} disabled={!deptForm.name || createDept.isPending} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-create-dept">
                    {createDept.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Department"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {deptsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
            ) : departments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No departments yet</p>
                <p className="text-sm mb-4">Create departments to organize your team by function, location, or shift.</p>
                {isAdmin && !showDeptForm && (
                  <Button onClick={() => setShowDeptForm(true)} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-create-first-dept">
                    <Plus className="w-4 h-4 mr-2" />Create First Department
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {departments.map(dept => {
                  const deptMembers = members.filter(m => m.departmentId === dept.id);
                  const supervisor = members.find(m => m.id === dept.supervisorMemberId);
                  const deptIncidents = compliance?.byDepartment.incidents[dept.name] ?? 0;
                  const deptCAPAs = compliance?.byDepartment.capas[dept.name] ?? 0;
                  return (
                    <Card key={dept.id} className="overflow-hidden" data-testid={`card-dept-${dept.id}`}>
                      <div className={`h-1.5 ${deptBg(dept.color)}`} />
                      <CardContent className="pt-4 pb-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mb-2 ${deptColorCls(dept.color)}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${deptBg(dept.color)}`} />
                              {dept.name}
                            </div>
                            {dept.description && <p className="text-xs text-muted-foreground">{dept.description}</p>}
                          </div>
                          {isAdmin && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteDept.mutate(dept.id)} data-testid={`button-delete-dept-${dept.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

                        {supervisor && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            <span>Supervisor: <strong className="text-foreground">{supervisor.name || supervisor.email}</strong></span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span>{deptMembers.length} member{deptMembers.length !== 1 ? "s" : ""}</span>
                          {deptMembers.length > 0 && (
                            <span className="text-muted-foreground/60">— {deptMembers.map(m => m.name || m.email.split("@")[0]).join(", ")}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-orange-50 border border-orange-100 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-orange-600">{deptIncidents}</p>
                            <p className="text-xs text-orange-500">Incidents (30d)</p>
                          </div>
                          <div className={`${deptCAPAs > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"} border rounded-lg p-2 text-center`}>
                            <p className={`text-lg font-bold ${deptCAPAs > 0 ? "text-red-600" : "text-green-600"}`}>{deptCAPAs}</p>
                            <p className={`text-xs ${deptCAPAs > 0 ? "text-red-500" : "text-green-500"}`}>Open CAPAs</p>
                          </div>
                        </div>

                        {/* Supervisor visibility settings */}
                        {isAdmin && (
                          <div className="border-t pt-3 mt-1">
                            <button
                              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full"
                              onClick={() => {
                                if (editingVisibility === dept.id) { setEditingVisibility(null); return; }
                                setEditingVisibility(dept.id);
                                setVisibilityDraft(dept.visibilitySettings ?? { incidentSummary: true, medicalDetails: false, restrictionDetails: false, capaDetails: true, trainingStatus: true });
                              }}
                              data-testid={`button-visibility-${dept.id}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="flex-1 text-left font-medium">Supervisor Visibility</span>
                              {editingVisibility === dept.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {editingVisibility === dept.id && (
                              <div className="mt-3 space-y-3">
                                {[
                                  { key: "incidentSummary", label: "Incident Summary", desc: "Date, type, OSHA recordable Y/N, days away", icon: Activity },
                                  { key: "capaDetails", label: "CAPA Details", desc: "Corrective action plans and status", icon: CheckCircle2 },
                                  { key: "trainingStatus", label: "Training Status", desc: "Completion rates for dept members", icon: BookOpen },
                                  { key: "medicalDetails", label: "Medical Details", desc: "Injury description, body part, treatment type", icon: Eye },
                                  { key: "restrictionDetails", label: "Work Restrictions", desc: "RTW status and work limitations", icon: Info },
                                ].map(({ key, label, desc, icon: Icon }) => (
                                  <div key={key} className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-xs font-medium">{label}</span>
                                        {(key === "medicalDetails" || key === "restrictionDetails") && (
                                          <Badge className="text-xs px-1 py-0 bg-amber-100 text-amber-700 border-amber-200">HIPAA sensitive</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground ml-5">{desc}</p>
                                    </div>
                                    <Switch
                                      checked={visibilityDraft[key as keyof VisibilitySettings]}
                                      onCheckedChange={v => setVisibilityDraft(d => ({ ...d, [key]: v }))}
                                      data-testid={`switch-${key}-${dept.id}`}
                                    />
                                  </div>
                                ))}

                                {/* Drug test — always locked */}
                                <div className="flex items-center justify-between gap-3 opacity-60">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                      <span className="text-xs font-medium">Drug Test Results</span>
                                      <Badge className="text-xs px-1 py-0 bg-red-100 text-red-700 border-red-200">Always restricted</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-5">Visible to DER / admin only — cannot be unlocked</p>
                                  </div>
                                  <Switch checked={false} disabled />
                                </div>

                                <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white h-8 text-xs" onClick={() => updateVisibility.mutate({ deptId: dept.id, settings: visibilityDraft })} disabled={updateVisibility.isPending} data-testid={`button-save-visibility-${dept.id}`}>
                                  {updateVisibility.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                                  Save Visibility Settings
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── COMPLIANCE TAB ──────────────────────────────────────────── */}
          <TabsContent value="compliance" className="space-y-4 mt-4">
            {compLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
            ) : compliance?.restricted ? (
              <div className="text-center py-16">
                <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-semibold text-foreground">Access Restricted</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{compliance.message || "Compliance data is available to supervisors and administrators only."}</p>
              </div>
            ) : compliance ? (
              <>
                {/* Supervisor scope banner */}
                {compliance.viewerRole === "supervisor" && compliance.supervisedDeptNames && compliance.supervisedDeptNames.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
                    <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800">Supervisor View — {compliance.supervisedDeptNames.join(", ")}</p>
                      <p className="text-blue-600 text-xs mt-0.5">
                        Showing data for your department(s) only.
                        {compliance.visibilitySettings && !compliance.visibilitySettings.medicalDetails && " Medical details are restricted per your admin's settings."}
                        {" "}Drug test results are always restricted to protect employee privacy.
                      </p>
                    </div>
                  </div>
                )}
              
                {/* Summary metrics */}
                {compliance.summary && <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Incidents (30d)", value: compliance.summary!.incidentsLast30Days, icon: AlertTriangle, color: "orange" },
                    { label: "Open CAPAs", value: compliance.summary!.totalOpenCAPAs, icon: Clock, color: "blue" },
                    { label: "Overdue CAPAs", value: compliance.summary!.overdueCAPAs, icon: Flame, color: "red" },
                    { label: "Total Recordables", value: compliance.summary!.totalRecordables, icon: TrendingUp, color: "purple" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} data-testid={`metric-${label.toLowerCase().replace(/\s/g, "-")}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-${color}-100`}>
                          <Icon className={`w-4 h-4 text-${color}-600`} />
                        </div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>}

                {compliance.byDepartment && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Incidents by dept */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" />Incidents by Department (30 days)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(compliance.byDepartment!.incidents).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No incidents logged in the last 30 days.</p>
                      ) : Object.entries(compliance.byDepartment!.incidents).sort((a, b) => b[1] - a[1]).map(([dept, cnt]) => (
                        <div key={dept} className="flex items-center gap-3">
                          <span className="text-sm flex-1 truncate">{dept}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(cnt / Math.max(...Object.values(compliance.byDepartment!.incidents))) * 100}%` }} />
                          </div>
                          <span className="text-sm font-semibold w-6 text-right">{cnt}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Open CAPAs by dept */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-accent" />Open CAPAs by Department</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(compliance.byDepartment!.capas).length === 0 ? (
                        <div className="text-center py-4">
                          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
                          <p className="text-sm text-muted-foreground">No open CAPAs — great work!</p>
                        </div>
                      ) : Object.entries(compliance.byDepartment!.capas).sort((a, b) => b[1] - a[1]).map(([dept, cnt]) => (
                        <div key={dept} className="flex items-center gap-3">
                          <span className="text-sm flex-1 truncate">{dept}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${(cnt / Math.max(...Object.values(compliance.byDepartment!.capas))) * 100}%` }} />
                          </div>
                          <span className="text-sm font-semibold w-6 text-right">{cnt}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>}

                {/* Overdue CAPAs */}
                {compliance.overdueCAPAList.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-600"><Flame className="w-4 h-4" />Overdue CAPAs — Action Required</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {compliance.overdueCAPAList.map((capa: any) => (
                        <div key={capa.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{capa.description || capa.actionTitle || "CAPA"}</p>
                            <p className="text-xs text-muted-foreground">Due: {capa.dueDate ? new Date(capa.dueDate).toLocaleDateString() : "—"} · {capa.responsibleDepartment || "Unassigned"}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs shrink-0">Overdue</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Recent incidents */}
                {compliance.recentIncidents.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-accent" />Recent Incidents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {compliance.recentIncidents.map((inc: any) => (
                        <div key={inc.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${inc.isOshaRecordable ? "bg-red-500" : "bg-amber-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{inc.description || inc.injuryType || "Incident"}</p>
                            <p className="text-xs text-muted-foreground">{inc.department || "—"} · {inc.incidentDate ? new Date(inc.incidentDate).toLocaleDateString() : "—"}</p>
                          </div>
                          {inc.isOshaRecordable && <Badge variant="destructive" className="text-xs shrink-0">Recordable</Badge>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No compliance data yet</p>
                <p className="text-sm">Log incidents and create CAPAs to see department scorecards here.</p>
              </div>
            )}
          </TabsContent>

          {/* ── ANNOUNCEMENTS TAB ───────────────────────────────────────── */}
          <TabsContent value="announcements" className="space-y-4 mt-4">
            {isAdmin && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""} posted</p>
                <Button onClick={() => setShowAnnForm(!showAnnForm)} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-new-announcement">
                  <Megaphone className="w-4 h-4 mr-2" />{showAnnForm ? "Cancel" : "Post Announcement"}
                </Button>
              </div>
            )}

            {showAnnForm && isAdmin && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Post Announcement</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Title *</Label>
                      <Input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title…" data-testid="input-ann-title" />
                    </div>
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select value={annForm.category} onValueChange={v => setAnnForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger data-testid="select-ann-category"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ANN_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Message *</Label>
                    <Textarea value={annForm.body} onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))} placeholder="Share a safety update, policy change, training reminder…" rows={4} data-testid="input-ann-body" />
                  </div>
                  <Button onClick={() => createAnn.mutate()} disabled={!annForm.title || !annForm.body || createAnn.isPending} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-post-announcement">
                    {createAnn.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Megaphone className="w-4 h-4 mr-2" />Post</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {annsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No announcements yet</p>
                <p className="text-sm mb-4">Post safety alerts, policy updates, and training reminders for your whole team.</p>
                {isAdmin && !showAnnForm && (
                  <Button onClick={() => setShowAnnForm(true)} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-post-first-announcement">
                    <Megaphone className="w-4 h-4 mr-2" />Post First Announcement
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(ann => {
                  const cat = annCat(ann.category);
                  const CatIcon = cat.icon;
                  return (
                    <Card key={ann.id} className={`${ann.isPinned ? "border-accent/40 bg-accent/5" : ""}`} data-testid={`card-ann-${ann.id}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.cls}`}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {ann.isPinned && <Pin className="w-3.5 h-3.5 text-accent" />}
                              <p className="font-semibold text-sm">{ann.title}</p>
                              <Badge className={`text-xs ${cat.cls}`}>{cat.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{ann.body}</p>
                            <p className="text-xs text-muted-foreground/60 mt-2">Posted by {ann.authorName} · {timeAgo(ann.createdAt)}</p>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => pinAnn.mutate(ann.id)} title={ann.isPinned ? "Unpin" : "Pin"} data-testid={`button-pin-${ann.id}`}>
                                {ann.isPinned ? <PinOff className="w-3.5 h-3.5 text-accent" /> : <Pin className="w-3.5 h-3.5 text-muted-foreground" />}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => deleteAnn.mutate(ann.id)} data-testid={`button-delete-ann-${ann.id}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedLayout>
  );
}
