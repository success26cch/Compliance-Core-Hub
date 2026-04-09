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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Trash2, Bot, ChevronRight, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import type { IsoManagementReview, IsoReviewActionItem, IsoObjective, IsoKpiActual } from "@shared/schema";

// ISO 9001:2015 Clause 9.3.2 Required Inputs
const ISO_AGENDA_ITEMS = [
  { id: "9.3.2a", clause: "9.3.2(a)", title: "Status of actions from previous management reviews" },
  { id: "9.3.2b", clause: "9.3.2(b)", title: "Changes in external and internal issues relevant to the QMS" },
  { id: "9.3.2c", clause: "9.3.2(c)", title: "Information on QMS performance and effectiveness — KPIs, objectives, NCs, audits" },
  { id: "9.3.2d", clause: "9.3.2(d)", title: "Adequacy of resources" },
  { id: "9.3.2e", clause: "9.3.2(e)", title: "Effectiveness of actions taken to address risks and opportunities" },
  { id: "9.3.2f", clause: "9.3.2(f)", title: "Opportunities for improvement" },
  { id: "9.3.3a", clause: "9.3.3(a)", title: "Opportunities for improvement (outputs) — improvement actions" },
  { id: "9.3.3b", clause: "9.3.3(b)", title: "Any need for changes to the QMS" },
  { id: "9.3.3c", clause: "9.3.3(c)", title: "Resource needs" },
];

type AgendaItem = { clause: string; title: string; covered: boolean; notes: string };

function agendaFromReview(review: IsoManagementReview): AgendaItem[] {
  const existing = (review.agendaItems as AgendaItem[] | null) ?? [];
  return ISO_AGENDA_ITEMS.map(item => {
    const found = existing.find(e => e.clause === item.clause);
    return { clause: item.clause, title: item.title, covered: found?.covered ?? false, notes: found?.notes ?? "" };
  });
}

