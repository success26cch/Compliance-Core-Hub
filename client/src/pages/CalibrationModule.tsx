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
  Calendar, Activity, Info, FileUp, Download, BarChart3, MapPin, User, X,
  CheckCircle2, Thermometer, FlaskConical, Building2,
} from "lucide-react";
import type { IsoProject } from "@shared/schema";

// ─── Types ─────────────────────────────────────────────────────────────────

type CalTab = "register" | "oot" | "msa" | "labs";

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
  // Variable-gage measurement data
  preCalibrationChecks?: unknown | null;
  referenceStandards?: unknown | null;
  measurementData?: unknown | null;
  // Internal / External
  calType?: string | null;
  labId?: number | null;
  scopeVerified?: boolean | null;
  scopeCitedItem?: string | null;
  createdAt?: string | null;
}

interface ScopeItem {
  id: string;
  discipline: string;
  rangeMin: string;
  rangeMax: string;
  unit: string;
  cmc: string;
}

interface CalibrationLab {
  id: number; userId: string; isoProjectId?: number | null;
  name: string;
  accreditationBody?: string | null;
  accreditationNumber?: string | null;
  iso17025CertUrl?: string | null;
  certExpiryDate?: string | null;
  scope?: string | null;
  scopeItems?: ScopeItem[] | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
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

// ─── Variable-Gage Data Structures ───────────────────────────────────────────

interface MeasurementPoint {
  id: string;
  nominalValue: string;
  unit: string;
  trial1: string;
  trial2: string;
  trial3: string;
  withinTolerance: boolean;
  notes: string;
}

interface ReferenceStandard {
  id: string;
  description: string;
  identification: string;
  certNumber: string;
  certDueDate: string;
  traceability: string;
}

interface PreCalChecks {
  visualInspectionPass: boolean;
  zeroCheckPass: boolean;
  equipmentClean: boolean;
  notes: string;
}

function newMeasRow(): MeasurementPoint {
  return { id: crypto.randomUUID(), nominalValue: "", unit: "in", trial1: "", trial2: "", trial3: "", withinTolerance: true, notes: "" };
}
function newRefStd(): ReferenceStandard {
  return { id: crypto.randomUUID(), description: "", identification: "", certNumber: "", certDueDate: "", traceability: "NIST" };
}

const UNIT_OPTIONS = ["in", "mm", "µm", "°", "°F", "°C", "psi", "kPa", "N·m", "lbf", "kg", "N", "%", "other"];
const TRACE_OPTIONS = ["NIST", "NPL (UK)", "PTB (Germany)", "BIPM", "NMIJ (Japan)", "A2LA", "NVLAP", "UKAS", "DAkkS", "Internal"];

function calcRowStats(row: MeasurementPoint) {
  const trials = [row.trial1, row.trial2, row.trial3]
    .map(v => v.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
  const avg = trials.length > 0 ? trials.reduce((a, b) => a + b, 0) / trials.length : null;
  const nom = parseFloat(row.nominalValue);
  const err = avg !== null && !isNaN(nom) ? avg - nom : null;
  return { avg, err };
}

function RecordForm({ equipment, isoProjectId, onSave, onCancel, isIatfProject, isAerospaceProject, isMedicalProject, initial, labs = [], onCreateLab, onUploadLabCert }: {
  equipment: CalibrationEquipment;
  isoProjectId?: number | null;
  onSave: (rec: Partial<CalibrationRecord>, oot?: Partial<CalibrationOotAssessment>, certFile?: File) => void;
  onCancel: () => void;
  isIatfProject?: boolean;
  isAerospaceProject?: boolean;
  isMedicalProject?: boolean;
  initial?: Partial<CalibrationRecord>;
  labs?: CalibrationLab[];
  onCreateLab?: (data: Partial<CalibrationLab>) => Promise<CalibrationLab>;
  onUploadLabCert?: (labId: number, file: File) => Promise<void>;
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

  // Internal / External calibration state
  const [calType, setCalType] = useState<"internal" | "external">(
    (initial?.calType as "internal" | "external" | undefined | null) ?? "external"
  );
  const [selectedLabId, setSelectedLabId] = useState<number | null>(initial?.labId ?? null);
  const [scopeVerified, setScopeVerified] = useState<boolean>(initial?.scopeVerified ?? false);
  const [scopeCitedItem, setScopeCitedItem] = useState<string>(initial?.scopeCitedItem ?? "");
  const [showAddLab, setShowAddLab] = useState(false);
  const [addLabForm, setAddLabForm] = useState({
    name: "", accreditationBody: "A2LA", accreditationNumber: "",
    certExpiryDate: "", scope: "", contactName: "", contactEmail: "",
  });
  const [labCertFile, setLabCertFile] = useState<File | null>(null);
  const [labCertUploading, setLabCertUploading] = useState(false);
  const labCertInputRef = useRef<HTMLInputElement>(null);

  const selectedLab = labs.find(l => l.id === selectedLabId) ?? null;
  const labCertExpired = selectedLab?.certExpiryDate
    ? new Date(selectedLab.certExpiryDate) < new Date()
    : false;
  const labCertDaysDue = selectedLab?.certExpiryDate
    ? Math.ceil((new Date(selectedLab.certExpiryDate).getTime() - Date.now()) / 86400000)
    : null;

  // Variable-gage measurement data
  const [preCalChecks, setPreCalChecks] = useState<PreCalChecks>(
    (initial?.preCalibrationChecks as PreCalChecks | undefined) ??
    { visualInspectionPass: false, zeroCheckPass: false, equipmentClean: false, notes: "" }
  );
  const [refStds, setRefStds] = useState<ReferenceStandard[]>(
    (initial?.referenceStandards as ReferenceStandard[] | undefined) ?? []
  );
  const [measData, setMeasData] = useState<MeasurementPoint[]>(
    (initial?.measurementData as MeasurementPoint[] | undefined) ?? []
  );

  function updateRefStd(id: string, field: keyof ReferenceStandard, value: string) {
    setRefStds(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }
  function updateMeasRow(id: string, field: keyof MeasurementPoint, value: string | boolean) {
    setMeasData(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

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
    if (calType === "external" && selectedLabId && !scopeVerified) {
      toast({ title: "Scope verification required", description: "Confirm the lab's ISO 17025 scope of accreditation covers this equipment type and measurement range.", variant: "destructive" }); return;
    }
    if (showOot && isIatfProject) {
      if (!(oot.assessedBy ?? "").trim()) {
        toast({ title: "OOT assessment requires 'Assessed By'", description: "IATF §7.1.5.3 mandates the assessor be identified.", variant: "destructive" }); return;
      }
      if (!(oot.disposition ?? "").trim()) {
        toast({ title: "OOT assessment requires 'Disposition'", description: "IATF §7.1.5.3 requires a documented disposition decision.", variant: "destructive" }); return;
      }
    }
    const payload: Partial<CalibrationRecord> = {
      ...form,
      calType,
      labId: calType === "external" ? selectedLabId : null,
      scopeVerified: calType === "external" ? scopeVerified : false,
      scopeCitedItem: calType === "external" && scopeCitedItem.trim() ? scopeCitedItem.trim() : null,
      preCalibrationChecks: calType === "internal" ? preCalChecks : null,
      referenceStandards: calType === "internal" && refStds.length > 0 ? refStds : null,
      measurementData: calType === "internal" && measData.length > 0 ? measData : null,
    };
    onSave(payload, showOot && isIatfProject ? oot : undefined, certFile ?? undefined);
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
        {equipment.tolerance && <span className="text-muted-foreground ml-2">· Tolerance: <span className="font-semibold text-foreground">{equipment.tolerance}</span></span>}
        {equipment.measurementRange && <span className="text-muted-foreground ml-2">· Range: {equipment.measurementRange}</span>}
      </div>

      {/* ── Calibration Type Toggle ── */}
      <div className="border border-border rounded-lg p-3 bg-muted/10">
        <p className="text-xs font-bold uppercase tracking-wide mb-2">Calibration Type</p>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setCalType("external")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              calType === "external"
                ? "bg-accent text-white border-accent"
                : "border-border hover:border-accent/60 hover:bg-accent/5 text-foreground"
            }`}
            data-testid="toggle-external">
            <Building2 className="w-4 h-4" /> External Lab
          </button>
          <button type="button"
            onClick={() => setCalType("internal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              calType === "internal"
                ? "bg-accent text-white border-accent"
                : "border-border hover:border-accent/60 hover:bg-accent/5 text-foreground"
            }`}
            data-testid="toggle-internal">
            <FlaskConical className="w-4 h-4" /> Internal / In-House
          </button>
        </div>
        {calType === "external" && (
          <p className="text-[11px] text-muted-foreground mt-1.5">Performed by an accredited external calibration laboratory — link to your lab registry below.</p>
        )}
        {calType === "internal" && (
          <p className="text-[11px] text-muted-foreground mt-1.5">Performed by in-house personnel using internal equipment and reference standards.</p>
        )}
      </div>

      {/* ── Pre-Calibration Checks (Internal only) ── */}
      {calType === "internal" && <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/10">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Pre-Calibration Checks
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            ["visualInspectionPass", "Visual Inspection — no damage, corrosion, or defects"],
            ["zeroCheckPass",        "Zero / Master Check — instrument zeros or references correctly"],
            ["equipmentClean",       "Equipment Clean & Dry — free of oil, chips, debris"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-start gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={preCalChecks[key]}
                onChange={e => setPreCalChecks(p => ({ ...p, [key]: e.target.checked }))}
                className="w-4 h-4 mt-0.5 accent-orange-500 shrink-0" />
              <span className="text-xs text-foreground leading-snug">{label}</span>
            </label>
          ))}
        </div>
        <div>
          <Label className="text-xs font-semibold">Pre-Cal Notes</Label>
          <Input className="mt-1 h-7 text-xs" value={preCalChecks.notes}
            onChange={e => setPreCalChecks(p => ({ ...p, notes: e.target.value }))}
            placeholder="Any conditions to note before calibration…" />
        </div>
      </div>}

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

      {/* ── External Lab Section (external only) ── */}
      {calType === "external" && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-accent" /> External Calibration Laboratory
              </p>
              <p className="text-[11px] text-muted-foreground">Select the accredited lab from your registry or add a new one</p>
            </div>
          </div>
          <div className="p-3 space-y-3">
            {/* Lab selector */}
            <div>
              <Label className="text-sm font-semibold">Lab</Label>
              <Select
                value={showAddLab ? "__add__" : (selectedLabId ? String(selectedLabId) : "__none__")}
                onValueChange={v => {
                  if (v === "__add__") { setShowAddLab(true); setSelectedLabId(null); }
                  else if (v === "__none__") { setShowAddLab(false); setSelectedLabId(null); }
                  else { setShowAddLab(false); setSelectedLabId(Number(v)); }
                }}>
                <SelectTrigger className="mt-1 h-9" data-testid="select-lab">
                  <SelectValue placeholder="Select a lab…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No lab selected —</SelectItem>
                  {labs.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name}{l.accreditationNumber ? ` (${l.accreditationNumber})` : ""}</SelectItem>
                  ))}
                  {onCreateLab && (
                    <SelectItem value="__add__" className="text-accent font-medium">+ Add new lab to registry…</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected lab details */}
            {selectedLab && !showAddLab && (
              <div className={`rounded-lg border p-3 text-sm space-y-1 ${
                labCertExpired ? "bg-red-50 border-red-200" :
                labCertDaysDue !== null && labCertDaysDue <= 30 ? "bg-amber-50 border-amber-200" :
                "bg-emerald-50 border-emerald-200"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{selectedLab.name}</p>
                    {selectedLab.accreditationBody && (
                      <p className="text-xs text-muted-foreground">{selectedLab.accreditationBody}{selectedLab.accreditationNumber ? ` · ${selectedLab.accreditationNumber}` : ""}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {selectedLab.iso17025CertUrl ? (
                      <Badge className={`text-[10px] ${labCertExpired ? "bg-red-100 text-red-700 border-red-200" : labCertDaysDue !== null && labCertDaysDue <= 30 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                        {labCertExpired ? "ISO 17025 Cert EXPIRED" : labCertDaysDue !== null && labCertDaysDue <= 30 ? `ISO 17025 Cert Expiring ${labCertDaysDue}d` : "ISO 17025 Cert ✓"}
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-slate-100 text-slate-500 border-slate-300">No 17025 cert on file</Badge>
                    )}
                  </div>
                </div>
                {selectedLab.certExpiryDate && (
                  <p className="text-xs text-muted-foreground">Cert expires: {selectedLab.certExpiryDate}</p>
                )}
                {selectedLab.scope && (
                  <p className="text-xs text-muted-foreground">Scope: {selectedLab.scope}</p>
                )}
                {selectedLab.contactName && (
                  <p className="text-xs text-muted-foreground">Contact: {selectedLab.contactName}{selectedLab.contactEmail ? ` · ${selectedLab.contactEmail}` : ""}</p>
                )}
                {/* 17025 cert upload for this lab */}
                {onUploadLabCert && (
                  <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2">
                    <input type="file" ref={labCertInputRef} accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f || !selectedLab) return;
                        setLabCertUploading(true);
                        try {
                          await onUploadLabCert(selectedLab.id, f);
                          toast({ title: "ISO 17025 certificate uploaded" });
                        } catch {
                          toast({ title: "Upload failed", variant: "destructive" });
                        } finally { setLabCertUploading(false); }
                      }} />
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
                      disabled={labCertUploading}
                      onClick={() => labCertInputRef.current?.click()}>
                      <FileUp className="w-3 h-3" />
                      {selectedLab.iso17025CertUrl ? "Replace 17025 Cert" : "Upload 17025 Cert"}
                    </Button>
                    {selectedLab.iso17025CertUrl && (
                      <a href={`/api/calibration/labs/${selectedLab.id}/iso17025`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-accent underline">
                        <Download className="w-3 h-3" /> View cert
                      </a>
                    )}
                    {labCertUploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
                  </div>
                )}
              </div>
            )}

