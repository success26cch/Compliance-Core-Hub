import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeSVG } from "qrcode.react";
import SignaturePad from "@/components/SignaturePad";
import cchLogo from "@assets/1_1770683748423.png";
import {
  QrCode,
  Smartphone,
  Clock,
  CheckCircle2,
  User,
  Building2,
  ArrowLeft,
  Loader2,
  Scan,
  Send,
  History,
  PenLine,
  DollarSign,
  FileText,
  Stethoscope,
  MessageSquare,
  Copy,
  Link,
  ArrowLeftRight,
} from "lucide-react";
import type { Employee, ClinicVisit, ClinicLocation } from "@shared/schema";

const VISIT_TYPES = [
  { value: "dot_physical", label: "DOT Physical" },
  { value: "drug_screen", label: "Drug Screen" },
  { value: "respiratory_exam", label: "Respiratory Exam" },
  { value: "injury", label: "Injury Evaluation" },
  { value: "new_hire", label: "New Hire Intake" },
  { value: "other", label: "Other Medical Visit" },
];

const ALL_SERVICES = [
  { category: "Work Related", items: [
    { code: "injury", label: "Injury" },
    { code: "illness", label: "Illness" },
  ]},
  { category: "Physical Examination", items: [
    { code: "pre_placement", label: "Pre-Placement" },
    { code: "baseline", label: "Baseline" },
    { code: "annual", label: "Annual" },
    { code: "exit", label: "Exit" },
  ]},
  { category: "DOT Exams", items: [
    { code: "dot_drug_test", label: "DOT Drug Test" },
    { code: "dot_breath_alcohol", label: "DOT Breath Alcohol" },
    { code: "dot_new_hire", label: "New Hire" },
    { code: "dot_recertification", label: "Recertification" },
  ]},
  { category: "Substance Abuse Testing", items: [
    { code: "non_dot_breath_alcohol", label: "Non-DOT Breath Alcohol" },
    { code: "hair_collect", label: "Hair Collect" },
    { code: "non_dot_drug_instant", label: "Non-DOT Drug Screen (Instant)" },
    { code: "non_dot_drug_lab", label: "Non-DOT Drug Screen (Lab)" },
    { code: "panel_5", label: "5 Panel" },
    { code: "panel_10", label: "10 Panel" },
    { code: "panel_4", label: "4 Panel" },
    { code: "panel_9", label: "9 Panel" },
  ]},
  { category: "Special Examinations", items: [
    { code: "asbestos", label: "Asbestos" },
    { code: "respiratory", label: "Respiratory" },
    { code: "hazmat", label: "Hazmat" },
    { code: "firefighter", label: "Firefighter" },
    { code: "mcoles", label: "MCOLES" },
    { code: "fit_for_duty", label: "Fit for Duty" },
    { code: "audiogram", label: "Audiogram" },
    { code: "return_to_work", label: "Return to Work" },
  ]},
  { category: "Reason for Test", items: [
    { code: "reason_pre_placement", label: "Pre-Placement" },
    { code: "reason_reasonable_suspicion", label: "Reasonable Suspicion" },
    { code: "reason_post_accident", label: "Post Accident" },
    { code: "reason_random", label: "Random" },
    { code: "reason_follow_up", label: "Follow Up" },
  ]},
];

function getAutoServices(visitType: string): string[] {
  switch (visitType) {
    case "dot_physical":
      return ["dot_recertification"];
    case "drug_screen":
      return ["non_dot_drug_lab", "panel_10", "reason_pre_placement"];
    case "respiratory_exam":
      return ["respiratory"];
    case "injury":
      return ["injury", "reason_post_accident"];
    case "new_hire":
      return ["pre_placement", "reason_pre_placement"];
    default:
      return [];
  }
}

