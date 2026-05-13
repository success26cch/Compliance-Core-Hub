import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCreateIsaConversation, useIsaChatStream } from "@/hooks/use-isa-chat";
import {
  Plus, Loader2, Layers, CheckCircle2, FileText, Trash2,
  Sparkles, Send, BookOpen, ChevronRight, AlertTriangle, RefreshCw,
  Factory, Wrench, Truck, Zap, Package, Monitor, Leaf, Building2,
  ArrowRight, ArrowLeft, RotateCcw, ClipboardList,
} from "lucide-react";

interface AspectImpact {
  id: number;
  processActivity: string | null;
  environmentalAspect: string;
  aspectCondition: string;
  isRoutine: boolean | null;
  potentialImpactDescription: string | null;
  impactTypes: string[] | null;
  applicableRegulations: string | null;
  otherRequirements: string | null;
  severity: number;
  probability: number;
  regulatoryScore: number;
  significanceScore: number;
  isSignificant: boolean;
  lifeCycleConsidered: boolean | null;
  operationalControl: string | null;
  objectiveTarget: string | null;
  responsiblePerson: string | null;
  reviewDate: string | null;
  notes: string | null;
}

const IMPACT_TYPES = [
  { code: "AQ", label: "Air Quality",        desc: "Air emissions / air quality impact" },
  { code: "WG", label: "Waste Generation",   desc: "Solid and/or liquid waste" },
  { code: "SS", label: "Sanitary Sewer",     desc: "Sanitary sewer discharge" },
  { code: "SW", label: "Storm Water",        desc: "Storm water quality" },
  { code: "GW", label: "Groundwater",        desc: "Groundwater impact" },
  { code: "SI", label: "Soil Impact",        desc: "Soil contamination" },
  { code: "EC", label: "Energy Consumption", desc: "Electric or natural gas" },
  { code: "NR", label: "Natural Resource",   desc: "Water / resource consumption" },
];

const SEVERITY_OPTIONS = [
  { value: 1, label: "1 – Negligible",    desc: "No measurable environmental impact" },
  { value: 2, label: "2 – Minor",         desc: "Minimal localized impact; easily managed" },
  { value: 3, label: "3 – Moderate",      desc: "Moderate impact limited to site; controllable" },
  { value: 4, label: "4 – Major",         desc: "Significant impact; may exceed regulatory thresholds" },
  { value: 5, label: "5 – Catastrophic",  desc: "Severe, widespread, or irreversible damage" },
];

const PROBABILITY_OPTIONS = [
  { value: 1, label: "1 – Rare",           desc: "Once in 5+ years or less" },
  { value: 2, label: "2 – Unlikely",       desc: "1–2 times per year" },
  { value: 3, label: "3 – Possible",       desc: "Monthly" },
  { value: 4, label: "4 – Likely",         desc: "Weekly" },
  { value: 5, label: "5 – Almost Certain", desc: "Daily or continuous" },
];

const REGULATORY_OPTIONS = [
  { value: 1, label: "1 – Voluntary Only",     desc: "No government regulation; voluntary programs only" },
  { value: 2, label: "2 – General Guidance",   desc: "Soft requirements; minimal risk of fines" },
  { value: 3, label: "3 – State / Local Reg.", desc: "State/local regulations with moderate criteria" },
  { value: 4, label: "4 – Federal Permit",     desc: "Federal/state permit with detailed criteria" },
  { value: 5, label: "5 – Specific Federal",   desc: "Facility-specific permit; extensive criteria; high fines" },
];

function SigBadge({ isSignificant }: { isSignificant: boolean }) {
  return isSignificant
    ? <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/40 font-black text-xs whitespace-nowrap">SIGNIFICANT</Badge>
    : <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40 text-xs whitespace-nowrap">Not Sig.</Badge>;
}

