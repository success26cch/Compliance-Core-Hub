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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ClipboardCheck, AlertTriangle, Trash2, ChevronRight,
  Calendar, User, BookOpen, Shield, Activity, AlertCircle,
  BarChart3, Info, CheckCircle2, Clock,
} from "lucide-react";
import type { IsoAudit, IsoAuditFinding, AuditProcessSchedule } from "@shared/schema";

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
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the EMS" },
    { clause: "4.4", title: "Environmental management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Environmental policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Environmental aspects" },
    { clause: "6.1.3", title: "Compliance obligations" },
    { clause: "6.2", title: "Environmental objectives and planning to achieve them" },
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
    { clause: "4.2", title: "Understanding the needs and expectations of workers and interested parties" },
    { clause: "4.3", title: "Determining the scope of the OH&SMS" },
    { clause: "4.4", title: "OH&S management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "OH&S policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities, and authorities" },
    { clause: "5.4", title: "Consultation and participation of workers" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Hazard identification; assessment of risks and opportunities" },
    { clause: "6.1.3", title: "Determination of legal requirements and other requirements" },
    { clause: "6.2", title: "OH&S objectives and planning to achieve them" },
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

// ── Schedule: Risk Criteria (IATF 9.2.2.2) ────────────────────────────────────

type RiskKey = "riskComplexity" | "riskCustomerImpact" | "riskPreviousAudit" | "riskPerformance" | "riskChangeFreq" | "riskComplaints" | "riskCompliance";

const RISK_CRITERIA: Array<{
  key: RiskKey;
  label: string;
  clause: string;
  scores: { value: 1 | 2 | 3; label: string; desc: string }[];
}> = [
  {
    key: "riskComplexity",
    label: "Process Complexity & Significance",
    clause: "§9.2.2.2 — Process significance",
    scores: [
      { value: 1, label: "Low", desc: "Simple, routine, well-controlled" },
      { value: 2, label: "Medium", desc: "Moderate complexity or some variability" },
      { value: 3, label: "High", desc: "Complex, high variability, or critical to quality" },
    ],
  },
  {
    key: "riskCustomerImpact",
    label: "Customer & Product Impact",
    clause: "§9.2.2.2 — Process significance",
    scores: [
      { value: 1, label: "Low", desc: "Indirect impact on customer requirements" },
      { value: 2, label: "Medium", desc: "Moderate impact on product/service quality" },
      { value: 3, label: "High", desc: "Directly affects customer-specific or safety requirements" },
    ],
  },
  {
    key: "riskPreviousAudit",
    label: "Previous Audit Results",
    clause: "§9.2.2.2b — Results of previous audits",
    scores: [
      { value: 1, label: "Conforming", desc: "Fully conforming — no issues found" },
      { value: 2, label: "Observations", desc: "OFIs or minor observations only, no NCs" },
      { value: 3, label: "Nonconformances", desc: "Major or minor NCs were raised" },
    ],
  },
  {
    key: "riskPerformance",
    label: "Process Performance & KPIs",
    clause: "§9.2.2.2a — Performance results & indicators",
    scores: [
      { value: 1, label: "On-Target", desc: "All KPIs consistently meeting targets" },
      { value: 2, label: "Borderline", desc: "Some KPIs trending down or borderline" },
      { value: 3, label: "Off-Target", desc: "KPIs consistently failing targets" },
    ],
  },
  {
    key: "riskChangeFreq",
    label: "Change Frequency",
    clause: "§9.2.2.2c — Changes affecting the organization",
    scores: [
      { value: 1, label: "Stable", desc: "No significant changes in past 12 months" },
      { value: 2, label: "Occasional", desc: "New equipment, personnel, or method changes" },
      { value: 3, label: "Frequent", desc: "Frequent or recent major process changes" },
    ],
  },
  {
    key: "riskComplaints",
    label: "Customer Complaints & Field Failures",
    clause: "§9.2.2.2d — Customer complaints & field failures",
    scores: [
      { value: 1, label: "None", desc: "No complaints or field failures in 12 months" },
      { value: 2, label: "Occasional", desc: "1–2 complaints per year linked to this process" },
      { value: 3, label: "Recurring", desc: "Recurring complaints, field failures, or warranty issues" },
    ],
  },
  {
    key: "riskCompliance",
    label: "Regulatory & Compliance Exposure",
    clause: "§9.2.2.2 — Risk-based approach",
    scores: [
      { value: 1, label: "Low", desc: "Minimal regulatory requirements" },
      { value: 2, label: "Moderate", desc: "Subject to regulatory requirements (EHS, DOT, etc.)" },
      { value: 3, label: "High", desc: "Direct regulatory risk, mandatory compliance, customer audits" },
    ],
  },
];

const FREQ_INFO: Record<string, { label: string; desc: string; months: number; color: string; badgeColor: string }> = {
  annual: {
    label: "Annual", desc: "Audit once per calendar year",
    months: 12,
    color: "text-green-700 bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-800 border-green-200",
  },
  semi_annual: {
    label: "Semi-Annual", desc: "Audit every 6 months",
    months: 6,
    color: "text-amber-700 bg-amber-50 border-amber-200",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  quarterly: {
    label: "Quarterly", desc: "Audit every 3 months",
    months: 3,
    color: "text-red-700 bg-red-50 border-red-200",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
  },
};

const TYPE_BADGE: Record<string, string> = {
  COP: "bg-orange-100 text-orange-800 border-orange-200",
  SOP: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MOP: "bg-blue-100 text-blue-800 border-blue-200",
};

const SCHED_STATUS = {
  overdue:      { label: "Overdue",      color: "bg-red-100 text-red-800 border-red-200" },
  due_soon:     { label: "Due Soon",     color: "bg-amber-100 text-amber-800 border-amber-200" },
  on_track:     { label: "On Track",     color: "bg-green-100 text-green-800 border-green-200" },
  not_assessed: { label: "Not Assessed", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcRiskScore(entry: Partial<Record<RiskKey, number>>): number {
  return (entry.riskComplexity || 1) + (entry.riskCustomerImpact || 1) + (entry.riskPreviousAudit || 1) +
    (entry.riskPerformance || 1) + (entry.riskChangeFreq || 1) + (entry.riskComplaints || 1) + (entry.riskCompliance || 1);
}

function calcFrequency(score: number, processType: string, prevAuditScore: number): string {
  let freq = score <= 10 ? "annual" : score <= 15 ? "semi_annual" : "quarterly";
  if (prevAuditScore === 3) {
    if (freq === "annual") freq = "semi_annual";
    else if (freq === "semi_annual") freq = "quarterly";
  }
  return freq;
}

function calcNextDate(lastDate: string | Date | null | undefined, freq: string): string {
  const base = lastDate ? new Date(lastDate) : new Date();
  const months = FREQ_INFO[freq]?.months || 12;
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

function getScheduleStatus(entry: AuditProcessSchedule): "overdue" | "due_soon" | "on_track" | "not_assessed" {
  if (!entry.recommendedFrequency) return "not_assessed";
  if (!entry.nextAuditDate) return "not_assessed";
  const diffDays = Math.ceil((new Date(entry.nextAuditDate).getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "due_soon";
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
  const processes: Array<{ name: string; row: string }> = (project?.processes || []);

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/audit-schedule"] }); setScheduleDialog(null); toast({ title: "Schedule entry removed" }); },
  });

  const clauses = selectedAudit ? getClausesForStandard(selectedAudit.standard) : [];
  const findingForClause = (clause: string) => findings.find(f => f.clause === clause);
  const findingCounts = findings.reduce((acc, f) => { acc[f.findingType] = (acc[f.findingType] || 0) + 1; return acc; }, {} as Record<string, number>);

  // ── Audit detail view ──────────────────────────────────────────────────────────
  if (selectedAudit) {
    const pctAudited = clauses.length > 0 ? Math.round((findings.filter(f => f.findingType !== "not_audited").length / clauses.length) * 100) : 0;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAuditId(null)} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">← All Audits</button>
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
  const dueSoon = scheduleEntries.filter(e => getScheduleStatus(e) === "due_soon").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h2 className="text-lg font-bold text-primary">Internal Audits</h2>
          <p className="text-xs text-muted-foreground">Plan, conduct, and schedule process-based internal audits.</p>
        </div>
        {activeTab === "audits" && (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1" onClick={() => setShowCreateAudit(true)} data-testid="button-create-audit">
            <Plus className="w-4 h-4" /> New Audit
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b bg-white px-6 gap-0">
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
                {overdue > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{overdue}</span>}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "audits" ? (
          /* ── Audit list ── */
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
          /* ── Audit Schedule ── */
          <div className="p-6 space-y-5">
            {/* IATF compliance note */}
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-sm">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-blue-800">
                <span className="font-semibold">IATF 16949 §9.2.2.2 &amp; §9.2.2.3 — </span>
                Risk criteria determine audit frequency for each process. All manufacturing (COP) processes must be audited at least annually. Nonconformances found automatically trigger increased frequency.
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Processes", value: processes.length, icon: Activity, color: "text-primary" },
                { label: "Assessed", value: scheduleEntries.length, icon: CheckCircle2, color: "text-green-600" },
                { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-red-600" },
                { label: "Due ≤ 30 Days", value: dueSoon, icon: Clock, color: "text-amber-600" },
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

            {/* Risk score legend */}
            <details className="group border rounded-lg bg-white">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                <Shield className="w-4 h-4" />
                Risk Score Guide — 7 IATF §9.2.2.2 Criteria
                <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Click to expand</span>
              </summary>
              <div className="px-4 pb-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="font-bold text-green-800">7 – 10 pts → Annual</p>
                  <p className="text-green-700 mt-1">Low-risk process. Minimum 1× per year (§9.2.2.3).</p>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="font-bold text-amber-800">11 – 15 pts → Semi-Annual</p>
                  <p className="text-amber-700 mt-1">Medium-risk. Audit every 6 months.</p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="font-bold text-red-800">16 – 21 pts → Quarterly</p>
                  <p className="text-red-700 mt-1">High-risk. Audit every 3 months.</p>
                </div>
              </div>
            </details>

            {/* No iso project warning */}
            {!project && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Connect a Process Map first in ISO Manager → Process Map.</p>
              </div>
            )}

            {/* Process schedule table */}
            {project && processes.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No processes found in your Process Map. Add processes there first.</p>
              </div>
            )}

            {project && processes.length > 0 && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                  <p className="text-sm font-semibold text-foreground">Process Audit Schedule</p>
                  {unassessed.length > 0 && (
                    <span className="text-xs text-muted-foreground">{unassessed.length} process{unassessed.length !== 1 ? "es" : ""} not yet assessed</span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr className="text-left">
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Process</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-16">Type</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-24">Risk Score</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-28">Frequency</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-24">Last Audit</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-24">Next Due</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-24">Status</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-24">Auditor</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {processes.map(proc => {
                        const pType = normalizeProcessType(proc.row);
                        const entry = scheduleEntries.find(e => e.processName === proc.name);
                        const score = entry ? calcRiskScore(entry) : null;
                        const status = entry ? getScheduleStatus(entry) : "not_assessed";
                        const statusInfo = SCHED_STATUS[status];
                        const freqInfo = entry?.recommendedFrequency ? FREQ_INFO[entry.recommendedFrequency] : null;
                        return (
                          <tr key={proc.name} className="hover:bg-muted/10" data-testid={`row-schedule-${proc.name}`}>
                            <td className="px-4 py-3 font-medium text-foreground">{proc.name}</td>
                            <td className="px-4 py-3">
                              <Badge className={`text-xs border ${TYPE_BADGE[pType] || TYPE_BADGE.SOP}`}>{pType}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              {score !== null ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded bg-gray-200 w-16">
                                    <div className={`h-1.5 rounded ${score <= 10 ? "bg-green-500" : score <= 15 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${((score - 7) / 14) * 100}%` }} />
                                  </div>
                                  <span className="text-xs font-semibold text-foreground">{score}/21</span>
                                </div>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {freqInfo ? (
                                <Badge className={`text-xs border ${freqInfo.badgeColor}`}>{freqInfo.label}</Badge>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {entry?.lastAuditDate ? new Date(entry.lastAuditDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {entry?.nextAuditDate ? new Date(entry.nextAuditDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`text-xs border ${statusInfo.color}`}>{statusInfo.label}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[96px]">
                              {entry?.auditorAssigned || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                className="text-xs text-accent hover:underline font-medium"
                                onClick={() => setScheduleDialog({ processName: proc.name, processType: pType, existing: entry })}
                                data-testid={`button-assess-${proc.name}`}
                              >
                                {entry ? "Edit" : "Assess"}
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

            {/* Orphaned schedule entries (process removed from map) */}
            {scheduleEntries.filter(e => !processes.find(p => p.name === e.processName)).length > 0 && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20">
                  <p className="text-sm font-semibold text-muted-foreground">Archived Processes (no longer in Process Map)</p>
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
            <Input placeholder="e.g. Production processes, Clause 7-8" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} data-testid="input-audit-scope" />
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
  const defaultScores: Record<RiskKey, number> = {
    riskComplexity: existing?.riskComplexity || 1,
    riskCustomerImpact: existing?.riskCustomerImpact || 1,
    riskPreviousAudit: existing?.riskPreviousAudit || 1,
    riskPerformance: existing?.riskPerformance || 1,
    riskChangeFreq: existing?.riskChangeFreq || 1,
    riskComplaints: existing?.riskComplaints || 1,
    riskCompliance: existing?.riskCompliance || 1,
  };

  const [scores, setScores] = useState<Record<RiskKey, number>>(defaultScores);
  const [lastAuditDate, setLastAuditDate] = useState(existing?.lastAuditDate ? new Date(existing.lastAuditDate).toISOString().slice(0, 10) : "");
  const [auditorAssigned, setAuditorAssigned] = useState(existing?.auditorAssigned || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [nextDateOverride, setNextDateOverride] = useState(existing?.nextAuditDate ? new Date(existing.nextAuditDate).toISOString().slice(0, 10) : "");

  const score = calcRiskScore(scores);
  const freq = calcFrequency(score, processType, scores.riskPreviousAudit);
  const autoNext = calcNextDate(lastAuditDate || null, freq);
  const freqInfo = FREQ_INFO[freq];

  const ncBump = scores.riskPreviousAudit === 3 && (freq !== (score <= 10 ? "annual" : score <= 15 ? "semi_annual" : "quarterly"));

  const handleSave = () => {
    onSave({
      ...(existing?.id ? { id: existing.id } : {}),
      processName, processType,
      ...scores,
      recommendedFrequency: freq,
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

        {/* Process type + live score */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border text-sm">
          <Badge className={`text-xs border ${TYPE_BADGE[processType]}`}>{processType}</Badge>
          <span className="text-muted-foreground">Process Type</span>
          <span className="ml-auto flex items-center gap-4">
            <span>
              <span className="font-bold text-lg text-foreground">{score}</span>
              <span className="text-muted-foreground text-xs">/21 pts</span>
            </span>
            <Badge className={`text-sm border px-3 py-1 ${freqInfo?.badgeColor || ""}`}>{freqInfo?.label || freq}</Badge>
          </span>
        </div>

        {ncBump && (
          <div className="flex items-center gap-2 text-xs p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            NC Override applied (§9.2.2.3): previous nonconformances increase audit frequency by one level.
          </div>
        )}

        {processType === "COP" && (
          <div className="flex items-center gap-2 text-xs p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-800">
            <Info className="w-3.5 h-3.5 shrink-0" />
            COP processes must be audited at least annually per IATF §9.2.2.3.
          </div>
        )}

        {/* Risk score bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>7 — Low Risk (Annual)</span>
            <span>14 — Med (Semi-Annual)</span>
            <span>21 — High (Quarterly)</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-200 relative">
            <div
              className={`h-2.5 rounded-full transition-all ${score <= 10 ? "bg-green-500" : score <= 15 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${((score - 7) / 14) * 100}%` }}
            />
          </div>
        </div>

        {/* 7 Risk criteria */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">IATF §9.2.2.2 Risk Criteria</p>
          {RISK_CRITERIA.map(criterion => (
            <div key={criterion.key} className="border rounded-lg p-3 bg-white">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{criterion.label}</p>
                  <p className="text-xs text-muted-foreground">{criterion.clause}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${scores[criterion.key] === 1 ? "text-green-700" : scores[criterion.key] === 2 ? "text-amber-700" : "text-red-700"}`}>
                  {scores[criterion.key]} pt{scores[criterion.key] > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {criterion.scores.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setScores(prev => ({ ...prev, [criterion.key]: s.value }))}
                    className={`px-2 py-2 rounded-lg text-xs border text-left transition-all ${scores[criterion.key] === s.value
                      ? s.value === 1 ? "bg-green-100 border-green-400 text-green-800 ring-1 ring-green-400"
                        : s.value === 2 ? "bg-amber-100 border-amber-400 text-amber-800 ring-1 ring-amber-400"
                        : "bg-red-100 border-red-400 text-red-800 ring-1 ring-red-400"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                    data-testid={`button-risk-${criterion.key}-${s.value}`}
                  >
                    <span className="font-semibold block">{s.value} — {s.label}</span>
                    <span className="text-xs opacity-80">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Scheduling fields */}
        <div className="grid grid-cols-2 gap-4 pt-2">
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

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isPending} data-testid="button-save-schedule">
            {isPending ? "Saving..." : existing ? "Update Schedule" : "Save Schedule"}
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Remove this schedule entry?")) onDelete(); }} data-testid="button-delete-schedule">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