function EmployeePassportContent() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [visitType, setVisitType] = useState("");
  const [authName, setAuthName] = useState("");
  const [authTitle, setAuthTitle] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [billingPreference, setBillingPreference] = useState("company_pay");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [ssnLast4, setSsnLast4] = useState("");
  const [employeeDob, setEmployeeDob] = useState("");
  const [employeeAddress, setEmployeeAddress] = useState("");
  const [employeeLocation, setEmployeeLocation] = useState("");
  const [staffingAgency, setStaffingAgency] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [selectedClinicLocationId, setSelectedClinicLocationId] = useState<string>("");
  const [smsPhone, setSmsPhone] = useState("");
  const [generatedQR, setGeneratedQR] = useState<{
    qrUrl: string;
    token: string;
    employee: { firstName: string; lastName: string };
  } | null>(null);

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: clinicLocations = [] } = useQuery<ClinicLocation[]>({
    queryKey: ["/api/clinic-locations"],
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery<ClinicVisit[]>({
    queryKey: ["/api/passport/visits"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/passport/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedQR({
        qrUrl: data.qrUrl,
        token: data.token,
        employee: data.employee,
      });
      setSmsPhone(selectedEmployee?.phoneNumber || "");
      queryClient.invalidateQueries({ queryKey: ["/api/passport/visits"] });
      toast({
        title: "Medical Passport Generated",
        description: "QR code is ready with your signed digital authorization form.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate passport. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendToEmployeeMutation = useMutation({
    mutationFn: async (data: { token: string; qrUrl: string; employeePhone?: string }) => {
      const res = await apiRequest("POST", "/api/passport/send-to-employee", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.results?.sms?.sent) {
        toast({
          title: "Passport Sent",
          description: "The passport link has been texted to the employee.",
        });
      } else if (!data.phoneUsed) {
        toast({
          title: "No Phone Number",
          description: "This employee doesn't have a phone number on file. Use 'Copy Link' to send it manually.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "SMS Failed",
          description: data.results?.sms?.message || "Could not send SMS. Use 'Copy Link' to send manually.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send passport. Use 'Copy Link' to send it manually.",
        variant: "destructive",
      });
    },
  });

  const handleVisitTypeChange = (val: string) => {
    setVisitType(val);
    const autoServices = getAutoServices(val);
    setSelectedServices((prev) => {
      const combined = new Set([...prev, ...autoServices]);
      return Array.from(combined);
    });
  };

  const toggleService = (code: string) => {
    setSelectedServices((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  const handleGenerate = () => {
    if (!selectedEmployee || !visitType) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and visit type.",
        variant: "destructive",
      });
      return;
    }

    if (!authName) {
      toast({
        title: "Missing Authorization",
        description: "Please enter your name as the authorizer.",
        variant: "destructive",
      });
      return;
    }

    if (!signatureDataUrl) {
      toast({
        title: "Signature Required",
        description: "Please sign the authorization with your digital signature.",
        variant: "destructive",
      });
      return;
    }

    const selectedClinic = selectedClinicLocationId ? clinicLocations.find(c => c.id === parseInt(selectedClinicLocationId)) : null;

    generateMutation.mutate({
      employeeId: selectedEmployee.id,
      visitType,
      authorizationName: authName,
      authorizationTitle: authTitle,
      authorizationPhone: authPhone,
      billingPreference,
      specialInstructions: specialInstructions || null,
      additionalServices: selectedServices.length > 0 ? selectedServices : null,
      ssnLast4: ssnLast4 || null,
      employeeDob: employeeDob || null,
      employeeAddress: employeeAddress || null,
      employeeLocation: employeeLocation || null,
      staffingAgency: staffingAgency || null,
      signatureDataUrl,
      clinicLocationId: selectedClinic ? selectedClinic.id : null,
      clinicName: selectedClinic ? `${selectedClinic.name} - ${selectedClinic.city}, ${selectedClinic.state}` : null,
    });
  };

  if (generatedQR) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-sm bg-gray-800/80 border-gray-700 p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={cchLogo} alt="CCH" className="w-6 h-6 object-contain" />
            <h2 className="text-xl font-bold text-white">CCH Medical Passport</h2>
          </div>

          <div className="text-sm text-gray-400">
            {generatedQR.employee.firstName} {generatedQR.employee.lastName}
          </div>

          <div className="bg-white rounded-lg p-4 inline-block mx-auto" data-testid="qr-code-display">
            <QRCodeSVG
              value={generatedQR.qrUrl}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-400">
              Send this passport to the employee via text or copy the link. The employee shows it at the clinic front desk.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge className="bg-green-500/20 text-green-400 no-default-hover-elevate no-default-active-elevate">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Digitally Signed
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 no-default-hover-elevate no-default-active-elevate">
                <FileText className="w-3 h-3 mr-1" /> Auth Form Included
              </Badge>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs text-gray-400">Employee Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="Enter employee phone number"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 text-sm"
                  data-testid="input-sms-phone"
                />
              </div>
              {!smsPhone && (
                <p className="text-xs text-amber-400/80">
                  Enter a phone number to text the passport to the employee
                </p>
              )}
            </div>

            <Button
              className="w-full bg-[#FFC107] text-black font-bold"
              onClick={() => {
                if (!smsPhone.trim()) {
                  toast({
                    title: "Phone Number Required",
                    description: "Please enter the employee's phone number to send the passport via text.",
                    variant: "destructive",
                  });
                  return;
                }
                sendToEmployeeMutation.mutate({
                  token: generatedQR.token,
                  qrUrl: generatedQR.qrUrl,
                  employeePhone: smsPhone.trim(),
                });
              }}
              disabled={sendToEmployeeMutation.isPending || !smsPhone.trim()}
              data-testid="btn-send-to-employee-sms"
            >
              {sendToEmployeeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><MessageSquare className="w-4 h-4 mr-2" /> Text Passport to Employee</>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300"
              onClick={() => {
                navigator.clipboard.writeText(generatedQR.qrUrl);
                toast({ title: "Link Copied", description: "Passport link copied to clipboard. You can text or email it to the employee." });
              }}
              data-testid="btn-copy-link"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </Button>

            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300"
              onClick={() => {
                setGeneratedQR(null);
                setSignatureDataUrl(null);
                setSelectedServices([]);
                setSpecialInstructions("");
                setSsnLast4("");
                setEmployeeDob("");
                setEmployeeAddress("");
                setEmployeeLocation("");
                setStaffingAgency("");
                setSelectedClinicLocationId("");
                setSmsPhone("");
              }}
              data-testid="btn-generate-another"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Generate Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#FFC107]/10">
          <QrCode className="w-6 h-6 text-[#FFC107]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-passport-title">Digital Medical Passport</h1>
          <p className="text-sm text-muted-foreground">The CCH Handshake - Complete digital authorization with signature</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#FFC107]" />
              <h2 className="text-lg font-bold">Patient Information</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Select Employee</Label>
                {loadingEmployees ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading employees...
                  </div>
                ) : employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employees found. Add employees in the Employee Management section first.</p>
                ) : (
                  <Select
                    onValueChange={(val) => {
                      const emp = employees.find((e) => e.id === parseInt(val));
                      setSelectedEmployee(emp || null);
                    }}
                    data-testid="select-employee"
                  >
                    <SelectTrigger data-testid="select-employee-trigger">
                      <SelectValue placeholder="Choose an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)} data-testid={`select-employee-${emp.id}`}>
                          {emp.firstName} {emp.lastName} {emp.position ? `- ${emp.position}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">SSN (Last 4 Digits)</Label>
                <Input
                  placeholder="1234"
                  maxLength={4}
                  value={ssnLast4}
                  onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  data-testid="input-ssn-last4"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Date of Birth</Label>
                <Input
                  type="date"
                  value={employeeDob}
                  onChange={(e) => setEmployeeDob(e.target.value)}
                  data-testid="input-employee-dob"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs">Street Address</Label>
                <Input
                  placeholder="123 Main St, Apt 4"
                  value={employeeAddress}
                  onChange={(e) => setEmployeeAddress(e.target.value)}
                  data-testid="input-employee-address"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Work Location</Label>
                <Input
                  placeholder="Main Plant, Building A"
                  value={employeeLocation}
                  onChange={(e) => setEmployeeLocation(e.target.value)}
                  data-testid="input-employee-location"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Staffing Agency (if applicable)</Label>
                <Input
                  placeholder="Agency name"
                  value={staffingAgency}
                  onChange={(e) => setStaffingAgency(e.target.value)}
                  data-testid="input-staffing-agency"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#FFC107]" />
              <h2 className="text-lg font-bold">Services Requested</h2>
            </div>

            <div className="space-y-2">
              <Label>Primary Visit Type</Label>
              <Select onValueChange={handleVisitTypeChange} value={visitType} data-testid="select-visit-type">
                <SelectTrigger data-testid="select-visit-type-trigger">
                  <SelectValue placeholder="What is this visit for?" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((vt) => (
                    <SelectItem key={vt.value} value={vt.value} data-testid={`select-visit-${vt.value}`}>
                      {vt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {clinicLocations.length > 0 && (
              <div className="space-y-2">
                <Label>Sending Employee To</Label>
                <Select value={selectedClinicLocationId} onValueChange={setSelectedClinicLocationId}>
                  <SelectTrigger data-testid="select-clinic-location-trigger">
                    <SelectValue placeholder="Select clinic location" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicLocations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)} data-testid={`select-clinic-${loc.id}`}>
                        {loc.name} - {loc.city}, {loc.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The selected clinic will receive this info and the notification will include the clinic name.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {ALL_SERVICES.map((cat) => (
                <div key={cat.category}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat.category}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cat.items.map((svc) => (
                      <label
                        key={svc.code}
                        className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded-md hover-elevate"
                        data-testid={`checkbox-service-${svc.code}`}
                      >
                        <Checkbox
                          checked={selectedServices.includes(svc.code)}
                          onCheckedChange={() => toggleService(svc.code)}
                        />
                        <span>{svc.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#FFC107]" />
              <h2 className="text-lg font-bold">Billing & Instructions</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Billing</Label>
                <Select value={billingPreference} onValueChange={setBillingPreference} data-testid="select-billing">
                  <SelectTrigger data-testid="select-billing-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_pay">Company Pay</SelectItem>
                    <SelectItem value="employee_pay">Employee Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Special Instructions / Comments</Label>
              <Textarea
                placeholder="Any special instructions for the clinic..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
                data-testid="input-special-instructions"
              />
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <PenLine className="w-5 h-5 text-[#FFC107]" />
              <h2 className="text-lg font-bold">Digital Authorization & Signature</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Authorized By (Your Name)</Label>
                <Input
                  placeholder="e.g. Maria Rodriguez"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  data-testid="input-auth-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Title</Label>
                <Input
                  placeholder="e.g. Safety Director"
                  value={authTitle}
                  onChange={(e) => setAuthTitle(e.target.value)}
                  data-testid="input-auth-title"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone</Label>
                <Input
                  placeholder="e.g. (313) 555-1234"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  data-testid="input-auth-phone"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <Input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  disabled
                  data-testid="input-auth-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Digital Signature</Label>
              <SignaturePad
                onSignatureChange={setSignatureDataUrl}
                width={380}
                height={120}
              />
            </div>

            <Button
              className="w-full bg-[#FFC107] text-black font-bold"
              onClick={handleGenerate}
              disabled={!selectedEmployee || !visitType || !authName || !signatureDataUrl || generateMutation.isPending}
              data-testid="btn-generate-qr"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Signed Passport...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" /> Generate Signed QR Code
                </>
              )}
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scan className="w-5 h-5 text-[#FFC107]" />
              <h2 className="text-lg font-bold">How It Works</h2>
            </div>
            <div className="space-y-4">
              {[
                { icon: FileText, title: "Fill the Form", desc: "Complete the digital authorization form with patient info and services" },
                { icon: PenLine, title: "Sign It", desc: "Add your digital signature to authorize treatment or services" },
                { icon: QrCode, title: "Generate QR", desc: "A QR code is created containing the complete signed authorization" },
                { icon: Smartphone, title: "Send to Employee", desc: "Enter the employee's phone number and text the passport link directly - works from any device" },
                { icon: Scan, title: "Clinic Scans", desc: "Clinic gets the signed form instantly - no phone call needed" },
                { icon: Send, title: "You're Notified", desc: "Get an instant 'I'm Here' SMS when they arrive" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFC107]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <step.icon className="w-4 h-4 text-[#FFC107]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-[#FFC107]" />
              <h2 className="text-lg font-bold">Recent Visits</h2>
            </div>
            {loadingVisits ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clinic visits yet. Generate your first passport above.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {visits.slice(0, 10).map((visit) => {
                  const typeLabel = VISIT_TYPES.find((vt) => vt.value === visit.visitType)?.label || visit.visitType;
                  return (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
                      data-testid={`visit-row-${visit.id}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{typeLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {visit.checkedInAt ? new Date(visit.checkedInAt).toLocaleDateString() : ""}
                            {visit.notifiedAt && (
                              <span className="ml-1">
                                &middot; Arrived {new Date(visit.notifiedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </span>
                            )}
                            {visit.returnedAt && (
                              <span className="ml-1">
                                &middot; Returned {new Date(visit.returnedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </span>
                            )}
                            {visit.notifiedAt && visit.returnedAt && (() => {
                              const dur = Math.max(0, Math.round((new Date(visit.returnedAt).getTime() - new Date(visit.notifiedAt).getTime()) / 60000));
                              const h = Math.floor(dur / 60);
                              const m = dur % 60;
                              return <span className="ml-1 text-[#FFC107]">&middot; {h > 0 ? `${h}h ${m}m` : `${m}m`} away</span>;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        {visit.employerNotified && !visit.returnedAt && (
                          <Badge variant="outline" className="text-xs">
                            <Send className="w-3 h-3 mr-1" /> Arrived{visit.notifiedAt ? ` ${new Date(visit.notifiedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
                          </Badge>
                        )}
                        {visit.returnedAt && (
                          <Badge variant="outline" className="text-xs border-blue-400/40 text-blue-500" data-testid={`badge-returned-${visit.id}`}>
                            <ArrowLeftRight className="w-3 h-3 mr-1" />
                            {visit.notifiedAt ? (() => {
                              const dur = Math.max(0, Math.round((new Date(visit.returnedAt).getTime() - new Date(visit.notifiedAt).getTime()) / 60000));
                              const h = Math.floor(dur / 60);
                              const m = dur % 60;
                              return h > 0 ? `${h}h ${m}m` : `${m}m`;
                            })() : "Returned"}
                          </Badge>
                        )}
                        <Badge
                          className={
                            visit.status === "completed"
                              ? "bg-green-500/20 text-green-600 no-default-hover-elevate"
                              : "bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate"
                          }
                        >
                          {visit.status === "completed" ? "Complete" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EmployeePassport() {
  return (
    <ProtectedLayout>
      <EmployeePassportContent />
    </ProtectedLayout>
  );
}
