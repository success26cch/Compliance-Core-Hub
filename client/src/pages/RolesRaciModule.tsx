import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IsoProject } from "@shared/schema";
import {
  Users, Bot, Plus, Trash2, Pencil, Copy,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  RotateCcw, Save, FileText, Grid3x3, ClipboardList,
  AlertTriangle, CheckCircle2, Send, Loader2,
  Building2, Info, ChevronsUpDown, X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type RaciValue = "R" | "A" | "C" | "I" | "";

interface RaciRole {
  id: string;
  title: string;
  department: string;
}

interface RaciMatrix {
  roles: RaciRole[];
  assignments: Record<string, Record<string, RaciValue>>;
}

interface JobDescription {
  id: string;
  title: string;
  department: string;
  reportsTo: string;
  content: string;
  clauses: string[];
  createdAt: string;
}

interface IsaMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RACI_CLAUSES: Array<{ id: string; section: string; label: string; short: string }> = [
  { id: "4.1",  section: "4",  label: "4.1 Context of the organization",             short: "Context of the org" },
  { id: "4.2",  section: "4",  label: "4.2 Needs & expectations of interested parties", short: "Interested parties" },
  { id: "4.3",  section: "4",  label: "4.3 Determining the scope of the QMS",        short: "QMS Scope" },
  { id: "4.4",  section: "4",  label: "4.4 QMS and its processes",                   short: "QMS processes" },
  { id: "5.1",  section: "5",  label: "5.1 Leadership and commitment",               short: "Leadership" },
  { id: "5.2",  section: "5",  label: "5.2 Customer focus",                          short: "Customer focus" },
  { id: "5.3",  section: "5",  label: "5.3 Roles, responsibilities and authorities", short: "Roles & authorities" },
  { id: "6.1",  section: "6",  label: "6.1 Actions to address risks & opportunities",short: "Risks & opportunities" },
  { id: "6.2",  section: "6",  label: "6.2 Quality objectives and planning",         short: "Quality objectives" },
  { id: "7.1",  section: "7",  label: "7.1 Resources",                               short: "Resources" },
  { id: "7.2",  section: "7",  label: "7.2 Competence",                              short: "Competence" },
  { id: "7.3",  section: "7",  label: "7.3 Awareness",                               short: "Awareness" },
  { id: "7.4",  section: "7",  label: "7.4 Communication",                           short: "Communication" },
  { id: "7.5",  section: "7",  label: "7.5 Documented information",                  short: "Documented info" },
  { id: "8.1",  section: "8",  label: "8.1 Operational planning and control",        short: "Op planning" },
  { id: "8.2",  section: "8",  label: "8.2 Requirements for products and services",  short: "Customer req'ts" },
  { id: "8.3",  section: "8",  label: "8.3 Design and development",                  short: "Design & dev" },
  { id: "8.4",  section: "8",  label: "8.4 Control of externally provided processes",short: "External providers" },
  { id: "8.5",  section: "8",  label: "8.5 Production and service provision",        short: "Production" },
  { id: "8.6",  section: "8",  label: "8.6 Release of products and services",        short: "Product release" },
  { id: "8.7",  section: "8",  label: "8.7 Control of nonconforming outputs",        short: "NCO control" },
  { id: "9.1",  section: "9",  label: "9.1 Monitoring, measurement, analysis & eval",short: "Monitoring & meas." },
  { id: "9.2",  section: "9",  label: "9.2 Internal audit",                          short: "Internal audit" },
  { id: "9.3",  section: "9",  label: "9.3 Management review",                       short: "Mgmt review" },
  { id: "10.2", section: "10", label: "10.2 Nonconformance and corrective action",   short: "NC & CAPA" },
  { id: "10.3", section: "10", label: "10.3 Continual improvement",                  short: "Continual improv." },
];

const SECTION_LABELS: Record<string, string> = {
  "4": "§4 Context",
  "5": "§5 Leadership",
  "6": "§6 Planning",
  "7": "§7 Support",
  "8": "§8 Operation",
  "9": "§9 Performance Evaluation",
  "10": "§10 Improvement",
};

// Department color palette — cycle through for unknown depts
const DEPT_COLORS: string[] = [
  "bg-violet-600", "bg-blue-600", "bg-indigo-600", "bg-emerald-600",
  "bg-amber-600", "bg-pink-600", "bg-teal-600", "bg-orange-600",
  "bg-cyan-600", "bg-red-600", "bg-lime-600", "bg-sky-600",
];

const DEPT_COLOR_MAP: Record<string, string> = {
  "Executive":       "bg-violet-600",
  "Quality":         "bg-blue-600",
  "Engineering":     "bg-indigo-600",
  "Operations":      "bg-emerald-600",
  "Supply Chain":    "bg-amber-600",
  "Human Resources": "bg-pink-600",
  "Finance":         "bg-teal-600",
  "Sales":           "bg-orange-600",
  "Customer Quality":"bg-sky-600",
  "EHS":             "bg-red-600",
  "IT":              "bg-gray-600",
};

function deptColor(dept: string, allDepts: string[]): string {
  if (DEPT_COLOR_MAP[dept]) return DEPT_COLOR_MAP[dept];
  const idx = allDepts.indexOf(dept) % DEPT_COLORS.length;
  return DEPT_COLORS[Math.max(0, idx)];
}

// ─── Org-Size Templates ────────────────────────────────────────────────────────

interface OrgTemplate {
  label: string;
  desc: string;
  roles: RaciRole[];
  assignments: Record<string, Record<string, RaciValue>>;
}

const SMALL_ROLES: RaciRole[] = [
  { id: "ceo",  title: "Top Management",       department: "Executive" },
  { id: "qm",   title: "Quality Manager / MR", department: "Quality" },
  { id: "eng",  title: "Engineering Manager",  department: "Engineering" },
  { id: "prod", title: "Production Manager",   department: "Operations" },
  { id: "pur",  title: "Purchasing Manager",   department: "Supply Chain" },
  { id: "hr",   title: "HR Manager",           department: "Human Resources" },
];

const MEDIUM_ROLES: RaciRole[] = [
  { id: "ceo",   title: "Top Management",           department: "Executive" },
  { id: "qm",    title: "Quality Manager / MR",     department: "Quality" },
  { id: "qe",    title: "Quality Engineer",          department: "Quality" },
  { id: "ia",    title: "Internal Auditor",          department: "Quality" },
  { id: "eng",   title: "Engineering Manager",       department: "Engineering" },
  { id: "pe",    title: "Process Engineer",          department: "Engineering" },
  { id: "prod",  title: "Production Manager",        department: "Operations" },
  { id: "pmgr",  title: "Production Supervisor",     department: "Operations" },
  { id: "pur",   title: "Purchasing Manager",        department: "Supply Chain" },
  { id: "cq",    title: "Customer Quality Engineer", department: "Customer Quality" },
  { id: "hr",    title: "HR Manager",                department: "Human Resources" },
  { id: "ehs",   title: "EHS Manager",               department: "EHS" },
];

const LARGE_ROLES: RaciRole[] = [
  { id: "ceo",   title: "CEO / President",           department: "Executive" },
  { id: "coo",   title: "COO / VP Operations",       department: "Executive" },
  { id: "qm",    title: "Quality Director / MR",     department: "Quality" },
  { id: "qe",    title: "Quality Engineer",           department: "Quality" },
  { id: "sqe",   title: "Supplier Quality Engineer",  department: "Quality" },
  { id: "ia",    title: "Internal Auditor",           department: "Quality" },
  { id: "doc",   title: "Document Control Spec.",     department: "Quality" },
  { id: "engd",  title: "Engineering Director",       department: "Engineering" },
  { id: "pe",    title: "Process Engineer",           department: "Engineering" },
  { id: "rd",    title: "R&D / Design Engineer",      department: "Engineering" },
  { id: "prod",  title: "Production Manager",         department: "Operations" },
  { id: "psup",  title: "Production Supervisor",      department: "Operations" },
  { id: "maint", title: "Maintenance Manager",        department: "Operations" },
  { id: "pur",   title: "Purchasing Manager",         department: "Supply Chain" },
  { id: "log",   title: "Logistics / Warehouse Mgr.", department: "Supply Chain" },
  { id: "cq",    title: "Customer Quality Engineer",  department: "Customer Quality" },
  { id: "cs",    title: "Customer Service Manager",   department: "Sales" },
  { id: "hr",    title: "HR Manager",                 department: "Human Resources" },
  { id: "train", title: "Training Coordinator",       department: "Human Resources" },
  { id: "ehs",   title: "EHS Manager",                department: "EHS" },
  { id: "cfo",   title: "CFO / Finance Manager",      department: "Finance" },
  { id: "it",    title: "IT Manager",                 department: "IT" },
];

const BASE_ASSIGNMENTS: Record<string, Record<string, RaciValue>> = {
  "4.1":  { ceo: "A", qm: "R", eng: "C", prod: "I", pur: "I", hr: "I" },
  "4.2":  { ceo: "A", qm: "R", eng: "C", prod: "I", pur: "C" },
  "4.3":  { ceo: "A", qm: "R" },
  "4.4":  { ceo: "A", qm: "R", eng: "C", prod: "C", pur: "I" },
  "5.1":  { ceo: "R", qm: "C", prod: "I" },
  "5.2":  { ceo: "A", qm: "R" },
  "5.3":  { ceo: "A", qm: "R" },
  "6.1":  { ceo: "A", qm: "R", eng: "C", prod: "C" },
  "6.2":  { ceo: "A", qm: "R", eng: "C", prod: "C" },
  "7.1":  { ceo: "A", qm: "C", prod: "R", hr: "C" },
  "7.2":  { ceo: "A", qm: "C", hr: "R",  prod: "I" },
  "7.3":  { ceo: "A", qm: "R", hr: "C",  prod: "I" },
  "7.4":  { ceo: "A", qm: "R", prod: "C" },
  "7.5":  { qm: "A", eng: "R" },
  "8.1":  { ceo: "A", qm: "C", prod: "R", eng: "C" },
  "8.2":  { ceo: "A", qm: "R", eng: "C" },
  "8.3":  { ceo: "A", eng: "R", qm: "C" },
  "8.4":  { ceo: "A", pur: "R", qm: "C" },
  "8.5":  { ceo: "A", prod: "R", qm: "C", eng: "C" },
  "8.6":  { qm: "A", prod: "R" },
  "8.7":  { prod: "A", qm: "R", eng: "C" },
  "9.1":  { ceo: "A", qm: "R", prod: "I" },
  "9.2":  { ceo: "A", qm: "R" },
  "9.3":  { ceo: "A", qm: "R" },
  "10.2": { ceo: "A", qm: "R", eng: "C", prod: "C" },
  "10.3": { ceo: "A", qm: "R", eng: "C", prod: "C" },
};

function buildAssignmentsForRoles(
  roles: RaciRole[],
  base: Record<string, Record<string, RaciValue>>
): Record<string, Record<string, RaciValue>> {
  const roleIds = new Set(roles.map(r => r.id));
  return Object.fromEntries(
    Object.entries(base).map(([clauseId, roleMap]) => [
      clauseId,
      Object.fromEntries(
        Object.entries(roleMap).filter(([rid]) => roleIds.has(rid))
      ),
    ])
  );
}

// Medium/large role assignments extend the small ones with sensible defaults
const MEDIUM_EXTRA: Record<string, Record<string, RaciValue>> = {
  "4.1":  { qe: "C", ia: "C", cq: "I", ehs: "C" },
  "4.4":  { qe: "C", pe: "C" },
  "6.1":  { qe: "C", ehs: "C" },
  "7.2":  { qe: "C", ia: "C", train: "C" },
  "7.3":  { qe: "C" },
  "7.5":  { qe: "C", ia: "C" },
  "8.2":  { cq: "R", qe: "C" },
  "8.3":  { pe: "R" },
  "8.4":  { sqe: "R", qe: "C" },
  "8.5":  { pe: "C", pmgr: "I" },
  "8.6":  { qe: "C" },
  "8.7":  { qe: "C", pmgr: "I" },
  "9.2":  { ia: "R" },
  "10.2": { qe: "C", ia: "C" },
};

function mergeAssignments(
  base: Record<string, Record<string, RaciValue>>,
  extra: Record<string, Record<string, RaciValue>>,
  roleIds: Set<string>
): Record<string, Record<string, RaciValue>> {
  const result: Record<string, Record<string, RaciValue>> = { ...base };
  for (const [clauseId, roleMap] of Object.entries(extra)) {
    result[clauseId] = {
      ...(result[clauseId] ?? {}),
      ...Object.fromEntries(
        Object.entries(roleMap).filter(([rid]) => roleIds.has(rid))
      ),
    };
  }
  return result;
}

const ORG_TEMPLATES: OrgTemplate[] = [
  {
    label: "Small  (10–50 employees)",
    desc: "6 core roles — ideal for lean QMS teams",
    roles: SMALL_ROLES,
    assignments: buildAssignmentsForRoles(SMALL_ROLES, BASE_ASSIGNMENTS),
  },
  {
    label: "Medium  (50–200 employees)",
    desc: "12 roles with specialist functions",
    roles: MEDIUM_ROLES,
    assignments: mergeAssignments(
      buildAssignmentsForRoles(MEDIUM_ROLES, BASE_ASSIGNMENTS),
      MEDIUM_EXTRA,
      new Set(MEDIUM_ROLES.map(r => r.id))
    ),
  },
  {
    label: "Large  (200+ employees)",
    desc: "22 roles across all departments",
    roles: LARGE_ROLES,
    assignments: mergeAssignments(
      mergeAssignments(
        buildAssignmentsForRoles(LARGE_ROLES, BASE_ASSIGNMENTS),
        MEDIUM_EXTRA,
        new Set(LARGE_ROLES.map(r => r.id))
      ),
      {
        "8.3": { rd: "C" },
        "8.4": { sqe: "R", log: "I" },
        "8.5": { maint: "I" },
        "9.3": { cfo: "I", coo: "C" },
        "7.2": { train: "R" },
      },
      new Set(LARGE_ROLES.map(r => r.id))
    ),
  },
];

// ─── RACI helpers ─────────────────────────────────────────────────────────────

const RACI_CYCLE: RaciValue[] = ["R", "A", "C", "I", ""];

const RACI_STYLE: Record<RaciValue, string> = {
  R: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/50 font-bold",
  A: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700/50 font-bold",
  C: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700/50 font-bold",
  I: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/50 font-bold",
  "": "bg-muted/20 text-muted-foreground/40 border-border/30 hover:border-accent/40 hover:bg-accent/5",
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function nextRaciValue(current: RaciValue): RaciValue {
  const idx = RACI_CYCLE.indexOf(current);
  return RACI_CYCLE[(idx + 1) % RACI_CYCLE.length];
}

// ─── RACI Validation ──────────────────────────────────────────────────────────

interface RaciValidation {
  missingAccountable: string[];
  multipleAccountable: string[];
  noAssignments: string[];
  totalFilled: number;
  totalCells: number;
}

function validateRaci(matrix: RaciMatrix): RaciValidation {
  const missingAccountable: string[] = [];
  const multipleAccountable: string[] = [];
  const noAssignments: string[] = [];
  let totalFilled = 0;
  const totalCells = RACI_CLAUSES.length * matrix.roles.length;

  for (const clause of RACI_CLAUSES) {
    const row = matrix.assignments[clause.id] ?? {};
    const vals = Object.values(row).filter(v => v !== "");
    totalFilled += vals.length;
    const accountables = matrix.roles.filter(r => row[r.id] === "A");
    if (accountables.length === 0) missingAccountable.push(clause.id);
    if (accountables.length > 1) multipleAccountable.push(clause.id);
    if (vals.length === 0) noAssignments.push(clause.id);
  }

  return { missingAccountable, multipleAccountable, noAssignments, totalFilled, totalCells };
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function RaciLegend() {
  const items: Array<{ v: RaciValue; desc: string }> = [
    { v: "R", desc: "Responsible — Does the work" },
    { v: "A", desc: "Accountable — Owns the outcome (one per row)" },
    { v: "C", desc: "Consulted — Provides input" },
    { v: "I", desc: "Informed — Kept in the loop" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      {items.map(i => (
        <span key={i.v} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${RACI_STYLE[i.v]}`}>
          <strong>{i.v}</strong> <span className="font-normal hidden sm:inline">— {i.desc}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Role Dialog ──────────────────────────────────────────────────────────────

function RoleDialog({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void; initial?: RaciRole;
  onSave: (r: RaciRole) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [dept, setDept] = useState(initial?.department ?? "");
  useEffect(() => { setTitle(initial?.title ?? ""); setDept(initial?.department ?? ""); }, [initial]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ id: initial?.id ?? generateId(), title: title.trim(), department: dept.trim() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{initial ? "Edit Role" : "Add Role"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Role / Job Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Quality Engineer" data-testid="input-role-title" />
          </div>
          <div>
            <Label>Department</Label>
            <Input value={dept} onChange={e => setDept(e.target.value)}
              placeholder="e.g. Quality" data-testid="input-role-dept" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim()} data-testid="button-save-role">
              Save Role
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Isa Chat Panel ───────────────────────────────────────────────────────────

function IsaChatPanel({ project, matrix, onClose }: {
  project: IsoProject | null;
  matrix: RaciMatrix;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<IsaMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm Isa, your ISO lead auditor. I can help you build a compliant RACI matrix for **ISO §5.3 — Roles, Responsibilities, and Authorities**.

Here's what I can help with:
- **Role selection**: What positions should be in your matrix?
- **Assignment guidance**: Who should be Accountable vs Responsible for specific clauses?
- **Audit readiness**: What do auditors look for in a roles matrix?
- **Organization scaling**: How to structure RACI for 20, 100, or 500+ employees

What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const roleList = matrix.roles.map(r => `${r.title} (${r.department || "—"})`).join(", ");
    const validation = validateRaci(matrix);
    const missingA = validation.missingAccountable.slice(0, 5).join(", ");

    const systemPrompt = `You are Isa, Lead ISO Auditor for ACSI ISO Manager. You are helping the user build an ISO §5.3 RACI matrix.

Organization: ${project?.orgName ?? "the organization"}
Standard: ${project?.standard ?? "ISO 9001"}
Current roles in matrix: ${roleList || "none yet"}
Matrix fill rate: ${validation.totalFilled}/${validation.totalCells} cells assigned
Clauses missing an Accountable (A): ${missingA || "none"}

You are an expert in ISO 9001, IATF 16949, AS9100, ISO 14001, ISO 45001, ISO 13485, and ISO 27001. 
Give practical, actionable advice. Be concise but thorough. Use bullet points when listing multiple items.
Reference specific ISO clause numbers when relevant. 
IMPORTANT: Each ISO clause row should have exactly ONE person Accountable (A). Multiple Rs are fine, but multiple As is an audit finding.`;

    try {
      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
          systemPrompt,
        }),
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content ?? "Sorry, I couldn't respond." }]);
    } catch {
      toast({ title: "Isa is unavailable right now", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="w-80 shrink-0 flex flex-col border-l border-border/60 bg-white dark:bg-card">
      {/* Panel header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-border/60 bg-violet-50 dark:bg-violet-900/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-violet-800 dark:text-violet-200">Ask Isa</div>
            <div className="text-[10px] text-violet-600 dark:text-violet-400">ISO §5.3 advisor</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-white rounded-br-sm"
                : "bg-muted/60 dark:bg-muted/30 text-foreground rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted/60 rounded-xl rounded-bl-sm px-3 py-2 text-xs flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Isa is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 1 && (
        <div className="shrink-0 px-3 pb-2 flex flex-col gap-1.5">
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Quick questions</div>
          {[
            "Who should be Accountable for 8.4?",
            "What roles do auditors typically look for?",
            "We have 80 employees. Which template?",
            "Can I assign A to two people?",
          ].map(q => (
            <button key={q} onClick={() => { setInput(q); }}
              className="text-left text-xs text-violet-700 dark:text-violet-300 hover:underline px-1 py-0.5 rounded">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 flex gap-2 p-3 border-t border-border/60">
        <Textarea
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask Isa about your RACI matrix…"
          rows={2} className="text-xs resize-none flex-1"
          data-testid="input-isa-chat"
        />
        <Button size="sm" onClick={send} disabled={loading || !input.trim()}
          className="self-end bg-violet-600 hover:bg-violet-700 text-white"
          data-testid="button-send-isa">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Validation Summary Bar ────────────────────────────────────────────────────

function ValidationBar({ validation, roles }: { validation: RaciValidation; roles: RaciRole[] }) {
  const issues = validation.missingAccountable.length + validation.multipleAccountable.length;
  const pct = validation.totalCells > 0 ? Math.round((validation.totalFilled / validation.totalCells) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-border/40 bg-muted/20 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="font-semibold text-muted-foreground">Coverage:</div>
        <div className="font-bold text-foreground">{pct}%</div>
        <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="font-semibold text-muted-foreground">Roles:</div>
        <div className="font-bold text-foreground">{roles.length}</div>
      </div>
      {issues === 0 && roles.length > 0 ? (
        <div className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-medium">All clauses have an Accountable — audit ready</span>
        </div>
      ) : issues > 0 ? (
        <div className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="font-medium">{validation.missingAccountable.length} clause{validation.missingAccountable.length !== 1 ? "s" : ""} missing an Accountable</span>
          {validation.multipleAccountable.length > 0 && (
            <span>, {validation.multipleAccountable.length} with multiple A's</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── RACI Matrix Tab ──────────────────────────────────────────────────────────

function RaciMatrixTab({ project, matrix, onChange, showIsa, onToggleIsa }: {
  project: IsoProject | null;
  matrix: RaciMatrix;
  onChange: (m: RaciMatrix) => void;
  showIsa: boolean;
  onToggleIsa: () => void;
}) {
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; editing?: RaciRole }>({ open: false });
  const [templateMenu, setTemplateMenu] = useState(false);
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());

  const validation = validateRaci(matrix);

  // Group roles by department
  const allDepts = [...new Set(matrix.roles.map(r => r.department || "Other"))];
  const deptGroups: Array<{ dept: string; roles: RaciRole[]; color: string }> = allDepts.map(dept => ({
    dept,
    roles: matrix.roles.filter(r => (r.department || "Other") === dept),
    color: deptColor(dept, allDepts),
  }));

  // Visible roles (not collapsed)
  const visibleRoles = matrix.roles.filter(r => !collapsedDepts.has(r.department || "Other"));

  const setCell = (clauseId: string, roleId: string, current: RaciValue) => {
    const next = nextRaciValue(current);
    onChange({
      ...matrix,
      assignments: {
        ...matrix.assignments,
        [clauseId]: { ...matrix.assignments[clauseId], [roleId]: next },
      },
    });
  };

  const toggleDept = (dept: string) => {
    setCollapsedDepts(prev => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });
  };

  const addRole = (role: RaciRole) => onChange({ ...matrix, roles: [...matrix.roles, role] });
  const editRole = (role: RaciRole) => onChange({ ...matrix, roles: matrix.roles.map(r => r.id === role.id ? role : r) });
  const deleteRole = (roleId: string) => {
    onChange({
      roles: matrix.roles.filter(r => r.id !== roleId),
      assignments: Object.fromEntries(
        Object.entries(matrix.assignments).map(([cid, rm]) => {
          const { [roleId]: _, ...rest } = rm; return [cid, rest];
        })
      ),
    });
  };

  const loadTemplate = (tpl: OrgTemplate) => {
    onChange({ roles: tpl.roles, assignments: tpl.assignments });
    setTemplateMenu(false);
  };

  const sections = [...new Set(RACI_CLAUSES.map(c => c.section))];

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Matrix area */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Toolbar */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 pt-2.5 pb-2 border-b border-border/40">
          <RaciLegend />
          <div className="ml-auto flex items-center gap-2">
            {/* Isa toggle */}
            <Button variant="outline" size="sm" onClick={onToggleIsa}
              data-testid="button-toggle-isa"
              className={`text-xs gap-1.5 ${showIsa ? "bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/20" : "text-muted-foreground"}`}>
              <Bot className="w-3.5 h-3.5" />
              {showIsa ? "Hide Isa" : "Ask Isa"}
            </Button>

            {/* Org template */}
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setTemplateMenu(v => !v)}
                data-testid="button-template-menu"
                className="text-xs text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 gap-1">
                <Users className="w-3.5 h-3.5" />
                Load Template
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </Button>
              {templateMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 w-72 bg-white dark:bg-card border border-border/60 rounded-xl shadow-xl py-1">
                  {ORG_TEMPLATES.map(tpl => (
                    <button key={tpl.label} onClick={() => loadTemplate(tpl)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors">
                      <div className="text-xs font-bold text-foreground">{tpl.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{tpl.desc}</div>
                    </button>
                  ))}
                  <div className="border-t border-border/40 mx-3 my-1" />
                  <div className="px-4 py-2 text-[10px] text-muted-foreground italic">
                    Templates use ISO best-practice defaults. You can customize after loading.
                  </div>
                </div>
              )}
            </div>

            {/* Add role */}
            <Button variant="outline" size="sm" onClick={() => setRoleDialog({ open: true })}
              data-testid="button-add-role"
              className="text-xs text-accent border-accent/40 hover:bg-accent/10">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Role
            </Button>
          </div>
        </div>

        {/* Validation bar */}
        {matrix.roles.length > 0 && (
          <ValidationBar validation={validation} roles={matrix.roles} />
        )}

        {/* Scroll area */}
        <div className="flex-1 overflow-auto" onClick={() => setTemplateMenu(false)}>
          {matrix.roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
              <Grid3x3 className="w-12 h-12 text-muted-foreground/25 mb-4" />
              <h3 className="font-bold text-muted-foreground mb-1">No roles added yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-6">
                The RACI matrix maps ISO clauses to job roles.
                Start with a size template (Small / Medium / Large) or add roles manually.
                Each clause should have exactly one role marked <strong>A</strong> (Accountable).
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                {ORG_TEMPLATES.map(tpl => (
                  <Button key={tpl.label} variant="outline" size="sm" onClick={() => loadTemplate(tpl)}
                    className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                    {tpl.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="min-w-max">
              <table className="text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-white dark:bg-card">
                  {/* Row 1 — Department groups */}
                  <tr>
                    <th rowSpan={2}
                      className="text-left font-semibold text-foreground border-b border-r border-border/60 px-3 py-2.5 min-w-[270px] bg-muted/30 align-bottom">
                      ISO Clause
                    </th>
                    {deptGroups.map(({ dept, roles, color }) => {
                      const collapsed = collapsedDepts.has(dept);
                      const visibleCount = collapsed ? 0 : roles.length;
                      return (
                        <th key={dept}
                          colSpan={collapsed ? 1 : roles.length}
                          className={`${color} text-white text-center text-[10px] font-bold uppercase tracking-widest border-b border-r border-white/30 px-2 py-1.5 min-w-[80px]`}>
                          <button onClick={() => toggleDept(dept)}
                            className="flex items-center gap-1 mx-auto hover:opacity-80"
                            data-testid={`button-collapse-dept-${dept}`}
                            title={collapsed ? "Expand department" : "Collapse department"}>
                            {collapsed
                              ? <ChevronRight className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />}
                            {dept}
                            {collapsed && <span className="text-white/70">({roles.length})</span>}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                  {/* Row 2 — Role names */}
                  <tr>
                    {deptGroups.map(({ dept, roles, color }) => {
                      const collapsed = collapsedDepts.has(dept);
                      if (collapsed) {
                        return (
                          <th key={`collapsed-${dept}`}
                            className={`${color} text-white/60 text-center text-[9px] italic border-b border-r border-border/60 px-1 py-2 min-w-[32px] max-w-[32px] w-8`}>
                            —
                          </th>
                        );
                      }
                      return roles.map(role => (
                        <th key={role.id}
                          className="text-center border-b border-r border-border/60 px-1 py-1.5 min-w-[88px] bg-muted/20">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-semibold text-foreground leading-tight text-center max-w-[80px] break-words">
                              {role.title}
                            </span>
                            <div className="flex gap-1">
                              <button onClick={() => setRoleDialog({ open: true, editing: role })}
                                className="p-0.5 rounded text-muted-foreground hover:text-accent"
                                data-testid={`button-edit-role-${role.id}`} title="Edit">
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={() => deleteRole(role.id)}
                                className="p-0.5 rounded text-muted-foreground hover:text-red-500"
                                data-testid={`button-delete-role-${role.id}`} title="Remove">
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </th>
                      ));
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sections.map(section => (
                    <>
                      <tr key={`s-${section}`} className="bg-primary/5 dark:bg-primary/10">
                        <td colSpan={visibleRoles.length + deptGroups.filter(g => collapsedDepts.has(g.dept)).length + 1}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary border-b border-border/30">
                          {SECTION_LABELS[section]}
                        </td>
                      </tr>
                      {RACI_CLAUSES.filter(c => c.section === section).map((clause, idx) => {
                        const hasA = matrix.roles.some(r => matrix.assignments[clause.id]?.[r.id] === "A");
                        const multiA = matrix.roles.filter(r => matrix.assignments[clause.id]?.[r.id] === "A").length > 1;
                        return (
                          <tr key={clause.id}
                            className={`border-b border-border/20 ${idx % 2 === 0 ? "" : "bg-muted/10"} hover:bg-accent/5`}>
                            <td className="px-3 py-1.5 border-r border-border/40 min-w-[270px]">
                              <div className="flex items-center gap-1.5">
                                {matrix.roles.length > 0 && !hasA && (
                                  <span title="No Accountable assigned — ISO audit risk"
                                    className="shrink-0 text-amber-500">
                                    <AlertTriangle className="w-3 h-3" />
                                  </span>
                                )}
                                {multiA && (
                                  <span title="Multiple Accountable assigned — each clause should have exactly one"
                                    className="shrink-0 text-red-500">
                                    <AlertTriangle className="w-3 h-3" />
                                  </span>
                                )}
                                <span className="font-medium text-foreground leading-tight">{clause.label}</span>
                              </div>
                            </td>
                            {deptGroups.map(({ dept, roles }) => {
                              if (collapsedDepts.has(dept)) {
                                return (
                                  <td key={`col-${dept}`} className="border-r border-border/20 bg-muted/30 w-8 max-w-[32px]" />
                                );
                              }
                              return roles.map(role => {
                                const val: RaciValue = (matrix.assignments[clause.id]?.[role.id] ?? "") as RaciValue;
                                return (
                                  <td key={role.id} className="text-center border-r border-border/20 p-0.5 min-w-[88px]">
                                    <button
                                      onClick={() => setCell(clause.id, role.id, val)}
                                      data-testid={`cell-${clause.id}-${role.id}`}
                                      title={`${clause.short} × ${role.title} — click to cycle`}
                                      className={`w-full h-7 rounded border text-xs transition-all cursor-pointer hover:opacity-75 ${RACI_STYLE[val]}`}>
                                      {val || "·"}
                                    </button>
                                  </td>
                                );
                              });
                            })}
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Isa chat side panel */}
      {showIsa && (
        <IsaChatPanel project={project} matrix={matrix} onClose={onToggleIsa} />
      )}

      {/* Role dialog */}
      <RoleDialog
        open={roleDialog.open}
        initial={roleDialog.editing}
        onClose={() => setRoleDialog({ open: false })}
        onSave={role => roleDialog.editing ? editRole(role) : addRole(role)}
      />
    </div>
  );
}

// ─── Job Descriptions Tab ─────────────────────────────────────────────────────

function JobDescriptionsTab({ project, jds, onChange }: {
  project: IsoProject | null;
  jds: JobDescription[];
  onChange: (jds: JobDescription[]) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const deleteJd = (id: string) => onChange(jds.filter(j => j.id !== id));
  const copyJd = (jd: JobDescription) => { navigator.clipboard.writeText(jd.content); };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {jds.length === 0 ? "Generate ISO-aligned job descriptions with Isa." : `${jds.length} job description${jds.length !== 1 ? "s" : ""}`}
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} data-testid="button-new-jd"
          className="text-xs bg-accent text-white hover:bg-accent/90">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Job Description
        </Button>
      </div>

      {jds.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="p-10 text-center">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No job descriptions yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Isa generates complete job descriptions including responsibilities, authorities, required qualifications, and ISO clause references.
            </p>
            <Button size="sm" className="mt-4 bg-accent text-white hover:bg-accent/90"
              onClick={() => setShowNew(true)} data-testid="button-new-jd-empty">
              <Bot className="w-3.5 h-3.5 mr-1.5" /> Generate with Isa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jds.map(jd => (
            <Card key={jd.id} className="border border-border/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold text-foreground">{jd.title}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-0.5 flex gap-3 flex-wrap">
                      {jd.department && <span>📂 {jd.department}</span>}
                      {jd.reportsTo && <span>↑ {jd.reportsTo}</span>}
                      <span className="text-muted-foreground/50">{new Date(jd.createdAt).toLocaleDateString()}</span>
                    </div>
                    {jd.clauses.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {jd.clauses.map(c => (
                          <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">§{c}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => copyJd(jd)} title="Copy" data-testid={`button-copy-jd-${jd.id}`}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteJd(jd.id)} title="Delete" data-testid={`button-delete-jd-${jd.id}`}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpanded(expanded === jd.id ? null : jd.id)}
                      data-testid={`button-expand-jd-${jd.id}`}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                      {expanded === jd.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </CardHeader>
              {expanded === jd.id && (
                <CardContent className="px-4 pb-4">
                  <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {jd.content}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <NewJdDialog open={showNew} onClose={() => setShowNew(false)} project={project}
        onSave={jd => { onChange([...jds, jd]); setShowNew(false); }} />
    </div>
  );
}

// ─── New JD Dialog ────────────────────────────────────────────────────────────

function NewJdDialog({ open, onClose, project, onSave }: {
  open: boolean; onClose: () => void;
  project: IsoProject | null; onSave: (jd: JobDescription) => void;
}) {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [context, setContext] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const standard = project?.standard ?? "ISO 9001";
  const processes = (project?.processes as any[]) ?? [];

  const handleGenerate = async () => {
    if (!title.trim()) { toast({ title: "Enter a job title first", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const procCtx = processes.length
        ? `\n\nOrganization's QMS processes:\n${processes.map((p: any) => `- ${p.name} (Owner: ${p.owner})`).join("\n")}`
        : "";

      const systemPrompt = `You are Isa, Lead ISO Auditor for ACSI ISO Manager.

Organization: ${project?.orgName ?? "the organization"}
Standard: ${standard}
${procCtx}

Generate a complete, professional job description for ${standard}. Include:
1. POSITION SUMMARY
2. KEY RESPONSIBILITIES (8+ items with ISO clause references)
3. AUTHORITY LEVELS (decisions this role owns independently)
4. REQUIRED QUALIFICATIONS
5. PREFERRED QUALIFICATIONS  
6. ISO CLAUSE REFERENCES (primary clauses this role supports)
7. PERFORMANCE INDICATORS (2-3 measurable KPIs)

Be specific to the industry and standard. Professional HR style.`;

      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Generate a job description for:\nTitle: ${title}\nDepartment: ${dept || "not specified"}\nReports To: ${reportsTo || "not specified"}\n${context ? `Context: ${context}` : ""}` }],
          systemPrompt,
        }),
      });
      const data = await resp.json();
      setContent(data.content ?? "Failed to generate. Please try again.");
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!content.trim()) { toast({ title: "Generate content first", variant: "destructive" }); return; }
    const clauses = [...new Set(
      [...(content.matchAll(/\b(\d+\.\d+(?:\.\d+)?)\b/g))].map(m => m[1])
    )].filter(c => RACI_CLAUSES.some(rc => rc.id === c)).slice(0, 8);
    onSave({ id: generateId(), title: title.trim(), department: dept.trim(), reportsTo: reportsTo.trim(), content: content.trim(), clauses, createdAt: new Date().toISOString() });
    setTitle(""); setDept(""); setReportsTo(""); setContext(""); setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-600" /> Generate Job Description with Isa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Job Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Quality Engineer" data-testid="input-jd-title" /></div>
            <div><Label>Department</Label>
              <Input value={dept} onChange={e => setDept(e.target.value)}
                placeholder="e.g. Quality" data-testid="input-jd-dept" /></div>
          </div>
          <div><Label>Reports To</Label>
            <Input value={reportsTo} onChange={e => setReportsTo(e.target.value)}
              placeholder="e.g. Quality Manager" data-testid="input-jd-reports-to" /></div>
          <div><Label>Additional Context</Label>
            <Textarea value={context} onChange={e => setContext(e.target.value)}
              placeholder="e.g. Focused on supplier quality and incoming inspection" rows={2}
              data-testid="input-jd-context" /></div>
          <Button onClick={handleGenerate} disabled={generating || !title.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-generate-jd">
            <Bot className="w-4 h-4 mr-2" />
            {generating ? "Isa is writing your job description…" : "Generate with Isa"}
          </Button>
          {content && (
            <div><Label>Generated Content (editable)</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)}
                rows={16} className="text-xs font-mono mt-1" data-testid="input-jd-content" /></div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!content.trim()} onClick={handleSave}
              data-testid="button-save-jd" className="bg-accent text-white hover:bg-accent/90">
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export default function RolesRaciModule({ project, onStartWizard }: {
  project: IsoProject | null;
  onStartWizard?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"raci" | "jd">("raci");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showIsa, setShowIsa] = useState(false);

  const [matrix, setMatrix] = useState<RaciMatrix>(() => {
    const raw = (project as any)?.raciMatrix;
    return (raw && raw.roles) ? raw : { roles: [], assignments: {} };
  });

  const [jds, setJds] = useState<JobDescription[]>(() => (project as any)?.jobDescriptions ?? []);

  const handleMatrixChange = (m: RaciMatrix) => { setMatrix(m); setDirty(true); };
  const handleJdsChange = (j: JobDescription[]) => { setJds(j); setDirty(true); };

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/iso-projects", { raciMatrix: matrix, jobDescriptions: jds });
      qc.invalidateQueries({ queryKey: ["/api/iso-projects"] });
      toast({ title: "Saved" });
      setDirty(false);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/10">
        <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No ISO project found</p>
        {onStartWizard && <Button size="sm" className="mt-4" onClick={onStartWizard}>Start Setup Wizard</Button>}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col" data-testid="roles-raci-module">

      {/* Header */}
      <div className="shrink-0 px-6 py-3.5 border-b border-border/60 bg-white dark:bg-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black text-primary flex items-center gap-2">
                Roles, Responsibilities &amp; Authorities
                <span className="text-xs font-mono text-accent">ISO §5.3</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Department-grouped RACI matrix · {project.standard} · AI job description generator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
            <Button size="sm" onClick={save} disabled={saving || !dirty}
              data-testid="button-save-raci" className="bg-primary text-white hover:bg-primary/90">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {([
            { key: "raci", icon: Grid3x3, label: "RACI Matrix" },
            { key: "jd",   icon: FileText, label: "Job Descriptions" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              data-testid={`tab-${key}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === key ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key === "jd" && jds.length > 0 && (
                <span className="ml-1 px-1.5 py-0 rounded-full bg-accent text-white text-[10px] font-bold">{jds.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === "raci" ? (
          <RaciMatrixTab
            project={project}
            matrix={matrix}
            onChange={handleMatrixChange}
            showIsa={showIsa}
            onToggleIsa={() => setShowIsa(v => !v)}
          />
        ) : (
          <JobDescriptionsTab project={project} jds={jds} onChange={handleJdsChange} />
        )}
      </div>
    </div>
  );
}
