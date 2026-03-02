import { ProtectedLayout } from "@/components/Layout";
import { PlatformGate } from "@/components/PlatformGate";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Users,
  Stethoscope,
  TestTube,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  department: string | null;
  position: string | null;
  hireDate: string | null;
  dotPhysicalDate: string | null;
  dotPhysicalExpiry: string | null;
  dotPhysicalStatus: string | null;
  respiratoryExamDate: string | null;
  respiratoryExamExpiry: string | null;
  respiratoryStatus: string | null;
  fitTestDate: string | null;
  fitTestExpiry: string | null;
  fitTestStatus: string | null;
  hearingTestDate: string | null;
  hearingTestExpiry: string | null;
  hearingTestStatus: string | null;
  pftDate: string | null;
  pftExpiry: string | null;
  pftStatus: string | null;
  tbTestDate: string | null;
  tbTestResult: string | null;
  hepBDose1Date: string | null;
  hepBDose2Date: string | null;
  hepBDose3Date: string | null;
  hepBStatus: string | null;
  hepADose1Date: string | null;
  hepADose2Date: string | null;
  hepAStatus: string | null;
  hepCScreenDate: string | null;
  hepCScreenResult: string | null;
  tetanusDate: string | null;
  tetanusExpiry: string | null;
  visionTestDate: string | null;
  visionTestExpiry: string | null;
  visionTestStatus: string | null;
  lastDrugTest: string | null;
  drugTestResult: string | null;
  randomPoolIncluded: boolean;
};

type EmployeeFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  position: string;
  hireDate: string;
  dotPhysicalDate: string;
  dotPhysicalExpiry: string;
  dotPhysicalStatus: string;
  respiratoryExamDate: string;
  respiratoryExamExpiry: string;
  respiratoryStatus: string;
  fitTestDate: string;
  fitTestExpiry: string;
  fitTestStatus: string;
  hearingTestDate: string;
  hearingTestExpiry: string;
  hearingTestStatus: string;
  pftDate: string;
  pftExpiry: string;
  pftStatus: string;
  tbTestDate: string;
  tbTestResult: string;
  hepBDose1Date: string;
  hepBDose2Date: string;
  hepBDose3Date: string;
  hepBStatus: string;
  hepADose1Date: string;
  hepADose2Date: string;
  hepAStatus: string;
  hepCScreenDate: string;
  hepCScreenResult: string;
  tetanusDate: string;
  tetanusExpiry: string;
  visionTestDate: string;
  visionTestExpiry: string;
  visionTestStatus: string;
  lastDrugTest: string;
  drugTestResult: string;
  randomPoolIncluded: boolean;
};

const defaultFormData: EmployeeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  department: '',
  position: '',
  hireDate: '',
  dotPhysicalDate: '',
  dotPhysicalExpiry: '',
  dotPhysicalStatus: 'pending',
  respiratoryExamDate: '',
  respiratoryExamExpiry: '',
  respiratoryStatus: 'pending',
  fitTestDate: '',
  fitTestExpiry: '',
  fitTestStatus: 'pending',
  hearingTestDate: '',
  hearingTestExpiry: '',
  hearingTestStatus: 'pending',
  pftDate: '',
  pftExpiry: '',
  pftStatus: 'pending',
  tbTestDate: '',
  tbTestResult: 'pending',
  hepBDose1Date: '',
  hepBDose2Date: '',
  hepBDose3Date: '',
  hepBStatus: 'pending',
  hepADose1Date: '',
  hepADose2Date: '',
  hepAStatus: 'pending',
  hepCScreenDate: '',
  hepCScreenResult: 'pending',
  tetanusDate: '',
  tetanusExpiry: '',
  visionTestDate: '',
  visionTestExpiry: '',
  visionTestStatus: 'pending',
  lastDrugTest: '',
  drugTestResult: 'pending',
  randomPoolIncluded: false,
};

