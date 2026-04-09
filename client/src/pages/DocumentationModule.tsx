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
import type { IsoDocument, InsertIsoDocument, IsoProject } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentationModuleProps {
  onAskIsa: (prompt: string) => void;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<IsoDocument[]>({
    queryKey: ["/api/iso-documents"],
  });

  const { data: project } = useQuery<IsoProject | null>({
    queryKey: ["/api/iso-projects"],
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
        </TabsList>
      </Tabs>

      {activeTab === "coverage_map" ? (
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
    </div>
  );
}

function DocumentCard({ doc, onEdit, onDelete, onAskIsa, onDraftWithIsa, getIcon, getStatusBadge }: any) {
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
          <div className="flex gap-2">
            {getStatusBadge(doc.status)}
            <Badge variant="outline" className="text-[10px]">v{doc.version}</Badge>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">
            Updated {format(new Date(doc.updatedAt || doc.createdAt), 'MMM d, yyyy')}
          </p>
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
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

function DocumentDialog({ isOpen, onClose, onSubmit, onDelete, doc, project, isPending, onAskIsa }: any) {
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

  // Sync with doc if editing
  useEffect(() => {
    if (doc) {
      setFormData({
        ...doc,
        reviewDate: doc.reviewDate ? new Date(doc.reviewDate) : null,
        tags: doc.tags || [],
      });
    }
  }, [doc]);

  // Use useEffect to update form when doc changes
  useEffect(() => {
    if (doc) {
      setFormData({
        ...doc,
        reviewDate: doc.reviewDate ? new Date(doc.reviewDate) : null,
        tags: doc.tags || [],
      });
    } else {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onSubmit(formData as InsertIsoDocument);
  };

  const handleAskGuidance = () => {
    const prompt = `I'm creating a ${DOC_TYPES.find(t => t.value === formData.docType)?.label} titled '${formData.title}' ${formData.isoClause ? `for ${formData.isoClause}` : ''}. Can you coach me on the required structure, key elements to include, and how to write this to satisfy ISO requirements?`;
    onAskIsa(prompt);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{doc ? 'Edit Document' : 'Create New Document'}</DialogTitle>
        </DialogHeader>
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
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-accent text-xs h-7 gap-1"
                onClick={handleAskGuidance}
              >
                <Sparkles className="w-3 h-3" /> Ask Isa for Structure Guidance
              </Button>
            </div>
            <Textarea 
              value={formData.content || ''} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              placeholder="Describe the document purpose, scope, and key steps..."
              className="min-h-[200px]"
            />
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
          onClick={() => onAskIsa("What documents should I create first for my ISO 9001:2015 Quality Management System?")}
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
