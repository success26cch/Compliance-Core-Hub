import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Loader2, Layers, CheckCircle2, FileText, Trash2 } from "lucide-react";

interface AspectImpact {
  id: number;
  processActivity: string | null;
  environmentalAspect: string;
  aspectCondition: string;
  isRoutine: boolean | null;
  potentialImpactDescription: string | null;
  impactTypes: string[] | null;
  applicableRegulations: string | null;
  otherRequirements: string | null;
  severity: number;
  probability: number;
  regulatoryScore: number;
  significanceScore: number;
  isSignificant: boolean;
  lifeCycleConsidered: boolean | null;
  operationalControl: string | null;
  objectiveTarget: string | null;
  responsiblePerson: string | null;
  reviewDate: string | null;
  notes: string | null;
}

const IMPACT_TYPES = [
  { code: "AQ", label: "Air Quality",        desc: "Air emissions / air quality impact" },
  { code: "WG", label: "Waste Generation",   desc: "Solid and/or liquid waste" },
  { code: "SS", label: "Sanitary Sewer",     desc: "Sanitary sewer discharge" },
  { code: "SW", label: "Storm Water",        desc: "Storm water quality" },
  { code: "GW", label: "Groundwater",        desc: "Groundwater impact" },
  { code: "SI", label: "Soil Impact",        desc: "Soil contamination" },
  { code: "EC", label: "Energy Consumption", desc: "Electric or natural gas" },
  { code: "NR", label: "Natural Resource",   desc: "Water / resource consumption" },
];

const SEVERITY_OPTIONS = [
  { value: 1, label: "1 – Negligible",    desc: "No measurable environmental impact" },
  { value: 2, label: "2 – Minor",         desc: "Minimal localized impact; easily managed" },
  { value: 3, label: "3 – Moderate",      desc: "Moderate impact limited to site; controllable" },
  { value: 4, label: "4 – Major",         desc: "Significant impact; may exceed regulatory thresholds" },
  { value: 5, label: "5 – Catastrophic",  desc: "Severe, widespread, or irreversible damage" },
];

const PROBABILITY_OPTIONS = [
  { value: 1, label: "1 – Rare",           desc: "Once in 5+ years or less" },
  { value: 2, label: "2 – Unlikely",       desc: "1–2 times per year" },
  { value: 3, label: "3 – Possible",       desc: "Monthly" },
  { value: 4, label: "4 – Likely",         desc: "Weekly" },
  { value: 5, label: "5 – Almost Certain", desc: "Daily or continuous" },
];

const REGULATORY_OPTIONS = [
  { value: 1, label: "1 – Voluntary Only",    desc: "No government regulation; voluntary programs only" },
  { value: 2, label: "2 – General Guidance",  desc: "Soft requirements; minimal risk of fines" },
  { value: 3, label: "3 – State / Local Reg.", desc: "State/local regulations with moderate criteria" },
  { value: 4, label: "4 – Federal Permit",    desc: "Federal/state permit with detailed criteria" },
  { value: 5, label: "5 – Specific Federal",  desc: "Facility-specific permit; extensive criteria; high fines" },
];

function SigBadge({ isSignificant }: { isSignificant: boolean }) {
  return isSignificant
    ? <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/40 font-black text-[10px] whitespace-nowrap">SIGNIFICANT</Badge>
    : <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40 text-[10px] whitespace-nowrap">Not Sig.</Badge>;
}

