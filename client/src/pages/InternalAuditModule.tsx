import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ClipboardCheck, AlertTriangle, Trash2, ChevronRight, ChevronDown,
  Calendar, User, BookOpen, Shield, Activity, AlertCircle,
  BarChart3, Info, CheckCircle2, Clock, HardHat, FileText,
  Users, ListChecks, Target, Search, Lightbulb, Edit3,
} from "lucide-react";
import type { IsoAudit, IsoAuditFinding, IsoAuditProcessNote, AuditProcessSchedule } from "@shared/schema";
import type { ProcessEntry } from "./ProcessMapModule";

// ── Standards & Clauses ────────────────────────────────────────────────────────

const ISO_STANDARDS = [
  "ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018",
  "ISO 13485:2016", "IATF 16949:2016", "AS9100 Rev D",
];

const CLAUSES_BY_STANDARD: Record<string, Array<{ clause: string; title: string }>> = {
  "ISO 9001:2015": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the QMS" },
    { clause: "4.4", title: "QMS and its processes" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Quality policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.2", title: "Quality objectives and planning to achieve them" },
    { clause: "6.3", title: "Planning of changes" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Requirements for products and services" },
    { clause: "8.3", title: "Design and development" },
    { clause: "8.4", title: "Control of externally provided processes, products and services" },
    { clause: "8.5", title: "Production and service provision" },
    { clause: "8.6", title: "Release of products and services" },
    { clause: "8.7", title: "Control of nonconforming outputs" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "ISO 14001:2015": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Interested parties" },
    { clause: "4.3", title: "Scope of the EMS" },
    { clause: "4.4", title: "Environmental management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Environmental policy" },
    { clause: "5.3", title: "Roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Environmental aspects" },
    { clause: "6.1.3", title: "Compliance obligations" },
    { clause: "6.2", title: "Environmental objectives and planning" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Emergency preparedness and response" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "ISO 45001:2018": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Needs and expectations of workers and interested parties" },
    { clause: "4.3", title: "Scope of the OH&SMS" },
    { clause: "4.4", title: "OH&S management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "OH&S policy" },
    { clause: "5.3", title: "Roles, responsibilities and authorities" },
    { clause: "5.4", title: "Consultation and participation of workers" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Hazard identification; assessment of risks and opportunities" },
    { clause: "6.1.3", title: "Legal requirements and other requirements" },
    { clause: "6.2", title: "OH&S objectives and planning" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.1.2", title: "Eliminating hazards and reducing OH&S risks" },
    { clause: "8.2", title: "Emergency preparedness and response" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "ISO 13485:2016": [
    { clause: "4.1", title: "General requirements" },
    { clause: "4.2", title: "Documentation requirements" },
    { clause: "5.1", title: "Management commitment" },
    { clause: "5.2", title: "Customer focus" },
    { clause: "5.3", title: "Quality policy" },
    { clause: "5.4", title: "Planning" },
    { clause: "5.5", title: "Responsibility, authority and communication" },
    { clause: "5.6", title: "Management review" },
    { clause: "6.1", title: "Provision of resources" },
    { clause: "6.2", title: "Human resources" },
    { clause: "6.3", title: "Infrastructure" },
    { clause: "6.4", title: "Work environment and contamination control" },
    { clause: "7.1", title: "Planning of product realization" },
    { clause: "7.2", title: "Customer-related processes" },
    { clause: "7.3", title: "Design and development" },
    { clause: "7.4", title: "Purchasing" },
    { clause: "7.5", title: "Production and service provision" },
    { clause: "7.6", title: "Control of monitoring and measuring equipment" },
    { clause: "8.1", title: "Measurement, analysis and improvement" },
    { clause: "8.2", title: "Monitoring and measurement" },
    { clause: "8.3", title: "Control of nonconforming product" },
    { clause: "8.4", title: "Analysis of data" },
    { clause: "8.5", title: "Improvement" },
  ],
  "IATF 16949:2016": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the QMS" },
    { clause: "4.4", title: "QMS and its processes" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.2", title: "Quality objectives and planning" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Requirements for products and services" },
    { clause: "8.3", title: "Design and development" },
    { clause: "8.4", title: "Control of externally provided processes, products and services" },
    { clause: "8.5", title: "Production and service provision" },
    { clause: "8.6", title: "Release of products and services" },
    { clause: "8.7", title: "Control of nonconforming outputs" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "AS9100 Rev D": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the QMS" },
    { clause: "4.4", title: "QMS and its processes" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.2", title: "Quality objectives and planning" },
    { clause: "6.3", title: "Planning of changes" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Requirements for products and services" },
    { clause: "8.3", title: "Design and development" },
    { clause: "8.4", title: "Control of externally provided processes, products and services" },
    { clause: "8.5", title: "Production and service provision" },
    { clause: "8.6", title: "Release of products and services" },
    { clause: "8.7", title: "Control of nonconforming outputs" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
};

function getClausesForStandard(standard: string) {
  return CLAUSES_BY_STANDARD[standard] || CLAUSES_BY_STANDARD["ISO 9001:2015"];
}

// ── Finding Types ──────────────────────────────────────────────────────────────

const FINDING_TYPES = [
  { value: "conform",         label: "Conform",           color: "bg-green-100 text-green-800 border-green-300" },
  { value: "nonconformance",  label: "Nonconformance",    color: "bg-red-100 text-red-800 border-red-300" },
  { value: "observation",     label: "OFI",               color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "not_audited",     label: "Not Audited",       color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const STATUS_COLORS: Record<string, string> = {
  planned:     "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  complete:    "bg-green-100 text-green-800 border-green-300",
};

// ── Risk Score Helpers ─────────────────────────────────────────────────────────

type FreqKey = "triennial" | "biennial" | "urgent";
type RiskKey = "riskComplexity" | "riskCustomerImpact" | "riskPreviousAudit" | "riskPerformance" | "riskChangeFreq" | "riskComplaints";

const FREQ_CONFIG: Record<FreqKey, {
  label: string; sublabel: string; scoreRange: string; rangeColor: string;
  statusColor: string; status: string; barColor: string; badgeColor: string;
}> = {
  triennial: {
    label: "Every 3 Years", sublabel: "Low risk — 3-year audit cycle",
    scoreRange: "6–25", status: "IN CONTROL",
    rangeColor: "bg-green-50 border-green-200", statusColor: "text-green-700",
    barColor: "bg-green-500", badgeColor: "bg-green-100 text-green-800 border-green-300",
  },
  biennial: {
    label: "Every 12–24 Months", sublabel: "Moderate risk — annual or biennial audit",
    scoreRange: "26–50", status: "NEEDS ATTENTION",
    rangeColor: "bg-amber-50 border-amber-200", statusColor: "text-amber-700",
    barColor: "bg-amber-500", badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  urgent: {
    label: "Every 6–9 Months", sublabel: "High risk — frequent auditing required",
    scoreRange: "51–60", status: "NEEDS IMMEDIATE",
    rangeColor: "bg-red-50 border-red-200", statusColor: "text-red-700",
    barColor: "bg-red-500", badgeColor: "bg-red-100 text-red-800 border-red-300",
  },
};

const BANDS = [
  { label: "LOW",      range: "1–3",  score: 2,  dot: "bg-green-500",  color: { active: "bg-green-100 border-green-400 text-green-900", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-green-50" } },
  { label: "MEDIUM",   range: "4–6",  score: 5,  dot: "bg-amber-500",  color: { active: "bg-amber-100 border-amber-400 text-amber-900", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-amber-50" } },
  { label: "HIGH",     range: "7–9",  score: 8,  dot: "bg-orange-500", color: { active: "bg-orange-100 border-orange-400 text-orange-900", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-orange-50" } },
  { label: "CRITICAL", range: "10",   score: 10, dot: "bg-red-600",    color: { active: "bg-red-100 border-red-500 text-red-900",    inactive: "bg-white border-gray-200 text-gray-600 hover:bg-red-50" } },
];

const RISK_CRITERIA: { key: RiskKey; label: string; subtitle: string; bandDescs: string[] }[] = [
  { key: "riskComplexity",      label: "Process Failure Risk",          subtitle: "Complexity & impact of failure", bandDescs: ["Simple, low impact", "Moderate complexity", "Complex, high impact", "Critical failure risk"] },
  { key: "riskCustomerImpact",  label: "Customer & Delivery Impact",    subtitle: "Effect on customer satisfaction/delivery", bandDescs: ["No direct impact", "Minor impact", "Significant impact", "Direct customer safety/delivery"] },
  { key: "riskPreviousAudit",   label: "Previous Audit Findings",       subtitle: "History of NCs and observations", bandDescs: ["No findings", "Minor obs only", "Major NC observed", "Repeat or systemic NCs"] },
  { key: "riskPerformance",     label: "Process Performance & KPIs",    subtitle: "KPI trends and process metrics", bandDescs: ["All targets met", "Minor misses", "Consistent underperformance", "Critical KPI failure"] },
  { key: "riskChangeFreq",      label: "Process Change & Stability",    subtitle: "Frequency of changes, turnover", bandDescs: ["Stable, no changes", "Occasional minor changes", "Frequent changes", "High turnover / constant change"] },
  { key: "riskComplaints",      label: "Customer Complaints & Feedback", subtitle: "Complaint volume and severity", bandDescs: ["Zero complaints", "Isolated minor complaints", "Recurring complaints", "Escalated or safety complaints"] },
];

function calcTotalScore(scores: Record<RiskKey, number>): number {
  return Object.values(scores).reduce((s, v) => s + v, 0);
}

function scoreToFreq(total: number): FreqKey {
  if (total <= 25) return "triennial";
  if (total <= 50) return "biennial";
  return "urgent";
}

function getBandForScore(score: number) {
  return BANDS.find(b => score <= (b.label === "LOW" ? 3 : b.label === "MEDIUM" ? 6 : b.label === "HIGH" ? 9 : 10)) || BANDS[3];
}

function calcNextDate(lastDate: string | null, freqKey: FreqKey): string {
  if (!lastDate) return "";
  const d = new Date(lastDate);
  if (freqKey === "triennial") d.setFullYear(d.getFullYear() + 3);
  else if (freqKey === "biennial") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 7);
  return d.toISOString().slice(0, 10);
}

function getScheduleStatus(entry: AuditProcessSchedule): "overdue" | "due_soon" | "on_track" | "not_assessed" {
  if (!entry.nextAuditDate) return "not_assessed";
  const diffDays = Math.ceil((new Date(entry.nextAuditDate).getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 45) return "due_soon";
  return "on_track";
}

function normalizeProcessType(row: string): "COP" | "SOP" | "MOP" {
  const r = (row || "").toUpperCase();
  if (r === "COP" || r === "CORE") return "COP";
  if (r === "MOP" || r === "MANAGEMENT") return "MOP";
  return "SOP";
}

// ── Objective Met Badge ────────────────────────────────────────────────────────

function ObjectiveMetBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground/50 italic text-xs">Not recorded</span>;
  const cfg = {
    yes:     { label: "Objective Met",         cls: "bg-green-100 text-green-800 border-green-300" },
    partial: { label: "Partially Met",         cls: "bg-amber-100 text-amber-800 border-amber-300" },
    no:      { label: "Objective Not Met",     cls: "bg-red-100 text-red-800 border-red-300" },
  }[value] || { label: value, cls: "bg-gray-100 text-gray-700 border-gray-200" };
  return <Badge className={`text-xs border ${cfg.cls}`}>{cfg.label}</Badge>;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function InternalAuditModule({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"audits" | "schedule">("audits");
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [showCreateAudit, setShowCreateAudit] = useState(false);
  const [findingDialog, setFindingDialog] = useState<{ open: boolean; clause: string; clauseTitle: string; existing?: IsoAuditFinding } | null>(null);
  const [processNotesDialog, setProcessNotesDialog] = useState<{ process: ProcessEntry; existing?: IsoAuditProcessNote } | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState<{ processName: string; processType: "COP" | "SOP" | "MOP"; existing?: AuditProcessSchedule } | null>(null);
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());
  const [summaryEdit, setSummaryEdit] = useState<string | null>(null);

  const { data: audits = [], isLoading } = useQuery<IsoAudit[]>({ queryKey: ["/api/iso-audits"] });
  const { data: project } = useQuery<any>({ queryKey: ["/api/iso-projects"] });
  const { data: scheduleEntries = [] } = useQuery<AuditProcessSchedule[]>({ queryKey: ["/api/audit-schedule"] });

  const selectedAudit = audits.find(a => a.id === selectedAuditId);
  const processes: ProcessEntry[] = (project?.processes || []) as ProcessEntry[];

  const { data: findings = [] } = useQuery<IsoAuditFinding[]>({
    queryKey: ["/api/iso-audits", selectedAuditId, "findings"],
    queryFn: async () => {
      if (!selectedAuditId) return [];
      const res = await fetch(`/api/iso-audits/${selectedAuditId}/findings`);
      return res.json();
    },
    enabled: !!selectedAuditId,
  });

  const { data: processNotes = [] } = useQuery<IsoAuditProcessNote[]>({
    queryKey: ["/api/iso-audits", selectedAuditId, "process-notes"],
    queryFn: async () => {
      if (!selectedAuditId) return [];
      const res = await fetch(`/api/iso-audits/${selectedAuditId}/process-notes`);
      return res.json();
    },
    enabled: !!selectedAuditId,
  });

  const createAudit = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/iso-audits", data)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] }); setShowCreateAudit(false); toast({ title: "Audit created" }); },
  });

  const updateAudit = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => (await apiRequest("PATCH", `/api/iso-audits/${id}`, data)).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] }),
  });

  const deleteAudit = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-audits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] }); setSelectedAuditId(null); toast({ title: "Audit deleted" }); },
  });

  const saveFinding = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return (await apiRequest("PATCH", `/api/iso-audit-findings/${data.id}`, data)).json();
      return (await apiRequest("POST", `/api/iso-audits/${selectedAuditId}/findings`, data)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "findings"] }); setFindingDialog(null); },
  });

  const deleteFinding = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-audit-findings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "findings"] }),
  });

  const saveProcessNote = useMutation({
    mutationFn: async (data: any) => (await apiRequest("PUT", `/api/iso-audits/${selectedAuditId}/process-notes`, data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "process-notes"] });
      setProcessNotesDialog(null);
      toast({ title: "Process notes saved" });
    },
  });

  const deleteProcessNote = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-audit-process-notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "process-notes"] }),
  });

  const saveSchedule = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return (await apiRequest("PATCH", `/api/audit-schedule/${data.id}`, data)).json();
      return (await apiRequest("POST", "/api/audit-schedule", data)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/audit-schedule"] }); setScheduleDialog(null); toast({ title: "Schedule saved" }); },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/audit-schedule/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/audit-schedule"] }); setScheduleDialog(null); toast({ title: "Entry removed" }); },
  });

  const clauses = selectedAudit ? getClausesForStandard(selectedAudit.standard) : [];
  const findingForClause = (clause: string) => findings.find(f => f.clause === clause);
  const findingCounts = findings.reduce((acc, f) => { acc[f.findingType] = (acc[f.findingType] || 0) + 1; return acc; }, {} as Record<string, number>);

  // Count process notes that have NCs or OFIs
  const processNcCount = processNotes.filter(n => n.nonconformances?.trim()).length;
  const processOfiCount = processNotes.filter(n => n.opportunities?.trim()).length;
  const processNotMet = processNotes.filter(n => n.isObjectiveMet === "no").length;
  const processPartial = processNotes.filter(n => n.isObjectiveMet === "partial").length;
  const processAudited = processNotes.length;

  const toggleProcess = (name: string) => {
    setExpandedProcesses(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // ── Audit detail (process-approach view) ──────────────────────────────────────
  if (selectedAudit) {
    return (
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAuditId(null)} className="text-muted-foreground hover:text-foreground text-sm" data-testid="button-back-audits">← All Audits</button>
            <span className="text-muted-foreground">/</span>
            <h2 className="font-semibold text-primary">{selectedAudit.standard}</h2>
            <Badge className={`text-xs border ${STATUS_COLORS[selectedAudit.status] || STATUS_COLORS.planned}`}>{selectedAudit.status.replace("_", " ").toUpperCase()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedAudit.status === "planned" && (
              <Button size="sm" variant="outline" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "in_progress" } })} data-testid="button-start-audit">
                Start Audit
              </Button>
            )}
            {selectedAudit.status === "in_progress" && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "complete", completedDate: new Date().toISOString() } })} data-testid="button-complete-audit">
                Mark Complete
              </Button>
            )}
            {onAskIsa && (
              <Button size="sm" variant="outline" onClick={() => onAskIsa(`I'm conducting a process-approach internal audit for ${selectedAudit.standard}. I've audited ${processAudited} processes, found ${processNcCount} processes with NCs and ${processOfiCount} with OFIs. Can you help me think through the findings and next steps?`)}>
                Ask Isa
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Delete this audit and all its records?")) deleteAudit.mutate(selectedAudit.id); }} data-testid="button-delete-audit">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Report header card ── */}
          <div className="mx-6 mt-5 rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-[#1a2744] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm tracking-wide uppercase">Internal Audit Report — {selectedAudit.standard}</p>
                <p className="text-blue-200 text-xs mt-0.5">Process Approach · IATF 9.2 / ISO 9001 Clause 9.2</p>
              </div>
              <div className="text-right text-xs text-blue-200 space-y-0.5">
                {selectedAudit.scheduledDate && <p>Date: <span className="text-white font-semibold">{new Date(selectedAudit.scheduledDate).toLocaleDateString()}</span></p>}
                {selectedAudit.completedDate && <p>Completed: <span className="text-white font-semibold">{new Date(selectedAudit.completedDate).toLocaleDateString()}</span></p>}
              </div>
            </div>

            <div className="bg-white px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Lead Auditor</p>
                <p className="font-medium text-foreground">{selectedAudit.leadAuditor || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Auditee Contact</p>
                <p className="font-medium text-foreground">{selectedAudit.contact || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Scope</p>
                <p className="font-medium text-foreground">{selectedAudit.scope || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Exclusions</p>
                <p className="font-medium text-foreground">{selectedAudit.exclusions || "None"}</p>
              </div>
            </div>

            {selectedAudit.objective && (
              <div className="bg-blue-50/60 px-5 py-3 border-b text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 mr-2">Audit Objective:</span>
                <span className="text-foreground">{selectedAudit.objective}</span>
              </div>
            )}

            {/* Opening / Closing meeting */}
            <div className="grid grid-cols-2 divide-x bg-gray-50/60 border-b text-sm">
              <div className="px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Opening Meeting</p>
                {selectedAudit.openingMeetingDate
                  ? <p className="font-medium text-foreground">{new Date(selectedAudit.openingMeetingDate).toLocaleDateString()}</p>
                  : <p className="text-muted-foreground italic">Not recorded</p>}
                {selectedAudit.openingMeetingAttendees && <p className="text-xs text-muted-foreground mt-0.5">{selectedAudit.openingMeetingAttendees}</p>}
              </div>
              <div className="px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Closing Meeting</p>
                {selectedAudit.closingMeetingDate
                  ? <p className="font-medium text-foreground">{new Date(selectedAudit.closingMeetingDate).toLocaleDateString()}</p>
                  : <p className="text-muted-foreground italic">Not recorded</p>}
                {selectedAudit.closingMeetingAttendees && <p className="text-xs text-muted-foreground mt-0.5">{selectedAudit.closingMeetingAttendees}</p>}
              </div>
            </div>

            {/* Findings summary bar */}
            <div className="px-5 py-3 bg-white flex flex-wrap items-center gap-5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary:</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="font-semibold text-blue-700">{processAudited}</span> <span className="text-muted-foreground">Processes Audited</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="font-semibold text-green-700">{processAudited - processNotMet - processPartial}</span> <span className="text-muted-foreground">Objectives Met</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="font-semibold text-amber-700">{processPartial}</span> <span className="text-muted-foreground">Partially Met</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="font-semibold text-red-700">{processNotMet}</span> <span className="text-muted-foreground">Not Met</span></span>
              <span className="ml-auto flex items-center gap-3 text-xs">
                <span className="text-red-700 font-bold">{processNcCount} NCs</span>
                <span className="text-amber-700 font-bold">{processOfiCount} OFIs</span>
              </span>
            </div>
          </div>

          {/* ── Executive Summary ── */}
          <div className="mx-6 mt-4 rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="font-semibold text-sm text-foreground">Executive Summary</p>
              </div>
              {summaryEdit === null && (
                <button className="text-xs text-accent hover:underline flex items-center gap-1" onClick={() => setSummaryEdit(selectedAudit.executiveSummary || "")} data-testid="button-edit-summary">
                  <Edit3 className="w-3 h-3" />Edit
                </button>
              )}
            </div>
            <div className="px-5 py-4 bg-white">
              {summaryEdit !== null ? (
                <div className="space-y-2">
                  <Textarea
                    rows={5}
                    value={summaryEdit}
                    onChange={e => setSummaryEdit(e.target.value)}
                    placeholder="Summarize the overall audit outcome, conformance status, and key findings…"
                    className="text-sm"
                    data-testid="textarea-executive-summary"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => { updateAudit.mutate({ id: selectedAudit.id, data: { executiveSummary: summaryEdit } }); setSummaryEdit(null); }} disabled={updateAudit.isPending} data-testid="button-save-summary">
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSummaryEdit(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                selectedAudit.executiveSummary
                  ? <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedAudit.executiveSummary}</p>
                  : <p className="text-sm text-muted-foreground italic">No executive summary recorded. Click Edit to add one.</p>
              )}
            </div>
          </div>

          {/* ── Process Accordion ── */}
          <div className="mx-6 mt-4 mb-6 rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-[#1a2744] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-200" />
                <p className="text-white font-bold text-sm">Process-by-Process Audit Findings</p>
              </div>
              <p className="text-blue-200 text-xs">{processAudited}/{processes.length} processes documented</p>
            </div>

            {processes.length === 0 && (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No processes found in your Process Map.</p>
                <p className="text-xs mt-1">Add processes in ISO Manager → Process Map first, then return here to conduct the audit.</p>
              </div>
            )}

            {processes.length > 0 && (
              <div className="divide-y bg-white">
                {processes.map(proc => {
                  const pType = normalizeProcessType(proc.row || "SOP");
                  const note = processNotes.find(n => n.processName === proc.name);
                  const isExpanded = expandedProcesses.has(proc.name);

                  const typeStyles: Record<string, { border: string; badge: string; dot: string }> = {
                    COP: { border: "border-l-4 border-l-orange-500", badge: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-500" },
                    SOP: { border: "border-l-4 border-l-emerald-500", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
                    MOP: { border: "border-l-4 border-l-blue-500", badge: "bg-blue-100 text-blue-800 border-blue-300", dot: "bg-blue-500" },
                  };
                  const ts = typeStyles[pType];

                  const hasNc = !!(note?.nonconformances?.trim());
                  const hasOfi = !!(note?.opportunities?.trim());

                  return (
                    <div key={proc.name} className={ts.border} data-testid={`process-row-${proc.name}`}>
                      {/* Process header row */}
                      <div
                        className={`flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors group`}
                        onClick={() => toggleProcess(proc.name)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded border ${ts.badge}`}>{pType}</span>
                          <span className="font-semibold text-foreground text-sm truncate">{proc.name}</span>
                          {proc.owner && <span className="text-xs text-muted-foreground hidden md:block truncate">· {proc.owner}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {note ? (
                            <>
                              <ObjectiveMetBadge value={note.isObjectiveMet} />
                              {hasNc && <Badge className="text-xs border bg-red-100 text-red-800 border-red-300">NC</Badge>}
                              {hasOfi && <Badge className="text-xs border bg-amber-100 text-amber-800 border-amber-300">OFI</Badge>}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">Not yet audited</span>
                          )}
                          <button
                            className="ml-2 text-xs text-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0"
                            onClick={e => { e.stopPropagation(); setProcessNotesDialog({ process: proc, existing: note }); }}
                            data-testid={`button-edit-process-${proc.name}`}
                          >
                            <Edit3 className="w-3 h-3" />{note ? "Edit" : "Record"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded process detail */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 space-y-4 bg-muted/10 border-t">
                          {!note ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <ListChecks className="w-7 h-7 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No audit notes recorded for this process yet.</p>
                              <Button size="sm" variant="outline" className="mt-3" onClick={() => setProcessNotesDialog({ process: proc, existing: undefined })} data-testid={`button-record-process-${proc.name}`}>
                                Record Audit Notes
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Process Objective */}
                              <div className="bg-white rounded-lg border p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="w-4 h-4 text-primary shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Process Objective / KPI</p>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{note.processObjectives || <span className="italic text-muted-foreground">Not recorded</span>}</p>
                                <div className="pt-1">
                                  <ObjectiveMetBadge value={note.isObjectiveMet} />
                                  {note.objectiveMetNotes && <p className="text-xs text-muted-foreground mt-1">{note.objectiveMetNotes}</p>}
                                </div>
                              </div>

                              {/* Personnel Interviewed */}
                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-4 h-4 text-primary shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Personnel Interviewed</p>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{note.personnelInterviewed || <span className="italic text-muted-foreground">Not recorded</span>}</p>
                              </div>

                              {/* Process Description */}
                              {note.processDescription && (
                                <div className="bg-white rounded-lg border p-4 md:col-span-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Process Description</p>
                                  </div>
                                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.processDescription}</p>
                                </div>
                              )}

                              {/* Inputs / Outputs / Interactions */}
                              {(note.processInputs || note.processOutputs || note.processInteractions) && (
                                <div className="bg-white rounded-lg border p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Activity className="w-4 h-4 text-primary shrink-0" />
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Inputs / Outputs / Interactions</p>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    {note.processInputs && <div><span className="font-semibold text-foreground">Inputs: </span><span className="text-muted-foreground">{note.processInputs}</span></div>}
                                    {note.processOutputs && <div><span className="font-semibold text-foreground">Outputs: </span><span className="text-muted-foreground">{note.processOutputs}</span></div>}
                                    {note.processInteractions && <div><span className="font-semibold text-foreground">Interactions: </span><span className="text-muted-foreground">{note.processInteractions}</span></div>}
                                  </div>
                                </div>
                              )}

                              {/* Objective Evidence */}
                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Search className="w-4 h-4 text-primary shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Objective Evidence Reviewed</p>
                                </div>
                                {note.objectiveEvidence
                                  ? <ul className="space-y-1">{note.objectiveEvidence.split("\n").filter(Boolean).map((ev, i) => <li key={i} className="text-sm text-foreground flex gap-1.5"><span className="text-muted-foreground shrink-0">·</span>{ev}</li>)}</ul>
                                  : <p className="text-sm italic text-muted-foreground">None recorded</p>}
                              </div>

                              {/* Nonconformances */}
                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">Nonconformances (NC)</p>
                                </div>
                                {note.nonconformances?.trim()
                                  ? <ul className="space-y-1.5">{note.nonconformances.split("\n").filter(Boolean).map((nc, i) => <li key={i} className="text-sm text-foreground flex gap-1.5"><span className="text-red-500 font-bold shrink-0">NC{i+1}.</span>{nc}</li>)}</ul>
                                  : <p className="text-sm text-green-700 font-medium">No nonconformances identified</p>}
                              </div>

                              {/* Opportunities for Improvement */}
                              <div className="bg-white rounded-lg border p-4 md:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Opportunities for Improvement (OFI)</p>
                                </div>
                                {note.opportunities?.trim()
                                  ? <ul className="space-y-1.5">{note.opportunities.split("\n").filter(Boolean).map((ofi, i) => <li key={i} className="text-sm text-foreground flex gap-1.5"><span className="text-amber-600 font-bold shrink-0">OFI{i+1}.</span>{ofi}</li>)}</ul>
                                  : <p className="text-sm text-muted-foreground italic">None recorded</p>}
                              </div>
                            </div>
                          )}

                          {note && (
                            <div className="flex justify-end gap-2 pt-1">
                              <Button size="sm" variant="outline" onClick={() => setProcessNotesDialog({ process: proc, existing: note })} data-testid={`button-edit-notes-${proc.name}`}>
                                <Edit3 className="w-3.5 h-3.5 mr-1" />Edit Notes
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Delete notes for this process?")) deleteProcessNote.mutate(note.id); }} data-testid={`button-delete-notes-${proc.name}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Process Notes Dialog ── */}
        {processNotesDialog && (
          <ProcessNotesDialog
            process={processNotesDialog.process}
            existing={processNotesDialog.existing}
            onSave={data => saveProcessNote.mutate(data)}
            onClose={() => setProcessNotesDialog(null)}
            isPending={saveProcessNote.isPending}
          />
        )}

        {/* ── Legacy Clause Finding Dialog (kept for direct access if needed) ── */}
        {findingDialog?.open && (
          <FindingDialog
            clause={findingDialog.clause} clauseTitle={findingDialog.clauseTitle} existing={findingDialog.existing}
            onSave={(data) => saveFinding.mutate(data)}
            onDelete={findingDialog.existing ? () => { deleteFinding.mutate(findingDialog.existing!.id); setFindingDialog(null); } : undefined}
            onClose={() => setFindingDialog(null)} isPending={saveFinding.isPending}
          />
        )}
      </div>
    );
  }

  // ── Tabbed list view ──────────────────────────────────────────────────────────
  const unassessed = processes.filter(p => !scheduleEntries.find(e => e.processName === p.name));
  const overdue = scheduleEntries.filter(e => getScheduleStatus(e) === "overdue").length;
  const immediate = scheduleEntries.filter(e => e.recommendedFrequency === "urgent").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h2 className="text-lg font-bold text-primary">Internal Audits</h2>
          <p className="text-xs text-muted-foreground">Plan, conduct, and risk-rank process-based internal audits.</p>
        </div>
        {activeTab === "audits" && (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1" onClick={() => setShowCreateAudit(true)} data-testid="button-create-audit">
            <Plus className="w-4 h-4" /> New Audit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white px-6">
        {(["audits", "schedule"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab}`}
          >
            {tab === "audits" ? (
              <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" />Audit Log</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />Audit Schedule
                {(overdue > 0 || immediate > 0) && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{overdue + immediate}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "audits" ? (
          isLoading ? (
            <div className="text-center text-muted-foreground py-12">Loading audits...</div>
          ) : audits.length === 0 ? (
            <div className="text-center py-16 space-y-3 px-6">
              <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-muted-foreground">No audits yet</p>
              <p className="text-sm text-muted-foreground/70">Create your first internal audit to start documenting process-based conformance.</p>
              <Button size="sm" variant="outline" onClick={() => setShowCreateAudit(true)}>Create First Audit</Button>
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {audits.map(audit => (
                <Card key={audit.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer border" onClick={() => setSelectedAuditId(audit.id)} data-testid={`card-audit-${audit.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-semibold text-primary">{audit.standard}</p>
                        <p className="text-xs text-muted-foreground">
                          {audit.scope || "No scope defined"}
                          {audit.leadAuditor && ` · ${audit.leadAuditor}`}
                          {audit.contact && ` · Contact: ${audit.contact}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {audit.scheduledDate && <span className="text-xs text-muted-foreground">{new Date(audit.scheduledDate).toLocaleDateString()}</span>}
                      <Badge className={`text-xs border ${STATUS_COLORS[audit.status] || STATUS_COLORS.planned}`}>{audit.status.replace("_", " ").toUpperCase()}</Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          /* ── Audit Schedule Tab ── */
          <div className="p-6 space-y-5">

            {/* Scheduling rule legend */}
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(FREQ_CONFIG) as [FreqKey, typeof FREQ_CONFIG[FreqKey]][]).map(([key, cfg]) => (
                <div key={key} className={`rounded-lg border p-3.5 ${cfg.rangeColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wide ${cfg.statusColor}`}>{cfg.status}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-white/70 rounded px-1.5 py-0.5 border">{cfg.scoreRange} pts</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cfg.sublabel}</p>
                </div>
              ))}
            </div>

            {/* Per-criterion ranking guide */}
            <details className="group border rounded-lg bg-white">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Risk Ranking Scale — per criterion (score 1–10)
                <span className="ml-auto text-xs group-open:hidden">Show</span>
              </summary>
              <div className="px-4 pb-4 grid grid-cols-4 gap-2 text-xs">
                {BANDS.map(b => (
                  <div key={b.label} className="border rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                      <span className="font-bold text-foreground">{b.label}</span>
                      <span className="text-muted-foreground ml-auto">{b.range}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">Score: {b.score}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-gray-50 rounded border">
                  <HardHat className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                  <span>Processes marked <strong>Consultant Audit</strong> (grey) are to be audited by an external consultant.</span>
                </div>
              </div>
            </details>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Processes", value: processes.length, icon: Activity, color: "text-primary" },
                { label: "Assessed", value: scheduleEntries.length, icon: CheckCircle2, color: "text-green-600" },
                { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-red-600" },
                { label: "Needs Immediate", value: immediate, icon: Clock, color: "text-red-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white border rounded-lg p-3 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color} shrink-0`} />
                  <div>
                    <p className="text-lg font-bold text-foreground leading-none">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {!project && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Connect a Process Map in ISO Manager → Process Map first.</p>
              </div>
            )}

            {project && processes.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No processes found in your Process Map. Add processes there first.</p>
              </div>
            )}

            {project && processes.length > 0 && (
              <AuditMatrix
                processes={processes}
                scheduleEntries={scheduleEntries}
                unassessed={unassessed}
                onAssess={(name, type, entry) => setScheduleDialog({ processName: name, processType: type, existing: entry })}
              />
            )}

            {/* Orphaned entries */}
            {scheduleEntries.filter(e => !processes.find(p => p.name === e.processName)).length > 0 && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20">
                  <p className="text-sm font-semibold text-muted-foreground">Archived Processes (removed from Process Map)</p>
                </div>
                <div className="divide-y">
                  {scheduleEntries.filter(e => !processes.find(p => p.name === e.processName)).map(entry => (
                    <div key={entry.id} className="px-4 py-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground line-through">{entry.processName}</span>
                      <button className="text-xs text-red-500 hover:underline" onClick={() => deleteSchedule.mutate(entry.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateAudit && (
        <CreateAuditDialog onSave={(data) => createAudit.mutate(data)} onClose={() => setShowCreateAudit(false)} isPending={createAudit.isPending} />
      )}

      {scheduleDialog && (
        <RiskAssessmentDialog
          processName={scheduleDialog.processName}
          processType={scheduleDialog.processType}
          existing={scheduleDialog.existing}
          onSave={(data) => saveSchedule.mutate(data)}
          onDelete={scheduleDialog.existing ? () => deleteSchedule.mutate(scheduleDialog.existing!.id) : undefined}
          onClose={() => setScheduleDialog(null)}
          isPending={saveSchedule.isPending}
        />
      )}
    </div>
  );
}

// ── Audit Matrix Component ─────────────────────────────────────────────────────

function nextDateCellStyle(nextDate: Date | string | null | undefined): string {
  if (!nextDate) return "";
  const d = new Date(nextDate);
  const now = new Date();
  if (d < now) return "bg-red-600 text-white font-bold";
  const monthsOut = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  if (monthsOut <= 3)  return "bg-orange-400 text-white font-bold";
  if (monthsOut <= 12) return "bg-yellow-300 text-gray-900 font-bold";
  if (monthsOut <= 18) return "bg-yellow-100 text-gray-700 font-semibold";
  return "bg-green-50 text-green-800";
}

function freqLabel(freqKey: FreqKey | null): string {
  if (!freqKey) return "—";
  return { triennial: "1× / 3 yrs", biennial: "1× / 1–2 yrs", urgent: "2× / yr" }[freqKey] || "—";
}

function AuditMatrix({ processes, scheduleEntries, unassessed, onAssess }: {
  processes: ProcessEntry[];
  scheduleEntries: AuditProcessSchedule[];
  unassessed: ProcessEntry[];
  onAssess: (name: string, type: "COP" | "SOP" | "MOP", entry?: AuditProcessSchedule) => void;
}) {
  const TYPE_ROW_STYLE: Record<string, { border: string; label: string; headerBg: string; headerText: string }> = {
    COP: { border: "border-l-4 border-l-orange-500", label: "Customer-Oriented Processes (COP)", headerBg: "bg-orange-600", headerText: "text-orange-100" },
    SOP: { border: "border-l-4 border-l-emerald-500", label: "Support-Oriented Processes (SOP)",   headerBg: "bg-emerald-700", headerText: "text-emerald-100" },
    MOP: { border: "border-l-4 border-l-blue-500",    label: "Management-Oriented Processes (MOP)", headerBg: "bg-blue-700",    headerText: "text-blue-100" },
  };

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">

      {/* Document-style title bar */}
      <div className="bg-[#1a2744] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm tracking-wide uppercase">Internal Audit Scheduling Worksheet</p>
          <p className="text-blue-200 text-xs mt-0.5">Process Approach · Risk-Based Scheduling · Clause Cross-Reference</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-blue-200">
          <span><span className="font-bold text-white">{processes.length}</span> Processes</span>
          <span><span className="font-bold text-white">{new Set(processes.flatMap(p => p.clauses || [])).size}</span> Clauses Covered</span>
          {unassessed.length > 0 && <span className="text-amber-300"><span className="font-bold">{unassessed.length}</span> Not yet assessed</span>}
        </div>
      </div>

      {/* Column header row */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-xs border-collapse" style={{ minWidth: "860px" }}>
          <thead>
            <tr className="bg-[#2d3f6b] text-white text-center">
              <th className="px-3 py-2.5 text-left font-semibold tracking-wide w-[22%]">Process</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Owner</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[8%]">Type</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Auditor</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[8%]">Freq/Year</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[18%]">Risk Level</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Related Clauses</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Notes</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Last Audit</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Next Audit</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[6%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(["COP", "SOP", "MOP"] as const).map(pType => {
              const typeProcs = processes.filter(p => normalizeProcessType(p.row || "SOP") === pType);
              if (typeProcs.length === 0) return null;
              const style = TYPE_ROW_STYLE[pType];
              return (
                <>
                  {/* Section sub-header */}
                  <tr key={`header-${pType}`} className={`${style.headerBg}`}>
                    <td colSpan={11} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${style.headerText}`}>
                      {style.label}
                    </td>
                  </tr>

                  {typeProcs.map(proc => {
                    const entry = scheduleEntries.find(e => e.processName === proc.name);
                    const score = entry ? calcTotalScore({
                      riskComplexity: entry.riskComplexity,
                      riskCustomerImpact: entry.riskCustomerImpact,
                      riskPreviousAudit: entry.riskPreviousAudit,
                      riskPerformance: entry.riskPerformance,
                      riskChangeFreq: entry.riskChangeFreq,
                      riskComplaints: entry.riskComplaints,
                    }) : null;
                    const freqKey = score !== null ? scoreToFreq(score) : null;
                    const freqCfg = freqKey ? FREQ_CONFIG[freqKey] : null;
                    const schedStatus = entry ? getScheduleStatus(entry) : "not_assessed";
                    const nextDateStyle = nextDateCellStyle(entry?.nextAuditDate);
                    const statusLabel = freqKey ? { triennial: "IN CONTROL", biennial: "NEEDS ATTENTION", urgent: "NEEDS IMMEDIATE" }[freqKey] : "";
                    const isConsultant = entry?.consultantAudit ?? false;

                    return (
                      <tr
                        key={proc.name}
                        className={`group hover:bg-muted/20 text-xs ${style.border} ${isConsultant ? "bg-gray-100/80" : ""}`}
                        data-testid={`row-schedule-${proc.name}`}
                      >
                        {/* Process Name */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          <div className="font-semibold text-foreground leading-snug">{proc.name}</div>
                          {isConsultant && <div className="flex items-center gap-1 mt-0.5 text-muted-foreground"><HardHat className="w-3 h-3" /><span className="italic">Consultant</span></div>}
                        </td>

                        {/* Owner */}
                        <td className="py-3 px-3 border-r border-gray-100 text-muted-foreground text-center">
                          {proc.owner ? (
                            <span className="flex items-center justify-center gap-1"><User className="w-3 h-3 shrink-0" />{proc.owner}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Audit Type */}
                        <td className="py-3 px-3 border-r border-gray-100 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            pType === "COP" ? "bg-orange-100 text-orange-800" :
                            pType === "SOP" ? "bg-emerald-100 text-emerald-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>{pType}</span>
                        </td>

                        {/* Auditor */}
                        <td className="py-3 px-3 border-r border-gray-100 text-muted-foreground text-center">
                          {entry?.auditorAssigned ? (
                            <span className="font-medium">{entry.auditorAssigned}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Freq/Year */}
                        <td className="py-3 px-3 border-r border-gray-100 text-center text-muted-foreground">
                          {freqKey ? (
                            <span className="font-medium">{freqLabel(freqKey)}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Risk Level — badge + score + bar */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          {score !== null && freqCfg ? (
                            <div className="space-y-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border ${
                                freqKey === "triennial"
                                  ? "bg-green-50 text-green-800 border-green-300"
                                  : freqKey === "biennial"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-red-50 text-red-800 border-red-300"
                              }`}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  freqKey === "triennial" ? "bg-green-500" : freqKey === "biennial" ? "bg-amber-500" : "bg-red-500"
                                }`} />
                                {statusLabel}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                                  <div className={`h-1.5 rounded-full ${freqCfg.barColor}`} style={{ width: `${Math.min(100, ((score - 6) / 54) * 100)}%` }} />
                                </div>
                                <span className={`text-xs font-bold tabular-nums ${freqCfg.statusColor}`}>{score}<span className="font-normal text-muted-foreground">/60</span></span>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="text-xs text-accent hover:underline italic"
                              onClick={() => onAssess(proc.name, pType, entry)}
                            >
                              Click to assess →
                            </button>
                          )}
                        </td>

                        {/* Related Clauses — from process map */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          {proc.clauses && proc.clauses.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5">
                              {proc.clauses.slice(0, 6).map(c => (
                                <span key={c} className="inline-block bg-[#1a2744]/8 text-[#1a2744] border border-[#1a2744]/20 rounded px-1 py-0.5 text-xs font-mono leading-none">
                                  {c}
                                </span>
                              ))}
                              {proc.clauses.length > 6 && (
                                <span className="text-muted-foreground/60 italic text-xs">+{proc.clauses.length - 6}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 italic">—</span>
                          )}
                        </td>

                        {/* Notes / Reason */}
                        <td className="py-3 px-3 border-r border-gray-100 text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-2 leading-snug">{entry?.notes || <span className="italic opacity-40">—</span>}</span>
                        </td>

                        {/* Last Audit Date */}
                        <td className="py-3 px-3 text-center border-r border-gray-100 text-muted-foreground">
                          {entry?.lastAuditDate ? (
                            <span className="font-medium">{new Date(entry.lastAuditDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Next Audit Date — color-highlighted */}
                        <td className="py-3 px-3 text-center border-r border-gray-100">
                          {entry?.nextAuditDate ? (
                            <div className={`rounded px-2 py-1 inline-block text-xs ${nextDateStyle}`}>
                              <div className="font-bold">{new Date(entry.nextAuditDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
                              {schedStatus === "overdue" && <div className="text-xs opacity-80 font-medium">OVERDUE</div>}
                            </div>
                          ) : (
                            <button
                              className="text-xs text-accent hover:underline italic"
                              onClick={() => onAssess(proc.name, pType, entry)}
                            >Assess →</button>
                          )}
                        </td>

                        {/* Edit action */}
                        <td className="py-3 px-2 text-center">
                          <button
                            className="text-xs font-medium text-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onAssess(proc.name, pType, entry)}
                            data-testid={`button-assess-${proc.name}`}
                          >
                            {entry ? "Edit" : "Assess"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="flex items-center flex-wrap gap-5 px-5 py-3 bg-[#1a2744]/5 border-t text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Risk Level:</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /><span className="font-semibold text-green-800">IN CONTROL</span> — score 6–25 · audit every 3 years</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /><span className="font-semibold text-amber-800">NEEDS ATTENTION</span> — score 26–50 · audit every 12–24 months</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /><span className="font-semibold text-red-800">NEEDS IMMEDIATE ATTENTION</span> — score 51–60 · audit every 6–9 months</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-semibold text-foreground">Next Audit:</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-red-600 inline-block" />Overdue</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-orange-400 inline-block" />≤ 3 months</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-yellow-300 inline-block" />≤ 12 months</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-green-50 border inline-block" />On Track</span>
        <span className="ml-auto flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5" />Grey = Consultant Audit</span>
      </div>
    </div>
  );
}

// ── Create Audit Dialog ────────────────────────────────────────────────────────

function CreateAuditDialog({ onSave, onClose, isPending }: { onSave: (data: any) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState({
    standard: "ISO 9001:2015",
    scope: "",
    exclusions: "",
    leadAuditor: "",
    contact: "",
    objective: "",
    scheduledDate: "",
    openingMeetingDate: "",
    openingMeetingAttendees: "",
    closingMeetingDate: "",
    closingMeetingAttendees: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Internal Audit</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Standard</Label>
              <Select value={form.standard} onValueChange={v => set("standard", v)}>
                <SelectTrigger data-testid="select-audit-standard"><SelectValue /></SelectTrigger>
                <SelectContent>{ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead Auditor <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="Name" value={form.leadAuditor} onChange={e => set("leadAuditor", e.target.value)} data-testid="input-lead-auditor" />
            </div>
            <div>
              <Label>Auditee Contact <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="Name / title" value={form.contact} onChange={e => set("contact", e.target.value)} data-testid="input-contact" />
            </div>
            <div className="col-span-2">
              <Label>Audit Scope <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. All QMS processes, clauses 4–10" value={form.scope} onChange={e => set("scope", e.target.value)} data-testid="input-audit-scope" />
            </div>
            <div className="col-span-2">
              <Label>Exclusions <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. Clause 8.3 Design & Development — not applicable" value={form.exclusions} onChange={e => set("exclusions", e.target.value)} data-testid="input-exclusions" />
            </div>
            <div className="col-span-2">
              <Label>Audit Objective <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea placeholder="e.g. Verify conformance to IATF 16949:2016 and effectiveness of the QMS…" value={form.objective} onChange={e => set("objective", e.target.value)} rows={2} data-testid="textarea-objective" />
            </div>
            <div>
              <Label>Scheduled Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)} data-testid="input-scheduled-date" />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Meeting Details <span className="text-muted-foreground font-normal">(optional — can be added after)</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Opening Meeting Date</Label>
                <Input type="date" value={form.openingMeetingDate} onChange={e => set("openingMeetingDate", e.target.value)} data-testid="input-opening-meeting-date" />
              </div>
              <div>
                <Label className="text-xs">Opening Meeting Attendees</Label>
                <Input placeholder="Names / titles" value={form.openingMeetingAttendees} onChange={e => set("openingMeetingAttendees", e.target.value)} data-testid="input-opening-attendees" />
              </div>
              <div>
                <Label className="text-xs">Closing Meeting Date</Label>
                <Input type="date" value={form.closingMeetingDate} onChange={e => set("closingMeetingDate", e.target.value)} data-testid="input-closing-meeting-date" />
              </div>
              <div>
                <Label className="text-xs">Closing Meeting Attendees</Label>
                <Input placeholder="Names / titles" value={form.closingMeetingAttendees} onChange={e => set("closingMeetingAttendees", e.target.value)} data-testid="input-closing-attendees" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave({ ...form, status: "planned" })} disabled={isPending} data-testid="button-save-audit">
              {isPending ? "Creating..." : "Create Audit"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Process Notes Dialog ───────────────────────────────────────────────────────

function ProcessNotesDialog({ process, existing, onSave, onClose, isPending }: {
  process: ProcessEntry;
  existing?: IsoAuditProcessNote;
  onSave: (data: any) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    processName: process.name,
    processObjectives: existing?.processObjectives || "",
    isObjectiveMet: existing?.isObjectiveMet || "",
    objectiveMetNotes: existing?.objectiveMetNotes || "",
    processInputs: existing?.processInputs || (process.inputs || ""),
    processOutputs: existing?.processOutputs || (process.outputs || ""),
    processInteractions: existing?.processInteractions || "",
    personnelInterviewed: existing?.personnelInterviewed || "",
    processDescription: existing?.processDescription || "",
    objectiveEvidence: existing?.objectiveEvidence || "",
    nonconformances: existing?.nonconformances || "",
    opportunities: existing?.opportunities || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Audit Notes — {process.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Process Objective */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Process Objective / KPI Targets</p>
            </div>
            <Textarea
              placeholder="State the process objective and KPI targets (e.g. OTD ≥ 98%, defect rate ≤ 0.5%)…"
              value={form.processObjectives}
              onChange={e => set("processObjectives", e.target.value)}
              rows={2}
              data-testid="textarea-process-objectives"
            />
            <div>
              <Label className="text-xs">Is the Objective Being Met?</Label>
              <div className="flex gap-2 mt-1.5">
                {[
                  { value: "yes",     label: "Yes — Met",           cls: "border-green-400 bg-green-50 text-green-800" },
                  { value: "partial", label: "Partially Met",        cls: "border-amber-400 bg-amber-50 text-amber-800" },
                  { value: "no",      label: "No — Not Met",         cls: "border-red-400 bg-red-50 text-red-800" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${form.isObjectiveMet === opt.value ? opt.cls + " ring-2 ring-offset-1 ring-current" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    onClick={() => set("isObjectiveMet", opt.value)}
                    data-testid={`button-objective-met-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {form.isObjectiveMet && form.isObjectiveMet !== "yes" && (
              <div>
                <Label className="text-xs">Explanation</Label>
                <Textarea placeholder="Explain why objective is not or only partially met…" value={form.objectiveMetNotes} onChange={e => set("objectiveMetNotes", e.target.value)} rows={2} data-testid="textarea-objective-met-notes" />
              </div>
            )}
          </div>

          {/* Personnel */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-primary" />Personnel Interviewed</Label>
            <Input placeholder="Names and roles of personnel interviewed during this audit…" value={form.personnelInterviewed} onChange={e => set("personnelInterviewed", e.target.value)} data-testid="input-personnel" />
          </div>

          {/* Process Description */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1"><BookOpen className="w-3.5 h-3.5 text-primary" />Process Description (Auditor Observations)</Label>
            <Textarea placeholder="Describe how the process operates, what was observed, and how it interacts with other processes…" value={form.processDescription} onChange={e => set("processDescription", e.target.value)} rows={3} data-testid="textarea-process-description" />
          </div>

          {/* Inputs / Outputs / Interactions */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Inputs / Outputs / Interactions</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Process Inputs</Label>
                <Textarea placeholder="Materials, information, or resources entering this process…" value={form.processInputs} onChange={e => set("processInputs", e.target.value)} rows={2} data-testid="textarea-inputs" />
              </div>
              <div>
                <Label className="text-xs">Process Outputs</Label>
                <Textarea placeholder="Products, services, records, or information produced…" value={form.processOutputs} onChange={e => set("processOutputs", e.target.value)} rows={2} data-testid="textarea-outputs" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Interactions with Other Processes</Label>
              <Input placeholder="e.g. Receives orders from Sales; feeds into Production…" value={form.processInteractions} onChange={e => set("processInteractions", e.target.value)} data-testid="input-interactions" />
            </div>
          </div>

          {/* Objective Evidence */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1">
              <Search className="w-3.5 h-3.5 text-primary" />
              Objective Evidence Reviewed
              <span className="text-xs text-muted-foreground font-normal">(one item per line)</span>
            </Label>
            <Textarea
              placeholder={"Procedure QP-01 Rev 4 reviewed\nTraining records for 5 operators verified\nInspection log for last 30 days sampled"}
              value={form.objectiveEvidence}
              onChange={e => set("objectiveEvidence", e.target.value)}
              rows={4}
              data-testid="textarea-evidence"
            />
          </div>

          {/* Nonconformances */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Nonconformances (NC)
              <span className="text-xs text-muted-foreground font-normal">(one per line)</span>
            </Label>
            <Textarea
              placeholder={"Calibration record for Instrument #42 missing — ISO 9001 §7.1.5\nNo evidence of management review output action items"}
              value={form.nonconformances}
              onChange={e => set("nonconformances", e.target.value)}
              rows={3}
              className="border-red-200 focus-visible:ring-red-400"
              data-testid="textarea-nonconformances"
            />
          </div>

          {/* Opportunities for Improvement */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1 text-amber-700">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              Opportunities for Improvement (OFI)
              <span className="text-xs text-muted-foreground font-normal">(one per line)</span>
            </Label>
            <Textarea
              placeholder={"Consider automating the defect logging step to reduce transcription errors\nVisual management boards could improve real-time KPI visibility"}
              value={form.opportunities}
              onChange={e => set("opportunities", e.target.value)}
              rows={3}
              className="border-amber-200 focus-visible:ring-amber-400"
              data-testid="textarea-opportunities"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave(form)} disabled={isPending} data-testid="button-save-process-notes">
              {isPending ? "Saving..." : "Save Process Notes"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Finding Dialog (Legacy — clause-by-clause) ─────────────────────────────────

function FindingDialog({ clause, clauseTitle, existing, onSave, onDelete, onClose, isPending }: {
  clause: string; clauseTitle: string; existing?: IsoAuditFinding;
  onSave: (data: any) => void; onDelete?: () => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    id: existing?.id, clause, clauseTitle,
    findingType: existing?.findingType || "conform",
    description: existing?.description || "",
    evidence: existing?.evidence || "",
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Clause {clause} — {clauseTitle}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Finding Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {FINDING_TYPES.map(t => (
                <button key={t.value} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${form.findingType === t.value ? t.color + " ring-2 ring-offset-1 ring-current" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`} onClick={() => setForm(f => ({ ...f, findingType: t.value }))} data-testid={`button-finding-type-${t.value}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {form.findingType !== "not_audited" && (
            <>
              <div>
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea placeholder="Describe the finding..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} data-testid="textarea-finding-description" />
              </div>
              <div>
                <Label>Evidence <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input placeholder="Document reviewed, record number, person interviewed..." value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} data-testid="input-finding-evidence" />
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave(form)} disabled={isPending} data-testid="button-save-finding">
              {isPending ? "Saving..." : "Save Finding"}
            </Button>
            {onDelete && <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onDelete} data-testid="button-delete-finding"><Trash2 className="w-4 h-4" /></Button>}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Risk Assessment Dialog ─────────────────────────────────────────────────────

function RiskAssessmentDialog({ processName, processType, existing, onSave, onDelete, onClose, isPending }: {
  processName: string; processType: "COP" | "SOP" | "MOP"; existing?: AuditProcessSchedule;
  onSave: (data: any) => void; onDelete?: () => void; onClose: () => void; isPending: boolean;
}) {
  const defaults: Record<RiskKey, number> = {
    riskComplexity: existing?.riskComplexity || 2,
    riskCustomerImpact: existing?.riskCustomerImpact || 2,
    riskPreviousAudit: existing?.riskPreviousAudit || 2,
    riskPerformance: existing?.riskPerformance || 2,
    riskChangeFreq: existing?.riskChangeFreq || 2,
    riskComplaints: existing?.riskComplaints || 2,
  };

  const [scores, setScores] = useState<Record<RiskKey, number>>(defaults);
  const [lastAuditDate, setLastAuditDate] = useState(existing?.lastAuditDate ? new Date(existing.lastAuditDate).toISOString().slice(0, 10) : "");
  const [nextDateOverride, setNextDateOverride] = useState(existing?.nextAuditDate ? new Date(existing.nextAuditDate).toISOString().slice(0, 10) : "");
  const [auditorAssigned, setAuditorAssigned] = useState(existing?.auditorAssigned || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [consultantAudit, setConsultantAudit] = useState(existing?.consultantAudit ?? false);

  const total = calcTotalScore(scores);
  const freqKey = scoreToFreq(total);
  const freqCfg = FREQ_CONFIG[freqKey];
  const autoNext = calcNextDate(lastAuditDate || null, freqKey);

  const riskStatus = total <= 25 ? "IN CONTROL" : total <= 50 ? "NEEDS ATTENTION" : "NEEDS IMMEDIATE ATTENTION";
  const riskStatusColor = total <= 25 ? "text-green-700" : total <= 50 ? "text-amber-700" : "text-red-700";

  const handleSave = () => {
    onSave({
      ...(existing?.id ? { id: existing.id } : {}),
      processName, processType,
      ...scores,
      recommendedFrequency: freqKey,
      consultantAudit,
      lastAuditDate: lastAuditDate || null,
      nextAuditDate: nextDateOverride || autoNext,
      auditorAssigned: auditorAssigned || null,
      notes: notes || null,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Risk Assessment — {processName}
          </DialogTitle>
        </DialogHeader>

        {/* Live score summary */}
        <div className={`rounded-lg border p-4 ${freqCfg.rangeColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold uppercase tracking-wide ${riskStatusColor}`}>{riskStatus}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{freqCfg.sublabel}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-foreground leading-none">{total} <span className="text-sm font-normal text-muted-foreground">/60 pts</span></p>
              <Badge className={`text-sm border mt-1 ${freqCfg.badgeColor}`}>{freqCfg.label}</Badge>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>6 — All LOW</span>
              <span className="text-green-700 font-medium">≤25 = 3-Year</span>
              <span className="text-amber-700 font-medium">26-50 = 12-24 mo</span>
              <span className="text-red-700 font-medium">&gt;50 = 6-9 mo</span>
              <span>60 — All CRITICAL</span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 relative">
              <div className="absolute top-0 bottom-0 border-l-2 border-green-400 border-dashed" style={{ left: `${((25-6)/54)*100}%` }} />
              <div className="absolute top-0 bottom-0 border-l-2 border-amber-400 border-dashed" style={{ left: `${((50-6)/54)*100}%` }} />
              <div
                className={`h-3 rounded-full transition-all ${freqCfg.barColor}`}
                style={{ width: `${Math.min(100, Math.max(2, ((total - 6) / 54) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Consultant audit toggle */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
          <Checkbox
            id="consultant-audit"
            checked={consultantAudit}
            onCheckedChange={(v) => setConsultantAudit(!!v)}
            data-testid="checkbox-consultant-audit"
          />
          <div>
            <Label htmlFor="consultant-audit" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-gray-500" />Consultant Audit
            </Label>
            <p className="text-xs text-muted-foreground">Check if this process is to be audited by an external consultant (shown in grey on the schedule table).</p>
          </div>
        </div>

        {/* 6 Risk Criteria */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Risk Ranking — 6 Criteria (1–10 each)</p>
          {RISK_CRITERIA.map((criterion, idx) => {
            const currentScore = scores[criterion.key];
            const currentBand = getBandForScore(currentScore);
            return (
              <div key={criterion.key} className="border rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{idx + 1}. {criterion.label}</p>
                    <p className="text-xs text-muted-foreground">{criterion.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${currentBand.dot}`} />
                    <span className="text-sm font-bold text-foreground">{currentScore} pts</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {BANDS.map((band, bi) => (
                    <button
                      key={band.label}
                      onClick={() => setScores(prev => ({ ...prev, [criterion.key]: band.score }))}
                      className={`rounded-lg border p-2.5 text-left transition-all text-xs ${getBandForScore(currentScore) === band ? band.color.active : band.color.inactive}`}
                      data-testid={`button-band-${criterion.key}-${band.label}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${band.dot}`} />
                        <span className="font-bold">{band.label}</span>
                        <span className="text-muted-foreground ml-auto">{band.range}</span>
                      </div>
                      <p className="text-xs opacity-80 leading-snug">{criterion.bandDescs[bi]}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scheduling fields */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <Label>Last Audit Date</Label>
            <Input type="date" value={lastAuditDate} onChange={e => setLastAuditDate(e.target.value)} data-testid="input-last-audit-date" />
          </div>
          <div>
            <Label>
              Next Audit Date
              {lastAuditDate && <span className="text-muted-foreground font-normal text-xs ml-1">(auto: {autoNext})</span>}
            </Label>
            <Input type="date" value={nextDateOverride || autoNext} onChange={e => setNextDateOverride(e.target.value)} data-testid="input-next-audit-date" />
          </div>
          <div>
            <Label>Auditor Assigned <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Auditor name" value={auditorAssigned} onChange={e => setAuditorAssigned(e.target.value)} data-testid="input-auditor-assigned" />
          </div>
          <div>
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Any context or notes..." value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-schedule-notes" />
          </div>
        </div>

        {/* Reference reminder */}
        <div className="flex items-start gap-2 text-xs p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Scoring reference: </strong>
            Total 1–25 = In Control → 3-Year cycle &nbsp;|&nbsp;
            26–50 = Needs Attention → 12–24 months &nbsp;|&nbsp;
            &gt;50 = Needs Immediate Attention → 6–9 months
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isPending} data-testid="button-save-schedule">
            {isPending ? "Saving..." : existing ? "Update Assessment" : "Save Assessment"}
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Remove this assessment?")) onDelete(); }} data-testid="button-delete-schedule">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
