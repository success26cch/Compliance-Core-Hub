import { useState, useMemo } from "react";
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
  Plus, Trash2, ChevronDown, ChevronRight, ClipboardCheck, AlertTriangle,
  CheckCircle2, XCircle, Users, Activity, BarChart3, Edit3,
  Play, Eye, Layers, Shield, Clock, Search, ListChecks,
  CheckSquare, ArrowLeft, FileWarning, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, PieChart, Pie, Legend, LabelList,
} from "recharts";
import type { LpaAuditPlan, LpaRecord, LpaLayerConfig, LpaQuestion, LpaAuditItem } from "@shared/schema";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LAYER_DEFAULTS: LpaLayerConfig[] = [
  { layer: "L1", label: "Operator / Team Member",     frequency: "daily",     targetPerPeriod: 5, active: true },
  { layer: "L2", label: "Team Lead / Supervisor",     frequency: "weekly",    targetPerPeriod: 2, active: true },
  { layer: "L3", label: "Manager / Dept. Head",       frequency: "monthly",   targetPerPeriod: 2, active: true },
  { layer: "L4", label: "Plant Manager / Director",   frequency: "monthly",   targetPerPeriod: 1, active: true },
  { layer: "L5", label: "Executive / VP",             frequency: "quarterly", targetPerPeriod: 1, active: false },
];

