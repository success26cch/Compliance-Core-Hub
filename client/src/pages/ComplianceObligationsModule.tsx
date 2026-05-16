import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, XCircle,
  Clock, FileText, ChevronDown, ChevronUp, BookOpen, Shield,
  Download, Upload, Filter, Search, ClipboardCheck, Sparkles, MapPin,
  ArrowRight, Leaf, Scale, HelpCircle, FlaskConical, Database,
  CalendarDays, AlertCircle, Loader2,
} from "lucide-react";
import type { IsoComplianceObligation, IsoComplianceEvaluation, IsoProject } from "@shared/schema";
import ComplianceApplicabilityDialog from "@/components/iso/ComplianceApplicabilityDialog";
import ComplianceEvaluationWizard from "@/components/iso/ComplianceEvaluationWizard";
import {
  EvidenceRepositoryTab,
} from "./MdRegulatoryOverlay";

/* ─── Constants ─────────────────────────────────────────── */
const ASPECT_CATEGORIES = [
  "Material Use/Exposure",
  "Solid & Liquid Waste",
  "Oil Management & Spillage",
  "Air Quality",
  "Water Quality & Spillage Prevention",
  "Stormwater",
  "Chemical Reporting",
  "Emergency Planning",
  "Hazardous Materials Transport",
  "Health and Safety Requirements",
  "Other Applicable Requirements",
  "Energy",
  "Land/Soil Contamination",
  "Other",
];

const JURISDICTION_OPTIONS = [
  { value: "F", label: "Federal (F)" },
  { value: "S", label: "State (S)" },
  { value: "L", label: "Local (L)" },
  { value: "F/S", label: "Federal & State (F/S)" },
  { value: "F/S/L", label: "Federal, State & Local (F/S/L)" },
  { value: "Corporate", label: "Corporate" },
  { value: "Voluntary", label: "Voluntary" },
];

