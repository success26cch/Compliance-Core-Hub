import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock, Eye,
  Archive, FileText, MapPin, Shield, ShieldAlert, ShieldCheck,
  Printer, ScrollText, Database, HardDrive, FileBadge, RotateCcw,
  Search, Filter, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RecordRetentionEntry, RecordInstance, RecordAuditEntry } from "@shared/schema";

const RETENTION_PRESETS = [
  { label: "1 Year", days: 365 },
  { label: "3 Years", days: 1095 },
  { label: "5 Years", days: 1825 },
  { label: "7 Years", days: 2555 },
  { label: "10 Years", days: 3650 },
  { label: "Permanent", days: null },
];

const STANDARDS = ["ISO 9001", "ISO 14001", "ISO 45001", "IATF 16949", "AS9100D", "ISO 13485", "ISO 27001", "OSHA", "EPA", "DOT"];

const DISPOSAL_METHODS = ["Shredding", "Digital Deletion", "Overwriting", "Incineration", "Secure Recycling", "Archive Transfer", "Other"];

const PROTECTION_METHODS = ["Password Protected", "Encrypted", "Locked Cabinet", "Fireproof Safe", "Restricted Access Server", "Other"];

const CONFIDENTIALITY_CONFIG = {
  general: { label: "General", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: Shield },
  confidential: { label: "Confidential", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: ShieldAlert },
  restricted: { label: "Restricted", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: ShieldCheck },
};

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  pending_disposal: { label: "Pending Disposal", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  disposed: { label: "Disposed", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" },
};

function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Register Entry Modal ──────────────────────────────────────────────────────
function RegisterEntryModal({ open, onClose, entry }: { open: boolean; onClose: () => void; entry?: RecordRetentionEntry | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!entry;

  const [form, setForm] = useState({
    recordType: entry?.recordType ?? "",
    retentionPeriod: entry?.retentionPeriod ?? "3 Years",
    retentionDays: entry?.retentionDays?.toString() ?? "1095",
    storageLocation: entry?.storageLocation ?? "",
    protectionMethod: entry?.protectionMethod ?? "",
    disposalMethod: entry?.disposalMethod ?? "",
    confidentiality: entry?.confidentiality ?? "general",
    applicableStandards: entry?.applicableStandards ?? [],
    notes: entry?.notes ?? "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit
        ? apiRequest("PATCH", `/api/record-retention/${entry!.id}`, data)
        : apiRequest("POST", "/api/record-retention", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/record-retention"] });
      qc.invalidateQueries({ queryKey: ["/api/record-audit-trail"] });
      toast({ title: isEdit ? "Entry updated" : "Entry created", description: form.recordType });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handlePreset = (preset: (typeof RETENTION_PRESETS)[number]) => {
    setForm(f => ({ ...f, retentionPeriod: preset.label, retentionDays: preset.days?.toString() ?? "" }));
  };

  const toggleStandard = (std: string) => {
    setForm(f => ({
      ...f,
      applicableStandards: f.applicableStandards.includes(std)
        ? f.applicableStandards.filter(s => s !== std)
        : [...f.applicableStandards, std],
    }));
  };

  const handleSave = () => {
    if (!form.recordType.trim()) return toast({ title: "Record Type is required", variant: "destructive" });
    mutation.mutate({
      recordType: form.recordType.trim(),
      retentionPeriod: form.retentionPeriod,
      retentionDays: form.retentionDays ? Number(form.retentionDays) : null,
      storageLocation: form.storageLocation || null,
      protectionMethod: form.protectionMethod || null,
      disposalMethod: form.disposalMethod || null,
      confidentiality: form.confidentiality,
      applicableStandards: form.applicableStandards,
      notes: form.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-primary" />
            {isEdit ? "Edit Register Entry" : "New Register Entry"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2">
          <div>
            <Label>Record Type / Name *</Label>
            <Input data-testid="input-record-type" value={form.recordType} onChange={e => setForm(f => ({ ...f, recordType: e.target.value }))}
              placeholder="e.g. Training Records, Internal Audit Reports, Waste Manifests" />
          </div>
          <div>
            <Label className="mb-1 block">Retention Period</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {RETENTION_PRESETS.map(p => (
                <button key={p.label} type="button"
                  onClick={() => handlePreset(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${form.retentionPeriod === p.label ? "bg-primary text-white border-primary" : "border-border hover:border-primary hover:text-primary"}`}
                  data-testid={`btn-preset-${p.label.replace(/\s+/g, "-").toLowerCase()}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={form.retentionPeriod} onChange={e => setForm(f => ({ ...f, retentionPeriod: e.target.value }))}
                placeholder="Custom label (e.g. Life of Product + 10 Years)" className="flex-1" />
              <Input value={form.retentionDays} onChange={e => setForm(f => ({ ...f, retentionDays: e.target.value }))}
                placeholder="Days (blank = Permanent)" className="w-36" type="number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Storage Location</Label>
              <Input value={form.storageLocation} onChange={e => setForm(f => ({ ...f, storageLocation: e.target.value }))}
                placeholder="e.g. Cloud – Server A, Fireproof Safe – HR" />
            </div>
            <div>
              <Label>Protection Method</Label>
              <Select value={form.protectionMethod} onValueChange={v => setForm(f => ({ ...f, protectionMethod: v }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {PROTECTION_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disposal Method</Label>
              <Select value={form.disposalMethod} onValueChange={v => setForm(f => ({ ...f, disposalMethod: v }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {DISPOSAL_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Confidentiality</Label>
              <Select value={form.confidentiality} onValueChange={v => setForm(f => ({ ...f, confidentiality: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Applicable Standards</Label>
            <div className="flex flex-wrap gap-2">
              {STANDARDS.map(s => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox checked={form.applicableStandards.includes(s)} onCheckedChange={() => toggleStandard(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes or references…" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending} data-testid="btn-save-register-entry">
            {mutation.isPending ? "Saving…" : isEdit ? "Update" : "Create Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Record Instance Modal ─────────────────────────────────────────────────────
function RecordInstanceModal({ open, onClose, register, instance }: {
  open: boolean; onClose: () => void;
  register: RecordRetentionEntry[];
  instance?: RecordInstance | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!instance;

  const [form, setForm] = useState({
    registerId: instance?.registerId?.toString() ?? "",
    recordName: instance?.recordName ?? "",
    description: instance?.description ?? "",
    medium: instance?.medium ?? "digital",
    physicalLocation: instance?.physicalLocation ?? "",
    storageRef: instance?.storageRef ?? "",
    uploadedBy: instance?.uploadedBy ?? "",
    uploadedAt: instance?.uploadedAt ? new Date(instance.uploadedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  });

  const selectedRegisterEntry = register.find(r => r.id === Number(form.registerId));

  const computeDisposalDate = (): string | null => {
    if (!selectedRegisterEntry?.retentionDays || !form.uploadedAt) return null;
    const d = new Date(form.uploadedAt);
    d.setDate(d.getDate() + selectedRegisterEntry.retentionDays);
    return d.toISOString();
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit
        ? apiRequest("PATCH", `/api/record-instances/${instance!.id}`, data)
        : apiRequest("POST", "/api/record-instances", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/record-instances"] });
      qc.invalidateQueries({ queryKey: ["/api/record-instances/overdue"] });
      qc.invalidateQueries({ queryKey: ["/api/record-audit-trail"] });
      toast({ title: isEdit ? "Record updated" : "Record added", description: form.recordName });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSave = () => {
    if (!form.registerId) return toast({ title: "Select a record type", variant: "destructive" });
    if (!form.recordName.trim()) return toast({ title: "Record name is required", variant: "destructive" });
    const disposalDueDate = computeDisposalDate();
    mutation.mutate({
      registerId: Number(form.registerId),
      recordName: form.recordName.trim(),
      description: form.description || null,
      medium: form.medium,
      physicalLocation: form.medium === "physical" ? form.physicalLocation || null : null,
      storageRef: form.storageRef || null,
      uploadedBy: form.uploadedBy || null,
      uploadedAt: new Date(form.uploadedAt).toISOString(),
      disposalDueDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            {isEdit ? "Edit Record" : "Add Record"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Record Type (from Register) *</Label>
            <Select value={form.registerId} onValueChange={v => setForm(f => ({ ...f, registerId: v }))}>
              <SelectTrigger data-testid="select-register-type"><SelectValue placeholder="Select record type…" /></SelectTrigger>
              <SelectContent>
                {register.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.recordType}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedRegisterEntry && (
              <p className="text-xs text-muted-foreground mt-1">
                Retention: {selectedRegisterEntry.retentionPeriod}
                {selectedRegisterEntry.retentionDays ? ` · Disposal date auto-calculated` : " · Permanent"}
              </p>
            )}
          </div>
          <div>
            <Label>Record Name / Description *</Label>
            <Input data-testid="input-record-name" value={form.recordName}
              onChange={e => setForm(f => ({ ...f, recordName: e.target.value }))}
              placeholder="e.g. John Doe – Forklift Certification 2024" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label className="mb-1 block">Medium</Label>
            <div className="flex gap-3">
              {(["digital", "physical"] as const).map(m => (
                <button key={m} type="button"
                  onClick={() => setForm(f => ({ ...f, medium: m }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.medium === m ? "bg-primary text-white border-primary" : "border-border hover:border-primary"}`}
                  data-testid={`btn-medium-${m}`}>
                  {m === "digital" ? <Database className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {form.medium === "physical" ? (
            <div>
              <Label>Physical Location</Label>
              <Input data-testid="input-physical-location" value={form.physicalLocation}
                onChange={e => setForm(f => ({ ...f, physicalLocation: e.target.value }))}
                placeholder="e.g. Warehouse A, Bin 4 · HR Office Cabinet 2" />
            </div>
          ) : (
            <div>
              <Label>Storage Reference</Label>
              <Input value={form.storageRef} onChange={e => setForm(f => ({ ...f, storageRef: e.target.value }))}
                placeholder="File path, SharePoint link, folder name…" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Uploaded / Filed By</Label>
              <Input value={form.uploadedBy} onChange={e => setForm(f => ({ ...f, uploadedBy: e.target.value }))}
                placeholder="Name or initials" />
            </div>
            <div>
              <Label>Record Date</Label>
              <Input type="date" value={form.uploadedAt} onChange={e => setForm(f => ({ ...f, uploadedAt: e.target.value }))} />
            </div>
          </div>
          {computeDisposalDate() && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-sm">
              <span className="font-medium text-amber-800 dark:text-amber-300">Calculated Disposal Date: </span>
              <span className="text-amber-700 dark:text-amber-400">{formatDate(computeDisposalDate())}</span>
              <span className="text-amber-600 dark:text-amber-500 ml-2 text-xs">(based on {selectedRegisterEntry?.retentionPeriod} from record date)</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending} data-testid="btn-save-record-instance">
            {mutation.isPending ? "Saving…" : isEdit ? "Update Record" : "Add Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dispose Dialog ────────────────────────────────────────────────────────────
function DisposeDialog({ open, onClose, instance }: { open: boolean; onClose: () => void; instance: RecordInstance }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [disposedBy, setDisposedBy] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/record-instances/${instance.id}`, {
      status: "disposed",
      disposedAt: new Date().toISOString(),
      disposedBy: disposedBy || "Unknown",
      disposalNotes: notes || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/record-instances"] });
      qc.invalidateQueries({ queryKey: ["/api/record-instances/overdue"] });
      qc.invalidateQueries({ queryKey: ["/api/record-audit-trail"] });
      toast({ title: "Record disposed", description: `Certificate of Disposal logged for: ${instance.recordName}` });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" /> Confirm Disposal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">This will mark the record as <strong>Disposed</strong> and generate a Certificate of Disposal in the Audit Trail.</p>
          <div className="rounded-md border p-3 bg-muted/40 text-sm">
            <p className="font-medium">{instance.recordName}</p>
          </div>
          <div>
            <Label>Authorized By *</Label>
            <Input value={disposedBy} onChange={e => setDisposedBy(e.target.value)} placeholder="Name of person authorizing disposal" data-testid="input-disposed-by" />
          </div>
          <div>
            <Label>Disposal Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Method used, confirmation details…" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending || !disposedBy.trim()} data-testid="btn-confirm-dispose">
            {mutation.isPending ? "Processing…" : "Confirm Disposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Master Retention Register Tab ────────────────────────────────────────────
function MasterRegisterPanel({ register, isLoading }: { register: RecordRetentionEntry[]; isLoading: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<RecordRetentionEntry | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/record-retention/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/record-retention"] });
      qc.invalidateQueries({ queryKey: ["/api/record-audit-trail"] });
      toast({ title: "Entry deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = register.filter(r =>
    r.recordType.toLowerCase().includes(search.toLowerCase()) ||
    (r.storageLocation ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading register…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search record types…" className="pl-8" data-testid="input-search-register" />
        </div>
        <Button onClick={() => { setEditEntry(null); setModalOpen(true); }} data-testid="btn-add-register-entry">
          <Plus className="w-4 h-4 mr-1.5" /> Add Record Type
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileBadge className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No record types defined yet</p>
            <p className="text-sm mt-1">Add your first record type to start building the Master Retention Register</p>
            <Button className="mt-4" onClick={() => { setEditEntry(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-1.5" /> Add First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Record Type</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Retention</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Storage Location</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Disposal</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Access</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Standards</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const conf = CONFIDENTIALITY_CONFIG[r.confidentiality as keyof typeof CONFIDENTIALITY_CONFIG] ?? CONFIDENTIALITY_CONFIG.general;
                const ConfIcon = conf.icon;
                return (
                  <tr key={r.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    data-testid={`row-register-${r.id}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.recordType}</div>
                      {r.notes && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{r.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.retentionDays ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                        <Clock className="w-3 h-3" />{r.retentionPeriod}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{r.storageLocation ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{r.disposalMethod ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${conf.color}`}>
                        <ConfIcon className="w-3 h-3" />{conf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(r.applicableStandards ?? []).map(s => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-muted text-xs">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => { setEditEntry(r); setModalOpen(true); }}
                          data-testid={`btn-edit-register-${r.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this register entry?")) deleteMutation.mutate(r.id); }}
                          data-testid={`btn-delete-register-${r.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RegisterEntryModal open={modalOpen} onClose={() => { setModalOpen(false); setEditEntry(null); }} entry={editEntry} />
    </div>
  );
}

// ─── Disposition Dashboard ─────────────────────────────────────────────────────
function DispositionPanel({ register }: { register: RecordRetentionEntry[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editInstance, setEditInstance] = useState<RecordInstance | null>(null);
  const [disposeTarget, setDisposeTarget] = useState<RecordInstance | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMedium, setFilterMedium] = useState<string>("all");

  const { data: instances = [], isLoading } = useQuery<RecordInstance[]>({ queryKey: ["/api/record-instances"] });
  const { data: overdue = [] } = useQuery<RecordInstance[]>({ queryKey: ["/api/record-instances/overdue"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/record-instances/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/record-instances"] });
      qc.invalidateQueries({ queryKey: ["/api/record-instances/overdue"] });
      qc.invalidateQueries({ queryKey: ["/api/record-audit-trail"] });
      toast({ title: "Record deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const logView = (inst: RecordInstance) => {
    apiRequest("POST", `/api/record-instances/${inst.id}/view`, { recordName: inst.recordName }).catch(() => {});
  };

  const filtered = instances.filter(inst => {
    const regEntry = register.find(r => r.id === inst.registerId);
    const matchSearch = inst.recordName.toLowerCase().includes(search.toLowerCase()) ||
      (regEntry?.recordType ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inst.status === filterStatus;
    const matchMedium = filterMedium === "all" || inst.medium === filterMedium;
    return matchSearch && matchStatus && matchMedium;
  });

  const activeCount = instances.filter(i => i.status === "active").length;
  const pendingCount = instances.filter(i => i.status === "pending_disposal").length;
  const disposedCount = instances.filter(i => i.status === "disposed").length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{activeCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Active Records</div>
          </CardContent>
        </Card>
        <Card className={`${overdue.length > 0 ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10" : "border-amber-200 dark:border-amber-800"}`}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${overdue.length > 0 ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>{overdue.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Overdue for Disposal</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{pendingCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Pending Disposal</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">{disposedCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Disposed (Certified)</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert banner */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm">{overdue.length} record{overdue.length !== 1 ? "s" : ""} past retention end date</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">These records have exceeded their retention period and require documented disposal per ISO 7.5.3.</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…" className="pl-8" data-testid="input-search-records" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_disposal">Pending Disposal</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMedium} onValueChange={setFilterMedium}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Media</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="physical">Physical</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditInstance(null); setAddOpen(true); }} data-testid="btn-add-record">
          <Plus className="w-4 h-4 mr-1.5" /> Add Record
        </Button>
      </div>

      {/* Records list */}
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading records…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No records found</p>
            {instances.length === 0 && <p className="text-sm mt-1">Add record instances to start tracking retention and disposition</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Record</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Medium</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Disposal Due</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Filed By / Date</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst, i) => {
                const regEntry = register.find(r => r.id === inst.registerId);
                const st = STATUS_CONFIG[inst.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;
                const daysLeft = daysUntil(inst.disposalDueDate);
                const isOverdue = daysLeft !== null && daysLeft < 0 && inst.status === "active";
                const isDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 90 && inst.status === "active";
                return (
                  <tr key={inst.id}
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${isOverdue ? "bg-red-50/60 dark:bg-red-900/10" : i % 2 === 0 ? "" : "bg-muted/10"}`}
                    data-testid={`row-record-${inst.id}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{inst.recordName}</div>
                      {inst.description && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{inst.description}</div>}
                      {inst.status === "disposed" && inst.disposedAt && (
                        <div className="text-xs text-muted-foreground mt-0.5">Disposed: {formatDate(inst.disposedAt)} by {inst.disposedBy}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{regEntry?.recordType ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${inst.medium === "digital" ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"}`}>
                        {inst.medium === "digital" ? <Database className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                        {inst.medium === "digital" ? "Digital" : "Physical"}
                      </span>
                      {inst.medium === "physical" && inst.physicalLocation && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />{inst.physicalLocation}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {inst.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : inst.status === "disposed" ? <Archive className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {inst.disposalDueDate ? (
                        <div>
                          <div className={`text-xs font-medium ${isOverdue ? "text-red-700 dark:text-red-400" : isDueSoon ? "text-amber-700 dark:text-amber-400" : "text-foreground"}`}>
                            {formatDate(inst.disposalDueDate)}
                          </div>
                          {inst.status === "active" && daysLeft !== null && (
                            <div className={`text-xs mt-0.5 ${isOverdue ? "text-red-600 font-semibold" : isDueSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
                            </div>
                          )}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">Permanent</span>}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                      {inst.uploadedBy && <div>{inst.uploadedBy}</div>}
                      <div>{formatDate(inst.uploadedAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Log view"
                          onClick={() => logView(inst)} data-testid={`btn-view-${inst.id}`}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => { setEditInstance(inst); setAddOpen(true); }}
                          data-testid={`btn-edit-record-${inst.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                        {inst.status !== "disposed" && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700"
                            title="Mark as disposed"
                            onClick={() => setDisposeTarget(inst)}
                            data-testid={`btn-dispose-${inst.id}`}><Archive className="w-3.5 h-3.5" /></Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this record entry?")) deleteMutation.mutate(inst.id); }}
                          data-testid={`btn-delete-record-${inst.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RecordInstanceModal open={addOpen} onClose={() => { setAddOpen(false); setEditInstance(null); }}
        register={register} instance={editInstance} />
      {disposeTarget && (
        <DisposeDialog open={!!disposeTarget} onClose={() => setDisposeTarget(null)} instance={disposeTarget} />
      )}
    </div>
  );
}

// ─── Audit Trail Panel ─────────────────────────────────────────────────────────
function AuditTrailPanel() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const { data: trail = [], isLoading } = useQuery<RecordAuditEntry[]>({ queryKey: ["/api/record-audit-trail"] });

  const ACTION_CONFIG: Record<string, { color: string; label: string }> = {
    created: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: "Created" },
    viewed: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", label: "Viewed" },
    modified: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", label: "Modified" },
    disposed: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", label: "Disposed" },
    deleted: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", label: "Deleted" },
  };

  const filtered = trail.filter(e => {
    const matchSearch = (e.details ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.performedBy ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "all" || e.action === filterAction;
    return matchSearch && matchAction;
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading audit trail…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trail…" className="pl-8" data-testid="input-search-trail" />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="modified">Modified</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} events</span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No audit events yet</p>
            <p className="text-sm mt-1">Events are logged automatically as records are created, viewed, modified, and disposed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Timestamp</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Action</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Details</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Performed By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const ac = ACTION_CONFIG[e.action] ?? { color: "bg-gray-100 text-gray-700", label: e.action };
                return (
                  <tr key={e.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    data-testid={`row-trail-${e.id}`}>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {e.timestamp ? new Date(e.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ac.color}`}>{ac.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">{e.details ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{e.performedBy ?? "System"}</td>
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

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function RecordControlTab() {
  const [subTab, setSubTab] = useState<"register" | "disposition" | "audit">("register");

  const { data: register = [], isLoading: regLoading } = useQuery<RecordRetentionEntry[]>({
    queryKey: ["/api/record-retention"],
  });

  const { data: overdue = [] } = useQuery<RecordInstance[]>({
    queryKey: ["/api/record-instances/overdue"],
  });

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-primary" /> Record Control
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">ISO 9001 / 14001 / 45001 Clause 7.5.3 — Documented Information Lifecycle Management</p>
        </div>
        {overdue.length > 0 && (
          <Badge variant="destructive" className="shrink-0 gap-1">
            <AlertTriangle className="w-3 h-3" />{overdue.length} overdue
          </Badge>
        )}
      </div>

      <Tabs value={subTab} onValueChange={v => setSubTab(v as any)}>
        <TabsList className="bg-white dark:bg-card border border-border/60 p-1 h-auto rounded-lg shadow-sm">
          <TabsTrigger value="register" className="text-xs h-7 px-3 data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5" data-testid="tab-record-register">
            <FileBadge className="w-3 h-3" /> Master Register
          </TabsTrigger>
          <TabsTrigger value="disposition" className="text-xs h-7 px-3 data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5 relative" data-testid="tab-record-disposition">
            <Archive className="w-3 h-3" /> Disposition
            {overdue.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{overdue.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs h-7 px-3 data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5" data-testid="tab-record-audit">
            <ScrollText className="w-3 h-3" /> Audit Trail
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {subTab === "register" && <MasterRegisterPanel register={register} isLoading={regLoading} />}
      {subTab === "disposition" && <DispositionPanel register={register} />}
      {subTab === "audit" && <AuditTrailPanel />}
    </div>
  );
}
