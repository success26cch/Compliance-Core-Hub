import { useState } from "react";
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
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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

export function NonconformanceManager({ onAskIsa }: NonconformanceManagerProps) {
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedNC, setSelectedNC] = useState<Nonconformance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: nonconformances, isLoading } = useQuery<Nonconformance[]>({
    queryKey: ["/api/nonconformances"],
  });

  const { data: projects } = useQuery<IsoProject[]>({
    queryKey: ["/api/iso-projects-list"], // Assuming there's a list endpoint or we use the single one
  });
  
  // Actually, based on ISOManager.tsx, project is a single object or null for the user
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nonconformances"] });
      toast({ title: "Success", description: "Nonconformance updated." });
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
        project={project}
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
  
  const handleStatusChange = (newStatus: string) => {
    onUpdate({ status: newStatus });
  };

  const handleSendSMS = async () => {
    if (!nc.responsiblePhone) {
      toast({ title: "Error", description: "No responsible phone number set.", variant: "destructive" });
      return;
    }
    try {
      // Reusing the CAPA SMS pattern if possible, or assuming there's an endpoint
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
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4 border border-border/60">
              <WorkflowStep 
                label="Open" 
                active={nc.status === 'open'} 
                completed={['root_cause_identified', 'action_in_progress', 'effectiveness_pending', 'closed'].includes(nc.status)} 
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              <WorkflowStep 
                label="Root Cause" 
                active={nc.status === 'root_cause_identified'} 
                completed={['action_in_progress', 'effectiveness_pending', 'closed'].includes(nc.status)} 
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              <WorkflowStep 
                label="Action" 
                active={nc.status === 'action_in_progress'} 
                completed={['effectiveness_pending', 'closed'].includes(nc.status)} 
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              <WorkflowStep 
                label="Verification" 
                active={nc.status === 'effectiveness_pending'} 
                completed={['closed'].includes(nc.status)} 
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
              <WorkflowStep 
                label="Closed" 
                active={nc.status === 'closed'} 
                completed={nc.status === 'closed'} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Description
                  </h3>
                  <div className="bg-white dark:bg-muted/30 border rounded-lg p-4 text-sm leading-relaxed">
                    {nc.description}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Root Cause Analysis
                  </h3>
                  <Textarea 
                    value={nc.rootCause || ""} 
                    onChange={e => onUpdate({ rootCause: e.target.value })}
                    placeholder="Identify the underlying cause of the nonconformance..."
                    className="min-h-[100px]"
                    data-testid="textarea-nc-root-cause"
                  />
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

                <section className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Corrective & Preventive Actions
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Immediate Containment</Label>
                      <Textarea 
                        value={nc.immediateContainment || ""} 
                        onChange={e => onUpdate({ immediateContainment: e.target.value })}
                        placeholder="What was done immediately to contain the issue?"
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Corrective Action</Label>
                      <Textarea 
                        value={nc.correctiveAction || ""} 
                        onChange={e => onUpdate({ correctiveAction: e.target.value })}
                        placeholder="What actions are being taken to eliminate the cause?"
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Preventive Action</Label>
                      <Textarea 
                        value={nc.preventiveAction || ""} 
                        onChange={e => onUpdate({ preventiveAction: e.target.value })}
                        placeholder="How will we prevent this from happening again?"
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                  {nc.status === 'root_cause_identified' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange('action_in_progress')}
                      className="bg-accent hover:bg-accent/90 text-white"
                      data-testid="button-nc-action-start"
                    >
                      Move to Action in Progress
                    </Button>
                  )}
                  {nc.status === 'action_in_progress' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange('effectiveness_pending')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      data-testid="button-nc-action-complete"
                    >
                      Actions Completed - Move to Verification
                    </Button>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Search className="w-4 h-4" /> Effectiveness Verification
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Effectiveness Result</Label>
                      <Select 
                        value={nc.effectivenessResult || "pending"} 
                        onValueChange={v => onUpdate({ effectivenessResult: v })}
                      >
                        <SelectTrigger>
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
                        value={nc.verificationMethod || ""} 
                        onChange={e => onUpdate({ verificationMethod: e.target.value })}
                        placeholder="e.g., Follow-up audit"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Closure Notes</Label>
                    <Textarea 
                      value={nc.closureNotes || ""} 
                      onChange={e => onUpdate({ closureNotes: e.target.value })}
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

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DetailItem label="Severity" value={nc.severity} badge />
                    <DetailItem label="Source" value={nc.sourceType.replace(/_/g, ' ')} badge />
                    <DetailItem label="Detected By" value={nc.detectedBy} />
                    <DetailItem label="Detected Date" value={nc.detectedDate ? format(new Date(nc.detectedDate), 'MMM d, yyyy') : "—"} />
                    <DetailItem label="Responsible" value={nc.responsiblePerson} />
                    <DetailItem label="Target Date" value={nc.targetDate ? format(new Date(nc.targetDate), 'MMM d, yyyy') : "—"} />
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

                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Info className="w-4 h-4" /> ISO Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-blue-600 dark:text-blue-500 leading-relaxed">
                      Nonconformances must be addressed according to ISO requirements (e.g., Clause 10.2 of ISO 9001:2015). 
                      Ensure root cause analysis is performed to prevent recurrence.
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
        {!completed && !active ? "" : null}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-tighter ${
        active ? "text-accent" : completed ? "text-green-600" : "text-muted-foreground"
      }`}>{label}</span>
    </div>
  );
}

function DetailItem({ label, value, badge }: { label: string; value: string | null; badge?: boolean }) {
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