const STATUS_OPTIONS = [
  { value: "compliant", label: "Compliant", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "non_compliant", label: "Non-Compliant", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300" },
  { value: "not_applicable", label: "N/A", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400" },
  { value: "under_review", label: "Under Review", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300" },
];

const EVAL_STATUS_OPTIONS = [
  { value: "compliant", label: "Compliant", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "non_compliant", label: "Non-Compliant", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300" },
  { value: "conditional", label: "Conditional", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "not_applicable", label: "Not Applicable", color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400" },
];

const STANDARD_OPTIONS = [
  { value: "ISO 14001",       label: "ISO 14001 — EMS",               color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300" },
  { value: "ISO 45001",       label: "ISO 45001 — OH&S",              color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300" },
  { value: "Both",            label: "Both EMS & OH&S",               color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300" },
  { value: "ISO 13485",       label: "ISO 13485 — Medical Devices",   color: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300" },
  { value: "FDA 21 CFR 820",  label: "FDA 21 CFR 820 — QSR",          color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300" },
  { value: "EU MDR 2017/745", label: "EU MDR 2017/745",               color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:text-fuchsia-300" },
];

/* ─── Federal starter library (from examples) ─────────────── */
const FEDERAL_STARTER_LIBRARY: Omit<IsoComplianceObligation, "id" | "userId" | "isoProjectId" | "createdAt" | "updatedAt">[] = [
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Universal Waste Management",
    citationSource: "40 CFR Part 273",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Aerosol cans, antifreeze, batteries, consumer electronics, mercury-containing devices, lamps, pesticides, and pharmaceuticals must be handled, labeled, and disposed of as Universal Waste.",
    facilityAction: "Label and properly dispose of Universal Waste. Ensure waste is shipped at least yearly.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Disposal manifests, waste shipment records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Parts Cleaners — Flammable & Combustible Liquids",
    citationSource: "40 CFR 262.30–.34",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Flammable and combustible liquids must be handled in an approved manner, including parts cleaners.",
    facilityAction: "Ensure parts washer materials are handled in the appropriate manner.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Inspection logs, handling procedures",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "SDS / Hazard Communication (HazCom)",
    citationSource: "29 CFR 1910.1200",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities must keep Safety Data Sheets (SDS) for every hazardous material used on site and ensure employees have access.",
    facilityAction: "Maintain SDS binder/digital system accessible to all employees for all hazardous chemicals used on site.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual review",
    recordsToMaintain: "SDS file / electronic system, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Hazardous Substances Notification (Reportable Quantities)",
    citationSource: "40 CFR Part 302",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Designation and determination of reportable quantities; notification of EPA required if spills exceed threshold quantities of listed chemicals.",
    facilityAction: "Review chemical inventory to determine if any listed chemicals are used above RQ. Notify EPA immediately if a release exceeds the RQ.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Chemical inventory, spill/release notifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Emergency Planning",
    requirementName: "Emergency Planning & Notification — Extremely Hazardous Substances (EHS)",
    citationSource: "40 CFR Part 355",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "SARA Title III — Emergency planning and notification requirements for facilities handling Extremely Hazardous Substances (EHS) above Threshold Planning Quantities (TPQ).",
    facilityAction: "Determine if any EHS chemicals are present above TPQ. If yes, notify State Emergency Response Commission (SERC) and Local Emergency Planning Committee (LEPC). Participate in local emergency planning.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual",
    recordsToMaintain: "EHS inventory, SERC/LEPC notification records, emergency plan",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "Toxic Chemical Release Reporting — Form R (TRI)",
    citationSource: "40 CFR Part 372",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "SARA Title III, Section 313 — Community Right to Know. Companies required to submit Form R if they import, manufacture ≥25,000 lbs, or 'otherwise use' ≥10,000 lbs of a listed toxic chemical during the year.",
    facilityAction: "Review chemical usage annually. Submit Toxic Chemical Release Form (Form R) to EPA/state agency by July 1st annually for any listed chemicals that exceed thresholds.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (by July 1)",
    recordsToMaintain: "Form R submissions, chemical usage records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "Community Right-To-Know — Tier II Chemical Inventory",
    citationSource: "40 CFR Part 370",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "SARA Title III — Facilities must submit Tier II chemical inventory forms if a chemical is subject to OSHA HazCom SDS requirements and is stored in quantities greater than the Reporting Quantity (RQ) at any time during the year.",
    facilityAction: "Submit Tier II Chemical Inventory Form to State Emergency Response Commission by March 1st annually for all applicable chemicals.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (by March 1)",
    recordsToMaintain: "Tier II submission, chemical inventory records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "PCB-Containing/Contaminated Equipment",
    citationSource: "40 CFR Part 761",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Regulates use, marking, storage, and disposal of equipment and materials containing or contaminated with polychlorinated biphenyls (PCBs).",
    facilityAction: "Identify all PCB-containing equipment on site (e.g., old capacitors, transformers). Label and manage per regulation.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "PCB equipment inventory, disposal records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Review equipment inventory for legacy PCB-containing items.",
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Asbestos-Containing Materials (ACM)",
    citationSource: "40 CFR Part 763; 29 CFR 1910.1001",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Regulates use, exposure limits, abatement, and disposal of asbestos-containing materials in the workplace and during renovation/demolition.",
    facilityAction: "Conduct ACM survey of facility. If ACM present, implement O&M program. Notify regulators before any renovation or demolition affecting ACM.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "ACM survey report, O&M plan, abatement records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "RCRA — Hazardous Waste Management (General)",
    citationSource: "40 CFR Part 260",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Resource Conservation and Recovery Act establishes regulations and permit requirements for hazardous waste generation, liquid industrial waste, solid waste material management, and medical waste.",
    facilityAction: "Identify and classify all waste streams. Maintain waste characterizations or letters of waste acceptance from TSDFs.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Waste characterization records, generator status documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "RCRA — Identification and Listing of Hazardous Waste",
    citationSource: "40 CFR Part 261",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Establishes criteria for determining if a solid waste is a hazardous waste (listed wastes: F, K, P, U; characteristic wastes: ignitability, corrosivity, reactivity, toxicity).",
    facilityAction: "Identify and classify all waste streams. Maintain waste characterizations. Manifest hazardous and liquid industrial waste. Retain manifest first and second copies for at least 3 years.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Waste manifests (3-year retention), waste characterization letters from TSDFs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "RCRA — Standards for Generators of Hazardous Waste",
    citationSource: "40 CFR Part 262",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Establishes requirements for hazardous waste generators based on generator status (LQG, SQG, VSQG) including storage time limits, labeling, training, and emergency procedures.",
    facilityAction: "Determine generator status. Provide annual RCRA training to personnel managing hazardous waste. Provide DOT HM126F training every 3 years to personnel signing hazardous waste manifests.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual training",
    recordsToMaintain: "RCRA training records, contingency plan, emergency coordinator designation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Land Disposal Restrictions (LDR)",
    citationSource: "40 CFR Part 268",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Prohibits the land disposal of certain liquid waste products and requires treatment to meet LDR standards before disposal.",
    facilityAction: "Maintain documentation of LDR determination for each hazardous waste stream generated.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "LDR determination documentation per waste stream",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Management of Used Oil",
    citationSource: "40 CFR Part 279",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Establishes a management system for used oil including storage, labeling, record keeping, and recycling/disposal requirements.",
    facilityAction: "Label all used oil containers as 'Used Oil'. Store in proper containers. Use registered used oil hauler for disposal/recycling.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Used oil storage logs, hauler invoices",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "Clean Air Act — Air Emissions Inventory & Permitting",
    citationSource: "42 U.S.C. Chapter 85; State Air Permit",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Requires facilities to determine emission levels from each source, obtain air permits if thresholds are exceeded, and maintain monitoring records. Covers HAPs (<10 lbs/day threshold), VOCs, and other regulated pollutants.",
    facilityAction: "Prepare emissions inventory for all emission sources (welding, painting, degreasers, etc.). Obtain state air permit if required. Monitor and document emissions from permitted sources.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual or as required by state",
    recordsToMaintain: "Emissions inventory, air permit, monitoring records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "CFC / Refrigerant Management",
    citationSource: "40 CFR Part 82",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Section 608 of the Clean Air Act — Regulates the use, recovery, and recycling of ozone-depleting refrigerants. Applies to facilities with refrigerant-containing equipment ≥50 lbs.",
    facilityAction: "Maintain inventory of CFC-containing equipment. Maintain service records. Use EPA-certified technicians for servicing.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Equipment inventory, service/maintenance records, refrigerant purchase/recovery logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Stormwater",
    requirementName: "NPDES Stormwater Permit — Industrial Stormwater",
    citationSource: "40 CFR Part 122; State NPDES General Permit",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Industrial facilities in certain SIC codes must obtain NPDES stormwater permit coverage, develop a Stormwater Pollution Prevention Plan (SWPPP), and conduct regular inspections and monitoring.",
    facilityAction: "Determine if facility SIC code requires NPDES permit. If yes, obtain permit coverage, develop SWPPP, conduct quarterly visual monitoring, and annual discharge sampling as required.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "5 years (general permit)",
    recordsToMaintain: "NPDES permit, SWPPP, inspection records, monitoring results",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Hazardous Materials Transport",
    requirementName: "DOT Hazardous Materials Transportation",
    citationSource: "49 CFR Parts 171–180",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Regulates the labeling, packaging, documentation, and training requirements for shipping hazardous materials via any mode of transportation.",
    facilityAction: "Maintain DOT HazMat Employee training (initial + 3-year recurrent). Ensure proper classification, packaging, marking, labeling, placarding, and documentation on all inbound and outbound hazmat shipments.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "3-year training recurrence",
    recordsToMaintain: "HazMat employee training records, shipping papers",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  // ── Air Quality ──────────────────────────────────────────────────────────
  {
    aspectCategory: "Air Quality",
    requirementName: "Clean Air Act — Title V Major Source Operating Permit",
    citationSource: "40 CFR Part 70; Clean Air Act Title V",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Facilities that emit ≥100 tons/year of any regulated air pollutant, ≥10 tons/year of any single HAP, or ≥25 tons/year of combined HAPs are classified as 'major sources' and must obtain a Title V Operating Permit. Permit consolidates all applicable Clean Air Act requirements into a single, federally enforceable document.",
    facilityAction: "Calculate annual emissions for all regulated pollutants. If major source thresholds are met, apply for Title V permit through the state agency. Maintain compliance with all permit conditions, conduct required monitoring, and submit semi-annual and annual compliance certifications.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "5 years",
    recordsToMaintain: "Title V permit, annual compliance certifications, semi-annual monitoring reports, emissions records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Threshold check: ≥100 tpy any regulated pollutant; ≥10 tpy single HAP; ≥25 tpy total HAPs. Determine applicability before applying.",
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "NESHAP / MACT Standards — Area/Major Source Categories",
    citationSource: "40 CFR Part 63",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "National Emission Standards for Hazardous Air Pollutants (NESHAP) / Maximum Achievable Control Technology (MACT) standards apply to specific source categories including surface coating, degreasing (halogenated solvents), plating/polishing, welding, industrial cleaning, printing, and other manufacturing processes. Each applicable subpart specifies emission limits, work practice standards, monitoring, and recordkeeping.",
    facilityAction: "Identify all processes and determine which NESHAP/MACT subparts apply (e.g., Part 63 Subpart XXXXXX for surface coating, Subpart T for halogenated solvent degreasing, Subpart XXXXXX for plating/polishing). Conduct initial notification, compliance demonstration, and ongoing monitoring per applicable subpart.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Ongoing monitoring per subpart",
    recordsToMaintain: "Initial notification, compliance certifications, monitoring records, maintenance logs, SSM (startup/shutdown/malfunction) records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Common manufacturing subparts: Subpart T (halogenated solvents), Subpart KKKKKK (area source metal fabrication), Subpart MMMMMM (area source acrylic/epoxy painting). Identify all applicable subparts.",
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "New Source Performance Standards (NSPS)",
    citationSource: "40 CFR Part 60",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "NSPS establish emission limits for new or significantly modified stationary sources in specified industrial categories. Standards vary by process type (e.g., boilers, storage tanks, surface coating, metal degreasing, incinerators). NSPS become part of air permit conditions.",
    facilityAction: "Determine if any emission sources at the facility are subject to NSPS by reviewing applicable subparts for the facility's SIC code and processes. Comply with applicable subpart standards. Notify EPA within 180 days before start of construction/modification.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Ongoing — per applicable subpart",
    recordsToMaintain: "NSPS applicability determination, initial notifications, performance test records, compliance monitoring logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Review 40 CFR Part 60 for subparts applicable to facility processes. Common: Subpart Dc (small boilers), Subpart VVa (equipment leaks — synthetic organics), Subpart Kb (volatile organic storage tanks).",
  },
  // ── Water ────────────────────────────────────────────────────────────────
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "NPDES — Industrial Process/Contact Wastewater Discharge Permit",
    citationSource: "40 CFR Part 122; Clean Water Act 402",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Facilities that discharge process wastewater, cooling water, or other industrial wastewater directly to surface waters (rivers, streams, lakes) must obtain an NPDES permit. Permit specifies effluent limits, monitoring, and reporting requirements.",
    facilityAction: "Determine if facility has any direct discharges to surface waters. If yes, obtain NPDES individual or general permit. Monitor discharges per permit conditions. Submit monthly Discharge Monitoring Reports (DMR) as required.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "5 years",
    recordsToMaintain: "NPDES permit, discharge monitoring reports (DMR), lab analysis results, flow records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Separate from stormwater NPDES. Applies to any process water, cooling water, or washwater discharged directly to a waterway — not the municipal sewer.",
  },
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "Industrial Pretreatment Program — POTW/Sewer Discharge",
    citationSource: "40 CFR Part 403; Clean Water Act 307(b)",
    jurisdictionLevel: "F/S/L",
    state: null, county: null,
    descriptionOfRequirement: "Industrial facilities discharging wastewater to a Publicly Owned Treatment Works (POTW/municipal sewer) must comply with National Pretreatment Standards (general and categorical) and local limits set by the POTW. Categorical standards apply to specific industries (e.g., metal finishing, electroplating, printed circuit boards). Local limits may impose more stringent requirements.",
    facilityAction: "Contact local POTW/sewer authority to determine applicable categorical pretreatment standards and local limits for facility processes. Obtain local industrial discharge permit if required. Monitor wastewater before discharge. Submit periodic reports to POTW.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Per local POTW — typically 1–5 years",
    recordsToMaintain: "Industrial pretreatment permit, wastewater monitoring results, discharge reports to POTW, compliance schedules",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Check if facility's processes (metal finishing, painting, coolant use) trigger categorical pretreatment standards under 40 CFR Part 433, 413, or 433. Contact local POTW for local limits.",
  },
  {
    aspectCategory: "Stormwater",
    requirementName: "NPDES Construction Stormwater General Permit (CGP)",
    citationSource: "40 CFR Part 122.26; EPA CGP / State Equivalent",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Construction activities disturbing ≥1 acre (or part of a larger common plan of development) must obtain NPDES stormwater permit coverage before ground disturbance begins. Requires a Stormwater Pollution Prevention Plan (SWPPP) and installation of Best Management Practices (BMPs) for erosion and sediment control.",
    facilityAction: "Prior to any construction/site disturbance ≥1 acre, submit Notice of Intent (NOI) for construction stormwater permit coverage. Develop project-specific SWPPP. Conduct required site inspections. Submit Notice of Termination (NOT) within 30 days of site stabilization.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Per construction project (NOI/NOT per project)",
    recordsToMaintain: "Construction NPDES permit / NOI acknowledgement, SWPPP, inspection logs, NOT submittal",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Triggered when site expansion, new construction, or major grading activities disturb ≥1 acre. Obtain permit coverage before breaking ground.",
  },
  {
    aspectCategory: "Oil Management & Spillage",
    requirementName: "Oil Spill Prevention, Control & Countermeasure (SPCC) Plan",
    citationSource: "40 CFR Part 112; Clean Water Act 311",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities with aggregate aboveground oil storage capacity >1,320 gallons (or a single underground storage tank >42,000 gallons) must prepare and implement a Spill Prevention, Control and Countermeasure (SPCC) Plan to prevent oil discharges to navigable waters. Applies to petroleum, lubricating oil, hydraulic fluid, coolants, and other oil-based products. Qualified Facility SPCC plans (≤10,000 gal total, ≤1,320 gal largest single container) may be self-certified.",
    facilityAction: "Conduct oil storage inventory (tanks, totes, drums, transformers, hydraulic systems, lube skids). Calculate aggregate aboveground oil storage. If >1,320 gal, prepare SPCC Plan. Plan must be PE-certified unless Qualified Facility status. Implement secondary containment for all containers. Conduct annual inspections and 5-year plan review.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "5-year review; amend within 6 months of facility changes",
    recordsToMaintain: "SPCC Plan (PE-certified or self-certified), oil storage inventory, inspection logs, secondary containment inspection records, spill response records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Threshold: aggregate aboveground oil storage >1,320 gal total OR any UST >42,000 gal. Includes lube oil, hydraulic fluid, transformer oil, fuel, waste oil. Count all containers ≥55 gal.",
  },
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "Clean Water Act 404 — Wetlands Dredge & Fill Permit",
    citationSource: "40 CFR Parts 230–233; CWA 404",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Activities involving the discharge of dredged or fill material into waters of the United States, including wetlands, require a 404 permit from the U.S. Army Corps of Engineers and/or state 401 water quality certification. Nationwide Permits (NWPs) cover minor/routine activities; Individual Permits required for larger impacts.",
    facilityAction: "Before any construction, grading, or fill activity near streams, wetlands, or drainage features, conduct jurisdictional wetlands delineation. If 404 activity is proposed, consult with U.S. Army Corps of Engineers for NWP or Individual Permit.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Per project",
    recordsToMaintain: "Wetlands delineation report, 404 permit or NWP verification, 401 water quality certification, mitigation records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Applicable if any construction or fill activity near wetlands, streams, or drainage ditches is planned. Consult before any ground disturbance near water features.",
  },
  // ── Petroleum / UST ─────────────────────────────────────────────────────
  {
    aspectCategory: "Oil Management & Spillage",
    requirementName: "Underground Storage Tanks (UST) — Registration & Management",
    citationSource: "40 CFR Part 280; RCRA Subtitle I",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Underground storage tanks (USTs) storing petroleum or hazardous substances (≥110-gallon capacity, ≥10% volume underground) must be registered with the state, equipped with leak detection, spill/overfill prevention, and corrosion protection. Owners must maintain financial assurance for corrective action.",
    facilityAction: "Register all USTs with the state UST program. Ensure each UST has required leak detection, spill bucket, overfill device, and corrosion protection. Conduct monthly leak detection monitoring. Maintain financial assurance. Inspect spill buckets annually. Report releases within 24 hours of detection.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual registration renewal",
    recordsToMaintain: "UST registration certificates, leak detection records (3-year retention), inspection logs, release notification/corrective action records, financial assurance documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Check for any fuel oil, gasoline, diesel, hydraulic fluid, or chemical tanks that are ≥10% below grade. All must be registered with the state UST program.",
  },
  // ── Emergency ────────────────────────────────────────────────────────────
  {
    aspectCategory: "Emergency Planning",
    requirementName: "Risk Management Plan (RMP) — Accidental Release Prevention",
    citationSource: "40 CFR Part 68; CAA 112(r)",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities that hold regulated toxic or flammable substances above threshold quantities must develop and submit a Risk Management Plan (RMP) to EPA. RMP includes hazard assessment (worst-case/alternate release scenarios), prevention program, and emergency response program. Applies to common substances: ammonia (>10,000 lbs), chlorine (>2,500 lbs), propane (>10,000 lbs), hydrogen fluoride (>1,000 lbs), and others.",
    facilityAction: "Review chemical inventory for RMP-regulated substances. If any substance is present above the applicable threshold quantity, develop an RMP (Program 1, 2, or 3 as applicable). Submit RMP to EPA's RMP*eSubmit system. Resubmit every 5 years and within 6 months of process changes.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "5-year resubmission; update within 6 months of process changes",
    recordsToMaintain: "RMP document, EPA submission confirmation, process hazard analyses (PHA/HAZOP), incident investigation reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Common RMP triggers in manufacturing: anhydrous ammonia (refrigeration, heat treat), chlorine (water treatment), flammable gases. Review regulated substance list at 40 CFR 68.130.",
  },
  {
    aspectCategory: "Emergency Planning",
    requirementName: "EPCRA 304 — Emergency Release Notification",
    citationSource: "40 CFR Part 355; EPCRA 304",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities must immediately notify the SERC and LEPC if there is a release of a CERCLA hazardous substance or an Extremely Hazardous Substance (EHS) that equals or exceeds the reportable quantity (RQ) and goes off-site. Notification must include substance name, estimated quantity, time/duration, location, known health risks, and actions taken.",
    facilityAction: "Establish emergency release notification procedure. Maintain contact list for SERC, LEPC, and local emergency responders. If any release equals or exceeds RQ and goes off-site, notify SERC and LEPC immediately by telephone, followed by written follow-up within 7 days.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "As needed (triggered by qualifying release)",
    recordsToMaintain: "Release notification records, SERC/LEPC contact list, written follow-up reports, incident investigation records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Distinct from EPCRA 302 planning requirement. 304 notification is an immediate action required upon an actual release — not a planning submission.",
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "EPCRA 311 — MSDS / Chemical List Submission",
    citationSource: "40 CFR Part 370; EPCRA 311",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities required to maintain SDSs (MSDSs) under OSHA HazCom must submit copies of SDSs (or a list of covered chemicals) to the SERC, LEPC, and local fire department. One-time submission required; updates needed within 3 months when new covered chemicals are added.",
    facilityAction: "Submit SDS or chemical list to SERC, LEPC, and local fire department for all hazardous chemicals required to have an SDS under OSHA HazCom. Update submissions within 3 months when new chemicals meeting SDS requirements are brought to the facility.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "One-time + update when new chemicals added",
    recordsToMaintain: "311 submission records, SERC/LEPC/fire department acknowledgements, chemical list updates",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Companion requirement to Tier II (312). 311 is a one-time submission of SDS or list; Tier II is the annual quantity/inventory report.",
  },
  // ── Hazardous Waste ──────────────────────────────────────────────────────
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "RCRA Biennial Report — Large Quantity Generators",
    citationSource: "40 CFR Part 262 Subpart D",
    jurisdictionLevel: "F/S",
    state: null, county: null,
    descriptionOfRequirement: "Large Quantity Generators (LQGs) must submit a Biennial Report to the EPA and/or state agency by March 1 of each even-numbered year. Report covers waste generation quantities, handling methods, TSDFs used, and waste minimization activities during the prior calendar year.",
    facilityAction: "If LQG status (generate ≥1,000 kg hazardous waste/month), prepare and submit Biennial Report to EPA using myRCRAid (e-Manifest/RCRAInfo portal) or state equivalent by March 1 of even-numbered years.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Biennial (every even year, by March 1)",
    recordsToMaintain: "Biennial Report submissions, waste generation logs, TSDF records, waste minimization documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Only required for LQGs (≥1,000 kg/month). SQGs and VSQGs are not required to submit a Biennial Report. Confirm generator status annually.",
  },
  // ── Toxic Substances ─────────────────────────────────────────────────────
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "TSCA Chemical Data Reporting (CDR)",
    citationSource: "40 CFR Part 711; TSCA 8(a)",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Chemical manufacturers (including importers) who produce or import ≥25,000 lbs of a chemical substance listed on the TSCA Chemical Substance Inventory in a reporting year must submit Chemical Data Reports to EPA. Reported every 4 years (principal reporting year). Certain substances have lower thresholds (≥2,500 lbs for certain chemicals of concern).",
    facilityAction: "Identify all chemical substances manufactured or imported at ≥25,000 lbs/year. Submit CDR to EPA via CDX/e-CDRweb by September 30 of the principal reporting year (every 4 years). Maintain production volume records for 5 years.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Every 4 years (principal reporting year)",
    recordsToMaintain: "CDR submissions, chemical production/import volume records, EPA CDX submission confirmations",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Applies to chemical manufacturers and importers. If facility synthesizes, formulates, or imports any listed TSCA chemical substance at ≥25,000 lbs, CDR reporting applies. Contact EPA for current reporting year.",
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Lead-Based Paint — Renovation, Repair & Painting (RRP) Rule",
    citationSource: "40 CFR Part 745; TSCA 402/406",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Renovation, repair, and painting projects that disturb lead-based paint in pre-1978 facilities require compliance with EPA's RRP Rule (applies to child-occupied facilities and residential buildings, and to general industry under OSHA 29 CFR 1926.62 for construction). Industrial facilities constructed before 1978 should test for lead paint before any renovation activity.",
    facilityAction: "Test for lead-based paint before renovation, repair, or demolition in buildings constructed before 1978. If LBP is present, use EPA/state certified renovators and follow safe work practices. Maintain records of testing results and renovation activities.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Per renovation project",
    recordsToMaintain: "Lead paint test results, certified renovator records, renovation activity records, worker notification documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Primarily OSHA 29 CFR 1926.62 for construction workers. Also consider state lead program requirements. If building is pre-1978, conduct a lead survey before any paint disturbing activities.",
  },
  // ── Greenhouse Gas ───────────────────────────────────────────────────────
  {
    aspectCategory: "Air Quality",
    requirementName: "Greenhouse Gas (GHG) Mandatory Reporting Rule",
    citationSource: "40 CFR Part 98; CAA 114",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities that emit ≥25,000 metric tons of CO2 equivalent (CO2e) per year from covered source categories must report GHG emissions to EPA annually. Covered sources include stationary fuel combustion, industrial processes, and fugitive emissions. Report submitted via EPA's e-GGRT system by March 31 for the prior calendar year.",
    facilityAction: "Calculate annual GHG emissions from all stationary combustion sources (boilers, furnaces, generators) and applicable industrial processes. If total ≥25,000 MT CO2e, register with EPA e-GGRT and submit annual report by March 31. Retain supporting calculations for 3 years.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (by March 31)",
    recordsToMaintain: "GHG calculation methodology, emissions monitoring data, e-GGRT annual report submissions, fuel purchase/consumption records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Threshold: ≥25,000 MT CO2e/year. Even facilities below threshold may want to track GHG emissions voluntarily for ESG reporting. Common sources: natural gas combustion, process emissions, refrigerant leaks.",
  },
  // ── Mercury / Universal Waste (Specific) ────────────────────────────────
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Mercury-Containing Devices — Universal Waste",
    citationSource: "40 CFR 273.4 / 273.9; RCRA Subtitle C",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Mercury-containing devices (thermostats, switches, relays, thermometers, blood pressure gauges, barometers) are managed as Universal Waste. Small quantity handlers may accumulate up to 11,000 lbs for up to one year before shipping to a TSDF or universal waste handler. All containers must be labeled 'Universal Waste — Mercury-Containing Equipment'.",
    facilityAction: "Identify all mercury-containing equipment (thermostats, fluorescent lamps, switches). Label containers 'Universal Waste — Mercury-Containing Equipment.' Ship to a certified Universal Waste handler at least annually. Do not dispose of mercury devices in regular trash.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Universal waste shipment records, mercury equipment inventory, hauler certifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "State programs may be more stringent. Michigan prohibits disposal of mercury-containing devices in solid waste. Label and track all mercury-containing thermostats and fluorescent lamp ballasts.",
  },
  // ── Boiler MACT ──────────────────────────────────────────────────────────
  {
    aspectCategory: "Air Quality",
    requirementName: "Boiler MACT — Industrial, Commercial & Institutional Boilers (Area Source)",
    citationSource: "40 CFR Part 63 Subpart JJJJJJ",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "NESHAP for industrial, commercial, and institutional boilers at area sources. Applies to boilers that burn solid, liquid, or gaseous fuels. Requirements depend on boiler type and fuel: tune-up schedules (annually or every 2 years), energy assessment every 10 years, and/or emission limits. Applies to natural gas, oil, biomass, and other fuel-fired boilers.",
    facilityAction: "Identify all boilers and classify by fuel type and heat input capacity. Determine applicable requirements: conduct initial tune-up and ongoing annual or biennial tune-ups. Complete one-time energy assessment within applicable deadline. Submit initial notification to EPA if applicable. Keep records of tune-ups and energy assessments.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual or biennial tune-up per subpart",
    recordsToMaintain: "Boiler tune-up records, energy assessment reports, initial notifications, annual compliance certifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Subpart JJJJJJ covers area source boilers. Major source boilers are covered by Subpart DDDDD. Check boiler nameplate for heat input capacity and fuel type to determine applicable requirements.",
  },
  // ── RICE MACT (Emergency Generators / Compressors) ──────────────────────
  {
    aspectCategory: "Air Quality",
    requirementName: "RICE MACT — Stationary Reciprocating Internal Combustion Engines",
    citationSource: "40 CFR Part 63 Subpart ZZZZ",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "NESHAP for stationary reciprocating internal combustion engines (RICE) including emergency diesel generators, fire pump engines, standby generators, and compressors. Area source engines ≥500 HP must meet emission standards or perform annual maintenance. Emergency engines must use ultra-low sulfur diesel (ULSD) and comply with work practice standards. Engines must not operate as emergency engines for more than 100 hours per year for non-emergency purposes.",
    facilityAction: "Inventory all stationary RICE (emergency generators, air compressors, pump engines). Classify by size and type. For emergency generators: use ULSD, conduct annual maintenance per manufacturer's schedule, limit non-emergency operation to 100 hours/year. Document all hours of operation, maintenance performed, and fuel type. Submit initial notification to EPA if applicable.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual maintenance and recordkeeping",
    recordsToMaintain: "Engine inventory, operating hours log, maintenance records, fuel purchase records (ULSD), initial notifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Applies to emergency diesel generators, compressors, and standby engines. Track hours to ensure emergency engines do not exceed 100 hours/year for non-emergency testing/operation. Fire pump engines have specific exemptions.",
  },
  // ── Health & Safety Requirements (Federal OSHA) ──────────────────────────
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Compressed Gases / Natural Gas — Storage & Handling",
    citationSource: "29 CFR 1910.101; 29 CFR 1910.110",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Defines inspection, handling, storage, and in-plant utilization requirements for compressed gases (29 CFR 1910.101) and liquefied petroleum gases (29 CFR 1910.110). Requires cylinders to be properly stored, secured to prevent tipping, and segregated by compatibility (e.g., oxidizers from flammables).",
    facilityAction: "Store compressed gas cylinders secured upright to prevent tipping. Segregate incompatible gases (e.g., oxygen away from flammables). Cap cylinders when not in use. Provide compressed gas training to affected employees (tooling, maintenance, production): New Hire Orientation; refreshers optional annually.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Training records, cylinder inspection logs, storage procedure documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Flammable & Combustible Liquids — Storage & Handling",
    citationSource: "29 CFR 1910.106",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Defines storage and handling requirements for combustible and flammable liquids, including approved container types, bonding and grounding requirements, ventilation, and quantities stored inside and outside of approved storage cabinets. Applies to paints, solvents, fuels, coolants, and other flammable/combustible products.",
    facilityAction: "Ensure flammable and combustible liquids are stored and handled in approved containers and cabinets. Bond and ground metal containers during transfer. Maintain ventilation in storage areas. Limit quantities stored inside facilities per OSHA table requirements.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Storage area inspection logs, training records, flammable storage cabinet inventory",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Fixed Fire Suppression Equipment — Inspection & Maintenance",
    citationSource: "29 CFR 1910.159; 29 CFR 1910.162; 29 CFR 1910.157",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Establishes requirements for the placement, inspection, and maintenance of fixed fire suppression systems (sprinklers, deluge, CO2, dry chemical, Halon). Systems must be inspected by a licensed contractor annually. Records of all inspections, tests, and maintenance must be maintained.",
    facilityAction: "Ensure all fixed fire suppression systems (sprinkler heads, suppression agents, detection devices) are correctly installed and maintained. Engage a licensed fire protection contractor for annual inspection and testing. Correct any deficiencies promptly.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual inspection",
    recordsToMaintain: "Annual fire suppression system inspection reports, deficiency correction records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Portable Fire Extinguishers — Monthly Inspection & Annual Service",
    citationSource: "29 CFR 1910.157",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Requires that portable fire extinguishers be placed throughout the facility, maintained in a fully charged and operable condition, inspected monthly, and serviced annually by a certified contractor. Annual hydrostatic testing is required per manufacturer schedule.",
    facilityAction: "Inspect portable fire extinguishers monthly (visual inspection — pressure gauge in green, no damage, pin and tamper seal in place). Conduct annual maintenance by a certified fire extinguisher contractor. Record all inspections on the tag attached to each unit.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Monthly visual inspection; Annual professional service",
    recordsToMaintain: "Monthly inspection tags/records, annual service certifications, hydrostatic test records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Noise Exposure / Hearing Conservation Program",
    citationSource: "29 CFR 1910.95",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Requires hearing protection and a hearing conservation program at noise levels above the permissible exposure limit (PEL: 90 dBA 8-hr TWA) and mandatory program implementation at the action level (85 dBA 8-hr TWA). Program includes noise monitoring, audiometric testing, hearing protection, training, and recordkeeping.",
    facilityAction: "Evaluate noise levels in all work areas. Provide appropriate hearing protection to employees in areas ≥85 dBA. Implement hearing conservation program (baseline and annual audiograms) for affected employees. Provide noise/hearing conservation training: New Hire Orientation; annually.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual audiometric testing; annual training",
    recordsToMaintain: "Noise monitoring surveys, audiometric test records (2-year retention; 30 years for employees exposed at/above action level), hearing protection issue records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Conduct noise surveys for all manufacturing areas. Use engineering controls first, then administrative, then PPE. Affected employees: maintenance, tooling, operators.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Sanitation — Housekeeping, Water & Waste Disposal",
    citationSource: "29 CFR 1910.141",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Defines minimum requirements for waste (garbage) disposal, general housekeeping, vermin control, potable water sources, toilet facilities, and sanitary waste disposal. Requires facilities to maintain clean and orderly work areas.",
    facilityAction: "Maintain all work areas in a clean, orderly condition. Ensure adequate toilet facilities, potable water, and sanitary waste disposal. Conduct regular pest control inspections. Verify compliance with all sanitation requirements applicable to the facility.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Housekeeping inspection logs, pest control records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Process Safety Management (PSM) — Catastrophic Release Prevention",
    citationSource: "29 CFR 1910.119",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Establishes requirements for preventing or minimizing the consequences of catastrophic releases of toxic, reactive, flammable, or explosive chemicals. Applies to facilities using covered chemicals above threshold quantities (e.g., anhydrous ammonia ≥10,000 lbs, chlorine ≥1,500 lbs, propane ≥10,000 lbs). Requires Process Hazard Analysis (PHA), written procedures, training, pre-startup safety reviews, and emergency response.",
    facilityAction: "Review chemical inventory for PSM-regulated substances above threshold quantities. If applicable, develop written process safety information, conduct Process Hazard Analysis (PHA/HAZOP), implement written procedures, train operators, and establish pre-startup safety review program. If not applicable, document the basis for the exemption.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "PHA every 5 years; ongoing",
    recordsToMaintain: "PSM applicability determination, process safety information, PHA records, training records, incident investigation reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Common exemption: 29 CFR 1910.119(a)(1)(ii)(B) — atmospheric storage of flammable liquids below threshold. Confirm PSM status annually when chemical inventory changes.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Bloodborne Pathogens — Exposure Control",
    citationSource: "29 CFR 1910.1030",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Establishes requirements to protect employees from occupational exposure to blood or other potentially infectious materials (OPIM). Requires a written Exposure Control Plan, use of Universal Precautions, engineering controls, PPE, training, and post-exposure evaluation.",
    facilityAction: "Maintain a written Bloodborne Pathogen Exposure Control Plan. Provide BBP training to all employees at initial hire and annually. Provide first aid supplies and PPE (gloves, face shields) to first responders. Ensure first aid/CPR trained responders are available on all shifts.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual training",
    recordsToMaintain: "Exposure Control Plan, training records (New Hire Orientation + annual refresher), post-exposure records (30-year retention)",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Provide First Aid Responder Training (voluntary, various shifts): New Hire Orientation, 2-year refresher. All employees need basic BBP awareness training at hire.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Personal Protective Equipment (PPE) — Hazard Assessment & Program",
    citationSource: "29 CFR 1910.132",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "PPE for eyes, face, head, extremities, respiratory, and body protection shall be provided, used, and maintained wherever it is necessary due to chemical, radiological, or mechanical hazards. Employers must conduct and certify a written hazard assessment to determine required PPE for each task/work area.",
    facilityAction: "Conduct and certify a written PPE hazard assessment for all work areas and job tasks. Identify required PPE for each task. Provide required PPE at no cost to employees. Provide PPE training: initial on-the-job training, refresher as required based on work changes. Maintain signed and dated hazard assessments.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "As work conditions change",
    recordsToMaintain: "Written PPE hazard assessments (signed and dated), training records, PPE issuance records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Lockout/Tagout (LOTO) — Control of Hazardous Energy",
    citationSource: "29 CFR 1910.147",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "A required written program covering the control of hazardous energy (electrical, hydraulic, pneumatic, gravitational, thermal, chemical) during servicing or maintenance of machinery to prevent unexpected energization or startup. Requires machine-specific written procedures, authorized and affected employee training, and annual periodic inspections.",
    facilityAction: "Develop written LOTO program and machine-specific energy control procedures. Provide LOTO training: New Hire Orientation (all employees as 'affected'), specific equipment training (maintenance/tooling as 'authorized'), annually for authorized employees if equipment changes. Conduct annual periodic LOTO inspections for each energy control procedure.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual periodic inspection of each procedure; annual authorized employee training",
    recordsToMaintain: "Written LOTO program, machine-specific energy control procedures, annual inspection records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Annual periodic inspection must be documented and must certify that the energy control procedure is adequate and employees know how to use it.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Confined Space Entry — Permit-Required Program",
    citationSource: "29 CFR 1910.146",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Confined spaces shall be identified. If a confined space poses a hazard (atmospheric, engulfment, entrapment, or other serious hazard), it is designated as a permit-required confined space. A written confined space program, entry permits, and trained entrants, attendants, and supervisors are required.",
    facilityAction: "Identify and evaluate all confined spaces at the facility. Post 'Permit-Required Confined Space' signs at identified PRCS. Develop written confined space entry program. Provide confined space training to affected personnel (maintenance): awareness at New Hire Orientation, PRCS-specific entry training for authorized entrants and attendants, update when procedures or hazards change.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual program review; entry-specific permits",
    recordsToMaintain: "Confined space inventory, written PRCS program, entry permits (retain for 1 year), training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Common PRCSs in manufacturing: pits, tanks, vaults, tunnels, hoppers. Any space large enough to enter bodily, with limited means of egress, and not designed for continuous occupancy must be evaluated.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Emergency Action Plan (EAP)",
    citationSource: "29 CFR 1910.38",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "An Emergency Action Plan is required to provide direction during emergencies (fire, chemical spill, medical emergency, severe weather, active threat). The EAP must cover emergency escape routes, procedures, employee accountability, rescue duties, and alarm systems. Must be communicated to all employees.",
    facilityAction: "Develop and maintain a written Emergency Action Plan. Provide general awareness training to all employees (New Hire Orientation). Conduct evacuation drills annually. Train emergency responders (leads and managers): annually, emergency drills annually. Post emergency egress maps at all exits.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual review; annual drill",
    recordsToMaintain: "Written EAP, drill records, training records, emergency contact list, posted evacuation maps",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "OSHA 300 Log — Occupational Illness & Injury Recordkeeping",
    citationSource: "29 CFR 1904",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "OSHA recordkeeping requires all recordable work-related injury, illness, or death to be recorded on the OSHA 300 Log, 300A Summary, and 301 Incident Report. The 300A Summary must be posted from February 1 to April 30 annually. Establishments with ≥20 employees in high-hazard industries must submit 300A data electronically via the Injury Tracking Application (ITA).",
    facilityAction: "Record all OSHA recordable injuries and illnesses on Form 300. Complete Form 301 within 7 calendar days of each recordable incident. Post OSHA 300A Summary from February 1 to April 30. Submit 300A data electronically via OSHA ITA portal if applicable. Fatalities must be reported to OSHA within 8 hours; in-patient hospitalizations, amputations, and eye losses within 24 hours.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (maintain 5 years of records)",
    recordsToMaintain: "OSHA 300 Log, 300A Summary, 301 Incident Reports (5-year retention), ITA submission confirmations",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Severe injury reporting: fatality — report to OSHA within 8 hours. In-patient hospitalization, amputation, or eye loss — report within 24 hours. Use 1-800-321-OSHA or nearest OSHA office.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Welding, Cutting & Brazing — Fire Protection & Ventilation",
    citationSource: "29 CFR 1910.251–1910.255",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Welding operations shall provide for fire protection, personnel protection, and ventilation. Filter lenses must meet transmission standards for radiant energy. Requirements for welding in confined spaces, near combustibles, and fume/smoke control must be addressed.",
    facilityAction: "Control fumes/smoke in welding areas (local exhaust ventilation or dilution ventilation). Ensure filter lenses meet 29 CFR 1910.133(b)(1) standards. Provide welding PPE (gloves, face shield, appropriate clothing). Provide welding safety training to affected employees (tooling, maintenance, production): initial training, refresher as needed.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Training records, ventilation assessments, PPE inspection logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Powered Industrial Trucks (Fork Trucks) — Training & Inspection",
    citationSource: "29 CFR 1910.178",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Powered industrial trucks (forklifts, order pickers, reach trucks) must be inspected before each shift, maintained per manufacturer's schedule, and operated only by trained and evaluated operators. Operator training and evaluation is required before initial use and every 3 years thereafter, or when unsafe operation is observed or a near-miss/accident occurs.",
    facilityAction: "Conduct pre-shift inspection of all fork trucks (complete daily checklist). Remove defective trucks from service. Provide fork truck operator training: initial on-the-job training plus classroom, evaluation by a qualified trainer. Re-evaluate every 3 years. Maintain operator certification records.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Every 3 years (operator training/evaluation)",
    recordsToMaintain: "Operator training and certification records, pre-shift inspection checklists, maintenance records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Crane & Sling Safety — Inspection & Operator Training",
    citationSource: "29 CFR 1910.179; 29 CFR 1910.180; 29 CFR 1910.184",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Provides for the proper use, maintenance, inspection, and operator training for overhead cranes, mobile cranes, and slings. Cranes must be inspected before initial use, at each shift, and at monthly/annual intervals per regulatory and manufacturer requirements. All slings must be inspected before each use and removed from service if damaged.",
    facilityAction: "Conduct daily pre-shift inspections of all overhead cranes. Remove defective equipment from service. Provide crane and sling safety training to affected employees (tooling, maintenance): initial on-the-job training, 3-year refresher. Conduct formal periodic inspections per 29 CFR 1910.179 and document results.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual formal inspection; monthly inspection",
    recordsToMaintain: "Daily pre-shift inspection records, annual/monthly inspection reports, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Manlift / Aerial Work Platform — Inspection & Training",
    citationSource: "29 CFR 1910.68",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Manlift equipment must be maintained, inspected, and operated according to safe work practices. Operators must be trained and authorized before use. Equipment must be inspected before each use and at formal periodic intervals.",
    facilityAction: "Inspect aerial work platforms and manlifts before each use. Provide manlift/aerial platform training to authorized operators (maintenance): initial on-the-job training, 3-year refresher or when equipment changes. Keep training records.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Every 3 years (operator training)",
    recordsToMaintain: "Operator training and authorization records, pre-use inspection logs, periodic maintenance records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Hazard Communication (HazCom) — GHS/SDS Program",
    citationSource: "29 CFR 1910.1200",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Requires facilities to maintain Safety Data Sheets (SDS/MSDS) for every hazardous chemical used on site and ensure all employees have access. Labels on chemical containers must meet GHS (Globally Harmonized System) requirements. Facilities must have a written Hazard Communication Program, and must inform contractors of chemical hazards before they begin work.",
    facilityAction: "Maintain SDS/MSDS for all hazardous chemicals. Ensure SDS are current when new chemicals are received. Provide HazCom training to all affected employees: New Hire Orientation, refresher required when new physical or health hazards are introduced. Provide Contractor Safety Training (Purchasing, Maintenance, Management): annually and with initial work authorization. Include PO attachments and letters to contractors regarding on-site chemical hazards.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual review; update when new chemicals added",
    recordsToMaintain: "SDS file/electronic system, written HazCom program, training records, contractor communication records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Ensure SDS are accessible to all employees at all times, including during all work shifts. Electronic SDS systems must be accessible in the event of power failure (backup required).",
  },
  {
    aspectCategory: "Hazardous Materials Transport",
    requirementName: "Hazardous Materials Transportation Act (HMTA) — Shipping Requirements",
    citationSource: "49 CFR 171; 49 CFR 172",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Establishes requirements for offering hazardous materials for transportation, including proper shipping names, hazard classes, packing groups, labeling, marking, placarding, and shipping paper preparation. PHMSA aligns HazMat regulations with international standards (IATA, IMDG, ADR). Lithium battery shipping rules updated frequently.",
    facilityAction: "Ensure compliance with DOT HazMat requirements for shipping hazardous materials. Personnel who prepare shipping papers, labels, or load/unload hazardous materials must be trained under DOT HM126F regulations every 3 years. Maintain training certificates. Verify proper shipping names, UN numbers, and packaging for all hazmat shipments.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Every 3 years (HazMat employee training)",
    recordsToMaintain: "HazMat employee training certifications, shipping papers, packaging certifications, incident reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Track lithium battery shipping rule changes (frequent updates). Ensure personnel signing shipping papers are HM126F trained. Check for current exemptions and special provisions for facility-specific materials.",
  },
];

const MICHIGAN_STARTER: Omit<IsoComplianceObligation, "id" | "userId" | "isoProjectId" | "createdAt" | "updatedAt">[] = [
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Michigan Hazardous Waste Management — MDEQ Part 111",
    citationSource: "MI NREPA Part 111, Act 451 (1994); MI Rule R 299.9001 et seq.",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan's hazardous waste rules under Part 111 of NREPA govern generation, storage, transportation, treatment, and disposal of hazardous waste, including liquid industrial waste (lubricants) and waste recycling options.",
    facilityAction: "Label all used oil containers as 'Used Oil.' Comply with Michigan generator requirements. Identify waste recycling options where available.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Manifests, waste characterization, generator registration",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Michigan Solid Waste Management — MDEQ Part 115",
    citationSource: "MI NREPA Part 115, Act 451 (1994)",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Establishes requirements for solid waste disposal, including permits for landfills and requirements for waste generators.",
    facilityAction: "Ensure all non-hazardous solid waste is disposed of at a permitted Michigan solid waste facility.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Waste hauler contracts, disposal receipts",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Michigan Universal Waste Rules",
    citationSource: "MI Hazardous Waste Rule 228; Part 111 of Michigan Hazardous Waste Rules",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan-specific Universal Waste rules for handling aerosol cans, antifreeze, batteries, consumer electronics, mercury-containing devices, lamps, pesticides, and pharmaceuticals.",
    facilityAction: "Comply with Michigan Universal Waste Rules for storage, labeling, and disposal. Maintain compliance with both federal and state universal waste requirements.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Waste disposal records, hauler certifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "Michigan Air Emissions Permitting — Rule 336",
    citationSource: "MI Rule R 336.1942; Michigan Air Pollution Control Rules",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan-specific air permitting requirements under EGLE (formerly MDEQ). Requires permits for facilities with air emission sources above applicable thresholds.",
    facilityAction: "Determine if air permits are required based on emission sources. Apply for Renewable Operating Permit (ROP) or Permit to Install (PTI) as applicable.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual / as required",
    recordsToMaintain: "Air permits, emissions monitoring records, stack testing records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "Toxic Chemical Release — Submit Form R to MDEQ/EGLE",
    citationSource: "40 CFR Part 372; Michigan EGLE",
    jurisdictionLevel: "F/S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan requires Form R submissions to EGLE (Michigan Dept. of Environment, Great Lakes, and Energy) in addition to EPA. Submit by July 1st annually for any listed chemicals exceeding thresholds.",
    facilityAction: "Submit Toxic Chemical Release Form (Form R) to EGLE by July 1st annually for applicable listed chemicals (e.g., methanol, if above threshold).",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (by July 1)",
    recordsToMaintain: "Form R submissions, annual review of chemical usage quantities",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "Tier II Chemical Inventory — Submit to MDEQ/EGLE",
    citationSource: "40 CFR Part 370; Michigan EGLE",
    jurisdictionLevel: "F/S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Submit Tier II Chemical Inventory to Michigan EGLE by March 1st annually for chemicals stored above RQ that are subject to OSHA HazCom requirements.",
    facilityAction: "Submit Tier II Chemical Inventory Form (Tier II) to MDEQ/EGLE by March 1st annually for applicable chemicals (e.g., methanol, nitrogen, sulfuric acid, lubricating oils).",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (by March 1)",
    recordsToMaintain: "Tier II submissions, chemical inventory",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Material Use/Exposure",
    requirementName: "Asbestos — Michigan Rule R 336.1942",
    citationSource: "MI Rule R 336.1942; NESHAP (40 CFR Part 61 Subpart M)",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan asbestos abatement regulations require notification to EGLE prior to renovation/demolition of facilities containing ACM. Licensed contractors required for abatement.",
    facilityAction: "Conduct ACM survey. Notify EGLE at least 10 working days before any renovation or demolition affecting ACM. Use licensed abatement contractor.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Per project",
    recordsToMaintain: "ACM survey, EGLE notification, abatement contractor records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Oil Management & Spillage",
    requirementName: "Michigan Pollution Incident Prevention Plan (PIPP) — Part 5",
    citationSource: "MI NREPA Part 5, Act 451 (1994); MI Rule R 324.2001 et seq.",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Part 5 (Water Resources Protection) requires facilities that store or handle 'polluting materials' (petroleum products, hazardous substances) above applicable thresholds to prepare a written Pollution Incident Prevention Plan (PIPP). The PIPP is integrated into the SPCC Plan and must describe the facility, storage areas, spill prevention measures, emergency notification procedures, and spill response procedures. The PIPP must be updated at least every 3 years or when facility conditions change and must be available on-site for EGLE inspection.",
    facilityAction: "Determine if petroleum or hazardous substance storage exceeds Part 5 thresholds. If yes, prepare a written PIPP covering: facility description, storage descriptions (locations, quantities, container types), spill prevention measures (secondary containment, inspections), emergency notification contacts (EGLE EMHSD hotline 800-292-4706), spill response procedures, and cleanup responsibilities. Review and update PIPP at minimum every 3 years or when facility conditions change. Train employees on the PIPP. Keep PIPP on-site and available for EGLE inspection.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Every 3 years (minimum); update within 60 days of facility changes",
    recordsToMaintain: "Written PIPP document, employee training records on PIPP, annual review records, spill notifications to EGLE, spill incident records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan PIPP is the state equivalent of the federal SPCC plan but may apply at lower thresholds and to a broader range of polluting materials. EGLE EMHSD spill hotline: 800-292-4706 (24-hour). Any spill that reaches or threatens waters of the state must be reported immediately.",
  },
  {
    aspectCategory: "Oil Management & Spillage",
    requirementName: "Michigan SPCC — Aboveground Petroleum Storage Secondary Containment",
    citationSource: "MI NREPA Part 5 (Act 451); 40 CFR Part 112",
    jurisdictionLevel: "F/S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan facilities with aggregate aboveground oil storage >1,320 gallons must comply with the federal SPCC rule (40 CFR Part 112) AND Michigan Part 5 secondary containment requirements. Michigan Part 5 may impose more stringent containment standards and applies to a broader definition of 'polluting materials' beyond just petroleum. Michigan requires immediate reporting to EGLE for any spill threatening waters of the state.",
    facilityAction: "Inventory all aboveground petroleum and hazardous liquid storage. Ensure secondary containment meets both federal SPCC (40 CFR Part 112) and Michigan Part 5 requirements. Conduct annual SPCC Plan review. Report any spill reaching or threatening waters of Michigan to EGLE EMHSD immediately at 800-292-4706.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "5-year SPCC review; update within 6 months of facility changes",
    recordsToMaintain: "SPCC Plan, secondary containment inspection logs, petroleum storage inventory, EGLE spill notification records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "EGLE hotline: 800-292-4706 (24-hour). Michigan's spill reporting threshold is lower than federal RQ — report any quantity that reaches or threatens waters of the state.",
  },
  {
    aspectCategory: "Oil Management & Spillage",
    requirementName: "Michigan Underground Storage Tanks (UST) — Part 211",
    citationSource: "MI NREPA Part 211, Act 451 (1994); MI Rule R 299.5101 et seq.",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Part 211 regulates underground storage tanks containing petroleum or hazardous substances. Requirements include registration, leak detection, corrosion protection, spill/overfill prevention, and corrective action if a release is detected. EGLE administers the UST program in Michigan.",
    facilityAction: "Register all USTs with EGLE. Maintain monthly leak detection records. Conduct annual line tightness tests and third-year tank tightness tests as applicable. Ensure spill buckets and overfill devices are maintained. Report releases to EGLE within 24 hours.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual registration",
    recordsToMaintain: "EGLE UST registration, leak detection records, inspection logs, tightness test results, release reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan UST registration fees are assessed annually. EGLE performs compliance inspections. Any confirmed release must be reported and triggers corrective action under Part 213.",
  },
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "Michigan NPDES Industrial Process Wastewater Permit",
    citationSource: "MI NREPA Part 31, Act 451; MI Rule R 323.2101 et seq.; EGLE NPDES",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan facilities discharging process water, cooling water, or other industrial wastewater directly to surface waters must obtain an NPDES permit from EGLE (formerly MDEQ). Permit includes effluent limits, monitoring and reporting requirements, and best management practices for industrial wastewater.",
    facilityAction: "Determine if any process water or industrial wastewater is discharged to surface waters (streams, rivers, ditches, drainage). If yes, apply for NPDES industrial permit from EGLE. Monitor effluent per permit conditions. Submit monthly Discharge Monitoring Reports (DMR) to EGLE.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "5 years",
    recordsToMaintain: "EGLE NPDES permit, monthly DMR submissions, effluent monitoring data, flow records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Includes cooling tower blowdown, boiler blowdown, and equipment wash water discharged to drains. Verify whether floor drains connect to a POTW (pretreatment) or surface water (NPDES).",
  },
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "Michigan Wetlands — Part 303 Permit",
    citationSource: "MI NREPA Part 303, Act 451 (1994)",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Part 303 regulates activities in wetlands (fill, dredge, drainage alteration). Activities affecting wetlands regulated by Michigan (including isolated wetlands <5 acres, which are not covered by federal 404) require a permit from EGLE. Michigan's wetland protections are more extensive than the federal program.",
    facilityAction: "Before any construction, expansion, or grading near wetlands or low-lying areas on or adjacent to the facility, consult EGLE and a certified wetlands consultant to determine if a Part 303 permit is required. Apply for permit well in advance (up to 90-day review period).",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Per project",
    recordsToMaintain: "Wetland delineation report, Part 303 permit, mitigation records, EGLE correspondence",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan protects all wetlands ≥5 acres and wetlands <5 acres contiguous to lakes/streams, or if regulated by local ordinance. Consult EGLE early for any development near wetlands.",
  },
  {
    aspectCategory: "Land/Soil Contamination",
    requirementName: "Michigan Contaminated Site — Part 201 Baseline Environmental Assessment (BEA)",
    citationSource: "MI NREPA Part 201, Act 451 (1994)",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Part 201 governs remediation of contaminated sites. Facilities acquiring or developing property with known or suspected environmental contamination should conduct a Baseline Environmental Assessment (BEA) before acquisition to limit liability. Existing owners may need to conduct due care obligations to prevent exposure if contamination is discovered.",
    facilityAction: "Conduct Phase I/II Environmental Site Assessment before purchasing any property. If contamination is found or suspected, file a BEA with EGLE within 45 days of property acquisition to preserve liability protection. Implement due care measures if contamination is present on owned property.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Per site transaction/discovery",
    recordsToMaintain: "Phase I/II ESA reports, BEA filing confirmation, due care plan, EGLE correspondence, contamination monitoring records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan's 'due care' obligations require current owners/operators to prevent unacceptable exposure pathways even if they didn't cause contamination. Review site history for prior industrial uses.",
  },
  // ── Michigan Waste (Additional) ──────────────────────────────────────────
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Michigan Liquid Industrial Waste — Part 121",
    citationSource: "MI NREPA Part 121, Act 451 (1994); MI Rule R 299.4101 et seq.",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Part 121 governs the management and disposal of liquid industrial waste (LIW) — non-hazardous liquid waste generated by industrial, commercial, or governmental operations. LIW must be collected, transported, and disposed of by a licensed liquid waste hauler to a permitted facility. Manifests (Bills of Lading) are required for each shipment.",
    facilityAction: "Identify all non-hazardous liquid waste streams (coolants, water-based process wastes, oil-water separator sludge, etc.). Use only EGLE-licensed liquid industrial waste haulers. Obtain and retain Bills of Lading/manifests for each LIW shipment. Do not discharge LIW to storm sewers, floor drains, or ground.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Bills of Lading / LIW manifests (3-year retention), hauler license verification, waste characterization documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Applies to coolants, cutting fluids, water-based process wastes, and oil-water separator sludge that do not meet the definition of hazardous waste. Verify hauler EGLE license before scheduling pickups.",
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Medical / Biological Waste — Michigan Public Health Code PA 368",
    citationSource: "Michigan Public Health Code, PA 368 (1978), as amended; Part 138",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Public Health Code Part 138 regulates the management, storage, transport, and disposal of medical (biological) waste generated by healthcare providers, laboratories, research facilities, and any facility generating regulated medical waste (sharps, cultures, pathological waste, blood). Requires on-site containers, labeling, manifest tracking, and disposal at permitted facilities.",
    facilityAction: "If facility generates any medical or biological waste (first aid sharps, contaminated dressings, culture media), designate a medical waste container (red bag or sharps container). Use only a licensed medical waste transporter for disposal. Maintain manifests for all medical waste shipments.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Medical waste manifests, transporter license verification, waste generation records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Applies when facility first aid kits or on-site clinic generate regulated medical waste (sharps, contaminated materials). Use labeled sharps containers and red bags. Never mix medical waste with regular trash.",
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Michigan Hazardous Waste ID — CESQG Rules (Part 2, MAC R 299.9201)",
    citationSource: "Michigan Administrative Code R 299.9201–R 299.9230; MI NREPA Part 111",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "MAC R 299.9201–30 establishes Michigan's hazardous waste identification rules for Conditionally Exempt Small Quantity Generators (CESQGs — now VSQGs under federal rules). Michigan CESQG/VSQG facilities generate ≤100 kg hazardous waste per month and have specific storage and disposal options. Michigan rules may be more stringent than federal VSQG provisions.",
    facilityAction: "Determine monthly hazardous waste generation quantity. If ≤100 kg/month, classify as CESQG/VSQG under Michigan rules. Ensure waste is managed per applicable options (co-disposal with solid waste, beneficial reuse, or hazardous waste disposal). Document generator status and waste determinations.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Generator status determination, monthly waste quantity records, waste disposal documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Monitor monthly HW generation to track generator status (VSQG <100 kg/mo, SQG 100–999 kg/mo, LQG ≥1,000 kg/mo). Status can change monthly — track carefully.",
  },
  // ── Michigan Air Quality (Additional) ────────────────────────────────────
  {
    aspectCategory: "Air Quality",
    requirementName: "Michigan Air Permit-to-Operate — Rule 336.1201 (Painting/Coating Operations)",
    citationSource: "MI Air Pollution Control Rules, Rule 336.1201; MI NREPA Part 55",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Air Pollution Control Rule 336.1201 requires a Permit to Install (PTI) and/or Renewable Operating Permit (ROP) for stationary sources of air pollution, including painting and coating operations. Applies to spray painting, powder coating, and other surface coating operations that emit VOCs, HAPs, or PM above applicable thresholds. Permit specifies emission limits, record-keeping, and operational conditions.",
    facilityAction: "Determine if painting, coating, or other processes require a Michigan PTI or ROP under Rule 336.1201. If yes, obtain permit before installation/modification. Monitor emissions from painting operations (spray paint, powder coat, body filler). Comply with all permit conditions. Keep daily/monthly usage logs for coatings and solvents.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual ROP renewal; PTI per installation",
    recordsToMaintain: "Michigan PTI and/or ROP, coating and solvent usage logs, VOC content records, monitoring data, permit fee payment records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Track daily and monthly VOC usage from all paint booths. If cumulative VOC emissions approach permit limits, reduce usage or modify permit. ROP may require quarterly compliance certifications.",
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "Michigan MDEQ Permit Exemptions — Rule 336.1278a / Rules 280–290",
    citationSource: "MI Air Pollution Control Rules R 336.1278a; Rules 280–290 (Exemptions from PTI requirement)",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Air Pollution Control Rules 280–290 define exemptions from the Permit to Install (PTI) requirement for certain equipment and processes. Rule 336.1278a (Scope of Permit Exemptions) clarifies which emission sources may qualify for an exemption and the conditions that must be met. Exemptions are available for small engines, small boilers, non-production laboratory equipment, and certain surface coating operations below specified thresholds.",
    facilityAction: "Review all emission sources against Rules 280–290 exemption criteria to determine which sources qualify for a PTI exemption. Document the basis for each exemption claim. Do not assume exemption applies without verification — thresholds are source-specific and may change if production increases.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual review of exempt status",
    recordsToMaintain: "Exemption determination documentation, equipment list, emission calculations supporting exemption claims",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Re-evaluate exemption status when adding or modifying equipment. If production increases cause emissions to exceed exemption thresholds, a PTI must be obtained before continued operation.",
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "Boiler MACT — Michigan EGLE Implementation (Subpart JJJJJJ)",
    citationSource: "40 CFR Part 63 Subpart JJJJJJ; Michigan EGLE Air Quality Division",
    jurisdictionLevel: "F/S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan EGLE administers the federal Boiler MACT (40 CFR Part 63 Subpart JJJJJJ) for area source industrial boilers. Michigan incorporates federal tune-up requirements and energy assessment obligations into state air operating permit conditions. Michigan-specific reporting may be required via EGLE's reporting systems.",
    facilityAction: "Ensure all boilers meet federal Subpart JJJJJJ tune-up requirements (annually for oil-fired; every 2 years for gas-fired). Complete one-time energy assessment within applicable deadline. Submit required notifications to EGLE. Incorporate boiler MACT compliance into ROP permit conditions review.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual or biennial tune-up",
    recordsToMaintain: "Boiler tune-up records, energy assessment report, EGLE notifications, ROP compliance documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Air Quality",
    requirementName: "RICE MACT — Michigan EGLE Implementation (Subpart ZZZZ)",
    citationSource: "40 CFR Part 63 Subpart ZZZZ; Michigan EGLE Air Quality Division",
    jurisdictionLevel: "F/S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan EGLE administers the federal RICE MACT (40 CFR Part 63 Subpart ZZZZ) for stationary reciprocating internal combustion engines including emergency diesel generators and fire pump engines. Michigan permits may incorporate RICE MACT requirements as permit conditions. Ultra-low sulfur diesel (ULSD) is required for all emergency diesel engines.",
    facilityAction: "Ensure emergency generators and other RICE comply with Subpart ZZZZ requirements: use ULSD, conduct annual maintenance per manufacturer schedule, limit non-emergency operation to 100 hours/year. Include RICE MACT compliance requirements in Michigan ROP permit review. Document all hours of operation.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual maintenance",
    recordsToMaintain: "Engine operating hours log, maintenance records, fuel purchase records (ULSD), EGLE notifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  // ── Michigan Water / SWPPP (Detailed) ────────────────────────────────────
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "Michigan NPDES Stormwater Permit (SWPPP) — EGLE Part 31",
    citationSource: "MI NREPA Part 31, Act 451; MI Rule R 323.2190 et seq.; EGLE Industrial Stormwater Permit",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan EGLE administers the NPDES industrial stormwater general permit for facilities discharging stormwater associated with industrial activity. Facilities must develop and implement a Stormwater Pollution Prevention Plan (SWPPP), employ a certified stormwater operator, and conduct routine inspections. Stormwater discharges from areas of industrial activity are regulated. Annual permit fees apply. Effective for Michigan facilities with industrial stormwater permit coverage.",
    facilityAction: "Obtain NPDES industrial stormwater permit coverage from EGLE. Develop and maintain a current SWPPP. Ensure the facility has at least one certified stormwater operator on staff. Pay annual permit fees (two permits typically apply). Provide SWPPP training to all employees (New Hire Orientation; 2–3 year refresher). Conduct monthly visual stormwater inspections. Perform quarterly stormwater inspections by the certified stormwater operator. Complete the annual stormwater report and submit to EGLE by January 10th each year.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual permit fee; annual report by January 10",
    recordsToMaintain: "NPDES stormwater permit, SWPPP document, certified operator credentials, monthly inspection records, quarterly inspection records by certified operator, annual stormwater report, permit fee payment records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan-specific requirement: annual stormwater report must be submitted to EGLE by January 10. Visual stormwater assessments from areas of industrial activity is a new permit requirement for Michigan industrial stormwater permit holders. Ensure SWPPP is updated when facility changes occur.",
  },
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "Michigan Annual Wastewater Report (AWR) — EGLE Part 31",
    citationSource: "MI NREPA Part 31; MI Rule R 299.9001–299.9008; EGLE Environmental Assistance Division",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan facilities with NPDES process wastewater discharge permits must submit an Annual Wastewater Report (AWR) to the EGLE Environmental Assistance Division. The AWR may be a standard or abbreviated format depending on facility size and complexity. Report must be submitted by August 1st of each year for the prior calendar year.",
    facilityAction: "Prepare the Michigan Annual Wastewater Report (standard or abbreviated format as applicable). Submit AWR to: EGLE Environmental Assistance Division, P.O. Box 30457, Lansing, MI 48909-7959 (or submit electronically if EGLE portal is available) by August 1st of every year. Retain copies of all submitted AWRs.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (by August 1)",
    recordsToMaintain: "Annual Wastewater Reports (AWR), submission confirmation, wastewater monitoring data used in AWR preparation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Annual Wastewater Report deadline is August 1st each year. Contact EGLE Environmental Assistance Division for current AWR form and submission instructions. AWR requirement applies to facilities with NPDES process wastewater permit coverage.",
  },
  // ── MIOSHA (Michigan-Specific H&S) ───────────────────────────────────────
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Flammable & Combustible Liquids (Part 75)",
    citationSource: "MIOSHA General Industry Safety Standards Part 75; MI Act 207 — Storage and Handling of Flammable and Combustible Liquids",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Establishes Michigan-specific requirements for the storage of flammable and combustible liquids for newly constructed ASTs. Defines storage and handling requirements for drums and other containers that do not exceed 60 gallons individual capacity and portable tanks that do not exceed 660 gallons individual capacity. Michigan rules may differ from federal OSHA 29 CFR 1910.106.",
    facilityAction: "Ensure methanol tanks, solvent drums, and other flammable/combustible liquid containers comply with MIOSHA Part 75 standards. Conduct periodic inspections of storage areas. Train affected employees on proper handling procedures.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Storage inspection logs, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan-specific standard. Note differences from federal OSHA requirements, particularly for AST construction standards.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Portable Fire Extinguishers (Part 8)",
    citationSource: "MIOSHA General Industry Safety Standards Part 8: Fire Extinguisher",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 8 establishes requirements for portable fire extinguishers, incorporating and supplementing federal OSHA requirements. Monthly visual inspection, annual maintenance, and hydrostatic testing per applicable schedule are required.",
    facilityAction: "Inspect fire extinguishers at least monthly. Conduct annual maintenance by a certified contractor. Follow hydrostatic testing schedule. Document all inspections on the extinguisher tag.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Monthly inspection; annual service",
    recordsToMaintain: "Monthly inspection tags, annual service certifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Fixed Fire Suppression Equipment (Part 9)",
    citationSource: "MIOSHA General Industry Safety Standards Part 9: Fixed Fire Equipment",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 9 establishes requirements for fixed fire suppression equipment, incorporating and supplementing federal OSHA requirements. Annual inspection and testing by licensed contractor required.",
    facilityAction: "Ensure all fixed fire suppression systems are inspected annually by a licensed fire protection contractor. Correct deficiencies promptly. Document all inspections.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual inspection",
    recordsToMaintain: "Annual fire suppression inspection reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Occupational Noise Exposure (Part 380)",
    citationSource: "MIOSHA General Industry Occupational Health Standards Part 380: Occupational Noise Exposure",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Establishes Michigan standards for nuisance noise which may be generated from facility operation. Michigan Part 380 may be more stringent than federal OSHA 29 CFR 1910.95 for certain noise exposure scenarios.",
    facilityAction: "Conduct noise monitoring in all manufacturing areas. Evaluate against both federal (29 CFR 1910.95) and MIOSHA Part 380 limits. Provide appropriate hearing protection to all affected employees. Conduct audiometric testing for employees exposed at/above action level. Provide training at New Hire Orientation and annually.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual audiometric testing",
    recordsToMaintain: "Noise monitoring surveys, audiometric test records, training records, hearing protection issuance records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Testing required for: maintenance, tooling, operators, and select others. New Hire Orientation baseline audiogram; annual thereafter for affected employees.",
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Sanitation (Part 474)",
    citationSource: "MIOSHA General Industry Occupational Health Standards Part 474: Sanitation",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 474 establishes sanitation requirements for industrial facilities, supplementing federal OSHA 29 CFR 1910.141.",
    facilityAction: "Maintain all work areas, restrooms, and break areas in a clean and sanitary condition. Ensure adequate toilet facilities and potable water. Conduct regular housekeeping inspections.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Housekeeping inspection records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Process Safety Management (Part 91)",
    citationSource: "MIOSHA General Industry Safety Standards Part 91: Process Safety Management",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 91 mirrors federal 29 CFR 1910.119 PSM requirements for facilities handling covered chemicals above threshold quantities.",
    facilityAction: "Review chemical inventory for MIOSHA PSM-covered substances. If applicable, develop process safety information, PHA, written procedures, and operator training. If not applicable, document the exemption basis (e.g., atmospheric storage exemption).",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "PHA every 5 years",
    recordsToMaintain: "PSM applicability determination, process safety information, PHA records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Hazard Communication / Right to Know (Parts 92, 430)",
    citationSource: "MIOSHA General Industry Safety Standards Part 92 / Part 430: HazCom/Right to Know/Retention of DOT Markings",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Parts 92 and 430 establish hazard communication (Right to Know) and label retention requirements for industrial facilities. Facilities must develop a method for labeling hazardous chemicals and inform contractors of chemical hazards. Michigan requirements may supplement federal HazCom standards.",
    facilityAction: "Maintain a written HazCom program and current SDS for all hazardous chemicals. Ensure GHS-compliant labels on all chemical containers. Retain original DOT markings, placards, and labels on containers. Provide HazCom training at New Hire Orientation; refresher when new chemical hazards are introduced.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual review",
    recordsToMaintain: "Written HazCom program, SDS file, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Bloodborne Infectious Diseases (Part 554)",
    citationSource: "MIOSHA General Industry Safety Standards Part 554: Bloodborne Infectious Diseases",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 554 establishes requirements for protecting employees from occupational exposure to bloodborne pathogens, mirroring federal 29 CFR 1910.1030 with Michigan-specific provisions.",
    facilityAction: "Maintain written Bloodborne Pathogen Exposure Control Plan. Provide BBP training at New Hire Orientation and annually. Provide first aid responder training (voluntary, various shifts): New Hire Orientation, 2-year refresher.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual training",
    recordsToMaintain: "Exposure Control Plan, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Personal Protective Equipment (Parts 33 & 433)",
    citationSource: "MIOSHA General Industry Safety Standards Part 33 / Part 433: Personal Protective Equipment",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Parts 33 and 433 establish PPE requirements for general industry and specific processes. Differences from OSHA are noted and Michigan requirements may be more specific for certain hazards.",
    facilityAction: "Conduct written PPE hazard assessments for all work areas. Provide required PPE at no cost to employees. Provide PPE training: initial on-the-job training, refresher when work conditions change. Complete and retain signed/dated hazard assessments.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Written PPE hazard assessments, training records, PPE issuance logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Hydraulic Power Presses (Part 23)",
    citationSource: "MIOSHA General Industry Safety Standards Part 23: Hydraulic Power Presses",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Requires safe operating procedures, guards, and equipment to protect employees from hazards of hydraulic power press operation. Regular inspections are required.",
    facilityAction: "Ensure all hydraulic power presses have proper point-of-operation guarding. Conduct regular inspections per Part 23 requirements. Train press operators on safe operating procedures and guarding.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Press inspection records, operator training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Welding and Cutting (Part 12)",
    citationSource: "MIOSHA General Industry Safety Standards Part 12: Welding and Cutting",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 12 establishes requirements for welding operations including fire protection, personnel protection, and ventilation. Filter lenses must meet the test for transmission of radiant energy prescribed in 29 CFR 1910.133(b)(1).",
    facilityAction: "Control welding fumes/smoke using local exhaust ventilation or dilution ventilation. Ensure filter lenses meet transmission standards. Provide welding safety PPE. Provide welding safety training to affected employees: initial training at hire, refresher as required.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Training records, ventilation inspection logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Crane and Sling Safety (Parts 18, 19, 20, 49)",
    citationSource: "MIOSHA General Industry Safety Standards Parts 18, 19, 20, 49",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA standards for cranes, hoists, and slings requiring proper use, maintenance, inspection, and operator training.",
    facilityAction: "Conduct daily pre-shift inspections of all overhead cranes and slings. Provide crane and sling safety training: initial on-the-job training, 3-year refresher. Conduct formal periodic inspections per applicable Part requirements.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual formal inspection; 3-year operator training",
    recordsToMaintain: "Daily pre-shift inspection records, periodic inspection reports, operator training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Powered Industrial Trucks / Fork Trucks (Part 21)",
    citationSource: "MIOSHA General Industry Safety Standards Part 21: Powered Industrial Trucks",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 21 establishes requirements for powered industrial trucks, incorporating federal 29 CFR 1910.178 requirements and adding any Michigan-specific provisions. Pre-shift inspections, operator training, and equipment maintenance are required.",
    facilityAction: "Conduct daily pre-shift inspections of all fork trucks. Remove defective trucks from service immediately. Provide fork truck operator training: initial on-the-job training plus evaluation, re-evaluate every 3 years. Maintain operator certification records.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Every 3 years (operator training)",
    recordsToMaintain: "Operator training and certification records, pre-shift inspection checklists",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "MIOSHA — Confined Space Entry (Part 90)",
    citationSource: "MIOSHA General Industry Safety Standards Part 90: Confined Space Entry",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan MIOSHA Part 90 establishes confined space entry requirements, mirroring federal 29 CFR 1910.146 with Michigan-specific provisions. Confined spaces must be identified, evaluated, and permit-required spaces must be controlled with written programs and entry permits.",
    facilityAction: "Identify all confined spaces in the facility. Designate permit-required confined spaces (PRCS) and post required signage. Develop written confined space entry program. Provide training: general awareness at New Hire Orientation for all employees; PRCS entry training for authorized entrants and attendants (maintenance); update training when procedures or hazards change.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual program review",
    recordsToMaintain: "Confined space inventory, written PRCS program, entry permits (1-year retention), training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
];