function getStatusBadge(status: string | null) {
  switch (status) {
    case 'current':
      return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Current</Badge>;
    case 'expiring':
      return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Expiring</Badge>;
    case 'expired':
      return <Badge className="bg-destructive text-destructive-foreground"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    case 'na':
      return <Badge variant="secondary">N/A</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function getDrugTestBadge(result: string | null) {
  switch (result) {
    case 'cleared':
      return <Badge className="bg-green-500 text-white">Cleared</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    case 'scheduled':
      return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
    case 'failed':
      return <Badge className="bg-destructive text-destructive-foreground">Failed</Badge>;
    default:
      return <Badge variant="outline">--</Badge>;
  }
}

function EmployeeFormDialog({ 
  employee, 
  open, 
  onOpenChange, 
  onSave 
}: { 
  employee?: Employee; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (data: EmployeeFormData) => void;
}) {
  const [formData, setFormData] = useState<EmployeeFormData>(defaultFormData);

  const d = (v: string | null) => v ? v.split('T')[0] : '';

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email || '',
        phoneNumber: employee.phoneNumber || '',
        department: employee.department || '',
        position: employee.position || '',
        hireDate: d(employee.hireDate),
        dotPhysicalDate: d(employee.dotPhysicalDate),
        dotPhysicalExpiry: d(employee.dotPhysicalExpiry),
        dotPhysicalStatus: employee.dotPhysicalStatus || 'pending',
        respiratoryExamDate: d(employee.respiratoryExamDate),
        respiratoryExamExpiry: d(employee.respiratoryExamExpiry),
        respiratoryStatus: employee.respiratoryStatus || 'pending',
        fitTestDate: d(employee.fitTestDate),
        fitTestExpiry: d(employee.fitTestExpiry),
        fitTestStatus: employee.fitTestStatus || 'pending',
        hearingTestDate: d(employee.hearingTestDate),
        hearingTestExpiry: d(employee.hearingTestExpiry),
        hearingTestStatus: employee.hearingTestStatus || 'pending',
        pftDate: d(employee.pftDate),
        pftExpiry: d(employee.pftExpiry),
        pftStatus: employee.pftStatus || 'pending',
        tbTestDate: d(employee.tbTestDate),
        tbTestResult: employee.tbTestResult || 'pending',
        hepBDose1Date: d(employee.hepBDose1Date),
        hepBDose2Date: d(employee.hepBDose2Date),
        hepBDose3Date: d(employee.hepBDose3Date),
        hepBStatus: employee.hepBStatus || 'pending',
        hepADose1Date: d(employee.hepADose1Date),
        hepADose2Date: d(employee.hepADose2Date),
        hepAStatus: employee.hepAStatus || 'pending',
        hepCScreenDate: d(employee.hepCScreenDate),
        hepCScreenResult: employee.hepCScreenResult || 'pending',
        tetanusDate: d(employee.tetanusDate),
        tetanusExpiry: d(employee.tetanusExpiry),
        visionTestDate: d(employee.visionTestDate),
        visionTestExpiry: d(employee.visionTestExpiry),
        visionTestStatus: employee.visionTestStatus || 'pending',
        lastDrugTest: d(employee.lastDrugTest),
        drugTestResult: employee.drugTestResult || 'pending',
        randomPoolIncluded: employee.randomPoolIncluded || false,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number (for SMS)</Label>
              <Input 
                id="phoneNumber"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                data-testid="input-phone-number"
              />
            </div>
            <div>
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input 
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                data-testid="input-hire-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input 
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                data-testid="input-department"
              />
            </div>
            <div>
              <Label htmlFor="position">Position/Title</Label>
              <Input 
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                data-testid="input-position"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              DOT Physical / Medical Surveillance
            </h3>

            {/* DOT Physical */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">DOT Physical</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="dotPhysicalDate">Exam Date</Label>
                  <Input id="dotPhysicalDate" type="date" value={formData.dotPhysicalDate} onChange={(e) => setFormData({...formData, dotPhysicalDate: e.target.value})} data-testid="input-dot-date" />
                </div>
                <div>
                  <Label htmlFor="dotPhysicalExpiry">Expiry Date</Label>
                  <Input id="dotPhysicalExpiry" type="date" value={formData.dotPhysicalExpiry} onChange={(e) => setFormData({...formData, dotPhysicalExpiry: e.target.value})} data-testid="input-dot-expiry" />
                </div>
                <div>
                  <Label htmlFor="dotPhysicalStatus">Status</Label>
                  <Select value={formData.dotPhysicalStatus} onValueChange={(v) => setFormData({...formData, dotPhysicalStatus: v})}>
                    <SelectTrigger data-testid="select-dot-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Respiratory Medical Evaluation */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Respiratory Medical Evaluation (29 CFR 1910.134)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Exam Date</Label>
                  <Input type="date" value={formData.respiratoryExamDate} onChange={(e) => setFormData({...formData, respiratoryExamDate: e.target.value})} data-testid="input-resp-date" />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input type="date" value={formData.respiratoryExamExpiry} onChange={(e) => setFormData({...formData, respiratoryExamExpiry: e.target.value})} data-testid="input-resp-expiry" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.respiratoryStatus} onValueChange={(v) => setFormData({...formData, respiratoryStatus: v})}>
                    <SelectTrigger data-testid="select-resp-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Respirator Fit Test */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Respirator Fit Test — Annual (29 CFR 1910.134)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Test Date</Label>
                  <Input type="date" value={formData.fitTestDate} onChange={(e) => setFormData({...formData, fitTestDate: e.target.value})} data-testid="input-fit-test-date" />
                </div>
                <div>
                  <Label>Next Due</Label>
                  <Input type="date" value={formData.fitTestExpiry} onChange={(e) => setFormData({...formData, fitTestExpiry: e.target.value})} data-testid="input-fit-test-expiry" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.fitTestStatus} onValueChange={(v) => setFormData({...formData, fitTestStatus: v})}>
                    <SelectTrigger data-testid="select-fit-test-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Annual Hearing Test */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Annual Audiometric Exam / Hearing Test (29 CFR 1910.95)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Test Date</Label>
                  <Input type="date" value={formData.hearingTestDate} onChange={(e) => setFormData({...formData, hearingTestDate: e.target.value})} data-testid="input-hearing-date" />
                </div>
                <div>
                  <Label>Next Due</Label>
                  <Input type="date" value={formData.hearingTestExpiry} onChange={(e) => setFormData({...formData, hearingTestExpiry: e.target.value})} data-testid="input-hearing-expiry" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.hearingTestStatus} onValueChange={(v) => setFormData({...formData, hearingTestStatus: v})}>
                    <SelectTrigger data-testid="select-hearing-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* PFT */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pulmonary Function Test (PFT) — Annual</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Test Date</Label>
                  <Input type="date" value={formData.pftDate} onChange={(e) => setFormData({...formData, pftDate: e.target.value})} data-testid="input-pft-date" />
                </div>
                <div>
                  <Label>Next Due</Label>
                  <Input type="date" value={formData.pftExpiry} onChange={(e) => setFormData({...formData, pftExpiry: e.target.value})} data-testid="input-pft-expiry" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.pftStatus} onValueChange={(v) => setFormData({...formData, pftStatus: v})}>
                    <SelectTrigger data-testid="select-pft-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* TB Test */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">TB Test (Tuberculin Skin Test / IGRA)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Test Date</Label>
                  <Input type="date" value={formData.tbTestDate} onChange={(e) => setFormData({...formData, tbTestDate: e.target.value})} data-testid="input-tb-date" />
                </div>
                <div>
                  <Label>Result</Label>
                  <Select value={formData.tbTestResult} onValueChange={(v) => setFormData({...formData, tbTestResult: v})}>
                    <SelectTrigger data-testid="select-tb-result"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Hepatitis B */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hepatitis B Vaccine Series — 3 Doses: Day 0 / 1 Month / 6 Months (29 CFR 1910.1030)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dose 1 Date (Day 0)</Label>
                  <Input type="date" value={formData.hepBDose1Date} onChange={(e) => setFormData({...formData, hepBDose1Date: e.target.value})} data-testid="input-hepb-dose1" />
                </div>
                <div>
                  <Label>Dose 2 Date (~1 month)</Label>
                  <Input type="date" value={formData.hepBDose2Date} onChange={(e) => setFormData({...formData, hepBDose2Date: e.target.value})} data-testid="input-hepb-dose2" />
                </div>
                <div>
                  <Label>Dose 3 Date (~6 months)</Label>
                  <Input type="date" value={formData.hepBDose3Date} onChange={(e) => setFormData({...formData, hepBDose3Date: e.target.value})} data-testid="input-hepb-dose3" />
                </div>
                <div>
                  <Label>Series Status</Label>
                  <Select value={formData.hepBStatus} onValueChange={(v) => setFormData({...formData, hepBStatus: v})}>
                    <SelectTrigger data-testid="select-hepb-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="series_complete">Series Complete</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="immune">Immune (Lab Confirmed)</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Hepatitis A */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hepatitis A Vaccine — 2 Doses: Day 0 / 6–12 Months</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Dose 1 Date</Label>
                  <Input type="date" value={formData.hepADose1Date} onChange={(e) => setFormData({...formData, hepADose1Date: e.target.value})} data-testid="input-hepa-dose1" />
                </div>
                <div>
                  <Label>Dose 2 Date</Label>
                  <Input type="date" value={formData.hepADose2Date} onChange={(e) => setFormData({...formData, hepADose2Date: e.target.value})} data-testid="input-hepa-dose2" />
                </div>
                <div>
                  <Label>Series Status</Label>
                  <Select value={formData.hepAStatus} onValueChange={(v) => setFormData({...formData, hepAStatus: v})}>
                    <SelectTrigger data-testid="select-hepa-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="series_complete">Series Complete</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Hepatitis C */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hepatitis C Screening</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Screen Date</Label>
                  <Input type="date" value={formData.hepCScreenDate} onChange={(e) => setFormData({...formData, hepCScreenDate: e.target.value})} data-testid="input-hepc-date" />
                </div>
                <div>
                  <Label>Result</Label>
                  <Select value={formData.hepCScreenResult} onValueChange={(v) => setFormData({...formData, hepCScreenResult: v})}>
                    <SelectTrigger data-testid="select-hepc-result"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tetanus / Tdap */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tetanus / Tdap (Every 10 Years)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Last Dose Date</Label>
                  <Input type="date" value={formData.tetanusDate} onChange={(e) => setFormData({...formData, tetanusDate: e.target.value})} data-testid="input-tetanus-date" />
                </div>
                <div>
                  <Label>Next Due</Label>
                  <Input type="date" value={formData.tetanusExpiry} onChange={(e) => setFormData({...formData, tetanusExpiry: e.target.value})} data-testid="input-tetanus-expiry" />
                </div>
              </div>
            </div>

            {/* Vision Test */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Vision Test</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Test Date</Label>
                  <Input type="date" value={formData.visionTestDate} onChange={(e) => setFormData({...formData, visionTestDate: e.target.value})} data-testid="input-vision-date" />
                </div>
                <div>
                  <Label>Next Due</Label>
                  <Input type="date" value={formData.visionTestExpiry} onChange={(e) => setFormData({...formData, visionTestExpiry: e.target.value})} data-testid="input-vision-expiry" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.visionTestStatus} onValueChange={(v) => setFormData({...formData, visionTestStatus: v})}>
                    <SelectTrigger data-testid="select-vision-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <TestTube className="w-4 h-4 text-accent" />
              Drug & Alcohol Testing
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lastDrugTest">Last Drug Test</Label>
                <Input 
                  id="lastDrugTest"
                  type="date"
                  value={formData.lastDrugTest}
                  onChange={(e) => setFormData({...formData, lastDrugTest: e.target.value})}
                  data-testid="input-drug-test-date"
                />
              </div>
              <div>
                <Label htmlFor="drugTestResult">Test Result</Label>
                <Select 
                  value={formData.drugTestResult} 
                  onValueChange={(v) => setFormData({...formData, drugTestResult: v})}
                >
                  <SelectTrigger data-testid="select-drug-result">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="pending">Pending Results</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formData.randomPoolIncluded}
                    onChange={(e) => setFormData({...formData, randomPoolIncluded: e.target.checked})}
                    className="w-4 h-4"
                    data-testid="checkbox-random-pool"
                  />
                  <span className="text-sm">Include in Random Pool</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-employee">
              {employee ? 'Save Changes' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Employees() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      return apiRequest('POST', '/api/employees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      setDialogOpen(false);
      toast({ title: "Employee Added", description: "Employee has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add employee.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EmployeeFormData }) => {
      return apiRequest('PATCH', `/api/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      setDialogOpen(false);
      setEditingEmployee(undefined);
      toast({ title: "Employee Updated", description: "Employee has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update employee.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      toast({ title: "Employee Deleted", description: "Employee has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete employee.", variant: "destructive" });
    },
  });

  const handleSave = (data: EmployeeFormData) => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(undefined);
    setDialogOpen(true);
  };

  return (
    <PlatformGate featureName="Employee Management">
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Users className="w-6 h-6" />
              Employee Management
            </h1>
            <p className="text-muted-foreground">Track DOT physicals, drug tests, and medical surveillance for your workforce</p>
          </div>
          <Button onClick={handleAdd} className="gap-2" data-testid="button-add-employee">
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Roster</CardTitle>
            <CardDescription>
              {employees.length} employee{employees.length !== 1 ? 's' : ''} tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Employees Yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding your first employee to track their compliance status.</p>
                <Button onClick={handleAdd} className="gap-2" data-testid="button-add-first-employee">
                  <Plus className="w-4 h-4" />
                  Add First Employee
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>DOT Physical</TableHead>
                      <TableHead>Respiratory</TableHead>
                      <TableHead>Drug Test</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id} data-testid={`employee-row-${emp.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                            {emp.email && <p className="text-xs text-muted-foreground">{emp.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{emp.department || '--'}</p>
                            {emp.position && <p className="text-xs text-muted-foreground">{emp.position}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(emp.dotPhysicalStatus)}
                          {emp.dotPhysicalExpiry && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Exp: {new Date(emp.dotPhysicalExpiry).toLocaleDateString()}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(emp.respiratoryStatus)}
                        </TableCell>
                        <TableCell>
                          {getDrugTestBadge(emp.drugTestResult)}
                          {emp.lastDrugTest && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(emp.lastDrugTest).toLocaleDateString()}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleEdit(emp)}
                              data-testid={`button-edit-${emp.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(emp.id)}
                              data-testid={`button-delete-${emp.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <EmployeeFormDialog
          employee={editingEmployee}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingEmployee(undefined);
          }}
          onSave={handleSave}
        />
      </div>
    </ProtectedLayout>
    </PlatformGate>
  );
}
