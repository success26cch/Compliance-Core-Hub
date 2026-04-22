import { useState, useEffect, useRef } from "react";
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
  Gauge, Plus, Pencil, Trash2, AlertTriangle,
  ClipboardList, ChevronDown, ChevronUp, AlertCircle, XCircle, FileCheck,
  Calendar, Activity, Info, FileUp, Download, BarChart3, MapPin, User,
} from "lucide-react";
import type { IsoProject } from "@shared/schema";

// ─── Types ─────────────────────────────────────────────────────────────────

type CalTab = "register" | "oot" | "msa";

interface WorkInstruction {
  id: number;
  title: string;
  docType: string;
  status: string;
}


interface CalibrationEquipment {
  id: number; userId: string; isoProjectId?: number | null;
  gageId: string; name: string; type?: string | null;
  manufacturer?: string | null; model?: string | null; serialNumber?: string | null;
  location?: string | null; responsiblePerson?: string | null; responsibleEmail?: string | null;
  measurementRange?: string | null; resolution?: string | null; tolerance?: string | null;
  calFrequencyMonths?: number | null; calType?: string | null; calibrationLab?: string | null;
  traceableStandard?: string | null; customerOwned?: boolean | null;
  linkedDocumentId?: number | null; status?: string | null;
  nextDueDate?: string | null; lastReminderSentAt?: string | null; notes?: string | null;
  createdAt?: string | null; updatedAt?: string | null;
}

interface CalibrationRecord {
  id: number; userId: string; isoProjectId?: number | null;
  equipmentId: number; calibrationDate: string; performedBy?: string | null;
  certNumber?: string | null; standardsReferenced?: string[] | null;
  result?: string | null; outOfTolerance?: boolean | null; adjustmentsMade?: string | null;
  certificateFileUrl?: string | null; nextDueDate?: string | null; notes?: string | null;
  // IATF §7.1.5.2.1
  softwareVerified?: boolean | null;
  // AS9100D §7.1.5.2
  measurementUncertainty?: string | null; asFoundReading?: string | null;
  asLeftReading?: string | null; environmentConditions?: string | null;
  labAccredited?: boolean | null;
  // ISO 13485 §7.6
  acceptanceCriteria?: string | null; equipmentLabelConfirmed?: boolean | null;
  createdAt?: string | null;
}

