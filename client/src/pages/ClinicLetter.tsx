import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  ArrowLeft,
  Shield,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Building2,
  User,
  Phone,
  MapPin,
  Loader2,
  ClipboardList,
} from "lucide-react";
import logoUrl from "@assets/8_1772230567281.png";

export default function ClinicLetter() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyContact: "",
    companyContactTitle: "",
    clinicName: "",
    employeeName: "",
    injuryType: "",
    injuryDescription: "",
    dateOfInjury: "",
  });

  const { data: injuryTypes = [] } = useQuery<{ value: string; label: string }[]>({
    queryKey: ["/api/clinic-letter/injury-types"],
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.companyName.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    if (!formData.injuryType) {
      toast({ title: "Please select an injury type", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/clinic-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate letter");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Clinic-Communication-Letter-${formData.companyName.replace(/[^a-zA-Z0-9]/g, "-")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Letter Generated!",
        description: "Your clinic communication letter has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error generating letter",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/training">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" data-testid="link-back-training">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Training
            </Button>
          </Link>
        </div>

        <div className="text-center mb-10">
          <img src={logoUrl} alt="Core Compliance Hub" className="h-32 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2 text-white" data-testid="text-page-title">
            <FileText className="inline w-8 h-8 mr-3 text-blue-400" />
            Employer Clinic Communication Letter
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto">
            Generate a professional, injury-specific letter for your occupational health provider requesting
            first-aid-level treatment per 29 CFR 1904.7(a) — helping keep cases non-recordable when clinically appropriate.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-medium">Free — Included with Employer Platform</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-blue-700/30 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Sets Expectations</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Clearly communicates your company's preference for first-aid-level treatment when clinically appropriate,
              helping clinics understand OSHA recordkeeping implications.
            </p>
          </Card>

          <Card className="bg-slate-800/50 border-green-700/30 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-white">Injury-Specific</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Provides specific first-aid treatment options for each injury type — lacerations, strains, burns,
              eye injuries, and more — based on 29 CFR 1904.7(a).
            </p>
          </Card>

          <Card className="bg-slate-800/50 border-amber-700/30 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-white">Flags Recordable Triggers</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Lists specific treatments that cross the OSHA recordability threshold so your clinic knows
              which treatment choices to avoid when alternatives exist.
            </p>
          </Card>
        </div>

        <Card className="bg-slate-800/60 border-slate-700 p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
            <ClipboardList className="w-6 h-6 text-blue-400" />
            Generate Your Letter
          </h2>

          <div className="space-y-6">
            <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600/50">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Company Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="text-slate-300">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Your Company Name"
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-company-name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone" className="text-slate-300">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    value={formData.companyPhone}
                    onChange={(e) => updateField("companyPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-company-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="companyContact" className="text-slate-300">Contact Person</Label>
                  <Input
                    id="companyContact"
                    value={formData.companyContact}
                    onChange={(e) => updateField("companyContact", e.target.value)}
                    placeholder="Safety Manager Name"
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-company-contact"
                  />
                </div>
                <div>
                  <Label htmlFor="companyContactTitle" className="text-slate-300">Title</Label>
                  <Input
                    id="companyContactTitle"
                    value={formData.companyContactTitle}
                    onChange={(e) => updateField("companyContactTitle", e.target.value)}
                    placeholder="Safety Director"
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-company-title"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="companyAddress" className="text-slate-300">Company Address</Label>
                  <Input
                    id="companyAddress"
                    value={formData.companyAddress}
                    onChange={(e) => updateField("companyAddress", e.target.value)}
                    placeholder="123 Main St, City, State ZIP"
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-company-address"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-5 border border-slate-600/50">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-green-400" />
                Clinic & Injury Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clinicName" className="text-slate-300">Clinic / Provider Name</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => updateField("clinicName", e.target.value)}
                    placeholder="Clinic or Provider Name"
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-clinic-name"
                  />
                </div>
                <div>
                  <Label htmlFor="employeeName" className="text-slate-300">Employee Name</Label>
                  <Input
                    id="employeeName"
                    value={formData.employeeName}
                    onChange={(e) => updateField("employeeName", e.target.value)}
                    placeholder="Employee Name"
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-employee-name"
                  />
                </div>
                <div>
                  <Label htmlFor="injuryType" className="text-slate-300">Injury Type *</Label>
                  <Select
                    value={formData.injuryType}
                    onValueChange={(val) => updateField("injuryType", val)}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white mt-1" data-testid="select-injury-type">
                      <SelectValue placeholder="Select injury type" />
                    </SelectTrigger>
                    <SelectContent>
                      {injuryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} data-testid={`option-injury-${type.value}`}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateOfInjury" className="text-slate-300">Date of Injury</Label>
                  <Input
                    id="dateOfInjury"
                    type="date"
                    value={formData.dateOfInjury}
                    onChange={(e) => updateField("dateOfInjury", e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    data-testid="input-date-of-injury"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="injuryDescription" className="text-slate-300">Injury Description</Label>
                  <Textarea
                    id="injuryDescription"
                    value={formData.injuryDescription}
                    onChange={(e) => updateField("injuryDescription", e.target.value)}
                    placeholder="Briefly describe the injury (e.g., Employee cut left index finger on sheet metal edge while handling material)"
                    rows={3}
                    className="bg-slate-900/50 border-slate-600 text-white mt-1 resize-none"
                    data-testid="input-injury-description"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <p className="text-slate-500 text-xs max-w-md">
                This letter is for informational purposes only and does not constitute legal advice.
                All treatment decisions remain at the treating provider's clinical discretion.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generating || !formData.companyName || !formData.injuryType}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold min-w-[240px]"
                data-testid="button-generate-letter"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Clinic Letter (Word)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-800/40 border-slate-700 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            What's Included in the Letter
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">Injury-specific first-aid treatment preferences per 29 CFR 1904.7(a)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">Clear list of treatments that trigger OSHA recordability</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">Clinical notes explaining the first-aid vs. medical treatment distinction</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">Complete 29 CFR 1904.7(a) first-aid treatment summary</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">Professional employer letterhead with CCHUB partner branding</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">Respectful language that preserves clinical decision-making authority</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center mt-8 text-slate-500 text-xs">
          <p>Core Compliance Hub — THE ONE STOP EMPLOYER SHOP | A DBA of ACSI</p>
          <p className="mt-1">www.corecompliancehub.com</p>
        </div>
      </div>
    </div>
  );
}
