import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ProtectedLayout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Smartphone,
  Shield,
  Clock,
  CheckCircle2,
  User,
  Building2,
  ArrowLeft,
  Loader2,
  Scan,
  Send,
  History,
} from "lucide-react";
import type { Employee, ClinicVisit } from "@shared/schema";

const VISIT_TYPES = [
  { value: "dot_physical", label: "DOT Physical" },
  { value: "drug_screen", label: "Drug Screen" },
  { value: "respiratory_exam", label: "Respiratory Exam" },
  { value: "injury", label: "Injury Evaluation" },
  { value: "new_hire", label: "New Hire Intake" },
  { value: "other", label: "Other Medical Visit" },
];

function EmployeePassportContent() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [visitType, setVisitType] = useState("");
  const [authName, setAuthName] = useState("");
  const [authTitle, setAuthTitle] = useState("");
  const [generatedQR, setGeneratedQR] = useState<{
    qrUrl: string;
    token: string;
    employee: { firstName: string; lastName: string };
  } | null>(null);

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery<ClinicVisit[]>({
    queryKey: ["/api/passport/visits"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: {
      employeeId: number;
      visitType: string;
      authorizationName: string;
      authorizationTitle: string;
    }) => {
      const res = await apiRequest("POST", "/api/passport/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedQR({
        qrUrl: data.qrUrl,
        token: data.token,
        employee: data.employee,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/passport/visits"] });
      toast({
        title: "Medical Passport Generated",
        description: "QR code is ready for the employee to present at the clinic.",
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

  const handleGenerate = () => {
    if (!selectedEmployee || !visitType) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and visit type.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      employeeId: selectedEmployee.id,
      visitType,
      authorizationName: authName,
      authorizationTitle: authTitle,
    });
  };

  if (generatedQR) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-sm bg-gray-800/80 border-gray-700 p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-[#FFC107]" />
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
              Present this QR code at the clinic front desk. The medical assistant will scan it to access your visit information.
            </p>
            <Badge className="bg-green-500/20 text-green-400 no-default-hover-elevate no-default-active-elevate">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Authorization Included
            </Badge>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300"
              onClick={() => setGeneratedQR(null)}
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#FFC107]/10">
          <QrCode className="w-6 h-6 text-[#FFC107]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-passport-title">Digital Medical Passport</h1>
          <p className="text-sm text-muted-foreground">The CCH Handshake - Send employees to the clinic with a single QR scan</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#FFC107]" />
            <h2 className="text-lg font-bold">Generate Clinic QR</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
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
              <Label>Visit Type</Label>
              <Select onValueChange={setVisitType} data-testid="select-visit-type">
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

            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#FFC107]" />
                <span className="text-sm font-semibold">Digital Authorization</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Authorizer Name</Label>
                  <Input
                    placeholder="e.g. Maria Rodriguez"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    data-testid="input-auth-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input
                    placeholder="e.g. Safety Director"
                    value={authTitle}
                    onChange={(e) => setAuthTitle(e.target.value)}
                    data-testid="input-auth-title"
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-[#FFC107] text-black font-bold"
              onClick={handleGenerate}
              disabled={!selectedEmployee || !visitType || generateMutation.isPending}
              data-testid="btn-generate-qr"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" /> Generate Clinic QR Code
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scan className="w-5 h-5 text-[#FFC107]" />
              <h2 className="text-lg font-bold">How It Works</h2>
            </div>
            <div className="space-y-4">
              {[
                { icon: QrCode, title: "Generate QR", desc: "Select the employee and visit type, add your digital authorization" },
                { icon: Smartphone, title: "Employee Shows QR", desc: "Employee presents the QR code on their phone at the clinic" },
                { icon: Scan, title: "Clinic Scans", desc: "Medical assistant scans and gets bilingual tools with employee data pre-loaded" },
                { icon: Send, title: "Employer Notified", desc: "You get an instant 'I'm Here' SMS notification" },
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
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {visit.employerNotified && (
                          <Badge variant="outline" className="text-xs">
                            <Send className="w-3 h-3 mr-1" /> Notified
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
