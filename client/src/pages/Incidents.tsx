import { ProtectedLayout } from "@/components/Layout";
import { PlatformGate } from "@/components/PlatformGate";
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
  Stethoscope,
  ShieldCheck,
  Target,
  Users,
  Search,
  Trash2,
  Edit,
  Eye,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Bot,
  RefreshCw,
  X,
  Mail,
  Building2,
  Phone,
  DollarSign,
  MapPin,
  Briefcase,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Hospital
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

// ── Standardized OSHA-aligned dropdown options ──────────────────────────────
const BODY_PARTS = [
  "Head / Scalp", "Eye(s)", "Ear(s)", "Face / Nose / Mouth", "Neck / Throat",
  "Shoulder", "Upper Arm / Elbow", "Forearm / Lower Arm", "Wrist",
  "Hand / Palm", "Finger(s) / Thumb", "Chest / Ribs",
  "Upper Back / Spine", "Lower Back / Spine", "Abdomen",
  "Hip / Pelvis", "Thigh / Upper Leg", "Knee",
  "Lower Leg / Shin / Calf", "Ankle", "Foot / Heel", "Toe(s)",
  "Multiple Body Parts", "Body System (Respiratory/Circulatory)", "Other",
];

const INJURY_TYPES = [
  "Strain / Sprain", "Laceration / Cut", "Puncture / Bite",
  "Contusion / Bruise", "Fracture / Break", "Abrasion / Scrape",
  "Burn (Thermal)", "Burn (Chemical)", "Amputation",
  "Crush / Compression Injury", "Concussion / Head Trauma", "Dislocation",
  "Electrical Shock", "Heat-related Illness", "Cold-related Illness / Frostbite",
  "Hearing Loss (Standard Threshold Shift)", "Respiratory Illness / Inhalation",
  "Dermatitis / Skin Condition", "Eye Injury / Irritation",
  "Chemical Exposure / Poisoning", "Ergonomic / Repetitive Motion",
  "Infectious Disease", "Near Miss – No Physical Injury", "Other",
];

const WORK_AREAS = [
  "Production Floor", "Assembly Line / Work Cell",
  "Warehouse / Stockroom", "Shipping / Receiving", "Loading Dock",
  "Maintenance / Tool Crib", "Welding / Fabrication", "Paint / Finishing",
  "Quality / Lab / Testing", "Office / Administrative",
  "Cafeteria / Break Room", "Restroom / Locker Room",
  "Parking Lot / Entrance", "Yard / Outdoor Area",
  "Rooftop / Elevated Work Area", "Construction Zone",
  "Client / Customer Site", "Vehicle / In-Transit", "Other",
];

const OBJECTS_SOURCES = [
  "Hand Tool (Wrench, Hammer, etc.)", "Power Tool (Drill, Grinder, Saw, etc.)",
  "Machinery / Equipment", "Vehicle / Forklift / PIT Equipment",
  "Chemical / Hazardous Substance", "Falling / Flying Object",
  "Floor / Ground (Slip, Trip, Fall)", "Ladder / Scaffolding / Platform",
  "Container / Bin / Packaging", "Sharp Object / Edge",
  "Hot Surface / Steam / Flame", "Electrical Equipment / Wiring",
  "Material / Product Being Handled", "Body Motion / Overexertion",
  "Coworker / Another Person", "Animal / Insect",
  "PPE Failure or Absence", "Environmental Condition", "Other",
];

type CorrectiveAction = {
  id: number;
  incidentId: number | null;
  title: string;
  problemStatement: string;
  rootCause: string | null;
  immediateActions: string | null;
  correctiveActions: string | null;
  preventiveActions: string | null;
  responsiblePerson: string | null;
  responsiblePhone: string | null;
  responsibleDepartment: string | null;
  targetDate: string | null;
  completionDate: string | null;
  verificationMethod: string | null;
  verificationDate: string | null;
  verificationNotes: string | null;
  effectivenessResult: string | null;
  priority: string;
  status: string;
  createdAt: string;
};

type CAPAFormData = {
  incidentId: number | null;
  title: string;
  problemStatement: string;
  rootCause: string;
  immediateActions: string;
  correctiveActions: string;
  preventiveActions: string;
  responsiblePerson: string;
  responsiblePhone: string;
  responsibleEmail: string;
  responsibleDepartment: string;
  targetDate: string;
  verificationMethod: string;
  priority: string;
  status: string;
};

const defaultCAPAFormData: CAPAFormData = {
  incidentId: null,
  title: '',
  problemStatement: '',
  rootCause: '',
  immediateActions: '',
  correctiveActions: '',
  preventiveActions: '',
  responsiblePerson: '',
  responsiblePhone: '',
  responsibleEmail: '',
  responsibleDepartment: '',
  targetDate: '',
  verificationMethod: '',
  priority: 'medium',
  status: 'open',
};

type Incident = {
  id: number;
  caseNumber: string | null;
  incidentDate: string;
  description: string;
  incidentType: string;
  facility: string | null;
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
  // Basic / OSHA 300
  incidentDate: string;
  description: string;
  incidentType: string;
  facility: string;
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
  // FROI — Employee Personal
  employeeSsnLast4: string;
  employeeDob: string;
  employeeSex: string;
  employeePhone: string;
  employeeAddress: string;
  employeeHireDate: string;
  employeeDependents: string;
  employeeTaxStatus: string;
  // FROI — Wage & Employment
  grossWeeklyWage: string;
  weeksWorked: string;
  fringeBenefitsValue: string;
  isVolunteer: boolean;
  isVocationallyHandicapped: boolean;
  // FROI — Employer / Insurance
  fein: string;
  uiNumber: string;
  sicNaicsCode: string;
  insuranceCompany: string;
  insurancePhone: string;
  policyNumber: string;
  tpaName: string;
  // FROI — Timing & Location
  timeWorkBegan: string;
  timeOfEvent: string;
  injuryCity: string;
  injuryState: string;
  injuryCounty: string;
  onEmployerPremises: boolean;
  whatEmployeeWasDoing: string;
  howInjuryOccurred: string;
  // FROI — Medical
  physicianName: string;
  treatmentFacility: string;
  treatedInEr: boolean;
  hospitalizedOvernight: boolean;
  treatmentAddress: string;
  // FROI — Key Dates
  lastDayWorked: string;
  firstDayMissed: string;
  returnToWorkDate: string;
  deathDate: string;
  dateEmployerNotified: string;
};

const defaultFormData: IncidentFormData = {
  incidentDate: new Date().toISOString().split('T')[0],
  description: '',
  incidentType: 'injury',
  facility: '',
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
  employeeSsnLast4: '',
  employeeDob: '',
  employeeSex: '',
  employeePhone: '',
  employeeAddress: '',
  employeeHireDate: '',
  employeeDependents: '',
  employeeTaxStatus: '',
  grossWeeklyWage: '',
  weeksWorked: '',
  fringeBenefitsValue: '',
  isVolunteer: false,
  isVocationallyHandicapped: false,
  fein: '',
  uiNumber: '',
  sicNaicsCode: '',
  insuranceCompany: '',
  insurancePhone: '',
  policyNumber: '',
  tpaName: '',
  timeWorkBegan: '',
  timeOfEvent: '',
  injuryCity: '',
  injuryState: '',
  injuryCounty: '',
  onEmployerPremises: true,
  whatEmployeeWasDoing: '',
  howInjuryOccurred: '',
  physicianName: '',
  treatmentFacility: '',
  treatedInEr: false,
  hospitalizedOvernight: false,
  treatmentAddress: '',
  lastDayWorked: '',
  firstDayMissed: '',
  returnToWorkDate: '',
  deathDate: '',
  dateEmployerNotified: '',
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

const FROI_TABS = [
  { id: "incident",  label: "Incident",        icon: AlertTriangle },
  { id: "employee",  label: "Employee",         icon: UserCheck },
  { id: "details",   label: "Incident Details", icon: ClipboardList },
  { id: "medical",   label: "Medical & Dates",  icon: Hospital },
  { id: "osha",      label: "OSHA / WC",        icon: ShieldCheck },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b pb-1.5">
      {children}
    </h3>
  );
}

