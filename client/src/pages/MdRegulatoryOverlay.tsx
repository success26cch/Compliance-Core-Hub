import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { IsoProject, IsoComplianceObligation, MdRegulatoryEvidence } from "@shared/schema";
import {
  Plus, Trash2, Pencil, FileText, AlertTriangle, CheckCircle2,
  Clock, Shield, Activity, Database, CalendarDays, Loader2,
  Download, Upload, BookOpen, ChevronDown, ChevronUp, X,
  FlaskConical, AlertCircle, RefreshCw, ExternalLink, Paperclip,
  Archive, FileCheck, ClipboardList, Siren,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MdTab = "obligations" | "evidence" | "calendar" | "complaints";

interface Props {
  project: IsoProject | null | undefined;
  isoProjectId: number | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVIDENCE_TYPES = [
  { value: "complaint_evidence",       label: "Complaint Evidence" },
  { value: "validation_evidence",      label: "Validation Evidence" },
  { value: "regulatory_submission",    label: "Regulatory Submission" },
  { value: "adverse_event_record",     label: "Adverse Event Record" },
  { value: "investigation_attachment", label: "Investigation Attachment" },
  { value: "capa_evidence",            label: "CAPA Evidence" },
  { value: "audit_evidence",           label: "Audit Evidence" },
  { value: "post_market_surveillance", label: "Post-Market Surveillance" },
  { value: "retention_record",         label: "Retention Record" },
  { value: "other",                    label: "Other" },
];

const EVIDENCE_STATUS = [
  { value: "draft",     label: "Draft",     color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "active",    label: "Active",    color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "submitted", label: "Submitted", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "accepted",  label: "Accepted",  color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "rejected",  label: "Rejected",  color: "bg-red-100 text-red-700 border-red-200" },
  { value: "archived",  label: "Archived",  color: "bg-slate-100 text-slate-500 border-slate-200" },
];

const REGULATORY_FRAMEWORKS = [
  { value: "FDA_21CFR_820", label: "FDA 21 CFR Part 820 (QSR)" },
  { value: "FDA_MDR",       label: "FDA MDR — 21 CFR Part 803" },
  { value: "EU_MDR",        label: "EU MDR 2017/745" },
  { value: "EU_IVDR",       label: "EU IVDR 2017/746" },
  { value: "ISO_13485",     label: "ISO 13485:2016" },
  { value: "Health_Canada", label: "Health Canada CMDR" },
  { value: "Other",         label: "Other" },
];

const MD_COMPLAINT_CATEGORIES = [
  { value: "product_complaint",  label: "Product Complaint" },
  { value: "adverse_event",      label: "Adverse Event / Injury" },
  { value: "device_malfunction", label: "Device Malfunction" },
  { value: "use_error",          label: "Use Error / Human Factors" },
  { value: "labeling_issue",     label: "Labeling / IFU Issue" },
  { value: "sterility",          label: "Sterility Concern" },
  { value: "other",              label: "Other" },
];

const MD_SEVERITY_CLASSES = [
  { value: "class_iii_immediate", label: "Class III — Immediate (death / serious injury)", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "class_ii_5day",       label: "Class II — 5 Business Days (malfunction risk)", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "class_i_30day",       label: "Class I — 30 Calendar Days (serious injury/illness)", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "not_reportable",      label: "Not Reportable (document rationale)", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

const MD_CALENDAR_EVENT_TYPES = [
  "MDR 30-Day Adverse Event Report",
  "MDR 5-Day Malfunction Report",
  "EU MDR Serious Incident Report",
  "PSUR / Periodic Safety Update",
  "Post-Market Surveillance Review",
  "PMCF Report",
  "Annual QMS Management Review",
  "Internal Audit — ISO 13485",
  "Process Validation Review",
  "Design Review",
  "Supplier Re-qualification",
  "Record Retention Review",
  "FDA 510(k) Annual Report",
  "FDA Registration Renewal",
  "Other MD Regulatory Deadline",
];

// ─── Helper utilities ─────────────────────────────────────────────────────────

function statusBadge(status: string | null | undefined, map: { value: string; label: string; color: string }[], fallback = "bg-slate-100 text-slate-600 border-slate-200") {
  const s = map.find(x => x.value === status);
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s?.color ?? fallback}`}>{s?.label ?? status ?? "—"}</span>;
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function DeadlinePill({ dateStr }: { dateStr?: string | null }) {
  const days = daysUntil(dateStr);
  if (days === null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = days < 0 ? "text-red-700 bg-red-100 border-red-200"
    : days <= 5  ? "text-orange-700 bg-orange-100 border-orange-200"
    : days <= 30 ? "text-amber-700 bg-amber-100 border-amber-200"
    : "text-emerald-700 bg-emerald-100 border-emerald-200";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d`}
    </span>
  );
}

// ─── Tab: Regulatory Obligations ─────────────────────────────────────────────

function RegulatoryObligationsTab({ isoProjectId }: { isoProjectId: number | undefined }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterFramework, setFilterFramework] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editDialog, setEditDialog] = useState<IsoComplianceObligation | null | "new">(null);
  const [importLoading, setImportLoading] = useState(false);
  const [form, setForm] = useState<Partial<any>>({});

  const { data: allObligations = [], isLoading } = useQuery<IsoComplianceObligation[]>({
    queryKey: ["/api/iso-compliance-obligations", isoProjectId],
    queryFn: async () => {
      const url = isoProjectId
        ? `/api/iso-compliance-obligations?isoProjectId=${isoProjectId}`
        : "/api/iso-compliance-obligations";
      const r = await fetch(url, { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const obligations = allObligations.filter(o =>
    o.mdRegulatory === true || o.standard === "ISO 13485" || o.regulatoryFramework
  );

  const filtered = obligations.filter(o => {
    const txt = `${o.requirementName} ${o.citationSource} ${o.aspectCategory}`.toLowerCase();
    if (search && !txt.includes(search.toLowerCase())) return false;
    if (filterFramework !== "all" && o.regulatoryFramework !== filterFramework) return false;
    if (filterStatus !== "all" && o.complianceStatus !== filterStatus) return false;
    return true;
  });

  const patchMut = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/iso-compliance-obligations/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] }); toast({ title: "Obligation updated" }); setEditDialog(null); },
    onError: () => toast({ title: "Error", description: "Could not update", variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/iso-compliance-obligations", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] }); toast({ title: "Obligation added" }); setEditDialog(null); },
    onError: () => toast({ title: "Error", description: "Could not create", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-compliance-obligations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] }); toast({ title: "Deleted" }); },
  });

  async function importMdLibrary() {
    setImportLoading(true);
    try {
      const body: any = {};
      if (isoProjectId) body.isoProjectId = isoProjectId;
      const r = await apiRequest("POST", "/api/iso-compliance-obligations/bulk-md", body) as any;
      const data = await r.json?.() ?? r;
      toast({ title: "MD Starter Library Imported", description: `${data.created?.length ?? 0} obligations added, ${data.skipped ?? 0} skipped (already present)` });
      qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] });
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
    setImportLoading(false);
  }

  function openEdit(o: IsoComplianceObligation | "new") {
    setEditDialog(o);
    setForm(o === "new" ? { standard: "ISO 13485", mdRegulatory: true, complianceStatus: "compliant", validationRequired: false } : { ...o });
  }

  function handleSave() {
    if (!editDialog) return;
    if (editDialog === "new") createMut.mutate({ ...form, standard: "ISO 13485", mdRegulatory: true, isoProjectId: isoProjectId ?? null });
    else patchMut.mutate({ id: (editDialog as IsoComplianceObligation).id, data: form });
  }

  const complianceColors: Record<string, string> = {
    compliant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    "partial": "bg-amber-100 text-amber-700 border-amber-200",
    "non_compliant": "bg-red-100 text-red-700 border-red-200",
    "not_applicable": "bg-slate-100 text-slate-500 border-slate-200",
    "in_progress": "bg-blue-100 text-blue-700 border-blue-200",
  };

  const stats = {
    total: obligations.length,
    compliant: obligations.filter(o => o.complianceStatus === "compliant").length,
    partial: obligations.filter(o => o.complianceStatus === "partial").length,
    nonCompliant: obligations.filter(o => o.complianceStatus === "non_compliant").length,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Obligations", value: stats.total, color: "text-primary" },
          { label: "Compliant", value: stats.compliant, color: "text-emerald-600" },
          { label: "Partial / In-Progress", value: stats.partial, color: "text-amber-600" },
          { label: "Non-Compliant", value: stats.nonCompliant, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label} className="p-3">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input className="h-8 text-xs w-60" placeholder="Search obligations…" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-md-oblig-search" />
        <Select value={filterFramework} onValueChange={setFilterFramework}>
          <SelectTrigger className="h-8 text-xs w-44" data-testid="select-md-oblig-framework"><SelectValue placeholder="Framework" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {REGULATORY_FRAMEWORKS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-40" data-testid="select-md-oblig-status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
            <SelectItem value="not_applicable">Not Applicable</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={importMdLibrary} disabled={importLoading} data-testid="btn-import-md-library">
            {importLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
            Import MD Starter Library
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-accent text-white hover:bg-accent/90" onClick={() => openEdit("new")} data-testid="btn-add-md-obligation">
            <Plus className="w-3 h-3" />Add Obligation
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl text-center">
          <Shield className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm">No medical device regulatory obligations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Import the MD Starter Library or add obligations manually.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/40">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Requirement</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Framework</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Reporting Timeline</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Validation</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Owner</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Links</th>
                <th className="px-1 py-2 w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const isExpanded = expandedId === o.id;
                const fw = REGULATORY_FRAMEWORKS.find(f => f.value === o.regulatoryFramework);
                return [
                  <tr key={`row-${o.id}`} className="border-b border-border/20 hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <button className="shrink-0">{isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
                        <span className="font-medium text-xs leading-snug">{o.requirementName}</span>
                      </div>
                      {o.citationSource && <p className="text-[10px] text-muted-foreground ml-5">{o.citationSource}</p>}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-semibold">{fw?.label ?? o.regulatoryFramework ?? "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{o.reportingTimeline ?? "—"}</td>
                    <td className="px-3 py-2">{o.validationRequired ? <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">Required</Badge> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${complianceColors[o.complianceStatus] ?? complianceColors["in_progress"]}`}>
                        {o.complianceStatus?.replace(/_/g, " ") ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{o.responsiblePerson ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        {o.linkedCapaNumber && <span className="text-[10px] text-accent font-semibold">CAPA: {o.linkedCapaNumber}</span>}
                        {o.nextReviewDate && <span className="text-[10px] text-muted-foreground">Review: {o.nextReviewDate}</span>}
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button className="p-1 hover:bg-muted rounded" onClick={() => openEdit(o)} data-testid={`btn-edit-oblig-${o.id}`}><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                        <button className="p-1 hover:bg-muted rounded" onClick={() => deleteMut.mutate(o.id)} data-testid={`btn-del-oblig-${o.id}`}><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>,
                  isExpanded && (
                    <tr key={`exp-${o.id}`} className="bg-slate-50/70 dark:bg-slate-800/20 border-b border-border/20">
                      <td colSpan={8} className="px-6 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Description / Requirement</p>
                            <p className="text-xs">{o.descriptionOfRequirement ?? "No description provided."}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Facility Action / Controls</p>
                            <p className="text-xs">{o.facilityAction ?? o.actionRequired ?? "—"}</p>
                          </div>
                          {o.notes && (
                            <div className="col-span-2">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                              <p className="text-xs">{o.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog !== null} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog === "new" ? "Add MD Regulatory Obligation" : "Edit Obligation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Requirement Name *</Label>
                <Input className="mt-1 text-xs h-8" value={form.requirementName ?? ""} onChange={e => setForm(f => ({ ...f, requirementName: e.target.value }))} data-testid="input-md-oblig-name" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Citation / Source</Label>
                <Input className="mt-1 text-xs h-8" placeholder="21 CFR 820.100" value={form.citationSource ?? ""} onChange={e => setForm(f => ({ ...f, citationSource: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Regulatory Framework</Label>
                <Select value={form.regulatoryFramework ?? ""} onValueChange={v => setForm(f => ({ ...f, regulatoryFramework: v }))}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Select framework" /></SelectTrigger>
                  <SelectContent>{REGULATORY_FRAMEWORKS.map(fw => <SelectItem key={fw.value} value={fw.value}>{fw.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Aspect Category</Label>
                <Input className="mt-1 text-xs h-8" placeholder="Complaint Handling" value={form.aspectCategory ?? ""} onChange={e => setForm(f => ({ ...f, aspectCategory: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Reporting Timeline</Label>
                <Input className="mt-1 text-xs h-8" placeholder="30 calendar days" value={form.reportingTimeline ?? ""} onChange={e => setForm(f => ({ ...f, reportingTimeline: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Compliance Status</Label>
                <Select value={form.complianceStatus ?? "compliant"} onValueChange={v => setForm(f => ({ ...f, complianceStatus: v }))}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Responsible Person</Label>
                <Input className="mt-1 text-xs h-8" value={form.responsiblePerson ?? ""} onChange={e => setForm(f => ({ ...f, responsiblePerson: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Next Review Date</Label>
                <Input type="date" className="mt-1 text-xs h-8" value={form.nextReviewDate ?? ""} onChange={e => setForm(f => ({ ...f, nextReviewDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Linked CAPA Number</Label>
                <Input className="mt-1 text-xs h-8" placeholder="CAR-2026-0001" value={form.linkedCapaNumber ?? ""} onChange={e => setForm(f => ({ ...f, linkedCapaNumber: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={!!form.validationRequired} onCheckedChange={v => setForm(f => ({ ...f, validationRequired: v }))} data-testid="switch-md-oblig-validation" />
                <Label className="text-xs font-semibold">Validation Required</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Description / Requirement Detail</Label>
                <Textarea className="mt-1 text-xs" rows={3} value={form.descriptionOfRequirement ?? ""} onChange={e => setForm(f => ({ ...f, descriptionOfRequirement: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Facility Action / Controls</Label>
                <Textarea className="mt-1 text-xs" rows={2} value={form.facilityAction ?? ""} onChange={e => setForm(f => ({ ...f, facilityAction: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Notes</Label>
                <Textarea className="mt-1 text-xs" rows={2} value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button size="sm" className="bg-accent text-white hover:bg-accent/90" onClick={handleSave} disabled={patchMut.isPending || createMut.isPending} data-testid="btn-save-md-obligation">
                {(patchMut.isPending || createMut.isPending) ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Evidence Repository ─────────────────────────────────────────────────

export function EvidenceRepositoryTab({ isoProjectId }: { isoProjectId: number | undefined }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState<MdRegulatoryEvidence | "new" | null>(null);
  const [viewDialog, setViewDialog] = useState<MdRegulatoryEvidence | null>(null);
  const [form, setForm] = useState<Partial<any>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<MdRegulatoryEvidence[]>({
    queryKey: ["/api/md-regulatory-evidence", isoProjectId],
    queryFn: async () => {
      const url = isoProjectId ? `/api/md-regulatory-evidence?isoProjectId=${isoProjectId}` : "/api/md-regulatory-evidence";
      const r = await fetch(url, { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const filtered = items.filter(i => {
    if (filterType !== "all" && i.evidenceType !== filterType) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    const txt = `${i.title} ${i.referenceNumber} ${i.description} ${i.submittedTo}`.toLowerCase();
    if (search && !txt.includes(search.toLowerCase())) return false;
    return true;
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/md-regulatory-evidence", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/md-regulatory-evidence"] }); toast({ title: "Evidence record created" }); setEditDialog(null); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const patchMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/md-regulatory-evidence/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/md-regulatory-evidence"] }); toast({ title: "Updated" }); setEditDialog(null); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/md-regulatory-evidence/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/md-regulatory-evidence"] }); toast({ title: "Deleted" }); },
  });

  function openEdit(item: MdRegulatoryEvidence | "new") {
    setEditDialog(item);
    setForm(item === "new" ? { status: "draft", evidenceType: "other", retentionYears: 5 } : { ...item });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, fileData: ev.target?.result as string, fileName: file.name, fileType: file.type }));
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (editDialog === "new") createMut.mutate({ ...form, isoProjectId: isoProjectId ?? null });
    else if (editDialog) patchMut.mutate({ id: (editDialog as MdRegulatoryEvidence).id, data: form });
  }

  const typeSummary = EVIDENCE_TYPES.map(t => ({ ...t, count: items.filter(i => i.evidenceType === t.value).length })).filter(t => t.count > 0);

  return (
    <div className="p-4 space-y-4">
      {/* Type summary chips */}
      {typeSummary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {typeSummary.map(t => (
            <button key={t.value} onClick={() => setFilterType(filterType === t.value ? "all" : t.value)}
              className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors ${filterType === t.value ? "bg-accent text-white border-accent" : "bg-muted/40 text-muted-foreground border-border/60 hover:border-accent/40"}`}
              data-testid={`btn-filter-evid-${t.value}`}>
              {t.label} <span className="ml-1 opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input className="h-8 text-xs w-56" placeholder="Search evidence…" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-evid-search" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {EVIDENCE_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto h-8 text-xs gap-1.5 bg-accent text-white hover:bg-accent/90" onClick={() => openEdit("new")} data-testid="btn-add-evidence">
          <Plus className="w-3 h-3" />Add Evidence Record
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl text-center">
          <Database className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm">No evidence records yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add complaint evidence, validation packages, regulatory submissions, and more.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/40">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Title</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Ref #</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Submitted To</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Retention Until</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Related</th>
                <th className="px-1 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const evType = EVIDENCE_TYPES.find(t => t.value === item.evidenceType);
                return (
                  <tr key={item.id} className="border-b border-border/20 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-medium">{item.title}</div>
                      {item.description && <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{item.description}</div>}
                    </td>
                    <td className="px-3 py-2"><span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-semibold">{evType?.label ?? item.evidenceType}</span></td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{item.referenceNumber ?? "—"}</td>
                    <td className="px-3 py-2">{statusBadge(item.status, EVIDENCE_STATUS)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.submittedTo ?? "—"}</td>
                    <td className="px-3 py-2">
                      {item.retentionUntil ? (
                        <div>
                          <div className="text-[10px]">{item.retentionUntil}</div>
                          <DeadlinePill dateStr={item.retentionUntil} />
                        </div>
                      ) : item.retentionYears ? (
                        <span className="text-[10px] text-muted-foreground">{item.retentionYears} yr retention</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        {item.relatedCapaNumber && <span className="text-[10px] text-accent font-semibold">CAPA: {item.relatedCapaNumber}</span>}
                        {item.relatedComplaintId && <span className="text-[10px] text-muted-foreground">NC #{item.relatedComplaintId}</span>}
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <div className="flex gap-1">
                        {item.fileData && (
                          <button className="p-1 hover:bg-muted rounded" title="Download file" onClick={() => {
                            const a = document.createElement("a"); a.href = item.fileData!; a.download = item.fileName ?? "evidence"; a.click();
                          }} data-testid={`btn-download-evid-${item.id}`}><Download className="w-3 h-3 text-muted-foreground" /></button>
                        )}
                        <button className="p-1 hover:bg-muted rounded" onClick={() => setViewDialog(item)} data-testid={`btn-view-evid-${item.id}`}><FileCheck className="w-3 h-3 text-muted-foreground" /></button>
                        <button className="p-1 hover:bg-muted rounded" onClick={() => openEdit(item)} data-testid={`btn-edit-evid-${item.id}`}><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                        <button className="p-1 hover:bg-muted rounded" onClick={() => deleteMut.mutate(item.id)} data-testid={`btn-del-evid-${item.id}`}><Trash2 className="w-3 h-3 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewDialog?.title}</DialogTitle></DialogHeader>
          {viewDialog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Type</p><p>{EVIDENCE_TYPES.find(t=>t.value===viewDialog.evidenceType)?.label}</p></div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>{statusBadge(viewDialog.status, EVIDENCE_STATUS)}</div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Reference #</p><p className="font-mono text-xs">{viewDialog.referenceNumber ?? "—"}</p></div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Submitted To</p><p>{viewDialog.submittedTo ?? "—"}</p></div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Submission Date</p><p>{viewDialog.submissionDate ?? "—"}</p></div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Retention Until</p><p>{viewDialog.retentionUntil ?? `${viewDialog.retentionYears ?? "—"} years`}</p></div>
              </div>
              {viewDialog.description && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Description</p><p className="text-xs">{viewDialog.description}</p></div>}
              {viewDialog.notes && <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Notes</p><p className="text-xs">{viewDialog.notes}</p></div>}
              {viewDialog.fileData && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { const a = document.createElement("a"); a.href = viewDialog.fileData!; a.download = viewDialog.fileName ?? "evidence"; a.click(); }}>
                  <Download className="w-3 h-3" />{viewDialog.fileName ?? "Download File"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog !== null} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editDialog === "new" ? "Add Evidence Record" : "Edit Evidence Record"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Title *</Label>
                <Input className="mt-1 text-xs h-8" value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-evid-title" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Evidence Type</Label>
                <Select value={form.evidenceType ?? "other"} onValueChange={v => setForm(f => ({ ...f, evidenceType: v }))}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVIDENCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={form.status ?? "draft"} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVIDENCE_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Reference Number</Label>
                <Input className="mt-1 text-xs h-8 font-mono" placeholder="MDR-2026-001" value={form.referenceNumber ?? ""} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Submitted To</Label>
                <Input className="mt-1 text-xs h-8" placeholder="FDA, EU Notified Body…" value={form.submittedTo ?? ""} onChange={e => setForm(f => ({ ...f, submittedTo: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Submission Date</Label>
                <Input type="date" className="mt-1 text-xs h-8" value={form.submissionDate ?? ""} onChange={e => setForm(f => ({ ...f, submissionDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Retention Until</Label>
                <Input type="date" className="mt-1 text-xs h-8" value={form.retentionUntil ?? ""} onChange={e => setForm(f => ({ ...f, retentionUntil: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Retention Years (min)</Label>
                <Input type="number" className="mt-1 text-xs h-8" value={form.retentionYears ?? ""} onChange={e => setForm(f => ({ ...f, retentionYears: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Related CAPA Number</Label>
                <Input className="mt-1 text-xs h-8 font-mono" placeholder="CAR-2026-0001" value={form.relatedCapaNumber ?? ""} onChange={e => setForm(f => ({ ...f, relatedCapaNumber: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold">Related Complaint / NC ID</Label>
                <Input type="number" className="mt-1 text-xs h-8" value={form.relatedComplaintId ?? ""} onChange={e => setForm(f => ({ ...f, relatedComplaintId: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea className="mt-1 text-xs" rows={3} value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Notes</Label>
                <Textarea className="mt-1 text-xs" rows={2} value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Attach File</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-3 h-3" />Choose File
                  </Button>
                  {form.fileName && <span className="text-xs text-muted-foreground truncate">{form.fileName}</span>}
                  <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button size="sm" className="bg-accent text-white hover:bg-accent/90" onClick={handleSave} disabled={createMut.isPending || patchMut.isPending} data-testid="btn-save-evidence">
                {(createMut.isPending || patchMut.isPending) && <Loader2 className="w-3 h-3 animate-spin mr-1" />}Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Regulatory Calendar ─────────────────────────────────────────────────

export function RegulatoryCalendarTab({ isoProjectId }: { isoProjectId: number | undefined }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState<any>({ status: "upcoming", eventType: "deadline", standardCategory: "md_regulatory" });

  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/compliance-calendar", isoProjectId],
    queryFn: async () => {
      const url = isoProjectId ? `/api/compliance-calendar?isoProjectId=${isoProjectId}` : "/api/compliance-calendar";
      const r = await fetch(url, { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const mdEvents = events.filter(e =>
    e.standardCategory === "md_regulatory" ||
    e.standardCategory === "iso_13485" ||
    e.title?.toLowerCase().includes("mdr") ||
    e.title?.toLowerCase().includes("fda") ||
    e.title?.toLowerCase().includes("eu mdr") ||
    e.title?.toLowerCase().includes("psur") ||
    e.title?.toLowerCase().includes("pms")
  );

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/compliance-calendar", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/compliance-calendar"] }); toast({ title: "Calendar event added" }); setAddDialog(false); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const patchStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/compliance-calendar/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/compliance-calendar"] }); toast({ title: "Status updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/compliance-calendar/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/compliance-calendar"] }); toast({ title: "Event removed" }); },
  });

  const overdue  = mdEvents.filter(e => e.status === "overdue" || daysUntil(e.dueDate) !== null && daysUntil(e.dueDate)! < 0);
  const upcoming = mdEvents.filter(e => e.status !== "completed" && (daysUntil(e.dueDate) ?? 1) >= 0);
  const done     = mdEvents.filter(e => e.status === "completed");

  return (
    <div className="p-4 space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border-red-200 dark:border-red-800/40">
          <p className="text-2xl font-black text-red-600">{overdue.length}</p>
          <p className="text-xs text-muted-foreground">Overdue / Past Deadline</p>
        </Card>
        <Card className="p-3 border-amber-200 dark:border-amber-800/40">
          <p className="text-2xl font-black text-amber-600">{upcoming.filter(e => (daysUntil(e.dueDate) ?? 99) <= 30).length}</p>
          <p className="text-xs text-muted-foreground">Due Within 30 Days</p>
        </Card>
        <Card className="p-3 border-emerald-200 dark:border-emerald-800/40">
          <p className="text-2xl font-black text-emerald-600">{done.length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Showing FDA / MDR / ISO 13485 regulatory deadlines from your Compliance Calendar</p>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-accent text-white hover:bg-accent/90" onClick={() => setAddDialog(true)} data-testid="btn-add-md-calendar">
          <Plus className="w-3 h-3" />Add MD Deadline
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : mdEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm">No MD regulatory deadlines</p>
          <p className="text-xs text-muted-foreground mt-1">Add FDA reporting deadlines, MDR timelines, PSUR schedules, and more.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...overdue, ...upcoming, ...done].map(ev => {
            const days = daysUntil(ev.dueDate);
            const isOver = days !== null && days < 0 && ev.status !== "completed";
            return (
              <div key={ev.id} className={`rounded-xl border p-3 flex items-start gap-3 ${isOver ? "border-red-200 bg-red-50/50 dark:border-red-800/40 dark:bg-red-950/20" : ev.status === "completed" ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/40" : "border-border/50"}`}>
                <div className="shrink-0 mt-0.5">
                  {ev.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : isOver ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Clock className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-xs">{ev.title}</p>
                    <DeadlinePill dateStr={ev.dueDate} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ev.dueDate} {ev.responsiblePerson && `· ${ev.responsiblePerson}`}</p>
                  {ev.description && <p className="text-[10px] text-muted-foreground mt-0.5">{ev.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {ev.status !== "completed" && (
                    <button className="p-1 hover:bg-muted rounded text-[10px] text-emerald-600 font-semibold" onClick={() => patchStatusMut.mutate({ id: ev.id, status: "completed" })} data-testid={`btn-complete-mdev-${ev.id}`}>✓ Done</button>
                  )}
                  <button className="p-1 hover:bg-muted rounded" onClick={() => deleteMut.mutate(ev.id)} data-testid={`btn-del-mdev-${ev.id}`}><Trash2 className="w-3 h-3 text-red-400" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add MD Regulatory Deadline</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Event Title</Label>
              <Select value={form.title ?? ""} onValueChange={v => setForm((f: any) => ({ ...f, title: v }))}>
                <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Select or type below" /></SelectTrigger>
                <SelectContent>{MD_CALENDAR_EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="mt-1 text-xs h-8" placeholder="Or type custom title…" value={form.title ?? ""} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} data-testid="input-md-cal-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Due Date *</Label>
                <Input type="date" className="mt-1 text-xs h-8" value={form.dueDate ?? ""} onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))} data-testid="input-md-cal-due" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Responsible Person</Label>
                <Input className="mt-1 text-xs h-8" value={form.responsiblePerson ?? ""} onChange={e => setForm((f: any) => ({ ...f, responsiblePerson: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea className="mt-1 text-xs" rows={2} value={form.description ?? ""} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setAddDialog(false)}>Cancel</Button>
              <Button size="sm" className="bg-accent text-white hover:bg-accent/90" disabled={!form.title || !form.dueDate || createMut.isPending}
                onClick={() => createMut.mutate({ ...form, standardCategory: "md_regulatory", eventType: "deadline", isoProjectId: isoProjectId ?? null })}
                data-testid="btn-save-md-calendar">
                {createMut.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}Add Deadline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Complaint Escalation ────────────────────────────────────────────────

export function ComplaintEscalationTab({ isoProjectId }: { isoProjectId: number | undefined }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editDialog, setEditDialog] = useState<any | null>(null);
  const [mdForm, setMdForm] = useState<Partial<any>>({});
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const { data: allNcs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/nonconformances"],
    queryFn: async () => {
      const r = await fetch("/api/nonconformances", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const complaints = allNcs.filter(nc => nc.sourceType === "customer_complaint" || nc.mdComplaintCategory);

  const filtered = complaints.filter(c => {
    if (filterSeverity !== "all" && c.mdSeverityClass !== filterSeverity) return false;
    const txt = `${c.title} ${c.ncNumber} ${c.description}`.toLowerCase();
    if (search && !txt.includes(search.toLowerCase())) return false;
    return true;
  });

  const patchMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/nonconformances/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/nonconformances"] }); toast({ title: "Complaint MD fields updated" }); setEditDialog(null); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  function openEdit(c: any) {
    setEditDialog(c);
    setMdForm({
      mdComplaintCategory: c.mdComplaintCategory ?? "",
      mdSeverityClass: c.mdSeverityClass ?? "",
      requiresRegulatoryReport: c.requiresRegulatoryReport ?? false,
      reportingDeadline: c.reportingDeadline ?? "",
      reportSubmitted: c.reportSubmitted ?? false,
      reportSubmissionDate: c.reportSubmissionDate ?? "",
      reportReferenceNumber: c.reportReferenceNumber ?? "",
      escalationTriggered: c.escalationTriggered ?? false,
      escalationDate: c.escalationDate ?? "",
      escalationNotes: c.escalationNotes ?? "",
      regulatoryApprovalRequired: c.regulatoryApprovalRequired ?? false,
      regulatoryApprovedBy: c.regulatoryApprovedBy ?? "",
      regulatoryApprovalDate: c.regulatoryApprovalDate ?? "",
    });
  }

  const pendingReports = complaints.filter(c => c.requiresRegulatoryReport && !c.reportSubmitted);
  const overdueReports = pendingReports.filter(c => daysUntil(c.reportingDeadline) !== null && daysUntil(c.reportingDeadline)! < 0);
  const escalated     = complaints.filter(c => c.escalationTriggered && !c.reportSubmitted);

  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-2xl font-black text-primary">{complaints.length}</p>
          <p className="text-xs text-muted-foreground">Total MD Complaints</p>
        </Card>
        <Card className="p-3 border-red-200 dark:border-red-800/40">
          <p className="text-2xl font-black text-red-600">{overdueReports.length}</p>
          <p className="text-xs text-muted-foreground">Overdue Reports</p>
        </Card>
        <Card className="p-3 border-amber-200 dark:border-amber-800/40">
          <p className="text-2xl font-black text-amber-600">{pendingReports.length}</p>
          <p className="text-xs text-muted-foreground">Pending Regulatory Reports</p>
        </Card>
        <Card className="p-3 border-orange-200 dark:border-orange-800/40">
          <p className="text-2xl font-black text-orange-600">{escalated.length}</p>
          <p className="text-xs text-muted-foreground">Escalated</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input className="h-8 text-xs w-56" placeholder="Search complaints…" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-complaint-search" />
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="h-8 text-xs w-52"><SelectValue placeholder="Severity Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity Classes</SelectItem>
            {MD_SEVERITY_CLASSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="ml-auto text-xs text-muted-foreground">Complaints managed in NC &amp; CAPA · Click to update MD regulatory fields</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl text-center">
          <ClipboardList className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="font-medium text-sm">No customer complaints logged</p>
          <p className="text-xs text-muted-foreground mt-1">Customer complaints are logged in NC &amp; CAPA with source type "Customer Complaint".</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/40">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Complaint</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">MD Category</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Severity Class</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Regulatory Report</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Deadline</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Escalation</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">CAPA</th>
                <th className="px-1 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const sevClass = MD_SEVERITY_CLASSES.find(s => s.value === c.mdSeverityClass);
                const cat = MD_COMPLAINT_CATEGORIES.find(x => x.value === c.mdComplaintCategory);
                const needsReport = c.requiresRegulatoryReport && !c.reportSubmitted;
                return (
                  <tr key={c.id} className={`border-b border-border/20 hover:bg-muted/30 ${needsReport && daysUntil(c.reportingDeadline) !== null && daysUntil(c.reportingDeadline)! < 0 ? "bg-red-50/40 dark:bg-red-950/10" : ""}`}>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{c.ncNumber ?? `NC-${c.id}`}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{c.title}</div>
                    </td>
                    <td className="px-3 py-2">{cat ? <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 px-2 py-0.5 rounded font-semibold">{cat.label}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">{sevClass ? <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sevClass.color}`}>{sevClass.label.split(" — ")[0]}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2">
                      {c.requiresRegulatoryReport ? (
                        c.reportSubmitted ? (
                          <div>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full border">Submitted</span>
                            {c.reportReferenceNumber && <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.reportReferenceNumber}</div>}
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-red-700 bg-red-50 border-red-200 px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit"><Siren className="w-2.5 h-2.5" />Required</span>
                        )
                      ) : <span className="text-muted-foreground">Not Required</span>}
                    </td>
                    <td className="px-3 py-2"><DeadlinePill dateStr={c.reportingDeadline} /></td>
                    <td className="px-3 py-2">
                      {c.escalationTriggered ? (
                        <div>
                          <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border-orange-200 px-2 py-0.5 rounded-full border">Escalated</span>
                          {c.escalationDate && <div className="text-[10px] text-muted-foreground mt-0.5">{c.escalationDate}</div>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">{c.capaNumber ? <span className="text-[10px] text-accent font-semibold">{c.capaNumber}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-1 py-2">
                      <button className="p-1 hover:bg-muted rounded" onClick={() => openEdit(c)} data-testid={`btn-md-complaint-${c.id}`}><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MD Fields Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>MD Regulatory Fields — {editDialog?.ncNumber ?? editDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
              These ISO 13485 / medical device regulatory fields extend the complaint record in NC &amp; CAPA. Use this panel to classify the complaint, set reporting requirements, and track escalation.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">MD Complaint Category</Label>
                <Select value={mdForm.mdComplaintCategory ?? ""} onValueChange={v => setMdForm(f => ({ ...f, mdComplaintCategory: v }))}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{MD_COMPLAINT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">MDR Severity Class</Label>
                <Select value={mdForm.mdSeverityClass ?? ""} onValueChange={v => {
                  const deadlineDays = v === "class_iii_immediate" ? 0 : v === "class_ii_5day" ? 5 : v === "class_i_30day" ? 30 : null;
                  const deadline = deadlineDays !== null ? new Date(Date.now() + deadlineDays * 86400000).toISOString().split("T")[0] : "";
                  const needsReport = v !== "not_reportable" && v !== "";
                  setMdForm(f => ({ ...f, mdSeverityClass: v, requiresRegulatoryReport: needsReport, reportingDeadline: deadline || f.reportingDeadline }));
                }}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>{MD_SEVERITY_CLASSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="col-span-2 border-t pt-3 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Regulatory Reporting</p>
                <div className="flex items-center gap-3">
                  <Switch checked={!!mdForm.requiresRegulatoryReport} onCheckedChange={v => setMdForm(f => ({ ...f, requiresRegulatoryReport: v }))} data-testid="switch-requires-report" />
                  <Label className="text-xs font-semibold">Regulatory Report Required (MDR / Vigilance)</Label>
                </div>
                {mdForm.requiresRegulatoryReport && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Reporting Deadline</Label>
                      <Input type="date" className="mt-1 text-xs h-8" value={mdForm.reportingDeadline ?? ""} onChange={e => setMdForm(f => ({ ...f, reportingDeadline: e.target.value }))} data-testid="input-report-deadline" />
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <Switch checked={!!mdForm.reportSubmitted} onCheckedChange={v => setMdForm(f => ({ ...f, reportSubmitted: v }))} data-testid="switch-report-submitted" />
                      <Label className="text-xs font-semibold">Report Submitted</Label>
                    </div>
                    {mdForm.reportSubmitted && (
                      <>
                        <div>
                          <Label className="text-xs font-semibold">Submission Date</Label>
                          <Input type="date" className="mt-1 text-xs h-8" value={mdForm.reportSubmissionDate ?? ""} onChange={e => setMdForm(f => ({ ...f, reportSubmissionDate: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Report Reference Number</Label>
                          <Input className="mt-1 text-xs h-8 font-mono" placeholder="FDA MDR#, EU Ref#…" value={mdForm.reportReferenceNumber ?? ""} onChange={e => setMdForm(f => ({ ...f, reportReferenceNumber: e.target.value }))} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-2 border-t pt-3 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Escalation</p>
                <div className="flex items-center gap-3">
                  <Switch checked={!!mdForm.escalationTriggered} onCheckedChange={v => setMdForm(f => ({ ...f, escalationTriggered: v, escalationDate: v ? new Date().toISOString().split("T")[0] : f.escalationDate }))} data-testid="switch-escalation" />
                  <Label className="text-xs font-semibold">Escalation Triggered</Label>
                </div>
                {mdForm.escalationTriggered && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Escalation Date</Label>
                      <Input type="date" className="mt-1 text-xs h-8" value={mdForm.escalationDate ?? ""} onChange={e => setMdForm(f => ({ ...f, escalationDate: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold">Escalation Notes</Label>
                      <Textarea className="mt-1 text-xs" rows={2} value={mdForm.escalationNotes ?? ""} onChange={e => setMdForm(f => ({ ...f, escalationNotes: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 border-t pt-3 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Regulatory Approval Workflow</p>
                <div className="flex items-center gap-3">
                  <Switch checked={!!mdForm.regulatoryApprovalRequired} onCheckedChange={v => setMdForm(f => ({ ...f, regulatoryApprovalRequired: v }))} data-testid="switch-reg-approval" />
                  <Label className="text-xs font-semibold">Requires Regulatory Affairs Approval before Closure</Label>
                </div>
                {mdForm.regulatoryApprovalRequired && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Approved By</Label>
                      <Input className="mt-1 text-xs h-8" value={mdForm.regulatoryApprovedBy ?? ""} onChange={e => setMdForm(f => ({ ...f, regulatoryApprovedBy: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Approval Date</Label>
                      <Input type="date" className="mt-1 text-xs h-8" value={mdForm.regulatoryApprovalDate ?? ""} onChange={e => setMdForm(f => ({ ...f, regulatoryApprovalDate: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button size="sm" className="bg-accent text-white hover:bg-accent/90" disabled={patchMut.isPending}
                onClick={() => patchMut.mutate({ id: editDialog.id, data: mdForm })} data-testid="btn-save-md-complaint">
                {patchMut.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}Save MD Fields
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

const MD_TABS: { key: MdTab; label: string; icon: any; desc: string }[] = [
  { key: "obligations", label: "Regulatory Obligations", icon: Shield,       desc: "FDA / MDR / ISO 13485" },
  { key: "evidence",    label: "Evidence Repository",    icon: Database,      desc: "Records & submissions" },
  { key: "calendar",    label: "Regulatory Calendar",    icon: CalendarDays,  desc: "Deadlines & timelines" },
  { key: "complaints",  label: "Complaint Escalation",   icon: AlertCircle,   desc: "MDR / vigilance" },
];

export default function MdRegulatoryOverlay({ project, isoProjectId }: Props) {
  const [activeTab, setActiveTab] = useState<MdTab>("obligations");

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border/40 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-primary">Medical Device Regulatory Overlay</h2>
            <p className="text-[10px] text-muted-foreground">ISO 13485 · FDA 21 CFR 820 · EU MDR 2017/745 — extends existing compliance &amp; CAPA engine</p>
          </div>
          <Badge className="ml-auto text-[10px] bg-blue-100 text-blue-700 border-blue-200">ISO 13485 Active</Badge>
        </div>
        {/* Sub-tab bar */}
        <div className="flex items-end gap-1 overflow-x-auto">
          {MD_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-medium border-x border-t transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-white dark:bg-slate-950 border-border/50 border-b-white dark:border-b-slate-950 text-foreground -mb-px z-10"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/30"
                }`}
                data-testid={`tab-md-${tab.key}`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className="text-muted-foreground font-normal">{tab.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "obligations" && <RegulatoryObligationsTab isoProjectId={isoProjectId} />}
        {activeTab === "evidence"    && <EvidenceRepositoryTab isoProjectId={isoProjectId} />}
        {activeTab === "calendar"    && <RegulatoryCalendarTab isoProjectId={isoProjectId} />}
        {activeTab === "complaints"  && <ComplaintEscalationTab isoProjectId={isoProjectId} />}
      </div>
    </div>
  );
}
