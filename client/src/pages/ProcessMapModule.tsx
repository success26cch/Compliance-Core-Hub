import React, { useState, useEffect, useRef } from "react";
import precisionPartsLogoUrl from "@assets/precision-parts-logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Edit2, Save, X,
  Plus, Trash2, Target, AlertTriangle, FileText, Users, Zap,
  BookOpen, Activity, MapPin, CheckCircle2, ExternalLink, Printer, Palette, Sparkles, Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  site?: string[];  // multi-site: ["PLANT"], ["PLANT","CORPORATE"], ["REMOTE_SITE","CORPORATE"], etc.
  row?: string;
  sequence?: number;
  conditionalLabel?: string;
}

// ─── Row definitions per standard (order: Core → Support → Management) ──
const ISO_ROWS = [
  { key: "management", label: "Management Processes", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "core", label: "Core Processes", color: "bg-accent/5 border-accent/20 dark:bg-accent/10", badge: "bg-accent/10 text-accent" },
  { key: "support", label: "Support Processes", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
];

const IATF_ROWS = [
  { key: "MOP", label: "Management-Oriented Processes (MOP)", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "COP", label: "Customer-Oriented Processes (COP)", color: "bg-accent/5 border-accent/20", badge: "bg-accent/10 text-accent" },
  { key: "SOP", label: "Support-Oriented Processes (SOP)", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
];

// Maps IATF row keys → color-scheme band keys (same palette, same semantics)
const IATF_TO_COLOR_KEY: Record<string, string> = {
  MOP: "management",
  COP: "core",
  SOP: "support",
};

const IATF_SITES = [
  { key: "PLANT", label: "Plant", headerClass: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300" },
  { key: "REMOTE_SITE", label: "Remote Site ★", headerClass: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-x border-amber-200 dark:border-amber-800/40" },
  { key: "CORPORATE", label: "Corporate", headerClass: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300" },
];

// Normalizes old single-string site values to the new string[] format
function normalizeSites(site?: string | string[] | null): string[] {
  if (!site) return ["PLANT"];
  if (Array.isArray(site)) return site.length ? site : ["PLANT"];
  return [site]; // backward compat: old "PLANT" / "REMOTE_SITE" / "CORPORATE" strings
}

// ─── Process Map Color Schemes ────────────────────────────────────────────────
interface BandColors { bg: string; border: string; text: string; badgeBg: string; badgeText: string; }
interface MapScheme {
  label: string;
  swatches: string[];
  management: BandColors;
  core: BandColors & { seqBg: string; arrowHex: string };
  support: BandColors;
}
const MAP_COLOR_SCHEMES: Record<string, MapScheme> = {
  "navy-orange": {
    label: "Navy & Orange",
    swatches: ["#1D4ED8", "#EA6C19", "#15803D"],
    management: { bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8", badgeBg: "#1D4ED8", badgeText: "#fff" },
    core:       { bg: "#FFF7ED", border: "#EA6C19", text: "#1e3a5f", badgeBg: "#EA6C19", badgeText: "#fff", seqBg: "#EA6C19", arrowHex: "#EA6C19" },
    support:    { bg: "#F0FDF4", border: "#86EFAC", text: "#15803D", badgeBg: "#15803D", badgeText: "#fff" },
  },
  "forest-gold": {
    label: "Forest & Gold",
    swatches: ["#15803D", "#D97706", "#4D7C0F"],
    management: { bg: "#DCFCE7", border: "#86EFAC", text: "#15803D", badgeBg: "#15803D", badgeText: "#fff" },
    core:       { bg: "#FFFBEB", border: "#D97706", text: "#1c1917", badgeBg: "#D97706", badgeText: "#fff", seqBg: "#D97706", arrowHex: "#D97706" },
    support:    { bg: "#F7FEE7", border: "#BEF264", text: "#4D7C0F", badgeBg: "#4D7C0F", badgeText: "#fff" },
  },
  "slate-purple": {
    label: "Slate & Purple",
    swatches: ["#475569", "#7C3AED", "#4338CA"],
    management: { bg: "#F1F5F9", border: "#94A3B8", text: "#475569", badgeBg: "#475569", badgeText: "#fff" },
    core:       { bg: "#F5F3FF", border: "#7C3AED", text: "#1e1b4b", badgeBg: "#7C3AED", badgeText: "#fff", seqBg: "#7C3AED", arrowHex: "#7C3AED" },
    support:    { bg: "#EEF2FF", border: "#A5B4FC", text: "#4338CA", badgeBg: "#4338CA", badgeText: "#fff" },
  },
  "burgundy-steel": {
    label: "Burgundy & Steel",
    swatches: ["#9F1239", "#2563EB", "#4B5563"],
    management: { bg: "#FFF1F2", border: "#FDA4AF", text: "#9F1239", badgeBg: "#9F1239", badgeText: "#fff" },
    core:       { bg: "#EFF6FF", border: "#2563EB", text: "#1e3a5f", badgeBg: "#2563EB", badgeText: "#fff", seqBg: "#2563EB", arrowHex: "#2563EB" },
    support:    { bg: "#F9FAFB", border: "#9CA3AF", text: "#4B5563", badgeBg: "#4B5563", badgeText: "#fff" },
  },
  "teal-coral": {
    label: "Teal & Coral",
    swatches: ["#0F766E", "#F43F5E", "#0369A1"],
    management: { bg: "#F0FDFA", border: "#5EEAD4", text: "#0F766E", badgeBg: "#0F766E", badgeText: "#fff" },
    core:       { bg: "#FFF1F2", border: "#F43F5E", text: "#4c0519", badgeBg: "#F43F5E", badgeText: "#fff", seqBg: "#F43F5E", arrowHex: "#F43F5E" },
    support:    { bg: "#F0F9FF", border: "#7DD3FC", text: "#0369A1", badgeBg: "#0369A1", badgeText: "#fff" },
  },
  "neutral-muted": {
    label: "Neutral (Muted)",
    swatches: ["#475569", "#57534E", "#6B7280"],
    management: { bg: "#F8FAFC", border: "#CBD5E1", text: "#334155", badgeBg: "#475569", badgeText: "#fff" },
    core:       { bg: "#FAFAF9", border: "#A8A29E", text: "#292524", badgeBg: "#57534E", badgeText: "#fff", seqBg: "#57534E", arrowHex: "#78716C" },
    support:    { bg: "#F9FAFB", border: "#D1D5DB", text: "#374151", badgeBg: "#6B7280", badgeText: "#fff" },
  },
};

const LEGACY_ROW_MAP: Record<string, string> = {
  context: "management",
  planning: "management",
  operational: "core",
  supporting: "support",
};

function normalizeRow(row: string | undefined, name: string, standard: string): string {
  if (!row) return guessRow(name, standard);
  if (LEGACY_ROW_MAP[row]) return LEGACY_ROW_MAP[row];
  return row;
}

/**
 * guessRow — classifies a process into the correct band based on its name.
 *
 * IATF 16949 uses MOP / COP / SOP:
 *   COP (Customer-Oriented): the value chain that creates & delivers product —
 *       customer interface, order entry, APQP/PPAP, design, production,
 *       in-process testing, packaging, shipping, delivery, returns.
 *   MOP (Management-Oriented): strategic direction & system governance —
 *       strategic planning, management review, internal audit, quality
 *       objectives, KPIs, CAPA, continual improvement, risk management.
 *   SOP (Support-Oriented): processes that enable/sustain the COPs —
 *       HR, training, maintenance, calibration, document control, IT,
 *       facilities, EHS, purchasing, procurement, supplier management.
 *
 * ISO 9001 / AS9100 / ISO 14001 / ISO 45001 use management / core / support
 * (same three-band concept, different labels).
 */
function guessRow(name: string, standard: string): string {
  const n = name.toLowerCase();

  if (standard.includes("IATF")) {
    // ── MOP — check FIRST to catch "management & planning", "management review"
    if (
      n.includes("management review") || n.includes("strategic plan") ||
      n.includes("business plan") || n.includes("internal audit") ||
      n.includes("corrective action") || n.includes("capa") ||
      n.includes("quality objective") || n.includes("kpi") ||
      n.includes("customer satisfaction") || n.includes("continual improvement") ||
      n.includes("improvement program") || n.includes("lessons learned") ||
      n.includes("risk management") || n.includes("risk and opportunit") ||
      n.includes("management & planning") || n.includes("management and planning") ||
      (n.includes("planning") && !n.includes("production plan") && !n.includes("apqp"))
    ) return "MOP";

    // ── SOP — enable & sustain (check BEFORE generic COP fallthrough)
    if (
      n.includes("human resource") || n.includes(" hr ") || n === "hr" ||
      n.includes("training") || n.includes("competency") || n.includes("workforce") ||
      n.includes("maintenance") || n.includes("preventive maint") ||
      n.includes("calibration") || n.includes("measurement system") || n.includes(" msa") ||
      n.includes("document control") || n.includes("record management") ||
      n.includes("information technology") || n.includes(" erp") || n.includes("it management") ||
      n.includes("facilities") || n.includes("infrastructure") ||
      n.includes("environmental") || n.includes("health and safety") || n.includes("ehs") ||
      n.includes("supplier management") || n.includes("supplier development") ||
      n.includes("supplier quality") || n.includes("purchasing") || n.includes("procurement") ||
      n.includes("supply chain")
    ) return "SOP";

    // ── COP — customer-facing value chain & product realization
    if (
      n.includes("customer") || n.includes("sales") || n.includes("commercial") ||
      n.includes("order") || n.includes("rfq") || n.includes("quotation") ||
      n.includes("apqp") || n.includes("ppap") || n.includes("new program") ||
      n.includes("program launch") || n.includes("product launch") || n.includes("program management") ||
      n.includes("design") || n.includes("development") || n.includes("engineering") ||
      n.includes("production") || n.includes("manufactur") || n.includes("blending") ||
      n.includes("mixing") || n.includes("processing") || n.includes("assembly") ||
      n.includes("fabrication") || n.includes("machining") || n.includes("filling") ||
      n.includes("packaging") || n.includes("labeling") ||
      n.includes("testing") || n.includes("inspection") || n.includes("quality assurance") ||
      n.includes("quality control") || n.includes("analytical") || n.includes("laboratory") ||
      n.includes("warehouse") || n.includes("shipping") || n.includes("delivery") ||
      n.includes("logistics") || n.includes("dispatch") || n.includes("transport") ||
      n.includes("returns") || n.includes("warranty") || n.includes("complaint")
    ) return "COP";

    return "SOP"; // safe default for anything unrecognised
  }

  // ── ISO 9001 / AS9100 / other ISO standards ─────────────────────────────────
  // Management band
  if (
    n.includes("management review") || n.includes("strategic plan") ||
    n.includes("business plan") || n.includes("leadership") ||
    n.includes("context of") || n.includes("internal audit") ||
    n.includes("corrective action") || n.includes("capa") ||
    n.includes("quality objective") || n.includes("risk") ||
    n.includes("continual improvement") || n.includes("customer satisfaction") ||
    n.includes("performance monitor") || n.includes("kpi") ||
    (n.includes("planning") && !n.includes("production plan") && !n.includes("apqp"))
  ) return "management";

  // Support band
  if (
    n.includes("human resource") || n.includes("training") || n.includes("competency") ||
    n.includes("maintenance") || n.includes("calibration") || n.includes("measurement system") ||
    n.includes("document control") || n.includes("record") ||
    n.includes("information technology") || n.includes("facilities") ||
    n.includes("infrastructure") || n.includes("environmental") ||
    n.includes("health and safety") || n.includes("ehs") ||
    n.includes("supplier management") || n.includes("purchasing") ||
    n.includes("procurement") || n.includes("supply chain")
  ) return "support";

  // Core band — value-adding product/service realization
  if (
    n.includes("customer") || n.includes("sales") || n.includes("order") ||
    n.includes("apqp") || n.includes("ppap") || n.includes("new program") ||
    n.includes("design") || n.includes("development") ||
    n.includes("production") || n.includes("manufactur") || n.includes("assembly") ||
    n.includes("fabrication") || n.includes("machining") || n.includes("blending") ||
    n.includes("mixing") || n.includes("processing") || n.includes("filling") ||
    n.includes("packaging") || n.includes("inspection") || n.includes("testing") ||
    n.includes("quality assurance") || n.includes("quality control") || n.includes("analytical") ||
    n.includes("shipping") || n.includes("delivery") || n.includes("warehouse") ||
    n.includes("logistics") || n.includes("service delivery")
  ) return "core";

  return "support";
}

// ─── Process Box Component ─────────────────────────────────────────────────────
function ProcessBox({ process, onClick, onDelete, standard }: { process: ProcessEntry; onClick: () => void; onDelete: () => void; standard: string }) {
  const isIATF = standard.includes("IATF");
  const sites = normalizeSites(process.site);
  const isRemote = sites.includes("REMOTE_SITE");
  const isCorporate = sites.includes("CORPORATE");
  const isPlantOnly = !isRemote && !isCorporate;

  const borderCls = isIATF
    ? isRemote && isCorporate
      ? "border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-950/20"
      : isRemote
      ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/30"
      : isCorporate
      ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30"
      : "border-emerald-300 dark:border-emerald-700 bg-white dark:bg-card"
    : "border-border/40 bg-white dark:bg-card";

  return (
    <button
      onClick={onClick}
      data-testid={`process-box-${process.name.replace(/\s+/g, "-").toLowerCase()}`}
      className={`group relative border-2 rounded-xl p-3 text-left transition-all hover:shadow-md min-h-[90px] w-full hover:border-accent/60 ${borderCls}`}
    >
      {/* Site chips — always shown for IATF projects so every box matches the legend */}
      {isIATF && (
        <div className="flex items-center gap-1 mb-1.5 flex-wrap">
          {isPlantOnly && (
            <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded leading-none">● Plant</span>
          )}
          {isRemote && (
            <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded leading-none">★ Remote</span>
          )}
          {isCorporate && (
            <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded leading-none">◆ Corp</span>
          )}
        </div>
      )}
      <div className="font-bold text-primary text-sm leading-tight mb-1 group-hover:text-accent transition-colors line-clamp-2">{process.name}</div>
      {process.owner && (
        <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
          <Users className="w-3 h-3" />{process.owner}
        </div>
      )}
      {process.clauses.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {process.clauses.slice(0, 2).map(c => (
            <span key={c} className="text-[11px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono">{c.split("—")[0].trim()}</span>
          ))}
          {process.clauses.length > 2 && <span className="text-[11px] text-muted-foreground">+{process.clauses.length - 2}</span>}
        </div>
      )}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground/40 hover:text-red-500 transition-colors"
          data-testid={`button-delete-process-${process.name.replace(/\s+/g, "-").toLowerCase()}`}
          title="Delete this process"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <ExternalLink className="w-3 h-3 text-accent" />
      </div>
    </button>
  );
}

// ─── Print helpers ─────────────────────────────────────────────────────────────
function printProcessMap(project: IsoProject, processes: ProcessEntry[], rows: typeof ISO_ROWS, schemeKey = "navy-orange") {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const std = project.standard ?? "";
  const sch = MAP_COLOR_SCHEMES[schemeKey] ?? MAP_COLOR_SCHEMES["navy-orange"];

  // Categorise and sort — handles both ISO keys (management/core/support)
  // AND IATF keys (MOP/COP/SOP) so the print function works for all standards.
  const isIATFStd = std.includes("IATF");
  const mgtKey  = isIATFStd ? "MOP"  : "management";
  const coreKey = isIATFStd ? "COP"  : "core";
  const supKey  = isIATFStd ? "SOP"  : "support";
  const mgtProcs  = processes.filter(p => normalizeRow(p.row, p.name, std) === mgtKey);
  const coreProcs = [...processes.filter(p => normalizeRow(p.row, p.name, std) === coreKey)]
                      .sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99));
  const supProcs  = processes.filter(p => normalizeRow(p.row, p.name, std) === supKey);

  // Which core-sequence numbers each support process interacts with
  const SUPPORT_LINKS: Record<string, number[]> = {
    "Purchasing & Supply Chain":                   [3, 4],
    "Calibration & Measurement Equipment Control": [4],
    "Maintenance":                                 [4],
    "Human Resources & Training":                  [1, 2, 3, 4, 5],
    "Inspection & Testing":                        [4, 5],
    "Control of Documented Information":           [1, 2, 3, 4, 5],
  };

  // Helper — process box HTML (used in management & support bands)
  const mgmtBox = (p: ProcessEntry) => `
    <div class="mgmt-box">
      <div class="box-num">▲</div>
      <div class="box-name">${p.name}</div>
      <div class="box-owner">${p.owner || ""}</div>
      ${p.clauses.length ? `<div class="box-clauses">${p.clauses.slice(0,2).map(c=>`<span class="ctag">${c.split("—")[0].trim()}</span>`).join("")}</div>` : ""}
    </div>`;

  const supBox = (p: ProcessEntry) => {
    const links = SUPPORT_LINKS[p.name] ?? [];
    const nums = links.length ? `Supports: ${links.map(n=>`step&nbsp;${n}`).join(", ")}` : "Supports all processes";
    return `
    <div class="sup-box">
      <div class="box-name">${p.name}</div>
      <div class="box-owner">${p.owner || ""}</div>
      ${p.clauses.length ? `<div class="box-clauses">${p.clauses.slice(0,2).map(c=>`<span class="ctag">${c.split("—")[0].trim()}</span>`).join("")}</div>` : ""}
      <div class="sup-links">↑ ${nums}</div>
    </div>`;
  };

  // Core process flow boxes with arrows
  const coreFlowHtml = coreProcs.map((p, i) => `
    <div class="core-step">
      ${p.conditionalLabel ? `<div class="cond-label">${p.conditionalLabel}</div>` : ""}
      <div class="core-box">
        <div class="core-seq">${p.sequence ?? i + 1}</div>
        <div class="core-name">${p.name}</div>
        <div class="core-owner">${p.owner || ""}</div>
        ${p.clauses.length ? `<div class="box-clauses">${p.clauses.slice(0,2).map(c=>`<span class="ctag">${c.split("—")[0].trim()}</span>`).join("")}</div>` : ""}
        ${p.kpi ? `<div class="core-kpi">KPI: ${p.kpi}${p.kpiTarget ? ` — ${p.kpiTarget}${p.kpiUnit||""}` : ""}</div>` : ""}
      </div>
    </div>
    ${i < coreProcs.length - 1 ? '<div class="core-arrow">→</div>' : ""}
  `).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Process Interaction Map — ${project.orgName}</title>
  <style>
    @page { size: letter landscape; margin: 9mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 9pt; color: #1e3a5f; background: #fff; }

    /* ── Header ── */
    .doc-header { display: flex; align-items: center; gap: 14px; border-bottom: 2.5px solid #1e3a5f; padding-bottom: 9px; margin-bottom: 12px; }
    .logo-box { width: 256px; height: 256px; display: flex; align-items: center; justify-content: center; border-radius: 5px; flex-shrink: 0; overflow: hidden; }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .doc-title { flex: 1; text-align: center; }
    .doc-title h1 { font-size: 16pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; color: #1e3a5f; }
    .doc-title p { font-size: 10.5pt; color: #444; margin-top: 3px; }
    .doc-meta { font-size: 9pt; text-align: right; line-height: 1.8; color: #555; }
    .doc-meta b { color: #1e3a5f; }

    /* ── Outer frame ── */
    .frame { border: 2px solid #1e3a5f; border-radius: 8px; overflow: hidden; }

    /* ── MANAGEMENT band ── */
    .mgmt-band { background: ${sch.management.bg}; border-bottom: 2px solid ${sch.management.border}; padding: 9px 12px; }
    .band-title { font-size: 8.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: ${sch.management.text}; margin-bottom: 7px; display: flex; align-items: center; gap: 6px; }
    .band-title .arrow-ind { font-size: 10.5pt; color: ${sch.management.text}; }
    .band-boxes { display: flex; gap: 8px; flex-wrap: wrap; }
    .mgmt-box { border: 1.5px solid ${sch.management.border}; border-radius: 5px; background: #fff; padding: 6px 10px; flex: 1; min-width: 130px; }
    .box-num { font-size: 8.5pt; color: ${sch.management.text}; font-weight: 900; margin-bottom: 2px; }
    .box-name { font-weight: 900; font-size: 9pt; color: #1e3a5f; line-height: 1.3; }
    .box-owner { font-size: 8pt; color: #555; margin-top: 2px; }
    .box-clauses { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 4px; }
    .ctag { font-size: 9pt; font-weight: 700; background: ${sch.core.bg}; color: ${sch.core.seqBg}; border: 1px solid ${sch.core.border}; border-radius: 2px; padding: 1px 5px; font-family: monospace; }

    /* ── Interaction arrows between management and core ── */
    .mgmt-arrow-row { background: ${sch.management.bg}cc; border-bottom: 1px solid ${sch.management.border}; padding: 4px 12px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .arrow-label { font-size: 8pt; font-weight: 700; color: ${sch.management.text}; letter-spacing: 0.03em; }

    /* ── CORE flow band ── */
    .core-band { display: flex; align-items: stretch; }
    .side-col { width: 30px; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; writing-mode: vertical-rl; padding: 6px 0; }
    .side-col.left { background: ${sch.management.bg}; color: ${sch.management.text}; border-right: 1.5px solid ${sch.management.border}; }
    .side-col.right { background: ${sch.support.bg}; color: ${sch.support.text}; border-left: 1.5px solid ${sch.support.border}; transform: rotate(180deg); }
    .core-flow-area { flex: 1; background: #fff; display: flex; align-items: center; justify-content: center; padding: 12px 8px; gap: 0; flex-wrap: nowrap; overflow: hidden; }
    .core-step { display: flex; flex-direction: column; align-items: center; }
    .cond-label { font-size: 7.5pt; font-weight: 900; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; border-radius: 3px; padding: 2px 6px; margin-bottom: 5px; letter-spacing: 0.03em; }
    .core-box { border: 2px solid ${sch.core.border}; border-radius: 6px; background: ${sch.core.bg}; padding: 7px 8px; min-width: 108px; max-width: 132px; display: flex; flex-direction: column; gap: 2px; }
    .core-seq { width: 22px; height: 22px; background: ${sch.core.seqBg}; color: #fff; border-radius: 50%; font-size: 10pt; font-weight: 900; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; flex-shrink: 0; }
    .core-name { font-weight: 900; font-size: 9pt; color: ${sch.core.text}; line-height: 1.3; }
    .core-owner { font-size: 8pt; color: #666; }
    .core-kpi { font-size: 7.5pt; color: #555; font-style: italic; margin-top: 3px; }
    .core-arrow { font-size: 20pt; color: ${sch.core.arrowHex}; font-weight: 900; padding: 0 4px; line-height: 1; margin-top: 22px; flex-shrink: 0; }

    /* ── Interaction arrows between core and support ── */
    .sup-arrow-row { background: ${sch.support.bg}cc; border-top: 1px solid ${sch.support.border}; border-bottom: 1px solid ${sch.support.border}; padding: 4px 12px; display: flex; align-items: center; justify-content: center; gap: 10px; }

    /* ── SUPPORT band ── */
    .sup-band { background: ${sch.support.bg}; border-top: 2px solid ${sch.support.border}; padding: 9px 12px; }
    .sup-band .band-title { color: ${sch.support.text}; }
    .sup-boxes { display: flex; gap: 8px; flex-wrap: wrap; }
    .sup-box { border: 1.5px solid ${sch.support.border}; border-radius: 5px; background: #fff; padding: 6px 10px; flex: 1; min-width: 120px; }
    .sup-links { font-size: 7.5pt; color: ${sch.support.text}; font-weight: 700; margin-top: 4px; }

    /* ── Footer ── */
    .doc-footer { margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 5px; display: flex; justify-content: space-between; font-size: 8pt; color: #999; }
    .legend { margin-top: 8px; display: flex; gap: 16px; font-size: 8pt; color: #555; }
    .legend-item { display: flex; align-items: center; gap: 5px; }
    .legend-dot { width: 11px; height: 11px; border-radius: 50%; }

    /* ── No-split rules: keep every band whole, never cut mid-box ── */
    .frame          { break-inside: avoid; page-break-inside: avoid; }
    .mgmt-band      { break-inside: avoid; page-break-inside: avoid; }
    .core-band      { break-inside: avoid; page-break-inside: avoid; }
    .sup-band       { break-inside: avoid; page-break-inside: avoid; }
    .mgmt-arrow-row { break-inside: avoid; page-break-inside: avoid; }
    .sup-arrow-row  { break-inside: avoid; page-break-inside: avoid; }

    /* ── Page-wrapper receives auto-scale transform at runtime ── */
    .page-wrapper { transform-origin: top left; }

    /* ── Print instruction bar ── */
    .print-instructions { background: #1e3a5f; color: #fff; padding: 10px 18px; display: flex; align-items: center; gap: 16px; font-size: 9.5pt; margin-bottom: 14px; border-radius: 6px; }
    .print-instructions strong { color: #fbbf24; }
    .print-instructions .step { background: rgba(255,255,255,0.15); border-radius: 4px; padding: 3px 8px; font-size: 8.5pt; }
    @media print { .print-instructions { display: none; } }

    /* ── Print button / scale notice ── */
    .print-btn    { position: fixed; bottom: 20px; right: 20px; background: #1e3a5f; color: white; border: none; border-radius: 8px; padding: 9px 20px; font-size: 10pt; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .scale-notice { position: fixed; bottom: 20px; left: 20px; background: #f0fdf4; border: 1px solid #86efac; color: #166534; border-radius: 6px; padding: 6px 12px; font-size: 8.5pt; font-weight: 600; }
    @media print  { .print-btn, .scale-notice { display: none; } }

    /* ── Dynamic scale injected by JS ── */
    #auto-scale-style {}
  </style>
  <style id="auto-scale-style"></style>
  </head><body>

  <!-- Print instruction bar (hidden at print time) -->
  <div class="print-instructions">
    <span>🖨 <strong>Before printing:</strong></span>
    <span class="step">1. Click "Print / Save PDF" below</span>
    <span class="step">2. Set <strong>Orientation → Landscape</strong></span>
    <span class="step">3. Set <strong>Paper → Letter (8.5 × 11 in)</strong></span>
    <span class="step">4. Margins → <strong>Minimum</strong> or <strong>None</strong></span>
    <span style="margin-left:auto;opacity:0.7;font-size:8pt">The map auto-scales to fit — no manual resizing needed</span>
  </div>

  <div class="page-wrapper" id="page-wrapper">

  <!-- Header -->
  <div class="doc-header">
    <div class="logo-box"><img src="${precisionPartsLogoUrl}" alt="${project.orgName} logo" /></div>
    <div class="doc-title">
      <h1>Process Interaction Map</h1>
      <p>${project.orgName || ""} &nbsp;·&nbsp; ${std} &nbsp;·&nbsp; QMS Clause 4.4</p>
    </div>
    <div class="doc-meta"><b>Doc No:</b> QMS-PIM-001<br><b>Rev:</b> 1.0<br><b>Date:</b> ${today}<br><b>Status:</b> Approved</div>
  </div>

  <!-- Main frame -->
  <div class="frame">

    <!-- MANAGEMENT band -->
    <div class="mgmt-band">
      <div class="band-title"><span class="arrow-ind">⬇</span> MANAGEMENT PROCESSES — Direction, Resources &amp; Continual Improvement <span class="arrow-ind">⬇</span></div>
      <div class="band-boxes">${mgtProcs.map(p => mgmtBox(p)).join("")}</div>
    </div>

    <!-- Arrow row: management ↔ core -->
    <div class="mgmt-arrow-row">
      <span class="arrow-label">▼ Strategic direction, objectives, resources, audit results, corrective actions ▼</span>
      <span style="flex:1"></span>
      <span class="arrow-label">▲ Performance data, KPIs, NC trends, improvement opportunities ▲</span>
    </div>

    <!-- CORE flow row (with Customer columns) -->
    <div class="core-band">
      <div class="side-col left">← Customer Requirements</div>
      <div class="core-flow-area">
        ${coreFlowHtml}
      </div>
      <div class="side-col right">Customer Satisfaction →</div>
    </div>

    <!-- Arrow row: core ↔ support -->
    <div class="sup-arrow-row">
      <span class="arrow-label">▲ Competent people, maintained equipment, calibrated instruments, controlled documents, inspected product ▲</span>
      <span style="flex:1"></span>
      <span class="arrow-label">▼ Requirements, schedules, inspection data, training needs ▼</span>
    </div>

    <!-- SUPPORT band -->
    <div class="sup-band">
      <div class="band-title"><span class="arrow-ind">⬆</span> SUPPORT PROCESSES — Enable &amp; Sustain Core Process Performance <span class="arrow-ind">⬆</span></div>
      <div class="sup-boxes">${supProcs.map(p => supBox(p)).join("")}</div>
    </div>

  </div><!-- /frame -->

  <!-- Legend -->
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#ea6c19"></div> Core / Value-Adding Processes (sequential flow)</div>
    <div class="legend-item"><div class="legend-dot" style="background:#2563eb"></div> Management Processes (direction &amp; oversight)</div>
    <div class="legend-item"><div class="legend-dot" style="background:#15803d"></div> Support Processes (enable core performance)</div>
    <div class="legend-item">① ② ③ ④ ⑤ = Process sequence order</div>
    <div class="legend-item" style="color:#92400e">★ = Conditional process (applies when noted)</div>
  </div>

  <div class="doc-footer">
    <span>Core Compliance Hub · ISO Manager · Document: QMS-PIM-001</span>
    <span>CONFIDENTIAL — Internal Use Only</span>
    <span>Printed: ${today}</span>
  </div>

  </div><!-- /page-wrapper -->

  <div class="scale-notice" id="scale-notice" style="display:none"></div>
  <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>

  <script>
  (function() {
    function applyAutoScale() {
      var wrapper = document.getElementById('page-wrapper');
      if (!wrapper) return;

      // Page dimensions in px: letter landscape at 96 dpi minus margins
      // @page margin: 9mm top/bottom, 10mm left/right
      // Letter landscape = 11in × 8.5in = 1056px × 816px at 96dpi
      // Printable: 1056 - 2*(10mm/25.4*96) ≈ 1056 - 76 = 980px wide
      //            816  - 2*(9mm/25.4*96)  ≈ 816  - 68 = 748px tall
      var printW = 980;
      var printH = 748;

      var contentW = wrapper.scrollWidth;
      var contentH = wrapper.scrollHeight;

      var scaleW = contentW > printW ? printW / contentW : 1;
      var scaleH = contentH > printH ? printH / contentH : 1;
      var scale  = Math.min(scaleW, scaleH);

      if (scale < 0.999) {
        scale = Math.floor(scale * 100) / 100; // round down to nearest 1%
        var styleEl = document.getElementById('auto-scale-style');
        styleEl.textContent =
          '@media print { .page-wrapper { transform: scale(' + scale + '); transform-origin: top left; width: ' + (100 / scale) + '%; } }';

        // Also show a notice on screen
        var notice = document.getElementById('scale-notice');
        notice.style.display = 'block';
        notice.textContent = 'Auto-scaled to ' + Math.round(scale * 100) + '% — everything fits on one page';
      }
    }

    if (document.readyState === 'complete') {
      applyAutoScale();
    } else {
      window.addEventListener('load', applyAutoScale);
    }
  })();
  </script>
  </body></html>`;

  // Open in landscape-proportioned window so browser's print dialog defaults to landscape
  const w = window.open("", "_blank", "width=1200,height=850,scrollbars=yes,resizable=yes");
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
    @page { size: letter landscape; margin: 10mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 9pt; color: #1e3a5f; }
    .doc-header { display: flex; align-items: center; gap: 16px; border-bottom: 2.5px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 14px; }
    .logo-box { width: 224px; height: 224px; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden; }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
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
    <div class="logo-box"><img src="${precisionPartsLogoUrl}" alt="${project.orgName} logo" /></div>
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
  const qc = useQueryClient();
  const [schemeKey, setSchemeKey] = useState<string>(project.mapColorScheme ?? "navy-orange");
  const [showPicker, setShowPicker] = useState(false);
  const sch = MAP_COLOR_SCHEMES[schemeKey] ?? MAP_COLOR_SCHEMES["navy-orange"];

  const saveSchemeMutation = useMutation({
    mutationFn: (key: string) => apiRequest("PATCH", "/api/iso-projects", { mapColorScheme: key }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/iso-projects"] }),
  });

  const applyScheme = (key: string) => {
    setSchemeKey(key);
    setShowPicker(false);
    saveSchemeMutation.mutate(key);
  };

  // ── Add Process ─────────────────────────────────────────────────────────────
  const defaultRow = isIATF ? "COP" : "core";
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", owner: "", row: defaultRow, sites: ["PLANT"] as string[],
    clausesRaw: "", sequence: "", conditionalLabel: "", isConditional: false,
  });
  const [addSaving, setAddSaving] = useState(false);
  const { toast: pmToast } = useToast();

  const openAddForRow = (rowKey: string) => {
    setAddForm(f => ({ ...f, name: "", owner: "", row: rowKey, sites: ["PLANT"], clausesRaw: "", sequence: "", conditionalLabel: "", isConditional: false }));
    setShowAddProcess(true);
  };

  const handleAddProcess = async () => {
    if (!addForm.name.trim()) return;
    setAddSaving(true);
    try {
      const clauses = addForm.clausesRaw.split(",").map(c => c.trim()).filter(Boolean);
      const newProc: ProcessEntry = {
        name: addForm.name.trim(),
        owner: addForm.owner.trim(),
        row: addForm.row,
        site: isIATF ? addForm.sites : undefined,
        clauses,
        sequence: addForm.row === "COP" || addForm.row === "core" ? (parseInt(addForm.sequence) || processes.length + 1) : undefined,
        conditionalLabel: addForm.isConditional && addForm.conditionalLabel.trim() ? addForm.conditionalLabel.trim() : undefined,
        inputs: "", outputs: "", kpi: "",
      };
      const updated = [...processes, newProc];
      await apiRequest("PATCH", "/api/iso-projects", { processes: updated });
      qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      setShowAddProcess(false);
      pmToast({ title: `"${newProc.name}" added to ${addForm.row}`, description: "Click the process box to complete the Turtle Diagram." });
    } catch {
      pmToast({ title: "Could not add process", variant: "destructive" });
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteProcess = async (processName: string) => {
    if (!window.confirm(`Remove "${processName}" from this process map?\n\nThis action cannot be undone.`)) return;
    try {
      const updated = processes.filter(p => p.name !== processName);
      await apiRequest("PATCH", "/api/iso-projects", { processes: updated });
      qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      pmToast({ title: `"${processName}" removed`, description: "The process has been deleted from the map." });
    } catch {
      pmToast({ title: "Could not delete process", variant: "destructive" });
    }
  };

  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  // Band styling helpers — resolve IATF keys (COP/SOP/MOP) → color-scheme keys
  const colorKey = (rowKey: string) => IATF_TO_COLOR_KEY[rowKey] ?? rowKey;
  const bandStyle = (rowKey: string): React.CSSProperties => {
    const c = sch[colorKey(rowKey) as keyof typeof sch] as BandColors;
    return { backgroundColor: c?.bg ?? "#f9fafb", borderColor: c?.border ?? "#e5e7eb" };
  };
  const badgeStyle = (rowKey: string): React.CSSProperties => {
    const c = sch[colorKey(rowKey) as keyof typeof sch] as BandColors;
    return { backgroundColor: c?.badgeBg ?? "#374151", color: c?.badgeText ?? "#fff" };
  };

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
        {/* Company logo */}
        <div className="w-56 h-56 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
          <img src={precisionPartsLogoUrl} alt="Company logo" className="w-full h-full object-contain" />
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
        {/* Color scheme picker */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker(v => !v)}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: sch.core.seqBg, borderColor: sch.core.border, backgroundColor: sch.core.bg }}
            data-testid="button-color-scheme"
          >
            <Palette className="w-3.5 h-3.5" /> Theme
          </button>
          {showPicker && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-card border border-border rounded-xl shadow-2xl p-3 w-56">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Map Color Theme</p>
              {Object.entries(MAP_COLOR_SCHEMES).map(([key, scheme]) => (
                <div key={key}>
                  {key === "neutral-muted" && (
                    <div className="my-2 flex items-center gap-2">
                      <div className="flex-1 border-t border-border/50" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Site-chip focus</span>
                      <div className="flex-1 border-t border-border/50" />
                    </div>
                  )}
                  <button
                    onClick={() => applyScheme(key)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors text-left ${schemeKey === key ? "bg-muted" : "hover:bg-muted/50"}`}
                    data-testid={`scheme-option-${key}`}
                  >
                    <div className="flex gap-1 shrink-0">
                      {scheme.swatches.map((c, i) => (
                        <div key={i} className="w-3.5 h-3.5 rounded-full border border-border/30" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-primary flex-1">{scheme.label}</span>
                    {schemeKey === key && <span className="text-[10px] font-bold" style={{ color: sch.core.seqBg }}>✓</span>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => openAddForRow(defaultRow)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 hover:bg-accent/5 px-3 py-1.5 rounded-lg transition-colors"
          data-testid="button-add-process-to-map"
        >
          <Plus className="w-3.5 h-3.5" /> Add Process
        </button>
        <button
          onClick={() => printProcessMap(project, processes, rows, schemeKey)}
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

      {/* ─── Legend ─── */}
      <div className="mx-4 mt-3 flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-[11px]">
        <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Legend:</span>
        {isIATF ? (
          <>
            <span className="text-muted-foreground text-[10px] italic">Site assignment (shown on each process box):</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded leading-none">● Plant</span>
              <span className="text-muted-foreground">Plant only</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded leading-none">★ Remote</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Remote Site</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded leading-none">◆ Corp</span>
              <span className="font-semibold text-blue-700 dark:text-blue-400">Corporate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-violet-400 bg-violet-50 dark:bg-violet-950/20 inline-block" />
              <span className="font-semibold text-violet-700 dark:text-violet-400">Multi-site (Remote + Corp)</span>
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-border/40 bg-white dark:bg-card inline-block" /> Process box</span>
          </>
        )}
        <span className="ml-auto text-muted-foreground">Click any process to view Turtle Diagram</span>
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
      {/* ── Unified 3-band layout — ISO 4.4 compliant: sequence + interaction ── */}
      {/* Rows order: [0] Management/MOP → [1] Core/COP → [2] Support/SOP        */}
      {/* Inter-band arrows show BOTH directions of interaction per cl. 4.4.1(b)  */}
      <div className="space-y-0">
        {rows.map((row, rowIdx) => {
          const rowProcs = processes.filter(p => normalizeRow(p.row, p.name, project.standard!) === row.key);
          const isValueChain = row.key === "core" || row.key === "COP";
          const isMgt = row.key === "management" || row.key === "MOP";
          const sorted = isValueChain
            ? [...rowProcs].sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99))
            : rowProcs;

          // Labels for inter-band interaction rows (shown AFTER this band, before next)
          const interactionAfter: { down: string; up: string } | null =
            isMgt ? {
              down: isIATF
                ? "▼  Strategic direction · APQP authorization · Quality objectives · Approved resources · Audit directives"
                : "▼  Strategic direction · Quality objectives · Resources · Audit results · Corrective actions",
              up: isIATF
                ? "▲  Process KPIs · Customer satisfaction data · Internal audit results · CAPA status · Risk register updates"
                : "▲  Performance data · KPIs · NC trends · Improvement opportunities · Management review inputs",
            }
            : isValueChain ? {
              down: isIATF
                ? "▼  Production schedule · Calibration requirements · Inspection specs · Training needs · Work order releases"
                : "▼  Production requirements · Inspection needs · Training requests · Maintenance schedule",
              up: isIATF
                ? "▲  Competent personnel · Calibrated gauges · Maintained equipment · Approved suppliers · Controlled work instructions"
                : "▲  Competent people · Maintained equipment · Calibrated instruments · Controlled documents · Purchased materials",
            }
            : null; // No row after SOP/support

          return (
            <React.Fragment key={row.key}>
              {/* ── Band ── */}
              <div className="border-2 rounded-xl overflow-hidden" style={bandStyle(row.key)}>
                <div className="px-4 py-2.5 flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={badgeStyle(row.key)}>
                    {row.key}
                  </span>
                  <span className="text-base font-bold text-primary">{row.label}</span>
                  {isValueChain && (
                    <span className="text-xs text-muted-foreground font-medium">— sequence &amp; interaction flow · ISO 4.4</span>
                  )}
                  <span className="text-sm text-muted-foreground">{rowProcs.length} process{rowProcs.length !== 1 ? "es" : ""}</span>
                  <button
                    onClick={() => openAddForRow(row.key)}
                    className="ml-auto flex items-center gap-1 text-xs font-bold text-accent hover:bg-accent/10 border border-accent/25 hover:border-accent/50 px-2 py-0.5 rounded-lg transition-colors"
                    data-testid={`button-add-process-row-${row.key}`}
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="p-3 pt-0">
                  {rowProcs.length === 0 ? (
                    <div className="border-2 border-dashed border-border/30 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground/50">No processes assigned to this row</p>
                    </div>
                  ) : isValueChain ? (
                    /* ── Core / COP: horizontal numbered flow with arrows ── */
                    <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                      {sorted.map((p, i) => (
                        <div key={p.name} className="flex items-center gap-0 flex-shrink-0">
                          <div className="relative flex flex-col items-center" style={{ minWidth: 150 }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span
                                className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: sch.core.seqBg }}
                              >
                                {p.sequence ?? i + 1}
                              </span>
                              {p.conditionalLabel && (
                                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded px-1.5 py-0.5 leading-none">
                                  {p.conditionalLabel}
                                </span>
                              )}
                            </div>
                            <ProcessBox process={p} onClick={() => onSelectProcess(p)} onDelete={() => handleDeleteProcess(p.name)} standard={project.standard!} />
                          </div>
                          {i < sorted.length - 1 && (
                            <div className="flex flex-col items-center px-2 flex-shrink-0 self-center mt-7">
                              <ArrowRight className="w-6 h-6" style={{ color: sch.core.arrowHex }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ── Management / Support: responsive grid ── */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {sorted.map(p => (
                        <ProcessBox key={p.name} process={p} onClick={() => onSelectProcess(p)} onDelete={() => handleDeleteProcess(p.name)} standard={project.standard!} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Inter-band interaction row (ISO 4.4.1b — sequence & interaction) ── */}
              {interactionAfter && rowIdx < rows.length - 1 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 border-x-2 border-slate-200/60 dark:border-slate-700/40">
                  <div className="flex-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300 leading-tight">
                    {interactionAfter.down}
                  </div>
                  <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
                    <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                    <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 leading-tight text-right">
                    {interactionAfter.up}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
        </div>

        {/* Right: Customer Satisfaction */}
        <div className="w-20 shrink-0 flex items-center justify-center bg-green-50 dark:bg-green-950/20 border-l border-green-200 dark:border-green-800/40">
          <p className="text-[9px] font-black text-green-700 dark:text-green-300 uppercase tracking-widest" style={{ writingMode: "vertical-rl" }}>
            → Customer Satisfaction &amp; Interested Party Fulfillment
          </p>
        </div>
      </div>

      {/* ── Add Process Dialog ── */}
      <Dialog open={showAddProcess} onOpenChange={setShowAddProcess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <Plus className="w-4 h-4 text-accent" /> Add Process to Map
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Process Name <span className="text-red-500">*</span></label>
              <Input
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Product Design & Development"
                className="text-sm"
                data-testid="input-add-process-name"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Process Owner</label>
                <Input
                  value={addForm.owner}
                  onChange={e => setAddForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="e.g., Engineering Manager"
                  className="text-sm"
                  data-testid="input-add-process-owner"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Band / Row</label>
                <Select value={addForm.row} onValueChange={v => setAddForm(f => ({ ...f, row: v }))}>
                  <SelectTrigger className="text-sm" data-testid="select-add-process-row">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rows.map(r => (
                      <SelectItem key={r.key} value={r.key}>{r.key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">ISO Clause(s)</label>
                <Input
                  value={addForm.clausesRaw}
                  onChange={e => setAddForm(f => ({ ...f, clausesRaw: e.target.value }))}
                  placeholder="e.g., 8.3, 8.3.1"
                  className="text-sm"
                  data-testid="input-add-process-clauses"
                />
              </div>
              {(addForm.row === "COP" || addForm.row === "core") && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Sequence #</label>
                  <Input
                    value={addForm.sequence}
                    onChange={e => setAddForm(f => ({ ...f, sequence: e.target.value }))}
                    placeholder="e.g., 4"
                    type="number"
                    min={1}
                    className="text-sm"
                    data-testid="input-add-process-sequence"
                  />
                </div>
              )}
            </div>
            {isIATF && (
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Site Assignment <span className="text-muted-foreground/60 font-normal">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {IATF_SITES.map(s => {
                    const checked = addForm.sites.includes(s.key);
                    return (
                      <label key={s.key} className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${checked ? "bg-accent text-white border-accent" : "border-border/60 text-muted-foreground hover:border-accent/40"}`} data-testid={`checkbox-add-site-${s.key.toLowerCase()}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setAddForm(f => {
                              const next = checked
                                ? f.sites.filter(x => x !== s.key)
                                : [...f.sites, s.key];
                              return { ...f, sites: next.length ? next : ["PLANT"] };
                            });
                          }}
                          className="sr-only"
                        />
                        {s.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addForm.isConditional}
                  onChange={e => setAddForm(f => ({ ...f, isConditional: e.target.checked }))}
                  className="rounded"
                  data-testid="checkbox-add-process-conditional"
                />
                Conditional process (only applies in certain situations)
              </label>
              {addForm.isConditional && (
                <Input
                  value={addForm.conditionalLabel}
                  onChange={e => setAddForm(f => ({ ...f, conditionalLabel: e.target.value }))}
                  placeholder="e.g., When design is in scope"
                  className="text-sm mt-1.5"
                  data-testid="input-add-process-conditional-label"
                />
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleAddProcess}
                disabled={addSaving || !addForm.name.trim()}
                className="flex-1 bg-accent hover:bg-accent/90 text-white gap-1.5"
                data-testid="button-confirm-add-process"
              >
                {addSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {addSaving ? "Adding…" : "Add to Map"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddProcess(false)} data-testid="button-cancel-add-process">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Turtle Diagram Field ──────────────────────────────────────────────────────
function TurtleField({ label, icon: Icon, value, placeholder, onChange, multiline = false, color }: {
  label: string; icon: React.ComponentType<{ className?: string }>; value: string; placeholder: string;
  onChange: (v: string) => void; multiline?: boolean; color: string;
}) {
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow: recalculate height whenever value changes
  React.useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className={`rounded-xl border-2 p-3 ${color}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      {multiline ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full text-xs resize-none overflow-hidden bg-white/60 dark:bg-black/20 border border-border/40 rounded-md px-3 py-2 leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
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
  const [isFillingWithIsa, setIsFillingWithIsa] = useState(false);
  const [isaKpiSuggestions, setIsaKpiSuggestions] = useState<Array<{ name: string; target: string; unit: string }>>([]);

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

  const handleFillWithIsa = async () => {
    setIsFillingWithIsa(true);
    setIsaKpiSuggestions([]);
    try {
      // Fetch existing documents and existing KPIs in parallel
      let existingDocs: Array<{ title: string; docType: string; docNumber?: string; isoClause?: string }> = [];
      try {
        const docsRes = await fetch(`/api/iso-documents?isoProjectId=${project.id}`, { credentials: "include" });
        if (docsRes.ok) {
          const allDocs = await docsRes.json();
          existingDocs = (allDocs as any[]).map((d: any) => ({
            title: d.title, docType: d.docType, docNumber: d.docNumber, isoClause: d.isoClause,
          }));
        }
      } catch { /* non-fatal */ }

      // Pass existing KPIs so Isa doesn't duplicate them and can suggest complementary ones
      const existingKpis = objectives.map(o => ({
        name: o.name,
        target: o.target ?? "",
        unit: o.unit ?? "",
      }));

      const res = await fetch("/api/iso-processes/generate-turtle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          processName: local.name,
          owner: local.owner,
          clauses: local.clauses,
          row: local.row,
          site: local.site,
          inputs: local.inputs,
          outputs: local.outputs,
          resources: local.resources,
          keyActivities: local.keyActivities,
          startingPoint: local.startingPoint,
          endPoint: local.endPoint,
          risksAndOpportunities: local.risksAndOpportunities,
          documentedInfo: local.documentedInfo,
          executors: local.executors,
          csrReq: local.csrReq,
          orgName: project.orgName,
          standard: project.standard,
          productsServices: project.productsServices,
          totalEmployees: project.totalEmployees,
          hasDesign: project.hasDesignResponsibility,
          existingDocs,
          existingKpis,
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setLocal(prev => ({
        ...prev,
        inputs: data.inputs ?? prev.inputs,
        startingPoint: data.startingPoint ?? prev.startingPoint,
        outputs: data.outputs ?? prev.outputs,
        endPoint: data.endPoint ?? prev.endPoint,
        resources: data.resources ?? prev.resources,
        executors: data.executors ?? prev.executors,
        keyActivities: data.keyActivities ?? prev.keyActivities,
        risksAndOpportunities: data.risksAndOpportunities ?? prev.risksAndOpportunities,
        documentedInfo: data.documentedInfo ?? prev.documentedInfo,
        ...(isIATF && data.csrReq ? { csrReq: data.csrReq } : {}),
      }));
      if (Array.isArray(data.suggestedKpis) && data.suggestedKpis.length > 0) {
        setIsaKpiSuggestions(data.suggestedKpis);
      }
      toast({ title: "Isa's suggestions are ready", description: "Review each field and adjust as needed, then Save." });
    } catch {
      toast({ title: "Isa couldn't complete the diagram", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setIsFillingWithIsa(false);
    }
  };

  const handleDeleteSelf = async () => {
    if (!window.confirm(`Remove "${process.name}" from this process map?\n\nThis action cannot be undone.`)) return;
    try {
      const all = (project.processes || []) as ProcessEntry[];
      const updated = all.filter(p => p.name !== process.name);
      await patchProjectMut.mutateAsync(updated);
      toast({ title: `"${process.name}" deleted`, description: "The process has been removed from the map." });
      onBack();
    } catch {
      toast({ title: "Could not delete process", variant: "destructive" });
    }
  };

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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header — pinned at top; content scrolls below */}
      <div className="shrink-0 bg-white dark:bg-card border-b border-border/60 px-4 py-3 flex items-center gap-3 shadow-sm z-10">
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
          <Button
            size="sm"
            variant="outline"
            onClick={handleFillWithIsa}
            disabled={isFillingWithIsa}
            className="gap-1.5 h-7 text-xs bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 font-bold dark:bg-violet-950/30 dark:border-violet-800/40 dark:text-violet-300 disabled:opacity-60"
            data-testid="button-isa-fill-turtle"
          >
            {isFillingWithIsa ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isFillingWithIsa ? "Isa is thinking…" : "Ask Isa to Suggest"}
          </Button>
          <button
            onClick={() => printTurtleDiagram(local, project, objectives)}
            className="flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors h-7"
            data-testid="button-print-turtle"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={handleDeleteSelf}
            className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1 rounded-lg transition-colors h-7"
            data-testid="button-delete-turtle"
            title="Delete this process from the map"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-7 text-xs" data-testid="button-save-turtle">
            <Save className="w-3 h-3" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">

        {/* (KPI suggestions are now shown inside the Objectives panel below) */}

        {/* Top Row: Resources | Objectives */}
        <div className="grid grid-cols-2 gap-3">
          <TurtleField
            label="Resources" icon={Zap} placeholder="Machines, tools, equipment, technology…"
            value={local.resources || ""} onChange={set("resources")}
            multiline color="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800/40 dark:text-blue-100"
          />
          {/* Objectives panel */}
          <div className="bg-amber-50 border-2 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-300">Quality Objectives / KPIs</span>
              <button onClick={() => setAddingKpi(true)} className="ml-auto text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors" data-testid="button-add-kpi">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-amber-700/60 dark:text-amber-400/50 mb-2 leading-tight">
              Linked to Measurement &amp; Monitoring and Management Review
            </p>
            <div className="space-y-1.5">
              {objectives.map(obj => (
                <ObjectiveRow
                  key={obj.id}
                  obj={obj}
                  onDelete={() => deleteObjMut.mutate(obj.id)}
                  onChange={(field, val) => updateObjMut.mutate({ id: obj.id, field, val })}
                />
              ))}
              {/* Isa KPI suggestions — shown inline in this panel */}
              {isaKpiSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 pt-0.5">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide">Isa suggests</span>
                    <button onClick={() => setIsaKpiSuggestions([])} className="ml-auto text-muted-foreground hover:text-foreground" data-testid="button-dismiss-isa-kpis">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {isaKpiSuggestions.map((kpi, i) => (
                    <div
                      key={i}
                      className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-700/50 rounded-lg p-2 flex items-center gap-2"
                      data-testid={`kpi-suggestion-${i}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-violet-900 dark:text-violet-200 truncate">{kpi.name}</div>
                        {kpi.target && (
                          <div className="text-[10px] text-violet-600 dark:text-violet-400">Target: {kpi.target}{kpi.unit ? ` ${kpi.unit}` : ""}</div>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await fetch("/api/iso-objectives/upsert", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              processName: process.name,
                              name: kpi.name,
                              target: kpi.target,
                              unit: kpi.unit,
                              responsible: local.owner,
                              isoProjectId: project.id,
                            }),
                          });
                          qc.invalidateQueries({ queryKey: ["/api/iso-objectives"] });
                          setIsaKpiSuggestions(prev => prev.filter((_, j) => j !== i));
                          toast({ title: `KPI added: "${kpi.name}"`, description: "Now tracked in M&M and Management Review." });
                        }}
                        className="shrink-0 text-[10px] font-bold bg-violet-600 hover:bg-violet-700 text-white px-2 py-1 rounded transition-colors"
                        data-testid={`button-accept-kpi-${i}`}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setIsaKpiSuggestions(prev => prev.filter((_, j) => j !== i))}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-skip-kpi-${i}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {objectives.length === 0 && isaKpiSuggestions.length === 0 && !addingKpi && (
                <p className="text-[10px] text-muted-foreground text-center py-2">No KPIs yet — click + to add or use Ask Isa to Suggest</p>
              )}
              {addingKpi && (
                <div className="bg-white dark:bg-card rounded-lg p-2 border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                  <Input value={newKpiName} onChange={e => setNewKpiName(e.target.value)} placeholder="KPI name (e.g. On-Time Delivery)" className="h-6 text-xs" data-testid="input-new-kpi-name" />
                  <div className="flex gap-1.5">
                    <Input value={newKpiTarget} onChange={e => setNewKpiTarget(e.target.value)} placeholder="Target (e.g. 95)" className="h-6 text-xs flex-1" data-testid="input-new-kpi-target" />
                    <Input value={newKpiUnit} onChange={e => setNewKpiUnit(e.target.value)} placeholder="Unit (e.g. %)" className="h-6 text-xs w-20" data-testid="input-new-kpi-unit" />
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

        {/* IATF Site Assignment — multi-select */}
        {isIATF && (
          <div className="bg-muted/30 border border-border/60 rounded-xl p-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Site Assignment (IATF)</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Select all sites where this process applies</p>
            <div className="flex flex-wrap gap-2">
              {IATF_SITES.map(s => {
                const currentSites = normalizeSites(local.site);
                const checked = currentSites.includes(s.key);
                return (
                  <label
                    key={s.key}
                    className={`flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${checked ? "bg-accent text-white border-accent" : "border-border/60 text-muted-foreground hover:border-accent/40"}`}
                    data-testid={`checkbox-site-${s.key.toLowerCase()}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const current = normalizeSites(local.site);
                        const next = checked
                          ? current.filter(x => x !== s.key)
                          : [...current, s.key];
                        setLocal(prev => ({ ...prev, site: next.length ? next : ["PLANT"] }));
                      }}
                      className="sr-only"
                    />
                    {s.label}
                  </label>
                );
              })}
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${normalizeRow(local.row, local.name, project.standard!) === r.key ? "bg-accent text-white border-accent" : "border-border/60 text-muted-foreground hover:border-accent/40"}`}
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