function ScoreDisplay({ s, p, r, score, sig }: { s: number; p: number; r: number; score: number; sig: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-base font-black ${sig ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{score}</span>
      <span className="text-[9px] text-muted-foreground">{s}×{p}×{r}</span>
    </div>
  );
}

const ASPECT_BLANK = {
  processActivity: "", environmentalAspect: "", aspectCondition: "normal", isRoutine: true,
  potentialImpactDescription: "", impactTypes: [] as string[],
  applicableRegulations: "", otherRequirements: "",
  severity: 3, probability: 2, regulatoryScore: 2,
  lifeCycleConsidered: false, operationalControl: "", objectiveTarget: "",
  responsiblePerson: "", reviewDate: "", notes: "",
};

export default function AspectsImpactsModule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("register");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<AspectImpact | null>(null);
  const [filterSig, setFilterSig] = useState<"all" | "significant" | "not">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<AspectImpact | null>(null);
  const [form, setForm] = useState(ASPECT_BLANK);

  const { data: aspects = [], isLoading } = useQuery<AspectImpact[]>({ queryKey: ["/api/env/aspects"] });

  const create = useMutation({
    mutationFn: (d: typeof ASPECT_BLANK) => apiRequest("POST", "/api/env/aspects", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/aspects"] }); setShowDialog(false); toast({ title: "Aspect added to register" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof ASPECT_BLANK }) => apiRequest("PATCH", `/api/env/aspects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/aspects"] }); setShowDialog(false); toast({ title: "Aspect updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/env/aspects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/aspects"] }); setDeleteConfirm(null); toast({ title: "Aspect removed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(ASPECT_BLANK); setShowDialog(true); }
  function openEdit(a: AspectImpact) {
    setEditing(a);
    setForm({
      processActivity: a.processActivity ?? "", environmentalAspect: a.environmentalAspect,
      aspectCondition: a.aspectCondition, isRoutine: a.isRoutine ?? true,
      potentialImpactDescription: a.potentialImpactDescription ?? "",
      impactTypes: a.impactTypes ?? [], applicableRegulations: a.applicableRegulations ?? "",
      otherRequirements: a.otherRequirements ?? "", severity: a.severity, probability: a.probability,
      regulatoryScore: a.regulatoryScore, lifeCycleConsidered: a.lifeCycleConsidered ?? false,
      operationalControl: a.operationalControl ?? "", objectiveTarget: a.objectiveTarget ?? "",
      responsiblePerson: a.responsiblePerson ?? "", reviewDate: a.reviewDate ?? "", notes: a.notes ?? "",
    });
    setShowDialog(true);
  }

  function toggleImpact(code: string) {
    setForm(f => ({ ...f, impactTypes: f.impactTypes.includes(code) ? f.impactTypes.filter(c => c !== code) : [...f.impactTypes, code] }));
  }

  function submit() {
    if (!form.environmentalAspect.trim()) { toast({ title: "Environmental Aspect is required", variant: "destructive" }); return; }
    if (editing) update.mutate({ id: editing.id, data: form });
    else create.mutate(form);
  }

  const liveScore = form.severity * form.probability * form.regulatoryScore;
  const liveSig = liveScore >= 75;

  const allAspects = aspects as AspectImpact[];
  const filtered = allAspects.filter(a => filterSig === "significant" ? a.isSignificant : filterSig === "not" ? !a.isSignificant : true);
  const totalSig = allAspects.filter(a => a.isSignificant).length;
  const impactDist: Record<string, number> = {};
  for (const a of allAspects) for (const t of a.impactTypes ?? []) impactDist[t] = (impactDist[t] ?? 0) + 1;

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-foreground">Aspects &amp; Impacts Analysis</h2>
          <p className="text-xs text-muted-foreground">ISO 14001:2015 §6.1.2 · Significant Environmental Aspects Register · Score = Severity × Probability × Regulatory (≥ 75 = SEA)</p>
        </div>
        <Button size="sm" className="bg-lime-600 hover:bg-lime-500 text-white gap-1.5" onClick={openAdd} data-testid="button-add-aspect">
          <Plus className="w-3.5 h-3.5" /> Add Aspect
        </Button>
      </div>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Aspects</p>
          <p className="text-2xl font-black text-foreground">{allAspects.length}</p>
        </div>
        <div className="rounded-xl border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 p-3">
          <p className="text-[10px] text-red-700 dark:text-red-400 uppercase tracking-widest font-bold mb-1">Significant (SEA)</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-400">{totalSig}</p>
        </div>
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 p-3">
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-widest font-bold mb-1">Not Significant</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{allAspects.length - totalSig}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Life Cycle Tracked</p>
          <p className="text-2xl font-black text-foreground">{allAspects.filter(a => a.lifeCycleConsidered).length}</p>
        </div>
      </div>

      {/* Impact type distribution chips */}
      {Object.keys(impactDist).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {IMPACT_TYPES.filter(t => impactDist[t.code]).map(t => (
            <span key={t.code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 border border-lime-200 dark:border-lime-700/40 text-[10px] font-bold">
              {t.code} <span className="font-normal text-lime-600 dark:text-lime-400">({impactDist[t.code]})</span>
            </span>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="register">Aspects Register</TabsTrigger>
          <TabsTrigger value="criteria">Evaluation Criteria</TabsTrigger>
        </TabsList>

        {/* ── Register Tab ── */}
        <TabsContent value="register" className="mt-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {([["all","All"],["significant","Significant Only"],["not","Not Significant"]] as [string,string][]).map(([v,l]) => (
              <button key={v} onClick={() => setFilterSig(v as any)}
                className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${filterSig === v ? "bg-lime-600 text-white border-lime-600" : "border-border text-muted-foreground hover:border-lime-500 hover:text-lime-600"}`}
                data-testid={`filter-aspects-${v}`}>
                {l}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed rounded-xl p-12 text-center space-y-2">
              <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">No aspects logged yet</p>
              <p className="text-xs text-muted-foreground">Click <strong>Add Aspect</strong> to build your ISO 14001 §6.1.2 register.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs min-w-[960px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2.5 font-bold text-muted-foreground w-[140px]">Process / Activity</th>
                    <th className="text-left px-3 py-2.5 font-bold text-muted-foreground">Environmental Aspect &amp; Potential Impact</th>
                    <th className="text-left px-3 py-2.5 font-bold text-muted-foreground w-[90px]">Condition</th>
                    <th className="text-left px-3 py-2.5 font-bold text-muted-foreground w-[110px]">Impact Types</th>
                    <th className="text-center px-2 py-2.5 font-bold text-muted-foreground w-[28px]" title="Severity">S</th>
                    <th className="text-center px-2 py-2.5 font-bold text-muted-foreground w-[28px]" title="Probability">P</th>
                    <th className="text-center px-2 py-2.5 font-bold text-muted-foreground w-[28px]" title="Regulatory">R</th>
                    <th className="text-center px-2 py-2.5 font-bold text-muted-foreground w-[58px]">Score</th>
                    <th className="text-center px-2 py-2.5 font-bold text-muted-foreground w-[100px]">Significance</th>
                    <th className="text-center px-2 py-2.5 font-bold text-muted-foreground w-[28px]" title="Life Cycle">LC</th>
                    <th className="text-left px-3 py-2.5 font-bold text-muted-foreground">Operational Control</th>
                    <th className="px-2 py-2.5 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className={`border-b transition-colors hover:bg-muted/30 ${a.isSignificant ? "bg-red-50/50 dark:bg-red-950/10" : ""}`} data-testid={`row-aspect-${a.id}`}>
                      <td className="px-3 py-2.5 text-muted-foreground text-[11px]">{a.processActivity || "—"}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-foreground leading-snug">{a.environmentalAspect}</p>
                        {a.potentialImpactDescription && <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{a.potentialImpactDescription}</p>}
                        {a.applicableRegulations && <p className="text-[9px] text-muted-foreground/70 mt-0.5 font-mono">{a.applicableRegulations}</p>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                          a.aspectCondition === "emergency" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          a.aspectCondition === "abnormal" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {a.aspectCondition}{!a.isRoutine ? " · NR" : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-0.5">
                          {(a.impactTypes ?? []).map(t => (
                            <span key={t} className="text-[9px] font-black bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-1 rounded">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center font-black">{a.severity}</td>
                      <td className="px-2 py-2.5 text-center font-black">{a.probability}</td>
                      <td className="px-2 py-2.5 text-center font-black">{a.regulatoryScore}</td>
                      <td className="px-2 py-2.5 text-center">
                        <ScoreDisplay s={a.severity} p={a.probability} r={a.regulatoryScore} score={a.significanceScore} sig={a.isSignificant} />
                      </td>
                      <td className="px-2 py-2.5 text-center"><SigBadge isSignificant={a.isSignificant} /></td>
                      <td className="px-2 py-2.5 text-center">
                        {a.lifeCycleConsidered ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{a.operationalControl || "—"}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(a)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" data-testid={`button-edit-aspect-${a.id}`}><FileText className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteConfirm(a)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600" data-testid={`button-delete-aspect-${a.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Criteria Reference Tab ── */}
        <TabsContent value="criteria" className="mt-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Severity (S) — Impact Magnitude", sub: "How severe is the environmental impact?", options: SEVERITY_OPTIONS },
              { title: "Probability (P) — Frequency / Likelihood", sub: "How often does or could this aspect occur?", options: PROBABILITY_OPTIONS },
              { title: "Regulatory (R) — Legal Significance", sub: "What level of regulatory obligation applies?", options: REGULATORY_OPTIONS },
            ].map(({ title, sub, options }) => (
              <div key={title} className="rounded-xl border p-4 space-y-2.5">
                <div>
                  <p className="font-black text-sm text-foreground leading-tight">{title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <div className="space-y-1.5">
                  {options.map(o => (
                    <div key={o.value} className="flex gap-2 items-start">
                      <span className={`shrink-0 w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${o.value >= 4 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : o.value === 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>{o.value}</span>
                      <div>
                        <p className="text-xs font-semibold leading-tight">{o.label.split(" – ")[1]}</p>
                        <p className="text-[10px] text-muted-foreground">{o.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-950/10 p-4 space-y-3 sm:col-span-2 lg:col-span-3">
              <p className="font-black text-sm text-red-700 dark:text-red-400">Significance Formula: S × P × R ≥ 75 = Significant Environmental Aspect (SEA)</p>
              <p className="text-xs text-muted-foreground">Maximum possible score: <strong>125</strong> (5 × 5 × 5). Threshold for significance: <strong>≥ 75</strong>. Significant aspects must be addressed in your EMS environmental objectives (§6.2), operational controls (§8.1), and management review inputs (§9.3).</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {([["≥ 75","SIGNIFICANT — SEA","bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"],["60–74","High — Review Controls","bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"],["30–59","Moderate","bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"],["< 30","Low","bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"]] as [string,string,string][]).map(([range, label, cls]) => (
                  <div key={range} className={`rounded-lg px-3 py-2 ${cls}`}>
                    <p className="text-[11px] font-black">{range}</p>
                    <p className="text-[10px]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-2 sm:col-span-2 lg:col-span-3">
              <p className="font-black text-sm text-foreground">Environmental Impact Type Codes</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {IMPACT_TYPES.map(t => (
                  <div key={t.code} className="flex items-start gap-2 bg-muted/40 rounded-lg px-2 py-1.5">
                    <span className="text-[10px] font-black bg-lime-200 dark:bg-lime-800/40 text-lime-800 dark:text-lime-300 px-1.5 py-0.5 rounded shrink-0">{t.code}</span>
                    <div><p className="text-xs font-semibold">{t.label}</p><p className="text-[10px] text-muted-foreground">{t.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? "Edit Environmental Aspect" : "Add Environmental Aspect / Impact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-bold">Process / Task / Activity</Label>
                <Input className="mt-1" placeholder="e.g., Paint Booth Operations, Facility Maintenance, Welding" value={form.processActivity} onChange={e => setForm(f => ({ ...f, processActivity: e.target.value }))} data-testid="input-process-activity" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-bold">Environmental Aspect <span className="text-red-500">*</span></Label>
                <Input className="mt-1" placeholder="e.g., Disposal of hazardous waste, Fuel combustion, Water usage" value={form.environmentalAspect} onChange={e => setForm(f => ({ ...f, environmentalAspect: e.target.value }))} data-testid="input-environmental-aspect" />
              </div>
              <div>
                <Label className="text-xs font-bold">Operating Condition</Label>
                <Select value={form.aspectCondition} onValueChange={v => setForm(f => ({ ...f, aspectCondition: v }))}>
                  <SelectTrigger className="mt-1 h-9" data-testid="select-aspect-condition"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="abnormal">Abnormal (startup / shutdown)</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="chk-routine" checked={form.isRoutine} onChange={e => setForm(f => ({ ...f, isRoutine: e.target.checked }))} className="w-4 h-4 rounded border-border" data-testid="checkbox-is-routine" />
                <Label htmlFor="chk-routine" className="text-xs font-semibold cursor-pointer">Routine Activity</Label>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Potential Environmental Impact Description</Label>
              <Textarea className="mt-1 text-sm h-16 resize-none" placeholder="e.g., Air emissions to atmosphere, groundwater contamination, storm water discharge..." value={form.potentialImpactDescription} onChange={e => setForm(f => ({ ...f, potentialImpactDescription: e.target.value }))} data-testid="textarea-impact-description" />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Impact Type(s)</Label>
              <div className="flex flex-wrap gap-1.5">
                {IMPACT_TYPES.map(t => (
                  <button key={t.code} type="button" onClick={() => toggleImpact(t.code)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-bold transition-colors ${form.impactTypes.includes(t.code) ? "bg-lime-600 text-white border-lime-600" : "border-border text-muted-foreground hover:border-lime-500"}`}
                    data-testid={`toggle-impact-${t.code}`}>
                    {t.code} — {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Applicable Regulations (F/S/L)</Label>
                <Textarea className="mt-1 text-xs h-16 resize-none" placeholder="40 CFR 279 (F), Act 451 Part 121 (S), City Ord. §82 (L)..." value={form.applicableRegulations} onChange={e => setForm(f => ({ ...f, applicableRegulations: e.target.value }))} data-testid="textarea-applicable-regulations" />
              </div>
              <div>
                <Label className="text-xs font-bold">Other Requirements</Label>
                <Textarea className="mt-1 text-xs h-16 resize-none" placeholder="Corporate policy, customer requirement, voluntary (ISO 14001)..." value={form.otherRequirements} onChange={e => setForm(f => ({ ...f, otherRequirements: e.target.value }))} data-testid="textarea-other-requirements" />
              </div>
            </div>

            {/* Scoring block */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Significance Scoring — S × P × R</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  ["Severity (S)", "severity", SEVERITY_OPTIONS],
                  ["Probability (P)", "probability", PROBABILITY_OPTIONS],
                  ["Regulatory (R)", "regulatoryScore", REGULATORY_OPTIONS],
                ] as [string, keyof typeof ASPECT_BLANK, typeof SEVERITY_OPTIONS][]).map(([lbl, field, opts]) => (
                  <div key={field}>
                    <Label className="text-xs font-bold">{lbl}</Label>
                    <Select value={String(form[field])} onValueChange={v => setForm(f => ({ ...f, [field]: Number(v) }))}>
                      <SelectTrigger className="mt-1 h-9" data-testid={`select-${field}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{opts.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{opts.find(o => o.value === form[field] as number)?.desc}</p>
                  </div>
                ))}
              </div>
              {/* Live preview */}
              <div className={`rounded-lg px-4 py-3 flex items-center justify-between gap-4 ${liveSig ? "bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-700/40" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30"}`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Score</p>
                  <p className={`text-4xl font-black ${liveSig ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{liveScore}</p>
                  <p className="text-[10px] text-muted-foreground">{form.severity} × {form.probability} × {form.regulatoryScore} = {liveScore} / 125</p>
                </div>
                <div className="text-right">
                  {liveSig
                    ? <Badge className="bg-red-600 text-white border-0 text-sm font-black px-3 py-1">⚠ SIGNIFICANT</Badge>
                    : <Badge className="bg-emerald-600 text-white border-0 text-sm font-black px-3 py-1">✓ Not Significant</Badge>}
                  <p className="text-[10px] text-muted-foreground mt-1">Threshold ≥ 75</p>
                </div>
              </div>
            </div>

            {/* Controls & metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="chk-lc" checked={form.lifeCycleConsidered} onChange={e => setForm(f => ({ ...f, lifeCycleConsidered: e.target.checked }))} className="w-4 h-4 rounded border-border" data-testid="checkbox-lifecycle" />
                <Label htmlFor="chk-lc" className="text-xs font-semibold cursor-pointer">Life Cycle Considered (ISO 14001 §6.1.2 — facility has influence over this aspect's upstream/downstream phases)</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-bold">Operational Control / Document Name &amp; Number</Label>
                <Input className="mt-1" placeholder="e.g., WI-ENV-001 Waste Management Procedure, Monthly monitoring log" value={form.operationalControl} onChange={e => setForm(f => ({ ...f, operationalControl: e.target.value }))} data-testid="input-operational-control" />
              </div>
              <div>
                <Label className="text-xs font-bold">Environmental Objective / Target</Label>
                <Input className="mt-1" placeholder="e.g., Reduce hazardous waste 10% by year-end" value={form.objectiveTarget} onChange={e => setForm(f => ({ ...f, objectiveTarget: e.target.value }))} data-testid="input-objective-target" />
              </div>
              <div>
                <Label className="text-xs font-bold">Responsible Person</Label>
                <Input className="mt-1" placeholder="Name or role" value={form.responsiblePerson} onChange={e => setForm(f => ({ ...f, responsiblePerson: e.target.value }))} data-testid="input-responsible-person" />
              </div>
              <div>
                <Label className="text-xs font-bold">Next Review Date</Label>
                <Input type="date" className="mt-1" value={form.reviewDate} onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))} data-testid="input-review-date" />
              </div>
              <div>
                <Label className="text-xs font-bold">Notes</Label>
                <Input className="mt-1" placeholder="Additional context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-notes-aspect" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending} className="bg-lime-600 hover:bg-lime-500 text-white" data-testid="button-save-aspect">
              {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Add to Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Environmental Aspect?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove <strong className="text-foreground">{deleteConfirm?.environmentalAspect}</strong> from your register. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && del.mutate(deleteConfirm.id)} disabled={del.isPending} data-testid="button-confirm-delete-aspect">
              {del.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
