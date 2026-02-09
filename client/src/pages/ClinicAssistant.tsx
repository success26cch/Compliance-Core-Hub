import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import BilingualAssistant from "@/components/BilingualAssistant";
import PrintableAuthForm from "@/components/PrintableAuthForm";
import {
  Shield,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  FileCheck,
  FileDown,
  Stethoscope,
  Calendar,
  QrCode,
  FileText,
  Printer,
} from "lucide-react";

interface ClinicLocationInfo {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface PassportData {
  visit: {
    id: number;
    visitType: string;
    status: string;
    employerNotified: boolean;
    checkedInAt: string;
    billingPreference: string | null;
    specialInstructions: string | null;
    additionalServices: string[] | null;
    ssnLast4: string | null;
    employeeDob: string | null;
    employeeAddress: string | null;
    employeeLocation: string | null;
    staffingAgency: string | null;
    clinicLocationId: number | null;
  };
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    position: string | null;
    department: string | null;
    email: string | null;
  };
  company: {
    companyName: string;
    industry: string | null;
    dotNumber: string | null;
    derName: string | null;
    derPhone: string | null;
    derEmail: string | null;
    clinicName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  } | null;
  authorization: {
    name: string;
    title: string | null;
    phone: string | null;
    timestamp: string;
    signatureDataUrl: string | null;
  } | null;
  authorizationForm: {
    formName: string;
    visitType: string;
  } | null;
  clinicLocation: ClinicLocationInfo | null;
  allClinicLocations: ClinicLocationInfo[];
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  dot_physical: "DOT Physical",
  drug_screen: "Drug Screen",
  respiratory_exam: "Respiratory Exam",
  injury: "Injury Evaluation",
  new_hire: "New Hire Intake",
  other: "Medical Visit",
};

