import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus, GraduationCap, CheckCircle2, Clock, Users, ChevronDown, ChevronUp,
  Trash2, ShieldCheck, BookOpen, ClipboardList, AlertTriangle, FileText,
  Pencil, Award, Layers, BarChart2, User, ChevronRight, Grid3x3, X,
  Upload, Download, Paperclip, FileCheck, FilePlus, Image, Video,
  BookMarked, Wrench, FlaskConical, ScrollText, FileSignature,
} from "lucide-react";
import type {
  IsoAwarenessNotice, IsoAwarenessAcknowledgment, Employee,
  CompetencyRequirement, EmployeeCompetencyRecord, TrainingEventRecord,
  TrainingMatrixSkill, TrainingMatrixEntry, TrainingEvidenceFile,
} from "@shared/schema";

// ─── Constants ────────────────────────────────────────────────────────────────

const ISO_STANDARDS = [
  "ISO 9001:2015",
  "IATF 16949:2016",
  "ISO 14001:2015",
  "ISO 45001:2018",
  "ISO 13485:2016",
  "AS9100 Rev D",
  "ISO/IEC 17025:2017",
  "General / Company",
];

const COMPETENCY_TYPES = ["education", "training", "skill", "experience"];
const COMPETENCY_TYPE_LABELS: Record<string, string> = {
  education: "Education / Degree",
  training: "Formal Training",
  skill: "Demonstrated Skill",
  experience: "Work Experience",
};
const EVIDENCE_TYPES = ["diploma", "certificate", "ojt", "test", "observation", "experience"];
const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  diploma: "Diploma / Degree",
  certificate: "Certificate",
  ojt: "OJT Sign-off",
  test: "Written Test",
  observation: "Observed Competency",
  experience: "Verified Experience",
};
const TRAINING_TYPES = ["classroom", "ojt", "external", "online", "toolbox_talk", "safety_briefing", "mentoring"];
const TRAINING_TYPE_LABELS: Record<string, string> = {
  classroom: "Classroom",
  ojt: "On-the-Job (OJT)",
  external: "External Training",
  online: "Online / e-Learning",
  toolbox_talk: "Toolbox Talk",
  safety_briefing: "Safety Briefing",
  mentoring: "Mentoring / Coaching",
};
const PROCESS_AREAS = [
  "Quality", "Production", "Engineering", "Purchasing / Supply Chain",
  "Shipping / Receiving", "Management", "Human Resources", "Maintenance",
  "Sales / Customer Service", "Document Control", "All Departments",
];

// ─── Evidence File Document Categories ────────────────────────────────────────
export const DOC_CATEGORIES: { value: string; label: string; description: string }[] = [
  { value: "certificate",            label: "Certificate / Diploma",           description: "External or internal certification, degree, or credential" },
  { value: "sign_off_sheet",         label: "Sign-Off Sheet",                  description: "Supervisor or trainer sign-off confirming competency" },
  { value: "work_instruction",       label: "Work Instruction (WI)",           description: "Controlled WI for a specific production operation or process" },
  { value: "inspection_instruction", label: "Inspection Instruction",          description: "Controlled inspection or quality check procedure" },
  { value: "calibration_procedure",  label: "Calibration Procedure",           description: "Gage or instrument calibration instruction" },
  { value: "sop",                    label: "Standard Operating Procedure",    description: "SOP, procedure, or process instruction" },
  { value: "test_result",            label: "Written Test / Exam Result",      description: "Scored test or quiz demonstrating knowledge" },
  { value: "photo",                  label: "Photo Evidence",                  description: "Photograph demonstrating task completion or condition" },
  { value: "video",                  label: "Video (Future)",                  description: "Reserved — video training content (coming soon)" },
  { value: "other",                  label: "Other",                           description: "Any other supporting document" },
];
const DOC_CAT_LABELS: Record<string, string> = Object.fromEntries(DOC_CATEGORIES.map(c => [c.value, c.label]));
const DOC_CAT_COLORS: Record<string, string> = {
  certificate:            "bg-green-50 text-green-700 border-green-200",
  sign_off_sheet:         "bg-blue-50 text-blue-700 border-blue-200",
  work_instruction:       "bg-orange-50 text-orange-700 border-orange-200",
  inspection_instruction: "bg-purple-50 text-purple-700 border-purple-200",
  calibration_procedure:  "bg-teal-50 text-teal-700 border-teal-200",
  sop:                    "bg-yellow-50 text-yellow-700 border-yellow-200",
  test_result:            "bg-indigo-50 text-indigo-700 border-indigo-200",
  photo:                  "bg-pink-50 text-pink-700 border-pink-200",
  video:                  "bg-slate-100 text-slate-600 border-slate-200",
  other:                  "bg-gray-50 text-gray-600 border-gray-200",
};

