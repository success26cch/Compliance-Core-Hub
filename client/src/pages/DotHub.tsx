import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Truck, Users, Download, Bell, AlertTriangle, CheckCircle2,
  Plus, Pencil, Trash2, FileText, Clock, Car, RefreshCcw, X
} from "lucide-react";
import { ProtectedLayout } from "@/components/Layout";

// ─── Types (matching schema) ─────────────────────────────────────────────────

interface DotDriver {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  status: string;
  cdlNumber?: string;
  cdlState?: string;
  cdlExpiry?: string;
  dateOfBirth?: string;
  hireDate?: string;
  terminationDate?: string;
  clearinghouseConsentOnFile?: boolean;
  lastClearinghouseQueryDate?: string;
  queryType?: string;
  medicalCardExpiry?: string;
  lastMvrDate?: string;
  randomPoolIncluded?: boolean;
  notes?: string;
  clearinghouseExportedAt?: string;
  clearinghouseRemovalExported?: boolean;
  updatedAt?: string;
}

interface DotEquipment {
  id: number;
  userId: string;
  unitNumber: string;
  type: string;
  year?: string;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  isActive?: boolean;
  lastAnnualInspectionDate?: string;
  lastPmDate?: string;
  notes?: string;
  updatedAt?: string;
}

interface DotMetrics {
  totalDrivers: number;
  clearinghouse: { overdue: number; warning: number };
  medicalCards: { overdue: number; warning: number };
  mvr: { overdue: number };
  equipment: { total: number; overdue: number };
  noConsentOnFile: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY = 1000 * 60 * 60 * 24;

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY);
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / DAY);
}

function chStatus(driver: DotDriver): "red" | "yellow" | "green" | "grey" {
  if (!driver.clearinghouseConsentOnFile) return "grey";
  const days = daysSince(driver.lastClearinghouseQueryDate);
  if (days === null || days > 365) return "red";
  if (days > 335) return "yellow";
  return "green";
}

function medStatus(driver: DotDriver): "red" | "yellow" | "green" | "grey" {
  const days = daysUntil(driver.medicalCardExpiry);
  if (days === null) return "grey";
  if (days < 0) return "red";
  if (days < 60) return "yellow";
  return "green";
}

function mvrStatus(driver: DotDriver): "red" | "yellow" | "green" {
  const days = daysSince(driver.lastMvrDate);
  if (days === null || days > 365) return "red";
  if (days > 335) return "yellow";
  return "green";
}

