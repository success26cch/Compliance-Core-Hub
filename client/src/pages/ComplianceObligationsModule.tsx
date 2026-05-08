import { useState, useMemo } from "react";
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
  Download, Upload, Filter, Search, ClipboardCheck,
} from "lucide-react";
import type { IsoComplianceObligation, IsoComplianceEvaluation } from "@shared/schema";

/* ─── Constants ─────────────────────────────────────────── */
const ASPECT_CATEGORIES = [
  "Material Use/Exposure",
  "Solid & Liquid Waste",
  "Air Emissions",
  "Water (Surface & Groundwater)",
  "Energy",
  "Land/Soil Contamination",
  "Noise/Vibration",
  "Hazardous Materials Transport",
  "Stormwater",
  "Chemical Reporting",
  "Emergency Planning",
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
    aspectCategory: "Air Emissions",
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
    aspectCategory: "Air Emissions",
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
    aspectCategory: "Air Emissions",
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
    aspectCategory: "Air Emissions",
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
    aspectCategory: "Air Emissions",
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
    aspectCategory: "Wastewater",
    requirementName: "NPDES — Industrial Process/Contact Wastewater Discharge Permit",
    citationSource: "40 CFR Part 122; Clean Water Act §402",
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
    aspectCategory: "Wastewater",
    requirementName: "Industrial Pretreatment Program — POTW/Sewer Discharge",
    citationSource: "40 CFR Part 403; Clean Water Act §307(b)",
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
    aspectCategory: "Stormwater",
    requirementName: "Oil Spill Prevention, Control & Countermeasure (SPCC) Plan",
    citationSource: "40 CFR Part 112; Clean Water Act §311",
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
    aspectCategory: "Stormwater",
    requirementName: "Clean Water Act §404 — Wetlands Dredge & Fill Permit",
    citationSource: "40 CFR Parts 230–233; CWA §404",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Activities involving the discharge of dredged or fill material into waters of the United States, including wetlands, require a §404 permit from the U.S. Army Corps of Engineers and/or state §401 water quality certification. Nationwide Permits (NWPs) cover minor/routine activities; Individual Permits required for larger impacts.",
    facilityAction: "Before any construction, grading, or fill activity near streams, wetlands, or drainage features, conduct jurisdictional wetlands delineation. If §404 activity is proposed, consult with U.S. Army Corps of Engineers for NWP or Individual Permit.",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Per project",
    recordsToMaintain: "Wetlands delineation report, §404 permit or NWP verification, §401 water quality certification, mitigation records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Applicable if any construction or fill activity near wetlands, streams, or drainage ditches is planned. Consult before any ground disturbance near water features.",
  },
  // ── Petroleum / UST ─────────────────────────────────────────────────────
  {
    aspectCategory: "Material Use/Exposure",
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
    citationSource: "40 CFR Part 68; CAA §112(r)",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities that hold regulated toxic or flammable substances above threshold quantities must develop and submit a Risk Management Plan (RMP) to EPA. RMP includes hazard assessment (worst-case/alternate release scenarios), prevention program, and emergency response program. Applies to common substances: ammonia (>10,000 lbs), chlorine (>2,500 lbs), propane (>10,000 lbs), hydrogen fluoride (>1,000 lbs), and others.",
    facilityAction: "Review chemical inventory for RMP-regulated substances. If any substance is present above the applicable threshold quantity, develop an RMP (Program 1, 2, or 3 as applicable). Submit RMP to EPA's RMP*eSubmit system. Resubmit every 5 years and within 6 months of process changes.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "5-year resubmission; update within 6 months of process changes",
    recordsToMaintain: "RMP document, EPA submission confirmation, process hazard analyses (PHA/HAZOP), incident investigation reports",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Common RMP triggers in manufacturing: anhydrous ammonia (refrigeration, heat treat), chlorine (water treatment), flammable gases. Review regulated substance list at 40 CFR §68.130.",
  },
  {
    aspectCategory: "Emergency Planning",
    requirementName: "EPCRA §304 — Emergency Release Notification",
    citationSource: "40 CFR Part 355; EPCRA §304",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities must immediately notify the SERC and LEPC if there is a release of a CERCLA hazardous substance or an Extremely Hazardous Substance (EHS) that equals or exceeds the reportable quantity (RQ) and goes off-site. Notification must include substance name, estimated quantity, time/duration, location, known health risks, and actions taken.",
    facilityAction: "Establish emergency release notification procedure. Maintain contact list for SERC, LEPC, and local emergency responders. If any release equals or exceeds RQ and goes off-site, notify SERC and LEPC immediately by telephone, followed by written follow-up within 7 days.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "As needed (triggered by qualifying release)",
    recordsToMaintain: "Release notification records, SERC/LEPC contact list, written follow-up reports, incident investigation records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Distinct from EPCRA §302 planning requirement. §304 notification is an immediate action required upon an actual release — not a planning submission.",
  },
  {
    aspectCategory: "Chemical Reporting",
    requirementName: "EPCRA §311 — MSDS / Chemical List Submission",
    citationSource: "40 CFR Part 370; EPCRA §311",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities required to maintain SDSs (MSDSs) under OSHA HazCom must submit copies of SDSs (or a list of covered chemicals) to the SERC, LEPC, and local fire department. One-time submission required; updates needed within 3 months when new covered chemicals are added.",
    facilityAction: "Submit SDS or chemical list to SERC, LEPC, and local fire department for all hazardous chemicals required to have an SDS under OSHA HazCom. Update submissions within 3 months when new chemicals meeting SDS requirements are brought to the facility.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "One-time + update when new chemicals added",
    recordsToMaintain: "§311 submission records, SERC/LEPC/fire department acknowledgements, chemical list updates",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Companion requirement to Tier II (§312). §311 is a one-time submission of SDS or list; Tier II is the annual quantity/inventory report.",
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
    citationSource: "40 CFR Part 711; TSCA §8(a)",
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
    citationSource: "40 CFR Part 745; TSCA §402/406",
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
    aspectCategory: "Air Emissions",
    requirementName: "Greenhouse Gas (GHG) Mandatory Reporting Rule",
    citationSource: "40 CFR Part 98; CAA §114",
    jurisdictionLevel: "F",
    state: null, county: null,
    descriptionOfRequirement: "Facilities that emit ≥25,000 metric tons of CO2 equivalent (CO2e) per year from covered source categories must report GHG emissions to EPA annually. Covered sources include stationary fuel combustion, industrial processes, and fugitive emissions. Report submitted via EPA's e-GGRT system by March 31 for the prior calendar year.",
    facilityAction: "Calculate annual GHG emissions from all stationary combustion sources (boilers, furnaces, generators) and applicable industrial processes. If total ≥25,000 MT CO2e, register with EPA e-GGRT and submit annual report by March 31. Retain supporting calculations for 3 years.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Annual (by March 31)",
    recordsToMaintain: "GHG calculation methodology, emissions monitoring data, e-GGRT annual report submissions, fuel purchase/consumption records",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Threshold: ≥25,000 MT CO2e/year. Even facilities below threshold may want to track GHG emissions voluntarily for ESG reporting. Common sources: natural gas combustion, process emissions, refrigerant leaks.",
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
    aspectCategory: "Air Emissions",
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
    aspectCategory: "Stormwater",
    requirementName: "Michigan SPCC / Aboveground Petroleum Storage — Part 5 Rules",
    citationSource: "MI NREPA Part 5 (Act 451); MI Rule R 324.2001 et seq.",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Part 5 rules (Water Resources Protection) require facilities storing petroleum or other regulated substances to prevent spills and discharges to the waters of the state. Michigan may impose requirements beyond the federal SPCC rule, including secondary containment for petroleum storage and notification to EGLE for spills.",
    facilityAction: "Ensure all petroleum storage containers have adequate secondary containment per Michigan Part 5 rules. Report any petroleum spill to EGLE's Emergency Management & Homeland Security Division (EMHSD) at 800-292-4706 if it reaches or threatens waters of the state. Maintain spill response materials and response plan.",
    complianceStatus: "compliant",
    permitRequired: false, permitRenewalFrequency: "Ongoing",
    recordsToMaintain: "Secondary containment inspection logs, spill notification records, petroleum storage inventory",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan's spill notification threshold is any quantity that reaches waters of the state. EGLE hotline: 800-292-4706 (24-hour). More stringent than federal RQ thresholds in some cases.",
  },
  {
    aspectCategory: "Material Use/Exposure",
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
    aspectCategory: "Wastewater",
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
    aspectCategory: "Material Use/Exposure",
    requirementName: "Michigan Wetlands — Part 303 Permit",
    citationSource: "MI NREPA Part 303, Act 451 (1994)",
    jurisdictionLevel: "S",
    state: "Michigan", county: null,
    descriptionOfRequirement: "Michigan Part 303 regulates activities in wetlands (fill, dredge, drainage alteration). Activities affecting wetlands regulated by Michigan (including isolated wetlands <5 acres, which are not covered by federal §404) require a permit from EGLE. Michigan's wetland protections are more extensive than the federal program.",
    facilityAction: "Before any construction, expansion, or grading near wetlands or low-lying areas on or adjacent to the facility, consult EGLE and a certified wetlands consultant to determine if a Part 303 permit is required. Apply for permit well in advance (up to 90-day review period).",
    complianceStatus: "compliant",
    permitRequired: true, permitRenewalFrequency: "Per project",
    recordsToMaintain: "Wetland delineation report, Part 303 permit, mitigation records, EGLE correspondence",
    responsiblePerson: null, dateLastReviewed: null, nextReviewDate: null, actionRequired: null, notes: "Michigan protects all wetlands ≥5 acres and wetlands <5 acres contiguous to lakes/streams, or if regulated by local ordinance. Consult EGLE early for any development near wetlands.",
  },
  {
    aspectCategory: "Material Use/Exposure",
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
];

