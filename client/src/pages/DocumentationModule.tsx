import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  FileText, 
  Search, 
  MoreHorizontal, 
  MessageSquare,
  Pencil,
  Trash2,
  BookOpen,
  GitBranch,
  ClipboardList,
  Wrench,
  Layout,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileMinus,
  Map as MapIcon,
  X,
  Printer,
  GitMerge,
  History,
  ShieldCheck,
  Ban,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Bell,
  Mail,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Paperclip,
  ChevronRight,
  List,
  ScrollText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ClipboardCheck,
  FileSearch,
  BadgeCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { IsoDocument, InsertIsoDocument, IsoProject, DocChangeRequest } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentationModuleProps {
  onAskIsa: (prompt: string) => void;
}

type ComplianceRequirement = {
  requirement: string;
  status: "Met" | "Partially Met" | "Not Met";
  finding: string;
};

type ComplianceResult = {
  verdict: "Compliant" | "Partially Compliant" | "Non-Compliant";
  summary: string;
  requirements: ComplianceRequirement[];
  recommendations: string[];
  checkedAt?: string;
};

// ─── Print helper ─────────────────────────────────────────────────────────────

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1");
}

function normalizeContentForEdit(content: string): string {
  return content
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      // Convert ### Heading → plain heading text
      const mdH = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (mdH) return mdH[2].trim();
      // Strip inline bold/italic markers
      return stripInlineMarkdown(line);
    })
    .join("\n");
}

function formatDocContentForPrint(content: string): string {
  const lines = content.split("\n");
  let html = "";
  let inList = false;
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inTable) { html += "</table>"; inTable = false; }
      html += "<div style='height:8px'></div>";
      continue;
    }

    // ── Markdown heading stripping: ### ## # → section headings ──────────────
    const mdHeading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (mdHeading) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inTable) { html += "</table>"; inTable = false; }
      const level = mdHeading[1].length;
      const text = stripInlineMarkdown(mdHeading[2]);
      if (level === 1) {
        html += `<div class="section-h1">${text}</div>`;
      } else if (level === 2) {
        html += `<div class="section-h2">${text}</div>`;
      } else {
        html += `<div class="section-h3">${text}</div>`;
      }
      continue;
    }

    // ── Markdown horizontal rule ───────────────────────────────────────────────
    if (/^[-*_]{3,}$/.test(trimmed)) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inTable) { html += "</table>"; inTable = false; }
      html += `<div class="divider"></div>`;
      continue;
    }

    // Numbered sections: "4 Context", "5.1 Leadership", "1. PURPOSE", "1  REVISION SHEET"
    // Optional punctuation after number so both "4 Context" and "4. Context" are caught.
    const sectionMatch = trimmed.match(/^(\d+(?:\.\d+)*)[.)]?\s+(.+)$/);
    if (sectionMatch && trimmed.length < 120) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inTable) { html += "</table>"; inTable = false; }
      const level = sectionMatch[1].split(".").length;
      const text = stripInlineMarkdown(sectionMatch[2]);
      if (level === 1) {
        html += `<div class="section-h1"><span class="sec-num">${sectionMatch[1]}</span>${text}</div>`;
      } else if (level === 2) {
        html += `<div class="section-h2">${sectionMatch[1]}  ${text}</div>`;
      } else {
        html += `<div class="section-h3">${sectionMatch[1]}  ${text}</div>`;
      }
      continue;
    }

    // ── ALL-CAPS standalone headings ──────────────────────────────────────────
    if (/^[A-Z][A-Z\s&\/\-:]+$/.test(trimmed) && trimmed.length > 4 && trimmed.length < 80) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inTable) { html += "</table>"; inTable = false; }
      html += `<div class="section-h2">${trimmed}</div>`;
      continue;
    }

    // ── Table rows (pipe-delimited) ───────────────────────────────────────────
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (inList) { html += "</ul>"; inList = false; }
      const isSeparator = /^\|[\s\-:|]+\|/.test(trimmed);
      if (isSeparator) continue;
      const cells = trimmed.split("|").filter(c => c.trim());
      if (!inTable) {
        html += `<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:9pt;">`;
        inTable = true;
      }
      html += `<tr>${cells.map(c => `<td style="padding:5px 8px;border:1px solid #d0dae8;">${stripInlineMarkdown(c.trim())}</td>`).join("")}</tr>`;
      continue;
    }
    if (inTable) { html += "</table>"; inTable = false; }

    // ── Bullet/list items ─────────────────────────────────────────────────────
    if (/^[-•*▪]\s/.test(trimmed) || /^[a-h]\)\s/.test(trimmed)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${stripInlineMarkdown(trimmed.replace(/^[-•*▪a-h\)]+\s+/, ""))}</li>`;
      continue;
    }

    // ── NOTE / IMPORTANT callouts ─────────────────────────────────────────────
    if (/^NOTE\s*\d*[\s:–—]/.test(trimmed) || /^IMPORTANT[\s:–—]/.test(trimmed)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<div class="note">${stripInlineMarkdown(trimmed)}</div>`;
      continue;
    }

    if (inList) { html += "</ul>"; inList = false; }
    html += `<p>${stripInlineMarkdown(trimmed)}</p>`;
  }

  if (inList) html += "</ul>";
  if (inTable) html += "</table>";
  return html;
}