const OHIO_STARTER: Omit<IsoComplianceObligation, "id" | "userId" | "isoProjectId" | "createdAt" | "updatedAt">[] = [
  {
    aspectCategory: "Air Quality",
    requirementName: "Ohio EPA Air Permit — Emissions Inventory & Permitting",
    citationSource: "Ohio EPA Division of Air Pollution Control; Ohio Administrative Code 3745",
    jurisdictionLevel: "S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio EPA requires air permits for facilities with emission sources. Determine emission levels from each welding, painting, or process source. Permits required if HAP ≥10 lbs/day or CFC ≥50 lbs.",
    facilityAction: "Monitor emissions from all sources (e.g., MIG welding, paint system/RTO). Maintain emissions inventory. Renew permits as required. Report quarterly and annually as specified in permit.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual / quarterly reporting",
    recordsToMaintain: "Documented emissions reports, permit records, monitoring logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "Ohio SARA Reporting — Tier II Chemical Inventory",
    citationSource: "40 CFR Part 370; Ohio EPA",
    jurisdictionLevel: "F/S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio requires Tier II chemical inventory reporting to Ohio EPA, SERC, and local LEPC for chemicals stored above RQ. Communicate chemical information to state and local agencies.",
    facilityAction: "Submit Tier II Chemical Inventory Form to Ohio EPA. Communicate chemical inventory information to local fire departments annually.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual",
    recordsToMaintain: "Tier II submissions, local fire department communications, chemical inventory",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "Ohio SARA Title III — Toxic Chemical Release (Form R)",
    citationSource: "40 CFR Part 372; Ohio EPA",
    jurisdictionLevel: "F/S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Report annually to Ohio EPA and EPA for toxic chemicals above thresholds (manufacture ≥25,000 lbs or otherwise use ≥10,000 lbs).",
    facilityAction: "Submit Form R annually for reportable toxic chemicals. Report releases to Ohio EPA.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual",
    recordsToMaintain: "Form R submissions, chemical release inventory",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Stormwater",
    requirementName: "Ohio No Exposure Agreement — Stormwater No Exposure Certification",
    citationSource: "Ohio EPA; 40 CFR 122.26(g)",
    jurisdictionLevel: "S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio No Exposure Agreement ensures no outside source of stormwater contamination. Requires regular external inspections using Ohio EPA-provided checklist. Regular testing of stormwater to ensure no contaminates.",
    facilityAction: "Conduct regular external inspections per Ohio EPA checklist. Maintain documented reports. Renew No Exposure Certification annually.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual",
    recordsToMaintain: "Inspection reports, stormwater test results, No Exposure Certification",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Stormwater",
    requirementName: "Butler County Stormwater Sampling",
    citationSource: "Butler County (Ohio) Stormwater Program",
    jurisdictionLevel: "L",
    state: "Ohio", county: "Butler",
    descriptionOfRequirement: "Butler County inspection and water sampling to ensure no contaminates in stormwater discharge.",
    facilityAction: "Facilitate Butler County inspections. Maintain BC stormwater test results. Address any findings promptly.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Monthly sampling",
    recordsToMaintain: "Butler County test results, inspection reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Emergency Planning",
    requirementName: "Integrated Contingency Plan (ICP) — Ohio",
    citationSource: "Federal/State/County/City Emergency Planning Requirements",
    jurisdictionLevel: "F/S/L",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Emergency Response Plan (ICP) that integrates federal (OSHA, EPA, DOT) and state/local emergency planning requirements. Plan must be trained to all associates annually.",
    facilityAction: "Maintain current Integrated Contingency Plan. Train all associates on the plan annually. Conduct annual review and update. Maintain training documentation.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual",
    recordsToMaintain: "Emergency plan, annual training records, review/update logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Water Quality & Spillage Prevention",
    requirementName: "Ohio NPDES Industrial Process Wastewater Permit",
    citationSource: "Ohio Revised Code 6111; Ohio Admin. Code 3745-33; Ohio EPA NPDES",
    jurisdictionLevel: "S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio EPA requires NPDES permits for facilities that discharge process wastewater, cooling water, or other industrial wastewater to surface waters of the state. Ohio EPA administers the NPDES program and may set more stringent limits than the federal minimums based on the receiving water body.",
    facilityAction: "Determine whether facility discharges any process water, cooling water, or washwater to surface waters. If yes, apply for Ohio EPA individual NPDES permit or seek coverage under applicable general permit. Monitor effluent and submit quarterly or monthly Discharge Monitoring Reports (DMR) to Ohio EPA as required by permit.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "5 years",
    recordsToMaintain: "Ohio EPA NPDES permit, DMR submissions, effluent lab results, flow measurement records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Verify whether floor drains and process water routing discharge to POTW (requires local pretreatment permit) or directly to surface waters (requires NPDES). Both may apply in the same facility.",
  },
  {
    aspectCategory: "Oil Management & Spillage",
    requirementName: "Ohio Underground Storage Tank (UST) Program",
    citationSource: "Ohio Revised Code 3737.87; Ohio Admin. Code 1301:7-9; Ohio State Fire Marshal",
    jurisdictionLevel: "S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio's UST program is administered by the State Fire Marshal's Bureau of Underground Storage Tank Regulations (BUSTR). Requirements include registration, installation standards, leak detection, spill/overfill prevention, corrosion protection, and corrective action for releases. Applies to USTs containing petroleum or hazardous substances.",
    facilityAction: "Register all USTs with BUSTR. Perform monthly leak detection monitoring. Ensure spill buckets, overfill devices, and corrosion protection are in place and inspected. Report confirmed or suspected releases to BUSTR within 24 hours. File annual compliance certification.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Annual registration/certification",
    recordsToMaintain: "BUSTR registration, monthly leak detection logs, annual compliance certifications, release reports, corrective action records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Ohio BUSTR hotline for releases: (800) 224-2887. Ohio requires annual compliance certification for all registered USTs. Ensure all tanks are registered — unregistered tanks carry significant penalties.",
  },
  {
    aspectCategory: "Oil Management & Spillage",
    requirementName: "Ohio SPCC / Aboveground Petroleum Storage Tank Rules",
    citationSource: "Ohio Revised Code 1509.22; Ohio Admin. Code 1301:7-7 (SFMO); Ohio EPA",
    jurisdictionLevel: "S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio regulates aboveground petroleum storage tanks (ASTs) through the State Fire Marshal's Office (flammable/combustible liquids) and Ohio EPA (spill prevention and water quality). Ohio facilities must comply with federal SPCC (40 CFR Part 112) and any applicable state fire code requirements for AST construction, containment, and labeling. Oil spills threatening waters of the state must be reported to Ohio EPA.",
    facilityAction: "Inventory all aboveground petroleum storage tanks. Ensure tanks comply with NFPA 30 or UL standards and have adequate secondary containment. Report oil spills affecting or threatening waters of Ohio to Ohio EPA Emergency Response at (800) 282-9378. Maintain SPCC Plan per federal 40 CFR Part 112 requirements.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Ongoing / SPCC 5-year review",
    recordsToMaintain: "AST inspection records, SPCC Plan, Ohio EPA spill notification records, fire marshal inspection reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Ohio EPA Emergency Response hotline: (800) 282-9378 (24-hour). Any petroleum spill reaching storm drains, ditches, or surface water must be reported immediately.",
  },
  {
    aspectCategory: "Stormwater",
    requirementName: "Ohio Construction Stormwater General Permit (CGP)",
    citationSource: "Ohio Admin. Code 3745-39; Ohio EPA Division of Surface Water",
    jurisdictionLevel: "S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio EPA requires stormwater permit coverage (Ohio CGP) for construction activities disturbing ≥1 acre. Permit requires a Stormwater Pollution Prevention Plan (SWP3), BMPs for erosion and sediment control, regular site inspections, and post-construction stormwater controls. Ohio permit runs concurrently with federal CGP requirements.",
    facilityAction: "Submit Notice of Intent (NOI) to Ohio EPA before ground disturbance ≥1 acre. Develop a project-specific SWP3. Conduct weekly site inspections and inspections after storm events ≥0.5 inches. Implement required erosion and sediment controls. Submit Notice of Termination (NOT) within 30 days of achieving final stabilization.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Per construction project",
    recordsToMaintain: "Ohio CGP NOI confirmation, SWP3, weekly inspection reports, storm event inspection logs, NOT submittal",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Ohio inspection frequency is weekly + after ≥0.5-inch storm events. Keep inspection reports on site and available for Ohio EPA inspection. SWP3 must be updated when site conditions change.",
  },
  {
    aspectCategory: "Solid & Liquid Waste",
    requirementName: "Ohio Hazardous Waste Management — Ohio EPA (RCRA-Authorized)",
    citationSource: "Ohio Revised Code 3734; Ohio Admin. Code 3745-50 through 3745-69; Ohio EPA",
    jurisdictionLevel: "S",
    state: "Ohio", county: null,
    descriptionOfRequirement: "Ohio is authorized by EPA to administer its own RCRA hazardous waste program. Ohio's rules (Ohio Admin. Code 3745-50 through 3745-69) are substantially equivalent to federal RCRA but include Ohio-specific provisions. Generators must register with Ohio EPA's RCRA Information System (RIS/myRCRAid) and comply with Ohio generator requirements.",
    facilityAction: "Register facility with Ohio EPA using EPA ID number. Comply with Ohio-specific generator requirements under Ohio Admin. Code. Submit annual waste reports to Ohio EPA as required. Use Ohio-licensed hazardous waste TSDFs. Note any Ohio-specific waste codes in addition to federal codes.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual waste report as required",
    recordsToMaintain: "Ohio EPA registration, hazardous waste manifests, annual waste reports, TSDF records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Ohio has some waste codes and requirements that go beyond federal RCRA. Confirm both federal and Ohio-specific requirements with Ohio EPA. Ohio requires annual hazardous waste report in lieu of EPA biennial report.",
  },
];

