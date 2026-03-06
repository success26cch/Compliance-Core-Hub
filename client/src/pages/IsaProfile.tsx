import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";

const ORANGE = "hsl(24,95%,53%)";
const BG = "hsl(222,47%,11%)";

const CORE_STANDARDS = [
  { id: "ISO 9001:2015", label: "ISO 9001:2015", desc: "Quality Management" },
  { id: "ISO 14001:2015", label: "ISO 14001:2015", desc: "Environmental Management" },
  { id: "ISO 45001:2018", label: "ISO 45001:2018", desc: "OH&S Management" },
];

const PRO_STANDARDS = [
  ...CORE_STANDARDS,
  { id: "IATF 16949:2016", label: "IATF 16949:2016", desc: "Automotive Quality" },
  { id: "AS9100 Rev D", label: "AS9100 Rev D", desc: "Aerospace Quality" },
  { id: "ISO 13485:2016", label: "ISO 13485:2016", desc: "Medical Devices" },
  { id: "ISO/IEC 27001:2022", label: "ISO/IEC 27001:2022", desc: "Information Security" },
];

const ROLES = [
  "Quality Manager", "Internal Auditor", "Management Representative",
  "Quality Engineer", "Compliance Manager", "Operations Manager",
  "EHS Manager", "Consultant", "Other",
];

const FOCUS_OPTIONS = [
  "Certification preparation", "Internal audit program", "Corrective action management",
  "Management review prep", "Gap analysis", "Supplier quality management",
  "Document control", "Risk & opportunity management", "Continual improvement",
  "Standard transition or upgrade", "Multi-standard integration",
];

export default function IsaProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: subStatus } = useQuery<any>({ queryKey: ["/api/subscriptions/status"] });
  const isIsaPro = subStatus?.isIsaPro;
  const standards = isIsaPro ? PRO_STANDARDS : CORE_STANDARDS;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [preferredName, setPreferredName] = useState(user?.firstName || "");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const toggleStandard = (id: string) => {
    setSelectedStandards(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleFocus = (f: string) => {
    setFocusAreas(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : prev.length < 5 ? [...prev, f] : prev
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await apiRequest("POST", "/api/isa-profile", {
        preferredName: preferredName.trim() || user?.firstName,
        companyName: companyName.trim(),
        role: role.trim(),
        selectedStandards,
        focusAreas,
      });
      setLocation("/welcome-isa");
    } catch {
      toast({ title: "Error", description: "Failed to save profile. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const STEPS = ["Your Standards", "About You", "Focus Areas"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: BG }}>
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-4 shadow-lg"
            style={{ background: ORANGE }}
          >
            I
          </div>
          <h1 className="text-2xl font-black text-white text-center">Set Up Your Isa Profile</h1>
          <p className="text-white/50 text-sm mt-1 text-center">Isa uses this to personalize every answer to your standards and goals.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i + 1 < step ? ORANGE : i + 1 === step ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
                    color: i + 1 <= step ? "white" : "rgba(255,255,255,0.35)",
                    border: i + 1 === step ? `2px solid ${ORANGE}` : "2px solid transparent",
                  }}
                >
                  {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[10px] mt-1 font-medium" style={{ color: i + 1 === step ? ORANGE : "rgba(255,255,255,0.3)" }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px mb-4" style={{ background: i + 1 < step ? ORANGE : "rgba(255,255,255,0.1)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Standard Selection */}
        {step === 1 && (
          <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.04]">
            <h2 className="text-white font-bold text-lg mb-1">Which standards are you working with?</h2>
            <p className="text-white/45 text-sm mb-5">Select all that apply. Isa will focus her answers on your chosen standards.</p>
            <div className="space-y-2">
              {standards.map(s => {
                const selected = selectedStandards.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStandard(s.id)}
                    data-testid={`button-standard-${s.id.replace(/[\s/:]/g, "-").toLowerCase()}`}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all text-left"
                    style={{
                      background: selected ? `${ORANGE}15` : "rgba(255,255,255,0.04)",
                      borderColor: selected ? ORANGE : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{s.label}</p>
                      <p className="text-xs text-white/45">{s.desc}</p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{ borderColor: selected ? ORANGE : "rgba(255,255,255,0.2)", background: selected ? ORANGE : "transparent" }}
                    >
                      {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full mt-6 font-bold text-white"
              style={{ background: ORANGE }}
              disabled={selectedStandards.length === 0}
              onClick={() => setStep(2)}
              data-testid="button-step1-next"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Step 2 — About You */}
        {step === 2 && (
          <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.04]">
            <h2 className="text-white font-bold text-lg mb-1">Tell Isa about yourself</h2>
            <p className="text-white/45 text-sm mb-5">This lets Isa address you by name and frame answers for your role.</p>

            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wide mb-2 block">What should Isa call you?</Label>
                <Input
                  value={preferredName}
                  onChange={e => setPreferredName(e.target.value)}
                  placeholder="e.g., Maria"
                  className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-orange-500"
                  data-testid="input-preferred-name"
                />
              </div>
              <div>
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wide mb-2 block">Company or Organization</Label>
                <Input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g., Acme Manufacturing, Inc."
                  className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus:border-orange-500"
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wide mb-2 block">Your Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      data-testid={`button-role-${r.replace(/\s/g, "-").toLowerCase()}`}
                      className="rounded-lg px-3 py-2 text-xs font-semibold border transition-all text-left"
                      style={{
                        background: role === r ? `${ORANGE}15` : "rgba(255,255,255,0.04)",
                        borderColor: role === r ? ORANGE : "rgba(255,255,255,0.1)",
                        color: role === r ? "white" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="text-white/50 hover:text-white" onClick={() => setStep(1)} data-testid="button-step2-back">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 font-bold text-white"
                style={{ background: ORANGE }}
                disabled={!preferredName.trim()}
                onClick={() => setStep(3)}
                data-testid="button-step2-next"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Focus Areas */}
        {step === 3 && (
          <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.04]">
            <h2 className="text-white font-bold text-lg mb-1">What are your top priorities?</h2>
            <p className="text-white/45 text-sm mb-5">Pick up to 5. Isa will proactively connect answers to these.</p>

            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(f => {
                const selected = focusAreas.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFocus(f)}
                    data-testid={`button-focus-${f.replace(/\s/g, "-").toLowerCase()}`}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold border transition-all"
                    style={{
                      background: selected ? `${ORANGE}20` : "rgba(255,255,255,0.06)",
                      borderColor: selected ? ORANGE : "rgba(255,255,255,0.12)",
                      color: selected ? "white" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {selected && <span className="mr-1">✓</span>}{f}
                  </button>
                );
              })}
            </div>
            <p className="text-white/30 text-xs mt-3">{focusAreas.length}/5 selected</p>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="text-white/50 hover:text-white" onClick={() => setStep(2)} data-testid="button-step3-back">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                className="flex-1 font-bold text-white"
                style={{ background: ORANGE }}
                disabled={saving}
                onClick={handleSubmit}
                data-testid="button-save-profile"
              >
                {saving ? "Saving…" : "Meet Isa"} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-white/25 text-xs mt-6">You can update your profile anytime from Settings.</p>
      </div>
    </div>
  );
}
