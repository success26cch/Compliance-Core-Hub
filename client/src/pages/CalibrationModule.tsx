import { useState, useEffect, useRef, useMemo } from "react";
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
  CheckCircle2, Thermometer, FlaskConical, Building2, ExternalLink, Link2,
  Microscope, Users, Shield, BookOpen, Cpu, Save, ChevronRight, Printer,
} from "lucide-react";
import type { IsoProject } from "@shared/schema";

// ─── Types ─────────────────────────────────────────────────────────────────

type CalTab = "register" | "oot" | "msa" | "labs" | "lab_scope";

interface WorkInstruction {
  id: number;
  title: string;
  docType: string;
  status: string;
}

interface LabCapability {
  id: string;
  parameter: string;
  method: string;          // Industry standard (ASTM D1125, ASME B89.1.14, etc.)
  equipment: string;
  range: string;
  tolerance: string;
  traceability: string;
  workInstruction?: string;           // Internal procedure / WI title or reference
  linkedDocumentId?: number | null;
  competencyRequired?: string;        // e.g. "Internal Training", "ASQ CQT"
  recordGenerated?: string;           // e.g. "Calibration Log Record", "pH Test Report"
}

interface PersonnelRequirement {
  id: string;
  role: string;
  minEducation: string;
  requiredTraining: string;
  certifications: string;
  competencyVerification: string;
  supervisionRequired: boolean;
}

interface LabEnvironment {
  temperature: string;
  humidity: string;
  lighting: string;
  vibration: string;
  cleanliness: string;
  monitoring: string;
  additionalControls: string;
}

interface CustomerReq {
  id: string;
  customer: string;
  requirement: string;
  reference: string;
  applicableTo: string;
}

interface LabScopeDoc {
  id?: number;
  labName: string | null;
  labDocumentNumber: string | null;
  labLocation: string | null;
  labManager: string | null;
  qualitySystemStatement: string | null;
  revision: string | null;
  effectiveDate: string | null;
  nextReviewDate: string | null;
  approvedBy: string | null;
  personnelRequirements: PersonnelRequirement[] | null;
  environmentalRequirements: LabEnvironment | null;
  customerRequirements: CustomerReq[] | null;
  additionalCapabilities: LabCapability[] | null;
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
  websiteUrl?: string | null;
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

interface MsaStudy {
  id: number; userId: string; isoProjectId?: number | null;
  equipmentId: number; studyType: string; studyDate: string;
  appraiserCount?: number | null; partCount?: number | null; trialCount?: number | null;
  grrPercent?: string | null; ndc?: string | null;
  evPercent?: string | null; avPercent?: string | null;
  readings?: any | null;
  result?: string | null; notes?: string | null; createdAt?: string | null;
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

function RecordForm({ equipment, isoProjectId, onSave, onCancel, isIatfProject, isAerospaceProject, isMedicalProject, initial, labs = [], onCreateLab, onUploadLabCert, workInstructions = [] }: {
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
  workInstructions?: WorkInstruction[];
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

  // Internal / External calibration state — default to equipment's own calType, then "external"
  const [calType, setCalType] = useState<"internal" | "external">(
    (initial?.calType as "internal" | "external" | undefined | null) ??
    (equipment?.calType as "internal" | "external" | undefined | null) ??
    "external"
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

      {/* ── Linked Work Instruction (internal only, if configured on the equipment) ── */}
      {calType === "internal" && equipment.linkedDocumentId && (() => {
        const wi = workInstructions.find(w => w.id === equipment.linkedDocumentId);
        return wi ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5">
            <FileCheck className="w-4 h-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Calibration Work Instruction</p>
              <p className="text-xs text-muted-foreground truncate">{wi.title}</p>
            </div>
            <a href="/iso-manager?module=documentation" target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-accent font-medium hover:underline shrink-0">
              <ExternalLink className="w-3 h-3" /> Open WI
            </a>
          </div>
        ) : null;
      })()}

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
  certExpiryDate: "", websiteUrl: "", scope: "", contactName: "", contactEmail: "", contactPhone: "",
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
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Lab Website / Online Scope URL</Label>
          <div className="mt-1 relative">
            <Link2 className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
            <Input className="h-8 pl-8" value={form.websiteUrl ?? ""}
              onChange={e => set("websiteUrl")(e.target.value)}
              placeholder="https://www.a2la.org/directory/... or lab website URL"
              data-testid="input-lab-website" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link to the lab's accreditation directory page or their scope of accreditation online — or upload their certificate below.
          </p>
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

// ─── MSA Study Form ───────────────────────────────────────────────────────────

const MSA_STUDY_TYPES = [
  { value: "gage_rrr", label: "Gage R&R (GRR)" },
  { value: "bias", label: "Bias Study" },
  { value: "linearity", label: "Linearity Study" },
  { value: "stability", label: "Stability Study" },
  { value: "attribute_agreement", label: "Attribute Agreement Analysis (AAA)" },
];

// ─── AIAG MSA 4th Edition — Constants & X̄-R Calculator ──────────────────────
// K1 = 1/d2(r)  — from control chart d2 factors (indexed by number of trials r)
const AIAG_K1: Record<number, number> = { 2: 0.8865, 3: 0.5907, 4: 0.4865, 5: 0.4299 };
// K2 = 1/d2*(a) — bias-corrected, indexed by number of appraisers a
const AIAG_K2: Record<number, number> = { 2: 0.7087, 3: 0.5236, 4: 0.4464, 5: 0.4032 };
// K3 = 1/d2*(p) — bias-corrected, indexed by number of parts p
const AIAG_K3: Record<number, number> = {
  2: 0.7087, 3: 0.5236, 4: 0.4464, 5: 0.4032,
  6: 0.3745, 7: 0.3534, 8: 0.3378, 9: 0.3247, 10: 0.3145,
};
const AIAG_D4: Record<number, number> = { 2: 3.267, 3: 2.575, 4: 2.282, 5: 2.114 };

// ─── Control chart constants for Stability X̄-R charts ──────────────────────
const CC_A2:  Record<number, number> = { 2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577 };
const CC_D3:  Record<number, number> = { 2: 0,     3: 0,     4: 0,     5: 0     };
const CC_D4s: Record<number, number> = { 2: 3.267, 3: 2.575, 4: 2.282, 5: 2.114 };
const CC_d2:  Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326 };

// ─── t-critical values α=0.05 two-tailed, indexed by df ─────────────────────
const T_CRIT_05: Record<number, number> = {
  1:12.706,2:4.303,3:3.182,4:2.776,5:2.571,6:2.447,7:2.365,8:2.306,
  9:2.262,10:2.228,11:2.201,12:2.179,13:2.160,14:2.145,15:2.131,16:2.120,
  17:2.110,18:2.101,19:2.093,20:2.086,25:2.060,30:2.042,40:2.021,60:2.000,120:1.980,
};
function tCrit95(df: number): number {
  if (df >= 120) return 1.960;
  if (T_CRIT_05[df]) return T_CRIT_05[df];
  const keys = Object.keys(T_CRIT_05).map(Number).sort((a,b)=>a-b);
  for (let i=0;i<keys.length-1;i++){
    if(df>keys[i]&&df<keys[i+1]){
      const t=(df-keys[i])/(keys[i+1]-keys[i]);
      return T_CRIT_05[keys[i]]+t*(T_CRIT_05[keys[i+1]]-T_CRIT_05[keys[i]]);
    }
  }
  return 2.042;
}

// ─── Linear regression ───────────────────────────────────────────────────────
function linRegress(xs: number[], ys: number[]): { slope: number; intercept: number; r2: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  const xm = xs.reduce((a,b)=>a+b,0)/n, ym = ys.reduce((a,b)=>a+b,0)/n;
  const num = xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0);
  const den = xs.reduce((s,x)=>s+(x-xm)**2,0);
  if (den===0) return { slope:0, intercept:ym, r2:0 };
  const slope=num/den, intercept=ym-slope*xm;
  const ssRes=ys.reduce((s,y,i)=>s+(y-(slope*xs[i]+intercept))**2,0);
  const ssTot=ys.reduce((s,y)=>s+(y-ym)**2,0);
  return { slope, intercept, r2: ssTot===0?1:1-ssRes/ssTot };
}

// ─── Cohen's Kappa ────────────────────────────────────────────────────────────
function cohenKappa(n: number, agree: number, p1: number, p2: number): number {
  if (n===0) return 0;
  const Po=agree/n, Pe=p1*p2+(1-p1)*(1-p2);
  return Pe>=1?1:(Po-Pe)/(1-Pe);
}

interface AiagResult {
  EV: number; AV: number; GRR: number; PV: number; TV: number;
  pctEV: number; pctAV: number; pctGRR: number; pctPV: number; ndc: number;
  Rbar: number; xdiff: number; Rp: number; UCLR: number;
  RbarA: number[]; XbarA: number[]; partAvgs: number[];
}

function calcAiagGrr(data: string[][][], a: number, p: number, r: number): AiagResult | null {
  const vals: number[][][] = [];
  for (let i = 0; i < a; i++) {
    vals[i] = [];
    for (let j = 0; j < p; j++) {
      vals[i][j] = [];
      for (let k = 0; k < r; k++) {
        const v = parseFloat(data[i]?.[j]?.[k] ?? "");
        if (isNaN(v)) return null;
        vals[i][j][k] = v;
      }
    }
  }
  const K1 = AIAG_K1[r] ?? 3.05, K2 = AIAG_K2[a] ?? 2.70, K3 = AIAG_K3[p] ?? 1.62;
  const ranges = vals.map(ap => ap.map(pt => Math.max(...pt) - Math.min(...pt)));
  const means  = vals.map(ap => ap.map(pt => pt.reduce((s, v) => s + v, 0) / pt.length));
  const RbarA  = ranges.map(ap => ap.reduce((s, v) => s + v, 0) / ap.length);
  const XbarA  = means.map(ap => ap.reduce((s, v) => s + v, 0) / ap.length);
  const Rbar = RbarA.reduce((s, v) => s + v, 0) / RbarA.length;
  const EV = Rbar * K1;
  const xdiff = Math.max(...XbarA) - Math.min(...XbarA);
  const AV = Math.sqrt(Math.max(0, (xdiff * K2) ** 2 - EV ** 2 / (p * r)));
  const GRR = Math.sqrt(EV ** 2 + AV ** 2);
  const partAvgs = Array.from({ length: p }, (_, j) => {
    let s = 0; for (let i = 0; i < a; i++) for (let k = 0; k < r; k++) s += vals[i][j][k];
    return s / (a * r);
  });
  const Rp = Math.max(...partAvgs) - Math.min(...partAvgs);
  const PV = Rp * K3;
  const TV = Math.sqrt(GRR ** 2 + PV ** 2);
  if (TV === 0) return null;
  return {
    EV, AV, GRR, PV, TV, Rbar, xdiff, Rp, UCLR: (AIAG_D4[r] ?? 2.575) * Rbar,
    pctEV: (EV/TV)*100, pctAV: (AV/TV)*100, pctGRR: (GRR/TV)*100, pctPV: (PV/TV)*100,
    ndc: GRR > 0 ? Math.floor(1.41 * PV / GRR) : 0,
    RbarA, XbarA, partAvgs,
  };
}

function makeEmptyGrid(a: number, p: number, r: number): string[][][] {
  return Array.from({length: a}, () => Array.from({length: p}, () => Array.from({length: r}, () => "")));
}

// Readings stored in JSONB — version 2 wraps data + study header metadata
interface MsaReadingsMeta {
  partName: string; partNumber: string; characteristic: string;
  gaugeDesc: string; usl: string; lsl: string; performedBy: string;
  appraiserNames: string[];
}
function parseMsaReadings(raw: any): { meta: MsaReadingsMeta; data: string[][][] } | null {
  if (!raw) return null;
  if (raw.version === "2" && Array.isArray(raw.data)) return { meta: raw.meta, data: raw.data };
  if (Array.isArray(raw)) return {
    meta: { partName:"", partNumber:"", characteristic:"", gaugeDesc:"", usl:"", lsl:"", performedBy:"", appraiserNames:[] },
    data: raw as string[][][],
  };
  return null;
}

function computeMsaResult(grrPercent: string, ndc: string): string {
  const grr = parseFloat(grrPercent);
  const ndcNum = parseInt(ndc, 10);
  const ndcFails = !isNaN(ndcNum) && ndcNum < 5;
  if (isNaN(grr)) return ndcFails ? "marginal" : "acceptable";
  if (grr > 30) return "unacceptable";
  if (grr >= 10 || ndcFails) return "marginal";
  return "acceptable";
}

const APPRAISER_COLORS = [
  "bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border-sky-200",
  "bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300 border-violet-200",
  "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200",
];

function MsaStudyForm({ equipment, initial, isSaving, onSave, onCancel, companyLogo, companyName }: {
  equipment: CalibrationEquipment[];
  initial: MsaStudy | null;
  isSaving: boolean;
  onSave: (d: Partial<MsaStudy>) => void;
  onCancel: () => void;
  companyLogo?: string | null;
  companyName?: string;
}) {
  const parsedInitial = useMemo(() => parseMsaReadings(initial?.readings), []);
  const hasReadings = !!parsedInitial;
  const [phase, setPhase] = useState<"config"|"grid">(hasReadings ? "grid" : "config");

  // ── Core config ─────────────────────────────────────────────────────────────
  const [equipmentId, setEquipmentId] = useState(initial?.equipmentId ?? (equipment.find(e => e.status === "active")?.id ?? 0));
  const [studyType, setStudyType]     = useState(initial?.studyType ?? "gage_rrr");
  const [studyDate, setStudyDate]     = useState(initial?.studyDate ?? new Date().toISOString().split("T")[0]);
  const [appraiserCount, setAppraiserCount] = useState(initial?.appraiserCount ?? 3);
  const [partCount, setPartCount]           = useState(initial?.partCount ?? 10);
  const [trialCount, setTrialCount]         = useState(initial?.trialCount ?? 2);

  // ── Study header metadata (AIAG worksheet header fields) ────────────────────
  const [meta, setMeta] = useState<MsaReadingsMeta>(() => parsedInitial?.meta ?? {
    partName: "", partNumber: "", characteristic: "",
    gaugeDesc: "", usl: "", lsl: "", performedBy: "",
    appraiserNames: ["Appraiser A", "Appraiser B", "Appraiser C"],
  });
  const setMetaField = (k: keyof MsaReadingsMeta, v: string) =>
    setMeta(m => ({ ...m, [k]: v }));
  const setAppraiserName = (i: number, v: string) =>
    setMeta(m => { const a = [...m.appraiserNames]; a[i] = v; return { ...m, appraiserNames: a }; });

  // ── Measurement grid: data[appraiser][part][trial] ──────────────────────────
  const [gridData, setGridData] = useState<string[][][]>(() =>
    parsedInitial?.data ?? makeEmptyGrid(initial?.appraiserCount ?? 3, initial?.partCount ?? 10, initial?.trialCount ?? 2)
  );

  const [notes, setNotes] = useState(initial?.notes ?? "");

  // ── Bias study state ────────────────────────────────────────────────────────
  const [biasRef, setBiasRef] = useState<string>(() => { const r=initial?.readings as any; return r?.type==="bias"?String(r.referenceValue??""):""; });
  const [biasProcessVar, setBiasProcessVar] = useState<string>(() => { const r=initial?.readings as any; return r?.type==="bias"?String(r.processVar??""):""; });
  const [biasN, setBiasN] = useState<number>(() => { const r=initial?.readings as any; return r?.type==="bias"&&Array.isArray(r.measurements)?r.measurements.length:25; });
  const [biasReadings, setBiasReadings] = useState<string[]>(() => { const r=initial?.readings as any; if(r?.type==="bias"&&Array.isArray(r.measurements)) return [...r.measurements.map(String),...Array(50).fill("")].slice(0,50); return Array(50).fill(""); });

  // ── Linearity study state ───────────────────────────────────────────────────
  const [linProcessVar, setLinProcessVar] = useState<string>(() => { const r=initial?.readings as any; return r?.type==="linearity"?String(r.processVar??""):""; });
  const [linMeasCount, setLinMeasCount] = useState<number>(() => { const r=initial?.readings as any; return r?.type==="linearity"&&r.parts?.[0]?r.parts[0].readings.length:10; });
  const [linParts, setLinParts] = useState<{reference:string;readings:string[]}[]>(() => {
    const r=initial?.readings as any;
    if(r?.type==="linearity"&&Array.isArray(r.parts)) return r.parts.map((p:any)=>({reference:String(p.reference??""),readings:(p.readings??[]).map(String)}));
    return Array(5).fill(null).map(()=>({reference:"",readings:Array(10).fill("")}));
  });

  // ── Stability study state ───────────────────────────────────────────────────
  const [stabRef, setStabRef] = useState<string>(() => { const r=initial?.readings as any; return r?.type==="stability"?String(r.referenceValue??""):""; });
  const [stabSubgroupSize, setStabSubgroupSize] = useState<number>(() => { const r=initial?.readings as any; return r?.type==="stability"?(r.subgroupSize??3):3; });
  const [stabSubgroups, setStabSubgroups] = useState<{date:string;readings:string[]}[]>(() => {
    const r=initial?.readings as any;
    if(r?.type==="stability"&&Array.isArray(r.subgroups)) return r.subgroups.map((sg:any)=>({date:sg.date??"",readings:(sg.readings??[]).map(String)}));
    return Array(25).fill(null).map(()=>({date:"",readings:Array(3).fill("")}));
  });

  // ── Attribute Agreement Analysis (AAA) state ────────────────────────────────
  const [aaaAppraisers, setAaaAppraisers] = useState<number>(() => { const r=initial?.readings as any; return r?.type==="aaa"?(r.appraisers??3):3; });
  const [aaaParts, setAaaParts]           = useState<number>(() => { const r=initial?.readings as any; return r?.type==="aaa"?(r.parts??25):25; });
  const [aaaTrials, setAaaTrials]         = useState<number>(() => { const r=initial?.readings as any; return r?.type==="aaa"?(r.trials??2):2; });
  const [aaaData, setAaaData] = useState<boolean[][][]>(() => {
    const r=initial?.readings as any;
    if(r?.type==="aaa"&&Array.isArray(r.data)) return r.data;
    return Array(3).fill(null).map(()=>Array(25).fill(null).map(()=>Array(2).fill(true)));
  });
  const [aaaReference, setAaaReference] = useState<boolean[]>(() => {
    const r=initial?.readings as any;
    if(r?.type==="aaa"&&Array.isArray(r.reference)) return r.reference;
    return Array(25).fill(true);
  });

  function buildGrid() {
    setGridData(makeEmptyGrid(appraiserCount, partCount, trialCount));
    setPhase("grid");
  }

  function buildDataSheet() {
    if (studyType === "gage_rrr") {
      setGridData(makeEmptyGrid(appraiserCount, partCount, trialCount));
    } else if (studyType === "bias") {
      setBiasReadings(Array(50).fill(""));
    } else if (studyType === "linearity") {
      setLinParts(Array(5).fill(null).map((_,i)=>({reference:linParts[i]?.reference??"",readings:Array(linMeasCount).fill("")})));
    } else if (studyType === "stability") {
      setStabSubgroups(Array(25).fill(null).map((_,i)=>({date:stabSubgroups[i]?.date??"",readings:Array(stabSubgroupSize).fill("")})));
    } else if (studyType === "attribute_agreement") {
      setAaaData(Array(aaaAppraisers).fill(null).map(()=>Array(aaaParts).fill(null).map(()=>Array(aaaTrials).fill(true))));
      setAaaReference(Array(aaaParts).fill(true));
    }
    setPhase("grid");
  }

  function setCell(a: number, p: number, t: number, val: string) {
    setGridData(prev => {
      const next = prev.map(ap => ap.map(pt => [...pt]));
      if (next[a]?.[p]) next[a][p][t] = val;
      return next;
    });
  }

  // ── Live AIAG X̄-R calculations ──────────────────────────────────────────────
  const aiag = useMemo(() =>
    studyType === "gage_rrr" && phase === "grid"
      ? calcAiagGrr(gridData, appraiserCount, partCount, trialCount)
      : null,
    [gridData, studyType, phase, appraiserCount, partCount, trialCount]
  );

  // ── Bias live calculations ────────────────────────────────────────────────────
  const biasResult = useMemo(() => {
    if (studyType !== "bias" || phase !== "grid") return null;
    const ref = parseFloat(biasRef), pv = parseFloat(biasProcessVar);
    const vals = biasReadings.slice(0,biasN).filter(s=>s.trim()!=="").map(s=>parseFloat(s)).filter(v=>!isNaN(v));
    if (vals.length < 2 || isNaN(ref)) return null;
    const n=vals.length, mean=vals.reduce((a,b)=>a+b,0)/n;
    const bias=mean-ref;
    const sigma=Math.sqrt(vals.reduce((s,v)=>s+(v-mean)**2,0)/(n-1));
    const tStat=sigma>0?Math.abs(bias)/(sigma/Math.sqrt(n)):0;
    const tc=tCrit95(n-1);
    const significant=tStat>tc;
    const pctBias=!isNaN(pv)&&pv>0?Math.abs(bias)/pv*100:null;
    const pctRepeat=!isNaN(pv)&&pv>0?(sigma*5.15)/pv*100:null;
    const worst=pctBias??0;
    const result: "acceptable"|"marginal"|"unacceptable" = worst>10||(significant&&worst>5)?worst>30?"unacceptable":"marginal":"acceptable";
    return {n,mean,bias,sigma,tStat,tc,significant,pctBias,pctRepeat,result};
  },[biasReadings,biasRef,biasProcessVar,biasN,studyType,phase]);

  // ── Linearity live calculations ────────────────────────────────────────────────
  const linResult = useMemo(() => {
    if (studyType !== "linearity" || phase !== "grid") return null;
    const pv=parseFloat(linProcessVar);
    const levels=linParts.map(lp=>{
      const ref=parseFloat(lp.reference);
      const vals=lp.readings.filter(s=>s.trim()!=="").map(s=>parseFloat(s)).filter(v=>!isNaN(v));
      if(isNaN(ref)||vals.length===0) return null;
      const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
      return {ref,mean,bias:mean-ref,n:vals.length};
    }).filter(Boolean) as {ref:number;mean:number;bias:number;n:number}[];
    if (levels.length<2) return null;
    const {slope,intercept,r2}=linRegress(levels.map(d=>d.ref),levels.map(d=>d.bias));
    const maxBiasAbs=Math.max(...levels.map(d=>Math.abs(d.bias)));
    const linearity=!isNaN(pv)&&pv>0?Math.abs(slope)*pv:null;
    const pctLinearity=linearity&&pv>0?linearity/pv*100:null;
    const pctBias=!isNaN(pv)&&pv>0?maxBiasAbs/pv*100:null;
    const worst=pctLinearity??pctBias??0;
    const result: "acceptable"|"marginal"|"unacceptable" = worst>10?worst>30?"unacceptable":"marginal":"acceptable";
    return {levels,slope,intercept,r2,linearity,pctLinearity,maxBiasAbs,pctBias,result};
  },[linParts,linProcessVar,studyType,phase]);

  // ── Stability live calculations ────────────────────────────────────────────────
  const stabResult = useMemo(() => {
    if (studyType !== "stability" || phase !== "grid") return null;
    const ref=parseFloat(stabRef);
    const sgs=stabSubgroups.map(sg=>{
      const vals=sg.readings.slice(0,stabSubgroupSize).filter(s=>s.trim()!=="").map(s=>parseFloat(s)).filter(v=>!isNaN(v));
      return vals.length===stabSubgroupSize?{date:sg.date,vals}:null;
    }).filter(Boolean) as {date:string;vals:number[]}[];
    if (sgs.length<2) return null;
    const xbars=sgs.map(sg=>sg.vals.reduce((a,b)=>a+b,0)/sg.vals.length);
    const ranges=sgs.map(sg=>Math.max(...sg.vals)-Math.min(...sg.vals));
    const xbarBar=xbars.reduce((a,b)=>a+b,0)/xbars.length;
    const rBar=ranges.reduce((a,b)=>a+b,0)/ranges.length;
    const A2=CC_A2[stabSubgroupSize]??0.577,D4=CC_D4s[stabSubgroupSize]??2.114,D3=CC_D3[stabSubgroupSize]??0,d2=CC_d2[stabSubgroupSize]??1.693;
    const UCLX=xbarBar+A2*rBar,LCLX=xbarBar-A2*rBar,UCLR=D4*rBar,LCLR=D3*rBar;
    const sigma=rBar/d2;
    const bias=!isNaN(ref)?xbarBar-ref:null;
    const pctBias=bias!==null&&sigma>0?Math.abs(bias)/(6*sigma)*100:null;
    const oocX=xbars.map((x,i)=>x>UCLX||x<LCLX?i:-1).filter(i=>i>=0);
    const oocR=ranges.map((r,i)=>r>UCLR?i:-1).filter(i=>i>=0);
    const stable=oocX.length===0&&oocR.length===0;
    const result: "acceptable"|"marginal"|"unacceptable"=stable?"acceptable":oocX.length+oocR.length>3?"unacceptable":"marginal";
    return {sgs,xbars,ranges,xbarBar,rBar,A2,D4,D3,d2,UCLX,LCLX,UCLR,LCLR,sigma,bias,pctBias,oocX,oocR,stable,result};
  },[stabSubgroups,stabRef,stabSubgroupSize,studyType,phase]);

  // ── AAA live calculations ─────────────────────────────────────────────────────
  const aaaResult = useMemo(() => {
    if (studyType !== "attribute_agreement" || phase !== "grid") return null;
    const A=aaaAppraisers,P=aaaParts,T=aaaTrials;
    const withinPct=Array(A).fill(0).map((_,a)=>{
      let agree=0;
      for(let p=0;p<P;p++){
        const d=Array(T).fill(null).map((_,t)=>aaaData[a]?.[p]?.[t]??true);
        if(d.every(v=>v===d[0])) agree++;
      }
      return agree/P*100;
    });
    let allAgree=0;
    for(let p=0;p<P;p++){
      const appDec=Array(A).fill(null).map((_,a)=>{
        const acc=Array(T).fill(null).map((_,t)=>aaaData[a]?.[p]?.[t]??true).filter(v=>v).length;
        return acc>=T/2;
      });
      if(appDec.every(d=>d===appDec[0])) allAgree++;
    }
    const vsRefPct=Array(A).fill(0).map((_,a)=>{
      let agree=0;
      for(let p=0;p<P;p++){
        const ref=aaaReference[p];
        const d=Array(T).fill(null).map((_,t)=>aaaData[a]?.[p]?.[t]??true);
        if(d.every(v=>v===ref)) agree++;
      }
      return agree/P*100;
    });
    const kappaVals=Array(A).fill(0).map((_,a)=>{
      const dec=Array(P).fill(null).map((_,p)=>{
        const acc=Array(T).fill(null).map((_,t)=>aaaData[a]?.[p]?.[t]??true).filter(v=>v).length;
        return acc>=T/2;
      });
      const pAcc=dec.filter(d=>d).length/P;
      const pRefAcc=aaaReference.slice(0,P).filter(v=>v).length/P;
      const agree=dec.filter((d,p)=>d===aaaReference[p]).length;
      return cohenKappa(P,agree,pAcc,pRefAcc);
    });
    const overallKappa=kappaVals.reduce((a,b)=>a+b,0)/kappaVals.length;
    const result: "acceptable"|"marginal"|"unacceptable"=overallKappa>=0.75?"acceptable":overallKappa>=0.5?"marginal":"unacceptable";
    return {withinPct,allAgree,betweenPct:allAgree/P*100,vsRefPct,kappaVals,overallKappa,result};
  },[aaaData,aaaReference,aaaAppraisers,aaaParts,aaaTrials,studyType,phase]);

  // Per-cell mean and range (displayed inline in the grid)
  const cellStats = useMemo(() =>
    Array.from({length: appraiserCount}, (_, i) =>
      Array.from({length: partCount}, (_, j) => {
        const vals = Array.from({length: trialCount}, (_, k) =>
          parseFloat(gridData[i]?.[j]?.[k] ?? "")).filter(v => !isNaN(v));
        if (vals.length !== trialCount) return { mean: null as number|null, range: null as number|null };
        return { mean: vals.reduce((s,v) => s+v, 0)/vals.length, range: Math.max(...vals)-Math.min(...vals) };
      })
    ), [gridData, appraiserCount, partCount, trialCount]
  );

  // Tolerance for %Tolerance column
  const tolerance = useMemo(() => {
    const u = parseFloat(meta.usl), l = parseFloat(meta.lsl);
    return (!isNaN(u) && !isNaN(l)) ? Math.abs(u - l) : null;
  }, [meta.usl, meta.lsl]);

  // Per-trial-row averages: mean of all parts for that specific trial + appraiser
  const trialRowAvgs = useMemo(() =>
    Array.from({length: appraiserCount}, (_, i) =>
      Array.from({length: trialCount}, (_, k) => {
        const vs = Array.from({length: partCount}, (_, j) =>
          parseFloat(gridData[i]?.[j]?.[k] ?? "")).filter(v => !isNaN(v));
        if (vs.length !== partCount) return null as number|null;
        return vs.reduce((s,v) => s+v, 0) / vs.length;
      })
    ), [gridData, appraiserCount, partCount, trialCount]
  );

  // ── Save handler ─────────────────────────────────────────────────────────────
  function handleSave() {
    if (studyType === "gage_rrr" && phase === "grid" && aiag) {
      const grr = aiag.pctGRR;
      onSave({
        equipmentId, studyType, studyDate, appraiserCount, partCount, trialCount,
        grrPercent: grr.toFixed(2), ndc: String(aiag.ndc),
        evPercent: aiag.pctEV.toFixed(2), avPercent: aiag.pctAV.toFixed(2),
        readings: { version: "2", meta, data: gridData } as any, notes,
        result: grr > 30 ? "unacceptable" : grr >= 10 || aiag.ndc < 5 ? "marginal" : "acceptable",
      });
    } else if (studyType === "bias") {
      onSave({
        equipmentId, studyType, studyDate, notes,
        grrPercent: biasResult?.pctBias?.toFixed(2),
        result: biasResult?.result ?? "acceptable",
        readings: { type:"bias", version:"1", referenceValue:parseFloat(biasRef), processVar:parseFloat(biasProcessVar), measurements:biasReadings.slice(0,biasN).filter(s=>s.trim()!==""), meta } as any,
      });
    } else if (studyType === "linearity") {
      onSave({
        equipmentId, studyType, studyDate, notes,
        grrPercent: linResult?.pctLinearity?.toFixed(2),
        result: linResult?.result ?? "acceptable",
        readings: { type:"linearity", version:"1", processVar:parseFloat(linProcessVar), parts:linParts, meta } as any,
      });
    } else if (studyType === "stability") {
      onSave({
        equipmentId, studyType, studyDate, notes,
        result: stabResult?.result ?? "acceptable",
        readings: { type:"stability", version:"1", referenceValue:parseFloat(stabRef), subgroupSize:stabSubgroupSize, subgroups:stabSubgroups, meta } as any,
      });
    } else if (studyType === "attribute_agreement") {
      onSave({
        equipmentId, studyType, studyDate, notes,
        appraiserCount: aaaAppraisers, partCount: aaaParts, trialCount: aaaTrials,
        grrPercent: aaaResult?.overallKappa?.toFixed(3),
        result: aaaResult?.result ?? "acceptable",
        readings: { type:"aaa", version:"1", appraisers:aaaAppraisers, parts:aaaParts, trials:aaaTrials, data:aaaData, reference:aaaReference, meta } as any,
      });
    } else {
      onSave({ equipmentId, studyType, studyDate, notes, result: "acceptable" });
    }
  }

  // ── Per-type print helpers ────────────────────────────────────────────────────
  function handlePrintBias() {
    const win = window.open("","_blank","width=900,height=700"); if(!win) return;
    const r=biasResult, ref=parseFloat(biasRef), pv=parseFloat(biasProcessVar);
    const vals=biasReadings.slice(0,biasN).filter(s=>s.trim()!=="").map(Number).filter(v=>!isNaN(v));
    const logoHtml=companyLogo?`<img src="${companyLogo}" style="height:48px;object-fit:contain;margin-right:10px;" />`:"";
    const hdr=(k:string,v:string)=>`<tr><td style="font-weight:600;white-space:nowrap;padding:2px 8px 2px 0;">${k}</td><td style="font-family:monospace;padding:2px 0;">${v}</td></tr>`;
    const rowsHtml=Array.from({length:Math.ceil(vals.length/5)},(_,row)=>
      `<tr>${Array.from({length:5},(_,col)=>{const i=row*5+col; return i<vals.length?`<td style="text-align:center;font-family:monospace;border:1px solid #ccc;padding:3px 8px;">${(i+1)}. ${vals[i].toFixed(4)}</td>`:`<td style="border:1px solid #ccc;"></td>`;}).join("")}</tr>`).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Bias Study</title><style>body{font-family:Arial,sans-serif;font-size:10pt;margin:20px;}table{border-collapse:collapse;}@media print{button{display:none!important;}}</style></head><body>
    <div style="display:flex;align-items:center;border-bottom:3px solid #1e40af;padding-bottom:8px;margin-bottom:12px;">
      ${logoHtml}<div><div style="font-size:15pt;font-weight:700;color:#1e40af;">${companyName||"Company"}</div><div style="font-size:9pt;color:#666;">MSA Bias Study — AIAG MSA 4th Edition §3.1</div></div>
    </div>
    <table style="width:100%;margin-bottom:12px;"><tbody>
      ${hdr("Part Name:",meta.partName||"—")}${hdr("Part No.:",meta.partNumber||"—")}${hdr("Characteristic:",meta.characteristic||"—")}
      ${hdr("Gage Description:",meta.gaugeDesc||"—")}${hdr("Performed By:",meta.performedBy||"—")}${hdr("Study Date:",studyDate||"—")}
      ${hdr("Reference Value:",isNaN(ref)?"-":ref.toFixed(4))}${hdr("Process Variation TV:",isNaN(pv)?"-":pv.toFixed(4))}${hdr("n (measurements):",String(vals.length))}
    </tbody></table>
    <p style="font-weight:700;margin:0 0 4px;">Measurements</p>
    <table style="margin-bottom:14px;"><tbody>${rowsHtml}</tbody></table>
    <p style="font-weight:700;margin:0 0 4px;">Analysis Summary</p>
    <table style="width:60%;"><tbody>
      ${hdr("Sample Mean (x̄):",r?r.mean.toFixed(4):"—")}${hdr("Bias (x̄ − Ref):",r?r.bias.toFixed(4):"—")}
      ${hdr("Std Dev (σ):",r?r.sigma.toFixed(4):"—")}${hdr("t-statistic:",r?r.tStat.toFixed(3):"—")}
      ${hdr("t-critical (95%, df=n−1):",r?r.tc.toFixed(3):"—")}${hdr("Bias Significant?:",r?(r.significant?"YES ⚠":"No"):"—")}
      ${hdr("%Bias (|Bias|/TV×100):",r&&r.pctBias!=null?r.pctBias.toFixed(2)+"%":"—")}${hdr("%Repeatability (5.15σ/TV×100):",r&&r.pctRepeat!=null?r.pctRepeat.toFixed(2)+"%":"—")}
      ${hdr("AIAG Criterion:",r?`${r.result.toUpperCase()} (${r.result==="acceptable"?"≤10%":"≥10%"})`:"—")}
    </tbody></table>
    <div style="margin-top:16px;padding:8px 12px;border-left:4px solid ${r?.result==="acceptable"?"#16a34a":r?.result==="marginal"?"#d97706":"#dc2626"};background:${r?.result==="acceptable"?"#f0fdf4":r?.result==="marginal"?"#fffbeb":"#fef2f2"};">
      <b>Result: ${r?.result?.toUpperCase()||"INSUFFICIENT DATA"}</b>${r?.significant?" — Statistically significant bias detected.":""} ${r&&r.pctBias!=null?`%Bias = ${r.pctBias.toFixed(2)}%.`:""}
    </div>
    <button onclick="window.print()" style="margin-top:14px;padding:6px 16px;background:#1e40af;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10pt;">🖨 Print</button>
    </body></html>`);
    win.document.close();
  }

  function handlePrintLinearity() {
    const win = window.open("","_blank","width=1000,height=750"); if(!win) return;
    const r=linResult; const pv=parseFloat(linProcessVar);
    const logoHtml=companyLogo?`<img src="${companyLogo}" style="height:48px;object-fit:contain;margin-right:10px;" />`:"";
    const hdr=(k:string,v:string)=>`<tr><td style="font-weight:600;padding:2px 8px 2px 0;">${k}</td><td style="font-family:monospace;">${v}</td></tr>`;
    const levelsRows=linParts.map((lp,i)=>{
      const vals=lp.readings.filter(s=>s.trim()!=="").map(Number).filter(v=>!isNaN(v));
      const ref=parseFloat(lp.reference); const m=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:NaN;
      const bias=m-ref;
      return `<tr><td style="text-align:center;border:1px solid #ccc;padding:4px 6px;">Level ${i+1}</td><td style="font-family:monospace;text-align:center;border:1px solid #ccc;padding:4px 6px;">${isNaN(ref)?"—":ref.toFixed(4)}</td><td style="font-family:monospace;text-align:center;border:1px solid #ccc;padding:4px 6px;">${vals.length}</td><td style="font-family:monospace;text-align:center;border:1px solid #ccc;padding:4px 6px;">${isNaN(m)?"—":m.toFixed(4)}</td><td style="font-family:monospace;text-align:center;border:1px solid #ccc;padding:4px 6px;">${isNaN(bias)?"—":bias.toFixed(4)}</td></tr>`;
    }).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Linearity Study</title><style>body{font-family:Arial,sans-serif;font-size:10pt;margin:20px;}table{border-collapse:collapse;}@media print{button{display:none!important;}}</style></head><body>
    <div style="display:flex;align-items:center;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:12px;">
      ${logoHtml}<div><div style="font-size:15pt;font-weight:700;color:#7c3aed;">${companyName||"Company"}</div><div style="font-size:9pt;color:#666;">MSA Linearity Study — AIAG MSA 4th Edition §3.2</div></div>
    </div>
    <table style="width:100%;margin-bottom:12px;"><tbody>
      ${hdr("Part Name:",meta.partName||"—")}${hdr("Characteristic:",meta.characteristic||"—")}${hdr("Gage Description:",meta.gaugeDesc||"—")}
      ${hdr("Performed By:",meta.performedBy||"—")}${hdr("Study Date:",studyDate||"—")}${hdr("Process Variation TV:",isNaN(pv)?"—":pv.toFixed(4))}
    </tbody></table>
    <p style="font-weight:700;margin:0 0 4px;">Reference Levels & Bias by Level</p>
    <table style="width:70%;margin-bottom:14px;"><thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ccc;padding:4px 6px;">Level</th><th style="border:1px solid #ccc;padding:4px 6px;">Reference</th><th style="border:1px solid #ccc;padding:4px 6px;">n</th><th style="border:1px solid #ccc;padding:4px 6px;">Mean</th><th style="border:1px solid #ccc;padding:4px 6px;">Bias</th></tr></thead><tbody>${levelsRows}</tbody></table>
    <p style="font-weight:700;margin:0 0 4px;">Regression Analysis (Bias = β₀ + β₁ × Reference)</p>
    <table style="width:60%;margin-bottom:14px;"><tbody>
      ${hdr("Slope (β₁):",r?r.slope.toFixed(4):"—")}${hdr("Intercept (β₀):",r?r.intercept.toFixed(4):"—")}${hdr("R²:",r?r.r2.toFixed(4):"—")}
      ${hdr("Max |Bias|:",r?r.maxBiasAbs.toFixed(4):"—")}${hdr("%Linearity:",r&&r.pctLinearity!=null?r.pctLinearity.toFixed(2)+"%":"—")}${hdr("%Max Bias:",r&&r.pctBias!=null?r.pctBias.toFixed(2)+"%":"—")}
      ${hdr("AIAG Result:",r?r.result.toUpperCase():"—")}
    </tbody></table>
    <div style="margin-top:16px;padding:8px 12px;border-left:4px solid ${r?.result==="acceptable"?"#16a34a":r?.result==="marginal"?"#d97706":"#dc2626"};background:${r?.result==="acceptable"?"#f0fdf4":r?.result==="marginal"?"#fffbeb":"#fef2f2"};">
      <b>Result: ${r?.result?.toUpperCase()||"INSUFFICIENT DATA"}</b>${r?` — Slope β₁=${r.slope.toFixed(4)}, R²=${r.r2.toFixed(4)}`:""}.
    </div>
    <button onclick="window.print()" style="margin-top:14px;padding:6px 16px;background:#7c3aed;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10pt;">🖨 Print</button>
    </body></html>`);
    win.document.close();
  }

