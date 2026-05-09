import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, Bell,
  BellRing, CheckCircle2, AlertTriangle, Clock, Leaf, ShieldCheck,
  HardHat, GraduationCap, Siren, Circle, X, Pencil, Trash2,
  Mail, FileText, LayoutList, CalendarRange, Loader2, Link2,
  AlertCircle, CheckCheck, BookOpen,
} from "lucide-react";
import type { ComplianceCalendarEvent } from "@shared/schema";

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, {
  label: string; sublabel: string; icon: any;
  badge: string; dot: string; border: string; bg: string; textColor: string;
}> = {
  env_legal: {
    label: "Env. Legal Obligations",
    sublabel: "ISO 14001 §6.1.3 / §9.1.2",
    icon: Leaf,
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
  ohs_legal: {
    label: "OH&S Legal Obligations",
    sublabel: "ISO 45001 §6.1.3 / §9.1.2",
    icon: ShieldCheck,
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
    border: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  osha: {
    label: "OSHA Deliverables",
    sublabel: "Federal / State OSHA",
    icon: HardHat,
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    dot: "bg-orange-500",
    border: "border-l-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    textColor: "text-orange-700 dark:text-orange-400",
  },
  training: {
    label: "Legal Compliance Training",
    sublabel: "Env & Safety Training",
    icon: GraduationCap,
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    dot: "bg-purple-500",
    border: "border-l-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-700 dark:text-purple-400",
  },
  drill: {
    label: "Drills & Exercises",
    sublabel: "Emergency Response",
    icon: Siren,
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-500",
    border: "border-l-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-700 dark:text-red-400",
  },
  general: {
    label: "General",
    sublabel: "Multi-standard",
    icon: Circle,
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
    border: "border-l-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    textColor: "text-slate-600 dark:text-slate-400",
  },
};

const EVENT_TYPES = [
  { value: "deadline",      label: "Compliance Deadline" },
  { value: "permit_renewal",label: "Permit Renewal" },
  { value: "report_due",    label: "Regulatory Report Due" },
  { value: "monitoring",    label: "Monitoring / Sampling" },
  { value: "inspection",    label: "Inspection" },
  { value: "review",        label: "Plan / Program Review" },
  { value: "training",      label: "Training" },
  { value: "drill",         label: "Drill / Exercise" },
  { value: "audit",         label: "Audit" },
];

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  upcoming:  { label: "Upcoming",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",  icon: Clock },
  overdue:   { label: "Overdue",   badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",     icon: AlertTriangle },
  completed: { label: "Completed", badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", icon: X },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function daysUntil(dateStr: string): number {
  const due  = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function urgencyLabel(days: number): string {
  if (days < 0)   return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days <= 7)  return `${days}d left`;
  if (days <= 30) return `${days}d`;
  return `${days}d`;
}

function urgencyColor(days: number, status: string): string {
  if (status === "completed") return "text-green-600";
  if (status === "cancelled") return "text-slate-400";
  if (days < 0)  return "text-red-600 dark:text-red-400 font-semibold";
  if (days <= 7) return "text-red-500 dark:text-red-400 font-semibold";
  if (days <= 30) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "text-slate-500";
}

// ─── Add/Edit Event Form ──────────────────────────────────────────────────────
const eventSchema = z.object({
  title: z.string().min(2, "Title required"),
  standardCategory: z.string().min(1),
  eventType: z.string().min(1),
  dueDate: z.string().min(1, "Due date required"),
  responsiblePerson: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("upcoming"),
});
type EventFormData = z.infer<typeof eventSchema>;

function EventDialog({
  open, onClose, isoProjectId, event,
}: { open: boolean; onClose: () => void; isoProjectId?: number; event?: ComplianceCalendarEvent }) {
  const { toast } = useToast();
  const qClient = useQueryClient();
  const isEdit = !!event;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title ?? "",
      standardCategory: event?.standardCategory ?? "env_legal",
      eventType: event?.eventType ?? "deadline",
      dueDate: event?.dueDate ?? "",
      responsiblePerson: event?.responsiblePerson ?? "",
      description: event?.description ?? "",
      notes: event?.notes ?? "",
      status: event?.status ?? "upcoming",
    },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/compliance-calendar", data),
    onSuccess: () => { qClient.invalidateQueries({ queryKey: ["/api/compliance-calendar"] }); toast({ title: "Event added" }); onClose(); },
    onError: () => toast({ title: "Error saving event", variant: "destructive" }),
  });
  const editMut = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/compliance-calendar/${event?.id}`, data),
    onSuccess: () => { qClient.invalidateQueries({ queryKey: ["/api/compliance-calendar"] }); toast({ title: "Event updated" }); onClose(); },
    onError: () => toast({ title: "Error updating event", variant: "destructive" }),
  });

  function onSubmit(data: EventFormData) {
    const payload = { ...data, isoProjectId };
    if (isEdit) editMut.mutate(payload); else createMut.mutate(payload);
  }

  const isPending = createMut.isPending || editMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Compliance Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel>
                <FormControl><Input placeholder="e.g. Annual SWPPP Review" {...field} data-testid="input-event-title" /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="standardCategory" render={({ field }) => (
                <FormItem><FormLabel>Standard / Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-standard-category"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="env_legal">Env. Legal (ISO 14001 §6.1.3)</SelectItem>
                      <SelectItem value="ohs_legal">OH&S Legal (ISO 45001 §6.1.3)</SelectItem>
                      <SelectItem value="osha">OSHA Deliverables</SelectItem>
                      <SelectItem value="training">Legal Compliance Training</SelectItem>
                      <SelectItem value="drill">Drill / Exercise</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="eventType" render={({ field }) => (
                <FormItem><FormLabel>Event Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-event-type"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem><FormLabel>Due Date</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-due-date" /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="responsiblePerson" render={({ field }) => (
              <FormItem><FormLabel>Responsible Person</FormLabel>
                <FormControl><Input placeholder="Name — Role" {...field} data-testid="input-responsible" /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Requirement Description</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Brief description of the legal requirement…" {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Action Required / Notes</FormLabel>
                <FormControl><Textarea rows={2} placeholder="Action steps, notes…" {...field} /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={isPending} className="flex-1" data-testid="button-save-event">
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Save Changes" : "Add to Calendar"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Event Detail Panel ───────────────────────────────────────────────────────
function EventDetailDialog({
  event, open, onClose, userEmail,
}: { event: ComplianceCalendarEvent; open: boolean; onClose: () => void; userEmail?: string }) {
  const { toast } = useToast();
  const qClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(userEmail ?? "");

  const cat   = CATEGORY_CONFIG[event.standardCategory] ?? CATEGORY_CONFIG.general;
  const CatIcon = cat.icon;
  const days  = daysUntil(event.dueDate);
  const sConf = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.upcoming;
  const SIcon = sConf.icon;

  const deleteMut = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/compliance-calendar/${event.id}`),
    onSuccess: () => { qClient.invalidateQueries({ queryKey: ["/api/compliance-calendar"] }); toast({ title: "Event deleted" }); onClose(); },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const completeMut = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/compliance-calendar/${event.id}`, {
      status: "completed", completedAt: new Date().toISOString().split("T")[0],
    }),
    onSuccess: () => { qClient.invalidateQueries({ queryKey: ["/api/compliance-calendar"] }); toast({ title: "Marked complete ✓" }); onClose(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const notifyMut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/compliance-calendar/${event.id}/notify`, { email: notifyEmail }),
    onSuccess: () => toast({ title: "Reminder email sent ✓" }),
    onError: () => toast({ title: "Could not send email", variant: "destructive" }),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${cat.bg} shrink-0 mt-0.5`}>
                <CatIcon className={`w-5 h-5 ${cat.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base leading-snug">{event.title}</DialogTitle>
                <p className={`text-xs mt-0.5 ${cat.textColor}`}>{cat.label} — {cat.sublabel}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status / Due row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={sConf.badge}><SIcon className="w-3 h-3 mr-1" />{sConf.label}</Badge>
              <Badge className={cat.badge}>{EVENT_TYPES.find(e => e.value === event.eventType)?.label ?? event.eventType}</Badge>
              <span className={`text-sm ml-auto ${urgencyColor(days, event.status)}`}>
                {event.status === "completed" ? `Completed ${event.completedAt ?? ""}` : urgencyLabel(days)} — {event.dueDate}
              </span>
            </div>

            {event.responsiblePerson && (
              <div className="text-sm"><span className="text-muted-foreground">Responsible: </span>{event.responsiblePerson}</div>
            )}
            {event.description && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-1">Requirement</p>
                <p>{event.description}</p>
              </div>
            )}
            {event.notes && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm">
                <p className="font-medium text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Action Required</p>
                <p className="text-amber-900 dark:text-amber-200">{event.notes}</p>
              </div>
            )}
            {event.sourceType === "obligation" && event.sourceId && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded px-3 py-2">
                <Link2 className="w-3.5 h-3.5 shrink-0" />
                Linked to Compliance Obligations Register (obligation #{event.sourceId})
              </div>
            )}
            {event.notificationSentAt && (
              <p className="text-xs text-muted-foreground">Last reminder sent: {event.notificationSentAt}</p>
            )}

            {/* Reminder email */}
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Send Reminder Email</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="recipient@company.com"
                  value={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.value)}
                  className="flex-1 text-sm h-8"
                  data-testid="input-notify-email"
                />
                <Button
                  size="sm" variant="outline"
                  onClick={() => notifyMut.mutate()}
                  disabled={notifyMut.isPending || !notifyEmail}
                  data-testid="button-send-reminder"
                >
                  {notifyMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {event.status !== "completed" && (
                <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => completeMut.mutate()} disabled={completeMut.isPending}
                  data-testid="button-mark-complete">
                  <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark Complete
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} data-testid="button-edit-event">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 ml-auto"
                onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
                data-testid="button-delete-event">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {editOpen && <EventDialog open={editOpen} onClose={() => { setEditOpen(false); onClose(); }} event={event} />}
    </>
  );
}

