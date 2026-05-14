import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, Loader2, ShieldCheck, AlertTriangle, Trash2,
  Pencil, Filter, Printer, ClipboardList, HardHat,
  ChevronDown, ChevronRight, CheckCircle2, X, RefreshCw,
  Users, Zap, FlaskConical, Activity, Brain, Flame, Settings, Leaf,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HazardRecord {
  id: number;
  workArea: string | null;
  activityTask: string;
  hazardDescription: string;
  hazardType: string;
  operatingCondition: string;
  whoAffected: string[] | null;
  consequenceDescription: string | null;
  existingControls: string | null;
  likelihood: number;
  severity: number;
  riskScore: number;
  riskLevel: string;
  controlHierarchy: string[] | null;
  plannedControls: string | null;
  residualLikelihood: number;
  residualSeverity: number;
  residualRiskScore: number;
  residualRiskLevel: string;
  actionRequired: string | null;
  responsiblePerson: string | null;
  targetDate: string | null;
  status: string;
  legalRequirement: string | null;
  iso45001Clause: string | null;
  notes: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HAZARD_TYPES = [
  { value: "physical",      label: "Physical",        icon: Activity },
  { value: "chemical",      label: "Chemical",        icon: FlaskConical },
  { value: "biological",    label: "Biological",      icon: Leaf },
  { value: "ergonomic",     label: "Ergonomic",       icon: Users },
  { value: "psychosocial",  label: "Psychosocial",    icon: Brain },
  { value: "electrical",    label: "Electrical",      icon: Zap },
  { value: "mechanical",    label: "Mechanical",      icon: Settings },
  { value: "fire",          label: "Fire / Explosion",icon: Flame },
  { value: "environmental", label: "Environmental",   icon: Leaf },
  { value: "other",         label: "Other",           icon: ClipboardList },
];

const WHO_AFFECTED_OPTIONS = [
  { value: "employees",    label: "Employees" },
  { value: "contractors",  label: "Contractors" },
  { value: "visitors",     label: "Visitors" },
  { value: "public",       label: "Public / Community" },
];

const CONTROL_HIERARCHY_OPTIONS = [
  { value: "elimination",     label: "Elimination",           desc: "Remove the hazard entirely" },
  { value: "substitution",    label: "Substitution",          desc: "Replace with a less hazardous alternative" },
  { value: "engineering",     label: "Engineering Controls",  desc: "Guarding, ventilation, isolation" },
  { value: "administrative",  label: "Administrative Controls",desc: "Procedures, training, job rotation" },
  { value: "ppe",             label: "PPE",                   desc: "Personal Protective Equipment" },
];

const LIKELIHOOD_OPTS = [
  { value: 1, label: "1 – Rare",       desc: "May happen only in exceptional circumstances" },
  { value: 2, label: "2 – Unlikely",   desc: "Could happen but not expected" },
  { value: 3, label: "3 – Possible",   desc: "Might happen occasionally" },
  { value: 4, label: "4 – Likely",     desc: "Will probably happen; occurs sometimes" },
  { value: 5, label: "5 – Almost Certain", desc: "Expected to occur in most circumstances" },
];

const SEVERITY_OPTS = [
  { value: 1, label: "1 – Negligible",   desc: "No injury; first-aid only" },
  { value: 2, label: "2 – Minor",        desc: "Minor injury; medical treatment required" },
  { value: 3, label: "3 – Moderate",     desc: "Significant injury; restricted work or lost time" },
  { value: 4, label: "4 – Major",        desc: "Serious injury; permanent partial disability" },
  { value: 5, label: "5 – Catastrophic", desc: "Fatality or permanent total disability" },
];

const CLAUSES = [
  "4.1 – Context of the organization",
  "4.2 – Interested parties needs",
  "6.1.1 – Actions to address risks & opportunities",
  "6.1.2 – Hazard identification",
  "6.1.3 – OH&S opportunities",
  "6.1.4 – Legal and other requirements",
  "8.1.1 – General operational planning",
  "8.1.2 – Hierarchy of controls",
  "8.1.3 – Management of change",
  "9.1.2 – Evaluation of compliance",
];

// ─── Risk helpers ─────────────────────────────────────────────────────────────
function riskLevelMeta(level: string) {
  switch (level) {
    case "critical": return { label: "Critical", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" };
    case "high":     return { label: "High",     color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700" };
    case "medium":   return { label: "Medium",   color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700" };
    default:         return { label: "Low",      color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" };
  }
}

function calcScore(l: number, s: number) { return l * s; }
function scoreToLevel(score: number): string {
  if (score <= 6) return "low";
  if (score <= 12) return "medium";
  if (score <= 19) return "high";
  return "critical";
}

function RiskBadge({ score, level }: { score: number; level: string }) {
  const meta = riskLevelMeta(level);
  return (
    <span className={`inline-flex items-center gap-1 border rounded px-2 py-0.5 text-xs font-bold ${meta.color}`}>
      {score} – {meta.label}
    </span>
  );
}

// ─── Print ────────────────────────────────────────────────────────────────────
function printHazardRegister(records: HazardRecord[]) {
  const levelCell = (level: string, score: number) => {
    const colors: Record<string, string> = {
      critical: "#fee2e2", high: "#ffedd5", medium: "#fef9c3", low: "#dcfce7",
    };
    return `<td style="background:${colors[level] || "#f3f4f6"};font-weight:bold;text-align:center">${score}<br/><small>${level.toUpperCase()}</small></td>`;
  };
  const html = `<!DOCTYPE html><html><head><title>ISO 45001 Hazard Analysis Register</title>
  <style>body{font-family:Arial,sans-serif;font-size:10px;margin:20px}
  h1{font-size:14px;margin-bottom:4px}p{margin:2px 0;color:#555}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#1e3a5f;color:#fff;padding:5px 6px;font-size:9px;text-align:left}
  td{padding:4px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  tr:nth-child(even){background:#f9fafb}
  @media print{@page{size:landscape;margin:1cm}}</style></head><body>
  <h1>ISO 45001:2018 — Hazard Analysis &amp; Risk Assessment Register</h1>
  <p>Clause 6.1.2 | Generated: ${new Date().toLocaleDateString()}</p>
  <table><thead><tr>
    <th>#</th><th>Work Area</th><th>Activity / Task</th><th>Hazard</th><th>Type</th>
    <th>Condition</th><th>Who Affected</th><th>Consequence</th><th>Existing Controls</th>
    <th>L</th><th>S</th><th>Risk Score</th>
    <th>Control Hierarchy</th><th>Planned Controls</th>
    <th>Res. L</th><th>Res. S</th><th>Residual Risk</th>
    <th>Action Required</th><th>Responsible</th><th>Target Date</th><th>Status</th>
  </tr></thead><tbody>
  ${records.map((r, i) => `<tr>
    <td>${i + 1}</td>
    <td>${r.workArea || "—"}</td>
    <td>${r.activityTask}</td>
    <td>${r.hazardDescription}</td>
    <td>${r.hazardType}</td>
    <td>${r.operatingCondition}</td>
    <td>${(r.whoAffected || []).join(", ") || "—"}</td>
    <td>${r.consequenceDescription || "—"}</td>
    <td>${r.existingControls || "—"}</td>
    <td style="text-align:center">${r.likelihood}</td>
    <td style="text-align:center">${r.severity}</td>
    ${levelCell(r.riskLevel, r.riskScore)}
    <td>${(r.controlHierarchy || []).join(", ") || "—"}</td>
    <td>${r.plannedControls || "—"}</td>
    <td style="text-align:center">${r.residualLikelihood}</td>
    <td style="text-align:center">${r.residualSeverity}</td>
    ${levelCell(r.residualRiskLevel, r.residualRiskScore)}
    <td>${r.actionRequired || "—"}</td>
    <td>${r.responsiblePerson || "—"}</td>
    <td>${r.targetDate || "—"}</td>
    <td>${r.status}</td>
  </tr>`).join("")}
  </tbody></table></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-center justify-center mb-5">
        <HardHat className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="font-bold text-lg text-foreground mb-2">No hazards identified yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Begin your ISO 45001 §6.1.2 hazard identification by adding your first hazard assessment record.
      </p>
      <Button onClick={onAdd} data-testid="btn-add-first-hazard">
        <Plus className="w-4 h-4 mr-2" /> Add First Hazard
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HazardAnalysisModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HazardRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterArea, setFilterArea] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: records = [], isLoading } = useQuery<HazardRecord[]>({
    queryKey: ["/api/iso/hazard-analysis"],
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; data: Record<string, unknown> }) =>
      payload.id
        ? apiRequest("PATCH", `/api/iso/hazard-analysis/${payload.id}`, payload.data)
        : apiRequest("POST", "/api/iso/hazard-analysis", payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso/hazard-analysis"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: "Hazard record saved." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso/hazard-analysis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso/hazard-analysis"] });
      toast({ title: "Record deleted." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterLevel !== "all" && r.riskLevel !== filterLevel) return false;
      if (filterArea && !r.workArea?.toLowerCase().includes(filterArea.toLowerCase())) return false;
      return true;
    });
  }, [records, filterStatus, filterLevel, filterArea]);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: records.length,
    critical: records.filter(r => r.riskLevel === "critical").length,
    high: records.filter(r => r.riskLevel === "high").length,
    openActions: records.filter(r => r.status === "open" && r.actionRequired).length,
    closed: records.filter(r => r.status === "closed").length,
  }), [records]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(r: HazardRecord) {
    setEditing(r);
    setDialogOpen(true);
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HardHat className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-foreground">Hazard Analysis &amp; Risk Assessment</h2>
            <Badge variant="outline" className="text-[10px] font-mono">ISO 45001 §6.1.2</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Identify, evaluate, and control occupational health &amp; safety hazards using the hierarchy of controls.
          </p>
        </div>
        <div className="flex gap-2">
          {records.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => printHazardRegister(records)} data-testid="btn-print-hazards">
              <Printer className="w-4 h-4 mr-1.5" /> Print Register
            </Button>
          )}
          <Button size="sm" onClick={openAdd} data-testid="btn-add-hazard">
            <Plus className="w-4 h-4 mr-1.5" /> Add Hazard
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Hazards", value: stats.total, color: "text-foreground", bg: "bg-muted/40" },
            { label: "Critical Risk", value: stats.critical, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" },
            { label: "High Risk", value: stats.high, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" },
            { label: "Open Actions", value: stats.openActions, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800" },
          ].map(c => (
            <div key={c.label} className={`rounded-xl p-4 ${c.bg}`}>
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Risk Matrix Legend */}
      {records.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Risk Score = Likelihood × Severity</span>
          {[
            { level: "low", range: "1–6" }, { level: "medium", range: "7–12" },
            { level: "high", range: "13–19" }, { level: "critical", range: "20–25" },
          ].map(({ level, range }) => {
            const meta = riskLevelMeta(level);
            return (
              <span key={level} className={`border rounded px-2 py-0.5 font-semibold ${meta.color}`}>
                {meta.label} ({range})
              </span>
            );
          })}
        </div>
      )}

      {/* Filters */}
      {records.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center border rounded-lg px-3 py-2.5 bg-muted/20">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Filter by work area…"
            value={filterArea}
            onChange={e => setFilterArea(e.target.value)}
            className="h-7 w-44 text-xs"
            data-testid="input-filter-area"
          />
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="h-7 w-36 text-xs" data-testid="select-filter-level">
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 w-36 text-xs" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          {(filterArea || filterLevel !== "all" || filterStatus !== "all") && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setFilterArea(""); setFilterLevel("all"); setFilterStatus("all"); }}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {records.length}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && records.length === 0 && <EmptyState onAdd={openAdd} />}

      {/* Register Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-3 py-2.5 w-6"></th>
                <th className="text-left px-3 py-2.5">Work Area</th>
                <th className="text-left px-3 py-2.5">Activity / Task</th>
                <th className="text-left px-3 py-2.5">Hazard</th>
                <th className="text-left px-3 py-2.5">Type</th>
                <th className="text-left px-3 py-2.5">Condition</th>
                <th className="text-center px-3 py-2.5">Inherent Risk</th>
                <th className="text-center px-3 py-2.5">Residual Risk</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-left px-3 py-2.5">Responsible</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isExpanded = expanded === r.id;
                const condColor = r.operatingCondition === "emergency" ? "text-red-600 dark:text-red-400" : r.operatingCondition === "non-routine" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";
                return (
                  <>
                    <tr
                      key={r.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                      data-testid={`row-hazard-${r.id}`}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{r.workArea || "—"}</td>
                      <td className="px-3 py-2.5 text-foreground max-w-[180px] truncate">{r.activityTask}</td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{r.hazardDescription}</td>
                      <td className="px-3 py-2.5">
                        <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded-full">{r.hazardType}</span>
                      </td>
                      <td className={`px-3 py-2.5 text-xs capitalize font-medium ${condColor}`}>{r.operatingCondition}</td>
                      <td className="px-3 py-2.5 text-center">
                        <RiskBadge score={r.riskScore} level={r.riskLevel} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <RiskBadge score={r.residualRiskScore} level={r.residualRiskLevel} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.responsiblePerson || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(r)} data-testid={`btn-edit-hazard-${r.id}`}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)} data-testid={`btn-delete-hazard-${r.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`exp-${r.id}`} className="bg-muted/20 border-b">
                        <td colSpan={11} className="px-5 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Potential Consequence</p>
                              <p className="text-foreground">{r.consequenceDescription || "—"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Existing Controls</p>
                              <p className="text-foreground">{r.existingControls || "—"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Who is Affected</p>
                              <p className="text-foreground capitalize">{(r.whoAffected || []).join(", ") || "—"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Control Hierarchy Applied</p>
                              <div className="flex flex-wrap gap-1">
                                {(r.controlHierarchy || []).map(c => (
                                  <span key={c} className="bg-accent/10 text-accent border border-accent/20 rounded px-2 py-0.5 capitalize">{c}</span>
                                ))}
                                {!(r.controlHierarchy?.length) && <span className="text-muted-foreground">—</span>}
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Planned / Additional Controls</p>
                              <p className="text-foreground">{r.plannedControls || "—"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Action Required</p>
                              <p className="text-foreground">{r.actionRequired || "—"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Legal / Regulatory Requirement</p>
                              <p className="text-foreground">{r.legalRequirement || "—"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">ISO 45001 Clause</p>
                              <p className="text-foreground">{r.iso45001Clause || "6.1.2"}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Target Date</p>
                              <p className="text-foreground">{r.targetDate || "—"}</p>
                            </div>
                            {r.notes && (
                              <div className="sm:col-span-3">
                                <p className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide text-[10px]">Notes</p>
                                <p className="text-foreground">{r.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No results after filter */}
      {!isLoading && records.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="w-6 h-6 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No records match your filters.</p>
          <Button variant="link" size="sm" onClick={() => { setFilterArea(""); setFilterLevel("all"); setFilterStatus("all"); }}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Add / Edit Dialog */}
      {dialogOpen && (
        <HazardDialog
          record={editing}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSave={(data) => saveMutation.mutate({ id: editing?.id, data })}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    "in-progress": "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    closed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  };
  const labels: Record<string, string> = { open: "Open", "in-progress": "In Progress", closed: "Closed" };
  return (
    <span className={`border rounded px-2 py-0.5 text-xs font-semibold ${map[status] || map["open"]}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────
interface DialogProps {
  record: HazardRecord | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
}

function HazardDialog({ record, onClose, onSave, isSaving }: DialogProps) {
  const r = record;

  const [workArea, setWorkArea] = useState(r?.workArea ?? "");
  const [activityTask, setActivityTask] = useState(r?.activityTask ?? "");
  const [hazardDescription, setHazardDescription] = useState(r?.hazardDescription ?? "");
  const [hazardType, setHazardType] = useState(r?.hazardType ?? "physical");
  const [operatingCondition, setOperatingCondition] = useState(r?.operatingCondition ?? "routine");
  const [whoAffected, setWhoAffected] = useState<string[]>(r?.whoAffected ?? []);
  const [consequenceDescription, setConsequenceDescription] = useState(r?.consequenceDescription ?? "");
  const [existingControls, setExistingControls] = useState(r?.existingControls ?? "");
  const [likelihood, setLikelihood] = useState(r?.likelihood ?? 3);
  const [severity, setSeverity] = useState(r?.severity ?? 3);
  const [controlHierarchy, setControlHierarchy] = useState<string[]>(r?.controlHierarchy ?? []);
  const [plannedControls, setPlannedControls] = useState(r?.plannedControls ?? "");
  const [residualLikelihood, setResidualLikelihood] = useState(r?.residualLikelihood ?? 1);
  const [residualSeverity, setResidualSeverity] = useState(r?.residualSeverity ?? 1);
  const [actionRequired, setActionRequired] = useState(r?.actionRequired ?? "");
  const [responsiblePerson, setResponsiblePerson] = useState(r?.responsiblePerson ?? "");
  const [targetDate, setTargetDate] = useState(r?.targetDate ?? "");
  const [status, setStatus] = useState(r?.status ?? "open");
  const [legalRequirement, setLegalRequirement] = useState(r?.legalRequirement ?? "");
  const [iso45001Clause, setIso45001Clause] = useState(r?.iso45001Clause ?? "6.1.2");
  const [notes, setNotes] = useState(r?.notes ?? "");

  const inherentScore = calcScore(likelihood, severity);
  const inherentLevel = scoreToLevel(inherentScore);
  const residualScore = calcScore(residualLikelihood, residualSeverity);
  const residualLevel = scoreToLevel(residualScore);

  function toggleWho(val: string) {
    setWhoAffected(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }
  function toggleControl(val: string) {
    setControlHierarchy(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }

  function handleSave() {
    if (!activityTask.trim() || !hazardDescription.trim()) return;
    onSave({
      workArea: workArea || null,
      activityTask,
      hazardDescription,
      hazardType,
      operatingCondition,
      whoAffected,
      consequenceDescription: consequenceDescription || null,
      existingControls: existingControls || null,
      likelihood,
      severity,
      controlHierarchy,
      plannedControls: plannedControls || null,
      residualLikelihood,
      residualSeverity,
      actionRequired: actionRequired || null,
      responsiblePerson: responsiblePerson || null,
      targetDate: targetDate || null,
      status,
      legalRequirement: legalRequirement || null,
      iso45001Clause: iso45001Clause || "6.1.2",
      notes: notes || null,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-orange-500" />
            {record ? "Edit Hazard Record" : "Add Hazard Record"}
            <Badge variant="outline" className="text-[10px] font-mono ml-1">ISO 45001 §6.1.2</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-1">
          {/* ── Section 1: Hazard Identification ── */}
          <SectionHeading icon={<ClipboardList className="w-4 h-4" />} title="Hazard Identification" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Work Area / Department</Label>
              <Input value={workArea} onChange={e => setWorkArea(e.target.value)} placeholder="e.g. Assembly, Warehouse, Office" data-testid="input-work-area" />
            </div>
            <div className="space-y-1.5">
              <Label>Activity / Task <span className="text-destructive">*</span></Label>
              <Input value={activityTask} onChange={e => setActivityTask(e.target.value)} placeholder="e.g. Forklift operation, Chemical handling" data-testid="input-activity-task" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Hazard Description <span className="text-destructive">*</span></Label>
              <Input value={hazardDescription} onChange={e => setHazardDescription(e.target.value)} placeholder="Describe the hazard source or situation" data-testid="input-hazard-description" />
            </div>
            <div className="space-y-1.5">
              <Label>Hazard Type</Label>
              <Select value={hazardType} onValueChange={setHazardType}>
                <SelectTrigger data-testid="select-hazard-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HAZARD_TYPES.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Operating Condition</Label>
              <Select value={operatingCondition} onValueChange={setOperatingCondition}>
                <SelectTrigger data-testid="select-operating-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="non-routine">Non-Routine</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Who is Affected?</Label>
              <div className="flex flex-wrap gap-3">
                {WHO_AFFECTED_OPTIONS.map(w => (
                  <label key={w.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox checked={whoAffected.includes(w.value)} onCheckedChange={() => toggleWho(w.value)} data-testid={`check-who-${w.value}`} />
                    {w.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Potential Consequence</Label>
              <Textarea value={consequenceDescription} onChange={e => setConsequenceDescription(e.target.value)} placeholder="Describe the potential injury or health effect" rows={2} data-testid="textarea-consequence" />
            </div>
            <div className="space-y-1.5">
              <Label>Existing Controls</Label>
              <Textarea value={existingControls} onChange={e => setExistingControls(e.target.value)} placeholder="Controls already in place before this assessment" rows={2} data-testid="textarea-existing-controls" />
            </div>
          </div>

          {/* ── Section 2: Inherent Risk Scoring ── */}
          <SectionHeading icon={<AlertTriangle className="w-4 h-4 text-orange-500" />} title="Inherent Risk Rating (Before Additional Controls)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Likelihood (1–5)</Label>
              <Select value={String(likelihood)} onValueChange={v => setLikelihood(Number(v))}>
                <SelectTrigger data-testid="select-likelihood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIKELIHOOD_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity (1–5)</Label>
              <Select value={String(severity)} onValueChange={v => setSeverity(Number(v))}>
                <SelectTrigger data-testid="select-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Inherent Risk Score:</span>
            <RiskBadge score={inherentScore} level={inherentLevel} />
          </div>

          {/* ── Section 3: Hierarchy of Controls ── */}
          <SectionHeading icon={<ShieldCheck className="w-4 h-4 text-accent" />} title="Hierarchy of Controls (ISO 45001 §8.1.2)" />
          <div className="space-y-2">
            {CONTROL_HIERARCHY_OPTIONS.map((c, idx) => (
              <label key={c.value} className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                <Checkbox checked={controlHierarchy.includes(c.value)} onCheckedChange={() => toggleControl(c.value)} data-testid={`check-control-${c.value}`} className="mt-0.5" />
                <div>
                  <span className="text-sm font-semibold">{idx + 1}. {c.label}</span>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>Planned / Additional Controls</Label>
            <Textarea value={plannedControls} onChange={e => setPlannedControls(e.target.value)} placeholder="Describe the specific controls to be implemented" rows={2} data-testid="textarea-planned-controls" />
          </div>

          {/* ── Section 4: Residual Risk ── */}
          <SectionHeading icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} title="Residual Risk Rating (After Controls)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Residual Likelihood (1–5)</Label>
              <Select value={String(residualLikelihood)} onValueChange={v => setResidualLikelihood(Number(v))}>
                <SelectTrigger data-testid="select-residual-likelihood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIKELIHOOD_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Residual Severity (1–5)</Label>
              <Select value={String(residualSeverity)} onValueChange={v => setResidualSeverity(Number(v))}>
                <SelectTrigger data-testid="select-residual-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Residual Risk Score:</span>
            <RiskBadge score={residualScore} level={residualLevel} />
          </div>

          {/* ── Section 5: Action & Tracking ── */}
          <SectionHeading icon={<Users className="w-4 h-4" />} title="Action &amp; Tracking" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Action Required</Label>
              <Textarea value={actionRequired} onChange={e => setActionRequired(e.target.value)} placeholder="Corrective or preventive action to be taken" rows={2} data-testid="textarea-action-required" />
            </div>
            <div className="space-y-1.5">
              <Label>Responsible Person</Label>
              <Input value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} placeholder="Name or role" data-testid="input-responsible-person" />
            </div>
            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} data-testid="input-target-date" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ISO 45001 Clause Reference</Label>
              <Select value={iso45001Clause ?? "6.1.2"} onValueChange={setIso45001Clause}>
                <SelectTrigger data-testid="select-clause">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAUSES.map(c => (
                    <SelectItem key={c} value={c.split(" – ")[0]}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Legal / Regulatory Requirement</Label>
              <Input value={legalRequirement} onChange={e => setLegalRequirement(e.target.value)} placeholder="e.g. OSHA 29 CFR 1910.147, MIOSHA" data-testid="input-legal-requirement" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes or context" rows={2} data-testid="textarea-notes" />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving} data-testid="btn-cancel-hazard">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !activityTask.trim() || !hazardDescription.trim()} data-testid="btn-save-hazard">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {record ? "Save Changes" : "Add Hazard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Section heading helper ───────────────────────────────────────────────────
function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="p-1 bg-muted rounded">{icon}</div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
