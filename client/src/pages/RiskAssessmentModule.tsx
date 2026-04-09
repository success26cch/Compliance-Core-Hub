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
import { Plus, Pencil, Trash2, ShieldAlert, Bot, ChevronDown, ChevronUp } from "lucide-react";
import type { IsoRisk } from "@shared/schema";

const riskColor = (score: number) => {
  if (score <= 4) return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300", label: "Low" };
  if (score <= 9) return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-300", label: "Moderate" };
  return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300", label: "High" };
};

const HEATMAP_LABELS = ["", "Rare (1)", "Unlikely (2)", "Possible (3)", "Likely (4)", "Almost Certain (5)"];
const SEV_LABELS = ["Almost Certain (5)", "Likely (4)", "Possible (3)", "Unlikely (2)", "Rare (1)"];

function RiskHeatmap({ risks }: { risks: IsoRisk[] }) {
  const cellCount = (l: number, s: number) => risks.filter(r => r.likelihood === l && r.severity === s).length;
  return (
    <div className="overflow-auto">
      <div className="text-xs text-muted-foreground mb-2 font-medium">Risk Heatmap (Likelihood × Severity)</div>
      <div className="inline-grid" style={{ gridTemplateColumns: "auto repeat(5, 56px)" }}>
        <div className="text-xs font-medium text-muted-foreground p-1 text-right col-start-1">Severity ↑ / Likelihood →</div>
        {[1,2,3,4,5].map(l => (
          <div key={l} className="text-xs text-center text-muted-foreground p-1 font-medium">{l}</div>
        ))}
        {[5,4,3,2,1].map(s => (
          <>
            <div key={`label-${s}`} className="text-xs text-muted-foreground p-1 text-right self-center">{s}</div>
            {[1,2,3,4,5].map(l => {
              const score = l * s;
              const { bg, text } = riskColor(score);
              const cnt = cellCount(l, s);
              return (
                <div key={`${l}-${s}`} className={`${bg} ${text} w-14 h-10 flex flex-col items-center justify-center text-xs rounded m-0.5 border border-white/20`}>
                  <span className="font-bold">{score}</span>
                  {cnt > 0 && <span className="text-[10px] opacity-80">({cnt})</span>}
                </div>
              );
            })}
          </>
        ))}
      </div>
      <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Low (1–4)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 inline-block" /> Moderate (5–9)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> High (10–25)</span>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  processArea: "", description: "", likelihood: 1, severity: 1,
  controls: "", residualLikelihood: undefined as number | undefined,
  residualSeverity: undefined as number | undefined,
  linkedProcess: "", status: "open" as string,
};

export default function RiskAssessmentModule({ isoProjectId }: { isoProjectId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IsoRisk | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isaOpen, setIsaOpen] = useState(false);
  const [isaInput, setIsaInput] = useState("");
  const [isaMessages, setIsaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isaLoading, setIsaLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showHeatmap, setShowHeatmap] = useState(false);

  const { data: risks = [], isLoading } = useQuery<IsoRisk[]>({ queryKey: ["/api/iso-risks"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iso-risks", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-risks"] }); toast({ title: "Risk added" }); setShowForm(false); resetForm(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/iso-risks/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-risks"] }); toast({ title: "Risk updated" }); setEditing(null); setShowForm(false); resetForm(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-risks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-risks"] }); toast({ title: "Risk deleted" }); },
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); };

  const openEdit = (r: IsoRisk) => {
    setEditing(r);
    setForm({
      processArea: r.processArea, description: r.description,
      likelihood: r.likelihood, severity: r.severity,
      controls: r.controls ?? "", status: r.status,
      residualLikelihood: r.residualLikelihood ?? undefined,
      residualSeverity: r.residualSeverity ?? undefined,
      linkedProcess: r.linkedProcess ?? "",
    });
    setShowForm(true);
  };

  const submit = () => {
    const payload = { ...form, isoProjectId };
    if (editing) { updateMutation.mutate({ id: editing.id, data: payload }); }
    else { createMutation.mutate(payload); }
  };

  const filtered = filterStatus === "all" ? risks : risks.filter(r => r.status === filterStatus);

  const stats = {
    total: risks.length,
    high: risks.filter(r => r.riskScore > 9).length,
    moderate: risks.filter(r => r.riskScore >= 5 && r.riskScore <= 9).length,
    low: risks.filter(r => r.riskScore < 5).length,
    open: risks.filter(r => r.status === "open").length,
  };

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
          systemPrompt: `You are Isa, Lead ISO Auditor and risk management expert for ACSI ISO Manager. You specialize in ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018 risk-based thinking. Help users identify risks and opportunities, evaluate likelihood and severity (1–5 scale), suggest controls, and determine residual risk. Reference applicable ISO clauses (e.g., 6.1 Actions to address risks and opportunities). Be practical, specific, and professional. Never hallucinate requirements not in the standard.`,
        }),
      });
      const data = await resp.json();
      setIsaMessages([...newMsgs, { role: "assistant", content: data.content || "Sorry, I'm unavailable right now." }]);
    } catch {
      setIsaMessages([...newMsgs, { role: "assistant", content: "Sorry, I'm unavailable right now. Please try again." }]);
    } finally {
      setIsaLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accent" />
            Risk &amp; Opportunity Register
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">ISO 6.1 — Actions to address risks and opportunities</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowHeatmap(v => !v)} data-testid="button-toggle-heatmap">
            {showHeatmap ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            Heatmap
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsaOpen(true)} data-testid="button-isa-risk" className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
            <Bot className="w-4 h-4 mr-1" /> Ask Isa
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} data-testid="button-add-risk" className="bg-accent hover:bg-accent/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Risk
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Risks", val: stats.total, color: "text-foreground" },
          { label: "High Risk", val: stats.high, color: "text-red-600" },
          { label: "Moderate", val: stats.moderate, color: "text-yellow-600" },
          { label: "Low Risk", val: stats.low, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      {showHeatmap && (
        <Card>
          <CardContent className="p-4 overflow-auto">
            <RiskHeatmap risks={risks} />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-muted-foreground">Filter:</span>
        {["all", "open", "mitigated", "accepted"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} data-testid={`filter-risk-${s}`}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterStatus === s ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Risk Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading risks…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No risks recorded</p>
              <p className="text-xs mt-1">Use the ISO 6.1 standard to identify risks and opportunities in your QMS processes.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["Process Area", "Risk Description", "L", "S", "Score", "Controls", "Residual", "Status", ""].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(r => {
                    const { bg, text, label } = riskColor(r.riskScore);
                    const res = r.residualScore;
                    const resStyle = res ? riskColor(res) : null;
                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{r.processArea}</td>
                        <td className="px-3 py-2 max-w-xs">
                          <p className="line-clamp-2">{r.description}</p>
                          {r.linkedProcess && <span className="text-xs text-muted-foreground">({r.linkedProcess})</span>}
                        </td>
                        <td className="px-3 py-2 text-center">{r.likelihood}</td>
                        <td className="px-3 py-2 text-center">{r.severity}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${bg} ${text}`}>
                            {r.riskScore} <span className="font-normal opacity-70">({label})</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 max-w-[160px]">
                          <p className="text-xs line-clamp-2 text-muted-foreground">{r.controls || "—"}</p>
                        </td>
                        <td className="px-3 py-2">
                          {res && resStyle ? (
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${resStyle.bg} ${resStyle.text}`}>{res}</span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={r.status === "mitigated" ? "default" : r.status === "accepted" ? "secondary" : "outline"} className="text-xs">
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(r)} data-testid={`button-edit-risk-${r.id}`} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(r.id)} data-testid={`button-delete-risk-${r.id}`} className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Risk" : "Add Risk / Opportunity"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Process Area *</Label>
                <Input value={form.processArea} onChange={e => setForm(f => ({ ...f, processArea: e.target.value }))} placeholder="e.g. Production, Shipping, Purchasing" data-testid="input-risk-process-area" />
              </div>
              <div className="col-span-2">
                <Label>Risk / Opportunity Description *</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the risk or opportunity in detail" data-testid="input-risk-description" rows={3} />
              </div>
              <div>
                <Label>Likelihood (1–5)</Label>
                <Select value={String(form.likelihood)} onValueChange={v => setForm(f => ({ ...f, likelihood: parseInt(v) }))}>
                  <SelectTrigger data-testid="select-likelihood"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {["Rare","Unlikely","Possible","Likely","Almost Certain"][n-1]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity (1–5)</Label>
                <Select value={String(form.severity)} onValueChange={v => setForm(f => ({ ...f, severity: parseInt(v) }))}>
                  <SelectTrigger data-testid="select-severity"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {["Negligible","Minor","Moderate","Major","Critical"][n-1]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Risk Score:</span>
                {(() => { const score = form.likelihood * form.severity; const { bg, text, label } = riskColor(score); return <span className={`px-3 py-1 rounded font-bold text-sm ${bg} ${text}`}>{score} ({label})</span>; })()}
              </div>
              <div className="col-span-2">
                <Label>Controls / Mitigation Actions</Label>
                <Textarea value={form.controls} onChange={e => setForm(f => ({ ...f, controls: e.target.value }))} placeholder="Describe existing or planned controls" data-testid="input-risk-controls" rows={2} />
              </div>
              <div>
                <Label>Residual Likelihood</Label>
                <Select value={form.residualLikelihood ? String(form.residualLikelihood) : "none"} onValueChange={v => setForm(f => ({ ...f, residualLikelihood: v === "none" ? undefined : parseInt(v) }))}>
                  <SelectTrigger data-testid="select-residual-likelihood"><SelectValue placeholder="After controls" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Residual Severity</Label>
                <Select value={form.residualSeverity ? String(form.residualSeverity) : "none"} onValueChange={v => setForm(f => ({ ...f, residualSeverity: v === "none" ? undefined : parseInt(v) }))}>
                  <SelectTrigger data-testid="select-residual-severity"><SelectValue placeholder="After controls" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Linked Process</Label>
                <Input value={form.linkedProcess} onChange={e => setForm(f => ({ ...f, linkedProcess: e.target.value }))} placeholder="Optional process link" data-testid="input-risk-linked-process" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-risk-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
              <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-risk" className="bg-accent hover:bg-accent/90 text-white">
                {editing ? "Update" : "Add Risk"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Isa AI Panel */}
      <Dialog open={isaOpen} onOpenChange={setIsaOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <Bot className="w-5 h-5" /> Isa — ISO Risk Advisor
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isaMessages.length === 0 && (
              <div className="text-sm text-muted-foreground bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                <p className="font-medium text-violet-800 dark:text-violet-300 mb-2">Ask me about risk management (ISO 6.1):</p>
                <ul className="space-y-1 text-xs">
                  <li>• How do I score likelihood and severity?</li>
                  <li>• What controls should I apply to a high-risk process?</li>
                  <li>• How does risk-based thinking work in ISO 9001?</li>
                  <li>• Help me identify risks for our [process name]</li>
                </ul>
              </div>
            )}
            {isaMessages.map((m, i) => (
              <div key={i} className={`text-sm rounded-lg p-3 ${m.role === "user" ? "bg-muted ml-8" : "bg-violet-50 dark:bg-violet-900/20 mr-8 text-foreground"}`}>
                <div className="font-medium text-xs mb-1 text-muted-foreground">{m.role === "user" ? "You" : "Isa"}</div>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {isaLoading && <div className="text-xs text-violet-600 animate-pulse">Isa is thinking…</div>}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input value={isaInput} onChange={e => setIsaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendIsaMessage()} placeholder="Ask Isa about risk management…" data-testid="input-isa-risk" className="flex-1" />
            <Button onClick={sendIsaMessage} disabled={isaLoading} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
