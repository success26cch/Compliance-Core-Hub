import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle, XCircle,
  ClipboardList, BarChart2, ShieldAlert, Activity, Search, Filter, CalendarDays,
  ChevronDown, ChevronUp, Loader2, ArrowUpDown, User
} from "lucide-react";
import type { IsoActionItem } from "@shared/schema";

const SOURCE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  management_review: { label: "Management Review", icon: BarChart2,    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700/40" },
  risk_assessment:   { label: "Risk Assessment",   icon: ShieldAlert,  color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700/40" },
  kpi:               { label: "KPI / Metrics",     icon: Activity,     color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700/40" },
  audit:             { label: "Audit Finding",     icon: ClipboardList,color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-700/40" },
  corrective_action: { label: "Corrective Action", icon: AlertTriangle, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700/40" },
  other:             { label: "Other",             icon: ClipboardList, color: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 border-gray-200 dark:border-gray-700/40" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200",    dot: "bg-red-500" },
  high:     { label: "High",     color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200", dot: "bg-orange-500" },
  medium:   { label: "Medium",   color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200", dot: "bg-yellow-500" },
  low:      { label: "Low",      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200",  dot: "bg-green-500" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  open:        { label: "Open",        icon: Clock,          color: "text-yellow-600 dark:text-yellow-400" },
  in_progress: { label: "In Progress", icon: Loader2,        color: "text-blue-600 dark:text-blue-400" },
  completed:   { label: "Completed",   icon: CheckCircle2,   color: "text-green-600 dark:text-green-400" },
  cancelled:   { label: "Cancelled",   icon: XCircle,        color: "text-muted-foreground" },
};

const EMPTY_FORM = {
  title: "", description: "", sourceType: "management_review", sourceRef: "",
  assignedTo: "", dueDate: "", priority: "medium", status: "open", notes: "",
};

function isOverdue(item: IsoActionItem): boolean {
  return !!item.dueDate && item.status !== 'completed' && item.status !== 'cancelled' && new Date(item.dueDate) < new Date();
}

function dueDateLabel(item: IsoActionItem): { text: string; urgent: boolean } | null {
  if (!item.dueDate) return null;
  const due = new Date(item.dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, urgent: true };
  if (diffDays === 0) return { text: "Due today", urgent: true };
  if (diffDays <= 7) return { text: `Due in ${diffDays}d`, urgent: true };
  return { text: due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), urgent: false };
}

export default function IsoActionItemsModule({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const qKey = ["/api/iso-action-items", isoProjectId];

  const { data: items = [], isLoading } = useQuery<IsoActionItem[]>({
    queryKey: qKey,
    queryFn: () => apiRequest("GET", isoProjectId ? `/api/iso-action-items?isoProjectId=${isoProjectId}` : "/api/iso-action-items"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iso-action-items", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast({ title: "Action item created" }); setDialog(null); setForm({ ...EMPTY_FORM }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/iso-action-items/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast({ title: "Action item updated" }); setDialog(null); setForm({ ...EMPTY_FORM }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-action-items/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); toast({ title: "Action item deleted" }); },
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/iso-action-items/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  const [dialog, setDialog] = useState<{ mode: 'add' | 'edit'; item?: IsoActionItem } | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [showCompleted, setShowCompleted] = useState(false);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setDialog({ mode: 'add' }); };
  const openEdit = (item: IsoActionItem) => {
    setForm({
      title: item.title,
      description: item.description || "",
      sourceType: item.sourceType,
      sourceRef: item.sourceRef || "",
      assignedTo: item.assignedTo || "",
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
      priority: item.priority,
      status: item.status,
      notes: item.notes || "",
    });
    setDialog({ mode: 'edit', item });
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const payload: any = {
      ...form,
      isoProjectId,
      dueDate: form.dueDate || null,
    };
    if (dialog?.mode === 'edit' && dialog.item) {
      updateMutation.mutate({ id: dialog.item.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = useMemo(() => {
    let list = items.filter(item => {
      if (!showCompleted && (item.status === 'completed' || item.status === 'cancelled')) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterSource !== 'all' && item.sourceType !== filterSource) return false;
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q) || (item.assignedTo || "").toLowerCase().includes(q) || (item.sourceRef || "").toLowerCase().includes(q);
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'priority') return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 9) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 9);
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });
    return list;
  }, [items, search, filterStatus, filterSource, filterPriority, sortBy, showCompleted]);

  const stats = useMemo(() => {
    const open = items.filter(i => i.status === 'open').length;
    const inProgress = items.filter(i => i.status === 'in_progress').length;
    const overdue = items.filter(isOverdue).length;
    const completed = items.filter(i => i.status === 'completed').length;
    return { open, inProgress, overdue, completed, total: items.length };
  }, [items]);

  const bySource = useMemo(() => {
    const counts: Record<string, number> = {};
    items.filter(i => i.status !== 'completed' && i.status !== 'cancelled').forEach(i => { counts[i.sourceType] = (counts[i.sourceType] || 0) + 1; });
    return counts;
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            Action Item Tracker
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Cross-source tracker — Management Review · Risk Assessments · KPIs · Audits</p>
        </div>
        <Button onClick={openAdd} size="sm" className="bg-accent hover:bg-accent/90 text-white gap-1.5" data-testid="button-add-action-item">
          <Plus className="w-4 h-4" /> New Action Item
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open",        val: stats.open,       color: "text-yellow-600 dark:text-yellow-400",  icon: Clock },
          { label: "In Progress", val: stats.inProgress, color: "text-blue-600 dark:text-blue-400",      icon: Loader2 },
          { label: "Overdue",     val: stats.overdue,    color: "text-red-600 dark:text-red-400",        icon: AlertTriangle },
          { label: "Completed",   val: stats.completed,  color: "text-green-600 dark:text-green-400",    icon: CheckCircle2 },
        ].map(s => (
          <Card key={s.label} className={s.label === 'Overdue' && stats.overdue > 0 ? 'border-red-200 dark:border-red-800/40' : ''}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Source breakdown chips */}
      {Object.entries(bySource).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(bySource).map(([src, cnt]) => {
            const cfg = SOURCE_CONFIG[src] || SOURCE_CONFIG.other;
            return (
              <button
                key={src}
                onClick={() => setFilterSource(filterSource === src ? 'all' : src)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${cfg.color} ${filterSource === src ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                data-testid={`chip-source-${src}`}
              >
                <cfg.icon className="w-3 h-3" />
                {cfg.label} <span className="font-bold">({cnt})</span>
              </button>
            );
          })}
          {filterSource !== 'all' && (
            <button onClick={() => setFilterSource('all')} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">× Clear filter</button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, owners…" className="pl-8 h-8 text-sm" data-testid="input-search-action-items" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-[130px] text-xs" data-testid="select-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-[120px] text-xs" data-testid="select-filter-priority"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="h-8 w-[120px] text-xs" data-testid="select-sort-action-items">
            <ArrowUpDown className="w-3 h-3 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="createdAt">Newest</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setShowCompleted(v => !v)}
          className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${showCompleted ? 'bg-muted border-border text-foreground' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}
          data-testid="toggle-show-completed"
        >
          {showCompleted ? <ChevronUp className="w-3 h-3 inline mr-1" /> : <ChevronDown className="w-3 h-3 inline mr-1" />}
          {showCompleted ? 'Hide' : 'Show'} closed
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">{items.length === 0 ? "No action items yet" : "No items match your filters"}</p>
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground max-w-sm">Create action items from Management Review outputs, Risk Assessment responses, missed KPI targets, or audit findings — all tracked here in one place.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const srcCfg = SOURCE_CONFIG[item.sourceType] || SOURCE_CONFIG.other;
            const priCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
            const overdue = isOverdue(item);
            const due = dueDateLabel(item);

            return (
              <div
                key={item.id}
                data-testid={`card-action-item-${item.id}`}
                className={`rounded-xl border bg-card px-4 py-3 flex gap-3 transition-colors ${overdue ? 'border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5' : 'border-border/60 hover:border-border'} ${item.status === 'completed' || item.status === 'cancelled' ? 'opacity-60' : ''}`}
              >
                {/* Priority dot */}
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${priCfg.dot}`} title={`Priority: ${priCfg.label}`} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className={`font-semibold text-sm leading-snug flex-1 ${item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {/* Source badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${srcCfg.color}`}>
                        <srcCfg.icon className="w-2.5 h-2.5" />{srcCfg.label}
                      </span>
                      {/* Priority badge */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priCfg.color}`}>{priCfg.label}</span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {item.sourceRef && (
                      <span className="text-xs text-muted-foreground italic">"{item.sourceRef}"</span>
                    )}
                    {item.assignedTo && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />{item.assignedTo}
                      </span>
                    )}
                    {due && (
                      <span className={`text-xs flex items-center gap-1 font-medium ${due.urgent ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        <CalendarDays className="w-3 h-3" />{due.text}
                      </span>
                    )}
                    <span className={`text-xs flex items-center gap-1 font-medium ${statusCfg.color}`}>
                      <statusCfg.icon className="w-3 h-3" />{statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 shrink-0">
                  {item.status === 'open' && (
                    <button
                      onClick={() => quickStatusMutation.mutate({ id: item.id, status: 'in_progress' })}
                      className="text-[10px] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1.5 py-1 rounded-md font-semibold transition-colors"
                      title="Mark In Progress"
                      data-testid={`button-progress-${item.id}`}
                    >▶</button>
                  )}
                  {item.status === 'in_progress' && (
                    <button
                      onClick={() => quickStatusMutation.mutate({ id: item.id, status: 'completed' })}
                      className="text-[10px] text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 px-1.5 py-1 rounded-md font-semibold transition-colors"
                      title="Mark Complete"
                      data-testid={`button-complete-${item.id}`}
                    >✓</button>
                  )}
                  <button onClick={() => openEdit(item)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors" data-testid={`button-edit-${item.id}`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("Delete this action item?")) deleteMutation.mutate(item.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" data-testid={`button-delete-${item.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={open => { if (!open) setDialog(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === 'edit' ? 'Edit Action Item' : 'New Action Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Describe the action required…" className="mt-1" data-testid="input-action-title" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source Type</Label>
                <Select value={form.sourceType} onValueChange={v => setForm(f => ({ ...f, sourceType: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-source-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="management_review">Management Review</SelectItem>
                    <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                    <SelectItem value="kpi">KPI / Metrics</SelectItem>
                    <SelectItem value="audit">Audit Finding</SelectItem>
                    <SelectItem value="corrective_action">Corrective Action</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source Reference</Label>
                <Input value={form.sourceRef} onChange={e => setForm(f => ({ ...f, sourceRef: e.target.value }))} placeholder="e.g. Mgmt Review Q1 2026" className="mt-1" data-testid="input-source-ref" />
              </div>
            </div>

            <div>
              <Label>Description / Details</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What specifically needs to be done?" className="mt-1 min-h-[80px]" data-testid="input-action-description" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assigned To</Label>
                <Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Name or role" className="mt-1" data-testid="input-assigned-to" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="mt-1" data-testid="input-due-date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Progress notes, blockers, context…" className="mt-1 min-h-[60px]" data-testid="input-action-notes" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialog(null)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.title.trim() || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-accent hover:bg-accent/90 text-white"
                data-testid="button-submit-action-item"
              >
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {dialog?.mode === 'edit' ? 'Save Changes' : 'Create Action Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
