import { useState, useEffect } from "react";
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
  Map,
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

export function DocumentationModule({ onAskIsa }: DocumentationModuleProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<IsoDocument | null>(null);
  const [draftDoc, setDraftDoc] = useState<IsoDocument | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [changeReqDoc, setChangeReqDoc] = useState<IsoDocument | null>(null);
  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<IsoDocument[]>({
    queryKey: ["/api/iso-documents"],
  });

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

  const handleDraftWithIsa = async (doc: IsoDocument) => {
    setDraftDoc(doc);
    setDraftContent("");
    setIsDrafting(true);
    try {
      const res = await fetch(`/api/iso-documents/${doc.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Draft request failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");
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
              if (data.content) setDraftContent(prev => prev + data.content);
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

  const saveDraftToDocument = async () => {
    if (!draftDoc) return;
    try {
      const res = await apiRequest("PATCH", `/api/iso-documents/${draftDoc.id}`, { content: draftContent });
      queryClient.invalidateQueries({ queryKey: ["/api/iso-documents"] });
      setDraftDoc(null);
      setDraftContent("");
      toast({ title: "Draft saved", description: "Document content updated with Isa's draft." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
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
      <div className={`flex flex-col p-6 overflow-y-auto transition-all duration-200 ${draftDoc ? "w-1/2" : "flex-1"}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-black text-primary">Documentation Library</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your ISO Quality Management System documentation</p>
        </div>
        <Button 
          onClick={() => handleNewDoc()}
          className="bg-accent hover:bg-accent/90 text-white gap-2"
          data-testid="button-new-document"
        >
          <Plus className="w-4 h-4" /> New Document
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-white border p-1 h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-white">All</TabsTrigger>
          {DOC_TYPES.map(type => (
            <TabsTrigger key={type.value} value={type.value} className="data-[state=active]:bg-accent data-[state=active]:text-white">
              {type.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="coverage_map" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-1.5" data-testid="tab-coverage-map">
            <Map className="w-3.5 h-3.5" /> Coverage Map
          </TabsTrigger>
          <TabsTrigger value="change_requests" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white gap-1.5 relative" data-testid="tab-change-requests">
            <GitMerge className="w-3.5 h-3.5" /> Change Control
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {pendingCount}
              </span>
            )}
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
        <ClauseCoverageMap documents={documents || []} onAskIsa={onAskIsa} />
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
              onPrint={() => printIsoDocument(doc, project ?? null)}
              onRequestChange={() => setChangeReqDoc(doc)}
              getIcon={getDocIcon}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      )}
      </div>

      {/* Draft with Isa panel */}
      {draftDoc && (
        <div className="w-1/2 border-l border-border/60 flex flex-col bg-white dark:bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-violet-50 dark:bg-violet-950/30 shrink-0">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-violet-900 dark:text-violet-200">Isa Draft</p>
              <p className="text-[10px] text-violet-700 dark:text-violet-400 truncate">{draftDoc.title}</p>
            </div>
            {isDrafting && (
              <span className="text-[10px] text-violet-600 dark:text-violet-400 animate-pulse font-semibold">Writing…</span>
            )}
            {!isDrafting && draftContent && (
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
              onClick={() => { setDraftDoc(null); setDraftContent(""); }}
              className="text-violet-500 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
              data-testid="button-close-draft"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!draftContent && isDrafting && (
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

function DocumentCard({ doc, onEdit, onDelete, onAskIsa, onDraftWithIsa, onPrint, onRequestChange, getIcon, getStatusBadge }: any) {
  const [showHistory, setShowHistory] = useState(false);
  const prevVersions: any[] = Array.isArray(doc.previousVersions) ? doc.previousVersions : [];

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

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">
            Updated {format(new Date(doc.updatedAt || doc.createdAt), 'MMM d, yyyy')}
          </p>
          <div className="flex gap-1.5 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
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

function ChangeRequestDialog({ doc, onClose, onSubmit, isPending }: any) {
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
                            <div className="flex items-center gap-1.5 text-[10px] text-green-700 dark:text-green-400 font-semibold pl-0.5">
                              <Mail className="w-3 h-3" />
                              Notification sent to <span className="font-black">{req.designated_reviewer_email}</span>
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
  // Default: show logo only when a logo URL actually exists
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

  const handleDialogDraft = async () => {
    setIsDraftingDialog(true);
    setFormData(prev => ({ ...prev, content: "" }));
    try {
      // Use the new doc's fields if no saved doc, otherwise use existing doc endpoint
      const url = doc?.id
        ? `/api/iso-documents/${doc.id}/generate`
        : `/api/iso-documents/generate-draft`;
      const body = doc?.id ? undefined : JSON.stringify({
        docType: formData.docType,
        title: formData.title,
        isoClause: formData.isoClause,
      });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...(body ? { body } : {}),
      });
      if (!res.ok) throw new Error("Draft request failed");
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
              if (data.content) setFormData(prev => ({ ...prev, content: (prev.content || "") + data.content }));
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
    } else if (isOpen) {
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
                  title={!formData.title ? "Enter a title first" : "Let Isa draft the full document content"}
                  data-testid="button-draft-isa-dialog"
                >
                  <Sparkles className="w-3 h-3" />
                  {isDraftingDialog ? "Drafting…" : "Draft with Isa"}
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
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-white" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Saving..." : (doc ? "Update Document" : "Create Document")}
          </Button>
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

function ClauseCoverageMap({ documents, onAskIsa }: { documents: IsoDocument[]; onAskIsa: (prompt: string) => void }) {
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
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Documents</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ISO_9001_CLAUSES.map(({ clause, title }) => {
              const status = getStatusForClause(clause);
              const clauseDocs = getDocsForClause(clause);
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
