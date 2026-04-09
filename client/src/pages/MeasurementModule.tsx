import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BarChart2, Plus, Pencil, Trash2, TrendingUp, Bot, ChevronDown, ChevronUp, CheckCircle, AlertCircle, MinusCircle } from "lucide-react";
import type { IsoObjective, IsoKpiActual } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const statusIcon = (s: string) => {
  if (s === "on_track") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === "at_risk") return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  return <MinusCircle className="w-4 h-4 text-red-500" />;
};

const statusColor = (s: string) => {
  if (s === "on_track") return "text-green-600 bg-green-50 dark:bg-green-900/20";
  if (s === "at_risk") return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
  return "text-red-600 bg-red-50 dark:bg-red-900/20";
};

function GaugeChart({ actual, target }: { actual: number; target: number }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const angle = (pct / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = 80, cy = 80, r = 60;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 160 100" className="w-full max-w-[160px]">
      <path d="M20,80 A60,60 0 0,1 140,80" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
      {pct > 0 && (
        <path d={`M20,80 A60,60 0 ${pct > 50 ? 1 : 0},1 ${cx + r * Math.cos((((pct / 100) * 180 - 90) * Math.PI) / 180)},${cy + r * Math.sin((((pct / 100) * 180 - 90) * Math.PI) / 180)}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      )}
      <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill={color} />
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>{pct.toFixed(0)}%</text>
    </svg>
  );
}

function KpiCard({ obj, actuals, onLog, onEditObj, onDeleteObj }: {
  obj: IsoObjective;
  actuals: IsoKpiActual[];
  onLog: () => void;
  onEditObj: () => void;
  onDeleteObj: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...actuals].sort((a, b) => a.period.localeCompare(b.period));
  const latest = sorted[sorted.length - 1];
  const latestVal = latest ? parseFloat(latest.actual) : 0;
  const targetVal = parseFloat(obj.target ?? "0");
  const chartData = sorted.map(a => ({ period: a.period, actual: parseFloat(a.actual), target: targetVal }));

  return (
    <Card className={`border-l-4 ${obj.status === "on_track" ? "border-green-400" : obj.status === "at_risk" ? "border-yellow-400" : "border-red-400"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {statusIcon(obj.status)}
              <span className="font-semibold text-sm text-foreground truncate">{obj.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">{obj.frequency}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {obj.processName && <span>Process: <span className="font-medium">{obj.processName}</span></span>}
              {obj.responsible && <span>Owner: <span className="font-medium">{obj.responsible}</span></span>}
              <span>Target: <span className="font-medium">{obj.target} {obj.unit}</span></span>
              {latest && <span>Latest: <span className="font-medium text-foreground">{latest.actual} {obj.unit}</span> ({latest.period})</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isNaN(latestVal) && !isNaN(targetVal) && targetVal > 0 && (
              <div className="w-16"><GaugeChart actual={latestVal} target={targetVal} /></div>
            )}
            <div className="flex flex-col gap-1">
              <button onClick={onLog} data-testid={`button-log-kpi-${obj.id}`} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-accent" title="Log measurement">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={onEditObj} data-testid={`button-edit-obj-${obj.id}`} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Edit KPI">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDeleteObj} data-testid={`button-delete-obj-${obj.id}`} className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600" title="Delete KPI">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setExpanded(v => !v)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {expanded && chartData.length > 0 && (
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <ReferenceLine y={targetVal} stroke="#f97316" strokeDasharray="4 2" label={{ value: "Target", position: "insideTopRight", fontSize: 10, fill: "#f97316" }} />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name={`${obj.name} (${obj.unit})`} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {expanded && (
          <div className="mt-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Measurement History</div>
            {actuals.length === 0 ? (
              <p className="text-xs text-muted-foreground">No measurements logged yet.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...actuals].sort((a, b) => b.period.localeCompare(a.period)).map(a => (
                  <div key={a.id} className="flex justify-between text-xs py-1 px-2 rounded bg-muted/40">
                    <span className="font-medium">{a.period}</span>
                    <span>{a.actual} {obj.unit}</span>
                    {a.notes && <span className="text-muted-foreground truncate max-w-[120px]">{a.notes}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const EMPTY_OBJ_FORM = { name: "", processName: "", target: "", unit: "", frequency: "monthly", responsible: "", status: "on_track", description: "" };
const EMPTY_LOG_FORM = { period: "", actual: "", notes: "" };

export default function MeasurementModule({ isoProjectId }: { isoProjectId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [logFor, setLogFor] = useState<IsoObjective | null>(null);
  const [logForm, setLogForm] = useState(EMPTY_LOG_FORM);
  const [objForm, setObjForm] = useState(EMPTY_OBJ_FORM);
  const [editingObj, setEditingObj] = useState<IsoObjective | null>(null);
  const [showObjForm, setShowObjForm] = useState(false);
  const [isaOpen, setIsaOpen] = useState(false);
  const [isaInput, setIsaInput] = useState("");
  const [isaMessages, setIsaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isaLoading, setIsaLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: objectives = [], isLoading } = useQuery<IsoObjective[]>({ queryKey: ["/api/iso-objectives"] });
  const { data: allActuals = [] } = useQuery<IsoKpiActual[]>({ queryKey: ["/api/iso-kpi-actuals"] });

  const createObjMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/iso-objectives", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] }); toast({ title: "KPI added" }); setShowObjForm(false); setObjForm(EMPTY_OBJ_FORM); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateObjMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/iso-objectives/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] }); toast({ title: "KPI updated" }); setShowObjForm(false); setEditingObj(null); setObjForm(EMPTY_OBJ_FORM); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteObjMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-objectives/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] }); toast({ title: "KPI deleted" }); },
  });

  const logMutation = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/iso-kpi-actuals", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-kpi-actuals"] }); toast({ title: "Measurement logged" }); setLogFor(null); setLogForm(EMPTY_LOG_FORM); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (obj: IsoObjective) => {
    setEditingObj(obj);
    setObjForm({ name: obj.name, processName: obj.processName ?? "", target: obj.target ?? "", unit: obj.unit ?? "", frequency: obj.frequency ?? "monthly", responsible: obj.responsible ?? "", status: obj.status, description: obj.description ?? "" });
    setShowObjForm(true);
  };

  const submitObj = () => {
    const payload = { ...objForm, isoProjectId };
    if (editingObj) updateObjMutation.mutate({ id: editingObj.id, data: payload });
    else createObjMutation.mutate(payload);
  };

  const filtered = filterStatus === "all" ? objectives : objectives.filter(o => o.status === filterStatus);

  const onTrack = objectives.filter(o => o.status === "on_track").length;
  const atRisk = objectives.filter(o => o.status === "at_risk").length;
  const offTrack = objectives.filter(o => o.status === "off_track").length;

  const sendIsaMessage = async () => {
    if (!isaInput.trim()) return;
    const userMsg = { role: "user" as const, content: isaInput.trim() };
    const newMsgs = [...isaMessages, userMsg];
    setIsaMessages(newMsgs);
    setIsaInput("");
    setIsaLoading(true);
    try {
      const kpiContext = objectives.map(o => `- ${o.name} (${o.processName ?? "?"}): target ${o.target} ${o.unit}, status ${o.status}`).join("\n");
      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          systemPrompt: `You are Isa, Lead ISO Auditor for ACSI ISO Manager. You specialize in ISO Clause 9.1 (Monitoring, Measurement, Analysis and Evaluation) and KPI management for QMS. Help users select meaningful KPIs, set targets, analyze trends, and interpret results against ISO requirements. Be specific and reference clause numbers where relevant.\n\nCurrent KPIs:\n${kpiContext || "None yet."}`,
        }),
      });
      const data = await resp.json();
      setIsaMessages([...newMsgs, { role: "assistant", content: data.content || "Sorry, I'm unavailable right now." }]);
    } catch {
      setIsaMessages([...newMsgs, { role: "assistant", content: "Sorry, I'm unavailable right now." }]);
    } finally { setIsaLoading(false); }
  };

  const currentPeriod = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-accent" />
            Measurement &amp; Monitoring
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">ISO 9.1 — Monitor, measure, analyze and evaluate QMS performance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsaOpen(true)} data-testid="button-isa-measurement" className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
            <Bot className="w-4 h-4 mr-1" /> Ask Isa
          </Button>
          <Button size="sm" onClick={() => { setEditingObj(null); setObjForm(EMPTY_OBJ_FORM); setShowObjForm(true); }} data-testid="button-add-kpi" className="bg-accent hover:bg-accent/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add KPI
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{onTrack}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> On Track</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{atRisk}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> At Risk</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{offTrack}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MinusCircle className="w-3 h-3" /> Off Track</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-muted-foreground">Filter:</span>
        {[
          { val: "all", label: "All" },
          { val: "on_track", label: "On Track" },
          { val: "at_risk", label: "At Risk" },
          { val: "off_track", label: "Off Track" },
        ].map(s => (
          <button key={s.val} onClick={() => setFilterStatus(s.val)} data-testid={`filter-kpi-${s.val}`}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterStatus === s.val ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading KPIs…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No KPIs defined</p>
            <p className="text-xs mt-1">Add quality objectives with measurable targets (ISO 6.2). KPIs from Process Maps appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(obj => (
            <KpiCard
              key={obj.id}
              obj={obj}
              actuals={allActuals.filter(a => a.objectiveId === obj.id)}
              onLog={() => { setLogFor(obj); setLogForm({ ...EMPTY_LOG_FORM, period: currentPeriod() }); }}
              onEditObj={() => openEdit(obj)}
              onDeleteObj={() => deleteObjMutation.mutate(obj.id)}
            />
          ))}
        </div>
      )}

      {/* Log Measurement Dialog */}
      <Dialog open={!!logFor} onOpenChange={v => { if (!v) setLogFor(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Measurement — {logFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Period *</Label>
              <Input value={logForm.period} onChange={e => setLogForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. 2025-04, 2025-Q1" data-testid="input-log-period" />
              <p className="text-xs text-muted-foreground mt-1">Format: YYYY-MM (monthly) or YYYY-Q# (quarterly)</p>
            </div>
            <div>
              <Label>Actual Value * ({logFor?.unit})</Label>
              <Input type="number" value={logForm.actual} onChange={e => setLogForm(f => ({ ...f, actual: e.target.value }))} placeholder={`Target: ${logFor?.target}`} data-testid="input-log-actual" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes about this period" data-testid="input-log-notes" rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLogFor(null)}>Cancel</Button>
              <Button onClick={() => logMutation.mutate({ ...logForm, objectiveId: logFor?.id, userId: "" })} disabled={logMutation.isPending} data-testid="button-submit-log" className="bg-accent hover:bg-accent/90 text-white">
                Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit KPI Dialog */}
      <Dialog open={showObjForm} onOpenChange={v => { if (!v) { setShowObjForm(false); setEditingObj(null); setObjForm(EMPTY_OBJ_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingObj ? "Edit KPI" : "Add Quality Objective / KPI"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>KPI Name *</Label>
                <Input value={objForm.name} onChange={e => setObjForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Customer Satisfaction Score, Defect Rate" data-testid="input-kpi-name" />
              </div>
              <div>
                <Label>Process Area</Label>
                <Input value={objForm.processName} onChange={e => setObjForm(f => ({ ...f, processName: e.target.value }))} placeholder="e.g. Production" data-testid="input-kpi-process" />
              </div>
              <div>
                <Label>Responsible Person</Label>
                <Input value={objForm.responsible} onChange={e => setObjForm(f => ({ ...f, responsible: e.target.value }))} placeholder="e.g. Quality Manager" data-testid="input-kpi-responsible" />
              </div>
              <div>
                <Label>Target Value *</Label>
                <Input value={objForm.target} onChange={e => setObjForm(f => ({ ...f, target: e.target.value }))} placeholder="e.g. 95" data-testid="input-kpi-target" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={objForm.unit} onChange={e => setObjForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. %, ppm, days, score" data-testid="input-kpi-unit" />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={objForm.frequency} onValueChange={v => setObjForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger data-testid="select-kpi-frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["daily", "weekly", "monthly", "quarterly", "annual"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={objForm.status} onValueChange={v => setObjForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-kpi-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="off_track">Off Track</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={objForm.description} onChange={e => setObjForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description of this KPI" data-testid="input-kpi-description" rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowObjForm(false); setEditingObj(null); setObjForm(EMPTY_OBJ_FORM); }}>Cancel</Button>
              <Button onClick={submitObj} disabled={createObjMutation.isPending || updateObjMutation.isPending} data-testid="button-submit-kpi" className="bg-accent hover:bg-accent/90 text-white">
                {editingObj ? "Update KPI" : "Add KPI"}
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
              <Bot className="w-5 h-5" /> Isa — Measurement Advisor
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isaMessages.length === 0 && (
              <div className="text-sm text-muted-foreground bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                <p className="font-medium text-violet-800 dark:text-violet-300 mb-2">Ask me about ISO 9.1 Measurement:</p>
                <ul className="space-y-1 text-xs">
                  <li>• What KPIs should we track for our QMS?</li>
                  <li>• How do I select meaningful quality objectives?</li>
                  <li>• What does ISO 9001 clause 9.1 require?</li>
                  <li>• How often should I measure [KPI name]?</li>
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
            <Input value={isaInput} onChange={e => setIsaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendIsaMessage()} placeholder="Ask Isa about KPIs and measurement…" data-testid="input-isa-measurement" className="flex-1" />
            <Button onClick={sendIsaMessage} disabled={isaLoading} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
