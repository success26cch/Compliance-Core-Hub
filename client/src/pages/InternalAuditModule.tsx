import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ClipboardCheck, AlertTriangle, Trash2, ChevronRight, ChevronDown,
  Calendar, User, BookOpen, Shield, Activity, AlertCircle,
  BarChart3, Info, CheckCircle2, Clock, HardHat, FileText,
  Users, ListChecks, Target, Search, Lightbulb, Edit3,
  Package, Factory, Bell, CheckSquare,
} from "lucide-react";
import type { IsoAudit, IsoAuditFinding, IsoAuditProcessNote, AuditProcessSchedule, IatfProductAudit, IatfMfgProcessAudit, ProductAuditChecklistItem, MfgProcessAuditChecklistItem, IatfAuditSchedule } from "@shared/schema";
import type { ProcessEntry } from "./ProcessMapModule";

// ── Standards & Clauses ────────────────────────────────────────────────────────

const ISO_STANDARDS = [
  "ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018",
  "ISO 13485:2016", "IATF 16949:2016", "AS9100 Rev D",
];

const CLAUSES_BY_STANDARD: Record<string, Array<{ clause: string; title: string }>> = {
  "ISO 9001:2015": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the QMS" },
    { clause: "4.4", title: "QMS and its processes" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Quality policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.2", title: "Quality objectives and planning to achieve them" },
    { clause: "6.3", title: "Planning of changes" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Requirements for products and services" },
    { clause: "8.3", title: "Design and development" },
    { clause: "8.4", title: "Control of externally provided processes, products and services" },
    { clause: "8.5", title: "Production and service provision" },
    { clause: "8.6", title: "Release of products and services" },
    { clause: "8.7", title: "Control of nonconforming outputs" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "ISO 14001:2015": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Interested parties" },
    { clause: "4.3", title: "Scope of the EMS" },
    { clause: "4.4", title: "Environmental management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Environmental policy" },
    { clause: "5.3", title: "Roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Environmental aspects" },
    { clause: "6.1.3", title: "Compliance obligations" },
    { clause: "6.2", title: "Environmental objectives and planning" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Emergency preparedness and response" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "ISO 45001:2018": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Needs and expectations of workers and interested parties" },
    { clause: "4.3", title: "Scope of the OH&SMS" },
    { clause: "4.4", title: "OH&S management system" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "OH&S policy" },
    { clause: "5.3", title: "Roles, responsibilities and authorities" },
    { clause: "5.4", title: "Consultation and participation of workers" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.1.2", title: "Hazard identification; assessment of risks and opportunities" },
    { clause: "6.1.3", title: "Legal requirements and other requirements" },
    { clause: "6.2", title: "OH&S objectives and planning" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.1.2", title: "Eliminating hazards and reducing OH&S risks" },
    { clause: "8.2", title: "Emergency preparedness and response" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "ISO 13485:2016": [
    { clause: "4.1", title: "General requirements" },
    { clause: "4.2", title: "Documentation requirements" },
    { clause: "5.1", title: "Management commitment" },
    { clause: "5.2", title: "Customer focus" },
    { clause: "5.3", title: "Quality policy" },
    { clause: "5.4", title: "Planning" },
    { clause: "5.5", title: "Responsibility, authority and communication" },
    { clause: "5.6", title: "Management review" },
    { clause: "6.1", title: "Provision of resources" },
    { clause: "6.2", title: "Human resources" },
    { clause: "6.3", title: "Infrastructure" },
    { clause: "6.4", title: "Work environment and contamination control" },
    { clause: "7.1", title: "Planning of product realization" },
    { clause: "7.2", title: "Customer-related processes" },
    { clause: "7.3", title: "Design and development" },
    { clause: "7.4", title: "Purchasing" },
    { clause: "7.5", title: "Production and service provision" },
    { clause: "7.6", title: "Control of monitoring and measuring equipment" },
    { clause: "8.1", title: "Measurement, analysis and improvement" },
    { clause: "8.2", title: "Monitoring and measurement" },
    { clause: "8.3", title: "Control of nonconforming product" },
    { clause: "8.4", title: "Analysis of data" },
    { clause: "8.5", title: "Improvement" },
  ],
  "IATF 16949:2016": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the QMS" },
    { clause: "4.4", title: "QMS and its processes" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.2", title: "Quality objectives and planning" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Requirements for products and services" },
    { clause: "8.3", title: "Design and development" },
    { clause: "8.4", title: "Control of externally provided processes, products and services" },
    { clause: "8.5", title: "Production and service provision" },
    { clause: "8.6", title: "Release of products and services" },
    { clause: "8.7", title: "Control of nonconforming outputs" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
  "AS9100 Rev D": [
    { clause: "4.1", title: "Understanding the organization and its context" },
    { clause: "4.2", title: "Understanding the needs and expectations of interested parties" },
    { clause: "4.3", title: "Determining the scope of the QMS" },
    { clause: "4.4", title: "QMS and its processes" },
    { clause: "5.1", title: "Leadership and commitment" },
    { clause: "5.2", title: "Policy" },
    { clause: "5.3", title: "Organizational roles, responsibilities and authorities" },
    { clause: "6.1", title: "Actions to address risks and opportunities" },
    { clause: "6.2", title: "Quality objectives and planning" },
    { clause: "6.3", title: "Planning of changes" },
    { clause: "7.1", title: "Resources" },
    { clause: "7.2", title: "Competence" },
    { clause: "7.3", title: "Awareness" },
    { clause: "7.4", title: "Communication" },
    { clause: "7.5", title: "Documented information" },
    { clause: "8.1", title: "Operational planning and control" },
    { clause: "8.2", title: "Requirements for products and services" },
    { clause: "8.3", title: "Design and development" },
    { clause: "8.4", title: "Control of externally provided processes, products and services" },
    { clause: "8.5", title: "Production and service provision" },
    { clause: "8.6", title: "Release of products and services" },
    { clause: "8.7", title: "Control of nonconforming outputs" },
    { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation" },
    { clause: "9.2", title: "Internal audit" },
    { clause: "9.3", title: "Management review" },
    { clause: "10.2", title: "Nonconformity and corrective action" },
    { clause: "10.3", title: "Continual improvement" },
  ],
};

function getClausesForStandard(standard: string) {
  return CLAUSES_BY_STANDARD[standard] || CLAUSES_BY_STANDARD["ISO 9001:2015"];
}

// ── Finding Types ──────────────────────────────────────────────────────────────

const FINDING_TYPES = [
  { value: "conform",         label: "Conform",           color: "bg-green-100 text-green-800 border-green-300" },
  { value: "nonconformance",  label: "Nonconformance",    color: "bg-red-100 text-red-800 border-red-300" },
  { value: "observation",     label: "OFI",               color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "not_audited",     label: "Not Audited",       color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const STATUS_COLORS: Record<string, string> = {
  planned:     "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  complete:    "bg-green-100 text-green-800 border-green-300",
};

// ── Risk Score Helpers ─────────────────────────────────────────────────────────

type FreqKey = "triennial" | "biennial" | "urgent";
type RiskKey = "riskComplexity" | "riskCustomerImpact" | "riskPreviousAudit" | "riskPerformance" | "riskChangeFreq" | "riskComplaints";

const FREQ_CONFIG: Record<FreqKey, {
  label: string; sublabel: string; scoreRange: string; rangeColor: string;
  statusColor: string; status: string; barColor: string; badgeColor: string;
}> = {
  triennial: {
    label: "Every 3 Years", sublabel: "Low risk — 3-year audit cycle",
    scoreRange: "6–25", status: "IN CONTROL",
    rangeColor: "bg-green-50 border-green-200", statusColor: "text-green-700",
    barColor: "bg-green-500", badgeColor: "bg-green-100 text-green-800 border-green-300",
  },
  biennial: {
    label: "Every 12–24 Months", sublabel: "Moderate risk — annual or biennial audit",
    scoreRange: "26–50", status: "NEEDS ATTENTION",
    rangeColor: "bg-amber-50 border-amber-200", statusColor: "text-amber-700",
    barColor: "bg-amber-500", badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  urgent: {
    label: "Every 6–9 Months", sublabel: "High risk — frequent auditing required",
    scoreRange: "51–60", status: "NEEDS IMMEDIATE",
    rangeColor: "bg-red-50 border-red-200", statusColor: "text-red-700",
    barColor: "bg-red-500", badgeColor: "bg-red-100 text-red-800 border-red-300",
  },
};

const BANDS = [
  { label: "LOW",      range: "1–3",  score: 2,  dot: "bg-green-500",  color: { active: "bg-green-100 border-green-400 text-green-900", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-green-50" } },
  { label: "MEDIUM",   range: "4–6",  score: 5,  dot: "bg-amber-500",  color: { active: "bg-amber-100 border-amber-400 text-amber-900", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-amber-50" } },
  { label: "HIGH",     range: "7–9",  score: 8,  dot: "bg-orange-500", color: { active: "bg-orange-100 border-orange-400 text-orange-900", inactive: "bg-white border-gray-200 text-gray-600 hover:bg-orange-50" } },
  { label: "CRITICAL", range: "10",   score: 10, dot: "bg-red-600",    color: { active: "bg-red-100 border-red-500 text-red-900",    inactive: "bg-white border-gray-200 text-gray-600 hover:bg-red-50" } },
];

const RISK_CRITERIA: { key: RiskKey; label: string; subtitle: string; bandDescs: string[] }[] = [
  { key: "riskComplexity",      label: "Process Failure Risk",          subtitle: "Complexity & impact of failure", bandDescs: ["Simple, low impact", "Moderate complexity", "Complex, high impact", "Critical failure risk"] },
  { key: "riskCustomerImpact",  label: "Customer & Delivery Impact",    subtitle: "Effect on customer satisfaction/delivery", bandDescs: ["No direct impact", "Minor impact", "Significant impact", "Direct customer safety/delivery"] },
  { key: "riskPreviousAudit",   label: "Previous Audit Findings",       subtitle: "History of NCs and observations", bandDescs: ["No findings", "Minor obs only", "Major NC observed", "Repeat or systemic NCs"] },
  { key: "riskPerformance",     label: "Process Performance & KPIs",    subtitle: "KPI trends and process metrics", bandDescs: ["All targets met", "Minor misses", "Consistent underperformance", "Critical KPI failure"] },
  { key: "riskChangeFreq",      label: "Process Change & Stability",    subtitle: "Frequency of changes, turnover", bandDescs: ["Stable, no changes", "Occasional minor changes", "Frequent changes", "High turnover / constant change"] },
  { key: "riskComplaints",      label: "Customer Complaints & Feedback", subtitle: "Complaint volume and severity", bandDescs: ["Zero complaints", "Isolated minor complaints", "Recurring complaints", "Escalated or safety complaints"] },
];

function calcTotalScore(scores: Record<RiskKey, number>): number {
  return Object.values(scores).reduce((s, v) => s + v, 0);
}

function scoreToFreq(total: number): FreqKey {
  if (total <= 25) return "triennial";
  if (total <= 50) return "biennial";
  return "urgent";
}

function getBandForScore(score: number) {
  return BANDS.find(b => score <= (b.label === "LOW" ? 3 : b.label === "MEDIUM" ? 6 : b.label === "HIGH" ? 9 : 10)) || BANDS[3];
}

function calcNextDate(lastDate: string | null, freqKey: FreqKey): string {
  if (!lastDate) return "";
  const d = new Date(lastDate);
  if (freqKey === "triennial") d.setFullYear(d.getFullYear() + 3);
  else if (freqKey === "biennial") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 7);
  return d.toISOString().slice(0, 10);
}

function getScheduleStatus(entry: AuditProcessSchedule): "overdue" | "due_soon" | "on_track" | "not_assessed" {
  if (!entry.nextAuditDate) return "not_assessed";
  const diffDays = Math.ceil((new Date(entry.nextAuditDate).getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 45) return "due_soon";
  return "on_track";
}

function normalizeProcessType(row: string): "COP" | "SOP" | "MOP" {
  const r = (row || "").toUpperCase();
  if (r === "COP" || r === "CORE") return "COP";
  if (r === "MOP" || r === "MANAGEMENT") return "MOP";
  return "SOP";
}

// ── Objective Met Badge ────────────────────────────────────────────────────────

function ObjectiveMetBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground/50 italic text-xs">Not recorded</span>;
  const cfg = {
    yes:     { label: "Objective Met",         cls: "bg-green-100 text-green-800 border-green-300" },
    partial: { label: "Partially Met",         cls: "bg-amber-100 text-amber-800 border-amber-300" },
    no:      { label: "Objective Not Met",     cls: "bg-red-100 text-red-800 border-red-300" },
  }[value] || { label: value, cls: "bg-gray-100 text-gray-700 border-gray-200" };
  return <Badge className={`text-xs border ${cfg.cls}`}>{cfg.label}</Badge>;
}

// ── IATF 9.2.2.3 Default Product Audit Checklist ────────────────────────────
const DEFAULT_PRODUCT_CHECKLIST: Omit<ProductAuditChecklistItem, "result" | "note">[] = [
  { id: "pi1", category: "Product Identification & Traceability", item: "Part number matches job traveler / production order" },
  { id: "pi2", category: "Product Identification & Traceability", item: "Lot / batch number correctly identified and traceable" },
  { id: "pi3", category: "Product Identification & Traceability", item: "Revision level matches current approved drawing or specification" },
  { id: "pi4", category: "Product Identification & Traceability", item: "Quantity sampled per sampling plan requirements" },
  { id: "dc1", category: "Dimensional / Physical Characteristics", item: "Critical characteristics (CTQ) within drawing tolerance" },
  { id: "dc2", category: "Dimensional / Physical Characteristics", item: "Non-critical dimensions within tolerance (spot check)" },
  { id: "dc3", category: "Dimensional / Physical Characteristics", item: "Physical form, fit, and function as specified" },
  { id: "vc1", category: "Visual / Cosmetic", item: "No cracks, chips, scratches, contamination, or foreign material" },
  { id: "vc2", category: "Visual / Cosmetic", item: "Color / appearance matches approved standard or limit sample" },
  { id: "fp1", category: "Functional / Performance", item: "Functional test / performance check completed per approved test method" },
  { id: "fp2", category: "Functional / Performance", item: "All test results meet specification limits" },
  { id: "lm1", category: "Labeling & Marking", item: "Label information correct: P/N, Rev, Lot, Qty, Date, and applicable hazard information" },
  { id: "lm2", category: "Labeling & Marking", item: "Label legibility and placement per specification" },
  { id: "pk1", category: "Packaging & Preservation", item: "Packaging type and condition meets customer / internal specification" },
  { id: "pk2", category: "Packaging & Preservation", item: "Quantity per container is correct" },
  { id: "pk3", category: "Packaging & Preservation", item: "Special preservation requirements met (desiccant, ESD, etc.) if applicable" },
  { id: "dr1", category: "Documentation & Records", item: "Certificate of Analysis / test record on file and matches product" },
  { id: "dr2", category: "Documentation & Records", item: "All required records completed and legible" },
  { id: "dr3", category: "Documentation & Records", item: "Customer-specific requirements checklist verified" },
];

function makeDefaultProductChecklist(): ProductAuditChecklistItem[] {
  return DEFAULT_PRODUCT_CHECKLIST.map(i => ({ ...i, result: "na" as const, note: "" }));
}

// ── IATF 9.2.2.4 Default Manufacturing Process Audit Checklist ───────────────
const DEFAULT_PROCESS_CHECKLIST: Omit<MfgProcessAuditChecklistItem, "result" | "note">[] = [
  { id: "sa1", category: "Setup & Job Authorization", question: "Production order / work order released and current at workstation" },
  { id: "sa2", category: "Setup & Job Authorization", question: "Setup sheet posted at workstation and current revision" },
  { id: "sa3", category: "Setup & Job Authorization", question: "First-off inspection / setup approval completed before run" },
  { id: "sa4", category: "Setup & Job Authorization", question: "Setup performed by qualified / authorized personnel" },
  { id: "pp1", category: "Process Parameters & Controls", question: "Process parameters (speed, temp, pressure, etc.) set per control plan" },
  { id: "pp2", category: "Process Parameters & Controls", question: "In-process controls being performed at required frequency" },
  { id: "pp3", category: "Process Parameters & Controls", question: "Reaction plan posted and understood by operator" },
  { id: "cp1", category: "Control Plan Conformance", question: "All control plan characteristics being monitored" },
  { id: "cp2", category: "Control Plan Conformance", question: "Monitoring method and frequency matches control plan" },
  { id: "cp3", category: "Control Plan Conformance", question: "Control plan revision matches current PFMEA revision" },
  { id: "oq1", category: "Operator Qualification & Awareness", question: "Operator trained and qualified for this operation (training records current)" },
  { id: "oq2", category: "Operator Qualification & Awareness", question: "Operator can identify the critical quality characteristics for this process" },
  { id: "oq3", category: "Operator Qualification & Awareness", question: "Operator knows escape criteria (when to stop and notify supervisor)" },
  { id: "wi1", category: "Work Instructions & Documentation", question: "Approved work instruction / SOP is available at workstation" },
  { id: "wi2", category: "Work Instructions & Documentation", question: "Work instruction revision matches Document Control master" },
  { id: "wi3", category: "Work Instructions & Documentation", question: "Records being completed accurately and legibly in real time" },
  { id: "mm1", category: "Monitoring & Measurement", question: "All gages / instruments calibrated and within due date" },
  { id: "mm2", category: "Monitoring & Measurement", question: "Calibration tags visible and legible on all gages used" },
  { id: "mm3", category: "Monitoring & Measurement", question: "MSA (Gage R&R or attribute study) completed for key measurements" },
  { id: "nc1", category: "Non-Conforming Product Control", question: "Quarantine / red bin zone clearly identified and labeled" },
  { id: "nc2", category: "Non-Conforming Product Control", question: "Any non-conforming material segregated and tagged with a hold tag" },
  { id: "nc3", category: "Non-Conforming Product Control", question: "No untagged suspect material present at workstation or WIP area" },
  { id: "et1", category: "Equipment & Tooling", question: "Preventive maintenance current on all production equipment in use" },
  { id: "et2", category: "Equipment & Tooling", question: "Equipment in normal operating condition (no active alerts or alarms)" },
  { id: "et3", category: "Equipment & Tooling", question: "Tooling change record current (if tooling was recently changed)" },
];

function makeDefaultProcessChecklist(): MfgProcessAuditChecklistItem[] {
  return DEFAULT_PROCESS_CHECKLIST.map(i => ({ ...i, result: "na" as const, note: "" }));
}

const PRODUCT_AUDIT_RESULT_CFG: Record<string, { label: string; cls: string }> = {
  pass:        { label: "PASS",        cls: "bg-green-100 text-green-800 border-green-300" },
  fail:        { label: "FAIL",        cls: "bg-red-100 text-red-800 border-red-300" },
  conditional: { label: "CONDITIONAL", cls: "bg-amber-100 text-amber-800 border-amber-300" },
};
const PROCESS_AUDIT_RESULT_CFG: Record<string, { label: string; cls: string }> = {
  conforming:    { label: "CONFORMING",    cls: "bg-green-100 text-green-800 border-green-300" },
  nonconforming: { label: "NONCONFORMING", cls: "bg-red-100 text-red-800 border-red-300" },
  conditional:   { label: "CONDITIONAL",   cls: "bg-amber-100 text-amber-800 border-amber-300" },
};

const PRODUCT_CHECKLIST_RESULT_OPTS: { value: ProductAuditChecklistItem["result"]; label: string; cls: string }[] = [
  { value: "pass", label: "Pass", cls: "bg-green-100 text-green-700 border-green-300" },
  { value: "fail", label: "Fail", cls: "bg-red-100 text-red-700 border-red-300" },
  { value: "na",   label: "N/A",  cls: "bg-gray-100 text-gray-600 border-gray-300" },
];
const PROCESS_CHECKLIST_RESULT_OPTS: { value: MfgProcessAuditChecklistItem["result"]; label: string; cls: string }[] = [
  { value: "yes",     label: "Yes",     cls: "bg-green-100 text-green-700 border-green-300" },
  { value: "no",      label: "No",      cls: "bg-red-100 text-red-700 border-red-300" },
  { value: "partial", label: "Partial", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "na",      label: "N/A",     cls: "bg-gray-100 text-gray-600 border-gray-300" },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export function InternalAuditModule({ onAskIsa }: { onAskIsa?: (prompt: string) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"audits" | "schedule" | "product-audit" | "process-audit">("audits");
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [showCreateAudit, setShowCreateAudit] = useState(false);
  const [findingDialog, setFindingDialog] = useState<{ open: boolean; clause: string; clauseTitle: string; existing?: IsoAuditFinding } | null>(null);
  const [processNotesDialog, setProcessNotesDialog] = useState<{ process: ProcessEntry; existing?: IsoAuditProcessNote } | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState<{ processName: string; processType: "COP" | "SOP" | "MOP"; existing?: AuditProcessSchedule } | null>(null);
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());
  const [summaryEdit, setSummaryEdit] = useState<string | null>(null);
  const [productAuditDialog, setProductAuditDialog] = useState<IatfProductAudit | null | "new">(null);
  const [processAuditDialog, setProcessAuditDialog] = useState<IatfMfgProcessAudit | null | "new">(null);
  const [iatfScheduleDialog, setIatfScheduleDialog] = useState<IatfAuditSchedule | null | { auditType: "product" | "process" }>(null);

  const { data: audits = [], isLoading } = useQuery<IsoAudit[]>({ queryKey: ["/api/iso-audits"] });
  const { data: project } = useQuery<any>({ queryKey: ["/api/iso-projects"] });
  const { data: scheduleEntries = [] } = useQuery<AuditProcessSchedule[]>({ queryKey: ["/api/audit-schedule"] });
  const { data: productAudits = [] } = useQuery<IatfProductAudit[]>({ queryKey: ["/api/iatf-product-audits"] });
  const { data: mfgProcessAudits = [] } = useQuery<IatfMfgProcessAudit[]>({ queryKey: ["/api/iatf-mfg-process-audits"] });
  const { data: iatfScheduleEntries = [] } = useQuery<IatfAuditSchedule[]>({ queryKey: ["/api/iatf-audit-schedule"] });

  const isIATF = project?.standard === "IATF 16949";

  const selectedAudit = audits.find(a => a.id === selectedAuditId);
  const processes: ProcessEntry[] = (project?.processes || []) as ProcessEntry[];

  const { data: findings = [] } = useQuery<IsoAuditFinding[]>({
    queryKey: ["/api/iso-audits", selectedAuditId, "findings"],
    queryFn: async () => {
      if (!selectedAuditId) return [];
      const res = await fetch(`/api/iso-audits/${selectedAuditId}/findings`);
      return res.json();
    },
    enabled: !!selectedAuditId,
  });

  const { data: processNotes = [] } = useQuery<IsoAuditProcessNote[]>({
    queryKey: ["/api/iso-audits", selectedAuditId, "process-notes"],
    queryFn: async () => {
      if (!selectedAuditId) return [];
      const res = await fetch(`/api/iso-audits/${selectedAuditId}/process-notes`);
      return res.json();
    },
    enabled: !!selectedAuditId,
  });

  const createAudit = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/iso-audits", data)).json(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] }); setShowCreateAudit(false); toast({ title: "Audit created" }); },
  });

  const updateAudit = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => (await apiRequest("PATCH", `/api/iso-audits/${id}`, data)).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] }),
  });

  const deleteAudit = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-audits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-audits"] }); setSelectedAuditId(null); toast({ title: "Audit deleted" }); },
  });

  const saveFinding = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return (await apiRequest("PATCH", `/api/iso-audit-findings/${data.id}`, data)).json();
      return (await apiRequest("POST", `/api/iso-audits/${selectedAuditId}/findings`, data)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "findings"] }); setFindingDialog(null); },
  });

  const deleteFinding = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-audit-findings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "findings"] }),
  });

  const saveProcessNote = useMutation({
    mutationFn: async (data: any) => (await apiRequest("PUT", `/api/iso-audits/${selectedAuditId}/process-notes`, data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "process-notes"] });
      setProcessNotesDialog(null);
      toast({ title: "Process notes saved" });
    },
  });

  const deleteProcessNote = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iso-audit-process-notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/iso-audits", selectedAuditId, "process-notes"] }),
  });

  const saveSchedule = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return (await apiRequest("PATCH", `/api/audit-schedule/${data.id}`, data)).json();
      return (await apiRequest("POST", "/api/audit-schedule", data)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/audit-schedule"] }); setScheduleDialog(null); toast({ title: "Schedule saved" }); },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/audit-schedule/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/audit-schedule"] }); setScheduleDialog(null); toast({ title: "Entry removed" }); },
  });

  const saveProductAudit = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return (await apiRequest("PATCH", `/api/iatf-product-audits/${data.id}`, data)).json();
      return (await apiRequest("POST", "/api/iatf-product-audits", data)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iatf-product-audits"] }); setProductAuditDialog(null); toast({ title: "Product audit saved" }); },
  });
  const deleteProductAudit = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iatf-product-audits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iatf-product-audits"] }); setProductAuditDialog(null); toast({ title: "Deleted" }); },
  });

  const saveMfgProcessAudit = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return (await apiRequest("PATCH", `/api/iatf-mfg-process-audits/${data.id}`, data)).json();
      return (await apiRequest("POST", "/api/iatf-mfg-process-audits", data)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iatf-mfg-process-audits"] }); setProcessAuditDialog(null); toast({ title: "Process audit saved" }); },
  });
  const deleteMfgProcessAudit = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iatf-mfg-process-audits/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iatf-mfg-process-audits"] }); setProcessAuditDialog(null); toast({ title: "Deleted" }); },
  });

  const saveIatfSchedule = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return (await apiRequest("PATCH", `/api/iatf-audit-schedule/${data.id}`, data)).json();
      return (await apiRequest("POST", "/api/iatf-audit-schedule", data)).json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iatf-audit-schedule"] }); setIatfScheduleDialog(null); toast({ title: "Schedule saved" }); },
  });
  const deleteIatfSchedule = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/iatf-audit-schedule/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/iatf-audit-schedule"] }); setIatfScheduleDialog(null); toast({ title: "Schedule entry removed" }); },
  });

  const clauses = selectedAudit ? getClausesForStandard(selectedAudit.standard) : [];
  const findingForClause = (clause: string) => findings.find(f => f.clause === clause);
  const findingCounts = findings.reduce((acc, f) => { acc[f.findingType] = (acc[f.findingType] || 0) + 1; return acc; }, {} as Record<string, number>);

  // Count process notes that have NCs or OFIs
  const processNcCount = processNotes.filter(n => n.nonconformances?.trim()).length;
  const processOfiCount = processNotes.filter(n => n.opportunities?.trim()).length;
  const processNotMet = processNotes.filter(n => n.isObjectiveMet === "no").length;
  const processPartial = processNotes.filter(n => n.isObjectiveMet === "partial").length;
  const processAudited = processNotes.length;

  const toggleProcess = (name: string) => {
    setExpandedProcesses(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // ── Audit detail (process-approach view) ──────────────────────────────────────
  if (selectedAudit) {
    return (
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedAuditId(null)} className="text-muted-foreground hover:text-foreground text-sm" data-testid="button-back-audits">← All Audits</button>
            <span className="text-muted-foreground">/</span>
            <h2 className="font-semibold text-primary">{selectedAudit.standard}</h2>
            <Badge className={`text-xs border ${STATUS_COLORS[selectedAudit.status] || STATUS_COLORS.planned}`}>{selectedAudit.status.replace("_", " ").toUpperCase()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedAudit.status === "planned" && (
              <Button size="sm" variant="outline" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "in_progress" } })} data-testid="button-start-audit">
                Start Audit
              </Button>
            )}
            {selectedAudit.status === "in_progress" && (
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateAudit.mutate({ id: selectedAudit.id, data: { status: "complete", completedDate: new Date().toISOString() } })} data-testid="button-complete-audit">
                Mark Complete
              </Button>
            )}
            {onAskIsa && (
              <Button size="sm" variant="outline" onClick={() => onAskIsa(`I'm conducting a process-approach internal audit for ${selectedAudit.standard}. I've audited ${processAudited} processes, found ${processNcCount} processes with NCs and ${processOfiCount} with OFIs. Can you help me think through the findings and next steps?`)}>
                Ask Isa
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Delete this audit and all its records?")) deleteAudit.mutate(selectedAudit.id); }} data-testid="button-delete-audit">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Report header card ── */}
          <div className="mx-6 mt-5 rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-[#1a2744] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm tracking-wide uppercase">Internal Audit Report — {selectedAudit.standard}</p>
                <p className="text-blue-200 text-xs mt-0.5">Process Approach · IATF 9.2 / ISO 9001 Clause 9.2</p>
              </div>
              <div className="text-right text-xs text-blue-200 space-y-0.5">
                {selectedAudit.scheduledDate && <p>Date: <span className="text-white font-semibold">{new Date(selectedAudit.scheduledDate).toLocaleDateString()}</span></p>}
                {selectedAudit.completedDate && <p>Completed: <span className="text-white font-semibold">{new Date(selectedAudit.completedDate).toLocaleDateString()}</span></p>}
              </div>
            </div>

            <div className="bg-white px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Lead Auditor</p>
                <p className="font-medium text-foreground">{selectedAudit.leadAuditor || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Auditee Contact</p>
                <p className="font-medium text-foreground">{selectedAudit.contact || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Scope</p>
                <p className="font-medium text-foreground">{selectedAudit.scope || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mb-0.5">Exclusions</p>
                <p className="font-medium text-foreground">{selectedAudit.exclusions || "None"}</p>
              </div>
            </div>

            {selectedAudit.objective && (
              <div className="bg-blue-50/60 px-5 py-3 border-b text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 mr-2">Audit Objective:</span>
                <span className="text-foreground">{selectedAudit.objective}</span>
              </div>
            )}

            {/* Opening / Closing meeting */}
            <div className="grid grid-cols-2 divide-x bg-gray-50/60 border-b text-sm">
              <div className="px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Opening Meeting</p>
                {selectedAudit.openingMeetingDate
                  ? <p className="font-medium text-foreground">{new Date(selectedAudit.openingMeetingDate).toLocaleDateString()}</p>
                  : <p className="text-muted-foreground italic">Not recorded</p>}
                {selectedAudit.openingMeetingAttendees && <p className="text-xs text-muted-foreground mt-0.5">{selectedAudit.openingMeetingAttendees}</p>}
              </div>
              <div className="px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Closing Meeting</p>
                {selectedAudit.closingMeetingDate
                  ? <p className="font-medium text-foreground">{new Date(selectedAudit.closingMeetingDate).toLocaleDateString()}</p>
                  : <p className="text-muted-foreground italic">Not recorded</p>}
                {selectedAudit.closingMeetingAttendees && <p className="text-xs text-muted-foreground mt-0.5">{selectedAudit.closingMeetingAttendees}</p>}
              </div>
            </div>

            {/* Findings summary bar */}
            <div className="px-5 py-3 bg-white flex flex-wrap items-center gap-5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary:</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="font-semibold text-blue-700">{processAudited}</span> <span className="text-muted-foreground">Processes Audited</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="font-semibold text-green-700">{processAudited - processNotMet - processPartial}</span> <span className="text-muted-foreground">Objectives Met</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="font-semibold text-amber-700">{processPartial}</span> <span className="text-muted-foreground">Partially Met</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="font-semibold text-red-700">{processNotMet}</span> <span className="text-muted-foreground">Not Met</span></span>
              <span className="ml-auto flex items-center gap-3 text-xs">
                <span className="text-red-700 font-bold">{processNcCount} NCs</span>
                <span className="text-amber-700 font-bold">{processOfiCount} OFIs</span>
              </span>
            </div>
          </div>

          {/* ── Executive Summary ── */}
          <div className="mx-6 mt-4 rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-muted/40 px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <p className="font-semibold text-sm text-foreground">Executive Summary</p>
              </div>
              {summaryEdit === null && (
                <button className="text-xs text-accent hover:underline flex items-center gap-1" onClick={() => setSummaryEdit(selectedAudit.executiveSummary || "")} data-testid="button-edit-summary">
                  <Edit3 className="w-3 h-3" />Edit
                </button>
              )}
            </div>
            <div className="px-5 py-4 bg-white">
              {summaryEdit !== null ? (
                <div className="space-y-2">
                  <Textarea
                    rows={5}
                    value={summaryEdit}
                    onChange={e => setSummaryEdit(e.target.value)}
                    placeholder="Summarize the overall audit outcome, conformance status, and key findings…"
                    className="text-sm"
                    data-testid="textarea-executive-summary"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => { updateAudit.mutate({ id: selectedAudit.id, data: { executiveSummary: summaryEdit } }); setSummaryEdit(null); }} disabled={updateAudit.isPending} data-testid="button-save-summary">
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSummaryEdit(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                selectedAudit.executiveSummary
                  ? <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedAudit.executiveSummary}</p>
                  : <p className="text-sm text-muted-foreground italic">No executive summary recorded. Click Edit to add one.</p>
              )}
            </div>
          </div>

          {/* ── Process Accordion ── */}
          <div className="mx-6 mt-4 mb-6 rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-[#1a2744] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-200" />
                <p className="text-white font-bold text-sm">Process-by-Process Audit Findings</p>
              </div>
              <p className="text-blue-200 text-xs">{processAudited}/{processes.length} processes documented</p>
            </div>

            {processes.length === 0 && (
              <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No processes found in your Process Map.</p>
                <p className="text-xs mt-1">Add processes in ISO Manager → Process Map first, then return here to conduct the audit.</p>
              </div>
            )}

            {processes.length > 0 && (
              <div className="divide-y bg-white">
                {processes.map(proc => {
                  const pType = normalizeProcessType(proc.row || "SOP");
                  const note = processNotes.find(n => n.processName === proc.name);
                  const isExpanded = expandedProcesses.has(proc.name);

                  const typeStyles: Record<string, { border: string; badge: string; dot: string }> = {
                    COP: { border: "border-l-4 border-l-orange-500", badge: "bg-orange-100 text-orange-800 border-orange-300", dot: "bg-orange-500" },
                    SOP: { border: "border-l-4 border-l-emerald-500", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
                    MOP: { border: "border-l-4 border-l-blue-500", badge: "bg-blue-100 text-blue-800 border-blue-300", dot: "bg-blue-500" },
                  };
                  const ts = typeStyles[pType];

                  const hasNc = !!(note?.nonconformances?.trim());
                  const hasOfi = !!(note?.opportunities?.trim());

                  return (
                    <div key={proc.name} className={ts.border} data-testid={`process-row-${proc.name}`}>
                      {/* Process header row */}
                      <div
                        className={`flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors group`}
                        onClick={() => toggleProcess(proc.name)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded border ${ts.badge}`}>{pType}</span>
                          <span className="font-semibold text-foreground text-sm truncate">{proc.name}</span>
                          {proc.owner && <span className="text-xs text-muted-foreground hidden md:block truncate">· {proc.owner}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {note ? (
                            <>
                              <ObjectiveMetBadge value={note.isObjectiveMet} />
                              {hasNc && <Badge className="text-xs border bg-red-100 text-red-800 border-red-300">NC</Badge>}
                              {hasOfi && <Badge className="text-xs border bg-amber-100 text-amber-800 border-amber-300">OFI</Badge>}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">Not yet audited</span>
                          )}
                          <button
                            className="ml-2 text-xs text-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0"
                            onClick={e => { e.stopPropagation(); setProcessNotesDialog({ process: proc, existing: note }); }}
                            data-testid={`button-edit-process-${proc.name}`}
                          >
                            <Edit3 className="w-3 h-3" />{note ? "Edit" : "Record"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded process detail */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 space-y-4 bg-muted/10 border-t">
                          {!note ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <ListChecks className="w-7 h-7 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">No audit notes recorded for this process yet.</p>
                              <Button size="sm" variant="outline" className="mt-3" onClick={() => setProcessNotesDialog({ process: proc, existing: undefined })} data-testid={`button-record-process-${proc.name}`}>
                                Record Audit Notes
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Process Objective */}
                              <div className="bg-white rounded-lg border p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="w-4 h-4 text-primary shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Process Objective / KPI</p>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{note.processObjectives || <span className="italic text-muted-foreground">Not recorded</span>}</p>
                                <div className="pt-1">
                                  <ObjectiveMetBadge value={note.isObjectiveMet} />
                                  {note.objectiveMetNotes && <p className="text-xs text-muted-foreground mt-1">{note.objectiveMetNotes}</p>}
                                </div>
                              </div>

                              {/* Personnel Interviewed */}
                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-4 h-4 text-primary shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Personnel Interviewed</p>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{note.personnelInterviewed || <span className="italic text-muted-foreground">Not recorded</span>}</p>
                              </div>

                              {/* Process Description */}
                              {note.processDescription && (
                                <div className="bg-white rounded-lg border p-4 md:col-span-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Process Description</p>
                                  </div>
                                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.processDescription}</p>
                                </div>
                              )}

                              {/* Inputs / Outputs / Interactions */}
                              {(note.processInputs || note.processOutputs || note.processInteractions) && (
                                <div className="bg-white rounded-lg border p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Activity className="w-4 h-4 text-primary shrink-0" />
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Inputs / Outputs / Interactions</p>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    {note.processInputs && <div><span className="font-semibold text-foreground">Inputs: </span><span className="text-muted-foreground">{note.processInputs}</span></div>}
                                    {note.processOutputs && <div><span className="font-semibold text-foreground">Outputs: </span><span className="text-muted-foreground">{note.processOutputs}</span></div>}
                                    {note.processInteractions && <div><span className="font-semibold text-foreground">Interactions: </span><span className="text-muted-foreground">{note.processInteractions}</span></div>}
                                  </div>
                                </div>
                              )}

                              {/* Objective Evidence */}
                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Search className="w-4 h-4 text-primary shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Objective Evidence Reviewed</p>
                                </div>
                                {note.objectiveEvidence
                                  ? <ul className="space-y-1">{note.objectiveEvidence.split("\n").filter(Boolean).map((ev, i) => <li key={i} className="text-sm text-foreground flex gap-1.5"><span className="text-muted-foreground shrink-0">·</span>{ev}</li>)}</ul>
                                  : <p className="text-sm italic text-muted-foreground">None recorded</p>}
                              </div>

                              {/* Nonconformances */}
                              <div className="bg-white rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">Nonconformances (NC)</p>
                                </div>
                                {note.nonconformances?.trim()
                                  ? <ul className="space-y-1.5">{note.nonconformances.split("\n").filter(Boolean).map((nc, i) => <li key={i} className="text-sm text-foreground flex gap-1.5"><span className="text-red-500 font-bold shrink-0">NC{i+1}.</span>{nc}</li>)}</ul>
                                  : <p className="text-sm text-green-700 font-medium">No nonconformances identified</p>}
                              </div>

                              {/* Opportunities for Improvement */}
                              <div className="bg-white rounded-lg border p-4 md:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Opportunities for Improvement (OFI)</p>
                                </div>
                                {note.opportunities?.trim()
                                  ? <ul className="space-y-1.5">{note.opportunities.split("\n").filter(Boolean).map((ofi, i) => <li key={i} className="text-sm text-foreground flex gap-1.5"><span className="text-amber-600 font-bold shrink-0">OFI{i+1}.</span>{ofi}</li>)}</ul>
                                  : <p className="text-sm text-muted-foreground italic">None recorded</p>}
                              </div>
                            </div>
                          )}

                          {note && (
                            <div className="flex justify-end gap-2 pt-1">
                              <Button size="sm" variant="outline" onClick={() => setProcessNotesDialog({ process: proc, existing: note })} data-testid={`button-edit-notes-${proc.name}`}>
                                <Edit3 className="w-3.5 h-3.5 mr-1" />Edit Notes
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Delete notes for this process?")) deleteProcessNote.mutate(note.id); }} data-testid={`button-delete-notes-${proc.name}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Process Notes Dialog ── */}
        {processNotesDialog && (
          <ProcessNotesDialog
            process={processNotesDialog.process}
            existing={processNotesDialog.existing}
            onSave={data => saveProcessNote.mutate(data)}
            onClose={() => setProcessNotesDialog(null)}
            isPending={saveProcessNote.isPending}
          />
        )}

        {/* ── Legacy Clause Finding Dialog (kept for direct access if needed) ── */}
        {findingDialog?.open && (
          <FindingDialog
            clause={findingDialog.clause} clauseTitle={findingDialog.clauseTitle} existing={findingDialog.existing}
            onSave={(data) => saveFinding.mutate(data)}
            onDelete={findingDialog.existing ? () => { deleteFinding.mutate(findingDialog.existing!.id); setFindingDialog(null); } : undefined}
            onClose={() => setFindingDialog(null)} isPending={saveFinding.isPending}
          />
        )}
      </div>
    );
  }

  // ── Tabbed list view ──────────────────────────────────────────────────────────
  const unassessed = processes.filter(p => !scheduleEntries.find(e => e.processName === p.name));
  const overdue = scheduleEntries.filter(e => getScheduleStatus(e) === "overdue").length;
  const immediate = scheduleEntries.filter(e => e.recommendedFrequency === "urgent").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h2 className="text-lg font-bold text-primary">Internal Audits</h2>
          <p className="text-xs text-muted-foreground">Plan, conduct, and risk-rank process-based internal audits.</p>
        </div>
        {activeTab === "audits" && (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1" onClick={() => setShowCreateAudit(true)} data-testid="button-create-audit">
            <Plus className="w-4 h-4" /> New Audit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white px-6 overflow-x-auto">
        <button onClick={() => setActiveTab("audits")} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 ${activeTab === "audits" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`} data-testid="tab-audits">
          <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" />Audit Log</span>
        </button>
        <button onClick={() => setActiveTab("schedule")} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 ${activeTab === "schedule" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`} data-testid="tab-schedule">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />Audit Schedule
            {(overdue > 0 || immediate > 0) && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{overdue + immediate}</span>
            )}
          </span>
        </button>
        {isIATF && (
          <>
            <button onClick={() => setActiveTab("product-audit")} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 ${activeTab === "product-audit" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`} data-testid="tab-product-audit">
              <span className="flex items-center gap-1.5"><Package className="w-4 h-4" />Product Audits <span className="text-[10px] font-bold opacity-60">9.2.2.3</span></span>
            </button>
            <button onClick={() => setActiveTab("process-audit")} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0 ${activeTab === "process-audit" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`} data-testid="tab-process-audit">
              <span className="flex items-center gap-1.5"><Factory className="w-4 h-4" />Process Audits <span className="text-[10px] font-bold opacity-60">9.2.2.4</span></span>
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "audits" ? (
          isLoading ? (
            <div className="text-center text-muted-foreground py-12">Loading audits...</div>
          ) : audits.length === 0 ? (
            <div className="text-center py-16 space-y-3 px-6">
              <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="font-medium text-muted-foreground">No audits yet</p>
              <p className="text-sm text-muted-foreground/70">Create your first internal audit to start documenting process-based conformance.</p>
              <Button size="sm" variant="outline" onClick={() => setShowCreateAudit(true)}>Create First Audit</Button>
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {audits.map(audit => (
                <Card key={audit.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer border" onClick={() => setSelectedAuditId(audit.id)} data-testid={`card-audit-${audit.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-semibold text-primary">{audit.standard}</p>
                        <p className="text-xs text-muted-foreground">
                          {audit.scope || "No scope defined"}
                          {audit.leadAuditor && ` · ${audit.leadAuditor}`}
                          {audit.contact && ` · Contact: ${audit.contact}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {audit.scheduledDate && <span className="text-xs text-muted-foreground">{new Date(audit.scheduledDate).toLocaleDateString()}</span>}
                      <Badge className={`text-xs border ${STATUS_COLORS[audit.status] || STATUS_COLORS.planned}`}>{audit.status.replace("_", " ").toUpperCase()}</Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "schedule" ? (
          /* ── Audit Schedule Tab ── */
          <div className="p-6 space-y-5">

            {/* Scheduling rule legend */}
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(FREQ_CONFIG) as [FreqKey, typeof FREQ_CONFIG[FreqKey]][]).map(([key, cfg]) => (
                <div key={key} className={`rounded-lg border p-3.5 ${cfg.rangeColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wide ${cfg.statusColor}`}>{cfg.status}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-white/70 rounded px-1.5 py-0.5 border">{cfg.scoreRange} pts</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cfg.sublabel}</p>
                </div>
              ))}
            </div>

            {/* Per-criterion ranking guide */}
            <details className="group border rounded-lg bg-white">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Risk Ranking Scale — per criterion (score 1–10)
                <span className="ml-auto text-xs group-open:hidden">Show</span>
              </summary>
              <div className="px-4 pb-4 grid grid-cols-4 gap-2 text-xs">
                {BANDS.map(b => (
                  <div key={b.label} className="border rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                      <span className="font-bold text-foreground">{b.label}</span>
                      <span className="text-muted-foreground ml-auto">{b.range}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">Score: {b.score}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-gray-50 rounded border">
                  <HardHat className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                  <span>Processes marked <strong>Consultant Audit</strong> (grey) are to be audited by an external consultant.</span>
                </div>
              </div>
            </details>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Processes", value: processes.length, icon: Activity, color: "text-primary" },
                { label: "Assessed", value: scheduleEntries.length, icon: CheckCircle2, color: "text-green-600" },
                { label: "Overdue", value: overdue, icon: AlertCircle, color: "text-red-600" },
                { label: "Needs Immediate", value: immediate, icon: Clock, color: "text-red-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white border rounded-lg p-3 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color} shrink-0`} />
                  <div>
                    <p className="text-lg font-bold text-foreground leading-none">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {!project && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Connect a Process Map in ISO Manager → Process Map first.</p>
              </div>
            )}

            {project && processes.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No processes found in your Process Map. Add processes there first.</p>
              </div>
            )}

            {project && processes.length > 0 && (
              <AuditMatrix
                processes={processes}
                scheduleEntries={scheduleEntries}
                unassessed={unassessed}
                onAssess={(name, type, entry) => setScheduleDialog({ processName: name, processType: type, existing: entry })}
              />
            )}

            {/* Orphaned entries */}
            {scheduleEntries.filter(e => !processes.find(p => p.name === e.processName)).length > 0 && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20">
                  <p className="text-sm font-semibold text-muted-foreground">Archived Processes (removed from Process Map)</p>
                </div>
                <div className="divide-y">
                  {scheduleEntries.filter(e => !processes.find(p => p.name === e.processName)).map(entry => (
                    <div key={entry.id} className="px-4 py-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground line-through">{entry.processName}</span>
                      <button className="text-xs text-red-500 hover:underline" onClick={() => deleteSchedule.mutate(entry.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "product-audit" ? (
          /* ── 9.2.2.3 Product Audits Tab ── */
          <div className="p-6 space-y-5">
            {/* Header info */}
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200">
              <Package className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">IATF 16949:2016 — Clause 9.2.2.3 Product Audits</p>
                <p className="text-xs text-blue-700 mt-0.5">Audit products at appropriate production and delivery stages to verify conformance to all specified requirements, including customer-specific requirements and applicable technical standards.</p>
              </div>
            </div>

            {/* ── Schedule Section ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-600" />Audit Schedule</h3>
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setIatfScheduleDialog({ auditType: "product" })} data-testid="button-add-product-schedule">
                  <Plus className="w-3 h-3" /> Add Schedule
                </Button>
              </div>
              {iatfScheduleEntries.filter(e => e.auditType === "product").length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 border rounded-lg bg-muted/20">No scheduled product audits — click "Add Schedule" to set up recurring audit schedules.</p>
              ) : (
                <div className="space-y-1.5">
                  {iatfScheduleEntries.filter(e => e.auditType === "product").map(entry => {
                    const isOverdue = entry.nextDueDate ? new Date(entry.nextDueDate) < new Date() : false;
                    return (
                      <div key={entry.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${isOverdue ? "bg-red-50 border-red-200" : "bg-white border-border"}`} data-testid={`row-product-schedule-${entry.id}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <Calendar className={`w-4 h-4 shrink-0 ${isOverdue ? "text-red-500" : "text-blue-500"}`} />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{entry.title} {entry.partNumber && <span className="text-muted-foreground font-normal text-xs">({entry.partNumber})</span>}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.frequency.replace("_", " ")} · Next: {entry.nextDueDate ? new Date(entry.nextDueDate).toLocaleDateString() : "—"}
                              {entry.auditorAssigned && ` · ${entry.auditorAssigned}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {isOverdue && <Badge className="text-[10px] border bg-red-100 text-red-700 border-red-200">Overdue</Badge>}
                          {entry.status === "paused" && <Badge className="text-[10px] border bg-gray-100 text-gray-600 border-gray-200">Paused</Badge>}
                          <button className="text-muted-foreground hover:text-foreground" onClick={() => setIatfScheduleDialog(entry)} data-testid={`button-edit-product-schedule-${entry.id}`}><Edit3 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Audit Records ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-primary" />Audit Records</h3>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1 text-xs h-7" onClick={() => setProductAuditDialog("new")} data-testid="button-new-product-audit">
                  <Plus className="w-3 h-3" /> New Audit
                </Button>
              </div>
              {productAudits.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Package className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="font-medium text-muted-foreground text-sm">No product audits recorded</p>
                  <p className="text-xs text-muted-foreground/70">Record a product audit to verify product conformance at production or delivery stages.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productAudits.map(pa => {
                    const rc = PRODUCT_AUDIT_RESULT_CFG[pa.result || ""] || null;
                    return (
                      <Card key={pa.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer border" onClick={() => setProductAuditDialog(pa)} data-testid={`card-product-audit-${pa.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-primary shrink-0" />
                            <div>
                              <p className="font-semibold text-primary">{pa.partName || pa.partNumber || "—"} {pa.partNumber && pa.partName ? <span className="text-muted-foreground font-normal">({pa.partNumber})</span> : ""}</p>
                              <p className="text-xs text-muted-foreground">
                                {pa.auditDate && new Date(pa.auditDate).toLocaleDateString()}
                                {pa.shift && ` · ${pa.shift} Shift`}
                                {pa.lotNumber && ` · Lot: ${pa.lotNumber}`}
                                {pa.auditor && ` · ${pa.auditor}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {rc && <Badge className={`text-xs border ${rc.cls}`}>{rc.label}</Badge>}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── 9.2.2.4 Manufacturing Process Audits Tab ── */
          <div className="p-6 space-y-5">
            {/* Header info */}
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-orange-50 border-orange-200">
              <Factory className="w-5 h-5 text-orange-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">IATF 16949:2016 — Clause 9.2.2.4 Manufacturing Process Audits</p>
                <p className="text-xs text-orange-700 mt-0.5">Audit each manufacturing process during each production shift (or at appropriate frequency) to assess implementation and effectiveness of all process-related requirements, including control plan conformance using a process/turtle approach.</p>
              </div>
            </div>

            {/* ── Schedule Section ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><Calendar className="w-4 h-4 text-orange-600" />Audit Schedule</h3>
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setIatfScheduleDialog({ auditType: "process" })} data-testid="button-add-process-schedule">
                  <Plus className="w-3 h-3" /> Add Schedule
                </Button>
              </div>
              {iatfScheduleEntries.filter(e => e.auditType === "process").length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3 border rounded-lg bg-muted/20">No scheduled process audits — click "Add Schedule" to set up recurring audit schedules.</p>
              ) : (
                <div className="space-y-1.5">
                  {iatfScheduleEntries.filter(e => e.auditType === "process").map(entry => {
                    const isOverdue = entry.nextDueDate ? new Date(entry.nextDueDate) < new Date() : false;
                    return (
                      <div key={entry.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${isOverdue ? "bg-red-50 border-red-200" : "bg-white border-border"}`} data-testid={`row-process-schedule-${entry.id}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <Calendar className={`w-4 h-4 shrink-0 ${isOverdue ? "text-red-500" : "text-orange-500"}`} />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{entry.title} {entry.workstation && <span className="text-muted-foreground font-normal text-xs">— {entry.workstation}</span>}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.frequency.replace("_", " ")} · Next: {entry.nextDueDate ? new Date(entry.nextDueDate).toLocaleDateString() : "—"}
                              {entry.auditorAssigned && ` · ${entry.auditorAssigned}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {isOverdue && <Badge className="text-[10px] border bg-red-100 text-red-700 border-red-200">Overdue</Badge>}
                          {entry.status === "paused" && <Badge className="text-[10px] border bg-gray-100 text-gray-600 border-gray-200">Paused</Badge>}
                          <button className="text-muted-foreground hover:text-foreground" onClick={() => setIatfScheduleDialog(entry)} data-testid={`button-edit-process-schedule-${entry.id}`}><Edit3 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Audit Records ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-primary" />Audit Records</h3>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1 text-xs h-7" onClick={() => setProcessAuditDialog("new")} data-testid="button-new-process-audit">
                  <Plus className="w-3 h-3" /> New Audit
                </Button>
              </div>
              {mfgProcessAudits.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Factory className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                  <p className="font-medium text-muted-foreground text-sm">No process audits recorded</p>
                  <p className="text-xs text-muted-foreground/70">Record a manufacturing process audit to verify conformance to control plan requirements.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mfgProcessAudits.map(mpa => {
                    const rc = PROCESS_AUDIT_RESULT_CFG[mpa.result || ""] || null;
                    return (
                      <Card key={mpa.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer border" onClick={() => setProcessAuditDialog(mpa)} data-testid={`card-process-audit-${mpa.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Factory className="w-5 h-5 text-primary shrink-0" />
                            <div>
                              <p className="font-semibold text-primary">{mpa.processName || "—"} {mpa.workstation ? <span className="text-muted-foreground font-normal">— {mpa.workstation}</span> : ""}</p>
                              <p className="text-xs text-muted-foreground">
                                {mpa.auditDate && new Date(mpa.auditDate).toLocaleDateString()}
                                {mpa.shift && ` · ${mpa.shift} Shift`}
                                {mpa.partNumber && ` · P/N: ${mpa.partNumber}`}
                                {mpa.auditor && ` · ${mpa.auditor}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {rc && <Badge className={`text-xs border ${rc.cls}`}>{rc.label}</Badge>}
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── IATF Product Audit Dialog ── */}
      {productAuditDialog !== null && (
        <ProductAuditDialog
          existing={productAuditDialog === "new" ? undefined : productAuditDialog}
          onSave={data => saveProductAudit.mutate(data)}
          onDelete={productAuditDialog !== "new" && productAuditDialog ? () => deleteProductAudit.mutate((productAuditDialog as IatfProductAudit).id) : undefined}
          onClose={() => setProductAuditDialog(null)}
          isPending={saveProductAudit.isPending || deleteProductAudit.isPending}
        />
      )}

      {/* ── IATF Process Audit Dialog ── */}
      {processAuditDialog !== null && (
        <MfgProcessAuditDialog
          processes={processes}
          existing={processAuditDialog === "new" ? undefined : processAuditDialog}
          onSave={data => saveMfgProcessAudit.mutate(data)}
          onDelete={processAuditDialog !== "new" && processAuditDialog ? () => deleteMfgProcessAudit.mutate((processAuditDialog as IatfMfgProcessAudit).id) : undefined}
          onClose={() => setProcessAuditDialog(null)}
          isPending={saveMfgProcessAudit.isPending || deleteMfgProcessAudit.isPending}
        />
      )}

      {/* ── IATF Audit Schedule Dialog ── */}
      {iatfScheduleDialog !== null && (
        <IatfScheduleDialog
          existing={"id" in iatfScheduleDialog ? iatfScheduleDialog as IatfAuditSchedule : undefined}
          defaultType={"auditType" in iatfScheduleDialog ? (iatfScheduleDialog as { auditType: "product" | "process" }).auditType : undefined}
          processes={processes}
          onSave={data => saveIatfSchedule.mutate(data)}
          onDelete={"id" in iatfScheduleDialog ? () => deleteIatfSchedule.mutate((iatfScheduleDialog as IatfAuditSchedule).id) : undefined}
          onClose={() => setIatfScheduleDialog(null)}
          isPending={saveIatfSchedule.isPending || deleteIatfSchedule.isPending}
        />
      )}

      {showCreateAudit && (
        <CreateAuditDialog onSave={(data) => createAudit.mutate(data)} onClose={() => setShowCreateAudit(false)} isPending={createAudit.isPending} />
      )}

      {scheduleDialog && (
        <RiskAssessmentDialog
          processName={scheduleDialog.processName}
          processType={scheduleDialog.processType}
          existing={scheduleDialog.existing}
          onSave={(data) => saveSchedule.mutate(data)}
          onDelete={scheduleDialog.existing ? () => deleteSchedule.mutate(scheduleDialog.existing!.id) : undefined}
          onClose={() => setScheduleDialog(null)}
          isPending={saveSchedule.isPending}
        />
      )}
    </div>
  );
}

// ── Audit Matrix Component ─────────────────────────────────────────────────────

function nextDateCellStyle(nextDate: Date | string | null | undefined): string {
  if (!nextDate) return "";
  const d = new Date(nextDate);
  const now = new Date();
  if (d < now) return "bg-red-600 text-white font-bold";
  const monthsOut = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  if (monthsOut <= 3)  return "bg-orange-400 text-white font-bold";
  if (monthsOut <= 12) return "bg-yellow-300 text-gray-900 font-bold";
  if (monthsOut <= 18) return "bg-yellow-100 text-gray-700 font-semibold";
  return "bg-green-50 text-green-800";
}

function freqLabel(freqKey: FreqKey | null): string {
  if (!freqKey) return "—";
  return { triennial: "1× / 3 yrs", biennial: "1× / 1–2 yrs", urgent: "2× / yr" }[freqKey] || "—";
}

function AuditMatrix({ processes, scheduleEntries, unassessed, onAssess }: {
  processes: ProcessEntry[];
  scheduleEntries: AuditProcessSchedule[];
  unassessed: ProcessEntry[];
  onAssess: (name: string, type: "COP" | "SOP" | "MOP", entry?: AuditProcessSchedule) => void;
}) {
  const TYPE_ROW_STYLE: Record<string, { border: string; label: string; headerBg: string; headerText: string }> = {
    COP: { border: "border-l-4 border-l-orange-500", label: "Customer-Oriented Processes (COP)", headerBg: "bg-orange-600", headerText: "text-orange-100" },
    SOP: { border: "border-l-4 border-l-emerald-500", label: "Support-Oriented Processes (SOP)",   headerBg: "bg-emerald-700", headerText: "text-emerald-100" },
    MOP: { border: "border-l-4 border-l-blue-500",    label: "Management-Oriented Processes (MOP)", headerBg: "bg-blue-700",    headerText: "text-blue-100" },
  };

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm">

      {/* Document-style title bar */}
      <div className="bg-[#1a2744] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm tracking-wide uppercase">Internal Audit Scheduling Worksheet</p>
          <p className="text-blue-200 text-xs mt-0.5">Process Approach · Risk-Based Scheduling · Clause Cross-Reference</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-blue-200">
          <span><span className="font-bold text-white">{processes.length}</span> Processes</span>
          <span><span className="font-bold text-white">{new Set(processes.flatMap(p => p.clauses || [])).size}</span> Clauses Covered</span>
          {unassessed.length > 0 && <span className="text-amber-300"><span className="font-bold">{unassessed.length}</span> Not yet assessed</span>}
        </div>
      </div>

      {/* Column header row */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-xs border-collapse" style={{ minWidth: "860px" }}>
          <thead>
            <tr className="bg-[#2d3f6b] text-white text-center">
              <th className="px-3 py-2.5 text-left font-semibold tracking-wide w-[22%]">Process</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Owner</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[8%]">Type</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Auditor</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[8%]">Freq/Year</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[18%]">Risk Level</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Related Clauses</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Notes</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Last Audit</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[10%]">Next Audit</th>
              <th className="px-3 py-2.5 font-semibold tracking-wide w-[6%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(["COP", "SOP", "MOP"] as const).map(pType => {
              const typeProcs = processes.filter(p => normalizeProcessType(p.row || "SOP") === pType);
              if (typeProcs.length === 0) return null;
              const style = TYPE_ROW_STYLE[pType];
              return (
                <>
                  {/* Section sub-header */}
                  <tr key={`header-${pType}`} className={`${style.headerBg}`}>
                    <td colSpan={11} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${style.headerText}`}>
                      {style.label}
                    </td>
                  </tr>

                  {typeProcs.map(proc => {
                    const entry = scheduleEntries.find(e => e.processName === proc.name);
                    const score = entry ? calcTotalScore({
                      riskComplexity: entry.riskComplexity,
                      riskCustomerImpact: entry.riskCustomerImpact,
                      riskPreviousAudit: entry.riskPreviousAudit,
                      riskPerformance: entry.riskPerformance,
                      riskChangeFreq: entry.riskChangeFreq,
                      riskComplaints: entry.riskComplaints,
                    }) : null;
                    const freqKey = score !== null ? scoreToFreq(score) : null;
                    const freqCfg = freqKey ? FREQ_CONFIG[freqKey] : null;
                    const schedStatus = entry ? getScheduleStatus(entry) : "not_assessed";
                    const nextDateStyle = nextDateCellStyle(entry?.nextAuditDate);
                    const statusLabel = freqKey ? { triennial: "IN CONTROL", biennial: "NEEDS ATTENTION", urgent: "NEEDS IMMEDIATE" }[freqKey] : "";
                    const isConsultant = entry?.consultantAudit ?? false;

                    return (
                      <tr
                        key={proc.name}
                        className={`group hover:bg-muted/20 text-xs ${style.border} ${isConsultant ? "bg-gray-100/80" : ""}`}
                        data-testid={`row-schedule-${proc.name}`}
                      >
                        {/* Process Name */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          <div className="font-semibold text-foreground leading-snug">{proc.name}</div>
                          {isConsultant && <div className="flex items-center gap-1 mt-0.5 text-muted-foreground"><HardHat className="w-3 h-3" /><span className="italic">Consultant</span></div>}
                        </td>

                        {/* Owner */}
                        <td className="py-3 px-3 border-r border-gray-100 text-muted-foreground text-center">
                          {proc.owner ? (
                            <span className="flex items-center justify-center gap-1"><User className="w-3 h-3 shrink-0" />{proc.owner}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Audit Type */}
                        <td className="py-3 px-3 border-r border-gray-100 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            pType === "COP" ? "bg-orange-100 text-orange-800" :
                            pType === "SOP" ? "bg-emerald-100 text-emerald-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>{pType}</span>
                        </td>

                        {/* Auditor */}
                        <td className="py-3 px-3 border-r border-gray-100 text-muted-foreground text-center">
                          {entry?.auditorAssigned ? (
                            <span className="font-medium">{entry.auditorAssigned}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Freq/Year */}
                        <td className="py-3 px-3 border-r border-gray-100 text-center text-muted-foreground">
                          {freqKey ? (
                            <span className="font-medium">{freqLabel(freqKey)}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Risk Level — badge + score + bar */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          {score !== null && freqCfg ? (
                            <div className="space-y-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border ${
                                freqKey === "triennial"
                                  ? "bg-green-50 text-green-800 border-green-300"
                                  : freqKey === "biennial"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-red-50 text-red-800 border-red-300"
                              }`}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  freqKey === "triennial" ? "bg-green-500" : freqKey === "biennial" ? "bg-amber-500" : "bg-red-500"
                                }`} />
                                {statusLabel}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                                  <div className={`h-1.5 rounded-full ${freqCfg.barColor}`} style={{ width: `${Math.min(100, ((score - 6) / 54) * 100)}%` }} />
                                </div>
                                <span className={`text-xs font-bold tabular-nums ${freqCfg.statusColor}`}>{score}<span className="font-normal text-muted-foreground">/60</span></span>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="text-xs text-accent hover:underline italic"
                              onClick={() => onAssess(proc.name, pType, entry)}
                            >
                              Click to assess →
                            </button>
                          )}
                        </td>

                        {/* Related Clauses — from process map */}
                        <td className="py-3 px-3 border-r border-gray-100">
                          {proc.clauses && proc.clauses.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5">
                              {proc.clauses.slice(0, 6).map(c => (
                                <span key={c} className="inline-block bg-[#1a2744]/8 text-[#1a2744] border border-[#1a2744]/20 rounded px-1 py-0.5 text-xs font-mono leading-none">
                                  {c}
                                </span>
                              ))}
                              {proc.clauses.length > 6 && (
                                <span className="text-muted-foreground/60 italic text-xs">+{proc.clauses.length - 6}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 italic">—</span>
                          )}
                        </td>

                        {/* Notes / Reason */}
                        <td className="py-3 px-3 border-r border-gray-100 text-muted-foreground max-w-[200px]">
                          <span className="line-clamp-2 leading-snug">{entry?.notes || <span className="italic opacity-40">—</span>}</span>
                        </td>

                        {/* Last Audit Date */}
                        <td className="py-3 px-3 text-center border-r border-gray-100 text-muted-foreground">
                          {entry?.lastAuditDate ? (
                            <span className="font-medium">{new Date(entry.lastAuditDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                          ) : <span className="italic opacity-40">—</span>}
                        </td>

                        {/* Next Audit Date — color-highlighted */}
                        <td className="py-3 px-3 text-center border-r border-gray-100">
                          {entry?.nextAuditDate ? (
                            <div className={`rounded px-2 py-1 inline-block text-xs ${nextDateStyle}`}>
                              <div className="font-bold">{new Date(entry.nextAuditDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</div>
                              {schedStatus === "overdue" && <div className="text-xs opacity-80 font-medium">OVERDUE</div>}
                            </div>
                          ) : (
                            <button
                              className="text-xs text-accent hover:underline italic"
                              onClick={() => onAssess(proc.name, pType, entry)}
                            >Assess →</button>
                          )}
                        </td>

                        {/* Edit action */}
                        <td className="py-3 px-2 text-center">
                          <button
                            className="text-xs font-medium text-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onAssess(proc.name, pType, entry)}
                            data-testid={`button-assess-${proc.name}`}
                          >
                            {entry ? "Edit" : "Assess"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="flex items-center flex-wrap gap-5 px-5 py-3 bg-[#1a2744]/5 border-t text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Risk Level:</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /><span className="font-semibold text-green-800">IN CONTROL</span> — score 6–25 · audit every 3 years</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /><span className="font-semibold text-amber-800">NEEDS ATTENTION</span> — score 26–50 · audit every 12–24 months</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /><span className="font-semibold text-red-800">NEEDS IMMEDIATE ATTENTION</span> — score 51–60 · audit every 6–9 months</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-semibold text-foreground">Next Audit:</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-red-600 inline-block" />Overdue</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-orange-400 inline-block" />≤ 3 months</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-yellow-300 inline-block" />≤ 12 months</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded bg-green-50 border inline-block" />On Track</span>
        <span className="ml-auto flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5" />Grey = Consultant Audit</span>
      </div>
    </div>
  );
}

// ── Create Audit Dialog ────────────────────────────────────────────────────────

function CreateAuditDialog({ onSave, onClose, isPending }: { onSave: (data: any) => void; onClose: () => void; isPending: boolean }) {
  const [form, setForm] = useState({
    standard: "ISO 9001:2015",
    scope: "",
    exclusions: "",
    leadAuditor: "",
    contact: "",
    objective: "",
    scheduledDate: "",
    openingMeetingDate: "",
    openingMeetingAttendees: "",
    closingMeetingDate: "",
    closingMeetingAttendees: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Internal Audit</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Standard</Label>
              <Select value={form.standard} onValueChange={v => set("standard", v)}>
                <SelectTrigger data-testid="select-audit-standard"><SelectValue /></SelectTrigger>
                <SelectContent>{ISO_STANDARDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead Auditor <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="Name" value={form.leadAuditor} onChange={e => set("leadAuditor", e.target.value)} data-testid="input-lead-auditor" />
            </div>
            <div>
              <Label>Auditee Contact <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="Name / title" value={form.contact} onChange={e => set("contact", e.target.value)} data-testid="input-contact" />
            </div>
            <div className="col-span-2">
              <Label>Audit Scope <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. All QMS processes, clauses 4–10" value={form.scope} onChange={e => set("scope", e.target.value)} data-testid="input-audit-scope" />
            </div>
            <div className="col-span-2">
              <Label>Exclusions <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="e.g. Clause 8.3 Design & Development — not applicable" value={form.exclusions} onChange={e => set("exclusions", e.target.value)} data-testid="input-exclusions" />
            </div>
            <div className="col-span-2">
              <Label>Audit Objective <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea placeholder="e.g. Verify conformance to IATF 16949:2016 and effectiveness of the QMS…" value={form.objective} onChange={e => set("objective", e.target.value)} rows={2} data-testid="textarea-objective" />
            </div>
            <div>
              <Label>Scheduled Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)} data-testid="input-scheduled-date" />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Meeting Details <span className="text-muted-foreground font-normal">(optional — can be added after)</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Opening Meeting Date</Label>
                <Input type="date" value={form.openingMeetingDate} onChange={e => set("openingMeetingDate", e.target.value)} data-testid="input-opening-meeting-date" />
              </div>
              <div>
                <Label className="text-xs">Opening Meeting Attendees</Label>
                <Input placeholder="Names / titles" value={form.openingMeetingAttendees} onChange={e => set("openingMeetingAttendees", e.target.value)} data-testid="input-opening-attendees" />
              </div>
              <div>
                <Label className="text-xs">Closing Meeting Date</Label>
                <Input type="date" value={form.closingMeetingDate} onChange={e => set("closingMeetingDate", e.target.value)} data-testid="input-closing-meeting-date" />
              </div>
              <div>
                <Label className="text-xs">Closing Meeting Attendees</Label>
                <Input placeholder="Names / titles" value={form.closingMeetingAttendees} onChange={e => set("closingMeetingAttendees", e.target.value)} data-testid="input-closing-attendees" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave({ ...form, status: "planned" })} disabled={isPending} data-testid="button-save-audit">
              {isPending ? "Creating..." : "Create Audit"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Process Notes Dialog ───────────────────────────────────────────────────────

function ProcessNotesDialog({ process, existing, onSave, onClose, isPending }: {
  process: ProcessEntry;
  existing?: IsoAuditProcessNote;
  onSave: (data: any) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    processName: process.name,
    processObjectives: existing?.processObjectives || "",
    isObjectiveMet: existing?.isObjectiveMet || "",
    objectiveMetNotes: existing?.objectiveMetNotes || "",
    processInputs: existing?.processInputs || (process.inputs || ""),
    processOutputs: existing?.processOutputs || (process.outputs || ""),
    processInteractions: existing?.processInteractions || "",
    personnelInterviewed: existing?.personnelInterviewed || "",
    processDescription: existing?.processDescription || "",
    objectiveEvidence: existing?.objectiveEvidence || "",
    nonconformances: existing?.nonconformances || "",
    opportunities: existing?.opportunities || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Audit Notes — {process.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Process Objective */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Process Objective / KPI Targets</p>
            </div>
            <Textarea
              placeholder="State the process objective and KPI targets (e.g. OTD ≥ 98%, defect rate ≤ 0.5%)…"
              value={form.processObjectives}
              onChange={e => set("processObjectives", e.target.value)}
              rows={2}
              data-testid="textarea-process-objectives"
            />
            <div>
              <Label className="text-xs">Is the Objective Being Met?</Label>
              <div className="flex gap-2 mt-1.5">
                {[
                  { value: "yes",     label: "Yes — Met",           cls: "border-green-400 bg-green-50 text-green-800" },
                  { value: "partial", label: "Partially Met",        cls: "border-amber-400 bg-amber-50 text-amber-800" },
                  { value: "no",      label: "No — Not Met",         cls: "border-red-400 bg-red-50 text-red-800" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${form.isObjectiveMet === opt.value ? opt.cls + " ring-2 ring-offset-1 ring-current" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    onClick={() => set("isObjectiveMet", opt.value)}
                    data-testid={`button-objective-met-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {form.isObjectiveMet && form.isObjectiveMet !== "yes" && (
              <div>
                <Label className="text-xs">Explanation</Label>
                <Textarea placeholder="Explain why objective is not or only partially met…" value={form.objectiveMetNotes} onChange={e => set("objectiveMetNotes", e.target.value)} rows={2} data-testid="textarea-objective-met-notes" />
              </div>
            )}
          </div>

          {/* Personnel */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5 text-primary" />Personnel Interviewed</Label>
            <Input placeholder="Names and roles of personnel interviewed during this audit…" value={form.personnelInterviewed} onChange={e => set("personnelInterviewed", e.target.value)} data-testid="input-personnel" />
          </div>

          {/* Process Description */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1"><BookOpen className="w-3.5 h-3.5 text-primary" />Process Description (Auditor Observations)</Label>
            <Textarea placeholder="Describe how the process operates, what was observed, and how it interacts with other processes…" value={form.processDescription} onChange={e => set("processDescription", e.target.value)} rows={3} data-testid="textarea-process-description" />
          </div>

          {/* Inputs / Outputs / Interactions */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Inputs / Outputs / Interactions</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Process Inputs</Label>
                <Textarea placeholder="Materials, information, or resources entering this process…" value={form.processInputs} onChange={e => set("processInputs", e.target.value)} rows={2} data-testid="textarea-inputs" />
              </div>
              <div>
                <Label className="text-xs">Process Outputs</Label>
                <Textarea placeholder="Products, services, records, or information produced…" value={form.processOutputs} onChange={e => set("processOutputs", e.target.value)} rows={2} data-testid="textarea-outputs" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Interactions with Other Processes</Label>
              <Input placeholder="e.g. Receives orders from Sales; feeds into Production…" value={form.processInteractions} onChange={e => set("processInteractions", e.target.value)} data-testid="input-interactions" />
            </div>
          </div>

          {/* Objective Evidence */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1">
              <Search className="w-3.5 h-3.5 text-primary" />
              Objective Evidence Reviewed
              <span className="text-xs text-muted-foreground font-normal">(one item per line)</span>
            </Label>
            <Textarea
              placeholder={"Procedure QP-01 Rev 4 reviewed\nTraining records for 5 operators verified\nInspection log for last 30 days sampled"}
              value={form.objectiveEvidence}
              onChange={e => set("objectiveEvidence", e.target.value)}
              rows={4}
              data-testid="textarea-evidence"
            />
          </div>

          {/* Nonconformances */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Nonconformances (NC)
              <span className="text-xs text-muted-foreground font-normal">(one per line)</span>
            </Label>
            <Textarea
              placeholder={"Calibration record for Instrument #42 missing — ISO 9001 7.1.5\nNo evidence of management review output action items"}
              value={form.nonconformances}
              onChange={e => set("nonconformances", e.target.value)}
              rows={3}
              className="border-red-200 focus-visible:ring-red-400"
              data-testid="textarea-nonconformances"
            />
          </div>

          {/* Opportunities for Improvement */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1 text-amber-700">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              Opportunities for Improvement (OFI)
              <span className="text-xs text-muted-foreground font-normal">(one per line)</span>
            </Label>
            <Textarea
              placeholder={"Consider automating the defect logging step to reduce transcription errors\nVisual management boards could improve real-time KPI visibility"}
              value={form.opportunities}
              onChange={e => set("opportunities", e.target.value)}
              rows={3}
              className="border-amber-200 focus-visible:ring-amber-400"
              data-testid="textarea-opportunities"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave(form)} disabled={isPending} data-testid="button-save-process-notes">
              {isPending ? "Saving..." : "Save Process Notes"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Finding Dialog (Legacy — clause-by-clause) ─────────────────────────────────

function FindingDialog({ clause, clauseTitle, existing, onSave, onDelete, onClose, isPending }: {
  clause: string; clauseTitle: string; existing?: IsoAuditFinding;
  onSave: (data: any) => void; onDelete?: () => void; onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({
    id: existing?.id, clause, clauseTitle,
    findingType: existing?.findingType || "conform",
    description: existing?.description || "",
    evidence: existing?.evidence || "",
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Clause {clause} — {clauseTitle}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Finding Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {FINDING_TYPES.map(t => (
                <button key={t.value} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${form.findingType === t.value ? t.color + " ring-2 ring-offset-1 ring-current" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`} onClick={() => setForm(f => ({ ...f, findingType: t.value }))} data-testid={`button-finding-type-${t.value}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {form.findingType !== "not_audited" && (
            <>
              <div>
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea placeholder="Describe the finding..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} data-testid="textarea-finding-description" />
              </div>
              <div>
                <Label>Evidence <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input placeholder="Document reviewed, record number, person interviewed..." value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} data-testid="input-finding-evidence" />
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={() => onSave(form)} disabled={isPending} data-testid="button-save-finding">
              {isPending ? "Saving..." : "Save Finding"}
            </Button>
            {onDelete && <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onDelete} data-testid="button-delete-finding"><Trash2 className="w-4 h-4" /></Button>}
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Risk Assessment Dialog ─────────────────────────────────────────────────────

function RiskAssessmentDialog({ processName, processType, existing, onSave, onDelete, onClose, isPending }: {
  processName: string; processType: "COP" | "SOP" | "MOP"; existing?: AuditProcessSchedule;
  onSave: (data: any) => void; onDelete?: () => void; onClose: () => void; isPending: boolean;
}) {
  const defaults: Record<RiskKey, number> = {
    riskComplexity: existing?.riskComplexity || 2,
    riskCustomerImpact: existing?.riskCustomerImpact || 2,
    riskPreviousAudit: existing?.riskPreviousAudit || 2,
    riskPerformance: existing?.riskPerformance || 2,
    riskChangeFreq: existing?.riskChangeFreq || 2,
    riskComplaints: existing?.riskComplaints || 2,
  };

  const [scores, setScores] = useState<Record<RiskKey, number>>(defaults);
  const [lastAuditDate, setLastAuditDate] = useState(existing?.lastAuditDate ? new Date(existing.lastAuditDate).toISOString().slice(0, 10) : "");
  const [nextDateOverride, setNextDateOverride] = useState(existing?.nextAuditDate ? new Date(existing.nextAuditDate).toISOString().slice(0, 10) : "");
  const [auditorAssigned, setAuditorAssigned] = useState(existing?.auditorAssigned || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [consultantAudit, setConsultantAudit] = useState(existing?.consultantAudit ?? false);

  const total = calcTotalScore(scores);
  const freqKey = scoreToFreq(total);
  const freqCfg = FREQ_CONFIG[freqKey];
  const autoNext = calcNextDate(lastAuditDate || null, freqKey);

  const riskStatus = total <= 25 ? "IN CONTROL" : total <= 50 ? "NEEDS ATTENTION" : "NEEDS IMMEDIATE ATTENTION";
  const riskStatusColor = total <= 25 ? "text-green-700" : total <= 50 ? "text-amber-700" : "text-red-700";

  const handleSave = () => {
    onSave({
      ...(existing?.id ? { id: existing.id } : {}),
      processName, processType,
      ...scores,
      recommendedFrequency: freqKey,
      consultantAudit,
      lastAuditDate: lastAuditDate || null,
      nextAuditDate: nextDateOverride || autoNext,
      auditorAssigned: auditorAssigned || null,
      notes: notes || null,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Risk Assessment — {processName}
          </DialogTitle>
        </DialogHeader>

        {/* Live score summary */}
        <div className={`rounded-lg border p-4 ${freqCfg.rangeColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold uppercase tracking-wide ${riskStatusColor}`}>{riskStatus}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{freqCfg.sublabel}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-foreground leading-none">{total} <span className="text-sm font-normal text-muted-foreground">/60 pts</span></p>
              <Badge className={`text-sm border mt-1 ${freqCfg.badgeColor}`}>{freqCfg.label}</Badge>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>6 — All LOW</span>
              <span className="text-green-700 font-medium">≤25 = 3-Year</span>
              <span className="text-amber-700 font-medium">26-50 = 12-24 mo</span>
              <span className="text-red-700 font-medium">&gt;50 = 6-9 mo</span>
              <span>60 — All CRITICAL</span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 relative">
              <div className="absolute top-0 bottom-0 border-l-2 border-green-400 border-dashed" style={{ left: `${((25-6)/54)*100}%` }} />
              <div className="absolute top-0 bottom-0 border-l-2 border-amber-400 border-dashed" style={{ left: `${((50-6)/54)*100}%` }} />
              <div
                className={`h-3 rounded-full transition-all ${freqCfg.barColor}`}
                style={{ width: `${Math.min(100, Math.max(2, ((total - 6) / 54) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Consultant audit toggle */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
          <Checkbox
            id="consultant-audit"
            checked={consultantAudit}
            onCheckedChange={(v) => setConsultantAudit(!!v)}
            data-testid="checkbox-consultant-audit"
          />
          <div>
            <Label htmlFor="consultant-audit" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-gray-500" />Consultant Audit
            </Label>
            <p className="text-xs text-muted-foreground">Check if this process is to be audited by an external consultant (shown in grey on the schedule table).</p>
          </div>
        </div>

        {/* 6 Risk Criteria */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Risk Ranking — 6 Criteria (1–10 each)</p>
          {RISK_CRITERIA.map((criterion, idx) => {
            const currentScore = scores[criterion.key];
            const currentBand = getBandForScore(currentScore);
            return (
              <div key={criterion.key} className="border rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{idx + 1}. {criterion.label}</p>
                    <p className="text-xs text-muted-foreground">{criterion.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${currentBand.dot}`} />
                    <span className="text-sm font-bold text-foreground">{currentScore} pts</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {BANDS.map((band, bi) => (
                    <button
                      key={band.label}
                      onClick={() => setScores(prev => ({ ...prev, [criterion.key]: band.score }))}
                      className={`rounded-lg border p-2.5 text-left transition-all text-xs ${getBandForScore(currentScore) === band ? band.color.active : band.color.inactive}`}
                      data-testid={`button-band-${criterion.key}-${band.label}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${band.dot}`} />
                        <span className="font-bold">{band.label}</span>
                        <span className="text-muted-foreground ml-auto">{band.range}</span>
                      </div>
                      <p className="text-xs opacity-80 leading-snug">{criterion.bandDescs[bi]}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scheduling fields */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <Label>Last Audit Date</Label>
            <Input type="date" value={lastAuditDate} onChange={e => setLastAuditDate(e.target.value)} data-testid="input-last-audit-date" />
          </div>
          <div>
            <Label>
              Next Audit Date
              {lastAuditDate && <span className="text-muted-foreground font-normal text-xs ml-1">(auto: {autoNext})</span>}
            </Label>
            <Input type="date" value={nextDateOverride || autoNext} onChange={e => setNextDateOverride(e.target.value)} data-testid="input-next-audit-date" />
          </div>
          <div>
            <Label>Auditor Assigned <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Auditor name" value={auditorAssigned} onChange={e => setAuditorAssigned(e.target.value)} data-testid="input-auditor-assigned" />
          </div>
          <div>
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Any context or notes..." value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-schedule-notes" />
          </div>
        </div>

        {/* Reference reminder */}
        <div className="flex items-start gap-2 text-xs p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Scoring reference: </strong>
            Total 1–25 = In Control → 3-Year cycle &nbsp;|&nbsp;
            26–50 = Needs Attention → 12–24 months &nbsp;|&nbsp;
            &gt;50 = Needs Immediate Attention → 6–9 months
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isPending} data-testid="button-save-schedule">
            {isPending ? "Saving..." : existing ? "Update Assessment" : "Save Assessment"}
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Remove this assessment?")) onDelete(); }} data-testid="button-delete-schedule">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 9.2.2.3 Product Audit Dialog ─────────────────────────────────────────────

function ProductAuditDialog({
  existing, onSave, onDelete, onClose, isPending,
}: {
  existing?: IatfProductAudit;
  onSave: (data: any) => void;
  onDelete?: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [activeSection, setActiveSection] = useState<"info" | "checklist" | "findings">("info");
  const [auditDate, setAuditDate] = useState(existing?.auditDate || new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState(existing?.shift || "");
  const [auditor, setAuditor] = useState(existing?.auditor || "");
  const [partNumber, setPartNumber] = useState(existing?.partNumber || "");
  const [partName, setPartName] = useState(existing?.partName || "");
  const [lotNumber, setLotNumber] = useState(existing?.lotNumber || "");
  const [revisionLevel, setRevisionLevel] = useState(existing?.revisionLevel || "");
  const [quantitySampled, setQuantitySampled] = useState(existing?.quantitySampled?.toString() || "");
  const [customerName, setCustomerName] = useState(existing?.customerName || "");
  const [controlPlanRef, setControlPlanRef] = useState(existing?.controlPlanRef || "");
  const [result, setResult] = useState(existing?.result || "");
  const [checklistItems, setChecklistItems] = useState<ProductAuditChecklistItem[]>(
    existing?.checklistItems?.length ? (existing.checklistItems as ProductAuditChecklistItem[]) : makeDefaultProductChecklist()
  );
  const [findings, setFindings] = useState(existing?.findings || "");
  const [nonconformances, setNonconformances] = useState(existing?.nonconformances || "");
  const [disposition, setDisposition] = useState(existing?.disposition || "");
  const [correctiveActionRef, setCorrectiveActionRef] = useState(existing?.correctiveActionRef || "");
  const [managementNotified, setManagementNotified] = useState(existing?.managementNotified || false);
  const [notifiedBy, setNotifiedBy] = useState(existing?.notifiedBy || "");

  const categories = [...new Set(checklistItems.map(i => i.category))];
  const fails = checklistItems.filter(i => i.result === "fail").length;
  const passes = checklistItems.filter(i => i.result === "pass").length;
  const naCount = checklistItems.filter(i => i.result === "na").length;

  const updateItem = (id: string, field: "result" | "note", value: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    onSave({
      ...(existing?.id ? { id: existing.id } : {}),
      auditDate, shift, auditor, partNumber, partName, lotNumber, revisionLevel,
      quantitySampled: quantitySampled ? parseInt(quantitySampled) : null,
      customerName, controlPlanRef, result, checklistItems,
      findings, nonconformances, disposition, correctiveActionRef, managementNotified, notifiedBy,
    });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="px-6 pt-5 pb-0 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-primary" />
              {existing ? "Edit" : "New"} Product Audit
              <Badge className="text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200 ml-1">9.2.2.3</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 border-b mt-4 -mx-6 px-6">
            {(["info", "checklist", "findings"] as const).map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeSection === s ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                data-testid={`pa-tab-${s}`}>
                {s === "info" ? "Product Info" : s === "checklist" ? (<span>Checklist {fails > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{fails}</span>}</span>) : "Findings & Result"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {activeSection === "info" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Audit Date</Label><Input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} data-testid="input-pa-date" /></div>
                <div>
                  <Label className="text-xs">Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger data-testid="select-pa-shift"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Day","Afternoon","Night","All Shifts"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Auditor</Label><Input placeholder="Name of auditor" value={auditor} onChange={e => setAuditor(e.target.value)} data-testid="input-pa-auditor" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Part Number</Label><Input placeholder="e.g. CCI-4502-B" value={partNumber} onChange={e => setPartNumber(e.target.value)} data-testid="input-pa-partnum" /></div>
                <div><Label className="text-xs">Revision Level</Label><Input placeholder="e.g. Rev C" value={revisionLevel} onChange={e => setRevisionLevel(e.target.value)} data-testid="input-pa-rev" /></div>
              </div>
              <div><Label className="text-xs">Part / Product Name</Label><Input placeholder="e.g. Lubricant Base Oil 15W-40" value={partName} onChange={e => setPartName(e.target.value)} data-testid="input-pa-partname" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Lot / Batch Number</Label><Input placeholder="e.g. BL-2026-0052" value={lotNumber} onChange={e => setLotNumber(e.target.value)} data-testid="input-pa-lot" /></div>
                <div><Label className="text-xs">Qty Sampled</Label><Input type="number" min={1} placeholder="e.g. 5" value={quantitySampled} onChange={e => setQuantitySampled(e.target.value)} data-testid="input-pa-qty" /></div>
              </div>
              <div><Label className="text-xs">Customer Name <span className="text-muted-foreground">(optional)</span></Label><Input placeholder="e.g. Ford Motor Company" value={customerName} onChange={e => setCustomerName(e.target.value)} data-testid="input-pa-customer" /></div>
              <div><Label className="text-xs">Control Plan Reference <span className="text-muted-foreground">(optional)</span></Label><Input placeholder="e.g. CP-2026-01 Rev B" value={controlPlanRef} onChange={e => setControlPlanRef(e.target.value)} data-testid="input-pa-cp" /></div>
            </div>
          )}

          {activeSection === "checklist" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="text-green-700">{passes} Pass</span>
                <span className="text-red-700">{fails} Fail</span>
                <span className="text-gray-500">{naCount} N/A</span>
                <span className="text-gray-400 ml-auto">{checklistItems.length} items total</span>
              </div>
              {categories.map(cat => (
                <div key={cat} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</div>
                  <div className="divide-y">
                    {checklistItems.filter(i => i.category === cat).map(item => (
                      <div key={item.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-foreground leading-relaxed flex-1">{item.item}</p>
                          <div className="flex gap-1 shrink-0">
                            {PRODUCT_CHECKLIST_RESULT_OPTS.map(opt => (
                              <button key={opt.value} onClick={() => updateItem(item.id, "result", opt.value)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${item.result === opt.value ? opt.cls : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
                                data-testid={`pa-item-${item.id}-${opt.value}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {(item.result === "fail" || item.note) && (
                          <Input className="text-xs h-7" placeholder="Note / evidence..." value={item.note} onChange={e => updateItem(item.id, "note", e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "findings" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Overall Result</Label>
                <div className="flex gap-2 mt-1.5">
                  {Object.entries(PRODUCT_AUDIT_RESULT_CFG).map(([val, cfg]) => (
                    <button key={val} onClick={() => setResult(val)}
                      className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${result === val ? cfg.cls : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
                      data-testid={`pa-result-${val}`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><Label className="text-xs">Findings / Observations</Label><Textarea rows={3} placeholder="Observations, positive findings, or areas of concern..." value={findings} onChange={e => setFindings(e.target.value)} data-testid="input-pa-findings" /></div>
              <div><Label className="text-xs">Nonconformances</Label><Textarea rows={3} placeholder="Describe any nonconformances found..." value={nonconformances} onChange={e => setNonconformances(e.target.value)} data-testid="input-pa-ncs" /></div>
              <div>
                <Label className="text-xs">Product Disposition</Label>
                <Select value={disposition} onValueChange={setDisposition}>
                  <SelectTrigger data-testid="select-pa-disposition"><SelectValue placeholder="Select disposition..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">Accept — Released to Next Operation</SelectItem>
                    <SelectItem value="hold">Hold — Pending Disposition</SelectItem>
                    <SelectItem value="rework">Rework Required</SelectItem>
                    <SelectItem value="scrap">Scrap</SelectItem>
                    <SelectItem value="conditional">Conditional Release</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Corrective Action Reference <span className="text-muted-foreground">(if applicable)</span></Label><Input placeholder="e.g. CAR-2026-008" value={correctiveActionRef} onChange={e => setCorrectiveActionRef(e.target.value)} data-testid="input-pa-car" /></div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
                <Checkbox id="pa-mgmt" checked={managementNotified} onCheckedChange={v => setManagementNotified(!!v)} data-testid="checkbox-pa-mgmt" />
                <div>
                  <Label htmlFor="pa-mgmt" className="text-sm font-semibold cursor-pointer flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-600" />Management Notified of Results</Label>
                  <p className="text-xs text-muted-foreground">IATF 9.2.2.3 requires audit results be communicated to responsible management.</p>
                </div>
              </div>
              {managementNotified && (
                <div><Label className="text-xs">Notified By</Label><Input placeholder="Name and role of person who notified management" value={notifiedBy} onChange={e => setNotifiedBy(e.target.value)} data-testid="input-pa-notified-by" /></div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t shrink-0">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isPending} data-testid="button-save-product-audit">
            {isPending ? "Saving..." : existing ? "Update Audit" : "Save Audit"}
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Delete this product audit record?")) onDelete(); }} data-testid="button-delete-product-audit">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 9.2.2.4 Manufacturing Process Audit Dialog ───────────────────────────────

function MfgProcessAuditDialog({
  processes, existing, onSave, onDelete, onClose, isPending,
}: {
  processes: ProcessEntry[];
  existing?: IatfMfgProcessAudit;
  onSave: (data: any) => void;
  onDelete?: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [activeSection, setActiveSection] = useState<"info" | "turtle" | "checklist" | "findings">("info");
  const [auditDate, setAuditDate] = useState(existing?.auditDate || new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState(existing?.shift || "");
  const [processName, setProcessName] = useState(existing?.processName || "");
  const [workstation, setWorkstation] = useState(existing?.workstation || "");
  const [auditor, setAuditor] = useState(existing?.auditor || "");
  const [controlPlanRef, setControlPlanRef] = useState(existing?.controlPlanRef || "");
  const [productionOrder, setProductionOrder] = useState(existing?.productionOrder || "");
  const [partNumber, setPartNumber] = useState(existing?.partNumber || "");
  const [result, setResult] = useState(existing?.result || "");
  const [turtleInputs, setTurtleInputs] = useState(existing?.turtleInputs || "");
  const [turtleOutputs, setTurtleOutputs] = useState(existing?.turtleOutputs || "");
  const [turtleEquipment, setTurtleEquipment] = useState(existing?.turtleEquipment || "");
  const [turtlePersonnel, setTurtlePersonnel] = useState(existing?.turtlePersonnel || "");
  const [turtleMethods, setTurtleMethods] = useState(existing?.turtleMethods || "");
  const [turtleMeasures, setTurtleMeasures] = useState(existing?.turtleMeasures || "");
  const [turtleEnvironment, setTurtleEnvironment] = useState(existing?.turtleEnvironment || "");
  const [checklistItems, setChecklistItems] = useState<MfgProcessAuditChecklistItem[]>(
    existing?.checklistItems?.length ? (existing.checklistItems as MfgProcessAuditChecklistItem[]) : makeDefaultProcessChecklist()
  );
  const [findings, setFindings] = useState(existing?.findings || "");
  const [nonconformances, setNonconformances] = useState(existing?.nonconformances || "");
  const [correctiveActionRef, setCorrectiveActionRef] = useState(existing?.correctiveActionRef || "");
  const [managementNotified, setManagementNotified] = useState(existing?.managementNotified || false);
  const [notifiedBy, setNotifiedBy] = useState(existing?.notifiedBy || "");

  const categories = [...new Set(checklistItems.map(i => i.category))];
  const nos = checklistItems.filter(i => i.result === "no").length;
  const yeses = checklistItems.filter(i => i.result === "yes").length;
  const partials = checklistItems.filter(i => i.result === "partial").length;

  const updateItem = (id: string, field: "result" | "note", value: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    onSave({
      ...(existing?.id ? { id: existing.id } : {}),
      auditDate, shift, processName, workstation, auditor, controlPlanRef, productionOrder, partNumber, result,
      turtleInputs, turtleOutputs, turtleEquipment, turtlePersonnel, turtleMethods, turtleMeasures, turtleEnvironment,
      checklistItems, findings, nonconformances, correctiveActionRef, managementNotified, notifiedBy,
    });
  };

  const TURTLE_FIELDS = [
    { key: "inputs",      label: "Inputs",          icon: "→", placeholder: "Materials, information, orders received by this process", value: turtleInputs,      set: setTurtleInputs },
    { key: "outputs",     label: "Outputs",         icon: "→", placeholder: "Products, records, decisions produced by this process",  value: turtleOutputs,     set: setTurtleOutputs },
    { key: "equipment",   label: "Equipment",       icon: "⚙", placeholder: "Machines, tools, fixtures, software used",             value: turtleEquipment,   set: setTurtleEquipment },
    { key: "personnel",   label: "Personnel",       icon: "👤", placeholder: "Roles, qualifications, competency requirements",       value: turtlePersonnel,   set: setTurtlePersonnel },
    { key: "methods",     label: "Methods (How)",   icon: "📋", placeholder: "WIs, SOPs, standards, procedures, control plan steps",  value: turtleMethods,     set: setTurtleMethods },
    { key: "measures",    label: "Measures (KPIs)", icon: "📊", placeholder: "Performance measures, process KPIs, targets",          value: turtleMeasures,    set: setTurtleMeasures },
    { key: "environment", label: "Environment",     icon: "🏭", placeholder: "Temperature, cleanliness, safety requirements, 5S",   value: turtleEnvironment, set: setTurtleEnvironment },
  ] as const;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="px-6 pt-5 pb-0 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Factory className="w-5 h-5 text-primary" />
              {existing ? "Edit" : "New"} Manufacturing Process Audit
              <Badge className="text-[10px] font-bold border bg-orange-50 text-orange-700 border-orange-200 ml-1">9.2.2.4</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 border-b mt-4 -mx-6 px-6">
            {(["info", "turtle", "checklist", "findings"] as const).map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeSection === s ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                data-testid={`mpa-tab-${s}`}>
                {s === "info" ? "Process Info" : s === "turtle" ? "Turtle Diagram" : s === "checklist" ? (<span>Checklist {nos > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{nos}</span>}</span>) : "Findings & Result"}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {activeSection === "info" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Audit Date</Label><Input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} data-testid="input-mpa-date" /></div>
                <div>
                  <Label className="text-xs">Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger data-testid="select-mpa-shift"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Day","Afternoon","Night","All Shifts"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Process Being Audited</Label>
                <Select value={processName} onValueChange={setProcessName}>
                  <SelectTrigger data-testid="select-mpa-process"><SelectValue placeholder="Select process..." /></SelectTrigger>
                  <SelectContent>
                    {processes.filter(p => p.row === "COP" || (p as any).row === "CORE").map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                    {processes.filter(p => p.row !== "COP" && (p as any).row !== "CORE" && p.row !== "MOP" && (p as any).row !== "MANAGEMENT").map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!processName && (
                  <Input className="mt-1.5" placeholder="Or type process name manually..." value={processName} onChange={e => setProcessName(e.target.value)} data-testid="input-mpa-process-manual" />
                )}
              </div>
              <div><Label className="text-xs">Workstation / Cell / Line</Label><Input placeholder="e.g. Blending Reactor #2 / Filling Line A" value={workstation} onChange={e => setWorkstation(e.target.value)} data-testid="input-mpa-workstation" /></div>
              <div><Label className="text-xs">Auditor</Label><Input placeholder="Name of auditor" value={auditor} onChange={e => setAuditor(e.target.value)} data-testid="input-mpa-auditor" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Control Plan Reference</Label><Input placeholder="e.g. CP-2026-01 Rev B" value={controlPlanRef} onChange={e => setControlPlanRef(e.target.value)} data-testid="input-mpa-cp" /></div>
                <div><Label className="text-xs">Production Order</Label><Input placeholder="e.g. PO-2026-0144" value={productionOrder} onChange={e => setProductionOrder(e.target.value)} data-testid="input-mpa-order" /></div>
              </div>
              <div><Label className="text-xs">Part / Product Number Being Produced</Label><Input placeholder="e.g. CCI-4502-B" value={partNumber} onChange={e => setPartNumber(e.target.value)} data-testid="input-mpa-partnum" /></div>
            </div>
          )}

          {activeSection === "turtle" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-800">
                <CheckSquare className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Document the turtle diagram elements for this manufacturing process. These form the basis of the process audit assessment per the process approach framework.</span>
              </div>
              {TURTLE_FIELDS.map(f => (
                <div key={f.key}>
                  <Label className="text-xs font-semibold">{f.label}</Label>
                  <Textarea
                    rows={2}
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    className="text-sm mt-1"
                    data-testid={`input-mpa-turtle-${f.key}`}
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === "checklist" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="text-green-700">{yeses} Yes</span>
                <span className="text-red-700">{nos} No</span>
                <span className="text-amber-700">{partials} Partial</span>
                <span className="text-gray-400 ml-auto">{checklistItems.length} questions</span>
              </div>
              {categories.map(cat => (
                <div key={cat} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</div>
                  <div className="divide-y">
                    {checklistItems.filter(i => i.category === cat).map(item => (
                      <div key={item.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-foreground leading-relaxed flex-1">{item.question}</p>
                          <div className="flex gap-1 shrink-0">
                            {PROCESS_CHECKLIST_RESULT_OPTS.map(opt => (
                              <button key={opt.value} onClick={() => updateItem(item.id, "result", opt.value)}
                                className={`px-2 py-1 text-xs font-semibold rounded border transition-colors ${item.result === opt.value ? opt.cls : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
                                data-testid={`mpa-item-${item.id}-${opt.value}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {(item.result === "no" || item.result === "partial" || item.note) && (
                          <Input className="text-xs h-7" placeholder="Note / evidence / action needed..." value={item.note} onChange={e => updateItem(item.id, "note", e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "findings" && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Overall Audit Result</Label>
                <div className="flex gap-2 mt-1.5">
                  {Object.entries(PROCESS_AUDIT_RESULT_CFG).map(([val, cfg]) => (
                    <button key={val} onClick={() => setResult(val)}
                      className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${result === val ? cfg.cls : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
                      data-testid={`mpa-result-${val}`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div><Label className="text-xs">Findings / Observations</Label><Textarea rows={3} placeholder="Summarize what was observed during the audit..." value={findings} onChange={e => setFindings(e.target.value)} data-testid="input-mpa-findings" /></div>
              <div><Label className="text-xs">Nonconformances</Label><Textarea rows={3} placeholder="Detail any nonconformances against the control plan or requirements..." value={nonconformances} onChange={e => setNonconformances(e.target.value)} data-testid="input-mpa-ncs" /></div>
              <div><Label className="text-xs">Corrective Action Reference <span className="text-muted-foreground">(if applicable)</span></Label><Input placeholder="e.g. CAR-2026-009" value={correctiveActionRef} onChange={e => setCorrectiveActionRef(e.target.value)} data-testid="input-mpa-car" /></div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
                <Checkbox id="mpa-mgmt" checked={managementNotified} onCheckedChange={v => setManagementNotified(!!v)} data-testid="checkbox-mpa-mgmt" />
                <div>
                  <Label htmlFor="mpa-mgmt" className="text-sm font-semibold cursor-pointer flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-600" />Management Notified of Results</Label>
                  <p className="text-xs text-muted-foreground">IATF 9.2.2.4 requires results communicated to responsible management for each process audit.</p>
                </div>
              </div>
              {managementNotified && (
                <div><Label className="text-xs">Notified By</Label><Input placeholder="Name and role of person who notified management" value={notifiedBy} onChange={e => setNotifiedBy(e.target.value)} data-testid="input-mpa-notified-by" /></div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 py-4 border-t shrink-0">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isPending} data-testid="button-save-process-audit">
            {isPending ? "Saving..." : existing ? "Update Audit" : "Save Audit"}
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Delete this process audit record?")) onDelete(); }} data-testid="button-delete-process-audit">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── IATF Audit Schedule Dialog ────────────────────────────────────────────────
function IatfScheduleDialog({
  existing,
  defaultType,
  processes,
  onSave,
  onDelete,
  onClose,
  isPending,
}: {
  existing?: IatfAuditSchedule;
  defaultType?: "product" | "process";
  processes: ProcessEntry[];
  onSave: (data: any) => void;
  onDelete?: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const auditType = existing?.auditType || defaultType || "product";
  const [form, setForm] = useState({
    auditType,
    title: existing?.title || "",
    partNumber: existing?.partNumber || "",
    processName: existing?.processName || "",
    workstation: existing?.workstation || "",
    auditorAssigned: existing?.auditorAssigned || "",
    frequency: existing?.frequency || "monthly",
    nextDueDate: existing?.nextDueDate || "",
    lastCompletedDate: existing?.lastCompletedDate || "",
    status: existing?.status || "active",
    notes: existing?.notes || "",
  });
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(existing ? { id: existing.id, ...form } : form);
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {existing ? "Edit" : "Add"} Audit Schedule
            <Badge className={`text-[10px] font-bold border ml-1 ${auditType === "product" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
              {auditType === "product" ? "9.2.2.3 Product" : "9.2.2.4 Process"}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-1 py-2 max-h-[65vh] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">{auditType === "product" ? "Part / Product Name *" : "Process Name *"}</Label>
            {auditType === "process" && processes.length > 0 ? (
              <Select value={form.title} onValueChange={v => { set("title", v); set("processName", v); }}>
                <SelectTrigger data-testid="select-schedule-title"><SelectValue placeholder="Select process…" /></SelectTrigger>
                <SelectContent>{processes.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input placeholder={auditType === "product" ? "e.g. Polyurethane Coating, CCI-2240" : "e.g. Chemical Blending"} value={form.title} onChange={e => set("title", e.target.value)} data-testid="input-schedule-title" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {auditType === "product" && (
              <div className="space-y-1">
                <Label className="text-xs">Part Number</Label>
                <Input placeholder="e.g. CCI-2240" value={form.partNumber} onChange={e => set("partNumber", e.target.value)} data-testid="input-schedule-part-number" />
              </div>
            )}
            {auditType === "process" && (
              <div className="space-y-1">
                <Label className="text-xs">Workstation / Line</Label>
                <Input placeholder="e.g. Blending Bay 1" value={form.workstation} onChange={e => set("workstation", e.target.value)} data-testid="input-schedule-workstation" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Auditor Assigned</Label>
              <Input placeholder="Name" value={form.auditorAssigned} onChange={e => set("auditorAssigned", e.target.value)} data-testid="input-schedule-auditor" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Frequency *</Label>
              <Select value={form.frequency} onValueChange={v => set("frequency", v)}>
                <SelectTrigger data-testid="select-schedule-frequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="per_shift">Per Shift</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger data-testid="select-schedule-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Next Due Date</Label>
              <Input type="date" value={form.nextDueDate} onChange={e => set("nextDueDate", e.target.value)} data-testid="input-schedule-next-due" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Completed</Label>
              <Input type="date" value={form.lastCompletedDate} onChange={e => set("lastCompletedDate", e.target.value)} data-testid="input-schedule-last-completed" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea placeholder="Any special instructions, scope notes, or reminders…" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} data-testid="textarea-schedule-notes" />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isPending || !form.title.trim()} data-testid="button-save-iatf-schedule">
            {isPending ? "Saving…" : existing ? "Update Schedule" : "Add to Schedule"}
          </Button>
          {onDelete && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (window.confirm("Remove this schedule entry?")) onDelete!(); }} data-testid="button-delete-iatf-schedule">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
