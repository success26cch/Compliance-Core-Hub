import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Pencil, Trash2, Bot, Globe, Building2, CalendarRange, Search } from "lucide-react";
import type { IsoCommunication, InsertIsoCommunication } from "@shared/schema";

const MEDIUMS = ["email", "meeting", "notice", "bulletin", "training", "report", "poster", "intranet", "other"];

const directionStyle = (dir: string) => dir === "external"
  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";

const EMPTY_FORM: Partial<IsoCommunication> & { date: string } = {
  direction: "internal",
  topic: "",
  audience: "",
  medium: "email",
  summary: "",
  clauseRef: "7.4",
  date: new Date().toISOString().slice(0, 10),
};

const AUDIENCE_PRESETS = [
  "All Employees", "Management Team", "Department Heads", "Quality Team",
  "Production Staff", "Sales Team", "Customers", "Suppliers", "Regulatory Body",
];

export default function CommunicationModule({ isoProjectId }: { isoProjectId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IsoCommunication | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [filterDir, setFilterDir] = useState("all");
  const [filterMedium, setFilterMedium] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterAudience, setFilterAudience] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isaOpen, setIsaOpen] = useState(false);
  const [isaInput, setIsaInput] = useState("");
  const [isaMessages, setIsaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isaLoading, setIsaLoading] = useState(false);

  const commsQKey = ["/api/iso-communications", isoProjectId];
  const { data: comms = [], isLoading } = useQuery<IsoCommunication[]>({
    queryKey: commsQKey,
    queryFn: () => fetch(`/api/iso-communications${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<InsertIsoCommunication, 'userId'>) => apiRequest("POST", "/api/iso-communications", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: commsQKey }); toast({ title: "Communication logged" }); resetForm(); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<InsertIsoCommunication, 'userId'>> }) => apiRequest("PATCH", `/api/iso-communications/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: commsQKey }); toast({ title: "Updated" }); resetForm(); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-communications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: commsQKey }); toast({ title: "Deleted" }); },
  });

  const resetForm = () => { setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) }); setEditing(null); setShowForm(false); };

  const openEdit = (c: IsoCommunication) => {
    setEditing(c);
    setForm({
      direction: c.direction, topic: c.topic, audience: c.audience ?? "",
      medium: c.medium ?? "email", summary: c.summary ?? "",
      clauseRef: c.clauseRef ?? "7.4",
      date: c.date ? new Date(c.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const submit = () => {
    const payload = { ...form, isoProjectId };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const activeFilterCount = [
    filterDir !== "all",
    filterMedium !== "all",
    !!filterDateStart,
    !!filterDateEnd,
    !!filterAudience,
  ].filter(Boolean).length;

  const filtered = comms
    .filter(c => filterDir === "all" || c.direction === filterDir)
    .filter(c => filterMedium === "all" || c.medium === filterMedium)
    .filter(c => {
      if (!filterDateStart) return true;
      const d = c.date ? new Date(c.date).toISOString().slice(0, 10) : "";
      return d >= filterDateStart;
    })
    .filter(c => {
      if (!filterDateEnd) return true;
      const d = c.date ? new Date(c.date).toISOString().slice(0, 10) : "";
      return d <= filterDateEnd;
    })
    .filter(c => {
      if (!filterAudience) return true;
      return (c.audience ?? "").toLowerCase().includes(filterAudience.toLowerCase());
    });

  const internal = comms.filter(c => c.direction === "internal").length;
  const external = comms.filter(c => c.direction === "external").length;

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
          systemPrompt: `You are Isa, Lead ISO Auditor for ACSI ISO Manager. You specialize in ISO 7.4 Communication requirements. Help users understand what must be communicated internally and externally regarding the QMS, who is responsible, how communications should be documented, and what auditors look for during surveillance audits. Reference ISO 9001:2015 Clause 7.4 and related clauses. Be practical and specific.`,
        }),
      });
      const data = await resp.json();
      setIsaMessages([...newMsgs, { role: "assistant", content: data.content || "Sorry, I'm unavailable right now." }]);
    } catch {
      setIsaMessages([...newMsgs, { role: "assistant", content: "Sorry, I'm unavailable right now." }]);
    } finally { setIsaLoading(false); }
  };

  const mediumsInUse = [...new Set(comms.map(c => c.medium).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            Communication Log
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">ISO 7.4 — What, when, with whom, how to communicate about the QMS</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)} data-testid="button-toggle-filters"
            className={activeFilterCount > 0 ? "border-accent text-accent" : ""}>
            <Search className="w-4 h-4 mr-1" /> Filters {activeFilterCount > 0 && <span className="ml-1 bg-accent text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsaOpen(true)} data-testid="button-isa-comms" className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
            <Bot className="w-4 h-4 mr-1" /> Ask Isa
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} data-testid="button-add-comm" className="bg-accent hover:bg-accent/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> Log Communication
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{comms.length}</div><div className="text-xs text-muted-foreground mt-1">Total Logged</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-emerald-600">{internal}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Internal</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-600">{external}</div><div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Globe className="w-3 h-3" /> External</div></CardContent></Card>
      </div>

      {/* ISO 7.4 Reference */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 mb-1">ISO 7.4 Communication Requirements</p>
        <p className="text-xs text-muted-foreground">The organization must determine: <strong>what</strong> to communicate, <strong>when</strong> to communicate, <strong>with whom</strong> to communicate, <strong>how</strong> to communicate, and <strong>who</strong> communicates. Log all QMS-related communications here to maintain an audit-ready record.</p>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Direction */}
              <div>
                <Label className="text-xs mb-1 block">Direction</Label>
                <div className="flex gap-1 flex-wrap">
                  {["all", "internal", "external"].map(d => (
                    <button key={d} onClick={() => setFilterDir(d)} data-testid={`filter-comm-dir-${d}`}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterDir === d ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
                      {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medium */}
              <div>
                <Label className="text-xs mb-1 block">Medium</Label>
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setFilterMedium("all")} data-testid="filter-comm-medium-all"
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterMedium === "all" ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
                    All
                  </button>
                  {mediumsInUse.map(m => (
                    <button key={m} onClick={() => setFilterMedium(m!)} data-testid={`filter-comm-medium-${m}`}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterMedium === m ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience search */}
              <div>
                <Label className="text-xs mb-1 block">Audience / Recipient</Label>
                <Input
                  value={filterAudience}
                  onChange={e => setFilterAudience(e.target.value)}
                  placeholder="Search by audience…"
                  data-testid="filter-comm-audience"
                  className="h-8 text-xs"
                />
              </div>

              {/* Date range */}
              <div className="sm:col-span-2 lg:col-span-2">
                <Label className="text-xs mb-1 block flex items-center gap-1"><CalendarRange className="w-3 h-3" /> Date Range</Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} data-testid="filter-comm-date-start" className="h-8 text-xs flex-1" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} data-testid="filter-comm-date-end" className="h-8 text-xs flex-1" />
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-muted-foreground">Showing {filtered.length} of {comms.length} records</span>
                <button onClick={() => { setFilterDir("all"); setFilterMedium("all"); setFilterDateStart(""); setFilterDateEnd(""); setFilterAudience(""); }}
                  className="text-xs text-accent hover:underline" data-testid="button-clear-filters">
                  Clear all filters
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Communications List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{comms.length === 0 ? "No communications logged" : "No communications match your filters"}</p>
            <p className="text-xs mt-1">Use this log to document all QMS-related communications — meeting minutes, quality notices, customer communications, regulatory submissions, and more.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {c.direction === "external" ? <Globe className="w-4 h-4 text-blue-500" /> : <Building2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{c.topic}</span>
                      <Badge className={`text-xs ${directionStyle(c.direction)}`}>{c.direction}</Badge>
                      {c.medium && <Badge variant="outline" className="text-xs">{c.medium}</Badge>}
                      {c.clauseRef && <span className="text-xs text-accent font-mono font-bold">{c.clauseRef}</span>}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{new Date(c.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      {c.audience && <span>To: <span className="font-medium">{c.audience}</span></span>}
                    </div>
                    {c.summary && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{c.summary}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(c)} data-testid={`button-edit-comm-${c.id}`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(c.id)} data-testid={`button-delete-comm-${c.id}`} className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Communication" : "Log Communication"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Topic / Subject *</Label>
                <Input value={form.topic ?? ""} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Quality Policy Distribution, Customer Complaint Response" data-testid="input-comm-topic" />
              </div>
              <div>
                <Label>Direction *</Label>
                <Select value={form.direction ?? "internal"} onValueChange={v => setForm(f => ({ ...f, direction: v }))}>
                  <SelectTrigger data-testid="select-comm-direction"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} data-testid="input-comm-date" />
              </div>
              <div>
                <Label>Audience / Recipient</Label>
                <Input value={form.audience ?? ""} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} placeholder="e.g. All Employees, Customer XYZ" data-testid="input-comm-audience" list="audience-presets" />
                <datalist id="audience-presets">
                  {AUDIENCE_PRESETS.map(a => <option key={a} value={a} />)}
                </datalist>
              </div>
              <div>
                <Label>Medium / Channel</Label>
                <Select value={form.medium ?? "email"} onValueChange={v => setForm(f => ({ ...f, medium: v }))}>
                  <SelectTrigger data-testid="select-comm-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEDIUMS.map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>ISO Clause Reference</Label>
                <Input value={form.clauseRef ?? ""} onChange={e => setForm(f => ({ ...f, clauseRef: e.target.value }))} placeholder="e.g. 7.4, 5.2, 8.4.1" data-testid="input-comm-clause" />
              </div>
              <div className="col-span-2">
                <Label>Summary / Notes</Label>
                <Textarea value={form.summary ?? ""} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Briefly describe what was communicated, key messages, decisions, or outcomes" data-testid="input-comm-summary" rows={3} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending || !form.topic?.trim()} data-testid="button-submit-comm" className="bg-accent hover:bg-accent/90 text-white">
                {editing ? "Update" : "Log"}
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
              <Bot className="w-5 h-5" /> Isa — Communication Advisor (ISO 7.4)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isaMessages.length === 0 && (
              <div className="text-sm text-muted-foreground bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                <p className="font-medium text-violet-800 dark:text-violet-300 mb-2">Ask me about ISO 7.4 Communication:</p>
                <ul className="space-y-1 text-xs">
                  <li>• What must be communicated internally about the QMS?</li>
                  <li>• What external communications need to be documented?</li>
                  <li>• How do auditors evaluate communication compliance?</li>
                  <li>• What should a quality communication plan include?</li>
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
            <Input value={isaInput} onChange={e => setIsaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendIsaMessage()} placeholder="Ask Isa about ISO 7.4 Communication…" data-testid="input-isa-comms" className="flex-1" />
            <Button onClick={sendIsaMessage} disabled={isaLoading} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
