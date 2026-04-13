import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList, Plus, Trash2, Bot, ChevronRight, ArrowLeft,
  CheckCircle, Clock, AlertTriangle, AlertCircle, Circle, Loader2, Calendar, Users,
} from "lucide-react";
import type { IsoManagementReview, IsoReviewActionItem, IsoObjective, IsoKpiActual, InsertIsoManagementReview, InsertIsoReviewActionItem } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── Agenda Template Types ────────────────────────────────────────────────────
type AgendaTemplateItem = {
  clause: string;
  title: string;
  group: "input" | "output";
  section: string;
  frequency: string;
};

// ─── ISO 9001:2015 Agenda Template (from FM-9.3-1 PDF) ───────────────────────
const ISO_9001_AGENDA_ITEMS: AgendaTemplateItem[] = [
  // Previous Meeting Follow-up
  { clause: "9.3.2(a)", title: "Follow-up on open issues from previous meeting", group: "input", section: "Previous Management Review — 9.3.2(a)", frequency: "Quarterly" },

  // External/Internal Issues
  { clause: "9.3.2(b)", title: "Review of Interested Parties Matrix and Internal/External Issues List", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Annually" },

  // Customer Satisfaction
  { clause: "9.3.2(c-i)-scorecards", title: "Customer Scorecards", group: "input", section: "Customer Satisfaction — 9.3.2(c-i)", frequency: "Quarterly" },
  { clause: "9.3.2(c-i)-survey", title: "Customer Satisfaction Survey", group: "input", section: "Customer Satisfaction — 9.3.2(c-i)", frequency: "Annually" },
  { clause: "9.3.2(c-i)-visits", title: "Customer Feedback (Visits)", group: "input", section: "Customer Satisfaction — 9.3.2(c-i)", frequency: "Quarterly" },

  // KPI Dashboard by Department
  { clause: "9.3.2(c-iii)-sales", title: "Sales KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-purchasing", title: "Purchasing KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-warehousing", title: "Warehousing KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-logistics", title: "Logistics / On-Time Delivery KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-qa", title: "QA / Calibration KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-training", title: "Training Completion KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-audits", title: "Internal Audits KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-mgmt", title: "Management / Improvement (Customer Complaints) KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-car", title: "Corrective Action (Repeat NCs) KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-iii)-doc", title: "Document / Record Control KPI", group: "input", section: "KPI Dashboard by Department — 9.3.2(c-iii)", frequency: "Quarterly" },

  // Corrective & Preventive Actions
  { clause: "9.3.2(c-iv)", title: "Past due CARs / Completion Status", group: "input", section: "Corrective & Preventive Actions — 9.3.2(c-iv)", frequency: "Quarterly" },

  // Internal Audit Results
  { clause: "9.3.2(c-vi)-ia", title: "Internal Audit Review Results", group: "input", section: "Internal Audit Results — 9.3.2(c-vi)", frequency: "Bi-Annually" },

  // External Audit Results
  { clause: "9.3.2(c-vi)-ea1", title: "External Audit Schedule Review", group: "input", section: "External Audit Results — 9.3.2(c-vi)", frequency: "Annually" },
  { clause: "9.3.2(c-vi)-ea2", title: "Review of External Findings / Action", group: "input", section: "External Audit Results — 9.3.2(c-vi)", frequency: "Annually" },

  // Supplier Performance
  { clause: "9.3.2(c-vii)-1", title: "Supplier Performance — Scorecard Summary", group: "input", section: "Supplier Performance — 9.3.2(c-vii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vii)-2", title: "Supplier CAR's", group: "input", section: "Supplier Performance — 9.3.2(c-vii)", frequency: "Quarterly" },

  // New Business Update
  { clause: "nb-quotes", title: "Quotes — Potential New Customers", group: "input", section: "New Business Update", frequency: "Quarterly" },

  // Adequacy of Resources
  { clause: "9.3.2(d)-1", title: "Talent — Personnel", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },
  { clause: "9.3.2(d)-2", title: "Other (Equipment, Technology, Infrastructure)", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },

  // Risk & Opportunities
  { clause: "9.3.2(e)-1", title: "Internal / External Issues Review", group: "input", section: "Risk & Opportunities — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-2", title: "Contingency Plan Review", group: "input", section: "Risk & Opportunities — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-3", title: "Interested Parties Review", group: "input", section: "Risk & Opportunities — 9.3.2(e)", frequency: "Annually" },

  // Quality Policy Review
  { clause: "qpr-suitability", title: "Quality Policy Suitability", group: "input", section: "Quality Policy Review — §5.2", frequency: "Annually" },

  // Changes to KPIs/Objectives
  { clause: "kpi-changes", title: "KPI / Objectives Suitability & Target Review", group: "input", section: "Changes to KPIs / Objectives", frequency: "Annually" },

  // Opportunities for Improvement
  { clause: "9.3.2(f)", title: "Open Discussion & Opportunities for Improvement", group: "input", section: "Opportunities for Improvement — 9.3.2(f)", frequency: "Annually" },

  // Required Outputs
  { clause: "9.3.3(a)", title: "Decisions and actions: Opportunities for improvement", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(b)", title: "Decisions and actions: Any need for changes to the QMS", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(c)", title: "Decisions and actions: Resource needs", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
];

// ─── IATF 16949 Agenda Template (from IATF PDF — Monthly frequency + IATF-specific items) ──
const IATF_16949_AGENDA_ITEMS: AgendaTemplateItem[] = [
  // Previous Meeting Follow-up (Monthly for IATF)
  { clause: "9.3.2(a)", title: "Follow-up on open issues from previous meeting", group: "input", section: "Previous Management Review — 9.3.2(a)", frequency: "Monthly" },

  // External/Internal Issues (Quarterly for IATF)
  { clause: "9.3.2(b)", title: "Review of Interested Parties Matrix and Internal/External Issues List", group: "input", section: "External & Internal Issues — 9.3.2(b)", frequency: "Quarterly" },

  // Customer Satisfaction (Monthly for IATF)
  { clause: "9.3.2(c-i)-scorecards", title: "Customer Scorecards", group: "input", section: "Customer Satisfaction — 9.3.2(c-i)", frequency: "Monthly" },
  { clause: "9.3.2(c-i)-survey", title: "Customer Satisfaction Survey", group: "input", section: "Customer Satisfaction — 9.3.2(c-i)", frequency: "Annually" },
  { clause: "9.3.2(c-i)-visits", title: "Customer Feedback (Visits / Portal Review)", group: "input", section: "Customer Satisfaction — 9.3.2(c-i)", frequency: "Quarterly" },

  // KPI Dashboard — IATF includes Sales, Production, Quality, Materials, HR, Maintenance KPIs (Monthly)
  { clause: "9.3.2(c-iii)-quote-timing", title: "Quote Timing", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-quote-budget", title: "Quote to Budget", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-ppap", title: "On Time PPAP", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-apqp", title: "APQP on Budget", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-scrap", title: "Scrap Cost", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-copq", title: "COPQ (Cost of Poor Quality)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-supplier-scrap", title: "Supplier Scrap", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-supplier-cost", title: "Supplier Cost Reductions", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-otd", title: "On Time Delivery (OTD)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-premium-freight", title: "Premium Freight", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-pm-schedule", title: "On Time to PM Schedule", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-calibrations", title: "On Time Calibrations", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-turnover", title: "Employee Turnover", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-inventory", title: "Inventory Accuracy", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },
  { clause: "9.3.2(c-iii)-lost-time", title: "Lost Time (Safety)", group: "input", section: "KPI Dashboard — 9.3.2(c-iii) & 9.3.2.1", frequency: "Monthly" },

  // Corrective & Preventive Actions (Monthly for IATF)
  { clause: "9.3.2(c-iv)", title: "Past due CARs / Completion Status", group: "input", section: "Corrective & Preventive Actions — 9.3.2(c-iv)", frequency: "Monthly" },

  // Internal Audit Results (Quarterly for IATF)
  { clause: "9.3.2(c-vi)-ia", title: "Internal Audit Review Results", group: "input", section: "Internal Audit Results — 9.3.2(c-vi)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vi)-lpa-results", title: "LPA (Layered Process Audit) Results", group: "input", section: "Internal Audit Results — 9.3.2(c-vi)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vi)-lpa-metrics", title: "LPA Metrics (Level Completion, Findings Trend)", group: "input", section: "Internal Audit Results — 9.3.2(c-vi)", frequency: "Quarterly" },

  // External Audit Results (Annual)
  { clause: "9.3.2(c-vi)-ea1", title: "External Audit Schedule Review", group: "input", section: "External Audit Results — 9.3.2(c-vi)", frequency: "Annually" },
  { clause: "9.3.2(c-vi)-ea2", title: "Review of External Findings / Action", group: "input", section: "External Audit Results — 9.3.2(c-vi)", frequency: "Annually" },

  // Supplier Performance (Quarterly)
  { clause: "9.3.2(c-vii)-assess", title: "Supplier Assessment / Audit Results", group: "input", section: "Supplier Performance — 9.3.2(c-vii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vii)-1", title: "Supplier Performance — Scorecard Summary", group: "input", section: "Supplier Performance — 9.3.2(c-vii)", frequency: "Quarterly" },
  { clause: "9.3.2(c-vii)-2", title: "Supplier CAR's (Open / Chargebacks)", group: "input", section: "Supplier Performance — 9.3.2(c-vii)", frequency: "Quarterly" },

  // New Business Update (Quarterly)
  { clause: "nb-quotes", title: "Quotes — Potential New Customers", group: "input", section: "New Business Update", frequency: "Quarterly" },

  // Manufacturing Assessment (IATF-specific — Monthly)
  { clause: "iatf-fmea", title: "FMEA Review (PFMEA actions, updated ratings)", group: "input", section: "Manufacturing Assessment (Monitoring & Measurement) — IATF §9.3.2.1", frequency: "Monthly" },
  { clause: "iatf-feasibility", title: "Feasibility or Capacity Concern Review", group: "input", section: "Manufacturing Assessment (Monitoring & Measurement) — IATF §9.3.2.1", frequency: "Monthly" },

  // Adequacy of Resources (Monthly for IATF)
  { clause: "9.3.2(d)-1", title: "Talent — Personnel (Open Positions, Skills Gaps)", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },
  { clause: "9.3.2(d)-2", title: "Other (Equipment, Technology, Infrastructure Upgrades)", group: "input", section: "Adequacy of Resources — 9.3.2(d)", frequency: "Monthly" },

  // Risk & Opportunities (Annual)
  { clause: "9.3.2(e)-1", title: "Internal / External Issues Review", group: "input", section: "Risk & Opportunities — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-2", title: "Contingency Plan Review", group: "input", section: "Risk & Opportunities — 9.3.2(e)", frequency: "Annually" },
  { clause: "9.3.2(e)-3", title: "Interested Parties Review", group: "input", section: "Risk & Opportunities — 9.3.2(e)", frequency: "Annually" },

  // Quality Policy Review (Annual)
  { clause: "qpr-suitability", title: "Quality Policy Suitability", group: "input", section: "Quality Policy Review — §5.2", frequency: "Annually" },

  // Changes to KPIs/Objectives (Annual)
  { clause: "kpi-changes", title: "KPI / Objectives Suitability & Target Review", group: "input", section: "Changes to KPIs / Objectives", frequency: "Annually" },

  // Opportunities for Improvement (Annual)
  { clause: "9.3.2(f)", title: "Open Discussion & Opportunities for Improvement", group: "input", section: "Opportunities for Improvement — 9.3.2(f)", frequency: "Annually" },

  // Required Outputs
  { clause: "9.3.3(a)", title: "Decisions and actions: Opportunities for improvement", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(b)", title: "Decisions and actions: Any need for changes to the QMS", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
  { clause: "9.3.3(c)", title: "Decisions and actions: Resource needs", group: "output", section: "Required Outputs — 9.3.3", frequency: "" },
];

// Generic fallback (same as 9001 for all other standards)
function getAgendaTemplate(standard?: string | null): AgendaTemplateItem[] {
  const s = (standard ?? "").toUpperCase();
  if (s.includes("IATF")) return IATF_16949_AGENDA_ITEMS;
  return ISO_9001_AGENDA_ITEMS;
}

// ─── AgendaItem (saved state per review) ─────────────────────────────────────
type AgendaItem = { clause: string; title: string; covered: boolean; notes: string };

function agendaFromReview(review: IsoManagementReview, template: AgendaTemplateItem[]): AgendaItem[] {
  const existing = (review.agendaItems as AgendaItem[] | null) ?? [];
  return template.map(item => {
    const found = existing.find(e => e.clause === item.clause);
    return { clause: item.clause, title: item.title, covered: found?.covered ?? false, notes: found?.notes ?? "" };
  });
}

function offTrackStreakCount(actuals: IsoKpiActual[], targetVal: number): number {
  const sorted = [...actuals].sort((a, b) => b.period.localeCompare(a.period));
  let streak = 0;
  for (const a of sorted) {
    if (parseFloat(a.actual) < targetVal) streak++;
    else break;
  }
  return streak;
}

const ACTION_STATUS_CYCLE: Record<string, string> = { open: "in_progress", in_progress: "closed", closed: "open" };
const ACTION_STATUS_ICON = {
  open: <Circle className="w-4 h-4 text-muted-foreground" />,
  in_progress: <Loader2 className="w-4 h-4 text-yellow-500" />,
  closed: <CheckCircle className="w-4 h-4 text-green-500" />,
};
const ACTION_STATUS_COLORS: Record<string, string> = {
  open: "bg-muted/30 border-border",
  in_progress: "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200",
  closed: "bg-green-50 dark:bg-green-900/10 border-green-200",
};

const FREQ_BADGE_COLORS: Record<string, string> = {
  "Monthly":     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Quarterly":   "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Bi-Annually": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Annually":    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function FrequencyBadge({ frequency }: { frequency: string }) {
  if (!frequency) return null;
  const cls = FREQ_BADGE_COLORS[frequency] ?? "bg-muted text-muted-foreground";
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cls}`}>{frequency}</span>;
}

function KpiSparklineCard({ obj, actuals }: { obj: IsoObjective; actuals: IsoKpiActual[] }) {
  const sorted = [...actuals].sort((a, b) => a.period.localeCompare(b.period));
  const targetVal = parseFloat(obj.target ?? "0");
  const latest = sorted[sorted.length - 1];
  const latestVal = latest ? parseFloat(latest.actual) : null;
  const pct = latestVal !== null && targetVal > 0 ? Math.min((latestVal / targetVal) * 100, 150) : null;
  const streak = offTrackStreakCount(actuals, targetVal);
  const flagged = streak >= 2;
  const chartData = sorted.slice(-6).map(a => ({ period: a.period.slice(-4), actual: parseFloat(a.actual) }));
  const statusBorder = obj.status === "on_track" ? "border-green-400" : obj.status === "at_risk" ? "border-yellow-400" : "border-red-500";
  const statusBg = obj.status === "on_track" ? "bg-green-50 dark:bg-green-900/10" : obj.status === "at_risk" ? "bg-yellow-50 dark:bg-yellow-900/10" : "bg-red-50 dark:bg-red-900/10";
  const lineColor = obj.status === "on_track" ? "#22c55e" : obj.status === "at_risk" ? "#f59e0b" : "#ef4444";

  return (
    <Card className={`border-l-4 ${statusBorder} ${statusBg}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{obj.name}</span>
              {flagged && (
                <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-medium">
                  <AlertTriangle className="w-3 h-3" /> {streak} periods off-track
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {obj.processName && <span>{obj.processName} · </span>}
              {obj.responsible && <span>Owner: {obj.responsible}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            {latestVal !== null ? (
              <>
                <div className="text-xl font-bold text-foreground">{latestVal} <span className="text-xs font-normal text-muted-foreground">{obj.unit}</span></div>
                <div className="text-xs text-muted-foreground">Target: {obj.target} {obj.unit}</div>
                {pct !== null && (
                  <div className={`text-sm font-semibold ${pct >= 90 ? "text-green-600" : pct >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                    {pct.toFixed(0)}% of target
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-muted-foreground italic">No data logged</div>
            )}
          </div>
        </div>
        {chartData.length > 0 && (
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: 0 }}>
                <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={28} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <ReferenceLine y={targetVal} stroke="#f97316" strokeDasharray="3 2" />
                <Line type="monotone" dataKey="actual" stroke={lineColor} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewDetail({
  review, allReviews, onBack, isoProjectId, standard,
}: { review: IsoManagementReview; allReviews: IsoManagementReview[]; onBack: () => void; isoProjectId?: number; standard?: string | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const template = getAgendaTemplate(standard);
  const [agenda, setAgenda] = useState<AgendaItem[]>(agendaFromReview(review, template));
  const [actionForm, setActionForm] = useState({ description: "", owner: "", dueDate: "" });
  const [showActionForm, setShowActionForm] = useState(false);

  const { data: actions = [] } = useQuery<IsoReviewActionItem[]>({
    queryKey: ["/api/iso-management-reviews", review.id, "actions"],
    queryFn: () => fetch(`/api/iso-management-reviews/${review.id}/actions`).then(r => r.json()),
  });
  const { data: objectives = [] } = useQuery<IsoObjective[]>({
    queryKey: ["/api/iso-objectives", isoProjectId],
    queryFn: () => fetch(`/api/iso-objectives${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });
  const { data: allActuals = [] } = useQuery<IsoKpiActual[]>({
    queryKey: ["/api/iso-kpi-actuals", isoProjectId],
    queryFn: () => fetch(`/api/iso-kpi-actuals${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });

  const previousReview = [...allReviews]
    .filter(r => r.id !== review.id && new Date(r.meetingDate) < new Date(review.meetingDate))
    .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())[0];

  const { data: prevActions = [] } = useQuery<IsoReviewActionItem[]>({
    queryKey: ["/api/iso-management-reviews", previousReview?.id, "actions"],
    queryFn: () => previousReview
      ? fetch(`/api/iso-management-reviews/${previousReview.id}/actions`).then(r => r.json())
      : Promise.resolve([]),
    enabled: !!previousReview,
  });
  const openPrevActions = prevActions.filter(a => a.status === "open" || a.status === "in_progress");

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Omit<InsertIsoManagementReview, 'userId'>>) => apiRequest("PATCH", `/api/iso-management-reviews/${review.id}`, data).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", isoProjectId] }); toast({ title: "Review saved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addActionMutation = useMutation({
    mutationFn: (data: Omit<InsertIsoReviewActionItem, 'userId' | 'reviewId'>) => apiRequest("POST", `/api/iso-management-reviews/${review.id}/actions`, data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] });
      toast({ title: "Action item added" });
      setShowActionForm(false);
      setActionForm({ description: "", owner: "", dueDate: "" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<InsertIsoReviewActionItem, 'userId' | 'reviewId'>> }) => apiRequest("PATCH", `/api/iso-review-action-items/${id}`, data).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] }),
  });

  const deleteActionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-review-action-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] }),
  });

  const cycleActionStatus = (action: IsoReviewActionItem) => {
    const next = ACTION_STATUS_CYCLE[action.status] ?? "open";
    const patch: { status: string; closedAt?: string | null } = { status: next };
    if (next === "closed") patch.closedAt = new Date().toISOString();
    else patch.closedAt = null;
    updateActionMutation.mutate({ id: action.id, data: patch });
  };

  const saveAgenda = () => updateMutation.mutate({ agendaItems: agenda });
  const toggleCovered = (clause: string) => {
    setAgenda(a => a.map(item => item.clause === clause ? { ...item, covered: !item.covered } : item));
  };

  const coveredCount = agenda.filter(a => a.covered).length;
  const getActuals = (objId: number) => allActuals.filter(a => a.objectiveId === objId);

  const flaggedObjectives = objectives.filter(obj => {
    const acts = getActuals(obj.id);
    const tgt = parseFloat(obj.target ?? "0");
    return offTrackStreakCount(acts, tgt) >= 2;
  });

  const inputItems = template.filter(i => i.group === "input");
  const outputItems = template.filter(i => i.group === "output");

  // Group input items by section for display
  const inputSections = inputItems.reduce<Record<string, AgendaTemplateItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const standardLabel = standard?.includes("IATF") ? "IATF 16949" : "ISO 9001:2015";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground">{review.title}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(review.meetingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {review.attendees && ` · ${review.attendees}`}
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-accent text-accent">{standardLabel}</Badge>
        <Badge variant={review.status === "complete" ? "default" : "outline"}>
          {review.status === "complete" ? "Complete" : "Draft"}
        </Badge>
        <Button size="sm" onClick={() => updateMutation.mutate({ status: review.status === "complete" ? "draft" : "complete" })} variant="outline">
          {review.status === "complete" ? "Reopen" : "Mark Complete"}
        </Button>
      </div>

      {/* Carryover open/in-progress actions from previous review */}
      {openPrevActions.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Carryover: {openPrevActions.length} Open / In-Progress Action{openPrevActions.length > 1 ? "s" : ""} from Previous Review
            </CardTitle>
            {previousReview && (
              <p className="text-xs text-muted-foreground">From: {previousReview.title} · {new Date(previousReview.meetingDate).toLocaleDateString()}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {openPrevActions.map(a => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{a.description}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">{a.status.replace("_", " ")}</Badge>
                  {a.owner && <span className="text-muted-foreground ml-2">Owner: {a.owner}</span>}
                  {a.dueDate && <span className="text-muted-foreground ml-2">Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Flagged KPIs */}
      {flaggedObjectives.length > 0 && (
        <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {flaggedObjectives.length} KPI{flaggedObjectives.length > 1 ? "s" : ""} Off-Track for 2+ Consecutive Periods — §9.3.2(c)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {flaggedObjectives.map(obj => (
                <Badge key={obj.id} variant="outline" className="text-xs border-red-400 text-red-700 dark:text-red-400">
                  {obj.name} {obj.processName ? `(${obj.processName})` : ""}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Dashboard */}
      {objectives.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            KPI Performance Dashboard
            <span className="text-xs font-normal text-muted-foreground font-mono">§9.3.2(c)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {objectives.map(obj => (
              <KpiSparklineCard key={obj.id} obj={obj} actuals={getActuals(obj.id)} />
            ))}
          </div>
        </div>
      )}

      {/* KPI Snapshot Table */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">KPI Snapshot Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["KPI", "Process", "Target", "Latest", "Period", "Variance", "Status"].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {objectives.map(obj => {
                    const acts = getActuals(obj.id);
                    const sorted = [...acts].sort((a, b) => b.period.localeCompare(a.period));
                    const latest = sorted[0];
                    const latestVal = latest ? parseFloat(latest.actual) : null;
                    const targetVal = parseFloat(obj.target ?? "0");
                    const variance = latestVal !== null ? latestVal - targetVal : null;
                    const variancePct = variance !== null && targetVal !== 0 ? (variance / targetVal * 100) : null;
                    const streak = offTrackStreakCount(acts, targetVal);
                    return (
                      <tr key={obj.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">
                          {obj.name}
                          {streak >= 2 && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{obj.processName ?? "—"}</td>
                        <td className="px-3 py-2">{obj.target} {obj.unit}</td>
                        <td className="px-3 py-2 font-medium">{latestVal !== null ? `${latestVal} ${obj.unit}` : "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{latest?.period ?? "—"}</td>
                        <td className="px-3 py-2">
                          {variance !== null ? (
                            <span className={variance >= 0 ? "text-green-600" : "text-red-500"}>
                              {variance >= 0 ? "+" : ""}{variance.toFixed(1)}
                              {variancePct !== null && <span className="opacity-60 ml-1">({variancePct >= 0 ? "+" : ""}{variancePct.toFixed(0)}%)</span>}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            obj.status === "on_track" ? "bg-green-100 text-green-700" :
                            obj.status === "at_risk" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"}`}>
                            {obj.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ISO 9.3 Agenda Checklist — Grouped by section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {standardLabel} §9.3 Agenda Checklist
                <span className="ml-2 text-muted-foreground font-normal text-xs">{coveredCount}/{agenda.length} covered</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Check items as they are reviewed during the meeting. Add notes for each covered item.</p>
            </div>
            <Button size="sm" onClick={saveAgenda} disabled={updateMutation.isPending} variant="outline" data-testid="button-save-agenda">
              Save Agenda
            </Button>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${agenda.length > 0 ? (coveredCount / agenda.length) * 100 : 0}%` }} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Required Inputs — grouped by section */}
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">9.3.2 Required Inputs</div>
          {Object.entries(inputSections).map(([section, items]) => {
            const coveredInSection = items.filter(item => agenda.find(a => a.clause === item.clause)?.covered).length;
            const freq = items[0]?.frequency;
            return (
              <div key={section} className="rounded-lg border border-border overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">{section}</span>
                  <div className="flex items-center gap-2">
                    <FrequencyBadge frequency={freq} />
                    <span className="text-[10px] text-muted-foreground">{coveredInSection}/{items.length}</span>
                  </div>
                </div>
                {/* Section items */}
                <div className="divide-y divide-border/50">
                  {items.map(item => {
                    const agItem = agenda.find(a => a.clause === item.clause);
                    if (!agItem) return null;
                    const isFreqDifferent = item.frequency !== freq; // Sub-item has different frequency
                    return (
                      <div key={item.clause} className={`p-3 transition-colors ${agItem.covered ? "bg-green-50 dark:bg-green-900/20" : "bg-background"}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={agItem.covered}
                            onCheckedChange={() => toggleCovered(item.clause)}
                            data-testid={`checkbox-agenda-${item.clause}`}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-accent font-bold">{item.clause}</span>
                              <span className="text-sm text-foreground">{item.title}</span>
                              {agItem.covered && <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                              {isFreqDifferent && <FrequencyBadge frequency={item.frequency} />}
                              {item.clause === "9.3.2(a)" && openPrevActions.length > 0 && (
                                <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-600">
                                  {openPrevActions.length} open from prev.
                                </Badge>
                              )}
                              {(item.clause === "9.3.2(c-iii)-sales" || item.clause === "9.3.2(c-iii)-quote-timing") && flaggedObjectives.length > 0 && (
                                <Badge variant="outline" className="text-[10px] border-red-400 text-red-600">
                                  {flaggedObjectives.length} KPI flagged
                                </Badge>
                              )}
                            </div>
                            {agItem.covered && (
                              <Textarea
                                value={agItem.notes}
                                onChange={e => setAgenda(a => a.map(i => i.clause === item.clause ? { ...i, notes: e.target.value } : i))}
                                placeholder="Status, notes, reported by…"
                                data-testid={`textarea-agenda-notes-${item.clause}`}
                                className="mt-2 text-xs"
                                rows={2}
                              />
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

          {/* Required Outputs — 9.3.3 */}
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">9.3.3 Required Outputs</div>
          <div className="rounded-lg border border-border overflow-hidden divide-y divide-border/50">
            {outputItems.map(item => {
              const agItem = agenda.find(a => a.clause === item.clause);
              if (!agItem) return null;
              return (
                <div key={item.clause} className={`p-3 transition-colors ${agItem.covered ? "bg-green-50 dark:bg-green-900/20" : "bg-background"}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={agItem.covered}
                      onCheckedChange={() => toggleCovered(item.clause)}
                      data-testid={`checkbox-agenda-${item.clause}`}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-accent font-bold">{item.clause}</span>
                        <span className="text-sm text-foreground">{item.title}</span>
                        {agItem.covered && <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                      </div>
                      {agItem.covered && (
                        <Textarea
                          value={agItem.notes}
                          onChange={e => setAgenda(a => a.map(i => i.clause === item.clause ? { ...i, notes: e.target.value } : i))}
                          placeholder="Decisions made, actions assigned…"
                          data-testid={`textarea-agenda-notes-${item.clause}`}
                          className="mt-2 text-xs"
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overall Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">Meeting Notes / Conclusions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            defaultValue={review.overallNotes ?? ""}
            onBlur={e => updateMutation.mutate({ overallNotes: e.target.value })}
            placeholder="Overall conclusions, decisions made, improvement directions…"
            data-testid="textarea-review-notes"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              Action Register
              <span className="text-xs font-normal text-muted-foreground font-mono">§9.3.3</span>
              {actions.filter(a => a.status !== "closed").length > 0 && (
                <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                  {actions.filter(a => a.status !== "closed").length} open
                </Badge>
              )}
            </CardTitle>
            <Button size="sm" onClick={() => setShowActionForm(true)} data-testid="button-add-action" className="bg-accent hover:bg-accent/90 text-white">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Action
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Click the status icon to cycle: Open → In Progress → Closed</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.length === 0 && !showActionForm && (
            <p className="text-sm text-muted-foreground text-center py-4">No action items yet. Add outputs from this review.</p>
          )}
          {showActionForm && (
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Action Description *</Label>
                  <Input value={actionForm.description} onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to be done" data-testid="input-action-desc" />
                </div>
                <div>
                  <Label>Owner</Label>
                  <Input value={actionForm.owner} onChange={e => setActionForm(f => ({ ...f, owner: e.target.value }))} placeholder="Responsible person" data-testid="input-action-owner" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={actionForm.dueDate} onChange={e => setActionForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-action-due" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowActionForm(false)}>Cancel</Button>
                <Button size="sm" onClick={() => addActionMutation.mutate(actionForm)} disabled={addActionMutation.isPending} data-testid="button-submit-action" className="bg-accent hover:bg-accent/90 text-white">
                  Add
                </Button>
              </div>
            </div>
          )}
          {actions.map(action => (
            <div key={action.id} className={`flex items-start gap-3 p-3 rounded-lg border ${ACTION_STATUS_COLORS[action.status] ?? ACTION_STATUS_COLORS.open}`}>
              <button
                onClick={() => cycleActionStatus(action)}
                data-testid={`button-cycle-action-${action.id}`}
                title={`Status: ${action.status} — click to advance`}
                className="mt-0.5 shrink-0"
              >
                {ACTION_STATUS_ICON[action.status as keyof typeof ACTION_STATUS_ICON] ?? ACTION_STATUS_ICON.open}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${action.status === "closed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{action.description}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {action.owner && <span>Owner: <span className="font-medium">{action.owner}</span></span>}
                  {action.dueDate && <span>Due: <span className="font-medium">{new Date(action.dueDate).toLocaleDateString()}</span></span>}
                  <Badge variant="outline" className={`text-xs ${action.status === "in_progress" ? "border-yellow-400 text-yellow-600" : action.status === "closed" ? "border-green-400 text-green-600" : ""}`}>
                    {action.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <button onClick={() => deleteActionMutation.mutate(action.id)} className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 shrink-0" data-testid={`button-delete-action-${action.id}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const EMPTY_REVIEW_FORM = { title: "Management Review", meetingDate: "", attendees: "", status: "draft" };

export default function ManagementReviewModule({ isoProjectId, standard }: { isoProjectId?: number; standard?: string | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_REVIEW_FORM);
  const [selected, setSelected] = useState<IsoManagementReview | null>(null);
  const [isaOpen, setIsaOpen] = useState(false);
  const [isaInput, setIsaInput] = useState("");
  const [isaMessages, setIsaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isaLoading, setIsaLoading] = useState(false);

  const template = getAgendaTemplate(standard);
  const standardLabel = standard?.includes("IATF") ? "IATF 16949" : "ISO 9001:2015";
  const defaultFrequency = standard?.includes("IATF") ? "monthly" : "quarterly";

  const reviewsQKey = ["/api/iso-management-reviews", isoProjectId];
  const actionsQKey = ["/api/iso-review-action-items", isoProjectId];

  const { data: reviews = [], isLoading } = useQuery<IsoManagementReview[]>({
    queryKey: reviewsQKey,
    queryFn: () => fetch(`/api/iso-management-reviews${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });
  const { data: allActionItems = [] } = useQuery<IsoReviewActionItem[]>({
    queryKey: actionsQKey,
    queryFn: () => fetch(`/api/iso-review-action-items${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });
  const { data: objectives = [] } = useQuery<IsoObjective[]>({
    queryKey: ["/api/iso-objectives", isoProjectId],
    queryFn: () => fetch(`/api/iso-objectives${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<InsertIsoManagementReview, 'userId'>) => apiRequest("POST", "/api/iso-management-reviews", data).then(r => r.json()),
    onSuccess: (newReview: IsoManagementReview) => {
      qc.invalidateQueries({ queryKey: reviewsQKey });
      toast({ title: "Review created" });
      setShowForm(false);
      setForm(EMPTY_REVIEW_FORM);
      setSelected(newReview);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-management-reviews/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: reviewsQKey }); toast({ title: "Review deleted" }); },
  });

  if (selected) {
    const latest = reviews.find(r => r.id === selected.id) ?? selected;
    return <ReviewDetail review={latest} allReviews={reviews} onBack={() => setSelected(null)} isoProjectId={isoProjectId} standard={standard} />;
  }

  const sendIsaMessage = async () => {
    if (!isaInput.trim()) return;
    const userMsg = { role: "user" as const, content: isaInput.trim() };
    const newMsgs = [...isaMessages, userMsg];
    setIsaMessages(newMsgs);
    setIsaInput("");
    setIsaLoading(true);
    try {
      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          systemPrompt: `You are Isa, Lead ISO Auditor for ACSI ISO Manager. You specialize in ${standardLabel} Clause 9.3 Management Review. Help organizations conduct effective management reviews that meet ISO requirements, including required inputs (9.3.2) and expected outputs (9.3.3).${standard?.includes("IATF") ? " For IATF 16949, emphasize monthly frequency requirements, FMEA review, LPA audit results, COPQ, scrap cost, on-time PPAP, and manufacturing-specific KPIs (9.3.2.1)." : ""} Provide practical, clause-referenced guidance.`,
        }),
      });
      const data = await resp.json();
      setIsaMessages([...newMsgs, { role: "assistant", content: data.content || "Sorry, I'm unavailable right now." }]);
    } catch {
      setIsaMessages([...newMsgs, { role: "assistant", content: "Sorry, I'm unavailable right now." }]);
    } finally { setIsaLoading(false); }
  };

  const complete = reviews.filter(r => r.status === "complete").length;
  const draft = reviews.filter(r => r.status === "draft").length;
  const onTrackCount = objectives.filter(o => o.status === "on_track").length;
  const totalObjectives = objectives.length;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            Management Review
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {standardLabel} §9.3 — Top management reviews the QMS at planned intervals
            <span className="ml-2 text-accent font-medium capitalize">({defaultFrequency})</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsaOpen(true)} data-testid="button-isa-review" className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
            <Bot className="w-4 h-4 mr-1" /> Ask Isa
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} data-testid="button-new-review" className="bg-accent hover:bg-accent/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> New Review
          </Button>
        </div>
      </div>

      {/* Standard badge + agenda item count info */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-xs border-accent text-accent">{standardLabel}</Badge>
        <span className="text-xs text-muted-foreground">{template.length} agenda items · {template.filter(i => i.group === "input").length} required inputs · {template.filter(i => i.group === "output").length} required outputs</span>
        {standard?.includes("IATF") && (
          <Badge variant="outline" className="text-xs border-blue-400 text-blue-600">Monthly frequency required</Badge>
        )}
      </div>

      {/* Projector-ready KPI summary statement */}
      {totalObjectives > 0 && (
        <Card className={`border-l-4 ${onTrackCount === totalObjectives ? "border-green-400 bg-green-50 dark:bg-green-900/10" : onTrackCount >= totalObjectives * 0.7 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10" : "border-red-400 bg-red-50 dark:bg-red-900/10"}`}>
          <CardContent className="p-4">
            <p className="text-base font-bold text-foreground" data-testid="text-kpi-summary">
              {onTrackCount} of {totalObjectives} quality objective{totalObjectives !== 1 ? "s" : ""} on track as of {today}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {objectives.filter(o => o.status === "at_risk").length > 0 && `${objectives.filter(o => o.status === "at_risk").length} at risk · `}
              {objectives.filter(o => o.status === "off_track").length > 0 && `${objectives.filter(o => o.status === "off_track").length} off track · `}
              See KPI Measurement module for details (§9.1)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{reviews.length}</div><div className="text-xs text-muted-foreground mt-1">Total Reviews</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{complete}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complete</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-600">{draft}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Draft</div></CardContent></Card>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No management reviews recorded</p>
            <p className="text-xs mt-1">{standardLabel} Clause 9.3 requires top management to review the QMS at planned intervals ({defaultFrequency}). Start by creating your first review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...reviews].sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()).map(r => {
            const agendaItems = (r.agendaItems as AgendaItem[] | null) ?? [];
            const covered = agendaItems.filter(a => a.covered).length;
            const total = template.length;
            const reviewActions = allActionItems.filter(a => a.reviewId === r.id);
            const openCount = reviewActions.filter(a => a.status === "open").length;
            const inProgressCount = reviewActions.filter(a => a.status === "in_progress").length;
            const openTotal = openCount + inProgressCount;
            return (
              <Card key={r.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelected(r)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{r.title}</span>
                        <Badge variant={r.status === "complete" ? "default" : "outline"} className="text-xs">
                          {r.status === "complete" ? "Complete" : "Draft"}
                        </Badge>
                        {openTotal > 0 && (
                          <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                            {openTotal} action{openTotal > 1 ? "s" : ""} open
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.meetingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        {r.attendees && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {r.attendees.split(",").filter(Boolean).length} attendee{r.attendees.split(",").filter(Boolean).length !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span>Agenda: {covered}/{total} covered ({total > 0 ? Math.round((covered / total) * 100) : 0}%)</span>
                      </div>
                      {covered > 0 && (
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden w-32">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${(covered / total) * 100}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(r.id); }} className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Review Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Management Review</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">Template: <span className="font-medium text-accent">{standardLabel}</span> · {template.length} agenda items will be pre-loaded</p>
          <div className="space-y-4 py-2">
            <div>
              <Label>Review Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Q2 2025 Management Review" data-testid="input-review-title" />
            </div>
            <div>
              <Label>Meeting Date *</Label>
              <Input type="date" value={form.meetingDate} onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))} data-testid="input-review-date" />
            </div>
            <div>
              <Label>Attendees</Label>
              <Input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="e.g. Top Management, Quality Manager, Department Heads" data-testid="input-review-attendees" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ ...form, isoProjectId })} disabled={createMutation.isPending || !form.title.trim() || !form.meetingDate} data-testid="button-submit-review" className="bg-accent hover:bg-accent/90 text-white">
                Create Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Isa Panel */}
      <Dialog open={isaOpen} onOpenChange={setIsaOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <Bot className="w-5 h-5" /> Isa — Management Review Advisor ({standardLabel} §9.3)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isaMessages.length === 0 && (
              <div className="text-sm text-muted-foreground bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                <p className="font-medium text-violet-800 dark:text-violet-300 mb-2">Ask me about {standardLabel} §9.3 Management Review:</p>
                <ul className="space-y-1 text-xs">
                  <li>• What are the required inputs for a management review (9.3.2)?</li>
                  <li>• What outputs must be documented (9.3.3)?</li>
                  {standard?.includes("IATF") ? (
                    <>
                      <li>• What does IATF 16949 §9.3.2.1 require beyond ISO 9001?</li>
                      <li>• How should LPA results be presented in management review?</li>
                      <li>• What COPQ and scrap metrics are expected?</li>
                    </>
                  ) : (
                    <>
                      <li>• How often should management reviews be conducted?</li>
                      <li>• What do auditors look for during management review audits?</li>
                    </>
                  )}
                </ul>
              </div>
            )}
            {isaMessages.map((m, i) => (
              <div key={i} className={`text-sm rounded-lg p-3 ${m.role === "user" ? "bg-muted ml-8" : "bg-violet-50 dark:bg-violet-900/20 mr-8"}`}>
                <div className="font-medium text-xs mb-1 text-muted-foreground">{m.role === "user" ? "You" : "Isa"}</div>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {isaLoading && <div className="text-xs text-violet-600 animate-pulse">Isa is thinking…</div>}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input value={isaInput} onChange={e => setIsaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendIsaMessage()} placeholder={`Ask Isa about ${standardLabel} management review…`} data-testid="input-isa-review" className="flex-1" />
            <Button onClick={sendIsaMessage} disabled={isaLoading} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
