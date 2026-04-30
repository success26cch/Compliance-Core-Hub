import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  MoreHorizontal, 
  MessageSquare,
  Send,
  FileText,
  ShieldAlert,
  ArrowRight,
  Info,
  Trash2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Nonconformance, InsertNonconformance, IsoProject } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateIsaConversation } from "@/hooks/use-isa-chat";

interface NonconformanceManagerProps {
  onAskIsa: (prompt: string) => void;
}

type DocUpdateItem = {
  docType: string;
  docName: string;
  status: 'pending' | 'updated' | 'not_required';
  updatedBy: string;
  updatedDate: string;
};

const DOC_TYPE_PRESETS = [
  'Control Plan', 'Process FMEA (PFMEA)', 'Work Instructions', 'SOP / Procedure',
  'Process Flow Diagram', 'Operator Instructions', 'Inspection / Test Plan', 'Reaction Plan',
  'Quality Manual', 'Training Materials', 'Customer-Specific Requirements (CSR)',
  'Design FMEA (DFMEA)', 'Emergency Response Plan', 'Other'
];

export function NonconformanceManager({ onAskIsa }: NonconformanceManagerProps) {
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedNC, setSelectedNC] = useState<Nonconformance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: nonconformances, isLoading } = useQuery<Nonconformance[]>({
    queryKey: ["/api/nonconformances"],
  });

  const { data: project } = useQuery<IsoProject | null>({
    queryKey: ["/api/iso-projects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertNonconformance) => {
      const res = await apiRequest("POST", "/api/nonconformances", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nonconformances"] });
      setIsLogDialogOpen(false);
      toast({ title: "Success", description: "Nonconformance logged successfully." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertNonconformance> }) => {
      const res = await apiRequest("PATCH", `/api/nonconformances/${id}`, data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/nonconformances"] });
      setSelectedNC(updated);
    },
  });

  const stats = {
    open: nonconformances?.filter(nc => nc.status === 'open').length || 0,
    inProgress: nonconformances?.filter(nc => nc.status === 'action_in_progress' || nc.status === 'root_cause_identified').length || 0,
    pendingEffectiveness: nonconformances?.filter(nc => nc.status === 'effectiveness_pending').length || 0,
    closedThisYear: nonconformances?.filter(nc => nc.status === 'closed' && nc.closureDate && new Date(nc.closureDate).getFullYear() === new Date().getFullYear()).length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Open</Badge>;
      case 'root_cause_identified': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Root Cause Identified</Badge>;
      case 'action_in_progress': return <Badge className="bg-accent hover:bg-accent/90 text-white">Action In Progress</Badge>;
      case 'effectiveness_pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Effectiveness Pending</Badge>;
      case 'closed': return <Badge className="bg-green-500 hover:bg-green-600 text-white">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'major': return <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none">Major</Badge>;
      case 'minor': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none">Minor</Badge>;
      case 'observation': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">Observation</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    if (source === 'customer_complaint') return <Badge variant="destructive">Customer Complaint</Badge>;
    return <Badge variant="outline" className="capitalize">{source.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="bg-muted/30 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-primary">NC & CAPA Manager</h1>
          <p className="text-sm text-muted-foreground">Log and track nonconformances and corrective actions</p>
        </div>
        <Button 
          onClick={() => setIsLogDialogOpen(true)}
          className="bg-accent hover:bg-accent/90 text-white gap-2"
          data-testid="button-log-nc"
        >
          <Plus className="w-4 h-4" /> Log Nonconformance
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Open NCs" value={stats.open} icon={AlertTriangle} color="text-gray-500" />
        <StatsCard title="Action In Progress" value={stats.inProgress} icon={Clock} color="text-accent" />
        <StatsCard title="Pending Effectiveness" value={stats.pendingEffectiveness} icon={Search} color="text-yellow-500" />
        <StatsCard title="Closed This Year" value={stats.closedThisYear} icon={CheckCircle2} color="text-green-500" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Nonconformance Log</CardTitle>
          <CardDescription>Records of all identified nonconformances</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>ISO Clause</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : nonconformances?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10">No nonconformances found.</TableCell></TableRow>
              ) : (
                nonconformances?.map((nc) => (
                  <TableRow key={nc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedNC(nc)}>
                    <TableCell className="font-medium">{nc.title}</TableCell>
                    <TableCell>{getSourceBadge(nc.sourceType)}</TableCell>
                    <TableCell>{getSeverityBadge(nc.severity)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{nc.isoClause || "—"}</TableCell>
                    <TableCell>{nc.responsiblePerson || "—"}</TableCell>
                    <TableCell>{nc.targetDate ? format(new Date(nc.targetDate), 'MMM d, yyyy') : "—"}</TableCell>
                    <TableCell>{getStatusBadge(nc.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LogNCDialog 
        isOpen={isLogDialogOpen} 
        onClose={() => setIsLogDialogOpen(false)} 
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        project={project ?? null}
      />

      {selectedNC && (
        <NCDetailDialog 
          nc={selectedNC} 
          isOpen={!!selectedNC} 
          onClose={() => setSelectedNC(null)}
          onUpdate={(data) => updateMutation.mutate({ id: selectedNC.id, data })}
          onAskIsa={onAskIsa}
          isUpdating={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-muted ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function LogNCDialog({ isOpen, onClose, onSubmit, isPending, project }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: InsertNonconformance) => void;
  isPending: boolean;
  project: IsoProject | null;
}) {
  const [formData, setFormData] = useState<Partial<InsertNonconformance>>({
    title: "",
    sourceType: "internal_audit",
    severity: "minor",
    description: "",
    isoClause: "",
    detectedBy: "",
    responsiblePerson: "",
    responsiblePhone: "",
    targetDate: null,
    isoProjectId: project?.id || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    onSubmit(formData as InsertNonconformance);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Nonconformance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                placeholder="Brief summary of the issue"
                required
                data-testid="input-nc-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <Select 
                value={formData.sourceType} 
                onValueChange={v => setFormData({ ...formData, sourceType: v })}
              >
                <SelectTrigger data-testid="select-nc-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_complaint">Customer Complaint</SelectItem>
                  <SelectItem value="internal_audit">Internal Audit</SelectItem>
                  <SelectItem value="external_audit">External Audit</SelectItem>
                  <SelectItem value="supplier_issue">Supplier Issue</SelectItem>
                  <SelectItem value="process_observation">Process Observation</SelectItem>
                  <SelectItem value="management_review">Management Review</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isoClause">ISO Clause</Label>
              <Input 
                id="isoClause" 
                value={formData.isoClause || ""} 
                onChange={e => setFormData({ ...formData, isoClause: e.target.value })} 
                placeholder="e.g., ISO 9001:2015 Clause 8.7"
                data-testid="input-nc-clause"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select 
                value={formData.severity} 
                onValueChange={v => setFormData({ ...formData, severity: v })}
              >
                <SelectTrigger data-testid="select-nc-severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical (Major Impact)</SelectItem>
                  <SelectItem value="major">Major (Significant Deviation)</SelectItem>
                  <SelectItem value="minor">Minor (Minor Deviation)</SelectItem>
                  <SelectItem value="observation">Observation (Potential Issue)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Detailed description of what happened or was observed"
              className="min-h-[100px]"
              required
              data-testid="input-nc-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="detectedBy">Detected By</Label>
              <Input 
                id="detectedBy" 
                value={formData.detectedBy || ""} 
                onChange={e => setFormData({ ...formData, detectedBy: e.target.value })} 
                data-testid="input-nc-detected-by"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsiblePerson">Responsible Person</Label>
              <Input 
                id="responsiblePerson" 
                value={formData.responsiblePerson || ""} 
                onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })} 
                data-testid="input-nc-responsible"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsiblePhone">Responsible Phone (for SMS)</Label>
              <Input 
                id="responsiblePhone" 
                value={formData.responsiblePhone || ""} 
                onChange={e => setFormData({ ...formData, responsiblePhone: e.target.value })} 
                placeholder="+1..."
                data-testid="input-nc-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Completion Date</Label>
              <Input 
                type="date"
                id="targetDate" 
                onChange={e => setFormData({ ...formData, targetDate: e.target.value ? new Date(e.target.value) : null })} 
                data-testid="input-nc-target-date"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-white" disabled={isPending} data-testid="button-submit-nc">
              {isPending ? "Logging..." : "Log Nonconformance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NCDetailDialog({ nc, isOpen, onClose, onUpdate, onAskIsa, isUpdating }: {
  nc: Nonconformance;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: Partial<InsertNonconformance>) => void;
  onAskIsa: (prompt: string) => void;
  isUpdating: boolean;
}) {
  const { toast } = useToast();
  const ncAny = nc as any;

  // RCA local state
  const [rcaType, setRcaType] = useState<string>(ncAny.rcaType || 'manual');
  const [whys, setWhys] = useState<string[]>(() => {
    const data = ncAny.rcaData as any;
    return data?.whys || ['', '', '', '', ''];
  });
  const [fishbone, setFishbone] = useState<Record<string, string>>(() => {
    const data = ncAny.rcaData as any;
    return data?.categories || { man: '', machine: '', material: '', method: '', measurement: '', environment: '' };
  });
  const [rootCauseStatement, setRootCauseStatement] = useState<string>(() => {
    const data = ncAny.rcaData as any;
    return data?.rootCauseStatement || '';
  });

  // Doc update local state
  const [docItems, setDocItems] = useState<DocUpdateItem[]>(() => {
    return (ncAny.docUpdateItems as DocUpdateItem[]) || [];
  });

  useEffect(() => {
    setRcaType(ncAny.rcaType || 'manual');
    const data = ncAny.rcaData as any;
    setWhys(data?.whys || ['', '', '', '', '']);
    setFishbone(data?.categories || { man: '', machine: '', material: '', method: '', measurement: '', environment: '' });
    setRootCauseStatement(data?.rootCauseStatement || '');
    setDocItems((ncAny.docUpdateItems as DocUpdateItem[]) || []);
  }, [nc.id]);

  const saveRca = (type: string, data: any) => {
    onUpdate({ rcaType: type, rcaData: data } as any);
  };

  const addDocItem = (docType: string) => {
    const newItem: DocUpdateItem = { docType, docName: '', status: 'pending', updatedBy: '', updatedDate: '' };
    const updated = [...docItems, newItem];
    setDocItems(updated);
    onUpdate({ docUpdateItems: updated } as any);
  };

  const updateDocItem = (idx: number, field: keyof DocUpdateItem, value: string) => {
    const updated = docItems.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setDocItems(updated);
    onUpdate({ docUpdateItems: updated } as any);
  };

  const removeDocItem = (idx: number) => {
    const updated = docItems.filter((_, i) => i !== idx);
    setDocItems(updated);
    onUpdate({ docUpdateItems: updated } as any);
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdate({ status: newStatus });
  };

  const handleSendSMS = async () => {
    if (!nc.responsiblePhone) {
      toast({ title: "Error", description: "No responsible phone number set.", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", `/api/nonconformances/${nc.id}/notify-sms`);
      toast({ title: "Success", description: "SMS notification sent." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to send SMS.", variant: "destructive" });
    }
  };

  const handleAskIsa = () => {
    const contextPrompt = `I have a nonconformance to work through. Here are the details: 
Title: ${nc.title}
Source: ${nc.sourceType}
Clause: ${nc.isoClause || "Not specified"}
Severity: ${nc.severity}
Description: ${nc.description}

Please coach me through a root cause analysis and help me develop an appropriate corrective action plan aligned with the relevant ISO standard.`;
    onAskIsa(contextPrompt);
    onClose();
  };

  const fmtDate = (d: any) => d ? format(new Date(d), 'MMM d, yyyy') : '—';
  const toInputDate = (d: any) => {
    if (!d) return '';
    try { return format(new Date(d), 'yyyy-MM-dd'); } catch { return ''; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2 sticky top-0 bg-background z-10 border-b border-border/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-black">{nc.title}</DialogTitle>
                <Badge variant="outline" className="capitalize">{nc.status.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{nc.isoClause || "No ISO clause tagged"}</p>
            </div>
            <Button 
              onClick={handleAskIsa}
              className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 gap-2 font-bold"
              data-testid="button-ask-isa-nc"
            >
              <MessageSquare className="w-4 h-4" /> Ask Isa to Guide Me
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="space-y-8 py-4">
            {/* Workflow Progress */}
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4 border border-border/60 overflow-x-auto gap-1">
              <WorkflowStep label="Open" active={nc.status === 'open'} completed={['root_cause_identified', 'action_in_progress', 'effectiveness_pending', 'closed'].includes(nc.status)} />
              <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
              <WorkflowStep label="Root Cause" active={nc.status === 'root_cause_identified'} completed={['action_in_progress', 'effectiveness_pending', 'closed'].includes(nc.status)} />
              <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
              <WorkflowStep label="Action" active={nc.status === 'action_in_progress'} completed={['effectiveness_pending', 'closed'].includes(nc.status)} />
              <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
              <WorkflowStep label="Impl. Verified" active={nc.status === 'action_in_progress' && ncAny.implementationStatus === 'verified'} completed={ncAny.implementationStatus === 'verified' && ['effectiveness_pending', 'closed'].includes(nc.status)} />
              <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
              <WorkflowStep label="Effectiveness" active={nc.status === 'effectiveness_pending'} completed={['closed'].includes(nc.status)} />
              <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
              <WorkflowStep label="Closed" active={nc.status === 'closed'} completed={nc.status === 'closed'} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">

                {/* Description */}
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Description
                  </h3>
                  <div className="bg-white dark:bg-muted/30 border rounded-lg p-4 text-sm leading-relaxed">
                    {nc.description}
                  </div>
                </section>

                {/* ── Root Cause Analysis ── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Root Cause Analysis
                  </h3>

                  {/* RCA tool selector */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'manual', label: 'Manual / Narrative' },
                      { key: '5why', label: '5-Why' },
                      { key: '3x5why', label: '3×5 Why' },
                      { key: 'fishbone', label: 'Fishbone (6M)' },
                    ].map(t => (
                      <Button
                        key={t.key}
                        type="button"
                        size="sm"
                        variant={rcaType === t.key ? 'default' : 'outline'}
                        className={rcaType === t.key ? 'bg-blue-600 text-white hover:bg-blue-700 text-xs' : 'text-xs'}
                        onClick={() => {
                          setRcaType(t.key);
                          onUpdate({ rcaType: t.key } as any);
                        }}
                        data-testid={`button-nc-rca-${t.key}`}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>

                  {/* Manual/narrative */}
                  {rcaType === 'manual' && (
                    <Textarea
                      defaultValue={nc.rootCause || ''}
                      onBlur={e => onUpdate({ rootCause: e.target.value })}
                      placeholder="Describe the underlying root cause of the nonconformance..."
                      className="min-h-[120px]"
                      data-testid="textarea-nc-root-cause"
                    />
                  )}

                  {/* 5-Why */}
                  {rcaType === '5why' && (
                    <div className="space-y-2">
                      {whys.map((why, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">{i + 1}</span>
                          <Input
                            value={why}
                            onChange={e => setWhys(whys.map((w, j) => j === i ? e.target.value : w))}
                            onBlur={() => saveRca('5why', { whys, rootCauseStatement })}
                            placeholder={`Why ${i + 1}${i === 0 ? ' — Why did this happen?' : i === 4 ? ' — Root cause' : ''}`}
                            className="h-8 text-sm"
                            data-testid={`input-nc-why-${i + 1}`}
                          />
                        </div>
                      ))}
                      <div className="pt-1">
                        <Label className="text-xs">Root Cause Statement</Label>
                        <Textarea
                          value={rootCauseStatement}
                          onChange={e => setRootCauseStatement(e.target.value)}
                          onBlur={() => saveRca('5why', { whys, rootCauseStatement })}
                          placeholder="Summarize the confirmed root cause..."
                          className="min-h-[60px] text-sm mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3×5 Why */}
                  {rcaType === '3x5why' && (
                    <div className="space-y-4">
                      {[0, 1, 2].map(strand => (
                        <div key={strand} className="border rounded-lg p-3 space-y-2">
                          <p className="text-xs font-bold text-muted-foreground">Strand {strand + 1}</p>
                          {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-2 items-start">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-1">{i + 1}</span>
                              <Input
                                value={(ncAny.rcaData as any)?.strands?.[strand]?.whys?.[i] || ''}
                                onChange={e => {
                                  const data = (ncAny.rcaData as any) || { strands: [{}, {}, {}] };
                                  const strands = data.strands || [{}, {}, {}];
                                  const s = { ...strands[strand], whys: [...(strands[strand]?.whys || ['', '', '', '', ''])] };
                                  s.whys[i] = e.target.value;
                                  const newStrands = strands.map((st: any, si: number) => si === strand ? s : st);
                                  onUpdate({ rcaData: { ...data, strands: newStrands } } as any);
                                }}
                                placeholder={`Strand ${strand + 1} — Why ${i + 1}`}
                                className="h-7 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                      <div>
                        <Label className="text-xs">Root Cause Statement</Label>
                        <Textarea
                          defaultValue={(ncAny.rcaData as any)?.rootCauseStatement || ''}
                          onBlur={e => onUpdate({ rcaData: { ...(ncAny.rcaData as any), rootCauseStatement: e.target.value } } as any)}
                          placeholder="Common root cause across all strands..."
                          className="min-h-[60px] text-sm mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Fishbone */}
                  {rcaType === 'fishbone' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'man', label: 'Man (People)' },
                          { key: 'machine', label: 'Machine / Equipment' },
                          { key: 'material', label: 'Material' },
                          { key: 'method', label: 'Method / Process' },
                          { key: 'measurement', label: 'Measurement' },
                          { key: 'environment', label: 'Environment' },
                        ].map(cat => (
                          <div key={cat.key} className="space-y-1">
                            <Label className="text-xs font-bold">{cat.label}</Label>
                            <Textarea
                              value={fishbone[cat.key] || ''}
                              onChange={e => setFishbone({ ...fishbone, [cat.key]: e.target.value })}
                              onBlur={() => saveRca('fishbone', { categories: fishbone, rootCauseStatement })}
                              placeholder={`Contributing causes — ${cat.label}`}
                              className="min-h-[70px] text-xs resize-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="text-xs">Root Cause Statement</Label>
                        <Textarea
                          value={rootCauseStatement}
                          onChange={e => setRootCauseStatement(e.target.value)}
                          onBlur={() => saveRca('fishbone', { categories: fishbone, rootCauseStatement })}
                          placeholder="Confirmed root cause based on fishbone analysis..."
                          className="min-h-[60px] text-sm mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {nc.status === 'open' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange('root_cause_identified')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-nc-rca-done"
                    >
                      Confirm Root Cause
                    </Button>
                  )}
                </section>

                {/* ── Corrective & Preventive Actions ── */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Corrective & Preventive Actions
                  </h3>
                  <div className="space-y-5">

                    {/* Immediate Containment + date */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">Immediate Containment</Label>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <Label className="text-[10px] text-muted-foreground">Containment Date</Label>
                          <Input type="date" className="h-6 text-xs w-36 py-0"
                            defaultValue={toInputDate(ncAny.containmentDate)}
                            onBlur={e => { if (e.target.value) onUpdate({ containmentDate: new Date(e.target.value) } as any); }}
                            data-testid="input-nc-containment-date" />
                        </div>
                      </div>
                      <Textarea
                        defaultValue={nc.immediateContainment || ""}
                        onBlur={e => onUpdate({ immediateContainment: e.target.value })}
                        placeholder="What was done immediately to contain the issue?"
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Corrective Action + due/completion dates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Label className="text-xs font-bold">Corrective Action</Label>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <Label className="text-[10px] text-muted-foreground">Due</Label>
                            <Input type="date" className="h-6 text-xs w-32 py-0"
                              defaultValue={toInputDate(ncAny.caActionDueDate)}
                              onBlur={e => { if (e.target.value) onUpdate({ caActionDueDate: new Date(e.target.value) } as any); }}
                              data-testid="input-nc-ca-due" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                            <Label className="text-[10px] text-muted-foreground">Completed</Label>
                            <Input type="date" className="h-6 text-xs w-32 py-0"
                              defaultValue={toInputDate(ncAny.caCompletionDate)}
                              onBlur={e => { if (e.target.value) onUpdate({ caCompletionDate: new Date(e.target.value) } as any); }}
                              data-testid="input-nc-ca-completion" />
                          </div>
                        </div>
                      </div>
                      <Textarea
                        defaultValue={nc.correctiveAction || ""}
                        onBlur={e => onUpdate({ correctiveAction: e.target.value })}
                        placeholder="What actions are being taken to eliminate the cause?"
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Preventive Action + due/completion dates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Label className="text-xs font-bold">Preventive Action</Label>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <Label className="text-[10px] text-muted-foreground">Due</Label>
                            <Input type="date" className="h-6 text-xs w-32 py-0"
                              defaultValue={toInputDate(ncAny.paActionDueDate)}
                              onBlur={e => { if (e.target.value) onUpdate({ paActionDueDate: new Date(e.target.value) } as any); }}
                              data-testid="input-nc-pa-due" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                            <Label className="text-[10px] text-muted-foreground">Completed</Label>
                            <Input type="date" className="h-6 text-xs w-32 py-0"
                              defaultValue={toInputDate(ncAny.paCompletionDate)}
                              onBlur={e => { if (e.target.value) onUpdate({ paCompletionDate: new Date(e.target.value) } as any); }}
                              data-testid="input-nc-pa-completion" />
                          </div>
                        </div>
                      </div>
                      <Textarea
                        defaultValue={nc.preventiveAction || ""}
                        onBlur={e => onUpdate({ preventiveAction: e.target.value })}
                        placeholder="How will we prevent this from happening again?"
                        className="min-h-[80px]"
                      />
                    </div>

                  </div>
                  {nc.status === 'root_cause_identified' && (
                    <Button size="sm" onClick={() => handleStatusChange('action_in_progress')} className="bg-accent hover:bg-accent/90 text-white" data-testid="button-nc-action-start">
                      Move to Action in Progress
                    </Button>
                  )}
                </section>

                {/* ── Documentation Update Verification ── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-600" />
                    <span className="text-violet-700 dark:text-violet-400">Documentation Update Verification</span>
                    {ncAny.docUpdateRequired && ncAny.docUpdateStatus === 'completed' && (
                      <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs ml-auto">All Updated ✓</Badge>
                    )}
                    {ncAny.docUpdateRequired && ncAny.docUpdateStatus === 'in_progress' && (
                      <Badge className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-xs ml-auto">In Progress</Badge>
                    )}
                    {!ncAny.docUpdateRequired && (
                      <Badge variant="outline" className="text-xs ml-auto text-muted-foreground">Not Required</Badge>
                    )}
                  </h3>

                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                    <Switch
                      checked={!!ncAny.docUpdateRequired}
                      onCheckedChange={val => onUpdate({ docUpdateRequired: val } as any)}
                      data-testid="switch-nc-doc-update"
                    />
                    <div>
                      <p className="text-sm font-medium">{ncAny.docUpdateRequired ? 'Documentation updates required' : 'No documentation updates needed'}</p>
                      <p className="text-xs text-muted-foreground">ISO 9001 §7.5 / IATF 16949 / AS9100D / ISO 13485</p>
                    </div>
                  </div>

                  {ncAny.docUpdateRequired && (
                    <div className="space-y-3">
                      {/* Preset quick-add buttons */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Quick-add document type:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {DOC_TYPE_PRESETS.map(type => (
                            <Button key={type} type="button" variant="outline" size="sm"
                              className="text-[10px] h-6 px-2 py-0"
                              onClick={() => addDocItem(type)}
                              data-testid={`button-nc-add-doc-${type.replace(/\s+/g, '-').toLowerCase()}`}
                            >
                              + {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Doc items */}
                      {docItems.length > 0 && (
                        <div className="space-y-2">
                          {docItems.map((item, idx) => (
                            <div key={idx} className="border rounded-lg p-3 space-y-2 bg-background">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{item.docType}</span>
                                <div className="flex items-center gap-2">
                                  <Select value={item.status} onValueChange={v => updateDocItem(idx, 'status', v)}>
                                    <SelectTrigger className="h-6 text-xs w-32" data-testid={`select-nc-doc-status-${idx}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="updated">Updated ✓</SelectItem>
                                      <SelectItem value="not_required">N/A</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocItem(idx)} data-testid={`button-nc-remove-doc-${idx}`}>
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <Input value={item.docName} onChange={e => updateDocItem(idx, 'docName', e.target.value)}
                                  placeholder="Doc name / rev #" className="h-7 text-xs col-span-2"
                                  data-testid={`input-nc-doc-name-${idx}`} />
                                <Input type="date" value={item.updatedDate} onChange={e => updateDocItem(idx, 'updatedDate', e.target.value)}
                                  className="h-7 text-xs" data-testid={`input-nc-doc-date-${idx}`} />
                              </div>
                              {item.status === 'updated' && (
                                <Input value={item.updatedBy} onChange={e => updateDocItem(idx, 'updatedBy', e.target.value)}
                                  placeholder="Updated by (name / title)" className="h-7 text-xs"
                                  data-testid={`input-nc-doc-updated-by-${idx}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Overall status and verified by */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Overall Status</Label>
                          <Select defaultValue={ncAny.docUpdateStatus || 'pending'} onValueChange={v => onUpdate({ docUpdateStatus: v } as any)}>
                            <SelectTrigger className="h-8 text-sm" data-testid="select-nc-doc-overall-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">All Updated ✓</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Verified By</Label>
                          <Input defaultValue={ncAny.docUpdateVerifiedBy || ''} placeholder="Name / title"
                            onBlur={e => onUpdate({ docUpdateVerifiedBy: e.target.value } as any)}
                            className="h-8 text-sm" data-testid="input-nc-doc-verified-by" />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Notes</Label>
                        <Textarea defaultValue={ncAny.docUpdateNotes || ''} placeholder="Notes about the documentation update..."
                          onBlur={e => onUpdate({ docUpdateNotes: e.target.value } as any)}
                          className="min-h-[60px] text-sm" data-testid="textarea-nc-doc-notes" />
                      </div>
                    </div>
                  )}
                </section>

                {/* ── Verification of Implementation ── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-indigo-700 dark:text-indigo-400">Verification of Implementation</span>
                    {ncAny.implementationStatus === 'verified' && (
                      <Badge className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs ml-auto">Implemented ✓</Badge>
                    )}
                    {ncAny.implementationStatus === 'not_verified' && (
                      <Badge variant="destructive" className="text-xs ml-auto">Not Verified</Badge>
                    )}
                    {(!ncAny.implementationStatus || ncAny.implementationStatus === 'pending') && (
                      <Badge variant="secondary" className="text-xs ml-auto">Pending</Badge>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Confirm that the corrective and preventive actions described above were <strong>actually carried out</strong> — not just planned. 
                    This is separate from whether the actions were effective. 
                    <em className="ml-1">(ISO 9001 §10.2.1(e) / IATF 16949 §10.2.3)</em>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Implementation Status</Label>
                      <Select
                        defaultValue={ncAny.implementationStatus || 'pending'}
                        onValueChange={v => onUpdate({ implementationStatus: v } as any)}
                      >
                        <SelectTrigger className="h-8 text-sm" data-testid="select-nc-impl-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified — Actions Confirmed Complete</SelectItem>
                          <SelectItem value="not_verified">Not Verified — Actions Incomplete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Verified By (name / title)</Label>
                      <Input
                        defaultValue={ncAny.implementationVerifiedBy || ''}
                        placeholder="e.g., QA Manager, Lead Auditor"
                        onBlur={e => onUpdate({ implementationVerifiedBy: e.target.value } as any)}
                        className="h-8 text-sm"
                        data-testid="input-nc-impl-verified-by"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Verification Date</Label>
                      <Input
                        type="date"
                        defaultValue={toInputDate(ncAny.implementationVerifiedDate)}
                        onBlur={e => { if (e.target.value) onUpdate({ implementationVerifiedDate: new Date(e.target.value) } as any); }}
                        className="h-8 text-sm"
                        data-testid="input-nc-impl-verified-date"
                      />
                    </div>
                    <div />
                  </div>
                  <div>
                    <Label className="text-xs">Implementation Verification Notes</Label>
                    <Textarea
                      defaultValue={ncAny.implementationVerificationNotes || ''}
                      onBlur={e => onUpdate({ implementationVerificationNotes: e.target.value } as any)}
                      placeholder="Describe what was physically observed or reviewed to confirm the actions were completed — e.g., walk-through, document review, system check..."
                      className="min-h-[80px] text-sm"
                      data-testid="textarea-nc-impl-notes"
                    />
                  </div>
                  {ncAny.implementationStatus === 'verified' && nc.status === 'action_in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('effectiveness_pending')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      data-testid="button-nc-move-to-effectiveness"
                    >
                      Implementation Confirmed — Begin Effectiveness Monitoring
                    </Button>
                  )}
                </section>

                {/* ── Effectiveness Verification ── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Search className="w-4 h-4" /> Effectiveness Verification
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Effectiveness Result</Label>
                      <Select 
                        defaultValue={nc.effectivenessResult || "pending"} 
                        onValueChange={v => onUpdate({ effectivenessResult: v })}
                      >
                        <SelectTrigger data-testid="select-nc-effectiveness">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="effective">Effective</SelectItem>
                          <SelectItem value="not_effective">Not Effective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Verification Method</Label>
                      <Input 
                        defaultValue={nc.verificationMethod || ""}
                        onBlur={e => onUpdate({ verificationMethod: e.target.value })}
                        placeholder="e.g., Follow-up audit, 30-day check"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Closure Notes</Label>
                    <Textarea 
                      defaultValue={nc.closureNotes || ""}
                      onBlur={e => onUpdate({ closureNotes: e.target.value })}
                      placeholder="Final notes before closing..."
                    />
                  </div>
                  {nc.status === 'effectiveness_pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdate({ status: 'closed', closureDate: new Date() })}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-nc-close"
                    >
                      Mark Effective & Close NC
                    </Button>
                  )}
                </section>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DetailItem label="Severity" value={nc.severity} badge />
                    <DetailItem label="Source" value={nc.sourceType.replace(/_/g, ' ')} badge />
                    <DetailItem label="Detected By" value={nc.detectedBy} />
                    <DetailItem label="Detected Date" value={nc.detectedDate ? fmtDate(nc.detectedDate) : "—"} />
                    <DetailItem label="Responsible" value={nc.responsiblePerson} />
                    <DetailItem label="Target Date" value={nc.targetDate ? fmtDate(nc.targetDate) : "—"} />
                    {ncAny.containmentDate && <DetailItem label="Containment Date" value={fmtDate(ncAny.containmentDate)} />}
                    {ncAny.caActionDueDate && <DetailItem label="CA Due" value={fmtDate(ncAny.caActionDueDate)} />}
                    {ncAny.caCompletionDate && <DetailItem label="CA Completed" value={fmtDate(ncAny.caCompletionDate)} />}
                    {ncAny.paActionDueDate && <DetailItem label="PA Due" value={fmtDate(ncAny.paActionDueDate)} />}
                    {ncAny.paCompletionDate && <DetailItem label="PA Completed" value={fmtDate(ncAny.paCompletionDate)} />}
                    {ncAny.implementationStatus && (
                      <DetailItem label="Impl. Status" value={
                        ncAny.implementationStatus === 'verified' ? '✓ Verified' :
                        ncAny.implementationStatus === 'not_verified' ? '✗ Not Verified' : 'Pending'
                      } />
                    )}
                    {ncAny.implementationVerifiedDate && <DetailItem label="Impl. Verified Date" value={fmtDate(ncAny.implementationVerifiedDate)} />}
                    {ncAny.implementationVerifiedBy && <DetailItem label="Impl. Verified By" value={ncAny.implementationVerifiedBy} />}
                    {nc.responsiblePhone && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2 text-xs"
                        onClick={handleSendSMS}
                        data-testid="button-nc-sms"
                      >
                        <Send className="w-3 h-3" /> Send SMS to Responsible
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* RCA type badge */}
                {ncAny.rcaType && ncAny.rcaType !== 'manual' && (
                  <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">RCA Method</p>
                      <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">
                        {ncAny.rcaType === '5why' ? '5-Why' : ncAny.rcaType === '3x5why' ? '3×5 Why' : ncAny.rcaType === 'fishbone' ? 'Fishbone (6M)' : ncAny.rcaType}
                      </Badge>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Info className="w-4 h-4" /> ISO Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-blue-600 dark:text-blue-500 leading-relaxed">
                      Nonconformances must be addressed per ISO 9001:2015 §10.2 / IATF 16949 §10.2.3. 
                      Perform RCA to prevent recurrence and update affected documents per §7.5.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkflowStep({ label, active, completed }: { label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
        completed ? "bg-green-500 text-white" : active ? "bg-accent text-white" : "bg-muted text-muted-foreground border"
      }`}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : null}
        {!completed && active ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> : null}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-tighter ${
        active ? "text-accent" : completed ? "text-green-600" : "text-muted-foreground"
      }`}>{label}</span>
    </div>
  );
}

function DetailItem({ label, value, badge }: { label: string; value: string | null | undefined; badge?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      {badge ? (
        <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">{value || "—"}</Badge>
      ) : (
        <p className="text-xs font-medium">{value || "—"}</p>
      )}
    </div>
  );
}