/* ─── Corporate / Customer / Other Applicable Requirements ── */
const CORPORATE_STARTER: Omit<IsoComplianceObligation, "id" | "userId" | "isoProjectId" | "createdAt" | "updatedAt">[] = [
  {
    aspectCategory: "Other Applicable Requirements",
    requirementName: "Environmental Management System — ISO 14001:2015 Standard",
    citationSource: "ISO 14001:2015 Standard",
    jurisdictionLevel: "Voluntary",
    state: null, county: null,
    descriptionOfRequirement: "ISO 14001:2015 defines the requirements for an Environmental Management System (EMS). The standard follows the Plan-Do-Check-Act (PDCA) cycle and requires the organization to establish an environmental policy, identify environmental aspects/impacts, evaluate compliance obligations, set objectives and targets, implement operational controls, conduct internal audits, and perform management review. ISO 14001:2015 replaced ISO 14001:2004 with the updated standard effective November 15, 2015.",
    facilityAction: "Maintain ISO 14001:2015 certification. Provide EMS Awareness Training to all employees at New Hire Orientation and on a 6-month schedule with optional yearly review. Conduct Internal Audits (Internal Auditors): initial training, refresher as required. Conduct Management Review annually. Provide Contractor Safety Training (Purchasing, Maintenance, Management): annually, with initial work authorization.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual surveillance audit; 3-year recertification cycle",
    recordsToMaintain: "ISO 14001 certificate, internal audit records, management review minutes, EMS training records, objective/target tracking records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "ISO 14001:2015 is the current standard version. Organizations accredited to ISO 14001:2004 were required to transition by September 15, 2018. Ensure all EMS documentation references the 2015 version.",
  },
  {
    aspectCategory: "Other Applicable Requirements",
    requirementName: "Customer OEM — Restricted & Regulated Substances List (IMDS / Chrysler/Stellantis CS-9003)",
    citationSource: "Chrysler/Stellantis CS-9003; ETI-101 & ETI-102; IMDS (International Material Data System)",
    jurisdictionLevel: "Corporate",
    state: null, county: null,
    descriptionOfRequirement: "Chrysler (now Stellantis) Supplier Requirements CS-9003 and ETI-101/102 define restricted and regulated substances that must not be present in supplied materials and components above specified thresholds. Suppliers must report material composition data through the International Material Data System (IMDS) and maintain compliance with the Substances of Concern list. This includes restrictions on lead, mercury, cadmium, hexavalent chromium, PBBs, PBDEs, and other regulated substances per REACH, RoHS, and Stellantis-specific requirements.",
    facilityAction: "Ensure all supplied materials and components meet Stellantis CS-9003 substance restrictions. Submit material composition data through IMDS for all applicable components. Monitor updates to the Stellantis restricted substances list. Maintain supplier declarations of conformance for all purchased materials. Update IMDS submissions when materials change.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "As required by customer; update IMDS when material changes occur",
    recordsToMaintain: "IMDS submissions and acceptance records, Supplier Declarations of Conformance, CS-9003 compliance evidence, material change notifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Template entry — update with facility-specific OEM customer requirements. IMDS is the automotive industry's web-based system for material data submission. Ensure all parts are properly submitted and accepted in IMDS before shipment.",
  },
  {
    aspectCategory: "Other Applicable Requirements",
    requirementName: "Customer OEM — Restricted & Reportable Substances (GM GMW3059)",
    citationSource: "General Motors Worldwide Engineering Standard GMW3059 — Restricted and Reportable Substances",
    jurisdictionLevel: "Corporate",
    state: null, county: null,
    descriptionOfRequirement: "GM GMW3059 defines General Motors' requirements for restricted and reportable substances in materials supplied to GM. Suppliers must comply with substance restrictions consistent with ELV Directive, RoHS, REACH, and GM-specific additions. Material composition data must be submitted through IMDS or GM's Restricted Substance Management System (RSMS). Suppliers are responsible for ensuring sub-tier suppliers also comply.",
    facilityAction: "Ensure all materials and components supplied to GM comply with GMW3059 restrictions. Submit material composition data via IMDS. Maintain supplier declarations from sub-tier suppliers. Monitor GMW3059 updates (GM issues revisions periodically). Notify GM of any material changes that affect substance compliance.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Monitor GM updates; update IMDS upon material changes",
    recordsToMaintain: "IMDS submissions and acceptance records, GMW3059 compliance declarations, sub-tier supplier declarations, material change documentation",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Template entry — applies to GM suppliers only. GMW3059 is updated periodically; subscribe to GM supplier portal notifications for revision updates.",
  },
  {
    aspectCategory: "Other Applicable Requirements",
    requirementName: "Customer OEM — Recyclability Guidelines (GM GMW3116)",
    citationSource: "General Motors Worldwide Engineering Standard GMW3116 — Recyclability Guidelines",
    jurisdictionLevel: "Corporate",
    state: null, county: null,
    descriptionOfRequirement: "GM GMW3116 establishes recyclability requirements for materials and components supplied to General Motors in support of GM's vehicle end-of-life recyclability targets (compliance with ELV Directive). Suppliers must demonstrate that materials are recyclable/recoverable per GMW3116 requirements and provide documentation supporting recyclability claims.",
    facilityAction: "Review materials and components against GM GMW3116 recyclability requirements. Maintain documentation supporting recyclability claims. Submit required recyclability information through GM supplier systems. Update documentation when materials change.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Upon material changes; monitor GM portal for updates",
    recordsToMaintain: "GMW3116 compliance documentation, material recyclability data, GM supplier portal submissions",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Template entry — applies to GM suppliers only. Coordinate recyclability data submission with engineering team to ensure accuracy of material composition reporting.",
  },
  {
    aspectCategory: "Other Applicable Requirements",
    requirementName: "Customer OEM — Toyota Supplier Environmental Requirements (TSOP / Chemical Ban List)",
    citationSource: "Toyota Supplier Requirements; Toyota Substance of Concern List; TSOP (Toyota Supplier Operations)",
    jurisdictionLevel: "Corporate",
    state: null, county: null,
    descriptionOfRequirement: "Toyota supplier requirements include compliance with Toyota's Substance of Concern (SOC) list, which restricts or prohibits certain chemical substances in supplied parts and materials. Suppliers must report material composition via the Toyota-required system (e.g., IMDS) and maintain ISO 14001 certification. Toyota periodically updates its chemical ban list in response to international regulatory changes.",
    facilityAction: "Ensure all materials supplied to Toyota comply with Toyota's Substance of Concern list and applicable ban list. Submit material composition data through Toyota's designated reporting system (IMDS or JAMA sheet). Maintain and provide proof of ISO 14001 certification to Toyota as required. Monitor Toyota supplier portal for updates to substance restrictions.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Monitor Toyota supplier portal; update upon material changes",
    recordsToMaintain: "IMDS/JAMA submissions, Toyota SOC compliance evidence, ISO 14001 certificate, material change notifications to Toyota",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Template entry — applies to Toyota suppliers only. Toyota requires ISO 14001 certification as a prerequisite for supplier qualification. Ensure certification is maintained and certificate is submitted to Toyota's supplier management system.",
  },
  {
    aspectCategory: "Other Applicable Requirements",
    requirementName: "Corporate Environmental Reporting — Update to Corporate Office",
    citationSource: "Corporate Environmental Policy / Parent Company Requirements",
    jurisdictionLevel: "Corporate",
    state: null, county: null,
    descriptionOfRequirement: "Corporate parent company environmental reporting requirements obligate facility to provide periodic updates on environmental compliance status, incidents, regulatory actions, permit changes, and environmental performance metrics to the Corporate Environmental, Health & Safety (EHS) function. Reporting frequency and content are defined by corporate policy.",
    facilityAction: "Provide periodic environmental compliance updates to the Corporate EHS/Environmental function as required by corporate policy. Report any regulatory notices of violation, permit exceedances, significant spills, or enforcement actions immediately. Submit annual environmental performance data (waste generation, emissions, energy use, water use) per corporate reporting schedule.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Per corporate reporting schedule (typically annual or as incidents occur)",
    recordsToMaintain: "Corporate reporting submissions, incident notifications to corporate, annual EHS performance data submissions",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Customize this entry to reflect your specific corporate parent company's reporting requirements and schedule. Include corporate contact information and reporting portal access.",
  },
];

