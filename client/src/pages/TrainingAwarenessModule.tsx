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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, GraduationCap, CheckCircle2, Clock, Users, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { IsoAwarenessNotice, IsoAwarenessAcknowledgment } from "@shared/schema";

const ISO_STANDARDS = [
  "ISO 9001:2015",
  "ISO 14001:2015",
  "ISO 45001:2018",
  "ISO 13485:2016",
  "IATF 16949:2016",
  "AS9100 Rev D",
];

const PROCESS_AREAS = [
  "Quality",
  "Production",
  "Engineering",
  "Purchasing / Supply Chain",
  "Shipping / Receiving",
  "Management",
  "Human Resources",
  "Maintenance",
  "Sales / Customer Service",
  "Document Control",
  "All Departments",
];

export function TrainingAwarenessModule({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [ackDialog, setAckDialog] = useState<{ noticeId: number; noticeTitle: string } | null>(null);

  const { data: notices = [], isLoading } = useQuery<IsoAwarenessNotice[]>({
    queryKey: ["/api/iso-awareness-notices"],
  });

  const { data: acknowledgments = [] } = useQuery<IsoAwarenessAcknowledgment[]>({
    queryKey: ["/api/iso-awareness-notices", expandedId, "acknowledgments"],
    queryFn: async () => {
      if (!expandedId) return [];
      const res = await fetch(`/api/iso-awareness-notices/${expandedId}/acknowledgments`);
      return res.json();
    },
    enabled: !!expandedId,
  });

  const createNotice = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/iso-awareness-notices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-awareness-notices"] });
      setShowCreate(false);
      toast({ title: "Awareness notice sent" });
    },
  });

  const deleteNotice = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/iso-awareness-notices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-awareness-notices"] });
      toast({ title: "Notice removed" });
    },
  });

  const createAck = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/iso-awareness-notices/${data.noticeId}/acknowledgments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-awareness-notices", expandedId, "acknowledgments"] });
      setAckDialog(null);
      toast({ title: "Acknowledgment recorded" });
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h2 className="text-lg font-bold text-primary">Training & Awareness</h2>
          <p className="text-xs text-muted-foreground">Push clause-specific requirements to process owners and track acknowledgment.</p>
        </div>
        <div className="flex items-center gap-2">
          {onAskIsa && (
            <Button size="sm" variant="outline" onClick={() => onAskIsa("What does ISO 9001:2015 Clause 7.3 require for awareness, and how should we communicate quality objectives to our process owners?")}>
              Ask Isa
            </Button>
          )}
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1" onClick={() => setShowCreate(true)} data-testid="button-create-notice">
            <Plus className="w-4 h-4" /> New Notice
          </Button>
        </div>
      </div>

      {/* Notice list */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="font-medium text-muted-foreground">No awareness notices yet</p>
            <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
              Use awareness notices to push specific clause requirements or procedure changes to the right process owners and capture their acknowledgment as audit evidence.
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>Create First Notice</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(notice => (
              <Card key={notice.id} className="border overflow-hidden" data-testid={`card-notice-${notice.id}`}>
                {/* Notice header */}
                <div
                  className="flex items-start justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => {
                    setExpandedId(expandedId === notice.id ? null : notice.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-primary">{notice.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{notice.standard}</Badge>
                        {notice.clause && <Badge variant="outline" className="text-xs font-mono">Clause {notice.clause}</Badge>}
                        {notice.processArea && <Badge variant="outline" className="text-xs">{notice.processArea}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      className="text-red-400 hover:text-red-600 p-1"
                      onClick={e => { e.stopPropagation(); deleteNotice.mutate(notice.id); }}
                      data-testid={`button-delete-notice-${notice.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedId === notice.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === notice.id && (
                  <div className="border-t px-4 pb-4 pt-3 bg-muted/10 space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">{notice.message}</p>

                    {notice.dueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Due by {new Date(notice.dueDate).toLocaleDateString()}
                      </p>
                    )}

                    {/* Acknowledgments */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Acknowledgments ({acknowledgments.length})
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => setAckDialog({ noticeId: notice.id, noticeTitle: notice.title })}
                          data-testid={`button-add-ack-${notice.id}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Record Acknowledgment
                        </Button>
                      </div>
                      {acknowledgments.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No acknowledgments recorded yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {acknowledgments.map(ack => (
                            <div key={ack.id} className="flex items-center justify-between text-sm bg-white border rounded-lg px-3 py-2" data-testid={`row-ack-${ack.id}`}>
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                <span className="font-medium">{ack.acknowledgedBy}</span>
                              </span>
                              <span className="text-xs text-muted-foreground">{ack.acknowledgedAt ? new Date(ack.acknowledgedAt).toLocaleDateString() : ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create notice dialog */}
      {showCreate && (
        <CreateNoticeDialog
          onSave={(data) => createNotice.mutate(data)}
          onClose={() => setShowCreate(false)}
          isPending={createNotice.isPending}
        />
      )}

      {/* Acknowledgment dialog */}
      {ackDialog && (
        <AckDialog
          noticeId={ackDialog.noticeId}
          noticeTitle={ackDialog.noticeTitle}
          onSave={(data) => createAck.mutate(data)}
          onClose={() => setAckDialog(null)}
          isPending={createAck.isPending}
        />
      )}
    </div>
  );
}

function CreateNoticeDialog({ onSave, onClose, isPending }: { onSave: (data: any) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState({
    standard: "ISO 9001:2015",
    clause: "",
    title: "",
    message: "",
    processArea: "",
    dueDate: "",
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Awareness Notice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Standard</Label>
              <Select value={form.standard} onValueChange={v => setForm(f => ({ ...f, standard: v }))}>
                <SelectTrigger data-testid="select-notice-standard"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Clause <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. 7.3" value={form.clause} onChange={e => setForm(f => ({ ...f, clause: e.target.value }))} data-testid="input-notice-clause" />
            </div>
          </div>
          <div>
            <Label>Title</Label>
            <Input placeholder="e.g. Awareness of Quality Objectives — Production Team" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-notice-title" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              placeholder="Describe the requirement, what it means for this process area, and what the team needs to know or do..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={4}
              data-testid="textarea-notice-message"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Process Area <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={form.processArea} onValueChange={v => setForm(f => ({ ...f, processArea: v }))}>
                <SelectTrigger data-testid="select-process-area"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {PROCESS_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-notice-due-date" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave(form)} disabled={isPending || !form.title || !form.message} data-testid="button-save-notice">
              {isPending ? "Sending..." : "Send Notice"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AckDialog({ noticeId, noticeTitle, onSave, onClose, isPending }: {
  noticeId: number; noticeTitle: string;
  onSave: (data: any) => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({ acknowledgedBy: "", notes: "" });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Acknowledgment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">"{noticeTitle}"</p>
          <div>
            <Label>Name</Label>
            <Input placeholder="Process owner name" value={form.acknowledgedBy} onChange={e => setForm(f => ({ ...f, acknowledgedBy: e.target.value }))} data-testid="input-ack-name" />
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
