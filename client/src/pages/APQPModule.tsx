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
  BarChart2, ArrowRight, Loader2, Trash2, Edit2, X, Check,
  Beaker, FileText, Shield, Star, RefreshCw, ExternalLink
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

// ─── Design & Development 8.3 Types ─────────────────────────────────────────
interface DDTeamMember { name: string; dept: string; role: string; skills: string }
interface DDInput { input: string; source: string; status: string }
interface DDSpecialChar { characteristic: string; symbol: string; controlMethod: string; drawing: string }
interface DDReview { type: string; date: string; attendees: string; outcome: string; actionItems: string }
interface DDOutputDoc { doc: string; rev: string; status: string; approvedBy: string }
interface DDChange { date: string; description: string; authorizedBy: string; impact: string; approved: boolean }
interface DDSupplier { supplier: string; scope: string; controlMethod: string }
interface DesignDevPlan {
  id?: number;
  apqpProjectId: number;
  isProductResponsible: boolean;
  designScope: string;
  crossFunctionalTeam: DDTeamMember[];
  requiredSkills: string;
  prototypeRequired: boolean;
  prototypeDetails: string;
  productDesignInputs: DDInput[];
  mfgProcessInputs: DDInput[];
  specialCharacteristics: DDSpecialChar[];
  designReviews: DDReview[];
  verificationMethod: string;
  verificationStatus: string;
  validationMethod: string;
  validationStatus: string;
  validationDate: string;
  designOutputDocs: DDOutputDoc[];
  pfdComplete: boolean;
  pfmeaComplete: boolean;
  controlPlanComplete: boolean;
  workInstructionsComplete: boolean;
  mfgProcessOutputNotes: string;
  designChanges: DDChange[];
  externalDdResponsible: string;
  externalDdControls: string;
  externalDdSuppliers: DDSupplier[];
  notes: string;
}

const DD_STATUS_OPTS = ["not_started", "in_progress", "complete", "na"];
const DD_STATUS_COLORS: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-500",
  in_progress: "bg-blue-100 text-blue-700",
  complete: "bg-emerald-100 text-emerald-700",
  na: "bg-slate-50 text-slate-400",
};
const SYMBOL_OPTS = ["◆ (SC)", "▽ (CC)", "⑤ (KPC)", "★ (Safety)", "Δ (KCC)", "None"];

function emptyPlan(projectId: number): DesignDevPlan {
  return {
    apqpProjectId: projectId,
    isProductResponsible: true,
    designScope: "",
    crossFunctionalTeam: [],
    requiredSkills: "",
    prototypeRequired: false,
    prototypeDetails: "",
    productDesignInputs: [],
    mfgProcessInputs: [],
    specialCharacteristics: [],
    designReviews: [],
    verificationMethod: "",
    verificationStatus: "not_started",
    validationMethod: "",
    validationStatus: "not_started",
    validationDate: "",
    designOutputDocs: [],
    pfdComplete: false,
    pfmeaComplete: false,
    controlPlanComplete: false,
    workInstructionsComplete: false,
    mfgProcessOutputNotes: "",
    designChanges: [],
    externalDdResponsible: "",
    externalDdControls: "",
    externalDdSuppliers: [],
    notes: "",
  };
}

