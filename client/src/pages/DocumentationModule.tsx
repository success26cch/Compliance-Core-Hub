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
  FileMinus
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
    <div className="flex flex-col h-full bg-muted/30 p-6 overflow-y-auto">
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
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : !documents || documents.length === 0 ? (
        <EmptyState onNewDoc={handleNewDoc} onAskIsa={onAskIsa} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments?.map((doc) => (
            <DocumentCard 
              key={doc.id} 
              doc={doc} 
              onEdit={() => setSelectedDoc(doc)} 
              onDelete={() => deleteMutation.mutate(doc.id)}
              onAskIsa={onAskIsa}
              getIcon={getDocIcon}
              getStatusBadge={getStatusBadge}
            />
          ))}
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

function DocumentCard({ doc, onEdit, onDelete, onAskIsa, getIcon, getStatusBadge }: any) {
  return (
    <Card className="hover-elevate cursor-pointer group" onClick={onEdit}>
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
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
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
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Updated {format(new Date(doc.updatedAt || doc.createdAt), 'MMM d, yyyy')}
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-[10px] gap-1 bg-accent/5 hover:bg-accent/10 border-accent/20 text-accent font-bold"
            onClick={(e) => {
              e.stopPropagation();
              onAskIsa(`I'm working on the ${doc.docType.replace('_', ' ')} titled "${doc.title}". Can you review the current content and coach me on how to improve it to better satisfy ISO requirements? Current content: ${doc.content || "Empty"}`);
            }}
          >
            <MessageSquare className="w-3 h-3" /> Ask Isa
          </Button>
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