            {/* Scope Coverage Verification (only when a lab is selected) */}
            {selectedLab && !showAddLab && (
              <div className={`rounded-lg border p-3 space-y-2.5 ${scopeVerified ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}`}>
                <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 text-amber-800">
                  <FileCheck className="w-3.5 h-3.5" /> ISO 17025 Scope Coverage Verification
                </p>

                {/* No scope items on file — warning */}
                {(!selectedLab.scopeItems || selectedLab.scopeItems.length === 0) && (
                  <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100 rounded p-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>No structured scope items are on file for this lab. Verify manually that their ISO 17025 certificate covers this equipment type and measurement range before proceeding.</span>
                  </div>
                )}

                {/* Scope items table — when available */}
                {selectedLab.scopeItems && selectedLab.scopeItems.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Select the scope line item that covers this calibration:</p>
                    <div className="border border-border/60 rounded overflow-hidden text-xs">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] bg-muted/50 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <div className="px-2 py-1.5">Discipline</div>
                        <div className="px-2 py-1.5">Range Min</div>
                        <div className="px-2 py-1.5">Range Max</div>
                        <div className="px-2 py-1.5">Unit</div>
                        <div className="px-2 py-1.5">CMC Uncertainty</div>
                      </div>
                      {selectedLab.scopeItems.map(si => (
                        <button key={si.id} type="button"
                          onClick={() => setScopeCitedItem(`${si.discipline}: ${si.rangeMin}–${si.rangeMax} ${si.unit}${si.cmc ? ` (CMC: ${si.cmc})` : ""}`)}
                          className={`w-full grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] border-t border-border/40 hover:bg-accent/5 transition-colors text-left ${scopeCitedItem.startsWith(si.discipline) ? "bg-accent/10 font-semibold" : ""}`}>
                          <div className="px-2 py-1.5">{si.discipline}</div>
                          <div className="px-2 py-1.5 font-mono">{si.rangeMin || "—"}</div>
                          <div className="px-2 py-1.5 font-mono">{si.rangeMax || "—"}</div>
                          <div className="px-2 py-1.5">{si.unit || "—"}</div>
                          <div className="px-2 py-1.5 font-mono">{si.cmc || "—"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual scope citation text input */}
                <div>
                  <Label className="text-xs font-semibold">Cited Scope Item / Notes</Label>
                  <Input className="mt-1 h-8 text-xs"
                    value={scopeCitedItem}
                    onChange={e => setScopeCitedItem(e.target.value)}
                    placeholder="e.g. Dimensional: 0–300 mm (CMC: ±0.5 μm) — click a row above to auto-fill"
                    data-testid="input-scope-cited-item" />
                </div>

                {/* Scope Verified checkbox */}
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="mt-0.5 accent-accent w-4 h-4"
                    checked={scopeVerified}
                    onChange={e => setScopeVerified(e.target.checked)}
                    data-testid="checkbox-scope-verified" />
                  <span className={`text-xs leading-snug ${scopeVerified ? "text-emerald-800 font-semibold" : "text-foreground"}`}>
                    I confirm that the lab's current ISO 17025 scope of accreditation covers the measurement discipline, type, and range for this calibration. {!scopeVerified && <span className="text-amber-700 font-semibold">(Required)</span>}
                  </span>
                </label>
              </div>
            )}

            {/* Add new lab inline form */}
            {showAddLab && onCreateLab && (
              <div className="border border-accent/30 rounded-lg p-3 bg-accent/5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-accent">New Lab</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold">Lab Name *</Label>
                    <Input className="mt-1 h-8" value={addLabForm.name}
                      onChange={e => setAddLabForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Trescal, Inc." />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Accreditation Body</Label>
                    <Select value={addLabForm.accreditationBody}
                      onValueChange={v => setAddLabForm(f => ({ ...f, accreditationBody: v }))}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["A2LA", "NVLAP", "ILAC", "UKAS", "DAkkS", "COFRAC", "NABL", "Other"].map(o => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Accreditation Number</Label>
                    <Input className="mt-1 h-8" value={addLabForm.accreditationNumber}
                      onChange={e => setAddLabForm(f => ({ ...f, accreditationNumber: e.target.value }))}
                      placeholder="e.g. 1384.01" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">17025 Cert Expiry</Label>
                    <Input type="date" className="mt-1 h-8" value={addLabForm.certExpiryDate}
                      onChange={e => setAddLabForm(f => ({ ...f, certExpiryDate: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Contact Name</Label>
                    <Input className="mt-1 h-8" value={addLabForm.contactName}
                      onChange={e => setAddLabForm(f => ({ ...f, contactName: e.target.value }))}
                      placeholder="e.g. Jane Smith" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold">Scope of Accreditation</Label>
                    <Input className="mt-1 h-8" value={addLabForm.scope}
                      onChange={e => setAddLabForm(f => ({ ...f, scope: e.target.value }))}
                      placeholder="e.g. Dimensional, Torque, Pressure, Electrical" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold">Contact Email</Label>
                    <Input className="mt-1 h-8 col-span-2" value={addLabForm.contactEmail}
                      onChange={e => setAddLabForm(f => ({ ...f, contactEmail: e.target.value }))}
                      placeholder="lab@example.com" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm"
                    className="bg-accent hover:bg-accent/90 text-white h-8 text-xs"
                    disabled={!addLabForm.name.trim()}
                    onClick={async () => {
                      if (!addLabForm.name.trim()) return;
                      try {
                        const created = await onCreateLab({ ...addLabForm, isoProjectId });
                        setSelectedLabId(created.id);
                        setShowAddLab(false);
                        toast({ title: "Lab added to registry", description: created.name });
                      } catch {
                        toast({ title: "Failed to add lab", variant: "destructive" });
                      }
                    }}>
                    Save Lab to Registry
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs"
                    onClick={() => setShowAddLab(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Environmental Conditions (Internal only) ── */}
      {calType === "internal" && <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/10">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-blue-500" /> Environmental Conditions
          <span className="text-[10px] font-normal text-muted-foreground normal-case tracking-normal ml-1">Temperature must be 68°F / 20°C per ANSI standard for dimensional measurement</span>
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-semibold">Temperature</Label>
            <div className="flex gap-1 mt-1">
              <Input className="h-7 text-xs" value={form.environmentConditions?.match(/Temp:\s*([^\s,]+)/)?.[1] ?? ""}
                onChange={e => {
                  const cur = form.environmentConditions ?? "";
                  const next = cur.includes("Temp:") ? cur.replace(/Temp:\s*[^\s,]+/, `Temp: ${e.target.value}`) : `Temp: ${e.target.value}${cur ? ", " + cur : ""}`;
                  set("environmentConditions")(next);
                }}
                placeholder="e.g. 68°F" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">Humidity (RH %)</Label>
            <Input className="h-7 text-xs mt-1" value={form.environmentConditions?.match(/Humidity:\s*([^\s,]+)/)?.[1] ?? ""}
              onChange={e => {
                const cur = form.environmentConditions ?? "";
                const next = cur.includes("Humidity:") ? cur.replace(/Humidity:\s*[^\s,]+/, `Humidity: ${e.target.value}`) : (cur ? cur + `, Humidity: ${e.target.value}` : `Humidity: ${e.target.value}`);
                set("environmentConditions")(next);
              }}
              placeholder="e.g. 45%" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Other Conditions</Label>
            <Input className="h-7 text-xs mt-1" value={form.environmentConditions?.replace(/Temp:\s*[^\s,]+,?\s*/, "").replace(/Humidity:\s*[^\s,]+,?\s*/, "").trim() ?? ""}
              onChange={e => {
                const cur = form.environmentConditions ?? "";
                const tempPart = cur.match(/Temp:\s*[^\s,]+/)?.[0] ?? "";
                const humPart = cur.match(/Humidity:\s*[^\s,]+/)?.[0] ?? "";
                const parts = [tempPart, humPart, e.target.value].filter(Boolean);
                set("environmentConditions")(parts.join(", "));
              }}
              placeholder="e.g. vibration-free surface" />
          </div>
        </div>
      </div>}

      {/* ── Reference Standards Used (Internal only) ── */}
      {calType === "internal" && <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-accent" /> Reference Standards Used
            </p>
            <p className="text-[11px] text-muted-foreground">Gage blocks, masters, or any reference artifacts used during this calibration</p>
          </div>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0"
            onClick={() => setRefStds(p => [...p, newRefStd()])}>
            <Plus className="w-3 h-3" /> Add Standard
          </Button>
        </div>
        {refStds.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-3 py-3 text-center">No reference standards added — click "Add Standard" to record the gage blocks or masters used.</p>
        )}
        {refStds.map((std, idx) => (
          <div key={std.id} className={`border-t border-border/40 px-3 py-2 grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1fr_28px] gap-2 items-end ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Description</Label>
              <Input className="h-7 text-xs mt-0.5" value={std.description}
                onChange={e => updateRefStd(std.id, "description", e.target.value)}
                placeholder="e.g. Grade 2 Gage Block Set, 81-pc" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">ID / Set No.</Label>
              <Input className="h-7 text-xs mt-0.5" value={std.identification}
                onChange={e => updateRefStd(std.id, "identification", e.target.value)}
                placeholder="e.g. GB-001" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cert Number</Label>
              <Input className="h-7 text-xs mt-0.5" value={std.certNumber}
                onChange={e => updateRefStd(std.id, "certNumber", e.target.value)}
                placeholder="e.g. CERT-2024-101" />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Cert Expiry</Label>
              <Input type="date" className="h-7 text-xs mt-0.5" value={std.certDueDate}
                onChange={e => updateRefStd(std.id, "certDueDate", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Traceable To</Label>
              <Select value={std.traceability} onValueChange={v => updateRefStd(std.id, "traceability", v)}>
                <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRACE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <button type="button" onClick={() => setRefStds(p => p.filter(r => r.id !== std.id))}
              className="mb-0.5 text-muted-foreground hover:text-red-600 p-1 rounded hover:bg-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>}

      {/* ── Measurement Data Table (Internal only) ── */}
      {calType === "internal" && <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-accent" /> Measurement Data — Variable Gage Readings
            </p>
            <p className="text-[11px] text-muted-foreground">
              One row per gage block / reference checkpoint across the instrument range.
              Average and error auto-calculate from trial readings.{" "}
              {equipment.tolerance && <span className="font-medium text-foreground">Tolerance: {equipment.tolerance}</span>}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0"
            onClick={() => setMeasData(p => [...p, newMeasRow()])}>
            <Plus className="w-3 h-3" /> Add Row
          </Button>
        </div>
        {/* Table header */}
        <div className="grid grid-cols-[1.4fr_60px_80px_80px_80px_75px_80px_48px_28px] gap-0 border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <div className="px-2 py-1.5">Nominal (Ref Std Value)</div>
          <div className="px-1 py-1.5">Unit</div>
          <div className="px-1 py-1.5">Trial 1</div>
          <div className="px-1 py-1.5">Trial 2</div>
          <div className="px-1 py-1.5">Trial 3</div>
          <div className="px-1 py-1.5">Average</div>
          <div className="px-1 py-1.5">Error</div>
          <div className="px-1 py-1.5 text-center">Pass</div>
          <div />
        </div>
        {measData.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-3 py-3 text-center">
            No measurement points yet — click "Add Row" for each gage block checkpoint across the instrument range.
          </p>
        )}
        {measData.map((row, idx) => {
          const { avg, err } = calcRowStats(row);
          const errStr = err !== null ? ((err >= 0 ? "+" : "") + err.toFixed(5).replace(/0+$/, "").replace(/\.$/, "")) : "—";
          const avgStr = avg !== null ? avg.toFixed(5).replace(/0+$/, "").replace(/\.$/, "") : "—";
          return (
            <div key={row.id}
              className={`grid grid-cols-[1.4fr_60px_80px_80px_80px_75px_80px_48px_28px] gap-0 items-center border-b border-border/40 last:border-0 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
              <div className="px-2 py-1">
                <Input className="h-6 text-xs font-mono" value={row.nominalValue}
                  onChange={e => updateMeasRow(row.id, "nominalValue", e.target.value)}
                  placeholder="e.g. 1.0000" />
              </div>
              <div className="px-1 py-1">
                <Select value={row.unit} onValueChange={v => updateMeasRow(row.id, "unit", v)}>
                  <SelectTrigger className="h-6 text-xs px-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="px-1 py-1">
                <Input className="h-6 text-xs font-mono" value={row.trial1}
                  onChange={e => updateMeasRow(row.id, "trial1", e.target.value)} placeholder="—" />
              </div>
              <div className="px-1 py-1">
                <Input className="h-6 text-xs font-mono" value={row.trial2}
                  onChange={e => updateMeasRow(row.id, "trial2", e.target.value)} placeholder="—" />
              </div>
              <div className="px-1 py-1">
                <Input className="h-6 text-xs font-mono" value={row.trial3}
                  onChange={e => updateMeasRow(row.id, "trial3", e.target.value)} placeholder="—" />
              </div>
              <div className="px-2 py-1 text-xs font-mono text-muted-foreground">{avgStr}</div>
              <div className={`px-2 py-1 text-xs font-mono font-semibold ${err === null ? "text-muted-foreground" : row.withinTolerance ? "text-emerald-700" : "text-red-600"}`}>
                {errStr}
              </div>
              <div className="px-2 py-1 flex justify-center">
                <input type="checkbox" checked={!!row.withinTolerance}
                  onChange={e => updateMeasRow(row.id, "withinTolerance", e.target.checked)}
                  title="Within tolerance"
                  className="w-4 h-4 accent-orange-500" />
              </div>
              <div className="py-1 flex justify-center">
                <button type="button" onClick={() => setMeasData(p => p.filter(r => r.id !== row.id))}
                  className="text-muted-foreground hover:text-red-600 p-0.5 rounded hover:bg-muted">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {measData.length > 0 && (
          <div className="px-3 py-2 border-t border-border/40 bg-muted/10 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              {measData.filter(r => r.withinTolerance).length}/{measData.length} points within tolerance
            </span>
            {measData.some(r => !r.withinTolerance) && (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {measData.filter(r => !r.withinTolerance).length} point(s) out of tolerance — consider marking result as Fail
              </span>
            )}
            {measData.length > 0 && measData.every(r => r.withinTolerance) && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All points within tolerance
              </span>
            )}
          </div>
        )}
      </div>}

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

// ─── Lab Form ─────────────────────────────────────────────────────────────────

const EMPTY_LAB: Partial<CalibrationLab> = {
  name: "", accreditationBody: "A2LA", accreditationNumber: "",
  certExpiryDate: "", scope: "", contactName: "", contactEmail: "", contactPhone: "",
};

const SCOPE_DISCIPLINES = [
  "Dimensional / Mechanical", "Temperature", "Electrical / Electronic",
  "Pressure / Vacuum", "Mass / Weighing", "Flow", "Torque / Force",
  "Acoustic / Vibration", "Optical / Photometric", "Chemical / pH",
  "Humidity", "Time / Frequency", "RF / Microwave", "Other",
];

function LabForm({ initial, isoProjectId, onSave, onCancel, onUploadCert }: {
  initial?: Partial<CalibrationLab>;
  isoProjectId?: number | null;
  onSave: (data: Partial<CalibrationLab>) => Promise<void>;
  onCancel: () => void;
  onUploadCert?: (labId: number, file: File) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<CalibrationLab>>({ ...EMPTY_LAB, ...initial });
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>(
    (initial?.scopeItems as ScopeItem[] | undefined) ?? []
  );
  const [certFile, setCertFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const certFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const set = <K extends keyof CalibrationLab>(k: K) => (v: CalibrationLab[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  function addScopeRow() {
    setScopeItems(prev => [...prev, {
      id: `si-${Date.now()}`, discipline: "Dimensional / Mechanical",
      rangeMin: "", rangeMax: "", unit: "mm", cmc: "",
    }]);
  }

  function updateScopeRow(id: string, field: keyof ScopeItem, value: string) {
    setScopeItems(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function removeScopeRow(id: string) {
    setScopeItems(prev => prev.filter(r => r.id !== id));
  }

  async function handleSubmit() {
    if (!form.name?.trim()) {
      toast({ title: "Lab name is required", variant: "destructive" }); return;
    }
    await onSave({ ...form, scopeItems: scopeItems.length > 0 ? scopeItems : null, isoProjectId });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Lab Name *</Label>
          <Input className="mt-1 h-8" value={form.name ?? ""}
            onChange={e => set("name")(e.target.value)} placeholder="e.g. Trescal, Inc." data-testid="input-lab-name" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Accreditation Body</Label>
          <Select value={form.accreditationBody ?? "A2LA"}
            onValueChange={v => set("accreditationBody")(v)}>
            <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["A2LA", "NVLAP", "ILAC", "UKAS", "DAkkS", "COFRAC", "NABL", "Other"].map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Accreditation Number</Label>
          <Input className="mt-1 h-8" value={form.accreditationNumber ?? ""}
            onChange={e => set("accreditationNumber")(e.target.value)} placeholder="e.g. 1384.01" />
        </div>
        <div>
          <Label className="text-sm font-semibold">ISO 17025 Cert Expiry</Label>
          <Input type="date" className="mt-1 h-8" value={form.certExpiryDate ?? ""}
            onChange={e => set("certExpiryDate")(e.target.value)} data-testid="input-lab-cert-expiry" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Contact Name</Label>
          <Input className="mt-1 h-8" value={form.contactName ?? ""}
            onChange={e => set("contactName")(e.target.value)} placeholder="e.g. Jane Smith" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Contact Email</Label>
          <Input className="mt-1 h-8" value={form.contactEmail ?? ""}
            onChange={e => set("contactEmail")(e.target.value)} placeholder="lab@example.com" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Contact Phone</Label>
          <Input className="mt-1 h-8" value={form.contactPhone ?? ""}
            onChange={e => set("contactPhone")(e.target.value)} placeholder="e.g. +1 (800) 555-0000" />
        </div>
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Scope Summary (text)</Label>
          <Textarea className="mt-1 resize-none" rows={2} value={form.scope ?? ""}
            onChange={e => set("scope")(e.target.value)}
            placeholder="e.g. Dimensional, Torque, Pressure, Temperature, Electrical…" />
          <p className="text-[11px] text-muted-foreground mt-0.5">Free-text summary. For structured scope verification, add scope line items below.</p>
        </div>
        {/* ISO 17025 cert upload (only when editing an existing lab) */}
        {initial?.id && onUploadCert && (
          <div className="col-span-2">
            <Label className="text-sm font-semibold">ISO 17025 Accreditation Certificate</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="file" ref={certFileRef} accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setCertFile(e.target.files?.[0] ?? null)} />
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs gap-1"
                onClick={() => certFileRef.current?.click()}>
                <FileUp className="w-3 h-3" />
                {form.iso17025CertUrl ? "Replace Certificate" : "Upload Certificate"}
              </Button>
              {certFile && <span className="text-xs text-muted-foreground">{certFile.name}</span>}
              {form.iso17025CertUrl && !certFile && (
                <a href={`/api/calibration/labs/${initial.id}/iso17025`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-accent underline">
                  <Download className="w-3 h-3" /> View current cert
                </a>
              )}
              {certFile && initial?.id && (
                <Button type="button" size="sm" variant="outline" className="h-8 text-xs gap-1 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  disabled={uploading}
                  onClick={async () => {
                    if (!certFile || !initial?.id) return;
                    setUploading(true);
                    try {
                      await onUploadCert(initial.id, certFile);
                      setCertFile(null);
                      toast({ title: "ISO 17025 certificate uploaded" });
                    } catch {
                      toast({ title: "Upload failed", variant: "destructive" });
                    } finally { setUploading(false); }
                  }}>
                  {uploading ? "Uploading…" : "Upload Now"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Structured Scope Line Items ── */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-accent" /> ISO 17025 Scope Line Items
            </p>
            <p className="text-[11px] text-muted-foreground">Enter each measurement discipline covered by this lab's accreditation. These are used for scope verification when logging external calibrations.</p>
          </div>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0"
            onClick={addScopeRow} data-testid="button-add-scope-item">
            <Plus className="w-3 h-3" /> Add Item
          </Button>
        </div>

        {scopeItems.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground bg-amber-50/50">
            <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            No scope items defined — technicians will see a warning during scope verification when using this lab.
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[2fr_80px_80px_70px_1.2fr_28px] bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-t border-border">
              <div className="px-2 py-1.5">Measurement Discipline</div>
              <div className="px-2 py-1.5">Range Min</div>
              <div className="px-2 py-1.5">Range Max</div>
              <div className="px-2 py-1.5">Unit</div>
              <div className="px-2 py-1.5">CMC Uncertainty</div>
              <div />
            </div>
            {scopeItems.map((si, idx) => (
              <div key={si.id}
                className={`grid grid-cols-[2fr_80px_80px_70px_1.2fr_28px] border-t border-border/40 items-center ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                <div className="px-1.5 py-1">
                  <Select value={si.discipline} onValueChange={v => updateScopeRow(si.id, "discipline", v)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCOPE_DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="px-1 py-1">
                  <Input className="h-7 text-xs font-mono" value={si.rangeMin}
                    onChange={e => updateScopeRow(si.id, "rangeMin", e.target.value)}
                    placeholder="0" data-testid={`input-scope-range-min-${idx}`} />
                </div>
                <div className="px-1 py-1">
                  <Input className="h-7 text-xs font-mono" value={si.rangeMax}
                    onChange={e => updateScopeRow(si.id, "rangeMax", e.target.value)}
                    placeholder="300" data-testid={`input-scope-range-max-${idx}`} />
                </div>
                <div className="px-1 py-1">
                  <Input className="h-7 text-xs" value={si.unit}
                    onChange={e => updateScopeRow(si.id, "unit", e.target.value)}
                    placeholder="mm" />
                </div>
                <div className="px-1 py-1">
                  <Input className="h-7 text-xs font-mono" value={si.cmc}
                    onChange={e => updateScopeRow(si.id, "cmc", e.target.value)}
                    placeholder="e.g. ±0.5 μm" />
                </div>
                <div className="flex items-center justify-center">
                  <button type="button" onClick={() => removeScopeRow(si.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSubmit}
          className="bg-accent hover:bg-accent/90 text-white" data-testid="button-save-lab">
          {initial?.id ? "Update Lab" : "Add Lab to Registry"}
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
  const [labRegistryDialog, setLabRegistryDialog] = useState(false);
  const [editLabTarget, setEditLabTarget] = useState<CalibrationLab | null>(null);
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

  const labsUrl = projectId ? `/api/calibration/labs?isoProjectId=${projectId}` : "/api/calibration/labs";
  const { data: labs = [] } = useQuery<CalibrationLab[]>({
    queryKey: ["/api/calibration/labs", projectId],
    queryFn: () => fetch(labsUrl, { credentials: "include" }).then(r => r.json()),
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

  const createLab = useMutation({
    mutationFn: async (d: Partial<CalibrationLab>) => {
      const res = await apiRequest("POST", "/api/calibration/labs", d);
      return res.json() as Promise<CalibrationLab>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/calibration/labs", projectId] }),
  });

  const updateLab = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CalibrationLab> }) => {
      const res = await apiRequest("PATCH", `/api/calibration/labs/${id}`, data);
      return res.json() as Promise<CalibrationLab>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/calibration/labs", projectId] }),
  });

  const deleteLab = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/calibration/labs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/calibration/labs", projectId] }),
  });

  async function handleCreateLab(data: Partial<CalibrationLab>): Promise<CalibrationLab> {
    return createLab.mutateAsync(data);
  }

  async function handleUploadLabCert(labId: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/calibration/labs/${labId}/iso17025`, {
      method: "POST", credentials: "include", body: fd,
    });
    if (!res.ok) throw new Error("Lab cert upload failed");
    qc.invalidateQueries({ queryKey: ["/api/calibration/labs", projectId] });
  }

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
            { key: "labs", label: `Labs Registry${labs.length > 0 ? ` (${labs.length})` : ""}`, icon: Building2 },
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

          {/* ── Labs Registry Tab ── */}
          {tab === "labs" && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">External Calibration Lab Registry</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ISO 17025-accredited laboratories used for external calibration. Track accreditation status and link ISO 17025 certificates.
                  </p>
                </div>
                <Button size="sm"
                  className="bg-accent hover:bg-accent/90 text-white shrink-0"
                  onClick={() => setLabRegistryDialog(true)}
                  data-testid="button-add-lab">
                  <Plus className="w-4 h-4 mr-1" /> Add Lab
                </Button>
              </div>

              {labs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No labs registered yet</p>
                  <p className="text-xs mt-1">Add external calibration labs to track their ISO 17025 accreditation status.</p>
                </div>
              )}

              {labs.map(lab => {
                const certExpired = lab.certExpiryDate ? new Date(lab.certExpiryDate) < new Date() : false;
                const daysDue = lab.certExpiryDate ? Math.ceil((new Date(lab.certExpiryDate).getTime() - Date.now()) / 86400000) : null;
                return (
                  <Card key={lab.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{lab.name}</span>
                            {lab.iso17025CertUrl ? (
                              <Badge className={`text-[10px] ${certExpired ? "bg-red-100 text-red-700 border-red-200" : daysDue !== null && daysDue <= 30 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                                {certExpired ? "ISO 17025 EXPIRED" : daysDue !== null && daysDue <= 30 ? `ISO 17025 Expiring ${daysDue}d` : "ISO 17025 Accredited ✓"}
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] bg-slate-100 text-slate-500 border-slate-300">No 17025 cert on file</Badge>
                            )}
                          </div>
                          {lab.accreditationBody && (
                            <p className="text-xs text-muted-foreground">{lab.accreditationBody}{lab.accreditationNumber ? ` · ${lab.accreditationNumber}` : ""}</p>
                          )}
                          {lab.certExpiryDate && (
                            <p className="text-xs text-muted-foreground">Cert expires: {lab.certExpiryDate}</p>
                          )}
                          {/* Scope coverage badge */}
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            {lab.scopeItems && (lab.scopeItems as ScopeItem[]).length > 0 ? (
                              <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                {(lab.scopeItems as ScopeItem[]).length} Scope Item{(lab.scopeItems as ScopeItem[]).length !== 1 ? "s" : ""} Configured
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Scope Not Configured
                              </Badge>
                            )}
                          </div>
                          {lab.scope && (
                            <p className="text-xs text-muted-foreground">Scope: {lab.scope}</p>
                          )}
                          {lab.contactName && (
                            <p className="text-xs text-muted-foreground">Contact: {lab.contactName}{lab.contactEmail ? ` · ${lab.contactEmail}` : ""}</p>
                          )}
                        </div>
                        <div className="flex items-start gap-2 shrink-0">
                          {lab.iso17025CertUrl && (
                            <a href={`/api/calibration/labs/${lab.id}/iso17025`} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                <Download className="w-3 h-3" /> 17025 Cert
                              </Button>
                            </a>
                          )}
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                            onClick={() => { setEditLabTarget(lab); setLabRegistryDialog(true); }}
                            data-testid={`button-edit-lab-${lab.id}`}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteLab.mutate(lab.id)}
                            data-testid={`button-delete-lab-${lab.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </ScrollArea>

      {/* ── Dialogs ── */}

      <Dialog open={equipDialog} onOpenChange={v => { setEquipDialog(v); if (!v) setEditEquip(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

                {/* Cal Type + Lab */}
                {(() => {
                  const calTypeLab = labs.find(l => l.id === r.labId);
                  return (
                    <div className="flex flex-wrap gap-2 items-start">
                      <Badge className={`text-xs ${r.calType === "internal" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                        {r.calType === "internal" ? "Internal Calibration" : "External Calibration"}
                      </Badge>
                      {calTypeLab && (
                        <div className={`flex-1 rounded-lg border p-2.5 text-xs space-y-0.5 ${
                          calTypeLab.certExpiryDate && new Date(calTypeLab.certExpiryDate) < new Date() ? "bg-red-50 border-red-200" :
                          "bg-purple-50 border-purple-100"
                        }`}>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-purple-600" /> {calTypeLab.name}
                            {calTypeLab.iso17025CertUrl ? (
                              <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 ml-1">ISO 17025 ✓</Badge>
                            ) : (
                              <Badge className="text-[10px] bg-slate-100 text-slate-500 ml-1">No 17025 cert</Badge>
                            )}
                          </div>
                          {calTypeLab.accreditationBody && (
                            <p className="text-muted-foreground">{calTypeLab.accreditationBody}{calTypeLab.accreditationNumber ? ` · ${calTypeLab.accreditationNumber}` : ""}</p>
                          )}
                          {calTypeLab.certExpiryDate && (
                            <p className="text-muted-foreground">Cert expires: {calTypeLab.certExpiryDate}</p>
                          )}
                          {calTypeLab.iso17025CertUrl && (
                            <a href={`/api/calibration/labs/${calTypeLab.id}/iso17025`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-accent underline mt-1">
                              <Download className="w-3 h-3" /> View ISO 17025 Certificate
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Scope Coverage Evidence (external only) */}
                {r.calType === "external" && r.labId && (
                  <div className={`rounded-lg border p-3 space-y-1.5 text-sm ${r.scopeVerified ? "bg-emerald-50/40 border-emerald-200" : "bg-amber-50/40 border-amber-200"}`}>
                    <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 text-muted-foreground">
                      <FileCheck className="w-3.5 h-3.5" /> ISO 17025 Scope Coverage
                    </p>
                    <p>
                      Scope Verified:{" "}
                      <span className={r.scopeVerified ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                        {r.scopeVerified ? "Yes ✓" : "Not recorded"}
                      </span>
                    </p>
                    {r.scopeCitedItem && (
                      <p><span className="font-medium">Cited Scope Item:</span> {r.scopeCitedItem}</p>
                    )}
                  </div>
                )}

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

                {/* Pre-Calibration Checks */}
                {(() => {
                  const p = r.preCalibrationChecks as PreCalChecks | undefined | null;
                  if (!p) return null;
                  return (
                    <div className="border border-border rounded-lg p-3 bg-muted/10 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Pre-Calibration Checks
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {[
                          ["Visual Inspection", p.visualInspectionPass],
                          ["Zero / Master Check", p.zeroCheckPass],
                          ["Equipment Clean", p.equipmentClean],
                        ].map(([lbl, val]) => (
                          <span key={String(lbl)} className={val ? "text-emerald-700 font-medium" : "text-muted-foreground"}>
                            {val ? "✓" : "✗"} {String(lbl)}
                          </span>
                        ))}
                      </div>
                      {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                    </div>
                  );
                })()}

                {/* Environmental Conditions */}
                {r.environmentConditions && (
                  <div className="border border-border rounded-lg p-3 bg-muted/10">
                    <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1">
                      <Thermometer className="w-3.5 h-3.5 text-blue-500" /> Environmental Conditions
                    </p>
                    <p className="text-sm">{r.environmentConditions}</p>
                  </div>
                )}

                {/* Reference Standards Used */}
                {(() => {
                  const stds = r.referenceStandards as ReferenceStandard[] | undefined | null;
                  if (!stds || stds.length === 0) return null;
                  return (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-muted/40 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-accent" /> Reference Standards Used
                        </p>
                      </div>
                      <div className="divide-y divide-border/40">
                        {stds.map(std => (
                          <div key={std.id} className="px-3 py-2 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-x-4 gap-y-0.5 text-xs">
                            <div><span className="font-medium">{std.description || "—"}</span></div>
                            <div><span className="text-muted-foreground">ID:</span> {std.identification || "—"}</div>
                            <div><span className="text-muted-foreground">Cert:</span> {std.certNumber || "—"}</div>
                            <div><span className="text-muted-foreground">Exp:</span> {std.certDueDate || "—"}</div>
                            <div><span className="text-muted-foreground">Trace:</span> {std.traceability || "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Measurement Data */}
                {(() => {
                  const rows = r.measurementData as MeasurementPoint[] | undefined | null;
                  if (!rows || rows.length === 0) return null;
                  return (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-muted/40 px-3 py-2">
                        <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5 text-accent" /> Measurement Data
                        </p>
                      </div>
                      {/* Header */}
                      <div className="grid grid-cols-[1.4fr_55px_70px_70px_70px_75px_80px_50px] gap-0 border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        <div className="px-2 py-1.5">Nominal</div>
                        <div className="px-1 py-1.5">Unit</div>
                        <div className="px-1 py-1.5">Trial 1</div>
                        <div className="px-1 py-1.5">Trial 2</div>
                        <div className="px-1 py-1.5">Trial 3</div>
                        <div className="px-1 py-1.5">Average</div>
                        <div className="px-1 py-1.5">Error</div>
                        <div className="px-1 py-1.5 text-center">Pass</div>
                      </div>
                      {rows.map((row, idx) => {
                        const { avg, err } = calcRowStats(row);
                        const avgStr = avg !== null ? avg.toFixed(5).replace(/0+$/, "").replace(/\.$/, "") : "—";
                        const errStr = err !== null ? ((err >= 0 ? "+" : "") + err.toFixed(5).replace(/0+$/, "").replace(/\.$/, "")) : "—";
                        return (
                          <div key={row.id}
                            className={`grid grid-cols-[1.4fr_55px_70px_70px_70px_75px_80px_50px] gap-0 items-center border-b border-border/40 last:border-0 text-xs ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                            <div className="px-2 py-1.5 font-mono font-semibold">{row.nominalValue || "—"}</div>
                            <div className="px-1 py-1.5 text-muted-foreground">{row.unit}</div>
                            <div className="px-1 py-1.5 font-mono">{row.trial1 || "—"}</div>
                            <div className="px-1 py-1.5 font-mono">{row.trial2 || "—"}</div>
                            <div className="px-1 py-1.5 font-mono">{row.trial3 || "—"}</div>
                            <div className="px-1 py-1.5 font-mono text-muted-foreground">{avgStr}</div>
                            <div className={`px-1 py-1.5 font-mono font-semibold ${err === null ? "text-muted-foreground" : row.withinTolerance ? "text-emerald-700" : "text-red-600"}`}>{errStr}</div>
                            <div className="px-1 py-1.5 text-center">
                              <span className={row.withinTolerance ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                                {row.withinTolerance ? "✓" : "✗"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="px-3 py-1.5 border-t border-border/40 bg-muted/10 text-xs text-muted-foreground">
                        {rows.filter(r2 => r2.withinTolerance).length}/{rows.length} points within tolerance
                        {rows.some(r2 => !r2.withinTolerance) && (
                          <span className="text-red-600 font-semibold ml-3">
                            {rows.filter(r2 => !r2.withinTolerance).length} point(s) out of tolerance
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              labs={labs}
              onCreateLab={handleCreateLab}
              onUploadLabCert={handleUploadLabCert}
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

      {/* ── Lab Registry Dialog ── */}
      <Dialog open={labRegistryDialog} onOpenChange={v => { setLabRegistryDialog(v); if (!v) setEditLabTarget(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editLabTarget ? "Edit Lab" : "Add Lab to Registry"}</DialogTitle>
          </DialogHeader>
          <LabForm
            initial={editLabTarget ?? undefined}
            isoProjectId={project?.id}
            onSave={async (data) => {
              if (editLabTarget) {
                await updateLab.mutateAsync({ id: editLabTarget.id, data });
                toast({ title: "Lab updated" });
              } else {
                await handleCreateLab(data);
                toast({ title: "Lab added to registry" });
              }
              setLabRegistryDialog(false);
              setEditLabTarget(null);
            }}
            onCancel={() => { setLabRegistryDialog(false); setEditLabTarget(null); }}
            onUploadCert={handleUploadLabCert}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRecord} onOpenChange={v => { if (!v) { setEditRecord(null); setEditRecordEquip(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              labs={labs}
              onCreateLab={handleCreateLab}
              onUploadLabCert={handleUploadLabCert}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
