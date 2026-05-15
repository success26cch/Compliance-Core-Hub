import { useState, useCallback, Fragment, type ComponentType } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  ArrowDown, Cog, Eye, Truck, Clock, Archive, ClipboardList, Layers, FileText,
  Download, RefreshCw, X, Check, GitFork,
} from "lucide-react";
import type {
  ApqpProcessStep, ApqpPfmeaRow, ApqpControlPlanRow,
  ApqpInspectionSheet, ApqpInspectionRow,
} from "@shared/schema";

// ─── Types & Helpers ─────────────────────────────────────────────────────────

type DocSuiteTab = "pfd" | "pfmea" | "control_plan" | "inspection";

const STEP_TYPES = [
  { value: "operation", label: "Operation", icon: Cog, color: "text-blue-600" },
  { value: "inspection", label: "Inspection", icon: Eye, color: "text-amber-600" },
  { value: "transport", label: "Transport", icon: Truck, color: "text-slate-500" },
  { value: "delay", label: "Delay", icon: Clock, color: "text-orange-500" },
  { value: "storage", label: "Storage", icon: Archive, color: "text-purple-500" },
];

const SPECIAL_CHARS = ["", "SC", "CC", "KPC", "PS", "★"];
const RATING_COLORS: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-800", 2: "bg-emerald-100 text-emerald-800",
  3: "bg-lime-100 text-lime-800", 4: "bg-lime-100 text-lime-800",
  5: "bg-yellow-100 text-yellow-800", 6: "bg-yellow-100 text-yellow-800",
  7: "bg-orange-100 text-orange-800", 8: "bg-orange-100 text-orange-800",
  9: "bg-red-100 text-red-800", 10: "bg-red-100 text-red-800",
};
const rpnColor = (rpn: number) =>
  rpn >= 200 ? "bg-red-100 text-red-800 font-bold" :
  rpn >= 120 ? "bg-orange-100 text-orange-800 font-semibold" :
  rpn >= 60  ? "bg-yellow-100 text-yellow-800" :
               "bg-emerald-100 text-emerald-800";

function RatingCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={v => onChange(Number(v))}>
      <SelectTrigger className={`h-6 text-xs w-12 border-0 font-medium ${RATING_COLORS[value] ?? ""}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <SelectItem key={n} value={String(n)} className={`text-xs ${RATING_COLORS[n]}`}>{n}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ReviewBadge({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 text-xs text-amber-700 w-fit">
      <AlertTriangle className="w-3 h-3 shrink-0" />
      <span>{label}</span>
      <button onClick={onClear} className="ml-0.5 text-amber-500 hover:text-amber-700"><X className="w-3 h-3" /></button>
    </div>
  );
}

// ─── Process Flow Diagram Tab ────────────────────────────────────────────────

function StepTypeIcon({ type }: { type: string }) {
  const t = STEP_TYPES.find(s => s.value === type) ?? STEP_TYPES[0];
  const Icon = t.icon;
  return <Icon className={`w-4 h-4 ${t.color}`} />;
}

function ProcessFlowTab({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<ApqpProcessStep>>({});

  const { data: steps = [], isLoading } = useQuery<ApqpProcessStep[]>({
    queryKey: ["/api/apqp", projectId, "process-steps"],
    queryFn: async () => {
      const r = await fetch(`/api/apqp/${projectId}/process-steps`, { credentials: "include" });
      return r.json();
    },
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["/api/apqp", projectId, "process-steps"] });

  const createMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/apqp/${projectId}/process-steps`, {
      stepNumber: String((steps.length + 1) * 10),
      operationName: "New Operation",
      operationType: "operation",
      stepOrder: steps.length,
    }),
    onSuccess: () => { inv(); toast({ title: "Step added" }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApqpProcessStep> }) =>
      apiRequest("PATCH", `/api/apqp/process-steps/${id}`, data),
    onSuccess: () => {
      inv();
      qc.invalidateQueries({ queryKey: ["/api/apqp", projectId, "pfmea-rows"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/apqp/process-steps/${id}`, {}),
    onSuccess: () => { inv(); toast({ title: "Step deleted" }); },
  });

  const save = useCallback((id: number) => {
    updateMut.mutate({ id, data: draft });
    setEditingId(null);
    setDraft({});
  }, [draft, updateMut]);

  const startEdit = (s: ApqpProcessStep) => { setEditingId(s.id); setDraft({ ...s }); };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Process Flow Diagram</h3>
          <p className="text-xs text-muted-foreground mt-0.5">AIAG APQP — Operation, Inspection, Transport, Delay, Storage. Changes automatically flag linked PFMEA rows for review.</p>
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-xs bg-accent hover:bg-accent/90 text-white" onClick={() => createMut.mutate()} disabled={createMut.isPending} data-testid="btn-add-pfd-step">
          {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
          <GitFork className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No process steps yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add operation, inspection, transport, delay, or storage steps to define the process flow.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center w-full max-w-2xl">
              {editingId === step.id ? (
                <div className="w-full rounded-xl border-2 border-accent/40 bg-accent/5 p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Step #</Label>
                      <Input value={draft.stepNumber ?? ""} onChange={e => setDraft(d => ({ ...d, stepNumber: e.target.value }))} className="h-7 text-xs" data-testid={`input-step-number-${step.id}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Operation Name</Label>
                      <Input value={draft.operationName ?? ""} onChange={e => setDraft(d => ({ ...d, operationName: e.target.value }))} className="h-7 text-xs" data-testid={`input-op-name-${step.id}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={draft.operationType ?? "operation"} onValueChange={v => setDraft(d => ({ ...d, operationType: v }))}>
                        <SelectTrigger className="h-7 text-xs" data-testid={`select-op-type-${step.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STEP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Machine / Equipment</Label>
                      <Input value={draft.machine ?? ""} onChange={e => setDraft(d => ({ ...d, machine: e.target.value }))} className="h-7 text-xs" placeholder="e.g. CMM, Lathe #3" data-testid={`input-machine-${step.id}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Special Characteristics</Label>
                      <Input value={(draft.specialChars ?? []).join(", ")} onChange={e => setDraft(d => ({ ...d, specialChars: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} className="h-7 text-xs" placeholder="e.g. SC, KPC" data-testid={`input-special-chars-${step.id}`} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description / Inputs → Outputs</Label>
                    <Textarea value={draft.description ?? ""} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={2} className="text-xs" placeholder="Describe the step, what goes in and what comes out..." data-testid={`textarea-desc-${step.id}`} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingId(null); setDraft({}); }}>Cancel</Button>
                    <Button size="sm" className="h-7 text-xs bg-accent hover:bg-accent/90 text-white gap-1" onClick={() => save(step.id)} disabled={updateMut.isPending}>
                      {updateMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`w-full rounded-xl border p-3 bg-white dark:bg-slate-900/60 hover:border-accent/40 transition-colors cursor-pointer group ${step.reviewFlag ? "border-amber-300" : "border-border/50"}`}
                  onClick={() => startEdit(step)}
                  data-testid={`pfd-step-${step.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        step.operationType === "operation" ? "bg-blue-50" :
                        step.operationType === "inspection" ? "bg-amber-50" :
                        step.operationType === "transport" ? "bg-slate-50" :
                        step.operationType === "delay" ? "bg-orange-50" : "bg-purple-50"
                      }`}>
                        <StepTypeIcon type={step.operationType} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{step.stepNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{step.operationName}</span>
                        <Badge variant="outline" className="text-xs h-5">{STEP_TYPES.find(t => t.value === step.operationType)?.label}</Badge>
                        {step.specialChars && step.specialChars.length > 0 && step.specialChars.map(sc => (
                          <Badge key={sc} className="text-xs h-5 bg-amber-100 text-amber-700 border-amber-300">{sc}</Badge>
                        ))}
                        {step.reviewFlag && (
                          <Badge className="text-xs h-5 bg-amber-100 text-amber-700 border-amber-200"><AlertTriangle className="w-3 h-3 mr-1" />Review Flagged</Badge>
                        )}
                      </div>
                      {step.machine && <p className="text-xs text-muted-foreground mt-0.5">Machine: {step.machine}</p>}
                      {step.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.description}</p>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); if (confirm("Delete this step?")) deleteMut.mutate(step.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" data-testid={`btn-delete-pfd-${step.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              {idx < steps.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-3 bg-border" />
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  <div className="w-0.5 h-3 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PFMEA Tab ────────────────────────────────────────────────────────────────

function PfmeaTab({ projectId }: { projectId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, Partial<ApqpPfmeaRow>>>({});

  const { data: steps = [] } = useQuery<ApqpProcessStep[]>({
    queryKey: ["/api/apqp", projectId, "process-steps"],
    queryFn: async () => { const r = await fetch(`/api/apqp/${projectId}/process-steps`, { credentials: "include" }); return r.json(); },
  });

  const { data: rows = [], isLoading } = useQuery<ApqpPfmeaRow[]>({
    queryKey: ["/api/apqp", projectId, "pfmea-rows"],
    queryFn: async () => { const r = await fetch(`/api/apqp/${projectId}/pfmea-rows`, { credentials: "include" }); return r.json(); },
  });

  const inv = () => {
    qc.invalidateQueries({ queryKey: ["/api/apqp", projectId, "pfmea-rows"] });
    qc.invalidateQueries({ queryKey: ["/api/apqp", projectId, "control-plan-rows"] });
  };

  const createMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/apqp/${projectId}/pfmea-rows`, {
      processStep: "New Step", processFunction: "", failureMode: "", failureEffect: "",
      severity: 5, occurrence: 5, detection: 5, rpn: 125, rowOrder: rows.length,
    }),
    onSuccess: () => { inv(); toast({ title: "Row added" }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApqpPfmeaRow> }) =>
      apiRequest("PATCH", `/api/apqp/pfmea-rows/${id}`, data),
    onSuccess: inv,
  });

  const clearFlagMut = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/apqp/pfmea-rows/${id}/clear-flag`, {}),
    onSuccess: () => { inv(); toast({ title: "Review flag cleared" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/apqp/pfmea-rows/${id}`, {}),
    onSuccess: () => { inv(); toast({ title: "Row deleted" }); },
  });

  const update = (id: number, field: keyof ApqpPfmeaRow, value: any) => {
    setEdits(e => ({ ...e, [id]: { ...e[id], [field]: value } }));
  };

  const val = (row: ApqpPfmeaRow, field: keyof ApqpPfmeaRow) =>
    edits[row.id]?.[field] !== undefined ? edits[row.id][field] : (row as any)[field];

  const saveRow = (id: number) => {
    if (edits[id]) { updateMut.mutate({ id, data: edits[id] }); setEdits(e => { const n = { ...e }; delete n[id]; return n; }); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  const flaggedCount = rows.filter(r => r.reviewFlag).length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm">Process FMEA <span className="text-muted-foreground font-normal">(AIAG 4th Edition)</span></h3>
          <p className="text-xs text-muted-foreground mt-0.5">S×O×D = RPN. Rows linked to process steps. Changes flag linked Control Plan rows.</p>
        </div>
        <div className="flex items-center gap-2">
          {flaggedCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs gap-1">
              <AlertTriangle className="w-3 h-3" />{flaggedCount} review{flaggedCount > 1 ? "s" : ""} needed
            </Badge>
          )}
          <Button size="sm" className="gap-1.5 h-8 text-xs bg-accent hover:bg-accent/90 text-white" onClick={() => createMut.mutate()} disabled={createMut.isPending} data-testid="btn-add-pfmea-row">
            {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}Add Row
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
          <FileText className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No PFMEA rows yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add rows to identify potential failure modes, their effects, and controls.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/40">
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-6" />
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">Process Step</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">Function</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">Failure Mode</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">Effect(s)</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-12">S</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-14">Class</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">Cause(s)</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-12">O</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[90px]">Prevention</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[90px]">Detection</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-12">D</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-16">RPN</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map(row => {
                const s = Number(val(row, "severity"));
                const o = Number(val(row, "occurrence"));
                const d = Number(val(row, "detection"));
                const rpn = s * o * d;
                const isDirty = !!edits[row.id];
                const expanded = expandedRow === row.id;
                return (
                  <Fragment key={row.id}>
                  <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${row.reviewFlag ? "bg-amber-50/40 dark:bg-amber-900/10" : ""}`}>
                    <td className="px-1 py-1.5 text-center">
                      <button onClick={() => setExpandedRow(expanded ? null : row.id)} className="text-muted-foreground hover:text-accent" data-testid={`btn-expand-pfmea-${row.id}`}>
                        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-1 py-1">
                      <Select value={val(row, "processStepId") ? String(val(row, "processStepId")) : "__manual__"} onValueChange={v => {
                        const step = steps.find(s => s.id === Number(v));
                        setEdits(e => ({ ...e, [row.id]: { ...e[row.id], processStepId: v === "__manual__" ? undefined : Number(v), processStep: step ? step.operationName : val(row, "processStep") } }));
                      }}>
                        <SelectTrigger className="h-6 text-xs min-w-[90px]" data-testid={`select-step-${row.id}`}><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__manual__">Manual Entry</SelectItem>
                          {steps.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.stepNumber} — {s.operationName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {(!val(row, "processStepId") || val(row, "processStepId") === "") && (
                        <Input value={val(row, "processStep") ?? ""} onChange={e => update(row.id, "processStep", e.target.value)} className="h-6 text-xs mt-0.5" placeholder="Step name" data-testid={`input-pstep-${row.id}`} />
                      )}
                    </td>
                    <td className="px-1 py-1"><Input value={val(row, "processFunction") ?? ""} onChange={e => update(row.id, "processFunction", e.target.value)} className="h-6 text-xs" placeholder="Function..." data-testid={`input-func-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "failureMode") ?? ""} onChange={e => update(row.id, "failureMode", e.target.value)} className="h-6 text-xs" placeholder="Failure mode..." data-testid={`input-fm-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "failureEffect") ?? ""} onChange={e => update(row.id, "failureEffect", e.target.value)} className="h-6 text-xs" placeholder="Effect..." data-testid={`input-fe-${row.id}`} /></td>
                    <td className="px-1 py-1 text-center"><RatingCell value={s} onChange={v => update(row.id, "severity", v)} /></td>
                    <td className="px-1 py-1">
                      <Select value={val(row, "classification") || "__none__"} onValueChange={v => update(row.id, "classification", v === "__none__" ? "" : v)}>
                        <SelectTrigger className="h-6 text-xs w-14" data-testid={`select-class-${row.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{SPECIAL_CHARS.map(c => <SelectItem key={c || "__none__"} value={c || "__none__"}>{c || "—"}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1"><Input value={val(row, "failureCause") ?? ""} onChange={e => update(row.id, "failureCause", e.target.value)} className="h-6 text-xs" placeholder="Cause..." data-testid={`input-cause-${row.id}`} /></td>
                    <td className="px-1 py-1 text-center"><RatingCell value={o} onChange={v => update(row.id, "occurrence", v)} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "preventionControl") ?? ""} onChange={e => update(row.id, "preventionControl", e.target.value)} className="h-6 text-xs" placeholder="Prevention..." data-testid={`input-prev-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "detectionControl") ?? ""} onChange={e => update(row.id, "detectionControl", e.target.value)} className="h-6 text-xs" placeholder="Detection..." data-testid={`input-det-${row.id}`} /></td>
                    <td className="px-1 py-1 text-center"><RatingCell value={d} onChange={v => update(row.id, "detection", v)} /></td>
                    <td className="px-1 py-1 text-center">
                      <span className={`inline-block px-1.5 rounded text-xs font-semibold ${rpnColor(rpn)}`}>{rpn}</span>
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-0.5">
                        {isDirty && (
                          <button onClick={() => saveRow(row.id)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50" title="Save" data-testid={`btn-save-pfmea-${row.id}`}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { if (confirm("Delete row?")) deleteMut.mutate(row.id); }} className="p-1 rounded text-muted-foreground hover:text-red-500" data-testid={`btn-del-pfmea-${row.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-slate-50/70 dark:bg-slate-800/20">
                      <td colSpan={14} className="px-4 py-3">
                        <div className="space-y-3">
                          {row.reviewFlag && (
                            <ReviewBadge label="Process step was modified — verify this PFMEA row is still accurate" onClear={() => clearFlagMut.mutate(row.id)} />
                          )}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Recommended Action(s)</Label>
                              <Textarea value={val(row, "recommendedAction") ?? ""} onChange={e => update(row.id, "recommendedAction", e.target.value)} rows={2} className="text-xs" data-testid={`ta-action-${row.id}`} />
                            </div>
                            <div>
                              <Label className="text-xs">Responsibility & Target Date</Label>
                              <Input value={val(row, "responsibility") ?? ""} onChange={e => update(row.id, "responsibility", e.target.value)} className="h-7 text-xs mb-1" placeholder="Name / Dept" data-testid={`input-resp-${row.id}`} />
                              <Input type="date" value={val(row, "targetDate") ?? ""} onChange={e => update(row.id, "targetDate", e.target.value)} className="h-7 text-xs" data-testid={`input-target-date-${row.id}`} />
                            </div>
                            <div>
                              <Label className="text-xs">Actions Taken</Label>
                              <Textarea value={val(row, "actionTaken") ?? ""} onChange={e => update(row.id, "actionTaken", e.target.value)} rows={2} className="text-xs" data-testid={`ta-taken-${row.id}`} />
                            </div>
                          </div>
                          <div className="border-t border-border/30 pt-2">
                            <Label className="text-xs font-semibold">Resulting S / O / D / RPN (after actions)</Label>
                            <div className="flex items-center gap-2 mt-1">
                              {(["resultingSeverity", "resultingOccurrence", "resultingDetection"] as const).map((field, i) => {
                                const v = val(row, field);
                                return (
                                  <div key={field} className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">{["S","O","D"][i]}:</span>
                                    <Select value={v ? String(v) : "__none__"} onValueChange={vv => update(row.id, field, vv === "__none__" ? null : Number(vv))}>
                                      <SelectTrigger className="h-6 text-xs w-14"><SelectValue placeholder="—" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__none__">—</SelectItem>
                                        {[1,2,3,4,5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)} className={`text-xs ${RATING_COLORS[n]}`}>{n}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              })}
                              {val(row, "resultingSeverity") && val(row, "resultingOccurrence") && val(row, "resultingDetection") && (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${rpnColor(Number(val(row, "resultingSeverity")) * Number(val(row, "resultingOccurrence")) * Number(val(row, "resultingDetection")))}`}>
                                  RPN: {Number(val(row, "resultingSeverity")) * Number(val(row, "resultingOccurrence")) * Number(val(row, "resultingDetection"))}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button size="sm" className="h-7 text-xs bg-accent hover:bg-accent/90 text-white gap-1" onClick={() => saveRow(row.id)} disabled={!edits[row.id] || updateMut.isPending}>
                              <Check className="w-3 h-3" />Save Row
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Control Plan Tab ─────────────────────────────────────────────────────────

function ControlPlanTab({ projectId, project }: { projectId: number; project: { projectName: string; partNumber?: string | null; customer?: string | null } }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, Partial<ApqpControlPlanRow>>>({});
  const [headerOpen, setHeaderOpen] = useState(true);
  const [cpHeader, setCpHeader] = useState({
    planType: "pre_launch",
    controlPlanNumber: "",
    partNumberRev: "",
    supplierPlant: "",
    supplierCode: "",
    keyContact: "",
    phone: "",
    dateOrig: "",
    dateRev: "",
    custEngApproval: "",
    custEngApprovalDate: "",
    custQualApproval: "",
    custQualApprovalDate: "",
    supplierApproval: "",
    supplierApprovalDate: "",
    coreTeam: "",
    partName: project.projectName,
  });

  const { data: pfmeaRows = [] } = useQuery<ApqpPfmeaRow[]>({
    queryKey: ["/api/apqp", projectId, "pfmea-rows"],
    queryFn: async () => { const r = await fetch(`/api/apqp/${projectId}/pfmea-rows`, { credentials: "include" }); return r.json(); },
  });

  const { data: rows = [], isLoading } = useQuery<ApqpControlPlanRow[]>({
    queryKey: ["/api/apqp", projectId, "control-plan-rows"],
    queryFn: async () => { const r = await fetch(`/api/apqp/${projectId}/control-plan-rows`, { credentials: "include" }); return r.json(); },
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["/api/apqp", projectId, "control-plan-rows"] });

  const createMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/apqp/${projectId}/control-plan-rows`, { charType: "product", rowOrder: rows.length }),
    onSuccess: () => { inv(); toast({ title: "Row added" }); },
  });

  const importMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/apqp/${projectId}/control-plan-rows/import-pfmea`, {}),
    onSuccess: async (res) => {
      const data = await (res as any).json?.() ?? {};
      inv(); toast({ title: `Imported ${data.created ?? 0} rows from PFMEA` });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApqpControlPlanRow> }) =>
      apiRequest("PATCH", `/api/apqp/control-plan-rows/${id}`, data),
    onSuccess: inv,
  });

  const clearFlagMut = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/apqp/control-plan-rows/${id}/clear-flag`, {}),
    onSuccess: () => { inv(); toast({ title: "Review flag cleared" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/apqp/control-plan-rows/${id}`, {}),
    onSuccess: () => { inv(); toast({ title: "Row deleted" }); },
  });

  const update = (id: number, field: keyof ApqpControlPlanRow, value: any) =>
    setEdits(e => ({ ...e, [id]: { ...e[id], [field]: value } }));
  const val = (row: ApqpControlPlanRow, field: keyof ApqpControlPlanRow) =>
    edits[row.id]?.[field] !== undefined ? edits[row.id][field] : (row as any)[field];
  const saveRow = (id: number) => {
    if (edits[id]) { updateMut.mutate({ id, data: edits[id] }); setEdits(e => { const n = { ...e }; delete n[id]; return n; }); }
  };

  const flaggedCount = rows.filter(r => r.reviewFlag).length;
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors" onClick={() => setHeaderOpen(h => !h)}>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-accent" />
            <span className="font-semibold text-sm">Control Plan Header</span>
            <Badge variant="outline" className={`text-xs ${cpHeader.planType === "prototype" ? "border-purple-300 text-purple-700" : cpHeader.planType === "pre_launch" ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"}`}>
              {cpHeader.planType === "prototype" ? "Prototype" : cpHeader.planType === "pre_launch" ? "Pre-Launch" : "Production"}
            </Badge>
          </div>
          {headerOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        {headerOpen && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border/30">
            <div className="col-span-2 md:col-span-4">
              <Label className="text-xs">Plan Type</Label>
              <div className="flex gap-2 mt-1">
                {["prototype","pre_launch","production"].map(pt => (
                  <button key={pt} onClick={() => setCpHeader(h => ({ ...h, planType: pt }))}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${cpHeader.planType === pt ? "bg-accent text-white border-accent" : "border-border hover:bg-slate-50"}`}
                    data-testid={`btn-plan-type-${pt}`}>
                    {pt === "prototype" ? "Prototype" : pt === "pre_launch" ? "Pre-Launch" : "Production"}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: "Control Plan #", key: "controlPlanNumber" }, { label: "Part Name", key: "partName" },
              { label: "Part # / Rev Level", key: "partNumberRev" }, { label: "Supplier / Plant", key: "supplierPlant" },
              { label: "Supplier Code", key: "supplierCode" }, { label: "Key Contact", key: "keyContact" },
              { label: "Phone", key: "phone" }, { label: "Core Team", key: "coreTeam" },
              { label: "Date (Orig)", key: "dateOrig", type: "date" }, { label: "Date (Rev)", key: "dateRev", type: "date" },
              { label: "Cust. Eng. Approval", key: "custEngApproval" }, { label: "Approval Date", key: "custEngApprovalDate", type: "date" },
              { label: "Cust. Quality Approval", key: "custQualApproval" }, { label: "Approval Date", key: "custQualApprovalDate", type: "date" },
              { label: "Supplier Approval", key: "supplierApproval" }, { label: "Approval Date", key: "supplierApprovalDate", type: "date" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input type={type ?? "text"} value={(cpHeader as any)[key] ?? ""} onChange={e => setCpHeader(h => ({ ...h, [key]: e.target.value }))} className="h-7 text-xs mt-0.5" data-testid={`cp-header-${key}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm">Control Plan Characteristics</h3>
          <p className="text-xs text-muted-foreground">AIAG Control Plan Manual — product & process characteristics with measurement & control methods.</p>
        </div>
        <div className="flex items-center gap-2">
          {flaggedCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs gap-1">
              <AlertTriangle className="w-3 h-3" />{flaggedCount} review{flaggedCount > 1 ? "s" : ""}
            </Badge>
          )}
          {pfmeaRows.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => importMut.mutate()} disabled={importMut.isPending} data-testid="btn-import-pfmea">
              {importMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}Import from PFMEA
            </Button>
          )}
          <Button size="sm" className="gap-1.5 h-8 text-xs bg-accent hover:bg-accent/90 text-white" onClick={() => createMut.mutate()} disabled={createMut.isPending} data-testid="btn-add-cp-row">
            {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}Add Row
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
          <Layers className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No control plan rows yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add rows manually or import from PFMEA to auto-populate characteristics.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/40">
                <th className="px-1 py-2 w-6" />
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[90px]">Part/Process #</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">Process Name / Op Description</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[80px]">Machine/Device/Jig</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-12">Char #</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-20">Type</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[90px]">Characteristic</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-14">Class</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[90px]">Spec / Tolerance</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[90px]">Meas. Technique</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-16">Sample Size</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-20">Frequency</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[80px]">Control Method</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[80px]">Reaction Plan</th>
                <th className="px-1 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map(row => {
                const expanded = expandedRow === row.id;
                const isDirty = !!edits[row.id];
                return (
                  <Fragment key={row.id}>
                  <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${row.reviewFlag ? "bg-amber-50/40 dark:bg-amber-900/10" : ""}`}>
                    <td className="px-1 py-1 text-center">
                      <button onClick={() => setExpandedRow(expanded ? null : row.id)} className="text-muted-foreground hover:text-accent" data-testid={`btn-expand-cp-${row.id}`}>
                        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-1 py-1"><Input value={val(row, "partProcessNumber") ?? ""} onChange={e => update(row.id, "partProcessNumber", e.target.value)} className="h-6 text-xs" placeholder="#" data-testid={`cp-ppnum-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "processName") ?? ""} onChange={e => update(row.id, "processName", e.target.value)} className="h-6 text-xs" placeholder="Op name..." data-testid={`cp-procname-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "machineDeviceJig") ?? ""} onChange={e => update(row.id, "machineDeviceJig", e.target.value)} className="h-6 text-xs" placeholder="Equipment..." data-testid={`cp-machine-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "charNumber") ?? ""} onChange={e => update(row.id, "charNumber", e.target.value)} className="h-6 text-xs w-12" data-testid={`cp-charnum-${row.id}`} /></td>
                    <td className="px-1 py-1">
                      <Select value={val(row, "charType") ?? "product"} onValueChange={v => update(row.id, "charType", v)}>
                        <SelectTrigger className="h-6 text-xs w-20" data-testid={`cp-chartype-${row.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="process">Process</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1"><Input value={val(row, "charName") ?? ""} onChange={e => update(row.id, "charName", e.target.value)} className="h-6 text-xs" placeholder="Characteristic..." data-testid={`cp-charname-${row.id}`} /></td>
                    <td className="px-1 py-1">
                      <Select value={val(row, "specialCharClass") || "__none__"} onValueChange={v => update(row.id, "specialCharClass", v === "__none__" ? "" : v)}>
                        <SelectTrigger className="h-6 text-xs w-14" data-testid={`cp-specclass-${row.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{SPECIAL_CHARS.map(c => <SelectItem key={c || "__none__"} value={c || "__none__"}>{c || "—"}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1"><Input value={val(row, "productSpec") ?? ""} onChange={e => update(row.id, "productSpec", e.target.value)} className="h-6 text-xs" placeholder="Spec..." data-testid={`cp-spec-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "evalMeasureTech") ?? ""} onChange={e => update(row.id, "evalMeasureTech", e.target.value)} className="h-6 text-xs" placeholder="CMM, gage..." data-testid={`cp-meas-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "sampleSize") ?? ""} onChange={e => update(row.id, "sampleSize", e.target.value)} className="h-6 text-xs w-16" placeholder="5 pcs" data-testid={`cp-ssize-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "sampleFrequency") ?? ""} onChange={e => update(row.id, "sampleFrequency", e.target.value)} className="h-6 text-xs w-20" placeholder="Hourly" data-testid={`cp-sfreq-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "controlMethod") ?? ""} onChange={e => update(row.id, "controlMethod", e.target.value)} className="h-6 text-xs" placeholder="SPC, attr..." data-testid={`cp-ctrl-${row.id}`} /></td>
                    <td className="px-1 py-1"><Input value={val(row, "reactionPlan") ?? ""} onChange={e => update(row.id, "reactionPlan", e.target.value)} className="h-6 text-xs" placeholder="Reaction..." data-testid={`cp-react-${row.id}`} /></td>
                    <td className="px-1 py-1">
                      <div className="flex items-center gap-0.5">
                        {isDirty && (
                          <button onClick={() => saveRow(row.id)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50" data-testid={`btn-save-cp-${row.id}`}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { if (confirm("Delete row?")) deleteMut.mutate(row.id); }} className="p-1 rounded text-muted-foreground hover:text-red-500" data-testid={`btn-del-cp-${row.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-slate-50/70 dark:bg-slate-800/20">
                      <td colSpan={15} className="px-4 py-3">
                        {row.reviewFlag && (
                          <ReviewBadge label="Linked PFMEA row was updated — verify control is still appropriate" onClear={() => clearFlagMut.mutate(row.id)} />
                        )}
                        {row.pfmeaRowId && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Linked PFMEA Row ID: {row.pfmeaRowId}
                            {pfmeaRows.find(p => p.id === row.pfmeaRowId) && (
                              <span className="ml-1 font-medium text-foreground">— {pfmeaRows.find(p => p.id === row.pfmeaRowId)?.failureMode}</span>
                            )}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Inspection Sheet Tab ─────────────────────────────────────────────────────

type InspRowEdit = { value: string; status: "pass" | "fail" | "pending" };

function InspectionSheetDetail({ sheet, projectId, onBack }: { sheet: ApqpInspectionSheet; projectId: number; onBack: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [edits, setEdits] = useState<Record<number, Partial<ApqpInspectionRow>>>({});

  const { data: rows = [], isLoading } = useQuery<ApqpInspectionRow[]>({
    queryKey: ["/api/apqp/inspection-sheets", sheet.id, "rows"],
    queryFn: async () => { const r = await fetch(`/api/apqp/inspection-sheets/${sheet.id}/rows`, { credentials: "include" }); return r.json(); },
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["/api/apqp/inspection-sheets", sheet.id, "rows"] });

  const updateSheetMut = useMutation({
    mutationFn: (data: Partial<ApqpInspectionSheet>) => apiRequest("PATCH", `/api/apqp/inspection-sheets/${sheet.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/apqp", projectId, "inspection-sheets"] }); toast({ title: "Sheet updated" }); },
  });

  const addRowMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/apqp/inspection-sheets/${sheet.id}/rows`, {
      charName: "New Characteristic", status: "pending", rowOrder: rows.length, measurements: [],
    }),
    onSuccess: () => { inv(); toast({ title: "Row added" }); },
  });

  const updateRowMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ApqpInspectionRow> }) =>
      apiRequest("PATCH", `/api/apqp/inspection-rows/${id}`, data),
    onSuccess: inv,
  });

  const deleteRowMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/apqp/inspection-rows/${id}`, {}),
    onSuccess: () => { inv(); toast({ title: "Row deleted" }); },
  });

  const update = (id: number, field: keyof ApqpInspectionRow, value: any) =>
    setEdits(e => ({ ...e, [id]: { ...e[id], [field]: value } }));
  const val = (row: ApqpInspectionRow, field: keyof ApqpInspectionRow) =>
    edits[row.id]?.[field] !== undefined ? edits[row.id][field] : (row as any)[field];
  const saveRow = (id: number) => {
    if (edits[id]) { updateRowMut.mutate({ id, data: edits[id] }); setEdits(e => { const n = { ...e }; delete n[id]; return n; }); }
  };

  const passCount = rows.filter(r => r.status === "pass").length;
  const failCount = rows.filter(r => r.status === "fail").length;
  const pendingCount = rows.filter(r => r.status === "pending").length;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" data-testid="btn-back-sheets">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{sheet.sheetTitle}</h4>
          <p className="text-xs text-muted-foreground">{sheet.partNumber} {sheet.partName && `— ${sheet.partName}`} {sheet.inspector && `| Inspector: ${sheet.inspector}`} {sheet.inspectionDate && `| ${new Date(sheet.inspectionDate).toLocaleDateString()}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sheet.status} onValueChange={v => updateSheetMut.mutate({ status: v })}>
            <SelectTrigger className="h-7 text-xs w-32" data-testid="select-sheet-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pass">Pass ✓</SelectItem>
              <SelectItem value="fail">Fail ✗</SelectItem>
              <SelectItem value="conditional">Conditional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Pass", count: passCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Fail", count: failCount, color: "text-red-600", bg: "bg-red-50" },
          { label: "Pending", count: pendingCount, color: "text-slate-600", bg: "bg-slate-50" }].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-border/30`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Characteristics</h4>
        <Button size="sm" className="h-7 text-xs gap-1 bg-accent hover:bg-accent/90 text-white" onClick={() => addRowMut.mutate()} disabled={addRowMut.isPending} data-testid="btn-add-insp-row">
          <Plus className="w-3 h-3" />Add Row
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No characteristics. Add manually or use "Generate from Control Plan" on the sheet list.</p>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/40">
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[120px]">Characteristic</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[100px]">Specification</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[80px]">Meas. Method</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-20">Sample</th>
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground min-w-[160px]">Measurements</th>
                <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-20">Status</th>
                <th className="px-1 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map(row => {
                const measurements: InspRowEdit[] = val(row, "measurements") ?? [];
                const isDirty = !!edits[row.id];
                return (
                  <tr key={row.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${row.status === "fail" ? "bg-red-50/40 dark:bg-red-900/10" : row.status === "pass" ? "bg-emerald-50/20" : ""}`}>
                    <td className="px-2 py-1.5"><Input value={val(row, "charName") ?? ""} onChange={e => update(row.id, "charName", e.target.value)} className="h-6 text-xs" data-testid={`ir-char-${row.id}`} /></td>
                    <td className="px-2 py-1.5"><Input value={val(row, "specification") ?? ""} onChange={e => update(row.id, "specification", e.target.value)} className="h-6 text-xs" placeholder="e.g. 5.0 ± 0.1mm" data-testid={`ir-spec-${row.id}`} /></td>
                    <td className="px-2 py-1.5"><Input value={val(row, "measureTech") ?? ""} onChange={e => update(row.id, "measureTech", e.target.value)} className="h-6 text-xs" placeholder="Caliper..." data-testid={`ir-meth-${row.id}`} /></td>
                    <td className="px-2 py-1.5 text-center"><Input value={val(row, "sampleSize") ?? ""} onChange={e => update(row.id, "sampleSize", e.target.value)} className="h-6 text-xs w-16 text-center" placeholder="5" data-testid={`ir-sample-${row.id}`} /></td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {measurements.map((m, mi) => (
                          <div key={mi} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-xs ${m.status === "pass" ? "bg-emerald-50 border-emerald-200" : m.status === "fail" ? "bg-red-50 border-red-200" : "bg-slate-50 border-border"}`}>
                            <input value={m.value} onChange={e => {
                              const updated = [...measurements];
                              updated[mi] = { ...updated[mi], value: e.target.value };
                              update(row.id, "measurements", updated);
                            }} className="w-12 bg-transparent outline-none text-xs" data-testid={`ir-meas-${row.id}-${mi}`} />
                            <button onClick={() => {
                              const updated = [...measurements];
                              updated[mi] = { ...updated[mi], status: m.status === "pass" ? "fail" : m.status === "fail" ? "pending" : "pass" };
                              update(row.id, "measurements", updated);
                            }} className={m.status === "pass" ? "text-emerald-600" : m.status === "fail" ? "text-red-500" : "text-muted-foreground"}>
                              {m.status === "pass" ? <Check className="w-3 h-3" /> : m.status === "fail" ? <X className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                            </button>
                            <button onClick={() => { const u = measurements.filter((_, i) => i !== mi); update(row.id, "measurements", u); }} className="text-muted-foreground hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => { const u = [...measurements, { value: "", status: "pending" as const }]; update(row.id, "measurements", u); }} className="px-1.5 py-0.5 rounded border border-dashed border-border text-muted-foreground hover:text-accent hover:border-accent text-xs" data-testid={`btn-add-meas-${row.id}`}>+</button>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <Select value={val(row, "status") ?? "pending"} onValueChange={v => update(row.id, "status", v)}>
                        <SelectTrigger className={`h-6 text-xs w-20 border-0 font-medium ${val(row, "status") === "pass" ? "text-emerald-600" : val(row, "status") === "fail" ? "text-red-600" : "text-slate-500"}`} data-testid={`ir-status-${row.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass" className="text-emerald-600">Pass</SelectItem>
                          <SelectItem value="fail" className="text-red-600">Fail</SelectItem>
                          <SelectItem value="pending" className="text-slate-500">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex gap-0.5">
                        {isDirty && (
                          <button onClick={() => saveRow(row.id)} className="p-1 rounded text-emerald-600 hover:bg-emerald-50" data-testid={`btn-save-ir-${row.id}`}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => { if (confirm("Delete row?")) deleteRowMut.mutate(row.id); }} className="p-1 rounded text-muted-foreground hover:text-red-500" data-testid={`btn-del-ir-${row.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InspectionTab({ projectId, project }: { projectId: number; project: { projectName: string; partNumber?: string | null } }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedSheet, setSelectedSheet] = useState<ApqpInspectionSheet | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newSheet, setNewSheet] = useState({ sheetTitle: "", partNumber: project.partNumber ?? "", partName: project.projectName, inspector: "", inspectionDate: new Date().toISOString().slice(0, 10), lotNumber: "", quantity: "" });

  const { data: sheets = [], isLoading } = useQuery<ApqpInspectionSheet[]>({
    queryKey: ["/api/apqp", projectId, "inspection-sheets"],
    queryFn: async () => { const r = await fetch(`/api/apqp/${projectId}/inspection-sheets`, { credentials: "include" }); return r.json(); },
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["/api/apqp", projectId, "inspection-sheets"] });

  const createMut = useMutation({
    mutationFn: (data: typeof newSheet) => apiRequest("POST", `/api/apqp/${projectId}/inspection-sheets`, { ...data, status: "in_progress" }),
    onSuccess: async (res) => {
      const sheet = await (res as any).json?.();
      inv(); setShowNew(false); setSelectedSheet(sheet);
      setNewSheet({ sheetTitle: "", partNumber: project.partNumber ?? "", partName: project.projectName, inspector: "", inspectionDate: new Date().toISOString().slice(0, 10), lotNumber: "", quantity: "" });
      toast({ title: "Inspection sheet created" });
    },
  });

  const generateMut = useMutation({
    mutationFn: (data: typeof newSheet) => apiRequest("POST", `/api/apqp/${projectId}/inspection-sheets/generate`, { ...data }),
    onSuccess: async (res) => {
      const sheet = await (res as any).json?.();
      inv(); setShowNew(false); setSelectedSheet(sheet);
      toast({ title: "Sheet generated from Control Plan" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/apqp/inspection-sheets/${id}`, {}),
    onSuccess: () => { inv(); toast({ title: "Sheet deleted" }); },
  });

  const STATUS_STYLES: Record<string, string> = {
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    pass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    fail: "bg-red-100 text-red-700 border-red-200",
    conditional: "bg-amber-100 text-amber-700 border-amber-200",
  };

  if (selectedSheet) {
    return (
      <div className="p-4">
        <InspectionSheetDetail sheet={selectedSheet} projectId={projectId} onBack={() => setSelectedSheet(null)} />
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm">Inspection Sheets</h3>
          <p className="text-xs text-muted-foreground">Track inspection records. Generate from Control Plan or create manually.</p>
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-xs bg-accent hover:bg-accent/90 text-white" onClick={() => setShowNew(true)} data-testid="btn-new-insp-sheet">
          <Plus className="w-3 h-3" />New Sheet
        </Button>
      </div>

      {showNew && (
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 space-y-3">
          <h4 className="text-sm font-semibold">New Inspection Sheet</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="col-span-2 md:col-span-3">
              <Label className="text-xs">Sheet Title *</Label>
              <Input value={newSheet.sheetTitle} onChange={e => setNewSheet(s => ({ ...s, sheetTitle: e.target.value }))} className="h-7 text-xs" placeholder="e.g. Final Inspection — Production Run 001" data-testid="input-new-sheet-title" />
            </div>
            {[
              { key: "partNumber", label: "Part Number" }, { key: "partName", label: "Part Name" },
              { key: "inspector", label: "Inspector" }, { key: "lotNumber", label: "Lot / Batch #" },
              { key: "quantity", label: "Quantity" }, { key: "inspectionDate", label: "Inspection Date", type: "date" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input type={type ?? "text"} value={(newSheet as any)[key]} onChange={e => setNewSheet(s => ({ ...s, [key]: e.target.value }))} className="h-7 text-xs" data-testid={`input-ns-${key}`} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => generateMut.mutate(newSheet)} disabled={!newSheet.sheetTitle || generateMut.isPending} data-testid="btn-generate-from-cp">
              {generateMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}Generate from Control Plan
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1 bg-accent hover:bg-accent/90 text-white" onClick={() => createMut.mutate(newSheet)} disabled={!newSheet.sheetTitle || createMut.isPending} data-testid="btn-create-insp-sheet">
              {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}Create Blank
            </Button>
          </div>
        </div>
      )}

      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
          <ClipboardList className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No inspection sheets yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create a blank sheet or generate one from your Control Plan characteristics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sheets.map(s => (
            <div key={s.id} className="rounded-xl border border-border/50 p-4 hover:border-accent/40 transition-colors cursor-pointer group bg-white dark:bg-slate-900/60" onClick={() => setSelectedSheet(s)} data-testid={`insp-sheet-${s.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{s.sheetTitle}</span>
                    <Badge className={`text-xs h-5 ${STATUS_STYLES[s.status] ?? ""}`}>
                      {s.status === "in_progress" ? "In Progress" : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    {s.partNumber && <span className="font-mono">{s.partNumber}</span>}
                    {s.inspector && <span>Inspector: {s.inspector}</span>}
                    {s.inspectionDate && <span>{new Date(s.inspectionDate).toLocaleDateString()}</span>}
                    {s.lotNumber && <span>Lot: {s.lotNumber}</span>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); if (confirm("Delete sheet?")) deleteMut.mutate(s.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`btn-del-sheet-${s.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main APQPDocSuite Component ──────────────────────────────────────────────

const DOC_SUITE_TABS: { key: DocSuiteTab; label: string; icon: ComponentType<{ className?: string }>; desc: string }[] = [
  { key: "pfd",          label: "Process Flow",   icon: GitFork,       desc: "PFD" },
  { key: "pfmea",        label: "PFMEA",          icon: FileText,      desc: "AIAG 4th Ed." },
  { key: "control_plan", label: "Control Plan",   icon: ClipboardList, desc: "AIAG" },
  { key: "inspection",   label: "Inspection",     icon: CheckCircle,   desc: "Sheets" },
];

interface APQPDocSuiteProps {
  projectId: number;
  project: { projectName: string; partNumber?: string | null; customer?: string | null };
}

export function APQPDocSuite({ projectId, project }: APQPDocSuiteProps) {
  const [activeTab, setActiveTab] = useState<DocSuiteTab>("pfd");

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="shrink-0 border-b border-border/40 bg-white dark:bg-slate-950 px-4 pt-3 pb-0">
        <div className="flex items-end gap-1 overflow-x-auto">
          {DOC_SUITE_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-medium border-x border-t transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-white dark:bg-slate-950 border-border/50 border-b-white dark:border-b-slate-950 text-foreground -mb-px z-10"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/30"
                }`}
                data-testid={`tab-doc-suite-${tab.key}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className="text-muted-foreground font-normal">{tab.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "pfd"          && <ProcessFlowTab projectId={projectId} />}
        {activeTab === "pfmea"        && <PfmeaTab projectId={projectId} />}
        {activeTab === "control_plan" && <ControlPlanTab projectId={projectId} project={project} />}
        {activeTab === "inspection"   && <InspectionTab projectId={projectId} project={project} />}
      </div>
    </div>
  );
}