function printIsoDocument(doc: IsoDocument, project: IsoProject | null) {
  const orgName = project?.orgName ?? "Organization";
  const standard = project?.standard ?? "ISO 9001";
  const logoUrl = (project as any)?.logoUrl as string | undefined;
  const dateStr = new Date(doc.updatedAt || doc.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const docTypeLbl = doc.docType?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Document";

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName} logo" style="max-height:60px;max-width:160px;object-fit:contain;" />`
    : `<div style="font-size:16pt;font-weight:800;color:#1e3a5f;">${orgName}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${doc.title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
    body {
      font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 10.5pt; color: #1a1a1a; background:#fff; line-height:1.65;
    }
    .page { max-width:8.5in; margin:0 auto; padding:0.6in 0.9in; }

    /* ── Header ── */
    .doc-header {
      display:flex; justify-content:space-between; align-items:flex-end;
      padding-bottom:12px; border-bottom:3px solid #1e3a5f; margin-bottom:20px;
    }
    .doc-header-right { text-align:right; font-size:8.5pt; color:#555; }
    .doc-header-right .doc-num { font-size:9pt; font-weight:700; color:#1e3a5f; }

    /* ── Title block ── */
    .title-band {
      background:#1e3a5f; color:#fff;
      padding:14px 20px; border-radius:6px 6px 0 0;
      margin-bottom:0;
    }
    .title-band .doc-type {
      font-size:8pt; text-transform:uppercase; letter-spacing:0.12em; opacity:0.8; margin-bottom:4px;
    }
    .title-band .doc-title { font-size:17pt; font-weight:800; line-height:1.2; }
    .meta-row {
      background:#f0f4fa; border:1px solid #d0dae8; border-top:none;
      padding:10px 20px; border-radius:0 0 6px 6px;
      display:flex; flex-wrap:wrap; gap:20px;
      font-size:8.5pt; color:#444; margin-bottom:22px;
    }
    .meta-item .lbl { font-weight:700; color:#1e3a5f; margin-right:4px; }
    .std-badge {
      background:#ea6c19; color:#fff;
      font-size:7.5pt; font-family:monospace; font-weight:700;
      padding:3px 10px; border-radius:10px; margin-left:auto;
    }

    /* ── Revision Table ── */
    .rev-table { width:100%; border-collapse:collapse; margin-bottom:22px; font-size:9pt; }
    .rev-table th {
      background:#1e3a5f; color:#fff; font-weight:700;
      padding:7px 10px; text-align:left; font-size:8pt; letter-spacing:0.04em;
    }
    .rev-table td { padding:6px 10px; border-bottom:1px solid #e0e8f0; }
    .rev-table tr:nth-child(even) td { background:#f7f9fc; }

    /* ── Table of Contents ── */
    .toc-title {
      font-size:11pt; font-weight:800; color:#1e3a5f;
      text-transform:uppercase; letter-spacing:0.06em;
      margin-bottom:10px; padding-bottom:5px;
      border-bottom:1.5px solid #e0e8f0;
    }
    .toc-entry { display:flex; justify-content:space-between; font-size:9pt; padding:3px 0; }
    .toc-entry .toc-title-text { color:#1a1a1a; }
    .toc-entry .toc-dots { flex:1; border-bottom:1px dotted #ccc; margin:0 8px; }
    .toc-entry .toc-page { color:#1e3a5f; font-weight:600; }

    /* ── Content ── */
    .divider { border-top:1px solid #d0dae8; margin:18px 0; }
    .section-h1 {
      font-size:13pt; font-weight:800; color:#1e3a5f;
      margin-top:26px; margin-bottom:10px;
      padding:8px 14px; background:#f0f4fa;
      border-left:4px solid #1e3a5f; border-radius:0 4px 4px 0;
      display:flex; align-items:center; gap:10px;
    }
    .sec-num {
      display:inline-flex; align-items:center; justify-content:center;
      min-width:22px; height:22px; border-radius:11px;
      background:#1e3a5f; color:#fff;
      font-size:9pt; font-weight:800; flex-shrink:0; padding:0 5px;
    }
    .section-h2 {
      font-size:10.5pt; font-weight:700; color:#1e3a5f;
      margin-top:18px; margin-bottom:7px;
      padding-bottom:4px; border-bottom:1.5px solid #e0e8f0;
    }
    .section-h3 {
      font-size:10pt; font-weight:700; color:#444;
      margin-top:12px; margin-bottom:5px;
    }
    p { margin-bottom:6px; }
    ul { margin-left:20px; margin-bottom:8px; }
    li { margin-bottom:3px; }
    li::marker { color:#ea6c19; }
    table { width:100%; border-collapse:collapse; margin:10px 0; font-size:9pt; }
    td { padding:5px 8px; border:1px solid #d0dae8; }
    .note {
      background:#fff8f0; border-left:3px solid #ea6c19;
      padding:8px 12px; margin:10px 0; font-size:9pt;
      color:#6b4800; border-radius:0 4px 4px 0;
    }

    /* ── Footer ── */
    .doc-footer {
      margin-top:40px; padding-top:10px;
      border-top:1px solid #e0e0e0;
      display:flex; justify-content:space-between;
      font-size:7.5pt; color:#999;
    }
    .doc-footer strong { color:#ea6c19; }

    /* ── Print ── */
    @media print {
      body { font-size:10pt; }
      .page { padding:0.4in 0.7in; }
      @page { margin:0.4in; size:letter portrait; }
      .section-h1, .toc-title { break-after:avoid; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="doc-header">
    <div>${logoHtml}</div>
    <div class="doc-header-right">
      <div class="doc-num">${docTypeLbl}</div>
      <div>Rev. ${doc.version ?? 1} · ${standard}</div>
      <div>${dateStr}</div>
    </div>
  </div>

  <div class="title-band">
    <div class="doc-type">${docTypeLbl}</div>
    <div class="doc-title">${doc.title}</div>
  </div>
  <div class="meta-row">
    <div class="meta-item"><span class="lbl">Organization:</span>${orgName}</div>
    ${doc.isoClause ? `<div class="meta-item"><span class="lbl">ISO Clause:</span>${doc.isoClause}</div>` : ""}
    <div class="meta-item"><span class="lbl">Status:</span>${doc.status ?? "Draft"}</div>
    <span class="std-badge">${standard}</span>
  </div>

  <div class="divider"></div>

  <div class="content">
    ${formatDocContentForPrint(doc.content ?? "")}
  </div>

  <div class="doc-footer">
    <span>Generated by <strong>ACSI ISO Manager</strong> · ${standard}</span>
    <span>${orgName} · ${doc.title} · Rev.${doc.version ?? 1}</span>
  </div>
</div>
<script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) { win.document.write(html); win.document.close(); }
}

const DOC_TYPES = [
  { value: 'quality_manual', label: 'Quality Manual', icon: BookOpen },
  { value: 'process_map', label: 'Process Map', icon: GitBranch },
  { value: 'procedure', label: 'Procedure', icon: ClipboardList },
  { value: 'work_instruction', label: 'Work Instruction', icon: Wrench },
  { value: 'template', label: 'Format Template', icon: Layout },
  { value: 'other', label: 'Other', icon: FileText },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'obsolete', label: 'Obsolete' },
];

// ─── Inline line-level diff ─────────────────────────────────────────────────
type DiffLine = { type: 'same' | 'removed' | 'added'; text: string };

function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const old = oldText.split('\n');
  const nw = newText.split('\n');
  const m = old.length, n = nw.length;
  const MAX = 400; // guard against pathologically large docs
  if (m > MAX || n > MAX) {
    return [
      ...old.slice(0, MAX).map(t => ({ type: 'removed' as const, text: t })),
      ...nw.slice(0, MAX).map(t => ({ type: 'added' as const, text: t })),
    ];
  }
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = old[i - 1] === nw[j - 1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && old[i-1] === nw[j-1]) { result.unshift({ type: 'same', text: old[i-1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { result.unshift({ type: 'added', text: nw[j-1] }); j--; }
    else { result.unshift({ type: 'removed', text: old[i-1] }); i--; }
  }
  return result;
}

// Adjust this threshold (characters) to change when the summary view activates.
// At 8 000 chars a full line-diff is typically 300+ changed lines — too many to scan.
const LARGE_DOC_THRESHOLD = 8000;

function splitDocIntoSections(text: string): Array<{ heading: string; content: string }> {
  const lines = text.split('\n');
  // Recognises: Markdown headings (# … ######), ISO/IATF clause numbers (4.1.2 …),
  // plain clause numbers (4 Context), and "Section N" / "SECTION N" prefixes.
  const isHeading = (l: string) =>
    /^#{1,6}\s/.test(l) ||
    /^(\d+\.)+\d*\s/.test(l.trim()) ||
    /^\d+\s+[A-Z]/.test(l.trim()) ||
    /^(?:Section|SECTION|Clause|CLAUSE)\s+\d/i.test(l.trim());
  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = 'Preamble';
  let currentLines: string[] = [];
  for (const line of lines) {
    if (isHeading(line.trim())) {
      if (currentLines.some(l => l.trim())) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n') });
      }
      currentHeading = line.trim().replace(/^#{1,6}\s*/, '');
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.some(l => l.trim())) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n') });
  }
  return sections;
}

function computeRevisionSummary(oldText: string, newText: string): { section: string; removedCount: number; addedCount: number; isNew?: boolean; isRemoved?: boolean }[] {
  const oldSections = splitDocIntoSections(oldText);
  const newSections = splitDocIntoSections(newText);

  // Build position-aware keys to handle duplicate section headings correctly.
  // Key format: "<heading>::<occurrence-index>" so two "Introduction" sections
  // are treated as separate entries rather than collapsed into one.
  const makeKey = (sections: Array<{ heading: string }>, idx: number): string => {
    const heading = sections[idx].heading;
    const prior = sections.slice(0, idx).filter(s => s.heading === heading).length;
    return prior === 0 ? heading : `${heading} (${prior + 1})`;
  };

  const newMap = new Map(newSections.map((s, i) => [makeKey(newSections, i), s.content]));

  const results: { section: string; removedCount: number; addedCount: number; isNew?: boolean; isRemoved?: boolean }[] = [];
  const oldKeys = new Set<string>();

  for (let i = 0; i < oldSections.length; i++) {
    const key = makeKey(oldSections, i);
    const displayHeading = oldSections[i].heading;
    const content = oldSections[i].content;
    oldKeys.add(key);

    const newContent = newMap.get(key);
    if (newContent === undefined) {
      const removed = content.split('\n').filter(l => l.trim()).length;
      results.push({ section: displayHeading, removedCount: removed, addedCount: 0, isRemoved: true });
    } else if (newContent !== content) {
      const oldLines = content.split('\n').filter(l => l.trim());
      const newLines = newContent.split('\n').filter(l => l.trim());
      const oldSet = new Set(oldLines);
      const newSet = new Set(newLines);
      const removed = oldLines.filter(l => !newSet.has(l)).length;
      const added = newLines.filter(l => !oldSet.has(l)).length;
      if (removed > 0 || added > 0) {
        results.push({ section: displayHeading, removedCount: removed, addedCount: added });
      }
    }
  }

  for (let i = 0; i < newSections.length; i++) {
    const key = makeKey(newSections, i);
    if (!oldKeys.has(key)) {
      const added = newSections[i].content.split('\n').filter(l => l.trim()).length;
      results.push({ section: newSections[i].heading, removedCount: 0, addedCount: added, isNew: true });
    }
  }

  return results.length > 0 ? results : [{ section: 'Minor formatting changes', removedCount: 0, addedCount: 0 }];
}

function RevisionSummaryView({ oldText, newText }: { oldText: string; newText: string }) {
  const summary = computeRevisionSummary(oldText, newText);
  return (
    <div className="space-y-1.5" data-testid="container-revision-summary">
      {summary.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2 bg-white dark:bg-card border border-violet-100 dark:border-violet-800/30 rounded-lg px-3 py-2">
          <FileText className="w-3.5 h-3.5 mt-0.5 text-violet-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-medium text-foreground truncate" title={item.section}>{item.section}</p>
              {item.isNew && <span className="text-[9px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/40 rounded px-1">NEW</span>}
              {item.isRemoved && <span className="text-[9px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded px-1">REMOVED</span>}
            </div>
            <div className="flex gap-2 mt-0.5">
              {item.removedCount > 0 && (
                <span className="text-[10px] text-red-600 dark:text-red-400">−{item.removedCount} line{item.removedCount !== 1 ? 's' : ''}</span>
              )}
              {item.addedCount > 0 && (
                <span className="text-[10px] text-green-600 dark:text-green-400">+{item.addedCount} line{item.addedCount !== 1 ? 's' : ''}</span>
              )}
              {item.removedCount === 0 && item.addedCount === 0 && (
                <span className="text-[10px] text-muted-foreground italic">formatting only</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LineDiffView({ oldText, newText }: { oldText: string; newText: string }) {
  const lines = computeLineDiff(oldText, newText);
  const hasChanges = lines.some(l => l.type !== 'same');
  if (!hasChanges) return <p className="text-xs text-muted-foreground italic">No differences detected.</p>;
  return (
    <div className="font-mono text-[11px] leading-relaxed overflow-x-auto">
      {lines.map((line, idx) => {
        if (line.type === 'same') return null;
        return (
          <div
            key={idx}
            className={
              line.type === 'added'
                ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 border-l-2 border-green-500 pl-2 py-0.5 whitespace-pre-wrap'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 line-through border-l-2 border-red-400 pl-2 py-0.5 whitespace-pre-wrap'
            }
          >
            <span className="mr-1 select-none opacity-60">{line.type === 'added' ? '+' : '−'}</span>
            {line.text || ' '}
          </div>
        );
      })}
    </div>
  );
}

export function DocumentationModule({ onAskIsa }: DocumentationModuleProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<IsoDocument | null>(null);
  const [draftDoc, setDraftDoc] = useState<IsoDocument | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftContext, setDraftContext] = useState("");
  const [isExtractingCard, setIsExtractingCard] = useState(false);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<{ docId: number; content: string; version: string } | null>(null);
  const [draftIsRevision, setDraftIsRevision] = useState(false);
  const [isaAcceptReason, setIsaAcceptReason] = useState("AI-assisted revision by Isa");
  const [isAcceptingIsaDraft, setIsAcceptingIsaDraft] = useState(false);
  const [prevShowExpanded, setPrevShowExpanded] = useState(false);
  const [showFullDiff, setShowFullDiff] = useState(false);
  const [isaNote, setIsaNote] = useState("");
  const [formReviewOpen, setFormReviewOpen] = useState(false);
  const [formReviewText, setFormReviewText] = useState("");
  const [formReviewClause, setFormReviewClause] = useState("");
  const [formReviewDocType, setFormReviewDocType] = useState("procedure");
  const [formReviewResult, setFormReviewResult] = useState("");
  const [isReviewingForm, setIsReviewingForm] = useState(false);
  const [formReviewFileName, setFormReviewFileName] = useState("");
  const [isExtractingFormFile, setIsExtractingFormFile] = useState(false);
  const formReviewFileRef = useRef<HTMLInputElement>(null);
  const [changeReqDoc, setChangeReqDoc] = useState<IsoDocument | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const [complianceResults, setComplianceResults] = useState<globalThis.Map<number, ComplianceResult>>(new globalThis.Map());
  const [runningComplianceChecks, setRunningComplianceChecks] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<IsoDocument[]>({
    queryKey: ["/api/iso-documents"],
  });

  useEffect(() => {
    if (!documents) return;
    setComplianceResults(prev => {
      const next: globalThis.Map<number, ComplianceResult> = new globalThis.Map(prev);
      for (const doc of documents) {
        if (doc.complianceResult) {
          next.set(doc.id, {
            ...(doc.complianceResult as ComplianceResult),
            checkedAt: doc.complianceCheckedAt ? new Date(doc.complianceCheckedAt.toString()).toISOString() : undefined,
          });
        } else {
          next.delete(doc.id);
        }
      }
      return next;
    });
  }, [documents]);

  const { data: project } = useQuery<IsoProject | null>({
    queryKey: ["/api/iso-projects"],
  });

  const { data: changeRequests } = useQuery<any[]>({
    queryKey: ["/api/doc-change-requests"],
  });

  const pendingCount = changeRequests?.filter(r => r.status === "pending").length ?? 0;

  const submitChangeMutation = useMutation({
    mutationFn: async (payload: { docId: number; data: any }) => {
      const res = await apiRequest("POST", `/api/iso-documents/${payload.docId}/change-requests`, payload.data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doc-change-requests"] });
      setChangeReqDoc(null);
      toast({ title: "Change Request Submitted", description: "Document moved to In Review. Awaiting approval." });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async (payload: { requestId: number; reviewedBy: string; reviewerComments: string }) => {
      const res = await apiRequest("PATCH", `/api/doc-change-requests/${payload.requestId}/approve`, payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doc-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iso-awareness-notices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/change-control-log"] });
      setReviewingRequest(null);
      toast({
        title: `✓ Approved — now Rev. ${data.newVersion}`,
        description: data.trainingTriggered
          ? "Document version bumped and training notice sent to affected departments."
          : "Document version bumped and approved.",
      });
    },
    onError: (e: any) => toast({ title: "Approval Failed", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (payload: { requestId: number; reviewedBy: string; reviewerComments: string }) => {
      const res = await apiRequest("PATCH", `/api/doc-change-requests/${payload.requestId}/reject`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doc-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/change-control-log"] });
      setReviewingRequest(null);
      toast({ title: "Change Request Rejected", description: "Document returned to Approved status." });
    },
    onError: (e: any) => toast({ title: "Reject Failed", description: e.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertIsoDocument) => {
      const res = await apiRequest("POST", "/api/iso-documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      setIsDialogOpen(false);
      toast({ title: "Success", description: "Document created successfully." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertIsoDocument> }) => {
      const res = await apiRequest("PATCH", `/api/iso-documents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      setSelectedDoc(null);
      toast({ title: "Success", description: "Document updated successfully." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/iso-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      setSelectedDoc(null);
      toast({ title: "Success", description: "Document deleted." });
    },
  });

  const filteredDocuments = documents?.filter(doc => 
    activeTab === "all" || doc.docType === activeTab
  );

  const handleDraftWithIsa = (doc: IsoDocument) => {
    setDraftDoc(doc);
    setDraftContent("");
    setDraftContext("");
    setDraftReady(false);
    setIsDrafting(false);
    setDraftIsRevision(false);
    setPrevShowExpanded(false);
    setShowFullDiff(false);
    setIsaNote("");
  };

  const handleReviseWithIsa = (doc: IsoDocument) => {
    setDraftDoc(doc);
    setDraftContent("");
    setDraftContext("");
    setDraftReady(false);
    setIsDrafting(false);
    setDraftIsRevision(true);
    setPrevShowExpanded(false);
    setShowFullDiff(false);
    setIsaNote("");
  };

  const COVERAGE_DELIM = "===COVERAGE-NOTE===";

  const startCardGeneration = async (ctx: string) => {
    if (!draftDoc) return;
    setDraftReady(true);
    setDraftContent("");
    setIsaNote("");
    setIsDrafting(true);
    setIsaAcceptReason(`AI-assisted revision by Isa${ctx.trim() ? ` — ${ctx.trim()}` : ""}`);
    try {
      const res = await fetch(`/api/iso-documents/${draftDoc.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ additionalContext: ctx, revisionMode: draftIsRevision }),
      });
      if (!res.ok) throw new Error("Draft request failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");
      let buf = "";
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                const delimIdx = fullContent.indexOf(COVERAGE_DELIM);
                if (delimIdx !== -1) {
                  setDraftContent(fullContent.slice(0, delimIdx).trimEnd());
                  setIsaNote(fullContent.slice(delimIdx + COVERAGE_DELIM.length).trimStart());
                } else {
                  setDraftContent(fullContent);
                }
              }
              if (data.done) setIsDrafting(false);
            } catch {}
          }
        }
      }
    } catch {
      toast({ title: "Draft failed", description: "Could not generate draft. Please try again.", variant: "destructive" });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCardFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingCard(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-document", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Extraction failed");
      const { text } = await res.json();
      setDraftContext(prev => prev ? prev + "\n\n" + text : text);
      toast({ title: "File loaded", description: `${file.name} — text extracted and added to context.` });
    } catch {
      toast({ title: "Upload failed", description: "Could not extract text from file.", variant: "destructive" });
    } finally {
      setIsExtractingCard(false);
      if (cardFileRef.current) cardFileRef.current.value = "";
    }
  };

  const saveDraftToDocument = async () => {
    if (!draftDoc) return;
    // Capture current content BEFORE overwriting so user can undo
    const currentDoc = (queryClient.getQueryData<IsoDocument[]>(["/api/iso-documents"]) ?? [])
      .find(d => d.id === draftDoc.id);
    const originalContent = currentDoc?.content ?? "";
    const originalVersion = currentDoc?.version ?? draftDoc.version ?? "1.0";
    try {
      await apiRequest("PATCH", `/api/iso-documents/${draftDoc.id}`, { content: draftContent });
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      setDraftDoc(null);
      setDraftContent("");
      setDraftContext("");
      setDraftReady(false);
      setPrevShowExpanded(false);
      setShowFullDiff(false);
      // Store undo snapshot so user can revert
      if (originalContent.trim()) {
        setUndoSnapshot({ docId: draftDoc.id, content: originalContent, version: originalVersion });
      }
      toast({ title: "Draft saved", description: originalContent.trim() ? "Previous content saved — click Undo if needed." : "Document content updated with Isa's draft." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const handleUndoSave = async () => {
    if (!undoSnapshot) return;
    try {
      await apiRequest("PATCH", `/api/iso-documents/${undoSnapshot.docId}`, { content: undoSnapshot.content });
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      setUndoSnapshot(null);
      toast({ title: "Restored", description: `Document reverted to previous content (Rev. ${undoSnapshot.version}).` });
    } catch {
      toast({ title: "Restore failed", variant: "destructive" });
    }
  };

  const handleRunComplianceCheck = async (doc: IsoDocument) => {
    setRunningComplianceChecks(prev => new Set(prev).add(doc.id));
    try {
      const res = await apiRequest("POST", `/api/iso-documents/${doc.id}/compliance-check`, {});
      const result: ComplianceResult = await res.json();
      setComplianceResults(prev => {
        const next: globalThis.Map<number, ComplianceResult> = new globalThis.Map(prev);
        next.set(doc.id, result);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
    } catch (e: any) {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : (e.message ?? "Could not run compliance check.");
      toast({ title: "Compliance Check Failed", description: msg, variant: "destructive" });
    } finally {
      setRunningComplianceChecks(prev => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  const acceptIsaDraft = async () => {
    if (!draftDoc || !draftContent) return;
    setIsAcceptingIsaDraft(true);
    const oldContent = draftDoc.content ?? "";
    const oldVersion = draftDoc.version ?? "1.0";
    try {
      const res = await apiRequest("PATCH", `/api/iso-documents/${draftDoc.id}`, {
        isaRevision: true,
        proposedContent: draftContent,
        changeReason: isaAcceptReason.trim() || "AI-assisted revision by Isa",
        requestedBy: "Document Author",
      });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doc-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/change-control-log"] });
      if (oldContent.trim()) {
        setUndoSnapshot({ docId: draftDoc.id, content: oldContent, version: oldVersion });
      }
      setDraftDoc(null);
      setDraftContent("");
      setDraftContext("");
      setDraftReady(false);
      setIsaAcceptReason("AI-assisted revision by Isa");
      setPrevShowExpanded(false);
      setShowFullDiff(false);
      toast({
        title: `✓ Accepted as Rev. ${data.newVersion}`,
        description: `Change Request #${data.dcrId} created and awaiting approval.`,
      });
    } catch {
      toast({ title: "Accept failed", description: "Could not save the draft.", variant: "destructive" });
    } finally {
      setIsAcceptingIsaDraft(false);
    }
  };

  const getDocIcon = (type: string) => {
    const docType = DOC_TYPES.find(t => t.value === type);
    const Icon = docType?.icon || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Draft</Badge>;
      case 'in_review': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">In Review</Badge>;
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600 text-white">Approved</Badge>;
      case 'obsolete': return <Badge variant="secondary" className="text-muted-foreground">Obsolete</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleFormFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingFormFile(true);
    setFormReviewFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-document", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Extraction failed");
      const { text } = await res.json();
      setFormReviewText(text);
      toast({ title: "Form loaded", description: `${file.name} — text extracted successfully.` });
    } catch {
      toast({ title: "Upload failed", description: "Could not extract text from file.", variant: "destructive" });
      setFormReviewFileName("");
    } finally {
      setIsExtractingFormFile(false);
      if (formReviewFileRef.current) formReviewFileRef.current.value = "";
    }
  };

  const runFormReview = async () => {
    if (!formReviewText.trim()) return;
    setFormReviewResult("");
    setIsReviewingForm(true);
    try {
      const res = await fetch("/api/iso-forms/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ formContent: formReviewText, clause: formReviewClause, docType: formReviewDocType }),
      });
      if (!res.ok) throw new Error("Review failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) setFormReviewResult(prev => prev + data.content);
              if (data.done) setIsReviewingForm(false);
            } catch {}
          }
        }
      }
    } catch {
      toast({ title: "Review failed", description: "Could not complete form review.", variant: "destructive" });
    } finally {
      setIsReviewingForm(false);
    }
  };

  const getFormVerdict = (result: string): { label: string; color: string; icon: any } | null => {
    if (result.includes("VERDICT: USE AS-IS")) return { label: "Use As-Is ✓", color: "bg-green-100 text-green-800 border-green-200", icon: BadgeCheck };
    if (result.includes("VERDICT: MINOR MODIFICATIONS NEEDED")) return { label: "Minor Modifications Needed", color: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertTriangle };
    if (result.includes("VERDICT: SIGNIFICANT MODIFICATIONS NEEDED")) return { label: "Significant Modifications Needed", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle };
    return null;
  };

  const handleNewDoc = (type?: string) => {
    setSelectedDoc(null);
    setIsDialogOpen(true);
    // If a type is passed from quick start, we can pre-set it in the dialog
    if (type) {
      setTimeout(() => {
        // This is a bit hacky but works for pre-filling the dialog state if we used a ref or state
      }, 0);
    }
  };

  return (
    <div className="flex h-full bg-muted/30 overflow-hidden">
      {/* Main content area */}
      <div className={`flex flex-col p-6 overflow-y-auto transition-all duration-200 ${(draftDoc || formReviewOpen) ? "w-[38%]" : "flex-1"}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-black text-primary">Documentation Library</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your ISO Quality Management System documentation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => { setFormReviewOpen(true); setDraftDoc(null); setFormReviewResult(""); setFormReviewText(""); setFormReviewFileName(""); setFormReviewClause(""); }}
            className="gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950/30"
            data-testid="button-review-form"
          >
            <ClipboardCheck className="w-4 h-4" /> Review My Form
          </Button>
          <Button 
            onClick={() => handleNewDoc()}
            className="bg-accent hover:bg-accent/90 text-white gap-2"
            data-testid="button-new-document"
          >
            <Plus className="w-4 h-4" /> New Document
          </Button>
        </div>
      </div>

      {/* Undo banner — shown after "Save to Document" when previous content existed */}
      {undoSnapshot && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Draft saved — previous content preserved</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">Your original Rev. {undoSnapshot.version} content is held in memory. Click Undo to restore it.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleUndoSave}
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1"
              data-testid="button-undo-save"
            >
              ↩ Undo
            </Button>
            <button
              onClick={() => setUndoSnapshot(null)}
              className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              data-testid="button-dismiss-undo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-white border p-1 h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-white">All</TabsTrigger>
          {DOC_TYPES.map(type => (
            <TabsTrigger key={type.value} value={type.value} className="data-[state=active]:bg-accent data-[state=active]:text-white">
              {type.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="coverage_map" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5" data-testid="tab-coverage-map">
            <MapIcon className="w-3.5 h-3.5" /> Coverage Map
          </TabsTrigger>
          <TabsTrigger value="change_requests" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-1.5 relative" data-testid="tab-change-requests">
            <GitMerge className="w-3.5 h-3.5" /> Change Control
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="master_list" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5" data-testid="tab-master-list">
            <List className="w-3.5 h-3.5" /> Master List
          </TabsTrigger>
          <TabsTrigger value="change_log" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5" data-testid="tab-change-log">
            <ScrollText className="w-3.5 h-3.5" /> Change Log
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "change_requests" ? (
        <ChangeRequestsPanel
          changeRequests={changeRequests ?? []}
          documents={documents ?? []}
          onApprove={(req: any) => setReviewingRequest(req)}
          onReject={(req: any) => setReviewingRequest({ ...req, _action: "reject" })}
          onRequestChange={(doc: IsoDocument) => setChangeReqDoc(doc)}
        />
      ) : activeTab === "coverage_map" ? (
        <ClauseCoverageMap documents={documents || []} onAskIsa={onAskIsa} complianceResults={complianceResults} />
      ) : activeTab === "master_list" ? (
        <MasterDocumentList documents={documents ?? []} project={project ?? null} isLoading={isLoading} complianceResults={complianceResults} />
      ) : activeTab === "change_log" ? (
        <ChangeControlLog documents={documents ?? []} isoProjectId={(project as any)?.id ?? null} />
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : !documents || documents.length === 0 ? (
        <EmptyState onNewDoc={handleNewDoc} onAskIsa={onAskIsa} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments?.map((doc) => (
            <DocumentCard 
              key={doc.id} 
              doc={doc} 
              onEdit={() => setSelectedDoc(doc)} 
              onDelete={() => deleteMutation.mutate(doc.id)}
              onAskIsa={onAskIsa}
              onDraftWithIsa={handleDraftWithIsa}
              onReviseWithIsa={handleReviseWithIsa}
              onPrint={() => printIsoDocument(doc, project ?? null)}
              onRequestChange={() => setChangeReqDoc(doc)}
              getIcon={getDocIcon}
              getStatusBadge={getStatusBadge}
              onRunComplianceCheck={handleRunComplianceCheck}
              complianceResult={complianceResults.get(doc.id) ?? null}
              isRunningComplianceCheck={runningComplianceChecks.has(doc.id)}
            />
          ))}
        </div>
      )}
      </div>

      {/* Draft with Isa panel */}
      {draftDoc && (
        <div className="w-[62%] border-l border-border/60 flex flex-col bg-white dark:bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-violet-50 dark:bg-violet-950/30 shrink-0">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-violet-900 dark:text-violet-200">{draftIsRevision ? "Revise with Isa" : "Draft with Isa"}</p>
              <p className="text-[10px] text-violet-700 dark:text-violet-400 truncate">{draftDoc.title}</p>
            </div>
            {isDrafting && (
              <span className="text-[10px] text-violet-600 dark:text-violet-400 animate-pulse font-semibold">Writing…</span>
            )}
            {/* "Save to Document" only for brand-new docs with no prior content */}
            {!isDrafting && draftContent && !draftDoc.content?.trim() && (
              <Button
                size="sm"
                onClick={saveDraftToDocument}
                className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1"
                data-testid="button-save-draft"
              >
                Save to Document
              </Button>
            )}
            <button
              onClick={() => { setDraftDoc(null); setDraftContent(""); setDraftReady(false); setPrevShowExpanded(false); setShowFullDiff(false); setIsaNote(""); }}
              className="text-violet-500 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
              data-testid="button-close-draft"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Context-capture phase */}
          {!draftReady && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-900 dark:text-violet-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> {draftIsRevision ? "Revision Instruction" : "Give Isa Context (Optional)"}
                </p>
                <p className="text-[11px] text-violet-700 dark:text-violet-400">
                  {draftIsRevision
                    ? "Describe exactly what you want Isa to change. The rest of the document will be preserved. Isa will return the complete revised document."
                    : "Paste customer specs, existing procedures, regulatory requirements, or any notes. Isa will incorporate them into the draft."
                  }
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">{draftIsRevision ? "What should Isa change?" : "Additional Context"}</label>
                  {!draftIsRevision && (
                    <div className="flex items-center gap-1.5">
                      {isExtractingCard && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />}
                      <button
                        type="button"
                        onClick={() => cardFileRef.current?.click()}
                        disabled={isExtractingCard}
                        className="flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-400 hover:text-violet-900 font-semibold border border-violet-200 dark:border-violet-700 rounded px-2 py-1 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
                        data-testid="button-card-upload-file"
                      >
                        <Paperclip className="w-3 h-3" />
                        {isExtractingCard ? "Extracting…" : "Upload File"}
                      </button>
                      <input ref={cardFileRef} type="file" accept=".pdf,.txt,.md,.docx" className="hidden" onChange={handleCardFileSelect} />
                    </div>
                  )}
                </div>
                <Textarea
                  value={draftContext}
                  onChange={e => setDraftContext(e.target.value)}
                  placeholder={draftIsRevision
                    ? "Example: \"Remove the specific objectives from section 6.2 — only reference FM-6.2-1\" or \"Expand section 8.5 to include more detail on chemical batch controls\""
                    : "Paste: customer-specific requirements, existing procedure text, regulatory notes, scope limits, process details, names of key personnel…"
                  }
                  className="min-h-[180px] text-xs resize-none"
                  data-testid="textarea-card-draft-context"
                />
                {!draftIsRevision && (
                  <p className="text-[10px] text-muted-foreground">Accepts: PDF, DOCX, TXT, or Markdown files up to 10 MB</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => startCardGeneration(draftContext)}
                  disabled={draftIsRevision && !draftContext.trim()}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-1.5 disabled:opacity-50"
                  data-testid="button-card-generate"
                >
                  <Sparkles className="w-4 h-4" />
                  {draftIsRevision
                    ? "Revise Document"
                    : draftContext.trim() ? "Generate with My Context" : "Generate Now"
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Generation phase — streaming */}
          {draftReady && isDrafting && (
            <div className="flex-1 overflow-y-auto p-4">
              {!draftContent && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  Isa is writing your document…
                </div>
              )}
              {draftContent && (
                <pre className="text-xs text-primary whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-draft-content">
                  {draftContent}
                </pre>
              )}
            </div>
          )}

          {/* Accept phase — shown after generation finishes for existing docs that already have content */}
          {draftReady && !isDrafting && draftContent && draftDoc.content?.trim() && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 rounded-xl p-3">
                <p className="text-xs font-bold text-violet-900 dark:text-violet-200">Review Isa's Proposed Revision</p>
                <p className="text-[11px] text-violet-700 dark:text-violet-400 mt-0.5">Accepting will bump the revision number and open a Change Request for formal approval. Discard returns you to the context step.</p>
              </div>

              {/* Diff / summary view */}
              {draftContent.length >= LARGE_DOC_THRESHOLD ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                      Revision Summary (Rev. {draftDoc.version ?? "1.0"} → proposed)
                    </p>
                    <button
                      onClick={() => setShowFullDiff(v => !v)}
                      className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
                      data-testid="button-toggle-full-diff"
                    >
                      <ChevronRight className={`w-3 h-3 transition-transform ${showFullDiff ? "rotate-90" : ""}`} />
                      {showFullDiff ? "Hide full diff" : "View full diff"}
                    </button>
                  </div>
                  <div className="max-h-[42vh] overflow-y-auto">
                    <RevisionSummaryView oldText={draftDoc.content ?? ""} newText={draftContent} />
                    {showFullDiff && (
                      <div className="mt-2 bg-white dark:bg-card border border-violet-200 dark:border-violet-700/50 rounded-lg p-3" data-testid="container-line-diff">
                        <LineDiffView oldText={draftDoc.content ?? ""} newText={draftContent} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-1.5">
                    Inline Changes (Rev. {draftDoc.version ?? "1.0"} → proposed)
                  </p>
                  <div className="bg-white dark:bg-card border border-violet-200 dark:border-violet-700/50 rounded-lg p-3 max-h-[42vh] overflow-y-auto" data-testid="container-line-diff">
                    <LineDiffView oldText={draftDoc.content ?? ""} newText={draftContent} />
                  </div>
                </div>
              )}

              {/* Full proposed content — collapsible */}
              <div>
                <button
                  onClick={() => setPrevShowExpanded(e => !e)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                  data-testid="button-toggle-prev-content"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${prevShowExpanded ? "rotate-90" : ""}`} />
                  View Full Proposed Content
                </button>
                {prevShowExpanded && (
                  <div className="mt-1.5 bg-white dark:bg-card border border-violet-200 dark:border-violet-700/50 rounded-lg p-3 max-h-[45vh] overflow-y-auto">
                    <pre className="text-xs text-primary whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-draft-content">{draftContent}</pre>
                  </div>
                )}
              </div>

              {/* Reason for change */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Reason for Change</label>
                <Textarea
                  value={isaAcceptReason}
                  onChange={e => setIsaAcceptReason(e.target.value)}
                  className="text-xs min-h-[56px] resize-none"
                  placeholder="Describe what changed and why…"
                  data-testid="textarea-isa-accept-reason"
                />
              </div>

              {/* Accept / Discard */}
              <div className="flex gap-2">
                <Button
                  onClick={acceptIsaDraft}
                  disabled={isAcceptingIsaDraft}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8 gap-1.5"
                  data-testid="button-accept-isa-draft"
                >
                  {isAcceptingIsaDraft
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle2 className="w-3.5 h-3.5" />
                  }
                  {isAcceptingIsaDraft ? "Accepting…" : "Accept as Official Draft"}
                </Button>
                <Button
                  onClick={() => { setDraftReady(false); setDraftContent(""); setPrevShowExpanded(false); setShowFullDiff(false); setIsaNote(""); }}
                  variant="outline"
                  className="text-xs h-8"
                  data-testid="button-discard-isa-draft"
                >
                  Discard
                </Button>
              </div>
            </div>
          )}

          {/* For new docs (no prior content) — show plain draft content after generation */}
          {draftReady && !isDrafting && draftContent && !draftDoc.content?.trim() && (
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs text-primary whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-draft-content">
                {draftContent}
              </pre>
            </div>
          )}

          {/* Isa's Clause Coverage Note — appears after generation completes */}
          {isaNote && (
            <div className="border-t border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-950/30 p-4 shrink-0 max-h-[36vh] overflow-y-auto" data-testid="container-isa-coverage-note">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <p className="text-[11px] font-bold text-teal-800 dark:text-teal-200 uppercase tracking-wide">Isa's Clause Coverage Note</p>
              </div>
              <pre className="text-[11px] text-teal-900 dark:text-teal-100 whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-isa-coverage-note">{isaNote}</pre>
            </div>
          )}
        </div>
      )}

      {/* Form Adequacy Review panel */}
      {formReviewOpen && !draftDoc && (
        <div className="w-[62%] border-l border-border/60 flex flex-col bg-white dark:bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-teal-50 dark:bg-teal-950/30 shrink-0">
            <ClipboardCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-teal-900 dark:text-teal-200">Form Adequacy Review</p>
              <p className="text-[10px] text-teal-700 dark:text-teal-400">Isa will assess whether your existing form meets the standard requirements</p>
            </div>
            <button onClick={() => { setFormReviewOpen(false); setFormReviewResult(""); setFormReviewText(""); setFormReviewFileName(""); }} className="text-muted-foreground hover:text-primary transition-colors" data-testid="button-close-form-review">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Input area */}
          <div className="p-4 space-y-3 shrink-0 border-b border-border/40">
            {/* File upload */}
            <div>
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5 block">Your Existing Form</Label>
              <input ref={formReviewFileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFormFileSelect} />
              {formReviewFileName ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 text-xs text-teal-800 dark:text-teal-200">
                  <Paperclip className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{formReviewFileName}</span>
                  <button onClick={() => { setFormReviewFileName(""); setFormReviewText(""); }} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => formReviewFileRef.current?.click()} disabled={isExtractingFormFile} className="w-full gap-2 text-xs h-8" data-testid="button-upload-form-file">
                  {isExtractingFormFile ? <><Loader2 className="w-3 h-3 animate-spin" /> Extracting…</> : <><Upload className="w-3 h-3" /> Upload Form (PDF, DOCX, TXT)</>}
                </Button>
              )}
              {!formReviewFileName && (
                <Textarea
                  placeholder="Or paste your form content / field list here..."
                  value={formReviewText}
                  onChange={e => setFormReviewText(e.target.value)}
                  className="mt-2 min-h-[80px] text-xs"
                  data-testid="textarea-form-content"
                />
              )}
            </div>

            {/* Clause / requirement */}
            <div>
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5 block">Clause / Requirement (optional)</Label>
              <Input
                placeholder="e.g. ISO 9001 Cl. 8.4.1, IATF 16949 Cl. 8.5.2..."
                value={formReviewClause}
                onChange={e => setFormReviewClause(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-form-clause"
              />
            </div>

            {/* Form type */}
            <div>
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold mb-1.5 block">Form Type</Label>
              <Select value={formReviewDocType} onValueChange={setFormReviewDocType}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedure">Procedure / Work Instruction</SelectItem>
                  <SelectItem value="record">Record / Log Form</SelectItem>
                  <SelectItem value="checklist">Checklist / Audit Form</SelectItem>
                  <SelectItem value="report">Report / Corrective Action Form</SelectItem>
                  <SelectItem value="matrix">Matrix / Register</SelectItem>
                  <SelectItem value="plan">Plan / Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runFormReview}
              disabled={!formReviewText.trim() || isReviewingForm}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 h-8 text-xs"
              data-testid="button-run-form-review"
            >
              {isReviewingForm ? <><Loader2 className="w-3 h-3 animate-spin" /> Isa is reviewing…</> : <><FileSearch className="w-3 h-3" /> Analyze Form</>}
            </Button>
          </div>

          {/* Results */}
          {(formReviewResult || isReviewingForm) && (
            <div className="flex-1 overflow-y-auto p-4">
              {/* Verdict badge — shown when Isa finishes */}
              {!isReviewingForm && (() => {
                const v = getFormVerdict(formReviewResult);
                return v ? (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold mb-3 ${v.color}`} data-testid="container-form-verdict">
                    <v.icon className="w-4 h-4 shrink-0" />
                    <span>VERDICT: {v.label}</span>
                  </div>
                ) : null;
              })()}
              <pre className="text-xs text-primary whitespace-pre-wrap font-sans leading-relaxed" data-testid="text-form-review-result">{formReviewResult}</pre>
              {isReviewingForm && !formReviewResult && (
                <div className="flex items-center gap-2 text-teal-600 text-xs animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Isa is reviewing your form…
                </div>
              )}
            </div>
          )}

          {!formReviewResult && !isReviewingForm && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <ClipboardCheck className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Upload or paste your form content</p>
              <p className="text-xs mt-1 max-w-[260px]">Isa will assess whether it meets the standard requirements — and tell you exactly what to add or change.</p>
            </div>
          )}
        </div>
      )}

      <DocumentDialog 
        isOpen={isDialogOpen || !!selectedDoc}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedDoc(null);
        }}
        onSubmit={(data: InsertIsoDocument) => {
          if (selectedDoc) {
            updateMutation.mutate({ id: selectedDoc.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        onDelete={selectedDoc ? (id: number) => deleteMutation.mutate(id) : undefined}
        doc={selectedDoc}
        project={project}
        isPending={createMutation.isPending || updateMutation.isPending}
        onAskIsa={onAskIsa}
      />

      {changeReqDoc && (
        <ChangeRequestDialog
          doc={changeReqDoc}
          onClose={() => setChangeReqDoc(null)}
          onSubmit={(data: any) => submitChangeMutation.mutate({ docId: changeReqDoc.id, data })}
          isPending={submitChangeMutation.isPending}
          complianceResult={complianceResults.get(changeReqDoc.id) ?? null}
          onRunComplianceCheck={() => handleRunComplianceCheck(changeReqDoc)}
          isRunningComplianceCheck={runningComplianceChecks.has(changeReqDoc.id)}
        />
      )}

      {reviewingRequest && (
        <ReviewDialog
          request={reviewingRequest}
          onClose={() => setReviewingRequest(null)}
          onApprove={(payload: any) => approveMutation.mutate({ requestId: reviewingRequest.id, ...payload })}
          onReject={(payload: any) => rejectMutation.mutate({ requestId: reviewingRequest.id, ...payload })}
          isApprovePending={approveMutation.isPending}
          isRejectPending={rejectMutation.isPending}
          defaultAction={reviewingRequest._action ?? "approve"}
        />
      )}
    </div>
  );
}

function ComplianceResultPanel({ result, docId }: { result: ComplianceResult; docId: number }) {
  const [expanded, setExpanded] = useState(true);

  const verdictConfig = {
    "Compliant": { color: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40", badge: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-200", icon: BadgeCheck, iconColor: "text-green-600" },
    "Partially Compliant": { color: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40", badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200", icon: AlertTriangle, iconColor: "text-amber-600" },
    "Non-Compliant": { color: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40", badge: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200", icon: XCircle, iconColor: "text-red-600" },
  };

  const cfg = verdictConfig[result.verdict];
  const VerdictIcon = cfg.icon;

  const statusColor = (s: string) => {
    if (s === "Met") return "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
    if (s === "Partially Met") return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800";
    return "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
  };

  const checkedAtLabel = result.checkedAt
    ? format(new Date(result.checkedAt), "MMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <div className={`mt-3 rounded-lg border overflow-hidden ${cfg.color}`} data-testid={`container-compliance-result-${docId}`}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setExpanded(x => !x); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        data-testid={`button-toggle-compliance-${docId}`}
      >
        <VerdictIcon className={`w-4 h-4 shrink-0 ${cfg.iconColor}`} />
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.badge}`}>{result.verdict}</span>
        <span className="text-[10px] text-muted-foreground flex-1 truncate">{result.summary}</span>
        {checkedAtLabel && (
          <span className="text-[9px] text-muted-foreground shrink-0 hidden sm:inline" data-testid={`text-compliance-checked-at-${docId}`}>
            {checkedAtLabel}
          </span>
        )}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2" onClick={e => e.stopPropagation()}>
          {Array.isArray(result.requirements) && result.requirements.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Requirement Breakdown</p>
              {result.requirements.map((req, i) => (
                <div key={i} className="flex gap-2 items-start text-[10px]">
                  <span className={`shrink-0 px-1.5 py-0.5 rounded border font-semibold mt-0.5 ${statusColor(req.status ?? "Not Met")}`}>{req.status ?? "Not Met"}</span>
                  <div>
                    <p className="font-semibold text-foreground">{req.requirement}</p>
                    <p className="text-muted-foreground">{req.finding}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Recommendations</p>
              {result.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-1.5 text-[10px]">
                  <span className="text-amber-600 shrink-0 mt-0.5">•</span>
                  <p className="text-foreground">{typeof rec === "string" ? rec : String(rec)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentCard({ doc, onEdit, onDelete, onAskIsa, onDraftWithIsa, onReviseWithIsa, onPrint, onRequestChange, getIcon, getStatusBadge, onRunComplianceCheck, complianceResult, isRunningComplianceCheck }: any) {
  const [showHistory, setShowHistory] = useState(false);
  const prevVersions: any[] = Array.isArray(doc.previousVersions) ? doc.previousVersions : [];

  const canRunCheck = !!(doc.content?.trim()) && !!(doc.isoClause?.trim());

  return (
    <Card className="hover-elevate cursor-pointer group" onClick={onEdit} data-testid={`card-document-${doc.id}`}>
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg text-accent">
            {getIcon(doc.docType)}
          </div>
          <div>
            <CardTitle className="text-sm font-bold group-hover:text-accent transition-colors">{doc.title}</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">{doc.isoClause || "No clause reference"}</p>
          </div>
        </div>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-accent"
            title="Print / Export" onClick={onPrint} data-testid={`button-print-doc-${doc.id}`}>
            <Printer className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} data-testid={`button-edit-doc-${doc.id}`}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete} data-testid={`button-delete-doc-${doc.id}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            {getStatusBadge(doc.status)}
            <Badge variant="outline" className="text-[10px]">Rev. {doc.version}</Badge>
            {prevVersions.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setShowHistory(h => !h); }}
                className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                data-testid={`button-history-${doc.id}`}
              >
                <History className="w-3 h-3" />
                {prevVersions.length} revision{prevVersions.length > 1 ? "s" : ""}
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {showHistory && prevVersions.length > 0 && (
          <div className="mb-3 border border-border/50 rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-muted/50 px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <History className="w-3 h-3" /> Version History
            </div>
            {[...prevVersions].reverse().map((v, i) => (
              <div key={i} className="px-3 py-2 border-t border-border/30 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">Rev. {v.version}</span>
                  <span className="text-muted-foreground">{v.archivedAt ? format(new Date(v.archivedAt), 'MMM d, yyyy') : "—"}</span>
                </div>
                {v.changeReason && <p className="text-muted-foreground mt-0.5 truncate">{v.changeReason}</p>}
                {v.approvedBy && <p className="text-muted-foreground">Approved by: {v.approvedBy}</p>}
              </div>
            ))}
          </div>
        )}

        {complianceResult && (
          <ComplianceResultPanel result={complianceResult} docId={doc.id} />
        )}

        <div className="flex items-center justify-between gap-2 mt-3">
          <p className="text-[10px] text-muted-foreground">
            Updated {format(new Date(doc.updatedAt || doc.createdAt), 'MMM d, yyyy')}
          </p>
          <div className="flex gap-1.5 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
            {canRunCheck && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-bold dark:bg-blue-950/30 dark:border-blue-800/40 dark:text-blue-300"
                onClick={(e) => { e.stopPropagation(); onRunComplianceCheck(doc); }}
                disabled={isRunningComplianceCheck}
                data-testid={`button-compliance-check-${doc.id}`}
              >
                {isRunningComplianceCheck
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <ShieldCheck className="w-3 h-3" />
                }
                {isRunningComplianceCheck ? "Checking…" : "Run Compliance Check"}
              </Button>
            )}
            {doc.status === "approved" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 font-bold dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-300"
                onClick={(e) => { e.stopPropagation(); onRequestChange(doc); }}
                data-testid={`button-request-change-${doc.id}`}
              >
                <GitMerge className="w-3 h-3" /> Request Change
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1 bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 font-bold dark:bg-violet-950/30 dark:border-violet-800/40 dark:text-violet-300"
              onClick={(e) => { e.stopPropagation(); onDraftWithIsa(doc); }}
              data-testid={`button-draft-isa-${doc.id}`}
            >
              <Sparkles className="w-3 h-3" /> Draft with Isa
            </Button>
            {doc.content?.trim() && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] gap-1 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 font-bold dark:bg-indigo-950/30 dark:border-indigo-800/40 dark:text-indigo-300"
                onClick={(e) => { e.stopPropagation(); onReviseWithIsa(doc); }}
                data-testid={`button-revise-isa-${doc.id}`}
              >
                <Sparkles className="w-3 h-3" /> Revise with Isa
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1 bg-accent/5 hover:bg-accent/10 border-accent/20 text-accent font-bold"
              onClick={(e) => {
                e.stopPropagation();
                onAskIsa(`I'm working on the ${doc.docType.replace(/_/g, ' ')} titled "${doc.title}". Can you coach me on improving it for ISO compliance? Current content: ${doc.content || "Empty"}`);
              }}
              data-testid={`button-ask-isa-${doc.id}`}
            >
              <MessageSquare className="w-3 h-3" /> Ask Isa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Change Request Dialog ────────────────────────────────────────────────────
const DEPT_OPTIONS = [
  "Quality", "Production", "Engineering", "Purchasing", "HR", "Sales", "Shipping/Receiving",
  "Management", "Maintenance", "Health & Safety", "Finance", "IT", "All Departments",
];

function ChangeRequestDialog({ doc, onClose, onSubmit, isPending, complianceResult, onRunComplianceCheck, isRunningComplianceCheck }: any) {
  const [form, setForm] = useState({
    requestedBy: "",
    designatedReviewer: "",
    designatedReviewerEmail: "",
    changeDescription: "",
    reason: "",
    proposedContent: normalizeContentForEdit(doc?.content ?? ""),
    affectedDepartments: [] as string[],
    proposedEffectiveDate: "",
  });

  const toggleDept = (dept: string) => {
    setForm(f => ({
      ...f,
      affectedDepartments: f.affectedDepartments.includes(dept)
        ? f.affectedDepartments.filter(d => d !== dept)
        : [...f.affectedDepartments, dept],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requestedBy || !form.changeDescription || !form.reason) return;
    onSubmit(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitMerge className="w-4 h-4 text-orange-600" />
            Document Change Request — ISO 7.5.3
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">Make your revisions directly below, then fill in the request details. The approver will see the full revised document.</p>
        </DialogHeader>

        <div className="text-[11px] bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-2 dark:bg-orange-950/20 dark:border-orange-800/40">
          <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-800 dark:text-orange-300">{doc.title} (Rev. {doc.version})</p>
            <p className="text-orange-600 dark:text-orange-500 mt-0.5">Edit the document content below, fill in the request fields, then click Submit. The document moves to <strong>In Review</strong> and the reviewer receives a link to the full revised document.</p>
          </div>
        </div>

        {/* Compliance check reminder banner */}
        {doc.isoClause?.trim() && doc.content?.trim() && (() => {
          if (!complianceResult) {
            return (
              <div className="text-[11px] bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 dark:bg-blue-950/20 dark:border-blue-800/40" data-testid="banner-no-compliance-check">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-blue-800 dark:text-blue-200">Compliance check not yet run</p>
                  <p className="text-blue-700 dark:text-blue-400 mt-0.5">Consider running a compliance check before submitting. Isa will evaluate whether this document meets the requirements of <strong>{doc.isoClause}</strong>. You can still proceed without it.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isRunningComplianceCheck}
                  onClick={onRunComplianceCheck}
                  className="shrink-0 h-7 text-[10px] gap-1 bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800 font-bold"
                  data-testid="button-run-check-from-dcr"
                >
                  {isRunningComplianceCheck ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                  {isRunningComplianceCheck ? "Checking…" : "Run Check"}
                </Button>
              </div>
            );
          }
          if (complianceResult.verdict !== "Compliant") {
            const isNonCompliant = complianceResult.verdict === "Non-Compliant";
            return (
              <div className={`text-[11px] rounded-lg p-3 flex items-start gap-2 border ${isNonCompliant ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40"}`} data-testid="banner-compliance-warning">
                {isNonCompliant ? <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${isNonCompliant ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
                    Compliance check: <span className="font-black">{complianceResult.verdict}</span>
                  </p>
                  <p className={`mt-0.5 ${isNonCompliant ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                    {complianceResult.summary} Consider addressing gaps and re-running the check before submitting. You can still proceed — results do not block this workflow.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isRunningComplianceCheck}
                  onClick={onRunComplianceCheck}
                  className={`shrink-0 h-7 text-[10px] gap-1 font-bold ${isNonCompliant ? "bg-red-100 hover:bg-red-200 border-red-300 text-red-800" : "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800"}`}
                  data-testid="button-rerun-check-from-dcr"
                >
                  {isRunningComplianceCheck ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                  {isRunningComplianceCheck ? "Checking…" : "Re-run Check"}
                </Button>
              </div>
            );
          }
          return null;
        })()}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* STEP 1 — Edit Document Content */}
          <div className="border border-primary/20 rounded-xl overflow-hidden">
            <div className="bg-primary/5 px-4 py-2.5 flex items-center gap-2 border-b border-primary/10">
              <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">1</div>
              <div>
                <p className="text-xs font-black text-primary">Revise the Document</p>
                <p className="text-[10px] text-muted-foreground">Edit the content below. The approver will see this version before deciding.</p>
              </div>
            </div>
            <div className="p-3">
              <Textarea
                value={form.proposedContent}
                onChange={e => setForm(f => ({ ...f, proposedContent: e.target.value }))}
                rows={16}
                className="text-xs font-mono resize-y leading-relaxed"
                placeholder="Document content will appear here for editing..."
                data-testid="textarea-proposed-content"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Make all your changes in this editor. The original content is preserved and shown to the reviewer for comparison.
              </p>
            </div>
          </div>

          {/* STEP 2 — Change Request Details */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/40 px-4 py-2.5 flex items-center gap-2 border-b border-border">
              <div className="w-5 h-5 rounded-full bg-muted-foreground text-white text-[10px] font-black flex items-center justify-center">2</div>
              <div>
                <p className="text-xs font-black">Change Request Details</p>
                <p className="text-[10px] text-muted-foreground">Fill in the fields below for the audit record.</p>
              </div>
            </div>
            <div className="p-4 space-y-4">

          <div className="space-y-1.5">
            <Label className="text-xs">Requested By <span className="text-destructive">*</span></Label>
            <Input
              value={form.requestedBy}
              onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))}
              placeholder="Your name or title"
              className="text-sm"
              data-testid="input-requested-by"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-primary" /> Designated Reviewer / Approver
              <span className="text-muted-foreground font-normal">(who must approve this change)</span>
            </Label>
            <Input
              value={form.designatedReviewer}
              onChange={e => setForm(f => ({ ...f, designatedReviewer: e.target.value }))}
              placeholder="e.g. Quality Manager, Management Representative, Plant Manager"
              className="text-sm"
              data-testid="input-designated-reviewer"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Reviewer Email
                  <span className="text-muted-foreground/60">(optional — sends notification on submit)</span>
                </Label>
                <Input
                  type="email"
                  value={form.designatedReviewerEmail}
                  onChange={e => setForm(f => ({ ...f, designatedReviewerEmail: e.target.value }))}
                  placeholder="reviewer@yourcompany.com"
                  className="text-sm h-8"
                  data-testid="input-reviewer-email"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              If an email is provided, this person will receive an automated notification the moment you submit this request.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description of Change <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.changeDescription}
              onChange={e => setForm(f => ({ ...f, changeDescription: e.target.value }))}
              placeholder="What specifically needs to change? (sections, content, procedure steps...)"
              rows={3}
              className="text-sm resize-none"
              data-testid="textarea-change-description"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason for Change <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Why is this change needed? (audit finding, process improvement, regulatory update, customer requirement...)"
              rows={2}
              className="text-sm resize-none"
              data-testid="textarea-change-reason"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Affected Departments <span className="text-muted-foreground">(triggers training notices on approval)</span></Label>
            <div className="flex flex-wrap gap-1.5">
              {DEPT_OPTIONS.map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => toggleDept(dept)}
                  className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-colors ${
                    form.affectedDepartments.includes(dept)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary"
                  }`}
                  data-testid={`chip-dept-${dept.replace(/\//g, "-")}`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Proposed Effective Date
            </Label>
            <Input
              type="date"
              value={form.proposedEffectiveDate}
              onChange={e => setForm(f => ({ ...f, proposedEffectiveDate: e.target.value }))}
              className="text-sm"
              data-testid="input-effective-date"
            />
          </div>

            </div>{/* end p-4 space-y-4 */}
          </div>{/* end Step 2 border div */}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button
              type="submit"
              disabled={isPending || !form.requestedBy || !form.changeDescription || !form.reason}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
              data-testid="button-submit-change-request"
            >
              <GitMerge className="w-3.5 h-3.5" />
              {isPending ? "Submitting..." : "Submit Change Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Review Dialog (Approve / Reject) ─────────────────────────────────────────
function ReviewDialog({ request, onClose, onApprove, onReject, isApprovePending, isRejectPending, defaultAction }: any) {
  const [action, setAction] = useState<"approve" | "reject">(defaultAction === "reject" ? "reject" : "approve");
  const [reviewedBy, setReviewedBy] = useState(request?.designated_reviewer ?? "");
  const [reviewerComments, setReviewerComments] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {action === "approve" ? <ShieldCheck className="w-4 h-4 text-green-600" /> : <Ban className="w-4 h-4 text-red-500" />}
            Review Change Request
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1.5 border border-border/50">
          <p><span className="font-bold text-muted-foreground">Document:</span> {request.doc_title}</p>
          <p><span className="font-bold text-muted-foreground">Current Rev:</span> {request.current_version}</p>
          <p><span className="font-bold text-muted-foreground">Requested by:</span> {request.requested_by}</p>
          <p><span className="font-bold text-muted-foreground">Change:</span> {request.change_description}</p>
          <p><span className="font-bold text-muted-foreground">Reason:</span> {request.reason}</p>
          {request.affected_departments?.length > 0 && (
            <p><span className="font-bold text-muted-foreground">Affected Depts:</span> {(request.affected_departments as string[]).join(", ")}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setAction("approve")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              action === "approve" ? "bg-green-600 text-white border-green-600" : "bg-white text-muted-foreground border-border hover:border-green-400"
            }`}
            data-testid="toggle-approve"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={() => setAction("reject")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              action === "reject" ? "bg-red-500 text-white border-red-500" : "bg-white text-muted-foreground border-border hover:border-red-400"
            }`}
            data-testid="toggle-reject"
          >
            <Ban className="w-3.5 h-3.5" /> Reject
          </button>
        </div>

        {action === "approve" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[11px] text-green-800 dark:bg-green-950/20 dark:border-green-800/40 dark:text-green-300 space-y-1">
            <p className="font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Approving will:</p>
            <ul className="list-disc list-inside space-y-0.5 text-green-700 dark:text-green-400">
              <li>Bump version from Rev. {request.current_version} → Rev. {bumpVersion(request.current_version)}</li>
              <li>Archive current version to revision history</li>
              <li>Set document status to Approved</li>
              {request.affected_departments?.length > 0 && <li>Send training notice to: {(request.affected_departments as string[]).join(", ")}</li>}
            </ul>
          </div>
        )}
        {action === "reject" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[11px] text-red-800 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-300">
            <p className="font-bold">Rejecting will return the document to Approved status.</p>
            <p className="mt-0.5 text-red-700 dark:text-red-400">Please provide feedback so the requestor can revise and resubmit.</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Reviewer Name <span className="text-destructive">*</span></Label>
            <Input
              value={reviewedBy}
              onChange={e => setReviewedBy(e.target.value)}
              placeholder="QMS Manager / Management Representative"
              className="text-sm"
              data-testid="input-reviewed-by"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{action === "approve" ? "Approval Notes (optional)" : "Rejection Reason *"}</Label>
            <Textarea
              value={reviewerComments}
              onChange={e => setReviewerComments(e.target.value)}
              placeholder={action === "approve" ? "Any notes for the record..." : "Explain why the change is being rejected..."}
              rows={2}
              className="text-sm resize-none"
              data-testid="textarea-reviewer-comments"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isApprovePending || isRejectPending}>Cancel</Button>
          {action === "approve" ? (
            <Button
              onClick={() => onApprove({ reviewedBy, reviewerComments })}
              disabled={isApprovePending || !reviewedBy}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              data-testid="button-confirm-approve"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isApprovePending ? "Approving..." : "Approve & Bump Version"}
            </Button>
          ) : (
            <Button
              onClick={() => onReject({ reviewedBy, reviewerComments })}
              disabled={isRejectPending || !reviewedBy || !reviewerComments}
              className="bg-red-500 hover:bg-red-600 text-white gap-1.5"
              data-testid="button-confirm-reject"
            >
              <Ban className="w-3.5 h-3.5" />
              {isRejectPending ? "Rejecting..." : "Reject Change Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function bumpVersion(version: string): string {
  const [major, minor] = (version || "1.0").split(".").map(Number);
  const newMinor = (minor ?? 0) + 1;
  return newMinor >= 10 ? `${(major ?? 1) + 1}.0` : `${major ?? 1}.${newMinor}`;
}

// ─── Change Requests Panel ────────────────────────────────────────────────────
function ChangeRequestsPanel({ changeRequests, documents, onApprove, onReject, onRequestChange }: any) {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [showDocPicker, setShowDocPicker] = useState(false);

  const filtered = changeRequests.filter((r: any) => statusFilter === "all" || r.status === statusFilter);
  const pendingCount = changeRequests.filter((r: any) => r.status === "pending").length;
  const approvedDocs = (documents as IsoDocument[]).filter(d => d.status === "approved");
  const inReviewDocIds = new Set(
    changeRequests.filter((r: any) => r.status === "pending").map((r: any) => r.document_id)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px]">Pending Review</Badge>;
      case "approved": return <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px]">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px]">Rejected</Badge>;
      default: return <Badge className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-primary flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-orange-600" />
            Document Change Control
          </h2>
          <p className="text-xs text-muted-foreground">ISO 7.5.3 — Initiate, review, and track all document changes</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-red-500 hover:bg-red-600 text-white gap-1 text-xs">
            <Bell className="w-3 h-3" /> {pendingCount} Pending
          </Badge>
        )}
      </div>

      {/* Initiate a Change Request */}
      <div className="border border-orange-200 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 dark:border-orange-800/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 rounded-lg dark:bg-orange-900/40">
              <GitMerge className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-900 dark:text-orange-200">Initiate a Document Change</p>
              <p className="text-[11px] text-orange-700 dark:text-orange-400">Select an Approved document to begin the change control process</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowDocPicker(p => !p)}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 text-xs"
            data-testid="button-show-doc-picker"
          >
            <Plus className="w-3.5 h-3.5" />
            {showDocPicker ? "Hide Documents" : "Select Document"}
          </Button>
        </div>

        {showDocPicker && (
          <div className="space-y-2 mt-2">
            {approvedDocs.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">No approved documents found. Documents must be in Approved status to request a change.</p>
            ) : (
              approvedDocs.map((doc: IsoDocument) => {
                const hasPending = inReviewDocIds.has(doc.id);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-white dark:bg-card rounded-lg px-3 py-2.5 border border-orange-100 dark:border-orange-900/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">{doc.title}</p>
                      <p className="text-[10px] text-muted-foreground">Rev. {doc.version} · {doc.isoClause || "No clause"}</p>
                    </div>
                    {hasPending ? (
                      <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-[10px] shrink-0">
                        Pending Review
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => { onRequestChange(doc); setShowDocPicker(false); }}
                        className="h-7 text-[10px] bg-orange-600 hover:bg-orange-700 text-white gap-1 shrink-0"
                        data-testid={`button-pick-doc-${doc.id}`}
                      >
                        <GitMerge className="w-3 h-3" /> Request Change
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Change Request Log */}
      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors capitalize ${
                statusFilter === s ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"
              }`}
              data-testid={`filter-${s}`}
            >
              {s === "all" ? `All (${changeRequests.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${changeRequests.filter((r: any) => r.status === s).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl bg-muted/20">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <History className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-primary">No change requests yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Use <strong>Select Document</strong> above to initiate your first document change request.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req: any) => (
              <Card key={req.id} className={`border-l-4 ${req.status === "pending" ? "border-l-yellow-400" : req.status === "approved" ? "border-l-green-500" : "border-l-red-400"}`}>
                <CardContent className="p-4 space-y-3">

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(req.status)}
                      <span className="text-xs font-bold text-primary">{req.doc_title}</span>
                      <Badge variant="outline" className="text-[10px]">DCR-{String(req.id).padStart(4, "0")}</Badge>
                      <span className="text-[10px] text-muted-foreground">Rev. {req.current_version}</span>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" onClick={() => onApprove(req)}
                          className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white gap-1"
                          data-testid={`button-approve-${req.id}`}>
                          <ShieldCheck className="w-3 h-3" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onReject(req)}
                          className="h-7 text-[10px] border-red-300 text-red-600 hover:bg-red-50 gap-1"
                          data-testid={`button-reject-${req.id}`}>
                          <Ban className="w-3 h-3" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Approval workflow steps — shown on pending only */}
                  {req.status === "pending" && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-yellow-900 dark:text-yellow-200 mb-2 uppercase tracking-wide">Approval Workflow</p>
                      <div className="flex items-center gap-1 text-[10px]">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-black">✓</div>
                          <span className="text-green-700 dark:text-green-400 font-semibold text-center leading-tight">Submitted</span>
                        </div>
                        <div className="flex-1 h-px bg-yellow-300 dark:bg-yellow-700 mx-1" />
                        {/* Step 2 — current */}
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center animate-pulse">
                            <Clock className="w-3 h-3" />
                          </div>
                          <span className="text-yellow-700 dark:text-yellow-400 font-black text-center leading-tight">
                            {req.designated_reviewer ? `Awaiting: ${req.designated_reviewer}` : "Awaiting Approval"}
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-1" />
                        {/* Step 3 */}
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] text-muted-foreground font-black">3</div>
                          <span className="text-muted-foreground text-center leading-tight">Version Bumped + Training</span>
                        </div>
                      </div>
                      {req.designated_reviewer ? (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex items-center gap-1.5 bg-white dark:bg-card border border-yellow-300 dark:border-yellow-700/50 rounded-lg px-2.5 py-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-muted-foreground font-medium">Required Approver</p>
                              <p className="text-xs font-black text-primary truncate">{req.designated_reviewer}</p>
                            </div>
                            <span className="text-[9px] bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 rounded px-1.5 py-0.5 font-bold whitespace-nowrap">Action Required</span>
                          </div>
                          {req.designated_reviewer_email && (
                            <div className="flex items-center gap-1.5 text-[10px] text-violet-700 dark:text-violet-400 font-semibold pl-0.5">
                              <Mail className="w-3 h-3" />
                              Assigned reviewer: <span className="font-black">{req.designated_reviewer_email}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-[10px] text-yellow-700 dark:text-yellow-400">
                          <span className="font-bold">Anyone with access</span> can approve or reject this request using the buttons above.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Change details */}
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">
                      Submitted by <span className="font-semibold text-foreground">{req.requested_by}</span> · {req.created_at ? format(new Date(req.created_at), "MMM d, yyyy") : "—"}
                    </p>
                    <p><span className="text-muted-foreground">Change: </span><span className="font-medium">{req.change_description}</span></p>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">Reason: </span>{req.reason}</p>
                  </div>

                  {req.affected_departments?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Training required for:</span>
                      {(req.affected_departments as string[]).map((d: string) => (
                        <span key={d} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40">{d}</span>
                      ))}
                    </div>
                  )}

                  {req.status !== "pending" && req.reviewed_by && (
                    <div className={`text-[11px] rounded-lg p-2.5 border ${req.status === "approved" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40"}`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        {req.status === "approved" ? <ShieldCheck className="w-3 h-3 text-green-600" /> : <Ban className="w-3 h-3 text-red-500" />}
                        <span className="font-bold">{req.status === "approved" ? "Approved" : "Rejected"} by {req.reviewed_by}</span>
                        {req.reviewed_at && <span className="text-muted-foreground ml-1">· {format(new Date(req.reviewed_at), "MMM d, yyyy")}</span>}
                      </div>
                      {req.reviewer_comments && <p className="text-muted-foreground mt-0.5">{req.reviewer_comments}</p>}
                    </div>
                  )}

                  {req.status === "approved" && req.training_triggered && (
                    <div className="flex items-center gap-1.5 text-[10px] text-green-700 dark:text-green-400 font-semibold">
                      <Bell className="w-3 h-3" /> Training notice sent to affected departments
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentDialog({ isOpen, onClose, onSubmit, onDelete, doc, project, isPending, onAskIsa }: any) {
  const { toast } = useToast();
  const logoUrl = (project as any)?.logoUrl as string | undefined;
  const [showLogo, setShowLogo] = useState(() => !!logoUrl);
  const [formData, setFormData] = useState<Partial<InsertIsoDocument>>({
    docType: 'procedure',
    title: '',
    isoClause: '',
    status: 'draft',
    version: '1.0',
    content: '',
    approvedBy: '',
    reviewDate: null,
    tags: [],
    isoProjectId: project?.id || null,
  });
  const [isDraftingDialog, setIsDraftingDialog] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");
  const [contextExpanded, setContextExpanded] = useState(false);
  const [isExtractingDialogFile, setIsExtractingDialogFile] = useState(false);
  const dialogFileRef = useRef<HTMLInputElement>(null);
  const [prevDialogContent, setPrevDialogContent] = useState<string | null>(null);
  const [isaDialogAcceptReason, setIsaDialogAcceptReason] = useState("AI-assisted revision by Isa");
  const [isAcceptingIsaDraftDialog, setIsAcceptingIsaDraftDialog] = useState(false);
  const [dialogIsaNote, setDialogIsaNote] = useState("");
  const queryClientDialog = useQueryClient();

  const handleDialogFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingDialogFile(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const res = await fetch("/api/upload-document", { method: "POST", body: formDataUpload, credentials: "include" });
      if (!res.ok) throw new Error("Extraction failed");
      const { text } = await res.json();
      setAdditionalContext(prev => prev ? prev + "\n\n" + text : text);
      setContextExpanded(true);
      toast({ title: "File loaded", description: `${file.name} — extracted and added to Isa context.` });
    } catch {
      toast({ title: "Upload failed", description: "Could not extract text from file.", variant: "destructive" });
    } finally {
      setIsExtractingDialogFile(false);
      if (dialogFileRef.current) dialogFileRef.current.value = "";
    }
  };

  const handleDialogDraft = async () => {
    // Snapshot existing content so user can restore if they don't like the draft
    const existingContent = formData.content?.trim();
    if (existingContent) {
      setPrevDialogContent(existingContent);
      setIsaDialogAcceptReason(
        `AI-assisted revision by Isa${additionalContext.trim() ? ` — ${additionalContext.trim()}` : ""}`
      );
    }
    setIsDraftingDialog(true);
    setDialogIsaNote("");
    setFormData(prev => ({ ...prev, content: "" }));
    try {
      const url = doc?.id
        ? `/api/iso-documents/${doc.id}/generate`
        : `/api/iso-documents/generate-draft`;
      const bodyObj = doc?.id
        ? { additionalContext: additionalContext.trim() || undefined }
        : { docType: formData.docType, title: formData.title, isoClause: formData.isoClause, additionalContext: additionalContext.trim() || undefined };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyObj),
      });
      if (!res.ok) throw new Error("Draft request failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");
      let buf = "";
      let fullDialogContent = "";
      const DELIM = "===COVERAGE-NOTE===";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullDialogContent += data.content;
                const delimIdx = fullDialogContent.indexOf(DELIM);
                if (delimIdx !== -1) {
                  setFormData(prev => ({ ...prev, content: fullDialogContent.slice(0, delimIdx).trimEnd() }));
                  setDialogIsaNote(fullDialogContent.slice(delimIdx + DELIM.length).trimStart());
                } else {
                  setFormData(prev => ({ ...prev, content: fullDialogContent }));
                }
              }
              if (data.done) setIsDraftingDialog(false);
            } catch {}
          }
        }
      }
    } catch {
      toast({ title: "Draft failed", description: "Could not generate draft.", variant: "destructive" });
    } finally {
      setIsDraftingDialog(false);
    }
  };

  const acceptIsaDraftFromDialog = async () => {
    if (!doc?.id || !formData.content?.trim()) return;
    setIsAcceptingIsaDraftDialog(true);
    try {
      const res = await apiRequest("PATCH", `/api/iso-documents/${doc.id}`, {
        isaRevision: true,
        proposedContent: formData.content,
        changeReason: isaDialogAcceptReason.trim() || "AI-assisted revision by Isa",
        requestedBy: "Document Author",
      });
      const data = await res.json();
      queryClientDialog.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      queryClientDialog.invalidateQueries({ queryKey: ["/api/doc-change-requests"] });
      queryClientDialog.invalidateQueries({ queryKey: ["/api/change-control-log"] });
      setPrevDialogContent(null);
      setIsaDialogAcceptReason("AI-assisted revision by Isa");
      onClose();
      toast({
        title: `✓ Accepted as Rev. ${data.newVersion}`,
        description: `Change Request #${data.dcrId} created and awaiting approval.`,
      });
    } catch {
      toast({ title: "Accept failed", description: "Could not save the draft.", variant: "destructive" });
    } finally {
      setIsAcceptingIsaDraftDialog(false);
    }
  };

  // Reset logo visibility each time a different doc is opened (or dialog re-opens)
  useEffect(() => {
    setShowLogo(!!logoUrl);
  }, [doc?.id, isOpen, logoUrl]);

  // Sync with doc if editing
  const DRAFT_KEY = `iso-doc-draft-${project?.id ?? 'new'}`;

  // Load form from doc (edit) or restore draft from localStorage (new)
  useEffect(() => {
    if (doc) {
      setFormData({
        ...doc,
        content: normalizeContentForEdit(doc.content || ""),
        reviewDate: doc.reviewDate ? new Date(doc.reviewDate) : null,
        tags: doc.tags || [],
      });
      setAdditionalContext("");
      setContextExpanded(false);
      setPrevDialogContent(null);
      setDialogIsaNote("");
    } else if (isOpen) {
      setAdditionalContext("");
      setContextExpanded(false);
      setPrevDialogContent(null);
      setDialogIsaNote("");
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData({ ...parsed, isoProjectId: project?.id || null });
          return;
        }
      } catch {}
      setFormData({
        docType: 'procedure',
        title: '',
        isoClause: '',
        status: 'draft',
        version: '1.0',
        content: '',
        approvedBy: '',
        reviewDate: null,
        tags: [],
        isoProjectId: project?.id || null,
      });
    }
  }, [doc, isOpen, project?.id]);

  // Auto-save draft to localStorage whenever form changes (new docs only)
  useEffect(() => {
    if (!doc && formData.title) {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(formData)); } catch {}
    }
  }, [formData, doc]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    onSubmit(formData as InsertIsoDocument);
  };

  const handleAskGuidance = () => {
    const docLabel = DOC_TYPES.find(t => t.value === formData.docType)?.label ?? formData.docType;
    const prompt = `[CONTEXT: I am inside the ISO Manager Documentation module actively creating a document. Help me write this document directly — do NOT redirect me to any module or service.]\n\nI'm creating a ${docLabel} titled "${formData.title || "(untitled)"}"${formData.isoClause ? ` for ISO clause ${formData.isoClause}` : ''}. Walk me through the required structure, the key elements I must include, and give me example wording I can use for each section so I can write an audit-ready document.`;
    onAskIsa(prompt);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{doc ? 'Edit Document' : 'Create New Document'}</DialogTitle>
            <div className="flex items-center gap-2">
              {!doc && formData.title && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-0.5 font-medium">
                  ✓ Draft auto-saved
                </span>
              )}
              {doc && logoUrl && (
                <button
                  type="button"
                  onClick={() => setShowLogo(v => !v)}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground border border-border/60 rounded px-2 py-1 transition-colors"
                  title="Toggle logo visibility"
                  data-testid="btn-toggle-doc-logo"
                >
                  {showLogo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showLogo ? "Hide Logo" : "Show Logo"}
                </button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Document header — always visible when editing; logo element toggled separately */}
        {doc && (
          <div className="mx-6 mt-4 rounded-lg border border-border/60 bg-slate-50 dark:bg-slate-900/50 p-4 flex items-start gap-4">
            {/* Logo slot — shown/hidden via toggle; no-logo fallback shows org name */}
            {showLogo && logoUrl && (
              <img
                src={logoUrl}
                alt="Organization logo"
                className="h-12 w-auto max-w-[140px] object-contain shrink-0"
              />
            )}
            {!logoUrl && (
              <div className="flex items-center justify-center h-12 px-3 rounded border border-border/60 bg-white dark:bg-slate-800 shrink-0 min-w-[80px] max-w-[140px]">
                <span className="text-xs font-bold text-foreground text-center leading-tight break-words">{project?.orgName ?? "Organization"}</span>
              </div>
            )}
            {/* Metadata — always visible */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">{project?.orgName ?? "Organization"}</p>
              {project?.standard && (
                <p className="text-[11px] text-muted-foreground">{project.standard}:2015 Quality Management System</p>
              )}
              <div className="flex flex-wrap gap-3 mt-1.5">
                {formData.title && (
                  <span className="text-[11px] font-semibold text-foreground">{formData.title}</span>
                )}
                {formData.isoClause && (
                  <span className="text-[11px] text-muted-foreground">Clause {formData.isoClause}</span>
                )}
                {formData.version && (
                  <span className="text-[11px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono">Rev {formData.version}</span>
                )}
                {formData.status && (
                  <span className={`text-[11px] rounded px-1.5 py-0.5 font-medium capitalize ${
                    formData.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    formData.status === 'in_review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>{formData.status.replace('_', ' ')}</span>
                )}
              </div>
              {formData.approvedBy && (
                <p className="text-[10px] text-muted-foreground mt-1">Approved by: <span className="font-medium text-foreground">{formData.approvedBy}</span></p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={formData.docType} onValueChange={v => setFormData({...formData, docType: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Control of Documented Information"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ISO Clause Reference</Label>
              <Input 
                value={formData.isoClause || ''} 
                onChange={e => setFormData({...formData, isoClause: e.target.value})} 
                placeholder="e.g. ISO 9001:2015 Clause 7.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Version</Label>
              <Input 
                value={formData.version || '1.0'} 
                onChange={e => setFormData({...formData, version: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Approved By</Label>
              <Input 
                value={formData.approvedBy || ''} 
                onChange={e => setFormData({...formData, approvedBy: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input 
                type="date"
                value={formData.reviewDate ? format(new Date(formData.reviewDate), 'yyyy-MM-dd') : ''}
                onChange={e => setFormData({...formData, reviewDate: e.target.value ? new Date(e.target.value) : null})}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input 
                value={formData.tags?.join(', ') || ''} 
                onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                placeholder="QMS, Control, Manufacturing"
              />
            </div>
          </div>

          {/* ── Context for Isa ───────────────────────────────────────────── */}
          <div className="border border-violet-200 dark:border-violet-800/50 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setContextExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
              data-testid="button-toggle-context"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-violet-800 dark:text-violet-300">
                <Sparkles className="w-3.5 h-3.5" />
                Context for Isa
                {additionalContext.trim() && (
                  <span className="bg-violet-600 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none">✓ Added</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-violet-600 dark:text-violet-400">
                  {contextExpanded ? "Hide" : "Paste text · Upload file · Improve draft quality"}
                </span>
                {contextExpanded ? <ChevronUp className="w-3.5 h-3.5 text-violet-600" /> : <ChevronDown className="w-3.5 h-3.5 text-violet-600" />}
              </div>
            </button>

            {contextExpanded && (
              <div className="p-4 space-y-3 bg-white dark:bg-card border-t border-violet-100 dark:border-violet-800/40">
                <p className="text-[11px] text-muted-foreground">
                  Paste or upload any reference material — customer specs, existing procedures, regulatory text, process notes. Isa will incorporate it into the generated draft.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Reference Material</label>
                    <div className="flex items-center gap-1.5">
                      {isExtractingDialogFile && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />}
                      <button
                        type="button"
                        onClick={() => dialogFileRef.current?.click()}
                        disabled={isExtractingDialogFile}
                        className="flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-400 hover:text-violet-900 font-semibold border border-violet-200 dark:border-violet-700 rounded px-2 py-1 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
                        data-testid="button-dialog-upload-file"
                      >
                        <Upload className="w-3 h-3" />
                        {isExtractingDialogFile ? "Extracting…" : "Upload File"}
                      </button>
                      <input
                        ref={dialogFileRef}
                        type="file"
                        accept=".pdf,.txt,.md,.docx"
                        className="hidden"
                        onChange={handleDialogFileSelect}
                      />
                    </div>
                  </div>
                  <Textarea
                    value={additionalContext}
                    onChange={e => setAdditionalContext(e.target.value)}
                    placeholder="Paste: customer-specific requirements, scope limits, process steps, responsible roles, regulatory references, control points, existing text to refine…"
                    className="min-h-[100px] text-xs resize-none"
                    data-testid="textarea-dialog-context"
                  />
                  <p className="text-[10px] text-muted-foreground">Accepts: PDF, DOCX, TXT, or Markdown · max 10 MB</p>
                </div>
                {additionalContext.trim() && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-violet-700 dark:text-violet-400 font-medium">
                      ✓ {additionalContext.trim().length.toLocaleString()} characters of context ready for Isa
                    </p>
                    <button
                      type="button"
                      onClick={() => setAdditionalContext("")}
                      className="text-[10px] text-destructive hover:text-destructive/80 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Content</Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-violet-600 text-xs h-7 gap-1 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                  onClick={handleDialogDraft}
                  disabled={isDraftingDialog || !formData.title}
                  title={!formData.title ? "Enter a title first" : additionalContext.trim() ? "Draft with your context" : "Let Isa draft the full document content"}
                  data-testid="button-draft-isa-dialog"
                >
                  <Sparkles className="w-3 h-3" />
                  {isDraftingDialog ? "Drafting…" : additionalContext.trim() ? "Draft with My Context" : "Draft with Isa"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-accent text-xs h-7 gap-1"
                  onClick={handleAskGuidance}
                >
                  <Sparkles className="w-3 h-3" /> Ask Isa
                </Button>
              </div>
            </div>
            <Textarea 
              value={formData.content || ''} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              placeholder="Describe the document purpose, scope, and key steps..."
              className={`min-h-[200px] ${isDraftingDialog ? "text-violet-700 dark:text-violet-300" : ""}`}
              data-testid="textarea-doc-content"
            />
            {isDraftingDialog && (
              <p className="text-[10px] text-violet-600 animate-pulse font-semibold">Isa is writing your document…</p>
            )}
            {/* Isa's Clause Coverage Note — shown in dialog after generation */}
            {dialogIsaNote && !isDraftingDialog && (
              <div className="rounded-xl border border-teal-200 dark:border-teal-800/50 bg-teal-50 dark:bg-teal-950/20 p-3" data-testid="container-dialog-coverage-note">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <p className="text-[11px] font-bold text-teal-800 dark:text-teal-200 uppercase tracking-wide">Isa's Clause Coverage Note</p>
                </div>
                <pre className="text-[11px] text-teal-900 dark:text-teal-100 whitespace-pre-wrap font-sans leading-relaxed max-h-[28vh] overflow-y-auto" data-testid="text-dialog-coverage-note">{dialogIsaNote}</pre>
              </div>
            )}
            {/* After Isa drafts on an existing doc: offer Accept as Official Draft or Restore */}
            {prevDialogContent && !isDraftingDialog && doc?.id && (
              <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/20 p-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-violet-900 dark:text-violet-200">Isa has revised this document</p>
                    <p className="text-[10px] text-violet-700 dark:text-violet-400">Accept to bump the revision and create a formal Change Request, or restore your previous content.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, content: prevDialogContent! }));
                      setPrevDialogContent(null);
                      setIsaDialogAcceptReason("AI-assisted revision by Isa");
                    }}
                    className="text-violet-400 hover:text-violet-700 transition-colors shrink-0 mt-0.5"
                    title="Discard Isa's revision and restore previous content"
                    data-testid="button-dismiss-prev-content"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Inline diff inside dialog */}
                <div>
                  <p className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-1.5">
                    Inline Changes
                  </p>
                  <div className="border border-violet-200 dark:border-violet-700/50 rounded-lg p-2.5 max-h-[180px] overflow-y-auto bg-white dark:bg-card" data-testid="container-dialog-line-diff">
                    <LineDiffView oldText={prevDialogContent ?? ""} newText={formData.content ?? ""} />
                  </div>
                </div>

              <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-foreground">Reason for Change</label>
                  <Textarea
                    value={isaDialogAcceptReason}
                    onChange={e => setIsaDialogAcceptReason(e.target.value)}
                    className="text-xs min-h-[48px] resize-none"
                    placeholder="Describe what changed and why…"
                    data-testid="textarea-dialog-accept-reason"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={acceptIsaDraftFromDialog}
                    disabled={isAcceptingIsaDraftDialog}
                    className="flex-1 h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1"
                    data-testid="button-accept-isa-draft-dialog"
                  >
                    {isAcceptingIsaDraftDialog ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    {isAcceptingIsaDraftDialog ? "Accepting…" : "Accept as Official Draft"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, content: prevDialogContent }));
                      setPrevDialogContent(null);
                    }}
                    className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 border border-amber-300 dark:border-amber-600 rounded px-2.5 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors"
                    data-testid="button-restore-prev-content"
                  >
                    ↩ Restore Previous
                  </button>
                </div>
              </div>
            )}
          </div>

          {doc && (
            <div className="pt-4 border-t">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Document Lifecycle</Label>
              <div className="flex items-center justify-between px-4">
                <LifecycleStep label="Draft" active={formData.status === 'draft'} completed={['in_review', 'approved'].includes(formData.status as string)} />
                <div className="h-px bg-border flex-1 mx-4" />
                <LifecycleStep label="Review" active={formData.status === 'in_review'} completed={['approved'].includes(formData.status as string)} />
                <div className="h-px bg-border flex-1 mx-4" />
                <LifecycleStep label="Approved" active={formData.status === 'approved'} completed={formData.status === 'approved'} />
              </div>
            </div>
          )}
        </form>
        <DialogFooter className="p-6 border-t gap-2 sm:gap-0">
          {doc && (
            <Button type="button" variant="ghost" className="text-destructive mr-auto" onClick={() => onDelete(doc.id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          {prevDialogContent && doc ? (
            <Button type="button" disabled className="bg-muted text-muted-foreground cursor-not-allowed" title="Accept or discard Isa's revision before saving">
              Accept or Discard Isa's Revision First
            </Button>
          ) : (
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-white" disabled={isPending} onClick={handleSubmit}>
              {isPending ? "Saving..." : (doc ? "Update Document" : "Create Document")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LifecycleStep({ label, active, completed }: { label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
        completed ? "bg-green-500 border-green-500 text-white" : 
        active ? "border-accent text-accent" : "border-muted-foreground/30 text-muted-foreground/30"
      }`}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3 h-3" />}
      </div>
      <span className={`text-[10px] font-bold ${active || completed ? "text-primary" : "text-muted-foreground/50"}`}>{label}</span>
    </div>
  );
}

function EmptyState({ onNewDoc, onAskIsa }: any) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 bg-accent/5 rounded-full flex items-center justify-center mb-6">
        <FileMinus className="w-12 h-12 text-accent/30" />
      </div>
      <h2 className="text-xl font-black text-primary mb-2">Your document library is empty</h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        Start by creating your Quality Manual or upload your first procedure. Isa can guide you through each step.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl mb-8">
        {DOC_TYPES.slice(0, 5).map(type => (
          <Button 
            key={type.value} 
            variant="outline" 
            className="flex flex-col h-auto py-4 gap-2 hover-elevate border-accent/10"
            onClick={() => onNewDoc(type.value)}
          >
            <type.icon className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold">{type.label}</span>
          </Button>
        ))}
        <Button 
          variant="outline" 
          className="flex flex-col h-auto py-4 gap-2 hover-elevate border-accent/10"
          onClick={() => onAskIsa("[CONTEXT: I am inside the ISO Manager Documentation module. Give me actionable guidance — list the specific documents I should create, the ISO clauses they cover, and a suggested order of creation.]\n\nWhat documents should I create first for my ISO 9001:2015 Quality Management System, and in what order should I build them?")}
        >
          <MessageSquare className="w-5 h-5 text-accent" />
          <span className="text-xs font-bold">Ask Isa What to Create</span>
        </Button>
      </div>
    </div>
  );
}

const ISO_9001_CLAUSES = [
  { clause: "4.1", title: "Understanding the organization and its context" },
  { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
  { clause: "4.3", title: "Determining the scope of the QMS" },
  { clause: "4.4", title: "QMS and its processes" },
  { clause: "5.1", title: "Leadership and commitment" },
  { clause: "5.2", title: "Quality policy" },
  { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
  { clause: "6.1", title: "Actions to address risks and opportunities" },
  { clause: "6.2", title: "Quality objectives and planning to achieve them" },
  { clause: "6.3", title: "Planning of changes" },
  { clause: "7.1", title: "Resources" },
  { clause: "7.2", title: "Competence" },
  { clause: "7.3", title: "Awareness" },
  { clause: "7.4", title: "Communication" },
  { clause: "7.5", title: "Documented information" },
  { clause: "8.1", title: "Operational planning and control" },
  { clause: "8.2", title: "Requirements for products and services" },
  { clause: "8.3", title: "Design and development" },
  { clause: "8.4", title: "Control of externally provided processes, products and services" },
  { clause: "8.5", title: "Production and service provision" },
  { clause: "8.6", title: "Release of products and services" },
  { clause: "8.7", title: "Control of nonconforming outputs" },
  { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
  { clause: "9.2", title: "Internal audit" },
  { clause: "9.3", title: "Management review" },
  { clause: "10.2", title: "Nonconformity and corrective action" },
  { clause: "10.3", title: "Continual improvement" },
];

function ClauseCoverageMap({ documents, onAskIsa, complianceResults }: { documents: IsoDocument[]; onAskIsa: (prompt: string) => void; complianceResults: Map<number, ComplianceResult> }) {
  const covered = ISO_9001_CLAUSES.filter(({ clause }) =>
    documents.some(doc => doc.isoClause && doc.isoClause.includes(clause) && doc.status !== "obsolete")
  );
  const partial = ISO_9001_CLAUSES.filter(({ clause }) =>
    documents.some(doc => doc.isoClause && doc.isoClause.includes(clause) && doc.status === "draft")
    && !documents.some(doc => doc.isoClause && doc.isoClause.includes(clause) && doc.status === "approved")
  );
  const uncovered = ISO_9001_CLAUSES.filter(({ clause }) =>
    !documents.some(doc => doc.isoClause && doc.isoClause.includes(clause))
  );
  const coveragePct = Math.round((covered.length / ISO_9001_CLAUSES.length) * 100);

  const getStatusForClause = (clause: string) => {
    const docs = documents.filter(doc => doc.isoClause && doc.isoClause.includes(clause));
    if (docs.length === 0) return "none";
    if (docs.some(d => d.status === "approved")) return "approved";
    if (docs.some(d => d.status === "in_review")) return "review";
    return "draft";
  };

  const getDocsForClause = (clause: string) =>
    documents.filter(doc => doc.isoClause && doc.isoClause.includes(clause) && doc.status !== "obsolete");

  const getComplianceForClause = (clause: string): ComplianceResult["verdict"] | null => {
    const clauseDocs = getDocsForClause(clause);
    const verdicts = clauseDocs.map(d => complianceResults.get(d.id)?.verdict).filter(Boolean) as ComplianceResult["verdict"][];
    if (verdicts.length === 0) return null;
    if (verdicts.includes("Non-Compliant")) return "Non-Compliant";
    if (verdicts.includes("Partially Compliant")) return "Partially Compliant";
    return "Compliant";
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-2 border-primary/20 bg-primary/5">
          <p className="text-3xl font-black text-primary">{coveragePct}%</p>
          <p className="text-xs text-muted-foreground mt-1">Overall Coverage</p>
        </Card>
        <Card className="p-4 text-center border border-green-200 bg-green-50">
          <p className="text-3xl font-black text-green-700">{covered.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Clauses Addressed</p>
        </Card>
        <Card className="p-4 text-center border border-yellow-200 bg-yellow-50">
          <p className="text-3xl font-black text-yellow-700">{partial.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Draft Only</p>
        </Card>
        <Card className="p-4 text-center border border-red-200 bg-red-50">
          <p className="text-3xl font-black text-red-700">{uncovered.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Not Addressed</p>
        </Card>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>ISO 9001:2015 Documentation Coverage</span>
          <span>{covered.length} of {ISO_9001_CLAUSES.length} clauses</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${coveragePct}%` }} />
        </div>
      </div>

      {/* Ask Isa about gaps */}
      {uncovered.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-amber-800">{uncovered.length} clauses have no supporting documents. </span>
          <button
            className="text-accent font-semibold hover:underline whitespace-nowrap"
            onClick={() => onAskIsa(`I'm building my ISO 9001:2015 documentation library and these clauses currently have no supporting documents: ${uncovered.slice(0, 8).map(c => c.clause + " (" + c.title + ")").join(", ")}. Which of these should I prioritize first and what document should I create for each?`)}
          >
            Ask Isa for Guidance
          </button>
        </div>
      )}

      {/* Clause list */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm" data-testid="table-coverage-map">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-16">Clause</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Requirement</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-28">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-36">Compliance</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Documents</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ISO_9001_CLAUSES.map(({ clause, title }) => {
              const status = getStatusForClause(clause);
              const clauseDocs = getDocsForClause(clause);
              const complianceVerdict = getComplianceForClause(clause);
              return (
                <tr key={clause} className="hover:bg-muted/10" data-testid={`row-coverage-${clause}`}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{clause}</td>
                  <td className="px-4 py-3 text-foreground">{title}</td>
                  <td className="px-4 py-3">
                    {status === "approved" && <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs">Approved</Badge>}
                    {status === "review" && <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs">In Review</Badge>}
                    {status === "draft" && <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">Draft</Badge>}
                    {status === "none" && <Badge className="bg-red-50 text-red-600 border border-red-200 text-xs">Not Addressed</Badge>}
                  </td>
                  <td className="px-4 py-3" data-testid={`compliance-clause-${clause}`}>
                    {complianceVerdict === "Compliant" && <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs">Compliant</Badge>}
                    {complianceVerdict === "Partially Compliant" && <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-xs">Partially Compliant</Badge>}
                    {complianceVerdict === "Non-Compliant" && <Badge className="bg-red-100 text-red-800 border border-red-200 text-xs">Non-Compliant</Badge>}
                    {complianceVerdict === null && <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {clauseDocs.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No documents mapped</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {clauseDocs.slice(0, 2).map(doc => (
                          <span key={doc.id} className="text-xs bg-muted px-2 py-0.5 rounded">{doc.title}</span>
                        ))}
                        {clauseDocs.length > 2 && <span className="text-xs text-muted-foreground">+{clauseDocs.length - 2} more</span>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Master Document List ─────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  quality_manual: "Quality Manual",
  process_map: "Process Map",
  procedure: "Procedure",
  work_instruction: "Work Instruction",
  template: "Format Template",
  other: "Other",
};

type SortKey = "title" | "docType" | "isoClause" | "version" | "status" | "approvedBy" | "approvalDate" | "reviewDate";
type SortDir = "asc" | "desc";

function MasterDocumentList({ documents, project, isLoading, complianceResults }: { documents: IsoDocument[]; project: any; isLoading: boolean; complianceResults: Map<number, ComplianceResult> }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClause, setFilterClause] = useState("all");
  const [filterCompliance, setFilterCompliance] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewDoc, setViewDoc] = useState<IsoDocument | null>(null);

  const allClauses = Array.from(new Set(documents.map(d => d.isoClause).filter(Boolean))).sort() as string[];

  const filtered = documents.filter(doc => {
    const matchSearch = !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      String(doc.id).includes(search.trim()) ||
      (doc.isoClause ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || doc.docType === filterType;
    const matchStatus = filterStatus === "all" || doc.status === filterStatus;
    const matchClause = filterClause === "all" || doc.isoClause === filterClause;
    const verdict = complianceResults.get(doc.id)?.verdict ?? null;
    const matchCompliance =
      filterCompliance === "all" ||
      (filterCompliance === "issues" && (verdict === "Non-Compliant" || verdict === "Partially Compliant" || verdict === null)) ||
      (filterCompliance === "not_checked" && verdict === null) ||
      (filterCompliance === "compliant" && verdict === "Compliant") ||
      (filterCompliance === "partial" && verdict === "Partially Compliant") ||
      (filterCompliance === "non_compliant" && verdict === "Non-Compliant");
    return matchSearch && matchType && matchStatus && matchClause && matchCompliance;
  }).sort((a, b) => {
    let av: string = "";
    let bv: string = "";
    if (sortKey === "title") { av = a.title; bv = b.title; }
    else if (sortKey === "docType") { av = a.docType; bv = b.docType; }
    else if (sortKey === "isoClause") { av = a.isoClause ?? ""; bv = b.isoClause ?? ""; }
    else if (sortKey === "version") { av = a.version; bv = b.version; }
    else if (sortKey === "status") { av = a.status; bv = b.status; }
    else if (sortKey === "approvedBy") { av = a.approvedBy ?? ""; bv = b.approvedBy ?? ""; }
    else if (sortKey === "approvalDate") { av = a.approvalDate ? new Date(a.approvalDate).toISOString() : ""; bv = b.approvalDate ? new Date(b.approvalDate).toISOString() : ""; }
    else if (sortKey === "reviewDate") { av = a.reviewDate ? new Date(a.reviewDate).toISOString() : ""; bv = b.reviewDate ? new Date(b.reviewDate).toISOString() : ""; }
    const cmp = av.localeCompare(bv);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const printMasterList = () => {
    const orgName = project?.orgName ?? "Organization";
    const standard = project?.standard ?? "ISO 9001";
    const logoUrl = project?.logoUrl as string | undefined;
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${orgName} logo" style="max-height:50px;max-width:140px;object-fit:contain;" />`
      : `<div style="font-size:15pt;font-weight:800;color:#1e3a5f;">${orgName}</div>`;

    const rows = filtered.map(doc => {
      const verdict = complianceResults.get(doc.id)?.verdict ?? null;
      const verdictLabel = verdict ?? "Not Checked";
      return `
      <tr>
        <td>${doc.id}</td>
        <td>${doc.title}</td>
        <td>${DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</td>
        <td>${doc.isoClause ?? "—"}</td>
        <td>Rev. ${doc.version}</td>
        <td>${doc.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</td>
        <td>${doc.approvalDate ? new Date(doc.approvalDate).toLocaleDateString("en-US") : "—"}</td>
        <td>${doc.approvedBy ?? "—"}</td>
        <td>${doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString("en-US") : "—"}</td>
        <td>${verdictLabel}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Master Document List — ${orgName}</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:9pt;color:#1a1a1a;background:#fff}
  .page{max-width:11in;margin:0 auto;padding:0.5in 0.7in}
  .header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:10px;border-bottom:3px solid #1e3a5f;margin-bottom:16px}
  .header-right{text-align:right;font-size:8pt;color:#555}
  .title{font-size:14pt;font-weight:800;color:#1e3a5f;margin-bottom:4px}
  .subtitle{font-size:8pt;color:#666;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;font-size:8pt}
  th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left;font-size:7.5pt;font-weight:700;white-space:nowrap}
  td{padding:5px 8px;border-bottom:1px solid #e0e8f0;vertical-align:top}
  tr:nth-child(even) td{background:#f7f9fc}
  .footer{margin-top:20px;padding-top:8px;border-top:1px solid #e0e0e0;display:flex;justify-content:space-between;font-size:7pt;color:#999}
  @media print{body{font-size:8pt}.page{padding:0.3in 0.5in}@page{margin:0.3in;size:letter landscape}}
</style></head><body>
<div class="page">
  <div class="header">
    <div>${logoHtml}</div>
    <div class="header-right">
      <div style="font-weight:700;color:#1e3a5f">Master Document List</div>
      <div>${standard} · ISO 7.5 Documented Information</div>
      <div>${dateStr}</div>
    </div>
  </div>
  <div class="title">Master Document List</div>
  <div class="subtitle">${orgName} · ${filtered.length} document${filtered.length !== 1 ? "s" : ""} · Generated ${dateStr}</div>
  <table>
    <thead><tr>
      <th>Doc ID</th><th>Title</th><th>Type</th><th>ISO Clause</th>
      <th>Revision</th><th>Status</th><th>Approval Date</th>
      <th>Approved By</th><th>Next Review</th><th>Compliance</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>Generated by ACSI ISO Manager · ${standard}</span>
    <span>${orgName} · Master Document List · ${dateStr}</span>
  </div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

    const win = window.open("", "_blank", "width=1100,height=750");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const thCls = "px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-primary select-none whitespace-nowrap";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-primary flex items-center gap-2"><List className="w-4 h-4" /> Master Document List</h2>
          <p className="text-xs text-muted-foreground">ISO 7.5 — All controlled documents with current revision status</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={printMasterList}
          data-testid="button-print-master-list"
        >
          <Printer className="w-3.5 h-3.5" /> Print / Export
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search by title, doc ID, or clause…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-master-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] h-8 text-xs" data-testid="select-master-type">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="select-master-status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="obsolete">Obsolete</SelectItem>
          </SelectContent>
        </Select>
        {allClauses.length > 0 && (
          <Select value={filterClause} onValueChange={setFilterClause}>
            <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="select-master-clause">
              <SelectValue placeholder="All Clauses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clauses</SelectItem>
              {allClauses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterCompliance} onValueChange={setFilterCompliance}>
          <SelectTrigger className="w-[155px] h-8 text-xs" data-testid="select-master-compliance">
            <SelectValue placeholder="All Compliance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Compliance</SelectItem>
            <SelectItem value="issues">Issues Only</SelectItem>
            <SelectItem value="not_checked">Not Checked</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="partial">Partially Compliant</SelectItem>
            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading documents…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
          <List className="w-8 h-8 mb-2 opacity-30" />
          No documents match the current filters.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className={thCls + " w-16"}>
                    <span className="flex items-center gap-1">Doc ID</span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("title")}>
                    <span className="flex items-center gap-1">Title <SortIcon k="title" /></span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("docType")}>
                    <span className="flex items-center gap-1">Type <SortIcon k="docType" /></span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("isoClause")}>
                    <span className="flex items-center gap-1">ISO Clause <SortIcon k="isoClause" /></span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("version")}>
                    <span className="flex items-center gap-1">Revision <SortIcon k="version" /></span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("status")}>
                    <span className="flex items-center gap-1">Status <SortIcon k="status" /></span>
                  </th>
                  <th className={thCls}>
                    <span className="flex items-center gap-1">Compliance</span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("approvalDate")}>
                    <span className="flex items-center gap-1">Approval Date <SortIcon k="approvalDate" /></span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("approvedBy")}>
                    <span className="flex items-center gap-1">Approved By <SortIcon k="approvedBy" /></span>
                  </th>
                  <th className={thCls} onClick={() => handleSort("reviewDate")}>
                    <span className="flex items-center gap-1">Next Review <SortIcon k="reviewDate" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setViewDoc(doc)} data-testid={`row-master-${doc.id}`}>
                    <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {doc.id}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-xs text-primary leading-tight flex items-center gap-1.5">
                        {doc.title}
                        <Eye className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {DOC_TYPE_LABELS[doc.docType] ?? doc.docType}
                    </td>
                    <td className="px-3 py-2.5">
                      {doc.isoClause ? (
                        <span className="font-mono text-xs bg-primary/5 text-primary px-1.5 py-0.5 rounded">{doc.isoClause}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">Rev. {doc.version}</td>
                    <td className="px-3 py-2.5">
                      {doc.status === "approved" && <Badge className="bg-green-100 text-green-800 border border-green-200 text-[10px]">Approved</Badge>}
                      {doc.status === "draft" && <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]">Draft</Badge>}
                      {doc.status === "in_review" && <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px]">In Review</Badge>}
                      {doc.status === "obsolete" && <Badge variant="secondary" className="text-[10px]">Obsolete</Badge>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" data-testid={`compliance-doc-${doc.id}`}>
                      {(() => {
                        const verdict = complianceResults.get(doc.id)?.verdict ?? null;
                        if (verdict === "Compliant") return <Badge className="bg-green-100 text-green-800 border border-green-200 text-[10px]">Compliant</Badge>;
                        if (verdict === "Partially Compliant") return <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">Partially Compliant</Badge>;
                        if (verdict === "Non-Compliant") return <Badge className="bg-red-100 text-red-800 border border-red-200 text-[10px]">Non-Compliant</Badge>;
                        return <span className="text-[10px] text-muted-foreground">—</span>;
                      })()}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {doc.approvalDate ? format(new Date(doc.approvalDate), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {doc.approvedBy ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {doc.reviewDate ? format(new Date(doc.reviewDate), "MMM d, yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">{filtered.length} of {documents.length} document{documents.length !== 1 ? "s" : ""}</p>
            <p className="text-[11px] text-muted-foreground">ISO 7.5 Master Document List</p>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal ─────────────────────────────────────────── */}
      {viewDoc && (
        <Dialog open onOpenChange={() => setViewDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b bg-muted/30">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <FileText className="w-4 h-4 text-accent shrink-0" />
                  <h2 className="text-base font-black text-primary leading-tight">{viewDoc.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono bg-primary/5 text-primary px-1.5 py-0.5 rounded">Doc #{viewDoc.id}</span>
                  <span>{DOC_TYPE_LABELS[viewDoc.docType] ?? viewDoc.docType}</span>
                  {viewDoc.isoClause && <span className="font-mono bg-primary/5 text-primary px-1.5 py-0.5 rounded">Clause {viewDoc.isoClause}</span>}
                  <span className="font-mono">Rev. {viewDoc.version}</span>
                  {viewDoc.status === "approved" && <Badge className="bg-green-100 text-green-800 border border-green-200 text-[10px] h-4">Approved</Badge>}
                  {viewDoc.status === "draft" && <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] h-4">Draft</Badge>}
                  {viewDoc.status === "in_review" && <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] h-4">In Review</Badge>}
                  {viewDoc.status === "obsolete" && <Badge variant="secondary" className="text-[10px] h-4">Obsolete</Badge>}
                </div>
                {(viewDoc.approvedBy || viewDoc.approvalDate || viewDoc.reviewDate) && (
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                    {viewDoc.approvedBy && <span>Approved by: <strong className="text-foreground">{viewDoc.approvedBy}</strong></span>}
                    {viewDoc.approvalDate && <span>Approval date: <strong className="text-foreground">{format(new Date(viewDoc.approvalDate), "MMM d, yyyy")}</strong></span>}
                    {viewDoc.reviewDate && <span>Next review: <strong className="text-foreground">{format(new Date(viewDoc.reviewDate), "MMM d, yyyy")}</strong></span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  data-testid="button-print-doc-viewer"
                  onClick={() => printIsoDocument(viewDoc, project)}
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
                <button
                  onClick={() => setViewDoc(null)}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  data-testid="button-close-doc-viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Content */}
            <ScrollArea className="flex-1 px-6 py-5">
              {viewDoc.content?.trim() ? (
                <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground">{viewDoc.content}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No content yet</p>
                  <p className="text-xs mt-1">Use the Documents tab to draft content with Isa's help.</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Change Control Log ───────────────────────────────────────────────────────

interface ChangeLogEntry {
  id: string | number;
  date: string | null;
  doc_title: string;
  doc_id: number;
  change_reason: string | null;
  changed_by: string | null;
  approved_by: string | null;
  dcr_status: string;
  rev_from: string | null;
  rev_to: string | null;
  change_type: "formal_dcr" | "ai_assisted";
}

function ChangeControlLog({ documents, isoProjectId }: { documents: IsoDocument[]; isoProjectId: number | null }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDoc, setFilterDoc] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const queryUrl = isoProjectId
    ? `/api/change-control-log?isoProjectId=${isoProjectId}`
    : "/api/change-control-log";

  const { data: logEntries, isLoading } = useQuery<ChangeLogEntry[]>({
    queryKey: ["/api/change-control-log", isoProjectId],
    queryFn: () => fetch(queryUrl, { credentials: "include" }).then(r => r.json()),
  });

  const filtered = (logEntries ?? []).filter(entry => {
    const matchSearch = !search ||
      entry.doc_title.toLowerCase().includes(search.toLowerCase()) ||
      (entry.change_reason ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (entry.changed_by ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (entry.approved_by ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || entry.change_type === filterType;
    const matchDoc = filterDoc === "all" || String(entry.doc_id) === filterDoc;
    const entryDate = entry.date ? new Date(entry.date) : null;
    const matchFrom = !dateFrom || (entryDate && entryDate >= new Date(dateFrom));
    const matchTo = !dateTo || (entryDate && entryDate <= new Date(dateTo + "T23:59:59"));
    return matchSearch && matchType && matchDoc && matchFrom && matchTo;
  });

  const sortedDocs = [...documents].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-primary flex items-center gap-2"><ScrollText className="w-4 h-4" /> Change Control Log</h2>
          <p className="text-xs text-muted-foreground">ISO 7.5.3 — Chronological record of all document changes</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search reason, changed by…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-changelog-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="select-changelog-type">
            <SelectValue placeholder="All Change Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Change Types</SelectItem>
            <SelectItem value="formal_dcr">Formal DCR</SelectItem>
            <SelectItem value="ai_assisted">AI-Assisted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDoc} onValueChange={setFilterDoc}>
          <SelectTrigger className="w-[180px] h-8 text-xs" data-testid="select-changelog-doc">
            <SelectValue placeholder="All Documents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            {sortedDocs.map(d => (
              <SelectItem key={d.id} value={String(d.id)}>{d.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            className="h-8 px-2 text-xs border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            data-testid="input-changelog-date-from"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            className="h-8 px-2 text-xs border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            data-testid="input-changelog-date-to"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading change log…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
          <ScrollText className="w-8 h-8 mb-2 opacity-30" />
          <p>No change log entries match the current filters.</p>
          <p className="text-xs mt-1">Changes appear here after document revisions are approved.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white dark:bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Document</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Rev Change</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Change Reason</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Changed By</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Approved By</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((entry, i) => (
                  <tr key={String(entry.id)} className="hover:bg-muted/20 transition-colors" data-testid={`row-changelog-${i}`}>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-semibold text-primary">{entry.doc_title}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">
                      {entry.rev_from && entry.rev_to ? (
                        <span className="flex items-center gap-1">
                          <span className="text-muted-foreground">{entry.rev_from}</span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <span className="font-bold text-primary">{entry.rev_to}</span>
                        </span>
                      ) : entry.rev_to ? (
                        <span className="font-bold text-primary">Rev. {entry.rev_to}</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground max-w-[240px]">
                      <p className="truncate" title={entry.change_reason ?? ""}>{entry.change_reason ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {entry.changed_by ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {entry.approved_by ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.change_type === "formal_dcr" ? (
                        <Badge className="bg-orange-100 text-orange-800 border border-orange-200 text-[10px] whitespace-nowrap">Formal DCR</Badge>
                      ) : (
                        <Badge className="bg-violet-100 text-violet-800 border border-violet-200 text-[10px] whitespace-nowrap">AI-Assisted</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">{filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}</p>
            <p className="text-[11px] text-muted-foreground">ISO 7.5.3 Change Control Log</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