function ReviewDetail({ review, onBack }: { review: IsoManagementReview; onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [agenda, setAgenda] = useState<AgendaItem[]>(agendaFromReview(review));
  const [actionForm, setActionForm] = useState({ description: "", owner: "", dueDate: "" });
  const [showActionForm, setShowActionForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: actions = [] } = useQuery<IsoReviewActionItem[]>({
    queryKey: ["/api/iso-management-reviews", review.id, "actions"],
    queryFn: () => fetch(`/api/iso-management-reviews/${review.id}/actions`).then(r => r.json()),
  });
  const { data: objectives = [] } = useQuery<IsoObjective[]>({ queryKey: ["/api/iso-objectives"] });
  const { data: allActuals = [] } = useQuery<IsoKpiActual[]>({ queryKey: ["/api/iso-kpi-actuals"] });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/iso-management-reviews/${review.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews"] }); toast({ title: "Review saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addActionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/iso-management-reviews/${review.id}/actions`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] }); toast({ title: "Action item added" }); setShowActionForm(false); setActionForm({ description: "", owner: "", dueDate: "" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateActionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/iso-review-action-items/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] }),
  });

  const deleteActionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-review-action-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews", review.id, "actions"] }),
  });

  const saveAgenda = () => {
    updateMutation.mutate({ agendaItems: agenda });
  };

  const toggleCovered = (clause: string) => {
    setAgenda(a => a.map(item => item.clause === clause ? { ...item, covered: !item.covered } : item));
  };

  const coveredCount = agenda.filter(a => a.covered).length;

  const getLatestActual = (objId: number) => {
    const sorted = allActuals.filter(a => a.objectiveId === objId).sort((a, b) => b.period.localeCompare(a.period));
    return sorted[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-foreground">{review.title}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(review.meetingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {review.attendees && ` · ${review.attendees}`}
          </p>
        </div>
        <Badge variant={review.status === "complete" ? "default" : "outline"} className="ml-auto">
          {review.status === "complete" ? "Complete" : "Draft"}
        </Badge>
        <Button size="sm" onClick={() => updateMutation.mutate({ status: review.status === "complete" ? "draft" : "complete" })} variant="outline">
          {review.status === "complete" ? "Reopen" : "Mark Complete"}
        </Button>
      </div>

      {/* KPI Snapshot */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">KPI Performance Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["KPI", "Process", "Target", "Latest Actual", "Period", "Status"].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {objectives.map(obj => {
                    const latest = getLatestActual(obj.id);
                    return (
                      <tr key={obj.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{obj.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{obj.processName ?? "—"}</td>
                        <td className="px-3 py-2">{obj.target} {obj.unit}</td>
                        <td className="px-3 py-2 font-medium">{latest ? `${latest.actual} ${obj.unit}` : "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{latest?.period ?? "—"}</td>
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

      {/* ISO 9.3.2 Agenda Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              ISO 9.3.2 Required Inputs Checklist
              <span className="ml-2 text-muted-foreground font-normal text-xs">{coveredCount}/{agenda.length} covered</span>
            </CardTitle>
            <Button size="sm" onClick={saveAgenda} disabled={updateMutation.isPending} variant="outline" data-testid="button-save-agenda">
              Save Agenda
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {agenda.map(item => (
            <div key={item.clause} className={`p-3 rounded-lg border transition-colors ${item.covered ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "bg-muted/30 border-border"}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.covered}
                  onCheckedChange={() => toggleCovered(item.clause)}
                  data-testid={`checkbox-agenda-${item.clause}`}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-accent font-bold">{item.clause}</span>
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    {item.covered && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                  </div>
                  {item.covered && (
                    <Textarea
                      value={item.notes}
                      onChange={e => setAgenda(a => a.map(i => i.clause === item.clause ? { ...i, notes: e.target.value } : i))}
                      placeholder="Notes for this agenda item…"
                      data-testid={`textarea-agenda-notes-${item.clause}`}
                      className="mt-2 text-xs"
                      rows={2}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
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
            <CardTitle className="text-sm font-semibold text-foreground">Action Items</CardTitle>
            <Button size="sm" onClick={() => setShowActionForm(true)} data-testid="button-add-action" className="bg-accent hover:bg-accent/90 text-white">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Action
            </Button>
          </div>
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
            <div key={action.id} className={`flex items-start gap-3 p-3 rounded-lg border ${action.status === "closed" ? "bg-green-50 dark:bg-green-900/10 border-green-200" : "border-border hover:bg-muted/20"}`}>
              <Checkbox
                checked={action.status === "closed"}
                onCheckedChange={checked => updateActionMutation.mutate({ id: action.id, data: { status: checked ? "closed" : "open", closedAt: checked ? new Date().toISOString() : null } })}
                data-testid={`checkbox-action-${action.id}`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${action.status === "closed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{action.description}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {action.owner && <span>Owner: <span className="font-medium">{action.owner}</span></span>}
                  {action.dueDate && <span>Due: <span className="font-medium">{new Date(action.dueDate).toLocaleDateString()}</span></span>}
                  <Badge variant="outline" className="text-xs">{action.status}</Badge>
                </div>
              </div>
              <button onClick={() => deleteActionMutation.mutate(action.id)} className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 shrink-0">
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

export default function ManagementReviewModule({ isoProjectId }: { isoProjectId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_REVIEW_FORM);
  const [selected, setSelected] = useState<IsoManagementReview | null>(null);
  const [isaOpen, setIsaOpen] = useState(false);
  const [isaInput, setIsaInput] = useState("");
  const [isaMessages, setIsaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isaLoading, setIsaLoading] = useState(false);

  const { data: reviews = [], isLoading } = useQuery<IsoManagementReview[]>({ queryKey: ["/api/iso-management-reviews"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iso-management-reviews", data),
    onSuccess: (newReview: any) => {
      qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews"] });
      toast({ title: "Review created" });
      setShowForm(false);
      setForm(EMPTY_REVIEW_FORM);
      setSelected(newReview);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-management-reviews/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-management-reviews"] }); toast({ title: "Review deleted" }); },
  });

  if (selected) {
    const latest = reviews.find(r => r.id === selected.id) ?? selected;
    return <ReviewDetail review={latest} onBack={() => setSelected(null)} />;
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
          systemPrompt: `You are Isa, Lead ISO Auditor for ACSI ISO Manager. You specialize in ISO 9001:2015 Clause 9.3 Management Review. Help organizations conduct effective management reviews that meet ISO requirements, including required inputs (9.3.2) and expected outputs (9.3.3). Provide practical, clause-referenced guidance.`,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            Management Review
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">ISO 9.3 — Top management reviews the QMS at planned intervals</p>
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
            <p className="text-xs mt-1">ISO 9001 Clause 9.3 requires top management to review the QMS at planned intervals. Start by creating your first review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => {
            const agendaItems = (r.agendaItems as AgendaItem[] | null) ?? [];
            const covered = agendaItems.filter(a => a.covered).length;
            const total = ISO_AGENDA_ITEMS.length;
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
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{new Date(r.meetingDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                        {r.attendees && <span>Attendees: {r.attendees}</span>}
                        <span>Agenda: {covered}/{total} items covered</span>
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
          <div className="space-y-4 py-2">
            <div>
              <Label>Review Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Q1 2025 Management Review" data-testid="input-review-title" />
            </div>
            <div>
              <Label>Meeting Date *</Label>
              <Input type="date" value={form.meetingDate} onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))} data-testid="input-review-date" />
            </div>
            <div>
              <Label>Attendees</Label>
              <Input value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="e.g. CEO, Quality Manager, Department Heads" data-testid="input-review-attendees" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({ ...form, isoProjectId })} disabled={createMutation.isPending || !form.meetingDate} data-testid="button-create-review" className="bg-accent hover:bg-accent/90 text-white">
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
              <Bot className="w-5 h-5" /> Isa — Management Review Advisor
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isaMessages.length === 0 && (
              <div className="text-sm text-muted-foreground bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                <p className="font-medium text-violet-800 dark:text-violet-300 mb-2">Ask me about ISO 9.3 Management Review:</p>
                <ul className="space-y-1 text-xs">
                  <li>• What inputs are required for a management review?</li>
                  <li>• How often should management reviews be held?</li>
                  <li>• What should the outputs of a management review include?</li>
                  <li>• How do I document findings to satisfy auditors?</li>
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
            <Input value={isaInput} onChange={e => setIsaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendIsaMessage()} placeholder="Ask Isa about management review…" data-testid="input-isa-review" className="flex-1" />
            <Button onClick={sendIsaMessage} disabled={isaLoading} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
