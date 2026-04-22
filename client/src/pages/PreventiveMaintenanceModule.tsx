import { useState } from "react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wrench, Plus, Pencil, Trash2, AlertTriangle, Calendar,
  CheckCircle2, Clock, ClipboardList, Activity, User, MapPin,
  ChevronLeft, Info, XCircle, Settings, ArrowRight,
  Shield, FlaskConical, Factory, BarChart3, FileText, AlertCircle,
  TrendingDown, Zap,
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
  // Asset tracking
  installDate?: string | null; warrantyExpiry?: string | null;
  maintenanceContractor?: string | null;
  maintenanceType?: string | null;
  criticalityRating?: string | null;
  // IATF 16949 §8.5.1.1
  isKeyProductionEquipment?: boolean | null;
  breakdownImpact?: string | null;
  contingencyPlan?: string | null;
  sparePartsInventory?: string | null;
  oeeTarget?: string | null;
  // AS9100D
  fodRisk?: boolean | null;
  // ISO 13485 §6.3
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
  // Enhanced fields
  downtimeHours?: string | null;
  workOrderNumber?: string | null;
  technicianCertification?: string | null;
  sparesCost?: string | null;
  rootCause?: string | null;
  safetyCheckPassed?: boolean | null;
  fodCheckCompleted?: boolean | null;
  equipmentValidatedPostPm?: boolean | null;
  createdAt?: string | null;
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
    <div className="flex items-center gap-2 pt-2 pb-1 border-b border-border/60 mb-3">
      {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
      <span className="text-xs font-black uppercase tracking-wider text-foreground">{label}</span>
      {sub && <span className="text-[10px] text-muted-foreground ml-1">{sub}</span>}
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

  const row2 = "grid grid-cols-2 gap-3";
  const fld  = "space-y-1";

  return (
    <div className="space-y-5">

      {/* ── General ── */}
      <SectionLabel icon={Settings} label="General Information" />
      <div className={row2}>
        <div className={fld}>
          <Label className="text-xs font-semibold">Equipment ID *</Label>
          <Input className="h-8" value={form.equipmentId ?? ""} onChange={e => set("equipmentId")(e.target.value)} placeholder="PM-001" data-testid="input-pm-equip-id" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Equipment Name *</Label>
          <Input className="h-8" value={form.name ?? ""} onChange={e => set("name")(e.target.value)} placeholder="e.g. Air Compressor #1" data-testid="input-pm-equip-name" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Type</Label>
          <Select value={form.type ?? ""} onValueChange={set("type")}>
            <SelectTrigger className="h-8"><SelectValue placeholder="Select type…" /></SelectTrigger>
            <SelectContent>{EQUIPMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Criticality Rating</Label>
          <Select value={form.criticalityRating ?? "medium"} onValueChange={set("criticalityRating")}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{CRITICALITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Manufacturer</Label>
          <Input className="h-8" value={form.manufacturer ?? ""} onChange={e => set("manufacturer")(e.target.value)} placeholder="e.g. Ingersoll Rand" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Model</Label>
          <Input className="h-8" value={form.model ?? ""} onChange={e => set("model")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Serial Number</Label>
          <Input className="h-8" value={form.serialNumber ?? ""} onChange={e => set("serialNumber")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Status</Label>
          <Select value={form.status ?? "active"} onValueChange={set("status")}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Location</Label>
          <Input className="h-8" value={form.location ?? ""} onChange={e => set("location")(e.target.value)} placeholder="Bldg 2, Room 104" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Department</Label>
          <Input className="h-8" value={form.department ?? ""} onChange={e => set("department")(e.target.value)} placeholder="e.g. Production" />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Responsible Person</Label>
          <Input className="h-8" value={form.responsiblePerson ?? ""} onChange={e => set("responsiblePerson")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Responsible Email</Label>
          <Input className="h-8" value={form.responsibleEmail ?? ""} onChange={e => set("responsibleEmail")(e.target.value)} />
        </div>
      </div>

      {/* ── Schedule ── */}
      <SectionLabel icon={Calendar} label="PM Schedule" />
      <div className={row2}>
        <div className={fld}>
          <Label className="text-xs font-semibold">PM Frequency</Label>
          <Select value={form.frequencyType ?? "monthly"} onValueChange={handleFreqTypeChange}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {isCustom && (
          <div className={fld}>
            <Label className="text-xs font-semibold">Custom Interval (days)</Label>
            <Input type="number" min={1} className="h-8" value={form.frequencyDays ?? 30}
              onChange={e => set("frequencyDays")(Number(e.target.value))} data-testid="input-pm-freq-days" />
          </div>
        )}
        <div className={fld}>
          <Label className="text-xs font-semibold">Maintenance Strategy</Label>
          <Select value={form.maintenanceType ?? "preventive"} onValueChange={set("maintenanceType")}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{MAINTENANCE_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Estimated Duration (hours)</Label>
          <Input className="h-8" value={form.estimatedDurationHours ?? ""} onChange={e => set("estimatedDurationHours")(e.target.value)} placeholder="e.g. 2.5" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs font-semibold">PM Procedure / Checklist</Label>
          <Textarea className="resize-none" rows={3} value={form.procedureNotes ?? ""}
            onChange={e => set("procedureNotes")(e.target.value)}
            placeholder="Describe PM procedure steps, checklist items, safety requirements (LOTO, PPE)…"
            data-testid="input-pm-procedure" />
        </div>
      </div>

      {/* ── Asset Info ── */}
      <SectionLabel icon={FileText} label="Asset Information" />
      <div className={row2}>
        <div className={fld}>
          <Label className="text-xs font-semibold">Install Date</Label>
          <Input type="date" className="h-8" value={form.installDate ?? ""} onChange={e => set("installDate")(e.target.value)} />
        </div>
        <div className={fld}>
          <Label className="text-xs font-semibold">Warranty Expiry</Label>
          <Input type="date" className="h-8" value={form.warrantyExpiry ?? ""} onChange={e => set("warrantyExpiry")(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs font-semibold">Maintenance Contractor / External Service Provider</Label>
          <Input className="h-8" value={form.maintenanceContractor ?? ""} onChange={e => set("maintenanceContractor")(e.target.value)} placeholder="e.g. ABC Industrial Services, Inc." />
        </div>
      </div>

      {/* ── IATF 16949 §8.5.1.1 ── */}
      <SectionLabel icon={Factory} label="IATF 16949 §8.5.1.1" sub="Total Productive Maintenance" />
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/20">
          <Checkbox id="isKeyProd" checked={!!form.isKeyProductionEquipment}
            onCheckedChange={v => set("isKeyProductionEquipment")(!!v)} />
          <label htmlFor="isKeyProd" className="text-sm font-semibold cursor-pointer">
            Key Production Equipment (KPE)
            <span className="block text-xs font-normal text-muted-foreground">
              IATF §8.5.1.1 — List of key process equipment; TPM planning required
            </span>
          </label>
        </div>
        <div className={row2}>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-semibold">Breakdown Impact on Production / Quality</Label>
            <Textarea className="resize-none" rows={2} value={form.breakdownImpact ?? ""}
              onChange={e => set("breakdownImpact")(e.target.value)}
              placeholder="What happens if this equipment fails? Impact on output, quality, safety, delivery…" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-semibold">Contingency Plan / Backup Process</Label>
            <Textarea className="resize-none" rows={2} value={form.contingencyPlan ?? ""}
              onChange={e => set("contingencyPlan")(e.target.value)}
              placeholder="Backup equipment, alternative process, supplier escalation, emergency response…" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-semibold">Spare Parts Inventory (IATF §8.5.1.1)</Label>
            <Textarea className="resize-none" rows={2} value={form.sparePartsInventory ?? ""}
              onChange={e => set("sparePartsInventory")(e.target.value)}
              placeholder="List critical spare parts kept on-hand (part numbers, quantities, storage location)…" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">OEE Target (%)</Label>
            <Input className="h-8" value={form.oeeTarget ?? ""} onChange={e => set("oeeTarget")(e.target.value)} placeholder="e.g. 85%" />
          </div>
        </div>
      </div>

      {/* ── AS9100D ── */}
      <SectionLabel icon={Shield} label="AS9100D" sub="Foreign Object Damage" />
      <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/20">
        <Checkbox id="fodRisk" checked={!!form.fodRisk}
          onCheckedChange={v => set("fodRisk")(!!v)} />
        <label htmlFor="fodRisk" className="text-sm font-semibold cursor-pointer">
          Foreign Object Damage (FOD) Risk
          <span className="block text-xs font-normal text-muted-foreground">
            AS9100D — This equipment poses an FOD risk during maintenance
          </span>
        </label>
      </div>

      {/* ── ISO 13485 §6.3 ── */}
      <SectionLabel icon={FlaskConical} label="ISO 13485 §6.3" sub="Equipment Validation" />
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/20">
          <Checkbox id="validationReq" checked={!!form.validationRequired}
            onCheckedChange={v => set("validationRequired")(!!v)} />
          <label htmlFor="validationReq" className="text-sm font-semibold cursor-pointer">
            Validation Required (§6.3)
            <span className="block text-xs font-normal text-muted-foreground">
              Equipment used in manufacturing / quality requires validation per ISO 13485 §6.3
            </span>
          </label>
        </div>
        {form.validationRequired && (
          <div className={row2}>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Validation Status</Label>
              <Select value={form.validationStatus ?? ""} onValueChange={set("validationStatus")}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select status…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="not_validated">Not Yet Validated</SelectItem>
                  <SelectItem value="overdue">Validation Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Last Validation Date</Label>
              <Input type="date" className="h-8" value={form.validationDate ?? ""} onChange={e => set("validationDate")(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      <SectionLabel label="Additional Notes" />
      <Textarea className="resize-none" rows={2} value={form.notes ?? ""}
        onChange={e => set("notes")(e.target.value)} placeholder="Any other relevant notes…" />

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-save-pm-equip">
          {initial?.id ? "Update Equipment" : "Add Equipment"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── PM Record Form ───────────────────────────────────────────────────────────

const EMPTY_REC: Partial<PmRecord> = {
  pmDate: new Date().toISOString().slice(0, 10),
  result: "completed", performedBy: "", laborHours: "", downtimeHours: "",
  workOrderNumber: "", technicianCertification: "", partsReplaced: "", sparesCost: "",
  findings: "", rootCause: "", correctiveAction: "", notes: "",
  safetyCheckPassed: false, fodCheckCompleted: false, equipmentValidatedPostPm: false,
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
  const set = <K extends keyof PmRecord>(k: K) => (v: PmRecord[K]) => setForm(f => ({ ...f, [k]: v }));
  const row2 = "grid grid-cols-2 gap-3";

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
    onSave({ ...form, equipmentId: selectedEquipId, isoProjectId });
  }

  return (
    <div className="space-y-4">
      {/* Equipment selector */}
      {!equipment && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Equipment *</Label>
          <Select value={selectedEquipId ? String(selectedEquipId) : ""} onValueChange={v => handleEquipChange(Number(v))}>
            <SelectTrigger className="h-9" data-testid="select-pm-equip">
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
      )}

      {selectedEquip && (
        <div className="bg-muted/40 rounded-lg p-3 text-sm flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs font-bold bg-background border border-border px-1.5 py-0.5 rounded">{selectedEquip.equipmentId}</span>
          <span className="font-semibold">{selectedEquip.name}</span>
          {selectedEquip.location && <span className="text-muted-foreground text-xs">· {selectedEquip.location}</span>}
          <span className="text-muted-foreground text-xs">· {freqLabel(selectedEquip)} PM</span>
          {selectedEquip.estimatedDurationHours && <span className="text-muted-foreground text-xs">· Est. {selectedEquip.estimatedDurationHours}h</span>}
          {selectedEquip.isKeyProductionEquipment && (
            <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">KPE</Badge>
          )}
        </div>
      )}

      {selectedEquip?.procedureNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1">
            <ClipboardList className="w-3.5 h-3.5" /> PM Procedure / Checklist
          </p>
          <p className="whitespace-pre-line leading-relaxed">{selectedEquip.procedureNotes}</p>
        </div>
      )}

      {/* Core */}
      <SectionLabel icon={Calendar} label="PM Record" />
      <div className={row2}>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">PM Date *</Label>
          <Input type="date" className="h-8" value={form.pmDate ?? ""} onChange={e => handleDateChange(e.target.value)} data-testid="input-pm-date" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Next Due Date</Label>
          <Input type="date" className="h-8" value={form.nextDueDate ?? ""} onChange={e => set("nextDueDate")(e.target.value)} data-testid="input-pm-next-due" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Result</Label>
          <Select value={form.result ?? "completed"} onValueChange={set("result")}>
            <SelectTrigger className="h-8" data-testid="select-pm-result"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Work Order Number</Label>
          <Input className="h-8" value={form.workOrderNumber ?? ""} onChange={e => set("workOrderNumber")(e.target.value)} placeholder="e.g. WO-2025-0142" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Performed By</Label>
          <Input className="h-8" value={form.performedBy ?? ""} onChange={e => set("performedBy")(e.target.value)} placeholder="Technician name" data-testid="input-pm-performed-by" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Certification / Trade Credentials</Label>
          <Input className="h-8" value={form.technicianCertification ?? ""} onChange={e => set("technicianCertification")(e.target.value)} placeholder="e.g. HVAC Licensed, EPA 608" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Labor Hours</Label>
          <Input className="h-8" value={form.laborHours ?? ""} onChange={e => set("laborHours")(e.target.value)} placeholder="e.g. 2.5" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Downtime Hours (lost production)</Label>
          <Input className="h-8" value={form.downtimeHours ?? ""} onChange={e => set("downtimeHours")(e.target.value)} placeholder="e.g. 1.0" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Parts Replaced</Label>
          <Input className="h-8" value={form.partsReplaced ?? ""} onChange={e => set("partsReplaced")(e.target.value)} placeholder="e.g. Oil filter, drive belt" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Spares Cost ($)</Label>
          <Input className="h-8" value={form.sparesCost ?? ""} onChange={e => set("sparesCost")(e.target.value)} placeholder="e.g. 245.00" />
        </div>
      </div>

      {/* Findings */}
      <SectionLabel icon={ClipboardList} label="Findings & Corrective Action" />
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Findings / Observations</Label>
          <Textarea className="resize-none" rows={2} value={form.findings ?? ""}
            onChange={e => set("findings")(e.target.value)}
            placeholder="Describe condition of equipment, measurements taken, anomalies observed…"
            data-testid="input-pm-findings" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Root Cause (if defects/failures found)</Label>
          <Textarea className="resize-none" rows={2} value={form.rootCause ?? ""}
            onChange={e => set("rootCause")(e.target.value)}
            placeholder="Root cause of any defect or issue identified during PM…" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Corrective Action Required</Label>
          <Textarea className="resize-none" rows={2} value={form.correctiveAction ?? ""}
            onChange={e => set("correctiveAction")(e.target.value)}
            placeholder="Follow-up work orders, repairs to schedule, CAPA to raise…" />
        </div>
      </div>

      {/* Compliance checks */}
      <SectionLabel icon={Shield} label="Compliance Checks" />
      <div className="space-y-2">
        {[
          { id: "safetyCheck", field: "safetyCheckPassed" as const, label: "Safety Check / LOTO Completed Before Work", sub: "Lockout/Tagout and all safety procedures confirmed prior to maintenance" },
          { id: "fodCheck",    field: "fodCheckCompleted" as const,  label: "FOD Check Completed After PM (AS9100D)", sub: "Foreign Object Damage inspection completed — no tools or materials left inside equipment" },
          { id: "postPmVal",  field: "equipmentValidatedPostPm" as const, label: "Equipment Validated After PM (ISO 13485 §6.3)", sub: "Post-maintenance validation/qualification confirmed before returning equipment to production" },
        ].map(({ id, field, label, sub }) => (
          <div key={id} className="flex items-center gap-2 p-2.5 border border-border rounded-lg bg-muted/10">
            <Checkbox id={id} checked={!!form[field]} onCheckedChange={v => set(field)(!!v)} />
            <label htmlFor={id} className="text-sm font-medium cursor-pointer leading-snug">
              {label}
              <span className="block text-xs font-normal text-muted-foreground">{sub}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Additional Notes</Label>
        <Textarea className="resize-none" rows={2} value={form.notes ?? ""} onChange={e => set("notes")(e.target.value)} />
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-save-pm-record">
          Save PM Record
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
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
  return (
    <div className="space-y-4 text-sm">
      {/* Result banner */}
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
            <p className="font-medium text-sm">{v}</p>
          </div>
        ))}
      </div>

      {record.findings && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Findings / Observations</p>
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
          <p className="whitespace-pre-line text-amber-900">{record.correctiveAction}</p>
        </div>
      )}

      {/* Compliance checks */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Safety / LOTO", value: record.safetyCheckPassed },
          { label: "FOD Check", value: record.fodCheckCompleted },
          { label: "Post-PM Validation", value: record.equipmentValidatedPostPm },
        ].map(({ label, value }) => (
          <div key={label} className={`rounded-lg border p-2 text-center text-xs ${value === true ? "bg-emerald-50 border-emerald-200 text-emerald-700" : value === false ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
            {value === true ? <CheckCircle2 className="w-4 h-4 mx-auto mb-0.5" /> : <XCircle className="w-4 h-4 mx-auto mb-0.5 opacity-40" />}
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
  const days = daysDiff(equipment.nextDueDate);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">

          {/* Breadcrumb / Back */}
          <div className="flex items-center gap-2 text-sm">
            <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Equipment Register
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{equipment.equipmentId} — {equipment.name}</span>
          </div>

          {/* Equipment header */}
          <div className="border border-border rounded-xl p-5 space-y-4 bg-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-sm font-bold bg-muted border border-border px-2 py-0.5 rounded">{equipment.equipmentId}</span>
                  <Badge className={`text-[10px] ${crit.color}`}>{crit.label} Criticality</Badge>
                  {equipment.isKeyProductionEquipment && (
                    <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">IATF Key Production Equipment</Badge>
                  )}
                  {equipment.fodRisk && (
                    <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">AS9100D FOD Risk</Badge>
                  )}
                  {equipment.validationRequired && (
                    <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">ISO 13485 Validation Req.</Badge>
                  )}
                </div>
                <h2 className="text-xl font-black">{equipment.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[equipment.type, equipment.manufacturer, equipment.model].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DueBadge nextDueDate={equipment.nextDueDate} size="sm" />
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={onLogPm} data-testid="button-detail-log-pm">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Log PM
                </Button>
                <Button size="sm" variant="outline" onClick={onEdit} data-testid="button-detail-edit-equip">
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>
            </div>

            {/* Equipment details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2.5 text-sm border-t border-border pt-4">
              {[
                ["Serial Number",    equipment.serialNumber],
                ["Location",         equipment.location],
                ["Department",       equipment.department],
                ["Responsible",      equipment.responsiblePerson],
                ["Contact",          equipment.responsibleEmail],
                ["PM Frequency",     freqLabel(equipment)],
                ["Maintenance Type", MAINTENANCE_TYPE_OPTIONS.find(o => o.value === equipment.maintenanceType)?.label ?? equipment.maintenanceType],
                ["Est. Duration",    equipment.estimatedDurationHours ? `${equipment.estimatedDurationHours}h` : null],
                ["Install Date",     equipment.installDate],
                ["Warranty Expiry",  equipment.warrantyExpiry],
                ["Contractor",       equipment.maintenanceContractor],
                ["OEE Target",       equipment.oeeTarget],
                ["Last PM Date",     equipment.lastPmDate],
                ["Next Due Date",    equipment.nextDueDate],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </div>

            {/* IATF, AS9100D, ISO 13485 banners */}
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

            {equipment.notes && (
              <p className="text-xs text-muted-foreground border-t border-border pt-3">{equipment.notes}</p>
            )}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total PMs",        value: eqRecords.length,                 color: "text-foreground" },
              { label: "Completion Rate",  value: `${completionRate}%`,              color: completionRate >= 90 ? "text-emerald-700" : completionRate >= 70 ? "text-amber-700" : "text-red-700" },
              { label: "Total Labor (h)",  value: totalLabor.toFixed(1),            color: "text-foreground" },
              { label: "Total Downtime (h)", value: totalDowntime.toFixed(1),       color: totalDowntime > 0 ? "text-red-700" : "text-slate-400" },
              { label: "Spares Spend",     value: totalCost > 0 ? `$${totalCost.toFixed(0)}` : "—", color: "text-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border border-border p-3 bg-card">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mb-0.5">{label}</p>
                <p className={`text-xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* PM History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-accent" />
                PM History ({eqRecords.length} records)
              </h3>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onLogPm}>
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
                return (
                  <div key={r.id}
                    className="border border-border rounded-lg p-3.5 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setViewRecord(r)}
                    data-testid={`row-pm-history-${r.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{r.pmDate}</span>
                          <Badge className={`text-[10px] ${rm.color}`}>{rm.label}</Badge>
                          {r.workOrderNumber && <span className="text-xs text-muted-foreground font-mono">{r.workOrderNumber}</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {r.performedBy && <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.performedBy}</span>}
                          {r.laborHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.laborHours}h labor</span>}
                          {r.downtimeHours && parseFloat(r.downtimeHours) > 0 && (
                            <span className="flex items-center gap-1 text-red-600"><TrendingDown className="w-3 h-3" />{r.downtimeHours}h downtime</span>
                          )}
                          {r.partsReplaced && <span className="flex items-center gap-1"><Settings className="w-3 h-3" />{r.partsReplaced}</span>}
                          {r.nextDueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Next: {r.nextDueDate}</span>}
                        </div>
                        {r.findings && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.findings}</p>}
                        {r.correctiveAction && (
                          <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> {r.correctiveAction}
                          </p>
                        )}
                        {/* Compliance check icons */}
                        <div className="flex items-center gap-2 mt-1.5">
                          {r.safetyCheckPassed && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">LOTO ✓</span>}
                          {r.fodCheckCompleted  && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">FOD ✓</span>}
                          {r.equipmentValidatedPostPm && <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">Validated ✓</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); onRecordEdit(r); }}
                          data-testid={`button-edit-history-${r.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                          onClick={e => { e.stopPropagation(); onRecordDelete(r); }}
                          data-testid={`button-delete-history-${r.id}`}>
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

      {/* Record detail dialog */}
      <Dialog open={!!viewRecord} onOpenChange={v => { if (!v) setViewRecord(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PM Record Detail</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <RecordDetail
              record={viewRecord}
              equipment={equipment}
              onEdit={() => { onRecordEdit(viewRecord); setViewRecord(null); }}
              onDelete={() => { onRecordDelete(viewRecord); setViewRecord(null); }}
              onClose={() => setViewRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
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

  // Dialogs
  const [equipDialog, setEquipDialog] = useState(false);
  const [editEquip, setEditEquip]     = useState<PmEquipment | null>(null);
  const [logDialog, setLogDialog]     = useState(false);
  const [logForEquip, setLogForEquip] = useState<PmEquipment | null>(null);
  const [editRecord, setEditRecord]   = useState<PmRecord | null>(null);

  // Equipment detail drill-in
  const [detailEquipId, setDetailEquipId] = useState<number | null>(null);

  // PM Log filter
  const [filterEquipId, setFilterEquipId] = useState<number | null>(null);

  const projectId = project?.id ?? null;
  const qk = (path: string) => [path, projectId];

  const { data: equipment = [] } = useQuery<PmEquipment[]>({
    queryKey: qk("/api/pm/equipment"),
    queryFn: async () => {
      const url = projectId ? `/api/pm/equipment?projectId=${projectId}` : "/api/pm/equipment";
      const r = await fetch(url, { credentials: "include" });
      return r.json();
    },
  });

  const { data: records = [] } = useQuery<PmRecord[]>({
    queryKey: qk("/api/pm/records"),
    queryFn: async () => {
      const url = projectId ? `/api/pm/records?projectId=${projectId}` : "/api/pm/records";
      const r = await fetch(url, { credentials: "include" });
      return r.json();
    },
  });

  const saveEquip = useMutation({
    mutationFn: (d: Partial<PmEquipment>) =>
      editEquip
        ? apiRequest("PATCH", `/api/pm/equipment/${editEquip.id}`, d)
        : apiRequest("POST",  "/api/pm/equipment", d),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk("/api/pm/records") });
      toast({ title: "PM record deleted" });
    },
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const active   = equipment.filter(e => e.status === "active");
  const overdue  = active.filter(e => { const d = daysDiff(e.nextDueDate); return d !== null && d < 0; });
  const dueSoon  = active.filter(e => { const d = daysDiff(e.nextDueDate); return d !== null && d >= 0 && d <= 30; });
  const current  = active.filter(e => { const d = daysDiff(e.nextDueDate); return d === null || d > 30; });
  const keyEquip = active.filter(e => e.isKeyProductionEquipment);

  const detailEquipment = equipment.find(e => e.id === detailEquipId) ?? null;
  const filteredRecords = filterEquipId ? records.filter(r => r.equipmentId === filterEquipId) : records;
  const equipById = (id: number) => equipment.find(e => e.id === id);
  const recordsForEquip = (id: number) => records.filter(r => r.equipmentId === id);

  function openLogPm(eq: PmEquipment | null) {
    setLogForEquip(eq); setEditRecord(null); setLogDialog(true);
  }

  // ── Equipment detail view ──────────────────────────────────────────────────
  if (detailEquipId !== null && detailEquipment) {
    return (
      <>
        <EquipmentDetailView
          equipment={detailEquipment}
          records={records}
          allEquipment={equipment}
          isoProjectId={projectId}
          onBack={() => setDetailEquipId(null)}
          onEdit={() => { setEditEquip(detailEquipment); setEquipDialog(true); }}
          onLogPm={() => openLogPm(detailEquipment)}
          onRecordEdit={r => { setEditRecord(r); setLogForEquip(detailEquipment); setLogDialog(true); }}
          onRecordDelete={r => { if (confirm("Delete this PM record?")) deleteRecord.mutate(r.id); }}
        />

        {/* Equipment form dialog */}
        <Dialog open={equipDialog} onOpenChange={v => { setEquipDialog(v); if (!v) setEditEquip(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
            <EquipmentForm initial={editEquip ?? EMPTY_EQ} isoProjectId={projectId}
              onSave={d => saveEquip.mutate(d)} onCancel={() => { setEquipDialog(false); setEditEquip(null); }} />
          </DialogContent>
        </Dialog>

        {/* PM Record dialog */}
        <Dialog open={logDialog} onOpenChange={v => { setLogDialog(v); if (!v) { setLogForEquip(null); setEditRecord(null); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editRecord ? "Edit PM Record" : "Log PM Record"}</DialogTitle></DialogHeader>
            <RecordForm equipment={logForEquip} allEquipment={equipment} isoProjectId={projectId}
              initial={editRecord ?? undefined}
              onSave={d => saveRecord.mutate(d)}
              onCancel={() => { setLogDialog(false); setLogForEquip(null); setEditRecord(null); }} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Main register / log view ───────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <Wrench className="w-5 h-5 text-accent" /> Preventive Maintenance
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                ISO 9001 §6.3 · IATF 16949 §8.5.1.1 TPM · AS9100D FOD · ISO 13485 §6.3
              </p>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => { setEditEquip(null); setEquipDialog(true); }}
              data-testid="button-add-pm-equip">
              <Plus className="w-4 h-4 mr-1" /> Add Equipment
            </Button>
          </div>

          {/* Summary dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Active Equipment", value: active.length,   color: "text-foreground",   icon: Settings },
              { label: "Overdue",          value: overdue.length,  color: overdue.length > 0  ? "text-red-700"     : "text-slate-400",  icon: XCircle    },
              { label: "Due ≤ 30 Days",    value: dueSoon.length,  color: dueSoon.length > 0  ? "text-amber-700"   : "text-slate-400",  icon: Clock      },
              { label: "On Track",         value: current.length,  color: current.length > 0  ? "text-emerald-700" : "text-slate-400",  icon: CheckCircle2 },
              { label: "Key Prod. Equip.", value: keyEquip.length, color: keyEquip.length > 0 ? "text-red-700"     : "text-slate-400",  icon: Factory    },
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
              { id: "log"      as PmTab, label: "PM Log",             icon: ClipboardList },
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

                        {/* Click area → equipment detail */}
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
                          <Button size="sm" className="h-8 text-xs bg-accent hover:bg-accent/90 text-white"
                            onClick={() => openLogPm(eq)}
                            data-testid={`button-log-pm-${eq.id}`}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Log PM
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                            onClick={() => { setEditEquip(eq); setEquipDialog(true); }}
                            data-testid={`button-edit-pm-equip-${eq.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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

          {/* ── PM Log ── */}
          {tab === "log" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Filter:</Label>
                  <Select value={filterEquipId ? String(filterEquipId) : "__all__"}
                    onValueChange={v => setFilterEquipId(v === "__all__" ? null : Number(v))}>
                    <SelectTrigger className="h-8 w-[230px]" data-testid="select-pm-log-filter"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Equipment ({records.length} records)</SelectItem>
                      {equipment.map(e => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.equipmentId} — {e.name} ({recordsForEquip(e.id).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-accent hover:bg-accent/90 text-white h-8 text-sm"
                  onClick={() => openLogPm(null)}
                  data-testid="button-log-pm-generic">
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
                return (
                  <div key={r.id}
                    className="border border-border rounded-lg p-3.5 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => { if (eq) { setDetailEquipId(eq.id); } }}
                    data-testid={`row-pm-log-${r.id}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {eq && <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{eq.equipmentId}</span>}
                          <span className="font-semibold text-sm">{eq?.name ?? `Equipment #${r.equipmentId}`}</span>
                          <Badge className={`text-[10px] ${rm.color}`}>{rm.label}</Badge>
                          {r.workOrderNumber && <span className="text-xs font-mono text-muted-foreground">{r.workOrderNumber}</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.pmDate}</span>
                          {r.performedBy && <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.performedBy}</span>}
                          {r.laborHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.laborHours}h</span>}
                          {r.downtimeHours && parseFloat(r.downtimeHours) > 0 && (
                            <span className="flex items-center gap-1 text-red-600"><TrendingDown className="w-3 h-3" />{r.downtimeHours}h downtime</span>
                          )}
                          {r.nextDueDate && <span>Next: {r.nextDueDate}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {r.safetyCheckPassed && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">LOTO ✓</span>}
                          {r.fodCheckCompleted  && <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">FOD ✓</span>}
                          {r.equipmentValidatedPostPm && <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">Validated ✓</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); setEditRecord(r); setLogForEquip(eq ?? null); setLogDialog(true); }}
                          data-testid={`button-edit-pm-record-${r.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
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

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={equipDialog} onOpenChange={v => { setEquipDialog(v); if (!v) setEditEquip(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEquip ? "Edit Equipment" : "Add Maintenance Equipment"}</DialogTitle>
          </DialogHeader>
          <EquipmentForm
            initial={editEquip ?? EMPTY_EQ}
            isoProjectId={projectId}
            onSave={d => saveEquip.mutate(d)}
            onCancel={() => { setEquipDialog(false); setEditEquip(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Log/Edit PM Record Dialog */}
      <Dialog open={logDialog} onOpenChange={v => { setLogDialog(v); if (!v) { setLogForEquip(null); setEditRecord(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit PM Record" : "Log PM Record"}</DialogTitle>
          </DialogHeader>
          <RecordForm
            equipment={logForEquip}
            allEquipment={equipment}
            isoProjectId={projectId}
            initial={editRecord ?? undefined}
            onSave={d => saveRecord.mutate(d)}
            onCancel={() => { setLogDialog(false); setLogForEquip(null); setEditRecord(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
