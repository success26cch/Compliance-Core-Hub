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
  CheckSquare, MinusCircle, Minus, AlertCircle, FileText,
} from "lucide-react";
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────

export default function LayeredProcessAuditModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"plans" | "records" | "compliance">("plans");
  const [planDialog, setPlanDialog] = useState<{ open: boolean; plan?: LpaAuditPlan }>({ open: false });
  const [conductDialog, setConductDialog] = useState<{ open: boolean; plan?: LpaAuditPlan }>({ open: false });
  const [recordDialog, setRecordDialog] = useState<LpaRecord | null>(null);
  const [recordFilter, setRecordFilter] = useState({ layer: "all", planId: "all", search: "" });

  const { data: plans = [] } = useQuery<LpaAuditPlan[]>({ queryKey: ["/api/lpa-plans"] });
  const { data: records = [] } = useQuery<LpaRecord[]>({ queryKey: ["/api/lpa-records"] });

  const savePlan = useMutation({
    mutationFn: (data: any) => data.id
      ? apiRequest("PATCH", `/api/lpa-plans/${data.id}`, data)
      : apiRequest("POST", "/api/lpa-plans", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/lpa-plans"] }); setPlanDialog({ open: false }); toast({ title: "Audit plan saved." }); },
    onError: () => toast({ title: "Error", description: "Could not save plan.", variant: "destructive" }),
  });

  const deletePlan = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/lpa-plans/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/lpa-plans"] }); toast({ title: "Plan deleted." }); },
  });

  const saveRecord = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/lpa-records", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/lpa-records"] }); setConductDialog({ open: false }); toast({ title: "Audit record saved.", description: "LPA completed and recorded." }); },
    onError: () => toast({ title: "Error", description: "Could not save audit record.", variant: "destructive" }),
  });

  const deleteRecord = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/lpa-records/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/lpa-records"] }); setRecordDialog(null); toast({ title: "Record deleted." }); },
  });

  const filteredRecords = useMemo(() => records.filter(r => {
    if (recordFilter.layer !== "all" && r.layer !== recordFilter.layer) return false;
    if (recordFilter.planId !== "all" && String(r.planId) !== recordFilter.planId) return false;
    if (recordFilter.search && !`${r.processName} ${r.auditorName} ${r.area}`.toLowerCase().includes(recordFilter.search.toLowerCase())) return false;
    return true;
  }), [records, recordFilter]);

  // ── Compliance stats ──────────────────────────────────────────────────────
  const complianceStats = useMemo(() => {
    const last30 = new Date(); last30.setDate(last30.getDate() - 30);
    const recentRecords = records.filter(r => new Date(r.auditDate) >= last30);
    const layers = ["L1", "L2", "L3", "L4", "L5"];
    return layers.map(layer => {
      const layerRecords = recentRecords.filter(r => r.layer === layer);
      const allLayerPlans = plans.filter(p => p.status === "active" && (p.layers as LpaLayerConfig[]).some(l => l.layer === layer && l.active));
      const passCount = layerRecords.filter(r => r.result === "pass").length;
      const failCount = layerRecords.filter(r => r.result === "fail").length;
      const totalNonconf = layerRecords.reduce((s, r) => s + (r.nonconformingCount || 0), 0);
      const totalItems = layerRecords.reduce((s, r) => s + (r.conformingCount || 0) + (r.nonconformingCount || 0), 0);
      const ncRate = totalItems > 0 ? Math.round((totalNonconf / totalItems) * 100) : 0;
      const layerLabel = LAYER_DEFAULTS.find(l => l.layer === layer)?.label ?? layer;
      return { layer, layerLabel, count: layerRecords.length, passCount, failCount, ncRate, planCount: allLayerPlans.length };
    });
  }, [records, plans]);

  const totalRecordsThisMonth = records.filter(r => new Date(r.auditDate) >= (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })()).length;
  const openNCs = records.reduce((s, r) => s + (r.nonconformingCount || 0), 0);
  const escalatedCount = records.filter(r => r.escalated).length;

  const TABS = [
    { key: "plans",      label: "Audit Plans",  icon: Layers },
    { key: "records",    label: "Records",       icon: ClipboardCheck },
    { key: "compliance", label: "Compliance",    icon: BarChart3 },
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
          <p className="text-xs text-muted-foreground">GM BIQS · Stellantis · Ford Q1 · IATF 16949 §9.2</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs gap-1 hidden sm:flex"><ClipboardCheck className="w-3 h-3" />{records.length} Records</Badge>
          <Badge variant="outline" className="text-xs gap-1 hidden sm:flex"><Layers className="w-3 h-3" />{plans.filter(p=>p.status==="active").length} Active Plans</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="shrink-0 grid grid-cols-3 sm:grid-cols-3 gap-2 px-4 sm:px-6 py-3 border-b">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Activity className="w-4 h-4 text-blue-600" /></div>
          <div><div className="text-lg font-bold leading-tight">{totalRecordsThisMonth}</div><div className="text-[10px] text-muted-foreground">Audits (30 days)</div></div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><XCircle className="w-4 h-4 text-red-600" /></div>
          <div><div className="text-lg font-bold leading-tight">{openNCs}</div><div className="text-[10px] text-muted-foreground">Total NCs Found</div></div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-orange-600" /></div>
          <div><div className="text-lg font-bold leading-tight">{escalatedCount}</div><div className="text-[10px] text-muted-foreground">Escalated</div></div>
        </Card>
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
                <p className="text-xs text-muted-foreground">{records.length} total records</p>
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

        {/* ── COMPLIANCE TAB ──────────────────────────────────────────────── */}
        {activeTab === "compliance" && (
          <div className="p-4 sm:p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-sm">Compliance Dashboard</h2>
              <p className="text-xs text-muted-foreground">Audit activity and nonconformance rates by layer — last 30 days</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {complianceStats.filter(s => s.planCount > 0 || s.count > 0).map(s => (
                <LayerComplianceCard key={s.layer} stat={s} />
              ))}
              {complianceStats.every(s => s.planCount === 0 && s.count === 0) && (
                <div className="col-span-3">
                  <EmptyState icon={BarChart3} title="No compliance data yet" desc="Create audit plans and conduct LPAs to see compliance statistics." />
                </div>
              )}
            </div>

            {/* Recent NC summary */}
            {records.filter(r => (r.nonconformingCount ?? 0) > 0).length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-500" />Nonconformances Found
                </h3>
                <div className="space-y-2">
                  {records.filter(r => (r.nonconformingCount ?? 0) > 0).slice(0, 8).map(rec => (
                    <button key={rec.id} onClick={() => setRecordDialog(rec)} className="w-full text-left">
                      <Card className="p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 text-xs">
                          <Badge className={`text-[10px] border shrink-0 ${LAYER_COLORS[rec.layer] ?? ""}`}>{rec.layer}</Badge>
                          <span className="font-medium truncate">{rec.processName}</span>
                          <span className="text-muted-foreground shrink-0">{rec.auditDate}</span>
                          <Badge className="bg-red-50 text-red-700 border-red-200 border text-[10px] shrink-0">{rec.nonconformingCount} NC{(rec.nonconformingCount ?? 0) > 1 ? "s" : ""}</Badge>
                          {rec.escalated && <Badge className="bg-orange-50 text-orange-700 border-orange-200 border text-[10px] shrink-0">Escalated</Badge>}
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
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
          onDelete={planDialog.plan ? () => { if (confirm("Delete this audit plan and all its records?")) deletePlan.mutate(planDialog.plan!.id); setPlanDialog({ open: false }); } : undefined}
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
          onClose={() => setRecordDialog(null)}
        />
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

function LayerComplianceCard({ stat }: { stat: any }) {
  const ncColor = stat.ncRate === 0 ? "text-green-600" : stat.ncRate < 10 ? "text-yellow-600" : "text-red-600";
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${LAYER_COLORS[stat.layer] ?? ""}`}>{stat.layer}</span>
          <div className="text-xs font-medium mt-1.5">{stat.layerLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{stat.count}</div>
          <div className="text-[10px] text-muted-foreground">audits (30d)</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-bold text-green-600">{stat.passCount}</div>
          <div className="text-[10px] text-muted-foreground">Pass</div>
        </div>
        <div>
          <div className="text-sm font-bold text-red-600">{stat.failCount}</div>
          <div className="text-[10px] text-muted-foreground">Fail</div>
        </div>
        <div>
          <div className={`text-sm font-bold ${ncColor}`}>{stat.ncRate}%</div>
          <div className="text-[10px] text-muted-foreground">NC Rate</div>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: stat.count > 0 ? `${Math.min(100, Math.round((stat.passCount/stat.count)*100))}%` : "0%" }} />
      </div>
      <div className="text-[10px] text-muted-foreground">{stat.planCount} active plan{stat.planCount !== 1 ? "s" : ""} for this layer</div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DIALOG (Create / Edit)
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
  const [layers, setLayers] = useState<LpaLayerConfig[]>(
    existingLayers.length > 0 ? existingLayers : LAYER_DEFAULTS.map(l => ({ ...l }))
  );
  const [questions, setQuestions] = useState<LpaQuestion[]>(
    existingQuestions.length > 0 ? existingQuestions : DEFAULT_QUESTIONS.map(q => ({ ...q }))
  );
  const [questionTab, setQuestionTab] = useState<"layers" | "questions">("layers");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => setExpandedCats(prev => { const s = new Set(prev); s.has(cat) ? s.delete(cat) : s.add(cat); return s; });
  const questionsByCategory = questions.reduce((acc: Record<string, LpaQuestion[]>, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

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
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {existing ? "Edit" : "New"} Audit Plan
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto space-y-4 px-1 py-1">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Process Name *</Label>
              <Input placeholder="e.g. Chemical Blending, Stamping Line 3, Final Assembly" value={processName} onChange={e => setProcessName(e.target.value)} data-testid="input-lpa-process-name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Work Area / Cell</Label>
              <Input placeholder="e.g. Blending Bay 1, Press Shop" value={area} onChange={e => setArea(e.target.value)} data-testid="input-lpa-area" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Part Family / Product Line</Label>
              <Input placeholder="e.g. CCI-2240 Series, Seat Frames" value={partFamily} onChange={e => setPartFamily(e.target.value)} data-testid="input-lpa-part-family" />
            </div>
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
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Any special scope or instructions" value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-lpa-notes" />
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="border-b flex gap-0">
            {([["layers","Layer Configuration"],["questions","Question Library"]] as const).map(([k,lbl]) => (
              <button key={k} onClick={() => setQuestionTab(k)}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${questionTab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Layers Config */}
          {questionTab === "layers" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Enable the audit layers for this process and set the target frequency for each layer.</p>
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

          {/* Questions Config */}
          {questionTab === "questions" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{questions.length} questions · click category to expand and configure which layers each question applies to.</p>
              </div>
              {Object.entries(questionsByCategory).map(([cat, qs]) => (
                <div key={cat} className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleCat(cat)} className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 text-xs font-medium transition-colors">
                    <span>{cat} <span className="text-muted-foreground font-normal">({qs.length})</span></span>
                    {expandedCats.has(cat) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCats.has(cat) && (
                    <div className="divide-y">
                      {qs.map((q) => {
                        const qIdx = questions.findIndex(x => x.id === q.id);
                        return (
                          <div key={q.id} className="px-3 py-2 space-y-1.5">
                            <div className="text-xs">{q.question}</div>
                            <div className="flex flex-wrap gap-1">
                              {["L1","L2","L3","L4","L5"].map(layer => (
                                <button key={layer} onClick={() => toggleQuestionLayer(qIdx, layer)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${q.appliesTo.includes(layer) ? `border font-medium ${LAYER_COLORS[layer]}` : "border-muted text-muted-foreground bg-transparent"}`}>
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

  // Filter questions by selected layer
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
    questionId: q.id,
    question: q.question,
    category: q.category,
    layer: selectedLayer,
    result: answers[q.id]?.result ?? "yes",
    note: answers[q.id]?.note ?? "",
  }));

  const conformingCount = auditItems.filter(i => i.result === "yes").length;
  const nonconformingCount = auditItems.filter(i => i.result === "no").length;
  const naCount = auditItems.filter(i => i.result === "na").length;
  const answeredCount = layerQuestions.length;
  const result = nonconformingCount === 0 ? "pass" : nonconformingCount <= 2 ? "partial" : "fail";

  const groupedItems = groupByCategory(auditItems);

  const handleSubmit = () => {
    onSave({
      planId: plan.id,
      processName: plan.processName,
      area: plan.area,
      auditDate,
      layer: selectedLayer,
      layerLabel,
      auditorName,
      shift,
      auditItems,
      conformingCount,
      nonconformingCount,
      naCount,
      result,
      overallNotes,
      immediateActions,
      escalated,
      escalatedTo: escalated ? escalatedTo : "",
    });
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Conduct LPA — {plan.processName}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
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

          {/* Step 1: Header */}
          {step === "header" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Audit Layer *</Label>
                <div className="flex flex-wrap gap-2">
                  {activeLayers.map(l => (
                    <button key={l.layer} onClick={() => handleLayerChange(l.layer)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selectedLayer === l.layer ? `${LAYER_COLORS[l.layer]} border` : "border-muted bg-transparent text-muted-foreground hover:bg-muted/30"}`}
                      data-testid={`button-select-layer-${l.layer}`}>
                      {l.layer} — {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Auditor Name *</Label>
                  <Input placeholder="Your name and title" value={auditorName} onChange={e => setAuditorName(e.target.value)} data-testid="input-lpa-auditor-name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Audit Date *</Label>
                  <Input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} data-testid="input-lpa-audit-date" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger data-testid="select-lpa-shift"><SelectValue /></SelectTrigger>
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
                {plan.partFamily && <div className="text-muted-foreground">Part Family: {plan.partFamily}</div>}
                <div className="text-muted-foreground">Questions for {selectedLayer}: {layerQuestions.length}</div>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === "questions" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{layerQuestions.length} questions for {selectedLayer} — {plan.processName}</span>
                <span>
                  <span className="text-green-600 font-medium">{conformingCount} ✓</span>
                  {" · "}
                  <span className="text-red-600 font-medium">{nonconformingCount} ✗</span>
                  {naCount > 0 && <span className="text-muted-foreground font-medium"> · {naCount} N/A</span>}
                </span>
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
                                className={`px-2.5 py-1 rounded border text-[10px] font-medium transition-colors ${answers[item.questionId]?.result === v ? cls : "border-muted text-muted-foreground hover:bg-muted/30"}`}
                                data-testid={`button-lpa-answer-${item.questionId}-${v}`}>
                                {lbl}
                              </button>
                            ))}
                            {answers[item.questionId]?.result === "no" && (
                              <Input className="h-6 text-xs flex-1 min-w-32" placeholder="Note / describe finding…" value={answers[item.questionId]?.note ?? ""} onChange={e => setNote(item.questionId, e.target.value)} />
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

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="p-3">
                  <div className="text-2xl font-bold text-green-600">{conformingCount}</div>
                  <div className="text-[10px] text-muted-foreground">Conforming (Yes)</div>
                </Card>
                <Card className="p-3">
                  <div className="text-2xl font-bold text-red-600">{nonconformingCount}</div>
                  <div className="text-[10px] text-muted-foreground">Nonconforming (No)</div>
                </Card>
                <Card className="p-3">
                  <div className={`text-2xl font-bold ${RESULT_COLORS[result] ? result === "pass" ? "text-green-600" : result === "fail" ? "text-red-600" : "text-yellow-600" : ""}`}>
                    {result.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Overall Result</div>
                </Card>
              </div>

              {nonconformingCount > 0 && (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50/30 space-y-1">
                  <div className="text-xs font-medium text-red-700 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Nonconformances ({nonconformingCount})</div>
                  {auditItems.filter(i => i.result === "no").map(i => (
                    <div key={i.questionId} className="text-xs text-red-700">• {i.question}{i.note ? ` — ${i.note}` : ""}</div>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Overall Notes / Observations</Label>
                <Textarea placeholder="General observations, commendations, or additional findings…" rows={2} value={overallNotes} onChange={e => setOverallNotes(e.target.value)} data-testid="textarea-lpa-notes" />
              </div>
              {nonconformingCount > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Immediate Corrective Actions Taken</Label>
                  <Textarea placeholder="What was done immediately to address nonconformances?" rows={2} value={immediateActions} onChange={e => setImmediateActions(e.target.value)} data-testid="textarea-lpa-immediate-actions" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => setEscalated(e => !e)} className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${escalated ? "border-orange-500 bg-orange-500" : "border-muted-foreground"}`}>
                    {escalated && <CheckSquare className="w-3 h-3 text-white" />}
                  </div>
                  <span>Escalate to higher layer</span>
                </button>
                {escalated && (
                  <Input className="h-7 text-xs flex-1" placeholder="Escalated to (name / role)" value={escalatedTo} onChange={e => setEscalatedTo(e.target.value)} data-testid="input-lpa-escalated-to" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          {step !== "header" && (
            <Button variant="outline" onClick={() => setStep(step === "review" ? "questions" : "header")} className="gap-1">
              ← Back
            </Button>
          )}
          {step === "header" && (
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => setStep("questions")} disabled={!auditorName.trim()} data-testid="button-lpa-next-to-questions">
              Next: Questions →
            </Button>
          )}
          {step === "questions" && (
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => setStep("review")} data-testid="button-lpa-next-to-review">
              Review & Submit →
            </Button>
          )}
          {step === "review" && (
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit} disabled={isPending} data-testid="button-lpa-submit">
              {isPending ? "Saving…" : "Submit Audit"}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD DETAIL DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function RecordDetailDialog({ record, onDelete, onClose }: {
  record: LpaRecord;
  onDelete: () => void;
  onClose: () => void;
}) {
  const items = record.auditItems as LpaAuditItem[];
  const grouped = groupByCategory(items);
  const result = record.result ?? "pass";
  const resultBadge = RESULT_COLORS[result as keyof typeof RESULT_COLORS] ?? "";

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
          {/* Header Info */}
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

          {(record.nonconformingCount ?? 0) > 0 && (
            <div className="border border-red-200 bg-red-50/30 rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium text-red-700 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />Nonconformances</div>
              {items.filter(i => i.result === "no").map(i => (
                <div key={i.questionId} className="text-xs text-red-700">• {i.question}{i.note ? ` — ${i.note}` : ""}</div>
              ))}
            </div>
          )}

          {/* Question Detail by Category */}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/30 text-xs font-medium flex items-center justify-between">
                <span>{cat}</span>
                <span className="text-muted-foreground">{catItems.filter(i=>i.result==="yes").length}/{catItems.length} conforming</span>
              </div>
              <div className="divide-y">
                {catItems.map(item => (
                  <div key={item.questionId} className={`px-3 py-2 flex items-start gap-3 ${item.result === "no" ? "bg-red-50/20" : ""}`}>
                    <div className="shrink-0 mt-0.5">
                      {item.result === "yes" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : item.result === "no" ? <XCircle className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4 text-gray-400" />}
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
          {record.escalated && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium text-orange-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Escalated</div>
              <div className="text-xs text-orange-700">{record.escalatedTo}</div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (confirm("Delete this LPA record?")) onDelete(); }} data-testid="button-delete-lpa-record">
            <Trash2 className="w-4 h-4 mr-1" />Delete
          </Button>
          <Button className="flex-1" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
