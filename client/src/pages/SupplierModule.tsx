import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Truck, Plus, Pencil, Trash2, ExternalLink, AlertTriangle, CheckCircle2,
  ShieldCheck, ClipboardList, BarChart3, Calendar, AlertCircle, Info,
  FileCheck, ChevronRight, ChevronDown, Star, Award, X, Phone, Mail,
  MapPin, FileText, Clock, ArrowUp, ArrowDown, ChevronsUpDown, UserCheck,
  Printer, Send,
} from "lucide-react";
import type { IsoProject } from "@shared/schema";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Supplier {
  id: number; userId: string; isoProjectId?: number | null;
  name: string; contactName?: string | null; email?: string | null;
  phone?: string | null; address?: string | null; category?: string | null;
  criticalityLevel?: string | null; status: string;
  isoCertUrl?: string | null; isoCertType?: string | null; isoCertExpiry?: string | null;
  reminderDaysBefore?: number | null; notes?: string | null;
  createdAt?: string | null; updatedAt?: string | null;
}
interface SupplierCriteria {
  id: number; userId: string; isoProjectId?: number | null;
  name: string; description?: string | null; category?: string | null;
  weight: number; order: number; createdAt?: string | null;
}
interface SupplierCandidateAssessment {
  id: number; userId: string; isoProjectId?: number | null;
  candidateName: string; assessmentDate: string; evaluatorName?: string | null;
  overallScore?: number | null; recommendation?: string | null; notes?: string | null;
  thresholds?: { approvalThreshold?: number; conditionalThreshold?: number } | null;
  scores?: Record<string, { criteriaId: number; name: string; category?: string | null; weight: number; score: number; contribution: number }> | null;
  createdAt?: string | null;
}
interface SupplierEvaluation {
  id: number; userId: string; isoProjectId?: number | null;
  supplierId: number; evaluationDate: string; evaluatorName?: string | null;
  period?: string | null; overallScore?: number | null;
  recommendation?: string | null; notes?: string | null;
  scores?: Record<string, Record<string, { value: number | string; score: number }>> | null;
  createdAt?: string | null;
}
interface SupplierAudit {
  id: number; userId: string; isoProjectId?: number | null;
  supplierId: number; riskLevel?: string | null; riskScore?: number | null;
  riskFactors?: Record<string, boolean> | null; recommendedFrequency?: string | null;
  lastAuditDate?: string | null; nextAuditDate?: string | null;
  auditStatus?: string | null; notes?: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysUntilExpiry(expiry?: string | null): number | null {
  if (!expiry) return null;
  const diff = new Date(expiry).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function certBadge(supplier: Supplier) {
  const days = daysUntilExpiry(supplier.isoCertExpiry);
  if (!supplier.isoCertType) return null;
  if (days === null) return <Badge className="text-sm bg-blue-50 text-blue-700 border-blue-200">{supplier.isoCertType}</Badge>;
  if (days < 0) return <Badge className="text-sm bg-red-100 text-red-700 border-red-200">{supplier.isoCertType} · Expired</Badge>;
  if (days <= 60) return <Badge className="text-sm bg-amber-100 text-amber-700 border-amber-200">{supplier.isoCertType} · {days}d left</Badge>;
  return <Badge className="text-sm bg-emerald-50 text-emerald-700 border-emerald-200">{supplier.isoCertType} ✓</Badge>;
}

const CRITICALITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  major:    "bg-amber-100 text-amber-700 border-amber-200",
  minor:    "bg-slate-100 text-slate-600 border-slate-200",
};
const STATUS_COLORS: Record<string, string> = {
  active:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  probationary: "bg-amber-50 text-amber-700 border-amber-200",
  inactive:     "bg-slate-100 text-slate-500 border-slate-200",
  disqualified: "bg-red-100 text-red-700 border-red-200",
};
const RISK_COLORS: Record<string, string> = {
  high:   "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-emerald-100 text-emerald-700",
};

function calcRiskScore(factors: Record<string, boolean>): number {
  let score = 0;
  if (factors.criticalPart)      score += 30;
  if (factors.recentNC)          score += 25;
  if (factors.noCert)            score += 20;
  if (factors.certExpiringSoon)  score += 15;
  if (factors.singleSource)      score += 15;
  if (factors.poorDelivery)      score += 20;
  if (factors.noRecentEval)      score += 15;
  if (factors.newSupplier)       score += 10;
  return Math.min(score, 100);
}

function scoreToRiskLevel(score: number): string {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function scoreToFrequency(score: number): string {
  if (score >= 60) return "Annual";
  if (score >= 30) return "Every 2 Years";
  return "Every 3 Years";
}


const CRITERIA_CATEGORIES = ["quality", "logistics", "financial", "technical", "compliance"];
const SUPPLIER_CATEGORIES = [
  "Raw Material", "Component / Part", "Sub-Assembly", "Packaging",
  "Tooling / Equipment", "Service Provider", "Chemical / Fluid", "Other",
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const SCORECARD_FREQUENCY_OPTIONS = [
  { value: "monthly",     label: "Monthly",      months: 1 },
  { value: "quarterly",   label: "Quarterly",    months: 3 },
  { value: "semi-annual", label: "Semi-Annual",  months: 6 },
  { value: "annual",      label: "Annual",       months: 12 },
];

function nextScorecardDue(lastDate: string | null | undefined, frequency: string | null | undefined): Date | null {
  if (!lastDate) return null;
  const opt = SCORECARD_FREQUENCY_OPTIONS.find(o => o.value === frequency) ?? SCORECARD_FREQUENCY_OPTIONS[1];
  const d = new Date(lastDate);
  d.setMonth(d.getMonth() + opt.months);
  return d;
}

function scorecardDueLabel(dueDate: Date | null): { label: string; cls: string } | null {
  if (!dueDate) return null;
  const days = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, cls: "bg-red-100 text-red-700 border-red-200" };
  if (days <= 14) return { label: `Due in ${days}d`, cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: `Due ${dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, cls: "bg-muted/60 text-muted-foreground border-border/50" };
}

const EMPTY_SUP: Partial<Supplier> = {
  name: "", contactName: "", email: "", phone: "", address: "",
  category: "", criticalityLevel: "minor", status: "active",
  isoCertUrl: "", isoCertType: "", isoCertExpiry: "", reminderDaysBefore: 30,
  scorecardFrequency: "quarterly", notes: "",
};

function SupplierForm({ initial, onSave, onCancel }: {
  initial: Partial<Supplier>; onSave: (d: Partial<Supplier>) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Supplier>>(initial);
  const set = (k: keyof Supplier) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-sm font-semibold">Supplier Name *</Label>
          <Input className="mt-1 h-8 text-base" value={form.name || ""} onChange={e => set("name")(e.target.value)} placeholder="e.g. Acme Supply Co." data-testid="input-supplier-name" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Contact Name</Label>
          <Input className="mt-1 h-8 text-base" value={form.contactName || ""} onChange={e => set("contactName")(e.target.value)} placeholder="John Smith" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Email</Label>
          <Input className="mt-1 h-8 text-base" value={form.email || ""} onChange={e => set("email")(e.target.value)} placeholder="contact@acme.com" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Phone</Label>
          <Input className="mt-1 h-8 text-base" value={form.phone || ""} onChange={e => set("phone")(e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Category</Label>
          <Select value={form.category || ""} onValueChange={set("category")}>
            <SelectTrigger className="mt-1 h-8 text-base"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{SUPPLIER_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Criticality</Label>
          <Select value={form.criticalityLevel || "minor"} onValueChange={set("criticalityLevel")}>
            <SelectTrigger className="mt-1 h-8 text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical — Directly affects product safety/quality</SelectItem>
              <SelectItem value="major">Major — Significant quality impact</SelectItem>
              <SelectItem value="minor">Minor — Low quality impact</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Status</Label>
          <Select value={form.status || "active"} onValueChange={set("status")}>
            <SelectTrigger className="mt-1 h-8 text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="probationary">Probationary</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Scorecard Frequency</Label>
        <Select value={form.scorecardFrequency || "quarterly"} onValueChange={set("scorecardFrequency")}>
          <SelectTrigger className="mt-1 h-8 text-base" data-testid="select-scorecard-frequency"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SCORECARD_FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-border/50 pt-3">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">ISO Certification</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Cert Type</Label>
            <Input className="mt-1 h-8 text-base" value={form.isoCertType || ""} onChange={e => set("isoCertType")(e.target.value)} placeholder="e.g. ISO 9001:2015, IATF 16949" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Expiry Date</Label>
            <Input type="date" className="mt-1 h-8 text-base" value={form.isoCertExpiry || ""} onChange={e => set("isoCertExpiry")(e.target.value)} data-testid="input-cert-expiry" />
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-semibold">Certificate URL (hyperlink to cert document)</Label>
            <Input className="mt-1 h-8 text-base" value={form.isoCertUrl || ""} onChange={e => set("isoCertUrl")(e.target.value)} placeholder="https://…" data-testid="input-cert-url" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Remind Me (days before expiry)</Label>
            <Input type="number" className="mt-1 h-8 text-base" value={form.reminderDaysBefore ?? 30} onChange={e => setForm(f => ({ ...f, reminderDaysBefore: parseInt(e.target.value) || 30 }))} min={1} max={365} />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Address / Location</Label>
        <Input className="mt-1 h-8 text-base" value={form.address || ""} onChange={e => set("address")(e.target.value)} placeholder="City, State, Country" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Notes</Label>
        <Textarea className="mt-1 text-base resize-none" rows={2} value={form.notes || ""} onChange={e => set("notes")(e.target.value)} placeholder="Any relevant notes…" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-cancel-supplier">Cancel</Button>
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={() => onSave(form)} disabled={!form.name?.trim()} data-testid="button-save-supplier">Save Supplier</Button>
      </div>
    </div>
  );
}

// ─── Tab 1: Approved Supplier List ──────────────────────────────────────────

function SupplierDetailPanel({ s, onEdit, onClose, onDelete, isSaving }: {
  s: Supplier;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  isSaving?: boolean;
}) {
  const days = daysUntilExpiry(s.isoCertExpiry);
  const certExpired = days !== null && days < 0;
  const certAlert = days !== null && days >= 0 && days <= (s.reminderDaysBefore ?? 60);

  return (
    <div className="border-t border-border/60 bg-muted/20 dark:bg-muted/10 px-4 py-4">
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-3xl">
        {/* Left column */}
        <div className="space-y-2.5">
          {s.contactName && (
            <div className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                <p className="text-sm text-primary font-medium">{s.contactName}</p>
              </div>
            </div>
          )}
          {s.email && (
            <div className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                <a href={`mailto:${s.email}`} className="text-sm text-blue-600 hover:underline">{s.email}</a>
              </div>
            </div>
          )}
          {s.phone && (
            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Phone</p>
                <p className="text-sm text-primary">{s.phone}</p>
              </div>
            </div>
          )}
          {s.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Location</p>
                <p className="text-sm text-primary">{s.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column — certification */}
        <div className="space-y-2.5">
          {s.isoCertType && (
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certification</p>
                <p className="text-sm text-primary font-medium">{s.isoCertType}</p>
                {s.isoCertExpiry && (
                  <p className={`text-sm mt-0.5 font-semibold ${certExpired ? "text-red-600" : certAlert ? "text-amber-600" : "text-emerald-600"}`}>
                    {certExpired
                      ? `EXPIRED — ${new Date(s.isoCertExpiry).toLocaleDateString()}`
                      : certAlert
                      ? `Expiring in ${days} days · ${new Date(s.isoCertExpiry).toLocaleDateString()}`
                      : `Valid through ${new Date(s.isoCertExpiry).toLocaleDateString()}`}
                  </p>
                )}
                {s.isoCertUrl && (
                  <a href={s.isoCertUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-0.5"
                    data-testid={`link-cert-detail-${s.id}`}>
                    <ExternalLink className="w-3 h-3" /> View Certificate
                  </a>
                )}
              </div>
            </div>
          )}
          {s.reminderDaysBefore && s.isoCertExpiry && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Reminder</p>
                <p className="text-sm text-muted-foreground">{s.reminderDaysBefore} days before expiry</p>
              </div>
            </div>
          )}
          {s.notes && (
            <div className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
        <Button size="sm" variant="outline" className="h-7 text-sm gap-1.5" onClick={onEdit} data-testid={`button-edit-supplier-${s.id}`}>
          <Pencil className="w-3 h-3" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-sm gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50" onClick={onDelete} data-testid={`button-delete-supplier-${s.id}`}>
          <Trash2 className="w-3 h-3" /> Remove
        </Button>
        <button onClick={onClose} className="ml-auto text-sm text-muted-foreground hover:text-foreground underline">Close</button>
      </div>
    </div>
  );
}

type AslSortField = "name" | "category" | "criticality" | "status" | "cert";

const CRITICALITY_ORDER: Record<string, number> = { critical: 0, major: 1, minor: 2 };
const STATUS_ORDER: Record<string, number> = { active: 0, probationary: 1, inactive: 2, disqualified: 3 };

function sortSuppliers(list: Supplier[], field: AslSortField, dir: "asc" | "desc"): Supplier[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (field === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (field === "category") {
      cmp = (a.category || "").localeCompare(b.category || "");
    } else if (field === "criticality") {
      cmp = (CRITICALITY_ORDER[a.criticalityLevel || "minor"] ?? 2) - (CRITICALITY_ORDER[b.criticalityLevel || "minor"] ?? 2);
    } else if (field === "status") {
      cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    } else if (field === "cert") {
      const da = daysUntilExpiry(a.isoCertExpiry) ?? 99999;
      const db_ = daysUntilExpiry(b.isoCertExpiry) ?? 99999;
      cmp = da - db_;
    }
    return cmp * factor;
  });
}

function SortHeader({ label, field, sortBy, sortDir, onSort }: {
  label: string; field: AslSortField;
  sortBy: AslSortField; sortDir: "asc" | "desc";
  onSort: (f: AslSortField) => void;
}) {
  const active = sortBy === field;
  return (
    <button
      className={`flex items-center gap-1 text-sm font-bold uppercase tracking-widest transition-colors ${active ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
      onClick={() => onSort(field)}
      data-testid={`sort-${field}`}
    >
      {label}
      {active
        ? sortDir === "asc"
          ? <ArrowUp className="w-3 h-3" />
          : <ArrowDown className="w-3 h-3" />
        : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

function ApprovedSupplierList({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<AslSortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: AslSortField) => {
    if (sortBy === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const qk = ["/api/suppliers", isoProjectId];
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: qk,
    queryFn: () => fetch(`/api/suppliers${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const createMut = useMutation({
    mutationFn: (d: Partial<Supplier>) => apiRequest("POST", "/api/suppliers", { ...d, isoProjectId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); setShowForm(false); toast({ title: "Supplier added" }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Partial<Supplier> }) => apiRequest("PATCH", `/api/suppliers/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); setEditing(null); toast({ title: "Supplier updated" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); setExpandedId(null); toast({ title: "Supplier removed" }); },
  });

  const filtered = sortSuppliers(
    suppliers.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.category || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.contactName || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || s.status === filterStatus;
      return matchSearch && matchStatus;
    }),
    sortBy, sortDir
  );

  const expiringCount = suppliers.filter(s => {
    const days = daysUntilExpiry(s.isoCertExpiry);
    return days !== null && days <= (s.reminderDaysBefore ?? 60) && days > 0;
  }).length;
  const expiredCount = suppliers.filter(s => {
    const days = daysUntilExpiry(s.isoCertExpiry);
    return days !== null && days < 0;
  }).length;

  const toggleRow = (id: number) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-3">
      {/* Alert bar */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-sm text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span><strong>{expiredCount}</strong> cert{expiredCount > 1 ? "s" : ""} expired — action required</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-sm text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span><strong>{expiringCount}</strong> cert{expiringCount > 1 ? "s" : ""} expiring within reminder window</span>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          className="h-8 text-base w-56"
          placeholder="Search by name, category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-suppliers"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-sm w-36" data-testid="select-filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="probationary">Probationary</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="disqualified">Disqualified</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filtered.length} of {suppliers.length}</span>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-8 text-sm" onClick={() => { setShowForm(true); setExpandedId(null); }} data-testid="button-add-supplier">
            <Plus className="w-3.5 h-3.5" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* Add / Edit form */}
      {(showForm || editing) && (
        <div className="border border-accent/30 rounded-xl p-4 bg-accent/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-primary">{editing ? `Edit — ${editing.name}` : "New Supplier"}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <SupplierForm
            initial={editing ?? EMPTY_SUP}
            onSave={d => editing ? updateMut.mutate({ id: editing.id, d }) : createMut.mutate(d)}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* List table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-base">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium">{search || filterStatus !== "all" ? "No suppliers match your filters" : "No suppliers yet"}</p>
          {!search && filterStatus === "all" && <p className="text-sm mt-1">Click "Add Supplier" to build your Approved Supplier List</p>}
        </div>
      ) : (
        <div className="border border-border/60 rounded-xl overflow-hidden bg-white dark:bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_90px_100px_130px_32px] gap-0 border-b border-border/60 bg-muted/40 px-4 py-2">
            <SortHeader label="Supplier" field="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortHeader label="Category" field="category" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortHeader label="Criticality" field="criticality" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <SortHeader label="ISO Cert" field="cert" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
            <span />
          </div>

          {/* Rows */}
          {filtered.map((s, idx) => {
            const days = daysUntilExpiry(s.isoCertExpiry);
            const certExpired = days !== null && days < 0;
            const certAlert = days !== null && days >= 0 && days <= (s.reminderDaysBefore ?? 60);
            const isExpanded = expandedId === s.id;
            const rowAlert = certExpired ? "bg-red-50/60 dark:bg-red-950/10" : certAlert ? "bg-amber-50/40 dark:bg-amber-950/10" : "";

            return (
              <div key={s.id} className={`border-b border-border/40 last:border-0 ${rowAlert}`} data-testid={`row-supplier-${s.id}`}>
                {/* Clickable row */}
                <button
                  className={`w-full grid grid-cols-[2fr_1fr_90px_100px_130px_32px] gap-0 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors ${isExpanded ? "bg-muted/20" : ""}`}
                  onClick={() => toggleRow(s.id)}
                  data-testid={`button-expand-supplier-${s.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-semibold text-primary truncate">{s.name}</span>
                    {(certExpired || certAlert) && (
                      <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${certExpired ? "text-red-500" : "text-amber-500"}`} />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center truncate">{s.category || "—"}</span>
                  <div className="flex items-center">
                    <Badge className={`text-sm border ${CRITICALITY_COLORS[s.criticalityLevel || "minor"]}`}>
                      {s.criticalityLevel || "minor"}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge className={`text-sm border ${STATUS_COLORS[s.status]}`}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center">
                    {s.isoCertType ? (
                      <span className={`text-sm font-medium ${certExpired ? "text-red-600" : certAlert ? "text-amber-600" : "text-emerald-600"}`}>
                        {certExpired ? "⚠ EXPIRED" : certAlert ? `⚠ ${days}d left` : "✓ " + s.isoCertType.split(":")[0]}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && !editing && (
                  <SupplierDetailPanel
                    s={s}
                    onEdit={() => setEditing(s)}
                    onClose={() => setExpandedId(null)}
                    onDelete={() => { if (confirm(`Remove ${s.name} from the ASL?`)) deleteMut.mutate(s.id); }}
                  />
                )}
                {isExpanded && editing?.id === s.id && (
                  <div className="border-t border-border/60 bg-muted/20 px-4 py-4">
                    <SupplierForm
                      initial={editing}
                      onSave={d => updateMut.mutate({ id: s.id, d })}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Selection Criteria ───────────────────────────────────────────────

// Parse "Score 10 = X; Score 1 = Y" patterns from description text
function parseScoreAnchors(desc: string | null | undefined): { high: string; low: string } | null {
  if (!desc) return null;
  const highMatch = desc.match(/[Ss]core\s*10\s*[=:]\s*([^;.]+)/);
  const lowMatch = desc.match(/[Ss]core\s*1\s*[=:]\s*([^;.]+)/);
  if (!highMatch && !lowMatch) return null;
  return {
    high: highMatch ? highMatch[1].trim() : "Meets all requirements",
    low: lowMatch ? lowMatch[1].trim() : "Does not meet requirements",
  };
}

// Strip the "Score X = Y" patterns from the description body for display
function cleanDescription(desc: string | null | undefined): string {
  if (!desc) return "";
  return desc.replace(/\s*[Ss]core\s*\d+\s*[=:][^;.]+[;.]?/g, "").trim();
}

// Score color helper for criteria candidate scoring
function criteriaScoreColor(s: number): string {
  return s >= 8 ? "text-emerald-600" : s >= 6 ? "text-amber-600" : s >= 4 ? "text-orange-500" : "text-red-600";
}

function SelectionCriteria({ isoProjectId, project }: { isoProjectId?: number; project?: IsoProject | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "quality", weight: 10 });
  const [showCandidate, setShowCandidate] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEvaluator, setCandidateEvaluator] = useState("");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<number | null>(null);
  const [candidateScores, setCandidateScores] = useState<Record<number, number>>({});
  const [approvalThreshold, setApprovalThreshold] = useState(project?.supplierApprovalSettings?.approvalThreshold ?? 75);
  const [conditionalThreshold, setConditionalThreshold] = useState(project?.supplierApprovalSettings?.conditionalThreshold ?? 55);

  useEffect(() => {
    setApprovalThreshold(project?.supplierApprovalSettings?.approvalThreshold ?? 75);
    setConditionalThreshold(project?.supplierApprovalSettings?.conditionalThreshold ?? 55);
  }, [project?.supplierApprovalSettings?.approvalThreshold, project?.supplierApprovalSettings?.conditionalThreshold]);

  const qk = ["/api/supplier-criteria", isoProjectId];
  const { data: criteria = [], isLoading } = useQuery<SupplierCriteria[]>({
    queryKey: qk,
    queryFn: () => fetch(`/api/supplier-criteria${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });
  const assessmentsQk = ["/api/supplier-candidate-assessments", isoProjectId];
  const { data: candidateAssessments = [] } = useQuery<SupplierCandidateAssessment[]>({
    queryKey: assessmentsQk,
    queryFn: () => fetch(`/api/supplier-candidate-assessments${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/supplier-criteria", { ...d, isoProjectId, order: criteria.length }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); setShowForm(false); setForm({ name: "", description: "", category: "quality", weight: 10 }); toast({ title: "Criteria added" }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: number; d: any }) => apiRequest("PATCH", `/api/supplier-criteria/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); setEditId(null); toast({ title: "Criteria updated" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/supplier-criteria/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: "Criteria removed" }); },
  });
  const saveCandidateMut = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/supplier-candidate-assessments", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assessmentsQk });
      setCandidateName("");
      setCandidateEvaluator("");
      setCandidateNotes("");
      setCandidateScores({});
      setShowCandidate(false);
      toast({ title: "Candidate assessment saved" });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message || "Could not save candidate assessment", variant: "destructive" });
    },
  });
  const deleteCandidateAssessmentMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/supplier-candidate-assessments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: assessmentsQk }); toast({ title: "Candidate assessment deleted" }); },
  });
  const updateThresholdsMut = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/iso-projects", {
      id: isoProjectId,
      supplierApprovalSettings: {
        approvalThreshold: Math.max(1, Math.min(100, approvalThreshold || 75)),
        conditionalThreshold: Math.max(1, Math.min(approvalThreshold - 1, conditionalThreshold || 55)),
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      qc.invalidateQueries({ queryKey: ["/api/iso-projects/all"] });
      toast({ title: "Approval thresholds saved" });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e.message || "Could not save approval thresholds", variant: "destructive" });
    },
  });

  const totalWeight = criteria.reduce((s, c) => s + (c.weight || 0), 0);
  const byCategory = CRITERIA_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = criteria.filter(c => c.category === cat);
    return acc;
  }, {} as Record<string, SupplierCriteria[]>);

  // Candidate scoring calculations
  const candidateOverall = (() => {
    if (!criteria.length || !totalWeight) return 0;
    let weighted = 0;
    for (const c of criteria) {
      const score = candidateScores[c.id] ?? 0;
      weighted += (score / 10) * (c.weight / totalWeight) * 100;
    }
    return Math.round(weighted);
  })();
  const effectiveApprovalThreshold = Math.max(1, Math.min(100, approvalThreshold || 75));
  const effectiveConditionalThreshold = Math.max(1, Math.min(effectiveApprovalThreshold - 1, conditionalThreshold || 55));
  const candidateReco = candidateOverall >= effectiveApprovalThreshold ? "approved"
    : candidateOverall >= effectiveConditionalThreshold ? "conditional"
    : "rejected";
  const CANDIDATE_RECO: Record<string, { label: string; style: string; note: string }> = {
    approved:    { label: "✓ Approved for ASL", style: "bg-emerald-100 text-emerald-800 border-emerald-200", note: `Score ≥ ${effectiveApprovalThreshold} — Proceed to ASL approval` },
    conditional: { label: "⚠ Conditional — Clarification Needed", style: "bg-amber-100 text-amber-700 border-amber-200", note: `Score ${effectiveConditionalThreshold}–${effectiveApprovalThreshold - 1} — Supplier must address gaps before approval` },
    rejected:    { label: "✗ Not Qualified", style: "bg-red-100 text-red-700 border-red-200", note: `Score < ${effectiveConditionalThreshold} — Does not meet pre-qualification threshold` },
  };

  const buildCandidateScoresPayload = () => {
    const out: Record<string, { criteriaId: number; name: string; category?: string | null; weight: number; score: number; contribution: number }> = {};
    for (const c of criteria) {
      const score = candidateScores[c.id] ?? 0;
      if (score <= 0) continue;
      out[String(c.id)] = {
        criteriaId: c.id,
        name: c.name,
        category: c.category,
        weight: c.weight || 0,
        score,
        contribution: totalWeight > 0 ? Math.round((score / 10) * (c.weight / totalWeight) * 100 * 10) / 10 : 0,
      };
    }
    return out;
  };

  const DEFAULT_CRITERIA = [
    { name: "ISO / IATF Certification Held", description: "Supplier holds a valid, accredited ISO 9001:2015 or IATF 16949:2016 certificate. Verify against IAF-accredited CB registry before approval. Score 10 = active cert in good standing; Score 1 = no certification held.", category: "quality", weight: 20 },
    { name: "Completed Supplier Quality Questionnaire (SQQ)", description: "Supplier has returned a fully completed SQQ covering QMS, process controls, calibration, and non-conforming material handling. Score 10 = all sections satisfactorily completed; Score 1 = no response received.", category: "quality", weight: 20 },
    { name: "First Article / Sample Qualification Results", description: "Submitted samples or first article inspection (FAI) results meet CCI Chemical product specification. Score 10 = all characteristics pass on first submission; Score 1 = critical failures with no path to correction.", category: "technical", weight: 20 },
    { name: "Financial Stability & Business Continuity", description: "Supplier provides D&B credit report, bank reference, or equivalent plus a documented business continuity plan. Score 10 = strong financials and complete BCP; Score 1 = no financial documentation provided.", category: "financial", weight: 15 },
    { name: "Regulatory & Compliance Documentation", description: "Supplier provides current SDS sheets, REACH/RoHS declarations, and FMVSS 116 supporting data before first shipment. Score 10 = all required docs received and current; Score 1 = none provided.", category: "compliance", weight: 15 },
    { name: "Technical Capability & Capacity Assessment", description: "Supplier demonstrates lab capability, process controls, and capacity via questionnaire or remote audit. Score 10 = fully capable and confirmed; Score 1 = cannot meet specification or volume requirements.", category: "technical", weight: 10 },
  ];

  return (
    <div className="space-y-4">
      {/* Contextual info banner */}
      <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5">Pre-qualification criteria — for evaluating NEW supplier candidates</p>
          <p className="leading-relaxed text-blue-600/90 dark:text-blue-400/80">
            These criteria define what to verify before approving a supplier. Each criterion is scored <strong>1–10</strong> (anchors shown on each card below).
            The weighted total determines qualification: <strong>≥{effectiveApprovalThreshold} = Approved</strong>, {effectiveConditionalThreshold}–{effectiveApprovalThreshold - 1} = Conditional, &lt;{effectiveConditionalThreshold} = Not Qualified.
            Use <strong>"Score a Candidate"</strong> to run a live evaluation. For ongoing active-supplier performance, use the <strong>Evaluations tab</strong>.
          </p>
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-bold text-primary">
              Total Weight: <span className={totalWeight === 100 ? "text-emerald-600" : "text-amber-600"}>{totalWeight}%</span>
            </p>
            <p className="text-sm text-muted-foreground">Must total 100% for accurate scoring</p>
          </div>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Approved ≥</Label>
            <Input type="number" min={1} max={100} className="h-8 w-20 text-base mt-1"
              value={approvalThreshold}
              onChange={e => setApprovalThreshold(parseInt(e.target.value) || 75)}
              data-testid="input-approval-threshold" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Conditional ≥</Label>
            <Input type="number" min={1} max={99} className="h-8 w-20 text-base mt-1"
              value={conditionalThreshold}
              onChange={e => setConditionalThreshold(parseInt(e.target.value) || 55)}
              data-testid="input-conditional-threshold" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-sm"
            onClick={() => updateThresholdsMut.mutate()}
            disabled={effectiveConditionalThreshold >= effectiveApprovalThreshold || updateThresholdsMut.isPending}
            data-testid="button-save-approval-thresholds">
            {updateThresholdsMut.isPending ? "Saving…" : "Save Thresholds"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {criteria.length === 0 && (
            <Button variant="outline" size="sm" className="h-8 text-sm gap-1" onClick={() => {
              DEFAULT_CRITERIA.forEach((c, i) => createMut.mutate({ ...c, order: i }));
            }} data-testid="button-load-defaults">
              <Star className="w-3 h-3" /> Load Defaults
            </Button>
          )}
          {criteria.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 text-sm gap-1.5 border-accent/40 text-accent hover:bg-accent/5"
              onClick={() => { setShowCandidate(c => !c); setCandidateScores({}); setCandidateEvaluator(""); setCandidateNotes(""); }}
              data-testid="button-score-candidate">
              <UserCheck className="w-3.5 h-3.5" /> {showCandidate ? "Close" : "Score a Candidate"}
            </Button>
          )}
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-8 text-sm" onClick={() => setShowForm(true)} data-testid="button-add-criteria">
            <Plus className="w-3.5 h-3.5" /> Add Criteria
          </Button>
        </div>
      </div>

      {/* ── CANDIDATE SCORING PANEL ── */}
      {showCandidate && criteria.length > 0 && (
        <div className="border-2 border-accent/30 rounded-xl bg-accent/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
            <div>
              <p className="text-base font-bold text-primary">Pre-Qualification Candidate Evaluation</p>
              <p className="text-sm text-muted-foreground">Score this candidate against each criterion (1 = Poor, 10 = Excellent)</p>
            </div>
            <button onClick={() => setShowCandidate(false)} data-testid="button-close-candidate">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Candidate name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold">Candidate Supplier Name *</Label>
              <Input className="mt-1 h-8 text-base" placeholder="e.g. Acme Chemical Corp." value={candidateName}
                onChange={e => setCandidateName(e.target.value)} data-testid="input-candidate-name" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Evaluator</Label>
              <Input className="mt-1 h-8 text-base" placeholder="e.g. Raul Villarreal" value={candidateEvaluator}
                onChange={e => setCandidateEvaluator(e.target.value)} data-testid="input-candidate-evaluator" />
            </div>
            </div>

            {/* Per-criterion scoring */}
            <div className="space-y-2.5">
              {criteria.map(c => {
                const score = candidateScores[c.id] ?? 0;
                const anchors = parseScoreAnchors(c.description);
                const pct = (score / 10) * 100;
                const contribution = totalWeight > 0
                  ? Math.round((score / 10) * (c.weight / totalWeight) * 100 * 10) / 10
                  : 0;
                return (
                  <div key={c.id} className="border border-border/60 rounded-xl p-3 bg-white dark:bg-card" data-testid={`candidate-score-${c.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-primary">{c.name}</span>
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20 border">{c.weight}% weight</Badge>
                        </div>
                        {/* Scoring anchors */}
                        {anchors ? (
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-14 shrink-0 font-semibold text-emerald-600">Score 10:</span>
                              <span className="text-muted-foreground">{anchors.high}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-14 shrink-0 font-semibold text-red-500">Score 1:</span>
                              <span className="text-muted-foreground">{anchors.low}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                            <span className="text-emerald-600 font-semibold">10 = Fully meets requirement</span>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="text-red-500 font-semibold">1 = Does not meet requirement</span>
                          </div>
                        )}
                      </div>

                      {/* Score input */}
                      <div className="flex flex-col items-center gap-1 shrink-0 min-w-[120px]">
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="range" min={0} max={10} step={1}
                            value={score}
                            onChange={e => setCandidateScores(s => ({ ...s, [c.id]: parseInt(e.target.value) }))}
                            className="flex-1 accent-orange-500"
                            data-testid={`slider-candidate-${c.id}`}
                          />
                          <span className={`w-6 text-center text-base font-black ${score === 0 ? "text-muted-foreground/40" : criteriaScoreColor(score)}`}>
                            {score === 0 ? "–" : score}
                          </span>
                        </div>
                        {score > 0 && (
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${score >= 8 ? "bg-emerald-400" : score >= 6 ? "bg-amber-400" : score >= 4 ? "bg-orange-400" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                        {score > 0 && <p className="text-xs text-muted-foreground">+{contribution} pts</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall score summary */}
            <div className="flex items-center gap-5 bg-white dark:bg-card border border-border/60 rounded-xl p-4 flex-wrap">
              <div className="text-center min-w-[64px]">
                <p className={`text-4xl font-black ${candidateOverall >= effectiveApprovalThreshold ? "text-emerald-600" : candidateOverall >= effectiveConditionalThreshold ? "text-amber-600" : candidateOverall > 0 ? "text-red-600" : "text-muted-foreground/30"}`}>
                  {candidateOverall > 0 ? candidateOverall : "—"}
                </p>
                <p className="text-sm text-muted-foreground">/ 100</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                {candidateOverall > 0 && (
                  <>
                    <Badge className={`text-sm border px-2.5 py-1 ${CANDIDATE_RECO[candidateReco].style}`}>
                      {CANDIDATE_RECO[candidateReco].label}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{CANDIDATE_RECO[candidateReco].note}</p>
                  </>
                )}
                {candidateOverall === 0 && <p className="text-sm text-muted-foreground">Score each criterion above to see the result</p>}
              </div>
              <div className="ml-auto">
                {candidateName && candidateOverall > 0 && (
                  <p className="text-sm text-muted-foreground">Candidate: <span className="font-semibold text-primary">{candidateName}</span></p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Assessment Notes</Label>
              <Textarea className="mt-1 text-base resize-none" rows={2} value={candidateNotes}
                onChange={e => setCandidateNotes(e.target.value)}
                placeholder="Document evidence reviewed, gaps, conditions, or next steps for approval."
                data-testid="textarea-candidate-notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCandidate(false)} data-testid="button-cancel-candidate-assessment">Cancel</Button>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5"
                disabled={!candidateName.trim() || candidateOverall <= 0 || saveCandidateMut.isPending}
                onClick={() => saveCandidateMut.mutate({
                  isoProjectId,
                  candidateName: candidateName.trim(),
                  assessmentDate: new Date().toISOString().split("T")[0],
                  evaluatorName: candidateEvaluator.trim() || undefined,
                  overallScore: candidateOverall,
                  recommendation: candidateReco,
                  thresholds: {
                    approvalThreshold: effectiveApprovalThreshold,
                    conditionalThreshold: effectiveConditionalThreshold,
                  },
                  notes: candidateNotes.trim() || undefined,
                  scores: buildCandidateScoresPayload(),
                })}
                data-testid="button-save-candidate-assessment">
                <FileCheck className="w-3.5 h-3.5" /> {saveCandidateMut.isPending ? "Saving…" : "Save Assessment Record"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-3">
          <h3 className="text-base font-bold text-primary">New Selection Criteria</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-sm font-semibold">Criteria Name *</Label>
              <Input className="mt-1 h-8 text-base" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. ISO Certification" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 h-8 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>{CRITERIA_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold">Weight (%)</Label>
              <Input type="number" className="mt-1 h-8 text-base" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseInt(e.target.value) || 0 }))} min={1} max={100} />
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea className="mt-1 text-base resize-none" rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={`What does this criterion measure?\n\nTip: include scoring anchors like "Score 10 = fully certified; Score 1 = no documentation"`} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={() => createMut.mutate(form)} disabled={!form.name.trim()}>Add</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-base text-muted-foreground">Loading…</div>
      ) : criteria.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium">No selection criteria defined</p>
          <p className="text-sm mt-1">Add criteria or click "Load Defaults" to use recommended criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {CRITERIA_CATEGORIES.filter(cat => byCategory[cat]?.length > 0).map(cat => (
            <div key={cat}>
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5 ml-1">{cat}</p>
              <div className="space-y-2">
                {byCategory[cat].map(c => {
                  const anchors = parseScoreAnchors(c.description);
                  const body = cleanDescription(c.description);
                  return (
                    <div key={c.id} className="border border-border/60 rounded-xl p-3.5 bg-white dark:bg-card" data-testid={`criteria-${c.id}`}>
                      {editId === c.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input className="h-7 text-sm" defaultValue={c.name} id={`edit-name-${c.id}`} />
                            <Input type="number" className="h-7 text-sm" defaultValue={c.weight} id={`edit-weight-${c.id}`} min={1} max={100} />
                          </div>
                          <Textarea className="text-sm resize-none" rows={3} defaultValue={c.description || ""} id={`edit-desc-${c.id}`} />
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-sm bg-accent hover:bg-accent/90 text-white" onClick={() => {
                              const name = (document.getElementById(`edit-name-${c.id}`) as HTMLInputElement)?.value;
                              const weight = parseInt((document.getElementById(`edit-weight-${c.id}`) as HTMLInputElement)?.value);
                              const description = (document.getElementById(`edit-desc-${c.id}`) as HTMLTextAreaElement)?.value;
                              updateMut.mutate({ id: c.id, d: { name, weight, description } });
                            }}>Save</Button>
                            <Button variant="outline" size="sm" className="h-7 text-sm" onClick={() => setEditId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Header row */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-base font-bold text-primary">{c.name}</span>
                              <Badge className="text-sm bg-primary/10 text-primary border-primary/20 border">{c.weight}%</Badge>
                            </div>

                            {/* Weight bar */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden w-32">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(c.weight, 100)}%` }} />
                              </div>
                              <span className="text-sm text-muted-foreground">{c.weight}% of total score</span>
                            </div>

                            {/* Body description (anchors stripped out) */}
                            {body && <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{body}</p>}

                            {/* Scoring anchors — shown prominently */}
                            {anchors && (
                              <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-border/50 text-sm mt-1">
                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 border-r border-border/50">
                                  <p className="font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">Score 10 — Excellent</p>
                                  <p className="text-emerald-600/80 dark:text-emerald-500/80 leading-snug">{anchors.high}</p>
                                </div>
                                <div className="flex-1 bg-red-50 dark:bg-red-950/20 px-3 py-2">
                                  <p className="font-bold text-red-600 dark:text-red-400 mb-0.5">Score 1 — Does Not Meet</p>
                                  <p className="text-red-500/80 dark:text-red-500/80 leading-snug">{anchors.low}</p>
                                </div>
                              </div>
                            )}

                            {/* Scale indicator */}
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/50">
                              <span>1</span>
                              <div className="flex-1 h-px bg-gradient-to-r from-red-300 via-amber-300 to-emerald-300 rounded-full opacity-60" />
                              <span>10</span>
                              <span className="ml-1">Scored 1–10</span>
                            </div>
                          </div>

                          <div className="flex gap-1 shrink-0 mt-0.5">
                            <button onClick={() => setEditId(c.id)} className="p-1.5 rounded hover:bg-muted" data-testid={`button-edit-criteria-${c.id}`}>
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => { if (confirm("Remove this criteria?")) deleteMut.mutate(c.id); }} className="p-1.5 rounded hover:bg-red-50" data-testid={`button-delete-criteria-${c.id}`}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {candidateAssessments.length > 0 && (
        <div className="border border-border/60 rounded-xl overflow-hidden bg-white dark:bg-card">
          <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
            <p className="text-base font-bold text-primary">Saved Candidate Assessment Records</p>
            <p className="text-sm text-muted-foreground">Pre-qualification decisions completed before adding a supplier to the ASL</p>
          </div>
          <div className="divide-y divide-border/50">
            {candidateAssessments.map(a => {
              const expanded = expandedAssessmentId === a.id;
              const reco = a.recommendation || "rejected";
              const score = a.overallScore ?? 0;
              return (
                <div key={a.id} className="px-4 py-3" data-testid={`candidate-assessment-${a.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <button className="flex items-center gap-2 text-left flex-1 min-w-0"
                      onClick={() => setExpandedAssessmentId(expanded ? null : a.id)}
                      data-testid={`button-expand-candidate-assessment-${a.id}`}>
                      {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div className="min-w-0">
                        <p className="text-base font-bold text-primary truncate">{a.candidateName}</p>
                        <p className="text-sm text-muted-foreground">{a.assessmentDate} {a.evaluatorName ? `· ${a.evaluatorName}` : ""}</p>
                        <p className="text-xs text-muted-foreground">Policy used: Approved ≥{a.thresholds?.approvalThreshold ?? 75} · Conditional ≥{a.thresholds?.conditionalThreshold ?? 55}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-black ${score >= 75 ? "text-emerald-600" : score >= 55 ? "text-amber-600" : "text-red-600"}`}>{score}</p>
                      <Badge className={`text-sm border ${CANDIDATE_RECO[reco]?.style ?? CANDIDATE_RECO.rejected.style}`}>{CANDIDATE_RECO[reco]?.label ?? reco}</Badge>
                    </div>
                  </div>
                  {expanded && (
                    <div className="mt-3 pl-6 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.values(a.scores ?? {}).map(s => (
                          <div key={s.criteriaId} className="border border-border/50 rounded-lg p-2 bg-muted/10">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-primary">{s.name}</p>
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20 border">{s.weight}%</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Score: <span className={criteriaScoreColor(s.score)}>{s.score}/10</span> · Contribution: {s.contribution} pts</p>
                          </div>
                        ))}
                      </div>
                      {a.notes && <p className="text-sm text-muted-foreground italic border-t border-border/40 pt-2">{a.notes}</p>}
                      <div className="flex justify-end">
                        <button onClick={() => { if (confirm("Delete this candidate assessment?")) deleteCandidateAssessmentMut.mutate(a.id); }}
                          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"
                          data-testid={`button-delete-candidate-assessment-${a.id}`}>
                          <Trash2 className="w-3 h-3" /> Delete Record
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── IATF 16949 Scorecard Definition ─────────────────────────────────────────
// Based on IATF 16949:2016 clauses 8.4.1 and 8.4.2.4

type MetricType = "number" | "slider" | "select";
interface SelectOption { value: string; label: string; score: number }
interface ScorecardMetric {
  id: string; label: string; description: string; iatfNote?: string;
  type: MetricType; unit?: string; placeholder?: string;
  toScore: (v: number | string) => number;
  options?: SelectOption[];
  iatfHighlight?: boolean;
  iatfOnly?: boolean;
  goodDirection?: "lower" | "higher";
}
interface ScorecardCategory {
  id: string; label: string; weight: number; iatfClause: string;
  color: string; metrics: ScorecardMetric[];
  iatfOnly?: boolean;
}

const IATF_SCORECARD: ScorecardCategory[] = [
  {
    id: "incoming_quality", label: "Incoming Quality", weight: 30,
    iatfClause: "§8.4.1 — delivered part quality performance",
    color: "blue",
    metrics: [
      {
        id: "ppm", label: "Incoming Defect PPM", unit: "PPM",
        description: "Parts per million defective at CCI Chemical's receiving inspection",
        iatfNote: "Clause 8.4.1 — delivered part quality performance (IATF required)",
        type: "number", placeholder: "e.g. 450", goodDirection: "lower",
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n <= 100 ? 9 : n <= 300 ? 8 : n <= 500 ? 7 : n <= 750 ? 6 : n <= 1000 ? 5 : n <= 1500 ? 4 : n <= 2000 ? 3 : n <= 3000 ? 2 : 1; },
      },
      {
        id: "lot_reject_rate", label: "Shipment / Lot Reject Rate", unit: "%",
        description: "Percentage of received shipments or lots failing CCI's incoming inspection",
        type: "number", placeholder: "e.g. 2.5", goodDirection: "lower",
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n <= 1 ? 9 : n <= 2 ? 8 : n <= 3 ? 7 : n <= 5 ? 6 : n <= 7 ? 5 : n <= 10 ? 4 : n <= 15 ? 3 : n <= 20 ? 2 : 1; },
      },
      {
        id: "lab_retest", label: "Lab Retest / Re-inspection Events", unit: "events",
        description: "Count of lots requiring retest due to specification concerns or out-of-spec COA values",
        type: "number", placeholder: "e.g. 0", goodDirection: "lower",
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n === 1 ? 8 : n === 2 ? 6 : n === 3 ? 4 : n <= 5 ? 2 : 1; },
      },
    ],
  },
  {
    id: "delivery_performance", label: "Delivery Performance", weight: 25,
    iatfClause: "§8.4.1 — delivery schedule performance",
    color: "violet",
    metrics: [
      {
        id: "otd_pct", label: "On-Time Delivery (OTD) %", unit: "%",
        description: "Percentage of purchase orders received on or before CCI Chemical's requested delivery date",
        iatfNote: "Clause 8.4.1 — delivery schedule performance (IATF required)",
        type: "number", placeholder: "e.g. 97.2", goodDirection: "higher",
        toScore: (v) => { const n = Number(v); return n >= 100 ? 10 : n >= 99 ? 9 : n >= 98 ? 8 : n >= 97 ? 7 : n >= 95 ? 6 : n >= 93 ? 5 : n >= 90 ? 4 : n >= 85 ? 3 : n >= 80 ? 2 : 1; },
      },
      {
        id: "premium_freight", label: "Premium Freight Incidents", unit: "incidents",
        description: "Number of times CCI paid premium/expedite freight costs because supplier missed schedule",
        iatfNote: "Clause 8.4.1 — incidents of premium freight (IATF-specific requirement)",
        type: "number", placeholder: "e.g. 0", goodDirection: "lower", iatfHighlight: true, iatfOnly: true,
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n === 1 ? 7 : n === 2 ? 5 : n === 3 ? 3 : 1; },
      },
      {
        id: "fill_rate", label: "Fill Rate / Complete Shipments", unit: "%",
        description: "Percentage of order lines shipped complete — no partial or short shipments",
        type: "number", placeholder: "e.g. 100", goodDirection: "higher",
        toScore: (v) => { const n = Number(v); return n >= 100 ? 10 : n >= 99 ? 8 : n >= 97 ? 7 : n >= 95 ? 6 : n >= 90 ? 4 : 2; },
      },
    ],
  },
  {
    id: "customer_impact", label: "Customer Disruptions & Impact", weight: 20,
    iatfClause: "§8.4.1 — customer disruptions incl. field returns",
    color: "red", iatfOnly: true,
    metrics: [
      {
        id: "line_stops", label: "Customer Line Stops / Plant Shutdowns", unit: "events",
        description: "Number of production line stops or plant shutdowns at CCI Chemical caused by supplier-responsible material failures",
        iatfNote: "Clause 8.4.1 — customer disruptions (IATF-specific requirement)",
        type: "number", placeholder: "e.g. 0", goodDirection: "lower", iatfHighlight: true, iatfOnly: true,
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n === 1 ? 4 : 1; },
      },
      {
        id: "warranty_returns", label: "Warranty / Field Returns (Supplier-Responsible)", unit: "events",
        description: "Warranty or field return events traceable to this supplier's material or components during the evaluation period",
        iatfNote: "Clause 8.4.1 — field returns; Clause 8.4.1.2 — automotive warranty management",
        type: "number", placeholder: "e.g. 0", goodDirection: "lower", iatfHighlight: true, iatfOnly: true,
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n === 1 ? 7 : n === 2 ? 5 : n === 3 ? 3 : 1; },
      },
      {
        id: "dock_holds", label: "Dock / Yard Holds", unit: "holds",
        description: "Number of times incoming material was quarantined or placed on hold at CCI receiving pending final disposition",
        iatfNote: "Material quarantine / yard hold events — supply chain containment indicator",
        type: "number", placeholder: "e.g. 0", goodDirection: "lower", iatfHighlight: true, iatfOnly: true,
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n === 1 ? 7 : n === 2 ? 4 : 1; },
      },
    ],
  },
  {
    id: "capa_responsiveness", label: "CAPA & Responsiveness", weight: 15,
    iatfClause: "§8.4.2.4 — supplier monitoring",
    color: "amber",
    metrics: [
      {
        id: "response_time_days", label: "8D / SCAR Initial Response Time (avg)", unit: "days",
        description: "Average calendar days for supplier to submit their initial 8D or Supplier Corrective Action Request (SCAR) response",
        iatfNote: "Clause 8.4.2.4 — supplier monitoring & corrective action",
        type: "number", placeholder: "e.g. 3", goodDirection: "lower",
        toScore: (v) => { const n = Number(v); return n <= 1 ? 10 : n <= 3 ? 8 : n <= 5 ? 6 : n <= 7 ? 4 : n <= 14 ? 2 : 1; },
      },
      {
        id: "ca_effectiveness", label: "Corrective Action Effectiveness (1–10)", unit: "/ 10",
        description: "Assessor's judgment of the depth, thoroughness, and sustained effectiveness of supplier corrective actions",
        type: "slider", goodDirection: "higher",
        toScore: (v) => Number(v),
      },
      {
        id: "ppap_on_time", label: "PPAP / Documentation On-Time %", unit: "%",
        description: "Percentage of required PPAP submissions, certification renewals, or compliance documents received by CCI's due date",
        type: "number", placeholder: "e.g. 100", goodDirection: "higher", iatfOnly: true,
        toScore: (v) => { const n = Number(v); return n >= 100 ? 10 : n >= 95 ? 8 : n >= 90 ? 6 : n >= 80 ? 4 : 2; },
      },
    ],
  },
  {
    id: "quality_system", label: "Quality System Status", weight: 10,
    iatfClause: "§8.4.2.4 — supplier monitoring",
    color: "emerald",
    metrics: [
      {
        id: "cert_status", label: "Certification Status",
        description: "Current standing of the supplier's ISO 9001:2015 or IATF 16949:2016 certification",
        type: "select",
        options: [
          { value: "current", label: "Current — cert in good standing", score: 10 },
          { value: "expiring", label: "Expiring within 90 days — renewal in progress", score: 7 },
          { value: "scope_change", label: "Scope under change — re-audit pending", score: 5 },
          { value: "suspended", label: "Suspended — under CB surveillance", score: 2 },
          { value: "lapsed", label: "Lapsed — certificate expired", score: 1 },
          { value: "none", label: "Not certified", score: 1 },
        ],
        toScore: () => 0,
      },
      {
        id: "special_status", label: "Special Status / Controlled Shipping",
        description: "Any active customer-imposed or self-imposed special quality or shipping status",
        iatfNote: "Clause 8.4.1 — special status customer notifications (IATF-specific requirement)",
        type: "select", iatfHighlight: true, iatfOnly: true,
        options: [
          { value: "none", label: "None — no special status active", score: 10 },
          { value: "new_supplier", label: "New Supplier Designation (enhanced surveillance)", score: 6 },
          { value: "cs1", label: "Controlled Shipping Level 1 (CS1)", score: 4 },
          { value: "cs2", label: "Controlled Shipping Level 2 — third-party sorting", score: 2 },
          { value: "srea", label: "SREA Active (Supplier Remediation & Escalation)", score: 1 },
          { value: "q1_revoked", label: "Q1 / Preferred Status Revoked", score: 1 },
        ],
        toScore: () => 0,
      },
      {
        id: "audit_findings", label: "Major NC Count (Last Audit)", unit: "major NCs",
        description: "Number of major non-conformances identified during last internal or 2nd-party supplier audit",
        type: "number", placeholder: "e.g. 0", goodDirection: "lower",
        toScore: (v) => { const n = Number(v); return n === 0 ? 10 : n === 1 ? 7 : n === 2 ? 5 : n === 3 ? 3 : 1; },
      },
    ],
  },
];

// Return the scorecard appropriate for the project's standard.
// IATF clients see all categories + metrics; ISO 9001 / other clients
// see only metrics that are not flagged iatfOnly.
function getActiveScorecard(isIATF: boolean): ScorecardCategory[] {
  if (isIATF) return IATF_SCORECARD;
  return IATF_SCORECARD
    .filter(cat => !cat.iatfOnly)
    .map(cat => ({ ...cat, metrics: cat.metrics.filter(m => !m.iatfOnly) }))
    .filter(cat => cat.metrics.length > 0);
}

// Resolve score for a metric entry (handles select options)
function resolveMetricScore(metric: ScorecardMetric, value: number | string): number {
  if (metric.type === "select" && metric.options) {
    return metric.options.find(o => o.value === value)?.score ?? 0;
  }
  return metric.toScore(value);
}

// Calculate category score (0–100) from entered values
function calcCategoryScore(
  category: ScorecardCategory,
  values: Record<string, number | string>
): number {
  const scores = category.metrics.map(m => {
    const v = values[m.id];
    if (v === undefined || v === "") return null;
    return resolveMetricScore(m, v);
  }).filter(s => s !== null) as number[];
  if (!scores.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avg / 10) * 100);
}

// Calculate weighted overall scorecard total (0–100).
// Uses the active scorecard so weights normalize correctly when IATF categories are excluded.
function calcIatfOverall(allValues: Record<string, Record<string, number | string>>, scorecard: ScorecardCategory[] = IATF_SCORECARD): number {
  const totalWeight = scorecard.reduce((s, c) => s + c.weight, 0);
  let weighted = 0;
  for (const cat of scorecard) {
    const catScore = calcCategoryScore(cat, allValues[cat.id] ?? {});
    weighted += (catScore / 100) * (cat.weight / totalWeight) * 100;
  }
  return Math.round(weighted);
}

function iatfRecommendation(score: number): string {
  if (score >= 90) return "preferred";
  if (score >= 75) return "approved";
  if (score >= 60) return "conditional";
  return "disqualified";
}

const RECO_STYLE: Record<string, string> = {
  preferred:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  approved:     "bg-green-50 text-green-700 border-green-200",
  conditional:  "bg-amber-100 text-amber-700 border-amber-200",
  disqualified: "bg-red-100 text-red-700 border-red-200",
};
const RECO_LABEL: Record<string, string> = {
  preferred:    "★ Preferred Supplier",
  approved:     "✓ Approved",
  conditional:  "⚠ Conditional — Improvement Plan Required",
  disqualified: "✗ Disqualify — Immediate Action Required",
};

const CATEGORY_COLORS: Record<string, { border: string; bg: string; header: string; badge: string }> = {
  blue:    { border: "border-blue-200",   bg: "bg-blue-50/40 dark:bg-blue-950/10",   header: "text-blue-700 dark:text-blue-400",   badge: "bg-blue-100 text-blue-700 border-blue-200" },
  violet:  { border: "border-violet-200", bg: "bg-violet-50/40 dark:bg-violet-950/10", header: "text-violet-700 dark:text-violet-400", badge: "bg-violet-100 text-violet-700 border-violet-200" },
  red:     { border: "border-red-200",    bg: "bg-red-50/40 dark:bg-red-950/10",     header: "text-red-700 dark:text-red-400",     badge: "bg-red-100 text-red-700 border-red-200" },
  amber:   { border: "border-amber-200",  bg: "bg-amber-50/40 dark:bg-amber-950/10", header: "text-amber-700 dark:text-amber-400", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  emerald: { border: "border-emerald-200",bg: "bg-emerald-50/40 dark:bg-emerald-950/10",header: "text-emerald-700 dark:text-emerald-400",badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

function scoreColor(s: number): string {
  return s >= 8 ? "text-emerald-600" : s >= 6 ? "text-amber-600" : s >= 4 ? "text-orange-600" : "text-red-600";
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color = score >= 8 ? "bg-emerald-400" : score >= 6 ? "bg-amber-400" : score >= 4 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-1.5 w-16">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MetricInput({ metric, value, onChange }: {
  metric: ScorecardMetric;
  value: number | string | undefined;
  onChange: (v: number | string) => void;
}) {
  if (metric.type === "select" && metric.options) {
    return (
      <Select value={String(value ?? "")} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-sm w-64" data-testid={`select-metric-${metric.id}`}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {metric.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }
  if (metric.type === "slider") {
    const n = Number(value ?? 5);
    return (
      <div className="flex items-center gap-2">
        <input type="range" min={1} max={10} step={1} value={n}
          onChange={e => onChange(parseInt(e.target.value))}
          className="w-24 accent-orange-500"
          data-testid={`slider-metric-${metric.id}`}
        />
        <span className={`w-5 text-center text-sm font-bold ${scoreColor(n)}`}>{n}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number" min={0} step={0.1}
        value={value ?? ""}
        onChange={e => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
        placeholder={metric.placeholder}
        className="h-7 text-sm w-28"
        data-testid={`input-metric-${metric.id}`}
      />
      {metric.unit && <span className="text-sm text-muted-foreground">{metric.unit}</span>}
    </div>
  );
}

// ─── Print Scorecard ──────────────────────────────────────────────────────────

function printScorecard(ev: SupplierEvaluation, supplierName: string, companyName = "CCI Chemical, Inc.", activeScorecard: ScorecardCategory[] = IATF_SCORECARD) {
  const isIATF = activeScorecard === IATF_SCORECARD || activeScorecard.some(c => c.iatfOnly === undefined && c.id === "customer_impact");
  const standardLabel = isIATF ? "IATF 16949" : "ISO 9001:2015";
  const clauseRef = isIATF ? "IATF 16949 §8.4.1 / §8.4.2.4 Supplier Monitoring" : "ISO 9001:2015 §8.4 — Control of Externally Provided Processes, Products & Services";
  const scores: any = ev.scores ?? {};
  const RECO_COLORS: Record<string, string> = {
    preferred: "#059669", approved: "#16a34a", conditional: "#d97706", disqualified: "#dc2626",
  };
  const RECO_LABELS: Record<string, string> = {
    preferred: "★ Preferred Supplier", approved: "✓ Approved",
    conditional: "⚠ Conditional — Improvement Plan Required",
    disqualified: "✗ Disqualify — Immediate Action Required",
  };
  const recoColor = RECO_COLORS[ev.recommendation ?? "conditional"] ?? "#64748b";
  const recoLabel = RECO_LABELS[ev.recommendation ?? "conditional"] ?? (ev.recommendation ?? "");
  const overall = ev.overallScore ?? 0;
  const scoreColor = overall >= 90 ? "#059669" : overall >= 75 ? "#16a34a" : overall >= 60 ? "#d97706" : "#dc2626";
  const CAT_COLORS: Record<string, string> = {
    blue: "#2563eb", violet: "#7c3aed", red: "#dc2626", amber: "#d97706", emerald: "#059669",
  };

  const catRows = activeScorecard.map(cat => {
    const catData = scores[cat.id] ?? {};
    const metricRows = cat.metrics.map(m => {
      const entry = catData[m.id];
      if (!entry) return "";
      const sc = entry.score as number;
      const scColor = sc >= 8 ? "#059669" : sc >= 6 ? "#d97706" : sc >= 4 ? "#ea580c" : "#dc2626";
      const val = m.type === "select" && m.options
        ? m.options.find(o => o.value === entry.value)?.label.split("—")[0].trim() ?? entry.value
        : `${entry.value}${m.unit ? " " + m.unit : ""}`;
      return `<tr>
        <td style="padding:5px 12px;font-size:11px;color:#475569;border-bottom:1px solid #f1f5f9;">${m.label}</td>
        <td style="padding:5px 12px;font-size:11px;color:#0f172a;border-bottom:1px solid #f1f5f9;">${val}</td>
        <td style="padding:5px 12px;font-size:11px;font-weight:700;color:${scColor};text-align:right;border-bottom:1px solid #f1f5f9;">${sc}/10</td>
      </tr>`;
    }).filter(Boolean).join("");
    if (!metricRows) return "";
    const metricScores = cat.metrics.filter(m => catData[m.id]).map(m => catData[m.id].score as number);
    const catScore = metricScores.length
      ? Math.round((metricScores.reduce((a: number, b: number) => a + b, 0) / metricScores.length / 10) * 100) : 0;
    return `
    <div style="margin-bottom:14px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;page-break-inside:avoid;">
      <div style="background:${CAT_COLORS[cat.color] ?? "#64748b"};padding:7px 12px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#fff;font-size:11px;font-weight:700;">${cat.label}</span>
        <span style="color:rgba(255,255,255,0.85);font-size:10px;">${cat.weight}% weight · Category Score: ${catScore}/100</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
        <tr><th style="padding:4px 12px;font-size:9px;color:#94a3b8;text-align:left;background:#f8fafc;">Metric</th>
            <th style="padding:4px 12px;font-size:9px;color:#94a3b8;text-align:left;background:#f8fafc;">Value</th>
            <th style="padding:4px 12px;font-size:9px;color:#94a3b8;text-align:right;background:#f8fafc;">Score</th></tr>
        ${metricRows}
      </table>
    </div>`;
  }).filter(Boolean).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Supplier Scorecard — ${supplierName}</title>
<style>
  body{margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;}
  @media print{body{padding:12px;}@page{size:A4;margin:12mm 12mm 14mm;}.no-print{display:none!important;}}
  h1{font-size:18px;margin:0 0 2px;color:#0f172a;}
</style></head>
<body>
<div style="border-bottom:3px solid #ea6c19;padding-bottom:12px;margin-bottom:16px;">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;">
    <div>
      <div style="background:#0f172a;display:inline-block;padding:4px 10px;border-radius:4px;margin-bottom:8px;">
        <span style="color:#ea6c19;font-weight:700;font-size:12px;letter-spacing:1px;">CCHUB</span>
        <span style="color:#fff;font-size:11px;margin-left:8px;">${companyName}</span>
      </div>
      <h1>${standardLabel} Supplier Performance Scorecard</h1>
      <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Per ${clauseRef.replace(/§/g, "§")}</p>
    </div>
    <button class="no-print" onclick="window.print()" style="background:#ea6c19;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">🖨 Print / Save PDF</button>
  </div>
</div>

<table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
<tr>
  <td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#475569;width:100px;"><strong>Supplier</strong></td>
  <td style="padding:10px 14px;font-size:13px;font-weight:600;">${supplierName}</td>
  <td style="padding:10px 14px;background:#f8fafc;font-size:12px;color:#475569;width:120px;"><strong>Period</strong></td>
  <td style="padding:10px 14px;font-size:13px;">${ev.period || "—"}</td>
  <td style="padding:10px 14px;text-align:center;background:#f8fafc;" rowspan="2">
    <p style="font-size:36px;font-weight:900;margin:0;color:${scoreColor};">${overall}</p>
    <p style="font-size:10px;margin:0;color:#94a3b8;">/100 Overall</p>
  </td>
</tr>
<tr>
  <td style="padding:8px 14px;background:#f8fafc;font-size:12px;color:#475569;"><strong>Evaluated By</strong></td>
  <td style="padding:8px 14px;font-size:12px;">${ev.evaluatorName || "—"}</td>
  <td style="padding:8px 14px;background:#f8fafc;font-size:12px;color:#475569;"><strong>Date</strong></td>
  <td style="padding:8px 14px;font-size:12px;">${ev.evaluationDate}</td>
</tr>
<tr>
  <td colspan="4" style="padding:10px 14px;">
    <span style="background:${recoColor};color:#fff;padding:3px 12px;border-radius:4px;font-size:11px;font-weight:700;">${recoLabel}</span>
    <span style="font-size:10px;color:#64748b;margin-left:8px;">
      ${overall >= 90 ? "Score ≥ 90 — Preferred Supplier status maintained"
        : overall >= 75 ? "Score 75–89 — Approved. Continue monitoring."
        : overall >= 60 ? "Score 60–74 — Written Improvement Plan required within 30 days"
        : "Score < 60 — Initiate supplier disqualification process"}
    </span>
  </td>
  <td></td>
</tr>
</table>

<p style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Category Performance Breakdown</p>
${catRows}

${ev.notes ? `<div style="background:#fffbeb;border-left:4px solid #d97706;padding:10px 14px;border-radius:4px;margin-top:4px;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#92400e;">Evaluator Notes</p>
  <p style="margin:0;font-size:12px;color:#78350f;">${ev.notes}</p>
</div>` : ""}

<p style="margin-top:20px;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;">
  Generated by Core Compliance Hub &nbsp;|&nbsp; ${clauseRef}
  &nbsp;|&nbsp; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
</p>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=750,scrollbars=yes");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── Tab 3: Supplier Evaluations ─────────────────────────────────────────────

function SupplierEvaluations({ isoProjectId, isIATF = false }: { isoProjectId?: number; isIATF?: boolean }) {
  const activeScorecard = getActiveScorecard(isIATF);
  const standardLabel = isIATF ? "IATF 16949" : "ISO 9001:2015";
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [showNewEval, setShowNewEval] = useState(false);
  const [expandedEvalId, setExpandedEvalId] = useState<number | null>(null);
  const [evalMeta, setEvalMeta] = useState({ evaluationDate: new Date().toISOString().split("T")[0], evaluatorName: "", period: "", notes: "" });
  const [allValues, setAllValues] = useState<Record<string, Record<string, number | string>>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sendToEmail, setSendToEmail] = useState<string>("");

  const setMetricValue = (catId: string, metricId: string, v: number | string) => {
    setAllValues(prev => ({ ...prev, [catId]: { ...prev[catId], [metricId]: v } }));
  };

  const suppliersQk = ["/api/suppliers", isoProjectId];
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: suppliersQk,
    queryFn: () => fetch(`/api/suppliers${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const evalsQk = ["/api/supplier-evaluations", isoProjectId, selectedSupplierId];
  const { data: evaluations = [] } = useQuery<SupplierEvaluation[]>({
    queryKey: evalsQk,
    queryFn: () => {
      const p = new URLSearchParams();
      if (isoProjectId) p.set("isoProjectId", String(isoProjectId));
      if (selectedSupplierId) p.set("supplierId", String(selectedSupplierId));
      return fetch(`/api/supplier-evaluations?${p}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: selectedSupplierId != null,
  });

  const createMut = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/supplier-evaluations", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: evalsQk });
      setShowNewEval(false);
      setAllValues({});
      setEvalMeta({ evaluationDate: new Date().toISOString().split("T")[0], evaluatorName: "", period: "", notes: "" });
      toast({ title: "Scorecard saved" });
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/supplier-evaluations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: evalsQk }); toast({ title: "Evaluation deleted" }); },
  });

  const sendMut = useMutation({
    mutationFn: ({ id, toEmail }: { id: number; toEmail?: string }) =>
      apiRequest("POST", `/api/supplier-evaluations/${id}/send-email`, { toEmail }),
    onSuccess: (data: any) => {
      toast({ title: "Scorecard sent", description: `Sent to ${data.sentTo}` });
      setSendingId(null);
      setSendToEmail("");
    },
    onError: (e: any) => {
      toast({ title: "Send failed", description: e.message || "Could not send email", variant: "destructive" });
    },
  });

  const updateFreqMut = useMutation({
    mutationFn: ({ id, freq }: { id: number; freq: string }) =>
      apiRequest("PATCH", `/api/suppliers/${id}`, { scorecardFrequency: freq }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: suppliersQk }); },
  });

  const overallScore = calcIatfOverall(allValues, activeScorecard);
  const recommendation = iatfRecommendation(overallScore);
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  // Build scores payload for DB — nested by category → metric
  const buildScoresPayload = () => {
    const out: Record<string, Record<string, { value: number | string; score: number }>> = {};
    for (const cat of activeScorecard) {
      out[cat.id] = {};
      for (const m of cat.metrics) {
        const v = allValues[cat.id]?.[m.id];
        if (v !== undefined && v !== "") {
          out[cat.id][m.id] = { value: v, score: resolveMetricScore(m, v) };
        }
      }
    }
    return out;
  };

  return (
    <div className="space-y-4">
      {/* Standard context banner */}
      <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        <div>
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-0.5">{standardLabel} Supplier Performance Scorecard — for active, ongoing suppliers</p>
          <p className="leading-relaxed">
            {isIATF
              ? <>This scorecard fulfills IATF 16949 §8.4.1 (supplier monitoring) and §8.4.2.4 (supplier performance evaluation). It tracks five required categories: delivered quality, delivery schedule performance (including <strong>premium freight</strong>), customer disruptions (including <strong>yard holds</strong> and <strong>field returns</strong>), corrective action responsiveness, and quality system status.</>
              : <>This scorecard fulfills ISO 9001:2015 §8.4 (control of externally provided processes, products and services). It tracks three categories: incoming quality, delivery performance, corrective action responsiveness, and quality system status. IATF 16949-specific metrics (premium freight, PPAP, controlled shipping status, line stops, yard holds, warranty returns) are not included for ISO 9001 clients.</>
            }{" "}Run this {selectedSupplier?.scorecardFrequency ?? "quarterly"} for active suppliers.
          </p>
        </div>
      </div>

      {/* Supplier picker + frequency */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Label className="text-sm font-semibold text-muted-foreground">Supplier</Label>
          <Select value={selectedSupplierId ? String(selectedSupplierId) : ""} onValueChange={v => { setSelectedSupplierId(parseInt(v)); setShowNewEval(false); setExpandedEvalId(null); setSendingId(null); }}>
            <SelectTrigger className="mt-1 h-9" data-testid="select-supplier-evaluate">
              <SelectValue placeholder="Choose a supplier to evaluate…" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selectedSupplier && (
          <div>
            <Label className="text-sm font-semibold text-muted-foreground">Scorecard Frequency</Label>
            <Select value={selectedSupplier.scorecardFrequency || "quarterly"}
              onValueChange={v => updateFreqMut.mutate({ id: selectedSupplier.id, freq: v })}>
              <SelectTrigger className="mt-1 h-9 w-40" data-testid="select-eval-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORECARD_FREQUENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedSupplierId && !showNewEval && (
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-9 text-sm" onClick={() => setShowNewEval(true)} data-testid="button-new-evaluation">
            <Plus className="w-3.5 h-3.5" /> New Scorecard
          </Button>
        )}
      </div>

      {/* Next due date indicator */}
      {selectedSupplier && evaluations.length > 0 && (() => {
        const lastEval = evaluations[0];
        const dueDate = nextScorecardDue(lastEval.evaluationDate, selectedSupplier.scorecardFrequency);
        const badge = scorecardDueLabel(dueDate);
        if (!badge) return null;
        return (
          <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border w-fit ${badge.cls}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-semibold">Next scorecard:</span>
            <span>{badge.label}</span>
            <span className="opacity-60 ml-1">· Based on {selectedSupplier.scorecardFrequency ?? "quarterly"} frequency + last eval date</span>
          </div>
        );
      })()}

      {!selectedSupplierId ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium">Select a supplier to view or add evaluations</p>
        </div>
      ) : (
        <>
          {/* ── NEW SCORECARD FORM ── */}
          {showNewEval && (
            <div className="border-2 border-accent/30 rounded-xl bg-accent/5 dark:bg-accent/5 overflow-hidden">
              {/* Form header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
                <div>
                  <p className="text-base font-bold text-primary">{standardLabel} Supplier Scorecard</p>
                  <p className="text-sm text-muted-foreground">{selectedSupplier?.name}</p>
                </div>
                <button onClick={() => setShowNewEval(false)} data-testid="button-close-scorecard">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Meta fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm font-semibold">Evaluation Date *</Label>
                    <Input type="date" className="mt-1 h-8 text-base" value={evalMeta.evaluationDate} onChange={e => setEvalMeta(m => ({ ...m, evaluationDate: e.target.value }))} data-testid="input-eval-date" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Evaluator</Label>
                    <Input className="mt-1 h-8 text-base" value={evalMeta.evaluatorName} onChange={e => setEvalMeta(m => ({ ...m, evaluatorName: e.target.value }))} placeholder="Name / role" data-testid="input-eval-evaluator" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Evaluation Period</Label>
                    <Input className="mt-1 h-8 text-base" value={evalMeta.period} onChange={e => setEvalMeta(m => ({ ...m, period: e.target.value }))} placeholder="e.g. Q2 2025 or FY 2025" data-testid="input-eval-period" />
                  </div>
                </div>

                {/* Category sections */}
                {activeScorecard.map(cat => {
                  const cc = CATEGORY_COLORS[cat.color];
                  const catScore = calcCategoryScore(cat, allValues[cat.id] ?? {});
                  return (
                    <div key={cat.id} className={`border ${cc.border} rounded-xl overflow-hidden ${cc.bg}`}>
                      {/* Category header */}
                      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${cc.border}`}>
                        <div>
                          <p className={`text-sm font-bold ${cc.header}`}>{cat.label}</p>
                          <p className="text-sm text-muted-foreground">{cat.iatfClause} · {cat.weight}% of total score</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-black ${scoreColor(catScore / 10)}`}>{catScore}</p>
                          <p className="text-xs text-muted-foreground">cat. score</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="divide-y divide-border/40">
                        {cat.metrics.map(m => {
                          const v = allValues[cat.id]?.[m.id];
                          const score = v !== undefined && v !== "" ? resolveMetricScore(m, v) : null;
                          return (
                            <div key={m.id} className="px-4 py-3 bg-white/60 dark:bg-white/5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-primary">{m.label}</span>
                                    {m.iatfHighlight && (
                                      <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 border px-1 py-0">IATF §8.4.1</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{m.description}</p>
                                  {m.iatfNote && <p className="text-xs text-muted-foreground/60 mt-0.5 italic">{m.iatfNote}</p>}
                                </div>
                                <div className="flex items-center gap-3 shrink-0 mt-0.5">
                                  <MetricInput metric={m} value={v} onChange={nv => setMetricValue(cat.id, m.id, nv)} />
                                  {score !== null ? (
                                    <div className="flex items-center gap-1.5 w-14">
                                      <ScoreBar score={score} />
                                      <span className={`text-sm font-bold w-4 text-right ${scoreColor(score)}`}>{score}</span>
                                    </div>
                                  ) : (
                                    <div className="w-14 text-center text-sm text-muted-foreground/40">—</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Overall score summary */}
                <div className="border border-border/60 rounded-xl p-4 bg-white dark:bg-card">
                  <div className="flex items-center gap-6 flex-wrap">
                    {/* Overall score dial */}
                    <div className="text-center min-w-[72px]">
                      <p className={`text-4xl font-black ${scoreColor(overallScore / 10)}`}>{overallScore}</p>
                      <p className="text-sm text-muted-foreground">/ 100 overall</p>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    {/* Category subtotals */}
                    <div className="flex gap-4 flex-wrap flex-1">
                      {activeScorecard.map(cat => {
                        const cc = CATEGORY_COLORS[cat.color];
                        const cs = calcCategoryScore(cat, allValues[cat.id] ?? {});
                        return (
                          <div key={cat.id} className="text-center">
                            <p className={`text-base font-bold ${scoreColor(cs / 10)}`}>{cs}</p>
                            <p className={`text-xs font-semibold ${cc.header}`}>{cat.label.split(" ")[0]}</p>
                            <p className="text-xs text-muted-foreground">{cat.weight}%</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-12 w-px bg-border" />
                    {/* Recommendation */}
                    <div>
                      <Badge className={`text-sm border px-2.5 py-1 ${RECO_STYLE[recommendation]}`}>
                        {RECO_LABEL[recommendation]}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {recommendation === "preferred" ? "≥90 — Preferred supplier" :
                          recommendation === "approved" ? "75–89 — Approved" :
                          recommendation === "conditional" ? "60–74 — Written improvement plan required within 30 days" :
                          "< 60 — Initiate disqualification process"}
                      </p>
                    </div>
                  </div>
                  {/* Notes + Save */}
                  <div className="flex items-end gap-3 mt-4 pt-4 border-t border-border/40">
                    <div className="flex-1">
                      <Label className="text-sm font-semibold">Evaluator Notes</Label>
                      <Textarea className="mt-1 text-sm resize-none h-14" placeholder="Summary observations, action items, escalations…"
                        value={evalMeta.notes} onChange={e => setEvalMeta(m => ({ ...m, notes: e.target.value }))} data-testid="textarea-eval-notes" />
                    </div>
                    <Button
                      className="bg-accent hover:bg-accent/90 text-white h-14 px-6 text-base font-semibold"
                      onClick={() => createMut.mutate({
                        supplierId: selectedSupplierId, isoProjectId,
                        evaluationDate: evalMeta.evaluationDate,
                        evaluatorName: evalMeta.evaluatorName,
                        period: evalMeta.period,
                        notes: evalMeta.notes,
                        overallScore,
                        recommendation,
                        scores: buildScoresPayload(),
                      })}
                      disabled={createMut.isPending}
                      data-testid="button-submit-evaluation"
                    >
                      Save Scorecard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PAST EVALUATIONS ── */}
          {evaluations.length === 0 && !showNewEval ? (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-base font-medium">No evaluations on record for {selectedSupplier?.name}</p>
              <p className="text-sm mt-1">Click "New Scorecard" to run the first {standardLabel} performance evaluation</p>
            </div>
          ) : evaluations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Evaluation History</p>
              {evaluations.map(ev => {
                const reco = ev.recommendation || "conditional";
                const isExpanded = expandedEvalId === ev.id;
                return (
                  <div key={ev.id} className="border border-border/60 rounded-xl overflow-hidden bg-white dark:bg-card" data-testid={`evaluation-${ev.id}`}>
                    {/* Row header */}
                    <button
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors ${isExpanded ? "bg-muted/10" : ""}`}
                      onClick={() => setExpandedEvalId(isExpanded ? null : ev.id)}
                      data-testid={`button-expand-eval-${ev.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-primary">{ev.period || ev.evaluationDate}</span>
                          {ev.period && <span className="text-sm text-muted-foreground">{ev.evaluationDate}</span>}
                          {ev.evaluatorName && <span className="text-sm text-muted-foreground">· {ev.evaluatorName}</span>}
                          <Badge className={`text-sm border ${RECO_STYLE[reco]}`}>{RECO_LABEL[reco]}</Badge>
                        </div>
                        {ev.notes && <p className="text-sm text-muted-foreground mt-0.5 truncate">{ev.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className={`text-2xl font-black ${scoreColor((ev.overallScore ?? 0) / 10)}`}>{ev.overallScore ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">/ 100</p>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Expanded: category breakdown */}
                    {isExpanded && ev.scores && (
                      <div className="border-t border-border/60 px-4 py-4 bg-muted/10 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          {activeScorecard.map(cat => {
                            const cc = CATEGORY_COLORS[cat.color];
                            const catData = ev.scores?.[cat.id] ?? {};
                            const catMetricScores = cat.metrics.map(m => catData[m.id]?.score).filter(Boolean) as number[];
                            const catAvgScore = catMetricScores.length ? Math.round((catMetricScores.reduce((a, b) => a + b, 0) / catMetricScores.length / 10) * 100) : null;
                            return (
                              <div key={cat.id} className={`border ${cc.border} rounded-lg overflow-hidden`}>
                                <div className={`flex items-center justify-between px-3 py-2 ${cc.bg}`}>
                                  <p className={`text-sm font-bold ${cc.header}`}>{cat.label}</p>
                                  {catAvgScore !== null && (
                                    <span className={`text-sm font-black ${scoreColor(catAvgScore / 10)}`}>{catAvgScore}</span>
                                  )}
                                </div>
                                <div className="divide-y divide-border/30">
                                  {cat.metrics.map(m => {
                                    const entry = catData[m.id];
                                    if (!entry) return null;
                                    return (
                                      <div key={m.id} className="flex items-center justify-between px-3 py-1.5 bg-white/70 dark:bg-white/5 text-sm">
                                        <span className="text-muted-foreground">{m.label}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-primary font-medium">
                                            {m.type === "select" && m.options
                                              ? m.options.find(o => o.value === entry.value)?.label.split("—")[0].trim()
                                              : `${entry.value}${m.unit ? " " + m.unit : ""}`}
                                          </span>
                                          <ScoreBar score={entry.score} />
                                          <span className={`w-4 text-right font-bold ${scoreColor(entry.score)}`}>{entry.score}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {ev.notes && <p className="text-sm text-muted-foreground italic border-t border-border/40 pt-3">{ev.notes}</p>}

                        {/* Send email inline form */}
                        {sendingId === ev.id && (
                          <div className="border border-accent/30 rounded-lg p-3 bg-accent/5 mt-2 space-y-2" data-testid={`send-email-panel-${ev.id}`}>
                            <p className="text-sm font-semibold text-primary">Send scorecard to supplier</p>
                            <div className="flex gap-2">
                              <Input
                                className="h-7 text-sm flex-1"
                                placeholder={`Supplier email${selectedSupplier?.email ? ` (${selectedSupplier.email})` : ""}`}
                                value={sendToEmail}
                                onChange={e => setSendToEmail(e.target.value)}
                                data-testid={`input-send-email-${ev.id}`}
                              />
                              <Button
                                size="sm" className="h-7 text-sm bg-accent hover:bg-accent/90 text-white gap-1"
                                onClick={() => sendMut.mutate({ id: ev.id, toEmail: sendToEmail || undefined })}
                                disabled={sendMut.isPending}
                                data-testid={`button-confirm-send-${ev.id}`}
                              >
                                <Send className="w-3 h-3" /> {sendMut.isPending ? "Sending…" : "Send"}
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-sm" onClick={() => { setSendingId(null); setSendToEmail(""); }}>Cancel</Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {selectedSupplier?.email
                                ? `Leave blank to use the email on file (${selectedSupplier.email}), or type a different address.`
                                : "No email on file for this supplier — enter one above, or add it in the ASL tab."}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-sm gap-1.5"
                              onClick={() => printScorecard(ev, selectedSupplier?.name ?? "Supplier", undefined, activeScorecard)}
                              data-testid={`button-print-eval-${ev.id}`}>
                              <Printer className="w-3 h-3" /> Print / PDF
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-sm gap-1.5 border-accent/30 text-accent hover:bg-accent/5"
                              onClick={() => { setSendingId(sendingId === ev.id ? null : ev.id); setSendToEmail(""); }}
                              data-testid={`button-send-eval-${ev.id}`}>
                              <Send className="w-3 h-3" /> Send to Supplier
                            </Button>
                          </div>
                          <button onClick={() => { if (confirm("Delete this evaluation?")) deleteMut.mutate(ev.id); }}
                            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700" data-testid={`button-delete-eval-${ev.id}`}>
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab 4: Supplier Audit Schedule (IATF Only) ──────────────────────────────

const RISK_FACTORS: Array<{ key: string; label: string; desc: string; weight: number }> = [
  { key: "criticalPart",     label: "Supplies Critical / Safety Part",       desc: "Part directly affects vehicle safety or regulatory compliance", weight: 30 },
  { key: "recentNC",        label: "Recent Nonconformance",                  desc: "Supplier had a significant NC in the past 12 months",           weight: 25 },
  { key: "noCert",          label: "No ISO / IATF Certification",            desc: "Supplier lacks IATF 16949 or ISO 9001 certification",           weight: 20 },
  { key: "certExpiringSoon",label: "Cert Expiring Within 90 Days",           desc: "ISO/IATF certificate expires within 90 days",                  weight: 15 },
  { key: "singleSource",    label: "Single-Source Supplier",                 desc: "No qualified alternative supplier available",                  weight: 15 },
  { key: "poorDelivery",    label: "Poor Delivery Performance",              desc: "On-time delivery < 95% in past 6 months",                     weight: 20 },
  { key: "noRecentEval",    label: "No Evaluation in Past 12 Months",        desc: "Supplier has not been formally evaluated recently",            weight: 15 },
  { key: "newSupplier",     label: "New Supplier (< 1 Year)",                desc: "Supplier has been qualified for less than one year",           weight: 10 },
];

function SupplierAuditSchedule({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [factors, setFactors] = useState<Record<string, boolean>>({});
  const [scheduleForm, setScheduleForm] = useState({ lastAuditDate: "", nextAuditDate: "", auditStatus: "not_scheduled", notes: "" });

  const suppliersQk = ["/api/suppliers", isoProjectId];
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: suppliersQk,
    queryFn: () => fetch(`/api/suppliers${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const auditsQk = ["/api/supplier-audits", isoProjectId];
  const { data: audits = [] } = useQuery<SupplierAudit[]>({
    queryKey: auditsQk,
    queryFn: () => fetch(`/api/supplier-audits${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const upsertMut = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/supplier-audits", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: auditsQk }); toast({ title: "Audit schedule saved" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/supplier-audits/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: auditsQk }); toast({ title: "Audit record removed" }); },
  });

  const riskScore = calcRiskScore(factors);
  const riskLevel = scoreToRiskLevel(riskScore);
  const frequency = scoreToFrequency(riskScore);
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const existingAudit = audits.find(a => a.supplierId === selectedSupplierId);

  function handleSave() {
    if (!selectedSupplierId) return;
    upsertMut.mutate({
      supplierId: selectedSupplierId,
      isoProjectId,
      riskScore,
      riskLevel,
      riskFactors: factors,
      recommendedFrequency: frequency,
      lastAuditDate: scheduleForm.lastAuditDate || null,
      nextAuditDate: scheduleForm.nextAuditDate || null,
      auditStatus: scheduleForm.auditStatus,
      notes: scheduleForm.notes,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>IATF 16949 requires a risk-based supplier audit program. Use this tool to determine audit frequency per supplier based on objective risk criteria (§8.4.2).</span>
      </div>

      {/* Supplier selector */}
      <div>
        <Label className="text-sm font-semibold text-muted-foreground">Select Supplier</Label>
        <Select value={selectedSupplierId ? String(selectedSupplierId) : ""} onValueChange={v => {
          const id = parseInt(v);
          setSelectedSupplierId(id);
          const existing = audits.find(a => a.supplierId === id);
          if (existing) {
            setFactors((existing.riskFactors as Record<string, boolean>) || {});
            setScheduleForm({
              lastAuditDate: existing.lastAuditDate || "",
              nextAuditDate: existing.nextAuditDate || "",
              auditStatus: existing.auditStatus || "not_scheduled",
              notes: existing.notes || "",
            });
          } else {
            setFactors({});
            setScheduleForm({ lastAuditDate: "", nextAuditDate: "", auditStatus: "not_scheduled", notes: "" });
          }
        }}>
          <SelectTrigger className="mt-1 h-9" data-testid="select-supplier-audit">
            <SelectValue placeholder="Choose a supplier…" />
          </SelectTrigger>
          <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedSupplierId && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Risk factor checklist */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Risk Factors</p>
              {RISK_FACTORS.map(rf => (
                <label key={rf.key} className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg border transition-all ${factors[rf.key] ? "bg-red-50 border-red-200 dark:bg-red-950/20" : "border-border/50 hover:border-border bg-white dark:bg-card"}`} data-testid={`checkbox-risk-${rf.key}`}>
                  <input
                    type="checkbox"
                    checked={!!factors[rf.key]}
                    onChange={e => setFactors(f => ({ ...f, [rf.key]: e.target.checked }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-primary">{rf.label}</p>
                    <p className="text-sm text-muted-foreground">{rf.desc}</p>
                  </div>
                  <Badge className={`ml-auto text-xs shrink-0 ${factors[rf.key] ? "bg-red-100 text-red-700 border-red-200" : "bg-muted text-muted-foreground border-border/50"}`}>+{rf.weight}</Badge>
                </label>
              ))}
            </div>

            {/* Risk result + schedule */}
            <div className="space-y-3">
              {/* Risk score card */}
              <div className={`rounded-xl p-4 border text-center ${RISK_COLORS[riskLevel]} border-current/20`}>
                <p className="text-4xl font-black">{riskScore}</p>
                <p className="text-base font-bold uppercase tracking-wide mt-1">{riskLevel} Risk</p>
                <p className="text-sm mt-2 font-semibold">Recommended Audit Frequency</p>
                <p className="text-lg font-black mt-0.5">{frequency}</p>
              </div>

              {/* Risk breakdown bar */}
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 space-y-1.5">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Risk Breakdown</p>
                {RISK_FACTORS.filter(rf => factors[rf.key]).map(rf => (
                  <div key={rf.key} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground truncate flex-1">{rf.label}</span>
                    <Badge className="text-xs bg-red-100 text-red-700 border-red-200">+{rf.weight}</Badge>
                  </div>
                ))}
                {Object.values(factors).every(v => !v) && <p className="text-sm text-muted-foreground">No risk factors selected</p>}
              </div>

              {/* Schedule fields */}
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 space-y-3">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Audit Schedule</p>
                <div>
                  <Label className="text-sm font-semibold">Last Audit Date</Label>
                  <Input type="date" className="mt-1 h-8 text-base" value={scheduleForm.lastAuditDate} onChange={e => setScheduleForm(f => ({ ...f, lastAuditDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Next Audit Date</Label>
                  <Input type="date" className="mt-1 h-8 text-base" value={scheduleForm.nextAuditDate} onChange={e => setScheduleForm(f => ({ ...f, nextAuditDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Audit Status</Label>
                  <Select value={scheduleForm.auditStatus} onValueChange={v => setScheduleForm(f => ({ ...f, auditStatus: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-base"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_scheduled">Not Scheduled</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Notes</Label>
                  <Textarea className="mt-1 text-base resize-none" rows={2} value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white gap-1.5 text-sm" onClick={handleSave} disabled={upsertMut.isPending} data-testid="button-save-audit-schedule">
                  <Calendar className="w-3.5 h-3.5" /> Save Audit Assessment
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Audit schedule summary table */}
      {audits.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">All Supplier Audit Records</p>
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Supplier</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Risk</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Frequency</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Next Audit</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {audits.map(a => {
                  const sup = suppliers.find(s => s.id === a.supplierId);
                  return (
                    <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20" data-testid={`audit-row-${a.id}`}>
                      <td className="px-3 py-2 font-semibold text-primary">{sup?.name ?? "—"}</td>
                      <td className="px-3 py-2">
                        <Badge className={`text-sm ${RISK_COLORS[a.riskLevel || "medium"]}`}>{a.riskLevel || "—"} ({a.riskScore})</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{a.recommendedFrequency || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.nextAuditDate || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge className={`text-sm ${a.auditStatus === "overdue" ? "bg-red-100 text-red-700 border-red-200" : a.auditStatus === "scheduled" ? "bg-blue-100 text-blue-700 border-blue-200" : a.auditStatus === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}`}>
                          {a.auditStatus?.replace("_", " ") || "—"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => { if (confirm("Remove audit record?")) deleteMut.mutate(a.id); }} className="p-1 rounded hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

interface SupplierModuleProps {
  project: IsoProject | null | undefined;
}

const TABS = [
  { key: "asl",      label: "Approved Suppliers",  icon: Truck },
  { key: "criteria", label: "Selection Criteria",   icon: ClipboardList },
  { key: "evals",    label: "Evaluations",          icon: BarChart3 },
  { key: "audits",   label: "Audit Schedule",       icon: Calendar, iatfOnly: true },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function SupplierModule({ project }: SupplierModuleProps) {
  const isIATF = !!project?.standard?.includes("IATF");
  const [tab, setTab] = useState<TabKey>("asl");
  const visibleTabs = TABS.filter(t => !t.iatfOnly || isIATF);

  const isoProjectId = project?.id;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Tab bar */}
      <div className="shrink-0 border-b border-border/60 bg-white dark:bg-card px-4">
        <div className="flex items-center gap-0">
          {visibleTabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${active ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-supplier-${t.key}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {"iatfOnly" in t && t.iatfOnly && <Badge className="text-[8px] bg-amber-100 text-amber-700 border-amber-200 ml-0.5">IATF</Badge>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 max-w-5xl">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-black text-primary">
                {tab === "asl" && "Approved Supplier List"}
                {tab === "criteria" && "Supplier Selection Criteria"}
                {tab === "evals" && "Supplier Evaluations"}
                {tab === "audits" && "Supplier Audit Schedule"}
              </h2>
              {tab === "audits" && <Badge className="text-sm bg-amber-100 text-amber-700 border-amber-200">IATF 16949 §8.4.2</Badge>}
              {tab === "asl" && <Badge className="text-sm bg-blue-50 text-blue-700 border-blue-200">ISO 9001 §8.4.1</Badge>}
              {tab === "criteria" && <Badge className="text-sm bg-blue-50 text-blue-700 border-blue-200">ISO 9001 §8.4.1</Badge>}
              {tab === "evals" && <Badge className="text-sm bg-blue-50 text-blue-700 border-blue-200">ISO 9001 §8.4.2</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "asl" && "Maintain your Approved Supplier List with ISO certification tracking and expiry reminders."}
              {tab === "criteria" && "Define weighted criteria for supplier selection and qualification decisions."}
              {tab === "evals" && "Score suppliers against your criteria and generate formal evaluation scorecards."}
              {tab === "audits" && "Determine supplier audit frequency using a risk-based assessment per IATF 16949 §8.4.2."}
            </p>
          </div>

          {tab === "asl"      && <ApprovedSupplierList isoProjectId={isoProjectId} />}
          {tab === "criteria" && <SelectionCriteria isoProjectId={isoProjectId} project={project} />}
          {tab === "evals"    && <SupplierEvaluations isoProjectId={isoProjectId} isIATF={isIATF} />}
          {tab === "audits"   && isIATF && <SupplierAuditSchedule isoProjectId={isoProjectId} />}
        </div>
      </ScrollArea>
    </div>
  );
}