const DEFAULT_QUESTIONS: LpaQuestion[] = [
  { id: "sw-1",  category: "Standard Work",           question: "Is the operator following the standardized work / job instructions?",                            isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sw-2",  category: "Standard Work",           question: "Are the work instructions posted, current (correct revision), and legible at the workstation?", isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sw-3",  category: "Standard Work",           question: "Is the operator performing job tasks in the correct sequence?",                                   isRequired: false, appliesTo: ["L1","L2"] },
  { id: "su-1",  category: "Setup / Authorization",   question: "Was setup signed off by authorized personnel before production began?",                           isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "su-2",  category: "Setup / Authorization",   question: "Is the first-off sample approval on file and available at the workstation?",                     isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "su-3",  category: "Setup / Authorization",   question: "Is the work order / production traveler present, correct, and current?",                         isRequired: false, appliesTo: ["L1","L2"] },
  { id: "cp-1",  category: "Control Plan",            question: "Are all control plan checks being performed at the correct frequency?",                           isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "cp-2",  category: "Control Plan",            question: "Is in-process inspection data being recorded accurately and completely?",                         isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "cp-3",  category: "Control Plan",            question: "Is the operator aware of the reaction plan for out-of-spec conditions?",                         isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "ep-1",  category: "Error Proofing",          question: "Is all error-proofing (poka-yoke) equipment functioning and verified at required frequency?",    isRequired: true,  appliesTo: ["L1","L2","L3","L4"] },
  { id: "ep-2",  category: "Error Proofing",          question: "Is the poka-yoke verification log current and complete?",                                         isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "gm-1",  category: "Gauges & Measurement",   question: "Are measuring devices calibrated (current calibration sticker / record)?",                       isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "gm-2",  category: "Gauges & Measurement",   question: "Are gauges clean, undamaged, and stored correctly when not in use?",                              isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "gm-3",  category: "Gauges & Measurement",   question: "Is the operator using the correct gauge for the characteristic being measured?",                  isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "sf-1",  category: "Safety / PPE",            question: "Is the operator wearing all required personal protective equipment (PPE)?",                       isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sf-2",  category: "Safety / PPE",            question: "Are required safety guards and machine interlocks in place and functional?",                      isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "sf-3",  category: "Safety / PPE",            question: "Is the emergency stop accessible and tested per procedure?",                                      isRequired: false, appliesTo: ["L2","L3","L4","L5"] },
  { id: "mc-1",  category: "Material Control",        question: "Is material correctly identified with work order / traveler / label?",                            isRequired: true,  appliesTo: ["L1","L2","L3"] },
  { id: "mc-2",  category: "Material Control",        question: "Is FIFO (First In First Out) being practiced for all materials?",                                isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "mc-3",  category: "Material Control",        question: "Is nonconforming material properly identified, tagged, and segregated?",                          isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "5s-1",  category: "5S / Housekeeping",       question: "Is the workstation clean and free of unnecessary items?",                                         isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "5s-2",  category: "5S / Housekeeping",       question: "Are tools and materials stored in their designated, clearly labeled locations?",                  isRequired: false, appliesTo: ["L1","L2","L3"] },
  { id: "5s-3",  category: "5S / Housekeeping",       question: "Is the workstation free of safety hazards (tripping, spills, pinch points)?",                   isRequired: true,  appliesTo: ["L1","L2","L3","L4","L5"] },
  { id: "tr-1",  category: "Training & Certification", question: "Is the operator trained and certified / qualified for this operation?",                          isRequired: true,  appliesTo: ["L2","L3","L4","L5"] },
  { id: "tr-2",  category: "Training & Certification", question: "Are training records current, complete, and accessible at the workstation?",                    isRequired: false, appliesTo: ["L2","L3","L4","L5"] },
];

const LAYER_COLORS: Record<string, string> = {
  L1: "bg-blue-50 text-blue-700 border-blue-200",
  L2: "bg-purple-50 text-purple-700 border-purple-200",
  L3: "bg-orange-50 text-orange-700 border-orange-200",
  L4: "bg-red-50 text-red-700 border-red-200",
  L5: "bg-gray-50 text-gray-700 border-gray-200",
};

const LAYER_HEX: Record<string, string> = {
  L1: "#3b82f6", L2: "#a855f7", L3: "#f97316", L4: "#ef4444", L5: "#6b7280",
};

const RESULT_COLORS = {
  pass:    "bg-green-50 text-green-700 border-green-200",
  fail:    "bg-red-50 text-red-700 border-red-200",
  partial: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function groupByCategory(items: LpaAuditItem[]) {
  return items.reduce((acc: Record<string, LpaAuditItem[]>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

function weekLabel(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────

export default function LayeredProcessAuditModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "plans" | "records">("dashboard");
  const [planDialog, setPlanDialog] = useState<{ open: boolean; plan?: LpaAuditPlan }>({ open: false });
  const [conductDialog, setConductDialog] = useState<{ open: boolean; plan?: LpaAuditPlan }>({ open: false });
  const [recordDialog, setRecordDialog] = useState<LpaRecord | null>(null);
  const [carDialog, setCarDialog] = useState<LpaRecord | null>(null);
  const [recordFilter, setRecordFilter] = useState({ layer: "all", planId: "all", search: "" });

  const { data: plans = [] } = useQuery<LpaAuditPlan[]>({ queryKey: ["/api/lpa-plans"] });
  const { data: records = [] } = useQuery<LpaRecord[]>({ queryKey: ["/api/lpa-records"] });

  const savePlan = useMutation({
    mutationFn: (data: any) => data.id
      ? apiRequest("PATCH", `/api/lpa-plans/${data.id}`, data)
      : apiRequest("POST", "/api/lpa-plans", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/lpa-plans"] }); setPlanDialog({ open: false }); toast({ title: "Audit plan saved." }); },
    onError: () => toast({ title: "Error saving plan.", variant: "destructive" }),
  });

  const deletePlan = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/lpa-plans/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/lpa-plans"] }); toast({ title: "Plan deleted." }); },
  });

  const saveRecord = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/lpa-records", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/lpa-records"] });
      setConductDialog({ open: false });
      setActiveTab("records");
      toast({ title: "Audit recorded.", description: "LPA completed — record saved to Records tab." });
    },
    onError: () => toast({ title: "Error saving audit.", variant: "destructive" }),
  });

  const deleteRecord = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/lpa-records/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/lpa-records"] }); setRecordDialog(null); toast({ title: "Record deleted." }); },
  });

  const saveCAR = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/corrective-actions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
      setCarDialog(null);
      toast({ title: "CAR initiated.", description: "Corrective Action logged in the Corrective Action system." });
    },
    onError: () => toast({ title: "Error creating CAR.", variant: "destructive" }),
  });

  const filteredRecords = useMemo(() => records.filter(r => {
    if (recordFilter.layer !== "all" && r.layer !== recordFilter.layer) return false;
    if (recordFilter.planId !== "all" && String(r.planId) !== recordFilter.planId) return false;
    if (recordFilter.search && !`${r.processName} ${r.auditorName} ${r.area}`.toLowerCase().includes(recordFilter.search.toLowerCase())) return false;
    return true;
  }), [records, recordFilter]);

  const totalNCs = records.reduce((s, r) => s + (r.nonconformingCount || 0), 0);
  const escalatedCount = records.filter(r => r.escalated).length;
  const passCount = records.filter(r => r.result === "pass").length;
  const overallConformance = records.length > 0 ? Math.round((passCount / records.length) * 100) : 0;

  const TABS = [
    { key: "dashboard", label: "Dashboard",   icon: BarChart3 },
    { key: "plans",     label: "Audit Plans", icon: Layers },
    { key: "records",   label: "Records",     icon: ClipboardCheck },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-card px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-tight">Layered Process Audits</h1>
          <p className="text-xs text-muted-foreground">GM BIQS · Stellantis · Ford Q1 · IATF 16949 9.2</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge variant="outline" className="text-xs gap-1 hidden sm:flex"><ClipboardCheck className="w-3 h-3" />{records.length} Records</Badge>
          <Badge variant="outline" className="text-xs gap-1 hidden sm:flex"><Layers className="w-3 h-3" />{plans.filter(p => p.status === "active").length} Active Plans</Badge>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="shrink-0 flex border-b px-4 sm:px-6 bg-card">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            data-testid={`tab-lpa-${t.key}`}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── DASHBOARD TAB ───────────────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <LpaDashboard records={records} plans={plans} onGoToRecords={() => setActiveTab("records")} />
        )}

        {/* ── PLANS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "plans" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-sm">Audit Plans</h2>
                <p className="text-xs text-muted-foreground">Configure which processes to audit, at which layers, and how often.</p>
              </div>
              <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white" onClick={() => setPlanDialog({ open: true })} data-testid="button-new-lpa-plan">
                <Plus className="w-3.5 h-3.5" />New Plan
              </Button>
            </div>

            {plans.length === 0 ? (
              <EmptyState icon={Layers} title="No audit plans yet" desc='Click "New Plan" to create your first layered process audit plan.' />
            ) : (
              <div className="grid gap-3">
                {plans.map(plan => {
                  const activeLayers = (plan.layers as LpaLayerConfig[]).filter(l => l.active);
                  const planRecords = records.filter(r => r.planId === plan.id);
                  const lastAudit = planRecords[0];
                  return (
                    <Card key={plan.id} className="p-4" data-testid={`card-lpa-plan-${plan.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <ClipboardCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{plan.processName}</span>
                            <Badge className={`text-[10px] border ${plan.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {plan.status}
                            </Badge>
                          </div>
                          {plan.area && <div className="text-xs text-muted-foreground mt-0.5">{plan.area}{plan.partFamily ? ` · ${plan.partFamily}` : ""}</div>}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {activeLayers.map(l => (
                              <Badge key={l.layer} className={`text-[10px] border ${LAYER_COLORS[l.layer] ?? "bg-muted text-foreground border-border"}`}>
                                {l.layer} · {l.frequency}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span><ListChecks className="w-3 h-3 inline mr-1" />{(plan.questions as LpaQuestion[]).length} questions</span>
                            <span><ClipboardCheck className="w-3 h-3 inline mr-1" />{planRecords.length} audits</span>
                            {lastAudit && <span><Clock className="w-3 h-3 inline mr-1" />Last: {lastAudit.auditDate}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-white text-xs h-7" onClick={() => setConductDialog({ open: true, plan })} data-testid={`button-conduct-lpa-${plan.id}`} disabled={plan.status !== "active"}>
                            <Play className="w-3 h-3" />Conduct
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setPlanDialog({ open: true, plan })} data-testid={`button-edit-lpa-${plan.id}`}>
                            <Edit3 className="w-3 h-3" />Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── RECORDS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "records" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm">Completed Audits</h2>
                <p className="text-xs text-muted-foreground">{records.length} total records — click any row to view details, escalate, or initiate a CAR</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-muted-foreground" />
                <Input className="pl-7 h-8 text-xs w-44" placeholder="Search…" value={recordFilter.search} onChange={e => setRecordFilter(f => ({ ...f, search: e.target.value }))} data-testid="input-lpa-search" />
              </div>
              <Select value={recordFilter.layer} onValueChange={v => setRecordFilter(f => ({ ...f, layer: v }))}>
                <SelectTrigger className="h-8 text-xs w-36" data-testid="select-lpa-filter-layer"><SelectValue placeholder="All Layers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Layers</SelectItem>
                  {["L1","L2","L3","L4","L5"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={recordFilter.planId} onValueChange={v => setRecordFilter(f => ({ ...f, planId: v }))}>
                <SelectTrigger className="h-8 text-xs w-48" data-testid="select-lpa-filter-plan"><SelectValue placeholder="All Plans" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.processName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredRecords.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No records found" desc="Conduct your first LPA from the Audit Plans tab, or adjust your filters." />
            ) : (
              <div className="grid gap-2">
                {filteredRecords.map(rec => (
                  <RecordRow key={rec.id} record={rec} onClick={() => setRecordDialog(rec)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {planDialog.open && (
        <PlanDialog
          existing={planDialog.plan}
          onSave={d => savePlan.mutate(d)}
          onDelete={planDialog.plan ? () => { if (confirm("Delete this audit plan?")) { deletePlan.mutate(planDialog.plan!.id); setPlanDialog({ open: false }); } } : undefined}
          onClose={() => setPlanDialog({ open: false })}
          isPending={savePlan.isPending}
        />
      )}
      {conductDialog.open && conductDialog.plan && (
        <ConductAuditDialog
          plan={conductDialog.plan}
          onSave={d => saveRecord.mutate(d)}
          onClose={() => setConductDialog({ open: false })}
          isPending={saveRecord.isPending}
        />
      )}
      {recordDialog && (
        <RecordDetailDialog
          record={recordDialog}
          onDelete={() => deleteRecord.mutate(recordDialog.id)}
          onInitiateCAR={() => { setCarDialog(recordDialog); setRecordDialog(null); }}
          onClose={() => setRecordDialog(null)}
        />
      )}
      {carDialog && (
        <InitiateCarDialog
          record={carDialog}
          onSave={d => saveCAR.mutate(d)}
          onClose={() => setCarDialog(null)}
          isPending={saveCAR.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LPA DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function LpaDashboard({ records, plans, onGoToRecords }: {
  records: LpaRecord[];
  plans: LpaAuditPlan[];
  onGoToRecords: () => void;
}) {
  const totalNCs = records.reduce((s, r) => s + (r.nonconformingCount || 0), 0);
  const totalYes = records.reduce((s, r) => s + (r.conformingCount || 0), 0);
  const totalAnswered = totalNCs + totalYes + records.reduce((s, r) => s + (r.naCount || 0), 0);
  const overallConformanceRate = totalAnswered > 0 ? Math.round((totalYes / totalAnswered) * 100) : 0;
  const passCount = records.filter(r => r.result === "pass").length;
  const partialCount = records.filter(r => r.result === "partial").length;
  const failCount = records.filter(r => r.result === "fail").length;
  const escalatedCount = records.filter(r => r.escalated).length;
  const activePlans = plans.filter(p => p.status === "active").length;

  // ── Conformance by Process ─────────────────────────────────────────────
  const processStat = useMemo(() => {
    const map: Record<string, { yes: number; no: number; na: number }> = {};
    records.forEach(r => {
      const key = r.processName ?? "Unknown";
      if (!map[key]) map[key] = { yes: 0, no: 0, na: 0 };
      map[key].yes += r.conformingCount ?? 0;
      map[key].no += r.nonconformingCount ?? 0;
      map[key].na += r.naCount ?? 0;
    });
    return Object.entries(map).map(([name, v]) => {
      const total = v.yes + v.no;
      return { name: name.length > 22 ? name.slice(0, 20) + "…" : name, conformance: total > 0 ? Math.round((v.yes / total) * 100) : 100, ncs: v.no };
    }).sort((a, b) => a.conformance - b.conformance);
  }, [records]);

  // ── NCs by Category ────────────────────────────────────────────────────
  const categoryStat = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => {
      (r.auditItems as LpaAuditItem[]).filter(i => i.result === "no").forEach(i => {
        map[i.category] = (map[i.category] || 0) + 1;
      });
    });
    return Object.entries(map).map(([name, count]) => ({ name: name.length > 22 ? name.slice(0, 20) + "…" : name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [records]);

  // ── Participation by Layer ─────────────────────────────────────────────
  const layerStat = useMemo(() => {
    return ["L1","L2","L3","L4","L5"].map(layer => ({
      layer,
      label: LAYER_DEFAULTS.find(l => l.layer === layer)?.label?.split(" /")[0] ?? layer,
      count: records.filter(r => r.layer === layer).length,
      pass: records.filter(r => r.layer === layer && r.result === "pass").length,
      fail: records.filter(r => r.layer === layer && r.result === "fail").length,
      partial: records.filter(r => r.layer === layer && r.result === "partial").length,
    }));
  }, [records]);

  // ── Weekly NC Trend (last 12 weeks) ───────────────────────────────────
  const trendData = useMemo(() => {
    const weeks: { label: string; start: Date; end: Date }[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = addDays(new Date(), -i * 7);
      const start = addDays(end, -6);
      weeks.push({ label: weekLabel(start), start, end });
    }
    return weeks.map(w => {
      const wRecs = records.filter(r => { const d = new Date(r.auditDate); return d >= w.start && d <= w.end; });
      const ncs = wRecs.reduce((s, r) => s + (r.nonconformingCount || 0), 0);
      const yes = wRecs.reduce((s, r) => s + (r.conformingCount || 0), 0);
      const total = ncs + yes;
      return { week: w.label, ncs, audits: wRecs.length, ncRate: total > 0 ? Math.round((ncs / total) * 100) : 0 };
    });
  }, [records]);

  // ── Top Failing Questions ──────────────────────────────────────────────
  const topFailingQuestions = useMemo(() => {
    const map: Record<string, { question: string; count: number; category: string }> = {};
    records.forEach(r => {
      (r.auditItems as LpaAuditItem[]).filter(i => i.result === "no").forEach(i => {
        if (!map[i.questionId]) map[i.questionId] = { question: i.question, count: 0, category: i.category };
        map[i.questionId].count++;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [records]);

  // ── Result Distribution for Pie ────────────────────────────────────────
  const resultPieData = [
    { name: "Pass", value: passCount, color: "#22c55e" },
    { name: "Partial", value: partialCount, color: "#eab308" },
    { name: "Fail", value: failCount, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const CHART_COLORS = ["#ea6c19","#3b82f6","#22c55e","#a855f7","#ef4444","#eab308","#06b6d4","#ec4899"];

  if (records.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState icon={BarChart3} title="No data yet" desc="Conduct LPAs from the Audit Plans tab to populate the dashboard." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-sm">LPA Performance Dashboard</h2>
        <p className="text-xs text-muted-foreground">All-time metrics · {records.length} audit records across {activePlans} active plans</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: "Total Audits",     value: records.length, color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Overall Conform.", value: `${overallConformanceRate}%`, color: overallConformanceRate >= 95 ? "text-green-600" : overallConformanceRate >= 80 ? "text-yellow-600" : "text-red-600", bg: "bg-muted/30" },
          { label: "Pass",             value: passCount,   color: "text-green-600",  bg: "bg-green-50" },
          { label: "Partial / Fail",   value: partialCount + failCount, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Total NCs",        value: totalNCs,    color: "text-red-600",    bg: "bg-red-50" },
          { label: "Escalated",        value: escalatedCount, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(k => (
          <Card key={k.label} className={`p-3 ${k.bg}`}>
            <div className={`text-xl font-bold leading-tight ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Row 2: Conformance by Process + Participation by Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conformance by Process */}
        <Card className="p-4">
          <div className="font-medium text-xs mb-3">Conformance Rate by Process</div>
          {processStat.length === 0 ? <div className="text-xs text-muted-foreground">No data</div> : (
            <ResponsiveContainer width="100%" height={Math.max(120, processStat.length * 36)}>
              <BarChart data={processStat} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="conformance" radius={[0, 3, 3, 0]}>
                  {processStat.map((entry, i) => (
                    <Cell key={i} fill={entry.conformance >= 95 ? "#22c55e" : entry.conformance >= 80 ? "#eab308" : "#ef4444"} />
                  ))}
                  <LabelList dataKey="conformance" position="right" formatter={(v: any) => `${v}%`} style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Participation by Layer */}
        <Card className="p-4">
          <div className="font-medium text-xs mb-3">Audit Participation by Layer</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={layerStat.filter(l => l.count > 0)} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="layer" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="pass" name="Pass" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
              <Bar dataKey="partial" name="Partial" stackId="a" fill="#eab308" />
              <Bar dataKey="fail" name="Fail" stackId="a" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3: 12-week trend + NCs by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NC Rate Trend */}
        <Card className="p-4">
          <div className="font-medium text-xs mb-3">Weekly NC Rate Trend (12 weeks)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: any) => `${v}%`} />
              <Line type="monotone" dataKey="ncRate" name="NC Rate %" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="audits" name="Audits Conducted" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* NCs by Issue Category */}
        <Card className="p-4">
          <div className="font-medium text-xs mb-3">Nonconformances by Issue Category</div>
          {categoryStat.length === 0 ? <div className="text-xs text-muted-foreground py-8 text-center">No NCs recorded</div> : (
            <ResponsiveContainer width="100%" height={Math.max(140, categoryStat.length * 30)}>
              <BarChart data={categoryStat} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" name="NC Count" radius={[0, 3, 3, 0]}>
                  {categoryStat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Row 4: Result Distribution Pie + Top Failing Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Result Distribution */}
        <Card className="p-4">
          <div className="font-medium text-xs mb-3">Audit Result Distribution</div>
          {resultPieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={resultPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                    {resultPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {resultPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                    <span className="font-bold">{d.value}</span>
                    <span className="text-muted-foreground">({Math.round((d.value / records.length) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-xs text-muted-foreground">No data</div>}
        </Card>

        {/* Top Failing Questions */}
        <Card className="p-4">
          <div className="font-medium text-xs mb-3">Top Recurring Nonconformances</div>
          {topFailingQuestions.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">No nonconformances recorded</div>
          ) : (
            <div className="space-y-2">
              {topFailingQuestions.map((q, i) => (
                <div key={q.question} className="flex items-start gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-red-50 text-red-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{q.question}</div>
                    <div className="text-[10px] text-muted-foreground">{q.category}</div>
                  </div>
                  <Badge className="bg-red-50 text-red-700 border-red-200 border text-[10px] shrink-0">{q.count}×</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Escalations needing CAR */}
      {records.filter(r => r.escalated).length > 0 && (
        <Card className="p-4">
          <div className="font-medium text-xs mb-3 flex items-center gap-1.5 text-orange-700">
            <AlertTriangle className="w-4 h-4" />Escalated Audits — CAR Decision Required
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            The following audits were escalated to a higher layer. The responsible person must decide whether to initiate a Corrective Action Request (CAR) and log it in the Corrective Action system.
          </p>
          <div className="space-y-2">
            {records.filter(r => r.escalated).map(rec => (
              <button key={rec.id} onClick={onGoToRecords}
                className="w-full text-left border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <Badge className={`text-[10px] border shrink-0 ${LAYER_COLORS[rec.layer] ?? ""}`}>{rec.layer}</Badge>
                  <span className="font-medium">{rec.processName}</span>
                  <span className="text-muted-foreground">{rec.auditDate}</span>
                  <Badge className="bg-red-50 text-red-700 border-red-200 border text-[10px]">{rec.nonconformingCount} NC{(rec.nonconformingCount ?? 0) > 1 ? "s" : ""}</Badge>
                  <span className="text-orange-700 font-medium">Escalated → {rec.escalatedTo}</span>
                  <span className="text-muted-foreground ml-auto">View record to initiate CAR →</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-8">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><Icon className="w-8 h-8 text-muted-foreground/40" /></div>
      <div className="font-medium text-sm mb-1">{title}</div>
      <div className="text-xs text-muted-foreground max-w-xs">{desc}</div>
    </div>
  );
}

function RecordRow({ record, onClick }: { record: LpaRecord; onClick: () => void }) {
  const resultBadge = RESULT_COLORS[record.result as keyof typeof RESULT_COLORS] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <button onClick={onClick} className="w-full text-left" data-testid={`row-lpa-record-${record.id}`}>
      <Card className="p-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={`text-[10px] border shrink-0 ${LAYER_COLORS[record.layer] ?? ""}`}>{record.layer} — {record.layerLabel}</Badge>
          <span className="font-medium text-xs flex-1 truncate">{record.processName}</span>
          <span className="text-xs text-muted-foreground shrink-0">{record.auditDate}</span>
          <Badge className={`text-[10px] border shrink-0 ${resultBadge}`}>{record.result}</Badge>
          {(record.nonconformingCount ?? 0) > 0 && <Badge className="bg-red-50 text-red-700 border-red-200 border text-[10px] shrink-0">{record.nonconformingCount} NC</Badge>}
          {record.escalated && <Badge className="bg-orange-50 text-orange-700 border-orange-200 border text-[10px] shrink-0">Escalated</Badge>}
          <div className="text-xs text-muted-foreground shrink-0">{record.auditorName}</div>
          <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function PlanDialog({ existing, onSave, onDelete, onClose, isPending }: {
  existing?: LpaAuditPlan;
  onSave: (data: any) => void;
  onDelete?: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const existingLayers = (existing?.layers as LpaLayerConfig[]) ?? [];
  const existingQuestions = (existing?.questions as LpaQuestion[]) ?? [];
  const [processName, setProcessName] = useState(existing?.processName ?? "");
  const [area, setArea] = useState(existing?.area ?? "");
  const [partFamily, setPartFamily] = useState(existing?.partFamily ?? "");
  const [status, setStatus] = useState(existing?.status ?? "active");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [layers, setLayers] = useState<LpaLayerConfig[]>(existingLayers.length > 0 ? existingLayers : LAYER_DEFAULTS.map(l => ({ ...l })));
  const [questions, setQuestions] = useState<LpaQuestion[]>(existingQuestions.length > 0 ? existingQuestions : DEFAULT_QUESTIONS.map(q => ({ ...q })));
  const [questionTab, setQuestionTab] = useState<"layers" | "questions">("layers");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => setExpandedCats(prev => { const s = new Set(prev); s.has(cat) ? s.delete(cat) : s.add(cat); return s; });
  const questionsByCategory = questions.reduce((acc: Record<string, LpaQuestion[]>, q) => { if (!acc[q.category]) acc[q.category] = []; acc[q.category].push(q); return acc; }, {});
  const toggleLayer = (idx: number) => setLayers(l => l.map((x, i) => i === idx ? { ...x, active: !x.active } : x));
  const setLayerFreq = (idx: number, freq: string) => setLayers(l => l.map((x, i) => i === idx ? { ...x, frequency: freq } : x));
  const setLayerTarget = (idx: number, val: string) => setLayers(l => l.map((x, i) => i === idx ? { ...x, targetPerPeriod: parseInt(val) || 1 } : x));
  const toggleQuestionLayer = (qIdx: number, layer: string) => setQuestions(qs => qs.map((q, i) => {
    if (i !== qIdx) return q;
    const has = q.appliesTo.includes(layer);
    return { ...q, appliesTo: has ? q.appliesTo.filter(l => l !== layer) : [...q.appliesTo, layer] };
  }));

  const handleSave = () => {
    if (!processName.trim()) return;
    onSave(existing ? { id: existing.id, processName, area, partFamily, status, notes, layers, questions } : { processName, area, partFamily, status, notes, layers, questions });
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />{existing ? "Edit" : "New"} Audit Plan</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto space-y-4 px-1 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Process Name *</Label>
              <Input placeholder="e.g. Chemical Blending, Stamping Line 3" value={processName} onChange={e => setProcessName(e.target.value)} data-testid="input-lpa-process-name" />
            </div>
            <div className="space-y-1"><Label className="text-xs">Work Area / Cell</Label><Input placeholder="e.g. Blending Bay 1" value={area} onChange={e => setArea(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Part Family</Label><Input placeholder="e.g. CCI-2240 Series" value={partFamily} onChange={e => setPartFamily(e.target.value)} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-lpa-plan-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Input placeholder="Scope notes" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>

          <div className="border-b flex gap-0">
            {([["layers","Layer Configuration"],["questions","Question Library"]] as const).map(([k,lbl]) => (
              <button key={k} onClick={() => setQuestionTab(k)} className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${questionTab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{lbl}</button>
            ))}
          </div>

          {questionTab === "layers" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Enable layers and set audit frequency targets.</p>
              {layers.map((l, idx) => (
                <div key={l.layer} className={`border rounded-lg p-3 transition-colors ${l.active ? "bg-card" : "bg-muted/30 opacity-60"}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleLayer(idx)} className="shrink-0">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${l.active ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                        {l.active && <CheckSquare className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                    <Badge className={`text-[10px] border shrink-0 ${LAYER_COLORS[l.layer] ?? ""}`}>{l.layer}</Badge>
                    <span className="text-xs font-medium flex-1">{l.label}</span>
                    {l.active && (
                      <div className="flex items-center gap-2">
                        <Select value={l.frequency} onValueChange={v => setLayerFreq(idx, v)}>
                          <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="per_shift">Per Shift</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" min={1} max={99} value={l.targetPerPeriod} onChange={e => setLayerTarget(idx, e.target.value)} className="h-7 w-16 text-xs" />
                        <span className="text-[10px] text-muted-foreground shrink-0">per period</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {questionTab === "questions" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{questions.length} questions · click a category to configure which layers each question applies to.</p>
              {Object.entries(questionsByCategory).map(([cat, qs]) => (
                <div key={cat} className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 text-xs font-medium transition-colors">
                    <span>{cat} <span className="text-muted-foreground font-normal">({qs.length})</span></span>
                    {expandedCats.has(cat) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCats.has(cat) && (
                    <div className="divide-y">
                      {qs.map(q => {
                        const qIdx = questions.findIndex(x => x.id === q.id);
                        return (
                          <div key={q.id} className="px-3 py-2 space-y-1.5">
                            <div className="text-xs">{q.question}</div>
                            <div className="flex flex-wrap gap-1">
                              {["L1","L2","L3","L4","L5"].map(layer => (
                                <button key={layer} onClick={() => toggleQuestionLayer(qIdx, layer)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${q.appliesTo.includes(layer) ? `border font-medium ${LAYER_COLORS[layer]}` : "border-muted text-muted-foreground"}`}>
                                  {layer}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isPending || !processName.trim()} data-testid="button-save-lpa-plan">
            {isPending ? "Saving…" : existing ? "Update Plan" : "Create Plan"}
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onDelete} data-testid="button-delete-lpa-plan">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONDUCT AUDIT DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function ConductAuditDialog({ plan, onSave, onClose, isPending }: {
  plan: LpaAuditPlan;
  onSave: (data: any) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const activeLayers = (plan.layers as LpaLayerConfig[]).filter(l => l.active);
  const allQuestions = plan.questions as LpaQuestion[];
  const [step, setStep] = useState<"header" | "questions" | "review">("header");
  const [selectedLayer, setSelectedLayer] = useState(activeLayers[0]?.layer ?? "L1");
  const [layerLabel, setLayerLabel] = useState(activeLayers[0]?.label ?? "");
  const [auditorName, setAuditorName] = useState("");
  const [auditDate, setAuditDate] = useState(today());
  const [shift, setShift] = useState("Day");
  const [overallNotes, setOverallNotes] = useState("");
  const [immediateActions, setImmediateActions] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [escalatedTo, setEscalatedTo] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["Standard Work"]));

  const layerQuestions = allQuestions.filter(q => q.appliesTo.includes(selectedLayer));
  const [answers, setAnswers] = useState<Record<string, { result: "yes" | "no" | "na"; note: string }>>(() =>
    Object.fromEntries(layerQuestions.map(q => [q.id, { result: "yes", note: "" }]))
  );

  const handleLayerChange = (layer: string) => {
    setSelectedLayer(layer);
    const cfg = activeLayers.find(l => l.layer === layer);
    setLayerLabel(cfg?.label ?? "");
    const newQs = allQuestions.filter(q => q.appliesTo.includes(layer));
    setAnswers(Object.fromEntries(newQs.map(q => [q.id, answers[q.id] ?? { result: "yes", note: "" }])));
  };

  const setAnswer = (qId: string, result: "yes" | "no" | "na") => setAnswers(a => ({ ...a, [qId]: { ...a[qId], result } }));
  const setNote = (qId: string, note: string) => setAnswers(a => ({ ...a, [qId]: { ...a[qId], note } }));
  const toggleCat = (cat: string) => setExpandedCats(prev => { const s = new Set(prev); s.has(cat) ? s.delete(cat) : s.add(cat); return s; });

  const auditItems: LpaAuditItem[] = layerQuestions.map(q => ({
    questionId: q.id, question: q.question, category: q.category, layer: selectedLayer,
    result: answers[q.id]?.result ?? "yes", note: answers[q.id]?.note ?? "",
  }));

  const conformingCount = auditItems.filter(i => i.result === "yes").length;
  const nonconformingCount = auditItems.filter(i => i.result === "no").length;
  const naCount = auditItems.filter(i => i.result === "na").length;
  const result = nonconformingCount === 0 ? "pass" : nonconformingCount <= 2 ? "partial" : "fail";
  const groupedItems = groupByCategory(auditItems);

  const handleSubmit = () => {
    onSave({ planId: plan.id, processName: plan.processName, area: plan.area, auditDate, layer: selectedLayer, layerLabel, auditorName, shift, auditItems, conformingCount, nonconformingCount, naCount, result, overallNotes, immediateActions, escalated, escalatedTo: escalated ? escalatedTo : "" });
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Play className="w-5 h-5 text-primary" />Conduct LPA — {plan.processName}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-0 text-xs border-b pb-2">
          {(["header","questions","review"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className={`px-3 py-1 rounded font-medium transition-colors ${step === s ? "bg-primary text-white" : "text-muted-foreground"}`}>
                {i + 1}. {s === "header" ? "Audit Info" : s === "questions" ? `Questions (${layerQuestions.length})` : "Review & Submit"}
              </div>
              {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-3 px-1">
          {step === "header" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Audit Layer *</Label>
                <div className="flex flex-wrap gap-2">
                  {activeLayers.map(l => (
                    <button key={l.layer} onClick={() => handleLayerChange(l.layer)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selectedLayer === l.layer ? `${LAYER_COLORS[l.layer]} border` : "border-muted bg-transparent text-muted-foreground hover:bg-muted/30"}`}>
                      {l.layer} — {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label className="text-xs">Auditor Name *</Label><Input placeholder="Your name and title" value={auditorName} onChange={e => setAuditorName(e.target.value)} data-testid="input-lpa-auditor-name" /></div>
                <div className="space-y-1"><Label className="text-xs">Audit Date *</Label><Input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} /></div>
                <div className="space-y-1">
                  <Label className="text-xs">Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day">Day</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                      <SelectItem value="Rotating">Rotating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
                <div className="font-medium">Process: {plan.processName}</div>
                {plan.area && <div className="text-muted-foreground">Area: {plan.area}</div>}
                <div className="text-muted-foreground">Questions for {selectedLayer}: {layerQuestions.length}</div>
              </div>
            </div>
          )}

          {step === "questions" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{layerQuestions.length} questions · {plan.processName} · {selectedLayer}</span>
                <span><span className="text-green-600 font-medium">{conformingCount} ✓</span> · <span className="text-red-600 font-medium">{nonconformingCount} ✗</span></span>
              </div>
              {Object.entries(groupedItems).map(([cat, items]) => (
                <div key={cat} className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 text-xs font-medium transition-colors">
                    <span>{cat} <span className="text-muted-foreground">({items.length})</span></span>
                    <div className="flex items-center gap-2">
                      {items.filter(i => i.result === "no").length > 0 && <Badge className="bg-red-50 text-red-700 border-red-200 border text-[10px]">{items.filter(i => i.result === "no").length} NC</Badge>}
                      {expandedCats.has(cat) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                  {expandedCats.has(cat) && (
                    <div className="divide-y">
                      {items.map(item => (
                        <div key={item.questionId} className={`px-3 py-2.5 space-y-2 ${item.result === "no" ? "bg-red-50/30" : ""}`}>
                          <div className="text-xs leading-relaxed">{item.question}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {([["yes","Yes","text-green-600 border-green-300 bg-green-50"],["no","No","text-red-600 border-red-300 bg-red-50"],["na","N/A","text-gray-500 border-gray-200 bg-gray-50"]] as const).map(([v,lbl,cls]) => (
                              <button key={v} onClick={() => setAnswer(item.questionId, v)}
                                className={`px-2.5 py-1 rounded border text-[10px] font-medium transition-colors ${answers[item.questionId]?.result === v ? cls : "border-muted text-muted-foreground hover:bg-muted/30"}`}>
                                {lbl}
                              </button>
                            ))}
                            {answers[item.questionId]?.result === "no" && (
                              <Input className="h-6 text-xs flex-1 min-w-32" placeholder="Describe finding…" value={answers[item.questionId]?.note ?? ""} onChange={e => setNote(item.questionId, e.target.value)} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="p-3"><div className="text-2xl font-bold text-green-600">{conformingCount}</div><div className="text-[10px] text-muted-foreground">Conforming (Yes)</div></Card>
                <Card className="p-3"><div className="text-2xl font-bold text-red-600">{nonconformingCount}</div><div className="text-[10px] text-muted-foreground">Nonconforming (No)</div></Card>
                <Card className="p-3"><div className={`text-2xl font-bold ${result === "pass" ? "text-green-600" : result === "fail" ? "text-red-600" : "text-yellow-600"}`}>{result.toUpperCase()}</div><div className="text-[10px] text-muted-foreground">Overall Result</div></Card>
              </div>
              {nonconformingCount > 0 && (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50/30 space-y-1">
                  <div className="text-xs font-medium text-red-700 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Nonconformances ({nonconformingCount})</div>
                  {auditItems.filter(i => i.result === "no").map(i => <div key={i.questionId} className="text-xs text-red-700">• {i.question}{i.note ? ` — ${i.note}` : ""}</div>)}
                </div>
              )}
              <div className="space-y-1"><Label className="text-xs">Overall Notes</Label><Textarea placeholder="Observations, commendations…" rows={2} value={overallNotes} onChange={e => setOverallNotes(e.target.value)} /></div>
              {nonconformingCount > 0 && (
                <div className="space-y-1"><Label className="text-xs">Immediate Actions Taken</Label><Textarea placeholder="What was done immediately?" rows={2} value={immediateActions} onChange={e => setImmediateActions(e.target.value)} /></div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => setEscalated(e => !e)} className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${escalated ? "border-orange-500 bg-orange-500" : "border-muted-foreground"}`}>
                    {escalated && <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  <span>Escalate to higher layer</span>
                </button>
                {escalated && <Input className="h-7 text-xs flex-1" placeholder="Escalated to (name / role)" value={escalatedTo} onChange={e => setEscalatedTo(e.target.value)} />}
              </div>
              {escalated && (
                <div className="border border-orange-200 bg-orange-50/40 rounded-lg p-3 text-xs text-orange-800">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  <strong>Escalation Protocol:</strong> After saving this record, the person it was escalated to must review the findings and decide whether to initiate a Corrective Action Request (CAR). Open the record in the Records tab and use the "Initiate CAR" button.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          {step !== "header" && <Button variant="outline" onClick={() => setStep(step === "review" ? "questions" : "header")} className="gap-1"><ArrowLeft className="w-3.5 h-3.5" />Back</Button>}
          {step === "header" && <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => setStep("questions")} disabled={!auditorName.trim()}>Next: Questions →</Button>}
          {step === "questions" && <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => setStep("review")}>Review & Submit →</Button>}
          {step === "review" && <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit} disabled={isPending}>{isPending ? "Saving…" : "Submit Audit"}</Button>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD DETAIL DIALOG (with CAR initiation)
// ─────────────────────────────────────────────────────────────────────────────

function RecordDetailDialog({ record, onDelete, onInitiateCAR, onClose }: {
  record: LpaRecord;
  onDelete: () => void;
  onInitiateCAR: () => void;
  onClose: () => void;
}) {
  const items = record.auditItems as LpaAuditItem[];
  const grouped = groupByCategory(items);
  const result = record.result ?? "pass";
  const resultBadge = RESULT_COLORS[result as keyof typeof RESULT_COLORS] ?? "";
  const hasNCs = (record.nonconformingCount ?? 0) > 0;

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Eye className="w-5 h-5 text-primary" />
            LPA Record — {record.processName}
            <Badge className={`text-[10px] border ${LAYER_COLORS[record.layer] ?? ""}`}>{record.layer} — {record.layerLabel}</Badge>
            <Badge className={`text-[10px] border ${resultBadge}`}>{result.toUpperCase()}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto space-y-3 px-1">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted/30 rounded-lg p-2"><div className="text-muted-foreground">Date</div><div className="font-medium">{record.auditDate}</div></div>
            <div className="bg-muted/30 rounded-lg p-2"><div className="text-muted-foreground">Auditor</div><div className="font-medium">{record.auditorName}</div></div>
            <div className="bg-muted/30 rounded-lg p-2"><div className="text-muted-foreground">Shift</div><div className="font-medium">{record.shift ?? "—"}</div></div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Card className="p-2"><div className="text-xl font-bold text-green-600">{record.conformingCount}</div><div className="text-[10px] text-muted-foreground">Yes / Conforming</div></Card>
            <Card className="p-2"><div className="text-xl font-bold text-red-600">{record.nonconformingCount}</div><div className="text-[10px] text-muted-foreground">No / NC</div></Card>
            <Card className="p-2"><div className="text-xl font-bold text-gray-500">{record.naCount}</div><div className="text-[10px] text-muted-foreground">N/A</div></Card>
          </div>

          {hasNCs && (
            <div className="border border-red-200 bg-red-50/30 rounded-lg p-3 space-y-2">
              <div className="text-xs font-medium text-red-700 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Nonconformances Found</div>
              {items.filter(i => i.result === "no").map(i => <div key={i.questionId} className="text-xs text-red-700">• {i.question}{i.note ? ` — ${i.note}` : ""}</div>)}
            </div>
          )}

          {/* Escalation — CAR Protocol Banner */}
          {record.escalated && (
            <div className="border border-orange-300 bg-orange-50 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />Escalation Protocol — CAR Decision Required
              </div>
              <div className="text-xs text-orange-800">
                This audit was escalated to <strong>{record.escalatedTo || "a higher layer"}</strong>. The responsible person must review the nonconformances above and determine whether a Corrective Action Request (CAR) should be initiated. If a CAR is warranted, click <strong>"Initiate CAR"</strong> below — it will be logged in the Corrective Action system and tracked to closure.
              </div>
              <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white mt-1 w-full sm:w-auto" onClick={onInitiateCAR} data-testid="button-initiate-car-escalated">
                <FileWarning className="w-3.5 h-3.5" />Initiate CAR from This Escalation
              </Button>
            </div>
          )}

          {hasNCs && !record.escalated && (
            <div className="border border-yellow-200 bg-yellow-50/50 rounded-lg p-3">
              <div className="text-xs text-yellow-800">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                Nonconformances were found in this audit. If a formal Corrective Action is required, use the button below to log a CAR.
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 mt-2 text-xs border-yellow-300 text-yellow-800 hover:bg-yellow-100" onClick={onInitiateCAR} data-testid="button-initiate-car-nc">
                <FileWarning className="w-3.5 h-3.5" />Initiate CAR for These NCs
              </Button>
            </div>
          )}

          {/* Question Detail */}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/30 text-xs font-medium flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-muted-foreground">{catItems.filter(i => i.result === "yes").length}/{catItems.length} conforming</span>
              </div>
              <div className="divide-y">
                {catItems.map(item => (
                  <div key={item.questionId} className={`px-3 py-2 flex items-start gap-3 ${item.result === "no" ? "bg-red-50/20" : ""}`}>
                    <div className="shrink-0 mt-0.5">
                      {item.result === "yes" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : item.result === "no" ? <XCircle className="w-4 h-4 text-red-500" /> : <Shield className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs">{item.question}</div>
                      {item.note && <div className="text-[10px] text-muted-foreground mt-0.5 italic">{item.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {record.overallNotes && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium">Notes</div>
              <div className="text-xs text-muted-foreground">{record.overallNotes}</div>
            </div>
          )}
          {record.immediateActions && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium text-blue-700">Immediate Actions Taken</div>
              <div className="text-xs text-blue-700">{record.immediateActions}</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" className="gap-1.5" onClick={onClose} data-testid="button-back-to-records">
            <ArrowLeft className="w-3.5 h-3.5" />Back to Records
          </Button>
          <div className="flex-1" />
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => { if (confirm("Delete this LPA record?")) onDelete(); }} data-testid="button-delete-lpa-record">
            <Trash2 className="w-4 h-4" />Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIATE CAR DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function InitiateCarDialog({ record, onSave, onClose, isPending }: {
  record: LpaRecord;
  onSave: (data: any) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const ncList = (record.auditItems as LpaAuditItem[]).filter(i => i.result === "no");
  const defaultTitle = `LPA NC — ${record.processName} (${record.layer} · ${record.auditDate})`;
  const defaultProblem = `Layered Process Audit nonconformance(s) identified during ${record.layer} (${record.layerLabel}) audit of ${record.processName} on ${record.auditDate} by ${record.auditorName}.\n\nNonconformances found:\n${ncList.map(n => `• ${n.question}${n.note ? ` — ${n.note}` : ""}`).join("\n")}${record.escalatedTo ? `\n\nEscalated to: ${record.escalatedTo}` : ""}`;

  const [title, setTitle] = useState(defaultTitle);
  const [problemStatement, setProblemStatement] = useState(defaultProblem);
  const [responsiblePerson, setResponsiblePerson] = useState(record.escalatedTo ?? "");
  const [responsibleDept, setResponsibleDept] = useState("");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">(record.escalated ? "high" : "medium");
  const [targetDate, setTargetDate] = useState("");
  const [immediateActions, setImmediateActions] = useState(record.immediateActions ?? "");

  const handleSave = () => {
    onSave({
      title,
      problemStatement,
      immediateActions,
      responsiblePerson,
      responsibleDepartment: responsibleDept,
      priority,
      targetDate: targetDate || undefined,
      status: "open",
    });
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-orange-600" />Initiate Corrective Action Request (CAR)
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto space-y-3 px-1 py-1">
          <div className="border border-orange-200 bg-orange-50/40 rounded-lg p-3 text-xs text-orange-800">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            This CAR will be logged in your Corrective Action system and tracked through root cause analysis, corrective actions, and effectiveness verification.
          </div>

          {/* NC Summary */}
          <div className="bg-red-50/30 border border-red-100 rounded-lg p-3 space-y-1">
            <div className="text-xs font-medium text-red-700">LPA Source ({ncList.length} NC{ncList.length !== 1 ? "s" : ""})</div>
            {ncList.map(n => <div key={n.questionId} className="text-xs text-red-700">• {n.question}{n.note ? ` — ${n.note}` : ""}</div>)}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">CAR Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} data-testid="input-car-title" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Problem Statement *</Label>
            <Textarea rows={4} value={problemStatement} onChange={e => setProblemStatement(e.target.value)} data-testid="textarea-car-problem" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Immediate Actions Already Taken</Label>
            <Textarea rows={2} placeholder="Any containment or immediate corrections applied during or after the audit…" value={immediateActions} onChange={e => setImmediateActions(e.target.value)} data-testid="textarea-car-immediate" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Responsible Person</Label>
              <Input placeholder="Name assigned to resolve" value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} data-testid="input-car-responsible" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Input placeholder="e.g. Quality, Production" value={responsibleDept} onChange={e => setResponsibleDept(e.target.value)} data-testid="input-car-dept" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={v => setPriority(v as any)}>
                <SelectTrigger data-testid="select-car-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target Completion Date</Label>
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} data-testid="input-car-target-date" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-1.5" onClick={handleSave} disabled={isPending || !title.trim() || !problemStatement.trim()} data-testid="button-submit-car">
            <FileWarning className="w-4 h-4" />{isPending ? "Creating CAR…" : "Log CAR to Corrective Action System"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