const OHIO_STARTER: Omit<IsoComplianceObligation, "id" | "userId" | "isoProjectId" | "createdAt" | "updatedAt">[] = [
  {
    aspectCategory: "Air Emissions",
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
    aspectCategory: "Wastewater",
    requirementName: "Ohio NPDES Industrial Process Wastewater Permit",
    citationSource: "Ohio Revised Code §6111; Ohio Admin. Code 3745-33; Ohio EPA NPDES",
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
    aspectCategory: "Material Use/Exposure",
    requirementName: "Ohio Underground Storage Tank (UST) Program",
    citationSource: "Ohio Revised Code §3737.87; Ohio Admin. Code 1301:7-9; Ohio State Fire Marshal",
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
    aspectCategory: "Stormwater",
    requirementName: "Ohio SPCC / Aboveground Petroleum Storage Tank Rules",
    citationSource: "Ohio Revised Code §1509.22; Ohio Admin. Code 1301:7-7 (SFMO); Ohio EPA",
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
    citationSource: "Ohio Revised Code §3734; Ohio Admin. Code 3745-50 through 3745-69; Ohio EPA",
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
export default function ComplianceObligationsModule({ isoProjectId }: { isoProjectId?: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"register" | "evaluation">("register");

  // Register filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
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
      toast({ title: `${Array.isArray(data) ? data.length : "0"} requirements added to your register` });
    },
    onError: () => toast({ title: "Error", description: "Could not load starter library", variant: "destructive" }),
  });

  // Filtered obligations
  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
      if (filterCategory !== "all" && o.aspectCategory !== filterCategory) return false;
      if (filterJurisdiction !== "all" && o.jurisdictionLevel !== filterJurisdiction) return false;
      if (filterStatus !== "all" && o.complianceStatus !== filterStatus) return false;
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
  }, [obligations, filterCategory, filterJurisdiction, filterStatus, searchText]);

  // Summary counts
  const counts = useMemo(() => ({
    total: obligations.length,
    compliant: obligations.filter(o => o.complianceStatus === "compliant").length,
    nonCompliant: obligations.filter(o => o.complianceStatus === "non_compliant").length,
    underReview: obligations.filter(o => o.complianceStatus === "under_review").length,
  }), [obligations]);

  // All starter items merged
  const allStarters = [...FEDERAL_STARTER_LIBRARY, ...MICHIGAN_STARTER, ...OHIO_STARTER];

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

  function openAddEvaluation(obligationId?: number) {
    setEditEvaluation(null);
    setEvaluationForm(emptyEvaluation(obligationId));
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
      <div className="border-b border-border/60 bg-white dark:bg-card px-6 py-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Shield className="w-5 h-5 text-accent" />
              <h1 className="text-lg font-black text-primary">Compliance Obligations Register</h1>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] font-bold">ISO 14001 §6.1.3 + §9.1.2</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Legal and other requirements — Federal, State, and Local obligations applicable to your organization's environmental aspects.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setStarterDialog(true)} data-testid="button-load-starter-library">
              <Upload className="w-3.5 h-3.5" /> Load Starter Library
            </Button>
            <Button size="sm" className="gap-1.5 text-xs bg-accent hover:bg-accent/90 text-white" onClick={openAddObligation} data-testid="button-add-compliance-obligation">
              <Plus className="w-3.5 h-3.5" /> Add Requirement
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
            <div key={s.label} className="bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-center min-w-[72px]">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60 bg-white dark:bg-card px-6 shrink-0">
        <div className="flex gap-0">
          {[
            { key: "register", label: "Obligations Register", icon: FileText },
            { key: "evaluation", label: "Evaluation Log", icon: ClipboardCheck },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              data-testid={`tab-compliance-${key}`}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Register Tab */}
      {activeTab === "register" && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-3 border-b border-border/40 bg-muted/20 shrink-0 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search requirements..."
                className="h-8 pl-8 text-xs"
                data-testid="input-compliance-search"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 text-xs w-[180px]" data-testid="select-filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ASPECT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterJurisdiction} onValueChange={setFilterJurisdiction}>
              <SelectTrigger className="h-8 text-xs w-[150px]" data-testid="select-filter-jurisdiction">
                <SelectValue placeholder="All Jurisdictions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {JURISDICTION_OPTIONS.map(j => <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-[140px]" data-testid="select-filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">{filteredObligations.length} of {obligations.length}</span>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground text-sm">Loading register…</div>
            ) : filteredObligations.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground mb-1">No requirements found</p>
                <p className="text-xs text-muted-foreground mb-4">Add requirements manually or load the starter library to populate your register.</p>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setStarterDialog(true)}>
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
                      <div className="px-6 py-3 flex items-start gap-3">
                        <button
                          className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                          onClick={() => toggleRow(o.id)}
                          data-testid={`button-expand-row-${o.id}`}
                        >
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-primary leading-tight">{o.requirementName}</span>
                            {jurisdictionBadge(o.jurisdictionLevel)}
                            {statusBadge(o.complianceStatus)}
                            {o.permitRequired && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 text-[10px] px-1.5 py-0 font-semibold border">
                                Permit Req.
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-[11px] text-muted-foreground">{o.aspectCategory}</span>
                            {o.citationSource && (
                              <span className="text-[11px] font-mono text-accent/80">{o.citationSource}</span>
                            )}
                            {o.state && (
                              <span className="text-[11px] text-muted-foreground">State: {o.state}{o.county ? ` — ${o.county} Co.` : ""}</span>
                            )}
                            {o.responsiblePerson && (
                              <span className="text-[11px] text-muted-foreground">Owner: {o.responsiblePerson}</span>
                            )}
                            {o.dateLastReviewed && (
                              <span className="text-[11px] text-muted-foreground">Last reviewed: {o.dateLastReviewed}</span>
                            )}
                          </div>
                          {o.actionRequired && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{o.actionRequired}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { openAddEvaluation(o.id); setActiveTab("evaluation"); }}
                            className="text-xs text-muted-foreground hover:text-accent px-2 py-1 rounded hover:bg-accent/10 transition-colors"
                            title="Log evaluation"
                            data-testid={`button-log-eval-${o.id}`}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditObligation(o)}
                            className="text-muted-foreground hover:text-primary p-1.5 rounded hover:bg-muted transition-colors"
                            title="Edit"
                            data-testid={`button-edit-obligation-${o.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
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
                        <div className="px-6 pb-4 bg-muted/10 border-t border-border/30">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pt-3">
                            {o.descriptionOfRequirement && (
                              <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Description of Requirement</p>
                                <p className="text-xs text-primary leading-relaxed">{o.descriptionOfRequirement}</p>
                              </div>
                            )}
                            {o.facilityAction && (
                              <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Facility Action</p>
                                <p className="text-xs text-primary leading-relaxed">{o.facilityAction}</p>
                              </div>
                            )}
                            {o.recordsToMaintain && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Records to Maintain</p>
                                <p className="text-xs text-primary">{o.recordsToMaintain}</p>
                              </div>
                            )}
                            {o.permitRequired && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Permit</p>
                                <p className="text-xs text-primary">Required — {o.permitRenewalFrequency ?? "Review frequency not set"}</p>
                              </div>
                            )}
                            {o.nextReviewDate && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Next Review Date</p>
                                <p className="text-xs text-primary">{o.nextReviewDate}</p>
                              </div>
                            )}
                            {o.notes && (
                              <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Notes</p>
                                <p className="text-xs text-muted-foreground italic">{o.notes}</p>
                              </div>
                            )}
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
                <p className="text-sm font-semibold text-muted-foreground mb-1">No evaluations logged</p>
                <p className="text-xs text-muted-foreground mb-4">ISO 14001 §9.1.2 requires periodic compliance evaluation records. Log an evaluation to start your audit trail.</p>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openAddEvaluation()}>
                  <Plus className="w-3.5 h-3.5" /> Log First Evaluation
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {evaluations.map(ev => (
                  <div key={ev.id} className="px-6 py-4 hover:bg-muted/20 transition-colors" data-testid={`row-evaluation-${ev.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-primary truncate">{obligationName(ev.complianceObligationId)}</span>
                          {evalStatusBadge(ev.complianceStatus)}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-2">
                          <span>Evaluated: {ev.evaluationDate}</span>
                          {ev.evaluatedBy && <span>By: {ev.evaluatedBy}</span>}
                          {ev.dueDate && <span className="text-amber-600 dark:text-amber-400">Due: {ev.dueDate}</span>}
                          {ev.closedDate && <span className="text-emerald-600 dark:text-emerald-400">Closed: {ev.closedDate}</span>}
                        </div>
                        {ev.findings && (
                          <div className="mb-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Findings</p>
                            <p className="text-xs text-primary">{ev.findings}</p>
                          </div>
                        )}
                        {ev.evidenceDescription && (
                          <div className="mb-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Evidence</p>
                            <p className="text-xs text-primary">{ev.evidenceDescription}</p>
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
      <Dialog open={starterDialog} onOpenChange={setStarterDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" /> Load Starter Library
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Select the requirements applicable to your organization. Federal requirements are universally applicable; state/local entries are pre-loaded for Michigan and Ohio. You can edit any entry after importing.
            </p>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2 border-b border-border/40 shrink-0">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedStarters(new Set(allStarters.map((_, i) => String(i))))}>
              Select All
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedStarters(new Set())}>
              Deselect All
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">{selectedStarters.size} selected</span>
          </div>
          <ScrollArea className="flex-1">
            {[
              { label: "Federal Requirements", items: FEDERAL_STARTER_LIBRARY, offset: 0 },
              { label: "Michigan State Requirements", items: MICHIGAN_STARTER, offset: FEDERAL_STARTER_LIBRARY.length },
              { label: "Ohio State Requirements", items: OHIO_STARTER, offset: FEDERAL_STARTER_LIBRARY.length + MICHIGAN_STARTER.length },
            ].map(group => (
              <div key={group.label} className="mb-4">
                <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40">
                  {group.label}
                </div>
                {group.items.map((item, i) => {
                  const idx = String(group.offset + i);
                  const checked = selectedStarters.has(idx);
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${checked ? "bg-accent/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setSelectedStarters(prev => {
                          const n = new Set(prev);
                          n.has(idx) ? n.delete(idx) : n.add(idx);
                          return n;
                        })}
                        className="mt-0.5 accent-accent"
                        data-testid={`checkbox-starter-${idx}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-primary">{item.requirementName}</span>
                          {jurisdictionBadge(item.jurisdictionLevel)}
                          <span className="text-[10px] text-muted-foreground">{item.aspectCategory}</span>
                        </div>
                        {item.citationSource && <p className="text-[10px] font-mono text-accent/70 mt-0.5">{item.citationSource}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}
          </ScrollArea>
          <div className="flex gap-2 justify-end pt-3 border-t border-border/40 shrink-0">
            <Button variant="outline" onClick={() => setStarterDialog(false)}>Cancel</Button>
            <Button
              onClick={loadSelectedStarters}
              disabled={selectedStarters.size === 0 || bulkCreateMut.isPending}
              className="bg-accent hover:bg-accent/90 text-white gap-1.5"
              data-testid="button-load-selected-starters"
            >
              <Download className="w-3.5 h-3.5" />
              {bulkCreateMut.isPending ? "Adding…" : `Add ${selectedStarters.size} Requirements`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