/* ─── Helpers ────────────────────────────────────────────── */
function statusBadge(status: string) {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  return (
    <Badge className={`text-[10px] px-1.5 py-0 font-semibold border ${opt?.color ?? ""}`}>
      {opt?.label ?? status}
    </Badge>
  );
}

function evalStatusBadge(status: string) {
  const opt = EVAL_STATUS_OPTIONS.find(s => s.value === status);
  return (
    <Badge className={`text-[10px] px-1.5 py-0 font-semibold border ${opt?.color ?? ""}`}>
      {opt?.label ?? status}
    </Badge>
  );
}

function jurisdictionBadge(jur: string) {
  const colorMap: Record<string, string> = {
    F: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    S: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300",
    L: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    "F/S": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
    "F/S/L": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    Corporate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    Voluntary: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300",
  };
  return (
    <Badge className={`text-[10px] px-1.5 py-0 font-bold border ${colorMap[jur] ?? "bg-muted text-muted-foreground border-border"}`}>
      {jur}
    </Badge>
  );
}

/* ─── OSHA / ISO 45001 Starter Library ──────────────────── */
type StarterItem = Omit<IsoComplianceObligation, "id" | "userId" | "isoProjectId" | "createdAt" | "updatedAt">;
const OSHA_STARTER_LIBRARY: StarterItem[] = [
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Injury & Illness Recordkeeping (OSHA 300/300A/301)",
    citationSource: "29 CFR 1904",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Employers with 10+ employees in covered industries must maintain OSHA 300 logs, OSHA 301 incident reports, and post the OSHA 300A annual summary from Feb 1 – Apr 30. Severe injuries (hospitalization, amputation, loss of eye) and fatalities must be reported to OSHA within specified timeframes.",
    facilityAction: "Maintain OSHA 300/301 logs, post 300A, and report severe injuries/fatalities to OSHA within 24/8 hours.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "OSHA 300 Log, 300A Annual Summary, 301 Incident Reports (retained 5 years)",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Emergency Action Plan (EAP)",
    citationSource: "29 CFR 1910.38",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Employers with 10+ employees must maintain a written Emergency Action Plan covering evacuation procedures, escape routes, employee accounting, and emergency contacts. Employers with fewer than 10 employees may communicate the plan orally.",
    facilityAction: "Maintain written EAP, post escape routes, conduct regular drills, train all employees.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Written EAP, training records, drill records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Fire Prevention Plan",
    citationSource: "29 CFR 1910.39",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Facilities must have a Fire Prevention Plan identifying fire hazards, fuel sources, and procedures for controlling accumulations of flammable materials. Employees must be informed of fire hazards and plan procedures.",
    facilityAction: "Maintain written Fire Prevention Plan; train employees on fire hazards and housekeeping procedures.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Written Fire Prevention Plan, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Hazard Communication (HazCom / GHS) — OH&S",
    citationSource: "29 CFR 1910.1200",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Employers must maintain a written Hazard Communication Program, provide GHS-compliant Safety Data Sheets for all hazardous chemicals, ensure proper container labeling, and train employees on chemical hazards. This is both an EMS and OH&S requirement.",
    facilityAction: "Maintain written HazCom Program, SDS binder, ensure GHS labeling, document employee training.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Written HazCom program, SDS files, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Control of Hazardous Energy — Lockout/Tagout (LOTO)",
    citationSource: "29 CFR 1910.147",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Facilities where employees service or maintain equipment must have a written Energy Control Program, machine-specific LOTO procedures, and provide LOTO hardware. Authorized and affected employees must be trained. Annual audits of each procedure are required.",
    facilityAction: "Maintain written LOTO program, machine-specific procedures, hardware; train employees; conduct annual audits.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Written Energy Control Program, machine procedures, training records, annual audit certifications",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Permit-Required Confined Spaces (PRCS)",
    citationSource: "29 CFR 1910.146",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Facilities with permit-required confined spaces (spaces with serious safety/health hazards) must implement a written PRCS Program, use entry permits, train entrants/attendants/supervisors, and ensure rescue capability before each entry.",
    facilityAction: "Survey and classify confined spaces, maintain written PRCS program, use entry permits, train employees, establish rescue procedures.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Confined space inventory, PRCS program, completed entry permits (1 year), training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Machine Guarding — General Industry",
    citationSource: "29 CFR 1910.212",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "All machinery with moving parts that present a hazard must be guarded to prevent employee contact. Guards must be secure and not create additional hazards. Employees must be trained on guard use and prohibited from bypassing guards.",
    facilityAction: "Audit machinery for guarding adequacy, install/repair guards, train employees, conduct regular inspections.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Machine guarding inspection records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Personal Protective Equipment (PPE) Program",
    citationSource: "29 CFR 1910.132",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Employers must conduct a written workplace hazard assessment to determine necessary PPE, provide appropriate PPE at no cost, and train employees on PPE use, care, and limitations. Training must be documented.",
    facilityAction: "Conduct written PPE hazard assessment, provide PPE at no cost, document employee PPE training.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Written hazard assessment certification, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Respiratory Protection Program",
    citationSource: "29 CFR 1910.134",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Facilities where respirators are required or voluntarily used must have a written Respiratory Protection Program including medical evaluations, fit testing, training, and respirator maintenance. A qualified program administrator must oversee the program.",
    facilityAction: "Maintain written Respiratory Protection Program, conduct medical evaluations and fit testing, train respirator users, maintain records.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Written program, medical evaluation records, fit test records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Hearing Conservation Program",
    citationSource: "29 CFR 1910.95",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Facilities with employees exposed at or above 85 dBA (8-hr TWA) must implement a Hearing Conservation Program including noise monitoring, audiometric testing, hearing protection, training, and recordkeeping.",
    facilityAction: "Conduct noise monitoring, enroll exposed employees in HCP, provide audiometric testing, supply hearing protection, train employees annually.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Noise exposure records (2 years), audiometric test records (duration of employment + 30 years), training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Electrical Safety — General Industry",
    citationSource: "29 CFR 1910 Subpart S (1910.302–399)",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "All electrical installations must meet the National Electrical Code (NFPA 70) requirements. Qualified electrical workers must use appropriate PPE and safe work practices. Electrical panels must be labeled and accessible. Arc flash hazards must be assessed and controlled.",
    facilityAction: "Ensure electrical installations comply with NEC, train qualified electrical workers, label panels, post arc flash hazard analysis, provide appropriate PPE.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Electrical inspection records, arc flash study, training records for qualified electrical workers",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Powered Industrial Trucks — Forklift Safety",
    citationSource: "29 CFR 1910.178",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Operators of powered industrial trucks (forklifts, reach trucks, pallet jacks) must be evaluated and certified as competent. Certification must include truck-specific and workplace-specific training. Pre-shift inspections are required. Re-evaluation is required at least every 3 years.",
    facilityAction: "Train and certify all PIT operators, conduct pre-shift inspections, re-evaluate operators every 3 years or after unsafe operation observed.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Operator training/certification records, pre-shift inspection logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Walking-Working Surfaces — Slips, Trips & Falls",
    citationSource: "29 CFR 1910 Subpart D (1910.21–.30)",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Floors, aisles, stairways, and elevated work surfaces must be maintained in safe condition. Floor openings must be guarded. Fixed ladders and stairs must meet OSHA specifications. Fall protection systems are required for unprotected edges and elevated work.",
    facilityAction: "Maintain clean, dry, unobstructed walking surfaces; guard floor openings; ensure ladders/stairs meet OSHA specs; inspect and repair hazards promptly.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Inspection records, fall hazard assessments, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "First Aid & Medical Services",
    citationSource: "29 CFR 1910.151",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "In the absence of an infirmary, clinic, or hospital near the facility, an employer must ensure that a person or persons are adequately trained to render first aid. Adequate first aid supplies must be readily available.",
    facilityAction: "Train and maintain certified first aid/CPR responders; maintain stocked first aid kit(s); ensure AED availability where applicable.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "First aid training records (AED/CPR certifications), first aid kit inspection logs",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Portable Fire Extinguishers",
    citationSource: "29 CFR 1910.157",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "If employees are expected to use portable fire extinguishers, they must be trained in their use annually. Extinguishers must be provided, mounted, inspected monthly, and maintained annually by a qualified person.",
    facilityAction: "Provide and mount appropriate fire extinguishers; conduct monthly visual inspections; annual professional maintenance; train employees annually.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Monthly inspection tags/logs, annual maintenance records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Bloodborne Pathogens (BBP)",
    citationSource: "29 CFR 1910.1030",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Facilities with employees reasonably anticipated to have occupational exposure to blood or other potentially infectious materials (OPIM) must maintain a written Exposure Control Plan, implement engineering and work practice controls, provide PPE, offer hepatitis B vaccination, and conduct annual training.",
    facilityAction: "Maintain written Exposure Control Plan; offer Hep B vaccine; provide PPE; conduct annual BBP training for exposed employees.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Exposure Control Plan, vaccination records, medical records (30 years), training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Compressed Gas Cylinders — Storage & Handling",
    citationSource: "29 CFR 1910.101",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Compressed gas cylinders must be handled and stored in upright position with caps on when not in use. Cylinders must be secured to prevent falling. Oxygen and fuel gas cylinders must be stored separately with at least 20 feet or a 5-foot non-combustible barrier between them.",
    facilityAction: "Secure all compressed gas cylinders; store oxygen and fuel gas separately; train employees on safe handling procedures; inspect cylinders regularly.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Cylinder inspection records, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Welding, Cutting & Brazing Safety",
    citationSource: "29 CFR 1910.252–255",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "Welding, cutting, and brazing operations require appropriate ventilation, fire protection, PPE (face shields, welding gloves, flame-resistant clothing), and hot work permit procedures in fire-hazardous areas. Combustible materials must be moved or shielded.",
    facilityAction: "Implement hot work permit system; ensure proper ventilation; provide welding PPE; train welders on safe practices.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Hot work permits, training records, ventilation assessments",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "Ergonomics — Musculoskeletal Hazard Prevention",
    citationSource: "OSH Act Section 5(a)(1) — General Duty Clause",
    jurisdictionLevel: "F", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "While OSHA's ergonomics rule was withdrawn in 2001, employers remain responsible under the General Duty Clause for addressing recognized ergonomic hazards that cause or are likely to cause serious harm. ISO 45001 6.1.2 specifically requires identification of musculoskeletal hazards.",
    facilityAction: "Conduct ergonomic risk assessments for repetitive motion, heavy lifting, awkward postures; implement engineering and administrative controls; train employees.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "Ergonomic risk assessments, incident/injury records related to MSDs, training records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
  {
    aspectCategory: "Health and Safety Requirements",
    requirementName: "ISO 45001 OH&S Management System Certification",
    citationSource: "ISO 45001:2018",
    jurisdictionLevel: "Voluntary", state: null, county: null, standard: "ISO 45001",
    descriptionOfRequirement: "ISO 45001 is a voluntary OH&S management system standard requiring hazard identification, risk assessment, legal compliance evaluation, operational controls, incident investigation, and continual improvement. Certification requires third-party audit by an accredited certification body.",
    facilityAction: "Maintain certified ISO 45001 EMS; complete surveillance audits; address nonconformities; conduct annual management reviews.",
    complianceStatus: "compliant", permitRequired: false, permitRenewalFrequency: null,
    recordsToMaintain: "ISO 45001 certificate, audit reports, management review minutes, corrective action records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: null,
  },
];

