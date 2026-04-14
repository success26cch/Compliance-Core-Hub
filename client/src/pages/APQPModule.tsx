import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, ChevronRight, ChevronLeft, ClipboardCheck, CheckCircle2,
  Clock, AlertCircle, Minus, Users, Calendar, Flag, Settings,
  BarChart2, ArrowRight, Loader2, Trash2, Edit2, X, Check
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ApqpProject {
  id: number;
  projectName: string;
  partNumber?: string;
  partName?: string;
  partDescription?: string;
  customer?: string;
  customerContact?: string;
  customerPartNumber?: string;
  productFamily?: string;
  programLaunchDate?: string;
  sopDate?: string;
  currentPhase: number;
  status: string;
  teamMembers: Array<{ name: string; role: string; email?: string }>;
  notes?: string;
  createdAt?: string;
}

interface ApqpDeliverable {
  id: number;
  apqpProjectId: number;
  phase: number;
  deliverableName: string;
  category?: string;
  status: string;
  owner?: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
}

interface ApqpGateReview {
  id: number;
  apqpProjectId: number;
  gate: number;
  gateTitle?: string;
  reviewDate?: string;
  attendees?: string;
  status: string;
  conditions?: string;
  approvedBy?: string;
  notes?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PHASES = [
  { num: 1, label: "Plan & Define", short: "Plan" },
  { num: 2, label: "Product D&D", short: "Product" },
  { num: 3, label: "Process D&D", short: "Process" },
  { num: 4, label: "Validation", short: "Validate" },
  { num: 5, label: "Feedback", short: "Feedback" },
];

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  complete: "bg-emerald-100 text-emerald-700",
  na: "bg-slate-50 text-slate-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  not_started: <Clock className="w-3.5 h-3.5" />,
  in_progress: <AlertCircle className="w-3.5 h-3.5" />,
  complete: <CheckCircle2 className="w-3.5 h-3.5" />,
  na: <Minus className="w-3.5 h-3.5" />,
};

const GATE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  conditional: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-amber-100 text-amber-700",
  complete: "bg-blue-100 text-blue-700",
  cancelled: "bg-slate-100 text-slate-500",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function phaseProgress(deliverables: ApqpDeliverable[], phase: number): number {
  const phased = deliverables.filter(d => d.phase === phase);
  if (!phased.length) return 0;
  const done = phased.filter(d => d.status === "complete" || d.status === "na").length;
  return Math.round((done / phased.length) * 100);
}

function overallProgress(deliverables: ApqpDeliverable[]): number {
  if (!deliverables.length) return 0;
  const done = deliverables.filter(d => d.status === "complete" || d.status === "na").length;
  return Math.round((done / deliverables.length) * 100);
}