function ScoreDisplay({ s, p, r, score, sig }: { s: number; p: number; r: number; score: number; sig: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-black ${sig ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{score}</span>
      <span className="text-xs text-muted-foreground">{s}×{p}×{r}</span>
    </div>
  );
}

const ASPECT_BLANK = {
  processActivity: "", environmentalAspect: "", aspectCondition: "normal", isRoutine: true,
  potentialImpactDescription: "", impactTypes: [] as string[],
  applicableRegulations: "", otherRequirements: "",
  severity: 3, probability: 2, regulatoryScore: 2,
  lifeCycleConsidered: false, operationalControl: "", objectiveTarget: "",
  responsiblePerson: "", reviewDate: "", notes: "",
};

// ── ESA Wizard Data ────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  {
    id: "production", label: "Production / Operations", Icon: Factory,
    desc: "Core manufacturing, assembly, or service delivery processes",
    activities: ["Machining / cutting / drilling", "Painting / coating / finishing", "Assembly operations", "Heat treating / forging", "Chemical mixing or blending", "Welding / soldering", "Injection molding / extrusion", "Stamping / forming"],
    suggestions: [
      { aspect: "Energy consumption from production equipment", impacts: ["EC"], impactDesc: "Depletion of natural resources; indirect GHG emissions from electricity generation" },
      { aspect: "Coolant / lubricant use and disposal", impacts: ["WG","GW"], impactDesc: "Hazardous waste generation; groundwater contamination risk from improper disposal" },
      { aspect: "Scrap material generation (metal, plastic, offcuts)", impacts: ["WG"], impactDesc: "Solid waste to landfill; resource inefficiency" },
      { aspect: "VOC emissions from coatings / adhesives / solvents", impacts: ["AQ"], impactDesc: "Air quality degradation; contribution to ground-level ozone and smog formation" },
      { aspect: "Wastewater discharge from parts cleaning or rinsing", impacts: ["SS","SW"], impactDesc: "Chemical loading to sewer or storm water; potential surface water contamination" },
      { aspect: "Dust / particulate emissions from cutting or grinding", impacts: ["AQ"], impactDesc: "Fugitive dust impact on ambient air quality and neighboring community" },
      { aspect: "Chemical / hazardous waste disposal", impacts: ["WG","SI"], impactDesc: "Regulated hazardous waste requiring manifest disposal; soil contamination risk" },
    ],
  },
  {
    id: "maintenance", label: "Maintenance & Facilities", Icon: Wrench,
    desc: "Equipment repair, facility upkeep, and building systems",
    activities: ["HVAC servicing / refrigerant handling", "Oil and fluid changes (equipment)", "Parts cleaning with solvents / degreasers", "Welding / grinding repairs", "Painting / surface preparation", "Emergency generator testing", "Plumbing and drain maintenance"],
    suggestions: [
      { aspect: "Used oil and lubricant disposal", impacts: ["WG","GW"], impactDesc: "Hazardous waste; groundwater contamination if improperly stored or disposed" },
      { aspect: "Spent solvent / degreaser disposal", impacts: ["WG","AQ"], impactDesc: "Hazardous waste generation; VOC emissions during use" },
      { aspect: "Refrigerant release during HVAC service", impacts: ["AQ"], impactDesc: "Ozone-depleting or high-GWP refrigerant release to atmosphere; Section 608 requirement" },
      { aspect: "Welding fume and smoke emissions", impacts: ["AQ"], impactDesc: "Air quality and health impact from metal fume particulates and gases" },
      { aspect: "Contaminated rags, filters, and absorbents", impacts: ["WG"], impactDesc: "Hazardous solid waste; misclassification risk as non-hazardous" },
      { aspect: "Hydraulic fluid and fuel spills", impacts: ["SI","GW","SW"], impactDesc: "Soil and groundwater contamination; storm water quality impact" },
      { aspect: "Generator diesel exhaust during testing", impacts: ["AQ"], impactDesc: "Air emissions from diesel combustion; visible smoke during cold starts" },
    ],
  },
  {
    id: "shipping", label: "Shipping & Receiving", Icon: Truck,
    desc: "Inbound / outbound logistics, loading docks, and transportation",
    activities: ["Forklift and truck operations", "Fuel storage and dispensing", "Loading / unloading dock activities", "Refrigerated storage or transport", "Packaging and material handling", "Return and waste shipment processing"],
    suggestions: [
      { aspect: "Vehicle and forklift exhaust emissions", impacts: ["AQ"], impactDesc: "Air quality degradation from combustion of diesel, propane, or natural gas" },
      { aspect: "Fuel storage and dispensing — spill risk", impacts: ["SI","GW","SW"], impactDesc: "Soil and groundwater contamination; storm water impact from spills" },
      { aspect: "Packaging material waste generation", impacts: ["WG"], impactDesc: "Solid waste from cardboard, plastic wrap, pallets, and dunnage" },
      { aspect: "Electric forklift battery charging emissions", impacts: ["AQ"], impactDesc: "Hydrogen off-gassing in enclosed charging areas; acid spill risk" },
      { aspect: "Refrigerant use in cold storage or trailers", impacts: ["AQ"], impactDesc: "Refrigerant release risk during connection / disconnection of refrigerated units" },
      { aspect: "Noise from loading dock operations", impacts: ["AQ"], impactDesc: "Noise pollution impact on neighboring community during off-hours operations" },
    ],
  },
  {
    id: "utilities", label: "Utilities & Energy", Icon: Zap,
    desc: "Boilers, compressed air, water systems, and energy infrastructure",
    activities: ["Boiler / steam generation", "Compressed air system operation", "Cooling tower operation", "Emergency generator operation", "Natural gas distribution", "Electrical systems and lighting"],
    suggestions: [
      { aspect: "Natural gas combustion (boilers, heaters)", impacts: ["AQ"], impactDesc: "NOx, SOx, CO2, and CO emissions contributing to air quality degradation and climate change" },
      { aspect: "Electricity consumption", impacts: ["EC"], impactDesc: "Indirect greenhouse gas emissions from grid power generation; energy resource depletion" },
      { aspect: "Cooling tower water use and blowdown discharge", impacts: ["NR","SS"], impactDesc: "Water resource consumption; chemical discharge in blowdown to sewer" },
      { aspect: "Cooling tower biocide / water treatment chemicals", impacts: ["WG","SS"], impactDesc: "Chemical waste from water treatment program; regulated sewer discharge" },
      { aspect: "Emergency generator diesel exhaust", impacts: ["AQ"], impactDesc: "Air emissions during load testing or outage operation; diesel fuel storage risk" },
      { aspect: "Water consumption (process and sanitary)", impacts: ["NR"], impactDesc: "Depletion of local water resources; increased demand on municipal supply" },
    ],
  },
  {
    id: "warehouse", label: "Warehouse & Storage", Icon: Package,
    desc: "Inventory storage, material handling, and on-site chemical storage",
    activities: ["Chemical and hazardous material storage", "Bulk material handling and transfer", "Inventory rotation and disposal of obsolete stock", "Packaging waste management", "Indoor vehicle / equipment use"],
    suggestions: [
      { aspect: "Chemical container storage — leak or spill risk", impacts: ["SI","GW","SW"], impactDesc: "Soil and groundwater contamination; storm water impact from outdoor storage areas" },
      { aspect: "Expired or off-spec material disposal", impacts: ["WG"], impactDesc: "Hazardous or non-hazardous waste requiring compliant disposal routing" },
      { aspect: "Dust generation from material handling", impacts: ["AQ"], impactDesc: "Fugitive particulate emissions from product, raw material, or aggregate handling" },
      { aspect: "Forklift exhaust or battery charging emissions", impacts: ["AQ"], impactDesc: "Indoor and outdoor air quality impact from propane, diesel, or charging operations" },
      { aspect: "Packaging waste (cardboard, plastic, pallets)", impacts: ["WG"], impactDesc: "Solid waste generation; recyclables diverted to landfill if not managed" },
    ],
  },
  {
    id: "office", label: "Office & Administration", Icon: Monitor,
    desc: "Office operations, administrative activities, and support services",
    activities: ["Office equipment use (computers, printers, copiers)", "Paper and consumables use", "Break room / kitchen operations", "HVAC and building climate control", "Business travel and fleet use", "Electronic equipment lifecycle management"],
    suggestions: [
      { aspect: "Paper and consumable waste generation", impacts: ["WG"], impactDesc: "Solid waste to landfill; natural resource consumption from virgin paper use" },
      { aspect: "Electronic equipment end-of-life (e-waste)", impacts: ["WG","SI"], impactDesc: "Hazardous e-waste risk from improper disposal of computers, monitors, and batteries" },
      { aspect: "Energy consumption (lighting, HVAC, equipment)", impacts: ["EC"], impactDesc: "Indirect greenhouse gas emissions; electricity and natural gas resource depletion" },
      { aspect: "Toner cartridge and ink disposal", impacts: ["WG"], impactDesc: "Small-quantity chemical waste; recyclable stream management" },
      { aspect: "Water consumption (restrooms, kitchen)", impacts: ["NR","SS"], impactDesc: "Potable water depletion; sanitary sewer loading" },
      { aspect: "Business travel and fleet vehicle emissions", impacts: ["AQ"], impactDesc: "GHG and criteria pollutant emissions from company vehicles and air travel" },
    ],
  },
  {
    id: "ehs", label: "Environmental / EHS", Icon: Leaf,
    desc: "Environmental management, waste programs, and compliance activities",
    activities: ["Hazardous waste accumulation and storage", "Spill response and remediation", "Storm water management and inspection", "Air emissions monitoring", "Environmental sampling and lab work", "Recycling program management"],
    suggestions: [
      { aspect: "Hazardous waste accumulation area storage", impacts: ["WG","SI","GW"], impactDesc: "Risk of container failure, spills, or releases from on-site hazardous waste storage" },
      { aspect: "Spill response materials use and disposal", impacts: ["WG"], impactDesc: "Contaminated absorbents, booms, and PPE from spill response requiring hazardous waste disposal" },
      { aspect: "Storm water runoff from impervious surfaces", impacts: ["SW","GW"], impactDesc: "Pollutant loading (sediment, chemicals, metals) to drainage and receiving waters" },
      { aspect: "Air monitoring waste (sampling filters, reagents)", impacts: ["WG"], impactDesc: "Small-quantity chemical waste from air quality monitoring operations" },
      { aspect: "Materials recycling and diversion program", impacts: ["WG"], impactDesc: "Positive aspect — diversion of materials from landfill; reduction of virgin resource demand" },
    ],
  },
  {
    id: "quality", label: "Quality & Inspection", Icon: ClipboardList,
    desc: "Quality control, laboratory, inspection, and testing activities",
    activities: ["Chemical / calibration standard use", "CMM and measurement equipment operation", "Destructive testing and sample disposal", "Laboratory reagent use", "Inspection and document management"],
    suggestions: [
      { aspect: "Chemical calibration standard disposal", impacts: ["WG"], impactDesc: "Small-quantity hazardous chemical waste from expired calibration fluids and standards" },
      { aspect: "Laboratory reagent and solvent use / disposal", impacts: ["WG","AQ"], impactDesc: "Hazardous waste generation; VOC emissions from open containers" },
      { aspect: "Destructive test sample disposal", impacts: ["WG"], impactDesc: "Solid or hazardous waste from destructive testing specimens" },
      { aspect: "Lab and measurement equipment energy consumption", impacts: ["EC"], impactDesc: "Electricity use from CMMs, ovens, environmental chambers, and test equipment" },
      { aspect: "Coolant use on measurement or cutting equipment", impacts: ["WG","GW"], impactDesc: "Spent coolant hazardous waste; groundwater risk from improper handling" },
    ],
  },
  {
    id: "custom", label: "Other / Custom", Icon: Building2,
    desc: "Enter a department or activity specific to your organization",
    activities: [],
    suggestions: [],
  },
];

type WizStep = 1 | 2 | 3 | 4 | 5;
const WIZ_BLANK = {
  dept: "", customDept: "", processActivity: "",
  aspectCondition: "normal" as "normal"|"abnormal"|"emergency", isRoutine: true,
  environmentalAspect: "", potentialImpactDescription: "", impactTypes: [] as string[],
  severity: 3, probability: 2, regulatoryScore: 2,
  applicableRegulations: "", otherRequirements: "", operationalControl: "",
  objectiveTarget: "", responsiblePerson: "", lifeCycleConsidered: false,
  reviewDate: "", notes: "",
};