  function handlePrintStability() {
    const win = window.open("","_blank","width=1100,height=800"); if(!win) return;
    const r=stabResult; const ref=parseFloat(stabRef);
    const logoHtml=companyLogo?`<img src="${companyLogo}" style="height:48px;object-fit:contain;margin-right:10px;" />`:"";
    const hdr=(k:string,v:string)=>`<tr><td style="font-weight:600;padding:2px 8px 2px 0;">${k}</td><td style="font-family:monospace;">${v}</td></tr>`;
    const sgRows=r?r.sgs.map((sg,i)=>{
      const oocX=r.oocX.includes(i), oocR=r.oocR.includes(i);
      const bg=oocX||oocR?"background:#fef2f2;":"";
      return `<tr style="${bg}"><td style="border:1px solid #ccc;padding:3px 6px;text-align:center;">${i+1}</td><td style="border:1px solid #ccc;padding:3px 6px;">${sg.date||"—"}</td>${sg.vals.map(v=>`<td style="font-family:monospace;text-align:center;border:1px solid #ccc;padding:3px 6px;">${v.toFixed(4)}</td>`).join("")}<td style="font-family:monospace;font-weight:700;text-align:center;border:1px solid #ccc;padding:3px 6px;${oocX?"color:red;":""}">${r.xbars[i].toFixed(4)}${oocX?"▲":""}</td><td style="font-family:monospace;font-weight:700;text-align:center;border:1px solid #ccc;padding:3px 6px;${oocR?"color:red;":""}">${r.ranges[i].toFixed(4)}${oocR?"▲":""}</td></tr>`;
    }).join(""):
    stabSubgroups.filter(sg=>sg.readings.slice(0,stabSubgroupSize).some(s=>s.trim()!=="")).map((sg,i)=>
      `<tr><td style="border:1px solid #ccc;padding:3px 6px;text-align:center;">${i+1}</td><td style="border:1px solid #ccc;padding:3px 6px;">${sg.date||"—"}</td>${sg.readings.slice(0,stabSubgroupSize).map(v=>`<td style="font-family:monospace;text-align:center;border:1px solid #ccc;padding:3px 6px;">${v||""}</td>`).join("")}<td style="border:1px solid #ccc;"></td><td style="border:1px solid #ccc;"></td></tr>`).join("");
    const measHdrs=Array.from({length:stabSubgroupSize},(_,i)=>`<th style="border:1px solid #ccc;padding:3px 6px;">x${i+1}</th>`).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Stability Study</title><style>body{font-family:Arial,sans-serif;font-size:10pt;margin:20px;}table{border-collapse:collapse;}@media print{button{display:none!important;}}</style></head><body>
    <div style="display:flex;align-items:center;border-bottom:3px solid #059669;padding-bottom:8px;margin-bottom:12px;">
      ${logoHtml}<div><div style="font-size:15pt;font-weight:700;color:#059669;">${companyName||"Company"}</div><div style="font-size:9pt;color:#666;">MSA Stability Study — AIAG MSA 4th Edition §3.3 · X̄-R Control Chart</div></div>
    </div>
    <table style="width:100%;margin-bottom:12px;"><tbody>
      ${hdr("Part Name:",meta.partName||"—")}${hdr("Characteristic:",meta.characteristic||"—")}${hdr("Gage Description:",meta.gaugeDesc||"—")}
      ${hdr("Performed By:",meta.performedBy||"—")}${hdr("Study Date:",studyDate||"—")}${hdr("Reference Value:",isNaN(ref)?"—":ref.toFixed(4))}
      ${hdr("Subgroup Size (n):",String(stabSubgroupSize))}${r?hdr("X̄-bar (Grand Mean):",r.xbarBar.toFixed(4)):""}${r?hdr("R̄ (Mean Range):",r.rBar.toFixed(4)):""}
    </tbody></table>
    ${r?`<p style="font-weight:700;margin:0 0 4px;">Control Limits (X̄ Chart: UCL=${r.UCLX.toFixed(4)}, LCL=${r.LCLX.toFixed(4)}) | (R Chart: UCL=${r.UCLR.toFixed(4)}, LCL=${r.LCLR.toFixed(4)})</p>`:""}
    <table style="width:100%;margin-bottom:14px;"><thead><tr style="background:#f0f0f0;">
      <th style="border:1px solid #ccc;padding:3px 6px;">#</th><th style="border:1px solid #ccc;padding:3px 6px;">Date</th>${measHdrs}<th style="border:1px solid #ccc;padding:3px 6px;">X̄</th><th style="border:1px solid #ccc;padding:3px 6px;">R</th>
    </tr></thead><tbody>${sgRows}</tbody></table>
    ${r?`<div style="padding:8px 12px;border-left:4px solid ${r.result==="acceptable"?"#16a34a":r.result==="marginal"?"#d97706":"#dc2626"};background:${r.result==="acceptable"?"#f0fdf4":r.result==="marginal"?"#fffbeb":"#fef2f2"};">
      <b>Result: ${r.result.toUpperCase()}</b> — ${r.stable?"No out-of-control points detected. Measurement system is stable.":`${r.oocX.length} X̄ OOC point(s), ${r.oocR.length} R OOC point(s). ▲ = out of control.`}${r.bias!=null?` Bias from reference: ${r.bias.toFixed(4)}.`:""}
    </div>`:""}
    <button onclick="window.print()" style="margin-top:14px;padding:6px 16px;background:#059669;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10pt;">🖨 Print</button>
    </body></html>`);
    win.document.close();
  }

  function handlePrintAAA() {
    const win = window.open("","_blank","width=1100,height=800"); if(!win) return;
    const r=aaaResult;
    const logoHtml=companyLogo?`<img src="${companyLogo}" style="height:48px;object-fit:contain;margin-right:10px;" />`:"";
    const hdr=(k:string,v:string)=>`<tr><td style="font-weight:600;padding:2px 8px 2px 0;">${k}</td><td style="font-family:monospace;">${v}</td></tr>`;
    const al=(i:number)=>meta.appraiserNames[i]||String.fromCharCode(65+i);
    const appraiserTables=Array.from({length:aaaAppraisers},(_,a)=>{
      const rows=Array.from({length:aaaParts},(_,p)=>{
        const ref=aaaReference[p];
        const decisions=Array.from({length:aaaTrials},(_,t)=>aaaData[a]?.[p]?.[t]??true);
        const allSame=decisions.every(d=>d===decisions[0]);
        const vsRef=decisions.every(d=>d===ref);
        return `<tr style="${!allSame?"background:#fef2f2;":""}"><td style="border:1px solid #ccc;padding:3px 6px;text-align:center;">${p+1}</td>${decisions.map(d=>`<td style="text-align:center;border:1px solid #ccc;padding:3px 6px;color:${d?"#16a34a":"#dc2626"};font-weight:700;">${d?"A":"R"}</td>`).join("")}<td style="text-align:center;border:1px solid #ccc;padding:3px 6px;color:${ref?"#16a34a":"#dc2626"};font-weight:700;">${ref?"A":"R"}</td><td style="text-align:center;border:1px solid #ccc;padding:3px 6px;">${allSame?"✓":"✗"}</td><td style="text-align:center;border:1px solid #ccc;padding:3px 6px;">${vsRef?"✓":"✗"}</td></tr>`;
      }).join("");
      const trialHdrs=Array.from({length:aaaTrials},(_,t)=>`<th style="border:1px solid #ccc;padding:3px 6px;">Trial ${t+1}</th>`).join("");
      return `<div style="margin-bottom:16px;"><p style="font-weight:700;margin:0 0 4px;">Appraiser ${al(a)}</p><table style="width:100%;"><thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ccc;padding:3px 6px;">Part</th>${trialHdrs}<th style="border:1px solid #ccc;padding:3px 6px;">Reference</th><th style="border:1px solid #ccc;padding:3px 6px;">Within ✓</th><th style="border:1px solid #ccc;padding:3px 6px;">vs Ref ✓</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>AAA Study</title><style>body{font-family:Arial,sans-serif;font-size:9.5pt;margin:20px;}table{border-collapse:collapse;}@media print{button{display:none!important;}}</style></head><body>
    <div style="display:flex;align-items:center;border-bottom:3px solid #b45309;padding-bottom:8px;margin-bottom:12px;">
      ${logoHtml}<div><div style="font-size:15pt;font-weight:700;color:#b45309;">${companyName||"Company"}</div><div style="font-size:9pt;color:#666;">Attribute Agreement Analysis — AIAG MSA 4th Edition §4 · Cohen's Kappa (κ)</div></div>
    </div>
    <table style="width:100%;margin-bottom:12px;"><tbody>
      ${hdr("Part Name:",meta.partName||"—")}${hdr("Characteristic:",meta.characteristic||"—")}${hdr("Gage Description:",meta.gaugeDesc||"—")}
      ${hdr("Performed By:",meta.performedBy||"—")}${hdr("Study Date:",studyDate||"—")}
      ${hdr("Appraisers:",Array.from({length:aaaAppraisers},(_,i)=>al(i)).join(", "))}
      ${hdr("Parts / Samples:",String(aaaParts))}${hdr("Trials per Part:",String(aaaTrials))}
    </tbody></table>
    ${appraiserTables}
    <p style="font-weight:700;margin:8px 0 4px;">Analysis Summary</p>
    <table style="width:60%;margin-bottom:14px;"><tbody>
      ${r?r.withinPct.map((pct,a)=>hdr(`Within-Appraiser % (${al(a)}):`,pct.toFixed(1)+"%")).join(""):""}
      ${r?hdr("Between-Appraiser % (all agree):",r.betweenPct.toFixed(1)+"%"):""}
      ${r?r.vsRefPct.map((pct,a)=>hdr(`vs Reference % (${al(a)}):`,pct.toFixed(1)+"%")).join(""):""}
      ${r?r.kappaVals.map((k,a)=>hdr(`Kappa κ (${al(a)}):`,k.toFixed(4))).join(""):""}
      ${r?hdr("Overall Kappa κ̄:",r.overallKappa.toFixed(4)):""}
      ${r?hdr("AIAG Criterion (κ≥0.75 acceptable):",r.result.toUpperCase()):""}
    </tbody></table>
    ${r?`<div style="padding:8px 12px;border-left:4px solid ${r.result==="acceptable"?"#16a34a":r.result==="marginal"?"#d97706":"#dc2626"};background:${r.result==="acceptable"?"#f0fdf4":r.result==="marginal"?"#fffbeb":"#fef2f2"};">
      <b>Result: ${r.result.toUpperCase()}</b> — κ̄ = ${r.overallKappa.toFixed(4)}. ${r.result==="acceptable"?"Measurement system is effective for attribute discrimination.":r.result==="marginal"?"System may be acceptable depending on application.":"System is not effective — recommend improvement before production use."}
    </div>`:""}
    <button onclick="window.print()" style="margin-top:14px;padding:6px 16px;background:#b45309;color:white;border:none;border-radius:4px;cursor:pointer;font-size:10pt;">🖨 Print</button>
    </body></html>`);
    win.document.close();
  }

  // ── Print handler — opens new window with full AIAG worksheet ───────────────
  function handlePrint() {
    if (phase !== "grid") return;
    if (studyType === "bias")               { handlePrintBias();       return; }
    if (studyType === "linearity")          { handlePrintLinearity();  return; }
    if (studyType === "stability")          { handlePrintStability();  return; }
    if (studyType === "attribute_agreement"){ handlePrintAAA();        return; }
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;
    const al = (i: number) => String.fromCharCode(65 + i);
    const pK1 = AIAG_K1[trialCount] ?? 3.05;
    const pK2 = AIAG_K2[appraiserCount] ?? 2.70;
    const pK3 = AIAG_K3[partCount] ?? 1.62;
    const pD4 = AIAG_D4[trialCount] ?? 2.575;
    const eq = equipment.find(e => e.id === equipmentId);
    const tol = tolerance;
    const tol6 = tol != null ? tol / 6 : null;
    const gMean = aiag ? aiag.partAvgs.reduce((s,v)=>s+v,0)/aiag.partAvgs.length : null;
    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" alt="${companyName??''}" style="max-height:55px;max-width:200px;object-fit:contain;"/>`
      : `<div style="font-size:14pt;font-weight:800;color:#1e3a5f;">${companyName??""}</div>`;

    // Build grid rows HTML
    let gridRows = "";
    for (let i = 0; i < appraiserCount; i++) {
      const aName = meta.appraiserNames[i] || `Appraiser ${al(i)}`;
      const bgColors = ["#e0f2fe","#f3e8ff","#fef9c3"];
      gridRows += `<tr style="background:${bgColors[i]??bgColors[0]};"><td colspan="${partCount+2}" style="padding:4px 10px;font-weight:700;font-size:9pt;">${i+1}. ${aName}</td></tr>`;
      for (let k = 0; k < trialCount; k++) {
        const rowNum = i*(trialCount+2)+k+1;
        let cells = ""; let sum=0, cnt=0;
        for (let j=0; j<partCount; j++) {
          const v = parseFloat(gridData[i]?.[j]?.[k]??"");
          cells += `<td style="text-align:center;font-family:monospace;">${isNaN(v)?"":v.toFixed(3)}</td>`;
          if (!isNaN(v)){sum+=v;cnt++;}
        }
        const avg = cnt===partCount?(sum/cnt).toFixed(3):"";
        gridRows += `<tr><td style="color:#555;white-space:nowrap;padding:3px 8px;"><span style="color:#ccc;margin-right:5px;">${rowNum}.</span>Trial ${k+1}</td>${cells}<td style="text-align:center;font-family:monospace;color:#888;">${avg}</td></tr>`;
      }
      // AVE row
      const aveNum = i*(trialCount+2)+trialCount+1;
      let aveCells="";
      for (let j=0;j<partCount;j++){
        const vs=Array.from({length:trialCount},(_,k)=>parseFloat(gridData[i]?.[j]?.[k]??"")).filter(v=>!isNaN(v));
        aveCells+=`<td style="text-align:center;font-family:monospace;">${vs.length===trialCount?(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(3):""}</td>`;
      }
      gridRows+=`<tr style="background:#f0fdf4;"><td style="font-weight:600;white-space:nowrap;padding:3px 8px;"><span style="color:#ccc;margin-right:5px;">${aveNum}.</span>AVE</td>${aveCells}<td style="font-family:monospace;font-weight:700;color:#166534;">x&#773;${al(i).toLowerCase()}= ${aiag?.XbarA[i]!=null?aiag.XbarA[i].toFixed(4):"&#8212;"}</td></tr>`;
      // Range row
      const rngNum = aveNum+1;
      let rCells="";
      for (let j=0;j<partCount;j++){
        const vs=Array.from({length:trialCount},(_,k)=>parseFloat(gridData[i]?.[j]?.[k]??"")).filter(v=>!isNaN(v));
        const rng=vs.length===trialCount?Math.max(...vs)-Math.min(...vs):NaN;
        const over=aiag?.UCLR!=null&&!isNaN(rng)&&rng>aiag.UCLR;
        rCells+=`<td style="text-align:center;font-family:monospace;${over?"color:red;font-weight:700;":""}">${isNaN(rng)?"":rng.toFixed(3)}${over?"&#9650;":""}</td>`;
      }
      gridRows+=`<tr style="background:#f0fdf4;"><td style="font-weight:600;white-space:nowrap;padding:3px 8px;"><span style="color:#ccc;margin-right:5px;">${rngNum}.</span>R</td>${rCells}<td style="font-family:monospace;font-weight:700;color:#0369a1;">r${al(i).toLowerCase()}= ${aiag?.RbarA[i]!=null?aiag.RbarA[i].toFixed(4):"&#8212;"}</td></tr>`;
    }
    // Part Average
    let paCells="";
    for (let j=0;j<partCount;j++) paCells+=`<td style="text-align:center;font-family:monospace;font-weight:700;">${aiag?.partAvgs[j]!=null?aiag.partAvgs[j].toFixed(3):""}</td>`;
    gridRows+=`<tr style="background:#e9ecef;border-top:2px solid #444;"><td style="font-weight:700;padding:4px 8px;">PART AVERAGE</td>${paCells}<td style="font-family:monospace;font-weight:700;">${gMean!=null?`X&#773;= ${gMean.toFixed(4)}`:""}${aiag?`  Rp= ${aiag.Rp.toFixed(4)}`:""}</td></tr>`;
    // Footer rows 17-19
    const rbarCalc=aiag?`(${aiag.RbarA.map(r=>r.toFixed(4)).join(" + ")}) &#247; ${appraiserCount}`:"";
    gridRows+=`<tr style="background:#fafafa;font-style:italic;font-size:8pt;"><td colspan="${partCount+1}" style="color:#666;padding:3px 8px;">(${Array.from({length:appraiserCount},(_,i)=>`r${al(i).toLowerCase()}`).join(" + ")}) &#247; ${appraiserCount} = ${rbarCalc}</td><td style="font-family:monospace;font-weight:700;color:#0369a1;font-style:normal;padding:3px 8px;">R&#772;= ${aiag?.Rbar.toFixed(4)??"&#8212;"}</td></tr>`;
    const xdiffCalc=aiag?`${Math.max(...aiag.XbarA).toFixed(4)} &minus; ${Math.min(...aiag.XbarA).toFixed(4)}`:"";
    gridRows+=`<tr style="background:#fafafa;font-style:italic;font-size:8pt;"><td colspan="${partCount+1}" style="color:#666;padding:3px 8px;">x&#773;DIFF = Max x&#773; &minus; Min x&#773; = ${xdiffCalc}</td><td style="font-family:monospace;font-weight:700;color:#166534;font-style:normal;padding:3px 8px;">x&#773;DIFF= ${aiag?.xdiff.toFixed(4)??"&#8212;"}</td></tr>`;
    const uclCalc=aiag?`${aiag.Rbar.toFixed(4)} &times; ${pD4}`:"";
    gridRows+=`<tr style="background:#fafafa;font-style:italic;font-size:8pt;"><td colspan="${partCount+1}" style="color:#666;padding:3px 8px;">* UCL<sub>R</sub> = R&#772; &times; D&#8324; = ${uclCalc} &nbsp;&nbsp;(D&#8324; = 3.27 for 2 trials &middot; 2.58 for 3 trials)</td><td style="font-family:monospace;font-weight:700;color:#92400e;font-style:normal;padding:3px 8px;">UCL<sub>R</sub>= ${aiag?.UCLR.toFixed(4)??"&#8212;"}</td></tr>`;

    // Analysis section
    let analysisHtml="";
    if (aiag) {
      const gc=aiag.pctGRR<10?"#166534":aiag.pctGRR<=30?"#92400e":"#991b1b";
      const gbg=aiag.pctGRR<10?"#dcfce7":aiag.pctGRR<=30?"#fef3c7":"#fee2e2";
      const kRows=(obj:Record<string,number>,active:number)=>Object.entries(obj).map(([k,v])=>`<tr style="${active===+k?"background:#dbeafe;font-weight:700;":""}"><td style="border:1px solid #ccc;padding:2px 5px;">${k}</td><td style="border:1px solid #ccc;padding:2px 5px;text-align:right;font-family:monospace;">${v}</td></tr>`).join("");
      const tolRows=tol6!=null?[{l:"%EV",v:aiag.EV},{l:"%AV",v:aiag.AV},{l:"%GRR",v:aiag.GRR,b:true},{l:"%PV",v:aiag.PV}].map(r=>`<div style="display:flex;gap:4px;font-family:monospace;${r.b?"font-weight:700;":""}font-size:8pt;"><span style="width:38px;">${r.l}</span><span>=</span><span>100(${r.v.toFixed(4)}/${tol6.toFixed(4)})</span><span style="margin-left:auto;${r.b?`color:${gc};`:""}">= ${(r.v/tol6*100).toFixed(2)}%</span></div>`).join(""):"";
      const varRows=[{l:"Repeatability (EV)",s:aiag.EV,p:aiag.pctEV,g:false},{l:"Reproducibility (AV)",s:aiag.AV,p:aiag.pctAV,g:false},{l:"Gage R&amp;R (GRR)",s:aiag.GRR,p:aiag.pctGRR,g:true},{l:"Part-to-Part (PV)",s:aiag.PV,p:aiag.pctPV,g:false},{l:"Total Variation (TV)",s:aiag.TV,p:100,g:false}].map((r,i)=>`<tr style="${i===4?"background:#f8f9fa;font-weight:700;":""}"><td style="padding:5px 10px;border:1px solid #ccc;${!r.g&&i!==4?"padding-left:22px;color:#555;":"font-weight:700;"}">${r.l}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right;font-family:monospace;">${r.s.toFixed(4)}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right;font-family:monospace;">${(r.s*6).toFixed(4)}</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right;">${(r.p**2/100).toFixed(1)}%</td><td style="padding:5px 10px;border:1px solid #ccc;text-align:right;font-weight:700;${r.g?`color:${gc};`:""}">${r.p.toFixed(1)}%</td>${tol6!=null?`<td style="padding:5px 10px;border:1px solid #ccc;text-align:right;${r.g?`color:${gc};font-weight:700;`:""}">${(r.s/tol6*100).toFixed(1)}%</td>`:""}</tr>`).join("");
      analysisHtml=`
      <div style="margin-top:14px;border:1px solid #ccc;border-radius:4px;overflow:hidden;font-size:8.5pt;">
        <div style="background:#f0f0f0;padding:5px 12px;border-bottom:1px solid #ccc;font-weight:700;font-size:7.5pt;text-transform:uppercase;letter-spacing:0.05em;color:#555;">Gage Repeatability &amp; Reproducibility — Measurement Unit Analysis (AIAG MSA 4th Ed.)</div>
        <div style="display:grid;grid-template-columns:3fr 2fr;border-bottom:1px solid #ccc;">
          <div style="padding:14px;border-right:1px solid #ccc;">
            ${[["Repeatability — Equipment Variation (EV)","EV = R&#772; &times; K&#8321;",`${aiag.Rbar.toFixed(4)} &times; ${pK1}`,aiag.EV.toFixed(4)],["Reproducibility — Appraiser Variation (AV)","AV = &radic;[(x&#773;DIFF &times; K&#8322;)&sup2; &minus; (EV&sup2; &divide; n&times;r)]",`&radic;[(${aiag.xdiff.toFixed(4)} &times; ${pK2})&sup2; &minus; (${aiag.EV.toFixed(4)}&sup2; &divide; ${partCount}&times;${trialCount})]`,aiag.AV.toFixed(4)],["Repeatability &amp; Reproducibility (GRR)","GRR = &radic;(EV&sup2; + AV&sup2;)",`&radic;(${aiag.EV.toFixed(4)}&sup2; + ${aiag.AV.toFixed(4)}&sup2;)`,aiag.GRR.toFixed(4)],["Part Variation (PV)","PV = Rp &times; K&#8323;",`${aiag.Rp.toFixed(4)} &times; ${pK3}`,aiag.PV.toFixed(4)],["Total Variation (TV)","TV = &radic;(GRR&sup2; + PV&sup2;)",`&radic;(${aiag.GRR.toFixed(4)}&sup2; + ${aiag.PV.toFixed(4)}&sup2;)`,aiag.TV.toFixed(4)]].map(([title,formula,sub,result])=>`<div style="margin-bottom:10px;"><div style="font-weight:700;color:#444;margin-bottom:3px;">${title}</div><div style="font-family:monospace;">${formula}</div><div style="font-family:monospace;color:#666;padding-left:14px;">= ${sub}</div><div style="font-family:monospace;font-weight:700;padding-left:14px;">= ${result}</div></div>`).join("")}
            ${tol6!=null?`<div style="border-top:1px solid #eee;padding-top:8px;margin-top:4px;"><div style="font-weight:700;color:#444;margin-bottom:3px;">Tolerance (Tol)</div><div style="font-family:monospace;">Tol = (USL &minus; LSL) &divide; 6</div><div style="font-family:monospace;color:#666;padding-left:14px;">= (${meta.usl} &minus; ${meta.lsl}) &divide; 6</div><div style="font-family:monospace;font-weight:700;padding-left:14px;">= ${tol6.toFixed(4)}</div></div>`:""}
          </div>
          <div style="padding:14px;">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
              <table style="border-collapse:collapse;font-size:7.5pt;"><thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ccc;padding:2px 5px;text-align:left;">Trials</th><th style="border:1px solid #ccc;padding:2px 5px;font-weight:700;">K&#8321;</th></tr></thead><tbody>${kRows(AIAG_K1,trialCount)}</tbody></table>
              <table style="border-collapse:collapse;font-size:7.5pt;"><thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ccc;padding:2px 5px;text-align:left;">App.</th><th style="border:1px solid #ccc;padding:2px 5px;font-weight:700;">K&#8322;</th></tr></thead><tbody>${kRows(AIAG_K2,appraiserCount)}</tbody></table>
              <table style="border-collapse:collapse;font-size:7.5pt;"><thead><tr style="background:#f0f0f0;"><th style="border:1px solid #ccc;padding:2px 5px;text-align:left;">Parts</th><th style="border:1px solid #ccc;padding:2px 5px;font-weight:700;">K&#8323;</th></tr></thead><tbody>${kRows(AIAG_K3,partCount)}</tbody></table>
            </div>
            ${tol6!=null?`<div style="margin-bottom:14px;"><div style="font-size:7pt;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:5px;">% Tolerance (Tol = ${tol6.toFixed(4)})</div>${tolRows}</div>`:""}
            <div style="border-top:1px solid #eee;padding-top:10px;">
              <div style="font-family:monospace;margin-bottom:8px;font-size:8pt;"><div>ndc = 1.41 &times; (PV &divide; GRR)</div><div style="color:#666;padding-left:14px;">= 1.41 &times; (${aiag.PV.toFixed(4)} &divide; ${aiag.GRR.toFixed(4)})</div><div style="font-weight:700;padding-left:14px;">= ${aiag.ndc}</div></div>
              <div style="background:${gbg};border:1px solid ${gc}40;border-radius:6px;padding:12px;text-align:center;">
                <div style="font-size:18pt;font-weight:900;color:${gc};">%GRR = ${aiag.pctGRR.toFixed(2)}%</div>
                <div style="margin-top:5px;display:inline-block;padding:3px 12px;border-radius:99px;background:${aiag.ndc>=5?"#dcfce7":"#fee2e2"};color:${aiag.ndc>=5?"#166534":"#991b1b"};font-weight:700;font-size:9pt;">NDC = ${aiag.ndc} ${aiag.ndc>=5?"✓":"✗"}</div>
                <div style="margin-top:6px;display:inline-block;padding:4px 14px;border-radius:99px;background:${aiag.pctGRR<10?"#16a34a":aiag.pctGRR<=30?"#f59e0b":"#dc2626"};color:white;font-weight:800;font-size:9pt;">${aiag.pctGRR<10?"Gage System OK ✓":aiag.pctGRR<=30?"⚠ Marginal":"✗ Unacceptable"}</div>
                <div style="margin-top:4px;font-size:7pt;color:#666;">&lt;10% Acceptable &middot; 10–30% Marginal &middot; &gt;30% Unacceptable</div>
              </div>
            </div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5pt;">
          <thead style="background:#f0f0f0;"><tr><th style="text-align:left;padding:6px 10px;border:1px solid #ccc;">Source</th><th style="text-align:right;padding:6px 10px;border:1px solid #ccc;">&sigma; (Std Dev)</th><th style="text-align:right;padding:6px 10px;border:1px solid #ccc;">6&sigma; Study Var</th><th style="text-align:right;padding:6px 10px;border:1px solid #ccc;">%Contribution</th><th style="text-align:right;padding:6px 10px;border:1px solid #ccc;">%Study Var</th>${tol6!=null?`<th style="text-align:right;padding:6px 10px;border:1px solid #ccc;">%Tolerance</th>`:""}</tr></thead>
          <tbody>${varRows}</tbody>
        </table>
      </div>`;
    }

    const partHeaders = Array.from({length:partCount},(_,j)=>`<th style="text-align:center;min-width:58px;">${j+1}</th>`).join("");
    const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>MSA Gage R&amp;R — ${meta.partName||"Study"}</title><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:9pt;color:#111;padding:16px;}@page{size:landscape;margin:0.4in;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:3px 6px;}.ph{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;margin-bottom:12px;border-bottom:2px solid #1e3a5f;}.pt h1{font-size:12pt;font-weight:800;color:#1e3a5f;text-align:right;}.pt p{font-size:8pt;color:#666;text-align:right;}.sh{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #ccc;margin-bottom:10px;font-size:8.5pt;}.sh>div{padding:4px 8px;border-right:1px solid #ccc;border-bottom:1px solid #ccc;}.sh>div:nth-child(3n){border-right:none;}.fl{color:#555;font-weight:600;margin-right:4px;}</style></head><body>
    <div class="ph"><div>${logoHtml}</div><div class="pt"><h1>Variable Gage Study — Long Form</h1><p>AIAG MSA 4th Ed. &middot; ${studyDate} &middot; ${eq?.name??"Gage"} (${eq?.gageId??""})</p></div></div>
    <div class="sh">
      <div><span class="fl">Part Number:</span>${meta.partNumber||"&#8212;"}</div><div><span class="fl">Gage Name:</span>${meta.gaugeDesc||(eq?.name??"&#8212;")}</div><div><span class="fl">Appraiser A:</span>${meta.appraiserNames[0]||"&#8212;"}</div>
      <div><span class="fl">Part Name:</span>${meta.partName||"&#8212;"}</div><div><span class="fl">Gage Number:</span>${eq?.gageId??"&#8212;"}</div><div><span class="fl">Appraiser B:</span>${meta.appraiserNames[1]||"&#8212;"}</div>
      <div><span class="fl">Characteristic:</span>${meta.characteristic||"&#8212;"}</div><div><span class="fl">Gage Type:</span>${meta.gaugeDesc||"&#8212;"}</div><div><span class="fl">${appraiserCount>=3?`Appraiser C: ${meta.appraiserNames[2]||"&#8212;"}`:"&nbsp;"}</span></div>
      <div><span class="fl">Specification:</span>${meta.lsl||"&#8212;"} / ${meta.usl||"&#8212;"}</div><div><span class="fl">Trials:</span>${trialCount} &nbsp;<span class="fl">Parts:</span>${partCount} &nbsp;<span class="fl">Appraisers:</span>${appraiserCount}</div><div><span class="fl">Performed By:</span>${meta.performedBy||"&#8212;"}</div>
    </div>
    <table><thead><tr style="background:#e9ecef;"><th style="text-align:left;min-width:165px;">APPRAISER / TRIAL #</th>${partHeaders}<th style="text-align:center;min-width:100px;">AVERAGE</th></tr></thead><tbody>${gridRows}</tbody></table>
    ${analysisHtml}
    ${notes?`<div style="margin-top:12px;padding:8px 12px;background:#f8f9fa;border:1px solid #ccc;border-radius:4px;font-size:8.5pt;"><strong>Notes / Corrective Action:</strong><br/>${notes}</div>`:""}
    <div style="margin-top:14px;font-size:7pt;color:#999;text-align:center;border-top:1px solid #eee;padding-top:6px;">Generated ${new Date().toLocaleString()} &middot; Core Compliance Hub &middot; AIAG MSA 4th Ed. Variable Gage Study (Long Method)</div>
    <script>window.onload=function(){window.print();}</script></body></html>`;
    win.document.write(html);
    win.document.close();
  }

  const grrColor = aiag
    ? aiag.pctGRR < 10 ? "text-emerald-600" : aiag.pctGRR <= 30 ? "text-amber-600" : "text-red-600"
    : "";

  // ══════════════════════════════════════════════════════════════════════════════
  // ── CONFIG PHASE ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === "config") {
    return (
      <div className="space-y-5">
        {/* ── Core info (all study types) ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-sm font-semibold">Equipment / Gage *</Label>
            <Select value={String(equipmentId)} onValueChange={v => setEquipmentId(Number(v))}>
              <SelectTrigger className="mt-1 h-8" data-testid="select-msa-equipment">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.filter(e => e.status === "active").map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.gageId} — {e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold">Study Type *</Label>
            <Select value={studyType} onValueChange={setStudyType}>
              <SelectTrigger className="mt-1 h-8" data-testid="select-msa-study-type"><SelectValue /></SelectTrigger>
              <SelectContent>{MSA_STUDY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold">Study Date *</Label>
            <Input type="date" className="mt-1 h-8" value={studyDate}
              onChange={e => setStudyDate(e.target.value)} data-testid="input-msa-study-date" />
          </div>
        </div>

        {/* ── Shared AIAG Worksheet Header (all study types) ── */}
        <div className="border rounded-lg p-3 space-y-3 bg-muted/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Study Header (AIAG Worksheet)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Part Name</Label>
              <Input className="mt-1 h-7 text-sm" value={meta.partName} onChange={e=>setMetaField("partName",e.target.value)} placeholder="e.g. Control Arm Bracket" data-testid="input-msa-part-name" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Part / Drawing No.</Label>
              <Input className="mt-1 h-7 text-sm" value={meta.partNumber} onChange={e=>setMetaField("partNumber",e.target.value)} placeholder="e.g. 1234-A" data-testid="input-msa-part-number" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Characteristic / Feature</Label>
              <Input className="mt-1 h-7 text-sm" value={meta.characteristic} onChange={e=>setMetaField("characteristic",e.target.value)} placeholder="e.g. Bore Diameter" data-testid="input-msa-characteristic" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Gauge / Gage Description</Label>
              <Input className="mt-1 h-7 text-sm" value={meta.gaugeDesc} onChange={e=>setMetaField("gaugeDesc",e.target.value)} placeholder={studyType==="attribute_agreement"?"e.g. Attribute / Visual":"e.g. Digital Caliper 0-6\""} data-testid="input-msa-gauge-desc" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Performed By</Label>
              <Input className="mt-1 h-7 text-sm" value={meta.performedBy} onChange={e=>setMetaField("performedBy",e.target.value)} placeholder="e.g. Quality Engineer" data-testid="input-msa-performed-by" />
            </div>
            {studyType !== "attribute_agreement" && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs font-semibold">USL <span className="font-normal text-muted-foreground">(opt.)</span></Label>
                  <Input className="mt-1 h-7 text-sm" value={meta.usl} onChange={e=>setMetaField("usl",e.target.value)} placeholder="e.g. 25.05" data-testid="input-msa-usl" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-semibold">LSL <span className="font-normal text-muted-foreground">(opt.)</span></Label>
                  <Input className="mt-1 h-7 text-sm" value={meta.lsl} onChange={e=>setMetaField("lsl",e.target.value)} placeholder="e.g. 24.95" data-testid="input-msa-lsl" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── GRR Study Configuration ── */}
        {studyType === "gage_rrr" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-semibold">Appraisers</Label>
                <div className="flex gap-2 mt-1">
                  {[2,3].map(n=><button key={n} type="button" onClick={()=>setAppraiserCount(n)} className={`flex-1 h-8 rounded border text-sm font-bold transition-colors ${appraiserCount===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-appraisers-${n}`}>{n}</button>)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Trials / Part</Label>
                <div className="flex gap-2 mt-1">
                  {[2,3].map(n=><button key={n} type="button" onClick={()=>setTrialCount(n)} className={`flex-1 h-8 rounded border text-sm font-bold transition-colors ${trialCount===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-trials-${n}`}>{n}</button>)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Parts to Sample</Label>
                <div className="flex gap-1 mt-1">
                  {[5,6,7,8,9,10].map(n=><button key={n} type="button" onClick={()=>setPartCount(n)} className={`flex-1 h-8 rounded border text-xs font-bold transition-colors ${partCount===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-parts-${n}`}>{n}</button>)}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Appraiser Names</Label>
              <div className="flex gap-2 mt-1">
                {Array.from({length:appraiserCount},(_,i)=>(
                  <Input key={i} className="h-8 text-sm" value={meta.appraiserNames[i]??""} onChange={e=>setAppraiserName(i,e.target.value)} placeholder={`Appraiser ${String.fromCharCode(65+i)}`} data-testid={`input-appraiser-name-${i}`} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buildDataSheet} disabled={!equipmentId||!studyDate} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-build-data-sheet">
                Build AIAG Data Sheet → ({appraiserCount} × {partCount} × {trialCount})
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </>
        )}

        {/* ── Bias Study Configuration ── */}
        {studyType === "bias" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 text-xs text-sky-700 dark:text-sky-300">
              <strong>AIAG MSA 4th Ed. §3.1 — Bias Study:</strong> Obtain the known reference/master value for the part. Collect ≥10 repeat measurements (25 recommended) using the same appraiser and gage. The study determines whether the measurement system has statistically significant bias.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold">Reference Value (Known Master) *</Label>
                <Input className="mt-1 h-8 text-sm font-mono" value={biasRef} onChange={e=>setBiasRef(e.target.value)} placeholder="e.g. 10.000" data-testid="input-bias-ref" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Process Variation TV <span className="text-muted-foreground font-normal">(6σ or tolerance, optional)</span></Label>
                <Input className="mt-1 h-8 text-sm font-mono" value={biasProcessVar} onChange={e=>setBiasProcessVar(e.target.value)} placeholder="e.g. 0.500" data-testid="input-bias-pv" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Number of Measurements (n)</Label>
              <div className="flex gap-2 mt-1">
                {[10,15,25,50].map(n=><button key={n} type="button" onClick={()=>setBiasN(n)} className={`px-4 h-8 rounded border text-sm font-bold transition-colors ${biasN===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-bias-n-${n}`}>{n}</button>)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buildDataSheet} disabled={!equipmentId||!studyDate} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-build-bias-sheet">
                Build Bias Data Sheet →
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ── Linearity Study Configuration ── */}
        {studyType === "linearity" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 text-xs text-violet-700 dark:text-violet-300">
              <strong>AIAG MSA 4th Ed. §3.2 — Linearity Study:</strong> Select 5 reference parts that span the operating measurement range (low, mid-low, middle, mid-high, high). Obtain known reference values via a layout inspection. Collect 10–12 repeat measurements per reference level to determine if bias is consistent across the measurement range.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold">Process Variation TV <span className="text-muted-foreground font-normal">(6σ, optional)</span></Label>
                <Input className="mt-1 h-8 text-sm font-mono" value={linProcessVar} onChange={e=>setLinProcessVar(e.target.value)} placeholder="e.g. 1.000" data-testid="input-lin-pv" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Measurements per Reference Level</Label>
                <div className="flex gap-2 mt-1">
                  {[5,10,12].map(n=><button key={n} type="button" onClick={()=>setLinMeasCount(n)} className={`px-4 h-8 rounded border text-sm font-bold transition-colors ${linMeasCount===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-lin-meas-${n}`}>{n}</button>)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buildDataSheet} disabled={!equipmentId||!studyDate} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-build-lin-sheet">
                Build Linearity Data Sheet → (5 Levels × {linMeasCount})
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ── Stability Study Configuration ── */}
        {studyType === "stability" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300">
              <strong>AIAG MSA 4th Ed. §3.3 — Stability Study:</strong> Select a master/reference part with a known value. Measure it n times per subgroup at regular time intervals (daily, weekly, monthly) over ≥25 periods. Produces an X̄-R control chart to detect measurement system drift over time.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold">Reference Value (Known Master)</Label>
                <Input className="mt-1 h-8 text-sm font-mono" value={stabRef} onChange={e=>setStabRef(e.target.value)} placeholder="e.g. 50.000" data-testid="input-stab-ref" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Subgroup Size (n readings per period)</Label>
                <div className="flex gap-2 mt-1">
                  {[2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setStabSubgroupSize(n)} className={`flex-1 h-8 rounded border text-sm font-bold transition-colors ${stabSubgroupSize===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-stab-sgsize-${n}`}>{n}</button>)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buildDataSheet} disabled={!equipmentId||!studyDate} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-build-stab-sheet">
                Build Stability Chart → (25 Subgroups × n={stabSubgroupSize})
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ── Attribute Agreement Analysis Configuration ── */}
        {studyType === "attribute_agreement" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs text-amber-700 dark:text-amber-300">
              <strong>AIAG MSA 4th Ed. §4 — Attribute Agreement Analysis:</strong> Each appraiser classifies each part as Accept or Reject across multiple trials. The study measures within-appraiser consistency, between-appraiser agreement, and agreement vs. a known reference standard. Uses Cohen's Kappa (κ). AIAG criterion: κ ≥ 0.75 acceptable.
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-semibold">Appraisers</Label>
                <div className="flex gap-2 mt-1">
                  {[2,3].map(n=><button key={n} type="button" onClick={()=>setAaaAppraisers(n)} className={`flex-1 h-8 rounded border text-sm font-bold transition-colors ${aaaAppraisers===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-aaa-appraisers-${n}`}>{n}</button>)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Parts (samples)</Label>
                <div className="flex gap-2 mt-1">
                  {[20,25,30].map(n=><button key={n} type="button" onClick={()=>setAaaParts(n)} className={`flex-1 h-8 rounded border text-sm font-bold transition-colors ${aaaParts===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-aaa-parts-${n}`}>{n}</button>)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Trials / Part</Label>
                <div className="flex gap-2 mt-1">
                  {[2,3].map(n=><button key={n} type="button" onClick={()=>setAaaTrials(n)} className={`flex-1 h-8 rounded border text-sm font-bold transition-colors ${aaaTrials===n?"bg-accent text-white border-accent":"border-border hover:border-accent/40"}`} data-testid={`btn-aaa-trials-${n}`}>{n}</button>)}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Appraiser Names</Label>
              <div className="flex gap-2 mt-1">
                {Array.from({length:aaaAppraisers},(_,i)=>(
                  <Input key={i} className="h-8 text-sm" value={meta.appraiserNames[i]??""} onChange={e=>setAppraiserName(i,e.target.value)} placeholder={`Appraiser ${String.fromCharCode(65+i)}`} data-testid={`input-aaa-appraiser-name-${i}`} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buildDataSheet} disabled={!equipmentId||!studyDate} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-build-aaa-sheet">
                Build AAA Data Sheet → ({aaaAppraisers} Appraisers × {aaaParts} Parts × {aaaTrials} Trials)
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── BIAS DATA PHASE ───────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === "grid" && studyType === "bias") {
    const r = biasResult;
    const resultColor = r?.result === "acceptable" ? "text-emerald-600" : r?.result === "marginal" ? "text-amber-600" : "text-red-600";
    const resultBg    = r?.result === "acceptable" ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30" : r?.result === "marginal" ? "bg-amber-50 border-amber-300 dark:bg-amber-950/30" : "bg-red-50 border-red-300 dark:bg-red-950/30";
    return (
      <div className="space-y-4">
        {/* Study Info Banner */}
        <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-sky-50 dark:bg-sky-950/30 border-sky-200">
          <div className="flex items-center gap-3">
            {companyLogo && <img src={companyLogo} alt="" className="h-8 object-contain" />}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">Bias Study — AIAG MSA 4th Ed. §3.1</div>
              <div className="text-[11px] text-muted-foreground">{meta.partName||"—"} · {meta.characteristic||"—"} · {meta.gaugeDesc||"—"} · Ref: <span className="font-mono font-bold">{biasRef||"—"}</span></div>
            </div>
          </div>
          <button onClick={()=>setPhase("config")} className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1">← Edit Config</button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Measurement Grid */}
          <div className="col-span-3 border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-3 py-1.5 border-b flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide">Measurements (n = {biasN})</span>
              <span className="text-[10px] text-muted-foreground">Ref = <span className="font-mono font-bold">{biasRef||"?"}</span> &nbsp;|&nbsp; Enter each reading</span>
            </div>
            <div className="p-3 grid grid-cols-5 gap-1.5">
              {Array.from({length:biasN},(_,i)=>(
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-right">{i+1}.</span>
                  <Input className="h-7 text-xs font-mono p-1 text-center" value={biasReadings[i]??""} onChange={e=>{const next=[...biasReadings];next[i]=e.target.value;setBiasReadings(next);}} data-testid={`input-bias-${i}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="col-span-2 space-y-3">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-3 py-1.5 border-b text-xs font-bold uppercase tracking-wide">Live Analysis</div>
              <div className="p-3 space-y-1.5 text-sm">
                {[
                  ["n (entered)",          r ? String(r.n) : "—"],
                  ["Sample Mean (x̄)",      r ? r.mean.toFixed(5) : "—"],
                  ["Bias (x̄ − Ref)",       r ? (r.bias >= 0 ? "+" : "") + r.bias.toFixed(5) : "—"],
                  ["Std Dev σ",             r ? r.sigma.toFixed(5) : "—"],
                  ["t-statistic",           r ? r.tStat.toFixed(3) : "—"],
                  ["t-critical (95%)",      r ? r.tc.toFixed(3) : "—"],
                  ["Bias Significant?",     r ? (r.significant ? "YES ⚠" : "No") : "—"],
                  ["%Bias (|Bias|/TV×100)", r && r.pctBias != null ? r.pctBias.toFixed(2) + "%" : "—"],
                  ["%Repeatability (5.15σ/TV)", r && r.pctRepeat != null ? r.pctRepeat.toFixed(2) + "%" : "—"],
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between gap-2 text-xs border-b last:border-0 pb-1 last:pb-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={`font-mono font-semibold ${k==="Bias Significant?"&&r?.significant?"text-red-600":""}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Result Badge */}
            {r && (
              <div className={`border rounded-lg p-3 ${resultBg}`}>
                <div className={`text-xs font-black uppercase tracking-wider mb-1 ${resultColor}`}>
                  {r.result === "acceptable" ? "✓ Acceptable" : r.result === "marginal" ? "⚠ Marginal" : "✗ Unacceptable"}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {r.significant ? "Statistically significant bias detected (t > t-crit)." : "Bias not statistically significant."}
                  {r.pctBias != null ? ` %Bias = ${r.pctBias.toFixed(2)}%.` : ""}
                  {" "}AIAG criterion: ≤10% acceptable, ≤30% marginal.
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea className="mt-1 text-xs" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Study conditions, corrective actions..." data-testid="textarea-bias-notes" />
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-white text-xs h-8" data-testid="button-save-bias">
                {isSaving ? "Saving…" : initial ? "Update Study" : "Save Study"}
              </Button>
              <Button variant="outline" onClick={handlePrint} className="text-xs h-8" data-testid="button-print-bias">Print Study</Button>
              <Button variant="outline" onClick={()=>setPhase("config")} className="text-xs h-8">← Back</Button>
              <Button variant="outline" onClick={onCancel} className="text-xs h-8">Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── LINEARITY DATA PHASE ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === "grid" && studyType === "linearity") {
    const r = linResult;
    const resultColor = r?.result === "acceptable" ? "text-emerald-600" : r?.result === "marginal" ? "text-amber-600" : "text-red-600";
    const resultBg    = r?.result === "acceptable" ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30" : r?.result === "marginal" ? "bg-amber-50 border-amber-300 dark:bg-amber-950/30" : "bg-red-50 border-red-300 dark:bg-red-950/30";
    return (
      <div className="space-y-4">
        {/* Study Info Banner */}
        <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-violet-50 dark:bg-violet-950/30 border-violet-200">
          <div className="flex items-center gap-3">
            {companyLogo && <img src={companyLogo} alt="" className="h-8 object-contain" />}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-300">Linearity Study — AIAG MSA 4th Ed. §3.2</div>
              <div className="text-[11px] text-muted-foreground">{meta.partName||"—"} · {meta.characteristic||"—"} · {meta.gaugeDesc||"—"} · TV: <span className="font-mono font-bold">{linProcessVar||"—"}</span></div>
            </div>
          </div>
          <button onClick={()=>setPhase("config")} className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1">← Edit Config</button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Reference Level Grids */}
          <div className="col-span-3 space-y-3">
            {linParts.map((lp, pi) => {
              const vals=lp.readings.filter(s=>s.trim()!=="").map(Number).filter(v=>!isNaN(v));
              const ref=parseFloat(lp.reference);
              const mean=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:NaN;
              const bias=mean-ref;
              return (
                <div key={pi} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-3 py-1.5 border-b flex items-center justify-between">
                    <span className="text-xs font-bold">Level {pi+1}</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] text-muted-foreground">Reference:</Label>
                      <Input className="h-6 w-28 text-xs font-mono p-1 text-center" value={lp.reference}
                        onChange={e=>{const next=[...linParts];next[pi]={...next[pi],reference:e.target.value};setLinParts(next);}}
                        placeholder="e.g. 10.000" data-testid={`input-lin-ref-${pi}`} />
                      {!isNaN(ref)&&!isNaN(mean)&&<span className="text-[10px] font-mono font-semibold text-muted-foreground">Bias = {bias>=0?"+":""}{bias.toFixed(4)}</span>}
                    </div>
                  </div>
                  <div className="p-2 flex flex-wrap gap-1">
                    {lp.readings.slice(0, linMeasCount).map((_,i)=>(
                      <div key={i} className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground w-4 text-right">{i+1}.</span>
                        <Input className="h-7 w-20 text-xs font-mono p-1 text-center"
                          value={lp.readings[i]??""}
                          onChange={e=>{const next=[...linParts];next[pi]={...next[pi],readings:next[pi].readings.map((v,idx)=>idx===i?e.target.value:v)};setLinParts(next);}}
                          data-testid={`input-lin-${pi}-${i}`} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analysis Panel */}
          <div className="col-span-2 space-y-3">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-3 py-1.5 border-b text-xs font-bold uppercase tracking-wide">Regression Analysis</div>
              <div className="p-3 space-y-1.5">
                {r && r.levels.map((lv,i)=>(
                  <div key={i} className="flex justify-between text-xs border-b pb-1">
                    <span className="text-muted-foreground">Level {i+1} Bias</span>
                    <span className={`font-mono font-semibold ${Math.abs(lv.bias)>0.05?"text-amber-600":""}`}>{lv.bias>=0?"+":""}{lv.bias.toFixed(4)}</span>
                  </div>
                ))}
                {[
                  ["Slope β₁",              r ? r.slope.toFixed(4) : "—"],
                  ["Intercept β₀",          r ? r.intercept.toFixed(4) : "—"],
                  ["R² (goodness of fit)",  r ? r.r2.toFixed(4) : "—"],
                  ["Max |Bias|",            r ? r.maxBiasAbs.toFixed(4) : "—"],
                  ["%Linearity",            r && r.pctLinearity!=null ? r.pctLinearity.toFixed(2)+"%" : "—"],
                  ["%Max Bias",             r && r.pctBias!=null ? r.pctBias.toFixed(2)+"%" : "—"],
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between gap-2 text-xs border-b last:border-0 pb-1 last:pb-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-mono font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {r && (
              <div className={`border rounded-lg p-3 ${resultBg}`}>
                <div className={`text-xs font-black uppercase tracking-wider mb-1 ${resultColor}`}>
                  {r.result === "acceptable" ? "✓ Acceptable" : r.result === "marginal" ? "⚠ Marginal" : "✗ Unacceptable"}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  β₁ = {r.slope.toFixed(4)}, R² = {r.r2.toFixed(4)}.
                  {r.pctLinearity!=null?` %Linearity = ${r.pctLinearity.toFixed(2)}%.`:""}
                  {" "}AIAG criterion: ≤10% of TV acceptable.
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea className="mt-1 text-xs" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Study conditions..." data-testid="textarea-lin-notes" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-white text-xs h-8" data-testid="button-save-lin">
                {isSaving ? "Saving…" : initial ? "Update Study" : "Save Study"}
              </Button>
              <Button variant="outline" onClick={handlePrint} className="text-xs h-8" data-testid="button-print-lin">Print Study</Button>
              <Button variant="outline" onClick={()=>setPhase("config")} className="text-xs h-8">← Back</Button>
              <Button variant="outline" onClick={onCancel} className="text-xs h-8">Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── STABILITY DATA PHASE ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === "grid" && studyType === "stability") {
    const r = stabResult;
    const resultColor = r?.result === "acceptable" ? "text-emerald-600" : r?.result === "marginal" ? "text-amber-600" : "text-red-600";
    const resultBg    = r?.result === "acceptable" ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30" : r?.result === "marginal" ? "bg-amber-50 border-amber-300 dark:bg-amber-950/30" : "bg-red-50 border-red-300 dark:bg-red-950/30";
    return (
      <div className="space-y-4">
        {/* Study Info Banner */}
        <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
          <div className="flex items-center gap-3">
            {companyLogo && <img src={companyLogo} alt="" className="h-8 object-contain" />}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Stability Study — AIAG MSA 4th Ed. §3.3 · X̄-R Chart</div>
              <div className="text-[11px] text-muted-foreground">{meta.partName||"—"} · {meta.characteristic||"—"} · Ref: <span className="font-mono font-bold">{stabRef||"—"}</span> · n={stabSubgroupSize}</div>
            </div>
          </div>
          <button onClick={()=>setPhase("config")} className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1">← Edit Config</button>
        </div>

        {/* Control Limits Banner */}
        {r && (
          <div className="flex gap-4 flex-wrap border rounded-lg px-3 py-2 bg-muted/20 text-xs font-mono">
            <span><span className="font-bold text-sky-600">X̄:</span> CL={r.xbarBar.toFixed(4)} | UCL={r.UCLX.toFixed(4)} | LCL={r.LCLX.toFixed(4)}</span>
            <span><span className="font-bold text-orange-600">R:</span> CL={r.rBar.toFixed(4)} | UCL={r.UCLR.toFixed(4)} | LCL={r.LCLR.toFixed(4)}</span>
            <span><span className="font-bold">σ̂</span>= {r.sigma.toFixed(4)}</span>
            {r.bias!=null&&<span><span className="font-bold">Bias</span>= {r.bias>=0?"+":""}{r.bias.toFixed(4)}</span>}
            <span className={r.stable?"text-emerald-600 font-bold":"text-red-600 font-bold"}>{r.stable?"● Stable":"● OOC Detected"}</span>
          </div>
        )}

        <div className="grid grid-cols-5 gap-4">
          {/* Subgroup Table */}
          <div className="col-span-3 border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-3 py-1.5 border-b flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide">Subgroup Data (25 periods × n={stabSubgroupSize})</span>
              <span className="text-[10px] text-muted-foreground">▲ = Out of control</span>
            </div>
            <div className="overflow-auto max-h-[520px]">
              <table className="text-xs w-full">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="border px-1 py-1 text-center w-8">#</th>
                    <th className="border px-2 py-1 text-left w-28">Date</th>
                    {Array.from({length:stabSubgroupSize},(_,i)=><th key={i} className="border px-1 py-1 text-center w-20">x{i+1}</th>)}
                    <th className="border px-1 py-1 text-center w-20 text-sky-700">X̄</th>
                    <th className="border px-1 py-1 text-center w-20 text-orange-600">R</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length:25},(_,sgIdx)=>{
                    const sg=stabSubgroups[sgIdx]??{date:"",readings:Array(stabSubgroupSize).fill("")};
                    const vals=sg.readings.slice(0,stabSubgroupSize).map(Number).filter(v=>!isNaN(v));
                    const complete=vals.length===stabSubgroupSize;
                    const xbar=complete?vals.reduce((a,b)=>a+b,0)/vals.length:NaN;
                    const rng=complete?Math.max(...vals)-Math.min(...vals):NaN;
                    const oocX=r&&!isNaN(xbar)&&(xbar>r.UCLX||xbar<r.LCLX);
                    const oocR=r&&!isNaN(rng)&&rng>r.UCLR;
                    const rowBg=oocX||oocR?"bg-red-50 dark:bg-red-950/30":"";
                    return (
                      <tr key={sgIdx} className={rowBg}>
                        <td className="border px-1 py-0.5 text-center text-muted-foreground">{sgIdx+1}</td>
                        <td className="border px-1 py-0.5">
                          <Input className="h-6 text-[10px] font-mono p-0.5 border-0 bg-transparent w-full" value={sg.date}
                            onChange={e=>{const next=[...stabSubgroups];next[sgIdx]={...next[sgIdx],date:e.target.value};setStabSubgroups(next);}}
                            placeholder="Date" data-testid={`input-stab-date-${sgIdx}`} />
                        </td>
                        {Array.from({length:stabSubgroupSize},(_,readIdx)=>(
                          <td key={readIdx} className="border px-0.5 py-0.5">
                            <Input className="h-6 text-[10px] font-mono p-0.5 border-0 bg-transparent text-center w-full"
                              value={sg.readings[readIdx]??""}
                              onChange={e=>{const next=[...stabSubgroups];const nr=[...next[sgIdx].readings];nr[readIdx]=e.target.value;next[sgIdx]={...next[sgIdx],readings:nr};setStabSubgroups(next);}}
                              data-testid={`input-stab-${sgIdx}-${readIdx}`} />
                          </td>
                        ))}
                        <td className={`border px-1 py-0.5 text-center font-mono font-bold ${oocX?"text-red-600":""}`}>
                          {complete?xbar.toFixed(3):""}{oocX?"▲":""}
                        </td>
                        <td className={`border px-1 py-0.5 text-center font-mono font-bold ${oocR?"text-red-600":""}`}>
                          {complete?rng.toFixed(3):""}{oocR?"▲":""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="col-span-2 space-y-3">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-3 py-1.5 border-b text-xs font-bold uppercase tracking-wide">X̄-R Chart Statistics</div>
              <div className="p-3 space-y-1.5">
                {r && [
                  ["Subgroups entered",   String(r.sgs.length)],
                  ["Grand Mean (X̄̄)",     r.xbarBar.toFixed(5)],
                  ["Mean Range (R̄)",      r.rBar.toFixed(5)],
                  ["Process Std Dev σ̂",   r.sigma.toFixed(5)],
                  ["Bias from Ref",       stabRef?(r.bias!=null?((r.bias>=0?"+":"")+r.bias.toFixed(5)):"—"):"no ref"],
                  ["%Bias (|Bias|/6σ)",   r.pctBias!=null?r.pctBias.toFixed(2)+"%":"—"],
                  ["A₂ factor",           String(r.A2)],
                  ["D₄ factor",           String(r.D4)],
                  ["X̄ UCL",              r.UCLX.toFixed(5)],
                  ["X̄ LCL",              r.LCLX.toFixed(5)],
                  ["R UCL",               r.UCLR.toFixed(5)],
                  ["OOC X̄ subgroups",    r.oocX.length ? r.oocX.map(i=>i+1).join(", ") : "None"],
                  ["OOC R subgroups",     r.oocR.length ? r.oocR.map(i=>i+1).join(", ") : "None"],
                ].map(([k,v])=>(
                  <div key={k} className="flex justify-between gap-2 text-xs border-b last:border-0 pb-1 last:pb-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={`font-mono font-semibold ${k.startsWith("OOC")&&v!=="None"?"text-red-600":""}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {r && (
              <div className={`border rounded-lg p-3 ${resultBg}`}>
                <div className={`text-xs font-black uppercase tracking-wider mb-1 ${resultColor}`}>
                  {r.result === "acceptable" ? "✓ Stable — Acceptable" : r.result === "marginal" ? "⚠ Marginal — Monitor" : "✗ Unstable — Investigate"}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {r.stable?"No out-of-control points detected.":
                    `${r.oocX.length} X̄ OOC point(s) at subgroup(s) ${r.oocX.map(i=>i+1).join(", ")}. ${r.oocR.length} R OOC point(s).`}
                  {r.pctBias!=null?` %Bias from reference = ${r.pctBias.toFixed(2)}%.`:""}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea className="mt-1 text-xs" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Study conditions, corrective actions..." data-testid="textarea-stab-notes" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-white text-xs h-8" data-testid="button-save-stab">
                {isSaving ? "Saving…" : initial ? "Update Study" : "Save Study"}
              </Button>
              <Button variant="outline" onClick={handlePrint} className="text-xs h-8" data-testid="button-print-stab">Print Study</Button>
              <Button variant="outline" onClick={()=>setPhase("config")} className="text-xs h-8">← Back</Button>
              <Button variant="outline" onClick={onCancel} className="text-xs h-8">Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── ATTRIBUTE AGREEMENT ANALYSIS DATA PHASE ───────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === "grid" && studyType === "attribute_agreement") {
    const r = aaaResult;
    const al = (i:number) => meta.appraiserNames[i] || String.fromCharCode(65+i);
    const resultColor = r?.result === "acceptable" ? "text-emerald-600" : r?.result === "marginal" ? "text-amber-600" : "text-red-600";
    const resultBg    = r?.result === "acceptable" ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30" : r?.result === "marginal" ? "bg-amber-50 border-amber-300 dark:bg-amber-950/30" : "bg-red-50 border-red-300 dark:bg-red-950/30";
    return (
      <div className="space-y-4">
        {/* Study Info Banner */}
        <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200">
          <div className="flex items-center gap-3">
            {companyLogo && <img src={companyLogo} alt="" className="h-8 object-contain" />}
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Attribute Agreement Analysis — AIAG MSA 4th Ed. §4 · Cohen's Kappa</div>
              <div className="text-[11px] text-muted-foreground">{meta.partName||"—"} · {meta.characteristic||"—"} · {aaaAppraisers} appraisers · {aaaParts} parts · {aaaTrials} trials</div>
            </div>
          </div>
          <button onClick={()=>setPhase("config")} className="text-xs text-muted-foreground hover:text-foreground border rounded px-2 py-1">← Edit Config</button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="inline-block w-8 h-6 bg-emerald-100 border border-emerald-400 rounded text-center text-emerald-700 font-bold leading-6">A</span> = Accept</span>
          <span className="flex items-center gap-1"><span className="inline-block w-8 h-6 bg-red-100 border border-red-400 rounded text-center text-red-700 font-bold leading-6">R</span> = Reject</span>
          <span className="text-muted-foreground">Click toggles · Ref = known standard · ✓ = all trials agree</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* AAA Matrix — each appraiser in its own column block */}
          {Array.from({length:aaaAppraisers},(_,a)=>(
            <div key={a} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 px-3 py-1.5 border-b flex items-center justify-between">
                <span className="text-xs font-bold">Appraiser {al(a)}</span>
                {r && <span className="text-[10px] font-mono text-muted-foreground">Within: {r.withinPct[a].toFixed(1)}% | vs Ref: {r.vsRefPct[a].toFixed(1)}% | κ={r.kappaVals[a].toFixed(3)}</span>}
              </div>
              <div className="overflow-auto max-h-[420px]">
                <table className="text-xs w-full">
                  <thead className="sticky top-0 bg-muted/70">
                    <tr>
                      <th className="border px-1 py-1 text-center">#</th>
                      {Array.from({length:aaaTrials},(_,t)=><th key={t} className="border px-1 py-1 text-center">T{t+1}</th>)}
                      <th className="border px-1 py-1 text-center text-violet-700">Ref</th>
                      <th className="border px-1 py-1 text-center">✓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length:aaaParts},(_,p)=>{
                      const ref=aaaReference[p];
                      const decisions=Array.from({length:aaaTrials},(_,t)=>aaaData[a]?.[p]?.[t]??true);
                      const allSame=decisions.every(d=>d===decisions[0]);
                      const vsRef=decisions.every(d=>d===ref);
                      return (
                        <tr key={p} className={!allSame||!vsRef?"bg-red-50/50 dark:bg-red-950/20":""}>
                          <td className="border px-1 py-0.5 text-center text-muted-foreground">{p+1}</td>
                          {Array.from({length:aaaTrials},(_,t)=>(
                            <td key={t} className="border p-0.5 text-center">
                              <button type="button"
                                onClick={()=>{
                                  const next=aaaData.map(ap=>ap.map(pp=>[...pp]));
                                  next[a][p][t]=!next[a][p][t];
                                  setAaaData(next);
                                }}
                                className={`w-8 h-6 rounded text-[11px] font-bold border transition-colors ${decisions[t]?"bg-emerald-100 border-emerald-400 text-emerald-700 hover:bg-emerald-200":"bg-red-100 border-red-400 text-red-700 hover:bg-red-200"}`}
                                data-testid={`btn-aaa-${a}-${p}-${t}`}>
                                {decisions[t]?"A":"R"}
                              </button>
                            </td>
                          ))}
                          <td className="border p-0.5 text-center">
                            {a===0&&(
                              <button type="button"
                                onClick={()=>{const next=[...aaaReference];next[p]=!next[p];setAaaReference(next);}}
                                className={`w-8 h-6 rounded text-[11px] font-bold border transition-colors ${ref?"bg-violet-100 border-violet-400 text-violet-700 hover:bg-violet-200":"bg-slate-100 border-slate-400 text-slate-700 hover:bg-slate-200"}`}
                                data-testid={`btn-aaa-ref-${p}`}>
                                {ref?"A":"R"}
                              </button>
                            )}
                            {a!==0&&<span className={`text-[11px] font-bold ${ref?"text-violet-600":"text-slate-500"}`}>{ref?"A":"R"}</span>}
                          </td>
                          <td className={`border px-1 py-0.5 text-center text-sm ${allSame&&vsRef?"text-emerald-600":"text-red-500"}`}>{allSame&&vsRef?"✓":"✗"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-3 py-1.5 border-b text-xs font-bold uppercase tracking-wide">Kappa Analysis Summary</div>
            <div className="p-3 space-y-1.5">
              {r && [
                ...r.withinPct.map((pct,a)=>[`Within-Appraiser ${al(a)}`, pct.toFixed(1)+"%"] as [string,string]),
                ["Between-Appraisers (all agree)", r.betweenPct.toFixed(1)+"%"],
                ...r.vsRefPct.map((pct,a)=>[`vs Reference — Appraiser ${al(a)}`, pct.toFixed(1)+"%"] as [string,string]),
                ...r.kappaVals.map((k,a)=>[`Cohen's Kappa κ — Appraiser ${al(a)}`, k.toFixed(4)] as [string,string]),
                ["Overall Kappa κ̄", r.overallKappa.toFixed(4)],
                ["AIAG Criterion (κ≥0.75)", r.result.toUpperCase()],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between gap-2 text-xs border-b last:border-0 pb-1 last:pb-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={`font-mono font-semibold ${k.startsWith("Overall")&&r.result!=="acceptable"?resultColor:""}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {r && (
              <div className={`border rounded-lg p-3 ${resultBg}`}>
                <div className={`text-xs font-black uppercase tracking-wider mb-1 ${resultColor}`}>
                  {r.result === "acceptable" ? "✓ Acceptable — System Effective" : r.result === "marginal" ? "⚠ Marginal — Review Decision Rules" : "✗ Unacceptable — Improve System"}
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Overall κ̄ = {r.overallKappa.toFixed(4)}. {r.result==="acceptable"?"Appraisers demonstrate effective attribute discrimination (κ ≥ 0.75).":r.result==="marginal"?"Marginal agreement (0.50 ≤ κ &lt; 0.75). Acceptable with qualifications.":"Poor agreement (κ &lt; 0.50). System not suitable for production attribute inspection."}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea className="mt-1 text-xs" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Study conditions, corrective actions..." data-testid="textarea-aaa-notes" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-white text-xs h-8" data-testid="button-save-aaa">
                {isSaving ? "Saving…" : initial ? "Update Study" : "Save Study"}
              </Button>
              <Button variant="outline" onClick={handlePrint} className="text-xs h-8" data-testid="button-print-aaa">Print Study</Button>
              <Button variant="outline" onClick={()=>setPhase("config")} className="text-xs h-8">← Back</Button>
              <Button variant="outline" onClick={onCancel} className="text-xs h-8">Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── GRID PHASE — AIAG Variable Gage Study (Long Method) ──────────────────────
  // Parts as COLUMNS · Appraisers as ROW GROUPS · Single AVERAGE column
  // Matches AIAG MSA 4th Ed. standard data collection worksheet format
  // ══════════════════════════════════════════════════════════════════════════════
  const eq = equipment.find(e => e.id === equipmentId);
  const K1 = AIAG_K1[trialCount] ?? 3.05;
  const K2 = AIAG_K2[appraiserCount] ?? 2.70;
  const K3 = AIAG_K3[partCount] ?? 1.62;
  const D4 = AIAG_D4[trialCount] ?? 2.575;
  // Tol = (USL−LSL)/6  — displayed in the AIAG %Tolerance formulas
  const tolSixth = tolerance != null ? tolerance / 6 : null;
  // Grand mean of all part averages
  const grandMean = aiag ? aiag.partAvgs.reduce((s,v) => s+v, 0) / aiag.partAvgs.length : null;
  // Appraiser letter labels (A, B, C…)
  const appLabel = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="space-y-4">
      {/* ── AIAG Worksheet Study Header ───────────────────────────────────────── */}
      <div className="border rounded-lg overflow-hidden text-sm">
        <div className="grid grid-cols-3 divide-x divide-y border-b">
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Part Number:</span>
            <span className="font-medium">{meta.partNumber || "—"}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Gage Name:</span>
            <span className="font-medium">{meta.gaugeDesc || (eq ? eq.name : "—")}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Appraiser {appLabel(0)}:</span>
            <span className="font-medium">{meta.appraiserNames[0] || "—"}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Part Name:</span>
            <span className="font-medium">{meta.partName || "—"}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Gage Number:</span>
            <span className="font-medium">{eq ? eq.gageId : "—"}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Appraiser {appLabel(1)}:</span>
            <span className="font-medium">{meta.appraiserNames[1] || "—"}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Characteristic:</span>
            <span className="font-medium">{meta.characteristic || "—"}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Gage Type:</span>
            <span className="font-medium">{meta.gaugeDesc || "—"}</span>
          </div>
          {appraiserCount >= 3 && (
            <div className="px-4 py-2.5 flex gap-2">
              <span className="text-muted-foreground font-semibold shrink-0">Appraiser {appLabel(2)}:</span>
              <span className="font-medium">{meta.appraiserNames[2] || "—"}</span>
            </div>
          )}
          <div className="px-4 py-2.5 flex gap-2 col-span-1">
            <span className="text-muted-foreground font-semibold shrink-0">Specification:</span>
            <span className="font-medium">{meta.lsl || "—"} / {meta.usl || "—"}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Trials:</span>
            <span className="font-medium">{trialCount}</span>
            <span className="text-muted-foreground font-semibold shrink-0 ml-3">Parts:</span>
            <span className="font-medium">{partCount}</span>
            <span className="text-muted-foreground font-semibold shrink-0 ml-3">Appraisers:</span>
            <span className="font-medium">{appraiserCount}</span>
          </div>
          <div className="px-4 py-2.5 flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Date:</span>
            <span className="font-medium">{studyDate}</span>
            <span className="text-muted-foreground font-semibold shrink-0 ml-3">Performed By:</span>
            <span className="font-medium">{meta.performedBy || "—"}</span>
          </div>
        </div>
        {!hasReadings && (
          <div className="px-4 py-1.5 bg-muted/10">
            <button type="button" onClick={() => setPhase("config")}
              className="text-xs text-accent hover:underline">← Edit study setup</button>
          </div>
        )}
      </div>

      {/* ── AIAG Data Collection Sheet ─────────────────────────────────────────── */}
      {/* Columns: APPRAISER/TRIAL # | Part 1…n | AVERAGE                         */}
      {/* Rows per appraiser: group header · Trial 1…r · Average (X̄) · Range (R) */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="text-sm border-collapse" style={{minWidth: `${185 + partCount*68 + 115}px`}}>
          <thead>
            <tr className="bg-muted/70 text-sm">
              <th className="border px-3 py-2 text-left font-bold min-w-[185px] sticky left-0 bg-muted/70 z-20">
                APPRAISER / TRIAL #
              </th>
              {Array.from({length: partCount}, (_, j) => (
                <th key={j} className="border px-1 py-2 text-center font-bold min-w-[66px]">
                  {j + 1}
                </th>
              ))}
              <th className="border px-2 py-2 text-center font-bold min-w-[115px] bg-muted/70">
                AVERAGE
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length: appraiserCount}, (_, i) => {
              const appName = meta.appraiserNames[i] || `Appraiser ${appLabel(i)}`;
              const acColor = APPRAISER_COLORS[i] ?? APPRAISER_COLORS[0];
              const rows: React.ReactNode[] = [];

              // ── Appraiser group header ──
              rows.push(
                <tr key={`hdr-${i}`}>
                  <td colSpan={partCount + 2}
                    className={`border px-4 py-1.5 font-bold text-sm sticky left-0 z-10 ${acColor}`}>
                    {i + 1}. {appName}
                  </td>
                </tr>
              );

              // ── Trial input rows ──
              for (let k = 0; k < trialCount; k++) {
                const rowAvg = trialRowAvgs[i]?.[k];
                rows.push(
                  <tr key={`t-${i}-${k}`}>
                    <td className="border px-4 py-0 text-muted-foreground sticky left-0 bg-background z-10 text-sm h-9">
                      <span className="text-muted-foreground/50 mr-2">{i * (trialCount + 2) + k + 1}.</span>
                      Trial {k + 1}
                    </td>
                    {Array.from({length: partCount}, (_, j) => (
                      <td key={j} className="border p-0">
                        <input type="number" step="any"
                          className="w-[62px] h-9 text-center text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-accent/60 rounded font-mono"
                          value={gridData[i]?.[j]?.[k] ?? ""}
                          onChange={e => setCell(i, j, k, e.target.value)}
                          data-testid={`cell-a${i}-s${j}-t${k}`} />
                      </td>
                    ))}
                    <td className="border px-3 py-0 text-center font-mono text-sm text-muted-foreground/60 bg-muted/5 h-9">
                      {rowAvg != null ? rowAvg.toFixed(3) : ""}
                    </td>
                  </tr>
                );
              }

              // ── Average row (X̄ per part, x̄a= grand appraiser mean) ──
              const aveRowNum = i * (trialCount + 2) + trialCount + 1;
              rows.push(
                <tr key={`avg-${i}`} className="bg-muted/10">
                  <td className="border px-4 py-1 text-sm font-semibold sticky left-0 bg-muted/10 z-10 h-8">
                    <span className="text-muted-foreground/50 mr-2">{aveRowNum}.</span>
                    AVE
                  </td>
                  {Array.from({length: partCount}, (_, j) => (
                    <td key={j} className="border px-1 py-0 text-center font-mono text-sm h-8">
                      {cellStats[i]?.[j]?.mean != null ? cellStats[i][j].mean!.toFixed(3) : ""}
                    </td>
                  ))}
                  <td className="border px-3 py-0 text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-muted/10 h-8 whitespace-nowrap">
                    x̄{appLabel(i).toLowerCase()}= {aiag?.XbarA[i] != null ? aiag.XbarA[i].toFixed(4) : "—"}
                  </td>
                </tr>
              );

              // ── Range row (R per part, r̄a= appraiser avg range) ──
              const rngRowNum = aveRowNum + 1;
              rows.push(
                <tr key={`rng-${i}`} className="bg-muted/10">
                  <td className="border px-4 py-1 text-sm font-semibold sticky left-0 bg-muted/10 z-10 h-8">
                    <span className="text-muted-foreground/50 mr-2">{rngRowNum}.</span>
                    R
                  </td>
                  {Array.from({length: partCount}, (_, j) => {
                    const rng = cellStats[i]?.[j]?.range;
                    const overLimit = aiag?.UCLR != null && rng != null && rng > aiag.UCLR;
                    return (
                      <td key={j} className={`border px-1 py-0 text-center font-mono text-sm h-8 ${overLimit ? "bg-red-50 dark:bg-red-950/30 text-red-700 font-bold" : ""}`}>
                        {rng != null ? rng.toFixed(3) : ""}
                        {overLimit && <span className="text-red-500 ml-0.5">▲</span>}
                      </td>
                    );
                  })}
                  <td className="border px-3 py-0 text-sm font-bold text-sky-700 dark:text-sky-400 bg-muted/10 h-8 whitespace-nowrap">
                    r{appLabel(i).toLowerCase()}= {aiag?.RbarA[i] != null ? aiag.RbarA[i].toFixed(4) : "—"}
                  </td>
                </tr>
              );

              return rows;
            })}

            {/* ── Part Average row (grand mean per part across all appraisers) ── */}
            <tr className="bg-muted/30 border-t-2 border-foreground/20">
              <td className="border px-4 py-1.5 text-sm font-bold sticky left-0 bg-muted/30 z-10">
                PART AVERAGE
              </td>
              {Array.from({length: partCount}, (_, j) => (
                <td key={j} className="border px-1 py-1.5 text-center font-mono text-sm font-bold">
                  {aiag?.partAvgs[j] != null ? aiag.partAvgs[j].toFixed(3) : ""}
                </td>
              ))}
              <td className="border px-3 py-1.5 text-sm font-bold bg-muted/30 whitespace-nowrap">
                {grandMean != null && <>X̄= {grandMean.toFixed(4)}</>}
                {aiag && <span className="ml-2 text-muted-foreground">Rp= {aiag.Rp.toFixed(4)}</span>}
              </td>
            </tr>

            {/* ── Row 17: R̄ calculation ── */}
            <tr className="bg-muted/5 text-xs italic">
              <td colSpan={partCount + 1} className="border px-4 py-1.5 text-muted-foreground sticky left-0 bg-muted/5 z-10">
                ({Array.from({length: appraiserCount}, (_, i) => `r${appLabel(i).toLowerCase()}`).join(" + ")}) ÷ {appraiserCount} =
                {aiag && <span className="not-italic font-mono text-foreground ml-1 font-bold">
                  ({aiag.RbarA.map(r => r.toFixed(4)).join(" + ")}) ÷ {appraiserCount}
                </span>}
              </td>
              <td className="border px-3 py-1.5 text-sm font-bold font-mono not-italic text-sky-700 dark:text-sky-400 whitespace-nowrap bg-muted/10">
                R̄= {aiag?.Rbar.toFixed(4) ?? "—"}
              </td>
            </tr>

            {/* ── Row 18: xDIFF ── */}
            <tr className="bg-muted/5 text-xs italic">
              <td colSpan={partCount + 1} className="border px-4 py-1.5 text-muted-foreground sticky left-0 bg-muted/5 z-10">
                x̄DIFF = Max x̄ − Min x̄ =
                {aiag && <span className="not-italic font-mono text-foreground ml-1 font-bold">
                  {Math.max(...aiag.XbarA).toFixed(4)} − {Math.min(...aiag.XbarA).toFixed(4)}
                </span>}
              </td>
              <td className="border px-3 py-1.5 text-sm font-bold font-mono not-italic text-emerald-700 dark:text-emerald-400 whitespace-nowrap bg-muted/10">
                x̄DIFF= {aiag?.xdiff.toFixed(4) ?? "—"}
              </td>
            </tr>

            {/* ── Row 19: UCL_R ── */}
            <tr className="bg-muted/5 text-xs italic">
              <td colSpan={partCount + 1} className="border px-4 py-1.5 text-muted-foreground sticky left-0 bg-muted/5 z-10">
                * UCL<sub>R</sub> = R̄ × D₄ =
                {aiag && <span className="not-italic font-mono text-foreground ml-1 font-bold">
                  {aiag.Rbar.toFixed(4)} × {D4}
                </span>}
                <span className="ml-2 not-italic text-[10px]">(D₄ = 3.27 for 2 trials · 2.58 for 3 trials — circle ranges above limit)</span>
              </td>
              <td className="border px-3 py-1.5 text-sm font-bold font-mono not-italic text-amber-700 dark:text-amber-400 whitespace-nowrap bg-muted/10">
                UCL<sub>R</sub>= {aiag?.UCLR.toFixed(4) ?? "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Measurement Unit Analysis ──────────────────────────────────────────── */}
      {aiag ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Gage Repeatability &amp; Reproducibility — Measurement Unit Analysis (AIAG MSA 4th Ed.)
            </p>
          </div>
          <div className="grid grid-cols-5 gap-0 divide-x text-sm">

            {/* LEFT 3 columns: step-by-step formulas with values substituted */}
            <div className="col-span-3 p-5 space-y-4">

              {/* EV */}
              <div>
                <p className="font-bold text-sm text-muted-foreground mb-1">Repeatability — Equipment Variation (EV)</p>
                <div className="font-mono text-sm leading-6 pl-2">
                  <p>EV = R̄ × K₁</p>
                  <p className="text-muted-foreground pl-6">= {aiag.Rbar.toFixed(4)} × {K1}</p>
                  <p className="pl-6 font-bold">= {aiag.EV.toFixed(4)}</p>
                </div>
              </div>

              {/* AV */}
              <div>
                <p className="font-bold text-sm text-muted-foreground mb-1">Reproducibility — Appraiser Variation (AV)</p>
                <div className="font-mono text-sm leading-6 pl-2">
                  <p>AV = √[(x̄DIFF × K₂)² − (EV² ÷ n×r)]</p>
                  <p className="text-muted-foreground pl-6">= √[({aiag.xdiff.toFixed(4)} × {K2})² − ({aiag.EV.toFixed(4)}² ÷ {partCount}×{trialCount})]</p>
                  <p className="pl-6 font-bold">= {aiag.AV.toFixed(4)}</p>
                </div>
                <div className="mt-1 text-xs text-muted-foreground pl-2">
                  <span>Appraisers: {Object.entries(AIAG_K2).map(([a,k]) => `${a}→K₂=${k}`).join(" · ")}</span>
                </div>
              </div>

              {/* GRR */}
              <div>
                <p className="font-bold text-sm text-muted-foreground mb-1">Repeatability &amp; Reproducibility (GRR)</p>
                <div className="font-mono text-sm leading-6 pl-2">
                  <p>GRR = √(EV² + AV²)</p>
                  <p className="text-muted-foreground pl-6">= √({aiag.EV.toFixed(4)}² + {aiag.AV.toFixed(4)}²)</p>
                  <p className="pl-6 font-bold">= {aiag.GRR.toFixed(4)}</p>
                </div>
              </div>

              {/* PV */}
              <div>
                <p className="font-bold text-sm text-muted-foreground mb-1">Part Variation (PV)</p>
                <div className="font-mono text-sm leading-6 pl-2">
                  <p>PV = Rp × K₃</p>
                  <p className="text-muted-foreground pl-6">= {aiag.Rp.toFixed(4)} × {K3}</p>
                  <p className="pl-6 font-bold">= {aiag.PV.toFixed(4)}</p>
                </div>
              </div>

              {/* TV */}
              <div>
                <p className="font-bold text-sm text-muted-foreground mb-1">Total Variation (TV)</p>
                <div className="font-mono text-sm leading-6 pl-2">
                  <p>TV = √(GRR² + PV²)</p>
                  <p className="text-muted-foreground pl-6">= √({aiag.GRR.toFixed(4)}² + {aiag.PV.toFixed(4)}²)</p>
                  <p className="pl-6 font-bold">= {aiag.TV.toFixed(4)}</p>
                </div>
              </div>

              {/* Tolerance */}
              {tolSixth != null && (
                <div className="border-t pt-3">
                  <p className="font-bold text-sm text-muted-foreground mb-1">Tolerance (Tol)</p>
                  <div className="font-mono text-sm leading-6 pl-2">
                    <p>Tol = (USL − LSL) ÷ 6</p>
                    <p className="text-muted-foreground pl-6">= ({meta.usl} − {meta.lsl}) ÷ 6</p>
                    <p className="pl-6 font-bold">= {tolSixth.toFixed(4)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT 2 columns: K tables + %Tolerance + verdict */}
            <div className="col-span-2 p-5 space-y-4">

              {/* K constant reference tables */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <table className="border-collapse w-full">
                    <thead><tr className="bg-muted/30"><th className="border px-2 py-1 text-left">Trials</th><th className="border px-2 py-1 text-right font-bold">K₁</th></tr></thead>
                    <tbody>
                      {Object.entries(AIAG_K1).map(([t, k]) => (
                        <tr key={t} className={trialCount === +t ? "bg-accent/10 font-bold" : ""}>
                          <td className="border px-2 py-1">{t}</td>
                          <td className="border px-2 py-1 text-right font-mono">{k}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <table className="border-collapse w-full">
                    <thead><tr className="bg-muted/30"><th className="border px-2 py-1 text-left">App.</th><th className="border px-2 py-1 text-right font-bold">K₂</th></tr></thead>
                    <tbody>
                      {Object.entries(AIAG_K2).map(([a, k]) => (
                        <tr key={a} className={appraiserCount === +a ? "bg-accent/10 font-bold" : ""}>
                          <td className="border px-2 py-1">{a}</td>
                          <td className="border px-2 py-1 text-right font-mono">{k}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <table className="border-collapse w-full">
                    <thead><tr className="bg-muted/30"><th className="border px-2 py-1 text-left">Parts</th><th className="border px-2 py-1 text-right font-bold">K₃</th></tr></thead>
                    <tbody>
                      {Object.entries(AIAG_K3).map(([p, k]) => (
                        <tr key={p} className={partCount === +p ? "bg-accent/10 font-bold" : ""}>
                          <td className="border px-2 py-1">{p}</td>
                          <td className="border px-2 py-1 text-right font-mono">{k}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* %Tolerance column */}
              {tolSixth != null && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">% Tolerance (Tol = {tolSixth.toFixed(4)})</p>
                  <div className="font-mono text-sm leading-7 space-y-0.5">
                    {[
                      { label: "%EV",  val: aiag.EV },
                      { label: "%AV",  val: aiag.AV },
                      { label: "%GRR", val: aiag.GRR, bold: true },
                      { label: "%PV",  val: aiag.PV },
                    ].map(row => (
                      <div key={row.label} className={`flex gap-1 ${row.bold ? "font-bold" : ""}`}>
                        <span className="w-14">{row.label}</span>
                        <span className="text-muted-foreground">=</span>
                        <span>100({row.val.toFixed(4)}/{tolSixth.toFixed(4)})</span>
                        <span className={`ml-auto pl-2 ${row.bold ? grrColor : ""}`}>
                          = {(row.val / tolSixth * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NDC + verdict */}
              <div className="border-t pt-3 space-y-3">
                <div className="font-mono text-sm leading-6">
                  <p>ndc = 1.41 × (PV ÷ GRR)</p>
                  <p className="text-muted-foreground pl-6">= 1.41 × ({aiag.PV.toFixed(4)} ÷ {aiag.GRR.toFixed(4)})</p>
                  <p className="pl-6 font-bold text-foreground">= {aiag.ndc}</p>
                </div>
                <div className={`rounded-lg p-4 text-center space-y-2 ${
                  aiag.pctGRR < 10  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200"
                  : aiag.pctGRR <= 30 ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200"
                  : "bg-red-50 dark:bg-red-950/20 border border-red-200"
                }`}>
                  <p className={`text-2xl font-black tabular-nums ${grrColor}`}>%GRR = {aiag.pctGRR.toFixed(2)}%</p>
                  <p className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${
                    aiag.ndc >= 5 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>NDC = {aiag.ndc} {aiag.ndc >= 5 ? "✓" : "✗"}</p>
                  <p className={`text-sm font-black px-4 py-1.5 rounded-full text-white inline-block ${
                    aiag.pctGRR < 10 ? "bg-emerald-600" : aiag.pctGRR <= 30 ? "bg-amber-500" : "bg-red-600"
                  }`}>
                    {aiag.pctGRR < 10 ? "Gage System OK ✓" : aiag.pctGRR <= 30 ? "⚠ Marginal" : "✗ Unacceptable"}
                  </p>
                  <p className="text-xs text-muted-foreground">&lt;10% Acceptable · 10–30% Marginal · &gt;30% Unacceptable</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary variance components table */}
          <div className="border-t">
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-left px-4 py-2.5 font-bold">Source</th>
                  <th className="text-right px-4 py-2.5 font-bold">σ (Std Dev)</th>
                  <th className="text-right px-4 py-2.5 font-bold">6σ Study Var</th>
                  <th className="text-right px-4 py-2.5 font-bold">%Contribution</th>
                  <th className="text-right px-4 py-2.5 font-bold">%Study Var</th>
                  {tolSixth != null && <th className="text-right px-4 py-2.5 font-bold">%Tolerance</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  { label: "Repeatability (EV)",   s: aiag.EV,  pct: aiag.pctEV,  grr: false },
                  { label: "Reproducibility (AV)",  s: aiag.AV,  pct: aiag.pctAV,  grr: false },
                  { label: "Gage R&R (GRR)",         s: aiag.GRR, pct: aiag.pctGRR, grr: true  },
                  { label: "Part-to-Part (PV)",      s: aiag.PV,  pct: aiag.pctPV,  grr: false },
                  { label: "Total Variation (TV)",   s: aiag.TV,  pct: 100,          grr: false },
                ].map((row, idx) => (
                  <tr key={idx} className={idx === 4 ? "bg-muted/10 font-bold" : ""}>
                    <td className={`px-4 py-2 ${!row.grr && idx !== 4 ? "text-muted-foreground pl-8" : "font-bold"}`}>{row.label}</td>
                    <td className="px-4 py-2 text-right font-mono">{row.s.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-mono">{(row.s * 6).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{(row.pct ** 2 / 100).toFixed(1)}%</td>
                    <td className={`px-4 py-2 text-right font-bold ${row.grr ? grrColor : ""}`}>{row.pct.toFixed(1)}%</td>
                    {tolSixth != null && (
                      <td className={`px-4 py-2 text-right ${row.grr ? grrColor + " font-bold" : ""}`}>
                        {(row.s / tolSixth * 100).toFixed(1)}%
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 text-center text-muted-foreground bg-muted/10">
          <p className="text-sm italic">Complete all measurement cells above to see the AIAG variance components analysis</p>
        </div>
      )}

      {/* ── Notes & Save ── */}
      <div>
        <Label className="text-sm font-semibold">Notes / Corrective Action</Label>
        <Textarea className="mt-1" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Study conditions, gauge calibration status, corrective actions, reference documents..."
          data-testid="textarea-msa-notes" />
      </div>
      <div className="flex gap-2">
        <Button disabled={isSaving || !aiag} className="bg-accent hover:bg-accent/90 text-white"
          onClick={handleSave} data-testid="button-save-msa-study">
          {isSaving ? "Saving…" : initial ? "Update Study" : "Save Study"}
        </Button>
        {phase === "grid" && aiag && (
          <Button variant="outline" onClick={handlePrint} data-testid="button-print-msa-study">
            <Printer className="w-4 h-4 mr-1" /> Print Study
          </Button>
        )}
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
  const [filterCalType, setFilterCalType] = useState<string>("all");
  const [searchGage, setSearchGage] = useState<string>("");
  const [viewRecord, setViewRecord] = useState<CalibrationRecord | null>(null);
  const [viewRecordEquip, setViewRecordEquip] = useState<CalibrationEquipment | null>(null);
  const [labRegistryDialog, setLabRegistryDialog] = useState(false);
  const [editLabTarget, setEditLabTarget] = useState<CalibrationLab | null>(null);
  const [labScopeDialog, setLabScopeDialog] = useState(false);
  const [labScopeSection, setLabScopeSection] = useState<"header"|"personnel"|"environmental"|"csrs"|"capabilities">("header");
  const [labScopeDraft, setLabScopeDraft] = useState<Partial<LabScopeDoc>>({});
  const [msaDialog, setMsaDialog] = useState(false);
  const [editMsaStudy, setEditMsaStudy] = useState<MsaStudy | null>(null);
  const iatf = isIatf(project);
  const aerospace = isAerospace(project);
  const medical = isMedical(project);

  const { data: companyProfile } = useQuery<{ companyName?: string; logoUrl?: string | null }>({
    queryKey: ["/api/company-profile"],
  });

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

  const msaUrl = projectId ? `/api/calibration/msa-studies?isoProjectId=${projectId}` : "/api/calibration/msa-studies";
  const { data: msaStudies = [] } = useQuery<MsaStudy[]>({
    queryKey: ["/api/calibration/msa-studies", projectId],
    queryFn: () => fetch(msaUrl, { credentials: "include" }).then(r => r.json()),
  });

  const workInstructions = allDocs.filter(
    d => d.docType === "work_instruction" && d.status !== "obsolete",
  );

  const labScopeUrl = projectId ? `/api/calibration/lab-scope?isoProjectId=${projectId}` : "/api/calibration/lab-scope";
  const { data: labScope } = useQuery<LabScopeDoc | null>({
    queryKey: ["/api/calibration/lab-scope", projectId],
    queryFn: () => fetch(labScopeUrl, { credentials: "include" }).then(r => r.json()),
  });

  const labScopeMutation = useMutation({
    mutationFn: (data: Partial<LabScopeDoc> & { isoProjectId?: number | null }) =>
      apiRequest("PUT", "/api/calibration/lab-scope", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/lab-scope", projectId] });
      setLabScopeDialog(false);
      toast({ title: "Lab Scope saved", description: "IATF §7.1.5.3.1 Internal Laboratory Scope updated." });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

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

  const saveMsa = useMutation({
    mutationFn: async (d: Partial<MsaStudy>) =>
      editMsaStudy
        ? apiRequest("PATCH", `/api/calibration/msa-studies/${editMsaStudy.id}`, d)
        : apiRequest("POST", "/api/calibration/msa-studies", { ...d, isoProjectId: project?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/msa-studies", projectId] });
      setMsaDialog(false); setEditMsaStudy(null);
      toast({ title: editMsaStudy ? "MSA study updated" : "MSA study recorded" });
    },
    onError: () => toast({ title: "Error saving MSA study", variant: "destructive" }),
  });

  const deleteMsa = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/calibration/msa-studies/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calibration/msa-studies", projectId] });
      toast({ title: "MSA study deleted" });
    },
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
    const matchesCalType = filterCalType === "all" || (e.calType ?? "external") === filterCalType;
    const q = searchGage.toLowerCase();
    const matchesSearch = !q ||
      e.gageId.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.type ?? "").toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q) ||
      (e.manufacturer ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesCalType && matchesSearch;
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
            ...(iatf ? [{ key: "lab_scope", label: "Internal Lab Scope", icon: Microscope }] : []),
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
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-xs text-muted-foreground">Cal Type:</span>
                  {[
                    { key: "all", label: "All" },
                    { key: "internal", label: "Internal" },
                    { key: "external", label: "External" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setFilterCalType(key)}
                      data-testid={`filter-caltype-${key}`}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        filterCalType === key ? "bg-accent text-white border-accent" : "text-muted-foreground border-border hover:border-accent"}`}>
                      {label}
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
                  <div className="grid grid-cols-[140px_1fr_100px_100px_120px_120px_84px] gap-0 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <div className="px-3 py-2.5">Gage ID / S/N</div>
                    <div className="px-3 py-2.5">Name · Type · Responsible</div>
                    <div className="px-3 py-2.5">Status</div>
                    <div className="px-3 py-2.5">Cal Type</div>
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
                          className={`grid grid-cols-[140px_1fr_100px_100px_120px_120px_84px] gap-0 items-center cursor-pointer hover:bg-accent/5 transition-colors select-none ${isExpanded ? "bg-accent/5" : ""}`}
                          onClick={() => setExpandedEquip(isExpanded ? null : eq.id)}
                          data-testid={`row-equip-${eq.id}`}
                        >
                          {/* Gage ID + Serial Number */}
                          <div className="px-3 py-3">
                            <span className="font-mono text-sm font-bold bg-muted px-1.5 py-0.5 rounded">{eq.gageId}</span>
                            {eq.serialNumber && (
                              <div className="mt-1 text-xs text-muted-foreground font-mono">S/N: {eq.serialNumber}</div>
                            )}
                            {eq.customerOwned && (
                              <div className="mt-0.5">
                                <span className="text-xs text-blue-600 font-medium">Customer-Owned</span>
                              </div>
                            )}
                          </div>
                          {/* Name / Type / Responsible */}
                          <div className="px-3 py-3 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">{eq.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                              {eq.type && <span>{eq.type}</span>}
                              {eq.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 shrink-0" />{eq.location}</span>}
                            </div>
                            {eq.responsiblePerson && (
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                                <span className="truncate">{eq.responsiblePerson}</span>
                              </div>
                            )}
                          </div>
                          {/* Status */}
                          <div className="px-3 py-3">
                            <Badge className={`text-xs border ${STATUS_COLORS[eq.status ?? "active"]}`}>
                              {eq.status === "out_of_service" ? "Out of Svc" : eq.status === "retired" ? "Retired" : "Active"}
                            </Badge>
                          </div>
                          {/* Cal Type */}
                          <div className="px-3 py-3">
                            <Badge className={`text-xs border ${eq.calType === "internal" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-sky-50 text-sky-700 border-sky-200"}`}>
                              {eq.calType === "internal" ? "Internal" : "External"}
                            </Badge>
                          </div>
                          {/* Next Due */}
                          <div className="px-3 py-3">
                            {eq.nextDueDate ? (
                              <div>
                                <span className={`text-sm font-medium ${(() => {
                                  const days = Math.ceil((new Date(eq.nextDueDate).getTime() - Date.now()) / 86400000);
                                  return days < 0 ? "text-red-600 font-semibold" : days <= 30 ? "text-amber-600 font-semibold" : "text-foreground";
                                })()}`}>{eq.nextDueDate}</span>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {eq.calFrequencyMonths ?? 12}mo cycle
                                </div>
                              </div>
                            ) : <span className="text-sm text-muted-foreground">—</span>}
                          </div>
                          {/* Last Cal */}
                          <div className="px-3 py-3">
                            {lastRec ? (
                              <div>
                                <span className={`inline-block px-1.5 py-0.5 rounded border font-semibold text-xs ${RESULT_COLORS[lastRec.result ?? "pass"]}`}>
                                  {lastRec.result?.toUpperCase()}
                                </span>
                                <div className="text-xs text-muted-foreground mt-0.5">{lastRec.calibrationDate}</div>
                                {lastRec.outOfTolerance && <Badge className="text-xs bg-red-100 text-red-700 border-red-200 mt-0.5">OOT</Badge>}
                              </div>
                            ) : <span className="text-sm text-muted-foreground">No records</span>}
                          </div>
                          {/* Actions — stopPropagation so they don't toggle the row */}
                          <div className="px-3 py-3 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setLogForEquip(eq); setLogDialog(true); }}
                              data-testid={`button-log-cal-${eq.id}`}
                              title="Log Calibration" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent">
                              <Plus className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditEquip(eq); setEquipDialog(true); }}
                              data-testid={`button-edit-equip-${eq.id}`}
                              title="Edit Gage" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => { if (confirm(`Remove ${eq.name}?`)) deleteEquip.mutate(eq.id); }}
                              data-testid={`button-delete-equip-${eq.id}`}
                              title="Delete" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="p-1 text-muted-foreground">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </div>
                        </div>

                        {/* Expanded panel — specs + full calibration history */}
                        {isExpanded && (
                          <div className="border-t border-border bg-muted/10 text-xs border-b-2 border-b-accent/20 border-l-2 border-l-accent/30 ml-0">
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

          {/* ── MSA Tab ── */}
          {tab === "msa" && (
            <div className="mt-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
                  <BarChart3 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">IATF 16949 §7.1.5.2 — Measurement System Analysis (MSA)</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Record MSA studies for measurement systems referenced in the Control Plan. GRR% &lt;10% = Acceptable, 10–30% = Marginal, &gt;30% = Unacceptable. NDC ≥5 required.
                      Reference: AIAG MSA Reference Manual (4th Ed.).
                    </p>
                  </div>
                </div>
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white shrink-0"
                  onClick={() => { setEditMsaStudy(null); setMsaDialog(true); }}
                  data-testid="button-add-msa-study">
                  <Plus className="w-4 h-4 mr-1" /> Add Study
                </Button>
              </div>

              {/* Studies list */}
              {msaStudies.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No MSA studies recorded yet</p>
                  <p className="text-xs mt-1">Add a Gage R&R or other MSA study to track measurement system acceptability.</p>
                </div>
              )}

              {msaStudies.map(study => {
                const eq = equipment.find(e => e.id === study.equipmentId);
                const grr = study.grrPercent ? parseFloat(study.grrPercent) : null;
                const ndcNum = study.ndc ? parseInt(study.ndc, 10) : null;
                const grrColor = grr === null ? "bg-slate-100 text-slate-500 border-slate-300"
                  : grr < 10 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : grr <= 30 ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200";
                const resultLabel = study.result === "acceptable" ? "Acceptable"
                  : study.result === "marginal" ? "Marginal"
                  : study.result === "unacceptable" ? "Unacceptable"
                  : study.result ?? "—";
                const resultColor = study.result === "acceptable" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : study.result === "marginal" ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200";
                const studyTypeLabel: Record<string, string> = {
                  gage_rrr: "Gage R&R (GRR)", bias: "Bias Study", linearity: "Linearity Study",
                  stability: "Stability Study", attribute_agreement: "Attribute Agreement Analysis",
                };
                return (
                  <Card key={study.id} className="border border-border" data-testid={`card-msa-study-${study.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{studyTypeLabel[study.studyType] ?? study.studyType}</span>
                            <Badge className={`text-[10px] ${resultColor}`}>{resultLabel}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {eq ? <span className="font-medium text-foreground">{eq.gageId} — {eq.name}</span> : `Equipment ID: ${study.equipmentId}`}
                            {" · "}{study.studyDate}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs">
                            {grr !== null && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${grrColor}`}
                                data-testid={`text-grr-${study.id}`}>
                                %GRR: {grr.toFixed(1)}%
                              </span>
                            )}
                            {study.evPercent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] bg-sky-50 text-sky-700 border-sky-200"
                                data-testid={`text-ev-${study.id}`}>
                                EV: {parseFloat(study.evPercent).toFixed(1)}%
                              </span>
                            )}
                            {study.avPercent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] bg-violet-50 text-violet-700 border-violet-200"
                                data-testid={`text-av-${study.id}`}>
                                AV: {parseFloat(study.avPercent).toFixed(1)}%
                              </span>
                            )}
                            {ndcNum !== null && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${ndcNum >= 5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                                data-testid={`text-ndc-${study.id}`}>
                                NDC: {ndcNum}{ndcNum >= 5 ? " ✓" : " ✗ (<5)"}
                              </span>
                            )}
                            {study.appraiserCount != null && <span className="text-muted-foreground">Appraisers: {study.appraiserCount}</span>}
                            {study.partCount != null && <span className="text-muted-foreground">Parts: {study.partCount}</span>}
                            {study.trialCount != null && <span className="text-muted-foreground">Trials: {study.trialCount}</span>}
                            {study.readings && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">AIAG Data</span>}
                          </div>
                          {study.notes && <p className="text-xs text-muted-foreground italic">{study.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => { setEditMsaStudy(study); setMsaDialog(true); }}
                            data-testid={`button-edit-msa-${study.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                            onClick={() => { if (confirm("Delete this MSA study?")) deleteMsa.mutate(study.id); }}
                            data-testid={`button-delete-msa-${study.id}`}>
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

          {/* ── Internal Lab Scope Tab (IATF §7.1.5.3.1) ── */}
          {tab === "lab_scope" && (() => {
            const internalEquip = equipment.filter(e => e.calType === "internal" && e.status !== "out_of_service");

            function inferStandard(eq: CalibrationEquipment): string {
              const n = (eq.name ?? "").toLowerCase();
              const t = (eq.type ?? "").toLowerCase();
              if (n.includes("ph") || t.includes("ph")) return "ASTM D1293";
              if (n.includes("refract") || t.includes("refract")) return "ASTM E1967";
              if (n.includes("conductivity") || t.includes("conductivity")) return "ASTM D1125";
              if (n.includes("turbid") || t.includes("turbid")) return "ASTM D7679 / EPA 180.1";
              if (n.includes("caliper") || n.includes("dimensional") || t.includes("dimensional")) return "ASME B89.1.14";
              if (n.includes("thermometer") || n.includes("temperature") || t.includes("temperature")) return "ASTM E220";
              if (n.includes("viscosity") || n.includes("viscom") || t.includes("viscosity")) return "ASTM D2170 / D2171";
              if (n.includes("torque") || t.includes("torque")) return "ASME B107.300";
              if (n.includes("pressure") || t.includes("pressure")) return "ASME B40.100";
              if (n.includes("balance") || n.includes("scale") || t.includes("balance")) return "ASTM E617 / OIML R111";
              if (n.includes("hydrometer") || t.includes("hydrometer")) return "ASTM E100";
              if (n.includes("boiling") || n.includes("ebullio")) return "ASTM D1120";
              if (n.includes("flow") || t.includes("flow")) return "ASTM D1003";
              return "In-House Calibration Procedure";
            }

            function inferTraceability(eq: CalibrationEquipment): string {
              const n = (eq.name ?? "").toLowerCase();
              const t = (eq.type ?? "").toLowerCase();
              if (n.includes("ph") || t.includes("ph")) return "NIST SRM 185h / 186h Buffer Solutions";
              if (n.includes("refract") || t.includes("refract")) return "NIST SRM 1937 Sucrose Solution";
              if (n.includes("conductivity") || t.includes("conductivity")) return "NIST SRM 3190 KCl Standard";
              if (n.includes("turbid") || t.includes("turbid")) return "EPA 180.1 Formazin Primary Standard";
              if (n.includes("caliper") || t.includes("dimensional")) return "NIST-Traceable Gauge Block (Grade K)";
              if (n.includes("thermometer") || t.includes("temperature")) return "NIST SRM 934 / PT100 Reference Probe";
              if (n.includes("balance") || n.includes("scale") || t.includes("balance")) return "NIST Class F Calibration Weights";
              if (n.includes("viscosity") || t.includes("viscosity")) return "NIST SRM 2950a Viscosity Standard";
              if (n.includes("pressure") || t.includes("pressure")) return "NIST-Traceable Deadweight Tester";
              return "NIST-Traceable Reference Standard";
            }

            function inferCompetency(eq: CalibrationEquipment): string {
              const n = (eq.name ?? "").toLowerCase();
              if (n.includes("caliper") || n.includes("dimensional")) return "Internal Training + Dimensional Measurement";
              if (n.includes("viscosity") || n.includes("viscom")) return "Internal Training + ASTM D2170/D2171";
              if (n.includes("boiling") || n.includes("ebullio")) return "Internal Training + FMVSS 116 / ASTM D1120";
              return "Internal Training";
            }

            function inferRecord(eq: CalibrationEquipment): string {
              const n = (eq.name ?? "").toLowerCase();
              if (n.includes("ph")) return "pH Calibration Log";
              if (n.includes("conductivity")) return "Conductivity Calibration Log";
              if (n.includes("refract")) return "Refractometer Calibration Log";
              if (n.includes("turbid")) return "Turbidity Calibration Log";
              if (n.includes("caliper") || n.includes("dimensional")) return "Dimensional Calibration Log";
              if (n.includes("thermometer") || n.includes("temperature")) return "Temperature Calibration Log";
              if (n.includes("balance") || n.includes("scale")) return "Balance Calibration Log";
              if (n.includes("viscosity") || n.includes("viscom")) return "Viscosity Test Report";
              if (n.includes("boiling")) return "Boiling Point Test Report";
              if (n.includes("pressure")) return "Pressure Calibration Log";
              return "Calibration Log Record";
            }

            const autoCapabilities: LabCapability[] = internalEquip.map(eq => {
              const wi = eq.linkedDocumentId ? workInstructions.find(w => w.id === eq.linkedDocumentId) : null;
              return {
                id: `eq-${eq.id}`,
                parameter: eq.name,
                method: inferStandard(eq),
                equipment: `${eq.gageId} — ${[eq.manufacturer, eq.model].filter(Boolean).join(" ") || eq.name}`,
                range: eq.measurementRange ?? "See specification",
                tolerance: eq.tolerance ?? "Per certificate",
                traceability: inferTraceability(eq),
                workInstruction: wi ? wi.title : "Customer Specific Requirements / In-House Procedure",
                linkedDocumentId: eq.linkedDocumentId,
                competencyRequired: inferCompetency(eq),
                recordGenerated: inferRecord(eq),
              };
            });

            const additionalCaps = (labScope?.additionalCapabilities as LabCapability[] | null) ?? [];
            const allCapabilities = [...autoCapabilities, ...additionalCaps];
            const personnel = (labScope?.personnelRequirements as PersonnelRequirement[] | null) ?? [];
            const envReqs = (labScope?.environmentalRequirements as LabEnvironment | null);
            const csrs = (labScope?.customerRequirements as CustomerReq[] | null) ?? [];

            const openEdit = (section: typeof labScopeSection) => {
              setLabScopeDraft({
                labName: labScope?.labName ?? "",
                labDocumentNumber: labScope?.labDocumentNumber ?? "",
                labLocation: labScope?.labLocation ?? "",
                labManager: labScope?.labManager ?? "",
                qualitySystemStatement: labScope?.qualitySystemStatement ?? "",
                revision: labScope?.revision ?? "A",
                effectiveDate: labScope?.effectiveDate ?? "",
                nextReviewDate: labScope?.nextReviewDate ?? "",
                approvedBy: labScope?.approvedBy ?? "",
                personnelRequirements: (labScope?.personnelRequirements as PersonnelRequirement[] | null) ?? [],
                environmentalRequirements: (labScope?.environmentalRequirements as LabEnvironment | null) ?? { temperature: "", humidity: "", lighting: "", vibration: "", cleanliness: "", monitoring: "", additionalControls: "" },
                customerRequirements: (labScope?.customerRequirements as CustomerReq[] | null) ?? [],
                additionalCapabilities: (labScope?.additionalCapabilities as LabCapability[] | null) ?? [],
              });
              setLabScopeSection(section);
              setLabScopeDialog(true);
            };

            return (
              <div className="mt-4 space-y-5">
                {/* IATF Banner */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Microscope className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-800">IATF 16949 §7.1.5.3.1 — Internal Laboratory Scope</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Internal labs must document their scope of activity covering: (a) measurement capabilities, (b) technical procedures &amp; WI references,
                      (c) personnel competency requirements, (d) equipment &amp; reference standards, (e) environmental controls, and (f) customer-specific requirements.
                      This controlled document satisfies §7.1.5.3.1 requirements and must be reviewed at minimum annually.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => openEdit("header")} data-testid="button-edit-lab-scope">
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>

                {/* Document Header */}
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-xs">
                      {[
                        { label: "Laboratory Name", value: labScope?.labName || "Internal Quality Control Laboratory" },
                        { label: "Document No.", value: labScope?.labDocumentNumber || "LAB-SCOPE-001" },
                        { label: "Revision", value: labScope?.revision || "A" },
                        { label: "Effective Date", value: labScope?.effectiveDate || "—" },
                        { label: "Lab Manager", value: labScope?.labManager || "—" },
                        { label: "Approved By", value: labScope?.approvedBy || "—" },
                        { label: "Lab Location", value: labScope?.labLocation || "—" },
                        { label: "Next Review", value: labScope?.nextReviewDate || "—" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
                          <p className="font-medium mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    {labScope?.qualitySystemStatement && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Scope Statement</p>
                        <p className="text-xs">{labScope.qualitySystemStatement}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Helper to render a capability table (shared between both sub-sections) */}
                {(() => {
                  const renderCapTable = (caps: LabCapability[], startIndex: number, isCalibSection: boolean) => (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/60 border-b border-border">
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground w-6">#</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">{isCalibSection ? "Calibration Performed" : "Inspection / Test Performed"}</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Equipment Used</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Work Instruction / Internal Procedure</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Industry Standard / Method</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Competency Required</th>
                            <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Record to be Generated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caps.map((cap, i) => {
                            const linkedWi = cap.linkedDocumentId ? workInstructions.find(w => w.id === cap.linkedDocumentId) : null;
                            const wiLabel = linkedWi ? linkedWi.title : (cap.workInstruction || "Customer Specific Requirements / In-House Procedure");
                            const displayName = isCalibSection ? `Calibration of ${cap.parameter}` : cap.parameter;
                            return (
                              <tr key={cap.id} className={`border-b border-border/60 hover:bg-muted/20 transition-colors align-top ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                                <td className="px-3 py-2.5 text-muted-foreground">{startIndex + i}</td>
                                <td className="px-3 py-2.5 font-medium">
                                  <div>{displayName}</div>
                                  {cap.range && cap.range !== "See specification" && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Range: {cap.range} {cap.tolerance ? `± ${cap.tolerance}` : ""}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-muted-foreground">
                                  <div className="font-mono text-[10px] text-accent font-semibold">{cap.equipment.split("—")[0].trim()}</div>
                                  <div className="text-[10px] mt-0.5">{cap.equipment.includes("—") ? cap.equipment.split("—").slice(1).join("—").trim() : ""}</div>
                                </td>
                                <td className="px-3 py-2.5">
                                  {linkedWi ? (
                                    <div className="flex items-start gap-1">
                                      <BookOpen className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                                      <span className="text-blue-700 font-medium">{wiLabel}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground italic text-[10px]">{wiLabel}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 font-medium text-foreground">{cap.method}</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{cap.competencyRequired || "Internal Training"}</td>
                                <td className="px-3 py-2.5 text-muted-foreground">{cap.recordGenerated || (isCalibSection ? "Calibration Log" : "Test Report")}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );

                  return (
                    <>
                      {/* Section A — Calibrations */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FlaskConical className="w-4 h-4 text-accent" />
                          <p className="text-sm font-bold">§ (a) — Calibrations</p>
                        </div>
                        {autoCapabilities.length === 0 ? (
                          <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground">
                            <FlaskConical className="w-7 h-7 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No internal gages registered.</p>
                            <p className="text-xs mt-1">Add gages marked "Internal" in the Master Register to auto-populate this section.</p>
                          </div>
                        ) : renderCapTable(autoCapabilities, 1, true)}
                        <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                          Auto-populated from gages marked "Internal" in the Master Calibration Register.
                        </p>
                      </div>

                      {/* Section B — Inspection & Testing Performed */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Microscope className="w-4 h-4 text-accent" />
                            <p className="text-sm font-bold">§ (b) — Inspection &amp; Testing Performed</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-7"
                            onClick={() => openEdit("capabilities")} data-testid="button-edit-capabilities">
                            <Plus className="w-3 h-3 mr-1" /> Add Test Method
                          </Button>
                        </div>
                        {additionalCaps.length === 0 ? (
                          <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground">
                            <Microscope className="w-7 h-7 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No inspection or test methods defined.</p>
                            <p className="text-xs mt-1">Add your lab's inspection and test activities (viscosity, pH, boiling point, etc.) via Add Test Method.</p>
                          </div>
                        ) : renderCapTable(additionalCaps, autoCapabilities.length + 1, false)}
                        <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                          Manually defined inspection and testing activities performed by the laboratory.
                        </p>
                      </div>
                    </>
                  );
                })()}

                {/* References Section — pulled from both calibration gages and test methods */}
                {(() => {
                  const linkedWIs = allCapabilities
                    .filter(c => c.linkedDocumentId != null)
                    .map(c => workInstructions.find(w => w.id === c.linkedDocumentId))
                    .filter(Boolean) as WorkInstruction[];
                  const manualWIRefs = allCapabilities
                    .filter(c => !c.linkedDocumentId && c.workInstruction && !c.workInstruction.includes("Customer Specific") && !c.workInstruction.includes("In-House"))
                    .map(c => ({ id: 0, title: c.workInstruction!, docType: "work_instruction", status: "active" }));
                  const wiRefs = Array.from(new Map([...linkedWIs, ...manualWIRefs].map(w => [w.title, w])).values());
                  const calibStds = Array.from(new Set(autoCapabilities.map(c => c.method).filter(m => m && m !== "In-House Calibration Procedure")));
                  const testStds  = Array.from(new Set(additionalCaps.map(c => c.method).filter(Boolean)));
                  const allStds   = Array.from(new Set([...calibStds, ...testStds]));

                  if (wiRefs.length === 0 && allStds.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <p className="text-sm font-bold">References</p>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/60 border-b border-border">
                              <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-8">#</th>
                              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Reference Name</th>
                              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Type</th>
                              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Applicable Section</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wiRefs.map((wi, i) => (
                              <tr key={`wi-${i}`} className={`border-b border-border/60 ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <BookOpen className="w-3 h-3 text-blue-500 shrink-0" />
                                    <span className="font-medium text-blue-700">{wi.title}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">Work Instruction</td>
                                <td className="px-3 py-2 text-muted-foreground">§ (a) Calibrations</td>
                              </tr>
                            ))}
                            {allStds.map((std, i) => {
                              const inCalib = calibStds.includes(std);
                              const inTest  = testStds.includes(std);
                              const section = inCalib && inTest ? "§ (a) + § (b)" : inCalib ? "§ (a) Calibrations" : "§ (b) Inspection & Testing";
                              return (
                                <tr key={`std-${i}`} className={`border-b border-border/60 ${(wiRefs.length + i) % 2 !== 0 ? "bg-muted/10" : ""}`}>
                                  <td className="px-3 py-2 text-muted-foreground">{wiRefs.length + i + 1}</td>
                                  <td className="px-3 py-2 font-medium">{std}</td>
                                  <td className="px-3 py-2 text-muted-foreground">Industry Standard</td>
                                  <td className="px-3 py-2 text-muted-foreground">{section}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* Section C: Personnel Competency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <p className="text-sm font-bold">§ (c) — Personnel Competency Requirements</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-7"
                      onClick={() => openEdit("personnel")} data-testid="button-edit-personnel">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                  {personnel.length === 0 ? (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">No personnel requirements defined. Click Edit to specify required qualifications, training records, and competency verification methods per IATF §7.1.5.3.1(c).</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/60 border-b border-border">
                            {["Role", "Min. Education", "Required Training / WI References", "Certifications", "Competency Verification", "Supervision"].map(h => (
                              <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {personnel.map((p, i) => (
                            <tr key={p.id} className={`border-b border-border/60 ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                              <td className="px-3 py-2 font-medium whitespace-nowrap">{p.role}</td>
                              <td className="px-3 py-2">{p.minEducation}</td>
                              <td className="px-3 py-2 text-muted-foreground">{p.requiredTraining}</td>
                              <td className="px-3 py-2">{p.certifications || "—"}</td>
                              <td className="px-3 py-2">{p.competencyVerification}</td>
                              <td className="px-3 py-2">
                                {p.supervisionRequired
                                  ? <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">Required</Badge>
                                  : <Badge variant="outline" className="text-[10px] text-green-700 border-green-300">Independent</Badge>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section D: Equipment & Reference Standards */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-accent" />
                    <p className="text-sm font-bold">§ (d) — Laboratory Equipment &amp; Reference Standards</p>
                  </div>
                  {internalEquip.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs">
                      No internal laboratory equipment registered. Add internal gages in the Master Register.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/60 border-b border-border">
                            {["Gage ID", "Instrument", "Manufacturer / Model", "Serial No.", "Location", "Responsible Person", "Cal Due Date", "Status"].map(h => (
                              <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {internalEquip.map((eq, i) => {
                            const due = eq.nextDueDate ? new Date(eq.nextDueDate) : null;
                            const today = new Date();
                            const overdue = due && due < today;
                            const dueSoon = due && !overdue && (due.getTime() - today.getTime()) < 30 * 86400000;
                            return (
                              <tr key={eq.id} className={`border-b border-border/60 ${i % 2 !== 0 ? "bg-muted/10" : ""}`}>
                                <td className="px-3 py-2 font-mono font-bold text-accent">{eq.gageId}</td>
                                <td className="px-3 py-2 font-medium">{eq.name}</td>
                                <td className="px-3 py-2 text-muted-foreground">{[eq.manufacturer, eq.model].filter(Boolean).join(" / ") || "—"}</td>
                                <td className="px-3 py-2 font-mono">{eq.serialNumber ?? "—"}</td>
                                <td className="px-3 py-2">{eq.location ?? "—"}</td>
                                <td className="px-3 py-2">{eq.responsiblePerson ?? "—"}</td>
                                <td className={`px-3 py-2 font-medium whitespace-nowrap ${overdue ? "text-red-600" : dueSoon ? "text-amber-600" : ""}`}>
                                  {eq.nextDueDate ? new Date(eq.nextDueDate).toLocaleDateString() : "—"}
                                  {overdue && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded">OVERDUE</span>}
                                  {dueSoon && !overdue && <span className="ml-1 text-[9px] bg-amber-100 text-amber-600 px-1 rounded">DUE SOON</span>}
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className={`text-[10px] ${eq.status === "active" || !eq.status ? "text-green-700 border-green-300" : "text-red-700 border-red-300"}`}>
                                    {eq.status === "active" || !eq.status ? "Active" : eq.status}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                    All reference standards must have NIST-traceable calibration certificates on file per §7.1.5.3.1(d).
                  </p>
                </div>

                {/* Section E: Environmental Requirements */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-accent" />
                      <p className="text-sm font-bold">§ (e) — Laboratory Environmental Controls</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-7"
                      onClick={() => openEdit("environmental")} data-testid="button-edit-environmental">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                  {!envReqs || !envReqs.temperature ? (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Environmental requirements not documented. Click Edit to specify temperature, humidity, lighting, vibration controls, and monitoring methods required for valid measurements per §7.1.5.3.1(e).
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {([
                        { key: "temperature" as const, label: "Temperature", icon: Thermometer, color: "text-orange-500" },
                        { key: "humidity" as const, label: "Relative Humidity", icon: Activity, color: "text-blue-500" },
                        { key: "lighting" as const, label: "Lighting", icon: Info, color: "text-yellow-500" },
                        { key: "vibration" as const, label: "Vibration Control", icon: Activity, color: "text-purple-500" },
                        { key: "cleanliness" as const, label: "Cleanliness / PPE", icon: CheckCircle2, color: "text-green-500" },
                        { key: "monitoring" as const, label: "Monitoring Method", icon: ClipboardList, color: "text-accent" },
                        { key: "additionalControls" as const, label: "Additional Controls", icon: Shield, color: "text-gray-500" },
                      ]).map(({ key, label, icon: Icon, color }) => {
                        const val = envReqs[key];
                        if (!val) return null;
                        return (
                          <div key={key} className="flex items-start gap-2.5 bg-muted/30 rounded-lg p-3">
                            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
                              <p className="text-xs mt-0.5 font-medium">{val}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section F: Customer-Specific Requirements */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      <p className="text-sm font-bold">§ (f) — Customer-Specific Requirements (CSRs)</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-7"
                      onClick={() => openEdit("csrs")} data-testid="button-edit-csrs">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                  {csrs.length === 0 ? (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        No customer-specific requirements defined. Click Edit to add OEM requirements from GM, Ford, Stellantis, or other customers applicable to your internal laboratory per §7.1.5.3.1(f).
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {csrs.map((csr) => (
                        <div key={csr.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300 shrink-0 mt-0.5">{csr.customer}</Badge>
                            <div className="flex-1">
                              <p className="text-xs font-medium">{csr.requirement}</p>
                              {csr.reference && <p className="text-[10px] text-muted-foreground mt-0.5">Reference: {csr.reference}</p>}
                              {csr.applicableTo && <p className="text-[10px] text-muted-foreground">Applicable to: {csr.applicableTo}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground text-center pb-4 border-t border-border pt-3 mt-2">
                  IATF 16949:2016 §7.1.5.3.1 — Internal Laboratory Scope. Document controlled under QMS. Annual review required. Retain records per §7.5.
                </p>
              </div>
            );
          })()}

          {/* ── MSA Study Dialog ── */}
          <Dialog open={msaDialog} onOpenChange={o => { setMsaDialog(o); if (!o) setEditMsaStudy(null); }}>
            <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMsaStudy ? "Edit MSA Study" : "Record MSA Study"}</DialogTitle>
              </DialogHeader>
              <MsaStudyForm
                equipment={equipment}
                initial={editMsaStudy}
                isSaving={saveMsa.isPending}
                onSave={d => saveMsa.mutate(d)}
                onCancel={() => { setMsaDialog(false); setEditMsaStudy(null); }}
                companyLogo={companyProfile?.logoUrl}
                companyName={companyProfile?.companyName}
              />
            </DialogContent>
          </Dialog>

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
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            {lab.websiteUrl && (
                              <a href={lab.websiteUrl.startsWith("http") ? lab.websiteUrl : `https://${lab.websiteUrl}`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-accent/40 text-accent hover:bg-accent/10">
                                  <ExternalLink className="w-3 h-3" /> View Scope Online
                                </Button>
                              </a>
                            )}
                            {lab.iso17025CertUrl && (
                              <a href={`/api/calibration/labs/${lab.id}/iso17025`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                  <Download className="w-3 h-3" /> ISO 17025 Cert
                                </Button>
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => { setEditLabTarget(lab); setLabRegistryDialog(true); }}
                              data-testid={`button-edit-lab-${lab.id}`}>
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteLab.mutate(lab.id)}
                              data-testid={`button-delete-lab-${lab.id}`}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          {!lab.websiteUrl && !lab.iso17025CertUrl && (
                            <p className="text-xs text-muted-foreground italic text-right">No cert or scope link on file</p>
                          )}
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
            // Fall back to equipment's cal type when the record itself has no calType stored
            const resolvedCalType = (r.calType ?? eq.calType) ?? "external";
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
                      <Badge className={`text-xs ${resolvedCalType === "internal" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                        {resolvedCalType === "internal" ? "Internal Calibration" : "External Calibration"}
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

                {/* Linked Work Instruction (internal only, if configured on the equipment) */}
                {resolvedCalType === "internal" && eq.linkedDocumentId && (() => {
                  const wi = workInstructions.find(w => w.id === eq.linkedDocumentId);
                  return wi ? (
                    <div className="flex items-center gap-2.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5">
                      <FileCheck className="w-4 h-4 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">Calibration Work Instruction Used</p>
                        <p className="text-xs text-muted-foreground truncate">{wi.title}</p>
                      </div>
                      <a href="/iso-manager?module=documentation" target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-accent font-medium hover:underline shrink-0">
                        <ExternalLink className="w-3 h-3" /> Open WI
                      </a>
                    </div>
                  ) : null;
                })()}

                {/* Scope Coverage Evidence (external only) */}
                {resolvedCalType === "external" && r.labId && (
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
              workInstructions={workInstructions}
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
              workInstructions={workInstructions}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Lab Scope Edit Dialog (IATF §7.1.5.3.1) ── */}
      <Dialog open={labScopeDialog} onOpenChange={v => { setLabScopeDialog(v); }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-blue-600" />
              Edit Internal Laboratory Scope — IATF §7.1.5.3.1
            </DialogTitle>
          </DialogHeader>

          {/* Section tabs */}
          <div className="flex gap-1 flex-wrap border-b border-border mb-4 -mx-1 px-1">
            {([
              { key: "header" as const, label: "Document Header", icon: FileCheck },
              { key: "personnel" as const, label: "Personnel", icon: Users },
              { key: "environmental" as const, label: "Environmental", icon: Thermometer },
              { key: "csrs" as const, label: "CSRs", icon: Shield },
              { key: "capabilities" as const, label: "Add. Capabilities", icon: FlaskConical },
            ]).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setLabScopeSection(key)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors ${labScopeSection === key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Header Section */}
          {labScopeSection === "header" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Laboratory Name</Label>
                  <Input className="mt-1 h-8 text-sm" value={labScopeDraft.labName ?? ""} placeholder="e.g. CCI Chemical QC Laboratory"
                    onChange={e => setLabScopeDraft(d => ({ ...d, labName: e.target.value }))} data-testid="input-lab-name" />
                </div>
                <div>
                  <Label className="text-xs">Document Number</Label>
                  <Input className="mt-1 h-8 text-sm" value={labScopeDraft.labDocumentNumber ?? ""} placeholder="e.g. LAB-SCOPE-001"
                    onChange={e => setLabScopeDraft(d => ({ ...d, labDocumentNumber: e.target.value }))} data-testid="input-lab-doc-number" />
                </div>
                <div>
                  <Label className="text-xs">Revision</Label>
                  <Input className="mt-1 h-8 text-sm" value={labScopeDraft.revision ?? ""} placeholder="e.g. A"
                    onChange={e => setLabScopeDraft(d => ({ ...d, revision: e.target.value }))} data-testid="input-lab-revision" />
                </div>
                <div>
                  <Label className="text-xs">Lab Location</Label>
                  <Input className="mt-1 h-8 text-sm" value={labScopeDraft.labLocation ?? ""} placeholder="e.g. Building A, QC Lab Room 102"
                    onChange={e => setLabScopeDraft(d => ({ ...d, labLocation: e.target.value }))} data-testid="input-lab-location" />
                </div>
                <div>
                  <Label className="text-xs">Lab Manager</Label>
                  <Input className="mt-1 h-8 text-sm" value={labScopeDraft.labManager ?? ""} placeholder="e.g. Jane Smith"
                    onChange={e => setLabScopeDraft(d => ({ ...d, labManager: e.target.value }))} data-testid="input-lab-manager" />
                </div>
                <div>
                  <Label className="text-xs">Approved By</Label>
                  <Input className="mt-1 h-8 text-sm" value={labScopeDraft.approvedBy ?? ""} placeholder="e.g. John Doe, Quality Director"
                    onChange={e => setLabScopeDraft(d => ({ ...d, approvedBy: e.target.value }))} data-testid="input-lab-approved-by" />
                </div>
                <div>
                  <Label className="text-xs">Effective Date</Label>
                  <Input type="date" className="mt-1 h-8 text-sm" value={labScopeDraft.effectiveDate ?? ""}
                    onChange={e => setLabScopeDraft(d => ({ ...d, effectiveDate: e.target.value }))} data-testid="input-lab-effective-date" />
                </div>
                <div>
                  <Label className="text-xs">Next Review Date</Label>
                  <Input type="date" className="mt-1 h-8 text-sm" value={labScopeDraft.nextReviewDate ?? ""}
                    onChange={e => setLabScopeDraft(d => ({ ...d, nextReviewDate: e.target.value }))} data-testid="input-lab-review-date" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Scope Statement / Quality System Reference</Label>
                <Textarea className="mt-1 text-sm" rows={3} value={labScopeDraft.qualitySystemStatement ?? ""}
                  placeholder="This Internal Laboratory Scope defines the scope of calibration and testing activities performed by [Company] in accordance with IATF 16949:2016 §7.1.5.3.1 and the QMS Quality Manual..."
                  onChange={e => setLabScopeDraft(d => ({ ...d, qualitySystemStatement: e.target.value }))} data-testid="textarea-lab-scope-statement" />
              </div>
            </div>
          )}

          {/* Personnel Section */}
          {labScopeSection === "personnel" && (() => {
            const personnel = (labScopeDraft.personnelRequirements as PersonnelRequirement[] | null) ?? [];
            const addRow = () => setLabScopeDraft(d => ({
              ...d, personnelRequirements: [...personnel, { id: `pr-${Date.now()}`, role: "", minEducation: "", requiredTraining: "", certifications: "", competencyVerification: "", supervisionRequired: false }],
            }));
            const removeRow = (id: string) => setLabScopeDraft(d => ({ ...d, personnelRequirements: personnel.filter(p => p.id !== id) }));
            const updateRow = (id: string, field: keyof PersonnelRequirement, value: string | boolean) =>
              setLabScopeDraft(d => ({ ...d, personnelRequirements: personnel.map(p => p.id === id ? { ...p, [field]: value } : p) }));
            return (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Define required qualifications, training, and competency verification for each laboratory personnel role (§7.1.5.3.1 c).</p>
                {personnel.length === 0 && (
                  <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs">
                    No personnel requirements defined. Click "Add Role" to start.
                  </div>
                )}
                {personnel.map((p, i) => (
                  <div key={p.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">Role #{i + 1}</p>
                      <button onClick={() => removeRow(p.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Role / Title</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={p.role} placeholder="e.g. QC Technician"
                          onChange={e => updateRow(p.id, "role", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Min. Education</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={p.minEducation} placeholder="e.g. High School Diploma"
                          onChange={e => updateRow(p.id, "minEducation", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">Required Training / WI References</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={p.requiredTraining} placeholder="e.g. WI-CAL-003, WI-002, IATF awareness training"
                          onChange={e => updateRow(p.id, "requiredTraining", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Certifications (if any)</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={p.certifications} placeholder="e.g. ASQ CQT, or 'None required'"
                          onChange={e => updateRow(p.id, "certifications", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Competency Verification Method</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={p.competencyVerification} placeholder="e.g. Annual practical assessment"
                          onChange={e => updateRow(p.id, "competencyVerification", e.target.value)} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="checkbox" id={`sup-${p.id}`} checked={p.supervisionRequired}
                          onChange={e => updateRow(p.id, "supervisionRequired", e.target.checked)}
                          className="w-3.5 h-3.5 accent-orange-500" />
                        <Label htmlFor={`sup-${p.id}`} className="text-[10px] cursor-pointer">Supervision required</Label>
                      </div>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={addRow} data-testid="button-add-personnel-role">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Role
                </Button>
              </div>
            );
          })()}

          {/* Environmental Section */}
          {labScopeSection === "environmental" && (() => {
            const env = (labScopeDraft.environmentalRequirements as LabEnvironment | null) ?? { temperature: "", humidity: "", lighting: "", vibration: "", cleanliness: "", monitoring: "", additionalControls: "" };
            const setEnv = (field: keyof LabEnvironment, val: string) =>
              setLabScopeDraft(d => ({ ...d, environmentalRequirements: { ...env, [field]: val } }));
            return (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Specify environmental conditions required for valid measurements. All conditions must be monitored and recorded (§7.1.5.3.1 e).</p>
                {([
                  { key: "temperature" as const, label: "Temperature Range", placeholder: "e.g. 20°C ± 2°C (68°F ± 4°F)" },
                  { key: "humidity" as const, label: "Relative Humidity", placeholder: "e.g. 40–60% RH" },
                  { key: "lighting" as const, label: "Lighting Requirements", placeholder: "e.g. Minimum 500 lux at measurement workstation" },
                  { key: "vibration" as const, label: "Vibration Control", placeholder: "e.g. Vibration-isolated bench required for dimensional measurements" },
                  { key: "cleanliness" as const, label: "Cleanliness / PPE Requirements", placeholder: "e.g. Lab coat, gloves, and shoe covers required. No food or drink." },
                  { key: "monitoring" as const, label: "Environmental Monitoring Method", placeholder: "e.g. Temperature and humidity logged daily via CCI-ENV-MON-001 form" },
                  { key: "additionalControls" as const, label: "Additional Controls", placeholder: "e.g. Electrostatic discharge protection required; no magnetic materials near pH meters" },
                ]).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input className="mt-1 h-8 text-sm" value={env[key]} placeholder={placeholder}
                      onChange={e => setEnv(key, e.target.value)} data-testid={`input-env-${key}`} />
                  </div>
                ))}
              </div>
            );
          })()}

          {/* CSRs Section */}
          {labScopeSection === "csrs" && (() => {
            const csrs = (labScopeDraft.customerRequirements as CustomerReq[] | null) ?? [];
            const addCsr = () => setLabScopeDraft(d => ({
              ...d, customerRequirements: [...csrs, { id: `csr-${Date.now()}`, customer: "", requirement: "", reference: "", applicableTo: "" }],
            }));
            const removeCsr = (id: string) => setLabScopeDraft(d => ({ ...d, customerRequirements: csrs.filter(c => c.id !== id) }));
            const updateCsr = (id: string, field: keyof CustomerReq, value: string) =>
              setLabScopeDraft(d => ({ ...d, customerRequirements: csrs.map(c => c.id === id ? { ...c, [field]: value } : c) }));
            return (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Document OEM customer requirements applicable to your internal laboratory (§7.1.5.3.1 f). Common sources: GM Supplier Requirements, Ford Q1, Stellantis STDS, AIAG CSR supplements.</p>
                {csrs.length === 0 && (
                  <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs">
                    No CSRs defined. Click "Add CSR" to start.
                  </div>
                )}
                {csrs.map((csr, i) => (
                  <div key={csr.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">CSR #{i + 1}</p>
                      <button onClick={() => removeCsr(csr.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Customer / OEM</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={csr.customer} placeholder="e.g. General Motors"
                          onChange={e => updateCsr(csr.id, "customer", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Reference Document</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={csr.reference} placeholder="e.g. GM Supplier Requirements Manual Rev. 9"
                          onChange={e => updateCsr(csr.id, "reference", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">Requirement Description</Label>
                        <Textarea className="mt-0.5 text-xs" rows={2} value={csr.requirement}
                          placeholder="e.g. PPAP-level documentation is required for all new measurement systems referenced in the Control Plan."
                          onChange={e => updateCsr(csr.id, "requirement", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">Applicable To (Scope)</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={csr.applicableTo} placeholder="e.g. All measurement systems in PPAP scope for GM programs"
                          onChange={e => updateCsr(csr.id, "applicableTo", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={addCsr} data-testid="button-add-csr">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Customer Requirement
                </Button>
              </div>
            );
          })()}

          {/* Additional Capabilities Section */}
          {labScopeSection === "capabilities" && (() => {
            const caps = (labScopeDraft.additionalCapabilities as LabCapability[] | null) ?? [];
            const addCap = () => setLabScopeDraft(d => ({
              ...d, additionalCapabilities: [...caps, { id: `cap-${Date.now()}`, parameter: "", method: "", equipment: "", range: "", tolerance: "", traceability: "", workInstruction: "", competencyRequired: "Internal Training", recordGenerated: "" }],
            }));
            const removeCap = (id: string) => setLabScopeDraft(d => ({ ...d, additionalCapabilities: caps.filter(c => c.id !== id) }));
            const updateCap = (id: string, field: keyof LabCapability, value: string) =>
              setLabScopeDraft(d => ({ ...d, additionalCapabilities: caps.map(c => c.id === id ? { ...c, [field]: value } : c) }));
            return (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Add supplemental test capabilities not represented by calibrated gages in the Master Register (e.g. viscosity testing, boiling point, visual inspection). Auto-populated capabilities from internal gages are shown read-only in the lab scope view.</p>
                {caps.length === 0 && (
                  <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-xs">
                    No additional capabilities defined. Internal gage capabilities are auto-populated. Use this to add test methods without dedicated calibration gages.
                  </div>
                )}
                {caps.map((cap, i) => (
                  <div key={cap.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">Capability #{i + 1}</p>
                      <button onClick={() => removeCap(cap.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Measurement Parameter</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.parameter} placeholder="e.g. Kinematic Viscosity"
                          onChange={e => updateCap(cap.id, "parameter", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Technical Standard / Method</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.method} placeholder="e.g. ASTM D2170 / D2171"
                          onChange={e => updateCap(cap.id, "method", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">Equipment / Instrument Used</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.equipment} placeholder="e.g. Cannon-Fenske Viscometer — Model CF-200"
                          onChange={e => updateCap(cap.id, "equipment", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Measurement Range</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.range} placeholder="e.g. 0.4–16,000 mm²/s"
                          onChange={e => updateCap(cap.id, "range", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Tolerance / Accuracy</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.tolerance} placeholder="e.g. ±0.35%"
                          onChange={e => updateCap(cap.id, "tolerance", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">NIST Traceability Reference</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.traceability} placeholder="e.g. NIST SRM 2950a Viscosity Standard"
                          onChange={e => updateCap(cap.id, "traceability", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">Work Instruction / Internal Procedure</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.workInstruction ?? ""} placeholder="e.g. WI-LAB-002 Viscosity Testing Procedure"
                          onChange={e => updateCap(cap.id, "workInstruction", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Competency Required</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.competencyRequired ?? ""} placeholder="e.g. Internal Training"
                          onChange={e => updateCap(cap.id, "competencyRequired", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[10px]">Record to be Generated</Label>
                        <Input className="mt-0.5 h-7 text-xs" value={cap.recordGenerated ?? ""} placeholder="e.g. Viscosity Test Report"
                          onChange={e => updateCap(cap.id, "recordGenerated", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={addCap} data-testid="button-add-capability">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Capability
                </Button>
              </div>
            );
          })()}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
            <Button variant="outline" size="sm" onClick={() => setLabScopeDialog(false)} data-testid="button-cancel-lab-scope">Cancel</Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white"
              disabled={labScopeMutation.isPending}
              onClick={() => labScopeMutation.mutate({ ...labScopeDraft, isoProjectId: projectId })}
              data-testid="button-save-lab-scope">
              <Save className="w-3.5 h-3.5 mr-1" />
              {labScopeMutation.isPending ? "Saving..." : "Save Lab Scope"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
