import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, User, Briefcase, Users, MapPin,
  CheckSquare, Square, ArrowRight, ArrowLeft, Bot, Loader2
} from "lucide-react";
import coreyImg from "@assets/9_1771983400638.png";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia"
];

const ROLES = [
  "Safety Manager / EHS Director",
  "HR Director / HR Manager",
  "Plant Manager / Operations Manager",
  "EHS Coordinator",
  "Owner / Operator",
  "Office Manager / Admin",
  "Nurse / Occupational Health",
  "Other",
];

const INDUSTRIES = [
  "Manufacturing",
  "Construction",
  "Healthcare / Hospitals",
  "Transportation / DOT",
  "Warehousing & Distribution",
  "Agriculture / Farming",
  "Oil, Gas & Energy",
  "Retail / Food Service",
  "Government / Municipality",
  "Other",
];

const EMPLOYEE_COUNTS = ["1–25", "26–100", "101–250", "251–500", "500+"];

const COMPLIANCE_FOCUS_OPTIONS = [
  "OSHA Recordkeeping (300 Log)",
  "DOT Compliance",
  "Drug & Alcohol Testing",
  "Injury Case Management",
  "Safety Training Programs",
  "Hazard Communication / SDS",
  "Lockout/Tagout (LOTO)",
  "Respiratory Protection",
  "Confined Space Programs",
  "PPE Programs",
  "Incident Investigation",
  "OSHA Inspections / Citations",
];

interface ProfileForm {
  preferredName: string;
  companyName: string;
  role: string;
  industry: string;
  employeeCount: string;
  state: string;
  complianceFocus: string[];
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current ? "bg-blue-400 w-8" : i === current ? "bg-blue-400 w-12" : "bg-white/20 w-8"
          }`}
        />
      ))}
    </div>
  );
}

function MultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-500/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
            }`}
            data-testid={`checkbox-focus-${opt.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-white/30 shrink-0" />
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function CoreyProfile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const { data: existingProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/corey-profile"],
    queryFn: async () => {
      const res = await fetch("/api/corey-profile", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    retry: false,
  });

  const [form, setForm] = useState<ProfileForm>({
    preferredName: "",
    companyName: "",
    role: "",
    industry: "",
    employeeCount: "",
    state: "",
    complianceFocus: [],
  });

  const set = (field: keyof ProfileForm, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const res = await apiRequest("POST", "/api/corey-profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corey-profile"] });
      navigate("/welcome-corey");
    },
    onError: () => {
      toast({ title: "Couldn't save profile", description: "Please try again.", variant: "destructive" });
    },
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const steps = [
    {
      title: "What should Corey call you?",
      subtitle: "Start by telling Corey your name and company.",
      icon: <User className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="space-y-5">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Preferred Name</Label>
            <Input
              value={form.preferredName}
              onChange={(e) => set("preferredName", e.target.value)}
              placeholder="e.g. Mario"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
              data-testid="input-preferred-name"
            />
            <p className="text-white/40 text-xs mt-1.5">Corey will use this to address you personally.</p>
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Company / Organization Name</Label>
            <Input
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="e.g. ACSI Quality"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500/50"
              data-testid="input-company-name"
            />
          </div>
        </div>
      ),
      canAdvance: form.preferredName.trim().length > 0 && form.companyName.trim().length > 0,
    },
    {
      title: "Tell Corey about your role.",
      subtitle: "This helps Corey pitch his answers at the right level.",
      icon: <Briefcase className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="space-y-3">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set("role", r)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                form.role === r
                  ? "border-blue-500 bg-blue-500/10 text-white font-medium"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
              }`}
              data-testid={`option-role-${r.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
            >
              {r}
            </button>
          ))}
        </div>
      ),
      canAdvance: form.role.length > 0,
    },
    {
      title: "What industry are you in?",
      subtitle: "Corey will tailor regulatory references to your sector.",
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="space-y-3">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => set("industry", ind)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                form.industry === ind
                  ? "border-blue-500 bg-blue-500/10 text-white font-medium"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
              }`}
              data-testid={`option-industry-${ind.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
            >
              {ind}
            </button>
          ))}
        </div>
      ),
      canAdvance: form.industry.length > 0,
    },
    {
      title: "How big is your team?",
      subtitle: "Employee count and state help Corey apply the right thresholds.",
      icon: <Users className="w-5 h-5 text-blue-400" />,
      content: (
        <div className="space-y-5">
          <div>
            <Label className="text-white/70 text-sm mb-3 block">Number of Employees</Label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYEE_COUNTS.map((ec) => (
                <button
                  key={ec}
                  type="button"
                  onClick={() => set("employeeCount", ec)}
                  className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    form.employeeCount === ec
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
                  }`}
                  data-testid={`option-employees-${ec}`}
                >
                  {ec}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              State of Operation
            </Label>
            <select
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              data-testid="select-state"
            >
              <option value="" className="bg-slate-900">Select a state...</option>
              {US_STATES.map((s) => (
                <option key={s} value={s} className="bg-slate-900">{s}</option>
              ))}
            </select>
            <p className="text-white/40 text-xs mt-1.5">State plans, threshold rules, and citations vary by state.</p>
          </div>
        </div>
      ),
      canAdvance: form.employeeCount.length > 0 && form.state.length > 0,
    },
    {
      title: "What are your top compliance concerns?",
      subtitle: "Corey will proactively surface the areas that matter most to you.",
      icon: <CheckSquare className="w-5 h-5 text-blue-400" />,
      content: (
        <MultiSelect
          options={COMPLIANCE_FOCUS_OPTIONS}
          selected={form.complianceFocus}
          onChange={(v) => set("complianceFocus", v)}
        />
      ),
      canAdvance: form.complianceFocus.length > 0,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      saveMutation.mutate(form);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-8">

        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={coreyImg}
            alt="Corey"
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30 shadow-lg shadow-blue-500/20"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight">Let's Set Up Your Corey Profile</h1>
            <p className="text-white/50 text-sm mt-1">
              5 quick questions so Corey knows your world from day one.
            </p>
          </div>
          <StepIndicator current={step} total={steps.length} />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
              {currentStep.icon}
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight" data-testid="text-step-title">
                {currentStep.title}
              </h2>
              <p className="text-white/50 text-xs mt-0.5">{currentStep.subtitle}</p>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[55vh]">
            {currentStep.content}
          </div>
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5"
              data-testid="button-profile-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!currentStep.canAdvance || saveMutation.isPending}
            className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold gap-2 disabled:opacity-40"
            data-testid="button-profile-next"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLastStep ? "Save My Profile & Continue" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        <p className="text-white/30 text-xs text-center -mt-4">
          You can update your profile anytime in Settings.
        </p>

      </div>
    </div>
  );
}