function EsaWizard({ onSave }: { onSave: (data: typeof ASPECT_BLANK) => void }) {
  const [step, setStep] = useState<WizStep>(1);
  const [w, setW] = useState(WIZ_BLANK);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const dept = DEPARTMENTS.find(d => d.id === w.dept);
  const liveScore = w.severity * w.probability * w.regulatoryScore;
  const liveSig = liveScore >= 75;

  function pickDept(id: string) { setW(v => ({ ...v, dept: id, customDept: "", processActivity: "", environmentalAspect: "", potentialImpactDescription: "", impactTypes: [] })); setStep(2); }

  function pickActivity(a: string) { setW(v => ({ ...v, processActivity: a })); }

  function pickSuggestion(s: typeof DEPARTMENTS[0]["suggestions"][0]) {
    setW(v => ({ ...v, environmentalAspect: s.aspect, potentialImpactDescription: s.impactDesc, impactTypes: s.impacts }));
  }

  function toggleImpact(code: string) {
    setW(v => ({ ...v, impactTypes: v.impactTypes.includes(code) ? v.impactTypes.filter(c => c !== code) : [...v.impactTypes, code] }));
  }

  function handleSave() {
    if (!w.environmentalAspect.trim()) { toast({ title: "Environmental aspect is required", variant: "destructive" }); return; }
    onSave({
      processActivity: w.dept === "custom" ? w.customDept : (dept?.label ?? "") + (w.processActivity ? ` — ${w.processActivity}` : ""),
      environmentalAspect: w.environmentalAspect,
      aspectCondition: w.aspectCondition,
      isRoutine: w.isRoutine,
      potentialImpactDescription: w.potentialImpactDescription,
      impactTypes: w.impactTypes,
      applicableRegulations: w.applicableRegulations,
      otherRequirements: w.otherRequirements,
      severity: w.severity, probability: w.probability, regulatoryScore: w.regulatoryScore,
      lifeCycleConsidered: w.lifeCycleConsidered,
      operationalControl: w.operationalControl,
      objectiveTarget: w.objectiveTarget,
      responsiblePerson: w.responsiblePerson,
      reviewDate: w.reviewDate,
      notes: w.notes,
    });
    setSaved(true);
  }

  function addAnother() { setW(v => ({ ...WIZ_BLANK, dept: v.dept, customDept: v.customDept })); setStep(2); setSaved(false); }
  function newDept() { setW(WIZ_BLANK); setStep(1); setSaved(false); }

  const stepLabels = ["Department", "Activity", "Aspect & Impact", "Scoring", "Controls & Save"];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Progress bar */}
      {step > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {stepLabels.map((lbl, i) => (
              <div key={lbl} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                  i + 1 < step ? "bg-lime-600 text-white" : i + 1 === step ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}>{i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}</div>
                <span className={`text-[10px] font-semibold text-center hidden sm:block ${i + 1 === step ? "text-foreground" : "text-muted-foreground"}`}>{lbl}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-lime-600 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 4) * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── STEP 1: Department ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="font-black text-base text-foreground">Which department or area are we analyzing?</p>
            <p className="text-sm text-muted-foreground mt-0.5">Every organization is different — start with the area that makes sense for your operations. You can run the wizard multiple times for each area.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DEPARTMENTS.map(d => (
              <button key={d.id} onClick={() => pickDept(d.id)}
                className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left hover:border-lime-500 hover:bg-lime-50/50 dark:hover:bg-lime-950/10 transition-all group"
                data-testid={`wizard-dept-${d.id}`}>
                <d.Icon className="w-5 h-5 text-muted-foreground group-hover:text-lime-600 transition-colors" />
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{d.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{d.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Activity ── */}
      {step === 2 && dept && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <dept.Icon className="w-5 h-5 text-lime-600 shrink-0" />
            <div>
              <p className="font-black text-base text-foreground">{dept.label}</p>
              <p className="text-sm text-muted-foreground">What specific activity or task are we looking at?</p>
            </div>
          </div>

          {w.dept === "custom" && (
            <div>
              <Label className="text-xs font-bold">Department / Area Name</Label>
              <Input className="mt-1" placeholder="e.g., R&D Lab, Kitchen Operations, On-site Clinic…" value={w.customDept} onChange={e => setW(v => ({ ...v, customDept: e.target.value }))} data-testid="wizard-custom-dept" />
            </div>
          )}

          {dept.activities.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-2">Common activities in this area — click to select:</p>
              <div className="flex flex-wrap gap-1.5">
                {dept.activities.map(a => (
                  <button key={a} onClick={() => pickActivity(a)} type="button"
                    className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${w.processActivity === a ? "bg-lime-600 text-white border-lime-600" : "border-border text-muted-foreground hover:border-lime-500 hover:text-lime-700"}`}
                    data-testid={`wizard-activity-${a}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-bold">Activity / Task Description <span className="text-muted-foreground font-normal">(or type your own)</span></Label>
            <Input className="mt-1" placeholder="Describe the specific process or task…" value={w.processActivity} onChange={e => setW(v => ({ ...v, processActivity: e.target.value }))} data-testid="wizard-process-activity" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold mb-2 block">Operating Condition</Label>
              <div className="flex flex-col gap-1.5">
                {(["normal","abnormal","emergency"] as const).map(c => (
                  <button key={c} onClick={() => setW(v => ({ ...v, aspectCondition: c }))} type="button"
                    className={`text-left px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${w.aspectCondition === c ? (c === "emergency" ? "bg-red-600 text-white border-red-600" : c === "abnormal" ? "bg-yellow-500 text-white border-yellow-500" : "bg-blue-600 text-white border-blue-600") : "border-border text-muted-foreground hover:border-foreground/30"}`}
                    data-testid={`wizard-condition-${c}`}>
                    {c === "normal" ? "Normal — routine day-to-day" : c === "abnormal" ? "Abnormal — startup / shutdown / maintenance" : "Emergency — spill, fire, power failure"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Label className="text-xs font-bold">Activity Type</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={w.isRoutine} onChange={e => setW(v => ({ ...v, isRoutine: e.target.checked }))} className="w-4 h-4 rounded" data-testid="wizard-routine" />
                <span className="text-sm font-semibold">Routine activity</span>
              </label>
              <p className="text-xs text-muted-foreground">Uncheck if this is a non-routine task such as periodic maintenance or special project work.</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1"><ArrowLeft className="w-3.5 h-3.5" />Back</Button>
            <Button size="sm" className="bg-lime-600 hover:bg-lime-500 text-white gap-1" onClick={() => setStep(3)} data-testid="wizard-next-2"><ArrowRight className="w-3.5 h-3.5" />Next — Identify Aspect</Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Aspect & Impact ── */}
      {step === 3 && dept && (
        <div className="space-y-4">
          <div>
            <p className="font-black text-base text-foreground">What element of this activity interacts with the environment?</p>
            <p className="text-sm text-muted-foreground mt-0.5">The <em>aspect</em> is the element (e.g., fuel combustion, wastewater discharge). The <em>impact</em> is what that does to the environment (e.g., air quality degradation).</p>
          </div>

          {dept.suggestions.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Common aspects for <strong className="text-foreground">{dept.label}</strong> — click to pre-fill:</p>
              <div className="space-y-1.5">
                {dept.suggestions.map(s => (
                  <button key={s.aspect} onClick={() => pickSuggestion(s)} type="button"
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${w.environmentalAspect === s.aspect ? "bg-lime-600 text-white border-lime-600" : "border-border bg-card hover:border-lime-400 hover:bg-lime-50/50 dark:hover:bg-lime-950/10"}`}
                    data-testid={`wizard-suggestion-${s.aspect.slice(0,20)}`}>
                    <span className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                      <span>{s.aspect}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-bold">Environmental Aspect <span className="text-red-500">*</span> <span className="font-normal text-muted-foreground">(or type your own)</span></Label>
            <Input className="mt-1" placeholder="e.g., Disposal of spent cutting fluid, Combustion of natural gas…" value={w.environmentalAspect} onChange={e => setW(v => ({ ...v, environmentalAspect: e.target.value }))} data-testid="wizard-aspect" />
          </div>

          <div>
            <Label className="text-xs font-bold">Potential Environmental Impact Description</Label>
            <Textarea className="mt-1 text-sm h-20 resize-none" placeholder="What does this aspect do to the environment? Which receiving medium is affected — air, water, soil, ecosystems?" value={w.potentialImpactDescription} onChange={e => setW(v => ({ ...v, potentialImpactDescription: e.target.value }))} data-testid="wizard-impact-desc" />
          </div>

          <div>
            <Label className="text-sm font-bold mb-2 block">Impact Type(s)</Label>
            <div className="flex flex-wrap gap-1.5">
              {IMPACT_TYPES.map(t => (
                <button key={t.code} type="button" onClick={() => toggleImpact(t.code)}
                  className={`text-sm px-2.5 py-1 rounded-full border font-bold transition-colors ${w.impactTypes.includes(t.code) ? "bg-lime-600 text-white border-lime-600" : "border-border text-muted-foreground hover:border-lime-500"}`}
                  data-testid={`wizard-impact-${t.code}`}>
                  {t.code} — {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1"><ArrowLeft className="w-3.5 h-3.5" />Back</Button>
            <Button size="sm" className="bg-lime-600 hover:bg-lime-500 text-white gap-1" onClick={() => { if(!w.environmentalAspect.trim()){toast({title:"Please enter an environmental aspect",variant:"destructive"});return;} setStep(4); }} data-testid="wizard-next-3"><ArrowRight className="w-3.5 h-3.5" />Next — Score It</Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Scoring ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <p className="font-black text-base text-foreground">Score this aspect for significance (S × P × R)</p>
            <p className="text-sm text-muted-foreground mt-0.5">Rate each dimension 1–5. A score ≥ 75 out of 125 designates this as a Significant Environmental Aspect (SEA).</p>
          </div>

          <div className="space-y-4">
            {([
              { key: "severity" as const, label: "Severity (S)", subtitle: "How severe is the environmental damage if this impact occurs?", opts: SEVERITY_OPTIONS, color: "red" },
              { key: "probability" as const, label: "Probability (P)", subtitle: "How frequently does this aspect occur or how likely is the impact?", opts: PROBABILITY_OPTIONS, color: "blue" },
              { key: "regulatoryScore" as const, label: "Regulatory (R)", subtitle: "What level of regulatory obligation or legal exposure applies?", opts: REGULATORY_OPTIONS, color: "purple" },
            ] as const).map(({ key, label, subtitle, opts, color }) => (
              <div key={key} className="rounded-xl border p-4 space-y-3">
                <div>
                  <p className="font-bold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {opts.map(o => (
                    <button key={o.value} onClick={() => setW(v => ({ ...v, [key]: o.value }))} type="button"
                      className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 transition-all text-center ${w[key] === o.value
                        ? (o.value >= 4 ? "bg-red-600 text-white border-red-600" : o.value === 3 ? "bg-yellow-500 text-white border-yellow-500" : "bg-emerald-600 text-white border-emerald-600")
                        : "border-border text-muted-foreground hover:border-foreground/30 bg-card"}`}
                      data-testid={`wizard-${key}-${o.value}`}>
                      <span className="text-base font-black">{o.value}</span>
                      <span className="text-[10px] leading-tight">{o.label.split(" – ")[1]}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">{opts.find(o => o.value === w[key])?.desc}</p>
              </div>
            ))}
          </div>

          {/* Live score */}
          <div className={`rounded-xl px-5 py-4 flex items-center justify-between gap-4 border ${liveSig ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700/40" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700/30"}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Significance Score</p>
              <p className={`text-5xl font-black ${liveSig ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{liveScore}</p>
              <p className="text-xs text-muted-foreground">S{w.severity} × P{w.probability} × R{w.regulatoryScore} = {liveScore} / 125</p>
            </div>
            <div className="text-right">
              {liveSig
                ? <Badge className="bg-red-600 text-white border-0 text-sm font-black px-3 py-1.5">⚠ SIGNIFICANT (SEA)</Badge>
                : <Badge className="bg-emerald-600 text-white border-0 text-sm font-black px-3 py-1.5">✓ Not Significant</Badge>}
              <p className="text-xs text-muted-foreground mt-1">Threshold ≥ 75</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setStep(3)} className="gap-1"><ArrowLeft className="w-3.5 h-3.5" />Back</Button>
            <Button size="sm" className="bg-lime-600 hover:bg-lime-500 text-white gap-1" onClick={() => setStep(5)} data-testid="wizard-next-4"><ArrowRight className="w-3.5 h-3.5" />Next — Controls & Save</Button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Controls + Review + Save ── */}
      {step === 5 && (
        <div className="space-y-4">
          {!saved ? (
            <>
              <div>
                <p className="font-black text-base text-foreground">Compliance, controls, and final review</p>
                <p className="text-sm text-muted-foreground mt-0.5">Fill in what you know — everything below is optional but strengthens your register for audits.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs font-bold">Applicable Regulations (Federal / State / Local)</Label>
                  <Textarea className="mt-1 text-xs h-16 resize-none" placeholder="e.g., 40 CFR Part 279 (F), State Act 451 Part 121 (S), City Ord. §82-3 (L)…" value={w.applicableRegulations} onChange={e => setW(v => ({ ...v, applicableRegulations: e.target.value }))} data-testid="wizard-regulations" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-bold">Operational Control / Document Name &amp; Number</Label>
                  <Input className="mt-1" placeholder="e.g., WI-ENV-001 Waste Management Procedure, Monthly monitoring log…" value={w.operationalControl} onChange={e => setW(v => ({ ...v, operationalControl: e.target.value }))} data-testid="wizard-control" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Environmental Objective / Target</Label>
                  <Input className="mt-1" placeholder="e.g., Reduce waste 10% by year-end" value={w.objectiveTarget} onChange={e => setW(v => ({ ...v, objectiveTarget: e.target.value }))} data-testid="wizard-objective" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Responsible Person / Role</Label>
                  <Input className="mt-1" placeholder="Name or job title" value={w.responsiblePerson} onChange={e => setW(v => ({ ...v, responsiblePerson: e.target.value }))} data-testid="wizard-responsible" />
                </div>
                <div>
                  <Label className="text-xs font-bold">Next Review Date</Label>
                  <Input type="date" className="mt-1" value={w.reviewDate} onChange={e => setW(v => ({ ...v, reviewDate: e.target.value }))} data-testid="wizard-review-date" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="wiz-lc" checked={w.lifeCycleConsidered} onChange={e => setW(v => ({ ...v, lifeCycleConsidered: e.target.checked }))} className="w-4 h-4 rounded" data-testid="wizard-lifecycle" />
                  <Label htmlFor="wiz-lc" className="text-xs font-semibold cursor-pointer">Life Cycle Considered (§6.1.2)</Label>
                </div>
              </div>

              {/* Preview card */}
              <div className={`rounded-xl border p-4 space-y-3 ${liveSig ? "border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/10" : "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/10"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{dept?.label}{w.processActivity ? ` — ${w.processActivity}` : ""} · {w.aspectCondition}</p>
                    <p className="font-black text-base text-foreground">{w.environmentalAspect || "—"}</p>
                    {w.potentialImpactDescription && <p className="text-sm text-muted-foreground mt-1">{w.potentialImpactDescription}</p>}
                  </div>
                  <div className="text-center shrink-0">
                    <p className={`text-3xl font-black ${liveSig ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{liveScore}</p>
                    <p className="text-[10px] text-muted-foreground">S{w.severity}×P{w.probability}×R{w.regulatoryScore}</p>
                    {liveSig ? <Badge className="bg-red-600 text-white border-0 text-[10px] mt-1">SEA</Badge> : <Badge className="bg-emerald-600 text-white border-0 text-[10px] mt-1">Not Sig.</Badge>}
                  </div>
                </div>
                {w.impactTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {w.impactTypes.map(t => <span key={t} className="text-xs font-black bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setStep(4)} className="gap-1"><ArrowLeft className="w-3.5 h-3.5" />Back</Button>
                <Button size="sm" className="bg-lime-600 hover:bg-lime-500 text-white gap-1 px-6" onClick={handleSave} data-testid="wizard-save">
                  <CheckCircle2 className="w-4 h-4" />Add to Register
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lime-100 dark:bg-lime-900/30 border border-lime-300 dark:border-lime-700/40 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-lime-600 dark:text-lime-400" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg text-foreground">Added to Register</p>
                <p className="text-sm text-muted-foreground"><strong className="text-foreground">{w.environmentalAspect}</strong> has been saved with a score of <strong className={liveSig ? "text-red-600" : "text-emerald-600"}>{liveScore}</strong>.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={addAnother} className="gap-2" data-testid="wizard-add-another">
                  <Plus className="w-4 h-4" />Add Another for {dept?.label}
                </Button>
                <Button variant="outline" onClick={newDept} className="gap-2" data-testid="wizard-new-dept">
                  <RotateCcw className="w-4 h-4" />Different Department
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Isa Assessment Chat Sub-component ──────────────────────────────────────────
function IsaAssessmentChat({ conversationId, initialPrompt }: { conversationId: number; initialPrompt: string }) {
  const { messages, sendMessage, isStreaming } = useIsaChatStream(conversationId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!sentRef.current && initialPrompt) {
      sentRef.current = true;
      sendMessage(initialPrompt);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const submit = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Isa is reviewing your register…</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
            )}
            <div className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-lime-600 text-white"
                : "bg-muted/60 border border-border text-foreground"
            }`}>
              {msg.content || (isStreaming && i === messages.length - 1
                ? <span className="inline-block w-2 h-4 bg-accent/60 animate-pulse rounded-sm" />
                : "")}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-muted/60 border border-border rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Isa is analyzing your register…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Follow-up input */}
      {messages.length > 0 && (
        <div className="border-t pt-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={isStreaming ? "Isa is responding…" : "Ask a follow-up question…"}
            disabled={isStreaming}
            className="flex-1 text-sm"
            data-testid="input-isa-followup"
          />
          <Button size="icon" onClick={submit} disabled={isStreaming || !input.trim()} className="shrink-0 bg-accent hover:bg-accent/90" data-testid="button-isa-send">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────────
export default function AspectsImpactsModule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("register");
  const [guideMode, setGuideMode] = useState<"wizard"|"guide">("wizard");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<AspectImpact | null>(null);
  const [filterSig, setFilterSig] = useState<"all" | "significant" | "not">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<AspectImpact | null>(null);
  const [form, setForm] = useState(ASPECT_BLANK);

  // Isa Assessment state
  const [isaConvId, setIsaConvId] = useState<number | null>(null);
  const [isaPrompt, setIsaPrompt] = useState<string>("");
  const createConv = useCreateIsaConversation();

  const { data: aspects = [], isLoading } = useQuery<AspectImpact[]>({ queryKey: ["/api/env/aspects"] });

  const create = useMutation({
    mutationFn: (d: typeof ASPECT_BLANK) => apiRequest("POST", "/api/env/aspects", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/aspects"] }); setShowDialog(false); toast({ title: "Aspect added to register" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof ASPECT_BLANK }) => apiRequest("PATCH", `/api/env/aspects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/aspects"] }); setShowDialog(false); toast({ title: "Aspect updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/env/aspects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/aspects"] }); setDeleteConfirm(null); toast({ title: "Aspect removed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAdd() { setEditing(null); setForm(ASPECT_BLANK); setShowDialog(true); }
  function openEdit(a: AspectImpact) {
    setEditing(a);
    setForm({
      processActivity: a.processActivity ?? "", environmentalAspect: a.environmentalAspect,
      aspectCondition: a.aspectCondition, isRoutine: a.isRoutine ?? true,
      potentialImpactDescription: a.potentialImpactDescription ?? "",
      impactTypes: a.impactTypes ?? [], applicableRegulations: a.applicableRegulations ?? "",
      otherRequirements: a.otherRequirements ?? "", severity: a.severity, probability: a.probability,
      regulatoryScore: a.regulatoryScore, lifeCycleConsidered: a.lifeCycleConsidered ?? false,
      operationalControl: a.operationalControl ?? "", objectiveTarget: a.objectiveTarget ?? "",
      responsiblePerson: a.responsiblePerson ?? "", reviewDate: a.reviewDate ?? "", notes: a.notes ?? "",
    });
    setShowDialog(true);
  }

  function toggleImpact(code: string) {
    setForm(f => ({ ...f, impactTypes: f.impactTypes.includes(code) ? f.impactTypes.filter(c => c !== code) : [...f.impactTypes, code] }));
  }

  function submit() {
    if (!form.environmentalAspect.trim()) { toast({ title: "Environmental Aspect is required", variant: "destructive" }); return; }
    if (editing) update.mutate({ id: editing.id, data: form });
    else create.mutate(form);
  }

  const liveScore = form.severity * form.probability * form.regulatoryScore;
  const liveSig = liveScore >= 75;
  const allAspects = aspects as AspectImpact[];
  const filtered = allAspects.filter(a => filterSig === "significant" ? a.isSignificant : filterSig === "not" ? !a.isSignificant : true);
  const totalSig = allAspects.filter(a => a.isSignificant).length;
  const impactDist: Record<string, number> = {};
  for (const a of allAspects) for (const t of a.impactTypes ?? []) impactDist[t] = (impactDist[t] ?? 0) + 1;

  async function requestIsaAssessment() {
    if (allAspects.length === 0) {
      toast({ title: "No aspects to assess", description: "Add some aspects to your register first.", variant: "destructive" });
      return;
    }
    try {
      const conv = await createConv.mutateAsync({ title: "ESA Register Assessment", source: "aspects_impacts" });
      const registerText = allAspects.map((a, i) =>
        `${i + 1}. [${a.isSignificant ? "SEA" : "Not Sig."}] Score ${a.significanceScore} (S${a.severity}×P${a.probability}×R${a.regulatoryScore}) — ${a.environmentalAspect} | Process: ${a.processActivity || "N/A"} | Condition: ${a.aspectCondition} | Impact types: ${(a.impactTypes ?? []).join(", ") || "none"} | Regulation: ${a.applicableRegulations || "none stated"} | Control: ${a.operationalControl || "none stated"}`
      ).join("\n");

      const prompt = `[CONTEXT: The user is in the Aspects & Impacts Analysis module (ISO 14001:2015 §6.1.2) of CCHUB's ISO Manager. They have requested a Lead Auditor review of their Environmental Significance Assessment (ESA) register. Provide a structured, audit-style assessment — do not ask if they want help, jump straight into the review. Address each of the five points below. Important: every organization has unique processes, activities, and operating environments, so assess the register based on what is actually logged here — do not benchmark against a generic industry template or assume what aspects "should" be present.]

Please assess my ESA register for ISO 14001:2015 §6.1.2 conformance. We have ${allAspects.length} aspects logged, ${totalSig} identified as Significant Environmental Aspects (SEAs).

REGISTER:
${registerText}

Assess the following:
1. Internal consistency & completeness — based on the processes and activities listed in this register, are the aspects and impacts logically derived? Are there operating conditions (normal, abnormal, emergency) that appear underrepresented given what is logged?
2. Scoring integrity — are the S×P×R scores and SEA designations defensible from an auditor's perspective given the stated impact types and regulations?
3. Life cycle perspective (§6.1.2 requirement) — is there evidence of upstream/downstream life cycle thinking, or does the register only capture direct facility emissions?
4. SEA follow-through — do the Significant Environmental Aspects have appropriate operational controls and objectives linked?
5. Audit readiness — what specific questions or evidence requests would a third-party CB auditor likely raise against this register as submitted?`;

      setIsaPrompt(prompt);
      setIsaConvId(conv.id);
      setTab("isa");
    } catch {
      toast({ title: "Could not start Isa assessment", variant: "destructive" });
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-foreground">Aspects &amp; Impacts Analysis</h2>
          <p className="text-xs text-muted-foreground">ISO 14001:2015 §6.1.2 · Significant Environmental Aspects Register · Score = Severity × Probability × Regulatory (≥ 75 = SEA)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1.5 border-accent/40 text-accent hover:bg-accent/10" onClick={requestIsaAssessment} disabled={createConv.isPending} data-testid="button-isa-assess">
            {createConv.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Ask Isa to Assess
          </Button>
          <Button size="sm" className="bg-lime-600 hover:bg-lime-500 text-white gap-1.5" onClick={openAdd} data-testid="button-add-aspect">
            <Plus className="w-3.5 h-3.5" /> Add Aspect
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Aspects</p>
          <p className="text-2xl font-black text-foreground">{allAspects.length}</p>
        </div>
        <div className="rounded-xl border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 p-3">
          <p className="text-[10px] text-red-700 dark:text-red-400 uppercase tracking-widest font-bold mb-1">Significant (SEA)</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-400">{totalSig}</p>
        </div>
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30 p-3">
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-widest font-bold mb-1">Not Significant</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{allAspects.length - totalSig}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Life Cycle Tracked</p>
          <p className="text-2xl font-black text-foreground">{allAspects.filter(a => a.lifeCycleConsidered).length}</p>
        </div>
      </div>

      {/* Impact type chips */}
      {Object.keys(impactDist).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {IMPACT_TYPES.filter(t => impactDist[t.code]).map(t => (
            <span key={t.code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 border border-lime-200 dark:border-lime-700/40 text-[10px] font-bold">
              {t.code} <span className="font-normal text-lime-600 dark:text-lime-400">({impactDist[t.code]})</span>
            </span>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="register">Aspects Register</TabsTrigger>
          <TabsTrigger value="criteria">Evaluation Criteria</TabsTrigger>
          <TabsTrigger value="guide" className="gap-1.5"><BookOpen className="w-3.5 h-3.5" />ESA Guide</TabsTrigger>
          <TabsTrigger value="isa" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Isa Assessment</span>
            {isaConvId && <span className="ml-1 w-2 h-2 rounded-full bg-accent inline-block" />}
          </TabsTrigger>
        </TabsList>

        {/* ── Register Tab ── */}
        <TabsContent value="register" className="mt-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {([["all","All"],["significant","Significant Only"],["not","Not Significant"]] as [string,string][]).map(([v,l]) => (
              <button key={v} onClick={() => setFilterSig(v as any)}
                className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${filterSig === v ? "bg-lime-600 text-white border-lime-600" : "border-border text-muted-foreground hover:border-lime-500 hover:text-lime-600"}`}
                data-testid={`filter-aspects-${v}`}>
                {l}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed rounded-xl p-12 text-center space-y-2">
              <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">No aspects logged yet</p>
              <p className="text-xs text-muted-foreground">Click <strong>Add Aspect</strong> to build your ISO 14001 §6.1.2 register.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm min-w-[1200px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-3 font-bold text-muted-foreground w-[150px]">Process / Activity</th>
                    <th className="text-left px-3 py-3 font-bold text-muted-foreground w-[200px]">Environmental Aspect</th>
                    <th className="text-left px-3 py-3 font-bold text-muted-foreground w-[220px]">Potential Impact</th>
                    <th className="text-left px-3 py-3 font-bold text-muted-foreground w-[180px]">Compliance Regulation</th>
                    <th className="text-left px-3 py-3 font-bold text-muted-foreground w-[100px]">Condition</th>
                    <th className="text-left px-3 py-3 font-bold text-muted-foreground w-[120px]">Impact Types</th>
                    <th className="text-center px-2 py-3 font-bold text-muted-foreground w-[32px]" title="Severity">S</th>
                    <th className="text-center px-2 py-3 font-bold text-muted-foreground w-[32px]" title="Probability">P</th>
                    <th className="text-center px-2 py-3 font-bold text-muted-foreground w-[32px]" title="Regulatory">R</th>
                    <th className="text-center px-2 py-3 font-bold text-muted-foreground w-[64px]">Score</th>
                    <th className="text-center px-2 py-3 font-bold text-muted-foreground w-[110px]">Significance</th>
                    <th className="text-center px-2 py-3 font-bold text-muted-foreground w-[32px]" title="Life Cycle">LC</th>
                    <th className="text-left px-3 py-3 font-bold text-muted-foreground">Operational Control</th>
                    <th className="px-2 py-3 w-[64px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className={`border-b transition-colors hover:bg-muted/30 ${a.isSignificant ? "bg-red-50/50 dark:bg-red-950/10" : ""}`} data-testid={`row-aspect-${a.id}`}>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{a.processActivity || "—"}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-sm text-foreground leading-snug">{a.environmentalAspect}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground leading-snug">{a.potentialImpactDescription || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground leading-snug font-mono">{a.applicableRegulations || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                          a.aspectCondition === "emergency" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          a.aspectCondition === "abnormal" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {a.aspectCondition}{!a.isRoutine ? " · NR" : ""}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(a.impactTypes ?? []).map(t => (
                            <span key={t} className="text-xs font-black bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-sm text-center font-black">{a.severity}</td>
                      <td className="px-2 py-3 text-sm text-center font-black">{a.probability}</td>
                      <td className="px-2 py-3 text-sm text-center font-black">{a.regulatoryScore}</td>
                      <td className="px-2 py-3 text-center">
                        <ScoreDisplay s={a.severity} p={a.probability} r={a.regulatoryScore} score={a.significanceScore} sig={a.isSignificant} />
                      </td>
                      <td className="px-2 py-3 text-center"><SigBadge isSignificant={a.isSignificant} /></td>
                      <td className="px-2 py-3 text-center">
                        {a.lifeCycleConsidered ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{a.operationalControl || "—"}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" data-testid={`button-edit-aspect-${a.id}`}><FileText className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(a)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600" data-testid={`button-delete-aspect-${a.id}`}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Criteria Tab ── */}
        <TabsContent value="criteria" className="mt-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Severity (S) — Impact Magnitude", sub: "How severe is the environmental impact?", options: SEVERITY_OPTIONS },
              { title: "Probability (P) — Frequency / Likelihood", sub: "How often does or could this aspect occur?", options: PROBABILITY_OPTIONS },
              { title: "Regulatory (R) — Legal Significance", sub: "What level of regulatory obligation applies?", options: REGULATORY_OPTIONS },
            ].map(({ title, sub, options }) => (
              <div key={title} className="rounded-xl border p-4 space-y-2.5">
                <div>
                  <p className="font-black text-sm text-foreground leading-tight">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <div className="space-y-1.5">
                  {options.map(o => (
                    <div key={o.value} className="flex gap-2 items-start">
                      <span className={`shrink-0 w-6 h-6 rounded text-xs font-black flex items-center justify-center ${o.value >= 4 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : o.value === 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>{o.value}</span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{o.label.split(" – ")[1]}</p>
                        <p className="text-xs text-muted-foreground">{o.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-950/10 p-4 space-y-3 sm:col-span-2 lg:col-span-3">
              <p className="font-black text-sm text-red-700 dark:text-red-400">Significance Formula: S × P × R ≥ 75 = Significant Environmental Aspect (SEA)</p>
              <p className="text-sm text-muted-foreground">Maximum possible score: <strong>125</strong> (5 × 5 × 5). Threshold for significance: <strong>≥ 75</strong>. Significant aspects must be addressed in your EMS environmental objectives (§6.2), operational controls (§8.1), and management review inputs (§9.3).</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {([["≥ 75","SIGNIFICANT — SEA","bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"],["60–74","High — Review Controls","bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"],["30–59","Moderate","bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"],["< 30","Low","bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"]] as [string,string,string][]).map(([range, label, cls]) => (
                  <div key={range} className={`rounded-lg px-3 py-2 ${cls}`}>
                    <p className="text-sm font-black">{range}</p>
                    <p className="text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border p-4 space-y-2 sm:col-span-2 lg:col-span-3">
              <p className="font-black text-sm text-foreground">Environmental Impact Type Codes</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {IMPACT_TYPES.map(t => (
                  <div key={t.code} className="flex items-start gap-2 bg-muted/40 rounded-lg px-2 py-1.5">
                    <span className="text-xs font-black bg-lime-200 dark:bg-lime-800/40 text-lime-800 dark:text-lime-300 px-1.5 py-0.5 rounded shrink-0">{t.code}</span>
                    <div><p className="text-sm font-semibold">{t.label}</p><p className="text-xs text-muted-foreground">{t.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── ESA Guide / Wizard Tab ── */}
        <TabsContent value="guide" className="mt-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border w-fit mb-5">
            <button onClick={() => setGuideMode("wizard")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${guideMode === "wizard" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="guide-mode-wizard">
              <ArrowRight className="w-3.5 h-3.5" />Step-by-Step Wizard
            </button>
            <button onClick={() => setGuideMode("guide")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${guideMode === "guide" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="guide-mode-reference">
              <BookOpen className="w-3.5 h-3.5" />Methodology Reference
            </button>
          </div>

          {/* Wizard mode */}
          {guideMode === "wizard" && (
            <EsaWizard onSave={(data) => { create.mutate(data); setTab("register"); }} />
          )}

          {/* Reference guide mode */}
          {guideMode === "guide" && (
          <div className="space-y-4 max-w-4xl">
            {/* Header banner */}
            <div className="rounded-xl border border-lime-200 dark:border-lime-800/40 bg-lime-50/60 dark:bg-lime-950/10 p-5">
              <p className="font-black text-base text-lime-800 dark:text-lime-300">Environmental Significance Assessment (ESA) — Methodology Guide</p>
              <p className="text-sm text-muted-foreground mt-1">ISO 14001:2015 §6.1.2 requires the organization to determine environmental aspects and their associated environmental impacts, considering a life cycle perspective, and to identify those that have or can have a significant environmental impact.</p>
            </div>

            {/* Steps */}
            {[
              {
                step: "1", title: "Identify the Scope & Boundaries",
                color: "blue",
                points: [
                  "Define the physical and operational boundaries of your EMS (e.g., the facility, specific production lines, support functions).",
                  "Include activities, products, and services within your control or sphere of influence.",
                  "Consider all organizational functions: production, maintenance, utilities, transportation, waste handling, and office operations.",
                  "Document the scope in your EMS manual or System Profile.",
                ],
              },
              {
                step: "2", title: "Identify Environmental Aspects",
                color: "amber",
                points: [
                  "For each process or activity, ask: 'What element of this activity interacts with the environment?' The aspect is the element (e.g., use of chemicals, combustion of fuel).",
                  "Cover all three operating conditions: Normal (routine), Abnormal (start-up, shutdown, maintenance), and Emergency (spills, fires, equipment failure).",
                  "Include both negative aspects (pollution, waste) and positive aspects (recycling, energy recovery).",
                  "Apply a life cycle perspective: consider raw material extraction, manufacturing inputs, product use by customers, and end-of-life disposal — even if you don't directly control those phases.",
                ],
              },
              {
                step: "3", title: "Determine Environmental Impacts",
                color: "orange",
                points: [
                  "The impact is the change to the environment that results from the aspect (e.g., aspect = VOC emissions; impact = degradation of air quality / ground-level ozone formation).",
                  "Identify the receiving environment: atmosphere, surface water, groundwater, soil, ecosystems, human health.",
                  "Distinguish between actual impacts (what is currently occurring) and potential impacts (what could occur under abnormal or emergency conditions).",
                  "Classify by impact type using the standard codes: AQ (Air Quality), WG (Waste Generation), SS (Sanitary Sewer), SW (Storm Water), GW (Groundwater), SI (Soil Impact), EC (Energy Consumption), NR (Natural Resource).",
                ],
              },
              {
                step: "4", title: "Score for Significance (S × P × R)",
                color: "red",
                points: [
                  "Severity (S 1–5): How severe is the environmental damage if the impact occurs? Consider reversibility, geographic extent, and magnitude.",
                  "Probability (P 1–5): How frequently does this aspect occur or how likely is the impact? Consider operating time, historical incidents, and controls in place.",
                  "Regulatory (R 1–5): What is the level of regulatory obligation? Facility-specific federal permits = 5; voluntary programs = 1.",
                  "Significance Score = S × P × R. Threshold ≥ 75 out of 125 = Significant Environmental Aspect (SEA). The scoring must be consistent across all aspects — document your rationale.",
                ],
              },
              {
                step: "5", title: "Communicate Significant Aspects & Set Controls",
                color: "purple",
                points: [
                  "SEAs must be communicated within the organization at all relevant levels and functions (§7.3 Awareness).",
                  "Each SEA requires a documented operational control under §8.1 — this can be a procedure, work instruction, or inspection checklist.",
                  "SEAs should drive environmental objectives and targets under §6.2 (e.g., 'Reduce hazardous waste generation 10% by year-end').",
                  "SEAs must be included as inputs to Management Review under §9.3.2(a).",
                ],
              },
              {
                step: "6", title: "Maintain, Review & Update",
                color: "emerald",
                points: [
                  "The ESA register is documented information required by §6.1.2 — it must be maintained and retained as evidence of conformance.",
                  "Review the register when changes occur: new processes, new chemicals, facility expansions, regulatory changes, or significant incidents.",
                  "Review at minimum annually as part of the Management Review cycle.",
                  "Use internal audit findings (§9.2) and nonconformances (§10.2) as triggers to re-evaluate affected aspects.",
                ],
              },
            ].map(({ step, title, color, points }) => {
              const colorMap: Record<string, string> = {
                blue: "border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/10",
                amber: "border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10",
                orange: "border-orange-200 dark:border-orange-800/40 bg-orange-50/50 dark:bg-orange-950/10",
                red: "border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/10",
                purple: "border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/10",
                emerald: "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/10",
              };
              const numMap: Record<string, string> = {
                blue: "bg-blue-600 text-white", amber: "bg-amber-500 text-white",
                orange: "bg-orange-500 text-white", red: "bg-red-600 text-white",
                purple: "bg-purple-600 text-white", emerald: "bg-emerald-600 text-white",
              };
              return (
                <div key={step} className={`rounded-xl border p-5 space-y-3 ${colorMap[color]}`}>
                  <div className="flex items-center gap-3">
                    <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${numMap[color]}`}>{step}</span>
                    <p className="font-black text-base text-foreground">{title}</p>
                  </div>
                  <div className="space-y-2 pl-11">
                    {points.map((pt, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Org-specific callout */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-950/10 p-4 flex gap-3">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-sm text-blue-800 dark:text-blue-300">Aspects Are Organization-Specific — There Is No Universal Template</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A healthcare clinic, a software company, a food processor, and a metal fabricator will each produce a completely different ESA register — and that is exactly correct. ISO 14001 does not prescribe which aspects you must list; it requires you to systematically identify the aspects that arise from <em>your</em> specific processes, activities, and services. Your register should reflect your operations, not a generic checklist. Use the Isa Assessment tab to have a Lead ISO Auditor review your register on its own terms.
                </p>
              </div>
            </div>

            {/* Auditor tips */}
            <div className="rounded-xl border border-amber-300 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-950/20 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="font-black text-sm text-amber-800 dark:text-amber-300">Common Auditor Findings — ISO 14001 §6.1.2</p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">These apply across industries — regardless of what type of organization you are.</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-amber-900 dark:text-amber-200">
                {[
                  "Register not updated after process changes, new chemicals, or new services are introduced",
                  "Emergency conditions (spills, leaks, power loss) not covered as separate aspect rows",
                  "Life cycle perspective absent — only direct operational outputs considered, no upstream or downstream phases",
                  "SEA designation not linked to a documented operational control or procedure",
                  "SEAs not included as inputs to the Management Review agenda (§9.3.2a)",
                  "Scoring rationale undocumented — scores appear inconsistent or arbitrary across aspects",
                  "Regulatory score (R) underestimated — permits and legal obligations not reflected in the scoring",
                  "Register scope does not align with the EMS scope statement — aspects inside scope boundaries are missing",
                ].map((finding, i) => (
                  <div key={i} className="flex gap-2 items-start bg-amber-100/60 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    <span className="text-amber-600 dark:text-amber-400 font-black shrink-0">!</span>
                    <p className="text-xs leading-snug">{finding}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </TabsContent>

        {/* ── Isa Assessment Tab ── */}
        <TabsContent value="isa" className="mt-3">
          {!isaConvId ? (
            <div className="max-w-xl mx-auto py-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mx-auto">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-foreground">Isa — Lead ISO Auditor</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Isa will review your entire ESA register and provide a structured audit-style assessment covering completeness, scoring integrity, life cycle perspective, SEA follow-through, and third-party audit readiness.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-md mx-auto text-xs text-muted-foreground">
                {[
                  "Register completeness vs. industry norms",
                  "S×P×R scoring defensibility",
                  "Life cycle perspective coverage",
                  "SEA operational control linkage",
                  "Gaps an auditor would flag",
                  "Certification readiness assessment",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              {allAspects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Add aspects to your register first, then Isa can assess them.</p>
              ) : (
                <Button onClick={requestIsaAssessment} disabled={createConv.isPending} className="bg-accent hover:bg-accent/90 text-white gap-2 px-6" data-testid="button-start-isa-assessment">
                  {createConv.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Request Isa Assessment ({allAspects.length} aspects)
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Isa header bar */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-sm font-bold text-foreground">Isa — Lead ISO Auditor Assessment</p>
                  <Badge className="bg-accent/15 text-accent border-accent/30 text-xs">ISO 14001 §6.1.2</Badge>
                </div>
                <button
                  onClick={() => { setIsaConvId(null); setIsaPrompt(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
                  data-testid="button-isa-reset"
                >
                  <RefreshCw className="w-3 h-3" /> New Assessment
                </button>
              </div>
              <IsaAssessmentChat conversationId={isaConvId} initialPrompt={isaPrompt} />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editing ? "Edit Environmental Aspect" : "Add Environmental Aspect / Impact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-bold">Process / Task / Activity</Label>
                <Input className="mt-1" placeholder="e.g., Paint Booth Operations, Facility Maintenance, Welding" value={form.processActivity} onChange={e => setForm(f => ({ ...f, processActivity: e.target.value }))} data-testid="input-process-activity" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-bold">Environmental Aspect <span className="text-red-500">*</span></Label>
                <Input className="mt-1" placeholder="e.g., Disposal of hazardous waste, Fuel combustion, Water usage" value={form.environmentalAspect} onChange={e => setForm(f => ({ ...f, environmentalAspect: e.target.value }))} data-testid="input-environmental-aspect" />
              </div>
              <div>
                <Label className="text-xs font-bold">Operating Condition</Label>
                <Select value={form.aspectCondition} onValueChange={v => setForm(f => ({ ...f, aspectCondition: v }))}>
                  <SelectTrigger className="mt-1 h-9" data-testid="select-aspect-condition"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="abnormal">Abnormal (startup / shutdown)</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="chk-routine" checked={form.isRoutine} onChange={e => setForm(f => ({ ...f, isRoutine: e.target.checked }))} className="w-4 h-4 rounded border-border" data-testid="checkbox-is-routine" />
                <Label htmlFor="chk-routine" className="text-xs font-semibold cursor-pointer">Routine Activity</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold">Potential Environmental Impact Description</Label>
              <Textarea className="mt-1 text-sm h-16 resize-none" placeholder="e.g., Air emissions to atmosphere, groundwater contamination, storm water discharge..." value={form.potentialImpactDescription} onChange={e => setForm(f => ({ ...f, potentialImpactDescription: e.target.value }))} data-testid="textarea-impact-description" />
            </div>
            <div>
              <Label className="text-sm font-bold mb-1.5 block">Impact Type(s)</Label>
              <div className="flex flex-wrap gap-1.5">
                {IMPACT_TYPES.map(t => (
                  <button key={t.code} type="button" onClick={() => toggleImpact(t.code)}
                    className={`text-sm px-2.5 py-1 rounded-full border font-bold transition-colors ${form.impactTypes.includes(t.code) ? "bg-lime-600 text-white border-lime-600" : "border-border text-muted-foreground hover:border-lime-500"}`}
                    data-testid={`toggle-impact-${t.code}`}>
                    {t.code} — {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-bold">Applicable Regulations (F/S/L)</Label>
                <Textarea className="mt-1 text-sm h-16 resize-none" placeholder="40 CFR 279 (F), Act 451 Part 121 (S), City Ord. §82 (L)..." value={form.applicableRegulations} onChange={e => setForm(f => ({ ...f, applicableRegulations: e.target.value }))} data-testid="textarea-applicable-regulations" />
              </div>
              <div>
                <Label className="text-sm font-bold">Other Requirements</Label>
                <Textarea className="mt-1 text-sm h-16 resize-none" placeholder="Corporate policy, customer requirement, voluntary (ISO 14001)..." value={form.otherRequirements} onChange={e => setForm(f => ({ ...f, otherRequirements: e.target.value }))} data-testid="textarea-other-requirements" />
              </div>
            </div>
            {/* Scoring */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Significance Scoring — S × P × R</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  ["Severity (S)", "severity", SEVERITY_OPTIONS],
                  ["Probability (P)", "probability", PROBABILITY_OPTIONS],
                  ["Regulatory (R)", "regulatoryScore", REGULATORY_OPTIONS],
                ] as [string, keyof typeof ASPECT_BLANK, typeof SEVERITY_OPTIONS][]).map(([lbl, field, opts]) => (
                  <div key={field}>
                    <Label className="text-xs font-bold">{lbl}</Label>
                    <Select value={String(form[field])} onValueChange={v => setForm(f => ({ ...f, [field]: Number(v) }))}>
                      <SelectTrigger className="mt-1 h-9" data-testid={`select-${field}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{opts.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{opts.find(o => o.value === form[field] as number)?.desc}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded-lg px-4 py-3 flex items-center justify-between gap-4 ${liveSig ? "bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-700/40" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30"}`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Score</p>
                  <p className={`text-4xl font-black ${liveSig ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{liveScore}</p>
                  <p className="text-xs text-muted-foreground">{form.severity} × {form.probability} × {form.regulatoryScore} = {liveScore} / 125</p>
                </div>
                <div className="text-right">
                  {liveSig
                    ? <Badge className="bg-red-600 text-white border-0 text-sm font-black px-3 py-1">⚠ SIGNIFICANT</Badge>
                    : <Badge className="bg-emerald-600 text-white border-0 text-sm font-black px-3 py-1">✓ Not Significant</Badge>}
                  <p className="text-xs text-muted-foreground mt-1">Threshold ≥ 75</p>
                </div>
              </div>
            </div>
            {/* Controls & metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="chk-lc" checked={form.lifeCycleConsidered} onChange={e => setForm(f => ({ ...f, lifeCycleConsidered: e.target.checked }))} className="w-4 h-4 rounded border-border" data-testid="checkbox-lifecycle" />
                <Label htmlFor="chk-lc" className="text-xs font-semibold cursor-pointer">Life Cycle Considered (ISO 14001 §6.1.2 — facility has influence over this aspect's upstream/downstream phases)</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-bold">Operational Control / Document Name &amp; Number</Label>
                <Input className="mt-1" placeholder="e.g., WI-ENV-001 Waste Management Procedure, Monthly monitoring log" value={form.operationalControl} onChange={e => setForm(f => ({ ...f, operationalControl: e.target.value }))} data-testid="input-operational-control" />
              </div>
              <div>
                <Label className="text-xs font-bold">Environmental Objective / Target</Label>
                <Input className="mt-1" placeholder="e.g., Reduce hazardous waste 10% by year-end" value={form.objectiveTarget} onChange={e => setForm(f => ({ ...f, objectiveTarget: e.target.value }))} data-testid="input-objective-target" />
              </div>
              <div>
                <Label className="text-xs font-bold">Responsible Person</Label>
                <Input className="mt-1" placeholder="Name or role" value={form.responsiblePerson} onChange={e => setForm(f => ({ ...f, responsiblePerson: e.target.value }))} data-testid="input-responsible-person" />
              </div>
              <div>
                <Label className="text-xs font-bold">Next Review Date</Label>
                <Input type="date" className="mt-1" value={form.reviewDate} onChange={e => setForm(f => ({ ...f, reviewDate: e.target.value }))} data-testid="input-review-date" />
              </div>
              <div>
                <Label className="text-xs font-bold">Notes</Label>
                <Input className="mt-1" placeholder="Additional context..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-notes-aspect" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending} className="bg-lime-600 hover:bg-lime-500 text-white" data-testid="button-save-aspect">
              {(create.isPending || update.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Add to Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Environmental Aspect?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove <strong className="text-foreground">{deleteConfirm?.environmentalAspect}</strong> from your register. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && del.mutate(deleteConfirm.id)} disabled={del.isPending} data-testid="button-confirm-delete-aspect">
              {del.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
