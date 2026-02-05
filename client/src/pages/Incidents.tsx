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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  AlertTriangle,
  FileWarning,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Download,
  Printer,
  ClipboardList,
  Skull,
  BedDouble,
  Construction,
  Stethoscope
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

type Incident = {
  id: number;
  caseNumber: string | null;
  incidentDate: string;
  description: string;
  incidentType: string;
  employeeName: string | null;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  bodyPart: string | null;
  natureOfInjury: string | null;
  objectOrSubstance: string | null;
  isRecordable: boolean;
  resultedInDeath: boolean;
  daysAway: number;
  daysRestricted: number;
  daysJobTransfer: number;
  isOtherRecordable: boolean;
  status: string;
  createdAt: string;
};

type IncidentFormData = {
  incidentDate: string;
  description: string;
  incidentType: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  location: string;
  bodyPart: string;
  natureOfInjury: string;
  objectOrSubstance: string;
  isRecordable: boolean;
  resultedInDeath: boolean;
  daysAway: number;
  daysRestricted: number;
  daysJobTransfer: number;
  isOtherRecordable: boolean;
  status: string;
};

const defaultFormData: IncidentFormData = {
  incidentDate: new Date().toISOString().split('T')[0],
  description: '',
  incidentType: 'injury',
  employeeName: '',
  jobTitle: '',
  department: '',
  location: '',
  bodyPart: '',
  natureOfInjury: '',
  objectOrSubstance: '',
  isRecordable: false,
  resultedInDeath: false,
  daysAway: 0,
  daysRestricted: 0,
  daysJobTransfer: 0,
  isOtherRecordable: false,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            OSHA 300 Incident Report
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="incidentDate">Date of Injury/Illness *</Label>
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
          </div>

          {/* Employee Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Employee Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input 
                  id="employeeName"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                  placeholder="Full name of injured/ill employee"
                  data-testid="input-employee-name"
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  placeholder="e.g., Forklift Operator"
                  data-testid="input-job-title"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g., Warehouse"
                  data-testid="input-department"
                />
              </div>
              <div>
                <Label htmlFor="location">Location of Event</Label>
                <Input 
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Loading Dock A"
                  data-testid="input-location"
                />
              </div>
            </div>
          </div>

          {/* Injury/Illness Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Injury/Illness Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bodyPart">Body Part Affected</Label>
                <Input 
                  id="bodyPart"
                  value={formData.bodyPart}
                  onChange={(e) => setFormData({...formData, bodyPart: e.target.value})}
                  placeholder="e.g., Lower back, Left hand"
                  data-testid="input-body-part"
                />
              </div>
              <div>
                <Label htmlFor="natureOfInjury">Nature of Injury/Illness</Label>
                <Input 
                  id="natureOfInjury"
                  value={formData.natureOfInjury}
                  onChange={(e) => setFormData({...formData, natureOfInjury: e.target.value})}
                  placeholder="e.g., Strain, Laceration, Burn"
                  data-testid="input-nature-injury"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="objectOrSubstance">Object/Substance That Harmed Employee</Label>
              <Input 
                id="objectOrSubstance"
                value={formData.objectOrSubstance}
                onChange={(e) => setFormData({...formData, objectOrSubstance: e.target.value})}
                placeholder="e.g., Forklift, Chemical spill, Slippery floor"
                data-testid="input-object-substance"
              />
            </div>
            <div>
              <Label htmlFor="description">Description of Event *</Label>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what happened, how, and any contributing factors..."
                rows={3}
                required
                data-testid="input-description"
              />
            </div>
          </div>

          {/* OSHA Classification */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              OSHA 300 Classification
            </h4>
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.isRecordable}
                  onChange={(e) => setFormData({...formData, isRecordable: e.target.checked})}
                  className="w-4 h-4"
                  data-testid="checkbox-recordable"
                />
                <span className="text-sm font-medium">This is an OSHA recordable incident</span>
              </label>

              {formData.isRecordable && (
                <div className="space-y-4 pl-6 border-l-2 border-destructive/30">
                  {/* Classification checkboxes */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.resultedInDeath}
                        onChange={(e) => setFormData({...formData, resultedInDeath: e.target.checked})}
                        className="w-4 h-4"
                        data-testid="checkbox-death"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Skull className="w-4 h-4 text-destructive" />
                        Resulted in Death
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.isOtherRecordable}
                        onChange={(e) => setFormData({...formData, isOtherRecordable: e.target.checked})}
                        className="w-4 h-4"
                        data-testid="checkbox-other-recordable"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Stethoscope className="w-4 h-4 text-orange-500" />
                        Other Recordable Case
                      </span>
                    </label>
                  </div>

                  {/* Days fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="daysAway" className="flex items-center gap-1 text-xs">
                        <BedDouble className="w-3 h-3" />
                        Days Away From Work
                      </Label>
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
                      <Label htmlFor="daysRestricted" className="flex items-center gap-1 text-xs">
                        <Construction className="w-3 h-3" />
                        Days Restricted Duty
                      </Label>
                      <Input 
                        id="daysRestricted"
                        type="number"
                        min="0"
                        value={formData.daysRestricted}
                        onChange={(e) => setFormData({...formData, daysRestricted: parseInt(e.target.value) || 0})}
                        data-testid="input-days-restricted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="daysJobTransfer" className="flex items-center gap-1 text-xs">
                        <ClipboardList className="w-3 h-3" />
                        Days Job Transfer
                      </Label>
                      <Input 
                        id="daysJobTransfer"
                        type="number"
                        min="0"
                        value={formData.daysJobTransfer}
                        onChange={(e) => setFormData({...formData, daysJobTransfer: parseInt(e.target.value) || 0})}
                        data-testid="input-days-transfer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
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

function OSHA300Report({ incidents }: { incidents: Incident[] }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const recordableIncidents = incidents.filter(i => i.isRecordable);
  
  // Calculate summary stats
  const totalDeaths = recordableIncidents.filter(i => i.resultedInDeath).length;
  const totalDaysAway = recordableIncidents.reduce((sum, i) => sum + (i.daysAway || 0), 0);
  const totalDaysRestricted = recordableIncidents.reduce((sum, i) => sum + (i.daysRestricted || 0), 0);
  const totalDaysTransfer = recordableIncidents.reduce((sum, i) => sum + (i.daysJobTransfer || 0), 0);
  const casesWithDaysAway = recordableIncidents.filter(i => i.daysAway > 0).length;
  const casesWithRestrictions = recordableIncidents.filter(i => i.daysRestricted > 0 || i.daysJobTransfer > 0).length;
  const otherRecordable = recordableIncidents.filter(i => i.isOtherRecordable).length;
  const injuries = recordableIncidents.filter(i => i.incidentType === 'injury').length;
  const illnesses = recordableIncidents.filter(i => i.incidentType === 'illness').length;

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>OSHA Form 300 - Log of Work-Related Injuries and Illnesses</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
            h1 { font-size: 16px; margin-bottom: 5px; }
            h2 { font-size: 12px; margin-bottom: 10px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; font-size: 9px; }
            th { background: #f0f0f0; font-weight: bold; }
            .summary { margin-top: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 10px; }
            .summary-box { border: 1px solid #333; padding: 10px; }
            .summary-box h4 { margin: 0 0 5px 0; font-size: 11px; }
            .summary-box p { margin: 0; font-size: 18px; font-weight: bold; }
            .header-info { margin-bottom: 20px; }
            .footer { margin-top: 30px; font-size: 8px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} | Core Compliance Hub | OSHA Form 300</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            OSHA Form 300 Report
          </h2>
          <p className="text-sm text-muted-foreground">Log of Work-Related Injuries and Illnesses</p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2" data-testid="button-print-osha300">
          <Printer className="w-4 h-4" />
          Print Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-destructive/30">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{totalDeaths}</p>
              <p className="text-xs text-muted-foreground mt-1">Deaths</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{casesWithDaysAway}</p>
              <p className="text-xs text-muted-foreground mt-1">Cases w/ Days Away</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{casesWithRestrictions}</p>
              <p className="text-xs text-muted-foreground mt-1">Cases w/ Restrictions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{otherRecordable}</p>
              <p className="text-xs text-muted-foreground mt-1">Other Recordable</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Days Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Days Away</p>
                <p className="text-2xl font-bold">{totalDaysAway}</p>
              </div>
              <BedDouble className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Restricted Days</p>
                <p className="text-2xl font-bold">{totalDaysRestricted}</p>
              </div>
              <Construction className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transfer Days</p>
                <p className="text-2xl font-bold">{totalDaysTransfer}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Printable Report Content */}
      <div ref={reportRef} className="bg-white p-6 rounded-lg border">
        <div className="header-info mb-6">
          <h1 className="text-xl font-bold">OSHA's Form 300</h1>
          <h2 className="text-sm text-muted-foreground">Log of Work-Related Injuries and Illnesses</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Year: {new Date().getFullYear()} | Recordable Cases: {recordableIncidents.length} | 
            Injuries: {injuries} | Illnesses: {illnesses}
          </p>
        </div>

        {recordableIncidents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Recordable Incidents</h3>
            <p className="text-muted-foreground">No OSHA recordable incidents have been logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[60px]">Case #</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center w-[40px]">Death</TableHead>
                  <TableHead className="text-center w-[50px]">Days Away</TableHead>
                  <TableHead className="text-center w-[50px]">Restricted</TableHead>
                  <TableHead className="text-center w-[50px]">Transfer</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordableIncidents.map((incident, idx) => (
                  <TableRow key={incident.id} className="text-xs" data-testid={`osha300-row-${incident.id}`}>
                    <TableCell className="font-mono">{incident.caseNumber || `${new Date().getFullYear()}-${String(idx + 1).padStart(3, '0')}`}</TableCell>
                    <TableCell>{new Date(incident.incidentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{incident.employeeName || '—'}</TableCell>
                    <TableCell>{incident.jobTitle || '—'}</TableCell>
                    <TableCell>{incident.location || incident.department || '—'}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="line-clamp-2">{incident.description}</span>
                      {incident.bodyPart && <span className="text-muted-foreground block">Body: {incident.bodyPart}</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {incident.resultedInDeath ? <span className="text-destructive font-bold">X</span> : ''}
                    </TableCell>
                    <TableCell className="text-center font-mono">{incident.daysAway || ''}</TableCell>
                    <TableCell className="text-center font-mono">{incident.daysRestricted || ''}</TableCell>
                    <TableCell className="text-center font-mono">{incident.daysJobTransfer || ''}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {incident.incidentType === 'injury' ? 'INJ' : 'ILL'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Section */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-4">Annual Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="border p-3 rounded">
              <p className="text-muted-foreground text-xs">Total Deaths</p>
              <p className="text-xl font-bold">{totalDeaths}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-muted-foreground text-xs">Total Days Away</p>
              <p className="text-xl font-bold">{totalDaysAway}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-muted-foreground text-xs">Total Restricted Days</p>
              <p className="text-xl font-bold">{totalDaysRestricted}</p>
            </div>
            <div className="border p-3 rounded">
              <p className="text-muted-foreground text-xs">Total Transfer Days</p>
              <p className="text-xl font-bold">{totalDaysTransfer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
              Incident Log & OSHA 300
            </h1>
            <p className="text-muted-foreground">Record and track workplace incidents for OSHA 300 compliance</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-log-incident">
            <Plus className="w-4 h-4" />
            Log Incident
          </Button>
        </div>

        {/* Summary Stats */}
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

        {/* Tabs for Incident List and OSHA 300 Report */}
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="incidents" className="gap-2" data-testid="tab-incidents">
              <FileWarning className="w-4 h-4" />
              All Incidents
            </TabsTrigger>
            <TabsTrigger value="osha300" className="gap-2" data-testid="tab-osha300">
              <FileText className="w-4 h-4" />
              OSHA 300 Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incidents">
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
                          <TableHead>Employee</TableHead>
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
                            <TableCell>
                              {incident.employeeName || <span className="text-muted-foreground">—</span>}
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
          </TabsContent>

          <TabsContent value="osha300">
            <OSHA300Report incidents={incidents} />
          </TabsContent>
        </Tabs>

        <IncidentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={(data) => createMutation.mutate(data)}
        />
      </div>
    </ProtectedLayout>
  );
}
