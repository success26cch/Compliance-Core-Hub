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
  Plus, ClipboardCheck, AlertTriangle, Trash2, ChevronRight,
  Calendar, User, BookOpen, Shield, Activity, AlertCircle,
  BarChart3, Info, CheckCircle2, Clock, HardHat,
} from "lucide-react";
import type { IsoAudit, IsoAuditFinding, AuditProcessSchedule } from "@shared/schema";
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
    { clause: "8.2", title: "Emergency preparedness and response" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Incident, nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
};

const FINDING_TYPES = [
  { value: "conform", label: "Conform", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "nonconformance", label: "Nonconformance", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "observation", label: "Observation", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "not_audited", label: "Not Audited", color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  complete: "bg-green-100 text-green-800 border-green-200",
};

function getClausesForStandard(standard: string) {
  return CLAUSES_BY_STANDARD[standard] || CLAUSES_BY_STANDARD["ISO 9001:2015"];
}

// ── Risk-Ranking Framework ────────────────────────────────────────────────────
// Per criterion: 1-3=LOW, 4-6=MEDIUM, 7-9=HIGH, 10=CRITICAL
// Total score:  1-25=In Control (3-year), 26-50=Needs Attention (12-24 mo), >50=Needs Immediate (6-9 mo)

type RiskKey = "riskComplexity" | "riskCustomerImpact" | "riskPreviousAudit" | "riskPerformance" | "riskChangeFreq" | "riskComplaints";

// The 4 selectable bands per criterion — click selects the representative score
const BANDS = [
  { label: "LOW", range: "1–3", score: 2, color: { active: "bg-green-100 border-green-500 text-green-800 ring-1 ring-green-500", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-green-50" }, dot: "bg-green-500" },
  { label: "MEDIUM", range: "4–6", score: 5, color: { active: "bg-amber-100 border-amber-500 text-amber-800 ring-1 ring-amber-500", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-amber-50" }, dot: "bg-amber-500" },
  { label: "HIGH", range: "7–9", score: 8, color: { active: "bg-orange-100 border-orange-500 text-orange-800 ring-1 ring-orange-500", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-orange-50" }, dot: "bg-orange-500" },
  { label: "CRITICAL", range: "10", score: 10, color: { active: "bg-red-100 border-red-600 text-red-900 ring-2 ring-red-600", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-red-50" }, dot: "bg-red-600" },
];

function getBandForScore(score: number): typeof BANDS[number] {
  if (score <= 3) return BANDS[0];
  if (score <= 6) return BANDS[1];
  if (score <= 9) return BANDS[2];
  return BANDS[3];
}

const RISK_CRITERIA: Array<{
  key: RiskKey;
  label: string;
  subtitle: string;
  bandDescs: [string, string, string, string]; // LOW, MEDIUM, HIGH, CRITICAL
}> = [
  {
    key: "riskComplexity",
    label: "Risk of Process Failure",
    subtitle: "Potential consequence if this process fails",
    bandDescs: [
      "Failure has little to no risk of adversely affecting customer satisfaction, product quality, delivery, or profitability",
      "Failure could have a moderate adverse effect on operations or customer expectations",
      "Failure will most likely have a significant adverse effect on customer satisfaction, product quality, delivery, or profitability",
      "Failure will most likely cause safety or regulatory compliance issues",
    ],
  },
  {
    key: "riskPerformance",
    label: "Process Performance Status",
    subtitle: "Current state of metrics, KPIs, objectives, and complaints",
    bandDescs: [
      "All performance indicators (metrics, KPIs, objectives, complaints, audit results) show a stable/controlled state",
      "Some indicators trending down, occasional issues, borderline performance",
      "Poor performance for 6+ months, adverse trends, significant audit findings in past 12 months, or new process with major changes planned",
      "Not addressing objectives, not meeting goals/targets — safety or regulatory compliance issues present",
    ],
  },
  {
    key: "riskPreviousAudit",
    label: "Previous Audit Findings",
    subtitle: "Results of the most recent internal or external audit",
    bandDescs: [
      "No significant findings — process was fully conforming",
      "Minor observations or OFIs only; no nonconformances",
      "Minor nonconformances raised; corrective actions closed but recurrence risk exists",
      "Major NC or regulatory finding in past 12 months; actions still open or recurring",
    ],
  },
  {
    key: "riskChangeFreq",
    label: "Process Change & Stability",
    subtitle: "How stable and established is this process?",
    bandDescs: [
      "Well-established, no significant changes in 12+ months",
      "Minor changes to methods, equipment, or personnel",
      "Major changes recently implemented or planned (new products, equipment overhaul, process redesign)",
      "New process or radical change — not yet validated or stabilized",
    ],
  },
  {
    key: "riskComplaints",
    label: "Customer Complaints & External Feedback",
    subtitle: "Complaint and field-failure history linked to this process",
    bandDescs: [
      "No complaints or field failures linked to this process in the past 12 months",
      "1–2 minor complaints per year linked to this process",
      "Recurring complaints, warranty issues, or supplier corrective action requests",
      "Escalated customer complaints, production stops, 8D required, or field safety issues",
    ],
  },
  {
    key: "riskCustomerImpact",
    label: "Regulatory & Compliance Risk",
    subtitle: "Regulatory and legal exposure tied to this process",
    bandDescs: [
      "Minimal regulatory requirements — process is low-risk compliance-wise",
      "Subject to standard regulatory requirements (EHS, DOT, etc.); generally in compliance",
      "Significant regulatory oversight; compliance issues have occurred in the past",
      "Active regulatory violations, enforcement actions, citations, or safety-critical requirements",
    ],
  },
];

// ── Frequency / Status Config ─────────────────────────────────────────────────

const FREQ_CONFIG = {
  triennial: {
    label: "3-Year Cycle",
    sublabel: "Audit at least once every 3 years",
    months: 36,
    scoreRange: "1–25",
    status: "IN CONTROL",
    statusColor: "text-green-700",
    badgeColor: "bg-green-100 text-green-800 border-green-200",
    barColor: "bg-green-500",
    rangeColor: "border-green-200 bg-green-50",
  },
  biennial: {
    label: "12–24 Months",
    sublabel: "Audit within the next 12–24 months",
    months: 18,
    scoreRange: "26–50",
    status: "NEEDS ATTENTION",
    statusColor: "text-amber-700",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    barColor: "bg-amber-500",
    rangeColor: "border-amber-200 bg-amber-50",
  },
  urgent: {
    label: "6–9 Months",
    sublabel: "Audit within the next 6–9 months",
    months: 7,
    scoreRange: ">50",
    status: "NEEDS IMMEDIATE ATTENTION",
    statusColor: "text-red-700",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    barColor: "bg-red-500",
    rangeColor: "border-red-200 bg-red-50",
  },
};

type FreqKey = keyof typeof FREQ_CONFIG;

const SCHED_STATUS = {
  overdue:      { label: "Overdue",      color: "bg-red-100 text-red-800 border-red-200" },
  due_soon:     { label: "Due Soon",     color: "bg-amber-100 text-amber-800 border-amber-200" },
  on_track:     { label: "On Track",     color: "bg-green-100 text-green-800 border-green-200" },
  not_assessed: { label: "Not Assessed", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const TYPE_BADGE: Record<string, string> = {
  COP: "bg-orange-100 text-orange-800 border-orange-200",
  SOP: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MOP: "bg-blue-100 text-blue-800 border-blue-200",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcTotalScore(entry: Partial<Record<RiskKey, number>>): number {
  const keys: RiskKey[] = ["riskComplexity", "riskCustomerImpact", "riskPreviousAudit", "riskPerformance", "riskChangeFreq", "riskComplaints"];
  return keys.reduce((sum, k) => sum + (entry[k] || 1), 0);
}

function scoreToFreq(total: number): FreqKey {
  if (total <= 25) return "triennial";
  if (total <= 50) return "biennial";
  return "urgent";
}

function calcNextDate(lastDate: string | Date | null | undefined, freq: FreqKey): string {
  const base = lastDate ? new Date(lastDate) : new Date();
  const months = FREQ_CONFIG[freq].months;
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

function getScheduleStatus(entry: AuditProcessSchedule): keyof typeof SCHED_STATUS {
  if (!entry.recommendedFrequency) return "not_assessed";
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

// ── Main Component ─────────────────────────────────────────────────────────────

export function InternalAuditModule({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"audits" | "schedule">("audits");
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [showCreateAudit, setShowCreateAudit] = useState(false);
  const [findingDialog, setFindingDialog] = useState<{ open: boolean; clause: string; clauseTitle: string; existing?: IsoAuditFinding } | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState<{ processName: string; processType: "COP" | "SOP" | "MOP"; existing?: AuditProcessSchedule } | null>(null);

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

  // ── Audit detail ──────────────────────────────────────────────────────────────
  if (selectedAudit) {
    const pctAudited = clauses.length > 0 ? Math.round((findings.filter(f => f.findingType !== "not_audited").length / clauses.length) * 100) : 0;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAuditId(null)} className="text-muted-foreground hover:text-foreground text-sm">← All Audits</button>
            <span className="text-muted-foreground">/</span>
            <h2 className="font-semibold text-primary">{selectedAudit.standard}</h2>
            <Badge className={`text-xs border ${STATUS_COLORS[selectedAudit.status] || STATUS_COLORS.planned}`}>{selectedAudit.status.replace("_", " ").toUpperCase()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedAudit.status === "planned" && <Button size="sm" variant="outline" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "in_progress" } })}>Start Audit</Button>}
            {selectedAudit.status === "in_progress" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "complete", completedDate: new Date().toISOString() } })}>Mark Complete</Button>}
            {onAskIsa && <Button size="sm" variant="outline" onClick={() => onAskIsa(`I'm conducting an internal audit for ${selectedAudit.standard}. I have ${findingCounts.nonconformance || 0} nonconformances and ${findingCounts.observation || 0} observations. Can you help me think through the findings and next steps?`)}>Ask Isa</Button>}
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Delete this audit?")) deleteAudit.mutate(selectedAudit.id); }} data-testid="button-delete-audit"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="px-6 py-3 border-b bg-muted/30 flex flex-wrap items-center gap-6 text-sm">
          {selectedAudit.leadAuditor && <span className="flex items-center gap-1.5 text-muted-foreground"><User className="w-3.5 h-3.5" />{selectedAudit.leadAuditor}</span>}
          {selectedAudit.scheduledDate && <span className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" />{new Date(selectedAudit.scheduledDate).toLocaleDateString()}</span>}
          {selectedAudit.scope && <span className="flex items-center gap-1.5 text-muted-foreground"><BookOpen className="w-3.5 h-3.5" />{selectedAudit.scope}</span>}
          <span className="ml-auto flex items-center gap-3 font-medium">
            <span className="text-green-700">{findingCounts.conform || 0} Conform</span>
            <span className="text-red-700">{findingCounts.nonconformance || 0} NC</span>
            <span className="text-yellow-700">{findingCounts.observation || 0} OFI</span>
            <span className="text-muted-foreground text-xs">{pctAudited}% audited</span>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground w-16">Clause</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Requirement</th>
                <th className="px-4 py-2 font-medium text-muted-foreground w-36">Finding</th>
                <th className="px-4 py-2 font-medium text-muted-foreground w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clauses.map(({ clause, title }) => {
                const finding = findingForClause(clause);
                const typeInfo = FINDING_TYPES.find(t => t.value === finding?.findingType);
                return (
                  <tr key={clause} className="hover:bg-muted/20 group" data-testid={`row-audit-clause-${clause}`}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{clause}</td>
                    <td className="px-4 py-3 text-foreground">{title}</td>
                    <td className="px-4 py-3">
                      {finding ? <Badge className={`text-xs border ${typeInfo?.color || "bg-gray-100 text-gray-600 border-gray-200"}`}>{typeInfo?.label || finding.findingType}</Badge> : <span className="text-muted-foreground text-xs italic">Not recorded</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-accent hover:underline" onClick={() => setFindingDialog({ open: true, clause, clauseTitle: title, existing: finding })} data-testid={`button-record-finding-${clause}`}>
                        {finding ? "Edit" : "Record"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
              <p className="text-sm text-muted-foreground/70">Create your first internal audit to start tracking clause-by-clause conformance.</p>
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
                        <p className="text-xs text-muted-foreground">{audit.scope || "No scope defined"} {audit.leadAuditor && `· ${audit.leadAuditor}`}</p>
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
              <th className="py-3 px-4 text-left font-semibold border-r border-white/20 w-44">Process</th>
              <th className="py-3 px-3 text-left font-semibold border-r border-white/20 w-32">Process Owner</th>
              <th className="py-3 px-2 font-semibold border-r border-white/20 w-20">Audit Type</th>
              <th className="py-3 px-3 font-semibold border-r border-white/20 w-28">Auditor</th>
              <th className="py-3 px-2 font-semibold border-r border-white/20 w-20">Freq / Year</th>
              <th className="py-3 px-2 font-semibold border-r border-white/20 w-14">Risk</th>
              <th className="py-3 px-3 font-semibold border-r border-white/20 w-36">Status</th>
              <th className="py-3 px-3 font-semibold border-r border-white/20 w-48">Related Clauses</th>
              <th className="py-3 px-3 font-semibold border-r border-white/20">Notes / Reason for Revision</th>
              <th className="py-3 px-2 font-semibold border-r border-white/20 w-16">Score</th>
              <th className="py-3 px-3 font-semibold border-r border-white/20 w-28">Last Audit Date</th>
              <th className="py-3 px-3 font-semibold border-r border-white/20 w-24">Next Audit Date</th>
              <th className="py-3 px-2 font-semibold w-14" />
            </tr>
          </thead>

          <tbody>
            {(["COP", "SOP", "MOP"] as const).map(typeGroup => {
              const groupProcs = processes.filter(p => normalizeProcessType(p.row) === typeGroup);
              if (groupProcs.length === 0) return null;
              const style = TYPE_ROW_STYLE[typeGroup];
              return (
                <>
                  {/* Group section header */}
                  <tr key={`grp-${typeGroup}`}>
                    <td colSpan={13} className={`${style.headerBg} ${style.headerText} px-4 py-1.5`}>
                      <span className="text-xs font-bold uppercase tracking-widest">{style.label}</span>
                    </td>
                  </tr>

                  {groupProcs.map((proc, idx) => {
                    const pType = normalizeProcessType(proc.row);
                    const entry = scheduleEntries.find(e => e.processName === proc.name);
                    const score = entry ? calcTotalScore(entry) : null;
                    const freqKey = score !== null ? scoreToFreq(score) : null;
                    const freqCfg = freqKey ? FREQ_CONFIG[freqKey] : null;
                    const isConsultant = entry?.consultantAudit === true;
                    const schedStatus = entry ? getScheduleStatus(entry) : "not_assessed";
                    const rowBg = isConsultant ? "bg-gray-50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/60";
                    const nextDateStyle = nextDateCellStyle(entry?.nextAuditDate);

                    const statusLabel = freqKey === "triennial" ? "IN CONTROL" : freqKey === "biennial" ? "NEEDS ATTENTION" : freqKey === "urgent" ? "NEEDS IMMEDIATE ATTENTION" : null;
                    const statusColor = freqKey === "triennial" ? "text-green-700" : freqKey === "biennial" ? "text-amber-700" : "text-red-700";

                    return (
                      <tr
                        key={proc.name}
                        className={`group border-b border-gray-100 hover:bg-primary/5 transition-colors ${rowBg} ${style.border} ${isConsultant ? "opacity-70" : ""}`}
                        data-testid={`row-schedule-${proc.name}`}
                      >
                        {/* Process */}
                        <td className="py-3 px-4 border-r border-gray-100">
                          <div className="flex items-center gap-1.5">
                            {isConsultant && <HardHat className="w-3 h-3 text-gray-400 shrink-0" title="Consultant audit" />}
                            <span className={`font-semibold leading-snug ${isConsultant ? "text-gray-400" : "text-foreground"}`}>{proc.name}</span>
                          </div>
                        </td>

                        {/* Process Owner / Champion */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          {proc.owner ? (
                            <span className="text-foreground font-medium">{proc.owner}</span>
                          ) : (
                            <span className="text-muted-foreground/40 italic">—</span>
                          )}
                        </td>

                        {/* Audit Type */}
                        <td className="py-3 px-2 text-center border-r border-gray-100 text-muted-foreground">
                          System
                        </td>

                        {/* Auditor */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          {isConsultant ? (
                            <span className="flex items-center gap-1 text-gray-400 italic text-xs"><HardHat className="w-3 h-3" />Consultant</span>
                          ) : entry?.auditorAssigned ? (
                            <span className="font-medium text-foreground">{entry.auditorAssigned}</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic">—</span>
                          )}
                        </td>

                        {/* Freq / Year */}
                        <td className="py-3 px-2 text-center border-r border-gray-100">
                          {freqKey ? (
                            <span className="font-semibold text-foreground">{freqLabel(freqKey)}</span>
                          ) : <span className="text-muted-foreground/40">—</span>}
                        </td>

                        {/* Risk score (raw /60) */}
                        <td className="py-3 px-2 text-center border-r border-gray-100">
                          {score !== null ? (
                            <span className={`text-sm font-black ${freqCfg?.statusColor || "text-gray-500"}`}>{score}</span>
                          ) : <span className="text-muted-foreground/30">—</span>}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          {statusLabel ? (
                            <span className={`font-bold text-xs ${statusColor}`}>{statusLabel}</span>
                          ) : (
                            <span className="text-muted-foreground/40 italic text-xs">Not assessed</span>
                          )}
                          {freqCfg && (
                            <div className="mt-1 w-full h-1 rounded-full bg-gray-200">
                              <div className={`h-1 rounded-full ${freqCfg.barColor}`} style={{ width: `${Math.min(100, ((score! - 6) / 54) * 100)}%` }} />
                            </div>
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

                        {/* Total score /60 */}
                        <td className="py-3 px-2 text-center border-r border-gray-100">
                          {score !== null ? (
                            <div>
                              <span className="font-bold text-foreground text-sm">{score}</span>
                              <span className="text-muted-foreground">/60</span>
                            </div>
                          ) : <span className="text-muted-foreground/30">—</span>}
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
      <div className="flex items-center flex-wrap gap-4 px-5 py-2.5 bg-[#1a2744]/5 border-t text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Next Audit Date:</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-red-600 inline-block" />Overdue</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-orange-400 inline-block" />Due ≤ 3 months</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-yellow-300 inline-block" />Due ≤ 12 months</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-yellow-100 border inline-block" />Due ≤ 18 months</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-green-50 border inline-block" />On Track</span>
        <span className="ml-auto flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5" />Grey row = Consultant Audit</span>
      </div>
    </div>
  );
}

// ── Create Audit Dialog ────────────────────────────────────────────────────────

function CreateAuditDialog({ onSave, onClose, isPending }: { onSave: (data: any) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState({ standard: "ISO 9001:2015", scope: "", leadAuditor: "", scheduledDate: "" });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Internal Audit</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Standard</Label>
            <Select value={form.standard} onValueChange={v => setForm(f => ({ ...f, standard: v }))}>
              <SelectTrigger data-testid="select-audit-standard"><SelectValue /></SelectTrigger>
              <SelectContent>{ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Scope <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="e.g. Production processes, Clauses 7–8" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} data-testid="input-audit-scope" />
          </div>
          <div>
            <Label>Lead Auditor <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Name" value={form.leadAuditor} onChange={e => setForm(f => ({ ...f, leadAuditor: e.target.value }))} data-testid="input-lead-auditor" />
          </div>
          <div>
            <Label>Scheduled Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} data-testid="input-scheduled-date" />
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

// ── Finding Dialog ─────────────────────────────────────────────────────────────

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

  // Determine overall risk status from total
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
          {/* Score bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>6 — All LOW</span>
              <span className="text-green-700 font-medium">≤25 = 3-Year</span>
              <span className="text-amber-700 font-medium">26-50 = 12-24 mo</span>
              <span className="text-red-700 font-medium">&gt;50 = 6-9 mo</span>
              <span>60 — All CRITICAL</span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 relative">
              {/* Zone markers */}
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
