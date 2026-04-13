import { useState, useCallback } from "react";
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
import type { IsoProject } from "@shared/schema";
import {
  Users, Bot, Plus, Trash2, Pencil, Copy, Printer,
  ChevronDown, ChevronUp, Download, RotateCcw, Save,
  FileText, Grid3x3, ClipboardList,
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

// ─── Constants ────────────────────────────────────────────────────────────────

const RACI_CLAUSES: Array<{ id: string; section: string; label: string; iatf?: string }> = [
  { id: "4.1", section: "4", label: "4.1 Context of the organization", iatf: "4.1" },
  { id: "4.2", section: "4", label: "4.2 Needs & expectations of interested parties", iatf: "4.2" },
  { id: "4.3", section: "4", label: "4.3 Determining the scope of the QMS", iatf: "4.3" },
  { id: "4.4", section: "4", label: "4.4 QMS and its processes", iatf: "4.4" },
  { id: "5.1", section: "5", label: "5.1 Leadership and commitment", iatf: "5.1.1" },
  { id: "5.2", section: "5", label: "5.2 Customer focus", iatf: "5.1.2" },
  { id: "5.3", section: "5", label: "5.3 Roles, responsibilities and authorities", iatf: "5.3" },
  { id: "6.1", section: "6", label: "6.1 Actions to address risks and opportunities", iatf: "6.1" },
  { id: "6.2", section: "6", label: "6.2 Quality objectives and planning", iatf: "6.2" },
  { id: "7.1", section: "7", label: "7.1 Resources", iatf: "7.1" },
  { id: "7.2", section: "7", label: "7.2 Competence", iatf: "7.2" },
  { id: "7.3", section: "7", label: "7.3 Awareness", iatf: "7.3" },
  { id: "7.4", section: "7", label: "7.4 Communication", iatf: "7.4" },
  { id: "7.5", section: "7", label: "7.5 Documented information", iatf: "7.5" },
  { id: "8.1", section: "8", label: "8.1 Operational planning and control", iatf: "8.1" },
  { id: "8.2", section: "8", label: "8.2 Requirements for products and services", iatf: "8.2" },
  { id: "8.3", section: "8", label: "8.3 Design and development", iatf: "8.3" },
  { id: "8.4", section: "8", label: "8.4 Control of externally provided processes", iatf: "8.4" },
  { id: "8.5", section: "8", label: "8.5 Production and service provision", iatf: "8.5" },
  { id: "8.6", section: "8", label: "8.6 Release of products and services", iatf: "8.6" },
  { id: "8.7", section: "8", label: "8.7 Control of nonconforming outputs", iatf: "8.7" },
  { id: "9.1", section: "9", label: "9.1 Monitoring, measurement, analysis and evaluation", iatf: "9.1" },
  { id: "9.2", section: "9", label: "9.2 Internal audit", iatf: "9.2" },
  { id: "9.3", section: "9", label: "9.3 Management review", iatf: "9.3" },
  { id: "10.2", section: "10", label: "10.2 Nonconformance and corrective action", iatf: "10.2" },
  { id: "10.3", section: "10", label: "10.3 Continual improvement", iatf: "10.3" },
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

const DEFAULT_ROLES: RaciRole[] = [
  { id: "ceo", title: "Top Management", department: "Executive" },
  { id: "qm",  title: "Quality Manager / MR", department: "Quality" },
  { id: "eng", title: "Engineering Manager", department: "Engineering" },
  { id: "prod",title: "Production Manager", department: "Operations" },
  { id: "pur", title: "Purchasing Manager", department: "Supply Chain" },
  { id: "hr",  title: "HR Manager", department: "Human Resources" },
];

const IATF_DEFAULTS: Record<string, Record<string, RaciValue>> = {
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
  "7.2":  { ceo: "A", qm: "C", hr: "R", prod: "I" },
  "7.3":  { ceo: "A", qm: "R", hr: "C", prod: "I" },
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

const RACI_CYCLE: RaciValue[] = ["R", "A", "C", "I", ""];

const RACI_STYLE: Record<RaciValue, string> = {
  R: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/50 font-bold",
  A: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700/50 font-bold",
  C: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700/50 font-bold",
  I: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/50 font-bold",
  "": "bg-muted/30 text-muted-foreground border-border/40 hover:border-accent/40",
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function nextRaciValue(current: RaciValue): RaciValue {
  const idx = RACI_CYCLE.indexOf(current);
  return RACI_CYCLE[(idx + 1) % RACI_CYCLE.length];
}

// ─── RACI Legend ─────────────────────────────────────────────────────────────

function RaciLegend() {
  const items: Array<{ value: RaciValue; label: string; desc: string }> = [
    { value: "R", label: "R — Responsible", desc: "Does the work" },
    { value: "A", label: "A — Accountable", desc: "Owns the outcome" },
    { value: "C", label: "C — Consulted", desc: "Provides input" },
    { value: "I", label: "I — Informed", desc: "Kept in the loop" },
  ];
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {items.map(i => (
        <span key={i.value} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${RACI_STYLE[i.value]}`}>
          <strong>{i.value}</strong> — {i.desc}
        </span>
      ))}
    </div>
  );
}

// ─── Add / Edit Role Dialog ───────────────────────────────────────────────────

function RoleDialog({
  open, onClose, initial, onSave,
}: { open: boolean; onClose: () => void; initial?: RaciRole; onSave: (r: RaciRole) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [dept, setDept] = useState(initial?.department ?? "");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ id: initial?.id ?? generateId(), title: title.trim(), department: dept.trim() });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Role" : "Add Role"}</DialogTitle>
        </DialogHeader>
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

// ─── RACI Matrix Tab ──────────────────────────────────────────────────────────

function RaciMatrixTab({
  project, matrix, onChange,
}: {
  project: IsoProject | null;
  matrix: RaciMatrix;
  onChange: (m: RaciMatrix) => void;
}) {
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; editing?: RaciRole }>({ open: false });

  const setCell = (clauseId: string, roleId: string, current: RaciValue) => {
    const next = nextRaciValue(current);
    const newAssignments = {
      ...matrix.assignments,
      [clauseId]: { ...matrix.assignments[clauseId], [roleId]: next },
    };
    onChange({ ...matrix, assignments: newAssignments });
  };

  const addRole = (role: RaciRole) => {
    const roles = [...matrix.roles, role];
    onChange({ ...matrix, roles });
  };

  const editRole = (role: RaciRole) => {
    const roles = matrix.roles.map(r => r.id === role.id ? role : r);
    onChange({ ...matrix, roles });
  };

  const deleteRole = (roleId: string) => {
    const roles = matrix.roles.filter(r => r.id !== roleId);
    const assignments = Object.fromEntries(
      Object.entries(matrix.assignments).map(([cid, roleMap]) => {
        const { [roleId]: _, ...rest } = roleMap;
        return [cid, rest];
      })
    );
    onChange({ ...matrix, roles, assignments });
  };

  const loadDefaults = () => {
    onChange({
      roles: DEFAULT_ROLES,
      assignments: Object.fromEntries(
        Object.entries(IATF_DEFAULTS).map(([clauseId, roleMap]) => [
          clauseId,
          Object.fromEntries(Object.entries(roleMap).filter(([rid]) =>
            DEFAULT_ROLES.some(r => r.id === rid)
          ))
        ])
      ),
    });
  };

  const sections = [...new Set(RACI_CLAUSES.map(c => c.section))];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 border-b border-border/40">
        <RaciLegend />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDefaults}
            data-testid="button-load-defaults"
            className="text-xs text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Load IATF Defaults
          </Button>
          <Button variant="outline" size="sm"
            onClick={() => setRoleDialog({ open: true })}
            data-testid="button-add-role"
            className="text-xs text-accent border-accent/40 hover:bg-accent/10">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Role
          </Button>
        </div>
      </div>

      {/* Matrix scroll area */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <table className="text-xs border-collapse w-full">
            <thead className="sticky top-0 z-10 bg-white dark:bg-card">
              <tr>
                <th className="text-left font-semibold text-foreground border-b border-r border-border/60 px-3 py-2.5 min-w-[260px] bg-muted/30">
                  ISO Clause
                </th>
                {matrix.roles.map(role => (
                  <th key={role.id}
                    className="text-center font-semibold text-foreground border-b border-r border-border/60 px-2 py-2 min-w-[90px] bg-muted/30">
                    <div className="flex flex-col items-center gap-1">
                      <span className="leading-tight text-center">{role.title}</span>
                      {role.department && (
                        <span className="text-[9px] font-normal text-muted-foreground">{role.department}</span>
                      )}
                      <div className="flex gap-1">
                        <button onClick={() => setRoleDialog({ open: true, editing: role })}
                          className="p-0.5 rounded text-muted-foreground hover:text-accent"
                          data-testid={`button-edit-role-${role.id}`} title="Edit role">
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button onClick={() => deleteRole(role.id)}
                          className="p-0.5 rounded text-muted-foreground hover:text-red-500"
                          data-testid={`button-delete-role-${role.id}`} title="Remove role">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                {matrix.roles.length === 0 && (
                  <th className="text-center text-muted-foreground border-b border-border/60 px-6 py-3">
                    No roles yet — click "Add Role"
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sections.map(section => (
                <>
                  <tr key={`section-${section}`} className="bg-primary/5 dark:bg-primary/10">
                    <td colSpan={matrix.roles.length + 1}
                      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary border-b border-border/40">
                      {SECTION_LABELS[section]}
                    </td>
                  </tr>
                  {RACI_CLAUSES.filter(c => c.section === section).map((clause, idx) => (
                    <tr key={clause.id}
                      className={`border-b border-border/30 ${idx % 2 === 0 ? "" : "bg-muted/20"} hover:bg-accent/5 transition-colors`}>
                      <td className="px-3 py-2 border-r border-border/40 text-foreground min-w-[260px]">
                        <div className="font-medium leading-tight">{clause.label}</div>
                        {clause.iatf && clause.iatf !== clause.id && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">IATF {clause.iatf}</div>
                        )}
                      </td>
                      {matrix.roles.map(role => {
                        const val: RaciValue = (matrix.assignments[clause.id]?.[role.id] ?? "") as RaciValue;
                        return (
                          <td key={role.id}
                            className="text-center border-r border-border/30 p-1 min-w-[90px]">
                            <button
                              onClick={() => setCell(clause.id, role.id, val)}
                              data-testid={`cell-${clause.id}-${role.id}`}
                              title={`Click to cycle RACI value (currently: ${val || "none"})`}
                              className={`w-full h-7 rounded border text-xs transition-all cursor-pointer hover:opacity-80 ${RACI_STYLE[val]}`}>
                              {val || "·"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

// ─── Job Description Tab ──────────────────────────────────────────────────────

function JobDescriptionsTab({
  project, jds, onChange,
}: {
  project: IsoProject | null;
  jds: JobDescription[];
  onChange: (jds: JobDescription[]) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const deleteJd = (id: string) => onChange(jds.filter(j => j.id !== id));

  const copyJd = (jd: JobDescription) => {
    navigator.clipboard.writeText(jd.content).then(() => {});
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* New JD button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {jds.length === 0
            ? "No job descriptions yet. Generate your first one with Isa."
            : `${jds.length} job description${jds.length !== 1 ? "s" : ""} saved`}
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} data-testid="button-new-jd"
          className="text-xs bg-accent text-white hover:bg-accent/90">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Job Description
        </Button>
      </div>

      {/* List */}
      {jds.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="p-10 text-center">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No job descriptions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Isa will generate ISO/IATF-aligned job descriptions including responsibilities, authorities, and clause references.
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
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">{jd.title}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 flex-wrap">
                      {jd.department && <span>📂 {jd.department}</span>}
                      {jd.reportsTo && <span>↑ Reports to: {jd.reportsTo}</span>}
                      <span className="text-muted-foreground/60">
                        {new Date(jd.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {jd.clauses.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {jd.clauses.map(c => (
                          <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                            §{c}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => copyJd(jd)} title="Copy to clipboard"
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-accent"
                      data-testid={`button-copy-jd-${jd.id}`}>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteJd(jd.id)} title="Delete"
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500"
                      data-testid={`button-delete-jd-${jd.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpanded(expanded === jd.id ? null : jd.id)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                      data-testid={`button-expand-jd-${jd.id}`}>
                      {expanded === jd.id
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </CardHeader>
              {expanded === jd.id && (
                <CardContent className="px-4 pb-4">
                  <pre className="whitespace-pre-wrap text-xs text-foreground font-sans leading-relaxed bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {jd.content}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New JD dialog */}
      <NewJdDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        project={project}
        onSave={jd => { onChange([...jds, jd]); setShowNew(false); }}
      />
    </div>
  );
}

// ─── New Job Description Dialog ───────────────────────────────────────────────

function NewJdDialog({
  open, onClose, project, onSave,
}: {
  open: boolean;
  onClose: () => void;
  project: IsoProject | null;
  onSave: (jd: JobDescription) => void;
}) {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const processes = (project?.processes as any[]) ?? [];
  const standard = project?.standard ?? "ISO 9001";

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({ title: "Enter a job title first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const processContext = processes.length
        ? `\n\nOrganization's QMS processes:\n${processes.map((p: any) => `- ${p.name} (Owner: ${p.owner}, Clauses: ${(p.clauses ?? []).join(", ")})`).join("\n")}`
        : "";

      const systemPrompt = `You are Isa, Lead ISO Auditor for ACSI ISO Manager. Generate a professional, ISO/IATF-aligned job description.

Organization: ${project?.orgName ?? "the organization"}
Standard: ${standard}
${processContext}

Format the job description with these sections:
1. POSITION SUMMARY
2. KEY RESPONSIBILITIES (bullet list, minimum 8 items relevant to ${standard})
3. AUTHORITY LEVELS (what decisions this role can make independently)
4. REQUIRED QUALIFICATIONS
5. PREFERRED QUALIFICATIONS
6. ISO/IATF CLAUSE REFERENCES (list the main clauses this role supports)
7. PERFORMANCE INDICATORS (2-3 measurable KPIs for this role)

Be specific, practical, and reference relevant ISO/IATF clauses throughout. Write in a professional HR style.`;

      const userMessage = `Generate a complete job description for the following role:

Job Title: ${title}
Department: ${dept || "Not specified"}
Reports To: ${reportsTo || "Not specified"}
${additionalContext ? `Additional context: ${additionalContext}` : ""}

Tailor the responsibilities and clause references specifically to ${standard} and this role's likely impact on the QMS.`;

      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          systemPrompt,
        }),
      });
      const data = await resp.json();
      setContent(data.content ?? "Failed to generate. Please try again.");
    } catch {
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Generate content first before saving", variant: "destructive" });
      return;
    }
    const clauseMatches = content.match(/\b(?:ISO )?(?:9001|14001|45001|13485|27001|AS9100|IATF 16949)?\s*§?(?:clause\s+)?(\d+\.\d+(?:\.\d+)?)/gi) ?? [];
    const clauses = [...new Set(clauseMatches.map(m => m.replace(/[^0-9.]/g, "")).filter(Boolean))].slice(0, 8);
    onSave({
      id: generateId(),
      title: title.trim(),
      department: dept.trim(),
      reportsTo: reportsTo.trim(),
      content: content.trim(),
      clauses,
      createdAt: new Date().toISOString(),
    });
    setTitle(""); setDept(""); setReportsTo(""); setAdditionalContext(""); setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-600" />
            Generate Job Description with Isa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Job Title / Role *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Quality Engineer" data-testid="input-jd-title" />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={dept} onChange={e => setDept(e.target.value)}
                placeholder="e.g. Quality" data-testid="input-jd-dept" />
            </div>
          </div>
          <div>
            <Label>Reports To</Label>
            <Input value={reportsTo} onChange={e => setReportsTo(e.target.value)}
              placeholder="e.g. Quality Manager" data-testid="input-jd-reports-to" />
          </div>
          <div>
            <Label>Additional Context (optional)</Label>
            <Textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. This role will focus on supplier quality and incoming inspection"
              rows={2} data-testid="input-jd-context" />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !title.trim()} className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            data-testid="button-generate-jd">
            <Bot className="w-4 h-4 mr-2" />
            {generating ? "Isa is writing your job description…" : "Generate with Isa"}
          </Button>
          {content && (
            <div>
              <Label>Generated Job Description (editable)</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)}
                rows={16} data-testid="input-jd-content"
                className="text-xs font-mono mt-1" />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={!content.trim()} onClick={handleSave}
              data-testid="button-save-jd" className="bg-accent text-white hover:bg-accent/90">
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Job Description
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export default function RolesRaciModule({
  project, onStartWizard,
}: {
  project: IsoProject | null;
  onStartWizard?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"raci" | "jd">("raci");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const defaultMatrix: RaciMatrix = {
    roles: [],
    assignments: {},
  };

  const [matrix, setMatrix] = useState<RaciMatrix>(() => {
    const raw = (project as any)?.raciMatrix;
    if (raw && raw.roles) return raw;
    return defaultMatrix;
  });

  const [jds, setJds] = useState<JobDescription[]>(() => {
    return (project as any)?.jobDescriptions ?? [];
  });

  const handleMatrixChange = (m: RaciMatrix) => { setMatrix(m); setDirty(true); };
  const handleJdsChange = (j: JobDescription[]) => { setJds(j); setDirty(true); };

  const save = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/iso-projects", {
        raciMatrix: matrix,
        jobDescriptions: jds,
      });
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
        <p className="text-xs text-muted-foreground mt-1">Complete the setup wizard first.</p>
        {onStartWizard && (
          <Button size="sm" className="mt-4" onClick={onStartWizard}>Start Setup Wizard</Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col" data-testid="roles-raci-module">

      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-white dark:bg-card">
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
                RACI matrix linking {project.standard} clauses to roles · AI-powered job description generator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
            )}
            <Button size="sm" onClick={save} disabled={saving || !dirty}
              data-testid="button-save-raci"
              className="bg-primary text-white hover:bg-primary/90">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          <button
            onClick={() => setActiveTab("raci")}
            data-testid="tab-raci"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "raci"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}>
            <Grid3x3 className="w-3.5 h-3.5" />
            RACI Matrix
          </button>
          <button
            onClick={() => setActiveTab("jd")}
            data-testid="tab-jd"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "jd"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}>
            <FileText className="w-3.5 h-3.5" />
            Job Descriptions
            {jds.length > 0 && (
              <span className="ml-1 px-1.5 py-0 rounded-full bg-accent text-white text-[10px] font-bold">
                {jds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === "raci" ? (
          <RaciMatrixTab
            project={project}
            matrix={matrix}
            onChange={handleMatrixChange}
          />
        ) : (
          <JobDescriptionsTab
            project={project}
            jds={jds}
            onChange={handleJdsChange}
          />
        )}
      </div>
    </div>
  );
}
