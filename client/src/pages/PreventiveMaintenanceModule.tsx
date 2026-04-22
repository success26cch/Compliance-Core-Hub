import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wrench, Plus, Pencil, Trash2, AlertTriangle, Calendar,
  CheckCircle2, Clock, ClipboardList, Activity, User, MapPin,
  ChevronLeft, XCircle, Settings, ArrowRight,
  Shield, FlaskConical, Factory, FileText, AlertCircle,
  TrendingDown, Zap, ListChecks, ChevronDown, ChevronUp,
} from "lucide-react";
import type { IsoProject } from "@shared/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

type PmTab = "register" | "log";

interface PmEquipment {
  id: number; userId: string; isoProjectId?: number | null;
  equipmentId: string; name: string; type?: string | null;
  manufacturer?: string | null; model?: string | null; serialNumber?: string | null;
  location?: string | null; department?: string | null;
  responsiblePerson?: string | null; responsibleEmail?: string | null;
  frequencyType?: string | null; frequencyDays?: number | null;
  lastPmDate?: string | null; nextDueDate?: string | null;
  estimatedDurationHours?: string | null; procedureNotes?: string | null;
  status?: string | null; notes?: string | null;
  installDate?: string | null; warrantyExpiry?: string | null;
  maintenanceContractor?: string | null;
  maintenanceType?: string | null;
  criticalityRating?: string | null;
  isKeyProductionEquipment?: boolean | null;
  breakdownImpact?: string | null;
  contingencyPlan?: string | null;
  sparePartsInventory?: string | null;
  oeeTarget?: string | null;
  fodRisk?: boolean | null;
  validationRequired?: boolean | null;
  validationStatus?: string | null;
  validationDate?: string | null;
  createdAt?: string | null;
}

interface PmRecord {
  id: number; userId: string; isoProjectId?: number | null;
  equipmentId: number; pmDate: string;
  performedBy?: string | null; result?: string | null;
  laborHours?: string | null; partsReplaced?: string | null;
  findings?: string | null; correctiveAction?: string | null;
  nextDueDate?: string | null; attachmentUrl?: string | null; notes?: string | null;
  downtimeHours?: string | null;
  workOrderNumber?: string | null;
  technicianCertification?: string | null;
  sparesCost?: string | null;
  rootCause?: string | null;
  safetyCheckPassed?: boolean | null;
  fodCheckCompleted?: boolean | null;
  equipmentValidatedPostPm?: boolean | null;
  checklistData?: string | null; // JSON boolean[]
  createdAt?: string | null;
}

// ─── Procedure step parsing ───────────────────────────────────────────────────

interface ProcedureItem {
  type: "header" | "step";
  text: string;
  stepIndex?: number;
}

function parseProcedureSteps(notes: string | null | undefined): ProcedureItem[] {
  if (!notes?.trim()) return [];
  const lines = notes.split("\n").map(l => l.trim()).filter(Boolean);
  const result: ProcedureItem[] = [];
  let si = 0;
  for (const line of lines) {
    if (/^\d+[\.\)]\s+/.test(line) || /^\d+[\.\)]$/.test(line)) {
      result.push({ type: "step", text: line.replace(/^\d+[\.\)]\s*/, ""), stepIndex: si++ });
    } else if (/^[•\-–*]\s/.test(line)) {
      result.push({ type: "step", text: line.replace(/^[•\-–*]\s*/, ""), stepIndex: si++ });
    } else {
      result.push({ type: "header", text: line });
    }
  }
  return result;
}

function encodeChecklist(checked: boolean[]): string {
  return JSON.stringify(checked);
}

