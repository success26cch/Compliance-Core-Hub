import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, Loader2, ShieldCheck, AlertTriangle, Trash2,
  Pencil, Filter, Printer, ClipboardList, HardHat,
  ChevronDown, ChevronRight, CheckCircle2, X, RefreshCw,
  Users, Zap, FlaskConical, Activity, Brain, Flame, Settings, Leaf,
  BookOpen, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HazardRecord {
  id: number;
  workArea: string | null;
  activityTask: string;
  hazardDescription: string;
  hazardType: string;
  operatingCondition: string;
  whoAffected: string[] | null;
  consequenceDescription: string | null;
  existingControls: string | null;
  // P × G × M scoring (AIAG / ISO 45001 industry standard)
  probability: number;   // P: 1=Not-Probable, 3=Low, 7=High, 10=Very High
  gravity: number;       // G: 1=Negligible, 3=Low, 7=High, 10=Very High
  magnitude: number;     // M: 1=Very High Prevention … 4=No Prevention
  riskScore: number;     // P × G × M  (max 400)
  riskLevel: string;
  controlHierarchy: string[] | null;
  plannedControls: string | null;
  residualProbability: number;
  residualGravity: number;
  residualMagnitude: number;
  residualRiskScore: number;
  residualRiskLevel: string;
  actionRequired: string | null;
  responsiblePerson: string | null;
  targetDate: string | null;
  status: string;
  legalRequirement: string | null;
  iso45001Clause: string | null;
  notes: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HAZARD_TYPES = [
  { value: "physical",      label: "Physical",        icon: Activity },
  { value: "chemical",      label: "Chemical",        icon: FlaskConical },
  { value: "biological",    label: "Biological",      icon: Leaf },
  { value: "ergonomic",     label: "Ergonomic",       icon: Users },
  { value: "psychosocial",  label: "Psychosocial",    icon: Brain },
  { value: "electrical",    label: "Electrical",      icon: Zap },
  { value: "mechanical",    label: "Mechanical",      icon: Settings },
  { value: "fire",          label: "Fire / Explosion",icon: Flame },
  { value: "environmental", label: "Environmental",   icon: Leaf },
  { value: "other",         label: "Other",           icon: ClipboardList },
];

const WHO_AFFECTED_OPTIONS = [
  { value: "employees",    label: "Employees" },
  { value: "contractors",  label: "Contractors" },
  { value: "visitors",     label: "Visitors" },
  { value: "public",       label: "Public / Community" },
];

const CONTROL_HIERARCHY_OPTIONS = [
  { value: "elimination",     label: "Elimination",           desc: "Remove the hazard entirely" },
  { value: "substitution",    label: "Substitution",          desc: "Replace with a less hazardous alternative" },
  { value: "engineering",     label: "Engineering Controls",  desc: "Guarding, ventilation, isolation" },
  { value: "administrative",  label: "Administrative Controls",desc: "Procedures, training, job rotation" },
  { value: "ppe",             label: "PPE",                   desc: "Personal Protective Equipment" },
];

// ─── P × G × M Scoring Criteria (AIAG / ISO 45001 §6.1.2) ────────────────────

const PROBABILITY_OPTS = [
  {
    value: 1, label: "1 – Not-Probable",
    desc: "No historical incidents. Theoretical risk only — would require multiple simultaneous independent failures. <0.1 incidents / 1,000 worker-years.",
  },
  {
    value: 3, label: "3 – Low",
    desc: "1–2 near-misses or minor incidents on record (past 5 yrs). Unusual conditions required. Rarely observed unsafe behavior. ~1–5 incidents / 1,000 worker-years.",
  },
  {
    value: 7, label: "7 – High",
    desc: "Multiple near-misses or incidents documented in past 3 yrs. Unsafe behaviors regularly observed under normal operations. ~5–20 incidents / 1,000 worker-years. OSHA DART rate elevated.",
  },
  {
    value: 10, label: "10 – Very High",
    desc: "Recurring injuries or incidents without effective intervention. Daily/constant exposure. >20 incidents / 1,000 worker-years. OSHA NAICS benchmark exceeded. Certain to occur if not addressed.",
  },
];

const GRAVITY_OPTS = [
  {
    value: 1, label: "1 – Negligible",
    desc: "First-aid only (bandage, rest, OTC medication). NOT OSHA Recordable. Employee returns to work same day. No regulatory exposure. Property damage <$500.",
  },
  {
    value: 3, label: "3 – Low",
    desc: "OSHA Recordable — medical treatment beyond first aid, restricted duty, or job transfer. Work restriction <7 days. Possible Other-Than-Serious citation ($0–$15,625). Workers' comp medical-only claim. Property damage $500–$5,000.",
  },
  {
    value: 7, label: "7 – High",
    desc: "OSHA Recordable with Days Away From Work (DAFW) or permanent partial disability. OSHA Serious citation ($1,036–$15,625/violation). Significant lost-time workers' comp claim. Possible OSHA inspection trigger. Property damage $5,000–$50,000.",
  },
  {
    value: 10, label: "10 – Very High",
    desc: "Fatality, amputation, or permanent total disability. OSHA Willful/Repeat citation ($10,360–$156,259/violation). Potential criminal referral (Section 17(e)). Regulatory shutdown / stop-work order. Property damage >$50,000. Severe reputational & litigation risk.",
  },
];

const MAGNITUDE_OPTS = [
  {
    value: 1, label: "1 – Very High Prevention",
    desc: "Engineering controls eliminate/reduce exposure to <1% of PEL/TLV. Interlocks, guarding, LOTO, LEV, or elimination fully applied (ISO 45001 §8.1.2 Tier 1). 100% compliance verified. Zero recordable injuries in 3+ yrs.",
  },
  {
    value: 2, label: "2 – High Prevention",
    desc: "Admin controls + PPE program documented, trained, and signed off. Written JSA/SWP per 29 CFR 1910.132. >90% compliance on last 3 audits. Minor first-aid incidents only. ISO 45001 §8.1.2 Tier 3–4 applied.",
  },
  {
    value: 3, label: "3 – Low Prevention",
    desc: "Some controls exist but inconsistently applied. <80% compliance rate. PPE worn irregularly or wrong type. One or more OSHA-recordable injuries in past 3 yrs. No formal JSA. Training records incomplete.",
  },
  {
    value: 4, label: "4 – No Prevention",
    desc: "No engineering or admin controls in place. PPE absent or consistently misused. Repeat OSHA violations on record. Multiple recordables per year. Workers unaware of hazards (no HazCom/GHS training). §8.1.2 hierarchy not applied.",
  },
];

// ─── Full scoring criteria for the Reference Guide panel ──────────────────────
const SCORING_CRITERIA = {
  probability: [
    {
      value: 1, rating: "Not-Probable", badge: "bg-green-100 text-green-800 border-green-300",
      frequency: "< 0.1 incidents / 1,000 worker-years",
      criteria: "No historical incidents in this task or process. Only a theoretical risk requiring multiple simultaneous independent failures. Would be extraordinary if it occurred.",
      examples: "Catastrophic simultaneous failure of all engineered safeguards; double-fault requiring two unrelated control failures at the same moment.",
      oshaRef: "No OSHA process safety trigger. OSHA PSM threshold not approached.",
    },
    {
      value: 3, rating: "Low", badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
      frequency: "1–5 incidents / 1,000 worker-years",
      criteria: "1–2 near-misses or minor incidents on record in the past 5 years. Atypical or unusual conditions required. Rarely observed unsafe behavior during routine observation.",
      examples: "Unexpected task deviation by an experienced worker; single-point control failure that has occurred once; slip in an area that is normally dry.",
      oshaRef: "Below industry OSHA DART rate benchmark. No PSM/IATF-level frequency trigger.",
    },
    {
      value: 7, rating: "High", badge: "bg-orange-100 text-orange-800 border-orange-300",
      frequency: "5–20 incidents / 1,000 worker-years",
      criteria: "Multiple near-misses or incidents documented in the past 3 years. Common under routine operations. Unsafe behaviors regularly observed. OSHA DART rate elevated above NAICS average.",
      examples: "Repetitive manual handling sprains; slip/trip in a chronically wet area; chemical splashes during routine transfer; struck-by incidents at a busy dock.",
      oshaRef: "Likely to trigger OSHA programmed or unprogrammed inspection. 29 CFR 1904 recordable trend. NAICS benchmarking exceeds average.",
    },
    {
      value: 10, rating: "Very High", badge: "bg-red-100 text-red-800 border-red-300",
      frequency: "> 20 incidents / 1,000 worker-years",
      criteria: "Recurring injuries or incidents without effective intervention. Daily or constant exposure to the hazard. OSHA NAICS benchmark significantly exceeded. No surprise if the event occurs.",
      examples: "Unguarded rotating machinery in daily use; chemical handling without SDS/PPE on high-frequency task; uncontrolled energized work without LOTO; forklift pedestrian interaction in shared aisle.",
      oshaRef: "High probability of OSHA citation upon inspection. PSM/RMP regulatory trigger if chemical. OSHA National Emphasis Program (NEP) scope likely.",
    },
  ],
  gravity: [
    {
      value: 1, rating: "Negligible", badge: "bg-green-100 text-green-800 border-green-300",
      oshaRecordable: "NOT Recordable",
      injuryType: "First-aid only — bandage, OTC medication, rest. Employee returns same day.",
      examples: "Minor abrasion, brief eye irritation, paper cut, small bruise, muscle stiffness relieved by rest.",
      regulatory: "No OSHA citation exposure. No workers' comp indemnity. Property damage < $500.",
      penalty: "N/A",
    },
    {
      value: 3, rating: "Low", badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
      oshaRecordable: "OSHA Recordable",
      injuryType: "Medical treatment beyond first aid; restricted work duty or job transfer; work restriction < 7 days.",
      examples: "Sprain/strain requiring physical therapy, laceration needing sutures, minor chemical burn with medical treatment, hearing threshold shift, eye injury needing prescription treatment.",
      regulatory: "Possible OSHA Other-Than-Serious citation. Workers' comp medical-only or minor indemnity claim.",
      penalty: "$0 – $15,625 per violation (Other-Than-Serious)",
    },
    {
      value: 7, rating: "High", badge: "bg-orange-100 text-orange-800 border-orange-300",
      oshaRecordable: "OSHA Recordable — Days Away From Work (DAFW)",
      injuryType: "Days Away From Work > 7 days; permanent partial disability; significant hospitalization.",
      examples: "Fracture, crush injury, chemical exposure requiring hospitalization, repetitive motion injury with permanent restriction, noise-induced hearing loss (permanent), back injury with surgery.",
      regulatory: "OSHA Serious citation. Possible OSHA inspection trigger. Significant lost-time workers' comp claim (WC indemnity + medical). Potential civil liability.",
      penalty: "$1,036 – $15,625 per violation (Serious) | Up to $15,625/day for continuing violations",
    },
    {
      value: 10, rating: "Very High", badge: "bg-red-100 text-red-800 border-red-300",
      oshaRecordable: "OSHA Recordable — Fatality / Amputation / Permanent Total Disability",
      injuryType: "Fatality, amputation, permanent total disability, or catastrophic multi-victim event.",
      examples: "Worker fatality, traumatic amputation, permanent blindness, catastrophic chemical release (IDLH), explosion, confined space fatality, electrocution.",
      regulatory: "OSHA Willful or Repeat citation. Potential criminal referral under OSH Act §17(e). Regulatory stop-work order or shutdown. Catastrophic workers' comp claim. Reputational damage, OSHA press release, civil & criminal litigation.",
      penalty: "$10,360 – $156,259 per violation (Willful/Repeat) | Criminal penalties up to $10,000 + imprisonment for willful violation resulting in death",
    },
  ],
  magnitude: [
    {
      value: 1, rating: "Very High Prevention", badge: "bg-green-100 text-green-800 border-green-300",
      controlTier: "ISO 45001 §8.1.2 — Tier 1: Elimination / Substitution + Engineering Controls",
      description: "Engineering controls fully eliminate or reduce exposure to < 1% of PEL/TLV. Controls are automatic, passive, and do not depend on human behavior.",
      examples: "Fully interlocked machine guarding; automated LOTO system; local exhaust ventilation (LEV) at emission source; process redesign eliminating chemical use; pressurized enclosure for noise.",
      compliance: "100% compliance verified in last internal audit. Zero OSHA-recordable injuries in 3+ years. Zero near-miss reports. PPE used only as secondary backup.",
      oshaRef: "Satisfies 29 CFR 1910.212 (guarding), 1910.147 (LOTO), 1910.94 (ventilation). OSHA compliant — lowest citation risk.",
    },
    {
      value: 2, rating: "High Prevention", badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
      controlTier: "ISO 45001 §8.1.2 — Tier 3–4: Administrative Controls + PPE",
      description: "Formal administrative controls and a documented PPE program in place. Written JSA/SWP documented, trained, and signed off. Controls effective but dependent on human behavior.",
      examples: "Formal permit-to-work system; signed JSA/SWP with training records; PPE hazard assessment per 29 CFR 1910.132; regular safety inspections; SDS accessible at point of use; HazCom training documented.",
      compliance: "> 90% compliance rate on last 3 safety audits. First-aid incidents only (no recordables) in past 3 years. PPE fit-testing and inspection records current.",
      oshaRef: "Meets 29 CFR 1910.132 (PPE), 1910.1200 (HazCom), 1910.119 (PSM if applicable). Reduced citation risk — documentation must be current.",
    },
    {
      value: 3, rating: "Low Prevention", badge: "bg-orange-100 text-orange-800 border-orange-300",
      controlTier: "ISO 45001 §8.1.2 — Partial / Inconsistent Controls",
      description: "Some controls exist but are inconsistently applied. No formal control plan or JSA. Training records incomplete. Controls depend on individual awareness rather than system enforcement.",
      examples: "Informal verbal safety rules; aging machine guards occasionally bypassed; generic SDS not task-specific; PPE available but not enforced; inspection intervals not documented; near-misses under-reported.",
      compliance: "< 80% compliance rate. One or more OSHA-recordable injuries in past 3 years. Training records incomplete or expired. Near-miss culture weak.",
      oshaRef: "Significant OSHA citation risk on inspection. Likely Other-Than-Serious to Serious citations for documentation gaps. 29 CFR 1904 recordable trend present.",
    },
    {
      value: 4, rating: "No Prevention", badge: "bg-red-100 text-red-800 border-red-300",
      controlTier: "ISO 45001 §8.1.2 — No Controls Applied",
      description: "No engineering or administrative controls in place. PPE absent or consistently misused. Workers unaware of hazards. No HazCom/GHS compliance. ISO 45001 §8.1.2 hierarchy completely unapplied.",
      examples: "Unguarded rotating parts in active use; no LOTO procedures; chemicals with no labeling or SDS; PPE required but never worn; no inspection or maintenance schedule; employees unable to identify job hazards.",
      compliance: "Multiple OSHA-recordable injuries per year. Repeat OSHA violations on record. High near-miss frequency unreported. Workers demonstrate low hazard awareness.",
      oshaRef: "Very high OSHA Serious/Willful citation risk. Possible OSHA 11(c) retaliation if injuries under-reported. High probability of stop-work order for imminent danger conditions (OSH Act §13).",
    },
  ],
};

const CLAUSES = [
  "4.1 – Context of the organization",
  "4.2 – Interested parties needs",
  "6.1.1 – Actions to address risks & opportunities",
  "6.1.2 – Hazard identification",
  "6.1.3 – OH&S opportunities",
  "6.1.4 – Legal and other requirements",
  "8.1.1 – General operational planning",
  "8.1.2 – Hierarchy of controls",
  "8.1.3 – Management of change",
  "9.1.2 – Evaluation of compliance",
];

// ─── Risk helpers ─────────────────────────────────────────────────────────────
function riskLevelMeta(level: string) {
  switch (level) {
    case "critical": return { label: "Critical", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" };
    case "high":     return { label: "High",     color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700" };
    case "medium":   return { label: "Medium",   color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700" };
    default:         return { label: "Low",      color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" };
  }
}

// P × G × M  Risk Score = Probability × Gravity × Magnitude  (max 400)
function calcScore(p: number, g: number, m: number) { return p * g * m; }
function scoreToLevel(score: number): string {
  if (score <= 30)  return "low";
  if (score <= 100) return "medium";
  if (score <= 280) return "high";
  return "critical";
}

function RiskBadge({ score, level }: { score: number; level: string }) {
  const meta = riskLevelMeta(level);
  return (
    <span className={`inline-flex items-center gap-1 border rounded px-2 py-0.5 text-xs font-bold ${meta.color}`}>
      {score} – {meta.label}
    </span>
  );
}

// ─── Print ────────────────────────────────────────────────────────────────────
function printHazardRegister(records: HazardRecord[]) {
  const levelCell = (level: string, score: number) => {
    const colors: Record<string, string> = {
      critical: "#fee2e2", high: "#ffedd5", medium: "#fef9c3", low: "#dcfce7",
    };
    return `<td style="background:${colors[level] || "#f3f4f6"};font-weight:bold;text-align:center">${score}<br/><small>${level.toUpperCase()}</small></td>`;
  };
  const html = `<!DOCTYPE html><html><head><title>ISO 45001 Hazard Analysis Register</title>
  <style>body{font-family:Arial,sans-serif;font-size:10px;margin:20px}
  h1{font-size:14px;margin-bottom:4px}p{margin:2px 0;color:#555}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#1e3a5f;color:#fff;padding:5px 6px;font-size:9px;text-align:left}
  td{padding:4px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  tr:nth-child(even){background:#f9fafb}
  @media print{@page{size:landscape;margin:1cm}}</style></head><body>
  <h1>ISO 45001:2018 — Hazard Analysis &amp; Risk Assessment Register</h1>
  <p>Clause 6.1.2 | Generated: ${new Date().toLocaleDateString()}</p>
  <table><thead><tr>
    <th>#</th><th>Work Area</th><th>Activity / Task</th><th>Hazard</th><th>Type</th>
    <th>Condition</th><th>Who Affected</th><th>Consequence</th><th>Existing Controls</th>
    <th>P</th><th>G</th><th>M</th><th>Risk Score (P×G×M)</th>
    <th>Control Hierarchy</th><th>Planned Controls</th>
    <th>Res. P</th><th>Res. G</th><th>Res. M</th><th>Residual Risk</th>
    <th>Action Required</th><th>Responsible</th><th>Target Date</th><th>Status</th>
  </tr></thead><tbody>
  ${records.map((r, i) => `<tr>
    <td>${i + 1}</td>
    <td>${r.workArea || "—"}</td>
    <td>${r.activityTask}</td>
    <td>${r.hazardDescription}</td>
    <td>${r.hazardType}</td>
    <td>${r.operatingCondition}</td>
    <td>${(r.whoAffected || []).join(", ") || "—"}</td>
    <td>${r.consequenceDescription || "—"}</td>
    <td>${r.existingControls || "—"}</td>
    <td style="text-align:center">${r.probability}</td>
    <td style="text-align:center">${r.gravity}</td>
    <td style="text-align:center">${r.magnitude}</td>
    ${levelCell(r.riskLevel, r.riskScore)}
    <td>${(r.controlHierarchy || []).join(", ") || "—"}</td>
    <td>${r.plannedControls || "—"}</td>
    <td style="text-align:center">${r.residualProbability}</td>
    <td style="text-align:center">${r.residualGravity}</td>
    <td style="text-align:center">${r.residualMagnitude}</td>
    ${levelCell(r.residualRiskLevel, r.residualRiskScore)}
    <td>${r.actionRequired || "—"}</td>
    <td>${r.responsiblePerson || "—"}</td>
    <td>${r.targetDate || "—"}</td>
    <td>${r.status}</td>
  </tr>`).join("")}
  </tbody></table></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-center justify-center mb-5">
        <HardHat className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="font-bold text-lg text-foreground mb-2">No hazards identified yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Begin your ISO 45001 §6.1.2 hazard identification by adding your first hazard assessment record.
      </p>
      <Button onClick={onAdd} data-testid="btn-add-first-hazard">
        <Plus className="w-4 h-4 mr-2" /> Add First Hazard
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HazardAnalysisModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HazardRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterArea, setFilterArea] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: records = [], isLoading } = useQuery<HazardRecord[]>({
    queryKey: ["/api/iso/hazard-analysis"],
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; data: Record<string, unknown> }) =>
      payload.id
        ? apiRequest("PATCH", `/api/iso/hazard-analysis/${payload.id}`, payload.data)
        : apiRequest("POST", "/api/iso/hazard-analysis", payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso/hazard-analysis"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: "Hazard record saved." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso/hazard-analysis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso/hazard-analysis"] });
      toast({ title: "Record deleted." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterLevel !== "all" && r.riskLevel !== filterLevel) return false;
      if (filterType !== "all" && r.hazardType !== filterType) return false;
      if (filterCondition !== "all" && r.operatingCondition !== filterCondition) return false;
      if (filterArea && !r.workArea?.toLowerCase().includes(filterArea.toLowerCase())) return false;
      return true;
    });
  }, [records, filterStatus, filterLevel, filterType, filterCondition, filterArea]);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: records.length,
    critical: records.filter(r => r.riskLevel === "critical").length,
    high: records.filter(r => r.riskLevel === "high").length,
    openActions: records.filter(r => r.status === "open" && r.actionRequired).length,
    closed: records.filter(r => r.status === "closed").length,
  }), [records]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(r: HazardRecord) {
    setEditing(r);
    setDialogOpen(true);
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HardHat className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-foreground">Hazard Analysis &amp; Risk Assessment</h2>
            <Badge variant="outline" className="text-[10px] font-mono">ISO 45001 §6.1.2</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Identify, evaluate, and control occupational health &amp; safety hazards using the hierarchy of controls.
          </p>
        </div>
        <div className="flex gap-2">
          {records.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => printHazardRegister(records)} data-testid="btn-print-hazards">
              <Printer className="w-4 h-4 mr-1.5" /> Print Register
            </Button>
          )}
          <Button size="sm" onClick={openAdd} data-testid="btn-add-hazard">
            <Plus className="w-4 h-4 mr-1.5" /> Add Hazard
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Hazards", value: stats.total, color: "text-foreground", bg: "bg-muted/40" },
            { label: "Critical Risk", value: stats.critical, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" },
            { label: "High Risk", value: stats.high, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" },
            { label: "Open Actions", value: stats.openActions, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800" },
          ].map(c => (
            <div key={c.label} className={`rounded-xl p-4 ${c.bg}`}>
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Risk Matrix Legend — P × G × M */}
      {records.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Risk Score = P × G × M (max 400)</span>
          {[
            { level: "low",      range: "1–30"   },
            { level: "medium",   range: "31–100"  },
            { level: "high",     range: "101–280" },
            { level: "critical", range: "281–400" },
          ].map(({ level, range }) => {
            const meta = riskLevelMeta(level);
            return (
              <span key={level} className={`border rounded px-2 py-0.5 font-semibold ${meta.color}`}>
                {meta.label} ({range})
              </span>
            );
          })}
        </div>
      )}

      {/* Filters */}
      {records.length > 0 && (
        <div className="border rounded-lg px-3 py-2.5 bg-muted/20 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Filter by work area…"
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="h-7 w-44 text-xs"
              data-testid="input-filter-area"
            />
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="h-7 w-36 text-xs" data-testid="select-filter-level">
                <SelectValue placeholder="Risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-7 w-36 text-xs" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-7 w-38 text-xs" data-testid="select-filter-type">
                <SelectValue placeholder="Hazard type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hazard Types</SelectItem>
                {HAZARD_TYPES.map(h => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCondition} onValueChange={setFilterCondition}>
              <SelectTrigger className="h-7 w-38 text-xs" data-testid="select-filter-condition">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="non-routine">Non-Routine</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            {(filterArea || filterLevel !== "all" || filterStatus !== "all" || filterType !== "all" || filterCondition !== "all") && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setFilterArea(""); setFilterLevel("all"); setFilterStatus("all"); setFilterType("all"); setFilterCondition("all"); }} data-testid="btn-clear-filters">
                <X className="w-3 h-3 mr-1" /> Clear All
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {records.length} records</span>
          </div>
          {/* Active filter chips */}
          {(filterLevel !== "all" || filterStatus !== "all" || filterType !== "all" || filterCondition !== "all" || filterArea) && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {filterArea && (
                <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  Area: {filterArea}
                  <button type="button" onClick={() => setFilterArea("")} className="hover:text-blue-900 dark:hover:text-blue-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {filterLevel !== "all" && (
                <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize">
                  Risk: {filterLevel}
                  <button type="button" onClick={() => setFilterLevel("all")} className="hover:text-orange-900 dark:hover:text-orange-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {filterStatus !== "all" && (
                <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize">
                  Status: {filterStatus}
                  <button type="button" onClick={() => setFilterStatus("all")} className="hover:text-purple-900 dark:hover:text-purple-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {filterType !== "all" && (
                <span className="inline-flex items-center gap-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize">
                  Type: {filterType}
                  <button type="button" onClick={() => setFilterType("all")} className="hover:text-teal-900 dark:hover:text-teal-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {filterCondition !== "all" && (
                <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize">
                  Condition: {filterCondition}
                  <button type="button" onClick={() => setFilterCondition("all")} className="hover:text-yellow-900 dark:hover:text-yellow-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && records.length === 0 && <EmptyState onAdd={openAdd} />}

      {/* Register Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700 dark:bg-slate-800 border-b text-xs font-semibold text-white uppercase tracking-wide">
                <th className="text-left px-3 py-2.5 w-6"></th>
                <th className="text-left px-3 py-2.5">Work Area</th>
                <th className="text-left px-3 py-2.5">Activity / Task</th>
                <th className="text-left px-3 py-2.5">Hazard</th>
                <th className="text-left px-3 py-2.5">Type</th>
                <th className="text-left px-3 py-2.5">Condition</th>
                <th className="text-center px-3 py-2.5">Inherent Risk</th>
                <th className="text-center px-3 py-2.5">Residual Risk</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-left px-3 py-2.5">Responsible</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isExpanded = expanded === r.id;
                const condColor = r.operatingCondition === "emergency" ? "text-red-600 dark:text-red-400" : r.operatingCondition === "non-routine" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";
                return (
                  <>
                    <tr
                      key={r.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                      data-testid={`row-hazard-${r.id}`}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{r.workArea || "—"}</td>
                      <td className="px-3 py-2.5 text-foreground max-w-[180px] truncate">{r.activityTask}</td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{r.hazardDescription}</td>
                      <td className="px-3 py-2.5">
                        <span className="capitalize text-xs bg-muted px-2 py-0.5 rounded-full">{r.hazardType}</span>
                      </td>
                      <td className={`px-3 py-2.5 capitalize font-medium ${condColor}`}>{r.operatingCondition}</td>
                      <td className="px-3 py-2.5 text-center">
                        <RiskBadge score={r.riskScore} level={r.riskLevel} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <RiskBadge score={r.residualRiskScore} level={r.residualRiskLevel} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.responsiblePerson || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(r)} data-testid={`btn-edit-hazard-${r.id}`}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)} data-testid={`btn-delete-hazard-${r.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`exp-${r.id}`} className="bg-muted/20 border-b">
                        <td colSpan={11} className="px-5 py-5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Potential Consequence</p>
                              <p className="text-sm text-foreground leading-relaxed">{r.consequenceDescription || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Existing Controls</p>
                              <p className="text-sm text-foreground leading-relaxed">{r.existingControls || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Who is Affected</p>
                              <p className="text-sm text-foreground capitalize">{(r.whoAffected || []).join(", ") || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Control Hierarchy Applied</p>
                              <div className="flex flex-wrap gap-1.5">
                                {(r.controlHierarchy || []).map(c => (
                                  <span key={c} className="bg-accent/10 text-accent border border-accent/20 rounded px-2 py-0.5 text-sm capitalize">{c}</span>
                                ))}
                                {!(r.controlHierarchy?.length) && <span className="text-sm text-muted-foreground">—</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Planned / Additional Controls</p>
                              <p className="text-sm text-foreground leading-relaxed">{r.plannedControls || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Action Required</p>
                              <p className="text-sm text-foreground leading-relaxed">{r.actionRequired || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Legal / Regulatory Requirement</p>
                              <p className="text-sm text-foreground leading-relaxed">{r.legalRequirement || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">ISO 45001 Clause</p>
                              <p className="text-sm text-foreground">{r.iso45001Clause || "6.1.2"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Target Date</p>
                              <p className="text-sm text-foreground">{r.targetDate || "—"}</p>
                            </div>
                            {r.notes && (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Notes</p>
                                <p className="text-sm text-foreground leading-relaxed">{r.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* No results after filter */}
      {!isLoading && records.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="w-6 h-6 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No records match your filters.</p>
          <Button variant="link" size="sm" onClick={() => { setFilterArea(""); setFilterLevel("all"); setFilterStatus("all"); }}>
            Clear filters
          </Button>
        </div>
      )}

      {/* Add / Edit Dialog */}
      {dialogOpen && (
        <HazardDialog
          record={editing}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSave={(data) => saveMutation.mutate({ id: editing?.id, data })}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    "in-progress": "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
    closed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  };
  const labels: Record<string, string> = { open: "Open", "in-progress": "In Progress", closed: "Closed" };
  return (
    <span className={`border rounded px-2 py-0.5 text-xs font-semibold ${map[status] || map["open"]}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Add / Edit Dialog ────────────────────────────────────────────────────────
interface DialogProps {
  record: HazardRecord | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
}

function HazardDialog({ record, onClose, onSave, isSaving }: DialogProps) {
  const r = record;

  const [workArea, setWorkArea] = useState(r?.workArea ?? "");
  const [activityTask, setActivityTask] = useState(r?.activityTask ?? "");
  const [hazardDescription, setHazardDescription] = useState(r?.hazardDescription ?? "");
  const [hazardType, setHazardType] = useState(r?.hazardType ?? "physical");
  const [operatingCondition, setOperatingCondition] = useState(r?.operatingCondition ?? "routine");
  const [whoAffected, setWhoAffected] = useState<string[]>(r?.whoAffected ?? []);
  const [consequenceDescription, setConsequenceDescription] = useState(r?.consequenceDescription ?? "");
  const [existingControls, setExistingControls] = useState(r?.existingControls ?? "");
  const [probability, setProbability] = useState(r?.probability ?? 3);
  const [gravity, setGravity] = useState(r?.gravity ?? 3);
  const [magnitude, setMagnitude] = useState(r?.magnitude ?? 3);
  const [controlHierarchy, setControlHierarchy] = useState<string[]>(r?.controlHierarchy ?? []);
  const [plannedControls, setPlannedControls] = useState(r?.plannedControls ?? "");
  const [residualProbability, setResidualProbability] = useState(r?.residualProbability ?? 1);
  const [residualGravity, setResidualGravity] = useState(r?.residualGravity ?? 1);
  const [residualMagnitude, setResidualMagnitude] = useState(r?.residualMagnitude ?? 1);
  const [actionRequired, setActionRequired] = useState(r?.actionRequired ?? "");
  const [responsiblePerson, setResponsiblePerson] = useState(r?.responsiblePerson ?? "");
  const [targetDate, setTargetDate] = useState(r?.targetDate ?? "");
  const [status, setStatus] = useState(r?.status ?? "open");
  const [legalRequirement, setLegalRequirement] = useState(r?.legalRequirement ?? "");
  const [iso45001Clause, setIso45001Clause] = useState(r?.iso45001Clause ?? "6.1.2");
  const [notes, setNotes] = useState(r?.notes ?? "");

  const inherentScore = calcScore(probability, gravity, magnitude);
  const inherentLevel = scoreToLevel(inherentScore);
  const residualScore = calcScore(residualProbability, residualGravity, residualMagnitude);
  const residualLevel = scoreToLevel(residualScore);

  function toggleWho(val: string) {
    setWhoAffected(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }
  function toggleControl(val: string) {
    setControlHierarchy(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }

  function handleSave() {
    if (!activityTask.trim() || !hazardDescription.trim()) return;
    onSave({
      workArea: workArea || null,
      activityTask,
      hazardDescription,
      hazardType,
      operatingCondition,
      whoAffected,
      consequenceDescription: consequenceDescription || null,
      existingControls: existingControls || null,
      probability,
      gravity,
      magnitude,
      controlHierarchy,
      plannedControls: plannedControls || null,
      residualProbability,
      residualGravity,
      residualMagnitude,
      actionRequired: actionRequired || null,
      responsiblePerson: responsiblePerson || null,
      targetDate: targetDate || null,
      status,
      legalRequirement: legalRequirement || null,
      iso45001Clause: iso45001Clause || "6.1.2",
      notes: notes || null,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-orange-500" />
            {record ? "Edit Hazard Record" : "Add Hazard Record"}
            <Badge variant="outline" className="text-[10px] font-mono ml-1">ISO 45001 §6.1.2</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-1">
          {/* ── Scoring Reference Guide (collapsible) ── */}
          <ScoringGuidePanel />

          {/* ── Section 1: Hazard Identification ── */}
          <SectionHeading icon={<ClipboardList className="w-4 h-4" />} title="Hazard Identification" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Work Area / Department</Label>
              <Input value={workArea} onChange={e => setWorkArea(e.target.value)} placeholder="e.g. Assembly, Warehouse, Office" data-testid="input-work-area" />
            </div>
            <div className="space-y-1.5">
              <Label>Activity / Task <span className="text-destructive">*</span></Label>
              <Input value={activityTask} onChange={e => setActivityTask(e.target.value)} placeholder="e.g. Forklift operation, Chemical handling" data-testid="input-activity-task" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Hazard Description <span className="text-destructive">*</span></Label>
              <Input value={hazardDescription} onChange={e => setHazardDescription(e.target.value)} placeholder="Describe the hazard source or situation" data-testid="input-hazard-description" />
            </div>
            <div className="space-y-1.5">
              <Label>Hazard Type</Label>
              <Select value={hazardType} onValueChange={setHazardType}>
                <SelectTrigger data-testid="select-hazard-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HAZARD_TYPES.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Operating Condition</Label>
              <Select value={operatingCondition} onValueChange={setOperatingCondition}>
                <SelectTrigger data-testid="select-operating-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="non-routine">Non-Routine</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Who is Affected?</Label>
              <div className="flex flex-wrap gap-3">
                {WHO_AFFECTED_OPTIONS.map(w => (
                  <label key={w.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox checked={whoAffected.includes(w.value)} onCheckedChange={() => toggleWho(w.value)} data-testid={`check-who-${w.value}`} />
                    {w.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Potential Consequence</Label>
              <Textarea value={consequenceDescription} onChange={e => setConsequenceDescription(e.target.value)} placeholder="Describe the potential injury or health effect" rows={2} data-testid="textarea-consequence" />
            </div>
            <div className="space-y-1.5">
              <Label>Existing Controls</Label>
              <Textarea value={existingControls} onChange={e => setExistingControls(e.target.value)} placeholder="Controls already in place before this assessment" rows={2} data-testid="textarea-existing-controls" />
            </div>
          </div>

          {/* ── Section 2: Inherent Risk Scoring (P × G × M) ── */}
          <SectionHeading icon={<AlertTriangle className="w-4 h-4 text-orange-500" />} title="Inherent Risk Rating — P × G × M (Before Additional Controls)" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>P — Probability of Occurrence</Label>
              <Select value={String(probability)} onValueChange={v => setProbability(Number(v))}>
                <SelectTrigger data-testid="select-probability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROBABILITY_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      <span className="font-semibold">{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {PROBABILITY_OPTS.find(o => o.value === probability)?.desc}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>G — Gravity of Harm</Label>
              <Select value={String(gravity)} onValueChange={v => setGravity(Number(v))}>
                <SelectTrigger data-testid="select-gravity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRAVITY_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      <span className="font-semibold">{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {GRAVITY_OPTS.find(o => o.value === gravity)?.desc}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>M — Magnitude of Prevention</Label>
              <Select value={String(magnitude)} onValueChange={v => setMagnitude(Number(v))}>
                <SelectTrigger data-testid="select-magnitude">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAGNITUDE_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      <span className="font-semibold">{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {MAGNITUDE_OPTS.find(o => o.value === magnitude)?.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Inherent Risk Score (P×G×M = {probability}×{gravity}×{magnitude}):</span>
            <RiskBadge score={inherentScore} level={inherentLevel} />
          </div>

          {/* ── Section 3: Hierarchy of Controls ── */}
          <SectionHeading icon={<ShieldCheck className="w-4 h-4 text-accent" />} title="Hierarchy of Controls (ISO 45001 §8.1.2)" />
          <div className="space-y-2">
            {CONTROL_HIERARCHY_OPTIONS.map((c, idx) => (
              <label key={c.value} className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                <Checkbox checked={controlHierarchy.includes(c.value)} onCheckedChange={() => toggleControl(c.value)} data-testid={`check-control-${c.value}`} className="mt-0.5" />
                <div>
                  <span className="text-sm font-semibold">{idx + 1}. {c.label}</span>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>Planned / Additional Controls</Label>
            <Textarea value={plannedControls} onChange={e => setPlannedControls(e.target.value)} placeholder="Describe the specific controls to be implemented" rows={2} data-testid="textarea-planned-controls" />
          </div>

          {/* ── Section 4: Residual Risk (P × G × M after controls) ── */}
          <SectionHeading icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} title="Residual Risk Rating — P × G × M (After Controls)" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Residual P — Probability</Label>
              <Select value={String(residualProbability)} onValueChange={v => setResidualProbability(Number(v))}>
                <SelectTrigger data-testid="select-residual-probability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROBABILITY_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      <span className="font-semibold">{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {PROBABILITY_OPTS.find(o => o.value === residualProbability)?.desc}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Residual G — Gravity</Label>
              <Select value={String(residualGravity)} onValueChange={v => setResidualGravity(Number(v))}>
                <SelectTrigger data-testid="select-residual-gravity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRAVITY_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      <span className="font-semibold">{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {GRAVITY_OPTS.find(o => o.value === residualGravity)?.desc}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Residual M — Prevention</Label>
              <Select value={String(residualMagnitude)} onValueChange={v => setResidualMagnitude(Number(v))}>
                <SelectTrigger data-testid="select-residual-magnitude">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAGNITUDE_OPTS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      <span className="font-semibold">{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {MAGNITUDE_OPTS.find(o => o.value === residualMagnitude)?.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Residual Risk Score (P×G×M = {residualProbability}×{residualGravity}×{residualMagnitude}):</span>
            <RiskBadge score={residualScore} level={residualLevel} />
          </div>

          {/* ── Section 5: Action & Tracking ── */}
          <SectionHeading icon={<Users className="w-4 h-4" />} title="Action &amp; Tracking" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Action Required</Label>
              <Textarea value={actionRequired} onChange={e => setActionRequired(e.target.value)} placeholder="Corrective or preventive action to be taken" rows={2} data-testid="textarea-action-required" />
            </div>
            <div className="space-y-1.5">
              <Label>Responsible Person</Label>
              <Input value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} placeholder="Name or role" data-testid="input-responsible-person" />
            </div>
            <div className="space-y-1.5">
              <Label>Target Date</Label>
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} data-testid="input-target-date" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ISO 45001 Clause Reference</Label>
              <Select value={iso45001Clause ?? "6.1.2"} onValueChange={setIso45001Clause}>
                <SelectTrigger data-testid="select-clause">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAUSES.map(c => (
                    <SelectItem key={c} value={c.split(" – ")[0]}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Legal / Regulatory Requirement</Label>
              <Input value={legalRequirement} onChange={e => setLegalRequirement(e.target.value)} placeholder="e.g. OSHA 29 CFR 1910.147, MIOSHA" data-testid="input-legal-requirement" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes or context" rows={2} data-testid="textarea-notes" />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving} data-testid="btn-cancel-hazard">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !activityTask.trim() || !hazardDescription.trim()} data-testid="btn-save-hazard">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {record ? "Save Changes" : "Add Hazard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Section heading helper ───────────────────────────────────────────────────
function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="p-1 bg-muted rounded">{icon}</div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─── P × G × M Scoring Reference Guide panel (collapsible) ───────────────────
function ScoringGuidePanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"P" | "G" | "M" | "zones">("G");

  const zoneColors: Record<string, string> = {
    low: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    medium: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    high: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    critical: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };
  const zoneText: Record<string, string> = {
    low: "text-green-700 dark:text-green-400",
    medium: "text-yellow-700 dark:text-yellow-400",
    high: "text-orange-700 dark:text-orange-400",
    critical: "text-red-700 dark:text-red-400",
  };

  return (
    <div className="border rounded-lg overflow-hidden" data-testid="scoring-guide-panel">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
        data-testid="btn-toggle-scoring-guide"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">P × G × M Scoring Reference Guide</span>
          <span className="hidden sm:inline text-xs text-blue-500/80 dark:text-blue-400/60 font-normal">ISO 45001 §6.1.2 · AIAG · OSHA Regulatory Context</span>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-blue-500 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-muted/10 border-t">
          {/* Tab row */}
          <div className="flex gap-1 flex-wrap">
            {(["P", "G", "M", "zones"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                  tab === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
                data-testid={`tab-guide-${t}`}
              >
                {t === "P" ? "P — Probability" : t === "G" ? "G — Gravity of Harm" : t === "M" ? "M — Magnitude of Prevention" : "Risk Zones"}
              </button>
            ))}
          </div>

          {/* ── P Table ── */}
          {tab === "P" && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground italic">
                Probability of occurrence — likelihood the hazardous event will happen based on historical data and exposure frequency.
              </p>
              {SCORING_CRITERIA.probability.map(row => (
                <div key={row.value} className={`rounded-lg border p-3 space-y-2 ${row.value === 1 ? "border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10" : row.value === 3 ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/40 dark:bg-yellow-900/10" : row.value === 7 ? "border-orange-200 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-900/10" : "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-base font-black ${row.value === 1 ? "text-green-700 dark:text-green-400" : row.value === 3 ? "text-yellow-700 dark:text-yellow-400" : row.value === 7 ? "text-orange-700 dark:text-orange-400" : "text-red-700 dark:text-red-400"}`}>
                      P = {row.value}
                    </span>
                    <span className="text-sm font-bold text-foreground">— {row.rating}</span>
                    <span className="text-[10px] bg-muted border rounded px-2 py-0.5 text-muted-foreground font-mono">{row.frequency}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{row.criteria}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Examples</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.examples}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">OSHA / Regulatory Context</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.oshaRef}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── G Table ── */}
          {tab === "G" && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground italic">
                Gravity of harm — severity of the injury or damage if the hazardous event occurs, including OSHA recordability and regulatory penalty exposure.
              </p>
              {SCORING_CRITERIA.gravity.map(row => (
                <div key={row.value} className={`rounded-lg border p-3 space-y-2 ${row.value === 1 ? "border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10" : row.value === 3 ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/40 dark:bg-yellow-900/10" : row.value === 7 ? "border-orange-200 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-900/10" : "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-base font-black ${row.value === 1 ? "text-green-700 dark:text-green-400" : row.value === 3 ? "text-yellow-700 dark:text-yellow-400" : row.value === 7 ? "text-orange-700 dark:text-orange-400" : "text-red-700 dark:text-red-400"}`}>
                      G = {row.value}
                    </span>
                    <span className="text-sm font-bold text-foreground">— {row.rating}</span>
                    <span className={`text-[10px] border rounded px-2 py-0.5 font-semibold ${row.value === 1 ? "bg-green-100 text-green-700 border-green-300" : row.value === 3 ? "bg-yellow-100 text-yellow-700 border-yellow-300" : row.value === 7 ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-red-100 text-red-700 border-red-300"}`}>
                      {row.oshaRecordable}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{row.injuryType}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Injury Examples</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.examples}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Regulatory Exposure</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.regulatory}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">OSHA Penalty Range</span>
                      <p className={`text-[11px] font-bold mt-0.5 ${row.value === 1 ? "text-green-600 dark:text-green-400" : row.value === 3 ? "text-yellow-600 dark:text-yellow-400" : row.value === 7 ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`}>{row.penalty}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── M Table ── */}
          {tab === "M" && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground italic">
                Magnitude of prevention — effectiveness of existing controls per ISO 45001 §8.1.2 hierarchy. Lower scores mean better control; higher scores mean greater residual risk.
              </p>
              {SCORING_CRITERIA.magnitude.map(row => (
                <div key={row.value} className={`rounded-lg border p-3 space-y-2 ${row.value === 1 ? "border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10" : row.value === 2 ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50/40 dark:bg-yellow-900/10" : row.value === 3 ? "border-orange-200 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-900/10" : "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/10"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-base font-black ${row.value === 1 ? "text-green-700 dark:text-green-400" : row.value === 2 ? "text-yellow-700 dark:text-yellow-400" : row.value === 3 ? "text-orange-700 dark:text-orange-400" : "text-red-700 dark:text-red-400"}`}>
                      M = {row.value}
                    </span>
                    <span className="text-sm font-bold text-foreground">— {row.rating}</span>
                  </div>
                  <span className="inline-block text-[10px] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded px-2 py-0.5 font-medium">{row.controlTier}</span>
                  <p className="text-xs text-foreground leading-relaxed">{row.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Control Examples</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.examples}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Compliance Indicators</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.compliance}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">OSHA / Citation Risk</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.oshaRef}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Risk Zones ── */}
          {tab === "zones" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground italic">
                Risk score = P × G × M (max 400). Use these zones to prioritize corrective actions and assign ownership.
              </p>
              {[
                {
                  zone: "low", score: "1–30", label: "Low Risk",
                  action: "Acceptable risk. Maintain existing controls. Review annually or when conditions change.",
                  priority: "Routine monitoring. Document current controls. No immediate action required.",
                  oshaNote: "Generally compliant. Verify controls remain in place during periodic audits.",
                },
                {
                  zone: "medium", score: "31–100", label: "Medium Risk",
                  action: "Tolerable risk but improvement needed. Implement additional controls within 90 days. Assign responsible person.",
                  priority: "Schedule improvement actions. Consider engineering upgrade if feasible. Increase inspection frequency.",
                  oshaNote: "OSHA Other-Than-Serious citation range. Address documentation and training gaps proactively.",
                },
                {
                  zone: "high", score: "101–280", label: "High Risk",
                  action: "Significant risk requiring prompt action. Implement interim controls immediately. Complete corrective action within 30 days.",
                  priority: "Senior management notification required. Interim containment required before task continues. CAPA initiated.",
                  oshaNote: "OSHA Serious citation range ($1,036–$15,625/violation). High probability of inspection trigger. Days Away From Work likely if event occurs.",
                },
                {
                  zone: "critical", score: "281–400", label: "Critical Risk",
                  action: "Intolerable risk. STOP work or restrict task until immediate controls are implemented. Escalate to plant/site management.",
                  priority: "Immediate stop-work authority invoked if imminent danger. Emergency CAPA required. Executive review within 24 hours.",
                  oshaNote: "OSHA Willful/Repeat citation range ($10,360–$156,259/violation). Potential criminal referral. Imminent danger stop-work authority applies (OSH Act §13).",
                },
              ].map(z => (
                <div key={z.zone} className={`rounded-lg border p-3 space-y-2 ${zoneColors[z.zone]}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-sm font-black ${zoneText[z.zone]}`}>{z.label}</span>
                    <span className={`text-xs font-mono font-bold border rounded px-2 py-0.5 ${zoneText[z.zone]}`}>Score {z.score}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Required Action</span>
                      <p className="text-[11px] text-foreground mt-0.5 leading-relaxed">{z.action}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Priority / Escalation</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{z.priority}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">OSHA Regulatory Note</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{z.oshaNote}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground border rounded p-2 bg-muted/30 flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5 text-blue-500" />
                <span>OSHA penalty figures reflect 2024 adjusted civil penalty maximums per 29 CFR Part 1903. Actual penalties may vary based on size, good faith, history, and gravity. Consult your legal/compliance team for jurisdiction-specific guidance.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
