import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardCheck, CheckCircle2, AlertTriangle, Eye, Trash2, ChevronRight, Calendar, User, BookOpen, XCircle } from "lucide-react";
import type { IsoAudit, IsoAuditFinding } from "@shared/schema";

const ISO_STANDARDS = [
  "ISO 9001:2015",
  "ISO 14001:2015",
  "ISO 45001:2018",
  "ISO 13485:2016",
  "IATF 16949:2016",
  "AS9100 Rev D",
];

const CLAUSES_BY_STANDARD: Record<string, Array<{ clause: string; title: string }>> = {
  "ISO 9001:2015": [
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
  ],
  "ISO 14001:2015": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the EMS" },
    { clause: "4.4", title: "Environmental management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Environmental policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Environmental aspects" },
    { clause: "6.1.3", title: "Compliance obligations" },
    { clause: "6.2", title: "Environmental objectives and planning to achieve them" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Emergency preparedness and response" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "ISO 45001:2018": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of workers and interested parties" },
    { clause: "4.3", title: "Determining the scope of the OH&SMS" },
    { clause: "4.4", title: "OH&S management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "OH&S policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities, and authorities" },
    { clause: "5.4", title: "Consultation and participation of workers" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Hazard identification; assessment of risks and opportunities" },
    { clause: "6.1.3", title: "Determination of legal requirements and other requirements" },
    { clause: "6.2", title: "OH&S objectives and planning to achieve them" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Emergency preparedness and response" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Incident, nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
};

const FINDING_TYPES = [
  { value: "conform", label: "Conform", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "nonconformance", label: "Nonconformance", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "observation", label: "Observation", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "not_audited", label: "Not Audited", color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  complete: "bg-green-100 text-green-800 border-green-200",
};

function getClausesForStandard(standard: string) {
  return CLAUSES_BY_STANDARD[standard] || CLAUSES_BY_STANDARD["ISO 9001:2015"];
}

export function InternalAuditModule({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateAudit, setShowCreateAudit] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [findingDialog, setFindingDialog] = useState<{ open: boolean; clause: string; clauseTitle: string; existing?: IsoAuditFinding } | null>(null);

  const { data: audits = [], isLoading } = useQuery<IsoAudit[]>({
    queryKey: ["/api/iso-audits"],
  });

  const selectedAudit = audits.find(a => a.id === selectedAuditId);

  const { data: findings = [] } = useQuery<IsoAuditFinding[]>({
    queryKey: ["/api/iso-audits", selectedAuditId, "findings"],
    queryFn: async () => {
      if (!selectedAuditId) return [];
      const res = await fetch(`/api/iso-audits/${selectedAuditId}/findings`);
      return res.json();
    },
    enabled: !!selectedAuditId,
  });

  const createAudit = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/iso-audits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] });
      setShowCreateAudit(false);
      toast({ title: "Audit created" });
    },
  });

  const updateAudit = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/iso-audits/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] }),
  });

  const deleteAudit = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/iso-audits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] });
      setSelectedAuditId(null);
      toast({ title: "Audit deleted" });
    },
  });

  const saveFinding = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const res = await apiRequest("PATCH", `/api/iso-audit-findings/${data.id}`, data);
        return res.json();
      }
      const res = await apiRequest("POST", `/api/iso-audits/${selectedAuditId}/findings`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "findings"] });
      setFindingDialog(null);
    },
  });

  const deleteFinding = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/iso-audit-findings/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "findings"] }),
  });

  const clauses = selectedAudit ? getClausesForStandard(selectedAudit.standard) : [];

  const findingForClause = (clause: string) => findings.find(f => f.clause === clause);

  const findingCounts = findings.reduce((acc, f) => {
    acc[f.findingType] = (acc[f.findingType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ── Audit detail view ──
  if (selectedAudit) {
    const pctAudited = clauses.length > 0 ? Math.round((findings.filter(f => f.findingType !== "not_audited").length / clauses.length) * 100) : 0;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAuditId(null)} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
              ← All Audits
            </button>
            <span className="text-muted-foreground">/</span>
            <h2 className="font-semibold text-primary">{selectedAudit.standard}</h2>
            <Badge className={`text-xs border ${STATUS_COLORS[selectedAudit.status] || STATUS_COLORS.planned}`}>
              {selectedAudit.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedAudit.status === "planned" && (
              <Button size="sm" variant="outline" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "in_progress" } })}>
                Start Audit
              </Button>
            )}
            {selectedAudit.status === "in_progress" && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "complete", completedDate: new Date().toISOString() } })}>
                Mark Complete
              </Button>
            )}
            {onAskIsa && (
              <Button size="sm" variant="outline" onClick={() => onAskIsa(`I'm conducting an internal audit for ${selectedAudit.standard}. I have ${findingCounts.nonconformance || 0} nonconformances and ${findingCounts.observation || 0} observations. Can you help me think through the findings and next steps?`)}>
                Ask Isa
              </Button>
            )}
          </div>
        </div>

        {/* Audit meta + summary bar */}
        <div className="px-6 py-3 border-b bg-muted/30 flex flex-wrap items-center gap-6 text-sm">
          {selectedAudit.leadAuditor && <span className="flex items-center gap-1.5 text-muted-foreground"><User className="w-3.5 h-3.5" />{selectedAudit.leadAuditor}</span>}
          {selectedAudit.scheduledDate && <span className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" />{new Date(selectedAudit.scheduledDate).toLocaleDateString()}</span>}
          {selectedAudit.scope && <span className="flex items-center gap-1.5 text-muted-foreground"><BookOpen className="w-3.5 h-3.5" />{selectedAudit.scope}</span>}
          <span className="ml-auto flex items-center gap-3 font-medium">
            <span className="text-green-700">{findingCounts.conform || 0} Conform</span>
            <span className="text-red-700">{findingCounts.nonconformance || 0} NC</span>
            <span className="text-yellow-700">{findingCounts.observation || 0} OFI</span>
            <span className="text-muted-foreground text-xs">{pctAudited}% audited</span>
          </span>
        </div>

        {/* Clause checklist */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-muted-foreground w-16">Clause</th>
                <th className="px-4 py-2 font-medium text-muted-foreground">Requirement</th>
                <th className="px-4 py-2 font-medium text-muted-foreground w-36">Finding</th>
                <th className="px-4 py-2 font-medium text-muted-foreground w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clauses.map(({ clause, title }) => {
                const finding = findingForClause(clause);
                const typeInfo = FINDING_TYPES.find(t => t.value === finding?.findingType);
                return (
                  <tr key={clause} className="hover:bg-muted/20 group" data-testid={`row-audit-clause-${clause}`}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{clause}</td>
                    <td className="px-4 py-3 text-foreground">{title}</td>
                    <td className="px-4 py-3">
                      {finding ? (
                        <Badge className={`text-xs border ${typeInfo?.color || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {typeInfo?.label || finding.findingType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Not recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs text-accent hover:underline"
                        onClick={() => setFindingDialog({ open: true, clause, clauseTitle: title, existing: finding })}
                        data-testid={`button-record-finding-${clause}`}
                      >
                        {finding ? "Edit" : "Record"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Finding dialog */}
        {findingDialog?.open && (
          <FindingDialog
            clause={findingDialog.clause}
            clauseTitle={findingDialog.clauseTitle}
            existing={findingDialog.existing}
            onSave={(data) => saveFinding.mutate(data)}
            onDelete={findingDialog.existing ? () => { deleteFinding.mutate(findingDialog.existing!.id); setFindingDialog(null); } : undefined}
            onClose={() => setFindingDialog(null)}
            isPending={saveFinding.isPending}
          />
        )}
      </div>
    );
  }

  // ── Audit list view ──
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h2 className="text-lg font-bold text-primary">Internal Audits</h2>
          <p className="text-xs text-muted-foreground">Plan, conduct, and document your internal audits — clause by clause.</p>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1" onClick={() => setShowCreateAudit(true)} data-testid="button-create-audit">
          <Plus className="w-4 h-4" /> New Audit
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading audits...</div>
        ) : audits.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="font-medium text-muted-foreground">No audits yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first internal audit to start tracking clause-by-clause conformance.</p>
            <Button size="sm" variant="outline" onClick={() => setShowCreateAudit(true)}>Create First Audit</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map(audit => (
              <Card key={audit.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer border" onClick={() => setSelectedAuditId(audit.id)} data-testid={`card-audit-${audit.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-primary">{audit.standard}</p>
                      <p className="text-xs text-muted-foreground">{audit.scope || "No scope defined"} {audit.leadAuditor && `· ${audit.leadAuditor}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {audit.scheduledDate && (
                      <span className="text-xs text-muted-foreground">{new Date(audit.scheduledDate).toLocaleDateString()}</span>
                    )}
                    <Badge className={`text-xs border ${STATUS_COLORS[audit.status] || STATUS_COLORS.planned}`}>
                      {audit.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreateAudit && (
        <CreateAuditDialog
          onSave={(data) => createAudit.mutate(data)}
          onClose={() => setShowCreateAudit(false)}
          isPending={createAudit.isPending}
        />
      )}
    </div>
  );
}

function CreateAuditDialog({ onSave, onClose, isPending }: { onSave: (data: any) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState({ standard: "ISO 9001:2015", scope: "", leadAuditor: "", scheduledDate: "" });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Internal Audit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Standard</Label>
            <Select value={form.standard} onValueChange={v => setForm(f => ({ ...f, standard: v }))}>
              <SelectTrigger data-testid="select-audit-standard"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Scope <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="e.g. Production processes, Clause 7-8" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} data-testid="input-audit-scope" />
          </div>
          <div>
            <Label>Lead Auditor <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Name" value={form.leadAuditor} onChange={e => setForm(f => ({ ...f, leadAuditor: e.target.value }))} data-testid="input-lead-auditor" />
          </div>
          <div>
            <Label>Scheduled Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} data-testid="input-scheduled-date" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave({ ...form, status: "planned" })} disabled={isPending} data-testid="button-save-audit">
              {isPending ? "Creating..." : "Create Audit"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FindingDialog({ clause, clauseTitle, existing, onSave, onDelete, onClose, isPending }: {
  clause: string; clauseTitle: string; existing?: IsoAuditFinding;
  onSave: (data: any) => void; onDelete?: () => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    id: existing?.id,
    clause,
    clauseTitle,
    findingType: existing?.findingType || "conform",
    description: existing?.description || "",
    evidence: existing?.evidence || "",
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clause {clause} — {clauseTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Finding Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {FINDING_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${form.findingType === t.value ? t.color + " ring-2 ring-offset-1 ring-current" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => setForm(f => ({ ...f, findingType: t.value }))}
                  data-testid={`button-finding-type-${t.value}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {form.findingType !== "not_audited" && (
            <>
              <div>
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea placeholder="Describe the finding..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} data-testid="textarea-finding-description" />
              </div>
              <div>
                <Label>Evidence <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input placeholder="Document reviewed, record number, person interviewed..." value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} data-testid="input-finding-evidence" />
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave(form)} disabled={isPending} data-testid="button-save-finding">
              {isPending ? "Saving..." : "Save Finding"}
            </Button>
            {onDelete && (
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onDelete} data-testid="button-delete-finding">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