function decodeChecklist(data: string | null | undefined, stepCount: number): boolean[] {
  if (!data) return new Array(stepCount).fill(false);
  try {
    const arr = JSON.parse(data);
    if (!Array.isArray(arr)) return new Array(stepCount).fill(false);
    // Pad or trim to match current step count
    const result = new Array(stepCount).fill(false);
    arr.forEach((v: boolean, i: number) => { if (i < stepCount) result[i] = !!v; });
    return result;
  } catch {
    return new Array(stepCount).fill(false);
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  { value: "daily",       label: "Daily",       days: 1   },
  { value: "weekly",      label: "Weekly",      days: 7   },
  { value: "monthly",     label: "Monthly",     days: 30  },
  { value: "quarterly",   label: "Quarterly",   days: 90  },
  { value: "semi_annual", label: "Semi-Annual", days: 180 },
  { value: "annual",      label: "Annual",      days: 365 },
  { value: "custom",      label: "Custom",      days: 0   },
];

const EQUIPMENT_TYPES = [
  "HVAC / Air Handler", "Compressor", "Conveyor Belt", "Pump", "Motor / Drive",
  "Generator", "Boiler / Heater", "Chiller / Refrigeration", "Press / Stamping",
  "CNC Machine", "Robot / Automation", "Crane / Hoist", "Forklift / Lift Truck",
  "Extruder", "Mixer / Agitator", "Reactor / Vessel", "Filter System",
  "Tank / Storage Vessel", "Electrical Panel / Switchgear", "Fire Suppression System",
  "Lubrication System", "Vacuum System", "Hydraulic System", "Pneumatic System",
  "Welding Equipment", "Packaging Machine", "Filling / Dosing Machine",
  "Printing / Marking Machine", "Dust Collector / Air Filtration",
  "Water Treatment System", "Analytical Instrument", "Centrifuge", "Heat Exchanger",
  "Distillation Column", "Agitator / Stirrer", "Dryer / Oven", "Other",
];

const MAINTENANCE_TYPE_OPTIONS = [
  { value: "preventive",       label: "Preventive (Scheduled PM)" },
  { value: "predictive",       label: "Predictive (Condition-Based)" },
  { value: "tpm",              label: "TPM — Total Productive Maintenance" },
  { value: "condition_based",  label: "Condition-Based Monitoring" },
  { value: "reactive",         label: "Reactive / Breakdown" },
];

const CRITICALITY_OPTIONS = [
  { value: "critical", label: "Critical",  color: "bg-red-100 text-red-700 border-red-200" },
  { value: "high",     label: "High",      color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "medium",   label: "Medium",    color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "low",      label: "Low",       color: "bg-slate-100 text-slate-600 border-slate-200" },
];

const RESULT_META: Record<string, { label: string; color: string }> = {
  completed:       { label: "Completed",       color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  incomplete:      { label: "Incomplete",      color: "bg-amber-100 text-amber-700 border-amber-200" },
  needs_attention: { label: "Needs Attention", color: "bg-red-100 text-red-700 border-red-200" },
};

function calcNextDue(fromDate: string, frequencyDays: number): string {
  if (!fromDate || !frequencyDays) return "";
  const d = new Date(fromDate);
  d.setDate(d.getDate() + frequencyDays);
  return d.toISOString().slice(0, 10);
}

function daysDiff(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function freqLabel(eq: PmEquipment): string {
  const opt = FREQUENCY_OPTIONS.find(o => o.value === eq.frequencyType);
  if (!opt) return "—";
  if (opt.value === "custom") return `Every ${eq.frequencyDays ?? "?"} days`;
  return opt.label;
}

function freqDays(eq: PmEquipment): number {
  const opt = FREQUENCY_OPTIONS.find(o => o.value === eq.frequencyType);
  if (!opt || opt.value === "custom") return eq.frequencyDays ?? 30;
  return opt.days;
}

function critMeta(r: string | null | undefined) {
  return CRITICALITY_OPTIONS.find(o => o.value === r) ?? CRITICALITY_OPTIONS[2];
}

// ─── Due badge ────────────────────────────────────────────────────────────────

function DueBadge({ nextDueDate, size = "sm" }: { nextDueDate?: string | null; size?: "sm" | "xs" }) {
  const days = daysDiff(nextDueDate);
  const cls = size === "xs" ? "text-[10px]" : "text-xs";
  if (days === null) return <Badge className={`${cls} bg-slate-100 text-slate-500 border-slate-300`}>No date set</Badge>;
  if (days < 0)      return <Badge className={`${cls} bg-red-100 text-red-700 border-red-200`}>Overdue {Math.abs(days)}d</Badge>;
  if (days <= 30)    return <Badge className={`${cls} bg-amber-100 text-amber-700 border-amber-200`}>Due in {days}d</Badge>;
  return <Badge className={`${cls} bg-emerald-100 text-emerald-700 border-emerald-200`}>Due {nextDueDate}</Badge>;
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label, sub }: { icon?: any; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-1 border-b border-border/60 mb-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
      <span className="text-xs font-black uppercase tracking-wider text-foreground">{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground ml-1">{sub}</span>}
    </div>
  );
}

// ─── Interactive Procedure Checklist ─────────────────────────────────────────

function ProcedureChecklist({ steps, checked, onChange }: {
  steps: ProcedureItem[];
  checked: boolean[];
  onChange: (checked: boolean[]) => void;
}) {
  const stepItems = steps.filter(s => s.type === "step");
  const doneCount = checked.filter(Boolean).length;
  const total = stepItems.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  if (steps.length === 0) return null;

  function toggle(idx: number) {
    const next = [...checked];
    next[idx] = !next[idx];
    onChange(next);
  }

  function markAll(v: boolean) {
    onChange(new Array(total).fill(v));
  }

  return (
    <div className="space-y-2">
      {/* Progress header */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Progress value={pct} className="h-2 flex-1" />
          <span className={`text-sm font-bold whitespace-nowrap ${allDone ? "text-emerald-600" : "text-foreground"}`}>
            {doneCount}/{total}
          </span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => markAll(true)}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 py-1 px-1"
            data-testid="button-checklist-all">
            All ✓
          </button>
          <button
            type="button"
            onClick={() => markAll(false)}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 py-1 px-1">
            Reset
          </button>
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-bold text-sm">All procedure steps completed!</span>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((item, i) => {
          if (item.type === "header") {
            return (
              <div key={i} className="pt-2 pb-0.5">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{item.text}</span>
              </div>
            );
          }
          const si = item.stepIndex!;
          const done = checked[si] ?? false;
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(si)}
              data-testid={`checklist-step-${si}`}
              className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 touch-manipulation
                ${done
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-background border-border hover:bg-muted/30 active:bg-muted/50"
                }`}
            >
              {/* Large checkbox visual */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors
                ${done ? "bg-emerald-500 border-emerald-500" : "border-border bg-background"}`}>
                {done && (
                  <svg viewBox="0 0 12 10" className="w-3.5 h-3 fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round">
                    <polyline points="1,5 4,8 11,1" />
                  </svg>
                )}
              </div>
              {/* Step number + text */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm leading-snug font-medium ${done ? "line-through text-emerald-700 opacity-70" : "text-foreground"}`}>
                  <span className="text-[11px] font-bold text-muted-foreground mr-1.5">Step {si + 1}.</span>
                  {item.text}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Equipment Form ───────────────────────────────────────────────────────────

const EMPTY_EQ: Partial<PmEquipment> = {
  equipmentId: "", name: "", type: "", manufacturer: "", model: "", serialNumber: "",
  location: "", department: "", responsiblePerson: "", responsibleEmail: "",
  frequencyType: "monthly", frequencyDays: 30,
  estimatedDurationHours: "", procedureNotes: "", status: "active",
  maintenanceType: "preventive", criticalityRating: "medium",
  isKeyProductionEquipment: false, fodRisk: false, validationRequired: false,
  notes: "",
};

function EquipmentForm({ initial, isoProjectId, onSave, onCancel }: {
  initial?: Partial<PmEquipment>;
  isoProjectId?: number | null;
  onSave: (data: Partial<PmEquipment>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<PmEquipment>>({ ...EMPTY_EQ, ...initial });
  const { toast } = useToast();
  const set = <K extends keyof PmEquipment>(k: K) => (v: PmEquipment[K]) =>
    setForm(f => ({ ...f, [k]: v }));
  const isCustom = form.frequencyType === "custom";

  function handleFreqTypeChange(v: string) {
    const opt = FREQUENCY_OPTIONS.find(o => o.value === v);
    setForm(f => ({
      ...f, frequencyType: v,
      frequencyDays: v === "custom" ? (f.frequencyDays ?? 30) : (opt?.days ?? 30),
    }));
  }

  function handleSubmit() {
    if (!form.equipmentId?.trim()) { toast({ title: "Equipment ID is required", variant: "destructive" }); return; }
    if (!form.name?.trim())        { toast({ title: "Equipment name is required", variant: "destructive" }); return; }
    onSave({ ...form, isoProjectId });
  }

  const row2 = "grid grid-cols-1 sm:grid-cols-2 gap-3";
  const fld  = "space-y-1.5";

  return (
    <div className="space-y-5">
      <SectionLabel icon={Settings} label="General Information" />
      <div className={row2}>
        <div className={fld}>
          <Label className="text-xs font-semibold">Equipment ID *</Label>
          <Input className="h-10" value={form.equipmentId ?? ""} onChange={e => set("equipmentId")(e.target.value)} placeholder="PM-001" data-testid="input-pm-equip-id" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Equipment Name *</Label>
          <Input className="h-10" value={form.name ?? ""} onChange={e => set("name")(e.target.value)} placeholder="e.g. Air Compressor #1" data-testid="input-pm-equip-name" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Type</Label>
          <Select value={form.type ?? ""} onValueChange={set("type")}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select type…" /></SelectTrigger>
            <SelectContent>{EQUIPMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Criticality Rating</Label>
          <Select value={form.criticalityRating ?? "medium"} onValueChange={set("criticalityRating")}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>{CRITICALITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Manufacturer</Label>
          <Input className="h-10" value={form.manufacturer ?? ""} onChange={e => set("manufacturer")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Model</Label>
          <Input className="h-10" value={form.model ?? ""} onChange={e => set("model")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Serial Number</Label>
          <Input className="h-10" value={form.serialNumber ?? ""} onChange={e => set("serialNumber")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Status</Label>
          <Select value={form.status ?? "active"} onValueChange={set("status")}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Location</Label>
          <Input className="h-10" value={form.location ?? ""} onChange={e => set("location")(e.target.value)} placeholder="Bldg 2, Room 104" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Department</Label>
          <Input className="h-10" value={form.department ?? ""} onChange={e => set("department")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Responsible Person</Label>
          <Input className="h-10" value={form.responsiblePerson ?? ""} onChange={e => set("responsiblePerson")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Responsible Email</Label>
          <Input className="h-10" value={form.responsibleEmail ?? ""} onChange={e => set("responsibleEmail")(e.target.value)} />
        </div>
      </div>

      <SectionLabel icon={Calendar} label="PM Schedule" />
      <div className={row2}>
        <div className={fld}>
          <Label className="text-xs font-semibold">PM Frequency</Label>
          <Select value={form.frequencyType ?? "monthly"} onValueChange={handleFreqTypeChange}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>{FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {isCustom && (
          <div className={fld}>
            <Label className="text-xs font-semibold">Custom Interval (days)</Label>
            <Input type="number" min={1} className="h-10" value={form.frequencyDays ?? 30}
              onChange={e => set("frequencyDays")(Number(e.target.value))} data-testid="input-pm-freq-days" />
          </div>
        )}
        <div className={fld}>
          <Label className="text-xs font-semibold">Maintenance Strategy</Label>
          <Select value={form.maintenanceType ?? "preventive"} onValueChange={set("maintenanceType")}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>{MAINTENANCE_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Estimated Duration (hours)</Label>
          <Input className="h-10" value={form.estimatedDurationHours ?? ""} onChange={e => set("estimatedDurationHours")(e.target.value)} placeholder="e.g. 2.5" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-semibold">PM Procedure / Checklist Steps</Label>
          <p className="text-[11px] text-muted-foreground">Number each step (1. 2. 3.) so technicians can check them off when logging a PM record.</p>
          <Textarea className="resize-none" rows={5} value={form.procedureNotes ?? ""}
            onChange={e => set("procedureNotes")(e.target.value)}
            placeholder="1. Lock out equipment (LOTO)\n2. Inspect for leaks or damage\n3. Replace oil filter\n4. Check belt tension\n5. Run functional test"
            data-testid="input-pm-procedure" />
        </div>
      </div>

      <SectionLabel icon={FileText} label="Asset Information" />
      <div className={row2}>
        <div className={fld}>
          <Label className="text-xs font-semibold">Install Date</Label>
          <Input type="date" className="h-10" value={form.installDate ?? ""} onChange={e => set("installDate")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Warranty Expiry</Label>
          <Input type="date" className="h-10" value={form.warrantyExpiry ?? ""} onChange={e => set("warrantyExpiry")(e.target.value)} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-semibold">Maintenance Contractor / External Service Provider</Label>
          <Input className="h-10" value={form.maintenanceContractor ?? ""} onChange={e => set("maintenanceContractor")(e.target.value)} placeholder="e.g. ABC Industrial Services, Inc." />
        </div>
      </div>

      <SectionLabel icon={Factory} label="IATF 16949 §8.5.1.1" sub="Total Productive Maintenance" />
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-muted/20">
          <Checkbox id="isKeyProd" checked={!!form.isKeyProductionEquipment}
            onCheckedChange={v => set("isKeyProductionEquipment")(!!v)} className="w-5 h-5" />
          <label htmlFor="isKeyProd" className="text-sm font-semibold cursor-pointer">
            Key Production Equipment (KPE)
            <span className="block text-xs font-normal text-muted-foreground">IATF §8.5.1.1 — List of key process equipment; TPM planning required</span>
          </label>
        </div>
        <div className={row2}>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold">Breakdown Impact on Production / Quality</Label>
            <Textarea className="resize-none" rows={2} value={form.breakdownImpact ?? ""} onChange={e => set("breakdownImpact")(e.target.value)} placeholder="What happens if this equipment fails?" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold">Contingency Plan / Backup Process</Label>
            <Textarea className="resize-none" rows={2} value={form.contingencyPlan ?? ""} onChange={e => set("contingencyPlan")(e.target.value)} placeholder="Backup equipment, alternative process…" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold">Spare Parts Inventory (IATF §8.5.1.1)</Label>
            <Textarea className="resize-none" rows={2} value={form.sparePartsInventory ?? ""} onChange={e => set("sparePartsInventory")(e.target.value)} placeholder="Critical spare parts on-hand (part numbers, quantities)…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">OEE Target (%)</Label>
            <Input className="h-10" value={form.oeeTarget ?? ""} onChange={e => set("oeeTarget")(e.target.value)} placeholder="e.g. 85%" />
          </div>
        </div>
      </div>

      <SectionLabel icon={Shield} label="AS9100D" sub="Foreign Object Damage" />
      <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-muted/20">
        <Checkbox id="fodRisk" checked={!!form.fodRisk} onCheckedChange={v => set("fodRisk")(!!v)} className="w-5 h-5" />
        <label htmlFor="fodRisk" className="text-sm font-semibold cursor-pointer">
          Foreign Object Damage (FOD) Risk
          <span className="block text-xs font-normal text-muted-foreground">AS9100D — This equipment poses an FOD risk during maintenance</span>
        </label>
      </div>

      <SectionLabel icon={FlaskConical} label="ISO 13485 §6.3" sub="Equipment Validation" />
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-muted/20">
          <Checkbox id="validationReq" checked={!!form.validationRequired} onCheckedChange={v => set("validationRequired")(!!v)} className="w-5 h-5" />
          <label htmlFor="validationReq" className="text-sm font-semibold cursor-pointer">
            Validation Required (§6.3)
            <span className="block text-xs font-normal text-muted-foreground">Equipment used in manufacturing / quality requires validation per ISO 13485 §6.3</span>
          </label>
        </div>
        {form.validationRequired && (
          <div className={row2}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Validation Status</Label>
              <Select value={form.validationStatus ?? ""} onValueChange={set("validationStatus")}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select status…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="not_validated">Not Yet Validated</SelectItem>
                  <SelectItem value="overdue">Validation Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Last Validation Date</Label>
              <Input type="date" className="h-10" value={form.validationDate ?? ""} onChange={e => set("validationDate")(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Additional Notes</Label>
        <Textarea className="resize-none" rows={2} value={form.notes ?? ""} onChange={e => set("notes")(e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90 text-white flex-1 h-11 text-sm" data-testid="button-save-pm-equip">
          {initial?.id ? "Update Equipment" : "Add Equipment"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="h-11">Cancel</Button>
      </div>
    </div>
  );
}

// ─── PM Record Form — Mobile First ────────────────────────────────────────────

const EMPTY_REC: Partial<PmRecord> = {
  pmDate: new Date().toISOString().slice(0, 10),
  result: "completed", performedBy: "", laborHours: "", downtimeHours: "",
  workOrderNumber: "", technicianCertification: "", partsReplaced: "", sparesCost: "",
  findings: "", rootCause: "", correctiveAction: "", notes: "",
  safetyCheckPassed: false, fodCheckCompleted: false, equipmentValidatedPostPm: false,
  checklistData: null,
};

function RecordForm({ equipment, allEquipment, isoProjectId, initial, onSave, onCancel }: {
  equipment?: PmEquipment | null;
  allEquipment: PmEquipment[];
  isoProjectId?: number | null;
  initial?: Partial<PmRecord>;
  onSave: (data: Partial<PmRecord>) => void;
  onCancel: () => void;
}) {
  const [selectedEquipId, setSelectedEquipId] = useState<number | null>(
    equipment?.id ?? initial?.equipmentId ?? null
  );
  const [form, setForm] = useState<Partial<PmRecord>>({
    ...EMPTY_REC,
    equipmentId: equipment?.id ?? initial?.equipmentId ?? 0,
    ...initial,
  });
  const { toast } = useToast();

  const selectedEquip = allEquipment.find(e => e.id === selectedEquipId) ?? equipment ?? null;
  const steps = parseProcedureSteps(selectedEquip?.procedureNotes);
  const stepItems = steps.filter(s => s.type === "step");
  const stepCount = stepItems.length;

  const [checklist, setChecklist] = useState<boolean[]>(() =>
    decodeChecklist(initial?.checklistData, stepCount)
  );

  // Re-initialize checklist when equipment changes
  useEffect(() => {
    const newSteps = parseProcedureSteps(
      allEquipment.find(e => e.id === selectedEquipId)?.procedureNotes ?? equipment?.procedureNotes
    );
    const newCount = newSteps.filter(s => s.type === "step").length;
    setChecklist(decodeChecklist(initial?.checklistData, newCount));
  }, [selectedEquipId]);

  const set = <K extends keyof PmRecord>(k: K) => (v: PmRecord[K]) => setForm(f => ({ ...f, [k]: v }));

  function handleDateChange(date: string) {
    const days = selectedEquip ? freqDays(selectedEquip) : 30;
    setForm(f => ({ ...f, pmDate: date, nextDueDate: date ? calcNextDue(date, days) : f.nextDueDate }));
  }

  function handleEquipChange(id: number) {
    setSelectedEquipId(id);
    const eq = allEquipment.find(e => e.id === id);
    if (eq && form.pmDate) {
      setForm(f => ({ ...f, equipmentId: id, nextDueDate: calcNextDue(f.pmDate!, freqDays(eq)) }));
    } else {
      setForm(f => ({ ...f, equipmentId: id }));
    }
  }

  function handleSubmit() {
    if (!selectedEquipId) { toast({ title: "Please select equipment", variant: "destructive" }); return; }
    if (!form.pmDate)     { toast({ title: "PM date is required", variant: "destructive" }); return; }
    const checklistJson = stepCount > 0 ? encodeChecklist(checklist) : null;
    onSave({ ...form, equipmentId: selectedEquipId, isoProjectId, checklistData: checklistJson });
  }

  const doneCount = checklist.filter(Boolean).length;
  const pct = stepCount > 0 ? Math.round((doneCount / stepCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">

      {/* ── Equipment banner + checklist progress (sticky sub-header) ── */}
      <div className="shrink-0 px-4 sm:px-5 pb-3 pt-2 bg-muted/30 border-b border-border space-y-2">
        {/* Equipment selector or banner */}
        {!equipment ? (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Equipment *</Label>
            <Select value={selectedEquipId ? String(selectedEquipId) : ""} onValueChange={v => handleEquipChange(Number(v))}>
              <SelectTrigger className="h-11" data-testid="select-pm-equip">
                <SelectValue placeholder="Select equipment…" />
              </SelectTrigger>
              <SelectContent>
                {allEquipment.filter(e => e.status === "active").map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    <span className="font-mono text-xs mr-2 text-muted-foreground">{e.equipmentId}</span>{e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold bg-background border border-border px-2 py-0.5 rounded">{equipment.equipmentId}</span>
            <span className="font-semibold text-sm">{equipment.name}</span>
            {equipment.isKeyProductionEquipment && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">KPE</Badge>}
            {equipment.location && <span className="text-xs text-muted-foreground">· {equipment.location}</span>}
          </div>
        )}

        {/* Checklist progress bar — only if equipment has steps */}
        {stepCount > 0 && (
          <div className="flex items-center gap-3">
            <ListChecks className="w-3.5 h-3.5 text-accent shrink-0" />
            <Progress value={pct} className="h-2 flex-1" />
            <span className={`text-xs font-bold whitespace-nowrap ${pct === 100 ? "text-emerald-600" : "text-foreground"}`}>
              {doneCount}/{stepCount} steps {pct === 100 ? "✓" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Scrollable form body ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5">

        {/* Core: date, result, WO, performed by */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">PM Date *</Label>
              <Input type="date" className="h-11 text-base" value={form.pmDate ?? ""} onChange={e => handleDateChange(e.target.value)} data-testid="input-pm-date" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Next Due Date</Label>
              <Input type="date" className="h-11 text-base" value={form.nextDueDate ?? ""} onChange={e => set("nextDueDate")(e.target.value)} data-testid="input-pm-next-due" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Result</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "completed",       label: "✓ Completed",        cls: "bg-emerald-50 border-emerald-400 text-emerald-800" },
                { v: "incomplete",      label: "⚠ Incomplete",       cls: "bg-amber-50 border-amber-400 text-amber-800" },
                { v: "needs_attention", label: "⚠ Needs Attention",  cls: "bg-red-50 border-red-400 text-red-800" },
              ].map(({ v, label, cls }) => (
                <button
                  key={v}
                  type="button"
                  data-testid={`btn-result-${v}`}
                  onClick={() => set("result")(v)}
                  className={`rounded-xl border-2 py-3 px-2 text-xs font-bold text-center transition-all touch-manipulation
                    ${form.result === v ? cls : "border-border text-muted-foreground hover:border-accent/40"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Performed By</Label>
            <Input className="h-11 text-base" value={form.performedBy ?? ""} onChange={e => set("performedBy")(e.target.value)} placeholder="Technician name" data-testid="input-pm-performed-by" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Work Order #</Label>
              <Input className="h-11 text-base" value={form.workOrderNumber ?? ""} onChange={e => set("workOrderNumber")(e.target.value)} placeholder="WO-2025-0142" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Labor Hours</Label>
              <Input inputMode="decimal" className="h-11 text-base" value={form.laborHours ?? ""} onChange={e => set("laborHours")(e.target.value)} placeholder="e.g. 2.5" />
            </div>
          </div>
        </div>

        {/* ── PROCEDURE CHECKLIST ── */}
        {steps.length > 0 && (
          <div>
            <SectionLabel icon={ListChecks} label="Procedure Checklist" sub="Tap each step to mark complete" />
            <ProcedureChecklist
              steps={steps}
              checked={checklist}
              onChange={setChecklist}
            />
          </div>
        )}

        {/* ── Compliance sign-offs ── */}
        <div>
          <SectionLabel icon={Shield} label="Safety & Compliance Sign-offs" />
          <div className="space-y-2">
            {[
              { id: "safetyCheck", field: "safetyCheckPassed" as const,
                label: "Safety Check / LOTO Completed",
                sub: "Lockout/Tagout confirmed before work began",
                color: "emerald" },
              { id: "fodCheck", field: "fodCheckCompleted" as const,
                label: "FOD Check Completed (AS9100D)",
                sub: "No tools or materials left inside equipment after PM",
                color: "orange" },
              { id: "postPmVal", field: "equipmentValidatedPostPm" as const,
                label: "Equipment Validated After PM (ISO 13485 §6.3)",
                sub: "Post-maintenance validation confirmed before returning to production",
                color: "purple" },
            ].map(({ id, field, label, sub, color }) => {
              const checked = !!form[field];
              const colorMap: Record<string, string> = {
                emerald: "bg-emerald-50 border-emerald-400",
                orange:  "bg-orange-50 border-orange-400",
                purple:  "bg-purple-50 border-purple-400",
              };
              const textMap: Record<string, string> = {
                emerald: "text-emerald-800",
                orange:  "text-orange-800",
                purple:  "text-purple-800",
              };
              return (
                <button
                  key={id}
                  type="button"
                  data-testid={`signoff-${id}`}
                  onClick={() => set(field)(!checked)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all touch-manipulation
                    ${checked ? `${colorMap[color]} ${textMap[color]}` : "border-border bg-background"}`}>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors
                    ${checked
                      ? (color === "emerald" ? "bg-emerald-500 border-emerald-500" : color === "orange" ? "bg-orange-500 border-orange-500" : "bg-purple-500 border-purple-500")
                      : "border-border bg-background"
                    }`}>
                    {checked && (
                      <svg viewBox="0 0 12 10" className="w-4 h-3.5 fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round">
                        <polyline points="1,5 4,8 11,1" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold leading-snug">{label}</p>
                    <p className={`text-xs mt-0.5 ${checked ? "opacity-70" : "text-muted-foreground"}`}>{sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Findings ── */}
        <div>
          <SectionLabel icon={ClipboardList} label="Findings & Actions" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Findings / Observations</Label>
              <Textarea className="resize-none" rows={3} value={form.findings ?? ""}
                onChange={e => set("findings")(e.target.value)}
                placeholder="Condition of equipment, measurements taken, anomalies observed…"
                data-testid="input-pm-findings" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Corrective Action Required</Label>
              <Textarea className="resize-none" rows={2} value={form.correctiveAction ?? ""}
                onChange={e => set("correctiveAction")(e.target.value)}
                placeholder="Follow-up work orders, repairs, CAPA to raise…" />
            </div>
          </div>
        </div>

        {/* ── Parts & Cost ── */}
        <div>
          <SectionLabel label="Parts & Cost" />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Parts Replaced</Label>
              <Input className="h-11 text-base" value={form.partsReplaced ?? ""} onChange={e => set("partsReplaced")(e.target.value)} placeholder="e.g. Oil filter, drive belt" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Spares Cost ($)</Label>
              <Input inputMode="decimal" className="h-11 text-base" value={form.sparesCost ?? ""} onChange={e => set("sparesCost")(e.target.value)} placeholder="e.g. 245.00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Downtime Hours</Label>
              <Input inputMode="decimal" className="h-11 text-base" value={form.downtimeHours ?? ""} onChange={e => set("downtimeHours")(e.target.value)} placeholder="e.g. 1.0" />
            </div>
          </div>
        </div>

        {/* ── Optional: Root cause + Technician cert + Notes ── */}
        <CollapsibleSection title="More Details (Optional)">
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Technician Certification / Credentials</Label>
              <Input className="h-11 text-base" value={form.technicianCertification ?? ""} onChange={e => set("technicianCertification")(e.target.value)} placeholder="e.g. HVAC Licensed, EPA 608" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Root Cause (if issue found)</Label>
              <Textarea className="resize-none" rows={2} value={form.rootCause ?? ""}
                onChange={e => set("rootCause")(e.target.value)}
                placeholder="Root cause of any defect or issue identified…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Additional Notes</Label>
              <Textarea className="resize-none" rows={2} value={form.notes ?? ""} onChange={e => set("notes")(e.target.value)} />
            </div>
          </div>
        </CollapsibleSection>

      </div>

      {/* ── Sticky footer ── */}
      <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-border bg-background flex gap-3">
        <Button
          onClick={handleSubmit}
          className="bg-accent hover:bg-accent/90 text-white flex-1 h-12 text-base font-bold"
          data-testid="button-save-pm-record">
          {initial?.id ? "Update PM Record" : "Save PM Record"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="h-12 px-5">Cancel</Button>
      </div>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors">
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border">{children}</div>}
    </div>
  );
}

// ─── Record Detail Dialog ─────────────────────────────────────────────────────

function RecordDetail({ record, equipment, onEdit, onDelete, onClose }: {
  record: PmRecord;
  equipment?: PmEquipment | null;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const rm = RESULT_META[record.result ?? "completed"] ?? RESULT_META.completed;
  const steps = parseProcedureSteps(equipment?.procedureNotes);
  const stepItems = steps.filter(s => s.type === "step");
  const checklist = decodeChecklist(record.checklistData, stepItems.length);
  const doneCount = checklist.filter(Boolean).length;

  return (
    <div className="space-y-4 text-sm">
      <div className={`p-3 rounded-lg border flex items-center gap-3 ${rm.color}`}>
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-black text-base">{rm.label}</p>
          {equipment && <p className="text-xs font-normal opacity-80">{equipment.equipmentId} — {equipment.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {[
          ["PM Date", record.pmDate],
          ["Next Due Date", record.nextDueDate ?? "—"],
          ["Performed By", record.performedBy ?? "—"],
          ["Work Order", record.workOrderNumber ?? "—"],
          ["Labor Hours", record.laborHours ? `${record.laborHours}h` : "—"],
          ["Downtime Hours", record.downtimeHours ? `${record.downtimeHours}h` : "—"],
          ["Parts Replaced", record.partsReplaced ?? "—"],
          ["Spares Cost", record.sparesCost ? `$${record.sparesCost}` : "—"],
          ["Technician Cert.", record.technicianCertification ?? "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">{k}</p>
            <p className="font-medium">{v}</p>
          </div>
        ))}
      </div>

      {/* Checklist completion summary */}
      {stepItems.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Procedure Checklist</p>
          <div className="flex items-center gap-3 mb-2">
            <Progress value={stepItems.length > 0 ? Math.round((doneCount / stepItems.length) * 100) : 0} className="h-2 flex-1" />
            <span className={`text-xs font-bold ${doneCount === stepItems.length ? "text-emerald-600" : "text-foreground"}`}>
              {doneCount}/{stepItems.length}
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {steps.map((item, i) => {
              if (item.type === "header") return <p key={i} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-1">{item.text}</p>;
              const done = checklist[item.stepIndex!] ?? false;
              return (
                <div key={i} className={`flex items-start gap-2 rounded-lg p-2 ${done ? "bg-emerald-50" : "bg-muted/20"}`}>
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${done ? "bg-emerald-500" : "bg-border"}`}>
                    {done && <svg viewBox="0 0 12 10" className="w-2.5 h-2 fill-none stroke-white stroke-[2.5] stroke-linecap-round stroke-linejoin-round"><polyline points="1,5 4,8 11,1" /></svg>}
                  </div>
                  <span className={`text-xs ${done ? "line-through text-emerald-700 opacity-70" : "text-foreground"}`}>
                    <span className="font-bold mr-1">Step {item.stepIndex! + 1}.</span>{item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {record.findings && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Findings</p>
          <p className="whitespace-pre-line text-sm bg-muted/30 rounded p-2">{record.findings}</p>
        </div>
      )}
      {record.rootCause && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Root Cause</p>
          <p className="whitespace-pre-line text-sm bg-muted/30 rounded p-2">{record.rootCause}</p>
        </div>
      )}
      {record.correctiveAction && (
        <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/40">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Corrective Action Required
          </p>
          <p className="whitespace-pre-line text-amber-900 text-sm">{record.correctiveAction}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Safety / LOTO", value: record.safetyCheckPassed },
          { label: "FOD Check",     value: record.fodCheckCompleted },
          { label: "Post-PM Valid.", value: record.equipmentValidatedPostPm },
        ].map(({ label, value }) => (
          <div key={label} className={`rounded-lg border p-2 text-center text-xs ${value ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
            {value ? <CheckCircle2 className="w-4 h-4 mx-auto mb-0.5" /> : <XCircle className="w-4 h-4 mx-auto mb-0.5 opacity-40" />}
            {label}
          </div>
        ))}
      </div>

      {record.notes && <p className="text-xs text-muted-foreground italic">{record.notes}</p>}

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
        <Button size="sm" variant="outline" className="text-red-600 hover:border-red-300" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
        <Button size="sm" variant="outline" className="ml-auto" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// ─── Equipment Detail View ────────────────────────────────────────────────────

function EquipmentDetailView({ equipment, records, allEquipment, isoProjectId, onBack, onEdit, onLogPm, onRecordEdit, onRecordDelete }: {
  equipment: PmEquipment;
  records: PmRecord[];
  allEquipment: PmEquipment[];
  isoProjectId?: number | null;
  onBack: () => void;
  onEdit: () => void;
  onLogPm: () => void;
  onRecordEdit: (r: PmRecord) => void;
  onRecordDelete: (r: PmRecord) => void;
}) {
  const [viewRecord, setViewRecord] = useState<PmRecord | null>(null);
  const eqRecords = records.filter(r => r.equipmentId === equipment.id).sort((a, b) => b.pmDate.localeCompare(a.pmDate));

  const totalLabor = eqRecords.reduce((s, r) => s + (parseFloat(r.laborHours ?? "0") || 0), 0);
  const totalDowntime = eqRecords.reduce((s, r) => s + (parseFloat(r.downtimeHours ?? "0") || 0), 0);
  const totalCost = eqRecords.reduce((s, r) => s + (parseFloat(r.sparesCost ?? "0") || 0), 0);
  const completedCount = eqRecords.filter(r => r.result === "completed").length;
  const completionRate = eqRecords.length ? Math.round((completedCount / eqRecords.length) * 100) : 0;
  const crit = critMeta(equipment.criticalityRating);

  // Compute checklist completion for each record
  const steps = parseProcedureSteps(equipment.procedureNotes);
  const stepItems = steps.filter(s => s.type === "step");

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">

          <div className="flex items-center gap-2 text-sm">
            <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Equipment Register
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{equipment.equipmentId} — {equipment.name}</span>
          </div>

          <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-sm font-bold bg-muted border border-border px-2 py-0.5 rounded">{equipment.equipmentId}</span>
                  <Badge className={`text-[10px] ${crit.color}`}>{crit.label} Criticality</Badge>
                  {equipment.isKeyProductionEquipment && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">IATF Key Production Equipment</Badge>}
                  {equipment.fodRisk && <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">AS9100D FOD Risk</Badge>}
                  {equipment.validationRequired && <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">ISO 13485 Validation Req.</Badge>}
                </div>
                <h2 className="text-xl font-black">{equipment.name}</h2>
                <p className="text-sm text-muted-foreground">{[equipment.type, equipment.manufacturer, equipment.model].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <DueBadge nextDueDate={equipment.nextDueDate} />
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white h-10" onClick={onLogPm}>
                  <Plus className="w-4 h-4 mr-1" /> Log PM
                </Button>
                <Button size="sm" variant="outline" className="h-10" onClick={onEdit}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2.5 text-sm border-t border-border pt-4">
              {[
                ["Location",      equipment.location],
                ["Department",    equipment.department],
                ["Responsible",   equipment.responsiblePerson],
                ["PM Frequency",  freqLabel(equipment)],
                ["Last PM",       equipment.lastPmDate],
                ["Next Due",      equipment.nextDueDate],
                ["Est. Duration", equipment.estimatedDurationHours ? `${equipment.estimatedDurationHours}h` : null],
                ["Install Date",  equipment.installDate],
                ["OEE Target",    equipment.oeeTarget],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </div>

            {(equipment.breakdownImpact || equipment.contingencyPlan || equipment.sparePartsInventory) && (
              <div className="border-t border-border pt-4 space-y-2">
                {equipment.breakdownImpact && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-900">
                    <p className="font-bold mb-0.5 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Breakdown Impact (IATF §8.5.1.1)</p>
                    <p>{equipment.breakdownImpact}</p>
                  </div>
                )}
                {equipment.contingencyPlan && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900">
                    <p className="font-bold mb-0.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Contingency Plan</p>
                    <p>{equipment.contingencyPlan}</p>
                  </div>
                )}
                {equipment.sparePartsInventory && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900">
                    <p className="font-bold mb-0.5 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Spare Parts Inventory</p>
                    <p className="whitespace-pre-line">{equipment.sparePartsInventory}</p>
                  </div>
                )}
              </div>
            )}

            {equipment.procedureNotes && (
              <div className="border-t border-border pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                  <p className="font-bold mb-1 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> PM Procedure / Checklist</p>
                  <p className="whitespace-pre-line leading-relaxed">{equipment.procedureNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total PMs",         value: eqRecords.length },
              { label: "Completion Rate",   value: `${completionRate}%`, color: completionRate >= 90 ? "text-emerald-700" : "text-amber-700" },
              { label: "Labor (h)",         value: totalLabor.toFixed(1) },
              { label: "Downtime (h)",      value: totalDowntime.toFixed(1), color: totalDowntime > 0 ? "text-red-700" : "text-slate-400" },
              { label: "Spares Spend",      value: totalCost > 0 ? `$${totalCost.toFixed(0)}` : "—" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border border-border p-3 bg-card">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mb-0.5">{label}</p>
                <p className={`text-xl font-black ${color ?? "text-foreground"}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* PM History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-accent" /> PM History ({eqRecords.length})
              </h3>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onLogPm}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Log PM
              </Button>
            </div>

            {eqRecords.length === 0 && (
              <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No PM records yet</p>
                <p className="text-xs mt-1">Log the first PM for this equipment.</p>
              </div>
            )}

            <div className="space-y-2">
              {eqRecords.map(r => {
                const rm = RESULT_META[r.result ?? "completed"] ?? RESULT_META.completed;
                const recChecklist = decodeChecklist(r.checklistData, stepItems.length);
                const recDone = recChecklist.filter(Boolean).length;
                const hasChecklist = stepItems.length > 0 && r.checklistData != null;
                return (
                  <div key={r.id}
                    className="border border-border rounded-lg p-3.5 hover:bg-muted/20 cursor-pointer"
                    onClick={() => setViewRecord(r)}
                    data-testid={`row-pm-history-${r.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{r.pmDate}</span>
                          <Badge className={`text-[10px] ${rm.color}`}>{rm.label}</Badge>
                          {r.workOrderNumber && <span className="text-xs text-muted-foreground font-mono">{r.workOrderNumber}</span>}
                          {hasChecklist && (
                            <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 border ${recDone === stepItems.length ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted border-border text-muted-foreground"}`}>
                              {recDone}/{stepItems.length} steps
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {r.performedBy && <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.performedBy}</span>}
                          {r.laborHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.laborHours}h</span>}
                          {r.downtimeHours && parseFloat(r.downtimeHours) > 0 && <span className="flex items-center gap-1 text-red-600"><TrendingDown className="w-3 h-3" />{r.downtimeHours}h down</span>}
                          {r.nextDueDate && <span><Calendar className="w-3 h-3 inline mr-0.5" />Next: {r.nextDueDate}</span>}
                        </div>
                        {r.findings && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.findings}</p>}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {r.safetyCheckPassed && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">LOTO ✓</span>}
                          {r.fodCheckCompleted  && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">FOD ✓</span>}
                          {r.equipmentValidatedPostPm && <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">Validated ✓</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                          onClick={e => { e.stopPropagation(); onRecordEdit(r); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500"
                          onClick={e => { e.stopPropagation(); onRecordDelete(r); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={!!viewRecord} onOpenChange={v => { if (!v) setViewRecord(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>PM Record Detail</DialogTitle></DialogHeader>
          {viewRecord && (
            <RecordDetail record={viewRecord} equipment={equipment}
              onEdit={() => { onRecordEdit(viewRecord); setViewRecord(null); }}
              onDelete={() => { onRecordDelete(viewRecord); setViewRecord(null); }}
              onClose={() => setViewRecord(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── PM Record Dialog — full-screen on mobile ─────────────────────────────────

function PmRecordDialog({ open, onOpenChange, title, children }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 flex flex-col w-full max-w-2xl
        h-[100dvh] rounded-none
        sm:h-auto sm:max-h-[94vh] sm:rounded-xl
        overflow-hidden">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-border">
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

interface PreventiveMaintenanceModuleProps {
  project?: IsoProject | null;
}

export function PreventiveMaintenanceModule({ project }: PreventiveMaintenanceModuleProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<PmTab>("register");

  const [equipDialog, setEquipDialog] = useState(false);
  const [editEquip, setEditEquip]     = useState<PmEquipment | null>(null);
  const [logDialog, setLogDialog]     = useState(false);
  const [logForEquip, setLogForEquip] = useState<PmEquipment | null>(null);
  const [editRecord, setEditRecord]   = useState<PmRecord | null>(null);
  const [detailEquipId, setDetailEquipId] = useState<number | null>(null);
  const [filterEquipId, setFilterEquipId] = useState<number | null>(null);

  const projectId = project?.id ?? null;
  const qk = (path: string) => [path, projectId];

  const { data: equipment = [] } = useQuery<PmEquipment[]>({
    queryKey: qk("/api/pm/equipment"),
    queryFn: async () => {
      const url = projectId ? `/api/pm/equipment?projectId=${projectId}` : "/api/pm/equipment";
      return (await fetch(url, { credentials: "include" })).json();
    },
  });

  const { data: records = [] } = useQuery<PmRecord[]>({
    queryKey: qk("/api/pm/records"),
    queryFn: async () => {
      const url = projectId ? `/api/pm/records?projectId=${projectId}` : "/api/pm/records";
      return (await fetch(url, { credentials: "include" })).json();
    },
  });

  const saveEquip = useMutation({
    mutationFn: (d: Partial<PmEquipment>) =>
      editEquip ? apiRequest("PATCH", `/api/pm/equipment/${editEquip.id}`, d) : apiRequest("POST", "/api/pm/equipment", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk("/api/pm/equipment") });
      setEquipDialog(false); setEditEquip(null);
      toast({ title: editEquip ? "Equipment updated" : "Equipment added" });
    },
    onError: () => toast({ title: "Error saving equipment", variant: "destructive" }),
  });

  const deleteEquip = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/pm/equipment/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk("/api/pm/equipment") });
      if (detailEquipId !== null) setDetailEquipId(null);
      toast({ title: "Equipment removed" });
    },
  });

  const saveRecord = useMutation({
    mutationFn: async (d: Partial<PmRecord>) => {
      const res = editRecord
        ? await apiRequest("PATCH", `/api/pm/records/${editRecord.id}`, { ...d, isoProjectId: projectId })
        : await apiRequest("POST",  "/api/pm/records",                  { ...d, isoProjectId: projectId });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk("/api/pm/records") });
      qc.invalidateQueries({ queryKey: qk("/api/pm/equipment") });
      setLogDialog(false); setLogForEquip(null); setEditRecord(null);
      toast({ title: editRecord ? "PM record updated" : "PM record saved" });
    },
    onError: () => toast({ title: "Error saving PM record", variant: "destructive" }),
  });

  const deleteRecord = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/pm/records/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk("/api/pm/records") }); toast({ title: "PM record deleted" }); },
  });

  const active   = equipment.filter(e => e.status === "active");
  const overdue  = active.filter(e => { const d = daysDiff(e.nextDueDate); return d !== null && d < 0; });
  const dueSoon  = active.filter(e => { const d = daysDiff(e.nextDueDate); return d !== null && d >= 0 && d <= 30; });
  const current  = active.filter(e => { const d = daysDiff(e.nextDueDate); return d === null || d > 30; });
  const keyEquip = active.filter(e => e.isKeyProductionEquipment);

  const detailEquipment = equipment.find(e => e.id === detailEquipId) ?? null;
  const filteredRecords = filterEquipId ? records.filter(r => r.equipmentId === filterEquipId) : records;
  const equipById = (id: number) => equipment.find(e => e.id === id);
  const recordsForEquip = (id: number) => records.filter(r => r.equipmentId === id);

  function openLogPm(eq: PmEquipment | null) { setLogForEquip(eq); setEditRecord(null); setLogDialog(true); }

  // ── Equipment detail sub-view ──────────────────────────────────────────────
  if (detailEquipId !== null && detailEquipment) {
    return (
      <>
        <EquipmentDetailView
          equipment={detailEquipment} records={records} allEquipment={equipment}
          isoProjectId={projectId}
          onBack={() => setDetailEquipId(null)}
          onEdit={() => { setEditEquip(detailEquipment); setEquipDialog(true); }}
          onLogPm={() => openLogPm(detailEquipment)}
          onRecordEdit={r => { setEditRecord(r); setLogForEquip(detailEquipment); setLogDialog(true); }}
          onRecordDelete={r => { if (confirm("Delete this PM record?")) deleteRecord.mutate(r.id); }}
        />

        <Dialog open={equipDialog} onOpenChange={v => { setEquipDialog(v); if (!v) setEditEquip(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
            <EquipmentForm initial={editEquip ?? EMPTY_EQ} isoProjectId={projectId}
              onSave={d => saveEquip.mutate(d)} onCancel={() => { setEquipDialog(false); setEditEquip(null); }} />
          </DialogContent>
        </Dialog>

        <PmRecordDialog
          open={logDialog}
          onOpenChange={v => { setLogDialog(v); if (!v) { setLogForEquip(null); setEditRecord(null); } }}
          title={editRecord ? "Edit PM Record" : "Log PM Record"}>
          <RecordForm equipment={logForEquip} allEquipment={equipment} isoProjectId={projectId}
            initial={editRecord ?? undefined}
            onSave={d => saveRecord.mutate(d)}
            onCancel={() => { setLogDialog(false); setLogForEquip(null); setEditRecord(null); }} />
        </PmRecordDialog>
      </>
    );
  }

  // ── Main register / log view ───────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <Wrench className="w-5 h-5 text-accent" /> Preventive Maintenance
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                ISO 9001 §6.3 · IATF 16949 §8.5.1.1 TPM · AS9100D FOD · ISO 13485 §6.3
              </p>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-white h-11"
              onClick={() => { setEditEquip(null); setEquipDialog(true); }}
              data-testid="button-add-pm-equip">
              <Plus className="w-4 h-4 mr-1" /> Add Equipment
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Active Equipment", value: active.length,   icon: Settings,    color: "text-foreground" },
              { label: "Overdue",          value: overdue.length,  icon: XCircle,     color: overdue.length  > 0 ? "text-red-700"     : "text-slate-400" },
              { label: "Due ≤ 30 Days",    value: dueSoon.length,  icon: Clock,       color: dueSoon.length  > 0 ? "text-amber-700"   : "text-slate-400" },
              { label: "On Track",         value: current.length,  icon: CheckCircle2,color: current.length  > 0 ? "text-emerald-700" : "text-slate-400" },
              { label: "Key Prod. Equip.", value: keyEquip.length, icon: Factory,     color: keyEquip.length > 0 ? "text-red-700"     : "text-slate-400" },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border p-3 bg-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{label}</span>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border gap-1">
            {([
              { id: "register" as PmTab, label: "Equipment Register", icon: Settings },
              { id: "log"      as PmTab, label: "PM Records",         icon: ClipboardList },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} data-testid={`tab-pm-${id}`}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  tab === id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* ── Equipment Register ── */}
          {tab === "register" && (
            <div className="space-y-3">
              {equipment.length === 0 && (
                <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
                  <Wrench className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No equipment registered yet</p>
                  <p className="text-xs mt-1">Add equipment to start tracking your PM schedules.</p>
                  <Button className="mt-4 bg-accent hover:bg-accent/90 text-white" size="sm"
                    onClick={() => { setEditEquip(null); setEquipDialog(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add First Equipment
                  </Button>
                </div>
              )}

              {equipment.map(eq => {
                const days = daysDiff(eq.nextDueDate);
                const isOverdue = days !== null && days < 0;
                const isDueSoon = days !== null && days >= 0 && days <= 30;
                const recs = recordsForEquip(eq.id);
                const crit = critMeta(eq.criticalityRating);

                return (
                  <Card key={eq.id} className={`border ${isOverdue ? "border-red-200" : isDueSoon ? "border-amber-200" : "border-border"}`}>
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-4 flex-wrap">
                        <div className={`w-2 h-12 rounded-full shrink-0 ${isOverdue ? "bg-red-400" : isDueSoon ? "bg-amber-400" : "bg-emerald-400"}`} />

                        <div className="min-w-0 flex-1 cursor-pointer group"
                          onClick={() => setDetailEquipId(eq.id)}
                          data-testid={`row-pm-equip-${eq.id}`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{eq.equipmentId}</span>
                            <span className="font-semibold text-sm group-hover:text-accent transition-colors">{eq.name}</span>
                            <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded ${crit.color}`}>{crit.label}</span>
                            {eq.isKeyProductionEquipment && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">KPE</Badge>}
                            {eq.fodRisk && <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">FOD</Badge>}
                            {eq.validationRequired && <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">Validation Req.</Badge>}
                            {eq.status !== "active" && <Badge className="text-[10px] bg-slate-100 text-slate-500">{eq.status}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                            {eq.type && <span>{eq.type}</span>}
                            {eq.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{eq.location}</span>}
                            {eq.responsiblePerson && <span className="flex items-center gap-1"><User className="w-3 h-3" />{eq.responsiblePerson}</span>}
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{freqLabel(eq)}</span>
                            <span className="flex items-center gap-1 text-accent"><ArrowRight className="w-3 h-3" />{recs.length} record{recs.length !== 1 ? "s" : ""} → View history</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <DueBadge nextDueDate={eq.nextDueDate} size="xs" />
                          {eq.lastPmDate && <p className="text-[11px] text-muted-foreground mt-0.5">Last: {eq.lastPmDate}</p>}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" className="h-9 text-xs bg-accent hover:bg-accent/90 text-white"
                            onClick={() => openLogPm(eq)} data-testid={`button-log-pm-${eq.id}`}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Log PM
                          </Button>
                          <Button size="sm" variant="outline" className="h-9 w-9 p-0"
                            onClick={() => { setEditEquip(eq); setEquipDialog(true); }}
                            data-testid={`button-edit-pm-equip-${eq.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-9 w-9 p-0 text-red-500"
                            onClick={() => { if (confirm(`Remove "${eq.name}"?`)) deleteEquip.mutate(eq.id); }}
                            data-testid={`button-delete-pm-equip-${eq.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── PM Records Log ── */}
          {tab === "log" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Select value={filterEquipId ? String(filterEquipId) : "__all__"}
                  onValueChange={v => setFilterEquipId(v === "__all__" ? null : Number(v))}>
                  <SelectTrigger className="h-9 w-[230px]" data-testid="select-pm-log-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Equipment ({records.length} records)</SelectItem>
                    {equipment.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.equipmentId} — {e.name} ({recordsForEquip(e.id).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="bg-accent hover:bg-accent/90 text-white h-9 text-sm"
                  onClick={() => openLogPm(null)} data-testid="button-log-pm-generic">
                  <Plus className="w-4 h-4 mr-1" /> Log PM Record
                </Button>
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No PM records yet</p>
                </div>
              )}

              {filteredRecords.map(r => {
                const eq = equipById(r.equipmentId);
                const rm = RESULT_META[r.result ?? "completed"] ?? RESULT_META.completed;
                const steps = parseProcedureSteps(eq?.procedureNotes);
                const stepCount = steps.filter(s => s.type === "step").length;
                const cl = decodeChecklist(r.checklistData, stepCount);
                const clDone = cl.filter(Boolean).length;
                return (
                  <div key={r.id}
                    className="border border-border rounded-lg p-3.5 hover:bg-muted/20 cursor-pointer"
                    onClick={() => { if (eq) setDetailEquipId(eq.id); }}
                    data-testid={`row-pm-log-${r.id}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {eq && <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{eq.equipmentId}</span>}
                          <span className="font-semibold text-sm">{eq?.name ?? `Equipment #${r.equipmentId}`}</span>
                          <Badge className={`text-[10px] ${rm.color}`}>{rm.label}</Badge>
                          {r.workOrderNumber && <span className="text-xs font-mono text-muted-foreground">{r.workOrderNumber}</span>}
                          {stepCount > 0 && r.checklistData && (
                            <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 border ${clDone === stepCount ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted border-border text-muted-foreground"}`}>
                              {clDone}/{stepCount} steps
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.pmDate}</span>
                          {r.performedBy && <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.performedBy}</span>}
                          {r.laborHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.laborHours}h</span>}
                          {r.downtimeHours && parseFloat(r.downtimeHours) > 0 && <span className="flex items-center gap-1 text-red-600"><TrendingDown className="w-3 h-3" />{r.downtimeHours}h down</span>}
                          {r.nextDueDate && <span>Next: {r.nextDueDate}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {r.safetyCheckPassed && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">LOTO ✓</span>}
                          {r.fodCheckCompleted  && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">FOD ✓</span>}
                          {r.equipmentValidatedPostPm && <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">Validated ✓</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                          onClick={e => { e.stopPropagation(); setEditRecord(r); setLogForEquip(eq ?? null); setLogDialog(true); }}
                          data-testid={`button-edit-pm-record-${r.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500"
                          onClick={e => { e.stopPropagation(); if (confirm("Delete this record?")) deleteRecord.mutate(r.id); }}
                          data-testid={`button-delete-pm-record-${r.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add/Edit Equipment */}
      <Dialog open={equipDialog} onOpenChange={v => { setEquipDialog(v); if (!v) setEditEquip(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editEquip ? "Edit Equipment" : "Add Maintenance Equipment"}</DialogTitle></DialogHeader>
          <EquipmentForm initial={editEquip ?? EMPTY_EQ} isoProjectId={projectId}
            onSave={d => saveEquip.mutate(d)} onCancel={() => { setEquipDialog(false); setEditEquip(null); }} />
        </DialogContent>
      </Dialog>

      {/* Log/Edit PM Record — full-screen on mobile */}
      <PmRecordDialog
        open={logDialog}
        onOpenChange={v => { setLogDialog(v); if (!v) { setLogForEquip(null); setEditRecord(null); } }}
        title={editRecord ? "Edit PM Record" : "Log PM Record"}>
        <RecordForm
          equipment={logForEquip} allEquipment={equipment} isoProjectId={projectId}
          initial={editRecord ?? undefined}
          onSave={d => saveRecord.mutate(d)}
          onCancel={() => { setLogDialog(false); setLogForEquip(null); setEditRecord(null); }} />
      </PmRecordDialog>
    </div>
  );
}