/* ─── Empty form helpers ─────────────────────────────────── */
const emptyObligation = (): Partial<IsoComplianceObligation> => ({
  aspectCategory: "Other",
  requirementName: "",
  citationSource: "",
  jurisdictionLevel: "F",
  state: "",
  county: "",
  descriptionOfRequirement: "",
  facilityAction: "",
  complianceStatus: "compliant",
  permitRequired: false,
  permitRenewalFrequency: "",
  recordsToMaintain: "",
  responsiblePerson: "",
  dateLastReviewed: "",
  nextReviewDate: "",
  actionRequired: "",
  notes: "",
  standard: "ISO 14001",
});

const emptyEvaluation = (obligationId?: number): Partial<IsoComplianceEvaluation> => ({
  complianceObligationId: obligationId,
  evaluationDate: new Date().toISOString().split("T")[0],
  evaluatedBy: "",
  complianceStatus: "compliant",
  findings: "",
  evidenceDescription: "",
  actionRequired: "",
  dueDate: "",
  closedDate: "",
});

/* ─── Main Component ─────────────────────────────────────── */
export default function ComplianceObligationsModule({
  isoProjectId,
  project,
}: {
  isoProjectId?: number;
  project?: IsoProject | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperadmin = !!(user as any)?.claims?.isSuperadmin;
  const isMedDevice = !!(project?.standard?.includes("13485")) || isSuperadmin;

  type TabKey = "register" | "evaluation" | "md_evidence";
  const [activeTab, setActiveTab] = useState<TabKey>("register");

  // Import MD starter library
  const [mdImportLoading, setMdImportLoading] = useState(false);
  async function importMdLibrary() {
    setMdImportLoading(true);
    try {
      const body: any = {};
      if (isoProjectId) body.isoProjectId = isoProjectId;
      const r = await apiRequest("POST", "/api/iso-compliance-obligations/bulk-md", body) as any;
      const data = typeof r.json === "function" ? await r.json() : r;
      toast({ title: "MD Starter Library Imported", description: `${data.created?.length ?? 0} obligations added, ${data.skipped ?? 0} already present` });
      qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] });
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
    setMdImportLoading(false);
  }

  // Register filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStandard, setFilterStandard] = useState<string>("all");
  const [starterLibStandard, setStarterLibStandard] = useState<"all" | "ISO 14001" | "ISO 45001">("all");
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Dialogs
  const [obligationDialog, setObligationDialog] = useState(false);
  const [evaluationDialog, setEvaluationDialog] = useState(false);
  const [editObligation, setEditObligation] = useState<IsoComplianceObligation | null>(null);
  const [editEvaluation, setEditEvaluation] = useState<IsoComplianceEvaluation | null>(null);
  const [obligationForm, setObligationForm] = useState<Partial<IsoComplianceObligation>>(emptyObligation());
  const [evaluationForm, setEvaluationForm] = useState<Partial<IsoComplianceEvaluation>>(emptyEvaluation());
  const [selectedObligationId, setSelectedObligationId] = useState<number | "all">("all");

  // Starter library
  const [starterDialog, setStarterDialog] = useState(false);
  const [selectedStarters, setSelectedStarters] = useState<Set<string>>(new Set());
  const [starterSearch, setStarterSearch] = useState("");

  // 6.1.3 Applicability Screener
  const [applicabilityItem, setApplicabilityItem] = useState<{
    requirementName: string;
    aspectCategory: string;
    citationSource?: string | null;
    descriptionOfRequirement?: string | null;
  } | null>(null);

  // 9.1.2 Evaluation Wizard
  const [evalWizardObligation, setEvalWizardObligation] = useState<IsoComplianceObligation | null>(null);

  // Ask Corey — Identify Requirements by Jurisdiction
  const [coreyDialog, setCoreyDialog] = useState(false);
  const [coreyForm, setCoreyForm] = useState({ state: "", county: "", city: "", industry: "", naicsCode: "", processes: "", facilitySize: "" });
  const [coreyResponse, setCoreyResponse] = useState("");
  const [coreyStreaming, setCoreyStreaming] = useState(false);
  const coreyScrollRef = useRef<HTMLDivElement>(null);
  const coreyAbortRef = useRef<AbortController | null>(null);

  const qs = isoProjectId ? `?isoProjectId=${isoProjectId}` : "";

  const { data: obligations = [], isLoading } = useQuery<IsoComplianceObligation[]>({
    queryKey: ["/api/iso-compliance-obligations", isoProjectId],
    queryFn: () => fetch(`/api/iso-compliance-obligations${qs}`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: evaluations = [] } = useQuery<IsoComplianceEvaluation[]>({
    queryKey: ["/api/iso-compliance-evaluations", selectedObligationId],
    queryFn: () => {
      const qstr = selectedObligationId !== "all" ? `?obligationId=${selectedObligationId}` : "";
      return fetch(`/api/iso-compliance-evaluations${qstr}`, { credentials: "include" }).then(r => r.json());
    },
  });

  const { data: companyProfile } = useQuery<any>({
    queryKey: ["/api/company-profile"],
    queryFn: () => fetch("/api/company-profile", { credentials: "include" }).then(r => r.json()),
  });
  // Normalize org state to canonical name ("Michigan" | "Ohio" | other | null)
  const orgState: string | null = useMemo(() => {
    const raw = (companyProfile?.state ?? "").trim().toLowerCase();
    if (!raw) return null;
    if (raw === "mi" || raw === "michigan") return "Michigan";
    if (raw === "oh" || raw === "ohio") return "Ohio";
    return raw; // some other state — will exclude all pre-built state starters
  }, [companyProfile?.state]);

  const createObligationMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iso-compliance-obligations", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] }); setObligationDialog(false); toast({ title: "Requirement added" }); },
    onError: () => toast({ title: "Error", description: "Could not save", variant: "destructive" }),
  });

  const updateObligationMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/iso-compliance-obligations/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] }); setObligationDialog(false); toast({ title: "Requirement updated" }); },
    onError: () => toast({ title: "Error", description: "Could not update", variant: "destructive" }),
  });

  const deleteObligationMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-compliance-obligations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] }); toast({ title: "Requirement deleted" }); },
  });

  const createEvaluationMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iso-compliance-evaluations", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-evaluations"] }); setEvaluationDialog(false); toast({ title: "Evaluation logged" }); },
    onError: () => toast({ title: "Error", description: "Could not save evaluation", variant: "destructive" }),
  });

  const updateEvaluationMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/iso-compliance-evaluations/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-evaluations"] }); setEvaluationDialog(false); toast({ title: "Evaluation updated" }); },
  });

  const deleteEvaluationMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/iso-compliance-evaluations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/iso-compliance-evaluations"] }); toast({ title: "Evaluation deleted" }); },
  });

  const bulkCreateMut = useMutation({
    mutationFn: (items: any[]) => apiRequest("POST", "/api/iso-compliance-obligations/bulk", items.map(i => ({ ...i, isoProjectId }))),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["/api/iso-compliance-obligations"] });
      setStarterDialog(false);
      setSelectedStarters(new Set());
      const added = data?.created?.length ?? 0;
      const skipped = data?.skipped ?? 0;
      const msg = skipped > 0
        ? `${added} added · ${skipped} already in register (skipped)`
        : `${added} requirements added to your register`;
      toast({ title: msg });
    },
    onError: () => toast({ title: "Error", description: "Could not load starter library", variant: "destructive" }),
  });

  // Filtered obligations
  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
      if (filterCategory !== "all" && o.aspectCategory !== filterCategory) return false;
      if (filterJurisdiction !== "all" && o.jurisdictionLevel !== filterJurisdiction) return false;
      if (filterStatus !== "all" && o.complianceStatus !== filterStatus) return false;
      if (filterStandard !== "all" && o.standard !== filterStandard) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          o.requirementName.toLowerCase().includes(q) ||
          (o.citationSource ?? "").toLowerCase().includes(q) ||
          (o.descriptionOfRequirement ?? "").toLowerCase().includes(q) ||
          (o.facilityAction ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [obligations, filterCategory, filterJurisdiction, filterStatus, filterStandard, searchText]);

  // Summary counts
  const counts = useMemo(() => ({
    total: obligations.length,
    compliant: obligations.filter(o => o.complianceStatus === "compliant").length,
    nonCompliant: obligations.filter(o => o.complianceStatus === "non_compliant").length,
    underReview: obligations.filter(o => o.complianceStatus === "under_review").length,
  }), [obligations]);

  // Build state-filtered starter groups — only show state reqs that match the org's state
  const { groupsWithOffsets, allStarters } = useMemo(() => {
    const base: Array<{ label: string; emoji: string; items: StarterItem[]; standard: "ISO 14001" | "ISO 45001" }> = [
      { label: "Federal Environmental Requirements", emoji: "🇺🇸", items: FEDERAL_STARTER_LIBRARY as StarterItem[], standard: "ISO 14001" },
    ];
    if (orgState === null || orgState === "Michigan") {
      base.push({ label: "Michigan State Requirements", emoji: "🗺️", items: MICHIGAN_STARTER as StarterItem[], standard: "ISO 14001" });
    }
    if (orgState === null || orgState === "Ohio") {
      base.push({ label: "Ohio State Requirements", emoji: "🗺️", items: OHIO_STARTER as StarterItem[], standard: "ISO 14001" });
    }
    base.push({ label: "Corporate, Customer & Other Requirements", emoji: "🏢", items: CORPORATE_STARTER as StarterItem[], standard: "ISO 14001" });
    base.push({ label: "OSHA Safety Requirements (ISO 45001)", emoji: "🦺", items: OSHA_STARTER_LIBRARY, standard: "ISO 45001" });

    let offset = 0;
    const merged: StarterItem[] = [];
    const groupsWithOffsets = base.map(g => {
      // Tag each item with the group's standard so bulk import picks it up
      const taggedItems = g.items.map(item => ({ ...item, standard: item.standard ?? g.standard }));
      const result = { ...g, items: taggedItems, offset };
      merged.push(...taggedItems);
      offset += taggedItems.length;
      return result;
    });
    return { groupsWithOffsets, allStarters: merged };
  }, [orgState]);

  // Track which starter items are already in the register (by requirement name)
  const existingObligationNames = useMemo(
    () => new Set((obligations as IsoComplianceObligation[]).map(o => o.requirementName)),
    [obligations]
  );

  async function askCorey() {
    if (!coreyForm.state.trim()) {
      toast({ title: "State required", description: "Please enter your facility's state to get started.", variant: "destructive" });
      return;
    }
    setCoreyResponse("");
    setCoreyStreaming(true);
    const abort = new AbortController();
    coreyAbortRef.current = abort;
    try {
      const res = await fetch("/api/iso-compliance-obligations/identify-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(coreyForm),
        signal: abort.signal,
      });
      if (!res.ok) throw new Error("Request failed");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.done) { setCoreyStreaming(false); return; }
            if (parsed.content) {
              setCoreyResponse(prev => {
                const next = prev + parsed.content;
                setTimeout(() => {
                  if (coreyScrollRef.current) coreyScrollRef.current.scrollTop = coreyScrollRef.current.scrollHeight;
                }, 0);
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") toast({ title: "Error", description: "Corey could not generate the analysis. Please try again.", variant: "destructive" });
    } finally {
      setCoreyStreaming(false);
    }
  }

  function openAddObligation() {
    setEditObligation(null);
    setObligationForm({ ...emptyObligation(), isoProjectId });
    setObligationDialog(true);
  }

  function openEditObligation(o: IsoComplianceObligation) {
    setEditObligation(o);
    setObligationForm({ ...o });
    setObligationDialog(true);
  }

  function saveObligation() {
    const payload = { ...obligationForm, isoProjectId: obligationForm.isoProjectId ?? isoProjectId };
    if (editObligation) {
      updateObligationMut.mutate({ id: editObligation.id, data: payload });
    } else {
      createObligationMut.mutate(payload);
    }
  }

  function openAddEvaluation(obligationId?: number, prefillFindings?: string) {
    setEditEvaluation(null);
    const base = emptyEvaluation(obligationId);
    setEvaluationForm(prefillFindings ? { ...base, findings: prefillFindings } : base);
    setEvaluationDialog(true);
  }

  function openEditEvaluation(e: IsoComplianceEvaluation) {
    setEditEvaluation(e);
    setEvaluationForm({ ...e });
    setEvaluationDialog(true);
  }

  function saveEvaluation() {
    if (editEvaluation) {
      updateEvaluationMut.mutate({ id: editEvaluation.id, data: evaluationForm });
    } else {
      createEvaluationMut.mutate(evaluationForm);
    }
  }

  function toggleRow(id: number) {
    setExpandedRows(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function loadSelectedStarters() {
    const items = allStarters.filter((_, i) => selectedStarters.has(String(i)));
    bulkCreateMut.mutate(items);
  }

  const obligationName = (id: number) => obligations.find(o => o.id === id)?.requirementName ?? `Requirement #${id}`;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 bg-white dark:bg-card px-6 py-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Shield className="w-6 h-6 text-accent" />
              <h1 className="text-xl font-black text-primary">Compliance Obligations Register</h1>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-xs font-bold">ISO 6.1.3 + 9.1.2</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Legal and other requirements — EHS obligations (ISO 14001 Environmental + ISO 45001 OH&S) applicable to your organization's scope.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {isMedDevice && (
              <Button size="sm" variant="outline" className="gap-1.5 text-sm border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20" onClick={importMdLibrary} disabled={mdImportLoading} data-testid="button-import-md-library">
                {mdImportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />} Import ISO 13485 Library
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5 text-sm border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/20" onClick={() => { setCoreyResponse(""); setCoreyDialog(true); }} data-testid="button-ask-corey-identify">
              <Sparkles className="w-4 h-4" /> Ask Corey to Identify
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-sm" onClick={() => {
              // Auto-preselect only items NOT already in the register
              const newIdxs = new Set(
                allStarters
                  .map((item, i) => ({ item, i }))
                  .filter(({ item }) => !existingObligationNames.has(item.requirementName))
                  .map(({ i }) => String(i))
              );
              setSelectedStarters(newIdxs);
              setStarterDialog(true);
            }} data-testid="button-load-starter-library">
              <Upload className="w-4 h-4" /> Load Starter Library
            </Button>
            <Button size="sm" className="gap-1.5 text-sm bg-accent hover:bg-accent/90 text-white" onClick={openAddObligation} data-testid="button-add-compliance-obligation">
              <Plus className="w-4 h-4" /> Add Requirement
            </Button>
          </div>
        </div>

        {/* Summary Row */}
        <div className="flex gap-4 mt-4">
          {[
            { label: "Total", value: counts.total, color: "text-primary" },
            { label: "Compliant", value: counts.compliant, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Non-Compliant", value: counts.nonCompliant, color: "text-red-600 dark:text-red-400" },
            { label: "Under Review", value: counts.underReview, color: "text-amber-600 dark:text-amber-400" },
          ].map(s => (
            <div key={s.label} className="bg-muted/40 border border-border/50 rounded-lg px-4 py-3 text-center min-w-[88px]">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground font-semibold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EMS Environmental Suite Cross-Promo Banner ── */}
      <div className="mx-6 mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-950/20 dark:via-card dark:to-slate-900/10 px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">EMS Environmental Suite</span>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Bundle</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            This register identifies <strong>what</strong> you must comply with (6.1.3). The <strong>Environmental Hub</strong> tracks the operational records — inspections, manifests, monitoring logs — that <strong>prove</strong> you are. Bundle both for complete ISO 14001 conformance.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href="/env-compliance-hub" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1.5 text-sm border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" data-testid="button-compliance-module-env-hub-promo">
              <Leaf className="w-4 h-4" /> Environmental Hub
            </Button>
          </a>
          <a href="mailto:team@corecompliancehub.com?subject=EMS Environmental Suite Bundle Inquiry">
            <Button size="sm" className="gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-compliance-module-bundle-contact">
              <ArrowRight className="w-4 h-4" /> Bundle Pricing
            </Button>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60 bg-white dark:bg-card px-6 shrink-0 mt-4">
        <div className="flex gap-0 overflow-x-auto">
          {[
            { key: "register",      label: "Obligations Register", icon: FileText },
            { key: "evaluation",    label: "Evaluation Log",       icon: ClipboardCheck },
            ...(isMedDevice ? [
              { key: "md_evidence", label: "MD Evidence", icon: Database },
            ] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              data-testid={`tab-compliance-${key}`}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {key.startsWith("md_") && <span className="text-[9px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold ml-0.5">ISO 13485</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Register Tab */}
      {activeTab === "register" && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-3 border-b border-border/40 bg-muted/20 shrink-0 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search requirements..."
                className="h-9 pl-9 text-sm"
                data-testid="input-compliance-search"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9 text-sm w-[190px]" data-testid="select-filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ASPECT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterJurisdiction} onValueChange={setFilterJurisdiction}>
              <SelectTrigger className="h-9 text-sm w-[160px]" data-testid="select-filter-jurisdiction">
                <SelectValue placeholder="All Jurisdictions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {JURISDICTION_OPTIONS.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-sm w-[150px]" data-testid="select-filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStandard} onValueChange={setFilterStandard}>
              <SelectTrigger className="h-9 text-sm w-[170px]" data-testid="select-filter-standard">
                <SelectValue placeholder="All Standards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Standards</SelectItem>
                {STANDARD_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">{filteredObligations.length} of {obligations.length}</span>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground text-sm">Loading register…</div>
            ) : filteredObligations.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground mb-1">No requirements found</p>
                <p className="text-xs text-muted-foreground mb-4">Add requirements manually or load the starter library to populate your register.</p>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => {
                  const newIdxs = new Set(
                    allStarters
                      .map((item, i) => ({ item, i }))
                      .filter(({ item }) => !existingObligationNames.has(item.requirementName))
                      .map(({ i }) => String(i))
                  );
                  setSelectedStarters(newIdxs);
                  setStarterDialog(true);
                }}>
                  <Upload className="w-3.5 h-3.5" /> Load Starter Library
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredObligations.map(o => {
                  const expanded = expandedRows.has(o.id);
                  return (
                    <div key={o.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-compliance-${o.id}`}>
                      {/* Row Summary */}
                      <div className="px-6 py-4 flex items-start gap-3">
                        <button
                          className="mt-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                          onClick={() => toggleRow(o.id)}
                          data-testid={`button-expand-row-${o.id}`}
                        >
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="text-base font-semibold text-primary leading-tight">{o.requirementName}</span>
                            {jurisdictionBadge(o.jurisdictionLevel)}
                            {statusBadge(o.complianceStatus)}
                            {o.permitRequired && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 text-xs px-1.5 py-0 font-semibold border">
                                Permit Req.
                              </Badge>
                            )}
                            {o.standard && o.standard !== "ISO 14001" && (
                              <Badge className={`text-xs px-1.5 py-0 font-semibold border ${
                                o.standard === "ISO 45001"
                                  ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
                                  : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300"
                              }`}>
                                {o.standard}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">{o.aspectCategory}</span>
                            {o.citationSource && (
                              <span className="text-xs font-mono text-accent/80">{o.citationSource}</span>
                            )}
                            {o.state && (
                              <span className="text-xs text-muted-foreground">State: {o.state}{o.county ? ` — ${o.county} Co.` : ""}</span>
                            )}
                            {o.responsiblePerson && (
                              <span className="text-xs text-muted-foreground">Owner: {o.responsiblePerson}</span>
                            )}
                            {o.dateLastReviewed && (
                              <span className="text-xs text-muted-foreground">Last reviewed: {o.dateLastReviewed}</span>
                            )}
                          </div>
                          {o.actionRequired && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{o.actionRequired}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { openAddEvaluation(o.id); setActiveTab("evaluation"); }}
                            className="text-muted-foreground hover:text-accent p-1.5 rounded hover:bg-accent/10 transition-colors"
                            title="Log evaluation"
                            data-testid={`button-log-eval-${o.id}`}
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditObligation(o)}
                            className="text-muted-foreground hover:text-primary p-1.5 rounded hover:bg-muted transition-colors"
                            title="Edit"
                            data-testid={`button-edit-obligation-${o.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this requirement?")) deleteObligationMut.mutate(o.id); }}
                            className="text-muted-foreground hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                            data-testid={`button-delete-obligation-${o.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {expanded && (
                        <div className="px-6 pb-5 bg-muted/10 border-t border-border/30">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4">
                            {o.descriptionOfRequirement && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Description of Requirement</p>
                                <p className="text-sm text-primary leading-relaxed">{o.descriptionOfRequirement}</p>
                              </div>
                            )}
                            {o.facilityAction && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Facility Action</p>
                                <p className="text-sm text-primary leading-relaxed">{o.facilityAction}</p>
                              </div>
                            )}
                            {o.recordsToMaintain && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Records to Maintain</p>
                                <p className="text-sm text-primary">{o.recordsToMaintain}</p>
                              </div>
                            )}
                            {o.permitRequired && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Permit</p>
                                <p className="text-sm text-primary">Required — {o.permitRenewalFrequency ?? "Review frequency not set"}</p>
                              </div>
                            )}
                            {o.nextReviewDate && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Next Review Date</p>
                                <p className="text-sm text-primary">{o.nextReviewDate}</p>
                              </div>
                            )}
                            {o.notes && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Notes</p>
                                <p className="text-sm text-muted-foreground italic">{o.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* 6.1.3 / 9.1.2 Action Bar */}
                          <div className="mt-4 pt-3 border-t border-border/30 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Compliance Tools</span>
                            </div>
                            <button
                              onClick={() => setEvalWizardObligation(o)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent text-xs font-semibold transition-colors"
                              data-testid={`button-eval-wizard-${o.id}`}
                              title="ISO 9.1.2 — Evaluate whether you are meeting this requirement"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Evaluate Compliance
                              <Badge className="text-[9px] px-1 py-0 h-4 bg-accent/10 text-accent border-accent/30 border ml-0.5">9.1.2</Badge>
                            </button>
                            <button
                              onClick={() => setApplicabilityItem({
                                requirementName: o.requirementName,
                                aspectCategory: o.aspectCategory,
                                citationSource: o.citationSource,
                                descriptionOfRequirement: o.descriptionOfRequirement,
                              })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300/60 bg-blue-50/50 hover:bg-blue-100/60 dark:border-blue-700/40 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs font-semibold transition-colors"
                              data-testid={`button-applicability-${o.id}`}
                              title="ISO 6.1.3 — Screen whether this requirement applies to your facility"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              Applicability Screen
                              <Badge className="text-[9px] px-1 py-0 h-4 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 border ml-0.5">6.1.3</Badge>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Evaluation Log Tab */}
      {activeTab === "evaluation" && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-border/40 bg-muted/20 shrink-0 flex items-center gap-3 flex-wrap">
            <Select value={String(selectedObligationId)} onValueChange={v => setSelectedObligationId(v === "all" ? "all" : parseInt(v))}>
              <SelectTrigger className="h-8 text-xs w-[280px]" data-testid="select-obligation-filter">
                <SelectValue placeholder="All Requirements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requirements</SelectItem>
                {obligations.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.requirementName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-accent hover:bg-accent/90 text-white ml-auto"
              onClick={() => openAddEvaluation(selectedObligationId !== "all" ? selectedObligationId : undefined)}
              data-testid="button-add-evaluation"
            >
              <Plus className="w-3.5 h-3.5" /> Log Evaluation
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {evaluations.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-base font-semibold text-muted-foreground mb-1">No evaluations logged</p>
                <p className="text-sm text-muted-foreground mb-4">ISO 14001 9.1.2 requires periodic compliance evaluation records. Log an evaluation to start your audit trail.</p>
                <Button size="sm" variant="outline" className="gap-1.5 text-sm" onClick={() => openAddEvaluation()}>
                  <Plus className="w-4 h-4" /> Log First Evaluation
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {evaluations.map(ev => (
                  <div key={ev.id} className="px-6 py-5 hover:bg-muted/20 transition-colors" data-testid={`row-evaluation-${ev.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-base font-semibold text-primary truncate">{obligationName(ev.complianceObligationId)}</span>
                          {evalStatusBadge(ev.complianceStatus)}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-2.5">
                          <span>Evaluated: {ev.evaluationDate}</span>
                          {ev.evaluatedBy && <span>By: {ev.evaluatedBy}</span>}
                          {ev.dueDate && <span className="text-amber-600 dark:text-amber-400">Due: {ev.dueDate}</span>}
                          {ev.closedDate && <span className="text-emerald-600 dark:text-emerald-400">Closed: {ev.closedDate}</span>}
                        </div>
                        {ev.findings && (
                          <div className="mb-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Findings</p>
                            <p className="text-sm text-primary">{ev.findings}</p>
                          </div>
                        )}
                        {ev.evidenceDescription && (
                          <div className="mb-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Evidence</p>
                            <p className="text-sm text-primary">{ev.evidenceDescription}</p>
                          </div>
                        )}
                        {ev.actionRequired && (
                          <div className="flex items-start gap-1.5 mt-1">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">{ev.actionRequired}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditEvaluation(ev)}
                          className="text-muted-foreground hover:text-primary p-1.5 rounded hover:bg-muted transition-colors"
                          data-testid={`button-edit-evaluation-${ev.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this evaluation?")) deleteEvaluationMut.mutate(ev.id); }}
                          className="text-muted-foreground hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
                          data-testid={`button-delete-evaluation-${ev.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* ── Obligation Add/Edit Dialog ─────────────────────── */}
      <Dialog open={obligationDialog} onOpenChange={setObligationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editObligation ? "Edit Requirement" : "Add Compliance Requirement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Requirement Name *</Label>
                <Input
                  value={obligationForm.requirementName ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, requirementName: e.target.value }))}
                  placeholder="e.g., Toxic Chemical Release (Form R)"
                  className="mt-1"
                  data-testid="input-obligation-name"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Environmental Aspect Category</Label>
                <Select value={obligationForm.aspectCategory ?? "Other"} onValueChange={v => setObligationForm(f => ({ ...f, aspectCategory: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-obligation-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Management Standard</Label>
                <Select value={obligationForm.standard ?? "ISO 14001"} onValueChange={v => setObligationForm(f => ({ ...f, standard: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-obligation-standard">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Citation / Source</Label>
                <Input
                  value={obligationForm.citationSource ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, citationSource: e.target.value }))}
                  placeholder="e.g., 40 CFR Part 372"
                  className="mt-1"
                  data-testid="input-obligation-citation"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Jurisdiction Level (F/S/L)</Label>
                <Select value={obligationForm.jurisdictionLevel ?? "F"} onValueChange={v => setObligationForm(f => ({ ...f, jurisdictionLevel: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-obligation-jurisdiction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JURISDICTION_OPTIONS.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Compliance Status</Label>
                <Select value={obligationForm.complianceStatus ?? "compliant"} onValueChange={v => setObligationForm(f => ({ ...f, complianceStatus: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-obligation-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">State (if applicable)</Label>
                <Input
                  value={obligationForm.state ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="e.g., Michigan, Ohio"
                  className="mt-1"
                  data-testid="input-obligation-state"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">County (if Local)</Label>
                <Input
                  value={obligationForm.county ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, county: e.target.value }))}
                  placeholder="e.g., Ingham, Butler"
                  className="mt-1"
                  data-testid="input-obligation-county"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Description of Requirement</Label>
                <Textarea
                  value={obligationForm.descriptionOfRequirement ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, descriptionOfRequirement: e.target.value }))}
                  placeholder="Describe what this regulation requires..."
                  className="mt-1 text-sm resize-none"
                  rows={3}
                  data-testid="textarea-obligation-description"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Facility Action (What We Do to Comply)</Label>
                <Textarea
                  value={obligationForm.facilityAction ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, facilityAction: e.target.value }))}
                  placeholder="Describe your organization's specific compliance actions..."
                  className="mt-1 text-sm resize-none"
                  rows={3}
                  data-testid="textarea-obligation-action"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Records to Maintain</Label>
                <Input
                  value={obligationForm.recordsToMaintain ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, recordsToMaintain: e.target.value }))}
                  placeholder="e.g., Manifests, permit, monitoring logs"
                  className="mt-1"
                  data-testid="input-obligation-records"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Permit Required?</Label>
                <Select value={obligationForm.permitRequired ? "yes" : "no"} onValueChange={v => setObligationForm(f => ({ ...f, permitRequired: v === "yes" }))}>
                  <SelectTrigger className="mt-1" data-testid="select-obligation-permit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Permit Renewal Frequency</Label>
                <Input
                  value={obligationForm.permitRenewalFrequency ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, permitRenewalFrequency: e.target.value }))}
                  placeholder="e.g., Annual, 5 years"
                  className="mt-1"
                  data-testid="input-obligation-renewal"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Responsible Person</Label>
                <Input
                  value={obligationForm.responsiblePerson ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, responsiblePerson: e.target.value }))}
                  placeholder="Name or role"
                  className="mt-1"
                  data-testid="input-obligation-responsible"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Date Last Reviewed</Label>
                <Input
                  type="date"
                  value={obligationForm.dateLastReviewed ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, dateLastReviewed: e.target.value }))}
                  className="mt-1"
                  data-testid="input-obligation-last-reviewed"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Next Review Date</Label>
                <Input
                  type="date"
                  value={obligationForm.nextReviewDate ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, nextReviewDate: e.target.value }))}
                  className="mt-1"
                  data-testid="input-obligation-next-review"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Action Required / Recent Changes</Label>
                <Input
                  value={obligationForm.actionRequired ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, actionRequired: e.target.value }))}
                  placeholder="Any pending actions or recent regulatory changes..."
                  className="mt-1"
                  data-testid="input-obligation-action-required"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Notes</Label>
                <Textarea
                  value={obligationForm.notes ?? ""}
                  onChange={e => setObligationForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="mt-1 text-sm resize-none"
                  rows={2}
                  data-testid="textarea-obligation-notes"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
              <Button variant="outline" onClick={() => setObligationDialog(false)} data-testid="button-cancel-obligation">Cancel</Button>
              <Button
                onClick={saveObligation}
                disabled={!obligationForm.requirementName || createObligationMut.isPending || updateObligationMut.isPending}
                className="bg-accent hover:bg-accent/90 text-white"
                data-testid="button-save-obligation"
              >
                {editObligation ? "Update" : "Add"} Requirement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Evaluation Add/Edit Dialog ────────────────────── */}
      <Dialog open={evaluationDialog} onOpenChange={setEvaluationDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEvaluation ? "Edit Evaluation" : "Log Compliance Evaluation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Compliance Requirement *</Label>
              <Select
                value={String(evaluationForm.complianceObligationId ?? "")}
                onValueChange={v => setEvaluationForm(f => ({ ...f, complianceObligationId: parseInt(v) }))}
              >
                <SelectTrigger className="mt-1" data-testid="select-evaluation-obligation">
                  <SelectValue placeholder="Select requirement..." />
                </SelectTrigger>
                <SelectContent>
                  {obligations.map(o => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.requirementName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Evaluation Date *</Label>
                <Input
                  type="date"
                  value={evaluationForm.evaluationDate ?? ""}
                  onChange={e => setEvaluationForm(f => ({ ...f, evaluationDate: e.target.value }))}
                  className="mt-1"
                  data-testid="input-evaluation-date"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Evaluated By</Label>
                <Input
                  value={evaluationForm.evaluatedBy ?? ""}
                  onChange={e => setEvaluationForm(f => ({ ...f, evaluatedBy: e.target.value }))}
                  placeholder="Name or role"
                  className="mt-1"
                  data-testid="input-evaluation-by"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Compliance Status *</Label>
                <Select value={evaluationForm.complianceStatus ?? "compliant"} onValueChange={v => setEvaluationForm(f => ({ ...f, complianceStatus: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-evaluation-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVAL_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Findings</Label>
                <Textarea
                  value={evaluationForm.findings ?? ""}
                  onChange={e => setEvaluationForm(f => ({ ...f, findings: e.target.value }))}
                  placeholder="Describe what was found during the evaluation..."
                  className="mt-1 text-sm resize-none"
                  rows={3}
                  data-testid="textarea-evaluation-findings"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Evidence</Label>
                <Input
                  value={evaluationForm.evidenceDescription ?? ""}
                  onChange={e => setEvaluationForm(f => ({ ...f, evidenceDescription: e.target.value }))}
                  placeholder="e.g., Permit file reviewed, inspection report #123"
                  className="mt-1"
                  data-testid="input-evaluation-evidence"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs font-semibold">Action Required</Label>
                <Input
                  value={evaluationForm.actionRequired ?? ""}
                  onChange={e => setEvaluationForm(f => ({ ...f, actionRequired: e.target.value }))}
                  placeholder="Any corrective or follow-up actions needed..."
                  className="mt-1"
                  data-testid="input-evaluation-action-required"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Due Date</Label>
                <Input
                  type="date"
                  value={evaluationForm.dueDate ?? ""}
                  onChange={e => setEvaluationForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="mt-1"
                  data-testid="input-evaluation-due-date"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Closed Date</Label>
                <Input
                  type="date"
                  value={evaluationForm.closedDate ?? ""}
                  onChange={e => setEvaluationForm(f => ({ ...f, closedDate: e.target.value }))}
                  className="mt-1"
                  data-testid="input-evaluation-closed-date"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
              <Button variant="outline" onClick={() => setEvaluationDialog(false)} data-testid="button-cancel-evaluation">Cancel</Button>
              <Button
                onClick={saveEvaluation}
                disabled={!evaluationForm.complianceObligationId || !evaluationForm.evaluationDate || createEvaluationMut.isPending || updateEvaluationMut.isPending}
                className="bg-accent hover:bg-accent/90 text-white"
                data-testid="button-save-evaluation"
              >
                {editEvaluation ? "Update" : "Log"} Evaluation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Starter Library Dialog ────────────────────────── */}
      <Dialog open={starterDialog} onOpenChange={open => { setStarterDialog(open); if (!open) setStarterSearch(""); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-0">
          {/* Fixed header area */}
          <div className="shrink-0 px-6 pt-6 pb-0 space-y-3">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" /> Load Starter Library
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Check only the requirements that apply to your facility — you do not need to add everything. Use the search box or category checkboxes to narrow the list. Everything is fully editable after import.
              </p>
              {/* State detection banner */}
              {orgState ? (
                <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800/40 px-3 py-1.5 text-[11px]">
                  <span className="text-blue-500 shrink-0">📍</span>
                  <span className="text-blue-800 dark:text-blue-300">
                    <strong>State detected: {orgState}.</strong>{" "}
                    {(orgState === "Michigan" || orgState === "Ohio")
                      ? `Only ${orgState}-specific state requirements are shown below — requirements from other states have been excluded.`
                      : "No pre-built state starter library exists for your state yet. Federal and Corporate requirements are shown. Add state-specific items manually with + Add Requirement."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-800/30 dark:border-slate-700/40 px-3 py-1.5 text-[11px]">
                  <span className="text-slate-400 shrink-0">📍</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    No state set in your Company Profile — all available state libraries are shown. Set your state in Company Profile to filter to only your jurisdiction.
                  </span>
                </div>
              )}
            </DialogHeader>

            {/* Local Requirements Note */}
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 px-3 py-2.5 flex gap-2 items-start">
              <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Local Requirements Not Pre-Loaded</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  County, city, and municipal environmental requirements vary significantly by jurisdiction and cannot be pre-populated as fixed starters. Examples include county stormwater programs, local industrial pretreatment permits, and municipal air quality rules. Add local requirements manually using the <strong>+ Add Requirement</strong> button. The Butler County (OH) stormwater entry in the Ohio group is included as a practical example of a local requirement.
                </p>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1 italic">
                  Coming soon: CCHUB Environmental Hub (Env Hub) will automatically push applicable local and regional environmental requirements to your register based on your facility's zip code and industry sector when subscribed.
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 pb-2 border-b border-border/40 flex-wrap">
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setSelectedStarters(new Set(
              allStarters.map((item, i) => ({ item, i }))
                .filter(({ item }) => !existingObligationNames.has(item.requirementName))
                .map(({ i }) => String(i))
            ))}>
              Select All New
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setSelectedStarters(new Set())}>
              Deselect All
            </Button>
            <div className="flex-1 min-w-[180px]">
              <Input
                value={starterSearch}
                onChange={e => setStarterSearch(e.target.value)}
                placeholder="Search requirements…"
                className="h-7 text-xs"
                data-testid="input-starter-search"
              />
            </div>
            {/* Standard tab filter */}
            <div className="flex items-center rounded-md border border-border/60 overflow-hidden shrink-0">
              {(["all", "ISO 14001", "ISO 45001"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setStarterLibStandard(v)}
                  data-testid={`tab-starter-standard-${v.replace(/\s/g, "-")}`}
                  className={`px-2 py-1 text-[10px] font-semibold transition-colors ${
                    starterLibStandard === v
                      ? v === "ISO 45001"
                        ? "bg-orange-500 text-white"
                        : v === "ISO 14001"
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {v === "all" ? "All" : v}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {selectedStarters.size} new · {existingObligationNames.size > 0 ? `${allStarters.filter(item => existingObligationNames.has(item.requirementName)).length} already imported` : ""}
            </span>
          </div>
          </div>{/* end fixed header wrapper */}

          <div className="flex-1 overflow-y-auto min-h-0">
            {groupsWithOffsets.map(group => {
              // Enrich each item with its absolute index
              // Apply standard tab filter — skip whole group if it doesn't match
              if (starterLibStandard !== "all" && group.standard !== starterLibStandard) return null;
              const enriched = group.items.map((item, i) => ({ item, idx: String(group.offset + i) }));
              // Apply search filter
              const q = starterSearch.trim().toLowerCase();
              const filtered = q
                ? enriched.filter(({ item }) =>
                    item.requirementName.toLowerCase().includes(q) ||
                    item.aspectCategory.toLowerCase().includes(q) ||
                    (item.citationSource ?? "").toLowerCase().includes(q) ||
                    (item.descriptionOfRequirement ?? "").toLowerCase().includes(q)
                  )
                : enriched;
              if (filtered.length === 0) return null;

              // Group by aspectCategory preserving insertion order
              const byCategory = filtered.reduce<Record<string, typeof filtered>>((acc, entry) => {
                const cat = entry.item.aspectCategory;
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(entry);
                return acc;
              }, {});

              return (
                <div key={group.label} className="mb-5">
                  {/* Jurisdiction header */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-2 border-b border-border/60 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground">
                      {group.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{filtered.length} requirement{filtered.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Categories within this jurisdiction */}
                  {Object.entries(byCategory).map(([category, entries]) => {
                    const allCatSelected = entries.every(e => selectedStarters.has(e.idx));
                    const someCatSelected = entries.some(e => selectedStarters.has(e.idx));
                    return (
                      <div key={category} className="mb-1">
                        {/* Category sub-header with select-all */}
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/40 border-y border-border/20">
                          <input
                            type="checkbox"
                            checked={allCatSelected}
                            ref={el => { if (el) el.indeterminate = someCatSelected && !allCatSelected; }}
                            onChange={() => {
                              setSelectedStarters(prev => {
                                const n = new Set(prev);
                                if (allCatSelected) {
                                  entries.forEach(e => n.delete(e.idx));
                                } else {
                                  entries.forEach(e => n.add(e.idx));
                                }
                                return n;
                              });
                            }}
                            className="accent-accent"
                            data-testid={`checkbox-cat-${category.replace(/\s+/g, "-")}`}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{category}</span>
                          <span className="text-[10px] text-muted-foreground/60 ml-auto">{entries.length} item{entries.length !== 1 ? "s" : ""}</span>
                        </div>

                        {/* Individual items */}
                        {entries.map(({ item, idx }) => {
                          const checked = selectedStarters.has(idx);
                          const alreadyImported = existingObligationNames.has(item.requirementName);
                          return (
                            <label
                              key={idx}
                              className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/10 last:border-0 ${
                                alreadyImported
                                  ? "opacity-50 bg-muted/20"
                                  : checked ? "bg-accent/5" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={alreadyImported}
                                onChange={() => {
                                  if (alreadyImported) return;
                                  setSelectedStarters(prev => {
                                    const n = new Set(prev);
                                    n.has(idx) ? n.delete(idx) : n.add(idx);
                                    return n;
                                  });
                                }}
                                className="mt-0.5 accent-accent shrink-0"
                                data-testid={`checkbox-starter-${idx}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-semibold text-primary leading-tight">{item.requirementName}</span>
                                  {alreadyImported && (
                                    <Badge className="text-[9px] px-1.5 py-0 h-4 border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40">
                                      ✓ In Register
                                    </Badge>
                                  )}
                                  {!alreadyImported && jurisdictionBadge(item.jurisdictionLevel)}
                                  {!alreadyImported && item.permitRequired && (
                                    <Badge className="text-[9px] px-1 py-0 h-4 border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300">Permit</Badge>
                                  )}
                                </div>
                                {item.citationSource && <p className="text-[10px] font-mono text-accent/70 mt-0.5">{item.citationSource}</p>}
                                {!alreadyImported && item.descriptionOfRequirement && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{item.descriptionOfRequirement}</p>
                                )}
                              </div>
                              {/* 6.1.3 applicability screen button — stop propagation so checkbox isn't toggled */}
                              {!alreadyImported && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setApplicabilityItem({
                                      requirementName: item.requirementName,
                                      aspectCategory: item.aspectCategory,
                                      citationSource: item.citationSource,
                                      descriptionOfRequirement: item.descriptionOfRequirement,
                                    });
                                  }}
                                  className="shrink-0 flex items-center gap-1 px-2 py-1 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors"
                                  title="6.1.3 Applicability Screen — Does this requirement apply to your facility?"
                                  data-testid={`button-screen-${idx}`}
                                >
                                  <Scale className="w-3 h-3" />
                                  <span className="text-[9px] font-semibold">6.1.3</span>
                                </button>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>{/* end scrollable list */}

          <div className="flex gap-2 justify-end px-6 py-4 border-t border-border/40 shrink-0">
            <div className="flex-1 text-xs text-muted-foreground flex items-center">
              {selectedStarters.size === 0
                ? "Select requirements to add to your register"
                : `${selectedStarters.size} new requirement${selectedStarters.size !== 1 ? "s" : ""} will be added`}
            </div>
            <Button variant="outline" onClick={() => setStarterDialog(false)}>Cancel</Button>
            <Button
              onClick={loadSelectedStarters}
              disabled={selectedStarters.size === 0 || bulkCreateMut.isPending}
              className="bg-accent hover:bg-accent/90 text-white gap-1.5"
              data-testid="button-load-selected-starters"
            >
              <Download className="w-3.5 h-3.5" />
              {bulkCreateMut.isPending ? "Adding…" : `Add ${selectedStarters.size} to Register`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MD Tab Content Blocks (ISO 13485) ──────────────────── */}
      {activeTab === "md_evidence" && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EvidenceRepositoryTab isoProjectId={isoProjectId} />
        </div>
      )}

      {/* ── Ask Corey — Identify Requirements by Jurisdiction ─── */}
      <Dialog open={coreyDialog} onOpenChange={open => {
        if (!open && coreyAbortRef.current) coreyAbortRef.current.abort();
        setCoreyDialog(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-primary">Ask Corey — Identify My Compliance Requirements</h2>
                <p className="text-[11px] text-muted-foreground">Corey will analyze your facility's jurisdiction and industry to identify applicable Federal, State, and Local environmental and H&S legal requirements for your ISO 14001 6.1.3 register.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 divide-x divide-border/50">
            {/* ── Left: Input Form ── */}
            <div className="w-72 shrink-0 flex flex-col p-4 gap-3 overflow-y-auto bg-muted/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Facility Location</p>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-accent" /> State <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={coreyForm.state}
                  onChange={e => setCoreyForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. Michigan, Ohio, Texas"
                  className="h-8 text-xs"
                  data-testid="input-corey-state"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">County / Parish</Label>
                <Input
                  value={coreyForm.county}
                  onChange={e => setCoreyForm(f => ({ ...f, county: e.target.value }))}
                  placeholder="e.g. Wayne, Butler, Harris"
                  className="h-8 text-xs"
                  data-testid="input-corey-county"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">City / Municipality</Label>
                <Input
                  value={coreyForm.city}
                  onChange={e => setCoreyForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Detroit, Hamilton, Houston"
                  className="h-8 text-xs"
                  data-testid="input-corey-city"
                />
              </div>

              <div className="border-t border-border/40 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Facility Profile</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Industry Type</Label>
                <Input
                  value={coreyForm.industry}
                  onChange={e => setCoreyForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder="e.g. Automotive Tier 1, Metal Stamping"
                  className="h-8 text-xs"
                  data-testid="input-corey-industry"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">NAICS / SIC Code</Label>
                <Input
                  value={coreyForm.naicsCode}
                  onChange={e => setCoreyForm(f => ({ ...f, naicsCode: e.target.value }))}
                  placeholder="e.g. NAICS 336370 / SIC 3714"
                  className="h-8 text-xs"
                  data-testid="input-corey-naics"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Primary Processes / Operations</Label>
                <Textarea
                  value={coreyForm.processes}
                  onChange={e => setCoreyForm(f => ({ ...f, processes: e.target.value }))}
                  placeholder="e.g. Welding, painting, metal forming, heat treat, parts washing, diesel generators"
                  className="text-xs min-h-[72px] resize-none"
                  data-testid="input-corey-processes"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Facility Size</Label>
                <Input
                  value={coreyForm.facilitySize}
                  onChange={e => setCoreyForm(f => ({ ...f, facilitySize: e.target.value }))}
                  placeholder="e.g. 120,000 sq ft, 350 employees"
                  className="h-8 text-xs"
                  data-testid="input-corey-size"
                />
              </div>

              <Button
                onClick={askCorey}
                disabled={coreyStreaming || !coreyForm.state.trim()}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-1.5 mt-1"
                data-testid="button-corey-analyze"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {coreyStreaming ? "Corey is analyzing…" : coreyResponse ? "Re-Analyze" : "Identify My Requirements"}
              </Button>

              {coreyStreaming && (
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => coreyAbortRef.current?.abort()}>
                  Stop
                </Button>
              )}
            </div>

            {/* ── Right: Streaming Response ── */}
            <div className="flex-1 min-w-0 flex flex-col">
              {!coreyResponse && !coreyStreaming && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary mb-1">Tell Corey where your facility is located</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                      Enter your state (required), county, city, industry type, and key processes — then click <strong>Identify My Requirements</strong>. Corey will generate a categorized analysis of Federal, State, and Local environmental and health &amp; safety obligations for your specific jurisdiction.
                    </p>
                  </div>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 text-left max-w-xs">
                    <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Why local requirements matter</p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">County stormwater programs, city pretreatment permits, local air quality rules, and fire codes vary dramatically by jurisdiction — they can't be pre-loaded as fixed starters.</p>
                  </div>
                </div>
              )}

              {(coreyResponse || coreyStreaming) && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div
                    ref={coreyScrollRef}
                    className="flex-1 overflow-y-auto p-5 font-[system-ui,sans-serif] text-[13px] leading-relaxed text-foreground"
                  >
                    {/* Render markdown-like content with simple formatting */}
                    {coreyResponse.split("\n").map((line, i) => {
                      if (line.startsWith("## ")) {
                        return <h3 key={i} className="text-sm font-black text-primary mt-5 mb-2 first:mt-0 flex items-center gap-1.5">{line.slice(3)}</h3>;
                      }
                      if (line.startsWith("### ")) {
                        return <h4 key={i} className="text-xs font-bold text-foreground/80 mt-3 mb-1">{line.slice(4)}</h4>;
                      }
                      if (line.startsWith("- ") || line.startsWith("* ")) {
                        return <p key={i} className="ml-4 text-[12px] text-foreground/80 mb-0.5 flex gap-1.5"><span className="text-accent shrink-0 mt-px">•</span><span>{line.slice(2)}</span></p>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <p key={i} className="ml-4 text-[12px] text-foreground/80 mb-0.5">{line}</p>;
                      }
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return <p key={i} className="text-[12px] font-semibold text-primary mt-2 mb-0.5">{line.slice(2, -2)}</p>;
                      }
                      if (line === "") return <div key={i} className="h-1" />;
                      return <p key={i} className="text-[12px] text-foreground/80 mb-0.5">{line}</p>;
                    })}
                    {coreyStreaming && (
                      <span className="inline-block w-2 h-3.5 bg-violet-500 animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>

                  {/* Disclaimer footer */}
                  <div className="shrink-0 border-t border-border/40 px-5 py-2.5 bg-slate-50 dark:bg-slate-900/30">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <strong>Important:</strong> Corey provides general compliance guidance based on commonly applicable regulations. Applicable requirements are facility-specific and depend on actual processes, quantities, and activities. <strong>Final determination must be made by a licensed environmental consultant or attorney</strong> familiar with your specific facility and current local regulations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border/40 flex justify-between items-center shrink-0">
            <p className="text-[10px] text-muted-foreground italic">After review, use <strong>+ Add Requirement</strong> to manually add identified local/specific requirements to your register.</p>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setCoreyDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 6.1.3 Applicability Screener ──────────────────────────────────── */}
      {applicabilityItem && (
        <ComplianceApplicabilityDialog
          open={!!applicabilityItem}
          onOpenChange={v => { if (!v) setApplicabilityItem(null); }}
          item={applicabilityItem}
        />
      )}

      {/* ── 9.1.2 Compliance Evaluation Wizard ────────────────────────────── */}
      {evalWizardObligation && (
        <ComplianceEvaluationWizard
          open={!!evalWizardObligation}
          onOpenChange={v => { if (!v) setEvalWizardObligation(null); }}
          obligation={evalWizardObligation}
          onAccept={async ({ suggestedStatus, findingsText, updateStatus, createEvaluation }) => {
            if (updateStatus) {
              await updateObligationMut.mutateAsync({
                id: evalWizardObligation.id,
                data: { complianceStatus: suggestedStatus },
              });
            }
            if (createEvaluation) {
              openAddEvaluation(evalWizardObligation.id, findingsText);
              setActiveTab("evaluation");
            }
            setEvalWizardObligation(null);
          }}
        />
      )}
    </div>
  );
}
