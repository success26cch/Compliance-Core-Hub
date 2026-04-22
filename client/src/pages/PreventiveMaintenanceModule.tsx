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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Wrench, Plus, Pencil, Trash2, AlertTriangle, Calendar,
  CheckCircle2, Clock, ClipboardList, Activity, User,
  MapPin, ChevronDown, ChevronUp, Info, XCircle, Settings,
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
  status?: string | null; notes?: string | null; createdAt?: string | null;
}

interface PmRecord {
  id: number; userId: string; isoProjectId?: number | null;
  equipmentId: number; pmDate: string; performedBy?: string | null;
  result?: string | null; laborHours?: string | null;
  partsReplaced?: string | null; findings?: string | null;
  correctiveAction?: string | null; nextDueDate?: string | null;
  attachmentUrl?: string | null; notes?: string | null; createdAt?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { value: string; label: string; days: number }[] = [
  { value: "daily",        label: "Daily",        days: 1   },
  { value: "weekly",       label: "Weekly",       days: 7   },
  { value: "monthly",      label: "Monthly",      days: 30  },
  { value: "quarterly",    label: "Quarterly",    days: 90  },
  { value: "semi_annual",  label: "Semi-Annual",  days: 180 },
  { value: "annual",       label: "Annual",       days: 365 },
  { value: "custom",       label: "Custom",       days: 0   },
];

const EQUIPMENT_TYPES = [
  "HVAC / Air Handler", "Compressor", "Conveyor Belt", "Pump", "Motor / Drive",
  "Generator", "Boiler / Heater", "Chiller / Refrigeration", "Press / Stamping",
  "CNC Machine", "Robot / Automation", "Crane / Hoist", "Forklift / Lift Truck",
  "Extruder", "Mixer / Agitator", "Filter System", "Tank / Vessel",
  "Electrical Panel / Switchgear", "Fire Suppression System", "Lubrication System",
  "Vacuum System", "Hydraulic System", "Pneumatic System", "Welding Equipment",
  "Packaging Machine", "Printing / Marking Machine", "Dust Collector",
  "Air Compressor", "Water Treatment System", "Other",
];

const RESULT_META: Record<string, { label: string; color: string }> = {
  completed:        { label: "Completed",        color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  incomplete:       { label: "Incomplete",       color: "bg-amber-100 text-amber-700 border-amber-200"   },
  needs_attention:  { label: "Needs Attention",  color: "bg-red-100 text-red-700 border-red-200"          },
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

// ─── Equipment Form ───────────────────────────────────────────────────────────

const EMPTY_EQ: Partial<PmEquipment> = {
  equipmentId: "", name: "", type: "", manufacturer: "", model: "", serialNumber: "",
  location: "", department: "", responsiblePerson: "", responsibleEmail: "",
  frequencyType: "monthly", frequencyDays: 30,
  estimatedDurationHours: "", procedureNotes: "", status: "active", notes: "",
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
      ...f,
      frequencyType: v,
      frequencyDays: v === "custom" ? (f.frequencyDays ?? 30) : (opt?.days ?? 30),
    }));
  }

  function handleSubmit() {
    if (!form.equipmentId?.trim()) {
      toast({ title: "Equipment ID is required", variant: "destructive" }); return;
    }
    if (!form.name?.trim()) {
      toast({ title: "Equipment name is required", variant: "destructive" }); return;
    }
    onSave({ ...form, isoProjectId });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold">Equipment ID *</Label>
          <Input className="mt-1 h-8" value={form.equipmentId ?? ""}
            onChange={e => set("equipmentId")(e.target.value)}
            placeholder="e.g. PM-001" data-testid="input-pm-equip-id" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Equipment Name *</Label>
          <Input className="mt-1 h-8" value={form.name ?? ""}
            onChange={e => set("name")(e.target.value)}
            placeholder="e.g. Air Compressor #1" data-testid="input-pm-equip-name" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Type</Label>
          <Select value={form.type ?? ""} onValueChange={set("type")}>
            <SelectTrigger className="mt-1 h-8"><SelectValue placeholder="Select type…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Not specified —</SelectItem>
              {EQUIPMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Manufacturer</Label>
          <Input className="mt-1 h-8" value={form.manufacturer ?? ""}
            onChange={e => set("manufacturer")(e.target.value)} placeholder="e.g. Ingersoll Rand" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Model</Label>
          <Input className="mt-1 h-8" value={form.model ?? ""}
            onChange={e => set("model")(e.target.value)} placeholder="e.g. SS5L5" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Serial Number</Label>
          <Input className="mt-1 h-8" value={form.serialNumber ?? ""}
            onChange={e => set("serialNumber")(e.target.value)} placeholder="e.g. SN-2024-001" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Location</Label>
          <Input className="mt-1 h-8" value={form.location ?? ""}
            onChange={e => set("location")(e.target.value)} placeholder="e.g. Bldg 2, Room 104" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Department</Label>
          <Input className="mt-1 h-8" value={form.department ?? ""}
            onChange={e => set("department")(e.target.value)} placeholder="e.g. Production" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Responsible Person</Label>
          <Input className="mt-1 h-8" value={form.responsiblePerson ?? ""}
            onChange={e => set("responsiblePerson")(e.target.value)} placeholder="e.g. John Doe" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Responsible Email</Label>
          <Input className="mt-1 h-8" value={form.responsibleEmail ?? ""}
            onChange={e => set("responsibleEmail")(e.target.value)} placeholder="john@company.com" />
        </div>

        {/* Frequency */}
        <div>
          <Label className="text-sm font-semibold">PM Frequency</Label>
          <Select value={form.frequencyType ?? "monthly"} onValueChange={handleFreqTypeChange}>
            <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isCustom && (
          <div>
            <Label className="text-sm font-semibold">Custom Interval (days)</Label>
            <Input type="number" min={1} className="mt-1 h-8"
              value={form.frequencyDays ?? 30}
              onChange={e => set("frequencyDays")(Number(e.target.value))}
              data-testid="input-pm-freq-days" />
          </div>
        )}
        <div>
          <Label className="text-sm font-semibold">Est. Duration (hours)</Label>
          <Input className="mt-1 h-8" value={form.estimatedDurationHours ?? ""}
            onChange={e => set("estimatedDurationHours")(e.target.value)}
            placeholder="e.g. 2.5" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Status</Label>
          <Select value={form.status ?? "active"} onValueChange={set("status")}>
            <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold">PM Procedure / Checklist Notes</Label>
          <Textarea className="mt-1 resize-none" rows={3}
            value={form.procedureNotes ?? ""}
            onChange={e => set("procedureNotes")(e.target.value)}
            placeholder="Describe the PM procedure steps, checklist items, safety precautions…"
            data-testid="input-pm-procedure" />
        </div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold">General Notes</Label>
          <Textarea className="mt-1 resize-none" rows={2}
            value={form.notes ?? ""}
            onChange={e => set("notes")(e.target.value)}
            placeholder="Any additional notes about this equipment…" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit}
          className="bg-accent hover:bg-accent/90 text-white" data-testid="button-save-pm-equip">
          {initial?.id ? "Update Equipment" : "Add Equipment"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Record Form ──────────────────────────────────────────────────────────────

const EMPTY_REC: Partial<PmRecord> = {
  pmDate: new Date().toISOString().slice(0, 10),
  result: "completed",
  performedBy: "", laborHours: "", partsReplaced: "",
  findings: "", correctiveAction: "", notes: "",
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

  const selectedEquip = allEquipment.find(e => e.id === selectedEquipId) ?? null;
  const set = <K extends keyof PmRecord>(k: K) => (v: PmRecord[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  function handleDateChange(date: string) {
    const days = selectedEquip ? freqDays(selectedEquip) : 30;
    setForm(f => ({
      ...f,
      pmDate: date,
      nextDueDate: date ? calcNextDue(date, days) : f.nextDueDate,
    }));
  }

  function handleEquipChange(id: number) {
    setSelectedEquipId(id);
    const eq = allEquipment.find(e => e.id === id);
    if (eq && form.pmDate) {
      setForm(f => ({
        ...f,
        equipmentId: id,
        nextDueDate: calcNextDue(f.pmDate ?? new Date().toISOString().slice(0, 10), freqDays(eq)),
      }));
    } else {
      setForm(f => ({ ...f, equipmentId: id }));
    }
  }

  function handleSubmit() {
    if (!selectedEquipId) {
      toast({ title: "Please select equipment", variant: "destructive" }); return;
    }
    if (!form.pmDate) {
      toast({ title: "PM date is required", variant: "destructive" }); return;
    }
    onSave({ ...form, equipmentId: selectedEquipId, isoProjectId });
  }

  return (
    <div className="space-y-4">
      {/* Equipment selector */}
      {!equipment && (
        <div>
          <Label className="text-sm font-semibold">Equipment *</Label>
          <Select
            value={selectedEquipId ? String(selectedEquipId) : ""}
            onValueChange={v => handleEquipChange(Number(v))}>
            <SelectTrigger className="mt-1 h-9" data-testid="select-pm-equip">
              <SelectValue placeholder="Select equipment…" />
            </SelectTrigger>
            <SelectContent>
              {allEquipment.filter(e => e.status === "active").map(e => (
                <SelectItem key={e.id} value={String(e.id)}>
                  <span className="font-mono text-xs mr-2 text-muted-foreground">{e.equipmentId}</span>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Equipment info summary */}
      {selectedEquip && (
        <div className="bg-muted/40 rounded-lg p-3 text-sm">
          <span className="font-bold font-mono">{selectedEquip.equipmentId}</span> — {selectedEquip.name}
          {selectedEquip.location && <span className="text-muted-foreground ml-2">· {selectedEquip.location}</span>}
          <span className="text-muted-foreground ml-2">· {freqLabel(selectedEquip)} PM</span>
          {selectedEquip.estimatedDurationHours && (
            <span className="text-muted-foreground ml-2">· Est. {selectedEquip.estimatedDurationHours}h</span>
          )}
        </div>
      )}

      {/* PM Procedure reminder */}
      {selectedEquip?.procedureNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
          <p className="font-bold uppercase tracking-wide flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> PM Procedure / Checklist
          </p>
          <p className="whitespace-pre-line leading-relaxed">{selectedEquip.procedureNotes}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold">PM Date *</Label>
          <Input type="date" className="mt-1 h-8"
            value={form.pmDate ?? ""}
            onChange={e => handleDateChange(e.target.value)}
            data-testid="input-pm-date" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Next Due Date</Label>
          <Input type="date" className="mt-1 h-8"
            value={form.nextDueDate ?? ""}
            onChange={e => set("nextDueDate")(e.target.value)}
            data-testid="input-pm-next-due" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Performed By</Label>
          <Input className="mt-1 h-8" value={form.performedBy ?? ""}
            onChange={e => set("performedBy")(e.target.value)}
            placeholder="Technician name" data-testid="input-pm-performed-by" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Result *</Label>
          <Select value={form.result ?? "completed"} onValueChange={set("result")}>
            <SelectTrigger className="mt-1 h-8" data-testid="select-pm-result"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Labor Hours</Label>
          <Input className="mt-1 h-8" value={form.laborHours ?? ""}
            onChange={e => set("laborHours")(e.target.value)}
            placeholder="e.g. 1.5" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Parts Replaced</Label>
          <Input className="mt-1 h-8" value={form.partsReplaced ?? ""}
            onChange={e => set("partsReplaced")(e.target.value)}
            placeholder="e.g. Oil filter, drive belt" />
        </div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Findings / Observations</Label>
          <Textarea className="mt-1 resize-none" rows={2}
            value={form.findings ?? ""}
            onChange={e => set("findings")(e.target.value)}
            placeholder="Describe any findings, measurements, or observations during PM…"
            data-testid="input-pm-findings" />
        </div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Corrective Action Required</Label>
          <Textarea className="mt-1 resize-none" rows={2}
            value={form.correctiveAction ?? ""}
            onChange={e => set("correctiveAction")(e.target.value)}
            placeholder="Any corrective actions needed or follow-up work orders to raise…" />
        </div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Notes</Label>
          <Textarea className="mt-1 resize-none" rows={2}
            value={form.notes ?? ""}
            onChange={e => set("notes")(e.target.value)}
            placeholder="Additional notes…" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit}
          className="bg-accent hover:bg-accent/90 text-white" data-testid="button-save-pm-record">
          Save PM Record
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Status Badge Helpers ─────────────────────────────────────────────────────

function DueBadge({ nextDueDate }: { nextDueDate?: string | null }) {
  const days = daysDiff(nextDueDate);
  if (days === null) return <Badge className="text-[10px] bg-slate-100 text-slate-500 border-slate-300">No date set</Badge>;
  if (days < 0) return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">Overdue {Math.abs(days)}d</Badge>;
  if (days <= 30) return <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">Due in {days}d</Badge>;
  return <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">Due {nextDueDate}</Badge>;
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
  const [editEquip, setEditEquip] = useState<PmEquipment | null>(null);
  const [logDialog, setLogDialog] = useState(false);
  const [logForEquip, setLogForEquip] = useState<PmEquipment | null>(null);
  const [editRecord, setEditRecord] = useState<PmRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<PmRecord | null>(null);
  const [filterEquipId, setFilterEquipId] = useState<number | null>(null);
  const [expandedEquipId, setExpandedEquipId] = useState<number | null>(null);

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
        ? apiRequest("PATCH", `/api/pm/equipment/${editEquip.id}`, { ...d, isoProjectId: projectId })
        : apiRequest("POST", "/api/pm/equipment", { ...d, isoProjectId: projectId }),
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
      toast({ title: "Equipment removed" });
    },
  });

  const saveRecord = useMutation({
    mutationFn: async (d: Partial<PmRecord>) => {
      const res = editRecord
        ? await apiRequest("PATCH", `/api/pm/records/${editRecord.id}`, { ...d, isoProjectId: projectId })
        : await apiRequest("POST", "/api/pm/records", { ...d, isoProjectId: projectId });
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

  // ── Computed stats ──────────────────────────────────────────────────────────
  const active = equipment.filter(e => e.status === "active");
  const overdue = active.filter(e => { const d = daysDiff(e.nextDueDate); return d !== null && d < 0; });
  const dueSoon = active.filter(e => { const d = daysDiff(e.nextDueDate); return d !== null && d >= 0 && d <= 30; });
  const current = active.filter(e => { const d = daysDiff(e.nextDueDate); return d === null || d > 30; });

  const filteredRecords = filterEquipId
    ? records.filter(r => r.equipmentId === filterEquipId)
    : records;

  const equipById = (id: number) => equipment.find(e => e.id === id);
  const recordsForEquip = (id: number) => records.filter(r => r.equipmentId === id);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <Wrench className="w-5 h-5 text-accent" /> Preventive Maintenance
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track equipment PM schedules, frequencies, and maintenance history
              </p>
            </div>
            <Button
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => { setEditEquip(null); setEquipDialog(true); }}
              data-testid="button-add-pm-equip">
              <Plus className="w-4 h-4 mr-1" /> Add Equipment
            </Button>
          </div>

          {/* ── Summary Banners ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Equipment", value: active.length, color: "bg-slate-50 border-slate-200", textColor: "text-slate-700", icon: Settings },
              { label: "Overdue", value: overdue.length, color: overdue.length > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200", textColor: overdue.length > 0 ? "text-red-700" : "text-slate-500", icon: XCircle },
              { label: "Due Within 30 Days", value: dueSoon.length, color: dueSoon.length > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200", textColor: dueSoon.length > 0 ? "text-amber-700" : "text-slate-500", icon: Clock },
              { label: "Current / On-Track", value: current.length, color: current.length > 0 ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200", textColor: current.length > 0 ? "text-emerald-700" : "text-slate-500", icon: CheckCircle2 },
            ].map(({ label, value, color, textColor, icon: Icon }) => (
              <div key={label} className={`rounded-lg border p-3 ${color}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">{label}</span>
                  <Icon className={`w-3.5 h-3.5 ${textColor}`} />
                </div>
                <p className={`text-2xl font-black ${textColor}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-border gap-1">
            {([
              { id: "register" as PmTab, label: "Equipment Register", icon: Settings },
              { id: "log"      as PmTab, label: "PM Log",             icon: ClipboardList },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                data-testid={`tab-pm-${id}`}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  tab === id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* ── Equipment Register Tab ── */}
          {tab === "register" && (
            <div className="space-y-3">
              {equipment.length === 0 && (
                <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
                  <Wrench className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No equipment registered yet</p>
                  <p className="text-xs mt-1">Add equipment to start tracking preventive maintenance schedules.</p>
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
                const lastRec = recs[0] ?? null;
                const expanded = expandedEquipId === eq.id;

                return (
                  <Card key={eq.id} className={`border ${isOverdue ? "border-red-200" : isDueSoon ? "border-amber-200" : "border-border"}`}>
                    <CardContent className="p-0">
                      {/* Main row */}
                      <div className="flex items-center gap-3 p-4 flex-wrap">
                        {/* Status indicator */}
                        <div className={`w-2 h-10 rounded-full shrink-0 ${isOverdue ? "bg-red-400" : isDueSoon ? "bg-amber-400" : "bg-emerald-400"}`} />

                        {/* ID + Name */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{eq.equipmentId}</span>
                            <span className="font-semibold text-sm">{eq.name}</span>
                            {eq.type && <span className="text-xs text-muted-foreground">{eq.type}</span>}
                            {eq.status !== "active" && (
                              <Badge className="text-[10px] bg-slate-100 text-slate-500 border-slate-300">
                                {eq.status === "decommissioned" ? "Decommissioned" : "Inactive"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {eq.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {eq.location}
                              </span>
                            )}
                            {eq.responsiblePerson && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> {eq.responsiblePerson}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {freqLabel(eq)}
                            </span>
                          </div>
                        </div>

                        {/* Due status */}
                        <div className="text-right shrink-0">
                          <DueBadge nextDueDate={eq.nextDueDate} />
                          {eq.lastPmDate && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">Last PM: {eq.lastPmDate}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm"
                            className="h-8 text-xs bg-accent hover:bg-accent/90 text-white"
                            onClick={() => { setLogForEquip(eq); setEditRecord(null); setLogDialog(true); }}
                            data-testid={`button-log-pm-${eq.id}`}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Log PM
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                            onClick={() => { setEditEquip(eq); setEquipDialog(true); }}
                            data-testid={`button-edit-pm-equip-${eq.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Remove "${eq.name}"? This will also delete all PM records for this equipment.`))
                                deleteEquip.mutate(eq.id);
                            }}
                            data-testid={`button-delete-pm-equip-${eq.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={() => setExpandedEquipId(expanded ? null : eq.id)}>
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expanded && (
                        <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-3 bg-muted/20">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                            {eq.manufacturer && <p><span className="font-medium text-muted-foreground">Manufacturer:</span> {eq.manufacturer}</p>}
                            {eq.model && <p><span className="font-medium text-muted-foreground">Model:</span> {eq.model}</p>}
                            {eq.serialNumber && <p><span className="font-medium text-muted-foreground">Serial:</span> {eq.serialNumber}</p>}
                            {eq.department && <p><span className="font-medium text-muted-foreground">Department:</span> {eq.department}</p>}
                            {eq.responsibleEmail && <p><span className="font-medium text-muted-foreground">Email:</span> {eq.responsibleEmail}</p>}
                            {eq.estimatedDurationHours && <p><span className="font-medium text-muted-foreground">Est. Duration:</span> {eq.estimatedDurationHours}h</p>}
                          </div>

                          {eq.procedureNotes && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-800">
                              <p className="font-bold mb-1 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> PM Procedure</p>
                              <p className="whitespace-pre-line leading-relaxed">{eq.procedureNotes}</p>
                            </div>
                          )}

                          {/* Recent PM records */}
                          {recs.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Recent PM History</p>
                              <div className="space-y-1.5">
                                {recs.slice(0, 3).map(r => {
                                  const rm = RESULT_META[r.result ?? "completed"] ?? RESULT_META.completed;
                                  return (
                                    <div key={r.id}
                                      className="flex items-center gap-3 text-xs border border-border/50 rounded p-2 bg-background hover:bg-muted/30 cursor-pointer transition-colors"
                                      onClick={() => setViewRecord(r)}
                                      data-testid={`row-pm-record-${r.id}`}>
                                      <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="font-medium">{r.pmDate}</span>
                                      <Badge className={`text-[10px] ${rm.color}`}>{rm.label}</Badge>
                                      {r.performedBy && <span className="text-muted-foreground">by {r.performedBy}</span>}
                                      {r.partsReplaced && <span className="text-muted-foreground truncate">Parts: {r.partsReplaced}</span>}
                                    </div>
                                  );
                                })}
                                {recs.length > 3 && (
                                  <button className="text-xs text-accent underline"
                                    onClick={() => { setFilterEquipId(eq.id); setTab("log"); }}>
                                    View all {recs.length} records →
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {recs.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No PM records logged yet for this equipment.</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── PM Log Tab ── */}
          {tab === "log" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label className="text-sm font-semibold">Filter by Equipment:</Label>
                  <Select
                    value={filterEquipId ? String(filterEquipId) : "__all__"}
                    onValueChange={v => setFilterEquipId(v === "__all__" ? null : Number(v))}>
                    <SelectTrigger className="h-8 w-[240px]" data-testid="select-pm-log-filter">
                      <SelectValue />
                    </SelectTrigger>
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
                <Button
                  className="bg-accent hover:bg-accent/90 text-white h-8 text-sm"
                  onClick={() => { setLogForEquip(null); setEditRecord(null); setLogDialog(true); }}
                  data-testid="button-log-pm-generic">
                  <Plus className="w-4 h-4 mr-1" /> Log PM Record
                </Button>
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No PM records yet</p>
                  <p className="text-xs mt-1">Log your first PM record to start building your maintenance history.</p>
                </div>
              )}

              {filteredRecords.map(r => {
                const eq = equipById(r.equipmentId);
                const rm = RESULT_META[r.result ?? "completed"] ?? RESULT_META.completed;
                return (
                  <div key={r.id}
                    className="border border-border rounded-lg p-3.5 flex items-start gap-4 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setViewRecord(r)}
                    data-testid={`row-pm-log-${r.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {eq && (
                          <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{eq.equipmentId}</span>
                        )}
                        <span className="font-semibold text-sm">{eq?.name ?? `Equipment #${r.equipmentId}`}</span>
                        <Badge className={`text-[10px] ${rm.color}`}>{rm.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {r.pmDate}</span>
                        {r.performedBy && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {r.performedBy}</span>}
                        {r.laborHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.laborHours}h</span>}
                        {r.partsReplaced && <span className="flex items-center gap-1"><Settings className="w-3 h-3" /> {r.partsReplaced}</span>}
                        {r.nextDueDate && <span>Next due: {r.nextDueDate}</span>}
                      </div>
                      {r.findings && <p className="text-xs text-muted-foreground mt-1 truncate">{r.findings}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                        onClick={e => { e.stopPropagation(); setEditRecord(r); setLogForEquip(eq ?? null); setLogDialog(true); }}
                        data-testid={`button-edit-pm-record-${r.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={e => { e.stopPropagation(); if (confirm("Delete this PM record?")) deleteRecord.mutate(r.id); }}
                        data-testid={`button-delete-pm-record-${r.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </ScrollArea>

      {/* ── Dialogs ── */}

      {/* Add / Edit Equipment */}
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

      {/* Log / Edit PM Record */}
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

      {/* PM Record Detail */}
      <Dialog open={!!viewRecord} onOpenChange={v => { if (!v) setViewRecord(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-accent" /> PM Record Detail
              {viewRecord && equipById(viewRecord.equipmentId) && (
                <span className="text-sm font-normal text-muted-foreground">
                  — <span className="font-mono font-bold">{equipById(viewRecord.equipmentId)!.equipmentId}</span>{" "}
                  {equipById(viewRecord.equipmentId)!.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (() => {
            const r = viewRecord;
            const eq = equipById(r.equipmentId);
            const rm = RESULT_META[r.result ?? "completed"] ?? RESULT_META.completed;
            return (
              <div className="space-y-4 text-sm">
                {/* Result banner */}
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${rm.color}`}>
                  <span className="font-black text-lg">{rm.label.toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">PM Date</p>
                    <p className="font-medium">{r.pmDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Next Due Date</p>
                    <p className="font-medium">{r.nextDueDate ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Performed By</p>
                    <p>{r.performedBy ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Labor Hours</p>
                    <p>{r.laborHours ?? "—"}</p>
                  </div>
                  {r.partsReplaced && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Parts Replaced</p>
                      <p>{r.partsReplaced}</p>
                    </div>
                  )}
                  {r.findings && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Findings / Observations</p>
                      <p className="whitespace-pre-line">{r.findings}</p>
                    </div>
                  )}
                  {r.correctiveAction && (
                    <div className="col-span-2 border border-amber-200 rounded-lg p-3 bg-amber-50/40">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Corrective Action Required
                      </p>
                      <p className="whitespace-pre-line text-amber-900">{r.correctiveAction}</p>
                    </div>
                  )}
                  {r.notes && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Notes</p>
                      <p className="whitespace-pre-line">{r.notes}</p>
                    </div>
                  )}
                </div>

                {eq && (
                  <div className="border border-border rounded-lg p-3 bg-muted/20 text-xs space-y-1">
                    <p className="font-bold text-muted-foreground uppercase tracking-wide text-[10px] mb-1">Equipment</p>
                    <p className="font-semibold">{eq.equipmentId} — {eq.name}</p>
                    {eq.location && <p className="text-muted-foreground">Location: {eq.location}</p>}
                    {eq.serialNumber && <p className="text-muted-foreground">Serial: {eq.serialNumber}</p>}
                    <p className="text-muted-foreground">Frequency: {freqLabel(eq)}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline"
                    onClick={() => { setEditRecord(r); setLogForEquip(eq ?? null); setLogDialog(true); setViewRecord(null); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => { if (confirm("Delete this PM record?")) { deleteRecord.mutate(r.id); setViewRecord(null); } }}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                  <Button size="sm" variant="outline" className="ml-auto"
                    onClick={() => setViewRecord(null)}>Close</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