// ─── Month Calendar Grid ──────────────────────────────────────────────────────
function MonthCalendar({
  year, month, events, onDayClick, onEventClick,
}: {
  year: number; month: number;
  events: ComplianceCalendarEvent[];
  onDayClick: (date: string) => void;
  onEventClick: (event: ComplianceCalendarEvent) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const eventsByDay = useMemo(() => {
    const map: Record<string, ComplianceCalendarEvent[]> = {};
    for (const e of events) {
      const d = e.dueDate.slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`
        ? e.dueDate : null;
      if (!d) continue;
      (map[d] ??= []).push(e);
    }
    return map;
  }, [events, year, month]);

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-muted/20 min-h-[80px]" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDay[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const hasOverdue = dayEvents.some(e => e.status === "overdue" || (e.status !== "completed" && daysUntil(e.dueDate) < 0));

          return (
            <div
              key={i}
              className={`bg-background min-h-[80px] p-1 cursor-pointer transition-colors hover:bg-muted/40 ${isToday ? "ring-2 ring-inset ring-primary" : ""}`}
              onClick={() => onDayClick(dateStr)}
              data-testid={`cal-day-${dateStr}`}
            >
              <div className={`text-xs font-medium mb-0.5 w-5 h-5 flex items-center justify-center rounded-full
                ${isToday ? "bg-primary text-primary-foreground" : hasOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => {
                  const cat = CATEGORY_CONFIG[ev.standardCategory] ?? CATEGORY_CONFIG.general;
                  const isOver = ev.status !== "completed" && daysUntil(ev.dueDate) < 0;
                  return (
                    <div
                      key={ev.id}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer
                        ${isOver ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : `${cat.bg} ${cat.textColor}`}`}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      title={ev.title}
                      data-testid={`cal-event-${ev.id}`}
                    >
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────
function ListView({
  events, onEventClick,
}: { events: ComplianceCalendarEvent[]; onEventClick: (e: ComplianceCalendarEvent) => void }) {
  const grouped = useMemo(() => {
    const map: Record<string, ComplianceCalendarEvent[]> = {};
    for (const e of events) {
      const key = e.dueDate.slice(0, 7);
      (map[key] ??= []).push(e);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  if (grouped.length === 0) {
    return <div className="text-center text-muted-foreground py-12 text-sm">No events. Use "Sync from Register" or "Add Event" to get started.</div>;
  }

  return (
    <div className="space-y-5">
      {grouped.map(([monthKey, evs]) => {
        const [yr, mo] = monthKey.split("-");
        return (
          <div key={monthKey}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {MONTHS[parseInt(mo) - 1]} {yr}
            </h3>
            <div className="space-y-2">
              {evs.map(ev => {
                const cat   = CATEGORY_CONFIG[ev.standardCategory] ?? CATEGORY_CONFIG.general;
                const CatIcon = cat.icon;
                const days  = daysUntil(ev.dueDate);
                const sConf = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.upcoming;
                const SIcon = sConf.icon;
                const eventTypeLabel = EVENT_TYPES.find(t => t.value === ev.eventType)?.label ?? ev.eventType;

                return (
                  <div
                    key={ev.id}
                    className={`flex items-start gap-3 border-l-4 ${cat.border} rounded-r-lg p-3 cursor-pointer hover:shadow-sm transition-shadow bg-card border border-l-4 ${cat.border}`}
                    onClick={() => onEventClick(ev)}
                    data-testid={`list-event-${ev.id}`}
                  >
                    <div className={`p-1.5 rounded ${cat.bg} shrink-0 mt-0.5`}>
                      <CatIcon className={`w-4 h-4 ${cat.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${ev.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{ev.title}</p>
                        <span className={`text-xs shrink-0 ${urgencyColor(days, ev.status)}`}>
                          {ev.status === "completed" ? "Done" : urgencyLabel(days)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`text-[11px] font-medium ${cat.textColor}`}>{cat.label}</span>
                        <span className="text-muted-foreground text-[11px]">·</span>
                        <span className="text-[11px] text-muted-foreground">{eventTypeLabel}</span>
                        {ev.responsiblePerson && (
                          <><span className="text-muted-foreground text-[11px]">·</span>
                          <span className="text-[11px] text-muted-foreground">{ev.responsiblePerson}</span></>
                        )}
                        <Badge className={`${sConf.badge} text-[10px] px-1.5 py-0 h-4 ml-auto`}>
                          <SIcon className="w-2.5 h-2.5 mr-0.5" />{sConf.label}
                        </Badge>
                      </div>
                      {ev.notes && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 line-clamp-1">⚡ {ev.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export default function ComplianceCalendarModule({ isoProjectId }: { isoProjectId?: number }) {
  const { toast } = useToast();
  const qClient = useQueryClient();

  const [view, setView] = useState<"calendar" | "list">("list");
  const [filter, setFilter] = useState("all");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ComplianceCalendarEvent | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const { data: events = [], isLoading } = useQuery<ComplianceCalendarEvent[]>({
    queryKey: ["/api/compliance-calendar"],
    queryFn: () => fetch("/api/compliance-calendar", { credentials: "include" }).then(r => r.json()),
  });

  const syncMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/compliance-calendar/sync-obligations", { isoProjectId }),
    onSuccess: (data: any) => {
      qClient.invalidateQueries({ queryKey: ["/api/compliance-calendar"] });
      toast({ title: `Synced from Obligations Register`, description: `${data.created} new event${data.created !== 1 ? "s" : ""} added${data.skipped ? `, ${data.skipped} already on calendar` : ""}.` });
    },
    onError: () => toast({ title: "Sync failed", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter(e => e.standardCategory === filter);
  }, [events, filter]);

  const approaching = useMemo(() =>
    events.filter(e => e.status !== "completed" && e.status !== "cancelled" && daysUntil(e.dueDate) <= 30)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [events]
  );
  const overdue = approaching.filter(e => daysUntil(e.dueDate) < 0);

  const calEvents = view === "calendar"
    ? filtered.filter(e => {
        const d = new Date(e.dueDate + "T00:00:00");
        return d.getFullYear() === calYear && d.getMonth() === calMonth;
      })
    : filtered;

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    for (const e of events) counts[e.standardCategory] = (counts[e.standardCategory] ?? 0) + 1;
    return counts;
  }, [events]);

  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }

  const FILTER_TABS = [
    { key: "all",      label: "All" },
    { key: "env_legal", label: "Env Legal §6.1.3" },
    { key: "ohs_legal", label: "OH&S Legal §6.1.3" },
    { key: "osha",      label: "OSHA" },
    { key: "training",  label: "Training" },
    { key: "drill",     label: "Drills" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Integrated Compliance Calendar</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Unified deadline register for <span className="font-medium text-emerald-700 dark:text-emerald-400">Environmental Legal Obligations (ISO 14001 §6.1.3/§9.1.2)</span>,{" "}
            <span className="font-medium text-blue-700 dark:text-blue-400">OH&S Legal Obligations (ISO 45001 §6.1.3/§9.1.2)</span>, OSHA deliverables, training, and drills.
            Events sync directly from your Compliance Obligations Register.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline" size="sm"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            data-testid="button-sync-obligations"
            className="text-xs"
          >
            {syncMut.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            Sync from Register
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-add-event" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Event
          </Button>
        </div>
      </div>

      {/* Approaching Deadlines Alert */}
      {!alertDismissed && approaching.length > 0 && (
        <div className={`rounded-lg border p-3 ${overdue.length > 0 ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <BellRing className={`w-4 h-4 shrink-0 ${overdue.length > 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
              <div>
                <p className={`text-sm font-semibold ${overdue.length > 0 ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                  {overdue.length > 0
                    ? `${overdue.length} overdue · ${approaching.length - overdue.length} due within 30 days`
                    : `${approaching.length} deadline${approaching.length !== 1 ? "s" : ""} approaching within 30 days`
                  }
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {approaching.slice(0, 5).map(ev => {
                    const days = daysUntil(ev.dueDate);
                    const cat = CATEGORY_CONFIG[ev.standardCategory] ?? CATEGORY_CONFIG.general;
                    return (
                      <button
                        key={ev.id}
                        className={`flex items-center gap-1 text-[11px] rounded px-2 py-0.5 cursor-pointer border
                          ${days < 0 ? "bg-red-100 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300"
                                     : "bg-white dark:bg-background border-border text-foreground"}`}
                        onClick={() => setSelectedEvent(ev)}
                        data-testid={`alert-event-${ev.id}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${days < 0 ? "bg-red-500" : cat.dot}`} />
                        <span className="truncate max-w-[120px]">{ev.title}</span>
                        <span className={`font-semibold ${days < 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {urgencyLabel(days)}
                        </span>
                      </button>
                    );
                  })}
                  {approaching.length > 5 && (
                    <span className="text-[11px] text-muted-foreground self-center">+{approaching.length - 5} more</span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => setAlertDismissed(true)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Category legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, conf]) => {
          const Icon = conf.icon;
          return (
            <div key={key} className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${conf.badge}`}>
              <Icon className="w-3 h-3" />
              <span className="font-medium">{conf.label}</span>
              <span className="opacity-60">({catCounts[key] ?? 0})</span>
            </div>
          );
        })}
      </div>

      {/* Filter tabs + View toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => setFilter(tab.key)}
              data-testid={`filter-tab-${tab.key}`}
            >
              {tab.label}
              {catCounts[tab.key] !== undefined && tab.key !== "all" && (
                <span className="ml-1 opacity-70">({catCounts[tab.key] ?? 0})</span>
              )}
              {tab.key === "all" && <span className="ml-1 opacity-70">({catCounts.all})</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border rounded-md p-0.5 self-start sm:self-auto">
          <button
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${view === "list" ? "bg-muted font-medium" : "hover:bg-muted/50 text-muted-foreground"}`}
            onClick={() => setView("list")}
            data-testid="view-list"
          >
            <LayoutList className="w-3.5 h-3.5" /> List
          </button>
          <button
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${view === "calendar" ? "bg-muted font-medium" : "hover:bg-muted/50 text-muted-foreground"}`}
            onClick={() => setView("calendar")}
            data-testid="view-calendar"
          >
            <CalendarRange className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      {/* Calendar nav */}
      {view === "calendar" && (
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7" data-testid="cal-prev">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">{MONTHS[calMonth]} {calYear}</span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7" data-testid="cal-next">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground ml-2">{calEvents.length} event{calEvents.length !== 1 ? "s" : ""} this month</span>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => { setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth()); }}>
            Today
          </Button>
        </div>
      )}

      {/* Main content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading calendar…
        </div>
      ) : view === "calendar" ? (
        <MonthCalendar
          year={calYear}
          month={calMonth}
          events={filtered}
          onDayClick={_date => {}}
          onEventClick={ev => setSelectedEvent(ev)}
        />
      ) : (
        <ListView events={filtered} onEventClick={ev => setSelectedEvent(ev)} />
      )}

      {/* Stats row */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { label: "Total Events",    value: events.length,                                        color: "text-foreground" },
            { label: "Upcoming",        value: events.filter(e => e.status === "upcoming").length,    color: "text-blue-600" },
            { label: "Overdue",         value: events.filter(e => e.status === "overdue" || (e.status !== "completed" && daysUntil(e.dueDate) < 0)).length, color: "text-red-600" },
            { label: "Completed",       value: events.filter(e => e.status === "completed").length,   color: "text-green-600" },
          ].map(stat => (
            <Card key={stat.label} className="p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {addOpen && (
        <EventDialog open={addOpen} onClose={() => setAddOpen(false)} isoProjectId={isoProjectId} />
      )}
      {selectedEvent && (
        <EventDetailDialog
          open={!!selectedEvent}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          userEmail="evillarreal@acsi-quality.com"
        />
      )}
    </div>
  );
}
