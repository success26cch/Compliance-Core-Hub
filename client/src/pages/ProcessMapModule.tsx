import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Edit2, Save, X,
  Plus, Trash2, Target, AlertTriangle, FileText, Users, Zap,
  BookOpen, Activity, MapPin, CheckCircle2, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { IsoProject, IsoObjective } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

// ─── Extended Process type with all Turtle Diagram fields ─────────────────────
export interface ProcessEntry {
  name: string;
  owner: string;
  kpi: string;
  inputs: string;
  outputs: string;
  clauses: string[];
  executors?: string;
  resources?: string;
  keyActivities?: string;
  startingPoint?: string;
  endPoint?: string;
  risksAndOpportunities?: string;
  documentedInfo?: string;
  csrReq?: string;
  site?: "PLANT" | "REMOTE_SITE" | "CORPORATE";
  row?: string;
}

// ─── Row definitions per standard ─────────────────────────────────────────────
const ISO_ROWS = [
  { key: "management", label: "Management Processes", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "planning", label: "Planning & Support", color: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { key: "operational", label: "Operational (COP)", color: "bg-accent/5 border-accent/20 dark:bg-accent/10", badge: "bg-accent/10 text-accent" },
  { key: "supporting", label: "Support Processes", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { key: "context", label: "Context & Interested Parties", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
];

const IATF_ROWS = [
  { key: "COP", label: "Customer-Oriented Processes (COP)", color: "bg-accent/5 border-accent/20", badge: "bg-accent/10 text-accent" },
  { key: "SOP", label: "Support-Oriented Processes (SOP)", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "MOP", label: "Management-Oriented Processes (MOP)", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
];

const IATF_SITES = [
  { key: "PLANT", label: "Plant" },
  { key: "REMOTE_SITE", label: "Remote Site" },
  { key: "CORPORATE", label: "Corporate" },
];

function guessRow(name: string, standard: string): string {
  const n = name.toLowerCase();
  if (standard.includes("IATF")) {
    if (n.includes("customer") || n.includes("sales") || n.includes("order") || n.includes("production") || n.includes("manufactur") || n.includes("ship") || n.includes("deliver") || n.includes("design")) return "COP";
    if (n.includes("management review") || n.includes("corrective") || n.includes("internal audit") || n.includes("strategy") || n.includes("objective")) return "MOP";
    return "SOP";
  }
  if (n.includes("management review") || n.includes("strategy") || n.includes("leadership") || n.includes("objective")) return "management";
  if (n.includes("customer") || n.includes("sales") || n.includes("production") || n.includes("manufactur") || n.includes("design") || n.includes("ship") || n.includes("deliver") || n.includes("order")) return "operational";
  if (n.includes("mainten") || n.includes("train") || n.includes("purchas") || n.includes("document") || n.includes("hr") || n.includes("it ") || n.includes("information")) return "supporting";
  if (n.includes("corrective") || n.includes("internal audit") || n.includes("risk") || n.includes("measurement") || n.includes("monitor")) return "planning";
  return "supporting";
}

// ─── Process Box Component ─────────────────────────────────────────────────────
function ProcessBox({ process, onClick, standard }: { process: ProcessEntry; onClick: () => void; standard: string }) {
  const rows = standard.includes("IATF") ? IATF_ROWS : ISO_ROWS;
  const rowKey = process.row || guessRow(process.name, standard);
  const rowDef = rows.find(r => r.key === rowKey);
  return (
    <button
      onClick={onClick}
      data-testid={`process-box-${process.name.replace(/\s+/g, "-").toLowerCase()}`}
      className="group relative bg-white dark:bg-card border-2 border-border/40 hover:border-accent/60 rounded-xl p-3 text-left transition-all hover:shadow-md min-h-[80px] w-full"
    >
      <div className="font-bold text-primary text-xs leading-tight mb-1 group-hover:text-accent transition-colors line-clamp-2">{process.name}</div>
      {process.owner && (
        <div className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
          <Users className="w-2.5 h-2.5" />{process.owner}
        </div>
      )}
      {process.clauses.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {process.clauses.slice(0, 2).map(c => (
            <span key={c} className="text-[9px] bg-accent/10 text-accent px-1 py-0.5 rounded font-mono">{c.split("—")[0].trim()}</span>
          ))}
          {process.clauses.length > 2 && <span className="text-[9px] text-muted-foreground">+{process.clauses.length - 2}</span>}
        </div>
      )}
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-3 h-3 text-accent" />
      </div>
    </button>
  );
}

// ─── Interaction Map ───────────────────────────────────────────────────────────
function ProcessInteractionMap({ project, onSelectProcess }: { project: IsoProject; onSelectProcess: (p: ProcessEntry) => void }) {
  const processes = (project.processes || []) as ProcessEntry[];
  const isIATF = project.standard?.includes("IATF");
  const rows = isIATF ? IATF_ROWS : ISO_ROWS;

  if (processes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center">
        <div className="max-w-sm space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-bold text-primary">No Processes Defined</h3>
          <p className="text-sm text-muted-foreground">Complete the ISO Manager setup wizard (Phase 2) to define your process architecture. Each process will appear here as an interactive box.</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex-1 overflow-auto">
      {/* ─── ISO Process Interaction Map Header ─── */}
      <div className="border-b border-border/60 bg-white dark:bg-card px-6 py-3 flex items-center gap-4">
        {/* Logo placeholder */}
        <div className="w-14 h-14 border-2 border-dashed border-border/60 rounded-lg flex items-center justify-center shrink-0 bg-muted/30">
          <span className="text-[9px] text-muted-foreground/60 font-bold text-center leading-tight">ORG<br/>LOGO</span>
        </div>
        <div className="flex-1 text-center">
          <h2 className="text-base font-black text-primary uppercase tracking-wide">Process Interaction Map</h2>
          <p className="text-xs text-muted-foreground">{project.orgName}</p>
        </div>
        <div className="text-right text-[10px] text-muted-foreground space-y-0.5 shrink-0">
          <div><span className="font-bold text-primary">Standard:</span> {project.standard}</div>
          <div><span className="font-bold text-primary">Rev:</span> 1.0</div>
          <div><span className="font-bold text-primary">Date:</span> {today}</div>
        </div>
      </div>

      {/* ─── Map Body: Customer Requirements → Processes → Customer Satisfaction ─── */}
      <div className="flex items-stretch min-h-[400px]">
        {/* Left: Customer Requirements */}
        <div className="w-20 shrink-0 flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 border-r border-blue-200 dark:border-blue-800/40">
          <p className="text-[9px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            Customer Requirements &amp; Interested Party Expectations →
          </p>
        </div>

        <div className="flex-1 p-4 space-y-3">
      {isIATF ? (
        <div className="space-y-3">
          {rows.map(row => {
            const rowProcs = processes.filter(p => (p.row || guessRow(p.name, project.standard!)) === row.key);
            const sites = IATF_SITES;
            return (
              <div key={row.key} className={`border-2 rounded-xl overflow-hidden ${row.color}`}>
                <div className={`px-4 py-2 flex items-center gap-2`}>
                  <Badge className={`text-[10px] font-bold px-2 py-0.5 ${row.badge}`}>{row.key}</Badge>
                  <span className="text-sm font-bold text-primary">{row.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{rowProcs.length} process{rowProcs.length !== 1 ? "es" : ""}</span>
                </div>
                <div className="grid grid-cols-3 gap-0 border-t border-border/30">
                  {sites.map(site => {
                    const siteProcs = rowProcs.filter(p => (p.site || "PLANT") === site.key);
                    return (
                      <div key={site.key} className="border-r last:border-r-0 border-border/30 p-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">{site.label}</p>
                        <div className="space-y-1.5">
                          {siteProcs.map(p => (
                            <ProcessBox key={p.name} process={p} onClick={() => onSelectProcess(p)} standard={project.standard!} />
                          ))}
                          {siteProcs.length === 0 && (
                            <div className="border-2 border-dashed border-border/30 rounded-lg p-3 text-center">
                              <p className="text-[10px] text-muted-foreground/40">No processes</p>
                            </div>
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
      ) : (
        <div className="space-y-3">
          {rows.map(row => {
            const rowProcs = processes.filter(p => (p.row || guessRow(p.name, project.standard!)) === row.key);
            return (
              <div key={row.key} className={`border-2 rounded-xl overflow-hidden ${row.color}`}>
                <div className="px-4 py-2 flex items-center gap-2">
                  <Badge className={`text-[10px] font-bold px-2 py-0.5 ${row.badge}`}>{row.key}</Badge>
                  <span className="text-sm font-bold text-primary">{row.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{rowProcs.length} process{rowProcs.length !== 1 ? "es" : ""}</span>
                </div>
                <div className="p-3 pt-0">
                  {rowProcs.length === 0 ? (
                    <div className="border-2 border-dashed border-border/30 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground/50">No processes assigned to this row</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {rowProcs.map(p => (
                        <ProcessBox key={p.name} process={p} onClick={() => onSelectProcess(p)} standard={project.standard!} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>

        {/* Right: Customer Satisfaction */}
        <div className="w-20 shrink-0 flex items-center justify-center bg-green-50 dark:bg-green-950/20 border-l border-green-200 dark:border-green-800/40">
          <p className="text-[9px] font-black text-green-700 dark:text-green-300 uppercase tracking-widest" style={{ writingMode: "vertical-rl" }}>
            → Customer Satisfaction &amp; Interested Party Fulfillment
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Turtle Diagram Field ──────────────────────────────────────────────────────
function TurtleField({ label, icon: Icon, value, placeholder, onChange, multiline = false, color }: {
  label: string; icon: React.ComponentType<{ className?: string }>; value: string; placeholder: string;
  onChange: (v: string) => void; multiline?: boolean; color: string;
}) {
  return (
    <div className={`rounded-xl border-2 p-3 ${color}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      {multiline ? (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-xs min-h-[60px] resize-none bg-white/60 dark:bg-black/20 border-border/40"
        />
      ) : (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-xs bg-white/60 dark:bg-black/20 border-border/40"
        />
      )}
    </div>
  );
}

// ─── KPI / Objective Row within Turtle ────────────────────────────────────────
function ObjectiveRow({ obj, onDelete, onChange }: {
  obj: IsoObjective;
  onDelete: () => void;
  onChange: (field: keyof IsoObjective, val: string) => void;
}) {
  const statusColors: Record<string, string> = {
    on_track: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    at_risk: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    off_track: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  };
  return (
    <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg p-2 border border-border/30">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-xs text-primary truncate">{obj.name}</div>
        <div className="text-[10px] text-muted-foreground">Target: {obj.target} {obj.unit}</div>
      </div>
      <Select value={obj.status} onValueChange={v => onChange("status", v)}>
        <SelectTrigger className="h-6 text-[10px] w-24 border-0 bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="on_track">On Track</SelectItem>
          <SelectItem value="at_risk">At Risk</SelectItem>
          <SelectItem value="off_track">Off Track</SelectItem>
        </SelectContent>
      </Select>
      <button onClick={onDelete} className="text-muted-foreground hover:text-red-500 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Turtle Diagram ────────────────────────────────────────────────────────────
function TurtleDiagram({ process, project, onBack, onSave }: {
  process: ProcessEntry;
  project: IsoProject;
  onBack: () => void;
  onSave: (updated: ProcessEntry) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isIATF = project.standard?.includes("IATF");

  const [local, setLocal] = useState<ProcessEntry>({ ...process });
  const [saving, setSaving] = useState(false);
  const [newKpiName, setNewKpiName] = useState("");
  const [newKpiTarget, setNewKpiTarget] = useState("");
  const [newKpiUnit, setNewKpiUnit] = useState("");
  const [addingKpi, setAddingKpi] = useState(false);

  const { data: objectives = [] } = useQuery<IsoObjective[]>({
    queryKey: ["/api/iso-objectives", { processName: process.name }],
    queryFn: async () => {
      const res = await fetch(`/api/iso-objectives?processName=${encodeURIComponent(process.name)}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateObjMut = useMutation({
    mutationFn: async ({ id, field, val }: { id: number; field: string; val: string }) =>
      apiRequest("PATCH", `/api/iso-objectives/${id}`, { [field]: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] }),
  });

  const deleteObjMut = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-objectives/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] }),
  });

  const addObjMut = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/iso-objectives/upsert", {
      processName: process.name,
      name: newKpiName,
      target: newKpiTarget,
      unit: newKpiUnit,
      responsible: local.owner,
      isoProjectId: project.id,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] });
      setNewKpiName(""); setNewKpiTarget(""); setNewKpiUnit(""); setAddingKpi(false);
    },
  });

  const patchProjectMut = useMutation({
    mutationFn: async (updatedProcesses: ProcessEntry[]) => {
      const res = await fetch("/api/iso-projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processes: updatedProcesses }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-projects"] }),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const all = (project.processes || []) as ProcessEntry[];
      const updated = all.map(p => p.name === process.name ? local : p);
      await patchProjectMut.mutateAsync(updated);
      if (local.kpi?.trim() && objectives.length === 0) {
        const kpiName = local.kpi.trim();
        await fetch("/api/iso-objectives/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ processName: process.name, name: kpiName, target: "", unit: "", responsible: local.owner, isoProjectId: project.id }),
        });
        qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] });
      }
      onSave(local);
      toast({ title: "Turtle diagram saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof ProcessEntry) => (val: string) => setLocal(prev => ({ ...prev, [field]: val }));

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-card border-b border-border/60 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-black text-primary text-sm">{process.name}</h2>
          <p className="text-[10px] text-muted-foreground">Turtle Diagram · {project.standard}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {process.clauses.slice(0, 3).map(c => (
            <Badge key={c} className="text-[10px] bg-accent/10 text-accent border-accent/20 font-mono">{c.split("—")[0].trim()}</Badge>
          ))}
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-7 text-xs" data-testid="button-save-turtle">
            <Save className="w-3 h-3" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Top Row: Resources | Objectives */}
        <div className="grid grid-cols-2 gap-3">
          <TurtleField
            label="Resources" icon={Zap} placeholder="Machines, tools, equipment, technology…"
            value={local.resources || ""} onChange={set("resources")}
            multiline color="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800/40 dark:text-blue-100"
          />
          {/* Objectives panel */}
          <div className="bg-amber-50 border-2 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-300">Quality Objectives / KPIs</span>
              <button onClick={() => setAddingKpi(true)} className="ml-auto text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {objectives.map(obj => (
                <ObjectiveRow
                  key={obj.id}
                  obj={obj}
                  onDelete={() => deleteObjMut.mutate(obj.id)}
                  onChange={(field, val) => updateObjMut.mutate({ id: obj.id, field, val })}
                />
              ))}
              {objectives.length === 0 && !addingKpi && (
                <p className="text-[10px] text-muted-foreground text-center py-2">No KPIs yet — click + to add</p>
              )}
              {addingKpi && (
                <div className="bg-white dark:bg-card rounded-lg p-2 border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                  <Input value={newKpiName} onChange={e => setNewKpiName(e.target.value)} placeholder="KPI name (e.g. On-Time Delivery)" className="h-6 text-xs" />
                  <div className="flex gap-1.5">
                    <Input value={newKpiTarget} onChange={e => setNewKpiTarget(e.target.value)} placeholder="Target (e.g. 95)" className="h-6 text-xs flex-1" />
                    <Input value={newKpiUnit} onChange={e => setNewKpiUnit(e.target.value)} placeholder="Unit (e.g. %)" className="h-6 text-xs w-20" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => addObjMut.mutate()} disabled={!newKpiName || addObjMut.isPending} className="h-6 text-[10px] bg-amber-600 hover:bg-amber-700 text-white flex-1">
                      {addObjMut.isPending ? "Adding…" : "Add KPI"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAddingKpi(false)} className="h-6 text-[10px]">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Row: Inputs | Key Activities | Outputs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <TurtleField
              label="Inputs" icon={ArrowRight} placeholder="What enters this process…"
              value={local.inputs || ""} onChange={set("inputs")}
              multiline color="bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-100"
            />
            <TurtleField
              label="Starting Point / Trigger" icon={MapPin} placeholder="What triggers this process to begin…"
              value={local.startingPoint || ""} onChange={set("startingPoint")}
              color="bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/40 dark:text-emerald-100"
            />
          </div>

          {/* Center: Key Activities */}
          <div className="bg-primary/5 border-2 border-primary/20 dark:bg-primary/10 dark:border-primary/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-xs font-bold uppercase tracking-wide text-primary/80">Key Activities</span>
            </div>
            <Textarea
              value={local.keyActivities || ""}
              onChange={e => set("keyActivities")(e.target.value)}
              placeholder="Core transformation steps in this process…"
              className="text-xs min-h-[80px] resize-none bg-white/60 dark:bg-black/20 border-border/40 mb-2"
            />
            <div className="border-t border-border/30 pt-2 space-y-1.5">
              <div>
                <Label className="text-[10px] text-muted-foreground font-semibold">Process Owner</Label>
                <Input value={local.owner} onChange={e => set("owner")(e.target.value)} className="h-7 text-xs mt-0.5 bg-white/60 dark:bg-black/20 border-border/40" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground font-semibold">Executors / Who Performs</Label>
                <Input value={local.executors || ""} onChange={e => set("executors")(e.target.value)} placeholder="Roles who execute this process" className="h-7 text-xs mt-0.5 bg-white/60 dark:bg-black/20 border-border/40" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <TurtleField
              label="Outputs" icon={ArrowLeft} placeholder="What this process produces…"
              value={local.outputs || ""} onChange={set("outputs")}
              multiline color="bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-100"
            />
            <TurtleField
              label="End Point / Completion" icon={CheckCircle2} placeholder="How you know this process is complete…"
              value={local.endPoint || ""} onChange={set("endPoint")}
              color="bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-100"
            />
          </div>
        </div>

        {/* Bottom Row: R&O | Documented Info | Clauses | CSR (IATF) */}
        <div className={`grid gap-3 ${isIATF ? "grid-cols-4" : "grid-cols-3"}`}>
          <TurtleField
            label="Risks & Opportunities" icon={AlertTriangle} placeholder="Key risks and opportunities for this process…"
            value={local.risksAndOpportunities || ""} onChange={set("risksAndOpportunities")}
            multiline color="bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800/40 dark:text-red-100"
          />
          <TurtleField
            label="Documented Information" icon={FileText} placeholder="Procedures, records, work instructions referenced…"
            value={local.documentedInfo || ""} onChange={set("documentedInfo")}
            multiline color="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950/30 dark:border-slate-800/40 dark:text-slate-100"
          />
          <div className="bg-violet-50 border-2 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-violet-900 dark:text-violet-300">ISO Clauses</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {local.clauses.map(c => (
                <Badge key={c} className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 font-mono cursor-pointer" onClick={() => setLocal(prev => ({ ...prev, clauses: prev.clauses.filter(x => x !== c) }))}>
                  {c.split("—")[0].trim()} <X className="w-2.5 h-2.5 ml-0.5" />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add clause (press Enter)"
              className="text-xs bg-white/60 dark:bg-black/20 border-border/40 h-7"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !local.clauses.includes(val)) setLocal(prev => ({ ...prev, clauses: [...prev.clauses, val] }));
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </div>

          {isIATF && (
            <TurtleField
              label="Customer Specific Requirements (CSR)" icon={Users} placeholder="Applicable CSR references (direct to CESAR for full tracking)…"
              value={local.csrReq || ""} onChange={set("csrReq")}
              multiline color="bg-pink-50 border-pink-200 text-pink-900 dark:bg-pink-950/30 dark:border-pink-800/40 dark:text-pink-100"
            />
          )}
        </div>

        {/* IATF Site Assignment */}
        {isIATF && (
          <div className="bg-muted/30 border border-border/60 rounded-xl p-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Site Assignment (IATF)</Label>
            <div className="flex gap-2">
              {IATF_SITES.map(s => (
                <button
                  key={s.key}
                  onClick={() => setLocal(prev => ({ ...prev, site: s.key as ProcessEntry["site"] }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${local.site === s.key ? "bg-accent text-white border-accent" : "border-border/60 text-muted-foreground hover:border-accent/40"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row Assignment */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3">
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Interaction Map Row</Label>
          <div className="flex flex-wrap gap-2">
            {(isIATF ? IATF_ROWS : ISO_ROWS).map(r => (
              <button
                key={r.key}
                onClick={() => setLocal(prev => ({ ...prev, row: r.key }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${(local.row || guessRow(local.name, project.standard!)) === r.key ? "bg-accent text-white border-accent" : "border-border/60 text-muted-foreground hover:border-accent/40"}`}
              >
                {r.key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ProcessMapModule export ──────────────────────────────────────────────
interface ProcessMapModuleProps {
  project: IsoProject | null | undefined;
  onStartWizard: () => void;
}

export function ProcessMapModule({ project, onStartWizard }: ProcessMapModuleProps) {
  const [selectedProcess, setSelectedProcess] = useState<ProcessEntry | null>(null);

  if (!project || project.status !== "complete") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Activity className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-primary mb-2">Process Interaction Map</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Complete the Knowledge Architecture setup to generate your Process Interaction Map. Each process will appear as an interactive box with a full Turtle Diagram.
            </p>
          </div>
          <Button onClick={onStartWizard} className="bg-accent hover:bg-accent/90 text-white gap-2">
            {project ? "Resume Setup Wizard" : "Start Setup Wizard"}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (selectedProcess) {
    return (
      <TurtleDiagram
        process={selectedProcess}
        project={project}
        onBack={() => setSelectedProcess(null)}
        onSave={(updated) => setSelectedProcess(updated)}
      />
    );
  }

  return (
    <ProcessInteractionMap
      project={project}
      onSelectProcess={setSelectedProcess}
    />
  );
}