function docCatIcon(cat: string) {
  const map: Record<string, any> = {
    certificate:            Award,
    sign_off_sheet:         FileSignature,
    work_instruction:       Wrench,
    inspection_instruction: FlaskConical,
    calibration_procedure:  BookMarked,
    sop:                    ScrollText,
    test_result:            FileCheck,
    photo:                  Image,
    video:                  Video,
    other:                  FileText,
  };
  return map[cat] ?? FileText;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function competencyTypeBadge(t: string) {
  const map: Record<string, string> = {
    education: "bg-blue-50 text-blue-700 border-blue-200",
    training: "bg-orange-50 text-orange-700 border-orange-200",
    skill: "bg-purple-50 text-purple-700 border-purple-200",
    experience: "bg-green-50 text-green-700 border-green-200",
  };
  return map[t] ?? "bg-muted text-muted-foreground";
}
function evidenceBadge(t: string) {
  const map: Record<string, string> = {
    diploma: "bg-blue-50 text-blue-700",
    certificate: "bg-green-50 text-green-700",
    ojt: "bg-orange-50 text-orange-700",
    test: "bg-purple-50 text-purple-700",
    observation: "bg-teal-50 text-teal-700",
    experience: "bg-slate-50 text-slate-700",
  };
  return map[t] ?? "bg-muted text-muted-foreground";
}
function statusBadge(s: string) {
  if (s === "active") return "bg-green-50 text-green-700 border-green-200";
  if (s === "expired") return "bg-red-50 text-red-700 border-red-200";
  return "bg-yellow-50 text-yellow-700 border-yellow-200";
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export function TrainingAwarenessModule({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <GraduationCap className="w-5 h-5" /> Training & Awareness
          </h2>
          <p className="text-xs text-muted-foreground">ISO 9001 7.2 Competence · 7.3 Awareness · IATF 16949 7.2.2 – 7.2.4</p>
        </div>
        {onAskIsa && (
          <Button size="sm" variant="outline" onClick={() => onAskIsa("What are the full competence and awareness requirements under ISO 9001 7.2 and 7.3, and how do IATF 16949 7.2.2 OJT requirements apply to production operators?")}>
            Ask Isa
          </Button>
        )}
      </div>

      <Tabs defaultValue="matrix" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="mx-6 mt-3 shrink-0 w-fit">
          <TabsTrigger value="matrix" className="text-xs gap-1.5"><Layers className="w-3.5 h-3.5" />Competence Matrix</TabsTrigger>
          <TabsTrigger value="records" className="text-xs gap-1.5"><User className="w-3.5 h-3.5" />Employee Records</TabsTrigger>
          <TabsTrigger value="log" className="text-xs gap-1.5"><ClipboardList className="w-3.5 h-3.5" />Training Log</TabsTrigger>
          <TabsTrigger value="skills" className="text-xs gap-1.5"><Grid3x3 className="w-3.5 h-3.5" />Skills Matrix</TabsTrigger>
          <TabsTrigger value="awareness" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" />Awareness 7.3</TabsTrigger>
          <TabsTrigger value="special" className="text-xs gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Special Reqs</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="flex-1 overflow-auto mt-0 p-6">
          <CompetenceMatrixTab onAskIsa={onAskIsa} />
        </TabsContent>
        <TabsContent value="records" className="flex-1 overflow-auto mt-0 p-6">
          <EmployeeRecordsTab />
        </TabsContent>
        <TabsContent value="log" className="flex-1 overflow-auto mt-0 p-6">
          <TrainingLogTab />
        </TabsContent>
        <TabsContent value="skills" className="flex-1 overflow-hidden mt-0">
          <SkillsMatrixTab />
        </TabsContent>
        <TabsContent value="awareness" className="flex-1 overflow-auto mt-0 p-6">
          <AwarenessTab onAskIsa={onAskIsa} />
        </TabsContent>
        <TabsContent value="special" className="flex-1 overflow-auto mt-0 p-6">
          <SpecialReqsTab onAskIsa={onAskIsa} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Competence Matrix (7.2)
// ═══════════════════════════════════════════════════════════════════════════════

function CompetenceMatrixTab({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<CompetencyRequirement | null>(null);
  const [newRole, setNewRole] = useState("");
  const [showNewRole, setShowNewRole] = useState(false);

  const { data: requirements = [], isLoading } = useQuery<CompetencyRequirement[]>({
    queryKey: ["/api/competency-requirements"],
  });

  const roles = useMemo(() => {
    const set = new Set(requirements.map(r => r.jobTitle));
    return Array.from(set).sort();
  }, [requirements]);

  const roleReqs = useMemo(
    () => requirements.filter(r => r.jobTitle === selectedRole),
    [requirements, selectedRole],
  );

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/competency-requirements", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/competency-requirements"] }); setShowAdd(false); toast({ title: "Competency requirement added" }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PATCH", `/api/competency-requirements/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/competency-requirements"] }); setEditItem(null); toast({ title: "Updated" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/competency-requirements/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/competency-requirements"] }); toast({ title: "Removed" }); },
  });

  const addRole = () => {
    if (!newRole.trim()) return;
    setSelectedRole(newRole.trim());
    setShowNewRole(false);
    setNewRole("");
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Competence Matrix — ISO 9001 7.2 / IATF 7.2.1</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Define what each job title must know, be trained in, or be able to demonstrate.</p>
        </div>
        <Button size="sm" className="bg-primary text-white gap-1" onClick={() => setShowNewRole(true)} data-testid="button-add-role">
          <Plus className="w-3.5 h-3.5" /> Add Role
        </Button>
      </div>

      {showNewRole && (
        <Card className="p-3 border-dashed flex items-center gap-2">
          <Input placeholder="Job title (e.g. Quality Engineer, Production Operator)" value={newRole} onChange={e => setNewRole(e.target.value)} className="flex-1 h-8 text-sm" data-testid="input-new-role" autoFocus onKeyDown={e => e.key === "Enter" && addRole()} />
          <Button size="sm" onClick={addRole} className="bg-primary text-white">Add</Button>
          <Button size="sm" variant="outline" onClick={() => setShowNewRole(false)}>Cancel</Button>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Role list */}
        <div className="col-span-4 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Job Roles ({roles.length})</p>
          {isLoading ? <p className="text-xs text-muted-foreground">Loading...</p> : roles.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No roles yet. Add a role to start defining competency requirements.</p>
            </Card>
          ) : roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between ${selectedRole === role ? "bg-primary text-white border-primary" : "bg-white hover:bg-muted/30 border-border"}`}
              data-testid={`button-role-${role}`}
            >
              <span>{role}</span>
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${selectedRole === role ? "bg-white/20" : "bg-muted"}`}>
                {requirements.filter(r => r.jobTitle === role).length}
              </span>
            </button>
          ))}
        </div>

        {/* Requirements for selected role */}
        <div className="col-span-8">
          {!selectedRole ? (
            <Card className="p-10 text-center border-dashed h-full flex flex-col items-center justify-center">
              <ChevronRight className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Select a job role to view and manage its competency requirements.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{selectedRole} <span className="text-muted-foreground font-normal">— Required Competencies</span></p>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)} data-testid="button-add-competency">
                  <Plus className="w-3.5 h-3.5" /> Add Competency
                </Button>
              </div>
              {roleReqs.length === 0 ? (
                <Card className="p-6 border-dashed text-center">
                  <p className="text-xs text-muted-foreground">No requirements defined for this role yet.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {roleReqs.map(req => (
                    <Card key={req.id} className="px-4 py-3 flex items-start justify-between" data-testid={`card-req-${req.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{req.competencyName}</span>
                          <Badge variant="outline" className={`text-xs ${competencyTypeBadge(req.competencyType)}`}>
                            {COMPETENCY_TYPE_LABELS[req.competencyType] ?? req.competencyType}
                          </Badge>
                          {!req.isRequired && <Badge variant="outline" className="text-xs text-muted-foreground">Preferred</Badge>}
                          {req.standard && <Badge variant="outline" className="text-xs font-mono">{req.standard}{req.clause ? ` ${req.clause}` : ""}</Badge>}
                        </div>
                        {req.description && <p className="text-xs text-muted-foreground mt-1">{req.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => setEditItem(req)} data-testid={`button-edit-req-${req.id}`}><Pencil className="w-3.5 h-3.5" /></button>
                        <button className="text-red-400 hover:text-red-600 p-1" onClick={() => deleteMut.mutate(req.id)} data-testid={`button-delete-req-${req.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {(showAdd || editItem) && (
        <CompetencyReqDialog
          jobTitle={editItem?.jobTitle ?? selectedRole ?? ""}
          initial={editItem}
          onSave={data => editItem ? updateMut.mutate({ id: editItem.id, data }) : createMut.mutate({ ...data, jobTitle: selectedRole })}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          isPending={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function CompetencyReqDialog({ jobTitle, initial, onSave, onClose, isPending }: {
  jobTitle: string; initial?: CompetencyRequirement | null;
  onSave: (d: any) => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    competencyName: initial?.competencyName ?? "",
    competencyType: initial?.competencyType ?? "training",
    description: initial?.description ?? "",
    standard: initial?.standard ?? "",
    clause: initial?.clause ?? "",
    isRequired: initial?.isRequired ?? true,
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "Edit" : "Add"} Competency Requirement — {jobTitle}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Competency Name *</Label>
            <Input placeholder="e.g. Statistical Process Control, APQP Fundamentals, Blueprint Reading" value={form.competencyName} onChange={e => setForm(f => ({ ...f, competencyName: e.target.value }))} data-testid="input-competency-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type *</Label>
              <Select value={form.competencyType} onValueChange={v => setForm(f => ({ ...f, competencyType: v }))}>
                <SelectTrigger data-testid="select-competency-type"><SelectValue /></SelectTrigger>
                <SelectContent>{COMPETENCY_TYPES.map(t => <SelectItem key={t} value={t}>{COMPETENCY_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={form.isRequired} onCheckedChange={v => setForm(f => ({ ...f, isRequired: !!v }))} data-testid="checkbox-required" />
                Required (not just preferred)
              </label>
            </div>
          </div>
          <div>
            <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea placeholder="What does this mean for this role? What evidence is acceptable?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} data-testid="textarea-competency-desc" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Standard <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={form.standard || "_none"} onValueChange={v => setForm(f => ({ ...f, standard: v === "_none" ? "" : v }))}>
                <SelectTrigger data-testid="select-req-standard"><SelectValue placeholder="Link to standard" /></SelectTrigger>
                <SelectContent><SelectItem value="_none">None</SelectItem>{ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Clause <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. 7.2, 7.2.2" value={form.clause} onChange={e => setForm(f => ({ ...f, clause: e.target.value }))} data-testid="input-req-clause" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary text-white" onClick={() => onSave(form)} disabled={isPending || !form.competencyName} data-testid="button-save-req">
              {isPending ? "Saving..." : initial ? "Update" : "Add Requirement"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Employee Competency Records & Gap Analysis
// ═══════════════════════════════════════════════════════════════════════════════

function EmployeeRecordsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<EmployeeCompetencyRecord | null>(null);
  const [activeView, setActiveView] = useState<"records" | "gaps">("records");
  const [uploadTargetRecId, setUploadTargetRecId] = useState<number | null>(null);
  const [expandedFileRecs, setExpandedFileRecs] = useState<Set<number>>(new Set());

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: requirements = [] } = useQuery<CompetencyRequirement[]>({ queryKey: ["/api/competency-requirements"] });
  const { data: allRecords = [] } = useQuery<EmployeeCompetencyRecord[]>({ queryKey: ["/api/employee-competency-records"] });
  const { data: empEvidenceFiles = [] } = useQuery<TrainingEvidenceFile[]>({
    queryKey: ["/api/training-evidence", selectedEmpId],
    enabled: selectedEmpId != null,
    queryFn: () => fetch(`/api/training-evidence?employeeId=${selectedEmpId}`).then(r => r.json()),
  });

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const empRecords = allRecords.filter(r => r.employeeId === selectedEmpId);

  // Gap analysis: requirements for employee's position vs. what they have
  const roleReqs = useMemo(() => {
    if (!selectedEmp?.position) return [];
    return requirements.filter(r => r.jobTitle.toLowerCase() === selectedEmp.position?.toLowerCase() && r.isRequired);
  }, [requirements, selectedEmp]);

  const gaps = useMemo(() => {
    return roleReqs.filter(req => {
      const hasEvidence = empRecords.some(rec =>
        rec.competencyName.toLowerCase().includes(req.competencyName.toLowerCase()) ||
        (rec.requirementId === req.id),
      );
      return !hasEvidence;
    });
  }, [roleReqs, empRecords]);

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employee-competency-records", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/employee-competency-records"] }); setShowAdd(false); toast({ title: "Evidence recorded" }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PATCH", `/api/employee-competency-records/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/employee-competency-records"] }); setEditItem(null); toast({ title: "Updated" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/employee-competency-records/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/employee-competency-records"] }); toast({ title: "Removed" }); },
  });
  const deleteFileMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-evidence/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-evidence", selectedEmpId] });
      toast({ title: "File removed" });
    },
  });

  const toggleFileExpand = (recId: number) => {
    setExpandedFileRecs(prev => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId); else next.add(recId);
      return next;
    });
  };

  const coveragePercent = roleReqs.length > 0 ? Math.round(((roleReqs.length - gaps.length) / roleReqs.length) * 100) : 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Employee Competency Records — ISO 9001 7.2</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Record evidence of competence and identify gaps against role requirements.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Employee selector */}
        <div className="col-span-4 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Employees ({employees.length})</p>
          {employees.length === 0 ? (
            <Card className="p-4 border-dashed text-center"><p className="text-xs text-muted-foreground">No employees added yet.</p></Card>
          ) : employees.map(emp => {
            const empRecs = allRecords.filter(r => r.employeeId === emp.id);
            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between ${selectedEmpId === emp.id ? "bg-primary text-white border-primary" : "bg-white hover:bg-muted/30 border-border"}`}
                data-testid={`button-employee-${emp.id}`}
              >
                <div>
                  <p>{emp.firstName} {emp.lastName}</p>
                  {emp.position && <p className={`text-xs ${selectedEmpId === emp.id ? "text-white/70" : "text-muted-foreground"}`}>{emp.position}</p>}
                </div>
                <span className={`text-xs rounded-full px-1.5 py-0.5 shrink-0 ml-1 ${selectedEmpId === emp.id ? "bg-white/20" : "bg-muted"}`}>{empRecs.length}</span>
              </button>
            );
          })}
        </div>

        {/* Employee detail */}
        <div className="col-span-8">
          {!selectedEmpId ? (
            <Card className="p-10 text-center border-dashed h-full flex flex-col items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Select an employee to view their competency profile.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{selectedEmp?.firstName} {selectedEmp?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{selectedEmp?.position ?? "No position set"} · {selectedEmp?.department ?? "No department"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {roleReqs.length > 0 && (
                    <div className="text-xs text-right">
                      <span className={`font-semibold ${coveragePercent === 100 ? "text-green-600" : coveragePercent >= 70 ? "text-orange-500" : "text-red-600"}`}>{coveragePercent}%</span>
                      <span className="text-muted-foreground"> competency coverage</span>
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)} data-testid="button-add-evidence">
                    <Plus className="w-3.5 h-3.5" /> Add Evidence
                  </Button>
                </div>
              </div>

              {/* Gap banner */}
              {gaps.length > 0 && (
                <Card className="px-4 py-3 border-orange-200 bg-orange-50 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700">{gaps.length} competency gap{gaps.length > 1 ? "s" : ""} identified</p>
                    <p className="text-xs text-orange-600 mt-0.5">{gaps.map(g => g.competencyName).join(" · ")}</p>
                  </div>
                </Card>
              )}
              {roleReqs.length > 0 && gaps.length === 0 && (
                <Card className="px-4 py-2 border-green-200 bg-green-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 font-medium">All required competencies for this role are covered.</p>
                </Card>
              )}

              {/* Tab switcher */}
              <div className="flex gap-1 border-b">
                {["records", "gaps"].map(v => (
                  <button key={v} onClick={() => setActiveView(v as any)} className={`text-xs px-3 py-1.5 font-medium border-b-2 -mb-px transition-colors ${activeView === v ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {v === "records" ? `All Records (${empRecords.length})` : `Role Gaps (${gaps.length})`}
                  </button>
                ))}
              </div>

              {activeView === "records" && (
                empRecords.length === 0 ? (
                  <Card className="p-6 border-dashed text-center"><p className="text-xs text-muted-foreground">No competency evidence recorded for this employee yet.</p></Card>
                ) : (
                  <div className="space-y-2">
                    {empRecords.map(rec => {
                      const recFiles = empEvidenceFiles.filter(f => f.competencyRecordId === rec.id);
                      const isExpanded = expandedFileRecs.has(rec.id);
                      return (
                        <Card key={rec.id} className="border" data-testid={`card-emp-rec-${rec.id}`}>
                          <div className="px-4 py-3 flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{rec.competencyName}</span>
                                <Badge variant="outline" className={`text-xs ${evidenceBadge(rec.evidenceType)}`}>{EVIDENCE_TYPE_LABELS[rec.evidenceType] ?? rec.evidenceType}</Badge>
                                <Badge variant="outline" className={`text-xs ${statusBadge(rec.status)}`}>{rec.status}</Badge>
                                {rec.isOjt && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">OJT 7.2.2</Badge>}
                                {rec.effectivenessVerified && <Badge variant="outline" className="text-xs bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3 mr-0.5" />Effectiveness Verified</Badge>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {rec.provider && <span>Provider: {rec.provider}</span>}
                                {rec.completedDate && <span>Completed: {rec.completedDate}</span>}
                                {rec.expiryDate && <span>Expires: {rec.expiryDate}</span>}
                              </div>
                              {rec.notes && <p className="text-xs text-muted-foreground mt-1 italic">{rec.notes}</p>}
                            </div>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => setEditItem(rec)}><Pencil className="w-3.5 h-3.5" /></button>
                              <button className="text-red-400 hover:text-red-600 p-1" onClick={() => deleteMut.mutate(rec.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          {/* ── Evidence file strip ── */}
                          <div className="border-t bg-slate-50/70 px-4 py-2 flex items-center justify-between gap-2">
                            <button
                              onClick={() => toggleFileExpand(rec.id)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              data-testid={`button-files-toggle-${rec.id}`}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span className="font-medium">{recFiles.length} file{recFiles.length !== 1 ? "s" : ""}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 text-xs gap-1 text-primary hover:bg-primary/10"
                              onClick={() => { setUploadTargetRecId(rec.id); }}
                              data-testid={`button-upload-file-${rec.id}`}
                            >
                              <FilePlus className="w-3.5 h-3.5" /> Upload File
                            </Button>
                          </div>
                          {/* ── Expanded file list ── */}
                          {isExpanded && (
                            <div className="border-t px-4 py-3 space-y-2">
                              {recFiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">No files attached yet. Click "Upload File" to add evidence documents.</p>
                              ) : recFiles.map(f => {
                                const Icon = docCatIcon(f.documentCategory);
                                return (
                                  <div key={f.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-white border" data-testid={`file-card-${f.id}`}>
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                      <Icon className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2 flex-wrap">
                                        <span className="font-medium text-sm leading-tight">{f.title}</span>
                                        <Badge variant="outline" className={`text-xs ${DOC_CAT_COLORS[f.documentCategory] ?? ""}`}>
                                          {DOC_CAT_LABELS[f.documentCategory] ?? f.documentCategory}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                        {f.documentNumber && <span className="text-xs text-muted-foreground font-mono">{f.documentNumber}</span>}
                                        {f.revision && <span className="text-xs text-muted-foreground">{f.revision}</span>}
                                        {f.operationName && <span className="text-xs text-slate-600 font-medium">Op: {f.operationName}</span>}
                                        <span className="text-xs text-muted-foreground">{formatBytes(f.fileSize)}</span>
                                        {f.expiresAt && <span className="text-xs text-orange-600">Exp: {f.expiresAt}</span>}
                                      </div>
                                      {f.description && <p className="text-xs text-muted-foreground mt-0.5 italic">{f.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <a
                                        href={f.fileData}
                                        download={f.fileName}
                                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                        title="Download"
                                        data-testid={`button-download-file-${f.id}`}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                      <button
                                        className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        onClick={() => deleteFileMut.mutate(f.id)}
                                        title="Delete file"
                                        data-testid={`button-delete-file-${f.id}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )
              )}

              {activeView === "gaps" && (
                gaps.length === 0 ? (
                  <Card className="p-6 border-dashed text-center"><p className="text-xs text-muted-foreground">No gaps — or no role requirements defined for "{selectedEmp?.position}".</p></Card>
                ) : (
                  <div className="space-y-2">
                    {gaps.map(gap => (
                      <Card key={gap.id} className="px-4 py-3 border-orange-200 flex items-start justify-between" data-testid={`card-gap-${gap.id}`}>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-medium text-sm">{gap.competencyName}</span>
                            <Badge variant="outline" className={`text-xs ${competencyTypeBadge(gap.competencyType)}`}>{COMPETENCY_TYPE_LABELS[gap.competencyType]}</Badge>
                          </div>
                          {gap.description && <p className="text-xs text-muted-foreground mt-1 ml-5">{gap.description}</p>}
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0 ml-2" onClick={() => { setShowAdd(true); }}>
                          <Plus className="w-3 h-3" /> Add Evidence
                        </Button>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {(showAdd || editItem) && selectedEmpId && (
        <EvidenceDialog
          employeeId={selectedEmpId}
          initial={editItem}
          onSave={data => editItem ? updateMut.mutate({ id: editItem.id, data }) : createMut.mutate({ ...data, employeeId: selectedEmpId })}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          isPending={createMut.isPending || updateMut.isPending}
        />
      )}
      {uploadTargetRecId != null && selectedEmpId != null && (
        <EvidenceFileUploadDialog
          employeeId={selectedEmpId}
          competencyRecordId={uploadTargetRecId}
          onClose={() => setUploadTargetRecId(null)}
          onUploaded={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/training-evidence", selectedEmpId] });
            setExpandedFileRecs(prev => new Set([...prev, uploadTargetRecId!]));
            setUploadTargetRecId(null);
          }}
        />
      )}
    </div>
  );
}

function EvidenceDialog({ employeeId, initial, onSave, onClose, isPending }: {
  employeeId: number; initial?: EmployeeCompetencyRecord | null;
  onSave: (d: any) => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    competencyName: initial?.competencyName ?? "",
    evidenceType: initial?.evidenceType ?? "certificate",
    provider: initial?.provider ?? "",
    completedDate: initial?.completedDate ?? "",
    expiryDate: initial?.expiryDate ?? "",
    status: initial?.status ?? "active",
    isOjt: initial?.isOjt ?? false,
    effectivenessVerified: initial?.effectivenessVerified ?? false,
    effectivenessNotes: initial?.effectivenessNotes ?? "",
    notes: initial?.notes ?? "",
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial ? "Edit" : "Add"} Competency Evidence</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label>Competency / Qualification *</Label>
            <Input placeholder="e.g. ISO 9001 Internal Auditor, Forklift Certification, SPC Training" value={form.competencyName} onChange={e => setForm(f => ({ ...f, competencyName: e.target.value }))} data-testid="input-evidence-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Evidence Type *</Label>
              <Select value={form.evidenceType} onValueChange={v => setForm(f => ({ ...f, evidenceType: v }))}>
                <SelectTrigger data-testid="select-evidence-type"><SelectValue /></SelectTrigger>
                <SelectContent>{EVIDENCE_TYPES.map(t => <SelectItem key={t} value={t}>{EVIDENCE_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="select-evidence-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Provider / Institution <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Training company, university, supervisor name" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} data-testid="input-evidence-provider" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Completed Date</Label>
              <Input type="date" value={form.completedDate} onChange={e => setForm(f => ({ ...f, completedDate: e.target.value }))} data-testid="input-evidence-completed" />
            </div>
            <div>
              <Label>Expiry Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} data-testid="input-evidence-expiry" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.isOjt} onCheckedChange={v => setForm(f => ({ ...f, isOjt: !!v }))} data-testid="checkbox-ojt" />
              OJT (IATF 7.2.2)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.effectivenessVerified} onCheckedChange={v => setForm(f => ({ ...f, effectivenessVerified: !!v }))} data-testid="checkbox-effectiveness" />
              Effectiveness Verified
            </label>
          </div>
          {form.effectivenessVerified && (
            <div>
              <Label>Effectiveness Notes</Label>
              <Input placeholder="How was effectiveness confirmed?" value={form.effectivenessNotes} onChange={e => setForm(f => ({ ...f, effectivenessNotes: e.target.value }))} data-testid="input-effectiveness-notes" />
            </div>
          )}
          <div>
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Additional context, file reference, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-evidence-notes" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary text-white" onClick={() => onSave(form)} disabled={isPending || !form.competencyName} data-testid="button-save-evidence">
              {isPending ? "Saving..." : initial ? "Update" : "Add Evidence"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Evidence File Upload Dialog
// ═══════════════════════════════════════════════════════════════════════════════

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function EvidenceFileUploadDialog({
  employeeId, competencyRecordId, onClose, onUploaded,
}: {
  employeeId: number;
  competencyRecordId: number;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    documentCategory: "certificate",
    title: "",
    description: "",
    documentNumber: "",
    revision: "",
    operationName: "",
    department: "",
    uploadedBy: "",
    expiresAt: "",
  });

  const needsWiFields = ["work_instruction", "inspection_instruction", "calibration_procedure", "sop"].includes(form.documentCategory);

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 10 MB.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    if (!form.title) {
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
      setForm(f => ({ ...f, title: nameWithoutExt }));
    }
  }, [form.title, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!selectedFile || !form.title) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const fileData: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      setUploadProgress(50);
      const payload = {
        employeeId,
        competencyRecordId,
        ...form,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        fileData,
        isActive: true,
      };
      const res = await apiRequest("POST", "/api/training-evidence", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message ?? "Upload failed");
      }
      setUploadProgress(100);
      toast({ title: "File uploaded", description: `${selectedFile.name} attached successfully.` });
      onUploaded();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedCat = DOC_CATEGORIES.find(c => c.value === form.documentCategory);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Upload Training Evidence
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* ── File Drop Zone ── */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : selectedFile ? "border-green-400 bg-green-50" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="dropzone-evidence"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              data-testid="input-evidence-file"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileCheck className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-sm text-green-700">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)} · Click to change</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground/70 mt-1">PDF, DOC, DOCX, XLS, PNG, JPG — max 10 MB</p>
              </>
            )}
          </div>

          {/* ── Document Category ── */}
          <div>
            <Label>Document Type *</Label>
            <Select value={form.documentCategory} onValueChange={v => setForm(f => ({ ...f, documentCategory: v }))} data-testid="select-doc-category">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex flex-col">
                      <span>{c.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCat && <p className="text-xs text-muted-foreground mt-1">{selectedCat.description}</p>}
          </div>

          {/* ── Title ── */}
          <div>
            <Label>Title *</Label>
            <Input
              placeholder={form.documentCategory === "work_instruction" ? "e.g. WI-001 Torque Application – Station 5" : "e.g. ISO 9001 Lead Auditor Certificate"}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              data-testid="input-file-title"
            />
          </div>

          {/* ── Controlled Document Fields (WI, SOP, etc.) ── */}
          {needsWiFields && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 space-y-3">
              <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Controlled Document Details
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Document Number</Label>
                  <Input
                    placeholder="e.g. WI-001, QP-003"
                    value={form.documentNumber}
                    onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))}
                    data-testid="input-doc-number"
                  />
                </div>
                <div>
                  <Label className="text-xs">Revision</Label>
                  <Input
                    placeholder="e.g. Rev 3, Rev C"
                    value={form.revision}
                    onChange={e => setForm(f => ({ ...f, revision: e.target.value }))}
                    data-testid="input-doc-revision"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Operation / Process Name</Label>
                <Input
                  placeholder="e.g. Station 5 – Torque Application, Final Inspection, CMM Programming"
                  value={form.operationName}
                  onChange={e => setForm(f => ({ ...f, operationName: e.target.value }))}
                  data-testid="input-operation-name"
                />
                <p className="text-xs text-muted-foreground mt-1">The specific operation or process this employee was trained on</p>
              </div>
            </div>
          )}

          {/* ── Optional Fields ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Department <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. Production, Quality" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} data-testid="input-dept" />
            </div>
            <div>
              <Label className="text-xs">Uploaded By <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input placeholder="Trainer or supervisor name" value={form.uploadedBy} onChange={e => setForm(f => ({ ...f, uploadedBy: e.target.value }))} data-testid="input-uploaded-by" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {!needsWiFields && (
              <div>
                <Label className="text-xs">Document Number <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input placeholder="e.g. CERT-2025-001" value={form.documentNumber} onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))} data-testid="input-doc-number-2" />
              </div>
            )}
            <div>
              <Label className="text-xs">Expires <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} data-testid="input-file-expiry" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              placeholder="Any additional context about this file..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              data-testid="textarea-file-desc"
            />
          </div>

          {/* ── Upload Progress ── */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span><span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-primary text-white gap-2"
              onClick={handleUpload}
              disabled={!selectedFile || !form.title || isUploading}
              data-testid="button-confirm-upload"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Training Event Log
// ═══════════════════════════════════════════════════════════════════════════════

function TrainingLogTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<TrainingEventRecord | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStd, setFilterStd] = useState("all");
  const [search, setSearch] = useState("");

  const { data: events = [], isLoading } = useQuery<TrainingEventRecord[]>({ queryKey: ["/api/training-event-records"] });

  const filtered = useMemo(() => events.filter(e => {
    if (filterType !== "all" && e.trainingType !== filterType) return false;
    if (filterStd !== "all" && e.standard !== filterStd) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !(e.trainer ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [events, filterType, filterStd, search]);

  const createMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/training-event-records", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/training-event-records"] }); setShowAdd(false); toast({ title: "Training event logged" }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PATCH", `/api/training-event-records/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/training-event-records"] }); setEditItem(null); toast({ title: "Updated" }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-event-records/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/training-event-records"] }); toast({ title: "Removed" }); },
  });

  const trainingTypeBg = (t: string) => {
    const map: Record<string, string> = {
      classroom: "bg-blue-50 text-blue-700",
      ojt: "bg-orange-50 text-orange-700",
      external: "bg-purple-50 text-purple-700",
      online: "bg-cyan-50 text-cyan-700",
      toolbox_talk: "bg-yellow-50 text-yellow-700",
      safety_briefing: "bg-red-50 text-red-700",
      mentoring: "bg-green-50 text-green-700",
    };
    return map[t] ?? "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Training Event Log — ISO 9001 7.2 / IATF 7.2.2</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Record all training conducted — classroom, OJT, external, toolbox talks, and more.</p>
        </div>
        <Button size="sm" className="bg-primary text-white gap-1" onClick={() => setShowAdd(true)} data-testid="button-log-training">
          <Plus className="w-3.5 h-3.5" /> Log Training
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search title or trainer..." className="h-8 text-sm max-w-48" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-training-search" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 text-xs w-40" data-testid="select-filter-type"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TRAINING_TYPES.map(t => <SelectItem key={t} value={t}>{TRAINING_TYPE_LABELS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStd} onValueChange={setFilterStd}>
          <SelectTrigger className="h-8 text-xs w-44" data-testid="select-filter-std"><SelectValue placeholder="All standards" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Standards</SelectItem>
            {ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {filtered.length !== events.length && <span className="text-xs text-muted-foreground">{filtered.length} of {events.length} events</span>}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <ClipboardList className="w-9 h-9 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No training events logged yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Record all training activities — this creates an audit-ready log covering both 7.2 competence actions and 7.2.2 OJT requirements.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAdd(true)}>Log First Event</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(ev => (
            <Card key={ev.id} className="px-4 py-3 flex items-start justify-between" data-testid={`card-event-${ev.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{ev.title}</span>
                  <Badge variant="outline" className={`text-xs ${trainingTypeBg(ev.trainingType)}`}>{TRAINING_TYPE_LABELS[ev.trainingType] ?? ev.trainingType}</Badge>
                  {ev.standard && <Badge variant="outline" className="text-xs font-mono">{ev.standard}{ev.clause ? ` ${ev.clause}` : ""}</Badge>}
                  {ev.passed === true && <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Passed</Badge>}
                  {ev.passed === false && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Did Not Pass</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  {ev.trainingDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.trainingDate}</span>}
                  {ev.trainer && <span>Trainer: {ev.trainer}</span>}
                  {ev.provider && <span>Provider: {ev.provider}</span>}
                  {ev.durationHours && <span>{ev.durationHours} hrs</span>}
                  {ev.location && <span>{ev.location}</span>}
                  {ev.participants && ev.participants.length > 0 && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.participants.length} participant{ev.participants.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
                {ev.notes && <p className="text-xs text-muted-foreground mt-1 italic">{ev.notes}</p>}
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => setEditItem(ev)}><Pencil className="w-3.5 h-3.5" /></button>
                <button className="text-red-400 hover:text-red-600 p-1" onClick={() => deleteMut.mutate(ev.id)}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(showAdd || editItem) && (
        <TrainingEventDialog
          initial={editItem}
          onSave={data => editItem ? updateMut.mutate({ id: editItem.id, data }) : createMut.mutate(data)}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          isPending={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

function TrainingEventDialog({ initial, onSave, onClose, isPending }: {
  initial?: TrainingEventRecord | null;
  onSave: (d: any) => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    trainingType: initial?.trainingType ?? "classroom",
    standard: initial?.standard ?? "",
    clause: initial?.clause ?? "",
    trainer: initial?.trainer ?? "",
    provider: initial?.provider ?? "",
    trainingDate: initial?.trainingDate ?? "",
    durationHours: initial?.durationHours ?? "",
    location: initial?.location ?? "",
    participants: initial?.participants?.join(", ") ?? "",
    passed: initial?.passed ?? null as boolean | null,
    notes: initial?.notes ?? "",
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit" : "Log"} Training Event</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label>Training Title *</Label>
            <Input placeholder="e.g. IATF 16949 7.2.2 OJT — Press Operator Qualification" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-event-title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Training Type *</Label>
              <Select value={form.trainingType} onValueChange={v => setForm(f => ({ ...f, trainingType: v }))}>
                <SelectTrigger data-testid="select-training-type"><SelectValue /></SelectTrigger>
                <SelectContent>{TRAINING_TYPES.map(t => <SelectItem key={t} value={t}>{TRAINING_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Standard <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={form.standard || "_none"} onValueChange={v => setForm(f => ({ ...f, standard: v === "_none" ? "" : v }))}>
                <SelectTrigger data-testid="select-event-standard"><SelectValue placeholder="Select standard" /></SelectTrigger>
                <SelectContent><SelectItem value="_none">None</SelectItem>{ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Clause <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. 7.2, 7.2.2" value={form.clause} onChange={e => setForm(f => ({ ...f, clause: e.target.value }))} data-testid="input-event-clause" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.trainingDate} onChange={e => setForm(f => ({ ...f, trainingDate: e.target.value }))} data-testid="input-event-date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Trainer / Instructor</Label>
              <Input placeholder="Name of trainer" value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} data-testid="input-event-trainer" />
            </div>
            <div>
              <Label>Provider / Organization</Label>
              <Input placeholder="Company or institution" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} data-testid="input-event-provider" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration (hours)</Label>
              <Input placeholder="e.g. 2, 8, 0.5" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} data-testid="input-event-duration" />
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="Room, building, or virtual" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} data-testid="input-event-location" />
            </div>
          </div>
          <div>
            <Label>Participants <span className="text-muted-foreground font-normal">(comma-separated names)</span></Label>
            <Input placeholder="John Smith, Maria Garcia, Carlos Rivera" value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} data-testid="input-event-participants" />
          </div>
          <div>
            <Label>Result</Label>
            <Select value={form.passed === null ? "na" : form.passed ? "pass" : "fail"} onValueChange={v => setForm(f => ({ ...f, passed: v === "na" ? null : v === "pass" }))}>
              <SelectTrigger data-testid="select-event-result"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="na">N/A (informational)</SelectItem>
                <SelectItem value="pass">Passed</SelectItem>
                <SelectItem value="fail">Did Not Pass</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Topics covered, actions taken, follow-up required..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="textarea-event-notes" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary text-white" onClick={() => onSave({
              ...form,
              participants: form.participants ? form.participants.split(",").map(s => s.trim()).filter(Boolean) : [],
            })} disabled={isPending || !form.title} data-testid="button-save-event">
              {isPending ? "Saving..." : initial ? "Update" : "Log Event"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Awareness (7.3) — enhanced existing + 7.3 topic tracker
// ═══════════════════════════════════════════════════════════════════════════════

const AWARENESS_TOPICS_73 = [
  { key: "quality_policy", label: "Quality Policy (7.3a)", desc: "Employees are aware of the quality policy and its relevance to their work." },
  { key: "quality_objectives", label: "Quality Objectives (7.3b)", desc: "Relevant quality objectives have been communicated to the process area." },
  { key: "contribution", label: "Contribution to QMS (7.3c)", desc: "Employees understand how their activities contribute to QMS effectiveness and product/service conformity." },
  { key: "nc_consequences", label: "NC Consequences (7.3d)", desc: "Employees understand the implications of not conforming to QMS requirements." },
];

function AwarenessTab({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [ackDialog, setAckDialog] = useState<{ noticeId: number; noticeTitle: string } | null>(null);

  const { data: notices = [], isLoading } = useQuery<IsoAwarenessNotice[]>({ queryKey: ["/api/iso-awareness-notices"] });
  const { data: acknowledgments = [] } = useQuery<IsoAwarenessAcknowledgment[]>({
    queryKey: ["/api/iso-awareness-notices", expandedId, "acknowledgments"],
    queryFn: async () => {
      if (!expandedId) return [];
      return fetch(`/api/iso-awareness-notices/${expandedId}/acknowledgments`).then(r => r.json());
    },
    enabled: !!expandedId,
  });

  const createNotice = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iso-awareness-notices", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-awareness-notices"] }); setShowCreate(false); toast({ title: "Awareness notice sent" }); },
  });
  const deleteNotice = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-awareness-notices/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-awareness-notices"] }); toast({ title: "Notice removed" }); },
  });
  const createAck = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/iso-awareness-notices/${data.noticeId}/acknowledgments`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-awareness-notices", expandedId, "acknowledgments"] }); setAckDialog(null); toast({ title: "Acknowledgment recorded" }); },
  });

  return (
    <div className="space-y-5">
      {/* 7.3 Topic Tracker */}
      <div>
        <h3 className="font-semibold text-sm mb-1">7.3 Awareness Requirements Tracker</h3>
        <p className="text-xs text-muted-foreground mb-3">Create awareness notices for each required topic below. Each notice can collect employee acknowledgments as audit evidence.</p>
        <div className="grid grid-cols-2 gap-3">
          {AWARENESS_TOPICS_73.map(topic => {
            const related = notices.filter(n => n.clause === topic.key || n.title.toLowerCase().includes(topic.label.toLowerCase().split("(")[0].trim().toLowerCase()));
            return (
              <Card key={topic.key} className="p-4 flex items-start justify-between gap-3" data-testid={`card-topic-${topic.key}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {related.length > 0
                      ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />}
                    <p className="text-sm font-semibold">{topic.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{topic.desc}</p>
                  {related.length > 0 && <p className="text-xs text-green-600 mt-1">{related.length} notice{related.length > 1 ? "s" : ""} created</p>}
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 gap-1" onClick={() => setShowCreate(true)}>
                  <Plus className="w-3 h-3" /> Notice
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Notices list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Awareness Notices ({notices.length})</h3>
          <div className="flex items-center gap-2">
            {onAskIsa && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAskIsa("What does ISO 9001:2015 Clause 7.3 require for awareness, and how should we communicate quality objectives to our process owners?")}>
                Ask Isa
              </Button>
            )}
            <Button size="sm" className="bg-primary text-white gap-1 h-7 text-xs" onClick={() => setShowCreate(true)} data-testid="button-create-notice">
              <Plus className="w-3.5 h-3.5" /> New Notice
            </Button>
          </div>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : notices.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <GraduationCap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No awareness notices yet. Create notices for each 7.3 topic above to build your audit evidence.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {notices.map(notice => (
              <Card key={notice.id} className="border overflow-hidden" data-testid={`card-notice-${notice.id}`}>
                <div className="flex items-start justify-between p-4 cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}>
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-primary">{notice.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{notice.standard}</Badge>
                        {notice.clause && <Badge variant="outline" className="text-xs font-mono">{notice.clause}</Badge>}
                        {notice.processArea && <Badge variant="outline" className="text-xs">{notice.processArea}</Badge>}
                        {notice.dueDate && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Due {new Date(notice.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button className="text-red-400 hover:text-red-600 p-1" onClick={e => { e.stopPropagation(); deleteNotice.mutate(notice.id); }} data-testid={`button-delete-notice-${notice.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                    {expandedId === notice.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                {expandedId === notice.id && (
                  <div className="border-t px-4 pb-4 pt-3 bg-muted/5 space-y-3">
                    <p className="text-sm">{notice.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Acknowledgments ({acknowledgments.length})</p>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAckDialog({ noticeId: notice.id, noticeTitle: notice.title })} data-testid={`button-add-ack-${notice.id}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Record
                      </Button>
                    </div>
                    {acknowledgments.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No acknowledgments recorded yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {acknowledgments.map(ack => (
                          <div key={ack.id} className="flex items-center justify-between text-sm bg-white border rounded-lg px-3 py-2" data-testid={`row-ack-${ack.id}`}>
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /><span className="font-medium">{ack.acknowledgedBy}</span></span>
                            <span className="text-xs text-muted-foreground">{ack.acknowledgedAt ? new Date(ack.acknowledgedAt).toLocaleDateString() : ""}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateNoticeDialog onSave={d => createNotice.mutate(d)} onClose={() => setShowCreate(false)} isPending={createNotice.isPending} />}
      {ackDialog && <AckDialog noticeId={ackDialog.noticeId} noticeTitle={ackDialog.noticeTitle} onSave={d => createAck.mutate(d)} onClose={() => setAckDialog(null)} isPending={createAck.isPending} />}
    </div>
  );
}

function CreateNoticeDialog({ onSave, onClose, isPending }: { onSave: (d: any) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState({ standard: "ISO 9001:2015", clause: "", title: "", message: "", processArea: "", dueDate: "" });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Awareness Notice</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Standard</Label>
              <Select value={form.standard} onValueChange={v => setForm(f => ({ ...f, standard: v }))}>
                <SelectTrigger data-testid="select-notice-standard"><SelectValue /></SelectTrigger>
                <SelectContent>{ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Clause <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. 7.3, 7.3a" value={form.clause} onChange={e => setForm(f => ({ ...f, clause: e.target.value }))} data-testid="input-notice-clause" />
            </div>
          </div>
          <div>
            <Label>Title *</Label>
            <Input placeholder="e.g. Awareness of Quality Objectives — Production Team" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-notice-title" />
          </div>
          <div>
            <Label>Message *</Label>
            <Textarea placeholder="Describe the requirement, what it means for this process area, and what the team needs to know or do..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} data-testid="textarea-notice-message" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Process Area</Label>
              <Select value={form.processArea} onValueChange={v => setForm(f => ({ ...f, processArea: v }))}>
                <SelectTrigger data-testid="select-process-area"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>{PROCESS_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-notice-due-date" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary text-white" onClick={() => onSave(form)} disabled={isPending || !form.title || !form.message} data-testid="button-save-notice">
              {isPending ? "Sending..." : "Send Notice"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AckDialog({ noticeId, noticeTitle, onSave, onClose, isPending }: { noticeId: number; noticeTitle: string; onSave: (d: any) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState({ acknowledgedBy: "", notes: "" });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Record Acknowledgment</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">"{noticeTitle}"</p>
          <div>
            <Label>Name *</Label>
            <Input placeholder="Process owner / employee name" value={form.acknowledgedBy} onChange={e => setForm(f => ({ ...f, acknowledgedBy: e.target.value }))} data-testid="input-ack-name" />
          </div>
          <div>
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Any notes or questions" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-ack-notes" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => onSave({ noticeId, ...form })} disabled={isPending || !form.acknowledgedBy} data-testid="button-save-ack">
              {isPending ? "Recording..." : "Record Acknowledgment"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — Special Requirements (IATF 7.2.2 OJT, Auditor Competency, AS9100D, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

function SpecialReqsTab({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const [activeStd, setActiveStd] = useState("iatf");
  const { data: allRecords = [] } = useQuery<EmployeeCompetencyRecord[]>({ queryKey: ["/api/employee-competency-records"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: requirements = [] } = useQuery<CompetencyRequirement[]>({ queryKey: ["/api/competency-requirements"] });

  const ojtRecords = allRecords.filter(r => r.isOjt);
  const auditorReqs = requirements.filter(r =>
    r.clause?.startsWith("7.2.3") || r.clause?.startsWith("7.2.4") ||
    r.competencyName.toLowerCase().includes("auditor") ||
    r.competencyName.toLowerCase().includes("audit")
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Standard-Specific Requirements</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Additional training and competency requirements beyond the base ISO 9001 7.2/7.3 requirements.</p>
        </div>
        {onAskIsa && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAskIsa("What are the IATF 16949 7.2.2 on-the-job training requirements for production operators, and how do 7.2.3 internal auditor competency requirements differ from ISO 9001?")}>
            Ask Isa
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "iatf", label: "IATF 16949" },
          { key: "as9100", label: "AS9100 Rev D" },
          { key: "iso13485", label: "ISO 13485" },
          { key: "iso14001", label: "ISO 14001" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setActiveStd(s.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${activeStd === s.key ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
            data-testid={`button-std-${s.key}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeStd === "iatf" && (
        <div className="space-y-5">
          {/* 7.2.2 OJT Register */}
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" />
              IATF 16949 7.2.2 — On-the-Job Training (OJT) Register
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              IATF 16949 7.2.2 requires on-the-job training for personnel in any role that affects product quality conformance,
              including temporary and contract staff. Evidence must be retained for all positions.
            </p>
            {ojtRecords.length === 0 ? (
              <Card className="p-6 border-dashed text-center">
                <p className="text-xs text-muted-foreground">No OJT records yet. Add competency evidence and check "OJT (IATF 7.2.2)" in the Employee Records tab.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {ojtRecords.map(rec => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  return (
                    <Card key={rec.id} className="px-4 py-3 flex items-start justify-between" data-testid={`card-ojt-${rec.id}`}>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${rec.employeeId}`}</span>
                          {emp?.position && <span className="text-xs text-muted-foreground">· {emp.position}</span>}
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">OJT 7.2.2</Badge>
                          <Badge variant="outline" className={`text-xs ${statusBadge(rec.status)}`}>{rec.status}</Badge>
                          {rec.effectivenessVerified && <Badge variant="outline" className="text-xs bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3 mr-0.5" />Effectiveness Verified</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{rec.competencyName}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                          {rec.provider && <span>Trainer/Supervisor: {rec.provider}</span>}
                          {rec.completedDate && <span>Date: {rec.completedDate}</span>}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7.2.3 Internal Auditor Competency */}
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              IATF 16949 7.2.3 — Internal Auditor Competency
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Internal auditors must demonstrate specific competency in: (a) the standard being audited,
              (b) process approach auditing, (c) risk-based thinking, and (d) customer-specific requirements for IATF.
              Define these as competency requirements in the Competence Matrix tab for your auditor roles.
            </p>
            {auditorReqs.length === 0 ? (
              <Card className="p-4 border-dashed text-center">
                <p className="text-xs text-muted-foreground">No auditor competency requirements defined yet. Go to the Competence Matrix tab → Add a role like "Internal Auditor" and add requirements linked to clause 7.2.3.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {auditorReqs.map(req => (
                  <Card key={req.id} className="px-4 py-2 flex items-center justify-between" data-testid={`card-auditor-req-${req.id}`}>
                    <div>
                      <span className="text-sm font-medium">{req.competencyName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({req.jobTitle})</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${competencyTypeBadge(req.competencyType)}`}>{COMPETENCY_TYPE_LABELS[req.competencyType]}</Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 7.2.4 */}
          <Card className="p-4 border-l-4 border-l-blue-400 bg-blue-50/50">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />IATF 16949 7.2.4 — Second-Party Auditor Competency</h4>
            <p className="text-xs text-muted-foreground">Personnel conducting supplier audits must demonstrate competency in the applicable requirements. Add "Supplier / Second-Party Auditor" as a job role in the Competence Matrix with requirements linked to clause 7.2.4.</p>
          </Card>

          {/* 7.3.1 */}
          <Card className="p-4 border-l-4 border-l-orange-400 bg-orange-50/50">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-600" />IATF 16949 7.3.1 — Product / Process NC Awareness</h4>
            <p className="text-xs text-muted-foreground">Employees must be aware of consequences of departures from product / process standards. Create a specific awareness notice in the 7.3 Awareness tab covering product/process nonconformance consequences.</p>
          </Card>
        </div>
      )}

      {activeStd === "as9100" && (
        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-blue-400 bg-blue-50/50">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" />AS9100 Rev D 7.2 — Safety-Critical Role Identification</h4>
            <p className="text-xs text-muted-foreground mb-2">AS9100 Rev D requires specific competency for roles whose work affects product safety, including counterfeit parts awareness and ethical behavior. Add roles such as "Safety-Critical Process Operator" and "Product Inspection" to the Competence Matrix with safety-specific competency requirements.</p>
            <div className="text-xs space-y-1 text-blue-700">
              <p>• Employees in safety-critical roles must be identified</p>
              <p>• Counterfeit part awareness training required</p>
              <p>• Ethical behavior awareness and authority to stop production required</p>
              <p>• Human factors training for roles affecting product safety</p>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-purple-400 bg-purple-50/50">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-purple-600" />AS9100 Rev D 7.3 — Contribution to Product Safety</h4>
            <p className="text-xs text-muted-foreground">Employees must be aware of their contribution to product safety. Create awareness notices covering product safety awareness and the consequences of not following safety-critical requirements.</p>
          </Card>
        </div>
      )}

      {activeStd === "iso13485" && (
        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-teal-400 bg-teal-50/50">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-600" />ISO 13485:2016 7.2 — Medical Device Competency</h4>
            <p className="text-xs text-muted-foreground mb-2">ISO 13485 requires competency documentation that is tightly tied to regulatory requirements. Key additions beyond ISO 9001:</p>
            <div className="text-xs space-y-1 text-teal-700">
              <p>• Training must address regulatory requirements applicable to each role</p>
              <p>• Records must include education, training, skills, and experience</p>
              <p>• Personnel involved in sterile medical devices need specific training evidence</p>
              <p>• Training effectiveness evaluation must be documented</p>
              <p>• Competency records retained per regulatory retention requirements</p>
            </div>
          </Card>
        </div>
      )}

      {activeStd === "iso14001" && (
        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-green-400 bg-green-50/50">
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600" />ISO 14001:2015 7.2 — Environmental Competency</h4>
            <p className="text-xs text-muted-foreground mb-2">Persons doing work that affects environmental performance or compliance obligations must be competent. Key areas:</p>
            <div className="text-xs space-y-1 text-green-700">
              <p>• Environmental aspects and impacts related to their role</p>
              <p>• Emergency procedures (spill response, waste handling)</p>
              <p>• Significant environmental aspects awareness</p>
              <p>• Hazardous waste handling qualifications</p>
              <p>• SPCC / stormwater compliance training</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — Cross-Training Skills Matrix
// ═══════════════════════════════════════════════════════════════════════════════

// Rating level helpers
const SIMPLE_LEVELS = [
  { value: "aware", label: "Aware", short: "Aware", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "competent", label: "Competent", short: "Comp", cls: "bg-green-100 text-green-800 border-green-300" },
  { value: "na", label: "N/A", short: "N/A", cls: "bg-gray-100 text-gray-500 border-gray-200" },
];
const IATF_LEVELS = [
  { value: "i", label: "I — In Training (not yet independent)", short: "I", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "l", label: "L — Works Alone (limited problem solving)", short: "L", cls: "bg-lime-100 text-lime-800 border-lime-300" },
  { value: "u", label: "U — Expert (solves problems, cannot train)", short: "U", cls: "bg-green-100 text-green-800 border-green-300" },
  { value: "o", label: "O — Expert Trainer (can train others)", short: "O", cls: "bg-teal-100 text-teal-800 border-teal-300" },
  { value: "na", label: "N/A — Not Applicable", short: "N/A", cls: "bg-gray-100 text-gray-500 border-gray-200" },
];

function levelInfo(level: string | null | undefined, scale: string) {
  const levels = scale === "iatf_4level" ? IATF_LEVELS : SIMPLE_LEVELS;
  return levels.find(l => l.value === level);
}

function LevelCell({ level, scale, onClick }: { level?: string | null; scale: string; onClick: () => void }) {
  const info = levelInfo(level, scale);
  return (
    <button
      onClick={onClick}
      data-testid="skills-matrix-cell"
      className={`w-full h-full min-h-[2rem] flex items-center justify-center text-xs font-semibold border rounded transition-opacity hover:opacity-80 cursor-pointer ${info ? info.cls : "bg-white text-gray-300 border-gray-100 hover:bg-gray-50"}`}
    >
      {info ? info.short : "—"}
    </button>
  );
}

function SkillsMatrixTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [newSkillScale, setNewSkillScale] = useState("simple");
  const [newSkillRequired, setNewSkillRequired] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Cell edit state
  const [editCell, setEditCell] = useState<{ emp: Employee; skill: TrainingMatrixSkill; entry?: TrainingMatrixEntry } | null>(null);
  const [cellLevel, setCellLevel] = useState("");
  const [cellNotes, setCellNotes] = useState("");

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: skills = [] } = useQuery<TrainingMatrixSkill[]>({ queryKey: ["/api/training-matrix/skills"] });
  const { data: entries = [] } = useQuery<TrainingMatrixEntry[]>({ queryKey: ["/api/training-matrix/entries"] });

  const entryMap = useMemo(() => {
    const map: Record<string, TrainingMatrixEntry> = {};
    entries.forEach(e => { map[`${e.employeeId}-${e.skillId}`] = e; });
    return map;
  }, [entries]);

  const categories = useMemo(() => {
    const cats = [...new Set(skills.map(s => s.skillCategory).filter(Boolean) as string[])];
    return cats;
  }, [skills]);

  const departments = useMemo(() => {
    const depts = [...new Set(employees.map(e => (e as any).department).filter(Boolean) as string[])];
    return depts;
  }, [employees]);

  const filteredSkills = useMemo(() => {
    if (categoryFilter === "all") return skills;
    return skills.filter(s => s.skillCategory === categoryFilter);
  }, [skills, categoryFilter]);

  const filteredEmployees = useMemo(() => {
    if (deptFilter === "all") return employees;
    return employees.filter(e => (e as any).department === deptFilter);
  }, [employees, deptFilter]);

  const createSkillMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/training-matrix/skills", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/training-matrix/skills"] }); setShowAddSkill(false); setNewSkillName(""); setNewSkillCategory(""); setNewSkillScale("simple"); setNewSkillRequired(true); toast({ title: "Skill added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add skill", variant: "destructive" }),
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-matrix/skills/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/training-matrix/skills"] }); queryClient.invalidateQueries({ queryKey: ["/api/training-matrix/entries"] }); toast({ title: "Skill removed" }); },
    onError: () => toast({ title: "Error", description: "Failed to remove skill", variant: "destructive" }),
  });

  const upsertEntryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/training-matrix/entries", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/training-matrix/entries"] }); setEditCell(null); },
    onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
  });

  function openCell(emp: Employee, skill: TrainingMatrixSkill) {
    const existing = entryMap[`${emp.id}-${skill.id}`];
    setEditCell({ emp, skill, entry: existing });
    setCellLevel(existing?.level ?? "");
    setCellNotes(existing?.notes ?? "");
  }

  function saveCell() {
    if (!editCell) return;
    upsertEntryMutation.mutate({
      employeeId: editCell.emp.id,
      skillId: editCell.skill.id,
      level: cellLevel || null,
      notes: cellNotes || null,
    });
  }

  const levels = editCell?.skill.ratingScale === "iatf_4level" ? IATF_LEVELS : SIMPLE_LEVELS;

  // Count coverage
  const totalCells = filteredEmployees.length * filteredSkills.length;
  const competentCells = entries.filter(e => e.level === "competent" || e.level === "o" || e.level === "u").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-white shrink-0">
        <Button size="sm" onClick={() => setShowAddSkill(true)} data-testid="button-add-skill">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill Column
        </Button>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 text-xs w-44" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-8 text-xs w-44" data-testid="select-dept-filter">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>{filteredEmployees.length} employees · {filteredSkills.length} skills</span>
          {totalCells > 0 && <span className="text-green-700 font-medium">{Math.round((competentCells / totalCells) * 100)}% competent</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-gray-50 shrink-0 text-xs overflow-x-auto">
        <span className="font-medium text-muted-foreground shrink-0">Simple scale:</span>
        {SIMPLE_LEVELS.map(l => <span key={l.value} className={`px-2 py-0.5 rounded border font-semibold shrink-0 ${l.cls}`}>{l.short} = {l.label}</span>)}
        <span className="font-medium text-muted-foreground shrink-0 ml-3">IATF 4-level:</span>
        {IATF_LEVELS.map(l => <span key={l.value} className={`px-2 py-0.5 rounded border font-semibold shrink-0 ${l.cls}`}>{l.short} = {l.label.split(" — ")[0]}</span>)}
      </div>

      {/* Matrix Table */}
      {filteredSkills.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Grid3x3 className="w-10 h-10 opacity-30" />
          <p className="text-sm">No skill columns yet.</p>
          <p className="text-xs">Click <strong>Add Skill Column</strong> to define the processes or competencies your team is trained on.</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Users className="w-10 h-10 opacity-30" />
          <p className="text-sm">No employees found.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="border-collapse text-xs min-w-max w-full" data-testid="skills-matrix-table">
            <thead className="sticky top-0 z-20 bg-white shadow-sm">
              <tr>
                {/* Sticky first header */}
                <th className="sticky left-0 z-30 bg-white border border-gray-200 px-3 py-2 text-left font-semibold min-w-[160px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  Employee / Dept
                </th>
                {filteredSkills.map(skill => (
                  <th key={skill.id} className="border border-gray-200 px-2 py-1 text-center font-medium min-w-[70px] max-w-[90px] bg-white">
                    <div className="flex flex-col items-center gap-0.5">
                      {skill.skillCategory && <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{skill.skillCategory}</span>}
                      <span className="leading-tight">{skill.skillName}</span>
                      {skill.ratingScale === "iatf_4level" && <span className="text-[9px] text-blue-500">IATF</span>}
                      {skill.isRequired && <span className="text-[9px] text-orange-500">★ Req</span>}
                      <button
                        data-testid={`button-delete-skill-${skill.id}`}
                        onClick={() => { if (confirm(`Remove "${skill.skillName}" and all its cell data?`)) deleteSkillMutation.mutate(skill.id); }}
                        className="text-red-300 hover:text-red-500 mt-0.5"
                      ><X className="w-2.5 h-2.5" /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, rowIdx) => (
                <tr key={emp.id} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  {/* Sticky name column */}
                  <td className="sticky left-0 z-10 border border-gray-200 px-3 py-1.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                    style={{ backgroundColor: rowIdx % 2 === 0 ? "white" : "#fafafa" }}>
                    <div className="font-medium leading-tight">{(emp as any).firstName} {(emp as any).lastName}</div>
                    {(emp as any).department && <div className="text-[10px] text-muted-foreground">{(emp as any).department}</div>}
                    {(emp as any).jobTitle && <div className="text-[10px] text-muted-foreground italic">{(emp as any).jobTitle}</div>}
                  </td>
                  {filteredSkills.map(skill => {
                    const entry = entryMap[`${emp.id}-${skill.id}`];
                    return (
                      <td key={skill.id} className="border border-gray-200 p-0.5">
                        <LevelCell level={entry?.level} scale={skill.ratingScale} onClick={() => openCell(emp, skill)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Skill / Process Column</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Skill / Process Name <span className="text-red-500">*</span></Label>
              <Input
                data-testid="input-skill-name"
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                placeholder="e.g. Welding, Assembly, Blueprint Reading"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Category / Area (optional grouping)</Label>
              <Input
                data-testid="input-skill-category"
                value={newSkillCategory}
                onChange={e => setNewSkillCategory(e.target.value)}
                placeholder="e.g. Machining, Assembly, Quality"
                className="mt-1"
                list="existing-categories"
              />
              <datalist id="existing-categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <Label className="text-xs">Rating Scale</Label>
              <Select value={newSkillScale} onValueChange={setNewSkillScale}>
                <SelectTrigger className="mt-1 text-xs" data-testid="select-rating-scale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (Aware / Competent)</SelectItem>
                  <SelectItem value="iatf_4level">IATF 4-Level (I / L / U / O)</SelectItem>
                </SelectContent>
              </Select>
              {newSkillScale === "iatf_4level" && (
                <p className="text-[10px] text-muted-foreground mt-1">I=In Training · L=Works Alone · U=Expert · O=Can Train Others</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="skill-required"
                checked={newSkillRequired}
                onCheckedChange={v => setNewSkillRequired(!!v)}
                data-testid="checkbox-skill-required"
              />
              <Label htmlFor="skill-required" className="text-xs">Mark as required (★) for all roles</Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setShowAddSkill(false)} className="flex-1">Cancel</Button>
              <Button
                size="sm"
                className="flex-1"
                data-testid="button-save-skill"
                disabled={!newSkillName.trim() || createSkillMutation.isPending}
                onClick={() => createSkillMutation.mutate({ skillName: newSkillName.trim(), skillCategory: newSkillCategory.trim() || null, ratingScale: newSkillScale, isRequired: newSkillRequired, sortOrder: skills.length })}
              >
                {createSkillMutation.isPending ? "Saving…" : "Add Column"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cell Editor Dialog */}
      <Dialog open={!!editCell} onOpenChange={open => !open && setEditCell(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editCell ? `${(editCell.emp as any).firstName} ${(editCell.emp as any).lastName}` : ""}
              <span className="text-muted-foreground font-normal"> · {editCell?.skill.skillName}</span>
            </DialogTitle>
          </DialogHeader>
          {editCell && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Competency Level</Label>
                <Select value={cellLevel || "_none_level"} onValueChange={v => setCellLevel(v === "_none_level" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-xs" data-testid="select-cell-level">
                    <SelectValue placeholder="— Not assessed —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_level">— Not assessed —</SelectItem>
                    {levels.map(l => (
                      <SelectItem key={l.value} value={l.value}>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold mr-2 ${l.cls}`}>{l.short}</span>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes (optional — e.g. "Missing TL sign-off", "Cert expires 2026-06")</Label>
                <Textarea
                  data-testid="textarea-cell-notes"
                  value={cellNotes}
                  onChange={e => setCellNotes(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs resize-none"
                  placeholder="Any gaps, expiry dates, or training notes…"
                />
              </div>
              {editCell.entry?.notes && !cellNotes && (
                <p className="text-xs text-muted-foreground">Current note: {editCell.entry.notes}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setEditCell(null)} className="flex-1">Cancel</Button>
                <Button
                  size="sm"
                  className="flex-1"
                  data-testid="button-save-cell"
                  disabled={upsertEntryMutation.isPending}
                  onClick={saveCell}
                >
                  {upsertEntryMutation.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