interface CalibrationOotAssessment {
  id: number; userId: string; isoProjectId?: number | null;
  calibrationRecordId: number; equipmentId: number;
  affectedProducts?: string | null; suspectDateStart?: string | null;
  suspectDateEnd?: string | null; disposition?: string | null;
  riskLevel?: string | null; containmentActions?: string | null;
  correctiveActionRef?: string | null; assessedBy?: string | null;
  assessmentDate?: string | null; notes?: string | null; createdAt?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GAGE_TYPES = [
  "Caliper (Vernier)", "Caliper (Digital)", "Micrometer (OD)", "Micrometer (ID)",
  "Height Gauge", "Dial Indicator / DTI", "Plug Gauge (Go/No-Go)", "Ring Gauge",
  "Feeler Gauge", "Torque Wrench", "Torque Tester", "CMM (Coordinate Measuring Machine)",
  "Surface Plate", "Optical Comparator", "Hardness Tester (Rockwell)", "Hardness Tester (Brinell)",
  "Thermometer / Thermocouple", "Pressure Gauge", "Flow Meter", "Load Cell / Force Gauge",
  "Multimeter / Voltmeter", "Scale / Balance", "pH Meter", "Viscosity Meter",
  "Roughness Tester", "Thread Gauge", "Radius Gauge", "Protractor / Angle Gauge", "Other",
];

const STATUS_COLORS: Record<string, string> = {
  active:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  out_of_service:   "bg-amber-50 text-amber-700 border-amber-200",
  retired:          "bg-slate-100 text-slate-500 border-slate-300",
};

const RESULT_COLORS: Record<string, string> = {
  pass:        "bg-emerald-50 text-emerald-700 border-emerald-200",
  conditional: "bg-amber-50 text-amber-700 border-amber-200",
  fail:        "bg-red-50 text-red-700 border-red-200",
};

const RISK_COLORS: Record<string, string> = {
  low:    "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high:   "bg-red-50 text-red-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function dueBadge(eq: CalibrationEquipment) {
  const days = daysUntil(eq.nextDueDate);
  if (days === null) return <Badge variant="outline" className="text-xs text-muted-foreground">No Due Date</Badge>;
  if (days < 0) return <Badge className="text-xs bg-red-100 text-red-700 border-red-200">Overdue {Math.abs(days)}d</Badge>;
  if (days <= 30) return <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Due in {days}d</Badge>;
  return <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">{eq.nextDueDate}</Badge>;
}

function calcNextDue(calDate: string, freqMonths: number): string {
  const d = new Date(calDate);
  d.setMonth(d.getMonth() + freqMonths);
  return d.toISOString().split("T")[0];
}

function isIatf(project?: IsoProject | null): boolean {
  return /iatf\s*16949/i.test(project?.standard ?? "");
}
function isAerospace(project?: IsoProject | null): boolean {
  return /as\s*9100|as\s*9110|as\s*9120/i.test(project?.standard ?? "");
}
function isMedical(project?: IsoProject | null): boolean {
  return /iso\s*13485/i.test(project?.standard ?? "");
}

// ─── Equipment Form ───────────────────────────────────────────────────────────

const EMPTY_EQ: Partial<CalibrationEquipment> = {
  gageId: "", name: "", type: "", manufacturer: "", model: "", serialNumber: "",
  location: "", responsiblePerson: "", responsibleEmail: "",
  measurementRange: "", resolution: "", tolerance: "",
  calFrequencyMonths: 12, calType: "external", calibrationLab: "",
  traceableStandard: "NIST", customerOwned: false, status: "active", notes: "",
};

function EquipmentForm({ initial, onSave, onCancel, workInstructions }: {
  initial: Partial<CalibrationEquipment>;
  onSave: (d: Partial<CalibrationEquipment>) => void;
  onCancel: () => void;
  workInstructions?: WorkInstruction[];
}) {
  const [form, setForm] = useState<Partial<CalibrationEquipment>>(initial);
  const set = (k: keyof CalibrationEquipment) => (v: string | number | boolean | null) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold">Gage ID / Tag # *</Label>
          <Input className="mt-1 h-8" value={form.gageId ?? ""} onChange={e => set("gageId")(e.target.value)}
            placeholder="e.g. G-001" data-testid="input-gage-id" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Equipment Name *</Label>
          <Input className="mt-1 h-8" value={form.name ?? ""} onChange={e => set("name")(e.target.value)}
            placeholder="e.g. Digital Caliper" data-testid="input-gage-name" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Type</Label>
          <Select value={form.type ?? ""} onValueChange={set("type")}>
            <SelectTrigger className="mt-1 h-8" data-testid="select-gage-type"><SelectValue placeholder="Select type…" /></SelectTrigger>
            <SelectContent>{GAGE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Status</Label>
          <Select value={form.status ?? "active"} onValueChange={set("status")}>
            <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="out_of_service">Out of Service</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Manufacturer</Label>
          <Input className="mt-1 h-8" value={form.manufacturer ?? ""} onChange={e => set("manufacturer")(e.target.value)} placeholder="e.g. Mitutoyo" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Model</Label>
          <Input className="mt-1 h-8" value={form.model ?? ""} onChange={e => set("model")(e.target.value)} placeholder="e.g. 500-196-30" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Serial Number</Label>
          <Input className="mt-1 h-8" value={form.serialNumber ?? ""} onChange={e => set("serialNumber")(e.target.value)} placeholder="e.g. SN-12345" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Location</Label>
          <Input className="mt-1 h-8" value={form.location ?? ""} onChange={e => set("location")(e.target.value)} placeholder="e.g. QC Lab, Line 2" />
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Measurement Specs</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-sm font-semibold">Range</Label>
            <Input className="mt-1 h-8" value={form.measurementRange ?? ""} onChange={e => set("measurementRange")(e.target.value)} placeholder="e.g. 0–6 in" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Resolution</Label>
            <Input className="mt-1 h-8" value={form.resolution ?? ""} onChange={e => set("resolution")(e.target.value)} placeholder="e.g. 0.0001 in" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Tolerance</Label>
            <Input className="mt-1 h-8" value={form.tolerance ?? ""} onChange={e => set("tolerance")(e.target.value)} placeholder="e.g. ±0.001 in" />
          </div>
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Calibration Schedule</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Frequency (months)</Label>
            <Input type="number" className="mt-1 h-8" value={form.calFrequencyMonths ?? 12}
              onChange={e => set("calFrequencyMonths")(parseInt(e.target.value) || 12)} min={1} max={120} />
          </div>
          <div>
            <Label className="text-sm font-semibold">Calibration Type</Label>
            <Select value={form.calType ?? "external"} onValueChange={set("calType")}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="external">External (Accredited Lab)</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold">Calibration Lab</Label>
            <Input className="mt-1 h-8" value={form.calibrationLab ?? ""} onChange={e => set("calibrationLab")(e.target.value)} placeholder="e.g. Trescal, TestAmerica" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Traceable Standard</Label>
            <Select value={form.traceableStandard ?? "NIST"} onValueChange={set("traceableStandard")}>
              <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NIST">NIST (USA)</SelectItem>
                <SelectItem value="SI/NPL">SI / NPL (UK)</SelectItem>
                <SelectItem value="PTB">PTB (Germany)</SelectItem>
                <SelectItem value="BIPM">BIPM (International)</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Responsible Person</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Name</Label>
            <Input className="mt-1 h-8" value={form.responsiblePerson ?? ""} onChange={e => set("responsiblePerson")(e.target.value)} placeholder="e.g. John Smith" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Email (for reminders)</Label>
            <Input type="email" className="mt-1 h-8" value={form.responsibleEmail ?? ""} onChange={e => set("responsibleEmail")(e.target.value)} placeholder="john@company.com" data-testid="input-responsible-email" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="customerOwned" checked={!!form.customerOwned}
          onChange={e => set("customerOwned")(e.target.checked)}
          className="w-4 h-4 rounded border-border accent-orange-500" />
        <Label htmlFor="customerOwned" className="text-sm cursor-pointer">Customer-owned gage (MSA requirement)</Label>
      </div>

      {workInstructions && workInstructions.length > 0 && (
        <div>
          <Label className="text-sm font-semibold">Linked Work Instruction (optional)</Label>
          <Select
            value={form.linkedDocumentId != null ? String(form.linkedDocumentId) : "none"}
            onValueChange={v => set("linkedDocumentId")(v === "none" ? null : parseInt(v))}
          >
            <SelectTrigger className="mt-1 h-8" data-testid="select-linked-wi">
              <SelectValue placeholder="Select work instruction…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {workInstructions.map(wi => (
                <SelectItem key={wi.id} value={String(wi.id)}>{wi.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground mt-1">Link a calibration work instruction from your Documentation module.</p>
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold">Notes</Label>
        <Textarea className="mt-1 resize-none" rows={2} value={form.notes ?? ""} onChange={e => set("notes")(e.target.value)} placeholder="Any additional notes…" />
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSave(form)} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-save-equipment">Save Equipment</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Log Record Form ──────────────────────────────────────────────────────────

const EMPTY_REC: Partial<CalibrationRecord & { showOot: boolean }> = {
  calibrationDate: new Date().toISOString().split("T")[0],
  performedBy: "", certNumber: "", result: "pass",
  outOfTolerance: false, adjustmentsMade: "", nextDueDate: "", notes: "", showOot: false,
  // IATF
  softwareVerified: false,
  // AS9100D
  measurementUncertainty: "", asFoundReading: "", asLeftReading: "", environmentConditions: "", labAccredited: false,
  // ISO 13485
  acceptanceCriteria: "", equipmentLabelConfirmed: false,
};

const EMPTY_OOT: Partial<CalibrationOotAssessment> = {
  affectedProducts: "", suspectDateStart: "", suspectDateEnd: "",
  disposition: "", riskLevel: "medium", containmentActions: "",
  correctiveActionRef: "", assessedBy: "", assessmentDate: new Date().toISOString().split("T")[0], notes: "",
};

function RecordForm({ equipment, isoProjectId, onSave, onCancel, isIatfProject, isAerospaceProject, isMedicalProject, initial }: {
  equipment: CalibrationEquipment;
  isoProjectId?: number | null;
  onSave: (rec: Partial<CalibrationRecord>, oot?: Partial<CalibrationOotAssessment>, certFile?: File) => void;
  onCancel: () => void;
  isIatfProject?: boolean;
  isAerospaceProject?: boolean;
  isMedicalProject?: boolean;
  initial?: Partial<CalibrationRecord>;
}) {
  const [form, setForm] = useState<Partial<CalibrationRecord & { showOot: boolean }>>({
    ...EMPTY_REC,
    equipmentId: equipment.id,
    nextDueDate: calcNextDue(EMPTY_REC.calibrationDate!, equipment.calFrequencyMonths ?? 12),
    ...initial,
  });
  const [oot, setOot] = useState<Partial<CalibrationOotAssessment>>(EMPTY_OOT);
  const [certFile, setCertFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  type RecordState = Partial<CalibrationRecord & { showOot: boolean }>;
  type OotState = Partial<CalibrationOotAssessment>;
  const set = <K extends keyof RecordState>(k: K) => (v: RecordState[K]) =>
    setForm(f => ({ ...f, [k]: v }));
  const setO = <K extends keyof OotState>(k: K) => (v: OotState[K]) =>
    setOot(f => ({ ...f, [k]: v }));

  function handleSubmit() {
    if (!form.calibrationDate) {
      toast({ title: "Calibration date is required", variant: "destructive" }); return;
    }
    if (showOot && isIatfProject) {
      if (!(oot.assessedBy ?? "").trim()) {
        toast({ title: "OOT assessment requires 'Assessed By'", description: "IATF §7.1.5.3 mandates the assessor be identified.", variant: "destructive" }); return;
      }
      if (!(oot.disposition ?? "").trim()) {
        toast({ title: "OOT assessment requires 'Disposition'", description: "IATF §7.1.5.3 requires a documented disposition decision.", variant: "destructive" }); return;
      }
    }
    onSave(form, showOot && isIatfProject ? oot : undefined, certFile ?? undefined);
  }

  const showOot = form.result === "fail" || form.outOfTolerance === true;

  function handleDateChange(d: string) {
    setForm(f => ({
      ...f, calibrationDate: d,
      nextDueDate: d ? calcNextDue(d, equipment.calFrequencyMonths ?? 12) : "",
    }));
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 rounded-lg p-3 text-sm">
        <span className="font-bold">{equipment.gageId}</span> — {equipment.name}
        {equipment.location && <span className="text-muted-foreground ml-2">· {equipment.location}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold">Calibration Date *</Label>
          <Input type="date" className="mt-1 h-8" value={form.calibrationDate ?? ""}
            onChange={e => handleDateChange(e.target.value)} data-testid="input-cal-date" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Performed By</Label>
          <Input className="mt-1 h-8" value={form.performedBy ?? ""} onChange={e => set("performedBy")(e.target.value)} placeholder="Person or Lab name" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Certificate Number</Label>
          <Input className="mt-1 h-8" value={form.certNumber ?? ""} onChange={e => set("certNumber")(e.target.value)} placeholder="e.g. CAL-2024-001" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Next Due Date</Label>
          <Input type="date" className="mt-1 h-8" value={form.nextDueDate ?? ""}
            onChange={e => set("nextDueDate")(e.target.value)} data-testid="input-next-due" />
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Standards Referenced</Label>
        <Input className="mt-1 h-8"
          value={(form.standardsReferenced ?? []).join(", ")}
          onChange={e => set("standardsReferenced")(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          placeholder="e.g. NIST HB 44, ISO 10012, ANSI/NCSL Z540" data-testid="input-standards-ref" />
        <p className="text-[11px] text-muted-foreground mt-0.5">Comma-separated list of calibration standards used.</p>
      </div>

      <div>
        <Label className="text-sm font-semibold">Result *</Label>
        <Select value={form.result ?? "pass"} onValueChange={set("result")}>
          <SelectTrigger className="mt-1 h-8" data-testid="select-cal-result"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pass">✅ Pass — Within tolerance</SelectItem>
            <SelectItem value="conditional">⚠️ Conditional — Restricted use</SelectItem>
            <SelectItem value="fail">❌ Fail / Out of Tolerance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="oot" checked={!!form.outOfTolerance}
          onChange={e => set("outOfTolerance")(e.target.checked)}
          className="w-4 h-4 rounded border-border accent-orange-500" />
        <Label htmlFor="oot" className="text-sm cursor-pointer">Out-of-Tolerance (OOT) detected</Label>
      </div>

      <div>
        <Label className="text-sm font-semibold">Adjustments Made</Label>
        <Textarea className="mt-1 resize-none" rows={2} value={form.adjustmentsMade ?? ""}
          onChange={e => set("adjustmentsMade")(e.target.value)} placeholder="Describe any adjustments or corrections…" />
      </div>

      <div>
        <Label className="text-sm font-semibold">Notes</Label>
        <Textarea className="mt-1 resize-none" rows={2} value={form.notes ?? ""}
          onChange={e => set("notes")(e.target.value)} placeholder="Additional notes…" />
      </div>

      {/* ── Certificate Upload ── */}
      <div>
        <Label className="text-sm font-semibold">Calibration Certificate (PDF / Image)</Label>
        <div className="mt-1 flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
            className="hidden" onChange={e => setCertFile(e.target.files?.[0] ?? null)} />
          <Button type="button" variant="outline" size="sm"
            onClick={() => fileInputRef.current?.click()} className="h-8 gap-1.5" data-testid="button-upload-cert">
            <FileUp className="w-3.5 h-3.5" />
            {certFile ? "Change File" : "Attach Certificate"}
          </Button>
          {certFile && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{certFile.name}</span>}
          {!certFile && form.certificateFileUrl && form.id && (
            <a href={`/api/calibration/records/${form.id}/certificate`} target="_blank" rel="noreferrer"
              className="text-xs text-accent underline flex items-center gap-1">
              <Download className="w-3 h-3" /> View existing cert
            </a>
          )}
        </div>
      </div>

      {/* ── IATF §7.1.5.2.1 — Production Software Verification ── */}
      {isIatfProject && (
        <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/40 space-y-2">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> IATF §7.1.5.2.1 — Production Software
          </p>
          <div className="flex items-start gap-2">
            <input type="checkbox" id="softwareVerified" checked={!!form.softwareVerified}
              onChange={e => set("softwareVerified")(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-orange-500 mt-0.5" />
            <Label htmlFor="softwareVerified" className="text-sm cursor-pointer leading-snug">
              Production software verified — any software used for product or process control (SCADA, SPC, vision systems, PLCs) has been validated or verified before use and is included in this calibration activity if applicable.
            </Label>
          </div>
        </div>
      )}

      {/* ── AS9100D §7.1.5.2 — Aerospace Measurement Requirements ── */}
      {isAerospaceProject && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 space-y-3">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> AS9100D §7.1.5.2 — Aerospace Calibration Requirements
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-sm font-semibold">Measurement Uncertainty (U)</Label>
              <Input className="mt-1 h-8" value={form.measurementUncertainty ?? ""}
                onChange={e => set("measurementUncertainty")(e.target.value)}
                placeholder="e.g. ±0.002 mm (k=2, 95% confidence)" />
              <p className="text-[11px] text-muted-foreground mt-0.5">AS9100D requires documented measurement uncertainty for all cal records.</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">As-Found Reading (before adjustment)</Label>
              <Input className="mt-1 h-8" value={form.asFoundReading ?? ""}
                onChange={e => set("asFoundReading")(e.target.value)}
                placeholder="e.g. 25.003 mm" />
            </div>
            <div>
              <Label className="text-sm font-semibold">As-Left Reading (after adjustment)</Label>
              <Input className="mt-1 h-8" value={form.asLeftReading ?? ""}
                onChange={e => set("asLeftReading")(e.target.value)}
                placeholder="e.g. 25.000 mm" />
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-semibold">Environmental Conditions During Calibration</Label>
              <Input className="mt-1 h-8" value={form.environmentConditions ?? ""}
                onChange={e => set("environmentConditions")(e.target.value)}
                placeholder="e.g. 23°C ±1°C, RH 50% ±5%, atmospheric pressure 101 kPa" />
            </div>
            <div className="col-span-2 flex items-start gap-2">
              <input type="checkbox" id="labAccredited" checked={!!form.labAccredited}
                onChange={e => set("labAccredited")(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-orange-500 mt-0.5" />
              <Label htmlFor="labAccredited" className="text-sm cursor-pointer leading-snug">
                Calibration performed by ILAC/MRA-accredited laboratory (A2LA, NVLAP, UKAS, DAkkS, etc.) — certificate on file confirms accreditation scope.
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* ── ISO 13485 §7.6 — Medical Device Calibration Requirements ── */}
      {isMedicalProject && (
        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/30 space-y-3">
          <p className="text-xs font-bold text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> ISO 13485 §7.6 — Medical Device Calibration
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">Acceptance Criteria</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={form.acceptanceCriteria ?? ""}
                onChange={e => set("acceptanceCriteria")(e.target.value)}
                placeholder="Document the specific pass/fail criteria used (e.g. 'Max error ±0.05 mm per calibration SOP-QC-007')" />
              <p className="text-[11px] text-muted-foreground mt-0.5">ISO 13485 §7.6 requires explicit acceptance criteria to be documented on each cal record.</p>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="equipmentLabelConfirmed" checked={!!form.equipmentLabelConfirmed}
                onChange={e => set("equipmentLabelConfirmed")(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-orange-500 mt-0.5" />
              <Label htmlFor="equipmentLabelConfirmed" className="text-sm cursor-pointer leading-snug">
                Calibration status label / identification confirmed on physical equipment — label shows next due date, unique ID, and calibration status (§7.6 label requirement).
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* ── IATF OOT Risk Assessment ── */}
      {showOot && isIatfProject && (
        <div className="border-2 border-red-200 rounded-lg p-4 space-y-3 bg-red-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-bold text-red-700">IATF 16949 §7.1.5.3 — Out-of-Tolerance Risk Assessment Required</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Because this gage was found out-of-tolerance, IATF requires an assessment of the potential impact on previously produced parts.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold">Suspect Date Range — Start</Label>
              <Input type="date" className="mt-1 h-8" value={oot.suspectDateStart ?? ""} onChange={e => setO("suspectDateStart")(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-semibold">Suspect Date Range — End</Label>
              <Input type="date" className="mt-1 h-8" value={oot.suspectDateEnd ?? ""} onChange={e => setO("suspectDateEnd")(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-semibold">Affected Products / Part Numbers</Label>
              <Input className="mt-1 h-8" value={oot.affectedProducts ?? ""} onChange={e => setO("affectedProducts")(e.target.value)} placeholder="e.g. Part 1234, 1235 — Lot 2024-Q3" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Risk Level</Label>
              <Select value={oot.riskLevel ?? "medium"} onValueChange={setO("riskLevel")}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — Negligible impact</SelectItem>
                  <SelectItem value="medium">Medium — Limited impact</SelectItem>
                  <SelectItem value="high">High — Significant product risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Disposition</Label>
              <Select value={oot.disposition ?? ""} onValueChange={setO("disposition")}>
                <SelectTrigger className="mt-1 h-8"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept_as_is">Accept As-Is (measurement error negligible)</SelectItem>
                  <SelectItem value="rework">Rework / Re-inspect Affected Parts</SelectItem>
                  <SelectItem value="scrap">Scrap Affected Parts</SelectItem>
                  <SelectItem value="customer_notification">Customer Notification Required</SelectItem>
                  <SelectItem value="recall">Recall / Field Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-semibold">Containment Actions</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={oot.containmentActions ?? ""}
                onChange={e => setO("containmentActions")(e.target.value)} placeholder="Describe immediate containment actions taken…" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Corrective Action Reference (CAPA #)</Label>
              <Input className="mt-1 h-8" value={oot.correctiveActionRef ?? ""} onChange={e => setO("correctiveActionRef")(e.target.value)} placeholder="e.g. CAPA-2024-015" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Assessed By</Label>
              <Input className="mt-1 h-8" value={oot.assessedBy ?? ""} onChange={e => setO("assessedBy")(e.target.value)} placeholder="Quality Engineer name" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Assessment Date</Label>
              <Input type="date" className="mt-1 h-8" value={oot.assessmentDate ?? ""} onChange={e => setO("assessmentDate")(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-semibold">OOT Notes</Label>
              <Textarea className="mt-1 resize-none" rows={2} value={oot.notes ?? ""}
                onChange={e => setO("notes")(e.target.value)} placeholder="Additional OOT assessment notes…" />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit}
          className="bg-accent hover:bg-accent/90 text-white" data-testid="button-save-record">
          Save Calibration Record
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

interface CalibrationModuleProps {
  project?: IsoProject | null;
}

export function CalibrationModule({ project }: CalibrationModuleProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<CalTab>("register");
  const [equipDialog, setEquipDialog] = useState(false);
  const [editEquip, setEditEquip] = useState<CalibrationEquipment | null>(null);
  const [logDialog, setLogDialog] = useState(false);
  const [logForEquip, setLogForEquip] = useState<CalibrationEquipment | null>(null);
  const [editRecord, setEditRecord] = useState<CalibrationRecord | null>(null);
  const [editRecordEquip, setEditRecordEquip] = useState<CalibrationEquipment | null>(null);
  const [expandedEquip, setExpandedEquip] = useState<number | null>(null);
  const [expandedOot, setExpandedOot] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchGage, setSearchGage] = useState<string>("");
  const [viewRecord, setViewRecord] = useState<CalibrationRecord | null>(null);
  const [viewRecordEquip, setViewRecordEquip] = useState<CalibrationEquipment | null>(null);
  const iatf = isIatf(project);
  const aerospace = isAerospace(project);
  const medical = isMedical(project);

  const projectId = project?.id ?? null;
  const equipUrl = projectId ? `/api/calibration/equipment?projectId=${projectId}` : "/api/calibration/equipment";
  const recordsUrl = projectId ? `/api/calibration/records?projectId=${projectId}` : "/api/calibration/records";
  const ootUrl = projectId ? `/api/calibration/oot-assessments?projectId=${projectId}` : "/api/calibration/oot-assessments";

  const { data: equipment = [] } = useQuery<CalibrationEquipment[]>({
    queryKey: ["/api/calibration/equipment", projectId],
    queryFn: () => fetch(equipUrl, { credentials: "include" }).then(r => r.json()),
  });

  const { data: records = [] } = useQuery<CalibrationRecord[]>({
    queryKey: ["/api/calibration/records", projectId],
    queryFn: () => fetch(recordsUrl, { credentials: "include" }).then(r => r.json()),
  });

  const { data: ootAssessments = [] } = useQuery<CalibrationOotAssessment[]>({
    queryKey: ["/api/calibration/oot-assessments", projectId],
    queryFn: () => fetch(ootUrl, { credentials: "include" }).then(r => r.json()),
  });

  const wiQueryUrl = projectId
    ? `/api/iso-documents?isoProjectId=${projectId}`
    : "/api/iso-documents";
  const { data: allDocs = [] } = useQuery<WorkInstruction[]>({
    queryKey: ["/api/iso-documents", projectId],
    queryFn: () => fetch(wiQueryUrl, { credentials: "include" }).then(r => r.json()),
  });
  const workInstructions = allDocs.filter(
    d => d.docType === "work_instruction" && d.status !== "obsolete",
  );

  // Fire reminder check on load (no-await, best-effort)
  useEffect(() => {
    fetch("/api/calibration/check-reminders", { method: "POST", credentials: "include" })
      .catch(() => {});
  }, []);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const saveEquip = useMutation({
    mutationFn: (d: Partial<CalibrationEquipment>) =>
      editEquip
        ? apiRequest("PATCH", `/api/calibration/equipment/${editEquip.id}`, { ...d, isoProjectId: project?.id })
        : apiRequest("POST", "/api/calibration/equipment", { ...d, isoProjectId: project?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/equipment", projectId] });
      setEquipDialog(false); setEditEquip(null);
      toast({ title: editEquip ? "Equipment updated" : "Equipment added", description: "" });
    },
    onError: () => toast({ title: "Error saving equipment", variant: "destructive" }),
  });

  const deleteEquip = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/calibration/equipment/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/equipment", projectId] });
      toast({ title: "Equipment removed" });
    },
  });

  const saveRecord = useMutation({
    mutationFn: async ({ rec, ootAssessment }: { rec: Partial<CalibrationRecord>; ootAssessment?: Partial<CalibrationOotAssessment> }) => {
      const body = { ...rec, isoProjectId: project?.id, ...(ootAssessment ? { ootAssessment } : {}) };
      const res = await apiRequest("POST", "/api/calibration/records", body);
      return res.json() as Promise<CalibrationRecord>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/records", projectId] });
      qc.invalidateQueries({ queryKey: ["/api/calibration/equipment", projectId] });
      qc.invalidateQueries({ queryKey: ["/api/calibration/oot-assessments", projectId] });
    },
  });

  const saveOot = useMutation({
    mutationFn: async (d: Partial<CalibrationOotAssessment>) => {
      const res = await apiRequest("POST", "/api/calibration/oot-assessments", { ...d, isoProjectId: project?.id });
      return res.json() as Promise<CalibrationOotAssessment>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/oot-assessments", projectId] });
    },
  });

  const patchRecord = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CalibrationRecord> }) => {
      const res = await apiRequest("PATCH", `/api/calibration/records/${id}`, { ...data, isoProjectId: project?.id });
      return res.json() as Promise<CalibrationRecord>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/records", projectId] });
      qc.invalidateQueries({ queryKey: ["/api/calibration/equipment", projectId] });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/calibration/records/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/records", projectId] });
      qc.invalidateQueries({ queryKey: ["/api/calibration/equipment", projectId] });
    },
  });

  const patchOot = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CalibrationOotAssessment> }) => {
      const res = await apiRequest("PATCH", `/api/calibration/oot-assessments/${id}`, { ...data, isoProjectId: project?.id });
      return res.json() as Promise<CalibrationOotAssessment>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/oot-assessments", projectId] });
    },
  });

  async function uploadCertFile(recordId: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/calibration/records/${recordId}/certificate`, {
      method: "POST", credentials: "include", body: fd,
    });
    if (!res.ok) throw new Error("Certificate upload failed");
    return res.json() as Promise<{ certificateFileUrl: string }>;
  }

  async function handleSaveRecord(rec: Partial<CalibrationRecord>, oot?: Partial<CalibrationOotAssessment>, certFile?: File) {
    try {
      const isOot = rec.result === "fail" || rec.outOfTolerance === true;
      const record = await saveRecord.mutateAsync({
        rec,
        ootAssessment: isOot && oot ? oot : undefined,
      });
      if (certFile) {
        try {
          await uploadCertFile(record.id, certFile);
          qc.invalidateQueries({ queryKey: ["/api/calibration/records", projectId] });
        } catch {
          toast({ title: "Record saved, but certificate upload failed", variant: "destructive" });
        }
      }
      setLogDialog(false); setLogForEquip(null);
      toast({ title: "Calibration record logged", description: isOot && oot ? "OOT assessment saved." : "" });
    } catch {
      toast({ title: "Error logging record", variant: "destructive" });
    }
  }

  async function handleEditRecord(rec: Partial<CalibrationRecord>, oot?: Partial<CalibrationOotAssessment>, certFile?: File) {
    if (!editRecord) return;
    try {
      await patchRecord.mutateAsync({ id: editRecord.id, data: rec });
      if (oot && (rec.result === "fail" || rec.outOfTolerance)) {
        const existingOot = ootAssessments.find(o => o.calibrationRecordId === editRecord.id);
        if (existingOot) {
          await patchOot.mutateAsync({ id: existingOot.id, data: oot });
        } else {
          await saveOot.mutateAsync({
            ...oot,
            calibrationRecordId: editRecord.id,
            equipmentId: editRecord.equipmentId,
          });
        }
      }
      if (certFile) {
        try {
          await uploadCertFile(editRecord.id, certFile);
          qc.invalidateQueries({ queryKey: ["/api/calibration/records", projectId] });
        } catch {
          toast({ title: "Record updated, but certificate upload failed", variant: "destructive" });
        }
      }
      setEditRecord(null); setEditRecordEquip(null);
      toast({ title: "Calibration record updated", description: oot ? "OOT assessment saved." : "" });
    } catch {
      toast({ title: "Error updating record", variant: "destructive" });
    }
  }

  // ─── Derived data ─────────────────────────────────────────────────────────

  const filteredEquip = equipment.filter(e => {
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    const q = searchGage.toLowerCase();
    const matchesSearch = !q ||
      e.gageId.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.type ?? "").toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q) ||
      (e.manufacturer ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const overdue = equipment.filter(e => {
    const d = daysUntil(e.nextDueDate);
    return d !== null && d < 0 && e.status === "active";
  });
  const dueSoon = equipment.filter(e => {
    const d = daysUntil(e.nextDueDate);
    return d !== null && d >= 0 && d <= 30 && e.status === "active";
  });

  const recordsForEquip = (eqId: number) =>
    records.filter(r => r.equipmentId === eqId).sort((a, b) => b.calibrationDate.localeCompare(a.calibrationDate));

  const ootForRecord = (recId: number) =>
    ootAssessments.filter(o => o.calibrationRecordId === recId);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Gauge className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-black text-foreground">Calibration</h2>
              <span className="text-xs font-mono text-accent font-bold">§7.1.5</span>
              {iatf && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">IATF 16949 §7.1.5.2.1</Badge>}
              {aerospace && <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">AS9100D §7.1.5.2</Badge>}
              {medical && <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">ISO 13485 §7.6</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              All measuring instruments · click any gage row to see its specs and calibration history · click a record to open the full detail view
              {iatf ? " · IATF §7.1.5.3 OOT Assessments" : ""}
              {aerospace ? " · AS9100D §7.1.5.2 measurement data" : ""}
              {medical ? " · ISO 13485 §7.6" : ""}.
            </p>
          </div>
          <Button onClick={() => { setEditEquip(null); setEquipDialog(true); }}
            className="bg-accent hover:bg-accent/90 text-white shrink-0" data-testid="button-add-equipment">
            <Plus className="w-4 h-4 mr-1" /> Add Equipment
          </Button>
        </div>

        {/* Summary banners */}
        {(overdue.length > 0 || dueSoon.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {overdue.length > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-1.5 text-xs font-medium">
                <XCircle className="w-3.5 h-3.5" />
                {overdue.length} gage{overdue.length > 1 ? "s" : ""} overdue
              </div>
            )}
            {dueSoon.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {dueSoon.length} gage{dueSoon.length > 1 ? "s" : ""} due within 30 days
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-border flex-wrap">
          {[
            { key: "register", label: "Master Calibration Register", icon: ClipboardList },
            { key: "oot", label: `OOT Assessments${ootAssessments.length > 0 ? ` (${ootAssessments.length})` : ""}`, icon: AlertTriangle },
            ...(iatf ? [{ key: "msa", label: "MSA (Gauge R&R)", icon: BarChart3 }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as CalTab)}
              data-testid={`tab-cal-${key}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="px-4 sm:px-6 pb-8">

          {/* ── Gage Register Tab ── */}
          {tab === "register" && (
            <div className="space-y-3 mt-2">
              {/* Filters */}
              <div className="flex flex-col gap-2">
                <Input
                  className="h-8 max-w-xs"
                  placeholder="Search by ID, name, type, location…"
                  value={searchGage}
                  onChange={e => setSearchGage(e.target.value)}
                  data-testid="input-search-gage"
                />
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  {["all", "active", "out_of_service", "retired"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        filterStatus === s ? "bg-accent text-white border-accent" : "text-muted-foreground border-border hover:border-accent"}`}>
                      {s === "all" ? "All" : s === "out_of_service" ? "Out of Service" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">{filteredEquip.length} item{filteredEquip.length !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {filteredEquip.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Gauge className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No equipment in the Master Calibration Register</p>
                  <p className="text-xs mt-1">Click "Add Equipment" to register your first measuring instrument.</p>
                </div>
              )}

              {filteredEquip.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[110px_1fr_110px_110px_110px_90px] gap-0 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <div className="px-3 py-2.5">Gage ID</div>
                    <div className="px-3 py-2.5">Name / Type</div>
                    <div className="px-3 py-2.5">Status</div>
                    <div className="px-3 py-2.5">Next Due</div>
                    <div className="px-3 py-2.5">Last Cal</div>
                    <div className="px-3 py-2.5">Actions</div>
                  </div>

                  {filteredEquip.map((eq, idx) => {
                    const recs = recordsForEquip(eq.id);
                    const lastRec = recs[0];
                    const isExpanded = expandedEquip === eq.id;
                    return (
                      <div key={eq.id} className={`border-b border-border/60 last:border-0 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}>
                        {/* Compact row — entire row clickable to expand */}
                        <div
                          className={`grid grid-cols-[110px_1fr_110px_110px_110px_90px] gap-0 items-center cursor-pointer hover:bg-accent/5 transition-colors select-none ${isExpanded ? "bg-accent/5" : ""}`}
                          onClick={() => setExpandedEquip(isExpanded ? null : eq.id)}
                          data-testid={`row-equip-${eq.id}`}
                        >
                          {/* Gage ID */}
                          <div className="px-3 py-3">
                            <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{eq.gageId}</span>
                            {eq.customerOwned && (
                              <div className="mt-0.5">
                                <span className="text-[10px] text-blue-600 font-medium">Customer-Owned</span>
                              </div>
                            )}
                          </div>
                          {/* Name / Type */}
                          <div className="px-3 py-3 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{eq.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              {eq.type && <span>{eq.type}</span>}
                              {eq.location && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5 shrink-0" />{eq.location}</span>}
                            </div>
                          </div>
                          {/* Status */}
                          <div className="px-3 py-3">
                            <Badge className={`text-[11px] border ${STATUS_COLORS[eq.status ?? "active"]}`}>
                              {eq.status === "out_of_service" ? "Out of Svc" : (eq.status ?? "active")}
                            </Badge>
                          </div>
                          {/* Next Due */}
                          <div className="px-3 py-3 text-xs">
                            {eq.nextDueDate ? (
                              <div>
                                <span className={(() => {
                                  const days = Math.ceil((new Date(eq.nextDueDate).getTime() - Date.now()) / 86400000);
                                  return days < 0 ? "text-red-600 font-semibold" : days <= 30 ? "text-amber-600 font-semibold" : "text-foreground";
                                })()}>{eq.nextDueDate}</span>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {eq.calType === "internal" ? "Int" : "Ext"} · {eq.calFrequencyMonths ?? 12}mo
                                </div>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </div>
                          {/* Last Cal */}
                          <div className="px-3 py-3 text-xs">
                            {lastRec ? (
                              <div>
                                <span className={`inline-block px-1.5 py-0.5 rounded border font-medium text-[11px] ${RESULT_COLORS[lastRec.result ?? "pass"]}`}>
                                  {lastRec.result?.toUpperCase()}
                                </span>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{lastRec.calibrationDate}</div>
                                {lastRec.outOfTolerance && <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 mt-0.5">OOT</Badge>}
                              </div>
                            ) : <span className="text-muted-foreground text-[11px]">No records</span>}
                          </div>
                          {/* Actions — stopPropagation so they don't toggle the row */}
                          <div className="px-3 py-3 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setLogForEquip(eq); setLogDialog(true); }}
                              data-testid={`button-log-cal-${eq.id}`}
                              title="Log Calibration" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-accent">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setEditEquip(eq); setEquipDialog(true); }}
                              data-testid={`button-edit-equip-${eq.id}`}
                              title="Edit Gage" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-accent">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if (confirm(`Remove ${eq.name}?`)) deleteEquip.mutate(eq.id); }}
                              data-testid={`button-delete-equip-${eq.id}`}
                              title="Delete" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="p-1 text-muted-foreground">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </span>
                          </div>
                        </div>

                        {/* Expanded panel — specs + full calibration history */}
                        {isExpanded && (
                          <div className="border-t border-border/40 bg-muted/10 text-xs">
                            {/* Instrument specs */}
                            <div className="px-4 pt-3 pb-2">
                              <p className="font-semibold text-foreground uppercase tracking-wide text-[10px] mb-2">Instrument Specifications</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-muted-foreground">
                                {eq.manufacturer && <p><span className="font-medium text-foreground">Manufacturer:</span> {eq.manufacturer}{eq.model ? ` — ${eq.model}` : ""}</p>}
                                {eq.serialNumber && <p><span className="font-medium text-foreground">S/N:</span> {eq.serialNumber}</p>}
                                {eq.responsiblePerson && <p><span className="font-medium text-foreground">Responsible:</span> {eq.responsiblePerson}</p>}
                                {eq.measurementRange && <p><span className="font-medium text-foreground">Range:</span> {eq.measurementRange}</p>}
                                {eq.resolution && <p><span className="font-medium text-foreground">Resolution:</span> {eq.resolution}</p>}
                                {eq.tolerance && <p><span className="font-medium text-foreground">Tolerance:</span> {eq.tolerance}</p>}
                                {eq.calFrequencyMonths && <p><span className="font-medium text-foreground">Frequency:</span> Every {eq.calFrequencyMonths} mo ({eq.calType === "internal" ? "Internal" : "External"})</p>}
                                {eq.traceableStandard && <p><span className="font-medium text-foreground">Traceable to:</span> {eq.traceableStandard}</p>}
                                {eq.calibrationLab && <p><span className="font-medium text-foreground">Cal Lab:</span> {eq.calibrationLab}</p>}
                                {eq.linkedDocumentId && (() => {
                                  const wi = workInstructions.find(w => w.id === eq.linkedDocumentId);
                                  return wi ? <p className="col-span-3"><span className="font-medium text-foreground">WI:</span> <a href="/iso-manager?module=documentation" className="text-accent underline">{wi.title}</a></p> : null;
                                })()}
                                {eq.notes && <p className="col-span-3 italic mt-0.5">{eq.notes}</p>}
                              </div>
                            </div>

                            {/* Calibration history */}
                            <div className="border-t border-border/30 px-4 pt-3 pb-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-foreground uppercase tracking-wide text-[10px]">
                                  Calibration History ({recs.length} record{recs.length !== 1 ? "s" : ""})
                                </p>
                                <button
                                  onClick={() => { setLogForEquip(eq); setLogDialog(true); }}
                                  className="flex items-center gap-1 text-[11px] text-accent font-semibold hover:opacity-75"
                                  data-testid={`button-log-inline-${eq.id}`}>
                                  <Plus className="w-3 h-3" /> Log New Calibration
                                </button>
                              </div>

                              {recs.length === 0 ? (
                                <p className="text-muted-foreground italic py-2">No calibration records yet — click "Log New Calibration" to add the first one.</p>
                              ) : (
                                <div className="rounded border border-border overflow-hidden">
                                  <div className="grid grid-cols-[1fr_80px_110px_1fr_32px] bg-muted/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    <div className="px-2.5 py-2">Date</div>
                                    <div className="px-2.5 py-2">Result</div>
                                    <div className="px-2.5 py-2">Cert #</div>
                                    <div className="px-2.5 py-2">Performed By</div>
                                    <div className="px-2.5 py-2" />
                                  </div>
                                  {recs.map((r, ri) => {
                                    const oots = ootForRecord(r.id);
                                    return (
                                      <div key={r.id}
                                        className={`grid grid-cols-[1fr_80px_110px_1fr_32px] items-center border-b border-border/50 last:border-0 cursor-pointer hover:bg-accent/5 transition-colors ${ri % 2 === 1 ? "bg-muted/20" : ""} ${r.outOfTolerance ? "bg-red-50/40" : ""}`}
                                        onClick={() => { setViewRecord(r); setViewRecordEquip(eq); }}
                                        data-testid={`row-cal-record-${r.id}`}>
                                        <div className="px-2.5 py-2 font-medium text-foreground flex items-center gap-1.5">
                                          <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                                          {r.calibrationDate}
                                        </div>
                                        <div className="px-2.5 py-2">
                                          <div className="flex flex-col gap-0.5">
                                            <span className={`inline-block px-1.5 py-0.5 rounded border font-medium text-[10px] w-fit ${RESULT_COLORS[r.result ?? "pass"]}`}>
                                              {(r.result ?? "pass").toUpperCase()}
                                            </span>
                                            {r.outOfTolerance && <Badge className="text-[9px] bg-red-100 text-red-700 border-red-200 w-fit px-1 py-0">OOT</Badge>}
                                            {oots.length > 0 && <Badge className="text-[9px] bg-amber-100 text-amber-700 border-amber-200 w-fit px-1 py-0">Assessed</Badge>}
                                          </div>
                                        </div>
                                        <div className="px-2.5 py-2 text-muted-foreground">
                                          {r.certNumber || <span className="text-border">—</span>}
                                        </div>
                                        <div className="px-2.5 py-2 text-muted-foreground truncate">
                                          {r.performedBy || <span className="text-border">—</span>}
                                        </div>
                                        <div className="px-2.5 py-2 text-muted-foreground">
                                          <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg] text-muted-foreground" />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* ── OOT Assessments Tab ── */}
          {tab === "oot" && (
            <div className="mt-2 space-y-2">
              {!iatf && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-800">IATF 16949 §7.1.5.3 — Out-of-Tolerance Risk Assessment</p>
                    <p className="text-blue-700 text-xs mt-1">
                      OOT risk assessments are required for IATF 16949 certified organizations. Switch your ISO project standard to IATF 16949 to enable this workflow.
                    </p>
                  </div>
                </div>
              )}

              {ootAssessments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No OOT assessments on record</p>
                  <p className="text-xs mt-1">When you log a calibration as "Fail" or "OOT," an assessment will be created here.</p>
                </div>
              )}

              {ootAssessments.map(oot => {
                const eq = equipment.find(e => e.id === oot.equipmentId);
                const rec = records.find(r => r.id === oot.calibrationRecordId);
                const isExp = expandedOot === oot.id;
                return (
                  <Card key={oot.id} className="border border-red-200/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            {eq && <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{eq.gageId}</span>}
                            <span className="font-semibold text-sm">{eq?.name ?? `Equipment #${oot.equipmentId}`}</span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${RISK_COLORS[oot.riskLevel ?? "medium"]}`}>
                              {(oot.riskLevel ?? "medium").toUpperCase()} RISK
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                            {rec && <span>Cal Date: {rec.calibrationDate}</span>}
                            {oot.assessmentDate && <span>Assessed: {oot.assessmentDate}</span>}
                            {oot.assessedBy && <span>By: {oot.assessedBy}</span>}
                            {oot.disposition && <span className="font-medium text-foreground capitalize">{oot.disposition.replace(/_/g, " ")}</span>}
                          </div>
                          {oot.affectedProducts && (
                            <p className="mt-1 text-xs text-muted-foreground">Affected: {oot.affectedProducts}</p>
                          )}
                        </div>
                        <button onClick={() => setExpandedOot(isExp ? null : oot.id)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground">
                          {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {isExp && (
                        <div className="mt-3 border-t pt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                          {oot.suspectDateStart && (
                            <div><span className="font-medium text-muted-foreground">Suspect Period: </span>{oot.suspectDateStart} → {oot.suspectDateEnd ?? "?"}</div>
                          )}
                          {oot.disposition && (
                            <div><span className="font-medium text-muted-foreground">Disposition: </span>{oot.disposition.replace(/_/g, " ")}</div>
                          )}
                          {oot.correctiveActionRef && (
                            <div><span className="font-medium text-muted-foreground">CAPA Ref: </span>{oot.correctiveActionRef}</div>
                          )}
                          {oot.containmentActions && (
                            <div className="col-span-2"><span className="font-medium text-muted-foreground">Containment: </span>{oot.containmentActions}</div>
                          )}
                          {oot.notes && (
                            <div className="col-span-2 text-muted-foreground italic">{oot.notes}</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

            </div>
          )}

          {/* ── MSA Tab (IATF only) ── */}
          {tab === "msa" && (
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <BarChart3 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">IATF 16949 §7.1.5.2 — Measurement System Analysis (MSA)</p>
                  <p className="text-xs text-amber-700 mt-1">
                    IATF 16949 requires MSA studies for measurement systems referenced in the Control Plan. Studies assess Gage R&R
                    (repeatability & reproducibility), bias, linearity, and stability. Results guide whether a measurement system is
                    acceptable for production use (%GRR &lt;10% = acceptable, 10–30% = conditional, &gt;30% = unacceptable; NDC ≥5 required).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { type: "Gage R&R (GRR)", desc: "Repeatability & Reproducibility study — quantifies measurement variation due to the gage and appraisers. Primary MSA tool for variable data." },
                  { type: "Bias Study", desc: "Compares the average of repeated measurements to a reference value to identify systematic error in the measurement system." },
                  { type: "Linearity Study", desc: "Evaluates whether gage bias is consistent across the full operating range of the instrument." },
                  { type: "Stability Study", desc: "Monitors measurement system variation over time using control charts to detect drift or shifts." },
                  { type: "Attribute Agreement Analysis (AAA)", desc: "Assesses repeatability and reproducibility for pass/fail or attribute-type gages and inspectors." },
                ].map(s => (
                  <Card key={s.type} className="border border-dashed border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.type}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                          <Badge variant="outline" className="mt-2 text-[10px] text-muted-foreground">Coming Soon</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center pb-4">
                MSA data entry and GRR analysis will be available in a future update. Reference: AIAG MSA Reference Manual (4th Ed.), IATF 16949 §7.1.5.2.
              </p>
            </div>
          )}

        </div>
      </ScrollArea>

      {/* ── Dialogs ── */}

      <Dialog open={equipDialog} onOpenChange={v => { setEquipDialog(v); if (!v) setEditEquip(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEquip ? "Edit Equipment" : "Add Measuring Equipment"}</DialogTitle>
          </DialogHeader>
          <EquipmentForm
            initial={editEquip ?? EMPTY_EQ}
            onSave={d => saveEquip.mutate(d)}
            onCancel={() => { setEquipDialog(false); setEditEquip(null); }}
            workInstructions={workInstructions}
          />
        </DialogContent>
      </Dialog>

      {/* ── Calibration Record Detail Dialog ── */}
      <Dialog open={!!viewRecord} onOpenChange={v => { if (!v) { setViewRecord(null); setViewRecordEquip(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-accent" />
              Calibration Record
              {viewRecordEquip && (
                <span className="text-sm font-normal text-muted-foreground">
                  — <span className="font-mono font-bold">{viewRecordEquip.gageId}</span> {viewRecordEquip.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && viewRecordEquip && (() => {
            const r = viewRecord;
            const eq = viewRecordEquip;
            const oots = ootForRecord(r.id);
            return (
              <div className="space-y-4 text-sm">
                {/* Status banner */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  r.outOfTolerance ? "bg-red-50 border-red-200" :
                  r.result === "fail" ? "bg-red-50 border-red-200" :
                  r.result === "conditional" ? "bg-amber-50 border-amber-200" :
                  "bg-emerald-50 border-emerald-200"}`}>
                  <span className={`text-lg font-black ${r.outOfTolerance || r.result === "fail" ? "text-red-700" : r.result === "conditional" ? "text-amber-700" : "text-emerald-700"}`}>
                    {r.outOfTolerance ? "OUT OF TOLERANCE" : (r.result ?? "PASS").toUpperCase()}
                  </span>
                  {r.outOfTolerance && <Badge className="bg-red-100 text-red-700 border-red-300">OOT {oots.length > 0 ? "— Assessed ✓" : "— Pending Assessment"}</Badge>}
                </div>

                {/* Core fields grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Calibration Date</p>
                    <p className="font-medium">{r.calibrationDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Next Due Date</p>
                    <p className={`font-medium ${(() => { const d = r.nextDueDate ? Math.ceil((new Date(r.nextDueDate).getTime() - Date.now()) / 86400000) : null; return d !== null && d < 0 ? "text-red-600" : d !== null && d <= 30 ? "text-amber-600" : "text-foreground"; })()}`}>
                      {r.nextDueDate ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Performed By</p>
                    <p>{r.performedBy ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Certificate Number</p>
                    <p className="font-mono">{r.certNumber ?? "—"}</p>
                  </div>
                  {r.standardsReferenced && r.standardsReferenced.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Standards Referenced</p>
                      <p>{r.standardsReferenced.join(", ")}</p>
                    </div>
                  )}
                  {r.adjustmentsMade && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Adjustments / Corrections Made</p>
                      <p>{r.adjustmentsMade}</p>
                    </div>
                  )}
                  {r.notes && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Notes</p>
                      <p className="italic text-muted-foreground">{r.notes}</p>
                    </div>
                  )}
                </div>

                {/* Certificate download */}
                {r.certificateFileUrl && (
                  <div className="border border-border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <FileCheck className="w-4 h-4 text-accent" />
                      <span className="font-medium">Calibration Certificate on file</span>
                    </div>
                    <a href={`/api/calibration/records/${r.id}/certificate`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-sm text-accent underline font-medium hover:opacity-75">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                )}

                {/* IATF §7.1.5.2.1 */}
                {iatf && (
                  <div className="border border-amber-200 rounded-lg p-3 bg-amber-50/40 space-y-1">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> IATF §7.1.5.2.1 — Production Software
                    </p>
                    <p className="text-sm">
                      Software verified:{" "}
                      <span className={r.softwareVerified ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>
                        {r.softwareVerified ? "Yes ✓" : "No / Not applicable"}
                      </span>
                    </p>
                  </div>
                )}

                {/* AS9100D §7.1.5.2 */}
                {aerospace && (r.measurementUncertainty || r.asFoundReading || r.asLeftReading || r.environmentConditions || r.labAccredited !== null) && (
                  <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30 space-y-1.5">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> AS9100D §7.1.5.2 — Measurement Data
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {r.measurementUncertainty && <p><span className="font-medium">Uncertainty (U):</span> {r.measurementUncertainty}</p>}
                      {r.labAccredited !== null && r.labAccredited !== undefined && <p><span className="font-medium">ILAC Lab:</span> {r.labAccredited ? "Accredited ✓" : "Not accredited"}</p>}
                      {r.asFoundReading && <p><span className="font-medium">As-Found:</span> {r.asFoundReading}</p>}
                      {r.asLeftReading && <p><span className="font-medium">As-Left:</span> {r.asLeftReading}</p>}
                      {r.environmentConditions && <p className="col-span-2"><span className="font-medium">Conditions:</span> {r.environmentConditions}</p>}
                    </div>
                  </div>
                )}

                {/* ISO 13485 §7.6 */}
                {medical && (r.acceptanceCriteria || r.equipmentLabelConfirmed !== null) && (
                  <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/30 space-y-1.5">
                    <p className="text-xs font-bold text-purple-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> ISO 13485 §7.6 — Medical Device
                    </p>
                    {r.acceptanceCriteria && <p className="text-sm"><span className="font-medium">Acceptance Criteria:</span> {r.acceptanceCriteria}</p>}
                    {r.equipmentLabelConfirmed !== null && r.equipmentLabelConfirmed !== undefined && (
                      <p className="text-sm"><span className="font-medium">Label Confirmed:</span>{" "}
                        <span className={r.equipmentLabelConfirmed ? "text-emerald-700 font-semibold" : "text-muted-foreground"}>
                          {r.equipmentLabelConfirmed ? "Yes ✓" : "No"}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {/* OOT assessment summary */}
                {oots.length > 0 && oots.map(oot => (
                  <div key={oot.id} className="border border-red-200 rounded-lg p-3 bg-red-50/30 space-y-1.5">
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> IATF §7.1.5.3 — OOT Risk Assessment
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <p><span className="font-medium">Risk Level:</span> <span className={oot.riskLevel === "high" ? "text-red-700 font-bold" : oot.riskLevel === "medium" ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>{(oot.riskLevel ?? "medium").toUpperCase()}</span></p>
                      <p><span className="font-medium">Disposition:</span> {oot.disposition ?? "—"}</p>
                      {oot.affectedProducts && <p className="col-span-2"><span className="font-medium">Affected Products:</span> {oot.affectedProducts}</p>}
                      {oot.containmentActions && <p className="col-span-2"><span className="font-medium">Containment:</span> {oot.containmentActions}</p>}
                      {oot.correctiveActionRef && <p className="col-span-2"><span className="font-medium">CAPA Ref:</span> {oot.correctiveActionRef}</p>}
                    </div>
                  </div>
                ))}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline"
                    onClick={() => { setEditRecord(r); setEditRecordEquip(eq); setViewRecord(null); setViewRecordEquip(null); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Record
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => { if (confirm("Delete this calibration record?")) { deleteRecord.mutate(r.id); setViewRecord(null); setViewRecordEquip(null); } }}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                  <Button size="sm" variant="outline" className="ml-auto"
                    onClick={() => { setViewRecord(null); setViewRecordEquip(null); }}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={logDialog} onOpenChange={v => { setLogDialog(v); if (!v) setLogForEquip(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Calibration Record</DialogTitle>
          </DialogHeader>
          {logForEquip && (
            <RecordForm
              equipment={logForEquip}
              isoProjectId={project?.id}
              onSave={handleSaveRecord}
              onCancel={() => { setLogDialog(false); setLogForEquip(null); }}
              isIatfProject={iatf}
              isAerospaceProject={aerospace}
              isMedicalProject={medical}
            />
          )}
          {!logForEquip && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Select equipment to log against:</p>
              {equipment.filter(e => e.status === "active").map(eq => (
                <button key={eq.id} onClick={() => setLogForEquip(eq)}
                  className="w-full text-left p-3 border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors">
                  <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded mr-2">{eq.gageId}</span>
                  <span className="font-medium text-sm">{eq.name}</span>
                  {eq.location && <span className="text-xs text-muted-foreground ml-2">{eq.location}</span>}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRecord} onOpenChange={v => { if (!v) { setEditRecord(null); setEditRecordEquip(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Calibration Record</DialogTitle>
          </DialogHeader>
          {editRecord && editRecordEquip && (
            <RecordForm
              equipment={editRecordEquip}
              isoProjectId={project?.id}
              onSave={handleEditRecord}
              onCancel={() => { setEditRecord(null); setEditRecordEquip(null); }}
              isIatfProject={iatf}
              isAerospaceProject={aerospace}
              isMedicalProject={medical}
              initial={editRecord}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