export default function ClinicAssistant() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const { toast } = useToast();

  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [clinicNameInput, setClinicNameInput] = useState("");
  const [detectedClinicId, setDetectedClinicId] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "detecting" | "detected" | "failed" | "manual">("idle");
  const [showAssistant, setShowAssistant] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [downloadingForm, setDownloadingForm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No passport token provided. Please scan a valid QR code.");
      setLoading(false);
      return;
    }

    fetch(`/api/passport/lookup/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid or expired passport");
        return res.json();
      })
      .then((data: PassportData) => {
        setPassportData(data);
        setNotified(data.visit.employerNotified);
        if (data.clinicLocation) {
          setClinicNameInput(`${data.clinicLocation.name} - ${data.clinicLocation.city}, ${data.clinicLocation.state}`);
          setDetectedClinicId(data.clinicLocation.id);
          setGeoStatus("detected");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load passport data");
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (!passportData || passportData.clinicLocation || geoStatus !== "idle") return;
    const locations = passportData.allClinicLocations || [];
    const geoLocations = locations.filter(l => l.latitude && l.longitude);
    if (geoLocations.length === 0) {
      setGeoStatus("manual");
      return;
    }

    setGeoStatus("detecting");
    if (!navigator.geolocation) {
      setGeoStatus("manual");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        let nearest: ClinicLocationInfo | null = null;
        let nearestDist = Infinity;

        for (const loc of geoLocations) {
          const lat = parseFloat(loc.latitude!);
          const lng = parseFloat(loc.longitude!);
          const dist = Math.sqrt(Math.pow(userLat - lat, 2) + Math.pow(userLng - lng, 2));
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = loc;
          }
        }

        const MAX_DISTANCE_DEG = 0.5;
        if (nearest && nearestDist < MAX_DISTANCE_DEG) {
          setClinicNameInput(`${nearest.name} - ${nearest.city}, ${nearest.state}`);
          setDetectedClinicId(nearest.id);
          setGeoStatus("detected");
        } else {
          setGeoStatus("manual");
        }
      },
      () => {
        setGeoStatus("manual");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [passportData, geoStatus]);

  const handleNotifyEmployer = async () => {
    if (!token) return;
    setNotifying(true);
    try {
      const res = await fetch(`/api/passport/notify-employer/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: clinicNameInput || undefined,
          clinicLocationId: detectedClinicId || undefined,
        }),
      });
      const data = await res.json();
      setNotified(true);
      toast({
        title: "Employer Notified",
        description: data.smsResult?.sent
          ? `SMS sent to employer for ${data.employeeName}`
          : `Notification logged for ${data.employeeName}. ${data.smsResult?.message || ""}`,
      });
    } catch {
      toast({
        title: "Notification Failed",
        description: "Could not notify employer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setNotifying(false);
    }
  };

  const handleDownloadForm = async () => {
    if (!token) return;
    setDownloadingForm(true);
    try {
      const res = await fetch(`/api/passport/form/${token}`);
      if (!res.ok) throw new Error("Form not available");
      const data = await res.json();
      const link = document.createElement("a");
      link.href = data.fileData;
      link.download = data.formName || "authorization-form.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast({
        title: "Download Failed",
        description: "Could not download the authorization form.",
        variant: "destructive",
      });
    } finally {
      setDownloadingForm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#FFC107] mx-auto" />
          <p className="text-gray-400">Loading Medical Passport...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/80 border-gray-700 p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Invalid Passport</h2>
          <p className="text-gray-400">{error}</p>
          <p className="text-sm text-gray-500">Please ask the employee to generate a new QR code from their CCH app.</p>
        </Card>
      </div>
    );
  }

  if (!passportData) return null;

  const { visit, employee, company, authorization } = passportData;
  const visitLabel = VISIT_TYPE_LABELS[visit.visitType] || visit.visitType;
  const hasDigitalAuthForm = authorization && authorization.signatureDataUrl;

  if (showAuthForm && authorization) {
    return (
      <div className="min-h-screen bg-white print:bg-white p-4 print:p-0">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 print:hidden">
            <Button
              variant="outline"
              onClick={() => setShowAuthForm(false)}
              data-testid="btn-back-from-form"
            >
              Back to Passport
            </Button>
          </div>
          <PrintableAuthForm
            data={{
              visit,
              employee,
              company,
              authorization,
            }}
          />
        </div>
      </div>
    );
  }

  if (showAssistant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        <div className="bg-gray-800/80 border-b border-gray-700 p-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FFC107]" />
              <span className="text-sm font-bold text-white">
                {employee.firstName} {employee.lastName}
              </span>
              <Badge className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate text-xs">
                {visitLabel}
              </Badge>
              {company && (
                <span className="text-xs text-gray-400">| {company.companyName}</span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300"
              onClick={() => setShowAssistant(false)}
              data-testid="btn-back-to-passport"
            >
              Back to Passport
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <BilingualAssistant
            prefilledName={`${employee.firstName} ${employee.lastName}`}
            prefilledCompany={company?.companyName}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-[#FFC107]" />
            <h1 className="text-2xl font-bold text-white" data-testid="text-clinic-title">CCH Medical Passport</h1>
          </div>
          <p className="text-sm text-gray-400">Verified Employee Check-In</p>
        </div>

        <Card className="bg-gray-800/80 border-gray-700 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FFC107]/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-[#FFC107]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white" data-testid="text-employee-name">
                {employee.firstName} {employee.lastName}
              </h2>
              {employee.position && (
                <p className="text-sm text-gray-400">{employee.position}</p>
              )}
              {employee.department && (
                <p className="text-xs text-gray-500">{employee.department}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-[#FFC107]/20 text-[#FFC107] no-default-hover-elevate no-default-active-elevate">
              <Stethoscope className="w-3 h-3 mr-1" /> {visitLabel}
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 no-default-hover-elevate no-default-active-elevate">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
            </Badge>
            {visit.billingPreference && (
              <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                {visit.billingPreference === "company_pay" ? "Company Pay" : "Employee Pay"}
              </Badge>
            )}
          </div>
        </Card>

        {company && (
          <Card className="bg-gray-800/80 border-gray-700 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FFC107]" />
              <h3 className="text-sm font-bold text-white">Company Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Company</span>
                <span className="text-white font-medium" data-testid="text-company-name">{company.companyName}</span>
              </div>
              {company.industry && (
                <div>
                  <span className="text-xs text-gray-400 block">Industry</span>
                  <span className="text-white">{company.industry}</span>
                </div>
              )}
              {company.dotNumber && (
                <div>
                  <span className="text-xs text-gray-400 block">DOT Number</span>
                  <span className="text-white">{company.dotNumber}</span>
                </div>
              )}
              {company.phone && (
                <div>
                  <span className="text-xs text-gray-400 block">Phone</span>
                  <span className="text-white">{company.phone}</span>
                </div>
              )}
            </div>
            {company.derName && (
              <div className="border-t border-gray-700 pt-3 mt-2">
                <span className="text-xs text-gray-400 block mb-1">DER Contact (Designated Employer Rep)</span>
                <p className="text-sm text-white font-medium">{company.derName}</p>
                {company.derPhone && <p className="text-xs text-gray-400">{company.derPhone}</p>}
              </div>
            )}
          </Card>
        )}

        {authorization && (
          <Card className="bg-gray-800/80 border-green-500/30 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-bold text-green-400">Digital Authorization</h3>
            </div>
            <p className="text-sm text-white">
              <span className="font-semibold">{authorization.name}</span>
              {authorization.title && <span className="text-gray-400"> - {authorization.title}</span>}
            </p>
            {authorization.phone && (
              <p className="text-xs text-gray-400">Phone: {authorization.phone}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              Authorized: {new Date(authorization.timestamp).toLocaleString()}
            </div>
            {authorization.signatureDataUrl && (
              <div className="bg-white rounded p-2 inline-block mt-1">
                <img
                  src={authorization.signatureDataUrl}
                  alt="Digital Signature"
                  className="h-10 max-w-[180px] object-contain"
                  data-testid="img-signature-preview"
                />
              </div>
            )}
            <p className="text-xs text-green-400/70 mt-1">
              This employee is authorized for the visit. No phone call to the employer is needed.
            </p>
          </Card>
        )}

        {hasDigitalAuthForm && (
          <Card className="bg-gray-800/80 border-[#FFC107]/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FFC107]" />
              <h3 className="text-sm font-bold text-white">Signed Authorization Form</h3>
            </div>
            <p className="text-xs text-gray-400">
              View and print the complete, digitally signed authorization form with all services and patient information.
            </p>
            <Button
              className="w-full bg-[#FFC107] text-black font-bold"
              onClick={() => setShowAuthForm(true)}
              data-testid="btn-view-auth-form"
            >
              <Printer className="w-4 h-4 mr-2" /> View & Print Authorization Form
            </Button>
          </Card>
        )}

        {passportData.authorizationForm && (
          <Card className="bg-gray-800/80 border-blue-500/30 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                {hasDigitalAuthForm ? "Additional Clinic Form" : "Clinic Authorization Form"}
              </h3>
            </div>
            <p className="text-xs text-gray-400">
              {hasDigitalAuthForm
                ? "The employer has also uploaded an additional form for this visit type."
                : "The employer has uploaded an authorization form for this visit type. Download or print it for your records."}
            </p>
            <Button
              className="w-full bg-blue-600 text-white font-semibold"
              onClick={handleDownloadForm}
              disabled={downloadingForm}
              data-testid="btn-download-form"
            >
              {downloadingForm ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" /> Download: {passportData.authorizationForm.formName}
                </>
              )}
            </Button>
          </Card>
        )}

        <Card className="bg-gray-800/80 border-[#FFC107]/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#FFC107]" />
            <h3 className="text-sm font-bold text-white">"I'm Here" Notification</h3>
          </div>

          {notified ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Employer has been notified of this visit.
            </div>
          ) : (
            <div className="space-y-3">
              {geoStatus === "detecting" && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detecting your clinic location...
                </div>
              )}

              {geoStatus === "detected" && clinicNameInput && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Clinic Location</label>
                  <div className="flex items-center gap-2 bg-gray-900/60 border border-green-500/40 rounded-md p-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-sm text-white">{clinicNameInput}</span>
                  </div>
                  <p className="text-xs text-green-400/70">
                    {passportData?.clinicLocation ? "Clinic pre-selected by employer" : "Location auto-detected"}
                  </p>
                </div>
              )}

              {(geoStatus === "manual" || geoStatus === "failed") && (
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">
                    {(passportData?.allClinicLocations?.length ?? 0) > 0 ? "Select or enter clinic" : "Clinic Name (optional)"}
                  </label>
                  {(passportData?.allClinicLocations?.length ?? 0) > 0 ? (
                    <div className="space-y-2">
                      {passportData!.allClinicLocations.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setClinicNameInput(`${loc.name} - ${loc.city}, ${loc.state}`);
                            setDetectedClinicId(loc.id);
                            setGeoStatus("detected");
                          }}
                          className="w-full text-left p-2.5 rounded-md bg-gray-900/60 border border-gray-700 hover-elevate"
                          data-testid={`btn-select-clinic-${loc.id}`}
                        >
                          <p className="text-sm text-white font-medium">{loc.name}</p>
                          <p className="text-xs text-gray-400">{loc.address}, {loc.city}, {loc.state} {loc.zipCode}</p>
                        </button>
                      ))}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 py-1">or type manually:</p>
                      </div>
                    </div>
                  ) : null}
                  <Input
                    placeholder="e.g. HealthFirst Occupational Clinic"
                    className="bg-gray-900/60 border-gray-700 text-white"
                    value={clinicNameInput}
                    onChange={(e) => {
                      setClinicNameInput(e.target.value);
                      setDetectedClinicId(null);
                    }}
                    data-testid="input-clinic-name"
                  />
                </div>
              )}

              <Button
                className="w-full bg-[#FFC107] text-black font-bold"
                onClick={handleNotifyEmployer}
                disabled={notifying || geoStatus === "detecting"}
                data-testid="btn-notify-employer"
              >
                {notifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Notify Employer - "Employee Has Arrived"
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        <Button
          className="w-full bg-[#FFC107] text-black font-bold text-base py-6"
          onClick={() => setShowAssistant(true)}
          data-testid="btn-open-assistant"
        >
          <QrCode className="w-5 h-5 mr-2" /> Open Bilingual Clinical Assistant
        </Button>

        <p className="text-center text-xs text-gray-500 pb-4">
          Powered by Core Compliance Hub - The One Stop Employer Shop
        </p>
      </div>
    </div>
  );
}