function IncidentFormDialog({ 
  open, 
  onOpenChange, 
  onSave,
  initialRecordable = false,
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (data: IncidentFormData) => void;
  initialRecordable?: boolean;
}) {
  const [formData, setFormData] = useState<IncidentFormData>({ ...defaultFormData, isRecordable: initialRecordable });
  const [activeTab, setActiveTab] = useState("incident");

  useEffect(() => {
    if (open) {
      setFormData({ ...defaultFormData, isRecordable: initialRecordable });
      setActiveTab("incident");
    }
  }, [open, initialRecordable]);

  const set = (fields: Partial<IncidentFormData>) => setFormData(prev => ({ ...prev, ...fields }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const tabIdx = FROI_TABS.findIndex(t => t.id === activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="w-5 h-5 text-accent" />
            First Report of Injury / OSHA 300 Incident Report
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Complete all sections for a full Workers' Comp FROI submission</p>
        </div>

        {/* Tab navigation */}
        <div className="border-b bg-muted/30">
          <div className="flex overflow-x-auto">
            {FROI_TABS.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-accent text-accent bg-white"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/60"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                    isActive ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                  }`}>{i + 1}</span>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ── TAB 1: Incident ─────────────────────────────────────────── */}
            {activeTab === "incident" && (
              <div className="space-y-5">
                <SectionLabel><AlertTriangle className="w-3.5 h-3.5" /> Basic Incident Information</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incidentDate">Date of Injury / Illness *</Label>
                    <Input id="incidentDate" type="date" value={formData.incidentDate}
                      onChange={e => set({ incidentDate: e.target.value })} required data-testid="input-incident-date" />
                  </div>
                  <div>
                    <Label htmlFor="incidentType">Incident Type *</Label>
                    <Select value={formData.incidentType} onValueChange={v => set({ incidentType: v })}>
                      <SelectTrigger data-testid="select-incident-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="injury">Injury</SelectItem>
                        <SelectItem value="illness">Illness</SelectItem>
                        <SelectItem value="near_miss">Near Miss</SelectItem>
                        <SelectItem value="property_damage">Property Damage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeWorkBegan">Time Employee Began Work</Label>
                    <Input id="timeWorkBegan" type="time" value={formData.timeWorkBegan}
                      onChange={e => set({ timeWorkBegan: e.target.value })} data-testid="input-time-work-began" />
                  </div>
                  <div>
                    <Label htmlFor="timeOfEvent">Time of Incident / Event</Label>
                    <Input id="timeOfEvent" type="time" value={formData.timeOfEvent}
                      onChange={e => set({ timeOfEvent: e.target.value })} data-testid="input-time-of-event" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="facility">Facility / Site Name</Label>
                  <Input id="facility" value={formData.facility}
                    onChange={e => set({ facility: e.target.value })}
                    placeholder="e.g., Plant 1 – Detroit, Warehouse North, Corporate Office"
                    data-testid="input-facility" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="injuryCity">City of Incident</Label>
                    <Input id="injuryCity" value={formData.injuryCity}
                      onChange={e => set({ injuryCity: e.target.value })} placeholder="City" data-testid="input-injury-city" />
                  </div>
                  <div>
                    <Label htmlFor="injuryState">State</Label>
                    <Input id="injuryState" value={formData.injuryState}
                      onChange={e => set({ injuryState: e.target.value })} placeholder="e.g., MI" maxLength={2} data-testid="input-injury-state" />
                  </div>
                  <div>
                    <Label htmlFor="injuryCounty">County</Label>
                    <Input id="injuryCounty" value={formData.injuryCounty}
                      onChange={e => set({ injuryCounty: e.target.value })} placeholder="County" data-testid="input-injury-county" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Work Area / Location</Label>
                  <Select value={formData.location} onValueChange={v => set({ location: v })}>
                    <SelectTrigger data-testid="select-location"><SelectValue placeholder="Select work area..." /></SelectTrigger>
                    <SelectContent>{WORK_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="onEmployerPremises" checked={formData.onEmployerPremises}
                    onChange={e => set({ onEmployerPremises: e.target.checked })}
                    className="w-4 h-4" data-testid="checkbox-on-premises" />
                  <Label htmlFor="onEmployerPremises" className="cursor-pointer">Incident occurred on employer premises</Label>
                </div>
              </div>
            )}

            {/* ── TAB 2: Employee ─────────────────────────────────────────── */}
            {activeTab === "employee" && (
              <div className="space-y-5">
                <SectionLabel><UserCheck className="w-3.5 h-3.5" /> Employee Personal Data</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="empName">Employee Full Name</Label>
                    <Input id="empName" value={formData.employeeName}
                      onChange={e => set({ employeeName: e.target.value })}
                      placeholder="Last, First MI" data-testid="input-employee-name" />
                  </div>
                  <div>
                    <Label htmlFor="empSsn">SSN — Last 4 Digits</Label>
                    <Input id="empSsn" value={formData.employeeSsnLast4}
                      onChange={e => set({ employeeSsnLast4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      placeholder="XXXX" maxLength={4} data-testid="input-ssn-last4" />
                  </div>
                  <div>
                    <Label htmlFor="empDob">Date of Birth</Label>
                    <Input id="empDob" type="date" value={formData.employeeDob}
                      onChange={e => set({ employeeDob: e.target.value })} data-testid="input-employee-dob" />
                  </div>
                  <div>
                    <Label htmlFor="empSex">Sex</Label>
                    <Select value={formData.employeeSex} onValueChange={v => set({ employeeSex: v })}>
                      <SelectTrigger data-testid="select-employee-sex"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="empPhone">Phone Number</Label>
                    <Input id="empPhone" value={formData.employeePhone}
                      onChange={e => set({ employeePhone: e.target.value })} placeholder="(555) 000-0000" data-testid="input-employee-phone" />
                  </div>
                  <div>
                    <Label htmlFor="empDependents">Number of Dependents</Label>
                    <Input id="empDependents" type="number" min="0" value={formData.employeeDependents}
                      onChange={e => set({ employeeDependents: e.target.value })} data-testid="input-employee-dependents" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="empAddress">Home Address</Label>
                  <Input id="empAddress" value={formData.employeeAddress}
                    onChange={e => set({ employeeAddress: e.target.value })}
                    placeholder="Street, City, State, ZIP" data-testid="input-employee-address" />
                </div>
                <div>
                  <Label htmlFor="empTaxStatus">Tax Filing Status</Label>
                  <Select value={formData.employeeTaxStatus} onValueChange={v => set({ employeeTaxStatus: v })}>
                    <SelectTrigger data-testid="select-tax-status"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="head_of_household">Head of Household</SelectItem>
                      <SelectItem value="married_joint">Married Filing Joint</SelectItem>
                      <SelectItem value="married_separate">Married Filing Separate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <SectionLabel><Briefcase className="w-3.5 h-3.5" /> Employment Details</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="empHireDate">Date of Hire</Label>
                    <Input id="empHireDate" type="date" value={formData.employeeHireDate}
                      onChange={e => set({ employeeHireDate: e.target.value })} data-testid="input-hire-date" />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title / Occupation</Label>
                    <Input id="jobTitle" value={formData.jobTitle}
                      onChange={e => set({ jobTitle: e.target.value })} placeholder="e.g., Forklift Operator" data-testid="input-job-title" />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" value={formData.department}
                      onChange={e => set({ department: e.target.value })} placeholder="e.g., Warehouse" data-testid="input-department" />
                  </div>
                  <div>
                    <Label htmlFor="dateEmployerNotified">Date Employer Was Notified</Label>
                    <Input id="dateEmployerNotified" type="date" value={formData.dateEmployerNotified}
                      onChange={e => set({ dateEmployerNotified: e.target.value })} data-testid="input-employer-notified-date" />
                  </div>
                </div>
                <SectionLabel><DollarSign className="w-3.5 h-3.5" /> Wage Information</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grossWeeklyWage">Total Gross Weekly Wage (highest 39 of last 52 wks)</Label>
                    <Input id="grossWeeklyWage" value={formData.grossWeeklyWage}
                      onChange={e => set({ grossWeeklyWage: e.target.value })} placeholder="$0.00" data-testid="input-gross-weekly-wage" />
                  </div>
                  <div>
                    <Label htmlFor="weeksWorked">Number of Weeks Used</Label>
                    <Input id="weeksWorked" type="number" min="0" max="52" value={formData.weeksWorked}
                      onChange={e => set({ weeksWorked: e.target.value })} data-testid="input-weeks-worked" />
                  </div>
                  <div>
                    <Label htmlFor="fringeBenefitsValue">Value of Discontinued Fringe Benefits</Label>
                    <Input id="fringeBenefitsValue" value={formData.fringeBenefitsValue}
                      onChange={e => set({ fringeBenefitsValue: e.target.value })} placeholder="$0.00" data-testid="input-fringe-benefits" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isVolunteer}
                      onChange={e => set({ isVolunteer: e.target.checked })} className="w-4 h-4" data-testid="checkbox-volunteer" />
                    <span className="text-sm">Employee is a volunteer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isVocationallyHandicapped}
                      onChange={e => set({ isVocationallyHandicapped: e.target.checked })} className="w-4 h-4" data-testid="checkbox-voc-handicapped" />
                    <span className="text-sm">Certified as vocationally handicapped</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── TAB 3: Incident Details ──────────────────────────────────── */}
            {activeTab === "details" && (
              <div className="space-y-5">
                <SectionLabel><ClipboardList className="w-3.5 h-3.5" /> Injury / Illness Details</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bodyPart">Body Part Affected</Label>
                    <Select value={formData.bodyPart} onValueChange={v => set({ bodyPart: v })}>
                      <SelectTrigger data-testid="select-body-part"><SelectValue placeholder="Select body part..." /></SelectTrigger>
                      <SelectContent>{BODY_PARTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="natureOfInjury">Nature of Injury / Illness</Label>
                    <Select value={formData.natureOfInjury} onValueChange={v => set({ natureOfInjury: v })}>
                      <SelectTrigger data-testid="select-nature-injury"><SelectValue placeholder="Select injury type..." /></SelectTrigger>
                      <SelectContent>{INJURY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="objectOrSubstance">Object / Substance That Directly Harmed the Employee</Label>
                  <Select value={formData.objectOrSubstance} onValueChange={v => set({ objectOrSubstance: v })}>
                    <SelectTrigger data-testid="select-object-substance"><SelectValue placeholder="Select source of harm..." /></SelectTrigger>
                    <SelectContent>{OBJECTS_SOURCES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="whatEmployeeWasDoing">What was the employee doing just before the incident?</Label>
                  <p className="text-xs text-muted-foreground mb-1">Describe the activity, tools, and materials in use</p>
                  <Textarea id="whatEmployeeWasDoing" value={formData.whatEmployeeWasDoing}
                    onChange={e => set({ whatEmployeeWasDoing: e.target.value })}
                    placeholder="e.g., Operating a stand-up reach forklift to place pallets on racking in Aisle 7..."
                    rows={3} data-testid="input-what-doing" />
                </div>
                <div>
                  <Label htmlFor="howInjuryOccurred">How did the injury occur? *</Label>
                  <p className="text-xs text-muted-foreground mb-1">Step-by-step account of the event sequence</p>
                  <Textarea id="howInjuryOccurred" value={formData.howInjuryOccurred}
                    onChange={e => set({ howInjuryOccurred: e.target.value })}
                    placeholder="e.g., While lowering the forks, the employee's left hand contacted the racking beam..."
                    rows={3} required data-testid="input-how-occurred" />
                </div>
                <div>
                  <Label htmlFor="description">Additional Notes / Description</Label>
                  <Textarea id="description" value={formData.description}
                    onChange={e => set({ description: e.target.value })}
                    placeholder="Any additional details, contributing factors, or supervisor observations..."
                    rows={2} data-testid="input-description" />
                </div>
              </div>
            )}

            {/* ── TAB 4: Medical & Dates ──────────────────────────────────── */}
            {activeTab === "medical" && (
              <div className="space-y-5">
                <SectionLabel><Hospital className="w-3.5 h-3.5" /> Medical Treatment</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="physicianName">Treating Physician / Healthcare Professional</Label>
                    <Input id="physicianName" value={formData.physicianName}
                      onChange={e => set({ physicianName: e.target.value })} placeholder="Dr. Jane Smith" data-testid="input-physician-name" />
                  </div>
                  <div>
                    <Label htmlFor="treatmentFacility">Clinic / Hospital / Treatment Facility</Label>
                    <Input id="treatmentFacility" value={formData.treatmentFacility}
                      onChange={e => set({ treatmentFacility: e.target.value })} placeholder="e.g., OccuHealth Clinic" data-testid="input-treatment-facility" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="treatmentAddress">Treatment Location Address (if away from worksite)</Label>
                  <Input id="treatmentAddress" value={formData.treatmentAddress}
                    onChange={e => set({ treatmentAddress: e.target.value })}
                    placeholder="Street, City, State, ZIP" data-testid="input-treatment-address" />
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.treatedInEr}
                      onChange={e => set({ treatedInEr: e.target.checked })} className="w-4 h-4" data-testid="checkbox-treated-er" />
                    <span className="text-sm">Treated in Emergency Room</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.hospitalizedOvernight}
                      onChange={e => set({ hospitalizedOvernight: e.target.checked })} className="w-4 h-4" data-testid="checkbox-hospitalized" />
                    <span className="text-sm">Hospitalized overnight (inpatient)</span>
                  </label>
                </div>
                <SectionLabel><Calendar className="w-3.5 h-3.5" /> Key Dates</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastDayWorked">Last Day Worked</Label>
                    <Input id="lastDayWorked" type="date" value={formData.lastDayWorked}
                      onChange={e => set({ lastDayWorked: e.target.value })} data-testid="input-last-day-worked" />
                  </div>
                  <div>
                    <Label htmlFor="firstDayMissed">First Day Missed / Away from Work</Label>
                    <Input id="firstDayMissed" type="date" value={formData.firstDayMissed}
                      onChange={e => set({ firstDayMissed: e.target.value })} data-testid="input-first-day-missed" />
                  </div>
                  <div>
                    <Label htmlFor="returnToWorkDate">Return-to-Work Date (if known)</Label>
                    <Input id="returnToWorkDate" type="date" value={formData.returnToWorkDate}
                      onChange={e => set({ returnToWorkDate: e.target.value })} data-testid="input-rtw-date" />
                  </div>
                  <div>
                    <Label htmlFor="deathDate">Date of Death (if applicable)</Label>
                    <Input id="deathDate" type="date" value={formData.deathDate}
                      onChange={e => set({ deathDate: e.target.value })} data-testid="input-death-date" />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: OSHA & Workers' Comp ─────────────────────────────── */}
            {activeTab === "osha" && (
              <div className="space-y-5">
                <SectionLabel><ShieldCheck className="w-3.5 h-3.5" /> OSHA 300 Classification</SectionLabel>
                <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isRecordable}
                      onChange={e => set({ isRecordable: e.target.checked })} className="w-4 h-4" data-testid="checkbox-recordable" />
                    <span className="font-medium text-sm">This is an OSHA recordable incident</span>
                  </label>
                  {formData.isRecordable && (
                    <div className="space-y-4 pl-4 border-l-2 border-destructive/30">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.resultedInDeath}
                            onChange={e => set({ resultedInDeath: e.target.checked })} className="w-4 h-4" data-testid="checkbox-death" />
                          <span className="text-sm flex items-center gap-1"><Skull className="w-4 h-4 text-destructive" />Resulted in Death</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.isOtherRecordable}
                            onChange={e => set({ isOtherRecordable: e.target.checked })} className="w-4 h-4" data-testid="checkbox-other-recordable" />
                          <span className="text-sm flex items-center gap-1"><Stethoscope className="w-4 h-4 text-orange-500" />Other Recordable Case</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><BedDouble className="w-3 h-3" />Days Away From Work</Label>
                          <Input type="number" min="0" value={formData.daysAway}
                            onChange={e => set({ daysAway: parseInt(e.target.value) || 0 })} data-testid="input-days-away" />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><Construction className="w-3 h-3" />Days Restricted Duty</Label>
                          <Input type="number" min="0" value={formData.daysRestricted}
                            onChange={e => set({ daysRestricted: parseInt(e.target.value) || 0 })} data-testid="input-days-restricted" />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1 text-xs"><ClipboardList className="w-3 h-3" />Days Job Transfer</Label>
                          <Input type="number" min="0" value={formData.daysJobTransfer}
                            onChange={e => set({ daysJobTransfer: parseInt(e.target.value) || 0 })} data-testid="input-days-transfer" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <SectionLabel><Building2 className="w-3.5 h-3.5" /> Employer / Carrier / TPA Information</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fein">Federal Employer ID (FEIN)</Label>
                    <Input id="fein" value={formData.fein}
                      onChange={e => set({ fein: e.target.value })} placeholder="XX-XXXXXXX" data-testid="input-fein" />
                  </div>
                  <div>
                    <Label htmlFor="uiNumber">UI (Unemployment Insurance) Number</Label>
                    <Input id="uiNumber" value={formData.uiNumber}
                      onChange={e => set({ uiNumber: e.target.value })} data-testid="input-ui-number" />
                  </div>
                  <div>
                    <Label htmlFor="sicNaicsCode">SIC / NAICS Code</Label>
                    <Input id="sicNaicsCode" value={formData.sicNaicsCode}
                      onChange={e => set({ sicNaicsCode: e.target.value })} placeholder="e.g., 3599 or 336390" data-testid="input-sic-naics" />
                  </div>
                  <div>
                    <Label htmlFor="insuranceCompany">Insurance Company Name</Label>
                    <Input id="insuranceCompany" value={formData.insuranceCompany}
                      onChange={e => set({ insuranceCompany: e.target.value })} data-testid="input-insurance-company" />
                  </div>
                  <div>
                    <Label htmlFor="insurancePhone">Insurance Company Phone</Label>
                    <Input id="insurancePhone" value={formData.insurancePhone}
                      onChange={e => set({ insurancePhone: e.target.value })} placeholder="(555) 000-0000" data-testid="input-insurance-phone" />
                  </div>
                  <div>
                    <Label htmlFor="policyNumber">Policy Number</Label>
                    <Input id="policyNumber" value={formData.policyNumber}
                      onChange={e => set({ policyNumber: e.target.value })} data-testid="input-policy-number" />
                  </div>
                  <div>
                    <Label htmlFor="tpaName">Third-Party Administrator (TPA) Name</Label>
                    <Input id="tpaName" value={formData.tpaName}
                      onChange={e => set({ tpaName: e.target.value })} data-testid="input-tpa-name" />
                  </div>
                </div>

                <SectionLabel><ClipboardList className="w-3.5 h-3.5" /> Review Status</SectionLabel>
                <Select value={formData.status} onValueChange={v => set({ status: v })}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Footer with prev/next + save */}
          <div className="border-t px-6 py-3 flex items-center justify-between bg-white">
            <Button type="button" variant="outline" size="sm"
              onClick={() => tabIdx > 0 && setActiveTab(FROI_TABS[tabIdx - 1].id)}
              disabled={tabIdx === 0} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <span className="text-xs text-muted-foreground">Section {tabIdx + 1} of {FROI_TABS.length}</span>
            {tabIdx < FROI_TABS.length - 1 ? (
              <Button type="button" size="sm"
                onClick={() => setActiveTab(FROI_TABS[tabIdx + 1].id)}
                className="gap-1 bg-accent hover:bg-accent/90 text-white">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" size="sm" data-testid="button-save-incident" className="bg-accent hover:bg-accent/90 text-white">
                  Log Incident
                </Button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OSHA300Report({ incidents }: { incidents: Incident[] }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [drillDown, setDrillDown] = useState<string | null>(null);

  const { data: companyProfile } = useQuery<any>({ queryKey: ['/api/company-profile'] });

  // Collect unique named facilities for the filter
  const facilities = Array.from(
    new Set(incidents.map(i => i.facility?.trim()).filter(Boolean) as string[])
  ).sort();

  const filteredIncidents = selectedFacility === 'all'
    ? incidents
    : incidents.filter(i => i.facility?.trim() === selectedFacility);

  const recordableIncidents = filteredIncidents.filter(i => i.isRecordable);

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            OSHA Form 300 Report
          </h2>
          <p className="text-sm text-muted-foreground">Log of Work-Related Injuries and Illnesses</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {facilities.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="osha-facility-filter" className="text-sm whitespace-nowrap">Facility:</Label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger id="osha-facility-filter" className="w-52" data-testid="select-osha-facility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {facilities.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handlePrint} variant="outline" className="gap-2" data-testid="button-print-osha300">
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Summary Cards — clickable drill-down */}
      {(() => {
        const toggle = (key: string) => setDrillDown(prev => prev === key ? null : key);
        const cardBase = "cursor-pointer transition-all hover:shadow-md hover:ring-2";

        const drillDownMap: Record<string, { label: string; list: Incident[]; detail?: (i: Incident) => string }> = {
          deaths:        { label: "Deaths",                        list: recordableIncidents.filter(i => i.resultedInDeath),                                                   detail: () => "Fatal injury" },
          days_away:     { label: "Cases with Days Away",          list: recordableIncidents.filter(i => (i.daysAway || 0) > 0),                                              detail: i => `${i.daysAway} day(s) away from work` },
          restrictions:  { label: "Cases with Restrictions/Transfer", list: recordableIncidents.filter(i => (i.daysRestricted || 0) > 0 || (i.daysJobTransfer || 0) > 0),   detail: i => `${i.daysRestricted || 0}d restricted · ${i.daysJobTransfer || 0}d transfer` },
          other:         { label: "Other Recordable Cases",        list: recordableIncidents.filter(i => i.isOtherRecordable),                                               detail: () => "Other recordable" },
          total_away:    { label: "Total Days Away from Work",     list: recordableIncidents.filter(i => (i.daysAway || 0) > 0),                                              detail: i => `${i.daysAway} day(s) away` },
          total_restr:   { label: "Total Restricted Workdays",     list: recordableIncidents.filter(i => (i.daysRestricted || 0) > 0),                                       detail: i => `${i.daysRestricted} restricted day(s)` },
          total_xfer:    { label: "Total Transfer Days",           list: recordableIncidents.filter(i => (i.daysJobTransfer || 0) > 0),                                      detail: i => `${i.daysJobTransfer} transfer day(s)` },
        };

        const DrillPanel = ({ ddKey }: { ddKey: string }) => {
          if (drillDown !== ddKey) return null;
          const { label, list, detail } = drillDownMap[ddKey];
          return (
            <div className="col-span-full mt-1 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-primary">{label}</h4>
                <button onClick={() => setDrillDown(null)} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Close
                </button>
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No incidents in this category.</p>
              ) : (
                <div className="space-y-2">
                  {list.map(i => (
                    <div key={i.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{i.employeeName || "Unknown Employee"}</span>
                        <span className="text-muted-foreground">{new Date(i.incidentDate).toLocaleDateString()}</span>
                        {getTypeBadge(i.incidentType)}
                      </div>
                      {detail && <span className="text-xs text-muted-foreground font-mono">{detail(i)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        };

        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={`${cardBase} border-destructive/30 ${drillDown === 'deaths' ? 'ring-2 ring-destructive' : 'hover:ring-destructive/40'}`} onClick={() => toggle('deaths')}>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-destructive">{totalDeaths}</p>
                    <p className="text-xs text-muted-foreground mt-1">Deaths</p>
                    <p className="text-[10px] text-primary/50 mt-1">click to view</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`${cardBase} ${drillDown === 'days_away' ? 'ring-2 ring-orange-400' : 'hover:ring-orange-300'}`} onClick={() => toggle('days_away')}>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{casesWithDaysAway}</p>
                    <p className="text-xs text-muted-foreground mt-1">Cases w/ Days Away</p>
                    <p className="text-[10px] text-primary/50 mt-1">click to view</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`${cardBase} ${drillDown === 'restrictions' ? 'ring-2 ring-yellow-400' : 'hover:ring-yellow-300'}`} onClick={() => toggle('restrictions')}>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{casesWithRestrictions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Cases w/ Restrictions</p>
                    <p className="text-[10px] text-primary/50 mt-1">click to view</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`${cardBase} ${drillDown === 'other' ? 'ring-2 ring-blue-400' : 'hover:ring-blue-300'}`} onClick={() => toggle('other')}>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{otherRecordable}</p>
                    <p className="text-xs text-muted-foreground mt-1">Other Recordable</p>
                    <p className="text-[10px] text-primary/50 mt-1">click to view</p>
                  </div>
                </CardContent>
              </Card>
              <DrillPanel ddKey="deaths" />
              <DrillPanel ddKey="days_away" />
              <DrillPanel ddKey="restrictions" />
              <DrillPanel ddKey="other" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className={`bg-orange-50 ${cardBase} ${drillDown === 'total_away' ? 'ring-2 ring-orange-400' : 'hover:ring-orange-300'}`} onClick={() => toggle('total_away')}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Days Away</p>
                      <p className="text-2xl font-bold">{totalDaysAway}</p>
                      <p className="text-[10px] text-primary/50 mt-1">click to view</p>
                    </div>
                    <BedDouble className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className={`bg-yellow-50 ${cardBase} ${drillDown === 'total_restr' ? 'ring-2 ring-yellow-400' : 'hover:ring-yellow-300'}`} onClick={() => toggle('total_restr')}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Restricted Days</p>
                      <p className="text-2xl font-bold">{totalDaysRestricted}</p>
                      <p className="text-[10px] text-primary/50 mt-1">click to view</p>
                    </div>
                    <Construction className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className={`bg-blue-50 ${cardBase} ${drillDown === 'total_xfer' ? 'ring-2 ring-blue-400' : 'hover:ring-blue-300'}`} onClick={() => toggle('total_xfer')}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transfer Days</p>
                      <p className="text-2xl font-bold">{totalDaysTransfer}</p>
                      <p className="text-[10px] text-primary/50 mt-1">click to view</p>
                    </div>
                    <ClipboardList className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <DrillPanel ddKey="total_away" />
              <DrillPanel ddKey="total_restr" />
              <DrillPanel ddKey="total_xfer" />
            </div>
          </>
        );
      })()}

      {/* Printable Report Content */}
      <div ref={reportRef} className="bg-white p-6 rounded-lg border">
        <div className="header-info mb-6 flex items-start gap-4">
          {companyProfile?.logoUrl && (
            <img
              src={companyProfile.logoUrl}
              alt={companyProfile.companyName || "Company Logo"}
              className="w-14 h-14 object-contain rounded flex-shrink-0"
            />
          )}
          <div>
            {companyProfile?.companyName && (
              <p className="text-sm font-semibold text-gray-700 mb-1">{companyProfile.companyName}</p>
            )}
            <h1 className="text-xl font-bold">OSHA's Form 300</h1>
            <h2 className="text-sm text-muted-foreground">Log of Work-Related Injuries and Illnesses</h2>
            <p className="text-xs text-muted-foreground mt-2">
              Year: {new Date().getFullYear()}
              {selectedFacility !== 'all' && ` | Facility: ${selectedFacility}`}
              {' '}| Recordable Cases: {recordableIncidents.length} | 
              Injuries: {injuries} | Illnesses: {illnesses}
            </p>
          </div>
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

function CAPAFormDialog({ 
  open, 
  onOpenChange, 
  onSave,
  incidents,
  incidentId
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (data: CAPAFormData) => void;
  incidents: Incident[];
  incidentId?: number;
}) {
  const [formData, setFormData] = useState<CAPAFormData>(defaultCAPAFormData);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (open) {
      if (incidentId) {
        const incident = incidents.find(i => i.id === incidentId);
        setFormData({ 
          ...defaultCAPAFormData, 
          incidentId,
          title: incident ? `CAPA for ${incident.caseNumber || 'Incident #' + incident.id}` : ''
        });
      } else {
        setFormData(defaultCAPAFormData);
      }
    }
  }, [open, incidentId, incidents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData(defaultCAPAFormData);
  };

  const handleAskCorey = () => {
    const incident = incidents.find(i => i.id === formData.incidentId);
    const context = `I am working on a Corrective Action Plan (CAPA).
Incident Details: ${incident ? incident.description : 'N/A'}
Injury: ${incident?.natureOfInjury || 'N/A'} on ${incident?.bodyPart || 'N/A'}
Current CAPA Progress:
Title: ${formData.title}
Problem Statement: ${formData.problemStatement}
Current Root Cause Analysis: ${formData.rootCause}

Please provide suggestions for a more thorough root cause analysis and potential corrective/preventive actions.`;
    
    sessionStorage.setItem("corey-seed-prompt", context);
    setLocation("/corey");
  };

  const similarIncidentsCount = formData.incidentId ? incidents.filter(i => {
    const currentIncident = incidents.find(inc => inc.id === formData.incidentId);
    if (!currentIncident) return false;
    return i.id !== formData.incidentId && (
      (i.natureOfInjury && i.natureOfInjury === currentIncident.natureOfInjury) ||
      (i.bodyPart && i.bodyPart === currentIncident.bodyPart)
    );
  }).length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <ShieldCheck className="w-5 h-5" />
            {formData.incidentId ? 'Create Incident CAPA' : 'New Corrective Action Plan'}
          </DialogTitle>
        </DialogHeader>

        {formData.incidentId && similarIncidentsCount >= 2 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">⚠️ Recurrence Alert</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {similarIncidentsCount} similar incidents logged. Prior corrective actions may not have been effective.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Link to Incident (Optional) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Related Incident</h3>
            <div>
              <Label htmlFor="incidentId">Link to Incident (Optional)</Label>
              <Select 
                value={formData.incidentId?.toString() || "none"} 
                onValueChange={(v) => setFormData({...formData, incidentId: v === "none" ? null : parseInt(v)})}
              >
                <SelectTrigger data-testid="select-incident-link">
                  <SelectValue placeholder="Select related incident..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked incident</SelectItem>
                  {incidents.map((inc) => (
                    <SelectItem key={inc.id} value={inc.id.toString()}>
                      {new Date(inc.incidentDate).toLocaleDateString()} - {inc.description.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Problem Identification */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Problem Identification</h3>
            <div>
              <Label htmlFor="title">Action Plan Title *</Label>
              <Input 
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Forklift Safety Enhancement Program"
                required
                data-testid="input-capa-title"
              />
            </div>
            <div>
              <Label htmlFor="problemStatement">Problem Statement *</Label>
              <Textarea 
                id="problemStatement"
                value={formData.problemStatement}
                onChange={(e) => setFormData({...formData, problemStatement: e.target.value})}
                placeholder="Describe the problem or incident that requires corrective action..."
                rows={3}
                required
                data-testid="input-problem-statement"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="rootCause">Root Cause Analysis</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-2 text-xs border-accent text-accent hover:bg-accent/10"
                  onClick={handleAskCorey}
                  data-testid="button-ask-corey-suggestions"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask Corey for Suggestions
                </Button>
              </div>
              <Textarea 
                id="rootCause"
                value={formData.rootCause}
                onChange={(e) => setFormData({...formData, rootCause: e.target.value})}
                placeholder="What is the underlying cause of this problem? (Use 5 Whys, Fishbone, etc.)"
                rows={3}
                data-testid="input-root-cause"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Actions</h3>
            <div>
              <Label htmlFor="immediateActions">Immediate Actions Taken</Label>
              <Textarea 
                id="immediateActions"
                value={formData.immediateActions}
                onChange={(e) => setFormData({...formData, immediateActions: e.target.value})}
                placeholder="What actions were taken immediately to address the issue?"
                rows={2}
                data-testid="input-immediate-actions"
              />
            </div>
            <div>
              <Label htmlFor="correctiveActions">Corrective Actions (Long-term Fixes)</Label>
              <Textarea 
                id="correctiveActions"
                value={formData.correctiveActions}
                onChange={(e) => setFormData({...formData, correctiveActions: e.target.value})}
                placeholder="What long-term changes will be implemented to fix the problem?"
                rows={3}
                data-testid="input-corrective-actions"
              />
            </div>
            <div>
              <Label htmlFor="preventiveActions">Preventive Actions (Avoid Recurrence)</Label>
              <Textarea 
                id="preventiveActions"
                value={formData.preventiveActions}
                onChange={(e) => setFormData({...formData, preventiveActions: e.target.value})}
                placeholder="What measures will prevent this from happening again?"
                rows={3}
                data-testid="input-preventive-actions"
              />
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Assignment & Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsiblePerson">Responsible Person</Label>
                <Input 
                  id="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={(e) => setFormData({...formData, responsiblePerson: e.target.value})}
                  placeholder="Name of person responsible"
                  data-testid="input-responsible-person"
                />
              </div>
              <div>
                <Label htmlFor="responsiblePhone">Responsible Phone (SMS)</Label>
                <Input 
                  id="responsiblePhone"
                  value={formData.responsiblePhone}
                  onChange={(e) => setFormData({...formData, responsiblePhone: e.target.value})}
                  placeholder="+15551234567"
                  data-testid="input-responsible-phone"
                />
              </div>
              <div>
                <Label htmlFor="responsibleEmail">Responsible Email</Label>
                <Input 
                  id="responsibleEmail"
                  type="email"
                  value={formData.responsibleEmail}
                  onChange={(e) => setFormData({...formData, responsibleEmail: e.target.value})}
                  placeholder="assignee@company.com"
                  data-testid="input-capa-responsible-email"
                />
              </div>
              <div>
                <Label htmlFor="responsibleDepartment">Department</Label>
                <Input 
                  id="responsibleDepartment"
                  value={formData.responsibleDepartment}
                  onChange={(e) => setFormData({...formData, responsibleDepartment: e.target.value})}
                  placeholder="e.g., Operations, Safety"
                  data-testid="input-responsible-dept"
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Completion Date</Label>
                <Input 
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                  data-testid="input-target-date"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v) => setFormData({...formData, priority: v})}
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Verification</h3>
            <div>
              <Label htmlFor="verificationMethod">How Will Effectiveness Be Verified?</Label>
              <Textarea 
                id="verificationMethod"
                value={formData.verificationMethod}
                onChange={(e) => setFormData({...formData, verificationMethod: e.target.value})}
                placeholder="Describe how you will verify that the corrective actions are effective..."
                rows={2}
                data-testid="input-verification-method"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-capa">
              Create Action Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'critical':
      return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>;
    case 'high':
      return <Badge className="bg-orange-500 text-white">High</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
    case 'low':
      return <Badge variant="secondary">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

function getCAPAStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Open</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500 text-white"><Target className="w-3 h-3 mr-1" />In Progress</Badge>;
    case 'completed':
      return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case 'verified':
      return <Badge className="bg-accent text-accent-foreground"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>;
    case 'closed':
      return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function FreqBar({ label, count, max, color = "bg-accent" }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-48 text-xs truncate shrink-0 text-muted-foreground" title={label}>{label}</span>
      <div className="flex-1 bg-muted/40 rounded-full h-2 min-w-0">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-6 text-right shrink-0">{count}</span>
    </div>
  );
}

function IncidentAnalytics({ incidents }: { incidents: Incident[] }) {
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [breakdownCategory, setBreakdownCategory] = useState<keyof Incident>('natureOfInjury');

  // Collect unique named facilities
  const facilities = Array.from(
    new Set(incidents.map(i => i.facility?.trim()).filter(Boolean) as string[])
  ).sort();
  const multiSite = facilities.length > 1;

  // Filter incidents to the selected facility (or all)
  const viewed = selectedFacility
    ? incidents.filter(i => i.facility?.trim() === selectedFacility)
    : incidents;

  const total = viewed.length;
  const recordable = viewed.filter(i => i.isRecordable).length;
  const nearMiss = viewed.filter(i => i.incidentType === 'near_miss').length;
  const injury = viewed.filter(i => i.incidentType === 'injury').length;

  const tally = (field: keyof Incident) => {
    const counts: Record<string, number> = {};
    for (const inc of viewed) {
      const val = (inc[field] as string | null) || '(Not Specified)';
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  };

  const bodyParts = tally('bodyPart');
  const injuryTypes = tally('natureOfInjury');
  const workAreas = tally('location');
  const objects = tally('objectOrSubstance');
  const maxOf = (rows: [string, number][]) => rows.reduce((m, r) => Math.max(m, r[1]), 0);

  // Cross-site data (only used when "All Sites" is active and multiple sites exist)
  const siteRows = facilities.map(f => {
    const siteIncs = incidents.filter(i => i.facility?.trim() === f);
    return {
      name: f,
      total: siteIncs.length,
      recordable: siteIncs.filter(i => i.isRecordable).length,
      injury: siteIncs.filter(i => i.incidentType === 'injury').length,
      nearMiss: siteIncs.filter(i => i.incidentType === 'near_miss').length,
    };
  }).sort((a, b) => b.total - a.total);
  const maxSiteTotal = siteRows.reduce((m, r) => Math.max(m, r.total), 0);

  // ── Cross-site breakdown helpers ────────────────────────────────────────────
  const SITE_COLORS = [
    'bg-accent', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-400',
  ];
  const SITE_DOT_COLORS = [
    'bg-accent', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-400',
  ];

  const breakdownCategories = [
    { key: 'natureOfInjury' as keyof Incident, label: 'Injury Type' },
    { key: 'bodyPart'       as keyof Incident, label: 'Body Part' },
    { key: 'location'       as keyof Incident, label: 'Work Area' },
    { key: 'objectOrSubstance' as keyof Incident, label: 'Source of Harm' },
  ];

  if (incidents.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-muted-foreground">No incident data to analyze yet.</p>
        <p className="text-sm text-muted-foreground mt-1">Log incidents and this view will show distribution trends.</p>
      </div>
    );
  }

  // How many incidents are missing a facility name
  const untaggedCount = incidents.filter(i => !i.facility?.trim()).length;

  return (
    <div className="space-y-6 pt-2" data-testid="incident-analytics">

      {/* Cross-site unlock prompt — shown when < 2 named facilities */}
      {!multiSite && (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-4 flex items-start gap-3">
          <Target className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Cross-site graphs are one step away</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {facilities.length === 0
                ? 'Tag your incidents with a Facility / Site Name when logging them (or edit existing ones) and the Cross-Site Overview and Breakdown charts will appear here automatically.'
                : `${untaggedCount > 0 ? `${untaggedCount} incident${untaggedCount !== 1 ? 's are' : ' is'} missing a facility name. ` : ''}Add a second facility name to unlock side-by-side plant comparisons.`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Go to <strong>All Incidents</strong> tab → click an incident → fill in <strong>Facility / Site Name</strong>.</p>
          </div>
        </div>
      )}

      {/* Site filter — only shown when multiple named facilities exist */}
      {multiSite && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground mr-1">Filter by site:</span>
          <Button
            size="sm"
            variant={selectedFacility === null ? "default" : "outline"}
            onClick={() => setSelectedFacility(null)}
            data-testid="filter-all-sites"
            className="h-7 text-xs"
          >
            All Sites ({incidents.length})
          </Button>
          {facilities.map(f => (
            <Button
              key={f}
              size="sm"
              variant={selectedFacility === f ? "default" : "outline"}
              onClick={() => setSelectedFacility(f)}
              data-testid={`filter-site-${f}`}
              className="h-7 text-xs"
            >
              {f} ({incidents.filter(i => i.facility?.trim() === f).length})
            </Button>
          ))}
        </div>
      )}

      {/* Cross-Site Overview — shown only when "All Sites" active + multiple sites */}
      {multiSite && !selectedFacility && (
        <Card className="border-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Cross-Site Overview
            </CardTitle>
            <CardDescription>Incident totals and recordable counts by facility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {siteRows.map(({ name, total: t, recordable: r, nearMiss: nm }) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <button
                    className="font-medium hover:text-accent transition-colors text-left"
                    onClick={() => setSelectedFacility(name)}
                  >
                    {name}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {t} total · {r} recordable · {nm} near miss
                  </span>
                </div>
                {/* Stacked bar: recordable (red) + non-recordable (orange) */}
                <div className="w-full bg-muted/40 rounded-full h-3 overflow-hidden flex">
                  <div
                    className="bg-destructive h-3 transition-all duration-500"
                    style={{ width: `${maxSiteTotal > 0 ? (r / maxSiteTotal) * 100 : 0}%` }}
                    title={`${r} recordable`}
                  />
                  <div
                    className="bg-accent h-3 transition-all duration-500"
                    style={{ width: `${maxSiteTotal > 0 ? ((t - r) / maxSiteTotal) * 100 : 0}%` }}
                    title={`${t - r} non-recordable`}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive inline-block" /> Recordable</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-accent inline-block" /> Non-Recordable</span>
              <span className="text-xs ml-auto italic">Click a site name to drill down</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-Site Breakdown — which sites had what */}
      {multiSite && !selectedFacility && (
        <Card className="border-blue-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Construction className="w-4 h-4 text-blue-500" />
                  Cross-Site Breakdown
                </CardTitle>
                <CardDescription>Which facilities had each category — e.g., "Which plants had Strains?"</CardDescription>
              </div>
              <div className="flex gap-1 flex-wrap">
                {breakdownCategories.map(({ key, label }) => (
                  <Button
                    key={key as string}
                    size="sm"
                    variant={breakdownCategory === key ? "default" : "outline"}
                    onClick={() => setBreakdownCategory(key)}
                    className="h-7 text-xs"
                    data-testid={`breakdown-cat-${key as string}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {(() => {
              // Build matrix: for each category value, count per facility
              const allValues = Array.from(
                new Set(incidents.map(i => (i[breakdownCategory] as string | null)?.trim() || '(Not Specified)'))
              );
              const matrix = allValues.map(val => {
                const siteCounts = facilities.map(f =>
                  incidents.filter(i =>
                    i.facility?.trim() === f &&
                    ((i[breakdownCategory] as string | null)?.trim() || '(Not Specified)') === val
                  ).length
                );
                return { val, siteCounts, total: siteCounts.reduce((a, b) => a + b, 0) };
              })
                .filter(r => r.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);

              const maxTotal = matrix.reduce((m, r) => Math.max(m, r.total), 0);

              if (matrix.length === 0) {
                return <p className="text-xs text-muted-foreground">No data logged for this category yet.</p>;
              }

              return (
                <>
                  {matrix.map(({ val, siteCounts, total: t }) => (
                    <div key={val} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{val}</span>
                        <span className="text-xs text-muted-foreground">{t} total</span>
                      </div>
                      {facilities.map((f, fi) => siteCounts[fi] > 0 && (
                        <div key={f} className="flex items-center gap-2 text-xs">
                          <span className="w-40 truncate text-muted-foreground shrink-0" title={f}>{f}</span>
                          <div className="flex-1 bg-muted/40 rounded-full h-2 min-w-0">
                            <div
                              className={`${SITE_COLORS[fi % SITE_COLORS.length]} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${maxTotal > 0 ? (siteCounts[fi] / maxTotal) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="w-5 text-right font-medium shrink-0">{siteCounts[fi]}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* Site color legend */}
                  <div className="flex flex-wrap gap-3 pt-1 border-t">
                    {facilities.map((f, fi) => (
                      <span key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className={`w-3 h-3 rounded-sm ${SITE_DOT_COLORS[fi % SITE_DOT_COLORS.length]} inline-block shrink-0`} />
                        {f}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Summary stats for current view */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: total, color: "text-primary" },
          { label: "Recordable", value: recordable, color: "text-destructive" },
          { label: "Injuries", value: injury, color: "text-orange-500" },
          { label: "Near Misses", value: nearMiss, color: "text-yellow-500" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center py-4">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            {total > 0 && <p className="text-xs text-muted-foreground">{Math.round((value / total) * 100)}% of total</p>}
          </Card>
        ))}
      </div>

      {/* Distribution charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Body Part Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bodyParts.length > 0
              ? bodyParts.map(([label, count]) => (
                  <FreqBar key={label} label={label} count={count} max={maxOf(bodyParts)} color="bg-accent" />
                ))
              : <p className="text-xs text-muted-foreground">No data for this selection.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Injury / Illness Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {injuryTypes.length > 0
              ? injuryTypes.map(([label, count]) => (
                  <FreqBar key={label} label={label} count={count} max={maxOf(injuryTypes)} color="bg-destructive" />
                ))
              : <p className="text-xs text-muted-foreground">No data for this selection.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-blue-500" />
              Work Area / Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workAreas.length > 0
              ? workAreas.map(([label, count]) => (
                  <FreqBar key={label} label={label} count={count} max={maxOf(workAreas)} color="bg-blue-500" />
                ))
              : <p className="text-xs text-muted-foreground">No data for this selection.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Construction className="w-4 h-4 text-yellow-500" />
              Source / Object of Harm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {objects.length > 0
              ? objects.map(([label, count]) => (
                  <FreqBar key={label} label={label} count={count} max={maxOf(objects)} color="bg-yellow-500" />
                ))
              : <p className="text-xs text-muted-foreground">No data for this selection.</p>}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {selectedFacility
          ? `Showing data for: ${selectedFacility} · ${total} incident${total !== 1 ? 's' : ''}`
          : `All ${facilities.length > 0 ? `${facilities.length} site${facilities.length !== 1 ? 's' : ''} · ` : ''}${total} total incident${total !== 1 ? 's' : ''} analyzed`}
        {multiSite && !selectedFacility && ' · top 8 per category'}
      </p>
    </div>
  );
}

function CorrectiveActionPlans({ incidents, autoOpen = false }: { incidents: Incident[]; autoOpen?: boolean }) {
  const [capaDialogOpen, setCAPADialogOpen] = useState(false);
  const [selectedCAPA, setSelectedCAPA] = useState<CorrectiveAction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (autoOpen) {
      setCAPADialogOpen(true);
    }
  }, [autoOpen]);

  const { data: capaList = [], isLoading } = useQuery<CorrectiveAction[]>({
    queryKey: ['/api/corrective-actions'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CAPAFormData) => {
      return apiRequest('POST', '/api/corrective-actions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/corrective-actions'] });
      setCAPADialogOpen(false);
      toast({ title: "Action Plan Created", description: "Corrective action plan has been created successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create action plan.", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/corrective-actions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/corrective-actions'] });
      toast({ title: "Status Updated", description: "Action plan status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/corrective-actions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/corrective-actions'] });
      toast({ title: "Deleted", description: "Action plan has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete action plan.", variant: "destructive" });
    },
  });

  const openCount = capaList.filter(c => c.status === 'open').length;
  const inProgressCount = capaList.filter(c => c.status === 'in_progress').length;
  const completedCount = capaList.filter(c => c.status === 'completed' || c.status === 'verified' || c.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            Corrective Action Plans (CAPA)
          </h2>
          <p className="text-sm text-muted-foreground">
            Create policies and procedures to prevent future incidents
          </p>
        </div>
        <Button onClick={() => setCAPADialogOpen(true)} className="gap-2" data-testid="button-create-capa">
          <Plus className="w-4 h-4" />
          New Action Plan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{openCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CAPA List */}
      <Card>
        <CardHeader>
          <CardTitle>All Corrective Action Plans</CardTitle>
          <CardDescription>
            Track and manage corrective and preventive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : capaList.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="w-12 h-12 text-accent mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No Corrective Action Plans</h3>
              <p className="text-muted-foreground mb-4">
                Create your first CAPA to establish policies and procedures.
              </p>
              <Button onClick={() => setCAPADialogOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Action Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {capaList.map((capa) => {
                const isOverdue = capa.targetDate && 
                                 new Date(capa.targetDate) < new Date() && 
                                 !['completed', 'verified', 'closed'].includes(capa.status);
                return (
                  <div 
                    key={capa.id} 
                    className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/30 transition-colors"
                    data-testid={`capa-item-${capa.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold truncate">{capa.title}</h4>
                          {getPriorityBadge(capa.priority)}
                          {getCAPAStatusBadge(capa.status)}
                          {isOverdue && (
                            <Badge variant="destructive" className="gap-1 px-1 h-5">
                              <Clock className="w-3 h-3" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {capa.problemStatement}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {capa.responsiblePerson && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {capa.responsiblePerson}
                            </span>
                          )}
                          {capa.targetDate && (
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(capa.targetDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created: {new Date(capa.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={capa.status} 
                          onValueChange={(v) => updateStatusMutation.mutate({ id: capa.id, status: v })}
                        >
                          <SelectTrigger className="w-32 h-8" data-testid={`select-capa-status-${capa.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => setSelectedCAPA(capa)}
                          data-testid={`button-view-capa-${capa.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this action plan?')) {
                              deleteMutation.mutate(capa.id);
                            }
                          }}
                          data-testid={`button-delete-capa-${capa.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CAPA Detail Dialog */}
      {selectedCAPA && (
        <Dialog open={!!selectedCAPA} onOpenChange={() => setSelectedCAPA(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                {selectedCAPA.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedCAPA.priority)}
                {getCAPAStatusBadge(selectedCAPA.status)}
                {selectedCAPA.responsiblePhone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs ml-auto"
                    onClick={async () => {
                      try {
                        await apiRequest('POST', `/api/corrective-actions/${selectedCAPA.id}/notify-sms`);
                        toast({ title: "Notification Sent", description: `SMS sent to ${selectedCAPA.responsiblePerson}` });
                      } catch (err) {
                        toast({ 
                          title: "SMS Failed", 
                          description: "Could not send notification. Check Twilio configuration.",
                          variant: "destructive"
                        });
                      }
                    }}
                    data-testid="button-send-capa-sms"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Send SMS Notification
                  </Button>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Problem Statement</h4>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                  {selectedCAPA.problemStatement}
                </p>
              </div>

              {selectedCAPA.rootCause && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Root Cause</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                    {selectedCAPA.rootCause}
                  </p>
                </div>
              )}

              {selectedCAPA.immediateActions && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Immediate Actions</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                    {selectedCAPA.immediateActions}
                  </p>
                </div>
              )}

              {selectedCAPA.correctiveActions && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Corrective Actions</h4>
                  <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-blue-500">
                    {selectedCAPA.correctiveActions}
                  </p>
                </div>
              )}

              {selectedCAPA.preventiveActions && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Preventive Actions</h4>
                  <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded border-l-4 border-green-500">
                    {selectedCAPA.preventiveActions}
                  </p>
                </div>
              )}

              {selectedCAPA.verificationMethod && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Verification Method</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                    {selectedCAPA.verificationMethod}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Responsible</p>
                  <p className="font-medium">{selectedCAPA.responsiblePerson || '—'}</p>
                  <p className="text-sm text-muted-foreground">{selectedCAPA.responsibleDepartment || ''}</p>
                  {selectedCAPA.responsiblePhone && <p className="text-xs text-muted-foreground">{selectedCAPA.responsiblePhone}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Date</p>
                  <p className="font-medium">
                    {selectedCAPA.targetDate ? new Date(selectedCAPA.targetDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              {(selectedCAPA.status === 'completed' || selectedCAPA.status === 'verified') && (
                <div className="mt-6 border-t pt-4 space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    Effectiveness Verification
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Effectiveness Result</Label>
                      <Select 
                        defaultValue={selectedCAPA.effectivenessResult || 'pending'}
                        onValueChange={async (val) => {
                          await apiRequest('PATCH', `/api/corrective-actions/${selectedCAPA.id}`, { effectivenessResult: val });
                          queryClient.invalidateQueries({ queryKey: ['/api/corrective-actions'] });
                        }}
                      >
                        <SelectTrigger data-testid="select-effectiveness-result">
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
                      <Label>Verification Notes</Label>
                      <Textarea 
                        placeholder="Enter verification details..."
                        defaultValue={selectedCAPA.verificationNotes || ''}
                        onBlur={async (e) => {
                          await apiRequest('PATCH', `/api/corrective-actions/${selectedCAPA.id}`, { verificationNotes: e.target.value });
                          queryClient.invalidateQueries({ queryKey: ['/api/corrective-actions'] });
                        }}
                        data-testid="textarea-verification-notes"
                      />
                    </div>
                  </div>
                  {selectedCAPA.status !== 'verified' && (
                    <Button 
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={async () => {
                        await apiRequest('PATCH', `/api/corrective-actions/${selectedCAPA.id}`, { 
                          status: 'verified',
                          completionDate: new Date().toISOString()
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/corrective-actions'] });
                        setSelectedCAPA(null);
                        toast({ title: "CAPA Verified", description: "The action plan has been marked as verified and completed." });
                      }}
                      data-testid="button-mark-verified"
                    >
                      Mark Verified & Close
                    </Button>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCAPA(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <CAPAFormDialog
        open={capaDialogOpen}
        onOpenChange={setCAPADialogOpen}
        onSave={(data) => createMutation.mutate(data)}
        incidents={incidents}
      />
    </div>
  );
}

function IncidentDetailDialog({
  incident,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, data: Partial<IncidentFormData>) => void;
  isSaving: boolean;
}) {
  const buildFormData = (inc: Incident): IncidentFormData => ({
    incidentDate: new Date(inc.incidentDate).toISOString().split('T')[0],
    description: inc.description,
    incidentType: inc.incidentType,
    facility: inc.facility || '',
    employeeName: inc.employeeName || '',
    jobTitle: inc.jobTitle || '',
    department: inc.department || '',
    location: inc.location || '',
    bodyPart: inc.bodyPart || '',
    natureOfInjury: inc.natureOfInjury || '',
    objectOrSubstance: inc.objectOrSubstance || '',
    isRecordable: inc.isRecordable,
    resultedInDeath: inc.resultedInDeath,
    daysAway: inc.daysAway ?? 0,
    daysRestricted: inc.daysRestricted ?? 0,
    daysJobTransfer: inc.daysJobTransfer ?? 0,
    isOtherRecordable: inc.isOtherRecordable ?? false,
    status: inc.status,
    // FROI fields
    employeeSsnLast4: inc.employeeSsnLast4 || '',
    employeeDob: inc.employeeDob || '',
    employeeSex: inc.employeeSex || '',
    employeePhone: inc.employeePhone || '',
    employeeAddress: inc.employeeAddress || '',
    employeeHireDate: inc.employeeHireDate || '',
    employeeDependents: inc.employeeDependents?.toString() || '',
    employeeTaxStatus: inc.employeeTaxStatus || '',
    grossWeeklyWage: inc.grossWeeklyWage || '',
    weeksWorked: inc.weeksWorked?.toString() || '',
    fringeBenefitsValue: inc.fringeBenefitsValue || '',
    isVolunteer: inc.isVolunteer ?? false,
    isVocationallyHandicapped: inc.isVocationallyHandicapped ?? false,
    fein: inc.fein || '',
    uiNumber: inc.uiNumber || '',
    sicNaicsCode: inc.sicNaicsCode || '',
    insuranceCompany: inc.insuranceCompany || '',
    insurancePhone: inc.insurancePhone || '',
    policyNumber: inc.policyNumber || '',
    tpaName: inc.tpaName || '',
    timeWorkBegan: inc.timeWorkBegan || '',
    timeOfEvent: inc.timeOfEvent || '',
    injuryCity: inc.injuryCity || '',
    injuryState: inc.injuryState || '',
    injuryCounty: inc.injuryCounty || '',
    onEmployerPremises: inc.onEmployerPremises ?? true,
    whatEmployeeWasDoing: inc.whatEmployeeWasDoing || '',
    howInjuryOccurred: inc.howInjuryOccurred || '',
    physicianName: inc.physicianName || '',
    treatmentFacility: inc.treatmentFacility || '',
    treatedInEr: inc.treatedInEr ?? false,
    hospitalizedOvernight: inc.hospitalizedOvernight ?? false,
    treatmentAddress: inc.treatmentAddress || '',
    lastDayWorked: inc.lastDayWorked || '',
    firstDayMissed: inc.firstDayMissed || '',
    returnToWorkDate: inc.returnToWorkDate || '',
    deathDate: inc.deathDate || '',
    dateEmployerNotified: inc.dateEmployerNotified || '',
  });

  const [formData, setFormData] = useState<IncidentFormData>(
    incident ? buildFormData(incident) : defaultFormData
  );

  useEffect(() => {
    if (incident && open) {
      setFormData(buildFormData(incident));
    }
  }, [incident, open]);

  if (!incident) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(incident.id, formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="w-5 h-5" />
            Review Incident — {incident.caseNumber || `#${incident.id}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Review Status — most prominent, at top */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <Label htmlFor="detail-status" className="text-base font-semibold mb-2 block">Review Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger id="detail-status" data-testid="select-detail-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Incident Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="detail-date">Date of Incident</Label>
                <Input
                  id="detail-date"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  data-testid="input-detail-date"
                />
              </div>
              <div>
                <Label htmlFor="detail-type">Incident Type</Label>
                <Select value={formData.incidentType} onValueChange={(v) => setFormData({ ...formData, incidentType: v })}>
                  <SelectTrigger id="detail-type" data-testid="select-detail-type">
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
              <Label htmlFor="detail-description">Description of Event</Label>
              <Textarea
                id="detail-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
                data-testid="input-detail-description"
              />
            </div>
          </div>

          {/* Employee Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Employee Information</h3>
            <div>
              <Label htmlFor="detail-facility">Facility / Site Name</Label>
              <Input
                id="detail-facility"
                value={formData.facility}
                onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
                placeholder="e.g., Plant 1 – Detroit"
                data-testid="input-detail-facility"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="detail-employee">Employee Name</Label>
                <Input
                  id="detail-employee"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  data-testid="input-detail-employee"
                />
              </div>
              <div>
                <Label htmlFor="detail-job">Job Title</Label>
                <Input
                  id="detail-job"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  data-testid="input-detail-job"
                />
              </div>
              <div>
                <Label htmlFor="detail-dept">Department</Label>
                <Input
                  id="detail-dept"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  data-testid="input-detail-dept"
                />
              </div>
              <div>
                <Label htmlFor="detail-location">Work Area / Location</Label>
                <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                  <SelectTrigger id="detail-location" data-testid="select-detail-location">
                    <SelectValue placeholder="Select work area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Injury Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Injury / Illness Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="detail-body">Body Part Affected</Label>
                <Select value={formData.bodyPart} onValueChange={(v) => setFormData({ ...formData, bodyPart: v })}>
                  <SelectTrigger id="detail-body" data-testid="select-detail-body">
                    <SelectValue placeholder="Select body part..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_PARTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="detail-nature">Nature of Injury / Illness</Label>
                <Select value={formData.natureOfInjury} onValueChange={(v) => setFormData({ ...formData, natureOfInjury: v })}>
                  <SelectTrigger id="detail-nature" data-testid="select-detail-nature">
                    <SelectValue placeholder="Select injury type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INJURY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="detail-object">Source / Object That Caused Harm</Label>
              <Select value={formData.objectOrSubstance} onValueChange={(v) => setFormData({ ...formData, objectOrSubstance: v })}>
                <SelectTrigger id="detail-object" data-testid="select-detail-object">
                  <SelectValue placeholder="Select source of harm..." />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTS_SOURCES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* OSHA Classification */}
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              OSHA 300 Classification
            </h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecordable}
                onChange={(e) => setFormData({ ...formData, isRecordable: e.target.checked })}
                className="w-4 h-4"
                data-testid="checkbox-detail-recordable"
              />
              <span className="text-sm font-medium">This is an OSHA recordable incident</span>
            </label>

            {formData.isRecordable && (
              <div className="space-y-4 pl-6 border-l-2 border-destructive/30">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.resultedInDeath}
                      onChange={(e) => setFormData({ ...formData, resultedInDeath: e.target.checked })}
                      className="w-4 h-4"
                      data-testid="checkbox-detail-death"
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
                      onChange={(e) => setFormData({ ...formData, isOtherRecordable: e.target.checked })}
                      className="w-4 h-4"
                      data-testid="checkbox-detail-other"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Stethoscope className="w-4 h-4 text-orange-500" />
                      Other Recordable Case
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="flex items-center gap-1 text-xs">
                      <BedDouble className="w-3 h-3" />Days Away
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.daysAway}
                      onChange={(e) => setFormData({ ...formData, daysAway: parseInt(e.target.value) || 0 })}
                      data-testid="input-detail-days-away"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-xs">
                      <Construction className="w-3 h-3" />Days Restricted
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.daysRestricted}
                      onChange={(e) => setFormData({ ...formData, daysRestricted: parseInt(e.target.value) || 0 })}
                      data-testid="input-detail-days-restricted"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-xs">
                      <ClipboardList className="w-3 h-3" />Days Transfer
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.daysJobTransfer}
                      onChange={(e) => setFormData({ ...formData, daysJobTransfer: parseInt(e.target.value) || 0 })}
                      data-testid="input-detail-days-transfer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} data-testid="button-save-incident-detail">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Incidents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [initialRecordable, setInitialRecordable] = useState(false);
  const [autoOpenCapa, setAutoOpenCapa] = useState(false);
  const [activeTab, setActiveTab] = useState('incidents');
  const [capaFormOpen, setCAPAFormOpen] = useState(false);
  const [selectedCAPAForPlan, setSelectedCAPAForPlan] = useState<number | undefined>(undefined);
  const [coreyAnalysisIncidentId, setCoreyAnalysisIncidentId] = useState<number | null>(null);
  const [coreyAnalysis, setCoreyAnalysis] = useState("");
  const [coreyAnalysisStreaming, setCoreyAnalysisStreaming] = useState(false);
  const { toast } = useToast();

  const notifyAdjusterMutation = useMutation({
    mutationFn: async (incidentId: number) => {
      const res = await apiRequest('POST', `/api/incidents/${incidentId}/notify-adjuster`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Adjuster Notified", description: data?.message || "Email sent to your workers' comp adjuster." });
    },
    onError: (err: any) => {
      let msg = "Failed to send email.";
      try {
        const jsonStr = String(err?.message || "").replace(/^\d+:\s*/, "");
        const parsed = JSON.parse(jsonStr);
        if (parsed.message) msg = parsed.message;
      } catch {}
      toast({ title: "Could Not Send Email", description: msg, variant: "destructive" });
    },
  });

  const runCoreyAnalysis = async (incidentId: number) => {
    setCoreyAnalysisIncidentId(incidentId);
    setCoreyAnalysis("");
    setCoreyAnalysisStreaming(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/corey-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n\n")) {
          if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.content) setCoreyAnalysis(prev => prev + d.content);
            } catch {}
          }
        }
      }
    } catch {
      setCoreyAnalysis("Unable to generate analysis. Please try again.");
    } finally {
      setCoreyAnalysisStreaming(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('recordable') === 'true') {
      setInitialRecordable(true);
      setDialogOpen(true);
    }
    if (params.get('capa') === 'true') {
      setAutoOpenCapa(true);
      setActiveTab('capa');
    }
  }, []);

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create incident');
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents/chart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      setDialogOpen(false);
      toast({ title: "Incident Logged", description: "Corey is analyzing this incident now..." });
      if (data?.id) {
        runCoreyAnalysis(data.id);
        setActiveTab('incidents');
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log incident.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<IncidentFormData> }) => {
      return apiRequest('PATCH', `/api/incidents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents/chart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      setDetailOpen(false);
      setSelectedIncident(null);
      toast({ title: "Incident Updated", description: "Incident record has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update incident.", variant: "destructive" });
    },
  });

  const createCAPAMutation = useMutation({
    mutationFn: async (data: CAPAFormData) => {
      return apiRequest('POST', '/api/corrective-actions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/corrective-actions'] });
      setCAPAFormOpen(false);
      setSelectedCAPAForPlan(undefined);
      toast({ title: "Action Plan Created", description: "Corrective action plan has been created successfully." });
      setActiveTab('capa');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create action plan.", variant: "destructive" });
    },
  });

  const handleOpenIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailOpen(true);
  };

  const recordableCount = incidents.filter(i => i.isRecordable).length;
  const pendingReviewCount = incidents.filter(i => i.status === 'pending_review').length;
  const [statFilter, setStatFilter] = useState<'all' | 'recordable' | 'pending_review' | null>(null);

  return (
    <PlatformGate featureName="Incident Log & OSHA 300">
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

        {/* Summary Stats — clickable drill-down */}
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Total Incidents */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/40 ${statFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatFilter(prev => prev === 'all' ? null : 'all')}
              data-testid="card-stat-total"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileWarning className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{incidents.length}</p>
                    <p className="text-sm text-muted-foreground">Total Incidents</p>
                    <p className="text-[10px] text-primary/50">click to view</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OSHA Recordable */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-destructive/40 ${statFilter === 'recordable' ? 'ring-2 ring-destructive' : ''}`}
              onClick={() => setStatFilter(prev => prev === 'recordable' ? null : 'recordable')}
              data-testid="card-stat-recordable"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{recordableCount}</p>
                    <p className="text-sm text-muted-foreground">OSHA Recordable</p>
                    <p className="text-[10px] text-primary/50">click to view</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Review */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-yellow-400/50 ${statFilter === 'pending_review' ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => setStatFilter(prev => prev === 'pending_review' ? null : 'pending_review')}
              data-testid="card-stat-pending"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{pendingReviewCount}</p>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-[10px] text-primary/50">click to view</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drill-down panel */}
          {statFilter !== null && (() => {
            const filtered = statFilter === 'all'
              ? incidents
              : statFilter === 'recordable'
              ? incidents.filter(i => i.isRecordable)
              : incidents.filter(i => i.status === 'pending_review');
            const title = statFilter === 'all' ? 'All Incidents' : statFilter === 'recordable' ? 'OSHA Recordable Incidents' : 'Incidents Pending Review';
            return (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-primary">{title} ({filtered.length})</h4>
                  <button onClick={() => setStatFilter(null)} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Close
                  </button>
                </div>
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No incidents in this category.</p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(i => (
                      <div
                        key={i.id}
                        className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleOpenIncident(i)}
                        data-testid={`stat-drill-incident-${i.id}`}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium">{i.employeeName || "Unknown Employee"}</span>
                          <span className="text-muted-foreground text-xs">{new Date(i.incidentDate).toLocaleDateString()}</span>
                          {getTypeBadge(i.incidentType)}
                          {getStatusBadge(i.status)}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {i.isRecordable && <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5">Recordable</Badge>}
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Tabs for Incident List, OSHA 300 Report, and CAPA */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="incidents" className="gap-2" data-testid="tab-incidents">
              <FileWarning className="w-4 h-4" />
              All Incidents
            </TabsTrigger>
            <TabsTrigger value="osha300" className="gap-2" data-testid="tab-osha300">
              <FileText className="w-4 h-4" />
              OSHA 300 Report
            </TabsTrigger>
            <TabsTrigger value="capa" className="gap-2" data-testid="tab-capa">
              <ShieldCheck className="w-4 h-4" />
              Corrective Actions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <Target className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incidents">
            {/* T007: Corey Analysis Card — appears after incident submission */}
            {coreyAnalysisIncidentId && (
              <Card className="border-accent/40 bg-gradient-to-br from-accent/5 to-primary/5 mb-4" data-testid="card-corey-incident-analysis">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-accent" />
                      </div>
                      <span className="font-semibold">Corey's Incident Analysis</span>
                      {coreyAnalysisStreaming && <span className="text-xs text-muted-foreground font-normal animate-pulse">Analyzing...</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => { setCoreyAnalysisIncidentId(null); setCoreyAnalysis(""); }}
                      data-testid="button-close-corey-analysis"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!coreyAnalysis && coreyAnalysisStreaming ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-border/50 max-h-64 overflow-y-auto font-mono text-xs" data-testid="corey-analysis-content">
                      {coreyAnalysis}
                      {coreyAnalysisStreaming && <span className="inline-block w-1.5 h-3.5 bg-accent animate-pulse ml-0.5" />}
                    </div>
                  )}
                  {!coreyAnalysisStreaming && coreyAnalysis && (
                    <div className="flex gap-2 mt-3">
                      <Link href="/corey">
                        <Button variant="outline" size="sm" className="gap-1 text-xs" data-testid="button-discuss-with-corey">
                          <MessageSquare className="w-3 h-3" /> Discuss with Corey
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => runCoreyAnalysis(coreyAnalysisIncidentId!)}
                        data-testid="button-reanalyze-corey"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-analyze
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                  <div className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Date</TableHead>
                          <TableHead className="w-[130px]">Employee</TableHead>
                          <TableHead className="w-[110px]">Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">OSHA</TableHead>
                          <TableHead className="w-[90px]">Status</TableHead>
                          <TableHead className="w-[90px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incidents.map((incident) => (
                          <TableRow
                            key={incident.id}
                            data-testid={`incident-row-${incident.id}`}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleOpenIncident(incident)}
                          >
                            <TableCell className="text-sm whitespace-nowrap">
                              {new Date(incident.incidentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="max-w-[130px]">
                              <span className="truncate block">{incident.employeeName || <span className="text-muted-foreground">—</span>}</span>
                            </TableCell>
                            <TableCell>{getTypeBadge(incident.incidentType)}</TableCell>
                            <TableCell>
                              <span className="truncate block max-w-[180px] text-sm">{incident.description}</span>
                            </TableCell>
                            <TableCell>
                              {incident.isRecordable ? (
                                <div className="flex flex-col gap-0.5">
                                  <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 w-fit">Recordable</Badge>
                                  {(incident.daysAway || incident.daysRestricted) ? (
                                    <span className="text-[10px] text-muted-foreground">{incident.daysAway ?? 0}d away / {incident.daysRestricted ?? 0}d restr.</span>
                                  ) : null}
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1.5">Not Rec.</Badge>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(incident.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 border-accent text-accent hover:bg-accent/10"
                                  title="Create CAPA"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCAPAForPlan(incident.id);
                                    setCAPAFormOpen(true);
                                  }}
                                  data-testid={`button-incident-capa-${incident.id}`}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                  title="Notify workers' comp adjuster"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notifyAdjusterMutation.mutate(incident.id);
                                  }}
                                  disabled={notifyAdjusterMutation.isPending}
                                  data-testid={`button-notify-adjuster-${incident.id}`}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title="Open incident detail"
                                  onClick={(e) => { e.stopPropagation(); handleOpenIncident(incident); }}
                                  data-testid={`button-open-incident-${incident.id}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
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
          </TabsContent>

          <TabsContent value="osha300">
            <OSHA300Report incidents={incidents} />
          </TabsContent>

          <TabsContent value="capa">
            <CorrectiveActionPlans incidents={incidents} autoOpen={autoOpenCapa} />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Incident Analytics
                </CardTitle>
                <CardDescription>
                  Frequency distribution by body part, injury type, work area, and source of harm. Use standardized dropdown values when logging incidents for meaningful analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentAnalytics incidents={incidents} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <IncidentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={(data) => createMutation.mutate(data)}
          initialRecordable={initialRecordable}
        />

        <IncidentDetailDialog
          key={selectedIncident?.id ?? 'none'}
          incident={selectedIncident}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setSelectedIncident(null);
          }}
          onSave={(id, data) => updateMutation.mutate({ id, data })}
          isSaving={updateMutation.isPending}
        />

        <CAPAFormDialog
          open={capaFormOpen}
          onOpenChange={setCAPAFormOpen}
          onSave={(data) => {
            createCAPAMutation.mutate(data);
          }}
          incidents={incidents}
          incidentId={selectedCAPAForPlan}
        />
      </div>
    </ProtectedLayout>
    </PlatformGate>
  );
}