function ClauseCard({ clause, title, icon, children }: { clause: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-white dark:bg-slate-900/60">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        data-testid={`clause-toggle-${clause}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-accent">{icon}</span>
          <span className="text-xs font-bold text-accent/80 font-mono">{clause}</span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Design & Development Tab ─────────────────────────────────────────────────
function DesignDevTab({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [plan, setPlan] = useState<DesignDevPlan | null>(null);
  const [loaded, setLoaded] = useState(false);

  const { isLoading } = useQuery<DesignDevPlan | null>({
    queryKey: ["/api/apqp-projects", projectId, "design-dev"],
    queryFn: async () => {
      const res = await fetch(`/api/apqp-projects/${projectId}/design-dev`, { credentials: "include" });
      const data = await res.json();
      const result = data || emptyPlan(projectId);
      setPlan(result);
      setLoaded(true);
      return result;
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/apqp-projects/${projectId}/design-dev`, plan);
      return res.json();
    },
    onSuccess: (data) => {
      setPlan(data);
      qc.invalidateQueries({ queryKey: ["/api/apqp-projects", projectId, "design-dev"] });
      toast({ title: "Design & Development plan saved" });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const up = (patch: Partial<DesignDevPlan>) => setPlan(p => p ? { ...p, ...patch } : p);

  // helpers for array fields
  function addRow<T>(field: keyof DesignDevPlan, emptyRow: T) {
    setPlan(p => p ? { ...p, [field]: [...(p[field] as T[]), emptyRow] } : p);
  }
  function removeRow(field: keyof DesignDevPlan, idx: number) {
    setPlan(p => p ? { ...p, [field]: (p[field] as unknown[]).filter((_, i) => i !== idx) } : p);
  }
  function updateRow<T>(field: keyof DesignDevPlan, idx: number, patch: Partial<T>) {
    setPlan(p => {
      if (!p) return p;
      const arr = [...(p[field] as T[])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...p, [field]: arr };
    });
  }

  if (isLoading || !loaded || !plan) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  const outputDocs = plan.designOutputDocs;
  const mfgOutputs = [
    { key: "pfdComplete", label: "Process Flow Diagram (PFD)" },
    { key: "pfmeaComplete", label: "Process FMEA (PFMEA)" },
    { key: "controlPlanComplete", label: "Control Plan" },
    { key: "workInstructionsComplete", label: "Work Instructions / Job Aids" },
  ] as const;

  const completionScore = (() => {
    let pts = 0, total = 0;
    total += 2; if (plan.isProductResponsible) pts++; if (plan.designScope) pts++;
    total += 3; if (plan.crossFunctionalTeam.length) pts++; if (plan.requiredSkills) pts++; if (plan.prototypeRequired !== null) pts++;
    total += 2; if (plan.productDesignInputs.length) pts++; if (plan.specialCharacteristics.length) pts++;
    total += 2; if (plan.verificationStatus === "complete") pts++; if (plan.validationStatus === "complete") pts++;
    total += 4; mfgOutputs.forEach(o => { if (plan[o.key]) pts++; });
    return Math.round((pts / total) * 100);
  })();

  return (
    <div className="p-6 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Beaker className="w-4 h-4 text-accent" />
            Design &amp; Development — IATF 16949 8.3
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Full product-design-responsible compliance coverage</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">D&D Completion</p>
            <p className="text-xl font-bold text-accent">{completionScore}%</p>
          </div>
          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="bg-accent hover:bg-accent/90 text-white gap-2"
            data-testid="btn-save-dd"
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save All
          </Button>
        </div>
      </div>

      {/* 8.3.1 General */}
      <ClauseCard clause="8.3.1" title="General — Product Design Responsibility" icon={<Shield className="w-4 h-4" />}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => up({ isProductResponsible: !plan.isProductResponsible })}
            className={`relative w-11 h-6 rounded-full transition-colors ${plan.isProductResponsible ? "bg-accent" : "bg-slate-300"}`}
            data-testid="toggle-product-responsible"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${plan.isProductResponsible ? "translate-x-5" : ""}`} />
          </button>
          <span className="text-sm font-medium">
            Organization is <strong>Product Design Responsible</strong> (8.3 applies in full)
          </span>
        </div>
        {plan.isProductResponsible && (
          <div className="mt-1 p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent/80">
            ✓ Full 8.3 requirements apply — DFMEA, DVP&R, product design inputs, design validation, and design outputs are all required.
          </div>
        )}
        <div>
          <Label className="text-xs font-semibold">Design Scope / Description</Label>
          <Textarea
            value={plan.designScope}
            onChange={e => up({ designScope: e.target.value })}
            rows={3}
            placeholder="Describe what is being designed — chemical formulation, component geometry, packaging system, etc."
            data-testid="input-design-scope"
          />
        </div>
      </ClauseCard>

      {/* 8.3.2 Planning */}
      <ClauseCard clause="8.3.2" title="Design & Development Planning" icon={<Users className="w-4 h-4" />}>
        {/* 8.3.2.1 Multidisciplinary team */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">8.3.2.1 Cross-Functional / Multidisciplinary Team</Label>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("crossFunctionalTeam", { name: "", dept: "", role: "", skills: "" })}
              data-testid="btn-add-team-member"
            >
              <Plus className="w-3 h-3" />Add Member
            </Button>
          </div>
          {plan.crossFunctionalTeam.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_28px] gap-0 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                <span>Name</span><span>Department</span><span>Role</span><span>Design Skills / Competencies</span><span />
              </div>
              {plan.crossFunctionalTeam.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1.5fr_28px] gap-1 px-2 py-1.5 border-t border-border/30 items-center">
                  <Input value={m.name} onChange={e => updateRow("crossFunctionalTeam", i, { name: e.target.value })} placeholder="Full name" className="h-7 text-xs" data-testid={`input-team-name-${i}`} />
                  <Input value={m.dept} onChange={e => updateRow("crossFunctionalTeam", i, { dept: e.target.value })} placeholder="e.g. R&D, Quality" className="h-7 text-xs" data-testid={`input-team-dept-${i}`} />
                  <Input value={m.role} onChange={e => updateRow("crossFunctionalTeam", i, { role: e.target.value })} placeholder="e.g. Team Lead" className="h-7 text-xs" data-testid={`input-team-role-${i}`} />
                  <Input value={m.skills} onChange={e => updateRow("crossFunctionalTeam", i, { skills: e.target.value })} placeholder="e.g. DFMEA, CAD, formulation" className="h-7 text-xs" data-testid={`input-team-skills-${i}`} />
                  <button onClick={() => removeRow("crossFunctionalTeam", i)} className="p-1 text-muted-foreground hover:text-red-500" data-testid={`btn-remove-team-${i}`}><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border">No team members added. Add cross-functional members including R&D, Quality, Manufacturing, Customer Service.</p>
          )}
        </div>

        {/* 8.3.2.2 Product design skills */}
        <div>
          <Label className="text-xs font-semibold">8.3.2.2 Product Design Skills Required</Label>
          <Textarea
            value={plan.requiredSkills}
            onChange={e => up({ requiredSkills: e.target.value })}
            rows={3}
            placeholder="List required technical competencies: e.g. chemical formulation expertise, DFMEA, DVP&R, CAD/CAE, material science, tribology, regulatory knowledge (REACH, RoHS), reliability engineering..."
            data-testid="input-required-skills"
          />
        </div>

        {/* 8.3.2.3 Prototype */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => up({ prototypeRequired: !plan.prototypeRequired })}
              className={`relative w-11 h-6 rounded-full transition-colors ${plan.prototypeRequired ? "bg-accent" : "bg-slate-300"}`}
              data-testid="toggle-prototype"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${plan.prototypeRequired ? "translate-x-5" : ""}`} />
            </button>
            <Label className="text-xs font-semibold">8.3.2.3 Prototype Program Required</Label>
          </div>
          {plan.prototypeRequired && (
            <Textarea
              value={plan.prototypeDetails}
              onChange={e => up({ prototypeDetails: e.target.value })}
              rows={3}
              placeholder="Describe prototype program: batch size, test conditions, success criteria, timeline, responsible lab/team, customer prototype approval requirements..."
              data-testid="input-prototype-details"
            />
          )}
        </div>
      </ClauseCard>

      {/* 8.3.3 Inputs */}
      <ClauseCard clause="8.3.3" title="Design & Development Inputs" icon={<FileText className="w-4 h-4" />}>
        {/* 8.3.3.1 Product design inputs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <Label className="text-xs font-semibold">8.3.3.1 Product Design Inputs</Label>
              <p className="text-xs text-muted-foreground">Customer specs, regulatory, QFD/VoC, material specs, safety, reliability requirements</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("productDesignInputs", { input: "", source: "", status: "not_started" })}
              data-testid="btn-add-product-input"
            >
              <Plus className="w-3 h-3" />Add Input
            </Button>
          </div>
          {plan.productDesignInputs.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[2fr_1.5fr_100px_28px] gap-0 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                <span>Design Input Requirement</span><span>Source / Reference</span><span>Status</span><span />
              </div>
              {plan.productDesignInputs.map((inp, i) => (
                <div key={i} className="grid grid-cols-[2fr_1.5fr_100px_28px] gap-1 px-2 py-1.5 border-t border-border/30 items-center">
                  <Input value={inp.input} onChange={e => updateRow("productDesignInputs", i, { input: e.target.value })} placeholder="e.g. Flash point ≥ 180°C per ASTM D93" className="h-7 text-xs" data-testid={`input-pdi-${i}`} />
                  <Input value={inp.source} onChange={e => updateRow("productDesignInputs", i, { source: e.target.value })} placeholder="e.g. Customer spec CS-4521" className="h-7 text-xs" data-testid={`input-pdi-source-${i}`} />
                  <Select value={inp.status} onValueChange={v => updateRow("productDesignInputs", i, { status: v })}>
                    <SelectTrigger className="h-7 text-xs" data-testid={`select-pdi-status-${i}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DD_STATUS_OPTS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => removeRow("productDesignInputs", i)} className="p-1 text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border space-y-1">
              <p className="font-medium">Common product design inputs for chemical companies:</p>
              <p>• Customer performance specs (viscosity, flash point, pH range, specific gravity)</p>
              <p>• Regulatory requirements (REACH, RoHS, SDS, OSHA HazCom)</p>
              <p>• Voice of Customer (QFD outputs)</p>
              <p>• Material/ingredient specifications &amp; supply chain constraints</p>
              <p>• Applicable ASTM / ISO test methods</p>
              <p>• Reliability / shelf-life targets</p>
            </div>
          )}
        </div>

        {/* 8.3.3.2 Mfg process design inputs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <Label className="text-xs font-semibold">8.3.3.2 Manufacturing Process Design Inputs</Label>
              <p className="text-xs text-muted-foreground">Capacity, facilities, equipment, materials, applicable standards</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("mfgProcessInputs", { input: "", source: "", status: "not_started" })}
              data-testid="btn-add-mfg-input"
            >
              <Plus className="w-3 h-3" />Add Input
            </Button>
          </div>
          {plan.mfgProcessInputs.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[2fr_1.5fr_100px_28px] gap-0 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                <span>Process Input Requirement</span><span>Source / Reference</span><span>Status</span><span />
              </div>
              {plan.mfgProcessInputs.map((inp, i) => (
                <div key={i} className="grid grid-cols-[2fr_1.5fr_100px_28px] gap-1 px-2 py-1.5 border-t border-border/30 items-center">
                  <Input value={inp.input} onChange={e => updateRow("mfgProcessInputs", i, { input: e.target.value })} placeholder="e.g. Blend temp must not exceed 60°C" className="h-7 text-xs" data-testid={`input-mfgi-${i}`} />
                  <Input value={inp.source} onChange={e => updateRow("mfgProcessInputs", i, { source: e.target.value })} placeholder="e.g. R&D Lab Report LR-2024-12" className="h-7 text-xs" data-testid={`input-mfgi-source-${i}`} />
                  <Select value={inp.status} onValueChange={v => updateRow("mfgProcessInputs", i, { status: v })}>
                    <SelectTrigger className="h-7 text-xs" data-testid={`select-mfgi-status-${i}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DD_STATUS_OPTS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => removeRow("mfgProcessInputs", i)} className="p-1 text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border">No manufacturing process inputs added yet.</p>
          )}
        </div>

        {/* 8.3.3.3 Special characteristics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <Label className="text-xs font-semibold">8.3.3.3 Special Characteristics</Label>
              <p className="text-xs text-muted-foreground">Product special characteristics (KPC, SC, CC) identified from design — carry through to PFMEA &amp; Control Plan</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("specialCharacteristics", { characteristic: "", symbol: "◆ (SC)", controlMethod: "", drawing: "" })}
              data-testid="btn-add-special-char"
            >
              <Star className="w-3 h-3" />Add SC
            </Button>
          </div>
          {plan.specialCharacteristics.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[2fr_90px_2fr_1fr_28px] gap-0 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                <span>Characteristic</span><span>Symbol</span><span>Control Method</span><span>Drawing / Ref</span><span />
              </div>
              {plan.specialCharacteristics.map((sc, i) => (
                <div key={i} className="grid grid-cols-[2fr_90px_2fr_1fr_28px] gap-1 px-2 py-1.5 border-t border-border/30 items-center">
                  <Input value={sc.characteristic} onChange={e => updateRow("specialCharacteristics", i, { characteristic: e.target.value })} placeholder="e.g. Viscosity at 40°C" className="h-7 text-xs" data-testid={`input-sc-char-${i}`} />
                  <Select value={sc.symbol} onValueChange={v => updateRow("specialCharacteristics", i, { symbol: v })}>
                    <SelectTrigger className="h-7 text-xs" data-testid={`select-sc-symbol-${i}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{SYMBOL_OPTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={sc.controlMethod} onChange={e => updateRow("specialCharacteristics", i, { controlMethod: e.target.value })} placeholder="e.g. 100% viscometer test at final QC" className="h-7 text-xs" data-testid={`input-sc-control-${i}`} />
                  <Input value={sc.drawing} onChange={e => updateRow("specialCharacteristics", i, { drawing: e.target.value })} placeholder="e.g. Spec DS-001 Rev B" className="h-7 text-xs" data-testid={`input-sc-drawing-${i}`} />
                  <button onClick={() => removeRow("specialCharacteristics", i)} className="p-1 text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border">No special characteristics defined. Add product KPCs and SCs from design FMEA or customer requirements.</p>
          )}
        </div>
      </ClauseCard>

      {/* 8.3.4 Controls */}
      <ClauseCard clause="8.3.4" title="Design & Development Controls" icon={<Settings className="w-4 h-4" />}>
        {/* 8.3.4.1 Design reviews */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <Label className="text-xs font-semibold">8.3.4.1 Design Reviews</Label>
              <p className="text-xs text-muted-foreground">Formal design reviews including DFMEA review, concept review, design release</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("designReviews", { type: "", date: "", attendees: "", outcome: "", actionItems: "" })}
              data-testid="btn-add-review"
            >
              <Plus className="w-3 h-3" />Add Review
            </Button>
          </div>
          {plan.designReviews.length > 0 ? (
            <div className="space-y-2">
              {plan.designReviews.map((r, i) => (
                <div key={i} className="rounded-lg border border-border/40 p-3 space-y-2 bg-slate-50/50">
                  <div className="grid grid-cols-[2fr_1fr] gap-2">
                    <div>
                      <Label className="text-xs">Review Type</Label>
                      <Input value={r.type} onChange={e => updateRow("designReviews", i, { type: e.target.value })} placeholder="e.g. DFMEA Review, Concept Review, DVP&R Sign-off" className="h-7 text-xs" data-testid={`input-review-type-${i}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input type="date" value={r.date} onChange={e => updateRow("designReviews", i, { date: e.target.value })} className="h-7 text-xs" data-testid={`input-review-date-${i}`} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Attendees</Label>
                    <Input value={r.attendees} onChange={e => updateRow("designReviews", i, { attendees: e.target.value })} placeholder="Names / roles" className="h-7 text-xs" data-testid={`input-review-attendees-${i}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Outcome / Decision</Label>
                      <Input value={r.outcome} onChange={e => updateRow("designReviews", i, { outcome: e.target.value })} placeholder="e.g. Approved — proceed to prototype" className="h-7 text-xs" data-testid={`input-review-outcome-${i}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Open Action Items</Label>
                      <Input value={r.actionItems} onChange={e => updateRow("designReviews", i, { actionItems: e.target.value })} placeholder="e.g. Update DFMEA by 5/15" className="h-7 text-xs" data-testid={`input-review-actions-${i}`} />
                    </div>
                  </div>
                  <button onClick={() => removeRow("designReviews", i)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" />Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border">No design reviews recorded. Add formal design review events including DFMEA reviews, concept sign-offs, and DVP&R reviews.</p>
          )}
        </div>

        {/* 8.3.4.2 Verification */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">8.3.4 Design Verification</Label>
            <Textarea
              value={plan.verificationMethod}
              onChange={e => up({ verificationMethod: e.target.value })}
              rows={3}
              placeholder="Describe verification methods: DVP&R activities, engineering analysis, DFMEA linkage, test reports (e.g. ASTM D4485 engine oil test, viscosity verification, thermal stability)..."
              data-testid="input-verification-method"
            />
            <Select value={plan.verificationStatus} onValueChange={v => up({ verificationStatus: v })}>
              <SelectTrigger className="h-8 text-xs" data-testid="select-verification-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete ✓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 8.3.4.2 Validation */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">8.3.4.2 Design Validation</Label>
            <Textarea
              value={plan.validationMethod}
              onChange={e => up({ validationMethod: e.target.value })}
              rows={3}
              placeholder="Describe validation activities: field trials, customer validation tests, end-use performance testing, accelerated life testing, pilot production results, customer approval sign-off..."
              data-testid="input-validation-method"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={plan.validationStatus} onValueChange={v => up({ validationStatus: v })}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-validation-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete ✓</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={plan.validationDate} onChange={e => up({ validationDate: e.target.value })} className="h-8 text-xs" placeholder="Validation date" data-testid="input-validation-date" />
            </div>
          </div>
        </div>
      </ClauseCard>

      {/* 8.3.5 Outputs */}
      <ClauseCard clause="8.3.5" title="Design & Development Outputs" icon={<CheckCircle2 className="w-4 h-4" />}>
        {/* 8.3.5.1 Design output documents */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <Label className="text-xs font-semibold">8.3.5.1 Design Output Documents</Label>
              <p className="text-xs text-muted-foreground">DFMEA, DVP&R, design drawings, specs, material specs, reliability study results</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("designOutputDocs", { doc: "", rev: "", status: "not_started", approvedBy: "" })}
              data-testid="btn-add-output-doc"
            >
              <Plus className="w-3 h-3" />Add Doc
            </Button>
          </div>
          {outputDocs.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[2fr_60px_100px_1.5fr_28px] gap-0 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                <span>Document</span><span>Rev</span><span>Status</span><span>Approved By</span><span />
              </div>
              {outputDocs.map((d, i) => (
                <div key={i} className="grid grid-cols-[2fr_60px_100px_1.5fr_28px] gap-1 px-2 py-1.5 border-t border-border/30 items-center">
                  <Input value={d.doc} onChange={e => updateRow("designOutputDocs", i, { doc: e.target.value })} placeholder="e.g. DFMEA Rev B, DVP&R Test Report" className="h-7 text-xs" data-testid={`input-doc-name-${i}`} />
                  <Input value={d.rev} onChange={e => updateRow("designOutputDocs", i, { rev: e.target.value })} placeholder="A" className="h-7 text-xs" data-testid={`input-doc-rev-${i}`} />
                  <Select value={d.status} onValueChange={v => updateRow("designOutputDocs", i, { status: v })}>
                    <SelectTrigger className="h-7 text-xs" data-testid={`select-doc-status-${i}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DD_STATUS_OPTS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input value={d.approvedBy} onChange={e => updateRow("designOutputDocs", i, { approvedBy: e.target.value })} placeholder="Name / title" className="h-7 text-xs" data-testid={`input-doc-approved-${i}`} />
                  <button onClick={() => removeRow("designOutputDocs", i)} className="p-1 text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border space-y-1">
              <p className="font-medium">Required design output documents for product-design-responsible orgs:</p>
              <p>• Design FMEA (DFMEA) — linked to special characteristics</p>
              <p>• DVP&amp;R — Design Verification Plan &amp; Report</p>
              <p>• Engineering drawings / product specifications</p>
              <p>• Material specifications &amp; approved supplier list</p>
              <p>• Reliability / durability test results</p>
              <p>• Software documentation (if applicable)</p>
            </div>
          )}
        </div>

        {/* 8.3.5.2 Mfg process outputs */}
        <div>
          <Label className="text-xs font-semibold mb-2 block">8.3.5.2 Manufacturing Process Design Outputs</Label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {mfgOutputs.map(o => (
              <button
                key={o.key}
                onClick={() => up({ [o.key]: !plan[o.key] } as Partial<DesignDevPlan>)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${plan[o.key] ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}
                data-testid={`toggle-${o.key}`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${plan[o.key] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                  {plan[o.key] && <Check className="w-3 h-3 text-white" />}
                </div>
                {o.label}
              </button>
            ))}
          </div>
          <Textarea
            value={plan.mfgProcessOutputNotes}
            onChange={e => up({ mfgProcessOutputNotes: e.target.value })}
            rows={2}
            placeholder="Notes on manufacturing process outputs — document numbers, revision levels, responsible owner..."
            data-testid="input-mfg-output-notes"
          />
        </div>
      </ClauseCard>

      {/* 8.3.6 Changes */}
      <ClauseCard clause="8.3.6" title="Design & Development Changes" icon={<RefreshCw className="w-4 h-4" />}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">All design changes must be identified, reviewed, and authorized before implementation</p>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("designChanges", { date: "", description: "", authorizedBy: "", impact: "", approved: false })}
              data-testid="btn-add-change"
            >
              <Plus className="w-3 h-3" />Log Change
            </Button>
          </div>
          {plan.designChanges.length > 0 ? (
            <div className="space-y-2">
              {plan.designChanges.map((c, i) => (
                <div key={i} className="rounded-lg border border-border/40 p-3 space-y-2 bg-slate-50/50">
                  <div className="grid grid-cols-[1fr_2fr_1fr] gap-2">
                    <div>
                      <Label className="text-xs">Date</Label>
                      <Input type="date" value={c.date} onChange={e => updateRow("designChanges", i, { date: e.target.value })} className="h-7 text-xs" data-testid={`input-change-date-${i}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Change Description</Label>
                      <Input value={c.description} onChange={e => updateRow("designChanges", i, { description: e.target.value })} placeholder="What changed and why" className="h-7 text-xs" data-testid={`input-change-desc-${i}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Authorized By</Label>
                      <Input value={c.authorizedBy} onChange={e => updateRow("designChanges", i, { authorizedBy: e.target.value })} placeholder="Name / role" className="h-7 text-xs" data-testid={`input-change-auth-${i}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[2fr_auto] gap-2 items-center">
                    <div>
                      <Label className="text-xs">Impact Assessment</Label>
                      <Input value={c.impact} onChange={e => updateRow("designChanges", i, { impact: e.target.value })} placeholder="e.g. Re-validation required — affects viscosity SC" className="h-7 text-xs" data-testid={`input-change-impact-${i}`} />
                    </div>
                    <button
                      onClick={() => updateRow("designChanges", i, { approved: !c.approved })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${c.approved ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                      data-testid={`toggle-change-approved-${i}`}
                    >
                      {c.approved ? <><Check className="w-3 h-3" />Approved</> : <>Pending</>}
                    </button>
                  </div>
                  <button onClick={() => removeRow("designChanges", i)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" />Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border">No design changes logged. All design changes — including formulation adjustments, raw material substitutions, or specification updates — must be documented here.</p>
          )}
        </div>
      </ClauseCard>

      {/* 8.3.7 Externally Provided D&D */}
      <ClauseCard clause="8.3.7" title="Externally Provided Design & Development" icon={<ExternalLink className="w-4 h-4" />}>
        <p className="text-xs text-muted-foreground -mt-2">Control of suppliers or external labs responsible for any portion of the product design</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">External D&D Responsible Party</Label>
            <Input
              value={plan.externalDdResponsible}
              onChange={e => up({ externalDdResponsible: e.target.value })}
              placeholder="e.g. None — all design internal / Formulation lab: ABC Testing Inc."
              data-testid="input-external-responsible"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Controls / Oversight Methods</Label>
            <Input
              value={plan.externalDdControls}
              onChange={e => up({ externalDdControls: e.target.value })}
              placeholder="e.g. Approved supplier audit, design review participation, NDA + spec review"
              data-testid="input-external-controls"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">External D&D Suppliers</Label>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => addRow("externalDdSuppliers", { supplier: "", scope: "", controlMethod: "" })}
              data-testid="btn-add-external-supplier"
            >
              <Plus className="w-3 h-3" />Add Supplier
            </Button>
          </div>
          {plan.externalDdSuppliers.length > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[1.5fr_2fr_2fr_28px] gap-0 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                <span>Supplier</span><span>D&D Scope</span><span>Control Method</span><span />
              </div>
              {plan.externalDdSuppliers.map((s, i) => (
                <div key={i} className="grid grid-cols-[1.5fr_2fr_2fr_28px] gap-1 px-2 py-1.5 border-t border-border/30 items-center">
                  <Input value={s.supplier} onChange={e => updateRow("externalDdSuppliers", i, { supplier: e.target.value })} placeholder="Supplier name" className="h-7 text-xs" data-testid={`input-ext-supplier-${i}`} />
                  <Input value={s.scope} onChange={e => updateRow("externalDdSuppliers", i, { scope: e.target.value })} placeholder="e.g. Viscosity testing, formulation support" className="h-7 text-xs" data-testid={`input-ext-scope-${i}`} />
                  <Input value={s.controlMethod} onChange={e => updateRow("externalDdSuppliers", i, { controlMethod: e.target.value })} placeholder="e.g. Approved lab, annual audit" className="h-7 text-xs" data-testid={`input-ext-control-${i}`} />
                  <button onClick={() => removeRow("externalDdSuppliers", i)} className="p-1 text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg p-3 border border-dashed border-border">No external D&D suppliers. If any external lab, testing house, or design consultant contributes to product design, add them here.</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <Label className="text-xs font-semibold">Additional Notes</Label>
          <Textarea value={plan.notes} onChange={e => up({ notes: e.target.value })} rows={2} placeholder="Any additional Design & Development notes, open items, or references..." data-testid="input-dd-notes" />
        </div>
      </ClauseCard>

      {/* Bottom save */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="bg-accent hover:bg-accent/90 text-white gap-2"
          data-testid="btn-save-dd-bottom"
        >
          {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Design & Development Plan
        </Button>
      </div>
    </div>
  );
}

// ─── Project Detail View ──────────────────────────────────────────────────────
function ProjectDetail({ project, onBack }: { project: ApqpProject; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<number | "gates" | "design_dev">(project.currentPhase);
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
          {/* Design & Dev 8.3 tab */}
          <button
            onClick={() => setActiveTab("design_dev")}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all min-w-[90px] ml-1 ${
              activeTab === "design_dev" ? "bg-accent/10 border border-accent/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
            }`}
            data-testid="tab-design-dev"
          >
            <Beaker className="w-5 h-5 mb-0.5 text-accent" />
            <span className="text-xs font-medium text-center leading-tight">Design &amp; Dev 8.3</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "design_dev" ? (
          <DesignDevTab projectId={project.id} />
        ) : activeTab !== "gates" ? (
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
              AIAG Advanced Product Quality Planning — 5-phase launch with gate reviews (IATF 16949 8.3.2)
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