function statusBadge(status: "red" | "yellow" | "green" | "grey", label: string) {
  const cls = {
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    grey: "bg-slate-100 text-slate-500 border-slate-200",
  }[status];
  return <Badge className={`${cls} text-xs`}>{label}</Badge>;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, sub, variant }: {
  icon: any; label: string; value: number | string; sub?: string; variant: "red" | "yellow" | "green" | "neutral";
}) {
  const colors = {
    red: "border-red-200 bg-red-50",
    yellow: "border-yellow-200 bg-yellow-50",
    green: "border-emerald-200 bg-emerald-50",
    neutral: "border-border bg-white",
  };
  const iconColors = { red: "text-red-500", yellow: "text-yellow-500", green: "text-emerald-500", neutral: "text-primary" };
  return (
    <div className={`rounded-xl border p-4 ${colors[variant]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColors[variant]}`} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-primary">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ─── Driver Form ──────────────────────────────────────────────────────────────

interface DriverFormData {
  firstName: string; lastName: string; employeeId: string; status: string;
  cdlNumber: string; cdlState: string; cdlClass: string; cdlExpiry: string;
  dateOfBirth: string; hireDate: string; terminationDate: string;
  clearinghouseConsentOnFile: boolean; lastClearinghouseQueryDate: string;
  queryType: string; medicalCardExpiry: string; lastMvrDate: string;
  randomPoolEnrolled: boolean; notes: string;
}

const EMPTY_DRIVER: DriverFormData = {
  firstName: "", lastName: "", employeeId: "", status: "active",
  cdlNumber: "", cdlState: "", cdlClass: "A", cdlExpiry: "",
  dateOfBirth: "", hireDate: "", terminationDate: "",
  clearinghouseConsentOnFile: false, lastClearinghouseQueryDate: "",
  queryType: "limited", medicalCardExpiry: "", lastMvrDate: "",
  randomPoolEnrolled: true, notes: "",
};

function DriverFormDialog({ open, onClose, existing }: { open: boolean; onClose: () => void; existing?: DotDriver | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!existing;

  const [form, setForm] = useState<DriverFormData>(
    existing ? {
      firstName: existing.firstName ?? "", lastName: existing.lastName ?? "",
      employeeId: existing.employeeId ?? "", status: existing.status ?? "active",
      cdlNumber: existing.cdlNumber ?? "", cdlState: existing.cdlState ?? "",
      cdlClass: existing.cdlClass ?? "A", cdlExpiry: existing.cdlExpiry?.slice(0, 10) ?? "",
      dateOfBirth: existing.dateOfBirth?.slice(0, 10) ?? "",
      hireDate: existing.hireDate?.slice(0, 10) ?? "",
      terminationDate: existing.terminationDate?.slice(0, 10) ?? "",
      clearinghouseConsentOnFile: existing.clearinghouseConsentOnFile ?? false,
      lastClearinghouseQueryDate: existing.lastClearinghouseQueryDate?.slice(0, 10) ?? "",
      queryType: existing.queryType ?? "limited",
      medicalCardExpiry: existing.medicalCardExpiry?.slice(0, 10) ?? "",
      lastMvrDate: existing.lastMvrDate?.slice(0, 10) ?? "",
      randomPoolEnrolled: existing.randomPoolIncluded ?? true,
      notes: existing.notes ?? "",
    } : EMPTY_DRIVER
  );

  const set = (k: keyof DriverFormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      if (isEdit) {
        const r = await apiRequest("PUT", `/api/dot/drivers/${existing!.id}`, payload);
        return r.json();
      } else {
        const r = await apiRequest("POST", "/api/dot/drivers", payload);
        return r.json();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dot/drivers"] });
      qc.invalidateQueries({ queryKey: ["/api/dot/metrics"] });
      toast({ title: isEdit ? "Driver updated" : "Driver added" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Driver" : "Add Driver"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label>First Name *</Label>
            <Input value={form.firstName} onChange={e => set("firstName", e.target.value)} data-testid="input-driver-first" />
          </div>
          <div>
            <Label>Last Name *</Label>
            <Input value={form.lastName} onChange={e => set("lastName", e.target.value)} data-testid="input-driver-last" />
          </div>
          <div>
            <Label>Employee ID</Label>
            <Input value={form.employeeId} onChange={e => set("employeeId", e.target.value)} data-testid="input-driver-empid" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger data-testid="select-driver-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CDL Number</Label>
            <Input value={form.cdlNumber} onChange={e => set("cdlNumber", e.target.value)} data-testid="input-driver-cdl" />
          </div>
          <div>
            <Label>CDL State</Label>
            <Select value={form.cdlState} onValueChange={v => set("cdlState", v)}>
              <SelectTrigger data-testid="select-driver-cdlstate"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CDL Class</Label>
            <Select value={form.cdlClass} onValueChange={v => set("cdlClass", v)}>
              <SelectTrigger data-testid="select-driver-cdlclass"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Class A</SelectItem>
                <SelectItem value="B">Class B</SelectItem>
                <SelectItem value="C">Class C</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CDL Expiry</Label>
            <Input type="date" value={form.cdlExpiry} onChange={e => set("cdlExpiry", e.target.value)} data-testid="input-driver-cdlexpiry" />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} data-testid="input-driver-dob" />
          </div>
          <div>
            <Label>Hire Date</Label>
            <Input type="date" value={form.hireDate} onChange={e => set("hireDate", e.target.value)} data-testid="input-driver-hire" />
          </div>
          <div>
            <Label>Termination Date</Label>
            <Input type="date" value={form.terminationDate} onChange={e => set("terminationDate", e.target.value)} data-testid="input-driver-term" />
          </div>
          <div>
            <Label>Query Type</Label>
            <Select value={form.queryType} onValueChange={v => set("queryType", v)}>
              <SelectTrigger data-testid="select-driver-querytype"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="limited">Limited Inquiry</SelectItem>
                <SelectItem value="full">Full Query</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Last Clearinghouse Query Date</Label>
            <Input type="date" value={form.lastClearinghouseQueryDate} onChange={e => set("lastClearinghouseQueryDate", e.target.value)} data-testid="input-driver-chdate" />
          </div>
          <div>
            <Label>Medical Card Expiry</Label>
            <Input type="date" value={form.medicalCardExpiry} onChange={e => set("medicalCardExpiry", e.target.value)} data-testid="input-driver-medexp" />
          </div>
          <div>
            <Label>Last MVR Pull Date</Label>
            <Input type="date" value={form.lastMvrDate} onChange={e => set("lastMvrDate", e.target.value)} data-testid="input-driver-mvrdate" />
          </div>
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.clearinghouseConsentOnFile} onChange={e => set("clearinghouseConsentOnFile", e.target.checked)} data-testid="check-driver-consent" />
              <span className="text-sm">Consent Form on File</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.randomPoolEnrolled} onChange={e => set("randomPoolEnrolled", e.target.checked)} data-testid="check-driver-random" />
              <span className="text-sm">Random Pool Enrolled</span>
            </label>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => set("notes", e.target.value)} data-testid="input-driver-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-driver-cancel">Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.firstName || !form.lastName || save.isPending} data-testid="button-driver-save">
            {save.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Equipment Form ───────────────────────────────────────────────────────────

interface EquipFormData {
  unitNumber: string; equipmentType: string; year: string;
  make: string; model: string; vin: string; licensePlate: string;
  isActive: boolean; lastAnnualInspectionDate: string; nextPmDueDate: string; notes: string;
}

const EMPTY_EQUIP: EquipFormData = {
  unitNumber: "", equipmentType: "truck", year: "", make: "", model: "",
  vin: "", licensePlate: "", isActive: true, lastAnnualInspectionDate: "", nextPmDueDate: "", notes: "",
};

function EquipmentFormDialog({ open, onClose, existing }: { open: boolean; onClose: () => void; existing?: DotEquipment | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!existing;
  const [form, setForm] = useState<EquipFormData>(existing ? {
    unitNumber: existing.unitNumber ?? "", equipmentType: existing.type ?? "truck",
    year: existing.year?.toString() ?? "", make: existing.make ?? "", model: existing.model ?? "",
    vin: existing.vin ?? "", licensePlate: existing.licensePlate ?? "",
    isActive: existing.isActive ?? true,
    lastAnnualInspectionDate: existing.lastAnnualInspectionDate?.slice(0, 10) ?? "",
    nextPmDueDate: existing.lastPmDate?.slice(0, 10) ?? "",
    notes: existing.notes ?? "",
  } : EMPTY_EQUIP);

  const set = (k: keyof EquipFormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, year: form.year ? parseInt(form.year) : null };
      if (isEdit) {
        const r = await apiRequest("PUT", `/api/dot/equipment/${existing!.id}`, payload);
        return r.json();
      } else {
        const r = await apiRequest("POST", "/api/dot/equipment", payload);
        return r.json();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dot/equipment"] });
      qc.invalidateQueries({ queryKey: ["/api/dot/metrics"] });
      toast({ title: isEdit ? "Equipment updated" : "Equipment added" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label>Unit # *</Label>
            <Input value={form.unitNumber} onChange={e => set("unitNumber", e.target.value)} data-testid="input-equip-unit" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.equipmentType} onValueChange={v => set("equipmentType", v)}>
              <SelectTrigger data-testid="select-equip-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="truck">Truck / Tractor</SelectItem>
                <SelectItem value="trailer">Trailer</SelectItem>
                <SelectItem value="straight_truck">Straight Truck</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Year</Label>
            <Input type="number" value={form.year} onChange={e => set("year", e.target.value)} data-testid="input-equip-year" />
          </div>
          <div>
            <Label>Make</Label>
            <Input value={form.make} onChange={e => set("make", e.target.value)} data-testid="input-equip-make" />
          </div>
          <div>
            <Label>Model</Label>
            <Input value={form.model} onChange={e => set("model", e.target.value)} data-testid="input-equip-model" />
          </div>
          <div>
            <Label>VIN</Label>
            <Input value={form.vin} onChange={e => set("vin", e.target.value)} data-testid="input-equip-vin" />
          </div>
          <div>
            <Label>License Plate</Label>
            <Input value={form.licensePlate} onChange={e => set("licensePlate", e.target.value)} data-testid="input-equip-plate" />
          </div>
          <div>
            <Label>Last Annual Inspection</Label>
            <Input type="date" value={form.lastAnnualInspectionDate} onChange={e => set("lastAnnualInspectionDate", e.target.value)} data-testid="input-equip-inspection" />
          </div>
          <div>
            <Label>Next PM Due</Label>
            <Input type="date" value={form.nextPmDueDate} onChange={e => set("nextPmDueDate", e.target.value)} data-testid="input-equip-pm" />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} data-testid="check-equip-active" />
              <span className="text-sm">Active / In Service</span>
            </label>
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={e => set("notes", e.target.value)} data-testid="input-equip-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-equip-cancel">Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.unitNumber || save.isPending} data-testid="button-equip-save">
            {save.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Equipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DotHub() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("drivers");
  const [driverDialog, setDriverDialog] = useState<{ open: boolean; driver?: DotDriver | null }>({ open: false });
  const [equipDialog, setEquipDialog] = useState<{ open: boolean; equip?: DotEquipment | null }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "driver" | "equip"; id: number } | null>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DotMetrics>({
    queryKey: ["/api/dot/metrics"],
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<DotDriver[]>({
    queryKey: ["/api/dot/drivers"],
  });

  const { data: equipment = [], isLoading: equipLoading } = useQuery<DotEquipment[]>({
    queryKey: ["/api/dot/equipment"],
  });

  const { data: deltaStatus, refetch: refetchDelta } = useQuery<{
    pendingAdd: number; synced: number; pendingRemove: number; total: number;
  }>({ queryKey: ["/api/dot/clearinghouse-delta-status"] });

  const deleteDriver = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dot/drivers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dot/drivers"] });
      qc.invalidateQueries({ queryKey: ["/api/dot/metrics"] });
      toast({ title: "Driver removed" });
      setDeleteConfirm(null);
    },
  });

  const deleteEquip = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dot/equipment/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/dot/equipment"] });
      qc.invalidateQueries({ queryKey: ["/api/dot/metrics"] });
      toast({ title: "Equipment removed" });
      setDeleteConfirm(null);
    },
  });

  const handleExportCsv = async () => {
    const link = document.createElement("a");
    link.href = "/api/dot/drivers-export-csv";
    link.click();
  };

  const [deltaExporting, setDeltaExporting] = useState(false);
  const handleDeltaExport = async () => {
    setDeltaExporting(true);
    try {
      const res = await fetch("/api/dot/drivers-delta-csv", { credentials: "include" });
      if (!res.ok) { toast({ title: "Export failed", variant: "destructive" }); return; }
      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        toast({ title: "No changes to export", description: data.message });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().slice(0, 10);
      link.download = `clearinghouse-delta-${date}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Delta file generated", description: "Drivers marked as synced. Upload this file to clearinghouse.fmcsa.dot.gov" });
      refetchDelta();
      qc.invalidateQueries({ queryKey: ["/api/dot/drivers"] });
    } finally {
      setDeltaExporting(false);
    }
  };

  const activeDrivers = drivers.filter(d => d.status === "active");
  const nonActiveDrivers = drivers.filter(d => d.status !== "active");

  // ── Urgency calculation for action banner ──────────────────────────────────
  const overdueChDrivers  = activeDrivers.filter(d => chStatus(d) === "red");
  const warnChDrivers     = activeDrivers.filter(d => chStatus(d) === "yellow");
  const overdueMedDrivers = activeDrivers.filter(d => {
    const days = daysUntil(d.medicalCardExpiry);
    return days !== null && days < 0;
  });
  const warnMedDrivers = activeDrivers.filter(d => {
    const days = daysUntil(d.medicalCardExpiry);
    return days !== null && days >= 0 && days <= 30;
  });

  // Find nearest Clearinghouse query expiry date among yellow-status drivers
  const nearestChExpiry = warnChDrivers.reduce((nearest, d) => {
    if (!d.lastClearinghouseQueryDate) return nearest;
    const expiry = new Date(new Date(d.lastClearinghouseQueryDate).getTime() + 365 * 86400000);
    return nearest === null || expiry < nearest ? expiry : nearest;
  }, null as Date | null);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const nearestChDays = nearestChExpiry
    ? Math.ceil((nearestChExpiry.getTime() - Date.now()) / 86400000)
    : null;
  const nearestChLabel = nearestChExpiry && nearestChDays !== null
    ? nearestChDays <= 0   ? "today"
    : nearestChDays === 1  ? "tomorrow"
    : nearestChDays <= 7   ? `this ${dayNames[nearestChExpiry.getDay()]}`
    : null
    : null;

  return (
    <ProtectedLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-6 h-6 text-accent" />
              <h1 className="text-2xl font-display font-bold text-primary">DOT Compliance Hub</h1>
            </div>
            <p className="text-muted-foreground text-sm">49 CFR Parts 40, 382, 383, 391 compliance management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              qc.invalidateQueries({ queryKey: ["/api/dot/metrics"] });
              qc.invalidateQueries({ queryKey: ["/api/dot/drivers"] });
              qc.invalidateQueries({ queryKey: ["/api/dot/equipment"] });
            }} data-testid="button-dot-refresh">
              <RefreshCcw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={() => setDriverDialog({ open: true })} data-testid="button-add-driver">
              <Plus className="w-4 h-4 mr-1" />
              Add Driver
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard icon={Users} label="Active Drivers" value={metrics?.totalDrivers ?? "—"} variant="neutral" />
          <MetricCard icon={Clock} label="CH Query Overdue" value={metrics?.clearinghouse.overdue ?? "—"} sub="Annual query required" variant={metrics?.clearinghouse.overdue ? "red" : "green"} />
          <MetricCard icon={Bell} label="CH Query Due Soon" value={metrics?.clearinghouse.warning ?? "—"} sub="Within 30 days" variant={metrics?.clearinghouse.warning ? "yellow" : "green"} />
          <MetricCard icon={Car} label="Med Cards Expired" value={metrics?.medicalCards.overdue ?? "—"} sub="Immediate action" variant={metrics?.medicalCards.overdue ? "red" : "green"} />
          <MetricCard icon={FileText} label="MVR Overdue" value={metrics?.mvr.overdue ?? "—"} sub="365-day limit" variant={metrics?.mvr.overdue ? "red" : "green"} />
          <MetricCard icon={Truck} label="Equipment Overdue" value={metrics?.equipment.overdue ?? "—"} sub="Annual inspection" variant={metrics?.equipment.overdue ? "red" : "green"} />
        </div>

        {/* No consent banner */}
        {metrics && metrics.noConsentOnFile > 0 && (
          <div className="mb-6 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                {metrics.noConsentOnFile} driver{metrics.noConsentOnFile > 1 ? "s" : ""} without a Clearinghouse consent form on file
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                You cannot legally run a Limited Inquiry query without a signed consent form (49 CFR § 382.701). Update the driver record once the form is signed.
              </p>
            </div>
          </div>
        )}

        {/* ── Action Alert Banner ────────────────────────────────────────────── */}
        {!driversLoading && (overdueChDrivers.length > 0 || (warnChDrivers.length > 0 && nearestChLabel) || overdueMedDrivers.length > 0 || warnMedDrivers.length > 0) && (
          <div className="mb-6 space-y-2" data-testid="action-alert-banner">

            {/* Critical: CH queries overdue */}
            {overdueChDrivers.length > 0 && (
              <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      {overdueChDrivers.length} driver{overdueChDrivers.length > 1 ? "s" : ""} {overdueChDrivers.length > 1 ? "are" : "is"} overdue for an annual Clearinghouse query
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">Annual queries required under 49 CFR § 382.701 — action needed now</p>
                  </div>
                </div>
                <Button size="sm" className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white" onClick={() => setActiveTab("clearinghouse")} data-testid="button-alert-ch-overdue">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Generate Query File
                </Button>
              </div>
            )}

            {/* Warning: CH queries due soon with specific day */}
            {warnChDrivers.length > 0 && nearestChLabel && (
              <div className="flex items-center justify-between gap-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">
                      {warnChDrivers.length} driver{warnChDrivers.length > 1 ? "s" : ""} need annual Clearinghouse {warnChDrivers.length > 1 ? "queries" : "query"} by {nearestChLabel}
                    </p>
                    <p className="text-xs text-orange-600 mt-0.5">Export the query file now to stay ahead of the deadline</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="flex-shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100" onClick={() => setActiveTab("clearinghouse")} data-testid="button-alert-ch-warn">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Generate Query File
                </Button>
              </div>
            )}

            {/* Medical card expiry alerts */}
            {overdueMedDrivers.length > 0 && (
              <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      {overdueMedDrivers.length} driver{overdueMedDrivers.length > 1 ? "s" : ""} {overdueMedDrivers.length > 1 ? "have" : "has"} an expired medical card
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">Drivers cannot operate a CMV with an expired medical certificate — 49 CFR § 391.45</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100" onClick={() => setActiveTab("drivers")} data-testid="button-alert-med-expired">
                  View Drivers
                </Button>
              </div>
            )}

            {warnMedDrivers.length > 0 && overdueMedDrivers.length === 0 && (
              <div className="flex items-center justify-between gap-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Bell className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      {warnMedDrivers.length} driver{warnMedDrivers.length > 1 ? "s" : ""} {warnMedDrivers.length > 1 ? "have" : "has"} a medical card expiring within 30 days
                    </p>
                    <p className="text-xs text-yellow-600 mt-0.5">Schedule DOT physicals before expiry to avoid driving disqualification</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="flex-shrink-0 border-yellow-300 text-yellow-700 hover:bg-yellow-100" onClick={() => setActiveTab("drivers")} data-testid="button-alert-med-warn">
                  View Drivers
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="drivers" data-testid="tab-dot-drivers">
              <Users className="w-4 h-4 mr-1.5" />
              Drivers ({activeDrivers.length})
            </TabsTrigger>
            <TabsTrigger value="equipment" data-testid="tab-dot-equipment">
              <Truck className="w-4 h-4 mr-1.5" />
              Equipment ({equipment.length})
            </TabsTrigger>
            <TabsTrigger value="clearinghouse" data-testid="tab-dot-clearinghouse">
              <Download className="w-4 h-4 mr-1.5" />
              Clearinghouse Export
            </TabsTrigger>
            <TabsTrigger value="archive" data-testid="tab-dot-archive">
              <FileText className="w-4 h-4 mr-1.5" />
              Archive ({nonActiveDrivers.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Drivers Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="drivers">
            {driversLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading drivers…</div>
            ) : activeDrivers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No active drivers yet.</p>
                <Button size="sm" className="mt-4 bg-accent hover:bg-accent/90 text-white" onClick={() => setDriverDialog({ open: true })} data-testid="button-add-driver-empty">
                  <Plus className="w-4 h-4 mr-1" /> Add First Driver
                </Button>
              </div>
            ) : (
              <div className="bg-white border border-border/60 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border/60">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">Driver</th>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">CDL</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">Clearinghouse</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">Medical Card</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">MVR</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">Consent</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">Pool</th>
                        <th className="text-right px-4 py-3 font-semibold text-primary text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {activeDrivers.map(d => {
                        const ch = chStatus(d);
                        const med = medStatus(d);
                        const mvr = mvrStatus(d);
                        const chDays = daysSince(d.lastClearinghouseQueryDate);
                        const medDays = daysUntil(d.medicalCardExpiry);
                        return (
                          <tr key={d.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-driver-${d.id}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-primary">{d.firstName} {d.lastName}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs">{d.cdlNumber || "—"} {d.cdlState ? `(${d.cdlState})` : ""}</div>
                              <div className="text-xs text-muted-foreground">Exp {formatDate(d.cdlExpiry)}</div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {statusBadge(ch, ch === "grey" ? "No Consent" : chDays === null ? "Never Queried" : ch === "red" ? `${chDays}d ago` : ch === "yellow" ? `${chDays}d ago` : "Current")}
                                {d.lastClearinghouseQueryDate && <div className="text-xs text-muted-foreground">{formatDate(d.lastClearinghouseQueryDate)}</div>}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {statusBadge(med, medDays === null ? "No Date" : medDays < 0 ? "Expired" : medDays < 60 ? `${medDays}d left` : "Current")}
                                {d.medicalCardExpiry && <div className="text-xs text-muted-foreground">Exp {formatDate(d.medicalCardExpiry)}</div>}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {statusBadge(mvr, d.lastMvrDate ? `${daysSince(d.lastMvrDate)}d ago` : "Never Pulled")}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {d.clearinghouseConsentOnFile
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                : <X className="w-4 h-4 text-red-400 mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {d.randomPoolIncluded
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => setDriverDialog({ open: true, driver: d })} data-testid={`button-edit-driver-${d.id}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => setDeleteConfirm({ type: "driver", id: d.id })} data-testid={`button-delete-driver-${d.id}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Equipment Tab ────────────────────────────────────────────────── */}
          <TabsContent value="equipment">
            <div className="flex justify-end mb-4">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={() => setEquipDialog({ open: true })} data-testid="button-add-equip">
                <Plus className="w-4 h-4 mr-1" /> Add Equipment
              </Button>
            </div>
            {equipLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading equipment…</div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No equipment tracked yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-border/60 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border/60">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">Unit #</th>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">Type / Details</th>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">VIN / Plate</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">Annual Inspection</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">Next PM</th>
                        <th className="text-center px-3 py-3 font-semibold text-primary text-xs">Status</th>
                        <th className="text-right px-4 py-3 font-semibold text-primary text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {equipment.map(e => {
                        const inspDays = daysSince(e.lastAnnualInspectionDate);
                        const inspStatus: "red" | "yellow" | "green" | "grey" = inspDays === null ? "grey" : inspDays > 365 ? "red" : inspDays > 335 ? "yellow" : "green";
                        return (
                          <tr key={e.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-equip-${e.id}`}>
                            <td className="px-4 py-3 font-medium text-primary">{e.unitNumber}</td>
                            <td className="px-4 py-3">
                              <div className="capitalize">{e.type?.replace("_", " ")}</div>
                              <div className="text-xs text-muted-foreground">{[e.year, e.make, e.model].filter(Boolean).join(" ")}</div>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div>{e.vin || "—"}</div>
                              <div className="text-muted-foreground">{e.licensePlate || "—"}</div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {statusBadge(inspStatus, inspDays === null ? "No Date" : inspDays > 365 ? "Overdue" : inspDays > 335 ? `${inspDays}d ago` : "Current")}
                                {e.lastAnnualInspectionDate && <div className="text-xs text-muted-foreground">{formatDate(e.lastAnnualInspectionDate)}</div>}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center text-xs">{formatDate(e.lastPmDate)}</td>
                            <td className="px-3 py-3 text-center">
                              {e.isActive
                                ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                                : <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs">Inactive</Badge>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => setEquipDialog({ open: true, equip: e })} data-testid={`button-edit-equip-${e.id}`}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => setDeleteConfirm({ type: "equip", id: e.id })} data-testid={`button-delete-equip-${e.id}`}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Clearinghouse Export Tab ──────────────────────────────────────── */}
          <TabsContent value="clearinghouse">
            <div className="max-w-2xl mx-auto py-8 space-y-6">

              {/* ── Delta Sync (hero) ──────────────────────────────────────────── */}
              <div className="bg-white border-2 border-accent/30 rounded-2xl p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-accent/10 rounded-xl p-3">
                    <RefreshCcw className="w-7 h-7 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-primary">Clearinghouse Sync — Changes Only</h2>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                      Generates a <strong>delta file</strong> containing only what changed since your last export — new hires to <span className="text-emerald-600 font-medium">ADD</span> and terminated drivers to <span className="text-red-500 font-medium">REMOVE</span>. Upload directly to <strong>clearinghouse.fmcsa.dot.gov</strong> on the 1st of each month.
                    </p>
                  </div>
                </div>

                {/* Status grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600" data-testid="stat-pending-add">{deltaStatus?.pendingAdd ?? 0}</div>
                    <div className="text-xs text-emerald-700 mt-1 font-medium">Pending ADD</div>
                    <div className="text-xs text-muted-foreground mt-0.5">New hires</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600" data-testid="stat-synced">{deltaStatus?.synced ?? 0}</div>
                    <div className="text-xs text-blue-700 mt-1 font-medium">Synced</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Already in CH</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-500" data-testid="stat-pending-remove">{deltaStatus?.pendingRemove ?? 0}</div>
                    <div className="text-xs text-red-600 mt-1 font-medium">Pending REMOVE</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Terminated</div>
                  </div>
                </div>

                {/* How it works steps */}
                <div className="bg-muted/30 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">Monthly Workflow</p>
                  <ol className="space-y-2 text-sm text-muted-foreground list-none">
                    {[
                      "Manage your driver roster in CCH throughout the month (add new hires, terminate departures).",
                      "On the 1st of the month, click \"Generate Changes File\" below.",
                      "CCH produces a delta CSV with only the additions and removals since last export.",
                      "Upload the file to clearinghouse.fmcsa.dot.gov — done.",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  onClick={handleDeltaExport}
                  disabled={deltaExporting || ((deltaStatus?.pendingAdd ?? 0) + (deltaStatus?.pendingRemove ?? 0) === 0)}
                  data-testid="button-delta-export"
                >
                  {deltaExporting ? (
                    <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 mr-2" />
                  )}
                  {deltaExporting ? "Generating…" : (deltaStatus?.pendingAdd ?? 0) + (deltaStatus?.pendingRemove ?? 0) === 0
                    ? "No Changes to Export"
                    : `Generate Changes File (${(deltaStatus?.pendingAdd ?? 0) + (deltaStatus?.pendingRemove ?? 0)} change${(deltaStatus?.pendingAdd ?? 0) + (deltaStatus?.pendingRemove ?? 0) !== 1 ? "s" : ""})`}
                </Button>
                <p className="mt-3 text-xs text-center text-muted-foreground">
                  After download, drivers are automatically marked as synced · 49 CFR § 382.701
                </p>
              </div>

              {/* ── Full Bulk Query Export (secondary) ────────────────────────── */}
              <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-primary text-sm">Full Roster Export</h3>
                    <p className="text-xs text-muted-foreground">All active drivers — use for initial setup or audits, not monthly sync.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="flex justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground text-xs">Active Drivers</span>
                    <span className="font-semibold text-primary text-xs">{activeDrivers.length}</span>
                  </div>
                  <div className="flex justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground text-xs">Query Overdue</span>
                    <span className="font-semibold text-red-500 text-xs">{metrics?.clearinghouse.overdue ?? 0}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={handleExportCsv} data-testid="button-export-csv">
                  <Download className="w-4 h-4 mr-2" />
                  Export Full Roster CSV
                </Button>
              </div>

              {/* ── Consent warning ─────────────────────────────────────────────── */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Consent reminder:</strong> Every driver in the export must have a signed Limited Inquiry Consent form on file before you submit the query. Running without written consent violates 49 CFR Part 382. CCH flags drivers without consent in the driver roster.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Archive Tab ──────────────────────────────────────────────────── */}
          <TabsContent value="archive">
            {nonActiveDrivers.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No archived or terminated drivers.</p>
              </div>
            ) : (
              <div className="bg-white border border-border/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/60">
                  <p className="text-xs text-muted-foreground">FMCSA requires DQ file records to be retained for <strong>3 years</strong> after driver employment ends (49 CFR § 391.51). Records are read-only in archive mode.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border/60">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">Driver</th>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">Hire Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">Termination Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-primary text-xs">CDL</th>
                        <th className="text-right px-4 py-3 font-semibold text-primary text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {nonActiveDrivers.map(d => (
                        <tr key={d.id} className="hover:bg-muted/20 transition-colors opacity-75" data-testid={`row-archive-${d.id}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-primary">{d.firstName} {d.lastName}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs capitalize">{d.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs">{formatDate(d.hireDate)}</td>
                          <td className="px-4 py-3 text-xs">{formatDate(d.terminationDate)}</td>
                          <td className="px-4 py-3 text-xs">{d.cdlNumber || "—"} {d.cdlState ? `(${d.cdlState})` : ""}</td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="ghost" onClick={() => setDriverDialog({ open: true, driver: d })} data-testid={`button-edit-archive-${d.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <DriverFormDialog
        open={driverDialog.open}
        onClose={() => setDriverDialog({ open: false })}
        existing={driverDialog.driver}
      />

      <EquipmentFormDialog
        open={equipDialog.open}
        onClose={() => setEquipDialog({ open: false })}
        existing={equipDialog.equip}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={v => !v && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            {deleteConfirm?.type === "driver"
              ? "This will permanently delete the driver record. If this driver was terminated, consider archiving instead (by changing status to 'Archived'). FMCSA requires records for 3 years after termination."
              : "This will permanently delete the equipment record. This cannot be undone."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-delete-cancel">Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (!deleteConfirm) return;
              if (deleteConfirm.type === "driver") deleteDriver.mutate(deleteConfirm.id);
              else deleteEquip.mutate(deleteConfirm.id);
            }} disabled={deleteDriver.isPending || deleteEquip.isPending} data-testid="button-delete-confirm">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  );
}
