import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Edit2, Save, X,
  Plus, Trash2, Target, AlertTriangle, FileText, Users, Zap,
  BookOpen, Activity, MapPin, CheckCircle2, ExternalLink, Printer
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
  kpiTarget?: string;
  kpiUnit?: string;
  objectives?: string;
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

// ─── Row definitions per standard (order: Context → Planning → Operational → Supporting → Management) ──
const ISO_ROWS = [
  { key: "context", label: "Context & Interested Parties", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { key: "planning", label: "Planning & Risk Management", color: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800/40", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { key: "operational", label: "Operational / Core Processes (COP)", color: "bg-accent/5 border-accent/20 dark:bg-accent/10", badge: "bg-accent/10 text-accent" },
  { key: "supporting", label: "Support Processes", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { key: "management", label: "Management Processes (Leadership)", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
];

const IATF_ROWS = [
  { key: "COP", label: "Customer-Oriented Processes (COP)", color: "bg-accent/5 border-accent/20", badge: "bg-accent/10 text-accent" },
  { key: "SOP", label: "Support-Oriented Processes (SOP)", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "MOP", label: "Management-Oriented Processes (MOP)", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
];

const IATF_SITES = [
  { key: "PLANT", label: "Plant", headerClass: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300" },
  { key: "REMOTE_SITE", label: "Remote Site ★", headerClass: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-x border-amber-200 dark:border-amber-800/40" },
  { key: "CORPORATE", label: "Corporate", headerClass: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300" },
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

// ─── Print helpers ─────────────────────────────────────────────────────────────
function printProcessMap(project: IsoProject, processes: ProcessEntry[], rows: typeof ISO_ROWS) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const rowsHtml = rows.map(row => {
    const rowProcs = processes.filter(p => (p.row || guessRow(p.name, project.standard ?? "")) === row.key);
    if (rowProcs.length === 0) return "";
    return `
      <tr>
        <td class="row-label">${row.label}</td>
        <td class="proc-cells">${rowProcs.map(p => `
          <div class="proc-box">
            <div class="proc-name">${p.name}</div>
            ${p.owner ? `<div class="proc-owner">Owner: ${p.owner}</div>` : ""}
            ${p.clauses.length ? `<div class="proc-clauses">${p.clauses.slice(0, 3).map(c => `<span class="clause-tag">${c.split("—")[0].trim()}</span>`).join("")}</div>` : ""}
            ${p.kpi ? `<div class="proc-kpi">KPI: ${p.kpi}${p.kpiTarget ? ` — Target: ${p.kpiTarget}${p.kpiUnit || ""}` : ""}</div>` : ""}
          </div>`).join("")}
        </td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Process Interaction Map — ${project.orgName}</title>
  <style>
    @page { size: A3 landscape; margin: 18mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 9pt; color: #1e3a5f; }
    .doc-header { display: flex; align-items: center; gap: 16px; border-bottom: 2.5px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; }
    .logo-box { width: 60px; height: 60px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: #aaa; text-align: center; border-radius: 6px; }
    .doc-title { flex: 1; text-align: center; }
    .doc-title h1 { font-size: 14pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
    .doc-title p { font-size: 9pt; color: #555; margin-top: 2px; }
    .doc-meta { font-size: 8pt; text-align: right; line-height: 1.7; }
    .doc-meta span { font-weight: bold; }
    .map-wrapper { display: flex; align-items: stretch; border: 1.5px solid #1e3a5f; border-radius: 8px; overflow: hidden; }
    .side-label { width: 28px; display: flex; align-items: center; justify-content: center; background: #dbeafe; font-size: 7pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #1d4ed8; writing-mode: vertical-rl; }
    .side-label.right { transform: rotate(180deg); background: #dcfce7; color: #15803d; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #e2e8f0; }
    .row-label { width: 130px; vertical-align: top; padding: 8px 8px; font-size: 7.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; background: #f8fafc; border-right: 1.5px solid #e2e8f0; color: #1e3a5f; line-height: 1.4; }
    .proc-cells { padding: 6px 8px; vertical-align: top; }
    .proc-cells > div { display: inline-block; vertical-align: top; }
    .proc-box { display: inline-flex; flex-direction: column; gap: 3px; border: 1.5px solid #c4d4e8; border-radius: 6px; padding: 6px 8px; margin: 3px; min-width: 110px; max-width: 150px; background: #fff; vertical-align: top; }
    .proc-name { font-weight: 900; font-size: 8pt; color: #1e3a5f; line-height: 1.3; }
    .proc-owner { font-size: 7pt; color: #666; }
    .proc-kpi { font-size: 7pt; color: #555; font-style: italic; }
    .proc-clauses { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 2px; }
    .clause-tag { font-size: 6.5pt; background: #fff7ed; color: #ea6c19; border: 1px solid #f5c09a; border-radius: 3px; padding: 0 3px; font-family: monospace; }
    .doc-footer { margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7pt; color: #999; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e3a5f; color: white; border: none; border-radius: 8px; padding: 10px 22px; font-size: 11pt; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    @media print { .print-btn { display: none; } }
  </style></head><body>
  <div class="doc-header">
    <div class="logo-box">ORG<br>LOGO</div>
    <div class="doc-title"><h1>Process Interaction Map</h1><p>${project.orgName || ""}</p></div>
    <div class="doc-meta"><span>Standard:</span> ${project.standard || ""}<br><span>Rev:</span> 1.0<br><span>Date:</span> ${today}</div>
  </div>
  <div class="map-wrapper">
    <div class="side-label">Customer Requirements →</div>
    <table>${rowsHtml}</table>
    <div class="side-label right">→ Customer Satisfaction</div>
  </div>
  <div class="doc-footer">
    <span>Core Compliance Hub · ISO Manager</span>
    <span>CONFIDENTIAL — Internal Use Only</span>
    <span>Printed: ${today}</span>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

function printTurtleDiagram(process: ProcessEntry, project: IsoProject, objectives: Array<{ name: string; target?: string | null; unit?: string | null; status?: string | null }>) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const isIATF = project.standard?.includes("IATF");

  const kpisHtml = objectives.length
    ? objectives.map(o => `<div class="kpi-row"><span class="kpi-name">${o.name}</span>${o.target ? `<span class="kpi-target">Target: ${o.target}${o.unit || ""}</span>` : ""}</div>`).join("")
    : `<div class="empty-note">No KPIs defined</div>`;

  const clausesHtml = process.clauses.length
    ? process.clauses.map(c => `<span class="clause-tag">${c.split("—")[0].trim()}</span>`).join("")
    : `<span class="empty-note">None</span>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Turtle Diagram — ${process.name}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 9pt; color: #1e3a5f; }
    .doc-header { display: flex; align-items: center; gap: 16px; border-bottom: 2.5px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; }
    .logo-box { width: 52px; height: 52px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 7pt; color: #aaa; text-align: center; border-radius: 6px; }
    .doc-title { flex: 1; }
    .doc-title h1 { font-size: 13pt; font-weight: 900; color: #1e3a5f; }
    .doc-title p { font-size: 8.5pt; color: #555; margin-top: 2px; }
    .doc-meta { font-size: 8pt; text-align: right; line-height: 1.7; }
    .doc-meta span { font-weight: bold; }
    .turtle { display: grid; grid-template-rows: auto auto auto; gap: 6px; }
    .row { display: grid; gap: 6px; }
    .row-2 { grid-template-columns: 1fr 1fr; }
    .row-3 { grid-template-columns: 1fr 1.4fr 1fr; }
    .row-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
    .cell { border: 1.5px solid #c4d4e8; border-radius: 7px; padding: 8px 10px; min-height: 70px; background: #f8fafc; }
    .cell.blue { background: #eff6ff; border-color: #bfdbfe; }
    .cell.amber { background: #fffbeb; border-color: #fde68a; }
    .cell.green { background: #f0fdf4; border-color: #bbf7d0; }
    .cell.orange { background: #fff7ed; border-color: #fed7aa; }
    .cell.red { background: #fef2f2; border-color: #fecaca; }
    .cell.slate { background: #f8fafc; border-color: #cbd5e1; }
    .cell.violet { background: #f5f3ff; border-color: #ddd6fe; }
    .cell.primary { background: #f0f4ff; border-color: #c3d0f5; }
    .cell-title { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
    .cell-body { font-size: 8.5pt; color: #374151; line-height: 1.5; white-space: pre-wrap; }
    .kpi-row { display: flex; justify-content: space-between; align-items: center; padding: 2px 0; border-bottom: 1px solid #fde68a; font-size: 8pt; gap: 8px; }
    .kpi-name { font-weight: 600; color: #92400e; }
    .kpi-target { font-size: 7.5pt; color: #78350f; }
    .clause-tag { font-size: 7.5pt; background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; border-radius: 3px; padding: 0 4px; margin: 1px; display: inline-block; font-family: monospace; }
    .empty-note { font-size: 8pt; color: #aaa; font-style: italic; }
    .process-header { background: #1e3a5f; color: white; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .process-header h2 { font-size: 12pt; font-weight: 900; }
    .process-header .meta { font-size: 8pt; opacity: 0.8; }
    .process-header .clauses { display: flex; gap: 4px; flex-wrap: wrap; }
    .process-header .clause-tag { background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.3); }
    .doc-footer { margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 7pt; color: #999; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1e3a5f; color: white; border: none; border-radius: 8px; padding: 10px 22px; font-size: 11pt; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    @media print { .print-btn { display: none; } }
  </style></head><body>
  <div class="doc-header">
    <div class="logo-box">ORG<br>LOGO</div>
    <div class="doc-title">
      <h1>Turtle Diagram</h1>
      <p>${project.orgName || ""} · ${project.standard || ""}</p>
    </div>
    <div class="doc-meta"><span>Process:</span> ${process.name}<br><span>Owner:</span> ${process.owner || "—"}<br><span>Date:</span> ${today}</div>
  </div>

  <div class="process-header">
    <div>
      <h2>${process.name}</h2>
      <div class="meta">Process Owner: ${process.owner || "—"}${process.executors ? ` · Executors: ${process.executors}` : ""}</div>
    </div>
    <div class="clauses">${clausesHtml}</div>
  </div>

  <div class="turtle">
    <div class="row row-2">
      <div class="cell blue">
        <div class="cell-title">⚡ Resources</div>
        <div class="cell-body">${process.resources || "—"}</div>
      </div>
      <div class="cell amber">
        <div class="cell-title">🎯 Quality Objectives / KPIs</div>
        ${kpisHtml}
      </div>
    </div>

    <div class="row row-3">
      <div class="cell green">
        <div class="cell-title">→ Inputs</div>
        <div class="cell-body">${process.inputs || "—"}</div>
        ${process.startingPoint ? `<div class="cell-title" style="margin-top:8px">📍 Starting Point / Trigger</div><div class="cell-body">${process.startingPoint}</div>` : ""}
      </div>
      <div class="cell primary">
        <div class="cell-title">⚙ Key Activities</div>
        <div class="cell-body">${process.keyActivities || "—"}</div>
      </div>
      <div class="cell orange">
        <div class="cell-title">Outputs →</div>
        <div class="cell-body">${process.outputs || "—"}</div>
        ${process.endPoint ? `<div class="cell-title" style="margin-top:8px">✅ End Point / Completion</div><div class="cell-body">${process.endPoint}</div>` : ""}
      </div>
    </div>

    <div class="row ${isIATF ? "row-4" : "row-3"}">
      <div class="cell red">
        <div class="cell-title">⚠ Risks &amp; Opportunities</div>
        <div class="cell-body">${process.risksAndOpportunities || "—"}</div>
      </div>
      <div class="cell slate">
        <div class="cell-title">📄 Documented Information</div>
        <div class="cell-body">${process.documentedInfo || "—"}</div>
      </div>
      <div class="cell violet">
        <div class="cell-title">📘 ISO Clauses</div>
        <div>${clausesHtml}</div>
      </div>
      ${isIATF ? `<div class="cell amber">
        <div class="cell-title">👥 Customer Specific Requirements</div>
        <div class="cell-body">${process.csrReq || "—"}</div>
      </div>` : ""}
    </div>
  </div>

  <div class="doc-footer">
    <span>Core Compliance Hub · ISO Manager</span>
    <span>CONFIDENTIAL — Internal Use Only</span>
    <span>Printed: ${today}</span>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
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
        <button
          onClick={() => printProcessMap(project, processes, rows)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
          data-testid="button-print-process-map"
        >
          <Printer className="w-3.5 h-3.5" /> Print Map
        </button>
      </div>

      {/* AS9100 "Where Applicable" notice */}
      {project.standard?.includes("AS9100") && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 flex items-center gap-2">
          <span className="text-[10px] font-black text-violet-700 dark:text-violet-300 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 rounded shrink-0">W/A</span>
          <p className="text-[10px] text-violet-700 dark:text-violet-300">
            AS9100 Rev D: Certain clauses apply only <strong>"Where Applicable"</strong> (e.g., 8.1.4 Project Mgmt, 8.1.5 Risk/Opp, 8.2.4 Customer Docs, 8.4.3 External Providers, 8.5.1.2–8.5.6 Production Controls). Inapplicable clauses must be justified in the QMS.
          </p>
        </div>
      )}

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
        <div className="space-y-1">
          {/* Dedicated IATF site header row — shown once at top */}
          <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-2 border-border/40 rounded-xl overflow-hidden bg-muted/20">
            <div className="border-r border-border/30 px-3 py-2 flex items-center">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Process Type</span>
            </div>
            {IATF_SITES.map(site => (
              <div key={site.key} className={`border-r last:border-r-0 border-border/30 px-3 py-2 text-center ${site.headerClass}`}>
                <p className="text-[10px] font-black uppercase tracking-wider">{site.label}</p>
              </div>
            ))}
          </div>
          {rows.map(row => {
            const rowProcs = processes.filter(p => (p.row || guessRow(p.name, project.standard!)) === row.key);
            return (
              <div key={row.key} className={`border-2 rounded-xl overflow-hidden ${row.color}`}>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr]">
                  {/* Row label */}
                  <div className="border-r border-border/30 px-3 py-3 flex flex-col items-start justify-center gap-1">
                    <Badge className={`text-[10px] font-bold px-2 py-0.5 ${row.badge}`}>{row.key}</Badge>
                    <span className="text-[10px] font-bold text-primary leading-tight">{row.label}</span>
                    <span className="text-[9px] text-muted-foreground">{rowProcs.length} proc{rowProcs.length !== 1 ? "s" : ""}</span>
                  </div>
                  {/* Site columns — no repeated header, just process boxes */}
                  {IATF_SITES.map(site => {
                    const siteProcs = rowProcs.filter(p => (p.site || "PLANT") === site.key);
                    return (
                      <div key={site.key} className="border-r last:border-r-0 border-border/30 p-2 space-y-1.5">
                        {siteProcs.map(p => (
                          <ProcessBox key={p.name} process={p} onClick={() => onSelectProcess(p)} standard={project.standard!} />
                        ))}
                        {siteProcs.length === 0 && (
                          <div className="border-2 border-dashed border-border/30 rounded-lg p-3 text-center min-h-[60px] flex items-center justify-center">
                            <p className="text-[10px] text-muted-foreground/40">—</p>
                          </div>
                        )}
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
  const [editTarget, setEditTarget] = React.useState(obj.target ?? "");
  const [editUnit, setEditUnit] = React.useState(obj.unit ?? "");
  return (
    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2 border border-border/30 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="font-semibold text-xs text-primary flex-1 truncate">{obj.name}</div>
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
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground shrink-0">Target:</span>
        <Input
          value={editTarget}
          onChange={e => setEditTarget(e.target.value)}
          onBlur={() => { if (editTarget !== obj.target) onChange("target", editTarget); }}
          placeholder="e.g. 95"
          className="h-5 text-[10px] flex-1 px-1.5 bg-transparent border-border/40"
          data-testid={`input-obj-target-${obj.id}`}
        />
        <Input
          value={editUnit}
          onChange={e => setEditUnit(e.target.value)}
          onBlur={() => { if (editUnit !== obj.unit) onChange("unit", editUnit); }}
          placeholder="%"
          className="h-5 text-[10px] w-12 px-1.5 bg-transparent border-border/40"
          data-testid={`input-obj-unit-${obj.id}`}
        />
      </div>
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
      const objName = local.objectives?.trim() || local.kpi?.trim();
      if (objName) {
        await fetch("/api/iso-objectives/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ processName: process.name, name: objName, target: local.kpiTarget ?? "", unit: local.kpiUnit ?? "", responsible: local.owner, isoProjectId: project.id }),
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
          <button
            onClick={() => printTurtleDiagram(local, project, objectives)}
            className="flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors h-7"
            data-testid="button-print-turtle"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
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