// ─── Gate Review Dialog ───────────────────────────────────────────────────────
function GateReviewDialog({ gate, onClose }: { gate: ApqpGateReview; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    status: gate.status,
    reviewDate: gate.reviewDate ? gate.reviewDate.substring(0, 10) : "",
    attendees: gate.attendees || "",
    approvedBy: gate.approvedBy || "",
    conditions: gate.conditions || "",
    notes: gate.notes || "",
  });

  const updateMut = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("PATCH", `/api/apqp-gate-reviews/${gate.id}`, {
        ...data,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/apqp-projects", gate.apqpProjectId, "gate-reviews"] });
      toast({ title: "Gate review saved" });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-accent flex items-center gap-2">
            <Flag className="w-4 h-4" />
            {gate.gateTitle || `Gate ${gate.gate}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Gate Decision *</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger data-testid="select-gate-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="conditional">Conditional Approval</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Review Date</Label>
              <Input type="date" value={form.reviewDate} onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))} data-testid="input-gate-date" />
            </div>
            <div>
              <Label>Approved By</Label>
              <Input value={form.approvedBy} onChange={e => setForm(f => ({ ...f, approvedBy: e.target.value }))} placeholder="Name / title" data-testid="input-gate-approver" />
            </div>
          </div>
          <div>
            <Label>Attendees</Label>
            <Input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="e.g. Quality Mgr, Program Mgr, Engineering Lead" data-testid="input-gate-attendees" />
          </div>
          {form.status === "conditional" && (
            <div>
              <Label>Conditions / Open Items</Label>
              <Textarea value={form.conditions} onChange={e => setForm(f => ({ ...f, conditions: e.target.value }))} rows={3} placeholder="List conditions that must be resolved before next phase..." data-testid="input-gate-conditions" />
            </div>
          )}
          <div>
            <Label>Notes / Meeting Minutes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Key discussion points, decisions, action items..." data-testid="input-gate-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => updateMut.mutate(form)} disabled={updateMut.isPending} className="bg-accent hover:bg-accent/90 text-white" data-testid="btn-save-gate">
            {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Gate Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Project Dialog ───────────────────────────────────────────────────────
function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    projectName: "",
    partNumber: "",
    partName: "",
    customer: "",
    customerContact: "",
    productFamily: "",
    programLaunchDate: "",
    sopDate: "",
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/apqp-projects", {
        ...form,
        programLaunchDate: form.programLaunchDate ? new Date(form.programLaunchDate) : null,
        sopDate: form.sopDate ? new Date(form.sopDate) : null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/apqp-projects"] });
      toast({ title: "APQP project created", description: "AIAG standard deliverables have been seeded for all 5 phases." });
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-accent">New APQP Program</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Program / Project Name *</Label>
            <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="e.g. DOT 4 Brake Fluid — Ford Focus 2027" data-testid="input-project-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Internal Part Number</Label>
              <Input value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} placeholder="e.g. BF-DOT4-001" data-testid="input-part-number" />
            </div>
            <div>
              <Label>Part Name</Label>
              <Input value={form.partName} onChange={e => setForm(f => ({ ...f, partName: e.target.value }))} placeholder="e.g. DOT 4 Brake Fluid" data-testid="input-part-name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer</Label>
              <Input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="e.g. Ford Motor Company" data-testid="input-customer" />
            </div>
            <div>
              <Label>Product Family</Label>
              <Input value={form.productFamily} onChange={e => setForm(f => ({ ...f, productFamily: e.target.value }))} placeholder="e.g. Brake Fluids" data-testid="input-product-family" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Program Launch Date</Label>
              <Input type="date" value={form.programLaunchDate} onChange={e => setForm(f => ({ ...f, programLaunchDate: e.target.value }))} data-testid="input-launch-date" />
            </div>
            <div>
              <Label>Start of Production (SOP)</Label>
              <Input type="date" value={form.sopDate} onChange={e => setForm(f => ({ ...f, sopDate: e.target.value }))} data-testid="input-sop-date" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.projectName} className="bg-accent hover:bg-accent/90 text-white" data-testid="btn-create-project">
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deliverable Row ──────────────────────────────────────────────────────────
function DeliverableRow({ d, projectId }: { d: ApqpDeliverable; projectId: number }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [owner, setOwner] = useState(d.owner || "");
  const [notes, setNotes] = useState(d.notes || "");
  const [dueDate, setDueDate] = useState(d.dueDate ? d.dueDate.substring(0, 10) : "");

  const updateMut = useMutation({
    mutationFn: async (patch: Partial<ApqpDeliverable>) => {
      const res = await apiRequest("PATCH", `/api/apqp-deliverables/${d.id}`, patch);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/apqp-projects", projectId, "deliverables"] });
    },
  });

  const cycleStatus = () => {
    const cycle: Record<string, string> = { not_started: "in_progress", in_progress: "complete", complete: "na", na: "not_started" };
    updateMut.mutate({ status: cycle[d.status] || "not_started" });
  };

  const saveEdit = () => {
    updateMut.mutate({ owner: owner || null, notes: notes || null, dueDate: dueDate ? new Date(dueDate) as any : null });
    setEditing(false);
  };

  return (
    <div className={`border-b border-border/40 last:border-0 transition-colors ${d.status === "complete" ? "opacity-75" : ""}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Status toggle */}
        <button
          onClick={cycleStatus}
          className={`flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${STATUS_COLORS[d.status]}`}
          data-testid={`deliverable-status-${d.id}`}
        >
          {STATUS_ICONS[d.status]}
          {d.status === "not_started" ? "Not Started" : d.status === "in_progress" ? "In Progress" : d.status === "complete" ? "Complete" : "N/A"}
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${d.status === "complete" ? "line-through text-muted-foreground" : ""}`}>{d.deliverableName}</p>
          {d.category && <p className="text-xs text-muted-foreground">{d.category}</p>}
        </div>

        {/* Owner */}
        {!editing && (
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-28 truncate text-right">
            {d.owner || <span className="italic">No owner</span>}
          </span>
        )}

        {/* Due date */}
        {!editing && d.dueDate && (
          <span className="text-xs text-muted-foreground shrink-0 hidden md:block">
            {new Date(d.dueDate).toLocaleDateString()}
          </span>
        )}

        {/* Edit button */}
        <button onClick={() => setEditing(!editing)} className="shrink-0 p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors">
          {editing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Inline editor */}
      {editing && (
        <div className="px-3 pb-3 bg-slate-50 dark:bg-slate-900/40 space-y-2 border-t border-dashed border-border/40">
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <Label className="text-xs">Owner</Label>
              <Input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Person responsible" className="h-7 text-xs" data-testid={`input-owner-${d.id}`} />
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-7 text-xs" data-testid={`input-due-${d.id}`} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-xs" placeholder="Reference documents, issues, decisions..." data-testid={`input-notes-${d.id}`} />
          </div>
          <Button size="sm" onClick={saveEdit} className="h-7 text-xs bg-accent hover:bg-accent/90 text-white gap-1">
            <Check className="w-3 h-3" />Save
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Project Detail View ──────────────────────────────────────────────────────
function ProjectDetail({ project, onBack }: { project: ApqpProject; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<number | "gates">(project.currentPhase);
  const [editingGate, setEditingGate] = useState<ApqpGateReview | null>(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: deliverables = [], isLoading: loadingDeliverables } = useQuery<ApqpDeliverable[]>({
    queryKey: ["/api/apqp-projects", project.id, "deliverables"],
    queryFn: async () => {
      const res = await fetch(`/api/apqp-projects/${project.id}/deliverables`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: gateReviews = [], isLoading: loadingGates } = useQuery<ApqpGateReview[]>({
    queryKey: ["/api/apqp-projects", project.id, "gate-reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/apqp-projects/${project.id}/gate-reviews`, { credentials: "include" });
      return res.json();
    },
  });

  const updatePhaseMut = useMutation({
    mutationFn: async (phase: number) => {
      const res = await apiRequest("PATCH", `/api/apqp-projects/${project.id}`, { currentPhase: phase });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/apqp-projects"] });
      toast({ title: "Phase updated" });
    },
  });

  const overall = overallProgress(deliverables);
  const activePhaseDeliverables = typeof activeTab === "number" ? deliverables.filter(d => d.phase === activeTab) : [];
  const phaseComplete = typeof activeTab === "number" ? phaseProgress(deliverables, activeTab) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border/40 bg-white dark:bg-slate-950 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={onBack} className="mt-0.5 p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" data-testid="btn-back-projects">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">{project.projectName}</h2>
                <Badge className={`text-xs ${PROJECT_STATUS_COLORS[project.status] || ""}`}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap text-sm text-muted-foreground">
                {project.partNumber && <span className="font-mono">{project.partNumber}</span>}
                {project.customer && <><span>·</span><span>{project.customer}</span></>}
                {project.sopDate && <><span>·</span><span>SOP: {new Date(project.sopDate).toLocaleDateString()}</span></>}
              </div>
            </div>
          </div>

          {/* Overall progress */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold text-accent">{overall}%</p>
            </div>
          </div>
        </div>

        {/* Phase stepper */}
        <div className="flex items-center gap-0 mt-4 overflow-x-auto">
          {PHASES.map((p, idx) => {
            const pct = phaseProgress(deliverables, p.num);
            const isCurrent = project.currentPhase === p.num;
            const isDone = project.currentPhase > p.num;
            const gate = gateReviews.find(g => g.gate === p.num);
            return (
              <div key={p.num} className="flex items-center">
                <button
                  onClick={() => setActiveTab(p.num)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[80px] ${
                    activeTab === p.num
                      ? "bg-accent/10 border border-accent/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                  data-testid={`tab-phase-${p.num}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-accent text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : p.num}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{p.short}</span>
                  {pct > 0 && <span className="text-xs text-muted-foreground">{pct}%</span>}
                  {gate && gate.status !== "pending" && (
                    <span className={`text-xs mt-0.5 px-1.5 rounded-full font-medium ${
                      gate.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      gate.status === "conditional" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{gate.status === "approved" ? "✓ Gate" : gate.status === "conditional" ? "~ Gate" : "✗ Gate"}</span>
                  )}
                </button>
                {idx < PHASES.length - 1 && (
                  <ArrowRight className={`w-4 h-4 mx-1 shrink-0 ${isDone ? "text-emerald-500" : "text-slate-300"}`} />
                )}
              </div>
            );
          })}
          {/* Gate Reviews tab */}
          <button
            onClick={() => setActiveTab("gates")}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[80px] ml-2 border-l border-dashed border-border/60 pl-4 ${
              activeTab === "gates" ? "bg-accent/10 border border-accent/30 border-l-accent/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
            }`}
            data-testid="tab-gates"
          >
            <Flag className="w-5 h-5 mb-0.5 text-accent" />
            <span className="text-xs font-medium">Gate Reviews</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab !== "gates" ? (
          <div className="p-6">
            {/* Phase header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base">
                  Phase {activeTab} — {PHASES.find(p => p.num === activeTab)?.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activePhaseDeliverables.filter(d => d.status === "complete" || d.status === "na").length} / {activePhaseDeliverables.length} deliverables complete — {phaseComplete}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                {project.currentPhase === activeTab && (
                  <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Active Phase</Badge>
                )}
                {project.currentPhase < activeTab && (
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => updatePhaseMut.mutate(activeTab as number)} data-testid="btn-advance-phase">
                    Advance to Phase {activeTab}
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-5">
              <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${phaseComplete}%` }} />
            </div>

            {/* Deliverables by category */}
            {loadingDeliverables ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-border/40">
                  <div className="flex text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span className="flex-[0_0_140px]">Status</span>
                    <span className="flex-1">Deliverable</span>
                    <span className="hidden sm:block w-28 text-right">Owner</span>
                    <span className="hidden md:block w-24 text-right">Due Date</span>
                    <span className="w-7" />
                  </div>
                </div>
                {activePhaseDeliverables.map(d => (
                  <DeliverableRow key={d.id} d={d} projectId={project.id} />
                ))}
                {!activePhaseDeliverables.length && (
                  <div className="py-8 text-center text-sm text-muted-foreground">No deliverables for this phase</div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Gate Reviews Panel
          <div className="p-6">
            <h3 className="font-semibold text-base mb-1">Phase Gate Reviews</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Formal sign-offs between each phase. Gate approval is required before work on the next phase begins.
            </p>
            {loadingGates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-3">
                {gateReviews.map(gate => (
                  <div key={gate.id} className={`rounded-xl border p-4 ${GATE_STATUS_COLORS[gate.status] || "border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Flag className="w-4 h-4 text-accent shrink-0" />
                          <h4 className="font-semibold text-sm">{gate.gateTitle || `Gate ${gate.gate}`}</h4>
                          <Badge className={`text-xs ${GATE_STATUS_COLORS[gate.status]}`}>
                            {gate.status.charAt(0).toUpperCase() + gate.status.slice(1)}
                          </Badge>
                        </div>
                        {gate.reviewDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reviewed: {new Date(gate.reviewDate).toLocaleDateString()}
                            {gate.approvedBy && ` — Approved by: ${gate.approvedBy}`}
                          </p>
                        )}
                        {gate.attendees && (
                          <p className="text-xs text-muted-foreground">Attendees: {gate.attendees}</p>
                        )}
                        {gate.conditions && (
                          <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                            <span className="font-semibold">Conditions: </span>{gate.conditions}
                          </div>
                        )}
                        {gate.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{gate.notes}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 h-8 text-xs gap-1" onClick={() => setEditingGate(gate)} data-testid={`btn-edit-gate-${gate.gate}`}>
                        <Edit2 className="w-3 h-3" />Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editingGate && <GateReviewDialog gate={editingGate} onClose={() => setEditingGate(null)} />}
    </div>
  );
}

// ─── Project List Card ────────────────────────────────────────────────────────
function ProjectCard({ project, onClick, onDelete }: { project: ApqpProject; onClick: () => void; onDelete: () => void }) {
  const { data: deliverables = [] } = useQuery<ApqpDeliverable[]>({
    queryKey: ["/api/apqp-projects", project.id, "deliverables"],
    queryFn: async () => {
      const res = await fetch(`/api/apqp-projects/${project.id}/deliverables`, { credentials: "include" });
      return res.json();
    },
  });

  const overall = overallProgress(deliverables);

  return (
    <div className="group rounded-xl border border-border/50 hover:border-accent/40 hover:shadow-md transition-all bg-white dark:bg-slate-900/60 cursor-pointer" onClick={onClick}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{project.projectName}</h3>
              <Badge className={`text-xs shrink-0 ${PROJECT_STATUS_COLORS[project.status]}`}>
                {project.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
              {project.partNumber && <span className="font-mono">{project.partNumber}</span>}
              {project.customer && <><span>·</span><span>{project.customer}</span></>}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all shrink-0"
            data-testid={`btn-delete-project-${project.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Phase progress stepper */}
        <div className="flex items-center gap-1 mt-3">
          {PHASES.map((p, idx) => {
            const pct = deliverables.length ? phaseProgress(deliverables, p.num) : 0;
            const isDone = project.currentPhase > p.num;
            const isCurrent = project.currentPhase === p.num;
            return (
              <div key={p.num} className="flex items-center gap-1 flex-1">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-muted-foreground truncate">{p.short}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-1.5 rounded-full transition-all ${isDone ? "bg-emerald-500" : isCurrent ? "bg-accent" : "bg-slate-300"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {idx < PHASES.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            Phase {project.currentPhase} — {PHASES.find(p => p.num === project.currentPhase)?.label}
          </span>
          <span className="text-sm font-bold text-accent">{overall}%</span>
        </div>

        {project.sopDate && (
          <p className="text-xs text-muted-foreground mt-1">
            SOP: {new Date(project.sopDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export default function APQPModule({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<ApqpProject | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: projects = [], isLoading } = useQuery<ApqpProject[]>({
    queryKey: ["/api/apqp-projects"],
    queryFn: async () => {
      const res = await fetch("/api/apqp-projects", { credentials: "include" });
      return res.json();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/apqp-projects/${id}`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/apqp-projects"] });
      toast({ title: "Program deleted" });
    },
  });

  if (selectedProject) {
    const fresh = projects.find(p => p.id === selectedProject.id) || selectedProject;
    return <ProjectDetail project={fresh} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border/40 px-6 py-4 bg-white dark:bg-slate-950">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-accent" />
              APQP Program Management
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              AIAG Advanced Product Quality Planning — 5-phase launch with gate reviews (IATF 16949 §8.3.2)
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            className="bg-accent hover:bg-accent/90 text-white gap-2"
            data-testid="btn-new-apqp-project"
          >
            <Plus className="w-4 h-4" />
            New Program
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No APQP Programs Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first program to begin tracking AIAG APQP deliverables across all 5 phases with gate reviews.
              </p>
            </div>
            <Button onClick={() => setShowNewDialog(true)} className="bg-accent hover:bg-accent/90 text-white gap-2" data-testid="btn-new-apqp-empty">
              <Plus className="w-4 h-4" />
              Create First Program
            </Button>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Active Programs", value: projects.filter(p => p.status === "active").length, color: "text-accent" },
                { label: "On Hold", value: projects.filter(p => p.status === "on_hold").length, color: "text-amber-600" },
                { label: "Complete", value: projects.filter(p => p.status === "complete").length, color: "text-emerald-600" },
                { label: "Total Programs", value: projects.length, color: "text-foreground" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border/50 p-3 bg-white dark:bg-slate-900/60 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Project cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => setSelectedProject(p)}
                  onDelete={() => {
                    if (confirm(`Delete "${p.projectName}"? This cannot be undone.`)) deleteMut.mutate(p.id);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showNewDialog && <NewProjectDialog onClose={() => setShowNewDialog(false)} />}
    </div>
  );
}
