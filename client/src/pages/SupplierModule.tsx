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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Truck, Plus, Pencil, Trash2, ExternalLink, AlertTriangle, CheckCircle2,
  ShieldCheck, ClipboardList, BarChart3, Calendar, AlertCircle, Info,
  FileCheck, ChevronRight, Star, Award, X,
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
interface SupplierEvaluation {
  id: number; userId: string; isoProjectId?: number | null;
  supplierId: number; evaluationDate: string; evaluatorName?: string | null;
  period?: string | null; overallScore?: number | null;
  recommendation?: string | null; notes?: string | null;
  scores?: Record<string, number> | null; createdAt?: string | null;
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
  if (days === null) return <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{supplier.isoCertType}</Badge>;
  if (days < 0) return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">{supplier.isoCertType} · Expired</Badge>;
  if (days <= 60) return <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">{supplier.isoCertType} · {days}d left</Badge>;
  return <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{supplier.isoCertType} ✓</Badge>;
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

function calcOverallScore(scores: Record<string, number>, criteria: SupplierCriteria[]): number {
  if (!criteria.length) return 0;
  const totalWeight = criteria.reduce((s, c) => s + (c.weight || 0), 0);
  if (!totalWeight) return 0;
  let weighted = 0;
  for (const c of criteria) {
    const score = scores[String(c.id)] ?? 0;
    weighted += (score / 10) * (c.weight / totalWeight) * 100;
  }
  return Math.round(weighted);
}

function scoreToRecommendation(score: number): string {
  if (score >= 80) return "approved";
  if (score >= 60) return "conditional";
  return "disqualified";
}

const CRITERIA_CATEGORIES = ["quality", "logistics", "financial", "technical", "compliance"];
const SUPPLIER_CATEGORIES = [
  "Raw Material", "Component / Part", "Sub-Assembly", "Packaging",
  "Tooling / Equipment", "Service Provider", "Chemical / Fluid", "Other",
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const EMPTY_SUP: Partial<Supplier> = {
  name: "", contactName: "", email: "", phone: "", address: "",
  category: "", criticalityLevel: "minor", status: "active",
  isoCertUrl: "", isoCertType: "", isoCertExpiry: "", reminderDaysBefore: 30, notes: "",
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
          <Label className="text-xs font-semibold">Supplier Name *</Label>
          <Input className="mt-1 h-8 text-sm" value={form.name || ""} onChange={e => set("name")(e.target.value)} placeholder="e.g. Acme Supply Co." data-testid="input-supplier-name" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Contact Name</Label>
          <Input className="mt-1 h-8 text-sm" value={form.contactName || ""} onChange={e => set("contactName")(e.target.value)} placeholder="John Smith" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Email</Label>
          <Input className="mt-1 h-8 text-sm" value={form.email || ""} onChange={e => set("email")(e.target.value)} placeholder="contact@acme.com" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Phone</Label>
          <Input className="mt-1 h-8 text-sm" value={form.phone || ""} onChange={e => set("phone")(e.target.value)} placeholder="(555) 000-0000" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Category</Label>
          <Select value={form.category || ""} onValueChange={set("category")}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{SUPPLIER_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Criticality</Label>
          <Select value={form.criticalityLevel || "minor"} onValueChange={set("criticalityLevel")}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical — Directly affects product safety/quality</SelectItem>
              <SelectItem value="major">Major — Significant quality impact</SelectItem>
              <SelectItem value="minor">Minor — Low quality impact</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Status</Label>
          <Select value={form.status || "active"} onValueChange={set("status")}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="probationary">Probationary</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-border/50 pt-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">ISO Certification</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold">Cert Type</Label>
            <Input className="mt-1 h-8 text-sm" value={form.isoCertType || ""} onChange={e => set("isoCertType")(e.target.value)} placeholder="e.g. ISO 9001:2015, IATF 16949" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Expiry Date</Label>
            <Input type="date" className="mt-1 h-8 text-sm" value={form.isoCertExpiry || ""} onChange={e => set("isoCertExpiry")(e.target.value)} data-testid="input-cert-expiry" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-semibold">Certificate URL (hyperlink to cert document)</Label>
            <Input className="mt-1 h-8 text-sm" value={form.isoCertUrl || ""} onChange={e => set("isoCertUrl")(e.target.value)} placeholder="https://…" data-testid="input-cert-url" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Remind Me (days before expiry)</Label>
            <Input type="number" className="mt-1 h-8 text-sm" value={form.reminderDaysBefore ?? 30} onChange={e => setForm(f => ({ ...f, reminderDaysBefore: parseInt(e.target.value) || 30 }))} min={1} max={365} />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Address / Location</Label>
        <Input className="mt-1 h-8 text-sm" value={form.address || ""} onChange={e => set("address")(e.target.value)} placeholder="City, State, Country" />
      </div>
      <div>
        <Label className="text-xs font-semibold">Notes</Label>
        <Textarea className="mt-1 text-sm resize-none" rows={2} value={form.notes || ""} onChange={e => set("notes")(e.target.value)} placeholder="Any relevant notes…" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} data-testid="button-cancel-supplier">Cancel</Button>
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={() => onSave(form)} disabled={!form.name?.trim()} data-testid="button-save-supplier">Save Supplier</Button>
      </div>
    </div>
  );
}

// ─── Tab 1: Approved Supplier List ──────────────────────────────────────────

function ApprovedSupplierList({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: "Supplier removed" }); },
  });

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const expiringCount = suppliers.filter(s => {
    const days = daysUntilExpiry(s.isoCertExpiry);
    return days !== null && days <= (s.reminderDaysBefore ?? 30) && days > 0;
  }).length;
  const expiredCount = suppliers.filter(s => {
    const days = daysUntilExpiry(s.isoCertExpiry);
    return days !== null && days < 0;
  }).length;

  return (
    <div className="space-y-4">
      {/* Alert bar */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span><strong>{expiredCount}</strong> supplier cert{expiredCount > 1 ? "s" : ""} expired</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span><strong>{expiringCount}</strong> cert{expiringCount > 1 ? "s" : ""} expiring soon</span>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Input className="h-8 text-sm flex-1 max-w-xs" placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-suppliers" />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}</span>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-8 text-xs" onClick={() => setShowForm(true)} data-testid="button-add-supplier">
            <Plus className="w-3.5 h-3.5" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-border/60 rounded-xl p-4 bg-muted/10">
          <h3 className="text-sm font-bold text-primary mb-3">New Supplier</h3>
          <SupplierForm
            initial={EMPTY_SUP}
            onSave={d => createMut.mutate(d)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Supplier cards */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">{search ? "No suppliers match your search" : "No suppliers yet"}</p>
          {!search && <p className="text-xs mt-1">Click "Add Supplier" to build your Approved Supplier List</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const days = daysUntilExpiry(s.isoCertExpiry);
            const certAlert = days !== null && days <= (s.reminderDaysBefore ?? 30) && days > 0;
            const certExpired = days !== null && days < 0;
            return (
              <div
                key={s.id}
                className={`border rounded-xl p-3 bg-white dark:bg-card transition-all ${certExpired ? "border-red-200 bg-red-50/30 dark:bg-red-950/10" : certAlert ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10" : "border-border/60 hover:border-border"}`}
                data-testid={`card-supplier-${s.id}`}
              >
                {editing?.id === s.id ? (
                  <SupplierForm
                    initial={s}
                    onSave={d => updateMut.mutate({ id: s.id, d })}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-primary">{s.name}</span>
                        <Badge className={`text-[10px] border ${CRITICALITY_COLORS[s.criticalityLevel || "minor"]}`}>{s.criticalityLevel || "minor"}</Badge>
                        <Badge className={`text-[10px] border ${STATUS_COLORS[s.status]}`}>{s.status}</Badge>
                        {certBadge(s)}
                        {s.isoCertUrl && (
                          <a href={s.isoCertUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline" data-testid={`link-cert-${s.id}`}>
                            <ExternalLink className="w-3 h-3" /> View Cert
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        {s.category && <span>{s.category}</span>}
                        {s.contactName && <span>· {s.contactName}</span>}
                        {s.email && <span>· {s.email}</span>}
                        {s.address && <span>· {s.address}</span>}
                      </div>
                      {(certExpired || certAlert) && (
                        <div className={`mt-1.5 flex items-center gap-1 text-[10px] font-semibold ${certExpired ? "text-red-600" : "text-amber-600"}`}>
                          <AlertTriangle className="w-3 h-3" />
                          {certExpired ? "Certificate EXPIRED" : `Certificate expiring in ${days} days`}
                          {s.isoCertExpiry && ` · Expires ${new Date(s.isoCertExpiry).toLocaleDateString()}`}
                        </div>
                      )}
                      {s.notes && <p className="mt-1 text-[11px] text-muted-foreground italic">{s.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditing(s)} className="p-1.5 rounded hover:bg-muted transition-colors" data-testid={`button-edit-supplier-${s.id}`}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => { if (confirm(`Remove ${s.name}?`)) deleteMut.mutate(s.id); }} className="p-1.5 rounded hover:bg-red-50 transition-colors" data-testid={`button-delete-supplier-${s.id}`}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
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

function SelectionCriteria({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "quality", weight: 10 });

  const qk = ["/api/supplier-criteria", isoProjectId];
  const { data: criteria = [], isLoading } = useQuery<SupplierCriteria[]>({
    queryKey: qk,
    queryFn: () => fetch(`/api/supplier-criteria${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
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

  const totalWeight = criteria.reduce((s, c) => s + (c.weight || 0), 0);
  const byCategory = CRITERIA_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = criteria.filter(c => c.category === cat);
    return acc;
  }, {} as Record<string, SupplierCriteria[]>);

  const DEFAULT_CRITERIA = [
    { name: "ISO Certification", description: "Supplier holds valid ISO 9001 or IATF 16949 certification", category: "quality", weight: 20 },
    { name: "Product / Part Quality", description: "Incoming quality rate — defect PPM, first-pass yield", category: "quality", weight: 25 },
    { name: "On-Time Delivery", description: "Percentage of orders delivered on or before requested date", category: "logistics", weight: 20 },
    { name: "Financial Stability", description: "Supplier demonstrates financial health and business continuity", category: "financial", weight: 10 },
    { name: "Regulatory Compliance", description: "Compliance with applicable environmental, safety, and regulatory requirements", category: "compliance", weight: 15 },
    { name: "Technical Capability", description: "Supplier has the equipment, expertise, and capacity to meet requirements", category: "technical", weight: 10 },
  ];

  return (
    <div className="space-y-4">
      {/* Weight summary */}
      <div className="flex items-center justify-between bg-muted/30 border border-border/50 rounded-xl p-3">
        <div>
          <p className="text-xs font-bold text-primary">Total Weight: <span className={totalWeight === 100 ? "text-emerald-600" : "text-amber-600"}>{totalWeight}%</span></p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Weights should total 100% for accurate scoring</p>
        </div>
        <div className="flex items-center gap-2">
          {criteria.length === 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => {
              DEFAULT_CRITERIA.forEach((c, i) => createMut.mutate({ ...c, order: i }));
            }} data-testid="button-load-defaults">
              <Star className="w-3 h-3" /> Load Defaults
            </Button>
          )}
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-8 text-xs" onClick={() => setShowForm(true)} data-testid="button-add-criteria">
            <Plus className="w-3.5 h-3.5" /> Add Criteria
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-3">
          <h3 className="text-sm font-bold text-primary">New Selection Criteria</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-semibold">Criteria Name *</Label>
              <Input className="mt-1 h-8 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. ISO Certification" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{CRITERIA_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Weight (%)</Label>
              <Input type="number" className="mt-1 h-8 text-sm" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseInt(e.target.value) || 0 }))} min={1} max={100} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea className="mt-1 text-sm resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this criteria measure?" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" onClick={() => createMut.mutate(form)} disabled={!form.name.trim()}>Add</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>
      ) : criteria.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No selection criteria defined</p>
          <p className="text-xs mt-1">Add criteria or click "Load Defaults" to use recommended criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {CRITERIA_CATEGORIES.filter(cat => byCategory[cat]?.length > 0).map(cat => (
            <div key={cat}>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5">{cat}</p>
              <div className="space-y-1.5">
                {byCategory[cat].map(c => (
                  <div key={c.id} className="border border-border/60 rounded-lg p-3 bg-white dark:bg-card flex items-start gap-3" data-testid={`criteria-${c.id}`}>
                    {editId === c.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input className="h-7 text-xs" defaultValue={c.name} id={`edit-name-${c.id}`} />
                          <Input type="number" className="h-7 text-xs" defaultValue={c.weight} id={`edit-weight-${c.id}`} min={1} max={100} />
                        </div>
                        <Textarea className="text-xs resize-none" rows={2} defaultValue={c.description || ""} id={`edit-desc-${c.id}`} />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs bg-accent hover:bg-accent/90 text-white" onClick={() => {
                            const name = (document.getElementById(`edit-name-${c.id}`) as HTMLInputElement)?.value;
                            const weight = parseInt((document.getElementById(`edit-weight-${c.id}`) as HTMLInputElement)?.value);
                            const description = (document.getElementById(`edit-desc-${c.id}`) as HTMLTextAreaElement)?.value;
                            updateMut.mutate({ id: c.id, d: { name, weight, description } });
                          }}>Save</Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary">{c.name}</span>
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{c.weight}%</Badge>
                          </div>
                          {c.description && <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>}
                          <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden w-full max-w-xs">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(c.weight, 100)}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditId(c.id)} className="p-1.5 rounded hover:bg-muted">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => { if (confirm("Remove this criteria?")) deleteMut.mutate(c.id); }} className="p-1.5 rounded hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Supplier Evaluations ─────────────────────────────────────────────

function SupplierEvaluations({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [showNewEval, setShowNewEval] = useState(false);
  const [evalForm, setEvalForm] = useState<Record<string, any>>({
    evaluationDate: new Date().toISOString().split("T")[0],
    evaluatorName: "", period: "", notes: "",
  });
  const [scores, setScores] = useState<Record<string, number>>({});

  const suppliersQk = ["/api/suppliers", isoProjectId];
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: suppliersQk,
    queryFn: () => fetch(`/api/suppliers${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const criteriaQk = ["/api/supplier-criteria", isoProjectId];
  const { data: criteria = [] } = useQuery<SupplierCriteria[]>({
    queryKey: criteriaQk,
    queryFn: () => fetch(`/api/supplier-criteria${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const evalsQk = ["/api/supplier-evaluations", isoProjectId, selectedSupplierId];
  const { data: evaluations = [] } = useQuery<SupplierEvaluation[]>({
    queryKey: evalsQk,
    queryFn: () => {
      const params = new URLSearchParams();
      if (isoProjectId) params.set("isoProjectId", String(isoProjectId));
      if (selectedSupplierId) params.set("supplierId", String(selectedSupplierId));
      return fetch(`/api/supplier-evaluations?${params}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: selectedSupplierId != null,
  });

  const createMut = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/supplier-evaluations", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: evalsQk }); setShowNewEval(false); setScores({}); toast({ title: "Evaluation saved" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/supplier-evaluations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: evalsQk }); toast({ title: "Evaluation deleted" }); },
  });

  const overallScore = criteria.length > 0 ? calcOverallScore(scores, criteria) : 0;
  const recommendation = scoreToRecommendation(overallScore);
  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  const RECO_STYLE: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    conditional: "bg-amber-100 text-amber-700 border-amber-200",
    disqualified: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-4">
      {/* Supplier picker */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label className="text-xs font-semibold text-muted-foreground">Select Supplier to Evaluate</Label>
          <Select value={selectedSupplierId ? String(selectedSupplierId) : ""} onValueChange={v => setSelectedSupplierId(parseInt(v))}>
            <SelectTrigger className="mt-1 h-9" data-testid="select-supplier-evaluate">
              <SelectValue placeholder="Choose a supplier…" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedSupplierId && (
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-9 text-xs mt-5" onClick={() => setShowNewEval(true)} data-testid="button-new-evaluation">
            <Plus className="w-3.5 h-3.5" /> New Evaluation
          </Button>
        )}
      </div>

      {!selectedSupplierId ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Select a supplier to view evaluations</p>
        </div>
      ) : (
        <>
          {/* New evaluation scorecard */}
          {showNewEval && criteria.length > 0 && (
            <div className="border-2 border-accent/30 rounded-xl p-4 bg-accent/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">New Evaluation — {selectedSupplier?.name}</h3>
                <button onClick={() => setShowNewEval(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Date *</Label>
                  <Input type="date" className="mt-1 h-8 text-sm" value={evalForm.evaluationDate} onChange={e => setEvalForm(f => ({ ...f, evaluationDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Evaluator</Label>
                  <Input className="mt-1 h-8 text-sm" value={evalForm.evaluatorName} onChange={e => setEvalForm(f => ({ ...f, evaluatorName: e.target.value }))} placeholder="Name or role" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Period</Label>
                  <Input className="mt-1 h-8 text-sm" value={evalForm.period} onChange={e => setEvalForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. Q2 2025" />
                </div>
              </div>

              {/* Score each criteria 1–10 */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Score Each Criteria (1–10)</p>
                {criteria.map(c => (
                  <div key={c.id} className="flex items-center gap-3 bg-white dark:bg-card border border-border/50 rounded-lg p-2.5">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-primary">{c.name}</span>
                      <span className="ml-1.5 text-[10px] text-muted-foreground">({c.weight}% weight)</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="range" min={1} max={10} step={1}
                        value={scores[String(c.id)] ?? 5}
                        onChange={e => setScores(s => ({ ...s, [String(c.id)]: parseInt(e.target.value) }))}
                        className="w-24 accent-orange-500"
                      />
                      <span className={`w-6 text-center text-xs font-bold ${(scores[String(c.id)] ?? 5) >= 7 ? "text-emerald-600" : (scores[String(c.id)] ?? 5) >= 4 ? "text-amber-600" : "text-red-600"}`}>
                        {scores[String(c.id)] ?? 5}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Score summary */}
              <div className="flex items-center gap-4 bg-white dark:bg-card border border-border/50 rounded-lg p-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">{overallScore}</p>
                  <p className="text-[10px] text-muted-foreground">Overall Score</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <Badge className={`text-xs border ${RECO_STYLE[recommendation]}`}>
                    {recommendation === "approved" ? "✓ Approved" : recommendation === "conditional" ? "⚠ Conditional" : "✗ Disqualified"}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {recommendation === "approved" ? "Score ≥ 80 — Approved supplier" : recommendation === "conditional" ? "Score 60–79 — Needs improvement plan" : "Score < 60 — Review required"}
                  </p>
                </div>
                <div className="flex-1" />
                <Textarea className="text-xs resize-none w-48 h-12" placeholder="Notes…" value={evalForm.notes} onChange={e => setEvalForm(f => ({ ...f, notes: e.target.value }))} />
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white shrink-0" onClick={() => {
                  createMut.mutate({
                    supplierId: selectedSupplierId,
                    isoProjectId,
                    evaluationDate: evalForm.evaluationDate,
                    evaluatorName: evalForm.evaluatorName,
                    period: evalForm.period,
                    notes: evalForm.notes,
                    overallScore,
                    recommendation,
                    scores,
                  });
                }} data-testid="button-submit-evaluation">Save Scorecard</Button>
              </div>
            </div>
          )}

          {showNewEval && criteria.length === 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              No selection criteria defined. Go to the <strong>Selection Criteria</strong> tab to add criteria before evaluating suppliers.
            </div>
          )}

          {/* Past evaluations */}
          {evaluations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No evaluations on record for {selectedSupplier?.name} yet.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Past Evaluations</p>
              {evaluations.map(ev => (
                <div key={ev.id} className="border border-border/60 rounded-xl p-3 bg-white dark:bg-card" data-testid={`evaluation-${ev.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-primary">{ev.period || ev.evaluationDate}</span>
                        <span className="text-[11px] text-muted-foreground">{ev.evaluationDate}</span>
                        {ev.evaluatorName && <span className="text-[11px] text-muted-foreground">· {ev.evaluatorName}</span>}
                        <Badge className={`text-[10px] border ${RECO_STYLE[ev.recommendation || "conditional"]}`}>
                          {ev.recommendation || "—"}
                        </Badge>
                      </div>
                      {ev.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{ev.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-black text-primary">{ev.overallScore ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">/ 100</p>
                      </div>
                      <button onClick={() => { if (confirm("Delete this evaluation?")) deleteMut.mutate(ev.id); }} className="p-1.5 rounded hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>IATF 16949 requires a risk-based supplier audit program. Use this tool to determine audit frequency per supplier based on objective risk criteria (§8.4.2).</span>
      </div>

      {/* Supplier selector */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground">Select Supplier</Label>
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
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Risk Factors</p>
              {RISK_FACTORS.map(rf => (
                <label key={rf.key} className={`flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg border transition-all ${factors[rf.key] ? "bg-red-50 border-red-200 dark:bg-red-950/20" : "border-border/50 hover:border-border bg-white dark:bg-card"}`} data-testid={`checkbox-risk-${rf.key}`}>
                  <input
                    type="checkbox"
                    checked={!!factors[rf.key]}
                    onChange={e => setFactors(f => ({ ...f, [rf.key]: e.target.checked }))}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-primary">{rf.label}</p>
                    <p className="text-[10px] text-muted-foreground">{rf.desc}</p>
                  </div>
                  <Badge className={`ml-auto text-[9px] shrink-0 ${factors[rf.key] ? "bg-red-100 text-red-700 border-red-200" : "bg-muted text-muted-foreground border-border/50"}`}>+{rf.weight}</Badge>
                </label>
              ))}
            </div>

            {/* Risk result + schedule */}
            <div className="space-y-3">
              {/* Risk score card */}
              <div className={`rounded-xl p-4 border text-center ${RISK_COLORS[riskLevel]} border-current/20`}>
                <p className="text-4xl font-black">{riskScore}</p>
                <p className="text-sm font-bold uppercase tracking-wide mt-1">{riskLevel} Risk</p>
                <p className="text-xs mt-2 font-semibold">Recommended Audit Frequency</p>
                <p className="text-lg font-black mt-0.5">{frequency}</p>
              </div>

              {/* Risk breakdown bar */}
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Risk Breakdown</p>
                {RISK_FACTORS.filter(rf => factors[rf.key]).map(rf => (
                  <div key={rf.key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground truncate flex-1">{rf.label}</span>
                    <Badge className="text-[9px] bg-red-100 text-red-700 border-red-200">+{rf.weight}</Badge>
                  </div>
                ))}
                {Object.values(factors).every(v => !v) && <p className="text-[11px] text-muted-foreground">No risk factors selected</p>}
              </div>

              {/* Schedule fields */}
              <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Audit Schedule</p>
                <div>
                  <Label className="text-xs font-semibold">Last Audit Date</Label>
                  <Input type="date" className="mt-1 h-8 text-sm" value={scheduleForm.lastAuditDate} onChange={e => setScheduleForm(f => ({ ...f, lastAuditDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Next Audit Date</Label>
                  <Input type="date" className="mt-1 h-8 text-sm" value={scheduleForm.nextAuditDate} onChange={e => setScheduleForm(f => ({ ...f, nextAuditDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Audit Status</Label>
                  <Select value={scheduleForm.auditStatus} onValueChange={v => setScheduleForm(f => ({ ...f, auditStatus: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_scheduled">Not Scheduled</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Notes</Label>
                  <Textarea className="mt-1 text-sm resize-none" rows={2} value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-white gap-1.5 text-xs" onClick={handleSave} disabled={upsertMut.isPending} data-testid="button-save-audit-schedule">
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
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">All Supplier Audit Records</p>
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
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
                        <Badge className={`text-[10px] ${RISK_COLORS[a.riskLevel || "medium"]}`}>{a.riskLevel || "—"} ({a.riskScore})</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{a.recommendedFrequency || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.nextAuditDate || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge className={`text-[10px] ${a.auditStatus === "overdue" ? "bg-red-100 text-red-700 border-red-200" : a.auditStatus === "scheduled" ? "bg-blue-100 text-blue-700 border-blue-200" : a.auditStatus === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}`}>
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
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${active ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
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
              {tab === "audits" && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">IATF 16949 §8.4.2</Badge>}
              {tab === "asl" && <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">ISO 9001 §8.4.1</Badge>}
              {tab === "criteria" && <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">ISO 9001 §8.4.1</Badge>}
              {tab === "evals" && <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">ISO 9001 §8.4.2</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tab === "asl" && "Maintain your Approved Supplier List with ISO certification tracking and expiry reminders."}
              {tab === "criteria" && "Define weighted criteria for supplier selection and qualification decisions."}
              {tab === "evals" && "Score suppliers against your criteria and generate formal evaluation scorecards."}
              {tab === "audits" && "Determine supplier audit frequency using a risk-based assessment per IATF 16949 §8.4.2."}
            </p>
          </div>

          {tab === "asl"      && <ApprovedSupplierList isoProjectId={isoProjectId} />}
          {tab === "criteria" && <SelectionCriteria isoProjectId={isoProjectId} />}
          {tab === "evals"    && <SupplierEvaluations isoProjectId={isoProjectId} />}
          {tab === "audits"   && isIATF && <SupplierAuditSchedule isoProjectId={isoProjectId} />}
        </div>
      </ScrollArea>
    </div>
  );
}
