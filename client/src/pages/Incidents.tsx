import { ProtectedLayout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  AlertTriangle,
  FileWarning,
  CheckCircle,
  Clock,
  Calendar
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Incident = {
  id: number;
  incidentDate: string;
  description: string;
  incidentType: string;
  isRecordable: boolean;
  daysAway: number;
  daysRestricted: number;
  status: string;
  createdAt: string;
};

type IncidentFormData = {
  incidentDate: string;
  description: string;
  incidentType: string;
  isRecordable: boolean;
  daysAway: number;
  daysRestricted: number;
  status: string;
};

const defaultFormData: IncidentFormData = {
  incidentDate: new Date().toISOString().split('T')[0],
  description: '',
  incidentType: 'injury',
  isRecordable: false,
  daysAway: 0,
  daysRestricted: 0,
  status: 'pending_review',
};

function getTypeBadge(type: string) {
  switch (type) {
    case 'injury':
      return <Badge className="bg-red-500 text-white">Injury</Badge>;
    case 'illness':
      return <Badge className="bg-orange-500 text-white">Illness</Badge>;
    case 'near_miss':
      return <Badge className="bg-yellow-500 text-white">Near Miss</Badge>;
    case 'property_damage':
      return <Badge className="bg-blue-500 text-white">Property Damage</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending_review':
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    case 'reviewed':
      return <Badge className="bg-blue-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Reviewed</Badge>;
    case 'closed':
      return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function IncidentFormDialog({ 
  open, 
  onOpenChange, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (data: IncidentFormData) => void;
}) {
  const [formData, setFormData] = useState<IncidentFormData>(defaultFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData(defaultFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Log New Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incidentDate">Incident Date *</Label>
              <Input 
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(e) => setFormData({...formData, incidentDate: e.target.value})}
                required
                data-testid="input-incident-date"
              />
            </div>
            <div>
              <Label htmlFor="incidentType">Incident Type *</Label>
              <Select 
                value={formData.incidentType} 
                onValueChange={(v) => setFormData({...formData, incidentType: v})}
              >
                <SelectTrigger data-testid="select-incident-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="illness">Illness</SelectItem>
                  <SelectItem value="near_miss">Near Miss</SelectItem>
                  <SelectItem value="property_damage">Property Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what happened, where, and any contributing factors..."
              rows={4}
              required
              data-testid="input-description"
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              OSHA Recordability
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.isRecordable}
                  onChange={(e) => setFormData({...formData, isRecordable: e.target.checked})}
                  className="w-4 h-4"
                  data-testid="checkbox-recordable"
                />
                <span className="text-sm">This is an OSHA recordable incident</span>
              </label>

              {formData.isRecordable && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor="daysAway">Days Away From Work</Label>
                    <Input 
                      id="daysAway"
                      type="number"
                      min="0"
                      value={formData.daysAway}
                      onChange={(e) => setFormData({...formData, daysAway: parseInt(e.target.value) || 0})}
                      data-testid="input-days-away"
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysRestricted">Days on Restricted Duty</Label>
                    <Input 
                      id="daysRestricted"
                      type="number"
                      min="0"
                      value={formData.daysRestricted}
                      onChange={(e) => setFormData({...formData, daysRestricted: parseInt(e.target.value) || 0})}
                      data-testid="input-days-restricted"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="status">Review Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(v) => setFormData({...formData, status: v})}
            >
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-incident">
              Log Incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Incidents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      return apiRequest('POST', '/api/incidents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents/chart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      setDialogOpen(false);
      toast({ title: "Incident Logged", description: "Incident has been recorded successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log incident.", variant: "destructive" });
    },
  });

  const recordableCount = incidents.filter(i => i.isRecordable).length;
  const pendingReviewCount = incidents.filter(i => i.status === 'pending_review').length;

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <FileWarning className="w-6 h-6" />
              Incident Log
            </h1>
            <p className="text-muted-foreground">Record and track workplace incidents for OSHA 300 compliance</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-log-incident">
            <Plus className="w-4 h-4" />
            Log Incident
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileWarning className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{incidents.length}</p>
                  <p className="text-sm text-muted-foreground">Total Incidents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{recordableCount}</p>
                  <p className="text-sm text-muted-foreground">OSHA Recordable</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{pendingReviewCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Incident History</CardTitle>
            <CardDescription>
              All recorded workplace incidents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Incidents Recorded</h3>
                <p className="text-muted-foreground mb-4">Great job! Your workplace is incident-free.</p>
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log First Incident
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Recordable</TableHead>
                      <TableHead>Days Away/Restricted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id} data-testid={`incident-row-${incident.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(incident.incidentDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(incident.incidentType)}</TableCell>
                        <TableCell className="max-w-xs truncate">{incident.description}</TableCell>
                        <TableCell>
                          {incident.isRecordable ? (
                            <Badge className="bg-destructive text-destructive-foreground">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {incident.isRecordable ? (
                            <span className="text-sm">
                              {incident.daysAway} / {incident.daysRestricted}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(incident.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <IncidentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={(data) => createMutation.mutate(data)}
        />
      </div>
    </ProtectedLayout>
  );
}
