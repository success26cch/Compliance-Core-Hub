import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import type { NcmrRecord } from "@shared/schema";
import {
  Package, Plus, Search, AlertTriangle, CheckCircle2,
  XCircle, Archive, Wrench, Shield, Trash2,
  MapPin, User, ClipboardList, BarChart2,
  Car, FlaskConical, Plane, Clock, RefreshCw, ChevronRight,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; tw: string }> = {
  open:                 { label: "Open",                 tw: "text-blue-700 bg-blue-50 border-blue-200" },
  quarantine:           { label: "Quarantine",           tw: "text-amber-700 bg-amber-50 border-amber-200" },
  under_review:         { label: "Under Review",         tw: "text-purple-700 bg-purple-50 border-purple-200" },
  disposition_pending:  { label: "Disposition Pending",  tw: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  rework_in_progress:   { label: "Rework In Progress",   tw: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  verification_pending: { label: "Verification Pending", tw: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  closed:               { label: "Closed",               tw: "text-gray-600 bg-gray-50 border-gray-200" },
  released:             { label: "Released",             tw: "text-green-700 bg-green-50 border-green-200" },
};

const SEV_META: Record<string, { label: string; tw: string }> = {
  critical: { label: "Critical", tw: "text-red-700 bg-red-50 border-red-200" },
  major:    { label: "Major",    tw: "text-orange-700 bg-orange-50 border-orange-200" },
  minor:    { label: "Minor",    tw: "text-yellow-700 bg-yellow-50 border-yellow-200" },
};

const SOURCE_LABELS: Record<string, string> = {
  incoming_inspection: "Incoming Inspection",
  production:          "Production / In-Process",
  customer_return:     "Customer Return",
  internal_audit:      "Internal Audit Finding",
  field_return:        "Field Return",
  supplier_ship_back:  "Supplier Ship Back",
  receiving:           "Receiving",
};

const NC_TYPES = ["dimensional","functional","visual","documentation","labeling","contamination","material","other"];

const DISPOSITION_OPTS = [
  { value: "scrap",              label: "Scrap" },
  { value: "rework",             label: "Rework" },
  { value: "use_as_is",          label: "Use As-Is (Concession)" },
  { value: "return_to_supplier", label: "Return to Supplier" },
  { value: "concession",         label: "Deviation / Concession Request" },
];

const VERIFY_RESULTS = [
  { value: "pass",             label: "Pass" },
  { value: "conditional_pass", label: "Conditional Pass" },
  { value: "fail",             label: "Fail" },
];

function today() { return new Date().toISOString().split("T")[0]; }

// ── Small helpers ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, tw: "text-gray-600 bg-gray-50 border-gray-200" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${m.tw}`}>{m.label}</span>;
}
function SevBadge({ sev }: { sev: string }) {
  const m = SEV_META[sev] ?? { label: sev, tw: "text-gray-600 bg-gray-50" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${m.tw}`}>{m.label}</span>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

// ── Log NCMR dialog ────────────────────────────────────────────────────────────
function LogNCMRDialog({ open, onClose, onSave, isSaving }: {
  open: boolean; onClose: () => void;
  onSave: (d: any) => void; isSaving: boolean;
}) {
  const [f, setF] = useState({
    title: "", description: "", partNumber: "", partName: "",
    lotNumber: "", serialNumber: "", quantity: "", unit: "",
    drawingRevision: "", sourceType: "incoming_inspection", supplierName: "",
    customerName: "", identifiedBy: "", identifiedDate: today(),
    department: "", workOrder: "", purchaseOrder: "",
    severity: "minor", ncType: "none", isoClause: "", immediateContainment: "",
    quarantineRequired: false, quarantineLocation: "",
  });
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
  const supplySource = ["incoming_inspection","receiving","supplier_ship_back"].includes(f.sourceType);
  const custSource   = ["customer_return","field_return"].includes(f.sourceType);

  function submit() {
    if (!f.title.trim()) return;
    const payload: any = { ...f };
    if (payload.ncType === "none") payload.ncType = null;
    if (!payload.supplierName) delete payload.supplierName;
    if (!payload.customerName) delete payload.customerName;
    const status = payload.quarantineRequired ? "quarantine" : "open";
    onSave({ ...payload, status });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Package className="w-5 h-5 text-amber-600" /> Log Nonconforming Product / Material
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {/* Identification */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Material Identification</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Title / Summary *">
                  <Input data-testid="input-ncmr-title" value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Dimensional out-of-spec — Bracket Assy Rev C" />
                </Field>
              </div>
              <Field label="Part Number">
                <Input data-testid="input-ncmr-partno" value={f.partNumber} onChange={e => set("partNumber", e.target.value)} placeholder="P/N" />
              </Field>
              <Field label="Part Name">
                <Input data-testid="input-ncmr-partname" value={f.partName} onChange={e => set("partName", e.target.value)} />
              </Field>
              <Field label="Lot Number">
                <Input value={f.lotNumber} onChange={e => set("lotNumber", e.target.value)} />
              </Field>
              <Field label="Serial Number">
                <Input value={f.serialNumber} onChange={e => set("serialNumber", e.target.value)} />
              </Field>
              <Field label="Quantity Affected">
                <Input value={f.quantity} onChange={e => set("quantity", e.target.value)} placeholder="e.g. 48" />
              </Field>
              <Field label="Unit">
                <Input value={f.unit} onChange={e => set("unit", e.target.value)} placeholder="pcs / kg / m …" />
              </Field>
              <Field label="Drawing Revision">
                <Input value={f.drawingRevision} onChange={e => set("drawingRevision", e.target.value)} placeholder="Rev C" />
              </Field>
            </div>
          </div>
          <Separator />
          {/* Source */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Source & Detection</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Detection Source *">
                <Select value={f.sourceType} onValueChange={v => set("sourceType", v)}>
                  <SelectTrigger data-testid="select-ncmr-source"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              {supplySource && (
                <Field label="Supplier Name">
                  <Input value={f.supplierName} onChange={e => set("supplierName", e.target.value)} />
                </Field>
              )}
              {custSource && (
                <Field label="Customer Name">
                  <Input value={f.customerName} onChange={e => set("customerName", e.target.value)} />
                </Field>
              )}
              <Field label="Identified By">
                <Input value={f.identifiedBy} onChange={e => set("identifiedBy", e.target.value)} placeholder="Name or initials" />
              </Field>
              <Field label="Date Identified *">
                <Input type="date" value={f.identifiedDate} onChange={e => set("identifiedDate", e.target.value)} />
              </Field>
              <Field label="Department">
                <Input value={f.department} onChange={e => set("department", e.target.value)} />
              </Field>
              <Field label="Work Order / Job #">
                <Input value={f.workOrder} onChange={e => set("workOrder", e.target.value)} />
              </Field>
              <Field label="Purchase Order #">
                <Input value={f.purchaseOrder} onChange={e => set("purchaseOrder", e.target.value)} />
              </Field>
            </div>
          </div>
          <Separator />
          {/* Classification */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Classification</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Severity *">
                <Select value={f.severity} onValueChange={v => set("severity", v)}>
                  <SelectTrigger data-testid="select-ncmr-severity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="NC Type">
                <Select value={f.ncType} onValueChange={v => set("ncType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select —</SelectItem>
                    {NC_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ISO Clause">
                <Input value={f.isoClause} onChange={e => set("isoClause", e.target.value)} placeholder="e.g. 8.7" />
              </Field>
            </div>
          </div>
          <Separator />
          {/* Description & Containment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nonconformance Description">
              <Textarea value={f.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Describe the nonconformity in detail…" />
            </Field>
            <Field label="Immediate Containment Actions">
              <Textarea value={f.immediateContainment} onChange={e => set("immediateContainment", e.target.value)} rows={3} placeholder="Actions taken to prevent further escape…" />
            </Field>
          </div>
          <Separator />
          {/* Quarantine */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Checkbox
              id="qreq"
              checked={f.quarantineRequired}
              onCheckedChange={v => set("quarantineRequired", !!v)}
              className="mt-0.5"
              data-testid="checkbox-quarantine-required"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="qreq" className="text-sm font-semibold text-amber-800 cursor-pointer">
                Quarantine Material — place on hold immediately
              </Label>
              {f.quarantineRequired && (
                <Input
                  value={f.quarantineLocation}
                  onChange={e => set("quarantineLocation", e.target.value)}
                  placeholder="Quarantine location (e.g. Red Tag Area — Shelf B3)"
                  className="bg-white"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} data-testid="button-ncmr-cancel">Cancel</Button>
            <Button
              onClick={submit}
              disabled={!f.title.trim() || isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              data-testid="button-ncmr-submit"
            >
              {isSaving ? "Saving…" : "Open NCMR"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Detail dialog ─────────────────────────────────────────────────────────────
function NCMRDetailDialog({ record, onClose, onSave, isSaving, showAutomotive, showMedDevice, showAerospace }: {
  record: NcmrRecord; onClose: () => void;
  onSave: (data: any, trail?: { action: string; by?: string; notes?: string }) => void;
  isSaving: boolean; showAutomotive: boolean; showMedDevice: boolean; showAerospace: boolean;
}) {
  const [tab, setTab] = useState("overview");

  // Local form helpers — each tab holds its own local copy; saved on button click
  const [ov, setOv] = useState({
    title: record.title ?? "",
    description: record.description ?? "",
    partNumber: record.partNumber ?? "",
    partName: record.partName ?? "",
    lotNumber: record.lotNumber ?? "",
    serialNumber: record.serialNumber ?? "",
    quantity: record.quantity ?? "",
    unit: record.unit ?? "",
    drawingRevision: record.drawingRevision ?? "",
    sourceType: record.sourceType ?? "incoming_inspection",
    supplierName: record.supplierName ?? "",
    customerName: record.customerName ?? "",
    identifiedBy: record.identifiedBy ?? "",
    identifiedDate: record.identifiedDate ?? "",
    department: record.department ?? "",
    workOrder: record.workOrder ?? "",
    purchaseOrder: record.purchaseOrder ?? "",
    severity: record.severity ?? "minor",
    ncType: record.ncType ?? "none",
    isoClause: record.isoClause ?? "",
    immediateContainment: record.immediateContainment ?? "",
  });
  const [qt, setQt] = useState({
    quarantineRequired: record.quarantineRequired ?? false,
    quarantineLocation: record.quarantineLocation ?? "",
    quarantineTagNumber: record.quarantineTagNumber ?? "",
    quarantineDate: record.quarantineDate ?? "",
    quarantineBy: record.quarantineBy ?? "",
    quarantineNotes: record.quarantineNotes ?? "",
  });
  const [dp, setDp] = useState({
    dispositionDecision: record.dispositionDecision ?? "none",
    dispositionNotes: record.dispositionNotes ?? "",
    dispositionApprovedBy: record.dispositionApprovedBy ?? "",
    dispositionApprovalDate: record.dispositionApprovalDate ?? "",
    dispositionReviewedBy: record.dispositionReviewedBy ?? "",
    concessionRequestNumber: record.concessionRequestNumber ?? "",
    concessionExpiryDate: record.concessionExpiryDate ?? "",
    returnToSupplierDate: record.returnToSupplierDate ?? "",
    returnTrackingNumber: record.returnTrackingNumber ?? "",
    scrapMethod: record.scrapMethod ?? "",
    scrapDate: record.scrapDate ?? "",
    scrapWitnessedBy: record.scrapWitnessedBy ?? "",
  });
  const [rw, setRw] = useState({
    reworkInstructions: record.reworkInstructions ?? "",
    reworkAssignedTo: record.reworkAssignedTo ?? "",
    reworkDueDate: record.reworkDueDate ?? "",
    reworkStartDate: record.reworkStartDate ?? "",
    reworkCompletedDate: record.reworkCompletedDate ?? "",
    reworkCost: record.reworkCost ?? "",
    verificationRequired: record.verificationRequired ?? false,
    verificationActivity: record.verificationActivity ?? "",
    verificationBy: record.verificationBy ?? "",
    verificationDate: record.verificationDate ?? "",
    verificationResult: record.verificationResult ?? "none",
    verificationNotes: record.verificationNotes ?? "",
    reinspectionRequired: record.reinspectionRequired ?? false,
  });
  const [ca, setCa] = useState({
    capaRequired: record.capaRequired ?? false,
    capaLinkedNcNumber: record.capaLinkedNcNumber ?? "",
    capaDecisionBy: record.capaDecisionBy ?? "",
    capaDecisionDate: record.capaDecisionDate ?? "",
    capaDecisionNotes: record.capaDecisionNotes ?? "",
  });
  const [cl, setCl] = useState({
    closedBy: record.closedBy ?? "",
    closedDate: record.closedDate ?? "",
    closureNotes: record.closureNotes ?? "",
  });

  const ss = (record.standardSpecific ?? {}) as any;
  const [auto, setAuto] = useState({
    d0Actions: ss.automotive?.d0Actions ?? "",
    customerNotified: ss.automotive?.customerNotified ?? false,
    customerNotificationDate: ss.automotive?.customerNotificationDate ?? "",
    customerRef: ss.automotive?.customerRef ?? "",
    ppapImpact: ss.automotive?.ppapImpact ?? false,
    ppapImpactNotes: ss.automotive?.ppapImpactNotes ?? "",
    controlPlanUpdateRequired: ss.automotive?.controlPlanUpdateRequired ?? false,
    pfmeaUpdateRequired: ss.automotive?.pfmeaUpdateRequired ?? false,
    warrantyClaim: ss.automotive?.warrantyClaim ?? false,
    warrantyClaimNumber: ss.automotive?.warrantyClaimNumber ?? "",
  });
  const [med, setMed] = useState({
    patientSafetyRisk: ss.medDevice?.patientSafetyRisk ?? false,
    patientSafetyNotes: ss.medDevice?.patientSafetyNotes ?? "",
    complaintLinked: ss.medDevice?.complaintLinked ?? false,
    complaintNumber: ss.medDevice?.complaintNumber ?? "",
    mdrRequired: ss.medDevice?.mdrRequired ?? false,
    mdrFiled: ss.medDevice?.mdrFiled ?? false,
    mdrDate: ss.medDevice?.mdrDate ?? "",
    deviceRecall: ss.medDevice?.deviceRecall ?? false,
    regulatoryBodyNotified: ss.medDevice?.regulatoryBodyNotified ?? false,
  });
  const [aero, setAero] = useState({
    customerNotified: ss.aerospace?.customerNotified ?? false,
    customerNotificationDate: ss.aerospace?.customerNotificationDate ?? "",
    escapeSuspect: ss.aerospace?.escapeSuspect ?? false,
    counterfeitPartSuspect: ss.aerospace?.counterfeitPartSuspect ?? false,
    primeContractorNotified: ss.aerospace?.primeContractorNotified ?? false,
    governmentPropertyAffected: ss.aerospace?.governmentPropertyAffected ?? false,
    certificationAffected: ss.aerospace?.certificationAffected ?? false,
    productAuditRequired: ss.aerospace?.productAuditRequired ?? false,
  });

  function setStatus(status: string, action: string, notes?: string) {
    onSave({ status }, { action, by: "User", notes });
  }

  const isClosed = record.status === "closed" || record.status === "released";

  // Quick action bar
  function QuickActions() {
    const s = record.status;
    return (
      <div className="flex flex-wrap gap-2 p-3 bg-muted/40 border-b border-border/50 text-sm">
        <span className="text-xs text-muted-foreground font-semibold my-auto mr-1">Actions:</span>
        {s === "open" && <>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => setStatus("quarantine", "Material Quarantined")} data-testid="button-quarantine">
            🔒 Send to Quarantine
          </Button>
          <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50"
            onClick={() => setStatus("under_review", "Sent to MRB Review")}>
            MRB Review
          </Button>
        </>}
        {s === "quarantine" && <>
          <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50"
            onClick={() => setStatus("under_review", "Released from Quarantine — sent to MRB")} data-testid="button-release-quarantine">
            Release → MRB Review
          </Button>
        </>}
        {s === "under_review" && (
          <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            onClick={() => setStatus("disposition_pending", "Awaiting Disposition Decision")}>
            Request Disposition
          </Button>
        )}
        {s === "disposition_pending" && dp.dispositionDecision === "rework" && (
          <Button size="sm" variant="outline" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
            onClick={() => setStatus("rework_in_progress", "Rework Started")}>
            Start Rework
          </Button>
        )}
        {s === "rework_in_progress" && (
          <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            onClick={() => setStatus("verification_pending", "Rework Complete — Awaiting Verification")}>
            Rework Complete → Verify
          </Button>
        )}
        {s === "verification_pending" && <>
          <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50"
            onClick={() => setStatus("released", "Verification Passed — Material Released")} data-testid="button-verify-pass">
            ✓ Verify Pass → Release
          </Button>
          <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => setStatus("under_review", "Verification Failed — Returned to MRB")} data-testid="button-verify-fail">
            ✗ Verify Fail → MRB
          </Button>
        </>}
        {!isClosed && (
          <Button size="sm" variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50 ml-auto"
            onClick={() => setStatus("closed", "NCMR Closed")} data-testid="button-close-ncmr">
            Close NCMR
          </Button>
        )}
        {s === "closed" && (
          <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50"
            onClick={() => setStatus("released", "Material Released")}>
            Release Material
          </Button>
        )}
      </div>
    );
  }

  const F = Field;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                {record.ncmrNumber ?? "NCMR"} — {record.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={record.status} />
                <SevBadge sev={record.severity} />
                {record.partNumber && <span className="text-xs text-muted-foreground">P/N: {record.partNumber}</span>}
                {record.identifiedDate && <span className="text-xs text-muted-foreground">· {record.identifiedDate}</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <QuickActions />

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">
            <TabsList className="shrink-0 mx-4 mt-2 bg-muted/50 flex-wrap h-auto gap-0.5">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="quarantine" data-testid="tab-quarantine">Quarantine</TabsTrigger>
              <TabsTrigger value="disposition" data-testid="tab-disposition">Disposition</TabsTrigger>
              <TabsTrigger value="rework" data-testid="tab-rework">Rework & Verify</TabsTrigger>
              <TabsTrigger value="capa" data-testid="tab-capa">CAPA</TabsTrigger>
              {(showAutomotive || showMedDevice || showAerospace) && (
                <TabsTrigger value="overlays" data-testid="tab-overlays">Std. Overlays</TabsTrigger>
              )}
              <TabsTrigger value="closure" data-testid="tab-closure">Closure</TabsTrigger>
              <TabsTrigger value="trail" data-testid="tab-trail">Audit Trail</TabsTrigger>
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <F label="Title">
                    <Input value={ov.title} onChange={e => setOv(p => ({ ...p, title: e.target.value }))} />
                  </F>
                </div>
                <F label="Part Number"><Input value={ov.partNumber} onChange={e => setOv(p => ({ ...p, partNumber: e.target.value }))} /></F>
                <F label="Part Name"><Input value={ov.partName} onChange={e => setOv(p => ({ ...p, partName: e.target.value }))} /></F>
                <F label="Lot Number"><Input value={ov.lotNumber} onChange={e => setOv(p => ({ ...p, lotNumber: e.target.value }))} /></F>
                <F label="Serial Number"><Input value={ov.serialNumber} onChange={e => setOv(p => ({ ...p, serialNumber: e.target.value }))} /></F>
                <F label="Quantity">
                  <div className="flex gap-2">
                    <Input value={ov.quantity} onChange={e => setOv(p => ({ ...p, quantity: e.target.value }))} className="flex-1" />
                    <Input value={ov.unit} onChange={e => setOv(p => ({ ...p, unit: e.target.value }))} placeholder="unit" className="w-24" />
                  </div>
                </F>
                <F label="Drawing Rev"><Input value={ov.drawingRevision} onChange={e => setOv(p => ({ ...p, drawingRevision: e.target.value }))} /></F>
                <F label="Detection Source">
                  <Select value={ov.sourceType} onValueChange={v => setOv(p => ({ ...p, sourceType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Supplier Name"><Input value={ov.supplierName} onChange={e => setOv(p => ({ ...p, supplierName: e.target.value }))} /></F>
                <F label="Customer Name"><Input value={ov.customerName} onChange={e => setOv(p => ({ ...p, customerName: e.target.value }))} /></F>
                <F label="Identified By"><Input value={ov.identifiedBy} onChange={e => setOv(p => ({ ...p, identifiedBy: e.target.value }))} /></F>
                <F label="Date Identified"><Input type="date" value={ov.identifiedDate} onChange={e => setOv(p => ({ ...p, identifiedDate: e.target.value }))} /></F>
                <F label="Department"><Input value={ov.department} onChange={e => setOv(p => ({ ...p, department: e.target.value }))} /></F>
                <F label="Work Order"><Input value={ov.workOrder} onChange={e => setOv(p => ({ ...p, workOrder: e.target.value }))} /></F>
                <F label="Purchase Order"><Input value={ov.purchaseOrder} onChange={e => setOv(p => ({ ...p, purchaseOrder: e.target.value }))} /></F>
                <F label="Severity">
                  <Select value={ov.severity} onValueChange={v => setOv(p => ({ ...p, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="NC Type">
                  <Select value={ov.ncType} onValueChange={v => setOv(p => ({ ...p, ncType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {NC_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="ISO Clause"><Input value={ov.isoClause} onChange={e => setOv(p => ({ ...p, isoClause: e.target.value }))} placeholder="e.g. 8.7.1" /></F>
              </div>
              <F label="Nonconformance Description">
                <Textarea value={ov.description} onChange={e => setOv(p => ({ ...p, description: e.target.value }))} rows={3} />
              </F>
              <F label="Immediate Containment Actions">
                <Textarea value={ov.immediateContainment} onChange={e => setOv(p => ({ ...p, immediateContainment: e.target.value }))} rows={3} />
              </F>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => {
                  const d = { ...ov };
                  if (d.ncType === "none") d.ncType = null as any;
                  onSave(d, { action: "Overview Updated", by: "User" });
                }} disabled={isSaving} data-testid="button-save-overview">
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </TabsContent>

            {/* ── Quarantine ── */}
            <TabsContent value="quarantine" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Checkbox
                  id="qr-req"
                  checked={qt.quarantineRequired}
                  onCheckedChange={v => setQt(p => ({ ...p, quarantineRequired: !!v }))}
                />
                <Label htmlFor="qr-req" className="font-semibold text-amber-800 cursor-pointer">Material under quarantine / hold</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Quarantine Location">
                  <Input value={qt.quarantineLocation} onChange={e => setQt(p => ({ ...p, quarantineLocation: e.target.value }))} placeholder="e.g. Red Tag Area — Shelf B3" />
                </F>
                <F label="Hold Tag Number">
                  <Input value={qt.quarantineTagNumber} onChange={e => setQt(p => ({ ...p, quarantineTagNumber: e.target.value }))} placeholder="TAG-0001" />
                </F>
                <F label="Date Quarantined">
                  <Input type="date" value={qt.quarantineDate} onChange={e => setQt(p => ({ ...p, quarantineDate: e.target.value }))} />
                </F>
                <F label="Quarantined By">
                  <Input value={qt.quarantineBy} onChange={e => setQt(p => ({ ...p, quarantineBy: e.target.value }))} />
                </F>
                <div className="sm:col-span-2">
                  <F label="Quarantine Notes">
                    <Textarea value={qt.quarantineNotes} onChange={e => setQt(p => ({ ...p, quarantineNotes: e.target.value }))} rows={2} />
                  </F>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => onSave(qt, { action: "Quarantine Record Updated", by: "User" })} disabled={isSaving} data-testid="button-save-quarantine">
                  {isSaving ? "Saving…" : "Save Quarantine Info"}
                </Button>
              </div>
            </TabsContent>

            {/* ── Disposition ── */}
            <TabsContent value="disposition" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">MRB Disposition Decision</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISPOSITION_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      data-testid={`button-disp-${opt.value}`}
                      onClick={() => setDp(p => ({ ...p, dispositionDecision: opt.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors text-left
                        ${dp.dispositionDecision === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"}`}
                    >
                      <ChevronRight className="w-4 h-4 shrink-0" /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <F label="Disposition Notes / Justification">
                    <Textarea value={dp.dispositionNotes} onChange={e => setDp(p => ({ ...p, dispositionNotes: e.target.value }))} rows={2} />
                  </F>
                </div>
                <F label="Approved By"><Input value={dp.dispositionApprovedBy} onChange={e => setDp(p => ({ ...p, dispositionApprovedBy: e.target.value }))} /></F>
                <F label="Approval Date"><Input type="date" value={dp.dispositionApprovalDate} onChange={e => setDp(p => ({ ...p, dispositionApprovalDate: e.target.value }))} /></F>
                <F label="Second Reviewer"><Input value={dp.dispositionReviewedBy} onChange={e => setDp(p => ({ ...p, dispositionReviewedBy: e.target.value }))} /></F>
              </div>
              {dp.dispositionDecision === "scrap" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Scrap Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <F label="Scrap Method"><Input value={dp.scrapMethod} onChange={e => setDp(p => ({ ...p, scrapMethod: e.target.value }))} placeholder="e.g. Destruction, Landfill" /></F>
                    <F label="Scrap Date"><Input type="date" value={dp.scrapDate} onChange={e => setDp(p => ({ ...p, scrapDate: e.target.value }))} /></F>
                    <F label="Witnessed By"><Input value={dp.scrapWitnessedBy} onChange={e => setDp(p => ({ ...p, scrapWitnessedBy: e.target.value }))} /></F>
                  </div>
                </div>
              )}
              {dp.dispositionDecision === "return_to_supplier" && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Return to Supplier</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <F label="RTS Date"><Input type="date" value={dp.returnToSupplierDate} onChange={e => setDp(p => ({ ...p, returnToSupplierDate: e.target.value }))} /></F>
                    <F label="Tracking Number"><Input value={dp.returnTrackingNumber} onChange={e => setDp(p => ({ ...p, returnTrackingNumber: e.target.value }))} /></F>
                  </div>
                </div>
              )}
              {(dp.dispositionDecision === "use_as_is" || dp.dispositionDecision === "concession") && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Concession / Deviation Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <F label="Concession Request #"><Input value={dp.concessionRequestNumber} onChange={e => setDp(p => ({ ...p, concessionRequestNumber: e.target.value }))} /></F>
                    <F label="Expiry Date"><Input type="date" value={dp.concessionExpiryDate} onChange={e => setDp(p => ({ ...p, concessionExpiryDate: e.target.value }))} /></F>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button size="sm" onClick={() => {
                  const d = { ...dp };
                  if (d.dispositionDecision === "none") d.dispositionDecision = null as any;
                  onSave(d, { action: `Disposition Set: ${DISPOSITION_OPTS.find(o => o.value === dp.dispositionDecision)?.label ?? dp.dispositionDecision}`, by: dp.dispositionApprovedBy || "User" });
                }} disabled={isSaving} data-testid="button-save-disposition">
                  {isSaving ? "Saving…" : "Save Disposition"}
                </Button>
              </div>
            </TabsContent>

            {/* ── Rework & Verify ── */}
            <TabsContent value="rework" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Rework Instructions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <F label="Rework Instructions / Work Order Details">
                      <Textarea value={rw.reworkInstructions} onChange={e => setRw(p => ({ ...p, reworkInstructions: e.target.value }))} rows={3} />
                    </F>
                  </div>
                  <F label="Assigned To"><Input value={rw.reworkAssignedTo} onChange={e => setRw(p => ({ ...p, reworkAssignedTo: e.target.value }))} /></F>
                  <F label="Due Date"><Input type="date" value={rw.reworkDueDate} onChange={e => setRw(p => ({ ...p, reworkDueDate: e.target.value }))} /></F>
                  <F label="Start Date"><Input type="date" value={rw.reworkStartDate} onChange={e => setRw(p => ({ ...p, reworkStartDate: e.target.value }))} /></F>
                  <F label="Completion Date"><Input type="date" value={rw.reworkCompletedDate} onChange={e => setRw(p => ({ ...p, reworkCompletedDate: e.target.value }))} /></F>
                  <F label="Rework Cost (USD)"><Input value={rw.reworkCost} onChange={e => setRw(p => ({ ...p, reworkCost: e.target.value }))} placeholder="0.00" /></F>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Verification / Re-Inspection</p>
                <div className="flex items-center gap-3 mb-3">
                  <Checkbox id="vreq" checked={rw.verificationRequired} onCheckedChange={v => setRw(p => ({ ...p, verificationRequired: !!v }))} />
                  <Label htmlFor="vreq" className="cursor-pointer font-medium">Verification Required</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <F label="Verification Activity / Method">
                      <Textarea value={rw.verificationActivity} onChange={e => setRw(p => ({ ...p, verificationActivity: e.target.value }))} rows={2} />
                    </F>
                  </div>
                  <F label="Verified By"><Input value={rw.verificationBy} onChange={e => setRw(p => ({ ...p, verificationBy: e.target.value }))} /></F>
                  <F label="Verification Date"><Input type="date" value={rw.verificationDate} onChange={e => setRw(p => ({ ...p, verificationDate: e.target.value }))} /></F>
                  <F label="Verification Result">
                    <Select value={rw.verificationResult} onValueChange={v => setRw(p => ({ ...p, verificationResult: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Pending —</SelectItem>
                        {VERIFY_RESULTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </F>
                  <div className="sm:col-span-2">
                    <F label="Verification Notes">
                      <Textarea value={rw.verificationNotes} onChange={e => setRw(p => ({ ...p, verificationNotes: e.target.value }))} rows={2} />
                    </F>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox id="ri-req" checked={rw.reinspectionRequired} onCheckedChange={v => setRw(p => ({ ...p, reinspectionRequired: !!v }))} />
                    <Label htmlFor="ri-req" className="cursor-pointer font-medium">Reinspection Required</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => {
                  const d = { ...rw };
                  if (d.verificationResult === "none") d.verificationResult = null as any;
                  onSave(d, { action: "Rework & Verification Updated", by: rw.reworkAssignedTo || "User" });
                }} disabled={isSaving} data-testid="button-save-rework">
                  {isSaving ? "Saving…" : "Save Rework & Verify"}
                </Button>
              </div>
            </TabsContent>

            {/* ── CAPA ── */}
            <TabsContent value="capa" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Checkbox id="capa-req" checked={ca.capaRequired} onCheckedChange={v => setCa(p => ({ ...p, capaRequired: !!v }))} />
                <Label htmlFor="capa-req" className="cursor-pointer font-semibold text-blue-800">CAPA Required — root cause investigation needed</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Linked CAPA / NC Number">
                  <Input value={ca.capaLinkedNcNumber} onChange={e => setCa(p => ({ ...p, capaLinkedNcNumber: e.target.value }))} placeholder="NC-2026-0042" />
                </F>
                <F label="Decision By"><Input value={ca.capaDecisionBy} onChange={e => setCa(p => ({ ...p, capaDecisionBy: e.target.value }))} /></F>
                <F label="Decision Date"><Input type="date" value={ca.capaDecisionDate} onChange={e => setCa(p => ({ ...p, capaDecisionDate: e.target.value }))} /></F>
                <div className="sm:col-span-2">
                  <F label="CAPA Decision Notes">
                    <Textarea value={ca.capaDecisionNotes} onChange={e => setCa(p => ({ ...p, capaDecisionNotes: e.target.value }))} rows={3} placeholder="Document the rationale for requiring or waiving CAPA…" />
                  </F>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => onSave(ca, { action: `CAPA Decision: ${ca.capaRequired ? "Required" : "Not Required"}`, by: ca.capaDecisionBy || "User" })} disabled={isSaving} data-testid="button-save-capa">
                  {isSaving ? "Saving…" : "Save CAPA Decision"}
                </Button>
              </div>
            </TabsContent>

            {/* ── Standard Overlays ── */}
            {(showAutomotive || showMedDevice || showAerospace) && (
              <TabsContent value="overlays" className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Automotive */}
                {showAutomotive && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                      <Car className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-bold text-blue-700">Automotive / IATF 16949</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <F label="D0 — Emergency Response Actions">
                          <Textarea value={auto.d0Actions} onChange={e => setAuto(p => ({ ...p, d0Actions: e.target.value }))} rows={2} />
                        </F>
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox id="cust-notif" checked={auto.customerNotified} onCheckedChange={v => setAuto(p => ({ ...p, customerNotified: !!v }))} />
                        <Label htmlFor="cust-notif" className="cursor-pointer">Customer Notified</Label>
                      </div>
                      {auto.customerNotified && (
                        <F label="Notification Date"><Input type="date" value={auto.customerNotificationDate} onChange={e => setAuto(p => ({ ...p, customerNotificationDate: e.target.value }))} /></F>
                      )}
                      <F label="Customer Reference #"><Input value={auto.customerRef} onChange={e => setAuto(p => ({ ...p, customerRef: e.target.value }))} /></F>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "ppap", key: "ppapImpact", label: "PPAP Impact" },
                          { id: "cp", key: "controlPlanUpdateRequired", label: "Control Plan Update Required" },
                          { id: "pfmea", key: "pfmeaUpdateRequired", label: "PFMEA Update Required" },
                          { id: "wc", key: "warrantyClaim", label: "Warranty Claim" },
                        ].map(({ id, key, label }) => (
                          <div key={id} className="flex items-center gap-2">
                            <Checkbox id={id} checked={(auto as any)[key]} onCheckedChange={v => setAuto(p => ({ ...p, [key]: !!v }))} />
                            <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                      {auto.ppapImpact && (
                        <F label="PPAP Impact Notes"><Input value={auto.ppapImpactNotes} onChange={e => setAuto(p => ({ ...p, ppapImpactNotes: e.target.value }))} /></F>
                      )}
                      {auto.warrantyClaim && (
                        <F label="Warranty Claim #"><Input value={auto.warrantyClaimNumber} onChange={e => setAuto(p => ({ ...p, warrantyClaimNumber: e.target.value }))} /></F>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => onSave({ standardSpecific: { ...ss, automotive: auto } }, { action: "Automotive Overlay Updated" })} disabled={isSaving}>
                        Save Automotive
                      </Button>
                    </div>
                  </div>
                )}
                {/* Medical Device */}
                {showMedDevice && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                      <FlaskConical className="w-4 h-4 text-teal-600" />
                      <p className="text-sm font-bold text-teal-700">Medical Device / ISO 13485</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox id="psr" checked={med.patientSafetyRisk} onCheckedChange={v => setMed(p => ({ ...p, patientSafetyRisk: !!v }))} />
                        <Label htmlFor="psr" className="cursor-pointer text-sm font-semibold text-red-700">Patient Safety Risk Identified</Label>
                      </div>
                      {med.patientSafetyRisk && (
                        <div className="sm:col-span-2">
                          <F label="Patient Safety Risk Notes">
                            <Textarea value={med.patientSafetyNotes} onChange={e => setMed(p => ({ ...p, patientSafetyNotes: e.target.value }))} rows={2} />
                          </F>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "cl", key: "complaintLinked", label: "Customer Complaint Linked" },
                          { id: "mdr", key: "mdrRequired", label: "MDR / Adverse Event Report Required" },
                          { id: "mdrf", key: "mdrFiled", label: "MDR Filed" },
                          { id: "recall", key: "deviceRecall", label: "Device Recall Initiated" },
                          { id: "rbn", key: "regulatoryBodyNotified", label: "Regulatory Body Notified" },
                        ].map(({ id, key, label }) => (
                          <div key={id} className="flex items-center gap-2">
                            <Checkbox id={id} checked={(med as any)[key]} onCheckedChange={v => setMed(p => ({ ...p, [key]: !!v }))} />
                            <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <F label="Complaint Number"><Input value={med.complaintNumber} onChange={e => setMed(p => ({ ...p, complaintNumber: e.target.value }))} /></F>
                        <F label="MDR Date"><Input type="date" value={med.mdrDate} onChange={e => setMed(p => ({ ...p, mdrDate: e.target.value }))} /></F>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => onSave({ standardSpecific: { ...ss, medDevice: med } }, { action: "ISO 13485 Overlay Updated" })} disabled={isSaving}>
                        Save ISO 13485
                      </Button>
                    </div>
                  </div>
                )}
                {/* Aerospace */}
                {showAerospace && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                      <Plane className="w-4 h-4 text-sky-600" />
                      <p className="text-sm font-bold text-sky-700">Aerospace / AS9100D</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "acn", key: "customerNotified", label: "Customer Notified" },
                          { id: "escape", key: "escapeSuspect", label: "Escape to Next Operation Suspect" },
                          { id: "cfp", key: "counterfeitPartSuspect", label: "Counterfeit / Suspect Unapproved Part" },
                          { id: "pcn", key: "primeContractorNotified", label: "Prime Contractor Notified" },
                          { id: "gpa", key: "governmentPropertyAffected", label: "Government Property Affected" },
                          { id: "cert", key: "certificationAffected", label: "Certification / Approval Affected" },
                          { id: "par", key: "productAuditRequired", label: "Product Audit Required" },
                        ].map(({ id, key, label }) => (
                          <div key={id} className="flex items-center gap-2">
                            <Checkbox id={id} checked={(aero as any)[key]} onCheckedChange={v => setAero(p => ({ ...p, [key]: !!v }))} />
                            <Label htmlFor={id} className="cursor-pointer text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                      {aero.customerNotified && (
                        <F label="Customer Notification Date">
                          <Input type="date" value={aero.customerNotificationDate} onChange={e => setAero(p => ({ ...p, customerNotificationDate: e.target.value }))} />
                        </F>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => onSave({ standardSpecific: { ...ss, aerospace: aero } }, { action: "AS9100D Overlay Updated" })} disabled={isSaving}>
                        Save AS9100D
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {/* ── Closure ── */}
            <TabsContent value="closure" className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-sm text-muted-foreground">Record closure details. Use the "Close NCMR" quick action above to formally close and lock the record.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Closed By"><Input value={cl.closedBy} onChange={e => setCl(p => ({ ...p, closedBy: e.target.value }))} /></F>
                <F label="Closure Date"><Input type="date" value={cl.closedDate} onChange={e => setCl(p => ({ ...p, closedDate: e.target.value }))} /></F>
                <div className="sm:col-span-2">
                  <F label="Closure Notes / Lessons Learned">
                    <Textarea value={cl.closureNotes} onChange={e => setCl(p => ({ ...p, closureNotes: e.target.value }))} rows={4} placeholder="Summarize resolution, lessons learned, and preventive measures taken…" />
                  </F>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => onSave(cl, { action: "Closure Details Updated", by: cl.closedBy || "User" })} disabled={isSaving} data-testid="button-save-closure">
                  {isSaving ? "Saving…" : "Save Closure Details"}
                </Button>
              </div>
            </TabsContent>

            {/* ── Audit Trail ── */}
            <TabsContent value="trail" className="flex-1 overflow-y-auto px-5 py-4">
              {(!record.auditTrail || record.auditTrail.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">No audit trail entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...record.auditTrail].reverse().map((e, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/40">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{e.action}</span>
                          {e.by && <span className="text-xs text-muted-foreground">by {e.by}</span>}
                        </div>
                        {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{new Date(e.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────────
interface NCMRModuleProps {
  project?: any;
  isoProjectId?: number;
  isMedDevice?: boolean;
  isAutomotive?: boolean;
  isAerospace?: boolean;
  onAskIsa?: (q: string) => void;
}

export default function NCMRModule({ project, isMedDevice, isAutomotive, isAerospace, onAskIsa }: NCMRModuleProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const standard = project?.standard ?? "";
  const showAutomotive = !!(isAutomotive ?? (standard.includes("IATF") || standard.includes("16949")));
  const showMedDevice  = !!(isMedDevice  ?? standard.includes("13485"));
  const showAerospace  = !!(isAerospace  ?? (standard.includes("AS9100") || standard.includes("9100")));

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showLog, setShowLog] = useState(false);
  const [selected, setSelected] = useState<NcmrRecord | null>(null);

  const { data: records = [], isLoading } = useQuery<NcmrRecord[]>({ queryKey: ["/api/ncmr-records"] });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/ncmr-records", data),
    onSuccess: async (res: any) => {
      const created = res.json ? await res.json() : res;
      qc.invalidateQueries({ queryKey: ["/api/ncmr-records"] });
      toast({ title: "NCMR Opened", description: `${created.ncmrNumber ?? "Record"} created.` });
      setShowLog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/ncmr-records/${id}`, data),
    onSuccess: async (res: any) => {
      const updated = res.json ? await res.json() : res;
      qc.invalidateQueries({ queryKey: ["/api/ncmr-records"] });
      setSelected(updated);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ncmr-records/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/ncmr-records"] }); setSelected(null); toast({ title: "NCMR Deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleSave(data: any, trailEntry?: { action: string; by?: string; notes?: string }) {
    if (!selected) return;
    const trail = Array.isArray(selected.auditTrail) ? selected.auditTrail : [];
    const newTrail = trailEntry
      ? [...trail, { timestamp: new Date().toISOString(), action: trailEntry.action, by: trailEntry.by ?? "User", notes: trailEntry.notes ?? "" }]
      : trail;
    updateMut.mutate({ id: selected.id, data: { ...data, auditTrail: newTrail } });
  }

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const open      = records.filter(r => r.status !== "closed" && r.status !== "released");
  const critical  = records.filter(r => r.severity === "critical" && r.status !== "closed" && r.status !== "released");
  const major     = records.filter(r => r.severity === "major"    && r.status !== "closed" && r.status !== "released");
  const inQuar    = records.filter(r => r.status === "quarantine");
  const awaitDisp = records.filter(r => r.status === "disposition_pending" || r.status === "under_review");
  const overdue30 = open.filter(r => (now.getTime() - new Date(r.createdAt ?? "").getTime()) > 30 * 24 * 60 * 60 * 1000);
  const closedMo  = records.filter(r =>
    (r.status === "closed" || r.status === "released") &&
    (r.closedDate ?? (r.updatedAt as any)?.toString() ?? "") >= thisMonthStart
  );

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase();
    const mq = !q || [r.title, r.ncmrNumber, r.partNumber, r.partName, r.supplierName].some(v => v?.toLowerCase().includes(q));
    const ms = filterStatus   === "all" || r.status   === filterStatus;
    const mv = filterSeverity === "all" || r.severity === filterSeverity;
    return mq && ms && mv;
  }), [records, search, filterStatus, filterSeverity]);

  const kpis = [
    { label: "Open NCMRs",        value: open.length,      icon: <Package className="w-5 h-5" />,        color: "text-blue-600",   bg: "bg-blue-50 border-blue-100" },
    { label: "Critical / Major",  value: `${critical.length} / ${major.length}`, icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-50 border-red-100" },
    { label: "In Quarantine",     value: inQuar.length,    icon: <Shield className="w-5 h-5" />,          color: "text-amber-600",  bg: "bg-amber-50 border-amber-100" },
    { label: "Awaiting Dispos.",  value: awaitDisp.length, icon: <ClipboardList className="w-5 h-5" />,   color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
    { label: "Overdue (>30d)",    value: overdue30.length, icon: <Clock className="w-5 h-5" />,           color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
    { label: "Closed This Month", value: closedMo.length,  icon: <CheckCircle2 className="w-5 h-5" />,   color: "text-green-600",  bg: "bg-green-50 border-green-100" },
  ];

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-foreground">NC Product & Material Control</h2>
            <Badge variant="outline" className="text-xs">NCMR / MRB</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quarantine, disposition, rework & verification workflow — ISO 8.7 / IATF / AS9100D / ISO 13485
          </p>
        </div>
        <Button
          onClick={() => setShowLog(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          data-testid="button-log-ncmr"
        >
          <Plus className="w-4 h-4 mr-1" /> Log NCMR
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className={`border ${k.bg} shadow-none`}>
            <CardContent className="p-3 flex flex-col gap-1">
              <div className={`${k.color}`}>{k.icon}</div>
              <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
              <div className="text-xs text-muted-foreground font-medium leading-tight">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search NCMR #, title, part #…"
            className="pl-8"
            data-testid="input-ncmr-search"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44" data-testid="select-filter-status"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-36" data-testid="select-filter-severity"><SelectValue placeholder="All Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
          </SelectContent>
        </Select>
        {(search || filterStatus !== "all" || filterSeverity !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterSeverity("all"); }}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* NCMR Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-border/60 bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <Package className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm font-medium">No NCMR records found</p>
            <p className="text-xs">Click "Log NCMR" to open the first nonconformance.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">NCMR #</th>
                <th className="text-left px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Title / Part</th>
                <th className="text-left px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Severity</th>
                <th className="text-left px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Source</th>
                <th className="text-left px-3 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map(r => (
                <tr
                  key={r.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelected(r)}
                  data-testid={`row-ncmr-${r.id}`}
                >
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs font-bold text-primary">{r.ncmrNumber ?? `NCMR-${r.id}`}</span>
                  </td>
                  <td className="px-3 py-2.5 max-w-60">
                    <p className="font-medium truncate">{r.title}</p>
                    {r.partNumber && <p className="text-xs text-muted-foreground">P/N: {r.partNumber}{r.partName ? ` — ${r.partName}` : ""}</p>}
                  </td>
                  <td className="px-3 py-2.5"><SevBadge sev={r.severity} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{SOURCE_LABELS[r.sourceType ?? ""] ?? r.sourceType}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{r.identifiedDate ?? r.createdAt?.toString().split("T")[0]}</td>
                  <td className="px-3 py-2.5">
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={e => { e.stopPropagation(); if (confirm("Delete this NCMR?")) deleteMut.mutate(r.id); }}
                      data-testid={`button-delete-ncmr-${r.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialogs */}
      <LogNCMRDialog
        open={showLog}
        onClose={() => setShowLog(false)}
        onSave={data => createMut.mutate(data)}
        isSaving={createMut.isPending}
      />
      {selected && (
        <NCMRDetailDialog
          record={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          isSaving={updateMut.isPending}
          showAutomotive={showAutomotive}
          showMedDevice={showMedDevice}
          showAerospace={showAerospace}
        />
      )}
    </div>
  );
}
